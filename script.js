const API_URL = "https://learnback-twta.onrender.com";

// элементы DOM
const createBtn = document.getElementById("createBtn");
const nameInput = document.getElementById("name");
const symbolInput = document.getElementById("symbol");
const decimalsInput = document.getElementById("decimals");
const supplyInput = document.getElementById("supply");
const descriptionInput = document.getElementById("description");

const chatDiv = document.getElementById("chat");
const balanceDisplay = document.getElementById("balanceDisplay");
const tokenDisplay = document.getElementById("tokenDisplay");
const walletInput = document.getElementById("walletAddress");
const balanceBtn = document.getElementById("checkBalanceBtn");
const connectionStatus = document.getElementById("connectionStatus");

// ===== Проверка соединения с backend =====
async function checkConnection() {
  try {
    const res = await fetch(`${API_URL}/api/ping`);
    const data = await res.json();
    if (data.ok) {
      connectionStatus.innerHTML = `🟢 Соединение с backend успешно`;
    } else {
      connectionStatus.innerHTML = `🔴 Ошибка соединения`;
    }
  } catch (err) {
    connectionStatus.innerHTML = `🔴 Ошибка: backend недоступен`;
  }
}
checkConnection();

// ===== Создание токена =====
createBtn.addEventListener("click", async () => {
  const name = nameInput.value.trim();
  const symbol = symbolInput.value.trim();
  const decimals = decimalsInput.value.trim();
  const supply = supplyInput.value.trim();
  const description = descriptionInput.value.trim();

  if (!name || !symbol || !supply) {
    chatDiv.innerHTML = "❗ Заполни все обязательные поля (Name, Symbol, Supply)";
    return;
  }

  chatDiv.innerHTML = "⏳ Создание токена...";

  try {
    const res = await fetch(`${API_URL}/api/create-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, symbol, decimals, supply, description })
    });

    const data = await res.json();

    if (res.ok) {
      chatDiv.innerHTML = `
        ✅ <b>${data.message}</b><br><br>
        <b>Mint:</b> ${data.mint}<br>
        <a href="${data.solscan}" target="_blank" style="color:#00ff7f;">Открыть в Solscan</a>
      `;
    } else {
      chatDiv.innerHTML = `❌ Ошибка: ${data.error || "Неизвестная"}`;
    }
  } catch (err) {
    chatDiv.innerHTML = `⚠️ Ошибка сети: ${err.message}`;
  }
});

// ===== Проверка баланса кошелька =====
balanceBtn.addEventListener("click", async () => {
  const address = walletInput.value.trim();
  if (!address) {
    balanceDisplay.innerHTML = "❗ Введи адрес кошелька";
    return;
  }

  balanceDisplay.innerHTML = "⏳ Получаем баланс...";

  try {
    const res = await fetch(`${API_URL}/api/balance/${address}`);
    const data = await res.json();

    if (!res.ok) {
      balanceDisplay.innerHTML = `❌ Ошибка: ${data.error}`;
      return;
    }

    balanceDisplay.innerHTML = `
      💰 <b>SOL:</b> ${data.sol.toFixed(4)}<br>
      🪙 <b>Токены:</b>
    `;

    if (data.tokens.length === 0) {
      tokenDisplay.innerHTML = `<div class="token-card">Нет токенов</div>`;
    } else {
      tokenDisplay.innerHTML = data.tokens
        .map(
          (t) => `
          <div class="token-card">
            <span><b>Mint:</b> ${t.mint}</span>
            <span><b>Баланс:</b> ${t.amount}</span>
          </div>`
        )
        .join("");
    }
  } catch (err) {
    balanceDisplay.innerHTML = `⚠️ Ошибка при получении баланса: ${err.message}`;
  }
});
