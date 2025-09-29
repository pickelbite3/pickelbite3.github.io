(() => {
  const canvas = document.getElementById('abstract-bg');
  const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
  if (!gl) {
    console.error('WebGL not supported in this browser');
    return;
  }

  const vsSrc = `
    attribute vec2 position;
    void main() {
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  const fsSrc = `
    precision mediump float;
    uniform float time;
    uniform vec2 resolution;
    uniform float levels;
    uniform float greenThreshold;

    float noise(vec2 p) {
      return sin(p.x) * sin(p.y);
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / resolution;
      uv.x *= resolution.x / resolution.y;
      uv *= 10.0;

      float v = 0.0;
      vec2 shift = vec2(cos(time * 0.1), sin(time * 0.13));
      v += noise(uv * 3.0 + shift);
      v += 0.5 * noise(uv * 5.0 - shift * 1.5);
      v = 0.5 + 0.5 * v;

      float stepped = floor(v * levels) / levels;

      vec3 darkGray = vec3(0.12);
      vec3 lightGray = vec3(0.6);
      vec3 green = vec3(0.0, 1.0, 0.3);

      vec3 grayBand = mix(darkGray, lightGray, stepped);
      vec3 col = (stepped > greenThreshold) ? green : grayBand;

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(s));
    }
    return s;
  }

  const vS = compile(gl.VERTEX_SHADER, vsSrc);
  const fS = compile(gl.FRAGMENT_SHADER, fsSrc);
  const program = gl.createProgram();
  gl.attachShader(program, vS);
  gl.attachShader(program, fS);
  gl.linkProgram(program);
  gl.useProgram(program);

  const posLoc = gl.getAttribLocation(program, 'position');
  const timeLoc = gl.getUniformLocation(program, 'time');
  const resLoc = gl.getUniformLocation(program, 'resolution');
  const levelsLoc = gl.getUniformLocation(program, 'levels');
  const greenThreshLoc = gl.getUniformLocation(program, 'greenThreshold');

  const tri = new Float32Array([
    -1, -1,
     3, -1,
    -1,  3
  ]);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, tri, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  gl.clearColor(0, 0, 0, 0);

  // --- Optimizations ---
  const RES_SCALE = 0.5; // lower = less GPU work
  let lastW = 0, lastH = 0;

  function resize() {
    const cssW = window.innerWidth;
    const cssH = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      window.innerHeight
    );

    const bufW = Math.max(1, Math.floor(cssW * RES_SCALE));
    const bufH = Math.max(1, Math.floor(cssH * RES_SCALE));

    if (bufW === lastW && bufH === lastH) return;
    lastW = bufW; lastH = bufH;

    canvas.width = bufW;
    canvas.height = bufH;
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';

    gl.viewport(0, 0, bufW, bufH);
    gl.uniform2f(resLoc, bufW, bufH);
  }
  window.addEventListener('resize', resize);
  resize();

  function drawFrame(t) {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(timeLoc, t);
    gl.uniform1f(levelsLoc, 8.0);
    gl.uniform1f(greenThreshLoc, 0.75);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  let rafId = null;
  let startTime = Date.now();
  let frozenTime = 0;

  function animLoop() {
    const t = (Date.now() - startTime) * 0.001;
    drawFrame(t);
    rafId = requestAnimationFrame(animLoop);
  }

  function startDynamic() {
    if (rafId != null) return;
    startTime = Date.now() - (frozenTime * 1000);
    rafId = requestAnimationFrame(animLoop);
    canvas.style.display = 'block';
    staticCanvas.style.display = 'none';
  }

  // --- Static snapshot handling ---
  const staticCanvas = document.createElement('canvas');
  staticCanvas.style.position = 'fixed';
  staticCanvas.style.top = 0;
  staticCanvas.style.left = 0;
  staticCanvas.style.width = '100%';
  staticCanvas.style.height = '100%';
  staticCanvas.style.zIndex = '-1';
  document.body.appendChild(staticCanvas);

  function stopDynamicAndFreeze() {
    if (rafId != null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    frozenTime = (Date.now() - startTime) * 0.001;
    drawFrame(frozenTime);

    // copy WebGL buffer into 2D canvas (lighter than keeping GL alive)
    staticCanvas.width = canvas.width;
    staticCanvas.height = canvas.height;
    const ctx2d = staticCanvas.getContext('2d');
    ctx2d.drawImage(canvas, 0, 0);

    canvas.style.display = 'none';
    staticCanvas.style.display = 'block';
  }

  // ---- UI ----
  const modeSelect = document.getElementById('bg-mode');
  modeSelect.addEventListener('change', (e) => {
    const newMode = e.target.value;
    if (newMode === 'dynamic') {
      startDynamic();
    } else if (newMode === 'static') {
      stopDynamicAndFreeze();
    }
  });

  // start dynamic by default
  startDynamic();
})();
