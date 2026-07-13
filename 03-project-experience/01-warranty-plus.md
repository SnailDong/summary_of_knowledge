# Warranty Plus 售后保修全栈体系

> 工作类型：从 0→1 独立负责的全栈业务系统（Go 后端 + Flutter SDK + Admin 后台 + 可观测/数据 + AI 工程化）
> 仓库：`customer-care`（+ `dbt` 1 个 view）
> 我的提交：customer-care 540 commits（其中 warranty scope ~525），时间跨度 2026-04-17 → 2026-06-10（约 8 周）
> 我的角色：架构负责人 + 唯一全栈实现者；产出 52 个 ADR（W01–W52）、10 条自研 Quality Gate 规则

---

## 0. 一句话定位

> 我独立设计并实现了 Warranty Plus（延保/售后保修）整条业务线——从 Go 后端（net/http + Ports & Adapters，warranty_registration/warranty_channel 两表模型 + 18 个 admin HMAC 端点）、跨三 App 复用的 Flutter Split-API SDK（`warranty_plus_api` 零依赖接口包 + `warranty_plus_feature` 实现包，六边形架构 + 宿主注入）、Next.js 15 + Prisma 的运营审核后台，到 Prometheus/Grafana/Superset/Snowplow 的可观测与数据闭环——并用 52 个 ADR + 10 条自研 CI 质量门控把整套演进沉淀为可追溯、可审计的工程资产。

**业务价值一句话**：让运营第一次拥有「Amazon 订单号 ↔ App 账号 ↔ 设备 SN」的关联与审核能力，打通"绑定设备→免费 24 月 baseline→用户登记延保 +12 月→运营审核→数仓分析"的售后挽回闭环；同一套 SDK 被 KiwiBit / VicoHome / VicoNature 三个 App 复用。

---

## 1. 背景与目标

**业务背景**：公司硬件（摄像头、Hub）卖出后，售后/延保是用户挽回与复购的关键触点。原本没有任何系统能把"用户在 Amazon 下的订单"与"App 里的账号和设备"关联起来，运营无法做延保发放、无法审核、无法分析转化。需要从零搭一套：用户能在 App 内登记延保、运营能在后台审核、数据能进数仓做漏斗分析。

**为什么是"全栈一个人做"**：这是一条新业务线，没有历史包袱，但要求跨 Go 后端、Flutter 客户端、运营后台、K8s 部署、数据埋点全链路。我作为这块的 Owner，独立完成全部层次。

**核心约束**：
1. **SDK 必须跨 3 个 App 复用**（KB/VH/F），三个 App 用不同的 UI 库、不同的状态管理（有的用 GetX）、不同的 A/B 平台——SDK 不能绑定任何一家。
2. **后端是全新服务**，与既有 iot-service 解耦，独立部署、独立 schema、独立可观测。
3. **生产数据敏感**（用户 email、订单号），admin 后台要做 PII 脱敏与角色化权限。
4. **AI 驱动研发**：整个项目用 AI 辅助开发，必须有硬质量门控保证 AI 产出的代码质量与人一致。

**量化目标（NFR）**：绑定后登记率 ≥ 40%、表单完成率 ≥ 60%、`/warranty/*` p95 < 2s、后端单测覆盖率门槛、api 包 100% 测试文件覆盖。

---

## 2. 我实现了什么（Scope）

按层拆，每层都是我独立交付：

| 层 | 交付物 | 关键证据 |
|----|--------|----------|
| **Go 后端** | `net/http` + Ports&Adapters；2C 公开端点（checkDeviceEligibility / submitOrder / queryOrderChannels）+ 18 个 admin HMAC 端点；MySQLWarrantyRepo 仓储层 | `internal/warranty/{handler,logic,svc,adapter}/`；scaffold→Phase1-5 commit |
| **数据库** | 7 个 warranty migration（012–018）；4 表→2 表合并（W26）；drop source（W27）；review 工作流加列（W29-W30） | `migrations/015_warranty_consolidate.sql` 等 |
| **Flutter SDK** | Split API 二包：`warranty_plus_api`（零依赖接口）+ `warranty_plus_feature`（实现）；六边形架构 + 8 类宿主 Port；UI 全 Material 默认实现 + Builder 注入 | `app/warranty_plus/packages/` |
| **Admin 后台** | Next.js 15 + Prisma 6 + Tailwind/shadcn；审核列表/详情/批量匹配/渠道 CRUD；HMAC 代理 + 角色 gate + PII mask/resolve | `admin/src/app/admin/warranty/` |
| **可观测** | 6 个 2C 指标 + 12 个 admin 指标 + 5 条 PrometheusRule 告警；dual-SSOT 坍塌；Grafana dashboard sync 脚本 | `internal/warranty/handler/metrics.go`、`k8s/api/base/prometheusrule.yaml` |
| **数据** | 13 个 Snowplow 事件 schema（含 SDK session lifecycle）；Superset prod 禁用 email 列；dbt `vw_warranty_events` view | `e2e/snowplow-schemas/warranty/`、`dbt` 仓 |
| **部署** | 跨 AWS account 内网 ALB（admin 在 002 账号、api 在 302 账号）；IRSA 身份隔离；Harbor path 隔离 | `docs/plans/2026-05-14-api-internal-alb-prod-us.md` |
| **AI 工程化** | 10 条自研 Quality Gate 规则（check.dart）；CI 与 pre-commit 同一入口；52 个 ADR；多轮 review SOP（MR !465 走了 5 轮） | `app/warranty_plus/tools/quality_gate/bin/check.dart` |

---

## 3. 方案设计（怎么做的）

### 3.1 整体架构

```
┌─────────────── 三个宿主 App (KB / VH / VicoNature) ───────────────┐
│   只依赖 warranty_plus_api（零运行时依赖的接口包）                  │
│   注入 8 个 Port: Network / Tracker / ErrorReporter / Experiment   │
│                   / HostContext / Navigator / Theme / Storage      │
└───────────────────────────┬───────────────────────────────────────┘
                            │ MethodChannel / Dart 直接依赖
┌───────────────────────────▼───────────────────────────────────────┐
│  warranty_plus_feature  (六边形核心: WarrantyManagerImpl)          │
│  UI Pages(Material默认) · ConfigRepository(cache-first) · Tracker  │
└───────────────────────────┬───────────────────────────────────────┘
                            │ HTTP (WarrantyNetworkProvider transport port)
┌───────────────────────────▼───────────────────────────────────────┐
│  Go 后端 (net/http, Ports&Adapters)                                │
│  handler → logic(service) → adapter(MySQLWarrantyRepo)            │
│  2 张表: warranty_registration + warranty_channel                 │
└──────┬───────────────────────────────┬────────────────────────────┘
      │                               │
┌─────▼──────┐              ┌──────────▼─────────┐    ┌──────────────┐
│ Admin 后台 │              │ Prometheus/Grafana │    │ Snowplow→数仓 │
│ Next.js+HMAC│             │ 6+12 指标/5 告警   │    │ →dbt→Superset │
└────────────┘              └────────────────────┘    └──────────────┘
```

### 3.2 关键架构决策（ADR 摘录）

我用 **ADR（Architecture Decision Record）** 驱动每一个决策，每个 ADR 都是 `Context / Options / Trade-off / Decision / Consequences` 五段式，编号严格递增（W01→W52），可逆、可追溯、可被 review 时翻账。下面挑最能体现设计思路的几个：

**① 后端与 SDK 的信任边界下沉（ADR-W23 + W25）**
- 原方案：后端在登记时对每个 SN 回查 iot-service `GET /devices/{sn}/owner` 做 owner 校验。
- 问题：双层校验冗余（SDK 已过滤）、信任模型不一致（其他端点都直接信任 `X-User-ID`）、跨服务硬耦合（6 个区域各维护一份 iot-service configmap）、每 SN ~500ms 延迟、本地/CI 要 mock iot-service。
- 决策：**信任边界统一收敛到 API Gateway 签发的 JWT → `X-User-ID`**；owner 过滤由宿主在调 SDK 入口前 pre-filter（W25 进一步把 SDK 内的 `WarrantyDeviceProvider` pull port 整个删除，改成"宿主 push 一份已过滤的 SN 列表作为入口 widget 必填参数"）。残留的"伪造 SN"风险用 Gateway JWT 不可伪造 + `uk_sn` 唯一约束 + 异常登记告警三层兜底。
- 收益：删掉 `IOT_SERVICE_BASE_URL` 整条依赖链，p95 降一个 RTT，CI/本地不再 mock，新 region 上线零协调。

**② 数据库 4 表→2 表（ADR-W26）**
- 随着 W22（文案回宿主）/W23（owner 归宿主）/W25（设备列表宿主 push）三连决策落地，`warranty_product`、`warranty_incentive` 退化成死表，admin cancel 能力从未真用。
- 决策：合并为 `warranty_registration`（实体 + lifecycle）+ `warranty_channel`（低频配置）两表。关键设计：`registered_at NULL=baseline / NOW()=用户延期`，用 `WHERE expires_at < NOW()` 动态算 expired（省一个 cron 扫描任务），`status` 字段删除改运行时计算。
- 收益：表 4→2、Go 代码减 ~800 行、model 减 3 个、`/products` 响应从 ~400B/设备 降到 ~150B、少一个运维 cron + 告警。

**③ lazy-create baseline（ADR-W27）**
- 原 5-branch dispatcher 依赖 `source=bind_flow` 让 iot-service 调后端写 baseline——但这个调用从未真正接通，导致所有设备卡在 `DEVICE_NOT_BOUND`。
- 决策：把 baseline 写入移进 `/warranty/products` 的**读路径**（lazy-create，幂等：`uk_sn` 已存在则 no-op）。`/order` 写路径简化为 3-branch。`source` 字段从 DB 删除，归因改走 Snowplow 埋点 SSOT。
- 这是一个"读端有副作用"的非常规设计，但因为幂等 + 语义清晰（DB 行=该 SN 已被 warranty 识别）而成立。

**④ SDK Split API + 六边形（ADR-W14）**
- 三类消费方：宿主 App（要实现+UI）、Lattice 内只读模块（只查 `hasRedDot()`）、测试工具（只要契约）。
- 决策：切成 `warranty_plus_api`（接口+值对象，零依赖）+ `warranty_plus_feature`（实现）。只读消费方只拉 api 包，不会被 Flutter UI / SharedPreferences / Snowplow 依赖图传染。
- 配套 W01/W02：UI 不依赖 a4x_ui_kit（用 Material 默认 + Builder 注入）、状态不依赖 GetX（用原生 StatefulWidget）——保证跨 3 App 复用时零框架绑定。

**⑤ Transport Port + cache-first config（ADR-W16 + W18）**
- W16：把 `WarrantyApi`（domain port，宿主要实现 3 个强类型方法 + 认识 10+ 模型）改成 `WarrantyNetworkProvider`（transport port，宿主只实现 post/get/download 3 个 HTTP 透传方法）。宿主接入成本骤降，SDK 拿回 HTTP 生命周期掌控权。用双 port 共存 + `@Deprecated` 渐进迁移，不做一刀切 breaking change。
- W18：基于 transport port 实现 `ConfigRepository` cache-first + 后台刷新 + `config_version`（SHA1 fingerprint）diff 触发热替换。form 页用户正在输入时不热替换（pending config 机制），等页面销毁再应用。

**⑥ Admin 审核工作流（ADR-W29–W35）**
- pending→approved→rejected 状态机；`first_source` 首次入口永久保留（重提不更新）；approved 终态；skip baseline 行不可被人工审核（skip-row guard）；硬删除（物理 DELETE，无 audit_log 重型架构）；review mode 用环境变量切换（auto_approve / manual / auto_validate）；批量审核按 (channel_id, order_no)；渠道 CRUD + tenant 删除安全索引。

### 3.3 AI 工程化层（这套系统的"元设计"）

整个项目用 AI 辅助开发，我设计了**双层约束**保证质量：
- **CLAUDE.md（架构约束）**：定义 5 条依赖规则 + 5 条质量规则不可逾越。
- **自研 Quality Gate（10 条规则）**：`tools/quality_gate/bin/check.dart` 单一入口，CI 与 pre-commit 共用——**本地通过 == CI 通过**，杜绝"本地过 CI 挂"或绕过 hook：

  | # | 规则 | 作用 |
  |---|------|------|
  | 1 | api-package-purity | api 包的 class 必须带 abstract/sealed/final 等修饰符 |
  | 2 | api-package-zero-dep | api 包运行时依赖只允许 flutter + meta + collection |
  | 3 | single-direction | api 包不得 import feature 包（防反向依赖）|
  | 4 | no-dart-io-in-feature | feature 包 lib/src 禁 dart:io（仅 adapter/ 例外）|
  | 5 | no-external-ui-state | 禁 GetX/provider/riverpod/bloc/a4x_ui_kit |
  | 6 | test-file-exists | 每个含 class 的源文件必须有同路径 _test.dart |
  | 7 | required-docs | feature 包必须有 README/CHANGELOG/CLAUDE/USER_STORY/E2E_TEST_PLAN |
  | 8 | secret-detection | 禁硬编码 AWS key/PAT/JWT/PEM 等 |
  | 9 | coverage-threshold | 行覆盖率 ≥ 80%（adapter/ 排除）|
  | 10 | example-analyzes | example 工程 dart analyze 零 error（挡 API 删除后调用面漂移）|

- **多轮 Review SOP + Doc-Drift Gate**：单 MR 走 5 轮 review 是常态（MR !465 round-1→round-5），每轮 P0/P1/P2 分级；代码改了但 ADR/INTEGRATION_GUIDE/E2E_TEST_PLAN 没同步改，直接打回（doc-drift fixes 有专门的 round-4/round-5 commit）。

---

## 4. 关键技术点与实现细节

1. **`registered_at` 一字段三语义**：`NULL` = baseline 行、`NOW()` = 用户主动延期时间、配合 `expires_at < NOW()` 运行时算过期——一个字段同时承载"是否纯 baseline"O(1) 判断 + 到期判断，省掉 status 列和 cron 扫描。

2. **lazy-create 幂等性**：`/warranty/products` 读端写 baseline 靠 MySQL `uk_sn` 唯一键 + `INSERT IGNORE`/重读保证幂等；并发重复提交命中 `kind="same_tenant_already_extended"`（P3 噪声），跨 tenant 冲突命中 `kind="cross_tenant_uk_sn"`（P1 告警，是"SN 全局唯一假设破裂"的唯一信号源）。

3. **closed-enum 指标标签防爆炸**：所有 admin 指标的 label 都是闭枚举（`action ∈ {approve,reject}`、`handler ∈ {16 个端点名}`），绝不放 user_id/order_no/sn 进 label，避免 Prometheus cardinality 爆炸。

4. **config 热替换的 SHA1 fingerprint**：`config_version` 不依赖单调递增，后端用 `config_service.go::configVersionHash` 算 SHA1，SDK 只比 `newVersion != currentVersion`——支持运营 rollback（version 可回退）、不受后端实例时钟漂移影响。

5. **HMAC-SHA256 admin 网关**：Next.js admin 在 `[...path]/route.ts` 代理层做 HMAC 签名 + timestamp，转发给 Go 后端；角色 gate（cs/ops/admin）在 Next.js 层，Go 后端只校验 HMAC——职责清晰。

6. **跨账号内网 ALB**：admin（002 账号）与 api（302 账号）跨 AWS account 部署，靠 VPC peering + Route53 PHZ 跨账号链路 + internal scheme ALB + IRSA 身份隔离打通，pod IP direct target。

7. **SDK session 多入口遥测**：`warranty_sdk_session_started/ended/backgrounded/foregrounded` 用单一 universal session 模型覆盖 bind/home/detail 三类入口；`warranty_page_opened{page=skip_dialog}` 标签化埋点闭环具体图表。

---

## 5. 如何保证 SDK 的健康性（质量保障体系）

一套要被 3 个 App 复用的 SDK，"健康"不能靠人盯，必须靠**机器化的多层防线**。我搭了 4 道：

**① 测试金字塔（L1→L4，分层归属清晰）**

| 层 | 范围 | 用例量 | 依赖 | 频率 | 位置 |
|----|------|--------|------|------|------|
| **L1-app** | Manager 业务编排、OrderValidator 7 渠道正则、Model fromJson/toJson、Prefs 持久化、Widget 渲染、**降级行为** | ~45 | 全 mock | 每次 push <10s | `packages/*/test/` |
| **L1-backend** | OrderService 3-branch dispatcher 校验链（渠道/正则/唯一性/上限） | ~18 | Repo 全 mock | 每次 push <5s | `internal/warranty/*_test.go` |
| **L2-contract** | **JSON 契约往返**：Dart 对真实 Go JSON 做 `fromJson→toJson→结构等价`，专抓字段名/类型/枚举 wire 漂移 | C001~C015 | 真实 Go 响应 | 每次 MR | `e2e/warranty/tests/contract_*.dart` |
| **L2-backend** | API 端到端 + MySQL 持久化 + `uk_sn` 并发冲突（INSERT baseline 与 UPDATE extension 原子性） | ~14 | MySQL testcontainers | MR+nightly <90s | `mysql_warranty_repo_integration_test.go` |
| **L3/L4** | host MR 内真 BoostNavigator 容器 push + 真机回归 | planned | 真容器/真机 | host ship window | `g0-flutter-module` host MR |

**关键设计——L2 契约往返测试（防 wire 漂移）**：L1 的 `fromJson` 只校验 SDK 单向解析形状，但"字段名/枚举值与后端实际返回是否一致"必须靠契约往返验证——让 Dart 对**真实 Go backend JSON** 做 `fromJson → toJson → 与原 JSON 结构相等`。这把"SDK 以为字段叫 `productName`、后端实际返 `product_name`"这类 silent failure 挡在 MR 阶段。跨仓的 L3（真容器 push）明确标注为 `g0-flutter-module` host MR 的 deliverable，不混计在 SDK 仓，避免"假装覆盖了"。

**② Quality Gate 10 条硬规则**（见 §3.3）——CI 与 pre-commit 同一入口，本地过=CI 过；其中 rule 6（每个 class 必须有 _test.dart）、rule 9（覆盖率 ≥80%）、rule 10（example 工程零 error）直接守 SDK 健康度。

**③ TDD Iron Law**：测试文件先于实现文件创建；rule 6 在机器层强制"加文件必加测试"，杜绝隐性技术债。

**④ 版本与契约治理**：`warranty_plus_api` 公开符号任何删除/重命名视为 breaking，强制 major bump + CHANGELOG Migration Guide；`host-version-governance.md` 管宿主版本兼容。

---

## 6. SDK 出问题时的兜底与降级

**硬约束（写进 Design Goals）**：「安全降级——任何异常不崩溃宿主 App」是和"零外部依赖"同级的硬目标。这套 SDK 嵌在别人的 App 里，崩了是宿主的事故，所以每一条外部交互都要有兜底。具体落在 4 处：

**① Config 加载的四态降级**（`ConfigRepository.load()` → `ConfigLoadResult`）：

| 状态 | 触发 | 兜底动作 |
|------|------|----------|
| `cached` | 命中 L1/L2 缓存 | 立即返回缓存 + 后台静默比对（用户零延迟） |
| `updated` | 首次/主动刷新拿到新响应 | 直接用新值 |
| `disabled` | 后端返 `{status:"disabled"}`（**紧急熔断 kill switch**）| 清缓存、返回 null config，入口整体隐藏 |
| `error` | 无缓存且 API 失败 | 返回 null → 调用方走 `WarrantyDefaults` 两级降级（预定义渠道列表） |

并且 `channels=null`（完全降级）时 `getChannels()` 回落到**预定义渠道列表**（amazon/kiwibit/walmart/target/bestbuy/chewy/skip），用户仍能完成登记（L2-WR-C007 专门测这条）。

**② 后台刷新失败不降级**：后台异步刷新失败时**继续用现有缓存**，只向 `ErrorReporter` 上报（`action: config_background_refresh`），用户无感——刷新失败不能反噬当前可用内容。

**③ A/B 实验的异常降级到 control**（ADR-W15）：
- 宿主没注入 experiment provider → `NoOpExperimentProvider` 让所有实验返回 `control`（= 生产 baseline 行为）。
- provider 抛异常/超时 → catch → `ErrorReporter` 上报 → 返回 `control` → 同 key 本会话**不再重试**（防故障时刷日志）→ 降级值写入 cache 保证后续读一致。
- 即"接入 A/B 后默认行为不变"——NoOp 下 SDK 行为与未加实验前完全等价。

**④ 设备查询失败的 UI 状态机**（ADR-W28，`WarrantyDeviceLoadFailureView` / `WarrantyDeviceEmptyView`）：lazy-query 失败时不是白屏，而是 4 态状态机（loading / loaded / failure+retry 按钮 / empty），用户可手动重试（L1-WR-W28-007~010 覆盖）。

**⑤ 错误统一出口**：所有兜底路径的异常都经可选 `ErrorReporter` port 上报到 Sentry（`module: warranty` + action 维度），保证"用户无感降级"的同时"线上可观测"——降级了但我知道降级了多少。这也对应可观测决策问题 1.2.2「`fetchConfig()` 失败降级频率有多高」。

> 一句话总结这套兜底哲学：**fail-soft 给用户（永远能用预定义渠道完成登记），fail-loud 给 oncall（每次降级都有 metric/Sentry 记录）**。

---

## 7. 数据可观测性具体体现在哪

可观测不是"加几个 metric"，我设计的是**四条独立链路 + 交叉校验**，每个指标都能回到一个明确的业务/系统问题：

```
① 业务指标链路（两条子链路互相佐证）
   ①-A 用户行为   App 埋点 → Snowplow → 数仓(dwd→dwm) → Superset
   ①-B 后端事实   backend RDS → Dagster/dbt hourly → Athena Iceberg(ods_warranty_*_hf) → Superset
② 错误链路       App+Backend → Sentry → PagerDuty
③ 系统指标链路   Backend → OTel → Prometheus → Grafana → PagerDuty
④ 运营操作链路   Admin Backend → Prometheus(9 指标+7 告警) → Grafana → PagerDuty
```

**① 业务转化漏斗（北极星 = 设备保修覆盖率）**：13 个 Snowplow 事件串起完整漏斗——`warranty_page_opened`（入口曝光）→ `warranty_device_selected` → `warranty_channel_selected` → `warranty_submit_clicked` → `warranty_registered`，每一步可 `GROUP BY channel_id / source / experiment_id,variant` 切片，回答"损耗发生在哪一层、哪个渠道/入口最好、A/B 哪个变体赢"。

**①-A vs ①-B 交叉校验（我觉得最值得讲的一点）**：同一业务事实从两条独立链路采集——①-A 是客户端 emit 的行为事件、①-B 是后端 RDS 的真实行数。两者在相同时间窗口应趋近，例如 ①-A 的 `warranty_skipped` 事件数 ≈ ①-B 的 `channel_id='skip'` row count；**显著漂移就说明两侧口径之一有 bug**。用双链路互证代替"单一数据源自说自话"。

**③ 系统指标（18 个 Prometheus 指标 + 5+ 告警）**：6 个 2C 指标（http duration/registration result/duplicate_sn 等）+ 12 个 admin 指标，全部用 **closed-enum label** 防 cardinality 爆炸（绝不放 user_id/sn 进 label）。`warranty_register_duplicate_sn_total{kind}` 用 `kind="cross_tenant_uk_sn"` 在 metric 层即区分"SN 全局唯一假设破裂"信号，无需人工 join 日志。

**④ SDK 运行时遥测**：`warranty_sdk_session_started/ended/backgrounded/foregrounded` 单一 universal session 模型覆盖 bind/home/detail 三类入口；`warranty_page_opened{page=skip_dialog}` 标签化闭环具体图表。

**数据链路落地物**：dbt `vw_warranty_events` view 供 Superset；Snowplow schema 版本化（`warranty_registered` 1-0-1 加 `is_resubmit` required 字段，breaking change 走 schema 升级）；Superset prod 环境**禁用 email 列**做 PII 防护。

**可观测的"治理"经验**：(a) **dual-SSOT 坍塌**——曾有 K8s PrometheusRule 和 standalone rules 两套定义，我合并成"K8s manifest 为唯一 SSOT"，删冗余 + mirror gate；(b) **告警窗口治理**——低频 registration 事件用裸 `increase()` 会误报，我用 `sum(increase(...))` + 调 `for` 窗口消除疲劳；(c) **metric-existence gate 加了又 revert**——这是诚实的失败案例（见 §12）。

---

## 8. 如何用 AI 从 0→1 进行设计

整个 Warranty Plus 是 AI 辅助从 0→1 建起来的，但**不是"让 AI 随便写"，而是我设计了一套让 AI 在边界内自主推进的工艺流程**，核心是"约束 + 流程 + 可追溯"三件事。

**① 双层 Context Engineering（让 AI 知道边界）**
- **CLAUDE.md（架构约束层）**：项目根定义不可逾越的规则——5 条依赖规则 + 5 条质量规则、编码纪律（编辑一个文件就 `dart analyze`、测试先于实现、不猜 API 字段名）。
- **Skill 系统（流程编码层）**：把研发流程封装成可调用工作流，例如自研 `golden-data-tdd` skill——"AI 发现数据、AI 生成 golden fixture、AI 先写测试"，从 staging 真实 Snowplow 事件提取 fixture 而非手写 mock，消除字段名漂移导致的 silent failure。

**② Spec → Plan → Phased Execution（让 AI 有路线）**
我用 superpowers 的 `brainstorming → writing-plans → executing-plans` 流程，每个特性先落 spec 再落 plan 再实现：
- **Spec**（`docs/superpowers/specs/2026-04-20-warranty-plus-sdk-design.md`）：Problem Statement → Design Goals（标硬/软约束）→ Architecture → Domain Model。
- **Impl Plan**（`2026-04-20-warranty-plus-impl-plan.md`）：拆成 **Phase 0-9**，每个 Phase 有明确**产出 + 门控**：

  | Phase | 产出 | 门控 |
  |-------|------|------|
  | 0 Scaffold | 包骨架+工具链+文档 | quality_gate 全过 |
  | 1 api 接口 | 7 Port+模型 | analyze 0 error |
  | 2 Manager | WarrantyManagerImpl+NoOp | L1 ~23 cases，cov≥80% |
  | 3 UI | 5 pages | widget ~25 cases |
  | 4 Tracking | 10 events+Validator | L1 ~10 cases |
  | 5 Integration | example app 联调 | E2E smoke 过 |
  | 6 Quality Gate | 全门控 | 零违规 |
  | 7 Observability | schema+dashboard | schema 注册 |
  | 8 Transport 迁移 | 双 port 共存→移除 | A/B/C 三阶段不回归 |
  | 9 lazy-create | drop source+lazy | backend+SDK+E2E 全绿 |

  每个 Phase 是独立可退出单元——Phase 8/9 甚至独立于主线、不阻塞 Phase 5 上线，分 A/B/C 灰度。这让 AI 不会"一口气写完无法验证"，而是每步有门控卡住。

**③ ADR 驱动决策（让 AI 的每个选择可追溯）**：52 个 ADR，每个五段式（Context/Options/Trade-off/Decision/Consequences），AI 和我在 review 时翻 ADR 判决。编号递增保证可逆。

**④ 硬质量门控 + 多轮 Review（让 AI 产出收敛到人的标准）**：
- 10 条 Quality Gate 在 CI+pre-commit 双卡，AI 写的代码和人写的受同一机器标准。
- 多轮 review SOP：MR !465 走了 5 轮（round-1→round-5），每轮 P0/P1/P2 分级；Doc-Drift Gate 保证 AI 改了代码必须同步改 ADR/INTEGRATION_GUIDE/E2E_TEST_PLAN。

**⑤ 可追溯纪律（[AI-Generated] tag）**：warranty 有 33 个 commit 带 `[AI-Generated]` 标签，AI 产出可审计、可归因——复盘时能精确区分"这个 bug 是 AI 写的还是人写的"，团队对 AI 输出有信心 → AI 越用越多。

> 一句话：我把 AI 从"赌运气出代码"变成"按工艺出产品"——**CLAUDE.md 划边界、Spec/Plan 给路线、Phase 门控卡节奏、ADR 留决策、Quality Gate + 多轮 review 守质量、[AI-Generated] tag 可追溯**。这套方法本身后来被复用到 Provisioning Kit。

---

## 9. AI 在设计过程中暴露的问题 + 防护机制（诚实维度）

用 AI 从 0→1,真正的难点不是"让它写出代码",而是"防止它写出**看起来对、实际漏了一半或简化了设计**的代码"。下面是我在 Warranty Plus 里**真实遇到**的 AI 失败模式(都有 commit/review 证据)和我用什么机制把它们挡住。

### 9.1 AI 的 6 类典型问题（真实案例）

| # | 失败模式 | 真实证据 | 危害 |
|---|----------|----------|------|
| 1 | **只做一半 / happy-path only**——实现了主路径和单测,但跳过更难的 E2E 闭环,还声称"做完了" | MR 439 第二轮 review 命中 **P0**:"已实现 W38/W39/W40 仅有 L1,未形成 E2E 闭环";`catch example up to Phase 3 (review P0)`(example app 落后于实现) | 看着绿,实际契约没锁,上线才炸 |
| 2 | **漏实现需求 / 测试**——design 里写了的场景,代码里悄悄没了 | `add 6 missing EP7 Playwright scenarios`;`verify.sh missing admin-ops`(脚本漏了一条链路) | 需求静默丢失 |
| 3 | **文档与代码漂移(doc-drift)**——改了代码不同步改 ADR/INTEGRATION_GUIDE/E2E_TEST_PLAN,反之亦然 | MR !465 **round-4/round-5 全是 doc-drift fixes**;`close re-review P0/P1 doc drift`;`W41 doc drift` | 后人按过期文档做决策 |
| 4 | **偷懒简化 / 吞错误** | `silent error logging`(review P0/P1——AI 把错误 catch 了不上报);`OverviewBar tolerates missing overview fields`(用容错掩盖字段缺失) | 故障被静默吞掉 |
| 5 | **猜字段名 / 编 mock**——不验证后端真实 wire format,凭感觉写字段名 | 专门立 CLAUDE.md 纪律"不猜 API 字段名必须验证";L2 契约往返 + golden-data 就是为治这个 | wire 漂移 silent failure |
| 6 | **超范围 / 自作主张 + 留垃圾** | `revert: drop onboarding work from MR !465 scope`(AI 顺手做了范围外的 onboarding,被 revert);`remove stale ADR-W25 fake tombstone`(AI 留了个假墓碑文档) | scope 膨胀 / 垃圾堆积 |

> 这些不是个例——光 warranty 一个模块,code-review 就走到 **round 7**(`code-review round 7 — fix 3 P0 + 4 P1 + 5 P2 from full-module audit`)。AI 越自由,越需要强力门控兜底。

### 9.2 对应的防护机制（一类问题一道防线）

**核心思想:把"AI 有没有按设计做"从主观判断变成机器可验证的对照。**

1. **设计先写下来(Spec/ADR/Plan 是契约)** → "有没有实现某个设计"可以对照 artifact,而不是靠 review 者凭记忆。针对问题 1/2。

2. **需求追溯矩阵(US ↔ test ID ↔ ADR)** → `strategy.md §5` 把每个 User Story 映射到 test 编号和 ADR。**一个 US 没有对应 test ID = 它没被实现**,一眼可见。这是治"AI 静默丢需求"(问题 2)的核心。

3. **Doc-Drift Gate(双向 + 方案先行原则)** → 明文规则:**"文档有/代码没有 ⇒ 允许(方案先行);代码有/文档没有 ⇒ 不通过(undocumented implementation)"**;代码改了 ADR 没改也打回。治问题 3。MR !465 的 round-4/5 就是这道 gate 逼出来的。

4. **Phase 门控 + 明确产出** → 每个 Phase 有 deliverable + 退出门控(见 §8),AI 不能"跳过 Phase 7 的 observability 直接说做完了"。治问题 1。

5. **Quality Gate 机器硬卡**(治问题 1/4):
   - rule 6 **test-file-exists**:每个 class 必须有 _test.dart → AI 不能"省掉测试"
   - rule 9 **coverage ≥80%** → 不能用空测试水覆盖率
   - rule 10 **example-analyzes**:AI 删了 deprecated API 却忘了更新调用面 → example 工程编译失败 → CI 红。这条专治"改了一半"

6. **TDD Iron Law + pre-commit history 检查** → 必须先看到失败的测试再写实现;pre-commit hook 检测 commit history,没有先红测试的实现 commit 直接拒。治问题 1(防 AI 先写实现再补假测试)。

7. **L2 契约往返 + golden-data-tdd** → 字段名用真实 Go JSON 验、fixture 从 staging 真实数据提取 → AI 猜字段名/编 mock 当场暴露。治问题 5。

8. **多轮 Review P0/P1/P2 + full-module audit** → 机器门控抓不到的"设计完整性/语义偏差",靠人兜底分级。round 7 的 full-module audit 就是周期性全量审计,专抓累积的 AI 残留。治问题 1/4/6。

9. **[AI-Generated] tag 可追溯** → 33 个 AI commit 带标签,复盘时精确归因到底是 AI 还是人引入的问题 → 知道 AI 在哪类任务上爱犯错,针对性加门控。

### 9.3 我从中学到的（面试可主动讲）

- **AI 最擅长"做得像"而不是"做得全"**——它会把 happy path + 单测写得漂漂亮亮,但跳过 E2E、边界、错误上报这些"看不见但关键"的部分。所以门控必须卡在"完整性"而非"能跑"。
- **机器门控管"硬完整性"(有没有测试/文档/编译),人 review 管"软完整性"(设计意图有没有走样)**——两者缺一不可。我曾经也踩过坑:metric-existence gate 想用机器卡观测完整性,结果因底层规范没统一而误报,只能 revert(见 §12)——这让我明白门控要建立在规范统一之上。
- **可追溯是前提**:没有 [AI-Generated] tag + ADR + 追溯矩阵,你根本不知道 AI 漏了什么。先让一切可对照,再谈防护。

---

## 10. 收益与结果

**业务收益**
- 0→1 打通售后挽回闭环，运营首次获得"Amazon 订单号 ↔ App 账号 ↔ 设备"关联与审核能力。
- 同一套 SDK 被 3 个 App 复用，相比各自实现节省约 2/3 重复工作量。

**工程收益**
- 后端：4 表→2 表、Go 代码减 ~800 行、`/products` 响应体积减 ~62%、删掉 iot-service 整条跨服务依赖 + 一个 cron + 一个告警。
- SDK：宿主接入成本从"实现 3 个强类型方法 + 认识 10+ 模型"降到"实现 3 个 HTTP 透传方法"；只读消费方零依赖传染。
- 质量：10 条 Quality Gate 在 CI+pre-commit 双卡；api 包 100% 测试文件覆盖、≥80% 行覆盖；MR !465 经 5 轮 review 收敛。

**可追溯性**
- 52 个 ADR 完整留痕，任何后续接手者可基于 ADR 追溯任一决策的 Context/Trade-off。
- 33 个 commit 带 `[AI-Generated]` 标签，AI 产出可审计、可归因。

---

## 11. 面试 Q&A（面试官视角）

**Q1：你说后端用 `net/http` 而不是 go-zero/gin，为什么？团队不是有 go-zero 吗？**
> A：Warranty 后端外部依赖很薄——只有 MySQL + Snowplow + GrowthBook，没有 RPC 网格、没有复杂中间件链。go-zero 的 API+RPC 代码生成和服务治理对这种"单服务、少端点、Ports&Adapters 清晰分层"的场景是过度引入。我用标准库 `http.ServeMux` + 自己的 handler→logic→adapter 分层，依赖图最小、可测试性最好（adapter 层 MySQLWarrantyRepo 是唯一 IO 边界，logic 层纯函数易测）。
> **追问：那限流、鉴权这些 go-zero 内置的能力你怎么办？** 鉴权在 API Gateway 层（JWT），后端只读 `X-User-ID` header；admin 走 HMAC 中间件自己实现（就一个 `admin_middleware.go`）；限流当前靠 Gateway，真需要后端限流时再引 Redis token bucket——YAGNI，没到那个量级不提前加。

**Q2：4 表合并成 2 表，你怎么保证不是"砍功能图省事"？万一以后要差异化保修时长呢？**
> A：合并的前提是那两张表（product/incentive）已经因为前面三个 ADR（文案回宿主、owner 归宿主、设备列表宿主 push）退化成死代码——product 表只被读一次、incentive 表的文案能力整个下线、admin cancel 从未真实上线。我在 ADR-W26 里明确写了 trade-off：取"未来需要时重新立 ADR 引入最小版本"换"当前代码库高内聚低维护"。差异化保修时长真来了，大概率是直接在 `warranty_registration` 加一个扩展列，而不是重建独立表——所以现在删掉不会造成"未来重做"的浪费。这是 YAGNI 的有意取舍，不是图省事。
> **追问：怎么证明 product 表真是死代码而不是你没找到调用？** ADR 里逐条列了调用点：product 元数据已由宿主 App bundle 维护、文案由 WarrantyScope 注入、icon 从 projectF 资产复制到宿主 bundle——三个职责都迁走了，表只剩"放着不动只被读一次"的单点查询。

**Q3：`/warranty/products` 是个 GET 语义的查询，你却在里面写库（lazy-create），这不是违反 REST 幂等吗？**
> A：它确实是非常规设计，我在 ADR-W27 专门论证了为什么成立。关键是**幂等**——lazy-create 靠 `uk_sn` 唯一键，行已存在就 no-op，多次调用结果一致，DB 行只代表"这个 SN 已被 warranty 模块识别"这一事实。我评估过两个"更干净"的备选：(A) 宿主在 bind 完成时显式调 `/order skip` 写 baseline；(B) 新增 `/onboard` 端点。两者都把 baseline 写入责任压给宿主，要求宿主知道"bind 完成时机"，增加跨服务隐式调用。而真实产品意图是"SDK 不主动唤起、用户进 UI 才查询"——把写入折进读路径正好对齐这个意图，宿主零新职责。代价是 HTTP 缓存语义要明确（响应带 ETag），这个可控。
> **追问：那 CDN/HTTP 缓存会不会把写操作给缓存掉导致 baseline 没写？** 响应带 ETag 且 lazy-create 幂等，即使被缓存，下次 cache miss 重新打到后端也是 no-op，不会重复写或漏写；且这是 POST body（`{devices:[...]}`），不会被常规 GET 缓存命中。

**Q4：SDK 要跨 3 个 App 复用，其中有的用 GetX。你怎么做到 SDK 不绑定 GetX？**
> A：ADR-W02 决定 SDK 内部用 Flutter 原生 StatefulWidget + callback 管状态，零外部状态库。warranty 的内部状态很简单（表单输入 + API 响应），StatefulWidget 完全够。宿主内部继续用 GetX/Provider 都行，SDK 通过 `WarrantyNavigator.onStateChanged` 回调把 3 种业务事件（registrationSuccess/allDevicesRegistered/redDotCleared）抛给宿主，宿主自行转发给自家状态管理。而且我用 Quality Gate 规则 5（no-external-ui-state）在 CI 硬拦截——pubspec 里出现 `get`/`provider`/`riverpod` 直接 fail，把"不绑定"从口头约定升级成机器强制。
> **追问：你不用任何状态管理，跨页面共享 Manager 怎么解决？** ADR-W03：构造器注入 + `WarrantyScope`（InheritedWidget）。比 Static Delegate（运行时才发现缺失、全局污染测试）和 GetIt（隐式依赖）更好——required 参数缺失编译期就报错，每个测试独立构造 Manager + Mock，完全隔离。

**Q5：你自研了一套 Quality Gate，为什么不用现成的 lint / dart analyze？**
> A：dart analyze 管的是语法和单文件 lint，管不了**架构约束**——比如"api 包不能依赖 feature 包"、"api 包运行时依赖只能有 flutter+meta+collection"、"每个 class 必须有对应测试文件"、"example 工程不能因为我删了 deprecated API 而编译失败"。这些是包级/项目级的结构规则。更重要的一点是 **CI 与 pre-commit 共用同一个 `check.dart` 入口**——保证本地通过就等于 CI 通过，杜绝两套规则漂移、也杜绝"本地绕过 hook、CI 才发现"的作弊路径。因为整个项目是 AI 辅助开发，必须有机器化的硬门控让 AI 和人受同一标准约束。
> **追问：自研门控的维护成本呢？规则本身有 bug 怎么办？** check.dart 自己有测试（`tools/quality_gate/test/`），规则解析器 parsers.dart 单独测。我也踩过坑——曾加过一道 dashboard metric-existence gate（dashboard 引用的 metric 必须真在 Prometheus 存在），结果误报多直接 revert 了，让我明白 gate 必须建立在"底层命名规范统一"之上，否则 gate 比 metric 本身更脆弱。

**Q6：admin 后台处理用户 email、订单号这些 PII，你怎么做脱敏和权限？**
> A：分三层。(1) 传输层：Next.js admin 通过 `[...path]/route.ts` 代理 + HMAC-SHA256 签名转发，Go 后端只信 HMAC、不直接暴露给浏览器。(2) 角色层：cs/ops/admin 角色 gate 在 Next.js route handler，不同角色看到的脱敏程度不同。(3) 数据层：Superset 在 prod 环境直接禁用 email 列；admin 详情面板用 `mask-batch`/`resolve` 接口——列表默认脱敏展示 temp_id，需要时才 resolve 出真值，并有 `warranty_admin_pii_mask_request_total`/`warranty_admin_pii_resolve_request_total` 指标监控脱敏调用。
> **追问：硬删除（物理 DELETE）会不会有合规/审计问题？** ADR-W31 我选了物理 DELETE 而非软删 + audit_log 重型架构，因为当前运营场景不需要删除回溯，加 audit_log 是过度设计。删除动作有 Prometheus counter（`warranty_admin_delete_total{kind,result}`）+ INFO 日志兜底可观测。真要合规审计时再立 ADR 引入 audit_log——同样是 YAGNI。

**Q7：52 个 ADR，会不会是文档负担？团队真的看吗？**
> A：ADR 对我不是负担是**判决依据**。Review 时跟人意见不一致，翻 ADR 看当时的 Context 和 Trade-off，不用重新吵一遍。编号严格递增是为了**可逆性**——要 revert 某个决策只影响那一个编号，不波及其他。带子版本（如 W21a/W21c）记录同一决策的多次修正。我还配了 Doc-Drift Gate：代码改了 ADR 没同步改直接打回，所以 ADR 不会过期成废纸。MR !465 走 5 轮 review 时，每轮都在 ADR 基础上讨论，这套机制让 AI 和人的产出都收敛到同一架构意图上。

**Q8：跨 AWS account 部署（admin 002、api 302）增加了复杂度，为什么不放一个账号？**
> A：这是身份与权限隔离的需要。admin 后台和 2C api 的信任边界不同——admin 接触全量 PII、有审核/删除等高权限操作，2C api 是面向终端用户的。放不同账号 + IRSA 身份隔离（无跨账号 assume-role，信任边界止于集群边缘）+ Harbor path 隔离（warranty 镜像独立 prefix），能把"admin 被攻破"的爆炸半径限制住。代价是要打通跨账号内网 ALB（VPC peering + Route53 PHZ 跨账号 + internal ALB），这个一次性成本换长期的权限边界清晰，值得。

**Q9：你大量用 AI 写代码，怎么让我相信这套 SDK 不是一堆 AI 幻觉拼出来的屎山？**
> A：我不靠"相信"，靠**机器化的硬门控 + 可追溯**。三件事：(1) AI 和人受完全相同的 10 条 Quality Gate（CI+pre-commit 同一入口），包括"每个 class 必须有测试文件""覆盖率 ≥80%""example 工程零编译 error"——AI 写的代码过不了门控一样合不进。(2) 我用 Spec→Plan→Phase 门控把任务切成可验证的小步，每个 Phase 有明确产出和退出门控，AI 不会"一口气写完无法验证"。(3) 33 个 commit 带 `[AI-Generated]` 标签，复盘时能精确归因到底是 AI 还是人写的——出问题可追溯。再加上 MR !465 这种 5 轮 review，AI 产出最终收敛到人的标准。**关键是我把 AI 当"在边界内自主推进的执行者",边界是我用 CLAUDE.md + Quality Gate + ADR 定义的。**
> **追问：那 AI 写的测试会不会也是假的（测了个寂寞）？** 这正是我做 golden-data-tdd skill 的原因——测试 fixture 从 staging 真实 Snowplow 事件提取，不是 AI 手写 mock；同一份真实 fixture 跨层复用，AI 没法"为了过测试而编字段名"。再加 L2 契约往返测试用真实 Go JSON 验 Dart 解析，wire 漂移当场暴露。

**Q10：SDK 嵌在别人 App 里，如果你后端挂了或者配置拉不到，用户会看到什么？**
> A：用户**永远能用预定义渠道完成登记**，不会白屏不会崩。我设计的是 fail-soft 给用户、fail-loud 给 oncall：config 拉取四态降级（cached/updated/disabled/error），`error` 态走 `WarrantyDefaults` 两级降级到预定义渠道列表（amazon/walmart/skip 等 7 个），`channels=null` 时 `getChannels()` 也回落预定义；后台刷新失败不动当前缓存。A/B provider 抛异常就降级到 control（=生产 baseline）。同时每一次降级都打 metric + Sentry 上报，所以我能在 Grafana 看到"fetchConfig 失败降级频率"——用户无感但我有数。还有个紧急 kill switch:后端返 `{status:disabled}` 能整体熔断隐藏入口。
> **追问:降级到预定义渠道,但用户填的订单号校验规则(正则)也是后端下发的,降级后正则哪来的?** 预定义渠道列表里 amazon 这类主渠道的 validator regex 是 SDK 内置兜底常量,降级时用内置;skip 渠道本就不需要订单号。冷僻渠道降级期间不可选,但主路径(amazon)始终可走通。

**Q11：①-A 和 ①-B 两条数据链路采同一件事，不是冗余浪费吗？一条不够？**
> A：恰恰相反,双链路是**故意的互证机制**。①-A 是客户端埋点的用户行为(可能丢事件、可能被广告拦截、可能时区错), ①-B 是后端 RDS 的真实落库行数(绝对准但拿不到"用户在第几步放弃")。两者各有盲区:只信 ①-A 会把"埋点 bug"当"转化下降",只信 ①-B 看不到漏斗损耗在哪一步。我让它们在相同时间窗交叉校验——比如 ①-A 的 `warranty_skipped` 事件数应该约等于 ①-B 的 `channel_id='skip'` 行数,显著漂移就是某条链路有 bug 的信号。这比"单一数据源自说自话"可靠得多,代价只是多一条 Dagster/dbt sync,值。

---

## 12. 其他方案考量与权衡

| 决策点 | 我选的 | 认真考虑过的备选 | 为什么没选 |
|--------|--------|------------------|------------|
| 后端框架 | net/http + Ports&Adapters | go-zero（团队标配）/ gin | 单服务少端点，go-zero 的 codegen+治理是过度引入；标准库依赖图最小、最易测 |
| SDK 包结构 | Split API 二包 | 单包 / 按技术层切多包（ui/data/...） | 单包让只读消费方拖入整个 UI 依赖图；按层切对单业务域过度工程——只需切"接口 vs 实现"一刀 |
| 网络 port | transport port（post/get/download）| domain port（强类型 3 方法）| domain port 接入成本随端点线性增长、SDK 拿不到 HTTP 生命周期、无法做 cache/ETag |
| config 刷新 | cache-first + version diff 热替换 | 会话内不刷新 / 每次路由 force refresh | 不刷新→长停留看旧激励；force refresh→网络抖动放大、白屏 |
| owner 校验 | 信任 Gateway JWT + 宿主 pre-filter | 后端回查 iot-service / 后端+SDK 双层 | 双层冗余、跨服务硬耦合、+500ms 延迟、CI 要 mock |
| 数据表 | 2 表 | 保留 4 表 / 塌缩成单表全 denormalized | 4 表背死代码；单表让 admin 改 channel 要扫全表更新 |
| admin 删除 | 物理 DELETE + 指标兜底 | 软删 + audit_log | audit_log 重型架构当前无需求，YAGNI |
| A/B 实验 | 宿主注入 Port（WarrantyExperimentProvider）| SDK 内置 GrowthBook SDK / 后端下发变体表 | 内置违反零依赖；后端下发会和宿主分桶不一致导致归因错乱 |

**一个体现"取舍是有意为之"的例子**：GetX 替换决策。迁移时我选择"先保留 GetX 完成迁移，再单独替换"，而不是合并成一步。原因是任一步出错都能精确归因——如果把"迁移"和"换状态库"合并，出 bug 时无法判断是迁移引入还是状态库引入。

---

## 13. 方案改进 / 演进方向

**已知局限（诚实维度）**
1. **lazy-create 读写混合**虽然幂等，但对不熟悉这套设计的新人有认知成本，且让 `/products` 的 HTTP 缓存语义需要额外文档说明。改进：可考虑显式 `/onboard` 端点 + 读端纯查询，用一次额外 round-trip 换语义清晰——当前是有意不做（对齐"SDK 不主动唤起"产品意图）。
2. **denormalized 列**（admin 展示用的 email/device_name/sku 快照）不随宿主元数据变化回写，v1 接受 staleness。改进：未来加一个低频 reconcile job 或 admin 手动刷新。
3. **单 tenant 假设**：`uk_sn(serial_number)` 不含 tenant_id，假设 SN 由 IoT Platform 全局唯一分配。第二个 tenant（尤其第三方 OEM 独立 SN 命名空间）上线前必须走强制 gate（7 天 staging `WarrantyDuplicateSNCrossTenantBreak` 告警 0 触发），否则改 `(tenant_id, serial_number)` 复合键。
4. **dashboard metric-existence gate 已 revert**：底层 metric 命名规范没统一前，这道 gate 比 metric 本身脆弱。改进方向是先统一 metric 命名 SSOT，再重新引入。

**演进方向**
- ADR-W20 的"入口渲染委托 API"（IoC，宿主传 fallback/child 拿 widget，A/B key 完全收敛进 SDK）当前是 Deferred 蓝图，落地后三家宿主接入代码可从 ~17 行缩到 ~3 行，改 A/B 策略零宿主发版。
- ADR-W16 的 `WarrantyApi` deprecated→下个 major 删除，完成 transport port 单一化。
- 把这套 ADR 体系 + Quality Gate 模式作为可复用资产推到其他 Flutter/Go 项目（Provisioning Kit 的 ADR 体系就来自这里的实践沉淀）。

---

*文档基于 customer-care 仓真实 commit、ADR（docs/architecture/warranty/）、quality_gate 源码与可观测配置整理；ADR 编号、指标名、端点名、迁移文件名均为仓库内真实存在。*
