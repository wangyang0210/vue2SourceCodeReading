# 前言

按着我的习惯，拿到一个项目首先我会查看项目下的`README.md`其次查看`package.json`，这里也不例外看过 README.md 后，来看下`package.json`;

# 内容

## package.json

> 这里我一般只关注`script`部分，从这里我们再抽丝剥茧。

```
"scripts": {
    "dev": "rollup -w -c scripts/config.js --environment TARGET:full-dev",
    "dev:cjs": "rollup -w -c scripts/config.js --environment TARGET:runtime-cjs-dev",
    "dev:esm": "rollup -w -c scripts/config.js --environment TARGET:runtime-esm",
    "dev:ssr": "rollup -w -c scripts/config.js --environment TARGET:server-renderer",
    "dev:compiler": "rollup -w -c scripts/config.js --environment TARGET:compiler ",
    "build": "node scripts/build.js",
    "build:ssr": "npm run build -- runtime-cjs,server-renderer",
    "build:types": "rimraf temp && tsc --declaration --emitDeclarationOnly --outDir temp && api-extractor run && api-extractor run -c packages/compiler-sfc/api-extractor.json",
    "test": "npm run ts-check && npm run test:types && npm run test:unit && npm run test:e2e && npm run test:ssr && npm run test:sfc",
    "test:unit": "vitest run test/unit",
    "test:ssr": "npm run build:ssr && vitest run server-renderer",
    "test:sfc": "vitest run compiler-sfc",
    "test:e2e": "npm run build -- full-prod,server-renderer-basic && vitest run test/e2e",
    "test:transition": "karma start test/transition/karma.conf.js",
    "test:types": "npm run build:types && tsc -p ./types/tsconfig.json",
    "format": "prettier --write --parser typescript \"(src|test|packages|types)/**/*.ts\"",
    "ts-check": "tsc -p tsconfig.json --noEmit",
    "ts-check:test": "tsc -p test/tsconfig.json --noEmit",
    "bench:ssr": "npm run build:ssr && node benchmarks/ssr/renderToString.js && node benchmarks/ssr/renderToStream.js",
    "release": "node scripts/release.js",
    "changelog": "conventional-changelog -p angular -i CHANGELOG.md -s"
  }
```

根据上面的一些运行命令，我们可以看到 vue 的 dev 是使用[rollup](https://www.rollupjs.com/)来进行打包的，这时候我们直接看`dev`命令对应的配置文件（`scripts/config.js`）里面有些什么。

## 初入 VUE | 寻找入口

- 进入后我们根据命令参数`full-dev`进行搜索，会发现以下代码；

```javascript
  // Runtime+compiler development build (Browser)
  'full-dev': {
    entry: resolve('web/entry-runtime-with-compiler.ts'),
    dest: resolve('dist/vue.js'),
    format: 'umd',
    env: 'development',
    alias: { he: './entity-decoder' },
    banner
  },
```

- 点击 resolve 进行跳转，跳转到 resolve 函数下；

```javascript
const aliases = require('./alias')
const resolve = p => {
  const base = p.split('/')[0]
  if (aliases[base]) {
    return path.resolve(aliases[base], p.slice(base.length + 1))
  } else {
    return path.resolve(__dirname, '../', p)
  }
}
```

- 根据上方的代码，我们再跳转到引入 alias 文件中，这时候不难发现 vue 对应的入口文件是`src/platforms/web/entry-runtime-with-compiler`;

```javascript
const path = require('path')

const resolve = p => path.resolve(__dirname, '../', p)

module.exports = {
  vue: resolve('src/platforms/web/entry-runtime-with-compiler'),
  compiler: resolve('src/compiler'),
  core: resolve('src/core'),
  shared: resolve('src/shared'),
  web: resolve('src/platforms/web'),
  server: resolve('packages/server-renderer/src'),
  sfc: resolve('packages/compiler-sfc/src')
}
```

- vue 入口代码内容

```javascript
import Vue from './runtime-with-compiler'
import * as vca from 'v3'
import { extend } from 'shared/util'

extend(Vue, vca)

import { effect } from 'v3/reactivity/effect'
Vue.effect = effect

export default Vue
```

## 深入 VUE | 深度挖掘

既然都找到 vue 的入口文件，那我们肯定是要继续挖掘的！

- 寻找根源

> 点击`import Vue from './runtime-with-compiler'`引入文件进行跳转，来到`runtime-with-compiler.ts`

```javascript
import config from 'core/config'
import { warn, cached } from 'core/util/index'
import { mark, measure } from 'core/util/perf'

import Vue from './runtime/index'
import { query } from './util/index'
import { compileToFunctions } from './compiler/index'
import {
  shouldDecodeNewlines,
  shouldDecodeNewlinesForHref
} from './util/compat'
import type { Component } from 'types/component'
import type { GlobalAPI } from 'types/global-api'
```

- 再次跳转

> 根据`import Vue from './runtime/index'`的引用，我们可以知道还需要再次跳转`runtime/index.ts`

```javascript
import Vue from 'core/index'
import config from 'core/config'
import { extend, noop } from 'shared/util'
import { mountComponent } from 'core/instance/lifecycle'
import { devtools, inBrowser } from 'core/util/index'
```

- 三次跳转

> 好东西果然藏得比较深，根据`import Vue from 'core/index'`的引用，跳转到`core/index`

```javascript
import Vue from './instance/index'
import { initGlobalAPI } from './global-api/index'
import { isServerRendering } from 'core/util/env'
import { FunctionalRenderContext } from 'core/vdom/create-functional-component'
import { version } from 'v3'
```

- 四次跳转

> 我感觉下面就是见证奇迹的时刻了，来吧！ 根据`import Vue from './instance/index'`的引用，跳转到`./instance/index.ts`

```javascript
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

```

经过了四次的跳转，我们终于到达了传说中的隐秘之地，首先判断如果是开发环境，且不是通过 new 关键字来进行调用的话，就会在控制台打印一个 warning，之后调用了 this.\_init(options)函数。

<iframe id="embed_dom" name="embed_dom" frameborder="0" style="display:block;width:489px; height:275px;" src="https://www.processon.com/embed/640b393862ef7d4f6ef2ac96"></iframe>

## 补充内容

### package.json 完整的字段解释

```JSON5
{
  "name": "vue",                                                                         // 项目名称
  "version": "2.7.14",                                                                   // 项目版本号
  "packageManager": "pnpm@7.1.0",                                                        // 包管理器
  "description": "Reactive, component-oriented view layer for modern web interfaces.",   // 项目描述
  "main": "dist/vue.runtime.common.js",                                                  // 应用程序入口文件
  "module": "dist/vue.runtime.esm.js",                                                   // 指定ES模块的入口文件
  "unpkg": "dist/vue.js",                                                                // CDN服务重定向
  "jsdelivr": "dist/vue.js",                                                             // CDN服务重定向
  "typings": "types/index.d.ts",                                                         // ts类型定义的入口文件
  "files": [                                                                             // 指定发布内容控制npm包大小
  ],
  "exports": {                                                                           // 配置不同环境下对应的模块入口文件
  },
  "sideEffects": false,                                                                  // 副作用配置
  "scripts": {                                                                           // 脚本命令
  },
  "gitHooks": {                                                                          // git hooks
  },
  "lint-staged": {                                                                       // 对提交到暂存区进行操作
  },
  "repository": {                                                                        // 项目仓库地址
  },
  "keywords": [                                                                          // 项目关键字
  ],
  "author": "Evan You",                                                                  // 作者信息
  "license": "MIT",                                                                      // 开源协议
  "bugs": {                                                                              // bug反馈地址
  },
  "homepage": "https://github.com/vuejs/vue#readme",                                    // 项目主页
  "dependencies": {                                                                     // 运行依赖
  },
  "devDependencies": {                                                                 // 开发依赖
  }
}
```

### global-api.ts

```typeScript
/**
 * @internal
 */
export interface GlobalAPI {
  // new(options?: any): Component
  (options?: any): void
  // vue 实例唯一id
  cid: number
  // 选项参数
  options: Record<string, any>
  // 全局配置
  // https://v2.cn.vuejs.org/v2/api/#%E5%85%A8%E5%B1%80%E9%85%8D%E7%BD%AE
  config: Config
  // 工具函数 | warn extend mergeOptions defineReactive
  util: Object
  // 使用基础 Vue 构造器，创建一个“子类”。参数是一个包含组件选项的对象。
  // https://v2.cn.vuejs.org/v2/api/#Vue-extend
  extend: (options: typeof Component | object) => typeof Component
  // 向响应式对象中添加一个 property，并确保这个新 property
  // 同样是响应式的，且触发视图更新。
  // https://v2.cn.vuejs.org/v2/api/#Vue-set
  set: <T>(target: Object | Array<T>, key: string | number, value: T) => T
  // 删除对象的 property。如果对象是响应式的，确保删除能触发更新视图。
  // 这个方法主要用于避开 Vue 不能检测到 property 被删除的限制，但是你应该很少会使用它。
  // https://v2.cn.vuejs.org/v2/api/#Vue-delete
  delete: <T>(target: Object | Array<T>, key: string | number) => void
  // 在下次 DOM 更新循环结束之后执行延迟回调。
  // 在修改数据之后立即使用这个方法，获取更新后的 DOM。
  // https://v2.cn.vuejs.org/v2/api/#Vue-nextTick
  nextTick: (fn: Function, context?: Object) => void | Promise<any>
  // 安装 Vue.js 插件。
  // 如果插件是一个对象，必须提供 install 方法。
  // 如果插件是一个函数，它会被作为 install 方法。
  // install 方法调用时，会将 Vue 作为参数传入。
  // 该方法需要在调用 new Vue() 之前被调用。
  // https://v2.cn.vuejs.org/v2/api/#Vue-use
  use: (plugin: Function | Object) => GlobalAPI
  // 全局注册一个混入，影响注册之后所有创建的每个 Vue 实例。
  // 插件作者可以使用混入，向组件注入自定义的行为。不推荐在应用代码中使用。
  // https://v2.cn.vuejs.org/v2/api/#Vue-mixin
  mixin: (mixin: Object) => GlobalAPI
  // 将一个模板字符串编译成 render 函数。只在完整版时可用。
  // https://v2.cn.vuejs.org/v2/api/#Vue-compile
  compile: (template: string) => {
    render: Function
    staticRenderFns: Array<Function>
  }
  // 注册或获取全局指令。
  // https://v2.cn.vuejs.org/v2/api/#Vue-directive
  directive: (id: string, def?: Function | Object) => Function | Object | void
  // 注册或获取全局组件。注册还会自动使用给定的 id 设置组件的名称
  // https://v2.cn.vuejs.org/v2/api/#Vue-component
  component: (
    id: string,
    def?: typeof Component | Object
  ) => typeof Component | void
  // 注册或获取全局过滤器。
  // https://v2.cn.vuejs.org/v2/api/#Vue-filter
  filter: (id: string, def?: Function) => Function | void
  // 让一个对象可响应。Vue 内部会用它来处理 data 函数返回的对象
  // https://v2.cn.vuejs.org/v2/api/#Vue-observable
  observable: <T>(value: T) => T

  // allow dynamic method registration
  [key: string]: any
}

```
