---
name: add-language
description: 为 Android 项目新增一种国际化语言支持。用户只需提供中文语言名（如"马来语"），自动推断语言代码、国家代码、原生名称，完成 build.gradle、LanguageUtils.java、str_arrays.xml 的代码注册。对于 Java/Android 旧语言代码不一致的语言，还会处理 ApiClient、LanguageAdapter、LanguageUtils 中的映射。
compatibility: Designed for Claude Code (or similar products)
allowed-tools: Bash Read Edit
metadata:
  author: g0-android-team
  version: "1.0"
---

# 新增国际化语言

## 触发条件

当用户要求新增一种语言时使用此 skill。用户只需提供中文语言名，如"马来语"、"泰语"。

## 执行步骤

### Step 1: 推断语言信息

根据用户提供的中文语言名，推断以下信息：
- **语言代码**（ISO 639-1/639-2），如 `ms`、`fil`、`th`
- **国家/地区代码**（大写），如 `MY`、`PH`、`TH`
- **原生语言名称**（该语言母语者使用的名称），如 `Bahasa Melayu`、`Filipino`

如果语言名有歧义，向用户确认。

### Step 2: 判断是否需要特殊处理

检查该语言是否存在 **Java/Android 旧语言代码与 ISO 标准不一致** 的情况。已知需要特殊处理的语言：

| 语言 | Java 旧代码 | ISO 标准代码 | 说明 |
|------|-----------|-------------|------|
| 希伯来语 | `iw` | `he` | Android SDK 34 及以下返回 `iw` |
| 印尼语 | `in` | `id` | Java Locale 历史上使用 `in` |
| 繁体中文 | `tw` | `zh-Hant` | 应用内部约定 |

如果新增语言存在类似的代码不一致问题，需要额外修改映射文件（见 Step 3b）。

如果不确定是否需要特殊处理，**反问用户确认**。

### Step 3a: 常规改动（每次必改）

按照 [references/REFERENCE.md](references/REFERENCE.md) 修改以下 3 个文件：

1. **`app/build.gradle`** — `resConfigs` 添加语言代码
2. **`Base/BaseCore/src/main/java/com/ai/addxbase/LanguageUtils.java`** — `defaultLocales` 添加 `new Locale()`（放在 kiwibit 条件内）
3. **`app/src/main/res/values/str_arrays.xml`** — 添加原生语言名称字符串

### Step 3b: 特殊处理（仅部分语言需要）

如果 Step 2 判定需要特殊处理，还需修改以下文件中的映射逻辑：

4. **`Base/BaseCore/src/main/java/com/ai/addxnet/ApiClient.java`** — `getProtolLanguage()` 方法
5. **`app/.../appSetting/LanguageAdapter.java`** — `adapterLanguageForAndroidSDK()` 方法
6. **`Base/BaseCore/src/main/java/com/ai/addxbase/LanguageUtils.java`** — `getSupportLocalBySaveLocalToFlutter()` 方法

### Step 4: 执行翻译脚本

执行以下命令拉取翻译资源生成 `values-{lang}/strings.xml`：

```bash
cd crowdin && ./auto_l10n.sh config/vh_android_dev.json
```

### Step 5: 验证

- 确认 `ResModule/src/main/res/values-{lang}/strings.xml` 已生成
- 确认 `build.gradle` 的 `resConfigs` 包含新语言代码

## 注意事项

- 新语言默认放在 `if (!"kiwibit".equals(BuildConfig.tenantId))` 条件内
- `build.gradle` 中印尼语使用 `"in"` 而非 `"id"`（Java 旧标准），新语言如无特殊情况直接用 ISO 标准代码
- `resConfigs` 中 kiwibit 和非 kiwibit 两行需分别确认是否添加
