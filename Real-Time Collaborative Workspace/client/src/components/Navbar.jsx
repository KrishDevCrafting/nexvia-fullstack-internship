import React, { useState, useEffect } from "react";
import {
  FileText,
  Layout,
  Share2,
  Check,
  Circle,
  MessageSquare,
  Sparkles,
  Users,
  Copy,
  ChevronDown,
} from "lucide-react";
import { useUser } from "../context/UserContext";

export default function Navbar({
  documentData,
  onTitleChange,
  onModeChange,
  activeUsers,
  isSaving,
  onToggleComments,
  commentsCount,
}) {
  const { currentUser, updateUser, PALETTE } = useUser();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(documentData?.title || "Untitled Document");
  const [copied, setCopied] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [tempName, setTempName] = useState(currentUser.name);

  useEffect(() => {
    if (documentData?.title) {
      setTitleInput(documentData.title);
    }
  }, [documentData?.title]);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim() && titleInput !== documentData.title) {
      onTitleChange(titleInput.trim());
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveUserIdentity = () => {
    if (tempName.trim()) {
      updateUser({ name: tempName.trim() });
    }
    setShowUserModal(false);
  };

  return (
    <header className="h-14 border-b border-zinc-800 bg-[#0d0d10] px-4 flex items-center justify-between z-30 select-none">
      {/* Left: Document Info & Mode Toggle */}
      <div className="flex items-center gap-3">
        {/* Document Icon & Title */}
        <div className="flex items-center gap-2">
          <span className="text-xl">{documentData?.icon || "📄"}</span>
          {isEditingTitle ? (
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => e.key === "Enter" && handleTitleSubmit()}
              autoFocus
              className="bg-zinc-900 text-white font-semibold px-2 py-0.5 rounded border border-indigo-500 focus:outline-none text-sm w-64"
            />
          ) : (
            <button
              onClick={() => setIsEditingTitle(true)}
              className="group flex items-center gap-1.5 text-sm font-semibold text-zinc-100 hover:text-white px-2 py-1 rounded hover:bg-zinc-800/60 transition"
              title="Click to rename"
            >
              <span>{documentData?.title || "Untitled Document"}</span>
              <span className="text-[10px] text-zinc-500 opacity-0 group-hover:opacity-100 transition">
                ✏️
              </span>
            </button>
          )}
        </div>

        {/* View Switcher: Document vs Canvas */}
        <div className="hidden sm:flex items-center bg-zinc-900/90 p-0.5 rounded-lg border border-zinc-800 ml-2">
          <button
            onClick={() => onModeChange("document")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition ${
              documentData?.mode === "document"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Doc View</span>
          </button>
          <button
            onClick={() => onModeChange("canvas")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition ${
              documentData?.mode === "canvas"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            <span>Figma Canvas</span>
          </button>
        </div>
      </div>

      {/* Center: Save Indicator */}
      <div className="hidden md:flex items-center gap-1.5 text-xs text-zinc-400">
        {isSaving ? (
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            Syncing...
          </span>
        ) : (
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <Check className="w-3.5 h-3.5" />
            Saved to cloud
          </span>
        )}
      </div>

      {/* Right: Presence Bar, Comments, Share, and User Avatar */}
      <div className="flex items-center gap-3">
        {/* Active Collaborators Presence Stack */}
        <div className="flex items-center -space-x-2 mr-1">
          {activeUsers.slice(0, 4).map((u, i) => (
            <div
              key={u.socketId || i}
              title={`${u.name} (Live now)`}
              style={{ borderColor: "#0d0d10" }}
              className="relative w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold text-white shadow-md transition hover:scale-110 hover:z-20 cursor-default"
            >
              <div
                style={{ backgroundColor: u.color }}
                className="w-full h-full rounded-full flex items-center justify-center"
              >
                {u.name?.charAt(0).toUpperCase()}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0d0d10]"></span>
            </div>
          ))}

          {activeUsers.length > 4 && (
            <div className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-[#0d0d10] flex items-center justify-center text-[10px] font-bold text-zinc-300">
              +{activeUsers.length - 4}
            </div>
          )}
        </div>

        {/* Live Discussion / Comments Toggle */}
        <button
          onClick={onToggleComments}
          className="relative p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          title="Document discussion"
        >
          <MessageSquare className="w-4 h-4" />
          {commentsCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-indigo-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white">
              {commentsCount}
            </span>
          )}
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-100 transition border border-zinc-700"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>Share</span>
            </>
          )}
        </button>

        {/* User Identity Chip */}
        <button
          onClick={() => {
            setTempName(currentUser.name);
            setShowUserModal(true);
          }}
          style={{ borderColor: currentUser.color }}
          className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full bg-zinc-900 border text-xs font-medium text-white hover:brightness-110 transition"
          title="Change your collaborator name/color"
        >
          <span
            style={{ backgroundColor: currentUser.color }}
            className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold"
          >
            {currentUser.name?.charAt(0).toUpperCase()}
          </span>
          <span className="max-w-[80px] truncate">{currentUser.name}</span>
          <ChevronDown className="w-3 h-3 text-zinc-400" />
        </button>
      </div>

      {/* Identity Configuration Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-[#121215] border border-zinc-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Collaborator Identity</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Your name and color will be visible to other collaborators on live cursors and presence avatars.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 block mb-1.5">Your Name</label>
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Krish (Lead Dev)"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1.5">Cursor &amp; Avatar Color</label>
                <div className="flex items-center gap-2">
                  {PALETTE.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => updateUser({ color: c.hex })}
                      style={{ backgroundColor: c.hex }}
                      className={`w-7 h-7 rounded-full transition transform hover:scale-110 ${
                        currentUser.color === c.hex ? "ring-2 ring-white ring-offset-2 ring-offset-[#121215]" : ""
                      }`}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={() => setShowUserModal(false)}
                className="px-3.5 py-1.5 text-xs text-zinc-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={saveUserIdentity}
                className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition"
              >
                Save Identity
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
