import { warn, invokeWithErrorHandling } from 'core/util/index'
import { cached, isUndef, isTrue, isArray } from 'shared/util'
import type { Component } from 'types/component'

/**
 * 具有缓存的字符串截断函数
 * 返回真实的事件名称和修饰符声明对象
 */
const normalizeEvent = cached(
  (
    name: string
  ): {
    name: string
    once: boolean
    capture: boolean
    passive: boolean
    handler?: Function
    params?: Array<any>
  } => {
    const passive = name.charAt(0) === '&'
    name = passive ? name.slice(1) : name
    const once = name.charAt(0) === '~' // Prefixed last, checked first
    name = once ? name.slice(1) : name
    const capture = name.charAt(0) === '!'
    name = capture ? name.slice(1) : name
    return {
      name,
      once,
      capture,
      passive
    }
  }
)

/**
 * 返回一个闭包函数invoker()，参数是执行的回调函数
 * 添加invoker.fns 属性
 * 调用invoker时会对invoker.fns进行判断，如果是数组会进行循环遍历调用invokeWithErrorHandling函数否则直接调用
 * invokeWithErrorHandling
 *
 * @param fns
 * @param vm
 * @returns
 */
export function createFnInvoker(
  fns: Function | Array<Function>,
  vm?: Component
): Function {
  function invoker() {
    const fns = invoker.fns
    if (isArray(fns)) {
      const cloned = fns.slice()
      for (let i = 0; i < cloned.length; i++) {
        invokeWithErrorHandling(
          cloned[i],
          null,
          arguments as any,
          vm,
          `v-on handler`
        )
      }
    } else {
      // return handler return value for single handlers
      // 返回处理程序单个处理程序的返回值 || 可以监听自定义事件函数内部的处理错误
      return invokeWithErrorHandling(
        fns,
        null,
        arguments as any,
        vm,
        `v-on handler`
      )
    }
  }
  invoker.fns = fns
  return invoker
}

export function updateListeners(
  on: Object,
  oldOn: Object,
  add: Function,
  remove: Function,
  createOnceHandler: Function,
  vm: Component
) {
  let name, cur, old, event
  for (name in on) {
    cur = on[name]
    old = oldOn[name]
    event = normalizeEvent(name)
    // 如果当前事件属性是否为undefined或者null，是在开发环境下会发出相应的警告
    // isUndef 判断属性是否为undefined或null
    if (isUndef(cur)) {
      __DEV__ &&
        warn(
          `Invalid handler for event "${event.name}": got ` + String(cur),
          vm
        )
    } else if (isUndef(old)) {
      // 如果事件没有fns属性则调用createFnInvoker()进行定义
      // 说明是第一次创建
      if (isUndef(cur.fns)) {
        cur = on[name] = createFnInvoker(cur, vm)
      }
      // 事件存在once标识则调用createOnceHandler() 重新定义该事件
      if (isTrue(event.once)) {
        cur = on[name] = createOnceHandler(event.name, cur, event.capture)
      }
      // 将事件添加到$on属性上
      add(event.name, cur, event.capture, event.passive, event.params)
    } else if (cur !== old) {
      old.fns = cur
      on[name] = old
    }
  }
  for (name in oldOn) {
    if (isUndef(on[name])) {
      // 格式事件，来获取真实的事件名称和修饰符声明对象
      event = normalizeEvent(name)
      // 如果老节点不存在name对应的事件就进行移除$off
      remove(event.name, oldOn[name], event.capture)
    }
  }
}
