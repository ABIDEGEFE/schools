import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface Question {
  id: string;
  text: string;
  options: string[];
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';
type AnswerFeedback = 'correct' | 'wrong' | null;

const StartCompetitionPage: React.FC = () => {
  const navigate = useNavigate();
  const { state }= useAuth();

  // Game State
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes
  const [hasAnswered, setHasAnswered] = useState(false);
  const [opponentStatus, setOpponentStatus] = useState<'thinking' | 'answered'>('thinking');
  const [gameResult, setGameResult] = useState<'winner' | 'loser' | 'draw' | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answerFeedback, setAnswerFeedback] = useState<AnswerFeedback>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [statusMessage, setStatusMessage] = useState('Connecting to competition server...');
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);

  // Video Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  const resolveWsUrl = () => {
    const envUrl = import.meta.env.VITE_COMPETITION_WS_URL as string | undefined;
    if (envUrl && envUrl.trim().length > 0) {
      return envUrl;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.hostname}:8080/questions`;
  };

  const normalizeQuestion = (payload: unknown): Question | null => {
    if (!payload || typeof payload !== 'object') return null;

    const data = payload as Record<string, unknown>;
    const nested = (data.question && typeof data.question === 'object'
      ? data.question
      : null) as Record<string, unknown> | null;

    const source = nested ?? data;
    const textCandidate = source.text ?? source.Text;
    if (typeof textCandidate !== 'string' || textCandidate.trim().length === 0) {
      return null;
    }

    const optionsCandidate = source.options;
    const normalizedOptions = Array.isArray(optionsCandidate)
      ? optionsCandidate.filter((opt): opt is string => typeof opt === 'string' && opt.trim().length > 0)
      : [];

    const idCandidate = source.id ?? source.qid ?? source.Qid;
    const normalizedId = typeof idCandidate === 'string' || typeof idCandidate === 'number'
      ? String(idCandidate)
      : `${Date.now()}`;

    return {
      id: normalizedId,
      text: textCandidate,
      options: normalizedOptions.length > 0 ? normalizedOptions : ['True', 'False'],
    };
  };

  const handleIncomingMessage = (rawMessage: string) => {
    let parsed: unknown;

    try {
      parsed = JSON.parse(rawMessage);
    } catch {
      setStatusMessage('Received malformed message from server.');
      return;
    }

    if (!parsed || typeof parsed !== 'object') return;

    const msg = parsed as Record<string, unknown>;

    const opponentState = msg.opponentStatus;
    if (opponentState === 'thinking' || opponentState === 'answered') {
      setOpponentStatus(opponentState);
    }

    const winnerResult = msg.result;
    const typedResult = msg.type === 'game_result' ? msg.outcome ?? msg.result : null;
    const result = typedResult ?? winnerResult;
    if (result === 'winner' || result === 'loser' || result === 'draw') {
      setGameResult(result);
      setStatusMessage('Competition completed.');
      return;
    }

    const correctFlag = msg.correct;
    const scoreMessage = msg.message;
    const isAnswerResult =
      msg.type === 'answer_result' ||
      typeof correctFlag === 'boolean' ||
      scoreMessage === '1' ||
      scoreMessage === '0';

    if (isAnswerResult) {
      const isCorrect = typeof correctFlag === 'boolean' ? correctFlag : scoreMessage === '1';
      setAnswerFeedback(isCorrect ? 'correct' : 'wrong');
      setStatusMessage(isCorrect ? 'Correct answer. Waiting for next question...' : 'Wrong answer. Waiting for next question...');
      setOpponentStatus('answered');
      setIsSubmittingAnswer(false);
    }

    const incomingQuestion = normalizeQuestion(parsed);
    if (incomingQuestion) {
      setCurrentQuestion(incomingQuestion);
      setQuestionIndex((prev) => prev + 1);
      setHasAnswered(false);
      setSelectedOption(null);
      setAnswerFeedback(null);
      setIsSubmittingAnswer(false);
      setOpponentStatus('thinking');
      setStatusMessage('Question received. Choose your answer.');
    }
  };

  // Connect to Go WS service and keep listening for questions/results.
  useEffect(() => {
    mountedRef.current = true;

    const connect = () => {
      if (!mountedRef.current) return;

      const wsUrl = resolveWsUrl();
      setConnectionStatus('connecting');
      setStatusMessage('Connecting to competition server...');

      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        setConnectionStatus('connected');
        setStatusMessage('Connected. Waiting for first question...');
      };

      socket.onmessage = (event) => {
        handleIncomingMessage(event.data);
      };

      socket.onerror = () => {
        setConnectionStatus('error');
        setStatusMessage('Connection error. Retrying...');
      };

      socket.onclose = () => {
        wsRef.current = null;
        if (!mountedRef.current || gameResult) return;

        setConnectionStatus('disconnected');
        setStatusMessage('Disconnected. Reconnecting...');
        reconnectRef.current = window.setTimeout(connect, 2000);
      };
    };

    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }
      try {
        wsRef.current?.close();
      } catch {
        // no-op
      }
      wsRef.current = null;
    };
  }, [gameResult]);

  // Handle Answer Selection
  const handleAnswer = (option: string) => {
    if (!currentQuestion || hasAnswered || isSubmittingAnswer || !wsRef.current) return;
    if (wsRef.current.readyState !== WebSocket.OPEN) {
      setStatusMessage('Socket is not connected. Please wait...');
      return;
    }

    setSelectedOption(option);
    setHasAnswered(true);
    setIsSubmittingAnswer(true);
    setStatusMessage('Answer submitted. Waiting for evaluation...');

    wsRef.current.send(JSON.stringify({
      answer: option,
      questionId: currentQuestion.id,
      competitionId: state.competition.id,
      userId: state.user?.id,
      opponentId: state.competition.opponent?.id,
    }));
  };

  const connectionBadgeClass =
    connectionStatus === 'connected'
      ? 'bg-green-500/20 text-green-300 border-green-500/50'
      : connectionStatus === 'connecting'
        ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
        : 'bg-red-500/20 text-red-300 border-red-500/50';

  const getOptionClassName = (option: string) => {
    const isSelected = selectedOption === option;

    if (!hasAnswered) {
      return isSelected
        ? 'border-blue-300 bg-blue-700'
        : 'border-blue-500 hover:bg-blue-600 hover:border-blue-400';
    }

    if (isSelected && answerFeedback === 'correct') {
      return 'border-green-400 bg-green-700';
    }

    if (isSelected && answerFeedback === 'wrong') {
      return 'border-red-400 bg-red-700';
    }

    return 'border-gray-600 bg-gray-700 opacity-60 cursor-not-allowed';
  };

  // Timer Logic
  useEffect(() => {
    if (timeLeft > 0 && !gameResult) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, gameResult]);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white overflow-hidden">
      
      {/* SECTION 1: Top Half (Videos) - Split Vertically */}
      <div className="flex h-1/2 border-b border-gray-700">
        {/* User 1 Video (Local) */}
        <div className="relative w-1/2 border-r border-gray-700 bg-black flex items-center justify-center">
          <video ref={localVideoRef} autoPlay muted className="w-full h-full object-cover" />
          <div className="absolute bottom-4 left-4 bg-black/50 px-2 py-1 rounded text-sm">
            You {hasAnswered && "✅"}
          </div>
        </div>

        {/* User 2 Video (Opponent) */}
        <div className="relative w-1/2 bg-black flex items-center justify-center">
          <video ref={remoteVideoRef} autoPlay className="w-full h-full object-cover" />
          <div className="absolute bottom-4 right-4 bg-black/50 px-2 py-1 rounded text-sm">
            Opponent {opponentStatus === 'answered' && "✅"}
          </div>
          {/* Status Overlay */}
          <div className="absolute top-4 right-4 text-xs font-mono uppercase tracking-widest text-yellow-500">
            {opponentStatus === 'thinking' ? "Choosing..." : "Waiting for you"}
          </div>
        </div>
      </div>

      {/* SECTION 2: Bottom Half (Questions) */}
      <div className="h-1/2 p-6 flex flex-col items-center justify-between bg-gray-800">
        
        {/* Timer & Progress */}
        <div className="w-full flex justify-between items-center mb-4">
          <div className={`text-2xl font-bold ${timeLeft < 20 ? 'text-red-500 animate-pulse' : 'text-green-400'}`}>
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-gray-400 uppercase text-xs tracking-widest">Round {questionIndex || 1}</div>
            <div className={`text-xs px-2 py-1 rounded border ${connectionBadgeClass}`}>
              {connectionStatus}
            </div>
          </div>
        </div>

        <div className="w-full max-w-2xl text-center text-sm text-gray-300 mb-2 min-h-[1.25rem]">
          {statusMessage}
        </div>

        {/* Question Area */}
        <div className="max-w-2xl w-full text-center">
          <h2 className="text-2xl md:text-3xl font-semibold mb-8">
            {currentQuestion?.text || "Waiting for the next question..."}
          </h2>

          <div className="grid grid-cols-2 gap-4 w-full">
            {currentQuestion?.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(option)}
                disabled={hasAnswered || isSubmittingAnswer || connectionStatus !== 'connected'}
                className={`py-4 px-6 rounded-xl border-2 transition-all duration-200 text-lg
                  ${getOptionClassName(option)}`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Final Result Modal/Overlay */}
        {gameResult && (
          <div className="absolute inset-0 bg-black/90 flex flex-center items-center justify-center z-50">
            <div className="text-center">
              <h1 className={`text-6xl font-black mb-4 ${gameResult === 'winner' ? 'text-yellow-400' : 'text-red-500'}`}>
                YOU {gameResult.toUpperCase()}!
              </h1>
              <button 
                onClick={() => navigate('/profile')}
                className="mt-6 bg-white text-black px-8 py-3 rounded-full font-bold"
              >
                Return to Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StartCompetitionPage;