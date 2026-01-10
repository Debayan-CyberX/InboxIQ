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
 */
export const DashboardTransition = ({ 
  children, 
  isEntering = false 
}: DashboardTransitionProps) => {
  const location = useLocation();
  const [shouldAnimate, setShouldAnimate] = useState(false);
  
  // Check if coming from sign-in using sessionStorage (more reliable)
  useEffect(() => {
    const fromSignIn = sessionStorage.getItem("fromSignIn") === "true";
    if (fromSignIn || isEntering || location.state?.fromSignIn === true) {
      setShouldAnimate(true);
      // Clear the flag after reading it
      sessionStorage.removeItem("fromSignIn");
    }
  }, [isEntering, location.state]);
  
  const fromSignIn = shouldAnimate;

  // Check if user prefers reduced motion
  const prefersReducedMotion = typeof window !== "undefined" 
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches 
    : false;

  // Entrance animation variants
  const containerVariants = {
    initial: { 
      opacity: 0, 
      y: prefersReducedMotion ? 0 : 30,
      filter: prefersReducedMotion ? "blur(0px)" : "blur(4px)"
    },
    animate: { 
      opacity: 1, 
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: prefersReducedMotion ? 0.2 : 0.6,
        delay: prefersReducedMotion ? 0 : 0.2, // Slight delay for smooth sequence
        ease: [0.22, 1, 0.36, 1], // easeOutCubic
      }
    }
  };

  // Only animate if coming from sign-in
  if (!fromSignIn) {
    return <div className="w-full h-full">{children}</div>;
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
};
