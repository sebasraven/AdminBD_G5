const API_URL = 'http://localhost:3000/nacionalidad';

// Cargar nacionalidades al iniciar
const loadNationalities = async () => {
    const tableBody = document.getElementById('nationalityTableBody');
    if (!tableBody) {
        console.error("No se encontró el cuerpo de la tabla de nacionalidades.");
        return;
    }
    tableBody.innerHTML = ''; // Limpiar la tabla antes de agregar nuevas filas

    try {
        const response = await axios.get('http://localhost:3000/nacionalidad');
        console.log('Respuesta recibida:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(nationality => {
                const [id_nacionalidad, descripcion, estado_nombre, creado_por, fecha_creacion, modificado_por, fecha_modificacion, accion] = nationality;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${descripcion}</td>
                    <td>${estado_nombre}</td>
                    <td>${creado_por}</td>
                    <td>${fecha_creacion}</td>
                    <td>${modificado_por}</td>
                    <td>${fecha_modificacion}</td>
                    <td>${accion}</td>
                    <td>
                        <button class="btn btn-success btn-sm" onclick="toggleState(${id_nacionalidad}, '${estado_nombre}', '${descripcion}')">
                            ${estado_nombre === 'Activo' ? 'Desactivar' : 'Activar'}
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="editNationality(${id_nacionalidad}, '${descripcion}')"> Editar </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar las nacionalidades:', err);
    }
};

// Manejar formulario de agregar/editar nacionalidad
const addNationalityForm = document.getElementById('addNationalityForm');
if (addNationalityForm) {
    addNationalityForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const nationalityId = document.getElementById('nationalityId').value;
        const descripcion = document.getElementById('editDescription').value.trim();

        try {
            if (nationalityId) {
                // Actualizar nacionalidad existente
                const nuevo_estado = 1; // Valor predeterminado para mantener el estado actual
                await axios.put(`${API_URL}/${nationalityId}`, { descripcion, nuevo_estado });

                // Después de actualizar, asegúrate de resetear el ID oculto
                document.getElementById('nationalityId').value = '';
            } else {
                // Crear una nueva nacionalidad
                await axios.post(API_URL, {
                    descripcion,
                    id_estado: 1, // Por defecto, nueva nacionalidad está en estado "Activo"
                    creado_por: 'PRUEBAS', // Usuario fijo para pruebas
                    accion: 'INSERT',
                });
            }

            // Resetear el formulario y cerrar el modal
            addNationalityForm.reset();
            new bootstrap.Modal(document.getElementById('addNationalityModal')).hide();

            // Recargar la lista de nacionalidades
            loadNationalities();
        } catch (err) {
            console.error('Error al guardar la nacionalidad:', err.response ? err.response.data : err);
        }
    });
} else {
    console.error('No se encontró el formulario de agregar/editar nacionalidad.');
}


// Editar nacionalidad
const editNationality = (id_nacionalidad, descripcion) => {
    document.getElementById('nationalityId').value = id_nacionalidad; // Campo oculto para ID
    document.getElementById('editDescription').value = descripcion; // Campo de descripción

    // Mostrar el modal de edición
    new bootstrap.Modal(document.getElementById('addNationalityModal')).show();
};


// Cambiar el estado
const toggleState = async (id_nacionalidad, estado_actual, descripcion) => {
    try {
        // Determinar el nuevo estado (1 = Activo, 2 = Inactivo)
        const nuevo_estado = estado_actual === 'Activo' ? 2 : 1;

        console.log(`Cambiando estado de nacionalidad ${id_nacionalidad} a ${nuevo_estado}`);

        // Realizar la solicitud PUT al servidor con la URL correcta
        const response = await axios.put(`${API_URL}/${id_nacionalidad}`, {
            descripcion,
            nuevo_estado,
        });

        console.log(`Estado actualizado correctamente: ${response.data}`);

        // Recargar la lista de nacionalidades
        loadNationalities();
    } catch (err) {
        console.error('Error al cambiar el estado de la nacionalidad:', err.response ? err.response.data : err);
    }
};



















// Inicializar carga de estados
document.addEventListener('DOMContentLoaded', loadNationalities);