/**
 * {}
 * @author yutent<yutent.io@gmail.com>
 * @date 2023/03/06 12:08:35
 */

export const FINALIZED = Symbol('finalized')
export const UPDATE = Symbol('update')
export const WC_PART = Symbol('wc_path')

export const RESET_CSS_STYLE = `
  * {box-sizing: border-box;margin: 0;padding: 0;}
  ::before,::after {box-sizing: border-box;}
`

export const DEFAULT_CONVERTER = {
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

export function notEqual(value, old) {
  return old !== value && (old === old || value === value)
}

export const DEFAULT_PROPERTY_DECLARATION = {
  attribute: true,
  type: String,
  converter: DEFAULT_CONVERTER,
  reflect: false,
  hasChanged: notEqual
}
