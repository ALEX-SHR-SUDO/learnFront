import React, { useRef, useState, useEffect } from "react";

const BACKEND_URL = "https://learnback-twta.onrender.com";

export default function Home() {
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

  // metadata upload
  const uploadMetadataToPinata = async (ipfsLogoUrl) => {
    console.log('[LOG] uploadMetadataToPinata called. ipfsLogoUrl:', ipfsLogoUrl);

    const metadata = {
      name: form.name || "Token",
      symbol: form.symbol || "TKN",
      image: ipfsLogoUrl,
      description: form.description || "",
      attributes: [],
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

    setSubmitStatus("Создание и минт токена, подождите...");
    setSubmitStatusClass("status-message loading");
    console.log('[LOG] Creating token with URI:', metadataUri);

    try {
      const res = await fetch(`${BACKEND_URL}/api/create-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          symbol: form.symbol,
          supply: form.supply,
          decimals: form.decimals,
          uri: metadataUri,
          revokeFreezeAuthority: form.revokeFreezeAuthority,
          revokeMintAuthority: form.revokeMintAuthority,
        }),
      });
      console.log('[LOG] create-token fetch result:', res);
      const data = await res.json();
      console.log('[LOG] create-token response data:', data);

      if (res.ok) {
        setSubmitStatus(`Токен создан! Mint: ${data.mintAddress.slice(0, 6)}...`);
        setSubmitStatusClass("status-message success");
        setResultLink(
          `<a href="https://solscan.io/token/${data.mintAddress}?cluster=devnet" target="_blank" style="color: var(--link-color); text-decoration: none;">🔍 Посмотреть токен на Solscan</a>`
        );
        console.log('[LOG] Token created! Mint:', data.mintAddress);
      } else {
        throw new Error(data.error || "Неизвестная ошибка сервера.");
      }
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

  // load wallet balance on mount
  useEffect(() => {
    fetchWalletBalance();
  }, []);

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
            <button type="submit" id="create-token-btn" className="main-btn">
              Создать токен
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
