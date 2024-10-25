// src/components/Sidebar.tsx

import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FaBars,
  FaTimes,
  FaHandPaper,
  FaRegSave,
  FaFileAlt,
  FaCogs,
  FaBook,
  FaSignOutAlt,
} from 'react-icons/fa';
import './Sidebar.css';

const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    // Implement your logout logic here (e.g., clearing tokens)
    // Then navigate to the login page
    navigate('/login');
    window.location.reload(); // Optionally reload the page
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Logo and Toggle Button */}
      <div className="logo-details">
        {isOpen && <div className="logo_name">Handy</div>} {/* Renamed to Handy */}
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
        <li>
          <NavLink
            to="/dashboard"
            className={({ isActive }) => (isActive ? 'active' : '')}
            aria-label="Translate"
          >
            <FaHandPaper className="icon" /> {/* Updated to hand sign */}
            {isOpen && <span className="links_name">Translate</span>}
          </NavLink>
          {!isOpen && <span className="tooltip">Translate</span>}
        </li>

        {/* Record */}
        <li>
          <NavLink
            to="/record"
            className={({ isActive }) => (isActive ? 'active' : '')}
            aria-label="Record"
          >
            <FaRegSave className="icon" />
            {isOpen && <span className="links_name">Record</span>}
          </NavLink>
          {!isOpen && <span className="tooltip">Record</span>}
        </li>

        {/* Files */}
        <li>
          <NavLink
            to="/saved"
            className={({ isActive }) => (isActive ? 'active' : '')}
            aria-label="Files"
          >
            <FaFileAlt className="icon" />
            {isOpen && <span className="links_name">Files</span>}
          </NavLink>
          {!isOpen && <span className="tooltip">Files</span>}
        </li>

        {/* Settings */}
        {/* <li>
          <NavLink
            to="/settings"
            className={({ isActive }) => (isActive ? 'active' : '')}
            aria-label="Settings"
          >
            <FaCogs className="icon" />
            {isOpen && <span className="links_name">Settings</span>}
          </NavLink>
          {!isOpen && <span className="tooltip">Settings</span>}
        </li> */}

        {/* Documentation */}
        <li>
          <a
            href="https://github.com/yoyo222/Handy-Website"
            target="_blank"
            rel="noopener noreferrer"
            className="external-link"
            aria-label="Documentation"
          >
            <FaBook className="icon" />
            {isOpen && <span className="links_name">Documentation</span>}
          </a>
          {!isOpen && <span className="tooltip">Documentation</span>}
        </li>

        {/* Spacer to Push Profile/Logout to Bottom */}
        <li className="spacer"></li>

        {/* Profile/Logout */}
        {/* <li>
          <div
            className="profile-details"
            onClick={handleLogout}
            role="button"
            tabIndex={0}
            aria-label="Logout"
            onKeyPress={(e) => { if (e.key === 'Enter') handleLogout(); }}
          >
            <FaSignOutAlt className="profile-icon" />
            {isOpen && <span className="links_name">Logout</span>}
          </div>
          {!isOpen && <span className="tooltip">Logout</span>}
        </li> */}
      </ul>
    </div>
  );
};

export default Sidebar;
