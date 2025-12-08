import AppRoutes from "./pages";
import { ConfigProvider } from 'antd';
import React from 'react';
import "./index.css";
import { AuthProvider } from "./auth/AuthProvider";
import { NotificationProvider } from './components/provider/NotificationProvider';
import { Provider } from "react-redux";
import { store } from "./store/store";
import { OverlayLoaderProvider, useOverlayLoader } from './context/OverlayLoaderContext';
import { OverlayLoader } from "./components/OverlayLoader";
import AntdTheme from "./utils/antdtheme";

const App: React.FC = () => {
  return (
    <ConfigProvider theme={AntdTheme}>
      <Provider store={store}>
        <AuthProvider>
          <NotificationProvider>
            <OverlayLoaderProvider>
              <OverlayLoaderRoot />
              <AppRoutes />
            </OverlayLoaderProvider>
          </NotificationProvider>
        </AuthProvider>
      </Provider>
    </ConfigProvider>
  );
}

function OverlayLoaderRoot() {
  const { visible } = useOverlayLoader();
  return <OverlayLoader visible={visible} />;
} 

export default App;