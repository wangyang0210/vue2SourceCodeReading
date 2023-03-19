# 前言

前面我们简单的了解了 vue 初始化时的一些大概的流程，这里我们详细的了解下具体的内容;
这块建议搭建可以根据 demo 进行 debugger 来观察；

# 内容

这一块主要围绕`init.ts`中的`mergeOptions`进行剖析。

## mergeOptions

> `mergeOptions`的方法位于`scr/core/util/options.ts`中;

```typeScript
/**
 * Option overwriting strategies are functions that handle
 * how to merge a parent option value and a child option
 * value into the final value.
 * 选项合并策略 处理合并parent选项值和child选项值并转为最终的值
 */
const strats = config.optionMergeStrategies

/**
 * Options with restrictions
 *
 */
if (__DEV__) {
  strats.el = strats.propsData = function (
    parent: any,
    child: any,
    vm: any,
    key: any
  ) {
    if (!vm) {
      warn(
        `option "${key}" can only be used during instance ` +
          'creation with the `new` keyword.'
      )
    }
    return defaultStrat(parent, child)
  }
}

/**
 * Helper that recursively merges two data objects together.
 *
 * 合并data选项
 *
 */
function mergeData(
  to: Record<string | symbol, any>,
  from: Record<string | symbol, any> | null,
  recursive = true
): Record<PropertyKey, any> {
  if (!from) return to
  let key, toVal, fromVal

  const keys = hasSymbol
    ? (Reflect.ownKeys(from) as string[])
    : Object.keys(from)

  for (let i = 0; i < keys.length; i++) {
    key = keys[i]
    // in case the object is already observed...
    // 跳过已经存在响应式的对象
    if (key === '__ob__') continue
    toVal = to[key]
    fromVal = from[key]
    if (!recursive || !hasOwn(to, key)) {
      // 对数据进行响应式处理
      set(to, key, fromVal)
    } else if (
      toVal !== fromVal &&
      isPlainObject(toVal) &&
      isPlainObject(fromVal)
    ) {
      // 如果parent和child都有值却不相等而且两个都是对象的时候,继续递归合并
      mergeData(toVal, fromVal)
    }
  }
  return to
}

/**
 * Data
 *
 * 合并作为函数的data
 */
export function mergeDataOrFn(
  parentVal: any,
  childVal: any,
  vm?: Component
): Function | null {
  // 判断是否存在vue实例
  if (!vm) {
    // in a Vue.extend merge, both should be functions
    // 在Vue.extend的合并中,两个参数都应该是函数
    if (!childVal) {
      return parentVal
    }
    if (!parentVal) {
      return childVal
    }
    // when parentVal & childVal are both present,
    // 当parentVal和childVal都存在的时候
    // we need to return a function that returns the
    // 我们需要返回一个函数
    // merged result of both functions... no need to
    // 该函数返回两者合并的结果
    // check if parentVal is a function here because
    // 不需要去检查parentVal是否是一个函数因为
    // it has to be a function to pass previous merges.
    // 他肯定是先前合并的函数
    return function mergedDataFn() {
      // 合并data数据
      return mergeData(
        isFunction(childVal) ? childVal.call(this, this) : childVal,
        isFunction(parentVal) ? parentVal.call(this, this) : parentVal
      )
    }
  } else {
    // 合并实例data函数
    return function mergedInstanceDataFn() {
      // instance merge
      // child 数据
      const instanceData = isFunction(childVal)
        ? childVal.call(vm, vm)
        : childVal
      // 默认数据
      const defaultData = isFunction(parentVal)
        ? parentVal.call(vm, vm)
        : parentVal
      // 如果child存在数据则进行合并否则直接返回默认数据
      if (instanceData) {
        return mergeData(instanceData, defaultData)
      } else {
        return defaultData
      }
    }
  }
}

strats.data = function (
  parentVal: any,
  childVal: any,
  vm?: Component
): Function | null {
  if (!vm) {
    // dev环境下会判断child是否为函数,不是的话则发出警告并返回parentVal
    if (childVal && typeof childVal !== 'function') {
      __DEV__ &&
        warn(
          'The "data" option should be a function ' +
            'that returns a per-instance value in component ' +
            'definitions.',
          vm
        )
      return parentVal
    }
    return mergeDataOrFn(parentVal, childVal)
  }

  return mergeDataOrFn(parentVal, childVal, vm)
}

/**
 * Hooks and props are merged as arrays.
 *
 * 生命周期合并策略会将生命周期内的钩子函数和props转化为数组格式并合并到一个数组中
 */
export function mergeLifecycleHook(
  parentVal: Array<Function> | null,
  childVal: Function | Array<Function> | null
): Array<Function> | null {
  const res = childVal
    ? parentVal
      ? parentVal.concat(childVal)
      : isArray(childVal)
      ? childVal
      : [childVal]
    : parentVal
  return res ? dedupeHooks(res) : res
}

function dedupeHooks(hooks: any) {
  const res: Array<any> = []
  for (let i = 0; i < hooks.length; i++) {
    if (res.indexOf(hooks[i]) === -1) {
      res.push(hooks[i])
    }
  }
  return res
}

LIFECYCLE_HOOKS.forEach(hook => {
  strats[hook] = mergeLifecycleHook
})

/**
 * Assets
 *
 * When a vm is present (instance creation), we need to do
 * a three-way merge between constructor options, instance
 * options and parent options.
 * 当存在vm(实例创建)时,我们需要在构造函数选项、实例和父选之间进行三方合并
 *
 */
function mergeAssets(
  parentVal: Object | null,
  childVal: Object | null,
  vm: Component | null,
  key: string
): Object {
  const res = Object.create(parentVal || null)
  if (childVal) {
    __DEV__ && assertObjectType(key, childVal, vm)
    // 将child合并到parentVal中会进行覆盖
    return extend(res, childVal)
  } else {
    return res
  }
}

ASSET_TYPES.forEach(function (type) {
  strats[type + 's'] = mergeAssets
})

/**
 * Watchers.
 *
 * Watchers hashes should not overwrite one
 * another, so we merge them as arrays.
 *监听不应该被覆盖，所以使用数组格式进行合并
 *
 * watch合并
 */
strats.watch = function (
  parentVal: Record<string, any> | null,
  childVal: Record<string, any> | null,
  vm: Component | null,
  key: string
): Object | null {
  // work around Firefox's Object.prototype.watch...
  // nativeWatch 兼容火狐浏览器，因为火狐浏览器原型上存在watch
  //@ts-expect-error work around
  if (parentVal === nativeWatch) parentVal = undefined
  //@ts-expect-error work around
  if (childVal === nativeWatch) childVal = undefined
  /* istanbul ignore if */
  if (!childVal) return Object.create(parentVal || null)
  if (__DEV__) {
    assertObjectType(key, childVal, vm)
  }
  if (!parentVal) return childVal
  const ret: Record<string, any> = {}
  extend(ret, parentVal)
  for (const key in childVal) {
    let parent = ret[key]
    const child = childVal[key]
    if (parent && !isArray(parent)) {
      parent = [parent]
    }
    ret[key] = parent ? parent.concat(child) : isArray(child) ? child : [child]
  }
  return ret
}

/**
 * Other object hashes.
 *
 * 对象合并，存在childVal的话以childVal为准
 */
strats.props =
  strats.methods =
  strats.inject =
  strats.computed =
    function (
      parentVal: Object | null,
      childVal: Object | null,
      vm: Component | null,
      key: string
    ): Object | null {
      if (childVal && __DEV__) {
        assertObjectType(key, childVal, vm)
      }
      if (!parentVal) return childVal
      const ret = Object.create(null)
      extend(ret, parentVal)
      if (childVal) extend(ret, childVal)
      return ret
    }

/**
 * provide合并
 */
strats.provide = function (parentVal: Object | null, childVal: Object | null) {
  if (!parentVal) return childVal
  return function () {
    const ret = Object.create(null)
    mergeData(ret, isFunction(parentVal) ? parentVal.call(this) : parentVal)
    if (childVal) {
      // 不进行递归合并
      mergeData(
        ret,
        isFunction(childVal) ? childVal.call(this) : childVal,
        false // non-recursive
      )
    }
    return ret
  }
}

/**
 * Default strategy.
 * 默认值策略 | 避免parentVal被未定义的childVal覆盖
 */
const defaultStrat = function (parentVal: any, childVal: any): any {
  return childVal === undefined ? parentVal : childVal
}

/**
 * Validate component names
 * 校验组件名是否合法 | 避免组件名称使用保留的关键字或者不符合html5规范
 */
function checkComponents(options: Record<string, any>) {
  for (const key in options.components) {
    validateComponentName(key)
  }
}

export function validateComponentName(name: string) {
  if (
    !new RegExp(`^[a-zA-Z][\\-\\.0-9_${unicodeRegExp.source}]*$`).test(name)
  ) {
    warn(
      'Invalid component name: "' +
        name +
        '". Component names ' +
        'should conform to valid custom element name in html5 specification.'
    )
  }
  if (isBuiltInTag(name) || config.isReservedTag(name)) {
    warn(
      'Do not use built-in or reserved HTML elements as component ' +
        'id: ' +
        name
    )
  }
}

/**
 * Ensure all props option syntax are normalized into the
 * Object-based format.
 *
 * 格式化object对象 | 确保所有的props选项的语法都符合对象格式
 */
function normalizeProps(options: Record<string, any>, vm?: Component | null) {
  const props = options.props
  // 不存在props则直接return
  if (!props) return
  const res: Record<string, any> = {}
  let i, val, name
  // 判断是否是数组
  if (isArray(props)) {
    i = props.length
    while (i--) {
      val = props[i]
      if (typeof val === 'string') {
        // 使用驼峰来代替-连字符
        name = camelize(val)
        res[name] = { type: null }
      } else if (__DEV__) {
        // 如果是dev环境则发出警告，提示在数组语法下props必须为字符串
        warn('props must be strings when using array syntax.')
      }
    }
  } else if (isPlainObject(props)) {
    // 判断是否为对象
    for (const key in props) {
      val = props[key]
      // 使用驼峰来代替-连字符
      name = camelize(key)
      res[name] = isPlainObject(val) ? val : { type: val }
    }
  } else if (__DEV__) {
    // 如果是dev环境则发出警告，提示props应该是一个数组或者对象
    warn(
      `Invalid value for option "props": expected an Array or an Object, ` +
        `but got ${toRawType(props)}.`,
      vm
    )
  }
  options.props = res
}

/**
 * Normalize all injections into Object-based format
 *
 * 将所有的inject格式化object对象
 */
function normalizeInject(options: Record<string, any>, vm?: Component | null) {
  const inject = options.inject
  if (!inject) return
  const normalized: Record<string, any> = (options.inject = {})
  if (isArray(inject)) {
    for (let i = 0; i < inject.length; i++) {
      normalized[inject[i]] = { from: inject[i] }
    }
  } else if (isPlainObject(inject)) {
    for (const key in inject) {
      const val = inject[key]
      normalized[key] = isPlainObject(val)
        ? extend({ from: key }, val)
        : { from: val }
    }
  } else if (__DEV__) {
    // 开发环境下如果inject格式不是数组或者对象则发出警告
    warn(
      `Invalid value for option "inject": expected an Array or an Object, ` +
        `but got ${toRawType(inject)}.`,
      vm
    )
  }
}

/**
 * Normalize raw function directives into object format.
 *
 *将原始的指令函数转为object对象格式
 */
function normalizeDirectives(options: Record<string, any>) {
  const dirs = options.directives
  if (dirs) {
    for (const key in dirs) {
      const def = dirs[key]
      if (isFunction(def)) {
        dirs[key] = { bind: def, update: def }
      }
    }
  }
}

// 开发环境下，会进行检测，如果不是对象的话发出警告
function assertObjectType(name: string, value: any, vm: Component | null) {
  if (!isPlainObject(value)) {
    warn(
      `Invalid value for option "${name}": expected an Object, ` +
        `but got ${toRawType(value)}.`,
      vm
    )
  }
}

/**
 * Merge two option objects into a new one.
 * Core utility used in both instantiation and inheritance.
 *
 * 将两个option对象合并成一个新的对象
 * 用于实例化和继承的核心工具
 */
export function mergeOptions(
  parent: Record<string, any>,
  child: Record<string, any>,
  vm?: Component | null
): ComponentOptions {
  // dev环境下会检查组件名称是否合法
  if (__DEV__) {
    checkComponents(child)
  }

  // 检查option是否是函数,是的话直接将options赋值给child
  if (isFunction(child)) {
    // @ts-expect-error
    child = child.options
  }

  // 格式化props为object对象 | 检测格式是否为数组和对象，并使用驼峰代替-连字符，开发环境下如果格式存在问题会发出警告
  normalizeProps(child, vm)
  // 格式化inject为object对象 | 检测格式是否为数组和对象，开发环境下如果格式存在问题会发出警告
  normalizeInject(child, vm)
  // 格式化directive为object对象
  normalizeDirectives(child)

  // Apply extends and mixins on the child options,
  // 在子选项上去应用 extends和mixins
  // but only if it is a raw options object that isn't
  // the result of another mergeOptions call.
  // 前提是它是一个原始选项对象,而不是另一个mergeOptions的结果
  // Only merged options has the _base property.
  // 只合并具有_base属性的合并选项
  if (!child._base) {
    // 合并extends到parent
    if (child.extends) {
      parent = mergeOptions(parent, child.extends, vm)
    }
    // 合并mixins到parent
    if (child.mixins) {
      for (let i = 0, l = child.mixins.length; i < l; i++) {
        parent = mergeOptions(parent, child.mixins[i], vm)
      }
    }
  }

  const options: ComponentOptions = {} as any
  let key
  for (key in parent) {
    mergeField(key)
  }
  for (key in child) {
    if (!hasOwn(parent, key)) {
      mergeField(key)
    }
  }
  // 合并parent和child选项
  function mergeField(key: any) {
    const strat = strats[key] || defaultStrat
    options[key] = strat(parent[key], child[key], vm, key)
  }
  return options
}

/**
 * Resolve an asset.
 * 解析资源
 * This function is used because child instances need access
 * to assets defined in its ancestor chain.
 * 使用这个函数是因为子实例中需要访问其祖先中定义的资源
 */
export function resolveAsset(
  options: Record<string, any>,
  type: string,
  id: string,
  warnMissing?: boolean
): any {
  /* istanbul ignore if */
  if (typeof id !== 'string') {
    return
  }
  const assets = options[type]
  // check local registration variations first
  if (hasOwn(assets, id)) return assets[id]
  const camelizedId = camelize(id)
  if (hasOwn(assets, camelizedId)) return assets[camelizedId]
  const PascalCaseId = capitalize(camelizedId)
  if (hasOwn(assets, PascalCaseId)) return assets[PascalCaseId]
  // fallback to prototype chain
  const res = assets[id] || assets[camelizedId] || assets[PascalCaseId]
  if (__DEV__ && warnMissing && !res) {
    warn('Failed to resolve ' + type.slice(0, -1) + ': ' + id)
  }
  return res
}
```
