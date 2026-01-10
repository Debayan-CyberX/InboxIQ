import { ReactNode, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";

interface DashboardTransitionProps {
  children: ReactNode;
  isEntering?: boolean;
}

/**
 * Premium transition wrapper for Dashboard pages
 * Handles the entrance animation: fade + slide in from bottom
 * Simplified to not interfere with layout
 */
export const DashboardTransition = ({ 
  children, 
  isEntering = false 
}: DashboardTransitionProps) => {
  const location = useLocation();
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Check if coming from sign-in using sessionStorage (more reliable)
  useEffect(() => {
    const fromSignIn = sessionStorage.getItem("fromSignIn") === "true";
    if (fromSignIn || isEntering || location.state?.fromSignIn === true) {
      setShouldAnimate(true);
      // Clear the flag after reading it
      sessionStorage.removeItem("fromSignIn");
    }
    setMounted(true);
  }, [isEntering, location.state]);
  
  const fromSignIn = shouldAnimate && mounted;

  // Check if user prefers reduced motion
  const prefersReducedMotion = typeof window !== "undefined" 
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches 
    : false;

  // Simplified animation - minimal impact on layout
  const containerVariants = {
    initial: { 
      opacity: prefersReducedMotion ? 1 : 0,
    },
    animate: { 
      opacity: 1,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.3,
        ease: "easeOut",
      }
    }
  };

  // Always return children without layout-affecting wrappers when not animating
  if (!fromSignIn || prefersReducedMotion) {
    return <>{children}</>;
  }

  // Minimal transition wrapper
  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      style={{ 
        width: '100%', 
        maxWidth: '100%',
        minWidth: 0,
        overflow: 'hidden'
      }}
      className="w-full min-w-0 max-w-full overflow-x-hidden"
    >
      {children}
    </motion.div>
  );
};
