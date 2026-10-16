import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Sparkles } from "lucide-react";
import Brand from "@/components/Brand";
export const AuthLayout = ({ children }: { children: ReactNode }) => (
  <div className="iq-auth">
    <aside className="iq-auth-story">
      <Link to="/">
        <Brand />
      </Link>
      <div>
        <span className="iq-eyebrow">
          <span className="iq-dot" />A LITTLE MORE INTENTIONAL
        </span>
        <h2>
          Great relationships.
          <br />
          <em>Clearer possibilities.</em>
        </h2>
        <p>
          Your conversations have somewhere to go.
          <br />
          Give them a workspace that keeps up.
        </p>
        <span className="iq-auth-symbol">
          <ArrowUpRight strokeWidth={0.7} />
        </span>
      </div>
      <span className="text-[10px] text-muted-foreground">
        A calmer way to make every conversation count.
      </span>
    </aside>
    <main className="iq-auth-form">
      <Link to="/" className="lg:hidden mb-10">
        <Brand />
      </Link>
      {children}
      <p className="text-[10px] text-muted-foreground mt-8 flex items-center justify-center gap-2">
        <Sparkles size={12} />
        More room for your best work.
      </p>
    </main>
  </div>
);
