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


// VALORACIONES
app.get('/valoraciones', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);

    // Consulta para obtener los datos de las valoraciones incluyendo el estado
    const query = `
      SELECT 
        V.id_valoracion, 
        V.comentario, 
        V.valoracion, 
        TO_CHAR(V.timestamp, 'YYYY-MM-DD HH24:MI:SS') AS timestamp, 
        E.nombre_estado, 
        V.creado_por, 
        V.fecha_creacion, 
        V.modificado_por, 
        V.fecha_modificacion, 
        V.accion
      FROM 
        FIDE_VALORACION_TB V
      JOIN 
        FIDE_ESTADOS_TB E 
      ON 
        V.id_estado = E.id_estado
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
      `SELECT ID_VALORACION_SEQ.CURRVAL AS last_id FROM dual`
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
      `UPDATE FIDE_VALORACION_TB
       SET id_estado = (SELECT id_estado FROM FIDE_ESTADOS_TB WHERE nombre_estado = :newState)
       WHERE id_valoracion = :id`,
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
      SELECT 
        C.id_categoria, 
        C.nombre_categoria, 
        C.comentarios, 
        E.nombre_estado, 
        C.creado_por, 
        C.fecha_creacion, 
        C.modificado_por, 
        C.fecha_modificacion, 
        C.accion
      FROM 
        FIDE_CATEGORIA_RESERVAS_TB C
      JOIN 
        FIDE_ESTADOS_TB E 
      ON 
        C.id_estado = E.id_estado
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
      `SELECT ID_CATEGORIA_SEQ.CURRVAL AS last_id FROM dual`
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
      `UPDATE FIDE_CATEGORIA_RESERVAS_TB
       SET nombre_categoria = :nombre_categoria, comentarios = :comentarios
       WHERE id_categoria = :id`,
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
      `UPDATE FIDE_CATEGORIA_RESERVAS_TB
       SET id_estado = (SELECT id_estado FROM FIDE_ESTADOS_TB WHERE nombre_estado = :newState)
       WHERE id_categoria = :id`,
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
      SELECT 
        R.id_reservacion, 
        U.nombre AS nombre_usuario, 
        H.nombre_hotel, 
        C.nombre_categoria, 
        HA.numero_habitacion, 
        V.valoracion, 
        M.nombre_moneda, 
        E.nombre_estado, 
        TO_CHAR(R.fecha_inicio, 'YYYY-MM-DD') AS fecha_inicio, 
        TO_CHAR(R.fecha_cierre, 'YYYY-MM-DD') AS fecha_cierre, 
        TO_CHAR(R.hora, 'YYYY-MM-DD HH24:MI:SS') AS hora, 
        R.precio_unitario, 
        R.nombre, 
        R.descripcion, 
        R.creado_por, 
        TO_CHAR(R.fecha_creacion, 'YYYY-MM-DD HH24:MI:SS') AS fecha_creacion, 
        R.modificado_por, 
        TO_CHAR(R.fecha_modificacion, 'YYYY-MM-DD HH24:MI:SS') AS fecha_modificacion, 
        R.accion
      FROM 
        FIDE_RESERVAS_TB R
      JOIN 
        FIDE_USUARIOS_TB U ON R.id_usuario = U.id_usuario
      JOIN 
        FIDE_HOTELES_TB H ON R.id_hotel = H.id_hotel
      JOIN 
        FIDE_CATEGORIA_RESERVAS_TB C ON R.id_categoria = C.id_categoria
      JOIN 
        FIDE_HABITACIONES_TB HA ON R.id_habitacion = HA.id_habitacion
      JOIN 
        FIDE_VALORACION_TB V ON R.id_valoracion = V.id_valoracion
      JOIN 
        FIDE_MONEDA_TB M ON R.id_moneda = M.id_moneda
      JOIN 
        FIDE_ESTADOS_TB E ON R.id_estado = E.id_estado
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
      `SELECT ID_RESERVACION_SEQ.CURRVAL AS last_id FROM dual`
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
      `UPDATE FIDE_RESERVAS_TB
       SET id_usuario = :id_usuario, id_hotel = :id_hotel, id_categoria = :id_categoria, id_habitacion = :id_habitacion, id_valoracion = :id_valoracion, id_moneda = :id_moneda, fecha_inicio = TO_DATE(:fecha_inicio, 'YYYY-MM-DD'), fecha_cierre = TO_DATE(:fecha_cierre, 'YYYY-MM-DD'), hora = TO_TIMESTAMP(:hora, 'YYYY-MM-DD"T"HH24:MI:SS'), precio_unitario = :precio_unitario, nombre = :nombre, descripcion = :descripcion
       WHERE id_reservacion = :id`,
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
      `UPDATE FIDE_RESERVAS_TB
       SET id_estado = (SELECT id_estado FROM FIDE_ESTADOS_TB WHERE nombre_estado = :newState)
       WHERE id_reservacion = :id`,
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
      SELECT 
        TP.id_tipo_promocion, 
        TP.nombre, 
        TP.descripcion, 
        E.nombre_estado, 
        TP.creado_por, 
        TP.fecha_creacion, 
        TP.modificado_por, 
        TP.fecha_modificacion, 
        TP.accion
      FROM 
        FIDE_TIPO_PROMOCION_TB TP
      JOIN 
        FIDE_ESTADOS_TB E 
      ON 
        TP.id_estado = E.id_estado
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
      `SELECT ID_TIPO_PROMOCION_SEQ.CURRVAL AS last_id FROM dual`
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
      `UPDATE FIDE_TIPO_PROMOCION_TB
       SET nombre = :nombre, descripcion = :descripcion
       WHERE id_tipo_promocion = :id`,
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
      `UPDATE FIDE_TIPO_PROMOCION_TB
       SET id_estado = (SELECT id_estado FROM FIDE_ESTADOS_TB WHERE nombre_estado = :newState)
       WHERE id_tipo_promocion = :id`,
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
      SELECT 
        P.id_promocion,
        TP.nombre AS tipo_promocion,
        R.nombre AS nombre_reservacion,
        M.nombre_moneda,
        P.descripcion,
        P.nombre_promocion,
        TO_CHAR(P.fecha_inicio, 'YYYY-MM-DD') AS fecha_inicio,
        TO_CHAR(P.fecha_fin, 'YYYY-MM-DD') AS fecha_fin,
        P.porcentaje_promocion,
        P.descuento,
        E.nombre_estado,
        P.creado_por,
        TO_CHAR(P.fecha_creacion, 'YYYY-MM-DD HH24:MI:SS') AS fecha_creacion,
        P.modificado_por,
        TO_CHAR(P.fecha_modificacion, 'YYYY-MM-DD HH24:MI:SS') AS fecha_modificacion,
        P.accion
      FROM 
        FIDE_PROMOCIONES_TB P
      JOIN 
        FIDE_TIPO_PROMOCION_TB TP ON P.id_tipo_promocion = TP.id_tipo_promocion
      JOIN 
        FIDE_RESERVAS_TB R ON P.id_reservacion = R.id_reservacion
      JOIN 
        FIDE_MONEDA_TB M ON P.id_moneda = M.id_moneda
      JOIN 
        FIDE_ESTADOS_TB E ON P.id_estado = E.id_estado
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
      `SELECT ID_PROMOCION_SEQ.CURRVAL AS last_id FROM dual`
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
      `UPDATE FIDE_PROMOCIONES_TB
       SET id_tipo_promocion = :id_tipo_promocion, id_reservacion = :id_reservacion, id_moneda = :id_moneda, descripcion = :descripcion, nombre_promocion = :nombre_promocion, fecha_inicio = TO_DATE(:fecha_inicio, 'YYYY-MM-DD'), fecha_fin = TO_DATE(:fecha_fin, 'YYYY-MM-DD'), porcentaje_promocion = :porcentaje_promocion, descuento = :descuento
       WHERE id_promocion = :id`,
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
      `UPDATE FIDE_PROMOCIONES_TB
       SET id_estado = (SELECT id_estado FROM FIDE_ESTADOS_TB WHERE nombre_estado = :newState)
       WHERE id_promocion = :id`,
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
      SELECT 
        F.id_factura,
        M.nombre_moneda,
        U.nombre as nombre_usuario,
        I.nombre_impuesto,
        P.nombre_promocion,
        E.nombre_estado,
        PA.nombre_pais,
        PR.nombre_provincia,
        C.nombre_canton,
        D.nombre_distrito,
        F.subtotal,
        F.total,
        F.creado_por,
        TO_CHAR(F.fecha_creacion, 'YYYY-MM-DD HH24:MI:SS') AS fecha_creacion,
        F.modificado_por,
        TO_CHAR(F.fecha_modificacion, 'YYYY-MM-DD HH24:MI:SS') AS fecha_modificacion,
        F.accion
      FROM 
        FIDE_FACTURAS_TB F
      JOIN 
        FIDE_MONEDA_TB M ON F.id_moneda = M.id_moneda
      JOIN 
        FIDE_USUARIOS_TB U ON F.id_usuario = U.id_usuario
      JOIN 
        FIDE_IMPUESTOS_TB I ON F.id_impuesto = I.id_impuesto
      LEFT JOIN 
        FIDE_PROMOCIONES_TB P ON F.id_promocion = P.id_promocion
      JOIN 
        FIDE_ESTADOS_TB E ON F.id_estado = E.id_estado
      LEFT JOIN 
        FIDE_PAIS_TB PA ON F.id_pais = PA.id_pais
      LEFT JOIN 
        FIDE_PROVINCIA_TB PR ON F.id_provincia = PR.id_provincia
      LEFT JOIN 
        FIDE_CANTON_TB C ON F.id_canton = C.id_canton
      LEFT JOIN 
        FIDE_DISTRITO_TB D ON F.id_distrito = D.id_distrito
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
      `SELECT ID_FACTURA_SEQ.CURRVAL AS last_id FROM dual`
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
      SELECT 
        TM.id_tipo_mantenimiento,
        TM.tipo_mantenimiento,
        E.nombre_estado,
        TM.creado_por,
        TO_CHAR(TM.fecha_creacion, 'YYYY-MM-DD HH24:MI:SS') AS fecha_creacion,
        TM.modificado_por,
        TO_CHAR(TM.fecha_modificacion, 'YYYY-MM-DD HH24:MI:SS') AS fecha_modificacion,
        TM.accion
      FROM 
        FIDE_TIPO_MANTENIMIENTO_TB TM
      JOIN 
        FIDE_ESTADOS_TB E ON TM.id_estado = E.id_estado
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
      `UPDATE FIDE_TIPO_MANTENIMIENTO_TB
       SET tipo_mantenimiento = :tipo_mantenimiento
       WHERE id_tipo_mantenimiento = :id`,
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
      `UPDATE FIDE_TIPO_MANTENIMIENTO_TB
       SET id_estado = (SELECT id_estado FROM FIDE_ESTADOS_TB WHERE nombre_estado = :newState)
       WHERE id_tipo_mantenimiento = :id`,
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
      SELECT 
        M.id_mantenimiento,
        HO.nombre_hotel || ', Habitación ' || H.numero_habitacion AS habitacion_formateada,
        TM.tipo_mantenimiento,
        TO_CHAR(M.fecha_mantenimiento, 'YYYY-MM-DD') AS fecha_mantenimiento,
        E.nombre_estado,
        M.creado_por,
        TO_CHAR(M.fecha_creacion, 'YYYY-MM-DD HH24:MI:SS') AS fecha_creacion,
        M.modificado_por,
        TO_CHAR(M.fecha_modificacion, 'YYYY-MM-DD HH24:MI:SS') AS fecha_modificacion,
        M.accion
      FROM 
        FIDE_MANTENIMIENTO_TB M
      JOIN 
        FIDE_HABITACIONES_TB H ON M.id_habitacion = H.id_habitacion
      JOIN 
        FIDE_HOTELES_TB HO ON H.id_hotel = HO.id_hotel
      JOIN 
        FIDE_TIPO_MANTENIMIENTO_TB TM ON M.id_tipo_mantenimiento = TM.id_tipo_mantenimiento
      JOIN 
        FIDE_ESTADOS_TB E ON M.id_estado = E.id_estado
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
      `UPDATE FIDE_MANTENIMIENTO_TB
       SET id_habitacion = :id_habitacion, id_tipo_mantenimiento = :id_tipo_mantenimiento, fecha_mantenimiento = TO_DATE(:fecha_mantenimiento, 'YYYY-MM-DD')
       WHERE id_mantenimiento = :id`,
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
      `UPDATE FIDE_MANTENIMIENTO_TB
       SET id_estado = (SELECT id_estado FROM FIDE_ESTADOS_TB WHERE nombre_estado = :newState)
       WHERE id_mantenimiento = :id`,
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
      SELECT 
        I.id_inventario,
        H.numero_habitacion,
        HO.nombre_hotel,
        E.nombre_estado,
        I.creado_por,
        TO_CHAR(I.fecha_creacion, 'YYYY-MM-DD HH24:MI:SS') AS fecha_creacion,
        I.modificado_por,
        TO_CHAR(I.fecha_modificacion, 'YYYY-MM-DD HH24:MI:SS') AS fecha_modificacion,
        I.accion
      FROM 
        FIDE_INVENTARIO_TB I
      JOIN 
        FIDE_HABITACIONES_TB H ON I.id_habitacion = H.id_habitacion
      JOIN 
        FIDE_HOTELES_TB HO ON I.id_hotel = HO.id_hotel
      JOIN 
        FIDE_ESTADOS_TB E ON I.id_estado = E.id_estado
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
      `UPDATE FIDE_INVENTARIO_TB
       SET id_habitacion = :id_habitacion, id_hotel = :id_hotel
       WHERE id_inventario = :id`,
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
      `UPDATE FIDE_INVENTARIO_TB
       SET id_estado = (SELECT id_estado FROM FIDE_ESTADOS_TB WHERE nombre_estado = :newState)
       WHERE id_inventario = :id`,
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
      SELECT 
        I.id_item,
        I.marca,
        I.modelo,
        TO_CHAR(I.fecha_compra, 'YYYY-MM-DD') AS fecha_compra,
        I.descripcion,
        E.nombre_estado,
        I.creado_por,
        TO_CHAR(I.fecha_creacion, 'YYYY-MM-DD HH24:MI:SS') AS fecha_creacion,
        I.modificado_por,
        TO_CHAR(I.fecha_modificacion, 'YYYY-MM-DD HH24:MI:SS') AS fecha_modificacion,
        I.accion
      FROM 
        FIDE_ITEM_TB I
      JOIN 
        FIDE_ESTADOS_TB E ON I.id_estado = E.id_estado
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
      `UPDATE FIDE_ITEM_TB
       SET marca = :marca, modelo = :modelo, fecha_compra = TO_DATE(:fecha_compra, 'YYYY-MM-DD'), descripcion = :descripcion
       WHERE id_item = :id`,
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
      `UPDATE FIDE_ITEM_TB
       SET id_estado = (SELECT id_estado FROM FIDE_ESTADOS_TB WHERE nombre_estado = :newState)
       WHERE id_item = :id`,
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
      SELECT 
        II.id_inventario_item,
        HO.nombre_hotel || ', Habitación ' || H.numero_habitacion AS nombre_inventario,
        I.marca || ' ' || I.modelo AS nombre_item,
        II.cantidad,
        E.nombre_estado,
        II.creado_por,
        TO_CHAR(II.fecha_creacion, 'YYYY-MM-DD HH24:MI:SS') AS fecha_creacion,
        II.modificado_por,
        TO_CHAR(II.fecha_modificacion, 'YYYY-MM-DD HH24:MI:SS') AS fecha_modificacion,
        II.accion
      FROM 
        FIDE_INVENTARIO_ITEM_TB II
      JOIN 
        FIDE_INVENTARIO_TB IT ON II.id_inventario = IT.id_inventario
      JOIN 
        FIDE_HABITACIONES_TB H ON IT.id_habitacion = H.id_habitacion
      JOIN 
        FIDE_HOTELES_TB HO ON IT.id_hotel = HO.id_hotel
      JOIN 
        FIDE_ITEM_TB I ON II.id_item = I.id_item
      JOIN 
        FIDE_ESTADOS_TB E ON II.id_estado = E.id_estado
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
      `UPDATE FIDE_INVENTARIO_ITEM_TB
       SET id_inventario = :id_inventario, id_item = :id_item, cantidad = :cantidad
       WHERE id_inventario_item = :id`,
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
      `UPDATE FIDE_INVENTARIO_ITEM_TB
       SET id_estado = (SELECT id_estado FROM FIDE_ESTADOS_TB WHERE nombre_estado = :newState)
       WHERE id_inventario_item = :id`,
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
















// Arrancar el servidor, esto va al final
app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});