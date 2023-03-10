import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'
import type { GlobalAPI } from 'types/global-api'

function Vue(options) {
  if (__DEV__ && !(this instanceof Vue)) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}

//@ts-expect-error Vue has function type
//初始化混入 | _init
initMixin(Vue)
//@ts-expect-error Vue has function type
// 状态混入 | $set，$delete，$watch
stateMixin(Vue)
//@ts-expect-error Vue has function type
// 事件混入 | $on $once $off $emit
eventsMixin(Vue)
//@ts-expect-error Vue has function type
// 生命周期混入 | _update $forceUpdate $destroy
lifecycleMixin(Vue)
//@ts-expect-error Vue has function type
// 渲染混入 | $nextTick，_render
renderMixin(Vue)

export default Vue as unknown as GlobalAPI
