import React, { useEffect, useState } from 'react';
import { ShapeType } from '../types';

interface UIOverlayProps {
  currentShape: ShapeType;
  setShape: (s: ShapeType) => void;
  color: string;
  setColor: (c: string) => void;
  expansion: number;
  tension: number;
  isConnected: boolean;
  onConnect: () => void;
  lastUpdate?: number;
}

const UIOverlay: React.FC<UIOverlayProps> = ({
  currentShape,
  setShape,
  color,
  setColor,
  expansion,
  tension,
  isConnected,
  onConnect,
  lastUpdate
}) => {
  const [isActive, setIsActive] = useState(false);

  // Blink effect when updates arrive
  useEffect(() => {
    if (lastUpdate && lastUpdate > 0) {
        setIsActive(true);
        const t = setTimeout(() => setIsActive(false), 150);
        return () => clearTimeout(t);
    }
  }, [lastUpdate]);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
      {/* Header / Connection Status */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Gemini Kinetic
          </h1>
          <p className="text-xs text-gray-400 mt-1">Interactive AI Particle System</p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
            {!isConnected ? (
                <button 
                    onClick={onConnect}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-full font-semibold transition-all shadow-lg shadow-blue-900/50 backdrop-blur-md border border-white/10"
                >
                    Start AI Camera
                </button>
            ) : (
                <div className={`flex items-center gap-2 px-4 py-2 border rounded-full backdrop-blur-md transition-all duration-200 ${isActive ? 'bg-green-500/30 border-green-400 text-green-200 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'bg-green-900/30 border-green-500/30 text-green-400'}`}>
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <span className="text-sm font-medium">{isActive ? 'Receiving Data...' : 'Live Connected'}</span>
                </div>
            )}
            
            {/* Debug Stats */}
            <div className="bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/5 text-xs text-gray-300 w-48">
                <div className="flex justify-between mb-1">
                    <span>Expansion</span>
                    <span className="font-mono text-blue-300">{(expansion * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-700 h-1 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full transition-all duration-300" style={{ width: `${expansion * 100}%` }} />
                </div>
                
                <div className="flex justify-between mt-2 mb-1">
                    <span>Tension</span>
                    <span className="font-mono text-red-300">{(tension * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-700 h-1 rounded-full overflow-hidden">
                    <div className="bg-red-500 h-full transition-all duration-300" style={{ width: `${tension * 100}%` }} />
                </div>
            </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="flex flex-col gap-4 pointer-events-auto max-w-2xl">
        
        {/* Color Picker */}
        <div className="flex gap-2 bg-black/40 backdrop-blur-md p-2 rounded-full border border-white/5 w-fit">
            {['#ffffff', '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'].map((c) => (
                <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                />
            ))}
            <input 
                type="color" 
                value={color} 
                onChange={(e) => setColor(e.target.value)}
                className="w-6 h-6 rounded-full overflow-hidden opacity-0 absolute ml-last cursor-pointer" 
            />
        </div>

        {/* Template Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {Object.values(ShapeType).map((s) => (
                <button
                    key={s}
                    onClick={() => setShape(s)}
                    className={`
                        px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap
                        ${currentShape === s 
                            ? 'bg-white/20 text-white border border-white/20 shadow-lg shadow-white/5' 
                            : 'bg-black/30 text-gray-400 hover:bg-black/50 border border-transparent'}
                    `}
                >
                    {s}
                </button>
            ))}
        </div>
      </div>
    </div>
  );
};

export default UIOverlay;