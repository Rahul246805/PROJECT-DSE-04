import './App.css'
import AppRoutes from './AppRoutes'
import { Toaster } from 'react-hot-toast'

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#16202c',
            color: '#f4f7fb',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          },
        }}
      />
      <AppRoutes />
    </>
  )
}

export default App
