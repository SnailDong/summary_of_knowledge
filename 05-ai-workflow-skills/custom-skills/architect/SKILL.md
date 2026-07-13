---
name: architect
description: 当需要在非平凡实现前设计系统、模块、API、数据模型、状态机、集成方案、ADR 或架构文档时使用。
version: "5.0.0"
label: "公开版：架构设计"
---

# Architect

## 适用场景

使用本 skill 当用户需要：

- 设计新功能、新系统、新模块或跨端能力。
- 设计 API、数据模型、状态机、权限、异步流程、第三方集成。
- 拆分模块边界、跨端契约、依赖方向、Ports & Adapters。
- 编写或审查 ADR、术语模型、测试策略、可观测性、发布回滚设计。

## 不适用场景

不使用本 skill 当：

- 单行修复。
- 已有明确设计下的纯机械实现。
- 用户只想发散，不需要设计产物。

## 触发场景

当用户说出类似下面的话时触发：

- “帮我设计一个新的售后保修模块。”
- “这个功能怎么做架构设计？”
- “帮我写 ADR，比较一下这几个方案。”
- “我要设计 API、数据表和状态机。”
- “这个 SDK 要怎么拆包、怎么定义边界？”
- “实现前先给我一版技术方案。”

## 依赖 Skill

- 可选依赖：`superpowers:writing-plans`，用于把完成的设计文档拆成可执行实现计划。
- 上游输入：通常读取 `story-craftsman` 产出的 User Story / AC。
- 下游输出：通常交给 `dev-workflow` 编排实现，或交给 `code-review` 做设计与实现一致性审查。

## 设计目标

这个 skill 把可测试需求转成可约束实现的技术设计。它要求明确边界、选择、代价、失败模式、测试、观测和发布策略。

## 核心约束

- 需求不清楚，不进入设计。
- 重要设计必须有候选方案和取舍。
- 代码已实现但没有设计记录，视为缺陷。
- 术语、状态和 ownership 必须有权威来源。
- 目标态可以领先代码，但必须标注差距。
- 长期影响系统的决定必须写 ADR。

## 编排关系

本 skill 不是总流程编排器，但会在设计阶段联动其他 skill：

- 上游读取 `story-craftsman` 产出的 User Story / AC。需求事实不足时，先回到该 skill 补需求边界。
- 设计完成后，如需要拆成可执行任务，调用 `superpowers:writing-plans`。
- 设计产物交给 `dev-workflow` 继续实现、验证、review、发布。
- 设计与实现一致性由 `code-review` 在合并前复核。

## Workflow：设计推进 1-8

本 skill 按 1-8 的编号顺序把需求转成可实施设计。若某环节不适用，要写 NotApplicable 原因；不要静默跳过。

| 环节 | 目标 | 联动 skill | 通过条件 |
|---|---|---|---|
| 1. 证据输入 | 收集需求、现状、规则、约束 | 读取 `story-craftsman` 产物 | 目标和边界有来源 |
| 2. 拓扑建模 | 判断 domain/system/component | 无外部调用 | ownership 和边界清楚 |
| 3. 问题拆解 | 列出架构问题和风险 | 需求缺口回到 `story-craftsman` | 关键未知被显式记录 |
| 4. 方案评估 | 比较候选方案和代价 | 无外部调用 | 决策不是单一拍脑袋 |
| 5. 契约设计 | 明确 API、数据、状态、事件 | 无外部调用 | 调用方和实现方能对齐 |
| 6. ADR 固化 | 记录长期影响的选择 | 无外部调用 | 决策、后果、替代方案可追溯 |
| 7. 验证发布 | 连接测试、观测、发布回滚 | 后续交给 `dev-workflow` 编排 | 实现前知道如何验收 |
| 8. 交接计划 | 拆分落地任务 | 可选 `superpowers:writing-plans` | 后续实现可直接推进 |

## 1. 证据输入

开始前读取或确认：

| 证据 | 用途 |
|---|---|
| User Story / AC | 设计目标和验收边界 |
| 现有 docs | 避免术语、路径、ADR 漂移 |
| README / AGENTS / CLAUDE / GEMINI | 项目规则 |
| 代码目录 | 当前模块边界 |
| 测试 | 已有保障 |
| API/schema/migration | 契约和数据演进 |
| CI/CD/config | 发布约束 |

信息不足时输出草案和待确认，不把假设写成事实。

## 产物地图

推荐公开版文档结构如下；项目已有结构时可映射到等价目录。

```text
docs/
├── entry.html
├── research/findings.html
├── product/stories/story-index.html
├── architecture/
│   ├── map.html
│   ├── language.html
│   ├── stack.html
│   ├── decisions/
│   │   ├── decision-index.html
│   │   └── 0001-example.html
│   └── systems/<system>/
│       ├── overview.html
│       └── components/<component>/design.html
├── tests/strategy.html
├── release/local.html
├── release/ci.html
├── release/cd.html
└── guide/
```

最低要求：有入口、术语、架构、决策、测试、发布。

## 1.1 公开治理替代机制

如果项目没有内部服务目录、开发者门户或架构平台，用以下公开文件替代治理能力。目标不是引入新平台，而是让 ownership、契约、文档入口和发布责任可追溯。

| 治理能力 | 推荐公开替代 | 最低内容 |
|---|---|---|
| 服务目录 | `docs/architecture/service-registry.html` 或 `service-registry.yaml` | service/system/component、owner、lifecycle、repo、runtime |
| 所有权 | `OWNERS` / `CODEOWNERS` / `docs/architecture/ownership.html` | 模块 owner、reviewer、升级路径 |
| 文档门户 | `docs/entry.html` + 各 index | 需求、架构、ADR、测试、发布入口 |
| API 注册 | `docs/architecture/api-registry.html` 或 `openapi/`、`proto/` 索引 | API 名、版本、owner、消费者、契约文件 |
| ADR 索引 | `docs/architecture/decisions/decision-index.html` | 编号、标题、状态、日期、影响范围 |
| 部署目录 | `docs/deployment/deployment-registry.html` | 环境、artifact、config、secret 来源、rollback |

设计时按以下规则处理：

- 项目已有等价文件时复用，不强行改名。
- 没有治理文件时，先创建最小索引，标出未知项。
- 不把 owner、API、ADR、部署信息散落在聊天记录里。
- 新增 system/component/API/worker/job/topic/storage 时，同步更新对应 registry。
- registry 只保存事实和入口，不复制长篇设计正文。

最小 `service-registry.yaml` 形态：

```yaml
services:
  - name: example-service
    type: web-service
    owner: team-or-person
    lifecycle: proposed
    repo: .
    docs: docs/architecture/systems/example-service/overview.html
    APIs:
      - openapi/example-service.yaml
    depends_on: []
```

## 2. 拓扑建模

先判断三类边界：

- **Domain**：长期业务问题域。
- **System**：有独立治理、发布、运行或责任边界的一组能力。
- **Component**：高内聚、可测试、可独立演进的单元。

Component 判断：

- 是否有独立职责。
- 是否有清晰契约。
- 是否有独立演进或独立测试价值。

不要只用“是否独立部署”判断 Component。共进程也能有多个 Component。

跨端 vertical 只在这些场景使用：

- 同一业务能力同时涉及 App/Web/Backend/Admin/Embedded。
- 端云字段、状态、契约必须统一。
- 核心流程跨多个 System，放在单端文档会缺上下文。

vertical 文档建议：

```text
docs/architecture/verticals/<capability>/
├── cockpit.html
├── glossary.html
├── client/
├── service/
├── contract/
├── data/
├── journeys/
└── decisions/
```

选择 vertical 组织本身要写 ADR。

## 3. 架构问题检查项

按信号选择检查项追问：

| 信号 | 必问 |
|---|---|
| 多角色/权限 | 谁能读写？身份来源是否可信？ |
| 多租户 | 数据、配置、故障如何隔离？ |
| 多步骤 | 状态、转换、非法状态、并发如何处理？ |
| 外部依赖 | 超时、重试、降级、对账、签名怎么做？ |
| 异步/定时 | 重复、乱序、死信、补偿如何处理？ |
| 数据写入 | owner、事务、索引、migration、回滚是什么？ |
| 跨端/跨服务 | 版本、兼容、灰度、旧客户端怎么办？ |
| 用户可见 | 曝光、转化、失败、恢复如何观测？ |
| 高风险 | kill switch、告警、演练、回滚在哪里？ |

## 4. 方案评估

重要设计至少两个选项，高风险设计建议三个选项。

每个选项写：

- 核心做法。
- 收益。
- 成本。
- 风险。
- 适用条件。
- 选择或放弃原因。

表格：

| 选项 | 做法 | 收益 | 成本 | 风险 | 结论 |
|---|---|---|---|---|---|

只有一个可行方案时，解释其它方案不可行的证据。

## 5. 契约设计与技术设计文档

设计文档必须覆盖：

- 背景和目标。
- 非目标。
- 需求与 AC 链接。
- 现状和约束。
- 拓扑与边界。
- 术语和领域模型。
- 候选方案和取舍。
- 选定方案。
- Component 职责。
- 数据 ownership、schema、索引、migration。
- API、事件、契约。
- 状态机和核心流程。
- 错误处理、重试、降级、补偿。
- 兼容、发布、回滚。
- 测试策略。
- 可观测性。
- 当前代码差距。
- 待确认问题。

长文档要有导航和稳定锚点。图必须配文字说明。

## 术语与领域模型

维护权威文件，例如：

```text
docs/architecture/language.html
```

记录：

- 业务术语。
- 技术实体。
- 状态枚举。
- 数据 owner。
- 不变量。
- 别名和禁用叫法。

新增实体、状态、字段语义或 ownership 时，先更新这里。

## 6. ADR 固化契约

写 ADR 的触发：

- 长期方案选择。
- 放弃合理替代方案。
- 新依赖、新数据模型、新集成方式。
- 模块边界、状态机、API 兼容策略变化。
- 信息不足但关键决策点已出现。

ADR 内容：

- 标题。
- 状态：Proposed / Pending / Accepted / Rejected / Deprecated / Superseded。
- 日期和决策人。
- 问题背景。
- 候选方案。
- 对比分析。
- 决策结果。
- 后果、代价、后续动作。

命名：

```text
0001-choose-outbox-for-order-events.html
```

规则：

- 同目录递增编号。
- Pending ADR 写待回答问题。
- 不删除旧 ADR；推翻时新建 ADR，并双向标注。
- 新增 ADR 同步索引。

## Component 契约

每个 Component 设计必须写：

- 职责。
- 不负责内容。
- public contract。
- 内部状态。
- 数据 owner。
- 上游/下游。
- 故障策略。
- 测试点。
- 观测点。

跨 Component：

- Provider 只暴露 public contract。
- Consumer 不依赖 private/internal 实现。
- 装配在 composition root。
- 共部署不等于共享内部实现。

当前代码没做到时，写目标边界和差距。

## 7. 验证发布联动

设计阶段必须给出：

| 维度 | 必须说明 |
|---|---|
| Unit | 规则、状态、边界 |
| Integration | API、DB、队列、依赖 |
| E2E | 用户 AC |
| Contract | 跨端/跨服务 |
| Migration | schema/backfill/rollback |
| Observability | 成功、失败、延迟、依赖、用户影响 |
| Release | 发布顺序、灰度、回滚、验证 |

## 维护要求

- 新文档要有入口。
- 新术语要更新术语文件。
- 新 ADR 要更新索引。
- 设计结论不能只留在聊天记录。
- 不写没有 owner、条件、期限的“后面补”。

## 不通过条件

- 未读需求就给方案。
- 没有目标和非目标。
- 没有选项和取舍。
- ADR 只有结论。
- 设计没有测试或观测。
- 数据写入没有 owner、幂等、迁移或回滚。
- 外部依赖没有失败策略。
- breaking change 没兼容方案。
- 代码已实现但文档缺失。

## 8. 交付清单

- 需求足够清楚。
- 拓扑和边界清楚。
- 选项真实且取舍明确。
- ADR 完整。
- 公开治理索引已更新或说明不适用。
- Component 边界可执行。
- 测试、观测、发布、回滚齐备。
- 可以交给 `superpowers:writing-plans` 拆任务。

## 调研检查项

以下情况必须先做轻量调研：

- 产品体验不清楚。
- 技术路线有多个成熟选择。
- 引入新第三方服务、开源库、协议或基础设施。
- 涉及安全、隐私、支付、合规、数据保留。
- 团队对领域模型缺乏共同语言。

调研产物至少包含：

| 项目 | 内容 |
|---|---|
| 问题 | 为什么需要调研 |
| 现有做法 | 项目当前状态 |
| 外部参照 | 竞品、开源、标准或社区实践 |
| 选项 | 可选路线 |
| 约束 | 成本、风险、团队能力 |
| 设计启示 | 对本次方案的影响 |

调研不足时不要阻塞所有设计，但必须把假设写入 Open Questions 或 Pending ADR。

## 文档入口检查项

每个设计产物都要能被找到。

| 产物 | 入口要求 |
|---|---|
| 需求 | user story index 链接 |
| 架构总览 | architecture map 链接 |
| Component 设计 | system overview 链接 |
| ADR | decision index 链接 |
| 测试策略 | testing strategy 链接 |
| 可观测性 | design 或 progress 链接 |
| 发布回滚 | release docs 链接 |

新增、重命名或删除文档时，同步更新入口。不要让正文只存在于聊天记录。

## 架构关注点展开

权限：

- 认证是谁做的？
- 授权发生在哪一层？
- 服务端是否信任客户端传来的用户、租户或角色？
- 管理员能力和普通用户能力是否隔离？
- 审计日志是否需要保留？

状态机：

- 状态列表是什么？
- 初始状态是什么？
- 终态是什么？
- 哪些转换非法？
- 并发转换如何处理？
- 失败后状态停在哪里？

数据：

- source of truth 是哪一方？
- 表、集合、缓存、文件分别由谁拥有？
- 写入是否需要事务？
- 是否需要唯一约束？
- 索引是否支持查询路径？
- migration 是否兼容旧版本？

异步：

- 消息是否可能重复？
- 是否可能乱序？
- ack 时机是什么？
- 死信如何处理？
- 补偿任务如何触发？
- 重试是否有上限？

外部依赖：

- 超时多少？
- 哪些错误可重试？
- 哪些错误不可重试？
- 降级体验是什么？
- 是否需要签名、验签、对账？
- 是否需要防腐层？

## API 设计检查项

API 或事件契约必须写：

- 方法或事件名。
- 请求字段。
- 响应字段。
- 错误分类。
- 幂等策略。
- 分页、排序、过滤。
- 版本兼容。
- 鉴权和权限。
- 限流或配额。
- 示例。

错误分类建议：

| 类型 | 示例 | 处理 |
|---|---|---|
| validation | 参数错误 | 用户修正 |
| auth | 未登录/无权限 | 引导登录或拒绝 |
| conflict | 状态冲突、重复提交 | 展示可恢复提示 |
| dependency | 下游失败 | 重试、降级或排队 |
| internal | 未预期错误 | 记录并告警 |

## 数据演进检查项

涉及 schema 或数据语义变化时必须写：

- 当前 schema。
- 目标 schema。
- migration 步骤。
- backfill 策略。
- 是否在线安全。
- 是否可重复执行。
- 是否需要灰度读取/双写。
- 回滚后新数据如何处理。
- 旧版本代码是否读得懂。

大表或高频表变更必须说明锁表风险和替代方案。

## 状态机检查项

状态机设计至少包含：

| 内容 | 要求 |
|---|---|
| 状态表 | 状态名、含义、是否终态 |
| 转换表 | from、to、触发、guard、side effect |
| 非法转换 | 发生时返回什么错误 |
| 并发 | 同时触发怎么处理 |
| 恢复 | 失败后如何重试或补偿 |
| 观测 | 每个关键转换是否有日志/指标 |

不要只画图不写 guard；图表达结构，表表达约束。

## 可观测性设计检查项

设计阶段至少写方向，完整细节可交给 dev workflow 的 Signal Plan。

必须覆盖：

- 成功路径。
- 失败路径。
- 用户影响。
- 延迟。
- 外部依赖。
- 回滚验证。

示例表：

| 场景 | 信号 | 用途 |
|---|---|---|
| 用户看到入口 | event | 判断曝光 |
| 用户完成动作 | event/metric | 判断转化 |
| 下游失败 | log/metric/trace | 定位故障 |
| 回滚完成 | metric/dashboard | 确认恢复 |

## 发布回滚检查项

任何生产影响变更必须写：

- 发布入口。
- 发布顺序。
- 环境差异。
- 配置和 secret。
- feature flag 或灰度。
- migration/backfill 顺序。
- 旧版本兼容。
- 回滚命令或操作。
- 回滚后数据处理。
- 上线后验证清单。

如果不能回滚，必须明确说明不可逆点和补救策略。

## 实现计划交接检查项

交给 `superpowers:writing-plans` 前，设计文档必须能拆成任务。

每个任务需要：

- 文件或模块范围。
- 前置依赖。
- 要实现的行为。
- 要新增或修改的测试。
- 验证命令。
- 关联 AC 或 ADR。
- 风险和回滚注意点。

不能出现只有“实现功能”“补测试”“完善逻辑”这种不可执行任务。

## 设计 Review 表

| 检查项 | 通过条件 |
|---|---|
| 目标 | reader 知道做什么和不做什么 |
| 选项 | 至少两个方案或说明为何只有一个 |
| 边界 | Domain/System/Component 或 vertical 清楚 |
| 数据 | owner、schema、migration、回滚清楚 |
| API | 契约、错误、幂等、兼容清楚 |
| 状态 | 状态、转换、非法状态清楚 |
| 失败 | 外部依赖、重试、降级、补偿清楚 |
| 测试 | AC 到测试层级可追溯 |
| 观测 | 成功和失败可发现 |
| 发布 | 灰度、回滚、验证清楚 |

## 反模式

- 用目录结构代替边界解释。
- 用“后续扩展”代替具体扩展点。
- 只写推荐方案，不写为什么放弃其它方案。
- ADR 写成会议纪要。
- 状态机只画 happy path。
- 数据 migration 没有回滚和兼容。
- 外部依赖没有失败策略。
- 可观测性只写“加日志”。
- 测试策略只写“补单测”。
