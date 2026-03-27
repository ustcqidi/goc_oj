#!/usr/bin/env node
/**
 * sync-problems.js
 * 从 problems/*.json 和 problems/index.json 生成 oj/data/problems.js
 * 用法: node scripts/sync-problems.js
 * 工作目录: goc/ (仓库内 goc 目录)
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ── Paths ──────────────────────────────────────────────────────────
const ROOT = process.cwd();
const PROBLEMS_DIR = path.join(ROOT, 'problems');
const INDEX_FILE = path.join(PROBLEMS_DIR, 'index.json');
const OUTPUT_FILE = path.join(ROOT, 'oj', 'data', 'problems.js');

// ── Read all problem JSON files ────────────────────────────────────
const files = fs.readdirSync(PROBLEMS_DIR)
  .filter(f => f.endsWith('.json') && f !== 'index.json')
  .sort(); // sort by filename (which includes id prefix)

if (files.length === 0) {
  console.error('错误：problems/ 目录下没有找到题目 JSON 文件。');
  process.exit(1);
}

const problems = [];
const indexEntries = [];

for (const file of files) {
  const filePath = path.join(PROBLEMS_DIR, file);
  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    console.error(`解析失败: ${file} — ${e.message}`);
    process.exit(1);
  }

  problems.push(data);

  // Index entry: only key fields
  indexEntries.push({
    id: data.id,
    title: data.title,
    difficulty: data.difficulty,
    tags: data.tags || [],
    file: file,
  });
}

// ── Rebuild index.json ────────────────────────────────────────────
fs.writeFileSync(INDEX_FILE, JSON.stringify(indexEntries, null, 2), 'utf8');
console.log(`已更新 problems/index.json（${indexEntries.length} 道题）`);

// ── Generate oj/data/problems.js ──────────────────────────────────
const outputDir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const js = 'window.PROBLEMS_DATA = ' + JSON.stringify(problems, null, 2) + ';\n';
fs.writeFileSync(OUTPUT_FILE, js, 'utf8');
console.log(`已生成 oj/data/problems.js（${problems.length} 道题）`);

// ── Summary ──────────────────────────────────────────────────────
const byDiff = {};
problems.forEach(p => {
  const d = p.difficulty || 'unknown';
  byDiff[d] = (byDiff[d] || 0) + 1;
});
console.log('\n题目统计：');
Object.entries(byDiff).forEach(([d, n]) => {
  const label = { easy: '入门', medium: '进阶', hard: '高级' }[d] || d;
  console.log(`  ${label}: ${n} 道`);
});
console.log(`  合计: ${problems.length} 道`);
console.log('\n同步完成！');
