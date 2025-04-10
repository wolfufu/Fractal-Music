let notes = [];
let synth;

async function generateFractal() {
    const type = document.getElementById('fractalType').value;
    const iterations = document.getElementById('iterations').value;
    
    try {
        const response = await fetch('http://localhost:5000/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ 
                type: type,
                iterations: parseInt(iterations)
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Успешный ответ:", data);
        
        // Обработка данных
        if (data.notes) {
            currentNotes = data.notes;
            drawVisualization();
        }
        
    } catch (error) {
        console.error('Ошибка при запросе:', error);
        alert('Ошибка при генерации фрактала: ' + error.message);
    }
}

function setup() {
    createCanvas(800, 400).parent('canvasContainer');
    synth = new Tone.PolySynth(Tone.Synth).toDestination();
    
    document.getElementById('generateBtn').addEventListener('click', generateFractal);
    document.getElementById('playBtn').addEventListener('click', playMusic);
    document.getElementById('downloadBtn').addEventListener('click', downloadMidi);
}

async function generateFractal() {
    const type = document.getElementById('fractalType').value;
    const iterations = document.getElementById('iterations').value;
    
    const response = await fetch('/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, iterations })
    });
    
    const data = await response.json();
    notes = data.notes;
    drawVisualization();
}

function drawVisualization() {
    background(240);
    stroke(0);
    noFill();
    
    beginShape();
    notes.forEach((note, i) => {
        const x = map(i, 0, notes.length, 50, width - 50);
        const y = map(note.note, 48, 84, height - 50, 50);
        vertex(x, y);
        circle(x, y, 10);
        text(noteToName(note.note), x, y - 15);
    });
    endShape();
}

function noteToName(midiNote) {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return notes[midiNote % 12] + Math.floor(midiNote / 12 - 1);
}

function playMusic() {
    if (Tone.context.state !== 'running') {
        Tone.start();
    }
    
    notes.forEach(note => {
        synth.triggerAttackRelease(
            Tone.Midi(note.note).toFrequency(),
            note.duration,
            Tone.now() + note.time
        );
    });
}

function downloadMidi() {
    window.open('http://localhost:5000/download/midi', '_blank');
}