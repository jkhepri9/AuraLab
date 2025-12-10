import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Square, Plus, Trash2, Volume2, Save, ArrowLeft, Activity, Headphones, Waves, Palette, Download, Loader2 } from 'lucide-react';
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

      // Create Offline Context for rendering
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
      <header className="space-y-2 text-center">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">AuraConverter 
440Hz to 432Hz
        </h1>
        <p className="text-gray-400 text-lg">
          Shift your music to the natural resonance of the universe.
        </p>
      </header>

      <div className="bg-white/5 border border-white/10 rounded-3xl p-10 backdrop-blur-sm text-center space-y-8">
        
        {!file ?
        <div
          className="border-2 border-dashed border-white/20 rounded-2xl p-12 hover:bg-white/5 transition-colors cursor-pointer"
          onClick={() => document.getElementById('file-upload').click()}>

            <input
            type="file"
            id="file-upload"
            accept="audio/*"
            className="hidden"
            onChange={handleFileChange} />

            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-400">
              <Waves className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Upload Audio File</h3>
            <p className="text-gray-400">Supports MP3, WAV, FLAC (Max 50MB)</p>
          </div> :

        <div className="space-y-6">
            <div className="flex items-center gap-4 bg-black/20 p-4 rounded-xl">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 shrink-0">
                <Waves className="w-6 h-6" />
              </div>
              <div className="text-left overflow-hidden">
                <h4 className="text-white font-bold truncate">{file.name}</h4>
                <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-gray-500 hover:text-red-400"
              onClick={() => {setFile(null);setConvertedUrl(null);}}>

                Change
              </Button>
            </div>

            {!convertedUrl &&
          <div className="space-y-4">
                {isProcessing &&
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <div
                className="bg-purple-500 h-full transition-all duration-500"
                style={{ width: `${progress}%` }}>
              </div>
                  </div>
            }
                
                <Button
              onClick={processFile}
              disabled={isProcessing}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold h-12 rounded-xl">

                  {isProcessing ?
              <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing... {progress}%
                    </> :

              <>
                      <Activity className="w-5 h-5 mr-2" /> Convert to 432Hz
                    </>
              }
                </Button>
              </div>
          }

            {convertedUrl &&
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 pt-4 border-t border-white/10">

                <div className="flex justify-center">
                   <div className="bg-emerald-500/10 text-emerald-400 px-4 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                      <Activity className="w-4 h-4" /> Conversion Complete
                   </div>
                </div>
                
                <a
              href={convertedUrl}
              download={`${originalName}_432hz.wav`}
              className="block">

                  <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold h-12 rounded-xl">
                    <Download className="w-5 h-5 mr-2" /> Download Converted Audio
                  </Button>
                </a>
                
                <p className="text-xs text-gray-500">
                  File is processed locally in your browser.
                </p>
              </motion.div>
          }
          </div>
        }

      </div>
      
      <div className="grid md:grid-cols-3 gap-6 text-center">
        <Feature icon={<Activity />} title="Natural Pitch" desc="Lowers pitch by approx 1.8% to align with 432Hz." />
        <Feature icon={<Waves />} title="Lossless Processing" desc="Uses browser's audio engine for high quality 32-bit float processing." />
        <Feature icon={<Download />} title="Private & Fast" desc="No server upload required. Conversions happen instantly on your device." />
      </div>
    </div>);

}

function Feature({ icon, title, desc }) {
  return (
    <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
      <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
        {icon}
      </div>
      <h3 className="text-white font-bold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{desc}</p>
    </div>);

}