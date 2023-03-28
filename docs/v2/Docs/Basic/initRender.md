# 前言

前面我们简单的了解了 vue 初始化时的一些大概的流程，这里我们详细的了解下具体的内容;

# 内容

这一块主要围绕`init.ts`中的`initRender`进行剖析。

## initRender

> `initRender`位于`src/core/instance/render.ts`

```ts
export function initRender(vm: Component) {
  vm._vnode = null // the root of the child tree
  vm._staticTrees = null // v-once cached trees
  const options = vm.$options
  const parentVnode = (vm.$vnode = options._parentVnode!) // the placeholder node in parent tree
  const renderContext = parentVnode && (parentVnode.context as Component)
  // 插槽
  // https://v2.cn.vuejs.org/v2/api/#vm-slots
  vm.$slots = resolveSlots(options._renderChildren, renderContext)
  // 作用域插槽
  // https://v2.cn.vuejs.org/v2/api/#vm-scopedSlots
  vm.$scopedSlots = parentVnode
    ? normalizeScopedSlots(
        vm.$parent!,
        parentVnode.data!.scopedSlots,
        vm.$slots
      )
    : emptyObject
  // bind the createElement fn to this instance
  // so that we get proper render context inside it.
  // args order: tag, data, children, normalizationType, alwaysNormalize
  // internal version is used by render functions compiled from templates
  // @ts-expect-error
  // 将createElement函数绑定到实例上，以保证正确的上下文渲染顺序，
  // 内部版本使用的渲染函数来自模板编译
  vm._c = (a, b, c, d) => createElement(vm, a, b, c, d, false)
  // normalization is always applied for the public version, used in
  // user-written render functions.
  // 公共版本使用用户编写的渲染函数
  // @ts-expect-error
  vm.$createElement = (a, b, c, d) => createElement(vm, a, b, c, d, true)

  // $attrs & $listeners are exposed for easier HOC creation.
  // they need to be reactive so that HOCs using them are always updated
  const parentData = parentVnode && parentVnode.data

  /* istanbul ignore else */
  if (__DEV__) {
    defineReactive(
      vm,
      '$attrs',
      (parentData && parentData.attrs) || emptyObject,
      () => {
        !isUpdatingChildComponent && warn(`$attrs is readonly.`, vm)
      },
      true
    )
    defineReactive(
      vm,
      '$listeners',
      options._parentListeners || emptyObject,
      () => {
        !isUpdatingChildComponent && warn(`$listeners is readonly.`, vm)
      },
      true
    )
  } else {
    // 通过defineReactive将$attrs和$listeners设置为响应式数据 | 这一块后面再详说
    // emptyObject 返回一个被冻结的对象空对象，不能被修改其原型也不能被修改

    // 包含了父作用域中不作为 prop 被识别 (且获取) 的 attribute 绑定 (class 和 style 除外)。
    // 当一个组件没有声明任何 prop 时，这里会包含所有父作用域的绑定(class 和 style 除外)，
    // 并且可以通过 v-bind="$attrs" 传入内部组件——在创建高级别的组件时非常有用。
    // https://v2.cn.vuejs.org/v2/api/?#vm-attrs

    defineReactive(
      vm,
      '$attrs',
      (parentData && parentData.attrs) || emptyObject,
      null,
      true
    )
    // 包含了父作用域中的 (不含 .native 修饰器的) v-on 事件监听器。
    // 它可以通过 v-on="$listeners" 传入内部组件——在创建更高层次的组件时非常有用。
    // https://v2.cn.vuejs.org/v2/api/?#vm-listeners
    defineReactive(
      vm,
      '$listeners',
      options._parentListeners || emptyObject,
      null,
      true
    )
  }
}
```

## resolveSlots

> `resolveSlots` 位于 `src/core/instance/render-helpers/resolve-slots.ts`

```ts
**
 * Runtime helper for resolving raw children VNodes into a slot object.
 *
 * 将children VNodes 转化为 slot 对象
 */
export function resolveSlots(
  children: Array<VNode> | null | undefined,
  context: Component | null
): { [key: string]: Array<VNode> } {
  // 如果不存在子节点直接返回空对象
  if (!children || !children.length) {
    return {}
  }
  // 定义一个slots空对象，存放slot
  const slots: Record<string, any> = {}

  // 对子节点进行遍历
  for (let i = 0, l = children.length; i < l; i++) {
    const child = children[i]
    const data = child.data
    // remove slot attribute if the node is resolved as a Vue slot node
    // 如果节点是slot节点的话就移除slot的属性
    if (data && data.attrs && data.attrs.slot) {
      // 删除该节点attrs的slot
      delete data.attrs.slot
    }
    // named slots should only be respected if the vnode was rendered in the
    // same context.
    // 判断是否为具名插槽
    // https://v2.cn.vuejs.org/v2/guide/components-slots.html#%E5%85%B7%E5%90%8D%E6%8F%92%E6%A7%BD
    if (
      (child.context === context || child.fnContext === context) &&
      data &&
      data.slot != null
    ) {
      // 获取插槽的名字
      const name = data.slot
      // 插槽名字不存在则赋值为空数组
      const slot = slots[name] || (slots[name] = [])
      // 如果是template元素将child.children添加到数组中
      if (child.tag === 'template') {
        slot.push.apply(slot, child.children || [])
      } else {
        slot.push(child)
      }
    } else {
      // 返回匿名的slot，名字是default
      ;(slots.default || (slots.default = [])).push(child)
    }
  }
  // ignore slots that contains only whitespace
  // 忽略空白内容的插槽
  for (const name in slots) {
    // 利用every检测指定的slots数组下的所有结果是否能够通过isWhitespace的测试
    // 全部通过才会返回true
    if (slots[name].every(isWhitespace)) {
      delete slots[name]
    }
  }
  return slots
}

function isWhitespace(node: VNode): boolean {
  return (node.isComment && !node.asyncFactory) || node.text === ' '
}

```
