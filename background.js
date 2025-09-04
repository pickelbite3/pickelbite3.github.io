const canvas = document.getElementById("abstract-bg");
const gl = canvas.getContext("webgl");

const vertexShaderSource = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision highp float;
  uniform float time;
  uniform vec2 resolution;

  float noise(vec2 p) {
    return sin(p.x) * sin(p.y);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / vec2(resolution.x, resolution.x);
    uv *= 2.0;

    float v = 0.0;
    vec2 shift = vec2(cos(time*0.1), sin(time*0.13));
    v += noise(uv*3.0 + shift);
    v += 0.5 * noise(uv*5.0 - shift*1.5);
    v = 0.5 + 0.5*v;

    // --- Topo map style ---
    float levels = 8.0;                 // number of contour steps
    float stepped = floor(v * levels) / levels;

    vec3 darkGray  = vec3(0.12);
    vec3 lightGray = vec3(0.6);
    vec3 green     = vec3(0.0, 1.0, 0.3);

    // interpolate grayscale across levels
    vec3 grayBand = mix(darkGray, lightGray, stepped);

    // pick green for the highest band
    vec3 col = (stepped > 0.75) ? green : grayBand;

    gl_FragColor = vec4(col, 1.0);
  }
`;

function compileShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
  }
  return shader;
}

const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
gl.useProgram(program);

const positionLocation = gl.getAttribLocation(program, "position");
const timeLocation = gl.getUniformLocation(program, "time");
const resolutionLocation = gl.getUniformLocation(program, "resolution");

const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
  -1, -1, 1, -1, -1, 1,
  -1, 1, 1, -1, 1, 1,
]), gl.STATIC_DRAW);

gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

function resize() {
  const docHeight = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.offsetHeight,
    document.documentElement.clientHeight
  );

  canvas.width = window.innerWidth;
  canvas.height = docHeight;
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
}
window.addEventListener("resize", resize);
resize();

// auto-update if content changes (like game list updates)
const observer = new MutationObserver(resize);
observer.observe(document.body, { childList: true, subtree: true });

let startTime = Date.now();
function draw() {
  const t = (Date.now() - startTime) * 0.001;
  gl.uniform1f(timeLocation, t);
  gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  requestAnimationFrame(draw);
}
draw();
