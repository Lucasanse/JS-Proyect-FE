import Home from "./pages/Home/Home";
import "./App.css";
import Detalles from "./pages/Detalles/Detalles.jsx";
import { useTranslation } from "react-i18next";
import { getLocalStorage } from "./services/localStorage.js";
import { useLanguage } from "./Hooks/useLanguage.jsx";

function App() {
  const targetRef = useRef(null);
  const { i18n } = useTranslation();
  useLanguage();

  const handleScroll = () => {
    targetRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });
  };

  return <Home handleScroll={handleScroll} />;
}

export default App;
