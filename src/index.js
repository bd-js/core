/**
 * {全新的组件核心库}
 * @author yutent<yutent.io@gmail.com>
 * @date 2023/03/03 11:21:44
 */

import { finalize } from './constants.js'
import { css, adoptStyles } from './css.js'
import { html, renderRoot } from './html.js'

export { css, html }

export class Component extends HTMLElement {
  // 声明要监听的属性
  static get observedAttributes() {
    this[finalize]()

    let list = []
    this.elemProps.forEach((it, prop) => {
      list.push(prop)
    })
    return list
  }

  constructor() {
    super()
    this.created && this.created()
  }

  /**
   * 预处理rpops, styles等
   */
  static [finalize]() {
    if (this.finalized) {
      return
    }

    this.finalized = true

    this.elemProps = new Map()

    const t = Object.getPrototypeOf(this)

    console.log('>>>', t)
    console.log('>>>', this)

    for (let k in this.props) {
      let prop = Symbol(k)
      let options = this.props[k]
      this.elemProps.set(k, prop)
      Object.defineProperty(this.prototype, k, {
        get() {
          return this[prop] || options.default
        },
        set(val) {
          this[prop] = val
        },
        enumerable: false
      })
    }
  }

  render() {
    return ''
  }

  // 组件节点被插入文档时触发的回调
  connectedCallback() {
    Object.defineProperty(this, 'root', {
      value: this.shadowRoot || this.attachShadow({ mode: 'open' }),
      enumerable: false
    })

    adoptStyles(this.root, this.constructor.styles)

    renderRoot(this.root, this.render())

    this.mounted && this.mounted()
  }

  disconnectedCallback() {
    console.log('>>>>')
  }

  attributeChangedCallback(name, old, val) {
    if (old === val) {
      return
    }
  }

  adoptedCallback() {
    //
  }
}
