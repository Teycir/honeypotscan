'use client';

import { useEffect, useState } from 'react';

export function LoadingScreen() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)',
      zIndex: 10000,
      opacity: show ? 1 : 0,
      transition: 'opacity 0.8s ease',
      pointerEvents: show ? 'auto' : 'none'
    }}>
      <div style={{
        fontSize: '18px',
        fontWeight: 600,
        color: '#fff',
        marginBottom: '20px',
        animation: 'textFade 2s ease-in-out infinite'
      }}>
        Initializing HoneypotScan...
      </div>
      <div style={{
        width: '200px',
        height: '3px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '10px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{
          height: '100%',
          background: 'linear-gradient(90deg, #3b82f6, #60a5fa, #3b82f6)',
          backgroundSize: '200% 100%',
          animation: 'progressSlide 1.5s ease-in-out infinite',
          boxShadow: '0 0 20px rgba(59, 130, 246, 0.8)'
        }} />
      </div>
      <style jsx>{`
        @keyframes lockPulse {
          0%, 100% {
            transform: scale(1);
            filter: drop-shadow(0 0 30px rgba(59, 130, 246, 0.8));
          }
          50% {
            transform: scale(1.1);
            filter: drop-shadow(0 0 50px rgba(59, 130, 246, 1));
          }
        }
        @keyframes textFade {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes progressSlide {
          0% {
            width: 0%;
            background-position: 0% 50%;
          }
          50% {
            width: 100%;
            background-position: 100% 50%;
          }
          100% {
            width: 0%;
            background-position: 0% 50%;
          }
        }
      `}</style>
    </div>
  );
}
