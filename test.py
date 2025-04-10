import random
import numpy as np
from midiutil import MIDIFile

# ================== 1. L-СИСТЕМА С ВЕРОЯТНОСТНЫМИ ПРАВИЛАМИ ==================
def probabilistic_l_system(axiom, rules, iterations):
    current = axiom
    for _ in range(iterations):
        next_seq = []
        for symbol in current:
            if symbol in rules:
                next_seq.append(random.choice(rules[symbol]))
            else:
                next_seq.append(symbol)
        current = ''.join(next_seq)
    return current

# ================== 2. ГЕНЕРАЦИЯ MIDI С ЭФФЕКТАМИ ==================
def generate_fractal_music():
    # Создаем MIDI-файл с 3 треками (мелодия, бас, ударные)
    midi = MIDIFile(3)
    tempo = 100
    midi.addTempo(0, 0, tempo)
    
    # --- Настройки ---
    melody_notes = [60, 62, 64, 65, 67]  # C4, D4, E4, F4, G4
    bass_notes = [36, 38, 40]            # C2, D2, E2
    drum_hits = [35, 42, 46]             # Kick, Hi-Hat, Snare
    
    # --- 1. L-системная мелодия с арпеджио ---
    l_sequence = probabilistic_l_system(
        axiom="A",
        rules={"A": ["AB", "BA"], "B": ["A", "B"]},
        iterations=5
    )
    
    time = 0
    for i, symbol in enumerate(l_sequence):
        note_pitch = melody_notes[i % len(melody_notes)]
        duration = 0.25 if symbol == "A" else 0.5
        
        # Основная нота
        midi.addNote(0, 0, note_pitch, time, duration, 100)
        
        # Арпеджио (дополнительные ноты)
        if i % 2 == 0:
            midi.addNote(0, 0, note_pitch + 7, time + 0.1, duration * 0.8, 80)
        
        # Реверберация (эхо)
        for echo in range(1, 3):
            midi.addNote(0, 0, note_pitch, time + echo * 0.3, duration * 0.5, 90 // echo)
        
        time += duration
    
    # --- 2. Фрактальный бас ---
    for step in range(0, 16, 2):
        # Высота ноты зависит от step^2 mod 3
        bass_pitch = bass_notes[(step ** 2) % len(bass_notes)]
        midi.addNote(1, 0, bass_pitch, step, 1.5, 80)
    
    # --- 3. Ударные на основе Серпинского ---
    sierpinski = [1, 0, 1, 0, 0, 0, 1, 0, 1]  # Паттерн Серпинского
    for step in range(16):
        if sierpinski[step % len(sierpinski)]:
            # Kick на сильную долю, Hi-Hat на слабую
            drum_pitch = drum_hits[0] if step % 4 == 0 else drum_hits[1]
            midi.addNote(2, 9, drum_pitch, step * 0.25, 0.1, 100)
    
    # --- Сохранение ---
    with open("fractal_music.mid", "wb") as f:
        midi.writeFile(f)

# ================== ЗАПУСК ==================
if __name__ == "__main__":
    generate_fractal_music()
    print("MIDI-файл 'fractal_music.mid' создан!")