const fs = require('fs');

console.log('Testing adventures_of_lolo_cyberpunk_remaster.html...');
const htmlContent = fs.readFileSync('/Users/codecaine/html_games/lolo/adventures_of_lolo_cyberpunk_remaster.html', 'utf8');

// Extract JS from <script>
const scriptStart = htmlContent.indexOf('<script>');
const scriptEnd = htmlContent.lastIndexOf('</script>');
let scriptCode = htmlContent.slice(scriptStart + 8, scriptEnd);

// Cut before boot function so DOM UI handlers don't crash in Node
let cutIdx = scriptCode.indexOf('function bootCyberGame');
if (cutIdx === -1) cutIdx = scriptCode.indexOf('window.onload = function');
if (cutIdx !== -1) {
    scriptCode = scriptCode.slice(0, cutIdx);
}

// Mock browser window with the minimal DOM API the boot sequence touches.
const makeCtx = () => ({
    fillRect: () => {}, clearRect: () => {}, beginPath: () => {}, arc: () => {}, fill: () => {}, stroke: () => {},
    moveTo: () => {}, lineTo: () => {}, fillText: () => {}, save: () => {}, restore: () => {},
    setTransform: () => {}, translate: () => {}, scale: () => {}, clear: () => {}, closePath: () => {},
    rect: () => {}, drawImage: () => {}, measureText: () => ({ width: 0 }), setLineDash: () => {},
    canvas: { width: 0, height: 0 }, fillStyle: '', strokeStyle: '', lineWidth: 1, shadowBlur: 0, font: '',
    textAlign: '', textBaseline: '', globalAlpha: 1, shadowColor: ''
});
const makeElement = () => ({
    style: {}, value: '', checked: false, innerHTML: '', textContent: '', dataset: {}, classList: { add: () => {}, remove: () => {} },
    addEventListener: () => {}, appendChild: () => {}, setAttribute: () => {}, getContext: makeCtx,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 0, height: 0 }),
    blur: () => {}, focus: () => {}, click: () => {}, querySelectorAll: () => [],
    querySelector: () => null, innerText: '', outerHTML: '', children: []
});

const storage = { data: {} };
const elementMap = new Map();
const getOrCreateElement = (id) => {
    if (!elementMap.has(id)) elementMap.set(id, makeElement());
    return elementMap.get(id);
};

global.localStorage = { getItem: (k) => (k in storage.data ? storage.data[k] : null), setItem: (k, v) => { storage.data[k] = String(v); } };
global.document = {
    readyState: 'complete',
    getElementById: (id) => getOrCreateElement(id),
    querySelector: () => makeElement(),
    querySelectorAll: (selector) => selector === '.btn-diff-card' ? [makeElement(), makeElement(), makeElement()] : [],
    createElement: () => makeElement(),
    body: { appendChild: () => {} },
    addEventListener: () => {},
    removeEventListener: () => {}
};
global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.requestAnimationFrame = () => 0;
global.cancelAnimationFrame = () => {};
global.AudioContext = class {
    createOscillator() { return { connect: () => {}, start: () => {}, stop: () => {}, frequency: { setValueAtTime: () => {} } }; }
    createGain() { return { connect: () => {}, gain: { setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} } }; }
};
global.webkitAudioContext = global.AudioContext;

eval(scriptCode);

const generatedLevels = typeof generate100Levels === 'function' ? generate100Levels() : ALL_100_LEVELS;
const allLevels = Array.isArray(generatedLevels) ? generatedLevels : ALL_100_LEVELS || [];

console.log(`ALL_100_LEVELS loaded: ${Array.isArray(allLevels)} (Length: ${allLevels.length})`);

let solved = 0;
const sigs = new Set();
const sizeStats = { 9: 0, 11: 0, 13: 0, 15: 0, 17: 0, 19: 0 };
const diffStats = { easy: 0, medium: 0, hard: 0 };

for (let i = 0; i < allLevels.length; i++) {
    const level = allLevels[i];
    if (!level || !level.grid || !Array.isArray(level.grid)) {
        console.log(`❌ Stage ${i + 1} missing or invalid: ${level ? 'grid missing' : 'null level'}`);
        continue;
    }
    const sz = level.gridSize || level.grid.length;
    sizeStats[sz] = (sizeStats[sz] || 0) + 1;
    diffStats[level.difficulty] = (diffStats[level.difficulty] || 0) + 1;

    const sig = getLevelLayoutSignature(level);
    sigs.add(sig);

    const sol = LoloMathSolver.solve(level);
    if (sol.solvable) {
        solved++;
    } else {
        console.log(`❌ Stage ${i + 1} (Size ${sz}, ${level.difficulty}) failed solver: ${sol.reason}`);
    }
}

console.log('\n================ VERIFICATION SUMMARY ================');
console.log(`Campaign Solvability: ${solved} / 100 (${(solved/100*100)}%)`);
console.log(`Unique Signatures:    ${sigs.size} / 100 Unique Stages`);
console.log(`Grid Size Scaling:    9x9: ${sizeStats[9]}, 11x11: ${sizeStats[11]}, 13x13: ${sizeStats[13]}, 15x15: ${sizeStats[15]}, 17x17: ${sizeStats[17]}, 19x19: ${sizeStats[19]}`);
console.log(`Difficulty Tiers:     Easy: ${diffStats.easy}, Medium: ${diffStats.medium}, Hard: ${diffStats.hard}`);
console.log('======================================================\n');

if (solved === 100 && sigs.size === 100) {
    console.log('🎉 100% SPECIFICATION COMPLIANCE VERIFIED SUCCESSFULLY!');
    process.exit(0);
} else {
    console.error(`❌ Verification failed: solved=${solved}, unique=${sigs.size}`);
    process.exit(1);
}
