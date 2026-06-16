import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App.jsx';
import './App.css';
import { AppAuthProvider } from './lib/auth.jsx';
import store from './store/store.js';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppAuthProvider>
      <Provider store={store}>
        <App />
      </Provider>
    </AppAuthProvider>
  </StrictMode>
);
