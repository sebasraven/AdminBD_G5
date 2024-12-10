const API_URL = 'http://localhost:3000/canton';

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

// Agregar evento para cargar las provincias cuando se muestra el modal de agregar/editar cantones
document.getElementById('addCantonModal').addEventListener('show.bs.modal', loadProvincesForSelect);

// Cargar cantones al iniciar
const loadCantons = async () => {
    const tableBody = document.getElementById('cantonTableBody');
    if (!tableBody) {
        console.error("No se encontró el cuerpo de la tabla de cantones.");
        return;
    }
    tableBody.innerHTML = ''; // Limpiar la tabla antes de agregar nuevas filas

    try {
        const response = await axios.get(API_URL);
        console.log('Respuesta recibida:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(canton => {
                const [id_canton, nombre_canton, nombre_provincia, nombre_estado, creado_por, fecha_creacion, modificado_por, fecha_modificacion, accion] = canton;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${nombre_canton}</td>
                    <td>${nombre_provincia}</td>
                    <td>${nombre_estado}</td>
                    <td>${creado_por}</td>
                    <td>${fecha_creacion}</td>
                    <td>${modificado_por}</td>
                    <td>${fecha_modificacion}</td>
                    <td>${accion}</td>
                    <td>
                        <button class="btn btn-success btn-sm" onclick="toggleState(${id_canton}, '${nombre_estado}', '${nombre_canton}')">
                            ${nombre_estado === 'Activo' ? 'Desactivar' : 'Activar'}
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="editCanton(${id_canton}, '${nombre_canton}', '${nombre_provincia}')"> Editar </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar los cantones:', err);
    }
};

// Manejar formulario de agregar/editar cantón
const addCantonForm = document.getElementById('addCantonForm');
if (addCantonForm) {
    addCantonForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const cantonId = document.getElementById('cantonId').value;
        const nombre_canton = document.getElementById('editNombre').value.trim();
        const id_provincia = document.getElementById('editProvincia').value;

        try {
            if (cantonId) {
                // Actualizar cantón existente
                const nuevo_estado = 1; // Valor predeterminado para mantener el estado actual
                await axios.put(`${API_URL}/${cantonId}`, { nombre_canton, nuevo_estado });

                // Después de actualizar, asegúrate de resetear el ID oculto
                document.getElementById('cantonId').value = '';
            } else {
                // Crear un nuevo cantón
                await axios.post(API_URL, {
                    nombre_canton,
                    id_provincia,
                    id_estado: 1, // Por defecto, nuevo cantón está en estado "Activo"
                    creado_por: 'PRUEBAS', // Usuario fijo para pruebas
                    accion: 'INSERT',
                });
            }

            // Resetear el formulario y cerrar el modal
            addCantonForm.reset();
            new bootstrap.Modal(document.getElementById('addCantonModal')).hide();

            // Recargar la lista de cantones
            loadCantons();
        } catch (err) {
            console.error('Error al guardar el cantón:', err.response ? err.response.data : err);
        }
    });
} else {
    console.error('No se encontró el formulario de agregar/editar cantón.');
}


// Editar cantón
const editCanton = (id_canton, nombre_canton, id_provincia) => {
    document.getElementById('cantonId').value = id_canton; // Campo oculto para ID
    document.getElementById('editNombre').value = nombre_canton; // Campo de nombre
    loadProvincesForSelect().then(() => {
        document.getElementById('editProvincia').value = id_provincia; // Campo de provincia
    });

    // Mostrar el modal de edición
    new bootstrap.Modal(document.getElementById('addCantonModal')).show();
};


// Cambiar el estado
const toggleState = async (id_canton, estado_actual, nombre_canton) => {
    try {
        // Determinar el nuevo estado (1 = Activo, 2 = Inactivo)
        const nuevo_estado = estado_actual === 'Activo' ? 2 : 1;

        console.log(`Cambiando estado de cantón ${id_canton} a ${nuevo_estado}`);

        // Realizar la solicitud PUT al servidor con la URL correcta
        const response = await axios.put(`${API_URL}/${id_canton}`, {
            nombre_canton,
            nuevo_estado,
        });

        console.log(`Estado actualizado correctamente: ${response.data}`);

        // Recargar la lista de cantones
        loadCantons();
    } catch (err) {
        console.error('Error al cambiar el estado del cantón:', err.response ? err.response.data : err);
    }
};


// Inicializar carga de cantones
document.addEventListener('DOMContentLoaded', () => {
    loadProvincesForSelect(); // Cargar las opciones de provincias al cargar la página
    loadCantons(); // Cargar los cantones
});
