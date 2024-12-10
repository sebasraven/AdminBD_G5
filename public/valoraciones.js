const API_URL = 'http://localhost:3000/valoraciones';

// Cargar valoraciones al iniciar
const loadRatings = async () => {
    const tableBody = document.getElementById('ratingTableBody');
    if (!tableBody) {
        console.error("No se encontró el cuerpo de la tabla de valoraciones.");
        return;
    }
    tableBody.innerHTML = ''; // Limpiar la tabla antes de agregar nuevas filas

    try {
        const response = await axios.get(API_URL);
        console.log('Respuesta recibida:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(rating => {
                const { id_valoracion, comentario, valoracion, timestamp, nombre_estado, creado_por, fecha_creacion, modificado_por, fecha_modificacion, accion } = rating;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${comentario}</td>
                    <td>${valoracion}</td>
                    <td>${timestamp}</td>
                    <td>${nombre_estado}</td>
                    <td>${creado_por}</td>
                    <td>${fecha_creacion}</td>
                    <td>${modificado_por}</td>
                    <td>${fecha_modificacion}</td>
                    <td>${accion}</td>
                    <td>
                        <button class="btn btn-success btn-sm" onclick="toggleState(${id_valoracion}, '${nombre_estado}')">
                            ${nombre_estado === 'Activo' ? 'Desactivar' : 'Activar'}
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="editRating(${id_valoracion}, '${comentario}', '${valoracion}', '${timestamp}', '${nombre_estado}')">Editar</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar las valoraciones:', err);
    }
};

// Manejar formulario de agregar/editar valoración
const addRatingForm = document.getElementById('addRatingForm');
if (addRatingForm) {
    addRatingForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const ratingId = document.getElementById('ratingId').value;
        const comentario = document.getElementById('editComentario').value.trim();
        const valoracion = document.getElementById('editValoracion').value;
        const timestamp = document.getElementById('editTimestamp').value;

        try {
            if (ratingId) {
                // Actualizar valoración existente
                await axios.put(`${API_URL}/${ratingId}`, {
                    comentario,
                    valoracion,
                    timestamp
                });

                // Después de actualizar, asegúrate de resetear el ID oculto
                document.getElementById('ratingId').value = '';
            } else {
                // Crear una nueva valoración
                await axios.post(API_URL, {
                    comentario,
                    valoracion,
                    timestamp,
                    creado_por: 'PRUEBAS', // Usuario fijo para pruebas
                    accion: 'INSERT',
                });
            }

            // Resetear el formulario y cerrar el modal
            addRatingForm.reset();
            new bootstrap.Modal(document.getElementById('addRatingModal')).hide();

            // Recargar la lista de valoraciones
            loadRatings();
        } catch (err) {
            console.error('Error al guardar la valoración:', err.response ? err.response.data : err);
        }
    });
} else {
    console.error('No se encontró el formulario de agregar/editar valoración.');
}

// Editar valoración
const editRating = (id_valoracion, comentario, valoracion, timestamp) => {
    document.getElementById('ratingId').value = id_valoracion; // Campo oculto para ID
    document.getElementById('editComentario').value = comentario; // Campo de comentario
    document.getElementById('editValoracion').value = valoracion; // Campo de valoración
    document.getElementById('editTimestamp').value = timestamp; // Campo de timestamp

    // Mostrar el modal de edición
    new bootstrap.Modal(document.getElementById('addRatingModal')).show();
};

// Activar/Desactivar estado de la valoración
const toggleState = async (id_valoracion, currentState) => {
    const newState = currentState === 'Activo' ? 'Inactivo' : 'Activo';

    try {
        await axios.put(`${API_URL}/toggleState/${id_valoracion}`, { newState });
        loadRatings(); // Recargar la lista de valoraciones
    } catch (err) {
        console.error('Error al cambiar el estado de la valoración:', err.response ? err.response.data : err);
    }
};

// Inicializar carga de valoraciones
document.addEventListener('DOMContentLoaded', loadRatings);
