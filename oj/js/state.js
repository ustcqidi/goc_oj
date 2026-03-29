'use strict';

// ── Shared mutable state ───────────────────────────────────────────
let currentProblem = null;
let currentFilter = 'all';
let currentTag = 'all';
let currentCurriculum = 'all';
let currentSearch = '';
let currentStatus = 'all'; // GOC-045: 'all'|'todo'|'pass'|'fail'|'star'
let _hintIdx = 0; // GOC-170: layered hint reveal index
let _timerStart = Date.now(); // GOC-091: problem timer
let expectedTrajCache = {};
let animState = { timer: null };
let currentSpeed = 1;
let currentSolTraj = null; // GOC-031: cached for canvas resize re-render
let _toastTimer = null; // GOC-048: toast timer shared across submit/init flows
let stepTraj = [], stepIdx = 0, stepCtx = null, stepState = null, stepTransform = null;
let breakpoints = new Set(); // GOC-164: breakpoint line numbers (1-indexed)
let currentStepLineNum = null; // GOC-164: currently highlighted execution line
