/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./index.html"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        accent: "#00C8FF",
        sky: {
          neon: "#00C8FF",
          glow: "rgba(0,200,255,0.35)",
          dim:  "rgba(0,200,255,0.15)",
          faint:"rgba(0,200,255,0.08)",
        },
        navy: {
          950: "#0d0f0e",
          900: "#141715",
          850: "#191d1b",
          800: "#202622",
          700: "#2a332d",
        },
      },
      fontFamily: {
        sans: ["Pretendard", "DM Sans", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in":  "fadeIn 0.4s ease-out forwards",
        "slide-up": "slideUp 0.45s cubic-bezier(0.22,1,0.36,1) forwards",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn:    { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp:   { from: { opacity: "0", transform: "translateY(16px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        glowPulse: { "0%,100%": { boxShadow: "0 0 12px rgba(0,200,255,0.2)" }, "50%": { boxShadow: "0 0 28px rgba(0,200,255,0.45)" } },
      },
    },
  },
  plugins: [],
};
