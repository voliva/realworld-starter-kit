import { Article } from "./Article/Article";
import { Home } from "./Home/Home";
import { Profile } from "./Profile/Profile";
import { useStateObservable } from "./react-bindings";
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
  const route = useStateObservable(activeRoute);
  return (
    <>
      <Header />
      {routes[route]}
      <Footer />
    </>
  );
}

export default App;
