## 9号UI组件库的核心


```js
import { css, html, Component } from '//jscdn.ink/@ninejs/core/latest/index.js'

class Hello extends Component {

  static props = {
    count: {
      type: Number,
      default: 0
    }
  }

  static styles = css`
    button { color: #09f; }
    span { color: #f30; }
  `

  render(){
    return html`
      <div>
        <button @click="increase">点击我</button>
      </div>
      <div>所有点击数为: <span>${this.count}</span></div>
    `
  }

  increase(){
    this.count++
  }

}

customElements.define('wc-hello', Hello)


/* 

  <!-- 在html中,便可以直接使用 -->
  <wc-hello></wc-hello>

*/

```

若需要支持 scss, 则需要使用构建工具,预处理。

```js
import { css, html, Component } from '@ninejs/core'

@customElement('wc-hello')
class Hello extends Component {

  static props = {
    count: {
      type: Number,
      default: 0
    }
  }

  // 这个scss会被解析进来
  @extendStyle('hello.scss')
  static styles

  render(){
    return html`
      <div>
        <button @click="increase">点击我</button>
      </div>
      <div>所有点击数为: <span>${this.count}</span></div>
    `
  }

  increase(){
    this.count++
  }

}

// 这个可以省略
// customElements.define('wc-hello', Hello)


/* 

  <!-- 在html中,便可以直接使用 -->
  <wc-hello></wc-hello>

*/

```