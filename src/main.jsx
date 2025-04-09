import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { MyContextProvider } from './MyContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MyContextProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </MyContextProvider>
  </React.StrictMode>
);