const video      = document.getElementById('video');
const canvas     = document.getElementById('canvas');
const overlay    = document.getElementById('overlay');
const captureBtn = document.getElementById('captureBtn');
const retryBtn   = document.getElementById('retryBtn');
const statusText = document.getElementById('statusText');
const resultBox  = document.getElementById('resultBox');
const resultText = document.getElementById('resultText');
const rawText    = document.getElementById('rawText');
const preview    = document.getElementById('preview');

// ── Start Camera ──────────────────────────────────────────────────────────
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }, // rear camera on phones
      audio: false
    });
    video.srcObject = stream;
    video.onloadedmetadata = () => {
      overlay.style.display = 'none';
      captureBtn.disabled = false;
      statusText.innerText = "Camera ready — point at bill and capture";
    };
  } catch (err) {
    console.error("Camera error:", err);
    overlay.innerText = "❌ Camera blocked — allow camera access";
    statusText.innerText = "Camera permission denied";
  }
}

startCamera();

// ── Capture & OCR ─────────────────────────────────────────────────────────
captureBtn.addEventListener('click', async () => {
  // Draw current video frame to canvas
  canvas.width  = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);

  // Show snapshot preview
  const imageDataUrl = canvas.toDataURL('image/png');
  preview.src = imageDataUrl;
  preview.style.display = 'block';

  // Pause camera, show retake button
  video.pause();
  captureBtn.disabled = true;
  retryBtn.style.display = 'block';
  resultBox.style.display = 'none';
  statusText.innerText = "🔄 Running OCR...";

  // Convert dataURL to blob for Tesseract
  const blob = dataURLtoBlob(imageDataUrl);

  try {
    // Read lang data as array buffer and pass directly
    const langResponse = await fetch(chrome.runtime.getURL('lang-data/eng.traineddata'));
    const langData = await langResponse.arrayBuffer();
    const result = await Tesseract.recognize(blob, 'eng', {
      workerPath: chrome.runtime.getURL('worker.min.js'),
      corePath: chrome.runtime.getURL('tesseract-core-simd-lstm.wasm.js'),
      workerBlobURL: false,
      langData: { eng: new Uint8Array(langData) },
      logger: m => {
        if (m.status === 'recognizing text') {
          statusText.innerText = `Reading: ${Math.round(m.progress * 100)}%`;
        }
      }
    });

    const text = result.data.text.trim();
    if (!text) {
      statusText.innerText = "⚠️ No text found — try better lighting";
      return;
    }
    processOCR(text);

  } catch (err) {
    console.error("OCR error:", err);
    statusText.innerText = "❌ OCR failed — check console";
  }
});

// ── Retake button ─────────────────────────────────────────────────────────
retryBtn.addEventListener('click', () => {
  preview.style.display = 'none';
  preview.src = '';
  resultBox.style.display = 'none';
  retryBtn.style.display = 'none';
  captureBtn.disabled = false;
  statusText.innerText = "Camera ready — point at bill and capture";
  video.play();
});

// ── Convert dataURL to Blob ───────────────────────────────────────────────
function dataURLtoBlob(dataURL) {
  const parts = dataURL.split(',');
  const mime  = parts[0].match(/:(.*?);/)[1];
  const bytes = atob(parts[1]);
  const arr   = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

// ── Process OCR text ──────────────────────────────────────────────────────
function processOCR(text) {
  statusText.innerText = "✅ Transaction Mapped!";
  resultBox.style.display = 'block';

  const lower = text.toLowerCase();

  const numbers = lower.match(/\d+(\.\d+)?/g);
  const amount  = numbers ? Math.max(...numbers.map(Number)) : null;

  let type = "CREDIT";
  if (lower.includes("paid")    ||
      lower.includes("cash")    ||
      lower.includes("settled") ||
      lower.includes("jama")    ||
      lower.includes("received")) {
    type = "PAID";
  }

  const stopWords = new Set([
    "took","rupees","rupee","rs","inr","on","credit","udhar",
    "paid","cash","settled","jama","total","bill","invoice",
    "from","the","a","an","for","of","and","to","by",
    "amount","date","tax","gst","net","sub","item","qty",
    "price","rate","receipt","no","number","phone","mob"
  ]);

  const words = lower.replace(/[^a-zA-Z0-9\s]/g, "").split(/\s+/);
  const nameArray = [];
  for (const word of words) {
    if (!word || stopWords.has(word) || !isNaN(word)) continue;
    nameArray.push(word.charAt(0).toUpperCase() + word.slice(1));
    if (nameArray.length >= 2) break;
  }

  const name  = nameArray.length > 0 ? nameArray.join(" ") : "Photo Entry";
  const color = type === 'CREDIT' ? '#f87171' : '#34d399';

  if (amount && amount > 0) {
    resultText.innerHTML = `<strong>${name}</strong> &bull; &#8377;${amount} <span style="color:${color}">[${type}]</span>`;
  } else {
    resultText.innerText = "⚠️ No amount found in image.";
  }

  const preview = text.trim().substring(0, 80);
  rawText.innerText = `Raw: "${preview}${text.length > 80 ? '...' : ''}"`;
}