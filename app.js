// 公開時はこの2項目だけ更新します。
const APP_META = Object.freeze({
  version: '0.4.3',
  lastUpdated: '2026年9月21日 16:25',
});

const audio = document.querySelector('#audio');
const fileInput = document.querySelector('#audioFile');
const fileButton = document.querySelector('#fileButton');
const addTrackButton = document.querySelector('#addTrackButton');
const playButton = document.querySelector('#playButton');
const stopButton = document.querySelector('#stopButton');
const resumeButton = document.querySelector('#resumeButton');
const safeExitButton = document.querySelector('#safeExitButton');
const sessionMessage = document.querySelector('#sessionMessage');
const playLabel = document.querySelector('#playLabel');
const progress = document.querySelector('#progress');
const trackName = document.querySelector('#trackName');
const trackPosition = document.querySelector('#trackPosition');
const trackTime = document.querySelector('#trackTime');
const playlistPanel = document.querySelector('#playlistPanel');
const playlistList = document.querySelector('#playlistList');
const playlistCount = document.querySelector('#playlistCount');
const repeatButton = document.querySelector('#repeatButton');
const repeatState = document.querySelector('#repeatState');
const statusLight = document.querySelector('#statusLight');
const statusText = document.querySelector('#statusText');
const sensitivity = document.querySelector('#sensitivity');
const sensitivityValue = document.querySelector('#sensitivityValue');
const signalValue = document.querySelector('#signalValue');
const visualStage = document.querySelector('.visual-stage');
const canvas = document.querySelector('#visualizer');
const ctx = canvas.getContext('2d');
const mistCanvas = document.querySelector('#mistCanvas');
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
let playlist = [];
let currentTrackIndex = -1;
let repeatMode = 'off';
let stoppedByUser = false;
let playbackActionId = 0;
let isTrackTransitioning = false;
let isConnected = false;
let animationFrameId = null;
let isRendering = false;
let renderTimeline = null;
let renderRecoveryAttempted = false;
let audioSuspendTask = null;
let backgroundResumePending = false;
let sessionEnded = false;
let sensitivityAmount = Number(sensitivity.value);
let visualMode = 'ring';
let canvasWidth = 0;
let canvasHeight = 0;
let canvasPixelRatio = 0;
let accentColor = '';
let accent2Color = '';
let lastSignalUpdate = -Infinity;
let displayedSignal = signalValue.textContent;
let ringGradientCache = [];
let ringRainbowGradientCache = [];
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
let waveRainbowGradientCache = [];
let waveXPositions = null;
let waveGeometryWidth = 0;
let waveGeometryBars = 0;
let waveLineWidth = 0;
let barGradientCache = [];
let barRainbowGradientCache = [];
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
let orbitRainbowBaseIndices = null;
let orbitFrequencyDataLength = 0;
let orbitGeometryWidth = 0;
let orbitGeometryHeight = 0;
let orbitCenterX = 0;
let orbitCenterY = 0;
let orbitMinimumSize = 0;
let orbitBaseRadius = 0;
let auroraGradient = null;
let auroraRainbowGradient = null;
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
let starryX = null;
let starryY = null;
let starryDepth = null;
let starrySize = null;
let starryBrightness = null;
let starryTwinkleSines = null;
let starryTwinkleCosines = null;
let starryTwinkleAmounts = null;
let starryTwinkleGroups = null;
let starryColorChoices = null;
let starryRainbowIndices = null;
let starryGeometryWidth = 0;
let starryGeometryHeight = 0;
let starryMinimumSize = 0;
let starryBackgroundGradient = null;
let starryNebulaBuffers = null;
let starryGlowBuffers = null;
let starryNebulaDensityMaps = null;
let starryNebulaEdgeMaps = null;
let starryNebulaHueMaps = null;
let starryNebulaLightMaps = null;
let starryNebulaBaseReady = false;
let starryGradientWidth = 0;
let starryGradientHeight = 0;
let starryGradientAccent = '';
let starryGradientAccent2 = '';
let starryGradientRainbow = false;
let starryLastTimestamp = 0;
let starryPreviousLow = 0;
let starryPreviousPeak = 0;
let starrySmoothedEnergy = 0;
let starryAudioLevel = 0;
let starryFrequencyHistoryReady = false;
let starryTempoFactor = 1;
let starryTempoTarget = 1;
let starryLastBeatTime = -Infinity;
let starryBeatInterval = 720;
let starryBeatPush = 0;
let starryBeatPushTarget = 0;
let starryFlashLevel = 0;
let starryLastFlashTime = -Infinity;
let starryGlowIndex = 0;
let starryPendingSecondaryIndex = -1;
let starryPendingSecondaryAt = Infinity;
let starryPendingSecondaryLevel = 0;
let starryFlashRandomState = 0x83e21f4d;
let starryNextMeteorAt = 0;
let starryMeteorX = null;
let starryMeteorY = null;
let starryMeteorDirectionX = null;
let starryMeteorDirectionY = null;
let starryMeteorSpeed = null;
let starryMeteorAge = null;
let starryMeteorDuration = null;
let starryMeteorLength = null;
let starryMeteorWidth = null;
let starryMeteorColorIndices = null;
let starryMeteorRare = null;
let starryRandomState = 0x6d2b79f5;
let mistRenderer = null;
let mistTheme = 'neon';
let mistContextLost = false;
let mistPointerId = null;
let mistPointerX = 0.5;
let mistPointerY = 0.5;
let mistPointerTime = 0;
let isRainbowTheme = false;

const TARGET_RENDER_FPS = 45;
const RENDER_INTERVAL = 1000 / TARGET_RENDER_FPS;
const SIGNAL_UPDATE_INTERVAL = 100;
const MAX_PLAYLIST_TRACKS = 3;
const REPEAT_MODES = ['off', 'one', 'all'];
const REPEAT_LABELS = { off: 'OFF', one: '1', all: 'ALL' };
const REPEAT_DESCRIPTIONS = { off: 'リピートなし', one: '1曲リピート', all: '全曲リピート' };
const RING_BARS = 72;
const RING_GRADIENT_STEPS = 256;
const WAVE_GRADIENT_STEPS = 256;
const BAR_BARS = 48;
const BAR_GRADIENT_STEPS = 256;
const ORBIT_PARTICLES = 52;
const ORBIT_SPEED_MULTIPLIERS = new Float64Array([1, 1 + 0.18, 1 + 2 * 0.18]);
const ORBIT_PHASE_SINES = new Float64Array(ORBIT_SPEED_MULTIPLIERS.length);
const ORBIT_PHASE_COSINES = new Float64Array(ORBIT_SPEED_MULTIPLIERS.length);
const ORBIT_RAINBOW_PHASE_INDICES = new Uint16Array(ORBIT_SPEED_MULTIPLIERS.length);
const AURORA_LAYERS = 4;
const AURORA_SAMPLES = 72;
const STARRY_STAR_COUNT = 144;
const STARRY_FAR_COUNT = 84;
const STARRY_MID_COUNT = 42;
const STARRY_METEOR_SLOTS = 2;
const STARRY_TWINKLE_SPEEDS = new Float64Array([0.00043, 0.00061, 0.00083]);
const STARRY_TWINKLE_PHASE_SINES = new Float64Array(STARRY_TWINKLE_SPEEDS.length);
const STARRY_TWINKLE_PHASE_COSINES = new Float64Array(STARRY_TWINKLE_SPEEDS.length);
const STARRY_DEPTH_SPEEDS = new Float64Array([0.28, 0.68, 1.25]);
const STARRY_NEBULA_COUNT = 3;
const STARRY_NEBULA_AUDIO_LEVELS = new Float32Array(STARRY_NEBULA_COUNT);
const STARRY_PREVIOUS_FREQUENCIES = new Uint8Array(64);
const STARRY_NEBULA_TEXTURE_WIDTH = 192;
const STARRY_NEBULA_TEXTURE_HEIGHT = 120;
const STARRY_NEBULA_X = new Float64Array([0.52, 0.16, 0.76]);
const STARRY_NEBULA_Y = new Float64Array([0.18, 0.58, 0.74]);
const STARRY_NEBULA_WIDTHS = new Float64Array([1, 0.86, 0.88]);
const STARRY_NEBULA_HEIGHTS = new Float64Array([0.58, 0.87, 0.72]);
const STARRY_NEBULA_ALPHAS = new Float64Array([0.78, 0.82, 0.86]);
const STARRY_NEBULA_DENSITIES = new Float64Array([1.02, 1.04, 1.1]);
const STARRY_NEBULA_SPEED_RATIOS = new Float64Array([0.045, 0.067, 0.09]);
const STARRY_NEBULA_ANGLES = new Float64Array([-0.12, 0.48, -0.34]);
const STARRY_NEBULA_HALO_SCALE = 1.14;
const STARRY_NEBULA_OFFSET_X = new Float32Array(STARRY_NEBULA_COUNT);
const STARRY_NEBULA_OFFSET_Y = new Float32Array(STARRY_NEBULA_COUNT);
const STARRY_NEBULA_DRAW_X = new Float32Array(STARRY_NEBULA_COUNT);
const STARRY_NEBULA_DRAW_Y = new Float32Array(STARRY_NEBULA_COUNT);
const STARRY_NEBULA_DRAW_WIDTH = new Float32Array(STARRY_NEBULA_COUNT);
const STARRY_NEBULA_DRAW_HEIGHT = new Float32Array(STARRY_NEBULA_COUNT);
const STARRY_NEBULA_SEEDS = new Uint16Array([137, 389, 761]);
const STARRY_FLASH_COOLDOWN = 820;
const STARRY_CLOUD_FLASH_COOLDOWN = 1050;
const STARRY_FLASH_HOLD_MS = 46;
const STARRY_FLASH_LEVELS = new Float32Array(STARRY_NEBULA_COUNT);
const STARRY_FLASH_HOLD_UNTIL = new Float64Array(STARRY_NEBULA_COUNT);
const STARRY_CLOUD_LAST_FLASH = new Float64Array(STARRY_NEBULA_COUNT).fill(-Infinity);
const STARRY_GLOW_PALETTES = Object.freeze({
  neon: Object.freeze(['#247cff', '#5ed9ff']),
  amber: Object.freeze(['#ff6d24', '#ffb23d']),
  yellow: Object.freeze(['#ffd000', '#fff24a']),
  emerald: Object.freeze(['#16bb78', '#56e6ad']),
  red: Object.freeze(['#d61f3c', '#ff6268']),
  lavender: Object.freeze(['#7b32e5', '#b95cff']),
  sakura: Object.freeze(['#e91d82', '#ff5bb1']),
});
const RAINBOW_COLOR_STEPS = 256;
const RAINBOW_COLOR_MASK = RAINBOW_COLOR_STEPS - 1;
const RAINBOW_STOPS = Object.freeze([
  Object.freeze([255, 98, 104]),
  Object.freeze([255, 138, 66]),
  Object.freeze([255, 243, 92]),
  Object.freeze([86, 230, 173]),
  Object.freeze([94, 217, 255]),
  Object.freeze([167, 124, 255]),
  Object.freeze([255, 74, 162]),
]);

function buildRainbowColorTable(cyclic = false, tone = 0) {
  const colors = new Array(RAINBOW_COLOR_STEPS);
  const segmentCount = cyclic ? RAINBOW_STOPS.length : RAINBOW_STOPS.length - 1;
  const denominator = cyclic ? RAINBOW_COLOR_STEPS : RAINBOW_COLOR_STEPS - 1;
  for (let i = 0; i < RAINBOW_COLOR_STEPS; i += 1) {
    const scaled = (i / denominator) * segmentCount;
    const segment = Math.min(Math.floor(scaled), segmentCount - 1);
    const amount = scaled - segment;
    const from = RAINBOW_STOPS[segment];
    const to = RAINBOW_STOPS[(segment + 1) % RAINBOW_STOPS.length];
    const channels = new Uint8Array(3);
    for (let channel = 0; channel < channels.length; channel += 1) {
      let value = from[channel] + (to[channel] - from[channel]) * amount;
      value = tone >= 0 ? value + (255 - value) * tone : value * (1 + tone);
      channels[channel] = Math.round(value);
    }
    colors[i] = `rgb(${channels[0]} ${channels[1]} ${channels[2]})`;
  }
  return colors;
}

const RAINBOW_LINEAR_COLORS = buildRainbowColorTable();
const RAINBOW_LINEAR_LIGHT_COLORS = buildRainbowColorTable(false, 0.34);
const RAINBOW_LINEAR_DARK_COLORS = buildRainbowColorTable(false, -0.28);
const RAINBOW_CYCLIC_COLORS = buildRainbowColorTable(true);
const RAINBOW_CYCLIC_LIGHT_COLORS = buildRainbowColorTable(true, 0.34);
const RAINBOW_CYCLIC_DARK_COLORS = buildRainbowColorTable(true, -0.28);

const formatTime = (value) => {
  if (!Number.isFinite(value)) return '00:00';
  const mins = Math.floor(value / 60).toString().padStart(2, '0');
  const secs = Math.floor(value % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const rect = visualStage.getBoundingClientRect();
  const width = visualStage.clientWidth || rect.width;
  const height = visualStage.clientHeight || rect.height;
  if (!width || !height) return;

  const pixelWidth = Math.max(1, Math.round(width * ratio));
  const pixelHeight = Math.max(1, Math.round(height * ratio));
  const ratioChanged = canvasPixelRatio !== ratio;
  const geometryChanged = canvasWidth !== width || canvasHeight !== height || ratioChanged;

  const resizeBackingStore = (targetCanvas, targetContext) => {
    const sizeChanged = targetCanvas.width !== pixelWidth || targetCanvas.height !== pixelHeight;
    if (sizeChanged) {
      targetCanvas.width = pixelWidth;
      targetCanvas.height = pixelHeight;
    }
    if (sizeChanged || ratioChanged) targetContext.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  resizeBackingStore(canvas, ctx);
  resizeBackingStore(waveBuffer, waveBufferContext);
  resizeBackingStore(sparkAccentBuffer, sparkAccentBufferContext);
  resizeBackingStore(sparkAccent2Buffer, sparkAccent2BufferContext);

  if (geometryChanged) {
    invalidateRingCache(true);
    invalidateWaveCache(true);
    invalidateBarCache(true);
    invalidateAuroraCache(true);
  }
  canvasWidth = width;
  canvasHeight = height;
  canvasPixelRatio = ratio;
  if (mistRenderer) mistRenderer.resize(width, height, window.devicePixelRatio);
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

function revokePlaylistUrls() {
  for (let i = 0; i < playlist.length; i += 1) {
    URL.revokeObjectURL(playlist[i].url);
  }
  playlist = [];
  currentTrackIndex = -1;
}

function renderPlaylist() {
  playlistList.replaceChildren();
  playlistPanel.hidden = playlist.length === 0;
  playlistCount.textContent = `${playlist.length} / ${MAX_PLAYLIST_TRACKS}`;

  for (let index = 0; index < playlist.length; index += 1) {
    const track = playlist[index];
    const isCurrent = index === currentTrackIndex;
    const item = document.createElement('li');
    item.className = 'playlist-item';
    item.classList.toggle('is-current', isCurrent);
    item.classList.toggle('is-playing', isCurrent && !audio.paused && !audio.ended);
    if (isCurrent) item.setAttribute('aria-current', 'true');

    const number = document.createElement('span');
    number.className = 'playlist-index';
    number.textContent = `${isCurrent && !audio.paused && !audio.ended ? '▶ ' : ''}${index + 1}.`;

    const name = document.createElement('span');
    name.className = 'playlist-name';
    name.textContent = track.file.name;

    const removeButton = document.createElement('button');
    removeButton.className = 'playlist-remove';
    removeButton.type = 'button';
    removeButton.dataset.index = String(index);
    removeButton.disabled = sessionEnded;
    removeButton.setAttribute('aria-label', `${track.file.name}を削除`);
    removeButton.title = '削除';
    removeButton.textContent = '×';

    item.append(number, name, removeButton);
    playlistList.append(item);
  }

  fileButton.disabled = playlist.length > 0 && !sessionEnded;
  addTrackButton.disabled = playlist.length === 0
    || playlist.length >= MAX_PLAYLIST_TRACKS
    || sessionEnded;
  addTrackButton.title = playlist.length >= MAX_PLAYLIST_TRACKS ? '追加できる曲は3曲までです' : '';
}

function updateTrackReadout(resetTime = false) {
  const track = playlist[currentTrackIndex];
  if (!track) {
    trackName.textContent = '音源を選択してください';
    trackPosition.textContent = '0 / 0';
    trackTime.textContent = '00:00 / 00:00';
    renderPlaylist();
    return;
  }

  trackName.textContent = track.file.name;
  trackPosition.textContent = `${currentTrackIndex + 1} / ${playlist.length}`;
  if (resetTime) trackTime.textContent = '00:00 / 00:00';
  renderPlaylist();
}

function loadPlaylistTrack(index) {
  const track = playlist[index];
  if (!track) return false;
  currentTrackIndex = index;
  audio.src = track.url;
  audio.load();
  progress.value = 0;
  updateTrackReadout(true);
  return true;
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

async function playLoadedTrack(actionId) {
  createAudioGraph();
  await resumeAudioGraph();
  if (actionId !== playbackActionId || sessionEnded || document.hidden) return false;
  await audio.play();
  if (actionId !== playbackActionId || sessionEnded || document.hidden) return false;
  startRendering();
  return true;
}

function setPlayingUI(playing) {
  playButton.classList.toggle('is-playing', playing);
  playButton.setAttribute('aria-label', playing ? '一時停止' : '再生');
  playLabel.textContent = playing ? '一時停止' : '再生';
  statusLight.classList.toggle('is-playing', playing);
  statusText.textContent = playing ? 'PLAYING' : 'READY';
}

function updateRepeatButton() {
  const nextMode = REPEAT_MODES[(REPEAT_MODES.indexOf(repeatMode) + 1) % REPEAT_MODES.length];
  repeatButton.dataset.repeatMode = repeatMode;
  repeatState.textContent = REPEAT_LABELS[repeatMode];
  repeatButton.setAttribute('aria-label', `${REPEAT_DESCRIPTIONS[repeatMode]}。押すと${REPEAT_DESCRIPTIONS[nextMode]}`);
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
  if (mistRenderer && !mistContextLost) mistRenderer.clear();
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
  if (visualMode === 'mist') {
    if (mistRenderer && !mistContextLost) {
      mistRenderer.draw(performance.now(), null, sensitivityAmount);
      startRendering();
    }
  } else {
    drawIdleRing(canvasWidth, canvasHeight);
  }
  updateSignalValue(0, 0, true);
}

function ensureMistRenderer() {
  if (mistContextLost) return false;
  if (mistRenderer) return true;
  try {
    mistRenderer = window.createMistRenderer(mistCanvas);
    mistRenderer.resize(canvasWidth, canvasHeight, window.devicePixelRatio);
    mistRenderer.setTheme(mistTheme);
    return true;
  } catch (error) {
    console.error(error);
    showMessage('MISTを表示できません。このブラウザのWebGL設定をご確認ください。');
    return false;
  }
}

function getMistPointerPosition(event) {
  const rect = mistCanvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  return {
    x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
    y: Math.max(0, Math.min(1, 1 - (event.clientY - rect.top) / rect.height)),
  };
}

function releaseMistPointer() {
  const pointerId = mistPointerId;
  mistPointerId = null;
  mistPointerTime = 0;
  if (mistRenderer && !mistContextLost) mistRenderer.releasePointerInteraction();
  if (pointerId !== null && mistCanvas.hasPointerCapture?.(pointerId)) {
    try {
      mistCanvas.releasePointerCapture(pointerId);
    } catch (error) {
      console.debug('MIST pointer capture release:', error);
    }
  }
}

function averageLevel(values, count) {
  let total = 0;
  for (let i = 0; i < count; i += 1) total += values[i] / 255;
  return Math.round((total / count) * 100);
}

function invalidateRingCache(geometryChanged = false) {
  ringGradientCache.length = 0;
  ringRainbowGradientCache.length = 0;
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
    ringRainbowGradientCache.length = 0;
  }

  if (isRainbowTheme) {
    if (ringRainbowGradientCache.length === RING_BARS) return;
    const rainbowLength = 7 + ringMinimumSize * 0.2 * sensitivityAmount;
    for (let i = 0; i < RING_BARS; i += 1) {
      const colorIndex = Math.floor((i / RING_BARS) * RAINBOW_COLOR_STEPS) & RAINBOW_COLOR_MASK;
      const gradient = ctx.createRadialGradient(
        ringCenterX,
        ringCenterY,
        ringBaseRadius,
        ringCenterX,
        ringCenterY,
        ringBaseRadius + rainbowLength,
      );
      gradient.addColorStop(0, RAINBOW_CYCLIC_LIGHT_COLORS[colorIndex]);
      gradient.addColorStop(0.2, RAINBOW_CYCLIC_COLORS[colorIndex]);
      gradient.addColorStop(1, RAINBOW_CYCLIC_DARK_COLORS[colorIndex]);
      ringRainbowGradientCache.push(gradient);
    }
    return;
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
    ctx.strokeStyle = isRainbowTheme ? ringRainbowGradientCache[i] : ringGradientCache[dataValue];
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
  waveRainbowGradientCache.length = 0;
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

  if (isRainbowTheme) {
    if (waveRainbowGradientCache.length === bars) return;
    waveRainbowGradientCache.length = 0;
    for (let i = 0; i < bars; i += 1) {
      const colorIndex = Math.round((i / (bars - 1)) * RAINBOW_COLOR_MASK);
      const gradient = waveBufferContext.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, RAINBOW_LINEAR_DARK_COLORS[colorIndex]);
      gradient.addColorStop(0.5, RAINBOW_LINEAR_LIGHT_COLORS[colorIndex]);
      gradient.addColorStop(1, RAINBOW_LINEAR_DARK_COLORS[colorIndex]);
      waveRainbowGradientCache.push(gradient);
    }
    return;
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
    waveBufferContext.strokeStyle = isRainbowTheme ? waveRainbowGradientCache[i] : waveGradientCache[dataValue];
    waveBufferContext.globalAlpha = 0.22 + value * 0.7;
    waveBufferContext.beginPath();
    waveBufferContext.moveTo(x, centerY - amplitude);
    waveBufferContext.lineTo(x, centerY + amplitude);
    waveBufferContext.stroke();
  }
  waveBufferContext.restore();

  ctx.save();
  ctx.shadowColor = isRainbowTheme ? 'rgba(255,255,255,.68)' : accent;
  ctx.shadowBlur = 13;
  ctx.drawImage(waveBuffer, 0, 0, width, height);
  ctx.restore();
  return averageLevel(frequencyData, bars);
}

function invalidateBarGradientCache() {
  barGradientCache.length = 0;
  barRainbowGradientCache.length = 0;
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

  if (isRainbowTheme) {
    if (barRainbowGradientCache.length === BAR_BARS) return;
    const maximumBarHeight = height * 0.68 * sensitivityAmount;
    for (let i = 0; i < BAR_BARS; i += 1) {
      const colorIndex = Math.round((i / (BAR_BARS - 1)) * RAINBOW_COLOR_MASK);
      const gradient = ctx.createLinearGradient(0, barBaseline, 0, barBaseline - maximumBarHeight);
      gradient.addColorStop(0, RAINBOW_LINEAR_DARK_COLORS[colorIndex]);
      gradient.addColorStop(1, RAINBOW_LINEAR_LIGHT_COLORS[colorIndex]);
      barRainbowGradientCache.push(gradient);
    }
    return;
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
    ctx.fillStyle = isRainbowTheme ? barRainbowGradientCache[i] : barGradientCache[dataValue];
    ctx.globalAlpha = barAlphaValues[dataValue];
    ctx.fillRect(barXPositions[i], barBaseline - barHeight, barWidth, barHeight);
  }
  ctx.globalAlpha = 1;
  return averageLevel(frequencyData, BAR_BARS);
}

function prepareOrbitCache(width, height) {
  if (!orbitBaseSines || !orbitBaseCosines || !orbitSpeedGroups || !orbitRainbowBaseIndices) {
    orbitBaseSines = new Float64Array(ORBIT_PARTICLES);
    orbitBaseCosines = new Float64Array(ORBIT_PARTICLES);
    orbitSpeedGroups = new Uint8Array(ORBIT_PARTICLES);
    orbitRainbowBaseIndices = new Uint16Array(ORBIT_PARTICLES);
    for (let i = 0; i < ORBIT_PARTICLES; i += 1) {
      const baseAngle = (i / ORBIT_PARTICLES) * Math.PI * 2;
      orbitBaseSines[i] = Math.sin(baseAngle);
      orbitBaseCosines[i] = Math.cos(baseAngle);
      orbitSpeedGroups[i] = i % ORBIT_SPEED_MULTIPLIERS.length;
      orbitRainbowBaseIndices[i] = Math.floor((((i / ORBIT_PARTICLES) + 0.25) % 1) * RAINBOW_COLOR_STEPS);
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
    ORBIT_RAINBOW_PHASE_INDICES[group] = Math.floor((groupPhase / (Math.PI * 2)) * RAINBOW_COLOR_STEPS) & RAINBOW_COLOR_MASK;
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
    const color = isRainbowTheme
      ? RAINBOW_CYCLIC_COLORS[(orbitRainbowBaseIndices[i] + ORBIT_RAINBOW_PHASE_INDICES[speedGroup]) & RAINBOW_COLOR_MASK]
      : (i % 2 ? accent : accent2);
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
  auroraRainbowGradient = null;
  if (geometryChanged) {
    auroraXPositions = null;
    auroraGeometryWidth = 0;
  }
}

function prepareAuroraCache(width, accent, accent2) {
  if (isRainbowTheme && !auroraRainbowGradient) {
    auroraRainbowGradient = ctx.createLinearGradient(0, 0, width, 0);
    for (let i = 0; i < RAINBOW_STOPS.length; i += 1) {
      const colorIndex = Math.round((i / (RAINBOW_STOPS.length - 1)) * RAINBOW_COLOR_MASK);
      auroraRainbowGradient.addColorStop(i / (RAINBOW_STOPS.length - 1), RAINBOW_LINEAR_COLORS[colorIndex]);
    }
  } else if (!isRainbowTheme && !auroraGradient) {
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
  ctx.strokeStyle = isRainbowTheme ? auroraRainbowGradient : auroraGradient;
  for (let layer = 0; layer < AURORA_LAYERS; layer += 1) {
    const centerY = height * (0.36 + layer * 0.09);
    ctx.shadowColor = isRainbowTheme ? 'rgba(255,255,255,.72)' : (layer % 2 ? accent2 : accent);
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
        rainbowColorIndex: Math.floor((((angle / (Math.PI * 2)) + 0.25) % 1) * RAINBOW_COLOR_STEPS),
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
    const particleContext = isRainbowTheme
      ? sparkAccentBufferContext
      : (particle.alternate ? sparkAccentBufferContext : sparkAccent2BufferContext);
    if (isRainbowTheme) {
      if (particle.rainbowColorIndex === undefined) {
        particle.rainbowColorIndex = Math.floor((((particle.angle / (Math.PI * 2)) + 0.25) % 1) * RAINBOW_COLOR_STEPS);
      }
      const color = RAINBOW_CYCLIC_COLORS[particle.rainbowColorIndex];
      particleContext.strokeStyle = color;
      particleContext.fillStyle = color;
      hasAccentParticles = true;
    } else if (particle.alternate) {
      hasAccentParticles = true;
    } else {
      hasAccent2Particles = true;
    }
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
    ctx.shadowColor = isRainbowTheme ? 'rgba(255,255,255,.72)' : accent;
    ctx.drawImage(sparkAccentBuffer, 0, 0, width, height);
  }
  if (hasAccent2Particles) {
    ctx.shadowColor = accent2;
    ctx.drawImage(sparkAccent2Buffer, 0, 0, width, height);
  }
  ctx.restore();
  return Math.round(level * 100);
}

// STARRY reuses typed arrays and bakes low-resolution cloud density/light textures outside the frame loop.
function starryRandom() {
  starryRandomState = (starryRandomState * 1664525 + 1013904223) >>> 0;
  return starryRandomState / 4294967296;
}

function starryFlashRandom() {
  starryFlashRandomState = (starryFlashRandomState * 1664525 + 1013904223) >>> 0;
  return starryFlashRandomState / 4294967296;
}

function starryNoiseHash(x, y, seed) {
  let value = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 1442695041);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

function starryValueNoise(x, y, seed) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = x - x0;
  const ty = y - y0;
  const smoothX = tx * tx * (3 - 2 * tx);
  const smoothY = ty * ty * (3 - 2 * ty);
  const topLeft = starryNoiseHash(x0, y0, seed);
  const topRight = starryNoiseHash(x0 + 1, y0, seed);
  const bottomLeft = starryNoiseHash(x0, y0 + 1, seed);
  const bottomRight = starryNoiseHash(x0 + 1, y0 + 1, seed);
  const top = topLeft + (topRight - topLeft) * smoothX;
  const bottom = bottomLeft + (bottomRight - bottomLeft) * smoothX;
  return top + (bottom - top) * smoothY;
}

function starryFbm(x, y, seed, octaves) {
  let value = 0;
  let amplitude = 0.56;
  let amplitudeTotal = 0;
  for (let octave = 0; octave < octaves; octave += 1) {
    value += starryValueNoise(x, y, seed + octave * 37) * amplitude;
    amplitudeTotal += amplitude;
    x = x * 2.03 + 7.1;
    y = y * 2.01 - 5.3;
    amplitude *= 0.5;
  }
  return value / amplitudeTotal;
}

function starrySmoothstep(edge0, edge1, value) {
  const amount = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return amount * amount * (3 - 2 * amount);
}

function starryColorChannels(color) {
  const hex = /^#([0-9a-f]{6})$/i.exec(color);
  if (hex) {
    const value = Number.parseInt(hex[1], 16);
    return new Uint8Array([value >> 16, (value >> 8) & 255, value & 255]);
  }
  const channels = color.match(/[\d.]+/g);
  if (channels && channels.length >= 3) {
    return new Uint8Array([Number(channels[0]), Number(channels[1]), Number(channels[2])]);
  }
  return new Uint8Array([94, 217, 255]);
}

function buildStarryNebulaDensityMaps() {
  if (starryNebulaDensityMaps) return;
  const width = STARRY_NEBULA_TEXTURE_WIDTH;
  const height = STARRY_NEBULA_TEXTURE_HEIGHT;
  const pixelCount = width * height;
  starryNebulaDensityMaps = new Array(STARRY_NEBULA_COUNT);
  starryNebulaEdgeMaps = new Array(STARRY_NEBULA_COUNT);
  starryNebulaHueMaps = new Array(STARRY_NEBULA_COUNT);
  starryNebulaLightMaps = new Array(STARRY_NEBULA_COUNT);

  for (let cloud = 0; cloud < STARRY_NEBULA_COUNT; cloud += 1) {
    const seed = STARRY_NEBULA_SEEDS[cloud];
    const angle = STARRY_NEBULA_ANGLES[cloud];
    const angleCosine = Math.cos(angle);
    const angleSine = Math.sin(angle);
    const rawDensity = new Float32Array(pixelCount);
    const densityMap = new Uint8Array(pixelCount);
    const edgeMap = new Uint8Array(pixelCount);
    const hueMap = new Uint8Array(pixelCount);
    const lightMap = new Uint8Array(pixelCount);
    for (let y = 0; y < height; y += 1) {
      const v = y / (height - 1);
      for (let x = 0; x < width; x += 1) {
        const u = x / (width - 1);
        const centeredX = u - 0.5;
        const centeredY = v - 0.5;
        const orientedU = centeredX * angleCosine - centeredY * angleSine + 0.5;
        const orientedV = centeredX * angleSine + centeredY * angleCosine + 0.5;
        const warpX = starryValueNoise(
          orientedU * 1.38 + seed * 0.013,
          orientedV * 1.18 - seed * 0.009,
          seed + 11,
        ) - 0.5;
        const warpY = starryValueNoise(
          orientedU * 1.22 - seed * 0.008,
          orientedV * 1.42 + seed * 0.011,
          seed + 29,
        ) - 0.5;
        const warpedU = orientedU + warpX * 0.22 + warpY * 0.05;
        const warpedV = orientedV + warpY * 0.2 - warpX * 0.04;
        const macroNoise = starryFbm(
          warpedU * 1.55 + seed * 0.006,
          warpedV * 1.34 - seed * 0.004,
          seed + 53,
          3,
        );
        const bodyNoise = starryFbm(
          warpedU * 2.7 + 3.7,
          warpedV * 2.25 - 2.9,
          seed + 97,
          2,
        );
        const detailNoise = starryValueNoise(
          warpedU * 4.4 + 7.3,
          warpedV * 3.7 - 5.1,
          seed + 131,
        );
        const holeNoise = starryValueNoise(
          warpedU * 2.05 + 11.6,
          warpedV * 1.72 - 8.4,
          seed + 173,
        );
        const curveCenter = 0.5 + Math.sin(
          (warpedU * (0.82 + cloud * 0.11) + seed * 0.0017) * Math.PI * 2,
        ) * (0.08 + cloud * 0.015);
        const curveDistance = Math.abs(warpedV - curveCenter);
        const curveMask = 0.42 + (1 - starrySmoothstep(
          0.22 + cloud * 0.015,
          0.58,
          curveDistance,
        )) * 0.58;
        const macroDensity = starrySmoothstep(
          0.26,
          0.68,
          macroNoise * 0.78 + bodyNoise * 0.22,
        );
        const bodyShape = starrySmoothstep(
          0.24,
          0.76,
          bodyNoise * 0.72 + detailNoise * 0.28,
        );
        const cloudBody = macroDensity * curveMask * (0.22 + bodyShape * 0.78);
        const ridge = 1 - Math.abs(bodyNoise * 2 - 1);
        const fineRidge = 1 - Math.abs(detailNoise * 2 - 1);
        const ridgeDetail = starrySmoothstep(
          0.62,
          0.9,
          ridge * 0.7 + fineRidge * 0.3,
        ) * cloudBody * 0.06;
        const holeMask = starrySmoothstep(0.58, 0.83, holeNoise)
          * starrySmoothstep(0.22, 0.68, macroDensity);
        const edgeFade = starrySmoothstep(0, 0.16, u)
          * starrySmoothstep(0, 0.16, 1 - u)
          * starrySmoothstep(0, 0.18, v)
          * starrySmoothstep(0, 0.18, 1 - v);
        const pixel = y * width + x;
        rawDensity[pixel] = Math.min(1,
          (cloudBody + ridgeDetail)
          * (1 - holeMask * 0.62)
          * edgeFade
          * STARRY_NEBULA_DENSITIES[cloud],
        );
        hueMap[pixel] = Math.round(Math.min(1,
          macroNoise * 0.56 + bodyNoise * 0.29 + detailNoise * 0.15,
        ) * 255);
        lightMap[pixel] = Math.round(Math.min(1,
          macroNoise * 0.5 + bodyNoise * 0.32 + (1 - holeNoise) * 0.18,
        ) * 255);
      }
    }

    for (let y = 0; y < height; y += 1) {
      const above = Math.max(0, y - 1) * width;
      const below = Math.min(height - 1, y + 1) * width;
      for (let x = 0; x < width; x += 1) {
        const index = y * width + x;
        const left = rawDensity[y * width + Math.max(0, x - 1)];
        const right = rawDensity[y * width + Math.min(width - 1, x + 1)];
        const vertical = Math.abs(rawDensity[below + x] - rawDensity[above + x]);
        const edge = Math.min(1, (Math.abs(right - left) + vertical) * 1.55);
        densityMap[index] = Math.round(rawDensity[index] * 255);
        edgeMap[index] = Math.round(edge * 255);
      }
    }
    starryNebulaDensityMaps[cloud] = densityMap;
    starryNebulaEdgeMaps[cloud] = edgeMap;
    starryNebulaHueMaps[cloud] = hueMap;
    starryNebulaLightMaps[cloud] = lightMap;
  }
}

function rebuildStarryNebulaTextures(accent, accent2) {
  if (!starryNebulaBuffers) {
    starryNebulaBuffers = new Array(STARRY_NEBULA_COUNT);
    starryGlowBuffers = new Array(STARRY_NEBULA_COUNT);
    for (let i = 0; i < STARRY_NEBULA_COUNT; i += 1) {
      starryNebulaBuffers[i] = document.createElement('canvas');
      starryGlowBuffers[i] = document.createElement('canvas');
      starryNebulaBuffers[i].width = STARRY_NEBULA_TEXTURE_WIDTH;
      starryNebulaBuffers[i].height = STARRY_NEBULA_TEXTURE_HEIGHT;
      starryGlowBuffers[i].width = STARRY_NEBULA_TEXTURE_WIDTH;
      starryGlowBuffers[i].height = STARRY_NEBULA_TEXTURE_HEIGHT;
    }
  }
  buildStarryNebulaDensityMaps();

  const glowPalette = STARRY_GLOW_PALETTES[mistTheme];
  const glowDeepChannels = starryColorChannels(glowPalette ? glowPalette[0] : accent2);
  const glowBrightChannels = starryColorChannels(glowPalette ? glowPalette[1] : accent);
  const width = STARRY_NEBULA_TEXTURE_WIDTH;
  const height = STARRY_NEBULA_TEXTURE_HEIGHT;
  for (let cloud = 0; cloud < STARRY_NEBULA_COUNT; cloud += 1) {
    const densityMap = starryNebulaDensityMaps[cloud];
    const edgeMap = starryNebulaEdgeMaps[cloud];
    const hueMap = starryNebulaHueMaps[cloud];
    const lightMap = starryNebulaLightMaps[cloud];
    const nebulaContext = starryNebulaBuffers[cloud].getContext('2d');
    const glowContext = starryGlowBuffers[cloud].getContext('2d');
    if (!starryNebulaBaseReady) {
      const cloudImage = nebulaContext.createImageData(width, height);
      for (let pixel = 0; pixel < densityMap.length; pixel += 1) {
        const density = densityMap[pixel] / 255;
        const edge = edgeMap[pixel] / 255;
        const output = pixel * 4;
        cloudImage.data[output] = Math.round(14 + density * 26 + edge * 3);
        cloudImage.data[output + 1] = Math.round(22 + density * 42 + edge * 5);
        cloudImage.data[output + 2] = Math.round(42 + density * 74 + edge * 8);
        cloudImage.data[output + 3] = Math.round(Math.min(1, density * 1.08 + edge * 0.025) * 255);
      }
      nebulaContext.putImageData(cloudImage, 0, 0);
    }

    const glowImage = glowContext.createImageData(width, height);
    for (let y = 0; y < height; y += 1) {
      const v = y / (height - 1);
      for (let x = 0; x < width; x += 1) {
        const u = x / (width - 1);
        const pixel = y * width + x;
        const density = densityMap[pixel] / 255;
        const edge = edgeMap[pixel] / 255;
        const hueNoise = hueMap[pixel] / 255;
        const lightField = lightMap[pixel] / 255;
        const irregularLight = 0.22 + lightField * 0.78;
        const gasPresence = Math.pow(density, 1.08);
        const thicknessTransmission = 0.72 + (1 - density) * 0.28;
        const thickShadow = 1 - starrySmoothstep(0.82, 1, density) * 0.28;
        const structureLight = 0.08 + Math.pow(
          starrySmoothstep(0.2, 0.78, hueNoise),
          1.7,
        ) * 1.2;
        const transmission = Math.min(1,
          gasPresence * thicknessTransmission + edge * 0.018,
        );
        const lightAlpha = Math.min(1,
          irregularLight * transmission * thickShadow * structureLight,
        );
        const output = pixel * 4;

        if (isRainbowTheme) {
          const hue = (hueNoise * 0.56 + u * 0.44 + v * 0.18 + cloud * 0.29) % 1;
          const scaledHue = hue * RAINBOW_STOPS.length;
          const segment = Math.floor(scaledHue) % RAINBOW_STOPS.length;
          const amount = scaledHue - Math.floor(scaledHue);
          const from = RAINBOW_STOPS[segment];
          const to = RAINBOW_STOPS[(segment + 1) % RAINBOW_STOPS.length];
          glowImage.data[output] = Math.round(from[0] + (to[0] - from[0]) * amount);
          glowImage.data[output + 1] = Math.round(from[1] + (to[1] - from[1]) * amount);
          glowImage.data[output + 2] = Math.round(from[2] + (to[2] - from[2]) * amount);
        } else {
          const colorMix = 0.18 + hueNoise * 0.72;
          const highlightMix = 0.003 + Math.pow(lightAlpha, 4) * 0.018 + edge * 0.006;
          for (let channel = 0; channel < 3; channel += 1) {
            const base = glowDeepChannels[channel]
              + (glowBrightChannels[channel] - glowDeepChannels[channel]) * colorMix;
            glowImage.data[output + channel] = Math.round(base + (255 - base) * highlightMix);
          }
        }
        glowImage.data[output + 3] = Math.round(
          Math.min(1, Math.pow(lightAlpha, 0.72) * 1.42) * 255,
        );
      }
    }
    glowContext.clearRect(0, 0, width, height);
    glowContext.putImageData(glowImage, 0, 0);
  }
  starryNebulaBaseReady = true;
}

function drawStarryNebula(width, height, timestamp, delta, directionX, directionY) {
  const driftPulse = Math.sin(timestamp * 0.000011);
  const baseCloudSpeed = Math.min(width, height) * 0.02;

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  for (let i = 0; i < STARRY_NEBULA_COUNT; i += 1) {
    const movement = baseCloudSpeed * STARRY_NEBULA_SPEED_RATIOS[i] * delta;
    STARRY_NEBULA_OFFSET_X[i] += directionX * movement;
    STARRY_NEBULA_OFFSET_Y[i] += directionY * movement;
    const scale = 1 + driftPulse * (0.004 + i * 0.0015);
    const cloudWidth = width * STARRY_NEBULA_WIDTHS[i] * scale;
    const cloudHeight = height * STARRY_NEBULA_HEIGHTS[i] / scale;
    const baseX = width * STARRY_NEBULA_X[i] - cloudWidth * 0.5;
    const baseY = height * STARRY_NEBULA_Y[i] - cloudHeight * 0.5;
    let cloudX = baseX + STARRY_NEBULA_OFFSET_X[i];
    let cloudY = baseY + STARRY_NEBULA_OFFSET_Y[i];
    if (cloudX > width + cloudWidth * 0.05 || cloudY + cloudHeight < -height * 0.05) {
      const resetX = -cloudWidth;
      const resetY = height * (0.72 + i * 0.09) - cloudHeight * 0.5;
      STARRY_NEBULA_OFFSET_X[i] = resetX - baseX;
      STARRY_NEBULA_OFFSET_Y[i] = resetY - baseY;
      cloudX = resetX;
      cloudY = resetY;
    }
    STARRY_NEBULA_DRAW_X[i] = cloudX;
    STARRY_NEBULA_DRAW_Y[i] = cloudY;
    STARRY_NEBULA_DRAW_WIDTH[i] = cloudWidth;
    STARRY_NEBULA_DRAW_HEIGHT[i] = cloudHeight;
    ctx.globalAlpha = STARRY_NEBULA_ALPHAS[i] + driftPulse * 0.018;
    ctx.drawImage(starryNebulaBuffers[i], cloudX, cloudY, cloudWidth, cloudHeight);
  }
  ctx.restore();

  let hasAudioPulse = false;
  for (let index = 0; index < STARRY_NEBULA_COUNT; index += 1) {
    if (STARRY_NEBULA_AUDIO_LEVELS[index] > 0.003) {
      hasAudioPulse = true;
      break;
    }
  }
  if (hasAudioPulse || starryFlashLevel > 0.01) {
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    if (hasAudioPulse) {
      for (let index = 0; index < STARRY_NEBULA_COUNT; index += 1) {
        const audioPulse = STARRY_NEBULA_AUDIO_LEVELS[index];
        if (audioPulse <= 0.003) continue;
        const cloudWidth = STARRY_NEBULA_DRAW_WIDTH[index];
        const cloudHeight = STARRY_NEBULA_DRAW_HEIGHT[index];
        const haloWidth = cloudWidth * STARRY_NEBULA_HALO_SCALE;
        const haloHeight = cloudHeight * STARRY_NEBULA_HALO_SCALE;
        const haloX = STARRY_NEBULA_DRAW_X[index] - (haloWidth - cloudWidth) * 0.5;
        const haloY = STARRY_NEBULA_DRAW_Y[index] - (haloHeight - cloudHeight) * 0.5;
        ctx.globalAlpha = Math.min(
          isRainbowTheme ? 0.56 : 0.62,
          audioPulse * (isRainbowTheme ? 0.72 : 0.82),
        );
        ctx.drawImage(starryGlowBuffers[index], haloX, haloY, haloWidth, haloHeight);
      }
    }
    for (let index = 0; index < STARRY_NEBULA_COUNT; index += 1) {
      const flashLevel = STARRY_FLASH_LEVELS[index];
      if (flashLevel <= 0.01) continue;
      const cloudWidth = STARRY_NEBULA_DRAW_WIDTH[index];
      const cloudHeight = STARRY_NEBULA_DRAW_HEIGHT[index];
      const haloWidth = cloudWidth * STARRY_NEBULA_HALO_SCALE;
      const haloHeight = cloudHeight * STARRY_NEBULA_HALO_SCALE;
      const haloX = STARRY_NEBULA_DRAW_X[index] - (haloWidth - cloudWidth) * 0.5;
      const haloY = STARRY_NEBULA_DRAW_Y[index] - (haloHeight - cloudHeight) * 0.5;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = flashLevel * (isRainbowTheme ? 0.26 : 0.23);
      ctx.drawImage(starryGlowBuffers[index], haloX, haloY, haloWidth, haloHeight);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = flashLevel * 0.9;
      ctx.drawImage(
        starryGlowBuffers[index],
        STARRY_NEBULA_DRAW_X[index],
        STARRY_NEBULA_DRAW_Y[index],
        STARRY_NEBULA_DRAW_WIDTH[index],
        STARRY_NEBULA_DRAW_HEIGHT[index],
      );
    }
    ctx.restore();
  }
}

function chooseStarryGlowIndex(timestamp, excludedIndex = -1) {
  const firstIndex = (starryGlowIndex + 2) % STARRY_NEBULA_COUNT;
  let oldestIndex = -1;
  let oldestTime = Infinity;
  for (let offset = 0; offset < STARRY_NEBULA_COUNT; offset += 1) {
    const index = (firstIndex + offset) % STARRY_NEBULA_COUNT;
    if (index === excludedIndex) continue;
    const lastFlash = STARRY_CLOUD_LAST_FLASH[index];
    if (timestamp - lastFlash >= STARRY_CLOUD_FLASH_COOLDOWN) return index;
    if (lastFlash < oldestTime) {
      oldestTime = lastFlash;
      oldestIndex = index;
    }
  }
  return oldestIndex;
}

function activateStarryGlow(index, level, timestamp, holdMs = STARRY_FLASH_HOLD_MS) {
  if (index < 0) return;
  STARRY_FLASH_LEVELS[index] = Math.max(STARRY_FLASH_LEVELS[index], level);
  STARRY_FLASH_HOLD_UNTIL[index] = Math.max(STARRY_FLASH_HOLD_UNTIL[index], timestamp + holdMs);
  STARRY_CLOUD_LAST_FLASH[index] = timestamp;
  starryGlowIndex = index;
  starryFlashLevel = Math.max(starryFlashLevel, level);
}

function updateStarryFlashEnvelopes(timestamp, delta) {
  let highestLevel = 0;
  const decay = Math.exp(-delta * 3.1);
  for (let index = 0; index < STARRY_NEBULA_COUNT; index += 1) {
    let level = STARRY_FLASH_LEVELS[index];
    if (timestamp >= STARRY_FLASH_HOLD_UNTIL[index]) level *= decay;
    if (level < 0.005) level = 0;
    STARRY_FLASH_LEVELS[index] = level;
    if (level > highestLevel) highestLevel = level;
  }
  starryFlashLevel = highestLevel;
}

function prepareStarryCache(width, height, accent, accent2) {
  if (!starryX) {
    starryX = new Float32Array(STARRY_STAR_COUNT);
    starryY = new Float32Array(STARRY_STAR_COUNT);
    starryDepth = new Uint8Array(STARRY_STAR_COUNT);
    starrySize = new Float32Array(STARRY_STAR_COUNT);
    starryBrightness = new Float32Array(STARRY_STAR_COUNT);
    starryTwinkleSines = new Float32Array(STARRY_STAR_COUNT);
    starryTwinkleCosines = new Float32Array(STARRY_STAR_COUNT);
    starryTwinkleAmounts = new Float32Array(STARRY_STAR_COUNT);
    starryTwinkleGroups = new Uint8Array(STARRY_STAR_COUNT);
    starryColorChoices = new Uint8Array(STARRY_STAR_COUNT);
    starryRainbowIndices = new Uint8Array(STARRY_STAR_COUNT);
    for (let i = 0; i < STARRY_STAR_COUNT; i += 1) {
      const depth = i < STARRY_FAR_COUNT ? 0 : (i < STARRY_FAR_COUNT + STARRY_MID_COUNT ? 1 : 2);
      const twinklePhase = starryRandom() * Math.PI * 2;
      starryX[i] = starryRandom() * width;
      starryY[i] = starryRandom() * height;
      starryDepth[i] = depth;
      starrySize[i] = depth === 0
        ? 0.42 + starryRandom() * 0.44
        : (depth === 1 ? 0.78 + starryRandom() * 0.62 : 1.2 + starryRandom() * 0.92);
      starryBrightness[i] = depth === 0
        ? 0.28 + starryRandom() * 0.34
        : (depth === 1 ? 0.4 + starryRandom() * 0.36 : 0.56 + starryRandom() * 0.34);
      starryTwinkleSines[i] = Math.sin(twinklePhase);
      starryTwinkleCosines[i] = Math.cos(twinklePhase);
      starryTwinkleAmounts[i] = starryRandom() < 0.38
        ? 0.1 + starryRandom() * (depth === 0 ? 0.24 : 0.14)
        : 0.025 + starryRandom() * 0.045;
      starryTwinkleGroups[i] = Math.floor(starryRandom() * STARRY_TWINKLE_SPEEDS.length);
      starryColorChoices[i] = Math.floor(starryRandom() * 256);
      starryRainbowIndices[i] = Math.floor(starryRandom() * RAINBOW_COLOR_STEPS);
    }
    starryGeometryWidth = width;
    starryGeometryHeight = height;

    starryMeteorX = new Float32Array(STARRY_METEOR_SLOTS);
    starryMeteorY = new Float32Array(STARRY_METEOR_SLOTS);
    starryMeteorDirectionX = new Float32Array(STARRY_METEOR_SLOTS);
    starryMeteorDirectionY = new Float32Array(STARRY_METEOR_SLOTS);
    starryMeteorSpeed = new Float32Array(STARRY_METEOR_SLOTS);
    starryMeteorAge = new Float32Array(STARRY_METEOR_SLOTS);
    starryMeteorDuration = new Float32Array(STARRY_METEOR_SLOTS);
    starryMeteorLength = new Float32Array(STARRY_METEOR_SLOTS);
    starryMeteorWidth = new Float32Array(STARRY_METEOR_SLOTS);
    starryMeteorColorIndices = new Uint8Array(STARRY_METEOR_SLOTS);
    starryMeteorRare = new Uint8Array(STARRY_METEOR_SLOTS);
  } else if (starryGeometryWidth !== width || starryGeometryHeight !== height) {
    const scaleX = width / starryGeometryWidth;
    const scaleY = height / starryGeometryHeight;
    for (let i = 0; i < STARRY_STAR_COUNT; i += 1) {
      starryX[i] *= scaleX;
      starryY[i] *= scaleY;
    }
    for (let i = 0; i < STARRY_NEBULA_COUNT; i += 1) {
      STARRY_NEBULA_OFFSET_X[i] *= scaleX;
      STARRY_NEBULA_OFFSET_Y[i] *= scaleY;
    }
    starryGeometryWidth = width;
    starryGeometryHeight = height;
  }
  starryMinimumSize = Math.min(width, height);

  const gradientChanged = starryGradientWidth !== width
    || starryGradientHeight !== height
    || starryGradientAccent !== accent
    || starryGradientAccent2 !== accent2
    || starryGradientRainbow !== isRainbowTheme;
  if (!gradientChanged) return;

  const maximumSize = Math.max(width, height);
  starryBackgroundGradient = ctx.createRadialGradient(
    width * 0.62,
    height * 0.2,
    0,
    width * 0.5,
    height * 0.5,
    maximumSize * 0.82,
  );
  starryBackgroundGradient.addColorStop(0, '#0b1230');
  starryBackgroundGradient.addColorStop(0.5, '#040816');
  starryBackgroundGradient.addColorStop(1, '#010208');
  rebuildStarryNebulaTextures(accent, accent2);

  starryGradientWidth = width;
  starryGradientHeight = height;
  starryGradientAccent = accent;
  starryGradientAccent2 = accent2;
  starryGradientRainbow = isRainbowTheme;
}

function updateStarryNebulaAudioLevel(index, averageRise, peakRise) {
  const target = Math.min(
    1,
    (averageRise * 0.68 + peakRise * 0.32) * sensitivityAmount * 7.5,
  );
  const current = STARRY_NEBULA_AUDIO_LEVELS[index];
  const response = target > current ? 0.75 : 0.3;
  const next = current + (target - current) * response;
  STARRY_NEBULA_AUDIO_LEVELS[index] = next < 0.003 ? 0 : next;
}

function updateStarryAudio(timestamp) {
  if (starryPendingSecondaryIndex >= 0 && timestamp >= starryPendingSecondaryAt) {
    activateStarryGlow(
      starryPendingSecondaryIndex,
      starryPendingSecondaryLevel,
      timestamp,
      38,
    );
    starryPendingSecondaryIndex = -1;
    starryPendingSecondaryAt = Infinity;
    starryPendingSecondaryLevel = 0;
  }

  const sampleCount = Math.min(64, frequencyData.length);
  let total = 0;
  let lowTotal = 0;
  let midTotal = 0;
  let highTotal = 0;
  let lowRiseTotal = 0;
  let midRiseTotal = 0;
  let highRiseTotal = 0;
  let lowRisePeak = 0;
  let midRisePeak = 0;
  let highRisePeak = 0;
  for (let i = 0; i < sampleCount; i += 1) {
    const dataValue = frequencyData[i];
    const value = dataValue / 255;
    const rise = starryFrequencyHistoryReady
      ? Math.max(0, dataValue - STARRY_PREVIOUS_FREQUENCIES[i]) / 255
      : 0;
    STARRY_PREVIOUS_FREQUENCIES[i] = dataValue;
    total += value;
    if (i < 8) {
      lowTotal += value;
      lowRiseTotal += rise;
      if (rise > lowRisePeak) lowRisePeak = rise;
    } else if (i < 30) {
      midTotal += value;
      midRiseTotal += rise;
      if (rise > midRisePeak) midRisePeak = rise;
    } else {
      highTotal += value;
      highRiseTotal += rise;
      if (rise > highRisePeak) highRisePeak = rise;
    }
  }
  starryFrequencyHistoryReady = true;

  const overall = total / sampleCount;
  const lowCount = Math.min(8, sampleCount);
  const midCount = Math.max(1, Math.min(22, sampleCount - 8));
  const highCount = Math.max(1, sampleCount - 30);
  const low = lowTotal / lowCount;
  const mid = midTotal / midCount;
  const high = highTotal / highCount;
  updateStarryNebulaAudioLevel(0, lowRiseTotal / lowCount, lowRisePeak);
  updateStarryNebulaAudioLevel(1, midRiseTotal / midCount, midRisePeak);
  updateStarryNebulaAudioLevel(2, highRiseTotal / highCount, highRisePeak);
  const lowRise = Math.max(0, low - starryPreviousLow);
  const peak = Math.max(low, mid * 0.86, high * 0.74);
  const peakRise = Math.max(0, peak - starryPreviousPeak);
  starryPreviousLow = low;
  starryPreviousPeak = peak;
  starrySmoothedEnergy += (overall - starrySmoothedEnergy) * 0.045;

  const reactiveTarget = Math.min(1, overall * sensitivityAmount * 1.18);
  starryAudioLevel += (reactiveTarget - starryAudioLevel)
    * (reactiveTarget > starryAudioLevel ? 0.18 : 0.055);

  const beatStrength = lowRise * (0.72 + sensitivityAmount * 0.32);
  if (low > 0.16 && beatStrength > 0.043 && timestamp - starryLastBeatTime > 240) {
    if (Number.isFinite(starryLastBeatTime)) {
      const interval = Math.max(280, Math.min(1400, timestamp - starryLastBeatTime));
      starryBeatInterval += (interval - starryBeatInterval) * 0.24;
      starryTempoTarget = 0.82 + ((1400 - starryBeatInterval) / 1120) * 0.58;
    }
    starryBeatPushTarget = Math.max(
      starryBeatPushTarget,
      Math.min(0.42, 0.08 + beatStrength * sensitivityAmount * 2.4),
    );
    starryLastBeatTime = timestamp;
  } else if (timestamp - starryLastBeatTime > 2400) {
    starryTempoTarget = 0.82 + Math.min(0.28, starrySmoothedEnergy * 0.42);
  }
  starryTempoFactor += (starryTempoTarget - starryTempoFactor) * 0.022;

  const flashStrength = Math.max(lowRise * 2.3, peakRise * 1.8, peak - 0.72);
  const strongPeak = (peak > 0.32 || peakRise > 0.14)
    && flashStrength * sensitivityAmount > 0.34;
  if (timestamp - starryLastFlashTime > STARRY_FLASH_COOLDOWN && strongPeak) {
    starryLastFlashTime = timestamp;
    const mainIndex = chooseStarryGlowIndex(timestamp);
    const mainLevel = Math.min(1, 0.4 + flashStrength * sensitivityAmount * 1.25);
    activateStarryGlow(mainIndex, mainLevel, timestamp);

    if (mainLevel > 0.9 && starryFlashRandom() < 0.16) {
      const companionIndex = chooseStarryGlowIndex(timestamp, mainIndex);
      activateStarryGlow(companionIndex, mainLevel * 0.46, timestamp, 34);
    }

    const secondaryChance = Math.min(0.76, 0.3 + flashStrength * sensitivityAmount * 0.52);
    if (starryFlashRandom() < secondaryChance) {
      starryPendingSecondaryIndex = chooseStarryGlowIndex(timestamp, mainIndex);
      starryPendingSecondaryAt = timestamp + 150 + starryFlashRandom() * 80;
      starryPendingSecondaryLevel = mainLevel * (0.46 + starryFlashRandom() * 0.12);
    }
  }
  return Math.round(overall * 100);
}

function spawnStarryMeteor(timestamp, directionAngle) {
  let slot = -1;
  for (let i = 0; i < STARRY_METEOR_SLOTS; i += 1) {
    if (starryMeteorAge[i] >= starryMeteorDuration[i]) {
      slot = i;
      break;
    }
  }
  if (slot === -1) return;

  const rare = starryRandom() < 0.075;
  const angleOffset = 1.18 + starryRandom() * 1.18;
  const meteorAngle = directionAngle + (starryRandom() < 0.5 ? angleOffset : -angleOffset);
  starryMeteorX[slot] = starryRandom() * starryGeometryWidth;
  starryMeteorY[slot] = starryRandom() * starryGeometryHeight;
  starryMeteorDirectionX[slot] = Math.cos(meteorAngle);
  starryMeteorDirectionY[slot] = Math.sin(meteorAngle);
  starryMeteorSpeed[slot] = starryMinimumSize * (rare ? 0.62 : 0.78) * (0.88 + starryRandom() * 0.28);
  starryMeteorAge[slot] = 0;
  starryMeteorDuration[slot] = rare ? 0.9 + starryRandom() * 0.24 : 0.5 + starryRandom() * 0.22;
  starryMeteorLength[slot] = starryMinimumSize * (rare ? 0.2 : 0.105) * (0.84 + starryRandom() * 0.26);
  starryMeteorWidth[slot] = rare ? 1.55 : 1.05;
  starryMeteorColorIndices[slot] = Math.floor(starryRandom() * RAINBOW_COLOR_STEPS);
  starryMeteorRare[slot] = rare ? 1 : 0;
  starryNextMeteorAt = timestamp + 12000 + starryRandom() * 22000;
}

function drawStarryMeteors(delta, accent, accent2) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  for (let i = 0; i < STARRY_METEOR_SLOTS; i += 1) {
    const duration = starryMeteorDuration[i];
    if (!duration || starryMeteorAge[i] >= duration) continue;
    starryMeteorAge[i] += delta;
    if (starryMeteorAge[i] >= duration) continue;
    starryMeteorX[i] += starryMeteorDirectionX[i] * starryMeteorSpeed[i] * delta;
    starryMeteorY[i] += starryMeteorDirectionY[i] * starryMeteorSpeed[i] * delta;
    const progress = starryMeteorAge[i] / duration;
    const fade = Math.min(1, progress / 0.12, (1 - progress) / 0.24);
    const color = isRainbowTheme
      ? RAINBOW_CYCLIC_COLORS[starryMeteorColorIndices[i]]
      : (starryMeteorColorIndices[i] % 2 ? accent : accent2);
    const x = starryMeteorX[i];
    const y = starryMeteorY[i];
    const tailX = x - starryMeteorDirectionX[i] * starryMeteorLength[i];
    const tailY = y - starryMeteorDirectionY[i] * starryMeteorLength[i];
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = starryMeteorRare[i] ? 12 : 8;
    ctx.globalAlpha = fade * 0.16;
    ctx.lineWidth = starryMeteorWidth[i] * 3.2;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.globalAlpha = fade * 0.88;
    ctx.lineWidth = starryMeteorWidth[i];
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, starryMeteorWidth[i] * 0.85, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawStarry(width, height, accent, accent2, timestamp) {
  prepareStarryCache(width, height, accent, accent2);
  const returningAfterGap = starryLastTimestamp && timestamp - starryLastTimestamp > 1000;
  const delta = starryLastTimestamp ? Math.min((timestamp - starryLastTimestamp) / 1000, 0.05) : 0.016;
  if (returningAfterGap) {
    starryNextMeteorAt = timestamp + 8000 + starryRandom() * 14000;
    starryMeteorAge.fill(1);
    starryMeteorDuration.fill(0);
    starryPreviousLow = 0;
    starryPreviousPeak = 0;
    starryAudioLevel = 0;
    STARRY_NEBULA_AUDIO_LEVELS.fill(0);
    STARRY_PREVIOUS_FREQUENCIES.fill(0);
    starryFrequencyHistoryReady = false;
    starryBeatPush = 0;
    starryBeatPushTarget = 0;
    starryFlashLevel = 0;
    STARRY_FLASH_LEVELS.fill(0);
    STARRY_FLASH_HOLD_UNTIL.fill(0);
    starryPendingSecondaryIndex = -1;
    starryPendingSecondaryAt = Infinity;
    starryPendingSecondaryLevel = 0;
    starryLastBeatTime = -Infinity;
  }
  starryLastTimestamp = timestamp;
  const level = updateStarryAudio(timestamp);

  const directionAngle = -0.24
    + Math.sin(timestamp * 0.000026) * 0.07
    + Math.sin(timestamp * 0.000009) * 0.035;
  const directionX = Math.cos(directionAngle);
  const directionY = Math.sin(directionAngle);
  const baseSpeed = starryMinimumSize * 0.02 * starryTempoFactor;
  starryBeatPushTarget *= Math.exp(-delta * 4.6);
  const beatResponse = 1 - Math.exp(-delta * (starryBeatPushTarget > starryBeatPush ? 10 : 4));
  starryBeatPush += (starryBeatPushTarget - starryBeatPush) * beatResponse;
  updateStarryFlashEnvelopes(timestamp, delta);

  for (let group = 0; group < STARRY_TWINKLE_SPEEDS.length; group += 1) {
    const twinkleTime = timestamp * STARRY_TWINKLE_SPEEDS[group];
    STARRY_TWINKLE_PHASE_SINES[group] = Math.sin(twinkleTime);
    STARRY_TWINKLE_PHASE_COSINES[group] = Math.cos(twinkleTime);
  }

  ctx.save();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = starryBackgroundGradient;
  ctx.fillRect(0, 0, width, height);
  drawStarryNebula(width, height, timestamp, delta, directionX, directionY);

  for (let i = 0; i < STARRY_STAR_COUNT; i += 1) {
    const depth = starryDepth[i];
    const beatSpeed = depth === 0 ? 1 : (1 + starryBeatPush * (depth === 1 ? 0.3 : 0.5));
    const speed = baseSpeed * STARRY_DEPTH_SPEEDS[depth] * beatSpeed;
    let x = starryX[i] + directionX * speed * delta;
    let y = starryY[i] + directionY * speed * delta;
    const margin = 6;
    if (x < -margin) x += width + margin * 2;
    else if (x > width + margin) x -= width + margin * 2;
    if (y < -margin) y += height + margin * 2;
    else if (y > height + margin) y -= height + margin * 2;
    starryX[i] = x;
    starryY[i] = y;

    const group = starryTwinkleGroups[i];
    const twinkle = starryTwinkleSines[i] * STARRY_TWINKLE_PHASE_COSINES[group]
      + starryTwinkleCosines[i] * STARRY_TWINKLE_PHASE_SINES[group];
    const alpha = Math.min(1, starryBrightness[i]
      * (1 + twinkle * starryTwinkleAmounts[i])
      * (0.82 + starryAudioLevel * 0.5));
    const size = starrySize[i] * (1 + starryAudioLevel * 0.07);
    const colorChoice = starryColorChoices[i];
    const color = isRainbowTheme
      ? (colorChoice < 92 ? RAINBOW_CYCLIC_COLORS[starryRainbowIndices[i]] : (colorChoice < 188 ? '#dce8ff' : '#ffffff'))
      : (colorChoice < 54 ? accent : (colorChoice < 82 ? accent2 : (colorChoice < 198 ? '#dce8ff' : '#ffffff')));
    ctx.fillStyle = color;

    if (depth === 0) {
      ctx.globalAlpha = alpha;
      ctx.fillRect(x - size * 0.5, y - size * 0.5, size, size);
      continue;
    }

    if (depth === 2) {
      ctx.globalAlpha = alpha * 0.13;
      ctx.fillRect(x - size * 1.8, y - 0.24, size * 3.6, 0.48);
      ctx.fillRect(x - 0.24, y - size * 1.8, 0.48, size * 3.6);
      if ((colorChoice & 7) === 0) {
        ctx.globalAlpha = alpha * 0.26;
        ctx.fillRect(x - size * 2.8, y - 0.3, size * 5.6, 0.6);
        ctx.fillRect(x - 0.3, y - size * 2.8, 0.6, size * 5.6);
      }
    }
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size * 0.72, y);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x - size * 0.72, y);
    ctx.closePath();
    ctx.fill();
  }

  if (!starryNextMeteorAt) starryNextMeteorAt = timestamp + 10000 + starryRandom() * 14000;
  if (timestamp >= starryNextMeteorAt) spawnStarryMeteor(timestamp, directionAngle);
  drawStarryMeteors(delta, accent, accent2);
  ctx.restore();
  return level;
}

function scheduleFrame() {
  if (isRendering && animationFrameId === null) {
    animationFrameId = requestAnimationFrame(render);
  }
}

function startRendering() {
  if (isRendering || document.hidden || sessionEnded) return;
  if (visualMode !== 'mist' && (audio.paused || !analyser)) return;
  isRendering = true;
  renderTimeline = null;
  renderRecoveryAttempted = false;
  scheduleFrame();
}

function stopRendering(clear = false) {
  isRendering = false;
  renderTimeline = null;
  renderRecoveryAttempted = false;
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  if (clear) clearCanvas();
}

function render(timestamp = 0) {
  animationFrameId = null;
  if (!isRendering) return;
  try {
    const width = canvasWidth;
    const height = canvasHeight;
    if (!width || !height) {
      scheduleFrame();
      return;
    }

    const mistIdle = visualMode === 'mist' && (!analyser || audio.paused);
    if ((!analyser || audio.paused) && !mistIdle) {
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

    if (!mistIdle) analyser.getByteFrequencyData(frequencyData);
    if (visualMode === 'aurora') analyser.getByteTimeDomainData(timeData);
    if (visualMode !== 'mist' && visualMode !== 'starry') ctx.clearRect(0, 0, width, height);
    let level = 0;
    if (visualMode === 'ring') level = drawRing(width, height, accentColor, accent2Color);
    else if (visualMode === 'wave') level = drawWave(width, height, accentColor, accent2Color);
    else if (visualMode === 'bar') level = drawBar(width, height, accentColor, accent2Color);
    else if (visualMode === 'orbit') level = drawOrbit(width, height, accentColor, accent2Color, timestamp);
    else if (visualMode === 'aurora') level = drawAurora(width, height, accentColor, accent2Color, timestamp);
    else if (visualMode === 'spark') level = drawSpark(width, height, accentColor, accent2Color, timestamp);
    else if (visualMode === 'starry') level = drawStarry(width, height, accentColor, accent2Color, timestamp);
    else if (visualMode === 'mist' && mistRenderer && !mistContextLost) {
      level = mistRenderer.draw(timestamp, mistIdle ? null : frequencyData, sensitivityAmount);
    }
    updateSignalValue(level, timestamp);
    renderRecoveryAttempted = false;
    scheduleFrame();
  } catch (error) {
    console.error('Visualizer render error:', error);
    const canRetry = !renderRecoveryAttempted
      && !document.hidden
      && !sessionEnded
      && (visualMode === 'mist' || (!audio.paused && analyser));
    isRendering = false;
    renderTimeline = null;
    animationFrameId = null;
    if (canRetry) {
      renderRecoveryAttempted = true;
      isRendering = true;
      scheduleFrame();
    }
  }
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
  playbackActionId += 1;
  isTrackTransitioning = false;
  if (!audio.paused && !audio.ended) backgroundResumePending = true;
  audio.pause();
  await enterPausedState(false);
}

async function resumeAfterBackground() {
  if (!backgroundResumePending || !audio.src || sessionEnded) return;
  const actionId = ++playbackActionId;
  try {
    const started = await playLoadedTrack(actionId);
    if (!started) return;
    backgroundResumePending = false;
    resumeButton.hidden = true;
    hideMessage();
  } catch (error) {
    if (actionId !== playbackActionId) return;
    console.error(error);
    showMessage('再開できませんでした。もう一度「再開する」を押してください。');
  }
}

async function safeExit() {
  playbackActionId += 1;
  isTrackTransitioning = false;
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
  renderPlaylist();
  showMessage('再生を終了しました。この画面は閉じても大丈夫です。');
}

function addPlaylistTrack(file) {
  if (!file) return;
  if (sessionEnded) {
    revokePlaylistUrls();
    sessionEnded = false;
  }
  if (playlist.length >= MAX_PLAYLIST_TRACKS) {
    showMessage('追加できる曲は3曲までです。');
    return;
  }

  const isFirstTrack = playlist.length === 0;
  playlist.push({
    file,
    url: URL.createObjectURL(file),
  });

  if (!isFirstTrack) {
    updateTrackReadout();
    return;
  }

  playbackActionId += 1;
  isTrackTransitioning = false;
  audio.pause();
  sessionEnded = false;
  backgroundResumePending = false;
  loadPlaylistTrack(0);
  playButton.disabled = false;
  stopButton.disabled = false;
  progress.disabled = false;
  safeExitButton.disabled = false;
  resumeButton.hidden = true;
  hideMessage();
  statusText.textContent = 'LOADED';
  void enterPausedState();
}

async function removePlaylistTrack(index) {
  if (sessionEnded || index < 0 || index >= playlist.length) return;

  const removingCurrentTrack = index === currentTrackIndex;
  if (!removingCurrentTrack) {
    const [removedTrack] = playlist.splice(index, 1);
    URL.revokeObjectURL(removedTrack.url);
    if (index < currentTrackIndex) currentTrackIndex -= 1;
    updateTrackReadout();
    return;
  }

  const actionId = ++playbackActionId;
  const wasPlaying = !audio.paused && !audio.ended;
  isTrackTransitioning = true;
  backgroundResumePending = false;
  resumeButton.hidden = true;
  audio.pause();
  stopRendering();

  const [removedTrack] = playlist.splice(index, 1);
  URL.revokeObjectURL(removedTrack.url);

  try {
    if (playlist.length === 0) {
      currentTrackIndex = -1;
      audio.removeAttribute('src');
      audio.load();
      progress.value = 0;
      playButton.disabled = true;
      stopButton.disabled = true;
      progress.disabled = true;
      setPlayingUI(false);
      statusText.textContent = 'READY';
      hideMessage();
      updateTrackReadout();
      await enterPausedState();
      return;
    }

    const replacementIndex = repeatMode === 'all' && index >= playlist.length
      ? 0
      : Math.min(index, playlist.length - 1);
    loadPlaylistTrack(replacementIndex);
    statusText.textContent = 'LOADED';
    hideMessage();

    if (wasPlaying && !document.hidden) {
      const started = await playLoadedTrack(actionId);
      if (!started && actionId === playbackActionId) await enterPausedState();
    } else {
      await enterPausedState();
    }
  } catch (error) {
    if (actionId !== playbackActionId) return;
    console.error(error);
    await enterPausedState();
    showMessage('曲を切り替えられませんでした。「再生」を押して再開してください。');
  } finally {
    if (actionId === playbackActionId) isTrackTransitioning = false;
  }
}

fileButton.addEventListener('click', () => {
  if (playlist.length > 0 && !sessionEnded) return;
  fileInput.value = '';
  fileInput.click();
});
addTrackButton.addEventListener('click', () => {
  if (playlist.length === 0 || playlist.length >= MAX_PLAYLIST_TRACKS || sessionEnded) return;
  fileInput.value = '';
  fileInput.click();
});
fileInput.addEventListener('change', () => {
  const [file] = fileInput.files;
  addPlaylistTrack(file);
  fileInput.value = '';
});
playlistList.addEventListener('click', (event) => {
  const removeButton = event.target.closest('.playlist-remove');
  if (!removeButton) return;
  void removePlaylistTrack(Number(removeButton.dataset.index));
});

playButton.addEventListener('click', async () => {
  if (!audio.src || sessionEnded) return;
  const actionId = ++playbackActionId;
  isTrackTransitioning = false;
  try {
    if (audio.paused) {
      stoppedByUser = false;
      await playLoadedTrack(actionId);
    } else {
      audio.pause();
      await enterPausedState();
    }
  } catch (error) {
    if (actionId !== playbackActionId) return;
    console.error(error);
    await enterPausedState();
    showMessage('再生を開始できませんでした。音源を選び直してお試しください。');
  }
});

stopButton.addEventListener('click', () => {
  playbackActionId += 1;
  isTrackTransitioning = false;
  stoppedByUser = true;
  backgroundResumePending = false;
  resumeButton.hidden = true;
  hideMessage();
  audio.pause();
  audio.currentTime = 0;
  void enterPausedState();
});
repeatButton.addEventListener('click', () => {
  repeatMode = REPEAT_MODES[(REPEAT_MODES.indexOf(repeatMode) + 1) % REPEAT_MODES.length];
  updateRepeatButton();
});
resumeButton.addEventListener('click', resumeAfterBackground);
safeExitButton.addEventListener('click', safeExit);

audio.addEventListener('play', () => {
  setPlayingUI(true);
  renderPlaylist();
  startRendering();
});
audio.addEventListener('pause', () => {
  setPlayingUI(false);
  renderPlaylist();
  if (!sessionEnded && !isTrackTransitioning && !audio.ended) void enterPausedState();
});
audio.addEventListener('loadedmetadata', () => {
  trackTime.textContent = `00:00 / ${formatTime(audio.duration)}`;
});
audio.addEventListener('timeupdate', () => {
  progress.value = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
  trackTime.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
});
audio.addEventListener('ended', async () => {
  const actionId = ++playbackActionId;
  isTrackTransitioning = true;
  stopRendering();
  setPlayingUI(false);
  audio.currentTime = 0;
  progress.value = 0;
  try {
    if (stoppedByUser || playlist.length === 0 || document.hidden || sessionEnded) {
      await enterPausedState(false);
      return;
    }

    if (repeatMode === 'one') {
      loadPlaylistTrack(currentTrackIndex);
      await playLoadedTrack(actionId);
      return;
    }

    if (currentTrackIndex + 1 < playlist.length) {
      loadPlaylistTrack(currentTrackIndex + 1);
      statusText.textContent = 'LOADED';
      await playLoadedTrack(actionId);
      return;
    }

    if (repeatMode === 'all' && playlist.length > 0) {
      loadPlaylistTrack(0);
      statusText.textContent = 'LOADED';
      await playLoadedTrack(actionId);
      return;
    }

    await enterPausedState();
  } catch (error) {
    if (actionId !== playbackActionId) return;
    console.error(error);
    await enterPausedState();
    showMessage('自動再生を続けられませんでした。「再生」を押して再開してください。');
  } finally {
    if (actionId === playbackActionId) isTrackTransitioning = false;
  }
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
  if (button.dataset.visual === 'mist' && !ensureMistRenderer()) return;
  const wasMist = visualMode === 'mist';
  visualMode = button.dataset.visual;
  if (visualMode === 'spark') {
    sparkParticles = [];
    previousSparkLevel = 0;
    sparkLastTimestamp = 0;
  }
  const showMist = visualMode === 'mist';
  if (wasMist && !showMist) releaseMistPointer();
  canvas.hidden = showMist;
  mistCanvas.hidden = !showMist;
  visualStage.classList.toggle('is-mist', showMist);
  visualStage.classList.toggle('is-starry', visualMode === 'starry');
  resizeCanvas();
  if (wasMist && !showMist && audio.paused) stopRendering();
  if (!document.hidden && !sessionEnded) {
    if (!audio.paused && analyser) startRendering();
    else if ((showMist || wasMist) && !isRendering) drawIdleFrame();
  }
  document.querySelectorAll('.visual-mode').forEach((mode) => {
    mode.classList.toggle('is-active', mode === button);
    mode.setAttribute('aria-pressed', String(mode === button));
  });
}));
document.querySelectorAll('.theme-dot').forEach((button) => button.addEventListener('click', () => {
  document.body.classList.remove('theme-amber', 'theme-lavender', 'theme-sakura', 'theme-emerald', 'theme-red', 'theme-yellow', 'theme-rainbow');
  if (button.dataset.theme === 'amber') document.body.classList.add('theme-amber');
  if (button.dataset.theme === 'lavender') document.body.classList.add('theme-lavender');
  if (button.dataset.theme === 'sakura') document.body.classList.add('theme-sakura');
  if (button.dataset.theme === 'emerald') document.body.classList.add('theme-emerald');
  if (button.dataset.theme === 'red') document.body.classList.add('theme-red');
  if (button.dataset.theme === 'yellow') document.body.classList.add('theme-yellow');
  if (button.dataset.theme === 'rainbow') document.body.classList.add('theme-rainbow');
  isRainbowTheme = button.dataset.theme === 'rainbow';
  mistTheme = button.dataset.theme;
  if (mistRenderer && !mistContextLost) mistRenderer.setTheme(mistTheme);
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

mistCanvas.addEventListener('pointerdown', (event) => {
  if (visualMode !== 'mist' || mistContextLost || !mistRenderer || mistPointerId !== null) return;
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  const position = getMistPointerPosition(event);
  if (!position) return;
  mistPointerId = event.pointerId;
  mistPointerX = position.x;
  mistPointerY = position.y;
  mistPointerTime = event.timeStamp;
  try {
    mistCanvas.setPointerCapture?.(event.pointerId);
  } catch (error) {
    console.debug('MIST pointer capture:', error);
  }
  mistRenderer.setPointerInteraction(position.x, position.y, 0, 0, 0);
  startRendering();
  event.preventDefault();
});

mistCanvas.addEventListener('pointermove', (event) => {
  if (event.pointerId !== mistPointerId || !mistRenderer || mistContextLost) return;
  const position = getMistPointerPosition(event);
  if (!position) return;
  const elapsed = Math.max(8, event.timeStamp - mistPointerTime) / 1000;
  const deltaX = position.x - mistPointerX;
  const deltaY = position.y - mistPointerY;
  const distance = Math.hypot(deltaX, deltaY);
  const directionX = distance ? deltaX / distance : 0;
  const directionY = distance ? deltaY / distance : 0;
  const strength = Math.min(1, distance / elapsed / 1.35);
  mistPointerX = position.x;
  mistPointerY = position.y;
  mistPointerTime = event.timeStamp;
  mistRenderer.setPointerInteraction(position.x, position.y, directionX, directionY, strength);
  event.preventDefault();
});

mistCanvas.addEventListener('pointerup', (event) => {
  if (event.pointerId !== mistPointerId) return;
  releaseMistPointer();
  event.preventDefault();
});
mistCanvas.addEventListener('pointercancel', (event) => {
  if (event.pointerId === mistPointerId) releaseMistPointer();
});
mistCanvas.addEventListener('lostpointercapture', (event) => {
  if (event.pointerId === mistPointerId) releaseMistPointer();
});

mistCanvas.addEventListener('webglcontextlost', (event) => {
  event.preventDefault();
  releaseMistPointer();
  mistContextLost = true;
  mistRenderer = null;
  if (visualMode === 'mist') stopRendering();
});
mistCanvas.addEventListener('webglcontextrestored', () => {
  mistContextLost = false;
  if (document.hidden || sessionEnded) return;
  if (visualMode === 'mist' && ensureMistRenderer()) {
    resizeCanvas();
    if (audio.paused) drawIdleFrame(); else startRendering();
  } else if (visualMode !== 'mist' && !audio.paused && analyser) {
    startRendering();
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
  playbackActionId += 1;
  audio.pause();
  stopRendering();
  disconnectAudioGraph();
  if (audioContext && audioContext.state === 'running') void audioContext.suspend();
  revokePlaylistUrls();
});
window.addEventListener('resize', resizeCanvas);

document.querySelector('#appVersion').textContent = APP_META.version;
document.querySelector('#lastUpdated').textContent = APP_META.lastUpdated;
updateRepeatButton();
renderPlaylist();
refreshVisualStyles();
resizeCanvas();
