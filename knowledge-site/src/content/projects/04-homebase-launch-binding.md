# VH Homebase（HB1）新品上架绑定功能（三端）

> - **工作类型**：新硬件产品（HB1/Homebase Hub）上架时的端到端绑定链路；三端 + Core SDK 协同
> - **仓库**：`g0-flutter-module` / `g0-ios` / `g0-android` / `smartdevicecoresdk-ios`
> - **时间跨度**：2025-12-25 → 2026-05-28（主要 2026-01~04，VH 4.0.0 → 4.2.0）
> - **我的角色**：新品绑定链路 Owner，三端 + Core SDK 锁步实现

---

## 0. 一句话定位

> HB1（Homebase）是新中枢硬件，上架时需要一套全新的绑定体验——相机不再"直接扫码绑定"，而是"先选/配对 Hub，再把相机绑定到 Hub"。我负责这条新品绑定链路在 Flutter / iOS / Android / iOS-Core-SDK 四处的端到端实现：**相机绑定 Hub 的固件版本校验、在线/离线双路径换网绑定、蓝牙校验、设备卡片显示改造、单机绑定 Hub 多场景**。Core SDK 提供 `startBindToBxOverA4XBLE` 新接口（蓝牙包填 `bxsn`），三端按固件门控路由到新/旧 UI。

**业务价值一句话**：让 HB1 这个新硬件能上架卖——没有这套绑定链路，用户买了 Hub 也绑不上。同时建立了"新协议设备 + 固件门控 + 在线离线双路径"的绑定范式。

---

## 1. 背景与目标

**Homebase（HB1）是什么**：新型中枢硬件，1 Hub + N 相机的拓扑。绑定模型从"扫码直绑相机"变成"相机绑定到 Hub"，是一套全新的用户体验和技术链路。

**新品上架的技术挑战**：
1. **固件版本是前提**：Hub 固件必须满足最低版本（`firmwareId >= minBxVersion`），旧固件不识别新协议——绑定前要校验，不满足要引导升级。
2. **在线/离线两条换网路径**：设备在线走 WebSocket（`trigger_connect_wifi`），离线走 BLE（`scanWifiList` + `startBind`）。
3. **蓝牙校验**：相机绑 Hub 时蓝牙连接必须已建立且信号足够。
4. **设备卡片显示改造**：camera 卡片绑定 Hub 时要展示可用 Hub 列表（基于固件可用性过滤）；CS/Homebase 仅有线连接才显示 MAC。
5. **三端 + Core SDK 锁步**：Core SDK 出接口，三端 UI 各自实现 + 固件门控路由。

---

## 2. 我实现了什么（Scope）

| 端 | 交付物 | 关键 commit / 文件 |
|----|--------|--------------------|
| **smartdevicecoresdk-ios** | `startBindToBxOverA4XBLE(hubSerialNumber, ssid, ssidPwd, ...)` 新接口；BLE 包填 `bxsn`；`BleReadTypeEnum.bindCX` 类型 | `2ddbcc4e 添加camera绑定homebase接口`（2025-12-25）|
| **g0-flutter-module** | 固件版本校验（select_home_base 三态改二态 + 错误码 10501）、绑定前版本校验、在线/离线换网、蓝牙校验、单机绑定 Hub 场景展示 | `8b0befe6`(固件校验)、`bb2a9353`(在线离线换网)、`a4edf161`(蓝牙校验)，2026-04-10 |
| **g0-ios** | camera 卡片绑定 Hub 流程、设备卡片显示、CS/Homebase 仅显示有线 MAC、固件门控 | `f429f67a`(camera卡片绑hub)、`c1b80fcd`(有线MAC)、`0ed1d0da`(固件门控 [AI-Generated])|
| **g0-android** | 固件版本门控统一（`supportsNewFirmwareFeatures` >= 1.0.0）、换 WiFi 入口新/旧路由、优化获取固件版本时不断开蓝牙 | `8d737ae9`(门控 [AI-Generated])、`d68a7e3f`(> 改 >=)、`4fd3c70f` |
| **设计文档** | `select_home_base_error_handling.md`(321 行)、`switch_network_design.md`(v1.4) | g0-flutter-module/docs/ |

---

## 2.5 核心技术说明（是什么 / 做什么 / 为什么）

HB1 新品绑定链路的技术重点，是把“新硬件协议能力”包装成用户能顺畅完成的绑定体验。这里的关键技术主要围绕 BLE、WebSocket、固件门控、实时属性和在线/离线路由展开。

### 2.5.1 BLE

BLE 是 Bluetooth Low Energy，适合手机与近场设备建立低功耗连接，常用于 IoT 设备配网、读取设备信息、下发 WiFi 凭据和绑定指令。

在 HB1 绑定链路中，离线设备无法通过云端通信，只能通过 BLE 获取 WiFi 列表、读取 Hub 最低固件要求、下发 `startBind` 指令。Core SDK 的 `startBindToBxOverA4XBLE` 会把 Hub SN 写入 BLE 握手包里的 `bxsn` 字段，让相机知道自己要绑定到哪一个 Hub。

使用 BLE 是由设备状态决定的：离线设备没有云端通道，但手机和设备可以近场通信。BLE 也是绑定阶段最接近硬件真实状态的链路，适合做固件查询、WiFi 扫描和初始绑定。

### 2.5.2 WebSocket

WebSocket 是一种长连接通信协议，适合服务端和客户端之间进行实时双向通信。与普通 HTTP 请求相比，它可以在连接保持期间持续发送指令和接收结果。

在这个项目里，设备在线时换网走 WebSocket 信令，例如 `trigger_query_wifi_list` 和 `trigger_connect_wifi`。如果设备已经在线并且和云端保持连接，就没有必要再绕到 BLE，直接通过已认证的云端链路让设备执行换网动作。

我把在线设备走 WebSocket、离线设备走 BLE，是因为两种设备状态的物理条件不同。在线有云端通路，WebSocket 更快也更稳定；离线没有云端通路，只能依赖 BLE。把两条路径分开，比强行统一成一个抽象更可靠。

### 2.5.3 固件版本门控

固件版本门控是根据 Hub 固件能力决定是否允许进入新绑定流程。新协议依赖固件支持，App 不能只根据自身版本开放功能。

在 HB1 上架链路里，`firmwareId >= minBxVersion` 的 Hub 才能作为可选目标。列表页先过滤不可用 Hub，绑定前再进行第二次校验。如果不满足要求，页面展示错误码 10501 对应的固件升级提示。

这样设计是为了同时保证体验和正确性。列表过滤让用户不要点到不可用设备；绑定前校验防止缓存过期或绕过页面导致错误绑定。两道门控都通过后，才进入配对流程。

### 2.5.4 BxVersionPreFetcher

BxVersionPreFetcher 是一个固件版本预取与缓存组件，用来提前通过 BLE 获取 Hub 侧要求的最低版本，并在后续页面复用。

在 `select_home_base` 页面，它会预取 `minBxVersion`；在 `add_pre_bind_camera` 绑定前校验时，优先读取这个缓存，miss 时再主动 fetch。这样既减少重复 BLE 查询，也保证最终绑定前不会漏掉版本判断。

这个组件存在的原因是 BLE 查询有成本，频繁查询会拖慢页面，也可能带来连接抖动。预取 + 缓存复用把“用户等待”和“正确校验”平衡起来，让列表页和绑定页共享同一份版本信息。

### 2.5.5 `getDeviceAttributes(returnRealTimeAttributes: true)`

`getDeviceAttributes` 是获取设备属性的接口，`returnRealTimeAttributes: true` 表示尽量读取实时属性，而不是只用本地或服务端缓存。

在这个项目里，固件版本判断依赖设备当前真实 `firmwareId`。如果只读缓存，可能出现设备已经升级但 App 还认为不可用，或者设备未升级却被误判可用的问题。因此我在版本校验链路里使用实时属性。

选择实时属性，是因为固件门控属于 correctness 逻辑，不只是展示信息。绑定前判断错了会直接影响功能成败，所以这里宁可多一点读取成本，也要保证判断基于最新状态。

### 2.5.6 二态加载

二态加载是把页面状态收敛为“所有关键任务完成后再展示结果”，避免部分异步任务完成时提前展示中间状态。

`select_home_base` 页面需要并行完成两个任务：获取 `minBxVersion` 和获取设备 `firmwareId`。我把原来的三态改成二态，只有两个任务都完成后，才展示 Hub 列表或错误页。任何一个任务失败，都进入可重试的错误状态。

这样做是因为三态中间态会误导用户：列表可能先展示出来，但固件校验还没完成，用户可能点到实际不可用的 Hub。二态加载把异步协调显式化，牺牲一点点提前展示，换来更确定的用户体验。

### 2.5.7 FlutterBoost

FlutterBoost 是原生 App 与 Flutter 页面混合栈里常用的路由桥接能力，用来从 Android/iOS 原生页面跳转到 Flutter 页面，并传递参数。

在 HB1 绑定链路中，iOS 设备卡片检测到符合条件的 Hub 后，会把 `selectedBindDeviceModel` 序列化并缓存，然后跳转到 Flutter 的 `flutter_bind_connecting_page`，把原生设备入口和 Flutter 绑定流程串起来。

使用 FlutterBoost 是因为现有 App 是原生 + Flutter 混合架构。新品绑定不可能只改 Flutter 或只改原生，必须在原生设备卡片和 Flutter 配网页面之间建立稳定跳转和参数传递。

---

## 3. 方案设计（怎么做的）

### 3.1 端到端数据流

```
Flutter UI (g0-flutter-module)
 ├─ select_home_base: 展示可用 Hub 列表
 │    firmwareId >= minBxVersion 才可用
 │    minBxVersion 从 BxVersionPreFetcher(BLE query) 预取
 │    firmwareId 从 getDeviceAttributes(returnRealTimeAttributes:true)
 │
 ├─ add_pre_bind_camera: 绑定前最终版本校验
 │    checkParentFirmwareVersion() → 优先读 BxVersionPreFetcher 缓存
 │    不满足 → 错误码 10501(固件升级提示半屏弹窗)
 │
 ├─ switch_network_connecting: 在线/离线换网
 │    online → WebSocket trigger_connect_wifi
 │    offline → NativeBridge scanWifiList + startBind
 │
 └─ Native (iOS/Android)
      ├─ Core SDK: startBindToBxOverA4XBLE(hubSerialNumber, ssid, ssidPwd)
      │    BLE 握手包填 "bxsn": hubSerialNumber
      └─ 固件门控 DeviceHelper.supportsNewFirmwareFeatures()
           新固件 → Flutter 新流程; 旧固件 → 原生旧流程
```

### 3.2 关键设计决策

**① 固件校验"三态改二态"（核心 UI 决策）**——`select_home_base` 页加载时有两个并行任务：BLE 取 `minBxVersion` + 取设备属性 `firmwareId`。原本中间态会让列表提前展示，用户看到"还没校验完"的设备。我把三态（loading/部分/完成）改成二态——**两个任务都完成才展示列表或错误页**：
- `errorCode != null` → BLE 获取失败 → 错误页 + Retry。
- `minBxVersion` 为空 → 所有设备不可用。
- `firmwareId >= minBxVersion` → 可用；否则禁用。

**② 双重版本校验（列表 + 绑定前）**——不只在列表过滤，`add_pre_bind_camera` 在 `setPairing` 之前再校验一次（`checkParentFirmwareVersion`），优先读 `BxVersionPreFetcher` 缓存（select_home_base 可能已预取），miss 才主动 fetch。**为什么两道**：列表过滤是 UX（不让点），绑定前校验是 correctness（防绕过/防缓存过期），避免"进入配对中状态才失败"。

**③ 在线/离线双路径（ADR 级决策）**——按 `device.online` 字段分两条独立路径：在线走 WebSocket 信令（`trigger_query_wifi_list` / `trigger_connect_wifi`），离线走 BLE（`scanWifiList` / `startBind`）。失败直接返回 select_wifi，不做重试引导（避免在弱链路上反复卡）。

**④ Core SDK 的 bxsn 注入**——`startBindToBxOverA4XBLE` 把 Hub 的序列号作为 `bxsn` 填进 BLE 握手包，复用已有 BLE 状态机的 `updateBindInfo` 步骤——相机通过 BLE 告诉设备"我要绑到这个 Hub"。

**⑤ 固件门控做 UI 路由**——`supportsNewFirmwareFeatures()`（>= 1.0.0）决定走 Flutter 新流程还是原生旧流程：换 WiFi 入口、Hub 解绑入口都按门控分流。新旧固件用户走完全不同的 UI 路径。

### 3.3 三端 + Core SDK 锁步

- **Core SDK 先出接口**（2025-12-25），三端 UI 后续接入。
- **固件门控逻辑三端一致**：`compareVersions` 语义版本比较 + 剥离 `-d` 后缀，Android/iOS/Flutter 同实现。
- **分支管理**：`feature/vh_hb1_bind`（iOS 初始）、`feature/homebase_bind_firmware_version_verify`、`feature/homebase_switch_network`、`feat/bind_switch_network`、`feat/bind_version_compatibility`。

---

## 4. 关键技术点与实现细节

1. **BxVersionPreFetcher 预取 + 缓存复用**：select_home_base 页预取 `minBxVersion` 缓存，绑定前 `checkParentFirmwareVersion` 优先读缓存，miss 才 fetch——减少重复 BLE query，但保证不漏校验。

2. **错误码 10501 半屏弹窗**：固件不满足时注册专门错误码 10501，弹固件升级提示，区别于通用错误 1999/-1。

3. **getDeviceAttributes(returnRealTimeAttributes: true)**：拿实时固件属性而非缓存属性，保证版本判断基于设备当前真实状态。

4. **优化：取固件版本不断开蓝牙**（Android `4fd3c70f`）——原本取 minBxVersion 会断 BLE，优化成保持连接，避免重连开销。

5. **CS/Homebase 仅有线显示 MAC**（iOS `c1b80fcd`）——有线连接才显示 MAC，无线隐藏，符合 Hub 设备的网络模型。

6. **camera 卡片绑 Hub 的跳转**（iOS `f429f67a`）：检测设备分类 4/17（Hub）+ 有线 + 已联网 → 序列化 `selectedBindDeviceModel` 缓存到 FlutterBoost → 跳 Flutter `flutter_bind_connecting_page`（bindType=2, dataType=4）。

---

## 5. 测试与质量保障

- **固件校验路径测试**：`feat/bind_version_compatibility` 集群带换网透传 + BLE fallback 的 P0 测试（如 `test(bind): cover MR !1205 P0 — switch-network passthrough + BLE fallback [AI-Generated]`）。
- **三态改二态的协调逻辑**：`_markTaskCompleted(taskName, failed)` 协调两个并行任务，`onRetry()` 支持独立重试 BLE 版本或列表。
- **门控边界**：firmwareId `>` → `>=` 的修正（与 #3 共享同一门控，off-by-one 已修）。

---

## 6. 出问题时的兜底与降级

1. **固件门控即最大兜底**：旧固件设备自动走原生旧流程（重新绑定路径），新协议消息绝不打到旧固件——防设备挂起。
2. **双重校验 + Retry**：列表过滤 + 绑定前校验两道闸；BLE 获取失败有错误页 + Retry，可独立重试 BLE 版本或设备列表。
3. **换网失败不卡死**：在线/离线换网失败直接返回 select_wifi，密码错误（code==5）弹底部重试，不做无限重试引导。
4. **版本获取失败兜底返回值**：`checkParentFirmwareVersion` 获取失败返回 -1（走默认错误 1999），不满足返回 0（错误码 10501）——失败语义明确。

---

## 7. 数据可观测性体现在哪

- **switch_signal_setup / 换网埋点**：在线/离线换网带分支维度（reuse_authed / result / ticket_fail），能看换网成功率和失败原因分布。
- **固件不满足埋点**：10501 错误可统计"多少用户因固件版本被挡"，反哺产品决策（是否强制升级引导）。
- （app-feature 线，可观测以埋点+日志为主，无独立后端 metric 体系——诚实标注。）

---

## 8. 如何用 AI 从 0→1 进行设计

- **设计文档先行**：`select_home_base_error_handling.md`（321 行，含三态改二态完整方案 + 25 行变更清单）、`switch_network_design.md`（v1.4，在线/离线双路径）——先写设计文档再实现。
- **[AI-Generated] 集群**：固件门控统一（Android `8d737ae9`/`d68a7e3f`、iOS `0ed1d0da`）、换网透传测试（`MR !1205 P0`）等都是 AI 辅助且带 tag。
- **CLAUDE.md 工作流 + 双端一致约束**：和 #3 同一套 g0-android 工作流。

---

## 9. AI 在设计过程中暴露的问题 + 防护机制

| AI 失败模式 | 真实体现 / 防护 |
|-------------|-----------------|
| **边界条件 off-by-one** | 固件门控 `> 1.0.0` 漏掉 1.0.0 正式版 → `>=` 修正 → 补旧/null 固件回退测试 |
| **状态机中间态遗漏** | select_home_base 三态的中间态导致列表提前展示 → 改二态 + `_markTaskCompleted` 协调 |
| **只校验一处（列表）漏绑定前** | 补绑定前 `checkParentFirmwareVersion` 第二道闸，防绕过/缓存过期 |
| **跨语言 BLE 字段漏传** | Core SDK `bxsn` 注入 BLE 握手包，三端固件门控逻辑统一 compareVersions |
| **换网失败无限重试** | 失败直接返回 select_wifi，不做重试引导，避免弱链路打爆 |

**学到的**：新硬件绑定这种"强时序 + 强固件依赖 + 在线离线双路径"的场景，AI 最容易在"并行任务协调（三态）"和"边界版本判断（off-by-one）"上出错。防护靠：把异步协调显式化（`_markTaskCompleted` + 二态）、版本判断收敛到单一门控 API + 边界测试、双重校验防绕过。

---

## 10. 收益与结果

- **新品 0→1 能上架**：HB1 Hub 没这套绑定链路就卖不出去，我把它端到端打通。
- **建立新协议绑定范式**：固件门控 + 在线离线双路径 + 双重版本校验，可复用到后续新硬件。
- **三端 + Core SDK 锁步**：Core SDK 出接口、三端按门控路由，新旧固件平滑共存。
- **体验优化**：三态改二态消除"看到不可用设备"、取版本不断蓝牙减少重连。

---

## 11. 面试 Q&A（面试官视角）

**Q1：固件版本你为什么要校验两次（列表过滤 + 绑定前）？一次不够吗？**
> A：两次职责不同。列表过滤是 UX——不让用户点不可用的 Hub;绑定前校验是 correctness——防两种情况:(1) 用户可能绕过列表(深链/缓存);(2) 列表预取的 minBxVersion 缓存可能过期。绑定前在 setPairing 之前再校验一次,优先读 BxVersionPreFetcher 缓存(select_home_base 已预取就不重复 BLE query),miss 才主动 fetch。关键是要在"进入配对中状态之前"失败——否则用户看到转圈半天才告诉他固件不行,体验很差。
> **追问:两次校验数据源一致吗,会不会前面过了后面没过?** 同源(都是 firmwareId vs minBxVersion),且绑定前优先复用列表的预取缓存,所以一致;但绑定前多一层"缓存 miss 主动 fetch"兜底,保证即使列表没预取到也能校验。

**Q2:在线和离线两条换网路径,为什么不统一成一条?**
> A:因为底层链路根本不同。设备在线意味着它连着云,可以走 WebSocket 信令(trigger_connect_wifi)让它换网;设备离线只能靠 BLE 近场(scanWifiList + startBind)。这是物理约束,没法统一——在线设备走 BLE 反而绕远,离线设备没法走 WebSocket。我按 device.online 字段分流,两条路径各自独立。失败处理我故意做得简单:直接返回 select_wifi,不做重试引导——因为换网本身在弱网场景,自动重试容易把用户卡在中间态,不如让他重新选。

**Q3:select_home_base 你把三态改成二态,具体解决什么问题?**
> A:页面加载时有两个并行异步任务——BLE 取 minBxVersion + 取设备 firmwareId。三态设计下,一个任务先完成就可能触发列表展示,用户看到"还没校验完固件可用性"的设备列表,可能点到实际不可用的 Hub。我改成二态:用 `_markTaskCompleted(taskName, failed)` 协调,**两个任务都完成**才决定展示列表还是错误页。这是个典型的"并行任务协调"问题,异步状态机要显式管理完成条件,而不是谁先回来谁触发 UI。
> **追问:那如果一个任务一直不回来,会不会永远卡 loading?** 两个任务都有超时和错误兜底,BLE 失败 errorCode != null 会进错误页 + Retry,不会无限 loading。

**Q4:这个工作和 #3(解绑保留配对)都涉及 HB1 和固件门控,它们是一个工作吗?**
> A:不是,是 HB1 这条硬件线上的两个不同特性,只是共享同一个固件门控基础设施(supportsNewFirmwareFeatures >= 1.0.0)。#4 是**新品上架的绑定链路**(相机绑定到 Hub:固件校验、换网、蓝牙、设备卡片),时间上更早(2025-12~2026-04, VH 4.0.0),是"让 HB1 能卖"。#3 是**解绑保留配对**(从 Hub 移除相机但保留配对:RemoveHubDeviceActivity、deactivatedevice retainPairing),更晚(2026-05, VH 4.2.0),是"让 HB1 体验更好"。两者都是我做的,共用固件门控,但功能正交。

---

## 12. 其他方案考量与权衡

| 决策点 | 我选的 | 备选 | 为什么 |
|--------|--------|------|--------|
| 固件校验时机 | 列表过滤 + 绑定前双重 | 只列表 / 只绑定前 | 列表管 UX、绑定前管 correctness,防绕过+缓存过期 |
| 列表加载态 | 二态(两任务都完成) | 三态(中间态) | 中间态会展示未校验完的设备,误导用户 |
| 换网路径 | online/offline 双路径 | 统一一条 | 物理约束:在线 WebSocket、离线 BLE,无法统一 |
| 换网失败 | 直接返回 select_wifi | 自动重试引导 | 弱网场景自动重试易卡中间态 |
| 固件门控 | 单一 supportsNewFirmwareFeatures | 各处散落判断 | 收敛一处,新旧 UI 路由统一 |
| 版本获取 | 不断蓝牙 + 预取缓存 | 每次重新 BLE query | 减少重连开销,缓存复用 |

---

## 13. 方案改进 / 演进方向

**已知局限**
1. **固件门控 off-by-one**（`>` vs `>=`）说明版本边界要测试前置。
2. **可观测较轻**：以埋点+日志为主，可补"因固件被挡的用户数""换网成功率"漏斗。
3. **单机绑定 Hub 多场景**散落在 switch_network_design + 几个 commit，缺独立设计文档收口。

**演进方向**
- 把"新协议设备绑定范式"（固件门控 + 在线离线双路径 + 双重校验）抽成可复用模板，下一个新硬件直接套。
- 固件不满足的引导升级做成闭环（10501 → 升级流程 → 重新绑定）。
- 与 Provisioning Kit 收敛：这套绑定逻辑最终应迁入 provisioning-kit 的 Hub flow（W3）统一管理。

---

*文档基于 g0-flutter-module/g0-ios/g0-android/smartdevicecoresdk-ios 四端真实 commit、设计文档(select_home_base_error_handling.md / switch_network_design.md)整理;接口名、错误码、分支名、commit subject 均为真实。注:与 #3 解绑保留配对共享 firmwareId>=1.0.0 固件门控但功能正交。*
