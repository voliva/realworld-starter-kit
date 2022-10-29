import { useStateObservable } from "../react-bindings";
import { isLoggedIn$ } from "../user";
import { Articles } from "./Articles";
import { SideBar } from "./SideBar";

export const Home = () => {
  const isLoggedIn = useStateObservable(isLoggedIn$);

  return (
    <div className="home-page">
      {isLoggedIn ? null : (
        <div className="banner">
          <div className="container">
            <h1 className="logo-font">conduit</h1>
            <p>A place to share your knowledge.</p>
          </div>
        </div>
      )}

      <div className="container page">
        <div className="row">
          <Articles />

          <SideBar />
        </div>
      </div>
    </div>
  );
};
