import React, { useRef, useState, useEffect } from "react";
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Connection, LAMPORTS_PER_SOL, clusterApiUrl } from '@solana/web3.js';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { createTokenWithMetadata, estimateTokenCreationCost, FALLBACK_ESTIMATE_SOL } from '../utils/tokenCreation';

const BACKEND_URL = "https://learnback-twta.onrender.com";

export default function Home() {
  // Wallet adapter
  const { publicKey, connected, signTransaction } = useWallet();
  
  // refs
  const logoFileInput = useRef(null);
  const logoPreviewRef = useRef(null);

  // state
  const [logoStatus, setLogoStatus] = useState("");
  const [logoStatusClass, setLogoStatusClass] = useState("");
  const [logoPreview, setLogoPreview] = useState("/default-logo.svg");
  const [logoIpfsUrl, setLogoIpfsUrl] = useState(""); // Store logo IPFS URL
  const [tokenUri, setTokenUri] = useState("");
  const [form, setForm] = useState({
    name: "",
    symbol: "",
    description: "",
    supply: "",
    decimals: 9,
    revokeFreezeAuthority: false,
    revokeMintAuthority: false,
  });
  const [submitStatus, setSubmitStatus] = useState("");
  const [submitStatusClass, setSubmitStatusClass] = useState("");
  const [resultLink, setResultLink] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [solBalance, setSolBalance] = useState("");
  const [splTokens, setSplTokens] = useState([]);
  const [walletLoading, setWalletLoading] = useState(false);
  
  // Client wallet state
  const [clientWalletBalance, setClientWalletBalance] = useState(null);
  const [estimatedCost, setEstimatedCost] = useState(null);

  // logo upload handler
  const handleLogoUpload = async (file) => {
    console.log('[LOG] handleLogoUpload called. File:', file);

    if (!file) {
      setLogoStatus("Выберите файл!");
      setLogoStatusClass("status-message error");
      setLogoPreview("/default-logo.svg");
      console.log('[LOG] handleLogoUpload: No file selected');
      return;
    }

    // Локальный предпросмотр (до загрузки на сервер)
    const reader = new FileReader();
    reader.onloadend = () => {
      console.log('[LOG] FileReader loaded. Result:', reader.result);
      setLogoPreview(reader.result); // Показываем выбранное изображение сразу
      console.log('[LOG] setLogoPreview called with local file');
    };
    reader.onerror = (e) => {
      console.error('[ERROR] FileReader error:', e);
    };
    reader.readAsDataURL(file);

    setLogoStatus("Загрузка логотипа...");
    setLogoStatusClass("status-message loading");
    console.log('[LOG] Status set: Загрузка логотипа...');

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${BACKEND_URL}/api/upload-logo`, {
        method: "POST",
        body: formData,
      });
      console.log('[LOG] upload-logo fetch result:', res);
      const data = await res.json();
      console.log('[LOG] upload-logo response data:', data);

      if (!res.ok) {
        setLogoStatus(`Ошибка: ${data.error || "Не удалось загрузить логотип."}`);
        setLogoStatusClass("status-message error");
        setLogoPreview("/default-logo.svg");
        console.log('[ERROR] upload-logo: Bad response', data);
        return;
      }
      // IPFS Gateway
      const ipfsUrl = data.ipfsUrl.replace(
        /https:\/\/[^\/]+\/ipfs\//,
        "https://gateway.pinata.cloud/ipfs/"
      );
      setLogoStatus("Логотип загружен!");
      setLogoStatusClass("status-message success");
      setLogoPreview(ipfsUrl); // После загрузки показываем ссылку из IPFS
      setLogoIpfsUrl(ipfsUrl); // Save IPFS URL for metadata upload later
      console.log('[LOG] Logo IPFS URL saved:', ipfsUrl);
    } catch (err) {
      setLogoStatus(`Ошибка: ${err.message}`);
      setLogoStatusClass("status-message error");
      setLogoPreview("/default-logo.svg");
      console.error('[ERROR] Exception in upload-logo:', err);
    }
  };

  // Helper function to determine image MIME type from URL
  const getImageMimeType = (url) => {
    const match = url.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i);
    if (!match) return "image/png"; // Default to PNG
    
    const extension = match[1].toLowerCase();
    // Handle special cases
    if (extension === 'jpg') return 'image/jpeg';
    if (extension === 'svg') return 'image/svg+xml';
    return `image/${extension}`;
  };

  // metadata upload
  const uploadMetadataToPinata = async (ipfsLogoUrl) => {
    console.log('[LOG] uploadMetadataToPinata called. ipfsLogoUrl:', ipfsLogoUrl);

    // Determine image type from URL or default to png
    const imageType = getImageMimeType(ipfsLogoUrl);

    // Create metadata following Metaplex Token Metadata standard
    // Including properties.files array is crucial for proper display on Solscan and wallets
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
    
    const res = await fetch(`${BACKEND_URL}/api/upload-logo`, {
      method: "POST",
      body: formData,
    });
    console.log('[LOG] metadata upload to IPFS - fetch result:', res);
    const data = await res.json();
    console.log('[LOG] metadata upload to IPFS - response data:', data);

    if (res.ok && typeof data.ipfsUrl === "string") {
      const metadataUri = data.ipfsUrl.replace(
        /https:\/\/[^\/]+\/ipfs\//,
        "https://gateway.pinata.cloud/ipfs/"
      );
      console.log('[LOG] Metadata URI created:', metadataUri);
      setSubmitStatus("Метадата загружена! Создание токена...");
      setSubmitStatusClass("status-message success");
      // Also update tokenUri state for display in the read-only URI field
      setTokenUri(metadataUri);
      return metadataUri;
    } else {
      throw new Error(data.error || "Нет ссылки на метадату");
    }
  };

  // form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus("");
    setResultLink("");
    console.log('[LOG] handleSubmit called. form:', form, 'logoIpfsUrl:', logoIpfsUrl);

    // Check if wallet is connected
    if (!connected || !publicKey) {
      setSubmitStatus("Подключите кошелек для создания токена.");
      setSubmitStatusClass("status-message error");
      console.log('[ERROR] Submit: Wallet not connected');
      return;
    }

    if (!form.name || !form.symbol) {
      setSubmitStatus("Заполните все поля метаданных (Имя, Символ).");
      setSubmitStatusClass("status-message error");
      console.log('[ERROR] Submit: Not all metadata fields filled');
      return;
    }
    if (!form.supply || parseInt(form.supply) <= 0) {
      setSubmitStatus("Заполните количество (Supply).");
      setSubmitStatusClass("status-message error");
      console.log('[ERROR] Submit: Supply field not filled or invalid');
      return;
    }
    if (!logoIpfsUrl) {
      setSubmitStatus("Сначала загрузите логотип.");
      setSubmitStatusClass("status-message error");
      console.log('[ERROR] Submit: Logo not uploaded');
      return;
    }

    // Check wallet balance (using lamports for precision)
    if (clientWalletBalance !== null) {
      // Convert to lamports using BigInt for precise comparison
      const balanceInLamports = BigInt(Math.floor(parseFloat(clientWalletBalance) * LAMPORTS_PER_SOL));
      const requiredLamports = BigInt(Math.floor((estimatedCost || FALLBACK_ESTIMATE_SOL) * LAMPORTS_PER_SOL));
      if (balanceInLamports < requiredLamports) {
        setSubmitStatus(`Недостаточно SOL в кошельке. Необходимо минимум ${(estimatedCost || FALLBACK_ESTIMATE_SOL).toFixed(4)} SOL.`);
        setSubmitStatusClass("status-message error");
        console.log('[ERROR] Submit: Insufficient balance');
        return;
      }
    }

    setSubmitStatus("Загрузка метадаты...");
    setSubmitStatusClass("status-message loading");
    console.log('[LOG] Submit started - uploading metadata');

    // Upload metadata first
    let metadataUri;
    try {
      metadataUri = await uploadMetadataToPinata(logoIpfsUrl);
    } catch (err) {
      setSubmitStatus(`Ошибка загрузки метадаты: ${err.message}`);
      setSubmitStatusClass("status-message error");
      console.error('[ERROR] Exception in metadata upload:', err);
      return;
    }

    if (!metadataUri) {
      setSubmitStatus("Ошибка: URI метадаты не был установлен.");
      setSubmitStatusClass("status-message error");
      console.log('[ERROR] Submit: metadataUri not returned from upload');
      return;
    }

    setSubmitStatus("Создание и минт токена из вашего кошелька, подпишите транзакцию...");
    setSubmitStatusClass("status-message loading");
    console.log('[LOG] Creating token with URI:', metadataUri);

    try {
      // Create connection to Solana
      const endpoint = clusterApiUrl(WalletAdapterNetwork.Devnet);
      const connection = new Connection(endpoint, 'confirmed');

      // Create token using client wallet
      const result = await createTokenWithMetadata({
        connection,
        wallet: { publicKey, signTransaction },
        name: form.name,
        symbol: form.symbol,
        uri: metadataUri,
        decimals: form.decimals,
        supply: form.supply, // Pass as string, utility will handle BigInt conversion
        revokeMintAuthority: form.revokeMintAuthority,
        revokeFreezeAuthority: form.revokeFreezeAuthority,
      });

      setSubmitStatus(`Токен создан! Mint: ${result.mintAddress.slice(0, 6)}...`);
      setSubmitStatusClass("status-message success");
      setResultLink(
        `<a href="https://solscan.io/token/${result.mintAddress}?cluster=devnet" target="_blank" style="color: var(--link-color); text-decoration: none;">🔍 Посмотреть токен на Solscan</a>`
      );
      console.log('[LOG] Token created! Mint:', result.mintAddress);

      // Refresh wallet balance
      fetchClientBalance();
    } catch (error) {
      setSubmitStatus(`Ошибка: ${error.message}`);
      setSubmitStatusClass("status-message error");
      console.error('[ERROR] Exception in create-token:', error);
    }
  };

  // fetch wallet balance
  const fetchWalletBalance = async () => {
    setWalletLoading(true);
    console.log('[LOG] fetchWalletBalance called');
    try {
      const res = await fetch(`${BACKEND_URL}/api/wallet-balance`);
      console.log('[LOG] wallet-balance fetch result:', res);
      const data = await res.json();
      console.log('[LOG] wallet-balance response data:', data);

      if (res.ok) {
        setWalletAddress(data.walletAddress || "");
        const balanceInSol = parseFloat(data.sol) || 0;
        setSolBalance(balanceInSol.toFixed(9));
        const tokens = data.tokens || data.splTokens || [];
        setSplTokens(tokens);
        console.log('[LOG] Wallet data set:', data.walletAddress, balanceInSol, tokens);
      } else {
        console.error("Ошибка загрузки баланса:", data.error);
      }
    } catch (err) {
      console.error("Ошибка загрузки баланса:", err.message);
    } finally {
      setWalletLoading(false);
    }
  };

  // Fetch client wallet balance
  const fetchClientBalance = async () => {
    if (connected && publicKey) {
      try {
        const endpoint = clusterApiUrl(WalletAdapterNetwork.Devnet);
        const connection = new Connection(endpoint, 'confirmed');
        const balance = await connection.getBalance(publicKey);
        setClientWalletBalance((balance / LAMPORTS_PER_SOL).toFixed(9));
        
        // Estimate token creation cost
        const cost = await estimateTokenCreationCost(connection);
        setEstimatedCost(cost);
      } catch (err) {
        console.error('Error fetching client wallet balance:', err);
        setClientWalletBalance(null);
        setEstimatedCost(null);
      }
    }
  };

  // load wallet balance on mount
  useEffect(() => {
    fetchWalletBalance();
  }, []);

  // Fetch client wallet balance when connected
  useEffect(() => {
    const fetchClientBalance = async () => {
      if (connected && publicKey) {
        try {
          const endpoint = clusterApiUrl(WalletAdapterNetwork.Devnet);
          const connection = new Connection(endpoint, 'confirmed');
          const balance = await connection.getBalance(publicKey);
          setClientWalletBalance((balance / LAMPORTS_PER_SOL).toFixed(9));
          
          // Estimate token creation cost
          const cost = await estimateTokenCreationCost(connection);
          setEstimatedCost(cost);
        } catch (err) {
          console.error('Error fetching client wallet balance:', err);
          setClientWalletBalance(null);
          setEstimatedCost(null);
        }
      } else {
        setClientWalletBalance(null);
        setEstimatedCost(null);
      }
    };
    fetchClientBalance();
  }, [connected, publicKey]);

  // drag&drop
  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    console.log('[LOG] handleDrop called. files:', files);
    if (files && files[0]) handleLogoUpload(files[0]);
  };
  const handleDragOver = (e) => e.preventDefault();

  // input change handler for file upload (важно!)
  const onLogoInputChange = (e) => {
    console.log('[LOG] logo-file onChange. files:', e.target.files);
    if (e.target.files[0]) handleLogoUpload(e.target.files[0]);
  };

  return (
    <main>
      {/* Client Wallet Connection Section */}
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
            {clientWalletBalance !== null && (
              <div style={{ marginBottom: 8 }}>
                <strong>Баланс:</strong> {clientWalletBalance} SOL
              </div>
            )}
            {estimatedCost !== null && (
              <div style={{ marginBottom: 8, fontSize: '14px', color: '#666' }}>
                Примерная стоимость создания токена: ~{estimatedCost.toFixed(4)} SOL
              </div>
            )}
          </div>
        )}
        {!connected && (
          <div style={{ marginTop: 12, padding: '12px', background: '#fff3cd', borderRadius: '8px', fontSize: '14px' }}>
            ⚠️ Подключите кошелек для создания токена. Токены создаются напрямую из вашего кошелька.
          </div>
        )}
      </div>
      
      <form id="create-token-form" className="token-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div
            className="logo-upload-block"
            id="logo-upload-block"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <label
              htmlFor="logo-file"
              className="logo-label"
            >
              <img
                id="logo-preview"
                ref={logoPreviewRef}
                src={logoPreview}
                alt="Token Logo"
                className="logo-preview-img"
                onError={(e) => {
                  const currentSrc = e.target.src;
                  console.error('[ERROR] img onError triggered. src:', currentSrc);
                  // Don't reset data URLs (local file previews from FileReader) since they're generated locally
                  // and don't need fallback handling. Only reset when external URLs (IPFS, etc.) fail to load.
                  if (!currentSrc.endsWith("/default-logo.svg") && !currentSrc.startsWith("data:")) {
                    e.target.src = "/default-logo.svg";
                    setLogoPreview("/default-logo.svg");
                    setLogoStatus("Логотип не найден, используется дефолтный.");
                    setLogoStatusClass("status-message error");
                    console.log('[LOG] setLogoPreview called with default-logo.svg');
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
            <div id="logo-upload-status" className={logoStatusClass}>
              {logoStatus}
            </div>
          </div>
          <div className="fields-block">
            <label>
              <span>Имя токена</span>
              <input
                type="text"
                id="token-name"
                maxLength={32}
                placeholder="Например: Orion"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => {
                    console.log('[LOG] token-name changed:', e.target.value);
                    return { ...f, name: e.target.value };
                  })
                }
              />
            </label>
            <label>
              <span>Символ</span>
              <input
                type="text"
                id="token-symbol"
                maxLength={10}
                placeholder="Например: ORN"
                value={form.symbol}
                onChange={(e) =>
                  setForm((f) => {
                    console.log('[LOG] token-symbol changed:', e.target.value);
                    return { ...f, symbol: e.target.value };
                  })
                }
              />
            </label>
            <label>
              <span>Описание</span>
              <textarea
                id="token-description"
                maxLength={200}
                placeholder="Краткое описание токена"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => {
                    console.log('[LOG] token-description changed:', e.target.value);
                    return { ...f, description: e.target.value };
                  })
                }
              />
            </label>
            <label>
              <span>Количество (Supply)</span>
              <input
                type="number"
                id="token-supply"
                min={1}
                step={1}
                placeholder="1000000"
                value={form.supply}
                onChange={(e) =>
                  setForm((f) => {
                    console.log('[LOG] token-supply changed:', e.target.value);
                    return { ...f, supply: e.target.value };
                  })
                }
              />
            </label>
            <label>
              <span>Знаков после запятой (Decimals)</span>
              <input
                type="number"
                id="token-decimals"
                min={0}
                max={18}
                step={1}
                value={form.decimals}
                onChange={(e) =>
                  setForm((f) => {
                    console.log('[LOG] token-decimals changed:', e.target.value);
                    return {
                      ...f,
                      decimals: Number(e.target.value),
                    };
                  })
                }
              />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                id="revoke-freeze-authority"
                checked={form.revokeFreezeAuthority}
                onChange={(e) =>
                  setForm((f) => {
                    console.log('[LOG] revoke-freeze-authority changed:', e.target.checked);
                    return {
                      ...f,
                      revokeFreezeAuthority: e.target.checked,
                    };
                  })
                }
                style={{ width: 'auto', cursor: 'pointer' }}
              />
              <span>Отозвать права на заморозку (Revoke Freeze Authority)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                id="revoke-mint-authority"
                checked={form.revokeMintAuthority}
                onChange={(e) =>
                  setForm((f) => {
                    console.log('[LOG] revoke-mint-authority changed:', e.target.checked);
                    return {
                      ...f,
                      revokeMintAuthority: e.target.checked,
                    };
                  })
                }
                style={{ width: 'auto', cursor: 'pointer' }}
              />
              <span>Отозвать права на минт (Revoke Mint Authority)</span>
            </label>
            <label>
              <span>URI метадаты (автоматически)</span>
              <input
                type="text"
                id="token-uri"
                readOnly
                style={{ background: "#eee" }}
                value={tokenUri}
              />
            </label>
            <button type="submit" id="create-token-btn" className="main-btn" disabled={!connected}>
              {connected ? 'Создать токен' : 'Подключите кошелек'}
            </button>
            <div
              id="create-status-message"
              className={submitStatusClass}
              style={{ whiteSpace: "pre-line" }}
            >
              {submitStatus}
            </div>
            <div
              id="result-link"
              dangerouslySetInnerHTML={{ __html: resultLink }}
            ></div>
          </div>
        </div>
      </form>
      <div className="wallet-section">
        <h3 style={{ marginTop: 0, marginBottom: 12 }}>Сервисный кошелек</h3>
        {walletLoading ? (
          <div id="loading-status">Загрузка...</div>
        ) : (
          <>
            <div id="service-wallet-address" style={{ marginBottom: 8 }}>
              <strong>Адрес:</strong>{" "}
              {walletAddress ? (
                <a
                  href={`https://solscan.io/account/${walletAddress}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--link-color)", textDecoration: "none" }}
                >
                  {walletAddress}
                </a>
              ) : (
                "Не загружен"
              )}
            </div>
            <div id="service-balance-display">
              <strong>Баланс SOL:</strong> {solBalance} SOL
            </div>
            {splTokens.length > 0 ? (
              <>
                <div style={{ marginTop: 12, marginBottom: 8 }}>
                  <strong>SPL токены ({splTokens.length}):</strong>
                </div>
                <ul id="service-token-list">
                  {splTokens.map((token, idx) => (
                    <li key={idx}>
                      {token.symbol || token.mint}: {token.balance} (Mint: {token.mint?.slice(0, 6) || 'N/A'}...)
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              walletAddress && (
                <div style={{ marginTop: 12, fontSize: '14px', color: '#888' }}>
                  SPL токены не найдены
                </div>
              )
            )}
            <button
              className="refresh-btn"
              onClick={fetchWalletBalance}
              disabled={walletLoading}
            >
              🔄 Обновить баланс
            </button>
          </>
        )}
      </div>
    </main>
  );
}
