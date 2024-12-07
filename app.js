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
  user: 'PRUEBAS', // CAMBIAR USUARIO AL DE LA BD
  password: 'PRUEBAS', // CAMBIAR PASSWORD AL DE LA BD
  connectString: 'localhost:1521/XE'
};

// Ruta para la raíz del servidor
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');  // Sirve el archivo index.html
});




// Codigo para manejar las tablas
// Ruta para obtener todos los estados (ACTIVO e INACTIVO)
app.get('/estados', async (req, res) => {
  try {
    const connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT * FROM FIDE_ESTADOS_TB`
    );
    await connection.close();
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al obtener los estados');
  }
});

// Ruta para obtener un estado específico por ID
app.get('/estados/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT * FROM FIDE_ESTADOS_TB WHERE ESTADOS_ID_ESTADO_PK = :id`,
      [id]
    );
    await connection.close();
    if (result.rows.length === 0) {
      res.status(404).send('Estado no encontrado');
    } else {
      res.json(result.rows[0]);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al obtener el estado');
  }
});

// Ruta para crear un nuevo estado
app.post('/estados', async (req, res) => {
  const { nombre_estado, descripcion, notas } = req.body;

  // Validación: evitar duplicar los valores ACTIVO o INACTIVO
  if (['ACTIVO', 'INACTIVO'].includes(nombre_estado.toUpperCase())) {
    return res.status(400).send('El estado ya existe.');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);
    await connection.execute(
      `INSERT INTO FIDE_ESTADOS_TB (ESTADOS_ID_ESTADO_PK, NOMBRE_ESTADO, DESCRIPCION, NOTAS)
       VALUES (FIDE_ESTADOS_SEQ.NEXTVAL, :nombre_estado, :descripcion, :notas)`,
      { nombre_estado, descripcion, notas },
      { autoCommit: true }
    );
    await connection.close();
    res.status(201).send('Estado creado con éxito');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al crear el estado');
  }
});

// Ruta para actualizar un estado existente
app.put('/estados/:id', async (req, res) => {
  const { id } = req.params;
  const { descripcion, notas } = req.body;

  try {
    const connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `UPDATE FIDE_ESTADOS_TB
       SET DESCRIPCION = :descripcion, NOTAS = :notas
       WHERE ESTADOS_ID_ESTADO_PK = :id`,
      { descripcion, notas, id },
      { autoCommit: true }
    );
    await connection.close();
    if (result.rowsAffected === 0) {
      res.status(404).send('Estado no encontrado');
    } else {
      res.send('Estado actualizado con éxito');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al actualizar el estado');
  }
});

// Ruta para eliminar (lógicamente) un estado (esto sería muy raro en tu caso)
app.delete('/estados/:id', async (req, res) => {
  const { id } = req.params;

  // Prevención: No deberíamos eliminar "ACTIVO" o "INACTIVO"
  return res.status(403).send('No se permite eliminar los estados ACTIVO o INACTIVO.');
});




// Arrancar el servidor, esto va al final
app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});

// Para correr la vara hacer en la terminal: node app.js
// Entrar a localhost:3000