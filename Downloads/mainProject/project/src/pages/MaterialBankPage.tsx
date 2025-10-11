import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Plus, ThumbsUp, ThumbsDown, DollarSign, Book, Trash2 } from 'lucide-react';

// Mock data for demonstration
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

export const MaterialBankPage: React.FC = () => {
  const { state } = useAuth();
  const { addNotification } = useNotifications();
  const [materials, setMaterials] = useState(mockMaterials);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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

  // Delete material logic
  const handleDeleteMaterial = (materialId: string) => {
    setMaterials(prevMaterials => prevMaterials.filter(material => material.id !== materialId));
    addNotification({
      message: 'Material deleted successfully!',
      type: 'success',
    });
  };

  // Add material logic (mock)
  const handleAddMaterial = (materialData: any) => {
    setMaterials(prev => [
      {
        ...materialData,
        id: (Math.random() * 100000).toFixed(0),
        sellerId: state.user?.id || 'seller1',
        upvotes: 0,
        downvotes: 0,
      },
      ...prev,
    ]);
    setShowCreateModal(false);
    addNotification({
      message: 'Material published successfully!',
      type: 'success',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Only show materials for the current seller
  const sellerMaterials = materials.filter(m => m.sellerId === state.user?.id || 'seller1');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">My Materials</h1>
          <p className="text-gray-600">Manage your educational materials for sale</p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>Sell New Material</span>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sellerMaterials.map((material) => (
          <div key={material.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{material.title}</h3>
                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                  <Book className="h-4 w-4" />
                  <span>{material.subject}</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{material.description}</p>
                <p className="text-xs text-gray-500">{material.chapter}</p>
              </div>
              {/* Delete button, only show if user is the seller */}
              <button
                onClick={() => handleDeleteMaterial(material.id)}
                className="ml-2 text-red-600 hover:text-red-800"
                title="Delete Material"
              >
                <Trash2 className="h-5 w-5" />
              </button>
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
          </div>
        ))}
      </div>

      <CreateMaterialModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleAddMaterial}
        submitting={submitting}
      />
    </div>
  );
};

interface CreateMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (materialData: {
    title: string;
    subject: string;
    price: number;
    description: string;
    chapter: string;
  }) => void | Promise<void>;
  submitting: boolean;
}

const CreateMaterialModal: React.FC<CreateMaterialModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  submitting
}) => {
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    price: 0,
    description: '',
    chapter: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sell New Material"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Material Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            value={formData.title}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter material title"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <select
              id="subject"
              name="subject"
              required
              value={formData.subject}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select subject</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Science">Science</option>
              <option value="Literature">Literature</option>
              <option value="History">History</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
            </select>
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              Price ($)
            </label>
            <input
              type="number"
              id="price"
              name="price"
              required
              min="0"
              step="0.01"
              value={formData.price}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label htmlFor="chapter" className="block text-sm font-medium text-gray-700 mb-1">
            Chapter/Section
          </label>
          <input
            type="text"
            id="chapter"
            name="chapter"
            required
            value={formData.chapter}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Chapter 5 - Quadratic Equations"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            required
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Describe your material and what it covers"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            Publish Material
          </Button>
        </div>
      </form>
    </Modal>
  );
};