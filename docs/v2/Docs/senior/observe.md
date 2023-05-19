# 前言

在这里我们详细的来了解下 Vue 的响应式原理;

# 内容

## Object.defineProperty

?> https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty

Vue.js 利用了 Object.defineProperty(obj, key, descriptor)方法来实现响应式;

参数:

```
obj：要定义其属性的对象。
key：要定义或修改的属性的名称或 Symbol 。
descriptor：要定义或修改属性的描述符。
```

#### 描述符默认值汇总

- 拥有布尔值的键 `configurable`、`enumerable` 和 `writable` 的默认值都是 `false`。
- 属性值和函数的键 `value`、`get` 和 `set` 字段的默认值为 `undefined`。

#### 描述符可拥有的键值

|            | `configurable` | `enumerable` | `value` | `writable` | `get`  | `set`  |
| :--------- | :------------- | :----------- | :------ | :--------- | :----- | :----- |
| 数据描述符 | 可以           | 可以         | 可以    | 可以       | 不可以 | 不可以 |
| 存取描述符 | 可以           | 可以         | 不可以  | 不可以     | 可以   | 可以   |

> 对于 Vue 响应式来说最重要的是 get 和 set 方法，在获取属性值的时候触发 getter，设置属性值的时候触发 setter。

### Object.defineProperty 实现

```
const defineReactive = (obj, key, val) => {
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      console.log('get')
      return val
    },
    set: function reactiveSetter (newVal) {
      console.log('set')
      val = newVal
    }
  })
}
const vm = {
  msg: 'Vue.js'
}
let msg = ''
defineReactive(vm, 'msg', vm.msg)
msg = vm.msg          // get
vm.msg = 'React'      // set
msg = vm.msg          // get
```

## proxy

## proxy 实现
