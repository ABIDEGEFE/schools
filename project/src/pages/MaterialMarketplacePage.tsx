import React, { useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { Button } from '../components/common/Button';
import { ThumbsUp, ThumbsDown, DollarSign, Book } from 'lucide-react';

// Use the same mockMaterials as above
const mockMaterials = [
  {
    id: '1',
    title: 'Algebra Basics',
    subject: 'Mathematics',
    price: 10,
    description: 'A comprehensive guide to algebra.',
    chapter: 'Chapter 1',
    sellerId: 'seller1',
    upvotes: 2,
    downvotes: 0,
  },
  {
    id: '2',
    title: 'Physics Fundamentals',
    subject: 'Physics',
    price: 15,
    description: 'Learn the basics of physics.',
    chapter: 'Chapter 2',
    sellerId: 'seller1',
    upvotes: 1,
    downvotes: 1,
  },
];

export const MaterialMarketplacePage: React.FC = () => {
  const { addNotification } = useNotifications();
  const [materials, setMaterials] = useState(mockMaterials);
  const [userVotes, setUserVotes] = useState<{ [key: string]: { up: boolean; down: boolean } }>({});

  // Voting logic: toggles upvote/downvote on double click
  const handleVote = (materialId: string, vote: 'up' | 'down') => {
    setMaterials(prevMaterials =>
      prevMaterials.map(material => {
        if (material.id === materialId) {
          const prevVote = userVotes[materialId]?.[vote] || false;
          if (!prevVote) {
            // First click: increase
            return {
              ...material,
              upvotes: vote === 'up' ? material.upvotes + 1 : material.upvotes,
              downvotes: vote === 'down' ? material.downvotes + 1 : material.downvotes,
            };
          } else {
            // Second click: decrease
            return {
              ...material,
              upvotes: vote === 'up' ? Math.max(material.upvotes - 1, 0) : material.upvotes,
              downvotes: vote === 'down' ? Math.max(material.downvotes - 1, 0) : material.downvotes,
            };
          }
        }
        return material;
      })
    );

    setUserVotes(prevVotes => ({
      ...prevVotes,
      [materialId]: {
        ...prevVotes[materialId],
        [vote]: !(prevVotes[materialId]?.[vote] || false),
      },
    }));

    addNotification({
      message: `Vote ${vote === 'up' ? 'up' : 'down'}!`,
      type: 'success',
    });
  };

  // Buy material logic (mock)
  const handleBuyMaterial = (materialId: string) => {
    addNotification({
      message: 'Material purchased successfully!',
      type: 'success',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Material Marketplace</h1>
        <p className="text-gray-600">Browse and buy educational materials</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {materials.map((material) => (
          <div key={material.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{material.title}</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                <Book className="h-4 w-4" />
                <span>{material.subject}</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{material.description}</p>
              <p className="text-xs text-gray-500">{material.chapter}</p>
            </div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-1">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-lg font-bold text-green-600">${material.price}</span>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <button
                  onClick={() => handleVote(material.id, 'up')}
                  className={`flex items-center space-x-1 ${
                    userVotes[material.id]?.up ? 'text-green-700 font-bold' : 'text-green-600'
                  } hover:text-green-700 transition-colors`}
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span>{material.upvotes}</span>
                </button>
                <button
                  onClick={() => handleVote(material.id, 'down')}
                  className={`flex items-center space-x-1 ${
                    userVotes[material.id]?.down ? 'text-red-700 font-bold' : 'text-red-600'
                  } hover:text-red-700 transition-colors`}
                >
                  <ThumbsDown className="h-4 w-4" />
                  <span>{material.downvotes}</span>
                </button>
              </div>
            </div>
            <Button
              onClick={() => handleBuyMaterial(material.id)}
              className="w-full mt-2"
            >
              Buy Material
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};