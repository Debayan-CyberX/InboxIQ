import { useState } from "react";
import { ArrowUpRight, LoaderCircle } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { signIn, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { PasswordField } from "@/components/auth/PasswordField";
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
        <span className="auth-eyebrow">PICK UP THE CONVERSATION</span>
        <h1 className="auth-title">
          Welcome <em>back.</em>
        </h1>
        <p className="auth-description">Sign in to your InboxIQ workspace.</p>
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
          className="auth-fields"
          aria-busy={pending}
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
          <PasswordField
            label="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={pending}
          />
          {error && (
            <p role="alert" className="auth-error">
              {error}
            </p>
          )}
          <Button className="auth-submit" type="submit" disabled={pending}>
            {pending ? "Signing in..." : "Log in to your workspace"}
            {pending ? (
              <LoaderCircle className="auth-spinner" size={16} aria-hidden="true" />
            ) : (
              <ArrowUpRight size={16} aria-hidden="true" />
            )}
          </Button>
        </form>
        <p className="auth-alternate">
          New to InboxIQ?{" "}
          <Link to="/sign-up">Create a workspace</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
