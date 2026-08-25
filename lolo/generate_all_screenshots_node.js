const { createCanvas } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');

const LOLO_DIR = path.resolve(__dirname);
const SCREENSHOTS_DIR = path.join(LOLO_DIR, 'screenshots');
fs.mkdirSync(path.join(SCREENSHOTS_DIR, 'tiles'), { recursive: true });
fs.mkdirSync(path.join(SCREENSHOTS_DIR, 'blocks'), { recursive: true });
fs.mkdirSync(path.join(SCREENSHOTS_DIR, 'enemies'), { recursive: true });

// Read the game HTML and extract script content
const html = fs.readFileSync(path.join(LOLO_DIR, 'adventures_of_lolo_cyberpunk_remaster.html'), 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) {
    console.error('Could not find <script> tag in HTML');
    process.exit(1);
}

// Setup a mock browser/DOM environment for LoloGame
function createMockStyle() {
    return {
        setProperty: () => {},
        removeProperty: () => {},
        getPropertyValue: () => ''
    };
}

const mockElements = new Map();
function getOrCreateMockElement(id) {
    if (id === 'game-canvas') {
        if (!mockElements.has(id)) {
            const c = createCanvas(640, 640);
            c.id = 'game-canvas';
            c.style = createMockStyle();
            c.dataset = {};
            c.classList = { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false };
            c.setAttribute = () => {};
            c.getAttribute = () => null;
            c.addEventListener = () => {};
            c.removeEventListener = () => {};
            c.dispatchEvent = () => {};
            mockElements.set(id, c);
        }
        return mockElements.get(id);
    }
    if (!mockElements.has(id)) {
        const elem = {
            id,
            innerText: '',
            innerHTML: '',
            value: '',
            dataset: {},
            style: createMockStyle(),
            classList: {
                add: () => {},
                remove: () => {},
                toggle: () => {},
                contains: () => false
            },
            setAttribute: () => {},
            getAttribute: () => null,
            appendChild: () => {},
            querySelectorAll: () => [],
            querySelector: () => null,
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => {},
            getContext: () => createCanvas(640, 640).getContext('2d')
        };
        mockElements.set(id, elem);
    }
    return mockElements.get(id);
}

global.document = {
    getElementById: getOrCreateMockElement,
    querySelector: getOrCreateMockElement,
    querySelectorAll: () => [],
    createElement: (tag) => {
        if (tag === 'canvas') {
            return createCanvas(640, 640);
        }
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
global.requestAnimationFrame = (cb) => setTimeout(cb, 16);
global.cancelAnimationFrame = (id) => clearTimeout(id);

// Execute the game script in this context and export classes to global
const scriptCode = scriptMatch[1] + `
;
global.GameEngine = GameEngine;
global.TILE_FLOOR = TILE_FLOOR;
global.TILE_WALL = TILE_WALL;
global.TILE_TREE = TILE_TREE;
global.TILE_WATER = TILE_WATER;
global.TILE_HEART = TILE_HEART;
global.TILE_CHEST_CLOSED = TILE_CHEST_CLOSED;
global.TILE_CHEST_OPENED = TILE_CHEST_OPENED;
global.TILE_DOOR_CLOSED = TILE_DOOR_CLOSED;
global.TILE_DOOR_OPEN = TILE_DOOR_OPEN;
global.TILE_ICE = TILE_ICE;
global.TILE_ONE_WAY_UP = TILE_ONE_WAY_UP;
global.TILE_CRACKED_WALL = TILE_CRACKED_WALL;
global.TILE_PORTAL_A = TILE_PORTAL_A;
global.TILE_PORTAL_B = TILE_PORTAL_B;

global.BLOCK_ALLOY = BLOCK_ALLOY;
global.BLOCK_HEAVY = BLOCK_HEAVY;
global.BLOCK_REFLECTOR = BLOCK_REFLECTOR;
global.BLOCK_HOLO = BLOCK_HOLO;
global.BLOCK_BOMB = BLOCK_BOMB;
global.BLOCK_MAGNETIC = BLOCK_MAGNETIC;
global.BLOCK_STICKY = BLOCK_STICKY;
global.BLOCK_FRAGILE = BLOCK_FRAGILE;
global.BLOCK_DECOY = BLOCK_DECOY;

global.LoloRandomGenerator = LoloRandomGenerator;
global.DIFFICULTY_HARD = typeof DIFFICULTY_HARD !== 'undefined' ? DIFFICULTY_HARD : 'hard';
`;
eval(scriptCode);

console.log('Script loaded successfully! Initializing game rendering engine...');

const canvas = createCanvas(640, 640);
const game = new GameEngine(canvas);
game.animTick = 60; // stable animation frame

// Helper to save canvas buffer
function saveCanvas(c, subPath) {
    const fullPath = path.join(SCREENSHOTS_DIR, subPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    const buf = c.toBuffer('image/png');
    fs.writeFileSync(fullPath, buf);
    console.log(`Saved: ${subPath} (${(buf.length / 1024).toFixed(1)} KB)`);
}

// 1. Render Individual Icons (64x64)
function renderIcon(drawFn, size = 64) {
    const c = createCanvas(size, size);
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    drawFn(ctx, 4, 4, size - 8);
    return c;
}

console.log('--- 1. Rendering Tiles Icons ---');
const tileMap = [
    { file: 'tiles/lolo.png', draw: (ctx, x, y, s) => game.drawFuturisticLolo(ctx, x, y, s) },
    { file: 'tiles/core.png', draw: (ctx, x, y, s) => game.drawFuturisticTile(ctx, TILE_HEART, x, y, s, 0, 0) },
    { file: 'tiles/chest.png', draw: (ctx, x, y, s) => game.drawFuturisticTile(ctx, TILE_CHEST_CLOSED, x, y, s, 0, 0) },
    { file: 'tiles/door.png', draw: (ctx, x, y, s) => game.drawFuturisticTile(ctx, TILE_DOOR_CLOSED, x, y, s, 0, 0) },
    { file: 'tiles/tree.png', draw: (ctx, x, y, s) => game.drawFuturisticTile(ctx, TILE_TREE, x, y, s, 0, 0) },
    { file: 'tiles/water.png', draw: (ctx, x, y, s) => game.drawFuturisticTile(ctx, TILE_WATER, x, y, s, 0, 0) },
    { file: 'tiles/ice.png', draw: (ctx, x, y, s) => game.drawFuturisticTile(ctx, TILE_ICE, x, y, s, 0, 0) },
    { file: 'tiles/cracked.png', draw: (ctx, x, y, s) => game.drawFuturisticTile(ctx, TILE_CRACKED_WALL, x, y, s, 0, 0) },
    { file: 'tiles/portal.png', draw: (ctx, x, y, s) => game.drawFuturisticTile(ctx, TILE_PORTAL_A, x, y, s, 0, 0) },
    { file: 'tiles/one_way.png', draw: (ctx, x, y, s) => game.drawFuturisticTile(ctx, TILE_ONE_WAY_UP, x, y, s, 0, 0) }
];
tileMap.forEach(item => saveCanvas(renderIcon(item.draw), item.file));

console.log('--- 2. Rendering Blocks Icons ---');
const blockMap = [
    { file: 'blocks/alloy.png', draw: (ctx, x, y, s) => game.drawFuturisticBlock(ctx, { type: BLOCK_ALLOY }, x, y, s) },
    { file: 'blocks/heavy.png', draw: (ctx, x, y, s) => game.drawFuturisticBlock(ctx, { type: BLOCK_HEAVY }, x, y, s) },
    { file: 'blocks/reflector.png', draw: (ctx, x, y, s) => game.drawFuturisticBlock(ctx, { type: BLOCK_REFLECTOR, dir: 'up_right' }, x, y, s) },
    { file: 'blocks/holo.png', draw: (ctx, x, y, s) => game.drawFuturisticBlock(ctx, { type: BLOCK_HOLO }, x, y, s) },
    { file: 'blocks/bomb.png', draw: (ctx, x, y, s) => game.drawFuturisticBlock(ctx, { type: BLOCK_BOMB }, x, y, s) },
    { file: 'blocks/magnetic.png', draw: (ctx, x, y, s) => game.drawFuturisticBlock(ctx, { type: BLOCK_MAGNETIC }, x, y, s) },
    { file: 'blocks/sticky.png', draw: (ctx, x, y, s) => game.drawFuturisticBlock(ctx, { type: BLOCK_STICKY, bonded: true }, x, y, s) },
    { file: 'blocks/fragile.png', draw: (ctx, x, y, s) => game.drawFuturisticBlock(ctx, { type: BLOCK_FRAGILE }, x, y, s) },
    { file: 'blocks/decoy.png', draw: (ctx, x, y, s) => game.drawFuturisticBlock(ctx, { type: BLOCK_DECOY }, x, y, s) }
];
blockMap.forEach(item => saveCanvas(renderIcon(item.draw), item.file));

console.log('--- 3. Rendering Enemy Icons ---');
const enemyMap = [
    { file: 'enemies/snake.png', type: 'snake' },
    { file: 'enemies/medusa.png', type: 'medusa' },
    { file: 'enemies/medusa_diag.png', type: 'medusa_diag' },
    { file: 'enemies/medusa_omni.png', type: 'medusa_omni' },
    { file: 'enemies/turret.png', type: 'turret', mode: '4-cross' },
    { file: 'enemies/gol.png', type: 'gol', isAwake: false },
    { file: 'enemies/don_medusa.png', type: 'don_medusa', dir: 'horiz' },
    { file: 'enemies/leeper.png', type: 'leeper' },
    { file: 'enemies/skull.png', type: 'skull' },
    { file: 'enemies/alma.png', type: 'alma' },
    { file: 'enemies/rocky.png', type: 'rocky' },
    { file: 'enemies/moby.png', type: 'moby' },
    { file: 'enemies/hopper.png', type: 'hopper' },
    { file: 'enemies/striker.png', type: 'striker' },
    { file: 'enemies/wisp.png', type: 'wisp' },
    { file: 'enemies/orbiter.png', type: 'orbiter' }
];
enemyMap.forEach(item => {
    const draw = (ctx, x, y, s) => {
        const e = { type: item.type, x: 0, y: 0, dir: item.dir || 'down', mode: item.mode || '4-cross', isAwake: item.isAwake !== undefined ? item.isAwake : true, isAsleep: false };
        game.drawFuturisticEnemy(ctx, e, x, y, s);
    };
    saveCanvas(renderIcon(draw), item.file);
});

// 4. Render High-Res Roster Banners
function createRosterCard(title, items, cols = 5, itemWidth = 140, itemHeight = 100) {
    const rows = Math.ceil(items.length / cols);
    const width = cols * itemWidth + 40;
    const height = rows * itemHeight + 90;
    
    const c = createCanvas(width, height);
    const ctx = c.getContext('2d');

    // Cyber Background
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#060913');
    bgGrad.addColorStop(0.5, '#0b1329');
    bgGrad.addColorStop(1, '#05070e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
    for (let y = 0; y < height; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }

    // Outer Glass Frame
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, width - 20, height - 20);

    // Top Banner Header
    ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
    ctx.fillRect(12, 12, width - 24, 45);
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title.toUpperCase(), width / 2, 42);

    // Items
    items.forEach((item, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const ix = 20 + col * itemWidth;
        const iy = 70 + row * itemHeight;

        // Item background card
        ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
        ctx.fillRect(ix + 5, iy + 5, itemWidth - 10, itemHeight - 10);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(ix + 5, iy + 5, itemWidth - 10, itemHeight - 10);

        // Draw item icon
        const iconSize = 44;
        const iconX = ix + (itemWidth - iconSize) / 2;
        const iconY = iy + 10;
        ctx.save();
        item.draw(ctx, iconX, iconY, iconSize);
        ctx.restore();

        // Item Label
        ctx.fillStyle = '#e0f2fe';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(item.name, ix + itemWidth / 2, iy + itemHeight - 12);
    });

    return c;
}

console.log('--- 4. Rendering Roster Banners ---');
const enemyRosterItems = [
    { name: 'Serpent Drone', draw: (ctx, x, y, s) => game.drawFuturisticEnemy(ctx, { type: 'snake', dir: 'down' }, x, y, s) },
    { name: 'Cardinal Sentry', draw: (ctx, x, y, s) => game.drawFuturisticEnemy(ctx, { type: 'medusa', dir: 'down' }, x, y, s) },
    { name: 'Diagonal Sentry', draw: (ctx, x, y, s) => game.drawFuturisticEnemy(ctx, { type: 'medusa_diag', dir: 'down' }, x, y, s) },
    { name: 'Omni Sentry', draw: (ctx, x, y, s) => game.drawFuturisticEnemy(ctx, { type: 'medusa_omni', dir: 'down' }, x, y, s) },
    { name: 'Turret', draw: (ctx, x, y, s) => game.drawFuturisticEnemy(ctx, { type: 'turret', mode: '4-cross', dir: 'down' }, x, y, s) },
    { name: 'Dragon Mech', draw: (ctx, x, y, s) => game.drawFuturisticEnemy(ctx, { type: 'gol', isAwake: false, dir: 'down' }, x, y, s) },
    { name: 'Patrol Sentinel', draw: (ctx, x, y, s) => game.drawFuturisticEnemy(ctx, { type: 'don_medusa', dir: 'horiz' }, x, y, s) },
    { name: 'EMP Nanobot', draw: (ctx, x, y, s) => game.drawFuturisticEnemy(ctx, { type: 'leeper', isAsleep: false, dir: 'down' }, x, y, s) },
    { name: 'Charger Skull', draw: (ctx, x, y, s) => game.drawFuturisticEnemy(ctx, { type: 'skull', isAwake: false, dir: 'down' }, x, y, s) },
    { name: 'Buzzsaw Bot', draw: (ctx, x, y, s) => game.drawFuturisticEnemy(ctx, { type: 'alma', dir: 'down' }, x, y, s) },
    { name: 'Hydraulic Golem', draw: (ctx, x, y, s) => game.drawFuturisticEnemy(ctx, { type: 'rocky', dir: 'down' }, x, y, s) },
    { name: 'Vortex Leviathan', draw: (ctx, x, y, s) => game.drawFuturisticEnemy(ctx, { type: 'moby', dir: 'down' }, x, y, s) },
    { name: 'Beetle Hopper', draw: (ctx, x, y, s) => game.drawFuturisticEnemy(ctx, { type: 'hopper', dir: 'down' }, x, y, s) },
    { name: 'Striker Drone', draw: (ctx, x, y, s) => game.drawFuturisticEnemy(ctx, { type: 'striker', dir: 'down' }, x, y, s) },
    { name: 'Wisp Specter', draw: (ctx, x, y, s) => game.drawFuturisticEnemy(ctx, { type: 'wisp', dir: 'down' }, x, y, s) },
    { name: 'Orbiter Node', draw: (ctx, x, y, s) => game.drawFuturisticEnemy(ctx, { type: 'orbiter', dir: 'down' }, x, y, s) }
];
saveCanvas(createRosterCard('Hostile AI Threat Matrix (16 Archetypes)', enemyRosterItems, 4, 150, 105), 'enemy_roster.png');

const blocksRosterItems = [
    { name: 'Alloy Shield', draw: (ctx, x, y, s) => game.drawFuturisticBlock(ctx, { type: BLOCK_ALLOY }, x, y, s) },
    { name: 'Heavy Titanium', draw: (ctx, x, y, s) => game.drawFuturisticBlock(ctx, { type: BLOCK_HEAVY }, x, y, s) },
    { name: 'Prism Reflector', draw: (ctx, x, y, s) => game.drawFuturisticBlock(ctx, { type: BLOCK_REFLECTOR, dir: 'up_right' }, x, y, s) },
    { name: 'Holo Barrier', draw: (ctx, x, y, s) => game.drawFuturisticBlock(ctx, { type: BLOCK_HOLO }, x, y, s) },
    { name: 'Plasma Bomb', draw: (ctx, x, y, s) => game.drawFuturisticBlock(ctx, { type: BLOCK_BOMB }, x, y, s) },
    { name: 'Mag-Lev Polar', draw: (ctx, x, y, s) => game.drawFuturisticBlock(ctx, { type: BLOCK_MAGNETIC }, x, y, s) },
    { name: 'Adhesive Gel', draw: (ctx, x, y, s) => game.drawFuturisticBlock(ctx, { type: BLOCK_STICKY, bonded: true }, x, y, s) },
    { name: 'Glass Crystal', draw: (ctx, x, y, s) => game.drawFuturisticBlock(ctx, { type: BLOCK_FRAGILE }, x, y, s) },
    { name: 'Decoy Hologram', draw: (ctx, x, y, s) => game.drawFuturisticBlock(ctx, { type: BLOCK_DECOY }, x, y, s) }
];
saveCanvas(createRosterCard('Tactical Push-Blocks Roster (9 Archetypes)', blocksRosterItems, 3, 160, 105), 'blocks_roster.png');

const tilesRosterItems = [
    { name: 'Operative Lolo', draw: (ctx, x, y, s) => game.drawFuturisticLolo(ctx, x, y, s) },
    { name: 'Energy Core', draw: (ctx, x, y, s) => game.drawFuturisticTile(ctx, TILE_HEART, x, y, s, 0, 0) },
    { name: 'Data Vault', draw: (ctx, x, y, s) => game.drawFuturisticTile(ctx, TILE_CHEST_CLOSED, x, y, s, 0, 0) },
    { name: 'Cyber Gateway', draw: (ctx, x, y, s) => game.drawFuturisticTile(ctx, TILE_DOOR_CLOSED, x, y, s, 0, 0) },
    { name: 'Cyber Tree', draw: (ctx, x, y, s) => game.drawFuturisticTile(ctx, TILE_TREE, x, y, s, 0, 0) },
    { name: 'Plasma Canal', draw: (ctx, x, y, s) => game.drawFuturisticTile(ctx, TILE_WATER, x, y, s, 0, 0) },
    { name: 'Mag-Lev Track', draw: (ctx, x, y, s) => game.drawFuturisticTile(ctx, TILE_ICE, x, y, s, 0, 0) },
    { name: 'Cracked Wall', draw: (ctx, x, y, s) => game.drawFuturisticTile(ctx, TILE_CRACKED_WALL, x, y, s, 0, 0) },
    { name: 'Quantum Portal', draw: (ctx, x, y, s) => game.drawFuturisticTile(ctx, TILE_PORTAL_A, x, y, s, 0, 0) },
    { name: 'One-Way Gate', draw: (ctx, x, y, s) => game.drawFuturisticTile(ctx, TILE_ONE_WAY_UP, x, y, s, 0, 0) }
];
saveCanvas(createRosterCard('Sector Environment & Interactive Tiles', tilesRosterItems, 5, 140, 105), 'tiles_roster.png');

// 5. Render Full Gameplay Mockups with Cyberpunk HUD & Dossier Frames
function renderFullGameScreen(stageNum, stageTitle, dossierIntel, extraNotes = '') {
    const screenWidth = 1200;
    const screenHeight = 820;
    const screen = createCanvas(screenWidth, screenHeight);
    const sCtx = screen.getContext('2d');

    // Synthwave Gradient Background
    const sBg = sCtx.createRadialGradient(screenWidth / 2, screenHeight / 2, 50, screenWidth / 2, screenHeight / 2, screenWidth);
    sBg.addColorStop(0, '#0a1024');
    sBg.addColorStop(0.6, '#060a16');
    sBg.addColorStop(1, '#020408');
    sCtx.fillStyle = sBg;
    sCtx.fillRect(0, 0, screenWidth, screenHeight);

    // Subtle Hex Grid Matrix
    sCtx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
    sCtx.lineWidth = 1;
    for (let x = 0; x < screenWidth; x += 30) { sCtx.beginPath(); sCtx.moveTo(x, 0); sCtx.lineTo(x, screenHeight); sCtx.stroke(); }
    for (let y = 0; y < screenHeight; y += 30) { sCtx.beginPath(); sCtx.moveTo(0, y); sCtx.lineTo(screenWidth, y); sCtx.stroke(); }

    // Top Navigation Header
    sCtx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    sCtx.fillRect(20, 15, screenWidth - 40, 65);
    sCtx.strokeStyle = '#00f0ff';
    sCtx.lineWidth = 1.5;
    sCtx.strokeRect(20, 15, screenWidth - 40, 65);

    // Title
    sCtx.fillStyle = '#00f0ff';
    sCtx.font = 'bold 22px sans-serif';
    sCtx.textAlign = 'left';
    sCtx.fillText('ADVENTURES OF LOLO : CYBERPUNK REMASTER', 40, 46);

    sCtx.fillStyle = '#94a3b8';
    sCtx.font = '12px monospace';
    sCtx.fillText('TACTICAL SECTOR MATRIX • SOLVABILITY: VERIFIED 100% (A* ENGINE)', 40, 66);

    // Top HUD Badges (Right side)
    sCtx.fillStyle = 'rgba(0, 240, 255, 0.15)';
    sCtx.fillRect(screenWidth - 340, 25, 300, 45);
    sCtx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    sCtx.strokeRect(screenWidth - 340, 25, 300, 45);
    sCtx.fillStyle = '#fbbf24';
    sCtx.font = 'bold 15px sans-serif';
    sCtx.textAlign = 'center';
    sCtx.fillText('⭐ 300 / 300 STARS  •  🔥 7-DAY STREAK', screenWidth - 190, 53);

    // Left Column: Main Game Canvas Area
    const canvasBoxX = 35;
    const canvasBoxY = 100;
    const canvasBoxSize = 680;

    sCtx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    sCtx.fillRect(canvasBoxX - 10, canvasBoxY - 10, canvasBoxSize + 20, canvasBoxSize + 20);
    sCtx.strokeStyle = '#38bdf8';
    sCtx.lineWidth = 2;
    sCtx.strokeRect(canvasBoxX - 10, canvasBoxY - 10, canvasBoxSize + 20, canvasBoxSize + 20);

    // Render the actual Game Board
    game.unlockedLevel = 100;
    game.loadLevel(stageNum - 1);
    const boardCanvas = createCanvas(canvasBoxSize, canvasBoxSize);
    game.canvas = boardCanvas;
    game.ctx = boardCanvas.getContext('2d');
    game.updateAndRender();
    sCtx.drawImage(boardCanvas, canvasBoxX, canvasBoxY, canvasBoxSize, canvasBoxSize);

    // Right Column: Tactical Dossier & HUD Telemetry
    const panelX = 750;
    const panelY = 100;
    const panelW = 415;
    const panelH = canvasBoxSize + 20;

    sCtx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    sCtx.fillRect(panelX, panelY - 10, panelW, panelH);
    sCtx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    sCtx.lineWidth = 1.5;
    sCtx.strokeRect(panelX, panelY - 10, panelW, panelH);

    // Sector Stage Header
    sCtx.fillStyle = 'rgba(0, 240, 255, 0.15)';
    sCtx.fillRect(panelX + 10, panelY, panelW - 20, 50);
    sCtx.strokeStyle = '#00f0ff';
    sCtx.lineWidth = 1;
    sCtx.strokeRect(panelX + 10, panelY, panelW - 20, 50);

    sCtx.fillStyle = '#00f0ff';
    sCtx.font = 'bold 18px sans-serif';
    sCtx.textAlign = 'left';
    sCtx.fillText(`STAGE ${stageNum} : ${stageTitle.toUpperCase()}`, panelX + 22, panelY + 32);

    // Tactical Dossier Card
    sCtx.fillStyle = 'rgba(2, 6, 23, 0.8)';
    sCtx.fillRect(panelX + 10, panelY + 65, panelW - 20, 200);
    sCtx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    sCtx.strokeRect(panelX + 10, panelY + 65, panelW - 20, 200);

    sCtx.fillStyle = '#38bdf8';
    sCtx.font = 'bold 13px sans-serif';
    sCtx.fillText('📡 TACTICAL DOSSIER TELEMETRY', panelX + 22, panelY + 90);

    sCtx.fillStyle = '#cbd5e1';
    sCtx.font = '12px sans-serif';
    let dY = panelY + 115;
    dossierIntel.forEach(line => {
        sCtx.fillText(`• ${line}`, panelX + 25, dY);
        dY += 24;
    });

    // Live Combat HUD Matrix (Stars, Moves, Ammo, Health)
    const hudY = panelY + 285;
    sCtx.fillStyle = 'rgba(2, 6, 23, 0.8)';
    sCtx.fillRect(panelX + 10, hudY, panelW - 20, 160);
    sCtx.strokeStyle = '#fbbf24';
    sCtx.lineWidth = 1;
    sCtx.strokeRect(panelX + 10, hudY, panelW - 20, 160);

    sCtx.fillStyle = '#fbbf24';
    sCtx.font = 'bold 13px sans-serif';
    sCtx.fillText('⚡ LIVE COMBAT TELEMETRY', panelX + 22, hudY + 25);

    sCtx.fillStyle = '#e2e8f0';
    sCtx.font = '12px sans-serif';
    sCtx.fillText(`★ Efficiency Rating: ★ ★ ★ (Gold Par)`, panelX + 25, hudY + 55);
    sCtx.fillText(`🎯 Par Moves: ${game.parMoves || 24}  |  Current Moves: 0`, panelX + 25, hudY + 80);
    sCtx.fillText(`🔋 Remaining Cores: ${game.countRemainingHearts()}`, panelX + 25, hudY + 105);
    sCtx.fillText(`🔫 Blaster Ammo: ${game.lolo.ammo} Rounds  |  ❤️ Lives: 5`, panelX + 25, hudY + 130);

    // Bottom Action Controls
    const btnY = panelY + 465;
    sCtx.fillStyle = 'rgba(0, 240, 255, 0.12)';
    sCtx.fillRect(panelX + 10, btnY, panelW - 20, 50);
    sCtx.strokeStyle = '#00f0ff';
    sCtx.strokeRect(panelX + 10, btnY, panelW - 20, 50);
    sCtx.fillStyle = '#00f0ff';
    sCtx.font = 'bold 13px sans-serif';
    sCtx.textAlign = 'center';
    sCtx.fillText('🎮 KEYBOARD / TOUCHPAD CONTROLS ACTIVE', panelX + panelW / 2, btnY + 30);

    return screen;
}

console.log('--- 5. Rendering Gameplay Screenshots ---');
// Stage 1
saveCanvas(renderFullGameScreen(1, 'Introductory Training Protocol', [
    'Threat Analysis: 1× Serpent Drone (Passive)',
    'Objectives: Collect all 4 Energy Cores',
    'Tactics: Practice pushing standard Alloy blocks',
    'Gateway: Data Chest unlocks Cyber Extraction Door'
]), 'gameplay_stage1.png');

// Stage 20
saveCanvas(renderFullGameScreen(20, 'Tactical Grid Lock', [
    'Threat Analysis: 2× Skulls, 1× Leeper Disruptor',
    'Mechanics: Sticky Gel & Magnetic Superconductors',
    'Tactics: Bait leepers to discharge into permanent cover blocks',
    'Rating Target: Par ≤ 26 moves for 3-Star Mastery'
]), 'gameplay_stage20.png');

// Stage 45
saveCanvas(renderFullGameScreen(45, 'Prism Deflection Matrix', [
    'Threat Analysis: 2× Cardinal Sentries, 1× Turret',
    'Mechanics: 90° Reflector Prisms',
    'Tactics: Align prisms to deflect laser line-of-sight',
    'Special: Quantum Portal alpha/beta routing'
]), 'gameplay_stage45.png');

// Stage 98
saveCanvas(renderFullGameScreen(98, 'Apex Cyber Fortress', [
    'Threat Analysis: 2× Don Medusa, 1× Dragon Mech',
    'Grid Scale: 19×19 Apex Security Chamber',
    'Hazards: Plasma Bomb detonators & Mag-Lev Ice',
    'Rating Target: Par ≤ 48 moves for 3-Star Mastery'
]), 'gameplay_stage98.png');

// Stage 100 Finale
saveCanvas(renderFullGameScreen(100, 'Omega Protocol Apex Finale', [
    'Threat Analysis: Full Apex Hostile Citadel Sentry Network',
    'Mechanics: Multi-Island Portals, Prism Matrix, Cryo Speedway',
    'Victory Condition: Clear all Omega Energy Cores & Vault Safe',
    'Mastery: Grandmaster 100% Campaign Completion'
]), 'gameplay_stage100.png');

// 5b. Render Quick Chamber Archetypes
console.log('--- 5b. Rendering Chamber Archetypes ---');
function renderArchetypeScreen(title, subtitle, presetType, seed, size) {
    const width = 1200;
    const height = 820;
    const c = createCanvas(width, height);
    const ctx = c.getContext('2d');

    ctx.fillStyle = '#060a16';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.fillRect(40, 30, width - 80, height - 60);
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 30, width - 80, height - 60);

    ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
    ctx.fillRect(42, 32, width - 84, 60);
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`CHAMBER ARCHETYPE: ${title.toUpperCase()}`, 70, 70);

    // Left info card
    const infoX = 70;
    const infoY = 110;
    const infoW = 380;
    const infoH = 620;

    ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
    ctx.fillRect(infoX, infoY, infoW, infoH);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.strokeRect(infoX, infoY, infoW, infoH);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(title, infoX + 20, infoY + 40);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '13px sans-serif';
    subtitle.forEach((line, idx) => {
        ctx.fillText(`• ${line}`, infoX + 20, infoY + 80 + idx * 30);
    });

    // Seed badge
    ctx.fillStyle = 'rgba(0, 240, 255, 0.2)';
    ctx.fillRect(infoX + 20, infoY + 280, infoW - 40, 44);
    ctx.strokeStyle = '#00f0ff';
    ctx.strokeRect(infoX + 20, infoY + 280, infoW - 40, 44);
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`SEED: ${seed}`, infoX + 35, infoY + 307);

    // Right board view
    const pX = 480;
    const pY = 110;
    const pS = 620;

    ctx.fillStyle = '#020617';
    ctx.fillRect(pX, pY, pS, pS);
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(pX, pY, pS, pS);

    const gen = LoloRandomGenerator.generate(presetType, seed, size);
    if (gen) {
        const tempC = createCanvas(pS, pS);
        game.canvas = tempC;
        game.ctx = tempC.getContext('2d');
        game.isEditorMode = false;
        game.initLevelFromData(gen);
        game.updateAndRender();
        ctx.drawImage(tempC, pX, pY, pS, pS);
    }
    return c;
}

saveCanvas(renderArchetypeScreen('Optical Prism Lab', [
    'Reflective Quartz Mirror Deflectors',
    '90° Laser Angle Routing & Deflection',
    'Cardinal, Diagonal & Omni Sentries',
    'Full A* Mathematical Solvability Guarantee'
], 'medium', 'OPTICAL-PRISM-909', 13), 'archetype_optical_prism.png');

saveCanvas(renderArchetypeScreen('Cryo Speedway', [
    'Low-Friction Glacial Ice Tracks',
    'Mag-Lev Sliding Kinetics Across Canals',
    'Magnetic Polar Anchors & Frozen Blocks',
    'Precision Directional Steering Required'
], 'hard', 'CRYO-SPEEDWAY-774', 13), 'archetype_cryo_speedway.png');

saveCanvas(renderArchetypeScreen('Quantum Nexus', [
    'Sub-Space Teleportation Portals (α / β)',
    'Interconnected Multi-Island Canals',
    'Remote Block Relocation Through Space',
    'Multi-Step Algorithmic Logic'
], 'hard', 'QUANTUM-NEXUS-312', 13), 'archetype_quantum_nexus.png');

saveCanvas(renderArchetypeScreen('Demolition Protocol', [
    'Plasma Nitro Ordnance Bomb Blocks',
    'Cracked Masonry Blast Fractures',
    'Tactical Shockwave Wall Demolition',
    'Unlocks Hidden Passages & Routes'
], 'medium', 'DEMOLITION-BOMB-456', 11), 'archetype_demolition.png');

// 6. Render Level Selector Matrix View
function renderLevelSelectorScreen() {
    const width = 1200;
    const height = 820;
    const c = createCanvas(width, height);
    const ctx = c.getContext('2d');

    // Background
    ctx.fillStyle = '#05070e';
    ctx.fillRect(0, 0, width, height);

    // Modal Card
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.fillRect(50, 40, width - 100, height - 80);
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 40, width - 100, height - 80);

    // Header
    ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
    ctx.fillRect(52, 42, width - 104, 60);
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('100-STAGE CYBER VAULT MATRIX', 80, 80);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('⭐ 300 / 300 STARS EARNED  •  100% UNLOCKED', width - 80, 80);

    // 10x10 Level Grid Buttons
    const startX = 80;
    const startY = 130;
    const cols = 10;
    const rows = 10;
    const btnW = 100;
    const btnH = 60;
    const gapX = 4;
    const gapY = 4;

    for (let i = 0; i < 100; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const bx = startX + col * (btnW + gapX);
        const by = startY + row * (btnH + gapY);

        ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
        ctx.fillRect(bx, by, btnW, btnH);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, btnW, btnH);

        // Stage Number
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`STAGE ${i + 1}`, bx + btnW / 2, by + 26);

        // 3-Star Badge
        ctx.fillStyle = '#fbbf24';
        ctx.font = '11px sans-serif';
        ctx.fillText('★ ★ ★', bx + btnW / 2, by + 46);
    }

    return c;
}
console.log('--- 6. Rendering Level Selector Screenshot ---');
saveCanvas(renderLevelSelectorScreen(), 'level_selector.png');

// 7. Render Cyber Architect Level Editor
function renderEditorScreen() {
    const width = 1280;
    const height = 860;
    const c = createCanvas(width, height);
    const ctx = c.getContext('2d');

    // Background
    ctx.fillStyle = '#060913';
    ctx.fillRect(0, 0, width, height);

    // Top Header
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(20, 15, width - 40, 55);
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(20, 15, width - 40, 55);

    ctx.fillStyle = '#c084fc';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('CYBER ARCHITECT STUDIO (INTEGRATED LEVEL DESIGNER & SIMULATOR)', 40, 48);

    // Left Palette Toolbar
    const palX = 20;
    const palY = 85;
    const palW = 280;
    const palH = 750;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(palX, palY, palW, palH);
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(palX, palY, palW, palH);

    ctx.fillStyle = '#c084fc';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('🎨 OBJECT PALETTES', palX + 15, palY + 30);

    // Palette item buttons
    const pItems = ['Operative Lolo', 'Energy Core', 'Data Chest', 'Cyber Gateway', 'Alloy Push-Block', 'Prism Reflector', 'Holo Barrier', 'Plasma Bomb', 'Dragon Mech', 'Cardinal Sentry', 'Serpent Drone'];
    pItems.forEach((name, idx) => {
        const iy = palY + 50 + idx * 48;
        ctx.fillStyle = idx === 0 ? 'rgba(192, 132, 252, 0.3)' : 'rgba(2, 6, 23, 0.7)';
        ctx.fillRect(palX + 10, iy, palW - 20, 40);
        ctx.strokeStyle = idx === 0 ? '#c084fc' : 'rgba(148, 163, 184, 0.3)';
        ctx.strokeRect(palX + 10, iy, palW - 20, 40);
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '12px sans-serif';
        ctx.fillText(name, palX + 25, iy + 25);
    });

    // Center Canvas Grid Editor
    const gridX = 320;
    const gridY = 85;
    const gridS = 640;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.fillRect(gridX, gridY, gridS, gridS);
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2;
    ctx.strokeRect(gridX, gridY, gridS, gridS);

    // Draw Editor Canvas Content
    game.loadLevel(0);
    const editorCanvas = createCanvas(gridS, gridS);
    game.canvas = editorCanvas;
    game.ctx = editorCanvas.getContext('2d');
    game.isEditorMode = true;
    game.updateAndRender();
    ctx.drawImage(editorCanvas, gridX, gridY, gridS, gridS);

    // Right Telemetry & Actions Panel
    const rightX = 980;
    const rightY = 85;
    const rightW = 280;
    const rightH = 750;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(rightX, rightY, rightW, rightH);
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(rightX, rightY, rightW, rightH);

    ctx.fillStyle = '#c084fc';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('📊 LEVEL TELEMETRY', rightX + 15, rightY + 30);

    const stats = ['Grid Scale: 11×11', 'Energy Cores: 4', 'Enemies: 1', 'Blocks: 3', 'A* Solvability: GUARANTEED', 'Par Estimation: 18 Moves'];
    stats.forEach((s, idx) => {
        ctx.fillStyle = idx === 4 ? '#34d399' : '#cbd5e1';
        ctx.font = idx === 4 ? 'bold 12px sans-serif' : '12px sans-serif';
        ctx.fillText(`• ${s}`, rightX + 15, rightY + 65 + idx * 28);
    });

    // Action buttons (Simulate Play, Export JSON, Math Check)
    const actBtns = ['▶ SIMULATE PLAY (A*)', '🔍 VERIFY SOLVABILITY', '💾 EXPORT JSON', '📥 IMPORT JSON'];
    actBtns.forEach((btn, idx) => {
        const by = rightY + 280 + idx * 55;
        ctx.fillStyle = idx === 0 ? 'rgba(52, 211, 153, 0.25)' : 'rgba(192, 132, 252, 0.2)';
        ctx.fillRect(rightX + 10, by, rightW - 20, 44);
        ctx.strokeStyle = idx === 0 ? '#34d399' : '#c084fc';
        ctx.strokeRect(rightX + 10, by, rightW - 20, 44);
        ctx.fillStyle = idx === 0 ? '#34d399' : '#c084fc';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(btn, rightX + rightW / 2, by + 27);
    });

    return c;
}
console.log('--- 7. Rendering Cyber Architect Studio Screenshot ---');
saveCanvas(renderEditorScreen(), 'cyber_architect_editor.png');

// 8. Render Random Sokoban Lab
function renderRandomLabScreen() {
    const width = 1200;
    const height = 820;
    const c = createCanvas(width, height);
    const ctx = c.getContext('2d');

    // Background
    ctx.fillStyle = '#060a16';
    ctx.fillRect(0, 0, width, height);

    // Modal Card
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.fillRect(50, 40, width - 100, height - 80);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 40, width - 100, height - 80);

    // Header
    ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.fillRect(52, 42, width - 104, 60);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('CYBER PROTOCOL LAB (PROCEDURAL SOKOBAN GENERATOR)', 80, 80);

    // Generator Controls Panel
    const ctrlX = 80;
    const ctrlY = 130;
    const ctrlW = 400;
    const ctrlH = 600;

    ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
    ctx.fillRect(ctrlX, ctrlY, ctrlW, ctrlH);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.strokeRect(ctrlX, ctrlY, ctrlW, ctrlH);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('⚙️ PROTOCOL PARAMETERS', ctrlX + 20, ctrlY + 35);

    const params = [
        'Difficulty: EXPERT / MASTER',
        'Grid Dimensions: 13×13 EXPANDED',
        'Hostile Density: HIGH (Sentries + Turrets)',
        'Sokoban Push Blocks: 5 ALLOY COVERS',
        'Solvability Verification: A* CHECKED'
    ];
    params.forEach((p, idx) => {
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '12px sans-serif';
        ctx.fillText(`• ${p}`, ctrlX + 20, ctrlY + 75 + idx * 30);
    });

    // Seed Input Box
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(ctrlX + 20, ctrlY + 240, ctrlW - 40, 45);
    ctx.strokeStyle = '#00f0ff';
    ctx.strokeRect(ctrlX + 20, ctrlY + 240, ctrlW - 40, 45);
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('SEED: PROTOCOL-CYBER-8842', ctrlX + 35, ctrlY + 268);

    // Generate Button
    ctx.fillStyle = 'rgba(0, 240, 255, 0.25)';
    ctx.fillRect(ctrlX + 20, ctrlY + 310, ctrlW - 40, 50);
    ctx.strokeStyle = '#00f0ff';
    ctx.strokeRect(ctrlX + 20, ctrlY + 310, ctrlW - 40, 50);
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚡ SYNTHESIZE SOLVABLE CHAMBER', ctrlX + ctrlW / 2, ctrlY + 342);

    // Right Preview Canvas
    const prevX = 520;
    const prevY = 130;
    const prevS = 600;

    ctx.fillStyle = 'rgba(2, 6, 23, 0.95)';
    ctx.fillRect(prevX, prevY, prevS, prevS);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(prevX, prevY, prevS, prevS);

    // Draw Generated Board
    const genLevel = LoloRandomGenerator.generate(DIFFICULTY_HARD, 'PROTOCOL-CYBER-8842', 13);
    if (genLevel) {
        const labCanvas = createCanvas(prevS, prevS);
        game.canvas = labCanvas;
        game.ctx = labCanvas.getContext('2d');
        game.isEditorMode = false;
        game.initLevelFromData(genLevel);
        game.updateAndRender();
        ctx.drawImage(labCanvas, prevX, prevY, prevS, prevS);
    }

    return c;
}
console.log('--- 8. Rendering Random Sokoban Lab Screenshot ---');
saveCanvas(renderRandomLabScreen(), 'random_sokoban_lab.png');

console.log('🎉 ALL SCREENSHOTS, ROSTERS, AND ASSETS UPDATED SUCCESSFULLY!');
process.exit(0);
