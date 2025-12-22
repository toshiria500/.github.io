const form = document.getElementById("storyForm");
const chat = document.getElementById("chat");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

 if (!apiKey) {
  const msg = document.createElement("div");
  msg.className = "botContainer";
  msg.innerHTML = `
    <img src="../static/bot_icon.png" class="botIcon">
    <div class="botText">
      鍵の気配が感じられないわ。<br>
      先に設定画面で契約を結んできて。
    </div>
  `;
  chat.appendChild(msg);
  chat.scrollTop = chat.scrollHeight;
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

const enemyText =
  data.enemy && data.enemy !== "なし"
    ? `- 敵：${data.enemy}`
    : `- 敵：なし`;

const prompt = `
あなたは「幻想郷」を舞台に運命を語る語り部です。
以下の入力情報を元に、物語形式で結果を生成してください。

【入力情報】
- 名前：${data.name}
- 行動：${data.action}
- 持ち物：${data.item}
- お供：${data.companion}
${enemyText}

【生成ルール】
1. 出力は Markdown 形式で記述すること
2. 生存率を 0.1〜100 の範囲で算出すること
   - 小数点以下が .0 の場合は整数で表示する
3. 以下の構成を必ず守ること

## 🧭 行動の結果
- 何が起きたのか
- お供と何をしたのか
- 持ち物がどう役立ったのか（または役立たなかったのか）

${
  data.enemy && data.enemy !== "なし"
    ? `## ⚔ 敵の行動
- 敵が何を企んだか
- 主人公に対して何をしてきたか`
    : ``
}

## 📊 生存率
- 数値で明示する

## ☯ 結末
- 結果は以下のどちらかのみ
  - **生存**
  - **死亡**
- 理由を必ず書くこと

## 🌸 その後（生存時のみ）
- 元の世界に帰れるのか
- 幻想郷に留まるのか
- どちらか一方のみを書くこと

全体の文体は、幻想的で落ち着いた語り口とする。
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