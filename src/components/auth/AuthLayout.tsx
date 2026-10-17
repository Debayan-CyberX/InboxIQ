import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import Brand from "@/components/Brand";
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-page">
      <aside className="auth-story">
        <Link to="/">
          <Brand />
        </Link>
        <div>
          <span className="label-overline block mb-6">
            THE INTELLIGENT SALES INBOX
          </span>
          <h2>
            Every conversation.
            <br />A clearer next step.
          </h2>
          <p>
            A considered workspace for the relationships, decisions, and
            opportunities in your inbox.
          </p>
        </div>
        <p className="!text-[10px]">InboxIQ / Built around your judgment.</p>
      </aside>
      <main className="auth-form">
        <Link to="/" className="mobile-only mb-8">
          <Brand />
        </Link>
        {children}
      </main>
    </div>
  );
}
