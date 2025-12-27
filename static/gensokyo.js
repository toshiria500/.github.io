const apiKey = localStorage.getItem("GEMINI_API_KEY");

const form = document.getElementById("storyForm");
const chat = document.getElementById("chat");

// 入力要素の取得
const nameInput = document.getElementById("name");
const actionInput = document.getElementById("action");
const itemInput = document.getElementById("item");
const companionInput = document.getElementById("companion");
const enemyInput = document.getElementById("enemy");

// 必須項目のリスト
const requiredInputs = [nameInput, actionInput, itemInput, companionInput];

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // 1. 必須チェック
  let hasError = false;
  requiredInputs.forEach(input => {
    if (!input.value.trim()) {
      input.classList.add("error"); // CSSで赤くする
      hasError = true;
    } else {
      input.classList.remove("error");
    }
  });

  if (hasError) {
    alert("必須項目を入力してください");
    return;
  }

  // 2. APIキーチェック
  if (!apiKey) {
    pushBotMessage("鍵の気配が感じられないわ。<br>下の「設定」からAPIキーを保存してきて。");
    return;
  }

  // 3. ユーザーの入力内容を取得
  const data = {
    name: nameInput.value.trim(),
    action: actionInput.value.trim(),
    item: itemInput.value.trim(),
    companion: companionInput.value.trim(),
    enemy: enemyInput.value.trim() || "なし"
  };

  // 4. ユーザーの入力をチャット欄に表示（右側）
  pushUserMessage(`【挑戦者】${data.name}
行動：${data.action}
持ち物：${data.item}
お供：${data.companion}
敵：${data.enemy}`);

  // 5. Botの「生成中...」を表示
  const loadingId = pushBotMessage("運命の糸を紡いでいるわ…（生成中）");

  // プロンプト作成
  const enemyText = data.enemy !== "なし"
    ? `## ⚔ 敵の行動\n- 敵(${data.enemy})が何を企んだか\n- 主人公に対して何をしてきたか`
    : "";

  const prompt = `
あなたは東方Projectの世界「幻想郷」の語り部です。以下のシチュエーションでストーリーを作成してください。

## 入力情報
- 名前：${data.name}
- 行動：${data.action}
- 持ち物：${data.item}
- お供：${data.companion}
- 敵：${data.enemy}

## 出力ルール
- Markdown形式で出力
- ユーモアとシリアスを交える
- 幻想郷の住人の口調で語る

## 🧭 行動の結果
- 何が起きたか具体的に描写
- お供キャラの反応や活躍
- 持ち物がどう役に立ったか（あるいは役に立たなかったか）

${enemyText}

## 📊 生存率
- 0% 〜 100% の数値とその理由を一言で

## ☯ 結末
- **生存** または **死亡** （太字で）
- 幻想郷に残るか、帰還するか、消滅するか
`;

  try {
    // 6. Gemini APIへ送信
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

    if (!json.candidates || !json.candidates[0].content) {
      throw new Error("Geminiからの応答が空でした。APIキーを確認するか、少し待ってから試してください。");
    }

    const text = json.candidates[0].content.parts[0].text;

    // 7. 生成中のメッセージを削除して、結果を表示
    removeMessage(loadingId);
    pushBotMessage(marked.parse(text), true); // markedでMarkdownをHTMLに変換

  } catch (err) {
    removeMessage(loadingId);
    pushBotMessage(`運命が見えないわ…エラーが起きたみたい。<br><small>${err.message}</small>`, true);
    console.error(err);
  }
});

// Botのメッセージを表示する関数（HTML許可フラグ付き）
function pushBotMessage(text, isHtml = false) {
  const msgId = "msg-" + Date.now();
  const box = document.createElement("div");
  box.className = "botContainer";
  box.id = msgId;
  
  box.innerHTML = `
    <img src="../static/bot_icon.png" class="botIcon">
    <div class="botText">${isHtml ? text : text}</div>
  `;
  
  chat.appendChild(box);
  scrollToBottom();
  return msgId; // IDを返す（後で消すため）
}

// ユーザーのメッセージを表示する関数
function pushUserMessage(text) {
  const box = document.createElement("div");
  box.className = "userBubble";
  box.textContent = text;
  chat.appendChild(box);
  scrollToBottom();
}

// 特定のメッセージを消す関数（ローディング表示消去用）
function removeMessage(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

// 一番下へスクロール
function scrollToBottom() {
  // ページ全体を下にスクロールさせるのが自然
  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: 'smooth'
  });
}
