import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

/**
 * AuthLayout - Modern dark background matching InboxIQ product aesthetic
 * Features: Abstract geometric shapes, subtle gradients, professional dark mode
 */
export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0D0F14]">
      {/* Background Illustration */}
      <div className="absolute inset-0 w-full h-full">
        <svg
          className="absolute inset-0 w-full h-full object-cover"
          viewBox="0 0 1920 1080"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Main background gradient - dark charcoal to deep purple */}
            <linearGradient id="mainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0D0F14" stopOpacity="1" />
              <stop offset="30%" stopColor="#1A1A2E" stopOpacity="1" />
              <stop offset="60%" stopColor="#2D1B4E" stopOpacity="1" />
              <stop offset="100%" stopColor="#0D0F14" stopOpacity="1" />
            </linearGradient>
            
            {/* Radial gradient for subtle glow */}
            <radialGradient id="glowGradient1" cx="50%" cy="30%" r="50%">
              <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.15" />
              <stop offset="50%" stopColor="#9333EA" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#9333EA" stopOpacity="0" />
            </radialGradient>
            
            <radialGradient id="glowGradient2" cx="80%" cy="70%" r="40%">
              <stop offset="0%" stopColor="#A855F7" stopOpacity="0.12" />
              <stop offset="70%" stopColor="#9333EA" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#9333EA" stopOpacity="0" />
            </radialGradient>
            
            {/* Gradient for geometric shapes */}
            <linearGradient id="shapeGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9333EA" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.15" />
            </linearGradient>
            
            <linearGradient id="shapeGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#A855F7" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#9333EA" stopOpacity="0.1" />
            </linearGradient>
            
            {/* Subtle grid pattern */}
            <pattern id="gridPattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke="rgba(147, 51, 234, 0.05)" strokeWidth="1" />
            </pattern>
          </defs>
          
          {/* Base background */}
          <rect width="1920" height="1080" fill="url(#mainGradient)" />
          
          {/* Subtle grid overlay */}
          <rect width="1920" height="1080" fill="url(#gridPattern)" opacity="0.4" />
          
          {/* Radial glow effects */}
          <ellipse cx="960" cy="320" rx="800" ry="600" fill="url(#glowGradient1)" />
          <ellipse cx="1400" cy="750" rx="600" ry="500" fill="url(#glowGradient2)" />
          <ellipse cx="300" cy="800" rx="500" ry="400" fill="url(#glowGradient1)" opacity="0.6" />
          
          {/* Abstract geometric shapes - subtle and modern */}
          {/* Large blurred circles */}
          <circle cx="200" cy="300" r="180" fill="#9333EA" opacity="0.08" filter="blur(60px)" />
          <circle cx="1600" cy="400" r="220" fill="#A855F7" opacity="0.06" filter="blur(70px)" />
          <circle cx="800" cy="750" r="200" fill="#7C3AED" opacity="0.07" filter="blur(65px)" />
          
          {/* Subtle geometric shapes */}
          {/* Hexagon-inspired shapes */}
          <g opacity="0.15">
            <polygon
              points="300,200 450,150 600,200 600,300 450,350 300,300"
              fill="url(#shapeGradient1)"
              transform="rotate(-15 450 250)"
            />
            <polygon
              points="1500,600 1650,550 1800,600 1800,700 1650,750 1500,700"
              fill="url(#shapeGradient2)"
              transform="rotate(20 1650 650)"
            />
          </g>
          
          {/* Subtle diagonal lines/rays */}
          <g opacity="0.08">
            <line x1="0" y1="200" x2="1920" y2="400" stroke="#9333EA" strokeWidth="2" />
            <line x1="0" y1="600" x2="1920" y2="800" stroke="#A855F7" strokeWidth="2" />
            <line x1="0" y1="400" x2="1920" y2="600" stroke="#7C3AED" strokeWidth="1.5" />
          </g>
          
          {/* Subtle wave patterns */}
          <g opacity="0.12">
            <path
              d="M 0,800 Q 480,750 960,800 T 1920,800 L 1920,1080 L 0,1080 Z"
              fill="#9333EA"
            />
            <path
              d="M 0,900 Q 640,850 1280,900 T 1920,900 L 1920,1080 L 0,1080 Z"
              fill="#A855F7"
              opacity="0.8"
            />
          </g>
          
          {/* Floating orbs - subtle glow effect */}
          <g opacity="0.2">
            <circle cx="400" cy="500" r="3" fill="#9333EA" filter="blur(2px)" />
            <circle cx="1200" cy="300" r="4" fill="#A855F7" filter="blur(2px)" />
            <circle cx="1600" cy="600" r="3" fill="#7C3AED" filter="blur(2px)" />
            <circle cx="600" cy="700" r="2" fill="#9333EA" filter="blur(1.5px)" />
            <circle cx="1400" cy="200" r="3" fill="#A855F7" filter="blur(2px)" />
            <circle cx="200" cy="600" r="2.5" fill="#7C3AED" filter="blur(1.5px)" />
          </g>
          
          {/* Subtle mesh gradient overlay */}
          <rect width="1920" height="1080" fill="rgba(147, 51, 234, 0.03)" />
        </svg>
      </div>
      
      {/* Subtle dark overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/15" />
      
      {/* Content wrapper with subtle backdrop blur */}
      <div className="relative z-10 min-h-screen w-full backdrop-blur-[2px]">
        {children}
      </div>
    </div>
  );
};
