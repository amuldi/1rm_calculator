import React from "react";
import { motion } from "framer-motion";
import { Dumbbell } from "lucide-react";

export default function SplashScreen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-8"
      style={{ background: "var(--bg)" }}
    >
      <motion.div
        initial={{ scale: 0.7, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
        className="flex flex-col items-center gap-5"
      >
        {/* Icon */}
        <motion.div
          animate={{ boxShadow: ["0 0 12px rgba(0,200,255,0.3)", "0 0 32px rgba(0,200,255,0.6)", "0 0 12px rgba(0,200,255,0.3)"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{
            background: "var(--accent-faint)",
            border: "1px solid var(--accent-border)",
          }}
        >
          <Dumbbell size={36} style={{ color: "var(--accent)" }} />
        </motion.div>

        {/* Text */}
        <div className="text-center space-y-1.5">
          <h1 className="text-3xl font-black tracking-tight" style={{ color: "var(--text-1)" }}>
            1RM 계산기
          </h1>
          <p
            className="text-xs font-semibold tracking-widest uppercase"
            style={{ color: "var(--accent)", opacity: 0.7 }}
          >
            운동 기록 & 분석
          </p>
        </div>
      </motion.div>

      {/* Loading dots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="flex gap-1.5"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.2, 1] }}
            transition={{ duration: 1.2, delay: i * 0.18, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--accent)" }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}
