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
 * ライブラリの読み込みを待つ
 */
function wait_for_lib(limit = 10) {
    return new Promise((resolve, reject) => {
        let count = 0;
        const check = setInterval(() => {
            if (window.tasksVision) {
                clearInterval(check);
                resolve(window.tasksVision);
            }
            if (count >= limit) {
                clearInterval(check);
                reject("MediaPipe library not found. Check your network or script tag.");
            }
            count++;
        }, 500);
    });
}

/**
 * プログレスバー付きロード
 */
async function fetch_with_progress(url) {
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
        
        const percent = total ? Math.round((loaded / total) * 100) : 0;
        progressBar.style.width = percent + "%";
        sizeInfo.innerText = `${(loaded/1024/1024).toFixed(1)} MB / ${(total/1024/1024 || 0).toFixed(1)} MB (${percent}%)`;
    }

    return URL.createObjectURL(new Blob(chunks));
}

/**
 * 初期化
 */
async function init() {
    try {
        // 1. ライブラリがロードされるのを最大5秒待つ
        const vision = await wait_for_lib(10);

        // 2. モデルのロード
        const blobUrl = await fetch_with_progress(model_url);

        // 3. WASMエンジンの準備
        const fileset = await vision.FilesetResolver.forVisionTasks(wasm_url);

        // 4. 検知器の作成
        detector = await vision.ObjectDetector.createFromOptions(fileset, {
            baseOptions: { modelAssetPath: blobUrl, delegate: "GPU" },
            scoreThreshold: 0.5,
            runningMode: "VIDEO"
        });

        loadingOverlay.style.display = "none";
        await start_camera();
    } catch (err) {
        const errorDiv = document.getElementById('error-display');
        errorDiv.innerText = "Error: " + err;
        errorDiv.style.display = "block";
        loadingOverlay.style.display = "none";
    }
}

/**
 * カメラ開始
 */
async function start_camera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "environment" }, width: 640 },
            audio: false
        });
        video.srcObject = stream;
        video.onloadeddata = predict;
    } catch (e) {
        alert("カメラの起動に失敗しました。ブラウザの設定でカメラを許可してください。");
    }
}

/**
 * 判定ループ
 */
async function predict() {
    if (canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
    }

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

// 実行
window.onload = init;
