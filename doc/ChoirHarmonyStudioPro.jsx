// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from "react";

/*****************************************
 * Choir Harmony Studio (Ultra)
 * — Advanced warm‑up & rehearsal companion
 * Includes smart warm-up generator, mix focus, upgraded audio engine & staff rendering
 *****************************************/

const BEATS_PER_BAR = 4;

const SONGS = [
  { id: 1, song: "Someone Like You", artist: "Adele", difficulty: "Easy", bars: 4, key: "A major", progression: "I–V–vi–IV", soprano: "Mi Re Mi Fa", alto: "Do Ti Do Do", tenor: "Sol Sol La La", bass: "Do Sol La Fa", lyricCue: '"Ne-ver mind, I’ll find…"', bpm: 135 },
  { id: 2, song: "Counting Stars", artist: "OneRepublic", difficulty: "Easy", bars: 4, key: "C# minor", progression: "vi–IV–I–V", soprano: "Mi Fa Mi Re", alto: "Do Do Do Ti", tenor: "La La Sol Sol", bass: "La Fa Do Sol", lyricCue: '"Lately, I’ve been, I’ve been…"', bpm: 122 },
  { id: 3, song: "Shallow", artist: "Lady Gaga & Bradley Cooper", difficulty: "Easy", bars: 4, key: "G major", progression: "I–V–vi–IV", soprano: "Mi Re Mi Fa", alto: "Do Ti Do Do", tenor: "Sol Sol La La", bass: "Do Sol La Fa", lyricCue: '"I’m off the deep end…"', bpm: 96 },
  { id: 4, song: "Shape of You", artist: "Ed Sheeran", difficulty: "Easy", bars: 4, key: "C# minor", progression: "vi–V–IV–V", soprano: "Mi Re Fa Re", alto: "Do Ti Do Ti", tenor: "La Sol La Sol", bass: "La Sol Fa Sol", lyricCue: '"I’m in love with the shape…"', bpm: 96 },
  { id: 5, song: "A Thousand Years", artist: "Christina Perri", difficulty: "Easy", bars: 4, key: "Bb major", progression: "I–V–vi–IV", soprano: "Mi Re Mi Fa", alto: "Do Ti Do Do", tenor: "Sol Sol La La", bass: "Do Sol La Fa", lyricCue: '"I have died every day…"', bpm: 139 },
  { id: 6, song: "Perfect", artist: "Ed Sheeran", difficulty: "Easy", bars: 4, key: "Ab major", progression: "I–vi–IV–V", soprano: "Mi Mi Fa Re", alto: "Do Do Do Ti", tenor: "Sol La La Sol", bass: "Do La Fa Sol", lyricCue: '"Dar-ling you look…"', bpm: 95 },
  { id: 7, song: "Hallelujah", artist: "Leonard Cohen", difficulty: "Easy", bars: 4, key: "C major", progression: "vi–IV–I–V", soprano: "Mi Fa Mi Re", alto: "Do Do Do Ti", tenor: "La La Sol Sol", bass: "La Fa Do Sol", lyricCue: '"Hal-le-lu-jah, Hal…"', bpm: 85 },
  { id: 8, song: "Let It Be", artist: "The Beatles", difficulty: "Easy", bars: 4, key: "C major", progression: "I–V–vi–IV", soprano: "Mi Re Mi Fa", alto: "Do Ti Do Do", tenor: "Sol Sol La La", bass: "Do Sol La Fa", lyricCue: '"Let it be, let…"', bpm: 72 },
];

const KEY_TO_SEMITONES = { C:0, "C#":1, Db:1, D:2, "D#":3, Eb:3, E:4, F:5, "F#":6, Gb:6, G:7, "G#":8, Ab:8, A:9, "A#":10, Bb:10, B:11 };
const MAJOR_SCALE = [0,2,4,5,7,9,11];
const NAT_MINOR_SCALE = [0,2,3,5,7,8,10];
const SOLFEGE_TO_DEGREE = { Do:0, Re:1, Mi:2, Fa:3, Sol:4, La:5, Ti:6 };

const STORAGE_KEY_SONGS = 'choir_custom_songs_v3';
const STORAGE_KEY_STATE = 'choir_prefs_v2';

function loadCustomSongs(){ try{ const raw = localStorage.getItem(STORAGE_KEY_SONGS); return raw ? JSON.parse(raw) : []; } catch { return []; } }
function saveCustomSongs(arr){ try{ localStorage.setItem(STORAGE_KEY_SONGS, JSON.stringify(arr)); } catch {} }
function savePrefs(obj){ try{ localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(obj)); } catch {} }
function loadPrefs(){ try{ const raw = localStorage.getItem(STORAGE_KEY_STATE); return raw ? JSON.parse(raw) : null; } catch { return null; } }

function csvParseLine(line, delim){ const out=[]; let cur='', q=false; for(let i=0;i<line.length;i++){ const ch=line[i]; if(ch==='"'){ if(q && line[i+1]==='"'){ cur+='"'; i++; } else { q=!q; } } else if(ch===delim && !q){ out.push(cur); cur=''; } else { cur+=ch; } } out.push(cur); return out; }
function parseSongsFromCSV(text){ const t=String(text||'').trim(); if(!t) return []; const delim=t.indexOf('\t')>=0?'\t':','; const lines=t.split(/\r?\n/).filter(Boolean); if(!lines.length) return []; const header=csvParseLine(lines[0],delim).map(h=>h.trim().toLowerCase()); const idx=(n)=> header.indexOf(n);
  const rows=lines.slice(1).map(ln=>csvParseLine(ln,delim)); let nextId=Math.max(0,...SONGS.map(s=>s.id))+1; const out=[]; rows.forEach(cols=>{ const get=(n)=>{ const i=idx(n); return i>=0? cols[i] : '' };
    const song=get('song')||get('title'); if(!song) return; const artist=get('artist')||''; const key=get('key')||'C major'; const soprano=get('soprano')||''; const alto=get('alto')||''; const tenor=get('tenor')||''; const bass=get('bass')||''; const bpm=Number(get('bpm')||get('tempo'))||100; const bars=Number(get('bars'))||4; const difficulty=get('difficulty')||'Easy'; const progression=get('progression')||''; const lyricCue=get('lyriccue')||get('lyric cue')||''; out.push({ id: nextId++, song, artist, difficulty, bars, key, progression, soprano, alto, tenor, bass, lyricCue, bpm }); }); return out; }

function parseKeyString(keyStr){
  const raw = String(keyStr||"C major").trim();
  const parts = raw.split(/\s+/);
  const tonicRaw = parts[0] || 'C';
  const isMinor = /minor/i.test(raw);
  const norm = tonicRaw.replace("♯","#").replace("♭","b");
  const base = KEY_TO_SEMITONES[norm] ?? 0;
  const preferSharps = /#/.test(norm) || (!/b/.test(norm) && ['C','G','D','A','E','B'].includes(norm.replace(/[^A-G]/g,'')));
  return { base, isMinor, label: raw, tonic: norm, preferSharps };
}
function degreeToSemitoneOffset(deg, isMinor){ const scale = isMinor ? NAT_MINOR_SCALE : MAJOR_SCALE; return scale[(((Number(deg) % 7) + 7) % 7)]; }
function midiToFreq(midi){ return 440 * Math.pow(2, (midi - 69) / 12); }
function solfegeToDegrees(s){ return String(s||"").trim().split(/\s+/).filter(Boolean).map(t => SOLFEGE_TO_DEGREE[t]).filter(v=>Number.isFinite(v)); }

const VOICE_COLORS = { S: '#ec4899', A: '#8b5cf6', T: '#3b82f6', B: '#10b981' };
const VOICE_LABELS = { S: 'Soprano', A: 'Alto', T: 'Tenor', B: 'Bass' };
const VOICE_RANGES = { S: [67, 81], A: [55, 74], T: [48, 66], B: [41, 61] };

function fitMidiToVoiceRange(voice, midi){ const r = VOICE_RANGES[voice]; if (!r) return midi; const [lo, hi] = r; while (midi < lo) midi += 12; while (midi > hi) midi -= 12; return Math.min(Math.max(midi, lo), hi); }

function createImpulseResponse(ctx, seconds=2.8, decay=2.8, reverse=false){ const rate=ctx.sampleRate; const length=rate*seconds; const impulse=ctx.createBuffer(2, length, rate); for(let channel=0; channel<2; channel++){ const data=impulse.getChannelData(channel); for(let i=0;i<length;i++){ const n = reverse ? length - i : i; data[i] = (Math.random()*2-1) * Math.pow(1 - n/length, decay); } } return impulse; }

function useAudioEngine(){
  const ctxRef = useRef(null);
  const masterRef = useRef(null);
  const busesRef = useRef({});
  const reverbInputRef = useRef(null);
  const delayInputRef = useRef(null);

  const INSTRUMENTS = {
    'Choir Aah': { attack: 0.06, decay: 0.25, sustain: 0.65, release: 0.7, osc: ['sawtooth', 'triangle'], bright: 1.0, vibratoHz: 5.5, lpCutoff: 1900, reverb: 0.5 },
    'Warm Pad': { attack: 0.2, decay: 0.35, sustain: 0.7, release: 1.6, osc: ['sine', 'triangle'], bright: 1.0005, vibratoHz: 4.2, lpCutoff: 2400, reverb: 0.7, chorus: { rate: 0.18, depth: 0.004, delay: 0.03, mix: 0.5 } },
    'Cathedral Organ': { attack: 0.02, decay: 0.05, sustain: 0.88, release: 1.4, osc: ['sine', 'sine'], bright: 1.0, vibratoHz: 6.5, lpCutoff: 0, reverb: 0.8 },
    'Studio Piano': { attack: 0.005, decay: 0.4, sustain: 0.5, release: 1.25, osc: ['triangle', 'triangle'], bright: 1.005, vibratoHz: 0.3, lpCutoff: 11000, reverb: 0.35, enhancer: true },
    'String Ensemble': { attack: 0.08, decay: 0.2, sustain: 0.75, release: 1.1, osc: ['sawtooth', 'sawtooth'], bright: 1.002, vibratoHz: 6.0, lpCutoff: 3200, reverb: 0.6, chorus: { rate: 0.24, depth: 0.006, delay: 0.025, mix: 0.65 } },
    'Celestial Bells': { attack: 0.01, decay: 0.9, sustain: 0.4, release: 1.8, osc: ['square', 'sine'], bright: 1.5, vibratoHz: 5.8, lpCutoff: 8000, reverb: 0.9, shimmer: true },
  } as const;

  const ensure = () => {
    if (!ctxRef.current){
      const Ctx = (window.AudioContext || (window).webkitAudioContext);
      const ctx = new Ctx();
      const master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);

      const reverbIn = ctx.createGain(); reverbIn.gain.value = 0.4;
      const convolver = ctx.createConvolver(); convolver.buffer = createImpulseResponse(ctx, 3.2, 3.5);
      reverbIn.connect(convolver);
      convolver.connect(master);

      const delayIn = ctx.createGain(); delayIn.gain.value = 0.18;
      const feedbackDelay = ctx.createDelay(); feedbackDelay.delayTime.value = 0.3;
      const feedbackGain = ctx.createGain(); feedbackGain.gain.value = 0.35;
      delayIn.connect(feedbackDelay);
      feedbackDelay.connect(feedbackGain);
      feedbackGain.connect(feedbackDelay);
      feedbackDelay.connect(master);

      ctxRef.current = ctx; masterRef.current = master; reverbInputRef.current = reverbIn; delayInputRef.current = delayIn;
      ['S','A','T','B'].forEach(v=>{ const g=ctx.createGain(); g.gain.value = 1; const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null; if(p) p.pan.value = (v==='S'? -0.25 : v==='A'? 0.25 : v==='T'? -0.12 : 0.12); (p||g).connect(master); g.connect(p||master); busesRef.current[v] = { gain:g, pan:p }; });
    }
    if (ctxRef.current?.state === 'suspended') ctxRef.current.resume?.();
    return ctxRef.current;
  };

  const stopAll = () => {
    const ctx = ctxRef.current; if (!ctx) return;
    try {
      const p = ctx.close();
      if (p && typeof p.then === 'function'){
        p.finally(() => { ctxRef.current = null; masterRef.current = null; busesRef.current = {}; reverbInputRef.current = null; delayInputRef.current = null; });
      } else {
        ctxRef.current = null; masterRef.current = null; busesRef.current = {}; reverbInputRef.current = null; delayInputRef.current = null;
      }
    } catch {
      ctxRef.current = null; masterRef.current = null; busesRef.current = {}; reverbInputRef.current = null; delayInputRef.current = null;
    }
  };

  const playNote = (when, duration, freq, volume = 0.3, instrumentName = 'Choir Aah', voice='S') => {
    const ctx = ensure(); const preset = INSTRUMENTS[instrumentName] || INSTRUMENTS['Choir Aah'];
    const osc1 = ctx.createOscillator(); const osc2 = ctx.createOscillator();
    osc1.type = preset.osc[0]; osc2.type = preset.osc[1];
    osc1.frequency.value = freq; osc2.frequency.value = freq * (preset.bright || 1);

    const amp = ctx.createGain();
    const attack=preset.attack, decay=preset.decay, sustain=preset.sustain*volume, release=Math.max(0.02,preset.release);
    amp.gain.setValueAtTime(0, when);
    amp.gain.linearRampToValueAtTime(volume, when+attack);
    amp.gain.linearRampToValueAtTime(sustain, when+attack+decay);
    amp.gain.setTargetAtTime(0, when+duration, release);

    const sourceMix = ctx.createGain();
    osc1.connect(sourceMix); osc2.connect(sourceMix);

    let finalInput = sourceMix;

    if (preset.enhancer){
      const drive = ctx.createWaveShaper();
      const curve = new Float32Array(1024);
      for(let i=0;i<1024;i++){ const x = i/1023*2-1; curve[i] = Math.tanh(1.5*x); }
      drive.curve = curve; drive.oversample = '4x';
      sourceMix.connect(drive); finalInput = drive;
    }

    if (preset.chorus){
      const { rate, depth, delay, mix } = preset.chorus;
      const delayNode = ctx.createDelay(); delayNode.delayTime.value = delay;
      const depthGain = ctx.createGain(); depthGain.gain.value = depth;
      const lfo = ctx.createOscillator(); lfo.frequency.value = rate;
      lfo.connect(depthGain); depthGain.connect(delayNode.delayTime);
      finalInput.connect(delayNode);
      const chorusMix = ctx.createGain(); chorusMix.gain.value = mix;
      delayNode.connect(chorusMix);
      chorusMix.connect(amp);
      lfo.start(when); lfo.stop(when + duration + release + 0.2);
    }

    let filter = null;
    if (preset.lpCutoff){ filter = ctx.createBiquadFilter(); filter.type='lowpass'; filter.frequency.value=preset.lpCutoff; finalInput.connect(filter); filter.connect(amp); }
    else { finalInput.connect(amp); }

    if (preset.shimmer){
      const pitchShift = ctx.createGain();
      const shimmerOsc = ctx.createOscillator(); shimmerOsc.type='sine'; shimmerOsc.frequency.value = freq * 2;
      shimmerOsc.connect(pitchShift);
      pitchShift.gain.value = volume * 0.12;
      pitchShift.connect(amp);
      shimmerOsc.start(when);
      shimmerOsc.stop(when + duration + release + 0.2);
    }

    if (preset.reverb && reverbInputRef.current){
      const wet = ctx.createGain(); wet.gain.value = preset.reverb;
      amp.connect(wet);
      wet.connect(reverbInputRef.current);
    }

    if (delayInputRef.current){
      const send = ctx.createGain(); send.gain.value = 0.12 * volume;
      amp.connect(send);
      send.connect(delayInputRef.current);
    }

    let lfo=null, lfoGain=null;
    if(preset.vibratoHz && preset.vibratoHz>0){ lfo = ctx.createOscillator(); lfo.frequency.value = preset.vibratoHz; lfoGain = ctx.createGain(); lfoGain.gain.value = 4.5; lfo.connect(lfoGain); lfoGain.connect(osc1.frequency); lfoGain.connect(osc2.frequency); lfo.start(when); lfo.stop(when + duration + release + 0.2); }

    const bus = busesRef.current[voice]?.gain || masterRef.current;
    amp.connect(bus);
    osc1.start(when); osc2.start(when);
    const stopAt = when + duration + release + 0.05;
    osc1.stop(stopAt); osc2.stop(stopAt);
  };

  const click = (when, strong) => { const ctx = ensure(); const o = ctx.createOscillator(); const g = ctx.createGain(); o.type='square'; o.frequency.value = strong ? 2000 : 1200; g.gain.value = strong ? 0.2 : 0.12; o.connect(g); g.connect(masterRef.current); o.start(when); o.stop(when+0.05); };

  return { ensure, stopAll, playNote, click, INSTRUMENTS, busesRef };
}

function normalizeActiveVoices(val){ const map = new Map(); if (!val) return map; if (val instanceof Map) { val.forEach((set, midi) => { const voices = new Set(); if (set && typeof set === 'object') { (Array.from(set)).forEach(v => { if (v==='S'||v==='A'||v==='T'||v==='B') voices.add(v); }); } if (voices.size) map.set(Number(midi), voices); }); return map; } if (val instanceof Set) { Array.from(val).forEach((m) => { if (Number.isFinite(m)) map.set(Number(m), new Set()); }); return map; } if (Array.isArray(val)) { val.forEach((m) => { if (Number.isFinite(m)) map.set(Number(m), new Set()); }); } return map; }

function ChoirPiano({ activeNotes, onKeyDown }){
  const active = normalizeActiveVoices(activeNotes);
  const start = 32, end = 84; const isBlackPC = pc => [1,3,6,8,10].includes(pc);
  const whites = []; const blacks = []; const whiteW = 28, whiteH = 142; const blackW = 18, blackH = 90; let whiteIndex = 0; let lastWhiteIndex = -1;
  for (let m=start; m<=end; m++){ const pc = m % 12; const isBlack = isBlackPC(pc); const voices = active.get(m) || new Set(); const label = (m % 12 === 0) ? `C${Math.floor(m/12)-1}` : ''; if (!isBlack){ const x = whiteIndex * whiteW; whites.push({ m, x, label, voices }); lastWhiteIndex = whiteIndex; whiteIndex++; } else if (lastWhiteIndex >= 0){ const x = (lastWhiteIndex + 0.66) * whiteW - blackW/2; blacks.push({ m, x, voices }); } }
  const totalW = whites.length * whiteW;
  const ringStyleForVoices = (voices) => { const arr = Array.from(voices || []); if (arr.length === 1) return { boxShadow: `0 0 0 4px ${VOICE_COLORS[arr[0]]}` }; if (arr.length > 1) return { boxShadow: `0 0 0 4px rgba(14,116,144,0.9)` }; return {}; };
  const VoiceBadges = ({ voices }) => { const arr = Array.from(voices || []); if (!arr.length) return null; return (<div className="absolute bottom-1 right-1 flex gap-0.5">{arr.map(v => (<span key={v} title={v} style={{ background: VOICE_COLORS[v], width: 8, height: 8, borderRadius: 9999, display:'inline-block' }} />))}</div> ); };
  const handleDown = (midi) => { if (typeof onKeyDown === 'function') onKeyDown(midi); };
  return (
    <div className="w-full">
      <div className="overflow-x-auto rounded-2xl bg-gradient-to-b from-neutral-100 to-neutral-200 p-3 shadow-inner">
        <div className="relative" style={{ width: totalW, height: whiteH }}>
          {whites.map(k => (
            <div key={`w-${k.m}`} className="absolute bottom-0 border rounded-b-md select-none cursor-pointer active:brightness-95 transition-transform duration-75" role="button" aria-label={`Key ${k.label || k.m}`} onMouseDown={() => handleDown(k.m)} onTouchStart={(e) => { e.preventDefault(); handleDown(k.m); }} style={{ left:k.x, width:whiteW, height:whiteH, background:'#fff', borderColor:'#d4d4d8', ...ringStyleForVoices(k.voices) }}>
              {k.label && <div className="text-[10px] text-neutral-500 absolute bottom-1 left-1">{k.label}</div>}
              <VoiceBadges voices={k.voices} />
            </div>
          ))}
          {blacks.map(k => (
            <div key={`b-${k.m}`} className="absolute rounded-b-sm border select-none cursor-pointer active:brightness-90" role="button" aria-label={`Black key ${k.m}`} onMouseDown={() => handleDown(k.m)} onTouchStart={(e) => { e.preventDefault(); handleDown(k.m); }} style={{ left:k.x, top:0, width:blackW, height:blackH, background:'#0a0a0a', borderColor:'#111827', zIndex:10, ...ringStyleForVoices(k.voices) }} />
          ))}
        </div>
      </div>
      <div className="text-xs opacity-60 mt-2">Range: C2–C6. Outline & dots indicate active <b>voice(s)</b>. Click/tap to audition.</div>
    </div>
  );
}

const KEY_SIGNATURE_ORDER = {
  treble: {
    sharps: ['F', 'C', 'G', 'D', 'A', 'E', 'B'],
    flats: ['B', 'E', 'A', 'D', 'G', 'C', 'F'],
    positions: {
      F: -1, C: 1, G: -2.5, D: 0.5, A: -3.8, E: -1.8, B: 0.2,
      Bflat: 0, Eflat: -2, Aflat: -3.5, Dflat: -1.5, Gflat: -3, Cflat: -0.8, Fflat: -2.2,
    }
  },
  bass: {
    sharps: ['F', 'C', 'G', 'D', 'A', 'E', 'B'],
    flats: ['B', 'E', 'A', 'D', 'G', 'C', 'F'],
    positions: {
      F: 2.6, C: 0.8, G: 3.6, D: 1.5, A: 4.3, E: 2.4, B: 0.5,
      Bflat: 2.4, Eflat: 0.3, Aflat: 2.1, Dflat: 0.1, Gflat: 1.9, Cflat: -0.1, Fflat: 1.7,
    }
  }
};

const KEY_SIGNATURE_LOOKUP = {
  major: { 0: {acc:0, type:'neutral'}, 7:{acc:1, type:'sharp'}, 2:{acc:2, type:'sharp'}, 9:{acc:3, type:'sharp'}, 4:{acc:4, type:'sharp'}, 11:{acc:5, type:'sharp'}, 6:{acc:6, type:'sharp'}, 1:{acc:7, type:'sharp'}, 5:{acc:1, type:'flat'}, 10:{acc:2, type:'flat'}, 3:{acc:3, type:'flat'}, 8:{acc:4, type:'flat'} },
  minor: { 9:{acc:0, type:'neutral'}, 4:{acc:1, type:'sharp'}, 11:{acc:2, type:'sharp'}, 6:{acc:3, type:'sharp'}, 1:{acc:4, type:'sharp'}, 8:{acc:5, type:'sharp'}, 3:{acc:6, type:'sharp'}, 10:{acc:1, type:'flat'}, 5:{acc:2, type:'flat'}, 0:{acc:3, type:'flat'}, 7:{acc:4, type:'flat'}, 2:{acc:5, type:'flat'} }
};

function resolveKeySignature(info){
  const table = info.isMinor ? KEY_SIGNATURE_LOOKUP.minor : KEY_SIGNATURE_LOOKUP.major;
  const entry = table[info.base] || { acc:0, type:'neutral' };
  const preferSharps = info.preferSharps;
  if (entry.acc === 0) return { count:0, type:'neutral' };
  if (!entry.type || entry.type==='neutral'){
    return { count: entry.acc, type: preferSharps ? 'sharp' : 'flat' };
  }
  return { count: entry.acc, type: entry.type };
}

function PartStaff({ voice='S', notesText='', bars=4, keyInfo, transpose=0, highlightIndex=-1 }){
  const width = 360; const height = 150; const marginX = 6; const gap = 8; const top = 22; const lineYs = [0,1,2,3,4].map(i => top + i*gap); const NOTE_RX = 5.2;
  const isTreble = voice === 'S' || voice === 'A'; const clefChar = isTreble ? '𝄞' : '𝄢';
  const pxPerSemitone = 3.6; const anchorMidi = isTreble ? 64 : 43; const anchorY = top + 2*gap; const yForMidi = (m) => anchorY - (m - anchorMidi) * pxPerSemitone;
  const tokens = String(notesText||'').trim().split(/\s+/).filter(Boolean); const degrees = (tokens.length ? tokens : ['Do']).map(t => SOLFEGE_TO_DEGREE[t] ?? 0); const baseOct = { S:5, A:4, T:3, B:2 }; const MIDI_C4 = 60; const safeKey = keyInfo || { base:0, isMinor:false };
  const makeMidi = (deg, vv) => { const off = degreeToSemitoneOffset(deg, !!safeKey.isMinor); const raw = MIDI_C4 + (safeKey.base||0) + off + ((baseOct[vv]-4)*12) + (transpose||0); return fitMidiToVoiceRange(vv, raw); };
  const midis = Array.from({ length: Math.max(1,bars) }, (_, i) => makeMidi(degrees[i % degrees.length], voice));
  const n = Math.max(1, midis.length); const leftAfterClef = 44; const left = marginX + leftAfterClef + 6; const right = width - marginX - 18; const span = Math.max(1, right - left);
  const xFor = (i) => left + (span * (n === 1 ? 0.5 : i / (n - 1)));
  const drawLedger = (y) => { const out = []; const staffTop = top, staffBottom = top + gap*4; for (let ly = staffTop - gap; y < staffTop - gap/2; ly -= gap) { out.push(ly); if (ly < y - 60) break; } for (let ly = staffBottom + gap; y > staffBottom + gap/2; ly += gap) { out.push(ly); if (ly > y + 60) break; } return out; };

  const signature = resolveKeySignature(safeKey);
  const measureWidth = span / Math.max(1, bars);
  const highlightRect = (idx) => {
    if (idx === highlightIndex){ return <rect key={`hl-${idx}`} x={left + idx*measureWidth - measureWidth*0.02} y={top-12} width={measureWidth*1.04} height={gap*4 + 24} rx={8} fill={`rgba(59,130,246,0.12)`} />; }
    return null;
  };

  const accidentals = [];
  if (signature.count){
    const order = signature.type === 'flat' ? KEY_SIGNATURE_ORDER[isTreble? 'treble':'bass'].flats : KEY_SIGNATURE_ORDER[isTreble? 'treble':'bass'].sharps;
    const posLookup = KEY_SIGNATURE_ORDER[isTreble? 'treble':'bass'].positions;
    for(let i=0;i<signature.count;i++){
      const letter = order[i];
      const key = signature.type === 'flat' ? `${letter}flat` : letter;
      const offset = posLookup[key];
      accidentals.push({ letter, offset });
    }
  }

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" className="w-full mt-1">
      <defs>
        <linearGradient id={`grad-${voice}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
          <stop offset="100%" stopColor="rgba(248,250,252,0.5)" />
        </linearGradient>
      </defs>
      <rect x={marginX} y={top-16} width={width - marginX*2} height={gap*4 + 28} rx={12} fill={`url(#grad-${voice})`} stroke="rgba(209,213,219,0.6)" strokeWidth={1} />
      {Array.from({length:bars}).map((_,idx)=>highlightRect(idx))}
      {lineYs.map((y,i)=> (<line key={i} x1={marginX+4} x2={width-marginX-4} y1={y} y2={y} stroke="#bfc3ce" strokeWidth={1} />))}
      <text x={marginX+12} y={top + gap*3.0} fontSize="24" fill="#111">{clefChar}</text>
      <text x={marginX+10} y={top + gap*4.9} fontSize="8" fill="#6b7280">{isTreble ? 'Treble' : 'Bass'}</text>
      {accidentals.map((acc, idx) => (
        <text key={`acc-${idx}`} x={marginX + 36 + idx*10} y={top + gap*2 + (acc.offset||0)} fontSize="16" fill="#111">{signature.type === 'flat' ? '♭' : '♯'}</text>
      ))}
      <text x={width - marginX - 6} y={top - 6} textAnchor="end" fontSize="10" fill="#64748b">{safeKey.label}</text>
      {Array.from({length:bars}).map((_,i)=> (
        <g key={`measure-${i}`}>
          <line x1={left + i*measureWidth} x2={left + i*measureWidth} y1={top-10} y2={top+gap*4+10} stroke="rgba(148,163,184,0.35)" strokeWidth={1}/>
          <text x={left + i*measureWidth + measureWidth/2} y={top-14} textAnchor="middle" fontSize="9" fill="#475569">{`Bar ${i+1}`}</text>
        </g>
      ))}
      {midis.map((m,i)=>{
        const x = xFor(i); const y = yForMidi(m); const rx = NOTE_RX, ry = 3.9; const ledgerYs = drawLedger(y); const lyric = String(tokens[i % (tokens.length || 1)]||''); const isNow = i===highlightIndex; const stemUp = y > lineYs[2]; const stemLength = 26;
        return (
          <g key={`n-${i}`}>
            {ledgerYs.map((ly,idx)=>(<line key={`led-${i}-${idx}`} x1={x-14} x2={x+14} y1={ly} y2={ly} stroke="#0f172a" strokeWidth={1}/>))}
            <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={isNow? VOICE_COLORS[voice] : '#fff'} stroke="#0f172a" strokeWidth={1.4} />
            <line x1={x + (stemUp ? rx : -rx)} y1={y} x2={x + (stemUp ? rx : -rx)} y2={y + (stemUp ? -stemLength : stemLength)} stroke="#0f172a" strokeWidth={1.2} />
            <text x={x} y={Math.max(y, top + gap*4) + 14} textAnchor="middle" fontSize="9" fill="#0f172a">{lyric}</text>
          </g>
        );
      })}
    </svg>
  );
}

function Toggle({label, checked, onChange}){
  return (
    <label className="inline-flex items-center gap-2 select-none text-sm">
      <span className="relative inline-flex items-center h-6 w-11 cursor-pointer">
        <input type="checkbox" className="sr-only" checked={checked} onChange={e=>onChange(e.target.checked)} />
        <span className={`absolute inset-0 rounded-full transition ${checked? 'bg-emerald-500':'bg-neutral-300'}`}></span>
        <span className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked? 'translate-x-5':''}`}></span>
      </span>
      <span>{label}</span>
    </label>
  );
}

function Slider({label, value, min=0, max=100, onChange, rightLabel}){
  return (
    <div>
      <div className="flex justify-between text-xs mb-1"><span>{label}</span><span className="font-medium">{rightLabel ?? `${Math.round(value)}%`}</span></div>
      <input type="range" min={min} max={max} value={value} onChange={e=>onChange(Number(e.target.value))} className="w-full" />
    </div>
  );
}

function PrettySelect({label, value, onChange, options}){
  return (
    <label className="text-sm font-medium block">
      <span className="text-xs uppercase tracking-wide opacity-60">{label}</span>
      <select className="mt-1 w-full border rounded-xl p-2 bg-white/70 dark:bg-neutral-900" value={value} onChange={e=>onChange(e.target.value)}>
        {options.map(opt=> <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </label>
  );
}

function FocusSelector({ value, onChange }){
  const options = [
    { id: 'ALL', label: 'Whole Choir' },
    { id: 'S', label: 'Soprano Focus' },
    { id: 'A', label: 'Alto Focus' },
    { id: 'T', label: 'Tenor Focus' },
    { id: 'B', label: 'Bass Focus' },
  ];
  return (
    <div className="bg-white/70 dark:bg-neutral-900 rounded-xl p-3 border border-neutral-200 dark:border-neutral-800">
      <div className="text-xs uppercase opacity-60">Focus Mixer</div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
        {options.map(opt => (
          <button key={opt.id} onClick={()=>onChange(opt.id)} className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${value===opt.id? 'bg-emerald-500 text-white shadow':'bg-neutral-200 dark:bg-neutral-700'}`}>{opt.label}</button>
        ))}
      </div>
      <p className="text-xs opacity-70 mt-2">Boost a section during playback while gently attenuating the others for sectional rehearsals.</p>
    </div>
  );
}

function WarmupPlanner({ onPlay, onPreview, keyInfo }) {
  const [length, setLength] = useState(4);
  const [pattern, setPattern] = useState('Arpeggio');
  const [direction, setDirection] = useState('Ascend');
  const [includeChromatic, setIncludeChromatic] = useState(false);

  const degrees = useMemo(()=>{
    const base = [0,2,4,5,7,9,11];
    if(pattern==='Arpeggio') return [0,2,4,2];
    if(pattern==='Fifths') return [0,4,0,4];
    if(pattern==='Seventh Prep') return [0,2,4,6];
    if(pattern==='Pentatonic') return [0,2,4,7,9];
    return base;
  }, [pattern]);

  const rendered = useMemo(()=>{
    let seq = [...degrees];
    if(direction==='Descend'){ seq = [...seq].reverse(); }
    let repeated = [];
    for(let i=0;i<length;i++){ repeated = repeated.concat(seq); }
    if(includeChromatic){ repeated = repeated.flatMap((deg, idx)=> idx%2===1? [deg, (deg+1)%12]: [deg]); }
    return repeated;
  }, [degrees, length, direction, includeChromatic]);

  const solfege = rendered.map(deg => Object.keys(SOLFEGE_TO_DEGREE).find(k => SOLFEGE_TO_DEGREE[k] === ((deg%7+7)%7)) || 'Do');

  return (
    <div className="bg-white/80 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-semibold text-base">Warm-up Designer</h3>
        <div className="flex gap-2 text-xs">
          <button className="px-3 py-1 rounded-xl bg-emerald-600 text-white" onClick={()=>onPlay(rendered)}>Play Warm-up</button>
          <button className="px-3 py-1 rounded-xl bg-neutral-200 dark:bg-neutral-700" onClick={()=>onPreview(rendered)}>Preview Notes</button>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-3 text-sm">
        <PrettySelect label="Pattern" value={pattern} onChange={setPattern} options={["Arpeggio","Scale","Fifths","Seventh Prep","Pentatonic"]} />
        <PrettySelect label="Direction" value={direction} onChange={setDirection} options={["Ascend","Descend"]} />
        <div>
          <Slider label="Repetitions" value={length} min={1} max={6} onChange={setLength} rightLabel={`${length}x`} />
          <Toggle label="Add Chromatic Passing" checked={includeChromatic} onChange={setIncludeChromatic} />
        </div>
        <div className="bg-neutral-100 dark:bg-neutral-800 rounded-xl p-3 text-xs space-y-1">
          <div className="uppercase tracking-wide opacity-60">In {keyInfo?.label || 'C major'}</div>
          <div className="font-mono text-sm break-words">{solfege.join(' · ')}</div>
        </div>
      </div>
      <p className="text-xs opacity-70">Design sectional warm-ups that match your current key and instantly audition them or trigger a guided playback with count-in.</p>
    </div>
  );
}

function SessionNotes({ value, onChange }){
  return (
    <div className="bg-white/75 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4">
      <h3 className="font-semibold text-base mb-2">Conductor Notes</h3>
      <textarea className="w-full h-28 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white/70 dark:bg-neutral-800 text-sm" placeholder="Document blend goals, vowel unification reminders, cue choreography, etc." value={value} onChange={e=>onChange(e.target.value)} />
      <p className="text-xs opacity-60 mt-2">Stored locally for quick recall each rehearsal.</p>
    </div>
  );
}

export default function ChoirHarmonyStudio(){
  const [selectedId, setSelectedId] = useState(1);
  const [transpose, setTranspose] = useState(0);
  const [tempo, setTempo] = useState(80);
  const [metronome, setMetronome] = useState(true);
  const [loop, setLoop] = useState(false);
  const [countIn, setCountIn] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [instrument, setInstrument] = useState('Choir Aah');
  const [activeNotes, setActiveNotes] = useState(()=>new Map());
  const [customSongs, setCustomSongs] = useState(()=>loadCustomSongs());
  const [voiceInstruments, setVoiceInstruments] = useState({ S:'Choir Aah', A:'Warm Pad', T:'Studio Piano', B:'Cathedral Organ' });
  const [mutes, setMutes] = useState({ S:false, A:false, T:false, B:false });
  const [solos, setSolos] = useState({ S:false, A:false, T:false, B:false });
  const [volumes, setVolumes] = useState({ S:100, A:100, T:100, B:100 });
  const [pans, setPans] = useState({ S:-20, A:20, T:-10, B:10 });
  const [dark, setDark] = useState(false);
  const [focus, setFocus] = useState('ALL');
  const [sessionNotes, setSessionNotes] = useState('');

  const [beatPointer, setBeatPointer] = useState(0);

  const tapTimesRef = useRef([]);
  const uiTimersRef = useRef([]);
  const rafRef = useRef(null);
  const endTimerRef = useRef(null);
  const warmupTimersRef = useRef([]);

  const { ensure, stopAll, playNote, click, INSTRUMENTS, busesRef } = useAudioEngine();

  const SONG_LIST = useMemo(()=>[...SONGS, ...customSongs], [customSongs]);
  const song = useMemo(() => SONG_LIST.find(s => s.id === selectedId) || SONG_LIST[0], [selectedId, SONG_LIST]);
  const parts = useMemo(() => ({ S: solfegeToDegrees(song.soprano), A: solfegeToDegrees(song.alto), T: solfegeToDegrees(song.tenor), B: solfegeToDegrees(song.bass), }), [song]);
  const keyInfo = useMemo(() => parseKeyString(song.key), [song.key]);
  const baseOctave = { S:5, A:4, T:3, B:2 };

  useEffect(()=>{ const p = loadPrefs(); if(p){ setTranspose(p.transpose??0); setTempo(p.tempo??80); setMetronome(!!p.metronome); setLoop(!!p.loop); setCountIn(p.countIn ?? true); setDark(!!p.dark); setVoiceInstruments(p.voiceInstruments || { S:'Choir Aah', A:'Warm Pad', T:'Studio Piano', B:'Cathedral Organ' }); setVolumes(p.volumes||{S:100,A:100,T:100,B:100}); setPans(p.pans||{S:-20,A:20,T:-10,B:10}); setFocus(p.focus || 'ALL'); setSessionNotes(p.sessionNotes || ''); } }, []);
  useEffect(()=>{ savePrefs({ transpose, tempo, metronome, loop, countIn, dark, voiceInstruments, volumes, pans, focus, sessionNotes }); }, [transpose, tempo, metronome, loop, countIn, dark, voiceInstruments, volumes, pans, focus, sessionNotes]);
  useEffect(()=>{ if(song?.bpm) setTempo(song.bpm); }, [song]);

  useEffect(()=>{
    ensure();
    const soloActive = Object.values(solos).some(Boolean);
    const focusActive = focus !== 'ALL';
    ['S','A','T','B'].forEach(v=>{
      const bus = busesRef.current[v]; if(!bus) return;
      const muted = mutes[v] || (soloActive && !solos[v]);
      const base = (volumes[v]/100);
      const focusFactor = focusActive ? (focus === v ? 1.4 : 0.45) : 1;
      bus.gain.gain.value = muted ? 0 : base * focusFactor;
      if(bus.pan) bus.pan.pan.value = (pans[v]||0)/100;
    });
  }, [mutes, volumes, pans, solos, focus, ensure, busesRef]);

  useEffect(()=>{
    const onKey=(e)=>{ if(/input|textarea|select/i.test(e.target.tagName)) return; const k=e.key;
      if(k===' '){ e.preventDefault(); isPlaying? handleStop() : handlePlay(); }
      else if(k==='l' || k==='L'){ setLoop(v=>!v); }
      else if(k==='m' || k==='M'){ setMetronome(v=>!v); }
      else if(k==='c' || k==='C'){ setCountIn(v=>!v); }
      else if(k==='ArrowUp'){ setTranspose(t=>t+1); }
      else if(k==='ArrowDown'){ setTranspose(t=>t-1); }
      else if(k==='+' || k==='='){ setTempo(t=>t+2); }
      else if(k==='-' || k==='_'){ setTempo(t=>Math.max(20,t-2)); }
      else if(k>='1' && k<='4'){ const map=['S','A','T','B']; const v=map[Number(k)-1]; if(e.shiftKey){ setSolos(s=>({...s,[v]:!s[v]})); } else { setMutes(m=>({...m,[v]:!m[v]})); } }
      else if(k==='f' || k==='F'){
        const order = ['ALL','S','A','T','B'];
        const idx = order.indexOf(focus);
        setFocus(order[(idx+1)%order.length]);
      }
    };
    window.addEventListener('keydown', onKey); return ()=>window.removeEventListener('keydown', onKey);
  }, [isPlaying, focus]);

  const clearActiveTimers = () => {
    if (endTimerRef.current){ clearTimeout(endTimerRef.current); endTimerRef.current=null; }
    if (rafRef.current){ cancelAnimationFrame(rafRef.current); rafRef.current=null; }
    if (uiTimersRef.current.length){ uiTimersRef.current.forEach(t => clearTimeout(t)); uiTimersRef.current = []; }
    if (warmupTimersRef.current.length){ warmupTimersRef.current.forEach(t => clearTimeout(t)); warmupTimersRef.current = []; }
  };

  const auditionMidi = (midi, highlightVoices) => {
    const ctx = ensure(); const when = ctx.currentTime + 0.01; const dur = 0.6; const anySolo = Object.values(solos).some(Boolean);
    const voicesToShow = highlightVoices || (anySolo ? Object.entries(solos).filter(([,on])=>on).map(([v])=>v) : ['S','A','T','B']);
    voicesToShow.forEach(v=> playNote(when, dur, midiToFreq(midi), 0.28, voiceInstruments[v] || instrument, v));
    setActiveNotes(prev => { const map = new Map(prev); map.set(midi, new Set(voicesToShow)); return map; });
    const t = window.setTimeout(() => setActiveNotes(prev => { const map = new Map(prev); map.delete(midi); return map; }), dur * 1000);
    uiTimersRef.current.push(t);
  };

  const handlePlay = () => {
    if (isPlaying) return; setIsPlaying(true);
    const ctx = ensure();
    const cycleBeats = song.bars * BEATS_PER_BAR;
    const spb = 60 / tempo;
    const firstStart = ctx.currentTime + 0.1 + (countIn ? BEATS_PER_BAR*spb : 0);
    if (countIn){ for(let i=0;i<BEATS_PER_BAR;i++){ const when = ctx.currentTime + 0.1 + i*spb; click(when, i===0); } }

    const scheduleCycle = (startAt) => {
      const noteDur = Math.max(0.01, (BEATS_PER_BAR*spb) - 0.01);
      for (let i = 0; i < cycleBeats; i++) { const when = startAt + i*spb; if (metronome) click(when, i % BEATS_PER_BAR === 0); }

      const playStep = (bar) => {
        const when = startAt + bar * (BEATS_PER_BAR*spb);
        const step = bar % (parts.S.length || 1);
        (['S','A','T','B']).forEach(v => {
          const soloMode = Object.values(solos).some(Boolean);
          if (mutes[v] || (soloMode && !solos[v])) return;
          const deg = parts[v][step];
          const scaleOff = degreeToSemitoneOffset(deg, keyInfo?.isMinor);
          const midiBase = 60; const tonicFromC = keyInfo?.base ?? 0; const octave = baseOctave[v];
          const rawMidi = midiBase + tonicFromC + scaleOff + (octave-4)*12 + transpose;
          const midi = fitMidiToVoiceRange(v, rawMidi);
          const freq = midiToFreq(midi);
          const focusFactor = focus !== 'ALL' && focus !== v ? 0.55 : 1;
          playNote(when, noteDur, freq, 0.32*(volumes[v]/100)*focusFactor, voiceInstruments[v] || instrument, v);
          const onMs = Math.max(0, (when - ctx.currentTime) * 1000);
          const offMs = Math.max(0, (when + noteDur - ctx.currentTime) * 1000);
          const onT = window.setTimeout(() => setActiveNotes(prev => { const map = new Map(prev); const set = new Set(map.get(midi) || []); set.add(v); map.set(midi, set); return map; }), onMs);
          const offT = window.setTimeout(() => setActiveNotes(prev => { const map = new Map(prev); const set = new Set(map.get(midi) || []); set.delete(v); if (set.size) map.set(midi, set); else map.delete(midi); return map; }), offMs);
          uiTimersRef.current.push(onT, offT);
        });
      };

      for (let bar=0; bar<song.bars; bar++) playStep(bar);

      const nextStart = startAt + cycleBeats*spb;
      if (loop){
        const delayMs = Math.max(0, (nextStart - ctx.currentTime - 0.05) * 1000);
        endTimerRef.current = window.setTimeout(() => scheduleCycle(nextStart), delayMs);
      } else {
        endTimerRef.current = window.setTimeout(() => setIsPlaying(false), Math.max(0, (nextStart - ctx.currentTime + 0.2) * 1000));
      }
    };

    const startVisual = () => {
      const begin = ctx.currentTime; const total = (countIn? BEATS_PER_BAR:0) + (song.bars*BEATS_PER_BAR);
      const loopRAF = () => { const t = ctx.currentTime - begin; const beat = Math.max(0, Math.floor(t / spb)); setBeatPointer(beat % total); rafRef.current = requestAnimationFrame(loopRAF); };
      rafRef.current = requestAnimationFrame(loopRAF);
    };

    startVisual();
    scheduleCycle(firstStart);
  };

  const stopPlayback = () => {
    clearActiveTimers();
    setActiveNotes(new Map()); setBeatPointer(0);
    stopAll(); setIsPlaying(false);
  };

  const handleStop = () => { stopPlayback(); };
  useEffect(()=>()=>{ stopPlayback(); }, []);

  const handleTapTempo = () => {
    const now = performance.now(); tapTimesRef.current = [...tapTimesRef.current.filter(t => now - t < 3000), now];
    if (tapTimesRef.current.length >= 2){ const diffs = tapTimesRef.current.slice(1).map((t,i)=>t - tapTimesRef.current[i]); const avg = diffs.reduce((a,b)=>a+b,0)/diffs.length; const bpm = Math.round(60000/avg); setTempo(Math.max(40, Math.min(220, bpm))); }
  };

  const importSongs = (items)=>{ if(!items?.length) return; setCustomSongs(prev=>{ const merged=[...prev, ...items]; saveCustomSongs(merged); return merged; }); };
  const clearImported = ()=>{ localStorage.removeItem(STORAGE_KEY_SONGS); setCustomSongs([]); };

  const shareLink = () => {
    const data = { id:selectedId, t:tempo, tr:transpose, m:metronome?1:0, l:loop?1:0, c:countIn?1:0, f:focus };
    const hash = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
    navigator.clipboard?.writeText(location.origin + location.pathname + '#'+hash);
    alert('Share link copied to clipboard!');
  };

  const applyHashOnLoad = () => {
    try{ if(location.hash.length>1){ const json = decodeURIComponent(escape(atob(location.hash.slice(1)))); const d = JSON.parse(json); if(d.id) setSelectedId(d.id); if(Number.isFinite(d.t)) setTempo(d.t); if(Number.isFinite(d.tr)) setTranspose(d.tr); if('m' in d) setMetronome(!!d.m); if('l' in d) setLoop(!!d.l); if('c' in d) setCountIn(!!d.c); if(d.f) setFocus(d.f); } } catch{}
  };
  useEffect(applyHashOnLoad, []);

  const Info = ({label,value, hint}) => (
    <div className="p-3 rounded-xl bg-white/70 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
      <div className="text-xs uppercase tracking-wide opacity-60">{label}</div>
      <div className="font-medium mt-0.5">{value}</div>
      {hint && <div className="text-[10px] opacity-60 mt-1">{hint}</div>}
    </div>
  );

  const PartCard = ({ v, notes }) => {
    const gradients = { S:'from-pink-200/60 to-pink-100/80', A:'from-violet-200/60 to-violet-100/80', T:'from-sky-200/60 to-sky-100/80', B:'from-emerald-200/60 to-emerald-100/80' };
    const idx = beatPointer - (countIn? BEATS_PER_BAR:0); const highlightIndex = (idx>=0) ? (idx % song.bars) : -1;
    return (
      <div className={`rounded-2xl shadow-lg p-4 bg-gradient-to-br ${gradients[v]} border border-white/60 backdrop-blur-sm`}>
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold flex items-center gap-2">{VOICE_LABELS[v]}<span className="inline-flex items-center justify-center text-[10px] px-2 py-0.5 rounded-full bg-white/80 border border-white/40">{voiceInstruments[v]}</span></h3>
          <div className="flex items-center gap-1">
            <button onClick={()=>setSolos(s=>({...s,[v]:!s[v]}))} className={`px-2 py-1 rounded-xl text-xs ${solos[v] ? 'bg-amber-500 text-white' : 'bg-white/70'}`}>{solos[v] ? 'Soloing' : 'Solo'}</button>
            <button onClick={()=>setMutes(m=>({...m,[v]:!m[v]}))} className={`px-2 py-1 rounded-xl text-xs ${mutes[v] ? 'bg-neutral-500 text-white' : 'bg-black/70 text-white'}`}>{mutes[v] ? 'Muted' : 'Live'}</button>
          </div>
        </div>
        <div className="mt-2 text-sm opacity-90"><span className="font-mono">{notes}</span></div>
        <PartStaff voice={v} notesText={notes} bars={song.bars} keyInfo={keyInfo} transpose={transpose} highlightIndex={highlightIndex} />
        <div className="grid grid-cols-2 gap-3 mt-3">
          <PrettySelect label="Timbre" value={voiceInstruments[v]} onChange={(val)=>setVoiceInstruments(s=>({...s,[v]:val}))} options={Object.keys(INSTRUMENTS)} />
          <div>
            <Slider label="Volume" value={volumes[v]} onChange={(val)=>setVolumes(s=>({...s,[v]:val}))} />
            <Slider label="Pan" value={pans[v]+100} min={0} max={200} onChange={(val)=>setPans(s=>({...s,[v]:(val-100)}))} rightLabel={`${pans[v]}%`} />
          </div>
        </div>
      </div>
    );
  };

  const themeClass = dark ? 'dark bg-neutral-950 text-neutral-100' : 'bg-gradient-to-br from-slate-100 via-white to-slate-200 text-neutral-800';

  const previewWarmup = (degrees) => {
    const ctx = ensure();
    const start = ctx.currentTime + 0.05;
    degrees.slice(0,12).forEach((deg, idx)=>{
      const stepMidi = fitMidiToVoiceRange('S', 60 + (keyInfo.base||0) + degreeToSemitoneOffset(deg, keyInfo.isMinor) + transpose);
      const when = start + idx*0.35;
      playNote(when, 0.3, midiToFreq(stepMidi), 0.2, voiceInstruments.S, 'S');
      const timer = window.setTimeout(()=>auditionMidi(stepMidi, ['S']), Math.max(0,(when-ctx.currentTime)*1000));
      warmupTimersRef.current.push(timer);
    });
  };

  const playWarmup = (degrees) => {
    const ctx = ensure();
    const beatSeconds = 60/tempo;
    const start = ctx.currentTime + (countIn ? BEATS_PER_BAR*beatSeconds : 0.2);
    if (countIn){ for(let i=0;i<BEATS_PER_BAR;i++){ const when = ctx.currentTime + i*beatSeconds; click(when, i===0); } }
    degrees.forEach((deg, idx)=>{
      (['S','A','T','B']).forEach(voice => {
        const scaleOff = degreeToSemitoneOffset(deg % 7, keyInfo?.isMinor);
        const baseMidi = 60 + (keyInfo.base||0) + scaleOff + (baseOctave[voice]-4)*12 + transpose;
        const midi = fitMidiToVoiceRange(voice, baseMidi + (Math.floor(deg/7)*12));
        const when = start + idx*beatSeconds;
        playNote(when, beatSeconds*0.95, midiToFreq(midi), 0.28*(volumes[voice]/100), voiceInstruments[voice], voice);
      });
    });
  };

  return (
    <div className={`min-h-screen ${themeClass} p-6`}>
      <div className="max-w-7xl mx-auto grid gap-6">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold">Choir Harmony Studio — Ultra Edition</h1>
            <p className="text-sm opacity-70">Sculpt blend, rehearse smarter and craft resonant warm-ups tailored to your ensemble.</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <button onClick={()=>setDark(d=>!d)} className="px-3 py-1 rounded-xl bg-neutral-200/80 dark:bg-neutral-800">{dark? 'Light' : 'Dark'}</button>
            <button onClick={shareLink} className="px-3 py-1 rounded-xl bg-black text-white shadow">Share</button>
          </div>
        </header>

        <section className="grid lg:grid-cols-[2fr,3fr] gap-4">
          <div className="rounded-2xl shadow p-4 md:p-6 bg-white/80 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-4">
            <div>
              <label className="text-sm font-medium">Select Song</label>
              <select className="mt-2 w-full border rounded-xl p-3 bg-white/80 dark:bg-neutral-900" value={selectedId} onChange={e=>setSelectedId(Number(e.target.value))}>
                {SONG_LIST.map(s => <option key={s.id} value={s.id}>{s.song} — {s.artist}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info label="Artist" value={song.artist} />
              <Info label="Original Key" value={song.key} hint={song.progression || 'classic progression'} />
              <Info label="Lyric Cue" value={song.lyricCue} />
              <Info label="Suggested BPM" value={`${song.bpm} BPM`} hint={`Difficulty: ${song.difficulty}`} />
            </div>
            <FocusSelector value={focus} onChange={setFocus} />
            <SessionNotes value={sessionNotes} onChange={setSessionNotes} />
          </div>

          <div className="rounded-2xl shadow p-4 md:p-6 space-y-4 bg-white/80 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <div className="flex flex-wrap gap-3 items-center">
              <button onClick={isPlaying? handleStop : handlePlay} className={`px-4 py-2 rounded-2xl shadow ${isPlaying?'bg-rose-600':'bg-emerald-600'} text-white`}>{isPlaying? '■ Stop' : '▶ Play'}</button>
              <Toggle label="Metronome" checked={metronome} onChange={setMetronome} />
              <Toggle label="Loop" checked={loop} onChange={setLoop} />
              <Toggle label="Count‑in" checked={countIn} onChange={setCountIn} />
              <div className="ml-auto flex items-center gap-2">
                <span className="text-sm">Quick Timbre</span>
                <select className="border rounded-xl p-2 bg-white/80 dark:bg-neutral-900" value={instrument} onChange={e=>setInstrument(e.target.value)}>
                  {Object.keys(INSTRUMENTS).map(name => (<option key={name} value={name}>{name}</option>))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="p-3 rounded-xl bg-neutral-100/80 dark:bg-neutral-900">
                <div className="text-xs uppercase opacity-60">Tempo</div>
                <div className="flex items-center gap-2 mt-1">
                  <button className="px-2 py-1 rounded-lg bg-neutral-200 dark:bg-neutral-700" onClick={()=>setTempo(t=>Math.max(20,t-5))}>−</button>
                  <input type="number" className="w-20 text-center rounded-lg border dark:bg-neutral-900" value={tempo} onChange={e=>setTempo(Math.max(20, Number(e.target.value)||0))}/> 
                  <button className="px-2 py-1 rounded-lg bg-neutral-200 dark:bg-neutral-700" onClick={()=>setTempo(t=>t+5)}>+</button>
                  <button className="ml-2 px-3 py-1 rounded-lg bg-black text-white" onClick={handleTapTempo}>Tap</button>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-neutral-100/80 dark:bg-neutral-900">
                <div className="text-xs uppercase opacity-60">Transpose</div>
                <div className="flex items-center gap-2 mt-1">
                  <button className="px-2 py-1 rounded-lg bg-neutral-200 dark:bg-neutral-700" onClick={()=>setTranspose(t=>t-1)}>−</button>
                  <div className="w-16 text-center">{transpose} st</div>
                  <button className="px-2 py-1 rounded-lg bg-neutral-200 dark:bg-neutral-700" onClick={()=>setTranspose(t=>t+1)}>+</button>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-neutral-100/80 dark:bg-neutral-900">
                <div className="text-xs uppercase opacity-60">Progress</div>
                <BeatBar bars={song.bars} beatsPerBar={BEATS_PER_BAR} beatPointer={beatPointer} countIn={countIn} />
              </div>
            </div>

            <ImportSongs onAdded={importSongs} onClear={clearImported} />

            <div className="pt-2">
              <h3 className="text-sm font-semibold mb-2">Piano</h3>
              <ChoirPiano activeNotes={activeNotes} onKeyDown={auditionMidi} />
            </div>
          </div>
        </section>

        <WarmupPlanner onPlay={playWarmup} onPreview={previewWarmup} keyInfo={keyInfo} />

        <section className="grid md:grid-cols-4 gap-4">
          <PartCard v="S" notes={song.soprano} />
          <PartCard v="A" notes={song.alto} />
          <PartCard v="T" notes={song.tenor} />
          <PartCard v="B" notes={song.bass} />
        </section>

        <footer className="text-xs text-center opacity-70 pt-2 pb-8">Shortcuts: <kbd>Space</kbd> Play/Stop · <kbd>L</kbd> Loop · <kbd>M</kbd> Metronome · <kbd>C</kbd> Count‑in · <kbd>↑/↓</kbd> Transpose · <kbd>±</kbd> Tempo · <kbd>1‑4</kbd> Mute S/A/T/B · <kbd>Shift+1‑4</kbd> Solo · <kbd>F</kbd> cycles focus mixer</footer>
      </div>
    </div>
  );
}

function ImportSongs({ onAdded, onClear }){
  const [open,setOpen]=useState(false); const [text,setText]=useState(''); const [fileName,setFileName]=useState(''); const [count,setCount]=useState(0);
  const parseAndAdd=(t)=>{ const items=parseSongsFromCSV(t); setCount(items.length); if(items.length&&typeof onAdded==='function'){ onAdded(items); setText(''); } };
  const onFile=(e)=>{ const f=e.target.files?.[0]; if(!f) return; setFileName(f.name); const reader=new FileReader(); reader.onload=()=>parseAndAdd(String(reader.result||'')); reader.readAsText(f); };
  return (
    <div className="bg-neutral-50/80 dark:bg-neutral-900 rounded-xl p-3 border border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center gap-2">
        <button className="text-sm px-3 py-1 rounded-lg bg-black text-white" onClick={()=>setOpen(o=>!o)}>{open? 'Close Import' : 'Import Songs'}</button>
        <span className="text-xs opacity-70">CSV/TSV headers: song, artist, key, soprano, alto, tenor, bass, bpm, bars, difficulty, progression, lyricCue</span>
      </div>
      {open && (
        <div className="mt-3 space-y-2">
          <input type="file" accept=".csv,.tsv,text/csv,text/tab-separated-values" onChange={onFile} className="block" />
          {fileName && <div className="text-xs opacity-70">{fileName}</div>}
          <textarea className="w-full h-28 p-2 border rounded-lg dark:bg-neutral-900" placeholder="Or paste rows here…" value={text} onChange={e=>setText(e.target.value)} />
          <div className="flex items-center gap-2 flex-wrap">
            <button className="px-3 py-1 rounded-lg bg-emerald-600 text-white" onClick={()=>parseAndAdd(text)}>Add</button>
            <span className="text-xs opacity-70">{count? `Added ${count} song(s)` : ''}</span>
            <button className="px-3 py-1 rounded-lg bg-neutral-200 dark:bg-neutral-700" onClick={()=>{localStorage.removeItem(STORAGE_KEY_SONGS); setCount(0); setText(''); setFileName(''); onClear?.();}}>Clear Imported</button>
          </div>
        </div>
      )}
    </div>
  );
}

function BeatBar({ bars, beatsPerBar, beatPointer, countIn }){
  const total = (countIn? beatsPerBar:0) + (bars*beatsPerBar);
  const items = Array.from({length: total}, (_,i)=> i);
  return (
    <div className="flex gap-1 mt-1">
      {items.map(i=>{
        const isCountIn = countIn && i < beatsPerBar; const inBar = isCountIn ? i : (i - (countIn? beatsPerBar:0));
        const first = (inBar % beatsPerBar)===0; const on = i===beatPointer;
        return (
          <div key={i} title={isCountIn? 'Count‑in' : `Beat ${inBar+1}`} className={`h-3 flex-1 rounded ${on? 'bg-emerald-600' : first? 'bg-neutral-400' : 'bg-neutral-200'}`}></div>
        );
      })}
    </div>
  );
}
