const BACKEND_URL = 'https://learnback-twta.onrender.com';

// DOM элементы
const createTokenBtn = document.getElementById('create-token-btn');
const tokenSupplyInput = document.getElementById('token-supply');
const tokenDecimalsInput = document.getElementById('token-decimals');
const createStatusMessage = document.getElementById('create-status-message');
const resultLinkDiv = document.getElementById('result-link');
const tokenNameInput = document.getElementById('token-name');
const tokenSymbolInput = document.getElementById('token-symbol');
const tokenUriInput = document.getElementById('token-uri');
const tokenDescriptionInput = document.getElementById('token-description');

const serviceWalletAddressEl = document.getElementById('service-wallet-address');
const serviceBalanceDisplay = document.getElementById('service-balance-display');
const serviceTokenList = document.getElementById('service-token-list');
const refreshBtn = document.getElementById('refresh-btn');
const loadingStatus = document.getElementById('loading-status');

// Элементы upload логотипа
const uploadLogoForm = document.getElementById('upload-logo-form') || document.getElementById('create-token-form');
const logoFileInput = document.getElementById('logo-file');
const logoUploadStatus = document.getElementById('logo-upload-status');
const logoPreview = document.getElementById('logo-preview');
const logoUploadBlock = document.getElementById('logo-upload-block');

// Drag&Drop для логотипа
['dragenter', 'dragover'].forEach(eventName => {
  logoUploadBlock.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    logoUploadBlock.classList.add('dragover');
  });
});
['dragleave', 'drop'].forEach(eventName => {
  logoUploadBlock.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    logoUploadBlock.classList.remove('dragover');
  });
});
logoUploadBlock.addEventListener('drop', async (e) => {
  e.preventDefault();
  logoUploadBlock.classList.remove('dragover');
  const files = e.dataTransfer.files;
  if (files && files[0]) {
    logoFileInput.files = files;
    await handleLogoUpload(files[0]);
  }
});
logoUploadBlock.addEventListener('click', () => logoFileInput.click());
logoFileInput.addEventListener('change', async () => {
  if (logoFileInput.files && logoFileInput.files[0]) {
    await handleLogoUpload(logoFileInput.files[0]);
  }
});

// ===== Загрузка логотипа на Pinata с проверкой и автозаполнение URI =====
async function handleLogoUpload(file) {
  if (!file) {
    logoUploadStatus.textContent = 'Выберите файл!';
    logoUploadStatus.className = 'status-message error';
    logoPreview.src = "default-logo.svg";
    logoPreview.style.display = "block";
    return;
  }
  logoUploadStatus.textContent = 'Загрузка логотипа...';
  logoUploadStatus.className = 'status-message loading';

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch(`${BACKEND_URL}/api/upload-logo`, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      let data = {};
      try { data = await res.json(); } catch {}
      logoUploadStatus.textContent = `❌ Ошибка: ${data.error || 'Не удалось загрузить логотип.'}`;
      logoUploadStatus.className = 'status-message error';
      logoPreview.src = "default-logo.svg";
      logoPreview.style.display = "block";
      return;
    }

    const data = await res.json();
    // Принудительно публичный gateway
    const ipfsUrl = data.ipfsUrl.replace(/https:\/\/[^\/]+\/ipfs\//, "https://gateway.pinata.cloud/ipfs/");
    if (typeof ipfsUrl === 'string' && /^https?:\/\/.+\/ipfs\/.+$/.test(ipfsUrl)) {
      logoUploadStatus.textContent = `✅ Логотип загружен!`;
      logoUploadStatus.className = 'status-message success';
      logoPreview.src = ipfsUrl;
      logoPreview.style.display = "block";
      window.tokenLogoIpfsUrl = ipfsUrl;
      await uploadMetadataToPinata(ipfsUrl);
    } else {
      logoUploadStatus.textContent = `❌ Ошибка: Не удалось получить ссылку на логотип.`;
      logoUploadStatus.className = 'status-message error';
      logoPreview.src = "default-logo.svg";
      logoPreview.style.display = "block";
    }
  } catch (err) {
    logoUploadStatus.textContent = `❌ Ошибка: ${err.message}`;
    logoUploadStatus.className = 'status-message error';
    logoPreview.src = "default-logo.svg";
    logoPreview.style.display = "block";
  }
}

// ===== Загрузка метадаты JSON на Pinata =====
async function uploadMetadataToPinata(ipfsLogoUrl) {
  const name = tokenNameInput.value || "Token";
  const symbol = tokenSymbolInput.value || "TKN";
  const description = tokenDescriptionInput ? tokenDescriptionInput.value : "";
  const safeIpfsLogoUrl = ipfsLogoUrl.replace(/https:\/\/[^\/]+\/ipfs\//, "https://gateway.pinata.cloud/ipfs/");
  const metadata = {
    name: name,
    symbol: symbol,
    image: safeIpfsLogoUrl,
    description: description,
    attributes: []
  };

  const jsonBlob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
  const formData = new FormData();
  formData.append('file', jsonBlob, 'metadata.json');

  try {
    const res = await fetch(`${BACKEND_URL}/api/upload-logo`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (res.ok && typeof data.ipfsUrl === "string") {
      tokenUriInput.value = data.ipfsUrl.replace(/https:\/\/[^\/]+\/ipfs\//, "https://gateway.pinata.cloud/ipfs/");
      logoUploadStatus.textContent += '\n✅ Метадата загружена!';
      logoUploadStatus.className = 'status-message success';
    } else {
      logoUploadStatus.textContent = `❌ Ошибка загрузки метадаты: ${data.error || 'Нет ссылки'}`;
      logoUploadStatus.className = 'status-message error';
    }
  } catch (err) {
    logoUploadStatus.textContent = `❌ Ошибка загрузки метадаты: ${err.message}`;
    logoUploadStatus.className = 'status-message error';
  }
}

// ===== Создание токена Solana =====
document.getElementById('create-token-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const name = tokenNameInput.value;
  const symbol = tokenSymbolInput.value;
  const supply = tokenSupplyInput.value;
  const decimals = tokenDecimalsInput.value;
  const uri = tokenUriInput.value;
  createStatusMessage.textContent = '';
  resultLinkDiv.innerHTML = '';

  if (!name || !symbol || !uri) {
    createStatusMessage.textContent = '❗ Заполните все поля метаданных (Имя, Символ, URI).';
    createStatusMessage.className = 'status-message error';
    return;
  }
  if (!supply || parseInt(supply) <= 0) {
    createStatusMessage.textContent = '❗ Заполните количество (Supply).';
    createStatusMessage.className = 'status-message error';
    return;
  }

  createStatusMessage.textContent = 'Создание и минт токена, подождите...';
  createStatusMessage.className = 'status-message loading';
  createTokenBtn.disabled = true;

  try {
    const res = await fetch(`${BACKEND_URL}/api/create-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, symbol, supply, decimals, uri })
    });
    const data = await res.json();
    if (res.ok) {
      createStatusMessage.textContent = `✅ Токен создан! Mint: ${data.mintAddress.slice(0, 6)}...`;
      createStatusMessage.className = 'status-message success';
      resultLinkDiv.innerHTML = `
        <a href="https://solscan.io/token/${data.mintAddress}?cluster=devnet" target="_blank" style="color: var(--link-color); text-decoration: none;">
          🔍 Посмотреть токен на Solscan
        </a>
      `;
      await fetchServiceWalletInfo();
    } else {
      throw new Error(data.error || 'Неизвестная ошибка сервера.');
    }
  } catch (error) {
    createStatusMessage.textContent = `❌ Ошибка: ${error.message}`;
    createStatusMessage.className = 'status-message error';
  } finally {
    createTokenBtn.disabled = false;
  }
});

// ===== Получение информации о кошельке =====
async function fetchServiceWalletInfo() {
  loadingStatus.textContent = 'Загрузка данных...';
  refreshBtn.disabled = true;

  try {
    const response = await fetch(`${BACKEND_URL}/api/balance`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Ошибка ${response.status} при загрузке данных.`);
    }
    const data = await response.json();
    const address = data.serviceAddress || 'Адрес не предоставлен';
    serviceWalletAddressEl.textContent = `Адрес: ${typeof address === 'string' && address.length > 8 ? address.slice(0, 4) + '...' + address.slice(-4) : address}`;
    if (typeof data.sol === 'number') {
      serviceBalanceDisplay.textContent = `Баланс SOL: ${data.sol.toFixed(4)} SOL`;
    } else {
      serviceBalanceDisplay.textContent = `Баланс SOL: Ошибка загрузки`;
    }
    serviceTokenList.innerHTML = '';
    const tokens = data.tokens || data.splTokens || [];
    if (tokens.length > 0) {
      tokens.forEach(token => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
          <span><strong>Mint:</strong> ${token.mint}</span>
          <span><strong>Amount:</strong> ${token.amount}</span>
          <span><strong>Decimals:</strong> ${token.decimals}</span>
          ${token.symbol ? `<span><strong>Symbol:</strong> ${token.symbol}</span>` : ""}
        `;
        serviceTokenList.appendChild(listItem);
      });
    } else {
      serviceTokenList.innerHTML = '<li>Токены SPL не найдены.</li>';
    }
    loadingStatus.textContent = 'Данные успешно загружены.';
  } catch (error) {
    loadingStatus.textContent = `❌ Ошибка: ${(error.message || 'Ошибка подключения').slice(0, 50)}...`;
    serviceWalletAddressEl.textContent = 'Адрес: Ошибка';
    serviceBalanceDisplay.textContent = 'Баланс SOL: Ошибка';
    serviceTokenList.innerHTML = '<li>Ошибка загрузки токенов.</li>';
  } finally {
    refreshBtn.disabled = false;
  }
}

document.addEventListener('DOMContentLoaded', fetchServiceWalletInfo);
refreshBtn.addEventListener('click', fetchServiceWalletInfo);
