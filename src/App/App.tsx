// src/App.tsx

import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Record from '../Record/Record';
import Saved from '../Saved/Saved';
import FileViewer from '../Saved/FileViewer';
import LoadingScreen from '../LoadingScreen/LoadingScreen';
import Auth from '../Login/Auth'; // Import the Login component
import './App.css';
import '../VideoStyles.css'; // Import shared video styles
import Webcam from 'react-webcam';
import { FaPlay, FaCopy } from 'react-icons/fa';

interface SocketMessageProps {
  result: string;
  function: string;
}

interface HomeProps {
  socketRef: React.MutableRefObject<WebSocket | null>;
  socketMessage: SocketMessageProps | null;
  isConnected: boolean;
}

interface FileType {
  name: string;
  video: string;
}

interface FolderType {
  name: string;
  description: string;
  files: FileType[];
}

interface FolderData {
  [folderName: string]: {
      [filename: string]: {
          chunks: string[];
      }
  }
}

class VideoChunkProcessor {
  private folderData: FolderData = {};
  public startUpLength: number = -1;

  processChunk(socketMessage: {
      result: {
          folder: string;
          filename: string;
          chunk: string;
      }
  }): void {
      const { folder, filename, chunk } = socketMessage.result;

      // Initialize folder if not exists
      if (!this.folderData[folder]) {
          this.folderData[folder] = {};
      }

      // Initialize filename entry if not exists
      if (!this.folderData[folder][filename]) {
          this.folderData[folder][filename] = {
              chunks: []
          };
      }

      // Add chunk to the appropriate filename
      this.folderData[folder][filename].chunks.push(chunk);
  }

  reconstructVideo(folder: string, filename: string): string {
      const fileEntry = this.folderData[folder]?.[filename];
      
      if (!fileEntry) {
          console.warn(`No chunks found for ${folder}/${filename}`);
          return '';
      }

      if (this.startUpLength > 0){
        this.startUpLength -= 1
      }

      // Concatenate chunks
      const fullVideo = fileEntry.chunks.join('');
      return fullVideo;
  }

  isReady(): boolean {return this.startUpLength == 0}

  /**
   * Get the entire folder data
   * @returns Complete FolderData object
   */
  getFolderData(): FolderData {
      return this.folderData;
  }

}







const Home: React.FC<HomeProps> = ({ socketRef, socketMessage, isConnected }) => {
  const [subtitleText, setSubtitleText] = useState<string>('');
  const [isVideoVisible, setIsVideoVisible] = useState(false);
  const [webcamDimensions, setWebcamDimensions] = useState({ width: 0, height: 0, top: 0, left: 0 });
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleClick = () => {
    setIsVideoVisible((prev) => !prev);
    const message = JSON.stringify({
      function: 'reset_data',
    });

    socketRef.current?.send(message);
    setSubtitleText('');
  };

  const handleCopy = () => {
    const textarea = document.querySelector('.text-box') as HTMLTextAreaElement;;
    textarea?.select();
    document.execCommand('copy');
  };

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvasRef.current = canvas;
  }, []);

  useEffect(() => {
    if (isVideoVisible && webcamRef.current) {
      const updateWebcamDimensions = () => {
        const webcamElement = webcamRef.current?.video;

        if (webcamElement) {
          const { width, height, top, left } = webcamElement.getBoundingClientRect();
          setWebcamDimensions({ width, height, top, left });
        }
      };

      updateWebcamDimensions();

      window.addEventListener('resize', updateWebcamDimensions);

      return () => {
        window.removeEventListener('resize', updateWebcamDimensions);
      };
    }
  }, [isVideoVisible]);

  useEffect(() => {
    if (isVideoVisible && webcamRef.current && canvasRef.current) {
      const captureImage = () => {
        const video = webcamRef.current?.video;
        if (!video) return;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');

        if (canvas && ctx) {
          const videoWidth = video.videoWidth;
          const videoHeight = video.videoHeight;

          canvas.width = videoWidth;
          canvas.height = videoHeight;

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const base64Image = canvas.toDataURL('image/jpeg');
          if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            const message = JSON.stringify({
              function: 'recieve',
              args: [base64Image],
              kwargs: { mode: 'translate' },
            });

            socketRef.current.send(message);
          }
        }
      };

      const intervalId = setInterval(captureImage, 50);

      return () => clearInterval(intervalId);
    }
  }, [isVideoVisible, socketRef]);

  useEffect(() => {
    if (socketMessage && socketMessage.function === 'recieve' && socketMessage.result) {
      if (socketMessage.result === 'No match found') {
        setSubtitleText('');
      } else {
        setSubtitleText(socketMessage.result);
      }
    }
  }, [socketMessage]);

  return (
    <div onClick={handleClick} className="video-container home-container">
      <Webcam
        audio={false}
        ref={webcamRef}
        className={`video-element ${isVideoVisible ? 'visible' : 'blurred'}`}
        style={{
          objectFit: 'contain', // Ensure the video fits vertically
        }}
      />

      {isVideoVisible && (
        <img
          src="/greyperson.png"
          style={{
            position: 'absolute',
            top: `${webcamDimensions.top}px`,
            left: `${webcamDimensions.left}px`,
            width: `${webcamDimensions.width}px`,
            height: `${webcamDimensions.height}px`,
            objectFit: 'contain',
          }}
          alt="Overlay"
        />
      )}

      {/* Button Overlay */}
      {!isVideoVisible && (
        <div className="overlay">
          <h1 className="overlay-title">画面をクリックすると翻訳が始まります</h1>
      </div>
      )}

      {/* Subtitle */}
      {subtitleText && (
        <div className="subtitle-container">
          <p className="subtitle-text">{subtitleText.split(' ').slice(-15).join(' ')}</p>
        </div>
      )}

      
    </div>
  );
};

const App: React.FC = () => {
  const socketRef = useRef<WebSocket | null>(null);
  const [socketMessage, setSocketMessage] = useState<SocketMessageProps | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentComponent, setCurrentComponent] = useState("auth");
  const videoProcessorRef = useRef(new VideoChunkProcessor());
  const [folders, setFolders] = useState<FolderType[]>([
    
  ]);

  const onAuthentication = (state: boolean) => {
    if (state){
      setIsAuthenticated(true);
      console.log("Authenticated!")
      setCurrentComponent("dashboard");
      const requestList = JSON.stringify(
        { function: 'send_descriptions', kwargs: { 
      }, });
      socketRef.current?.send(requestList);
    }
    else{
      setIsAuthenticated(false);
    }
  }

  const handleLogin = (username: string, password: string, rememberMe: boolean) => {
    if (!isConnected) return;
    const requestList = JSON.stringify(
      { function: 'login', kwargs: { 
        username: username,
        password: password,
        rememberMe: rememberMe
    }, });
    socketRef.current?.send(requestList);
  };

  const handleSignUp = (username: string, password: string, rememberMe: boolean) => {
    if (!isConnected) return;
    const requestList = JSON.stringify(
      { function: 'signup', kwargs: { 
        username: username,
        password: password,
        rememberMe: rememberMe
    }, });
    socketRef.current?.send(requestList);
  };


  useEffect(() => {
    const connectWebSocket = () => {
      socketRef.current = new WebSocket('ws://localhost:8765');

      socketRef.current.onopen = () => {
        setIsConnected(true);
        console.log("WebSocket connected");
      };

      socketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && "result" in data && "function" in data) {
            setSocketMessage({ result: data.result, function: data.function });
          }
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      socketRef.current.onclose = () => {
        setIsConnected(false);
        console.log("WebSocket disconnected");
      };

      socketRef.current.onerror = (error) => {
        setIsConnected(false);
        console.error("WebSocket error:", error);
      };
    };

    connectWebSocket();

    const intervalId = setInterval(() => {
      if (socketRef.current) {
        if (socketRef.current.readyState !== WebSocket.OPEN) {
          console.log("WebSocket not open, attempting to reconnect...");
          connectWebSocket();
        }
      } else {
        console.log("WebSocket is null, attempting to reconnect...");
        connectWebSocket();
      }
    }, 5000);

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      clearInterval(intervalId);
    };
  }, []);

  

  const setUpDescriptions = (descriptions: { [folderName: string]: string } | string) => {
    const updatedFolders: FolderType[] = [];
  
    // Loop through the provided descriptions
    for (const [name, description] of Object.entries(descriptions)) {
      // Check if the folder already exists
      const existingFolderIndex = folders.findIndex(folder => folder.name === name);
  
      if (existingFolderIndex !== -1) {
        // Overwrite existing folder description
        const existingFolder = { ...folders[existingFolderIndex], description };
        updatedFolders.push(existingFolder);
      } else {
        // Create a new folder with the provided description
        updatedFolders.push({ name, description, files: [] });
      }
    }
  
    // Update the state with the new list of folders
    setFolders(updatedFolders);
  };

  const updateFoldersWithVideo = (folder: string, filename: string, videoBase64: string) => {
    console.log("!")
    setFolders(prevFolders => {
      const updatedFolders = [...prevFolders];

      // Find the folder index
      let folderIndex = updatedFolders.findIndex(f => f.name === folder);

      // If folder doesn't exist, create it
      if (folderIndex === -1) {
        const newFolder: FolderType = {
          name: folder,
          description: '', // Will be populated from existing state
          files: [{ name: filename, video: videoBase64 }]
        };
        updatedFolders.push(newFolder);
      } else {
        // Check if file already exists in the folder
        const existingFileIndex = updatedFolders[folderIndex].files
          .findIndex(f => f.name === filename);

        if (existingFileIndex === -1) {
          // Add new file to existing folder
          updatedFolders[folderIndex] = {
            ...updatedFolders[folderIndex],
            files: [
              ...updatedFolders[folderIndex].files,
              { name: filename, video: videoBase64 }
            ]
          };
        } else {
          // Update existing file's video
          updatedFolders[folderIndex].files[existingFileIndex] = {
            name: filename,
            video: videoBase64
          };
        }
      }

      return updatedFolders;
    });
  };

  

  useEffect(() => {
    if (!isConnected) return;
    
    if (socketMessage?.function == 'send_descriptions' && socketMessage?.result){
      setUpDescriptions(socketMessage?.result);
      console.log('description recieved');
      const requestList = JSON.stringify(
        { function: 'send_files', kwargs: { 
      }, });
      socketRef.current?.send(requestList);
    }
    else if ((socketMessage?.function == 'send_files' || socketMessage?.function == 'stop_recording') && socketMessage?.result){
      if (!isNaN(Number(socketMessage.result)) && isFinite(Number(socketMessage.result))){
        videoProcessorRef.current.startUpLength = Number(socketMessage.result);
      }
      else if (socketMessage.result == "NONE"){
        setIsReady(true);
      }
      else {
        const { folder, filename, chunk } = socketMessage.result as unknown as {
          folder: string, 
          filename: string, 
          chunk: string
        };
        console.log({ folder, filename, chunk })
        
        videoProcessorRef.current.processChunk({
          result: { folder, filename, chunk }
        });
        

        if (!chunk){
          const video = videoProcessorRef.current.reconstructVideo(folder, filename);
          updateFoldersWithVideo(folder, filename, video);
          if (videoProcessorRef.current.isReady()){
            setIsReady(true);
          }
        }
      }
    }
  }, [socketMessage, isConnected]);






  const renderComponent = () => {
    if (!isAuthenticated) {
      return (
        <Auth
          onLogin={handleLogin}
          onSignUp={handleSignUp}
          setIsAuthenticated={onAuthentication}
          socketMessage={socketMessage}
          isConnected={isConnected}
        />
      );
    }
    switch (currentComponent) {
      case "dashboard":
        return <Home socketRef={socketRef} socketMessage={socketMessage} isConnected={isConnected} />;
      case "record":
        return <Record socketRef={socketRef} socketMessage={socketMessage} isConnected={isConnected} />;
      case "saved":
        return <FileViewer socketRef={socketRef} socketMessage={socketMessage} isConnected={isConnected} folders={folders} setFolders={setFolders} />
        // return <Saved socketRef={socketRef} socketMessage={socketMessage} isConnected={isConnected} />;
      // case "settings":
      //   return <Settings socketRef={socketRef} isConnected={isConnected} />;
      default:
        return <Home socketRef={socketRef} socketMessage={socketMessage} isConnected={isConnected} />;
    }
  };

  return (
    <div className="app-container">
      {((!isConnected || !isReady) && isAuthenticated)  && 
        <LoadingScreen/>
      }
      {isAuthenticated && <Sidebar setCurrentComponent={setCurrentComponent} />}
      <div className="home-section">{renderComponent()}</div>
    </div>
  );
};

export default App;
