const { createCanvas } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'adventures_of_lolo_cyberpunk_remaster.html'), 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) {
    console.error('No script found');
    process.exit(1);
}

function createMockStyle() {
    return { setProperty: () => {}, removeProperty: () => {}, getPropertyValue: () => '' };
}

const mockElements = new Map();
function getOrCreateMockElement(id) {
    if (!mockElements.has(id)) {
        const c = createCanvas(640, 640);
        c.id = id;
        c.style = createMockStyle();
        c.dataset = {};
        c.classList = { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false };
        c.setAttribute = () => {};
        c.getAttribute = () => null;
        c.appendChild = () => {};
        c.addEventListener = () => {};
        c.removeEventListener = () => {};
        c.dispatchEvent = () => {};
        mockElements.set(id, c);
    }
    return mockElements.get(id);
}

global.document = {
    getElementById: getOrCreateMockElement,
    querySelector: getOrCreateMockElement,
    querySelectorAll: () => [],
    createElement: (tag) => {
        if (tag === 'canvas') return createCanvas(640, 640);
        return getOrCreateMockElement('mock_' + Math.random());
    },
    body: getOrCreateMockElement('body'),
    addEventListener: () => {},
    removeEventListener: () => {},
    readyState: 'complete'
};

global.localStorage = {
    _data: {},
    getItem: (k) => global.localStorage._data[k] || null,
    setItem: (k, v) => { global.localStorage._data[k] = String(v); },
    removeItem: (k) => { delete global.localStorage._data[k]; },
    clear: () => { global.localStorage._data = {}; }
};

global.window = {
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
    location: { search: '', href: '' },
    navigator: { userAgent: 'Node' },
    showVictoryModal: () => {},
    AudioContext: class {
        createOscillator() { return { connect: () => {}, start: () => {}, stop: () => {}, frequency: { setValueAtTime: () => {}, linearRampToValueAtTime: () => {} } }; }
        createGain() { return { connect: () => {}, gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} } }; }
        get currentTime() { return 0; }
        get destination() { return {}; }
    }
};
global.window.window = global.window;
global.window.document = global.document;
global.window.localStorage = global.localStorage;
global.addEventListener = global.window.addEventListener;
global.removeEventListener = global.window.removeEventListener;
global.requestAnimationFrame = () => 0;
global.cancelAnimationFrame = () => {};
global.setInterval = () => 0;
global.clearInterval = () => {};

eval(scriptMatch[1] + `
;
global.ensureCampaignLevel = ensureCampaignLevel;
global.TILE_FLOOR = TILE_FLOOR;
global.TILE_WALL = TILE_WALL;
global.TILE_TREE = TILE_TREE;
global.TILE_WATER = TILE_WATER;
global.TILE_HEART = TILE_HEART;
global.TILE_HEART_AMMO = TILE_HEART_AMMO;
global.TILE_CHEST_CLOSED = TILE_CHEST_CLOSED;
global.TILE_DOOR_CLOSED = TILE_DOOR_CLOSED;
`);

console.log('Checking all 100 levels for overlapping/nested items...');
let totalOverlaps = 0;

for (let stage = 1; stage <= 100; stage++) {
    const lvl = global.ensureCampaignLevel(stage);
    if (!lvl) {
        console.error(`Stage ${stage} failed to generate!`);
        continue;
    }

    const grid = lvl.grid;
    const size = grid.length;
    const occupied = new Map(); // key -> list of items

    // 1. Check Lolo
    const lKey = `${lvl.lolo.x},${lvl.lolo.y}`;
    if (!occupied.has(lKey)) occupied.set(lKey, []);
    occupied.get(lKey).push({ type: 'lolo' });

    // 2. Check blocks
    (lvl.blocks || []).forEach((b, idx) => {
        const bKey = `${b.x},${b.y}`;
        if (!occupied.has(bKey)) occupied.set(bKey, []);
        occupied.get(bKey).push({ type: 'block', id: b.type || 'alloy', idx });
    });

    // 3. Check enemies
    (lvl.enemies || []).forEach((e, idx) => {
        const eKey = `${e.x},${e.y}`;
        if (!occupied.has(eKey)) occupied.set(eKey, []);
        occupied.get(eKey).push({ type: 'enemy', id: e.type, idx });
    });

    // 4. Check non-floor tiles that should never share with block/enemy/lolo
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const tile = grid[r][c];
            if (tile !== global.TILE_FLOOR && tile !== global.TILE_DOOR_CLOSED) {
                const tKey = `${c},${r}`;
                if (occupied.has(tKey)) {
                    const items = occupied.get(tKey);
                    const hasBlockOrEnemy = items.some(i => i.type === 'block' || i.type === 'enemy');
                    if (hasBlockOrEnemy) {
                        items.push({ type: 'tile', id: tile });
                    }
                }
            }
        }
    }

    // Report any key with > 1 items
    occupied.forEach((items, key) => {
        if (items.length > 1) {
            totalOverlaps++;
            console.log(`Stage ${stage} overlap at [${key}]:`, JSON.stringify(items));
        }
    });
}

console.log(`\nScan finished. Total overlapping coordinate instances across 100 levels: ${totalOverlaps}`);
