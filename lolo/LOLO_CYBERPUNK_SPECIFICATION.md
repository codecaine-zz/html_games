# Adventures of Lolo: Cyberpunk Remaster — Master Technical Specification

> **Version**: 3.1.0 (Comprehensive Engine, Tactical Blocks, Optical Laser Deflection, A* Solvability Engine, Cyber Architect Studio & Heavy Sokoban Lab)  
> **Target Frameworks**: Vanilla HTML5/Canvas, Unity (C#), Godot (GDScript/C#), React Native, Unreal Engine (C++/Blueprints), WebGL / WebAssembly  
> **Source Reference**: `adventures_of_lolo_cyberpunk_remaster.html`

---

## 1. System Overview

*Adventures of Lolo: Cyberpunk Remaster* is a high-octane grid-based puzzle-action remaster that fuses classic top-down Sokoban mechanics with real-time hazard avoidance, 90° optical laser deflection, phase-permeable barriers, multi-directional aiming turrets (1–8 directions), an A* priority queue mathematical solvability engine, 13 enemy archetypes, 9 tactical push-block archetypes, 5 physics mechanics (portals, mag-lev ice, one-way gates, cracked walls, plasma bridges), a 100-stage campaign with progressive grid scaling ($9\times 9$ up to $19\times 19$), a procedural Sokoban heavy generator, and an integrated Level Editor & Chamber Vault (Cyber Architect).

### 1.1 Verified Runtime Contracts & Invariants

All ports, engine implementations, and modifications must strictly satisfy these core runtime invariants:

1. **Deterministic Single-Step Movement**: Player movement executes precisely 1 tile per keystroke with smooth interpolated rendering (`renderX`, `renderY` lerp); no tile skipping or ghost movements.
2. **Strict Blocker State Enforcement**: Closed Data Chests (`TILE_CHEST_CLOSED`) and Exit Gateways (`TILE_DOOR_CLOSED`) are impassable collision barriers until heart/chest conditions are unlocked.
3. **100% Campaign Uniqueness & Solvability**: All 100 campaign stages possess unique layout signatures (`getLevelLayoutSignature`) and are mathematically proven solvable by `LoloMathSolver`.
4. **Progressive Board Scaling ($9\times 9$ to $19\times 19$)**: Board sizes adapt dynamically across difficulty tiers (Stage 1: $11\times 11$; Stages 2–20: $9\times 9$; Stages 21–40: $11\times 11$; Stages 41–65: $13\times 13$; Stages 66–85: $15\times 15$; Stages 86–95: $17\times 17$; Stages 96–100: $19\times 19$) without reading out-of-bounds rows or clipping canvas viewports.
5. **Optical Laser Deflection**: Lasers intersecting Reflector Prisms (`BLOCK_REFLECTOR`) deflect 90° according to prism orientation ($\nearrow$, $\searrow$, $\swarrow$, $\nwarrow$) and support multi-bounce chained reflection up to 4 consecutive deflections.
6. **Laser Phase Pass-Through**: Lasers and blaster shots pass through Holo Barriers (`BLOCK_HOLO`) unimpeded, while physical entities (Lolo, enemies, push blocks) are physically blocked.
7. **Sokoban Multi-Block Generation**: The random generator with `blockDensity: 'heavy'` or `preset: 'sokoban'` generates 4 to 8 push blocks across symmetric corridor layouts with 100% verified solvability.
8. **Mathematical A* Solver Performance**: Search uses an A* Priority Queue (`MinHeap`) with canonical block sorting, solving multi-block chambers in under 100 states ($<1\text{ms}$).
9. **Zero-Asset Audio Synthesis**: All 18 SFX chimes and 3-track synthwave BGM songs are synthesized in real time via Web Audio API oscillators and gain envelopes with zero external asset dependencies.
10. **AAA Visual Polish & Juice**: Screen shake trauma decay, hit-stop frame freezing, procedural squash & stretch rigs, dynamic CRT scanline glow overlays, and particle bursts on every interaction.

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

## 5. Hostile Enemy AI Archetypes (13 Enemies)

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

### 5.1 Enemy Shot Immunity & Blaster Mechanics
- Medusas (`medusa`, `medusa_diag`, `medusa_omni`), Turrets (`turret`), and Don Medusa (`don_medusa`) possess **Heavy Deflector Shields** that ricochet blaster shots (`SHIELD DEFLECTED`).
- Non-immune enemies (`snake`, `gol`, `leeper`, `skull`, `alma`, `rocky`, `moby`, `hopper`) get encased in an **Egg Capsule** (`playEggify()`) on the 1st shot, and are vaporized/ejected off-grid on the 2nd shot with a respawn cooldown.
- Plasma Bomb detonations (`detonateBomb`) vaporize all non-immune hostiles within a $3\times 3$ area.
- Decoy Holograms (`BLOCK_DECOY`) draw aim beams and aggro chasers toward the decoy rather than Lolo.

---

## 6. Direction Vectors & Preset Compass System

The engine defines 8 uniform 2D directional vectors:

```javascript
const DIR_MAP = {
    'up':         { dx:  0, dy: -1, name: 'North' },
    'up_right':   { dx:  1, dy: -1, name: 'North-East' },
    'right':      { dx:  1, dy:  0, name: 'East' },
    'down_right': { dx:  1, dy:  1, name: 'South-East' },
    'down':       { dx:  0, dy:  1, name: 'South' },
    'down_left':  { dx: -1, dy:  1, name: 'South-West' },
    'left':       { dx: -1, dy:  0, name: 'West' },
    'up_left':    { dx: -1, dy: -1, name: 'North-West' }
};
```

### 6.1 Turret & Emitter Direction Presets
- `1-up`: `['up']` (Single North emitter)
- `2-horiz`: `['left', 'right']` (Horizontal dual beam)
- `3-tup`: `['left', 'right', 'up']` (T-Shape 3-way emitter)
- `4-cross`: `['up', 'down', 'left', 'right']` (Cardinal 4-way cross)
- `4-diag`: `['up_left', 'up_right', 'down_left', 'down_right']` (Diagonal 4-way X)
- `5-fan`: `['up_left', 'up', 'up_right', 'left', 'right']` (5-way upward fan)
- `6-hex`: `['up_left', 'up', 'up_right', 'down_left', 'down', 'down_right']` (6-way hexagon emitter)
- `8-omni`: `['up', 'up_right', 'right', 'down_right', 'down', 'down_left', 'left', 'up_left']` (Full 360° omnidirectional star)

---

## 7. Mathematical A* Solvability Engine (`LoloMathSolver`)

The solver mathematically proves whether any given stage is 100% beatable using an **A\* Priority Queue (`MinHeap`) Search** with canonical block sorting:

### 7.1 State Serialization & Canonical Equivalence

To eliminate factorial state-space explosion $O(N!)$ caused by identical push blocks in permuted array indices:

$$\text{CanonicalBlocks} = \text{sort}(Blocks, (a, b) \implies a.y === b.y \;?\; a.x - b.x : a.y - b.y)$$

$$\text{StateKey} = \text{lx},\text{ly} \mid \text{hMask} \mid \text{CanonicalBlocks} \mid \text{Enemies} \mid \text{Ammo} \mid \text{ChestState} \mid \text{DoorOpen} \mid \text{Bridges}$$

### 7.2 Heuristic Function $h(s)$

$$h(s) = (\text{RemainingCores} \times 100 + \min_{i \in \text{Uncollected}}(\text{ManhattanDist}(Lolo, Core_i))) + \text{ChestDist} + \text{DoorDist}$$

### 7.3 Performance Benchmark

- 8-Block Heavy Sokoban Puzzle: Solved in **58 states in 0.8ms** (vs. 75,000+ states in standard BFS).
- 100 Campaign Stages: 100/100 verified in $< 1.2\text{s}$ total CPU time.

---

## 8. Procedural Random Level Generator (`LoloRandomGenerator` & `SeededRNG`)

### 8.1 Seed Format & LCG Random Engine
- Seeds follow the format `CYBER-[TAG][NUM]-[TIME]` (e.g. `CYBER-XK482910-4821`).
- Uses a deterministic Linear Congruential Generator (`SeededRNG`) providing reproducible pseudo-random numbers.

### 8.2 Generation Architecture
1. **Candidate Generation**: Generates terrain, corridor templates, energy cores, ammo pickups, dynamic obstacles, push blocks, and hostiles.
2. **Mathematical Solvability Verification**: Invokes `LoloMathSolver.solve(level, 50000)` to ensure the layout is beatable.
3. **Guaranteed Fallback**: If 12 randomized candidate attempts fail solver verification, creates a mathematically guaranteed solvable fallback layout.

### 8.3 Presets & Architect Controls
1. **Speedrun Blitz**: Minimal block count, wide open corridors, agile Serpents and Leepers.
2. **Sokoban Chamber**: **Heavy Block Density (4–8 push blocks)**, Reflector Prisms, laser shield puzzles.
3. **Quantum Flux**: Mandatory Dual Quantum Portals, Mag-Lev Ice slides, and One-Way Arrow gates.
4. **Laser Gauntlet**: 6-Hex and 8-Star Turrets with Reflector Prism optical loops.
5. **Apex Fortress**: All 13 enemy archetypes, 9 block types, and $15\times 15$ to $19\times 19$ fortress citadels.

---

## 9. Level Editor & Chamber Vault (Cyber Architect)

The built-in Cyber Architect studio provides a complete developer suite for designing, testing, and saving custom levels:

1. **5 Palette Categories**:
   - `TILES` (12 Tile Brushes: Floor, Wall, Tree, Water, Mag-Lev Ice, Cracked Barrier, Gate Up, Gate Down, Gate Left, Gate Right, Portal Alpha, Portal Beta).
   - `BLOCKS` (9 Tactical Push Blocks: Alloy Shield, Heavy Titanium, Prism Reflector, Holo Barrier, Plasma Bomb, Mag-Lev Polar, Adhesive Gel, Glass Crystal, Decoy Hologram).
   - `ITEMS` (5 Items: Energy Core, Ammo Core, Data Chest, Exit Gateway, Lolo Spawn).
   - `HOSTILES` (13 Enemies: Serpent, Medusa (+), Diag (✕), Omni (★), Turret (1-8D), Dragon (Gol), Patrol Sentinel (Don Medusa), Leeper EMP, Skull, Alma Buzzsaw, Rocky Golem, Moby Vortex, Hopper Beetle).
   - `PREFABS` (4 Multi-Tile Tactical Rooms: Laser Bunker, Prism Loop, Sokoban 4-Box, Quantum Gate).
2. **4 Drawing Tools**: Pencil, Flood Fill (`Bucket`), Box / Rectangle Drag (`Rect`), Eraser.
3. **4 Symmetry Modes**: Off, Horizontal (`↔`), Vertical (`↕`), 4-Way Quad (`✛`).
4. **Optical Prism Angle Switcher**: $\nearrow 45^\circ$, $\searrow 135^\circ$, $\swarrow 225^\circ$, $\nwarrow 315^\circ$.
5. **Multi-Directional Laser Emitter Compass**: 8 interactive direction toggles with 8 quick presets.
6. **Live Telemetry & Solvability HUD**: Live block counter, core counter, hazard counter, portal counter, and instant mathematical solvability readout (`BEATABLE (Nm)` vs `UNSOLVABLE` vs `NO CORES`).
7. **Solvability Test Runner**: Executes up to 75,000 states via `LoloMathSolver` displaying move count, states explored, and the first 15 move steps.
8. **Chamber Vault & JSON Scheme**: LocalStorage save/load/delete management (`lolo_cyber_vault_stages`) with JSON import/export modal.

---

## 10. Web Audio Synthesis Engine (`CyberAudioEngine`)

Generated purely via native Web Audio API oscillators and gain nodes (zero external audio files):

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

### 10.1 BGM Sequencer
3 switchable 8th-note synthwave tracks:
- **Track 0 (*Cyber Pulse*)**: 128 BPM driving synthwave.
- **Track 1 (*Quantum Rush*)**: 140 BPM high-energy puzzle bounce.
- **Track 2 (*Synth Chill*)**: 105 BPM atmospheric futuristic flow.

---

## 11. AAA Visual Effects & Juice Architecture

- `ParticleSystem`: Procedural rendering of muzzle flashes, plasma blasts, shockwaves, scorch marks, floating combat text, diamond impact sparks, and energy rings.
- `TraumaCamera`: Screen shake engine utilizing quadratic trauma decay (`trauma^2`).
- `HitStopManager`: Micro-frame pauses on impactful collisions and detonations.
- `SquashStretchRig`: Elastic procedural spring squash & stretch on moves, recoil, and block pushes.
- `AtmosphereEngine`: Cyber ambient grid scanlines with optional CRT glow overlay (`btn-vfx-toggle`).

---

## 12. Verification Suite

Headless verification across all campaign stages and procedural generation can be executed with Node.js:

```bash
# Verify 100/100 campaign stages, unique layout signatures, and grid scaling:
node verify_html.js
```
