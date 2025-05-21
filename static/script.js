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
    this.loadPresetsFromLocalStorage();
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
      presetsHistory: document.getElementById('presets-history')
    };
  }
  
  setupEventListeners() {
    // Melody controls
    this.elements.melodyType.addEventListener('change', (e) => {
      this.melody.type = e.target.value;
      this.melody.rules = this.getDefaultRules(this.melody.type);
      this.updateEditor('melody');
      this.drawPreview('melody');
    });
    
    this.elements.melodyApply.addEventListener('click', () => {
      try {
        this.melody.rules = JSON.parse(this.elements.melodyRules.value);
        this.drawPreview('melody');
      } catch (e) {
        alert(`Ошибка в формате JSON: ${e.message}`);
      }
    });
    
    this.elements.melodyReset.addEventListener('click', () => {
      this.melody.rules = this.getDefaultRules(this.melody.type);
      this.updateEditor('melody');
      this.drawPreview('melody');
    });
    
    this.elements.melodyDepth.addEventListener('input', (e) => {
      this.melody.depth = parseInt(e.target.value);
      this.elements.melodyDepthValue.textContent = this.melody.depth;
      this.drawPreview('melody');
    });
    
    // Bass controls
    this.elements.bassType.addEventListener('change', (e) => {
      this.bass.type = e.target.value;
      this.bass.rules = this.getDefaultRules(this.bass.type);
      this.updateEditor('bass');
      this.drawPreview('bass');
    });
    
    this.elements.bassApply.addEventListener('click', () => {
      try {
        this.bass.rules = JSON.parse(this.elements.bassRules.value);
        this.drawPreview('bass');
      } catch (e) {
        alert(`Ошибка в формате JSON: ${e.message}`);
      }
    });
    
    this.elements.bassReset.addEventListener('click', () => {
      this.bass.rules = this.getDefaultRules(this.bass.type);
      this.updateEditor('bass');
      this.drawPreview('bass');
    });
    
    this.elements.bassDepth.addEventListener('input', (e) => {
      this.bass.depth = parseInt(e.target.value);
      this.elements.bassDepthValue.textContent = this.bass.depth;
      this.drawPreview('bass');
    });
    
    // Drums controls
    this.elements.drumsType.addEventListener('change', (e) => {
      this.drums.type = e.target.value;
      this.drums.rules = this.getDefaultRules(this.drums.type);
      this.updateEditor('drums');
      this.drawPreview('drums');
    });
    
    this.elements.drumsApply.addEventListener('click', () => {
      try {
        this.drums.rules = JSON.parse(this.elements.drumsRules.value);
        this.drawPreview('drums');
      } catch (e) {
        alert(`Ошибка в формате JSON: ${e.message}`);
      }
    });
    
    this.elements.drumsReset.addEventListener('click', () => {
      this.drums.rules = this.getDefaultRules(this.drums.type);
      this.updateEditor('drums');
      this.drawPreview('drums');
    });
    
    this.elements.drumsDepth.addEventListener('input', (e) => {
      this.drums.depth = parseInt(e.target.value);
      this.elements.drumsDepthValue.textContent = this.drums.depth;
      this.drawPreview('drums');
    });
    
    // Playback controls
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
    
    this.presetsHistory.unshift(preset);
    this.savePresetsToLocalStorage();
    this.renderPresetsHistory();
    
    // Создаем временную кнопку для скачивания JSON
    this.downloadObjectAsJson(preset, `fractal_music_preset_${preset.id}`);
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

  // Рендер истории пресетов
  renderPresetsHistory() {
    this.elements.presetsHistory.innerHTML = '';
    
    if (this.presetsHistory.length === 0) {
      this.elements.presetsHistory.innerHTML = '<p class="text-gray-400">История пуста</p>';
      return;
    }
    
    this.presetsHistory.forEach(preset => {
      const presetElement = document.createElement('div');
      presetElement.className = 'bg-gray-700 p-3 rounded flex justify-between items-center';
      presetElement.innerHTML = `
        <div>
          <span class="font-medium">Пресет #${preset.id}</span>
          <span class="text-sm text-gray-400">${preset.date}</span>
        </div>
        <div class="space-x-2">
          <button class="load-preset bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm" data-id="${preset.id}">
            Загрузить
          </button>
          <button class="export-preset bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm" data-id="${preset.id}">
            Экспорт
          </button>
        </div>
      `;
      
      this.elements.presetsHistory.appendChild(presetElement);
      
      // Добавляем обработчики для новых кнопок
      presetElement.querySelector('.load-preset').addEventListener('click', () => {
        const presetToLoad = this.presetsHistory.find(p => p.id === preset.id);
        if (presetToLoad) this.loadPreset(presetToLoad);
      });
      
      presetElement.querySelector('.export-preset').addEventListener('click', () => {
        const presetToExport = this.presetsHistory.find(p => p.id === preset.id);
        if (presetToExport) {
          this.downloadObjectAsJson(presetToExport, `fractal_music_preset_${presetToExport.id}`);
        }
      });
    });
  }

  // Сохранение в LocalStorage
  savePresetsToLocalStorage() {
    localStorage.setItem('fractalMusicPresets', JSON.stringify(this.presetsHistory));
  }
  
  // Загрузка из LocalStorage
  loadPresetsFromLocalStorage() {
    const savedPresets = localStorage.getItem('fractalMusicPresets');
    if (savedPresets) {
      this.presetsHistory = JSON.parse(savedPresets);
      this.renderPresetsHistory();
    }
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
        color: '#ff6b6b'
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
        scaleFactor: 0.7
      },
      barnsley: {
        color: '#5f27cd',
        points: 10000
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
    this.elements[`${component}Rules`].value = JSON.stringify(this[component].rules, null, 2);
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
    
    this.drawBranch(
      ctx,
      rules.initLength || 80,
      depth,
      rules.angle * Math.PI / 180,
      rules.lengthFactor || 0.67,
      rules.branches || 2
    );
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
    const { color } = rules;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;

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

  
  drawBarnsleyFern(ctx, canvas, rules) {
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

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  new FractalMusicSystem();
});