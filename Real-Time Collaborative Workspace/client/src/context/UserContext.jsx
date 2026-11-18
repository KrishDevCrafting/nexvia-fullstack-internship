import React, { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext();

const PALETTE = [
  { name: "Indigo", hex: "#6366f1" },
  { name: "Emerald", hex: "#10b981" },
  { name: "Fuchsia", hex: "#d946ef" },
  { name: "Amber", hex: "#f59e0b" },
  { name: "Sky", hex: "#0ea5e9" },
  { name: "Rose", hex: "#f43f5e" },
  { name: "Violet", hex: "#8b5cf6" },
];

export function UserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("syncflow_user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    const randomColor = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    const randomId = Math.floor(100 + Math.random() * 900);
    return {
      name: `User-${randomId}`,
      color: randomColor.hex,
      avatar: "👤",
    };
  });

  useEffect(() => {
    localStorage.setItem("syncflow_user", JSON.stringify(currentUser));
  }, [currentUser]);

  const updateUser = (updates) => {
    setCurrentUser((prev) => ({ ...prev, ...updates }));
  };

  return (
    <UserContext.Provider value={{ currentUser, updateUser, PALETTE }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);

