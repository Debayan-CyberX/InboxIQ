import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface LandingLoaderProps {
  onComplete?: () => void;
  minDuration?: number; // Minimum display time in ms (default: 2000)
}

/**
 * InboxIQLoader - Brand-specific loading animation
 * 
 * Animation Concept: "Signal Ring Scanning"
 * - Central inbox core pulses gently (intelligence at work)
 * - Scanning rings expand outward like radar, detecting email signals
 * - Subtle email particles light up as signals are detected
 * - Motion implies: "Analyzing inbox → detecting signals → preparing insights"
 * 
 * Visual Identity:
 * - Dark background (#0D0F14) with glassmorphism
 * - Violet (#7C3AED) and cyan (#22D3EE) accents used sparingly
 * - Calm, confident, intelligent motion
 * - No text, no progress bars - pure intentional motion
 */
const LandingLoader = ({ onComplete, minDuration = 2000 }: LandingLoaderProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const checkComplete = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minDuration - elapsed);
      
      setTimeout(() => {
        setIsVisible(false);
        // Delay onComplete to allow exit animation
        setTimeout(() => {
          onComplete?.();
        }, 600);
      }, remaining);
    };

    // Check if page is already loaded
    if (document.readyState === "complete") {
      checkComplete();
    } else {
      window.addEventListener("load", checkComplete);
      // Fallback: ensure loader dismisses even if load event doesn't fire
      setTimeout(checkComplete, minDuration + 500);
    }

    return () => {
      window.removeEventListener("load", checkComplete);
    };
  }, [onComplete, minDuration, startTime]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
          style={{ 
            pointerEvents: isVisible ? "auto" : "none",
            backgroundColor: "#0D0F14"
          }}
        >
          {/* Frosted glass overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
            }}
          />

          {/* Central scanning core */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{
              duration: 0.8,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative z-10"
          >
            {/* Scanning rings - expanding outward like radar */}
            {[0, 1, 2].map((ringIndex) => (
              <motion.div
                key={ringIndex}
                className="absolute inset-0 flex items-center justify-center"
              style={{
                width: "min(300px, 80vw)",
                height: "min(300px, 80vw)",
                margin: "min(-150px, -40vw)",
              }}
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{
                  scale: [0.3, 1.2, 1.2],
                  opacity: [0, 0.4, 0],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  delay: ringIndex * 0.8,
                  ease: [0.4, 0, 0.2, 1],
                  times: [0, 0.4, 1],
                }}
              >
                <svg
                  width="300"
                  height="300"
                  viewBox="0 0 300 300"
                  className="absolute inset-0"
                >
                  <motion.circle
                    cx="150"
                    cy="150"
                    r="140"
                    fill="none"
                    stroke={ringIndex % 2 === 0 ? "#7C3AED" : "#22D3EE"}
                    strokeWidth="1.5"
                    strokeOpacity={0.6}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{
                      duration: 0.8,
                      ease: "easeOut",
                      delay: ringIndex * 0.8,
                    }}
                  />
                </svg>
              </motion.div>
            ))}

            {/* Central inbox core - gentle intelligence pulse */}
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.9, 1, 0.9],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative"
              style={{
                width: "min(60px, 16vw)",
                height: "min(60px, 16vw)",
              }}
            >
              {/* Outer intelligence glow */}
              <motion.div
                animate={{
                  scale: [1, 1.4, 1],
                  opacity: [0.2, 0.4, 0.2],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 rounded-full"
                style={{
                  background: "radial-gradient(circle, rgba(124, 58, 237, 0.4) 0%, rgba(34, 211, 238, 0.2) 50%, transparent 100%)",
                  filter: "blur(16px)",
                }}
              />
              
              {/* Inner core - inbox intelligence */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: "radial-gradient(circle at 35% 35%, rgba(124, 58, 237, 0.9) 0%, rgba(34, 211, 238, 0.7) 50%, rgba(124, 58, 237, 0.5) 100%)",
                  boxShadow: "0 0 24px rgba(124, 58, 237, 0.4), inset 0 0 12px rgba(255, 255, 255, 0.08)",
                }}
              />
            </motion.div>

            {/* Email signal particles - light up as detected */}
            {[...Array(12)].map((_, i) => {
              const angle = (i * 360) / 12;
              const radius = 120;
              const x = Math.cos((angle * Math.PI) / 180) * radius;
              const y = Math.sin((angle * Math.PI) / 180) * radius;

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 0.7, 0.3, 0],
                    scale: [0, 1, 0.8, 0],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    delay: (i * 0.2) + 0.5,
                    ease: [0.4, 0, 0.2, 1],
                    times: [0, 0.3, 0.6, 1],
                  }}
                  className="absolute top-1/2 left-1/2"
                  style={{
                    width: "3px",
                    height: "3px",
                    marginLeft: "-1.5px",
                    marginTop: "-1.5px",
                    x: x,
                    y: y,
                    background: i % 3 === 0 ? "#7C3AED" : i % 3 === 1 ? "#22D3EE" : "#7C3AED",
                    borderRadius: "50%",
                    boxShadow: `0 0 8px ${i % 3 === 0 ? "rgba(124, 58, 237, 0.8)" : "rgba(34, 211, 238, 0.8)"}`,
                  }}
                />
              );
            })}
          </motion.div>

          {/* Subtle ambient depth */}
          <motion.div
            animate={{
              scale: [1, 1.02, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0"
            style={{ pointerEvents: "none" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LandingLoader;
