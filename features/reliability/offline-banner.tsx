"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Wifi } from "lucide-react";

function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    // Initialise from navigator on mount (safe — only in browser)
    setOnline(navigator.onLine);

    const on  = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online",  on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online",  on);
      window.removeEventListener("offline", off);
    };
  }, []);

  return online;
}

export function OfflineBanner() {
  const online = useOnlineStatus();
  const [showRestored, setShowRestored] = useState(false);
  const [wasOffline, setWasOffline]     = useState(false);

  useEffect(() => {
    if (!online) {
      setWasOffline(true);
    } else if (wasOffline) {
      setShowRestored(true);
      const t = setTimeout(() => setShowRestored(false), 3000);
      return () => clearTimeout(t);
    }
  }, [online, wasOffline]);

  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          key="offline"
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 bg-[--color-danger] px-4 py-2"
          role="alert"
          aria-live="assertive"
        >
          <WifiOff className="h-3.5 w-3.5 text-white" />
          <span className="text-[12px] font-medium text-white">
            You&apos;re offline — changes will be saved when you reconnect
          </span>
        </motion.div>
      )}
      {online && showRestored && (
        <motion.div
          key="restored"
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 bg-[--color-success] px-4 py-2"
          role="status"
          aria-live="polite"
        >
          <Wifi className="h-3.5 w-3.5 text-white" />
          <span className="text-[12px] font-medium text-white">Connection restored</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
