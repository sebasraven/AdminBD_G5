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
      `UPDATE FIDE_USUARIOS_TB
       SET nombre = :nombre, apellidos = :apellidos, cedula = :cedula, telefono = :telefono, correo = :correo, fecha_nacimiento = TO_DATE(:fecha_nacimiento, 'YYYY-MM-DD'), id_rol = :id_rol, id_nacionalidad = :id_nacionalidad, id_pais = :id_pais, id_provincia = :id_provincia, id_canton = :id_canton, id_distrito = :id_distrito, contrasena = :contrasena, id_estado = :nuevo_estado
       WHERE id_usuario = :id`,
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


//ROLES
app.get('/roles', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);

    // Consulta para obtener los datos incluyendo el nombre del estado
    const query = `
      SELECT 
        R.id_rol, 
        R.nombre_rol, 
        R.descripcion, 
        E.nombre_estado, 
        R.creado_por, 
        R.fecha_creacion, 
        R.modificado_por, 
        R.fecha_modificacion, 
        R.accion
      FROM 
        FIDE_ROLES_TB R
      JOIN 
        FIDE_ESTADOS_TB E 
      ON 
        R.id_estado = E.id_estado
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
      `UPDATE FIDE_ROLES_TB
       SET nombre_rol = :nombre_rol, descripcion = :descripcion, id_estado = :nuevo_estado
       WHERE id_rol = :id`,
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
      SELECT 
        U.id_usuario, 
        U.nombre, 
        U.apellidos, 
        U.cedula, 
        U.telefono, 
        U.correo, 
        U.fecha_nacimiento, 
        N.descripcion,
        P.nombre_pais,
        PR.nombre_provincia,
        C.nombre_canton,
        D.nombre_distrito,
        R.nombre_rol, 
        E.nombre_estado,
        U.id_rol,
        U.id_nacionalidad,
        U.id_pais,
        U.id_provincia,
        U.id_canton,
        U.id_distrito,
        U.contrasena
      FROM 
        FIDE_USUARIOS_TB U
      JOIN 
        FIDE_NACIONALIDAD_TB N
      ON 
        U.id_nacionalidad = N.id_nacionalidad
      JOIN 
        FIDE_PAIS_TB P
      ON 
        U.id_pais = P.id_pais
      JOIN 
        FIDE_PROVINCIA_TB PR
      ON 
        U.id_provincia = PR.id_provincia
      JOIN 
        FIDE_CANTON_TB C 
      ON 
        U.id_canton = C.id_canton
      JOIN 
        FIDE_DISTRITO_TB D
      ON 
        U.id_distrito = D.id_distrito
      JOIN 
        FIDE_ROLES_TB R 
      ON 
        U.id_rol = R.id_rol
      JOIN 
        FIDE_ESTADOS_TB E 
      ON 
        U.id_estado = E.id_estado
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
      `UPDATE FIDE_USUARIOS_TB
       SET nombre = :nombre, apellidos = :apellidos, cedula = :cedula, telefono = :telefono, correo = :correo, fecha_nacimiento = TO_DATE(:fecha_nacimiento, 'YYYY-MM-DD'), id_rol = :id_rol, id_nacionalidad = :id_nacionalidad, id_pais = :id_pais, id_provincia = :id_provincia, id_canton = :id_canton, id_distrito = :id_distrito, contrasena = :contrasena, id_estado = :nuevo_estado
       WHERE id_usuario = :id`,
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
      SELECT 
        M.id_moneda, 
        M.codigo_moneda, 
        M.nombre_moneda, 
        E.nombre_estado,
        M.creado_por, 
        M.fecha_creacion, 
        M.modificado_por, 
        M.fecha_modificacion, 
        M.accion
      FROM 
        FIDE_MONEDA_TB M
      JOIN 
        FIDE_ESTADOS_TB E 
      ON 
        M.id_estado = E.id_estado
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
      `UPDATE FIDE_MONEDA_TB
       SET codigo_moneda = :codigo_moneda, nombre_moneda = :nombre_moneda, id_estado = :nuevo_estado
       WHERE id_moneda = :id`,
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
      SELECT 
        T.id_tipo_cambio,
        M.nombre_moneda, 
        T.fecha, 
        T.tasa_cambio,
        T.creado_por,
        T.fecha_creacion, 
        T.modificado_por, 
        T.fecha_modificacion, 
        T.accion
      FROM 
        FIDE_TIPO_CAMBIO_TB T
      JOIN 
        FIDE_MONEDA_TB M 
      ON 
        T.id_moneda = M.id_moneda
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
      `UPDATE FIDE_TIPO_CAMBIO_TB
       SET id_moneda = :id_moneda, fecha = TO_DATE(:fecha, 'YYYY-MM-DD'), tasa_cambio = :tasa_cambio
       WHERE id_tipo_cambio = :id`,
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
      SELECT 
        I.id_impuesto, 
        I.nombre_impuesto, 
        I.porcentaje, 
        P.nombre_pais,
        E.nombre_estado,
        I.creado_por,
        I.fecha_creacion, 
        I.modificado_por, 
        I.fecha_modificacion, 
        I.accion
      FROM 
        FIDE_IMPUESTOS_TB I
      JOIN 
        FIDE_PAIS_TB P 
      ON 
        I.id_pais = P.id_pais
      JOIN 
        FIDE_ESTADOS_TB E 
      ON 
        I.id_estado = E.id_estado
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
      `UPDATE FIDE_IMPUESTOS_TB
       SET id_estado = :id_estado
       WHERE id_impuesto = :lastId`,
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
      SELECT 
        H.id_hotel, 
        H.nombre_hotel, 
        H.telefono, 
        P.nombre_pais,
        PRO.nombre_provincia,
        C.nombre_canton,
        D.nombre_distrito,
        E.nombre_estado,
        H.creado_por,
        H.fecha_creacion, 
        H.modificado_por, 
        H.fecha_modificacion, 
        H.accion
      FROM 
        FIDE_HOTELES_TB H
      JOIN 
        FIDE_PAIS_TB P 
      ON 
        H.id_pais = P.id_pais
      JOIN 
        FIDE_PROVINCIA_TB PRO 
      ON 
        H.id_provincia = PRO.id_provincia
      JOIN 
        FIDE_CANTON_TB C 
      ON 
        H.id_canton = C.id_canton
      JOIN 
        FIDE_DISTRITO_TB D 
      ON 
        H.id_distrito = D.id_distrito
      JOIN 
        FIDE_ESTADOS_TB E 
      ON 
        H.id_estado = E.id_estado
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
      `SELECT ID_HOTEL_SEQ.CURRVAL AS last_id FROM dual`
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
      `UPDATE FIDE_HOTELES_TB
       SET nombre_hotel = :nombre_hotel, telefono = :telefono, id_pais = :id_pais, id_provincia = :id_provincia, id_canton = :id_canton, id_distrito = :id_distrito
       WHERE id_hotel = :id`,
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
      `UPDATE FIDE_HOTELES_TB
       SET id_estado = (SELECT id_estado FROM FIDE_ESTADOS_TB WHERE nombre_estado = :newState)
       WHERE id_hotel = :id`,
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
      SELECT 
        H.id_habitacion, 
        HO.nombre_hotel, 
        M.nombre_moneda, 
        H.numero_habitacion, 
        H.tipo_habitacion, 
        H.precio_por_noche, 
        H.capacidad_personas, 
        E.nombre_estado, 
        H.creado_por, 
        H.fecha_creacion, 
        H.modificado_por, 
        H.fecha_modificacion, 
        H.accion
      FROM 
        FIDE_HABITACIONES_TB H
      JOIN 
        FIDE_HOTELES_TB HO 
      ON 
        H.id_hotel = HO.id_hotel
      JOIN 
        FIDE_MONEDA_TB M 
      ON 
        H.id_moneda = M.id_moneda
      JOIN 
        FIDE_ESTADOS_TB E 
      ON 
        H.id_estado = E.id_estado
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
      `SELECT ID_HABITACION_SEQ.CURRVAL AS last_id FROM dual`
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
      `UPDATE FIDE_HABITACIONES_TB
       SET id_hotel = :id_hotel, id_moneda = :id_moneda, numero_habitacion = :numero_habitacion, tipo_habitacion = :tipo_habitacion, precio_por_noche = :precio_por_noche, capacidad_personas = :capacidad_personas
       WHERE id_habitacion = :id`,
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
      `UPDATE FIDE_HABITACIONES_TB
       SET id_estado = (SELECT id_estado FROM FIDE_ESTADOS_TB WHERE nombre_estado = :newState)
       WHERE id_habitacion = :id`,
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
      SELECT 
        L.id_limpieza, 
        H.numero_habitacion, 
        HO.nombre_hotel, 
        U.nombre AS nombre_usuario, 
        TO_CHAR(L.fecha_limpieza, 'YYYY-MM-DD') AS fecha_limpieza, 
        L.comentarios, 
        E.nombre_estado, 
        L.creado_por, 
        L.fecha_creacion, 
        L.modificado_por, 
        L.fecha_modificacion, 
        L.accion
      FROM 
        FIDE_LIMPIEZA_HABITACIONES_TB L
      JOIN 
        FIDE_HABITACIONES_TB H 
      ON 
        L.id_habitacion = H.id_habitacion
      JOIN 
        FIDE_HOTELES_TB HO 
      ON 
        H.id_hotel = HO.id_hotel
      JOIN 
        FIDE_USUARIOS_TB U 
      ON 
        L.id_usuario = U.id_usuario
      JOIN 
        FIDE_ESTADOS_TB E 
      ON 
        L.id_estado = E.id_estado
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
      `SELECT ID_LIMPIEZA_SEQ.CURRVAL AS last_id FROM dual`
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
      `UPDATE FIDE_LIMPIEZA_HABITACIONES_TB
       SET id_estado = (SELECT id_estado FROM FIDE_ESTADOS_TB WHERE nombre_estado = :newState)
       WHERE id_limpieza = :id`,
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

















// Arrancar el servidor, esto va al final
app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});