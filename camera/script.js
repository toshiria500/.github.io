// gemini_auto_capitalize_guard
const video = document.getElementById('webcam');
const canvas = document.getElementById('output_canvas');
const ctx = canvas.getContext('2d');
const progressBar = document.getElementById('progress-bar');
const sizeInfo = document.getElementById('size-info');
const loadingOverlay = document.getElementById('loading-overlay');

let detector;
const model_url = "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite";
const wasm_url = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm";

/**
 * プログレスバー付きダウンロード
 */
async function fetchWithProgress(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const reader = response.body.getReader();
    const total = +response.headers.get('Content-Length');
    let loaded = 0;
    let chunks = [];

    while(true) {
        const {done, value} = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded += value.length;
        
        const percent = Math.round((loaded / total) * 100);
        progressBar.style.width = percent + "%";
        sizeInfo.innerText = `${(loaded/1024/1024).toFixed(1)} MB / ${(total/1024/1024).toFixed(1)} MB (${percent}%)`;
    }

    return URL.createObjectURL(new Blob(chunks));
}

/**
 * メイン初期化
 */
async function init() {
    try {
        const vision = window.tasksVision;
        if (!vision) throw new Error("MediaPipe library not found.");

        // モデルのロード
        const blobUrl = await fetchWithProgress(model_url);

        // WASMエンジンの準備
        const fileset = await vision.FilesetResolver.forVisionTasks(wasm_url);

        // 検知器の作成
        detector = await vision.ObjectDetector.createFromOptions(fileset, {
            baseOptions: { modelAssetPath: blobUrl, delegate: "GPU" },
            scoreThreshold: 0.5,
            runningMode: "VIDEO"
        });

        loadingOverlay.style.display = "none";
        await startCamera();
    } catch (err) {
        const errorDiv = document.getElementById('error-display');
        errorDiv.innerText = "Error: " + err.message;
        errorDiv.style.display = "block";
        loadingOverlay.style.display = "none";
    }
}

/**
 * カメラ開始
 */
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "environment" }, width: 640 },
            audio: false
        });
        video.srcObject = stream;
        video.onloadeddata = predict;
    } catch (e) {
        throw new Error("カメラの起動に失敗しました。設定を確認してください。");
    }
}

/**
 * 判定ループ
 */
async function predict() {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const results = await detector.detectForVideo(video, performance.now());
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    results.detections.forEach(d => {
        const box = d.boundingBox;
        ctx.strokeStyle = "#00FF00";
        ctx.lineWidth = 4;
        ctx.strokeRect(box.originX, box.originY, box.width, box.height);

        ctx.fillStyle = "#00FF00";
        ctx.font = "bold 18px sans-serif";
        ctx.fillText(d.categories[0].categoryName, box.originX, box.originY - 5);
    });
    
    requestAnimationFrame(predict);
}

// ページロード時に実行
window.onload = init;
