import React, { useState, useRef } from "react";
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Connection, clusterApiUrl } from '@solana/web3.js';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { 
  checkMetadataExists, 
  createMetadataForExistingToken, 
  updateMetadataForExistingToken 
} from '../metadata_upload/updateMetadata';
import Link from 'next/link';

const API_BASE = "";

// Helper function to normalize IPFS URLs to Pinata gateway
const normalizeIpfsUrl = (url) => {
  return url.replace(
    /https:\/\/[^\/]+\/ipfs\//,
    "https://gateway.pinata.cloud/ipfs/"
  );
};

export default function MetadataUpload() {
  const { publicKey, connected, signTransaction } = useWallet();
  
  const logoFileInput = useRef(null);
  
  const [mintAddress, setMintAddress] = useState("");
  const [logoStatus, setLogoStatus] = useState("");
  const [logoStatusClass, setLogoStatusClass] = useState("");
  const [logoPreview, setLogoPreview] = useState("/default-logo.svg");
  const [logoIpfsUrl, setLogoIpfsUrl] = useState("");
  const [form, setForm] = useState({
    name: "",
    symbol: "",
    description: "",
  });
  const [submitStatus, setSubmitStatus] = useState("");
  const [submitStatusClass, setSubmitStatusClass] = useState("");
  const [resultLink, setResultLink] = useState("");
  const [metadataExists, setMetadataExists] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  // Check if metadata exists for the token
  const checkToken = async () => {
    if (!mintAddress) {
      setSubmitStatus("Введите адрес минта токена");
      setSubmitStatusClass("status-message error");
      return;
    }

    setIsChecking(true);
    setSubmitStatus("Проверка токена...");
    setSubmitStatusClass("status-message loading");

    try {
      const endpoint = clusterApiUrl(WalletAdapterNetwork.Devnet);
      const connection = new Connection(endpoint, 'confirmed');
      
      const result = await checkMetadataExists(connection, mintAddress);
      setMetadataExists(result);

      if (result.exists) {
        setSubmitStatus(
          `✅ Метадата найдена:\n` +
          `Имя: ${result.metadata.name}\n` +
          `Символ: ${result.metadata.symbol}\n` +
          `URI: ${result.metadata.uri}\n` +
          `Можно обновить: ${result.metadata.isMutable ? 'Да' : 'Нет'}`
        );
        setSubmitStatusClass("status-message success");
        
        // Pre-fill form with existing data
        setForm({
          name: result.metadata.name,
          symbol: result.metadata.symbol,
          description: "",
        });
      } else {
        setSubmitStatus("ℹ️ Метадата не найдена. Можно создать новую.");
        setSubmitStatusClass("status-message info");
      }
    } catch (error) {
      setSubmitStatus(`Ошибка: ${error.message}`);
      setSubmitStatusClass("status-message error");
      setMetadataExists(null);
    } finally {
      setIsChecking(false);
    }
  };

  // Logo upload handler
  const handleLogoUpload = async (file) => {
    if (!file) {
      setLogoStatus("Выберите файл!");
      setLogoStatusClass("status-message error");
      setLogoPreview("/default-logo.svg");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);

    setLogoStatus("Загрузка логотипа...");
    setLogoStatusClass("status-message loading");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/api/upload-logo`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setLogoStatus(`Ошибка: ${data.error || "Не удалось загрузить логотип."}`);
        setLogoStatusClass("status-message error");
        setLogoPreview("/default-logo.svg");
        return;
      }
      
      const ipfsUrl = normalizeIpfsUrl(data.ipfsUrl);
      setLogoStatus("Логотип загружен!");
      setLogoStatusClass("status-message success");
      setLogoPreview(ipfsUrl);
      setLogoIpfsUrl(ipfsUrl);
    } catch (err) {
      setLogoStatus(`Ошибка: ${err.message}`);
      setLogoStatusClass("status-message error");
      setLogoPreview("/default-logo.svg");
    }
  };

  const getImageMimeType = (url) => {
    const match = url.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i);
    if (!match) return "image/png";
    
    const extension = match[1].toLowerCase();
    if (extension === 'jpg') return 'image/jpeg';
    if (extension === 'svg') return 'image/svg+xml';
    return `image/${extension}`;
  };

  const uploadMetadataToPinata = async (ipfsLogoUrl) => {
    const imageType = getImageMimeType(ipfsLogoUrl);

    const metadata = {
      name: form.name || "Token",
      symbol: form.symbol || "TKN",
      description: form.description || "",
      image: ipfsLogoUrl,
      properties: {
        files: [
          {
            uri: ipfsLogoUrl,
            type: imageType,
          }
        ],
        category: "image",
      }
    };
    
    const jsonBlob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
    const formData = new FormData();
    formData.append("file", jsonBlob, "metadata.json");
    
    const res = await fetch(`${API_BASE}/api/upload-logo`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();

    if (res.ok && typeof data.ipfsUrl === "string") {
      const metadataUri = normalizeIpfsUrl(data.ipfsUrl);
      return metadataUri;
    } else {
      throw new Error(data.error || "Нет ссылки на метадату");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus("");
    setResultLink("");

    if (!connected || !publicKey) {
      setSubmitStatus("Подключите кошелек.");
      setSubmitStatusClass("status-message error");
      return;
    }

    if (!mintAddress) {
      setSubmitStatus("Введите адрес минта токена.");
      setSubmitStatusClass("status-message error");
      return;
    }

    if (!form.name || !form.symbol) {
      setSubmitStatus("Заполните имя и символ токена.");
      setSubmitStatusClass("status-message error");
      return;
    }

    if (!logoIpfsUrl) {
      setSubmitStatus("Сначала загрузите логотип.");
      setSubmitStatusClass("status-message error");
      return;
    }

    setSubmitStatus("Загрузка метадаты...");
    setSubmitStatusClass("status-message loading");

    let metadataUri;
    try {
      metadataUri = await uploadMetadataToPinata(logoIpfsUrl);
      setSubmitStatus("Метадата загружена! Обновление токена...");
    } catch (err) {
      setSubmitStatus(`Ошибка загрузки метадаты: ${err.message}`);
      setSubmitStatusClass("status-message error");
      return;
    }

    try {
      const endpoint = clusterApiUrl(WalletAdapterNetwork.Devnet);
      const connection = new Connection(endpoint, 'confirmed');

      let result;
      if (metadataExists && metadataExists.exists) {
        // Update existing metadata
        result = await updateMetadataForExistingToken({
          connection,
          wallet: { publicKey, signTransaction },
          mintAddress,
          name: form.name,
          symbol: form.symbol,
          uri: metadataUri,
        });
        
        setSubmitStatus(
          `✅ Метадата обновлена!\n` +
          `Mint: ${mintAddress.slice(0, 6)}...${mintAddress.slice(-4)}\n` +
          `Транзакция: ${result.signature.slice(0, 8)}...`
        );
      } else {
        // Create new metadata
        result = await createMetadataForExistingToken({
          connection,
          wallet: { publicKey, signTransaction },
          mintAddress,
          name: form.name,
          symbol: form.symbol,
          uri: metadataUri,
        });
        
        setSubmitStatus(
          `✅ Метадата создана!\n` +
          `Mint: ${mintAddress.slice(0, 6)}...${mintAddress.slice(-4)}\n` +
          `Metadata Address: ${result.metadataAddress.slice(0, 6)}...${result.metadataAddress.slice(-4)}\n` +
          `Транзакция: ${result.signature.slice(0, 8)}...`
        );
      }
      
      setSubmitStatusClass("status-message success");
      setResultLink(mintAddress);
    } catch (error) {
      setSubmitStatus(`Ошибка: ${error.message}`);
      setSubmitStatusClass("status-message error");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files[0]) handleLogoUpload(files[0]);
  };

  const handleDragOver = (e) => e.preventDefault();

  const onLogoInputChange = (e) => {
    if (e.target.files[0]) handleLogoUpload(e.target.files[0]);
  };

  return (
    <main>
      <div style={{ marginBottom: 24 }}>
        <Link href="/" style={{ color: 'var(--link-color)', textDecoration: 'none' }}>
          ← Вернуться к созданию токенов
        </Link>
      </div>

      <h1>Загрузка метадаты для существующего токена</h1>
      <p style={{ marginBottom: 24, color: '#666' }}>
        Эта страница позволяет добавить или обновить метадату (название, символ, логотип) 
        для токенов, которые уже были созданы.
      </p>

      <div className="client-wallet-section">
        <h2 style={{ marginTop: 0, marginBottom: 16 }}>Подключение кошелька</h2>
        <div className="wallet-connection-controls">
          <WalletMultiButton />
        </div>
        {connected && publicKey && (
          <div className="connected-wallet-info">
            <div style={{ marginTop: 12, marginBottom: 8 }}>
              <strong>Подключенный кошелек:</strong>{" "}
              <a
                href={`https://solscan.io/account/${publicKey.toString()}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--link-color)", textDecoration: "none" }}
              >
                {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
              </a>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 24 }}>
        <h2>Шаг 1: Проверить токен</h2>
        <div style={{ display: 'flex', gap: '12px', marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Адрес минта токена (Mint Address)"
            value={mintAddress}
            onChange={(e) => setMintAddress(e.target.value)}
            style={{ flex: 1 }}
          />
          <button 
            onClick={checkToken} 
            disabled={isChecking || !mintAddress}
            className="main-btn"
          >
            {isChecking ? 'Проверка...' : 'Проверить'}
          </button>
        </div>
      </div>

      <form className="token-form" onSubmit={handleSubmit} style={{ marginTop: 24 }}>
        <h2>Шаг 2: Загрузить метадату</h2>
        <div className="form-row">
          <div
            className="logo-upload-block"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <label htmlFor="logo-file" className="logo-label">
              <img
                src={logoPreview}
                alt="Token Logo"
                className="logo-preview-img"
                onError={(e) => {
                  const currentSrc = e.target.src;
                  if (!currentSrc.endsWith("/default-logo.svg") && !currentSrc.startsWith("data:")) {
                    e.target.src = "/default-logo.svg";
                    setLogoPreview("/default-logo.svg");
                    setLogoStatus("Логотип не найден, используется дефолтный.");
                    setLogoStatusClass("status-message error");
                  }
                }}
              />
              <span className="logo-upload-text">Загрузить логотип</span>
              <input
                type="file"
                id="logo-file"
                accept="image/*"
                style={{ display: "none" }}
                ref={logoFileInput}
                onChange={onLogoInputChange}
              />
            </label>
            <div className={logoStatusClass}>
              {logoStatus}
            </div>
          </div>
          <div className="fields-block">
            <label>
              <span>Имя токена</span>
              <input
                type="text"
                maxLength={32}
                placeholder="Например: Orion"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </label>
            <label>
              <span>Символ</span>
              <input
                type="text"
                maxLength={10}
                placeholder="Например: ORN"
                value={form.symbol}
                onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value }))}
              />
            </label>
            <label>
              <span>Описание</span>
              <textarea
                maxLength={200}
                placeholder="Краткое описание токена"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </label>
            <button 
              type="submit" 
              className="main-btn" 
              disabled={!connected || !mintAddress || !logoIpfsUrl}
            >
              {metadataExists && metadataExists.exists ? 'Обновить метадату' : 'Создать метадату'}
            </button>
            <div
              className={submitStatusClass}
              style={{ whiteSpace: "pre-line" }}
            >
              {submitStatus}
            </div>
            {resultLink && (
              <div>
                <a 
                  href={`https://solscan.io/token/${encodeURIComponent(resultLink)}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--link-color)', textDecoration: 'none' }}
                >
                  🔍 Посмотреть токен на Solscan
                </a>
              </div>
            )}
          </div>
        </div>
      </form>
    </main>
  );
}
