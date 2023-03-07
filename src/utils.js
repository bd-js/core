/**
 * {常用方法库}
 * @author yutent<yutent.io@gmail.com>
 * @date 2023/03/07 22:11:30
 */

export function $(selector, container) {
  if (container) {
    return container.querySelector(selector)
  }
  return document.body.querySelector(selector)
}

export function $$(selector, container) {
  if (container) {
    return container.querySelectorsAll(selector)
  }
  return document.body.querySelectorsAll(selector)
}

export const nextTick = (function () {
  let queue = []
  let node = document.createTextNode('<!-- -->')
  let bool = false

  function callback() {
    let n = queue.length
    for (let i = 0; i < n; i++) {
      queue[i]()
    }
    queue = queue.slice(n)
  }

  new MutationObserver(callback).observe(node, { characterData: true })

  return function (fn) {
    queue.push(fn)
    bool = !bool
    node.data = bool
  }
})()

//取得距离页面左上角的坐标
export function offset(node) {
  try {
    let rect = node.getBoundingClientRect()

    if (rect.width || rect.height || node.getClientRects().length) {
      let doc = node.ownerDocument
      let root = doc.documentElement
      let win = doc.defaultView
      return {
        top: rect.top + win.pageYOffset - root.clientTop,
        left: rect.left + win.pageXOffset - root.clientLeft
      }
    }
  } catch (e) {
    return {
      left: 0,
      top: 0
    }
  }
}

/**
 * 事件绑定
 */
export function bind(dom, type, selector, fn, phase = true) {
  let events = type.split(',')
  let callback

  if (typeof selector === 'function') {
    phase = fn
    fn = selector
    selector = null
  } else {
    if (typeof selector !== 'string') {
      selector = null
    }
    fn = fn || noop
  }

  if (selector) {
    callback = function (ev) {
      let agents = $(selector, ev.currentTarget)
      let elem = ev.target
      if (agents) {
        while (true) {
          if (elem === ev.currentTarget) {
            break
          }
          if (agents.contains(elem)) {
            fn(ev)
            break
          } else {
            elem = elem.parentNode
          }
        }
      }
    }
  } else {
    callback = fn
  }

  events.forEach(function (t) {
    dom.addEventListener(t.trim(), callback, phase)
  })
  return callback
}

/**
 * 解除事件绑定
 */
export function unbind(dom, type, fn = noop, phase = false) {
  let events = type.split(',')
  events.forEach(function (t) {
    dom.removeEventListener(t.trim(), fn, phase)
  })
}

// 指定节点外点击(最高不能超过body层)
export function outsideClick(dom, fn = noop) {
  return bind(document, 'mousedown', ev => {
    let path = ev.composedPath ? ev.composedPath() : ev.path
    if (path) {
      while (path.length > 3) {
        if (path.shift() === dom) {
          return
        }
      }
    } else {
      let target = ev.explicitOriginalTarget || ev.target
      if (
        dom === target ||
        dom.contains(target) ||
        (dom.root && dom.root.contains(target))
      ) {
        return
      }
    }

    fn(ev)
  })
}

export function clearOutsideClick(fn = noop) {
  unbind(document, 'mousedown', fn)
}

export function fire(el, name = 'click', data = {}) {
  let ev = document.createEvent('Events')
  ev.initEvent(name, true, true)
  Object.assign(ev, data)
  el.dispatchEvent(ev)
}
