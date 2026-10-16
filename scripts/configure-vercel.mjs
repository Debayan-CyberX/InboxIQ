import fs from "node:fs";

// Run after Render returns the actual deployed backend URL.
const backend = new URL(process.argv[2] || "https://invalid.local");
if (backend.protocol !== "https:" || !backend.hostname.endsWith(".onrender.com") ||
    backend.username || backend.password || backend.pathname !== "/" || backend.search || backend.hash) {
  throw new Error("Usage: node scripts/configure-vercel.mjs https://YOUR-SERVICE.onrender.com");
}
const file = new URL("../vercel.json", import.meta.url);
const config = JSON.parse(fs.readFileSync(file, "utf8"));
config.framework = "vite";
config.buildCommand = "npm run build";
config.outputDirectory = "dist";
config.rewrites = [
  { source: "/api/:path*", destination: `${backend.origin}/api/:path*` },
  { source: "/gmail/:path*", destination: `${backend.origin}/gmail/:path*` },
  { source: "/health", destination: `${backend.origin}/health` },
  { source: "/((?!assets/).*)", destination: "/index.html" },
];
fs.writeFileSync(file, JSON.stringify(config, null, 2) + "\n");
console.log("Vercel frontend and Render API proxy configured.");
