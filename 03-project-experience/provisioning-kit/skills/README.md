# Provisioning Kit — 工作中用到的 Skill

> 配合 [02-provisioning-kit.md](../../02-provisioning-kit.md) §8（AI 从 0→1）/ §9（AI 失败模式与防护）。

## A. 项目专属 skill

**无。** provisioning-kit 仓的 `.claude/` 下只有 `settings.local.json`（permissioned Bash 命令配置），没有自定义 `.claude/skills/`。
这个项目的 AI 约束主要靠 **架构先行（Phase 0 文档先于代码）+ CLAUDE.md 命名/依赖硬约束 + Fake 测试装配 + CI 分阶段门禁**，而非自定义 skill。

## B. 通用工作流 skill（复用，不重复拷贝）

这个项目同样用了 superpowers 的研发流程 skill，原文已存档在
**[../../warranty/skills/workflow-superpowers/](../../warranty/skills/workflow-superpowers/)**（跨所有工作共用，不在每个工作下重复拷贝）。

本项目对这套流程的使用证据：
- **brainstorming → writing-plans → executing-plans**：体现为 22 个 ADR + Phase 0→R11 + bind-migration W1/W2/W3 的分阶段计划与执行。
- **test-driven-development**：AI-TDD 闭环，`flutter test` 为唯一反馈源 + Fake 装配。
- **requesting/receiving-code-review**：MR 评审。
- **subagent-driven-development / dispatching-parallel-agents**：30+ 页面、多 wave 并行迁移。

## 面试讲法

- 这个项目和 warranty 的区别:warranty 靠 [AI-Generated] tag + quality_gate 体系化约束 AI;provisioning-kit 靠**架构先行 + Fake 装配 + 分阶段门禁**前置约束 AI——两种打法,前者偏可追溯,后者偏前置防护。
- 没有自定义 skill 不等于没有 AI 工程化——CLAUDE.md(命名规范/Ports&Adapters 硬约束/编码纪律)+ 22 ADR(SSOT)+ L1-L4 测试策略,本身就是第一层 Context Engineering。
