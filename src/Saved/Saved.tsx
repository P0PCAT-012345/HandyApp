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
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import LoadingScreen from '../LoadingScreen/LoadingScreen';
import './Saved.css';

interface SavedItem {
  name: string;
  timestamp: string;
  video: string; // Array to store video chunks
}

interface SavedProps {
  socketRef: React.MutableRefObject<WebSocket | null>;
  isConnected: boolean;
}

const Saved: React.FC<SavedProps> = ({ socketRef, isConnected }) => {
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<SavedItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<SavedItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuItem, setMenuItem] = useState<SavedItem | null>(null);

  // Ref to track if initialization has occurred
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
          } else {
            const { name, timestamp, chunk } = data.result;
            const key = `${name}_${timestamp}`;
  
            if (!chunks[key]) {
              chunks[key] = [];
            }
  
            if (chunk === null) {
              const videoData = chunks[key].join('');
              const savedItem = {
                name,
                timestamp,
                video: videoData,
              };
  
              newSavedItems.push(savedItem);
              delete chunks[key];
            } else {
              chunks[key].push(chunk);
            }
          }
        } else if (data.error) {
          setError(data.error);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to parse message in Saved component:', err);
        setError('Failed to parse server response.');
        setIsLoading(false);
      }
    };
  
    socketRef.current.removeEventListener('message', handleMessage);
    socketRef.current.addEventListener('message', handleMessage);

  }, [isConnected, socketRef]);

  const handleDelete = (item: SavedItem) => {
    if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
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
    handleMenuClose();
  };

  const handleDownload = (item: SavedItem) => {
    const link = document.createElement('a');
    link.href = `data:video/webm;base64,${item.video}`;
    link.download = `${item.name}.webm`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    handleMenuClose();
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, item: SavedItem) => {
    setAnchorEl(event.currentTarget);
    setMenuItem(item);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuItem(null);
  };

  const openModal = (item: SavedItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedItem(null);
    setIsModalOpen(false);
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
      <Box className="saved-container" display="flex" justifyContent="center" alignItems="center">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="saved-container">
        <Typography variant="h6" color="error">
          Error: {error}
        </Typography>
      </Box>
    );
  }

  return (
    <>
    {!isConnected && <LoadingScreen />}
    <Box className="saved-container">
      <Typography variant="h4" className="saved-title">
        保存された手話
      </Typography>
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
          }}
        />
      </Box>
      <TableContainer component={Paper} className="table-container">
        <Table aria-label="saved signs table">
          <TableHead>
            <TableRow>
              <TableCell className="table-header-cell">名前</TableCell>
              <TableCell className="table-header-cell" align="right">
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
                <TableCell className="table-cell" align="right">
                  <IconButton
                    aria-controls={menuItem === item ? 'actions-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={menuItem === item ? 'true' : undefined}
                    onClick={(e) => handleMenuOpen(e, item)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                  <Menu
                    id="actions-menu"
                    anchorEl={anchorEl}
                    open={menuItem === item}
                    onClose={handleMenuClose}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    disableScrollLock
                  >
                    <MenuItem onClick={() => handleDownload(item)}>
                      <DownloadIcon fontSize="small" style={{ marginRight: '8px' }} />
                      ダウンロード
                    </MenuItem>
                    <MenuItem onClick={() => handleDelete(item)}>
                      <DeleteIcon fontSize="small" style={{ marginRight: '8px' }} />
                      削除する
                    </MenuItem>
                  </Menu>
                </TableCell>
              </TableRow>
            ))}
            {filteredItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
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
        <DialogTitle id="video-preview-title">
          {selectedItem?.name} - プレビュー
          <IconButton
            aria-label="close"
            onClick={closeModal}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
        {selectedItem && (
            <video controls>
              <source
                src={`data:video/webm;base64,${selectedItem.video}`}
                type="video/webm"
              />
              Your browser does not support the video tag.
            </video>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeModal} color="primary">
            閉じる
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
    </>
  );
};

export default Saved;
