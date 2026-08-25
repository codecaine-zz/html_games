# Adventures of Lolo: Cyberpunk Remaster — Master Technical Specification

> **Version**: 3.8.0 (16 Hostile AI Archetypes, 31×31 Apex Sector Scaling, 13 Puzzle Genres & 32 Chamber Archetypes, Bidirectional Random Session History Stack, Real-Time In-Game Level Loading, Deterministic Simulation Engine in Cyber Architect & Random Lab, Mega Grid Full Roster Synthesis, Persistent CRT Save Engine, Daily Hack Protocol with 7-Day Streak Calendar, Cyber Achievement Engine, Dynamic Tactical Dossiers, 3-Star Performance Scoring, 5 Cyber Theme Palettes, 8-Track Synthesizer, Tactical Blocks, Optical Laser Deflection, A* Solvability Engine & Cyber Architect Studio)  
> **Target Frameworks**: Vanilla HTML5/Canvas, Unity (C#), Godot (GDScript/C#), React Native, Unreal Engine (C++/Blueprints), WebGL / WebAssembly  
> **Source Reference**: `adventures_of_lolo_cyberpunk_remaster.html`

---

## 1. System Overview

*Adventures of Lolo: Cyberpunk Remaster* is a high-octane grid-based puzzle-action remaster that fuses classic top-down Sokoban mechanics with real-time hazard avoidance, 90° optical laser deflection, phase-permeable barriers, multi-directional aiming turrets (1–8 directions), an A* priority queue mathematical solvability engine, 16 hostile enemy archetypes with clear UI threat categorizations, 9 tactical push-block archetypes, 5 physics mechanics (portals, mag-lev ice, one-way gates, cracked walls, plasma bridges), an integrated Level Editor with full Simulation Replay (Cyber Architect), a 100-stage campaign with progressive grid scaling ($9\times 9$ up to $19\times 19$), a Daily Hack Protocol with a synchronized 24-hour UTC streak calendar, a 3-Star Performance Rating Engine, 5 switchable cyberpunk color themes, persistent CRT scanline overlay state management, an 8-track Web Audio synthesizer, and a procedural Sokoban heavy generator scaling up to $31\times 31$ Apex Sectors with 13 specialized puzzle genres and 32 chamber archetype presets.

### 1.1 Verified Runtime Contracts & Invariants

All ports, engine implementations, and modifications must strictly satisfy these core runtime invariants:

1. **Deterministic Single-Step Movement & Simulation**: Player movement executes precisely 1 tile per keystroke with smooth interpolated rendering (`renderX`, `renderY` lerp); quantum portal teleportation immediately snaps visual rendering coordinates to prevent cross-screen gliding artifacts.
2. **Strict Blocker State Enforcement**: Closed Data Chests (`TILE_CHEST_CLOSED`) and Exit Gateways (`TILE_DOOR_CLOSED`) are impassable collision barriers until heart/chest conditions are unlocked.
3. **100% Campaign Uniqueness & Solvability**: All 100 campaign stages possess unique layout signatures (`getLevelLayoutSignature`) and are mathematically proven solvable by `LoloMathSolver`.
4. **Deterministic Simulation Play Engine**:
   - Both the Random Lab modal (`simulateSolution`) and Cyber Architect Editor (`simulateEditorSolution`) feature real-time physical simulation replay based on the $A^*$ solver path.
   - Simulation accurately pushes dynamic blocks, slides across Mag-Lev Ice, teleports through Quantum Portals, shoots Bio-Eggs, rafts across water canals, consumes Energy Cores, unlocks Data Chests, opens Exit Gateways, and synchronously highlights path tape badges (`.random-tape-badge`).
   - Editor simulation isolates state (`isSimulatingInEditor = true`), preventing accidental campaign level advancement or background real-time enemy AI death conflicts during replay, and automatically restores the stage state upon completion.
5. **Mega Grid Full Hostile Roster Synthesis ($17\times 17$ to $31\times 31$)**:
   - The procedural generator's Mega Grid synthesis guarantees placement of all hostile enemy archetypes and specialized blocks across dedicated grid sectors with 100% verified mathematical solvability.
6. **3-Star Move Par Scoring**: Earned stars are computed against the mathematical optimal par move count ($M_{par}$) from `LoloMathSolver`:
   - $\star\star\star$ (**Gold Cyber Master**): $\text{Moves} \le M_{par} + 2$
   - $\star\star\star$ (**Silver Operative**): $\text{Moves} \le \lceil M_{par} \times 1.5 \rceil$
   - $\star\star\star$ (**Bronze Recon Clear**): Stage Completed.
7. **Daily Hack Protocol & Streak Lifecycle**:
   - Every 24 hours (00:00 UTC), a new deterministic chamber is synthesized via seed `DAILY-YYYYMMDD`.
   - Grid size scales by day of week: $11\times 11$ (Mon–Fri), $13\times 13$ (Sat), $15\times 15$ (Sun).
   - Clearing today's challenge updates `currentStreak`, `bestStreak`, `totalClears`, and adds a completion timestamp to the 7-Day Activity Calendar (`lolo_cyber_daily_v1`).
8. **Bidirectional Random Session History Stack**:
   - Recorded in `window.randomSessionHistory` with active index pointer `window.randomSessionIndex`.
   - Stepping backward (`window.prevRandomProtocol()`) or forward (`window.nextRandomProtocol()`) instantly restores full grid matrices, blocks, enemies, and player coordinates into the live playable engine with instant canvas updates and particle telemetry.
9. **Dynamic Stage-by-Stage Tactical Dossiers**:
   - `showSectorBriefing` dynamically scans the active chamber (Campaign Stages 1–100, Daily Hack, and Random Lab) and generates real-time telemetry: unique stage name, threat tier, hostile threat counts, environmental module summary, and tailored tactical directives.
10. **Modal Lifecycle Isolation & State Protection**:
    - All modal overlays are toggled via global `showModal(idOrEl)` and `hideModal(idOrEl)` enforcing `display: flex !important` / `display: none !important` to prevent Tailwind class conflicts.
    - Stage completion triggers `this.isStageCompleted = true` to lock inputs during victory celebrations; modal dismissal smoothly advances to the next stage or resets state, guaranteeing zero freeze lockups.
11. **Persistent Save State Management**: User progress (`lolo_cyber_unlocked`), per-stage star ratings (`lolo_cyber_level_stats`), daily streak logs (`lolo_cyber_daily_v1`), active theme (`lolo_cyber_active_theme`), CRT mode (`lolo_cyber_crt_mode`), and active audio preferences (`lolo_cyber_audio_settings`) automatically persist in `localStorage`.
12. **Progressive Board Scaling ($9\times 9$ to $31\times 31$)**: Board sizes adapt dynamically across difficulty tiers without reading out-of-bounds rows or clipping canvas viewports.
13. **Optical Laser Deflection**: Lasers intersecting Reflector Prisms (`BLOCK_REFLECTOR`) deflect 90° according to prism orientation ($\nearrow$, $\searrow$, $\swarrow$, $\nwarrow$) and support multi-bounce chained reflection up to 4 consecutive deflections.
14. **Laser Phase Pass-Through**: Lasers and blaster shots pass through Holo Barriers (`BLOCK_HOLO`) unimpeded, while physical entities (Lolo, enemies, push blocks) are physically blocked.
15. **Sokoban Multi-Block Generation**: The random generator with `blockDensity: 'heavy'` or `preset: 'sokoban'` generates 4 to 8 push blocks across symmetric corridor layouts with 100% verified solvability.
16. **Mathematical A* Solver Performance**: Search uses an A* Priority Queue (`MinHeap`) with canonical block sorting, solving multi-block chambers in under 100 states ($<1\text{ms}$).
17. **Zero-Asset Audio Synthesis**: All 18 SFX chimes and 8-track synthwave BGM songs are synthesized in real time via Web Audio API oscillators and gain envelopes with zero external asset dependencies.
18. **Keyboard & Mouse Fast Progression Parity**: Pressing <kbd>Enter</kbd> advances to the next unlocked stage or confirms victory/briefing modals instantly without requiring mouse navigation, while on-screen HUD buttons maintain full click and touch support.

### 1.2 Procedural Generator Filter Matrix (Beyond CRT)

The procedural chamber engine supports multiple independent filter layers that affect synthesis behavior and solvability constraints:
- **Terrain filters**: `includeGrass`, `includeSand`, `includeWater`, `includeTrees`, `includePortals`, `includeIce`, `includeArrows`, `includeCracked`
- **Enemy selection filters**: `allowedEnemies` restricts hostile archetypes eligible for placement
- **Block selection filters**: `allowedBlocks` restricts tactical block archetypes in generated chambers
- **Prefab selection filters**: `allowedPrefabs` includes or excludes specialized strategic chamber layouts
- **Difficulty / density controls**: `difficulty`, `gridSize` ($9\times 9$ to $31\times 31$), `blockDensity`, and `biome` combine to alter chamber generation patterns while preserving mathematical solvability constraints
- **Visual filters**: CRT mode (`subtle`, `heavy`, `off`), theme switching, and HUD overlays remain independent from the generation logic

---

## 2. Coordinate System & Grid Geometry

- **Base Standard Grid**: $11\times 11$ tiles ($0 \le x \le 10, 0 \le y \le 10$).
- **Campaign Dynamic Grid Brackets (100 Stages)**:
  - **Stage 1**: $11\times 11$ (1 stage) — Introductory Training Protocol (subtle trees, energy core, ammo core, serpent, push block).
  - **Stages 2–20**: $9\times 9$ (19 stages) — Foundations, simple alloy blocks, river bridges.
  - **Stages 21–40**: $11\times 11$ (20 stages) — Sentry networks, dual turrets, crossfires.
  - **Stages 41–65**: $13\times 13$ (25 stages) — Diagonal Sentinels, Don Medusa corridors, Reflector Prisms.
  - **Stages 66–85**: $15\times 15$ (20 stages) — 8-way Star Sentinels, triple-channel matrices, Moby vortex pools.
  - **Stages 86–95**: $17\times 17$ (10 stages) — High-density security sectors, Quantum Portals.
  - **Stages 96–100**: $19\times 19$ (5 apex stages) — Grandmaster cyber fortress chambers.
- **Random Protocol Matrix Dimensions**: $9\times 9$, $11\times 11$, $13\times 13$, $15\times 15$, $17\times 17$, $19\times 19$, $21\times 21$, $23\times 23$, $25\times 25$, $27\times 27$, $29\times 29$, $31\times 31$.
- **Origin**: Coordinate $(0, 0)$ is the top-left tile.
- **Outer Perimeter**: Rows $y=0, y=size-1$ and columns $x=0, x=size-1$ are indestructible perimeter walls (`TILE_WALL`), except for the Exit Gateway at $(Math.floor(size / 2), 0)$.
- **Key Landmarks**:
  - **Exit Gateway**: $(Math.floor(size / 2), 0)$ (`TILE_DOOR_CLOSED` $\to$ `TILE_DOOR_OPEN`).
  - **Data Chest**: $(Math.floor(size / 2), 2)$ (`TILE_CHEST_CLOSED` $\to$ `TILE_CHEST_OPENED`).
  - **Operative Spawn**: $(Math.floor(size / 2), size - 2)$.
  - **Stages 41–65**: $13\times 13$ (25 stages) — Diagonal Sentinels, Don Medusa corridors, Reflector Prisms.
  - **Stages 66–85**: $15\times 15$ (20 stages) — 8-way Star Sentinels, triple-channel matrices, Moby vortex pools.
  - **Stages 86–95**: $17\times 17$ (10 stages) — High-density security sectors, Quantum Portals.
  - **Stages 96–100**: $19\times 19$ (5 apex stages) — Grandmaster cyber fortress chambers.
- **Origin**: Coordinate $(0, 0)$ is the top-left tile.
- **Outer Perimeter**: Rows $y=0, y=size-1$ and columns $x=0, x=size-1$ are indestructible perimeter walls (`TILE_WALL`), except for the Exit Gateway at $(Math.floor(size / 2), 0)$.
- **Key Landmarks**:
  - **Exit Gateway**: $(Math.floor(size / 2), 0)$ (`TILE_DOOR_CLOSED` $\to$ `TILE_DOOR_OPEN`).
  - **Data Chest**: $(Math.floor(size / 2), 2)$ (`TILE_CHEST_CLOSED` $\to$ `TILE_CHEST_OPENED`).
  - **Operative Spawn**: $(Math.floor(size / 2), size - 2)$.

---

## 3. Comprehensive Tile Enumeration

| ID | Constant | Name | Walkable? | Blocks Laser? | Blocks Bullets? | Special Mechanic |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `0` | `TILE_FLOOR` | Floor | **Yes** | No | No | Standard walkable cyber floor |
| `1` | `TILE_WALL` | Perimeter Wall | No | **Yes** | **Yes** | Indestructible alloy wall |
| `2` | `TILE_TREE` | Cyber Tree | No | **Yes** | **Yes** | Solid cyber foliage barrier |
| `3` | `TILE_WATER` | Plasma Water | No | **Yes** | No | Lethal fluid; push an Egg into it to form a walkable bridge/raft |
| `4` | `TILE_GRASS` | Biome Grass | **Yes** | No | No | Natural floor / bridged canal tile |
| `5` | `TILE_SAND` | Biome Sand | **Yes** | No | No | High-tech desert biome floor |
| `6` | `TILE_HEART` | Energy Core | **Yes** | No | No | +1 to collected cores count |
| `7` | `TILE_HEART_AMMO` | Ammo Core | **Yes** | No | No | +1 to collected cores count & **+2 Blaster Ammo** |
| `8` | `TILE_CHEST_CLOSED` | Closed Chest | No | **Yes** | **Yes** | Impassable blocker; unlocks when all cores gathered |
| `9` | `TILE_CHEST_OPENED` | Open Chest | **Yes** | No | No | Stepping on it collects Data Pearl, triggers victory fanfare, opens Door |
| `10` | `TILE_DOOR_CLOSED` | Closed Door | No | **Yes** | **Yes** | Impassable exit gateway |
| `11` | `TILE_DOOR_OPEN` | Open Door | **Yes** | No | No | Stepping on it completes stage |
| `12` | `TILE_ONE_WAY_UP` | Gate (▲) | $\uparrow$ only | No | No | Allows upward travel; blocks downward entry |
| `13` | `TILE_ONE_WAY_DOWN` | Gate (▼) | $\downarrow$ only | No | No | Allows downward travel; blocks upward entry |
| `14` | `TILE_ONE_WAY_LEFT` | Gate (◀) | $\leftarrow$ only | No | No | Allows leftward travel; blocks rightward entry |
| `15` | `TILE_ONE_WAY_RIGHT` | Gate (▶) | $\rightarrow$ only | No | No | Allows rightward travel; blocks leftward entry |
| `16` | `TILE_PORTAL_A` | Quantum Portal Alpha | **Yes** | No | No | Teleports Lolo / pushed blocks to Portal Beta |
| `17` | `TILE_PORTAL_B` | Quantum Portal Beta | **Yes** | No | No | Teleports Lolo / pushed blocks to Portal Alpha |
| `18` | `TILE_ICE` | Mag-Lev Ice | **Yes** | No | No | Frictionless slide; entities glide until obstruction |
| `19` | `TILE_CRACKED_WALL` | Cracked Barrier | No | **Yes** | **Yes** | Vulnerable wall shattered by blaster shot or plasma bomb |

---

## 4. Tactical Push-Block Archetypes (9 Types)

Blocks are dynamic interactive entities stored in `level.blocks = [{ x, y, type, dir, hp, active, bonded }]`:

```javascript
const BLOCK_ALLOY = 'alloy';
const BLOCK_HEAVY = 'heavy';
const BLOCK_REFLECTOR = 'reflector';
const BLOCK_HOLO = 'holo';
const BLOCK_BOMB = 'bomb';
const BLOCK_MAGNETIC = 'magnetic';
const BLOCK_STICKY = 'sticky';
const BLOCK_FRAGILE = 'fragile';
const BLOCK_DECOY = 'decoy';
```

### 4.1 Block Archetype Specification Matrix

| Archetype | ID | Visual Theme | Beam Interaction | Push Behavior | Special Interaction |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Alloy Shield** | `alloy` | Sky-blue metal chamfer with cyber core | **Blocks 100%** | Standard 1-tile push | Basic Sokoban cover unit |
| **Heavy Titanium** | `heavy` | Dark slate with hazard chevrons | **Blocks 100%** | Immovable by Lolo | Heavy barrier; immovable by standard pushes |
| **Prism Reflector** | `reflector` | Emerald crystal with $45^\circ$ mirror prism | **Deflects $90^\circ$** | Standard 1-tile push | Redirects lasers based on `dir` ($\nearrow, \searrow, \swarrow, \nwarrow$) |
| **Holo Barrier** | `holo` | Purple matrix grid with phase scanlines | **Passes 100%** | Immovable barrier | Blocks characters/eggs, permeable to lasers and blaster shots |
| **Plasma Bomb** | `bomb` | Crimson reactor with blinking warning core | **Blocks 100%** | Standard 1-tile push | Explodes on shot/damage, clearing $3\times 3$ area (cracked walls, fragile blocks, enemies, Lolo) |
| **Mag-Lev Polar** | `magnetic` | Cyan magnetic coils with levitation aura | **Blocks 100%** | Standard 1-tile push | Glides continuously on Mag-Lev Ice tracks; emits shockwaves |
| **Adhesive Gel** | `sticky` | Lime-green biohazard canister | **Blocks 100%** | 1 push locks to floor | Nanite bonding locks into floor permanently after 1 push (`bonded = true`) |
| **Glass Crystal** | `fragile` | Crystalline cyan prism with fractures | **Blocks 100%** | Fractures on collision | Shatters permanently on collision, on 2 hard pushes, on shot, or bomb blast |
| **Decoy Hologram** | `decoy` | Amber glowing operative hologram | **Blocks 100%** | Standard 1-tile push | Draws enemy aim beams and chaser aggro away from Lolo |

### 4.2 Optical Laser Deflection Formula

When a laser beam traveling along vector $(dx, dy)$ strikes a `BLOCK_REFLECTOR` with orientation `dir`:

```javascript
function getReflectedVector(curDx, curDy, rDir) {
    if (rDir === 'up_right' || rDir === 'down_left') {
        // Forward Slash mirror ( / )
        if (curDx === 1 && curDy === 0) return { dx: 0, dy: -1 };       // Left -> UP
        else if (curDx === -1 && curDy === 0) return { dx: 0, dy: 1 };  // Right -> DOWN
        else if (curDx === 0 && curDy === -1) return { dx: 1, dy: 0 };  // Down -> RIGHT
        else if (curDx === 0 && curDy === 1) return { dx: -1, dy: 0 };  // Up -> LEFT
        else return { dx: -curDy, dy: -curDx };
    } else {
        // Backslash mirror ( \ )
        if (curDx === 1 && curDy === 0) return { dx: 0, dy: 1 };        // Left -> DOWN
        else if (curDx === -1 && curDy === 0) return { dx: 0, dy: -1 }; // Right -> UP
        else if (curDx === 0 && curDy === -1) return { dx: -1, dy: 0 }; // Down -> LEFT
        else if (curDx === 0 && curDy === 1) return { dx: 1, dy: 0 };   // Up -> RIGHT
        else return { dx: curDy, dy: curDx };
    }
}
```

The raycasting engine supports up to **4 chained reflections (`maxReflections = 4`)** per laser beam.

---

## 5. Hostile Enemy AI Archetypes (16 Enemies)

| ID | Name | Threat Profile | AI Behavior & Mechanics |
| :--- | :--- | :--- | :--- |
| `snake` | **Passive Serpent** | Passive | Immobile drone; turns into an Egg Capsule when shot; pushable into water to form a walkable bridge/raft. |
| `medusa` | **Cardinal Sentry** | High (Instant Kill) | Fires lethal line-of-sight laser beams along 4 orthogonal axes (+). Blocked by blocks, trees, walls, doors, chests. Passes through Holo Barriers; reflects on Reflector Prisms. |
| `medusa_diag` | **Diagonal Sentry** | High (Instant Kill) | Fires lethal line-of-sight laser beams along 4 diagonal axes (✕). |
| `medusa_omni` | **Omni Sentry** | Extreme (Instant Kill) | Fires lethal line-of-sight laser beams along all 8 cardinal and diagonal directions (★). |
| `turret` | **Multi-Directional Turret** | Configurable | Fires lethal lasers in 1 to 8 customizable directions specified in `dirs: [...]`. |
| `gol` | **Dragon Mech** | Awakening Hazard | Slumbers while cores remain; awakens upon collecting all cores and shoots lethal fireballs/lasers in its facing direction. |
| `don_medusa` | **Patrol Sentinel** | Extreme (Instant Kill) | Patrols back and forth on a fixed horizontal/vertical track; shoots lethal line-of-sight cross lasers like Medusa. |
| `leeper` | **EMP Nanobot** | Area Denial | Actively chases Lolo; upon reaching adjacent tile, falls asleep and becomes an impassable solid obstacle tile. |
| `skull` | **Charger Skull** | Awakening Chaser | Slumbers while cores remain; awakens upon collecting all cores and charges straight at Lolo when aligned horizontally/vertically. |
| `alma` | **Buzzsaw Bot** | Relentless Chaser | Continuously pathfinds and rolls toward Lolo in real time across walkable floor tiles. |
| `rocky` | **Hydraulic Golem** | Physical Threat | Aggressively charges and physically shoves Lolo backward on contact. |
| `moby` | **Vortex Leviathan** | Pull Hazard | Emits a magnetic tractor vortex across water lanes and corridors, pulling Lolo toward it. |
| `hopper` | **Beetle Hopper** | Jumping Chaser | Chases Lolo and leaps over obstacles, trees, and push blocks. |
| `striker` | **Striker Drone** | Sniper Sentry | Fires high-velocity line-of-sight laser projectiles directly across unobstructed corridors. |
| `wisp` | **Phasing Phantom** | Stealth Threat | Ethereal unit that moves toward Lolo, phasing through push-blocks, crystals, and trees. |
| `orbiter` | **Revolving Node** | Area Denial | Orbits in continuous circular trajectories around staging anchors with rotating pulse lasers. |

---

## 6. Daily Hack Protocol & Streak Engine (`DailyHackManager`)

### 6.1 Deterministic UTC Seed Synthesizer
- **Seed Pattern**: `DAILY-YYYYMMDD` (generated via UTC calendar components).
- **Grid Scaling**:
  - Monday – Friday: $11\times 11$ (Standard Operative Matrix).
  - Saturday: $13\times 13$ (Advanced Patrol Gauntlet).
  - Sunday: $15\times 15$ (Apex Fortress Grandmaster Challenge).

### 6.2 Local Storage Daily Schema (`lolo_cyber_daily_v1`)
```json
{
  "currentStreak": 3,
  "bestStreak": 7,
  "totalClears": 12,
  "lastCompletedDate": "2026-08-24",
  "clearedDays": {
    "2026-08-22": { "stars": 3, "moves": 24, "time": 14200 },
    "2026-08-23": { "stars": 3, "moves": 28, "time": 18500 },
    "2026-08-24": { "stars": 3, "moves": 19, "time": 11800 }
  }
}
```

---

## 7. 3-Star Rating Engine & Storage Architecture

### 7.1 Move Rating Formula

Given player move count $M$ and optimal solver par move count $M_{par}$:

$$\text{Stars}(M, M_{par}) = \begin{cases} 3 & \text{if } M \le M_{par} + 2 \\ 2 & \text{if } M \le \lceil M_{par} \times 1.5 \rceil \\ 1 & \text{otherwise} \end{cases}$$

### 7.2 Local Storage Schema Specification

| Storage Key | Type | Description |
| :--- | :--- | :--- |
| `lolo_cyber_unlocked` | `number` | Index of highest unlocked stage in campaign (1–100). |
| `lolo_cyber_level_stats` | `Record<string, LevelStats>` | Object mapping stage keys (`campaign_1` to `campaign_100`, `random_SEED`) to performance records: `{ stars: number, bestMoves: number, bestTime: number, lastCleared: number }`. |
| `lolo_cyber_daily_v1` | `DailyStats` | Object storing daily streak counts, best records, and per-day timestamps. |
| `lolo_cyber_achievements` | `Record<string, number>` | Object mapping achievement IDs to unlock timestamps. |
| `lolo_cyber_audio_settings` | `AudioSettings` | Object persisting `{ currentBgmTrack: number, bgmEnabled: boolean, sfxEnabled: boolean }`. |
| `lolo_cyber_active_theme` | `string` | Active theme identifier (`synthwave`, `matrix`, `vaporwave`, `obsidian`, `hotline`). |
| `lolo_cyber_crt_mode` | `string` | Active CRT overlay preset (`subtle`, `heavy`, `off`). |

---

## 8. Web Audio Synthesis Engine (`CyberAudioEngine`)

Generated purely via native Web Audio API oscillators and gain nodes (zero external audio files):

### 8.1 8-Track BGM Sequencer
8 switchable 8th-note procedural synthwave tracks:
- **Track 0 (*Cyber Pulse*)**: 128 BPM driving synthwave.
- **Track 1 (*Quantum Rush*)**: 140 BPM high-energy puzzle bounce.
- **Track 2 (*Synth Chill*)**: 105 BPM atmospheric futuristic flow.
- **Track 3 (*Neon Overdrive*)**: 136 BPM cyberpunk electro bassline.
- **Track 4 (*Hypergrid Arc*)**: 124 BPM melodic arpeggiator flow.
- **Track 5 (*Matrix Solace*)**: 110 BPM dark techno ambient.
- **Track 6 (*Retro Byte Surge*)**: 145 BPM chip-synth high-tempo drive.
- **Track 7 (*Orbital Protocol*)**: 118 BPM progressive sci-fi pulse.

### 8.2 Sound FX Synthesis Table
| Function | Waveform & Envelopes | Audio Purpose |
| :--- | :--- | :--- |
| `playStep()` | Sine $160\text{Hz} \to 70\text{Hz}$, 60ms | Deterministic footstep |
| `playHeart()` | 4-note Sine arpeggio ($C_5, E_5, G_5, C_6$) | Energy core pickup |
| `playShoot()` | Sawtooth $900\text{Hz} \to 150\text{Hz}$, 150ms | Blaster plasma shot |
| `playEggify()` | Square $300\text{Hz} \to 800\text{Hz}$, 180ms | Enemy egg encasement |
| `playChest()` | 5-note Triangle chord ($A_4, C^\sharp_5, E_5, A_5, C^\sharp_6$) | Data chest unlock |
| `playClear()` | 6-note Square arpeggio ($C_5, E_5, G_5, C_6, E_6, G_6$) | Stage clear victory |
| `playPush()` | Triangle $120\text{Hz} \to 45\text{Hz}$, 120ms | Push block movement |
| `playPortalWarp()` | Dual FM sweep: Sawtooth $220\text{Hz} \to 1320\text{Hz}$ + Sine $440\text{Hz} \to 880\text{Hz}$ | Quantum teleportation |
| `playIceSlide()` | Triangle $750\text{Hz} \to 1200\text{Hz}$, 80ms | Mag-Lev ice glide |
| `playWallCrack()` | Sawtooth $180\text{Hz} \to 30\text{Hz}$, 250ms | Barrier destruction |
| `playVortexPull()` | Sine $140\text{Hz} \to 60\text{Hz}$, 160ms | Moby tractor vortex |
| `playDeath()` | Sawtooth $450\text{Hz} \to 40\text{Hz}$, 450ms | Operative defeat |
| `playBombExplode()`| Sawtooth $140\text{Hz} \to 25\text{Hz}$, 500ms | Plasma bomb detonation |
| `playCrystalShatter()`| Multi-sine chime $1200\text{Hz} \dots 3200\text{Hz} \to 400\text{Hz}$ | Fragile crystal shattering |
| `playNaniteBond()` | Square $220\text{Hz} \to 110\text{Hz}$, 150ms | Adhesive gel floor lock |
| `playPowerUp()` | 5-note Triangle chord ($330\text{Hz} \dots 880\text{Hz}$) | Ammo bonus / stage saved |
| `playHit()` | Sawtooth $280\text{Hz} \to 70\text{Hz}$, 100ms | Shield deflection / impact |
| `playPrismReflect()`| Triangle $880\text{Hz} \to 1760\text{Hz}$, 120ms | Laser optical deflection |

---

## 9. Input, Fast Navigation & CRT State Machine Specification

### 9.1 Unified Input Matrix

| Action | Primary Keystroke | Secondary Keystroke | Touch / Mouse Trigger |
| :--- | :--- | :--- | :--- |
| **Move Operative** | `W` `A` `S` `D` | `ArrowUp` `ArrowLeft` `ArrowDown` `ArrowRight` | On-Screen Directional Pad (`btn-pad-*`) |
| **Fire Cyber Blaster** | `Space` | `X` | `SHOOT` Touch Pad Button |
| **Undo Move** | `Z` | `U` | `Undo` Touch Pad Button |
| **Restart Chamber** | `R` | — | `Reset` Touch Pad Button |
| **Get Solver Hint** | `H` | — | `Hint` HUD Button |
| **Fast Next Level / Advance** | `Enter` | — | `Next Stage` HUD Button (`btn-stage-next`) |
| **Confirm Victory / Next Protocol** | `Enter` | `Space` | `NEXT STAGE` Victory Modal Button |
| **Dismiss Briefing / Start** | `Enter` | `Escape` | `Start Mission` Briefing Modal Button |
| **Toggle CRT Preset** | — | — | `CRT: [Preset]` Header Button (`btn-vfx-toggle`) |

### 9.2 Fast Level Progression Rules (<kbd>Enter</kbd>)
1. **Context-Aware Priority**:
   - If the **Victory Modal** is active, <kbd>Enter</kbd> clicks `#btn-victory-next-random` to immediately load the next campaign stage or synthesize the next random/daily protocol.
   - If the **Sector Briefing Modal** is active, <kbd>Enter</kbd> immediately begins the mission.
   - During **Chamber Play**: If the next stage is unlocked (or current stage completed), <kbd>Enter</kbd> instantly loads `currentLevelIndex + 1`.
2. **Text Field Immunity**: Keystroke handlers check `document.activeElement` and bypass progression when the player is editing in JSON inputs or custom seed textareas.

### 9.3 CRT Preset State Machine & Layout Stability
- **States**: `subtle` (default), `heavy`, `off`.
- **State Transition Cycle**: $\text{Subtle} \to \text{Off} \to \text{Heavy} \to \text{Subtle}$.
- **Storage**: Key `lolo_cyber_crt_mode` persisted synchronously to `localStorage`.
- **Layout Invariance**: Action buttons specify a fixed minimum width (`min-w-[108px] sm:min-w-[114px] shrink-0 justify-center`) and internal `pointer-events-none` to guarantee zero layout shifts when label text updates.

### 9.4 Mode Transition & Main Campaign Return Invariant
- **Tactical Dossier Return Button**: When the operative is engaged in `daily` or `random` mode, the Tactical Dossier HUD dynamically reveals `#btn-return-campaign` displaying `Return to Main Game (Stage X)`.
- **Victory Modal Direct Navigation**: Upon victory in a Daily Protocol or Random Simulation, the modal exposes `#btn-victory-return-campaign` alongside replay and calendar actions.
- **Daily Protocol Modal Direct Navigation**: The Daily Hack protocol popup provides `#btn-daily-return-campaign` to allow immediate return to the campaign without requiring replaying.

---

## 10. Puzzle Genres & Chamber Archetypes (13 Genres • 32 Archetypes)

The procedural generator features 1-click tactical archetypes spanning 13 distinct puzzle genres:

| Genre ID | Genre Title | Primary Focus & Signature Mechanics |
| :--- | :--- | :--- |
| `all` | **Dynamic Mix** | Harmonious combination of all available hazard systems and block types. |
| `sokoban` | **Sokoban Corridors** | Tight multi-block warehouse packing, symmetric alleyways, heavy push-blocks. |
| `optics` | **Optical Reflection** | 90° Prism Deflector chains, multi-bounce laser redirection, prism aiming. |
| `portal` | **Quantum Portals** | Multi-pair wormhole teleportation loops, non-Euclidean path traversal. |
| `ice` | **Mag-Lev Ice Glider** | Superconducting frictionless slide tracks, momentum arrest barriers. |
| `sentry` | **Sentry Gauntlet** | Medusa crossfires, Don Medusa patrol tracks, multi-directional turret corridors. |
| `chaser` | **Chaser Arena** | Buzzsaw Alma bots, awakened Charger Skulls, hydraulic shoving golems. |
| `swarm` | **Nanobot Swarm** | Relentless EMP Leeper drones requiring strategic freezing as step barricades. |
| `timing` | **Precision Timing** | Fast-moving Patrol Sentinels, timed Bio-Egg water bridge dissolution. |
| `fortress` | **Fortress Breach** | Heavy outer bastion perimeter walls, Plasma Bomb detonation breeches. |
| `phase` | **Phase Labyrinth** | Phasing Holo Barriers, Phasing Phantom wisps, optical shot conduits. |
| `decoy` | **Decoy Infiltration** | Decoy hologram signal redirection, sentry aim spoofing. |
| `titan` | **Titan Apex** | Full hostile AI threat roster across extended Mega grid sectors ($21\times 21$ to $31\times 31$). |

---

## 11. Verification Suite

Headless verification across all campaign stages, procedural generation, daily streak tracking, and tactical dossiers can be executed with Node.js:

```bash
# Verify 100/100 campaign stages, unique layout signatures, and grid scaling:
node lolo/verify_html.js

# Run full project test suite:
npm test
```

