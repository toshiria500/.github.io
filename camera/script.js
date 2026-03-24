// 定数設定
const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite";
const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm";

// 要素の取得
const video = document.getElementById('webcam');
const canvas = document.getElementById('output_canvas');
const canvasCtx = canvas.getContext('2d');
const progressBar = document.getElementById('progress-bar');
const sizeInfo = document.getElementById('size-info');
const errorDiv = document.getElementById('error-message');

let objectDetector;

/**
 * エラー表示
 */
function showError(msg) {
    errorDiv.innerText = "エラー: " + msg;
    errorDiv.style.display = "block";
    document.getElementById('loading-overlay').style.display = "none";
}

/**
 * 進捗付きでモデルをダウンロード
 */
async function fetchModelWithProgress(url) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.responseType = "blob";

        xhr.onprogress = (e) => {
            if (e.lengthComputable) {
                const percent = (e.loaded / e.total) * 100;
                progressBar.style.width = percent + "%";
                sizeInfo.innerText = `${(e.loaded/1024/1024).toFixed(1)}MB / ${(e.total/1024/1024).toFixed(1)}MB`;
            }
        };

        xhr.onload = () => {
            if (xhr.status === 200) resolve(URL.createObjectURL(xhr.response));
            else reject(`モデルの取得に失敗 (Status: ${xhr.status})`);
        };
        xhr.onerror = () => reject("ネットワークエラーが発生しました。");
        xhr.send();
    });
}

/**
 * 初期化処理
 */
async function initialize() {
    try {
        // 1. ライブラリがロードされるのを待つ (ReferenceError対策)
        if (!window.tasksVision) {
            console.log("ライブラリの準備を待っています...");
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        const vision = window.tasksVision;
        if (!vision) {
            throw new Error("MediaPipeライブラリが見つかりません。ネット接続を確認してください。");
        }

        // 2. モデルのロード
        const modelBlobUrl = await fetchModelWithProgress(MODEL_URL);

        // 3. Wasmエンジンの準備
        const fileset = await vision.FilesetResolver.forVisionTasks(WASM_URL);

        // 4. ディテクターの作成
        objectDetector = await vision.ObjectDetector.createFromOptions(fileset, {
            baseOptions: {
                modelAssetPath: modelBlobUrl,
                delegate: "GPU"
            },
            scoreThreshold: 0.5,
            runningMode: "VIDEO"
        });

        // ロード画面を非表示にしてカメラ開始
        document.getElementById('loading-overlay').style.display = "none";
        startCamera();

    } catch (err) {
        showError(err);
        console.error(err);
    }
}

/**
 * カメラの起動
 */
async function startCamera() {
    const config = { width: 640, height: 480 };
    try {
        // 外カメラを試みる
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { exact: "environment" }, ...config },
            audio: false
        });
        video.srcObject = stream;
    } catch (e) {
        // 外カメラがない場合は標準カメラ
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: config,
                audio: false
            });
            video.srcObject = stream;
        } catch (e2) {
            showError("カメラの権限が拒否されたか、デバイスが見つかりません。");
        }
    }
    video.onloadeddata = predictLoop;
}

/**
 * 判定ループ
 */
async function predictLoop() {
    // キャンバスサイズ調整
    if (canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
    }

    // AI判定
    const startTimeMs = performance.now();
    const detections = await objectDetector.detectForVideo(video, startTimeMs);

    // 描画
    drawResults(detections);

    // 次のフレームへ
    window.requestAnimationFrame(predictLoop);
}

/**
 * 結果の描画
 */
function drawResults(results) {
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    results.detections.forEach(d => {
        const box = d.boundingBox;
        const category = d.categories[0];

        // 枠
        canvasCtx.strokeStyle = "#00FF00";
        canvasCtx.lineWidth = 3;
        canvasCtx.strokeRect(box.originX, box.originY, box.width, box.height);

        // ラベル
        canvasCtx.fillStyle = "#00FF00";
        canvasCtx.font = "18px sans-serif";
        const text = `${category.categoryName} (${Math.round(category.score * 100)}%)`;
        canvasCtx.fillText(text, box.originX, box.originY > 20 ? box.originY - 5 : 20);
    });
}

// 実行
initialize();
