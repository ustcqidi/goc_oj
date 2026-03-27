# Claude Code 任务说明：GOC-038 阶段 1 — 多组轨迹支持（acceptedTrajectories）

**目标**：在题目 JSON 支持 `acceptedTrajectories` 字段，判题时用户轨迹与**任意一组**已接受轨迹匹配即通过，缓解「不同写法画同图被误判」的核心问题。

---

## 一、硬性要求

- **全部由 Claude Code 自己做完**：阅读现有判题逻辑、修改代码、验收自检，不要中途停下来等用户。
- **不要用户干预**：不向用户提问、不要求确认；遇到歧义按本文档约定与现有架构自行决定。
- **最小改动**：本阶段只做多组轨迹支持，不修改像素比对、不改 judgeMode，不改 GOCJudge.judge 核心逻辑。

---

## 二、复制给 Claude Code 的「一句话任务」

```
请按文档 36-ClaudeCode-GOC-038-阶段1-多组轨迹支持.md 实现 GOC-038 阶段 1（acceptedTrajectories 多组轨迹支持）。工作目录 goc/oj/。必读：oj/index.html 的 submitCode() 与 ensureExpected()、docs/最终图形判题-方案研究.md §5.2 方案C、goc-executor.js GOCJudge.judge。修改内容：① oj/index.html 中 submitCode() 的判题调用处，提取为 judgeMulti(userTraj, problem, primaryExpected) 函数，遍历 [primaryExpected, ...(problem.acceptedTrajectories||[])]，任一组通过即返回 pass；② 不修改 GOCJudge.judge 本身；③ 不添加任何 judgeMode 逻辑（阶段 2 再做）。完成后：在 goc/docs/实现记录.md 增加「GOC-038 阶段 1 acceptedTrajectories 多组轨迹支持 已落地」并注明改动文件与行号。
```

---

## 三、背景与现状

| 项目 | 说明 |
|------|------|
| **GOC-ID** | GOC-038 |
| **阶段** | 阶段 1（共 3 阶段，见方案研究文档） |
| **问题** | 不同笔画顺序画出视觉相同的图形会被判错 |
| **本阶段目标** | 支持 `acceptedTrajectories`：题目可配置多组正确轨迹，任一匹配即通过 |
| **方案来源** | `docs/最终图形判题-方案研究.md` 方案 C + §5.4 judgeMulti 伪代码 |

---

## 四、必读文档与代码

| 文档/路径 | 用途 |
|-----------|------|
| **docs/最终图形判题-方案研究.md** | §2.3 方案 C、§5.2 judgeMulti 伪代码、§5.6 分阶段实施建议 |
| **oj/index.html** | `submitCode()`（约 1259 行）、`ensureExpected(p)`（约 656 行）、当前 `GOCJudge.judge(...)` 调用点（约 1291 行） |
| **oj/js/goc-executor.js** | `GOCJudge.judge(userTraj, expectedTraj)` 现有实现，**只读，不修改** |

---

## 五、具体修改清单

### 5.1 oj/index.html

**在 submitCode() 中找到 GOCJudge.judge 调用点，替换为 judgeMulti 调用：**

```javascript
// === 新增 judgeMulti 函数（在 submitCode 之前或 script 块内） ===
function judgeMulti(userTraj, problem, primaryExpected) {
  const allExpected = [primaryExpected, ...(problem.acceptedTrajectories || [])];
  for (const exp of allExpected) {
    const v = GOCJudge.judge(userTraj, exp);
    if (v.pass) return v;
  }
  // 所有组均不匹配时，返回第一组的失败信息
  return GOCJudge.judge(userTraj, primaryExpected);
}

// === 在 submitCode() 中，将原来的：
//   const verdict = GOCJudge.judge(userResult.trajectory, expected);
// 改为：
//   const verdict = judgeMulti(userResult.trajectory, currentProblem, expected);
```

**注意**：
- `problem.acceptedTrajectories` 为 undefined 或 [] 时行为与现在完全相同
- 不要修改 `GOCJudge.judge` 本身
- 不要添加 `judgeMode` 判断（阶段 2 再做）

### 5.2 docs/实现记录.md

在实现记录中增加一行：
```
GOC-038 阶段 1 acceptedTrajectories 多组轨迹支持 已落地 — 改动：oj/index.html（新增 judgeMulti 函数，替换 submitCode 中的 judge 调用）
```

---

## 六、不做的事（本阶段范围外）

- ❌ 不添加 `judgeMode` 字段处理
- ❌ 不实现像素/ImageData 图像比对（阶段 2）
- ❌ 不修改题目 JSON 文件（acceptedTrajectories 字段由出题者手动填写）
- ❌ 不修改 gen-trajectories.js 或 sync-problems.js
- ❌ 不修改 GOCJudge.judge 核心逻辑

---

## 七、验收自检

- [ ] `oj/index.html` 中新增了 `judgeMulti` 函数
- [ ] `submitCode()` 中 `GOCJudge.judge(...)` 调用已替换为 `judgeMulti(...)`
- [ ] `judgeMulti` 无 `acceptedTrajectories` 时行为与原来完全一致（向后兼容）
- [ ] `docs/实现记录.md` 已更新

---

## 八、阶段路线图（供参考）

| 阶段 | 内容 | 状态 |
|------|------|------|
| 阶段 0 | 轨迹严格比对（现有） | 已上线 |
| **阶段 1** | **acceptedTrajectories 多组轨迹支持** | **本文档** |
| 阶段 2 | 图像兜底判题（image_fallback） | 待做，需 POC 验证 |
| 阶段 3 | judgeMode 字段化、UI 区分三种判题结果 | 待做 |
