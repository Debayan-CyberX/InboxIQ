import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface LandingLoaderProps {
  onComplete?: () => void;
  minDuration?: number; // Minimum display time in ms (default: 2000)
}

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
        }, 800);
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
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
          style={{ pointerEvents: isVisible ? "auto" : "none" }}
        >
          {/* Dark premium background with depth */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 bg-gradient-to-br from-[#0F0A1A] via-[#1A0F2E] to-[#0F0A1A]"
          />

          {/* Animated gradient orbs for depth */}
          <motion.div
            className="absolute inset-0 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            {/* Violet orb */}
            <motion.div
              className="absolute rounded-full blur-3xl"
              style={{
                width: "600px",
                height: "600px",
                background: "radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)",
                left: "20%",
                top: "30%",
              }}
              animate={{
                x: [0, 100, 0],
                y: [0, -80, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            {/* Cyan orb */}
            <motion.div
              className="absolute rounded-full blur-3xl"
              style={{
                width: "500px",
                height: "500px",
                background: "radial-gradient(circle, rgba(34, 211, 238, 0.3) 0%, transparent 70%)",
                right: "25%",
                bottom: "25%",
              }}
              animate={{
                x: [0, -80, 0],
                y: [0, 100, 0],
                scale: [1, 1.15, 1],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.div>

          {/* Frosted glass overlay */}
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
            style={{
              background: "rgba(15, 10, 26, 0.7)",
              WebkitBackdropFilter: "blur(20px)",
            }}
          />

          {/* Central animated core */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.1, opacity: 0 }}
            transition={{
              duration: 1.2,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="relative z-10"
          >
            {/* Outer rotating ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute inset-0"
              style={{
                width: "200px",
                height: "200px",
                margin: "-100px",
              }}
            >
              <svg
                width="200"
                height="200"
                viewBox="0 0 200 200"
                className="absolute inset-0"
              >
                <motion.circle
                  cx="100"
                  cy="100"
                  r="95"
                  fill="none"
                  stroke="url(#ringGradient)"
                  strokeWidth="2"
                  strokeDasharray="8 4"
                  opacity={0.6}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
                <defs>
                  <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#22D3EE" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.8" />
                  </linearGradient>
                </defs>
              </svg>
            </motion.div>

            {/* Middle rotating ring (counter-rotation) */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute inset-0"
              style={{
                width: "150px",
                height: "150px",
                margin: "-75px",
              }}
            >
              <svg
                width="150"
                height="150"
                viewBox="0 0 150 150"
                className="absolute inset-0"
              >
                <motion.circle
                  cx="75"
                  cy="75"
                  r="70"
                  fill="none"
                  stroke="url(#ringGradient2)"
                  strokeWidth="1.5"
                  strokeDasharray="6 3"
                  opacity={0.5}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                />
                <defs>
                  <linearGradient id="ringGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.7" />
                    <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.7" />
                  </linearGradient>
                </defs>
              </svg>
            </motion.div>

            {/* Central pulsing orb */}
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative"
              style={{
                width: "80px",
                height: "80px",
              }}
            >
              {/* Outer glow */}
              <motion.div
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 rounded-full"
                style={{
                  background: "radial-gradient(circle, rgba(139, 92, 246, 0.6) 0%, rgba(34, 211, 238, 0.4) 50%, transparent 100%)",
                  filter: "blur(20px)",
                }}
              />
              
              {/* Inner core */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: "radial-gradient(circle at 30% 30%, rgba(139, 92, 246, 1) 0%, rgba(34, 211, 238, 0.8) 50%, rgba(139, 92, 246, 0.6) 100%)",
                  boxShadow: "0 0 40px rgba(139, 92, 246, 0.6), 0 0 80px rgba(34, 211, 238, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.1)",
                }}
              />
            </motion.div>

            {/* Energy particles / lines */}
            {[...Array(8)].map((_, i) => {
              const angle = (i * 360) / 8;
              const radius = 100;
              const x = Math.cos((angle * Math.PI) / 180) * radius;
              const y = Math.sin((angle * Math.PI) / 180) * radius;

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 0.6, 0],
                    scale: [0.5, 1, 0.5],
                    x: [0, x * 0.5, x],
                    y: [0, y * 0.5, y],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: "easeInOut",
                  }}
                  className="absolute top-1/2 left-1/2"
                  style={{
                    width: "4px",
                    height: "4px",
                    marginLeft: "-2px",
                    marginTop: "-2px",
                    background: i % 2 === 0 ? "rgba(139, 92, 246, 0.8)" : "rgba(34, 211, 238, 0.8)",
                    borderRadius: "50%",
                    boxShadow: `0 0 10px ${i % 2 === 0 ? "rgba(139, 92, 246, 0.8)" : "rgba(34, 211, 238, 0.8)"}`,
                  }}
                />
              );
            })}
          </motion.div>

          {/* Subtle camera movement effect (parallax) */}
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              y: [0, -10, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0"
            style={{ pointerEvents: "none" }}
          />

          {/* Loading text (optional, minimal) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
              duration: 0.8,
              delay: 0.5,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="absolute bottom-[25%] z-10"
          >
            <motion.p
              className="text-sm font-medium tracking-wider"
              style={{
                color: "rgba(139, 92, 246, 0.8)",
                textShadow: "0 0 20px rgba(139, 92, 246, 0.5)",
              }}
            >
              INITIALIZING
            </motion.p>
            <motion.div
              className="mt-2 h-0.5 w-32 mx-auto overflow-hidden rounded-full"
              style={{
                background: "rgba(139, 92, 246, 0.2)",
              }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: "linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.8), rgba(34, 211, 238, 0.8), transparent)",
                  width: "40%",
                }}
                animate={{
                  x: ["-100%", "300%"],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LandingLoader;
