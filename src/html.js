var ENABLE_EXTRA_SECURITY_HOOKS = true
var global3 = window
var debugLogRenderId = 0
var issueWarning2

var identityFunction = value => value
var noopSanitizer = (_node, _name, _type) => identityFunction
var setSanitizer = newSanitizer => {
  if (!ENABLE_EXTRA_SECURITY_HOOKS) {
    return
  }
  if (sanitizerFactoryInternal !== noopSanitizer) {
    throw new Error(
      `Attempted to overwrite existing lit-html security policy. setSanitizeDOMValueFactory should be called at most once.`
    )
  }
  sanitizerFactoryInternal = newSanitizer
}
var _testOnlyClearSanitizerFactoryDoNotCallOrElse = () => {
  sanitizerFactoryInternal = noopSanitizer
}
var createSanitizer = (node, name, type) => {
  return sanitizerFactoryInternal(node, name, type)
}
var boundAttributeSuffix = '$wc$'
var marker = `wc$${String(Math.random()).slice(9)}$`
var markerMatch = '?' + marker
var nodeMarker = `<${markerMatch}>`
var d = document
var createMarker = (v = '') => d.createComment(v)
var isPrimitive = value =>
  value === null || (typeof value != 'object' && typeof value != 'function')
var isArray = Array.isArray
var isIterable = value =>
  isArray(value) ||
  typeof (value === null || value === void 0
    ? void 0
    : value[Symbol.iterator]) === 'function'
var SPACE_CHAR = `[ 	
\f\r]`
var ATTR_VALUE_CHAR = `[^ 	
\f\r"'\`<>=]`
var NAME_CHAR = `[^\\s"'>=/]`
var textEndRegex = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g
var COMMENT_START = 1
var TAG_NAME = 2
var DYNAMIC_TAG_NAME = 3
var commentEndRegex = /-->/g
var comment2EndRegex = />/g
var tagEndRegex = new RegExp(
  `>|${SPACE_CHAR}(?:(${NAME_CHAR}+)(${SPACE_CHAR}*=${SPACE_CHAR}*(?:${ATTR_VALUE_CHAR}|("|')|))|$)`,
  'g'
)
var ENTIRE_MATCH = 0
var ATTRIBUTE_NAME = 1
var SPACES_AND_EQUALS = 2
var QUOTE_CHAR = 3
var singleQuoteAttrEndRegex = /'/g
var doubleQuoteAttrEndRegex = /"/g
var rawTextElement = /^(?:script|style|textarea|title)$/i
var HTML_RESULT = 1
var SVG_RESULT = 2
var ATTRIBUTE_PART = 1
var CHILD_PART = 2
var PROPERTY_PART = 3
var BOOLEAN_ATTRIBUTE_PART = 4
var EVENT_PART = 5
var ELEMENT_PART = 6
var COMMENT_PART = 7
var tag =
  type =>
  (strings, ...values) => {
    return {
      __dom_type__: type,
      strings,
      values
    }
  }
export const html = tag(HTML_RESULT)
export const svg = tag(SVG_RESULT)
var noChange = Symbol.for('wc-noChange')
var nothing = Symbol.for('wc-nothing')
var templateCache = /* @__PURE__ */ new WeakMap()
var walker = d.createTreeWalker(d, 129, null, false)
var sanitizerFactoryInternal = noopSanitizer
var getTemplateHtml = (strings, type) => {
  const l = strings.length - 1
  const attrNames = []
  let html2 = type === SVG_RESULT ? '<svg>' : ''
  let rawTextEndRegex
  let regex = textEndRegex
  for (let i = 0; i < l; i++) {
    const s = strings[i]
    let attrNameEndIndex = -1
    let attrName
    let lastIndex = 0
    let match
    while (lastIndex < s.length) {
      regex.lastIndex = lastIndex
      match = regex.exec(s)
      if (match === null) {
        break
      }
      lastIndex = regex.lastIndex
      if (regex === textEndRegex) {
        if (match[COMMENT_START] === '!--') {
          regex = commentEndRegex
        } else if (match[COMMENT_START] !== void 0) {
          regex = comment2EndRegex
        } else if (match[TAG_NAME] !== void 0) {
          if (rawTextElement.test(match[TAG_NAME])) {
            rawTextEndRegex = new RegExp(`</${match[TAG_NAME]}`, 'g')
          }
          regex = tagEndRegex
        } else if (match[DYNAMIC_TAG_NAME] !== void 0) {
          regex = tagEndRegex
        }
      } else if (regex === tagEndRegex) {
        if (match[ENTIRE_MATCH] === '>') {
          regex =
            rawTextEndRegex !== null && rawTextEndRegex !== void 0
              ? rawTextEndRegex
              : textEndRegex
          attrNameEndIndex = -1
        } else if (match[ATTRIBUTE_NAME] === void 0) {
          attrNameEndIndex = -2
        } else {
          attrNameEndIndex = regex.lastIndex - match[SPACES_AND_EQUALS].length
          attrName = match[ATTRIBUTE_NAME]
          regex =
            match[QUOTE_CHAR] === void 0
              ? tagEndRegex
              : match[QUOTE_CHAR] === '"'
              ? doubleQuoteAttrEndRegex
              : singleQuoteAttrEndRegex
        }
      } else if (
        regex === doubleQuoteAttrEndRegex ||
        regex === singleQuoteAttrEndRegex
      ) {
        regex = tagEndRegex
      } else if (regex === commentEndRegex || regex === comment2EndRegex) {
        regex = textEndRegex
      } else {
        regex = tagEndRegex
        rawTextEndRegex = void 0
      }
    }

    const end =
      regex === tagEndRegex && strings[i + 1].startsWith('/>') ? ' ' : ''
    html2 +=
      regex === textEndRegex
        ? s + nodeMarker
        : attrNameEndIndex >= 0
        ? (attrNames.push(attrName),
          s.slice(0, attrNameEndIndex) +
            boundAttributeSuffix +
            s.slice(attrNameEndIndex)) +
          marker +
          end
        : s +
          marker +
          (attrNameEndIndex === -2 ? (attrNames.push(void 0), i) : end)
  }
  const htmlResult =
    html2 + (strings[l] || '<?>') + (type === SVG_RESULT ? '</svg>' : '')
  if (!Array.isArray(strings) || !strings.hasOwnProperty('raw')) {
    let message = 'invalid template strings array'

    throw new Error(message)
  }
  return [htmlResult, attrNames]
}
class Template {
  constructor({ strings, ['__dom_type__']: type }, options) {
    this.parts = []
    let node
    let nodeIndex = 0
    let attrNameIndex = 0
    const partCount = strings.length - 1
    const parts = this.parts
    const [html2, attrNames] = getTemplateHtml(strings, type)
    this.el = Template.createElement(html2, options)
    walker.currentNode = this.el.content
    if (type === SVG_RESULT) {
      const content = this.el.content
      const svgElement = content.firstChild
      svgElement.remove()
      content.append(...svgElement.childNodes)
    }
    while ((node = walker.nextNode()) !== null && parts.length < partCount) {
      if (node.nodeType === 1) {
        if (node.hasAttributes()) {
          const attrsToRemove = []
          for (const name of node.getAttributeNames()) {
            if (
              name.endsWith(boundAttributeSuffix) ||
              name.startsWith(marker)
            ) {
              const realName = attrNames[attrNameIndex++]
              attrsToRemove.push(name)
              if (realName !== void 0) {
                const value = node.getAttribute(
                  realName.toLowerCase() + boundAttributeSuffix
                )
                const statics = value.split(marker)
                const m = /([.?@])?(.*)/.exec(realName)
                parts.push({
                  type: ATTRIBUTE_PART,
                  index: nodeIndex,
                  name: m[2],
                  strings: statics,
                  ctor:
                    m[1] === '.'
                      ? PropertyPart
                      : m[1] === '?'
                      ? BooleanAttributePart
                      : m[1] === '@'
                      ? EventPart
                      : AttributePart
                })
              } else {
                parts.push({
                  type: ELEMENT_PART,
                  index: nodeIndex
                })
              }
            }
          }
          for (const name of attrsToRemove) {
            node.removeAttribute(name)
          }
        }
        if (rawTextElement.test(node.tagName)) {
          const strings2 = node.textContent.split(marker)
          const lastIndex = strings2.length - 1
          if (lastIndex > 0) {
            node.textContent = ''
            for (let i = 0; i < lastIndex; i++) {
              node.append(strings2[i], createMarker())
              walker.nextNode()
              parts.push({ type: CHILD_PART, index: ++nodeIndex })
            }
            node.append(strings2[lastIndex], createMarker())
          }
        }
      } else if (node.nodeType === 8) {
        const data = node.data
        if (data === markerMatch) {
          parts.push({ type: CHILD_PART, index: nodeIndex })
        } else {
          let i = -1
          while ((i = node.data.indexOf(marker, i + 1)) !== -1) {
            parts.push({ type: COMMENT_PART, index: nodeIndex })
            i += marker.length - 1
          }
        }
      }
      nodeIndex++
    }
  }
  static createElement(html2, _options) {
    const el = d.createElement('template')
    el.innerHTML = html2
    return el
  }
}
function resolveDirective(part, value, parent = part, attributeIndex) {
  var _a4, _b4, _c4
  var _d3
  if (value === noChange) {
    return value
  }
  let currentDirective =
    attributeIndex !== void 0
      ? (_a4 = parent.__directives) === null || _a4 === void 0
        ? void 0
        : _a4[attributeIndex]
      : parent.__directive
  const nextDirectiveConstructor = isPrimitive(value)
    ? void 0
    : value['_$litDirective$']
  if (
    (currentDirective === null || currentDirective === void 0
      ? void 0
      : currentDirective.constructor) !== nextDirectiveConstructor
  ) {
    ;(_b4 =
      currentDirective === null || currentDirective === void 0
        ? void 0
        : currentDirective['_$notifyDirectiveConnectionChanged']) === null ||
    _b4 === void 0
      ? void 0
      : _b4.call(currentDirective, false)
    if (nextDirectiveConstructor === void 0) {
      currentDirective = void 0
    } else {
      currentDirective = new nextDirectiveConstructor(part)
      currentDirective._$initialize(part, parent, attributeIndex)
    }
    if (attributeIndex !== void 0) {
      ;((_c4 = (_d3 = parent).__directives) !== null && _c4 !== void 0
        ? _c4
        : (_d3.__directives = []))[attributeIndex] = currentDirective
    } else {
      parent.__directive = currentDirective
    }
  }
  if (currentDirective !== void 0) {
    value = resolveDirective(
      part,
      currentDirective._$resolve(part, value.values),
      currentDirective,
      attributeIndex
    )
  }
  return value
}
class TemplateInstance {
  constructor(template, parent) {
    this._parts = []
    this._$disconnectableChildren = void 0
    this._$template = template
    this._$parent = parent
  }
  get parentNode() {
    return this._$parent.parentNode
  }
  get _$isConnected() {
    return this._$parent._$isConnected
  }
  _clone(options) {
    var _a4
    const {
      el: { content },
      parts
    } = this._$template
    const fragment = (
      (_a4 =
        options === null || options === void 0
          ? void 0
          : options.creationScope) !== null && _a4 !== void 0
        ? _a4
        : d
    ).importNode(content, true)
    walker.currentNode = fragment
    let node = walker.nextNode()
    let nodeIndex = 0
    let partIndex = 0
    let templatePart = parts[0]
    while (templatePart !== void 0) {
      if (nodeIndex === templatePart.index) {
        let part
        if (templatePart.type === CHILD_PART) {
          part = new ChildPart(node, node.nextSibling, this, options)
        } else if (templatePart.type === ATTRIBUTE_PART) {
          part = new templatePart.ctor(
            node,
            templatePart.name,
            templatePart.strings,
            this,
            options
          )
        } else if (templatePart.type === ELEMENT_PART) {
          part = new ElementPart(node, this, options)
        }
        this._parts.push(part)
        templatePart = parts[++partIndex]
      }
      if (
        nodeIndex !==
        (templatePart === null || templatePart === void 0
          ? void 0
          : templatePart.index)
      ) {
        node = walker.nextNode()
        nodeIndex++
      }
    }
    return fragment
  }
  _update(values) {
    let i = 0
    for (const part of this._parts) {
      if (part !== void 0) {
        if (part.strings !== void 0) {
          part._$setValue(values, part, i)
          i += part.strings.length - 2
        } else {
          part._$setValue(values[i])
        }
      }
      i++
    }
  }
}
class ChildPart {
  constructor(startNode, endNode, parent, options) {
    var _a4
    this.type = CHILD_PART
    this._$committedValue = nothing
    this._$disconnectableChildren = void 0
    this._$startNode = startNode
    this._$endNode = endNode
    this._$parent = parent
    this.options = options
    this.__isConnected =
      (_a4 =
        options === null || options === void 0
          ? void 0
          : options.isConnected) !== null && _a4 !== void 0
        ? _a4
        : true
    if (ENABLE_EXTRA_SECURITY_HOOKS) {
      this._textSanitizer = void 0
    }
  }
  get _$isConnected() {
    var _a4, _b4
    return (_b4 =
      (_a4 = this._$parent) === null || _a4 === void 0
        ? void 0
        : _a4._$isConnected) !== null && _b4 !== void 0
      ? _b4
      : this.__isConnected
  }
  get parentNode() {
    let parentNode = this._$startNode.parentNode
    const parent = this._$parent
    if (parent !== void 0 && parentNode.nodeType === 11) {
      parentNode = parent.parentNode
    }
    return parentNode
  }
  get startNode() {
    return this._$startNode
  }
  get endNode() {
    return this._$endNode
  }
  _$setValue(value, directiveParent = this) {
    var _a4

    value = resolveDirective(this, value, directiveParent)
    if (isPrimitive(value)) {
      if (value === nothing || value == null || value === '') {
        if (this._$committedValue !== nothing) {
          this._$clear()
        }
        this._$committedValue = nothing
      } else if (value !== this._$committedValue && value !== noChange) {
        this._commitText(value)
      }
    } else if (value['__dom_type__'] !== void 0) {
      this._commitTemplateResult(value)
    } else if (value.nodeType !== void 0) {
      this._commitNode(value)
    } else if (isIterable(value)) {
      this._commitIterable(value)
    } else {
      this._commitText(value)
    }
  }
  _insert(node, ref = this._$endNode) {
    return this._$startNode.parentNode.insertBefore(node, ref)
  }
  _commitNode(value) {
    var _a4
    if (this._$committedValue !== value) {
      this._$clear()
      if (
        ENABLE_EXTRA_SECURITY_HOOKS &&
        sanitizerFactoryInternal !== noopSanitizer
      ) {
        const parentNodeName =
          (_a4 = this._$startNode.parentNode) === null || _a4 === void 0
            ? void 0
            : _a4.nodeName
        if (parentNodeName === 'STYLE' || parentNodeName === 'SCRIPT') {
          let message = 'Forbidden'

          throw new Error(message)
        }
      }

      this._$committedValue = this._insert(value)
    }
  }
  _commitText(value) {
    if (
      this._$committedValue !== nothing &&
      isPrimitive(this._$committedValue)
    ) {
      const node = this._$startNode.nextSibling
      if (ENABLE_EXTRA_SECURITY_HOOKS) {
        if (this._textSanitizer === void 0) {
          this._textSanitizer = createSanitizer(node, 'data', 'property')
        }
        value = this._textSanitizer(value)
      }

      node.data = value
    } else {
      if (ENABLE_EXTRA_SECURITY_HOOKS) {
        const textNode = document.createTextNode('')
        this._commitNode(textNode)
        if (this._textSanitizer === void 0) {
          this._textSanitizer = createSanitizer(textNode, 'data', 'property')
        }
        value = this._textSanitizer(value)

        textNode.data = value
      } else {
        this._commitNode(d.createTextNode(value))
      }
    }
    this._$committedValue = value
  }
  _commitTemplateResult(result) {
    var _a4
    const { values, ['__dom_type__']: type } = result
    const template =
      typeof type === 'number'
        ? this._$getTemplate(result)
        : (type.el === void 0 &&
            (type.el = Template.createElement(type.h, this.options)),
          type)
    if (
      ((_a4 = this._$committedValue) === null || _a4 === void 0
        ? void 0
        : _a4._$template) === template
    ) {
      this._$committedValue._update(values)
    } else {
      const instance = new TemplateInstance(template, this)
      const fragment = instance._clone(this.options)

      instance._update(values)

      this._commitNode(fragment)
      this._$committedValue = instance
    }
  }
  _$getTemplate(result) {
    let template = templateCache.get(result.strings)
    if (template === void 0) {
      templateCache.set(result.strings, (template = new Template(result)))
    }
    return template
  }
  _commitIterable(value) {
    if (!isArray(this._$committedValue)) {
      this._$committedValue = []
      this._$clear()
    }
    const itemParts = this._$committedValue
    let partIndex = 0
    let itemPart
    for (const item of value) {
      if (partIndex === itemParts.length) {
        itemParts.push(
          (itemPart = new ChildPart(
            this._insert(createMarker()),
            this._insert(createMarker()),
            this,
            this.options
          ))
        )
      } else {
        itemPart = itemParts[partIndex]
      }
      itemPart._$setValue(item)
      partIndex++
    }
    if (partIndex < itemParts.length) {
      this._$clear(itemPart && itemPart._$endNode.nextSibling, partIndex)
      itemParts.length = partIndex
    }
  }
  _$clear(start = this._$startNode.nextSibling, from) {
    var _a4
    ;(_a4 = this._$notifyConnectionChanged) === null || _a4 === void 0
      ? void 0
      : _a4.call(this, false, true, from)
    while (start && start !== this._$endNode) {
      const n = start.nextSibling
      start.remove()
      start = n
    }
  }
  setConnected(isConnected) {
    var _a4
    if (this._$parent === void 0) {
      this.__isConnected = isConnected
      ;(_a4 = this._$notifyConnectionChanged) === null || _a4 === void 0
        ? void 0
        : _a4.call(this, isConnected)
    }
  }
}
class AttributePart {
  constructor(element, name, strings, parent, options) {
    this.type = ATTRIBUTE_PART
    this._$committedValue = nothing
    this._$disconnectableChildren = void 0
    this.element = element
    this.name = name
    this._$parent = parent
    this.options = options
    if (strings.length > 2 || strings[0] !== '' || strings[1] !== '') {
      this._$committedValue = new Array(strings.length - 1).fill(new String())
      this.strings = strings
    } else {
      this._$committedValue = nothing
    }
    if (ENABLE_EXTRA_SECURITY_HOOKS) {
      this._sanitizer = void 0
    }
  }
  get tagName() {
    return this.element.tagName
  }
  get _$isConnected() {
    return this._$parent._$isConnected
  }
  _$setValue(value, directiveParent = this, valueIndex, noCommit) {
    const strings = this.strings
    let change = false
    if (strings === void 0) {
      value = resolveDirective(this, value, directiveParent, 0)
      change =
        !isPrimitive(value) ||
        (value !== this._$committedValue && value !== noChange)
      if (change) {
        this._$committedValue = value
      }
    } else {
      const values = value
      value = strings[0]
      let i, v
      for (i = 0; i < strings.length - 1; i++) {
        v = resolveDirective(this, values[valueIndex + i], directiveParent, i)
        if (v === noChange) {
          v = this._$committedValue[i]
        }
        change || (change = !isPrimitive(v) || v !== this._$committedValue[i])
        if (v === nothing) {
          value = nothing
        } else if (value !== nothing) {
          value += (v !== null && v !== void 0 ? v : '') + strings[i + 1]
        }
        this._$committedValue[i] = v
      }
    }
    if (change && !noCommit) {
      this._commitValue(value)
    }
  }
  _commitValue(value) {
    if (value === nothing) {
      this.element.removeAttribute(this.name)
    } else {
      if (ENABLE_EXTRA_SECURITY_HOOKS) {
        if (this._sanitizer === void 0) {
          this._sanitizer = sanitizerFactoryInternal(
            this.element,
            this.name,
            'attribute'
          )
        }
        value = this._sanitizer(value !== null && value !== void 0 ? value : '')
      }

      this.element.setAttribute(
        this.name,
        value !== null && value !== void 0 ? value : ''
      )
    }
  }
}
class PropertyPart extends AttributePart {
  constructor() {
    super(...arguments)
    this.type = PROPERTY_PART
  }
  _commitValue(value) {
    if (ENABLE_EXTRA_SECURITY_HOOKS) {
      if (this._sanitizer === void 0) {
        this._sanitizer = sanitizerFactoryInternal(
          this.element,
          this.name,
          'property'
        )
      }
      value = this._sanitizer(value)
    }

    this.element[this.name] = value === nothing ? void 0 : value
  }
}
var emptyStringForBooleanAttribute2 = ''
class BooleanAttributePart extends AttributePart {
  constructor() {
    super(...arguments)
    this.type = BOOLEAN_ATTRIBUTE_PART
  }
  _commitValue(value) {
    if (value && value !== nothing) {
      this.element.setAttribute(this.name, emptyStringForBooleanAttribute2)
    } else {
      this.element.removeAttribute(this.name)
    }
  }
}
class EventPart extends AttributePart {
  constructor(element, name, strings, parent, options) {
    super(element, name, strings, parent, options)
    this.type = EVENT_PART
  }
  _$setValue(newListener, directiveParent = this) {
    var _a4
    newListener =
      (_a4 = resolveDirective(this, newListener, directiveParent, 0)) !==
        null && _a4 !== void 0
        ? _a4
        : nothing
    if (newListener === noChange) {
      return
    }
    const oldListener = this._$committedValue
    const shouldRemoveListener =
      (newListener === nothing && oldListener !== nothing) ||
      newListener.capture !== oldListener.capture ||
      newListener.once !== oldListener.once ||
      newListener.passive !== oldListener.passive
    const shouldAddListener =
      newListener !== nothing &&
      (oldListener === nothing || shouldRemoveListener)

    if (shouldRemoveListener) {
      this.element.removeEventListener(this.name, this, oldListener)
    }
    if (shouldAddListener) {
      this.element.addEventListener(this.name, this, newListener)
    }
    this._$committedValue = newListener
  }
  handleEvent(event) {
    var _a4, _b4
    if (typeof this._$committedValue === 'function') {
      this._$committedValue.call(
        (_b4 =
          (_a4 = this.options) === null || _a4 === void 0
            ? void 0
            : _a4.host) !== null && _b4 !== void 0
          ? _b4
          : this.element,
        event
      )
    } else {
      this._$committedValue.handleEvent(event)
    }
  }
}
class ElementPart {
  constructor(element, parent, options) {
    this.element = element
    this.type = ELEMENT_PART
    this._$disconnectableChildren = void 0
    this._$parent = parent
    this.options = options
  }
  get _$isConnected() {
    return this._$parent._$isConnected
  }
  _$setValue(value) {
    resolveDirective(this, value)
  }
}

export function render(value, container, options) {
  var _a4, _b4

  const renderId = 0
  const partOwnerNode =
    (_a4 =
      options === null || options === void 0
        ? void 0
        : options.renderBefore) !== null && _a4 !== void 0
      ? _a4
      : container
  let part = partOwnerNode['_$litPart$']

  if (part === void 0) {
    const endNode =
      (_b4 =
        options === null || options === void 0
          ? void 0
          : options.renderBefore) !== null && _b4 !== void 0
        ? _b4
        : null
    partOwnerNode['_$litPart$'] = part = new ChildPart(
      container.insertBefore(createMarker(), endNode),
      endNode,
      void 0,
      options !== null && options !== void 0 ? options : {}
    )
  }
  part._$setValue(value)

  return part
}
if (ENABLE_EXTRA_SECURITY_HOOKS) {
  render.setSanitizer = setSanitizer
  render.createSanitizer = createSanitizer
}
