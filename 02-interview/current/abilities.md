# 我的能力清单（Resume 提炼池）

> 用途：把可以写进简历 / 面试讲的"能力素材"按维度沉淀在这里，后续按岗位 JD 从中提取。
> 组织原则：**按能力维度**组织，不按项目。每条能力包含：定位 / 硬证据 / 简历用语 / 面试展开。
> 最后更新：2026-05-28

---

## 提炼指南

- **投移动端高级岗**：抽 §1 §2 §3 §6 §8 §10
- **投平台 / 架构岗**：抽 §3 §4 §6 §7 §9 §10
- **投 AI 工程 / Tooling 岗**：抽 §4 §5 §7 §10 为核心
- **投全栈岗**：抽 §1 §2 §3 §4 §7 §8 全部
- **写工作总结 / 述职**：按时间线穿起 §8 §9 §10 即可

每条都标了 **🔴 强差异化 / 🟡 中等差异化 / ⚪ 通用能力**，差异化越高优先级越高。

---

## §1 角色与定位

### 1.1 主导级技术贡献者（非纯执行）🔴
- **定位**：在 ADDX 是「绑定与售后两条业务线的架构负责人」+「团队 AI 工程化体系负责人」
- **证据**：
  - Provisioning Kit：0→1 设计三层架构 + 26 个 HTTP 端点 ProvisioningBackend 抽象
  - Warranty Plus：独立完成 Go 后端 + Flutter SDK + Admin 后台 + Observability 4 层全栈
  - 26 个 ADR (ADR-W14 → ADR-W51) 全部我主导起草或拍板
  - HB1 解绑保留配对特性：跨 4 仓 (g0-android / g0-ios / smartdevicecoresdk-ios / g0-flutter-module) 锁步演进，我作为协调人
- **简历用语**：
  > "作为绑定模块 Owner 与团队 AI 工程化体系负责人，主导从单体重构、跨端 SDK 化、到 AI 驱动研发体系的完整演进"
- **面试展开**：
  - 不只是写代码，是定义"这块业务该怎么演进"
  - 26 个 ADR 编号严格递增 = 每个架构决策都留痕、可追溯、可逆
  - 跨 4 仓协同 = 不只是技术能力，是工程组织能力

### 1.2 跨域迁移者（车载 → IoT）⚪
- **定位**：从 2.5 年车载 Framework 层经验迁移到 IoT 端到端
- **证据**：
  - 德赛西威：Framework TBoxService / Binder IPC / Handler / 多设备互联管理（含一项专利）
  - ADDX：把状态机思维迁移到 BLE 配网 / Matter commissioning / WiFi 切换网络
- **简历用语**：
  > "将车载 Framework 层 IPC / 状态机 / 互联策略经验，系统化迁移到 IoT 设备绑定与跨协议配网"
- **面试展开**：状态机设计在两个领域同构 —— 车载多设备互联和 IoT BLE/WiFi/Matter 三协议路径切换

---

## §2 全栈技术能力（按层）

### 2.1 客户端：Flutter / Dart 🔴
- **核心能力**：
  - Flutter Monorepo / Package 化（Dart 3.5 Workspace、melos）
  - 跨平台插件（MethodChannel 标准化）
  - 三层包架构设计（api / core / ui / feature 分离）
- **证据**：
  - provisioning-kit：3 layer + 8 个 host adapter 接口
  - warranty_plus：Split API 架构（warranty_plus_api + warranty_plus），git ref 引用
  - flutter_bind_plugin：personal spike → 生产化路径验证
- **简历用语**：
  > "熟练 Flutter Monorepo + MethodChannel + 三层 SDK 架构，主导 2 套生产级 SDK 0→1 设计"

### 2.2 Android：Kotlin / Java / Framework 🟡
- **核心能力**：
  - Kotlin 业务开发 + Jetpack（ViewModel / LiveData / Navigation / Room）
  - Framework 层（Binder IPC、Handler、AIDL、TBoxService）
  - JNI / HAL 开发
- **证据**：
  - g0-android：117 个 feat(bind) + 29 个 fix(bind) commits 过去 12 月
  - 数据脱敏框架：KeyBased + ValueBased 双层规则引擎
  - RemoveHubDeviceActivity §11 unit + integration test
- **简历用语**：
  > "Android Kotlin / Java + Jetpack 全栈，含 Framework 层 TBoxService / Binder IPC / JNI 开发，有过专利申请"

### 2.3 iOS：Objective-C / Swift 🟡
- **核心能力**：
  - CocoaPods SDK 开发与发布
  - iOS 14+ Local Network 权限处理
  - Discovery / Transport / Business 三层模块拆分
- **证据**：
  - g0-ios：66 个 feat(binding) commits
  - smartdevicecoresdk-ios：62 个 commits，HB1 / homebase / retain_pairing 链路
  - 526 行单体 → 三层（每层 < 100 行）
- **简历用语**：
  > "iOS OC / Swift + CocoaPods SDK 化，单体模块按 Ports & Adapters 重构经验"

### 2.4 后端：Go / go-zero / MySQL / Redis 🔴
- **核心能力**：
  - Go go-zero 微服务（API + RPC + 中间件）
  - MySQL schema 演进与表结构合并
  - Redis 缓存与限流（设计中）
- **证据**：
  - Warranty Plus Go 后端从 0 写起
  - ADR-W26：4 张表合并成 2 张表（registration 模型重构）
  - 跨账号 internal ALB（WARRANTY_BACKEND_URL 指向跨 AWS account）
  - timestamp semantics：split created_at vs registered_at
- **简历用语**：
  > "Go 后端独立完成 Warranty Plus 全链路：API + RPC + MySQL schema 演进 + 跨账号 ALB 部署"

### 2.5 数据：DBT / Superset / Snowplow 🟡
- **核心能力**：
  - DBT view 创建用于 BI 分析
  - Superset 角色化数据权限（prod 禁用敏感列、admin 脱敏）
  - Snowplow 结构化埋点（JSON Schema 版本管理）
- **证据**：
  - DATA/dbt：`vw_warranty_events` view for Superset
  - tracker JSON_SCHEMA_VERSION 1-0-44 → 1-0-50（schema 版本化演进）
  - role-based email mask `e****e@email`
- **简历用语**：
  > "打通后端 → 数仓 → BI 完整链路：Go 服务写库 + DBT view 建模 + Superset 角色化展示"

### 2.6 运维 / DevOps：GitLab CI / ArgoCD / Prometheus 🟡
- **核心能力**：
  - GitLab CI 多阶段流水线（L1 / L2 / L3 / observability-contract）
  - ArgoCD GitOps 部署
  - Prometheus / Grafana / PrometheusRule 全套
- **证据**：
  - dual-SSOT 合并：K8s Prometheus 双套配置坍塌成单一 SSOT
  - Grafana Dashboard Sync Script（Dashboard-as-Code）
  - PrometheusRule 时间窗口调整（低频 registration 误报治理）
- **简历用语**：
  > "熟悉 GitOps + ArgoCD + Prometheus / Grafana 全链路可观测性，从 K8s 配置到告警调优有完整落地经验"

---

## §3 架构设计能力

### 3.1 Ports & Adapters（六边形架构）🔴
- **应用**：
  - provisioning_kit：8 个 host adapter 接口（HTTP / Permission / Navigator / i18n / Tracker / Theme / Resources / State）
  - warranty_plus：WarrantyHostContext + WarrantyRoute typed constants
- **简历用语**：
  > "熟练 Ports & Adapters，主导 provisioning_kit 8 个 adapter + warranty_plus host context 设计"
- **面试展开**：
  - 不只是套模板，每个 adapter 都有"为什么这样切"的决策依据
  - LatticeEventBus 解耦：把框架硬依赖换成 Stream，core 包零框架污染

### 3.2 ADR 驱动设计 🔴
- **应用**：
  - Warranty Plus 26 个 ADR（W14 → W51）
  - 每个 ADR：Context / Decision / Consequence / Phases / 验收标准
  - 多阶段灰度（ADR-W49 Phase 1/3/5/8）
- **简历用语**：
  > "在 Warranty Plus 落地 ADR 驱动开发，26 个架构决策完整留痕，每个 ADR 有阶段化发布与验收标准"
- **面试展开**：
  - ADR 不是文档负担，是 review 时的判决依据 —— 你和 review 者吵架时翻 ADR
  - 编号严格递增 → 决策可逆性（要 revert 时不影响其他 ADR）
  - "ADR-W21c" 这种带子版本号 = 同一决策的多次修正全部留痕

### 3.3 分层迁移策略（不是 big bang）🔴
- **应用**：
  - Provisioning Kit 6 阶段迁移（Phase 0-5），每阶段有明确退出条件
  - Phase 2 与 Phase 3 并行压缩关键路径
- **简历用语**：
  > "复杂迁移采用分阶段策略，每阶段独立退出条件 + 关键路径并行压缩，避免 big bang 上线风险"
- **面试展开**：
  - 不是"我把 X 重构成 Y"，是"我把这次重构拆成 6 步，第 3 步出错只回滚第 3 步"
  - GetX 替换决策：先保留 GetX 完成迁移，再单独替换 —— 任一步出错都能精确归因

### 3.4 跨端契约设计 🔴
- **应用**：
  - WarrantyRoute typed native constants（Kotlin + Swift）替代 string route
  - WarrantyHostContext：getUserEmail / refreshEntryState / notifyAppLifecycle 三个 host bridge API
  - MethodChannel 统一 API 契约（取代多套自定义 NativeBridge）
- **简历用语**：
  > "设计 typed 跨端契约（Kotlin / Swift / Dart）替代 string-based 路由，配合 host bridge API 让 SDK 与宿主松耦合演进"

### 3.5 Split API（接口包与实现包分离）🟡
- **应用**：
  - warranty_plus_api（纯接口）+ warranty_plus（实现）
  - flutter_provisioning_api + flutter_provisioning_core + flutter_provisioning_ui
- **简历用语**：
  > "Split API 模式：接口包零运行时依赖，宿主仅依赖接口、实现可独立演进"

---

## §4 AI Engineering / Harness Engineering 🔴🔴🔴

> **这是你最大差异化，独立成节**

### 4.1 Context Engineering 双层架构
- **第一层 CLAUDE.md（架构约束）**：
  - 项目根目录定义不可逾越的规则
  - 例：`g0-android` 函数 < 20 行、类 < 200 行、单测覆盖率 ≥ 80%
  - 例：`warranty_plus` 5 条依赖规则 + 4 条质量规则
  - 例：`customer-care` 禁止裸命令启动服务、禁止固定端口 fallback
- **第二层 Skill 系统（流程编码）**：
  - `.claude/skills/` 把研发流程封装为可调用工作流
  - g0-android 有 18 个 skill：brainstorming / writing-plans / start-feature-development / TDD / fix-critical-bug / optimize-performance / systematic-debugging / executing-plans / finishing-a-development-branch / requesting-code-review / receiving-code-review / dispatching-parallel-agents / subagent-driven-development 等
- **简历用语**：
  > "设计 CLAUDE.md（架构约束）+ Skill 系统（流程编码）双层 AI 工作框架，让 AI 在边界内自主推进，输出从'赌运气'变为'按工艺出产品'"

### 4.2 Quality Gate 硬约束
- **实现**：
  - 自研 `tools/quality_gate/bin/check.dart`（warranty_plus）
  - 9 条规则：format / analyze / 依赖单向性 / 覆盖率 ≥ 80% / 文档完整性 / Secret 扫描 / 100% 测试文件覆盖 / api 包零运行时依赖 / 禁止 GetX 等外部状态管理框架
  - **CI 与 pre-commit 同一入口**：本地通过 = CI 通过，杜绝"本地过 CI 挂"作弊路径
- **简历用语**：
  > "自研 Quality Gate（9 条规则），CI 与 pre-commit 同一执行入口，实现 AI 与人统一质量标准"

### 4.3 可追溯性纪律（[AI-Generated] tag）
- **数据（2026-06 精确统计，已校准）**：共 **203 个** commit 带 `[AI-Generated]` 明确标签，跨 5 仓分布：g0-android 84 / g0-ios 46 / customer-care(warranty) 38 / g0-flutter-module 29 / smartdevicecoresdk-ios 6。（原稿写 13 为早期估算，实际远不止；provisioning-kit 未用 tag 纪律，见下）
- **打法差异（诚实点）**：warranty + 三端绑定线推了 [AI-Generated] tag 公约；provisioning-kit（176 commit）未用 tag，改靠"架构先行 + Fake 装配 + 分阶段门禁"前置约束 AI——两种打法可对比讲
- **价值**：
  - 复盘可精确归因（这个 bug 是 AI 写的还是人写的）
  - 团队对 AI 输出有信心 = AI 越用越多
  - 后续可做 AI 代码 vs 人代码的质量对比分析
- **简历用语**：
  > "推动 [AI-Generated] / [human] commit tag 团队公约，13+ 个 AI 提交带标签，建立 AI 代码可审计、可归因体系"

### 4.4 TDD Iron Law
- **规则**：必须先看到失败的测试，才能写实现代码
- **实现**：
  - test-driven-development skill 写明"Iron Law"
  - pre-commit hook 检测 commit history：没有先红测试的实现 commit 直接拒绝
- **简历用语**：
  > "强制 AI 遵循 TDD Iron Law：先红测试、再实现，pre-commit hook 检测 commit history 阻断作弊"

### 4.5 Golden Data TDD（跨层一致性）
- **应用**：customer-care SmartPopup 模块
- **实现**：
  - 从 staging 真实 Snowplow 事件提取 JSON Fixture
  - **同一份 fixture 驱动 4 种语言层的测试**：Engine JS / Dagster Python / Admin TS / SDK Flutter
  - 必含 multi_user + fatigue_variant 强制覆盖用户隔离与频控
- **简历用语**：
  > "跨层 Golden Data TDD：同一 staging 真实数据 fixture 驱动 4 语言层测试，消除手写 Mock 字段名漂移导致的 silent failure"

### 4.6 ADR + 多轮 Review + Doc-Drift Gate
- **应用**：Warranty Plus
- **实现**：
  - 单 MR 走 5 轮 review 是常态（MR !465 round-5 doc-drift fixes）
  - 每轮 P0 / P1 / P2 分级
  - **Doc-Drift gate**：代码改了但 ADR / INTEGRATION_GUIDE / E2E_TEST_PLAN 没同步改，直接打回
- **简历用语**：
  > "在 Warranty Plus 实施多轮 Code Review SOP：P0/P1/P2 分级 + Doc-Drift gate（代码与文档必须同步），AI 与人受同一 review 标准约束"

### 4.7 Personal Spike → 生产化路径
- **应用**：flutter_bind_plugin (gchen/flutter_bind_plugin)
- **价值**：
  - 在 personal namespace 做 ADR-12/14-17 的预演 spike（v2.0 pivot to provisioning_core）
  - 验证后才推到 provisioning-kit 生产仓
  - 用 AI 做风险验证而非直接上生产
- **简历用语**：
  > "用 personal spike 仓做架构风险验证：v2.0 pivot 在 personal repo 先跑通，确认后才推生产仓"

### 4.8 失败案例（诚实加分维度）
- **案例**：dashboard metric-existence CI gate
- **故事**：
  - 加了一道 CI gate：Grafana dashboard 引用的每个 metric 必须真在 Prometheus 里存在
  - 加完发现误报多 → revert 掉
  - 本质问题：metric 命名规范没统一时，gate 比 metric 本身更脆弱
- **简历用语**：（不写简历，写面试）
  > "我也踩过坑：曾加 metric-existence CI gate 然后 revert，让我明白 gate 必须建立在'底层规范统一'之上，否则会反过来阻碍迭代"

### 4.9 Skill 体系的局限性认识
- **三个明确局限**：
  1. Skill 质量决定 AI 上限 —— 模糊 skill → 模糊输出 → 维护 skill 本身需持续投入
  2. 探索性工作（技术选型 / 重构）流程化 skill 反而限制 AI —— 这类需开放对话
  3. 跨模块隐式约定（业务规则 / 历史决策动机）CLAUDE.md 写不清 → AI 会猜错 → 需人工纠正
- **价值**：诚实承认局限 = 工程师可信度

---

## §5 工程纪律与质量门控

### 5.1 Pre-commit hook 与 CI 共用入口 🔴
- 详见 §4.2
- 简历用语见 §4.2

### 5.2 强制覆盖率门槛 🟡
- **应用**：
  - g0-android 单测覆盖率 ≥ 80%
  - warranty_plus api 包 100% 覆盖、feature 包 ≥ 80%
- **价值**：覆盖率不是检查项，是合并门槛

### 5.3 100% 测试文件覆盖 🟡
- **应用**：warranty_plus 规则：每个 .dart 文件必须有对应 _test.dart
- **价值**：防止"加文件不加测试"的隐性技术债

### 5.4 Secret 扫描 ⚪
- **应用**：quality_gate 9 条规则之一
- **简历用语**：通用，简历不必单独列

### 5.5 ADR 编号严格递增 + 子版本 🟡
- ADR-W21 → ADR-W21c：同一决策的多次修正全部留痕
- 不允许"覆盖式更新"

---

## §6 跨端协同与多仓库治理

### 6.1 跨 4 仓锁步演进（HB1 解绑保留配对）🔴
- **特性**：camera 与 hub 解绑但保留配对关系（业务复杂度极高）
- **范围**：
  - g0-android：117 个 feat(bind) + RemoveHubDeviceActivity 单测
  - g0-ios：feat(settings) Hombase 解绑整页移除界面
  - smartdevicecoresdk-ios：retain_pairing / cleanStorage / deactivatedevice API
  - g0-flutter-module：保留配对关系子设备页面展示
- **难点**：
  - 4 个仓库版本同步策略
  - 在线 / 离线两种 switch_network 流程
  - 蓝牙版本校验流程重构 + E2E 覆盖
- **简历用语**：
  > "主导 HB1 解绑保留配对特性跨 4 仓（Android / iOS / Core SDK / Flutter）锁步演进，含 deactivatedevice API 设计、在线/离线切网流程、蓝牙版本校验重构"

### 6.2 跨仓库 API 演进策略 🟡
- **应用**：
  - tracker_api JSON_SCHEMA_VERSION 1-0-44 → 1-0-50（schema 版本化）
  - WarrantyRoute typed constants 同时落 Kotlin + Swift + Dart
- **简历用语**：
  > "设计跨语言 schema 版本化机制（JSON_SCHEMA_VERSION），避免跨端字段漂移"

### 6.3 双端一致性约束 🔴
- **应用**：g0-android 的 CLAUDE.md 规则：修改一端必须同步另一端
- **强制方式**：commit message 必须说明"已同步 iOS：xxx" 或反之
- **简历用语**：
  > "通过 CLAUDE.md 强制双端一致性 commit message 约束，将'忘记同步'从习惯问题升级为流程问题"

### 6.4 功能退场治理（CS-Hub Matter 下架）🟡
- **故事**：
  - cshub 功能下架 + Matter 协议屏蔽
  - 视频资源裁剪以减包体积
  - code-review 三项 P0 证据收集
- **简历用语**：
  > "功能退场治理：CS-Hub 主分支下架配套 P0 证据三件套（视频资源裁剪 / 协议屏蔽 / code-review 验证）"
- **面试展开**：功能上线容易、退场难 —— 残留代码 / 残留资源 / 残留依赖都得清

---

## §7 可观测性与可靠性

### 7.1 三件套团队公约 🔴
- **规则**：发布前 Prom 指标 + Grafana Dashboard + GrowthBook A/B 配置三件套必须就位，否则不许合入
- **简历用语**：
  > "推动'发布前可观测性三件套'团队公约（Prom + Grafana + GrowthBook），从'上线后看 bug 反馈'升级为'发布前数据闭环准备好'"

### 7.2 Dashboard-as-Code 🟡
- **应用**：
  - Grafana Dashboard Sync Script
  - 加了 metric-existence CI gate 又 revert（见 §4.8）
- **简历用语**：
  > "Dashboard-as-Code：Grafana 看板用脚本同步到 GitOps，避免 UI 漂移"

### 7.3 Dual-SSOT 治理 🟡
- **应用**：customer-care K8s Prometheus 双套配置坍塌成单一 SSOT
- **简历用语**：
  > "识别并消除 Dual-SSOT 反模式：将 K8s Prometheus 双套配置合并为单一真理源"

### 7.4 多页 SDK Session 遥测 🟡
- **应用**：
  - warranty_page_opened{page=skip_dialog} 标签化埋点
  - SDK lifecycle pair (open-on-enter, close-on-exit)
  - Detail page 作为第 3 个 SDK session entry
- **简历用语**：
  > "设计多入口 SDK Session 标签化遥测，单一 universal session 模型覆盖 3 类入口"

### 7.5 告警时间窗口治理 🟡
- **应用**：PrometheusRule 为低频 registration 事件调整告警窗口（避免误报）
- **简历用语**：
  > "针对低频业务事件调整 PrometheusRule 时间窗口，消除告警误报疲劳"

### 7.6 弱网降级策略 ⚪
- **应用**：warranty_plus ConfigRepository 本地缓存
- 已经在 resume 写过，不重复

---

## §8 业务结果与影响

### 8.1 推动业务能力 0→1 🔴
- **Warranty Plus**：让运营首次获得 Amazon 订单号 ↔ App 账号关联能力，打通售后挽回闭环
- **HB1 解绑保留配对**：业务需求"换网但保留配对" 0 → 1 落地（4 仓协同）
- **CS-Hub 退场**：让团队从"功能上线"扩展到"功能退场治理"完整能力

### 8.2 跨 App 复用 🟡
- **Warranty Plus SDK**：3 个 App 共用同一套（KiwiBit / VicoHome / VicoNature）
- **节省**：相比各自实现节省约 2/3 重复工作量

### 8.3 缩短关键路径 🟡
- **Provisioning Kit Phase 2/3 并行**：将 6 阶段迁移的关键路径压缩
- **MethodChannel 统一**：新能力开发只写一套接口，双端通道改动成本降低

### 8.4 消除 Silent Failure 🔴
- **类型一**：ProvisioningBackend 26 端点强制配套真实响应样本（字段名 diff 审查）
- **类型二**：Golden Data TDD 跨 4 层共用 fixture（字段名漂移消除）
- **类型三**：Doc-Drift Gate（代码 / 文档不一致消除）
- **简历用语**：
  > "系统化消除 silent failure：API 字段 diff 审查 + Golden Data 跨层 fixture + Doc-Drift CI gate 三件套"

---

## §9 失败案例与反思（坦诚维度，面试加分）

> 这部分建议**不写简历**，但**面试时主动提**——会被认为是高级工程师标志。

### 9.1 dashboard metric-existence CI gate revert
- 详见 §4.8

### 9.2 GetX 替换延后决策
- 当时取舍：先保留 GetX 完成迁移、再单独替换
- 反思：如果当时合并两件事会怎样？答：任一步出错都难以归因
- 让人理解你的取舍是**有意为之**而非偷懒

### 9.3 Skill 文档与代码漂移
- 已认识到的局限（§4.9 第 1 条）
- 改进方向：skill 文档加"最后验证日期 + 对应代码版本"，过期提示 Review

### 9.4 跨项目 Skill 复用机制缺失
- 当前每个项目重复维护 skill
- 改进方向：通用 skill 提取为跨项目共享库

---

## §10 技术影响力与团队产出

### 10.1 输出 26 个 ADR 🔴
- ADR-W14 → ADR-W51（customer-care 仓）
- 每个 ADR：Context / Decision / Consequence / Phases / 验收
- 后续接手者完全可基于 ADR 追溯任何决策

### 10.2 Skill 体系：使用者 vs 作者（已按 git 归属校准）🟡
> ⚠️ 校准：按 git author 核对，下列仓内 `.claude/skills/` **多数不是我提交的**，面试应讲"使用者/实践者"，不宜声称自建：
- customer-care `.claude/skills/`：`golden-data-tdd`（jchen 提交）+ `release-engine`（zchen1 提交）——**我是使用者**
- g0-android `.claude/skills/`：`add-language` / `mr-sonar`（526252549、zchen1 提交）——**我是使用者**
- superpowers 官方插件：brainstorming / writing-plans / executing-plans / TDD / code-review 等——**我是实践落地者**（证据：warranty `docs/superpowers/specs/` + `plans/` 是这套流程的真实产物）
- **我主导的是「约束层」而非 skill 本身**：warranty + provisioning-kit 的 CLAUDE.md（架构/依赖/质量硬规则）+ 自研 quality_gate（10 条规则）+ 52/22 个 ADR —— 这些是我提交的，是 AI 工程化的真正自有资产
- 原稿"g0-android 18 个 skill 我做的"为高估，已删

### 10.3 推动团队公约 🔴
- **公约一**：发布前可观测性三件套（Prom + Grafana + GrowthBook）
- **公约二**：[AI-Generated] / [human] commit tag
- **公约三**：多轮 review + P0/P1/P2 分级 + Doc-Drift gate

### 10.4 跨项目复用经验 🟡
- Provisioning Kit 的 ADR 体系来自 Warranty Plus 的实践沉淀
- Quality Gate 模式可跨 Flutter / Go / Kotlin / Swift 项目套用

### 10.5 申请专利（前公司）⚪
- 德赛西威：多设备互联连接管理策略（具体名称记得话补上）

---

## §11 软实力维度（按需提取）

### 11.1 工程纪律
- 拒绝"先 work 再说"的短期主义
- ADR / Doc-Drift Gate / Quality Gate 都是"前置成本，长期收益"

### 11.2 系统思维
- 不解决单点 bug，而是问"什么机制让这类 bug 不再出现"
- 例：silent failure 三件套（§8.4）

### 11.3 跨域学习
- 车载 Framework → IoT 设备绑定 → AI 工程化体系
- 持续把"已掌握的同构能力"迁移到新领域

### 11.4 诚实承认局限
- 主动暴露 §9 失败案例和 §4.9 体系局限
- 比堆砌"显著提升"可信度高 10 倍

---

## §12 待补充 / 待挖掘

本节原列的"待挖掘项"已确认无需补充——上线后运行期数据、团队规模/带人、德赛西威专利号均不纳入。可量化的真实数据已从 git 回填：

- **[AI-Generated] commit 数**：共 203 个（g0-android 84 / g0-ios 46 / customer-care 38 / flutter 29 / coresdk 6）。见 §4.3
- **各仓提交量**：customer-care 540 / g0-android 567 / g0-flutter 517 / g0-ios 203 / provisioning-kit 176 / coresdk 99 / projectF 98
- **ADR 数**：warranty 52（W01-W52）、provisioning-kit 22（含 v1/v2/v3 三代）
- **定性锚点**（替代人日/cycle-time 量化）："53 天完成配网 SDK 三代演进 + 30+ 页迁移"、"单 HB1 特性 25 个 [AI-Generated] commit + 真值表/集成测试"

> 按工作组织的完整展开见 [work-summaries/](work-summaries/)（4 个工作 × 13 章 + 真实 commit/ADR 证据）。本能力池数据已校准完毕，无外部待补项。

---

## 简历章节映射建议

| 简历位置 | 抽取本文档的哪些节 |
|---|---|
| 个人介绍 | §1.1 + §1.2 + §10.3（公约推动者） |
| 工作经历 ADDX | §1.1 一句话角色 + §10.1/§10.2/§10.3 |
| 工作经历 德赛西威 | §1.2 + §10.5 |
| 项目 1 Warranty Plus | §2.4 + §3.2 + §3.4 + §7.1 + §8.1 |
| 项目 2 Provisioning Kit | §2.1 + §3.1 + §3.3 + §8.4 |
| 项目 3 VH 4.0 重构 | §6.1 + §6.3 |
| 项目 4 跨平台 SDK | §2.2 + §2.3 |
| **项目 5（新增）AI Engineering** | §4 全节 + §10.1/§10.2 |
| 工作技能 - 移动端 | §2.1 / §2.2 / §2.3 |
| 工作技能 - 后端与数据 | §2.4 / §2.5 |
| 工作技能 - 架构设计 | §3 全节摘要 |
| **工作技能 - AI 工程系统** | §4.1 / §4.2 / §4.3 |
| 工作技能 - 工程化与质量 | §5 / §7 摘要 |
