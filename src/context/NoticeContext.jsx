import React, { createContext, useContext, useEffect, useState } from "react";

const NoticeContext = createContext(null);

export function NoticeProvider({ children }) {
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (!notice) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setNotice(null);
    }, 4000);

    return () => window.clearTimeout(timeout);
  }, [notice]);

  const value = {
    notice,
    showNotice(message, tone = "success") {
      setNotice({ message, tone });
    },
    clearNotice() {
      setNotice(null);
    },
  };

  return <NoticeContext.Provider value={value}>{children}</NoticeContext.Provider>;
}

export function useNotice() {
  const context = useContext(NoticeContext);

  if (!context) {
    throw new Error("useNotice must be used within a NoticeProvider.");
  }

  return context;
}
