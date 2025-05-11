let playing = false;
let pattern;
let synth;
let part;

window.onload = function () {
  synth = new Tone.Synth().toDestination();

  const depthSlider = document.getElementById("depth");
  const depthLabel = document.getElementById("depth-value");
  const speedSelect = document.getElementById("speed");
  const speedLabel = document.getElementById("speed-value");

  depthSlider.oninput = () => {
    const depth = parseInt(depthSlider.value);
    depthLabel.textContent = depth;
    updateFractal(depth); // это вызывает рисование дерева
  };
  
  speedSelect.onchange = () => {
    speedLabel.textContent = speedSelect.value;
  };
};

function generateMelody(depth, type) {
  const scaleSelect = document.getElementById("scale");
  const scaleValues = scaleSelect.value.split(","); // Например: ["C4", "E4", "G4", "B4"]

  function generateTree(depth, currentNote = 0, melody = []) {
    if (depth === 0) return;
    melody.push(scaleValues[currentNote % scaleValues.length]);
    generateTree(depth - 1, currentNote + 1, melody);
    generateTree(depth - 1, currentNote + 2, melody);
    return melody;
  }

  function generateKoch(depth) {
    let pattern = [0];
    for (let d = 0; d < depth; d++) {
      const next = [];
      for (const note of pattern) {
        next.push(note, note + 1, note, note - 1, note); // Простейшая форма "снежинки"
      }
      pattern = next;
    }
    return pattern.map(i => scaleValues[Math.abs(i) % scaleValues.length]);
  }

  function generateMandelbrot(depth) {
    const width = 50, height = 30; // грубое приближение
    const maxIter = 20 + depth * 10;
    const melody = [];

    for (let px = 0; px < width; px++) {
      for (let py = 0; py < height; py++) {
        let a = (px - width / 2) * 4 / width;
        let b = (py - height / 2) * 4 / height;
        const ca = a, cb = b;
        let n = 0;
        while (n < maxIter) {
          const aa = a * a - b * b;
          const bb = 2 * a * b;
          a = aa + ca;
          b = bb + cb;
          if (a * a + b * b > 16) break;
          n++;
        }
        const noteIndex = n % scaleValues.length;
        melody.push(scaleValues[noteIndex]);
      }
    }

    return melody;
  }

  function generateDragon(depth) {
    const sequence = [0];
    for (let i = 0; i < depth; i++) {
      const reversed = sequence.slice().reverse().map(b => 1 - b);
      sequence.push(0, ...reversed);
    }
    return sequence.map(i => scaleValues[i % scaleValues.length]);
  }

  function generateBarnsley(depth) {
    let x = 0, y = 0;
    const melody = [];
    const steps = 500 + depth * 500;

    for (let i = 0; i < steps; i++) {
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
      const value = Math.floor((x * x + y * y) * 10);
      melody.push(scaleValues[Math.abs(value) % scaleValues.length]);
    }

    return melody;
  }



  switch (type) {
    case "tree": return generateTree(depth);
    case "koch": return generateKoch(depth);
    case "sierpinski": return generateSierpinski(depth);
    case "carpet": return generateCarpet(depth);
    case "mandelbrot": return generateMandelbrot(depth);
    case "dragon": return generateDragon(depth);
    case "barnsley": return generateBarnsley(depth);
    default: return [];
  }
}

function startMusic() {
  if (part) {
    part.stop();
    part.dispose();
  }

  const depth = parseInt(document.getElementById("depth").value);
  const type = document.getElementById("fractal-type").value;
  const speed = document.getElementById("speed").value;
  const scaleValues = document.getElementById("scale").value.split(",");

  const notes = generateMelody(depth, type, scaleValues);
  if (!notes || notes.length === 0) return;

  const synth = new Tone.Synth().toDestination();

  part = new Tone.Part((time, note) => {
    synth.triggerAttackRelease(note, "8n", time);
  }, notes.map((note, i) => [i * Tone.Time(speed), note]));

  part.start(0);
  Tone.Transport.start();
  playing = true;
}

function stopMusic() {
  if (playing && part) {
    part.stop();
    part.dispose();
    Tone.Transport.stop();
    playing = false;
  }
}


function generateFractalSequence(base, depth) {
  if (depth <= 0) return base;

  let expanded = [];
  base.forEach(note => {
    expanded.push(note, note);
  });

  return generateFractalSequence(expanded, depth - 1);
}
