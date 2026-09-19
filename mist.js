(function () {
  const PALETTES = {
    neon: {
      deep: new Float32Array([0.05, 0.08, 0.35]),
      mid: new Float32Array([0.25, 0.45, 0.95]),
      bright: new Float32Array([0.85, 0.92, 1.0]),
    },
    amber: {
      deep: new Float32Array([0.29, 0.065, 0.045]),
      mid: new Float32Array([0.95, 0.38, 0.13]),
      bright: new Float32Array([1.0, 0.89, 0.62]),
    },
    lavender: {
      deep: new Float32Array([0.14, 0.055, 0.31]),
      mid: new Float32Array([0.49, 0.3, 0.91]),
      bright: new Float32Array([0.92, 0.84, 1.0]),
    },
    sakura: {
      deep: new Float32Array([0.27, 0.065, 0.22]),
      mid: new Float32Array([0.91, 0.35, 0.65]),
      bright: new Float32Array([1.0, 0.88, 0.94]),
    },
    emerald: {
      deep: new Float32Array([0.035, 0.22, 0.17]),
      mid: new Float32Array([0.22, 0.78, 0.48]),
      bright: new Float32Array([0.81, 1.0, 0.65]),
    },
    red: {
      deep: new Float32Array([0.18, 0.015, 0.035]),
      mid: new Float32Array([0.82, 0.08, 0.14]),
      bright: new Float32Array([1.0, 0.72, 0.7]),
    },
    yellow: {
      deep: new Float32Array([0.2, 0.2, 0.025]),
      mid: new Float32Array([0.92, 0.88, 0.11]),
      bright: new Float32Array([1.0, 1.0, 0.78]),
    },
  };

  const vertexSource = `
attribute vec2 aPos;
void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }
`;

  // The noise, six-octave FBM, and original domain-warp motion come from living-fog-prototype.html.
  const fragmentSource = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform vec4 uAudio;
uniform float uAttack;
uniform float uGlow;
uniform vec2 uGlowPos;
uniform vec3 uDeep;
uniform vec3 uMidColor;
uniform vec3 uBright;
uniform float uRainbow;

vec2 hash(vec2 p){
  p = vec2(dot(p, vec2(127.1,311.7)), dot(p, vec2(269.5,183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float noise(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(
    mix(dot(hash(i+vec2(0,0)), f-vec2(0,0)), dot(hash(i+vec2(1,0)), f-vec2(1,0)), u.x),
    mix(dot(hash(i+vec2(0,1)), f-vec2(0,1)), dot(hash(i+vec2(1,1)), f-vec2(1,1)), u.x),
    u.y
  );
}

float fbm(vec2 p){
  float v = 0.0;
  float amp = 0.5;
  mat2 rot = mat2(0.8,0.6,-0.6,0.8);
  for(int i=0;i<6;i++){
    v += amp * noise(p);
    p = rot * p * 2.02;
    amp *= 0.5;
  }
  return v;
}

float warpedFog(vec2 p, float t){
  vec2 push = vec2(uAudio.x * 0.28 + uAttack * 0.2, uAudio.y * 0.25);
  vec2 q = vec2(
    fbm(p + vec2(0.0, 0.0) + 0.05*t + push),
    fbm(p + vec2(5.2, 1.3) - 0.04*t + vec2(-push.y, push.x))
  );
  vec2 r = vec2(
    fbm(p + 3.2*q + vec2(1.7,9.2) + 0.12*t + vec2(uAudio.y * 0.38, -uAudio.x * 0.16)),
    fbm(p + 3.2*q + vec2(8.3,2.8) + 0.09*t + vec2(-uAudio.y * 0.3, uAttack * 0.16))
  );
  return fbm(p + 3.5*r + vec2(uAudio.x * 0.34, -uAudio.y * 0.22));
}

vec3 rainbowColor(float value){
  float scaled = clamp(value, 0.0, 1.0) * 6.0;
  if(scaled < 1.0) return mix(vec3(1.0,0.384,0.408), vec3(1.0,0.541,0.259), scaled);
  if(scaled < 2.0) return mix(vec3(1.0,0.541,0.259), vec3(1.0,0.953,0.361), scaled - 1.0);
  if(scaled < 3.0) return mix(vec3(1.0,0.953,0.361), vec3(0.337,0.902,0.678), scaled - 2.0);
  if(scaled < 4.0) return mix(vec3(0.337,0.902,0.678), vec3(0.369,0.851,1.0), scaled - 3.0);
  if(scaled < 5.0) return mix(vec3(0.369,0.851,1.0), vec3(0.655,0.486,1.0), scaled - 4.0);
  return mix(vec3(0.655,0.486,1.0), vec3(1.0,0.29,0.635), scaled - 5.0);
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5*uRes) / uRes.y;
  float t = uTime * 0.5;

  float f = warpedFog(uv * 1.6, t);
  f = f * 0.5 + 0.5;
  float edge = smoothstep(0.28, 0.55, f) * (1.0 - smoothstep(0.68, 0.88, f));
  float fine = noise(uv * 17.6 + vec2(t * 0.11, -t * 0.17));
  f += fine * edge * uAudio.z * 0.09;
  f += uAudio.w * 0.045;

  vec3 col;
  if(uRainbow > 0.5){
    float diagonal = clamp(
      (gl_FragCoord.x / uRes.x + gl_FragCoord.y / uRes.y) * 0.5 + (f - 0.5) * 0.1,
      0.0,
      1.0
    );
    vec3 rainbowBase = rainbowColor(diagonal);
    vec3 rainbowDeep = rainbowBase * 0.25;
    vec3 rainbowBright = mix(rainbowBase, vec3(1.0), 0.7);
    col = mix(rainbowDeep, rainbowBase, smoothstep(0.25, 0.65, f));
    col = mix(col, rainbowBright, smoothstep(0.62, 0.95, f));
  } else {
    col = mix(uDeep, uMidColor, smoothstep(0.25, 0.65, f));
    col = mix(col, uBright, smoothstep(0.62, 0.95, f));
  }

  float vign = smoothstep(1.1, 0.2, length(uv));
  col *= mix(0.4, 1.0, vign) * (1.0 + uAudio.w * 0.12);

  float glowDistance = length(gl_FragCoord.xy / uRes - uGlowPos);
  float glowShape = 1.0 - smoothstep(0.03, 0.42, glowDistance);
  float fogInterior = smoothstep(0.25, 0.65, f);
  col = mix(col, vec3(1.0), glowShape * glowShape * fogInterior * uGlow * 0.55);

  gl_FragColor = vec4(col, 1.0);
}
`;

  function createMistRenderer(canvas) {
    const options = { alpha: false, antialias: false, preserveDrawingBuffer: true };
    const gl = canvas.getContext('webgl', options)
      || canvas.getContext('experimental-webgl', options);
    if (!gl) throw new Error('WebGLを利用できません。');

    function compile(type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const detail = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(`MIST shader: ${detail}`);
      }
      return shader;
    }

    const vertexShader = compile(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = compile(gl.FRAGMENT_SHADER, fragmentSource);
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`MIST program: ${gl.getProgramInfoLog(program)}`);
    }
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uniforms = {
      resolution: gl.getUniformLocation(program, 'uRes'),
      time: gl.getUniformLocation(program, 'uTime'),
      audio: gl.getUniformLocation(program, 'uAudio'),
      attack: gl.getUniformLocation(program, 'uAttack'),
      glow: gl.getUniformLocation(program, 'uGlow'),
      glowPosition: gl.getUniformLocation(program, 'uGlowPos'),
      deep: gl.getUniformLocation(program, 'uDeep'),
      mid: gl.getUniformLocation(program, 'uMidColor'),
      bright: gl.getUniformLocation(program, 'uBright'),
      rainbow: gl.getUniformLocation(program, 'uRainbow'),
    };
    const startTime = performance.now();
    let lowLevel = 0;
    let midLevel = 0;
    let highLevel = 0;
    let overallLevel = 0;
    let attackLevel = 0;
    let previousLow = 0;
    let previousMid = 0;
    let previousHigh = 0;
    let sensitivityInfluence = null;
    let glowStartTime = -Infinity;
    let lastGlowTime = -Infinity;
    let glowStrength = 0;
    let glowX = 0.5;
    let glowY = 0.5;

    function resetAudio() {
      lowLevel = midLevel = highLevel = overallLevel = attackLevel = 0;
      previousLow = previousMid = previousHigh = 0;
      glowStartTime = -Infinity;
    }

    function setTheme(theme) {
      const palette = PALETTES[theme] || PALETTES.neon;
      gl.useProgram(program);
      gl.uniform1f(uniforms.rainbow, theme === 'rainbow' ? 1 : 0);
      gl.uniform3fv(uniforms.deep, palette.deep);
      gl.uniform3fv(uniforms.mid, palette.mid);
      gl.uniform3fv(uniforms.bright, palette.bright);
    }

    function resize(width, height, dpr) {
      const ratio = Math.min(dpr || 1, 2);
      const pixelWidth = Math.max(1, Math.floor(width * ratio));
      const pixelHeight = Math.max(1, Math.floor(height * ratio));
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
    }

    function soften(value) {
      return value / (1 + value * 0.5);
    }

    function updateAudio(spectrum, sensitivity, timestamp) {
      if (!spectrum) {
        resetAudio();
        return 0;
      }
      let lowSum = 0;
      let midSum = 0;
      let highSum = 0;
      let lowPeak = 0;
      let highPeak = 0;
      for (let i = 0; i < 64; i += 1) {
        const value = spectrum[i] / 255;
        if (i < 4) {
          lowSum += value;
          if (value > lowPeak) lowPeak = value;
        } else if (i < 20) {
          midSum += value;
        } else {
          highSum += value;
          if (value > highPeak) highPeak = value;
        }
      }
      const total = lowSum + midSum + highSum;
      const lowInput = (lowSum / 4) * 0.7 + lowPeak * 0.3;
      const midInput = midSum / 16;
      const highInput = (highSum / 44) * 0.7 + highPeak * 0.3;
      const overallInput = total / 64;
      const rise = Math.max(0, lowInput - previousLow, midInput - previousMid, highInput - previousHigh);
      previousLow = lowInput;
      previousMid = midInput;
      previousHigh = highInput;

      lowLevel += (lowInput - lowLevel) * (lowInput > lowLevel ? 0.2 : 0.09);
      midLevel += (midInput - midLevel) * (midInput > midLevel ? 0.22 : 0.11);
      highLevel += (highInput - highLevel) * (highInput > highLevel ? 0.25 : 0.15);
      overallLevel += (overallInput - overallLevel) * (overallInput > overallLevel ? 0.16 : 0.07);

      const sensitivityTarget = 0.28 + 0.72 * Math.max(0, Math.min(1, (sensitivity - 0.5) / 1.9));
      if (sensitivityInfluence === null) sensitivityInfluence = sensitivityTarget;
      else sensitivityInfluence += (sensitivityTarget - sensitivityInfluence) * 0.12;
      const attackInput = Math.min(1, rise * 2.6) * sensitivityInfluence;
      attackLevel += (attackInput - attackLevel) * (attackInput > attackLevel ? 0.22 : 0.1);

      const glowReadiness = Math.max(0, (sensitivityInfluence - 0.6) / 0.4);
      const glowThreshold = 0.095 - glowReadiness * 0.06;
      if (glowReadiness > 0.1 && rise > glowThreshold
        && Math.max(lowPeak, highPeak, midInput) > 0.2 && timestamp - lastGlowTime > 1000) {
        lastGlowTime = timestamp;
        glowStartTime = timestamp;
        glowStrength = Math.min(1, 0.5 + rise * 2) * glowReadiness;
        glowX = 0.2 + Math.random() * 0.6;
        glowY = 0.2 + Math.random() * 0.6;
      }
      return Math.round((total / 64) * 100);
    }

    function draw(timestamp, spectrum, sensitivity) {
      const level = updateAudio(spectrum, sensitivity, timestamp);
      const influence = sensitivityInfluence === null ? 0 : sensitivityInfluence;
      const glowAge = timestamp - glowStartTime;
      const glow = glowAge >= 0 && glowAge < 850
        ? glowStrength * Math.min(1, glowAge / 140) * Math.exp(-Math.max(0, glowAge - 140) / 300)
        : 0;
      gl.useProgram(program);
      gl.uniform1f(uniforms.time, (timestamp - startTime) / 1000);
      gl.uniform4f(uniforms.audio,
        soften(lowLevel * 3.3 * influence),
        soften(midLevel * 3.5 * influence),
        soften(highLevel * 3.3 * influence),
        soften(overallLevel * 2.1 * influence));
      gl.uniform1f(uniforms.attack, attackLevel);
      gl.uniform1f(uniforms.glow, glow);
      gl.uniform2f(uniforms.glowPosition, glowX, glowY);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      return level;
    }

    function clear() {
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      resetAudio();
    }

    function dispose() {
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    }

    setTheme('neon');
    return { resize, setTheme, draw, clear, dispose };
  }

  window.createMistRenderer = createMistRenderer;
}());
