# 前言

前面我们简单的了解了 vue 初始化时的一些大概的流程，这里我们扩展下 Vue 的 patch。

# 内容

这一块主要围绕 vue 中的`__patch__`进行剖析。

## \_\_patch\_\_

> `Vue.prototype.__patch__`的方法位于`scr/platforms/web/runtime/index.ts`中；

```ts
// install platform patch function
// 判断是否是浏览器环境，是就赋予patch否则就赋予空函数
Vue.prototype.__patch__ = inBrowser ? patch : noop
```

## patch.ts

> `patch.ts`位于`src/platforms/web/runtime/patch.ts`

?> 虚拟 DOM 算法基于[snabbdom](https://github.com/paldepind/snabbdom)进行修改

```ts
// the directive module should be applied last, after all
// built-in modules have been applied.
// 在应用了所有内置模块之后，最后再应用指令模块
const modules = platformModules.concat(baseModules)
// 创建patch函数
export const patch: Function = createPatchFunction({ nodeOps, modules })
```

### nodeOps

> `nodeOps`引入于`src/platforms/web/runtime/node-ops.ts`，封装了 DOM 操作的 API；

```ts
import VNode from 'core/vdom/vnode'
import { namespaceMap } from 'web/util/index'

// 创建一个由标签名称 tagName 指定的 HTML 元素
// https://developer.mozilla.org/zh-CN/docs/Web/API/Document/createElement
export function createElement(tagName: string, vnode: VNode): Element {
  const elm = document.createElement(tagName)
  if (tagName !== 'select') {
    return elm
  }
  // false or null will remove the attribute but undefined will not
  // false或者null将会移除这个属性但是undefined不会
  // vnode?.data?.attrs?.multiple !== undefined
  if (
    vnode.data &&
    vnode.data.attrs &&
    vnode.data.attrs.multiple !== undefined
  ) {
    // select元素增加multiple属性
    elm.setAttribute('multiple', 'multiple')
  }
  return elm
}

// 创建一个具有指定的命名空间 URI 和限定名称的元素
// https://developer.mozilla.org/zh-CN/docs/Web/API/Document/createElementNS
export function createElementNS(namespace: string, tagName: string): Element {
  return document.createElementNS(namespaceMap[namespace], tagName)
}

// 创建一个新的文本节点。这个方法可以用来转义 HTML 字符。
// https://developer.mozilla.org/zh-CN/docs/Web/API/Document/createTextNode
export function createTextNode(text: string): Text {
  return document.createTextNode(text)
}

// 创建一个注释节点
// https://developer.mozilla.org/zh-CN/docs/Web/API/Document/createComment
export function createComment(text: string): Comment {
  return document.createComment(text)
}
// 在参考节点之前插入一个拥有指定父节点的子节点
// https://developer.mozilla.org/zh-CN/docs/Web/API/Node/insertBefore
export function insertBefore(
  parentNode: Node,
  newNode: Node,
  referenceNode: Node
) {
  // referenceNode 引用节点不是可选参数——你必须显式传入一个 Node 或者 null。
  // 如果不提供节点或者传入无效值，在不同的浏览器中会有不同的表现
  parentNode.insertBefore(newNode, referenceNode)
}

// 从 DOM 中删除一个子节点。会返回删除的节点。
// https://developer.mozilla.org/zh-CN/docs/Web/API/Node/removeChild
export function removeChild(node: Node, child: Node) {
  node.removeChild(child)
}
// 将一个节点附加到指定父节点的子节点列表的末尾处会返回附加的节点对象
// https://developer.mozilla.org/zh-CN/docs/Web/API/Node/appendChild
// 这里有一个新的方法ParentNode.append()
// 两者不同之处
// Element.append() allows you to also append string objects, whereas Node.appendChild() only accepts Node objects.
// Element.append()允许添加DOMString 对象，而 Node.appendChild() 只接受 Node 对象
// Element.append() has no return value, whereas Node.appendChild() returns the appended Node object.
// Element.append() 没有返回值，而 Node.appendChild() 返回追加的 Node 对象。
// Element.append() can append several nodes and strings, whereas Node.appendChild() can only append one node.
// Element.append() 可以追加多个节点和字符串，而 Node.appendChild() 只能追加一个节点。
export function appendChild(node: Node, child: Node) {
  node.appendChild(child)
}

// 返回指定的节点在 DOM 树中的父节点
// https://developer.mozilla.org/zh-CN/docs/Web/API/Node/parentNode
export function parentNode(node: Node) {
  return node.parentNode
}

// 返回其父节点的 childNodes 列表中紧跟在其后面的节点,其实就是返回指定节点的兄弟节点
// https://developer.mozilla.org/zh-CN/docs/Web/API/Node/nextSibling
export function nextSibling(node: Node) {
  return node.nextSibling
}

// 返回指定节点的标签名
// https://developer.mozilla.org/zh-CN/docs/Web/API/Element/tagName
export function tagName(node: Element): string {
  return node.tagName
}

// 为指定节点设置文本内容
// https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent
// 比 innerHTML更好的性能(因为不会解析html)而且可以防止xss的攻击
// textContent 和 innerText 的区别
// textContent 会获取所有元素的内容，包括 <script> 和 <style> 元素， innerText 只展示给人看的元素。
// textContent 会返回节点中的每一个元素。相反，innerText 受 CSS 样式的影响，并且不会返回隐藏元素的文本，
// 此外，由于 innerText 受 CSS 样式的影响，它会触发回流（ reflow ）去确保是最新的计算样式。（回流在计算上可能会非常昂贵，因此应尽可能避免。）
// 与 textContent 不同的是，在 Internet Explorer (小于和等于 11 的版本) 中对 innerText 进行修改，
// 不仅会移除当前元素的子节点，而且还会永久性地破坏所有后代文本节点。在之后不可能再次将节点再次插入到任何其他元素或同一元素中。
export function setTextContent(node: Node, text: string) {
  node.textContent = text
}

// 为指定节点设置scopeId属性
// https://developer.mozilla.org/zh-CN/docs/Web/API/Element/setAttribute
export function setStyleScope(node: Element, scopeId: string) {
  node.setAttribute(scopeId, '')
}
```

### modules

> 主要是内置的一些模块方法，如：`attrs` `klass`，`events`，`domProps`，`style`，`transition`，`ref`，`directives`

### createPatchFunction

> `createPatchFunction` 中包含了`emptyNodeAt`,`createRmCb`,`removeNode`, `isUnknownElement`, `createElm`, `createComponent`, `initComponent`, `reactivateComponent`, `insert`, `createChildren`, `isPatchable`, `invokeCreateHooks`, `setScope`, `addVnodes`, `invokeDestroyHook`, `removeVnodes`, `removeAndInvokeRemoveHook`, `updateChildren`, `checkDuplicateKeys`, `findIdxInOld`, `patchVnode`, `invokeInsertHook`, `isRenderedModule`, `hydrate`, `assertNodeMatch`, `patch`共 26 个函数；

#### 钩子遍历

```ts
// hooks  ['create', 'activate', 'update', 'remove', 'destroy']
// modules  [attrs, klass, events, domProps, style, transition, ref, directives]
// 遍历hooks钩子并在modules中判断是否存在对应的方法
// 存在就push到cbs中
for (i = 0; i < hooks.length; ++i) {
  cbs[hooks[i]] = []
  for (j = 0; j < modules.length; ++j) {
    if (isDef(modules[j][hooks[i]])) {
      cbs[hooks[i]].push(modules[j][hooks[i]])
    }
  }
}
```

#### emptyNodeAt

```ts
// 创建一个vnode节点
// 获取传入元素的小写标签名并创建对应空的虚拟DOM
function emptyNodeAt(elm) {
  return new VNode(nodeOps.tagName(elm).toLowerCase(), {}, [], undefined, elm)
}
```

### createRmCb

```ts
// 创建remove函数
// 要移除某个节点需先把监听器全部移除
function createRmCb(childElm, listeners) {
  function remove() {
    if (--remove.listeners === 0) {
      removeNode(childElm)
    }
  }
  remove.listeners = listeners
  return remove
}
```

### removeNode

```ts
// 移除节点
function removeNode(el) {
  // 找到指定节点的父节点
  const parent = nodeOps.parentNode(el)
  // element may have already been removed due to v-html / v-text
  // 元素可能已经由于v-html/v-text被删除
  // 父节点存在则移除父节点的下该节点
  if (isDef(parent)) {
    nodeOps.removeChild(parent, el)
  }
}
```
