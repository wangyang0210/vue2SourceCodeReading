# 前言

前面我们简单的了解了 vue 初始化时的一些大概的流程，这里我们详细的了解下具体的内容;

# 内容

这一块主要围绕`init.ts`中的`initProvide`进行剖析，初始化生命周期之后紧接着。

## initProvide

```ts
export function initProvide(vm: Component) {
  const provideOption = vm.$options.provide
  if (provideOption) {
    // 获取provided的对象
    const provided = isFunction(provideOption)
      ? provideOption.call(vm)
      : provideOption

    // 如过不是object对象且为null直接返回
    if (!isObject(provided)) {
      return
    }
    // 解析provide
    const source = resolveProvided(vm)
    // IE9 doesn't support Object.getOwnPropertyDescriptors so we have to
    // iterate the keys ourselves.

    const keys = hasSymbol ? Reflect.ownKeys(provided) : Object.keys(provided)
    // IE9不支持Object.getOwnPropertyDescriptors所以这里必须自己去迭代keys
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      Object.defineProperty(
        source,
        key,
        Object.getOwnPropertyDescriptor(provided, key)! // https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/getOwnPropertyDescriptor
      )
    }
  }
}
```

## resolveProvided

> `resolveProvided`位于`src/v3/apilnject.ts`中

```ts
export function resolveProvided(vm: Component): Record<string, any> {
  // by default an instance inherits its parent's provides object
  // but when it needs to provide values of its own, it creates its
  // own provides object using parent provides object as prototype.
  // this way in `inject` we can simply look up injections from direct
  // parent and let the prototype chain do the work.
  // 默认情况下，实例继承其父级的provides对象，
  // 但当它需要提供自己的值时，
  // 它会使用父级provides对象作为原型创建自己的provide对象。
  // 通过这种方式，在“inject”中，我们可以简单地从直接父级查找注入，并让原型链来完成工作。
  const existing = vm._provided
  const parentProvides = vm.$parent && vm.$parent._provided
  // 如果父级上的_provided和实例上的_provided一致，就将父级上的parentProvides赋给实例上的_provided
  // 否则直接返回实例上的属性
  if (parentProvides === existing) {
    return (vm._provided = Object.create(parentProvides))
  } else {
    return existing
  }
}
```
