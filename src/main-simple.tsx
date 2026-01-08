// Ultra-simple test to verify React works
import { createRoot } from "react-dom/client";

console.log("main-simple.tsx loaded!");

const rootElement = document.getElementById("root");

if (!rootElement) {
  document.body.innerHTML = '<h1 style="color: red;">ERROR: Root element not found!</h1>';
} else {
  console.log("Root element found, rendering...");
  const root = createRoot(rootElement);
  root.render(
    <div style={{ 
      padding: "2rem", 
      fontFamily: "system-ui",
      background: "#000",
      color: "#0f0",
      minHeight: "100vh"
    }}>
      <h1>✅ React is Working!</h1>
      <p>If you see this, React is rendering correctly.</p>
      <p>Time: {new Date().toLocaleTimeString()}</p>
    </div>
  );
  console.log("Render complete!");
}













