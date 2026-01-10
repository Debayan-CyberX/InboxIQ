import { useState, useEffect } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { signIn, useSession } from "@/lib/auth-client";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SignInTransition } from "@/components/transitions/SignInTransition";

import { Sparkles, Mail, Lock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function SignIn() {
  /* -------------------- AUTH STATE -------------------- */
  const navigate = useNavigate();
  const { data, isPending } = useSession();
  const session = data?.session;

  /* -------------------- FORM STATE -------------------- */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Redirect if already signed in
  useEffect(() => {
    if (!isPending && session) {
      navigate("/dashboard", { replace: true });
    }
  }, [session, isPending, navigate]);

  /* -------------------- SUBMIT HANDLER -------------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      console.log("🔄 Attempting to sign in...");

      const result = await signIn.email({
        email,
        password,
      });

      console.log("📥 Sign in result:", result);

      if (result?.error) {
        const message = result.error.message || "Failed to sign in";
        setError(message);
        toast.error("Sign in failed", { description: message });
        setIsSubmitting(false);
      } else {
        // Start transition animation
        setIsTransitioning(true);
        
        // Wait for transition animation to complete, then navigate
        setTimeout(async () => {
          try {
            // Small delay to allow cookie to be set
            await new Promise(resolve => setTimeout(resolve, 200));
            navigate("/dashboard", { 
              replace: true,
              state: { fromSignIn: true } // Pass state to indicate transition
            });
          } catch (navError) {
            console.error("Navigation error:", navError);
            navigate("/dashboard", { 
              replace: true,
              state: { fromSignIn: true }
            });
          }
        }, 500); // Match transition duration
      }
    } catch (err) {
      console.error("❌ Sign in error:", err);

      const message =
        err instanceof Error
          ? err.message
          : "Unexpected error during sign in";

      setError(message);
      toast.error("Sign in failed", { description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* -------------------- UI -------------------- */
  return (
    <SignInTransition 
      isTransitioning={isTransitioning}
      onTransitionComplete={() => {
        // Transition complete callback (optional)
      }}
    >
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md relative overflow-hidden">
          {/* Subtle glow effect on card when submitting */}
          {isSubmitting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: [0.3, 0.6, 0.3],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 bg-gradient-to-r from-[#7C3AED]/10 via-[#22D3EE]/10 to-[#7C3AED]/10 pointer-events-none"
            />
          )}
        <CardHeader className="space-y-2 text-center relative z-10">
          <div className="flex justify-center">
            <motion.div
              animate={isSubmitting ? { 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              } : {}}
              transition={{ 
                duration: 1.5, 
                repeat: isSubmitting ? Infinity : 0,
                ease: "easeInOut"
              }}
            >
              <Sparkles className="h-8 w-8 text-primary" />
            </motion.div>
          </div>
          <CardTitle className="text-2xl">Sign in to InboxIQ</CardTitle>
          <CardDescription>
            Welcome back. Enter your credentials to continue.
          </CardDescription>
        </CardHeader>

          <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 relative z-10">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  required
                  disabled={isSubmitting || isTransitioning}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  required
                  disabled={isSubmitting || isTransitioning}
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 relative z-10">
            <motion.div
              whileHover={!isSubmitting && !isTransitioning ? { scale: 1.02 } : {}}
              whileTap={!isSubmitting && !isTransitioning ? { scale: 0.98 } : {}}
              className="w-full"
            >
              <Button
                type="submit"
                className="w-full relative overflow-hidden"
                disabled={isSubmitting || isPending || isTransitioning}
              >
                {/* Glow effect on button */}
                {isSubmitting && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-[#7C3AED] via-[#22D3EE] to-[#7C3AED] opacity-30"
                    animate={{
                      x: ["-100%", "100%"],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                )}
                <span className="relative z-10">
                  {isSubmitting ? "Signing in..." : "Sign In"}
                </span>
              </Button>
            </motion.div>

            <p className="text-sm text-muted-foreground">
              Don’t have an account?{" "}
              <Link
                to="/sign-up"
                className="text-primary hover:underline"
              >
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
    </SignInTransition>
  );
}
