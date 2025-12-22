document.getElementById("settingForm").addEventListener("submit", e => {
  e.preventDefault();

  const apiKey = document.getElementById("apiKey").value.trim();
  const systemPrompt = document.getElementById("systemPrompt").value.trim();

  if (!apiKey) {
    document.getElementById("apiKey").classList.add("input-error");
    return;
  }

  localStorage.setItem("gensokyo_api_key", apiKey);
  localStorage.setItem("gensokyo_prompt", systemPrompt);

  alert("設定を保存しました");
});