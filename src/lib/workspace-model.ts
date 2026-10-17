export interface ReportBucket {
  label: string;
  count: number;
  start: number;
  end: number;
}
export function leadBuckets(
  leads: ReadonlyArray<{ created_at: string }>,
  days: number,
  now = new Date(),
): ReportBucket[] {
  const end = now.getTime();
  const span = days * 86400000;
  const start = end - span;
  return Array.from({ length: 7 }, (_, i) => {
    const from = start + (span * i) / 7;
    const to = start + (span * (i + 1)) / 7;
    return {
      start: from,
      end: to,
      label: new Date(to).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      count: leads.filter((l) => {
        const time = new Date(l.created_at).getTime();
        return time > from && time <= to;
      }).length,
    };
  });
}
export function csvRows(
  rows: ReadonlyArray<ReadonlyArray<string | number>>,
): string {
  return rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
    .join("\r\n");
}
