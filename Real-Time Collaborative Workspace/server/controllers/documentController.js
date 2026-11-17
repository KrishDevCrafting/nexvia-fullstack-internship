import Document from "../models/Document.js";

// GET /api/documents - Get all documents
export const getAllDocuments = async (req, res) => {
  try {
    let docs = await Document.find()
      .select("title icon mode updatedAt createdAt lastModifiedBy")
      .sort({ updatedAt: -1 });

    // Seed default document if collection is empty
    if (docs.length === 0) {
      const defaultDoc = await Document.create({
        title: "Sprint Architecture & Design Spec",
        icon: "🚀",
        mode: "document",
        lastModifiedBy: "Krish",
      });
      docs = [defaultDoc];
    }

    res.status(200).json({ success: true, count: docs.length, data: docs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/documents/:id - Get single document by ID
export const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;
    let doc = await Document.findById(id);

    if (!doc) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    res.status(200).json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/documents - Create new document
export const createDocument = async (req, res) => {
  try {
    const { title, icon, mode, template } = req.body;

    let initialBlocks = undefined;
    let initialCanvas = undefined;

    if (template === "blank") {
      initialBlocks = [
        { id: `b-${Date.now()}-1`, type: "h1", content: "Untitled" },
        { id: `b-${Date.now()}-2`, type: "paragraph", content: "" },
      ];
      initialCanvas = [];
    }

    const newDoc = await Document.create({
      title: title || "Untitled Document",
      icon: icon || (mode === "canvas" ? "🎨" : "📄"),
      mode: mode || "document",
      blocks: initialBlocks,
      canvasElements: initialCanvas,
      lastModifiedBy: req.body.author || "Krish",
    });

    res.status(201).json({ success: true, data: newDoc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/documents/:id - Update document (content / title / elements)
export const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, icon, mode, blocks, canvasElements, lastModifiedBy } = req.body;

    const updated = await Document.findByIdAndUpdate(
      id,
      {
        $set: {
          ...(title !== undefined && { title }),
          ...(icon !== undefined && { icon }),
          ...(mode !== undefined && { mode }),
          ...(blocks !== undefined && { blocks }),
          ...(canvasElements !== undefined && { canvasElements }),
          ...(lastModifiedBy !== undefined && { lastModifiedBy }),
        },
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/documents/:id - Delete document
export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Document.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    res.status(200).json({ success: true, message: "Document deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
