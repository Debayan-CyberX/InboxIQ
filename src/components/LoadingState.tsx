export function LoadingState({
  message = "Loading workspace...",
}: {
  message?: string;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <div role="status" aria-label={message} className="py-5 space-y-6">
      <span className="sr-only">{message}</span>
      <div className="skeleton-line w-40 h-6" />
      <div className="skeleton-line w-72 max-w-full h-3" />
      <div className="border-t pt-6 space-y-5">
        {[0, 1, 2, 3].map((n) => (
          <div key={n} className="flex gap-4 items-center">
            <div className="skeleton-line w-8 h-8" />
            <div className="flex-1 space-y-2">
              <div className="skeleton-line w-1/3 h-3" />
              <div className="skeleton-line w-2/3 h-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
