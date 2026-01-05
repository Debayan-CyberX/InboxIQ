import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Using non-null assertion (!) - make sure root element exists in index.html
createRoot(document.getElementById("root")!).render(<App />);
