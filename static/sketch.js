let canvas, ctx;
let currentDepth = 3;
let currentType = "tree";
const angle = Math.PI / 4;

window.addEventListener("DOMContentLoaded", () => {
  canvas = document.getElementById("fractal-canvas");
  ctx = canvas.getContext("2d");

  drawFractal(currentDepth, currentType);

  document.getElementById("fractal-type").addEventListener("change", (e) => {
    currentType = e.target.value;
    updateFractal(currentDepth);
  });
});


function drawFractal(depth, type) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "white";
  ctx.lineWidth = 1;

  if (type === "tree") {
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height);
    drawBranch(100, depth);
    ctx.restore();
  } else if (type === "koch") {
    drawKochSnowflake(depth);
  } else if (type === "mandelbrot") {
    drawMandelbrot();
  } else if (type === "dragon") {
      drawDragon(currentDepth);
  } else if (type === "barnsley") {
      drawBarnsleyFern();
  }
  
}

// === Фрактальное дерево ===
function drawBranch(length, depth) {
  if (depth === 0) return;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -length);
  ctx.stroke();

  ctx.translate(0, -length);

  ctx.save();
  ctx.rotate(angle);
  drawBranch(length * 0.67, depth - 1);
  ctx.restore();

  ctx.save();
  ctx.rotate(-angle);
  drawBranch(length * 0.67, depth - 1);
  ctx.restore();
}

// === Кривая Коха ===
function drawKochSnowflake(depth) {
  let ax = 100, ay = 300;
  let bx = 700, by = 300;

  drawKochLine(ax, ay, bx, by, depth);
}

function drawKochLine(x1, y1, x5, y5, depth) {
  if (depth === 0) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x5, y5);
    ctx.stroke();
    return;
  }

  const dx = x5 - x1;
  const dy = y5 - y1;

  const x2 = x1 + dx / 3;
  const y2 = y1 + dy / 3;

  const x3 = (x1 + x5) / 2 + Math.sqrt(3) * (y1 - y5) / 6;
  const y3 = (y1 + y5) / 2 + Math.sqrt(3) * (x5 - x1) / 6;

  const x4 = x1 + 2 * dx / 3;
  const y4 = y1 + 2 * dy / 3;

  drawKochLine(x1, y1, x2, y2, depth - 1);
  drawKochLine(x2, y2, x3, y3, depth - 1);
  drawKochLine(x3, y3, x4, y4, depth - 1);
  drawKochLine(x4, y4, x5, y5, depth - 1);
}

// === Множество Мандельброта ===
function drawMandelbrot() {
  const imageData = ctx.createImageData(canvas.width, canvas.height);
  const maxIter = 100 + currentDepth * 20;  // Зависимость количества итераций от глубины

  for (let x = 0; x < canvas.width; x++) {
    for (let y = 0; y < canvas.height; y++) {
      let a = (x - canvas.width / 2) * 4 / canvas.width;
      let b = (y - canvas.height / 2) * 4 / canvas.height;

      let ca = a, cb = b;
      let n = 0;

      while (n < maxIter) {
        const aa = a * a - b * b;
        const bb = 2 * a * b;
        a = aa + ca;
        b = bb + cb;
        if (a * a + b * b > 16) break;  // Выход из цикла, если точка вышла за пределы
        n++;
      }

      // Цвет пикселя зависит от количества итераций
      const color = n === maxIter ? 0 : 255 - Math.floor(n * 255 / maxIter);
      const idx = (x + y * canvas.width) * 4;
      imageData.data[idx + 0] = color;
      imageData.data[idx + 1] = color;
      imageData.data[idx + 2] = color;
      imageData.data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

// === Дракон Хартера-Хейтуэя ===
function drawDragon(depth) {
  let points = [{ x: 300, y: 300 }, { x: 500, y: 300 }];

  for (let i = 0; i < depth; i++) {
    const newPoints = [points[0]];
    for (let j = 0; j < points.length - 1; j++) {
      const p1 = points[j];
      const p2 = points[j + 1];

      const mx = (p1.x + p2.x) / 2;
      const my = (p1.y + p2.y) / 2;

      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;

      const newX = mx - dy / 2;
      const newY = my + dx / 2;

      newPoints.push({ x: newX, y: newY }, p2);
    }
    points = newPoints;
  }

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (const p of points) {
    ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
}

// === Папоротник Барнсли ===
function drawBarnsleyFern() {
  let x = 0, y = 0;

  ctx.fillStyle = "white";

  for (let i = 0; i < 100000; i++) {
    const r = Math.random();
    let nextX, nextY;

    if (r < 0.01) {
      nextX = 0;
      nextY = 0.16 * y;
    } else if (r < 0.86) {
      nextX = 0.85 * x + 0.04 * y;
      nextY = -0.04 * x + 0.85 * y + 1.6;
    } else if (r < 0.93) {
      nextX = 0.2 * x - 0.26 * y;
      nextY = 0.23 * x + 0.22 * y + 1.6;
    } else {
      nextX = -0.15 * x + 0.28 * y;
      nextY = 0.26 * x + 0.24 * y + 0.44;
    }

    x = nextX;
    y = nextY;

    const px = canvas.width / 2 + x * 60;
    const py = canvas.height - y * 60;
    ctx.fillRect(px, py, 1, 1);
  }
}

function updateFractal(newDepth) {
  currentDepth = newDepth;
  drawFractal(currentDepth, currentType);
}


