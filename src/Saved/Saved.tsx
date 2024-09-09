import React, { useState } from 'react';
import './Saved.css';

const Saved: React.FC = () => {
  const [recordings, setRecordings] = useState<{ name: string; url: string }[]>(() => {
    const savedRecordings = localStorage.getItem('recordings');
    return savedRecordings ? JSON.parse(savedRecordings) : [];
  });
  const [selectedRecording, setSelectedRecording] = useState<string | null>(null);

  const handleRecordingClick = (url: string) => {
    setSelectedRecording(url);
  };

  const handleDeleteRecording = (index: number) => {
    const updatedRecordings = recordings.filter((_, i) => i !== index);
    setRecordings(updatedRecordings);
    localStorage.setItem('recordings', JSON.stringify(updatedRecordings));
  };

  const handleDownloadRecording = (url: string, name: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCloseVideo = () => {
    setSelectedRecording(null);
  };

  return (
    <div className="saved-container">
      <h1>Saved Recordings</h1>
      {recordings.length > 0 ? (
        <ul>
          {recordings.map((recording, index) => (
            <li key={index} className="recording-item">
              <span onClick={() => handleRecordingClick(recording.url)}>
                {recording.name}
              </span>
              <button className="delete-button" onClick={() => handleDeleteRecording(index)}>
                Delete
              </button>
              <button
                className="download-button"
                onClick={() => handleDownloadRecording(recording.url, recording.name)}
              >
                Download
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No recordings saved.</p>
      )}
      {selectedRecording && (
        <div className="video-overlay" onClick={handleCloseVideo}>
          <div className="video-container" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={handleCloseVideo}>
              X
            </button>
            {/* Flip the video content, but not the controls */}
            <div className="video-wrapper">
              <video src={selectedRecording} controls autoPlay className="video-content" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Saved;
