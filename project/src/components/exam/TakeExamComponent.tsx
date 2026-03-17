import React, { useState, useEffect } from 'react';
import { Question } from '../../data/mockData';
import { Button } from '../common/Button';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';

interface TakeExamComponentProps {
  questions: Question[];
  duration: number; // in minutes
  onSubmit: (answers: number[]) => void;
}

export const TakeExamComponent: React.FC<TakeExamComponentProps> = ({
  questions,
  duration,
  onSubmit
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>(new Array(questions.length).fill(-1));
  const [timeLeft, setTimeLeft] = useState(duration * 60); // Convert to seconds
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (timeLeft > 0 && !submitted) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeLeft, submitted]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (optionIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleSubmit = () => {
    if (submitted) return;
    setSubmitted(true);
    onSubmit(answers);
  };

  const getTimeColor = () => {
    const percentage = (timeLeft / (duration * 60)) * 100;
    if (percentage > 50) return 'text-green-600';
    if (percentage > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = answers.filter(answer => answer !== -1).length;

  return (
    <div className="space-y-6">
      {/* Header with timer and progress */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Clock className={`h-5 w-5 ${getTimeColor()}`} />
            <span className={`font-mono text-lg font-semibold ${getTimeColor()}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
        </div>
        <div className="text-sm text-gray-600">
          Answered: {answeredCount}/{questions.length}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {currentQuestion.text}
        </h2>

        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => (
            <label
              key={index}
              className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                answers[currentQuestionIndex] === index
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name={`question-${currentQuestionIndex}`}
                value={index}
                checked={answers[currentQuestionIndex] === index}
                onChange={() => handleAnswerSelect(index)}
                className="sr-only"
              />
              <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                answers[currentQuestionIndex] === index
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
              }`}>
                {answers[currentQuestionIndex] === index && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
              <span className="text-gray-900">{option}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className="flex items-center space-x-2"
        >
          <ChevronLeft size={16} />
          <span>Previous</span>
        </Button>

        <div className="text-sm text-gray-600">
          {answers[currentQuestionIndex] !== -1 ? (
            <span className="text-green-600 flex items-center space-x-1">
              <CheckCircle size={16} />
              <span>Answered</span>
            </span>
          ) : (
            <span className="text-amber-600">Not answered</span>
          )}
        </div>

        {!isLastQuestion ? (
          <Button
            onClick={handleNext}
            className="flex items-center space-x-2"
          >
            <span>Next</span>
            <ChevronRight size={16} />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            variant="success"
            className="flex items-center space-x-2"
            disabled={submitted}
          >
            <CheckCircle size={16} />
            <span>Submit Exam</span>
          </Button>
        )}
      </div>

      {/* Question overview */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Question Overview</h3>
        <div className="grid grid-cols-10 gap-2">
          {questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestionIndex(index)}
              className={`w-8 h-8 rounded text-xs font-medium transition-colors ${
                index === currentQuestionIndex
                  ? 'bg-blue-500 text-white'
                  : answers[index] !== -1
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};