import React, { useState, useRef, useEffect } from "react";
import { Plus, Trash2, Move, StickyNote, Square, Palette } from "lucide-react";
import { socket } from "../utils/socket";

const STICKY_COLORS = [
  { name: "Yellow", bg: "#fef08a", text: "#713f12" },
  { name: "Green", bg: "#bbf7d0", text: "#14532d" },
  { name: "Blue", bg: "#bfdbfe", text: "#1e3a8a" },
  { name: "Pink", bg: "#fbcfe8", text: "#831843" },
  { name: "Purple", bg: "#e9d5ff", text: "#581c87" },
  { name: "Zinc", bg: "#27272a", text: "#f4f4f5" },
];

export default function CanvasBoard({ elements, onElementsChange, docId }) {
  const [draggingId, setDraggingId] = useState(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const boardRef = useRef(null);

  // Sync canvas updates from other socket clients
  useEffect(() => {
    const handleElementUpdate = (updatedElement) => {
      onElementsChange((prev) =>
        prev.map((el) => (el.id === updatedElement.id ? { ...el, ...updatedElement } : el)),
        false
      );
    };

    const handleElementsReplaced = (newElements) => {
      onElementsChange(newElements, false);
    };

    socket.on("canvas-element-update", handleElementUpdate);
    socket.on("canvas-elements-replaced", handleElementsReplaced);

    return () => {
      socket.off("canvas-element-update", handleElementUpdate);
      socket.off("canvas-elements-replaced", handleElementsReplaced);
    };
  }, [onElementsChange]);

  // Start dragging an element
  const handleMouseDown = (e, el) => {
    if (e.target.tagName.toLowerCase() === "textarea" || e.target.tagName.toLowerCase() === "button") {
      return;
    }
    setDraggingId(el.id);
    dragOffsetRef.current = {
      x: e.clientX - el.x,
      y: e.clientY - el.y,
    };
  };

  // Handle drag move
  const handleMouseMove = (e) => {
    if (!draggingId) return;

    const newX = Math.max(10, e.clientX - dragOffsetRef.current.x);
    const newY = Math.max(10, e.clientY - dragOffsetRef.current.y);

    const updated = elements.map((el) =>
      el.id === draggingId ? { ...el, x: newX, y: newY } : el
    );

    onElementsChange(updated, true);
    socket.emit("canvas-element-change", { id: draggingId, x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setDraggingId(null);
  };

  const addElement = (type = "sticky", color = "#fef08a") => {
    const newEl = {
      id: `elem-${Date.now()}`,
      type,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      width: 220,
      height: 150,
      text: type === "sticky" ? "New sticky idea..." : "System Component",
      color,
    };

    const updated = [...elements, newEl];
    onElementsChange(updated, true);
    socket.emit("canvas-elements-replace", updated);
  };

  const updateText = (id, text) => {
    const updated = elements.map((el) => (el.id === id ? { ...el, text } : el));
    onElementsChange(updated, true);
    socket.emit("canvas-element-change", { id, text });
  };

  const updateColor = (id, color) => {
    const updated = elements.map((el) => (el.id === id ? { ...el, color } : el));
    onElementsChange(updated, true);
    socket.emit("canvas-element-change", { id, color });
  };

  const deleteElement = (id) => {
    const updated = elements.filter((el) => el.id !== id);
    onElementsChange(updated, true);
    socket.emit("canvas-elements-replace", updated);
  };

  return (
    <div
      ref={boardRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="relative w-full h-[calc(100vh-3.5rem)] overflow-auto bg-[#0a0a0d] select-none"
      style={{
        backgroundImage: `radial-gradient(circle, #27272a 1px, transparent 1px)`,
        backgroundSize: "28px 28px",
      }}
    >
      {/* Floating Figma-Style Toolbar */}
      <div className="absolute top-4 left-6 z-30 flex items-center gap-2 bg-[#16161a]/95 backdrop-blur-md border border-zinc-800 p-1.5 rounded-2xl shadow-2xl">
        <button
          onClick={() => addElement("sticky", "#fef08a")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 text-xs font-semibold transition border border-amber-400/30"
        >
          <StickyNote className="w-4 h-4" />
          <span>Sticky Note</span>
        </button>

        <button
          onClick={() => addElement("card", "#bfdbfe")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-xs font-semibold transition border border-blue-500/30"
        >
          <Square className="w-4 h-4" />
          <span>Card</span>
        </button>

        <div className="w-[1px] h-5 bg-zinc-800 mx-1"></div>

        <span className="text-[11px] text-zinc-500 font-mono px-2">
          {elements.length} elements
        </span>
      </div>

      {/* Render Canvas Elements */}
      {elements.map((el) => {
        const isDark = el.color === "#27272a";
        const textColor = isDark ? "#f4f4f5" : "#18181b";

        return (
          <div
            key={el.id}
            onMouseDown={(e) => handleMouseDown(e, el)}
            style={{
              transform: `translate3d(${el.x}px, ${el.y}px, 0)`,
              backgroundColor: el.color,
              width: `${el.width}px`,
              minHeight: `${el.height}px`,
              cursor: draggingId === el.id ? "grabbing" : "grab",
              boxShadow:
                draggingId === el.id
                  ? "0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 2px rgba(99, 102, 241, 0.8)"
                  : "0 10px 25px -5px rgba(0, 0, 0, 0.4)",
            }}
            className="absolute left-0 top-0 rounded-2xl p-3 flex flex-col justify-between transition-shadow will-change-transform z-10"
          >
            {/* Header: Drag Grip & Delete */}
            <div className="flex items-center justify-between pb-1 text-black/40">
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider opacity-70">
                <Move className="w-3 h-3" />
                <span>{el.type}</span>
              </span>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteElement(el.id);
                }}
                className="p-1 rounded hover:bg-black/10 text-black/50 hover:text-rose-700 transition"
                title="Delete note"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>

            {/* Note Content Textarea */}
            <textarea
              value={el.text}
              onChange={(e) => updateText(el.id, e.target.value)}
              placeholder="Write idea here..."
              style={{ color: textColor }}
              className="w-full flex-1 resize-none bg-transparent font-medium text-xs leading-relaxed focus:outline-none placeholder-black/40"
              rows={4}
            />

            {/* Footer: Color Picker Dots */}
            <div className="pt-2 flex items-center justify-between border-t border-black/10">
              <div className="flex items-center gap-1.5">
                {STICKY_COLORS.map((c) => (
                  <button
                    key={c.bg}
                    onClick={(e) => {
                      e.stopPropagation();
                      updateColor(el.id, c.bg);
                    }}
                    style={{ backgroundColor: c.bg }}
                    className={`w-3.5 h-3.5 rounded-full border border-black/20 hover:scale-125 transition ${
                      el.color === c.bg ? "ring-2 ring-indigo-600 scale-110" : ""
                    }`}
                    title={c.name}
                  />
                ))}
              </div>

              <span className="text-[10px] opacity-40 font-mono">Live</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

