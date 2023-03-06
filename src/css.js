/**
 * {}
 * @author yutent<yutent.io@gmail.com>
 * @date 2023/03/06 16:27:49
 */

export const RESET_CSS_STYLE = css`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  ::before,
  ::after {
    box-sizing: border-box;
  }
`

export function css(strs, ...args) {
  let output = `
  
  `
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
