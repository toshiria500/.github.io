const input = document.getElementById("apiKey");
const saveBtn = document.getElementById("saveKey");

// 1. ページ読み込み時
// ローカルストレージから実際のキーを取得して、そのままセットします。
// type="password" なので、画面上は黒丸（•••••）で表示されます。
const saved = localStorage.getItem("GEMINI_API_KEY");
if (saved) {
  input.value = saved;
}

// 2. 保存ボタンクリック時
saveBtn.addEventListener("click", () => {
  const value = input.value.trim();

  // 空欄チェック
  if (!value) {
    alert("APIキーを入力してください");
    return;
  }

  // そのまま保存（"********" などの判定は不要です）
  localStorage.setItem("GEMINI_API_KEY", value);
  
  alert("保存しました！\nブラウザの戻るボタンで戻ってください。");
});
