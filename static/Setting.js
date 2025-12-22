const input = document.getElementById("apiKey");
const status = document.getElementById("status");

// 既に保存されているか確認
const saved = localStorage.getItem("GEMINI_API_KEY");
if (saved) {
  status.textContent = "APIキーは既に保存されています";
}

document.getElementById("save").addEventListener("click", () => {
  const key = input.value.trim();
  if (!key) {
    status.textContent = "APIキーを入力してください";
    return;
  }

  localStorage.setItem("GEMINI_API_KEY", key);

  // 伏字表示
  const masked = key.slice(0, 4) + "****" + key.slice(-4);
  status.textContent = `保存しました：${masked}`;

  input.value = "";
});