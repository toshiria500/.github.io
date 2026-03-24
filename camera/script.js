import {
  FilesetResolver,
  ObjectDetector
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/vision_bundle.mjs";

const video = document.getElementById('webcam');
const canvas = document.getElementById('output_canvas');
const ctx = canvas.getContext('2d');
const loading = document.getElementById('loading');

let detector;

const model_url =
  "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite";

async function init() {
  try {
    // WASM初期化
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    // Detector作成
    detector = await ObjectDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: model_url,
        delegate: "CPU"
      },
      scoreThreshold: 0.5,
      runningMode: "VIDEO"
    });

    loading.style.display = "none";
    startCamera();

  } catch (err) {
    loading.innerText = "Error: " + err.message;
  }
}

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false
    });

    video.srcObject = stream;
    video.addEventListener("loadeddata", predict);

  } catch (e) {
    loading.innerText = "カメラの起動に失敗しました";
  }
}

async function predict() {
  if (!detector) return;

  if (canvas.width !== video.videoWidth) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  }

  const results = detector.detectForVideo(video, performance.now());

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  results.detections.forEach(d => {
    const box = d.boundingBox;

    ctx.strokeStyle = "#00FF00";
    ctx.lineWidth = 3;
    ctx.strokeRect(box.originX, box.originY, box.width, box.height);

    const label = d.categories?.[0]?.categoryName ?? "unknown";

    ctx.fillStyle = "#00FF00";
    ctx.font = "16px sans-serif";
    ctx.fillText(label, box.originX, box.originY - 5);
  });

  requestAnimationFrame(predict);
}

init();