const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'adventures_of_lolo_cyberpunk_remaster.html'), 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);

const makeCtx = () => ({
    fillRect: () => {}, clearRect: () => {}, beginPath: () => {}, arc: () => {}, fill: () => {}, stroke: () => {},
    moveTo: () => {}, lineTo: () => {}, fillText: () => {}, save: () => {}, restore: () => {},
    setTransform: () => {}, translate: () => {}, scale: () => {}, rotate: () => {}, clear: () => {}, closePath: () => {},
    rect: () => {}, strokeRect: () => {}, drawImage: () => {}, measureText: () => ({ width: 0 }), setLineDash: () => {},
    quadraticCurveTo: () => {}, bezierCurveTo: () => {}, ellipse: () => {},
    createRadialGradient: () => ({ addColorStop: () => {} }), createLinearGradient: () => ({ addColorStop: () => {} }),
    canvas: { width: 640, height: 640 }, fillStyle: '', strokeStyle: '', lineWidth: 1, shadowBlur: 0, font: '',
    textAlign: '', textBaseline: '', globalAlpha: 1, shadowColor: '', lineCap: 'butt', lineJoin: 'miter'
});

const mockElement = () => ({
    style: { setProperty: () => {}, removeProperty: () => {}, getPropertyValue: () => '' },
    value: '', checked: false, innerHTML: '', textContent: '', dataset: {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
    addEventListener: () => {}, removeEventListener: () => {}, appendChild: () => {}, setAttribute: () => {},
    getAttribute: () => null, getContext: makeCtx,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 640, height: 640 }),
    querySelectorAll: () => [], querySelector: () => null
});

global.document = {
    readyState: 'complete',
    getElementById: () => mockElement(),
    querySelector: () => mockElement(),
    querySelectorAll: () => [],
    createElement: () => mockElement(),
    body: mockElement(),
    addEventListener: () => {},
    removeEventListener: () => {}
};

global.window = {
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
    location: { search: '', href: '' },
    navigator: { userAgent: 'Node' },
    showVictoryModal: () => {},
    AudioContext: class {
        createOscillator() { return { connect: () => {}, start: () => {}, stop: () => {}, frequency: { setValueAtTime: () => {} } }; }
        createGain() { return { connect: () => {}, gain: { setValueAtTime: () => {} } }; }
    }
};
global.window.window = global.window;
global.window.document = global.document;
global.localStorage = {
    _data: {},
    getItem: (k) => global.localStorage._data[k] || null,
    setItem: (k, v) => { global.localStorage._data[k] = String(v); },
    removeItem: (k) => { delete global.localStorage._data[k]; },
    clear: () => { global.localStorage._data = {}; }
};
global.window.localStorage = global.localStorage;
global.requestAnimationFrame = () => 0;
global.cancelAnimationFrame = () => {};
global.setInterval = () => 0;
global.clearInterval = () => {};

eval(scriptMatch[1] + `
;
global.ensureCampaignLevel = ensureCampaignLevel;
global.TILE_FLOOR = TILE_FLOOR;
`);

console.log('--- Scanning Stages 1 to 100 for Overlaps ---');
let totalOverlaps = 0;

for (let stage = 1; stage <= 100; stage++) {
    const lvl = global.ensureCampaignLevel(stage);
    if (!lvl) {
        console.error('Stage ' + stage + ' could not be generated');
        continue;
    }
    const grid = lvl.grid;
    const size = grid.length;
    const occupied = new Map();

    // 1. Lolo
    occupied.set(`${lvl.lolo.x},${lvl.lolo.y}`, ['lolo']);

    // 2. Blocks
    (lvl.blocks || []).forEach((b, i) => {
        const k = `${b.x},${b.y}`;
        if (!occupied.has(k)) occupied.set(k, []);
        occupied.get(k).push(`block_${b.type || 'alloy'}`);
    });

    // 3. Enemies
    (lvl.enemies || []).forEach((e, i) => {
        const k = `${e.x},${e.y}`;
        if (!occupied.has(k)) occupied.set(k, []);
        occupied.get(k).push(`enemy_${e.type}`);
    });

    // 4. Non-floor tiles
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const tile = grid[r][c];
            if (tile !== global.TILE_FLOOR && tile !== 10) { // 10 is TILE_DOOR_CLOSED
                const k = `${c},${r}`;
                if (occupied.has(k)) {
                    occupied.get(k).push(`tile_${tile}`);
                }
            }
        }
    }

    let stageOverlaps = 0;
    occupied.forEach((items, k) => {
        if (items.length > 1) {
            stageOverlaps++;
            totalOverlaps++;
            console.log(`❌ Stage ${stage} OVERLAP at [${k}]: ${items.join(' + ')}`);
        }
    });
    if (stageOverlaps === 0 && (stage % 10 === 0 || stage === 1 || stage === 5)) {
        console.log(`✔ Stage ${stage}: 0 Overlaps (Grid ${size}×${size}, Blocks: ${(lvl.blocks||[]).length}, Enemies: ${(lvl.enemies||[]).length})`);
    }
}

console.log('\n================ OVERLAP VERIFICATION SUMMARY ================');
console.log(`Total Overlapping Coordinates Across 100 Stages: ${totalOverlaps}`);
console.log('==============================================================');
process.exit(totalOverlaps === 0 ? 0 : 1);
