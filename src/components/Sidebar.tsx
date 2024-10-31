// src/components/Sidebar.tsx

import React, { useState } from 'react';
import {
  FaBars,
  FaTimes,
  FaHandPaper,
  FaCamera,
  FaFolder,
  FaBook,
} from 'react-icons/fa';
import './Sidebar.css';

interface SidebarProps {
  setCurrentComponent: (component: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ setCurrentComponent }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Logo and Toggle Button */}
      <div className="logo-details">
        {isOpen && <div className="logo_name">Handy</div>}
        <div
          className="toggle-btn"
          onClick={toggleSidebar}
          aria-label="Toggle Sidebar"
          aria-expanded={isOpen}
        >
          {isOpen ? <FaTimes /> : <FaBars />}
        </div>
      </div>

      {/* Navigation List */}
      <ul className="nav-list">
        {/* Translate */}
        <li onClick={() => setCurrentComponent("dashboard")}>
          <div className="nav-item" aria-label="Translate">
            <FaHandPaper className="icon" />
            {isOpen && <span className="links_name">Translate</span>}
          </div>
          {!isOpen && <span className="tooltip">Translate</span>}
        </li>

        {/* Record */}
        <li onClick={() => setCurrentComponent("record")}>
          <div className="nav-item" aria-label="Record">
            <FaCamera className="icon" />
            {isOpen && <span className="links_name">Record</span>}
          </div>
          {!isOpen && <span className="tooltip">Record</span>}
        </li>

        {/* Files */}
        <li onClick={() => setCurrentComponent("saved")}>
          <div className="nav-item" aria-label="Files">
            <FaFolder className="icon" />
            {isOpen && <span className="links_name">Files</span>}
          </div>
          {!isOpen && <span className="tooltip">Files</span>}
        </li>

        {/* Documentation */}
        <li>
          <a
            href="https://github.com/yoyo222/Handy-Website"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-item external-link"
            aria-label="Documentation"
          >
            <FaBook className="icon" />
            {isOpen && <span className="links_name">Documentation</span>}
          </a>
          {!isOpen && <span className="tooltip">Documentation</span>}
        </li>

        {/* Spacer to Push Profile/Logout to Bottom */}
        <li className="spacer"></li>
      </ul>
    </div>
  );
};

export default Sidebar;
