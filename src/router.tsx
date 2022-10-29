import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import { Home } from "./Home/Home";
import { Login } from "./Login/Login";
import { Register } from "./Login/Register";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "",
        element: <Home />,
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "register",
        element: <Register />,
      },
    ],
  },
]);
