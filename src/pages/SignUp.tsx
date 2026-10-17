import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { signUp, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/auth/AuthLayout";
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
        <h1 className="text-[27px] tracking-tight font-medium">
          Your next chapter,
          <br />
          in one workspace.
        </h1>
        <p className="text-xs text-muted-foreground mt-3 mb-7">
          Create your InboxIQ account.
        </p>
        <form
          className="space-y-4"
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
          <div className="form-row">
            <label className="form-field">
              <span>Password</span>
              <input
                className="form-input"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={pending}
              />
            </label>
            <label className="form-field">
              <span>Confirm password</span>
              <input
                className="form-input"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                disabled={pending}
              />
            </label>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Use at least 8 characters.
          </p>
          {error && (
            <p
              role="alert"
              className="text-xs text-destructive leading-relaxed"
            >
              {error}
            </p>
          )}
          <Button className="w-full" type="submit" disabled={pending}>
            {pending ? "Creating workspace..." : "Create workspace"}
          </Button>
        </form>
        <p className="text-[11px] text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link
            to="/sign-in"
            className="text-foreground underline underline-offset-4"
          >
            Log in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
