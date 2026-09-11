/* =========================================================
   CodeWithSaadat — Scientific Calculator & Unit Converter
   script.js

   Table of contents:
   1.  Utility helpers (DOM shortcuts, toast notifications)
   2.  App state & localStorage persistence
   3.  Theme + fullscreen + navigation
   4.  Calculator expression engine (tokenizer + parser)
   5.  Calculator UI wiring (buttons, keyboard, display)
   6.  Memory functions (MC / MR / M+ / M- / MS)
   7.  History (add / render / delete / clear / reuse)
   8.  Unit converter data & generic conversion logic
   9.  Currency converter (API-ready, no fake rates)
   10. Number system converter + binary arithmetic
   ========================================================= */

/* =========================================================
   1. UTILITY HELPERS
   ========================================================= */
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

/** Show a small toast notification at the bottom of the screen. */
function showToast(message, duration = 2200) {
  const container = $('#toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

/** Safely read/write JSON from localStorage. */
const storage = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* storage may be unavailable (private mode) — fail silently */
    }
  }
};

/* =========================================================
   2. APP STATE
   ========================================================= */
const state = {
  expression: '',        // raw expression as typed, e.g. "12+sin(30)*2"
  angleMode: 'DEG',       // DEG | RAD | GRAD
  memoryValue: 0,
  memoryActive: false,
  history: storage.get('cws_history', []),
  theme: storage.get('cws_theme', 'dark'),
};

/* =========================================================
   3. THEME / FULLSCREEN / NAVIGATION
   ========================================================= */
function initTheme() {
  if (state.theme === 'light') {
    document.body.classList.add('light-theme');
    $('#themeIcon').textContent = '☀️';
  }
  $('#themeToggle').addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    $('#themeIcon').textContent = isLight ? '☀️' : '🌙';
    state.theme = isLight ? 'light' : 'dark';
    storage.set('cws_theme', state.theme);
  });
}

function initFullscreen() {
  $('#fullscreenToggle').addEventListener('click', () => {
    document.body.classList.toggle('fullscreen-mode');
    const isFull = document.body.classList.contains('fullscreen-mode');
    showToast(isFull ? 'Fullscreen calculator mode on' : 'Fullscreen mode off');
  });
}

function initNavigation() {
  const allNavButtons = $$('.nav-btn');

  function activateTab(tabName) {
    $$('.tab-panel').forEach(panel => panel.classList.remove('active'));
    $(`#tab-${tabName}`).classList.add('active');
    allNavButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabName));
    $('#mobileNav').classList.remove('open');
    if (tabName === 'history') renderFullHistory();
  }

  allNavButtons.forEach(btn => {
    btn.addEventListener('click', () => activateTab(btn.dataset.tab));
  });

  $('#hamburgerBtn').addEventListener('click', () => {
    $('#mobileNav').classList.toggle('open');
  });
}

/* =========================================================
   4. CALCULATOR EXPRESSION ENGINE
   A small hand-written tokenizer + recursive-descent parser.
   We avoid eval() entirely for safety and predictability.
   ========================================================= */

const FUNCTION_NAMES = [
  'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh',
  'sin', 'cos', 'tan', 'cot', 'sec', 'csc',
  'log', 'ln', 'sqrt', 'cbrt', 'abs'
];
const CONSTANT_NAMES = ['pi', 'phi', 'e'];

/** Convert an angle (in the current mode) to radians. */
function toRadians(value) {
  if (state.angleMode === 'DEG') return (value * Math.PI) / 180;
  if (state.angleMode === 'GRAD') return (value * Math.PI) / 200;
  return value; // already radians
}

/** Convert radians back to the current display angle mode. */
function fromRadians(value) {
  if (state.angleMode === 'DEG') return (value * 180) / Math.PI;
  if (state.angleMode === 'GRAD') return (value * 200) / Math.PI;
  return value;
}

function factorial(n) {
  if (n < 0 || !Number.isFinite(n)) throw new Error('Invalid factorial');
  if (Math.floor(n) !== n) throw new Error('Factorial requires an integer');
  if (n > 170) return Infinity;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

function applyFunction(name, arg) {
  switch (name) {
    case 'sin': return Math.sin(toRadians(arg));
    case 'cos': return Math.cos(toRadians(arg));
    case 'tan': return Math.tan(toRadians(arg));
    case 'cot': return 1 / Math.tan(toRadians(arg));
    case 'sec': return 1 / Math.cos(toRadians(arg));
    case 'csc': return 1 / Math.sin(toRadians(arg));
    case 'asin': return fromRadians(Math.asin(arg));
    case 'acos': return fromRadians(Math.acos(arg));
    case 'atan': return fromRadians(Math.atan(arg));
    case 'sinh': return Math.sinh(arg);
    case 'cosh': return Math.cosh(arg);
    case 'tanh': return Math.tanh(arg);
    case 'log': return Math.log10(arg);
    case 'ln': return Math.log(arg);
    case 'sqrt': return Math.sqrt(arg);
    case 'cbrt': return Math.cbrt(arg);
    case 'abs': return Math.abs(arg);
    default: throw new Error('Unknown function: ' + name);
  }
}

/** Tokenizer: turns the raw expression string into a token array. */
function tokenize(source) {
  const tokens = [];
  let i = 0;
  while (i < source.length) {
    const ch = source[i];

    if (ch === ' ') { i++; continue; }

    if (/[0-9.]/.test(ch)) {
      let num = '';
      while (i < source.length && /[0-9.]/.test(source[i])) { num += source[i]; i++; }
      // Support scientific notation (e.g. "1.5e-7") only when the "e" directly
      // follows digits we just consumed, so a bare "e" elsewhere still means Euler's number.
      if ((source[i] === 'e' || source[i] === 'E') && /[0-9+\-]/.test(source[i + 1] || '')) {
        num += source[i]; i++;
        if (source[i] === '+' || source[i] === '-') { num += source[i]; i++; }
        while (i < source.length && /[0-9]/.test(source[i])) { num += source[i]; i++; }
      }
      tokens.push({ type: 'number', value: parseFloat(num) });
      continue;
    }

    if ('+-*/^%().!,'.includes(ch)) {
      tokens.push({ type: 'symbol', value: ch });
      i++;
      continue;
    }

    // try to match a word: function name, constant, or "mod"
    const rest = source.slice(i);
    const wordMatch = rest.match(/^[a-zA-Z]+/);
    if (wordMatch) {
      const word = wordMatch[0];
      if (word === 'mod') {
        tokens.push({ type: 'symbol', value: 'mod' });
      } else if (FUNCTION_NAMES.includes(word)) {
        tokens.push({ type: 'func', value: word });
      } else if (CONSTANT_NAMES.includes(word)) {
        tokens.push({ type: 'const', value: word });
      } else {
        throw new Error('Unrecognized token: ' + word);
      }
      i += word.length;
      continue;
    }

    throw new Error('Unexpected character: ' + ch);
  }
  return tokens;
}

/** Recursive-descent parser + evaluator, operating directly on the token stream. */
function evaluateExpression(source) {
  const tokens = tokenize(source);
  let pos = 0;

  const peek = () => tokens[pos];
  const consume = () => tokens[pos++];

  function parseExpression() {
    let value = parseTerm();
    while (peek() && peek().type === 'symbol' && (peek().value === '+' || peek().value === '-')) {
      const op = consume().value;
      const rhs = parseTerm();
      value = op === '+' ? value + rhs : value - rhs;
    }
    return value;
  }

  function parseTerm() {
    let value = parsePower();
    while (peek() && peek().type === 'symbol' && ['*', '/', 'mod'].includes(peek().value)) {
      const op = consume().value;
      const rhs = parsePower();
      if (op === '*') value = value * rhs;
      else if (op === '/') {
        if (rhs === 0) throw new Error('Division by zero');
        value = value / rhs;
      } else value = value % rhs;
    }
    return value;
  }

  function parsePower() {
    const base = parseUnary();
    if (peek() && peek().type === 'symbol' && peek().value === '^') {
      consume();
      const exponent = parsePower(); // right-associative
      return Math.pow(base, exponent);
    }
    return base;
  }

  function parseUnary() {
    if (peek() && peek().type === 'symbol' && peek().value === '-') {
      consume();
      return -parseUnary();
    }
    if (peek() && peek().type === 'symbol' && peek().value === '+') {
      consume();
      return parseUnary();
    }
    return parsePostfix();
  }

  function parsePostfix() {
    let value = parsePrimary();
    while (peek() && peek().type === 'symbol' && (peek().value === '!' || peek().value === '%')) {
      const op = consume().value;
      value = op === '!' ? factorial(value) : value / 100;
    }
    return value;
  }

  function parsePrimary() {
    const tok = peek();
    if (!tok) throw new Error('Unexpected end of expression');

    if (tok.type === 'number') { consume(); return tok.value; }

    if (tok.type === 'const') {
      consume();
      if (tok.value === 'pi') return Math.PI;
      if (tok.value === 'e') return Math.E;
      if (tok.value === 'phi') return (1 + Math.sqrt(5)) / 2;
    }

    if (tok.type === 'func') {
      consume();
      expectSymbol('(');
      const arg = parseExpression();
      expectSymbol(')');
      return applyFunction(tok.value, arg);
    }

    if (tok.type === 'symbol' && tok.value === '(') {
      consume();
      const value = parseExpression();
      expectSymbol(')');
      return value;
    }

    throw new Error('Unexpected token in expression');
  }

  function expectSymbol(sym) {
    const tok = consume();
    if (!tok || tok.type !== 'symbol' || tok.value !== sym) {
      throw new Error(`Expected "${sym}"`);
    }
  }

  if (tokens.length === 0) return 0;
  const result = parseExpression();
  if (pos !== tokens.length) throw new Error('Unexpected trailing input');
  if (!Number.isFinite(result)) throw new Error('Result is not a finite number');
  return result;
}

/** Format a number for display: trims floating point noise, limits length. */
function formatNumber(value) {
  if (!Number.isFinite(value)) return 'Error';
  if (Number.isInteger(value)) return value.toString();
  // Round to 10 significant decimal places to avoid float noise, then trim zeros.
  const rounded = parseFloat(value.toPrecision(12));
  return rounded.toString();
}

/* =========================================================
   5. CALCULATOR UI WIRING
   ========================================================= */
let lastResult = null;      // holds numeric result of the last "=" press
let justEvaluated = false;  // true right after pressing "=" — next digit starts fresh

function updateDisplay() {
  $('#expressionLine').innerHTML = displayExpression(state.expression) || '&nbsp;';
}

/** Convert internal expression (using * / mod) into calculator-friendly symbols for display. */
function displayExpression(expr) {
  return expr
    .replace(/\*/g, '×')
    .replace(/\//g, '÷')
    .replace(/mod/g, ' mod ');
}

function setResultDisplay(text) {
  $('#resultLine').textContent = text;
}

function insertToExpression(fragment) {
  if (justEvaluated) {
    // Starting a fresh calculation after "="
    const isOperator = ['+', '-', '*', '/', '^', 'mod'].includes(fragment);
    state.expression = isOperator ? formatNumber(lastResult) + fragment : fragment;
    justEvaluated = false;
  } else {
    state.expression += fragment;
  }
  updateDisplay();
}

function insertFunctionCall(funcName) {
  insertToExpression(funcName + '(');
}

function clearCalculator() {
  state.expression = '';
  justEvaluated = false;
  updateDisplay();
  setResultDisplay('0');
}

function backspace() {
  if (justEvaluated) { clearCalculator(); return; }
  state.expression = state.expression.slice(0, -1);
  updateDisplay();
}

function toggleSign() {
  // Wrap the whole current expression in a unary minus, or unwrap if already negated.
  if (!state.expression) return;
  if (state.expression.startsWith('-(') && state.expression.endsWith(')')) {
    state.expression = state.expression.slice(2, -1);
  } else {
    state.expression = `-(${state.expression})`;
  }
  updateDisplay();
}

function calculateEquals() {
  if (!state.expression.trim()) return;
  try {
    const result = evaluateExpression(state.expression);
    const formatted = formatNumber(result);
    setResultDisplay(formatted);
    addHistoryEntry(displayExpression(state.expression), formatted);
    lastResult = result;
    justEvaluated = true;
  } catch (err) {
    setResultDisplay('Error');
    showToast('Invalid expression — check your syntax');
    justEvaluated = true;
    lastResult = 0;
  }
}

function applyScientificFunction(funcName) {
  // Functions that take the CURRENT result/expression as an immediate single argument
  const immediateOps = {
    square: v => Math.pow(v, 2),
    cube: v => Math.pow(v, 3),
    reciprocal: v => 1 / v,
    percent: v => v / 100,
    fact: v => factorial(v),
    abs: v => Math.abs(v),
  };

  if (funcName === 'pi') { insertToExpression('pi'); return; }
  if (funcName === 'e') { insertToExpression('e'); return; }
  if (funcName === 'phi') { insertToExpression('phi'); return; }
  if (funcName === 'rand') { insertToExpression(formatNumber(Math.random())); return; }
  if (funcName === 'mod') { insertToExpression('mod'); return; }

  if (immediateOps[funcName]) {
    // Evaluate current expression first, then apply the wrapping function to the result.
    try {
      const base = state.expression.trim() ? evaluateExpression(state.expression) : (lastResult || 0);
      const result = immediateOps[funcName](base);
      state.expression = formatNumber(result);
      updateDisplay();
    } catch (err) {
      setResultDisplay('Error');
      showToast('Cannot apply that function here');
    }
    return;
  }

  // Otherwise it's a wrapping function like sin( cos( sqrt( etc.
  insertFunctionCall(funcName);
}

function initCalculatorButtons() {
  // Number + operator + paren insert buttons
  $$('[data-num]').forEach(btn => {
    btn.addEventListener('click', () => insertToExpression(btn.dataset.num));
  });
  $$('[data-insert]').forEach(btn => {
    btn.addEventListener('click', () => insertToExpression(btn.dataset.insert));
  });
  $$('[data-func]').forEach(btn => {
    btn.addEventListener('click', () => applyScientificFunction(btn.dataset.func));
  });

  // Action buttons (AC, backspace, +/-, equals, toggle sci panel)
  $$('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      switch (btn.dataset.action) {
        case 'clear': clearCalculator(); break;
        case 'backspace': backspace(); break;
        case 'toggle-sign': toggleSign(); break;
        case 'equals': calculateEquals(); break;
        case 'toggle-sci': toggleSciPanel(); break;
        case 'mc': memoryClear(); break;
        case 'mr': memoryRecall(); break;
        case 'ms': memoryStore(); break;
        case 'm-plus': memoryAdd(); break;
        case 'm-minus': memorySubtract(); break;
      }
    });
  });

  // Angle mode switch
  $$('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.angleMode = btn.dataset.mode;
      $$('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  $('#copyResultBtn').addEventListener('click', copyResult);
}

function toggleSciPanel() {
  const panel = $('#sciPanel');
  panel.classList.toggle('collapsed');
  const btn = $('[data-action="toggle-sci"]');
  btn.textContent = panel.classList.contains('collapsed') ? '▼' : '▲';
}

function copyResult() {
  const text = $('#resultLine').textContent;
  navigator.clipboard?.writeText(text).then(
    () => showToast('Result copied: ' + text),
    () => showToast('Could not copy result')
  );
}

/** Keyboard support for fast, familiar calculator input. */
function initKeyboardSupport() {
  document.addEventListener('keydown', (e) => {
    // Ignore keystrokes while typing into converter inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

    if (/[0-9.]/.test(e.key)) { insertToExpression(e.key); return; }
    if (['+', '-', '*', '/', '(', ')', '^', '%'].includes(e.key)) { insertToExpression(e.key); return; }
    if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); calculateEquals(); return; }
    if (e.key === 'Backspace') { backspace(); return; }
    if (e.key === 'Escape') { clearCalculator(); return; }
  });
}

/* =========================================================
   6. MEMORY FUNCTIONS
   ========================================================= */
function currentDisplayedValue() {
  if (state.expression.trim()) {
    try { return evaluateExpression(state.expression); } catch (e) { /* fall through */ }
  }
  return lastResult || 0;
}

function updateMemoryIndicator() {
  $('#memoryIndicator').classList.toggle('active', state.memoryActive);
}

function memoryClear() {
  state.memoryValue = 0;
  state.memoryActive = false;
  updateMemoryIndicator();
  showToast('Memory cleared');
}

function memoryRecall() {
  if (!state.memoryActive) { showToast('Memory is empty'); return; }
  insertToExpression(formatNumber(state.memoryValue));
}

function memoryStore() {
  state.memoryValue = currentDisplayedValue();
  state.memoryActive = true;
  updateMemoryIndicator();
  showToast('Stored in memory: ' + formatNumber(state.memoryValue));
}

function memoryAdd() {
  state.memoryValue += currentDisplayedValue();
  state.memoryActive = true;
  updateMemoryIndicator();
  showToast('Added to memory');
}

function memorySubtract() {
  state.memoryValue -= currentDisplayedValue();
  state.memoryActive = true;
  updateMemoryIndicator();
  showToast('Subtracted from memory');
}

/* =========================================================
   7. HISTORY
   ========================================================= */
function addHistoryEntry(expression, result) {
  const entry = { expression, result, timestamp: Date.now() };
  state.history.unshift(entry);
  if (state.history.length > 200) state.history.pop();
  storage.set('cws_history', state.history);
  renderSideHistory();
  renderFullHistory();
}

function buildHistoryItem(entry, index) {
  const li = document.createElement('li');
  li.className = 'history-item';
  li.innerHTML = `
    <div class="hist-text">
      <div class="hist-expr">${entry.expression}</div>
      <div class="hist-result">= ${entry.result}</div>
    </div>
    <button class="hist-delete" title="Delete entry" aria-label="Delete entry">✕</button>
  `;
  li.querySelector('.hist-text').addEventListener('click', () => reuseHistoryEntry(entry));
  li.querySelector('.hist-delete').addEventListener('click', (e) => {
    e.stopPropagation();
    deleteHistoryEntry(index);
  });
  return li;
}

function renderSideHistory() {
  const list = $('#sideHistoryList');
  list.innerHTML = '';
  state.history.slice(0, 50).forEach((entry, index) => list.appendChild(buildHistoryItem(entry, index)));
}

function renderFullHistory() {
  const list = $('#fullHistoryList');
  const emptyState = $('#historyEmptyState');
  list.innerHTML = '';
  state.history.forEach((entry, index) => list.appendChild(buildHistoryItem(entry, index)));
  emptyState.style.display = state.history.length ? 'none' : 'block';
}

function reuseHistoryEntry(entry) {
  // Convert display symbols back to internal operators before reloading.
  state.expression = entry.expression.replace(/×/g, '*').replace(/÷/g, '/').replace(/\s*mod\s*/g, 'mod');
  justEvaluated = false;
  updateDisplay();
  setResultDisplay(entry.result);
  $$('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === 'calculator'));
  $$('.tab-panel').forEach(p => p.classList.toggle('active', p.id === 'tab-calculator'));
  showToast('Loaded from history');
}

function deleteHistoryEntry(index) {
  state.history.splice(index, 1);
  storage.set('cws_history', state.history);
  renderSideHistory();
  renderFullHistory();
}

function clearAllHistory() {
  if (!state.history.length) { showToast('History is already empty'); return; }
  state.history = [];
  storage.set('cws_history', state.history);
  renderSideHistory();
  renderFullHistory();
  showToast('History cleared');
}

function initHistoryControls() {
  $('#sideClearHistory').addEventListener('click', clearAllHistory);
  $('#clearAllHistoryBtn').addEventListener('click', clearAllHistory);
  renderSideHistory();
  renderFullHistory();
}

/* =========================================================
   8. UNIT CONVERTER — generic categories
   Each category stores unit factors relative to one base unit.
   convertedValue = (inputValue * factors[fromUnit]) / factors[toUnit]
   Temperature is handled specially since it is not a pure ratio.
   ========================================================= */
const UNIT_CATEGORIES = {
  length: {
    base: 'meter',
    units: {
      millimeter: 0.001, centimeter: 0.01, meter: 1, kilometer: 1000,
      inch: 0.0254, foot: 0.3048, yard: 0.9144, mile: 1609.344,
      nauticalMile: 1852,
    },
    labels: {
      millimeter: 'Millimeter (mm)', centimeter: 'Centimeter (cm)', meter: 'Meter (m)',
      kilometer: 'Kilometer (km)', inch: 'Inch (in)', foot: 'Foot (ft)', yard: 'Yard (yd)',
      mile: 'Mile (mi)', nauticalMile: 'Nautical Mile (nmi)',
    }
  },
  area: {
    base: 'sqMeter',
    units: {
      sqMillimeter: 0.000001, sqCentimeter: 0.0001, sqMeter: 1, sqKilometer: 1000000,
      sqInch: 0.00064516, sqFoot: 0.092903, sqYard: 0.836127, acre: 4046.8564224,
      hectare: 10000, sqMile: 2589988.110336,
    },
    labels: {
      sqMillimeter: 'Square Millimeter', sqCentimeter: 'Square Centimeter', sqMeter: 'Square Meter',
      sqKilometer: 'Square Kilometer', sqInch: 'Square Inch', sqFoot: 'Square Foot',
      sqYard: 'Square Yard', acre: 'Acre', hectare: 'Hectare', sqMile: 'Square Mile',
    }
  },
  volume: {
    base: 'liter',
    units: {
      milliliter: 0.001, liter: 1, cubicMeter: 1000, cubicCentimeter: 0.001,
      gallon: 3.785411784, quart: 0.946352946, pint: 0.473176473,
      cup: 0.2365882365, fluidOunce: 0.0295735296,
    },
    labels: {
      milliliter: 'Milliliter (mL)', liter: 'Liter (L)', cubicMeter: 'Cubic Meter (m³)',
      cubicCentimeter: 'Cubic Centimeter (cm³)', gallon: 'Gallon (US)', quart: 'Quart (US)',
      pint: 'Pint (US)', cup: 'Cup (US)', fluidOunce: 'Fluid Ounce (US)',
    }
  },
  weight: {
    base: 'kilogram',
    units: {
      milligram: 0.000001, gram: 0.001, kilogram: 1, metricTon: 1000,
      ounce: 0.028349523125, pound: 0.45359237, stone: 6.35029318, usTon: 907.18474,
    },
    labels: {
      milligram: 'Milligram (mg)', gram: 'Gram (g)', kilogram: 'Kilogram (kg)',
      metricTon: 'Metric Ton (t)', ounce: 'Ounce (oz)', pound: 'Pound (lb)',
      stone: 'Stone (st)', usTon: 'US Ton',
    }
  },
  speed: {
    base: 'mps',
    units: {
      mps: 1, kph: 0.277778, mph: 0.44704, fps: 0.3048, knot: 0.514444,
    },
    labels: {
      mps: 'Meter/second (m/s)', kph: 'Kilometer/hour (km/h)', mph: 'Mile/hour (mph)',
      fps: 'Foot/second (ft/s)', knot: 'Knot (kn)',
    }
  },
  pressure: {
    base: 'pascal',
    units: {
      pascal: 1, kilopascal: 1000, bar: 100000, psi: 6894.757293168,
      atmosphere: 101325, mmHg: 133.322387415, torr: 133.322368421,
    },
    labels: {
      pascal: 'Pascal (Pa)', kilopascal: 'Kilopascal (kPa)', bar: 'Bar', psi: 'PSI',
      atmosphere: 'Atmosphere (atm)', mmHg: 'mmHg', torr: 'Torr',
    }
  },
  power: {
    base: 'watt',
    units: {
      watt: 1, kilowatt: 1000, megawatt: 1000000, horsepower: 745.699872,
      btuPerHour: 0.29307107,
    },
    labels: {
      watt: 'Watt (W)', kilowatt: 'Kilowatt (kW)', megawatt: 'Megawatt (MW)',
      horsepower: 'Horsepower (hp)', btuPerHour: 'BTU/hour',
    }
  },
};

/** Temperature needs explicit formulas since it isn't a simple ratio to a base unit. */
function convertTemperature(value, fromUnit, toUnit) {
  if (fromUnit === toUnit) return value;
  // Normalize to Celsius first
  let celsius;
  if (fromUnit === 'celsius') celsius = value;
  else if (fromUnit === 'fahrenheit') celsius = (value - 32) * (5 / 9);
  else celsius = value - 273.15; // kelvin

  if (toUnit === 'celsius') return celsius;
  if (toUnit === 'fahrenheit') return celsius * (9 / 5) + 32;
  return celsius + 273.15; // kelvin
}

const TEMPERATURE_LABELS = { celsius: 'Celsius (°C)', fahrenheit: 'Fahrenheit (°F)', kelvin: 'Kelvin (K)' };

let currentCategory = 'currency';

function populateUnitSelectors(category) {
  const fromSelect = $('#fromUnit');
  const toSelect = $('#toUnit');
  fromSelect.innerHTML = '';
  toSelect.innerHTML = '';

  let labels, keys;
  if (category === 'temperature') {
    labels = TEMPERATURE_LABELS;
    keys = Object.keys(TEMPERATURE_LABELS);
  } else {
    labels = UNIT_CATEGORIES[category].labels;
    keys = Object.keys(UNIT_CATEGORIES[category].units);
  }

  keys.forEach((key, i) => {
    const optionFrom = new Option(labels[key], key, i === 0, i === 0);
    const optionTo = new Option(labels[key], key, i === 1, i === 1);
    fromSelect.add(optionFrom);
    toSelect.add(optionTo);
  });
  if (keys.length === 1) toSelect.selectedIndex = 0;
}

function runGenericConversion() {
  const value = parseFloat($('#fromValue').value);
  const fromUnit = $('#fromUnit').value;
  const toUnit = $('#toUnit').value;
  const note = $('#genericNote');

  if (Number.isNaN(value)) {
    $('#toValue').value = '';
    note.textContent = 'Enter a numeric value to convert.';
    return;
  }

  let result;
  if (currentCategory === 'temperature') {
    result = convertTemperature(value, fromUnit, toUnit);
  } else {
    const units = UNIT_CATEGORIES[currentCategory].units;
    result = (value * units[fromUnit]) / units[toUnit];
  }

  $('#toValue').value = formatNumber(result);
  note.textContent = `${formatNumber(value)} ${fromUnit} = ${formatNumber(result)} ${toUnit}`;
}

function initGenericConverter() {
  $('#fromValue').addEventListener('input', runGenericConversion);
  $('#fromUnit').addEventListener('change', runGenericConversion);
  $('#toUnit').addEventListener('change', runGenericConversion);
  $('#swapUnitsBtn').addEventListener('click', () => {
    const fromSelect = $('#fromUnit');
    const toSelect = $('#toUnit');
    const temp = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = temp;
    runGenericConversion();
  });
}

function switchCategory(category) {
  currentCategory = category;
  $$('.cat-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.category === category));

  $('#genericConverter').style.display = 'none';
  $('#currencyConverter').style.display = 'none';
  $('#numsysConverter').style.display = 'none';

  if (category === 'currency') {
    $('#currencyConverter').style.display = 'block';
  } else if (category === 'numsys') {
    $('#numsysConverter').style.display = 'block';
  } else {
    $('#genericConverter').style.display = 'block';
    populateUnitSelectors(category);
    runGenericConversion();
  }
}

function initCategoryTabs() {
  $$('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => switchCategory(btn.dataset.category));
  });
  switchCategory('currency');
}

/* =========================================================
   9. CURRENCY CONVERTER (structured for a real API)
   No live/fake rates are hard-coded. Wire up CURRENCY_API_CONFIG.apiUrl
   and CURRENCY_API_CONFIG.enabled = true to connect a real provider,
   e.g. https://api.exchangerate.host or https://openexchangerates.org
   ========================================================= */
const CURRENCY_API_CONFIG = {
  // Live and connected by default: ExchangeRate-API's free "Open Access" endpoint.
  // No signup, no API key, CORS-enabled, updates once every 24 hours.
  // Docs: https://www.exchangerate-api.com/docs/free — attribution required, see below.
  enabled: true,
  apiUrl: 'https://open.er-api.com/v6/latest',
  apiKey: '',                   // only needed if you switch to a provider that requires one
  attribution: 'Rates by ExchangeRate-API (open.er-api.com)',

  /**
   * Fetches live rates for a base currency and normalizes the response into
   * the shape the rest of the app expects: { rates: { USD: 1, EUR: 0.9, ... }, date }
   * Swap this implementation (and apiUrl/apiKey above) to point at any other
   * provider — just keep returning that same { rates, date } shape.
   */
  async fetchRates(baseCurrency) {
    if (!this.enabled || !this.apiUrl) {
      throw new Error('No exchange-rate API is connected yet.');
    }
    const url = `${this.apiUrl}/${baseCurrency}${this.apiKey ? '?access_key=' + this.apiKey : ''}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Exchange-rate API request failed.');
    const data = await response.json();
    if (data.result && data.result !== 'success') throw new Error('Exchange-rate API returned an error.');
    return {
      rates: data.rates || data.conversion_rates,
      date: data.time_last_update_utc || data.date || new Date().toUTCString(),
    };
  }
};

const CURRENCIES = ['USD', 'EUR', 'GBP', 'PKR', 'INR', 'AED', 'SAR', 'CAD', 'AUD', 'JPY', 'CNY', 'TRY', 'QAR', 'KWD'];

function populateCurrencySelectors() {
  const fromSelect = $('#currencyFrom');
  const toSelect = $('#currencyTo');
  CURRENCIES.forEach((code, i) => {
    fromSelect.add(new Option(code, code, i === 0, i === 0));
    toSelect.add(new Option(code, code, i === 1, i === 1));
  });
}

async function runCurrencyConversion() {
  const amount = parseFloat($('#currencyAmount').value);
  const from = $('#currencyFrom').value;
  const to = $('#currencyTo').value;

  if (Number.isNaN(amount)) {
    showToast('Enter a valid amount to convert');
    return;
  }

  $('#currencyResult').value = 'Loading…';

  try {
    const data = await CURRENCY_API_CONFIG.fetchRates(from);
    const rate = data.rates[to];
    if (!rate) throw new Error('Rate unavailable for ' + to);
    const converted = amount * rate;
    $('#currencyResult').value = `${formatNumber(converted)} ${to}`;
    $('#currencyRateInfo').textContent = `Exchange rate: 1 ${from} = ${formatNumber(rate)} ${to}`;
    $('#currencyUpdatedInfo').textContent = `Last updated: ${data.date}`;
  } catch (err) {
    $('#currencyResult').value = '';
    $('#currencyRateInfo').textContent = 'Exchange rate: not available';
    $('#currencyUpdatedInfo').textContent = 'Last updated: —';
    showToast(CURRENCY_API_CONFIG.enabled
      ? 'Could not reach the exchange-rate API — check your connection and try again'
      : 'No live exchange-rate API is connected yet');
  }
}

function initCurrencyConverter() {
  populateCurrencySelectors();
  $('#convertCurrencyBtn').addEventListener('click', runCurrencyConversion);
  $('#swapCurrencyBtn').addEventListener('click', () => {
    const fromSelect = $('#currencyFrom');
    const toSelect = $('#currencyTo');
    const temp = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = temp;
  });
}

/* =========================================================
   10. NUMBER SYSTEM CONVERTER + BINARY ARITHMETIC
   ========================================================= */
const NUMSYS_INPUTS = {
  2: 'binInput',
  10: 'decInput',
  8: 'octInput',
  16: 'hexInput',
};

const BASE_PATTERNS = {
  2: /^[01]+$/,
  8: /^[0-7]+$/,
  10: /^[0-9]+$/,
  16: /^[0-9a-fA-F]+$/,
};

function syncNumberSystems(sourceBase, rawValue) {
  const note = $('#numsysNote');
  const sourceEl = $(`#${NUMSYS_INPUTS[sourceBase]}`);

  if (!rawValue) {
    Object.values(NUMSYS_INPUTS).forEach(id => { if ($(`#${id}`) !== sourceEl) $(`#${id}`).value = ''; });
    sourceEl.classList.remove('invalid');
    note.textContent = 'Type a value into any field — the others update automatically.';
    return;
  }

  if (!BASE_PATTERNS[sourceBase].test(rawValue)) {
    sourceEl.classList.add('invalid');
    note.textContent = `That is not a valid base-${sourceBase} number.`;
    return;
  }
  sourceEl.classList.remove('invalid');

  const decimalValue = parseInt(rawValue, sourceBase);
  Object.entries(NUMSYS_INPUTS).forEach(([base, id]) => {
    const el = $(`#${id}`);
    if (el === sourceEl) return;
    el.value = decimalValue.toString(Number(base)).toUpperCase();
  });
  note.textContent = `Decimal value: ${decimalValue}`;
}

function initNumberSystemConverter() {
  Object.entries(NUMSYS_INPUTS).forEach(([base, id]) => {
    $(`#${id}`).addEventListener('input', (e) => syncNumberSystems(Number(base), e.target.value.trim()));
  });

  $('#binCalcBtn').addEventListener('click', runBinaryArithmetic);
}

function runBinaryArithmetic() {
  const rawA = $('#binA').value.trim();
  const rawB = $('#binB').value.trim();
  const op = $('#binOp').value;
  const resultEl = $('#binArithResult');

  if (!BASE_PATTERNS[2].test(rawA) || !BASE_PATTERNS[2].test(rawB)) {
    resultEl.textContent = 'Enter valid binary numbers (only 0s and 1s) in both fields.';
    return;
  }

  const a = parseInt(rawA, 2);
  const b = parseInt(rawB, 2);
  let result;
  switch (op) {
    case 'add': result = a + b; break;
    case 'sub': result = a - b; break;
    case 'mul': result = a * b; break;
    case 'and': result = a & b; break;
    case 'or': result = a | b; break;
    case 'xor': result = a ^ b; break;
  }

  const binaryResult = result < 0 ? '-' + Math.abs(result).toString(2) : result.toString(2);
  resultEl.textContent = `Result: ${binaryResult} (binary)  =  ${result} (decimal)`;
}

/* =========================================================
   APP INITIALIZATION
   ========================================================= */
function initApp() {
  initTheme();
  initFullscreen();
  initNavigation();
  initCalculatorButtons();
  initKeyboardSupport();
  initHistoryControls();
  initGenericConverter();
  initCategoryTabs();
  initCurrencyConverter();
  initNumberSystemConverter();
  updateMemoryIndicator();
  clearCalculator();
}

document.addEventListener('DOMContentLoaded', initApp);
