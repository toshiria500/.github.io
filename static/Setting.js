const input = document.getElementById("apiKey");
const status = document.getElementById("status");

document.getElementById("save").onclick = () => {
  if (!input.value.trim()) return;

  localStorage.setItem("GEMINI_API_KEY", input.value.trim());
  status.textContent = "保存しました（この端末のみ）";
  input.value = "";
};