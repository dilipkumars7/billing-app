import AppRoutes from "./pages";
import { ConfigProvider } from 'antd';
import React from 'react';
import "./index.css";
import { AuthProvider } from "./auth/AuthProvider";
import { NotificationProvider } from './components/provider/NotificationProvider';
import { CssVarsProvider } from "@mui/joy/styles";
import theme from "./utils/muitheme";
import { Provider } from "react-redux";
import { store } from "./store/store";

const App: React.FC = () => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#0052CC',
          colorError: '#DE350B',
        },
      }}
    >
      <CssVarsProvider theme={theme}>
        <Provider store={store}>
          <AuthProvider>
            <NotificationProvider>
              <AppRoutes />
            </NotificationProvider>
          </AuthProvider>
        </Provider>
      </CssVarsProvider>
    </ConfigProvider>
  );
}

export default App;