import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

interface ReceiverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
  senderName: string;
}

export const ReceiverModal: React.FC<ReceiverModalProps> = ({ isOpen, onClose, onAccept, onReject, senderName }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Competition Request" size="md">
      <div className="space-y-4">
        <p className="text-center text-gray-700">You have a competition request from <span className="font-semibold">{senderName}</span>.</p>
        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="outline" onClick={onReject}>Reject</Button>
          <Button onClick={onAccept}>Accept</Button>
        </div>
      </div>
    </Modal>
  );
};
