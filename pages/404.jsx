import React from 'react';
import Link from 'next/link';

export default function Custom404() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      textAlign: 'center',
      padding: '20px',
    }}>
      <h1 style={{ fontSize: '4rem', marginBottom: '20px' }}>404</h1>
      <h2 style={{ fontSize: '2rem', marginBottom: '20px' }}>Страница не найдена</h2>
      <p style={{ fontSize: '1.2rem', marginBottom: '30px', color: '#666' }}>
        К сожалению, запрашиваемая страница не существует.
      </p>
      <Link href="/" style={{
        padding: '12px 24px',
        backgroundColor: '#0070f3',
        color: 'white',
        textDecoration: 'none',
        borderRadius: '5px',
        fontSize: '1rem',
      }}>
        Вернуться на главную
      </Link>
    </div>
  );
}
