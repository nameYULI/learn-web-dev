Cursor 使用技巧

场景：Cursor + 大型项目
原文链接：https://mp.weixin.qq.com/s/vK8_G4YR07VFreegxiDnmQ

步骤：
Step 1：理解代码库
Step 2：明确目标/搞清变动
Step 3：制定计划
Step 4：执行变更

技巧：
（1）使用 Chat 模式
（2）设置中开启 Include Project Structure 
（3）定义清晰明确的 rules，并通过 Glob 表达式针对指定类型文件自动关联规则。rules 可以说明项目结构、基础组件库文档等信息。
（4）针对大模块生成/改动，使用 Ask 模式，把相关资料和你的描述，投喂给 AI ，生成一个代码生成 Plan
示例：
```
- 制定一个关于如何创建新功能的计划（类似于 @existingfeature.ts）
- 如有任何问题，请向我提问（最多 3 个）
- 请务必搜索代码库
- @Past Chats（我之前的探索提示）
- 以下是来自 [项目管理工具] 的更多背景信息：
- [粘贴的工单描述]

```
（5）善用 Cursor 模式
- Ask 模式：生成计划
- Agent 模式：根据计划生成代码
（6）代码生成过程中，不断完善 Plan，更新 Plan
（7）缩小更改的范围，不要尝试一次执行太多动作

———————————————————————————————————

Cursor 中帮助模型获取文档的工具有三个：

1、@Docs (官方文档集成)
2、@Web (实时网络搜索)
3、MCP（模型上下文协议）

总结：用@Docs 引入官方文档，用@Web 引入社区知识，用 MCP 连接内部系统/知识库，结合内外部文档资源，我们就可以让Cursor更好的理解代码，生成代码。


——————————————————————————————— 


Rules 如果过多，需要进行结构化拆分。
示例：
```
.cursor/rules/
├── README.mdc              # 总体概述和指引
├── architecture.mdc        # 系统架构规范
├── frontend/
│   ├── component.mdc       # 前端组件开发规范
│   ├── styling.mdc         # 样式和主题规范
│   └── state.mdc           # 状态管理规范
├── backend/
│   ├── api-design.mdc      # API 设计规范
│   ├── database.mdc        # 数据库使用规范
│   └── platform-adapter.mdc # 平台适配器规范
├── workflow/
│   ├── git.mdc             # Git 使用规范
│   └── ci-cd.mdc           # CI/CD 流程规范
└── code-quality/
    ├── naming.mdc          # 命名规范
    ├── testing.mdc         # 测试规范
    └── performance.mdc     # 性能优化规范

```
注意：rules 需要在你使用过程中不断进行优化，不断给 AI “立新规矩”


————————————————————————————————— 

学会使用 Cursor 去读代码。

传统读代码的几个典型痛点：
- 高上下文切换成本；
- 复杂依赖关系；
- 注释不完整；
- 命名不规范；
- 历史版本不清晰；

示例：
"帮我分析下项目整体架构"
"给我画个架构图"
"帮我分析核心流程和入口文件"
"分析这个函数具体初始化了哪些服务"
"逐行分析这个函数中每行代码的作用"