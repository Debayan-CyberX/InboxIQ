import { useState } from "react";
import { ArrowUpRight, LoaderCircle } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { signUp, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { PasswordField } from "@/components/auth/PasswordField";
import { errorMessage } from "@/lib/format";
export default function SignUp() {
  const { data } = useSession();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  if (data?.session) return <Navigate to="/dashboard" replace />;
  return (
    <AuthLayout>
      <div className="auth-form-inner">
        <span className="auth-eyebrow">A CLEARER CONNECTION</span>
        <h1 className="auth-title">
          Your next chapter,
          <br />
          <em>in one workspace.</em>
        </h1>
        <p className="auth-description">Create your InboxIQ account.</p>
        <form
          className="auth-fields"
          aria-busy={pending}
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            if (password !== confirm) {
              setError("Your passwords do not match.");
              return;
            }
            setPending(true);
            try {
              const result = await signUp.email({ name, email, password });
              if (result.error)
                throw new Error(
                  result.error.message || "Account could not be created.",
                );
              navigate("/dashboard", { replace: true });
            } catch (err) {
              setError(errorMessage(err));
            } finally {
              setPending(false);
            }
          }}
        >
          <label className="form-field">
            <span>Full name</span>
            <input
              className="form-input"
              autoComplete="name"
              placeholder="Alex Morgan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={pending}
            />
          </label>
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
          <div className="auth-password-row">
            <PasswordField
              label="Password"
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-describedby="password-hint"
              required
              disabled={pending}
            />
            <PasswordField
              label="Confirm password"
              autoComplete="new-password"
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              disabled={pending}
            />
          </div>
          <p className="auth-hint" id="password-hint">
            Use at least 8 characters.
          </p>
          {error && (
            <p role="alert" className="auth-error">
              {error}
            </p>
          )}
          <Button className="auth-submit" type="submit" disabled={pending}>
            {pending ? "Creating workspace..." : "Create workspace"}
            {pending ? (
              <LoaderCircle className="auth-spinner" size={16} aria-hidden="true" />
            ) : (
              <ArrowUpRight size={16} aria-hidden="true" />
            )}
          </Button>
        </form>
        <p className="auth-alternate">
          Already have an account?{" "}
          <Link to="/sign-in">Log in</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
