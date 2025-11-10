import AppRoutes from "./pages";
import { ConfigProvider } from 'antd';
import React from 'react';
import "./index.css";
import { AuthProvider } from "./auth/AuthProvider";
import { NotificationProvider } from './components/provider/NotificationProvider';

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
      <AuthProvider>
        <NotificationProvider>
          <AppRoutes />
        </NotificationProvider>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;