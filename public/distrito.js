const API_URL = 'http://localhost:3000/distrito';

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

// Agregar evento para cargar los cantones cuando se muestra el modal de agregar/editar distritos
document.getElementById('addDistrictModal').addEventListener('show.bs.modal', loadCantonsForSelect);

// Cargar distritos al iniciar
const loadDistricts = async () => {
    const tableBody = document.getElementById('districtTableBody');
    if (!tableBody) {
        console.error("No se encontró el cuerpo de la tabla de distritos.");
        return;
    }
    tableBody.innerHTML = ''; // Limpiar la tabla antes de agregar nuevas filas

    try {
        const response = await axios.get(API_URL);
        console.log('Respuesta recibida:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(district => {
                // Asegúrate de incluir id_canton en el array destructuring
                const [id_distrito, nombre_distrito, nombre_canton, nombre_estado, creado_por, fecha_creacion, modificado_por, fecha_modificacion, accion, id_canton] = district;

                console.log(`ID Cantón recibido: ${id_canton}`); // Log para verificar id_canton

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${nombre_distrito}</td>
                    <td>${nombre_canton}</td>
                    <td>${nombre_estado}</td>
                    <td>${creado_por}</td>
                    <td>${fecha_creacion}</td>
                    <td>${modificado_por}</td>
                    <td>${fecha_modificacion}</td>
                    <td>${accion}</td>
                    <td>
                        <button class="btn btn-success btn-sm" onclick="toggleState(${id_distrito}, '${nombre_estado}', '${nombre_distrito}', ${id_canton})">
                            ${nombre_estado === 'Activo' ? 'Desactivar' : 'Activar'}
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="editDistrict(${id_distrito}, '${nombre_distrito}', ${id_canton})"> Editar </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar los distritos:', err);
    }
};


// Manejar formulario de agregar/editar distrito
const addDistrictForm = document.getElementById('addDistrictForm');
if (addDistrictForm) {
    addDistrictForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const districtId = document.getElementById('districtId').value;
        const nombre_distrito = document.getElementById('editNombre').value.trim();
        const id_canton = document.getElementById('editCanton').value;

        try {
            if (districtId) {
                // Actualizar distrito existente
                const nuevo_estado = 1; // Valor predeterminado para mantener el estado actual
                await axios.put(`${API_URL}/${districtId}`, { nombre_distrito, id_canton, nuevo_estado });

                // Después de actualizar, asegúrate de resetear el ID oculto
                document.getElementById('districtId').value = '';
            } else {
                // Crear un nuevo distrito
                await axios.post(API_URL, {
                    nombre_distrito,
                    id_canton,
                    id_estado: 1, // Por defecto, nuevo distrito está en estado "Activo"
                    creado_por: 'PRUEBAS', // Usuario fijo para pruebas
                    accion: 'INSERT',
                });
            }

            // Resetear el formulario y cerrar el modal
            addDistrictForm.reset();
            new bootstrap.Modal(document.getElementById('addDistrictModal')).hide();

            // Recargar la lista de distritos
            loadDistricts();
        } catch (err) {
            console.error('Error al guardar el distrito:', err.response ? err.response.data : err);
        }
    });
} else {
    console.error('No se encontró el formulario de agregar/editar distrito.');
}



// Editar distrito
const editDistrict = (id_distrito, nombre_distrito, id_canton) => {
    document.getElementById('districtId').value = id_distrito; // Campo oculto para ID
    document.getElementById('editNombre').value = nombre_distrito; // Campo de nombre
    loadCantonsForSelect().then(() => {
        document.getElementById('editCanton').value = id_canton; // Campo de cantón
    });

    // Mostrar el modal de edición
    new bootstrap.Modal(document.getElementById('addDistrictModal')).show();
};



// Cambiar el estado
const toggleState = async (id_distrito, estado_actual, nombre_distrito, id_canton) => {
    try {
        // Determinar el nuevo estado (1 = Activo, 2 = Inactivo)
        const nuevo_estado = estado_actual === 'Activo' ? 2 : 1;

        console.log(`Cambiando estado de distrito ${id_distrito} a ${nuevo_estado} con id_canton ${id_canton}`);

        // Realizar la solicitud PUT al servidor con la URL correcta
        const response = await axios.put(`${API_URL}/${id_distrito}`, {
            nombre_distrito,
            id_canton,  // Incluye id_canton en la solicitud
            nuevo_estado,
        });

        console.log(`Estado actualizado correctamente: ${response.data}`);

        // Recargar la lista de distritos
        loadDistricts();
    } catch (err) {
        console.error('Error al cambiar el estado del distrito:', err.response ? err.response.data : err);
    }
};






// Inicializar carga de distritos
document.addEventListener('DOMContentLoaded', () => {
    loadCantonsForSelect(); // Cargar las opciones de cantones al cargar la página
    loadDistricts(); // Cargar los distritos
});
