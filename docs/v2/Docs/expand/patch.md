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

### isUnknownElement

```ts
// 是否是未知的元素标签
// 如果自定元素存在ignoredElementse就返回false不使用isUnknownElement进行校验
// https://v2.cn.vuejs.org/v2/api/#ignoredElements
function isUnknownElement(vnode, inVPre) {
  return (
    !inVPre &&
    !vnode.ns &&
    !(
      config.ignoredElements.length &&
      config.ignoredElements.some(ignore => {
        return isRegExp(ignore) ? ignore.test(vnode.tag) : ignore === vnode.tag
      })
    ) &&
    config.isUnknownElement(vnode.tag)
  )
}
```

### createElm

```ts
// 创建元素
function createElm(
  vnode,
  insertedVnodeQueue,
  parentElm?: any,
  refElm?: any,
  nested?: any,
  ownerArray?: any,
  index?: any
) {
  // 节点已经被渲染，克隆节点
  if (isDef(vnode.elm) && isDef(ownerArray)) {
    // This vnode was used in a previous render!
    // now it's used as a new node, overwriting its elm would cause
    // potential patch errors down the road when it's used as an insertion
    // reference node. Instead, we clone the node on-demand before creating
    // associated DOM element for it.
    // 此vnode已在以前的渲染中使用！
    // 现在它被用作一个新节点，当它被用作插入参考节点时，覆盖它的elm将导致潜在的补丁错误。
    // 相反，我们在为节点创建关联的DOM元素之前按需克隆节点。
    vnode = ownerArray[index] = cloneVNode(vnode)
  }

  vnode.isRootInsert = !nested // for transition enter check
  // 创建组件
  if (createComponent(vnode, insertedVnodeQueue, parentElm, refElm)) {
    // 如果是创建组件节点且成功创建，createComponent返回 true。createElm直接return。
    return
  }

  const data = vnode.data
  const children = vnode.children
  const tag = vnode.tag
  if (isDef(tag)) {
    // 存在tag的情况

    // 开发环境下会对tag进行校验
    if (__DEV__) {
      // 跳过这个元素和它的子元素的编译过程。可以用来显示原始 Mustache 标签。跳过大量没有指令的节点会加快编译。
      // https://v2.cn.vuejs.org/v2/api/#v-pre
      if (data && data.pre) {
        // 节点上存在pre属性就对creatingElmInVPre标识进行+1操作
        creatingElmInVPre++
      }
      if (isUnknownElement(vnode, creatingElmInVPre)) {
        warn(
          'Unknown custom element: <' +
            tag +
            '> - did you ' +
            'register the component correctly? For recursive components, ' +
            'make sure to provide the "name" option.',
          vnode.context
        )
      }
    }

    // 通过传入节点的tag，创建相应的标签元素，赋值给 vnode.elm 进行占位
    // 如果存在命名空间就调用createElementNS创建带有命名空间元素否则就调用createElement创建正常元素
    vnode.elm = vnode.ns
      ? nodeOps.createElementNS(vnode.ns, tag)
      : nodeOps.createElement(tag, vnode)
    // 设置CSS作用域
    setScope(vnode)

    // 创建子节点
    createChildren(vnode, children, insertedVnodeQueue)

    if (isDef(data)) {
      // 调用create钩子
      invokeCreateHooks(vnode, insertedVnodeQueue)
    }

    // 插入父元素
    insert(parentElm, vnode.elm, refElm)

    if (__DEV__ && data && data.pre) {
      creatingElmInVPre--
    }
  } else if (isTrue(vnode.isComment)) {
    // 创建注释节点
    vnode.elm = nodeOps.createComment(vnode.text)
    insert(parentElm, vnode.elm, refElm)
  } else {
    // 创建文本节点
    vnode.elm = nodeOps.createTextNode(vnode.text)
    insert(parentElm, vnode.elm, refElm)
  }
}
```

### createComponent

```ts
// 创建组件
function createComponent(vnode, insertedVnodeQueue, parentElm, refElm) {
  let i = vnode.data
  if (isDef(i)) {
    // vnode.data存在

    // 存在组件实例且为keep-alive组件
    const isReactivated = isDef(vnode.componentInstance) && i.keepAlive
    // 子组件调用init执行初始化，创建子组件实例进行子组件挂载
    if (isDef((i = i.hook)) && isDef((i = i.init))) {
      i(vnode, false /* hydrating */)
    }
    // after calling the init hook, if the vnode is a child component
    // it should've created a child instance and mounted it. the child
    // component also has set the placeholder vnode's elm.
    // in that case we can just return the element and be done.
    //在调用init钩子之后，如果vnode是一个子组件，它应该创建一个子实例并挂载它。该子组件还设置了占位符vnode的elm。
    //在这种情况下，我们可以返回元素并完成。

    if (isDef(vnode.componentInstance)) {
      initComponent(vnode, insertedVnodeQueue)
      // 将子组件节点插入父元素中
      insert(parentElm, vnode.elm, refElm)
      if (isTrue(isReactivated)) {
        // 如果是keep-alive组件则激活组件
        reactivateComponent(vnode, insertedVnodeQueue, parentElm, refElm)
      }
      return true
    }
  }
}
```

### initComponent

```ts
// 初始化组件
function initComponent(vnode, insertedVnodeQueue) {
  // 存在pendingInsert就插入vnode队列中
  if (isDef(vnode.data.pendingInsert)) {
    insertedVnodeQueue.push.apply(insertedVnodeQueue, vnode.data.pendingInsert)
    vnode.data.pendingInsert = null
  }

  //赋予vnode.elm进行占位
  vnode.elm = vnode.componentInstance.$el

  if (isPatchable(vnode)) {
    // 触发create钩子
    invokeCreateHooks(vnode, insertedVnodeQueue)
    // 设置CSS作用域
    setScope(vnode)
  } else {
    // empty component root.
    // 空的根组件
    // skip all element-related modules except for ref (#3455)
    // 跳过除ref之外的所有与元素相关的模块

    // 注册ref
    registerRef(vnode)
    // make sure to invoke the insert hook
    // 确保调用了insert钩子
    insertedVnodeQueue.push(vnode)
  }
}
```

### reactivateComponent

```ts
// 激活组件 | 针对keep-alive组件
function reactivateComponent(vnode, insertedVnodeQueue, parentElm, refElm) {
  let i
  // hack for #4339: a reactivated component with inner transition
  // does not trigger because the inner node's created hooks are not called
  // again. It's not ideal to involve module-specific logic in here but
  // there doesn't seem to be a better way to do it.
  // #4339的破解：具有内部转换的重新激活组件不会触发，
  // 因为内部节点创建的钩子不会被再次调用。
  // 在这里涉及特定于模块的逻辑并不理想，但似乎没有更好的方法。
  let innerNode = vnode
  while (innerNode.componentInstance) {
    innerNode = innerNode.componentInstance._vnode
    // 调用activate钩子方法
    if (isDef((i = innerNode.data)) && isDef((i = i.transition))) {
      for (i = 0; i < cbs.activate.length; ++i) {
        cbs.activate[i](emptyNode, innerNode)
      }
      // 将节点推入队列
      insertedVnodeQueue.push(innerNode)
      break
    }
  }
  // unlike a newly created component,
  // a reactivated keep-alive component doesn't insert itself
  // 不同于新创建的组件， 重新激活的keep-alive组件不会插入自身
  insert(parentElm, vnode.elm, refElm)
}
```

### insert

```ts
function insert(parent, elm, ref) {
  if (isDef(parent)) {
    if (isDef(ref)) {
      if (nodeOps.parentNode(ref) === parent) {
        nodeOps.insertBefore(parent, elm, ref)
      }
    } else {
      nodeOps.appendChild(parent, elm)
    }
  }
}
```

### createChildren

```ts
// 创建子节点
function createChildren(vnode, children, insertedVnodeQueue) {
  if (isArray(children)) {
    if (__DEV__) {
      checkDuplicateKeys(children)
    }
    for (let i = 0; i < children.length; ++i) {
      // 子节点是数组话就遍历调用createElm
      createElm(
        children[i],
        insertedVnodeQueue,
        vnode.elm,
        null,
        true,
        children,
        i
      )
    }
  } else if (isPrimitive(vnode.text)) {
    // 文本节点是直接追加
    nodeOps.appendChild(vnode.elm, nodeOps.createTextNode(String(vnode.text)))
  }
}
```

### isPatchable

```ts
function isPatchable(vnode) {
  // 存在组件实例就将组件实例下的_vnode赋值给vnode
  while (vnode.componentInstance) {
    vnode = vnode.componentInstance._vnode
  }
  // 返回标签名
  return isDef(vnode.tag)
}

// 执行所有传入节点下的create方法
function invokeCreateHooks(vnode, insertedVnodeQueue) {
  for (let i = 0; i < cbs.create.length; ++i) {
    cbs.create[i](emptyNode, vnode)
  }
  i = vnode.data.hook // Reuse variable
  if (isDef(i)) {
    if (isDef(i.create)) i.create(emptyNode, vnode)
    if (isDef(i.insert)) insertedVnodeQueue.push(vnode)
  }
}
```

### setScope

```ts
// set scope id attribute for scoped CSS.
// this is implemented as a special case to avoid the overhead
// of going through the normal attribute patching process.
// 设置CSS的作用域id属性。
// 这是作为一种特殊情况来实现的，以避免经过正常属性修补过程的开销。
function setScope(vnode) {
  let i
  if (isDef((i = vnode.fnScopeId))) {
    nodeOps.setStyleScope(vnode.elm, i)
  } else {
    let ancestor = vnode
    while (ancestor) {
      if (isDef((i = ancestor.context)) && isDef((i = i.$options._scopeId))) {
        nodeOps.setStyleScope(vnode.elm, i)
      }
      ancestor = ancestor.parent
    }
  }
  // for slot content they should also get the scopeId from the host instance.
  // 对于插槽内容，他们还应该从主机实例中获取scopeId。
  if (
    isDef((i = activeInstance)) &&
    i !== vnode.context &&
    i !== vnode.fnContext &&
    isDef((i = i.$options._scopeId))
  ) {
    nodeOps.setStyleScope(vnode.elm, i)
  }
}
```

### addVnodes

```ts
// 在指定索引范围内添加节点
function addVnodes(
  parentElm,
  refElm,
  vnodes,
  startIdx,
  endIdx,
  insertedVnodeQueue
) {
  for (; startIdx <= endIdx; ++startIdx) {
    createElm(
      vnodes[startIdx],
      insertedVnodeQueue,
      parentElm,
      refElm,
      false,
      vnodes,
      startIdx
    )
  }
}
```

### invokeDestroyHook

```ts
// 销毁节点，其实就是执行destroy钩子方法
function invokeDestroyHook(vnode) {
  let i, j
  const data = vnode.data
  if (isDef(data)) {
    if (isDef((i = data.hook)) && isDef((i = i.destroy))) i(vnode)
    for (i = 0; i < cbs.destroy.length; ++i) cbs.destroy[i](vnode)
  }
  // 如果存在子节点就递归调用invokeDestroyHook
  if (isDef((i = vnode.children))) {
    for (j = 0; j < vnode.children.length; ++j) {
      invokeDestroyHook(vnode.children[j])
    }
  }
}
```

### removeVnodes

```ts
// 移除指定索引范围内的节点
function removeVnodes(vnodes, startIdx, endIdx) {
  for (; startIdx <= endIdx; ++startIdx) {
    const ch = vnodes[startIdx]
    if (isDef(ch)) {
      if (isDef(ch.tag)) {
        removeAndInvokeRemoveHook(ch)
        invokeDestroyHook(ch)
      } else {
        // Text node
        removeNode(ch.elm)
      }
    }
  }
}
```

### removeAndInvokeRemoveHook

```ts
// 移除并调用remove的钩子方法
function removeAndInvokeRemoveHook(vnode, rm?: any) {
  if (isDef(rm) || isDef(vnode.data)) {
    let i
    const listeners = cbs.remove.length + 1
    if (isDef(rm)) {
      // we have a recursively passed down rm callback
      // increase the listeners count
      rm.listeners += listeners
    } else {
      // directly removing
      rm = createRmCb(vnode.elm, listeners)
    }
    // recursively invoke hooks on child component root node
    // 递归调用子组件根节点商的钩子
    if (
      isDef((i = vnode.componentInstance)) &&
      isDef((i = i._vnode)) &&
      isDef(i.data)
    ) {
      removeAndInvokeRemoveHook(i, rm)
    }
    for (i = 0; i < cbs.remove.length; ++i) {
      // 调用remove钩子
      cbs.remove[i](vnode, rm)
    }
    if (isDef((i = vnode.data.hook)) && isDef((i = i.remove))) {
      i(vnode, rm)
    } else {
      rm()
    }
  } else {
    removeNode(vnode.elm)
  }
}
```

### updateChildren

```ts
// 更新子节点
function updateChildren(
  parentElm,
  oldCh,
  newCh,
  insertedVnodeQueue,
  removeOnly
) {
  // 老节点开始索引
  let oldStartIdx = 0
  // 新节点开始索引
  let newStartIdx = 0
  // 老节点结束索引
  let oldEndIdx = oldCh.length - 1
  // 老节点第一个节点
  let oldStartVnode = oldCh[0]
  // 老节点最后一个节点
  let oldEndVnode = oldCh[oldEndIdx]
  // 新节点开始索引
  let newEndIdx = newCh.length - 1
  // 新节点第一个节点
  let newStartVnode = newCh[0]
  // 新节点最后一个节点
  let newEndVnode = newCh[newEndIdx]

  // key和索引的映射关系 | 新节点对应的老节点的oldIdx | 需要移动的老节点 | 锚点
  let oldKeyToIdx, idxInOld, vnodeToMove, refElm

  // removeOnly is a special flag used only by <transition-group>
  // to ensure removed elements stay in correct relative positions
  // during leaving transitions
  // removeOnly是一个特殊标志，仅在＜transition group＞使用，以确保移除的元素在离开过渡期间保持在正确的相对位置
  const canMove = !removeOnly

  // dev环境下会检查组件的新节点的key是否存在重复的情况
  if (__DEV__) {
    checkDuplicateKeys(newCh)
  }
  // 对新老节点进行遍历，任意一个遍历完成就结束遍历
  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    if (isUndef(oldStartVnode)) {
      // 如果老节点第一个节点不存在则移动到下一个索引
      oldStartVnode = oldCh[++oldStartIdx] // Vnode has been moved left
    } else if (isUndef(oldEndVnode)) {
      // 如果老节点最后一个节点不存在则上移索引
      oldEndVnode = oldCh[--oldEndIdx]
    } else if (sameVnode(oldStartVnode, newStartVnode)) {
      // 新老节点头节点为同一个节点,进行patch
      patchVnode(
        oldStartVnode,
        newStartVnode,
        insertedVnodeQueue,
        newCh,
        newStartIdx
      )
      // 新老节点钧后移(右移)
      oldStartVnode = oldCh[++oldStartIdx]
      newStartVnode = newCh[++newStartIdx]
    } else if (sameVnode(oldEndVnode, newEndVnode)) {
      // 新老节点尾节点为同一个节点,执行patch
      patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue, newCh, newEndIdx)
      // 新老节点前移(左移)
      oldEndVnode = oldCh[--oldEndIdx]
      newEndVnode = newCh[--newEndIdx]
    } else if (sameVnode(oldStartVnode, newEndVnode)) {
      // 老节点头节点和新节点尾节点是同一个节点,执行patch
      // Vnode moved right
      patchVnode(
        oldStartVnode,
        newEndVnode,
        insertedVnodeQueue,
        newCh,
        newEndIdx
      )
      // 针对transition group情况进行处理
      canMove &&
        nodeOps.insertBefore(
          parentElm,
          oldStartVnode.elm,
          nodeOps.nextSibling(oldEndVnode.elm)
        )
      // 老节点右移
      oldStartVnode = oldCh[++oldStartIdx]
      // 新节点左移
      newEndVnode = newCh[--newEndIdx]
    } else if (sameVnode(oldEndVnode, newStartVnode)) {
      // 老节点尾节点和新节点头节点是同一节点,执行patch
      // Vnode moved left
      patchVnode(
        oldEndVnode,
        newStartVnode,
        insertedVnodeQueue,
        newCh,
        newStartIdx
      )
      // 针对transition group情况进行处理
      canMove &&
        nodeOps.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm)
      // 老节点左移
      oldEndVnode = oldCh[--oldEndIdx]
      // 新节点右移
      newStartVnode = newCh[++newStartIdx]
    } else {
      // 老节点下的key和索引的关系映射
      if (isUndef(oldKeyToIdx))
        oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx)
      // 在映射中找到新节点在老节点的索引
      idxInOld = isDef(newStartVnode.key)
        ? oldKeyToIdx[newStartVnode.key]
        : findIdxInOld(newStartVnode, oldCh, oldStartIdx, oldEndIdx)
      if (isUndef(idxInOld)) {
        // 新元素执行创建
        // New element
        createElm(
          newStartVnode,
          insertedVnodeQueue,
          parentElm,
          oldStartVnode.elm,
          false,
          newCh,
          newStartIdx
        )
      } else {
        // 找到对应的节点开始进行对比
        vnodeToMove = oldCh[idxInOld]
        if (sameVnode(vnodeToMove, newStartVnode)) {
          // 两个节点是同一个执行patch
          patchVnode(
            vnodeToMove,
            newStartVnode,
            insertedVnodeQueue,
            newCh,
            newStartIdx
          )
          // patch之后将老节点设置为undefined
          oldCh[idxInOld] = undefined
          canMove &&
            nodeOps.insertBefore(parentElm, vnodeToMove.elm, oldStartVnode.elm)
        } else {
          // 两个节点不是同一个节点就作为新元素创建
          // same key but different element. treat as new element
          createElm(
            newStartVnode,
            insertedVnodeQueue,
            parentElm,
            oldStartVnode.elm,
            false,
            newCh,
            newStartIdx
          )
        }
      }
      // 新节点后移
      newStartVnode = newCh[++newStartIdx]
    }
  }

  if (oldStartIdx > oldEndIdx) {
    // 老节点遍历完成新节点还有元素
    refElm = isUndef(newCh[newEndIdx + 1]) ? null : newCh[newEndIdx + 1].elm
    // 作为新增节点进行添加
    addVnodes(
      parentElm,
      refElm,
      newCh,
      newStartIdx,
      newEndIdx,
      insertedVnodeQueue
    )
  } else if (newStartIdx > newEndIdx) {
    // 新节点遍历完成,老节点有剩余进行移除
    removeVnodes(oldCh, oldStartIdx, oldEndIdx)
  }
}
```

<iframe id="embed_dom" name="embed_dom" frameborder="0" style="display:block;width:100%; height:500px;" src="https://www.processon.com/embed/607f1755f346fb647a63b27e"></iframe>

### checkDuplicateKeys

```ts
// 检查传入节点的key是否重复
function checkDuplicateKeys(children) {
  const seenKeys = {}
  for (let i = 0; i < children.length; i++) {
    const vnode = children[i]
    const key = vnode.key
    if (isDef(key)) {
      if (seenKeys[key]) {
        warn(
          `Duplicate keys detected: '${key}'. This may cause an update error.`,
          vnode.context
        )
      } else {
        seenKeys[key] = true
      }
    }
  }
}
```

### findIdxInOld

```ts
function findIdxInOld(node, oldCh, start, end) {
  for (let i = start; i < end; i++) {
    const c = oldCh[i]
    if (isDef(c) && sameVnode(node, c)) return i
  }
}
```

### patchVnode

```ts
// 更新节点
function patchVnode(
  oldVnode,
  vnode,
  insertedVnodeQueue,
  ownerArray,
  index,
  removeOnly?: any
) {
  // 新老节点一致不错处理直接返回
  if (oldVnode === vnode) {
    return
  }

  if (isDef(vnode.elm) && isDef(ownerArray)) {
    // clone reused vnode
    vnode = ownerArray[index] = cloneVNode(vnode)
  }

  const elm = (vnode.elm = oldVnode.elm)

  // 异步占位符
  if (isTrue(oldVnode.isAsyncPlaceholder)) {
    if (isDef(vnode.asyncFactory.resolved)) {
      hydrate(oldVnode.elm, vnode, insertedVnodeQueue)
    } else {
      vnode.isAsyncPlaceholder = true
    }
    return
  }

  // reuse element for static trees.
  // note we only do this if the vnode is cloned -
  // if the new node is not cloned it means the render functions have been
  // reset by the hot-reload-api and we need to do a proper re-render.
  if (
    isTrue(vnode.isStatic) &&
    isTrue(oldVnode.isStatic) &&
    vnode.key === oldVnode.key &&
    (isTrue(vnode.isCloned) || isTrue(vnode.isOnce))
  ) {
    // 均是静态节点
    // key相同
    // 新节点被克隆或存在v-once指令
    // 将实例赋予新节点
    vnode.componentInstance = oldVnode.componentInstance
    return
  }

  let i
  const data = vnode.data
  if (isDef(data) && isDef((i = data.hook)) && isDef((i = i.prepatch))) {
    // 执行组件的prepatch
    i(oldVnode, vnode)
  }

  // 老节点的children
  const oldCh = oldVnode.children
  // 新节点的children
  const ch = vnode.children
  if (isDef(data) && isPatchable(vnode)) {
    // 调用update钩子
    for (i = 0; i < cbs.update.length; ++i) cbs.update[i](oldVnode, vnode)
    if (isDef((i = data.hook)) && isDef((i = i.update))) i(oldVnode, vnode)
  }
  // 文本节点
  if (isUndef(vnode.text)) {
    if (isDef(oldCh) && isDef(ch)) {
      if (oldCh !== ch)
        // 新老节点都存在children,则进行递归diff
        updateChildren(elm, oldCh, ch, insertedVnodeQueue, removeOnly)
    } else if (isDef(ch)) {
      // 仅新节点存在children
      if (__DEV__) {
        // 开发环境下检查新节点下的children key值是否重复
        checkDuplicateKeys(ch)
      }
      // 老节点是文本节点则进行重置,文本内容置空
      if (isDef(oldVnode.text)) nodeOps.setTextContent(elm, '')
      // 添加新节点创建元素
      addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue)
    } else if (isDef(oldCh)) {
      // 仅老节点存在children,新节点不存在
      // 移除老节点的children
      removeVnodes(oldCh, 0, oldCh.length - 1)
    } else if (isDef(oldVnode.text)) {
      // 老节点是文本节点则置空
      nodeOps.setTextContent(elm, '')
    }
  } else if (oldVnode.text !== vnode.text) {
    // 更新文本节点
    nodeOps.setTextContent(elm, vnode.text)
  }
  if (isDef(data)) {
    // 调用postpatch钩子
    if (isDef((i = data.hook)) && isDef((i = i.postpatch))) i(oldVnode, vnode)
  }
}
```

### invokeInsertHook

```ts
// 调用insert钩子函数
function invokeInsertHook(vnode, queue, initial) {
  // delay insert hooks for component root nodes, invoke them after the
  // element is really inserted
  // 延迟组件根节点的insert钩子函数，在真正插入元素后调用它们
  if (isTrue(initial) && isDef(vnode.parent)) {
    vnode.parent.data.pendingInsert = queue
  } else {
    for (let i = 0; i < queue.length; ++i) {
      queue[i].data.hook.insert(queue[i])
    }
  }
}
```

### assertNodeMatch

```ts
// 判断节点是否匹配
function assertNodeMatch(node, vnode, inVPre) {
  if (isDef(vnode.tag)) {
    return (
      vnode.tag.indexOf('vue-component') === 0 ||
      (!isUnknownElement(vnode, inVPre) &&
        vnode.tag.toLowerCase() ===
          (node.tagName && node.tagName.toLowerCase()))
    )
  } else {
    return node.nodeType === (vnode.isComment ? 8 : 3)
  }
}
```

### assertNodeMatch

```ts
// 判断节点是否匹配 (ssr) | dev环境下进行的检查
function assertNodeMatch(node, vnode, inVPre) {
  if (isDef(vnode.tag)) {
    return (
      vnode.tag.indexOf('vue-component') === 0 ||
      (!isUnknownElement(vnode, inVPre) &&
        vnode.tag.toLowerCase() ===
          (node.tagName && node.tagName.toLowerCase()))
    )
  } else {
    return node.nodeType === (vnode.isComment ? 8 : 3)
  }
}
```

### patch

```ts
// 返回一个patch函数对后续的节点进行patch操作 || todo
return function patch(oldVnode, vnode, hydrating, removeOnly) {
  if (isUndef(vnode)) {
    // 如果新节点不存在, 但老节点存在, 则调用destroy钩子函数对老节点进行销毁
    if (isDef(oldVnode)) invokeDestroyHook(oldVnode)
    // 如果新节点不存在, 老节点也不存在，直接return不用做任何操作
    return
  }

  // 是否是初始化patch的标识
  let isInitialPatch = false
  // 插入虚拟节点的队列
  const insertedVnodeQueue: any[] = []

  // 判断是否存在老节点
  if (isUndef(oldVnode)) {
    // empty mount (likely as component), create new root element
    // 空挂载（类型于组件），创建一个新的根元素
    // 不存在老节点
    isInitialPatch = true
    // 首次初始化patch
    createElm(vnode, insertedVnodeQueue)
  } else {
    // 判断老节点是否是真实元素
    const isRealElement = isDef(oldVnode.nodeType)
    // 不是真实元素且为同一节点
    if (!isRealElement && sameVnode(oldVnode, vnode)) {
      // patch existing root node
      patchVnode(oldVnode, vnode, insertedVnodeQueue, null, null, removeOnly)
    } else {
      if (isRealElement) {
        // mounting to a real element
        // check if this is server-rendered content and if we can perform
        // a successful hydration.
        // 挂载到一个真实的元素，
        // 检查这是否是服务端渲染(SSR)的内容，
        // 以及我们是否可以成功执行hydration。
        if (oldVnode.nodeType === 1 && oldVnode.hasAttribute(SSR_ATTR)) {
          oldVnode.removeAttribute(SSR_ATTR)
          hydrating = true
        }
        if (isTrue(hydrating)) {
          // 是服务端渲染且hydrate成功
          if (hydrate(oldVnode, vnode, insertedVnodeQueue)) {
            // 调用insert钩子
            invokeInsertHook(vnode, insertedVnodeQueue, true)
            return oldVnode
          } else if (__DEV__) {
            warn(
              'The client-side rendered virtual DOM tree is not matching ' +
                'server-rendered content. This is likely caused by incorrect ' +
                'HTML markup, for example nesting block-level elements inside ' +
                '<p>, or missing <tbody>. Bailing hydration and performing ' +
                'full client-side render.'
            )
          }
        }
        // either not server-rendered, or hydration failed.
        // 不是服务端渲染或者hydration失败
        // create an empty node and replace it
        // 创建一个空节点代替老节点
        oldVnode = emptyNodeAt(oldVnode)
      }

      // replacing existing element
      // 获取老节点元素
      const oldElm = oldVnode.elm
      // 获取老节点的父元素
      const parentElm = nodeOps.parentNode(oldElm)

      // create new node
      // 基于新节点创建一个dom树
      createElm(
        vnode,
        insertedVnodeQueue,
        // extremely rare edge case: do not insert if old element is in a
        // leaving transition. Only happens when combining transition +
        // keep-alive + HOCs. (#4590)
        // 极为罕见的边缘情况：如果旧元素处于离开过渡，则不要插入。
        // 只有当结合transition + keep-alive + HOCs时才会发生。(#4590)
        oldElm._leaveCb ? null : parentElm,
        // 获取兄弟节点
        nodeOps.nextSibling(oldElm)
      )

      // update parent placeholder node element, recursively
      // 递归更新父占位符节点元素
      if (isDef(vnode.parent)) {
        let ancestor = vnode.parent
        const patchable = isPatchable(vnode)
        while (ancestor) {
          // 调用destroy钩子
          for (let i = 0; i < cbs.destroy.length; ++i) {
            cbs.destroy[i](ancestor)
          }
          ancestor.elm = vnode.elm
          if (patchable) {
            // 调用create钩子
            for (let i = 0; i < cbs.create.length; ++i) {
              cbs.create[i](emptyNode, ancestor)
            }
            // #6513
            // invoke insert hooks that may have been merged by create hooks.
            // e.g. for directives that uses the "inserted" hook.
            // 调用可能已通过创建钩子合并的插入钩子。
            // 例如，对于使用“inserted”钩子的指令。

            const insert = ancestor.data.hook.insert
            if (insert.merged) {
              // start at index 1 to avoid re-invoking component mounted hook
              // 从索引1开始,避免重新调用组件的mounted钩子
              for (let i = 1; i < insert.fns.length; i++) {
                insert.fns[i]()
              }
            }
          } else {
            // 注册ref
            registerRef(ancestor)
          }
          ancestor = ancestor.parent
        }
      }

      // destroy old node
      // 销毁老节点
      if (isDef(parentElm)) {
        removeVnodes([oldVnode], 0, 0)
      } else if (isDef(oldVnode.tag)) {
        invokeDestroyHook(oldVnode)
      }
    }
  }
  // 调用insert钩子
  invokeInsertHook(vnode, insertedVnodeQueue, isInitialPatch)
  return vnode.elm
}
```
