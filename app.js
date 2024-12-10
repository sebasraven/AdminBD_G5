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

//ESTADO
// Obtener todos los estados
app.get('/estados', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);

    // Realizar la consulta principal después de establecer la conexión
    const result = await connection.execute('SELECT id_estado, nombre_estado, descripcion, notas, creado_por, fecha_creacion, modificado_por, fecha_modificacion, accion FROM FIDE_ESTADOS_TB');

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



//NACIONALIDAD
app.get('/nacionalidad', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);

    // Consulta para obtener los datos incluyendo el nombre del estado
    const query = `
      SELECT 
        F.id_nacionalidad, 
        F.descripcion, 
        E.nombre_estado, 
        F.creado_por, 
        F.fecha_creacion, 
        F.modificado_por, 
        F.fecha_modificacion, 
        F.accion
      FROM 
        FIDE_NACIONALIDAD_TB F
      JOIN 
        FIDE_ESTADOS_TB E 
      ON 
        F.id_estado = E.id_estado
    `;
    const result = await connection.execute(query);

    // Verifica los datos obtenidos
    console.log('Datos obtenidos:', result.rows);

    res.json(result.rows);
  } catch (err) {
    console.error('Error de conexión o consulta:', err);
    res.status(500).send('Error al obtener las nacionalidades');
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


app.post('/nacionalidad', async (req, res) => {
  const { descripcion } = req.body; // Obtenemos la descripción desde el cuerpo de la solicitud

  if (!descripcion || descripcion.trim() === '') {
    return res.status(400).send('La descripción de la nacionalidad es requerida.');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Llamamos al procedimiento almacenado
    await connection.execute(
      `BEGIN
              FIDE_NACIONALIDAD_TB_INSERT_SP(p_descripcion => :descripcion);
           END;`,
      { descripcion }
    );

    // Confirmamos la transacción
    await connection.commit();
    await connection.close();

    res.status(201).send('Nacionalidad creada exitosamente');
  } catch (err) {
    console.error('Error al insertar la nacionalidad:', err);
    res.status(500).send('Error al insertar la nacionalidad');
  }
});


app.put('/nacionalidad/:id', async (req, res) => {
  const { id } = req.params; // ID de la nacionalidad
  const { descripcion, nuevo_estado } = req.body;  // El nuevo estado (1 para "Activo", 2 para "Inactivo")

  console.log(`Recibiendo solicitud para actualizar la nacionalidad con id: ${id}`);

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Actualizar la nacionalidad en la tabla FIDE_NACIONALIDAD_TB
    const result = await connection.execute(
      `UPDATE FIDE_NACIONALIDAD_TB
       SET descripcion = :descripcion, id_estado = :nuevo_estado
       WHERE id_nacionalidad = :id`,
      { descripcion, nuevo_estado, id }
    );

    // Verifica si la actualización fue exitosa
    console.log(`Filas afectadas: ${result.rowsAffected}`);

    // Realizar el commit
    await connection.commit();
    await connection.close();

    res.send('Nacionalidad actualizada correctamente');
  } catch (err) {
    console.error('Error al actualizar la nacionalidad:', err);
    res.status(500).send('Error al actualizar la nacionalidad');
  }
});


//PAIS
app.get('/pais', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);

    // Consulta para obtener los datos incluyendo el nombre del estado
    const query = `
      SELECT 
        F.id_pais, 
        F.nombre_pais, 
        E.nombre_estado, 
        F.creado_por, 
        F.fecha_creacion, 
        F.modificado_por, 
        F.fecha_modificacion, 
        F.accion
      FROM 
        FIDE_PAIS_TB F
      JOIN 
        FIDE_ESTADOS_TB E 
      ON 
        F.id_estado = E.id_estado
    `;
    const result = await connection.execute(query);

    // Verifica los datos obtenidos
    console.log('Datos obtenidos:', result.rows);

    res.json(result.rows);
  } catch (err) {
    console.error('Error de conexión o consulta:', err);
    res.status(500).send('Error al obtener los paises');
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


app.post('/pais', async (req, res) => {
  const { nombre_pais } = req.body; // Obtenemos la descripción desde el cuerpo de la solicitud

  if (!nombre_pais || nombre_pais.trim() === '') {
    return res.status(400).send('Nombre del pais requerido');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Llamamos al procedimiento almacenado
    await connection.execute(
      `BEGIN
              FIDE_PAIS_TB_INSERT_SP(p_nombre_pais => :nombre_pais);
           END;`,
      { nombre_pais }
    );

    // Confirmamos la transacción
    await connection.commit();
    await connection.close();

    res.status(201).send('Pais creado exitosamente');
  } catch (err) {
    console.error('Error al insertar el pais:', err);
    res.status(500).send('Error al insertar el pais');
  }
});


app.put('/pais/:id', async (req, res) => {
  const { id } = req.params; // ID del pais
  const { nombre_pais, nuevo_estado } = req.body;  // El nuevo estado (1 para "Activo", 2 para "Inactivo")

  console.log(`Recibiendo solicitud para actualizar el pais con id: ${id}`);

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Actualizar la pais en la tabla FIDE_PAIS_TB
    const result = await connection.execute(
      `UPDATE FIDE_PAIS_TB
       SET nombre_pais = :nombre_pais, id_estado = :nuevo_estado
       WHERE id_pais = :id`,
      { nombre_pais, nuevo_estado, id }
    );

    // Verifica si la actualización fue exitosa
    console.log(`Filas afectadas: ${result.rowsAffected}`);

    // Realizar el commit
    await connection.commit();
    await connection.close();

    res.send('Pais actualizada correctamente');
  } catch (err) {
    console.error('Error al actualizar el pais:', err);
    res.status(500).send('Error al actualizar el pais');
  }
});


//PROVINCIA
app.get('/provincia', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);

    // Consulta para obtener los datos incluyendo el nombre del estado y país
    const query = `
      SELECT 
        F.id_provincia, 
        F.nombre_provincia, 
        P.nombre_pais, 
        E.nombre_estado, 
        F.creado_por, 
        F.fecha_creacion, 
        F.modificado_por, 
        F.fecha_modificacion, 
        F.accion
      FROM 
        FIDE_PROVINCIA_TB F
      JOIN 
        FIDE_PAIS_TB P 
      ON 
        F.id_pais = P.id_pais
      JOIN 
        FIDE_ESTADOS_TB E 
      ON 
        F.id_estado = E.id_estado
    `;
    const result = await connection.execute(query);

    // Verifica los datos obtenidos
    console.log('Datos obtenidos:', result.rows);

    res.json(result.rows);
  } catch (err) {
    console.error('Error de conexión o consulta:', err);
    res.status(500).send('Error al obtener las provincias');
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


app.post('/provincia', async (req, res) => {
  const { id_pais, nombre_provincia } = req.body; // Obtenemos la descripción desde el cuerpo de la solicitud

  if (!id_pais || !nombre_provincia || nombre_provincia.trim() === '') {
    return res.status(400).send('ID del país y nombre de la provincia son requeridos');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Llamamos al procedimiento almacenado
    await connection.execute(
      `BEGIN
              FIDE_PROVINCIA_TB_INSERT_SP(p_id_pais => :id_pais, p_nombre_provincia => :nombre_provincia);
           END;`,
      { id_pais, nombre_provincia }
    );

    // Confirmamos la transacción
    await connection.commit();
    await connection.close();

    res.status(201).send('Provincia creada exitosamente');
  } catch (err) {
    console.error('Error al insertar la provincia:', err);
    res.status(500).send('Error al insertar la provincia');
  }
});


app.put('/provincia/:id', async (req, res) => {
  const { id } = req.params; // ID de la provincia
  const { nombre_provincia, nuevo_estado } = req.body;  // El nuevo estado (1 para "Activo", 2 para "Inactivo")

  console.log(`Recibiendo solicitud para actualizar la provincia con id: ${id}`);

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Actualizar la provincia en la tabla FIDE_PROVINCIA_TB
    const result = await connection.execute(
      `UPDATE FIDE_PROVINCIA_TB
       SET nombre_provincia = :nombre_provincia, id_estado = :nuevo_estado
       WHERE id_provincia = :id`,
      { nombre_provincia, nuevo_estado, id }
    );

    // Verifica si la actualización fue exitosa
    console.log(`Filas afectadas: ${result.rowsAffected}`);

    // Realizar el commit
    await connection.commit();
    await connection.close();

    res.send('Provincia actualizada correctamente');
  } catch (err) {
    console.error('Error al actualizar la provincia:', err);
    res.status(500).send('Error al actualizar la provincia');
  }
});


//CANTON
app.get('/canton', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);

    // Consulta para obtener los datos incluyendo el nombre del estado y provincia
    const query = `
      SELECT 
        F.id_canton, 
        F.nombre_canton, 
        P.nombre_provincia, 
        E.nombre_estado, 
        F.creado_por, 
        F.fecha_creacion, 
        F.modificado_por, 
        F.fecha_modificacion, 
        F.accion
      FROM 
        FIDE_CANTON_TB F
      JOIN 
        FIDE_PROVINCIA_TB P 
      ON 
        F.id_provincia = P.id_provincia
      JOIN 
        FIDE_ESTADOS_TB E 
      ON 
        F.id_estado = E.id_estado
    `;
    const result = await connection.execute(query);

    // Verifica los datos obtenidos
    console.log('Datos obtenidos:', result.rows);

    res.json(result.rows);
  } catch (err) {
    console.error('Error de conexión o consulta:', err);
    res.status(500).send('Error al obtener los cantones');
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


app.post('/canton', async (req, res) => {
  const { id_provincia, nombre_canton } = req.body; // Obtenemos la descripción desde el cuerpo de la solicitud

  if (!id_provincia || !nombre_canton || nombre_canton.trim() === '') {
    return res.status(400).send('ID de la provincia y nombre del cantón son requeridos');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Llamamos al procedimiento almacenado
    await connection.execute(
      `BEGIN
              FIDE_CANTON_TB_INSERT_SP(p_id_provincia => :id_provincia, p_nombre_canton => :nombre_canton);
           END;`,
      { id_provincia, nombre_canton }
    );

    // Confirmamos la transacción
    await connection.commit();
    await connection.close();

    res.status(201).send('Cantón creado exitosamente');
  } catch (err) {
    console.error('Error al insertar el cantón:', err);
    res.status(500).send('Error al insertar el cantón');
  }
});


app.put('/canton/:id', async (req, res) => {
  const { id } = req.params; // ID del cantón
  const { nombre_canton, nuevo_estado } = req.body;  // El nuevo estado (1 para "Activo", 2 para "Inactivo")

  console.log(`Recibiendo solicitud para actualizar el cantón con id: ${id}`);

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Actualizar el cantón en la tabla FIDE_CANTON_TB
    const result = await connection.execute(
      `UPDATE FIDE_CANTON_TB
       SET nombre_canton = :nombre_canton, id_estado = :nuevo_estado
       WHERE id_canton = :id`,
      { nombre_canton, nuevo_estado, id }
    );

    // Verifica si la actualización fue exitosa
    console.log(`Filas afectadas: ${result.rowsAffected}`);

    // Realizar el commit
    await connection.commit();
    await connection.close();

    res.send('Cantón actualizado correctamente');
  } catch (err) {
    console.error('Error al actualizar el cantón:', err);
    res.status(500).send('Error al actualizar el cantón');
  }
});


//DISTRITO
app.get('/distrito', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);

    // Consulta para obtener los datos incluyendo el id_canton
    const query = `
      SELECT 
        F.id_distrito, 
        F.nombre_distrito, 
        C.nombre_canton, 
        E.nombre_estado, 
        F.creado_por, 
        F.fecha_creacion, 
        F.modificado_por, 
        F.fecha_modificacion, 
        F.accion,
        F.id_canton  -- Asegúrate de incluir el id_canton aquí
      FROM 
        FIDE_DISTRITO_TB F
      JOIN 
        FIDE_CANTON_TB C 
      ON 
        F.id_canton = C.id_canton
      JOIN 
        FIDE_ESTADOS_TB E 
      ON 
        F.id_estado = E.id_estado
    `;
    const result = await connection.execute(query);

    // Verifica los datos obtenidos
    console.log('Datos obtenidos:', result.rows);

    res.json(result.rows);
  } catch (err) {
    console.error('Error de conexión o consulta:', err);
    res.status(500).send('Error al obtener los distritos');
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



app.post('/distrito', async (req, res) => {
  const { id_canton, nombre_distrito } = req.body; // Obtenemos la descripción desde el cuerpo de la solicitud

  if (!id_canton || !nombre_distrito || nombre_distrito.trim() === '') {
    return res.status(400).send('ID del cantón y nombre del distrito son requeridos');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Llamamos al procedimiento almacenado
    await connection.execute(
      `BEGIN
              FIDE_DISTRITO_TB_INSERT_SP(p_id_canton => :id_canton, p_nombre_distrito => :nombre_distrito);
           END;`,
      { id_canton, nombre_distrito }
    );

    // Confirmamos la transacción
    await connection.commit();
    await connection.close();

    res.status(201).send('Distrito creado exitosamente');
  } catch (err) {
    console.error('Error al insertar el distrito:', err);
    res.status(500).send('Error al insertar el distrito');
  }
});


app.put('/distrito/:id', async (req, res) => {
  const { id } = req.params; // ID del distrito
  const { nombre_distrito, id_canton, nuevo_estado } = req.body;  // Incluye id_canton para la actualización

  console.log(`Recibiendo solicitud para actualizar el distrito con id: ${id}`);
  console.log(`ID Cantón recibido en el servidor: ${id_canton}`); // Log para verificar id_canton

  if (!id_canton) {
    return res.status(400).send('ID del cantón es requerido');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Actualizar el distrito en la tabla FIDE_DISTRITO_TB
    const result = await connection.execute(
      `UPDATE FIDE_DISTRITO_TB
       SET nombre_distrito = :nombre_distrito, id_canton = :id_canton, id_estado = :nuevo_estado
       WHERE id_distrito = :id`,
      { nombre_distrito, id_canton, nuevo_estado, id }
    );

    // Verifica si la actualización fue exitosa
    console.log(`Filas afectadas: ${result.rowsAffected}`);

    // Realizar el commit
    await connection.commit();
    await connection.close();

    res.send('Distrito actualizado correctamente');
  } catch (err) {
    console.error('Error al actualizar el distrito:', err);
    res.status(500).send('Error al actualizar el distrito');
  }
});


















// Arrancar el servidor, esto va al final
app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});