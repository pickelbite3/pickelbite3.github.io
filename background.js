<canvas id="abstract-bg"></canvas>

<select id="bg-mode">
  <option value="dynamic">Dynamic</option>
  <option value="static">Static</option>
  <option value="plain">Plain</option>
</select>

<script>
const canvas = document.getElementById("abstract-bg");
const gl = canvas.getContext("webgl");

// --- Vertex shader ---
const vertexShaderSource = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

// --- Fragment shader (optimized) ---
const fragmentShaderSource = `
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
    uv.x *= resolution.x / resolution.y; // keep proportions
    uv *= 10.0;

    float v = 0.0;
    vec2 shift = vec2(cos(time*0.1), sin(time*0.13));
    v += noise(uv*3.0 + shift);
    v += 0.5 * noise(uv*5.0 - shift*1.5);
    v = 0.5 + 0.5*v;

    float stepped = floor(v * levels) / levels;

    vec3 darkGray  = vec3(0.12);
    vec3 lightGray = vec3(0.6);
    vec3 green     = vec3(0.0, 1.0, 0.3);

    vec3 grayBand = mix(darkGray, lightGray, stepped);
    vec3 col = (stepped > greenThreshold) ? green : grayBand;

    gl_FragColor = vec4(col, 1.0);
  }
`;

// --- Shader compile helper ---
function compileShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
  }
  return shader;
}

// --- Program setup ---
const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
gl.useProgram(program);

// --- Locations ---
const positionLocation = gl.getAttribLocation(program, "position");
const timeLocation = gl.getUniformLocation(program, "time");
const resolutionLocation = gl.getUniformLocation(program, "resolution");
const levelsLocation = gl.getUniformLocation(program, "levels");
const greenThresholdLocation = gl.getUniformLocation(program, "greenThreshold");

// --- Geometry ---
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(
  gl.ARRAY_BUFFER,
  new Float32Array([
    -1, -1, 1, -1, -1, 1,
    -1,  1, 1, -1, 1,  1,
  ]),
  gl.STATIC_DRAW
);

gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

// --- Resize handling ---
let lastW = 0, lastH = 0;
function resize() {
  const docHeight = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.offsetHeight,
    document.documentElement.clientHeight
  );

  const w = window.innerWidth;
  const h = docHeight;

  if (w === lastW && h === lastH) return;
  lastW = w; lastH = h;

  canvas.width = w;
  canvas.height = h;
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
}
window.addEventListener("resize", resize);
resize();

let resizeScheduled = false;
const observer = new MutationObserver(() => {
  if (!resizeScheduled) {
    resizeScheduled = true;
    requestAnimationFrame(() => {
      resize();
      resizeScheduled = false;
    });
  }
});
observer.observe(document.body, { childList: true, subtree: true });

// --- Background mode selector ---
const modeSelect = document.getElementById("bg-mode");
let bgMode = "dynamic"; 
modeSelect.addEventListener("change", (e) => {
  bgMode = e.target.value;

  if (bgMode === "plain") {
    canvas.style.display = "none";
    document.body.style.background = "#222";
  } else {
    canvas.style.display = "block";
    document.body.style.background = "none";
    draw(); // restart loop or single render
  }
});

// --- Draw helper ---
function drawFrame(t) {
  gl.uniform1f(timeLocation, t);
  gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
  gl.uniform1f(levelsLocation, 8.0);
  gl.uniform1f(greenThresholdLocation, 0.75);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

// --- Animation loop ---
let startTime = Date.now();
function draw() {
  if (bgMode === "dynamic") {
    const t = (Date.now() - startTime) * 0.001;
    drawFrame(t);
    requestAnimationFrame(draw);
  } else if (bgMode === "static") {
    // just draw once at t=0
    drawFrame(0.0);
  }
}

// start dynamic by default
draw();
