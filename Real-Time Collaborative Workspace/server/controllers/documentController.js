import prisma from "../config/prisma.js";

// GET /api/documents - Get all documents
export const getAllDocuments = async (req, res) => {
  try {
    let docs = await prisma.document.findMany({
      select: {
        id: true,
        title: true,
        icon: true,
        mode: true,
        updatedAt: true,
        createdAt: true,
        lastModifiedBy: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Seed default document if collection is empty
    if (docs.length === 0) {
      const defaultDoc = await prisma.document.create({
        data: {
          title: "Sprint Architecture & Design Spec",
          icon: "🚀",
          mode: "document",
          lastModifiedBy: "Krish",
          blocks: [
            {
              id: "b-intro-1",
              type: "h1",
              content: "Welcome to SyncFlow Collaborative Workspace",
            },
            {
              id: "b-intro-2",
              type: "paragraph",
              content:
                "This document is synced in real-time with PostgreSQL JSONB and Socket.io. Open this link in another tab to see live cursors, presence avatars, and instant text editing!",
            },
            {
              id: "b-intro-3",
              type: "callout",
              content:
                "💡 Pro Tip: Powered by PostgreSQL & Prisma for high-performance conflict-free document syncing!",
            },
            {
              id: "b-intro-4",
              type: "h2",
              content: "Sprint Objectives",
            },
            {
              id: "b-intro-5",
              type: "todo",
              content: "Scaffold Real-Time Collaborative Workspace",
              checked: true,
            },
            {
              id: "b-intro-6",
              type: "todo",
              content: "Migrate to PostgreSQL & Prisma (Nexvia Spec)",
              checked: true,
            },
            {
              id: "b-intro-7",
              type: "todo",
              content: "Test multi-client real-time synchronization",
              checked: false,
            },
          ],
          canvasElements: [
            {
              id: "elem-1",
              type: "sticky",
              x: 100,
              y: 120,
              width: 220,
              height: 150,
              text: "🐘 PostgreSQL + Prisma\n- Structured JSONB\n- Fast relational queries",
              color: "#fef08a",
            },
            {
              id: "elem-2",
              type: "sticky",
              x: 360,
              y: 120,
              width: 220,
              height: 150,
              text: "🎨 Figma Live Cursors\n- X, Y position sync\n- Smooth interpolation",
              color: "#bbf7d0",
            },
            {
              id: "elem-3",
              type: "sticky",
              x: 620,
              y: 120,
              width: 220,
              height: 150,
              text: "🚀 Nexvia Submission\n- 20 Nov 2026\n- 100% production ready",
              color: "#bfdbfe",
            },
          ],
        },
      });
      docs = [defaultDoc];
    }

    // Normalizing `id` and `_id` so frontend handles both seamlessly
    const normalized = docs.map((d) => ({ ...d, _id: d.id }));
    res.status(200).json({ success: true, count: normalized.length, data: normalized });
  } catch (error) {
    console.error("getAllDocuments error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/documents/:id - Get single document by ID
export const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await prisma.document.findUnique({
      where: { id },
      include: {
        comments: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!doc) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    const normalized = { ...doc, _id: doc.id };
    res.status(200).json({ success: true, data: normalized });
  } catch (error) {
    console.error("getDocumentById error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/documents - Create new document
export const createDocument = async (req, res) => {
  try {
    const { title, icon, mode, template, author } = req.body;

    let initialBlocks = [];
    let initialCanvas = [];

    if (template === "blank") {
      initialBlocks = [
        { id: `b-${Date.now()}-1`, type: "h1", content: title || "Untitled" },
        { id: `b-${Date.now()}-2`, type: "paragraph", content: "" },
      ];
      initialCanvas = [];
    } else if (template === "spec") {
      initialBlocks = [
        { id: `b-${Date.now()}-1`, type: "h1", content: "Architecture & System Spec" },
        { id: `b-${Date.now()}-2`, type: "callout", content: "System architecture and data pipeline specification." },
        { id: `b-${Date.now()}-3`, type: "h2", content: "1. Components & Tech Stack" },
        { id: `b-${Date.now()}-4`, type: "paragraph", content: "Frontend: React 19, Tailwind CSS. Backend: Node.js, Express, Socket.io. Database: PostgreSQL 18 with Prisma." },
        { id: `b-${Date.now()}-5`, type: "h2", content: "2. Database Schema" },
        { id: `b-${Date.now()}-6`, type: "code", content: "model Document {\n  id String @id @default(uuid())\n  title String\n  blocks Json\n}" },
      ];
    }

    const newDoc = await prisma.document.create({
      data: {
        title: title || "Untitled Document",
        icon: icon || (mode === "canvas" ? "🎨" : "📄"),
        mode: mode || "document",
        blocks: initialBlocks,
        canvasElements: initialCanvas,
        lastModifiedBy: author || "Krish",
      },
    });

    const normalized = { ...newDoc, _id: newDoc.id };
    res.status(201).json({ success: true, data: normalized });
  } catch (error) {
    console.error("createDocument error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/documents/:id - Update document
export const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, icon, mode, blocks, canvasElements, lastModifiedBy } = req.body;

    const updated = await prisma.document.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(icon !== undefined && { icon }),
        ...(mode !== undefined && { mode }),
        ...(blocks !== undefined && { blocks }),
        ...(canvasElements !== undefined && { canvasElements }),
        ...(lastModifiedBy !== undefined && { lastModifiedBy }),
      },
    });

    const normalized = { ...updated, _id: updated.id };
    res.status(200).json({ success: true, data: normalized });
  } catch (error) {
    console.error("updateDocument error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/documents/:id - Delete document
export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.document.delete({
      where: { id },
    });

    res.status(200).json({ success: true, message: "Document deleted successfully" });
  } catch (error) {
    console.error("deleteDocument error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
