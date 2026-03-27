# Claude Code 任务说明：部分题目目标图形未正常渲染（GOC-032）

**目标**：修复 043、042、037、036 等题在「目标图形」区域无图或显示异常的问题。包含两类：cin 题预览无默认输入；渲染器 `oo` 未使用颜色参数。

---

## 硬性要求

- **全部由 Claude Code 自己做完**：按下面两类问题分别修复，不要中途停下来等用户。
- **不要用户干预**：不向用户提问、不要求确认；遇到歧义按本文档约定自行决定。
- **完成后**：在 `goc/docs/实现记录.md` 中增加「GOC-032 目标图形渲染修复 已执行」段落，列出修改的文件与验收结论。

---

## 复制给 Claude Code 的「一句话任务」（可直接粘贴）

```
请按文档 26-ClaudeCode-目标图形渲染修复-032.md 修复 043、042、037、036 目标图形未正常渲染的问题：1) 043/042 为 cin 题，需为预览提供默认输入并跑 solution 得到轨迹再渲染；2) 036/037 的 oo 轨迹带两参(半径,颜色)，渲染器需用 args[1] 设色。工作目录 goc/，修改 goc/oj/ 与题目 JSON（若增加 defaultInput）。不要向我提问。完成后更新 goc/docs/实现记录.md。
```

---

## 任务概览

| 项目 | 内容 |
|------|------|
| **GOC-ID** | GOC-032 |
| **问题 1** | 043、042 为 cin 题，solution 依赖输入；当前预览无输入 → 轨迹为空 → 目标图形空白 |
| **问题 2** | 036、037 有 expectedTrajectory，但 `oo(r, color)` 的 color 未被渲染器使用 → 多色圆显示为单色 |
| **范围** | goc/oj/index.html（预览逻辑、默认输入）；goc/oj/js/goc-executor.js（applyStep 中 oo 分支）；可选 goc/problems/*.json（defaultInput 字段） |
| **必读** | goc/11-产品持续优化-思路与想法.md（§2.4 GOC-032、§六 组 H）；goc/07-GOC 题目数据格式（Schema）.md；goc/10-执行轨迹规范.md |

---

## 实现要点

### 一、cin 题（043、042）预览有图

1. **约定默认输入**  
   - 在题目 JSON 中增加可选字段 **`defaultInput`**：字符串，多行与运行时的「输入区」一致（如 `"6\n1 2 3 4 5 6"` 表示第一行 6，第二行 6 个颜色号）。  
   - 若题目含 `cin` 且存在 `defaultInput`，则**预览目标图形时**用该默认输入调用执行器跑 solution，得到 trajectory 后再用 GOCRenderer 渲染到 sol-canvas。  
   - 若题目含 `cin` 但无 `defaultInput`，可退化为：用一行占位文案（如「此题需输入，请运行后查看效果」）或空画布，不报错。

2. **执行器调用**  
   - 现有执行器已支持将 `inputLines`（字符串数组，每行一个元素）传入，运行 solution 时 cin 从该数组读取。  
   - 预览时：读取题目的 `defaultInput`，按换行拆成 `inputLines`，调用 `GOCExecutor.run(solution, { inputLines, stepLimit })`，用返回的 trajectory 渲染。

3. **题目数据**  
   - **042**：`defaultInput` 建议为 `"8"`（画 8 个圆点的圆盘）。  
   - **043**：`defaultInput` 建议为 `"6\n1 2 3 4 5 6"`（6 个点、6 种颜色）或类似，与题目描述一致。  
   - 在 `problems/042-输入n画圆盘.json`、`problems/043-输入n颜色花环.json` 中增加 `defaultInput` 字段；若 sync 脚本会覆盖，需保留该字段或合并逻辑。

### 二、渲染器 oo 支持第二参数（颜色）

1. **轨迹格式**  
   - 轨迹中 `oo` 为两参：`args[0]` 半径，`args[1]` 颜色（0～15 的整数）。例如 036、037 的 expectedTrajectory 中已有 `"args":[120,8]`、`"args":[60,0]` 等。

2. **修改 goc-executor.js 的 applyStep**  
   - 在 **applyStep** 的 **case 'oo'** 分支中：  
     - 若 `args[1] !== undefined`，则用 `getColor(args[1])` 得到颜色字符串，赋给 **本次绘制**的 fillStyle（可直接 `ctx.fillStyle = getColor(args[1])`，或先 `state.color = getColor(args[1])` 再 `ctx.fillStyle = state.color`，以保持 state 一致）。  
     - 若 `args[1] === undefined`，保持现有逻辑，使用 `state.color`。  
   - 同时，若执行器在 **computeBBox** 或轨迹遍历里对 `oo` 有分支，无需改 bbox 计算（颜色不影响范围）。

3. **getColor**  
   - 文件中已有 `getColor(idx)`，直接复用即可。

---

## 验收清单

- [ ] **043**：打开题目 043，目标图形区显示「默认输入」下的花环图（6 个点或你设定的 defaultInput），非空白。
- [ ] **042**：打开题目 042，目标图形区显示「默认输入」下的圆盘图（如 8 个圆点），非空白。
- [ ] **036**：打开题目 036，目标图形区显示 8 个同心圆且**颜色不同**（由大到小 8～1 号色），非单色。
- [ ] **037**：打开题目 037，目标图形区显示 6 个圆点且**黑红交替**（或 0/1 号色），非单色。
- [ ] 其他非 cin、且使用 oo 单参的题目，目标图形仍正常，无回归。
- [ ] `goc/docs/实现记录.md` 已更新，记录 GOC-032 与修改文件。

---

## 交付物

1. **代码**：`goc/oj/js/goc-executor.js`（oo 分支用 args[1] 设色）；`goc/oj/index.html`（预览时读取 defaultInput、传入 inputLines 跑 solution 并渲染）；`goc/problems/042-输入n画圆盘.json`、`goc/problems/043-输入n颜色花环.json`（增加 defaultInput，若采用该方案）。
2. **文档**：`goc/docs/实现记录.md` 新增「GOC-032 目标图形渲染修复」段落，含修改文件列表与验收结论。  
3. **可选**：在 goc/07 或 schema 中补充 `defaultInput` 字段说明（可选，字符串，cin 题预览用）。
