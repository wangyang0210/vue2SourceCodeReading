import { warn } from 'core/util/index'

export * from './attrs'
export * from './class'
export * from './element'

/**
 * Query an element selector if it's not an element already.
 * 如果元素选择器还不是元素，就查找下
 */
export function query(el: string | Element): Element {
  // 如果元素是字符串通过元素选择器进行查找，查找到就返回
  // 未找到的话开发环境会发出警告并创建div元素返回
  if (typeof el === 'string') {
    const selected = document.querySelector(el)
    if (!selected) {
      __DEV__ && warn('Cannot find element: ' + el)
      return document.createElement('div')
    }
    return selected
  } else {
    return el
  }
}
