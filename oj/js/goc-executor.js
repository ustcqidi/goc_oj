/**
 * GOC Executor v2.1
 * Parses and executes GOC code (01 指令规范), outputs a trajectory array.
 * v2.0: line/col tracking, friendly Chinese errors, GOCRenderer API
 * v2.1: GOC-023 trajectory limit; GOC-024 full 01 spec (e/ee/text/show/hide/speed/wait/pause);
 *        GOC-008 cin/cout support; string literals; >> << operators
 */
(function (global) {
  'use strict';

  // ======================= TOKENIZER =======================

  function tokenize(src) {
    const tokens = [];
    let i = 0;
    let line = 1;
    let col = 1;

    while (i < src.length) {
      // whitespace
      if (/\s/.test(src[i])) {
        if (src[i] === '\n') { line++; col = 1; } else { col++; }
        i++;
        continue;
      }

      // line comment
      if (src[i] === '/' && src[i + 1] === '/') {
        while (i < src.length && src[i] !== '\n') { i++; col++; }
        continue;
      }

      // block comment
      if (src[i] === '/' && src[i + 1] === '*') {
        i += 2; col += 2;
        while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) {
          if (src[i] === '\n') { line++; col = 1; } else { col++; }
          i++;
        }
        i += 2; col += 2;
        continue;
      }

      const tokLine = line;
      const tokCol = col;

      // string literals
      if (src[i] === '"' || src[i] === '\'') {
        const quote = src[i];
        let str = '';
        i++; col++;
        while (i < src.length && src[i] !== quote) {
          if (src[i] === '\\') { i++; col++; }
          str += src[i++]; col++;
        }
        if (i < src.length) { i++; col++; } // consume closing quote
        tokens.push({ type: 'STR', value: str, line: tokLine, col: tokCol });
        continue;
      }

      // numbers
      if (/\d/.test(src[i])) {
        let num = '';
        while (i < src.length && /[\d.]/.test(src[i])) { num += src[i++]; col++; }
        tokens.push({ type: 'NUM', value: parseFloat(num), line: tokLine, col: tokCol });
        continue;
      }

      // identifiers / keywords
      if (/[a-zA-Z_]/.test(src[i])) {
        let word = '';
        while (i < src.length && /[a-zA-Z0-9_]/.test(src[i])) { word += src[i++]; col++; }
        const KWS = ['int', 'double', 'float', 'string', 'for', 'if', 'else', 'while', 'pen', 'cin', 'cout', 'endl'];
        tokens.push({ type: KWS.includes(word) ? 'KW' : 'ID', value: word, line: tokLine, col: tokCol });
        continue;
      }

      // two-char operators
      const two = src[i] + (src[i + 1] || '');
      if (['<=', '>=', '==', '!=', '++', '--', '+=', '-=', '*=', '/=', '>>', '<<', '&&', '||'].includes(two)) {
        tokens.push({ type: 'OP', value: two, line: tokLine, col: tokCol });
        i += 2; col += 2;
        continue;
      }

      // single-char tokens
      const map = {
        ';': 'SEMI', '(': 'LP', ')': 'RP', '{': 'LB', '}': 'RB',
        ',': 'CM', '.': 'DOT',
        '+': 'OP', '-': 'OP', '*': 'OP', '/': 'OP', '%': 'OP',
        '<': 'OP', '>': 'OP', '=': 'OP'
      };
      if (map[src[i]]) {
        tokens.push({ type: map[src[i]], value: src[i], line: tokLine, col: tokCol });
        i++; col++;
        continue;
      }

      i++; col++; // skip unknown
    }

    tokens.push({ type: 'EOF', value: null, line: line, col: col });
    return tokens;
  }

  // ======================= PARSER =======================

  class Parser {
    constructor(tokens) {
      this.tokens = tokens;
      this.pos = 0;
    }

    peek(offset) { return this.tokens[this.pos + (offset || 0)] || { type: 'EOF', line: 0 }; }
    consume() { return this.tokens[this.pos++] || { type: 'EOF', line: 0 }; }

    expect(type, value) {
      const t = this.consume();
      if (t.type !== type || (value !== undefined && t.value !== value)) {
        const lineStr = t.line ? `第 ${t.line} 行：` : '';
        const friendly = this._friendlyExpect(type, value, t);
        throw new Error(lineStr + friendly);
      }
      return t;
    }

    _friendlyExpect(type, value, got) {
      if (type === 'SEMI') return `缺少分号 \`;\`（在 "${got.value}" 之后）`;
      if (type === 'RP') return `缺少右括号 \`)\``;
      if (type === 'LP') return `缺少左括号 \`(\``;
      if (type === 'RB') return `缺少右花括号 \`}\``;
      if (type === 'LB') return `缺少左花括号 \`{\``;
      if (value) return `期望 "${value}"，实际是 "${got.value}"`;
      return `语法错误：期望 ${type}，实际是 "${got.value}"`;
    }

    parseProgram() {
      const stmts = [];
      while (this.peek().type !== 'EOF') {
        const s = this.parseStatement();
        if (s) stmts.push(s);
      }
      return stmts;
    }

    parseBlock() {
      this.expect('LB');
      const stmts = [];
      while (this.peek().type !== 'RB' && this.peek().type !== 'EOF') {
        const s = this.parseStatement();
        if (s) stmts.push(s);
      }
      this.expect('RB');
      return stmts;
    }

    // Supports both `{ ... }` blocks and single-statement bodies (no braces)
    parseBlockOrStmt() {
      if (this.peek().type === 'LB') return this.parseBlock();
      const s = this.parseStatement();
      return s ? [s] : [];
    }

    parseStatement() {
      const t = this.peek();

      if (t.type === 'SEMI') { this.consume(); return null; }
      if (t.type === 'KW' && t.value === 'for') return this.parseFor();
      if (t.type === 'KW' && t.value === 'if') return this.parseIf();
      if (t.type === 'KW' && ['int', 'double', 'float', 'string'].includes(t.value)) return this.parseVarDecl(true);
      if (t.type === 'KW' && t.value === 'pen') return this.parsePenCall();
      if (t.type === 'KW' && t.value === 'cin') return this.parseCinStmt();
      if (t.type === 'KW' && t.value === 'cout') return this.parseCoutStmt();
      if (t.type === 'ID') return this.parseAssignOrInc(true);

      // skip unknown token line
      while (this.peek().type !== 'SEMI' && this.peek().type !== 'EOF' && this.peek().type !== 'RB') this.consume();
      if (this.peek().type === 'SEMI') this.consume();
      return null;
    }

    parseFor() {
      this.consume(); // 'for'
      this.expect('LP');

      let init = null;
      if (this.peek().type !== 'SEMI') {
        if (this.peek().type === 'KW' && ['int', 'double', 'float'].includes(this.peek().value))
          init = this.parseVarDecl(false);
        else
          init = this.parseAssignOrInc(false);
      }
      this.expect('SEMI');

      let cond = { type: 'Num', value: 1 };
      if (this.peek().type !== 'SEMI') cond = this.parseExpr();
      this.expect('SEMI');

      let update = null;
      if (this.peek().type !== 'RP') update = this.parseAssignOrInc(false);
      this.expect('RP');

      const body = this.parseBlockOrStmt();
      return { type: 'For', init, cond, update, body };
    }

    parseIf() {
      this.consume(); // 'if'
      this.expect('LP');
      const cond = this.parseExpr();
      this.expect('RP');
      const then = this.parseBlockOrStmt();
      let els = null;
      if (this.peek().type === 'KW' && this.peek().value === 'else') {
        this.consume();
        if (this.peek().type === 'KW' && this.peek().value === 'if')
          els = [this.parseIf()];
        else
          els = this.parseBlockOrStmt();
      }
      return { type: 'If', cond, then, else: els };
    }

    parseVarDecl(expectSemi) {
      this.consume(); // type keyword
      const decls = [];
      do {
        if (decls.length > 0) this.consume(); // skip ','
        const name = this.expect('ID').value;
        let init = { type: 'Num', value: 0 };
        if (this.peek().type === 'OP' && this.peek().value === '=') {
          this.consume();
          init = this.parseExpr();
        }
        decls.push({ type: 'VarDecl', name, init });
      } while (this.peek().type === 'CM');
      if (expectSemi) this.expect('SEMI');
      return decls.length === 1 ? decls[0] : { type: 'VarDeclList', stmts: decls };
    }

    parseAssignOrInc(expectSemi) {
      const name = this.expect('ID').value;
      const op = this.peek();

      let node;
      if (op.type === 'OP' && op.value === '++') { this.consume(); node = { type: 'PostInc', name }; }
      else if (op.type === 'OP' && op.value === '--') { this.consume(); node = { type: 'PostDec', name }; }
      else if (op.type === 'OP' && op.value === '=') {
        this.consume();
        node = { type: 'Assign', name, value: this.parseExpr() };
      }
      else if (op.type === 'OP' && op.value === '+=') {
        this.consume();
        node = { type: 'Assign', name, value: { type: 'BinOp', op: '+', left: { type: 'Var', name }, right: this.parseExpr() } };
      }
      else if (op.type === 'OP' && op.value === '-=') {
        this.consume();
        node = { type: 'Assign', name, value: { type: 'BinOp', op: '-', left: { type: 'Var', name }, right: this.parseExpr() } };
      }
      else { node = { type: 'Noop' }; }

      if (expectSemi) this.expect('SEMI');
      return node;
    }

    parsePenCall() {
      const penTok = this.consume(); // 'pen'
      const chain = [];
      while (this.peek().type === 'DOT') {
        this.consume(); // '.'
        const methodTok = this.peek();
        const method = this.consume().value; // method name (ID)
        if (!method || methodTok.type === 'EOF') {
          const lineStr = methodTok.line ? `第 ${methodTok.line} 行：` : '';
          throw new Error(lineStr + '未知指令（pen 后面缺少方法名）');
        }
        this.expect('LP');
        const args = [];
        while (this.peek().type !== 'RP' && this.peek().type !== 'EOF') {
          args.push(this.parseExpr());
          if (this.peek().type === 'CM') this.consume();
        }
        this.expect('RP');
        chain.push({ method, args, line: methodTok.line });
      }
      this.expect('SEMI');
      return { type: 'PenCall', chain, line: penTok.line };
    }

    // cin >> var1 >> var2 ;
    parseCinStmt() {
      const tok = this.consume(); // 'cin'
      const vars = [];
      while (this.peek().type === 'OP' && this.peek().value === '>>') {
        this.consume(); // '>>'
        if (this.peek().type === 'ID' || this.peek().type === 'KW') {
          vars.push(this.consume().value);
        }
      }
      if (this.peek().type === 'SEMI') this.consume();
      return { type: 'CinStmt', vars, line: tok.line };
    }

    // cout << expr << expr << endl ;
    parseCoutStmt() {
      const tok = this.consume(); // 'cout'
      const parts = [];
      while (this.peek().type === 'OP' && this.peek().value === '<<') {
        this.consume(); // '<<'
        if (this.peek().type === 'KW' && this.peek().value === 'endl') {
          this.consume();
          parts.push({ type: 'Str', value: '\n' });
        } else {
          parts.push(this.parseExpr());
        }
      }
      if (this.peek().type === 'SEMI') this.consume();
      return { type: 'CoutStmt', parts, line: tok.line };
    }

    // Expression precedence: or > and > comparison > add/sub > mul/div/mod > unary > primary
    parseExpr() { return this.parseOr(); }

    parseOr() {
      let left = this.parseAnd();
      while (this.peek().type === 'OP' && this.peek().value === '||') {
        this.consume();
        const right = this.parseAnd();
        left = { type: 'BinOp', op: '||', left, right };
      }
      return left;
    }

    parseAnd() {
      let left = this.parseComparison();
      while (this.peek().type === 'OP' && this.peek().value === '&&') {
        this.consume();
        const right = this.parseComparison();
        left = { type: 'BinOp', op: '&&', left, right };
      }
      return left;
    }

    parseComparison() {
      let left = this.parseAddSub();
      while (this.peek().type === 'OP' && ['<', '>', '<=', '>=', '==', '!='].includes(this.peek().value)) {
        const op = this.consume().value;
        left = { type: 'BinOp', op, left, right: this.parseAddSub() };
      }
      return left;
    }

    parseAddSub() {
      let left = this.parseMulDiv();
      while (this.peek().type === 'OP' && ['+', '-'].includes(this.peek().value)) {
        const op = this.consume().value;
        left = { type: 'BinOp', op, left, right: this.parseMulDiv() };
      }
      return left;
    }

    parseMulDiv() {
      let left = this.parseUnary();
      while (this.peek().type === 'OP' && ['*', '/', '%'].includes(this.peek().value)) {
        const op = this.consume().value;
        left = { type: 'BinOp', op, left, right: this.parseUnary() };
      }
      return left;
    }

    parseUnary() {
      if (this.peek().type === 'OP' && this.peek().value === '-') {
        this.consume();
        return { type: 'Unary', op: '-', expr: this.parsePrimary() };
      }
      return this.parsePrimary();
    }

    parsePrimary() {
      const t = this.peek();
      if (t.type === 'NUM') { this.consume(); return { type: 'Num', value: t.value }; }
      if (t.type === 'STR') { this.consume(); return { type: 'Str', value: t.value }; }
      if (t.type === 'LP') {
        this.consume();
        const e = this.parseExpr();
        this.expect('RP');
        return e;
      }
      if (t.type === 'ID' || t.type === 'KW') {
        this.consume();
        return { type: 'Var', name: t.value };
      }
      this.consume();
      return { type: 'Num', value: 0 };
    }
  }

  // ======================= EXECUTOR =======================

  const DEFAULT_TRAJ_LIMIT = 5000;

  class Executor {
    run(code, opts) {
      opts = opts || {};
      this.trajectory = [];
      this._ops = 0;
      this._errorLine = null;
      this._inputLines = (opts.inputLines || []).slice();
      this._output = [];
      this._trajLimit = opts.stepLimit || DEFAULT_TRAJ_LIMIT;
      try {
        // Strip optional `int main() { ... return 0; }` wrapper
        code = code.replace(/^\s*int\s+main\s*\(\s*\)\s*\{\s*/, '');
        code = code.replace(/\s*return\s+0\s*;\s*\}\s*$/, '');
        const tokens = tokenize(code);
        const parser = new Parser(tokens);
        const ast = parser.parseProgram();
        const env = Object.create(null);
        this._execBlock(ast, env);
      } catch (e) {
        // Extract line number from error message prefix "第 N 行："
        let line = null;
        const m = e.message.match(/^第 (\d+) 行：/);
        if (m) line = parseInt(m[1], 10);
        if (line == null && this._errorLine) line = this._errorLine;
        return { ok: false, error: e.message, line, trajectory: this.trajectory, output: this._output };
      }
      return { ok: true, error: null, line: null, trajectory: this.trajectory, output: this._output };
    }

    _execBlock(stmts, env) {
      for (const stmt of stmts) {
        if (stmt) this._execStmt(stmt, env);
      }
    }

    _execStmt(stmt, env) {
      if (++this._ops > 500000) throw new Error('执行超时：操作次数超过 50 万，请检查是否有死循环。');

      switch (stmt.type) {
        case 'VarDecl':
          env[stmt.name] = this._eval(stmt.init, env);
          break;
        case 'VarDeclList':
          for (const d of stmt.stmts) env[d.name] = this._eval(d.init, env);
          break;
        case 'Assign':
          this._setVar(stmt.name, this._eval(stmt.value, env), env);
          break;
        case 'PostInc':
        case 'PrefixInc':
          this._setVar(stmt.name, (this._getVar(stmt.name, env) || 0) + 1, env);
          break;
        case 'PostDec':
        case 'PrefixDec':
          this._setVar(stmt.name, (this._getVar(stmt.name, env) || 0) - 1, env);
          break;
        case 'For': {
          const fenv = Object.create(env);
          if (stmt.init) this._execStmt(stmt.init, fenv);
          let guard = 50000;
          while (this._eval(stmt.cond, fenv) && guard-- > 0) {
            this._execBlock(stmt.body, fenv);
            if (stmt.update) this._execStmt(stmt.update, fenv);
          }
          break;
        }
        case 'If':
          if (this._eval(stmt.cond, env)) {
            this._execBlock(stmt.then, env);
          } else if (stmt.else) {
            this._execBlock(stmt.else, env);
          }
          break;
        case 'PenCall':
          if (stmt.line) this._errorLine = stmt.line;
          for (const call of stmt.chain) {
            const args = call.args.map(a => this._eval(a, env));
            this.trajectory.push({ cmd: call.method, args, line: call.line });
            // GOC-023: trajectory step limit
            if (this.trajectory.length > this._trajLimit) {
              throw new Error(`执行超时：绘图步数超过 ${this._trajLimit} 步，请检查是否有无限循环。`);
            }
          }
          break;
        case 'CinStmt':
          for (const varName of stmt.vars) {
            const raw = this._inputLines.shift();
            const val = raw !== undefined ? parseFloat(raw) : 0;
            this._setVar(varName, isNaN(val) ? 0 : val, env);
          }
          break;
        case 'CoutStmt': {
          const parts = stmt.parts.map(p => {
            const v = this._eval(p, env);
            return String(v);
          });
          const line = parts.join('');
          this._output.push(line);
          this.trajectory.push({ cmd: 'cout', args: [line], line: stmt.line });
          break;
        }
        // Noop: do nothing
      }
    }

    _getVar(name, env) {
      let obj = env;
      while (obj !== null) {
        if (Object.prototype.hasOwnProperty.call(obj, name)) return obj[name];
        obj = Object.getPrototypeOf(obj);
      }
      return 0;
    }

    _setVar(name, value, env) {
      // write to the nearest scope that has this var, or create in current
      let obj = env;
      while (obj !== null) {
        if (Object.prototype.hasOwnProperty.call(obj, name)) { obj[name] = value; return; }
        obj = Object.getPrototypeOf(obj);
      }
      env[name] = value;
    }

    _eval(expr, env) {
      if (!expr) return 0;
      switch (expr.type) {
        case 'Num': return expr.value;
        case 'Str': return expr.value;
        case 'Var': return this._getVar(expr.name, env);
        case 'BinOp': {
          const l = this._eval(expr.left, env);
          const r = this._eval(expr.right, env);
          switch (expr.op) {
            case '+': return (typeof l === 'string' || typeof r === 'string') ? String(l) + String(r) : l + r;
            case '-': return l - r;
            case '*': return l * r;
            case '/': return r !== 0 ? l / r : 0;
            case '%': return r !== 0 ? ((l % r) + r) % r : 0;
            case '<': return (l < r) ? 1 : 0;
            case '>': return (l > r) ? 1 : 0;
            case '<=': return (l <= r) ? 1 : 0;
            case '>=': return (l >= r) ? 1 : 0;
            case '==': return (l === r) ? 1 : 0;
            case '!=': return (l !== r) ? 1 : 0;
            case '&&': return (l && r) ? 1 : 0;
            case '||': return (l || r) ? 1 : 0;
          }
          return 0;
        }
        case 'Unary':
          return expr.op === '-' ? -this._eval(expr.expr, env) : this._eval(expr.expr, env);
        default: return 0;
      }
    }
  }

  // ======================= CANVAS RENDERER =======================

  const GOC_COLORS = [
    '#222222', // 0 black
    '#E8000D', // 1 red
    '#0044FF', // 2 blue
    '#00AA00', // 3 green
    '#00AAAA', // 4 cyan
    '#CCCC00', // 5 yellow
    '#8B4513', // 6 brown
    '#000080', // 7 dark blue
    '#888888', // 8 gray
    '#FF69B4', // 9 pink
    '#006400', // 10 dark green
    '#9900CC', // 11 purple
    '#6688AA', // 12 blue-gray
    '#FFD700', // 13 gold
    '#FF8800', // 14 orange
    '#FFFFFF', // 15 white
  ];

  function getColor(idx) {
    const n = Math.floor(idx);
    return GOC_COLORS[n >= 0 && n < GOC_COLORS.length ? n : 0];
  }

  /**
   * Draw the background grid and crosshair on ctx.
   */
  function drawBackground(ctx, w, h) {
    const cx = w / 2, cy = h / 2;
    ctx.clearRect(0, 0, w, h);

    // light grid
    ctx.strokeStyle = '#e8e8e8';
    ctx.lineWidth = 0.5;
    for (let gx = 0; gx <= w; gx += 50) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke(); }
    for (let gy = 0; gy <= h; gy += 50) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke(); }

    // center crosshair
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
  }

  /**
   * Create a fresh turtle state.
   */
  function createState() {
    return { x: 0, y: 0, heading: 0, penDown: true, color: GOC_COLORS[0], lw: 1, visible: true };
  }

  /**
   * Compute bounding box from trajectory steps (GOC-006).
   * Returns { minX, minY, maxX, maxY } in GOC coordinates.
   */
  function computeBBox(trajectory) {
    let minX = 0, minY = 0, maxX = 0, maxY = 0;
    const state = createState();

    function updateBBox(x, y) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }

    for (const step of trajectory) {
      const { cmd, args } = step;
      switch (cmd) {
        case 'fd': {
          const rad = state.heading * Math.PI / 180;
          const nx = state.x + (args[0] || 0) * Math.sin(rad);
          const ny = state.y + (args[0] || 0) * Math.cos(rad);
          updateBBox(nx, ny);
          state.x = nx; state.y = ny;
          break;
        }
        case 'bk': {
          const rad = state.heading * Math.PI / 180;
          const nx = state.x - (args[0] || 0) * Math.sin(rad);
          const ny = state.y - (args[0] || 0) * Math.cos(rad);
          updateBBox(nx, ny);
          state.x = nx; state.y = ny;
          break;
        }
        case 'rt': state.heading = (state.heading + (args[0] || 0)) % 360; break;
        case 'lt': state.heading = ((state.heading - (args[0] || 0)) % 360 + 360) % 360; break;
        case 'up': state.penDown = false; break;
        case 'down': state.penDown = true; break;
        case 'moveTo':
          state.x = args[0] || 0; state.y = args[1] || 0;
          updateBBox(state.x, state.y);
          break;
        case 'lineTo':
          updateBBox(args[0] || 0, args[1] || 0);
          state.x = args[0] || 0; state.y = args[1] || 0;
          break;
        case 'o': case 'oo': {
          const r = Math.abs(args[0] || 0);
          updateBBox(state.x - r, state.y - r);
          updateBBox(state.x + r, state.y + r);
          break;
        }
        case 'e': case 'ee': {
          const rx = Math.abs(args[0] || 0), ry = Math.abs(args[1] || rx);
          updateBBox(state.x - rx, state.y - ry);
          updateBBox(state.x + rx, state.y + ry);
          break;
        }
        case 'r': case 'rr':
          updateBBox(state.x, state.y);
          updateBBox(state.x + (args[0] || 0), state.y + (args[1] || 0));
          break;
      }
    }
    return { minX, minY, maxX, maxY };
  }

  /**
   * Compute a ctx.setTransform to fit trajectory inside canvas with padding (GOC-006).
   * Returns { a, b, c, d, e, f } for setTransform, or null for identity.
   */
  function computeFitTransform(trajectory, canvasW, canvasH, padding) {
    if (!trajectory || trajectory.length === 0) return null;
    padding = padding || 20;

    const bbox = computeBBox(trajectory);
    const bboxW = bbox.maxX - bbox.minX;
    const bboxH = bbox.maxY - bbox.minY;

    if (bboxW < 1 && bboxH < 1) return null;

    const availW = canvasW - padding * 2;
    const availH = canvasH - padding * 2;
    const scale = Math.min(
      bboxW > 0 ? availW / bboxW : Infinity,
      bboxH > 0 ? availH / bboxH : Infinity,
      4 // max upscale
    );

    // Center of bbox in GOC coordinates
    const bboxCX = (bbox.minX + bbox.maxX) / 2;
    const bboxCY = (bbox.minY + bbox.maxY) / 2;

    // Canvas center
    const cx = canvasW / 2;
    const cy = canvasH / 2;

    // Transform: scale around center + offset to center bbox
    // In canvas coordinates: canvas_x = cx + goc_x * scale - bboxCX * scale
    //                                  = cx + (goc_x - bboxCX) * scale
    // setTransform(a, b, c, d, e, f): x' = a*x + c*y + e, y' = b*x + d*y + f
    // Standard: a=scale, b=0, c=0, d=-scale (y inverted), e=cx-bboxCX*scale, f=cy+bboxCY*scale
    return {
      scale,
      tx: cx - bboxCX * scale,
      ty: cy + bboxCY * scale,
    };
  }

  /**
   * Apply one trajectory step to state, drawing to ctx as needed.
   * Mutates state in place.
   */
  function applyStep(ctx, step, state, w, h, transform) {
    const cx = transform ? transform.tx : w / 2;
    const cy = transform ? transform.ty : h / 2;
    const scale = transform ? transform.scale : 1;
    const { cmd, args } = step;

    function toC(gx, gy) { return [cx + gx * scale, cy - gy * scale]; }

    function drawLine(x1, y1, x2, y2) {
      if (!state.penDown) return;
      const [sx, sy] = toC(x1, y1), [ex, ey] = toC(x2, y2);
      ctx.beginPath();
      ctx.strokeStyle = state.color;
      ctx.lineWidth = state.lw * (scale > 1 ? 1 : scale < 0.5 ? 0.5 : scale);
      ctx.lineCap = 'round';
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }

    function movePen(dist) {
      const rad = state.heading * Math.PI / 180;
      const nx = state.x + dist * Math.sin(rad);
      const ny = state.y + dist * Math.cos(rad);
      drawLine(state.x, state.y, nx, ny);
      state.x = nx; state.y = ny;
    }

    switch (cmd) {
      case 'fd': movePen(args[0] || 0); break;
      case 'bk': movePen(-(args[0] || 0)); break;
      case 'rt': state.heading = (state.heading + (args[0] || 0)) % 360; break;
      case 'lt': state.heading = ((state.heading - (args[0] || 0)) % 360 + 360) % 360; break;
      case 'c': state.color = getColor(args[0] || 0); break;
      case 'size': state.lw = Math.max(0.5, args[0] || 1); break;
      case 'up': state.penDown = false; break;
      case 'down': state.penDown = true; break;
      case 'show': state.visible = true; break;
      case 'hide': state.visible = false; break;
      case 'moveTo': state.x = args[0] || 0; state.y = args[1] || 0; break;
      case 'lineTo': {
        const nx = args[0] || 0, ny = args[1] || 0;
        drawLine(state.x, state.y, nx, ny);
        state.x = nx; state.y = ny;
        break;
      }
      case 'o': {
        const [ccx, ccy] = toC(state.x, state.y);
        ctx.beginPath();
        ctx.strokeStyle = state.color;
        ctx.lineWidth = state.lw;
        ctx.arc(ccx, ccy, Math.abs((args[0] || 0) * scale), 0, Math.PI * 2);
        ctx.stroke();
        break;
      }
      case 'oo': {
        const [ccx, ccy] = toC(state.x, state.y);
        ctx.beginPath();
        ctx.fillStyle = args[1] !== undefined ? getColor(args[1]) : state.color;
        ctx.arc(ccx, ccy, Math.abs((args[0] || 0) * scale), 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'e': {
        const [ccx, ccy] = toC(state.x, state.y);
        const rx = Math.abs((args[0] || 0) * scale);
        const ry = Math.abs((args[1] !== undefined ? args[1] : args[0] || 0) * scale);
        ctx.beginPath();
        ctx.strokeStyle = state.color;
        ctx.lineWidth = state.lw;
        ctx.ellipse(ccx, ccy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }
      case 'ee': {
        const [ccx, ccy] = toC(state.x, state.y);
        const rx = Math.abs((args[0] || 0) * scale);
        const ry = Math.abs((args[1] !== undefined ? args[1] : args[0] || 0) * scale);
        ctx.beginPath();
        ctx.fillStyle = state.color;
        ctx.ellipse(ccx, ccy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'r': {
        const [rx, ry] = toC(state.x, state.y);
        ctx.beginPath();
        ctx.strokeStyle = state.color;
        ctx.lineWidth = state.lw;
        ctx.strokeRect(rx, ry - (args[1] || 0) * scale, (args[0] || 0) * scale, (args[1] || 0) * scale);
        break;
      }
      case 'rr': {
        const [rx, ry] = toC(state.x, state.y);
        ctx.beginPath();
        ctx.fillStyle = state.color;
        ctx.fillRect(rx, ry - (args[1] || 0) * scale, (args[0] || 0) * scale, (args[1] || 0) * scale);
        break;
      }
      case 'text': {
        // text(str) or text(x, y, str)
        let tx, ty, str;
        if (args.length >= 3) {
          const [tcx, tcy] = toC(args[0] || 0, args[1] || 0);
          tx = tcx; ty = tcy;
          str = String(args[2] || '');
        } else if (args.length === 2) {
          const [tcx, tcy] = toC(args[0] || 0, 0);
          tx = tcx; ty = tcy;
          str = String(args[1] || '');
        } else {
          const [tcx, tcy] = toC(state.x, state.y);
          tx = tcx; ty = tcy;
          str = String(args[0] || '');
        }
        ctx.fillStyle = state.color;
        const fontSize = Math.round(Math.max(10, state.lw * 8) * scale);
        ctx.font = `${fontSize}px 'PingFang SC', 'Microsoft YaHei', sans-serif`;
        ctx.fillText(str, tx, ty);
        break;
      }
      case 'speed': /* animation speed – frontend handles */ break;
      case 'wait':  /* timing – frontend handles */ break;
      case 'pause': /* pause – frontend handles */ break;
      case 'pic': case 'picL': /* external images – skip */ break;
      case 'cout': /* console output – nothing to draw */ break;
    }
  }

  /**
   * Full render: background + all trajectory steps with optional fit transform (GOC-006).
   */
  function renderTrajectory(ctx, trajectory, w, h, fitMode) {
    drawBackground(ctx, w, h);
    const transform = fitMode ? computeFitTransform(trajectory, w, h, 20) : null;
    const state = createState();
    for (const step of trajectory) {
      applyStep(ctx, step, state, w, h, transform);
    }
  }

  /**
   * Render with a pre-computed transform (GOC-038 image judging).
   * Callers compute transform once from the reference trajectory, then pass it to both renders.
   */
  function renderWithTransform(ctx, trajectory, w, h, transform) {
    drawBackground(ctx, w, h);
    const state = createState();
    for (const step of trajectory) {
      applyStep(ctx, step, state, w, h, transform);
    }
  }

  // ======================= JUDGE =======================

  function judge(userTraj, expectedTraj) {
    const TOL_DIST = 2;
    const TOL_ANGLE = 1;
    const EXACT_CMDS = new Set(['c', 'size', 'up', 'down']);
    const ANGLE_CMDS = new Set(['rt', 'lt']);
    const SKIP_CMDS = new Set(['speed', 'wait', 'pause', 'cout', 'pic', 'picL']);

    // Filter out non-drawing commands for comparison
    const filterTraj = (traj) => traj.filter(s => !SKIP_CMDS.has(s.cmd));
    const uFiltered = filterTraj(userTraj);
    const eFiltered = filterTraj(expectedTraj);

    if (uFiltered.length !== eFiltered.length) {
      return {
        pass: false,
        reason: `轨迹长度不一致：期望 ${eFiltered.length} 步，你的代码执行了 ${uFiltered.length} 步。`
      };
    }

    for (let i = 0; i < eFiltered.length; i++) {
      const exp = eFiltered[i], usr = uFiltered[i];
      if (exp.cmd !== usr.cmd) {
        return { pass: false, reason: `第 ${i + 1} 步指令不同：期望 ${exp.cmd}，实际 ${usr.cmd}` };
      }
      for (let j = 0; j < (exp.args || []).length; j++) {
        const ev = exp.args[j], uv = (usr.args || [])[j] ?? 0;
        if (typeof ev === 'string' || typeof uv === 'string') {
          if (String(ev) !== String(uv)) {
            return { pass: false, reason: `第 ${i + 1} 步 ${exp.cmd}() 参数 ${j + 1} 不匹配：期望 "${ev}"，实际 "${uv}"` };
          }
          continue;
        }
        const tol = EXACT_CMDS.has(exp.cmd) ? 0 : ANGLE_CMDS.has(exp.cmd) ? TOL_ANGLE : TOL_DIST;
        if (Math.abs(ev - uv) > tol) {
          return { pass: false, reason: `第 ${i + 1} 步 ${exp.cmd}() 参数 ${j + 1} 不匹配：期望 ${+ev.toFixed(3)}，实际 ${+uv.toFixed(3)}（容差 ±${tol}）` };
        }
      }
    }

    return { pass: true, reason: '通过！你的代码与标准答案轨迹完全一致。' };
  }

  // ======================= EXPORT =======================

  global.GOCExecutor = new Executor();
  global.GOCRenderer = {
    render: renderTrajectory,
    renderWithTransform,
    drawBackground,
    createState,
    applyStep,
    computeFitTransform,
    GOC_COLORS,
  };
  global.GOCJudge = { judge };

})(typeof window !== 'undefined' ? window : global);
