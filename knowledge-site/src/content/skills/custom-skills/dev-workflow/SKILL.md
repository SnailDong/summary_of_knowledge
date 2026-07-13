---
name: dev-workflow
description: 当需要启动、恢复、扫描、实现、审查或准备发布非平凡产品/工程任务，并串联需求、设计、测试、观测、实现、review、CI/CD 时使用。
version: "5.0.0"
label: "公开版：研发流程编排"
---

# Dev Workflow

## 适用场景

使用本 skill 当用户需要：

- 开始一个非平凡功能、需求、系统变更或跨模块任务。
- 恢复已有任务、扫描当前项目缺口、生成 task list。
- 从需求推进到设计、测试、观测、实现、review、CI/CD、发布。
- 审计一个项目是否缺需求、设计、测试、可观测性、验证或发布闭环。

## 不适用场景

不使用本 skill 当：

- 一次性小 bugfix 已有明确复现、修复点和验证命令。
- 纯探索、纯解释、纯命令输出，没有交付产物。
- 用户明确只要求某一个单独 skill 的局部工作。

## 触发场景

当用户说出类似下面的话时触发：

- “开发一个新功能：设备保修延保。”
- “开始一个新需求，按完整研发流程走。”
- “继续昨天那个功能，看看现在缺什么。”
- “帮我生成 task list，并标出哪些可以并行。”
- “这个项目第一次进入，先初始化项目级 workspace skill。”
- “从需求到设计、测试、实现、review、发布帮我串起来。”

## 依赖 Skill

本 skill 是流程编排器，显式依赖：

- `story-craftsman`：需求、User Story、AC、范围和非范围。
- `architect`：技术设计、ADR、边界、契约、测试与观测方向。
- `code-review`：合并前审查、风险分级、闭环检查。
- `superpowers:brainstorming`：方案发散。
- `superpowers:writing-plans`：实现计划拆分。
- `superpowers:test-driven-development`：TDD 实现。
- `superpowers:systematic-debugging`：系统化排查失败。
- `superpowers:verification-before-completion`：完成前验证。
- `superpowers:dispatching-parallel-agents`：并行任务派发。
- `superpowers:subagent-driven-development`：子代理驱动开发。

## 角色

这个 skill 是流程编排器。它不替代 story、architecture、review 或 TDD，而是判断当前工作处于哪一阶段、缺什么证据、下一步调用哪个 skill。

## 编排边界

`依赖 Skill` 是可用能力清单；`Workflow` 是实际调用顺序。执行时按阶段判断是否调用对应 skill：

- 阶段需要产出需求、AC 或范围时，调用 `story-craftsman`。
- 阶段需要技术方案、ADR、边界、契约或实现计划时，调用 `architect`，必要时再调用 `superpowers:brainstorming` 或 `superpowers:writing-plans`。
- 阶段进入实现时，调用 `superpowers:test-driven-development`；遇到失败或不明原因时，切换到 `superpowers:systematic-debugging`。
- 阶段需要并行拆分时，调用 `superpowers:dispatching-parallel-agents` 或 `superpowers:subagent-driven-development`。
- 阶段进入完成声明、交付或合并前，调用 `superpowers:verification-before-completion` 和 `code-review`。

## 流程原则

- 非平凡功能必须有需求、设计、测试、观测。
- 用户可见或生产影响变更不能跳过观测。
- 实现前有计划，实现后有 fresh verification。
- 合并前必须 review。
- resume 时先检查状态，不凭聊天记忆继续。
- progress 只是状态摘要，不是事实来源；要用文件和验证交叉确认。

## 状态语言

| 状态 | 判断 | 行动 |
|---|---|---|
| Ready | 产物存在且匹配当前目标 | 可跳过或复核 |
| Drifted | 存在但过期、缺关键内容或与代码不一致 | 更新 |
| Missing | 不存在 | 创建 |
| NotApplicable | 明确不适用 | 写原因 |

交互式模式：每个阶段展示状态并等待确认。扫描模式：一次性扫描，末尾确认一次。

## Workflow：顺序执行总览

本 skill 默认按阶段编号推进。除扫描模式、用户明确要求只检查某一环节，或某阶段被判定为 NotApplicable 外，不跳过前置阶段。

| 阶段 | 目标 | 编排/调用 skill | 产物 | 通过条件 |
|---|---|---|---|---|
| 0. 项目进入 | 建立项目上下文 | 本 skill 内置项目进入协议 | workspace skill 或项目画像 | 规则、命令、文档入口可用 |
| 1. Intake | 明确用户价值、范围、AC | `story-craftsman` | user story | AC 可测试，非范围清楚 |
| 2. Shape | 确定架构、边界、ADR、计划 | `architect`；可选 `superpowers:brainstorming`、`superpowers:writing-plans` | design docs | 方案、取舍、数据/API/状态闭环 |
| 3. Experience | 确认 UI/交互/体验状态 | 本 skill 内置体验检查；必要时回写 story/AC | UI strategy | 关键状态和验收路径清楚 |
| 4. Workspace | 确认本地环境和命令 | 本 skill 内置环境检查；必要时更新 workspace skill | local dev doc | 新人可启动、测试、清理 |
| 5. Test Matrix | 建立 AC 到测试映射 | 本 skill 内置测试矩阵；实现阶段交给 `superpowers:test-driven-development` | testing strategy | 已实现 AC 有验证方式 |
| 6. Signal Plan | 设计观测和度量 | 本 skill 内置观测方案；复杂方案回到 `architect` | observability doc | 成功、失败、影响面可发现 |
| 7. Build | TDD 或等价小步实现 | `superpowers:test-driven-development`；失败时 `superpowers:systematic-debugging`；可并行时 `superpowers:dispatching-parallel-agents` / `superpowers:subagent-driven-development` | code + tests | 相关测试通过，证据更新 |
| 8. Evidence | 汇总本地验证 | `superpowers:verification-before-completion` | command table | fresh verification 可复查 |
| 9. Snapshot | 保存可恢复进度 | 本 skill 内置进度快照协议 | progress | 事实、缺口、下一步清楚 |
| 10. Review | 合并前审查 | `code-review` | review result | 无 Critical，风险有处理 |
| 11. Automation | 确认 CI 门禁 | 本 skill 内置 CI 门禁检查；发现失败用 `superpowers:systematic-debugging` | pipeline config | 关键验证自动执行 |
| 12. Release | 发布、回滚、巡检 | `superpowers:verification-before-completion`；必要时复用 `code-review` 做发布前风险复核 | release docs | 灰度、回滚、上线后检查明确 |

## 0. 项目进入协议

首次进入项目时检查：

- `docs/` 是否存在。
- `AGENTS.md` / `CLAUDE.md` / `GEMINI.md` 是否存在。
- `.agents/skills/{project-slug}-workspace/SKILL.md` 是否存在。

缺文档结构时创建：

```text
docs/product/user-stories/
docs/architecture/
docs/testing/
docs/deployment/
docs/user-guide/
```

### 项目 workspace skill

用途：让新 agent 或新工程师快速理解项目。

路径：

```text
.agents/skills/{project-slug}-workspace/SKILL.md
```

触发：

- 文件不存在。
- 用户要求初始化。
- 架构、技术栈、本地环境、命令或规则明显变化。
- resume 时上下文不足。

信息源：

| 来源 | 提取 |
|---|---|
| architecture overview/map | 系统结构、模块、流程 |
| domain/language model | 术语、实体、状态、ownership |
| service registry / ownership | service、component、owner、lifecycle |
| API registry / contracts | OpenAPI、proto、GraphQL、SDK type |
| deployment registry | artifact、环境、配置、回滚 |
| tech stack doc 或 manifest | 语言、框架、关键依赖 |
| local dev doc | 启动、依赖、测试环境 |
| AGENTS/CLAUDE/GEMINI | 必须遵守的规则 |
| Makefile/package/just/scripts | dev/test/lint/build |
| testing strategy | 测试层级和门禁 |
| CI docs/config | 自动化验证 |

模板：

```markdown
---
name: {project-slug}-workspace
description: Use when working in {project-name} and project-specific architecture, commands, rules, tests, or verification expectations are needed.
---

# {Project Name} Workspace

## 项目摘要
<3-6 条事实摘要>

## 文档入口
- 架构：
- 术语：
- 本地环境：
- 测试：
- 发布：

## 常用命令
| 用途 | 命令 |

## 项目规则
<只摘录必须遵守的规则>

## 工作流入口
- 需求：
- 架构：
- Review：

## 缺口
- [ ] ...
```

不复制完整 PRD、架构文档或测试策略。未知信息放缺口。

## 1. Intake 需求定界

调用 `story-craftsman`。

必须确认：

- 用户/角色。
- 场景和痛点。
- 本期范围。
- 明确不做。
- 优先级。
- 是否核心链路。
- 是否高风险。
- 成功指标。
- AC 覆盖主路径、失败、边界。

产物：

```text
docs/product/user-stories/<feature>.html
```

未通过时不进入阶段 2。

## 2. Shape 方案成型

调用 `architect`，必要时配合 `superpowers:brainstorming` 和 `superpowers:writing-plans`。

必须覆盖：

- Domain/System/Component 或 vertical。
- 候选方案和取舍。
- ADR。
- 数据、API、状态、事件。
- 失败、兼容、迁移、回滚。
- 测试和观测方向。
- 实现计划。

## 3. Experience 体验确认

使用 skill：本 skill 内置体验检查；如 UI 行为影响 AC，回到 `story-craftsman` 更新验收标准。

触发：

- 新页面、弹窗、表单、卡片、设置项。
- 用户路径变化。
- 新空态、错误态、权限态。

检查：

- 页面结构。
- loading/empty/error/success/disabled/permission denied。
- 文案、错误提示、可访问性。
- 响应式或平台差异。
- UI AC 和 E2E 验收。
- UI 行为事件。

产物示例：

```text
docs/ui/ui-implementation-strategy.html
```

无 UI 时写 NotApplicable 原因。

## 4. Workspace 环境确认

使用 skill：本 skill 内置环境检查；若项目级 workspace skill 缺失或过期，按阶段 0 更新。

触发：

- 没有统一启动命令。
- 新 DB/queue/cache/browser/mobile/test dependency。
- 需要本地观测栈。
- 需要多 worktree 并行。

产物：

```text
docs/deployment/local-dev.html
```

必须写：

- 启动、停止、清理。
- 依赖准备。
- 测试环境。
- stub/mock。
- 常见问题。

## 5. Test Matrix 验证矩阵

使用 skill：本 skill 内置测试矩阵；实现阶段必须交给 `superpowers:test-driven-development` 执行测试优先或等价小步验证。

建立 AC 到测试映射。

| 层级 | 目标 |
|---|---|
| Unit | 规则、状态、边界 |
| Integration | API、DB、队列、依赖 |
| E2E/Black-box | 用户 AC |
| Contract | 跨端/跨服务 |
| Migration | schema/backfill/rollback |
| Regression | bugfix |

产物：

```text
docs/testing/strategy.html
```

已实现 AC 必须有验证方式。

## 6. Signal Plan 可观测性方案

使用 skill：本 skill 内置观测方案；如果涉及新架构边界、跨服务链路或复杂降级策略，回到 `architect` 补设计。

用户可见或生产影响功能必做。

产物：

```text
docs/architecture/<feature-or-system>/observability.html
```

完整方案由八组检查项组成：

### 信号检查项 1：范围和风险

| 字段 | 内容 |
|---|---|
| 影响模块 |  |
| 优先级 |  |
| 核心链路 | yes/no |
| 高风险原因 |  |
| 隐私数据 |  |
| 实验/灰度 |  |

### 信号检查项 2：业务度量

定义：

```text
measurement_id = {feature}_{action}_v{n}
```

写清：

- business goal。
- primary metric。
- secondary metrics。
- guardrail metrics。
- funnel steps。
- decision question。

### 信号检查项 3：事件采集

| event | 类型 | 策略 | 触发 | 属性 | 隐私边界 |
|---|---|---|---|---|---|
| viewed | 曝光 | reuse/extend/new |  |  |  |
| clicked | 行为 | reuse/extend/new |  |  |  |
| completed | 结果 | reuse/extend/new |  |  |  |
| failed | 失败 | reuse/extend/new |  |  |  |

### 信号检查项 4：结构化日志

| 节点 | level | action | result | correlation | 禁止字段 |
|---|---|---|---|---|---|

要求：

- 有 trace/request/user 或等价关联字段。
- 错误有分类。
- 不记录 secret/PII 原文。

### 信号检查项 5：指标和链路

技术指标：

- request rate。
- error rate。
- latency。
- operation success/failure。
- dependency success/failure。
- queue/job health。

链路覆盖：

- 入口。
- 关键内部步骤。
- 外部依赖。
- 异步任务。
- 错误和重试路径。

### 信号检查项 6：告警和 SLO

| Alert | 条件 | 持续时间 | 级别 | owner | runbook |
|---|---|---|---|---|---|

P0/P1 必须回答：

- 谁收到。
- 看哪个视图。
- 第一止血动作。
- 回滚方式。
- 恢复判断。

### 信号检查项 7：排障视图

需要的 dashboard/panel：

- KPI。
- funnel。
- experiment/variant。
- service health。
- dependency health。
- failure reasons。

写清数据源、刷新频率、过滤维度、正常范围。

### 信号检查项 8：验证契约

| 类型 | 验证 |
|---|---|
| metrics | 触发行为后能查询 |
| alert | 规则能加载 |
| dashboard | query 可解析 |
| events | 事件和必填属性出现 |
| logs | 字段存在且无敏感数据 |
| traces | 关键 span 存在 |

建议命令：

```text
make test-observability
```

不能自动化时写人工步骤和 owner。

## 7. Build 实现推进

使用 skill：`superpowers:test-driven-development`；失败或原因不明时使用 `superpowers:systematic-debugging`；任务可独立切分时使用 `superpowers:dispatching-parallel-agents` 或 `superpowers:subagent-driven-development`。

执行要求：

- 先写失败测试。
- 最小实现。
- 重构。
- bugfix 先复现。
- 不明失败用系统化排查。

共享状态或高风险任务串行。

## 8. Evidence 本地验证门

使用 skill：`superpowers:verification-before-completion`。

进入 PR/MR 前运行最新验证。

记录：

| 命令 | 结果 | 时间 | 备注 |
|---|---|---|---|

覆盖相关 lint、typecheck、unit、integration、E2E/build。migration、contract、observability 变更要有对应验证。

## 9. Snapshot 进度快照

触发：

- 跨模块、多端、多步。
- resume/continue。
- handoff。
- 实现和设计/测试有差距。

路径示例：

```text
docs/architecture/<system-or-feature>/progress.html
```

内容：

- 目标。
- 已完成。
- 验证证据。
- 缺口。
- 风险。
- 下一步。
- 指向 US、设计、ADR、测试、观测的链接。

## 10. Review 合并前审查

调用 `code-review`。

PR/MR 描述包含：

- 背景。
- 设计链接。
- 验证结果。
- 风险。
- 回滚。

Critical 必须修。Important 要修或写接受风险、owner、后续动作。

## 11. Automation CI 门禁

使用 skill：本 skill 内置 CI 门禁检查；CI 失败且原因不明时使用 `superpowers:systematic-debugging`。

检查：

- lint/format/typecheck。
- unit/integration/e2e。
- build/package。
- migration/contract。
- observability。

不能只有 build，没有测试。

## 12. Release 发布准备

使用 skill：`superpowers:verification-before-completion`；发布前风险较高时复用 `code-review` 做发布前复核。

发布准备：

- 环境。
- 顺序。
- feature flag/灰度。
- config/secret。
- migration/backfill。
- 回滚。
- 上线后验证。

部署后如果有新 API、关键路径、worker、cron、webhook 或静默故障风险，增加 smoke/synthetic/scheduled check，并写 owner 和通知方式。

## 扫描模式

触发：

- `tasklist`
- `resume`
- `continue`
- “看看还缺什么”
- “生成任务清单”

行为：

1. 一次性扫描所有阶段。
2. 不逐步提问。
3. 优先读 progress，但用实际文件和验证结果复核。
4. 输出任务表和批次。
5. 最后只问一次是否派发。

任务表：

| 编号 | 阶段 | 状态 | 产物 | 缺口 | 动作 | 可并行 | 依赖 |
|---|---|---|---|---|---|---|---|

批次：

```text
Batch 1: T1, T2
Batch 2: T3 after T1
Serial: T4
```

扫描模式不降低门禁。

## 交互模板

```markdown
阶段：<名称>
状态：Ready / Drifted / Missing / NotApplicable
产物：<路径>
摘要：<一句话>

是否处理这个阶段？[y/N]
```

## 阻断条件

- 非平凡功能无需求。
- 无设计改跨模块/API/schema/状态机。
- 用户功能无测试策略。
- 用户可见或生产影响功能无观测。
- 无 fresh verification 声称完成。
- 合并前无 review。
- Critical 未修继续推进。
- 生产变更无回滚。
- 已实现 AC 无验证映射。
- progress 过期却当事实。

## 阶段状态扫描细则

扫描阶段时不要只看文件是否存在。每个阶段都要判断“存在、可用、匹配当前目标”三件事。

| 阶段 | 主要入口 | Ready 标准 | Drifted 信号 |
|---|---|---|---|
| Intake | docs/product/user-stories | AC 可测试，范围清楚 | 新代码没有对应 AC |
| Shape | docs/architecture | 有选项、取舍、ADR、计划 | 代码改了 API/schema 但设计没更新 |
| Experience | docs/ui 或设计稿 | 状态、交互、验收清楚 | UI 已改但缺错误态/空态 |
| Workspace | docs/deployment/local-dev | 新人可按文档启动和测试 | 命令失效或依赖缺失 |
| Test Matrix | docs/testing | AC 映射到测试层级 | 新 AC 没测试策略 |
| Signal Plan | observability 文档 | 指标、日志、事件、告警可验证 | 新功能上线后不可观测 |
| Build | 代码和测试 | 红绿重构或等价证据 | 只实现无测试 |
| Evidence | 命令记录 | 最新验证通过 | 结果来自旧上下文 |
| Snapshot | progress 文档 | 能恢复当前状态 | 与代码、测试不一致 |
| Review | review 结果 | 无 Critical | 只做格式检查 |
| Automation | CI 配置 | 关键验证自动执行 | 本地有测试但 CI 不跑 |
| Release | 发布/回滚文档 | 灰度、回滚、巡检明确 | 只有部署命令 |

扫描输出不应该替用户隐藏风险。即使用户说“先快点做”，也要标出缺口和被跳过的阶段。

## 首次进入项目：初始化协议

首次进入一个项目时，先做项目画像，而不是直接改代码。

检查顺序：

1. 识别项目根目录。
2. 读取 README、AGENTS/CLAUDE/GEMINI、package/Makefile/justfile。
3. 查找 docs 目录。
4. 查找现有 workspace skill。
5. 查找测试、启动、构建命令。
6. 查找 CI 配置。
7. 查找最近进度文档或 ADR。

如果缺少基础结构，生成最小文档骨架：

```text
docs/
  product/
    user-stories/
  architecture/
    decisions/
  testing/
  deployment/
  user-guide/
```

骨架只创建必要目录，不伪造内容。未知内容用 TODO 或“待确认”，并在扫描结果里标为 Missing。

## 项目级 Workspace Skill 生成规则

当 `.agents/skills/{project-slug}-workspace/SKILL.md` 不存在，或项目事实明显变化时，生成项目级 workspace skill。

目标：

- 让新的 agent 快速知道项目是什么。
- 让新工程师知道从哪里读文档、跑命令、验证。
- 保存项目特定规则，而不是复制所有文档。
- 把缺口显式暴露，避免靠记忆接力。

推荐信息源：

| 信息 | 优先来源 | 备选来源 |
|---|---|---|
| 系统架构 | docs/architecture/overview.html | README、代码目录 |
| 业务术语 | docs/architecture/domain-model.html | user stories、model/entity |
| 公开治理 | service-registry.yaml、OWNERS、CODEOWNERS | README、docs index |
| API 契约 | openapi/、proto/、graphql schema | handler、SDK type |
| 技术栈 | docs/architecture/tech-stack.html | package、go.mod、pom、requirements |
| 本地开发 | docs/deployment/local-dev.html | Makefile、scripts、README |
| 项目规则 | CLAUDE.md/AGENTS.md/GEMINI.md | CONTRIBUTING |
| 常用命令 | Makefile/package.json/justfile | CI 配置 |
| 测试策略 | docs/testing/strategy.html | test 目录和 CI |
| 发布方式 | docs/deployment | pipeline、helm、terraform |

生成内容必须短而准：

- 摘录事实，不全文搬运。
- 保留链接，不复制大段设计。
- 不写内部账号、secret、私有 token。
- 不把当前临时任务写成长期项目规则。
- 每条命令注明用途。
- 缺失信息独立列出。

Workspace skill 结构建议：

```markdown
---
name: {project-slug}-workspace
description: Use when working in {project-name}; contains local architecture, commands, verification, and project rules.
---

# {Project Name} Workspace

## 快速画像
- 产品/服务：
- 主要用户：
- 核心模块：
- 关键风险：

## 文档地图
| 主题 | 路径 | 用途 |

## 业务语言
| 术语 | 含义 | 代码位置 |

## 架构入口
- 系统边界：
- 数据流：
- 外部依赖：
- 重要 ADR：

## 常用命令
| 场景 | 命令 | 备注 |

## 验证要求
| 变更类型 | 必跑验证 |

## 项目规则
- ...

## 已知缺口
- [ ] ...
```

生成后要在扫描结果里说明：

- 读取了哪些来源。
- 哪些内容确定。
- 哪些内容缺失。
- 需要用户或项目 owner 补充什么。

## Intake 深化门禁

需求阶段不是写一段描述，而是建立可验收的工作边界。

最小问题集：

| 问题 | 目的 |
|---|---|
| 谁遇到这个问题 | 明确用户角色 |
| 在什么场景发生 | 防止抽象需求 |
| 现在怎么做 | 找出真实痛点 |
| 期望变化是什么 | 建立目标态 |
| 本期不做什么 | 控制范围 |
| 成功怎么判断 | 形成 AC 和指标 |
| 失败会怎样 | 判断风险等级 |
| 是否影响已有用户 | 决定兼容和迁移 |

Intake 产物必须包含：

- 用户故事。
- 背景。
- 范围。
- 非范围。
- AC。
- 边界条件。
- NFR。
- 可观测性初始需求。
- 依赖和未知。

进入 Shape 前检查：

- AC 是否能被测试或观察。
- 是否存在“优化体验”“提升稳定性”这类不可验收描述。
- 是否明确哪些旧行为不能破坏。
- 是否区分 must/should/could。

## Shape 深化门禁

设计阶段要把实现风险前置暴露。

必须形成的设计材料：

| 材料 | 内容 |
|---|---|
| Context | 背景、目标、非目标、约束 |
| Options | 至少两个方案，或说明为何只有一个 |
| Decision | 选型、原因、后果 |
| Data | schema、状态、迁移、兼容 |
| API | route/RPC/event、契约、错误码 |
| Flow | 主流程、失败流程、重试、补偿 |
| Plan | 切分、依赖、验证、发布顺序 |

需要 ADR 的信号：

- 改 public API。
- 改 schema 或数据生命周期。
- 引入新依赖或新基础设施。
- 改跨模块边界。
- 引入异步、缓存、队列、状态机。
- 影响发布、回滚或兼容。

设计未通过时，不应进入 Build。可以先做 spike，但 spike 的产物必须标明不可直接上线。

## Experience 深化门禁

只要有用户界面或用户可感知流程，就要检查体验状态。

界面状态表：

| 状态 | 必问 |
|---|---|
| Loading | 等待时用户看到什么 |
| Empty | 无数据是否可理解 |
| Error | 错误是否能恢复 |
| Permission | 无权限是否解释清楚 |
| Disabled | 不可操作原因是否明确 |
| Success | 完成后是否有反馈 |
| Partial | 部分成功如何展示 |
| Offline/Retry | 网络或依赖失败怎么办 |

交互验收：

- 主路径可完成。
- 错误路径可恢复。
- 表单校验在前端和后端一致。
- 文案不暴露内部实现。
- 移动端/窄屏不遮挡。
- 键盘、屏幕阅读器、焦点顺序可用。
- 埋点或日志能看到关键动作。

## Workspace 深化门禁

本地环境文档要服务“今天第一次打开这个项目的人”。

必须写清：

- 依赖安装。
- 环境变量来源和示例。
- 本地数据库/缓存/队列启动。
- mock/stub 使用方式。
- 服务启动顺序。
- 常用测试命令。
- 清理和重置方式。
- 常见失败及修复。
- 端口、账号、测试数据边界。

不要写：

- 只有作者机器能用的绝对路径。
- 需要私下询问的 secret。
- 不说明用途的大段命令。
- 已失效的历史命令。

## Test Matrix 深化门禁

测试矩阵要从 AC 反推，不从现有测试凑数。

模板：

| AC | 风险 | Unit | Integration | E2E | Contract | Observability | Owner |
|---|---|---|---|---|---|---|---|

选择规则：

- 纯计算规则优先 unit。
- DB/API/queue 交互至少 integration。
- 用户路径至少 E2E 或黑盒验证。
- 跨服务/跨端至少 contract。
- migration/backfill 必须有可重复执行验证。
- bugfix 必须有失败复现或回归保护。

测试缺口处理：

- 能补就补。
- 暂时不能补则写原因、风险、owner、后续时间。
- 高风险缺口不能用 TODO 放过。

## Signal Plan 深化门禁

可观测性不是“加几行日志”。它要回答四个问题：

1. 功能有没有被使用。
2. 用户有没有成功。
3. 失败发生在哪里。
4. 线上异常谁能发现并处理。

信号设计顺序：

1. 从 AC 和业务目标抽 primary metric。
2. 从失败路径抽 failure metric。
3. 从关键依赖抽 dependency metric。
4. 从用户行为抽 events。
5. 从排障需要抽 structured logs。
6. 从影响面抽 dashboard。
7. 从 SLO 或风险抽 alert。
8. 从发布计划抽 smoke/synthetic check。

事件设计：

| 字段 | 要求 |
|---|---|
| event_name | 稳定、可读、版本化 |
| trigger | 明确触发时机 |
| required_props | 必填属性和来源 |
| optional_props | 可选属性和默认值 |
| privacy | 禁止采集字段 |
| validation | 如何确认事件出现 |

日志设计：

| 字段 | 要求 |
|---|---|
| action | 业务动作 |
| result | success/failure/rejected |
| reason | 可聚合失败原因 |
| correlation_id | 串联请求或任务 |
| subject_id | 脱敏后的对象标识 |
| latency_ms | 关键耗时 |

指标设计：

- counter 记录次数。
- histogram 记录延迟和大小。
- gauge 记录队列深度、库存、连接数等当前值。
- 标签数量受控，禁止把 user_id/email/token 作为 label。
- failure reason 使用枚举，不写自由文本。

告警设计：

- 条件必须对应用户影响或系统风险。
- 有持续时间。
- 有级别。
- 有 owner。
- 有 runbook。
- 有第一止血动作。
- 有恢复判断。

验证方式：

| 信号 | 自动验证 | 人工验证 |
|---|---|---|
| event | 测试断言 payload | 测试环境触发后查询 |
| log | 单元/集成捕获日志 | 搜索 correlation_id |
| metric | registry/assertion | 查询 Prometheus 或等价系统 |
| dashboard | query lint | 页面非空且维度正确 |
| alert | rule test | 人工加载并模拟阈值 |
| trace | span assertion | 查看链路完整性 |

没有自动化时，必须写人工步骤，不能只写“上线后观察”。

## Build 阶段执行纪律

实现阶段遵循小步前进。

推荐循环：

1. 选择一个 AC 或技术切片。
2. 写失败测试或等价验证。
3. 做最小实现。
4. 运行相关测试。
5. 重构。
6. 更新证据。
7. 必要时更新 progress。

遇到失败：

- 不猜原因。
- 保留失败输出。
- 缩小复现。
- 分清环境问题、测试问题、实现问题。
- 修复后再次运行原失败验证。

并行规则：

- 可并行：文档补齐、独立测试、独立模块、静态检查。
- 谨慎并行：同一 API 两端改动、同一 schema 多处改动。
- 串行：migration、发布脚本、鉴权、状态机核心逻辑。

## Evidence 深化门禁

完成声明前必须有 fresh verification。fresh 的含义是：在当前代码状态、当前分支、当前依赖下运行。

验证矩阵：

| 变更类型 | 必要验证 |
|---|---|
| 文案/样式 | 预览或截图、i18n 检查 |
| 前端逻辑 | unit/component、关键路径手测或 E2E |
| 后端 API | unit、integration、contract 或 curl |
| DB migration | apply、rollback 或恢复策略、兼容验证 |
| worker/job | 单元、集成、重试/幂等验证 |
| config/CI | lint、dry-run、pipeline 语法检查 |
| observability | event/log/metric/dashboard/alert 验证 |
| docs/skill | 链接、触发条件、约束自检 |

证据记录：

```markdown
## Verification
| Time | Command/Action | Result | Notes |
|---|---|---|---|
```

不能运行时要写：

- 为什么不能运行。
- 风险是什么。
- 替代验证做了什么。
- 谁需要后续验证。

## Snapshot 深化门禁

Progress 文档用于恢复现场，不是日报。

必须包含：

- 当前目标。
- 本轮完成的事实。
- 变更文件或模块。
- 验证证据。
- 仍然打开的问题。
- 下一步。
- 阻塞项。
- 相关文档链接。

避免：

- “基本完成”但没有证据。
- 只写聊天总结。
- 不区分已完成和计划。
- 不记录失败验证。
- 不说明代码和文档是否同步。

## Review 深化门禁

进入 Review 前准备：

- PR/MR diff 清楚。
- 需求、设计、测试、观测链接齐全。
- 验证结果是最新的。
- 已知风险主动写出。
- 回滚方案存在。

Review 后处理：

- Critical 先修。
- Important 逐项处理或记录接受风险。
- Minor 可批量修。
- 修改后重新运行相关验证。
- 若变更范围扩大，重新走对应阶段。

## Automation 深化门禁

CI 应该承接本地验证，而不是只做打包。

门禁矩阵：

| 能力 | CI 检查 |
|---|---|
| 格式 | format/lint |
| 类型 | typecheck/static analysis |
| 行为 | unit/integration/e2e |
| 契约 | schema/openapi/proto check |
| 数据 | migration check |
| 安全 | secret scan/dependency scan |
| 构建 | build/package |
| 发布 | deploy dry-run 或 manifest render |

CI 风险：

- 关键 job allow_failure。
- 测试被条件跳过。
- cache 使用旧产物。
- pipeline 只在 main 跑，MR 不跑。
- secret 暴露在日志。
- 并发发布没有锁。

## Release 深化门禁

发布前确认：

- 版本或 commit 可追踪。
- 变更摘要清楚。
- 发布窗口合理。
- 依赖服务准备好。
- migration 顺序明确。
- feature flag 默认值明确。
- 灰度比例和扩大条件明确。
- 回滚能处理新写数据。
- smoke/synthetic 检查有 owner。

上线后检查：

| 时间 | 检查 |
|---|---|
| 立即 | 部署状态、健康检查、错误率 |
| 5-15 分钟 | 核心路径、关键依赖、日志异常 |
| 灰度扩大前 | guardrail metric、用户反馈、告警 |
| 完成后 | dashboard、runbook、进度文档更新 |

回滚触发：

- Critical 告警。
- 核心路径成功率下降。
- 数据写入异常。
- 错误率或延迟超过阈值。
- 无法确认影响面。

## 任务拆分和派发

生成任务清单时，每项任务必须可验证。

任务字段：

| 字段 | 说明 |
|---|---|
| id | 稳定编号 |
| title | 动词开头 |
| phase | 所属阶段 |
| input | 依赖文档/代码 |
| output | 交付物 |
| validation | 完成验证 |
| risk | 主要风险 |
| parallel | 是否可并行 |
| dependency | 前置任务 |

派发规则：

- 同文件高冲突任务不要并行。
- schema/API/contract 先于调用方。
- 测试可和实现并行设计，但最终要回到同一验证矩阵。
- 观测方案可提前设计，埋点实现跟随代码。
- Review 不能和最终实现同时视为完成。

## 继续任务时的恢复协议

当用户说“继续”“接着做”“resume”：

1. 读 progress。
2. 读 git 状态。
3. 查最近修改文件。
4. 查验证记录。
5. 对照任务清单。
6. 输出当前真实状态。
7. 再继续执行下一步。

不要仅根据上一轮聊天记忆继续。上下文压缩后尤其要以文件为事实来源。

## 最终完成声明

完成回答必须包含：

- 改了什么。
- 产物在哪里。
- 运行了什么验证。
- 还有什么风险或未做项。

不能包含：

- 未运行却暗示通过的测试。
- 未完成却说完成。
- 把用户需要决策的风险省略。
- 大段无关过程。
