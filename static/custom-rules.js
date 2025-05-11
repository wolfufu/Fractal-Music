class FractalRulesEditor {
  constructor() {
    this.canvas = document.getElementById('preview-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.currentType = 'tree';
    this.currentDepth = 3;
    this.rules = this.getDefaultRules();
    
    this.initElements();
    this.setupEventListeners();
    this.updateEditor();
    this.drawPreview();
  }
  
  initElements() {
    this.elements = {
      fractalType: document.getElementById('fractal-type'),
      rulesEditor: document.getElementById('rules-editor'),
      applyBtn: document.getElementById('apply-btn'),
      resetBtn: document.getElementById('reset-btn'),
      depthRange: document.getElementById('depth-range'),
      depthValue: document.getElementById('depth-value'),
      playBtn: document.getElementById('play-btn'),
      rulesDocs: document.getElementById('rules-docs')
    };
  }
  
  setupEventListeners() {
    this.elements.fractalType.addEventListener('change', (e) => {
      this.currentType = e.target.value;
      this.rules = this.getDefaultRules();
      this.updateEditor();
      this.drawPreview();
    });
    
    this.elements.applyBtn.addEventListener('click', () => {
      try {
        this.rules = JSON.parse(this.elements.rulesEditor.value);
        this.drawPreview();
      } catch (e) {
        alert(`Ошибка в формате JSON: ${e.message}`);
      }
    });
    
    this.elements.resetBtn.addEventListener('click', () => {
      this.rules = this.getDefaultRules();
      this.updateEditor();
      this.drawPreview();
    });
    
    this.elements.depthRange.addEventListener('input', (e) => {
      this.currentDepth = parseInt(e.target.value);
      this.elements.depthValue.textContent = this.currentDepth;
      this.drawPreview();
    });
    
    this.elements.playBtn.addEventListener('click', () => {
      this.playFractalMusic();
    });
  }
  
  getDefaultRules() {
    const defaults = {
      tree: {
        angle: 45,
        lengthFactor: 0.67,
        branches: 2,
        initLength: 80,
        color: '#ffffff'
      },
      koch: {
        segments: 4,
        angle: 60,
        scaleFactor: 1/3,
        color: '#ffffff'
      },
      mandelbrot: {
      maxIterations: 100,
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
      color: '#ffffff'
    },
    dragon: {
      color: '#ffffff',
      angle: 45,
      scaleFactor: 0.7
    },
    barnsley: {
      color: '#00ff00',
      points: 10000
    }
    };
    
    return defaults[this.currentType];
  }
  
  updateEditor() {
    this.elements.rulesEditor.value = JSON.stringify(this.rules, null, 2);
    this.updateDocumentation();
  }
  
  // документация
  updateDocumentation() {
    const docs = {
      tree: `
        <h3 class="font-medium text-lg mb-2">Параметры дерева</h3>
        <ul class="list-disc pl-5 space-y-1">
          <li><code>angle</code>: Угол ветвления (градусы, по умолчанию 45)</li>
          <li><code>lengthFactor</code>: Коэффициент длины ветвей (0-1, по умолчанию 0.67)</li>
          <li><code>branches</code>: Количество ветвей (по умолчанию 2)</li>
          <li><code>initLength</code>: Начальная длина (по умолчанию 80)</li>
          <li><code>color</code>: Цвет (hex, по умолчанию #ffffff)</li>
        </ul>
      `,
      koch: `
        <h3 class="font-medium text-lg mb-2">Параметры кривой Коха</h3>
        <ul class="list-disc pl-5 space-y-1">
          <li><code>segments</code>: Количество сегментов (по умолчанию 4)</li>
          <li><code>angle</code>: Угол поворота (градусы, по умолчанию 60)</li>
          <li><code>scaleFactor</code>: Коэффициент масштабирования (0-1, по умолчанию 0.33)</li>
          <li><code>color</code>: Цвет (hex, по умолчанию #ffffff)</li>
        </ul>
      `,
      mandelbrot: `
        <h3 class="font-medium text-lg mb-2">Параметры множества Мандельброта</h3>
        <ul class="list-disc pl-5 space-y-1">
          <li><code>maxIterations</code>: Максимальное число итераций (по умолчанию 100)</li>
          <li><code>zoom</code>: Масштаб (по умолчанию 1)</li>
          <li><code>offsetX</code>, <code>offsetY</code>: Смещение (по умолчанию 0)</li>
          <li><code>color</code>: Цвет (hex)</li>
        </ul>
      `,
      dragon: `
        <h3 class="font-medium text-lg mb-2">Параметры дракона Хартера-Хейтуэя</h3>
        <ul class="list-disc pl-5 space-y-1">
          <li><code>angle</code>: Угол искажения (по умолчанию 45)</li>
          <li><code>scaleFactor</code>: Коэффициент масштабирования поворота (по умолчанию 0.7)</li>
          <li><code>color</code>: Цвет (hex)</li>
        </ul>
      `,
      barnsley: `
        <h3 class="font-medium text-lg mb-2">Параметры папоротника Барнсли</h3>
        <ul class="list-disc pl-5 space-y-1">
          <li><code>points</code>: Количество точек (по умолчанию 10000)</li>
          <li><code>color</code>: Цвет (hex)</li>
        </ul>
      `,
    };
    
    this.elements.rulesDocs.innerHTML = docs[this.currentType] || 
      `<p>Документация для этого фрактала пока недоступна.</p>`;
  }
  
drawPreview() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    
    switch(this.currentType) {
      case 'tree':
        this.drawTree();
        break;
      case 'koch':
        this.drawKoch();
        break;
      case 'mandelbrot':
        this.drawMandelbrot();
        break;
      case 'dragon':
        this.drawDragon();
        break;
      case 'barnsley':
        this.drawBarnsleyFern();
        break;
      default:
        console.warn(`Unknown fractal type: ${this.currentType}`);
    }
    
    this.ctx.restore();
  }
  
  drawTree() {
    this.ctx.strokeStyle = this.rules.color || '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.translate(this.canvas.width / 2, this.canvas.height);
    
    this.drawBranch(
      this.rules.initLength || 80,
      this.currentDepth,
      this.rules.angle * Math.PI / 180,
      this.rules.lengthFactor || 0.67,
      this.rules.branches || 2
    );
  }
  
  drawBranch(length, depth, angle, lengthFactor, branches) {
    if (depth <= 0) return;
    
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(0, -length);
    this.ctx.stroke();
    
    this.ctx.translate(0, -length);
    
    for (let i = 0; i < branches; i++) {
      const branchAngle = angle * (i - (branches - 1) / 2);
      this.ctx.save();
      this.ctx.rotate(branchAngle);
      this.drawBranch(length * lengthFactor, depth - 1, angle, lengthFactor, branches);
      this.ctx.restore();
    }
  }

  drawKoch() {
    this.ctx.strokeStyle = this.rules.color || '#ffffff';
    this.ctx.lineWidth = 1;
    
    const segments = this.rules.segments || 4;
    const angle = (this.rules.angle || 60) * Math.PI / 180;
    const scaleFactor = this.rules.scaleFactor || 1/3;
    
    const startX = 50;
    const startY = this.canvas.height / 2;
    const endX = this.canvas.width - 50;
    const endY = this.canvas.height / 2;
    
    this.drawKochLine(
        startX, startY,
        endX, endY,
        this.currentDepth,
        segments,
        angle,
        scaleFactor
    );
    }

    drawKochLine(x1, y1, x2, y2, depth, segments, angle, scaleFactor) {
        if (depth === 0) {
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
            return;
        }

        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy) * scaleFactor;
        const initialAngle = Math.atan2(dy, dx);

        let points = [{x: x1, y: y1}];
        let currentX = x1;
        let currentY = y1;

        for (let i = 1; i <= segments; i++) {
            const segmentAngle = initialAngle + angle * (i - (segments - 1)/2);
            currentX += length * Math.cos(segmentAngle);
            currentY += length * Math.sin(segmentAngle);
            points.push({x: currentX, y: currentY});
        }

        for (let i = 0; i < points.length - 1; i++) {
            this.drawKochLine(
            points[i].x, points[i].y,
            points[i+1].x, points[i+1].y,
            depth - 1,
            segments,
            angle,
            scaleFactor
            );
        }
    }

    // метод для мандельброта
    drawMandelbrot() {
      const { maxIterations, zoom, offsetX, offsetY, color } = this.rules;
      const width = this.canvas.width;
      const height = this.canvas.height;
      const imageData = this.ctx.createImageData(width, height);
      const data = imageData.data;

      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          let zx = 0, zy = 0;
          const cx = (x - width / 2) / (200 * zoom) + offsetX;
          const cy = (y - height / 2) / (200 * zoom) + offsetY;
          let i = 0;
          while (zx * zx + zy * zy < 4 && i < maxIterations) {
            const tmp = zx * zx - zy * zy + cx;
            zy = 2 * zx * zy + cy;
            zx = tmp;
            i++;
          }
          const p = (y * width + x) * 4;
          const brightness = i === maxIterations ? 0 : (i / maxIterations) * 255;
          data[p] = parseInt(color.slice(1, 3), 16) * brightness / 255;
          data[p + 1] = parseInt(color.slice(3, 5), 16) * brightness / 255;
          data[p + 2] = parseInt(color.slice(5, 7), 16) * brightness / 255;
          data[p + 3] = 255;
        }
      }
      this.ctx.putImageData(imageData, 0, 0);
    }

    //метод для дракона
    drawDragon() {
      const { angle, scaleFactor, color } = this.rules;
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 1;

      const points = [{ x: 200, y: 200 }, { x: 300, y: 200 }];

      for (let i = 0; i < this.currentDepth; i++) {
        const newPoints = [points[0]];
        for (let j = 0; j < points.length - 1; j++) {
          const a = points[j];
          const b = points[j + 1];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          const nx = mx - dy * scaleFactor;
          const ny = my + dx * scaleFactor;
          newPoints.push({ x: nx, y: ny }, b);
        }
        points.splice(0, points.length, ...newPoints);
      }

      this.ctx.beginPath();
      this.ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        this.ctx.lineTo(points[i].x, points[i].y);
      }
      this.ctx.stroke();
    }

    //метод для папоротника
    drawBarnsleyFern() {
      const { color, points } = this.rules;
      this.ctx.fillStyle = color;
      let x = 0, y = 0;

      for (let i = 0; i < points; i++) {
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
        const plotX = this.canvas.width / 2 + x * 60;
        const plotY = this.canvas.height - y * 60;
        this.ctx.fillRect(plotX, plotY, 1, 1);
      }
    }

  
  playFractalMusic() {
    const notes = this.generateFractalMelody();
    const synth = new Tone.Synth().toDestination();
    const now = Tone.now();
    
    notes.forEach((note, i) => {
      synth.triggerAttackRelease(note, "8n", now + i * 0.3);
    });
  }

  
  generateFractalMelody() {
    const scales = {
      major: ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"],
      minor: ["A3", "B3", "C4", "D4", "E4", "F4", "G4", "A4"],
      pentatonic: ["C4", "D4", "E4", "G4", "A4"]
    };
    
    const notes = [];
    const pattern = this.generateMusicPattern();
    
    pattern.forEach(index => {
      notes.push(scales.major[index % scales.major.length]);
    });
    
    return notes;
  }
  
  // генерация музыки для всех фракталов
  // генерация музыки для всех фракталов
  generateMusicPattern() {
    const pattern = [];
    const complexity = this.currentDepth * 2;

    switch(this.currentType) {
      case 'tree':
        const branches = this.rules.branches || 2;
        for (let i = 0; i < complexity * branches; i++) {
          pattern.push(i % 7); // Плавное повторение нот в зависимости от количества ветвей
        }
        break;

      case 'koch':
        const segments = this.rules.segments || 4;
        for (let i = 0; i < Math.pow(segments, this.currentDepth); i++) {
          pattern.push(Math.floor(Math.sin(i) * 5) % 7);
        }
        break;

      case 'mandelbrot':
        // Мандельброт: количество итераций
        const maxIterations = this.rules.maxIterations || 100;
        for (let i = 0; i < maxIterations; i++) {
          const normalized = Math.floor(i / maxIterations * 7); // Нормализуем число итераций для создания мелодии
          pattern.push(normalized);
        }
        break;

      case 'dragon':
        // Дракон: использование углов поворота и количества точек для создания вариаций
        const dragonPoints = Math.pow(2, this.currentDepth); // Количество точек в зависимости от глубины
        for (let i = 0; i < dragonPoints; i++) {
          const angle = Math.sin(i * Math.PI / dragonPoints) * 7; // Синусоиды для изменения высоты
          pattern.push(Math.floor((angle + 7) % 7)); // Нормализуем результат в диапазоне от 0 до 6
        }
        break;

      case 'barnsley':
        // Папоротник Барнсли: использование случайных значений для точек
        const points = this.rules.points || 10000;
        for (let i = 0; i < points; i++) {
          const randomNote = Math.floor(Math.random() * 7); // Генерируем случайные ноты для случайных точек
          pattern.push(randomNote);
        }
        break;

      default:
        console.warn('Неизвестный тип фрактала, музыка не будет сгенерирована.');
        break;
    }

    return pattern;
  }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  new FractalRulesEditor();
});