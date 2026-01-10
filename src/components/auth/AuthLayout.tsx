import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

/**
 * AuthLayout - Provides a dreamy illustrated background for auth pages
 * Features: Soft landscape illustration with mountains, trees, and dusk/night sky
 */
export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background Illustration */}
      <div className="absolute inset-0 w-full h-full">
        <svg
          className="absolute inset-0 w-full h-full object-cover"
          viewBox="0 0 1920 1080"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Gradient for sky */}
            <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2D1B4E" stopOpacity="1" />
              <stop offset="40%" stopColor="#4A2C6D" stopOpacity="1" />
              <stop offset="70%" stopColor="#6B4A8C" stopOpacity="1" />
              <stop offset="100%" stopColor="#8B6BA8" stopOpacity="0.8" />
            </linearGradient>
            
            {/* Gradient for mountains */}
            <linearGradient id="mountainGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3D2B5E" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#5A3F7A" stopOpacity="0.7" />
            </linearGradient>
            
            <linearGradient id="mountainGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4A3A6B" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#6B5A8A" stopOpacity="0.6" />
            </linearGradient>
            
            {/* Gradient for ground/snow */}
            <linearGradient id="groundGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6B5A8A" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#4A3A6B" stopOpacity="0.7" />
            </linearGradient>
          </defs>
          
          {/* Sky */}
          <rect width="100%" height="100%" fill="url(#skyGradient)" />
          
          {/* Soft clouds */}
          <ellipse cx="300" cy="150" rx="180" ry="60" fill="#7A6B9A" opacity="0.3" />
          <ellipse cx="800" cy="200" rx="200" ry="70" fill="#8B7BA8" opacity="0.25" />
          <ellipse cx="1500" cy="180" rx="160" ry="55" fill="#9A8BB8" opacity="0.2" />
          <ellipse cx="1200" cy="120" rx="140" ry="50" fill="#6B5A8A" opacity="0.25" />
          
          {/* Distant mountains (background layer) */}
          <polygon
            points="0,600 400,400 800,450 1200,380 1600,420 1920,500 1920,1080 0,1080"
            fill="url(#mountainGradient1)"
            opacity="0.6"
          />
          
          {/* Mid-distance mountains */}
          <polygon
            points="0,700 300,550 600,600 900,520 1200,580 1500,540 1800,600 1920,650 1920,1080 0,1080"
            fill="url(#mountainGradient2)"
            opacity="0.7"
          />
          
          {/* Snow-covered trees (simplified shapes) */}
          {/* Tree 1 - Left */}
          <polygon
            points="200,800 180,720 160,800 140,720 120,800"
            fill="#5A4A7A"
            opacity="0.6"
          />
          <polygon
            points="180,700 200,720 220,700"
            fill="#6B5A8A"
            opacity="0.5"
          />
          
          {/* Tree 2 */}
          <polygon
            points="450,780 430,700 410,780 390,700 370,780"
            fill="#5A4A7A"
            opacity="0.6"
          />
          <polygon
            points="430,680 450,700 470,680"
            fill="#6B5A8A"
            opacity="0.5"
          />
          
          {/* Tree 3 */}
          <polygon
            points="700,750 680,670 660,750 640,670 620,750"
            fill="#5A4A7A"
            opacity="0.6"
          />
          <polygon
            points="680,650 700,670 720,650"
            fill="#6B5A8A"
            opacity="0.5"
          />
          
          {/* Tree 4 - Right side */}
          <polygon
            points="1400,800 1380,720 1360,800 1340,720 1320,800"
            fill="#5A4A7A"
            opacity="0.6"
          />
          <polygon
            points="1380,700 1400,720 1420,700"
            fill="#6B5A8A"
            opacity="0.5"
          />
          
          {/* Tree 5 */}
          <polygon
            points="1650,780 1630,700 1610,780 1590,700 1570,780"
            fill="#5A4A7A"
            opacity="0.6"
          />
          <polygon
            points="1630,680 1650,700 1670,680"
            fill="#6B5A8A"
            opacity="0.5"
          />
          
          {/* Cozy house/cabin (right side) */}
          <rect x="1550" y="750" width="120" height="80" fill="#4A3A6B" opacity="0.7" />
          <polygon
            points="1550,750 1610,700 1670,750"
            fill="#3D2B5E"
            opacity="0.8"
          />
          {/* Windows with warm light */}
          <rect x="1570" y="770" width="25" height="25" fill="#FFB84D" opacity="0.8" />
          <rect x="1625" y="770" width="25" height="25" fill="#FFB84D" opacity="0.8" />
          {/* Chimney smoke */}
          <ellipse cx="1580" cy="690" rx="8" ry="30" fill="#E8E8E8" opacity="0.4" />
          <ellipse cx="1585" cy="670" rx="10" ry="25" fill="#F0F0F0" opacity="0.3" />
          
          {/* Snow-covered ground */}
          <path
            d="M 0,900 Q 300,880 600,900 T 1200,890 T 1920,910 L 1920,1080 L 0,1080 Z"
            fill="url(#groundGradient)"
          />
          
          {/* Additional soft ground layer */}
          <path
            d="M 0,950 Q 400,930 800,950 T 1600,940 T 1920,960 L 1920,1080 L 0,1080 Z"
            fill="#6B5A8A"
            opacity="0.4"
          />
        </svg>
      </div>
      
      {/* Dark overlay for contrast */}
      <div className="absolute inset-0 bg-black/30" />
      
      {/* Content wrapper with subtle backdrop blur */}
      <div className="relative z-10 min-h-screen w-full backdrop-blur-[1px]">
        {children}
      </div>
    </div>
  );
};
