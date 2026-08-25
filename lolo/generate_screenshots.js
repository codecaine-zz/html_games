const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 38472;
const BASE_DIR = path.resolve(__dirname, '..');
const LOLO_DIR = path.resolve(__dirname);
const SCREENSHOTS_DIR = path.join(LOLO_DIR, 'screenshots');

// Ensure directories exist
fs.mkdirSync(path.join(SCREENSHOTS_DIR, 'tiles'), { recursive: true });
fs.mkdirSync(path.join(SCREENSHOTS_DIR, 'blocks'), { recursive: true });
fs.mkdirSync(path.join(SCREENSHOTS_DIR, 'enemies'), { recursive: true });

// Start local HTTP server
const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/save-image') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const filename = data.filename;
                const base64Data = data.image.replace(/^data:image\/png;base64,/, '');
                const filePath = path.join(SCREENSHOTS_DIR, filename);
                fs.mkdirSync(path.dirname(filePath), { recursive: true });
                fs.writeFileSync(filePath, base64Data, 'base64');
                console.log(`Saved: ${filename}`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ok' }));
            } catch (err) {
                console.error('Error saving image:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
            }
        });
        return;
    }

    // Serve static files
    let reqUrl = req.url.split('?')[0];
    if (reqUrl === '/') reqUrl = '/lolo/adventures_of_lolo_cyberpunk_remaster.html';
    
    const filePath = path.join(BASE_DIR, reqUrl);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes = {
            '.html': 'text/html',
            '.js': 'application/javascript',
            '.css': 'text/css',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.svg': 'image/svg+xml',
            '.json': 'application/json'
        };
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

server.listen(PORT, async () => {
    console.log(`Server running at http://localhost:${PORT}`);

    const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

    function runChromeScreenshot(url, outputPath, windowWidth = 1200, windowHeight = 850, delayMs = 1500) {
        return new Promise((resolve, reject) => {
            const tmpProfile = `/tmp/chrome_ss_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            const cmd = `"${CHROME_PATH}" --headless=new --disable-gpu --user-data-dir="${tmpProfile}" --window-size=${windowWidth},${windowHeight} --screenshot="${outputPath}" --virtual-time-budget=${delayMs} "${url}"`;
            exec(cmd, (err, stdout, stderr) => {
                try { fs.rmSync(tmpProfile, { recursive: true, force: true }); } catch (e) {}
                if (err) {
                    console.error(`Error taking screenshot of ${url}:`, err);
                    reject(err);
                } else {
                    console.log(`Captured: ${outputPath}`);
                    resolve();
                }
            });
        });
    }

    try {
        console.log('--- 1. Generating Icon & Roster Assets via Renderer Page ---');
        // Run icon generator page
        const generatorUrl = `http://localhost:${PORT}/lolo/generate_assets_helper.html`;
        await runChromeScreenshot(generatorUrl, '/tmp/gen_helper.png', 800, 600, 3000);

        console.log('--- 2. Capturing Gameplay & UI Modal Screenshots ---');
        // Gameplay Stage 1
        await runChromeScreenshot(`http://localhost:${PORT}/lolo/adventures_of_lolo_cyberpunk_remaster.html?stage=1`, path.join(SCREENSHOTS_DIR, 'gameplay_stage1.png'), 1280, 860, 2000);
        
        // Gameplay Stage 45
        await runChromeScreenshot(`http://localhost:${PORT}/lolo/adventures_of_lolo_cyberpunk_remaster.html?stage=45`, path.join(SCREENSHOTS_DIR, 'gameplay_stage45.png'), 1280, 860, 2000);
        
        // Gameplay Stage 98
        await runChromeScreenshot(`http://localhost:${PORT}/lolo/adventures_of_lolo_cyberpunk_remaster.html?stage=98`, path.join(SCREENSHOTS_DIR, 'gameplay_stage98.png'), 1280, 860, 2000);
        
        // Cyber Architect Studio
        await runChromeScreenshot(`http://localhost:${PORT}/lolo/adventures_of_lolo_cyberpunk_remaster.html?view=editor`, path.join(SCREENSHOTS_DIR, 'cyber_architect_editor.png'), 1360, 920, 2000);
        
        // Procedural Sokoban Lab
        await runChromeScreenshot(`http://localhost:${PORT}/lolo/adventures_of_lolo_cyberpunk_remaster.html?view=random`, path.join(SCREENSHOTS_DIR, 'random_sokoban_lab.png'), 1280, 860, 2000);
        
        // 100-Stage Level Selector
        await runChromeScreenshot(`http://localhost:${PORT}/lolo/adventures_of_lolo_cyberpunk_remaster.html?view=levels&unlock=1`, path.join(SCREENSHOTS_DIR, 'level_selector.png'), 1280, 860, 2000);

        console.log('ALL SCREENSHOTS SUCCESSFULLY UPDATED!');
    } catch (e) {
        console.error('Screenshot generation failed:', e);
    } finally {
        server.close();
        process.exit(0);
    }
});
