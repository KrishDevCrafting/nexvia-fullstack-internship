import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import prisma from "./config/prisma.js";
import documentRoutes from "./routes/documentRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const server = http.createServer(app);

// CORS setup
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);

app.use(express.json());

// Routes
app.use("/api/documents", documentRoutes);

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: "ok",
      database: "PostgreSQL (Prisma Connected)",
      service: "SyncFlow Real-Time Workspace Server",
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// In-memory active presence tracker: roomId -> Map(socketId -> userInfo)
const roomUsers = new Map();

io.on("connection", (socket) => {
  console.log(`⚡ Client connected: ${socket.id}`);

  let currentRoom = null;
  let currentUser = null;

  // 1. Join Document Room
  socket.on("join-document", ({ docId, user }) => {
    currentRoom = `doc:${docId}`;
    currentUser = {
      socketId: socket.id,
      name: user?.name || `Collaborator-${socket.id.slice(-4)}`,
      color: user?.color || "#6366f1",
      avatar: user?.avatar || "⚡",
    };

    socket.join(currentRoom);

    if (!roomUsers.has(currentRoom)) {
      roomUsers.set(currentRoom, new Map());
    }
    roomUsers.get(currentRoom).set(socket.id, currentUser);

    const activeList = Array.from(roomUsers.get(currentRoom).values());
    io.to(currentRoom).emit("presence-update", activeList);
    console.log(`👤 ${currentUser.name} joined room ${currentRoom} (Active: ${activeList.length})`);
  });

  // 2. Real-Time Multi-User Live Cursor (Figma style)
  socket.on("cursor-move", (coords) => {
    if (!currentRoom) return;
    socket.to(currentRoom).emit("cursor-update", {
      socketId: socket.id,
      user: currentUser,
      x: coords.x,
      y: coords.y,
    });
  });

  // 3. Real-Time Block Edit Sync (Notion style)
  socket.on("block-change", (payload) => {
    if (!currentRoom) return;
    socket.to(currentRoom).emit("block-update", payload);
  });

  // 4. Real-Time Blocks Reorder / Add / Delete
  socket.on("blocks-replace", (payload) => {
    if (!currentRoom) return;
    socket.to(currentRoom).emit("blocks-replaced", payload);
  });

  // 5. Canvas Element Sync (Figma Sticky/Card drag or text edit)
  socket.on("canvas-element-change", (payload) => {
    if (!currentRoom) return;
    socket.to(currentRoom).emit("canvas-element-update", payload);
  });

  // 6. Canvas Elements Bulk Replace
  socket.on("canvas-elements-replace", (payload) => {
    if (!currentRoom) return;
    socket.to(currentRoom).emit("canvas-elements-replaced", payload);
  });

  // 7. Document Title / Meta Sync
  socket.on("document-meta-change", (payload) => {
    if (!currentRoom) return;
    socket.to(currentRoom).emit("document-meta-update", payload);
  });

  // 8. Document Live Comments (Persisted to PostgreSQL Comment table)
  socket.on("send-comment", async (comment) => {
    if (!currentRoom) return;
    try {
      const savedComment = await prisma.comment.create({
        data: {
          documentId: comment.docId,
          author: currentUser?.name || "Anonymous",
          color: currentUser?.color || "#6366f1",
          text: comment.text,
        },
      });
      io.to(currentRoom).emit("new-comment", savedComment);
    } catch (err) {
      console.error("Failed to save comment:", err);
      // Fallback in-memory broadcast
      io.to(currentRoom).emit("new-comment", {
        id: `c-${Date.now()}`,
        author: currentUser?.name || "Anonymous",
        color: currentUser?.color || "#6366f1",
        text: comment.text,
        createdAt: new Date().toISOString(),
      });
    }
  });

  // 9. Disconnect cleanup
  socket.on("disconnect", () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
    if (currentRoom && roomUsers.has(currentRoom)) {
      roomUsers.get(currentRoom).delete(socket.id);
      const remaining = Array.from(roomUsers.get(currentRoom).values());
      io.to(currentRoom).emit("presence-update", remaining);
      io.to(currentRoom).emit("cursor-remove", { socketId: socket.id });

      if (remaining.length === 0) {
        roomUsers.delete(currentRoom);
      }
    }
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`🚀 SyncFlow Collab Server running on port ${PORT} [Database: PostgreSQL (Prisma)]`);
});
