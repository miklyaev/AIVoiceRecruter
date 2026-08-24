import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AdminPage } from './components/AdminPage';
import './index.css';

const RootComponent = window.location.pathname.startsWith('/admin') ? AdminPage : App;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RootComponent />
  </React.StrictMode>
);