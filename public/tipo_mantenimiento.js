const API_URL = 'http://localhost:3000/tipo_mantenimiento';

// Cargar tipos de mantenimiento al iniciar
const loadMaintenanceTypes = async () => {
    const tableBody = document.getElementById('maintenanceTypeTableBody');
    if (!tableBody) {
        console.error("No se encontró el cuerpo de la tabla de tipos de mantenimiento.");
        return;
    }
    tableBody.innerHTML = ''; // Limpiar la tabla antes de agregar nuevas filas

    try {
        const response = await axios.get(API_URL);
        console.log('Respuesta recibida:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(maintenanceType => {
                const [
                    id_tipo_mantenimiento,
                    tipo_mantenimiento,
                    nombre_estado,
                    creado_por,
                    fecha_creacion,
                    modificado_por,
                    fecha_modificacion,
                    accion
                ] = maintenanceType;

                const row = document.createElement('tr');
                row.innerHTML = `
                    
                    <td>${tipo_mantenimiento}</td>
                    <td>${nombre_estado}</td>
                    <td>${creado_por}</td>
                    <td>${fecha_creacion}</td>
                    <td>${modificado_por}</td>
                    <td>${fecha_modificacion}</td>
                    <td>${accion}</td>
                    <td>
                        <button class="btn btn-success btn-sm" onclick="toggleState(${id_tipo_mantenimiento}, '${nombre_estado}')">
                            ${nombre_estado === 'Activo' ? 'Desactivar' : 'Activar'}
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="editMaintenanceType(${id_tipo_mantenimiento}, '${tipo_mantenimiento}')">Editar</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar los tipos de mantenimiento:', err);
    }
};

// Manejar formulario de agregar/editar tipo de mantenimiento
const addMaintenanceTypeForm = document.getElementById('addMaintenanceTypeForm');
if (addMaintenanceTypeForm) {
    addMaintenanceTypeForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const maintenanceTypeId = document.getElementById('maintenanceTypeId').value;
        const tipo_mantenimiento = document.getElementById('editTipoMantenimiento').value;

        try {
            if (maintenanceTypeId) {
                // Actualizar tipo de mantenimiento existente
                await axios.put(`${API_URL}/${maintenanceTypeId}`, {
                    tipo_mantenimiento
                });

                // Después de actualizar, asegúrate de resetear el ID oculto
                document.getElementById('maintenanceTypeId').value = '';
            } else {
                // Crear un nuevo tipo de mantenimiento
                await axios.post(API_URL, {
                    tipo_mantenimiento,
                    creado_por: 'PRUEBAS', // Usuario fijo para pruebas
                    accion: 'INSERT',
                });
            }

            // Resetear el formulario y cerrar el modal
            addMaintenanceTypeForm.reset();
            new bootstrap.Modal(document.getElementById('addMaintenanceTypeModal')).hide();

            // Recargar la lista de tipos de mantenimiento
            loadMaintenanceTypes();
        } catch (err) {
            console.error('Error al guardar el tipo de mantenimiento:', err.response ? err.response.data : err);
        }
    });
} else {
    console.error('No se encontró el formulario de agregar/editar tipo de mantenimiento.');
}

// Editar tipo de mantenimiento
const editMaintenanceType = (id_tipo_mantenimiento, tipo_mantenimiento) => {
    document.getElementById('maintenanceTypeId').value = id_tipo_mantenimiento; // Campo oculto para ID
    document.getElementById('editTipoMantenimiento').value = tipo_mantenimiento; // Campo de tipo de mantenimiento

    // Mostrar el modal de edición
    new bootstrap.Modal(document.getElementById('addMaintenanceTypeModal')).show();
};

// Activar/Desactivar estado del tipo de mantenimiento
const toggleState = async (id_tipo_mantenimiento, currentState) => {
    const newState = currentState === 'Activo' ? 'Inactivo' : 'Activo';

    try {
        await axios.put(`${API_URL}/toggleState/${id_tipo_mantenimiento}`, { newState });
        loadMaintenanceTypes(); // Recargar la lista de tipos de mantenimiento
    } catch (err) {
        console.error('Error al cambiar el estado del tipo de mantenimiento:', err.response ? err.response.data : err);
    }
};

// Inicializar carga de tipos de mantenimiento al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    loadMaintenanceTypes();
});
