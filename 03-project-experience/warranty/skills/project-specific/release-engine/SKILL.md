---
name: release-engine
description: 发布 SmartPopup engine 新版本到指定环境（staging-us / prod-us / prod-eu）。自动从 GitLab Generic Package Registry 拉 manifest，更新对应 overlay 的 ConfigMap 3 个字段（VERSION/URL/SHA256） + rollout-trigger 注解，提 MR 等审核 merge。也可用于回滚。Use when user says 发布 engine / 升级引擎 / bump engine / 回滚 engine / release engine / SmartPopup 引擎更新。
---

# release-engine

通过对话式发布 SmartPopup engine bundle —— 用户说一句"发布 engine 1.1.0"，AI 自动完成"找 sha → 拉 manifest → 改 ConfigMap → 提 MR"全链路。

## 背景

SmartPopup engine 是 `personalization_engine/` 目录的求值器代码，由 `publish:engine-bundle` job 在 staging 分支 push 时构建并上传到 GitLab Generic Package Registry，但**实际下发给 SDK 取决于 customer-care-api 的 ConfigMap 3 个字段**：

```yaml
SMART_POPUP_ENGINE_VERSION: ""    # 空 → backend 不返回 engine_update，SDK 用 builtin
SMART_POPUP_ENGINE_URL: ""        # 空 → 同上
SMART_POPUP_ENGINE_SHA256: ""     # 空 → 同上
```

3 个字段全部填上才生效，且 ConfigMap 改动**不会自动重启 pod**——必须同步改 `k8s/api/base/rollout.yaml` 的 `kiwibit.a4x.io/rollout-trigger` 注解触发 rolling update。

本 skill 把这套手动操作（找 sha + 复制 manifest + 改 yaml + 起 MR）自动化为单条对话指令。

## 何时使用

- "发布 engine 1.1.0"
- "升级 staging engine 到 1.2.0"
- "把 engine 1.1.0 同步到 prod-us"
- "回滚 engine 到 0.2.0-2d957524"
- "现在 staging-us 用的 engine 版本是多少"
- "GitLab 里有哪些 engine bundle 版本"

## 用户输入解析

接到指令后先解析以下要素，缺失项**主动查询并展示给用户挑选**（不要硬要用户提供，也不要静默用默认值跳过）：

| 要素 | 默认值 | 说明 |
|---|---|---|
| **版本号** | 自动推断 + 让用户输入 | 见"版本号交互流程"——必经环节 |
| **目标环境** | **无默认（必须问）** | 取值：`staging-us` / `prod-us` / `prod-eu`，可多选。见"环境解析规则" |
| **commit sha** | staging 分支 HEAD | 用户显式给完整版本号（如 `1.1.0-2d957524`）时用其中的 sha；其他场景永远用当前 staging HEAD |

## 环境解析规则（永远不要默认）

发布/回滚是**写**操作，环境模糊时**强制反问**用户，不要静默默认到 staging。这是安全红线。

### 用户输入 → 环境映射

| 用户说 | 解析 | 行为 |
|---|---|---|
| `staging-us`、`staging`（简写） | `staging-us` | 进流程 |
| `prod-us`、`美国 prod` | `prod-us` | 进流程（prod 二次确认） |
| `prod-eu`、`欧洲 prod` | `prod-eu` | 进流程（prod 二次确认） |
| `prod`（不限定 region）| `prod-us + prod-eu` | 多环境 + **强 prod 二次确认** |
| `prod 全量` / `prod 全部` / `所有 prod` | `prod-us + prod-eu` | 同上 |
| `所有环境` / `全部` | `staging-us + prod-us + prod-eu` | 三环境 + **强 prod 二次确认** |
| 没说环境 | **反问** | "发到哪个环境？staging-us / prod-us / prod-eu / 多选" |

### prod 二次确认强度

写操作落到 prod 之前必须二次确认。强度按影响范围分级：

| 涉及范围 | 确认形式 |
|---|---|
| 仅 staging-us | 普通 `yes` / `no`（也接受回车 = yes） |
| 单 prod 环境（prod-us 或 prod-eu）| 普通 yes/no，但摘要里**列出当前线上版本 → 目标版本对比** |
| prod-us + prod-eu 同时 | **强确认**：必须回完整字符串 `confirm prod`（不接受 yes / y / 回车） |
| 三环境同时 | 同上强确认 |

强确认示例：

```
⚠️ 即将同时发布到 prod-us 和 prod-eu

  prod-us:
    当前: 1.1.0-a778bfe9
    目标: 1.2.0-b3b3fba6
  prod-eu:
    当前: 1.1.0-a778bfe9
    目标: 1.2.0-b3b3fba6

请回完整字符串 "confirm prod" 继续，回其他取消。
```

## 版本号交互流程（核心）

**期望体感**：

> AI 报当前线上版本 → AI 给推荐 + 让用户挑/自定义 → 用户输入 base semver（如 `1.2.0`） → AI 自动拼接当前 staging HEAD short sha

### Step A：查当前线上版本（必做）

```bash
# 读 staging-us ConfigMap 当前 SMART_POPUP_ENGINE_VERSION
glab api "/projects/services%2Fcustomer-care/repository/files/k8s%2Fapi%2Foverlays%2Fstaging-us%2Fruntime%2Fconfigmap.yaml/raw?ref=staging" \
  --hostname gitlab.addx.ai | grep "SMART_POPUP_ENGINE_VERSION"

# 形如 "SMART_POPUP_ENGINE_VERSION: \"1.1.0-a778bfe9\""
# 解析 base = "1.1.0", last_sha = "a778bfe9"
```

如果当前空（首次发布）→ base 用 `personalization_engine/package.json` 的 version。

### Step B：拿 staging HEAD short sha（必做，等会拼接用）

```bash
glab api "/projects/services%2Fcustomer-care/repository/branches/staging" \
  --hostname gitlab.addx.ai | python3 -c "
import json,sys; print(json.load(sys.stdin)['commit']['short_id'][:8])"
# 输出形如 "b3b3fba6"
```

### Step C：扫描自上次发布以来的 commit 推断推荐 bump

```bash
glab api "/projects/services%2Fcustomer-care/repository/compare?from=$LAST_SHA&to=staging&straight=true" \
  --hostname gitlab.addx.ai
```

按 Conventional Commits 规则推断：

| Commit prefix | bump 级别 |
|---|---|
| `<type>!:` 或 body 含 `BREAKING CHANGE:` | **major** |
| `feat:` / `feat(...)` | **minor** |
| 其他（fix/perf/refactor/chore/docs/test）| **patch** |

取 commit 列表里**最高级别**作为推荐 bump。只看触及 `personalization_engine/` 路径的 commit。

### Step D：展示对话框（这是用户实际看到的）

```
📦 SmartPopup Engine 当前状态

  staging-us 线上版本：1.1.0-a778bfe9
  staging 分支 HEAD：b3b3fba6（personalization_engine/ 自上次发布有 4 个 commit）

  自上次发布以来的相关变更：
    feat(fact): add bucketed_window_counter operator    [minor]
    fix(jsonlogic): handle null in eq                    [patch]
    feat(fatigue): add max_impressions_per_day           [minor]
    chore: bump deps                                     [patch]

  根据 Conventional Commits 最高级别为 feat → 推荐 bump: minor

  请选择新版本号：
    [1] 1.2.0-b3b3fba6  ← 推荐 (minor)
    [2] 1.1.1-b3b3fba6      (patch)
    [3] 2.0.0-b3b3fba6      (major)
    [4] 自定义 base，回 base semver（如 "2.5.0"），AI 自动拼 sha 成 "2.5.0-b3b3fba6"
    [5] 完整自定义，回完整版本（如 "1.5.0-aabbccdd"），不动 sha

  也可以回 cancel 取消。
```

### Step E：解析用户回复

| 用户回复 | 解释 |
|---|---|
| `1` / `推荐` / `yes` / 直接回车 | 用推荐版本号 |
| `2` / `patch` | 用 patch bump |
| `3` / `major` | 用 major bump |
| `1.2.3` 形式（纯 semver） | 当作 base，**自动拼 staging HEAD sha**：`1.2.3-b3b3fba6` |
| `1.2.3-aabbccdd` 形式（已含 sha） | 完整版本，不再拼接 |
| `cancel` / `no` | 终止，不做任何改动 |

⚠️ **关键**：如果用户回纯 semver（无 `-` 后缀），**自动拼接 Step B 得到的 staging HEAD short sha**。这是用户最高频的输入方式——只想说"我决定下一个是 2.5.0"，不关心 sha。

```python
def normalize_version(user_input: str, head_sha: str) -> str:
    if "-" in user_input and len(user_input.split("-")[1]) >= 7:
        # 已含 sha，原样用
        return user_input
    else:
        # 纯 semver，拼 HEAD sha
        return f"{user_input}-{head_sha}"
```

### Step F：版本号已构建？

检查 GitLab Generic Package Registry 是否有这个完整版本号：

```bash
glab api "/projects/services%2Fcustomer-care/packages?package_name=smart-popup-engine&per_page=100" \
  --hostname gitlab.addx.ai | python3 -c "
import json,sys
versions = [p['version'] for p in json.load(sys.stdin)]
target = '$NEW_VERSION'
print('FOUND' if target in versions else 'MISSING')
"
```

| 检查结果 | 行为 |
|---|---|
| ✅ 已构建 | 直接进"执行流程 Step 4"展示发布摘要让用户最终确认 |
| ❌ 未构建 | 走"未构建版本引导流程"（下一节）|

## 未构建版本引导流程

新 base（如 1.2.0）在 Registry 里没对应 bundle → CI 还没构建过 → 必须先让 CI 构建。

```
⚠️ 1.2.0-b3b3fba6 还没构建（personalization_engine/package.json 当前 version: 1.1.0）

需要分两步：

Step 1（现在）：我帮你提个小 MR
  - 改 personalization_engine/package.json: "version": "1.1.0" → "1.2.0"
  - title: chore(engine): bump version to 1.2.0
  - description 列出推断依据 + 相关 commits

Step 2（你做）：review + merge 到 staging
  CI 自动跑 publish:engine-bundle 构建 1.2.0-<新 HEAD sha> bundle（~3 分钟）

Step 3（merge 后）：你再说"发布 engine"，我接着 bump ConfigMap

要提 Step 1 的 MR 吗？回 yes 继续。
```

用户 yes 后用 GitLab Files API PATCH `personalization_engine/package.json`，提 MR，**明确告知用户 merge 后回来再喊一次发布命令**。

⚠️ Step 2 merge 之后 staging HEAD sha 会变（变成 bump-version MR 的 merge commit sha），用户回来时 Step B 会拿到新 sha——这正是我们要的。

## 用户给定版本号的旁路

用户**指令中已显式给完整版本号**（如 "发布 1.1.0-2d957524" 或 "回滚到 0.2.0-a778bfe9"）→ 跳过 Step C/D/E 的推荐流程，直接进 Step F 验证版本是否存在。这种情况通常用于：

- 回滚到历史版本
- 指定特定 sha 的已构建 bundle
- 重发已存在的 bundle 到新环境（多环境同步）

## 执行流程

### Step 1：解析版本号 + 目标环境

```bash
# 拿 staging HEAD short sha
glab api "/projects/services%2Fcustomer-care/repository/branches/staging" \
  --hostname gitlab.addx.ai | python3 -c "import json,sys;print(json.load(sys.stdin)['commit']['short_id'][:8])"
```

如果用户给 `1.1.0` 而非 `1.1.0-<sha>`，拼接 staging HEAD sha 得到完整版本号。

### Step 2：验证 bundle 已存在于 GitLab Package Registry

```bash
# 列出所有 engine bundle 版本，确认目标版本存在
glab api "/projects/services%2Fcustomer-care/packages?package_name=smart-popup-engine&per_page=100" \
  --hostname gitlab.addx.ai
```

如果目标版本**不存在**（比如用户报了一个还没构建的版本号）：

- 检查 `personalization_engine/package.json` 当前 version 是不是这个值
- 如果不是 → 告诉用户："版本 X 还没构建。先把 `personalization_engine/package.json` 的 version 改成 X，merge 到 staging，等 CI 跑完 publish:engine-bundle 后再回来。"
- 不要硬填一个不存在的版本到 ConfigMap（pod 启动会拉失败）

### Step 3：拉 manifest 提取 URL + SHA256

找到对应版本的 `publish:engine-bundle` job，下载 `manifest/engine_manifest.json` artifact：

```bash
# 找 publish:engine-bundle job id（按 commit sha 匹配 staging push pipeline）
PIPELINE_ID=$(glab api "/projects/services%2Fcustomer-care/pipelines?ref=staging&sha=<full_sha>" \
  --hostname gitlab.addx.ai | python3 -c "import json,sys;print(json.load(sys.stdin)[0]['id'])")

JOB_ID=$(glab api "/projects/services%2Fcustomer-care/pipelines/$PIPELINE_ID/jobs?per_page=100" \
  --hostname gitlab.addx.ai | python3 -c "
import json,sys
for j in json.load(sys.stdin):
    if j['name']=='publish:engine-bundle': print(j['id']); break")

# 取 manifest artifact
glab api "/projects/services%2Fcustomer-care/jobs/$JOB_ID/artifacts/manifest/engine_manifest.json" \
  --hostname gitlab.addx.ai
```

manifest 内容形如：
```json
{
  "version": "0.2.0-a778bfe9",
  "url": "https://gitlab.addx.ai/api/v4/projects/1327/packages/generic/smart-popup-engine/0.2.0-a778bfe9/smart_popup_engine.js",
  "sha256": "f7b701ac9bfe8c1b787b75e5f0e1ab6d2f61c82b8c9f8d4d00f5b20fa3ea89af"
}
```

如果 job log 拿不到 manifest（artifact 已过期，>90 天），fallback：自己拼 URL + 通过 `curl <url>` 下载 .js 算 sha256。

### Step 3.5（v3.8 起）：调 admin publish-engine 把 bundle 上传到公网 S3

**为什么要做这步**：v3.7 ConfigMap 配的是 GitLab Generic Package Registry URL（内网域名 `gitlab.addx.ai`），App 公网拉不到 → SDK 远端引擎热更新静默失败。v3.8 起改用公网 S3 bucket（`customer-care-engine-{env}-{region}`），但 bundle 不会自动从 GitLab 同步过去——必须显式调 admin endpoint 让 admin Pod（IRSA）拉 GitLab → 上传 S3。

详见 `docs/architecture/smart_popup/backend-engine-bundle.md §发布渠道（v3.8 公网 S3 CDN）`。

```bash
# operator's GitLab PAT（read_api scope），release-engine 流程现场拿，不存 Vault
GITLAB_TOKEN_FOR_PUBLISH="<your-PAT>"

# admin host 按目标环境
case "$TARGET_ENV" in
  staging-us) ADMIN_HOST="https://customer-care-admin-staging.addx.live" ;;
  prod-us)    ADMIN_HOST="https://customer-care-admin.addx.live" ;;
  # staging-eu / prod-eu overlays not deployed yet — add when EU rolls out.
esac

# 上传 bundle 到 S3（admin endpoint 当前无鉴权 middleware，直接 POST 即可；
# 真要加鉴权由后续 service-token 机制接管，详见 backend-engine-bundle.md）
RESP=$(curl -sS -X POST "$ADMIN_HOST/api/admin/publish-engine" \
  -H "Content-Type: application/json" \
  -d "{
    \"version\": \"$VERSION\",
    \"gitlab_url\": \"$GITLAB_URL\",
    \"sha256\": \"$SHA256\",
    \"gitlab_token\": \"$GITLAB_TOKEN_FOR_PUBLISH\"
  }")
echo "$RESP" | python3 -m json.tool

# 期望响应（成功）：
# {
#   "bucket": "customer-care-engine-staging-us",
#   "key": "1.1.0-a778bfe9/smart_popup_engine.js",
#   "public_url": "https://customer-care-engine-staging-us.s3.us-east-1.amazonaws.com/1.1.0-a778bfe9/smart_popup_engine.js",
#   "size": 143820,
#   "sha256": "f7b701ac...",
#   "skipped": false
# }

# 取出 public_url 后续 Step 4/6 使用
S3_URL=$(echo "$RESP" | python3 -c "import json,sys;print(json.load(sys.stdin)['public_url'])")
```

**幂等性**：同 version + 同 sha256 重复调，admin 端 `HeadObject` 检测到已存在直接 skip，不重复上传。

**鉴权**：admin endpoint 目前无 middleware，直接 POST。后续若加 service-token 机制再回来更新本节。

**失败处理**：
- 400 sha256 mismatch：GitLab 上 bundle 已被改 / sha256 错传 → 检查 manifest
- 500 GitLab fetch failed：GitLab Token 无权限 / 网络异常 → 检查 token scope
- 500 Missing engine bucket config：admin pod 没注入 `ENGINE_BUCKET` env → 检查 overlay configmap

### Step 4：展示给用户确认

发布前 **必须** 给用户看完整摘要让 review：

```
即将发布 SmartPopup engine：

VERSION:  1.1.0-a778bfe9
URL (S3): https://customer-care-engine-staging-us.s3.us-east-1.amazonaws.com/1.1.0-a778bfe9/smart_popup_engine.js
        ↑ Step 3.5 已上传到公网 S3
SHA256:   f7b701ac9bfe8c1b787b75e5f0e1ab6d2f61c82b8c9f8d4d00f5b20fa3ea89af

环境：     staging-us
预期改动：
  - k8s/api/overlays/staging-us/runtime/configmap.yaml（3 个字段）
  - k8s/api/base/rollout.yaml（rollout-trigger 注解）
分支：     auto/engine-bump-1.1.0-a778bfe9
目标分支： staging
方式：     提 MR 等用户 merge

确认继续？
```

用户回答"继续"或"yes"才进 Step 5。

### Step 5：选定分支基底（按目标环境分流）

| 目标环境 | source branch（基底）| target branch（merge 到）|
|---|---|---|
| `staging-us` | `staging` | `staging` |
| `prod-us` | `master` | `master` |
| `prod-eu` | `master` | `master` |
| `staging-us` + prod 任一 | **不允许混合**——分两个 MR 提，先 staging 再 prod |
| prod-us + prod-eu | `master` | `master` |

```bash
# staging 发布
SOURCE_BASE="staging"
TARGET_BRANCH="staging"

# prod 发布（任意 prod 环境）
SOURCE_BASE="master"
TARGET_BRANCH="master"

# 新分支名
NEW_BRANCH="auto/engine-bump-${VERSIONED}-${ENV}"
# 例：auto/engine-bump-1.1.0-a778bfe9-staging-us
#     auto/engine-bump-1.1.0-a778bfe9-prod
```

⚠️ staging 和 prod 不能在一个 MR 里——分支基底不同，且 prod 需要 master 已经包含 staging 验证过的 commit。如果用户要"全环境同步"，AI **顺序提两个 MR**：第一个 staging，第二个 prod，prod 那条等 staging 那条 merge 完再创建。

### Step 6：通过 GitLab API 直接 PATCH 文件（不 clone 仓库）

```bash
# 1. 创建新分支
glab api --method POST \
  "/projects/services%2Fcustomer-care/repository/branches" \
  --hostname gitlab.addx.ai \
  -f branch="$NEW_BRANCH" \
  -f ref="$SOURCE_BASE"

# 2. 拉当前 configmap.yaml 内容
CURRENT=$(glab api \
  "/projects/services%2Fcustomer-care/repository/files/k8s%2Fapi%2Foverlays%2F${ENV}%2Fruntime%2Fconfigmap.yaml/raw?ref=$NEW_BRANCH" \
  --hostname gitlab.addx.ai)

# 3. 本地用 sed/yq 改 3 个字段得到 NEW（保留 yaml 注释和缩进）

# 4. PUT 回 ConfigMap
glab api --method PUT \
  "/projects/services%2Fcustomer-care/repository/files/k8s%2Fapi%2Foverlays%2F${ENV}%2Fruntime%2Fconfigmap.yaml" \
  --hostname gitlab.addx.ai \
  -f branch="$NEW_BRANCH" \
  -f content="$NEW" \
  -f commit_message="chore(engine): bump ${ENV} to ${VERSIONED} [skip ci]"

# 5. 同样 PATCH k8s/api/base/rollout.yaml 的 rollout-trigger 注解
#    值用 "engine-bump-${VERSIONED}-$(date +%Y%m%d-%H%M%S)"

# 6. 创建 MR
MR_JSON=$(glab api --method POST \
  "/projects/services%2Fcustomer-care/merge_requests" \
  --hostname gitlab.addx.ai \
  -f source_branch="$NEW_BRANCH" \
  -f target_branch="$TARGET_BRANCH" \
  -f title="chore(engine): bump ${ENV} to ${VERSIONED}" \
  -f description="..." \
  -f remove_source_branch=true \
  -f squash=true)

MR_IID=$(echo "$MR_JSON" | python3 -c "import json,sys;print(json.load(sys.stdin)['iid'])")
MR_URL=$(echo "$MR_JSON" | python3 -c "import json,sys;print(json.load(sys.stdin)['web_url'])")
```

`commit_message` **必须包含 `[skip ci]`**——避免 ConfigMap 改动 commit 触发新一轮 publish:engine-bundle 循环。

### Step 7：MR 创建完成 → 立刻给用户反馈

```
✅ MR 已创建：https://gitlab.addx.ai/services/customer-care/-/merge_requests/XXX

  分支基底：staging（staging-us 发布）  ← 或 master（prod 发布）
  目标分支：staging
  
  变更摘要：
    ConfigMap：staging-us
      SMART_POPUP_ENGINE_VERSION: "" → "1.1.0-a778bfe9"
      SMART_POPUP_ENGINE_URL:     "" → "..."
      SMART_POPUP_ENGINE_SHA256:  "" → "f7b701ac..."
    Rollout：
      kiwibit.a4x.io/rollout-trigger: "..." → "engine-bump-1.1.0-a778bfe9-20260426-001234"

接下来 AI 自动执行：
  → approve MR
  → 启用 auto-merge（pipeline 通过即合）
  → 监控 pipeline 进度，每 30s 反馈
```

**这条反馈不要等后续步骤完成才发**——MR URL 立刻给到用户，让用户能并行点开看 diff。

### Step 8：尝试 approve MR（可能失败，不阻塞）

```bash
glab api --method POST \
  "/projects/services%2Fcustomer-care/merge_requests/${MR_IID}/approve" \
  --hostname gitlab.addx.ai
```

⚠️ **当前 GitLab 设置下 author 无法 approve 自己的 MR**（"Prevent approval by author" 启用时返回 401）。

应对：approve 失败**不阻塞流程**——直接进 Step 9 的"直接 merge"路径（项目 `approvals_before_merge=None`，没硬性 approval 要求）。

⚠️ **prod 环境不要尝试 auto-approve / direct merge**：

| 环境 | 自动 approve | 自动 merge |
|---|---|---|
| `staging-us` | 尝试 → 失败也无所谓 | ✅ 直接 merge |
| `prod-us` | ❌ 不尝试 | ❌（必须人工 approve + merge） |
| `prod-eu` | ❌ 不尝试 | ❌ |

如果用户希望 prod 也自动 merge，必须在指令里**显式说** `prod 自动 merge` 或 `--auto-merge`，否则 skill 默认只走到"创建 MR + 通知用户"。

### Step 9：merge 策略（直接 merge，不要用 auto-merge）

⚠️ **重要发现**：纯 `k8s/**` 路径改动**不会触发任何 CI job**（`.gitlab-ci.yml` 里所有 job 的 `rules` 都要求 `personalization_engine/` / `admin/` / `cmd/` / `internal/` 等业务路径改动），导致：

- MR pipeline 状态 = `skipped`（[skip ci] 时）或 `failed`（无 [skip ci] 但 0 job 可执行时）
- `merge_when_pipeline_succeeds=true` 永远等不到 success → MR 卡住

**所以 staging-us 不要用 auto-merge，直接 merge**：

```bash
glab api --method PUT \
  "/projects/services%2Fcustomer-care/merge_requests/${MR_IID}/merge" \
  --hostname gitlab.addx.ai \
  -f should_remove_source_branch=true \
  -f squash=true \
  -f squash_commit_message="chore(engine): bump <env> to <version>"
```

⚠️ **squash_commit_message 不要带 `[skip ci]`**——squash 后会作为 push 到 staging 的 commit message。如果带 [skip ci]，staging branch push pipeline 也会跳过；不带的话会创建一个 0-job 的 "failed" pipeline（GitLab UX quirk，不阻塞 ArgoCD）。两种都不影响部署，但**0-job failed 会让团队误以为部署出问题**。

### 关于 commit message [skip ci] 的取舍

skill 在 Step 6 PUT files 时使用 `[skip ci]`，原因 + 影响：

| 场景 | 含 [skip ci] | 不含 |
|---|---|---|
| Step 6 第一次 PUT configmap.yaml | branch 上的 commit pipeline 被 skip 掉，省 publish:engine-bundle 重复构建 | publish:engine-bundle 跑 → 把同样 sha256 的 bundle 重新 push 到 Registry（idempotent，浪费几分钟）|
| Step 6 第二次 PUT rollout.yaml | 同上 | 同上 |
| Step 9 squash merge 到 staging branch | staging push pipeline 被 skip → ArgoCD 仍能 sync，但 smoke:patrol 等保护性 job 也被跳过 | 0-job pipeline failed（无害但难看）|

**当前 skill 选择**：Step 6 的 commits 用 `[skip ci]`，Step 9 squash message **不要 [skip ci]**。

未来改进方向（不属于 skill 自身，需要改 .gitlab-ci.yml）：
- 给 `k8s/**` 路径加一条 rule：触发 `kustomize build` 验证 + `smoke:patrol` smoke test
- 这样 ConfigMap 改动也能跑保护性 job，可以放心用 auto-merge

### Step 10：监控 staging branch push pipeline（merge 后自动触发）

直接 merge 后，GitLab 会基于 squash commit 在 staging branch 上**自动创建一条 push pipeline**。

```bash
# merge 完成后等 5 秒，让 push pipeline 创建
sleep 5
PIPELINE_ID=$(glab api "/projects/services%2Fcustomer-care/pipelines?ref=staging&per_page=1" \
  --hostname gitlab.addx.ai | python3 -c "
import json, sys
ps = json.load(sys.stdin)
print(ps[0]['id'] if ps else '')")
```

⚠️ **如果 pipeline 是 `skipped`（含 [skip ci]）或 `failed` 且 0 jobs（empty pipeline）**：

```python
# 立即识别 + 报告，不要轮询
if status in ('skipped', 'failed') and not jobs:
    report(f"""
    Pipeline {id} 状态：{status}（无 job 可执行 — k8s/** 改动 .gitlab-ci.yml 没匹配 rule）
    
    这不影响 ArgoCD 部署：
    - ArgoCD 监听 git，独立于 CI
    - 几分钟内会 sync staging-us
    - smoke:patrol 等保护 job 没跑（接受这个风险，或后续改进 ci 加 k8s/** rule）
    """)
    # 跳过监控，直接进 Step 12 终态汇报
```

只有当 pipeline 真正在跑（含 jobs）时才进入下面的轮询逻辑。

### Step 11：轮询 pipeline 进度（仅当 pipeline 真在跑）

获取 MR 关联的 pipeline：

```bash
glab api "/projects/services%2Fcustomer-care/merge_requests/${MR_IID}" \
  --hostname gitlab.addx.ai | python3 -c "
import json,sys
d=json.load(sys.stdin)
print(d['head_pipeline']['id'] if d.get('head_pipeline') else '')"
```

循环轮询 pipeline 状态：

```python
# 伪代码
while True:
    pipeline = glab_api(f"/projects/.../pipelines/{pipeline_id}")
    jobs = glab_api(f"/projects/.../pipelines/{pipeline_id}/jobs")
    
    status = pipeline['status']  # running / success / failed / canceled / skipped
    
    if status in ('success', 'failed', 'canceled', 'skipped'):
        # 终态，退出循环
        break
    
    # 进行中，给用户进度反馈
    summary = summarize_jobs(jobs)
    report_to_user(summary)
    
    sleep(30)

# 终态汇报
final_report(status, jobs, mr_status)
```

**每 30s 反馈格式（运行中）**：

```
⏳ Pipeline 36789 进行中（已运行 1m20s）

  ✅ ci:init                        7s
  ✅ deps:engine                   29s
  ✅ api:lint                      45s
  🟢 api:test                      running... (已 30s)
  🟢 test:engine:js                running... (已 18s)
  ⚪ admin:build                    pending
  ⚪ admin:test                     pending
  ⚪ smoke:patrol: [staging-us]     pending

下次反馈：30s 后 / 状态变化时
MR: https://...
```

**终态汇报**：

```
🎉 Pipeline 36789 SUCCESS（总耗时 4m12s）

  全部 12 个 job 通过：
    ✅ api:lint, api:test, admin:build, admin:test, ...
    ⚠️ api:lint:golangci (failed, allow_failure=true)

✅ MR 已自动 merge：https://gitlab.addx.ai/services/customer-care/-/merge_requests/XXX
✅ ArgoCD 即将自动 sync staging-us（约 2-3 分钟内 pod rolling restart）

后续验证（建议 5 分钟后操作）：
  - SDK 拉 getSmartPopupConfig 看 response 是否带 engine_update 字段
  - 看 backend pod 日志确认读到新的 SMART_POPUP_ENGINE_* env
  - 触发一次 SmartPopup 看是否走新 engine

出问题告诉我"回滚 engine 到 <旧版本>"。
```

**Pipeline 失败时**：

```
❌ Pipeline 36789 FAILED（运行 2m45s 后失败）

失败 job：
  ❌ api:test  
     log: https://gitlab.addx.ai/services/customer-care/-/jobs/XXXXX
     [tail of log: 30 行]

⚠️ MR 没有 merge（auto-merge 已自动取消）。

可选操作：
  1. 看 log 修复后说"重跑 pipeline"
  2. 关闭 MR：说"关闭 MR XXX"
  3. 查问题：说"分析 pipeline 失败"
```

### Step 12（可选）：进度反馈方式

主交互模型：

- **不要让用户每次都说"看进度"**——AI 在 background 里轮询
- 用 `ScheduleWakeup` 工具每 30s 自唤醒一次给用户报进度（如果在 /loop 模式或者 ScheduleWakeup 可用）
- 如果环境不支持 wakeup，告诉用户"我会每 30s 报一次进度"，但实际只在用户下次输入时才检查（degrade 模式）

实现选择视当前 Claude Code 能力而定，skill 不做硬编码——**核心契约是"主动反馈进度，不让用户问"**。

## 多环境支持

用户说"发布到 staging-us 和 prod-us"或"同步到 prod-us / prod-eu"时：

- 单 MR 改多个 overlay 的 configmap.yaml（每个环境一个文件）
- rollout.yaml 的 trigger 注解只改一次（base 共用）
- MR title: `chore(engine): bump staging-us + prod-us to 1.1.0-a778bfe9`

**注意 prod 上线的前置条件**（参考 docs/deployment/engine-update-runbook.md 如有）：
- prod 集群 customer-care-api pod healthy
- Vault 已注入 `ZENDESK_WEBHOOK_SECRET`（如果同时跑 webhook 链路）
- APISIX 路由配置已就绪

不满足时**警告**用户但不阻塞——是否继续由用户决定。

## 回滚

"回滚 engine 到 <版本号>" → 完全相同流程，只是版本号变成历史值：

1. 校验 GitLab Registry 里这个版本还存在（默认保留 90 天，过期会失败）
2. 走相同的 Step 4 确认 + Step 5 提 MR 流程
3. MR title: `revert(engine): rollback staging-us to <旧版本>`

## 查询命令

### 查当前各环境 engine 版本

```bash
for env in staging-us prod-us prod-eu; do
  echo "=== $env ==="
  glab api "/projects/services%2Fcustomer-care/repository/files/k8s%2Fapi%2Foverlays%2F$env%2Fruntime%2Fconfigmap.yaml/raw?ref=staging" \
    --hostname gitlab.addx.ai | grep "SMART_POPUP_ENGINE"
done
```

### 列出所有可用 bundle 版本

```bash
glab api "/projects/services%2Fcustomer-care/packages?package_name=smart-popup-engine&order_by=created_at&sort=desc&per_page=20" \
  --hostname gitlab.addx.ai | python3 -c "
import json,sys
for p in json.load(sys.stdin):
    print(f\"  {p['version']:<32}  {p['created_at']}\")
"
```

## 安全规则

1. **永远不要 force push**——所有改动通过新分支 + MR
2. **永远不要直接 push 到 staging / master**——必须经过 MR
3. **commit message 必须有 `[skip ci]`**——避免循环
4. **prod 环境发布前必须二次确认**——告知用户这是 prod，让用户回 yes/no 才继续
5. **不能 bump 到不存在的版本**——必先验证 Generic Package Registry 里有该版本
6. **manifest sha256 与 registry sha256 必须一致**——两边都查一遍，不一致就告诉用户并停止
7. **不修改用户的 GitLab 配置 / token**——只用现有 `GITLAB_TOKEN` 环境变量

## 例子

### 例 1：标准发布

```
用户：发布 engine 1.1.0

AI（Step 1-3）：
  staging HEAD sha = a778bfe9
  完整版本号 = 1.1.0-a778bfe9
  GitLab Registry 检查：✅ 存在
  从 manifest 提取：
    URL    = https://gitlab.addx.ai/.../smart-popup-engine/1.1.0-a778bfe9/smart_popup_engine.js
    SHA256 = f7b701ac9bfe...

AI（Step 4 给用户看摘要）：
  即将发布 1.1.0-a778bfe9 到 staging-us，确认？

用户：yes

AI（Step 5-6）：
  ✅ MR 已提：https://gitlab.addx.ai/services/customer-care/-/merge_requests/280
  请 review + merge
```

### 例 2：用户给完整版本号（回滚或选定 sha）

```
用户：回滚 engine 到 0.2.0-2d957524

AI：
  GitLab Registry 检查：✅ 存在（1 天前发布）
  manifest sha256 = 9c4f...
  即将回滚 staging-us 到 0.2.0-2d957524，确认？
```

### 例 3：版本号未构建

```
用户：发布 engine 2.0.0

AI：
  staging HEAD sha = a778bfe9
  目标版本 2.0.0-a778bfe9 在 GitLab Registry **不存在**
  
  原因：personalization_engine/package.json 当前 version 是 1.1.0
  
  建议：
    1. 改 personalization_engine/package.json 的 version 为 2.0.0
    2. 提 MR merge 到 staging
    3. 等 CI 跑完 publish:engine-bundle (~3 分钟)
    4. 回来再说"发布 engine 2.0.0"
  
  要我帮你提 step 1-2 的 MR 吗？
```

### 例 4：多环境同步

```
用户：把 engine 1.1.0 同步到 prod-us 和 prod-eu

AI：
  ⚠️ prod 环境发布注意事项：
  - 改动会影响所有线上用户
  - 当前 prod-us 版本：(查到) 1.0.5-xxxxxxxx
  - 当前 prod-eu 版本：(查到) 1.0.5-xxxxxxxx
  - 升级到：1.1.0-a778bfe9
  
  确认升级 prod？回 yes 继续，回其他取消。

用户：yes

AI：
  ✅ MR 已提：.../merge_requests/281
  改动 2 个 overlay configmap + 1 个 rollout.yaml
  请 review + merge
```

## 失败兜底

任何步骤失败：

- **告知具体哪一步失败 + 为什么**（GitLab API 返回的错误 body）
- **推荐 fallback 路径**：方案 C 手动复制粘贴（参考 .gitlab-ci.yml `publish:engine-bundle` job log 末尾的 echo 输出）
- **不留半途状态**：如果分支已创建但 PUT 文件失败，删除分支 → 让用户从 0 开始

```bash
# 清理半成品分支
glab api --method DELETE \
  "/projects/services%2Fcustomer-care/repository/branches/auto%2Fengine-bump-X" \
  --hostname gitlab.addx.ai
```

## 参考文档

- ConfigMap 字段语义：`k8s/api/overlays/staging-us/runtime/configmap.yaml` 注释
- publish:engine-bundle job：`.gitlab-ci.yml` 的 `engine-publish-only` rules 段
- 安全模型（TLS + sha256）：`docs/architecture/smart_popup/backend-engine-bundle.md`
- Engine 升级 runbook：`docs/deployment/engine-update-runbook.md`
- SDK 下载链路：`app/smart_popup_sdk/lib/src/js_engine_loader.dart`