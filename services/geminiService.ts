import { GoogleGenAI, FunctionDeclaration, Type, Modality, LiveServerMessage } from '@google/genai';

type InteractionCallback = (data: { expansion: number; tension: number; shape?: string }) => void;

export class GeminiLiveService {
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private streamInterval: number | null = null;
  private onInteraction: InteractionCallback | null = null;
  private isConnected = false;
  private sessionPromise: Promise<any> | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  constructor(private apiKey: string) {}

  // Initialize and connect
  async connect(
    onInteraction: InteractionCallback, 
    videoEl: HTMLVideoElement,
    stream: MediaStream
  ) {
    this.onInteraction = onInteraction;
    this.videoElement = videoEl;
    this.canvasElement = document.createElement('canvas');

    const ai = new GoogleGenAI({ apiKey: this.apiKey });

    // Define the tool for the model to use
    const updateParticlesTool: FunctionDeclaration = {
      name: 'updateParticleControl',
      parameters: {
        type: Type.OBJECT,
        description: 'Updates the particle system based on hand gestures. Call this continuously.',
        properties: {
          expansion: {
            type: Type.NUMBER,
            description: 'Distance between hands. 0.0 (touching) to 1.0 (arms wide).',
          },
          tension: {
            type: Type.NUMBER,
            description: 'Movement energy. 0.0 (still/slow) to 1.0 (shaking/fast).',
          },
          shape: {
            type: Type.STRING,
            description: 'Only set if user asks for a shape: Heart, Flower, Saturn, Meditate, Fireworks, Sphere.',
            enum: ['Heart', 'Flower', 'Saturn', 'Meditate', 'Fireworks', 'Sphere']
          }
        },
        required: ['expansion', 'tension'],
      },
    };

    const systemInstruction = `
      You are a high-speed Motion Capture Engine. 
      Your ONLY job is to analyze the video stream and control the 3D particles.
      
      OPERATIONAL RULES:
      1.  **VISUAL PRIORITY**: Ignore audio unless it is a specific command (e.g., "Change shape"). Focus 99% on the video.
      2.  **GAME LOOP**: You must output the 'updateParticleControl' tool call CONTINUOUSLY (aim for every 100-200ms). Do not stop.
      3.  **SILENCE**: Do NOT speak. Do NOT reply with text or audio. ONLY call the tool.
      
      GESTURE MAPPING:
      - **EXPANSION (0.0 - 1.0)**: 
        - Hands touching / Fists closed = 0.0
        - Hands shoulder width = 0.5
        - Hands fully extended = 1.0
      - **TENSION (0.0 - 1.0)**:
        - Smooth, slow, floating = 0.0
        - Fast, jerky, energetic = 1.0
      
      If you see no hands, maintain the last known state or default to Expansion: 0.5, Tension: 0.0.
      React INSTANTLY to movement.
    `;

    this.sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      callbacks: {
        onopen: () => {
          console.log('Gemini Live Connected');
          this.isConnected = true;
          this.startAudioStreaming(stream);
          this.startVideoStreaming();
        },
        onmessage: (message: LiveServerMessage) => {
          // Handle tool calls
          if (message.toolCall) {
            for (const fc of message.toolCall.functionCalls) {
              if (fc.name === 'updateParticleControl') {
                const args = fc.args as any;
                if (this.onInteraction) {
                  this.onInteraction({
                    expansion: args.expansion,
                    tension: args.tension,
                    shape: args.shape
                  });
                }
                
                // Respond to the tool call to keep the loop going (acknowledgment)
                this.sessionPromise?.then((session: any) => {
                  session.sendToolResponse({
                    functionResponses: {
                      id: fc.id,
                      name: fc.name,
                      response: { result: 'ok' }
                    }
                  });
                });
              }
            }
          }
        },
        onclose: () => {
          console.log('Gemini Live Closed');
          this.disconnect();
        },
        onerror: (err: any) => {
          console.error('Gemini Live Error', err);
        }
      },
      config: {
        responseModalities: [Modality.AUDIO], 
        tools: [{ functionDeclarations: [updateParticlesTool] }],
        systemInstruction: systemInstruction,
      },
    });
  }

  private startAudioStreaming(stream: MediaStream) {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.source = this.audioContext.createMediaStreamSource(stream);
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
    
    this.processor.onaudioprocess = (e) => {
      if (!this.isConnected) return;
      
      const inputData = e.inputBuffer.getChannelData(0);
      const b64Data = this.pcmToB64(inputData);

      this.sessionPromise?.then((session: any) => {
        session.sendRealtimeInput({
          media: {
            mimeType: 'audio/pcm;rate=16000',
            data: b64Data
          }
        });
      });
    };

    this.source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
  }

  private pcmToB64(data: Float32Array): string {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        let s = Math.max(-1, Math.min(1, data[i]));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    let binary = '';
    const bytes = new Uint8Array(int16.buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private startVideoStreaming() {
    if (this.streamInterval) clearInterval(this.streamInterval);

    // 10 FPS
    this.streamInterval = window.setInterval(async () => {
      if (!this.videoElement || !this.canvasElement || !this.isConnected) return;
      
      const video = this.videoElement;
      if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) return;

      const ctx = this.canvasElement.getContext('2d');
      if (!ctx) return;

      // Scale 0.5 is a good balance for performance/quality
      const scale = 0.5; 
      if (this.canvasElement.width !== video.videoWidth * scale) {
          this.canvasElement.width = video.videoWidth * scale;
          this.canvasElement.height = video.videoHeight * scale;
      }

      ctx.drawImage(video, 0, 0, this.canvasElement.width, this.canvasElement.height);

      const base64Data = this.canvasElement.toDataURL('image/jpeg', 0.6).split(',')[1];

      this.sessionPromise?.then((session: any) => {
        session.sendRealtimeInput({
          media: {
            mimeType: 'image/jpeg',
            data: base64Data
          }
        });
      });

    }, 100); 
  }

  private cleanup() {
    this.isConnected = false;
    if (this.streamInterval) {
      clearInterval(this.streamInterval);
      this.streamInterval = null;
    }
    if (this.processor) {
        this.processor.disconnect();
        this.processor = null;
    }
    if (this.source) {
        this.source.disconnect();
        this.source = null;
    }
    if (this.audioContext) {
        this.audioContext.close();
        this.audioContext = null;
    }
  }

  async disconnect() {
    this.cleanup();
  }
}