
const form = document.getElementById("storyForm");
const chat = document.getElementById("chat");
const requiredFields = ["name", "action", "item", "companion"];

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // 必須入力チェック
  let hasError = false;
  requiredFields.forEach(id => {
    const el = document.getElementById(id);
    if (!el.value.trim()) {
      el.classList.add("error");
      hasError = true;
    } else {
      el.classList.remove("error");
    }
  });
  if (hasError) return alert("必須項目が入力されていません");

  // 入力値取得
  const name = document.getElementById("name").value.trim();
  const action = document.getElementById("action").value.trim();
  const item = document.getElementById("item").value.trim();
  const companion = document.getElementById("companion").value.trim();
  const enemy = document.getElementById("enemy").value.trim() || "なし";

  // ユーザーバブルを表示
  const userBubble = document.createElement("div");
  userBubble.className = "bubble user";
  userBubble.textContent = `名前: ${name}\n行動: ${action}\n持ち物: ${item}\nお供: ${companion}\n敵: ${enemy}`;
  chat.appendChild(userBubble);

  // ボットバブル（生成中）
  const botContainer = document.createElement("div");
  botContainer.className = "botContainer";

  const botIcon = document.createElement("img");
  botIcon.src = "../static/bot_icon.png";
  botIcon.className = "botIcon";
  botContainer.appendChild(botIcon);

  const botText = document.createElement("div");
  botText.className = "botText loading";
  botText.textContent = "🤖 生成中…";
  botContainer.appendChild(botText);

  chat.appendChild(botContainer);
  chat.scrollTop = chat.scrollHeight;

  // Gemini API 呼び出し
  try {
    const res = await fetch("/api/gensokyo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, action, item, companion, enemy })
    });

    if (!res.ok) throw new Error(`APIエラー: ${res.status}`);

    const data = await res.json();
    await typeText(botText, data.text); // 一文字ずつ表示
  } catch(err) {
    botText.textContent = "エラーが発生しました";
    console.error(err);
  }
});

// 一文字ずつ表示
function typeText(el, text, delay=25) {
  return new Promise(resolve => {
    el.classList.remove("loading");
    el.textContent = "";
    let i=0;
    function nextChar() {
      if (i < text.length) {
        el.textContent += text[i];
        chat.scrollTop = chat.scrollHeight;
        i++;
        setTimeout(nextChar, delay);
      } else resolve();
    }
    nextChar();
  });
}