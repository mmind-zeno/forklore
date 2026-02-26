"use client";

import { motion } from "framer-motion";

const VERSION = "0.5.0";

export function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="mt-auto border-t border-stone-200/60 bg-white/40 backdrop-blur-sm"
    >
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
          <a
            href="https://mmind.ai/impressum"
            target="_blank"
            rel="noopener noreferrer"
            className="text-stone-500 hover:text-coral-500 transition-colors font-medium"
          >
            Impressum
          </a>
          <a
            href="https://mmind.ai/datenschutz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-stone-500 hover:text-coral-500 transition-colors font-medium"
          >
            Datenschutz
          </a>
          <a
            href="https://mmind.ai/disclaimer"
            target="_blank"
            rel="noopener noreferrer"
            className="text-stone-500 hover:text-coral-500 transition-colors font-medium"
          >
            Disclaimer
          </a>
        </div>
        <p className="mt-4 text-center text-xs text-stone-400">
          Forklore v{VERSION} · Powered by{" "}
          <a
            href="https://mmind.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-coral-500 hover:text-coral-600 font-medium transition-colors"
          >
            mmind.ai
          </a>
        </p>
      </div>
    </motion.footer>
  );
}
