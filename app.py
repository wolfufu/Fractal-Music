from flask import Flask, render_template, request, send_file, jsonify
from midiutil import MIDIFile
import io
import random
import logging
from typing import Dict, Any

app = Flask(__name__)
app.logger.setLevel(logging.DEBUG)

# Конфигурация
SCALES = {
    "major": [0, 2, 4, 5, 7, 9, 11],
    "minor": [0, 2, 3, 5, 7, 8, 10],
    "pentatonic": [0, 2, 4, 7, 9],
    "dorian": [0, 2, 3, 5, 7, 9, 10],
    "phrygian": [0, 1, 3, 5, 7, 8, 10]
}

INSTRUMENTS = {
    "Electric Piano": 5,
    "Bright Piano": 1,
    "Synth Lead": 80,
    "Acoustic Bass": 32,
    "Synth Bass": 38,
    "Violin": 40,
    "Trumpet": 56,
    "Saxophone": 66,
    "Drums": 118,
    "Strings": 48
}

DEFAULT_SETTINGS = {
    "tempo": 120,
    "scale": "major",
    "root_note": 60,
    "instruments": {
        "melody": 5,    # Electric Piano
        "bass": 38,     # Synth Bass
        "drums": 118
    },
    "fractal_params": {
        "l_system_iter": 6,
        "chaos_level": 0.2,
        "drum_levels": 5
    },
    "effects": {
        "arpeggio": True,
        "reverb": False,
        "swing": 0.3,
        "humanize": 0.2,
        "melody_volume": 110,
        "bass_volume": 115,
        "drums_volume": 127
    }
}

def validate_settings(settings: Dict[str, Any]) -> Dict[str, Any]:
    """Проверка и нормализация настроек"""
    validated = {}
    
    try:
        # Темп
        validated['tempo'] = int(settings.get('tempo', DEFAULT_SETTINGS['tempo']))
        if not 40 <= validated['tempo'] <= 200:
            raise ValueError("Tempo must be between 40 and 200")

        # Гамма
        validated['scale'] = str(settings.get('scale', DEFAULT_SETTINGS['scale']))
        if validated['scale'] not in SCALES:
            raise ValueError(f"Invalid scale: {validated['scale']}")

        # Основная нота
        validated['root_note'] = int(settings.get('root_note', DEFAULT_SETTINGS['root_note']))
        if not 0 <= validated['root_note'] <= 127:
            raise ValueError("Root note must be between 0 and 127")

        # Инструменты
        validated['instruments'] = {}
        for instr in ['melody', 'bass', 'drums']:
            instr_val = settings.get('instruments', {}).get(instr, DEFAULT_SETTINGS['instruments'][instr])
            validated['instruments'][instr] = int(instr_val)
            if not 0 <= validated['instruments'][instr] <= 127:
                raise ValueError(f"Instrument {instr} must be between 0 and 127")

        # Фрактальные параметры
        validated['fractal_params'] = {}
        fractal_settings = settings.get('fractal_params', {})
        
        validated['fractal_params']['l_system_iter'] = int(
            fractal_settings.get('l_system_iter', DEFAULT_SETTINGS['fractal_params']['l_system_iter'])
        )
        if not 3 <= validated['fractal_params']['l_system_iter'] <= 10:
            raise ValueError("L-system iterations must be between 3 and 10")

        validated['fractal_params']['chaos_level'] = float(
            fractal_settings.get('chaos_level', DEFAULT_SETTINGS['fractal_params']['chaos_level'])
        )
        if not 0 <= validated['fractal_params']['chaos_level'] <= 1:
            raise ValueError("Chaos level must be between 0 and 1")

        validated['fractal_params']['drum_levels'] = int(
            fractal_settings.get('drum_levels', DEFAULT_SETTINGS['fractal_params']['drum_levels'])
        )
        if not 2 <= validated['fractal_params']['drum_levels'] <= 7:
            raise ValueError("Drum levels must be between 2 and 7")

        # Эффекты
        validated['effects'] = {}
        effects_settings = settings.get('effects', {})
        
        validated['effects']['arpeggio'] = bool(
            effects_settings.get('arpeggio', DEFAULT_SETTINGS['effects']['arpeggio'])
        )
        validated['effects']['reverb'] = bool(
            effects_settings.get('reverb', DEFAULT_SETTINGS['effects']['reverb'])
        )
        
        validated['effects']['swing'] = float(
            effects_settings.get('swing', DEFAULT_SETTINGS['effects']['swing'])
        )
        if not 0 <= validated['effects']['swing'] <= 1:
            raise ValueError("Swing must be between 0 and 1")

        validated['effects']['humanize'] = float(
            effects_settings.get('humanize', DEFAULT_SETTINGS['effects']['humanize'])
        )
        if not 0 <= validated['effects']['humanize'] <= 1:
            raise ValueError("Humanize must be between 0 and 1")
            
        # Громкость
        validated['effects']['melody_volume'] = int(
            effects_settings.get('melody_volume', DEFAULT_SETTINGS['effects']['melody_volume'])
        )
        if not 0 <= validated['effects']['melody_volume'] <= 127:
            raise ValueError("Melody volume must be between 0 and 127")
            
        validated['effects']['bass_volume'] = int(
            effects_settings.get('bass_volume', DEFAULT_SETTINGS['effects']['bass_volume'])
        )
        if not 0 <= validated['effects']['bass_volume'] <= 127:
            raise ValueError("Bass volume must be between 0 and 127")
            
        validated['effects']['drums_volume'] = int(
            effects_settings.get('drums_volume', DEFAULT_SETTINGS['effects']['drums_volume'])
        )
        if not 0 <= validated['effects']['drums_volume'] <= 127:
            raise ValueError("Drums volume must be between 0 and 127")

    except (TypeError, ValueError) as e:
        app.logger.error(f"Validation error: {str(e)}")
        raise ValueError(f"Invalid parameter: {str(e)}")

    return validated

def generate_rich_l_system(iterations: int, chaos: float) -> str:
    """Генератор сложных музыкальных паттернов"""
    rules = {
        'A': ['ABAC', 'AABC', 'BAAC', '[A]B'],
        'B': ['A', 'B', 'C', '[+A][-A]'],
        'C': ['BB', 'AA', '[-A][+A]', 'D'],
        'D': ['[+A]', '[-A]', 'B', 'C']
    }
    seq = 'A'
    for _ in range(iterations):
        new_seq = []
        for c in seq:
            if c in rules and random.random() > chaos:
                new_seq.append(random.choice(rules[c]))
            else:
                new_seq.append(c)
        seq = ''.join(new_seq)
    return seq

def generate_drum_pattern(levels: int) -> list:
    """Генератор мощных ударных"""
    pattern = [1, 0, 0, 1]
    for _ in range(levels):
        pattern = pattern + [0] + pattern
    return pattern

def generate_music(settings: Dict[str, Any]) -> io.BytesIO:
    """Генерация громкой и выразительной музыки"""
    try:
        midi = MIDIFile(3)
        midi.addTempo(0, 0, settings['tempo'])
        
        # Установка инструментов
        midi.addProgramChange(0, 0, 0, settings['instruments']['melody'])
        midi.addProgramChange(1, 0, 0, settings['instruments']['bass'])
        
        # Громкость треков
        melody_vol = settings['effects']['melody_volume']
        bass_vol = settings['effects']['bass_volume']
        drums_vol = settings['effects']['drums_volume']
        
        # Генерация мелодии
        scale = SCALES[settings['scale']]
        melody_notes = [settings['root_note'] + note for note in scale * 2]
        
        l_system_seq = generate_rich_l_system(
            settings['fractal_params']['l_system_iter'],
            settings['fractal_params']['chaos_level']
        )
        
        # Добавление выразительной мелодии
        for i, char in enumerate(l_system_seq[:64]):
            note_pitch = melody_notes[i % len(melody_notes)]
            
            # Динамическая громкость с акцентами
            velocity = melody_vol - 20 + (i % 4) * 15
            velocity = min(127, max(80, velocity))
            
            # Добавление человеческого фактора
            if settings['effects']['humanize'] > 0:
                velocity += random.randint(-10, 10) * settings['effects']['humanize']
                velocity = min(127, max(60, velocity))
            
            duration = 0.25 + (i % 3) * 0.1
            time = i * 0.25
            
            # Применение свинга
            if settings['effects']['swing'] > 0 and i % 2 == 1:
                time += 0.1 * settings['effects']['swing']
            
            midi.addNote(0, 0, note_pitch, time, duration, int(velocity))
            
            # Богатое арпеджио
            if settings['effects']['arpeggio'] and i % 4 == 0:
                chord_notes = [note_pitch, note_pitch + 4, note_pitch + 7]
                for j, chord_note in enumerate(chord_notes):
                    midi.addNote(0, 0, min(127, chord_note), 
                               time + 0.1 * (j + 1), 
                               duration * 0.8, 
                               max(60, velocity - 15))
        
        # Мощная басовая линия
        bass_notes = [
            settings['root_note'] - 12,
            settings['root_note'] - 10,
            settings['root_note'] - 8,
            settings['root_note'] - 5
        ]
        for step in range(0, 32):
            note = bass_notes[(step ** 2) % len(bass_notes)]
            velocity = bass_vol - 20 + (step % 4) * 10
            midi.addNote(1, 0, note, step * 0.25, 0.5, velocity)
        
        # Энергичные ударные
        drum_pattern = generate_drum_pattern(settings['fractal_params']['drum_levels'])
        for step in range(32):
            if drum_pattern[step % len(drum_pattern)]:
                # Kick (громкий)
                midi.addNote(2, 9, 35, step * 0.125, 0.1, drums_vol)
                
                # Snare на четных долях
                if step % 4 == 2:
                    midi.addNote(2, 9, 38, step * 0.125 + 0.05, 0.1, drums_vol - 10)
                
                # Hi-hat на восьмых
                if step % 2 == 1:
                    midi.addNote(2, 9, 42, step * 0.125, 0.05, drums_vol - 20)
        
        midi_data = io.BytesIO()
        midi.writeFile(midi_data)
        midi_data.seek(0)
        return midi_data
        
    except Exception as e:
        app.logger.error(f"Music generation error: {str(e)}", exc_info=True)
        raise RuntimeError("Failed to generate music")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/settings')
def get_settings():
    try:
        return jsonify({
            "success": True,
            "scales": list(SCALES.keys()),
            "instruments": INSTRUMENTS,
            "default_settings": DEFAULT_SETTINGS
        })
    except Exception as e:
        app.logger.error(f"Settings error: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Failed to load settings"
        }), 500

@app.route('/api/generate', methods=['POST'])
def generate():
    try:
        if not request.is_json:
            return jsonify({
                "success": False,
                "error": "Request must be JSON"
            }), 400
            
        request_data = request.get_json()
        if not request_data:
            return jsonify({
                "success": False,
                "error": "No data provided"
            }), 400
        
        settings = validate_settings(request_data.get('settings', {}))
        midi_data = generate_music(settings)
        
        return send_file(
            midi_data,
            mimetype='audio/midi',
            as_attachment=True,
            download_name='fractal_music.mid'
        )
        
    except ValueError as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 400
    except Exception as e:
        app.logger.error(f"API error: {str(e)}", exc_info=True)
        return jsonify({
            "success": False,
            "error": "Internal server error"
        }), 500

if __name__ == '__main__':
    app.run(debug=True)