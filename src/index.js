/**
 * {wcui的核心库, 基于lit-core二次开发}
 * @author yutent<yutent.io@gmail.com>
 * @date 2023/03/07 18:10:43
 */
import { css, adoptStyles } from './css.js'
import { render, html, svg } from './html.js'
export { html, css, svg }

var defaultConverter = {
  toAttribute(value, type) {
    switch (type) {
      case Boolean:
        value = value ? '' : null
        break
      case Object:
      case Array:
        value = value == null ? value : JSON.stringify(value)
        break
    }
    return value
  },
  fromAttribute(value, type) {
    let fromValue = value
    switch (type) {
      case Boolean:
        fromValue = value !== null
        break
      case Number:
        fromValue = value === null ? null : Number(value)
        break
      case Object:
      case Array:
        try {
          fromValue = JSON.parse(value)
        } catch (e) {
          fromValue = null
        }
        break
    }
    return fromValue
  }
}
var notEqual = (value, old) => {
  return old !== value && (old === old || value === value)
}
var defaultPropertyDeclaration = {
  attribute: true,
  type: String,
  converter: defaultConverter,
  reflect: false,
  hasChanged: notEqual
}
var finalized = 'finalized'

export class Component extends HTMLElement {
  constructor() {
    super()

    this.__instanceProperties = new Map()
    this.isUpdatePending = false
    this.hasUpdated = false
    this.__reflectingProperty = null
    this._initialize()
  }
  static addInitializer(initializer) {
    var _a4
    this.finalize()
    ;((_a4 = this._initializers) !== null && _a4 !== void 0
      ? _a4
      : (this._initializers = [])
    ).push(initializer)
  }
  static get observedAttributes() {
    this.finalize()
    const attributes = []
    this.elementProperties.forEach((v, p) => {
      const attr = this.__attributeNameForProperty(p, v)
      if (attr !== void 0) {
        this.__attributeToPropertyMap.set(attr, p)
        attributes.push(attr)
      }
    })
    return attributes
  }
  static createProperty(name, options = defaultPropertyDeclaration) {
    if (options.state) {
      options.attribute = false
    }
    this.finalize()
    this.elementProperties.set(name, options)

    let key = Symbol(name)
    let descriptor = this.getPropertyDescriptor(name, key, options)

    this.prototype[key] = options.default
    Object.defineProperty(this.prototype, name, descriptor)
  }
  static getPropertyDescriptor(name, key, options) {
    return {
      get() {
        return this[key]
      },
      set(value) {
        const oldValue = this[name]
        this[key] = value
        this.requestUpdate(name, oldValue, options)
      },
      configurable: true
    }
  }
  static getPropertyOptions(name) {
    return this.elementProperties.get(name) || defaultPropertyDeclaration
  }
  static finalize() {
    if (this.hasOwnProperty(finalized)) {
      return false
    }
    this[finalized] = true

    this.elementProperties = new Map()
    this.__attributeToPropertyMap = new Map()
    if (this.hasOwnProperty('props')) {
      for (let k in this.props) {
        this.createProperty(k, this.props[k])
      }
    }

    return true
  }

  static __attributeNameForProperty(name, options) {
    const attribute = options.attribute
    return attribute === false
      ? void 0
      : typeof attribute === 'string'
      ? attribute
      : typeof name === 'string'
      ? name.toLowerCase()
      : void 0
  }
  _initialize() {
    var _a4
    this.__updatePromise = new Promise(res => (this.enableUpdating = res))
    this._$changedProperties = new Map()
    this.__saveInstanceProperties()
    this.requestUpdate()
    ;(_a4 = this.constructor._initializers) === null || _a4 === void 0
      ? void 0
      : _a4.forEach(i => i(this))
  }
  addController(controller) {
    var _a4, _b4
    ;((_a4 = this.__controllers) !== null && _a4 !== void 0
      ? _a4
      : (this.__controllers = [])
    ).push(controller)
    if (this.root !== void 0 && this.isConnected) {
      ;(_b4 = controller.hostConnected) === null || _b4 === void 0
        ? void 0
        : _b4.call(controller)
    }
  }
  removeController(controller) {
    var _a4
    ;(_a4 = this.__controllers) === null || _a4 === void 0
      ? void 0
      : _a4.splice(this.__controllers.indexOf(controller) >>> 0, 1)
  }
  __saveInstanceProperties() {
    this.constructor.elementProperties.forEach((_v, p) => {
      if (this.hasOwnProperty(p)) {
        this.__instanceProperties.set(p, this[p])
        delete this[p]
      }
    })
  }
  createRenderRoot() {
    let root = this.shadowRoot || this.attachShadow({ mode: 'open' })
    adoptStyles(root, this.constructor.styles)
    return root
  }
  connectedCallback() {
    var _a4
    if (this.root === void 0) {
      this.root = this.createRenderRoot()
    }

    this.enableUpdating(true)
    ;(_a4 = this.__controllers) === null || _a4 === void 0
      ? void 0
      : _a4.forEach(c => {
          var _a5
          return (_a5 = c.hostConnected) === null || _a5 === void 0
            ? void 0
            : _a5.call(c)
        })
    this.__childPart && this.__childPart.setConnected(true)
  }
  enableUpdating(_requestedUpdate) {}
  disconnectedCallback() {
    var _a4
    ;(_a4 = this.__controllers) === null || _a4 === void 0
      ? void 0
      : _a4.forEach(c => {
          var _a5
          return (_a5 = c.hostDisconnected) === null || _a5 === void 0
            ? void 0
            : _a5.call(c)
        })
    this.__childPart && this.__childPart.setConnected(false)
  }
  attributeChangedCallback(name, _old, value) {
    this._$attributeToProperty(name, value)
  }
  __propertyToAttribute(name, value, options = defaultPropertyDeclaration) {
    var _a4
    const attr = this.constructor.__attributeNameForProperty(name, options)
    if (attr !== void 0 && options.reflect === true) {
      const converter =
        ((_a4 = options.converter) === null || _a4 === void 0
          ? void 0
          : _a4.toAttribute) !== void 0
          ? options.converter
          : defaultConverter
      const attrValue = converter.toAttribute(value, options.type)

      this.__reflectingProperty = name
      if (attrValue == null) {
        this.removeAttribute(attr)
      } else {
        this.setAttribute(attr, attrValue)
      }
      this.__reflectingProperty = null
    }
  }
  _$attributeToProperty(name, value) {
    var _a4
    const ctor = this.constructor
    const propName = ctor.__attributeToPropertyMap.get(name)
    if (propName !== void 0 && this.__reflectingProperty !== propName) {
      const options = ctor.getPropertyOptions(propName)
      const converter =
        typeof options.converter === 'function'
          ? { fromAttribute: options.converter }
          : ((_a4 = options.converter) === null || _a4 === void 0
              ? void 0
              : _a4.fromAttribute) !== void 0
          ? options.converter
          : defaultConverter
      this.__reflectingProperty = propName
      this[propName] = converter.fromAttribute(value, options.type)
      this.__reflectingProperty = null
    }
  }
  requestUpdate(name, oldValue, options) {
    let shouldRequestUpdate = true
    if (name !== void 0) {
      options = options || this.constructor.getPropertyOptions(name)
      const hasChanged = options.hasChanged || notEqual
      if (hasChanged(this[name], oldValue)) {
        if (!this._$changedProperties.has(name)) {
          this._$changedProperties.set(name, oldValue)
        }
        if (options.reflect === true && this.__reflectingProperty !== name) {
          if (this.__reflectingProperties === void 0) {
            this.__reflectingProperties = new Map()
          }
          this.__reflectingProperties.set(name, options)
        }
      } else {
        shouldRequestUpdate = false
      }
    }
    if (!this.isUpdatePending && shouldRequestUpdate) {
      this.__updatePromise = this.__enqueueUpdate()
    }
  }
  async __enqueueUpdate() {
    this.isUpdatePending = true
    try {
      await this.__updatePromise
    } catch (e) {
      Promise.reject(e)
    }
    const result = this.scheduleUpdate()
    if (result != null) {
      await result
    }
    return !this.isUpdatePending
  }
  scheduleUpdate() {
    return this.performUpdate()
  }
  performUpdate() {
    var _a4, _b4
    if (!this.isUpdatePending) {
      return
    }

    if (this.__instanceProperties) {
      this.__instanceProperties.forEach((v, p) => (this[p] = v))
      this.__instanceProperties = void 0
    }
    let shouldUpdate = false
    const changedProperties = this._$changedProperties
    try {
      shouldUpdate = this.shouldUpdate(changedProperties)
      if (shouldUpdate) {
        this.willUpdate(changedProperties)
        ;(_b4 = this.__controllers) === null || _b4 === void 0
          ? void 0
          : _b4.forEach(c => {
              var _a5
              return (_a5 = c.hostUpdate) === null || _a5 === void 0
                ? void 0
                : _a5.call(c)
            })
        this.update(changedProperties)
      } else {
        this.__markUpdated()
      }
    } catch (e) {
      shouldUpdate = false
      this.__markUpdated()
      throw e
    }
    if (shouldUpdate) {
      this._$didUpdate(changedProperties)
    }
  }
  willUpdate(_changedProperties) {}
  _$didUpdate(changedProperties) {
    var _a4
    ;(_a4 = this.__controllers) === null || _a4 === void 0
      ? void 0
      : _a4.forEach(c => {
          var _a5
          return (_a5 = c.hostUpdated) === null || _a5 === void 0
            ? void 0
            : _a5.call(c)
        })
    if (!this.hasUpdated) {
      this.hasUpdated = true
      this.firstUpdated(changedProperties)
    }
    this.updated(changedProperties)
  }
  __markUpdated() {
    this._$changedProperties = new Map()
    this.isUpdatePending = false
  }
  get updateComplete() {
    return this.getUpdateComplete()
  }
  getUpdateComplete() {
    return this.__updatePromise
  }
  shouldUpdate(_changedProperties) {
    return true
  }
  update(_changedProperties) {
    const value = this.render()

    /*  */
    if (this.__reflectingProperties !== void 0) {
      this.__reflectingProperties.forEach((v, k) =>
        this.__propertyToAttribute(k, this[k], v)
      )
      this.__reflectingProperties = void 0
    }
    this.__markUpdated()

    this.__childPart = render(value, this.root, {
      host: this,
      isConnected: !this.hasUpdated && this.isConnected
    })
  }
  updated(_changedProperties) {}
  firstUpdated(_changedProperties) {}
}
