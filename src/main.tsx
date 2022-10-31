import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { root } from "./root";

root.run();
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <React.Suspense fallback={null}>
      <App />
    </React.Suspense>
  </React.StrictMode>
);
