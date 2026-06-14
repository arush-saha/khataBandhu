document.addEventListener('DOMContentLoaded', () => {
  const micBtn        = document.getElementById('micBtn');
  const fileInput     = document.getElementById('fileInput');
  const statusText    = document.getElementById('statusText');
  const outputBox     = document.getElementById('outputBox');
  const outputText    = document.getElementById('outputText');
  const rawText       = document.getElementById('rawText');
  const dashboardLink = document.getElementById('dashboardLink');

  const LIVE_DASHBOARD_URL = "https://github.com/samarthj-7/khataBandhu";
  dashboardLink.href = LIVE_DASHBOARD_URL;

  // ── Mic Button: opens voice.html in a new tab ─────────────────────────
  micBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('voice.html') });
  });

  // ── Camera Button: opens camera.html in a new tab ─────────────────────
  document.getElementById('cameraBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('camera.html') });
  });

  // ── OCR Pipeline (file upload) ────────────────────────────────────────
  fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    outputBox.style.display = 'block';
    outputText.innerText = "🔄 Initializing OCR Engine...";
    rawText.innerText = "";
    statusText.innerText = "Reading image pixels...";

    try {
      // Read lang data as array buffer and pass directly
      const langResponse = await fetch(chrome.runtime.getURL('lang-data/eng.traineddata'));
      const langData = await langResponse.arrayBuffer();
      const result = await Tesseract.recognize(file, 'eng', {
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

      const extractedText = result.data.text.trim();
      if (!extractedText) {
        outputText.innerText = "⚠️ No text found in image.";
        statusText.innerText = "Try a clearer photo.";
        return;
      }

      processUnifiedInput(extractedText, "Photo Scan");
    } catch (error) {
      console.error("Tesseract error:", error);
      outputText.innerText = "❌ OCR failed. Check console for details.";
      statusText.innerText = "Error reading image.";
    } finally {
      fileInput.value = "";
    }
  });

  // ── Central Processing ────────────────────────────────────────────────
  function processUnifiedInput(text, sourceChannel) {
    statusText.innerText = "Transaction Mapped!";
    outputBox.style.display = 'block';

    const lowerText = text.toLowerCase();

    const numberMatches = lowerText.match(/\d+(\.\d+)?/g);
    const amount = numberMatches
      ? Math.max(...numberMatches.map(Number))
      : null;

    let type = "CREDIT";
    if (
      lowerText.includes("paid")    ||
      lowerText.includes("cash")    ||
      lowerText.includes("settled") ||
      lowerText.includes("jama")    ||
      lowerText.includes("received")
    ) {
      type = "PAID";
    }

    const stopWords = new Set([
      "took", "rupees", "rupee", "rs", "inr", "on", "credit", "udhar",
      "paid", "cash", "settled", "jama", "total", "bill", "invoice",
      "from", "the", "a", "an", "for", "of", "and", "to", "by",
      "amount", "date", "tax", "gst", "net", "sub", "item", "qty",
      "price", "rate", "receipt", "no", "number", "phone", "mob"
    ]);

    const words = lowerText
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .split(/\s+/);

    const nameArray = [];
    for (const word of words) {
      if (!word || stopWords.has(word) || !isNaN(word)) continue;
      nameArray.push(word.charAt(0).toUpperCase() + word.slice(1));
      if (nameArray.length >= 2) break;
    }

    const finalName = nameArray.length > 0 ? nameArray.join(" ") : "Photo Voucher Entry";

    if (amount !== null && amount > 0) {
      const typeColor = type === 'CREDIT' ? '#f87171' : '#34d399';
      outputText.innerHTML = `
        <strong>${finalName}</strong> &bull; &#8377;${amount}
        <span style="color:${typeColor}">[${type}]</span>
      `;
    } else {
      outputText.innerText = "⚠️ No payment amount found.";
    }

    const preview = text.trim().substring(0, 60);
    rawText.innerText = `Source: ${sourceChannel} | Raw: "${preview}${text.length > 60 ? '...' : ''}"`;
  }
});