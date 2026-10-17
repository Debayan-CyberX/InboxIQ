import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import Brand from "@/components/Brand";
import { ConversationFallback } from "@/components/marketing/ConversationVisual";
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-page">
      <aside className="auth-story">
        <Link to="/">
          <Brand />
        </Link>
        <ConversationFallback className="auth-sculpture" />
        <div className="auth-editorial-copy">
          <span className="label-overline block mb-6">
            THE INTELLIGENT SALES INBOX
          </span>
          <h2>
            Every
            <br />
            conversation.
            <br />
            <em>An opportunity.</em>
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
