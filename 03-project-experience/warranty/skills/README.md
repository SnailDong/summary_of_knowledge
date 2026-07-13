# Warranty Plus — 工作中用到的 Skill（原文存档）

> 这是 Warranty Plus 研发过程中**实际使用**的 skill 原文存档，作为 AI 工程化能力的**具体证据**。
> 配合 [01-warranty-plus.md](../../01-warranty-plus.md) §8（AI 从 0→1 设计）/ §9（AI 失败模式与防护）讲。
> 分两组：**项目专属**（customer-care 仓自带）+ **通用工作流**（superpowers 全局插件，跨所有工作复用）。

---

## A. 项目专属 skill（`project-specific/`）

来源：`customer-care/.claude/skills/`。这两个是 warranty 业务线特有的。

| Skill | 行数 | 作用 | 对应工作总结 | 作者归属 |
|-------|------|------|--------------|----------|
| [golden-data-tdd](project-specific/golden-data-tdd/SKILL.md) | 213 | 从 staging 真实 Snowplow 数据生成 golden fixture，跨层（engine/admin/SDK/backend/dagster）驱动 TDD | §5 测试金字塔 / §6 兜底 / §8 双层 Context Engineering / §9.2 防护⑦（治 AI 猜字段名/编 mock） | 团队（jchen 提交），**我是使用者** |
| [release-engine](project-specific/release-engine/SKILL.md) | 808 | 发布工程工作流（CI 自动推 S3、灰度、多环境 prod-us） | §8 Phase 门控 / 发布节奏 | 团队（zchen1 提交），**我是使用者** |

## B. 通用工作流 skill（`workflow-superpowers/`）

来源：superpowers 官方插件（`~/.claude/plugins/.../superpowers/5.1.0/skills/`）。
**这套是跨所有 4 个工作共用的研发流程 skill**（warranty / provisioning-kit / 设备绑定 / homebase 都用同一套），暂放此处，其他工作引用不重复拷贝。
证据：`customer-care/docs/superpowers/specs/` 与 `plans/` 就是这套流程（brainstorming→writing-plans→executing-plans）的真实产物。

| 阶段 | Skill | 行数 | 作用 | 对应工作总结 |
|------|-------|------|------|--------------|
| **设计** | [brainstorming](workflow-superpowers/brainstorming/SKILL.md) | 164 | 想法→spec：一次一问澄清→2-3 方案权衡→落 design doc | §8 Spec 阶段 |
| **计划** | [writing-plans](workflow-superpowers/writing-plans/SKILL.md) | 152 | spec→分阶段 impl plan（每阶段产出+门控） | §8 Phase 0-9 |
| **执行** | [executing-plans](workflow-superpowers/executing-plans/SKILL.md) | 70 | 按 plan 逐阶段实现 | §8 Phased Execution |
| **测试** | [test-driven-development](workflow-superpowers/test-driven-development/SKILL.md) | 371 | TDD Iron Law：先红测试再实现 | §5 / §9.2 防护⑥（治 AI 先写实现补假测试） |
| **评审** | [requesting-code-review](workflow-superpowers/requesting-code-review/SKILL.md) | 103 | 发起 code review | §3.3 / §9 多轮 review |
| **评审** | [receiving-code-review](workflow-superpowers/receiving-code-review/SKILL.md) | 213 | 接收/处理 review（P0/P1/P2 分级） | §9.2 防护⑧ |
| **收尾** | [finishing-a-development-branch](workflow-superpowers/finishing-a-development-branch/SKILL.md) | 251 | 分支收尾流程 | §8 发布节奏 |
| **验证** | [verification-before-completion](workflow-superpowers/verification-before-completion/SKILL.md) | 139 | 完成前强制验证（治"AI 声称做完了"） | §9.1 问题1 / §9.2 防护 |
| **调试** | [systematic-debugging](workflow-superpowers/systematic-debugging/SKILL.md) | 296 | 系统化 root-cause 调试（含 defense-in-depth / root-cause-tracing 子文档） | §9.3 |
| **并行** | [subagent-driven-development](workflow-superpowers/subagent-driven-development/SKILL.md) | 279 | 子代理驱动开发（implementer/reviewer 分离 prompt） | §8 AI 工艺 |
| **并行** | [dispatching-parallel-agents](workflow-superpowers/dispatching-parallel-agents/SKILL.md) | 182 | 并行派发多 agent | §8 AI 工艺 |
| **隔离** | [using-git-worktrees](workflow-superpowers/using-git-worktrees/SKILL.md) | 215 | git worktree 隔离并行开发 | §8 AI 工艺 |

---

## 面试讲法（重要）

1. **两层 Context Engineering**：第一层是 CLAUDE.md（架构约束），第二层就是这些 skill（把研发流程编码成可调用工作流）。skill 让 AI 在固定工艺下产出，而不是每次重新发明流程。
2. **诚实归属**：
   - `golden-data-tdd` / `release-engine` 是**团队 skill，我是使用者**（不是作者）——讲"我用团队的 golden-data-tdd 做 warranty 跨层测试"。
   - `workflow-superpowers/` 是 **superpowers 官方插件**，我是这套方法论的**实践落地者**——讲"我用 superpowers 的 brainstorming→writing-plans→executing-plans 把 warranty 从 spec 落到 52 个 ADR + Phase 0-9 实现"，证据是仓里的 `docs/superpowers/specs/` 和 `plans/`。
   - 如果有**我自己写的 skill**，应单独标注作者=我，目前 warranty 这块没有我原创的 skill。
3. **skill 的局限（主动讲加分）**：skill 质量决定 AI 上限；探索性工作（选型/重构）流程化 skill 反而限制 AI；跨模块隐式约定 CLAUDE.md 写不清 AI 会猜错——见 my-abilities §4.9。
