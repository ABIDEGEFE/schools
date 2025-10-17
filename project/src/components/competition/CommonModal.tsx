import React from 'react';
import { Modal } from '../common/Modal';

interface CommonModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduledDate?: string | null;
}

export const CommonModal: React.FC<CommonModalProps> = ({ isOpen, onClose, scheduledDate }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Competition Scheduled" size="md">
      <div className="space-y-4 text-center">
        <p className="text-gray-700">Your competition has been scheduled for <span className="font-semibold">{scheduledDate ? new Date(scheduledDate).toLocaleString() : 'TBD'}</span>. Prepare well. You have to win!</p>
      </div>
    </Modal>
  );
};
