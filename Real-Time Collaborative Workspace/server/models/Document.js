import mongoose from "mongoose";

const BlockSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ["h1", "h2", "h3", "paragraph", "todo", "code", "callout", "divider"],
      default: "paragraph",
    },
    content: { type: String, default: "" },
    checked: { type: Boolean, default: false },
    language: { type: String, default: "javascript" },
  },
  { _id: false }
);

const CanvasElementSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ["sticky", "card", "rect", "circle"],
      default: "sticky",
    },
    x: { type: Number, default: 100 },
    y: { type: Number, default: 100 },
    width: { type: Number, default: 200 },
    height: { type: Number, default: 140 },
    text: { type: String, default: "Double click to edit note" },
    color: { type: String, default: "#fef08a" },
  },
  { _id: false }
);

const DocumentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      default: "Untitled Document",
    },
    icon: {
      type: String,
      default: "📄",
    },
    mode: {
      type: String,
      enum: ["document", "canvas"],
      default: "document",
    },
    blocks: {
      type: [BlockSchema],
      default: [
        {
          id: "b-intro-1",
          type: "h1",
          content: "Welcome to SyncFlow Collaborative Workspace",
        },
        {
          id: "b-intro-2",
          type: "paragraph",
          content:
            "This document is synced in real-time. Open this link in another tab or send it to a friend to see live cursors, presence avatars, and instant text editing!",
        },
        {
          id: "b-intro-3",
          type: "callout",
          content:
            "💡 Pro Tip: Switch between Document Mode (Notion-style blocks) and Canvas Mode (Figma-style sticky boards) from the top bar!",
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
          content: "Implement multi-user live cursors with distinct user colors",
          checked: false,
        },
        {
          id: "b-intro-7",
          type: "todo",
          content: "Test multi-client real-time synchronization",
          checked: false,
        },
      ],
    },
    canvasElements: {
      type: [CanvasElementSchema],
      default: [
        {
          id: "elem-1",
          type: "sticky",
          x: 100,
          y: 120,
          width: 220,
          height: 150,
          text: "🧠 Architecture Brainstorming\n- Socket.io broadcast\n- Distributed state",
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
    lastModifiedBy: {
      type: String,
      default: "Krish",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Document", DocumentSchema);
