import AppRoutes from "./pages";
import { ConfigProvider } from 'antd';
import React from 'react';
import "./index.css";

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
      <AppRoutes />
    </ConfigProvider>
  );
}

export default App;