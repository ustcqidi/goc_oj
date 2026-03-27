#!/usr/bin/env node
/**
 * gen-trajectories.js — B2 预生成 expectedTrajectory
 *
 * 用途：遍历 problems/*.json，对每道题运行 solution，
 *       把轨迹数组写回 JSON 的 expectedTrajectory 字段。
 *
 * 用法（在 goc/ 目录下执行）：
 *   node scripts/gen-trajectories.js
 *
 * 选项：
 *   --force   强制重新生成（默认只处理 expectedTrajectory 为空的题目）
 *   --dry-run 只打印结果，不写文件
 *
 * 输入：problems/*.json（含 solution 字段）
 * 输出：同文件写回，追加 expectedTrajectory 数组
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// 加载执行器（兼容 Node/浏览器双环境）
require(path.join(__dirname, '../oj/js/goc-executor.js'));

const PROBLEMS_DIR = path.join(__dirname, '../problems');
const args = process.argv.slice(2);
const FORCE   = args.includes('--force');
const DRY_RUN = args.includes('--dry-run');

// 读取所有 problems/*.json（排除 index.json）
const files = fs.readdirSync(PROBLEMS_DIR)
  .filter(f => f.endsWith('.json') && f !== 'index.json')
  .sort();

let done = 0, skipped = 0, failed = 0;

for (const file of files) {
  const filePath = path.join(PROBLEMS_DIR, file);
  let prob;
  try {
    prob = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    console.warn(`⚠️  解析失败: ${file} — ${e.message}`);
    failed++;
    continue;
  }

  const existingTraj = prob.expectedTrajectory;
  const hasTrajectory = Array.isArray(existingTraj) && existingTraj.length > 0;

  if (hasTrajectory && !FORCE) {
    skipped++;
    continue;
  }

  if (!prob.solution || prob.solution.trim() === '') {
    console.warn(`⚠️  无 solution: ${file}`);
    failed++;
    continue;
  }

  const result = GOCExecutor.run(prob.solution);
  if (!result.ok) {
    console.warn(`❌ solution 执行失败 [${file}]: ${result.error}`);
    failed++;
    continue;
  }

  prob.expectedTrajectory = result.trajectory;

  if (DRY_RUN) {
    console.log(`[dry] ${file}: ${result.trajectory.length} 步`);
  } else {
    fs.writeFileSync(filePath, JSON.stringify(prob, null, 2), 'utf8');
    console.log(`✅ ${file}: ${result.trajectory.length} 步`);
  }
  done++;
}

console.log(`\n完成: ${done} 道题写入轨迹，${skipped} 道跳过（已有轨迹），${failed} 道失败。`);
if (DRY_RUN) console.log('（dry-run 模式，未写入文件）');
