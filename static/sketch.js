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
  } else if (type === "sierpinski") {
    ctx.fillStyle = "white";
    drawSierpinskiTriangle(400, 50, 100, 450, 700, 450, depth);
  } else if (type === "carpet") {
    ctx.fillStyle = "white";
    drawSierpinskiCarpet(150, 100, 500, depth);
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

function drawSierpinskiCarpet(x, y, size, depth) {
    if (depth === 0) {
      ctx.fillRect(x, y, size, size);
      return;
    }
  
    const newSize = size / 3;
  
    for (let dx = 0; dx < 3; dx++) {
      for (let dy = 0; dy < 3; dy++) {
        if (dx === 1 && dy === 1) continue; // центральный квадрат — пустой
        drawSierpinskiCarpet(x + dx * newSize, y + dy * newSize, newSize, depth - 1);
      }
    }
  }
  
  function drawSierpinskiTriangle(x1, y1, x2, y2, x3, y3, depth) {
    if (depth === 0) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x3, y3);
      ctx.closePath();
      ctx.fill();
      return;
    }
  
    const mx12 = (x1 + x2) / 2;
    const my12 = (y1 + y2) / 2;
  
    const mx23 = (x2 + x3) / 2;
    const my23 = (y2 + y3) / 2;
  
    const mx31 = (x3 + x1) / 2;
    const my31 = (y3 + y1) / 2;
  
    drawSierpinskiTriangle(x1, y1, mx12, my12, mx31, my31, depth - 1);
    drawSierpinskiTriangle(x2, y2, mx23, my23, mx12, my12, depth - 1);
    drawSierpinskiTriangle(x3, y3, mx31, my31, mx23, my23, depth - 1);
  }
  

function updateFractal(newDepth) {
  currentDepth = newDepth;
  drawFractal(currentDepth, currentType);
}


