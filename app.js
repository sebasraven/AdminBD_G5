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


////////////////// Codigo para manejar las tablas //////////////////

// Obtener todos los estados
app.get('/estados', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);

    // Realizar la consulta principal después de establecer la conexión
    const result = await connection.execute('SELECT id_estado, nombre_estado, descripcion, notas, creado_por, fecha_creacion, modificado_por, fecha_modificacion, accion FROM FIDE_ESTADOS_TB');
    
    // Verifica los datos obtenidos
    console.log('Me esta llegando esto');
    console.log(result.rows); // Verifica los datos

    res.json(result.rows);
  } catch (err) {
    console.error('Error de conexión o consulta:', err);
    res.status(500).send('Error al obtener los estados');
  } finally {
    // Asegúrate de cerrar la conexión al final
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error('Error al cerrar la conexión:', closeErr);
      }
    }
  }
});


// Insertar un estado mediante procedimiento almacenado
app.post('/estados', async (req, res) => {
  const { nombre_estado, descripcion, notas } = req.body;
  console.log('Recibiendo datos para agregar:', req.body); // Depuración
  try {
    const connection = await oracledb.getConnection(dbConfig);
    console.log(nombre_estado, descripcion, notas); // Verifica si los valores son correctos
    await connection.execute(
      `BEGIN FIDE_ESTADOS_TB_INSERT_SP(:nombre_estado, :descripcion, :notas); END;`,
      { nombre_estado, descripcion, notas },
      { autoCommit: true }
    );
    await connection.close();
    res.send('Estado agregado correctamente');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al agregar el estado');
  }
});

// Actualizar un estado
app.put('/estados/:id_estado', async (req, res) => {
  const { id_estado } = req.params;
  const { nombre_estado, descripcion, notas } = req.body;

  try {
    const connection = await oracledb.getConnection(dbConfig);
    await connection.execute(
      `UPDATE FIDE_ESTADOS_TB SET nombre_estado = :nombre_estado, descripcion = :descripcion, notas = :notas WHERE id_estado = :id_estado`,
      { id_estado, nombre_estado, descripcion, notas },
      { autoCommit: true }
    );
    await connection.close();

    res.send('Estado actualizado correctamente');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al actualizar el estado');
  }
});

// Eliminar un estado
app.delete('/estados/:id_estado', async (req, res) => {
  const { id_estado } = req.params;

  try {
    const connection = await oracledb.getConnection(dbConfig);
    await connection.execute(`DELETE FROM FIDE_ESTADOS_TB WHERE id_estado = :id_estado`, { id_estado }, { autoCommit: true });
    await connection.close();

    res.send('Estado eliminado correctamente');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al eliminar el estado');
  }
});

// Arrancar el servidor, esto va al final
app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
