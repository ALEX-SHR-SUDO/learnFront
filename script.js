document.addEventListener("DOMContentLoaded", () => {
  console.log("JS загружен");

  const chatBox = document.getElementById("chatBox");
  const sendBtn = document.getElementById("sendBtn");

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

  sendBtn.addEventListener("click", async () => {
    const payload = {
      name: inputs.name.value.trim(),
      symbol: inputs.symbol.value.trim(),
      decimals: inputs.decimals.value.trim(),
      supply: inputs.supply.value.trim(),
      description: inputs.description.value.trim()
    };

    // выводим, что отправили
    const userMsg = document.createElement("div");
    userMsg.innerText = "Вы: " + JSON.stringify(payload);
    chatBox.appendChild(userMsg);

    try {
      const res = await fetch("https://learnback-twta.onrender.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      // выводим каждый ответ построчно
      Object.values(data).forEach(replyLine => {
        const serverMsg = document.createElement("div");
        serverMsg.innerText = "Сервер: " + replyLine;
        chatBox.appendChild(serverMsg);
      });

      chatBox.scrollTop = chatBox.scrollHeight;
    } catch (err) {
      console.error(err);
      const errorMsg = document.createElement("div");
      errorMsg.innerText = "Ошибка при обращении к серверу";
      chatBox.appendChild(errorMsg);
    }
  });
});
