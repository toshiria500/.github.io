const form = document.getElementById("storyForm");
const chat = document.getElementById("chat");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const apiKey = localStorage.getItem("GEMINI_API_KEY");
  if (!apiKey) {
    alert("先に設定画面で APIキーを登録してください");
    return;
  }

  const data = {
    name: name.value,
    action: action.value,
    item: item.value,
    companion: companion.value,
    enemy: enemy.value || "なし"
  };

  const user = document.createElement("div");
  user.className = "bubble user";
  user.textContent = Object.entries(data)
    .map(([k,v]) => `${k}: ${v}`).join("\n");
  chat.appendChild(user);

  const bot = document.createElement("div");
  bot.className = "botContainer";
  bot.innerHTML = `
    <img src="../static/bot_icon.png" class="botIcon">
    <div class="botText">生成中…</div>
  `;
  chat.appendChild(bot);

  const prompt = `
あなたは八雲紫です。
幻想郷での出来事を語ってください。

名前: ${data.name}
行動: ${data.action}
持ち物: ${data.item}
お供: ${data.companion}
敵: ${data.enemy}

生存率と帰還可能かも明示してください。
`;

  try {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const json = await res.json();
    bot.querySelector(".botText").textContent =
      json.candidates?.[0]?.content?.parts?.[0]?.text
      || "生成に失敗したわ…";

  } catch {
    bot.querySelector(".botText").textContent = "通信エラーよ";
  }
});