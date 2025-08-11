export type TranscriptionResult = { text: string; tags: string[] };

function simpleTagger(text: string): string[] {
  const s = text.toLowerCase();
  const tags = new Set<string>();
  if (/(run|gym|walk|yoga|swim|hike)/.test(s)) tags.add('exercise');
  if (/(happy|grateful|relaxed|good|great|energized)/.test(s)) tags.add('happy');
  if (/(stress|anxious|tired|sad|frustrated)/.test(s)) tags.add('low');
  if (/(creative|idea|sketch|write|draw)/.test(s)) tags.add('creative');
  if (/(family|friend|party|social)/.test(s)) tags.add('social');
  return Array.from(tags);
}

export default {
  async transcribeAudio(_uri: string): Promise<TranscriptionResult> {
    const text = "[transcription not configured — add your API later]";
    return { text, tags: simpleTagger(text) };
  }
};
