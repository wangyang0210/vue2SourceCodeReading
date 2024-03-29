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
