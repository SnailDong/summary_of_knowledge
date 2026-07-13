# 设备绑定跨端体系 + HB1 解绑保留配对

> - **工作类型**：跨 4 仓锁步演进的设备绑定业务线；HB1「解绑保留配对」为旗舰特性
> - **仓库**：`g0-android` / `g0-ios` / `g0-flutter-module` / `smartdevicecoresdk-ios`（4 仓）
> - **我的角色**：绑定模块 Owner + 跨端协调人；旗舰特性 VH 4.2.0 跨 4 仓同日合入
> - **关键数据**：HB1 解绑保留配对集群 g0-android 27 commit（25 个 [AI-Generated]）、4 仓同分支 `feat/unbind_device_retain_pairing` 2026-05-27 同日 merge

---

## 0. 一句话定位

> 我是设备绑定业务线的模块 Owner，负责把绑定能力在 Android / iOS / Flutter / iOS-Core-SDK 四个仓里锁步演进；其中主导落地了 HB1「**解绑保留配对**」旗舰特性——用户从 Hub 上移除一台相机时，可选择"保留相机与 Hub 的蓝牙配对关系"+"可选清除本地录像"，让换绑/重绑无需重新配对。这个特性涉及"新增页面 UI（三端）+ deactivatedevice API 契约设计 + 固件版本门控 + 跨 4 仓字段命名对齐 + 单测/集成测试"，4 个仓在同一 feature 分支锁步、VH 4.2.0 同日合入。

**业务价值一句话**：把"解绑"从一个二元动作升级为有粒度的决策（解绑账号 vs 保留配对 vs 清数据），解决"换网/换账号后要重新配对"的体验痛点；同时建立了跨 4 仓绑定特性"锁步演进"的工程范式。

---

## 1. 背景与目标

**HB1 / Homebase 是什么**：HB1（Homebase 1）是 VH 4.0.0 引入的新中枢硬件——一个 Hub + 多台相机（子设备）的 1-to-N 拓扑。相机以子设备身份绑定到 Hub。Hub 跑新协议固件（`firmwareId >= 1.0.0`）。

**"解绑保留配对"要解决什么**：传统解绑是一刀切——相机从账号移除，蓝牙配对关系也丢了，下次要重新配对、重新配网，体验很差。业务需求是：移除相机时让用户**选**：
- `retainPairing = true`：相机与 Hub 的无线配对关系保留（只从账号解绑），便于快速重绑。
- `cleanStorage = true`（可选）：顺带清除设备上的本地录像（隐私/安全）。

**约束**：
1. **跨 4 仓一致**：g0-android 与 g0-ios 逻辑必须强一致（CLAUDE.md 硬规则），core SDK 提供统一 API，Flutter 展示子设备页。
2. **固件门控**：新协议消息旧固件不识别，强行下发会让设备挂起，所以必须 `firmwareId >= 1.0.0` 才走新流程，旧固件回退老交互。
3. **API 契约对齐**：deactivatedevice 接口新增参数的命名要和后端契约一致（踩过 snake_case/camelCase 不一致的坑）。

---

## 2. 我实现了什么（Scope）

| 仓 | 交付物 | 关键文件 / commit |
|----|--------|-------------------|
| **g0-android** | `RemoveHubDeviceActivity`（解绑整页 + 两个 checkbox）+ `DeviceHelper` 三路分支路由 + i18n `hub_unbind_*`→`remove_hub_*` + §11 单测+集成测试 | `RemoveHubDeviceActivity.kt`、`DeviceHelper.kt`、`RemoveHubDeviceActivityTest.kt`（27 commit，25 [AI-Generated]）|
| **g0-ios** | `RemoveHubDeviceViewController`（383 行）+ `RemoveHubDeviceRouting`（纯函数路由，可测）+ 单测 | `a3a3429ad feat(settings): Hombase 解绑整页移除界面 + retain_pairing/cleanStorage [AI-Generated]` |
| **smartdevicecoresdk-ios** | `deactivatedevice` API 新增 `retainPairing` / `cleanStorage` 参数 + 命名契约对齐 | `A4xDeviceAPI.swift`（a0c8e163 + c6d4e068 rename）|
| **g0-flutter-module** | 保留配对关系子设备页面展示 + "hub 永远查询配对关系表" | `5236e8e2`、`4a5ecf4c` |
| **跨仓** | 固件版本门控统一（`supportsNewFirmwareFeatures` >= 1.0.0）+ 4 仓同分支同日 merge | 4 仓 `feat/unbind_device_retain_pairing` → `test/VH_4.2.0`（2026-05-27）|

---

## 2.5 核心技术说明（是什么 / 做什么 / 为什么）

这个项目的技术重点不在“用了多少框架”，而在跨端一致性、API 契约兼容、固件门控和可测试的路由决策。下面按关键技术逐个说明。

### 2.5.1 Core SDK

Core SDK 是 App 和底层设备/后端能力之间的公共接口层。它把设备管理、解绑、绑定、请求模型等能力封装成稳定 API，让 Android、iOS、Flutter 不需要各自直接拼底层协议。

在 HB1 解绑保留配对里，Core SDK 承担 `deactivatedevice` 的参数扩展：新增 `retainPairing` 和 `cleanStorage`。App UI 侧只负责收集用户选择，最终通过 Core SDK 把参数传给后端。

选择在 Core SDK 层扩展，是因为这个能力不是某一个页面自己的逻辑，而是设备管理契约的一部分。放在 Core SDK 后，三端可以对齐同一套 API，避免 Android、iOS、Flutter 各自发明字段和语义。

### 2.5.2 `deactivatedevice` API

`deactivatedevice` 是设备解绑接口，负责把设备从账号或家庭关系中移除。新增参数后，它不再只是“是否解绑”，而是可以表达“解绑账号但保留 Hub 与相机配对关系”“是否清除本地录像”等更细粒度的意图。

在项目中，`retainPairing` 表示保留相机和 Hub 的无线配对关系，`cleanStorage` 表示移除时清除本地录像。两个参数从 checkbox 一路透传到 Core SDK 和后端请求体，形成完整链路。

我把这两个字段设计成可选参数，并使用 nil 省略，是为了向后兼容。不传新字段时，旧调用方仍然保持旧行为；只有新页面明确传值时，后端才执行新语义。这种方式适合跨多端、多版本灰度的 App 能力演进。

### 2.5.3 固件版本门控

固件版本门控是根据设备固件能力决定是否开放新功能的机制。新 App 不等于所有设备都支持新协议，旧固件可能完全不认识新增字段或新增指令。

在这个项目中，只有 `firmwareId >= 1.0.0` 且 HUB 有子设备时，才进入新的 `RemoveHubDeviceActivity` / `RemoveHubDeviceViewController` 页面。旧固件、无子设备、非 HUB 设备都回退到原来的解绑 dialog。

这个设计是为了保护设备稳定性。HB1 新协议如果打到旧固件，可能导致解绑失败甚至设备挂起。用统一的 `supportsNewFirmwareFeatures()` 收口门控，可以保证新旧设备各走各的流程，而不是在各个页面散落判断。

### 2.5.4 纯函数路由

纯函数路由是把“输入什么设备状态，应该走哪个页面”抽成一个无副作用函数。它不依赖 Activity、ViewController 或 UI 上下文，只根据输入返回决策。

iOS 侧我把三路分支抽成 `RemoveHubDeviceRouting`，Android 侧也通过 `DeviceHelper` 收敛路由判断。输入包括设备类型、是否 HUB、是否有子设备、固件版本是否满足要求，输出是进入新页面还是回退旧 dialog。

这样做是为了让最容易出错的分支逻辑可测试。跨端项目里，UI 本身很重，但路由规则必须稳定。抽成纯函数后，可以用单测穷举旧固件、null 固件、无子设备、非 HUB 等场景，减少 AI 或人工漏掉边界 case 的风险。

### 2.5.5 Checkbox 真值表测试

真值表测试是把所有输入组合都列出来，逐一验证输出是否符合预期。它适合布尔开关少但组合含义重要的场景。

在解绑保留配对中，页面有两个 checkbox：保留配对、清除录像。两个布尔值一共有 4 种组合，每一种都必须准确透传成对应的 `retainPairing` / `cleanStorage` 参数。

我用真值表测试，是因为这个功能的核心不是 UI 多复杂，而是用户选择不能被误传。比如用户想保留配对但不清录像，如果参数反了，就是严重体验和隐私问题。4 组组合全部锁死后，后续重构 UI 或 ViewModel 都不容易破坏契约。

### 2.5.6 跨 4 仓锁步

跨 4 仓锁步是指 Android、iOS、Flutter、iOS Core SDK 在同一个特性分支和同一发布窗口中同步演进。它不是某个框架技术，而是一种工程组织方式。

这个功能涉及页面、Core SDK 请求模型、Flutter 子设备展示和后端契约。任何一端漏改，都会出现字段不一致、页面不一致或功能半上线的问题。因此我让 4 个仓使用同名 feature 分支，并在同一日期合入对应发布分支。

这样做的原因是设备绑定能力天然跨端。独立排期看似灵活，但会制造灰度期间的契约漂移。锁步策略让 API、UI、文案、测试和发布节奏对齐，适合这种用户体验必须强一致的旗舰特性。

### 2.5.7 `[AI-Generated]` 提交标记

`[AI-Generated]` 是在 commit message 中标记 AI 参与生成的提交。它不是为了炫技，而是为了让代码来源、审查重点和后续追溯更清楚。

在这个项目里，Android 侧 27 个 commit 中 25 个带 `[AI-Generated]`，覆盖 spec、model、i18n、layout、Activity、ViewModel、路由和测试。每一步都是小提交，方便 review 时看清 AI 改了什么。

我这样做，是因为跨端功能用 AI 加速时，最怕“一大坨代码不知道哪里来的”。标记和原子提交能让 review 聚焦在风险点：跨端一致性、字段命名、固件门控、真值表是否完整。这也是 AI 工程化的一部分。

---

## 3. 方案设计（怎么做的）

### 3.1 整体数据流

```
用户在设备设置点"移除"
        │
        ▼
┌──────────────────────────────────────────────┐
│ DeviceHelper.showUnbindDialogAndExcDeleteIfNeed │  ← 路由决策（三路分支）
│  ① HUB + 有子设备 + firmware>=1.0.0            │
│     → RemoveHubDeviceActivity(新整页 + 2 checkbox)│
│  ② HUB 无子设备 → CommonCornerDialog(旧)        │
│  ③ 非 HUB → CommonCornerDialog(旧)              │
└──────────────────────┬────────────────────────┘
                      │ (retainPairing, cleanStorage)
                      ▼
        ViewModel.deleteDevice(device, isApConn, retainPairing, cleanStorage)
                      │
                      ▼
        Core SDK: DeviceManageCore.deleteDevice(sn, retainPairing, cleanStorage)
                      │  POST /device/deactivatedevice
                      ▼   { retainPairing: Bool, cleanStorage: Bool }  (nil 时省略=旧行为)
                    后端
```

### 3.2 关键设计决策

**① 三路分支路由 + 固件门控（核心）**——不是所有解绑都进新页面。`DeviceHelper` 用三路分支：只有"HUB + 有子设备 + 新固件"才进 `RemoveHubDeviceActivity`，其余（无子设备 / 非 HUB / 旧固件）回退老 dialog。固件门控 `supportsNewFirmwareFeatures()` 内部用 `BindUtils.compareVersions(firmwareId, "1.0.0") >= 0`（自动剥离 `-d` debug 后缀）。**为什么门控**：旧固件不识别 retainPairing 协议，强行下发会让设备挂起或解绑失败——门控把新特性和旧硬件隔离。

**② checkbox → API 参数的纯映射 + 真值表测试**——`RemoveHubDeviceActivity` 两个 checkbox（保留配对 / 清除录像）直接映射成 `(retainPairing, cleanStorage)` 两个 bool 传给 ViewModel。这个映射用 4 组真值表单测锁死（4 种 checkbox 组合 → 4 种 API 参数组合，mock 验证）。

**③ deactivatedevice API 契约：nil 省略=向后兼容**——core SDK 给 `A4xDeviceRequestModel` 加两个**可选** bool 字段，`nil 时编码省略`——这样旧版调用方不传这两个字段时行为完全等同旧版,新版才带。这是非破坏式扩展。

**④ 路由逻辑抽成纯函数（iOS）**——iOS 把三路分支抽成 `RemoveHubDeviceRouting` 纯函数（37 行），脱离 UIViewController 即可单测，不依赖 UI context。

### 3.3 跨 4 仓锁步演进（工程范式）

这是这个工作最能体现"工程组织能力"的部分：
- **同分支策略**：4 个仓都用 `feat/unbind_device_retain_pairing` feature 分支，2026-05-27 同日 merge 进各自的 `test/VH_4.2.0`。
- **双端强一致硬规则**：g0-android 的 CLAUDE.md 明文"g0-android 与 g0-ios 必须保持逻辑强一致，任何一端变更须同步另一端，commit message 明确标注「需同步到 iOS/Android」"——把"忘记同步"从习惯问题升级成流程问题。
- **API 命名对齐踩坑**：core SDK 第一版 `retain_pairing`（snake）+ `cleanStorage`（camel）不一致，后端契约要求统一 camelCase，4 天后专门一个 commit `rename retain_pairing to retainPairing per API contract`——跨端字段命名一致性是 silent failure 高发区。

---

## 4. 关键技术点与实现细节

1. **`hub_unbind_*` → `remove_hub_*` 字符串 key 重命名**：v1 的 `HubUnbindDialog` 整套字符串 key 替换，旧 dialog 下线——功能退场治理（残留字符串也要清）。

2. **三路分支的固件兜底**：`DeviceHelperUnbindBranchTest` 专门测旧固件（0.9.99）/ null 固件场景——即使是 HUB+子设备，旧固件也回退老 dialog，不进新页面。

3. **command 透传链**：checkbox → Activity → `ViewModel.deleteDevice(retainPairing, cleanStorage)` → `DeviceManageCore.deleteDevice(...)` → `A4xDeviceRequestModel` → POST body，参数全链路透传不丢。

4. **online/offline 解绑路径**（绑定体系的更广部分）：`SwitchNetworkManager` 在线走 WebSocket（复用已 auth 连接做优化）、离线走 BLE，30s 周期重发；带 `switch_signal_setup` 埋点区分 `reuse_authed` 命中。

5. **DeviceHelper 双源回退**：子设备数从 `DeviceAttributes.getSubDeviceCount()` 取，有双源 fallback，防单源拿不到时误判。

---

## 5. 测试与质量保障

**Android（旗舰特性的测试深度）**：
- `RemoveHubDeviceActivityTest`：§11 真值表 4 组（checkbox 组合 → ViewModel 参数）`verify(exactly=1)` mock 断言 + SUCCESS（post REFRESH_DEVICE_LIST + finish）/ ERROR（toast + 重新启用控件）集成路径。
- `DeviceHelperUnbindBranchTest`：三路路由 + 固件门控（旧/null 固件回退）3+2 case。

**iOS**：`RemoveHubDeviceRoutingTests` + `RemoveHubDeviceRequestTests`——路由抽纯函数后可测，请求参数构造可测。

**跨端一致性**：双端同名 checkbox、同名参数、同 `>= 1.0.0` 固件门控——靠 CLAUDE.md 双端一致 commit 约束 + review。

---

## 6. 出问题时的兜底与降级

1. **固件门控即最大兜底**：旧固件设备**永远不会**进新协议流程，自动回退老 dialog——防"新特性打到旧硬件导致设备挂起"。这是设计层的 fail-safe。
2. **deactivatedevice 参数 nil 省略**：不传新参数=旧行为，向后兼容，老版本 App / 老后端不受影响。
3. **解绑 ERROR 态**：API 失败 → toast 提示 + 重新启用控件，用户可重试，不卡死。
4. **三路分支双源回退**：子设备数取不到时有 fallback，不会因单源失败误判路由。

---

## 7. 数据可观测性体现在哪

- **switch_signal_setup 埋点**：在线/离线换网带 `reuse_authed` / `result` 维度，能看"复用已 auth 连接的命中率"和"ticket 失败率"。
- **解绑结果可观测**：SUCCESS/ERROR 路径区分，配合 RxBus 事件。
- （相对 warranty，这条 app-feature 线的可观测较轻，主要是埋点 + 日志，没有独立后端 metric 体系。诚实标注。）

---

## 8. 如何用 AI 从 0→1 进行设计

HB1 解绑保留配对是**高密度 AI 辅助**的特性——g0-android 集群 27 个 commit 里 **25 个带 `[AI-Generated]`**：
- **spec 先行**：先落 `docs/requirements/hombase-kit-retain-pairing.md` + `docs/test-cases/` 再写代码（commit `docs(setting): hombase removal v2 spec + implementation plan`）。
- **分原子 commit**：spec → model（cleanStorage 字段）→ i18n（key 重命名）→ layout → Activity → ViewModel 透传 → 路由 → 测试，每步一个 AI commit，可精确归因。
- **测试同步**：DeviceHelper 三路分支测试、RemoveHubDeviceActivity §11 真值表测试都是 [AI-Generated]——AI 写实现的同时写测试。
- **CLAUDE.md 工作流**：g0-android 的 CLAUDE.md 定义了 Plan→Design→Docs→Review→Test→Task→Verify→Build→Adb→CodeReview→Report 的工作流 + `[AI-Generated]` tag 公约。

---

## 9. AI 在设计过程中暴露的问题 + 防护机制

| AI 失败模式 | 在本工作的真实体现 / 防护 |
|-------------|---------------------------|
| **跨端漏同步**（改 Android 忘改 iOS） | CLAUDE.md 双端强一致硬规则 + commit message 必须标"需同步到 iOS/Android" |
| **API 字段命名漂移**（snake vs camel） | core SDK `retain_pairing`→`retainPairing` 专门一个 commit 对齐后端契约——踩过坑后用契约校验治 |
| **漏固件兼容**（新协议打旧固件） | `supportsNewFirmwareFeatures()` 统一门控 + 旧/null 固件回退测试覆盖 |
| **真值表漏 case** | RemoveHubDeviceActivity §11 用 4 组真值表强制覆盖全部 checkbox 组合 |
| **功能退场留残留** | `hub_unbind_*`→`remove_hub_*` key 重命名 + 旧 HubUnbindDialog 下线（残留字符串也清）|

**学到的**：跨多仓的特性，AI 最容易在"跨端一致性"和"跨语言 API 契约"上漏——一端实现了另一端忘了、字段名两端不一致。防护靠：(1) CLAUDE.md 把双端一致变成 commit 级硬约束；(2) 把路由逻辑抽成纯函数 + 真值表测试，让 checkbox→API 的映射不留模糊；(3) 命名对齐用专门 commit + 后端契约校验。

---

## 10. 收益与结果

- **业务 0→1**："换网/换账号保留配对"需求落地，解绑从二元动作升级为有粒度决策。
- **建立跨 4 仓锁步范式**：同分支 + 双端一致硬规则 + 同日 merge，可复用到后续跨端特性。
- **AI 高密度落地**：单特性 25 个 [AI-Generated] commit，spec→实现→测试全链路 AI 辅助且可追溯。
- **测试深度**：真值表 + 路由纯函数 + 固件回退，关键逻辑零模糊。

---

## 11. 面试 Q&A（面试官视角）

**Q1：一个解绑功能为什么要跨 4 个仓？不能在一个地方改吗？**
> A：因为这是端到端的能力,每一层职责不同。core SDK(smartdevicecoresdk-ios)定义 deactivatedevice 的 API 契约(retainPairing/cleanStorage 参数);Android/iOS 各自实现解绑整页 UI 和路由;Flutter 展示保留配对后的子设备页。它们必须锁步——API 加了参数,三端都要传;UI 文案 key 改了,双端都要改。我用同一个 feature 分支 + 4 仓同日 merge + CLAUDE.md 双端强一致 commit 约束来保证锁步。这不只是技术,是跨端工程组织。
> **追问:同日 merge 4 个仓,万一一个仓有问题怎么回滚?** 同分支策略让每个仓独立可回滚——4 仓是各自的 git 仓,回滚一个不影响其他;且 deactivatedevice 参数 nil 省略=向后兼容,即使 core SDK 先上、App 后上也不会炸。

**Q2:固件门控 firmwareId >= 1.0.0,这个边界怎么定的?为什么一开始是 > 后来改成 >=?**
> A:门控的本质是"新协议消息旧固件不识别会让设备挂起",所以要把支持新协议的固件版本卡出来。1.0.0 是 HB1 新协议的起始版本。一开始写成 `> 1.0.0` 是个 off-by-one bug——把 1.0.0 这个 release 版本自己排除了,只有 1.0.1+ 才走新流程,但 1.0.0 正式版用户应该能用。发现后专门一个 commit 从 `>` 改成 `>=`。这也说明边界条件要测——我后来补了旧固件/null 固件的回退测试。
> **追问:firmwareId 是字符串比较还是语义版本比较?** 语义版本比较(`compareVersions`),不能用字符串比(否则 "1.0.10" < "1.0.9"),且要剥离 `-d` debug 后缀。

**Q3:retainPairing 参数你用了"nil 省略"的编码,为什么不直接给个默认 false?**
> A:为了向后兼容的非破坏式扩展。如果默认 false 并总是下发,老后端/老版本可能不认识这个字段或行为有歧义;nil 省略意味着"不传这个字段时,行为完全等同加这个特性之前的旧版本"——新老调用方在同一 API 上共存,旧路径零行为变化。这跟我在 warranty 做 API 演进的思路一致:扩展用可选字段 + 缺省=旧语义,而不是改默认值。

**Q4:你把 iOS 的路由逻辑抽成了纯函数 RemoveHubDeviceRouting,为什么?**
> A:三路分支(HUB+子设备/HUB无子设备/非HUB,叠加固件门控)是这个特性最容易出错的决策点。如果它埋在 UIViewController 里,要测就得起 UI context,很重且不稳定。抽成纯函数(输入设备属性,输出路由决策)后,单测直接喂各种设备组合断言路由结果,不依赖 UI。这也是消除"AI 漏某个分支 case"的手段——纯函数 + 穷举 case 测试。

---

## 12. 其他方案考量与权衡

| 决策点 | 我选的 | 备选 | 为什么 |
|--------|--------|------|--------|
| 解绑入口 | HUB+子设备+新固件才进新整页 | 所有解绑都进新页 / 都用 dialog | 旧固件/无子设备没必要,三路分支按场景匹配 |
| API 参数 | 可选 bool + nil 省略 | 必填 + 默认 false | nil 省略=向后兼容,新老共存 |
| 路由逻辑 | 抽纯函数 | 留在 VC/Activity 里 | 纯函数可穷举测试,消除分支遗漏 |
| 跨端同步 | 同分支 + commit 约束 | 各仓独立排期 | 锁步保证 4 仓一致,避免漂移 |
| 固件门控 | 统一 supportsNewFirmwareFeatures | 各处散落 if 判断 | 单一 API 收敛,改门控一处改 |

---

## 13. 方案改进 / 演进方向

**已知局限**
1. **iOS 文案硬编码 pending Crowdin**：iOS `remove_hub_*` key 当前硬编码在 VC 里,等 Crowdin 同步——临时态。
2. **可观测较轻**：这条 app-feature 线主要靠埋点+日志,没有独立后端 metric/告警体系(对比 warranty)。可补解绑成功率/保留配对选择率的埋点漏斗。
3. **固件门控曾有 off-by-one**：`>` vs `>=` 的坑说明版本边界要有测试前置。

**演进方向**
- 把"跨 4 仓锁步"沉淀成可复用的跨端特性 SOP(同分支命名规范 + 双端一致 checklist + API 契约对齐 gate)。
- 解绑保留配对的选择率做埋点漏斗,反哺产品(多少用户选保留)。

---

*文档基于 g0-android/g0-ios/g0-flutter-module/smartdevicecoresdk-ios 四仓真实 commit 与代码整理;Activity/VC/API 名、commit subject、firmware 门控逻辑、4 仓同日 merge 均为真实。注:#4 Homebase 新品上架绑定为独立工作,见 04-homebase-launch-binding.md;两者共享 firmwareId>=1.0.0 固件门控。*
