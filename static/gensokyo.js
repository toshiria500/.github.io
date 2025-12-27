const apiKey = localStorage.getItem("GEMINI_API_KEY");

const form = document.getElementById("storyForm");
const chat = document.getElementById("chat");

// 【修正点1】HTMLの入力欄をIDを使って明示的に取得します
const nameInput = document.getElementById("name");
const actionInput = document.getElementById("action");
const itemInput = document.getElementById("item");
const companionInput = document.getElementById("companion");
const enemyInput = document.getElementById("enemy");

form.addEventListener("submit", async (e) => {
  e.preventDefault(); // フォーム送信によるページリロードを防止

  if (!apiKey) {
    pushBotMessage("鍵の気配が感じられないわ。<br>先に設定画面で契約を結んできて。");
    return;
  }

  // 【修正点2】取得した要素（○○Input）から .value を読み取ります
  const data = {
    name: nameInput.value.trim(),
    action: actionInput.value.trim(),
    item: itemInput.value.trim(),
    companion: companionInput.value.trim(),
    enemy: enemyInput.value.trim() || "なし"
  };

  pushBotMessage("運命を覗いているわ…");

  const enemyText =
    data.enemy !== "なし"
      ? `## ⚔ 敵の行動
- 敵が何を企んだか
- 主人公に対して何をしてきたか`
      : "";

  const prompt = `
あなたは幻想郷を語る語り部です。

## 入力
- 名前：${data.name}
- 行動：${data.action}
- 持ち物：${data.item}
- お供：${data.companion}
- 敵：${data.enemy}

## ルール
- Markdown形式
- 生存率は0.1〜100
- .0なら整数表示

## 🧭 行動の結果
- 何が起きたか
- お供との行動
- 持ち物の影響

${enemyText}

## 📊 生存率
- 数値のみ

## ☯ 結末
- **生存** or **死亡**
- 理由必須

## 🌸 その後（生存時のみ）
- 元の世界に帰る
- 幻想郷に留まる
- どちらか一方
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
    
    // APIからのレスポンス構造チェック（エラーハンドリング強化）
    if (!json.candidates || !json.candidates[0] || !json.candidates[0].content) {
       throw new Error("Geminiからの応答が不正です（APIキーが無効か、リクエスト制限の可能性があります）");
    }

    const text = json.candidates[0].content.parts[0].text;

    pushBotMessage(marked.parse(text), true);

  } catch (err) {
    pushBotMessage("運命の糸が乱れたわ。もう一度試して。<br><small>" + err.message + "</small>", true);
    console.error(err);
  }
});

function pushBotMessage(text, isHtml = false) {
  const box = document.createElement("div");
  box.className = "botContainer";
  // isHtmlがtrueならinnerHTML、falseならtextContentを使うことでXSS対策と改行の両立を図るのが一般的ですが
  // 今回はmarked.jsの出力を信用してinnerHTMLを使います
  box.innerHTML = `
    <img src="../static/bot_icon.png" class="botIcon">
    <div class="botText">${text}</div>
  `;
  chat.appendChild(box);
  chat.scrollTop = chat.scrollHeight;
}
