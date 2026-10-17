import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { signIn, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { errorMessage } from "@/lib/format";
export default function SignIn() {
  const { data } = useSession();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  if (data?.session) return <Navigate to="/dashboard" replace />;
  return (
    <AuthLayout>
      <div className="auth-form-inner">
        <h1 className="text-[27px] tracking-tight font-medium">
          Welcome back.
        </h1>
        <p className="text-xs text-muted-foreground mt-3 mb-8">
          Sign in to your InboxIQ workspace.
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setPending(true);
            setError("");
            try {
              const result = await signIn.email({ email, password });
              if (result.error)
                throw new Error(
                  result.error.message || "Email or password is incorrect.",
                );
              navigate("/dashboard", { replace: true });
            } catch (err) {
              setError(
                errorMessage(err, "Sign-in could not be completed. Try again."),
              );
            } finally {
              setPending(false);
            }
          }}
          className="space-y-5"
        >
          <label className="form-field">
            <span>Email</span>
            <input
              className="form-input"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              disabled={pending}
            />
          </label>
          <label className="form-field">
            <span>Password</span>
            <input
              className="form-input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={pending}
            />
          </label>
          {error && (
            <p
              role="alert"
              className="text-xs text-destructive leading-relaxed"
            >
              {error}
            </p>
          )}
          <Button className="w-full" type="submit" disabled={pending}>
            {pending ? "Signing in..." : "Sign In"}
          </Button>
        </form>
        <p className="text-[11px] text-muted-foreground mt-6">
          New to InboxIQ?{" "}
          <Link
            to="/sign-up"
            className="text-foreground underline underline-offset-4"
          >
            Create a workspace
          </Link>
        </p>
        <Link to="/" className="section-link mt-9">
          Back to InboxIQ
        </Link>
      </div>
    </AuthLayout>
  );
}
