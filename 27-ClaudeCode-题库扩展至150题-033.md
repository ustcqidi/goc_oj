# Claude Code 任务说明：题库扩展至约 150 题（GOC-033）

**目标**：基于现有题目模式（06 模式库、07 Schema）将题库从当前约 45 题扩展至约 150 题，保持难度/标签/数学章节体系一致。

---

## 硬性要求

- **全部由 Claude Code 自己做完**：按 13 Workflow 或 06 模式逐类补题，产出题目 JSON、更新 index.json、运行 sync 与轨迹预生成，不要中途停下来等用户。
- **不要用户干预**：不向用户提问、不要求确认；遇到歧义按本文档及 07/13 约定自行决定。
- **完成后**：在 `goc/docs/实现记录.md` 中增加「GOC-033 题库扩展至约 150 题 已执行」段落，列出新增题目数量、修改的文件、以及简要分类统计。

---

## 复制给 Claude Code 的「一句话任务」（可直接粘贴）

```
请按文档 27-ClaudeCode-题库扩展至150题-033.md 基于现有题目模式扩展题库至约 150 题。工作目录 goc/。新题需符合 07 Schema，含 solution、starterCode、description、difficulty、tags；建议预生成 expectedTrajectory（非 cin 题用 gen-trajectories.js，cin 题可留空或配置 defaultInput）。更新 problems/index.json 并运行 sync-problems.js 生成 oj/data/problems.js。不要向我提问。完成后更新 goc/docs/实现记录.md 并汇报题目数量与分类。
```

---

## 任务概览

| 项目 | 内容 |
|------|------|
| **GOC-ID** | GOC-033 |
| **当前** | 约 45 题（problems/*.json + index.json） |
| **目标** | 约 150 题，风格与现有题一致 |
| **范围** | goc/problems/（新增 JSON）；goc/problems/index.json；goc/scripts/sync-problems.js、gen-trajectories.js（执行）；goc/oj/data/problems.js（同步结果） |
| **必读** | goc/07-GOC 题目数据格式（Schema）.md；goc/06-GOC 题目案例与模式提炼.md；goc/13-题目收集与题库完善Workflow.md；goc/10-执行轨迹规范.md；goc/08 或 11 中数学章节/标签体系 |

---

## 实现要点

1. **题目来源与分类**  
   - 参考 **06-GOC 题目案例与模式提炼.md** 中的模式分类（正多边形、圆与弧、螺旋、色彩、坐标、循环、cin 等）。  
   - 在每类下补充新题，使总题量达到约 150。可结合 **problems/samples/** 中 description 提炼题干与 solution，或按既有模式自行设计。  
   - 难度分布建议：easy 约 40%～50%，medium 约 40%，hard 约 10%～20%；tags 与现有题风格一致；数学章节（curriculum）按 11/08 中 CURRICULUM_MAP 相关标签对齐。

2. **单题格式（07 Schema）**  
   - 每道题一个 JSON 文件，命名 `编号-标题别名.json`，编号从 046 起顺延（当前最大约 045）。  
   - 必含：id、title、description、difficulty、tags、starterCode、solution、hint、constraints。  
   - 非 cin 题：运行 `scripts/gen-trajectories.js` 为每题写入 **expectedTrajectory**（或先写题再批量跑脚本）。  
   - cin 题：可不写 expectedTrajectory，或写空数组；若需目标图形预览，在 26 任务中已约定 **defaultInput**，可在此为 cin 题补上 defaultInput。

3. **index.json 与同步**  
   - **problems/index.json** 中列出全部题目 id（顺序可按难度或分类），与 problems/*.json 一一对应。  
   - 执行 `node scripts/sync-problems.js`，生成 **oj/data/problems.js**，确保 OJ 侧题目列表为约 150 题。

4. **避免重复**  
   - 新题与现有 001～045 在「题意+考点」上不重复；可同模式不同参数（如不同 n、不同颜色数）。

---

## 验收清单

- [ ] problems/*.json 总数约 150（含原有 + 新增）。
- [ ] problems/index.json 包含全部题目 id，无遗漏、无多余。
- [ ] 运行 `node scripts/sync-problems.js` 无报错，oj/data/problems.js 中题目数量与 index 一致。
- [ ] 非 cin 题已具备 expectedTrajectory（可通过 gen-trajectories.js 批量生成）。
- [ ] 新题均含 id、title、description、difficulty、tags、starterCode、solution、hint、constraints，符合 07。
- [ ] `goc/docs/实现记录.md` 已更新，含题目数量、分类统计与修改/新增文件列表。

---

## 交付物

1. **题目数据**：goc/problems/ 下新增约 105 道题的 JSON 文件；goc/problems/index.json 更新为约 150 题。
2. **OJ 数据**：goc/oj/data/problems.js 由 sync 脚本更新，供 OJ 加载。
3. **文档**：goc/docs/实现记录.md 新增「GOC-033 题库扩展至约 150 题」段落，含数量、分类与文件列表；可附简要「新题列表」表（id、title、difficulty、主要 tags）。
