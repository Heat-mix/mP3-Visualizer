// 公開時はこの2項目だけ更新します。
const APP_META = Object.freeze({
  version: '0.3.2',
  lastUpdated: '2026年9月11日 13:09',
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
const waveBuffer = document.createElement('canvas');
const waveBufferContext = waveBuffer.getContext('2d');
const sparkAccentBuffer = document.createElement('canvas');
const sparkAccentBufferContext = sparkAccentBuffer.getContext('2d');
const sparkAccent2Buffer = document.createElement('canvas');
const sparkAccent2BufferContext = sparkAccent2Buffer.getContext('2d');

let audioContext = null;
let analyser = null;
let source = null;
let frequencyData = null;
let timeData = null;
let objectUrl = null;
let isConnected = false;
let animationFrameId = null;
let isRendering = false;
let renderTimeline = null;
let audioSuspendTask = null;
let backgroundResumePending = false;
let sessionEnded = false;
let sensitivityAmount = Number(sensitivity.value);
let visualMode = 'ring';
let canvasWidth = 0;
let canvasHeight = 0;
let accentColor = '';
let accent2Color = '';
let lastSignalUpdate = -Infinity;
let displayedSignal = signalValue.textContent;
let ringGradientCache = [];
let ringAngles = null;
let ringGeometryWidth = 0;
let ringGeometryHeight = 0;
let ringCenterX = 0;
let ringCenterY = 0;
let ringMinimumSize = 0;
let ringBaseRadius = 0;
let ringGradientAccent = '';
let ringGradientAccent2 = '';
let ringGradientSensitivity = 0;
let waveGradientCache = [];
let waveXPositions = null;
let waveGeometryWidth = 0;
let waveGeometryBars = 0;
let waveLineWidth = 0;
let barGradientCache = [];
let barHeightValues = null;
let barAlphaValues = null;
let barDataIndices = null;
let barXPositions = null;
let barFrequencyDataLength = 0;
let barGeometryWidth = 0;
let barGeometryHeight = 0;
let barHeightTableHeight = 0;
let barHeightTableSensitivity = 0;
let barGap = 0;
let barWidth = 0;
let barBaseline = 0;
let barGradientAccent = '';
let barGradientAccent2 = '';
let orbitBaseSines = null;
let orbitBaseCosines = null;
let orbitSpeedGroups = null;
let orbitDataIndices = null;
let orbitFrequencyDataLength = 0;
let orbitGeometryWidth = 0;
let orbitGeometryHeight = 0;
let orbitCenterX = 0;
let orbitCenterY = 0;
let orbitMinimumSize = 0;
let orbitBaseRadius = 0;
let auroraGradient = null;
let auroraXPositions = null;
let auroraDataIndices = null;
let auroraWaveValues = null;
let auroraBaseSines = null;
let auroraBaseCosines = null;
let auroraGeometryWidth = 0;
let auroraTimeDataLength = 0;
let sparkParticles = [];
let previousSparkLevel = 0;
let sparkLastTimestamp = 0;
let sparkLastBurst = 0;

const TARGET_RENDER_FPS = 45;
const RENDER_INTERVAL = 1000 / TARGET_RENDER_FPS;
const SIGNAL_UPDATE_INTERVAL = 100;
const RING_BARS = 72;
const RING_GRADIENT_STEPS = 256;
const WAVE_GRADIENT_STEPS = 256;
const BAR_BARS = 48;
const BAR_GRADIENT_STEPS = 256;
const ORBIT_PARTICLES = 52;
const ORBIT_SPEED_MULTIPLIERS = new Float64Array([1, 1 + 0.18, 1 + 2 * 0.18]);
const ORBIT_PHASE_SINES = new Float64Array(ORBIT_SPEED_MULTIPLIERS.length);
const ORBIT_PHASE_COSINES = new Float64Array(ORBIT_SPEED_MULTIPLIERS.length);
const AURORA_LAYERS = 4;
const AURORA_SAMPLES = 72;

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
  waveBuffer.width = canvas.width;
  waveBuffer.height = canvas.height;
  waveBufferContext.setTransform(ratio, 0, 0, ratio, 0, 0);
  sparkAccentBuffer.width = canvas.width;
  sparkAccentBuffer.height = canvas.height;
  sparkAccentBufferContext.setTransform(ratio, 0, 0, ratio, 0, 0);
  sparkAccent2Buffer.width = canvas.width;
  sparkAccent2Buffer.height = canvas.height;
  sparkAccent2BufferContext.setTransform(ratio, 0, 0, ratio, 0, 0);
  invalidateRingCache(true);
  invalidateWaveCache(true);
  invalidateBarCache(true);
  invalidateAuroraCache(true);
  canvasWidth = canvas.clientWidth;
  canvasHeight = canvas.clientHeight;
  if (!isRendering && !document.hidden && !sessionEnded) drawIdleFrame();
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

function suspendAudioGraph() {
  if (audioSuspendTask) return audioSuspendTask;
  if (!audioContext || audioContext.state !== 'running') return Promise.resolve();

  audioSuspendTask = audioContext.suspend()
    .catch((error) => { console.debug(error); })
    .finally(() => { audioSuspendTask = null; });
  return audioSuspendTask;
}

async function resumeAudioGraph() {
  if (audioSuspendTask) await audioSuspendTask;
  if (audioContext && audioContext.state === 'suspended') await audioContext.resume();
}

function setPlayingUI(playing) {
  playButton.classList.toggle('is-playing', playing);
  playButton.setAttribute('aria-label', playing ? '一時停止' : '再生');
  playLabel.textContent = playing ? '一時停止' : '再生';
  statusLight.classList.toggle('is-playing', playing);
  statusText.textContent = playing ? 'PLAYING' : 'READY';
}

function refreshVisualStyles() {
  const styles = getComputedStyle(document.body);
  accentColor = styles.getPropertyValue('--accent').trim();
  accent2Color = styles.getPropertyValue('--accent-2').trim();
  invalidateRingCache();
  invalidateWaveCache();
  invalidateBarGradientCache();
  invalidateAuroraCache();
}

function updateSignalValue(level, timestamp = 0, force = false) {
  if (!force && timestamp - lastSignalUpdate < SIGNAL_UPDATE_INTERVAL) return;
  const nextValue = String(level).padStart(2, '0');
  if (nextValue !== displayedSignal) {
    signalValue.textContent = nextValue;
    displayedSignal = nextValue;
  }
  lastSignalUpdate = timestamp;
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  updateSignalValue(0, 0, true);
}

function drawIdleRing(width, height) {
  const x = width / 2;
  const y = height / 2;
  const radius = Math.min(width, height) * 0.27;
  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = accentColor;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawIdleFrame() {
  if (!canvasWidth || !canvasHeight) return;
  drawIdleRing(canvasWidth, canvasHeight);
  updateSignalValue(0, 0, true);
}

function averageLevel(values, count) {
  let total = 0;
  for (let i = 0; i < count; i += 1) total += values[i] / 255;
  return Math.round((total / count) * 100);
}

function invalidateRingCache(geometryChanged = false) {
  ringGradientCache.length = 0;
  ringGradientAccent = '';
  ringGradientAccent2 = '';
  ringGradientSensitivity = 0;
  if (geometryChanged) {
    ringGeometryWidth = 0;
    ringGeometryHeight = 0;
  }
}

function prepareRingCache(width, height, accent, accent2) {
  if (!ringAngles) {
    ringAngles = new Float64Array(RING_BARS);
    for (let i = 0; i < RING_BARS; i += 1) {
      ringAngles[i] = (Math.PI * 2 * i) / RING_BARS - Math.PI / 2;
    }
  }

  if (ringGeometryWidth !== width || ringGeometryHeight !== height) {
    ringCenterX = width / 2;
    ringCenterY = height / 2;
    ringMinimumSize = Math.min(width, height);
    ringBaseRadius = ringMinimumSize * 0.28;
    ringGeometryWidth = width;
    ringGeometryHeight = height;
    ringGradientCache.length = 0;
  }

  const gradientChanged = ringGradientCache.length !== RING_GRADIENT_STEPS
    || ringGradientAccent !== accent
    || ringGradientAccent2 !== accent2
    || ringGradientSensitivity !== sensitivityAmount;
  if (!gradientChanged) return;

  ringGradientCache.length = 0;
  for (let dataValue = 0; dataValue < RING_GRADIENT_STEPS; dataValue += 1) {
    const value = dataValue / 255;
    const length = 7 + value * ringMinimumSize * 0.2 * sensitivityAmount;
    const gradient = ctx.createRadialGradient(
      ringCenterX,
      ringCenterY,
      ringBaseRadius,
      ringCenterX,
      ringCenterY,
      ringBaseRadius + length,
    );
    gradient.addColorStop(0, accent);
    gradient.addColorStop(1, accent2);
    ringGradientCache.push(gradient);
  }
  ringGradientAccent = accent;
  ringGradientAccent2 = accent2;
  ringGradientSensitivity = sensitivityAmount;
}

function drawRing(width, height, accent, accent2) {
  prepareRingCache(width, height, accent, accent2);
  let total = 0;
  ctx.save();
  ctx.lineCap = 'round';
  for (let i = 0; i < RING_BARS; i += 1) {
    const dataValue = frequencyData[i];
    const value = dataValue / 255;
    const length = 7 + value * ringMinimumSize * 0.2 * sensitivityAmount;
    total += value;
    ctx.save();
    ctx.translate(ringCenterX, ringCenterY);
    ctx.rotate(ringAngles[i]);
    ctx.strokeStyle = ringGradientCache[dataValue];
    ctx.globalAlpha = 0.28 + value * 0.72;
    ctx.lineWidth = 2.3 + value * 2.4;
    ctx.beginPath();
    ctx.moveTo(ringBaseRadius, 0);
    ctx.lineTo(ringBaseRadius + length, 0);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
  return Math.round((total / RING_BARS) * 100);
}

function invalidateWaveCache(geometryChanged = false) {
  waveGradientCache.length = 0;
  if (geometryChanged) {
    waveXPositions = null;
    waveGeometryWidth = 0;
    waveGeometryBars = 0;
  }
}

function prepareWaveCache(width, height, bars, accent, accent2) {
  if (!waveXPositions || waveGeometryWidth !== width || waveGeometryBars !== bars) {
    const bandWidth = width / bars;
    waveXPositions = new Float32Array(bars);
    for (let i = 0; i < bars; i += 1) {
      waveXPositions[i] = i * bandWidth + bandWidth / 2;
    }
    waveGeometryWidth = width;
    waveGeometryBars = bars;
    waveLineWidth = Math.max(2, bandWidth * 0.48);
  }

  if (waveGradientCache.length === WAVE_GRADIENT_STEPS) return;
  const centerY = height / 2;
  for (let dataValue = 0; dataValue < WAVE_GRADIENT_STEPS; dataValue += 1) {
    const value = dataValue / 255;
    const amplitude = value * height * 0.35 * sensitivityAmount;
    const gradient = waveBufferContext.createLinearGradient(0, centerY - amplitude, 0, centerY + amplitude);
    gradient.addColorStop(0, accent2);
    gradient.addColorStop(0.5, accent);
    gradient.addColorStop(1, accent2);
    waveGradientCache.push(gradient);
  }
}

function drawWave(width, height, accent, accent2) {
  const bars = analyser.frequencyBinCount;
  const centerY = height / 2;
  prepareWaveCache(width, height, bars, accent, accent2);
  waveBufferContext.clearRect(0, 0, width, height);
  waveBufferContext.save();
  waveBufferContext.shadowBlur = 0;
  waveBufferContext.lineCap = 'round';
  waveBufferContext.lineWidth = waveLineWidth;
  for (let i = 0; i < bars; i += 1) {
    const dataValue = frequencyData[i];
    const value = dataValue / 255;
    const x = waveXPositions[i];
    const amplitude = value * height * 0.35 * sensitivityAmount;
    waveBufferContext.strokeStyle = waveGradientCache[dataValue];
    waveBufferContext.globalAlpha = 0.22 + value * 0.7;
    waveBufferContext.beginPath();
    waveBufferContext.moveTo(x, centerY - amplitude);
    waveBufferContext.lineTo(x, centerY + amplitude);
    waveBufferContext.stroke();
  }
  waveBufferContext.restore();

  ctx.save();
  ctx.shadowColor = accent;
  ctx.shadowBlur = 13;
  ctx.drawImage(waveBuffer, 0, 0, width, height);
  ctx.restore();
  return averageLevel(frequencyData, bars);
}

function invalidateBarGradientCache() {
  barGradientCache.length = 0;
  barGradientAccent = '';
  barGradientAccent2 = '';
}

function invalidateBarCache(geometryChanged = false) {
  invalidateBarGradientCache();
  barHeightValues = null;
  barHeightTableHeight = 0;
  barHeightTableSensitivity = 0;
  if (geometryChanged) {
    barXPositions = null;
    barGeometryWidth = 0;
    barGeometryHeight = 0;
  }
}

function prepareBarCache(width, height, accent, accent2) {
  if (!barDataIndices || barFrequencyDataLength !== frequencyData.length) {
    barDataIndices = new Uint16Array(BAR_BARS);
    for (let i = 0; i < BAR_BARS; i += 1) {
      barDataIndices[i] = Math.floor((i / BAR_BARS) * frequencyData.length);
    }
    barFrequencyDataLength = frequencyData.length;
  }

  if (!barXPositions || barGeometryWidth !== width || barGeometryHeight !== height) {
    barGap = Math.max(2, width * 0.004);
    barWidth = (width - barGap * (BAR_BARS - 1)) / BAR_BARS;
    barBaseline = height * 0.84;
    barXPositions = new Float64Array(BAR_BARS);
    for (let i = 0; i < BAR_BARS; i += 1) {
      barXPositions[i] = i * (barWidth + barGap);
    }
    barGeometryWidth = width;
    barGeometryHeight = height;
    invalidateBarGradientCache();
  }

  if (!barAlphaValues) {
    barAlphaValues = new Float64Array(BAR_GRADIENT_STEPS);
    for (let dataValue = 0; dataValue < BAR_GRADIENT_STEPS; dataValue += 1) {
      barAlphaValues[dataValue] = 0.32 + (dataValue / 255) * 0.68;
    }
  }

  const heightTableChanged = !barHeightValues
    || barHeightTableHeight !== height
    || barHeightTableSensitivity !== sensitivityAmount;
  if (heightTableChanged) {
    barHeightValues = new Float64Array(BAR_GRADIENT_STEPS);
    for (let dataValue = 0; dataValue < BAR_GRADIENT_STEPS; dataValue += 1) {
      barHeightValues[dataValue] = Math.max(3, (dataValue / 255) * height * 0.68 * sensitivityAmount);
    }
    barHeightTableHeight = height;
    barHeightTableSensitivity = sensitivityAmount;
    invalidateBarGradientCache();
  }

  const gradientChanged = barGradientCache.length !== BAR_GRADIENT_STEPS
    || barGradientAccent !== accent
    || barGradientAccent2 !== accent2;
  if (!gradientChanged) return;

  barGradientCache.length = 0;
  for (let dataValue = 0; dataValue < BAR_GRADIENT_STEPS; dataValue += 1) {
    const barHeight = barHeightValues[dataValue];
    const gradient = ctx.createLinearGradient(0, barBaseline, 0, barBaseline - barHeight);
    gradient.addColorStop(0, accent2);
    gradient.addColorStop(1, accent);
    barGradientCache.push(gradient);
  }
  barGradientAccent = accent;
  barGradientAccent2 = accent2;
}

function drawBar(width, height, accent, accent2) {
  prepareBarCache(width, height, accent, accent2);
  for (let i = 0; i < BAR_BARS; i += 1) {
    const dataValue = frequencyData[barDataIndices[i]];
    const barHeight = barHeightValues[dataValue];
    ctx.fillStyle = barGradientCache[dataValue];
    ctx.globalAlpha = barAlphaValues[dataValue];
    ctx.fillRect(barXPositions[i], barBaseline - barHeight, barWidth, barHeight);
  }
  ctx.globalAlpha = 1;
  return averageLevel(frequencyData, BAR_BARS);
}

function prepareOrbitCache(width, height) {
  if (!orbitBaseSines || !orbitBaseCosines || !orbitSpeedGroups) {
    orbitBaseSines = new Float64Array(ORBIT_PARTICLES);
    orbitBaseCosines = new Float64Array(ORBIT_PARTICLES);
    orbitSpeedGroups = new Uint8Array(ORBIT_PARTICLES);
    for (let i = 0; i < ORBIT_PARTICLES; i += 1) {
      const baseAngle = (i / ORBIT_PARTICLES) * Math.PI * 2;
      orbitBaseSines[i] = Math.sin(baseAngle);
      orbitBaseCosines[i] = Math.cos(baseAngle);
      orbitSpeedGroups[i] = i % ORBIT_SPEED_MULTIPLIERS.length;
    }
  }

  if (!orbitDataIndices || orbitFrequencyDataLength !== frequencyData.length) {
    orbitDataIndices = new Uint16Array(ORBIT_PARTICLES);
    for (let i = 0; i < ORBIT_PARTICLES; i += 1) {
      orbitDataIndices[i] = Math.floor((i / ORBIT_PARTICLES) * frequencyData.length);
    }
    orbitFrequencyDataLength = frequencyData.length;
  }

  if (orbitGeometryWidth !== width || orbitGeometryHeight !== height) {
    orbitCenterX = width / 2;
    orbitCenterY = height / 2;
    orbitMinimumSize = Math.min(width, height);
    orbitBaseRadius = orbitMinimumSize * 0.25;
    orbitGeometryWidth = width;
    orbitGeometryHeight = height;
  }
}

function drawOrbit(width, height, accent, accent2, timestamp) {
  prepareOrbitCache(width, height);
  const phase = timestamp * 0.00035;
  for (let group = 0; group < ORBIT_SPEED_MULTIPLIERS.length; group += 1) {
    const groupPhase = phase * ORBIT_SPEED_MULTIPLIERS[group];
    ORBIT_PHASE_SINES[group] = Math.sin(groupPhase);
    ORBIT_PHASE_COSINES[group] = Math.cos(groupPhase);
  }

  ctx.save();
  ctx.shadowBlur = 12;
  for (let i = 0; i < ORBIT_PARTICLES; i += 1) {
    const value = frequencyData[orbitDataIndices[i]] / 255;
    const speedGroup = orbitSpeedGroups[i];
    const directionX = orbitBaseCosines[i] * ORBIT_PHASE_COSINES[speedGroup]
      - orbitBaseSines[i] * ORBIT_PHASE_SINES[speedGroup];
    const directionY = orbitBaseSines[i] * ORBIT_PHASE_COSINES[speedGroup]
      + orbitBaseCosines[i] * ORBIT_PHASE_SINES[speedGroup];
    const radius = orbitBaseRadius + value * orbitMinimumSize * 0.2 * sensitivityAmount;
    const x = orbitCenterX + directionX * radius;
    const y = orbitCenterY + directionY * radius;
    const color = i % 2 ? accent : accent2;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.globalAlpha = 0.35 + value * 0.65;
    ctx.beginPath();
    ctx.arc(x, y, 1.8 + value * 5.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  return averageLevel(frequencyData, ORBIT_PARTICLES);
}

function invalidateAuroraCache(geometryChanged = false) {
  auroraGradient = null;
  if (geometryChanged) {
    auroraXPositions = null;
    auroraGeometryWidth = 0;
  }
}

function prepareAuroraCache(width, accent, accent2) {
  if (!auroraGradient) {
    auroraGradient = ctx.createLinearGradient(0, 0, width, 0);
    auroraGradient.addColorStop(0, accent2);
    auroraGradient.addColorStop(0.5, accent);
    auroraGradient.addColorStop(1, accent2);
  }

  if (!auroraXPositions || auroraGeometryWidth !== width) {
    auroraXPositions = new Float64Array(AURORA_SAMPLES);
    for (let i = 0; i < AURORA_SAMPLES; i += 1) {
      auroraXPositions[i] = (i / (AURORA_SAMPLES - 1)) * width;
    }
    auroraGeometryWidth = width;
  }

  if (!auroraDataIndices || auroraTimeDataLength !== timeData.length) {
    auroraDataIndices = new Uint16Array(AURORA_SAMPLES);
    auroraWaveValues = new Float64Array(AURORA_SAMPLES);
    for (let i = 0; i < AURORA_SAMPLES; i += 1) {
      auroraDataIndices[i] = Math.floor((i / AURORA_SAMPLES) * timeData.length);
    }
    auroraTimeDataLength = timeData.length;
  }

  if (!auroraBaseSines || !auroraBaseCosines) {
    const tableSize = AURORA_LAYERS * AURORA_SAMPLES;
    auroraBaseSines = new Float64Array(tableSize);
    auroraBaseCosines = new Float64Array(tableSize);
    for (let layer = 0; layer < AURORA_LAYERS; layer += 1) {
      for (let i = 0; i < AURORA_SAMPLES; i += 1) {
        const tableIndex = layer * AURORA_SAMPLES + i;
        const baseAngle = i * 0.16 + layer * 1.3;
        auroraBaseSines[tableIndex] = Math.sin(baseAngle);
        auroraBaseCosines[tableIndex] = Math.cos(baseAngle);
      }
    }
  }
}

function drawAurora(width, height, accent, accent2, timestamp) {
  prepareAuroraCache(width, accent, accent2);
  const phase = timestamp * 0.001;
  const phaseSin = Math.sin(phase);
  const phaseCos = Math.cos(phase);
  const waveScale = height * 0.24 * sensitivityAmount;
  const driftScale = height * 0.045;
  for (let i = 0; i < AURORA_SAMPLES; i += 1) {
    auroraWaveValues[i] = (timeData[auroraDataIndices[i]] - 128) / 128;
  }

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  ctx.strokeStyle = auroraGradient;
  for (let layer = 0; layer < AURORA_LAYERS; layer += 1) {
    const centerY = height * (0.36 + layer * 0.09);
    ctx.shadowColor = layer % 2 ? accent2 : accent;
    ctx.shadowBlur = 18;
    ctx.globalAlpha = 0.18 + layer * 0.07;
    ctx.lineWidth = 4 + layer * 2;
    ctx.beginPath();
    for (let i = 0; i < AURORA_SAMPLES; i += 1) {
      const tableIndex = layer * AURORA_SAMPLES + i;
      const drift = (auroraBaseSines[tableIndex] * phaseCos + auroraBaseCosines[tableIndex] * phaseSin) * driftScale;
      const y = centerY + auroraWaveValues[i] * waveScale + drift;
      if (i === 0) ctx.moveTo(auroraXPositions[i], y); else ctx.lineTo(auroraXPositions[i], y);
    }
    ctx.stroke();
  }
  ctx.restore();
  return averageLevel(frequencyData, 64);
}

function drawSpark(width, height, accent, accent2, timestamp) {
  const samples = 64;
  const centerX = width / 2;
  const centerY = height / 2;
  const minimumSize = Math.min(width, height);
  const originRadius = minimumSize * 0.22;
  const level = averageLevel(frequencyData, samples) / 100;
  const reactiveLevel = Math.min(1, level * sensitivityAmount);
  const rise = reactiveLevel - previousSparkLevel;
  const delta = sparkLastTimestamp ? Math.min((timestamp - sparkLastTimestamp) / 1000, 0.05) : 0.016;
  const canBurst = timestamp - sparkLastBurst > 55;

  if (canBurst && reactiveLevel > 0.22 && (rise > 0.025 || reactiveLevel > 0.68)) {
    const burstSize = Math.round(3 + reactiveLevel * 8);
    for (let i = 0; i < burstSize; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const life = 0.28 + Math.random() * 0.34;
      sparkParticles.push({
        angle,
        directionX: Math.cos(angle),
        directionY: Math.sin(angle),
        radius: originRadius * (0.82 + Math.random() * 0.18),
        speed: minimumSize * (0.24 + Math.random() * 0.34) * (0.75 + reactiveLevel),
        life,
        maxLife: life,
        width: 1.2 + Math.random() * 2.3,
        length: 3 + Math.random() * 9,
        alternate: Math.random() > 0.48,
      });
    }
    sparkLastBurst = timestamp;
  }

  previousSparkLevel += (reactiveLevel - previousSparkLevel) * 0.42;
  sparkLastTimestamp = timestamp;
  sparkAccentBufferContext.clearRect(0, 0, width, height);
  sparkAccent2BufferContext.clearRect(0, 0, width, height);
  sparkAccentBufferContext.save();
  sparkAccent2BufferContext.save();
  sparkAccentBufferContext.globalCompositeOperation = 'lighter';
  sparkAccent2BufferContext.globalCompositeOperation = 'lighter';
  sparkAccentBufferContext.lineCap = 'round';
  sparkAccent2BufferContext.lineCap = 'round';
  sparkAccentBufferContext.shadowBlur = 0;
  sparkAccent2BufferContext.shadowBlur = 0;
  sparkAccentBufferContext.strokeStyle = accent;
  sparkAccentBufferContext.fillStyle = accent;
  sparkAccent2BufferContext.strokeStyle = accent2;
  sparkAccent2BufferContext.fillStyle = accent2;
  const maximumRadius = minimumSize * 0.64;
  let hasAccentParticles = false;
  let hasAccent2Particles = false;
  let writeIndex = 0;
  for (let readIndex = 0; readIndex < sparkParticles.length; readIndex += 1) {
    const particle = sparkParticles[readIndex];
    particle.life -= delta;
    particle.radius += particle.speed * delta;
    const alpha = Math.max(0, particle.life / particle.maxLife);
    const particleContext = particle.alternate ? sparkAccentBufferContext : sparkAccent2BufferContext;
    if (particle.alternate) hasAccentParticles = true; else hasAccent2Particles = true;
    const x = centerX + particle.directionX * particle.radius;
    const y = centerY + particle.directionY * particle.radius;
    const tailRadius = Math.max(originRadius, particle.radius - particle.length);
    const tailX = centerX + particle.directionX * tailRadius;
    const tailY = centerY + particle.directionY * tailRadius;
    particleContext.globalAlpha = alpha * alpha * 0.95;
    particleContext.lineWidth = particle.width;
    particleContext.beginPath();
    particleContext.moveTo(tailX, tailY);
    particleContext.lineTo(x, y);
    particleContext.stroke();
    particleContext.beginPath();
    particleContext.arc(x, y, particle.width * 0.65, 0, Math.PI * 2);
    particleContext.fill();
    if (particle.life > 0 && particle.radius < maximumRadius) {
      sparkParticles[writeIndex] = particle;
      writeIndex += 1;
    }
  }
  sparkAccentBufferContext.restore();
  sparkAccent2BufferContext.restore();
  sparkParticles.length = writeIndex;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 10;
  if (hasAccentParticles) {
    ctx.shadowColor = accent;
    ctx.drawImage(sparkAccentBuffer, 0, 0, width, height);
  }
  if (hasAccent2Particles) {
    ctx.shadowColor = accent2;
    ctx.drawImage(sparkAccent2Buffer, 0, 0, width, height);
  }
  ctx.restore();
  return Math.round(level * 100);
}

function scheduleFrame() {
  if (isRendering && animationFrameId === null) {
    animationFrameId = requestAnimationFrame(render);
  }
}

function startRendering() {
  if (isRendering || document.hidden || audio.paused || !analyser) return;
  isRendering = true;
  renderTimeline = null;
  scheduleFrame();
}

function stopRendering(clear = false) {
  isRendering = false;
  renderTimeline = null;
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  if (clear) clearCanvas();
}

function render(timestamp = 0) {
  animationFrameId = null;
  if (!isRendering) return;
  const width = canvasWidth;
  const height = canvasHeight;
  if (!width || !height) {
    scheduleFrame();
    return;
  }

  if (!analyser || audio.paused) {
    stopRendering();
    if (!document.hidden && !sessionEnded) drawIdleFrame();
    return;
  }

  if (renderTimeline !== null) {
    const elapsed = timestamp - renderTimeline;
    if (elapsed < RENDER_INTERVAL) {
      scheduleFrame();
      return;
    }
    renderTimeline = timestamp - (elapsed % RENDER_INTERVAL);
  } else {
    renderTimeline = timestamp;
  }

  analyser.getByteFrequencyData(frequencyData);
  if (visualMode === 'aurora') analyser.getByteTimeDomainData(timeData);
  ctx.clearRect(0, 0, width, height);
  let level = 0;
  if (visualMode === 'ring') level = drawRing(width, height, accentColor, accent2Color);
  else if (visualMode === 'wave') level = drawWave(width, height, accentColor, accent2Color);
  else if (visualMode === 'bar') level = drawBar(width, height, accentColor, accent2Color);
  else if (visualMode === 'orbit') level = drawOrbit(width, height, accentColor, accent2Color, timestamp);
  else if (visualMode === 'aurora') level = drawAurora(width, height, accentColor, accent2Color, timestamp);
  else if (visualMode === 'spark') level = drawSpark(width, height, accentColor, accent2Color, timestamp);
  updateSignalValue(level, timestamp);
  scheduleFrame();
}

async function enterPausedState(drawIdle = !document.hidden) {
  stopRendering();
  if (drawIdle && !sessionEnded) drawIdleFrame();
  else updateSignalValue(0, 0, true);
  await suspendAudioGraph();
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
  await enterPausedState(false);
}

async function resumeAfterBackground() {
  if (!backgroundResumePending || !audio.src || sessionEnded) return;
  try {
    createAudioGraph();
    await resumeAudioGraph();
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
  sparkParticles = [];
  previousSparkLevel = 0;
  sparkLastTimestamp = 0;
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
  void enterPausedState();
});

playButton.addEventListener('click', async () => {
  if (!audio.src || sessionEnded) return;
  try {
    if (audio.paused) {
      createAudioGraph();
      await resumeAudioGraph();
      await audio.play();
      startRendering();
    } else {
      audio.pause();
      await enterPausedState();
    }
  } catch (error) {
    console.error(error);
    await enterPausedState();
    showMessage('再生を開始できませんでした。音源を選び直してお試しください。');
  }
});

stopButton.addEventListener('click', () => {
  backgroundResumePending = false;
  resumeButton.hidden = true;
  hideMessage();
  audio.pause();
  audio.currentTime = 0;
  void enterPausedState();
});
resumeButton.addEventListener('click', resumeAfterBackground);
safeExitButton.addEventListener('click', safeExit);

audio.addEventListener('play', () => {
  setPlayingUI(true);
  startRendering();
});
audio.addEventListener('pause', () => {
  setPlayingUI(false);
  if (!sessionEnded) void enterPausedState();
});
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
  void enterPausedState();
});

progress.addEventListener('input', () => {
  if (audio.duration) audio.currentTime = (progress.value / 100) * audio.duration;
});
sensitivity.addEventListener('input', () => {
  sensitivityAmount = Number(sensitivity.value);
  sensitivityValue.textContent = `${sensitivityAmount.toFixed(1)}×`;
  invalidateRingCache();
  invalidateWaveCache();
  invalidateBarCache();
});
document.querySelectorAll('.visual-mode').forEach((button) => button.addEventListener('click', () => {
  visualMode = button.dataset.visual;
  if (visualMode === 'spark') {
    sparkParticles = [];
    previousSparkLevel = 0;
    sparkLastTimestamp = 0;
  }
  document.querySelectorAll('.visual-mode').forEach((mode) => {
    mode.classList.toggle('is-active', mode === button);
    mode.setAttribute('aria-pressed', String(mode === button));
  });
}));
document.querySelectorAll('.theme-dot').forEach((button) => button.addEventListener('click', () => {
  document.body.classList.remove('theme-amber', 'theme-lavender', 'theme-sakura');
  if (button.dataset.theme === 'amber') document.body.classList.add('theme-amber');
  if (button.dataset.theme === 'lavender') document.body.classList.add('theme-lavender');
  if (button.dataset.theme === 'sakura') document.body.classList.add('theme-sakura');
  refreshVisualStyles();
  if (!isRendering && !document.hidden && !sessionEnded) drawIdleFrame();
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
    if (audio.paused) drawIdleFrame(); else startRendering();
    showResumePrompt();
  }
});
window.addEventListener('pagehide', () => { void pauseForBackground(); });
window.addEventListener('pageshow', () => {
  if (!sessionEnded && !document.hidden) {
    if (audio.paused) drawIdleFrame(); else startRendering();
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
refreshVisualStyles();
resizeCanvas();
