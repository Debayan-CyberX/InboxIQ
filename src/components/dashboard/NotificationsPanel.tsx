import { Bell, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQueue } from "@/hooks/use-workspace-data";
export default function NotificationsPanel() {
  const { data: tasks = [] } = useQueue();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="icon-button relative" aria-label="Open updates">
          <Bell size={15} />
          {tasks.length > 0 && (
            <span className="absolute right-1 top-1 bg-primary rounded-full w-1 h-1" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="px-4 py-3 border-b">
          <h2 className="text-xs font-medium">Workspace updates</h2>
        </div>
        {tasks.length ? (
          <div className="divide-y max-h-80 overflow-auto">
            {tasks.slice(0, 6).map((task) => (
              <Link
                className="block p-4 hover:bg-muted/50"
                to={task.type === "followup" ? "/leads" : "/drafts"}
                key={task.id}
              >
                <p className="text-xs flex justify-between gap-3">
                  {task.title}
                  <ArrowUpRight size={12} />
                </p>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                  {task.description}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-7 text-center">
            <p className="text-xs">You're up to date.</p>
            <p className="text-[11px] text-muted-foreground mt-2">
              Follow-ups and draft reviews will appear here when there's work to
              do.
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
