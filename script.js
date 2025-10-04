document.addEventListener("DOMContentLoaded", () => {
  console.log("JS загружен");

  const API = "https://learnback-twta.onrender.com"; // или свой backend URL

  const chatBox = document.getElementById("chatBox");
  const sendBtn = document.getElementById("sendBtn");
  const airdropBtn = document.getElementById("airdropBtn");
  const balanceBtn = document.getElementById("balanceBtn");
  const balanceOut = document.getElementById("balance");

  const inputs = {
    name: document.getElementById("nameInput"),
    symbol: document.getElementById("symbolInput"),
    decimals: document.getElementById("decimalsInput"),
    supply: document.getElementById("supplyInput"),
    description: document.getElementById("descriptionInput")
  };

  if (!chatBox || !sendBtn) {
    console.error("Элементы формы не найдены");
    return;
  }

  function addMessage(text, type = "server") {
    const msg = document.createElement("div");
    msg.classList.add("message", type);
    msg.innerText = text;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  // === Отправка токена ===
  sendBtn.addEventListener("click", async () => {
    const payload = {
      name: inputs.name.value.trim(),
      symbol: inputs.symbol.value.trim(),
      decimals: inputs.decimals.value.trim(),
      supply: inputs.supply.value.trim(),
      description: inputs.description.value.trim()
    };

    addMessage(JSON.stringify(payload), "user");

    try {
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      Object.values(data).forEach(replyLine => addMessage(replyLine, "server"));
    } catch (err) {
      console.error(err);
      addMessage("Ошибка при обращении к серверу", "server");
    }
  });

  // === Airdrop ===
  airdropBtn.addEventListener("click", async () => {
    addMessage("💸 Запрашиваю airdrop...", "user");
    try {
      const res = await fetch(`${API}/airdrop`, { method: "POST" });
      const data = await res.json();
      addMessage(data.message || "Airdrop выполнен!", "server");
    } catch (err) {
      console.error(err);
      addMessage("❌ Ошибка при airdrop.", "server");
    }
  });

  // === Проверка баланса ===
  balanceBtn.addEventListener("click", async () => {
    addMessage("🔍 Проверяем баланс...", "user");
    balanceOut.innerText = "⏳ ...";
    try {
      const res = await fetch(`${API}/balance`);
      const data = await res.json();
      const sol = data.balance ?? 0;
      addMessage(`Баланс сервисного кошелька: ${sol} SOL`, "server");
      balanceOut.innerText = `${sol} SOL`;
    } catch (err) {
      console.error(err);
      balanceOut.innerText = "❌ Ошибка";
      addMessage("❌ Ошибка при проверке баланса.", "server");
    }
  });
});
