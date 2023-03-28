import { warn, hasSymbol, isFunction, isObject } from '../util/index'
import { defineReactive, toggleObserving } from '../observer/index'
import type { Component } from 'types/component'
import { resolveProvided } from 'v3/apiInject'

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
