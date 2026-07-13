# 当前目录总览

本文档用于说明 `/Users/chenguodong/Desktop/workplace/me` 当前目录下的主要目录结构、文件用途和推荐使用方式。

## 一、根目录结构

```text
me/
├── .claude/
├── archive/
├── skills/
├── skills.zip
├── work-summaries/
├── resume.md
├── resume-paged.html
├── chenguodong.pdf
├── my-abilities.md
├── interview-reference-4.md
└── directory-overview.md
```

旧版材料已归档到 `archive/`。隐藏文件如 `.DS_Store` 是 macOS 自动生成的系统文件，已清理。

## 二、核心目录

### `.claude/`

本地 Claude/Codex 相关配置目录。

当前包含：

- `.claude/settings.local.json`：本地权限、命令或运行配置。通常不作为简历或面试材料使用，只是工具运行环境配置。

### `archive/`

旧版或暂时不用的材料归档目录。用于保留历史版本，避免主目录混乱。

当前结构：

```text
archive/
├── old-interview-references/
├── old-resume/
└── misc/
```

其中：

- `archive/old-interview-references/`：旧版面试回答材料。
  - `interview-reference.md`
  - `interview-reference-2.md`
  - `interview-reference-3.md`
- `archive/old-resume/`：旧版或过渡版简历文件。
  - `chen.pdf`
  - `resume.html`
  - `resume-editable.html`
- `archive/misc/`：暂时不确定是否还会使用的杂项素材。
  - `img_v3_0212u_3cbb353a-462f-470a-966a-350c729a946g.jpg`

### `skills/`

当前整理后的 skill 汇总目录。这里已经把公开版工作流 skill 和 superpowers skill 放在同一个扁平目录下，便于直接作为 skill 包使用。

目录形态：

```text
skills/
├── architect/
├── code-review/
├── dev-workflow/
├── story-craftsman/
├── brainstorming/
├── writing-plans/
├── test-driven-development/
├── verification-before-completion/
└── ...
```

其中：

- `story-craftsman/`：需求整理 skill。用于把模糊需求整理成用户故事、范围、非范围、AC、测试映射。
- `architect/`：架构设计 skill。用于在实现前设计系统、模块、API、数据模型、状态机、ADR、测试和观测方案。
- `dev-workflow/`：完整研发流程编排 skill。用于串联需求、架构、测试、观测、实现、验证、review、CI/CD、发布。
- `code-review/`：代码审查 skill。用于合并前审查需求、设计、代码、测试、观测、发布之间是否断裂。

superpowers 相关 skill：

- `brainstorming/`：想法到设计，先澄清需求再进入计划。
- `writing-plans/`：把 spec 或需求拆成可执行实现计划。
- `executing-plans/`：按已有计划执行任务。
- `test-driven-development/`：TDD 纪律，先写失败测试再实现。
- `systematic-debugging/`：系统化排障，先找 root cause 再修。
- `verification-before-completion/`：完成前验证，避免没有证据就宣称完成。
- `requesting-code-review/`：发起 code review。
- `receiving-code-review/`：接收和处理 review 意见。
- `subagent-driven-development/`：用子代理按任务实现和 review。
- `dispatching-parallel-agents/`：并行派发独立任务。
- `using-git-worktrees/`：使用隔离工作区。
- `finishing-a-development-branch/`：开发分支收尾。
- `using-superpowers/`：superpowers 使用入口说明。
- `writing-skills/`：创建、编辑和验证 skill 的方法论。

### `skills.zip`

`skills/` 目录的压缩包。用于迁移、备份或发给其他环境安装。

当前压缩包包含：

- 4 个整理后的中文公开 skill：`story-craftsman`、`architect`、`dev-workflow`、`code-review`
- 14 个 superpowers skill
- superpowers 附带的 prompt、scripts、references、examples 等辅助文件

### `work-summaries/`

面试用工作总结目录，按真实工作/项目组织。它和 `my-abilities.md` 互补：

- `work-summaries/`：按项目讲经历。
- `my-abilities.md`：按能力维度提炼个人能力。

核心文件：

- `work-summaries/README.md`：总说明，解释四个工作、skill 存档结构、归属口径和面试主线。
- `01-warranty-plus.md`：Warranty Plus 售后保修全栈体系总结。
- `02-provisioning-kit.md`：Provisioning Kit 配网 SDK 0→1 总结。
- `03-device-binding-hb1.md`：设备绑定跨端体系 + HB1 解绑保留配对总结。
- `04-homebase-launch-binding.md`：VH Homebase 新品上架绑定功能总结。

子目录：

- `work-summaries/warranty/skills/`：Warranty Plus 实际用到的 skill 原文存档，包括项目专属 skill 和 workflow-superpowers。
- `work-summaries/provisioning-kit/skills/`：Provisioning Kit 工作中使用 skill 的说明。该项目没有项目专属 skill，主要引用共享 workflow。
- `work-summaries/device-binding-hb1/skills/`：设备绑定/HB1 工作中用到的项目 skill 说明，如 `add-language`、`mr-sonar`。
- `work-summaries/homebase-launch-binding/skills/`：Homebase 新品绑定工作中用到的 skill 说明，复用设备绑定相关项目 skill 和共享 workflow。

## 三、简历文件

### `resume.md`

Markdown 版简历源文件。适合快速编辑文字内容、调整项目描述和工作技能。

### `resume-paged.html`

分页排版版简历。当前主要用于控制简历页数、页面留白和打印/PDF 导出效果。

### `chenguodong.pdf`

当前或近期导出的 PDF 简历。

## 四、能力与面试材料

### `my-abilities.md`

能力清单和简历提炼池。按能力维度组织，包括：

- 角色与定位
- Flutter / Android / iOS / 后端 / 数据 / DevOps
- 架构设计能力
- AI Engineering / Harness Engineering
- 质量保障、跨端协作、可观测性等

用途：

- 为简历提炼关键词。
- 为面试回答找能力证据。
- 避免只按项目讲经历，而缺少抽象能力表达。

### `interview-reference-4.md`

当前简历逐项追问版，也是最完整的对答手册。包含大量围绕当前简历的 Q&A，覆盖：

- 个人总结
- ADDX 工作经历
- 德赛西威工作经历
- Provisioning Kit
- Homebase
- Warranty Plus
- Android / Flutter / iOS / 后端技术问答

优先级最高，面试前建议优先看这一份。

## 五、推荐阅读顺序

如果目标是准备面试，推荐顺序：

1. `resume-paged.html`：先看最终简历呈现。
2. `interview-reference-4.md`：按当前简历逐项准备问答。
3. `work-summaries/README.md`：建立四个核心工作的总览。
4. `work-summaries/01-warranty-plus.md` 到 `04-homebase-launch-binding.md`：逐个项目深挖。
5. `my-abilities.md`：把项目经历抽象成能力标签。

如果目标是迁移 skill，推荐顺序：

1. `skills/`：直接复制整个目录。
2. `skills.zip`：作为打包版本迁移。
3. `skills/dev-workflow/SKILL.md`：理解完整研发流程入口。
4. `skills/architect/SKILL.md`、`skills/story-craftsman/SKILL.md`、`skills/code-review/SKILL.md`：理解自定义公开 skill。
5. `skills/writing-skills/SKILL.md`：理解如何继续维护 skill。

## 六、当前目录状态总结

当前目录主要服务两个目标：

1. **求职/面试材料管理**
   - 简历：`resume.md`、`resume-paged.html`、`chenguodong.pdf`
   - 面试对答：`interview-reference-4.md`
   - 能力提炼：`my-abilities.md`
   - 项目总结：`work-summaries/`

2. **AI 工程化与 skill 迁移**
   - 已整理的 skill：`skills/`
   - skill 压缩包：`skills.zip`
   - 工作项目中使用 skill 的证据：`work-summaries/*/skills/`

已归档内容：

- 旧版面试回答：`archive/old-interview-references/`
- 旧版简历：`archive/old-resume/`
- 不确定用途图片：`archive/misc/`

已删除内容：

- 根目录及子目录下的 `.DS_Store` 系统文件
