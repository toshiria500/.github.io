const input = document.getElementById("apiKey");
const saveBtn = document.getElementById("saveKey");

// 既存キーがあれば伏せ字表示
const saved = localStorage.getItem("GEMINI_API_KEY");
if (saved) {
  input.value = "********";
}

saveBtn.addEventListener("click", () => {
  const value = input.value.trim();

  if (!value || value === "********") {
    alert("新しいAPIキーを入力してください");
    return;
  }

  localStorage.setItem("GEMINI_API_KEY", value);
  alert("保存しました");
  input.value = "********";
});