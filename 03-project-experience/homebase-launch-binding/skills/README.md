# Homebase 新品上架绑定 — 工作中用到的 Skill

> 配合 [04-homebase-launch-binding.md](../../04-homebase-launch-binding.md) §8（AI 从 0→1）/ §9（AI 失败模式与防护）。

## A. 项目专属 skill（与 #3 同仓，引用不重复拷贝）

本工作与 #3 设备绑定共用 `g0-android` / `g0-flutter-module` / `g0-ios` 仓，项目 skill 相同，原文已存档在
**[../../device-binding-hb1/skills/project-specific/](../../device-binding-hb1/skills/project-specific/)**：

| Skill | 作用 | 本工作的使用点 | 作者归属 |
|-------|------|----------------|----------|
| add-language | 多语言文案接入 | Homebase 绑定流程的多语言文案 | 团队，我是使用者 |
| mr-sonar | MR 提交前 Sonar 检查 | 绑定 MR 质量 | 团队，我是使用者 |

## B. 通用工作流 skill（复用）

superpowers 研发流程 skill 原文见 **[../../warranty/skills/workflow-superpowers/](../../warranty/skills/workflow-superpowers/)**。

本工作的使用证据：
- **设计文档先行（brainstorming→writing-plans）**：`select_home_base_error_handling.md`（321 行）、`switch_network_design.md`（v1.4）先于代码。
- **test-driven-development**：换网透传 + BLE fallback 的 P0 测试（MR !1205）为 [AI-Generated]。

## 面试讲法

- 与 #3 同属 HB1 硬件线、共享固件门控基础设施与同套 g0-android CLAUDE.md 工作流；#4 偏"新品绑定链路"、#3 偏"解绑保留配对"，功能正交。
- 诚实区分：workflow 是 superpowers 官方（我是实践者）；add-language/mr-sonar 是团队 skill（我是使用者）。
