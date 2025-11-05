import '../styles/globals.css';
import '../styles/style.css';
import { useState, useEffect } from 'react';
import WalletConnectionProvider from '../components/WalletConnectionProvider';

const backgrounds = [
  {
    name: 'Фиолетовый микс',
    style: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)'
  },
  {
    name: 'Bitcoin оранжевый',
    style: 'linear-gradient(135deg, #f7931a 0%, #4a90e2 50%, #1a1a2e 100%)'
  },
  {
    name: 'Ethereum фиолетовый',
    style: 'linear-gradient(135deg, #8a2be2 0%, #4b0082 50%, #000000 100%)'
  },
  {
    name: 'Киберпанк',
    style: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)'
  },
  {
    name: 'Матрица зелёная',
    style: 'linear-gradient(135deg, #000000 0%, #0f4c0f 50%, #00ff00 100%)'
  },
  {
    name: 'Золото и тьма',
    style: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 25%, #c9a227 50%, #2d2d2d 75%, #1a1a1a 100%)'
  },
  {
    name: 'Неоновый синий',
    style: 'linear-gradient(135deg, #000428 0%, #004e92 50%, #00d4ff 100%)'
  }
];

export default function App({ Component, pageProps }) {
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  useEffect(() => {
    // Load saved background from localStorage (client-side only)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('backgroundTheme');
      if (saved !== null) {
        const index = parseInt(saved, 10);
        if (!isNaN(index) && index >= 0 && index < backgrounds.length) {
          setCurrentBgIndex(index);
        }
      }
    }
  }, []);

  useEffect(() => {
    // Apply background style to body (client-side only)
    if (typeof window !== 'undefined') {
      document.body.style.background = backgrounds[currentBgIndex].style;
      document.body.style.backgroundAttachment = 'fixed';
      
      // Save to localStorage
      localStorage.setItem('backgroundTheme', currentBgIndex.toString());
    }
  }, [currentBgIndex]);

  const switchBackground = () => {
    setCurrentBgIndex((prev) => (prev + 1) % backgrounds.length);
  };

  return (
    <WalletConnectionProvider>
      <button 
        className="bg-switcher-btn"
        onClick={switchBackground}
        title={`Текущий фон: ${backgrounds[currentBgIndex].name}`}
      >
        🎨 Сменить фон
      </button>
      <Component {...pageProps} />
    </WalletConnectionProvider>
  );
}
