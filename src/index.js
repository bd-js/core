/**
 * {wcui的核心库, 基于lit-core二次开发}
 * @author yutent<yutent.io@gmail.com>
 * @date 2023/03/07 18:10:43
 */
import {
  FINALIZED,
  UPDATE,
  DEFAULT_CONVERTER,
  DEFAULT_PROPERTY_DECLARATION,
  notEqual
} from './constants.js'
import { css, adoptStyles } from './css.js'
import { render, html, svg } from './html.js'
import {
  $,
  $$,
  nextTick,
  offset,
  bind,
  unbind,
  outsideClick,
  clearOutsideClick,
  fire
} from './utils.js'

export { html, css, svg }
export {
  $,
  $$,
  nextTick,
  offset,
  bind,
  unbind,
  outsideClick,
  clearOutsideClick
}

export class Component extends HTMLElement {
  constructor() {
    super()

    this.__instanceProperties = new Map()
    this.isUpdatePending = false
    this.hasUpdated = false
    this.__reflectingProperty = null
    this._initialize()
    this.created && this.created()
  }
  static addInitializer(initializer) {
    this.finalize()
    if (!this._initializers) {
      this._initializers = []
    }
    this._initializers.push(initializer)
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
  static createProperty(name, options = DEFAULT_PROPERTY_DECLARATION) {
    if (options.state) {
      options.attribute = false
    }

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
    return this.elementProperties.get(name) || DEFAULT_PROPERTY_DECLARATION
  }
  static finalize() {
    if (this[FINALIZED]) {
      return false
    }
    this[FINALIZED] = true

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
    this.__updatePromise = new Promise(res => (this.enableUpdating = res))
    this._$changedProperties = new Map()
    this.__saveInstanceProperties()
    this.requestUpdate()
    this.constructor._initializers?.forEach(i => i(this))
  }
  addController(controller) {
    if (!this.__controllers) {
      this.__controllers = []
    }
    this.__controllers.push(controller)

    if (this.root !== void 0 && this.isConnected) {
      controller.hostConnected?.call(controller)
    }
  }
  removeController(controller) {
    this.__controllers?.splice(this.__controllers.indexOf(controller) >>> 0, 1)
  }
  __saveInstanceProperties() {
    this.constructor.elementProperties.forEach((_v, p) => {
      if (this.hasOwnProperty(p)) {
        this.__instanceProperties.set(p, this[p])
        delete this[p]
      }
    })
  }

  connectedCallback() {
    this.root = this.shadowRoot || this.attachShadow({ mode: 'open' })

    adoptStyles(this.root, this.constructor.styles)

    this.enableUpdating(true)

    this.__controllers?.forEach(it => it.hostConnected?.call(it))
    this.__childPart?.setConnected(true)

    this.mounted && this.mounted()
  }
  enableUpdating(_requestedUpdate) {}
  disconnectedCallback() {
    this.__controllers?.forEach(it => it.hostDisconnected?.call(it))
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
    if (!this.isUpdatePending) {
      return
    }

    if (this.__instanceProperties) {
      this.__instanceProperties.forEach((v, p) => (this[p] = v))
      this.__instanceProperties = void 0
    }

    const changedProperties = this._$changedProperties
    try {
      this.__controllers?.forEach(it => it.hostUpdate?.call(it))
      this[UPDATE](changedProperties)
      this._$didUpdate(changedProperties)
    } catch (e) {
      this.__markUpdated()
      throw e
    }
  }
  _$didUpdate(changedProperties) {
    this.__controllers?.forEach(it => it.hostUpdated?.call(it))

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

  [UPDATE](_changedProperties) {
    let value = this.render()

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

  $on(type, callback) {
    return bind(this, type, callback)
  }

  $emit(type, data = {}) {
    return fire(this, type, data)
  }
}
