import { createRoot } from "react-dom/client";
import { UserContextProvider } from "./context/UserContext.jsx";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { AppContextProvider } from "./context/AppContext";
import { CartProvider } from "./context/CartContext";
import { AddressProvider } from "./context/AddressContext";
import { MantineProvider } from "@mantine/core";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AppContextProvider>
      <UserContextProvider>
        <CartProvider>
          <AddressProvider>
            <App />
          </AddressProvider>
        </CartProvider>
      </UserContextProvider>
    </AppContextProvider>
  </BrowserRouter>
);
