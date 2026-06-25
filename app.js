const audio = document.querySelector('#audio');
const fileInput = document.querySelector('#audioFile');
const fileButton = document.querySelector('#fileButton');
const playButton = document.querySelector('#playButton');
const stopButton = document.querySelector('#stopButton');
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

let audioContext, analyser, source, dataArray, objectUrl, isConnected = false;
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
  canvas.width = rect.width * ratio;
  canvas.height = rect.height * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function createAudioGraph() {
  if (audioContext) return;
  audioContext = new AudioContext();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.82;
  dataArray = new Uint8Array(analyser.frequencyBinCount);
  source = audioContext.createMediaElementSource(audio);
  source.connect(analyser);
  analyser.connect(audioContext.destination);
  isConnected = true;
}

function setPlayingUI(playing) {
  playButton.classList.toggle('is-playing', playing);
  playButton.setAttribute('aria-label', playing ? '一時停止' : '再生');
  playLabel.textContent = playing ? '一時停止' : '再生';
  statusLight.classList.toggle('is-playing', playing);
  statusText.textContent = playing ? 'PLAYING' : 'READY';
}

function drawIdleRing(width, height) {
  const x = width / 2, y = height / 2, radius = Math.min(width, height) * .27;
  const accent = getComputedStyle(document.body).getPropertyValue('--accent').trim();
  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = accent;
  ctx.globalAlpha = .35;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawRing(width, height, accent, accent2) {
  const centerX = width / 2, centerY = height / 2;
  const base = Math.min(width, height) * .28;
  const bars = 72;
  let total = 0;
  for (let i = 0; i < bars; i++) {
    const value = dataArray[i] / 255;
    total += value;
    const angle = (Math.PI * 2 * i) / bars - Math.PI / 2;
    const length = 7 + value * (Math.min(width, height) * .20) * sensitivityAmount;
    const start = base;
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);
    const grad = ctx.createLinearGradient(start, 0, start + length, 0);
    grad.addColorStop(0, accent); grad.addColorStop(1, accent2);
    ctx.strokeStyle = grad;
    ctx.globalAlpha = .28 + value * .72;
    ctx.lineWidth = 2.3 + value * 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(start, 0); ctx.lineTo(start + length, 0); ctx.stroke();
    ctx.restore();
  }
  return Math.round((total / bars) * 100);
}

function drawWave(width, height, accent, accent2) {
  const bars = analyser.frequencyBinCount;
  const bandWidth = width / bars;
  const centerY = height / 2;
  let total = 0;
  ctx.save();
  ctx.shadowColor = accent;
  ctx.shadowBlur = 13;
  ctx.lineCap = 'round';
  for (let i = 0; i < bars; i++) {
    const value = dataArray[i] / 255;
    total += value;
    const x = i * bandWidth + bandWidth / 2;
    const amplitude = value * height * .35 * sensitivityAmount;
    const grad = ctx.createLinearGradient(x, centerY - amplitude, x, centerY + amplitude);
    grad.addColorStop(0, accent2); grad.addColorStop(.5, accent); grad.addColorStop(1, accent2);
    ctx.strokeStyle = grad;
    ctx.globalAlpha = .22 + value * .7;
    ctx.lineWidth = Math.max(2, bandWidth * .48);
    ctx.beginPath();
    ctx.moveTo(x, centerY - amplitude);
    ctx.lineTo(x, centerY + amplitude);
    ctx.stroke();
  }
  ctx.restore();
  ctx.globalAlpha = .18;
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(width * .08, centerY);
  ctx.lineTo(width * .92, centerY);
  ctx.stroke();
  ctx.globalAlpha = 1;
  return Math.round((total / bars) * 100);
}

function render() {
  const width = canvas.clientWidth, height = canvas.clientHeight;
  if (!width || !height) return requestAnimationFrame(render);
  if (!analyser || audio.paused) {
    drawIdleRing(width, height);
    signalValue.textContent = '00';
    return requestAnimationFrame(render);
  }
  analyser.getByteFrequencyData(dataArray);
  ctx.clearRect(0, 0, width, height);
  const accent = getComputedStyle(document.body).getPropertyValue('--accent').trim();
  const accent2 = getComputedStyle(document.body).getPropertyValue('--accent-2').trim();
  const level = visualMode === 'wave'
    ? drawWave(width, height, accent, accent2)
    : drawRing(width, height, accent, accent2);
  signalValue.textContent = String(level).padStart(2, '0');
  requestAnimationFrame(render);
}

fileButton.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => {
  const [file] = fileInput.files;
  if (!file) return;
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = URL.createObjectURL(file);
  audio.src = objectUrl;
  trackName.textContent = file.name;
  playButton.disabled = false;
  stopButton.disabled = false;
  progress.disabled = false;
  statusText.textContent = 'LOADED';
});

playButton.addEventListener('click', async () => {
  if (!audio.src) return;
  createAudioGraph();
  if (audioContext.state === 'suspended') await audioContext.resume();
  if (audio.paused) await audio.play(); else audio.pause();
});

stopButton.addEventListener('click', () => { audio.pause(); audio.currentTime = 0; });
audio.addEventListener('play', () => setPlayingUI(true));
audio.addEventListener('pause', () => setPlayingUI(false));
audio.addEventListener('loadedmetadata', () => { trackTime.textContent = `00:00 / ${formatTime(audio.duration)}`; });
audio.addEventListener('timeupdate', () => {
  progress.value = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
  trackTime.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
});
audio.addEventListener('ended', () => { audio.currentTime = 0; progress.value = 0; });
progress.addEventListener('input', () => { if (audio.duration) audio.currentTime = (progress.value / 100) * audio.duration; });
sensitivity.addEventListener('input', () => { sensitivityAmount = Number(sensitivity.value); sensitivityValue.textContent = `${sensitivityAmount.toFixed(1)}×`; });
document.querySelectorAll('.visual-mode').forEach((button) => button.addEventListener('click', () => {
  visualMode = button.dataset.visual;
  document.querySelectorAll('.visual-mode').forEach((mode) => mode.classList.toggle('is-active', mode === button));
}));
document.querySelectorAll('.theme-dot').forEach((button) => button.addEventListener('click', () => {
  document.body.classList.remove('theme-amber', 'theme-lavender');
  if (button.dataset.theme === 'amber') document.body.classList.add('theme-amber');
  if (button.dataset.theme === 'lavender') document.body.classList.add('theme-lavender');
  document.querySelectorAll('.theme-dot').forEach((dot) => dot.classList.toggle('is-active', dot === button));
}));
document.querySelector('#fullscreenButton').addEventListener('click', async () => {
  if (document.fullscreenElement) await document.exitFullscreen(); else await document.querySelector('.deck').requestFullscreen();
});
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); render();
