// src/Saved/Saved.tsx

import React, { useEffect, useState } from 'react';
import './Saved.css';

interface SavedItem {
  name: string;
  timestamp: string;
  video: string; // URL to the video file
}

interface SavedProps {
  socketRef: React.MutableRefObject<WebSocket | null>;
  isConnected: boolean;
}

const Saved: React.FC<SavedProps> = ({ socketRef, isConnected }) => {
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (socketRef.current && isConnected) {
      // Request the list of saved items
      const requestList = JSON.stringify({ function: 'list_saved' });
      socketRef.current.send(requestList);

      const handleMessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data.function === 'list_saved' && data.result) {
            setSavedItems(data.result);
            setIsLoading(false);
          } else if (data.error) {
            setError(data.error);
            setIsLoading(false);
          }
        } catch (err) {
          console.error("Failed to parse message in Saved component:", err);
          setError("Failed to parse server response.");
          setIsLoading(false);
        }
      };

      socketRef.current.addEventListener('message', handleMessage);

      return () => {
        if (socketRef.current) {
          socketRef.current.removeEventListener('message', handleMessage);
        }
      };
    }
  }, [socketRef, isConnected]);

  const handleDelete = (item: SavedItem) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const deleteMessage = JSON.stringify({
        function: 'delete_saved',
        kwargs: { 
          name: item.name,
          timestamp: item.timestamp
        },
      });
      socketRef.current.send(deleteMessage);
      // Optimistically update the UI
      setSavedItems(prev => prev.filter(i => !(i.name === item.name && i.timestamp === item.timestamp)));
    }
  };

  if (isLoading) {
    return <div className="saved-container"><p>Loading...</p></div>;
  }

  if (error) {
    return <div className="saved-container"><p>Error: {error}</p></div>;
  }

  return (
    <div className="saved-container">
      <h1>保存された手話</h1>
      {savedItems.length === 0 ? (
        <p>保存された手話がありません。</p>
      ) : (
        <div className="album">
          {savedItems.map((item, index) => (
            <div key={`${item.name}-${item.timestamp}-${index}`} className="album-item">
              <h3>{item.name}</h3>
              <video width="320" height="240" controls>
                <source src={`http://localhost:8000${item.video}`} type="video/webm" />
                Your browser does not support the video tag.
              </video>
              <button onClick={() => handleDelete(item)}>削除する</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Saved;
