# 前言

前面我们简单的了解了 vue 初始化时的一些大概的流程，这里我们详细的了解下具体的内容;

# 内容

这一块主要围绕`init.ts`中的`initState`进行剖析。

## initState

> `initState`的方法位于`scr/core/instance/state.ts`中；