# 前言

前面我们简单的了解了 vue 初始化时的一些大概的流程，这里我们详细的了解下具体的内容;

# 内容

这一块主要围绕`init.ts`中的`vm.$mount`进行剖析。

## vm.$mount

> `vm.$mount`是全局的公共方法方法，但是这是我们要找的话就要向上查找了，代码位于`scr/platforms/web/runtime/index.ts`中；

```ts
// public mount method
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  // 浏览器环境下如果存在el，则调用query方法进查询
  el = el && inBrowser ? query(el) : undefined
  return mountComponent(this, el, hydrating)
}
```

## query

> `query`位于`src/platforms/web/util/index.ts`中；

```ts
/**
 * Query an element selector if it's not an element already.
 * 如果元素选择器还不是元素，就查找下
 */
export function query(el: string | Element): Element {
  // 如果元素是字符串通过元素选择器进行查找，查找到就返回
  // 未找到的话开发环境会发出警告并创建div元素返回
  if (typeof el === 'string') {
    const selected = document.querySelector(el)
    if (!selected) {
      __DEV__ && warn('Cannot find element: ' + el)
      return document.createElement('div')
    }
    return selected
  } else {
    return el
  }
}
```

## mountComponent

> `mountComponent`位于`src/core/instance/lifecycle.ts`;

```ts
export function mountComponent(
  vm: Component,
  el: Element | null | undefined,
  hydrating?: boolean
): Component {
  // 挂载点赋值给实例上的$el
  vm.$el = el
  // 如果$options不存在render就创建一个空的虚拟的dom赋予render
  if (!vm.$options.render) {
    // @ts-expect-error invalid type
    vm.$options.render = createEmptyVNode
    // 开发环境下，如果存在配置模板或者el属性会发出警告
    // 需要将模板预编译为渲染函数或者使用包含编译器的版本
    if (__DEV__) {
      /* istanbul ignore if */
      if (
        (vm.$options.template && vm.$options.template.charAt(0) !== '#') ||
        vm.$options.el ||
        el
      ) {
        warn(
          'You are using the runtime-only build of Vue where the template ' +
            'compiler is not available. Either pre-compile the templates into ' +
            'render functions, or use the compiler-included build.',
          vm
        )
      } else {
        warn(
          'Failed to mount component: template or render function not defined.',
          vm
        )
      }
    }
  }
  // 调用生命周期钩子函数beforeMount
  callHook(vm, 'beforeMount')

  let updateComponent
  // 开发环境性能分析相关代码
  /* istanbul ignore if */
  if (__DEV__ && config.performance && mark) {
    updateComponent = () => {
      const name = vm._name
      const id = vm._uid
      const startTag = `vue-perf-start:${id}`
      const endTag = `vue-perf-end:${id}`

      mark(startTag)
      const vnode = vm._render()
      mark(endTag)
      measure(`vue ${name} render`, startTag, endTag)

      mark(startTag)
      vm._update(vnode, hydrating)
      mark(endTag)
      measure(`vue ${name} patch`, startTag, endTag)
    }
  } else {
    // 定义updateComponent调用_update方法对比更新vnode
    updateComponent = () => {
      vm._update(vm._render(), hydrating)
    }
  }

  // watcher选项
  const watcherOptions: WatcherOptions = {
    before() {
      if (vm._isMounted && !vm._isDestroyed) {
        callHook(vm, 'beforeUpdate')
      }
    }
  }

  if (__DEV__) {
    watcherOptions.onTrack = e => callHook(vm, 'renderTracked', [e])
    watcherOptions.onTrigger = e => callHook(vm, 'renderTriggered', [e])
  }

  // we set this to vm._watcher inside the watcher's constructor
  // since the watcher's initial patch may call $forceUpdate (e.g. inside child
  // component's mounted hook), which relies on vm._watcher being already defined
  // 我们将其设置为vm._watcher在watcher的构造函数中，
  // 因为观察程序的初始补丁可能会调用$forceUpdate（例如，在子组件的挂载钩子中），
  // 这依赖于已定义的 vm__watcher
  new Watcher(
    vm,
    updateComponent,
    noop,
    watcherOptions,
    true /* isRenderWatcher */
  )
  hydrating = false

  // flush buffer for flush: "pre" watchers queued in setup()
  // setup中定义的预执行的 watcher,调用 watcher.run方法执行一次
  const preWatchers = vm._preWatchers
  if (preWatchers) {
    for (let i = 0; i < preWatchers.length; i++) {
      preWatchers[i].run()
    }
  }

  // manually mounted instance, call mounted on self
  // mounted is called for render-created child components in its inserted hook

  // 手动挂载实例，并且在首次挂载（$vnode为空）时去触发 mounted钩子
  if (vm.$vnode == null) {
    vm._isMounted = true
    callHook(vm, 'mounted')
  }
  // 返回组件实例对象
  return vm
}
```

## \_update

> `_update`位于`src/core/instance/lifecycle.ts`下的`lifecycleMixin`方法中;

```ts
Vue.prototype._update = function (vnode: VNode, hydrating?: boolean) {
  const vm: Component = this
  // 挂载点真实dom
  const prevEl = vm.$el
  // 老的虚拟dom
  const prevVnode = vm._vnode
  // 设置激活的组件实例对象 | 缓存当前实例,为了处理 keep-alive情况
  const restoreActiveInstance = setActiveInstance(vm)
  // 新的虚拟dom
  vm._vnode = vnode
  // Vue.prototype.__patch__ is injected in entry points
  // based on the rendering backend used.
  // Vue.prototype.__patch__是基于所使用的渲染后端在入口点中注入的
  // __patch__打补丁这里涉及到就是diff算法了
  if (!prevVnode) {
    // initial render | 首次渲染
    vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */)
  } else {
    // updates | 更新
    vm.$el = vm.__patch__(prevVnode, vnode)
  }
  restoreActiveInstance()
  // update __vue__ reference
  // 存在真实的dom节点就重置__vue__再挂载新的
  if (prevEl) {
    prevEl.__vue__ = null
  }
  // 将更新后的vue实例挂载到vm.$el.__vue__缓存
  if (vm.$el) {
    vm.$el.__vue__ = vm
  }
  // if parent is an HOC, update its $el as well
  // 如果当前实例的$vnode与父组件的_vnode相同，也要更新其$el
  let wrapper: Component | undefined = vm
  while (
    wrapper &&
    wrapper.$vnode &&
    wrapper.$parent &&
    wrapper.$vnode === wrapper.$parent._vnode
  ) {
    wrapper.$parent.$el = wrapper.$el
    wrapper = wrapper.$parent
  }
  // updated hook is called by the scheduler to ensure that children are
  // updated in a parent's updated hook.
  // 调度程序调用updated hook，以确保子级在父级的更新hook中得到更新。
}
```

> 接下来我们把**patch**作为扩展单独拿出来说
