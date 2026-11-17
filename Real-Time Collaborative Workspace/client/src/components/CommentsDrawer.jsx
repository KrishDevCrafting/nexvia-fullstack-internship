import React, { useState, useEffect, useRef } from "react";
import { X, Send, MessageSquare, Clock } from "lucide-react";
import { socket } from "../utils/socket";
import { useUser } from "../context/UserContext";

export default function CommentsDrawer({ isOpen, onClose, docId, onCommentsCountChange }) {
  const { currentUser } = useUser();
  const [comments, setComments] = useState([
    {
      id: "c-initial",
      author: "System",
      color: "#6366f1",
      text: "Welcome to document live discussion! All comments here sync in real-time across collaborators.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    onCommentsCountChange(comments.length);
  }, [comments, onCommentsCountChange]);

  useEffect(() => {
    const handleNewComment = (comment) => {
      setComments((prev) => [...prev, comment]);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    };

    socket.on("new-comment", handleNewComment);
    return () => socket.off("new-comment", handleNewComment);
  }, []);

  const handleSend = (e) => {
    e?.preventDefault();
    if (!input.trim()) return;

    socket.emit("send-comment", {
      text: input.trim(),
      docId,
    });
    setInput("");
  };

  if (!isOpen) return null;

  return (
    <aside className="fixed right-0 top-14 bottom-0 w-80 bg-[#121215] border-l border-zinc-800 shadow-2xl z-40 flex flex-col">
      {/* Header */}
      <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Live Discussion</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {comments.map((c) => (
          <div key={c.id} className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-xs">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <span
                  style={{ backgroundColor: c.color }}
                  className="w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
                >
                  {c.author?.charAt(0).toUpperCase()}
                </span>
                <span className="font-semibold text-zinc-200">{c.author}</span>
              </div>
              <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                {typeof c.timestamp === "string" && c.timestamp.includes("T")
                  ? new Date(c.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : c.timestamp}
              </span>
            </div>
            <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">{c.text}</p>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-zinc-800 bg-[#0d0d10] flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Comment as ${currentUser.name}...`}
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </aside>
  );
}
