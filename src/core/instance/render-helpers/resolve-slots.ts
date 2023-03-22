import type VNode from 'core/vdom/vnode'
import type { Component } from 'types/component'

/**
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
