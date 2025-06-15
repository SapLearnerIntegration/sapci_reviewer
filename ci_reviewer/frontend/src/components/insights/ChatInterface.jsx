// src/components/chat/ChatInterface.jsx

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Avatar,
  Divider,
  CircularProgress,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import {
  Send as SendIcon,
  Save as SaveIcon,
  FileCopy as CopyIcon,
  BarChart as ChartIcon,
  Code as CodeIcon
} from '@mui/icons-material';
import { processChatQuery, exportChatHistory } from '../../services/sapIntegrationService';
import DataVisualization from '../visualization/DataVisualization';
import CodeBlock from '../common/CodeBlock';
console.log("ChatInterface loaded")

const ChatInterface = ({ tenantId, analysisData }) => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Hello! I\'m your SAP Integration Suite assistant. How can I help you analyze your integration landscape?',
      timestamp: new Date().toISOString(),
      data: null
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const [selectedMessage, setSelectedMessage] = useState(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    setError(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    if (!tenantId) {
      setError('Tenant ID is required');
      return;
    }

    // Add user message
    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmedInput,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      // Process query
      const response = await processChatQuery(tenantId, trimmedInput, analysisData);

      // Add bot response
      const botMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: response.message,
        timestamp: new Date().toISOString(),
        data: response.data,
        responseType: response.response_type
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      setError(error.message);
      
      // Add error message
      const errorMessage = {
        id: `error-${Date.now()}`,
        sender: 'bot',
        text: `Sorry, I encountered an error: ${error.message}`,
        timestamp: new Date().toISOString(),
        data: null,
        responseType: 'error'
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleExportChat = async () => {
    try {
      const result = await exportChatHistory(messages);
      // Handle successful export (e.g., show success message)
    } catch (error) {
      setError('Failed to export chat history');
    }
  };

  const handleCopyMessage = (message) => {
    navigator.clipboard.writeText(message.text);
    // Show success toast or feedback
  };
<div style={{color: "red"}}>TEST CHAT COMPONENT</div>
  const renderMessageContent = (message) => {
    const { text, data, responseType } = message;

    return (
      <Box>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
          {text}
        </Typography>

        {data && (
          <Box sx={{ mt: 2 }}>
            {responseType === 'chart' && (
              <DataVisualization data={data} type={data.chartType} />
            )}

            {responseType === 'code' && (
              <CodeBlock code={data.code} language={data.language} />
            )}

            {responseType === 'table' && (
              <Box sx={{ overflowX: 'auto' }}>
                {/* Render table data */}
              </Box>
            )}

            {(responseType === 'security' || 
              responseType === 'error_handling' ||
              responseType === 'performance' ||
              responseType === 'compliance') && (
              <Card variant="outlined" sx={{ mt: 1 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {data.title}
                  </Typography>
                  <List dense>
                    {data.items?.map((item, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={item.description}
                          secondary={item.details}
                        />
                        {item.severity && (
                          <Chip
                            label={item.severity}
                            color={
                              item.severity === 'High' ? 'error' :
                              item.severity === 'Medium' ? 'warning' : 'success'
                            }
                            size="small"
                          />
                        )}
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            )}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Messages Container */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          p: 2,
          backgroundColor: 'background.default'
        }}
      >
        {messages.map((message) => (
          <Box
            key={message.id}
            sx={{
              display: 'flex',
              flexDirection: message.sender === 'user' ? 'row-reverse' : 'row',
              mb: 2
            }}
          >
            <Avatar
              sx={{
                bgcolor: message.sender === 'user' ? 'primary.main' : 'secondary.main',
                m: 1
              }}
            >
              {message.sender === 'user' ? 'U' : 'B'}
            </Avatar>

            <Paper
              elevation={1}
              sx={{
                maxWidth: '70%',
                p: 2,
                backgroundColor: message.sender === 'user' ? 'primary.light' : 'background.paper',
                color: message.sender === 'user' ? 'primary.contrastText' : 'text.primary'
              }}
            >
              {renderMessageContent(message)}

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  mt: 1,
                  gap: 1
                }}
              >
                <Tooltip title="Copy message">
                  <IconButton
                    size="small"
                    onClick={() => handleCopyMessage(message)}
                  >
                    <CopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                {message.data && (
                  <Tooltip title="View visualization">
                    <IconButton
                      size="small"
                      onClick={() => setSelectedMessage(message)}
                    >
                      <ChartIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}

                {message.data?.code && (
                  <Tooltip title="View code">
                    <IconButton
                      size="small"
                      onClick={() => setSelectedMessage(message)}
                    >
                      <CodeIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Paper>
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </Box>

      {/* Error Message */}
      {error && (
        <Typography
          color="error"
          variant="body2"
          sx={{ px: 2, py: 1 }}
        >
          {error}
        </Typography>
      )}

      {/* Input Container */}
      <Box
        sx={{
          p: 2,
          backgroundColor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider'
        }}
      >
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={input}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            variant="outlined"
            size="small"
            disabled={loading}
            error={!!error}
          />

          <Button
            variant="contained"
            color="primary"
            onClick={handleSendMessage}
            disabled={loading || !input.trim()}
            startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
          >
            Send
          </Button>

          <Tooltip title="Export chat history">
            <IconButton
              onClick={handleExportChat}
              disabled={loading || messages.length <= 1}
            >
              <SaveIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Selected Message Dialog */}
      {/* Add a dialog component to show detailed view of selected message */}
    </Box>
  );
};

export default ChatInterface;