const input = document.getElementById("apiKey");
const status = document.getElementById("status");
const btn = document.getElementById("saveKey");

const saved = localStorage.getItem("GEMINI_API_KEY");
if (saved) {
  input.value = "*".repeat(24);
}

btn.addEventListener("click", () => {
  const val = input.value.trim();
  if (!val || val.startsWith("*")) {
    status.textContent = "新しいキーを入力してください";
    return;
  }
  localStorage.setItem("GEMINI_API_KEY", val);
  input.value = "*".repeat(24);
  status.textContent = "保存しました";
});