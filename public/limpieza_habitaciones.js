const API_URL = 'http://localhost:3000/limpieza_habitaciones';

// Cargar limpiezas al iniciar
const loadCleanings = async () => {
    const tableBody = document.getElementById('cleaningTableBody');
    if (!tableBody) {
        console.error("No se encontró el cuerpo de la tabla de limpiezas.");
        return;
    }
    tableBody.innerHTML = ''; // Limpiar la tabla antes de agregar nuevas filas

    try {
        const response = await axios.get(API_URL);
        console.log('Respuesta recibida:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(cleaning => {
                const { id_limpieza, nombre_habitacion, nombre_usuario, fecha_limpieza, comentarios, nombre_estado, creado_por, fecha_creacion, modificado_por, fecha_modificacion, accion } = cleaning;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${nombre_habitacion}</td>
                    <td>${nombre_usuario}</td>
                    <td>${fecha_limpieza}</td>
                    <td>${comentarios}</td>
                    <td>${nombre_estado}</td>
                    <td>${creado_por}</td>
                    <td>${fecha_creacion}</td>
                    <td>${modificado_por}</td>
                    <td>${fecha_modificacion}</td>
                    <td>${accion}</td>
                    <td>
                        <button class="btn btn-success btn-sm" onclick="toggleState(${id_limpieza}, '${nombre_estado}')">
                            ${nombre_estado === 'Activo' ? 'Desactivar' : 'Activar'}
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="editCleaning(${id_limpieza}, '${nombre_habitacion}', '${nombre_usuario}', '${fecha_limpieza}', '${comentarios}', '${nombre_estado}')">Editar</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar las limpiezas:', err);
    }
};


// Cargar habitaciones para el campo de selección
const loadRoomsForSelect = async () => {
    const roomSelect = document.getElementById('editHabitacion');
    if (!roomSelect) {
        console.error("No se encontró el campo de selección de habitaciones.");
        return;
    }

    // Limpiar las opciones existentes
    roomSelect.innerHTML = '';

    try {
        const response = await axios.get('http://localhost:3000/habitaciones');
        console.log('Habitaciones recibidas:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(room => {
                const [id_habitacion, nombre_hotel, nombre_moneda, numero_habitacion] = room;
                const option = document.createElement('option');
                option.value = id_habitacion;
                option.text = `Habitación ${numero_habitacion} (${nombre_hotel})`; // Mostrar número de habitación y nombre de hotel
                roomSelect.appendChild(option);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar las habitaciones:', err);
    }
};



// Cargar usuarios para el campo de selección
const loadUsersForSelect = async () => {
    const userSelect = document.getElementById('editUsuario');
    if (!userSelect) {
        console.error("No se encontró el campo de selección de usuarios.");
        return;
    }

    // Limpiar las opciones existentes
    userSelect.innerHTML = '';

    try {
        const response = await axios.get('http://localhost:3000/usuarios');
        console.log('Usuarios recibidos:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(user => {
                const [id_usuario, nombre_usuario] = user;
                const option = document.createElement('option');
                option.value = id_usuario;
                option.text = nombre_usuario;
                userSelect.appendChild(option);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar los usuarios:', err);
    }
};

// Agregar eventos para cargar las habitaciones y usuarios cuando se muestra el modal de agregar/editar limpiezas
document.getElementById('addCleaningModal').addEventListener('show.bs.modal', () => {
    loadRoomsForSelect();
    loadUsersForSelect();
});

// Manejar formulario de agregar/editar limpieza
const addCleaningForm = document.getElementById('addCleaningForm');
if (addCleaningForm) {
    addCleaningForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const cleaningId = document.getElementById('cleaningId').value;
        const id_habitacion = document.getElementById('editHabitacion').value;
        const id_usuario = document.getElementById('editUsuario').value;
        const fecha_limpieza = document.getElementById('editFechaLimpieza').value;
        const comentarios = document.getElementById('editComentarios').value.trim();

        try {
            if (cleaningId) {
                // Actualizar limpieza existente
                await axios.put(`${API_URL}/${cleaningId}`, {
                    id_habitacion,
                    id_usuario,
                    fecha_limpieza,
                    comentarios
                });

                // Después de actualizar, asegúrate de resetear el ID oculto
                document.getElementById('cleaningId').value = '';
            } else {
                // Crear una nueva limpieza
                await axios.post(API_URL, {
                    id_habitacion,
                    id_usuario,
                    fecha_limpieza,
                    comentarios,
                    creado_por: 'PRUEBAS', // Usuario fijo para pruebas
                    accion: 'INSERT',
                });
            }

            // Resetear el formulario y cerrar el modal
            addCleaningForm.reset();
            new bootstrap.Modal(document.getElementById('addCleaningModal')).hide();

            // Recargar la lista de limpiezas
            loadCleanings();
        } catch (err) {
            console.error('Error al guardar la limpieza:', err.response ? err.response.data : err);
        }
    });
} else {
    console.error('No se encontró el formulario de agregar/editar limpieza.');
}

// Editar limpieza
const editCleaning = (id_limpieza, id_habitacion, id_usuario, fecha_limpieza, comentarios) => {
    document.getElementById('cleaningId').value = id_limpieza; // Campo oculto para ID
    document.getElementById('editHabitacion').value = id_habitacion; // Campo de habitación
    document.getElementById('editUsuario').value = id_usuario; // Campo de usuario
    document.getElementById('editFechaLimpieza').value = fecha_limpieza; // Campo de fecha de limpieza
    document.getElementById('editComentarios').value = comentarios; // Campo de comentarios

    // Mostrar el modal de edición
    new bootstrap.Modal(document.getElementById('addCleaningModal')).show();
};



// Activar/Desactivar estado de la limpieza
const toggleState = async (id_limpieza, currentState) => {
    const newState = currentState === 'Activo' ? 'Inactivo' : 'Activo';

    try {
        await axios.put(`${API_URL}/toggleState/${id_limpieza}`, { newState });
        loadCleanings(); // Recargar la lista de limpiezas
    } catch (err) {
        console.error('Error al cambiar el estado de la limpieza:', err.response ? err.response.data : err);
    }
};

// Inicializar carga de limpiezas
document.addEventListener('DOMContentLoaded', loadCleanings);

