# 前言
经过`initMixin`再接下来就到了`stateMixin`，接下来咱们就看看`stateMixin`中到底有什么；

# 内容

> `stateMixin`位于`src/core/instance/state.ts`下；

```ts
export function stateMixin(Vue: typeof Component) {
    // flow somehow has problems with directly declared definition object
    // when using Object.defineProperty, so we have to procedurally build up
    // the object here.
    // $data
    const dataDef: any = {}
    dataDef.get = function () {
        return this._data
    }
    // $props
    const propsDef: any = {}
    propsDef.get = function () {
        return this._props
    }
    // 开发环境下针对set行为的警告
    if (__DEV__) {
        dataDef.set = function () {
            // 不可以替换根实例上的$data
            warn(
                'Avoid replacing instance root $data. ' +
                'Use nested data properties instead.',
                this
            )
        }
        // $props是只读的
        propsDef.set = function () {
            warn(`$props is readonly.`, this)
        }
    }
    // 将dataDef和propsDef 添加到原型链上
    // https://v2.cn.vuejs.org/v2/api/#vm-data
    Object.defineProperty(Vue.prototype, '$data', dataDef)
    // https://v2.cn.vuejs.org/v2/api/#vm-props
    Object.defineProperty(Vue.prototype, '$props', propsDef)

    // 将set和del方法挂载到原型链上 || 位于observer/index.ts
    // https://v2.cn.vuejs.org/v2/api/#Vue-set
    Vue.prototype.$set = set
    // https://v2.cn.vuejs.org/v2/api/#Vue-delete
    Vue.prototype.$delete = del

    // $watch方法定义
    // https://v2.cn.vuejs.org/v2/api/#vm-watch
    Vue.prototype.$watch = function (
        expOrFn: string | (() => any),
        cb: any,
        options?: Record<string, any>
    ): Function {
        const vm: Component = this
        if (isPlainObject(cb)) {
            return createWatcher(vm, expOrFn, cb, options)
        }
        options = options || {}
        options.user = true
        // 位于obeserver/watcher.ts
        const watcher = new Watcher(vm, expOrFn, cb, options)
        // 立即触发回调
        if (options.immediate) {
            const info = `callback for immediate watcher "${watcher.expression}"`
            pushTarget()
            invokeWithErrorHandling(cb, vm, [watcher.value], vm, info)
            popTarget()
        }
        // 返回一个取消观察函数，用来停止触发回调
        return function unwatchFn() {
            watcher.teardown()
        }
    }
}

```

## 总结

```
1. $data定义
2. $props定义
3. $set定义
4. $delete定义
5. $watch定义
```