import { ReactNode, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

interface SignInTransitionProps {
  children: ReactNode;
  isTransitioning: boolean;
  onTransitionComplete?: () => void;
}

/**
 * Premium transition wrapper for Sign In page
 * Handles the exit animation: scale down, fade, blur, and background darkening
 */
export const SignInTransition = ({ 
  children, 
  isTransitioning,
  onTransitionComplete 
}: SignInTransitionProps) => {
  const location = useLocation();
  const [shouldAnimate, setShouldAnimate] = useState(false);

  // Check if user prefers reduced motion
  const prefersReducedMotion = typeof window !== "undefined" 
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches 
    : false;

  useEffect(() => {
    if (isTransitioning) {
      setShouldAnimate(true);
    }
  }, [isTransitioning]);

  // Exit animation variants
  const containerVariants = {
    initial: { 
      opacity: 1, 
      scale: 1,
      filter: "blur(0px)"
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      filter: prefersReducedMotion ? "blur(0px)" : "blur(8px)",
      transition: {
        duration: prefersReducedMotion ? 0.2 : 0.5,
        ease: [0.22, 1, 0.36, 1], // easeOutCubic
      }
    }
  };

  // Background overlay variants
  const overlayVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: isTransitioning ? 0.4 : 0,
      transition: {
        duration: prefersReducedMotion ? 0.2 : 0.4,
        ease: [0.22, 1, 0.36, 1],
      }
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Background overlay - darkens during transition */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            variants={overlayVariants}
            initial="initial"
            animate="animate"
            exit="initial"
            className="fixed inset-0 bg-[#0D0F14] z-[9999] pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Sign In Card with transition */}
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate={shouldAnimate ? "exit" : "initial"}
        onAnimationComplete={() => {
          if (shouldAnimate && onTransitionComplete) {
            onTransitionComplete();
          }
        }}
        className="relative z-10"
        style={{ willChange: shouldAnimate ? 'opacity, transform, filter' : 'auto' }}
      >
        {children}
      </motion.div>
    </div>
  );
};
