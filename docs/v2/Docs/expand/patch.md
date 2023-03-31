# 前言

前面我们简单的了解了 vue 初始化时的一些大概的流程，这里我们扩展下 Vue 的 patch。

# 内容

这一块主要围绕 vue 中的`__patch__`进行剖析。

## \_\_patch\_\_

> `Vue.prototype.__patch__`的方法位于`scr/platforms/web/runtime/index.ts`中；
