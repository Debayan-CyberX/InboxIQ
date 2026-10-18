import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import Brand from "@/components/Brand";
import ConversationVisual from "@/components/marketing/ConversationVisual";
import "./auth.css";

export function AuthLayout({ children }: { children: ReactNode }) {
  const [showArt, setShowArt] = useState(
    () => matchMedia("(min-width: 901px)").matches,
  );

  useEffect(() => {
    const desktop = matchMedia("(min-width: 901px)");
    const update = () => setShowArt(desktop.matches);
    desktop.addEventListener("change", update);
    return () => desktop.removeEventListener("change", update);
  }, []);

  return (
    <div className="auth-page auth-cinematic">
      <header className="auth-header">
        <Link to="/" aria-label="InboxIQ home">
          <Brand />
        </Link>
        <Link to="/" className="auth-home-link">
          <ArrowLeft size={14} aria-hidden="true" />
          Back to home
        </Link>
      </header>
      <aside className="auth-story" aria-label="A clearer connection">
        {showArt && (
          <div className="auth-art">
            <ConversationVisual />
          </div>
        )}
        <div className="auth-editorial-copy">
          <span className="auth-eyebrow">INTELLIGENCE, IN THE LOOP.</span>
          <h2>
            Every
            <br />
            conversation.
            <br />
            <em>An opportunity.</em>
          </h2>
          <p>
            A little less noise. A clearer next move.
            <br />
            Your conversations, with the context that matters.
          </p>
        </div>
        <div className="auth-story-footer">
          <span>CONVERSATION &rarr; CONTEXT &rarr; OPPORTUNITY</span>
          <ArrowUpRight size={16} aria-hidden="true" />
        </div>
      </aside>
      <main className="auth-form" id="auth-main">
        <div className="auth-card">
          <nav className="auth-switch" aria-label="Account access">
            <NavLink to="/sign-in">Log in</NavLink>
            <NavLink to="/sign-up">Create account</NavLink>
          </nav>
          {children}
        </div>
        <p className="auth-footnote">YOUR INBOX. RECONSIDERED.</p>
      </main>
    </div>
  );
}
