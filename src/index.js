/**
 * {wcui的核心库, 基于lit-core二次开发}
 * @author yutent<yutent.io@gmail.com>
 * @date 2023/03/07 18:10:43
 */
import {
  fixedValue,
  parsePropsDeclaration,
  boolMap,
  __finalized__,
  __render__,
  __init__,
  __props__,
  __changed_props__,
  __mounted__,
  __feedback__,
  __pending__,
  __prop2attr__,
  __attr2prop__,
  __clear_update__,
  __children__,
  __updated__
} from './constants.js'
import { css, adoptStyles } from './css.js'
import { render, html, svg } from './html.js'
import { nextTick, fire, bind, unbind } from './utils.js'
export { $, $$, offset, outsideClick, clearOutsideClick } from './utils.js'
export { html, css, svg, bind, unbind, nextTick }

export class Component extends HTMLElement {
  /**
   * 声明可监听变化的属性列表
   * @return list<Array>
   */
  static get observedAttributes() {
    let list = []

    this.finalize()

    this[__props__].forEach((options, prop) => {
      options.attribute && list.push(prop.toLowerCase())
    })
    return list
  }

  static createProperty(name, options) {
    let key = Symbol(name)
    let descriptor = {
      get() {
        return this[key]
      },
      set(value) {
        let oldValue = this[key]
        value = fixedValue(value, options)
        if (oldValue === value) {
          return
        }
        this[key] = value
        this.#requestUpdate(name, oldValue)
      },
      enumerable: false
    }

    this[__props__].set(name, options)
    Object.defineProperty(this.prototype, name, descriptor)
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
        let options = parsePropsDeclaration(this.props[k])
        if (boolMap[k] && k !== boolMap[k]) {
          k = boolMap[k]
        }
        this.createProperty(k, options)
      }
    }

    delete this.props
  }

  constructor() {
    super()
    this[__pending__] = false
    this[__mounted__] = false
    this[__init__]()
    this.created()
  }

  [__init__]() {
    this.root = this.shadowRoot || this.attachShadow({ mode: 'open' })

    this[__changed_props__] = new Map() // 记录本次变化的属性
    // 初始化 props
    this.constructor[__props__].forEach((options, prop) => {
      this[prop] = options.default
    })
    // 若无定义props时, 手动执行一次渲染
    if (this[__pending__] === false) {
      this[__pending__] = true
      this.performUpdate()
    }
  }

  #getPropOptions(name) {
    return this.constructor[__props__].get(name)
  }

  connectedCallback() {
    adoptStyles(this.root, this.constructor.styles)

    this[__children__]?.setConnected(true)
  }

  disconnectedCallback() {
    this[__children__]?.setConnected(false)
    this.unmounted()
  }
  // 监听属性变化
  attributeChangedCallback(name, old, val) {
    if (old === val) {
      return
    }
    this[__attr2prop__](name, val)
  }

  /**
   * 处理需要显式渲染到html标签上的属性
   * 复杂类型永不显式渲染
   * @param name<String>
   * @param value<String|Boolean|Number>
   */
  [__prop2attr__](name, value) {
    let options = this.#getPropOptions(name)

    if (options.attribute === false) {
      return
    }

    switch (options.type) {
      case Number:
      case String:
        if (value === null) {
          this.removeAttribute(name)
        } else {
          this.setAttribute(name, value)
        }
        break

      case Boolean:
        if (value === null || value === false) {
          this.removeAttribute(name)
        } else {
          this.setAttribute(name, '')
        }
        break
    }
  }

  /**
   * 通过setAttribute设置的值, 需要转成props
   * @param name<String>
   * @param value<String|Boolean|Number>
   */
  [__attr2prop__](name, value) {
    let options = this.#getPropOptions(name)

    this[name] = fixedValue(value, options)
  }

  // 请求更新
  #requestUpdate(name, oldValue) {
    let shouldUpdate = true

    this[__changed_props__].set(name, this[name])
    this[__prop2attr__](name, this[name])

    if (this[__pending__] === false) {
      this[__pending__] = true
      nextTick(_ => this[__updated__]())
    }
  }

  // 确认更新到视图
  [__updated__]() {
    if (this[__pending__]) {
      try {
        let props = this[__changed_props__]
        this[__render__]()
        this[__feedback__](props)
      } catch (err) {
        console.error(err)
      }
      this[__clear_update__]()
    }
  }

  // 更新回调反馈
  [__feedback__](props) {
    // 初始化时不触发updated回调
    if (!this[__mounted__]) {
      this[__mounted__] = true
      this.mounted()
    } else {
      this.updated(props)
    }
  }

  [__clear_update__]() {
    this[__changed_props__] = new Map()
    this[__pending__] = false
  }

  // 渲染视图
  [__render__]() {
    let htmlText = this.render()

    this[__children__] = render(htmlText, this.root, {
      host: this,
      isConnected: !this[__mounted__] && this.isConnected
    })
  }
  // 几个生命周期回调
  created() {}
  mounted() {}
  unmounted() {}
  updated() {}

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
