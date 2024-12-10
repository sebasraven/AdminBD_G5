const API_URL = 'http://localhost:3000/roles';

// Cargar roles al iniciar
const loadRoles = async () => {
    const tableBody = document.getElementById('roleTableBody');
    if (!tableBody) {
        console.error("No se encontró el cuerpo de la tabla de roles.");
        return;
    }
    tableBody.innerHTML = ''; // Limpiar la tabla antes de agregar nuevas filas

    try {
        const response = await axios.get(API_URL);
        console.log('Respuesta recibida:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(role => {
                const [id_rol, nombre_rol, descripcion, nombre_estado, creado_por, fecha_creacion, modificado_por, fecha_modificacion, accion] = role;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${nombre_rol}</td>
                    <td>${descripcion}</td>
                    <td>${nombre_estado}</td>
                    <td>${creado_por}</td>
                    <td>${fecha_creacion}</td>
                    <td>${modificado_por}</td>
                    <td>${fecha_modificacion}</td>
                    <td>${accion}</td>
                    <td>
                        <button class="btn btn-success btn-sm" onclick="toggleState(${id_rol}, '${nombre_estado}', '${nombre_rol}', '${descripcion}')">
                            ${nombre_estado === 'Activo' ? 'Desactivar' : 'Activar'}
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="editRole(${id_rol}, '${nombre_rol}', '${descripcion}')"> Editar </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar los roles:', err);
    }
};


// Manejar formulario de agregar/editar rol
const addRoleForm = document.getElementById('addRoleForm');
if (addRoleForm) {
    addRoleForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const roleId = document.getElementById('roleId').value;
        const nombre_rol = document.getElementById('editNombre').value.trim();
        const descripcion = document.getElementById('editDescripcion').value.trim();

        try {
            if (roleId) {
                // Actualizar rol existente
                const nuevo_estado = 1; // Valor predeterminado para mantener el estado actual
                await axios.put(`${API_URL}/${roleId}`, { nombre_rol, descripcion, nuevo_estado });

                // Después de actualizar, asegúrate de resetear el ID oculto
                document.getElementById('roleId').value = '';
            } else {
                // Crear un nuevo rol
                await axios.post(API_URL, {
                    nombre_rol,
                    descripcion,
                    id_estado: 1, // Por defecto, nuevo rol está en estado "Activo"
                    creado_por: 'PRUEBAS', // Usuario fijo para pruebas
                    accion: 'INSERT',
                });
            }

            // Resetear el formulario y cerrar el modal
            addRoleForm.reset();
            new bootstrap.Modal(document.getElementById('addRoleModal')).hide();

            // Recargar la lista de roles
            loadRoles();
        } catch (err) {
            console.error('Error al guardar el rol:', err.response ? err.response.data : err);
        }
    });
} else {
    console.error('No se encontró el formulario de agregar/editar rol.');
}

// Editar rol
const editRole = (id_rol, nombre_rol, descripcion) => {
    document.getElementById('roleId').value = id_rol; // Campo oculto para ID
    document.getElementById('editNombre').value = nombre_rol; // Campo de nombre
    document.getElementById('editDescripcion').value = descripcion; // Campo de descripción

    // Mostrar el modal de edición
    new bootstrap.Modal(document.getElementById('addRoleModal')).show();
};

// Cambiar el estado
const toggleState = async (id_rol, estado_actual, nombre_rol, descripcion) => {
    try {
        // Determinar el nuevo estado (1 = Activo, 2 = Inactivo)
        const nuevo_estado = estado_actual === 'Activo' ? 2 : 1;

        console.log(`Cambiando estado de rol ${id_rol} a ${nuevo_estado}`);

        // Realizar la solicitud PUT al servidor con la URL correcta
        const response = await axios.put(`${API_URL}/${id_rol}`, {
            nombre_rol,
            descripcion,  // Incluye la descripción en la solicitud
            nuevo_estado,
        });

        console.log(`Estado actualizado correctamente: ${response.data}`);

        // Recargar la lista de roles
        loadRoles();
    } catch (err) {
        console.error('Error al cambiar el estado del rol:', err.response ? err.response.data : err);
    }
};


// Inicializar carga de roles
document.addEventListener('DOMContentLoaded', loadRoles);
