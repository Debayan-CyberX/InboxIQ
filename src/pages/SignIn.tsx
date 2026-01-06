import { useState, useEffect } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { signIn, useSession } from "@/lib/auth-client";

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

  /* -------------------- REDIRECT WHEN LOGGED IN -------------------- */
  useEffect(() => {
    if (isPending) return;

    if (session) {
      navigate("/dashboard", { replace: true });
    }
  }, [session, isPending, navigate]);

  /* -------------------- BLOCK SIGN-IN PAGE WHEN LOGGED IN -------------------- */
  if (!isPending && session) {
    return <Navigate to="/dashboard" replace />;
  }

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
      } else {
        toast.success("Signed in successfully!");
        // ❗ DO NOT navigate here — redirect happens via useSession
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
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Sign in to InboxIQ</CardTitle>
          <CardDescription>
            Welcome back. Enter your credentials to continue.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
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
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || isPending}
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </Button>

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
  );
}
