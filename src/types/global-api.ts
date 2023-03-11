import { Config } from 'core/config'
import { Component } from './component'

/**
 * @internal
 */
export interface GlobalAPI {
  // new(options?: any): Component
  (options?: any): void
  // vue 实例唯一id
  cid: number
  // 选项参数
  options: Record<string, any>
  // 全局配置
  // https://v2.cn.vuejs.org/v2/api/#%E5%85%A8%E5%B1%80%E9%85%8D%E7%BD%AE
  config: Config
  // 工具函数 | warn extend mergeOptions defineReactive
  util: Object
  // 使用基础 Vue 构造器，创建一个“子类”。参数是一个包含组件选项的对象。
  // https://v2.cn.vuejs.org/v2/api/#Vue-extend
  extend: (options: typeof Component | object) => typeof Component
  // 向响应式对象中添加一个 property，并确保这个新 property
  // 同样是响应式的，且触发视图更新。
  // https://v2.cn.vuejs.org/v2/api/#Vue-set
  set: <T>(target: Object | Array<T>, key: string | number, value: T) => T
  // 删除对象的 property。如果对象是响应式的，确保删除能触发更新视图。
  // 这个方法主要用于避开 Vue 不能检测到 property 被删除的限制，但是你应该很少会使用它。
  // https://v2.cn.vuejs.org/v2/api/#Vue-delete
  delete: <T>(target: Object | Array<T>, key: string | number) => void
  // 在下次 DOM 更新循环结束之后执行延迟回调。
  // 在修改数据之后立即使用这个方法，获取更新后的 DOM。
  // https://v2.cn.vuejs.org/v2/api/#Vue-nextTick
  nextTick: (fn: Function, context?: Object) => void | Promise<any>
  // 安装 Vue.js 插件。
  // 如果插件是一个对象，必须提供 install 方法。
  // 如果插件是一个函数，它会被作为 install 方法。
  // install 方法调用时，会将 Vue 作为参数传入。
  // 该方法需要在调用 new Vue() 之前被调用。
  // https://v2.cn.vuejs.org/v2/api/#Vue-use
  use: (plugin: Function | Object) => GlobalAPI
  // 全局注册一个混入，影响注册之后所有创建的每个 Vue 实例。
  // 插件作者可以使用混入，向组件注入自定义的行为。不推荐在应用代码中使用。
  // https://v2.cn.vuejs.org/v2/api/#Vue-mixin
  mixin: (mixin: Object) => GlobalAPI
  // 将一个模板字符串编译成 render 函数。只在完整版时可用。
  // https://v2.cn.vuejs.org/v2/api/#Vue-compile
  compile: (template: string) => {
    render: Function
    staticRenderFns: Array<Function>
  }
  // 注册或获取全局指令。
  // https://v2.cn.vuejs.org/v2/api/#Vue-directive
  directive: (id: string, def?: Function | Object) => Function | Object | void
  // 注册或获取全局组件。注册还会自动使用给定的 id 设置组件的名称
  // https://v2.cn.vuejs.org/v2/api/#Vue-component
  component: (
    id: string,
    def?: typeof Component | Object
  ) => typeof Component | void
  // 注册或获取全局过滤器。
  // https://v2.cn.vuejs.org/v2/api/#Vue-filter
  filter: (id: string, def?: Function) => Function | void
  // 让一个对象可响应。Vue 内部会用它来处理 data 函数返回的对象
  // https://v2.cn.vuejs.org/v2/api/#Vue-observable
  observable: <T>(value: T) => T

  // allow dynamic method registration
  [key: string]: any
}
