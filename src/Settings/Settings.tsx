import React, { useState, useEffect } from 'react';
import './Settings.css';

type Language = 'english' | 'japanese';

const translations: Record<Language, { [key: string]: string }> = {
  english: {
    settings: 'Settings',
    language: 'Language',
    theme: 'Theme',
    camera: 'Camera',
    light: 'Light',
    dark: 'Dark',
    english: 'English',
    japanese: '日本語',
  },
  japanese: {
    settings: '設定',
    language: '言語',
    theme: 'テーマ',
    camera: 'カメラ',
    light: 'ライト',
    dark: 'ダーク',
    english: '英語',
    japanese: '日本語',
  },
};

const Settings: React.FC = () => {
  const [language, setLanguage] = useState<Language>('english');
  const [theme, setTheme] = useState('light');
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [camera, setCamera] = useState('');

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as Language);
  };

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTheme(e.target.value);
  };

  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCamera(e.target.value);
  };

  useEffect(() => {
    const getCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setCameras(videoDevices);
        if (videoDevices.length > 0) {
          setCamera(videoDevices[0].deviceId); // Set the default camera
        }
      } catch (err) {
        console.error('Error accessing media devices', err);
      }
    };

    getCameras();
  }, []);

  const t = translations[language];

  return (
    <div className={`settings-container ${theme === 'dark' ? 'dark-mode' : ''}`}>
      <h1 className="settings-title">{t.settings}</h1>
      <div className="settings-section">
        <label className="settings-label">{t.language}</label>
        <select
          className="settings-select"
          value={language}
          onChange={handleLanguageChange}
        >
          <option value="english">{t.english}</option>
          <option value="japanese">{t.japanese}</option>
        </select>
      </div>

      <div className="settings-section">
        <label className="settings-label">{t.theme}</label>
        <select
          className="settings-select"
          value={theme}
          onChange={handleThemeChange}
        >
          <option value="light">{t.light}</option>
          <option value="dark">{t.dark}</option>
        </select>
      </div>

      <div className="settings-section">
        <label className="settings-label">{t.camera}</label>
        <select
          className="settings-select"
          value={camera}
          onChange={handleCameraChange}
        >
          {cameras.map(cam => (
            <option key={cam.deviceId} value={cam.deviceId}>
              {cam.label || `Camera ${cam.deviceId}`}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default Settings;
