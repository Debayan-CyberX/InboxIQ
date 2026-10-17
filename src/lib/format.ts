export function emailText(
  text: string | null | undefined,
  html?: string | null,
): string {
  if (text) return text;
  if (!html) return "";
  if (typeof DOMParser !== "undefined")
    return (
      new DOMParser().parseFromString(html, "text/html").body.textContent || ""
    );
  return html.replace(/<[^>]+>/g, " ");
}
export function errorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  return error instanceof Error ? error.message : fallback;
}

export function emailHtml(text: string): string {
  return `<p>${text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>")}</p>`;
}
