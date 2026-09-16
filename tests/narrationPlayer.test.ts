import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NarrationPlayer, normalizeSpeechText } from '../src/services/narrationPlayer.ts';

function setup() {
  const audio: Array<ReturnType<typeof create>> = [];
  const speech: Array<{ text: string; rate: number; end: () => void }> = [];
  function create(url: string) {
    let reject!: (error: Error) => void;
    const play = new Promise<void>((_, fail) => { reject = fail; });
    return { url, playbackRate: 1, preservesPitch: false, onended: null as null | (() => void),
      onerror: null as null | (() => void), paused: false,
      play: () => play, pause() { this.paused = true; }, removeAttribute() {}, load() {}, reject };
  }
  const player = new NarrationPlayer({
    resolveAudio: text => normalizeSpeechText(text) === 'taza' ? '/app/audio/taza.wav' : undefined,
    createAudio: url => { const item = create(url); audio.push(item); return item as unknown as HTMLAudioElement; },
    speakFallback: (text, rate, end) => { speech.push({ text, rate, end }); return true; },
    stopFallback: () => {},
  });
  return { player, audio, speech };
}

test('recorded words handle case differences, keep pitch and apply live rate changes', () => {
  const { player, audio, speech } = setup();
  assert.equal(player.speak(' TAZA '), true);
  assert.equal(speech.length, 0);
  assert.equal(audio[0].url, '/app/audio/taza.wav');
  assert.equal(audio[0].preservesPitch, true);
  player.setRate(.82);
  assert.equal(audio[0].playbackRate, .82);
  player.setRate(NaN);
  assert.equal(audio[0].playbackRate, .82);
});

test('pending text uses browser narration and completion is called once', () => {
  const { player, speech } = setup();
  let ended = 0;
  player.speak('Pending message', () => ended++);
  assert.equal(speech[0].text, 'Pending message');
  speech[0].end(); speech[0].end();
  assert.equal(ended, 1);
});

test('audio errors and rejected play promises trigger only one fallback', async () => {
  const { player, audio, speech } = setup();
  player.speak('Taza');
  const error = audio[0].onerror!;
  error(); audio[0].reject(new Error('network'));
  await Promise.resolve();
  assert.equal(speech.length, 1);
  assert.equal(audio[0].paused, true);
});

test('a canceled recording cannot start fallback or finish a later request', async () => {
  const { player, audio, speech } = setup();
  let ended = 0;
  player.speak('Taza', () => ended++);
  const oldEnd = audio[0].onended!;
  player.speak('New text');
  oldEnd(); audio[0].reject(new Error('late failure'));
  await Promise.resolve();
  assert.equal(ended, 0);
  assert.equal(speech.length, 1);
  assert.equal(speech[0].text, 'New text');
});

test('stop releases playback and suppresses late completion', () => {
  const { player, audio } = setup();
  let ended = 0;
  player.speak('Taza', () => ended++);
  const end = audio[0].onended!;
  player.stop(); end();
  assert.equal(audio[0].paused, true);
  assert.equal(audio[0].onended, null);
  assert.equal(ended, 0);
});

test('unavailable browser speech returns false and settles completion', () => {
  let ended = 0;
  const player = new NarrationPlayer({resolveAudio: () => undefined, createAudio: () => { throw Error(); },
    speakFallback: () => false, stopFallback: () => {}});
  assert.equal(player.speak('No voice', () => ended++), false);
  assert.equal(ended, 1);
});

test('recorded completion releases audio and invokes the callback once', () => {
  const { player, audio, speech } = setup();
  let ended = 0;
  player.speak('Taza', () => ended++);
  const end = audio[0].onended!;
  end(); end();
  assert.equal(ended, 1);
  assert.equal(audio[0].paused, true);
  assert.equal(speech.length, 0);
});
