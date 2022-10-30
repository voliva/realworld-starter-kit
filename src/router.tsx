import { createHashRouter } from "react-router-dom";
import App from "./App";
import { Article } from "./Article/Article";
import { Home } from "./Home/Home";
import { Login } from "./Login/Login";
import { Register } from "./Login/Register";

export const router = createHashRouter([
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
      {
        id: "article",
        path: "article/:slug",
        element: <Article />,
      },
    ],
  },
]);
