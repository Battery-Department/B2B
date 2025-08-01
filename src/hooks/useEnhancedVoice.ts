import { useState, useRef, useEffect, useCallback } from 'react'

interface VoiceRecognitionState {
  isListening: boolean
  isSupported: boolean
  confidence: number
  partialTranscript: string
  finalTranscript: string
  error?: string
  volume: number
}

interface VoiceRecognitionOptions {
  continuous?: boolean
  interimResults?: boolean
  language?: string
  maxAlternatives?: number
}

export const useEnhancedVoice = (options: VoiceRecognitionOptions = {}) => {
  const [state, setState] = useState<VoiceRecognitionState>({
    isListening: false,
    isSupported: false,
    confidence: 0,
    partialTranscript: '',
    finalTranscript: '',
    volume: 0
  })

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const animationFrameRef = useRef<number>()

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
      
      if (SpeechRecognition) {
        setState(prev => ({ ...prev, isSupported: true }))
        
        const recognition = new SpeechRecognition()
        recognition.continuous = options.continuous ?? true
        recognition.interimResults = options.interimResults ?? true
        recognition.lang = options.language ?? 'en-US'
        recognition.maxAlternatives = options.maxAlternatives ?? 1

        // Event handlers
        recognition.onstart = () => {
          setState(prev => ({ 
            ...prev, 
            isListening: true, 
            error: undefined,
            partialTranscript: '',
            finalTranscript: ''
          }))
        }

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let interimTranscript = ''
          let finalTranscript = ''
          let maxConfidence = 0

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i]
            const transcript = result[0].transcript
            const confidence = result[0].confidence || 0

            if (result.isFinal) {
              finalTranscript += transcript
              maxConfidence = Math.max(maxConfidence, confidence)
            } else {
              interimTranscript += transcript
            }
          }

          setState(prev => ({
            ...prev,
            partialTranscript: interimTranscript,
            finalTranscript: prev.finalTranscript + finalTranscript,
            confidence: maxConfidence
          }))
        }

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          let errorMessage = 'Speech recognition error'
          
          switch (event.error) {
            case 'no-speech':
              errorMessage = 'No speech detected. Please try speaking again.'
              break
            case 'audio-capture':
              errorMessage = 'Microphone not accessible. Please check permissions.'
              break
            case 'not-allowed':
              errorMessage = 'Microphone access denied. Please allow microphone access.'
              break
            case 'network':
              errorMessage = 'Network error occurred during speech recognition.'
              break
            case 'aborted':
              errorMessage = 'Speech recognition was aborted.'
              break
            default:
              errorMessage = `Speech recognition error: ${event.error}`
          }

          setState(prev => ({
            ...prev,
            isListening: false,
            error: errorMessage
          }))
        }

        recognition.onend = () => {
          setState(prev => ({ ...prev, isListening: false }))
          stopVolumeMonitoring()
        }

        recognitionRef.current = recognition
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
      stopVolumeMonitoring()
    }
  }, [])

  // Volume monitoring for visual feedback
  const startVolumeMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream)
      
      microphoneRef.current.connect(analyserRef.current)
      analyserRef.current.fftSize = 256
      
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
      
      const updateVolume = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray)
          
          let sum = 0
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i]
          }
          
          const average = sum / dataArray.length
          const normalizedVolume = Math.min(100, Math.max(0, (average / 128) * 100))
          
          setState(prev => ({ ...prev, volume: normalizedVolume }))
          
          if (state.isListening) {
            animationFrameRef.current = requestAnimationFrame(updateVolume)
          }
        }
      }
      
      updateVolume()
    } catch (error) {
      console.error('Error starting volume monitoring:', error)
    }
  }

  const stopVolumeMonitoring = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }
    
    setState(prev => ({ ...prev, volume: 0 }))
  }

  const startListening = useCallback((onResult?: (text: string) => void) => {
    if (recognitionRef.current && state.isSupported && !state.isListening) {
      // Clear previous transcripts
      setState(prev => ({ 
        ...prev, 
        partialTranscript: '', 
        finalTranscript: '',
        error: undefined 
      }))
      
      // Set up result handler
      if (onResult) {
        const handleResult = () => {
          if (state.finalTranscript) {
            onResult(state.finalTranscript)
          }
        }
        
        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          // ... existing result handling logic ...
          
          // Call onResult when we have final transcript
          if (state.finalTranscript) {
            setTimeout(() => onResult(state.finalTranscript), 100)
          }
        }
      }
      
      try {
        recognitionRef.current.start()
        startVolumeMonitoring()
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          error: 'Failed to start voice recognition. Please try again.' 
        }))
      }
    }
  }, [state.isSupported, state.isListening, state.finalTranscript])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && state.isListening) {
      recognitionRef.current.stop()
    }
  }, [state.isListening])

  const abortListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort()
    }
    stopVolumeMonitoring()
  }, [])

  // Clear transcripts
  const clearTranscripts = useCallback(() => {
    setState(prev => ({
      ...prev,
      partialTranscript: '',
      finalTranscript: '',
      confidence: 0
    }))
  }, [])

  // Get formatted transcript for display
  const getDisplayTranscript = useCallback(() => {
    if (state.finalTranscript && state.partialTranscript) {
      return state.finalTranscript + ' ' + state.partialTranscript
    }
    return state.finalTranscript || state.partialTranscript
  }, [state.finalTranscript, state.partialTranscript])

  // Voice activity detection
  const hasVoiceActivity = state.volume > 10 && state.isListening

  return {
    ...state,
    startListening,
    stopListening,
    abortListening,
    clearTranscripts,
    getDisplayTranscript,
    hasVoiceActivity,
    
    // Helper methods
    canStart: state.isSupported && !state.isListening,
    canStop: state.isListening,
    hasError: !!state.error,
    hasTranscript: !!(state.finalTranscript || state.partialTranscript),
    
    // Voice activity indicator for UI
    voiceActivityLevel: Math.min(100, state.volume),
    
    // Confidence indicator
    confidenceLevel: state.confidence > 0.8 ? 'high' : 
                    state.confidence > 0.6 ? 'medium' : 'low'
  }
}

export default useEnhancedVoice