import React, { useState, useRef, useEffect } from "react";
import {
  Plus,
  GripVertical,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  CheckSquare,
  Code2,
  AlertCircle,
  Minus,
  Trash2,
  Sparkles,
} from "lucide-react";
import { socket } from "../utils/socket";

const BLOCK_TYPES = [
  { type: "paragraph", label: "Text", icon: AlignLeft, desc: "Plain body text" },
  { type: "h1", label: "Heading 1", icon: Heading1, desc: "Large section title" },
  { type: "h2", label: "Heading 2", icon: Heading2, desc: "Medium section header" },
  { type: "h3", label: "Heading 3", icon: Heading3, desc: "Small sub-heading" },
  { type: "todo", label: "To-Do List", icon: CheckSquare, desc: "Track tasks with a checkbox" },
  { type: "code", label: "Code Block", icon: Code2, desc: "Capture syntax highlighted code" },
  { type: "callout", label: "Callout", icon: AlertCircle, desc: "Highlight important context" },
  { type: "divider", label: "Divider", icon: Minus, desc: "Visually separate sections" },
];

export default function DocumentEditor({ blocks, onBlocksChange, docId }) {
  const [activeMenuBlockId, setActiveMenuBlockId] = useState(null);
  const blockRefs = useRef({});

  // Sync incoming block updates from other socket clients
  useEffect(() => {
    const handleBlockUpdate = (updatedBlock) => {
      onBlocksChange((prevBlocks) =>
        prevBlocks.map((b) => (b.id === updatedBlock.id ? { ...b, ...updatedBlock } : b)),
        false // do NOT emit again to prevent feedback loop
      );
    };

    const handleBlocksReplaced = (newBlocks) => {
      onBlocksChange(newBlocks, false);
    };

    socket.on("block-update", handleBlockUpdate);
    socket.on("blocks-replaced", handleBlocksReplaced);

    return () => {
      socket.off("block-update", handleBlockUpdate);
      socket.off("blocks-replaced", handleBlocksReplaced);
    };
  }, [onBlocksChange]);

  const updateBlockContent = (id, newContent) => {
    const updated = blocks.map((b) => (b.id === id ? { ...b, content: newContent } : b));
    onBlocksChange(updated, true);
    socket.emit("block-change", { id, content: newContent });
  };

  const updateBlockType = (id, newType) => {
    const updated = blocks.map((b) => (b.id === id ? { ...b, type: newType } : b));
    onBlocksChange(updated, true);
    socket.emit("block-change", { id, type: newType });
    setActiveMenuBlockId(null);
  };

  const toggleTodo = (id) => {
    const target = blocks.find((b) => b.id === id);
    if (!target) return;
    const newChecked = !target.checked;
    const updated = blocks.map((b) => (b.id === id ? { ...b, checked: newChecked } : b));
    onBlocksChange(updated, true);
    socket.emit("block-change", { id, checked: newChecked });
  };

  const addBlockBelow = (index, type = "paragraph") => {
    const newBlock = {
      id: `b-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type,
      content: "",
      checked: false,
    };
    const updated = [...blocks];
    updated.splice(index + 1, 0, newBlock);
    onBlocksChange(updated, true);
    socket.emit("blocks-replace", updated);

    setTimeout(() => {
      blockRefs.current[newBlock.id]?.focus();
    }, 50);
  };

  const deleteBlock = (index) => {
    if (blocks.length <= 1) return; // Keep at least one block
    const targetId = blocks[index].id;
    const prevBlock = blocks[index - 1];
    const updated = blocks.filter((_, i) => i !== index);

    onBlocksChange(updated, true);
    socket.emit("blocks-replace", updated);

    if (prevBlock) {
      setTimeout(() => {
        blockRefs.current[prevBlock.id]?.focus();
      }, 50);
    }
  };

  const handleKeyDown = (e, index, block) => {
    // Press Enter -> Create new block below
    if (e.key === "Enter" && !e.shiftKey && block.type !== "code") {
      e.preventDefault();
      addBlockBelow(index);
    }

    // Press Backspace on empty block -> Delete or turn to paragraph
    if (e.key === "Backspace" && block.content === "") {
      if (block.type !== "paragraph") {
        e.preventDefault();
        updateBlockType(block.id, "paragraph");
      } else if (blocks.length > 1) {
        e.preventDefault();
        deleteBlock(index);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 sm:px-12 relative min-h-[calc(100vh-3.5rem)]">
      {/* Editor Surface */}
      <div className="space-y-2">
        {blocks.map((block, index) => {
          const isMenuOpen = activeMenuBlockId === block.id;

          return (
            <div
              key={block.id}
              className="group relative flex items-start gap-1 py-1 -ml-12 pl-12 rounded-lg hover:bg-zinc-900/30 transition"
            >
              {/* Left Floating Handle: Type & Add buttons (hover) */}
              <div className="absolute left-1 top-2.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition select-none">
                <button
                  onClick={() => addBlockBelow(index)}
                  className="p-1 rounded text-zinc-500 hover:text-white hover:bg-zinc-800 transition"
                  title="Add block below"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>

                <div className="relative">
                  <button
                    onClick={() => setActiveMenuBlockId(isMenuOpen ? null : block.id)}
                    className="p-1 rounded text-zinc-500 hover:text-white hover:bg-zinc-800 transition cursor-grab"
                    title="Change block type"
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                  </button>

                  {/* Block Type Converter Popup */}
                  {isMenuOpen && (
                    <div className="absolute left-0 top-7 w-56 bg-[#16161a] border border-zinc-700/80 rounded-xl shadow-2xl p-1.5 z-50 space-y-0.5">
                      <div className="px-2 py-1 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                        Turn into
                      </div>
                      {BLOCK_TYPES.map((bt) => {
                        const Icon = bt.icon;
                        return (
                          <button
                            key={bt.type}
                            onClick={() => updateBlockType(block.id, bt.type)}
                            className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
                          >
                            <Icon className="w-4 h-4 text-zinc-400 shrink-0" />
                            <div className="text-left">
                              <span className="block font-medium">{bt.label}</span>
                              <span className="block text-[10px] text-zinc-500">{bt.desc}</span>
                            </div>
                          </button>
                        );
                      })}

                      <div className="border-t border-zinc-800 my-1"></div>

                      <button
                        onClick={() => deleteBlock(index)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-950/40 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete block</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Block Content Renderers */}
              <div className="flex-1 min-w-0">
                {/* H1 Heading */}
                {block.type === "h1" && (
                  <textarea
                    ref={(el) => (blockRefs.current[block.id] = el)}
                    value={block.content}
                    onChange={(e) => updateBlockContent(block.id, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, index, block)}
                    placeholder="Heading 1"
                    rows={1}
                    className="w-full resize-none bg-transparent text-3xl font-extrabold text-white placeholder-zinc-700 focus:outline-none tracking-tight leading-tight"
                  />
                )}

                {/* H2 Heading */}
                {block.type === "h2" && (
                  <textarea
                    ref={(el) => (blockRefs.current[block.id] = el)}
                    value={block.content}
                    onChange={(e) => updateBlockContent(block.id, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, index, block)}
                    placeholder="Heading 2"
                    rows={1}
                    className="w-full resize-none bg-transparent text-2xl font-bold text-zinc-100 placeholder-zinc-700 focus:outline-none tracking-tight mt-3 mb-1"
                  />
                )}

                {/* H3 Heading */}
                {block.type === "h3" && (
                  <textarea
                    ref={(el) => (blockRefs.current[block.id] = el)}
                    value={block.content}
                    onChange={(e) => updateBlockContent(block.id, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, index, block)}
                    placeholder="Heading 3"
                    rows={1}
                    className="w-full resize-none bg-transparent text-xl font-semibold text-zinc-200 placeholder-zinc-700 focus:outline-none mt-2 mb-1"
                  />
                )}

                {/* Standard Paragraph */}
                {block.type === "paragraph" && (
                  <textarea
                    ref={(el) => (blockRefs.current[block.id] = el)}
                    value={block.content}
                    onChange={(e) => updateBlockContent(block.id, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, index, block)}
                    placeholder="Type '/' for commands or start writing..."
                    rows={1}
                    className="w-full resize-none bg-transparent text-sm leading-relaxed text-zinc-300 placeholder-zinc-600 focus:outline-none"
                  />
                )}

                {/* To-Do Checklist */}
                {block.type === "todo" && (
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={block.checked || false}
                      onChange={() => toggleTodo(block.id)}
                      className="mt-1 w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                    <textarea
                      ref={(el) => (blockRefs.current[block.id] = el)}
                      value={block.content}
                      onChange={(e) => updateBlockContent(block.id, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, index, block)}
                      placeholder="To-do item"
                      rows={1}
                      className={`w-full resize-none bg-transparent text-sm leading-relaxed focus:outline-none transition ${
                        block.checked
                          ? "line-through text-zinc-500"
                          : "text-zinc-200 placeholder-zinc-600"
                      }`}
                    />
                  </div>
                )}

                {/* Code Block */}
                {block.type === "code" && (
                  <div className="rounded-xl border border-zinc-800 bg-[#0d0d10] p-3 font-mono text-xs shadow-inner">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800/80 text-zinc-500 text-[11px] select-none">
                      <span className="flex items-center gap-1.5">
                        <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                        <span>JavaScript / TypeScript</span>
                      </span>
                      <span className="text-[10px]">Real-time code</span>
                    </div>
                    <textarea
                      ref={(el) => (blockRefs.current[block.id] = el)}
                      value={block.content}
                      onChange={(e) => updateBlockContent(block.id, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, index, block)}
                      placeholder="// Write code here..."
                      rows={4}
                      className="w-full resize-none bg-transparent font-mono text-xs text-indigo-200 placeholder-zinc-600 focus:outline-none leading-relaxed"
                    />
                  </div>
                )}

                {/* Callout Card */}
                {block.type === "callout" && (
                  <div className="flex items-start gap-3 rounded-xl border border-indigo-900/40 bg-indigo-950/20 p-3 text-sm text-indigo-200">
                    <span className="text-lg shrink-0 select-none">💡</span>
                    <textarea
                      ref={(el) => (blockRefs.current[block.id] = el)}
                      value={block.content}
                      onChange={(e) => updateBlockContent(block.id, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, index, block)}
                      placeholder="Callout note or key takeaway..."
                      rows={2}
                      className="w-full resize-none bg-transparent text-sm text-indigo-200 placeholder-indigo-400/50 focus:outline-none leading-relaxed"
                    />
                  </div>
                )}

                {/* Divider Line */}
                {block.type === "divider" && (
                  <div className="py-3">
                    <div className="h-[1px] bg-zinc-800 w-full" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Quick-Add Bar */}
      <div className="mt-8 pt-4 border-t border-zinc-900/60 flex items-center justify-between text-xs text-zinc-500">
        <button
          onClick={() => addBlockBelow(blocks.length - 1)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition border border-zinc-800"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Block</span>
        </button>

        <span className="text-[11px] text-zinc-600">
          Pro-tip: Press <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400 font-mono">Enter</kbd> to add blocks
        </span>
      </div>
    </div>
  );
}
