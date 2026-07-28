import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

const COLORS = ["#4f46e5", "#ec4899", "#10b981", "#f59e0b", "#3b82f6"];

export function Confetti() {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: -20,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * 10 + 5,
      rotation: Math.random() * 360,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: p.x, y: p.y, rotate: p.rotation, opacity: 1 }}
          animate={{
            y: window.innerHeight + 20,
            rotate: p.rotation + (Math.random() * 360 - 180),
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: Math.random() * 2 + 2,
            ease: "easeOut",
          }}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
          }}
        />
      ))}
    </div>
  );
}
