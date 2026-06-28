// 公開時はこの2項目だけ更新します。
const APP_META = Object.freeze({
  version: '0.3.0',
  lastUpdated: '2026年6月28日 21:38',
});

const audio = document.querySelector('#audio');
const fileInput = document.querySelector('#audioFile');
const fileButton = document.querySelector('#fileButton');
const playButton = document.querySelector('#playButton');
const stopButton = document.querySelector('#stopButton');
const resumeButton = document.querySelector('#resumeButton');
const safeExitButton = document.querySelector('#safeExitButton');
const sessionMessage = document.querySelector('#sessionMessage');
const playLabel = document.querySelector('#playLabel');
const progress = document.querySelector('#progress');
const trackName = document.querySelector('#trackName');
const trackTime = document.querySelector('#trackTime');
const statusLight = document.querySelector('#statusLight');
const statusText = document.querySelector('#statusText');
const sensitivity = document.querySelector('#sensitivity');
const sensitivityValue = document.querySelector('#sensitivityValue');
const signalValue = document.querySelector('#signalValue');
const canvas = document.querySelector('#visualizer');
const ctx = canvas.getContext('2d');

let audioContext = null;
let analyser = null;
let source = null;
let frequencyData = null;
let timeData = null;
let objectUrl = null;
let isConnected = false;
let animationFrameId = null;
let isRendering = false;
let backgroundResumePending = false;
let sessionEnded = false;
let sensitivityAmount = Number(sensitivity.value);
let visualMode = 'ring';

const formatTime = (value) => {
  if (!Number.isFinite(value)) return '00:00';
  const mins = Math.floor(value / 60).toString().padStart(2, '0');
  const secs = Math.floor(value % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.round(rect.width * ratio);
  canvas.height = Math.round(rect.height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function showMessage(message) {
  sessionMessage.textContent = message;
  sessionMessage.hidden = false;
}

function hideMessage() {
  sessionMessage.hidden = true;
  sessionMessage.textContent = '';
}

function createAudioGraph() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) throw new Error('AudioContext is not supported');
    audioContext = new AudioContextClass();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.82;
    frequencyData = new Uint8Array(analyser.frequencyBinCount);
    timeData = new Uint8Array(analyser.fftSize);
    source = audioContext.createMediaElementSource(audio);
  }

  if (!isConnected) {
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    isConnected = true;
  }
}

function disconnectAudioGraph() {
  if (!isConnected) return;
  try { source.disconnect(); } catch (error) { console.debug(error); }
  try { analyser.disconnect(); } catch (error) { console.debug(error); }
  isConnected = false;
}

async function suspendAudioGraph() {
  if (audioContext && audioContext.state === 'running') {
    try { await audioContext.suspend(); } catch (error) { console.debug(error); }
  }
}

function setPlayingUI(playing) {
  playButton.classList.toggle('is-playing', playing);
  playButton.setAttribute('aria-label', playing ? '一時停止' : '再生');
  playLabel.textContent = playing ? '一時停止' : '再生';
  statusLight.classList.toggle('is-playing', playing);
  statusText.textContent = playing ? 'PLAYING' : 'READY';
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  signalValue.textContent = '00';
}

function drawIdleRing(width, height) {
  const x = width / 2;
  const y = height / 2;
  const radius = Math.min(width, height) * 0.27;
  const accent = getComputedStyle(document.body).getPropertyValue('--accent').trim();
  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function averageLevel(values, count) {
  let total = 0;
  for (let i = 0; i < count; i += 1) total += values[i] / 255;
  return Math.round((total / count) * 100);
}

function drawRing(width, height, accent, accent2) {
  const centerX = width / 2;
  const centerY = height / 2;
  const base = Math.min(width, height) * 0.28;
  const bars = 72;
  for (let i = 0; i < bars; i += 1) {
    const value = frequencyData[i] / 255;
    const angle = (Math.PI * 2 * i) / bars - Math.PI / 2;
    const length = 7 + value * Math.min(width, height) * 0.2 * sensitivityAmount;
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);
    const gradient = ctx.createLinearGradient(base, 0, base + length, 0);
    gradient.addColorStop(0, accent);
    gradient.addColorStop(1, accent2);
    ctx.strokeStyle = gradient;
    ctx.globalAlpha = 0.28 + value * 0.72;
    ctx.lineWidth = 2.3 + value * 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(base, 0);
    ctx.lineTo(base + length, 0);
    ctx.stroke();
    ctx.restore();
  }
  return averageLevel(frequencyData, bars);
}

function drawWave(width, height, accent, accent2) {
  const bars = analyser.frequencyBinCount;
  const bandWidth = width / bars;
  const centerY = height / 2;
  ctx.save();
  ctx.shadowColor = accent;
  ctx.shadowBlur = 13;
  ctx.lineCap = 'round';
  for (let i = 0; i < bars; i += 1) {
    const value = frequencyData[i] / 255;
    const x = i * bandWidth + bandWidth / 2;
    const amplitude = value * height * 0.35 * sensitivityAmount;
    const gradient = ctx.createLinearGradient(x, centerY - amplitude, x, centerY + amplitude);
    gradient.addColorStop(0, accent2);
    gradient.addColorStop(0.5, accent);
    gradient.addColorStop(1, accent2);
    ctx.strokeStyle = gradient;
    ctx.globalAlpha = 0.22 + value * 0.7;
    ctx.lineWidth = Math.max(2, bandWidth * 0.48);
    ctx.beginPath();
    ctx.moveTo(x, centerY - amplitude);
    ctx.lineTo(x, centerY + amplitude);
    ctx.stroke();
  }
  ctx.restore();
  return averageLevel(frequencyData, bars);
}

function drawBar(width, height, accent, accent2) {
  const bars = 48;
  const gap = Math.max(2, width * 0.004);
  const barWidth = (width - gap * (bars - 1)) / bars;
  const baseline = height * 0.84;
  for (let i = 0; i < bars; i += 1) {
    const dataIndex = Math.floor((i / bars) * frequencyData.length);
    const value = frequencyData[dataIndex] / 255;
    const barHeight = Math.max(3, value * height * 0.68 * sensitivityAmount);
    const x = i * (barWidth + gap);
    const gradient = ctx.createLinearGradient(0, baseline, 0, baseline - barHeight);
    gradient.addColorStop(0, accent2);
    gradient.addColorStop(1, accent);
    ctx.fillStyle = gradient;
    ctx.globalAlpha = 0.32 + value * 0.68;
    ctx.fillRect(x, baseline - barHeight, barWidth, barHeight);
  }
  ctx.globalAlpha = 1;
  return averageLevel(frequencyData, bars);
}

function drawOrbit(width, height, accent, accent2, timestamp) {
  const particles = 52;
  const centerX = width / 2;
  const centerY = height / 2;
  const baseRadius = Math.min(width, height) * 0.25;
  const phase = timestamp * 0.00035;
  ctx.save();
  ctx.shadowBlur = 12;
  for (let i = 0; i < particles; i += 1) {
    const dataIndex = Math.floor((i / particles) * frequencyData.length);
    const value = frequencyData[dataIndex] / 255;
    const angle = (i / particles) * Math.PI * 2 + phase * (1 + (i % 3) * 0.18);
    const radius = baseRadius + value * Math.min(width, height) * 0.2 * sensitivityAmount;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    ctx.fillStyle = i % 2 ? accent : accent2;
    ctx.shadowColor = ctx.fillStyle;
    ctx.globalAlpha = 0.35 + value * 0.65;
    ctx.beginPath();
    ctx.arc(x, y, 1.8 + value * 5.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  return averageLevel(frequencyData, particles);
}

function drawAurora(width, height, accent, accent2, timestamp) {
  const layers = 4;
  const samples = 72;
  const phase = timestamp * 0.001;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  for (let layer = 0; layer < layers; layer += 1) {
    const centerY = height * (0.36 + layer * 0.09);
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, accent2);
    gradient.addColorStop(0.5, accent);
    gradient.addColorStop(1, accent2);
    ctx.strokeStyle = gradient;
    ctx.shadowColor = layer % 2 ? accent2 : accent;
    ctx.shadowBlur = 18;
    ctx.globalAlpha = 0.18 + layer * 0.07;
    ctx.lineWidth = 4 + layer * 2;
    ctx.beginPath();
    for (let i = 0; i < samples; i += 1) {
      const x = (i / (samples - 1)) * width;
      const dataIndex = Math.floor((i / samples) * timeData.length);
      const wave = (timeData[dataIndex] - 128) / 128;
      const drift = Math.sin(i * 0.16 + phase + layer * 1.3) * height * 0.045;
      const y = centerY + wave * height * 0.24 * sensitivityAmount + drift;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
  return averageLevel(frequencyData, 64);
}

function scheduleFrame() {
  if (isRendering && animationFrameId === null) {
    animationFrameId = requestAnimationFrame(render);
  }
}

function startRendering() {
  if (isRendering || document.hidden) return;
  isRendering = true;
  scheduleFrame();
}

function stopRendering(clear = false) {
  isRendering = false;
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  if (clear) clearCanvas();
}

function render(timestamp = 0) {
  animationFrameId = null;
  if (!isRendering) return;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (!width || !height) {
    scheduleFrame();
    return;
  }

  if (!analyser || audio.paused) {
    drawIdleRing(width, height);
    signalValue.textContent = '00';
    scheduleFrame();
    return;
  }

  analyser.getByteFrequencyData(frequencyData);
  if (visualMode === 'aurora') analyser.getByteTimeDomainData(timeData);
  ctx.clearRect(0, 0, width, height);
  const styles = getComputedStyle(document.body);
  const accent = styles.getPropertyValue('--accent').trim();
  const accent2 = styles.getPropertyValue('--accent-2').trim();
  const drawers = {
    ring: () => drawRing(width, height, accent, accent2),
    wave: () => drawWave(width, height, accent, accent2),
    bar: () => drawBar(width, height, accent, accent2),
    orbit: () => drawOrbit(width, height, accent, accent2, timestamp),
    aurora: () => drawAurora(width, height, accent, accent2, timestamp),
  };
  const level = drawers[visualMode]();
  signalValue.textContent = String(level).padStart(2, '0');
  scheduleFrame();
}

function showResumePrompt() {
  if (!backgroundResumePending || !audio.src || sessionEnded) return;
  resumeButton.hidden = false;
  statusText.textContent = 'PAUSED';
  showMessage('バックグラウンド移行のため一時停止しました。再生を戻すには「再開する」を押してください。');
}

async function pauseForBackground() {
  if (sessionEnded) return;
  if (!audio.paused && !audio.ended) backgroundResumePending = true;
  audio.pause();
  stopRendering();
  await suspendAudioGraph();
}

async function resumeAfterBackground() {
  if (!backgroundResumePending || !audio.src || sessionEnded) return;
  try {
    createAudioGraph();
    if (audioContext.state === 'suspended') await audioContext.resume();
    await audio.play();
    backgroundResumePending = false;
    resumeButton.hidden = true;
    hideMessage();
    startRendering();
  } catch (error) {
    console.error(error);
    showMessage('再開できませんでした。もう一度「再開する」を押してください。');
  }
}

async function safeExit() {
  sessionEnded = true;
  backgroundResumePending = false;
  audio.pause();
  if (Number.isFinite(audio.duration)) audio.currentTime = 0;
  progress.value = 0;
  await suspendAudioGraph();
  disconnectAudioGraph();
  stopRendering(true);
  setPlayingUI(false);
  statusText.textContent = 'ENDED';
  resumeButton.hidden = true;
  playButton.disabled = true;
  stopButton.disabled = true;
  progress.disabled = true;
  safeExitButton.disabled = true;
  showMessage('再生を終了しました。この画面は閉じても大丈夫です。');
}

fileButton.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => {
  const [file] = fileInput.files;
  if (!file) return;
  audio.pause();
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = URL.createObjectURL(file);
  audio.src = objectUrl;
  trackName.textContent = file.name;
  sessionEnded = false;
  backgroundResumePending = false;
  playButton.disabled = false;
  stopButton.disabled = false;
  progress.disabled = false;
  safeExitButton.disabled = false;
  resumeButton.hidden = true;
  hideMessage();
  statusText.textContent = 'LOADED';
  startRendering();
});

playButton.addEventListener('click', async () => {
  if (!audio.src || sessionEnded) return;
  try {
    createAudioGraph();
    if (audioContext.state === 'suspended') await audioContext.resume();
    if (audio.paused) await audio.play(); else audio.pause();
    startRendering();
  } catch (error) {
    console.error(error);
    showMessage('再生を開始できませんでした。音源を選び直してお試しください。');
  }
});

stopButton.addEventListener('click', () => {
  backgroundResumePending = false;
  resumeButton.hidden = true;
  hideMessage();
  audio.pause();
  audio.currentTime = 0;
});
resumeButton.addEventListener('click', resumeAfterBackground);
safeExitButton.addEventListener('click', safeExit);

audio.addEventListener('play', () => setPlayingUI(true));
audio.addEventListener('pause', () => setPlayingUI(false));
audio.addEventListener('loadedmetadata', () => {
  trackTime.textContent = `00:00 / ${formatTime(audio.duration)}`;
});
audio.addEventListener('timeupdate', () => {
  progress.value = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
  trackTime.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
});
audio.addEventListener('ended', () => {
  audio.currentTime = 0;
  progress.value = 0;
});

progress.addEventListener('input', () => {
  if (audio.duration) audio.currentTime = (progress.value / 100) * audio.duration;
});
sensitivity.addEventListener('input', () => {
  sensitivityAmount = Number(sensitivity.value);
  sensitivityValue.textContent = `${sensitivityAmount.toFixed(1)}×`;
});
document.querySelectorAll('.visual-mode').forEach((button) => button.addEventListener('click', () => {
  visualMode = button.dataset.visual;
  document.querySelectorAll('.visual-mode').forEach((mode) => {
    mode.classList.toggle('is-active', mode === button);
    mode.setAttribute('aria-pressed', String(mode === button));
  });
}));
document.querySelectorAll('.theme-dot').forEach((button) => button.addEventListener('click', () => {
  document.body.classList.remove('theme-amber', 'theme-lavender');
  if (button.dataset.theme === 'amber') document.body.classList.add('theme-amber');
  if (button.dataset.theme === 'lavender') document.body.classList.add('theme-lavender');
  document.querySelectorAll('.theme-dot').forEach((dot) => {
    dot.classList.toggle('is-active', dot === button);
  });
}));

document.querySelector('#fullscreenButton').addEventListener('click', async () => {
  const deck = document.querySelector('.deck');
  try {
    if (document.fullscreenElement && document.exitFullscreen) await document.exitFullscreen();
    else if (deck.requestFullscreen) await deck.requestFullscreen();
  } catch (error) {
    console.debug(error);
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    void pauseForBackground();
  } else if (!sessionEnded) {
    startRendering();
    showResumePrompt();
  }
});
window.addEventListener('pagehide', () => { void pauseForBackground(); });
window.addEventListener('pageshow', () => {
  if (!sessionEnded && !document.hidden) {
    startRendering();
    showResumePrompt();
  }
});
window.addEventListener('beforeunload', () => {
  audio.pause();
  stopRendering();
  disconnectAudioGraph();
  if (audioContext && audioContext.state === 'running') void audioContext.suspend();
  if (objectUrl) URL.revokeObjectURL(objectUrl);
});
window.addEventListener('resize', resizeCanvas);

document.querySelector('#appVersion').textContent = APP_META.version;
document.querySelector('#lastUpdated').textContent = APP_META.lastUpdated;
resizeCanvas();
startRendering();
