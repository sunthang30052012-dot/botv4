# Minecraft Bot Ultimate Control Panel (Mineflayer Bot-v3)

An advanced full-stack command and control dashboard for automated Minecraft bots (based on `bot-v3` / Mineflayer), featuring real-time 3D ASCII voxel viewports, interactive 2D radar minimap, chat and macro console, player inventory management, health telemetry, and dual connection modes (live Minecraft server and local simulator sandbox).

## User Review & Critical Decisions

> [!IMPORTANT]
> The following design and functional specifications have been confirmed for implementation:

- **Confirmed Mode**: Full-stack Mineflayer bot backend running on Node.js/Express with WebSockets, paired with an integrated interactive simulator mode so the panel is fully operational and testable immediately in AI Studio without needing an external Minecraft server port forward.
- **Confirmed Visual Aesthetic**: Dark gaming HUD with emerald neon accents (`#10b981` / `#059669`), deep obsidian chassis (`#090d16` / `#111827`), hairline emerald borders, and clean monospace tabular telemetry.
- **Confirmed Feature Set**: Full suite prioritizing 3D ASCII character viewport with drag-to-look and mousewheel zoom, 2D radar with entity classification (players, hostile, passive mobs, terrain), inventory and hotbar inspector, health/food telemetry bars, real-time Minecraft chat console, and automated game macros (KingSMP clock menu, slot clicker, auto `/tpaccept`, anti-AFK random roaming).

---

## 1. Overview & Core Concept

### What It Does
The Minecraft Bot Ultimate Control Panel allows players and server administrators to remotely pilot and automate a Minecraft bot account (both offline cracked accounts and Microsoft authentication accounts). Users can monitor the bot's real-time surroundings through a high-performance pseudo-3D ASCII raymarched viewport and a rotating 2D radar, execute WASD movements and jumps, send chat messages and commands, inspect bot health/hunger/inventory, and trigger farming/lobby bypass macros.

### Target Audience & Persona
Minecraft players and administrators running automation bots (AFK farming, lobby bypasses, server moderation, automated resource collection) who want a web-accessible cockpit without needing to run a full 3D Minecraft desktop client.

### Key Value
- **Zero Heavy Client Overhead**: Lightweight ASCII and Canvas rendering runs smoothly in any web browser and mobile device.
- **Immediate Testability**: Built-in simulator sandbox generates dynamic terrain, entities, and chat responses when disconnected, while offering seamless connection to real online Minecraft servers.
- **Complete Automation Toolkit**: One-click actions for inventory navigation, menu clicks, teleport requests, and anti-AFK wandering.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Server Configuration & Connection**: The user configures server IP/host (defaulting to `kingmc.vn` or custom), port, username, authentication type (Offline or Microsoft), and optional auto `/login` password. Clicking **Connect** spins up the bot engine or engages the interactive sandbox.
2. **Surroundings & Navigation**: The user inspects the bot's environment via the 3D ASCII canvas viewport (with interactive click-drag camera rotation and scroll wheel zoom) and the 2D circular radar. The user controls bot navigation using on-screen WASD + Jump pads or standard computer keyboard shortcuts.
3. **Telecommunication & Chat Log**: The user monitors live in-game chat messages, system announcements, and Microsoft auth verification codes. The bottom chat box enables instant transmission of chat messages and slash commands (`/tp`, `/home`, `/spawn`, `/login`).
4. **Automation & Macro Operations**: The user clicks one-touch macro buttons to open the clock menu, select slot 24 (KingSMP), accept teleport requests (`/tpaccept`), or toggle automated anti-AFK random wandering.
5. **Inventory & Vitals Inspection**: An expandable hotbar and 36-slot inventory matrix displays equipped weapons, armor, and items with stack counts and durability.

### Visual Identity & Theme
- **Aesthetic Direction**: High-tech cyber gaming console, utilitarian cockpit with clean dark obsidian surfaces and emerald neon highlights.
- **Color Palette**:
  - Dominant Neutral (60%): Deep obsidian black (`#090d16` canvas, `#111827` panels).
  - Structural Surface (30%): Charcoal cards (`#1f293d`), hairline borders (`#374151` and `#10b98122`), muted steel typography (`#94a3b8`).
  - Accent Budget (10%): High-visibility emerald green (`#10b981`), cyber cyan for active states (`#06b6d4`), amber warnings (`#f59e0b`), and crimson for stop/disconnect actions (`#ef4444`).
- **Typography & Hierarchy**:
  - Display & Headings: `Plus Jakarta Sans` or `Outfit` (clean geometric weight, no all-caps shouting).
  - Telemetry & Data: `JetBrains Mono` / `tabular-nums` for coordinates (`X: 124.5 | Y: 68.0 | Z: -89.2`), ping, and frames per second.
  - Chat & Console: Monospace terminal font with color-coded Minecraft formatting codes.
- **Design Constitution Compliance**:
  - Zero-pill metadata discipline (unboxed text separators `·` and `/` for coordinates and statuses).
  - No fake AI scores or low-opacity watermark text.
  - Single-elevation depth with crisp hairline borders.
  - Responsive desktop 1440px layout with balanced two-column dashboard grid.

---

## 3. Key Product Decisions & Trade-Offs

### Dual-Engine Backend Architecture: Mineflayer + Interactive Sandbox Simulator
- **Approach**: The Express server hosts API endpoints and WebSockets for real-time telemetry. When connecting to an active external Minecraft server, it initializes a Mineflayer instance. In addition, when in sandbox mode or if an external server is unreachable, an interactive internal Minecraft environment simulator generates voxel snapshots, mob entities, and chat feedback so the entire UI and 3D viewport can be tested reliably in cloud sandboxes.
- **Why**: Many cloud preview environments restrict arbitrary outbound TCP socket connections to non-HTTP ports (like Minecraft 25565). A dual-mode architecture guarantees 100% testability and functionality in AI Studio while preserving the full real Mineflayer client code.

### ASCII Raymarched Voxel Viewport + HTML5 Canvas Radar
- **Approach**: Retain and enhance the original `interface.js` ASCII ray-caster algorithm directly onto high-DPI HTML5 Canvas with adjustable character resolution (72x25, 100x34, 140x48), camera sync, and pointer capture drag-to-look.
- **Why**: Extremely fast, nostalgic, requires no WebGL shader overhead, and works identically across low-power mobile devices and desktop browsers.

### State Synchronization via WebSocket & REST Endpoints
- **Approach**: Real-time event streams (`pose`, `snap`, `statusUpdate`, `minecraftChat`) flow over WebSocket (Socket.io / ws), while control actions (`/api/move`, `/api/chat`, `/api/macro`, `/api/start`, `/api/stop`) use straightforward REST endpoints with immediate client-side optimistic UI feedback.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        React Frontend Dashboard                        │
│                                                                        │
│  ┌─────────────────────────┐  ┌─────────────────────────────────────┐  │
│  │   Bot Control Panel     │  │        3D Viewport & Radar          │  │
│  │  - Server Connection    │  │  - Canvas ASCII Raymarched Voxel    │  │
│  │  - WASD + Jump Controls │  │  - 2D Circular Rotating Radar       │  │
│  │  - KingSMP Macros       │  │  - Camera Drag & Zoom Handlers      │  │
│  │  - Anti-AFK Random Walk │  │  - Entity Classification (P/M/m)    │  │
│  └─────────────────────────┘  └─────────────────────────────────────┘  │
│  ┌─────────────────────────┐  ┌─────────────────────────────────────┐  │
│  │   Vitals & Inventory    │  │      Minecraft Chat Console         │  │
│  │  - Health & Food Bars   │  │  - Color-coded chat log viewer      │  │
│  │  - Hotbar & 36-slot GUI │  │  - Command dispatch input           │  │
│  └─────────────────────────┘  └─────────────────────────────────────┘  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ WebSockets (pose, snap, chat, status)
                                    │ HTTP REST (/api/start, /api/move, ...)
┌───────────────────────────────────▼────────────────────────────────────┐
│                  Node.js / Express Full-Stack Server                   │
│                                                                        │
│  ┌─────────────────────────┐      ┌─────────────────────────────────┐  │
│  │    Mineflayer Engine    │      │    Interactive Bot Simulator    │  │
│  │  - Minecraft Protocol   │ <──> │  - Synthetic Voxel Generator    │  │
│  │  - Entity Tracker       │      │  - Mock Entities & Pathfinding  │  │
│  │  - World Block Snapshot │      │  - Simulated Chat & Telemetry   │  │
│  └─────────────────────────┘      └─────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Component & State Mapping

| View / Component | State Mutated | User Actions / Working Handlers |
| :--- | :--- | :--- |
| **ConnectionPanel** | `connectionConfig`, `connectionStatus` | Connect/Disconnect button, auth switcher (Offline / Microsoft), auto-login password |
| **ControlPad** | `botPose`, `isRandomMoving` | W, A, S, D, Space Jump buttons + Keyboard listener (`keydown`/`keyup`) |
| **MacroSystem** | `macroStatus`, `activeInventory` | Clock Menu opener, KingSMP Slot 24 click, `/tpaccept`, Anti-AFK wandering |
| **ViewportCanvas** | `camYaw`, `camPitch`, `fov`, `quality` | Mouse drag, touch drag, wheel zoom, "Follow Bot" toggle, "Sync Look" toggle |
| **RadarCanvas** | `radarScale`, `entities` | Filter entities (Players, Hostile Mobs, Passive Animals, Obstacles) |
| **ChatConsole** | `chatHistory`, `inputDraft` | Send chat message, slash commands (`/login`, `/spawn`), chat log autoscroll |
| **InventoryViewer** | `inventorySlots`, `selectedSlot` | Slot hover tooltips, item stack counts, active hand slot selection |
| **VitalsStrip** | `health`, `food`, `saturation`, `level` | Real-time hearts, hunger drumsticks, experience progress bar |

---

## 5. Implementation Roadmap (Post-Approval)

1. **Full-Stack Express & Server Engine**:
   - Establish Express server serving Vite frontend with unified API routes and WebSocket gateway.
   - Implement Mineflayer bot lifecycle controller (`connectBot`, `stopBot`, `sendAction`).
   - Implement synthetic terrain & bot simulator fallback for seamless instant preview.
2. **Interactive React HUD & Design Tokens**:
   - Build emerald/obsidian layout structure following the Universal Frontend Design Constitution.
   - Implement Canvas-based 3D ASCII voxel renderer and rotating 2D radar.
   - Build the real-time Minecraft chat console and inventory viewer.
   - Wire all keyboard event listeners (WASD, Space) and macro buttons.
3. **Verification & Testing**:
   - Validate full compilation via `compile_applet`.
   - Verify smooth 27+ FPS rendering, camera orbit controls, and macro responsiveness.
