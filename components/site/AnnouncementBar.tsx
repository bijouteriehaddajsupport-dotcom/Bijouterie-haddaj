"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const MESSAGES = [
  "Paiement à la livraison",
  "Boutique à Derb Sultan · 10h30 – 19h30",
  "Commandez par téléphone : 06 71 88 22 74",
  "Livraison partout au Maroc",
];

export function AnnouncementBar() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setIndex((i) => (i + 1) % MESSAGES.length), 5000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="relative flex h-9 items-center justify-center overflow-hidden bg-bordeaux-950 px-4 text-white">
      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="truncate text-[12px] font-medium tracking-[0.04em]"
        >
          {MESSAGES[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
