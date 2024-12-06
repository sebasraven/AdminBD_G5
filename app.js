const express = require('express');
const bodyParser = require('body-parser');
const oracledb = require('oracledb');

// Configuración de Express
const app = express();
const port = 3000;

// Middleware para parsear JSON en el cuerpo de las solicitudes
app.use(bodyParser.json());
app.use(express.static('public'));  // Para servir archivos estáticos (HTML, CSS, JS)

// Configuración de la base de datos
const dbConfig = {
  user: 'HR', // CAMBIAR USUARIO AL DE LA BD
  password: 'HR', // CAMBIAR PASSWORD AL DE LA BD
  connectString: 'localhost:1521/XE'
};

// Ruta para la raíz del servidor
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');  // Sirve el archivo index.html
});




// Codigo para manejar las tablas




// Arrancar el servidor, esto va al final
app.listen(port, () => {
    console.log(`Servidor escuchando en el puerto ${port}`);
  });

// Para correr la vara hacer en la terminal: node app.js
// Entrar a localhost:3000