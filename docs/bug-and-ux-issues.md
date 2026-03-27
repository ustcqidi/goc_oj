# GOC OJ — Bug & UX Issue Tracker

> 自动化测试记录。格式：严重（🔴）/ 中等（🟡）/ 轻微（⚪）。

---

## 批次 1（2026-03-23）

| ID | 级别 | 描述 | 复现步骤 | 建议修复 | 状态 |
|----|------|------|----------|----------|------|
| BUG-001 | 🔴 严重 | `canvas-wrap` 缺少 `id`，导致「绘制完成」浮层和「🏆 通过！」庆祝动画永远不显示 | 运行任意题目 / 提交通过 → 画布上无任何动画反馈 | 在 `<div class="canvas-wrap">` 上加 `id="canvas-wrap"` | ✅ 已修复 |
| BUG-002 | 🔴 严重 | 「重置」(清空进度) 按钮删除所有 `goc_*` localStorage key，用户的深色模式、字体大小、字体家族、侧边栏状态、上次题目等偏好设置全部丢失 | 设置深色模式 → 调整字体 → 点击「重置」→ 页面刷新后所有偏好消失 | 清除时排除 `goc_dark_mode` / `goc_fontSize` / `goc_fontFamily` / `goc_sidebar_collapsed` / `goc_last_problem` | ✅ 已修复 |
| BUG-003 | 🟡 中等 | 清空进度后只调用了 `renderSidebar()`，header 进度数字、进度条、进度环、筛选按钮通过率均未刷新 | 点击「重置」确认 → 侧边栏列表刷新，但 header「已解 X/N」和进度环仍显示旧数据 | 在 handler 里补调 `updateProgress(); updateDiffCounts(); updateStatusCounts();` | ✅ 已修复 |
| BUG-004 | 🟡 中等 | 题目描述折叠后切换到下一题，新题的描述依然是隐藏状态（折叠状态未重置） | 折叠题目描述 → 点击下一题 → 描述区域空白，需手动点击展开 | 在 `loadProblem()` 里重置 `descEl.style.display = ''` 并还原按钮文字 | ✅ 已修复 |
| BUG-005 | 🟡 中等 | 快捷键帮助弹窗缺少已实现的 Ctrl+/ (注释) 和 ↑/↓ (题目导航) 两个快捷键，用户无从发现 | 点击「?」查看快捷键列表 → 找不到 Ctrl+/ 和方向键 | 在弹窗中补充这两条 | ✅ 已修复 |
| BUG-006 | ⚪ 轻微 | 深色模式下搜索框背景色仍为白色，与周围 dark 风格严重不协调 | 开启深色模式 → 观察搜索框 → 白底输入框非常突兀 | 补充 `.dark-mode .search-box input` 暗色样式 | ✅ 已修复 |
| BUG-007 | ⚪ 轻微 | 跳转行号输入框允许输入 0 或负数，导致 `setSelectionRange` 使用异常偏移量 | 在行号框输入 `-5` 或 `0` 后回车 → 光标跳到不期望的位置 | `Math.max(1, parseInt(value))` 做下界保护 | ✅ 已修复 |
| UX-001 | ⚪ 轻微 | GOC-110~114（网格线、个人备注、双画布对比、Streak、代码模板）在 doc 11 中标记「已落地」但代码中均未实现（无对应 DOM/JS）| 查看 doc 11 组 L，搜索 `goc_streak`/`goc_note` → 代码中不存在 | 补充实现或将文档状态更正 | 📋 待处理 |
| UX-002 | 🟡 中等 | `loadProblem` 被多次 monkey-patch（nav、timer 各 wrap 一次），调用链隐式依赖顺序，后续再加 patch 易出错 | 查看代码 line 2184、2247 | 改为单一 `afterLoadProblem` 钩子数组或统一 patch 一次 | 📋 待处理 |
