import config from '../config'
import { warn } from './debug'
import { inBrowser } from './env'
import { isPromise } from 'shared/util'
import { pushTarget, popTarget } from '../observer/dep'

export function handleError(err: Error, vm: any, info: string) {
  // Deactivate deps tracking while processing error handler to avoid possible infinite rendering.
  // See: https://github.com/vuejs/vuex/issues/1505
  // 处理错误的时候停止deps跟踪防止无限渲染
  pushTarget()
  try {
    if (vm) {
      let cur = vm
      // 循环查找$parent直到查找到vue根实例上，因为根实例上不存在$parent也就是undefined
      while ((cur = cur.$parent)) {
        // 获取钩子errorCaptured
        const hooks = cur.$options.errorCaptured
        if (hooks) {
          for (let i = 0; i < hooks.length; i++) {
            try {
              // 如果errorCaptured返回的为false直接return
              const capture = hooks[i].call(cur, err, vm, info) === false
              if (capture) return
            } catch (e: any) {
              // 执行errorCaptured发生错误时调用globalHandleError
              globalHandleError(e, cur, 'errorCaptured hook')
            }
          }
        }
      }
    }
    // 全局的捕获
    globalHandleError(err, vm, info)
  } finally {
    popTarget()
  }
}

export function invokeWithErrorHandling(
  handler: Function,
  context: any,
  args: null | any[],
  vm: any,
  info: string
) {
  let res
  // 通过try catch进行错误的捕获，如果捕获到错误就调用handleError函数
  try {
    // https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Function/call
    // call() 方法接受的是一个参数列表，而 apply() 方法接受的是一个包含多个参数的数组
    // 如果存在args则通过apply进行处理或者通过call进行处理
    res = args ? handler.apply(context, args) : handler.call(context)
    // 如果存在res & res不是vue实例 & res是个promise函数 & res._handled不为true
    if (res && !res._isVue && isPromise(res) && !(res as any)._handled) {
      res.catch(e => handleError(e, vm, info + ` (Promise/async)`))
      // issue #9511
      // avoid catch triggering multiple times when nested calls
      // 将_handled设置为true避免在嵌套函数中多次触发catch
      ;(res as any)._handled = true
    }
  } catch (e: any) {
    handleError(e, vm, info)
  }
  return res
}

function globalHandleError(err, vm, info) {
  // https://v2.cn.vuejs.org/v2/api/#errorHandler
  // 如果全局配置存在.errorHandler则调用errorHandler输出错误信息
  // 没配置的话在浏览器环境下会通过console.error打印错误
  if (config.errorHandler) {
    try {
      return config.errorHandler.call(null, err, vm, info)
    } catch (e: any) {
      // if the user intentionally throws the original error in the handler,
      // do not log it twice
      // 如果通过errorHandler处理发生了错误，就直接抛出防止错误被二次打印
      if (e !== err) {
        logError(e, null, 'config.errorHandler')
      }
    }
  }
  logError(err, vm, info)
}

function logError(err, vm, info) {
  if (__DEV__) {
    warn(`Error in ${info}: "${err.toString()}"`, vm)
  }
  /* istanbul ignore else */
  if (inBrowser && typeof console !== 'undefined') {
    console.error(err)
  } else {
    throw err
  }
}
