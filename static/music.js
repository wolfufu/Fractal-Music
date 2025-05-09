let playing = false;
let pattern;
let synth;

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
  const scaleValues = scaleSelect.value.split(","); // массив нот, например ["C4", "E4", "G4", "B4"]

  const notes = [];

  if (type === "tree") {
    for (let i = 0; i < depth * 2; i++) {
      notes.push(scaleValues[i % scaleValues.length]);
    }
  }

  else if (type === "koch") {
    for (let i = 0; i < Math.pow(2, depth); i++) {
      const index = Math.floor(Math.abs(Math.sin(i)) * scaleValues.length) % scaleValues.length;
      notes.push(scaleValues[index]);
    }
  }

  else if (type === "sierpinski") {
    for (let i = 0; i < Math.pow(2, depth); i++) {
      const index = (i & (i + 1)) === 0 ? 0 : i % scaleValues.length;
      notes.push(scaleValues[index]);
    }
  }

  else if (type === "carpet") {
    for (let i = 0; i < depth * 4; i++) {
      notes.push(scaleValues[i % scaleValues.length]);
    }
  }

  return notes;
}


function startMusic() {
  const synth = new Tone.Synth().toDestination();
  const now = Tone.now();
  
  const notes = generateMelody(currentDepth, currentType);
  if (!notes || notes.length === 0) return; // safety
  
  notes.forEach((note, i) => {
    synth.triggerAttackRelease(note, "8n", now + i * 0.3);
  });
}
  

function stopMusic() {
  if (playing && pattern) {
    Tone.Transport.stop();
    pattern.stop();
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
