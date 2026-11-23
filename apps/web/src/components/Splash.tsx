import { motion } from "framer-motion";
import { Moon } from "lucide-react";

export function Splash() {
  return (
    <motion.div
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4"
      style={{ background: "#0d0e13", color: "#e8eaf0" }}
      aria-label="Loading Shadow Self"
    >
      <motion.div
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        className="flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ background: "#e8eaf0", color: "#0d0e13" }}
      >
        <Moon size={26} aria-hidden="true" />
      </motion.div>
      <p className="text-xl font-semibold">Shadow Self</p>
      <div className="h-[3px] w-40 overflow-hidden rounded-full" style={{ background: "rgb(255 255 255 / 0.12)" }}>
        <motion.div
          className="h-full w-2/5 rounded-full"
          style={{ background: "#9e98ee" }}
          animate={{ x: ["-10%", "160%"] }}
          transition={{ duration: 1.1, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        />
      </div>
    </motion.div>
  );
}
