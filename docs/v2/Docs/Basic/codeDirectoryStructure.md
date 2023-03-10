# 前言

这里主要说一些 vue2.7.14 源码的目录结构，其实这块有些目录并不重要，不过我还是想全面的描述下;

# 内容

```
vue
├─ .editorconfig                       # 编辑器配置
├─ .git-blame-ignore-revs              # 忽略追溯视图中的提交
├─ .github                             # 存放项目指南信息
│    ├─ CODE_OF_CONDUCT.md             # 参与代码贡献的行为准则
│    ├─ COMMIT_CONVENTION.md           # 提交commit信息规范
│    ├─ CONTRIBUTING.md                # 参与代码贡献的指南
│    ├─ FUNDING.yml                    # 赞助信息
│    ├─ ISSUE_TEMPLATE                 # issue的模板配置
│    │    └─ config.yml
│    ├─ PULL_REQUEST_TEMPLATE.md       # Pull和Request指南
│    └─ workflows                      # 工作流配置目录
│           ├─ ci.yml                  # 持续集成的脚本
│           └─ release-tag.yml         # 创建发行版本
├─ .gitignore                          # git忽略配置文件
├─ .prettierrc                         # 代码格式化配置文件
├─ BACKERS.md                          # 捐赠或赞助信息
├─ CHANGELOG.md                        # 版本更新日志
├─ LICENSE                             # 开源版本协议
├─ README.md                           # 项目介绍文档
├─ api-extractor.json                  # api提取器配置文件
├─ api-extractor.tsconfig.json         # api提取器配置文件
├─ benchmarks                          # 性能测试文件
│    ├─ big-table                      # 表格
│    │    ├─ demo.css
│    │    ├─ index.html
│    │    └─ style.css
│    ├─ dbmon                          # 重绘
│    │    ├─ ENV.js
│    │    ├─ app.js
│    │    ├─ index.html
│    │    └─ lib
│    ├─ reorder-list                   # 重新排序列表
│    │    └─ index.html
│    ├─ ssr                            # 服务端渲染
│    │    ├─ README.md                 # 项目介绍文档
│    │    ├─ common.js
│    │    ├─ renderToStream.js
│    │    └─ renderToString.js
│    ├─ svg                            # svg渲染
│    │    └─ index.html
│    └─ uptime                         # 更新渲染
│           └─ index.html
├─ compiler-sfc                        # 编译单文件
│    ├─ index.d.ts
│    ├─ index.js
│    ├─ index.mjs
│    └─ package.json                   # 项目的描述文件
├─ dist                                # 制品输出目录
├─ examples                            # 应用示例目录
│    ├─ classic
│    │    ├─ commits
│    │    ├─ elastic-header
│    │    ├─ firebase
│    │    ├─ grid
│    │    ├─ markdown
│    │    ├─ modal
│    │    ├─ move-animations
│    │    ├─ select2
│    │    ├─ svg
│    │    ├─ todomvc
│    │    └─ tree
│    └─ composition
│           ├─ commits.html
│           ├─ grid.html
│           ├─ markdown.html
│           ├─ svg.html
│           ├─ todomvc.html
│           └─ tree.html
├─ package.json                        # 项目的描述文件
├─ packages                            # 其他独立发布的包目录
│    ├─ compiler-sfc                   # 编译单文件
│    │    ├─ api-extractor.json        # api提取器配置文件
│    │    ├─ package.json              # 项目的描述文件
│    │    ├─ src                       # 源码
│    │    └─ test                      # 测试用例
│    ├─ server-renderer                # 服务端渲染
│    │    ├─ README.md                 # 项目介绍文档
│    │    ├─ basic.js
│    │    ├─ build.dev.js
│    │    ├─ build.prod.js
│    │    ├─ client-plugin.d.ts
│    │    ├─ client-plugin.js
│    │    ├─ index.js
│    │    ├─ package.json              # 项目的描述文件
│    │    ├─ server-plugin.d.ts
│    │    ├─ server-plugin.js
│    │    ├─ src                       # 源码
│    │    ├─ test                      # 测试用例
│    │    └─ types                     # 类型声明
│    └─ template-compiler              # 模板编译
│           ├─ README.md               # 项目介绍文档
│           ├─ browser.js
│           ├─ build.js
│           ├─ index.js
│           ├─ package.json            # 项目的描述文件
│           └─ types                   # 类型声明
├─ pnpm-lock.yaml                      # 版本依赖的锁定文件
├─ pnpm-workspace.yaml                 # 工作空间的配置文件
├─ scripts                             # 构建脚本目录
│    ├─ alias.js                       # 别名配置
│    ├─ build.js                       # 使用rollup对config中配置进行编译
│    ├─ config.js                      # 配置文件
│    ├─ feature-flags.js               # 新特性标记
│    ├─ gen-release-note.js            # 生成发行版本日志
│    ├─ git-hooks                      # git钩子
│    │    ├─ commit-msg
│    │    └─ pre-commit
│    ├─ release.js                     # 版本发布
│    └─ verify-commit-msg.js           # 校验commit信息
├─ src                                 # 源码目录
│    ├─ compiler                       # 编译相关代码
│    │    ├─ codeframe.ts
│    │    ├─ codegen
│    │    ├─ create-compiler.ts
│    │    ├─ directives
│    │    ├─ error-detector.ts
│    │    ├─ helpers.ts
│    │    ├─ index.ts
│    │    ├─ optimizer.ts
│    │    ├─ parser
│    │    └─ to-function.ts
│    ├─ core                            # 核心代码
│    │    ├─ components                 # 组件相关
│    │    ├─ config.ts
│    │    ├─ global-api                 # 全局api
│    │    ├─ index.ts
│    │    ├─ instance                  # vue实例
│    │    ├─ observer
│    │    ├─ util
│    │    └─ vdom
│    ├─ global.d.ts
│    ├─ platforms                       # 平台支持
│    │    └─ web                        # web平台
│    ├─ shared                          # 共享代码
│    │    ├─ constants.ts
│    │    └─ util.ts
│    ├─ types                           # 类型声明
│    │    ├─ compiler.ts
│    │    ├─ component.ts
│    │    ├─ global-api.ts
│    │    ├─ modules.d.ts
│    │    ├─ options.ts
│    │    ├─ ssr.ts
│    │    ├─ utils.ts
│    │    └─ vnode.ts
│    └─ v3                              # vue3移植
│           ├─ apiAsyncComponent.ts
│           ├─ apiInject.ts
│           ├─ apiLifecycle.ts
│           ├─ apiSetup.ts
│           ├─ apiWatch.ts
│           ├─ currentInstance.ts
│           ├─ debug.ts
│           ├─ h.ts
│           ├─ index.ts
│           ├─ reactivity
│           └─ sfc-helpers
├─ test                                 # 测试用例
│    ├─ e2e
│    │    ├─ async-edge-cases.html
│    │    ├─ async-edge-cases.spec.ts
│    │    ├─ basic-ssr.html
│    │    ├─ basic-ssr.spec.ts
│    │    ├─ commits.mock.ts
│    │    ├─ commits.spec.ts
│    │    ├─ e2eUtils.ts
│    │    ├─ grid.spec.ts
│    │    ├─ markdown.spec.ts
│    │    ├─ svg.spec.ts
│    │    ├─ todomvc.spec.ts
│    │    └─ tree.spec.ts
│    ├─ helpers
│    │    ├─ classlist.ts
│    │    ├─ shim-done.ts
│    │    ├─ test-object-option.ts
│    │    ├─ to-have-warned.ts
│    │    ├─ trigger-event.ts
│    │    ├─ vdom.ts
│    │    └─ wait-for-update.ts
│    ├─ test-env.d.ts
│    ├─ transition
│    │    ├─ helpers.ts
│    │    ├─ karma.conf.js
│    │    ├─ package.json
│    │    ├─ transition-group.spec.ts
│    │    ├─ transition-mode.spec.ts
│    │    ├─ transition-with-keep-alive.spec.ts
│    │    └─ transition.spec.ts
│    ├─ tsconfig.json
│    ├─ unit
│    │    ├─ features
│    │    └─ modules
│    └─ vitest.setup.ts
├─ tsconfig.json                            # ts配置文件
├─ types                                    # 类型声明
│    ├─ common.d.ts
│    ├─ index.d.ts
│    ├─ jsx.d.ts
│    ├─ options.d.ts
│    ├─ plugin.d.ts
│    ├─ test
│    │    ├─ async-component-test.ts
│    │    ├─ augmentation-test.ts
│    │    ├─ es-module.ts
│    │    ├─ options-test.ts
│    │    ├─ plugin-test.ts
│    │    ├─ setup-helpers-test.ts
│    │    ├─ umd-test.ts
│    │    ├─ utils.ts
│    │    ├─ v3
│    │    └─ vue-test.ts
│    ├─ tsconfig.json
│    ├─ typings.json
│    ├─ umd.d.ts
│    ├─ v3-component-options.d.ts
│    ├─ v3-component-props.d.ts
│    ├─ v3-component-public-instance.d.ts
│    ├─ v3-define-async-component.d.ts
│    ├─ v3-define-component.d.ts
│    ├─ v3-directive.d.ts
│    ├─ v3-manual-apis.d.ts
│    ├─ v3-setup-context.d.ts
│    ├─ v3-setup-helpers.d.ts
│    ├─ vnode.d.ts
│    └─ vue.d.ts
└─ vitest.config.ts                          # vite配置文件
```

# 在线查看

<iframe id="embed_dom" name="embed_dom" frameborder="0" style="display:block; width:489px; height:275px;" src="https://www.processon.com/embed/640a0171a8175d04f4b0b699"></iframe>
