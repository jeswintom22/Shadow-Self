import type { Config } from "tailwindcss";

const token = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        page: token("--bg"),
        card: token("--card"),
        ink: token("--ink"),
        soft: token("--soft"),
        muted: token("--muted"),
        line: token("--line"),
        "line-soft": token("--line-soft"),
        "line-strong": token("--line-strong"),
        subtle: token("--subtle"),
        accent: token("--accent"),
        "accent-hover": token("--accent-hover"),
        "accent-soft": token("--accent-soft"),
        coral: token("--coral"),
        green: token("--green"),
        "green-soft": token("--green-soft"),
        "warn-soft": token("--warn-soft"),
        "warn-line": token("--warn-line"),
        "warn-ink": token("--warn-ink"),
        shadowPurple: token("--accent"),
        shadowCoral: token("--coral"),
        shadowGreen: token("--green")
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
} satisfies Config;
