/** Select a Spain voice without letting list order or accented names change dialect. */
export function selectSpainVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const score = (voice: SpeechSynthesisVoice) => {
    const name = normalize(voice.name);
    if (/natural|neural|premium|enhanced/.test(name)) return 40;
    if (/monica|elvira|alvaro/.test(name)) return 30;
    if (/google/.test(name)) return 20;
    if (/eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley/.test(name)) return -10;
    return voice.default ? 10 : 0;
  };
  return voices.filter(voice => voice.lang.replace('_', '-').toLowerCase() === 'es-es')
    .sort((a, b) => score(b) - score(a))[0] ?? null;
}
