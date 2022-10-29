import { Outlet } from "react-router-dom";
import { Footer } from "./templates/Footer";
import { Header } from "./templates/Header";

function App() {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  );
}

export default App;
