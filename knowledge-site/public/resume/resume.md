# 陈国栋

**出生年月**：1999.06　　**手机**：+86 178 5232 6900　　**邮箱**：xdong67@163.com　　**政治面貌**：中共党员

---

## 个人介绍

（请自行补充）

---

## 工作经历

### ADDX · 高级移动端开发工程师
**2025.03 — 至今**

作为**设备绑定与售后保修两条业务线的架构负责人**，负责 IoT 智能家居平台 Vico Smart Home 及消费端 App（KiwiBit / VicoHome / VicoNature / SafeMo）的核心研发，技术覆盖 Flutter SDK、Android（Kotlin / Framework）、iOS（OC / Swift）、Go 后端、Next.js 后台**全栈**，并主导团队 AI 驱动研发体系（Harness Engineering）落地。

- **0→1 主导 2 套生产级 SDK**：Warranty Plus 售后全栈（Go 后端 + Flutter Split-API SDK + Next.js Admin + 可观测，三 App 复用）、Provisioning Kit 配网 SDK（六边形架构，53 天历经三代演进），两套合计输出 74 个 ADR
- **跨端 / 跨仓工程治理**：主导设备绑定特性在 Android / iOS / Flutter / iOS Core SDK **4 仓锁步演进**（HB1 解绑保留配对、Homebase 新品上架），建立"同分支 + 双端一致 commit + 同日合入"的协同范式
- **AI 工程化体系**：设计「CLAUDE.md 架构约束 + 自研 quality_gate（CI 与 pre-commit 同入口）+ ADR 驱动 + golden-data TDD」双层框架，推动 [AI-Generated] commit tag 团队公约（跨 5 仓 **203 个** AI 提交可审计、可归因），让 AI 产出从"赌运气"变为"按工艺出产品"
- **车载 → IoT 跨域迁移**：将德赛西威 2.5 年 Framework 层（Binder IPC / 状态机 / 多设备互联）经验，系统化迁移到 BLE 配网 / 跨协议设备绑定 / 全栈售后系统

### 德赛西威汽车电子股份有限公司 · Android 应用开发工程师
**2022.06 — 2025.03**

负责车载互联应用需求分析、DD/RD 文档编写、软件开发、互联服务 SDK 开发；负责 Framework 层 TBoxService 开发；开发和维护平台互联服务共版代码，重构旧平台代码以提升维护效率。负责奇瑞、保时捷、小鹏车载互联项目量产交付，申请多设备互联连接管理策略技术专利。

---

## 项目经验

### 1. Provisioning Kit — 设备绑定模块架构迁移（2026.03 — 至今）

**技术栈**：Flutter/Dart · Dart Workspace(melos) · MethodChannel · Native AAR · BLE · WiFi · Matter

**原痛点**：设备配网/绑定代码散落在 g0-flutter-module 主工程，UI 与逻辑耦合，多处基础设施硬依赖（HTTP、权限、导航、i18n、埋点、主题、状态、资源）导致每次新增消费端需全量复制代码、维护两份实现；任一端改动须人工同步另一端。

**技术架构**：
- 六边形（Ports & Adapters）+ Split API：纯接口包（零外部运行时依赖）+ 实现包，5 个宿主 Port 注入、单向依赖，跨宿主复用、只读消费方零依赖传染
- native 配网核心历经 **v1（自研 channel）→ v2（Dart FFI）→ v3（native AAR + session API）三代架构演进**，ADR 驱动决策 + 分阶段迁移（非 big-bang），底层 native 三次替换、上层 Port 契约不变
- Fake 测试装配 + L1-L4 分层 CI 质量门控，强硬件依赖的配网流程在无真机环境即可端到端验证

**价值量化**：
- 新消费端接入从"复制代码 + 适配双端"降为"实现 5 个 Port Adapter"
- 30+ 配网页面内聚进 SDK，新协议（Matter）/ 新宿主扩展只改 adapter 不动核心
- 53 天完成三代架构演进 + 22 个 ADR，六边形边界经 native 三次替换验证扛得住

---

### 2. Homebase 新型号功能及页面开发（2025.10 — 2026.01）

**技术栈**：Flutter/Dart · Android Kotlin · iOS Objective-C/Swift · iOS Core SDK · BLE · WiFi · Matter

**原痛点**：Homebase（HB1）作为新中枢硬件上架，绑定模型从"扫码直绑相机"升级为"相机绑定到 Hub"的 1-to-N 拓扑，需要全新功能与页面，且涉及 Android / iOS / Flutter / iOS Core SDK 四端、行为须强一致；新协议旧固件不识别、强行下发会致设备挂起；同时原单体绑定架构权限 / 蓝牙 / 导航与业务耦合——蓝牙未开与权限未授权共用错误码致引导错误、多条绑定路径共用导航栈致返回键不可预期。

**技术架构**：
- **Homebase 新型号端到端功能与页面**：相机绑 Hub 流程、设备卡片显示、固件版本校验页、在线 / 离线双路径换网页面、HB1 解绑保留配对页——主导跨 **4 仓**（Android / iOS / Flutter / iOS Core SDK）**锁步演进**，固件版本门控路由新旧流程
- **底层绑定架构**：双模式 Permission Guard（蓝牙未开 / 权限未授权状态隔离监听与引导）、SingleTask 导航隔离绑定路径、统一 MethodChannel 双端 API 契约
- **绑定数据脱敏框架**：KeyBased（字段名）+ ValueBased（正则）双层规则引擎，配置驱动、业务层零侵入

**价值量化**：
- 完成 Homebase 新型号全部功能与页面开发，跨 4 仓协同落地，支撑新硬件 HB1 按期上架与 Vico VH 4.0.0 准时发布
- 固件版本门控保证新协议不打到旧固件，新旧硬件平滑共存
- 蓝牙权限引导准确率显著提升、因错误引导放弃绑定明显减少；双端通道改动成本降低约 60%

---

### 3. Warranty Plus — 保修延保模块（2026.04 — 至今）

**技术栈**：Flutter/Dart · Go（net/http）· MySQL · Snowplow · GrowthBook · Next.js（Admin）· Prometheus/Grafana · Superset · GitLab CI · ArgoCD

**原痛点**：保修登记能力缺失，运营无法将 Amazon 差评/订单用户与 App 账号关联，无法主动触达挽回；各 App 各自为政，没有统一售后 SDK，重复建设成本高；订单号格式多样易输错，提交后才反馈格式错误；弱网场景功能不可用，无降级策略。

**技术架构**：
- **全栈自研**：Go 后端（net/http + Ports & Adapters 分层）+ Flutter Split-API SDK（零依赖接口包 + 实现包）+ Next.js Admin 审核后台，三个 App（KiwiBit/VicoHome/VicoNature）共用
- 数据库 schema 演进（**4 表→2 表**）+ 信任边界下沉解耦 iot-service；弱网降级（本地缓存 + 配置热替换）+ 订单号实时校验
- **工程化**：自研 Quality Gate（CI 与 pre-commit 同一入口）+ **52 个 ADR** + 多轮分级 review + Doc-Drift Gate + L1-L4 分层测试（含 staging 真实数据 golden dataset）
- **全链路可观测**：行为埋点漏斗 + 后端事实 + 错误 + 系统指标，多链路交叉校验

**价值量化**：
- 运营首次获得 Amazon 订单号 ↔ App 账号关联与审核能力，建立售后挽回闭环
- 三个 App 共用一套 SDK，相比各自实现节省约 2/3 重复开发工作量
- schema 重构使后端代码减约 800 行、响应体积减约 62%
- 契约测试 + golden dataset E2E 阻塞合并，wire 字段漂移在 MR 阶段拦截

---

## 工作技能

**移动端开发**
- 熟练掌握 Flutter/Dart，具备跨平台插件（MethodChannel）开发能力，有 Flutter Monorepo / Package 化工程组织经验
- 熟练使用 Kotlin / Java 进行 Android 开发，熟悉 Jetpack（ViewModel、LiveData、Navigation、Room）及 MVVM 架构
- 熟悉 iOS Objective-C / Swift 开发，具备 CocoaPods SDK 开发与发布经验

**通信协议与 IoT**
- 熟悉 Bluetooth BLE 协议，有设备扫描、特征读写、状态机管理的完整开发经验
- 熟悉 WiFi 配网流程，了解 Matter 协议，有 WebRTC / FRP 专线加速实际开发经验
- 了解 MQTT，具备 IoT 设备端与云端消息通信的开发经验

**架构设计**
- 有跨端（App / Cloud / Device）技术方案设计能力，能输出含兼容矩阵、测试策略的完整方案
- 熟悉 Ports & Adapters（六边形架构），主导 2 套生产级 SDK 的 **Split API 设计**（零依赖接口包 + 实现包）；**ADR 驱动决策**（warranty 52 / provisioning-kit 22）+ 分阶段迁移（非 big-bang）经验
- 熟悉常用设计模式（代理、单例、工厂、建造者、观察者、策略），有多次设计模式重构项目经验

**AI 辅助开发**
- 熟悉 AI Agent 驱动研发（Harness Engineering）：设计 **CLAUDE.md 架构约束 + 自研 quality_gate（10 条规则，CI 与 pre-commit 同一入口）+ ADR 驱动**的双层 AI 工作框架，让 AI 在边界内自主推进
- 掌握 AI-TDD（先红测试再实现）+ golden data（staging 真实数据 fixture 跨层驱动）；推动 **[AI-Generated] commit tag 团队公约，跨 5 仓 203 个 AI 提交可审计、可归因**
- 系统化防 AI 偷懒/漏实现：Doc-Drift Gate（代码与文档同步）+ 需求追溯矩阵 + example 编译门控 + 多轮 review 分级，把"AI 是否按设计做"从主观判断变成机器可对照

**工程化与质量**
- 熟悉 GitLab CI/CD、Jenkins 自动化构建；有 SonarQube 扫描、GTest / Playwright E2E 测试实践
- 有 Android Framework 层开发经验（Binder IPC、Handler 机制）及 JNI / HAL 开发经验
- 能够借助 AI Agent 完成后端与 Web 项目的开发、联调和问题排查，理解接口设计、数据模型、部署与可观测等工程环节

---

## 教育背景

**山东科技大学** · 软件工程 · 本科　　2017.09 — 2021.06

主修课程：C/C++、Java、数据库、计算机组成原理、数据结构、设计模式、计算机网络、操作系统

---

## 性格介绍

（请自行补充）
