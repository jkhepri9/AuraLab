import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Activity, Waves, Download, Loader2 } from 'lucide-react';
import { bufferToWave } from '@/components/utils';
import { motion } from 'framer-motion';

export default function AuraConverter() {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [convertedUrl, setConvertedUrl] = useState(null);
  const [originalName, setOriginalName] = useState('');

  const audioContextRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setOriginalName(selectedFile.name.replace(/\.[^/.]+$/, ""));
      setConvertedUrl(null);
      setProgress(0);
    }
  };

  const processFile = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(10);

    try {
      // Initialize Audio Context
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = ctx;

      // Read file
      const arrayBuffer = await file.arrayBuffer();
      setProgress(30);

      // Decode Audio
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      setProgress(50);

      // 432Hz conversion ratio: 432 / 440 = 0.981818...
      // We slow down the playback rate to lower the pitch.
      const ratio = 432 / 440;
      const newLength = audioBuffer.length / ratio;

      const offlineCtx = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        newLength,
        audioBuffer.sampleRate
      );

      const source = offlineCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.playbackRate.value = ratio;
      source.connect(offlineCtx.destination);
      source.start();

      setProgress(70);

      // Render
      const renderedBuffer = await offlineCtx.startRendering();
      setProgress(90);

      // Convert to WAV Blob
      const wavBlob = bufferToWave(renderedBuffer, renderedBuffer.length);
      const url = URL.createObjectURL(wavBlob);

      setConvertedUrl(url);
      setProgress(100);
    } catch (error) {
      console.error("Conversion failed", error);
      alert("Error processing audio file. Please try a different file format.");
    } finally {
      setIsProcessing(false);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-12">
      <header className="space-y-3 text-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
          <span className="text-white">Aura</span>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
            {" "}
          Converter
          </span>
          <span className="block mt-2 text-sm sm:text-base font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-cyan-400 to-emerald-400">
            440Hz → 432Hz
          </span>
        </h1>
        <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto">
          Pitch-shift your audio from 440Hz to 432Hz.
        </p>
      </header>

      {/* Futuristic gradient frame */}
      <div className="p-[1px] rounded-3xl bg-gradient-to-r from-purple-500/40 via-cyan-500/20 to-emerald-500/30">
        <div className="relative bg-white/5 border border-white/10 rounded-3xl p-10 backdrop-blur-sm text-center space-y-8 overflow-hidden">
          {/* Ambient glows */}
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[520px] h-[520px] bg-purple-500/12 rounded-full blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 left-1/2 -translate-x-1/2 w-[520px] h-[520px] bg-emerald-500/10 rounded-full blur-3xl" />
          {/* Subtle scanline sheen */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/0 via-white/5 to-white/0 opacity-20" />

          {!file ? (
            <div
              className="relative border border-white/15 rounded-2xl p-12 hover:bg-white/5 transition-colors cursor-pointer group"
              onClick={() => document.getElementById('file-upload').click()}
            >
              <input
                type="file"
                id="file-upload"
                accept="audio/*"
                className="hidden"
                onChange={handleFileChange}
              />

              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-purple-300 bg-purple-500/15 border border-purple-500/25 group-hover:border-purple-400/40 transition-colors">
                <Waves className="w-8 h-8" />
              </div>

              <h3 className="text-xl font-bold text-white mb-2">Drop in an audio file</h3>
              <p className="text-gray-400">MP3, WAV, FLAC supported (recommended: ≤ 50MB)</p>

              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/25 border border-white/10 text-xs text-gray-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400/80 shadow-[0_0_10px_rgba(52,211,153,0.35)]" />
                Local processing. No upload.
              </div>
            </div>
          ) : (
            <div className="space-y-6 relative">
              <div className="flex items-center gap-4 bg-black/20 p-4 rounded-2xl border border-white/10">
                <div className="w-12 h-12 bg-purple-500/15 border border-purple-500/25 rounded-2xl flex items-center justify-center text-purple-300 shrink-0">
                  <Waves className="w-6 h-6" />
                </div>

                <div className="text-left overflow-hidden">
                  <h4 className="text-white font-bold truncate">{file.name}</h4>
                  <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto text-gray-400 hover:text-white hover:bg-white/5"
                  onClick={() => {
                    setFile(null);
                    setConvertedUrl(null);
                  }}
                >
                  Change
                </Button>
              </div>

              {!convertedUrl && (
                <div className="space-y-4">
                  {isProcessing && (
                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 via-cyan-400 to-emerald-400 h-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}

                  <Button
                    onClick={processFile}
                    disabled={isProcessing}
                    className="w-full bg-white text-black hover:bg-white/90 font-bold h-12 rounded-2xl"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing... {progress}%
                      </>
                    ) : (
                      <>
                        <Activity className="w-5 h-5 mr-2" /> Convert to 432Hz
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-gray-500">
                    Tip: longer tracks take longer because conversion is rendered in real audio buffers.
                  </p>
                </div>
              )}

              {convertedUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 pt-4 border-t border-white/10"
                >
                  <div className="flex justify-center">
                    <div className="bg-emerald-500/10 text-emerald-300 px-4 py-1 rounded-full text-sm font-medium flex items-center gap-2 border border-emerald-500/20">
                      <Activity className="w-4 h-4" /> Conversion Complete
                    </div>
                  </div>

                  <a href={convertedUrl} download={`${originalName}_432hz.wav`} className="block">
                    <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold h-12 rounded-2xl">
                      <Download className="w-5 h-5 mr-2" /> Download Converted Audio
                    </Button>
                  </a>

                  <p className="text-xs text-gray-500">File is processed locally in your browser.</p>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 text-center">
        <Feature
          icon={<Activity />}
          title="Reference Pitch Shift"
          desc="Lowers pitch by ~1.8% using a 432/440 playback-rate ratio."
        />
        <Feature
          icon={<Waves />}
          title="High-Quality Render"
          desc="Renders via OfflineAudioContext for clean, consistent processing."
        />
        <Feature
          icon={<Download />}
          title="Private & Fast"
          desc="No server upload required. Conversion runs on your device."
        />
      </div>
    </div>
  );
}

function Feature({ icon, title, desc }) {
  return (
    <div className="bg-white/5 p-6 rounded-2xl border border-white/10 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
      <div className="relative">
        <div className="w-10 h-10 bg-black/25 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white">
          {icon}
        </div>
        <h3 className="text-white font-bold mb-2">{title}</h3>
        <p className="text-gray-400 text-sm">{desc}</p>
      </div>
    </div>
  );
}
