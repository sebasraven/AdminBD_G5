const API_URL = 'http://localhost:3000/provincia';

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
        console.log('Paises recibidos:', response.data);

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

// Agregar evento para cargar los países cuando se muestra el modal de agregar/editar provincias
document.getElementById('addProvinceModal').addEventListener('show.bs.modal', loadCountriesForSelect);

// Cargar provincias al iniciar
const loadProvinces = async () => {
    const tableBody = document.getElementById('provinceTableBody');
    if (!tableBody) {
        console.error("No se encontró el cuerpo de la tabla de provincias.");
        return;
    }
    tableBody.innerHTML = ''; // Limpiar la tabla antes de agregar nuevas filas

    try {
        const response = await axios.get(API_URL);
        console.log('Respuesta recibida:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(province => {
                const [id_provincia, nombre_provincia, nombre_pais, nombre_estado, creado_por, fecha_creacion, modificado_por, fecha_modificacion, accion] = province;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${nombre_provincia}</td>
                    <td>${nombre_pais}</td>
                    <td>${nombre_estado}</td>
                    <td>${creado_por}</td>
                    <td>${fecha_creacion}</td>
                    <td>${modificado_por}</td>
                    <td>${fecha_modificacion}</td>
                    <td>${accion}</td>
                    <td>
                        <button class="btn btn-success btn-sm" onclick="toggleState(${id_provincia}, '${nombre_estado}', '${nombre_provincia}')">
                            ${nombre_estado === 'Activo' ? 'Desactivar' : 'Activar'}
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="editProvince(${id_provincia}, '${nombre_provincia}', '${nombre_pais}')"> Editar </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar las provincias:', err);
    }
};

// Manejar formulario de agregar/editar provincia
const addProvinceForm = document.getElementById('addProvinceForm');
if (addProvinceForm) {
    addProvinceForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const provinceId = document.getElementById('provinceId').value;
        const nombre_provincia = document.getElementById('editNombre').value.trim();
        const id_pais = document.getElementById('editPais').value;

        try {
            if (provinceId) {
                // Actualizar provincia existente
                const nuevo_estado = 1; // Valor predeterminado para mantener el estado actual
                await axios.put(`${API_URL}/${provinceId}`, { nombre_provincia, nuevo_estado });

                // Después de actualizar, asegúrate de resetear el ID oculto
                document.getElementById('provinceId').value = '';
            } else {
                // Crear una nueva provincia
                await axios.post(API_URL, {
                    nombre_provincia,
                    id_pais,
                    id_estado: 1, // Por defecto, nueva provincia está en estado "Activo"
                    creado_por: 'PRUEBAS', // Usuario fijo para pruebas
                    accion: 'INSERT',
                });
            }

            // Resetear el formulario y cerrar el modal
            addProvinceForm.reset();
            new bootstrap.Modal(document.getElementById('addProvinceModal')).hide();

            // Recargar la lista de provincias
            loadProvinces();
        } catch (err) {
            console.error('Error al guardar la provincia:', err.response ? err.response.data : err);
        }
    });
} else {
    console.error('No se encontró el formulario de agregar/editar provincia.');
}


// Editar provincia
const editProvince = (id_provincia, nombre_provincia, id_pais) => {
    document.getElementById('provinceId').value = id_provincia; // Campo oculto para ID
    document.getElementById('editNombre').value = nombre_provincia; // Campo de nombre
    loadCountriesForSelect().then(() => {
        document.getElementById('editPais').value = id_pais; // Campo de país
    });

    // Mostrar el modal de edición
    new bootstrap.Modal(document.getElementById('addProvinceModal')).show();
};


// Cambiar el estado
const toggleState = async (id_provincia, estado_actual, nombre_provincia) => {
    try {
        // Determinar el nuevo estado (1 = Activo, 2 = Inactivo)
        const nuevo_estado = estado_actual === 'Activo' ? 2 : 1;

        console.log(`Cambiando estado de provincia ${id_provincia} a ${nuevo_estado}`);

        // Realizar la solicitud PUT al servidor con la URL correcta
        const response = await axios.put(`${API_URL}/${id_provincia}`, {
            nombre_provincia,
            nuevo_estado,
        });

        console.log(`Estado actualizado correctamente: ${response.data}`);

        // Recargar la lista de provincias
        loadProvinces();
    } catch (err) {
        console.error('Error al cambiar el estado de la provincia:', err.response ? err.response.data : err);
    }
};


// Inicializar carga de provincias
document.addEventListener('DOMContentLoaded', () => {
    loadCountriesForSelect(); // Cargar las opciones de países al cargar la página
    loadProvinces(); // Cargar las provincias
});
