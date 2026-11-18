import React, { useState } from "react";
import {
  FileText,
  Plus,
  Trash2,
  Search,
  Sparkles,
  Layout,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
} from "lucide-react";

export default function Sidebar({
  documents,
  currentDocId,
  onSelectDoc,
  onCreateDoc,
  onDeleteDoc,
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);

  const filteredDocs = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <aside
      className={`border-r border-zinc-800 bg-[#0c0c0e] flex flex-col transition-all duration-300 z-20 ${
        isCollapsed ? "w-14" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="h-14 px-3 flex items-center justify-between border-b border-zinc-800">
        {!isCollapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-bold text-white shadow-md text-sm shrink-0">
              ⚡
            </div>
            <div className="truncate">
              <span className="text-sm font-bold tracking-tight text-white block">SyncFlow</span>
              <span className="text-[10px] text-zinc-500 block -mt-0.5">Real-Time Workspace</span>
            </div>
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition mx-auto"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Workspace Body */}
      {!isCollapsed && (
        <div className="p-3 flex flex-col flex-1 overflow-hidden">
          {/* Action: New Document & Template Button */}
          <div className="relative mb-3">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="w-full flex items-center justify-between px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <span className="flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                <span>New Page</span>
              </span>
              <Sparkles className="w-3.5 h-3.5 opacity-80" />
            </button>

            {/* Template Dropdown */}
            {showTemplates && (
              <div className="absolute top-11 left-0 right-0 bg-[#16161a] border border-zinc-700/80 rounded-xl p-1.5 shadow-2xl z-40 space-y-1">
                <button
                  onClick={() => {
                    onCreateDoc("Untitled Document", "📄", "document", "blank");
                    setShowTemplates(false);
                  }}
                  className="w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-zinc-200 hover:bg-zinc-800/80 transition"
                >
                  <span>📄</span>
                  <span>Blank Document</span>
                </button>
                <button
                  onClick={() => {
                    onCreateDoc("Sprint Architecture Spec", "🚀", "document", "spec");
                    setShowTemplates(false);
                  }}
                  className="w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-zinc-200 hover:bg-zinc-800/80 transition"
                >
                  <span>🚀</span>
                  <span>Architecture Spec</span>
                </button>
                <button
                  onClick={() => {
                    onCreateDoc("Figma Brainstorm Canvas", "🎨", "canvas", "blank");
                    setShowTemplates(false);
                  }}
                  className="w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-zinc-200 hover:bg-zinc-800/80 transition"
                >
                  <span>🎨</span>
                  <span>Visual Canvas Board</span>
                </button>
              </div>
            )}
          </div>

          {/* Search Box */}
          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search pages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
            />
          </div>

          {/* Document Section Heading */}
          <div className="flex items-center justify-between px-1 mb-1.5">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
              Documents ({filteredDocs.length})
            </span>
          </div>

          {/* Document List */}
          <div className="flex-1 overflow-y-auto space-y-0.5 pr-1">
            {filteredDocs.map((doc) => {
              const isActive = doc._id === currentDocId;
              return (
                <div
                  key={doc._id}
                  onClick={() => onSelectDoc(doc._id)}
                  className={`group relative flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer text-xs transition ${
                    isActive
                      ? "bg-zinc-800/90 text-white font-medium border border-zinc-700/60"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm shrink-0">{doc.icon || (doc.mode === "canvas" ? "🎨" : "📄")}</span>
                    <span className="truncate">{doc.title}</span>
                  </div>

                  {/* Delete button (hover) */}
                  {documents.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete "${doc.title}"?`)) {
                          onDeleteDoc(doc._id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-950/60 text-zinc-500 hover:text-rose-400 transition"
                      title="Delete page"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}

            {filteredDocs.length === 0 && (
              <p className="text-center text-[11px] text-zinc-600 py-4">No documents match search</p>
            )}
          </div>
        </div>
      )}

      {/* Collapsed View Action Icons */}
      {isCollapsed && (
        <div className="p-2 space-y-2 flex flex-col items-center">
          <button
            onClick={() => onCreateDoc("Untitled Document", "📄", "document", "blank")}
            className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition shadow-md"
            title="Create page"
          >
            <Plus className="w-5 h-5" />
          </button>

          <div className="w-8 h-[1px] bg-zinc-800 my-1"></div>

          {documents.map((doc) => (
            <button
              key={doc._id}
              onClick={() => onSelectDoc(doc._id)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-base transition ${
                doc._id === currentDocId ? "bg-zinc-800 border border-zinc-700" : "hover:bg-zinc-900"
              }`}
              title={doc.title}
            >
              {doc.icon || "📄"}
            </button>
          ))}
        </div>
      )}

      {/* Footer Info */}
      {!isCollapsed && (
        <div className="p-3 border-t border-zinc-800 text-[11px] text-zinc-500 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Nexvia FS-02
          </span>
          <span className="text-[10px] text-zinc-600">v1.0.0</span>
        </div>
      )}
    </aside>
  );
}

