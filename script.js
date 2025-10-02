console.log("JS загружен");

const button = document.getElementById("myButton");
const responseEl = document.getElementById("response");

if (!button || !responseEl) {
  console.error("Элементы кнопки или response не найдены");
} else {
  button.addEventListener("click", async () => {
    console.log("Кнопка нажата");

    try {
      const res = await fetch("https://learnback-twta.onrender.com/button-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clicked: true })
      });

      const data = await res.json();
      responseEl.innerText = data.message;
    } catch (err) {
      console.error(err);
      responseEl.innerText = "Ошибка при обращении к серверу";
    }
  });
}
