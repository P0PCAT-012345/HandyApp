// src/components/Sidebar.tsx

import React from 'react';
import {
  FaBars,
  FaTimes,
  FaHandPaper,
  FaCamera,
  FaFolder,
  FaBook,
  FaCog, // Icon for Settings
  FaSignOutAlt, // Icon for Logout
} from 'react-icons/fa';
import './Sidebar.css';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../translation';
import Tooltip from '@mui/material/Tooltip';

interface SidebarProps {
  isOpen: boolean; // Receive open state
  toggleSidebar: () => void; // Receive toggle function
  setCurrentComponent: (component: string) => void;
  onLogout: () => void; // New prop for Logout
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar, setCurrentComponent, onLogout }) => {
  const { language } = useLanguage();

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Logo and Toggle Button */}
      <div className="logo-details">
        {isOpen && <div className="logo_name">Handy</div>}
        <div
          className="toggle-btn"
          onClick={toggleSidebar}
          aria-label={isOpen ? t('close_sidebar', language) || 'Close Sidebar' : t('open_sidebar', language) || 'Open Sidebar'}
          aria-expanded={isOpen}
        >
          {isOpen ? <FaTimes /> : <FaBars />}
        </div>
      </div>

      {/* Navigation List */}
      <ul className="nav-list">
        {/* Translate */}
        <li onClick={() => setCurrentComponent("dashboard")}>
          <Tooltip title={isOpen ? '' : t('translate', language)} placement="right">
            <div className="nav-item" aria-label={t('translate', language)}>
              <FaHandPaper className="icon" />
              {isOpen && <span className="links_name">{t('translate', language)}</span>}
            </div>
          </Tooltip>
        </li>

        {/* Record */}
        <li onClick={() => setCurrentComponent("record")}>
          <Tooltip title={isOpen ? '' : t('record', language)} placement="right">
            <div className="nav-item" aria-label={t('record', language)}>
              <FaCamera className="icon" />
              {isOpen && <span className="links_name">{t('record', language)}</span>}
            </div>
          </Tooltip>
        </li>

        {/* Files */}
        <li onClick={() => setCurrentComponent("saved")}>
          <Tooltip title={isOpen ? '' : t('files', language)} placement="right">
            <div className="nav-item" aria-label={t('files', language)}>
              <FaFolder className="icon" />
              {isOpen && <span className="links_name">{t('files', language)}</span>}
            </div>
          </Tooltip>
        </li>

        {/* Documentation */}
        <li>
          <Tooltip title={isOpen ? '' : t('documentation', language)} placement="right">
            <a
              href="https://github.com/yoyo222/Handy-Website"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-item external-link"
              aria-label={t('documentation', language)}
            >
              <FaBook className="icon" />
              {isOpen && <span className="links_name">{t('documentation', language)}</span>}
            </a>
          </Tooltip>
        </li>

        {/* Settings */}
        <li onClick={() => setCurrentComponent("settings")}>
          <Tooltip title={isOpen ? '' : t('settings', language)} placement="right">
            <div className="nav-item" aria-label={t('settings', language)}>
              <FaCog className="icon" />
              {isOpen && <span className="links_name">{t('settings', language)}</span>}
            </div>
          </Tooltip>
        </li>

        {/* Spacer to Push Logout to Bottom */}
        <li className="spacer"></li>

        {/* Logout */}
        <li onClick={onLogout}>
          <Tooltip title={isOpen ? '' : t('logout', language)} placement="right">
            <div className="nav-item" aria-label={t('logout', language)}>
              <FaSignOutAlt className="icon" />
              {isOpen && <span className="links_name">{t('logout', language)}</span>}
            </div>
          </Tooltip>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
