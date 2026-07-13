# 工作总结（面试用）

> 按**工作/项目**组织（与按能力维度组织的 [my-abilities.md](../my-abilities.md) 互补）。
> 每个工作一个 md（13 章：定位/背景/Scope/方案设计/关键技术/SDK健康性/兜底降级/可观测/AI 0→1/AI失败模式与防护/收益/Q&A/备选权衡/改进）+ 一个 `<work>/skills/` 目录存实际用到的 skill 原文。
> 全部基于各仓**真实 commit / ADR / 设计文档 / 代码**整理；ADR 编号、指标名、端点名、接口名、commit subject 均可在仓库内查到。

## 四个工作

| # | 工作 | 文件 | 主要仓库 | 我的角色 | 一句话 |
|---|------|------|----------|----------|--------|
| 1 | **Warranty Plus 售后保修全栈体系** | [01-warranty-plus.md](01-warranty-plus.md) | customer-care（+dbt） | 架构负责人 + 唯一全栈实现者 | Go后端+Flutter SDK+Next.js Admin+可观测+AI工程化，52 ADR / 10 Quality Gate |
| 2 | **Provisioning Kit 配网 SDK 0→1** | [02-provisioning-kit.md](02-provisioning-kit.md) | provisioning-kit | 架构负责人 + 唯一实现者 | 六边形配网 SDK，53 天 v1→v2→v3 三代演进，Fake 装配 + L1-L4 |
| 3 | **设备绑定跨端 + HB1 解绑保留配对** | [03-device-binding-hb1.md](03-device-binding-hb1.md) | g0-android/ios/flutter/coresdk | 绑定模块 Owner + 跨端协调人 | 4 仓锁步，解绑保留配对（retainPairing/cleanStorage），固件门控 |
| 4 | **VH Homebase 新品上架绑定（三端）** | [04-homebase-launch-binding.md](04-homebase-launch-binding.md) | g0-flutter/ios/android/coresdk | 新品绑定链路 Owner | 相机绑 Hub：固件校验+在线离线换网+蓝牙校验，让 HB1 能上架 |

## Skill 存档结构

- `warranty/skills/` — Warranty 专属（golden-data-tdd、release-engine）+ **`workflow-superpowers/`**（superpowers 研发流程 skill，**跨全部 4 工作共用，集中存此，其他工作引用不重复拷贝**）
- `provisioning-kit/skills/` — 无项目专属 skill；引用共享 workflow
- `device-binding-hb1/skills/` — 项目专属（add-language、mr-sonar）+ 引用共享 workflow
- `homebase-launch-binding/skills/` — 与 #3 同仓，引用 #3 项目 skill + 共享 workflow

## 诚实归属（避免面试踩雷）

| 类型 | 归属 | 讲法 |
|------|------|------|
| 4 个工作的架构/实现 | **我主导/实现** | "我设计/实现了…" |
| `golden-data-tdd` / `release-engine` / `add-language` / `mr-sonar` | **团队 skill，我是使用者** | "我用了团队的 X skill" |
| `workflow-superpowers/*`（brainstorming/writing-plans/TDD…）| **superpowers 官方插件，我是实践落地者** | "我用 superpowers 流程把 X 落成 ADR + Phase 实现" |
| AI 工程化体系（CLAUDE.md/quality_gate/ADR）| warranty & provisioning-kit 内**我主导**；g0-android skills 非我提交 | 见各文件 §8/§9 |
| 原创 skill | **目前无** | 不声称自建 skill |

## 关键差异化主题（跨工作复用，面试主线）

1. **六边形/Ports&Adapters + Split API**：warranty（api/feature 二包）、provisioning-kit（api/feature + 5 Port）——SDK 跨宿主复用、零依赖传染。
2. **ADR 驱动 + 分阶段迁移**：warranty 52 ADR、provisioning-kit 22 ADR 三代演进——决策可追溯、迁移不 big-bang。
3. **AI 工艺化（从赌运气到按工艺）**：CLAUDE.md 约束 + Quality Gate 硬门控 + Spec/Plan/Phase + 多轮 review + [AI-Generated] tag + AI 失败模式防护（见各文件 §8/§9）。
4. **fail-soft 给用户 / fail-loud 给 oncall**：四个工作的兜底降级哲学一致（见各 §6）。
5. **跨端/跨仓锁步治理**：HB1 跨 4 仓同分支同日 merge、双端一致 commit 约束。
