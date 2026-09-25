import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import MyApp from "./MyApp";
import "./main.css";
import "./pages.css";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <MyApp />
  </BrowserRouter>,
);
