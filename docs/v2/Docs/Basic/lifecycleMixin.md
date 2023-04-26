# 前言
经过`eventsMixin`再接下来就到了`lifecycleMixin`，接下来咱们就看看`lifecycleMixin`中到底有什么；

# 内容

> `lifecycleMixin`位于`src/core/instance/lifecycle.ts`下；

```ts
export function lifecycleMixin(Vue: typeof Component) {
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

  Vue.prototype.$forceUpdate = function () {
    const vm: Component = this
    if (vm._watcher) {
      vm._watcher.update()
    }
  }

  Vue.prototype.$destroy = function () {
    const vm: Component = this
    if (vm._isBeingDestroyed) {
      return
    }
    callHook(vm, 'beforeDestroy')
    vm._isBeingDestroyed = true
    // remove self from parent
    const parent = vm.$parent
    if (parent && !parent._isBeingDestroyed && !vm.$options.abstract) {
      remove(parent.$children, vm)
    }
    // teardown scope. this includes both the render watcher and other
    // watchers created
    vm._scope.stop()
    // remove reference from data ob
    // frozen object may not have observer.
    if (vm._data.__ob__) {
      vm._data.__ob__.vmCount--
    }
    // call the last hook...
    vm._isDestroyed = true
    // invoke destroy hooks on current rendered tree
    vm.__patch__(vm._vnode, null)
    // fire destroyed hook
    callHook(vm, 'destroyed')
    // turn off all instance listeners.
    vm.$off()
    // remove __vue__ reference
    if (vm.$el) {
      vm.$el.__vue__ = null
    }
    // release circular reference (#6759)
    if (vm.$vnode) {
      vm.$vnode.parent = null
    }
  }
}
```

## 总结

```
1. _update定义
2. $forceUpdate定义
3. $destroy定义
```