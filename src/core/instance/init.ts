import config from '../config'
import { initProxy } from './proxy'
import { initState } from './state'
import { initRender } from './render'
import { initEvents } from './events'
import { mark, measure } from '../util/perf'
import { initLifecycle, callHook } from './lifecycle'
import { initProvide, initInjections } from './inject'
import { extend, mergeOptions, formatComponentName } from '../util/index'
import type { Component } from 'types/component'
import type { InternalComponentOptions } from 'types/options'
import { EffectScope } from 'v3/reactivity/effectScope'

// vue 实例id
let uid = 0

export function initMixin(Vue: typeof Component) {
  // 接收实例化传入的参数
  Vue.prototype._init = function (options?: Record<string, any>) {
    //vue 实例
    const vm: Component = this
    // 每个vue实例都有对应的一个实例id
    vm._uid = uid++

    let startTag, endTag
    /* istanbul ignore if */
    // 代码覆盖率测试
    if (__DEV__ && config.performance && mark) {
      startTag = `vue-perf-start:${vm._uid}`
      endTag = `vue-perf-end:${vm._uid}`
      mark(startTag)
    }

    // a flag to mark this as a Vue instance without having to do instanceof
    // check
    // 标记作为vue的实例不必去执行instanceof
    vm._isVue = true
    // avoid instances from being observed
    // 避免实例被observed观察
    vm.__v_skip = true
    // effect scope
    // https://github.com/vuejs/rfcs/blob/master/active-rfcs/0041-reactivity-effect-scope.md
    // 对内部的响应式对象的副作用effect进行统一管理
    vm._scope = new EffectScope(true /* detached */)
    vm._scope._vm = true
    // merge options
    // 合并参数
    // 判断是否是子组件
    if (options && options._isComponent) {
      // optimize internal component instantiation
      // 优化内部组件实例化
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      // 由于动态选项合并非常缓慢，并且没有一个内部组件选项需要特殊处理。
      // 传入vue实例并进行组件初始化
      initInternalComponent(vm, options as any)
    } else {
      // 根组件配置 | 合并参数
      vm.$options = mergeOptions(
        // 解析构造函数参数
        resolveConstructorOptions(vm.constructor as any),
        options || {},
        vm
      )
    }
    /* istanbul ignore else */
    // 代码覆盖测试
    if (__DEV__) {
      initProxy(vm)
    } else {
      vm._renderProxy = vm
    }
    // expose real self
    vm._self = vm
    // 核心的核心
    // 初始化生命周期
    initLifecycle(vm)
    // 初始化事件监听
    initEvents(vm)
    // 初始化渲染
    initRender(vm)
    // 调用生命周期的钩子函数 | beforeCreate
    callHook(vm, 'beforeCreate', undefined, false /* setContext */)
    // https://v2.cn.vuejs.org/v2/api/#provide-inject
    // 在data/props前进行inject
    initInjections(vm) // resolve injections before data/props
    // 初始化状态
    initState(vm)
    // https://v2.cn.vuejs.org/v2/api/#provide-inject
    // provide 父组件提供的数据
    // inject 子组件进行注入后直接使用
    // 在data/props后进行provide
    initProvide(vm) // resolve provide after data/props
    // 调用生命周期钩子函数 | created
    callHook(vm, 'created')

    /* istanbul ignore if */
    //   代码覆盖测试
    if (__DEV__ && config.performance && mark) {
      vm._name = formatComponentName(vm, false)
      mark(endTag)
      measure(`vue ${vm._name} init`, startTag, endTag)
    }

    // 组件如果设置了el则挂载到指定的el上
    if (vm.$options.el) {
      vm.$mount(vm.$options.el)
    }
  }
}

/**
 * 初始化内部组件
 *
 * @param vm
 * @param options
 */
export function initInternalComponent(
  vm: Component,
  options: InternalComponentOptions
) {
  const opts = (vm.$options = Object.create((vm.constructor as any).options))
  // doing this because it's faster than dynamic enumeration.
  // 这样做是因为比动态的枚举更快
  const parentVnode = options._parentVnode
  opts.parent = options.parent
  opts._parentVnode = parentVnode

  const vnodeComponentOptions = parentVnode.componentOptions!
  opts.propsData = vnodeComponentOptions.propsData
  opts._parentListeners = vnodeComponentOptions.listeners
  opts._renderChildren = vnodeComponentOptions.children
  opts._componentTag = vnodeComponentOptions.tag

  if (options.render) {
    opts.render = options.render
    opts.staticRenderFns = options.staticRenderFns
  }
}

/**
 * 解析构造函数的选项
 *
 * @param Ctor
 * @returns
 */
export function resolveConstructorOptions(Ctor: typeof Component) {
  let options = Ctor.options
  // 适配组合式API
  if (Ctor.super) {
    const superOptions = resolveConstructorOptions(Ctor.super)
    const cachedSuperOptions = Ctor.superOptions
    if (superOptions !== cachedSuperOptions) {
      // super option changed,
      // need to resolve new options.
      // options变更时需重新解析
      Ctor.superOptions = superOptions
      // check if there are any late-modified/attached options (#4976)
      // 检查是否有后面修改或者附加的options
      const modifiedOptions = resolveModifiedOptions(Ctor)
      // update base extend options
      // 存在修改则进行合并
      if (modifiedOptions) {
        extend(Ctor.extendOptions, modifiedOptions)
      }
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions)
      if (options.name) {
        options.components[options.name] = Ctor
      }
    }
  }
  return options
}

/**
 * 解析修改的选项
 *
 * @param Ctor
 * @returns
 */
function resolveModifiedOptions(
  Ctor: typeof Component
): Record<string, any> | null {
  let modified
  const latest = Ctor.options
  const sealed = Ctor.sealedOptions
  for (const key in latest) {
    if (latest[key] !== sealed[key]) {
      if (!modified) modified = {}
      modified[key] = latest[key]
    }
  }
  return modified
}
