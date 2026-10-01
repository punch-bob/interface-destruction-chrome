/** Local synthesis: no audio downloads or extension permissions. */
export const createWeaponAudio = () => {
  let context: AudioContext | undefined;
  let output: GainNode | undefined;
  let noise: AudioBuffer | undefined;
  let muted = false;
  let voices = 0;
  const unlock = () => {
    try {
      if (!context) {
        context = new AudioContext();
        output = context.createGain();
        output.gain.value = muted ? 0 : 0.18;
        output.connect(context.destination);
        noise = context.createBuffer(
          1,
          context.sampleRate * 3,
          context.sampleRate,
        );
        const samples = noise.getChannelData(0);
        for (let i = 0; i < samples.length; i++)
          samples[i] = Math.random() * 2 - 1;
      }
      if (context.state === "suspended") void context.resume().catch(() => {});
    } catch {
      /* Audio may be disabled by browser policy; gameplay still works. */
    }
  };
  const tone = (
    from: number,
    to: number,
    duration: number,
    volume: number,
    type: OscillatorType = "sine",
    delay = 0,
  ) => {
    if (
      !context ||
      !output ||
      muted ||
      context.state !== "running" ||
      voices >= 32
    )
      return;
    const oscillator = context.createOscillator(),
      gain = context.createGain();
    const start = context.currentTime + delay;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(from, start);
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(10, to),
      start + duration,
    );
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    oscillator.connect(gain);
    gain.connect(output);
    voices++;
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
      voices--;
    };
    oscillator.start(start);
    oscillator.stop(start + duration + 0.01);
  };
  const hiss = (
    duration: number,
    frequency: number,
    volume: number,
    type: BiquadFilterType = "lowpass",
  ) => {
    if (
      !context ||
      !output ||
      !noise ||
      muted ||
      context.state !== "running" ||
      voices >= 32
    )
      return;
    const source = context.createBufferSource(),
      filter = context.createBiquadFilter(),
      gain = context.createGain();
    const now = context.currentTime;
    source.buffer = noise;
    filter.type = type;
    filter.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(output);
    voices++;
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
      voices--;
    };
    source.start(now, Math.random() * Math.max(0, noise.duration - duration));
    source.stop(now + duration);
  };
  type BedKind = "laser" | "flame" | "suction" | "blue" | "acid" | "drone";
  const textures = new Map<BedKind, AudioBuffer>();
  const beds = new Map<
    BedKind,
    { sources: (AudioBufferSourceNode | OscillatorNode)[]; gain: GainNode }
  >();
  const stopBed = (kind: BedKind) => {
    const bed = beds.get(kind);
    if (!bed || !context) return;
    bed.gain.gain.setTargetAtTime(0, context.currentTime, 0.025);
    bed.sources.forEach((source) => source.stop(context!.currentTime + 0.12));
    beds.delete(kind);
  };
  const stopBeds = () => [...beds.keys()].forEach(stopBed);
  const texture = (kind: BedKind) => {
    if (textures.has(kind)) return textures.get(kind)!;
    const buffer = context!.createBuffer(
      1,
      context!.sampleRate * 3,
      context!.sampleRate,
    );
    const samples = buffer.getChannelData(0),
      rate = context!.sampleRate;
    let low = 0,
      crack = 0,
      bubble = 0,
      phase = 0,
      frequency = 400;
    for (let i = 0; i < samples.length; i++) {
      const white = Math.random() * 2 - 1,
        time = i / rate;
      low += (white - low) * 0.06;
      if (kind === "flame") {
        if (Math.random() < 0.0007) crack = (Math.random() * 2 - 1) * 0.9;
        crack *= 0.985;
        samples[i] =
          (low * 1.2 + white * 0.15) * (0.8 + 0.2 * Math.sin(time * 27)) +
          crack;
      } else if (kind === "acid") {
        if (Math.random() < 0.00007) {
          bubble = 0.75;
          frequency = 350 + Math.random() * 950;
        }
        bubble *= 0.9995;
        frequency *= 0.9998;
        phase += (Math.PI * 2 * Math.max(70, frequency)) / rate;
        samples[i] =
          white * (0.16 + 0.09 * Math.sin(time * 23)) +
          Math.sin(phase) * bubble;
      } else if (kind === "drone") {
        samples[i] =
          white * 0.3 * (0.55 + 0.45 * Math.sin(time * Math.PI * 2 * 42)) +
          low * 0.25;
      } else samples[i] = white * (0.65 + 0.3 * Math.sin(time * 13));
    }
    textures.set(kind, buffer);
    return buffer;
  };
  const recipes: Record<
    BedKind,
    {
      cutoff: number;
      noise: number;
      tones: number[];
      volume: number;
      type: BiquadFilterType;
    }
  > = {
    laser: {
      cutoff: 1100,
      noise: 0.16,
      tones: [48, 97],
      volume: 0.55,
      type: "bandpass",
    },
    flame: {
      cutoff: 4800,
      noise: 1.1,
      tones: [],
      volume: 0.8,
      type: "lowpass",
    },
    suction: {
      cutoff: 650,
      noise: 0.65,
      tones: [39, 46],
      volume: 0.5,
      type: "bandpass",
    },
    blue: {
      cutoff: 950,
      noise: 0.7,
      tones: [32, 65],
      volume: 0.65,
      type: "bandpass",
    },
    drone: {
      cutoff: 2600,
      noise: 0.35,
      tones: [145, 151],
      volume: 0.38,
      type: "bandpass",
    },
    acid: {
      cutoff: 3200,
      noise: 0.7,
      tones: [],
      volume: 0.65,
      type: "lowpass",
    },
  };
  const ambience = (active: Partial<Record<BedKind, number>>) => {
    if (!context || !output || muted || context.state !== "running") return;
    for (const kind of Object.keys(recipes) as BedKind[]) {
      if (!active[kind]) {
        stopBed(kind);
        continue;
      }
      if (beds.has(kind) || voices >= 28) continue;
      const recipe = recipes[kind],
        gain = context.createGain();
      gain.gain.setValueAtTime(0, context.currentTime);
      gain.gain.setTargetAtTime(recipe.volume, context.currentTime, 0.04);
      gain.connect(output);
      const sources: (AudioBufferSourceNode | OscillatorNode)[] = [];
      const noiseSource = context.createBufferSource(),
        filter = context.createBiquadFilter(),
        mix = context.createGain();
      noiseSource.buffer = texture(kind);
      noiseSource.loop = true;
      filter.type = recipe.type;
      filter.frequency.value = recipe.cutoff;
      filter.Q.value = kind === "blue" ? 1.8 : 0.7;
      mix.gain.value = recipe.noise;
      noiseSource.connect(filter);
      filter.connect(mix);
      mix.connect(gain);
      sources.push(noiseSource);
      voices++;
      noiseSource.onended = () => {
        noiseSource.disconnect();
        filter.disconnect();
        mix.disconnect();
        voices--;
        gain.disconnect();
      };
      noiseSource.start();
      recipe.tones.forEach((frequency, index) => {
        const oscillator = context!.createOscillator(),
          toneGain = context!.createGain(),
          lowpass = context!.createBiquadFilter();
        oscillator.type =
          kind === "laser" || kind === "drone" ? "sawtooth" : "triangle";
        oscillator.frequency.value = frequency;
        oscillator.detune.value = index ? 9 : -5;
        lowpass.type = "lowpass";
        lowpass.frequency.value =
          kind === "laser" ? 520 : kind === "drone" ? 1500 : 180;
        toneGain.gain.value = index ? 0.25 : 0.45;
        oscillator.connect(lowpass);
        lowpass.connect(toneGain);
        toneGain.connect(gain);
        sources.push(oscillator);
        voices++;
        oscillator.onended = () => {
          oscillator.disconnect();
          lowpass.disconnect();
          toneGain.disconnect();
          voices--;
        };
        oscillator.start();
      });
      beds.set(kind, { sources, gain });
    }
  };
  return {
    unlock,
    ambience,
    setMuted: (value: boolean) => {
      muted = value;
      if (value) stopBeds();
      if (context && output)
        output.gain.setTargetAtTime(
          value ? 0 : 0.18,
          context.currentTime,
          0.015,
        );
    },
    charge: () => {
      tone(42, 110, 0.46, 0.65);
      tone(75, 420, 0.46, 0.28, "sawtooth");
      tone(150, 840, 0.46, 0.12, "triangle");
      hiss(0.45, 450, 0.35);
    },
    play: (weapon: number, gojo = false) => {
      if (!context || muted) return;
      if (gojo) {
        if (weapon === 10) {
          tone(180, 28, 1.3, 0.85);
          tone(95, 32, 0.95, 0.4, "triangle");
          hiss(1.15, 850, 0.65, "bandpass");
          tone(380, 65, 0.7, 0.18, "sawtooth");
        }
        if (weapon === 6) {
          tone(150, 24, 1.1, 1);
          tone(85, 22, 1.5, 0.65);
          hiss(1.25, 2200, 0.85);
          hiss(0.18, 6500, 0.65, "highpass");
          tone(320, 70, 0.55, 0.23, "sawtooth");
        }
        if (weapon === 8) {
          tone(105, 20, 2.4, 0.95);
          tone(160, 32, 1.6, 0.6, "triangle");
          tone(240, 48, 1.1, 0.26, "sawtooth");
          hiss(2.2, 1100, 0.9);
          hiss(0.3, 7500, 0.6, "highpass");
        }
        return;
      }
      switch (weapon) {
        case 1:
          tone(170, 45, 0.12, 0.55, "triangle");
          hiss(0.11, 5500, 0.65);
          break;
        case 2:
          tone(110, 25, 0.28, 0.65);
          hiss(0.32, 2800, 0.85);
          break;
        case 3:
          tone(190, 55, 0.07, 0.4, "triangle");
          hiss(0.065, 4200, 0.48);
          break;
        case 4:
          tone(130, 25, 0.4, 0.8);
          hiss(0.45, 5000, 0.8);
          break;
        case 5:
          // The continuous fire bed includes roar and irregular crackling.
          break;
        case 6:
          hiss(0.6, 1600, 0.65);
          tone(140, 35, 0.4, 0.45, "triangle");
          break;
        case 7:
          tone(180, 40, 0.19, 0.65);
          hiss(0.15, 900, 0.45);
          break;
        case 8:
          tone(135, 38, 0.4, 0.65);
          hiss(0.2, 1200, 0.25);
          break;
        case 9:
          tone(260, 65, 0.7, 0.5);
          hiss(0.7, 1000, 0.45);
          break;
        case 10:
          tone(450, 30, 0.8, 0.5);
          tone(460, 32, 0.8, 0.3);
          break;
        case 11:
          hiss(0.25, 3000, 0.35, "bandpass");
          tone(350, 90, 0.25, 0.2, "triangle");
          break;
      }
    },
    droneExplosion: () => {
      tone(125, 22, 0.85, 0.8);
      hiss(0.9, 2200, 0.75);
      hiss(0.12, 6500, 0.35, "highpass");
    },
    explosion: (nuclear = false) => {
      tone(nuclear ? 65 : 110, 18, nuclear ? 2.8 : 0.55, 0.7);
      hiss(nuclear ? 2.8 : 0.55, nuclear ? 650 : 1600, 0.7);
    },
    dispose: () => {
      stopBeds();
      if (context) void context.close().catch(() => {});
    },
  };
};
