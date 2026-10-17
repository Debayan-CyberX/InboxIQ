import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import Brand from "@/components/Brand";
export default function NotFound() {
  return (
    <div className="not-found-page">
      <Link to="/" aria-label="InboxIQ home">
        <Brand />
      </Link>
      <main className="not-found-content">
        <span>404 / A THREAD OUT OF PLACE</span>
        <h1>Let's reconnect.</h1>
        <p>
          This page isn't part of the conversation. Head back to InboxIQ to find
          your next move.
        </p>
        <Link to="/">
          Return to InboxIQ
          <ArrowUpRight size={17} />
        </Link>
      </main>
      <p className="not-found-footer">EVERY CONVERSATION. AN OPPORTUNITY.</p>
    </div>
  );
}
