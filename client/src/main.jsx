import { createRoot } from "react-dom/client";
import { UserContextProvider } from "./context/UserContext.jsx";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { AppContextProvider } from "./context/AppContext";
import { CartProvider } from "./context/CartContext";
import { AddressProvider } from "./context/AddressContext";
import { MantineProvider } from "@mantine/core";
import { SocketProvider } from "./context/SocketContext.jsx";
import { NotificationProvider } from "./context/NotificationContext.jsx";
import { ChatbotProvider } from './context/ChatBoxContext.jsx';
import { SupportChatProvider } from './context/SupportChatContext.jsx';
createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AppContextProvider>
      <UserContextProvider>
        <CartProvider>
          <AddressProvider>
            <SocketProvider>
              <NotificationProvider>
                <ChatbotProvider>
                  <SupportChatProvider>
                    <App />
                  </SupportChatProvider>
                </ChatbotProvider>
              </NotificationProvider>
            </SocketProvider>
          </AddressProvider>
        </CartProvider>
      </UserContextProvider>
    </AppContextProvider>
  </BrowserRouter>
);
