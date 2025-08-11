import { useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    (async () => {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    })();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  async function startRecording() {
    if (audioUri) setAudioUri(null);
    const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    recordingRef.current = recording;
    setIsRecording(true);
    setDuration(0);
    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
  }

  async function stopRecording() {
    const rec = recordingRef.current;
    if (!rec) return;
    await rec.stopAndUnloadAsync();
    const uri = rec.getURI();
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    setDuration(0);
    setAudioUri(uri || null);
    recordingRef.current = null;
  }

  async function clearRecording() {
    if (soundRef.current) {
      await soundRef.current.stopAsync().catch(() => {});
      await soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
    setAudioUri(null);
    setIsPlaying(false);
  }

  async function playRecording() {
    if (!audioUri) return;
    if (soundRef.current) {
      await soundRef.current.stopAsync().catch(() => {});
      await soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
    const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
    soundRef.current = sound;
    setIsPlaying(true);
    sound.setOnPlaybackStatusUpdate((status: any) => {
      if (!status.isLoaded) return;
      if (status.didJustFinish) {
        setIsPlaying(false);
        soundRef.current?.unloadAsync();
        soundRef.current = null;
      }
    });
    await sound.playAsync();
  }

  return { isRecording, audioUri, duration, isPlaying, startRecording, stopRecording, clearRecording, playRecording };
}
