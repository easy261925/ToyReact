class ElementWarpper {
  constructor(type) {
    this.type = type
    this.children = []
    this.props = Object.create(null)
  }
  setAttribute(name, value) {
    /* 
    if (name.match(/^on([\s\S]+)$/)) {
      const eventName = RegExp.$1.replace(/^[\s\S]/, s => s.toLowerCase())
      console.log(eventName, value)
      this.root.addEventListener(eventName, value)
    }
    if (name === "className") {
      this.root.setAttribute("class", value)
    }
    this.root.setAttribute(name, value)
    */
    this.props[name] = value
  }
  appendChild(vChild) {
    this.children.push(vChild)

    /*
    let range = document.createRange()
    if (this.root.children.length) {
      //如果有子节点，设置在最后的子节点
      range.setStartAfter(this.root.lastChild)
      range.setEndAfter(this.root.lastChild)
    } else {
      //没有子节点这设置在this.root
      range.setStart(this.root, 0)
      range.setEnd(this.root, 0)
    }
    vChild.mountTo(range)
    */
  }
  mountTo(range) {
    this.range = range
    // 所有的 实DOM 都应该在 mountTo 中操作 （为了方便对比虚拟DOM的对比）
    range.deleteContents()

    let element = document.createElement(this.type)
    for (let name in this.props) {
      let value = this.props[name]
      if (name.match(/^on([\s\S]+)$/)) {
        const eventName = RegExp.$1.replace(/^[\s\S]/, s => s.toLowerCase())
        element.addEventListener(eventName, value)
      }
      if (name === "className") {
        element.setAttribute("class", value)
      }

      element.setAttribute(name, value)
    }

    for (let child of this.children) {
      let range = document.createRange()
      if (element.children.length) {
        //如果有子节点，设置在最后的子节点
        range.setStartAfter(element.lastChild)
        range.setEndAfter(element.lastChild)
      } else {
        //没有子节点这设置在element
        range.setStart(element, 0)
        range.setEnd(element, 0)
      }

      child.mountTo(range)
    }
    range.insertNode(element)
  }
}

class TxetWarpper {
  constructor(type) {
    this.root = document.createTextNode(type)
    this.type = "#text"
    this.children = []
    this.props = Object.create(null)
  }
  mountTo(range) {
    this.range = range
    range.deleteContents()
    range.insertNode(this.root)
  }
}

export class Component {
  constructor() {
    this.children = []
    this.props = Object.create(null)
  }
  get type() {
    return this.constructor.name
  }
  setAttribute(name, value) {
    this.props[name] = value
    this[name] = value
  }
  mountTo(range) {
    this.range = range
    this.update()
  }
  appendChild(vChild) {
    this.children.push(vChild)
  }

  update() {

    let vdom = this.render()

    // 对比单个 node 节点
    const isSameNode = (node1, node2) => {
      // 如何比对 vdom？ 其实比对的就是 type、props、children 三样

      // 比 type
      if (node1.type !== node2.type) {
        return false
      }

      // 比 props
      if (Object.keys(node1).length !== Object.keys(node2).length) {
        return false
      }
      for (let name in node1.props) {
        if (node1.props[name] !== node2.props[name]) {
          return false
        }
      }

      // children
      if (node1.children.length !== node2.children.length) {
        return false
      }
      for (let i = 0; i < node1.children.length; i++) {
        if (!isSameNode(node1.children[i], node2.children[i])) {
          return false
        }
      }
      return true
    }

    // 这里其实不需要 isSameTree，只需要 递归的比较 node 节点即可，因为 node 节点中的 children 其实也是 node 节点

    // 如果已存在 旧的vdom，则需要对比
    if (this.vdom && isSameNode(this.vdom, vdom)) {
      // 两个 vdom 对比结果为 true，则无需更新真实的 DOM 树
      return
    } else {
      vdom.mountTo(this.range)
      this.vdom = vdom
    }
  }

  setState(state) {
    const merge = (oldState, newState) => {
      for (let p in newState) {
        if (typeof newState[p] === "object" && newState[p] === null) {
          if (typeof oldState[p] !== "object") {
            oldState[p] = {}
          }
          merge(oldState[p], newState[p])
        }
        else {
          oldState[p] = newState[p]
        }
      }
    }

    if (!this.state && state) {
      this.state = {}
    }

    merge(this.state, state)

    this.update()
  }
}

export const ToyReact = {
  createElement(type, attributes, ...childrens) {
    let element

    // 处理 html 标签
    if (typeof type === 'string') {
      element = new ElementWarpper(type)
    } else {
      // 处理自定义组件
      element = new type;
    }

    for (let key in attributes) {
      element.setAttribute(key, attributes[key])
    }

    // 自定义组件 存在 包裹的内容，递归处理
    let insertChildren = (childrens) => {
      for (let child of childrens) {
        if (typeof child === 'object' && child instanceof Array) {
          insertChildren(child)
        } else {
          if (child === null || child === undefined) {
            child = ""
          }
          if (
            !(child instanceof Component)
            && !(child instanceof ElementWarpper)
            && !(child instanceof TxetWarpper)
          ) {
            child = child.toString()
          }
          if (typeof child === 'string') {
            // 处理文本节点
            child = new TxetWarpper(child)
          }
          element.appendChild(child)
        }
      }
    }

    insertChildren(childrens)

    return element
  },

  render(vdom, root) {
    let range = document.createRange()
    if (root.children.length) {
      range.setStartAfter(root.lastChild)
      range.setEndAfter(root.lastChild)
    } else {
      range.setStart(root, 0)
      range.setENd(root, 0)
    }
    vdom.mountTo(range)
  }
}