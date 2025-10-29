import React, { useRef, useState } from "react";

const BACKEND_URL = "https://learnback-twta.onrender.com";

export default function Home() {
  // refs
  const logoFileInput = useRef(null);
  const logoPreviewRef = useRef(null);

  // state
  const [logoStatus, setLogoStatus] = useState("");
  const [logoStatusClass, setLogoStatusClass] = useState("");
  const [logoPreview, setLogoPreview] = useState("/default-logo.svg");
  const [tokenUri, setTokenUri] = useState("");
  const [form, setForm] = useState({
    name: "",
    symbol: "",
    description: "",
    supply: "",
    decimals: 9,
  });
  const [submitStatus, setSubmitStatus] = useState("");
  const [submitStatusClass, setSubmitStatusClass] = useState("");
  const [resultLink, setResultLink] = useState("");

  // logo upload handler
  const handleLogoUpload = async (file) => {
    if (!file) {
      setLogoStatus("Выберите файл!");
      setLogoStatusClass("status-message error");
      setLogoPreview("/default-logo.svg");
      return;
    }
    setLogoStatus("Загрузка логотипа...");
    setLogoStatusClass("status-message loading");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${BACKEND_URL}/api/upload-logo`, {
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
      // IPFS Gateway
      const ipfsUrl = data.ipfsUrl.replace(
        /https:\/\/[^\/]+\/ipfs\//,
        "https://gateway.pinata.cloud/ipfs/"
      );
      setLogoStatus("Логотип загружен!");
      setLogoStatusClass("status-message success");
      setLogoPreview(ipfsUrl);
      await uploadMetadataToPinata(ipfsUrl);
    } catch (err) {
      setLogoStatus(`Ошибка: ${err.message}`);
      setLogoStatusClass("status-message error");
      setLogoPreview("/default-logo.svg");
    }
  };

  // metadata upload
  const uploadMetadataToPinata = async (ipfsLogoUrl) => {
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
    try {
      const res = await fetch(`${BACKEND_URL}/api/upload-logo`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && typeof data.ipfsUrl === "string") {
        setTokenUri(
          data.ipfsUrl.replace(
            /https:\/\/[^\/]+\/ipfs\//,
            "https://gateway.pinata.cloud/ipfs/"
          )
        );
        setLogoStatus((msg) => msg + "\nМетадата загружена!");
        setLogoStatusClass("status-message success");
      } else {
        setLogoStatus(`Ошибка загрузки метадаты: ${data.error || "Нет ссылки"}`);
        setLogoStatusClass("status-message error");
      }
    } catch (err) {
      setLogoStatus(`Ошибка загрузки метадаты: ${err.message}`);
      setLogoStatusClass("status-message error");
    }
  };

  // form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus("");
    setResultLink("");
    if (!form.name || !form.symbol || !tokenUri) {
      setSubmitStatus("Заполните все поля метаданных (Имя, Символ, URI).");
      setSubmitStatusClass("status-message error");
      return;
    }
    if (!form.supply || parseInt(form.supply) <= 0) {
      setSubmitStatus("Заполните количество (Supply).");
      setSubmitStatusClass("status-message error");
      return;
    }
    setSubmitStatus("Создание и минт токена, подождите...");
    setSubmitStatusClass("status-message loading");

    try {
      const res = await fetch(`${BACKEND_URL}/api/create-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          symbol: form.symbol,
          supply: form.supply,
          decimals: form.decimals,
          uri: tokenUri,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitStatus(`Токен создан! Mint: ${data.mintAddress.slice(0, 6)}...`);
        setSubmitStatusClass("status-message success");
        setResultLink(
          `<a href="https://solscan.io/token/${data.mintAddress}?cluster=devnet" target="_blank" style="color: var(--link-color); text-decoration: none;">🔍 Посмотреть токен на Solscan</a>`
        );
      } else {
        throw new Error(data.error || "Неизвестная ошибка сервера.");
      }
    } catch (error) {
      setSubmitStatus(`Ошибка: ${error.message}`);
      setSubmitStatusClass("status-message error");
    }
  };

  // drag&drop
  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files[0]) handleLogoUpload(files[0]);
  };
  const handleDragOver = (e) => e.preventDefault();

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
              onClick={() => logoFileInput.current.click()}
            >
              <img
                id="logo-preview"
                ref={logoPreviewRef}
                src={logoPreview}
                alt="Token Logo"
                className="logo-preview-img"
                onError={(e) => {
                  const currentSrc = e.target.src;
                  if (!currentSrc.endsWith("/default-logo.svg")) {
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
                onChange={(e) => {
                  if (e.target.files[0]) handleLogoUpload(e.target.files[0]);
                }}
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
                  setForm((f) => ({ ...f, name: e.target.value }))
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
                  setForm((f) => ({ ...f, symbol: e.target.value }))
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
                  setForm((f) => ({ ...f, description: e.target.value }))
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
                  setForm((f) => ({ ...f, supply: e.target.value }))
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
                  setForm((f) => ({
                    ...f,
                    decimals: Number(e.target.value),
                  }))
                }
              />
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
      {/* wallet-section можно добавить аналогично */}
    </main>
  );
}
