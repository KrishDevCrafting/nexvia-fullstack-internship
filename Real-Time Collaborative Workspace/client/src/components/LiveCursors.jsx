import React, { useEffect, useState, useRef } from "react";
import { socket } from "../utils/socket";

export default function LiveCursors({ containerRef }) {
  const [cursors, setCursors] = useState({});
  const lastEmitRef = useRef(0);

  useEffect(() => {
    // Listen for cursor updates from other collaborators
    const handleCursorUpdate = (data) => {
      setCursors((prev) => ({
        ...prev,
        [data.socketId]: {
          x: data.x,
          y: data.y,
          user: data.user,
          updatedAt: Date.now(),
        },
      }));
    };

    // Remove cursor when collaborator disconnects or leaves
    const handleCursorRemove = ({ socketId }) => {
      setCursors((prev) => {
        const next = { ...prev };
        delete next[socketId];
        return next;
      });
    };

    socket.on("cursor-update", handleCursorUpdate);
    socket.on("cursor-remove", handleCursorRemove);

    // Prune stale cursors every 3 seconds (if user stopped moving for > 10s)
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setCursors((prev) => {
        const next = {};
        let changed = false;
        Object.entries(prev).forEach(([id, cursor]) => {
          if (now - cursor.updatedAt < 8000) {
            next[id] = cursor;
          } else {
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 3000);

    return () => {
      socket.off("cursor-update", handleCursorUpdate);
      socket.off("cursor-remove", handleCursorRemove);
      clearInterval(cleanupInterval);
    };
  }, []);

  // Track local user mouse movement inside container
  const handleMouseMove = (e) => {
    const now = Date.now();
    // Throttle emits to every 30ms (~33 fps)
    if (now - lastEmitRef.current < 30) return;
    lastEmitRef.current = now;

    if (!containerRef?.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    socket.emit("cursor-move", { x, y });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="pointer-events-none absolute inset-0 z-40 overflow-hidden"
    >
      {Object.entries(cursors).map(([socketId, cursor]) => {
        const color = cursor.user?.color || "#6366f1";
        const name = cursor.user?.name || "Collaborator";

        return (
          <div
            key={socketId}
            style={{
              transform: `translate3d(${cursor.x}px, ${cursor.y}px, 0)`,
              transition: "transform 0.08s cubic-bezier(0.2, 0, 0.2, 1)",
            }}
            className="absolute left-0 top-0 will-change-transform"
          >
            {/* Figma-style colored cursor pointer */}
            <svg
              className="w-5 h-5 drop-shadow-md"
              viewBox="0 0 24 24"
              fill={color}
              stroke="white"
              strokeWidth="1.5"
            >
              <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.86a.5.5 0 0 0-.85.35z" />
            </svg>

            {/* User name tag pill */}
            <div
              style={{ backgroundColor: color }}
              className="ml-3 mt-1 flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold text-white shadow-lg whitespace-nowrap select-none"
            >
              <span>{cursor.user?.avatar || "⚡"}</span>
              <span>{name}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
