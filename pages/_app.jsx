import '../styles/globals.css';
import '../styles/style.css';
import { useState, useEffect } from 'react';

const backgrounds = [
  {
    name: 'Default (Purple Mix)',
    style: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)'
  },
  {
    name: 'Bitcoin Orange',
    style: 'linear-gradient(135deg, #f7931a 0%, #4a90e2 50%, #1a1a2e 100%)'
  },
  {
    name: 'Ethereum Purple',
    style: 'linear-gradient(135deg, #8a2be2 0%, #4b0082 50%, #000000 100%)'
  },
  {
    name: 'Cyberpunk',
    style: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)'
  },
  {
    name: 'Matrix Green',
    style: 'linear-gradient(135deg, #000000 0%, #0f4c0f 50%, #00ff00 100%)'
  },
  {
    name: 'Gold & Dark',
    style: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 25%, #c9a227 50%, #2d2d2d 75%, #1a1a1a 100%)'
  },
  {
    name: 'Neon Blue',
    style: 'linear-gradient(135deg, #000428 0%, #004e92 50%, #00d4ff 100%)'
  }
];

export default function App({ Component, pageProps }) {
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  useEffect(() => {
    // Load saved background from localStorage
    const saved = localStorage.getItem('backgroundTheme');
    if (saved !== null) {
      const index = parseInt(saved, 10);
      if (index >= 0 && index < backgrounds.length) {
        setCurrentBgIndex(index);
      }
    }
  }, []);

  useEffect(() => {
    // Apply background style to body
    document.body.style.background = backgrounds[currentBgIndex].style;
    document.body.style.backgroundAttachment = 'fixed';
    
    // Save to localStorage
    localStorage.setItem('backgroundTheme', currentBgIndex.toString());
  }, [currentBgIndex]);

  const switchBackground = () => {
    setCurrentBgIndex((prev) => (prev + 1) % backgrounds.length);
  };

  return (
    <>
      <button 
        className="bg-switcher-btn"
        onClick={switchBackground}
        title={`Текущий фон: ${backgrounds[currentBgIndex].name}`}
      >
        🎨 Сменить фон
      </button>
      <Component {...pageProps} />
    </>
  );
}
