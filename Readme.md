## 9号UI组件库的核心

### 开发文档
[开发文档](https://github.com/bd-js/core/wiki)

### 示例

```js
import { css, html, Component } from '//jscdn.ink/@bd/core/latest/index.js'

class Hello extends Component {

  static props = {
    count: {
      type: Number,
      default: 0,
      attribute: true // 是否显式表现为html属性
    },
    foo: 0, // 简写
    bar: String // 简写
  }

  // 若需要支持 scss, 则需要使用 @bd/wcui-cli,预处理。
  // 可支持数组
  static styles = css`
    button { color: #09f; }
    span { color: #f30; }
  `

  // 支持多个
  static styles = [
    css`...`,
    css`...`
  ]

  render(){
    return html`
      <div>
        <button @click="${this.increase}">点击我</button>
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



