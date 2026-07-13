# 设备绑定 + HB1 解绑保留配对 — 工作中用到的 Skill

> 配合 [03-device-binding-hb1.md](../../03-device-binding-hb1.md) §8（AI 从 0→1）/ §9（AI 失败模式与防护）。

## A. 项目专属 skill（`project-specific/`）

来源：`g0-android/.claude/skills/`（绑定业务主仓）。

| Skill | 行数 | 作用 | 对应工作总结 | 作者归属 |
|-------|------|------|--------------|----------|
| [add-language](project-specific/add-language/SKILL.md)（+ REFERENCE.md） | 75+102 | 多语言文案接入工作流（绑定流程大量 i18n，如 `hub_unbind_*`→`remove_hub_*` key 重命名） | §3.2 i18n key 重命名 / §4 | 团队（526252549、zchen1 提交），**我是使用者** |
| [mr-sonar](project-specific/mr-sonar/SKILL.md) | 177 | MR 提交前 Sonar 静态检查工作流 | §5 测试与质量 | 团队（zchen1 提交），**我是使用者** |

> 注：g0-android 还有更多 skill（abilities 文档曾提到 18 个），但按 git 归属，那些 `.claude/skills/` 不是我提交的——面试讲法是"我在绑定业务里**使用**了团队的 add-language / mr-sonar 等 skill"，不宜声称自建。

## B. 通用工作流 skill（复用，不重复拷贝）

superpowers 研发流程 skill 原文见 **[../../warranty/skills/workflow-superpowers/](../../warranty/skills/workflow-superpowers/)**。

本工作的使用证据：
- **spec 先行（brainstorming→writing-plans）**：HB1 解绑保留配对先落 `docs/requirements/hombase-kit-retain-pairing.md` + `docs/test-cases/` 再写代码。
- **test-driven-development**：DeviceHelper 三路分支测试、RemoveHubDeviceActivity §11 真值表测试均为 [AI-Generated]，实现与测试同步。
- **g0-android CLAUDE.md 工作流**：Plan→Design→Docs→Review→Test→Task→Verify→Build→Adb→CodeReview→Report + `[AI-Generated]` tag 公约。

## 面试讲法

- 这条线的 AI 工程化亮点是 **[AI-Generated] tag 高密度 + 跨端一致 commit 约束**：单个 HB1 特性 g0-android 集群 27 commit 里 25 个带 tag，可精确归因；CLAUDE.md 把"双端逻辑强一致"做成 commit 级硬规则。
- 诚实区分：workflow 流程 skill 是 superpowers 官方的（我是实践者）；add-language/mr-sonar 是团队 skill（我是使用者）；没有我原创的 skill。
