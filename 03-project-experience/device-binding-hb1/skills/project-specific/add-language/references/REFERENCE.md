# 新增语言 - 文件修改参考

以下用 `{lang}` 表示语言代码（如 `ms`），`{COUNTRY}` 表示国家代码（如 `MY`），`{中文名}` 表示中文名（如 `马来语`），`{nativeName}` 表示原生名称（如 `Bahasa Melayu`）。

---

## 常规改动（每次必改）

### 1. app/build.gradle

在 `resConfigs` 的非 kiwibit 行末尾追加语言代码：

```groovy
resConfigs "en","zh","tw","de","es","fr","it","ja","ru","fi","iw","ar","vi","pt","pl","tr","cs","ko","in","th","{lang}"
```

注意：仅修改 `else` 分支（非 kiwibit）的那一行。

### 2. Base/BaseCore/src/main/java/com/ai/addxbase/LanguageUtils.java

在 `getDefaultSupportLocales()` 方法中，`if (!"kiwibit".equals(BuildConfig.tenantId))` 条件块内，`}` 之前插入：

```java
            defaultLocales.add(new Locale("{lang}", "{COUNTRY}")); // {中文名}
```

### 3. app/src/main/res/values/str_arrays.xml

在语言名称字符串区域末尾（最后一个 `com_addx_strings_addx_language_` 之后）插入：

```xml
    <string name="com_addx_strings_addx_language_{lang}" translatable="false" tools:ignore="ExtraTranslation">{nativeName}</string>
```

---

## 特殊处理（仅部分语言需要）

当语言的 Java/Android 旧代码与 ISO 标准不一致时，需要额外修改以下文件。

### 4. Base/BaseCore/src/main/java/com/ai/addxnet/ApiClient.java

在 `getProtolLanguage()` 方法中添加映射：

```java
        if ("{javaCode}".equalsIgnoreCase(language)) {
            language = "{isoCode}";
        }
```

### 5. app/src/main/java/com/ai/guard/vicohome/modules/mine/appSetting/LanguageAdapter.java

在 `adapterLanguageForAndroidSDK()` 方法中添加映射：

```java
        } else if (language.equals("{javaCode}")) {
            return "{isoCode}";
```

### 6. Base/BaseCore/src/main/java/com/ai/addxbase/LanguageUtils.java

在 `getSupportLocalBySaveLocalToFlutter()` 方法的 switch 中添加 case：

```java
            case "{javaCode}":
                language = "{isoCode}";
                break;
```

---

## 执行翻译脚本

```bash
cd crowdin && ./auto_l10n.sh config/vh_android_dev.json
```

---

## 已有语言列表

### build.gradle resConfigs（非 kiwibit）
```
en, zh, tw, de, es, fr, it, ja, ru, fi, iw, ar, vi, pt, pl, tr, cs, ko, in, th, ms, fil
```

### kiwibit 条件内的语言（LanguageUtils.java）
```
ko(韩语), id(印尼语), th(泰语), ms(马来语), fil(菲律宾语)
```

## 常见语言的原生名称参考

| 中文名 | 语言代码 | 国家代码 | 原生名称 |
|--------|---------|---------|---------|
| 马来语 | ms | MY | Bahasa Melayu |
| 菲律宾语 | fil | PH | Filipino |
| 泰语 | th | TH | ภาษาไทย |
| 印尼语 | id | ID | Bahasa Indonesia |
| 越南语 | vi | VN | Tiếng Việt |
| 韩语 | ko | KR | 한국어 |
| 日语 | ja | JP | 日本語 |
