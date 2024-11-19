// Importar dependencias
require('dotenv').config(); // Cargar variables del archivo .env
const express = require('express');
const { google } = require('googleapis');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

// Crear una instancia de Express
const app = express();

// Middlewares
app.use(cookieParser());
app.use(bodyParser.json());

// Configurar el cliente OAuth2 de Google
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Ruta para iniciar el proceso de autenticación con Google
app.get('/auth/google', (req, res) => {
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile', // Obtener información de perfil
    'https://www.googleapis.com/auth/userinfo.email',   // Obtener email del usuario
  ];

  // Generar la URL para el flujo de autenticación
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Necesario para obtener un token de actualización
    scope: scopes,
  });

  res.redirect(url); // Redirige al usuario a Google para autenticar
});

// Ruta de callback después de la autenticación
app.get('/auth/google/callback', async (req, res) => {
  const code = req.query.code; // Código de autorización proporcionado por Google

  try {
    // Intercambiar el código por un token de acceso
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Obtener información del usuario desde la API de Google
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: 'v2',
    });

    const userInfo = await oauth2.userinfo.get(); // Solicita la información del usuario
    console.log('Información del usuario:', userInfo.data);

    // Responde con la información del usuario
    res.json({
      message: 'Inicio de sesión exitoso',
      user: userInfo.data,
    });
  } catch (error) {
    console.error('Error al autenticar:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// Ruta de inicio (opcional)
app.get('/', (req, res) => {
  res.send('Bienvenido a la API de autenticación con Google. Ve a /auth/google para iniciar sesión.');
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
