import numpy as np
from PIL import Image, ImageDraw

class FractalGenerator:
    @staticmethod
    def generate_lsystem(iterations=3):
        """Генерация L-системы (Кривая дракона)"""
        rules = {'X': 'X+YF+', 'Y': '-FX-Y'}
        s = 'FX'
        for _ in range(iterations):
            s = ''.join([rules.get(c, c) for c in s])
        return s

    @staticmethod
    def lsystem_to_midi(instructions):
        """Преобразование L-системы в ноты"""
        notes = []
        angle = 0
        step = 0
        notes_map = {0: 60, 90: 64, 180: 67, 270: 71}  # C, E, G, B
        
        for cmd in instructions:
            if cmd == 'F':
                notes.append({'note': notes_map[angle % 360], 'duration': 0.5, 'time': step})
                step += 0.5
            elif cmd == '+':
                angle = (angle + 90) % 360
            elif cmd == '-':
                angle = (angle - 90) % 360
        return notes