/**
 * {wcui的核心库, 基于lit-core二次开发}
 * @author yutent<yutent.io@gmail.com>
 * @date 2023/03/07 18:10:43
 */
import {
  DEFAULT_CONVERTER,
  DEFAULT_PROPERTY_DECLARATION,
  notEqual,
  boolMap,
  __finalized__,
  __update__,
  __init__,
  __props__,
  __changed_props__,
  __mounted__
} from './constants.js'
import { css, adoptStyles } from './css.js'
import { render, html, svg } from './html.js'
import { fire, bind, unbind } from './utils.js'
export {
  $,
  $$,
  nextTick,
  offset,
  outsideClick,
  clearOutsideClick
} from './utils.js'
export { html, css, svg, bind, unbind }

export class Component extends HTMLElement {
  /**
   * 声明可监听变化的属性列表
   * @return list<Array>
   */
  static get observedAttributes() {
    let list = []

    this.finalize()

    this[__props__].forEach((options, prop) => {
      if (options) {
        options.watch && list.push(k.toLowerCase())
      } else {
        list.push(k.toLowerCase())
      }
    })
    return list
  }
  static createProperty(name, options = DEFAULT_PROPERTY_DECLARATION) {
    if (options.state) {
      options.attribute = false
    }

    this[__props__].set(name, options)

    let key = Symbol(name)
    let descriptor = {
      get() {
        return this[key]
      },
      set(value) {
        let oldValue = this[key]
        this[key] = value
        this.requestUpdate(name, oldValue, options)
      },
      enumerable: false
    }

    Object.defineProperty(this.prototype, name, descriptor)

    // this.prototype[name] = options.default
  }

  // 处理静态声明
  static finalize() {
    if (this[__finalized__]) {
      return false
    }
    this[__finalized__] = true

    this[__props__] = new Map()

    if (this.hasOwnProperty('props')) {
      for (let k in this.props) {
        if (boolMap[k] && k !== boolMap[k]) {
          this.props[boolMap[k]] = this.props[k]
          delete this.props[k]
          k = boolMap[k]
        }
        this.createProperty(k, this.props[k])
      }
    }

    delete this.props

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

  constructor() {
    super()

    this.isUpdatePending = false
    this.__reflectingProperty = null
    this[__mounted__] = false
    this[__init__]()
    this.created && this.created()
  }

  [__init__]() {
    this.__updatePromise = new Promise(res => (this.enableUpdating = res))
    this[__changed_props__] = new Map() // 记录本次变化的属性
    // 初始化 props
    this.constructor[__props__].forEach((options, prop) => {
      this[prop] = options.default
    })
    this.requestUpdate()
  }

  connectedCallback() {
    this.root = this.shadowRoot || this.attachShadow({ mode: 'open' })

    adoptStyles(this.root, this.constructor.styles)

    this.enableUpdating(true)

    this.__childPart?.setConnected(true)
  }

  disconnectedCallback() {
    this.__childPart?.setConnected(false)
  }
  attributeChangedCallback(name, _old, value) {
    this._$attributeToProperty(name, value)
  }
  __propertyToAttribute(name, value, options = DEFAULT_PROPERTY_DECLARATION) {
    const attr = this.constructor.__attributeNameForProperty(name, options)
    if (attr !== void 0 && options.reflect === true) {
      const converter = options.converter?.toAttribute
        ? options.converter
        : DEFAULT_CONVERTER
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
    const ctor = this.constructor
    const propName = ctor.__attributeToPropertyMap.get(name)
    if (propName !== void 0 && this.__reflectingProperty !== propName) {
      const options = ctor.getPropertyOptions(propName)
      const converter =
        typeof options.converter === 'function'
          ? { fromAttribute: options.converter }
          : options.converter?.fromAttribute
          ? options.converter
          : DEFAULT_CONVERTER
      this.__reflectingProperty = propName
      this[propName] = converter.fromAttribute(value, options.type)
      this.__reflectingProperty = null
    }
  }
  requestUpdate(name, oldValue, options) {
    let shouldRequestUpdate = true
    if (name !== void 0) {
      options = options || this.constructor[__props__][name]
      const hasChanged = options.hasChanged || notEqual
      if (hasChanged(this[name], oldValue)) {
        if (!this[__changed_props__].has(name)) {
          this[__changed_props__].set(name, oldValue)
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
    if (!this.isUpdatePending) {
      return
    }

    const changedProperties = this[__changed_props__]
    try {
      this[__update__](changedProperties)
      this._$didUpdate(changedProperties)
    } catch (e) {
      this.__markUpdated()
      throw e
    }
  }
  _$didUpdate(changedProperties) {
    if (!this[__mounted__]) {
      this[__mounted__] = true
      this.mounted && this.mounted()
    }
    this.updated(changedProperties)
  }
  __markUpdated() {
    this[__changed_props__] = new Map()
    this.isUpdatePending = false
  }
  get updateComplete() {
    return this.getUpdateComplete()
  }
  getUpdateComplete() {
    return this.__updatePromise
  }

  [__update__](_changedProperties) {
    let htmlText = this.render()

    if (this.__reflectingProperties !== void 0) {
      this.__reflectingProperties.forEach((v, k) =>
        this.__propertyToAttribute(k, this[k], v)
      )
      this.__reflectingProperties = void 0
    }
    this.__markUpdated()
    this.__childPart = render(htmlText, this.root, {
      host: this,
      isConnected: !this[__mounted__] && this.isConnected
    })
  }
  updated(_changedProperties) {}

  $on(type, callback) {
    return bind(this, type, callback)
  }

  $off(type, callback) {
    unbind(this, type, callback)
  }

  $emit(type, data = {}) {
    return fire(this, type, data)
  }
}
