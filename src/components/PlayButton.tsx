// src/components/PlayButton.tsx

import React from 'react';
import './PlayButton.css';

interface PlayButtonProps {
  onClick: (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
}

const PlayButton: React.FC<PlayButtonProps> = ({ onClick }) => {
  return (
    <a href="#" className="button is-play" onClick={onClick} aria-label="Play Video">
      <div className="button-outer-circle"></div>
      <div className="button-outer-circle has-delay-short"></div>
      <div className="button-icon is-play">
        <svg height="100%" width="100%" fill="#f857a6" viewBox="0 0 30 30">
          <polygon
            className="triangle"
            points="5,0 30,15 5,30"
          />
          <path
            className="path"
            d="M5,0 L30,15 L5,30z"
            fill="none"
            stroke="#f857a6"
            strokeWidth="1"
          />
        </svg>
      </div>
    </a>
  );
};

export default PlayButton;
