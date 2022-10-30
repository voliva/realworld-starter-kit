import { createBrowserRouter, Location } from "react-router-dom";
import { Observable } from "rxjs";
import App from "./App";
import { Home } from "./Home/Home";
import { Login } from "./Login/Login";
import { Register } from "./Login/Register";
import { root } from "./root";
import { matchRoutes, matchPath } from "react-router-dom";
import { Article } from "./Article/Article";
import { RouterState } from "@remix-run/router";

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
      {
        id: "article",
        path: "article/:slug",
        element: <Article />,
      },
    ],
  },
]);

export const matchedRoutes$ = root.substate(
  () =>
    new Observable<ReturnType<typeof matchRoutes>>((obs) => {
      function update(state: RouterState) {
        const r = matchRoutes(router.routes, state.location);

        obs.next(r);
      }
      update(router.state);
      return router.subscribe(update);
    })
);
