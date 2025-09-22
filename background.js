(() => {
  const canvas = document.getElementById('abstract-bg');
  const gl = canvas.getContext('webgl');
  if (!gl) {
    console.error('WebGL not supported in this browser');
    return;
  }

  // ---- shaders ----
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

    // tiny cheap "noise"
    float noise(vec2 p) {
      return sin(p.x) * sin(p.y);
    }

    void main() {
      // normalize to pixel space and correct aspect
      vec2 uv = gl_FragCoord.xy / resolution;
      uv.x *= resolution.x / resolution.y;

      // zoom control
      uv *= 10.0;

      float v = 0.0;
      vec2 shift = vec2(cos(time * 0.1), sin(time * 0.13));
      v += noise(uv * 3.0 + shift);
      v += 0.5 * noise(uv * 5.0 - shift * 1.5);
      v = 0.5 + 0.5 * v;

      // contour quantize
      float stepped = floor(v * levels) / levels;

      vec3 darkGray = vec3(0.12);
      vec3 lightGray = vec3(0.6);
      vec3 green = vec3(0.0, 1.0, 0.3);

      vec3 grayBand = mix(darkGray, lightGray, stepped);
      vec3 col = (stepped > greenThreshold) ? green : grayBand;

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  // ---- compile/link ----
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
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
  }
  gl.useProgram(program);

  // ---- locations & geometry (fullscreen triangle) ----
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

  // set a safe clear color (transparent)
  gl.clearColor(0,0,0,0);

  // ---- resize with DPR and set uniform immediately ----
  let lastW = 0, lastH = 0;
  const MAX_DPR = 1.5;

  function resize() {
    const docH = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight,
      document.documentElement.clientHeight
    );
    const cssW = window.innerWidth;
    const cssH = docH;

    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const bufW = Math.max(1, Math.floor(cssW * dpr));
    const bufH = Math.max(1, Math.floor(cssH * dpr));

    if (bufW === lastW && bufH === lastH) return;
    lastW = bufW; lastH = bufH;

    canvas.width = bufW;
    canvas.height = bufH;
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';

    gl.viewport(0, 0, bufW, bufH);

    // set resolution uniform immediately (prevents NaNs/white)
    gl.useProgram(program);
    gl.uniform2f(resLoc, bufW, bufH);
  }
  window.addEventListener('resize', resize);
  resize();

  // also throttle DOM changes -> resize once per frame max
  let resizeScheduled = false;
  const observer = new MutationObserver(() => {
    if (!resizeScheduled) {
      resizeScheduled = true;
      requestAnimationFrame(() => { resize(); resizeScheduled = false; });
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // ---- draw helpers and animation control ----
  function drawFrame(t) {
    gl.useProgram(program);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(timeLoc, t);
    // resolution already set at resize but set again to be safe
    gl.uniform2f(resLoc, canvas.width, canvas.height);
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
    // if already running, do nothing
    if (rafId != null) return;
    // resume from frozenTime so animation is continuous
    startTime = Date.now() - (frozenTime * 1000);
    rafId = requestAnimationFrame(animLoop);
  }

  function stopDynamicAndFreeze() {
    if (rafId != null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    // capture current time as frozen snapshot
    frozenTime = (Date.now() - startTime) * 0.001;
    // render that frozen frame once
    drawFrame(frozenTime);
  }

  function stopAllAndHide() {
    if (rafId != null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    canvas.style.display = 'none';
  }

  function showCanvas() {
    canvas.style.display = 'block';
    // make sure resolution uniform is up-to-date
    resize();
  }

  // ---- UI: mode select ----
  const modeSelect = document.getElementById('bg-mode');
  let mode = modeSelect.value || 'dynamic';

  modeSelect.addEventListener('change', (e) => {
    const newMode = e.target.value;
    if (newMode === mode) return;
    mode = newMode;

    if (mode === 'dynamic') {
      // show canvas and start dynamic animation
      showCanvas();
      startDynamic();
      document.body.style.background = 'none';
    } else if (mode === 'static') {
      // ensure canvas visible, stop anim and freeze last frame
      showCanvas();
      stopDynamicAndFreeze();
      document.body.style.background = 'none';
    } else if (mode === 'plain') {
      // hide canvas and use CSS color
      stopAllAndHide();
      document.body.style.background = '#222';
    }
  });

  // start as dynamic initially
  mode = 'dynamic';
  modeSelect.value = 'dynamic';
  showCanvas();
  startDynamic();

  // expose for debugging (optional)
  window.____topo_bg = {
    drawFrame, startDynamic, stopDynamicAndFreeze, stopAllAndHide, resize
  };
})();
