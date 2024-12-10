const API_URL = 'http://localhost:3000/usuarios';

// Función para cargar los roles en el campo de selección
const loadRolesForSelect = async () => {
    const roleSelect = document.getElementById('editRol');
    if (!roleSelect) {
        console.error("No se encontró el campo de selección de roles.");
        return;
    }

    // Verificar si el select ya tiene opciones
    if (roleSelect.options.length > 0) {
        return; // Si ya tiene opciones, no cargar nuevamente
    }

    try {
        const response = await axios.get('http://localhost:3000/roles');
        console.log('Roles recibidos:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(role => {
                const [id_rol, nombre_rol] = role;
                const option = document.createElement('option');
                option.value = id_rol;
                option.text = nombre_rol;
                roleSelect.appendChild(option);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar los roles:', err);
    }
};

// Función para cargar las nacionalidades en el campo de selección
const loadNationalitiesForSelect = async () => {
    const nationalitySelect = document.getElementById('editNacionalidad');
    if (!nationalitySelect) {
        console.error("No se encontró el campo de selección de nacionalidades.");
        return;
    }

    // Verificar si el select ya tiene opciones
    if (nationalitySelect.options.length > 0) {
        return; // Si ya tiene opciones, no cargar nuevamente
    }

    try {
        const response = await axios.get('http://localhost:3000/nacionalidad');
        console.log('Nacionalidades recibidas:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(nationality => {
                const [id_nacionalidad, descripcion] = nationality;
                const option = document.createElement('option');
                option.value = id_nacionalidad;
                option.text = descripcion;
                nationalitySelect.appendChild(option);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar las nacionalidades:', err);
    }
};

// Función para cargar los países en el campo de selección
const loadCountriesForSelect = async () => {
    const countrySelect = document.getElementById('editPais');
    if (!countrySelect) {
        console.error("No se encontró el campo de selección de países.");
        return;
    }

    // Verificar si el select ya tiene opciones
    if (countrySelect.options.length > 0) {
        return; // Si ya tiene opciones, no cargar nuevamente
    }

    try {
        const response = await axios.get('http://localhost:3000/pais');
        console.log('Países recibidos:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(country => {
                const [id_pais, nombre_pais] = country;
                const option = document.createElement('option');
                option.value = id_pais;
                option.text = nombre_pais;
                countrySelect.appendChild(option);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar los países:', err);
    }
};

// Función para cargar las provincias en el campo de selección
const loadProvincesForSelect = async () => {
    const provinceSelect = document.getElementById('editProvincia');
    if (!provinceSelect) {
        console.error("No se encontró el campo de selección de provincias.");
        return;
    }

    // Verificar si el select ya tiene opciones
    if (provinceSelect.options.length > 0) {
        return; // Si ya tiene opciones, no cargar nuevamente
    }

    try {
        const response = await axios.get('http://localhost:3000/provincia');
        console.log('Provincias recibidas:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(province => {
                const [id_provincia, nombre_provincia] = province;
                const option = document.createElement('option');
                option.value = id_provincia;
                option.text = nombre_provincia;
                provinceSelect.appendChild(option);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar las provincias:', err);
    }
};

// Función para cargar los cantones en el campo de selección
const loadCantonsForSelect = async () => {
    const cantonSelect = document.getElementById('editCanton');
    if (!cantonSelect) {
        console.error("No se encontró el campo de selección de cantones.");
        return;
    }

    // Verificar si el select ya tiene opciones
    if (cantonSelect.options.length > 0) {
        return; // Si ya tiene opciones, no cargar nuevamente
    }

    try {
        const response = await axios.get('http://localhost:3000/canton');
        console.log('Cantones recibidos:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(canton => {
                const [id_canton, nombre_canton] = canton;
                const option = document.createElement('option');
                option.value = id_canton;
                option.text = nombre_canton;
                cantonSelect.appendChild(option);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar los cantones:', err);
    }
};

// Función para cargar los distritos en el campo de selección
const loadDistrictsForSelect = async () => {
    const districtSelect = document.getElementById('editDistrito');
    if (!districtSelect) {
        console.error("No se encontró el campo de selección de distritos.");
        return;
    }

    // Verificar si el select ya tiene opciones
    if (districtSelect.options.length > 0) {
        return; // Si ya tiene opciones, no cargar nuevamente
    }

    try {
        const response = await axios.get('http://localhost:3000/distrito');
        console.log('Distritos recibidos:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(district => {
                const [id_distrito, nombre_distrito] = district;
                const option = document.createElement('option');
                option.value = id_distrito;
                option.text = nombre_distrito;
                districtSelect.appendChild(option);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar los distritos:', err);
    }
};

// Agregar evento para cargar las selecciones cuando se muestra el modal de agregar/editar usuarios
document.getElementById('addUserModal').addEventListener('show.bs.modal', () => {
    loadRolesForSelect();
    loadNationalitiesForSelect();
    loadCountriesForSelect();
    loadProvincesForSelect();
    loadCantonsForSelect();
    loadDistrictsForSelect();
});

// Actualiza la carga de usuarios para incluir todos los datos necesarios en la llamada a toggleState
const loadUsers = async () => {
    const tableBody = document.getElementById('userTableBody');
    if (!tableBody) {
        console.error("No se encontró el cuerpo de la tabla de usuarios.");
        return;
    }
    tableBody.innerHTML = ''; // Limpiar la tabla antes de agregar nuevas filas

    try {
        const response = await axios.get(API_URL);
        console.log('Respuesta recibida:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(user => {
                const [id_usuario, nombre, apellidos, cedula, telefono, correo, fecha_nacimiento, nombre_nacionalidad, nombre_pais, nombre_provincia, nombre_canton, nombre_distrito, nombre_rol, nombre_estado, id_rol, id_nacionalidad, id_pais, id_provincia, id_canton, id_distrito, contrasena] = user;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${nombre}</td>
                    <td>${apellidos}</td>
                    <td>${cedula}</td>
                    <td>${telefono}</td>
                    <td>${correo}</td>
                    <td>${fecha_nacimiento.split('T')[0]}</td>
                    <td>${nombre_nacionalidad}</td>
                    <td>${nombre_pais}</td>
                    <td>${nombre_provincia}</td>
                    <td>${nombre_canton}</td>
                    <td>${nombre_distrito}</td>
                    <td>${nombre_rol}</td>
                    <td>${nombre_estado}</td>
                    <td>
                        <button class="btn btn-success btn-sm" onclick="toggleState(${id_usuario}, '${nombre_estado}', '${nombre}', '${apellidos}', '${cedula}', '${telefono}', '${correo}', '${fecha_nacimiento}', ${id_rol}, ${id_nacionalidad}, ${id_pais}, ${id_provincia}, ${id_canton}, ${id_distrito}, '${contrasena}')">
                            ${nombre_estado === 'Activo' ? 'Desactivar' : 'Activar'}
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="editUser(${id_usuario}, '${nombre}', '${apellidos}', '${cedula}', '${telefono}', '${correo}', '${fecha_nacimiento}', ${id_rol}, ${id_nacionalidad}, ${id_pais}, ${id_provincia}, ${id_canton}, ${id_distrito}, '${contrasena}')"> Editar </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar los usuarios:', err);
    }
};


const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
};

// Manejar formulario de agregar/editar usuario
const addUserForm = document.getElementById('addUserForm');
if (addUserForm) {
    addUserForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const userId = document.getElementById('userId').value;
        const nombre = document.getElementById('editNombre').value.trim();
        const apellidos = document.getElementById('editApellidos').value.trim();
        const cedula = document.getElementById('editCedula').value.trim();
        const telefono = document.getElementById('editTelefono').value.trim();
        const correo = document.getElementById('editCorreo').value.trim();
        const fecha_nacimiento_raw = document.getElementById('editFechaNacimiento').value;
        const fecha_nacimiento = formatDate(fecha_nacimiento_raw); // Formatear la fecha antes de enviarla
        const id_rol = document.getElementById('editRol').value;
        const id_nacionalidad = document.getElementById('editNacionalidad').value;
        const id_pais = document.getElementById('editPais').value;
        const id_provincia = document.getElementById('editProvincia').value;
        const id_canton = document.getElementById('editCanton').value;
        const id_distrito = document.getElementById('editDistrito').value;
        const contrasena = document.getElementById('editContrasena').value.trim();

        try {
            if (userId) {
                // Actualizar usuario existente
                const nuevo_estado = 1; // Valor predeterminado para mantener el estado actual
                await axios.put(`${API_URL}/${userId}`, {
                    nombre,
                    apellidos,
                    cedula,
                    telefono,
                    correo,
                    fecha_nacimiento,
                    id_rol,
                    id_nacionalidad,
                    id_pais,
                    id_provincia,
                    id_canton,
                    id_distrito,
                    contrasena,
                    nuevo_estado
                });

                // Después de actualizar, asegúrate de resetear el ID oculto
                document.getElementById('userId').value = '';
            } else {
                // Crear un nuevo usuario
                await axios.post(API_URL, {
                    nombre,
                    apellidos,
                    cedula,
                    telefono,
                    correo,
                    fecha_nacimiento,
                    id_rol,
                    id_nacionalidad,
                    id_pais,
                    id_provincia,
                    id_canton,
                    id_distrito,
                    contrasena,
                    id_estado: 1, // Por defecto, nuevo usuario está en estado "Activo"
                    creado_por: 'PRUEBAS', // Usuario fijo para pruebas
                    accion: 'INSERT',
                });
            }

            // Resetear el formulario y cerrar el modal
            addUserForm.reset();
            new bootstrap.Modal(document.getElementById('addUserModal')).hide();

            // Recargar la lista de usuarios
            loadUsers();
        } catch (err) {
            console.error('Error al guardar el usuario:', err.response ? err.response.data : err);
        }
    });
} else {
    console.error('No se encontró el formulario de agregar/editar usuario.');
}

// Editar usuario
const editUser = (id_usuario, nombre, apellidos, cedula, telefono, correo, fecha_nacimiento, id_rol, id_nacionalidad, id_pais, id_provincia, id_canton, id_distrito, contrasena) => {
    document.getElementById('userId').value = id_usuario; // Campo oculto para ID
    document.getElementById('editNombre').value = nombre; // Campo de nombre
    document.getElementById('editApellidos').value = apellidos; // Campo de apellidos
    document.getElementById('editCedula').value = cedula; // Campo de cédula
    document.getElementById('editTelefono').value = telefono; // Campo de teléfono
    document.getElementById('editCorreo').value = correo; // Campo de correo
    document.getElementById('editFechaNacimiento').value = fecha_nacimiento; // Campo de fecha de nacimiento
    document.getElementById('editRol').value = id_rol; // Campo de rol
    document.getElementById('editNacionalidad').value = id_nacionalidad; // Campo de nacionalidad
    document.getElementById('editPais').value = id_pais; // Campo de país
    document.getElementById('editProvincia').value = id_provincia; // Campo de provincia
    document.getElementById('editCanton').value = id_canton; // Campo de cantón
    document.getElementById('editDistrito').value = id_distrito; // Campo de distrito
    document.getElementById('editContrasena').value = contrasena; // Campo de contraseña

    // Mostrar el modal de edición
    new bootstrap.Modal(document.getElementById('addUserModal')).show();
};

// Cambiar el estado
const toggleState = async (id_usuario, estado_actual, nombre, apellidos, cedula, telefono, correo, fecha_nacimiento, id_rol, id_nacionalidad, id_pais, id_provincia, id_canton, id_distrito, contrasena) => {
    try {
        // Determinar el nuevo estado (1 = Activo, 2 = Inactivo)
        const nuevo_estado = estado_actual === 'Activo' ? 2 : 1;

        console.log(`Cambiando estado de usuario ${id_usuario} a ${nuevo_estado}`);

        // Realizar la solicitud PUT al servidor con la URL correcta
        const response = await axios.put(`${API_URL}/${id_usuario}`, {
            nombre,
            apellidos,
            cedula,
            telefono,
            correo,
            fecha_nacimiento: fecha_nacimiento.split('T')[0], // Formatear la fecha antes de enviarla
            id_rol,
            id_nacionalidad,
            id_pais,
            id_provincia,
            id_canton,
            id_distrito,
            contrasena,
            nuevo_estado
        });

        console.log(`Estado actualizado correctamente: ${response.data}`);

        // Recargar la lista de usuarios
        loadUsers();
    } catch (err) {
        console.error('Error al cambiar el estado del usuario:', err.response ? err.response.data : err);
    }
};

// Inicializar carga de usuarios
document.addEventListener('DOMContentLoaded', loadUsers);


