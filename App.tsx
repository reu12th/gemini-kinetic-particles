import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ShapeType } from './types';
import ParticleScene from './components/ParticleScene';
import UIOverlay from './components/UIOverlay';
import { GeminiLiveService } from './services/geminiService';

const App: React.FC = () => {
  const [shape, setShape] = useState<ShapeType>(ShapeType.HEART);
  const [color, setColor] = useState<string>('#3b82f6');
  const [expansion, setExpansion] = useState<number>(0.8);
  const [tension, setTension] = useState<number>(0.0);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastUpdate, setLastUpdate] = useState<number>(0); // Timestamp of last AI update
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const geminiServiceRef = useRef<GeminiLiveService | null>(null);

  const handleConnect = async () => {
    try {
        if (!process.env.API_KEY) {
            alert('Please provide a valid API_KEY in the environment.');
            return;
        }

        // Get Camera
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 640 },
                height: { ideal: 480 },
                frameRate: { ideal: 24 } 
            },
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });
        
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            // Crucial: Wait for video to actually start playing
            await videoRef.current.play();
            videoRef.current.muted = true; 
        }

        const service = new GeminiLiveService(process.env.API_KEY);
        geminiServiceRef.current = service;

        // Pass the stream to the service so it can extract audio
        await service.connect((data) => {
            // Update state from AI
            setLastUpdate(Date.now());
            
            if (data.expansion !== undefined) setExpansion(data.expansion);
            if (data.tension !== undefined) setTension(data.tension);
            
            if (data.shape) {
                const matchedShape = Object.values(ShapeType).find(s => s.toLowerCase() === data.shape?.toLowerCase());
                if (matchedShape) setShape(matchedShape);
            }
        }, videoRef.current!, stream);

        setIsConnected(true);

    } catch (err) {
        console.error("Failed to connect:", err);
        alert("Failed to start camera or connect to AI. Check permissions and console.");
    }
  };

  useEffect(() => {
    return () => {
        geminiServiceRef.current?.disconnect();
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-black">
      {/* Hidden Video Element for Capture */}
      <video ref={videoRef} className="absolute opacity-0 pointer-events-none" playsInline />

      <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
        <color attach="background" args={['#050505']} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        
        <ParticleScene 
            shape={shape} 
            expansion={expansion} 
            tension={tension} 
            color={color} 
        />
        
        <OrbitControls 
            enableZoom={true} 
            enablePan={false} 
            autoRotate={!isConnected} // Rotate when idle
            autoRotateSpeed={0.5}
        />
      </Canvas>

      <UIOverlay 
        currentShape={shape}
        setShape={setShape}
        color={color}
        setColor={setColor}
        expansion={expansion}
        tension={tension}
        isConnected={isConnected}
        onConnect={handleConnect}
        lastUpdate={lastUpdate}
      />
    </div>
  );
};

export default App;