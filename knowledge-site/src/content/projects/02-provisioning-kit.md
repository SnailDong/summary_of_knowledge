# Provisioning Kit 配网 SDK 0→1（六边形架构 + 多次架构演进）

> - **工作类型**：从 0→1 独立设计并实现的 Flutter 设备配网/绑定 SDK；六边形（Ports & Adapters）架构 + 分阶段迁移
> - **仓库**：`provisioning-kit`
> - **我的提交**：176 / 177（占 99.4%），时间跨度 2026-04-20 → 2026-06-12（约 53 天）
> - **我的角色**：架构负责人 + 唯一实现者；产出 22 个 ADR（v1.x→v2→v3 三代演进）、L1-L4 分层测试体系

---

## 0. 一句话定位

> 我把分散在老 App（g0-flutter `feature/lattice_bind`）里的设备配网/绑定能力，从 0→1 抽成一个独立的 Flutter 配网 SDK（Provisioning Kit）——用六边形架构切出"纯接口契约包 `flutter_provisioning_api`（零外部依赖）+ 实现包 `flutter_provisioning_feature`（Service/Adapter/UI/Android Plugin 一体）"，5 个宿主 Port + session-oriented native 契约，30+ 配网页面内聚，配 Fake 测试装配 + L1-L4 分层质量门控；并在 53 天里经历 **v1.x（自研 BindChannel）→ v2（provisioning_core FFI）→ v3（native AAR + session API）** 三代架构演进，每代都用 ADR 留痕、分阶段迁移而非 big-bang。

**业务价值一句话**：把"每个 App 各写一套 BLE/WiFi/QR 配网 + Hub 子设备绑定"收敛成一套可复用 SDK，新协议（Matter Q3）和新宿主接入只改 adapter，不重写流程；同时把 warranty 沉淀的 ADR 体系 + Quality Gate 模式复用过来。

---

## 1. 背景与目标

**业务背景**：设备配网（provisioning）是 IoT App 的核心入口——BLE 扫描发现设备 → 输 WiFi 凭据 → 设备连云 → 绑定到账号 → Hub 子设备绑定 → 网络诊断。这套逻辑原本散落在 g0-flutter 主工程里，和业务代码缠在一起，无法跨宿主（g0-flutter / Lattice）复用，新协议（Matter/Thread）扩展困难。

**目标**：抽成独立 SDK，做到：
1. **跨宿主复用**——任何宿主只实现少量 Port adapter 就能接入，SDK 不依赖任何宿主框架。
2. **协议可扩展**——BLE/AP/QR 现有 + Matter（Q3 2026）未来，扩展不动核心。
3. **native 能力解耦**——配网底层（HAL：CloudHAL/WiFiHAL）由宿主注入，SDK 不绑定具体实现。
4. **可迁移、不停摆**——老 App 的绑定流程要平滑迁过来，分阶段、可回滚，不能 big-bang。

**约束**：
- `flutter_provisioning_api` 零外部运行时依赖（只读消费方不被传染）。
- native 配网核心是一个独立演进的 AAR（`com.addx.provisioning:provisioning-android`，GitLab Maven），SDK 要适配它的版本演进。
- 错误码要命名空间隔离（SDK 内部 `pk_*` / AAR 透传 `core_*` / 后端 `backend_*`），不混用。

---

## 2. 我实现了什么（Scope）

| 层 | 交付物 | 证据 |
|----|--------|------|
| **架构契约** | 六边形：`flutter_provisioning_api`（72 文件，0 依赖）+ `flutter_provisioning_feature`（306 文件） | `packages/` |
| **宿主 Port** | 5 个必填 host 契约：HttpClient / HostBridge / Tracker / FeatureFlag / Theme + 1 可选 ErrorReporter | `api/interface/*.dart` |
| **Service 层** | `ProvisioningCorePort`（session API：createSession/prepare/fetchWifiList/commitBind/startProvision）、DiscoveryService、BindService、WifiService、BindSession | `api/service/*.dart` |
| **Adapter + native** | MethodChannel 适配（单 method channel + 2 EventChannel：Discovery/Bind）、Android Plugin Kotlin（HAL 注册单例 `ProvisioningKitNative`） | `feature/android/src/main/kotlin/com/addx/provisioning_kit/` |
| **UI** | 30+ 配网页面内聚进 feature 包（entry/discovery/bind_type_select/connecting/bind_error/qr_*/hub_select/device_setup_wizard…） | `feature/lib/src/pages/` |
| **i18n** | SDK 内置 Crowdin ARB + intl_utils，宿主只通过 `l10nOverrides` 改品牌名 | `feature/lib/src/i18n/arb/` |
| **测试体系** | Fake 装配（FakeSessionPort/FakeHttpClient/FakeClock/NoOpTracker/FakeFeatureFlag）+ L1-L4 分层（~90/~60/~30/external） | `feature/lib/testing/` |
| **质量门控** | `.gitlab-ci.yml`：lint:format / lint:analyze / i18n:verify(ARB ≥95%) / test:flutter / build:android-plugin | `.gitlab-ci.yml` |
| **ADR + 迁移** | 22 个 ADR（ADR-09/12/14-17/18-22/24）；分阶段迁移 Phase 0→R1-R11 + bind-migration W1/W2/W3 | `docs/architecture/overview.md` |

---

## 2.5 核心技术说明（是什么 / 做什么 / 为什么）

Provisioning Kit 的技术选型围绕一个目标展开：把强依赖 BLE、WiFi、Native 和硬件状态的配网流程，做成可以跨宿主复用、可以测试、可以持续演进的 SDK。

### 2.5.1 Flutter SDK

Flutter SDK 是给多个 Flutter 宿主复用的一组能力包。它不只是 UI 组件，而是把页面、流程编排、状态处理、错误兜底、Native 通道、埋点和宿主注入契约一起封装起来。

在这个项目里，Provisioning Kit 承担设备发现、选择配网方式、WiFi 列表获取、绑定流程、Hub 子设备绑定、错误页和多语言文案等能力。宿主 App 不再复制一套配网代码，只需要实现 SDK 需要的 Port，例如网络、主题、埋点、FeatureFlag 和 HostBridge。

选择 Flutter SDK 的原因是这些消费端 App 都需要类似的配网体验，但各自工程里散落实现会导致重复开发和行为漂移。SDK 化之后，配网主流程由一处维护，新宿主或新协议只改 adapter，不重写全链路。

### 2.5.2 Split API

Split API 是把 SDK 拆成“接口包”和“实现包”的设计。接口包只暴露稳定契约和值对象，实现包才包含 UI、Native Plugin、缓存、埋点和具体流程。

在 Provisioning Kit 里，`flutter_provisioning_api` 是零外部运行时依赖的纯接口包；`flutter_provisioning_feature` 是实现包，里面包含 30+ 页面、service 编排、adapter、Android Plugin 和 i18n。只读消费方可以只依赖 api 包，不被 UI、Native、Crowdin 或具体实现传染。

这样设计是为了控制依赖面。配网 SDK 很容易变成一个“什么都带”的大包，如果所有消费方都被迫依赖完整实现，后续升级和接入都会很重。Split API 把稳定契约放在最外层，让实现可以演进，但消费方不被频繁影响。

### 2.5.3 Ports & Adapters

Ports & Adapters 是一种把业务核心和外部系统隔离的架构方式。Port 是 SDK 需要的能力接口，Adapter 是宿主或底层系统提供的具体实现。

在这个项目里，HttpClient、HostBridge、Tracker、FeatureFlag、Theme、ErrorReporter 都是宿主 Port；Native AAR、MethodChannel、EventChannel、BackendFacade 是不同方向的 adapter。SDK 核心只编排“配网应该怎么走”，不关心宿主用什么网络库、什么埋点平台、什么主题体系。

使用它的原因是配网链路跨 Flutter、Android Native、BLE、WiFi、后端和宿主 App。如果这些外部能力直接写死在 SDK 内部，后续换宿主、换 Native 实现、换协议都会牵一发动全身。通过 Port 抽象，底层已经经历 v1、v2、v3 三次替换，但上层流程仍然能保持稳定。

### 2.5.4 MethodChannel 与 EventChannel

MethodChannel 是 Flutter 和 Native 之间发起一次性调用的通道，适合“调用一个方法并拿结果”。EventChannel 是 Native 持续向 Flutter 推送事件的通道，适合设备发现、绑定进度这类持续变化的数据。

在 Provisioning Kit 中，MethodChannel 承担 createSession、prepare、fetchWifiList、commitBind 等命令式调用；两个 EventChannel 分别承接 Discovery 和 Bind 事件流。这样 Flutter 可以触发 Native 配网能力，同时持续接收 BLE 扫描结果和绑定阶段变化。

我这样拆，是因为配网不是一次 HTTP 请求，而是长时间、多阶段、会失败也会重试的流程。命令用 MethodChannel 更清晰，状态流用 EventChannel 更自然；两类通道职责分开后，调试和测试也更容易。

### 2.5.5 Native AAR 与 HAL 注入

AAR 是 Android 平台的可复用二进制库格式，适合把 Native 配网核心作为独立制品交付。HAL 是 Hardware Abstraction Layer，表示对底层硬件或系统能力的抽象。

在 Provisioning Kit v3 中，Native 配网核心收敛到 `com.addx.provisioning:provisioning-android` AAR。CloudHAL、WiFiHAL 等底层能力由宿主注入，SDK 不直接绑定某个 App 的 Native 实现。Flutter 层通过 plugin 和 channel 调用 AAR，AAR 再调用宿主提供的 HAL。

选择 AAR + HAL 注入，是因为配网底层需要多端共享且独立演进。如果 SDK 直接内置某一套 Native 实现，新宿主接入就会被绑死；如果每个宿主各写一份，又会重复造轮子。AAR 负责沉淀核心能力，HAL 注入负责保留宿主差异。

### 2.5.6 Session API

Session API 是把一次配网过程建模成一个会话，而不是散落的一堆独立函数。会话里保存当前阶段、设备上下文、WiFi 信息和绑定状态。

在这个项目里，v3 的 Native 契约从零散调用收敛为 `createSession → prepare → fetchWifiList → commitBind`。Flutter 侧通过 `BindSession` 和 `BindSessionController` 管理跨页状态，让用户从发现页、WiFi 页、连接页切换时不会丢失上下文。

这样设计是因为配网天然是一个长流程。用 session 承载上下文，比到处传参数更稳定，也更适合跨页、重试、超时和错误恢复。底层 Native 方案替换时，只要 session 契约稳定，UI 和业务编排就不用重写。

### 2.5.7 Fake 测试装配

Fake 测试装配是用可控的假实现替代真实设备、真实后端、真实时间和真实埋点，让强硬件依赖的流程也能在 CI 中测试。

Provisioning Kit 提供 FakeSessionPort、FakeHttpClient、FakeClock、NoOpTracker、FakeFeatureFlag 等组件。测试可以模拟设备发现、WiFi 扫描、绑定成功、绑定失败、180s 超时、A/B 分支和页面跳转，不需要真设备也能跑 L1-L3。

这是这个 SDK 健康性的关键。配网如果只能靠真机回归，AI 或开发者很容易跳过测试。Fake 装配把核心流程变成可重复、可自动化的测试，把真机验证缩小到 AAR 兼容和 HAL 集成那一薄层。

---

## 3. 方案设计（怎么做的）

### 3.1 六边形架构（核心）

```
        宿主 App / Lattice（消费方）
                │ 只依赖 api 包，注入 5 个 Port
                ▼
┌───────────────────────────────────────────────┐
│ flutter_provisioning_api  (纯接口 + 模型, 0 依赖) │
│  Port: HttpClient / HostBridge / Tracker /      │
│        FeatureFlag / Theme / (ErrorReporter)    │
│  Service 契约: ProvisioningCorePort(session) /  │
│        DiscoveryService / BindService / Wifi    │
└───────────────────────────────────┬─────────────┘
                                    │ 实现
┌───────────────────────────────────▼─────────────┐
│ flutter_provisioning_feature                     │
│  Service 编排(BindServiceImpl 180s hard cap)     │
│  Adapter(MethodChannel) · BackendFacade(~12 ep)  │
│  30+ UI Pages · i18n(Crowdin) · Theme            │
│  └ android/ native plugin (HAL 注册单例)         │
└───────────────────────────────────┬─────────────┘
                                    │ MethodChannel + 2 EventChannel
                                    ▼
        native AAR  com.addx.provisioning:provisioning-android
        (独立演进, GitLab Maven; CloudHAL/WiFiHAL 由宿主注入)
```

### 3.2 关键架构决策（ADR）

**① 包结构：3 包 → 2 包（ADR-12）**——最初设计 api/core/ui 三包，落地发现对单一业务域过度切分（CI/发版复杂度上升、对外消费面模糊"该 pub 哪个包"）。合并 core+ui → feature，只切"接口 vs 实现"一刀。

**② core 层零 tracker_api 依赖（ADR-09，选 Option B）**——feature 不直接依赖 `tracker_api`，而是 SDK 定义 `ProvisioningTracker` 接口由宿主 adapter 代理。和 warranty 的"埋点 Port 化"同构——SDK 中立、不绑定具体埋点平台。

**③ native 的三代演进（ADR-14 → ADR-14-v3）**——这是最能讲的一段：
- **v1.x**：自研 `BindChannel` + `flutter_bind_plugin` MethodChannel，envelope `{eventType, subType, errorCode}`。
- **v2.0（2026-04-27, ADR-14/15/16/17）**：pivot 到 `provisioning_core`（Dart FFI plugin，vendor/），13 阶段事件模型 + 5 桶 BindStep。
- **v3.0（2026-06-03, ADR-14-v3/18-22）**：再 pivot 到 native AAR（`com.addx.provisioning:provisioning-android`）+ session-oriented API（createSession→prepare→fetchWifiList→commitBind）+ feature 包变成 Flutter Plugin 内化 native。
- 每代都不是推翻重写，而是 ADR supersede + 分阶段迁移。

**④ Stage(13) → BindStep(5 桶)（ADR-15）**——保留 AAR 的 13 阶段事件（埋点精度），UI 上映射成 5 个用户可感知的桶（connect/pair/configure/network/cloud）。埋点细、UI 粗，各取所需。

**⑤ 端到端 180s hard cap + Clock 抽象（ADR-17）**——`BindServiceImpl` 设 180s 硬超时，Clock 注入（生产 SystemClock / 测试 FakeClock），错误码隔离命名空间 `pk_*`。

**⑥ Backend 拆 thin + fat（ADR-18）**——删 v2 的胖 `ProvisioningBackend` 业务接口，拆成 `ProvisioningHttpClient`（api，宿主注入，瘦 post）+ `ProvisioningBackendFacade`（feature，SDK 内部，胖 ~12 端点）。宿主只管"怎么发 HTTP"，SDK 管"调哪些端点"。

**⑦ HAL 注入对称性（ADR-21）**——Dart 侧 HttpClient + native 侧 CloudHAL/WiFiHAL 全部宿主注入，SDK 提供注册口（`ProvisioningKitConfig.httpClient` + `ProvisioningKitNative.registerHostHals`）。对称原则：跨语言边界两侧都是宿主注入，不在 SDK 里硬实现任何一侧。

### 3.3 分阶段迁移（不是 big-bang）

迁移拆成可独立退出的阶段，每阶段有明确退出条件：
- **Phase 0（架构先行，2026-04-20）**：ADR + workspace 骨架 + CI 流水线 + 文档系统，只有代码骨架。
- **Phase R1（文档对齐，04-27）**：6 个架构子文档全部按 provisioning_core 重写，删 v1.x 引用。
- **Phase R2-R11（06-03~06-04）**：api 契约冻结 → Fake 测试 → Adapter → Service 重写 → 30+ UI 页内聚。
- **bind-migration W1/W2/W3（06-04~06-09）**：W1 共享地基（Kit+Scope+Routes+Coordinator）→ W2 Camera 流程 → W3 Hub 流程，每个 wave 配 L3 flow 测试 + 收口门禁。

Discovery 的 `forceStop()` 必须在 `startBind` 前广播 `DiscoveryStopped`（ADR-16 invariant），防双 BLE 扫描——这种"关键路径不变量"我用 ADR 固化 + 测试守。

---

## 4. 关键技术点与实现细节

1. **session-oriented native 契约**：v3 把零散的 bind 调用收敛成会话模型——`createSession → prepare → fetchWifiList → commitBind`，`BindSession`（只读状态）+ `BindSessionController`（变更），session 跨页保活（ADR-24）。

2. **错误码三命名空间隔离**：`pk_*`（SDK 内部 7 个值）/ `core_*`（AAR 透传）/ `backend_*`（HTTP），`ErrorCodeMapper` 按前缀路由，测试自动校验前缀——杜绝"AAR 错误码和 SDK 错误码撞号"。

3. **Discovery Set 订阅而非计数器**：`_activeSubs: Set<String>` 用集合而非引用计数管订阅，`forceStop()` 广播终止——避免计数器在异常路径下泄漏导致 BLE 扫描关不掉。

4. **Stage→BindStep 映射器**：`stage_to_bind_step.dart` 把 13 个 native stage 映射到 5 个 UI 桶，埋点用 13、UI 用 5。

5. **i18n 复用宿主 Crowdin namespace**：SDK 内置 ARB 但复用 g0-flutter 的 `f_flutter_main.json` namespace，加 `provisioning.*` 子前缀；宿主只能通过 `l10nOverrides: Map` 改品牌名，不能整体替换——平衡"SDK 自带文案"和"宿主定制"。

6. **MethodChannel 标准化**：单 method channel（`com.addx.provisioning_kit/method`，8 方法）+ 2 EventChannel（Discovery/Bind），取代 v1 多套自定义 channel。

---

## 5. 如何保证 SDK 健康性

**① Fake 测试装配（核心）**：`feature/lib/testing/` 提供整套 Fake——FakeSessionPort / FakeHttpClient / FakeClock / NoOpTracker / FakeFeatureFlag。example app 用 Fake 装配就能跑 L1/L2/L3，**不需要真 AAR / 真后端 / 真设备**——这让配网这种强依赖硬件的 SDK 也能在 CI 里跑端到端流程测试。

**② L1-L4 分层测试**：
| 层 | 范围 | 量 | 工具 |
|----|------|----|----|
| L1 Unit | Service/Mapper/Adapter/BackendFacade | ~90 | flutter test，行覆盖 80%（adapter 排除）|
| L2 Widget | 30+ 页 + theme + A/B 分支 + 错误分发 | ~60 | WidgetTester |
| L3 Flow | 端到端配网 + A/B 组合 + Crowdin fallback | ~30 | example/integration_test + Fake |
| L4 Smoke | 真机 + 真 AAR + 真 HAL | ~8 | g0-android CI（外部）|

**③ CI 质量门控**：lint:format（`dart format --set-exit-if-changed`）+ lint:analyze（`--fatal-infos`）+ **i18n:verify（ARB key 覆盖 ≥95%）** + test:flutter（L1+L2+L3）+ build:android-plugin。i18n 覆盖率门控是配网这种多语言场景特有的——防"加了文案没翻译"。

**④ 命名规范机器化**（CLAUDE.md）：接口无 `I` 前缀用 `abstract class`、Impl 后缀、Fake 前缀、文件 snake_case——AI 和人统一。

---

## 6. SDK 出问题时的兜底与降级

1. **180s 端到端 hard cap**：任何配网流程最多 180s，超时强制进 BindError，不会无限转圈。这是配网最关键的兜底——BLE/WiFi 链路太容易卡死。

2. **错误三族分发 + Retry**：BindErrorPage 按错误三族（`pk_*`/`core_*`/`backend_*`）分发不同提示和恢复动作；select_home_base 等页 BLE 获取失败 → 错误页 + Retry 按钮（可独立重试 BLE 版本或设备列表，不必整页重来）。

3. **A/B 未注入降级**：FeatureFlag Port 未注入 → 走 defaultValue（控制组），SDK 行为不变。

4. **ErrorReporter 可选出口**：异常经可选 `ProvisioningErrorReporter` 上报，用户无感但线上可观测。

5. **HAL/HttpClient 注入缺失即编译/启动期暴露**：宿主必须注入 HAL 和 HttpClient，缺失在 bootstrap 期 assert，不会运行到一半才发现。

> 同样是 fail-soft 给用户（超时有兜底页、失败可重试）+ fail-loud 给开发（错误上报 + 命名空间可定位）。

---

## 7. 数据可观测性体现在哪

- **13 阶段精度埋点**：native AAR 的 13 个 stage 通过 `ProvisioningTracker` Port 全量上报，比 UI 的 5 桶细——配网漏斗损耗能精确定位到第几个 stage（discovery/handshake/wifi/cloud-register 哪一步掉）。
- **A/B 曝光归因**：`ProvisioningFeatureFlag.trackExposure(key)` 配合埋点带 experiment/variant，配网流程的版式/引导实验可归因。
- **错误命名空间即可观测维度**：`pk_*`/`core_*`/`backend_*` 三族错误码本身就是 metric label，一眼区分"SDK 逻辑错 / AAR 底层错 / 后端错"。
- **埋点 Port 化**：SDK 不绑定 Snowplow/具体平台，宿主 adapter 代理到自家埋点（ADR-09），和 warranty 同构。

---

## 8. 如何用 AI 从 0→1 进行设计

Provisioning Kit 是把 warranty 验证过的 **AI 工艺方法论复用过来**做的 0→1：

**① 架构先行（Phase 0 = 文档先于代码）**：先落 22 个 ADR + 6 个架构子文档 + CI 流水线，再写实现。AI 在"已定义的架构边界"内推进，而不是边写边想架构。

**② 双层 Context Engineering**：CLAUDE.md（命名规范 + Ports&Adapters 硬约束 + 编码纪律）+ 架构文档（22 ADR 作为 SSOT）+ testing/strategy.md（L1-L4）。

**③ AI-TDD 闭环 + Fake 装配**：`flutter test` 是唯一反馈源；Fake 套件让 AI 能在无硬件环境下写端到端测试——AI 不能用"没设备没法测"当借口跳过测试。

**④ 分阶段 + 每阶段退出条件**：Phase 0→R11 + W1/W2/W3，每阶段产出 + 门禁明确，AI 按 wave 推进、收口门禁卡住。

**⑤ ADR superseded 留痕**：三代架构演进（v1→v2→v3）全部 ADR supersede 而非删除，AI 改架构时有完整决策链可追溯。

> 诚实补充：和 warranty 不同，**Provisioning Kit 的 commit 没有用 `[AI-Generated]` tag**（176 个 commit 都是手动 intent 明确的提交）。面试可讲这个对比——tag 纪律是 warranty 那条业务线推的团队公约，provisioning-kit 我更多用"架构先行 + Fake + 分阶段门禁"来约束 AI，而非靠 tag 标注。两种打法各有侧重。

---

## 9. AI 在设计过程中暴露的问题 + 防护机制

与 warranty 同源的防护思路，针对配网 SDK 的特点强化了两点：

| AI 失败模式 | 在本项目的防护 |
|-------------|----------------|
| **没硬件就跳过测试 / 写假 mock** | Fake 装配（FakeSessionPort/FakeClock）强制"无设备也能端到端测"，L3 flow 用 Fake 跑 |
| **改 native 契约漏改 Dart 侧** | session API 契约 + MethodChannel 标准化 + adapter 层单点，契约变更集中可控 |
| **错误码撞号 / 混用** | 三命名空间（pk_/core_/backend_）+ 前缀自动校验，AI 不能随意复用 AAR 错误码 |
| **i18n 加文案漏翻译** | CI i18n:verify ARB 覆盖 ≥95% 硬卡 |
| **架构演进时推翻重写** | 强制 ADR supersede + 分阶段迁移，不允许 big-bang |
| **过度切包/过度设计** | ADR-12 实战教训：3 包→2 包，YAGNI 砍掉 core/ui 独立包 |

**学到的**：配网这种"强硬件依赖 + native/Dart 跨语言 + 多协议"的 SDK，AI 最容易在"跨语言契约一致性"和"无硬件测试"上偷懒。前者靠把契约收敛到单一 adapter + session API，后者靠 Fake 装配——都是把"AI 容易漏的地方"用架构和工具消灭掉，而不是靠 review 盯。

---

## 10. 收益与结果

- **0→1 抽出可复用配网 SDK**：把散在 g0-flutter 的绑定能力收敛成独立 SDK，新宿主/新协议接入只改 adapter。
- **53 天完成三代架构演进**（v1→v2→v3）并平滑迁移，无 big-bang 停摆。
- **30+ 页面内聚 + 5 Port 契约**：宿主接入面从"散落各处的 bind 代码"收敛成"5 个 Port + 1 个 config"。
- **配网可在 CI 端到端测**：Fake 装配让强硬件依赖的配网流程也能跑 L1-L3，不必每次上真机。
- **方法论复用**：warranty 的 ADR 体系 + Quality Gate + 分阶段迁移直接套用到这里，验证了这套 AI 工艺的可迁移性。

---

## 11. 面试 Q&A（面试官视角）

**Q1：配网 SDK 强依赖 BLE/WiFi/硬件，你怎么做单元测试和 CI？**
> A：靠 Fake 测试装配。我在 `feature/lib/testing/` 提供整套 Fake——FakeSessionPort（模拟 native 会话）、FakeHttpClient、FakeClock（控制 180s 超时不用真等）、NoOpTracker、FakeFeatureFlag。example app 用 Fake 装配就能跑端到端配网流程（L3 flow test），CI 里完全不需要真设备/真 AAR/真后端。真机验证放在 L4 smoke（g0-android CI 外部跑）。这样 95% 的逻辑/UI/流程缺陷在 CI 就拦住,真机只验"AAR 兼容 + HAL 集成"这一薄层。
> **追问：FakeClock 怎么测 180s hard cap?** Clock 是注入的,测试里 FakeClock 直接 advance 181s,断言 BindService 进了 timeout 分支——不用真等 3 分钟,也让超时逻辑可确定性复现。

**Q2：你这个 SDK 在 53 天里换了三套 native 方案(v1 自研 channel→v2 FFI→v3 AAR),这不是反复横跳、浪费吗?**
> A：每次 pivot 都是有触发因素的、且用 ADR supersede + 分阶段迁移控制成本,不是推翻重写。v1 自研 BindChannel 是起点;v2 转 provisioning_core 是因为要统一 native source-of-truth(13 阶段事件模型);v3 转 AAR 是因为 native 配网核心要作为独立 Maven 制品被多端共享、且要做 HAL 注入对称。关键是:(1) 每代 ADR 都 superseded 而非删除,决策链完整可追;(2) 上层 api 契约(Port + session model)在 v2→v3 基本稳定,变的是 adapter 实现——这正是六边形架构的价值,native 怎么换上层不动;(3) 分阶段迁移每步有退出条件。所以"换了三次"恰恰证明架构边界切对了——核心契约扛住了底层三次替换。
> **追问:那 v1/v2 的代码不是白写了?** v2 的 13 阶段事件模型、5 桶 BindStep 映射、180s hard cap、错误命名空间这些设计在 v3 全部保留,白写的只是 native 桥接实现那一薄层——这层本来就是 adapter,设计上就预期可替换。

**Q3:api 包零依赖你是怎么强制的?口头约定吗?**
> A:不是口头。`flutter_provisioning_api` 72 个文件零外部运行时依赖,靠 CLAUDE.md 的 Ports&Adapters 硬约束 + CI lint。这跟我在 warranty 做的 quality_gate 同源——api 包是所有消费方的唯一依赖面,每多一个依赖就传染整个图。Lattice 等只读消费方只拉 api 包,不会被 feature 包的 native plugin / UI / Crowdin 传染。
> **追问:那 native plugin 在 feature 包里,feature 怎么保证不污染 api?** 单向依赖:feature depends on api,api 永远不反向 import feature;native 代码全在 feature/android/,api 是纯 Dart 契约。

**Q4:warranty 你用了 [AI-Generated] tag,这个项目却没用,为什么?**
> A:诚实说,这是两条业务线的不同打法。warranty 那条线我推了 [AI-Generated] tag 团队公约,因为要做"AI 代码可审计"的体系化沉淀。provisioning-kit 我更依赖"架构先行(Phase 0 文档先于代码)+ Fake 装配 + 分阶段门禁"来约束 AI——用流程和工具卡,而不是靠事后 tag 标注。两种都能保证质量,前者偏可追溯,后者偏前置约束。如果重来我会把 tag 也加上,因为可追溯性是低成本高收益的。

---

## 12. 其他方案考量与权衡

| 决策点 | 我选的 | 备选 | 为什么 |
|--------|--------|------|--------|
| 包结构 | api + feature 二包 | api/core/ui 三包 | 三包对单业务域过度切分(CI/发版复杂、消费面模糊),ADR-12 砍成二包 |
| native 方案 | v3 AAR + session API | 继续自研 channel / 纯 Dart FFI | AAR 可作独立 Maven 制品多端共享 + HAL 注入对称 |
| Discovery | Dart 侧 Set 订阅 + AAR discoverDevices | 纯 AAR 托管 / 引用计数 | 高层产品逻辑(过滤/空态/30s)留 Dart,Set 防异常路径泄漏 |
| Backend | thin HttpClient + fat Facade | 胖 domain port | 宿主只管发 HTTP,SDK 管调哪些端点;端点增长不波及宿主 |
| i18n | SDK 内置 ARB + l10nOverrides | host 注入全部文案 / SDK 不管文案 | 内置保证开箱即用,Overrides 只放品牌名,平衡定制 |
| 超时 | Dart 侧 180s hard cap | 依赖 native 超时 / 不设上限 | native 超时不可控,Dart 端到端兜底 + FakeClock 可测 |

---

## 13. 方案改进 / 演进方向

**已知局限**
1. **Lattice 集成(Phase R7)推迟**——wrapper Module 重写 + DI 桥接依赖 Lattice 团队的 D3 决策,当前 deferred。
2. **HAL 接口归属过渡态(ADR-22)**——Phase 1 宿主直接 implements AAR 的 HAL 接口,没有 SDK wrapper;若 AAR 接口 6 个月内 break ≥2 次,才评估加 wrapper。这是有意的 YAGNI,但赌 AAR 接口稳定。
3. **无 [AI-Generated] tag**——可追溯性弱于 warranty,后续可补。

**演进方向**
- Matter/Thread 协议支持(Q3 2026),AAR 已留 NotSupported BindType 占位,扩展走 ADR。
- 把 Fake 装配 + L1-L4 分层 + i18n 覆盖门控抽成跨 SDK 可复用的测试脚手架。

---

*文档基于 provisioning-kit 仓真实 commit、ADR(docs/architecture/overview.md)、.gitlab-ci.yml 与 testing/strategy.md 整理;ADR 编号、Port 名、阶段名、AAR 制品名均为仓库内真实存在。无 [AI-Generated] tag 为如实陈述。*
