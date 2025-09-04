import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { AppContextProvider } from "./context/AppContext";
import { CartProvider } from "./context/CartContext";
createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AppContextProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </AppContextProvider>
  </BrowserRouter>
);
