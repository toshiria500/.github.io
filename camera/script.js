// gemini_auto_capitalize_guard
const video = document.getElementById('webcam');
const canvas = document.getElementById('output_canvas');
const ctx = canvas.getContext('2d');
const progressBar = document.getElementById('progress-bar');
const sizeInfo = document.getElementById('size-info');
const loadingOverlay = document.getElementById('loading-overlay');

let detector;

const model_url = "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite";
const wasm_url = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";

async function fetch_with_progress(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error("モデルの取得に失敗しました。");

    const reader = response.body.getReader();
    const total = Number(response.headers.get('Content-Length')) || 0;

    let loaded = 0;
    let chunks = [];

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        loaded += value.length;

        if (total > 0) {
            const percent = Math.round((loaded / total) * 100);
            progressBar.style.width = percent + "%";
            sizeInfo.innerText =
                `${(loaded / 1024 / 1024).toFixed(1)} MB / ${(total / 1024 / 1024).toFixed(1)} MB (${percent}%)`;
        } else {
            sizeInfo.innerText = `${(loaded / 1024 / 1024).toFixed(1)} MB`;
        }
    }

    return URL.createObjectURL(new Blob(chunks));
}

async function init() {
    try {
        // MediaPipeはwindow直下に展開される
        const vision = window;

        // モデルダウンロード
        const blobUrl = await fetch_with_progress(model_url);

        // WASM初期化
        const fileset = await vision.FilesetResolver.forVisionTasks(wasm_url);

        // Detector作成（まずはCPUで安定動作）
        detector = await vision.ObjectDetector.createFromOptions(fileset, {
            baseOptions: {
                modelAssetPath: blobUrl,
                delegate: "CPU"
            },
            scoreThreshold: 0.5,
            runningMode: "VIDEO"
        });

        loadingOverlay.style.display = "none";
        start_camera();

    } catch (err) {
        const errorDiv = document.getElementById('error-display');
        errorDiv.innerText = "Error: " + err.message;
        errorDiv.style.display = "block";
        loadingOverlay.style.display = "none";
    }
}

async function start_camera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "environment" }, width: 640 },
            audio: false
        });

        video.srcObject = stream;
        video.addEventListener("loadeddata", predict);

    } catch (e) {
        alert("カメラの起動に失敗しました。");
    }
}

async function predict() {
    if (!detector) return;

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

        const label = d.categories?.[0]?.categoryName ?? "unknown";

        ctx.fillStyle = "#00FF00";
        ctx.font = "bold 18px sans-serif";
        ctx.fillText(label, box.originX, box.originY - 5);
    });

    requestAnimationFrame(predict);
}

// 開始
init();