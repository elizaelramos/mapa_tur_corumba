import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { ConfigProvider } from 'antd'
import ptBR from 'antd/locale/pt_BR'
import App from './App.jsx'
import { store } from './store'
import './index.css'
import 'leaflet/dist/leaflet.css'

const theme = {
  token: {
    colorPrimary: '#1F3473', // Azul Escuro da Prefeitura
    colorLink: '#40A1E6', // Azul Claro da Prefeitura
    colorInfo: '#40A1E6',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
  },
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <ConfigProvider locale={ptBR} theme={theme}>
        <App />
      </ConfigProvider>
    </Provider>
  </React.StrictMode>,
)
