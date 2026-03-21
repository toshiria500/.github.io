// 音声認識オブジェクトの作成
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

recognition.lang = 'ja-JP'; // 日本語に設定
recognition.interimResults = true; // 認識途中の文字も表示する

// 音声認識が開始されたとき
recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
  console.log("認識した言葉:", transcript);
};

// ボタン操作などで開始
recognition.start();
