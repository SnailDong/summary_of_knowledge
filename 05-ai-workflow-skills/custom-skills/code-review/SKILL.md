---
name: code-review
description: 当需要在合并前审查 PR/MR、本地 diff、提交范围、migration、API/schema 变更、测试、部署配置、可观测性、i18n 或 agent 规则变更时使用。
version: "5.0.0"
label: "公开版：代码审查"
---

# Code Review

## 适用场景

使用本 skill 当用户需要审查：

- PR/MR、本地 diff、commit range、暂存区或未提交变更。
- feature、bugfix、migration、API/schema、部署配置。
- 测试、可观测性、i18n、agent/skill/rules 变更。
- 需求、设计、代码、契约、测试、观测、发布之间是否一致。

## 不适用场景

不使用本 skill 当：

- 用户仅要求解释代码。
- 没有 diff 的早期方案讨论。
- 用户只要运行命令结果。

## 触发场景

当用户说出类似下面的话时触发：

- “帮我 review 这个 MR。”
- “review 我本地这些改动。”
- “检查这个 commit 有没有风险。”
- “合并前帮我看一下测试、契约和观测有没有缺口。”
- “这个 migration 安不安全？”
- “这个 skill / agent 规则有没有越权或跳过验证的问题？”

## 依赖 Skill

无强依赖。该 skill 会读取需求、架构、ADR、测试、部署和观测文档；这些文档可来自 `story-craftsman`、`architect` 或项目现有文档。

## 审查目标

Review 要找出变更在“需求、设计、代码、契约、测试、观测、发布”之间的断裂。它不是格式巡检，也不是 LGTM 仪式。

## 审查公约

- 代码有新能力但没有需求/设计/ADR：阻断。
- 文档有目标态但代码未实现：允许，但要标注状态。
- 高置信安全、数据、性能、可用性、线上事故风险：阻断。
- 已实现用户可见功能没有测试或观测：阻断。
- 每个 finding 都要有文件、证据、影响、建议。

## 编排关系

本 skill 不主动生成需求或设计，不替代实现阶段验证。它读取并复核其他 skill 的产物：

- 读取 `story-craftsman` 产出的 User Story / AC，检查实现是否满足用户可见行为。
- 读取 `architect` 产出的设计、ADR、契约、测试和观测方向，检查代码是否偏离设计。
- 读取 `dev-workflow` 汇总的验证证据、progress、CI/CD 和发布准备，检查闭环是否完整。
- 如果发现需求或设计缺失，结论中明确要求回到对应 skill 补齐，而不是在 review 里临时补写。

## Workflow：审查执行 1-7

Review 默认按 1-7 的编号顺序推进。除非用户明确只要某一专项审查，否则不要只看代码样式就给结论。

| 环节 | 目标 | 联动 skill | 通过条件 |
|---|---|---|---|
| 1. 范围采集 | 确认 diff、文件、模块、验证限制 | 读取 `dev-workflow` 的 progress/验证证据，若存在 | 知道审什么和没审什么 |
| 2. 文件路由 | 按文件类型选择审查维度 | 无外部调用 | 文档、代码、测试、配置各有视角 |
| 3. 规范层审查 | 查需求、设计、ADR、契约断裂 | 读取 `story-craftsman`、`architect` 产物 | 目标和规则一致 |
| 4. 行为层审查 | 查安全、数据、性能、错误处理 | 无外部调用 | 运行风险被识别 |
| 5. 专项审查 | 查 migration、测试、部署、观测等 | 读取 `architect` 的测试/观测/发布设计 | 高风险主题不遗漏 |
| 6. 闭环审查 | 串起需求到发布的证据链 | 对照 `dev-workflow` 的阶段产物 | 实现、测试、观测、回滚闭合 |
| 7. 结论校准 | 按红线和证据定级 | 缺口回流到对应 skill 补齐 | finding 可行动，结论可复查 |

## 1. 范围采集

记录：

| 项目 | 内容 |
|---|---|
| 来源 | PR/MR、本地 diff、commit range |
| base/head |  |
| 文件数 | 新增/修改/删除/重命名 |
| 模块 |  |
| 变更类型 | feature/bugfix/migration/config/docs |
| 验证 | 已运行命令 |
| 限制 | 未能读取或不能判断的范围 |

本地常用：

```text
git diff
git diff --staged
git diff <base>..<head>
```

不要在最终输出贴完整 diff。

## 2. 文件路由

| 文件类型 | 例子 | 审查维度 |
|---|---|---|
| 产品文档 | product, stories | 用户视角、AC、非范围 |
| 架构文档 | architecture, decisions | 选项、取舍、后果 |
| 功能代码 | src, app, server, lib | 安全、数据、性能、错误处理 |
| 测试 | test, spec, e2e | 有效性、CI、AC 覆盖 |
| migration | migrations, db, schema | 幂等、锁表、兼容、回滚 |
| 契约 | openapi, proto, schema, dto | 与实现一致 |
| 部署 | docker, CI, k8s, helm, terraform | secret、资源、环境、回滚 |
| 观测 | metrics, alerts, dashboards, tracking | 成功/失败是否可见 |
| i18n | arb, strings, locales | 占位符、漏翻、标签 |
| agent/rules | SKILL, AGENTS, cursor/codex rules | 越权、注入、跳过验证 |

## 3-6. 三层九视角

每层至少三轮，不允许一轮通过。

| 层 | 轮 A | 轮 B | 轮 C |
|---|---|---|---|
| 规范层 | 文件/索引/格式 | 需求/设计语义 | ADR/契约规范 |
| 行为层 | 安全/数据 | 性能/资源 | 错误/降级/工程质量 |
| 闭环层 | 需求到代码 | 契约到测试 | 观测到发布 |

记录格式：

```markdown
### <层> / <轮>
- 视角：
- 证据：
- 发现：
- 待复核：
```

## 3. 规范层审查清单

产品文档：

- US 是否用户视角。
- AC 是否可测试。
- 是否有非范围、NFR、可观测性需求。
- 已实现 AC 是否有测试映射。

架构文档：

- 是否有目标、非目标、约束。
- 是否有候选方案和取舍。
- 是否写明数据、API、状态、失败路径、兼容、回滚。
- 是否有当前代码差距。

ADR：

- 是否有背景、选项、取舍、决策、后果。
- 是否至少两个选项，或说明其它方案不可行。
- 是否同步索引。
- 是否保留历史决策，不删除旧 ADR。

契约：

- route/method/RPC 是否与实现一致。
- request/response 字段、类型、required 是否一致。
- 错误码、分页、过滤、幂等策略是否一致。
- breaking change 是否有版本和迁移。

## 4. 行为层审查清单

安全：

- 用户身份是否来自可信上下文。
- 是否信任 body/query/header 中的身份或角色。
- 是否缺鉴权、越权、跨租户、IDOR。
- webhook/callback 是否校验签名、来源、重放。

输入：

- SQL/NoSQL/shell/path/URL/template 是否使用安全 API。
- 是否有 SSRF、路径穿越、XSS、unsafe deserialize、ReDoS。
- 上传、redirect、callback、filter/sort 是否 allowlist。

敏感数据：

- token、secret、cookie、JWT、PII、地址、支付字段是否泄露到日志、错误、埋点、缓存、response。
- 脱敏是否在服务端边界。

数据一致性：

- 多资源写入是否有事务、唯一约束、幂等 key、状态 guard。
- retry/callback/并发是否会重复履约、覆盖新状态、丢事件。
- queue/outbox/cache 是否处理顺序、去重、重放、死信。

性能：

- N+1、全表扫描、缺分页、未限制时间范围。
- 循环内远程调用。
- payload、序列化、内存、复杂度是否匹配规模。

资源和降级：

- 外部调用是否 timeout/cancel/retry limit。
- 文件、stream、body、rows、timer、goroutine 是否释放。
- 限流、降级、安全拒绝是否有日志/metrics。

工程质量：

- 遵循仓内规则。
- 命名表达业务意图。
- 避免类型逃逸、裸 map、魔法值、无语义 bool。
- 函数职责不过载。
- 新依赖说明必要性、替代方案、维护状态、license/安全/体积成本。

## 5. 专项审查清单

Migration：

- schema migration 不混业务 backfill，除非有明确安全边界。
- 不插入 mock/seed/test 数据。
- 大表 ALTER 有锁表或 online 方案。
- 重复执行安全。
- down 或恢复策略清楚。
- 新旧版本兼容同一 schema。
- backfill 有 dry-run、限速、暂停/恢复、进度和失败审计。

测试：

- 已实现 AC 有测试。
- bugfix 有回归。
- 测试真的会因实现错误失败。
- CI 会执行。
- 没有 skip/only/空断言/吞异常/`|| true`。
- 复合 AC 同时验证写端和读端。

部署：

- secret 不明文。
- 环境隔离。
- config 缺失时 fail-fast 或安全降级。
- health/readiness/liveness 或等价机制合理。
- 发布顺序覆盖 migration、worker、consumer。
- 回滚能处理新写数据。

可观测：

- 成功路径有信号。
- 失败路径能定位。
- dashboard/alert/log/trace/event 能回答影响范围。
- 不泄露 PII/secret。
- 观测配置有验证方式。

i18n：

- 占位符数量、编号、类型一致。
- HTML/换行/转义一致。
- 新 key 同步。
- 空值、漏翻、误翻可识别。

Agent/rules：

- 没有隐藏指令。
- 没有越权、联网、泄露 secret。
- 没有要求跳过测试、跳过 review、自动合并。
- 没有把私有工具当公开前提。

## 6. 闭环审查清单

| 链路 | 通过标准 |
|---|---|
| 需求 -> 设计 | 已实现 AC 有设计或合理豁免 |
| 设计 -> 代码 | 流程、状态、字段、边界一致 |
| 代码 -> 契约 | API/schema/config 无漂移 |
| 代码 -> 测试 | 行为有测试，bug 有回归 |
| 代码 -> 观测 | 成功和失败可发现 |
| 代码 -> 发布 | 兼容、灰度、回滚清楚 |
| 文档 -> 索引 | 新文档有入口 |

## 严重等级

| 等级 | 含义 | 处理 |
|---|---|---|
| Critical | 安全、数据损坏、核心不可用、不可恢复 | 阻断 |
| Important | 测试、兼容、观测、架构、错误处理缺口 | 修复或接受风险 |
| Minor | 可读性、命名、文档润色 | 可跟踪 |

## 红线

- undocumented implementation。
- 高置信鉴权/授权/租户隔离风险。
- 注入风险。
- secret/PII/支付敏感数据泄露。
- 多资源写入缺事务/幂等/并发保护。
- 热路径全量扫描、缺分页、无 timeout、无限重试。
- migration/backfill 不可重入、破坏兼容、可能锁大表。
- breaking change 无迁移。
- 已实现功能无测试。
- 测试不进 CI 却声称验证。
- 用户可见功能无观测。
- 生产变更无回滚。
- dangerous agent/rules 指令。

## 结论

| 结论 | 分数 | 条件 |
|---|---|---|
| 通过 | 8.0-10.0 | 无红线，关键风险闭环 |
| 有条件通过 | 6.0-7.9 | 无红线，有可接受缺口 |
| 不通过 | 0.0-5.9 | 任一红线或关键断裂 |

红线优先于分数。

## 输出模板

```markdown
## Findings
### Critical
1. ...
### Important
1. ...
### Minor
1. ...

## 范围
- 来源：
- 文件：
- 模块：
- 验证：

## 多视角摘要
| 层 | 轮次 | 视角 | 结论 |

## 缺口
- 测试：
- 观测：
- 契约：
- 发布：

## 闭环表
| 变更 | 需求 | 设计 | 代码 | 契约 | 测试 | 观测 | 发布 | 状态 |

## 结论
- 结论：
- 分数：
- 是否可合并：
- 理由：
```

## 证据标准

Review 结论必须能被复查。以下内容不能作为单独证据：

- “看起来没问题”。
- “应该不会影响”。
- “作者说测过”但没有命令、截图、CI 或日志。
- 只看到 happy path，没有失败路径。
- 只看到类型检查，没有行为验证。
- 只看到文档，没有代码或配置对应变化。

有效证据包括：

| 证据 | 可接受形式 |
|---|---|
| diff | 文件路径、函数、字段、配置项 |
| test | 测试名、断言、失败前提、CI job |
| runtime | 日志、metrics、trace、dashboard query |
| contract | OpenAPI/proto/schema 与 handler/model 对照 |
| data | migration、约束、索引、兼容读写 |
| release | flag、灰度、回滚、smoke、runbook |

每个 Critical/Important finding 至少要有一条主证据和一条影响说明。

## 变更范围画像

先把变更分成几类，再决定审查深度。

| 画像 | 常见信号 | 默认深度 |
|---|---|---|
| 纯展示 | 文案、样式、静态布局 | UI、i18n、可访问性 |
| 单点逻辑 | 单函数、单组件、单 handler | 输入、边界、测试 |
| 跨模块 | 多 package、多服务、多端 | 契约、状态、发布顺序 |
| 数据演进 | schema、migration、backfill | 兼容、幂等、回滚 |
| 生产开关 | config、feature flag、CI/CD | 环境、默认值、回滚 |
| 用户链路 | 下单、支付、登录、设备绑定等 | AC、观测、告警、回归 |

范围画像写入最终报告的“范围”部分，避免 review 结论脱离变更类型。

## 九视角执行记录

可用下面的表作为审查 scratchpad。最终报告只保留发现和摘要。

| 轮次 | 视角 | 问题 | 证据 | 结论 |
|---|---|---|---|---|
| Spec-A | 文件入口 | 新增文档是否有索引 |  |  |
| Spec-B | 语义一致 | 需求、设计、代码是否同一目标 |  |  |
| Spec-C | 契约 | API/schema/ADR 是否闭合 |  |  |
| Behavior-A | 安全数据 | 权限、租户、敏感数据 |  |  |
| Behavior-B | 性能资源 | 查询、循环、超时、释放 |  |  |
| Behavior-C | 错误质量 | 失败、降级、依赖、代码质量 |  |  |
| Closure-A | AC 映射 | 需求到测试 |  |  |
| Closure-B | 运行证据 | CI、本地验证、观测验证 |  |  |
| Closure-C | 发布恢复 | 灰度、回滚、上线后检查 |  |  |

如果某一视角 NotApplicable，要写原因。例如“无持久化变更，因此 migration 视角不适用”。

## 安全审查细则

身份和授权：

- 后端从 session/token/context 读取身份，不从客户端传入字段信任用户身份。
- 管理接口和普通接口的权限边界清楚。
- 多租户数据查询带 tenant/account/project scope。
- 前端隐藏按钮不等于后端授权。
- 批量接口逐项校验权限，不能只校验列表入口。

输入和输出：

- 任意可控字符串进入 SQL、shell、path、template、URL 前经过安全 API。
- 文件名、redirect、callback、sort、filter 使用 allowlist。
- 错误响应不泄露 stack、secret、内部路径、SQL、第三方 token。
- 日志、埋点、analytics 不包含 PII 原文或可复原 token。

第三方集成：

- webhook 有签名验证、时间窗口和重放保护。
- 外部 API credential 不出现在前端、日志、测试快照。
- callback 失败不会无限重试导致放大事故。
- 供应商响应被视为不可信输入。

## 数据审查细则

写入路径：

- 创建操作有唯一约束或幂等键。
- 更新操作有状态前置条件，避免旧请求覆盖新状态。
- 删除操作区分软删、硬删、解绑、归档。
- 多表写入要么在事务内，要么有补偿和一致性说明。

读取路径：

- 分页、排序、过滤字段明确。
- 默认查询有时间范围或数量限制。
- 聚合查询对大表有索引和 explain 证据。
- cache key 包含权限和租户维度。

异步路径：

- message/job 有去重键。
- consumer 幂等。
- 死信、重试上限、延迟重试清楚。
- outbox 或等价机制能处理事务提交后投递。

## Migration 审查细则

Schema 变更：

- 新字段默认值不会导致旧版本写入失败。
- 新约束上线前已有数据满足条件。
- 删除字段前确认所有读写方已停止使用。
- rename 优先拆成 add-copy-read-switch-drop。
- index 创建对生产数据量有 online 或低峰策略。

Backfill：

- 可重复执行。
- 有 batch size。
- 有进度记录。
- 可暂停、继续、限速。
- 失败项能单独重试。
- dry-run 和实际执行分离。

兼容窗口：

- old app + new schema 可运行。
- new app + old schema 的发布时间差被覆盖。
- rollback 后新写数据不破坏旧逻辑。

## 测试审查细则

有效测试的最低条件：

- 测试失败时能定位到本次变更。
- 断言检查结果，不只检查没有抛错。
- 能区分成功、失败、边界。
- CI 默认会运行。
- 测试数据不依赖执行顺序。

常见无效测试：

- 只 snapshot 巨大输出，没有语义断言。
- mock 了被测逻辑本身。
- 断言实现细节而不是行为。
- 把异常 catch 后不 rethrow。
- 测试名写了场景，但 body 没覆盖。
- race/timeout 通过 sleep 碰运气。

AC 映射表：

| AC | 测试文件 | 测试名 | 覆盖路径 | 缺口 |
|---|---|---|---|---|

缺 AC 测试时，不能用“代码很简单”直接通过；要么补测试，要么明确风险接受。

## API 与契约对账

对账顺序：

1. 找公开契约：OpenAPI、proto、GraphQL schema、SDK type、README。
2. 找入口实现：route、controller、handler、resolver。
3. 找请求模型：DTO、validator、serializer。
4. 找响应模型：response builder、mapper、schema。
5. 找错误路径：exception、status code、error body。
6. 找测试：contract/integration/e2e。

检查项：

- required/optional 是否一致。
- enum 新增是否兼容旧客户端。
- 时间、金额、时区、精度是否稳定。
- 空数组、null、缺字段语义是否明确。
- 分页参数和排序字段是否受控。
- 错误码是否可被客户端处理。

## 公开治理漂移检查

当项目没有内部 catalog 或门户时，用公开文件做同等目的的漂移检查。只要 diff 涉及新 API、模块边界、部署、文档入口、owner 或数据资源，就执行本节。

| 漂移对象 | 对账来源 | 红旗 |
|---|---|---|
| 代码 -> API 契约 | route/RPC/resolver vs OpenAPI/proto/GraphQL/SDK type | 新增或删除行为但契约未更新 |
| 代码 -> 服务目录 | module/service/worker/job vs service registry | 新能力无 owner、lifecycle、docs 入口 |
| 代码 -> 文档入口 | 新文档 vs docs entry/index | 文档存在但无法从入口找到 |
| 代码 -> ADR | 长期决策 vs decision index | 影响边界/API/schema 但无 ADR |
| 代码 -> 所有权 | touched module vs OWNERS/CODEOWNERS | 新目录无 reviewer 或升级路径 |
| 代码 -> 部署清单 | Docker/CI/k8s/terraform vs deployment registry | 新 artifact/config/secret 无环境和回滚说明 |
| 代码 -> 数据资源 | migration/schema/topic/bucket/cache vs data/resource registry | 新资源无 owner、retention、backup 或 migration 说明 |

审查顺序：

1. 找项目已有的 registry/index/ownership 文件。
2. 找本次 diff 新增或修改的 public surface。
3. 对照入口、owner、契约、部署和 ADR 是否同步。
4. 找不到等价治理文件时，在 finding 里写“缺公开治理入口”，不要假设不存在风险。
5. 如果项目明确轻量，不要求 registry，也必须说明替代事实来源，例如 README、package manifest、deployment docs。

最低阻断条件：

- 对外 API 行为变化但契约未更新。
- 生产部署文件变化但没有回滚或环境说明。
- 新数据资源没有 owner 或 migration/backfill 说明。
- 代码实现了用户可见能力，但需求/设计/测试/观测没有入口。
- 新 agent/rule/automation 文件没有触发边界或越权约束。

## 配置与部署审查

配置：

- 新配置有默认值或启动失败策略。
- 环境变量命名清楚，避免和已有变量冲突。
- secret 走 secret manager 或 CI secret。
- 测试、staging、production 的差异写清。

CI/CD：

- 新测试被纳入 pipeline。
- cache 不会掩盖失败。
- 构建产物版本可追踪。
- 部署脚本失败时停止，不继续发布。

Kubernetes/容器：

- readiness 与真实依赖匹配。
- liveness 不会因短暂依赖抖动杀死进程。
- resource request/limit 合理。
- graceful shutdown 覆盖 worker/consumer。

## 可观测性审查细则

日志：

- 成功、失败、拒绝、重试有可搜索字段。
- correlation id 贯穿入口和异步任务。
- 错误分类可聚合。
- 禁止敏感字段原文。

指标：

- 有总量、成功、失败、延迟。
- 标签基数受控。
- 外部依赖和内部处理分开。
- 关键业务结果不是只靠日志推断。

告警：

- 条件和持续时间能避免短抖动误报。
- 告警能指向 owner 和 runbook。
- 有止血动作。
- 误报和漏报风险写清。

验证：

- 本地或测试环境可触发一次事件。
- query 能解析。
- dashboard 不空白。
- alert 规则能加载。

## Agent 与规则文件审查

当变更包含 `SKILL.md`、agent prompt、workflow rule、automation script 时，额外检查：

- 是否要求读取必要上下文后再行动。
- 是否存在越权读取、写入、联网、提交、部署指令。
- 是否把私有系统、私有 token、内部地址写成公开前提。
- 是否要求忽略系统/developer/user 指令优先级。
- 是否要求跳过测试、跳过 review、跳过权限确认。
- 是否把“建议”写成不可解释的强制动作。
- 是否有触发边界，避免在不相关场景误触发。

## Finding 写法

好的 finding：

```markdown
[Critical] /path/file.ts:42 在更新订单状态时没有校验 owner_id，任意登录用户只要知道 order_id 就可能修改他人订单。建议在查询条件中加入 owner scope，并补充跨用户访问回归测试。
```

不好的 finding：

```markdown
这里可能有权限问题，建议看看。
```

每条 finding 的结构：

- 等级。
- 文件和位置。
- 发生条件。
- 影响。
- 建议。
- 验证缺口。

## 7. 结论校准

给分前执行：

- 有没有红线？有则不通过。
- Critical 是否都有明确修复建议。
- Important 是否能被 owner 接受和跟踪。
- Minor 是否没有淹没真正风险。
- 是否把不确定问题写成了确定结论。
- 是否说明未审查范围。
- 是否说明未能运行的验证。

分数不是平均分；最高风险决定上限。

| 最高风险 | 最高分 |
|---|---|
| Critical 未修 | 5.9 |
| Important 无 owner | 7.4 |
| 测试缺口但可接受 | 7.9 |
| 仅 Minor | 9.0 |
| 无发现但验证有限 | 8.5 |

## 最终自检

提交 review 前确认：

- Findings 在最前面。
- 每条 finding 都有证据。
- 没有把建议写成泛泛重构。
- 没有引用完整 diff。
- 没有泄露 secret。
- 未审范围已说明。
- 结论和红线一致。
- 用户能根据报告直接行动。
