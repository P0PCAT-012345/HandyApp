// src/components/Sidebar.tsx

import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FaBars,
  FaTimes,
  FaHandPaper,
  FaCamera,
  FaFolder,
  FaBook,
  FaCog,
  FaUserCircle
} from 'react-icons/fa';
import './Sidebar.css';
import { useTranslation } from 'react-i18next';

const Sidebar: React.FC = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    navigate('/login');
    window.location.reload(); 
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Logo and Toggle Button */}
      <div className="logo-details">
        {isOpen && <div className="logo_name">Handy</div>} 
        <div
          className="toggle-btn"
          onClick={toggleSidebar}
          aria-label={isOpen ? t('Close Sidebar') : t('Open Sidebar')}
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
            aria-label={t('Translate')}
          >
            <FaHandPaper className="icon" /> {/* Updated to hand sign */}
            {isOpen && <span className="links_name">{t('Translate')}</span>}
          </NavLink>
          {!isOpen && <span className="tooltip">{t('Translate')}</span>}
        </li>

        {/* Record */}
        <li>
          <NavLink
            to="/record"
            className={({ isActive }) => (isActive ? 'active' : '')}
            aria-label={t('Record')}
          >
            <FaCamera className="icon" />
            {isOpen && <span className="links_name">{t('Record')}</span>}
          </NavLink>
          {!isOpen && <span className="tooltip">{t('Record')}</span>}
        </li>

        {/* Files */}
        <li>
          <NavLink
            to="/saved"
            className={({ isActive }) => (isActive ? 'active' : '')}
            aria-label={t('Files')}
          >
            <FaFolder className="icon" />
            {isOpen && <span className="links_name">{t('Files')}</span>}
          </NavLink>
          {!isOpen && <span className="tooltip">{t('Files')}</span>}
        </li>

        {/* Settings */}
        <li>
          <NavLink
            to="/settings"
            className={({ isActive }) => (isActive ? 'active' : '')}
            aria-label={t('Settings')}
          >
            <FaCog className="icon" />
            {isOpen && <span className="links_name">{t('Settings')}</span>}
          </NavLink>
          {!isOpen && <span className="tooltip">{t('Settings')}</span>}
        </li>

        {/* Documentation */}
        <li>
          <a
            href="https://github.com/yoyo222/Handy-Website"
            target="_blank"
            rel="noopener noreferrer"
            className="external-link"
            aria-label={t('Documentation')}
          >
            <FaBook className="icon" />
            {isOpen && <span className="links_name">{t('Documentation')}</span>}
          </a>
          {!isOpen && <span className="tooltip">{t('Documentation')}</span>}
        </li>
        
        <li className="spacer"></li>

        {/* Profile/Logout */}
        <li>
          <div
            className="profile-details"
            onClick={handleLogout}
            role="button"
            tabIndex={0}
            aria-label={t('Logout')}
            onKeyPress={(e) => { if (e.key === 'Enter') handleLogout(); }}
          >
            <FaUserCircle className="profile-icon" />
            {isOpen && <span className="links_name">{t('Logout')}</span>}
          </div>
          {!isOpen && <span className="tooltip">{t('Logout')}</span>}
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
