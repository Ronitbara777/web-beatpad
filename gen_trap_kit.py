import wave
import struct
import math
import random
import os

SAMPLE_RATE = 44100
OUT_DIR = "frontend/public/sounds"

def write_wav(filename, samples):
    path = os.path.join(OUT_DIR, filename)
    with wave.open(path, 'w') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(SAMPLE_RATE)
        for s in samples:
            val = int(max(-1.0, min(1.0, s)) * 32767)
            f.writeframesraw(struct.pack('<h', val))

def gen_808_kick():
    # Long, deep decaying sine wave with initial pitch drop
    samples = []
    length = int(SAMPLE_RATE * 1.5)
    for i in range(length):
        t = i / SAMPLE_RATE
        env = math.exp(-t * 3)
        freq = 45 + 100 * math.exp(-t * 20)
        s = math.sin(2 * math.pi * freq * t) * env
        # Slight distortion
        s = math.tanh(s * 3) * 0.5
        samples.append(s)
    write_wav("01_808_Kick.wav", samples)

def gen_punchy_kick():
    samples = []
    length = int(SAMPLE_RATE * 0.4)
    for i in range(length):
        t = i / SAMPLE_RATE
        env = math.exp(-t * 15)
        freq = 55 + 200 * math.exp(-t * 40)
        s = math.sin(2 * math.pi * freq * t) * env
        s = math.tanh(s * 5) * 0.6
        samples.append(s)
    write_wav("02_Punchy_Kick.wav", samples)

def gen_snare():
    samples = []
    length = int(SAMPLE_RATE * 0.3)
    for i in range(length):
        t = i / SAMPLE_RATE
        env = math.exp(-t * 25)
        # Tone
        tone = math.sin(2 * math.pi * 200 * t) * math.exp(-t * 40)
        # Noise
        noise = (random.random() * 2 - 1) * env
        s = (tone * 0.4 + noise * 0.6)
        samples.append(s)
    write_wav("03_Snare.wav", samples)

def gen_clap():
    samples = []
    length = int(SAMPLE_RATE * 0.4)
    for i in range(length):
        t = i / SAMPLE_RATE
        # Multiple quick envelopes for the "clap" sound
        env = math.exp(-t * 20)
        if t < 0.01:
            env = math.exp(-t * 100)
        elif t < 0.02:
            env = math.exp(-(t-0.01) * 100)
        
        noise = (random.random() * 2 - 1) * env
        # Filter highpass slightly by adding a sine
        s = noise * 0.7
        samples.append(s)
    write_wav("04_Clap.wav", samples)

def gen_hihat_closed():
    samples = []
    length = int(SAMPLE_RATE * 0.1)
    for i in range(length):
        t = i / SAMPLE_RATE
        env = math.exp(-t * 60)
        noise = (random.random() * 2 - 1) * env
        samples.append(noise * 0.4)
    write_wav("05_HiHat_Closed.wav", samples)

def gen_hihat_open():
    samples = []
    length = int(SAMPLE_RATE * 0.5)
    for i in range(length):
        t = i / SAMPLE_RATE
        env = math.exp(-t * 8)
        noise = (random.random() * 2 - 1) * env
        samples.append(noise * 0.4)
    write_wav("06_HiHat_Open.wav", samples)

def gen_crash():
    samples = []
    length = int(SAMPLE_RATE * 1.5)
    for i in range(length):
        t = i / SAMPLE_RATE
        env = math.exp(-t * 3)
        noise = (random.random() * 2 - 1) * env
        # Mix of metallic oscillators and noise
        s1 = math.sin(2 * math.pi * 300 * t)
        s2 = math.sin(2 * math.pi * 800 * t)
        s = (noise * 0.7 + (s1*s2)*0.3) * env
        samples.append(s * 0.5)
    write_wav("07_Crash.wav", samples)

def gen_perc():
    samples = []
    length = int(SAMPLE_RATE * 0.2)
    for i in range(length):
        t = i / SAMPLE_RATE
        env = math.exp(-t * 30)
        freq = 800 + 400 * math.exp(-t * 50)
        s = math.sin(2 * math.pi * freq * t) * env
        samples.append(s * 0.7)
    write_wav("08_Perc.wav", samples)

# Melodic Synths in C Minor (C, Eb, G, Bb)
def gen_synth(filename, freq, duration, is_bass=False):
    samples = []
    length = int(SAMPLE_RATE * duration)
    for i in range(length):
        t = i / SAMPLE_RATE
        env = 1.0 if t < duration - 0.1 else math.exp(-(t - (duration - 0.1)) * 30)
        if t < 0.05:
            env = t / 0.05
        
        # Sawtooth wave approximation for gritty trap synth
        s = 0
        for harm in range(1, 10 if is_bass else 5):
            s += (1.0 / harm) * math.sin(2 * math.pi * freq * harm * t)
        
        # Lowpass filter effect
        s = s * env * (0.8 if is_bass else 0.4)
        s = math.tanh(s * 2) * 0.5
        samples.append(s)
    write_wav(filename, samples)

# Bass notes (808 style long notes)
gen_synth("09_Bass_C2.wav", 65.41, 1.5, True)
gen_synth("10_Bass_Eb2.wav", 77.78, 1.5, True)
gen_synth("11_Bass_G2.wav", 98.00, 1.5, True)
gen_synth("12_Bass_Bb2.wav", 116.54, 1.5, True)

# Pluck notes
gen_synth("13_Pluck_C4.wav", 261.63, 0.4, False)
gen_synth("14_Pluck_Eb4.wav", 311.13, 0.4, False)
gen_synth("15_Pluck_G4.wav", 392.00, 0.4, False)
gen_synth("16_Pluck_Bb4.wav", 466.16, 0.4, False)

print("Generated 16 trap samples!")

gen_808_kick()
gen_punchy_kick()
gen_snare()
gen_clap()
gen_hihat_closed()
gen_hihat_open()
gen_crash()
gen_perc()

