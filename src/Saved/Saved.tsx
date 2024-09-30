// src/Saved/Saved.tsx

import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import UploadIcon from '@mui/icons-material/Upload';
import CloseIcon from '@mui/icons-material/Close';
import LoadingScreen from '../LoadingScreen/LoadingScreen';
import './Saved.css';

interface SavedItem {
  name: string;
  timestamp: string;
  video: string; // Array to store video chunks
}

interface SocketMessageProps {
  result: string;
  function: string;
}

interface SavedProps {
  socketRef: React.MutableRefObject<WebSocket | null>;
  socketMessage: SocketMessageProps | null;
  isConnected: boolean;
}

const Saved: React.FC<SavedProps> = ({ socketRef, socketMessage, isConnected }) => {
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<SavedItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<SavedItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
   const hasInitialized = useRef(false);

  useEffect(() => {
    if (!isConnected) {hasInitialized.current = false;}
    if (!isConnected || !socketRef.current || hasInitialized.current) return;
  
    hasInitialized.current = true;
  
    const requestList = JSON.stringify({ function: 'list_saved' });
    socketRef.current.send(requestList);
  
    const newSavedItems: SavedItem[] = [];
    const chunks: { [key: string]: string[] } = {};
  
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.function === 'list_saved' && data.result) {
          if ("finished" in data.result) {
            setSavedItems(newSavedItems);
            setFilteredItems(newSavedItems);
            setIsLoading(false);
          } else if (data.error) {
            setError(data.error);
            setIsLoading(false);
          }
        } 
      }
      catch (err) {
        console.error('Failed to parse message in Saved component:', err);
        setError('サーバーの応答を解析できませんでした。');
        setIsLoading(false);
      }
    }
      socketRef.current.addEventListener('message', handleMessage);

  }, [isConnected, socketRef]);

  const handleDelete = (item: SavedItem) => {
    if (window.confirm(`"${item.name}" を削除してもよろしいですか？`)) {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        const deleteMessage = JSON.stringify({
          function: 'delete_saved',
          kwargs: {
            name: item.name,
            timestamp: item.timestamp,
          },
        });
        socketRef.current.send(deleteMessage);
        setSavedItems((prev) =>
          prev.filter(
            (i) => !(i.name === item.name && i.timestamp === item.timestamp)
          )
        );
        setFilteredItems((prev) =>
          prev.filter(
            (i) => !(i.name === item.name && i.timestamp === item.timestamp)
          )
        );
      }
    }
  };

  const handleDownload = (item: SavedItem) => {
    const link = document.createElement('a');
    link.href = `data:video/webm;base64,${item.video}`;
    link.download = `${item.name}.webm`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openModal = (item: SavedItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedItem(null);
    setIsModalOpen(false);
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files[0]) {
      uploadFile(files[0]);
    }
  };

  const uploadFile = (file: File) => {
    // Placeholder for upload functionality
    // Implement your upload logic here using existing socketRef
    // For example:
    // const formData = new FormData();
    // formData.append('file', file);
    // fetch('your-upload-endpoint', {
    //   method: 'POST',
    //   body: formData,
    // })
    //   .then(response => response.json())
    //   .then(data => {
    //     // Handle success
    //     setIsUploading(false);
    //     // Refresh the list
    //     const requestList = JSON.stringify({ function: 'list_saved' });
    //     socketRef.current?.send(requestList);
    //   })
    //   .catch(error => {
    //     console.error('Upload failed:', error);
    //     setIsUploading(false);
    //   });

    // Since you requested not to modify socketRef much, the actual upload implementation is left as a placeholder.
    alert('アップロード機能は現在実装されていません。');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  if (isLoading) {
    return (
      <Box className="saved-container loading-container" display="flex" justifyContent="center" alignItems="center">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="saved-container error-container">
        <Typography variant="h6" color="error">
          エラー: {error}
        </Typography>
      </Box>
    );
  }

  return (
    <>
    {!isConnected && <LoadingScreen />}
    <Box className="saved-container">
      <Box className="header">
        <Typography variant="h4" className="saved-title">
          保存された手話
        </Typography>
        <Box className="upload-section">
          <input
            type="file"
            accept="video/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <Tooltip title="アップロード">
            <IconButton
              color="primary"
              onClick={handleUploadClick}
              className="upload-button"
            >
              <UploadIcon />
            </IconButton>
          </Tooltip>
          {isUploading && <CircularProgress size={24} className="upload-progress" />}
        </Box>
      </Box>
      <Box className="search-bar">
        <TextField
          placeholder="検索..."
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            style: { color: '#ffffff' }, // Ensure text is visible in dark mode
          }}
          className="search-input"
        />
      </Box>
      <TableContainer component={Paper} className="table-container">
        <Table aria-label="saved signs table">
          <TableHead>
            <TableRow>
              <TableCell className="table-header-cell">名前</TableCell>
              <TableCell className="table-header-cell action-header-cell" align="right">
                アクション
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredItems.map((item, index) => (
              <TableRow key={`${item.name}-${item.timestamp}-${index}`} className="table-row">
                <TableCell className="table-cell">
                  <Button
                    onClick={() => openModal(item)}
                    className="name-button"
                  >
                    {item.name}
                  </Button>
                </TableCell>
                <TableCell className="table-cell action-cell" align="right">
                  <Tooltip title="ダウンロード">
                    <IconButton
                      aria-label="download"
                      onClick={() => handleDownload(item)}
                      className="action-button download-button"
                    >
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="削除する">
                    <IconButton
                      aria-label="delete"
                      onClick={() => handleDelete(item)}
                      className="action-button delete-button"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {filteredItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} align="center">
                  <Typography variant="body1">保存された手話がありません。</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={isModalOpen}
        onClose={closeModal}
        maxWidth="md"
        fullWidth
        aria-labelledby="video-preview-title"
      >
        <DialogTitle id="video-preview-title" className="dialog-title">
          {selectedItem?.name} - プレビュー
          <IconButton
            aria-label="close"
            onClick={closeModal}
            className="close-button"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers className="dialog-content">
          {selectedItem && (
            <video
              width="100%"
              height="auto"
              controls
              src={`http://localhost:8000${selectedItem.video}`}
              className="preview-video"
            >
              ブラウザがビデオタグをサポートしていません。
            </video>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeModal} color="primary" className="close-dialog-button">
            閉じる
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
    </>
  );
};

export default Saved;
