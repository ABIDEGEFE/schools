import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { api } from '../utils/api';
import { Exam, Question } from '../data/mockData';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Calendar, Clock, FileText, CheckCircle } from 'lucide-react';
import { ExamEnvironmentChecker } from '../components/exam/ExamEnvironmentChecker';
import { TakeExamComponent } from '../components/exam/TakeExamComponent';

export const ExamsPage: React.FC = () => {
  const { state } = useAuth();
  const { addNotification } = useNotifications();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [examStep, setExamStep] = useState<'verification' | 'exam' | 'results'>('verification');
  const [examResults, setExamResults] = useState<{ score: number; passed: boolean } | null>(null);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const examData = await api.getExams();
        setExams(examData);
      } catch (error) {
        addNotification({
          message: 'Error loading exams',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, [addNotification]);

  const handleTakeExam = async (exam: Exam) => {
    setSelectedExam(exam);
    setExamStep('verification');
    
    try {
      const questions = await api.getExamQuestions(exam.id);
      setExamQuestions(questions);
    } catch (error) {
      addNotification({
        message: 'Error loading exam questions',
        type: 'error'
      });
    }
  };

  const handleVerificationComplete = () => {
    setExamStep('exam');
  };

  const handleExamSubmit = async (answers: number[]) => {
    if (!selectedExam) return;

    try {
      const results = await api.submitExam(selectedExam.id, answers);
      setExamResults(results);
      setExamStep('results');
      
      addNotification({
        message: results.passed ? 'Congratulations! You passed the exam!' : 'Keep studying and try again!',
        type: results.passed ? 'success' : 'info'
      });
    } catch (error) {
      addNotification({
        message: 'Error submitting exam',
        type: 'error'
      });
    }
  };

  const handleCloseExam = () => {
    setSelectedExam(null);
    setExamQuestions([]);
    setExamStep('verification');
    setExamResults(null);
  };

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) >= new Date();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const upcomingExams = exams.filter(exam => isUpcoming(exam.date));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Exams</h1>
        <p className="text-gray-600">View and take your scheduled examinations</p>
      </div>

      {upcomingExams.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {upcomingExams.map((exam) => (
            <div key={exam.id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{exam.subject}</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(exam.date)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>{exam.duration} minutes</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>{exam.numberOfQuestions} questions</span>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => handleTakeExam(exam)}
                className="w-full flex items-center justify-center space-x-2"
              >
                <FileText size={16} />
                <span>Take Exam</span>
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Upcoming Exams</h3>
          <p className="text-gray-600">Check back later for new exam schedules</p>
        </div>
      )}

      {/* Exam Modal */}
      <Modal
        isOpen={!!selectedExam}
        onClose={handleCloseExam}
        title={selectedExam ? `${selectedExam.subject} Exam` : ''}
        size="xl"
      >
        {selectedExam && (
          <div>
            {examStep === 'verification' && (
              <ExamEnvironmentChecker onVerificationComplete={handleVerificationComplete} />
            )}
            
            {examStep === 'exam' && (
              <TakeExamComponent
                questions={examQuestions}
                duration={selectedExam.duration}
                onSubmit={handleExamSubmit}
              />
            )}
            
            {examStep === 'results' && examResults && (
              <div className="text-center space-y-4">
                <div className={`p-8 rounded-lg ${examResults.passed ? 'bg-green-50' : 'bg-red-50'}`}>
                  <CheckCircle className={`h-16 w-16 mx-auto mb-4 ${examResults.passed ? 'text-green-500' : 'text-red-500'}`} />
                  <h3 className={`text-2xl font-bold mb-2 ${examResults.passed ? 'text-green-800' : 'text-red-800'}`}>
                    {examResults.passed ? 'Congratulations!' : 'Keep Studying!'}
                  </h3>
                  <p className="text-lg text-gray-700 mb-4">
                    Your Score: {examResults.score.toFixed(1)}%
                  </p>
                  <p className="text-gray-600">
                    {examResults.passed 
                      ? 'You have successfully passed this exam!' 
                      : 'You need 70% or higher to pass. Keep practicing and try again!'
                    }
                  </p>
                </div>
                <Button onClick={handleCloseExam} size="lg">
                  Close
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};