let compositionId = null;

class FractalMusicSystem {
  constructor() {
    this.presetsHistory = [];
    this.currentPresetId = 0;

    // Инициализация компонентов
    this.melody = {
      type: 'tree',
      depth: 3,
      canvas: document.getElementById('melody-canvas'),
      ctx: document.getElementById('melody-canvas').getContext('2d'),
      rules: this.getDefaultRules('tree')
    };
    
    this.bass = {
      type: 'dragon',
      depth: 3,
      canvas: document.getElementById('bass-canvas'),
      ctx: document.getElementById('bass-canvas').getContext('2d'),
      rules: this.getDefaultRules('dragon')
    };
    
    this.drums = {
      type: 'barnsley',
      depth: 3,
      canvas: document.getElementById('drums-canvas'),
      ctx: document.getElementById('drums-canvas').getContext('2d'),
      rules: this.getDefaultRules('barnsley')
    };
    
    // Инициализация Tone.js
    this.melodySynth = new Tone.PolySynth(Tone.Synth).toDestination();
    this.melodySynth.volume.value = -8;
    
    this.bassSynth = new Tone.MonoSynth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.1, decay: 0.3, sustain: 0.4, release: 1 }
    }).toDestination();
    this.bassSynth.volume.value = -12;

    // В конструкторе оставьте только один синтезатор:
    this.drumSynth = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 5,
      oscillator: { type: "triangle" },
      envelope: {
        attack: 0.001,
        decay: 0.4,
        sustain: 0.01,
        release: 0.4,
        attackCurve: "exponential"
      }
    }).toDestination();
    this.drumSynth.volume.value = -6; 

    this.drumReverb = new Tone.Reverb(1.5).toDestination();
    this.drumSynth.connect(this.drumReverb);
    
    this.initElements();
    this.setupEventListeners();
    this.updateAllEditors();
    this.drawAllPreviews();

    // Инициализация визуализаторов
    this.oscilloscope = {
      canvas: document.getElementById('oscilloscope'),
      ctx: document.getElementById('oscilloscope').getContext('2d')
    };
    
    // Анализаторы для визуализации
    this.waveformAnalyser = new Tone.Waveform(256);
    this.analyser = new Tone.Analyser("fft", 64);
    
    // Подключаем синтезаторы к анализаторам
    this.melodySynth.connect(this.waveformAnalyser);
    this.bassSynth.connect(this.waveformAnalyser);
    this.drumSynth.connect(this.waveformAnalyser);
    
    this.melodySynth.connect(this.analyser);
    this.bassSynth.connect(this.analyser);
    this.drumSynth.connect(this.analyser);
    
    // Запускаем анимацию визуализации
    this.startVisualization();
  }
  
  initElements() {
    this.elements = {
      // Melody
      melodyType: document.getElementById('melody-type'),
      melodyDepth: document.getElementById('melody-depth'),
      melodyDepthValue: document.getElementById('melody-depth-value'),
      melodyRules: document.getElementById('melody-rules'),
      melodyApply: document.getElementById('melody-apply'),
      melodyReset: document.getElementById('melody-reset'),
      
      // Bass
      bassType: document.getElementById('bass-type'),
      bassDepth: document.getElementById('bass-depth'),
      bassDepthValue: document.getElementById('bass-depth-value'),
      bassRules: document.getElementById('bass-rules'),
      bassApply: document.getElementById('bass-apply'),
      bassReset: document.getElementById('bass-reset'),
      
      // Drums
      drumsType: document.getElementById('drums-type'),
      drumsDepth: document.getElementById('drums-depth'),
      drumsDepthValue: document.getElementById('drums-depth-value'),
      drumsRules: document.getElementById('drums-rules'),
      drumsApply: document.getElementById('drums-apply'),
      drumsReset: document.getElementById('drums-reset'),
      
      // Playback
      playAll: document.getElementById('play-all'),
      stopAll: document.getElementById('stop-all'),
      playMelody: document.getElementById('play-melody'),
      playBass: document.getElementById('play-bass'),
      playDrums: document.getElementById('play-drums'),

      // Presets
      savePreset: document.getElementById('save-preset'),
      exportMusic: document.getElementById('export-music'),
      presetsHistory: document.getElementById('presets-history'),

      melodyAxiom: document.getElementById('melody-axiom'),
      melodyRulesJson: document.getElementById('melody-rules-json'),
      bassAxiom: document.getElementById('bass-axiom'),
      bassRulesJson: document.getElementById('bass-rules-json'),
      drumsAxiom: document.getElementById('drums-axiom'),
      drumsRulesJson: document.getElementById('drums-rules-json'),
    };
  }
  
  setupEventListeners() {
    // Общий обработчик для всех компонентов
    ['melody', 'bass', 'drums'].forEach(component => {
      // Обработчик изменения типа
      this.elements[`${component}Type`].addEventListener('change', (e) => {
        this[component].type = e.target.value;
        this[component].rules = this.getDefaultRules(this[component].type);
        this.updateEditor(component);
        this.drawPreview(component);
      });
      
      // Обработчик применения изменений
      this.elements[`${component}Apply`].addEventListener('click', () => {
        try {
          // Собираем все параметры
          const newRules = {
            ...JSON.parse(this.elements[`${component}Rules`].value),
            axiom: this.elements[`${component}Axiom`].value,
            rules: JSON.parse(this.elements[`${component}RulesJson`].value || '{}')
          };
          
          this[component].rules = newRules;
          this.drawPreview(component);
        } catch (e) {
          alert(`Ошибка в формате JSON: ${e.message}`);
        }
      });
      
      // Обработчик сброса
      this.elements[`${component}Reset`].addEventListener('click', () => {
        this[component].rules = this.getDefaultRules(this[component].type);
        this.updateEditor(component);
        this.drawPreview(component);
      });
      
      // Обработчик изменения глубины
      this.elements[`${component}Depth`].addEventListener('input', (e) => {
        this[component].depth = parseInt(e.target.value);
        this.elements[`${component}DepthValue`].textContent = this[component].depth;
        this.drawPreview(component);
      });
    });

    // Остальные обработчики (playback и т.д.) остаются без изменений
    this.elements.playAll.addEventListener('click', () => this.playAll());
    this.elements.stopAll.addEventListener('click', () => Tone.Transport.stop());
    this.elements.playMelody.addEventListener('click', () => this.playComponent('melody'));
    this.elements.playBass.addEventListener('click', () => this.playComponent('bass'));
    this.elements.playDrums.addEventListener('click', () => {
      this.elements.playDrums.classList.add('bg-green-600');
      setTimeout(() => {
        this.elements.playDrums.classList.remove('bg-green-600');
      }, 200);
      this.playComponent('drums');
    });

    this.elements.savePreset.addEventListener('click', () => this.saveCurrentPreset());
    this.elements.exportMusic.addEventListener('click', () => this.exportMusic());
  }

  startVisualization() {
    const draw = () => {
      requestAnimationFrame(draw);
      
      // Получаем данные для визуализации
      const waveform = this.waveformAnalyser.getValue();
      const frequencyData = this.analyser.getValue();
      
      // Отрисовываем визуализации
      this.drawOscilloscope(waveform);
    };
    
    draw();
  }

  drawOscilloscope(waveform) {
    const { ctx, canvas } = this.oscilloscope;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#4fd1c5';
    ctx.beginPath();
    
    const sliceWidth = canvas.width / waveform.length;
    let x = 0;
    
    for (let i = 0; i < waveform.length; i++) {
      const v = waveform[i] / 2 + 0.5;
      const y = v * canvas.height;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      
      x += sliceWidth;
    }
    
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  }

  getFrequencyRangeValue(frequencyData, lowFreq, highFreq) {
    const sampleRate = Tone.context.sampleRate;
    const binSize = sampleRate / frequencyData.length;
    
    const startBin = Math.floor(lowFreq / binSize);
    const endBin = Math.min(
      Math.floor(highFreq / binSize),
      frequencyData.length - 1
    );
    
    let sum = 0;
    for (let i = startBin; i <= endBin; i++) {
      sum += frequencyData[i];
    }
    
    return sum / (endBin - startBin + 1);
  }

  // Сохранение текущего пресета
  saveCurrentPreset() {
    const preset = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      melody: {
        type: this.melody.type,
        depth: this.melody.depth,
        rules: this.melody.rules
      },
      bass: {
        type: this.bass.type,
        depth: this.bass.depth,
        rules: this.bass.rules
      },
      drums: {
        type: this.drums.type,
        depth: this.drums.depth,
        rules: this.drums.rules
      }
    };

    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(preset, null, 2));
      const a = document.createElement('a');
      a.setAttribute("href", dataStr);
      a.setAttribute("download", `fractal_music_preset_${preset.id}.json`);
      document.body.appendChild(a);
      a.click();
      a.remove();
      console.log("Пресет успешно сохранён:", preset);
    } catch (e) {
      console.error("Ошибка при сохранении пресета:", e);
    }
  }


  // Загрузка пресета
  loadPreset(preset) {
    this.melody.type = preset.melody.type;
    this.melody.depth = preset.melody.depth;
    this.melody.rules = preset.melody.rules;
    
    this.bass.type = preset.bass.type;
    this.bass.depth = preset.bass.depth;
    this.bass.rules = preset.bass.rules;
    
    this.drums.type = preset.drums.type;
    this.drums.depth = preset.drums.depth;
    this.drums.rules = preset.drums.rules;
    
    // Обновляем UI
    this.elements.melodyType.value = this.melody.type;
    this.elements.melodyDepth.value = this.melody.depth;
    this.elements.melodyDepthValue.textContent = this.melody.depth;
    
    this.elements.bassType.value = this.bass.type;
    this.elements.bassDepth.value = this.bass.depth;
    this.elements.bassDepthValue.textContent = this.bass.depth;
    
    this.elements.drumsType.value = this.drums.type;
    this.elements.drumsDepth.value = this.drums.depth;
    this.elements.drumsDepthValue.textContent = this.drums.depth;
    
    this.updateAllEditors();
    this.drawAllPreviews();
  }

  // Экспорт музыки в WAV
  exportMusic() {
    // Создаем рекордер
    const recorder = new Tone.Recorder();
    this.melodySynth.connect(recorder);
    this.bassSynth.connect(recorder);
    this.drumSynth.connect(recorder);
    
    // Начинаем запись
    recorder.start();
    
    // Проигрываем композицию
    this.playAll();
    
    // Через 8 секунд (длина композиции) останавливаем запись
    setTimeout(async () => {
      Tone.Transport.stop();
      const recording = await recorder.stop();
      const url = URL.createObjectURL(recording);
      
      // Создаем ссылку для скачивания
      const anchor = document.createElement('a');
      anchor.download = `fractal_music_${Date.now()}.wav`;
      anchor.href = url;
      anchor.click();
    }, 8000);
  }

  // Вспомогательная функция для скачивания JSON
  downloadObjectAsJson(exportObj, exportName) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", exportName + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

  getDefaultRules(type) {
    const defaults = {
      tree: {
        angle: 45,
        lengthFactor: 0.67,
        branches: 2,
        initLength: 80,
        color: '#ff6b6b',
        axiom: 'F',
        rules: {
          'F': 'FF+[+F-F-F]-[-F+F+F]'
        }
      },
      koch: {
        segments: 4,
        angle: 60,
        scaleFactor: 1/3,
        color: '#48dbfb'
      },
      mandelbrot: {
        maxIterations: 100,
        zoom: 1,
        offsetX: 0,
        offsetY: 0,
        color: '#1dd1a1'
      },
      dragon: {
        color: '#feca57',
        angle: 45,
        scaleFactor: 0.7,
        axiom: 'FX',
        rules: {
          'X': 'X+YF+',
          'Y': '-FX-Y'
        }
      },
      barnsley: {
        color: '#5f27cd',
        points: 10000,
        axiom: 'X',
        rules: {
          'X': 'F+[[X]-X]-F[-FX]+X',
          'F': 'FF'
        }
      }
    };
    
    return defaults[type];
  }
  
  updateAllEditors() {
    this.updateEditor('melody');
    this.updateEditor('bass');
    this.updateEditor('drums');
  }
  
  updateEditor(component) {
    const componentData = this[component];

    if (this.elements[`${component}Rules`]) {
      this.elements[`${component}Rules`].value = JSON.stringify(componentData.rules, null, 2);
    }

    if (this.elements[`${component}Axiom`] && componentData.rules.axiom !== undefined) {
      this.elements[`${component}Axiom`].value = componentData.rules.axiom;
    }

    if (this.elements[`${component}RulesJson`] && componentData.rules.rules) {
      this.elements[`${component}RulesJson`].value = JSON.stringify(componentData.rules.rules, null, 2);
    } else if (this.elements[`${component}RulesJson`]) {
      this.elements[`${component}RulesJson`].value = '';
    }
  }

  
  drawAllPreviews() {
    this.drawPreview('melody');
    this.drawPreview('bass');
    this.drawPreview('drums');
  }
  
  drawPreview(component) {
    const { ctx, canvas, type, rules, depth } = this[component];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    
    switch(type) {
      case 'tree':
        this.drawTree(ctx, canvas, rules, depth);
        break;
      case 'koch':
        this.drawKoch(ctx, canvas, rules, depth);
        break;
      case 'mandelbrot':
        this.drawMandelbrot(ctx, canvas, rules);
        break;
      case 'dragon':
        this.drawDragon(ctx, canvas, rules, depth);
        break;
      case 'barnsley':
        this.drawBarnsleyFern(ctx, canvas, rules);
        break;
      default:
        console.warn(`Unknown fractal type: ${type}`);
    }
    
    ctx.restore();
  }
  
  // Методы отрисовки фракталов (аналогичные оригинальным, но с передачей параметров)
  drawTree(ctx, canvas, rules, depth) {
    ctx.strokeStyle = rules.color || '#ff6b6b';
    ctx.lineWidth = 2;
    ctx.translate(canvas.width / 2, canvas.height);
    
    // Если есть аксиома и правила, используем L-систему
    if (rules.axiom && rules.rules) {
      this.drawLSystem(ctx, rules.axiom, rules.rules, depth, rules.angle * Math.PI / 180, rules.initLength || 80);
    } else {
      // Старый вариант для обратной совместимости
      this.drawBranch(
        ctx,
        rules.initLength || 80,
        depth,
        rules.angle * Math.PI / 180,
        rules.lengthFactor || 0.67,
        rules.branches || 2
      );
    }
  }

  drawLSystem(ctx, axiom, rules, depth, angle, length) {
    // Генерация строки по правилам L-системы
    let currentString = axiom;
    
    for (let i = 0; i < depth; i++) {
      let nextString = '';
      for (const char of currentString) {
        nextString += rules[char] || char;
      }
      currentString = nextString;
    }
    
    // Рисование
    const stack = [];
    let x = 0, y = 0;
    let currentAngle = -Math.PI / 2; // Начинаем рисовать вверх
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    for (const char of currentString) {
      switch(char) {
        case 'F':
          x += length * Math.cos(currentAngle);
          y += length * Math.sin(currentAngle);
          ctx.lineTo(x, y);
          break;
        case '+':
          currentAngle += angle;
          break;
        case '-':
          currentAngle -= angle;
          break;
        case '[':
          stack.push({ x, y, angle: currentAngle });
          break;
        case ']':
          const state = stack.pop();
          x = state.x;
          y = state.y;
          currentAngle = state.angle;
          ctx.moveTo(x, y);
          break;
        // Другие символы игнорируем
      }
    }
    
    ctx.stroke();
  }
  
  drawBranch(ctx, length, depth, angle, lengthFactor, branches) {
    if (depth <= 0) return;
    
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -length);
    ctx.stroke();
    
    ctx.translate(0, -length);
    
    for (let i = 0; i < branches; i++) {
      const branchAngle = angle * (i - (branches - 1) / 2);
      ctx.save();
      ctx.rotate(branchAngle);
      this.drawBranch(ctx, length * lengthFactor, depth - 1, angle, lengthFactor, branches);
      ctx.restore();
    }
  }
  
  drawKoch(ctx, canvas, rules, depth) {
    ctx.strokeStyle = rules.color || '#48dbfb';
    ctx.lineWidth = 1;

    const sideLength = Math.min(canvas.width, canvas.height) * 0.6;
    const height = sideLength * Math.sqrt(3) / 2;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const angleDeg = rules.angle || 60;
    const angleRad = angleDeg * Math.PI / 180;
    const scaleFactor = rules.scaleFactor || 1 / 3;

    const p1 = {
      x: centerX,
      y: centerY - (2 / 3) * height
    };
    const p2 = {
      x: centerX - sideLength / 2,
      y: centerY + (1 / 3) * height
    };
    const p3 = {
      x: centerX + sideLength / 2,
      y: centerY + (1 / 3) * height
    };

    this.drawKochSide(ctx, p1, p2, depth, angleRad, scaleFactor);
    this.drawKochSide(ctx, p2, p3, depth, angleRad, scaleFactor);
    this.drawKochSide(ctx, p3, p1, depth, angleRad, scaleFactor);
  }

  drawKochSide(ctx, p1, p2, depth, angleRad, scaleFactor) {
    if (depth === 0) {
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      return;
    }

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;

    const x1 = p1.x + dx * scaleFactor;
    const y1 = p1.y + dy * scaleFactor;

    const x2 = p1.x + dx * (1 - scaleFactor);
    const y2 = p1.y + dy * (1 - scaleFactor);

    const angle = Math.atan2(dy, dx);
    const length = Math.sqrt((dx * dx + dy * dy)) * scaleFactor;

    const xPeak = x1 + length * Math.cos(angle - angleRad);
    const yPeak = y1 + length * Math.sin(angle - angleRad);

    this.drawKochSide(ctx, p1, { x: x1, y: y1 }, depth - 1, angleRad, scaleFactor);
    this.drawKochSide(ctx, { x: x1, y: y1 }, { x: xPeak, y: yPeak }, depth - 1, angleRad, scaleFactor);
    this.drawKochSide(ctx, { x: xPeak, y: yPeak }, { x: x2, y: y2 }, depth - 1, angleRad, scaleFactor);
    this.drawKochSide(ctx, { x: x2, y: y2 }, p2, depth - 1, angleRad, scaleFactor);
  }
  
  drawMandelbrot(ctx, canvas, rules) {
    const { maxIterations, zoom, offsetX, offsetY, color } = rules;
    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.createImageData(width, height);
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
    ctx.putImageData(imageData, 0, 0);
  }
  
  drawDragon(ctx, canvas, rules, depth) {
    const { color, angle } = rules;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  
  // Если есть аксиома и правила, используем L-систему
  if (rules.axiom && rules.rules) {
    ctx.translate(canvas.width / 2, canvas.height / 2);
    this.drawLSystem(ctx, rules.axiom, rules.rules, depth, angle * Math.PI / 180, 10);
  } else {

      // L-система
      let axiom = "FX";
      for (let i = 0; i < depth; i++) {
        let next = "";
        for (let char of axiom) {
          if (char === "X") {
            next += "X+YF+";
          } else if (char === "Y") {
            next += "-FX-Y";
          } else {
            next += char;
          }
        }
        axiom = next;
      }

      // Рисование по L-системе
      const step = 10;
      let x = canvas.width / 2;
      let y = canvas.height / 2;
      let angle = 0;

      ctx.beginPath();
      ctx.moveTo(x, y);

      for (let char of axiom) {
        if (char === "F") {
          const rad = angle * Math.PI / 180;
          x += step * Math.cos(rad);
          y += step * Math.sin(rad);
          ctx.lineTo(x, y);
        } else if (char === "+") {
          angle += 90;
        } else if (char === "-") {
          angle -= 90;
        }
      }

      ctx.stroke();
    }
  }

  
  drawBarnsleyFern(ctx, canvas, rules) {
    if (rules.axiom && rules.rules) {
      // Режим L-системы
      ctx.translate(canvas.width / 2, canvas.height);
      this.drawLSystem(ctx, rules.axiom, rules.rules, rules.depth || 5, 25 * Math.PI / 180, 5);
    } else {
      // Оригинальный алгоритм Барнсли
      const { color, points } = rules;
      ctx.fillStyle = color;
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
        const plotX = canvas.width / 2 + x * 30;
        const plotY = canvas.height - y * 30;
        ctx.fillRect(plotX, plotY, 1, 1);
      }
    }
  }
  
  // Музыкальные методы
  playAll() {
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = 120;
    
    // Основная мелодия
    const melodyPattern = this.generateMusicPattern('melody');
    const melodyPart = new Tone.Part((time, note) => {
      this.melodySynth.triggerAttackRelease(note.note, note.duration, time);
    }, melodyPattern.map((note, i) => ({
      time: i * 0.5,
      note: this.getNoteForMelody(note),
      duration: "8n"
    })));
    melodyPart.loop = true;
    melodyPart.loopEnd = "4m";
    melodyPart.start(0);
    
    // Басовая линия
    const bassPattern = this.generateMusicPattern('bass');
    const bassPart = new Tone.Part((time, note) => {
      this.bassSynth.triggerAttackRelease(note.note, note.duration, time);
    }, bassPattern.map((note, i) => ({
      time: i * 1,
      note: this.getNoteForBass(note),
      duration: "4n"
    })));
    bassPart.loop = true;
    bassPart.loopEnd = "4m";
    bassPart.start(0);
    
    // Ударные
    const drumsPattern = this.generateMusicPattern('drums');
    const drumsPart = new Tone.Part((time, note) => {
      this.drumSynth.triggerAttackRelease(note.note, "8n", time, 0.5);
    }, drumsPattern.map((note, i) => ({
      time: i * 0.25,
      note: this.getDrumForPattern(note).note
    })));
    drumsPart.loop = true;
    drumsPart.loopEnd = "2m";
    drumsPart.start(0);
    
    Tone.Transport.start();
  }
  
  playComponent(component) {
    if (Tone.context.state !== 'running') {
      Tone.start();
    }
    const pattern = this.generateMusicPattern(component);
    const now = Tone.now();
    
    switch(component) {
      case 'melody':
        pattern.forEach((note, i) => {
          this.melodySynth.triggerAttackRelease(
            this.getNoteForMelody(note), 
            "8n", 
            now + i * 0.3
          );
        });
        break;
        
      case 'bass':
        pattern.forEach((note, i) => {
          this.bassSynth.triggerAttackRelease(
            this.getNoteForBass(note), 
            "4n", 
            now + i * 0.5
          );
        });
        break;
        
      case 'drums':
        pattern.forEach((note, i) => {
          const drum = this.getDrumForPattern(note);
          this.drumSynth.triggerAttackRelease(
            drum.note, 
            "8n", 
            now + i * 0.2,
            0.5 // velocity
          );
        });
        break;
    }
  }
  
  generateMusicPattern(component) {
    const { type, depth, rules } = this[component];
    const pattern = [];
    const complexity = depth * 2;

    switch(type) {
      case 'tree':
        const branches = rules.branches || 2;
        for (let i = 0; i < complexity * branches; i++) {
          pattern.push(i % 7);
        }
        break;

      case 'koch':
        const noteCount = 3 * Math.pow(4, depth); // количество отрезков в снежинке
        for (let i = 0; i < noteCount; i++) {
          // например, цикл по гамме вверх и вниз
          const value = i % 14;
          const noteIndex = value < 7 ? value : 13 - value; // пилообразно
          pattern.push(noteIndex);
        }
        break;

      case 'mandelbrot':
        const maxIterations = rules.maxIterations || 100;
        for (let i = 0; i < maxIterations; i++) {
          const normalized = Math.floor(i / maxIterations * 7);
          pattern.push(normalized);
        }
        break;

      case 'dragon':
        const dragonPoints = Math.pow(2, depth);
        for (let i = 0; i < dragonPoints; i++) {
          const angle = Math.sin(i * Math.PI / dragonPoints) * 7;
          pattern.push(Math.floor((angle + 7) % 7));
        }
        break;

      case 'barnsley':
        const points = rules.points || 10000;
        for (let i = 0; i < points / 1000; i++) {
          const randomNote = Math.floor(Math.random() * 7);
          pattern.push(randomNote);
        }
        break;

      default:
        console.warn('Неизвестный тип фрактала, музыка не будет сгенерирована.');
        break;
    }

    return pattern;
  }
  
  getNoteForMelody(index) {
    const scales = {
      major: ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"],
      minor: ["A3", "B3", "C4", "D4", "E4", "F4", "G4", "A4"],
      pentatonic: ["C4", "D4", "E4", "G4", "A4"]
    };
    return scales.major[index % scales.major.length];
  }
  
  getNoteForBass(index) {
    const bassNotes = ["C2", "D2", "E2", "F2", "G2", "A2", "B2", "C3"];
    return bassNotes[index % bassNotes.length];
  }
  
  getDrumForPattern(index) {
    const drums = [
      {note: "C2", type: "kick"}, 
      {note: "C3", type: "snare"}, 
      {note: "A2", type: "hihat"}
    ];
    return drums[index % drums.length];
  }
}

async function checkAuth() {
  const res = await fetch("/check_auth");
  const data = await res.json();
  if (!data.authenticated) {
    window.location.href = "/login";
  }
}

async function saveToDatabase() {
  await checkAuth(); // Добавляем проверку аутентификации
  
  if (typeof window.fractalSystem === 'undefined' || !window.fractalSystem) {
    alert("Пожалуйста, подождите, система ещё загружается...");
    return;
  }

  // Создаем чистые объекты без DOM-элементов
  const getCleanData = (component) => ({
    type: component.type,
    depth: component.depth,
    rules: component.rules
  });

  const payload = {
    title: prompt("Введите название композиции") || "Без названия",
    melody: getCleanData(window.fractalSystem.melody),
    bass: getCleanData(window.fractalSystem.bass),
    drums: getCleanData(window.fractalSystem.drums)
  };

  console.log("Отправка на сервер:", payload);

  try {
    const res = await fetch("/save_composition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Неизвестная ошибка сервера");
    }

    const data = await res.json();
    console.log("📥 Ответ сервера:", data);

    if (data.composition_id) {
      alert("🎵 Композиция сохранена!");
      compositionId = data.composition_id;
      loadSavedCompositions();
    }
  } catch (err) {
    console.error("Ошибка запроса:", err);
    alert("Ошибка сохранения: " + err.message);
  }
}

async function addToFavorites() {
  if (!compositionId) {
    alert("Сначала сохраните композицию в базу.");
    return;
  }

  console.log("Добавление в избранное:", compositionId);

  try {
    const res = await fetch("/add_favorite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ composition_id: compositionId })
    });

    const data = await res.json();
    console.log("Ответ от /add_favorite:", data);

    if (res.ok && data.success) {
      alert("Добавлено в избранное!");
      loadFavorites();
    } else {
      alert("Не удалось добавить в избранное: " + (data.error || "неизвестная ошибка"));
    }
  } catch (err) {
    console.error("Ошибка при добавлении в избранное:", err);
    alert("Ошибка связи с сервером");
  }
}


async function loadHistory() {
  const res = await fetch("/history");
  const history = await res.json();
  const container = document.getElementById("user-history");
  container.innerHTML = "";
  history.forEach(item => {
    const li = document.createElement("li");
    li.textContent = `[${item.time}] ${item.type}: ${item.data.title || JSON.stringify(item.data)}`;
    container.appendChild(li);
  });
}

async function loadSavedCompositions() {
  const res = await fetch("/my_compositions", {
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0"
    }
  });
  try {
    const res = await fetch("/my_compositions"); // Используем новый endpoint
    const compositions = await res.json();
    
    const container = document.getElementById("saved-list");
    container.innerHTML = "";

    if (compositions.length === 0) {
      container.innerHTML = "<p class='text-gray-400'>Нет сохранённых композиций.</p>";
      return;
    }

    compositions.forEach(comp => {
      const div = document.createElement("div");
      div.className = "bg-gray-700 p-3 rounded flex justify-between items-center";
      div.dataset.compositionId = comp.composition_id;
      
      div.innerHTML = `
        <span>${comp.title || `ID: ${comp.composition_id}`}</span>
        <div class="flex space-x-2">
          <button class="load-composition bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm">
            Загрузить
          </button>
          <button class="delete-composition bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm">
            Удалить
          </button>
        </div>
      `;
      
      container.appendChild(div);
      
      div.querySelector('.load-composition').addEventListener('click', () => {
        loadComposition(comp.composition_id);
      });
      
      div.querySelector('.delete-composition').addEventListener('click', () => {
        deleteComposition(comp.composition_id);
      });
    });
  } catch (err) {
    console.error("Ошибка загрузки композиций:", err);
    document.getElementById("saved-list").innerHTML = 
      "<p class='text-red-400'>Ошибка загрузки</p>";
  }
}

async function loadFavorites() {
  try {
    const res = await fetch("/favorites");
    const favorites = await res.json();
    const container = document.getElementById("favorites-list");
    container.innerHTML = "";

    if (favorites.length === 0) {
      container.innerHTML = "<p class='text-gray-400'>Нет избранных композиций.</p>";
      return;
    }

    favorites.forEach(item => {
      const div = document.createElement("div");
      div.className = "bg-pink-700 p-3 rounded flex justify-between items-center favorite-item";
      div.setAttribute("data-composition-id", item.composition_id); // Добавляем атрибут
      div.innerHTML = `
        <span>${item.title} (${new Date(item.created).toLocaleString()})</span>
        <div class="flex space-x-2">
          <button class="load-composition bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm">
            Загрузить
          </button>
          <button class="remove-favorite bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm">
            Убрать
          </button>
        </div>
      `;
      container.appendChild(div);
      
      // Обработчики событий
      div.querySelector('.load-composition').addEventListener('click', () => {
        loadComposition(item.composition_id);
      });
      
      div.querySelector('.remove-favorite').addEventListener('click', async () => {
        try {
          const res = await fetch("/add_favorite", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ composition_id: item.composition_id })
          });

          if (res.ok) {
            div.remove(); // Удаляем элемент из DOM
            checkEmptyLists(); // Проверяем пустые списки
            alert("Удалено из избранного!");
          } else {
            throw new Error("Не удалось удалить из избранного");
          }
        } catch (err) {
          console.error("Ошибка удаления из избранного:", err);
          alert("Ошибка: " + err.message);
        }
      });
    });
  } catch (err) {
    console.error("Ошибка загрузки избранных композиций:", err);
    container.innerHTML = "<p class='text-red-400'>Ошибка загрузки избранных композиций</p>";
  }
}

async function loadComposition(compositionId) {
  try {
    const res = await fetch(`/get_composition/${compositionId}`);
    if (!res.ok) {
      throw new Error(await res.text());
    }
    const composition = await res.json();
    
    if (window.fractalSystem) {
      // Загружаем данные в систему, сохраняя существующие canvas и ctx
      window.fractalSystem.melody = {
        ...window.fractalSystem.melody, // сохраняем существующие свойства
        type: composition.melody.type,
        depth: composition.melody.depth,
        rules: composition.melody.rules
      };
      
      window.fractalSystem.bass = {
        ...window.fractalSystem.bass,
        type: composition.bass.type,
        depth: composition.bass.depth,
        rules: composition.bass.rules
      };
      
      window.fractalSystem.drums = {
        ...window.fractalSystem.drums,
        type: composition.drums.type,
        depth: composition.drums.depth,
        rules: composition.drums.rules
      };
      
      // Обновляем UI
      window.fractalSystem.elements.melodyType.value = composition.melody.type;
      window.fractalSystem.elements.melodyDepth.value = composition.melody.depth;
      window.fractalSystem.elements.melodyDepthValue.textContent = composition.melody.depth;
      
      window.fractalSystem.elements.bassType.value = composition.bass.type;
      window.fractalSystem.elements.bassDepth.value = composition.bass.depth;
      window.fractalSystem.elements.bassDepthValue.textContent = composition.bass.depth;
      
      window.fractalSystem.elements.drumsType.value = composition.drums.type;
      window.fractalSystem.elements.drumsDepth.value = composition.drums.depth;
      window.fractalSystem.elements.drumsDepthValue.textContent = composition.drums.depth;
      
      // Обновляем редакторы и превью
      window.fractalSystem.updateAllEditors();
      window.fractalSystem.drawAllPreviews();
      
      alert(`Композиция "${composition.title}" успешно загружена!`);
    }
  } catch (err) {
    console.error("Ошибка загрузки композиции:", err);
    alert("Ошибка загрузки композиции: " + err.message);
  }
}

function setupTabs() {
  const savedTab = document.getElementById("tab-saved");
  const favoritesTab = document.getElementById("tab-favorites");
  const savedList = document.getElementById("saved-list");
  const favoritesList = document.getElementById("favorites-list");

  savedTab.addEventListener("click", () => {
    savedList.classList.remove("hidden");
    favoritesList.classList.add("hidden");
    savedTab.classList.add("bg-blue-600");
    favoritesTab.classList.remove("bg-blue-600");
  });

  favoritesTab.addEventListener("click", () => {
    favoritesList.classList.remove("hidden");
    savedList.classList.add("hidden");
    favoritesTab.classList.add("bg-blue-600");
    savedTab.classList.remove("bg-blue-600");
  });
}

function waitForElement(id, tries = 20) {
  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      const el = document.getElementById(id);
      if (el) {
        clearInterval(interval);
        resolve();
      }
      if (--tries <= 0) {
        clearInterval(interval);
        reject(`Элемент #${id} не найден`);
      }
    }, 100);
  });
}

async function deleteComposition(compositionId) {
  if (!confirm("Вы уверены, что хотите удалить эту композицию? Это действие нельзя отменить.")) {
    return;
  }

  try {
    const res = await fetch(`/delete_composition/${compositionId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Не удалось удалить композицию");
    }

    const data = await res.json();
    if (data.success) {
      // Удаляем элемент из DOM сразу, без перезагрузки всего списка
      const itemToRemove = document.querySelector(`[data-composition-id="${compositionId}"]`);
      if (itemToRemove) {
        itemToRemove.remove();
      }
      
      // Также проверяем и удаляем из избранного, если оно отображается
      const favoriteToRemove = document.querySelector(`.favorite-item[data-composition-id="${compositionId}"]`);
      if (favoriteToRemove) {
        favoriteToRemove.remove();
      }
      
      // Проверяем, не остались ли пустые списки
      checkEmptyLists();
      
      alert("Композиция успешно удалена!");
    }
  } catch (err) {
    console.error("Ошибка удаления композиции:", err);
    alert("Ошибка удаления: " + err.message);
  }
}

// Функция для проверки пустых списков
function checkEmptyLists() {
  const savedList = document.getElementById("saved-list");
  const favoritesList = document.getElementById("favorites-list");
  
  if (savedList.children.length === 0) {
    savedList.innerHTML = "<p class='text-gray-400'>Нет сохранённых композиций.</p>";
  }
  
  if (favoritesList && favoritesList.children.length === 0) {
    favoritesList.innerHTML = "<p class='text-gray-400'>Нет избранных композиций.</p>";
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  checkAuth();
  setupTabs();

  document.getElementById("save-to-db").addEventListener("click", saveToDatabase);
  document.getElementById("add-to-favorites").addEventListener("click", addToFavorites);

  try {
    await waitForElement("melody-type");
    window.fractalSystem = new FractalMusicSystem();
    
    // Теперь загружаем композиции после инициализации системы
    loadSavedCompositions();
    loadFavorites();
  } catch (e) {
    console.error(e);
  }
});