import { Link } from "react-router-dom";
import { Check, ArrowUpRight } from "lucide-react";
import Brand from "@/components/Brand";
export default function Test() {
  return (
    <div className="not-found-page">
      <Link to="/">
        <Brand />
      </Link>
      <main className="not-found-content">
        <span>INBOXIQ / RENDER CHECK</span>
        <h1>All connected.</h1>
        <p>
          <Check size={15} className="inline mr-2" />
          React is rendering correctly.
          <br />
          Local browser time: {new Date().toLocaleTimeString()}
        </p>
        <Link to="/dashboard">
          Open your workspace
          <ArrowUpRight size={17} />
        </Link>
      </main>
      <p className="not-found-footer">FRONTEND DIAGNOSTIC</p>
    </div>
  );
}
