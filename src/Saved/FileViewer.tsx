import React, { useState, useEffect, useRef } from 'react';
import { Folder, ChevronLeft, Trash2, Search, RefreshCw } from 'lucide-react';
import './FileViewer.css';

interface FileType {
  name: string;
  video: string;
}

interface FolderType {
  name: string;
  description: string;
  files: FileType[];
}

interface SocketMessageProps {
  result: string;
  function: string;
}

interface FileViewerProps {
  socketRef: React.MutableRefObject<WebSocket | null>;
  socketMessage: SocketMessageProps | null;
  isConnected: boolean;
  folders: FolderType[];
  setFolders: (folders: FolderType[]) => void;
}


const FileViewer: React.FC<FileViewerProps> = ({ socketRef, socketMessage, isConnected, folders, setFolders}) => {
  
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFolder, setCurrentFolder] = useState<FolderType | null>(null);
  const [currentFolderIndex, setCurrentFolderIndex] = useState<number | null>(null);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [selectedFolders, setSelectedFolders] = useState<number[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<FileType[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<FileType | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Link parsing function
  const parseLinksInText = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a 
            key={index} 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-blue-500 underline"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const handleFolderClick = (folderIndex: number) => {
    setCurrentFolder(folders[folderIndex]);
    setCurrentFolderIndex(folderIndex);
    setSelectedFiles([]);
  };

  const handleBackClick = () => {
    setCurrentFolder(null);
    setCurrentFolderIndex(null);
    setSelectedFiles([]);
    setSearchQuery('');
  };

  const handleVideoClick = (file: FileType) => {
    setSelectedVideo(file);
    setIsVideoOpen(true);
  };

  const handleCheckboxChange = (file: FileType) => {
    setSelectedFiles((prev) =>
      prev.some((f) => f.name === file.name)
        ? prev.filter((f) => f.name !== file.name)
        : [...prev, file]
    );
  };

  const handleFolderCheckboxChange = (folder: FolderType, index: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent folder from opening when clicking checkbox
    setSelectedFolders(prev => 
      prev.includes(index)
        ? prev.filter(f => f !== index)
        : [...prev, index]
    );
  };

  const handleDeleteSelected = () => {
    if (currentFolder && selectedFiles.length > 0) {
      // Delete files from current folder
      const updatedFolders = [...folders];
      updatedFolders[currentFolderIndex!].files = currentFolder.files.filter(
        (file) => !selectedFiles.some((selectedFile) => selectedFile.name === file.name)
      );
  
      setFolders(updatedFolders);
      setCurrentFolder(updatedFolders[currentFolderIndex!]);
      setSelectedFiles([]);

      const fileNames = selectedFiles.map(file => file.name);
      const requestList = JSON.stringify(
        { function: 'delete_files', kwargs: { 
          "folder": currentFolder.name,
          "files": fileNames
      }, });
      socketRef.current?.send(requestList);
    } else if (selectedFolders.length > 0) {
      // Delete folders
      const updatedFolders = folders.filter((_, index) => !selectedFolders.includes(index));
      setFolders(updatedFolders);
      setSelectedFolders([]);
      const folderNames = selectedFolders.map(index => folders[index].name);
      const requestList = JSON.stringify(
        { function: 'delete_folders', kwargs: { 
          "folders": folderNames
      }, });
      socketRef.current?.send(requestList);
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (currentFolderIndex !== null) {
      const updatedFolders = [...folders];
      updatedFolders[currentFolderIndex].description = e.target.value;
      setFolders(updatedFolders);
      setCurrentFolder(updatedFolders[currentFolderIndex]);
      const requestList = JSON.stringify(
        { function: 'update_description', kwargs: { 
          "folder": updatedFolders[currentFolderIndex].name,
          "description": e.target.value
      }, });
      socketRef.current?.send(requestList);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleRefresh = () => {
    const requestList = JSON.stringify(
      { function: 'send_descriptions', kwargs: { 
    }, });
    socketRef.current?.send(requestList);
  }

  return (
    <div className="file-viewer">
      <div className="container">
        <div className="viewer-card">
          {/* Header */}
          <div className="viewer-header">
            {currentFolder && (
              <button
                onClick={handleBackClick}
                className="back-button"
              >
                <ChevronLeft />
              </button>
            )}
            <h1>{currentFolder ? currentFolder.name : 'Saved'}</h1>
            {((currentFolder && selectedFiles.length > 0) || (!currentFolder && selectedFolders.length > 0)) && (
              <button
                onClick={handleDeleteSelected}
                className="delete-button"
              >
                <Trash2 />
                Delete Selected ({currentFolder ? selectedFiles.length : selectedFolders.length})
              </button>
            )}
            <button onClick={handleRefresh}
              className="refresh-button"
            >
              <RefreshCw />
            </button>
          </div>

          {/* Search Bar - Only show when in folder view */}
          {!currentFolder && (
            <div className="search-container">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search folders..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="search-input"
              />
            </div>
          )}

          {/* Content */}
          <div className="viewer-content">
            {!currentFolder ? (
              // Folder View
              <div className="scrollable-container">
                <div className="grid-container">
                  {filteredFolders.map((folder, index) => (
                    <button
                      key={folder.name}
                      onClick={() => handleFolderClick(index)}
                      className="folder-item"
                    >
                      <div 
                        className={`folder-icon-container ${selectedFolders.includes(index) ? 'selected' : ''}`}
                        onClick={(e) => handleFolderCheckboxChange(folder, index, e)}
                      >
                        <Folder className="folder-icon" />
                      </div>
                      <span className="folder-name">{folder.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              // File View
              <div className="folder-content">
                <div className="description-container">
                  <textarea
                    ref={descriptionRef}
                    value={currentFolder.description}
                    onChange={handleDescriptionChange}
                    className="description-input"
                    placeholder="Click to add description..."
                  />

                </div>
                <div className="scrollable-container">
                  <div className="files-grid">
                    {currentFolder.files.map((file) => (
                      <div key={file.name} className="file-item">
                        <input
                          type="checkbox"
                          checked={selectedFiles.includes(file)}
                          onChange={() => handleCheckboxChange(file)}
                          className="file-checkbox"
                        />
                        <button
                          onClick={() => handleVideoClick(file)}
                          className="file-button"
                        >
                          <span>{file.name}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {isVideoOpen && selectedVideo && (
      <div className="modal-overlay" onClick={() => setIsVideoOpen(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <video controls className="video-player" src={`data:video/webm;base64,${selectedVideo.video}`}>
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    )}
    </div>
  );
};

export default FileViewer;