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
      sierpinski: {
        color: '#ffffff',
        levels: 3
      },
      carpet: {
        color: '#ffffff',
        levels: 3,
        skipCenter: true
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
      sierpinski: `
        <h3 class="font-medium text-lg mb-2">Параметры треугольника Серпинского</h3>
        <ul class="list-disc pl-5 space-y-1">
          <li><code>color</code>: Цвет (hex, по умолчанию #ffffff)</li>
          <li><code>levels</code>: Количество уровней (по умолчанию 3)</li>
        </ul>
      `,
      carpet: `
        <h3 class="font-medium text-lg mb-2">Параметры ковра Серпинского</h3>
        <ul class="list-disc pl-5 space-y-1">
          <li><code>color</code>: Цвет (hex, по умолчанию #ffffff)</li>
          <li><code>levels</code>: Количество уровней (по умолчанию 3)</li>
          <li><code>skipCenter</code>: Пропускать центр? (true/false, по умолчанию true)</li>
        </ul>
      `
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
      case 'sierpinski':
        this.drawSierpinskiTriangle();
        break;
      case 'carpet':
        this.drawSierpinskiCarpet();
        break;
      default:
        console.warn(`Unknown fractal type: ${this.currentType}`);
    }
    
    this.ctx.restore();
  }

  // Метод для треугольника Серпинского
  drawSierpinskiTriangle() {
    this.ctx.fillStyle = this.rules.color || '#ffffff';
    
    const size = Math.min(this.canvas.width, this.canvas.height) * 0.8;
    const x1 = this.canvas.width / 2;
    const y1 = (this.canvas.height - size) / 2;
    const x2 = x1 - size / 2;
    const y2 = y1 + size;
    const x3 = x1 + size / 2;
    const y3 = y2;
    
    this.drawSierpinski(
      x1, y1, x2, y2, x3, y3,
      this.currentDepth
    );
  }

  drawSierpinski(x1, y1, x2, y2, x3, y3, depth) {
    if (depth <= 0) {
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.lineTo(x3, y3);
      this.ctx.closePath();
      this.ctx.fill();
      return;
    }

    const mx12 = (x1 + x2) / 2;
    const my12 = (y1 + y2) / 2;
    const mx23 = (x2 + x3) / 2;
    const my23 = (y2 + y3) / 2;
    const mx31 = (x3 + x1) / 2;
    const my31 = (y3 + y1) / 2;

    this.drawSierpinski(x1, y1, mx12, my12, mx31, my31, depth - 1);
    this.drawSierpinski(x2, y2, mx23, my23, mx12, my12, depth - 1);
    this.drawSierpinski(x3, y3, mx31, my31, mx23, my23, depth - 1);
  }

  // Метод для ковра Серпинского
  drawSierpinskiCarpet() {
    this.ctx.fillStyle = this.rules.color || '#ffffff';
    
    const size = Math.min(this.canvas.width, this.canvas.height) * 0.8;
    const x = (this.canvas.width - size) / 2;
    const y = (this.canvas.height - size) / 2;
    
    this.drawCarpet(
      x, y, size,
      this.currentDepth,
      this.rules.skipCenter !== false
    );
  }

  drawCarpet(x, y, size, depth, skipCenter) {
    if (depth <= 0) {
      this.ctx.fillRect(x, y, size, size);
      return;
    }

    const newSize = size / 3;
    
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (skipCenter && i === 1 && j === 1) continue;
        
        this.drawCarpet(
          x + i * newSize,
          y + j * newSize,
          newSize,
          depth - 1,
          skipCenter
        );
      }
    }
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
      major: ["C4", "E4", "G4", "B4"],
      minor: ["D4", "F4", "A4", "C5"],
      pentatonic: ["G3", "A3", "C4", "D4", "F4"]
    };
    
    const notes = [];
    const pattern = this.generateMusicPattern();
    
    pattern.forEach(index => {
      notes.push(scales.major[index % scales.major.length]);
    });
    
    return notes;
  }
  
  // генерация музыки для всех фракталов
  generateMusicPattern() {
    const pattern = [];
    const complexity = this.currentDepth * 2;
    
    switch(this.currentType) {
      case 'tree':
        const branches = this.rules.branches || 2;
        for (let i = 0; i < complexity * branches; i++) {
          pattern.push(i % 7);
        }
        break;
        
      case 'koch':
        const segments = this.rules.segments || 4;
        for (let i = 0; i < Math.pow(segments, this.currentDepth); i++) {
          pattern.push(Math.floor(Math.sin(i) * 5) % 7);
        }
        break;
        
      case 'sierpinski':
        for (let i = 0; i < Math.pow(3, this.currentDepth); i++) {
          pattern.push((i & (i + 1)) === 0 ? 0 : i % 7);
        }
        break;
        
      case 'carpet':
        for (let i = 0; i < complexity * 4; i++) {
          pattern.push(i % 7);
        }
        break;
    }
    
    return pattern;
  }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  new FractalRulesEditor();
});