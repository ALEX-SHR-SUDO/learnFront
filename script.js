document.addEventListener("DOMContentLoaded", () => {
  const BACKEND_URL = "https://learnback-twta.onrender.com";

  const createBtn = document.getElementById("createBtn");
  const getBalanceBtn = document.getElementById("getBalanceBtn");
  const getTokensBtn = document.getElementById("getTokensBtn");

  // === Создание токена ===
  createBtn.addEventListener("click", async () => {
    const name = document.getElementById("name").value;
    const symbol = document.getElementById("symbol").value;
    const decimals = parseInt(document.getElementById("decimals").value);
    const supply = parseFloat(document.getElementById("supply").value);
    const description = document.getElementById("description").value;

    const chat = document.getElementById("chat");
    chat.innerText = "Создаю токен...";

    try {
      const res = await fetch(`${BACKEND_URL}/api/create-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, symbol, decimals, supply, description })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || JSON.stringify(data));

      chat.innerText = `✅ Токен создан: ${data.mint}`;
    } catch (err) {
      chat.innerText = "❌ Ошибка: " + err.message;
    }
  });

  // === Показать баланс SOL ===
  getBalanceBtn.addEventListener("click", async () => {
    const walletAddress = document.getElementById("walletAddress").value;
    const balanceDisplay = document.getElementById("balanceDisplay");
    if (!walletAddress) return alert("Введите адрес кошелька!");

    try {
      const res = await fetch(`${BACKEND_URL}/api/balance/${walletAddress}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || JSON.stringify(data));

      balanceDisplay.innerText = `💰 SOL: ${data.sol}`;
    } catch (err) {
      balanceDisplay.innerText = "❌ Ошибка: " + err.message;
    }
  });

  // === Показать токены ===
  getTokensBtn.addEventListener("click", async () => {
    const walletAddress = document.getElementById("walletAddress").value;
    const tokenDisplay = document.getElementById("tokenDisplay");
    if (!walletAddress) return alert("Введите адрес кошелька!");

    try {
      const res = await fetch(`${BACKEND_URL}/api/balance/${walletAddress}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || JSON.stringify(data));

      if (!data.tokens || data.tokens.length === 0) {
        tokenDisplay.innerText = "Нет токенов";
        return;
      }

      tokenDisplay.innerHTML = data.tokens
        .map(
          t => `<div class="token-card"><div>${t.mint}</div><div>${t.amount}</div></div>`
        )
        .join("");
    } catch (err) {
      tokenDisplay.innerText = "❌ Ошибка: " + err.message;
    }
  });
});
