# 前言

前面我们简单的了解了 vue 初始化时的一些大概的流程，这里我们详细的了解下具体的内容;

# 内容

这一块主要围绕`init.ts`中的`initState`进行剖析。

## initState

> `initState`的方法位于`scr/core/instance/state.ts`中；

```ts
const sharedPropertyDefinition = {
  enumerable: true,
  configurable: true,
  get: noop,
  set: noop
}

export function proxy(target: Object, sourceKey: string, key: string) {
  // get方法
  sharedPropertyDefinition.get = function proxyGetter() {
    return this[sourceKey][key]
  }
  // set方法
  sharedPropertyDefinition.set = function proxySetter(val) {
    this[sourceKey][key] = val
  }
  Object.defineProperty(target, key, sharedPropertyDefinition)
}

export function initState(vm: Component) {
  const opts = vm.$options
  // 存在props则初始化props
  if (opts.props) initProps(vm, opts.props)

  // Composition API
  // 初始化组合式API
  initSetup(vm)
  // 存在方法则初始化方法
  if (opts.methods) initMethods(vm, opts.methods)
  // 存在data则初始化data
  if (opts.data) {
    initData(vm)
  } else {
    const ob = observe((vm._data = {}))
    ob && ob.vmCount++
  }
  // 存在计算属性则初始化计算属性
  if (opts.computed) initComputed(vm, opts.computed)
  // 存在监听且监听不等于nativeWatch（这个主要是针对火狐浏览器进行处理）则初始化监听
  if (opts.watch && opts.watch !== nativeWatch) {
    initWatch(vm, opts.watch)
  }
}

function initProps(vm: Component, propsOptions: Object) {
  const propsData = vm.$options.propsData || {}
  const props = (vm._props = shallowReactive({}))
  // cache prop keys so that future props updates can iterate using Array
  // instead of dynamic object key enumeration.
  // 缓存prop的keys以便将来更新props时可以使用数组代替动态的迭代对象key
  const keys: string[] = (vm.$options._propKeys = [])
  // 判断是否是根组件
  const isRoot = !vm.$parent
  // root instance props should be converted
  if (!isRoot) {
    // 如果不是根组件就关闭响应式处理,防止defineReactive做响应式处理
    toggleObserving(false)
  }
  for (const key in propsOptions) {
    keys.push(key)
    // 对prop数据进行校验
    const value = validateProp(key, propsOptions, propsData, vm)
    /* istanbul ignore else */
    if (__DEV__) {
      const hyphenatedKey = hyphenate(key)
      // 检查属性是否是保留属性
      if (
        isReservedAttribute(hyphenatedKey) ||
        config.isReservedAttr(hyphenatedKey)
      ) {
        warn(
          `"${hyphenatedKey}" is a reserved attribute and cannot be used as component prop.`,
          vm
        )
      }
      defineReactive(props, key, value, () => {
        if (!isRoot && !isUpdatingChildComponent) {
          warn(
            `Avoid mutating a prop directly since the value will be ` +
              `overwritten whenever the parent component re-renders. ` +
              `Instead, use a data or computed property based on the prop's ` +
              `value. Prop being mutated: "${key}"`,
            vm
          )
        }
      })
    } else {
      defineReactive(props, key, value)
    }
    // static props are already proxied on the component's prototype
    // during Vue.extend(). We only need to proxy props defined at
    // instantiation here.
    // 在Vue.extend（）过程中，静态props已经在组件的原型上被代理。我们只需要在这里实例化时代理定义的props。
    if (!(key in vm)) {
      proxy(vm, `_props`, key)
    }
  }
  // 开启响应式处理
  toggleObserving(true)
}

/**
 * 初始化data
 * @param vm
 */
function initData(vm: Component) {
  let data: any = vm.$options.data
  // 通过getData将函数转为对象
  data = vm._data = isFunction(data) ? getData(data, vm) : data || {}
  if (!isPlainObject(data)) {
    data = {}
    // https://v2.cn.vuejs.org/v2/guide/components.html#data-%E5%BF%85%E9%A1%BB%E6%98%AF%E4%B8%80%E4%B8%AA%E5%87%BD%E6%95%B0
    // 一个组件的 data 选项必须是一个函数，因此每个实例可以维护一份被返回对象的独立的拷贝
    // 避免了实例之间相互影响
    __DEV__ &&
      warn(
        'data functions should return an object:\n' +
          'https://v2.vuejs.org/v2/guide/components.html#data-Must-Be-a-Function',
        vm
      )
  }
  // proxy data on instance
  const keys = Object.keys(data)
  const props = vm.$options.props
  const methods = vm.$options.methods
  let i = keys.length
  while (i--) {
    const key = keys[i]
    // 检查key名是否在methods中已经使用
    if (__DEV__) {
      if (methods && hasOwn(methods, key)) {
        warn(`Method "${key}" has already been defined as a data property.`, vm)
      }
    }
    // 检查key名是否在props中使用
    if (props && hasOwn(props, key)) {
      __DEV__ &&
        warn(
          `The data property "${key}" is already declared as a prop. ` +
            `Use prop default value instead.`,
          vm
        )
      // 检查key名是否符合规范,即不以$和_开头
    } else if (!isReserved(key)) {
      // 代理数据 |本质上还是 Object.defineProperty
      proxy(vm, `_data`, key)
    }
  }
  // observe data | 响应式数据
  const ob = observe(data)
  ob && ob.vmCount++
}
/**
 * 获取data内容|转为对象
 * @param data
 * @param vm
 * @returns
 */
export function getData(data: Function, vm: Component): any {
  // #7573 disable dep collection when invoking data getters
  pushTarget()
  try {
    return data.call(vm, vm)
  } catch (e: any) {
    handleError(e, vm, `data()`)
    return {}
  } finally {
    popTarget()
  }
}

const computedWatcherOptions = { lazy: true }

function initComputed(vm: Component, computed: Object) {
  // $flow-disable-line
  // 创建一个空对象
  const watchers = (vm._computedWatchers = Object.create(null))
  // computed properties are just getters during SSR
  // 计算的内容只是SSR期间的getter
  // 是否服务端渲染
  const isSSR = isServerRendering()

  for (const key in computed) {
    const userDef = computed[key]
    const getter = isFunction(userDef) ? userDef : userDef.get
    if (__DEV__ && getter == null) {
      warn(`Getter is missing for computed property "${key}".`, vm)
    }

    if (!isSSR) {
      // create internal watcher for the computed property.
      // 不是服务端渲染,就为计算属性创建内部观察程序。
      // noop 空函数：function() {}
      watchers[key] = new Watcher(
        vm,
        getter || noop,
        noop,
        computedWatcherOptions
      )
    }

    // component-defined computed properties are already defined on the
    // component prototype. We only need to define computed properties defined
    // at instantiation here.
    // 组件定义的计算内容已经在组件原型上定义。我们只需要在这里定义实例化时定义的计算内容。
    if (!(key in vm)) {
      defineComputed(vm, key, userDef)
    } else if (__DEV__) {
      // 开发环境下检查key名是否被过早的定义在data,props,methods中
      if (key in vm.$data) {
        warn(`The computed property "${key}" is already defined in data.`, vm)
      } else if (vm.$options.props && key in vm.$options.props) {
        warn(`The computed property "${key}" is already defined as a prop.`, vm)
      } else if (vm.$options.methods && key in vm.$options.methods) {
        warn(
          `The computed property "${key}" is already defined as a method.`,
          vm
        )
      }
    }
  }
}

export function defineComputed(
  target: any,
  key: string,
  userDef: Record<string, any> | (() => any)
) {
  // 是否服务端渲染
  const shouldCache = !isServerRendering()
  // 定义get和set
  if (isFunction(userDef)) {
    sharedPropertyDefinition.get = shouldCache
      ? createComputedGetter(key)
      : createGetterInvoker(userDef)
    sharedPropertyDefinition.set = noop
  } else {
    sharedPropertyDefinition.get = userDef.get
      ? shouldCache && userDef.cache !== false
        ? createComputedGetter(key)
        : createGetterInvoker(userDef.get)
      : noop
    sharedPropertyDefinition.set = userDef.set || noop
  }
  if (__DEV__ && sharedPropertyDefinition.set === noop) {
    sharedPropertyDefinition.set = function () {
      warn(
        `Computed property "${key}" was assigned to but it has no setter.`,
        this
      )
    }
  }
  Object.defineProperty(target, key, sharedPropertyDefinition)
}

function createComputedGetter(key) {
  return function computedGetter() {
    const watcher = this._computedWatchers && this._computedWatchers[key]
    if (watcher) {
      // 是否被计算过,如果dirty为true表明未被计算过
      if (watcher.dirty) {
        watcher.evaluate() // 调用watcher.get方法,值会保存在watcher.value上
      }
      if (Dep.target) {
        if (__DEV__ && Dep.target.onTrack) {
          Dep.target.onTrack({
            effect: Dep.target,
            target: this,
            type: TrackOpTypes.GET,
            key
          })
        }
        watcher.depend()
      }
      return watcher.value
    }
  }
}

function createGetterInvoker(fn) {
  return function computedGetter() {
    return fn.call(this, this)
  }
}

function initMethods(vm: Component, methods: Object) {
  const props = vm.$options.props
  // 循环遍历methods
  for (const key in methods) {
    if (__DEV__) {
      // 不是函数类型发出警告
      if (typeof methods[key] !== 'function') {
        warn(
          `Method "${key}" has type "${typeof methods[
            key
          ]}" in the component definition. ` +
            `Did you reference the function correctly?`,
          vm
        )
      }
      // 函数名称和props中的是否冲突
      if (props && hasOwn(props, key)) {
        warn(`Method "${key}" has already been defined as a prop.`, vm)
      }
      // 函数名不能以_和$开头
      if (key in vm && isReserved(key)) {
        warn(
          `Method "${key}" conflicts with an existing Vue instance method. ` +
            `Avoid defining component methods that start with _ or $.`
        )
      }
    }
    // 将methods绑定在当前实例上
    vm[key] = typeof methods[key] !== 'function' ? noop : bind(methods[key], vm)
  }
}

function initWatch(vm: Component, watch: Object) {
  // 遍历watch
  for (const key in watch) {
    const handler = watch[key]
    // 是否是数组
    if (isArray(handler)) {
      // 循环创建watcher监听回调函数
      for (let i = 0; i < handler.length; i++) {
        createWatcher(vm, key, handler[i])
      }
    } else {
      // 创建watcher监听回调函数
      createWatcher(vm, key, handler)
    }
  }
}

function createWatcher(
  vm: Component,
  expOrFn: string | (() => any),
  handler: any,
  options?: Object
) {
  // 检查是否是普通对象
  if (isPlainObject(handler)) {
    // 将handler挂载到options属性上
    options = handler
    // 提取handler属性赋值给handler
    handler = handler.handler
  }
  // 是否是字符串
  if (typeof handler === 'string') {
    // 从实例中找到handler赋值给handler
    handler = vm[handler]
  }
  // 实例上的$watch方法
  return vm.$watch(expOrFn, handler, options)
}
```
