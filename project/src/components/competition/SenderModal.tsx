import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';


interface SenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel: () => void;
  opponentName: string;
  opponentSchool: string;
}

export const SenderModal: React.FC<SenderModalProps> = ({ isOpen, onClose, onCancel, opponentName, opponentSchool}) => {

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Competition Sent" size="md">
      <div className="space-y-4 text-center">
        <p className="text-gray-700">You have sent a competition request to <span className="font-semibold">{opponentName}</span> from <span className="font-semibold">{opponentSchool}</span>.</p>
        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="outline" onClick={onCancel}>Cancel Request</Button>
        </div>
      </div>
    </Modal>
  );
};
