// Ultra simple version to test
console.log("🔵 main-debug.tsx STARTING");

const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("❌ Root element not found!");
  document.body.innerHTML =
    '<h1 style="color: red; padding: 2rem;">ERROR: Root element not found!</h1>';
} else {
  console.log("✅ Root element found:", rootElement);

  // Try to render something simple first
  rootElement.innerHTML = `
    <div style="padding: 2rem; font-family: system-ui; background: #000; color: #0f0;">
      <h1>✅ JavaScript is Working!</h1>
      <p>main-debug.tsx loaded successfully</p>
      <p>Now trying to load React...</p>
    </div>
  `;

  // Now try to load React
  import("react-dom/client")
    .then(({ createRoot }) => {
      console.log("✅ React DOM loaded");
      import("./App.tsx")
        .then(({ default: App }) => {
          console.log("✅ App component loaded");
          const root = createRoot(rootElement);
          root.render(<App />);
          console.log("✅ App rendered!");
        })
        .catch((err) => {
          console.error("❌ Failed to load App:", err);
          rootElement.innerHTML += `<div style="color: red; margin-top: 1rem;"><h2>Error loading App:</h2><pre>${err}</pre></div>`;
        });
    })
    .catch((err) => {
      console.error("❌ Failed to load React:", err);
      rootElement.innerHTML += `<div style="color: red; margin-top: 1rem;"><h2>Error loading React:</h2><pre>${err}</pre></div>`;
    });
}

console.log("🔵 main-debug.tsx FINISHED");
