import { ToyReact, Component } from './TyoReact'

class MyComponent extends Component {
  render() {
    return <div>
      <span>hello</span>
      <span>react</span>
      <div>
        {this.children}
      </div>
    </div>
  }
}

let a = <MyComponent name='b' id='idb'>
  <span>Hello</span>
  <span>MyComponent</span>
  <span>!</span>
</MyComponent>

// document.body.appendChild(a)

ToyReact.render(a, document.body)