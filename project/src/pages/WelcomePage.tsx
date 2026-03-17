import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { BookOpen, Users, Trophy } from 'lucide-react';

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-black-900 mb-6">
            Welcome to <span className="text-blue-500">schools</span>
          </h1>
          
          <blockquote className="text-xl md:text-2xl text-gray-600 mb-12 font-light italic max-w-4xl mx-auto">
            "Education is the most powerful weapon which you can use to change the world."
            <footer className="text-lg mt-2 text-gray-500"><span className='text-blue-500'>— Nelson Mandela</span></footer>
          </blockquote>

          <div className="grid md:grid-cols-3 gap-8 mb-12 max-w-4xl mx-auto">
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Learn Together</h3>
              <p className="text-gray-600">Connect with educators and students across institutions</p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Collaborate</h3>
              <p className="text-gray-600">Share knowledge and grow together in a supportive community</p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <Trophy className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Compete & Excel</h3>
              <p className="text-gray-600">Challenge yourself through friendly academic competitions</p>
            </div>
          </div>

          <Button 
            size="lg" 
            onClick={() => navigate('/schools')}
            // className="bg-blue-600 hover:bg-blue-700 transform hover:scale-105 transition-all duration-200"
            variant='outline'
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
};