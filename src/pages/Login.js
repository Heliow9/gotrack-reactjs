import React, { useState } from 'react';
import {
  TextField,
  Button,
  Paper,
  Typography,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from '../assets/Logo gotrack.png'; // <- ajuste esse caminho se necessário

function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  console.log("🟢 App montado");
  const handleLogin = async () => {
    setErro('');
    if (!email || !senha) {
      setErro('Preencha todos os campos');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('https://gotrackapi.onrender.com/api/restaurantes/login', {
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

  return (
<Box
  display="flex"
  justifyContent="center"
  alignItems="center"
  minHeight="100vh"
  sx={{
    background: 'linear-gradient(to bottom right, #ffffff, #f2f2f2)',
    padding: 2,
  }}
>

      <Paper
        elevation={4}
        sx={{
          padding: 4,
          width: '100%',
          maxWidth: 400,
          borderRadius: 3,
          textAlign: 'center',
          backgroundColor: '#fff',
        }}
      >
        {/* LOGO */}
        <Box mb={3}>
          <img
            src={logo}
            alt="GoTrack Logo"
            style={{ width: '150px', objectFit: 'contain' }}
          />
        </Box>

        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#ff7b00' }}>
          Login do Restaurante
        </Typography>

        {erro && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {erro}
          </Alert>
        )}

        <TextField
          label="Email"
          placeholder="exemplo@email.com"
          fullWidth
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
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
            backgroundColor: '#ff7b00',
            '&:hover': {
              backgroundColor: '#ff7b10',
            },
          }}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Entrar'}
        </Button>
      </Paper>
    </Box>
  );
}

export default Login;
