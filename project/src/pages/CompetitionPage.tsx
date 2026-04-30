import React from 'react';
import { Button } from '../components/common/Button';


export const CompetitionPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Competitions</h1>
          <p className="text-gray-600">Participate in school competitions and track your performance</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Placeholder for competition cards */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Math Olympiad</h2>
            <p className="text-gray-600 mb-4">Compete in challenging math problems and showcase your skills.</p>
            <Button variant="primary">Compete now</Button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Science Fair</h2>
            <p className="text-gray-600 mb-4">Present your science projects and innovations.</p>
            <Button variant="primary">Join Competition</Button>
          </div>

          {/* Add more competition cards as needed */}
        </div>  

        </div>  
        </div>
  );
};
