/**
 * script.js - MediaPipe Object Detection Logic
 */

// --- 設定値 ---
const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite";
const WASM_PATH = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm";

// --- 要素取得 ---
const video = document.getElementById('webcam');
const canvas = document.getElementById('output_canvas');
const ctx = canvas.getContext('2d');
const progressBar = document.getElementById('progress-bar');
const sizeInfo = document.getElementById('size-info');
const errorDisplay = document.getElementById('error-display');
const loadingOverlay = document.getElementById('loading-overlay');
const statusMsg = document.getElementById('status-msg');

let objectDetector;
let lastVideoTime = -1;

/**
 * エラー表示
 */
function reportError(message) {
    errorDisplay.style.display = "block";
    errorDisplay.innerHTML = `<strong>エラーが発生しました:</strong><br>${message}`;
    loadingOverlay.style.display = "none";
}

/**
 * モデルをダウンロードして進捗を計算
 */
async function downloadModel(url) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.responseType = "blob";

        xhr.onprogress = (e) => {
            if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100);
                const loadedMB = (e.loaded / 1024 / 1024).toFixed(1);
                const totalMB = (e.total / 1024 / 1024).toFixed(1);
                
                progressBar.style.width = percent + "%";
                sizeInfo.innerText = `${loadedMB} MB / ${totalMB} MB (${percent}%)`;
            }
        };

        xhr.onload = () => {
            if (xhr.status === 200) {
                resolve(URL.createObjectURL(xhr.response));
            } else {
                reject(`モデル取得失敗 (HTTP ${xhr.status})`);
            }
        };
        xhr.onerror = () => reject("ネットワークエラーによりモデルをダウンロードできませんでした。");
        xhr.send();
    });
}

/**
 * 初期化
 */
async function startApp() {
    try {
        // MediaPipeライブラリ(vision_bundle.js)の読み込みを1秒だけ待機する安全策
        if (!window.tasksVision) {
            await new Promise(r => setTimeout(r, 1000));
        }

        const vision = window.tasksVision;
        if (!vision) {
            throw new Error("MediaPipeライブラリが見つかりません。通信状態を確認してください。");
        }

        // モデルファイルをダウンロード
        const blobUrl = await downloadModel(MODEL_URL);

        // WebAssemblyエンジンの準備
        const fileset = await vision.FilesetResolver.forVisionTasks(WASM_PATH);

        // 物体検知器の生成
        objectDetector = await vision.ObjectDetector.createFromOptions(fileset, {
            baseOptions: {
                modelAssetPath: blobUrl,
                delegate: "GPU"
            },
            scoreThreshold: 0.5,
            runningMode: "VIDEO"
        });

        loadingOverlay.style.display = "none";
        statusMsg.innerText = "カメラを準備しています...";
        
        initCamera();

    } catch (err) {
        reportError(err);
    }
}

/**
 * カメラ制御（外カメ優先ロジック）
 */
async function initCamera() {
    const constraints = {
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
    };

    try {
        // 外カメラ(environment)を「厳密に(exact)」指定して試行
        const rearConstraints = {
            ...constraints,
            video: { ...constraints.video, facingMode: { exact: "environment" } }
        };
        video.srcObject = await navigator.mediaDevices.getUserMedia(rearConstraints);
        statusMsg.innerText = "外カメラ（背面）稼働中";
    } catch (e) {
        // 外カメがない・拒否された場合は通常のカメラで再試行
        try {
            video.srcObject = await navigator.mediaDevices.getUserMedia(constraints);
            statusMsg.innerText = "標準カメラ稼働中（外カメ非対応）";
        } catch (e2) {
            reportError("カメラの使用が許可されていないか、カメラデバイスが見つかりません。");
            return;
        }
    }

    video.onloadeddata = () => {
        runDetectionLoop();
    };
}

/**
 * リアルタイムループ
 */
async function runDetectionLoop() {
    // キャンバスをビデオ解像度に合わせる
    if (canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
    }

    // 映像のコマが進んだ時だけ判定を実行
    if (video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        const results = await objectDetector.detectForVideo(video, performance.now());
        renderDetections(results);
    }

    requestAnimationFrame(runDetectionLoop);
}

/**
 * 判定結果を描画
 */
function renderDetections(results) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    results.detections.forEach(d => {
        const { originX, originY, width, height } = d.boundingBox;
        const category = d.categories[0];
        
        // 日本語ラベル用マップ
        const jaLabels = {
            "person": "人", "cell phone": "スマホ", "laptop": "パソコン",
            "cup": "コップ", "bottle": "ボトル", "chair": "椅子", "dog": "犬", "cat": "猫"
        };
        const name = jaLabels[category.categoryName] || category.categoryName;
        const score = Math.round(category.score * 100);

        // 枠の描画
        ctx.strokeStyle = "#00FF00";
        ctx.lineWidth = 4;
        ctx.strokeRect(originX, originY, width, height);

        // ラベルの背景
        ctx.fillStyle = "#00FF00";
        ctx.font = "bold 18px Arial";
        const labelStr = `${name} (${score}%)`;
        const textWidth = ctx.measureText(labelStr).width;
        ctx.fillRect(originX, originY - 30, textWidth + 10, 30);

        // ラベルの文字
        ctx.fillStyle = "#000";
        ctx.fillText(labelStr, originX + 5, originY - 8);
    });
}

// アプリ開始
window.onload = startApp;
