const form = document.getElementById("storyForm");
const chat = document.getElementById("chat");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const apiKey = localStorage.getItem("GEMINI_API_KEY");
  if (!apiKey) {
    alert("先に設定画面でAPIキーを登録してください");
    return;
  }

  const data = {
    name: name.value.trim(),
    action: action.value.trim(),
    item: item.value.trim(),
    companion: companion.value.trim(),
    enemy: enemy.value.trim() || "なし"
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
  chat.scrollTop = chat.scrollHeight;

  const prompt = `
あなたは幻想郷の語り部です。

名前: ${data.name}
行動: ${data.action}
持ち物: ${data.item}
お供: ${data.companion}
敵: ${data.enemy}

以下の構成でMarkdown形式で出力してください。

## 🧭 行動の結果
## ⚔ 敵の行動
## 📊 生存率（0.1〜100）
## ☯ 結末（生存 or 死亡）
## 🌸 その後（生存時のみ）
`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const json = await res.json();
    const text = json.candidates[0].content.parts[0].text;

    bot.querySelector(".botText").innerHTML =
      marked.parse(text);

  } catch (err) {
    bot.querySelector(".botText").textContent =
      "生成中にエラーが発生しました";
    console.error(err);
  }
});