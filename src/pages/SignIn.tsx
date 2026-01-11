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

import { Sparkles, Mail, Lock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/auth/AuthLayout";

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

      // Add timeout for mobile networks (20 seconds max)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error("Request timed out. Please check your connection and try again."));
        }, 20000);
      });

      const signInPromise = signIn.email({
        email,
        password,
      });

      const result = await Promise.race([signInPromise, timeoutPromise]) as any;

      console.log("📥 Sign in result:", result);

      if (result?.error) {
        let message = result.error.message || "Failed to sign in";
        // Improve error messages for mobile users
        if (message.toLowerCase().includes("network") || message.toLowerCase().includes("fetch") || message.toLowerCase().includes("timeout")) {
          message = "Network error. Please check your connection and try again.";
        } else if (message.toLowerCase().includes("invalid") || message.toLowerCase().includes("credential")) {
          message = "Invalid email or password. Please check your credentials.";
        }
        setError(message);
        toast.error("Sign in failed", { description: message });
        setIsSubmitting(false);
      } else {
        // Navigate immediately after successful sign in
        navigate("/dashboard", { replace: true });
        // Don't set isSubmitting to false here since we're navigating
      }
    } catch (err) {
      console.error("❌ Sign in error:", err);

      let message = "An error occurred during sign in. Please try again.";
      
      if (err instanceof Error) {
        message = err.message;
        // Provide user-friendly messages for common mobile errors
        if (err.message.includes("timeout") || err.message.includes("Network") || err.message.includes("fetch")) {
          message = "Network error. Please check your internet connection and try again.";
        } else if (err.message.includes("Invalid credentials") || err.message.includes("password") || err.message.includes("email")) {
          message = "Invalid email or password. Please check your credentials.";
        }
      }

      setError(message);
      toast.error("Sign in failed", { description: message });
      setIsSubmitting(false);
    }
  };

  /* -------------------- UI -------------------- */
  return (
    <AuthLayout>
      <div className="min-h-screen flex items-center justify-center px-4">
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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 relative z-10">
            <motion.div
              whileHover={!isSubmitting ? { scale: 1.02 } : {}}
              whileTap={!isSubmitting ? { scale: 0.98 } : {}}
              className="w-full"
            >
              <Button
                type="submit"
                className="w-full relative overflow-hidden"
                disabled={isSubmitting}
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
    </AuthLayout>
  );
}
