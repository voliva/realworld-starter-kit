import { interval } from "rxjs";
import { useStateObservable } from "./react-bindings";
import { root } from "./root";
import { Footer } from "./templates/Footer";
import { Header } from "./templates/Header";
import { Home } from "./templates/Home";

const count$ = root.substate(() => interval(1000));

function App() {
  const count = useStateObservable(count$);

  return (
    <>
      <Header />
      <Home />
      <Footer />
    </>
  );
}

export default App;
