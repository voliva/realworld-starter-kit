import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { root } from "./root";
import { router } from "./router";

root.run();
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <React.Suspense fallback={null}>
      <RouterProvider router={router} />
    </React.Suspense>
  </React.StrictMode>
);
