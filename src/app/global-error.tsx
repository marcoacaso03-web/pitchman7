"use client";

import { PT_Sans } from 'next/font/google';

const ptSans = PT_Sans({ 
  weight: ['400', '700'], 
  subsets: ['latin'], 
  display: 'swap',
});

// global-error.tsx must have html and body tags
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="it">
      <body className={ptSans.className} style={{ 
        backgroundColor: '#080808', 
        color: 'white', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        margin: 0,
        textAlign: 'center',
        padding: '2rem'
      }}>
        <div style={{
          padding: '2.5rem',
          borderRadius: '2rem',
          border: '1px solid rgba(223, 130, 0, 0.2)',
          backgroundColor: 'rgba(223, 130, 0, 0.05)',
          maxWidth: '400px',
          width: '100%'
        }}>
          <h1 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 900, 
            textTransform: 'uppercase', 
            letterSpacing: '0.1em',
            margin: '0 0 1rem 0'
          }}>Errore di Sistema</h1>
          <p style={{ 
            fontSize: '0.875rem', 
            opacity: 0.7, 
            marginBottom: '2rem' 
          }}>
            Si è verificato un errore critico nel kernel dell&apos;applicazione.
          </p>
          <button 
            onClick={() => reset()}
            style={{
              backgroundColor: 'black',
              color: '#ACE504',
              border: '1px solid #ACE504',
              padding: '0.75rem 1.5rem',
              borderRadius: '1rem',
              fontWeight: 900,
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              cursor: 'pointer'
            }}
          >
            Riavvia Sistema
          </button>
        </div>
      </body>
    </html>
  );
}
