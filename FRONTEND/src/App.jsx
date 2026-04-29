import './App.css';
import AppRoutes from './AppRoutes';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(8, 17, 31, 0.95)',
            color: '#f4f7fb',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            backdropFilter: 'blur(18px)',
          },
        }}
      />
      <AppRoutes />
    </>
  );
}

export default App;
