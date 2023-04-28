# 前言
经过`lifecycleMixin`再接下来就到了`renderMixin`，接下来咱们就看看`renderMixin`中到底有什么；

# 内容

> `renderMixin`位于`src/core/instance/render.ts`下；

```ts
export function renderMixin(Vue: typeof Component) {
    // install runtime convenience helpers
    // 挂载各种私有方法
    installRenderHelpers(Vue.prototype)

    // $nextTick定义
    // https://v2.cn.vuejs.org/v2/api/#vm-nextTick
    Vue.prototype.$nextTick = function (fn: (...args: any[]) => any) {
        return nextTick(fn, this)
    }

    // _render定义 || 将模板转为VNode
    // https://v2.cn.vuejs.org/v2/api/#render
    Vue.prototype._render = function (): VNode {
        const vm: Component = this
        const { render, _parentVnode } = vm.$options

        if (_parentVnode && vm._isMounted) {
            // 作用域插槽
            vm.$scopedSlots = normalizeScopedSlots(
                vm.$parent!,
                _parentVnode.data!.scopedSlots,
                vm.$slots,
                vm.$scopedSlots
            )
            if (vm._slotsProxy) {
                syncSetupSlots(vm._slotsProxy, vm.$scopedSlots)
            }
        }

        // set parent vnode. this allows render functions to have access
        // to the data on the placeholder node.
        vm.$vnode = _parentVnode!
        // render self
        let vnode
        try {
            // There's no need to maintain a stack because all render fns are called
            // separately from one another. Nested component's render fns are called
            // when parent component is patched.
            setCurrentInstance(vm)
            currentRenderingInstance = vm
            vnode = render.call(vm._renderProxy, vm.$createElement)
        } catch (e: any) {
            handleError(e, vm, `render`)
            // return error render result,
            // or previous vnode to prevent render error causing blank component
            /* istanbul ignore else */
            if (__DEV__ && vm.$options.renderError) {
                try {
                    vnode = vm.$options.renderError.call(
                        vm._renderProxy,
                        vm.$createElement,
                        e
                    )
                } catch (e: any) {
                    handleError(e, vm, `renderError`)
                    vnode = vm._vnode
                }
            } else {
                vnode = vm._vnode
            }
        } finally {
            currentRenderingInstance = null
            setCurrentInstance()
        }
        // if the returned array contains only a single node, allow it
        if (isArray(vnode) && vnode.length === 1) {
            vnode = vnode[0]
        }
        // return empty vnode in case the render function errored out
        if (!(vnode instanceof VNode)) {
            if (__DEV__ && isArray(vnode)) {
                warn(
                    'Multiple root nodes returned from render function. Render function ' +
                    'should return a single root node.',
                    vm
                )
            }
            vnode = createEmptyVNode()
        }
        // set parent
        vnode.parent = _parentVnode
        return vnode
    }
}
```

### 总结

```
1. 私有方法挂载
2. $nextTick定义
3. _render定义
```