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
  user: 'ProyectoAdmin', // CAMBIAR USUARIO AL DE LA BD
  password: 'ProyectoAdmin', // CAMBIAR PASSWORD AL DE LA BD
  connectString: 'localhost:1521/XEPDB1'
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
    const result = await connection.execute('SELECT * FROM V_FIDE_ESTADOS');

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
      `BEGIN
    FIDE_ESTADOS_TB_ACTUALIZAR_SP(
        p_id_estado => :id_estado,
        p_nombre_estado => :nombre_estado,
        p_descripcion => :descripcion,
        p_notas => :notas
    ); END;`,
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
    await connection.execute(`BEGIN FIDE_ESTADOS_TB_ELIMINAR_SP(p_id_estado => :id_estado); END;`, 
    { id_estado }, { autoCommit: true });
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
      SELECT * FROM V_FIDE_NACIONALIDADES
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
  const { descripcion, nuevo_estado } = req.body; // Descripción y nuevo estado de la nacionalidad

  if (!descripcion || !nuevo_estado) {
    return res.status(400).send('Todos los campos son requeridos');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Actualizar la nacionalidad en la tabla FIDE_NACIONALIDAD_TB
    const result = await connection.execute(
      `BEGIN
    FIDE_NACIONALIDAD_TB_ACTUALIZAR_SP(
        p_id_nacionalidad => :id,
        p_descripcion => :descripcion,
        p_nuevo_estado => :nuevo_estado
    ); END;`,
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
      SELECT * FROM V_FIDE_PAIS_DETALLES
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
      `BEGIN
    FIDE_PAIS_TB_ACTUALIZAR_SP(
        p_id_pais => :id,
        p_nombre_pais => :nombre_pais,
        p_nuevo_estado => :nuevo_estado
    ); END;`,
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
      SELECT * FROM V_FIDE_PROVINCIA_DETALLES
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
      `BEGIN
    FIDE_PROVINCIA_TB_ACTUALIZAR_SP(
        p_id_provincia     => :id, 
        p_nombre_provincia => :nombre_provincia, 
        p_nuevo_estado     => :nuevo_estado
    ); END;
`,
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
      SELECT *
FROM V_FIDE_CANTON_DETALLES
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
      `BEGIN
    FIDE_CANTON_TB_ACTUALIZAR_SP(
        p_id_canton => :id,
        p_nombre_canton => :nombre_canton,
        p_nuevo_estado => :nuevo_estado
    ); END;`,
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
      SELECT *
FROM V_FIDE_DISTRITO_DETALLES
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
      `BEGIN
    FIDE_DISTRITO_TB_ACTUALIZAR_SP(
        p_id_distrito => :id,
        p_nombre_distrito => :nombre_distrito,
        p_id_canton => :id_canton,
        p_nuevo_estado => :nuevo_estado
    ); END;
`,
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


//ROLES
app.get('/roles', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);

    // Consulta para obtener los datos incluyendo el nombre del estado
    const query = `
      SELECT *
FROM V_FIDE_ROLES_DETALLES
    `;
    const result = await connection.execute(query);

    // Verifica los datos obtenidos
    console.log('Datos obtenidos:', result.rows);

    res.json(result.rows);
  } catch (err) {
    console.error('Error de conexión o consulta:', err);
    res.status(500).send('Error al obtener los roles');
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


app.post('/roles', async (req, res) => {
  const { nombre_rol, descripcion } = req.body; // Obtenemos la descripción desde el cuerpo de la solicitud

  if (!nombre_rol || !descripcion || nombre_rol.trim() === '' || descripcion.trim() === '') {
    return res.status(400).send('Nombre y descripción del rol son requeridos');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Llamamos al procedimiento almacenado
    await connection.execute(
      `BEGIN
              FIDE_ROLES_TB_INSERT_SP(p_nombre_rol => :nombre_rol, p_descripcion => :descripcion);
           END;`,
      { nombre_rol, descripcion }
    );

    // Confirmamos la transacción
    await connection.commit();
    await connection.close();

    res.status(201).send('Rol creado exitosamente');
  } catch (err) {
    console.error('Error al insertar el rol:', err);
    res.status(500).send('Error al insertar el rol');
  }
});


app.put('/roles/:id', async (req, res) => {
  const { id } = req.params; // ID del rol
  const { nombre_rol, descripcion, nuevo_estado } = req.body;  // Incluye descripcion para la actualización

  console.log(`Recibiendo solicitud para actualizar el rol con id: ${id}`);
  console.log(`Descripción recibida en el servidor: ${descripcion}`); // Log para verificar descripcion

  if (!descripcion) {
    return res.status(400).send('Descripción del rol es requerida');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Actualizar el rol en la tabla FIDE_ROLES_TB
    const result = await connection.execute(
      `BEGIN
    FIDE_ROLES_TB_ACTUALIZAR_SP(
        p_id_rol => :id,
        p_nombre_rol => :nombre_rol,
        p_descripcion => :descripcion,
        p_nuevo_estado => :nuevo_estado
    ); END;
`,
      { nombre_rol, descripcion, nuevo_estado, id }
    );

    // Verifica si la actualización fue exitosa
    console.log(`Filas afectadas: ${result.rowsAffected}`);

    // Realizar el commit
    await connection.commit();
    await connection.close();

    res.send('Rol actualizado correctamente');
  } catch (err) {
    console.error('Error al actualizar el rol:', err);
    res.status(500).send('Error al actualizar el rol');
  }
});



//USUARIOS
app.get('/usuarios', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);

    // Consulta para obtener los datos incluyendo los nombres de los roles, estados, nacionalidades, países, provincias, cantones y distritos
    const query = `
      SELECT *
FROM V_FIDE_USUARIOS_DETALLES
    `;
    const result = await connection.execute(query);

    // Verifica los datos obtenidos
    console.log('Datos obtenidos:', result.rows);

    res.json(result.rows);
  } catch (err) {
    console.error('Error de conexión o consulta:', err);
    res.status(500).send('Error al obtener los usuarios');
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


app.post('/usuarios', async (req, res) => {
  const { id_rol, id_nacionalidad, id_pais, id_provincia, id_canton, id_distrito, nombre, apellidos, cedula, telefono, correo, contrasena, fecha_nacimiento } = req.body;

  if (!nombre || !apellidos || !cedula || !telefono || !correo || !contrasena || !fecha_nacimiento) {
    return res.status(400).send('Todos los campos son requeridos');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Llamamos al procedimiento almacenado
    await connection.execute(
      `BEGIN
              FIDE_USUARIOS_TB_INSERT_SP(p_id_rol => :id_rol, p_id_nacionalidad => :id_nacionalidad, p_id_pais => :id_pais, p_id_provincia => :id_provincia, p_id_canton => :id_canton, p_id_distrito => :id_distrito, p_nombre => :nombre, p_apellidos => :apellidos, p_cedula => :cedula, p_telefono => :telefono, p_correo => :correo, p_contrasena => :contrasena, p_fecha_nacimiento => TO_DATE(:fecha_nacimiento, 'YYYY-MM-DD'));
           END;`,
      { id_rol, id_nacionalidad, id_pais, id_provincia, id_canton, id_distrito, nombre, apellidos, cedula, telefono, correo, contrasena, fecha_nacimiento }
    );

    // Confirmamos la transacción
    await connection.commit();
    await connection.close();

    res.status(201).send('Usuario creado exitosamente');
  } catch (err) {
    console.error('Error al insertar el usuario:', err);
    res.status(500).send('Error al insertar el usuario');
  }
});

app.put('/usuarios/:id', async (req, res) => {
  const { id } = req.params; // ID del usuario
  const { nombre, apellidos, cedula, telefono, correo, fecha_nacimiento, id_rol, id_nacionalidad, id_pais, id_provincia, id_canton, id_distrito, contrasena, nuevo_estado } = req.body;

  console.log(`Recibiendo solicitud para actualizar el usuario con id: ${id}`);

  if (!nombre || !apellidos || !cedula || !telefono || !correo || !fecha_nacimiento || !id_rol || !id_nacionalidad || !id_pais || !id_provincia || !id_canton || !id_distrito || !contrasena) {
    return res.status(400).send('Todos los campos son requeridos');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Actualizar el usuario en la tabla FIDE_USUARIOS_TB
    const result = await connection.execute(
      `BEGIN
    FIDE_USUARIOS_TB_ACTUALIZAR_SP(
        p_id_usuario => :id,
        p_nombre => :nombre,
        p_apellidos => :apellidos,
        p_cedula => :cedula,
        p_telefono => :telefono,
        p_correo => :correo,
        p_fecha_nacimiento => TO_DATE(:fecha_nacimiento, 'YYYY-MM-DD'),
        p_id_rol => :id_rol,
        p_id_nacionalidad => :id_nacionalidad,
        p_id_pais => :id_pais,
        p_id_provincia => :id_provincia,
        p_id_canton => :id_canton,
        p_id_distrito => :id_distrito,
        p_contrasena => :contrasena,
        p_nuevo_estado => :nuevo_estado
    ); END;`,
      { nombre, apellidos, cedula, telefono, correo, fecha_nacimiento, id_rol, id_nacionalidad, id_pais, id_provincia, id_canton, id_distrito, contrasena, nuevo_estado, id }
    );

    // Verifica si la actualización fue exitosa
    console.log(`Filas afectadas: ${result.rowsAffected}`);

    // Realizar el commit
    await connection.commit();
    await connection.close();

    res.send('Usuario actualizado correctamente');
  } catch (err) {
    console.error('Error al actualizar el usuario:', err);
    res.status(500).send('Error al actualizar el usuario');
  }
});

//MONEDAS
app.get('/monedas', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);

    // Consulta para obtener los datos incluyendo el nombre del estado
    const query = `
      SELECT *
FROM V_FIDE_MONEDAS_DETALLES
    `;
    const result = await connection.execute(query);

    // Verifica los datos obtenidos
    console.log('Datos obtenidos:', result.rows);

    res.json(result.rows);
  } catch (err) {
    console.error('Error de conexión o consulta:', err);
    res.status(500).send('Error al obtener las monedas');
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

app.post('/monedas', async (req, res) => {
  const { codigo_moneda, nombre_moneda } = req.body;

  if (!codigo_moneda || !nombre_moneda) {
    return res.status(400).send('Código y nombre de la moneda son requeridos');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Llamamos al procedimiento almacenado
    await connection.execute(
      `BEGIN
              FIDE_MONEDA_TB_INSERT_SP(p_codigo_moneda => :codigo_moneda, p_nombre_moneda => :nombre_moneda);
           END;`,
      { codigo_moneda, nombre_moneda }
    );

    // Confirmamos la transacción
    await connection.commit();
    await connection.close();

    res.status(201).send('Moneda creada exitosamente');
  } catch (err) {
    console.error('Error al insertar la moneda:', err);
    res.status(500).send('Error al insertar la moneda');
  }
});

app.put('/monedas/:id', async (req, res) => {
  const { id } = req.params; // ID de la moneda
  const { codigo_moneda, nombre_moneda, nuevo_estado } = req.body;

  console.log(`Recibiendo solicitud para actualizar la moneda con id: ${id}`);

  if (!codigo_moneda || !nombre_moneda) {
    return res.status(400).send('Código y nombre de la moneda son requeridos');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Actualizar la moneda en la tabla FIDE_MONEDA_TB
    const result = await connection.execute(
      `BEGIN
    FIDE_MONEDA_TB_ACTUALIZAR_SP(
        p_id_moneda => :id,
        p_codigo_moneda => :codigo_moneda,
        p_nombre_moneda => :nombre_moneda,
        p_nuevo_estado => :nuevo_estado
    ); END;`,
      { codigo_moneda, nombre_moneda, nuevo_estado, id }
    );

    // Verifica si la actualización fue exitosa
    console.log(`Filas afectadas: ${result.rowsAffected}`);

    // Realizar el commit
    await connection.commit();
    await connection.close();

    res.send('Moneda actualizada correctamente');
  } catch (err) {
    console.error('Error al actualizar la moneda:', err);
    res.status(500).send('Error al actualizar la moneda');
  }
});


//TIPOS DE CAMBIO
app.get('/tipo_cambio', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);

    // Consulta para obtener los datos incluyendo el nombre de la moneda
    const query = `
      SELECT *
FROM V_FIDE_TIPO_CAMBIO_DETALLES
    `;
    const result = await connection.execute(query);

    // Verifica los datos obtenidos
    console.log('Datos obtenidos:', result.rows);

    res.json(result.rows);
  } catch (err) {
    console.error('Error de conexión o consulta:', err);
    res.status(500).send('Error al obtener los tipos de cambio');
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

app.post('/tipo_cambio', async (req, res) => {
  const { id_moneda, fecha, tasa_cambio } = req.body;

  if (!id_moneda || !fecha || !tasa_cambio) {
    return res.status(400).send('Todos los campos son requeridos');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Llamamos al procedimiento almacenado
    await connection.execute(
      `BEGIN
              FIDE_TIPO_CAMBIO_TB_INSERT_SP(p_id_moneda => :id_moneda, p_fecha => TO_DATE(:fecha, 'YYYY-MM-DD'), p_tasa_cambio => :tasa_cambio);
           END;`,
      { id_moneda, fecha, tasa_cambio }
    );

    // Confirmamos la transacción
    await connection.commit();
    await connection.close();

    res.status(201).send('Tipo de cambio creado exitosamente');
  } catch (err) {
    console.error('Error al insertar el tipo de cambio:', err);
    res.status(500).send('Error al insertar el tipo de cambio');
  }
});

app.put('/tipo_cambio/:id', async (req, res) => {
  const { id } = req.params; // ID del tipo de cambio
  const { id_moneda, fecha, tasa_cambio } = req.body;

  console.log(`Recibiendo solicitud para actualizar el tipo de cambio con id: ${id}`);

  if (!id_moneda || !fecha || !tasa_cambio) {
    return res.status(400).send('Todos los campos son requeridos');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Actualizar el tipo de cambio en la tabla FIDE_TIPO_CAMBIO_TB
    const result = await connection.execute(
      `BEGIN
    FIDE_TIPO_CAMBIO_TB_ACTUALIZAR_SP(
        p_id_tipo_cambio => :id,
        p_id_moneda => :id_moneda,
        p_fecha => TO_DATE(:fecha, 'YYYY-MM-DD'),
        p_tasa_cambio => :tasa_cambio
    ); END;`,
      { id_moneda, fecha, tasa_cambio, id }
    );

    // Verifica si la actualización fue exitosa
    console.log(`Filas afectadas: ${result.rowsAffected}`);

    // Realizar el commit
    await connection.commit();
    await connection.close();

    res.send('Tipo de cambio actualizado correctamente');
  } catch (err) {
    console.error('Error al actualizar el tipo de cambio:', err);
    res.status(500).send('Error al actualizar el tipo de cambio');
  }
});


// IMPUESTOS
app.get('/impuestos', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);

    // Consulta para obtener los datos incluyendo los nombres del país y del estado
    const query = `
      SELECT *
FROM V_FIDE_IMPUESTOS_DETALLES
    `;
    const result = await connection.execute(query);

    // Verifica los datos obtenidos
    console.log('Datos obtenidos:', result.rows);

    res.json(result.rows);
  } catch (err) {
    console.error('Error de conexión o consulta:', err);
    res.status(500).send('Error al obtener los impuestos');
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

app.post('/impuestos', async (req, res) => {
  const { nombre_impuesto, porcentaje, id_pais, id_estado } = req.body;

  if (!nombre_impuesto || !porcentaje || !id_pais || !id_estado) {
    return res.status(400).send('Todos los campos son requeridos');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Llamar al procedimiento almacenado para insertar los datos principales
    await connection.execute(
      `BEGIN
              FIDE_IMPUESTOS_TB_INSERT_SP(p_id_pais => :id_pais, p_nombre_impuesto => :nombre_impuesto, p_porcentaje => :porcentaje);
           END;`,
      { id_pais, nombre_impuesto, porcentaje }
    );

    // Recuperar el ID del último impuesto insertado
    const result = await connection.execute(
      `SELECT ID_IMPUESTO_SEQ.CURRVAL AS last_id FROM dual`
    );
    const lastId = result.rows[0][0];

    // Actualizar el campo id_estado para el impuesto recién insertado
    await connection.execute(
      `BEGIN
    FIDE_IMPUESTOS_TB_ACTUALIZAR_ESTADO_SP(
        p_id_impuesto => :lastId,
        p_id_estado => :id_estado
    ); END;`,
      { id_estado, lastId }
    );

    // Confirmar la transacción
    await connection.commit();
    await connection.close();

    res.status(201).send('Impuesto creado exitosamente');
  } catch (err) {
    console.error('Error al insertar el impuesto:', err);
    res.status(500).send('Error al insertar el impuesto');
  }
});

app.put('/impuestos/:id', async (req, res) => {
  const { id } = req.params; // ID del impuesto
  const { nombre_impuesto, porcentaje, id_pais, id_estado } = req.body;

  console.log(`Recibiendo solicitud para actualizar el impuesto con id: ${id}`);

  if (!nombre_impuesto || !porcentaje || !id_pais || !id_estado) {
    return res.status(400).send('Todos los campos son requeridos');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Actualizar el impuesto en la tabla FIDE_IMPUESTOS_TB
    const result = await connection.execute(
      `UPDATE FIDE_IMPUESTOS_TB
       SET nombre_impuesto = :nombre_impuesto, porcentaje = :porcentaje, id_pais = :id_pais, id_estado = :id_estado
       WHERE id_impuesto = :id`,
      { nombre_impuesto, porcentaje, id_pais, id_estado, id }
    );

    // Verifica si la actualización fue exitosa
    console.log(`Filas afectadas: ${result.rowsAffected}`);

    // Realizar el commit
    await connection.commit();
    await connection.close();

    res.send('Impuesto actualizado correctamente');
  } catch (err) {
    console.error('Error al actualizar el impuesto:', err);
    res.status(500).send('Error al actualizar el impuesto');
  }
});


// HOTELES
app.get('/hoteles', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);

    // Consulta para obtener los datos de los hoteles incluyendo nombres de país, provincia, cantón y distrito
    const query = `
      SELECT *
FROM V_FIDE_HOTELES_DETALLES
    `;
    const result = await connection.execute(query);

    // Verifica los datos obtenidos
    console.log('Datos obtenidos:', result.rows);

    res.json(result.rows);
  } catch (err) {
    console.error('Error de conexión o consulta:', err);
    res.status(500).send('Error al obtener los hoteles');
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

app.post('/hoteles', async (req, res) => {
  const { nombre_hotel, telefono, id_pais, id_provincia, id_canton, id_distrito } = req.body;

  if (!nombre_hotel || !telefono || !id_pais || !id_provincia || !id_canton || !id_distrito) {
    return res.status(400).send('Todos los campos son requeridos');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Llamar al procedimiento almacenado para insertar los datos principales
    await connection.execute(
      `BEGIN
              FIDE_HOTELES_TB_INSERT_SP(p_id_pais => :id_pais, p_id_provincia => :id_provincia, p_id_canton => :id_canton, p_id_distrito => :id_distrito, p_nombre_hotel => :nombre_hotel, p_telefono => :telefono);
           END;`,
      { id_pais, id_provincia, id_canton, id_distrito, nombre_hotel, telefono }
    );

    // Recuperar el ID del último hotel insertado
    const result = await connection.execute(
      `SELECT FIDE_HOTEL_ULTIMO_ID() AS last_id FROM dual`
    );
    const lastId = result.rows[0][0];

    // Confirmar la transacción
    await connection.commit();
    await connection.close();

    res.status(201).send('Hotel creado exitosamente');
  } catch (err) {
    console.error('Error al insertar el hotel:', err);
    res.status(500).send('Error al insertar el hotel');
  }
});

app.put('/hoteles/:id', async (req, res) => {
  const { id } = req.params; // ID del hotel
  const { nombre_hotel, telefono, id_pais, id_provincia, id_canton, id_distrito } = req.body;

  console.log(`Recibiendo solicitud para actualizar el hotel con id: ${id}`);

  if (!nombre_hotel || !telefono || !id_pais || !id_provincia || !id_canton || !id_distrito) {
    return res.status(400).send('Todos los campos son requeridos');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Actualizar el hotel en la tabla FIDE_HOTELES_TB
    const result = await connection.execute(
      `BEGIN
    FIDE_HOTELES_TB_ACTUALIZAR_SP(
        p_id_hotel => :id,
        p_nombre_hotel => :nombre_hotel,
        p_telefono => :telefono,
        p_id_pais => :id_pais,
        p_id_provincia => :id_provincia,
        p_id_canton => :id_canton,
        p_id_distrito => :id_distrito
    ); END;`,
      { nombre_hotel, telefono, id_pais, id_provincia, id_canton, id_distrito, id }
    );

    // Verifica si la actualización fue exitosa
    console.log(`Filas afectadas: ${result.rowsAffected}`);

    // Realizar el commit
    await connection.commit();
    await connection.close();

    res.send('Hotel actualizado correctamente');
  } catch (err) {
    console.error('Error al actualizar el hotel:', err);
    res.status(500).send('Error al actualizar el hotel');
  }
});

app.put('/hoteles/toggleState/:id', async (req, res) => {
  const { id } = req.params; // ID del hotel
  const { newState } = req.body;

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Actualizar el estado del hotel en la tabla FIDE_HOTELES_TB
    const result = await connection.execute(
      `BEGIN
    FIDE_HOTELES_TB_ACTUALIZAR_ESTADO_SP(
        p_id_hotel => :id,
        p_new_state => :newState
    ); END;`,
      { newState, id }
    );

    // Verifica si la actualización fue exitosa
    console.log(`Filas afectadas: ${result.rowsAffected}`);

    // Realizar el commit
    await connection.commit();
    await connection.close();

    res.send('Estado del hotel actualizado correctamente');
  } catch (err) {
    console.error('Error al actualizar el estado del hotel:', err);
    res.status(500).send('Error al actualizar el estado del hotel');
  }
});



// HABITACIONES
app.get('/habitaciones', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);

    // Consulta para obtener los datos de las habitaciones incluyendo nombres de hotel y moneda
    const query = `
      SELECT *
FROM V_FIDE_HABITACIONES_DETALLES
    `;
    const result = await connection.execute(query);

    // Verifica los datos obtenidos
    console.log('Datos obtenidos:', result.rows);

    res.json(result.rows);
  } catch (err) {
    console.error('Error de conexión o consulta:', err);
    res.status(500).send('Error al obtener las habitaciones');
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


app.post('/habitaciones', async (req, res) => {
  const { id_hotel, id_moneda, numero_habitacion, tipo_habitacion, precio_por_noche, capacidad_personas } = req.body;

  if (!id_hotel || !id_moneda || !numero_habitacion || !tipo_habitacion || !precio_por_noche || !capacidad_personas) {
    return res.status(400).send('Todos los campos son requeridos');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Llamar al procedimiento almacenado para insertar los datos principales
    await connection.execute(
      `BEGIN
              FIDE_HABITACIONES_TB_INSERT_SP(p_id_hotel => :id_hotel, p_id_moneda => :id_moneda, p_numero_habitacion => :numero_habitacion, p_tipo_habitacion => :tipo_habitacion, p_precio_por_noche => :precio_por_noche, p_capacidad_personas => :capacidad_personas);
           END;`,
      { id_hotel, id_moneda, numero_habitacion, tipo_habitacion, precio_por_noche, capacidad_personas }
    );

    // Recuperar el ID de la última habitación insertada
    const result = await connection.execute(
      `SELECT FIDE_HABITACION_ULTIMO_ID() AS last_id FROM dual`
    );
    const lastId = result.rows[0][0];

    // Confirmar la transacción
    await connection.commit();
    await connection.close();

    res.status(201).send('Habitación creada exitosamente');
  } catch (err) {
    console.error('Error al insertar la habitación:', err);
    res.status(500).send('Error al insertar la habitación');
  }
});

app.put('/habitaciones/:id', async (req, res) => {
  const { id } = req.params; // ID de la habitación
  const { id_hotel, id_moneda, numero_habitacion, tipo_habitacion, precio_por_noche, capacidad_personas } = req.body;

  console.log(`Recibiendo solicitud para actualizar la habitación con id: ${id}`);

  if (!id_hotel || !id_moneda || !numero_habitacion || !tipo_habitacion || !precio_por_noche || !capacidad_personas) {
    return res.status(400).send('Todos los campos son requeridos');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Actualizar la habitación en la tabla FIDE_HABITACIONES_TB
    const result = await connection.execute(
      `BEGIN
    FIDE_HABITACIONES_TB_ACTUALIZAR_SP(
        p_id_habitacion => :id,
        p_id_hotel => :id_hotel,
        p_id_moneda => :id_moneda,
        p_numero_habitacion => :numero_habitacion,
        p_tipo_habitacion => :tipo_habitacion,
        p_precio_por_noche => :precio_por_noche,
        p_capacidad_personas => :capacidad_personas
    ); END;`,
      { id_hotel, id_moneda, numero_habitacion, tipo_habitacion, precio_por_noche, capacidad_personas, id }
    );

    // Verifica si la actualización fue exitosa
    console.log(`Filas afectadas: ${result.rowsAffected}`);

    // Realizar el commit
    await connection.commit();
    await connection.close();

    res.send('Habitación actualizada correctamente');
  } catch (err) {
    console.error('Error al actualizar la habitación:', err);
    res.status(500).send('Error al actualizar la habitación');
  }
});

app.put('/habitaciones/toggleState/:id', async (req, res) => {
  const { id } = req.params; // ID de la habitación
  const { newState } = req.body;

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Actualizar el estado de la habitación en la tabla FIDE_HABITACIONES_TB
    const result = await connection.execute(
      `BEGIN
    FIDE_HABITACIONES_TB_ACTUALIZAR_ESTADO_SP(
        p_id_habitacion => :id,
        p_new_state => :newState
    ); END;`,
      { newState, id }
    );

    // Verifica si la actualización fue exitosa
    console.log(`Filas afectadas: ${result.rowsAffected}`);

    // Realizar el commit
    await connection.commit();
    await connection.close();

    res.send('Estado de la habitación actualizado correctamente');
  } catch (err) {
    console.error('Error al actualizar el estado de la habitación:', err);
    res.status(500).send('Error al actualizar el estado de la habitación');
  }
});


// LIMPIEZA HABITACIONES
app.get('/limpieza_habitaciones', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);

    // Consulta para obtener los datos de las limpiezas incluyendo números de habitación y nombres de usuario
    const query = `
      SELECT *
FROM V_FIDE_LIMPIEZA_DETALLES
    `;
    const result = await connection.execute(query);

    // Verifica los datos obtenidos
    console.log('Datos obtenidos:', result.rows);

    // Formatear el resultado para incluir tanto el número de habitación como el nombre del hotel
    const formattedResult = result.rows.map(row => {
      return {
        id_limpieza: row[0],
        nombre_habitacion: `Habitación ${row[1]} (${row[2]})`,
        nombre_usuario: row[3],
        fecha_limpieza: row[4],
        comentarios: row[5],
        nombre_estado: row[6],
        creado_por: row[7],
        fecha_creacion: row[8],
        modificado_por: row[9],
        fecha_modificacion: row[10],
        accion: row[11]
      };
    });

    res.json(formattedResult);
  } catch (err) {
    console.error('Error de conexión o consulta:', err);
    res.status(500).send('Error al obtener las limpiezas');
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



app.post('/limpieza_habitaciones', async (req, res) => {
  const { id_habitacion, id_usuario, fecha_limpieza, comentarios } = req.body;

  if (!id_habitacion || !id_usuario || !fecha_limpieza) {
    return res.status(400).send('Todos los campos son requeridos');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Formatear la fecha de limpieza
    const formattedFechaLimpieza = `TO_DATE('${fecha_limpieza}', 'YYYY-MM-DD')`;

    // Llamar al procedimiento almacenado para insertar los datos principales
    await connection.execute(
      `BEGIN
              FIDE_LIMPIEZA_HABITACIONES_TB_INSERT_SP(p_id_habitacion => :id_habitacion, p_id_usuario => :id_usuario, p_fecha_limpieza => ${formattedFechaLimpieza}, p_comentarios => :comentarios);
           END;`,
      { id_habitacion, id_usuario, comentarios }
    );

    // Recuperar el ID de la última limpieza insertada
    const result = await connection.execute(
      `SELECT FIDE_LIMPIEZA_ULTIMO_ID() AS last_id FROM dual`
    );
    const lastId = result.rows[0][0];

    // Confirmar la transacción
    await connection.commit();
    await connection.close();

    res.status(201).send('Limpieza creada exitosamente');
  } catch (err) {
    console.error('Error al insertar la limpieza:', err);
    res.status(500).send('Error al insertar la limpieza');
  }
});

app.put('/limpieza_habitaciones/:id', async (req, res) => {
  const { id } = req.params; // ID de la limpieza
  const { id_habitacion, id_usuario, fecha_limpieza, comentarios } = req.body;

  console.log(`Recibiendo solicitud para actualizar la limpieza con id: ${id}`);

  if (!id_habitacion || !id_usuario || !fecha_limpieza) {
    return res.status(400).send('Todos los campos son requeridos');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Formatear la fecha de limpieza
    const formattedFechaLimpieza = `TO_DATE('${fecha_limpieza}', 'YYYY-MM-DD')`;

    // Actualizar la limpieza en la tabla FIDE_LIMPIEZA_HABITACIONES_TB
    const result = await connection.execute(
      `UPDATE FIDE_LIMPIEZA_HABITACIONES_TB
       SET id_habitacion = :id_habitacion, id_usuario = :id_usuario, fecha_limpieza = ${formattedFechaLimpieza}, comentarios = :comentarios
       WHERE id_limpieza = :id`,
      { id_habitacion, id_usuario, comentarios, id }
    );

    // Verifica si la actualización fue exitosa
    console.log(`Filas afectadas: ${result.rowsAffected}`);

    // Realizar el commit
    await connection.commit();
    await connection.close();

    res.send('Limpieza actualizada correctamente');
  } catch (err) {
    console.error('Error al actualizar la limpieza:', err);
    res.status(500).send('Error al actualizar la limpieza');
  }
});

app.put('/limpieza_habitaciones/toggleState/:id', async (req, res) => {
  const { id } = req.params; // ID de la limpieza
  const { newState } = req.body;

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Actualizar el estado de la limpieza en la tabla FIDE_LIMPIEZA_HABITACIONES_TB
    const result = await connection.execute(
      `BEGIN
    FIDE_LIMPIEZA_HABITACIONES_TB_ACTUALIZAR_ESTADO_SP(
        p_id_limpieza => :id,
        p_new_state => :newState
    ); END;`,
      { newState, id }
    );

    // Verifica si la actualización fue exitosa
    console.log(`Filas afectadas: ${result.rowsAffected}`);

    // Realizar el commit
    await connection.commit();
    await connection.close();

    res.send('Estado de la limpieza actualizado correctamente');
  } catch (err) {
    console.error('Error al actualizar el estado de la limpieza:', err);
    res.status(500).send('Error al actualizar el estado de la limpieza');
  }
});


// VALORACIONES
app.get('/valoraciones', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);

    // Consulta para obtener los datos de las valoraciones incluyendo el estado
    const query = `
      SELECT *
FROM V_FIDE_VALORACIONES_DETALLES
    `;
    const result = await connection.execute(query);

    // Verifica los datos obtenidos
    console.log('Datos obtenidos:', result.rows);

    // Leer el contenido de los CLOBs
    const formattedResult = await Promise.all(result.rows.map(async row => {
      const comentario = await row[1].getData();
      return {
        id_valoracion: row[0],
        comentario,
        valoracion: row[2],
        timestamp: row[3],
        nombre_estado: row[4],
        creado_por: row[5],
        fecha_creacion: row[6],
        modificado_por: row[7],
        fecha_modificacion: row[8],
        accion: row[9]
      };
    }));

    res.json(formattedResult);
  } catch (err) {
    console.error('Error de conexión o consulta:', err);
    res.status(500).send('Error al obtener las valoraciones');
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

app.post('/valoraciones', async (req, res) => {
  const { comentario, valoracion, timestamp } = req.body;

  if (!comentario || !valoracion || !timestamp) {
    return res.status(400).send('Todos los campos son requeridos');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Llamar al procedimiento almacenado para insertar los datos principales
    await connection.execute(
      `BEGIN
              FIDE_VALORACION_TB_INSERT_SP(p_comentario => :comentario, p_valoracion => :valoracion, p_timestamp => TO_TIMESTAMP(:timestamp, 'YYYY-MM-DD"T"HH24:MI'));
           END;`,
      { comentario, valoracion, timestamp }
    );

    // Recuperar el ID de la última valoración insertada
    const result = await connection.execute(
      `SELECT FIDE_VALORACION_ULTIMO_ID() AS last_id FROM dual`
    );
    const lastId = result.rows[0][0];

    // Confirmar la transacción
    await connection.commit();
    await connection.close();

    res.status(201).send('Valoración creada exitosamente');
  } catch (err) {
    console.error('Error al insertar la valoración:', err);
    res.status(500).send('Error al insertar la valoración');
  }
});

app.put('/valoraciones/:id', async (req, res) => {
  const { id } = req.params; // ID de la valoración
  const { comentario, valoracion, timestamp } = req.body;

  console.log(`Recibiendo solicitud para actualizar la valoración con id: ${id}`);

  if (!comentario || !valoracion || !timestamp) {
    return res.status(400).send('Todos los campos son requeridos');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Actualizar la valoración en la tabla FIDE_VALORACION_TB
    const result = await connection.execute(
      `UPDATE FIDE_VALORACION_TB
       SET comentario = :comentario, valoracion = :valoracion, timestamp = TO_TIMESTAMP(:timestamp, 'YYYY-MM-DD"T"HH24:MI')
       WHERE id_valoracion = :id`,
      { comentario, valoracion, timestamp, id }
    );

    // Verifica si la actualización fue exitosa
    console.log(`Filas afectadas: ${result.rowsAffected}`);

    // Realizar el commit
    await connection.commit();
    await connection.close();

    res.send('Valoración actualizada correctamente');
  } catch (err) {
    console.error('Error al actualizar la valoración:', err);
    res.status(500).send('Error al actualizar la valoración');
  }
});

app.put('/valoraciones/toggleState/:id', async (req, res) => {
  const { id } = req.params; // ID de la valoración
  const { newState } = req.body;

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Actualizar el estado de la valoración en la tabla FIDE_VALORACION_TB
    const result = await connection.execute(
      `BEGIN
    FIDE_VALORACION_TB_ACTUALIZAR_ESTADO_SP(
        p_id_valoracion => :id,
        p_new_state => :newState
    ); END;`,
      { newState, id }
    );

    // Verifica si la actualización fue exitosa
    console.log(`Filas afectadas: ${result.rowsAffected}`);

    // Realizar el commit
    await connection.commit();
    await connection.close();

    res.send('Estado de la valoración actualizado correctamente');
  } catch (err) {
    console.error('Error al actualizar el estado de la valoración:', err);
    res.status(500).send('Error al actualizar el estado de la valoración');
  }
});


// CATEGORIA RESERVAS
app.get('/categoria_reservas', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);

    // Consulta para obtener los datos de las categorías de reservas incluyendo el estado
    const query = `
      SELECT *
FROM V_FIDE_CATEGORIAS_RESERVAS_DETALLES
    `;
    const result = await connection.execute(query);

    // Verifica los datos obtenidos
    console.log('Datos obtenidos:', result.rows);

    res.json(result.rows);
  } catch (err) {
    console.error('Error de conexión o consulta:', err);
    res.status(500).send('Error al obtener las categorías de reservas');
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

app.post('/categoria_reservas', async (req, res) => {
  const { nombre_categoria, comentarios } = req.body;

  if (!nombre_categoria || !comentarios) {
    return res.status(400).send('Todos los campos son requeridos');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Llamar al procedimiento almacenado para insertar los datos principales
    await connection.execute(
      `BEGIN
              FIDE_CATEGORIA_RESERVAS_TB_INSERT_SP(p_nombre_categoria => :nombre_categoria, p_comentarios => :comentarios);
           END;`,
      { nombre_categoria, comentarios }
    );

    // Recuperar el ID de la última categoría insertada
    const result = await connection.execute(
      `SELECT FIDE_CATEGORIA_ULTIMO_ID() AS last_id FROM dual`
    );
    const lastId = result.rows[0][0];

    // Confirmar la transacción
    await connection.commit();
    await connection.close();

    res.status(201).send('Categoría creada exitosamente');
  } catch (err) {
    console.error('Error al insertar la categoría:', err);
    res.status(500).send('Error al insertar la categoría');
  }
});

app.put('/categoria_reservas/:id', async (req, res) => {
  const { id } = req.params; // ID de la categoría
  const { nombre_categoria, comentarios } = req.body;

  console.log(`Recibiendo solicitud para actualizar la categoría con id: ${id}`);

  if (!nombre_categoria || !comentarios) {
    return res.status(400).send('Todos los campos son requeridos');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Actualizar la categoría en la tabla FIDE_CATEGORIA_RESERVAS_TB
    const result = await connection.execute(
      `BEGIN
    FIDE_CATEGORIA_RESERVAS_TB_ACTUALIZAR_SP(
        p_id_categoria => :id,
        p_nombre_categoria => :nombre_categoria,
        p_comentarios => :comentarios
    ); END;`,
      { nombre_categoria, comentarios, id }
    );

    // Verifica si la actualización fue exitosa
    console.log(`Filas afectadas: ${result.rowsAffected}`);

    // Realizar el commit
    await connection.commit();
    await connection.close();

    res.send('Categoría actualizada correctamente');
  } catch (err) {
    console.error('Error al actualizar la categoría:', err);
    res.status(500).send('Error al actualizar la categoría');
  }
});

app.put('/categoria_reservas/toggleState/:id', async (req, res) => {
  const { id } = req.params; // ID de la categoría
  const { newState } = req.body;

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Actualizar el estado de la categoría en la tabla FIDE_CATEGORIA_RESERVAS_TB
    const result = await connection.execute(
      `BEGIN
    FIDE_CATEGORIA_RESERVAS_TB_ACTUALIZAR_ESTADO_SP(
        p_id_categoria => :id,
        p_new_state => :newState
    ); END;`,
      { newState, id }
    );

    // Verifica si la actualización fue exitosa
    console.log(`Filas afectadas: ${result.rowsAffected}`);

    // Realizar el commit
    await connection.commit();
    await connection.close();

    res.send('Estado de la categoría actualizado correctamente');
  } catch (err) {
    console.error('Error al actualizar el estado de la categoría:', err);
    res.status(500).send('Error al actualizar el estado de la categoría');
  }
});


// RESERVAS
app.get('/reservas', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);

    // Consulta para obtener los datos de las reservas incluyendo los nombres de los usuarios, hoteles, categorías, habitaciones, valoraciones, monedas y estados
    const query = `
      SELECT *
FROM V_FIDE_RESERVAS_DETALLES
    `;
    const result = await connection.execute(query);

    // Verifica los datos obtenidos
    console.log('Datos obtenidos:', result.rows);

    // Leer el contenido de los CLOBs y formatear el resultado
    const formattedResult = await Promise.all(result.rows.map(async row => {
      const descripcion = await row[13].getData();
      return {
        id_reservacion: row[0],
        nombre_usuario: row[1],
        nombre_hotel: row[2],
        nombre_categoria: row[3],
        numero_habitacion: row[4],
        valoracion: row[5],
        nombre_moneda: row[6],
        nombre_estado: row[7],
        fecha_inicio: row[8],
        fecha_cierre: row[9],
        hora: row[10],
        precio_unitario: row[11],
        nombre: row[12],
        descripcion,
        creado_por: row[14],
        fecha_creacion: row[15],
        modificado_por: row[16],
        fecha_modificacion: row[17],
        accion: row[18]
      };
    }));

    res.json(formattedResult);
  } catch (err) {
    console.error('Error de conexión o consulta:', err);
    res.status(500).send('Error al obtener las reservas');
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

app.post('/reservas', async (req, res) => {
  const { id_usuario, id_hotel, id_categoria, id_habitacion, id_valoracion, id_moneda, fecha_inicio, fecha_cierre, hora, precio_unitario, nombre, descripcion } = req.body;

  if (!id_usuario || !id_hotel || !id_categoria || !id_habitacion || !id_valoracion || !id_moneda || !fecha_inicio || !fecha_cierre || !hora || !precio_unitario || !nombre || !descripcion) {
    return res.status(400).send('Todos los campos son requeridos');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Llamar al procedimiento almacenado para insertar los datos principales
    await connection.execute(
      `BEGIN
              FIDE_RESERVAS_TB_INSERT_SP(
                p_id_usuario => :id_usuario,
                p_id_hotel => :id_hotel,
                p_id_categoria => :id_categoria,
                p_id_habitacion => :id_habitacion,
                p_id_valoracion => :id_valoracion,
                p_id_moneda => :id_moneda,
                p_fecha_inicio => TO_DATE(:fecha_inicio, 'YYYY-MM-DD'),
                p_fecha_cierre => TO_DATE(:fecha_cierre, 'YYYY-MM-DD'),
                p_hora => TO_TIMESTAMP(:hora, 'YYYY-MM-DD"T"HH24:MI:SS'),
                p_precio_unitario => :precio_unitario,
                p_nombre => :nombre,
                p_descripcion => :descripcion
              );
           END;`,
      { id_usuario, id_hotel, id_categoria, id_habitacion, id_valoracion, id_moneda, fecha_inicio, fecha_cierre, hora, precio_unitario, nombre, descripcion }
    );

    // Recuperar el ID de la última reserva insertada
    const result = await connection.execute(
      `SELECT FIDE_RESERVACION_ULTIMO_ID() AS last_id FROM dual`
    );
    const lastId = result.rows[0][0];

    // Confirmar la transacción
    await connection.commit();
    await connection.close();

    res.status(201).send('Reserva creada exitosamente');
  } catch (err) {
    console.error('Error al insertar la reserva:', err);
    res.status(500).send('Error al insertar la reserva');
  }
});

app.put('/reservas/:id', async (req, res) => {
  const { id } = req.params; // ID de la reserva
  const { id_usuario, id_hotel, id_categoria, id_habitacion, id_valoracion, id_moneda, fecha_inicio, fecha_cierre, hora, precio_unitario, nombre, descripcion } = req.body;

  console.log(`Recibiendo solicitud para actualizar la reserva con id: ${id}`);

  if (!id_usuario || !id_hotel || !id_categoria || !id_habitacion || !id_valoracion || !id_moneda || !fecha_inicio || !fecha_cierre || !hora || !precio_unitario || !nombre || !descripcion) {
    return res.status(400).send('Todos los campos son requeridos');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Actualizar la reserva en la tabla FIDE_RESERVAS_TB
    const result = await connection.execute(
      `BEGIN
    FIDE_RESERVAS_TB_ACTUALIZAR_SP(
        p_id_reservacion => :id,
        p_id_usuario => :id_usuario,
        p_id_hotel => :id_hotel,
        p_id_categoria => :id_categoria,
        p_id_habitacion => :id_habitacion,
        p_id_valoracion => :id_valoracion,
        p_id_moneda => :id_moneda,
        p_fecha_inicio => TO_DATE(:fecha_inicio, 'YYYY-MM-DD'),
        p_fecha_cierre => TO_DATE(:fecha_cierre, 'YYYY-MM-DD'),
        p_hora => TO_TIMESTAMP(:hora, 'YYYY-MM-DD"T"HH24:MI:SS'),
        p_precio_unitario => :precio_unitario,
        p_nombre => :nombre,
        p_descripcion => :descripcion
    ); END;`,
      { id_usuario, id_hotel, id_categoria, id_habitacion, id_valoracion, id_moneda, fecha_inicio, fecha_cierre, hora, precio_unitario, nombre, descripcion, id }
    );

    // Verifica si la actualización fue exitosa
    console.log(`Filas afectadas: ${result.rowsAffected}`);

    // Realizar el commit
    await connection.commit();
    await connection.close();

    res.send('Reserva actualizada correctamente');
  } catch (err) {
    console.error('Error al actualizar la reserva:', err);
    res.status(500).send('Error al actualizar la reserva');
  }
});

app.put('/reservas/toggleState/:id', async (req, res) => {
  const { id } = req.params; // ID de la reserva
  const { newState } = req.body;

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Actualizar el estado de la reserva en la tabla FIDE_RESERVAS_TB
    const result = await connection.execute(
      `BEGIN
    FIDE_RESERVAS_TB_ACTUALIZAR_ESTADO_SP(
        p_id_reservacion => :id,
        p_new_state => :newState
    ); END;`,
      { newState, id }
    );

    // Verifica si la actualización fue exitosa
    console.log(`Filas afectadas: ${result.rowsAffected}`);

    // Realizar el commit
    await connection.commit();
    await connection.close();

    res.send('Estado de la reserva actualizado correctamente');
  } catch (err) {
    console.error('Error al actualizar el estado de la reserva:', err);
    res.status(500).send('Error al actualizar el estado de la reserva');
  }
});



// TIPO DE PROMOCION
app.get('/tipo_promocion', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);

    // Consulta para obtener los datos de los tipos de promoción incluyendo el estado
    const query = `
      SELECT *
FROM V_FIDE_TIPO_PROMOCIONES_DETALLES
    `;
    const result = await connection.execute(query);

    // Verifica los datos obtenidos
    console.log('Datos obtenidos:', result.rows);

    res.json(result.rows);
  } catch (err) {
    console.error('Error de conexión o consulta:', err);
    res.status(500).send('Error al obtener los tipos de promoción');
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

app.post('/tipo_promocion', async (req, res) => {
  const { nombre, descripcion } = req.body;

  if (!nombre || !descripcion) {
    return res.status(400).send('Todos los campos son requeridos');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Llamar al procedimiento almacenado para insertar los datos principales
    await connection.execute(
      `BEGIN
              FIDE_TIPO_PROMOCION_TB_INSERT_SP(p_nombre => :nombre, p_descripcion => :descripcion);
           END;`,
      { nombre, descripcion }
    );

    // Recuperar el ID del último tipo de promoción insertado
    const result = await connection.execute(
      `SELECT FIDE_TIPO_PROMOCION_ULTIMO_ID() AS last_id FROM dual`
    );
    const lastId = result.rows[0][0];

    // Confirmar la transacción
    await connection.commit();
    await connection.close();

    res.status(201).send('Tipo de Promoción creado exitosamente');
  } catch (err) {
    console.error('Error al insertar el tipo de promoción:', err);
    res.status(500).send('Error al insertar el tipo de promoción');
  }
});

app.put('/tipo_promocion/:id', async (req, res) => {
  const { id } = req.params; // ID del tipo de promoción
  const { nombre, descripcion } = req.body;

  console.log(`Recibiendo solicitud para actualizar el tipo de promoción con id: ${id}`);

  if (!nombre || !descripcion) {
    return res.status(400).send('Todos los campos son requeridos');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Actualizar el tipo de promoción en la tabla FIDE_TIPO_PROMOCION_TB
    const result = await connection.execute(
      `BEGIN
    FIDE_TIPO_PROMOCION_TB_ACTUALIZAR_SP(
        p_id_tipo_promocion => :id,
        p_nombre => :nombre,
        p_descripcion => :descripcion
    ); END;`,
      { nombre, descripcion, id }
    );

    // Verifica si la actualización fue exitosa
    console.log(`Filas afectadas: ${result.rowsAffected}`);

    // Realizar el commit
    await connection.commit();
    await connection.close();

    res.send('Tipo de Promoción actualizado correctamente');
  } catch (err) {
    console.error('Error al actualizar el tipo de promoción:', err);
    res.status(500).send('Error al actualizar el tipo de promoción');
  }
});

app.put('/tipo_promocion/toggleState/:id', async (req, res) => {
  const { id } = req.params; // ID del tipo de promoción
  const { newState } = req.body;

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Actualizar el estado del tipo de promoción en la tabla FIDE_TIPO_PROMOCION_TB
    const result = await connection.execute(
      `BEGIN
    FIDE_TIPO_PROMOCION_TB_ACTUALIZAR_ESTADO_SP(
        p_id_tipo_promocion => :id,
        p_new_state => :newState
    ); END;`,
      { newState, id }
    );

    // Verifica si la actualización fue exitosa
    console.log(`Filas afectadas: ${result.rowsAffected}`);

    // Realizar el commit
    await connection.commit();
    await connection.close();

    res.send('Estado del tipo de promoción actualizado correctamente');
  } catch (err) {
    console.error('Error al actualizar el estado del tipo de promoción:', err);
    res.status(500).send('Error al actualizar el estado del tipo de promoción');
  }
});


// PROMOCIONES
app.get('/promociones', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);

    // Consulta para obtener los datos de las promociones incluyendo nombres de tipo de promoción, reservaciones, monedas y estados
    const query = `
      SELECT *
FROM V_FIDE_PROMOCIONES_DETALLES
    `;
    const result = await connection.execute(query);

    // Verifica los datos obtenidos
    console.log('Datos obtenidos:', result.rows);

    res.json(result.rows);
  } catch (err) {
    console.error('Error de conexión o consulta:', err);
    res.status(500).send('Error al obtener las promociones');
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

app.post('/promociones', async (req, res) => {
  const { id_tipo_promocion, id_reservacion, id_moneda, descripcion, nombre_promocion, fecha_inicio, fecha_fin, porcentaje_promocion, descuento } = req.body;

  if (!id_tipo_promocion || !id_reservacion || !id_moneda || !descripcion || !nombre_promocion || !fecha_inicio || !fecha_fin || (!porcentaje_promocion && !descuento)) {
    return res.status(400).send('Todos los campos son requeridos');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Llamar al procedimiento almacenado para insertar los datos principales
    await connection.execute(
      `BEGIN
              FIDE_PROMOCIONES_TB_INSERT_SP(
                p_id_tipo_promocion => :id_tipo_promocion,
                p_id_reservacion => :id_reservacion,
                p_id_moneda => :id_moneda,
                p_descripcion => :descripcion,
                p_nombre_promocion => :nombre_promocion,
                p_fecha_inicio => TO_DATE(:fecha_inicio, 'YYYY-MM-DD'),
                p_fecha_fin => TO_DATE(:fecha_fin, 'YYYY-MM-DD'),
                p_porcentaje_promocion => :porcentaje_promocion,
                p_descuento => :descuento
              );
           END;`,
      { id_tipo_promocion, id_reservacion, id_moneda, descripcion, nombre_promocion, fecha_inicio, fecha_fin, porcentaje_promocion, descuento }
    );

    // Recuperar el ID de la última promoción insertada
    const result = await connection.execute(
      `SELECT FIDE_PROMOCION_ULTIMO_ID() AS last_id FROM dual`
    );
    const lastId = result.rows[0][0];

    // Confirmar la transacción
    await connection.commit();
    await connection.close();

    res.status(201).send('Promoción creada exitosamente');
  } catch (err) {
    console.error('Error al insertar la promoción:', err);
    res.status(500).send('Error al insertar la promoción');
  }
});

app.put('/promociones/:id', async (req, res) => {
  const { id } = req.params; // ID de la promoción
  const { id_tipo_promocion, id_reservacion, id_moneda, descripcion, nombre_promocion, fecha_inicio, fecha_fin, porcentaje_promocion, descuento } = req.body;

  console.log(`Recibiendo solicitud para actualizar la promoción con id: ${id}`);

  if (!id_tipo_promocion || !id_reservacion || !id_moneda || !descripcion || !nombre_promocion || !fecha_inicio || !fecha_fin || (!porcentaje_promocion && !descuento)) {
    return res.status(400).send('Todos los campos son requeridos');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Actualizar la promoción en la tabla FIDE_PROMOCIONES_TB
    const result = await connection.execute(
      `BEGIN
    FIDE_PROMOCIONES_TB_ACTUALIZAR_SP(
        p_id_promocion => :id,
        p_id_tipo_promocion => :id_tipo_promocion,
        p_id_reservacion => :id_reservacion,
        p_id_moneda => :id_moneda,
        p_descripcion => :descripcion,
        p_nombre_promocion => :nombre_promocion,
        p_fecha_inicio => TO_DATE(:fecha_inicio, 'YYYY-MM-DD'),
        p_fecha_fin => TO_DATE(:fecha_fin, 'YYYY-MM-DD'),
        p_porcentaje_promocion => :porcentaje_promocion,
        p_descuento => :descuento
    ); END;`,
      { id_tipo_promocion, id_reservacion, id_moneda, descripcion, nombre_promocion, fecha_inicio, fecha_fin, porcentaje_promocion, descuento, id }
    );

    // Verifica si la actualización fue exitosa
    console.log(`Filas afectadas: ${result.rowsAffected}`);

    // Realizar el commit
    await connection.commit();
    await connection.close();

    res.send('Promoción actualizada correctamente');
  } catch (err) {
    console.error('Error al actualizar la promoción:', err);
    res.status(500).send('Error al actualizar la promoción');
  }
});

app.put('/promociones/toggleState/:id', async (req, res) => {
  const { id } = req.params; // ID de la promoción
  const { newState } = req.body;

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Actualizar el estado de la promoción en la tabla FIDE_PROMOCIONES_TB
    const result = await connection.execute(
      `BEGIN
    FIDE_PROMOCIONES_TB_ACTUALIZAR_ESTADO_SP(
        p_id_promocion => :id,
        p_new_state => :newState
    ); END;`,
      { newState, id }
    );

    // Verifica si la actualización fue exitosa
    console.log(`Filas afectadas: ${result.rowsAffected}`);

    // Realizar el commit
    await connection.commit();
    await connection.close();

    res.send('Estado de la promoción actualizado correctamente');
  } catch (err) {
    console.error('Error al actualizar el estado de la promoción:', err);
    res.status(500).send('Error al actualizar el estado de la promoción');
  }
});


// FACTURAS
app.get('/facturas', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    console.log('Conexión a la base de datos establecida.');

    // Consulta para obtener los datos de las facturas incluyendo nombres de monedas, usuarios, impuestos, promociones y estados
    const query = `
      SELECT * FROM V_FIDE_FACTURAS_DETALLES
    `;
    const result = await connection.execute(query);

    // Verifica los datos obtenidos
    console.log('Datos obtenidos:', result.rows);

    res.json(result.rows);
  } catch (err) {
    console.error('Error de conexión o consulta:', err);
    res.status(500).send('Error al obtener las facturas');
  } finally {
    // Asegúrate de cerrar la conexión al final
    if (connection) {
      try {
        await connection.close();
        console.log('Conexión a la base de datos cerrada.');
      } catch (closeErr) {
        console.error('Error al cerrar la conexión:', closeErr);
      }
    }
  }
});


app.post('/facturas', async (req, res) => {
  const { id_moneda, id_usuario, id_impuesto, id_promocion, id_estado, id_pais, id_provincia, id_canton, id_distrito, subtotal, total } = req.body;

  if (!id_moneda || !id_usuario || !id_impuesto || !id_estado || !subtotal || !total) {
    return res.status(400).send('Todos los campos obligatorios son requeridos');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Llamar al procedimiento almacenado para insertar los datos principales
    await connection.execute(
      `BEGIN
              FIDE_FACTURAS_TB_INSERT_SP(
                p_id_moneda => :id_moneda,
                p_id_usuario => :id_usuario,
                p_id_impuesto => :id_impuesto,
                p_subtotal => :subtotal,
                p_total => :total
              );
           END;`,
      { id_moneda, id_usuario, id_impuesto, subtotal, total }
    );

    // Recuperar el ID de la última factura insertada
    const result = await connection.execute(
      `SELECT FIDE_FACTURA_ULTIMO_ID() AS last_id FROM dual`
    );
    const lastId = result.rows[0][0];

    // Actualizar valores opcionales
    await connection.execute(
      `UPDATE FIDE_FACTURAS_TB
       SET id_promocion = :id_promocion, id_estado = :id_estado, id_pais = :id_pais, id_provincia = :id_provincia, id_canton = :id_canton, id_distrito = :id_distrito
       WHERE id_factura = :id`,
      { id_promocion, id_estado, id_pais, id_provincia, id_canton, id_distrito, id: lastId }
    );

    // Confirmar la transacción
    await connection.commit();
    await connection.close();

    res.status(201).send('Factura creada exitosamente');
  } catch (err) {
    console.error('Error al insertar la factura:', err);
    res.status(500).send('Error al insertar la factura');
  }
});


app.put('/facturas/:id', async (req, res) => {
  const { id } = req.params; // ID de la factura
  const { id_moneda, id_usuario, id_impuesto, id_promocion, id_estado, id_pais, id_provincia, id_canton, id_distrito, subtotal, total } = req.body;

  console.log(`Recibiendo solicitud para actualizar la factura con id: ${id}`);

  if (!id_moneda || !id_usuario || !id_impuesto || !id_estado || !subtotal || !total) {
    return res.status(400).send('Todos los campos obligatorios son requeridos');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Actualizar la factura en la tabla FIDE_FACTURAS_TB
    const result = await connection.execute(
      `UPDATE FIDE_FACTURAS_TB
       SET id_moneda = :id_moneda, id_usuario = :id_usuario, id_impuesto = :id_impuesto, id_promocion = :id_promocion, id_estado = :id_estado, id_pais = :id_pais, id_provincia = :id_provincia, id_canton = :id_canton, id_distrito = :id_distrito, subtotal = :subtotal, total = :total
       WHERE id_factura = :id`,
      { id_moneda, id_usuario, id_impuesto, id_promocion, id_estado, id_pais, id_provincia, id_canton, id_distrito, subtotal, total, id }
    );

    // Verifica si la actualización fue exitosa
    console.log(`Filas afectadas: ${result.rowsAffected}`);

    // Realizar el commit
    await connection.commit();
    await connection.close();

    res.send('Factura actualizada correctamente');
  } catch (err) {
    console.error('Error al actualizar la factura:', err);
    res.status(500).send('Error al actualizar la factura');
  }
});

app.put('/facturas/toggleState/:id', async (req, res) => {
  const { id } = req.params; // ID de la factura
  const { newState } = req.body;

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Actualizar el estado de la factura en la tabla FIDE_FACTURAS_TB
    const result = await connection.execute(
      `UPDATE FIDE_FACTURAS_TB
       SET id_estado = (SELECT id_estado FROM FIDE_ESTADOS_TB WHERE nombre_estado = :newState)
       WHERE id_factura = :id`,
      { newState, id }
    );

    // Verifica si la actualización fue exitosa
    console.log(`Filas afectadas: ${result.rowsAffected}`);

    // Realizar el commit
    await connection.commit();
    await connection.close();

    res.send('Estado de la factura actualizado correctamente');
  } catch (err) {
    console.error('Error al actualizar el estado de la factura:', err);
    res.status(500).send('Error al actualizar el estado de la factura');
  }
});


// DETALLE_FACTURAS
app.get('/detalle_facturas', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);

    // Consulta para obtener los datos de los detalles de facturas
    const query = `
      SELECT 
        DF.id_detalle_factura,
        DF.id_factura,
        DF.id_reservacion,
        DF.id_promocion,
        M.nombre_moneda,
        E.nombre_estado,
        DF.cantidad,
        DF.total_linea,
        DF.creado_por,
        TO_CHAR(DF.fecha_creacion, 'YYYY-MM-DD HH24:MI:SS') AS fecha_creacion,
        DF.modificado_por,
        TO_CHAR(DF.fecha_modificacion, 'YYYY-MM-DD HH24:MI:SS') AS fecha_modificacion,
        DF.accion
      FROM 
        FIDE_DETALLE_FACTURA_TB DF
      JOIN 
        FIDE_MONEDA_TB M ON DF.id_moneda = M.id_moneda
      JOIN 
        FIDE_ESTADOS_TB E ON DF.id_estado = E.id_estado
    `;
    const result = await connection.execute(query);

    // Verifica los datos obtenidos
    console.log('Datos obtenidos:', result.rows);

    res.json(result.rows);
  } catch (err) {
    console.error('Error de conexión o consulta:', err);
    res.status(500).send('Error al obtener los detalles de las facturas');
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

app.post('/detalle_facturas', async (req, res) => {
  const { id_factura, id_reservacion, id_promocion, id_moneda, cantidad, total_linea } = req.body;

  if (!id_factura || !id_reservacion || !id_moneda || !cantidad || !total_linea) {
    return res.status(400).send('Todos los campos obligatorios son requeridos');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Llamar al procedimiento almacenado para insertar los datos principales
    await connection.execute(
      `BEGIN
              FIDE_DETALLE_FACTURA_TB_INSERT_SP(
                p_id_factura => :id_factura,
                p_id_reservacion => :id_reservacion,
                p_id_promocion => :id_promocion,
                p_id_moneda => :id_moneda,
                p_cantidad => :cantidad,
                p_total_linea => :total_linea
              );
           END;`,
      { id_factura, id_reservacion, id_promocion, id_moneda, cantidad, total_linea }
    );

    // Recuperar el ID del último detalle de factura insertado
    const result = await connection.execute(
      `SELECT ID_DETALLE_FACTURA_SEQ.CURRVAL AS last_id FROM dual`
    );
    const lastId = result.rows[0][0];

    // Confirmar la transacción
    await connection.commit();
    await connection.close();

    res.status(201).send('Detalle de factura creado exitosamente');
  } catch (err) {
    console.error('Error al insertar el detalle de factura:', err);
    res.status(500).send('Error al insertar el detalle de factura');
  }
});

app.put('/detalle_facturas/:id', async (req, res) => {
  const { id } = req.params; // ID del detalle de factura
  const { id_factura, id_reservacion, id_promocion, id_moneda, cantidad, total_linea } = req.body;

  console.log(`Recibiendo solicitud para actualizar el detalle de factura con id: ${id}`);

  if (!id_factura || !id_reservacion || !id_moneda || !cantidad || !total_linea) {
    return res.status(400).send('Todos los campos obligatorios son requeridos');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Actualizar el detalle de factura en la tabla FIDE_DETALLE_FACTURA_TB
    const result = await connection.execute(
      `UPDATE FIDE_DETALLE_FACTURA_TB
       SET id_factura = :id_factura, id_reservacion = :id_reservacion, id_promocion = :id_promocion, id_moneda = :id_moneda, cantidad = :cantidad, total_linea = :total_linea
       WHERE id_detalle_factura = :id`,
      { id_factura, id_reservacion, id_promocion, id_moneda, cantidad, total_linea, id }
    );

    // Verifica si la actualización fue exitosa
    console.log(`Filas afectadas: ${result.rowsAffected}`);

    // Realizar el commit
    await connection.commit();
    await connection.close();

    res.send('Detalle de factura actualizado correctamente');
  } catch (err) {
    console.error('Error al actualizar el detalle de factura:', err);
    res.status(500).send('Error al actualizar el detalle de factura');
  }
});

app.put('/detalle_facturas/toggleState/:id', async (req, res) => {
  const { id } = req.params; // ID del detalle de factura
  const { newState } = req.body;

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Actualizar el estado del detalle de factura en la tabla FIDE_DETALLE_FACTURA_TB
    const result = await connection.execute(
      `UPDATE FIDE_DETALLE_FACTURA_TB
       SET id_estado = (SELECT id_estado FROM FIDE_ESTADOS_TB WHERE nombre_estado = :newState)
       WHERE id_detalle_factura = :id`,
      { newState, id }
    );

    // Verifica si la actualización fue exitosa
    console.log(`Filas afectadas: ${result.rowsAffected}`);

    // Realizar el commit
    await connection.commit();
    await connection.close();

    res.send('Estado del detalle de factura actualizado correctamente');
  } catch (err) {
    console.error('Error al actualizar el estado del detalle de factura:', err);
    res.status(500).send('Error al actualizar el estado del detalle de factura');
  }
});


// TIPO_MANTENIMIENTO
app.get('/tipo_mantenimiento', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);

    // Consulta para obtener los datos de los tipos de mantenimiento
    const query = `
      SELECT * FROM V_FIDE_TIPO_MANTENIMIENTO_DETALLES
    `;
    const result = await connection.execute(query);

    // Verifica los datos obtenidos
    console.log('Datos obtenidos:', result.rows);

    res.json(result.rows);
  } catch (err) {
    console.error('Error de conexión o consulta:', err);
    res.status(500).send('Error al obtener los tipos de mantenimiento');
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

app.post('/tipo_mantenimiento', async (req, res) => {
  const { tipo_mantenimiento } = req.body;

  if (!tipo_mantenimiento) {
    return res.status(400).send('Todos los campos obligatorios son requeridos');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Llamar al procedimiento almacenado para insertar los datos principales
    await connection.execute(
      `BEGIN
              FIDE_TIPO_MANTENIMIENTO_TB_INSERT_SP(
                p_tipo_mantenimiento => :tipo_mantenimiento
              );
           END;`,
      { tipo_mantenimiento }
    );

    // Confirmar la transacción
    await connection.commit();
    await connection.close();

    res.status(201).send('Tipo de mantenimiento creado exitosamente');
  } catch (err) {
    console.error('Error al insertar el tipo de mantenimiento:', err);
    res.status(500).send('Error al insertar el tipo de mantenimiento');
  }
});

app.put('/tipo_mantenimiento/:id', async (req, res) => {
  const { id } = req.params; // ID del tipo de mantenimiento
  const { tipo_mantenimiento } = req.body;

  if (!tipo_mantenimiento) {
    return res.status(400).send('Todos los campos obligatorios son requeridos');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Actualizar el tipo de mantenimiento en la tabla FIDE_TIPO_MANTENIMIENTO_TB
    const result = await connection.execute(
      `BEGIN
    FIDE_TIPO_MANTENIMIENTO_TB_ACTUALIZAR_SP(
        p_id_tipo_mantenimiento => :id,
        p_tipo_mantenimiento => :tipo_mantenimiento
    ); END;`,
      { tipo_mantenimiento, id }
    );

    // Verifica si la actualización fue exitosa
    console.log(`Filas afectadas: ${result.rowsAffected}`);

    // Realizar el commit
    await connection.commit();
    await connection.close();

    res.send('Tipo de mantenimiento actualizado correctamente');
  } catch (err) {
    console.error('Error al actualizar el tipo de mantenimiento:', err);
    res.status(500).send('Error al actualizar el tipo de mantenimiento');
  }
});

app.put('/tipo_mantenimiento/toggleState/:id', async (req, res) => {
  const { id } = req.params; // ID del tipo de mantenimiento
  const { newState } = req.body;

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Actualizar el estado del tipo de mantenimiento en la tabla FIDE_TIPO_MANTENIMIENTO_TB
    const result = await connection.execute(
      `BEGIN
    FIDE_TIPO_MANTENIMIENTO_TB_ACTUALIZAR_ESTADO_SP(
        p_id_tipo_mantenimiento => :id,
        p_new_state => :newState
    ); END;`,
      { newState, id }
    );

    // Verifica si la actualización fue exitosa
    console.log(`Filas afectadas: ${result.rowsAffected}`);

    // Realizar el commit
    await connection.commit();
    await connection.close();

    res.send('Estado del tipo de mantenimiento actualizado correctamente');
  } catch (err) {
    console.error('Error al actualizar el estado del tipo de mantenimiento:', err);
    res.status(500).send('Error al actualizar el estado del tipo de mantenimiento');
  }
});


// MANTENIMIENTOS
app.get('/mantenimientos', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);

    // Consulta para obtener los datos de los mantenimientos con el formato deseado para las habitaciones
    const query = `
      SELECT * FROM V_FIDE_MANTENIMIENTO_DETALLES
    `;
    const result = await connection.execute(query);

    // Verifica los datos obtenidos
    console.log('Datos obtenidos:', result.rows);

    res.json(result.rows);
  } catch (err) {
    console.error('Error de conexión o consulta:', err);
    res.status(500).send('Error al obtener los mantenimientos');
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

app.post('/mantenimientos', async (req, res) => {
  const { id_habitacion, id_tipo_mantenimiento, fecha_mantenimiento } = req.body;

  if (!id_habitacion || !id_tipo_mantenimiento || !fecha_mantenimiento) {
    return res.status(400).send('Todos los campos obligatorios son requeridos');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Llamar al procedimiento almacenado para insertar los datos principales
    await connection.execute(
      `BEGIN
              FIDE_MANTENIMIENTO_TB_INSERT_SP(
                p_id_habitacion => :id_habitacion,
                p_id_tipo_mantenimiento => :id_tipo_mantenimiento,
                p_fecha_mantenimiento => TO_DATE(:fecha_mantenimiento, 'YYYY-MM-DD')
              );
           END;`,
      { id_habitacion, id_tipo_mantenimiento, fecha_mantenimiento }
    );

    // Confirmar la transacción
    await connection.commit();
    await connection.close();

    res.status(201).send('Mantenimiento creado exitosamente');
  } catch (err) {
    console.error('Error al insertar el mantenimiento:', err);
    res.status(500).send('Error al insertar el mantenimiento');
  }
});

app.put('/mantenimientos/:id', async (req, res) => {
  const { id } = req.params; // ID del mantenimiento
  const { id_habitacion, id_tipo_mantenimiento, fecha_mantenimiento } = req.body;

  if (!id_habitacion || !id_tipo_mantenimiento || !fecha_mantenimiento) {
    return res.status(400).send('Todos los campos obligatorios son requeridos');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Actualizar el mantenimiento en la tabla FIDE_MANTENIMIENTO_TB
    const result = await connection.execute(
      `BEGIN
    FIDE_MANTENIMIENTO_TB_ACTUALIZAR_SP(
        p_id_mantenimiento => :id,
        p_id_habitacion => :id_habitacion,
        p_id_tipo_mantenimiento => :id_tipo_mantenimiento,
        p_fecha_mantenimiento => TO_DATE(:fecha_mantenimiento, 'YYYY-MM-DD')
    ); END;`,
      { id_habitacion, id_tipo_mantenimiento, fecha_mantenimiento, id }
    );

    // Verifica si la actualización fue exitosa
    console.log(`Filas afectadas: ${result.rowsAffected}`);

    // Realizar el commit
    await connection.commit();
    await connection.close();

    res.send('Mantenimiento actualizado correctamente');
  } catch (err) {
    console.error('Error al actualizar el mantenimiento:', err);
    res.status(500).send('Error al actualizar el mantenimiento');
  }
});

app.put('/mantenimientos/toggleState/:id', async (req, res) => {
  const { id } = req.params; // ID del mantenimiento
  const { newState } = req.body;

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Actualizar el estado del mantenimiento en la tabla FIDE_MANTENIMIENTO_TB
    const result = await connection.execute(
      `BEGIN
    FIDE_MANTENIMIENTO_TB_ACTUALIZAR_ESTADO_SP(
        p_id_mantenimiento => :id,
        p_new_state => :newState
    ); END;`,
      { newState, id }
    );

    // Verifica si la actualización fue exitosa
    console.log(`Filas afectadas: ${result.rowsAffected}`);

    // Realizar el commit
    await connection.commit();
    await connection.close();

    res.send('Estado del mantenimiento actualizado correctamente');
  } catch (err) {
    console.error('Error al actualizar el estado del mantenimiento:', err);
    res.status(500).send('Error al actualizar el estado del mantenimiento');
  }
});


// INVENTARIO
app.get('/inventario', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);

    // Consulta para obtener los datos del inventario
    const query = `
      SELECT * FROM V_FIDE_INVENTARIO_DETALLES
    `;
    const result = await connection.execute(query);

    // Verifica los datos obtenidos
    console.log('Datos obtenidos:', result.rows);

    res.json(result.rows);
  } catch (err) {
    console.error('Error de conexión o consulta:', err);
    res.status(500).send('Error al obtener el inventario');
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

app.post('/inventario', async (req, res) => {
  const { id_habitacion, id_hotel } = req.body;

  if (!id_habitacion || !id_hotel) {
    return res.status(400).send('Todos los campos obligatorios son requeridos');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Llamar al procedimiento almacenado para insertar los datos principales
    await connection.execute(
      `BEGIN
              FIDE_INVENTARIO_TB_INSERT_SP(
                p_id_habitacion => :id_habitacion,
                p_id_hotel => :id_hotel
              );
           END;`,
      { id_habitacion, id_hotel }
    );

    // Confirmar la transacción
    await connection.commit();
    await connection.close();

    res.status(201).send('Inventario creado exitosamente');
  } catch (err) {
    console.error('Error al insertar el inventario:', err);
    res.status(500).send('Error al insertar el inventario');
  }
});

app.put('/inventario/:id', async (req, res) => {
  const { id } = req.params; // ID del inventario
  const { id_habitacion, id_hotel } = req.body;

  if (!id_habitacion || !id_hotel) {
    return res.status(400).send('Todos los campos obligatorios son requeridos');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Actualizar el inventario en la tabla FIDE_INVENTARIO_TB
    const result = await connection.execute(
      `BEGIN
    FIDE_INVENTARIO_TB_ACTUALIZAR_SP(
        p_id_inventario => :id,
        p_id_habitacion => :id_habitacion,
        p_id_hotel => :id_hotel
    ); END;`,
      { id_habitacion, id_hotel, id }
    );

    // Verifica si la actualización fue exitosa
    console.log(`Filas afectadas: ${result.rowsAffected}`);

    // Realizar el commit
    await connection.commit();
    await connection.close();

    res.send('Inventario actualizado correctamente');
  } catch (err) {
    console.error('Error al actualizar el inventario:', err);
    res.status(500).send('Error al actualizar el inventario');
  }
});

app.put('/inventario/toggleState/:id', async (req, res) => {
  const { id } = req.params; // ID del inventario
  const { newState } = req.body;

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Actualizar el estado del inventario en la tabla FIDE_INVENTARIO_TB
    const result = await connection.execute(
      `BEGIN
    FIDE_INVENTARIO_TB_ACTUALIZAR_ESTADO_SP(
        p_id_inventario => :id,
        p_new_state => :newState
    ); END;`,
      { newState, id }
    );

    // Verifica si la actualización fue exitosa
    console.log(`Filas afectadas: ${result.rowsAffected}`);

    // Realizar el commit
    await connection.commit();
    await connection.close();

    res.send('Estado del inventario actualizado correctamente');
  } catch (err) {
    console.error('Error al actualizar el estado del inventario:', err);
    res.status(500).send('Error al actualizar el estado del inventario');
  }
});


// ÍTEMS
app.get('/items', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);

    // Consulta para obtener los datos de los ítems
    const query = `
      SELECT * FROM V_FIDE_ITEM_DETALLES
    `;
    const result = await connection.execute(query);

    // Verifica los datos obtenidos
    console.log('Datos obtenidos:', result.rows);

    res.json(result.rows);
  } catch (err) {
    console.error('Error de conexión o consulta:', err);
    res.status(500).send('Error al obtener los ítems');
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

app.post('/items', async (req, res) => {
  const { marca, modelo, fecha_compra, descripcion } = req.body;

  if (!marca || !modelo || !fecha_compra || !descripcion) {
    return res.status(400).send('Todos los campos obligatorios son requeridos');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Llamar al procedimiento almacenado para insertar los datos principales
    await connection.execute(
      `BEGIN
              FIDE_ITEM_TB_INSERT_SP(
                p_marca => :marca,
                p_modelo => :modelo,
                p_fecha_compra => TO_DATE(:fecha_compra, 'YYYY-MM-DD'),
                p_descripcion => :descripcion
              );
           END;`,
      { marca, modelo, fecha_compra, descripcion }
    );

    // Confirmar la transacción
    await connection.commit();
    await connection.close();

    res.status(201).send('Ítem creado exitosamente');
  } catch (err) {
    console.error('Error al insertar el ítem:', err);
    res.status(500).send('Error al insertar el ítem');
  }
});

app.put('/items/:id', async (req, res) => {
  const { id } = req.params; // ID del ítem
  const { marca, modelo, fecha_compra, descripcion } = req.body;

  if (!marca || !modelo || !fecha_compra || !descripcion) {
    return res.status(400).send('Todos los campos obligatorios son requeridos');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Actualizar el ítem en la tabla FIDE_ITEM_TB
    const result = await connection.execute(
      `BEGIN
    FIDE_ITEM_TB_ACTUALIZAR_SP(
        p_id_item => :id,
        p_marca => :marca,
        p_modelo => :modelo,
        p_fecha_compra => TO_DATE(:fecha_compra, 'YYYY-MM-DD'),
        p_descripcion => :descripcion
    ); END;`,
      { marca, modelo, fecha_compra, descripcion, id }
    );

    // Verifica si la actualización fue exitosa
    console.log(`Filas afectadas: ${result.rowsAffected}`);

    // Realizar el commit
    await connection.commit();
    await connection.close();

    res.send('Ítem actualizado correctamente');
  } catch (err) {
    console.error('Error al actualizar el ítem:', err);
    res.status(500).send('Error al actualizar el ítem');
  }
});

app.put('/items/toggleState/:id', async (req, res) => {
  const { id } = req.params; // ID del ítem
  const { newState } = req.body;

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Actualizar el estado del ítem en la tabla FIDE_ITEM_TB
    const result = await connection.execute(
      `BEGIN
    FIDE_ITEM_TB_ACTUALIZAR_ESTADO_SP(
        p_id_item => :id,
        p_new_state => :newState
    ); END;`,
      { newState, id }
    );

    // Verifica si la actualización fue exitosa
    console.log(`Filas afectadas: ${result.rowsAffected}`);

    // Realizar el commit
    await connection.commit();
    await connection.close();

    res.send('Estado del ítem actualizado correctamente');
  } catch (err) {
    console.error('Error al actualizar el estado del ítem:', err);
    res.status(500).send('Error al actualizar el estado del ítem');
  }
});


// INVENTARIO-ITEM
app.get('/inventario_item', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);

    // Consulta para obtener los datos de los inventario-ítems
    const query = `
      SELECT * FROM V_FIDE_INVENTARIO_ITEM_DETALLES
    `;
    const result = await connection.execute(query);

    // Verifica los datos obtenidos
    console.log('Datos obtenidos:', result.rows);

    res.json(result.rows);
  } catch (err) {
    console.error('Error de conexión o consulta:', err);
    res.status(500).send('Error al obtener los inventario-ítems');
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


app.post('/inventario_item', async (req, res) => {
  const { id_inventario, id_item, cantidad } = req.body;

  if (!id_inventario || !id_item || !cantidad) {
    return res.status(400).send('Todos los campos obligatorios son requeridos');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Llamar al procedimiento almacenado para insertar los datos principales
    await connection.execute(
      `BEGIN
              FIDE_INVENTARIO_ITEM_TB_INSERT_SP(
                p_id_inventario => :id_inventario,
                p_id_item => :id_item,
                p_cantidad => :cantidad
              );
           END;`,
      { id_inventario, id_item, cantidad }
    );

    // Confirmar la transacción
    await connection.commit();
    await connection.close();

    res.status(201).send('Inventario-Ítem creado exitosamente');
  } catch (err) {
    console.error('Error al insertar el inventario-ítem:', err);
    res.status(500).send('Error al insertar el inventario-ítem');
  }
});

app.put('/inventario_item/:id', async (req, res) => {
  const { id } = req.params; // ID del inventario-ítem
  const { id_inventario, id_item, cantidad } = req.body;

  if (!id_inventario || !id_item || !cantidad) {
    return res.status(400).send('Todos los campos obligatorios son requeridos');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Actualizar el inventario-ítem en la tabla FIDE_INVENTARIO_ITEM_TB
    const result = await connection.execute(
      `BEGIN
    FIDE_INVENTARIO_ITEM_TB_ACTUALIZAR_SP(
        p_id_inventario_item => :id,
        p_id_inventario => :id_inventario,
        p_id_item => :id_item,
        p_cantidad => :cantidad
    ); END;`,
      { id_inventario, id_item, cantidad, id }
    );

    // Verifica si la actualización fue exitosa
    console.log(`Filas afectadas: ${result.rowsAffected}`);

    // Realizar el commit
    await connection.commit();
    await connection.close();

    res.send('Inventario-Ítem actualizado correctamente');
  } catch (err) {
    console.error('Error al actualizar el inventario-ítem:', err);
    res.status(500).send('Error al actualizar el inventario-ítem');
  }
});

app.put('/inventario_item/toggleState/:id', async (req, res) => {
  const { id } = req.params; // ID del inventario-ítem
  const { newState } = req.body;

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Actualizar el estado del inventario-ítem en la tabla FIDE_INVENTARIO_ITEM_TB
    const result = await connection.execute(
      `BEGIN
    FIDE_INVENTARIO_ITEM_TB_ACTUALIZAR_ESTADO_SP(
        p_id_inventario_item => :id,
        p_new_state => :newState
    ); END;`,
      { newState, id }
    );

    // Verifica si la actualización fue exitosa
    console.log(`Filas afectadas: ${result.rowsAffected}`);

    // Realizar el commit
    await connection.commit();
    await connection.close();

    res.send('Estado del inventario-ítem actualizado correctamente');
  } catch (err) {
    console.error('Error al actualizar el estado del inventario-ítem:', err);
    res.status(500).send('Error al actualizar el estado del inventario-ítem');
  }
});


// MARCAS
app.get('/marcas', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);

    // Consulta para obtener los datos de las marcas
    const query = `
      SELECT * FROM V_FIDE_MARCA_DETALLES
    `;
    const result = await connection.execute(query);

    // Verifica los datos obtenidos
    console.log('Datos obtenidos:', result.rows);

    res.json(result.rows);
  } catch (err) {
    console.error('Error de conexión o consulta:', err);
    res.status(500).send('Error al obtener las marcas');
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

app.post('/marcas', async (req, res) => {
  const { nombre_marca } = req.body;

  if (!nombre_marca) {
    return res.status(400).send('El nombre de la marca es requerido');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Llamar al procedimiento almacenado para insertar los datos principales
    await connection.execute(
      `BEGIN
              FIDE_MARCA_TB_INSERT_SP(
                p_nombre_marca => :nombre_marca
              );
           END;`,
      { nombre_marca }
    );

    // Confirmar la transacción
    await connection.commit();
    await connection.close();

    res.status(201).send('Marca creada exitosamente');
  } catch (err) {
    console.error('Error al insertar la marca:', err);
    res.status(500).send('Error al insertar la marca');
  }
});

app.put('/marcas/:id', async (req, res) => {
  const { id } = req.params; // ID de la marca
  const { nombre_marca } = req.body;

  if (!nombre_marca) {
    return res.status(400).send('El nombre de la marca es requerido');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Actualizar la marca en la tabla FIDE_MARCA_TB
    const result = await connection.execute(
      `BEGIN
    FIDE_MARCA_TB_ACTUALIZAR_SP(
        p_id_marca => :id,
        p_nombre_marca => :nombre_marca
    ); END;`,
      { nombre_marca, id }
    );

    // Verifica si la actualización fue exitosa
    console.log(`Filas afectadas: ${result.rowsAffected}`);

    // Realizar el commit
    await connection.commit();
    await connection.close();

    res.send('Marca actualizada correctamente');
  } catch (err) {
    console.error('Error al actualizar la marca:', err);
    res.status(500).send('Error al actualizar la marca');
  }
});

app.put('/marcas/toggleState/:id', async (req, res) => {
  const { id } = req.params; // ID de la marca
  const { newState } = req.body;

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Actualizar el estado de la marca en la tabla FIDE_MARCA_TB
    const result = await connection.execute(
      `BEGIN
    FIDE_MARCA_TB_ACTUALIZAR_ESTADO_SP(
        p_id_marca => :id,
        p_new_state => :newState
    ); END;`,
      { newState, id }
    );

    // Verifica si la actualización fue exitosa
    console.log(`Filas afectadas: ${result.rowsAffected}`);

    // Realizar el commit
    await connection.commit();
    await connection.close();

    res.send('Estado de la marca actualizado correctamente');
  } catch (err) {
    console.error('Error al actualizar el estado de la marca:', err);
    res.status(500).send('Error al actualizar el estado de la marca');
  }
});


// MODELOS
app.get('/modelos', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);

    // Consulta para obtener los datos de los modelos
    const query = `
      SELECT * FROM V_FIDE_MODELO_DETALLES
    `;
    const result = await connection.execute(query);

    // Verifica los datos obtenidos
    console.log('Datos obtenidos:', result.rows);

    res.json(result.rows);
  } catch (err) {
    console.error('Error de conexión o consulta:', err);
    res.status(500).send('Error al obtener los modelos');
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

app.post('/modelos', async (req, res) => {
  const { id_marca, nombre_modelo } = req.body;

  if (!id_marca || !nombre_modelo) {
    return res.status(400).send('Todos los campos obligatorios son requeridos');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Llamar al procedimiento almacenado para insertar los datos principales
    await connection.execute(
      `BEGIN
              FIDE_MODELO_TB_INSERT_SP(
                p_id_marca => :id_marca,
                p_nombre_modelo => :nombre_modelo
              );
           END;`,
      { id_marca, nombre_modelo }
    );

    // Confirmar la transacción
    await connection.commit();
    await connection.close();

    res.status(201).send('Modelo creado exitosamente');
  } catch (err) {
    console.error('Error al insertar el modelo:', err);
    res.status(500).send('Error al insertar el modelo');
  }
});

app.put('/modelos/:id', async (req, res) => {
  const { id } = req.params; // ID del modelo
  const { id_marca, nombre_modelo } = req.body;

  if (!id_marca || !nombre_modelo) {
    return res.status(400).send('Todos los campos obligatorios son requeridos');
  }

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Actualizar el modelo en la tabla FIDE_MODELO_TB
    const result = await connection.execute(
      `BEGIN
    FIDE_MODELO_TB_ACTUALIZAR_SP(
        p_id_modelo => :id,
        p_id_marca => :id_marca,
        p_nombre_modelo => :nombre_modelo
    ); END;`,
      { id_marca, nombre_modelo, id }
    );

    // Verifica si la actualización fue exitosa
    console.log(`Filas afectadas: ${result.rowsAffected}`);

    // Realizar el commit
    await connection.commit();
    await connection.close();

    res.send('Modelo actualizado correctamente');
  } catch (err) {
    console.error('Error al actualizar el modelo:', err);
    res.status(500).send('Error al actualizar el modelo');
  }
});

app.put('/modelos/toggleState/:id', async (req, res) => {
  const { id } = req.params; // ID del modelo
  const { newState } = req.body;

  try {
    const connection = await oracledb.getConnection(dbConfig);

    // Actualizar el estado del modelo en la tabla FIDE_MODELO_TB
    const result = await connection.execute(
      `BEGIN
    FIDE_MODELO_TB_ACTUALIZAR_ESTADO_SP(
        p_id_modelo => :id,
        p_new_state => :newState
    ); END;`,
      { newState, id }
    );

    // Verifica si la actualización fue exitosa
    console.log(`Filas afectadas: ${result.rowsAffected}`);

    // Realizar el commit
    await connection.commit();
    await connection.close();

    res.send('Estado del modelo actualizado correctamente');
  } catch (err) {
    console.error('Error al actualizar el estado del modelo:', err);
    res.status(500).send('Error al actualizar el estado del modelo');
  }
});












// Arrancar el servidor, esto va al final
app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});