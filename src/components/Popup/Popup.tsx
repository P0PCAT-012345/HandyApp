// src/components/Popup/Popup.tsx

import React from 'react';
import './Popup.css';
import { IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface PopupProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Popup: React.FC<PopupProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-content" onClick={(e) => e.stopPropagation()}>
        <IconButton
          className="popup-close-button"
          onClick={onClose}
          aria-label="Close Popup"
        >
          <CloseIcon />
        </IconButton>
        {children}
      </div>
    </div>
  );
};

export default Popup;
