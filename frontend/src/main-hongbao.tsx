import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HongbaoDemo } from './components/Hongbao/HongbaoDemo';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      background: '#1a1a1a'
    }}>
      <HongbaoDemo />
    </div>
  </StrictMode>,
);
