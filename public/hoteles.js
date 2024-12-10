const API_URL = 'http://localhost:3000/hoteles';

// Cargar hoteles al iniciar
const loadHotels = async () => {
    const tableBody = document.getElementById('hotelTableBody');
    if (!tableBody) {
        console.error("No se encontró el cuerpo de la tabla de hoteles.");
        return;
    }
    tableBody.innerHTML = ''; // Limpiar la tabla antes de agregar nuevas filas

    try {
        const response = await axios.get(API_URL);
        console.log('Respuesta recibida:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(hotel => {
                const [id_hotel, nombre_hotel, telefono, nombre_pais, nombre_provincia, nombre_canton, nombre_distrito, nombre_estado, creado_por, fecha_creacion, modificado_por, fecha_modificacion, accion] = hotel;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${nombre_hotel}</td>
                    <td>${telefono}</td>
                    <td>${nombre_pais}</td>
                    <td>${nombre_provincia}</td>
                    <td>${nombre_canton}</td>
                    <td>${nombre_distrito}</td>
                    <td>${nombre_estado}</td>
                    <td>${creado_por}</td>
                    <td>${fecha_creacion}</td>
                    <td>${modificado_por}</td>
                    <td>${fecha_modificacion}</td>
                    <td>${accion}</td>
                    <td>
                        <button class="btn btn-success btn-sm" onclick="toggleState(${id_hotel}, '${nombre_estado}')">
                            ${nombre_estado === 'Activo' ? 'Desactivar' : 'Activar'}
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="editHotel(${id_hotel}, '${nombre_hotel}', '${telefono}', '${nombre_pais}', '${nombre_provincia}', '${nombre_canton}', '${nombre_distrito}', '${nombre_estado}')">Editar</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar los hoteles:', err);
    }
};

// Cargar países para el campo de selección
const loadPaisesForSelect = async () => {
    const paisSelect = document.getElementById('editPais');
    if (!paisSelect) {
        console.error("No se encontró el campo de selección de países.");
        return;
    }

    // Limpiar las opciones existentes
    paisSelect.innerHTML = '';

    try {
        const response = await axios.get('http://localhost:3000/pais');
        console.log('Países recibidos:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(pais => {
                const [id_pais, nombre_pais] = pais;
                const option = document.createElement('option');
                option.value = id_pais;
                option.text = nombre_pais;
                paisSelect.appendChild(option);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar los países:', err);
    }
};

// Cargar provincias para el campo de selección
const loadProvinciasForSelect = async () => {
    const provinciaSelect = document.getElementById('editProvincia');
    if (!provinciaSelect) {
        console.error("No se encontró el campo de selección de provincias.");
        return;
    }

    // Limpiar las opciones existentes
    provinciaSelect.innerHTML = '';

    try {
        const response = await axios.get('http://localhost:3000/provincia');
        console.log('Provincias recibidas:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(provincia => {
                const [id_provincia, nombre_provincia] = provincia;
                const option = document.createElement('option');
                option.value = id_provincia;
                option.text = nombre_provincia;
                provinciaSelect.appendChild(option);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar las provincias:', err);
    }
};

// Cargar cantones para el campo de selección
const loadCantonesForSelect = async () => {
    const cantonSelect = document.getElementById('editCanton');
    if (!cantonSelect) {
        console.error("No se encontró el campo de selección de cantones.");
        return;
    }

    // Limpiar las opciones existentes
    cantonSelect.innerHTML = '';

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

// Cargar distritos para el campo de selección
const loadDistritosForSelect = async () => {
    const distritoSelect = document.getElementById('editDistrito');
    if (!distritoSelect) {
        console.error("No se encontró el campo de selección de distritos.");
        return;
    }

    // Limpiar las opciones existentes
    distritoSelect.innerHTML = '';

    try {
        const response = await axios.get('http://localhost:3000/distrito');
        console.log('Distritos recibidos:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(distrito => {
                const [id_distrito, nombre_distrito] = distrito;
                const option = document.createElement('option');
                option.value = id_distrito;
                option.text = nombre_distrito;
                distritoSelect.appendChild(option);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar los distritos:', err);
    }
};

// Agregar eventos para cargar los países, provincias, cantones y distritos cuando se muestra el modal de agregar/editar hoteles
document.getElementById('addHotelModal').addEventListener('show.bs.modal', () => {
    loadPaisesForSelect();
    loadProvinciasForSelect();
    loadCantonesForSelect();
    loadDistritosForSelect();
});

// Manejar formulario de agregar/editar hotel
const addHotelForm = document.getElementById('addHotelForm');
if (addHotelForm) {
    addHotelForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const hotelId = document.getElementById('hotelId').value;
        const nombre_hotel = document.getElementById('editNombreHotel').value.trim();
        const telefono = document.getElementById('editTelefono').value;
        const id_pais = document.getElementById('editPais').value;
        const id_provincia = document.getElementById('editProvincia').value;
        const id_canton = document.getElementById('editCanton').value;
        const id_distrito = document.getElementById('editDistrito').value;

        try {
            if (hotelId) {
                // Actualizar hotel existente
                await axios.put(`${API_URL}/${hotelId}`, {
                    nombre_hotel,
                    telefono,
                    id_pais,
                    id_provincia,
                    id_canton,
                    id_distrito
                });

                // Después de actualizar, asegúrate de resetear el ID oculto
                document.getElementById('hotelId').value = '';
            } else {
                // Crear un nuevo hotel
                await axios.post(API_URL, {
                    nombre_hotel,
                    telefono,
                    id_pais,
                    id_provincia,
                    id_canton,
                    id_distrito,
                    creado_por: 'PRUEBAS', // Usuario fijo para pruebas
                    accion: 'INSERT',
                });
            }

            // Resetear el formulario y cerrar el modal
            addHotelForm.reset();
            new bootstrap.Modal(document.getElementById('addHotelModal')).hide();

            // Recargar la lista de hoteles
            loadHotels();
        } catch (err) {
            console.error('Error al guardar el hotel:', err.response ? err.response.data : err);
        }
    });
} else {
    console.error('No se encontró el formulario de agregar/editar hotel.');
}

// Editar hotel
const editHotel = (id_hotel, nombre_hotel, telefono, id_pais, id_provincia, id_canton, id_distrito) => {
    document.getElementById('hotelId').value = id_hotel; // Campo oculto para ID
    document.getElementById('editNombreHotel').value = nombre_hotel; // Campo de nombre de hotel
    document.getElementById('editTelefono').value = telefono; // Campo de teléfono
    document.getElementById('editPais').value = id_pais; // Campo de país
    document.getElementById('editProvincia').value = id_provincia; // Campo de provincia
    document.getElementById('editCanton').value = id_canton; // Campo de cantón
    document.getElementById('editDistrito').value = id_distrito; // Campo de distrito

    // Mostrar el modal de edición
    new bootstrap.Modal(document.getElementById('addHotelModal')).show();
};

// Activar/Desactivar estado del hotel
const toggleState = async (id_hotel, currentState) => {
    const newState = currentState === 'Activo' ? 'Inactivo' : 'Activo';

    try {
        await axios.put(`${API_URL}/toggleState/${id_hotel}`, { newState });
        loadHotels(); // Recargar la lista de hoteles
    } catch (err) {
        console.error('Error al cambiar el estado del hotel:', err.response ? err.response.data : err);
    }
};

// Inicializar carga de hoteles
document.addEventListener('DOMContentLoaded', loadHotels);
