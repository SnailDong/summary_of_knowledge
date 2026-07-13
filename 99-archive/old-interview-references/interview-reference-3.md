# 面试回答参考手册（三）— 深度核实版

> 本册基于 2026-06 对各仓 **git 真实 commit / ADR / 代码** 的核实整理，是 ref-1 / ref-2 的**校准 + 深度补充**。
> 与按工作组织的 `work-summaries/` 配套；凡与 ref-1/ref-2 冲突处，以本册为准。
> 覆盖：勘误校准 / Warranty Plus 全栈深度 / Provisioning Kit 真实架构 / Homebase 新型号 / AI 失败模式防护 / 通用面试主线。

---

## 0. 勘误与校准（务必先看，避免面试踩雷）

> 下面这些 ref-1 / ref-2 里的表述经 git 核实**不准确或非本人主导**，面试不要再讲：

| 出处 | 旧表述 | 真实情况（git 核实） | 面试怎么讲 |
|------|--------|----------------------|------------|
| ref-1 §四 / ref-2 §三 | iOS `BindDeviceViewModel` 526 行 → Discovery/Transport/Business 三层重构、`BindResultPoller`、`checkPermissionOnce` | 全代码库 **0 匹配**这些类；该文件现 3395 行，那次结构优化是 **wjin** 做的；你在该仓仅 5 个 commit | **不要讲 iOS 三层重构**。iOS 真实工作讲 Homebase 绑定（见 §三） |
| ref-2 §一 | Provisioning **三层 api/core/ui**、`ProvisioningBackend` **26 个端点**、`ProvisioningL10n` | 实际 **2 包**（api+feature，三包经 ADR-12 砍掉）、thin client+**~12 端点**、ADR-19 已删 L10n | 讲 2 包六边形 + 三代演进（见 §二） |
| ref-2 §四 | Warranty 后端 **go-zero**、**Redis**、集成 **Kiwibit** 订单校验 | 实际 **net/http + Ports&Adapters**；依赖只有 MySQL+Snowplow+GrowthBook（**无 Redis**）；订单校验是 OrderValidator 7 渠道正则 | 讲 net/http 分层 + OrderValidator（见 §一） |
| ref-2 §五 | g0-android **18 个 skill 我做的**、golden-data-tdd | git 显示 g0-android skills **非你提交**；golden-data-tdd 是 **jchen** 写的、你是**使用者** | 讲"我设计 CLAUDE.md + 自研 quality_gate + ADR"（你真正自有），skill 讲"使用" |
| ref-1 §五 | HB1 解绑保留配对：`has_pairing` BLE bit / `clear_pairing` cloud 参数 / 配对存 device | 实际落地是 `deactivatedevice` API 新增 **`retainPairing` / `cleanStorage`** 参数 + `RemoveHubDeviceActivity` + 固件门控 | 以本册 §三的真实实现为准 |
| ref-2 §四 | L2 集成测试"真实 MySQL + **Redis**" | 无 Redis；L2 是 testcontainers MySQL + 契约往返 | 见 §一测试体系 |

> ⚠️ 一句话原则：**写进/讲出的每条都要能落到 commit + author。** golden-data-tdd / release-engine / add-language 等是团队 skill（你是使用者）；superpowers 流程 skill 是官方插件（你是实践者）；你真正**主导/自有**的是各项目的架构、ADR、CLAUDE.md、自研 quality_gate。

---

## 一、Warranty Plus — 售后保修全栈（最强主线，重点准备）

### 30 秒背景
> "Customer Care 仓里从 0→1 独立做的一条售后业务线。原本没有任何系统能把'用户在 Amazon 的订单'和'App 账号、设备'关联起来，运营无法做延保发放、审核、分析。我一个人做了全栈——Go 后端、跨三 App 复用的 Flutter SDK、Next.js 审核后台、可观测与数据链路，并用 52 个 ADR + 自研质量门控把整条演进沉淀为可追溯资产。8 周约 525 个提交。"

### 核心技术点（讲深用）

**① 后端：net/http + Ports & Adapters（不是 go-zero）**
- 标准库 `net/http` + `http.ServeMux`，handler → logic(service) → adapter(MySQLWarrantyRepo) 三层。
- 为什么不用团队的 go-zero：单服务、少端点、外部依赖薄（只有 MySQL+Snowplow+GrowthBook），go-zero 的 codegen+服务治理是过度引入；标准库依赖图最小、adapter 是唯一 IO 边界、logic 层纯函数易测。
- 鉴权在 API Gateway（JWT），后端只读 `X-User-ID`；admin 走 HMAC-SHA256 中间件。

**② SDK：Split API 二包 + 六边形**
- `warranty_plus_api`（接口+值对象，**零外部运行时依赖**）+ `warranty_plus_feature`（实现）。
- 三类消费方：宿主 App（要 UI）、Lattice 只读模块（只查 `hasRedDot()`）、测试工具——只读方只拉 api 包，不被 Flutter UI / SharedPreferences / Snowplow 依赖图传染。
- UI 不依赖 a4x_ui_kit（Material 默认 + Builder 注入）、状态不用 GetX（原生 StatefulWidget）——保证跨 KiwiBit/VicoHome/VicoNature 三 App 零框架绑定。

**③ 数据库：4 表 → 2 表（ADR-W26）**
- product/incentive 表因前序 ADR（文案回宿主、owner 归宿主、设备列表宿主 push）退化为死表 → 合并为 `warranty_registration` + `warranty_channel`。
- `registered_at` 一字段三语义（NULL=baseline / NOW()=用户延期）、`WHERE expires_at<NOW()` 运行时算过期省 cron。
- 收益：表 4→2、Go 代码减 ~800 行、`/products` 响应减 ~62%。

**④ 信任边界下沉（ADR-W23/W25）+ lazy-create（ADR-W27）**
- 删掉登记时回查 iot-service 的 owner 校验 → 统一收敛到 Gateway JWT + 宿主 pre-filter，删除整条跨服务依赖、p95 降一个 RTT。
- baseline 写入移进 `/products` 读路径（lazy-create，靠 `uk_sn` 幂等）——对齐"SDK 不主动唤起、用户进 UI 才查"的产品意图。

**⑤ SDK 健康性 + 兜底（高频考点）**
- 健康性：测试金字塔 L1-app(~45)/L1-backend(~18)/**L2 契约往返(真实 Go JSON 验 Dart 解析，抓 wire 字段漂移)**/L2-backend(testcontainers MySQL)/L3-L4(跨仓真机)；10 条自研 Quality Gate（CI 与 pre-commit 同入口）。
- 兜底哲学 **fail-soft 给用户、fail-loud 给 oncall**：config 四态降级（cached/updated/disabled熔断/error）、`channels=null` 回落预定义渠道、A/B 异常降到 control、每次降级打 metric+Sentry。

**⑥ 可观测四链路 + 交叉校验**
- ①-A 行为埋点(Snowplow→数仓→Superset) / ①-B 后端事实(RDS→dbt→Superset) / ②Sentry / ③Prometheus→Grafana。
- 王牌讲法：①-A 的 `warranty_skipped` 事件数 ≈ ①-B 的 `channel_id='skip'` 行数，**显著漂移=某条链路有 bug**，用双链路互证代替单一数据源自说自话。

### 高频 Q&A（含追问）

**Q：后端为什么用 net/http 不用 go-zero？**
> 单服务、少端点、Ports&Adapters 分层清晰，go-zero 的 codegen+治理过度；标准库依赖图最小、最易测。限流/鉴权在 Gateway 和 HMAC 中间件，没到引 Redis 限流的量级（YAGNI）。

**Q：4 表合并成 2 表，怎么证明不是砍功能图省事？**
> 前提是 product/incentive 已因三个 ADR 退化成死代码（元数据迁宿主 bundle、文案宿主注入、cancel 从未上线）。ADR-W26 写明 trade-off：取"未来需要时重立 ADR"换"当前高内聚低维护"。差异化保修时长真来了大概率加一个扩展列，不必重建表。

**Q：`/products` 读接口里写库（lazy-create），不违反幂等吗？**
> 幂等——靠 `uk_sn` 唯一键，行已存在 no-op，多次调用结果一致。考虑过"宿主 bind 时显式写 baseline"和"新增 /onboard 端点"，都把责任压宿主、要求宿主知道 bind 时机；折进读路径正好对齐"用户进 UI 才查"的产品意图，宿主零新职责。

**Q：SDK 嵌在别人 App 里，你后端挂了用户看到什么？**
> 永远能用预定义渠道完成登记，不白屏不崩。config 四态降级，error 态走 WarrantyDefaults 回落预定义渠道；A/B 异常降 control；每次降级有 metric+Sentry——用户无感、我有数。还有 `{status:disabled}` 紧急熔断。

**Q：你大量用 AI 写，凭什么信不是屎山？** → 见 §四。

### 现存不足与改进
1. lazy-create 读写混合虽幂等但对新人有认知成本，HTTP 缓存语义需文档说明。
2. admin 展示用的 denormalized 列（email/device_name/sku 快照）不随宿主元数据回写，v1 接受 staleness。
3. 单 tenant 假设（`uk_sn` 不含 tenant_id），第二 tenant 上线前需走强制 gate。
4. dashboard metric-existence gate 曾加又 revert（底层命名未统一时 gate 比 metric 更脆弱）——诚实的失败案例。

---

## 二、Provisioning Kit — 配网 SDK 真实架构版

### 30 秒背景
> "把散在 g0-flutter 主工程里的设备配网/绑定能力，从 0→1 抽成独立 Flutter SDK。六边形架构、跨宿主复用。53 天里它的 native 底层经历了 v1 自研 channel → v2 Dart FFI → v3 native AAR + session API 三代演进，22 个 ADR 全程留痕、分阶段迁移而非推翻重写。"

### 核心技术点
- **六边形 + Split API（2 包，不是三包）**：`flutter_provisioning_api`（72 文件，零依赖）+ `flutter_provisioning_feature`（306 文件，Service/Adapter/UI/Android Plugin 一体）。早期 api/core/ui 三包经 **ADR-12** 砍为二包（YAGNI，对单业务域过度切分）。
- **5 个必填宿主 Port**（HttpClient/HostBridge/Tracker/FeatureFlag/Theme）+ 1 可选 ErrorReporter。网络用 **thin transport port**（post/get/download），SDK 内部 BackendFacade 管 ~12 端点。
- **三代 native 演进**：v1 自研 BindChannel → v2 provisioning_core FFI（13 阶段事件 + 5 桶 BindStep）→ v3 native AAR（GitLab Maven）+ session API（createSession→prepare→fetchWifiList→commitBind）。**上层 Port 契约不变、底层换三次**——六边形价值的最佳证明。
- **Fake 测试装配**：FakeSessionPort/FakeClock 让强硬件依赖的配网在**无真机 CI** 跑 L1-L3 端到端；FakeClock advance 181s 即可测 180s hard cap。
- **错误码三命名空间**：`pk_*`（SDK内部）/`core_*`（AAR透传）/`backend_*`（HTTP），前缀自动校验，防撞号。

### 高频 Q&A
**Q：53 天换三套 native 方案，不是反复横跳浪费吗？**
> 每次 pivot 有触发因素、ADR supersede + 分阶段迁移控成本。关键：上层 api 契约（Port+session model）在 v2→v3 基本稳定，变的是 adapter 实现——这正是六边形的价值。v2 的 13 阶段事件、5 桶映射、180s hard cap、错误命名空间在 v3 全保留，白写的只是 native 桥接那一薄层（本就是预期可替换的 adapter）。

**Q：配网强依赖 BLE/WiFi/硬件，怎么做 CI 测试？**
> Fake 测试装配。FakeSessionPort 模拟 native 会话、FakeClock 控超时，example app 用 Fake 装配跑 L3 端到端，CI 完全不需要真设备/真 AAR。真机只放 L4 smoke 验"AAR 兼容+HAL 集成"这一薄层。

**Q：api 包零依赖怎么强制？** 靠 CLAUDE.md Ports&Adapters 硬约束 + CI lint；api 是所有消费方唯一依赖面，每多一个依赖传染整个图。

### 诚实补充（面试可主动讲）
> provisioning-kit 的 176 个 commit **没用 [AI-Generated] tag**（warranty 那条线才推了 tag 公约）。这里我更靠"架构先行（Phase 0 文档先于代码）+ Fake 装配 + 分阶段门禁"前置约束 AI——两种打法，前者偏可追溯、后者偏前置防护。

### 现存不足
1. Lattice 集成（Phase R7）依赖对方团队决策，deferred。
2. HAL 接口归属过渡态（ADR-22）：宿主直接 implements AAR 的 HAL，赌 AAR 接口稳定。
3. 无 [AI-Generated] tag，可追溯弱于 warranty。

---

## 三、Homebase 新型号功能及页面开发（iOS 真实工作在这里）

### 30 秒背景
> "Homebase（HB1）是新中枢硬件，绑定模型从'扫码直绑相机'变成'相机绑定到 Hub'的 1-to-N 拓扑，需要全新的功能和页面。我负责这条新品绑定链路在 Flutter / Android / iOS / iOS Core SDK 四端的端到端实现，并跨 4 仓锁步演进。"

### 核心技术点
- **相机绑 Hub 链路**：Core SDK `startBindToBxOverA4XBLE`（BLE 握手包填 `bxsn`=Hub 序列号），三端 UI 各自实现 + 固件门控路由。
- **固件版本门控**：`supportsNewFirmwareFeatures()`（`firmwareId >= 1.0.0`，语义版本比较 + 剥离 `-d` 后缀）决定走 Flutter 新流程还是原生旧流程——新协议旧固件不识别、强行下发会让设备挂起。
- **双重固件校验**：select_home_base 列表过滤（UX，不让点）+ add_pre_bind_camera 绑定前校验（correctness，防绕过/缓存过期，错误码 10501 固件升级提示）。
- **在线/离线双路径换网**：`device.online` 在线走 WebSocket（trigger_connect_wifi）、离线走 BLE（scanWifiList+startBind）；失败直接返回 select_wifi 不做重试引导。
- **三态改二态**：select_home_base 两个并行异步任务（BLE 取 minBxVersion + 取 firmwareId），用 `_markTaskCompleted` 协调，**两个都完成才展示**，消除"看到未校验完的设备"。
- **HB1 解绑保留配对**（同硬件线后期特性）：`deactivatedevice` API 新增 `retainPairing` / `cleanStorage`（nil 省略=向后兼容）；`RemoveHubDeviceActivity` 两 checkbox → API 参数 4 组真值表测试；`DeviceHelper` 三路分支路由。

### 高频 Q&A
**Q：固件为什么校验两次？**
> 列表过滤管 UX（不让点不可用 Hub），绑定前校验管 correctness（防绕过、防预取缓存过期）。关键是"进入配对中状态之前"失败，否则用户转圈半天才被告知固件不行。

**Q：在线/离线为什么不统一一条换网路径？**
> 物理约束：在线设备连着云可走 WebSocket 信令，离线设备只能靠 BLE 近场。统一反而绕远。失败故意做简单（直接返回 select_wifi），因为弱网场景自动重试容易卡中间态。

**Q：select_home_base 三态改二态解决什么？**
> 两个并行异步任务，三态下谁先回来谁触发 UI，用户会看到"还没校验完固件可用性"的设备。改成"两个都完成才决定展示列表还是错误页"——并行任务协调要显式管理完成条件。

**Q：firmwareId 门控为什么从 `>1.0.0` 改成 `>=1.0.0`？**
> off-by-one——`>` 把 1.0.0 正式版自己排除了，只有 1.0.1+ 能用新流程。发现后专门一个 commit 改 `>=`，并补了旧/null 固件回退测试。说明边界条件要前置测试。

### 现存不足
1. iOS 文案当前硬编码 pending Crowdin。
2. 可观测较轻（埋点+日志为主），可补"因固件被挡用户数""换网成功率"漏斗。
3. 固件门控曾 off-by-one。

---

## 四、AI 工程化深化：AI 失败模式与防护（差异化王牌）

> ref-2 §五讲了 CLAUDE.md + skill 体系，本节补**最有杀伤力的角度**：AI 真实暴露的失败模式 + 我怎么用机器门控挡住。面试主动讲这个比堆"显著提升"可信 10 倍。

### 核心理念（一句话）
> 我把"AI 有没有按设计做"从主观判断变成**机器可对照**——设计先写下来（Spec/ADR），再用追溯矩阵 + Doc-Drift Gate + Quality Gate 让漏的、改一半的、漂移的当场暴露。

### AI 的 6 类真实失败模式（都有 commit 证据）
| 失败模式 | 真实证据 |
|----------|----------|
| 只做一半 / happy-path only | MR 439 P0:"W38/W39/W40 仅有 L1 单测，未形成 E2E 闭环" |
| 漏实现需求/测试 | `add 6 missing EP7 Playwright scenarios`、`verify.sh missing admin-ops` |
| 文档代码漂移 | MR !465 **round-4/5 全是 doc-drift fixes**（warranty 单 MR 走到 5 轮 review） |
| 偷懒/吞错误 | `silent error logging`（AI catch 了错误不上报）|
| 猜字段名/编 mock | 立 CLAUDE.md 纪律 + L2 契约往返治理 |
| 超范围/留垃圾 | `revert: drop onboarding from scope`、`remove stale fake tombstone` |

> 锚点数据：warranty 一个模块 code-review 走到 **round 7**（full-module audit）；跨 5 仓 **203 个 [AI-Generated] commit** 可审计归因。

### 对应防护（一类问题一道防线）
1. **设计先写下来**（Spec/ADR）→ 有没有实现可对照 artifact。
2. **需求追溯矩阵**（US ↔ test ID ↔ ADR）→ 一个 US 没有 test ID = 没实现，一眼可见。
3. **Doc-Drift Gate 双向**（"文档有代码没有⇒允许；代码有文档没有⇒不通过 undocumented"）。
4. **Quality Gate 硬卡**：rule 6 每个 class 必有测试、rule 9 覆盖率、**rule 10 example 编译门控**（AI 删 API 忘更新调用面 → example 编译失败 → CI 红，专治"改一半"）。
5. **TDD Iron Law + pre-commit history 检查**（没先红测试的实现 commit 直接拒）。
6. **L2 契约往返 + golden-data**（真实数据 fixture，AI 没法编字段名）。
7. **多轮 review P0/P1/P2 + full-module audit**（机器抓不到的语义偏差靠人兜底）。

### 高频 Q&A
**Q：你大量用 AI，凭什么信不是 AI 幻觉拼的屎山？**
> 不靠相信，靠机器门控+可追溯。AI 和人受完全相同的 10 条 Quality Gate（CI+pre-commit 同入口）；Spec→Plan→Phase 门控把任务切成可验证小步；203 个 commit 带 [AI-Generated] 复盘可归因。我把 AI 当"在边界内自主推进的执行者"，边界是我用 CLAUDE.md + Quality Gate + ADR 定义的。

**Q（追问）：AI 写的测试会不会也是假的？**
> 这正是用 golden-data-tdd（团队 skill）的原因——fixture 从 staging 真实 Snowplow 事件提取，不是手写 mock；同一份真实 fixture 跨层复用，AI 没法"为过测试编字段名"。再加 L2 契约往返用真实 Go JSON 验 Dart 解析，wire 漂移当场暴露。

**Q：AI 最容易在哪偷懒？**
> "做得像"而不是"做得全"——happy path + 单测写得漂亮，但跳过 E2E、边界、错误上报这些"看不见但关键"的部分。所以门控必须卡"完整性"而非"能跑"：机器门控管硬完整性（测试/文档/编译），人 review 管软完整性（设计意图走样）。

### 诚实归属（必背）
- **我自有**：各项目 CLAUDE.md（架构约束）、自研 quality_gate（10 条规则）、52/22 个 ADR、[AI-Generated] tag 公约。
- **我使用**：golden-data-tdd（jchen 写）、release-engine（zchen1 写）、add-language/mr-sonar（团队）。
- **我实践**：superpowers 官方流程 skill（brainstorming→writing-plans→executing-plans / TDD / code-review）。
- 讲法："我设计了让 AI 在边界内自主推进的**工艺体系**"，而不是"我写了这些 skill"。

---

## 五、跨工作通用面试主线 & 高频追问

**5 条贯穿全部工作的主线（任意项目都能往这引）**
1. **六边形 + Split API**：warranty（api/feature）、provisioning-kit（api/feature+5 Port）——SDK 跨宿主复用、零依赖传染。
2. **ADR 驱动 + 分阶段迁移**：warranty 52 / provisioning-kit 22 ADR——决策可追溯、迁移不 big-bang。
3. **AI 工艺化**：从"赌运气出代码"到"按工艺出产品"（§四）。
4. **fail-soft 给用户 / fail-loud 给 oncall**：四个工作的兜底哲学一致。
5. **跨端/跨仓锁步治理**：Homebase 跨 4 仓同分支同日 merge + 双端一致 commit 约束。

**通用追问准备**
- *最大技术挑战？* → Warranty 全栈 0→1（问题→ADR决策→量化收益链路完整）或 Provisioning 三代演进（六边形抗住 native 三换）。
- *主导的架构设计？* → Warranty Split API + 信任边界下沉，或 provisioning 六边形。
- *怎么保证质量？* → 自研 Quality Gate（CI+pre-commit 同入口）+ ADR + L1-L4 + 多轮分级 review + Doc-Drift Gate。
- *做过性能/可靠性优化？* → 4 表→2 表（代码 -800 行、响应 -62%）、180s hard cap + Fake、config 热替换弱网降级、固件门控防设备挂起。
- *踩过的坑/失败案例？* → metric-existence gate 加了又 revert；固件门控 off-by-one；GetX 替换延后决策（有意分两步好归因）。

---

*最后更新：2026-06-16 ｜ 基于 git 真实核实，与 work-summaries/ 配套*
