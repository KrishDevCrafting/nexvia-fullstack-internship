# ⚡ SyncFlow — Real-Time Collaborative Workspace (FS-02)

> **Nexvia Technologies Full-Stack Internship Deliverable**  
> **Project:** FS-02 — Real-Time Collaborative Workspace (Notion & Figma Style)  
> **Author:** Krish (KrishDevCrafting)  
> **Submission Deadline:** November 20, 2026  

---

## 🌟 Executive Overview
SyncFlow is a high-performance, real-time collaborative workspace bridging the gap between **Notion-style block-based document authoring** and **Figma-style visual canvas brainstorming**. Multiple distributed engineers can write specs, drag system sticky notes, and observe live multi-user cursors in real time with zero-latency synchronization.

---

## 🛠️ Tech Stack & Architecture

### Backend:
- **Runtime:** Node.js + Express.js (ES Modules)
- **Real-Time Engine:** Socket.io v4 with room partitioning (`doc:<docId>`)
- **Database:** MongoDB Atlas (Mongoose ODM)
- **Deployment Port:** `5001` (Isolated from LMS)

### Frontend:
- **Framework:** React 19 + Vite 6
- **Styling:** Tailwind CSS v4 + Plus Jakarta Sans + JetBrains Mono
- **Icons:** Lucide React
- **Client Networking:** Socket.io Client + Axios

---

## ⚡ Real-Time Protocol Specification

```
Client (Tab A) ──[cursor-move]──────────> Server (Socket.io) ──[cursor-update]────────> Client (Tab B)
Client (Tab A) ──[block-change]─────────> Server (Socket.io) ──[block-update]─────────> Client (Tab B)
Client (Tab A) ──[canvas-element-change]-> Server (Socket.io) ──[canvas-element-update]-> Client (Tab B)
Client (Tab A) ──[send-comment]─────────> Server (Socket.io) ──[new-comment]──────────> Client (Tab B)
```

| Event | Direction | Payload | Purpose |
|:--|:--|:--|:--|
| `join-document` | Client ➔ Server | `{ docId, user }` | Joins room, assigns socket to user identity |
| `presence-update` | Server ➔ Room | `Array<User>` | Real-time list of active collaborators |
| `cursor-move` | Client ➔ Server | `{ x, y }` | Throttled mouse position (30ms interval) |
| `cursor-update` | Server ➔ Room (except sender) | `{ socketId, user, x, y }` | Live animated cursor with distinctive color tag |
| `cursor-remove` | Server ➔ Room | `{ socketId }` | Removes pointer when collaborator leaves |
| `block-change` | Client ➔ Server | `{ id, content, checked, type }` | Real-time Notion block synchronizer |
| `canvas-element-change` | Client ➔ Server | `{ id, x, y, text, color }` | Real-time Figma sticky card movement & text sync |
| `document-meta-change` | Client ➔ Server | `{ title, mode }` | Real-time rename & view toggle broadcast |
| `send-comment` | Client ➔ Server | `{ text, docId }` | Document inline discussion thread |

---

## 🚀 Running Locally

### 1. Backend Server
```bash
cd "Real-Time Collaborative Workspace/server"
npm install
npm run dev
# Server runs on http://localhost:5001
```

### 2. Frontend Client
```bash
cd "Real-Time Collaborative Workspace/client"
npm install
npm run dev
# Vite runs on http://localhost:5174
```

---

## 🎨 Key Features Implemented:
1. **Multi-User Live Cursors (Figma Style):** Distinct user colors, avatars, and smooth coordinate interpolation.
2. **Active Presence Bar:** Collaborators stack with live status ring and name tooltips.
3. **Dual Working Modes:**
   - **Doc View:** Notion-style block editor (Headings, Paragraphs, To-Do checklists, Code blocks, Callouts, Dividers).
   - **Canvas Board:** Figma-style drag-and-drop sticky cards with custom color palettes.
4. **Auto-Save & Cloud Persistence:** Debounced MongoDB Atlas synchronization with real-time saving state indicators.
5. **Live Discussion Drawer:** Document-specific real-time comments thread.
