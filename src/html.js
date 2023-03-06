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

export function renderRoot(root, html) {
  root.appendChild(getTemplate(html))
}
