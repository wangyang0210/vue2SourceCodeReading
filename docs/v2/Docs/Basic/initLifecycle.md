# 前言

前面我们简单的了解了 vue 初始化时的一些大概的流程，这里我们详细的了解下具体的内容;这块建议搭建可以根据 demo 进行 debugger 来观察；

# 内容

这一块主要围绕`init.ts`中的`initLifecycle`进行剖析，参数合并完成之后就开始了初始化生命周期。

## initLifecycle

> `initLifecycle`的方法位于`scr/core/instance/lifecycle.ts`中；

```typeScript
export function initLifecycle(vm: Component) {
  // 合并后的options
  const options = vm.$options

  // locate first non-abstract parent
  let parent = options.parent
  // 存在父级并且不是抽象组件（如：keep-alive、transition）
  if (parent && !options.abstract) {
    // 找到不是抽象组件的实例
    while (parent.$options.abstract && parent.$parent) {
      parent = parent.$parent
    }
    // 将该实例推入父实例的$children数组中
    parent.$children.push(vm)
  }
  // https://v2.cn.vuejs.org/v2/api/#vm-parent
  // 父实例
  vm.$parent = parent
  // https://v2.cn.vuejs.org/v2/api/#vm-root
  // 如果当前实例没有父实例那实例就是自己
  vm.$root = parent ? parent.$root : vm
  // https://v2.cn.vuejs.org/v2/api/#vm-children
  // 当前实例的子组件，$children既不保证顺序也不是响应式的；
  vm.$children = []
  // https://v2.cn.vuejs.org/v2/guide/components-edge-cases.html#%E8%AE%BF%E9%97%AE%E5%AD%90%E7%BB%84%E4%BB%B6%E5%AE%9E%E4%BE%8B%E6%88%96%E5%AD%90%E5%85%83%E7%B4%A0
  // 当 ref 和 v-for 一起使用的时候，你得到的 ref 将会是一个包含了对应数据源的这些子组件的数组
  // $refs 只会在组件渲染完成之后生效，并且它们不是响应式的。
  // 避免在模板或计算属性中访问 $refs
  vm.$refs = {}

  // 如果父实例不存在那就赋予_provided空对象
  vm._provided = parent ? parent._provided : Object.create(null)
  // 初始化监听属性
  vm._watcher = null
  // 初始化active属性
  vm._inactive = null
  // 标记指令状态
  vm._directInactive = false
  // 标记mounted状态
  vm._isMounted = false
  // 标记destroyed状态
  vm._isDestroyed = false
  // 标记BeingDestroyed状态
  vm._isBeingDestroyed = false
}
```

?> 估计有朋友肯定发现了`lifecycleMixin`方法，这就是`scr/core/instance/index.ts`中生命周期混入的方法，不过这个我们不放在这里讲，我们放到后面再说；
