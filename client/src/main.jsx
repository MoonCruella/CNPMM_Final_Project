import { createRoot } from "react-dom/client";
import { UserContextProvider } from "./context/UserContext.jsx";
import "./index.css";
import App from "./App.jsx";
import { Provider } from 'react-redux';
import { store } from './redux/store';
import { BrowserRouter } from "react-router-dom";
import { AppContextProvider } from "./context/AppContext";
import { CartProvider } from "./context/CartContext";
import { AddressProvider } from "./context/AddressContext";
import { MantineProvider } from "@mantine/core";
import { SocketProvider } from "./context/SocketContext.jsx";
import { NotificationProvider } from "./context/NotificationContext.jsx";
import { ChatbotProvider } from './context/ChatBoxContext.jsx';
import { SupportChatProvider } from './context/SupportChatContext.jsx';
import { initTokenRefresh } from './services/api';
const cleanup = initTokenRefresh();
// Cleanup khi app unmount (cho hot reload trong development)
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    console.log('Cleaning up token refresh system');
    cleanup();
  });
}
createRoot(document.getElementById("root")).render(
  <BrowserRouter>
  <Provider store={store}>
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
    </Provider>
  </BrowserRouter>
);
