import React, { useState, useEffect, useRef } from 'react';
import {
  TextField,
  Button,
  Paper,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Fade,
  Popper,
  Paper as PopperPaper,
  List,
  ListItem,
  ListItemButton,
  ListItemText
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from '../assets/logo.png';

const dominios = ['gmail.com', 'hotmail.com', 'outlook.com', 'icloud.com'];

function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const emailRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    setFadeIn(true);
  }, []);

  const handleLogin = async () => {
    setErro('');
    if (!email || !senha) {
      setErro('Preencha todos os campos');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:10000/api/restaurantes/login', {
        email,
        senha,
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('_id', response.data.restaurante._id);
      navigate('/');
    } catch (err) {
      setErro(err.response?.data?.mensagem || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);

    const [prefix, typedDomain] = val.split('@');

    if (val.includes('@') && !typedDomain.includes('.')) {
      const filtered = dominios
        .filter((dom) => dom.startsWith(typedDomain))
        .map((dom) => `${prefix}@${dom}`);
      setSuggestions(filtered);
      setAnchorEl(emailRef.current);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggested) => {
    setEmail(suggested);
    setSuggestions([]);
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{
        backgroundColor: '#d90429',
        padding: 2,
      }}
    >
      <Fade in={fadeIn} timeout={600}>
        <Paper
          elevation={6}
          sx={{
            padding: 4,
            width: '100%',
            maxWidth: 400,
            borderRadius: 4,
            textAlign: 'center',
            backgroundColor: '#fff',
          }}
        >
          <Box mb={3}>
            <img
              src={logo}
              alt="RapiGO Logo"
              style={{ width: '130px', objectFit: 'contain' }}
            />
          </Box>

          <Typography
            variant="h5"
            gutterBottom
            sx={{
              fontWeight: 700,
              color: '#d90429',
              letterSpacing: '0.5px'
            }}
          >
            Login do Restaurante
          </Typography>

          {erro && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {erro}
            </Alert>
          )}

          {/* CAMPO DE EMAIL COM SUGESTÕES */}
          <TextField
            label="Email"
            placeholder="exemplo@email.com"
            fullWidth
            margin="normal"
            value={email}
            onChange={handleEmailChange}
            inputRef={emailRef}
          />

          <Popper open={suggestions.length > 0} anchorEl={anchorEl} style={{ zIndex: 1300 }}>
            <PopperPaper sx={{ width: emailRef.current?.offsetWidth }}>
              <List dense>
                {suggestions.map((suggestion) => (
                  <ListItem key={suggestion} disablePadding>
                    <ListItemButton onClick={() => handleSuggestionClick(suggestion)}>
                      <ListItemText primary={suggestion} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </PopperPaper>
          </Popper>

          <TextField
            label="Senha"
            type="password"
            placeholder="********"
            fullWidth
            margin="normal"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />

          <Button
            variant="contained"
            fullWidth
            sx={{
              mt: 3,
              py: 1.5,
              fontWeight: 'bold',
              backgroundColor: '#d90429',
              boxShadow: '0 3px 5px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                backgroundColor: '#b40320',
                boxShadow: '0 5px 10px rgba(0, 0, 0, 0.3)',
                filter: 'brightness(1.05)',
              },
            }}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'ENTRAR'}
          </Button>
        </Paper>
      </Fade>
    </Box>
  );
}

export default Login;
