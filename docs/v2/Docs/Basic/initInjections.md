# 前言

前面我们简单的了解了 vue 初始化时的一些大概的流程，这里我们详细的了解下具体的内容;

# 内容

这一块主要围绕`init.ts`中的`initInjections`进行剖析，初始化生命周期之后紧接着。

## initInjections

> `initInjections`的方法位于`scr/core/instance/inject.ts`中；

```ts
export function initInjections(vm: Component) {
  // 解析inject，返回解析后的对象
  const result = resolveInject(vm.$options.inject, vm)
  if (result) {
    // 这里是为了告诉defineReactive不需要转为为响应式数据
    // 这里也正好印证了官方文档中provide 和 inject 绑定并不是可响应的。这是刻意为之的
    toggleObserving(false)
    Object.keys(result).forEach(key => {
      /* istanbul ignore else */
      if (__DEV__) {
        defineReactive(vm, key, result[key], () => {
          warn(
            `Avoid mutating an injected value directly since the changes will be ` +
              `overwritten whenever the provided component re-renders. ` +
              `injection being mutated: "${key}"`,
            vm
          )
        })
      } else {
        defineReactive(vm, key, result[key])
      }
    })
    toggleObserving(true)
  }
}

export function resolveInject(
  inject: any,
  vm: Component
): Record<string, any> | undefined | null {
  if (inject) {
    // inject is :any because flow is not smart enough to figure out cached
    // inject 是 any类型 因为flow不够智能无法计算缓存
    // 创建一个空对象用来存放结果
    const result = Object.create(null)
    // 获取key名
    // https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Reflect/ownKeys
    // 如果支持symbol和Reflect就使用 Reflect.ownKeys来获取所有key，否则使用Object.keys
    const keys = hasSymbol ? Reflect.ownKeys(inject) : Object.keys(inject)

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      // #6574 in case the inject object is observed...
      // 如果是observed就跳过继续
      if (key === '__ob__') continue
      const provideKey = inject[key].from
      if (provideKey in vm._provided) {
        // 向父级_provided属性遍历查找属性值
        // 因为父级组件使用provide选项注入数据时会将注入的数据存入自身实例的_provided属性上
        result[key] = vm._provided[provideKey]
      } else if ('default' in inject[key]) {
        // 当前的数据key存在默认值即default属性
        // 需要对非原始值使用一个工厂方法可结合官方文档demo查看
        const provideDefault = inject[key].default
        result[key] = isFunction(provideDefault)
          ? provideDefault.call(vm)
          : provideDefault
      } else if (__DEV__) {
        warn(`Injection "${key as string}" not found`, vm)
      }
    }
    return result
  }
}
```
