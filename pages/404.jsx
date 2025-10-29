import React from 'react';
import Link from 'next/link';
import styles from './404.module.css';

export default function Custom404() {
  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>404</h1>
      <h2 className={styles.subheading}>Страница не найдена</h2>
      <p className={styles.message}>
        К сожалению, запрашиваемая страница не существует.
      </p>
      <Link href="/" className={styles.homeLink}>
        Вернуться на главную
      </Link>
    </div>
  );
}
