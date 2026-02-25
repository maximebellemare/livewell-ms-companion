import { useState, useRef, useCallback } from "react";
import { Mic, Square } from "lucide-react";
import { toast } from "sonner";

interface Props {
  onTranscript: (text: string) => void;
}

const SpeechRecognition =
  typeof window !== "undefined"
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

/** Compact mic icon button for inline voice input */
const VoiceMicButton = ({ onTranscript }: Props) => {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  if (!SpeechRecognition) return null;

  const start = () => {
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    let finalText = "";

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript + " ";
        }
      }
      if (finalText.trim()) {
        onTranscript(finalText.trim());
        finalText = "";
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed") {
        toast.error("Microphone access denied.");
      }
      setListening(false);
    };

    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    toast.success("Listening…", { duration: 1500 });
  };

  const stop = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  return (
    <button
      onClick={listening ? stop : start}
      className={`inline-flex items-center justify-center rounded-lg p-1.5 transition-all active:scale-95 ${
        listening
          ? "bg-destructive/15 text-destructive"
          : "bg-primary/10 text-primary hover:bg-primary/20"
      }`}
      title={listening ? "Stop recording" : "Voice input"}
    >
      {listening ? (
        <Square className="h-3.5 w-3.5 animate-pulse" />
      ) : (
        <Mic className="h-3.5 w-3.5" />
      )}
    </button>
  );
};

export default VoiceMicButton;
