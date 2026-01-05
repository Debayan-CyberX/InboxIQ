import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { 
  Sparkles, 
  Zap, 
  Brain, 
  Mail, 
  TrendingUp, 
  Shield, 
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Target,
  BarChart3,
  Play,
  ChevronRight,
  Star,
  Users,
  Rocket,
  Globe,
  Lock,
  Check,
  X,
  Search,
  MessageSquare,
  Send,
  Eye,
  Activity,
  Layers,
  Sparkle,
  Wand2,
  Network,
  TrendingDown,
  ArrowUpRight,
  MailCheck,
  Bot,
  Cpu,
  ScanSearch
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";

const Landing = () => {
  const { data: session } = useSession();
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, -100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, 200]);

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-background overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <motion.div 
          className="absolute inset-0"
          animate={{
            background: [
              "radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 50%, rgba(168, 85, 247, 0.15) 0%, transparent 50%)",
              "radial-gradient(circle at 50% 80%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)",
              "radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)",
            ],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/10 via-background to-background" />
        
        {/* Animated grid */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Navigation */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50 backdrop-blur-xl"
      >
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2.5"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 via-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">
              InboxIQ
            </span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-4"
          >
            {session ? (
              <Link to="/dashboard">
                <Button variant="ghost" className="hover:bg-purple-500/10">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/sign-in">
                  <Button variant="ghost" className="hover:bg-purple-500/10">
                    Sign In
                  </Button>
                </Link>
                <Link to="/sign-up">
                  <Button className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 shadow-lg shadow-purple-500/25">
                    Start Free
                  </Button>
                </Link>
              </>
            )}
          </motion.div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-20 px-6 overflow-hidden">
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="text-center max-w-6xl mx-auto space-y-8 relative z-10"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-purple-500/20 mb-4"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs font-medium text-purple-300">AI-Powered Lead Management</span>
          </motion.div>

          {/* Headline with Typewriter Effect */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight tracking-tight"
          >
            <span className="block text-foreground mb-2">
              Never lose a lead
            </span>
            <span className="block min-h-[1.2em] h-[1.2em] w-full">
              <TypewriterText 
                texts={[
                  "to forgotten follow-ups",
                  "to missed opportunities",
                  "to cold leads",
                  "to delayed responses"
                ]}
                className="bg-gradient-to-r from-purple-400 via-violet-400 to-purple-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]"
              />
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
          >
            InboxIQ automatically detects sales leads from email, tracks follow-ups, and drafts replies so no lead ever goes cold.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6"
          >
            {session ? (
              <Link to="/dashboard">
                <Button 
                  size="lg" 
                  className="group text-lg px-8 py-6 bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 shadow-lg shadow-purple-500/25"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/sign-up">
                  <Button 
                    size="lg" 
                    className="group text-lg px-8 py-6 bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 shadow-lg shadow-purple-500/25"
                  >
                    Start Free
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-8 py-6 border-purple-500/20 hover:border-purple-500/40 hover:bg-purple-500/5 group"
                >
                  <Play className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                  See How It Works
                </Button>
              </>
            )}
          </motion.div>

          {/* Dashboard Mockup - 3D Card with Pop-out Effect */}
          <motion.div
            initial={{ opacity: 0, y: 50, rotateX: -10 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 1, delay: 0.8, type: "spring", stiffness: 100 }}
            className="mt-20 relative"
            style={{ perspective: "1000px" }}
          >
            <motion.div
              whileHover={{ 
                y: -20, 
                rotateY: 5,
                rotateX: -2,
                scale: 1.02,
                z: 50
              }}
              transition={{ duration: 0.3 }}
              className="glass rounded-2xl border border-purple-500/20 p-8 shadow-2xl shadow-purple-500/20 relative overflow-hidden group"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Glow effect */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-violet-500/5 to-transparent"
                animate={{
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              {/* Interactive Dashboard Content */}
              <div className="relative z-10 space-y-4">
                {/* Header with logo, search, and notifications */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center shadow-lg shadow-purple-500/30"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Brain className="w-4 h-4 text-white" />
                    </motion.div>
                    <div className="text-sm font-semibold text-foreground">InboxIQ Dashboard</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.div 
                      className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center cursor-pointer"
                      whileHover={{ scale: 1.1, backgroundColor: "rgba(139, 92, 246, 0.2)" }}
                    >
                      <Search className="w-4 h-4 text-purple-400" />
                    </motion.div>
                    <motion.div 
                      className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center overflow-hidden relative cursor-pointer"
                      whileHover={{ scale: 1.15, rotate: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="w-full h-full bg-gradient-to-br from-purple-400 to-violet-400" />
                      <div className="absolute top-0 right-0 w-2 h-2 bg-green-400 rounded-full border-2 border-purple-500" />
                    </motion.div>
                    <motion.div 
                      className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center overflow-hidden cursor-pointer relative"
                      whileHover={{ scale: 1.15, rotate: -5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="w-full h-full bg-gradient-to-br from-violet-400 to-purple-400" />
                      <motion.div
                        className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-purple-500"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </motion.div>
                  </div>
                </div>
                
                {/* Interactive Stats Cards */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { 
                      icon: MailCheck, 
                      label: "Active Leads", 
                      value: "24", 
                      change: "+5 today",
                      color: "from-blue-500 to-cyan-500",
                    },
                    { 
                      icon: TrendingUp, 
                      label: "Response Rate", 
                      value: "87%", 
                      change: "↑ 12%",
                      color: "from-green-500 to-emerald-500",
                    },
                    { 
                      icon: Zap, 
                      label: "AI Drafts", 
                      value: "12", 
                      change: "3 ready",
                      color: "from-yellow-500 to-orange-500",
                    },
                  ].map((stat, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: 1 + i * 0.1, type: "spring", stiffness: 200 }}
                      whileHover={{ 
                        scale: 1.08, 
                        y: -5,
                        z: 20,
                        rotateY: 5,
                        transition: { duration: 0.2 }
                      }}
                      className="h-28 rounded-xl bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-500/20 cursor-pointer relative overflow-hidden group backdrop-blur-sm"
                      style={{ transformStyle: "preserve-3d" }}
                    >
                      <motion.div
                        className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-25 transition-opacity duration-300`}
                      />
                      <div className="relative z-10 p-4 h-full flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <motion.div 
                            className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}
                            whileHover={{ rotate: [0, -10, 10, 0] }}
                            transition={{ duration: 0.3 }}
                          >
                            <stat.icon className="w-5 h-5 text-white" />
                          </motion.div>
                          <motion.span
                            className="text-xs font-medium text-green-400"
                            animate={{ opacity: [0.7, 1, 0.7] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            {stat.change}
                          </motion.span>
                        </div>
                        <div>
                          <motion.div 
                            className="text-2xl font-bold text-foreground"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 1.2 + i * 0.1, type: "spring" }}
                          >
                            {stat.value}
                          </motion.div>
                          <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                {/* Main Interactive Chart Area with Email Threads */}
                <motion.div 
                  className="h-64 rounded-xl bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-500/20 relative overflow-hidden group"
                  whileHover={{ 
                    scale: 1.02,
                    borderColor: "rgba(139, 92, 246, 0.4)",
                    transition: { duration: 0.2 }
                  }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* Section Header */}
                  <div className="absolute top-0 left-0 right-0 p-4 pb-2 border-b border-purple-500/10 bg-gradient-to-b from-purple-500/5 to-transparent">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-semibold text-foreground">Active Lead Conversations</span>
                      </div>
                      <span className="text-xs text-muted-foreground">3 of 24</span>
                    </div>
                  </div>
                  
                  {/* Email Threads Preview with Real Content */}
                  <div className="absolute inset-0 pt-16 p-4 flex flex-col gap-3">
                    {/* Thread 1 - Hot Lead */}
                    <motion.div 
                      className="flex items-start gap-3 p-3 rounded-lg bg-purple-500/5 border border-purple-500/10 hover:bg-purple-500/10 transition-colors cursor-pointer group"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 1.4, duration: 0.5 }}
                      whileHover={{ x: 5 }}
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex-shrink-0 flex items-center justify-center shadow-md">
                        <span className="text-xs font-bold text-white">JD</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-foreground">John Davis</span>
                            <span className="text-xs text-muted-foreground">• TechCorp Inc.</span>
                          </div>
                          <motion.div 
                            className="w-2 h-2 rounded-full bg-green-400 shadow-sm shadow-green-400/50"
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                        </div>
                        <div className="text-xs font-medium text-foreground mb-1">Partnership Opportunity - Q1 2024</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">Interested in discussing enterprise pricing for your team...</div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs text-purple-400">Follow-up due in 2 hours</span>
                          <motion.span
                            className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400"
                            animate={{ opacity: [0.7, 1, 0.7] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            Hot Lead
                          </motion.span>
                        </div>
                      </div>
                    </motion.div>
                    
                    {/* Thread 2 - AI Draft Ready */}
                    <motion.div 
                      className="flex items-start gap-3 p-3 rounded-lg bg-purple-500/5 border border-purple-500/10 hover:bg-purple-500/10 transition-colors cursor-pointer group"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 1.6, duration: 0.5 }}
                      whileHover={{ x: 5 }}
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex-shrink-0 flex items-center justify-center shadow-md">
                        <span className="text-xs font-bold text-white">SM</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-foreground">Sarah Martinez</span>
                            <span className="text-xs text-muted-foreground">• Growth Labs</span>
                          </div>
                          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/20">
                            <Bot className="w-3 h-3 text-purple-400" />
                            <span className="text-xs text-purple-400 font-medium">AI Draft</span>
                          </div>
                        </div>
                        <div className="text-xs font-medium text-foreground mb-1">Re: Product Demo Request</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">AI-generated reply ready for your review and approval...</div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs text-green-400">Draft ready</span>
                          <span className="text-xs text-muted-foreground">• 95% confidence</span>
                        </div>
                      </div>
                    </motion.div>
                    
                    {/* Thread 3 - Needs Attention */}
                    <motion.div 
                      className="flex items-start gap-3 p-3 rounded-lg bg-purple-500/5 border border-purple-500/10 hover:bg-purple-500/10 transition-colors cursor-pointer group"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 1.8, duration: 0.5 }}
                      whileHover={{ x: 5 }}
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex-shrink-0 flex items-center justify-center shadow-md">
                        <span className="text-xs font-bold text-white">AL</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-foreground">Alex Lee</span>
                            <span className="text-xs text-muted-foreground">• StartupHub</span>
                          </div>
                          <motion.div 
                            className="w-2 h-2 rounded-full bg-yellow-400 shadow-sm shadow-yellow-400/50"
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                          />
                        </div>
                        <div className="text-xs font-medium text-foreground mb-1">Pricing Inquiry - Enterprise Plan</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">No response in 3 days - lead may go cold soon...</div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs text-yellow-400">Action needed</span>
                          <span className="text-xs text-muted-foreground">• 3 days since last contact</span>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                  
                  {/* Animated Chart Lines Overlay */}
                  <svg className="absolute inset-0 w-full h-full opacity-15 pointer-events-none" viewBox="0 0 400 250" preserveAspectRatio="none">
                    <motion.path
                      d="M 0 200 Q 100 150, 200 170 T 400 150"
                      stroke="url(#gradient)"
                      strokeWidth="3"
                      fill="none"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 3, delay: 2, repeat: Infinity, repeatDelay: 2 }}
                    />
                    <motion.path
                      d="M 0 210 Q 100 180, 200 190 T 400 170"
                      stroke="url(#gradient2)"
                      strokeWidth="2"
                      fill="none"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 3, delay: 2.2, repeat: Infinity, repeatDelay: 2 }}
                    />
                    <motion.path
                      d="M 0 190 Q 100 130, 200 150 T 400 130"
                      stroke="url(#gradient3)"
                      strokeWidth="2"
                      fill="none"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 3, delay: 2.4, repeat: Infinity, repeatDelay: 2 }}
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="rgb(139, 92, 246)" />
                        <stop offset="100%" stopColor="rgb(168, 85, 247)" />
                      </linearGradient>
                      <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="rgb(168, 85, 247)" />
                        <stop offset="100%" stopColor="rgb(139, 92, 246)" />
                      </linearGradient>
                      <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="rgb(139, 92, 246)" />
                        <stop offset="50%" stopColor="rgb(168, 85, 247)" />
                        <stop offset="100%" stopColor="rgb(139, 92, 246)" />
                      </linearGradient>
                    </defs>
                  </svg>
                  
                  {/* Pulse effect on hover */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-violet-500/0 rounded-xl"
                    whileHover={{
                      background: "radial-gradient(circle at center, rgba(139, 92, 246, 0.1), transparent 70%)"
                    }}
                  />
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Floating orbs */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full blur-3xl opacity-20"
            style={{
              width: `${200 + i * 100}px`,
              height: `${200 + i * 100}px`,
              background: `radial-gradient(circle, rgba(${139 + i * 20}, 92, 246, 0.4), transparent)`,
              left: `${20 + i * 30}%`,
              top: `${30 + i * 20}%`,
            }}
            animate={{
              x: [0, 100, 0],
              y: [0, -100, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </section>

      {/* Problem Section */}
      <SectionWrapper>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto mb-20"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-block mb-4"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium">
              <AlertCircle className="w-4 h-4" />
              Common Problems
            </span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
          >
            Lost leads cost you{" "}
            <motion.span
              className="text-gradient inline-block"
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              style={{ backgroundSize: "200% auto" }}
            >
              revenue every day
            </motion.span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl text-muted-foreground"
          >
            When follow-ups slip through the cracks, opportunities disappear forever.
          </motion.p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            {
              icon: Clock,
              title: "Forgotten Follow-ups",
              description: "Leads go cold when you miss the perfect reply window",
              delay: 0,
            },
            {
              icon: AlertCircle,
              title: "Manual Tracking Fails",
              description: "Spreadsheets and reminders can't keep up with email volume",
              delay: 0.2,
            },
            {
              icon: X,
              title: "Lost Opportunities",
              description: "Every delayed response reduces your chance of closing",
              delay: 0.4,
            },
          ].map((problem, i) => (
            <ProblemCard key={i} {...problem} />
          ))}
        </div>
      </SectionWrapper>

      {/* Solution Section */}
      <SectionWrapper className="bg-gradient-to-b from-background to-background/95">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-4xl mx-auto mb-20"
        >
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl font-semibold mb-6 tracking-tight"
          >
            Automatically track, remind, and{" "}
            <span className="text-gradient font-medium">draft replies</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground font-light"
          >
            InboxIQ watches your inbox, detects leads, and ensures you never miss a follow-up.
          </motion.p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {[
            {
              icon: ScanSearch,
              title: "Detect Leads",
              description: "AI automatically identifies sales opportunities in your inbox",
              gradient: "from-blue-500 to-cyan-500",
              delay: 0,
            },
            {
              icon: Activity,
              title: "Track Follow-ups",
              description: "Never forget to reply with intelligent reminders",
              gradient: "from-purple-500 to-pink-500",
              delay: 0.1,
            },
            {
              icon: Wand2,
              title: "Draft Replies",
              description: "AI-generated email drafts ready for your review",
              gradient: "from-violet-500 to-purple-500",
              delay: 0.2,
            },
            {
              icon: ArrowUpRight,
              title: "Close More Deals",
              description: "Reply at the right time and convert more leads",
              gradient: "from-green-500 to-emerald-500",
              delay: 0.3,
            },
          ].map((feature, i) => (
            <FeatureCard key={i} {...feature} />
          ))}
        </div>
      </SectionWrapper>

      {/* How It Works */}
      <SectionWrapper>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            How <span className="text-gradient">InboxIQ</span> Works
          </h2>
          <p className="text-xl text-muted-foreground">
            Get started in minutes. No complex setup required.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto space-y-12">
          {[
            {
              step: "01",
              title: "Connect Your Inbox",
              description: "Securely connect your email account. We support Gmail, Outlook, and more.",
              icon: Mail,
            },
            {
              step: "02",
              title: "Detect Leads Automatically",
              description: "Our AI scans incoming emails and identifies potential sales leads in real-time.",
              icon: Brain,
            },
            {
              step: "03",
              title: "Follow Up on Time",
              description: "Get intelligent reminders and AI-drafted replies to never miss an opportunity.",
              icon: Target,
            },
          ].map((step, i) => (
            <StepCard key={i} {...step} index={i} />
          ))}
        </div>
      </SectionWrapper>

      {/* Value / Outcome Section */}
      <SectionWrapper className="bg-gradient-to-b from-background/95 to-background">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Never lose a lead. <span className="text-gradient">Reply at the right time.</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {[
            { value: "0", suffix: " lost leads", icon: CheckCircle2, color: "text-green-400" },
            { value: "24/7", suffix: " monitoring", icon: Clock, color: "text-purple-400" },
            { value: "3x", suffix: " faster replies", icon: Zap, color: "text-violet-400" },
            { value: "95%", suffix: " accuracy", icon: Target, color: "text-pink-400" },
          ].map((stat, i) => (
            <StatCard key={i} {...stat} index={i} />
          ))}
        </div>
      </SectionWrapper>

      {/* Pricing */}
      <SectionWrapper className="bg-gradient-to-b from-background to-background/95">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Simple, transparent <span className="text-gradient">pricing</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Start free. Upgrade when you're ready.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            {
              name: "Starter",
              price: "Free",
              description: "Perfect for trying InboxIQ",
              features: ["Up to 100 emails/month", "Basic lead detection", "Email support"],
              cta: "Get Started",
              popular: false,
            },
            {
              name: "Pro",
              price: "$29",
              period: "/month",
              description: "For growing teams",
              features: ["Unlimited emails", "AI draft replies", "Priority support", "Advanced analytics"],
              cta: "Start Free Trial",
              popular: true,
            },
            {
              name: "Enterprise",
              price: "Custom",
              description: "For large organizations",
              features: ["Everything in Pro", "Custom integrations", "Dedicated support", "SLA guarantee"],
              cta: "Contact Sales",
              popular: false,
            },
          ].map((plan, i) => (
            <PricingCard key={i} {...plan} index={i} />
          ))}
        </div>
      </SectionWrapper>

      {/* Final CTA */}
      <SectionWrapper className="py-32">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.div
            className="glass rounded-3xl p-12 md:p-16 border border-purple-500/30 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-violet-500/10 to-purple-500/10" />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to never lose a lead?
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join teams using InboxIQ to automatically track follow-ups and close more deals.
              </p>
              {session ? (
                <Link to="/dashboard">
                  <Button 
                    size="lg" 
                    className="text-lg px-8 py-6 bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 shadow-lg shadow-purple-500/25"
                  >
                    Go to Dashboard
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              ) : (
                <Link to="/sign-up">
                  <Button 
                    size="lg" 
                    className="text-lg px-8 py-6 bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 shadow-lg shadow-purple-500/25 group"
                  >
                    Start Free Trial
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        </motion.div>
      </SectionWrapper>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 px-6">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">
                InboxIQ
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 Debayan Lahiry. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
};

// Reusable Section Wrapper
const SectionWrapper = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <section className={`py-20 md:py-32 px-6 relative ${className}`}>
    <div className="container mx-auto">
      {children}
    </div>
  </section>
);

// Problem Card Component - Enhanced with eye-catching animations
const ProblemCard = ({ icon: Icon, title, description, delay }: {
  icon: any;
  title: string;
  description: string;
  delay: number;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50, rotateX: -15, scale: 0.9 }}
      animate={isInView ? { opacity: 1, y: 0, rotateX: 0, scale: 1 } : {}}
      transition={{ duration: 0.8, delay, type: "spring", stiffness: 150, damping: 12 }}
      whileHover={{ 
        y: -12, 
        scale: 1.05,
        rotateY: 5,
        rotateX: -2,
        z: 30,
        transition: { duration: 0.3 }
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative group cursor-pointer"
      style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
    >
      {/* Animated glow effect */}
      <motion.div
        className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-red-500 via-orange-500 to-red-500 opacity-0 group-hover:opacity-30 blur-xl"
        animate={isHovered ? {
          opacity: [0, 0.3, 0.2, 0.3],
          scale: [1, 1.1, 1],
        } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      />
      
      {/* Main card */}
      <motion.div
        className="relative glass rounded-2xl p-8 border-2 border-red-500/30 hover:border-red-500/60 transition-all overflow-hidden backdrop-blur-xl"
        style={{
          background: "linear-gradient(135deg, rgba(30, 10, 20, 0.8) 0%, rgba(40, 15, 25, 0.9) 100%)",
        }}
      >
        {/* Animated background gradient */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-orange-500/5 to-red-500/10"
          animate={isHovered ? {
            opacity: [0.1, 0.2, 0.15, 0.2],
          } : {}}
          transition={{ duration: 3, repeat: Infinity }}
        />
        
        {/* Shimmer effect on hover */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100"
          style={{
            background: "linear-gradient(110deg, transparent 40%, rgba(255, 100, 100, 0.1) 50%, transparent 60%)",
            backgroundSize: "200% 100%",
          }}
          animate={isHovered ? {
            backgroundPosition: ["0% 0%", "200% 0%"],
          } : {}}
          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
        />

        {/* Icon with enhanced animations */}
        <motion.div
          className="relative mb-6"
          whileHover={{ scale: 1.1 }}
        >
          <motion.div
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500/30 via-orange-500/30 to-red-600/30 flex items-center justify-center relative overflow-hidden shadow-lg shadow-red-500/20"
            animate={isHovered ? {
              boxShadow: [
                "0 0 20px rgba(239, 68, 68, 0.3)",
                "0 0 40px rgba(239, 68, 68, 0.5)",
                "0 0 20px rgba(239, 68, 68, 0.3)",
              ],
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {/* Pulsing ring */}
            <motion.div
              className="absolute inset-0 rounded-2xl border-2 border-red-400/50"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            
            {/* Icon with shake animation */}
            <motion.div
              animate={isHovered ? {
                rotate: [0, -5, 5, -5, 0],
                scale: [1, 1.1, 1],
              } : {}}
              transition={{ duration: 0.5, repeat: 2 }}
            >
              <Icon className="w-8 h-8 text-red-400 relative z-10" />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Title with slide-in effect */}
        <motion.h3
          className="text-2xl font-bold mb-3 text-foreground relative z-10"
          initial={{ x: -20, opacity: 0 }}
          animate={isInView ? { x: 0, opacity: 1 } : {}}
          transition={{ delay: delay + 0.2, duration: 0.6 }}
          whileHover={{ x: 5 }}
        >
          {title}
        </motion.h3>
        
        {/* Description with fade-in */}
        <motion.p
          className="text-muted-foreground leading-relaxed relative z-10"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: delay + 0.4, duration: 0.6 }}
        >
          {description}
        </motion.p>

        {/* Decorative corner accent */}
        <motion.div
          className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-red-500/10 to-transparent rounded-bl-full"
          animate={isHovered ? {
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.3, 0.1],
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>
    </motion.div>
  );
};

// Feature Card Component - Sleek & Minimalistic
const FeatureCard = ({ icon: Icon, title, description, gradient, delay }: {
  icon: any;
  title: string;
  description: string;
  gradient: string;
  delay: number;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative"
    >
      {/* Subtle glow on hover */}
      <motion.div
        className={`absolute -inset-px rounded-2xl bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-500`}
        animate={isHovered ? { opacity: 0.2 } : { opacity: 0 }}
      />
      
      {/* Main card - clean and minimal */}
      <motion.div
        whileHover={{ y: -8 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-2xl p-8 bg-card/40 backdrop-blur-sm border border-border/50 hover:border-border transition-all duration-300"
      >
        {/* Minimal gradient overlay on hover */}
        <motion.div
          className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`}
        />
        
        {/* Icon - sleek and minimal */}
        <motion.div
          className="relative mb-6"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center relative`}>
            <motion.div
              animate={isHovered ? {
                scale: [1, 1.1, 1],
              } : {}}
              transition={{ duration: 0.4 }}
            >
              <Icon className="w-6 h-6 text-white" />
            </motion.div>
          </div>
        </motion.div>

        {/* Title - clean typography */}
        <motion.h3
          className="text-xl font-semibold mb-3 text-foreground relative z-10"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: delay + 0.1, duration: 0.4 }}
        >
          {title}
        </motion.h3>
        
        {/* Description - minimal and readable */}
        <motion.p
          className="text-sm text-muted-foreground leading-relaxed relative z-10"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: delay + 0.2, duration: 0.4 }}
        >
          {description}
        </motion.p>

        {/* Subtle bottom accent line on hover */}
        <motion.div
          className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-b-2xl`}
        />
      </motion.div>
    </motion.div>
  );
};

// Step Card Component
const StepCard = ({ step, title, description, icon: Icon, index }: {
  step: string;
  title: string;
  description: string;
  icon: any;
  index: number;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.8, delay: index * 0.2 }}
      className="flex gap-6 items-start"
    >
      <div className="flex-shrink-0">
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-purple-500/25">
          {step}
        </div>
        {index < 2 && (
          <motion.div
            initial={{ scaleY: 0 }}
            animate={isInView ? { scaleY: 1 } : {}}
            transition={{ duration: 0.8, delay: index * 0.2 + 0.5 }}
            className="w-0.5 h-24 bg-gradient-to-b from-purple-500 to-transparent mx-auto mt-4"
          />
        )}
      </div>
      <div className="flex-1 glass rounded-2xl p-6 border border-purple-500/20">
        <div className="flex items-center gap-3 mb-3">
          <Icon className="w-6 h-6 text-purple-400" />
          <h3 className="text-2xl font-bold">{title}</h3>
        </div>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </motion.div>
  );
};

// Stat Card Component
const StatCard = ({ value, suffix, icon: Icon, color, index }: {
  value: string;
  suffix: string;
  icon: any;
  color: string;
  index: number;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (isInView && value !== "0" && value !== "24/7" && value !== "95%") {
      const target = parseInt(value.replace("x", ""));
      const duration = 2000;
      const steps = 60;
      const increment = target / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          setCount(target);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.05, y: -5 }}
      className="glass rounded-2xl p-8 text-center border border-purple-500/20 hover:border-purple-500/40 transition-all"
    >
      <Icon className={`w-8 h-8 mx-auto mb-4 ${color}`} />
      <div className={`text-5xl font-bold mb-2 ${color}`}>
        {value === "0" ? "0" : value === "24/7" ? "24/7" : value === "95%" ? "95%" : `${count}x`}
      </div>
      <div className="text-sm text-muted-foreground">{suffix}</div>
    </motion.div>
  );
};

// Pricing Card Component
const PricingCard = ({ name, price, period, description, features, cta, popular, index }: {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  popular: boolean;
  index: number;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{ y: -10, scale: 1.02 }}
      className={`glass rounded-2xl p-8 border transition-all relative overflow-hidden ${
        popular 
          ? "border-purple-500/40 shadow-lg shadow-purple-500/10 scale-105" 
          : "border-purple-500/20 hover:border-purple-500/40"
      }`}
    >
      {popular && (
        <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-violet-500 text-white text-xs font-medium px-3 py-1 rounded-bl-lg">
          Popular
        </div>
      )}
      <div className="mb-6">
        <h3 className="text-2xl font-bold mb-2">{name}</h3>
        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-4xl font-bold">{price}</span>
          {period && <span className="text-muted-foreground">{period}</span>}
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Button
        className={`w-full ${
          popular
            ? "bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600"
            : "variant-outline"
        }`}
        variant={popular ? "default" : "outline"}
      >
        {cta}
      </Button>
    </motion.div>
  );
};

// Typewriter Text Component - Fixed width to prevent layout shifts
const TypewriterText = ({ texts, className }: { texts: string[]; className?: string }) => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(100);

  // Find the longest text to set fixed width
  const longestText = texts.reduce((a, b) => a.length > b.length ? a : b);

  useEffect(() => {
    const currentText = texts[currentTextIndex];
    
    const handleTyping = () => {
      if (!isDeleting) {
        // Typing
        if (displayText.length < currentText.length) {
          setDisplayText(currentText.slice(0, displayText.length + 1));
          setTypingSpeed(100);
        } else {
          // Finished typing, wait then start deleting
          setTimeout(() => setIsDeleting(true), 2000);
          setTypingSpeed(50);
        }
      } else {
        // Deleting
        if (displayText.length > 0) {
          setDisplayText(currentText.slice(0, displayText.length - 1));
          setTypingSpeed(50);
        } else {
          // Finished deleting, move to next text
          setIsDeleting(false);
          setCurrentTextIndex((prev) => (prev + 1) % texts.length);
          setTypingSpeed(100);
        }
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [displayText, isDeleting, currentTextIndex, texts, typingSpeed]);

  return (
    <span 
      className={className}
      style={{ 
        display: "inline-block",
        minWidth: "100%",
        width: "100%",
        textAlign: "left"
      }}
    >
      <span style={{ 
        display: "inline-block",
        minWidth: `${longestText.length}ch`,
        width: `${longestText.length}ch`,
        textAlign: "left"
      }}>
        {displayText}
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
          className="inline-block w-0.5 h-[0.9em] bg-purple-400 ml-1 align-middle"
        />
      </span>
    </span>
  );
};

export default Landing;
