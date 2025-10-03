document.addEventListener("DOMContentLoaded", () => {
  console.log("JS загружен");

  const input = document.getElementById("chatInput");
  const sendBtn = document.getElementById("sendBtn");
  const chatBox = document.getElementById("chatBox");

  if (!input || !sendBtn || !chatBox) {
    console.error("Элементы чата не найдены");
    return;
  }

  sendBtn.addEventListener("click", async () => {
    const message = input.value.trim();
    if (!message) return;

    // выводим сообщение пользователя
    const userMsg = document.createElement("div");
    userMsg.innerText = "Вы: " + message;
    chatBox.appendChild(userMsg);

    input.value = "";

    try {
      const res = await fetch("https://learnback-twta.onrender.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });

      const data = await res.json();

      // выводим ответ сервера
      const serverMsg = document.createElement("div");
      serverMsg.innerText = "Сервер: " + data.reply;
      chatBox.appendChild(serverMsg);

    } catch (err) {
      console.error(err);
      const errorMsg = document.createElement("div");
      errorMsg.innerText = "Ошибка при обращении к серверу";
      chatBox.appendChild(errorMsg);
    }
  });
});

