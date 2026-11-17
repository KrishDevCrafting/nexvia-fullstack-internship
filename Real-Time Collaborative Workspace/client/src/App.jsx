import React from "react";
import { Routes, Route } from "react-router-dom";
import Workspace from "./pages/Workspace";
import { UserProvider } from "./context/UserContext";

export default function App() {
  return (
    <UserProvider>
      <Routes>
        <Route path="/" element={<Workspace />} />
        <Route path="/doc/:docId" element={<Workspace />} />
      </Routes>
    </UserProvider>
  );
}
