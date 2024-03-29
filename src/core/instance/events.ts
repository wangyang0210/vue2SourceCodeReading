import type { Component } from 'types/component'
import {
    tip,
    toArray,
    isArray,
    hyphenate,
    formatComponentName,
    invokeWithErrorHandling
} from '../util/index'
import { updateListeners } from '../vdom/helpers/index'

export function initEvents(vm: Component) {
    // 创建一个空对象存放_events
    vm._events = Object.create(null)
    // 创建一个生命周期监听事件的标识属性
    // Hook Event 可以从组件外部为组件注入额外的生命周期方法
    vm._hasHookEvent = false
    // init parent attached events
    // 获取initInternalComponent(options合并时候)的父组件自定义事件
    const listeners = vm.$options._parentListeners
    if (listeners) {
        // 进行事件绑定，将父级的事件绑定到当前组件上
        updateComponentListeners(vm, listeners)
    }
}

let target: any

function add(event, fn) {
    target.$on(event, fn)
}

function remove(event, fn) {
    target.$off(event, fn)
}

function createOnceHandler(event, fn) {
    const _target = target
    return function onceHandler() {
        const res = fn.apply(null, arguments)
        if (res !== null) {
            _target.$off(event, onceHandler)
        }
    }
}

export function updateComponentListeners(
    vm: Component,
    listeners: Object,
    oldListeners?: Object | null
) {
    target = vm
    // 更新事件|事件注册
    updateListeners(
        listeners, // 父级事件
        oldListeners || {},
        add, // 处理$on
        remove, // 处理$off
        createOnceHandler, //处理$once
        vm
    )
    target = undefined
}

export function eventsMixin(Vue: typeof Component) {
    const hookRE = /^hook:/
    // https://v2.cn.vuejs.org/v2/api/#vm-on
    Vue.prototype.$on = function (
        event: string | Array<string>,
        fn: Function
    ): Component {
        const vm: Component = this
        // 是数组的话就递归调用$on
        if (isArray(event)) {
            for (let i = 0, l = event.length; i < l; i++) {
                vm.$on(event[i], fn)
            }
        } else {
            ; (vm._events[event] || (vm._events[event] = [])).push(fn)
            // optimize hook:event cost by using a boolean flag marked at registration
            // instead of a hash lookup
            if (hookRE.test(event)) {
                vm._hasHookEvent = true
            }
        }
        return vm
    }

    // https://v2.cn.vuejs.org/v2/api/#vm-once
    Vue.prototype.$once = function (event: string, fn: Function): Component {
        const vm: Component = this
        function on() {
            // 监听器触发后就移除
            vm.$off(event, on)
            fn.apply(vm, arguments)
        }
        on.fn = fn
        vm.$on(event, on)
        return vm
    }

    // https://v2.cn.vuejs.org/v2/api/#vm-off
    Vue.prototype.$off = function (
        event?: string | Array<string>,
        fn?: Function
    ): Component {
        const vm: Component = this
        // 没有提供参数，则移除所有的事件监听器
        if (!arguments.length) {
            vm._events = Object.create(null)
            return vm
        }
        // 提供了事件与回调，则只移除这个回调的监听器
        if (isArray(event)) {
            for (let i = 0, l = event.length; i < l; i++) {
                vm.$off(event[i], fn)
            }
            return vm
        }
        // specific event
        const cbs = vm._events[event!]
        // 提供了没有监听的event
        if (!cbs) {
            return vm
        }
        // 只提供了事件，则移除该事件所有的监听器
        if (!fn) {
            vm._events[event!] = null
            return vm
        }
        // specific handler
        // 同时提供了事件与回调，则只移除这个回调的监听器
        let cb
        let i = cbs.length
        while (i--) {
            cb = cbs[i]
            if (cb === fn || cb.fn === fn) {
                cbs.splice(i, 1)
                break
            }
        }
        return vm
    }
    // https://v2.cn.vuejs.org/v2/api/#vm-emit
    Vue.prototype.$emit = function (event: string): Component {
        const vm: Component = this
        if (__DEV__) {
            const lowerCaseEvent = event.toLowerCase()
            if (lowerCaseEvent !== event && vm._events[lowerCaseEvent]) {
                tip(
                    `Event "${lowerCaseEvent}" is emitted in component ` +
                    `${formatComponentName(
                        vm
                    )} but the handler is registered for "${event}". ` +
                    `Note that HTML attributes are case-insensitive and you cannot use ` +
                    `v-on to listen to camelCase events when using in-DOM templates. ` +
                    `You should probably use "${hyphenate(
                        event
                    )}" instead of "${event}".`
                )
            }
        }
        // 从_events中取出对应的event并赋给cbs
        let cbs = vm._events[event]
        if (cbs) {
            cbs = cbs.length > 1 ? toArray(cbs) : cbs
            const args = toArray(arguments, 1)
            const info = `event handler for "${event}"`
            // 遍历cbs数组、调用并传参
            for (let i = 0, l = cbs.length; i < l; i++) {
                // 使用try-catch包裹运行的代码出错时会直接抛给handleError进行处理
                invokeWithErrorHandling(cbs[i], vm, args, vm, info)
            }
        }
        return vm
    }
}
