# 前言

前面我们简单的了解了 vue 初始化时的一些大概的流程，这里我们详细的了解下具体的内容;这块建议搭建可以根据 demo 进行 debugger 来观察；

# 内容

这一块主要围绕`init.ts`中的`initEvents`进行剖析，初始化生命周期之后紧接着。

## initEvents

> `initEvents`的方法位于`scr/core/instance/events.ts`中；

```ts
export function initEvents(vm: Component) {
  // 创建一个空对象存放_events
  vm._events = Object.create(null)
  // 创建一个生命周期监听事件的标识属性
  // Hook Event 可以从组件外部为组件注入额外的生命周期方法
  vm._hasHookEvent = false
  // init parent attached events
  // 获取initInternalComponent(options合并时候)的父组件自定义事件
  const listeners = vm.$options._parentListeners
  if (listeners) {
    // 进行事件绑定，将父级的事件绑定到当前组件上
    updateComponentListeners(vm, listeners)
  }
}

let target: any

function add(event, fn) {
  target.$on(event, fn)
}

function remove(event, fn) {
  target.$off(event, fn)
}

function createOnceHandler(event, fn) {
  const _target = target
  return function onceHandler() {
    const res = fn.apply(null, arguments)
    if (res !== null) {
      _target.$off(event, onceHandler)
    }
  }
}

export function updateComponentListeners(
  vm: Component,
  listeners: Object,
  oldListeners?: Object | null
) {
  target = vm
  // 更新事件|事件注册
  updateListeners(
    listeners, // 父级事件
    oldListeners || {},
    add, // 处理$on
    remove, // 处理$off
    createOnceHandler, //处理$once
    vm
  )
  target = undefined
}
```

## update-listeners.ts

> `updateListeners`位于`src/core/vdom/helpers/update-listeners.ts`下；

```ts
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
```

## 总结

<iframe style="display:block;width:489px; height:275px;" src="https://excalidraw.com/#json=RtUFXsPJ0538Xh_00UB2F,9YWzP_MDdcM3OKWEQQJ4zg"></iframe>
