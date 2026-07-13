# 面试回答参考手册（二）
> 覆盖：Provisioning Kit / Vico VH 4.0 绑定重构 / 跨平台 SDK / Warranty Plus

---

## 一、Provisioning Kit — 三层包架构迁移

### 30 秒背景介绍

> "设备绑定代码散落在两个仓库：接口和逻辑在 Lattice，UI 页面在 g0-flutter-module。两个消费端想复用同一套绑定逻辑，但代码没有分层，改一处要同步两处，UI 还和宿主基础设施深度耦合。我主导设计了 provisioning_kit，把绑定代码按职责拆成三个独立包，彻底解决复用问题。"

---

### 核心架构设计

**面试官常问**：*你是怎么做 SDK 分层的？为什么这么分？*

三层结构：
```
flutter_provisioning_api    ← 纯 Dart 接口，零外部依赖
flutter_provisioning_core   ← 业务逻辑 + native 桥
flutter_provisioning_ui     ← Flutter UI 页面
```

分层理由：Lattice 消费端只需要逻辑（有自己的 UI），g0-flutter 两者都需要。所以接口层必须独立，让 Lattice 只依赖 api + core，UI 层对 Lattice 完全透明。用 Dart 3.5 Workspace 管理三个包的本地依赖，monorepo 模式统一跑测试，发布时各打独立 tag。

---

### 最大技术挑战：解耦 LatticeEventBus

**面试官常问**：*迁移中遇到最难的依赖问题是什么？*

14 个逻辑文件里，`bind_service_impl.dart` 第 304 行有唯一一处框架硬依赖：

```dart
// 原代码
LatticeEventBus.instance.emit(DeviceBoundEvent(...));
```

这一行让整个 core 包无法脱离 Lattice 框架独立存在。

**解法**：在 `BindService` 接口上暴露 Stream，`BindServiceImpl` 内部用 `StreamController.broadcast()` 实现，原来的 `emit` 换成 `_controller.add(...)`。Lattice 侧 `bind_module.dart` 自行订阅转发：

```dart
_bind!.onDeviceBound.listen((event) {
  LatticeEventBus.instance.emit(event);
});
```

结果：core 包零 Lattice 污染，Lattice 侧行为完全不变，下游监听 EventBus 的代码一行不用改。

---

### 8 处基础设施耦合的抽象策略

**面试官常问**：*UI 层对宿主的依赖怎么处理的？*

g0-flutter 的 bind UI 有 8 处宿主基础设施依赖，每一处定义抽象接口由宿主注入：

| 依赖 | 抽象接口 | 宿主责任 |
|------|---------|---------|
| HTTP 层（26 个端点） | `ProvisioningBackend` | 包装 `NetworkRestApi` |
| 权限系统 | 整体迁移到包内 | 宿主 Manifest 声明权限 |
| 状态管理（GetX） | Phase 4 保留，Phase 5 评估替换 | — |
| i18n | ARB 随 UI 包迁移自治 | 宿主注册 delegate |
| 导航 | `ProvisioningNavigator` | 实现 FlutterBoost 适配 |
| 埋点 | 复用 `tracker_api.TrackerService` | 宿主 Adapter 映射 Snowplow |
| 主题 | 消费 `Theme.of(context)` | 宿主提供 ThemeData |
| 静态资源 | 随 UI 包迁移，加 `packages/` 前缀 | — |

**关于 GetX 的决策**：GetX 替换涉及 21 个 logic.dart 文件，如果和 UI 迁移混在一起风险翻倍，任何一步出错都难以定位是搬迁问题还是状态管理问题。先保留 GetX 完成搬家（零行为变更），再单独做 GetX 替换，两件事分开，每步有明确验收标准。

---

### API Contract Verification

**面试官常问**：*如何保证迁移后不出现 silent failure？*

`ProvisioningBackend` 定义了 26 个 HTTP 端点，Flutter 里字段名对不上不报错，只是值为 null，页面空白没有异常——这是最难排查的 bug。

规则：每个 request/response model 必须配套真实响应样本注释，从 backend 文档或 curl 响应抓取，迁移前强制做一次 diff 审查。这条是硬性要求，不是可选的。

---

### 分阶段迁移策略

**面试官常问**：*这么大的迁移你是怎么控制风险的？*

6 个阶段，每阶段有明确退出条件：

- **Phase 0**：Lattice 内部解耦，退出条件：14 个逻辑文件零 lattice_core import
- **Phase 1**：建新仓，迁 API + Core，退出条件：新仓独立跑通所有单测
- **Phase 2**：Lattice 切换到新仓，退出条件：Lattice CI 全绿 + shell_app E2E 冒烟
- **Phase 3**：UI 接口设计，退出条件：接口签名通过 review
- **Phase 4**：UI 迁移（21+ 个页面），退出条件：example app 跑通完整绑定
- **Phase 5**：g0-flutter 接入，退出条件：全平台回归通过

Phase 2 与 Phase 3 可并行（接口设计不依赖 Lattice 新结构），是压缩关键路径的核心。

---

### 现存不足与改进方向

**现存不足**：
1. **GetX 残留**：21 个 logic.dart 文件仍依赖 `GetxController`，间接给消费方引入 GetX，与 Lattice 的 StateNotifier 风格存在冲突
2. **类名未清理**：`BindService`、`BindSession` 等类名未随包名更新，API 语义与包名不一致，新接入方有理解成本
3. **tracker_api 循环风险**：flutter_provisioning_core 通过 git 依赖引用 Lattice 仓的 tracker_api，若 Lattice 未来反向依赖 provisioning_kit 会形成循环依赖
4. **UI 包边缘场景覆盖不足**：example app 只覆盖主线配网路径，错误恢复、权限拒绝引导、多 Home 切换等场景缺乏自动化测试

**改进方向**：
- **短期**：Phase 5 完成后启动 GetX 替换评估，优先替换状态逻辑最简单的页面验证可行性
- **中期**：major version 升级时做类名 rename（`BindService → ProvisioningService`），配套迁移指南降低接入成本
- **长期**：将 `BindTelemetry` 接口内置到 flutter_provisioning_api，彻底切断对 Lattice 仓的依赖；UI 包补充 Widget test，用 `ProvisioningBackendFake` 覆盖权限拒绝、超时、错误恢复等场景

---

## 二、Vico VH 4.0 设备绑定模块重构

### 30 秒背景介绍

> "Vico 4.0 要支持 BLE、WiFi、Matter 多协议绑定，原有架构把权限管理、蓝牙状态、导航逻辑全部耦合在业务代码里，历史 Bug 频发，用户绑定失败率高，且每次改动都要小心翼翼。我主导了这次全面重构，把三个核心问题逐一拆解。"

---

### 难点一：蓝牙权限与状态的精确区分

**面试官常问**：*遇到过什么印象深刻的 Bug？*

Android 上「蓝牙未开启」和「权限未授权」在底层返回同一个错误码，原来代码不区分，统一弹一个提示。但两种情况引导方向完全不同——蓝牙没开要去打开蓝牙，权限没给要去系统设置开权限。结果用户明明是蓝牙没开，点提示进去看到的是权限设置页，完全懵了，大概率直接放弃绑定。

**解法**：设计双模式 Permission Guard，两条监听轨道并行：
- 轨道一：`checkSelfPermission` 监听运行时权限状态
- 轨道二：`BluetoothAdapter.STATE_ON/OFF` 监听蓝牙适配器状态

两类错误独立判断、独立 UI 提示，互不干扰。另外加了权限撤销后自动重检——用户从设置页回来不用手动重试，自动触发一次权限检查。

---

### 难点二：多路绑定路径的导航混乱

**面试官常问**：*怎么做路由管理的？遇到过返回栈异常吗？*

套装设备、主设备、Matter 设备共用一套导航栈，历史迭代打了很多补丁，出现了嵌套跳转——A 页面跳 B，B 又跳回 A 的子页面，返回键行为完全不可预期。

**解法**：引入 SingleTask 模式，每种设备类型有且只有一个绑定任务栈，进入绑定时清空当前栈，三条路径完全隔离互不影响。Matter 用枚举存根管理，支持动态下架上架，主流程代码不硬编码 Matter 逻辑，通过注册机制插拔。

---

### 难点三：Flutter ↔ Native 通道碎片化

**面试官常问**：*Flutter 和原生怎么通信的？碰到过什么坑？*

原来有自定义 NativeBridge 层，Android 和 iOS 实现不完全一致——同一个回调，Android 返回 JSON 字符串，iOS 返回 Map，Flutter 层要写两套解析，每次改动要同步三个地方，容易漏。

**解法**：全部迁移到标准 MethodChannel，制定 API 契约文档，参数格式、错误码、回调结构全部统一，Android/iOS 各自实现同一套接口定义，Flutter 只写一份解析逻辑。

---

### 现存不足与改进方向

**现存不足**：
1. **权限守卫无埋点**：Permission Guard 触发了哪类权限问题、用户在哪步放弃，目前没有量化数据，无法定位下一个优化优先级
2. **Matter 路径覆盖不足**：枚举存根机制保证了主流程不崩溃，但 Matter 特有错误场景（commissioning 失败、Thread 网络不可用）缺乏专项测试
3. **MethodChannel 无版本管理**：channel 契约靠文档约定，没有版本号机制，破坏性变更时无法运行时检测

**改进方向**：
- **短期**：在 Permission Guard 各关键节点补充 Snowplow 埋点（权限类型、触发时机、用户行为），建立绑定漏斗可视化，用数据驱动下一轮优化
- **中期**：为 Matter 路径补充专项 E2E 测试（Mock commissioning 服务），提升 Matter 绑定稳定性保障
- **长期**：引入 MethodChannel API 版本协商机制（Native 侧声明支持版本，Flutter 侧按版本选调用路径），为未来 channel 演进提供向后兼容保障

---

## 三、跨平台 SDK 开发

### 30 秒背景介绍

> "SDK 开发分两块：Android 侧做了一个配置驱动的数据脱敏框架解决合规问题，iOS 侧把一个 526 行的单体绑定模块拆分重构，顺带解决了 iOS 14+ 的权限干扰问题。"

---

### Android 数据脱敏框架

**面试官常问**：*为什么要自己造轮子？*

最开始每个上报点手写脱敏：`password.replace(...)` 这种。问题很明显——规则散落在几十个文件，加新字段极易遗漏，曾在上线前安全 Review 发现漏掉 2 个字段；不同场景需要不同脱敏策略（测试环境要能看明文），手写根本没法灵活配置。

**核心设计**：JSON 配置驱动，所有规则集中定义：

```json
{
  "keyBased": [
    { "key": "password", "strategy": "CLEAN" },
    { "key": "ssid", "strategy": "MASK", "keepPrefix": 2 }
  ],
  "valueBased": [
    { "pattern": "MAC地址正则", "strategy": "MACADDRESS" },
    { "pattern": "IPv4正则", "strategy": "IP" }
  ]
}
```

双层规则：KeyBased 按字段名精准匹配（优先级高），ValueBased 按值正则兜底（防字段名变了但值还是敏感数据）。支持 CLEAN / MASK / HASH / 专用策略四种处理方式，递归处理嵌套 JSON，业务层只需一行调用，完全不感知脱敏过程。

---

### iOS 绑定模块拆分

**面试官常问**：*iOS 14 的兼容问题你是怎么处理的？*

iOS 14 开始，mDNS 服务发现需要 Local Network 权限弹窗。问题在于：4G 绑定流程依赖 mDNS，QR 码绑定走 BLE 直连完全不需要 mDNS。原代码耦合在一起，进入绑定页面统一触发 Local Network 弹窗，QR 码用户看到"允许访问本地网络？"完全不明所以，大概率点拒绝，导致后续 4G 绑定不可用。

**解法**：把 QR 码和 4G 流程彻底分离成两个独立 Flow 类，QR 码流程完全不触发 mDNS 也就不触发弹窗。4G 流程进入时才调用 `checkPermissionOnce`：

- 已授权：不再弹窗，直接继续
- 用户取消弹窗（手势关闭）：2 秒后自动恢复，不卡死
- iOS 14 以下：直接跳过

同时把 526 行单体按 Discovery / Transport / Business 三层重构，每个文件控制在 100 行以内，抽象 `BindResultPoller` 统一处理绑定结果轮询与超时。

---

### 现存不足与改进方向

**现存不足**：
1. **脱敏框架无单测**：双层规则引擎的正确性依赖人工 Review JSON 配置，没有自动化测试验证规则匹配和输出结果
2. **iOS 核心组件缺乏自动化测试**：BindResultPoller、checkPermissionOnce 等组件只有代码审查，回归靠手动测试，容易遗漏边缘场景
3. **双端脱敏策略不统一**：Android 有配置驱动框架，iOS 侧脱敏仍依赖手动处理，同一字段在两端脱敏行为可能存在差异

**改进方向**：
- **短期**：为 Android 脱敏框架补充参数化单测（覆盖 KeyBased / ValueBased / MASK / HASH / 嵌套 JSON 等场景），防止 JSON 规则变更引入静默错误
- **中期**：将配置驱动脱敏框架移植到 iOS，统一双端策略，从根本上消除不一致风险；为 iOS 核心组件补充 XCTest 自动化测试
- **长期**：将脱敏框架抽象为独立 SDK 模块（Android aar + iOS pod），支持多 App 复用，配套规则版本管理与热更新能力

---

## 四、Warranty Plus — 保修延保模块

### 30 秒背景介绍

> "这是在 Customer Care Monorepo 里从零设计的一个模块，目标是让运营能把 Amazon 差评用户和 App 账号关联起来，主动触达和挽回。我负责 Go 后端 + Flutter SDK 完整链路。"

---

### 架构设计思路

**面试官常问**：*一个 SDK 要同时服务三个 App，你是怎么设计的？*

用了 Split API 架构——接口层和逻辑层分离：

```
warranty_plus_api      ← 纯接口定义（数据模型、抽象方法）
warranty_plus          ← 实现层（依赖 api 层）
```

三个 App 通过 git ref 引用同一个包，按需接入：

```yaml
# 宿主 App pubspec.yaml
warranty_plus:
  git:
    url: git@gitlab.addx.ai:services/customer-care.git
    path: app/warranty_plus
    ref: main
```

这样 SDK 有 breaking change 时，宿主 App 通过 ref 锁定版本，自行决定何时升级，互不干扰。

---

### 订单号校验体验优化

**面试官常问**：*表单校验你们是怎么做的？*

Amazon 订单号格式是 `xxx-xxxxxxx-xxxxxxx`，用户手动输入极易出错。原本提交后才反馈错误，用户体验差。

集成 Kiwibit 后做了两件事：
1. **自动格式化**：用户输入数字时自动在正确位置插入横线，不需要手动输入分隔符
2. **实时不完整提示**：输入过程中实时检测哪一段不足，精确提示"第三段还差 2 位"，而不是等提交才显示"格式错误"

---

### 弱网可用性设计

**面试官常问**：*弱网场景你们是怎么处理的？*

ConfigRepository 做了本地缓存层：

- 首次联网时拉取配置并缓存到本地
- 后续启动优先读本地缓存，后台异步刷新
- 弱网 / 无网时使用缓存配置，功能降级可用而非直接报错

这样用户在地铁或弱信号环境下打开 SDK，仍然能完成订单号录入，不因网络问题卡死。

---

### 可观测性设计

**面试官常问**：*上线后怎么知道功能正不正常？*

团队有一条团队公约：**发布前可观测性三件套必须就位，否则不得合入**：
1. Prom 指标采集（提交成功率、关联成功率、失败原因分类）
2. Grafana Dashboard 上线
3. A/B 实验配置（GrowthBook）

这不是可选的。没有这三项，运营没有数据，不知道漏斗卡在哪里；出了 Bug 也没有告警，只能靠用户反馈发现。

---

### 测试体系

- **L1**：`go test ./... -short` + `flutter test`，每次 push 触发，秒级完成
- **L2**：Go 集成测试（真实 MySQL + Redis），每次 MR 阻塞合并
- **L3**：全栈 E2E，Nightly 运行
- **Golden Dataset**：基于 staging 真实数据构建 test fixtures，跨平台共用，保证测试覆盖真实业务场景

---

### 现存不足与改进方向

**现存不足**：
1. **订单号关联漏斗缺细粒度数据**：目前有总成功率，但缺失失败原因分类（格式错误 / 网络超时 / 服务端校验失败），运营无法定位卡点
2. **离线缓存无 TTL 机制**：ConfigRepository 没有过期策略，用户长期离线后恢复网络时可能使用严重过期的配置
3. **Go 后端缺限流保护**：没有 per-user 请求限流，大量用户同时提交存在打穿风险
4. **SDK 版本升级无通知机制**：宿主通过 git ref 引用，SDK 有 breaking change 时没有主动通知，容易造成静默兼容问题

**改进方向**：
- **短期**：细化 Grafana 看板，补充失败原因分类维度（格式错误率 / 网络失败率 / 服务端拒绝率），给运营提供可操作的数据支撑
- **中期**：ConfigRepository 增加 TTL + 强制刷新机制（超过 7 天强制联网刷新）；Go 后端增加 per-user 限流（Redis 令牌桶，每用户每分钟最多 N 次提交）
- **长期**：建立 SDK changelog 机制（GitLab Release Notes + 宿主 CI 检查 SDK 版本，breaking change 时 CI 报警）；探索将订单号关联能力与差评拦截、退订挽留打通，形成完整用户留存生命周期管理

---

## 五、AI 辅助开发的运用：Skill 系统与 Harness Engineering

### 30 秒背景介绍

> "我在多个项目中建立了一套 AI Agent 驱动的研发模式，核心是用 CLAUDE.md 定义架构约束，用 skill 系统把研发规范封装为可执行的流程。AI 不是用来写代码的助手，而是一个在明确约束下执行完整开发周期的 Agent——从需求分析、TDD 写测试，到质量门控、提 MR，全程可以不需要人工干预每个步骤。"

---

### 核心理念：Context Engineering

AI 代码质量的上限不是模型能力，而是给它的上下文质量。实践中分两层：

**层一：CLAUDE.md 架构约束**
每个项目根目录有 CLAUDE.md，定义不可逾越的架构规则：
- **g0-android**：Clean Architecture + MVI，函数 < 20 行，类 < 200 行，单测覆盖率 ≥ 80%，commit 必须带 `[AI-Generated]` 或 `[human]` tag；双端（Android/iOS）一致性约束——修改一端必须同步另一端
- **warranty_plus**：5 条 dep_checker 规则（api 包零运行时依赖、单向依赖、禁止 dart:io 混入 feature 层、禁止外部 UI 状态管理框架）+ 4 条 quality_gate 规则（100% 测试文件覆盖、文档完整性、Secret 检测、覆盖率 ≥ 80%），全部由 `tools/quality_gate/bin/check.dart` 在 CI 和 pre-commit hook 中自动执行
- **customer-care**：禁止裸命令启动服务（只能 `make dev`）、禁止固定端口 fallback（会掩盖配置错误）、多 worktree 隔离规则

CLAUDE.md 的关键作用：**防止 AI 在迭代中产生熵增**。没有约束，AI 每次修改都会引入新的架构偏差；有了约束，AI 每次提交前必须通过质量门控，偏差被阻断在提交之前。

**层二：Skill 系统——把流程编码为可调用的规范**

---

### 各项目 Skill 定义与用途

#### g0-android / g0-ios：完整 10 阶段开发工作流

在 `.cursor/skills/` 下定义了 18 个 skill，构成完整的研发生命周期闭环：

| Skill | 触发时机 | 核心作用 |
|-------|---------|---------|
| `brainstorming` | 任何新功能开发前 | 强制先探索上下文、澄清需求、提出 2-3 个方案对比，**硬性阻止在设计确认前写任何代码** |
| `writing-plans` | 设计确认后 | 把设计转化为分阶段实施计划，定义每个阶段的退出条件 |
| `start-feature-development` | 开始实现 | 10 阶段工作流：需求分析 → 测试用例设计 → Review → 单测生成 → 实现 → 单测 → 编译 → 模拟器测试 → Code Review → 总结报告 |
| `test-driven-development` | 写任何功能/修复 | Iron Law：先有失败测试，再写实现；测试通过即证明需求覆盖；严格禁止"先实现后补测试" |
| `fix-critical-bug` | 线上 Bug / Crash | 5 阶段修复流程：复现 → 诊断根因 → 修复 → 验证 → RCA 文档 |
| `optimize-performance` | 性能优化 | 量化基线（冷启动 < 2s、帧率 60fps、内存 < 200MB）→ 分析瓶颈 → 实施 → 对比验证 |
| `systematic-debugging` | 难以复现的 Bug | 结构化排查：日志采集 → 假设驱动 → 最小复现用例 |
| `executing-plans` | 执行实施计划 | 分批次执行，每批次完成后验证，失败时回滚而不是继续 |
| `finishing-a-development-branch` | 分支完成 | 清单式收尾：测试通过 → changelog → MR 描述 → worktree 清理 |
| `requesting-code-review` / `receiving-code-review` | 代码审查 | 标准化 MR 描述模板；收到 Review 后的处理流程 |
| `dispatching-parallel-agents` / `subagent-driven-development` | 并行任务 | 拆分独立子任务，分发给多个 Agent 并行执行，主 Agent 汇总结果 |

**实际效果**：以 g0-android 为例，新功能开发时调用 `start-feature-development`，AI 会自动走完 10 个阶段——在第 3 阶段阻塞等待测试用例 Review 确认，第 6 阶段跑 `./gradlew test` 验证覆盖率，第 8 阶段用 `adb install` 安装并按预定测试场景逐一验证。整个过程开发者只需在关键节点确认，不需要逐步指挥 AI 怎么做。

---

#### warranty_plus：STANDALONE 模式 Package 生命周期

在 `app/warranty_plus/.claude/skills/` 下定义 `package-lifecycle` skill，对齐 Lattice monorepo 的包开发规范但适配独立仓库：

| Phase | 内容 | 关键工具 |
|-------|------|---------|
| 0 | 前置检查：Flutter ≥ 3.24、melos bootstrap、quality_gate 全通过 | `dart run tools/quality_gate/bin/check.dart` |
| 1 | 需求澄清 + Spec 文档输出，用户确认后才进入 Phase 2 | `brainstorming` → `writing-plans` |
| 2 | Git Worktree 创建，隔离开发分支 | `using-git-worktrees` |
| 3 | README 先于代码产出（Overview + API Ref + Usage） | — |
| 4 | TDD 实现：api 包 100% 覆盖，feature 包 ≥ 80% | `test-driven-development` |
| 5 | example/ 集成验证，真机/模拟器运行无 Crash | 热重载 r / 重启 R |
| 6 | 质量门控：`melos run gate`（format + analyze + 9 条规则 + test） | CI 同一入口 |
| 7 | 埋点注册 + sandbox 验证 | `tracker-manager` |
| 8 | MR 创建 + CI 通过 | `verification-before-completion` |
| 9 | CHANGELOG + worktree 清理 | `finishing-a-development-branch` |

**与单纯写代码的差异**：AI 在 Phase 0 发现 quality_gate 不通过时会停下来修复，而不是跳过继续。Phase 3 强制先产出 README 文档再写代码，确保接口设计先于实现确认。

---

#### customer-care：Golden Data TDD

在 `.claude/skills/golden-data-tdd/` 定义，适用于 SmartPopup / Warranty 跨层测试场景：

**核心思路**：不用手写 Mock 数据，从 staging 真实 Snowplow 事件中提取测试 Fixture。

三步工作流：
1. **Discover**：用 DataHub 搜索相关表结构，用 Superset 查询真实事件，检查 `unstruct_event.data.data` 里的实际字段名（不猜测）
2. **Generate**：构建 golden JSON（包含 events 原始数据 + RulesConfig + 多用户场景 + fatigue 变体 + 明确的 expected outcomes）
3. **TDD**：先写红测试（按 golden data 定义期望值），再写实现，所有层（Engine JS / Dagster Python / Admin TS / SDK Flutter）共用同一份 Fixture

**为什么这样设计**：
- 手写 Mock 数据的字段名与真实 payload 不一致，会产生"测试通过但线上挂"的情况（silent failure）
- 跨层共用同一 golden fixture 确保 Engine 的行为和 Dagster 分析的行为完全一致
- `multi_user` + `fatigue_variant` 强制覆盖用户隔离和频控两类最常出问题的场景

---

### 面试常见问题与回答

**Q：你怎么保证 AI 生成的代码质量？**

> "两道防线。第一道是 CLAUDE.md：架构规则写进项目根目录，AI 每次提交前必须通过质量门控（格式检查 + 静态分析 + 自定义规则 + 单测覆盖率），这是硬约束，不能绕过。第二道是 skill 系统：把研发流程编码成可调用的工作流，AI 被要求先写失败测试再写实现，而不是倒过来。质量问题大多来自流程混乱，不来自 AI 能力不足。"

**Q：AI 辅助开发和直接让 AI 写代码有什么区别？**

> "区别在于有没有约束边界。直接让 AI 写代码，每次交互都是独立的，AI 不知道架构规范，不知道哪些包不能相互依赖，每次都可能给出不一样的风格。有了 CLAUDE.md 和 skill 系统，AI 在一个有明确边界的框架内工作——接口包不能有运行时依赖、测试必须先写、提交前必须通过 9 条规则。这样 AI 的输出才是可预期的、可累积的。"

**Q：skill 系统你是怎么设计的？**

> "我把研发流程里的每个决策点都显式化。比如 `brainstorming` skill 有一个硬性规则：在设计没有被用户确认之前，不得调用任何实现 skill、不得写任何代码。这不是建议，是强制约束。再比如 `test-driven-development` 定义了 Iron Law：先看到测试失败，再写实现。这些规则写成 Markdown 文档，AI 在工作时主动调用对应的 skill，按照里面的检查列表执行。本质上是把 Code Review 里会发现的问题，提前在开发流程里就阻断了。"

**Q：这套模式有什么局限性？**

> "三个明显的局限。第一，skill 的质量决定了 AI 的下限——写得模糊的 skill 会产生模糊的输出，所以维护 skill 本身需要持续投入。第二，对于探索性的工作（比如技术选型调研、架构重构），流程化的 skill 反而会限制 AI 的发挥，这类工作更适合开放式对话。第三，AI 在跨模块理解上仍然有盲区，CLAUDE.md 里写不清楚的隐式约定（比如业务规则、历史决策背后的原因）AI 会猜测，猜错了就需要人工纠正。"

---

### 现存不足

1. **Skill 内容与代码实现存在漂移**：skill 文档是静态的，代码结构变化后 skill 不会自动更新，时间长了会出现 skill 描述的方案和实际代码不一致的情况
2. **质量门控覆盖率不均**：g0-android 和 warranty_plus 有较完整的质量门控，但 provisioning_kit 和 g0-ios 的 skill 体系相对简单，覆盖的场景有限
3. **跨项目经验无法自动复用**：在一个项目里沉淀的 skill 需要手动移植到其他项目，没有统一的 skill 库管理机制
4. **AI Agent 的执行不具备幂等性**：同一个 skill 流程在不同上下文下可能产生不同结果，难以保证每次执行的一致性

### 改进方向

- **短期**：建立 skill 版本管理机制，在 skill 文档里记录"最后验证日期 + 对应代码版本"，过期时提示 Review
- **中期**：把通用 skill（TDD、brainstorming、finishing-a-development-branch 等）提取为跨项目共享的 skill 库，各项目通过 git submodule 或符号链接引用，避免重复维护
- **长期**：探索把 CLAUDE.md 的约束规则和 CI 的检查规则统一化，让同一份约束既作为 AI 的上下文约束，也作为 CI 的验证规则，彻底消除"AI 认为合法但 CI 拒绝"的情况

---

*最后更新：2026-04-24*
