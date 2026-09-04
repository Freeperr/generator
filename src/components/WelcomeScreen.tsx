"use client";

import { motion } from "framer-motion";
import { Language } from "@/lib/types";

interface WelcomeScreenProps {
  onSelect: (lang: Language) => void;
}

export default function WelcomeScreen({ onSelect }: WelcomeScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="flex h-full items-center justify-center bg-white"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex flex-col items-center gap-8 px-6 text-center"
      >
        <h1 className="text-4xl font-semibold tracking-tight text-[#111] sm:text-5xl">
          suchdirhilfe.de
        </h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-lg text-neutral-500"
        >
          Welche Sprache möchtest du verwenden?
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex gap-4"
        >
          <button
            onClick={() => onSelect("de")}
            className="rounded-xl border border-neutral-200 px-10 py-4 text-lg font-medium text-[#111] transition-all hover:border-neutral-900 hover:shadow-sm active:scale-[0.98]"
          >
            Deutsch
          </button>
          <button
            onClick={() => onSelect("en")}
            className="rounded-xl border border-neutral-200 px-10 py-4 text-lg font-medium text-[#111] transition-all hover:border-neutral-900 hover:shadow-sm active:scale-[0.98]"
          >
            English
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
