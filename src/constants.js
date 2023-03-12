/**
 * {}
 * @author yutent<yutent.io@gmail.com>
 * @date 2023/03/06 12:08:35
 */

const boolMap = Object.create(null)

;[
  'autofocus',
  'autoplay',
  'async',
  'allowTransparency',
  'checked',
  'controls',
  'declare',
  'disabled',
  'defer',
  'defaultChecked',
  'defaultSelected',
  'contentEditable',
  'isMap',
  'loop',
  'multiple',
  'noHref',
  'noResize',
  'noShade',
  'open',
  'readOnly',
  'selected'
].forEach(function (name) {
  boolMap[name.toLowerCase()] = name
})

export { boolMap }

export const WC_PART = Symbol('wc_path')
export const NO_CHANGE = Symbol('wc-noChange')
export const NOTHING = Symbol('wc-nothing')
export const __finalized__ = Symbol('finalized')
export const __update__ = Symbol('update')
export const __init__ = Symbol('init')
export const __props__ = Symbol('props')
export const __changed_props__ = Symbol('changed_props')
export const __mounted__ = Symbol('mounted')

export const RESET_CSS_STYLE = `* {box-sizing: border-box;margin: 0;padding: 0;}::before,::after {box-sizing: border-box;}`

export const DEFAULT_CONVERTER = {
  toAttribute(value, type) {
    switch (type) {
      case Boolean:
        // console.log(this, '>>>', value)
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

export function notEqual(value, old) {
  return old !== value && (old === old || value === value)
}

export const DEFAULT_PROPERTY_DECLARATION = {
  attribute: true,
  type: String,
  formater: DEFAULT_CONVERTER,
  // converter: DEFAULT_CONVERTER,
  reflect: false,
  hasChanged: notEqual,
  default: ''
}
