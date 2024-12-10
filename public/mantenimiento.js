const API_URL = 'http://localhost:3000/mantenimientos';

// Cargar mantenimientos al iniciar
const loadMaintenances = async () => {
    const tableBody = document.getElementById('maintenanceTableBody');
    if (!tableBody) {
        console.error("No se encontró el cuerpo de la tabla de mantenimientos.");
        return;
    }
    tableBody.innerHTML = ''; // Limpiar la tabla antes de agregar nuevas filas

    try {
        const response = await axios.get(API_URL);
        console.log('Respuesta recibida:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(maintenance => {
                const [
                    id_mantenimiento,
                    habitacion_formateada,
                    tipo_mantenimiento,
                    fecha_mantenimiento,
                    nombre_estado,
                    creado_por,
                    fecha_creacion,
                    modificado_por,
                    fecha_modificacion,
                    accion
                ] = maintenance;

                const row = document.createElement('tr');
                row.innerHTML = `
                    
                    <td>${habitacion_formateada}</td>
                    <td>${tipo_mantenimiento}</td>
                    <td>${fecha_mantenimiento}</td>
                    <td>${nombre_estado}</td>
                    <td>${creado_por}</td>
                    <td>${fecha_creacion}</td>
                    <td>${modificado_por}</td>
                    <td>${fecha_modificacion}</td>
                    <td>${accion}</td>
                    <td>
                        <button class="btn btn-success btn-sm" onclick="toggleState(${id_mantenimiento}, '${nombre_estado}')">
                            ${nombre_estado === 'Activo' ? 'Desactivar' : 'Activar'}
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="editMaintenance(${id_mantenimiento}, '${habitacion_formateada}', '${tipo_mantenimiento}', '${fecha_mantenimiento}')">Editar</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar los mantenimientos:', err);
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
                const id_habitacion = room[0]; // Asegúrate de usar el índice correcto si los datos vienen en forma de array
                const nombre_hotel = room[1]; // Asegúrate de usar el índice correcto para el nombre del hotel
                const numero_habitacion = room[3]; // Asegúrate de usar el índice correcto para el número de la habitación
                const option = document.createElement('option');
                option.value = id_habitacion;
                option.text = `${nombre_hotel}, Habitación ${numero_habitacion}`;
                roomSelect.appendChild(option);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar las habitaciones:', err);
    }

    // Verificar el contenido del campo después de cargar las opciones
    console.log('Contenido del campo de selección de habitaciones:', roomSelect.innerHTML);
};



// Cargar tipos de mantenimiento para el campo de selección
const loadMaintenanceTypesForSelect = async () => {
    const maintenanceTypeSelect = document.getElementById('editTipoMantenimiento');
    if (!maintenanceTypeSelect) {
        console.error("No se encontró el campo de selección de tipos de mantenimiento.");
        return;
    }

    // Limpiar las opciones existentes
    maintenanceTypeSelect.innerHTML = '';

    try {
        const response = await axios.get('http://localhost:3000/tipo_mantenimiento');
        console.log('Tipos de mantenimiento recibidos:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(type => {
                const id_tipo_mantenimiento = type[0]; // Asegúrate de usar el índice correcto si los datos vienen en forma de array
                const tipo_mantenimiento = type[1]; // Asegúrate de usar el índice correcto para el nombre del tipo de mantenimiento
                const option = document.createElement('option');
                option.value = id_tipo_mantenimiento;
                option.text = tipo_mantenimiento;
                maintenanceTypeSelect.appendChild(option);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar los tipos de mantenimiento:', err);
    }

    // Verificar el contenido del campo después de cargar las opciones
    console.log('Contenido del campo de selección de tipos de mantenimiento:', maintenanceTypeSelect.innerHTML);
};


// Manejar formulario de agregar/editar mantenimiento
const addMaintenanceForm = document.getElementById('addMaintenanceForm');
if (addMaintenanceForm) {
    addMaintenanceForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const maintenanceId = document.getElementById('maintenanceId').value;
        const id_habitacion = document.getElementById('editHabitacion').value;
        const id_tipo_mantenimiento = document.getElementById('editTipoMantenimiento').value;
        const fecha_mantenimiento = document.getElementById('editFechaMantenimiento').value;

        try {
            if (maintenanceId) {
                // Actualizar mantenimiento existente
                await axios.put(`${API_URL}/${maintenanceId}`, {
                    id_habitacion,
                    id_tipo_mantenimiento,
                    fecha_mantenimiento
                });

                // Después de actualizar, asegúrate de resetear el ID oculto
                document.getElementById('maintenanceId').value = '';
            } else {
                // Crear un nuevo mantenimiento
                await axios.post(API_URL, {
                    id_habitacion,
                    id_tipo_mantenimiento,
                    fecha_mantenimiento,
                    creado_por: 'PRUEBAS', // Usuario fijo para pruebas
                    accion: 'INSERT',
                });
            }

            // Resetear el formulario y cerrar el modal
            addMaintenanceForm.reset();
            new bootstrap.Modal(document.getElementById('addMaintenanceModal')).hide();

            // Recargar la lista de mantenimientos
            loadMaintenances();
        } catch (err) {
            console.error('Error al guardar el mantenimiento:', err.response ? err.response.data : err);
        }
    });
} else {
    console.error('No se encontró el formulario de agregar/editar mantenimiento.');
}

// Editar mantenimiento
const editMaintenance = (id_mantenimiento, habitacion_formateada, id_tipo_mantenimiento, fecha_mantenimiento) => {
    document.getElementById('maintenanceId').value = id_mantenimiento; // Campo oculto para ID
    document.getElementById('editHabitacion').value = habitacion_formateada; // Campo de habitación
    document.getElementById('editTipoMantenimiento').value = id_tipo_mantenimiento; // Campo de tipo de mantenimiento
    document.getElementById('editFechaMantenimiento').value = fecha_mantenimiento; // Campo de fecha de mantenimiento

    // Mostrar el modal de edición
    new bootstrap.Modal(document.getElementById('addMaintenanceModal')).show();
};

// Activar/Desactivar estado del mantenimiento
const toggleState = async (id_mantenimiento, currentState) => {
    const newState = currentState === 'Activo' ? 'Inactivo' : 'Activo';

    try {
        await axios.put(`${API_URL}/toggleState/${id_mantenimiento}`, { newState });
        loadMaintenances(); // Recargar la lista de mantenimientos
    } catch (err) {
        console.error('Error al cambiar el estado del mantenimiento:', err.response ? err.response.data : err);
    }
};

// Inicializar carga de mantenimientos y los campos de selección relacionados
document.addEventListener('DOMContentLoaded', () => {
    loadMaintenances();
    loadRoomsForSelect();
    loadMaintenanceTypesForSelect();
});

