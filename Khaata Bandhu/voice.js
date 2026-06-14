const micBtn     = document.getElementById('micBtn');
const statusText = document.getElementById('statusText');
const resultBox  = document.getElementById('resultBox');
const resultText = document.getElementById('resultText');
const rawText    = document.getElementById('rawText');

let isListening    = false;
let resultReceived = false;
let recognition    = null;

// ── Request mic permission on page load ───────────────────────────────────
async function initVoice() {
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });

    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SR();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onresult = (event) => {
        resultReceived = true;
        const transcript = event.results[0][0].transcript;
        processInput(transcript);
      };

      recognition.onerror = (e) => {
        console.error("Speech error:", e.error);
        statusText.innerText = `Error: ${e.error}`;
        isListening = false;
        micBtn.classList.remove('listening');
      };

      recognition.onend = () => {
        isListening = false;
        micBtn.classList.remove('listening');
        if (!resultReceived) statusText.innerText = "Click mic and speak";
      };

      micBtn.disabled = false;
      statusText.innerText = "Click mic and speak";

    } else {
      statusText.innerText = "❌ Voice not supported in this browser";
    }

  } catch (err) {
    console.error("Mic permission denied:", err);
    statusText.innerText = "❌ Mic blocked — allow mic in Chrome settings";
    micBtn.disabled = true;
  }
}

initVoice();

// ── Mic button click ──────────────────────────────────────────────────────
micBtn.addEventListener('click', () => {
  if (!recognition) {
    statusText.innerText = "❌ Voice not ready.";
    return;
  }
  if (!isListening) {
    isListening = true;
    resultReceived = false;
    micBtn.classList.add('listening');
    statusText.innerText = "Listening... speak now!";
    resultBox.style.display = 'none';
    recognition.start();
  } else {
    recognition.stop();
  }
});

// ── Process voice input ───────────────────────────────────────────────────
function processInput(text) {
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
    "from","the","a","an","for","of","and","to","by"
  ]);

  const words = lower.replace(/[^a-zA-Z0-9\s]/g, "").split(/\s+/);
  const nameArray = [];
  for (const word of words) {
    if (!word || stopWords.has(word) || !isNaN(word)) continue;
    nameArray.push(word.charAt(0).toUpperCase() + word.slice(1));
    if (nameArray.length >= 2) break;
  }

  const name  = nameArray.length > 0 ? nameArray.join(" ") : "Unknown";
  const color = type === 'CREDIT' ? '#f87171' : '#34d399';

  if (amount && amount > 0) {
    resultText.innerHTML = `<strong>${name}</strong> &bull; &#8377;${amount} <span style="color:${color}">[${type}]</span>`;
  } else {
    resultText.innerText = "⚠️ No amount found. Try again.";
  }
  rawText.innerText = `Raw: "${text}"`;
}