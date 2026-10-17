import { test } from "node:test";
import assert from "node:assert/strict";
import { leadBuckets, csvRows } from "../src/lib/workspace-model";
import { emailHtml } from "../src/lib/format";
test("reply text cannot become executable HTML", () => {
  assert.equal(
    emailHtml("<img src=x onerror=alert(1)> & hello\nNext"),
    "<p>&lt;img src=x onerror=alert(1)&gt; &amp; hello<br>Next</p>",
  );
});
test("CSV preserves commas, quotes and newlines", () => {
  assert.equal(
    csvRows([
      ["A,B", 'say "hello"'],
      ["line\nbreak", 7],
    ]),
    '"A,B","say ""hello"""\r\n"line\nbreak","7"',
  );
});
test("report bins count boundary dates once and exclude future and old records", () => {
  const now = new Date("2026-10-17T12:00:00Z");
  const leads = [
    "2026-10-10T12:00:00Z",
    "2026-10-11T12:00:00Z",
    "2026-10-17T12:00:00Z",
    "2026-10-18T12:00:00Z",
    "bad-date",
  ].map((created_at) => ({ created_at }));
  const bins = leadBuckets(leads, 7, now);
  assert.equal(bins.length, 7);
  assert.equal(
    bins.reduce((n, b) => n + b.count, 0),
    2,
  );
  assert.equal(bins[0].count, 1);
  assert.equal(bins[6].count, 1);
});
