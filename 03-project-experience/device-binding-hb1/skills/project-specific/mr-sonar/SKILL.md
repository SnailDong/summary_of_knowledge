---
name: mr-sonar
description: 执行 SonarQube MR 扫描，自动修复代码质量问题（覆盖率、安全、Issues、复杂度）并循环验证直到通过
disable-model-invocation: true
allowed-tools: Bash, Edit, Read, Write, Grep, Glob
argument-hint: "[--modules=mod1,mod2]"
---

# SonarQube MR 扫描 & 自动修复

你的任务是执行 SonarQube 扫描，并根据结果自动修复代码质量问题。

## 前置条件检查

开始前确认：
1. 当前分支已有对应的 GitLab MR（脚本依赖 MR 进行 Pull Request Analysis）
2. 环境变量 `SONAR_TOKEN` 已设置

通过以下命令检查 MR 是否存在：
```bash
glab mr list --source-branch "$(git rev-parse --abbrev-ref HEAD)" --output json | jq -r '.[0].iid // empty'
```
如果返回为空，提示用户先创建 MR 或手动执行 `./mr-sonar.sh` 完成 MR 创建后再使用本 Skill。

## Step 1：执行扫描

运行扫描脚本（注意设置 **600 秒超时**，扫描耗时较长）：
```bash
./mr-sonar.sh $ARGUMENTS
```

捕获退出码和输出。脚本输出包含：
- Quality Gate 状态
- Coverage（覆盖率）
- New Issues（新增问题数）
- Security Hotspots（安全热点）
- Duplications（重复代码）
- SonarQube Report Link

## Step 2：判断结果

**退出码为 0**（Quality Gate 通过）→ 报告成功，结束。

**退出码非 0**（Quality Gate 未通过）→ 展示扫描摘要，询问用户：
```
扫描未通过，是否自动修复？
[1] 退出
[2] 自动修复所有问题
请选择 [1/2]:
```

用户选择 1 → 结束。
用户选择 2 → 进入 Step 3 自动修复循环。

## Step 3：自动修复循环（最多 3 轮）

进入循环后**不再需要用户交互**，全自动执行直到通过或达到最大轮次。

### 3a. 收集问题详情

获取 MR IID：
```bash
MR_IID=$(glab mr list --source-branch "$(git rev-parse --abbrev-ref HEAD)" --output json | jq -r '.[0].iid')
```

**并行收集以下信息**：

1. **未覆盖代码**：执行 `./mr-sonar-uncovered.sh $MR_IID` 获取未覆盖的具体文件、行号和代码片段

2. **Issues 列表**：
```bash
curl -s -u "$SONAR_TOKEN:" "https://sonarqube.addx.live/api/issues/search?componentKeys=SWCLIEN_g0-android_4058ac46-c24f-4256-9820-4e8913e2f1e0&pullRequest=$MR_IID&resolved=false&ps=50"
```

3. **Security Hotspots**：
```bash
curl -s -u "$SONAR_TOKEN:" "https://sonarqube.addx.live/api/hotspots/search?projectKey=SWCLIEN_g0-android_4058ac46-c24f-4256-9820-4e8913e2f1e0&pullRequest=$MR_IID&status=TO_REVIEW&ps=50"
```

### 3b. 修复代码

根据收集到的信息，按优先级修复：

#### 安全问题（Security Hotspots / Vulnerability）
- 读取对应源码，理解安全风险
- 修复漏洞（硬编码密码、SQL 注入、不安全的加密等）

#### Bug
- 根据 issue 的 `component`、`line`、`message`、`rule` 定位
- 读取源码并修复

#### 覆盖率不足
- 根据 `mr-sonar-uncovered.sh` 输出的未覆盖行和代码片段
- 读取对应源码文件，理解业务逻辑
- 在对应模块的 `src/test/` 目录下编写或补充单元测试
- 测试遵循 Arrange → Act → Assert 模式

#### Code Smell / 高复杂度
- 提取子方法、简化条件分支、降低圈复杂度

#### 覆盖率排除规则（不要为以下类型写测试）
以下类型已在 Sonar 配置中排除，不计入覆盖率，**无需编写测试**：
- `*Activity`、`*Fragment`、`*Dialog`、`*View`、`*Adapter`、`*Service`
- `*Entity`、`*Response`、`*Request`（数据类）
- `**/generated/**`、`**/databinding/**`
- `**/R.class`、`**/BuildConfig.*`

### 3c. 重新扫描

扫描基于本地代码，**无需 commit/push** 即可重新扫描验证：
```bash
# 直接重新扫描（600 秒超时）
./mr-sonar.sh
```

- **通过** → 进入 3d 提交代码
- **未通过且是质量门失败** → 自动进入下一轮（不询问用户），回到 3a
- **未通过且是编译/测试错误** → 先修复编译/测试错误，再重新扫描

### 3d. 扫描通过后 Code Review

扫描通过后，**不要提交、不要推送**，代码保留在本地供研发人员查看。执行以下 Code Review：

1. **列出所有修改文件**：
```bash
git diff --stat
```

2. **逐文件审查**，对每个修改的文件输出：
   - 修改摘要（改了什么、为什么改）
   - 代码质量评估（命名、逻辑、可读性）
   - 潜在风险点

3. **安全风险评估**，重点检查：
   - 是否引入新的安全漏洞（注入、硬编码凭据、不安全的加密等）
   - 新增测试是否泄露敏感信息（测试数据中的密钥、密码等）
   - 权限或访问控制是否受影响

4. **输出 Review 报告**，格式：
```
══ Code Review 报告 ══

📄 修改文件清单
  - path/to/file1.kt（修复 Bug / 补充单测 / ...）
  - path/to/file2.kt（...）

🔍 逐文件审查
  [文件路径]
    修改内容：...
    质量评估：...
    风险点：...

🔒 安全风险评估
  风险等级：低 / 中 / 高
  详情：...

💡 建议
  - ...
```

5. **提示用户**：代码已保留在本地，请 review 后自行决定是否提交推送。

### 3e. 超过最大轮次

3 轮修复后仍未通过：
- 展示剩余未解决的问题摘要
- 对已修改的代码同样执行上述 Code Review
- 输出 SonarQube 报告链接
- 建议用户人工介入

## 注意事项

- `./mr-sonar.sh`、`./mr-sonar-uncovered.sh`、`./gradlew` 等命令耗时较长，Bash 执行时务必设置 `timeout: 600000`（10 分钟）
- 修复代码时只改动 MR 涉及的变更文件范围内的代码，不要大范围重构
- 补充的测试代码本身也会被扫描，确保测试代码质量
- 补充单测前先阅读同模块已有的测试文件，保持风格一致（测试框架、Mock 方式、命名规范等）
- 区分扫描失败原因：编译/测试错误 vs 质量门未通过，处理方式不同
