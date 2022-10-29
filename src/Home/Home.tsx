import { Suspense } from "react";
import { Articles } from "./Articles";
import { SideBar } from "./SideBar";

export const Home = () => {
  return (
    <div className="home-page">
      <div className="banner">
        <div className="container">
          <h1 className="logo-font">conduit</h1>
          <p>A place to share your knowledge.</p>
        </div>
      </div>

      <div className="container page">
        <div className="row">
          <Articles />

          <SideBar />
        </div>
      </div>
    </div>
  );
};
