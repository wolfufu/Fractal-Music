from midiutil import MIDIFile

class MidiGenerator:
    @staticmethod
    def create_midi(notes, filename):
        midi = MIDIFile(1)
        midi.addTempo(0, 0, 120)
        
        for i, note in enumerate(notes):
            midi.addNote(0, 0, note['note'], note['time'], note['duration'], 100)
        
        with open(filename, "wb") as f:
            midi.writeFile(f)