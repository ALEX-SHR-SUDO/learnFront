document.getElementById("myButton").addEventListener("click", async function() {
  try {
    const res = await fetch("https://learnback-twta.onrender.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clicked: true })
    });
    const data = await res.json();
    document.getElementById("response").innerText = data.message;
  } catch (err) {
    console.error(err);
    document.getElementById("response").innerText = "Ошибка при обращении к серверу";
  }
});
