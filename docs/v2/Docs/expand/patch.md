# 前言

前面我们简单的了解了 vue 初始化时的一些大概的流程，这里我们扩展下 Vue 的 patch。

# 内容

这一块主要围绕 vue 中的`__patch__`进行剖析。

## \_\_patch\_\_

> `Vue.prototype.__patch__`的方法位于`scr/platforms/web/runtime/index.ts`中；

```ts
// install platform patch function
// 判断是否是浏览器环境，是就赋予patch否则就赋予空函数
Vue.prototype.__patch__ = inBrowser ? patch : noop
```

## patch.ts

> `patch.ts`位于`src/platforms/web/runtime/patch.ts`

?> 虚拟 DOM 算法基于[snabbdom](https://github.com/paldepind/snabbdom)进行修改

```ts
// the directive module should be applied last, after all
// built-in modules have been applied.
// 在应用了所有内置模块之后，最后再应用指令模块
const modules = platformModules.concat(baseModules)

export const patch: Function = createPatchFunction({ nodeOps, modules })
```
