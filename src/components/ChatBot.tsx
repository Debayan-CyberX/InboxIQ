import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight, MessageSquare, Send, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { getApiBase } from "@/lib/api/base-url";
interface Message {
  role: "user" | "assistant";
  content: string;
}
export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const { pathname } = useLocation();
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("inboxiq:assistant", handler);
    return () => window.removeEventListener("inboxiq:assistant", handler);
  }, []);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "auto" });
  }, [messages, pending]);
  async function send() {
    if (!input.trim() || pending) return;
    const message = input.trim();
    setInput("");
    setMessages((list) => [...list, { role: "user", content: message }]);
    setPending(true);
    setError("");
    try {
      const r = await fetch(`${getApiBase()}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message,
          conversationHistory: messages.slice(-5),
        }),
      });
      const data = await r.json();
      if (!r.ok)
        throw new Error(
          data.message ||
            "The assistant is unavailable right now. Your work is saved; try again later.",
        );
      setMessages((list) => [
        ...list,
        {
          role: "assistant",
          content:
            data.response || "No response was returned. Please try again.",
        },
      ]);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not reach the assistant.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="assistant-sheet w-full sm:max-w-[410px] flex flex-col p-0 gap-0">
        <SheetHeader className="p-5 border-b text-left">
          <SheetTitle className="text-sm font-medium flex gap-2 items-center">
            <MessageSquare size={15} />
            Workspace assistant
          </SheetTitle>
          <SheetDescription className="text-[11px]">
            Working alongside your {pathname.slice(1) || "workspace"}. You
            review every action.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-auto p-5">
          {messages.length === 0 && (
            <>
              <p className="text-lg font-normal tracking-tight mt-5 mb-3">
                A second perspective,
                <br />
                when you need it.
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground mb-6">
                Ask about your workflow, or go directly to the next step. The
                assistant never sends email on your behalf.
              </p>
              <div className="divide-y border-y mb-7">
                {[
                  { to: "/leads", title: "Review follow-ups" },
                  { to: "/drafts", title: "Approve a draft" },
                  {
                    to: "/settings?tab=email",
                    title: "Manage email connections",
                  },
                ].map((action) => (
                  <Link
                    key={action.to}
                    to={action.to}
                    onClick={() => setOpen(false)}
                    className="flex justify-between items-center py-3 text-xs"
                  >
                    {action.title}
                    <ArrowUpRight size={13} className="text-muted-foreground" />
                  </Link>
                ))}
              </div>
              <button
                className="text-[11px] text-primary text-left"
                onClick={() =>
                  setInput("How should I organize my follow-up workflow?")
                }
              >
                How should I organize my follow-ups?
              </button>
            </>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`mb-6 ${m.role === "user" ? "pl-6" : ""}`}>
              <p className="text-[11px] text-muted-foreground mb-2 uppercase tracking-wider">
                {m.role === "user" ? "You" : "Assistant"}
              </p>
              <p
                className={`text-xs whitespace-pre-wrap leading-relaxed ${m.role === "user" ? "bg-muted rounded-md px-3 py-2" : ""}`}
              >
                {m.content}
              </p>
            </div>
          ))}
          {pending && (
            <p
              role="status"
              className="flex gap-2 text-[11px] text-muted-foreground items-center"
            >
              <Loader2 size={12} className="animate-spin" />
              Considering your question...
            </p>
          )}
          {error && (
            <p
              role="alert"
              className="text-xs text-destructive leading-relaxed"
            >
              {error}
            </p>
          )}
          <div ref={end} />
        </div>
        <form
          className="border-t p-4"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <label className="sr-only" htmlFor="assistant-message">
            Message the assistant
          </label>
          <div className="flex gap-2">
            <textarea
              id="assistant-message"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={2}
              className="form-input resize-none text-xs"
              placeholder="Ask about your next step..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <Button
              size="icon"
              type="submit"
              disabled={pending || !input.trim()}
              aria-label="Send assistant message"
            >
              <Send size={14} />
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            AI suggestions can be imperfect. Review before acting.
          </p>
        </form>
      </SheetContent>
    </Sheet>
  );
}
