/**
 * {全新的组件核心库}
 * @author yutent<yutent.io@gmail.com>
 * @date 2023/03/03 11:21:44
 */

import { finalize, RESET_CSS_STYLE } from './constants.js'

export function css(strs, ...args) {
  let output = `
  
  `
  let tmp = Array.from(strs)
  while (tmp.length) {
    output += tmp.shift() + (args.shift() || '')
  }
  return output
}

export function html(strs, ...args) {
  let output = ''
  let tmp = Array.from(strs)
  // console.log(tmp, args)

  while (tmp.length) {
    let _ = args.shift()
    switch (typeof _) {
      case 'function':
        console.log([_], _.name)
        _ = _.name
        break
      case 'object':
        if (Array.isArray(_)) {
          _ = _.join('')
        }
        break
    }
    output += tmp.shift() + (_ === void 0 ? '' : _)
  }
  return output
}

function getTemplate(html) {
  let template = document.createElement('template')
  template.innerHTML = html
  return template.content.cloneNode(true)
}

function adoptStyles(root, styles = '') {
  let sheet = new CSSStyleSheet()
  if (typeof styles === 'string') {
    styles = [styles]
  } else {
    styles = styles.flat(Infinity)
  }
  styles = (RESET_CSS_STYLE + styles.join(' ')).trim()
  sheet.replaceSync(styles)
  root.adoptedStyleSheets.push(sheet)
}

function render(root, html) {
  root.appendChild(getTemplate(html))
}

export class Component extends HTMLElement {
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

  static [finalize]() {
    if (this.finalized) {
      return
    }

    this.finalized = true

    this.elemProps = new Map()

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

  connectedCallback() {
    Object.defineProperty(this, 'root', {
      value: this.shadowRoot || this.attachShadow({ mode: 'open' }),
      enumerable: false
    })

    adoptStyles(this.root, this.constructor.styles)

    render(this.root, this.render())

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
