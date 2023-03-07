/**
 * {}
 * @author yutent<yutent.io@gmail.com>
 * @date 2023/03/06 16:27:49
 */

import { RESET_CSS_STYLE } from './constants.js'

export function css(strs, ...args) {
  let output = ''
  let tmp = Array.from(strs)
  while (tmp.length) {
    output += tmp.shift() + (args.shift() || '')
  }
  return output
}

export function adoptStyles(root, styles = '') {
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
