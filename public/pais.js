const API_URL = 'http://localhost:3000/pais';

// Cargar paises al iniciar
const loadCountries = async () => {
    const tableBody = document.getElementById('countryTableBody');
    if (!tableBody) {
        console.error("No se encontró el cuerpo de la tabla de paises.");
        return;
    }
    tableBody.innerHTML = ''; // Limpiar la tabla antes de agregar nuevas filas

    try {
        const response = await axios.get('http://localhost:3000/pais');
        console.log('Respuesta recibida:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(country => {
                const [id_pais, nombre_pais, estado_nombre, creado_por, fecha_creacion, modificado_por, fecha_modificacion, accion] = country;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${nombre_pais}</td>
                    <td>${estado_nombre}</td>
                    <td>${creado_por}</td>
                    <td>${fecha_creacion}</td>
                    <td>${modificado_por}</td>
                    <td>${fecha_modificacion}</td>
                    <td>${accion}</td>
                    <td>
                        <button class="btn btn-success btn-sm" onclick="toggleState(${id_pais}, '${estado_nombre}', '${nombre_pais}')">
                            ${estado_nombre === 'Activo' ? 'Desactivar' : 'Activar'}
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="editCountry(${id_pais}, '${nombre_pais}')"> Editar </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar los paises:', err);
    }
};

// Manejar formulario de agregar/editar pais
const addCountryForm = document.getElementById('addCountryForm');
if (addCountryForm) {
    addCountryForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const countryId = document.getElementById('countryId').value;
        const nombre_pais = document.getElementById('editNombre').value.trim();

        try {
            if (countryId) {
                // Actualizar pais existente
                const nuevo_estado = 1; // Valor predeterminado para mantener el estado actual
                await axios.put(`${API_URL}/${countryId}`, { nombre_pais, nuevo_estado });

                // Después de actualizar, asegúrate de resetear el ID oculto
                document.getElementById('countryId').value = '';
            } else {
                // Crear una nueva pais
                await axios.post(API_URL, {
                    nombre_pais,
                    id_estado: 1, // Por defecto, nueva pais está en estado "Activo"
                    creado_por: 'PRUEBAS', // Usuario fijo para pruebas
                    accion: 'INSERT',
                });
            }

            // Resetear el formulario y cerrar el modal
            addCountryForm.reset();
            new bootstrap.Modal(document.getElementById('addCountryModal')).hide();

            // Recargar la lista de paises
            loadCountries();
        } catch (err) {
            console.error('Error al guardar el pais:', err.response ? err.response.data : err);
        }
    });
} else {
    console.error('No se encontró el formulario de agregar/editar pais.');
}


// Editar pais
const editCountry = (id_pais, nombre_pais) => {
    document.getElementById('countryId').value = id_pais; // Campo oculto para ID
    document.getElementById('editNombre').value = nombre_pais; // Campo de descripción

    // Mostrar el modal de edición
    new bootstrap.Modal(document.getElementById('addCountryModal')).show();
};


// Cambiar el estado
const toggleState = async (id_pais, estado_actual, nombre_pais) => {
    try {
        // Determinar el nuevo estado (1 = Activo, 2 = Inactivo)
        const nuevo_estado = estado_actual === 'Activo' ? 2 : 1;

        console.log(`Cambiando estado de pais ${id_pais} a ${nuevo_estado}`);

        // Realizar la solicitud PUT al servidor con la URL correcta
        const response = await axios.put(`${API_URL}/${id_pais}`, {
            nombre_pais,
            nuevo_estado,
        });

        console.log(`Estado actualizado correctamente: ${response.data}`);

        // Recargar la lista de paises
        loadCountries();
    } catch (err) {
        console.error('Error al cambiar el estado del pais:', err.response ? err.response.data : err);
    }
};









// Inicializar carga de estados
document.addEventListener('DOMContentLoaded', loadCountries);