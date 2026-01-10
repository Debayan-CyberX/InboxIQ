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
            {/* Gradient for sky - deeper indigo to purple-pink */}
            <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2D1B4E" stopOpacity="1" />
              <stop offset="30%" stopColor="#3A255C" stopOpacity="1" />
              <stop offset="50%" stopColor="#4A2C6D" stopOpacity="1" />
              <stop offset="70%" stopColor="#6B4A8C" stopOpacity="1" />
              <stop offset="85%" stopColor="#8B6BA8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#9A8BB8" stopOpacity="0.85" />
            </linearGradient>
            
            {/* Gradient for distant mountains */}
            <linearGradient id="mountainGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3D2B5E" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#4A3A6B" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#5A3F7A" stopOpacity="0.7" />
            </linearGradient>
            
            {/* Gradient for mid-distance mountains */}
            <linearGradient id="mountainGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4A3A6B" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#5A4A7A" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#6B5A8A" stopOpacity="0.65" />
            </linearGradient>
            
            {/* Gradient for ground/snow */}
            <linearGradient id="groundGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8B7BA8" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#7A6B9A" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#6B5A8A" stopOpacity="0.7" />
            </linearGradient>
            
            {/* Gradient for tree snow highlights */}
            <linearGradient id="treeSnowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#E8E8F0" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#D0D0E0" stopOpacity="0.6" />
            </linearGradient>
          </defs>
          
          {/* Sky */}
          <rect width="1920" height="1080" fill="url(#skyGradient)" />
          
          {/* Soft clouds with more definition */}
          <g opacity="0.4">
            <ellipse cx="250" cy="140" rx="200" ry="70" fill="#9A8BB8" />
            <ellipse cx="400" cy="130" rx="180" ry="60" fill="#8B7BA8" />
            <ellipse cx="350" cy="150" rx="160" ry="55" fill="#7A6B9A" />
          </g>
          <g opacity="0.35">
            <ellipse cx="750" cy="190" rx="220" ry="80" fill="#9A8BB8" />
            <ellipse cx="900" cy="180" rx="200" ry="70" fill="#8B7BA8" />
            <ellipse cx="850" cy="200" rx="180" ry="65" fill="#7A6B9A" />
          </g>
          <g opacity="0.3">
            <ellipse cx="1450" cy="170" rx="180" ry="65" fill="#9A8BB8" />
            <ellipse cx="1580" cy="160" rx="160" ry="55" fill="#8B7BA8" />
            <ellipse cx="1520" cy="180" rx="140" ry="50" fill="#7A6B9A" />
          </g>
          <g opacity="0.35">
            <ellipse cx="1150" cy="110" rx="160" ry="60" fill="#8B7BA8" />
            <ellipse cx="1280" cy="100" rx="140" ry="50" fill="#9A8BB8" />
            <ellipse cx="1220" cy="120" rx="150" ry="55" fill="#7A6B9A" />
          </g>
          
          {/* Distant mountains (background layer) - more dramatic peaks */}
          <polygon
            points="0,650 350,420 650,480 950,400 1250,440 1550,410 1800,460 1920,520 1920,1080 0,1080"
            fill="url(#mountainGradient1)"
            opacity="0.7"
          />
          
          {/* Mid-distance mountains - closer layer */}
          <polygon
            points="0,750 280,580 550,620 850,540 1150,600 1450,560 1750,620 1920,680 1920,1080 0,1080"
            fill="url(#mountainGradient2)"
            opacity="0.75"
          />
          
          {/* Additional mountain layer for depth */}
          <polygon
            points="0,800 200,700 450,730 750,650 1050,710 1350,680 1650,730 1920,750 1920,1080 0,1080"
            fill="#5A4A7A"
            opacity="0.5"
          />
          
          {/* Large foreground trees on left - more prominent and detailed */}
          {/* Large Tree 1 - Left foreground */}
          <g opacity="0.75">
            {/* Tree trunk */}
            <rect x="180" y="780" width="40" height="120" fill="#3D2B5E" opacity="0.8" />
            {/* Snow on branches */}
            <polygon points="150,780 170,720 190,780 210,720 230,780 200,820" fill="url(#treeSnowGradient)" />
            <polygon points="140,760 160,700 180,760 200,700 220,760 190,800" fill="url(#treeSnowGradient)" />
            {/* Tree body */}
            <polygon points="130,820 180,720 200,740 220,720 230,780 200,820" fill="#4A3A6B" />
            <polygon points="140,800 200,680 230,700 250,680 270,760 200,840" fill="#5A4A7A" />
          </g>
          
          {/* Large Tree 2 - Left mid */}
          <g opacity="0.7">
            <rect x="350" y="760" width="35" height="100" fill="#3D2B5E" opacity="0.8" />
            <polygon points="320,760 340,700 360,760 380,700 400,760 370,800" fill="url(#treeSnowGradient)" />
            <polygon points="310,740 330,680 350,740 370,680 390,740 360,780" fill="url(#treeSnowGradient)" />
            <polygon points="300,800 350,680 370,700 390,680 410,740 360,820" fill="#4A3A6B" />
            <polygon points="310,780 370,660 400,680 420,660 440,720 370,840" fill="#5A4A7A" />
          </g>
          
          {/* Medium Tree 3 - Center-left */}
          <g opacity="0.65">
            <rect x="550" y="740" width="30" height="90" fill="#3D2B5E" opacity="0.8" />
            <polygon points="525,740 540,690 560,740 575,690 595,740 570,780" fill="url(#treeSnowGradient)" />
            <polygon points="515,720 530,670 550,720 565,670 585,720 560,760" fill="url(#treeSnowGradient)" />
            <polygon points="505,780 550,680 570,690 585,680 605,730 560,800" fill="#4A3A6B" />
          </g>
          
          {/* Smaller trees scattered - background */}
          <g opacity="0.55">
            {/* Tree 4 */}
            <polygon points="250,750 235,710 250,750 265,710 280,750" fill="#5A4A7A" />
            <polygon points="240,700 250,710 260,700" fill="url(#treeSnowGradient)" />
            {/* Tree 5 */}
            <polygon points="480,730 465,690 480,730 495,690 510,730" fill="#5A4A7A" />
            <polygon points="470,680 480,690 490,680" fill="url(#treeSnowGradient)" />
            {/* Tree 6 */}
            <polygon points="650,720 635,680 650,720 665,680 680,720" fill="#5A4A7A" />
            <polygon points="640,670 650,680 660,670" fill="url(#treeSnowGradient)" />
          </g>
          
          {/* Right side trees - smaller, behind cabin */}
          <g opacity="0.6">
            {/* Tree 7 - Near cabin */}
            <polygon points="1380,780 1365,740 1380,780 1395,740 1410,780" fill="#5A4A7A" />
            <polygon points="1370,730 1380,740 1390,730" fill="url(#treeSnowGradient)" />
            {/* Tree 8 */}
            <polygon points="1520,760 1505,720 1520,760 1535,720 1550,760" fill="#5A4A7A" />
            <polygon points="1510,710 1520,720 1530,710" fill="url(#treeSnowGradient)" />
            {/* Tree 9 - Far right */}
            <polygon points="1680,770 1665,730 1680,770 1695,730 1710,770" fill="#5A4A7A" />
            <polygon points="1670,720 1680,730 1690,720" fill="url(#treeSnowGradient)" />
          </g>
          
          {/* Distant small tree silhouettes */}
          <g opacity="0.4">
            <polygon points="800,600 790,580 800,600 810,580 820,600" fill="#4A3A6B" />
            <polygon points="1000,580 990,560 1000,580 1010,560 1020,580" fill="#4A3A6B" />
            <polygon points="1200,560 1190,540 1200,560 1210,540 1220,560" fill="#4A3A6B" />
            <polygon points="1100,590 1090,570 1100,590 1110,570 1120,590" fill="#4A3A6B" />
          </g>
          
          {/* Cozy house/cabin (right side) - more detailed */}
          <g opacity="0.8">
            {/* Cabin body */}
            <rect x="1540" y="740" width="130" height="90" fill="#4A3A6B" />
            {/* Roof with snow */}
            <polygon
              points="1540,740 1605,680 1670,740"
              fill="#3D2B5E"
            />
            {/* Snow on roof */}
            <polygon
              points="1555,710 1605,685 1655,710 1655,720 1555,720"
              fill="url(#treeSnowGradient)"
            />
            {/* Chimney */}
            <rect x="1575" y="665" width="20" height="25" fill="#3D2B5E" />
            {/* Windows with warm golden light and glow */}
            <rect x="1565" y="760" width="28" height="28" fill="#FFB84D" opacity="0.9" rx="2" />
            <rect x="1570" y="765" width="18" height="18" fill="#FFD700" opacity="0.6" />
            <rect x="1627" y="760" width="28" height="28" fill="#FFB84D" opacity="0.9" rx="2" />
            <rect x="1632" y="765" width="18" height="18" fill="#FFD700" opacity="0.6" />
            {/* Window frames */}
            <rect x="1565" y="760" width="28" height="28" fill="none" stroke="#3D2B5E" strokeWidth="2" rx="2" />
            <rect x="1627" y="760" width="28" height="28" fill="none" stroke="#3D2B5E" strokeWidth="2" rx="2" />
            {/* Chimney smoke - more realistic */}
            <g opacity="0.5">
              <ellipse cx="1585" cy="650" rx="6" ry="20" fill="#E8E8E8" />
              <ellipse cx="1588" cy="630" rx="8" ry="18" fill="#F0F0F0" />
              <ellipse cx="1583" cy="610" rx="7" ry="15" fill="#F8F8F8" />
              <ellipse cx="1590" cy="590" rx="6" ry="12" fill="#E8E8E8" />
            </g>
          </g>
          
          {/* Snow-covered ground - more textured and undulating */}
          <path
            d="M 0,920 Q 200,900 400,920 T 800,910 T 1200,915 T 1600,905 T 1920,925 L 1920,1080 L 0,1080 Z"
            fill="url(#groundGradient)"
          />
          
          {/* Middle snow layer with variations */}
          <path
            d="M 0,950 Q 300,935 600,950 T 1000,940 T 1400,945 T 1800,935 T 1920,955 L 1920,1080 L 0,1080 Z"
            fill="#7A6B9A"
            opacity="0.5"
          />
          
          {/* Additional texture layer */}
          <path
            d="M 0,970 Q 400,960 800,970 T 1600,960 T 1920,975 L 1920,1080 L 0,1080 Z"
            fill="#6B5A8A"
            opacity="0.45"
          />
          
          {/* Subtle path/stream in snow - darker blue-purple */}
          <path
            d="M 1600,980 Q 1400,1000 1200,1020 Q 1000,1040 800,1050 Q 600,1060 400,1065 Q 200,1070 0,1075 L 0,1080 L 1920,1080 L 1920,1075 Q 1800,1070 1600,1065 Q 1400,1060 1200,1055 Q 1000,1050 800,1045 Q 600,1040 400,1035 Q 200,1030 0,1025 Z"
            fill="#5A4A7A"
            opacity="0.3"
          />
        </svg>
      </div>
      
      {/* Dark overlay for contrast - slightly lighter to show more detail */}
      <div className="absolute inset-0 bg-black/25" />
      
      {/* Content wrapper with subtle backdrop blur */}
      <div className="relative z-10 min-h-screen w-full backdrop-blur-[1px]">
        {children}
      </div>
    </div>
  );
};
