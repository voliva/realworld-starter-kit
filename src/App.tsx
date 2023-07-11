import { Article } from "./Article/Article";
import { Home } from "./Home/Home";
import { Profile } from "./Profile/Profile";
import { useStateNode } from "@react-rxjs/context-state";
import { activeRoute } from "./router";
import { Footer } from "./templates/Footer";
import { Header } from "./templates/Header";

const routes = {
  none: null,
  home: <Home />,
  article: <Article />,
  profile: <Profile />,
};

function App() {
  activeRoute.getState$().subscribe((v) => console.log(v));
  const route = useStateNode(activeRoute);

  return (
    <>
      <Header />
      {routes[route]}
      <Footer />
    </>
  );
}

export default App;
