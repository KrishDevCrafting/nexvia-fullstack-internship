import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import DocumentEditor from "../components/DocumentEditor";
import CanvasBoard from "../components/CanvasBoard";
import LiveCursors from "../components/LiveCursors";
import CommentsDrawer from "../components/CommentsDrawer";
import API from "../utils/api";
import { socket } from "../utils/socket";
import { useUser } from "../context/UserContext";

export default function Workspace() {
  const { docId: urlDocId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useUser();

  const [documents, setDocuments] = useState([]);
  const [currentDoc, setCurrentDoc] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentsCount, setCommentsCount] = useState(0);

  const stageContainerRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  // 1. Fetch initial documents list
  const fetchDocuments = useCallback(async () => {
    try {
      const res = await API.get("/documents");
      if (res.data.success) {
        setDocuments(res.data.data);
        return res.data.data;
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
    }
    return [];
  }, []);

  // 2. Fetch specific document details
  const loadDocument = useCallback(async (id) => {
    try {
      setIsLoading(true);
      const res = await API.get(`/documents/${id}`);
      if (res.data.success) {
        setCurrentDoc(res.data.data);
      }
    } catch (err) {
      console.error("Error loading document:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    (async () => {
      const docs = await fetchDocuments();
      if (docs.length > 0) {
        const targetId = urlDocId || docs[0]._id;
        loadDocument(targetId);
        if (!urlDocId) {
          navigate(`/doc/${targetId}`, { replace: true });
        }
      }
    })();
  }, [fetchDocuments, loadDocument, urlDocId, navigate]);

  // 3. Socket.io Room & Presence management
  useEffect(() => {
    if (!currentDoc?._id) return;

    if (!socket.connected) {
      socket.connect();
    }

    // Join room with current user credentials
    socket.emit("join-document", {
      docId: currentDoc._id,
      user: currentUser,
    });

    const handlePresenceUpdate = (users) => {
      setActiveUsers(users);
    };

    const handleMetaUpdate = (payload) => {
      setCurrentDoc((prev) => (prev ? { ...prev, ...payload } : prev));
      if (payload.title) {
        setDocuments((prev) =>
          prev.map((d) => (d._id === currentDoc._id ? { ...d, title: payload.title } : d))
        );
      }
    };

    socket.on("presence-update", handlePresenceUpdate);
    socket.on("document-meta-update", handleMetaUpdate);

    return () => {
      socket.off("presence-update", handlePresenceUpdate);
      socket.off("document-meta-update", handleMetaUpdate);
    };
  }, [currentDoc?._id, currentUser]);

  // 4. Debounced Auto-Save to MongoDB
  const queueAutoSave = useCallback(
    (updatedFields) => {
      if (!currentDoc?._id) return;
      setIsSaving(true);

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await API.put(`/documents/${currentDoc._id}`, {
            ...updatedFields,
            lastModifiedBy: currentUser.name,
          });
          setIsSaving(false);
        } catch (err) {
          console.error("Failed to auto-save document:", err);
          setIsSaving(false);
        }
      }, 700);
    },
    [currentDoc?._id, currentUser.name]
  );

  // Document Title Change
  const handleTitleChange = (newTitle) => {
    if (!currentDoc) return;
    setCurrentDoc((prev) => ({ ...prev, title: newTitle }));
    setDocuments((prev) =>
      prev.map((d) => (d._id === currentDoc._id ? { ...d, title: newTitle } : d))
    );

    socket.emit("document-meta-change", { title: newTitle });
    queueAutoSave({ title: newTitle });
  };

  // View Mode Change (Doc vs Canvas)
  const handleModeChange = (newMode) => {
    if (!currentDoc) return;
    setCurrentDoc((prev) => ({ ...prev, mode: newMode }));
    socket.emit("document-meta-change", { mode: newMode });
    queueAutoSave({ mode: newMode });
  };

  // Blocks Change (Notion editor)
  const handleBlocksChange = (newBlocks, shouldSave = true) => {
    setCurrentDoc((prev) => ({ ...prev, blocks: newBlocks }));
    if (shouldSave) {
      queueAutoSave({ blocks: newBlocks });
    }
  };

  // Canvas Elements Change (Figma board)
  const handleElementsChange = (newElements, shouldSave = true) => {
    setCurrentDoc((prev) => ({ ...prev, canvasElements: newElements }));
    if (shouldSave) {
      queueAutoSave({ canvasElements: newElements });
    }
  };

  // Document Selection
  const handleSelectDoc = (id) => {
    if (id === currentDoc?._id) return;
    navigate(`/doc/${id}`);
    loadDocument(id);
  };

  // Create New Document
  const handleCreateDoc = async (title, icon, mode, template) => {
    try {
      const res = await API.post("/documents", {
        title,
        icon,
        mode,
        template,
        author: currentUser.name,
      });
      if (res.data.success) {
        const created = res.data.data;
        setDocuments((prev) => [created, ...prev]);
        navigate(`/doc/${created._id}`);
        setCurrentDoc(created);
      }
    } catch (err) {
      console.error("Error creating document:", err);
    }
  };

  // Delete Document
  const handleDeleteDoc = async (id) => {
    try {
      await API.delete(`/documents/${id}`);
      const remaining = documents.filter((d) => d._id !== id);
      setDocuments(remaining);
      if (remaining.length > 0) {
        handleSelectDoc(remaining[0]._id);
      }
    } catch (err) {
      console.error("Error deleting document:", err);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#09090b] text-[#f4f4f5]">
      {/* Left Sidebar */}
      <Sidebar
        documents={documents}
        currentDocId={currentDoc?._id}
        onSelectDoc={handleSelectDoc}
        onCreateDoc={handleCreateDoc}
        onDeleteDoc={handleDeleteDoc}
      />

      {/* Main Workspace Stage */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Navbar
          documentData={currentDoc}
          onTitleChange={handleTitleChange}
          onModeChange={handleModeChange}
          activeUsers={activeUsers}
          isSaving={isSaving}
          onToggleComments={() => setIsCommentsOpen(!isCommentsOpen)}
          commentsCount={commentsCount}
        />

        {/* Interactive Collaboration Surface with Live Cursors */}
        <main
          ref={stageContainerRef}
          className="flex-1 relative overflow-y-auto bg-[#09090b]"
        >
          {/* Live Cursors Overlay */}
          <LiveCursors containerRef={stageContainerRef} />

          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
              <p className="text-xs text-zinc-500 font-medium">Connecting to live workspace...</p>
            </div>
          ) : currentDoc?.mode === "canvas" ? (
            <CanvasBoard
              elements={currentDoc.canvasElements || []}
              onElementsChange={handleElementsChange}
              docId={currentDoc._id}
            />
          ) : (
            <DocumentEditor
              blocks={currentDoc?.blocks || []}
              onBlocksChange={handleBlocksChange}
              docId={currentDoc?._id}
            />
          )}
        </main>

        {/* Live Discussion Drawer */}
        <CommentsDrawer
          isOpen={isCommentsOpen}
          onClose={() => setIsCommentsOpen(false)}
          docId={currentDoc?._id}
          onCommentsCountChange={setCommentsCount}
        />
      </div>
    </div>
  );
}
