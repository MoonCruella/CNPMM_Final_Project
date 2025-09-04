import { createRoot } from "react-dom/client";
import { UserContextProvider } from './context/UserContext.jsx';
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { AppContextProvider } from "./context/AppContext";
createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AppContextProvider>
      <UserContextProvider>
        <App />
      </UserContextProvider>
    </AppContextProvider>
  </BrowserRouter>
);
