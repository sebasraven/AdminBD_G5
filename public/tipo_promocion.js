const API_URL = 'http://localhost:3000/tipo_promocion';

// Cargar tipos de promoción al iniciar
const loadPromoTypes = async () => {
    const tableBody = document.getElementById('promoTypeTableBody');
    if (!tableBody) {
        console.error("No se encontró el cuerpo de la tabla de tipos de promoción.");
        return;
    }
    tableBody.innerHTML = ''; // Limpiar la tabla antes de agregar nuevas filas

    try {
        const response = await axios.get(API_URL);
        console.log('Respuesta recibida:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(promoType => {
                const [
                    id_tipo_promocion, 
                    nombre, 
                    descripcion, 
                    nombre_estado, 
                    creado_por, 
                    fecha_creacion, 
                    modificado_por, 
                    fecha_modificacion, 
                    accion
                ] = promoType;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${nombre}</td>
                    <td>${descripcion}</td>
                    <td>${nombre_estado}</td>
                    <td>${creado_por}</td>
                    <td>${fecha_creacion}</td>
                    <td>${modificado_por}</td>
                    <td>${fecha_modificacion}</td>
                    <td>${accion}</td>
                    <td>
                        <button class="btn btn-success btn-sm" onclick="toggleState(${id_tipo_promocion}, '${nombre_estado}')">
                            ${nombre_estado === 'Activo' ? 'Desactivar' : 'Activar'}
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="editPromoType(${id_tipo_promocion}, '${nombre}', '${descripcion}')">Editar</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar los tipos de promoción:', err);
    }
};


// Manejar formulario de agregar/editar tipo de promoción
const addPromoTypeForm = document.getElementById('addPromoTypeForm');
if (addPromoTypeForm) {
    addPromoTypeForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const promoTypeId = document.getElementById('promoTypeId').value;
        const nombre = document.getElementById('editNombre').value.trim();
        const descripcion = document.getElementById('editDescripcion').value.trim();

        try {
            if (promoTypeId) {
                // Actualizar tipo de promoción existente
                await axios.put(`${API_URL}/${promoTypeId}`, {
                    nombre,
                    descripcion
                });

                // Después de actualizar, asegúrate de resetear el ID oculto
                document.getElementById('promoTypeId').value = '';
            } else {
                // Crear un nuevo tipo de promoción
                await axios.post(API_URL, {
                    nombre,
                    descripcion,
                    creado_por: 'PRUEBAS', // Usuario fijo para pruebas
                    accion: 'INSERT',
                });
            }

            // Resetear el formulario y cerrar el modal
            addPromoTypeForm.reset();
            new bootstrap.Modal(document.getElementById('addPromoTypeModal')).hide();

            // Recargar la lista de tipos de promoción
            loadPromoTypes();
        } catch (err) {
            console.error('Error al guardar el tipo de promoción:', err.response ? err.response.data : err);
        }
    });
} else {
    console.error('No se encontró el formulario de agregar/editar tipo de promoción.');
}

// Editar tipo de promoción
const editPromoType = (id_tipo_promocion, nombre, descripcion) => {
    document.getElementById('promoTypeId').value = id_tipo_promocion; // Campo oculto para ID
    document.getElementById('editNombre').value = nombre; // Campo de nombre
    document.getElementById('editDescripcion').value = descripcion; // Campo de descripción

    // Mostrar el modal de edición
    new bootstrap.Modal(document.getElementById('addPromoTypeModal')).show();
};

// Activar/Desactivar estado del tipo de promoción
const toggleState = async (id_tipo_promocion, currentState) => {
    const newState = currentState === 'Activo' ? 'Inactivo' : 'Activo';

    try {
        await axios.put(`${API_URL}/toggleState/${id_tipo_promocion}`, { newState });
        loadPromoTypes(); // Recargar la lista de tipos de promoción
    } catch (err) {
        console.error('Error al cambiar el estado del tipo de promoción:', err.response ? err.response.data : err);
    }
};

// Inicializar carga de tipos de promoción
document.addEventListener('DOMContentLoaded', loadPromoTypes);
