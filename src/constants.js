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
export const __render__ = Symbol('render')
export const __init__ = Symbol('init')
export const __props__ = Symbol('props')
export const __changed_props__ = Symbol('changed_props')
export const __mounted__ = Symbol('mounted')
export const __feedback__ = Symbol('feedback')
export const __pending__ = Symbol('pending')
export const __prop2attr__ = Symbol('prop2attr')
export const __attr2prop__ = Symbol('attr2prop')
export const __clear_update__ = Symbol('clearupdate')
export const __children__ = Symbol('children')
export const __updated__ = Symbol('updated')

export const RESET_CSS_STYLE = `* {box-sizing: border-box;margin: 0;padding: 0;}::before,::after {box-sizing: border-box;}`

function getDefaultValue(type) {
  switch (type) {
    case Number:
      return 0

    case Boolean:
      return false

    case Object:
      return {}

    case Array:
      return []

    default:
      return ''
  }
}

function getType(v) {
  switch (typeof v) {
    case 'number':
      return { type: Number, default: v }

    case 'boolean':
      return { type: Boolean, default: v }

    case 'object':
      return Array.isArray(v)
        ? { type: Array, default: v }
        : { type: Object, default: v }

    default:
      return { type: String, default: v + '' }
  }
}

export function parsePropsDeclaration(options) {
  if (options && typeof options === 'object') {
    if (options.hasOwnProperty('type')) {
      return Object.assign(
        { attribute: true, default: getDefaultValue(options.type) },
        options
      )
    }
  }
  switch (options) {
    case Number:
      options = { type: Number }
      break

    case Boolean:
      options = { type: Boolean }
      break

    case Object:
      options = { type: Object }
      break

    case Array:
      options = { type: Array }
      break

    default:
      options = getType(options)
      break
  }
  options.default = options.default || getDefaultValue(options.type)
  options.attribute = true
  return options
}

export function fixedValue(value, options) {
  switch (options.type) {
    case Number:
      return +value || 0
      break

    case Boolean:
      return value === false ? false : value !== null
      break

    case Object:
      if (typeof value === 'object') {
        return value
      } else {
        try {
          return JSON.parse(value)
        } catch (err) {
          return {}
        }
      }
      break

    case Array:
      if (typeof value === 'object') {
        return value
      } else {
        try {
          return JSON.parse(value)
        } catch (err) {
          return []
        }
      }
      break

    default:
      return value + ''
      break
  }
}
