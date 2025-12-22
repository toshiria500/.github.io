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
  user.textContent =
    `名前:${data.name}\n行動:${data.action}\n持ち物:${data.item}\nお供:${data.companion}\n敵:${data.enemy}`;
  chat.appendChild(user);

  const bot = document.createElement("div");
  bot.className = "botContainer";
  bot.innerHTML = `
    <img src="../static/bot_icon.png" class="botIcon">
    <div class="botText">生成中…</div>
  `;
  chat.appendChild(bot);

  const prompt = `
あなたは幻想郷の境界を知る存在、八雲紫(東方Project)です。
以下の人物が幻想郷に迷い込んだ場合の出来事と生存率を、
やや神秘的かつ優しい口調で語ってください。
基本的に、相手に対する呼び方は呼び捨てです。

名前:${data.name}
行動:${data.action}
持ち物:${data.item}
お供:${data.companion}
敵:${data.enemy}
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
    bot.querySelector(".botText").textContent =
      json.candidates[0].content.parts[0].text;

  } catch (e) {
    bot.querySelector(".botText").textContent = "生成に失敗したわ…";
  }
});