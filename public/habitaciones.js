const API_URL = 'http://localhost:3000/habitaciones';

// Cargar habitaciones al iniciar
const loadRooms = async () => {
    const tableBody = document.getElementById('roomTableBody');
    if (!tableBody) {
        console.error("No se encontró el cuerpo de la tabla de habitaciones.");
        return;
    }
    tableBody.innerHTML = ''; // Limpiar la tabla antes de agregar nuevas filas

    try {
        const response = await axios.get(API_URL);
        console.log('Respuesta recibida:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(room => {
                const [id_habitacion, nombre_hotel, nombre_moneda, numero_habitacion, tipo_habitacion, precio_por_noche, capacidad_personas, nombre_estado, creado_por, fecha_creacion, modificado_por, fecha_modificacion, accion] = room;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${nombre_hotel}</td>
                    <td>${nombre_moneda}</td>
                    <td>${numero_habitacion}</td>
                    <td>${tipo_habitacion}</td>
                    <td>${precio_por_noche}</td>
                    <td>${capacidad_personas}</td>
                    <td>${nombre_estado}</td>
                    <td>${creado_por}</td>
                    <td>${fecha_creacion}</td>
                    <td>${modificado_por}</td>
                    <td>${fecha_modificacion}</td>
                    <td>${accion}</td>
                    <td>
                        <button class="btn btn-success btn-sm" onclick="toggleState(${id_habitacion}, '${nombre_estado}')">
                            ${nombre_estado === 'Activo' ? 'Desactivar' : 'Activar'}
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="editRoom(${id_habitacion}, '${nombre_hotel}', '${nombre_moneda}', '${numero_habitacion}', '${tipo_habitacion}', '${precio_por_noche}', ${capacidad_personas}, '${nombre_estado}')">Editar</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar las habitaciones:', err);
    }
};

// Cargar hoteles para el campo de selección
const loadHotelsForSelect = async () => {
    const hotelSelect = document.getElementById('editHotel');
    if (!hotelSelect) {
        console.error("No se encontró el campo de selección de hoteles.");
        return;
    }

    // Limpiar las opciones existentes
    hotelSelect.innerHTML = '';

    try {
        const response = await axios.get('http://localhost:3000/hoteles');
        console.log('Hoteles recibidos:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(hotel => {
                const [id_hotel, nombre_hotel] = hotel;
                const option = document.createElement('option');
                option.value = id_hotel;
                option.text = nombre_hotel;
                hotelSelect.appendChild(option);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar los hoteles:', err);
    }
};

// Cargar monedas para el campo de selección
const loadMonedasForSelect = async () => {
    const monedaSelect = document.getElementById('editMoneda');
    if (!monedaSelect) {
        console.error("No se encontró el campo de selección de monedas.");
        return;
    }

    // Limpiar las opciones existentes
    monedaSelect.innerHTML = '';

    try {
        const response = await axios.get('http://localhost:3000/monedas');
        console.log('Monedas recibidas:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(moneda => {
                const [id_moneda, nombre_moneda] = moneda;
                const option = document.createElement('option');
                option.value = id_moneda;
                option.text = nombre_moneda;
                monedaSelect.appendChild(option);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar las monedas:', err);
    }
};

// Agregar eventos para cargar los hoteles y monedas cuando se muestra el modal de agregar/editar habitaciones
document.getElementById('addRoomModal').addEventListener('show.bs.modal', () => {
    loadHotelsForSelect();
    loadMonedasForSelect();
});

// Manejar formulario de agregar/editar habitación
const addRoomForm = document.getElementById('addRoomForm');
if (addRoomForm) {
    addRoomForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const roomId = document.getElementById('roomId').value;
        const id_hotel = document.getElementById('editHotel').value;
        const id_moneda = document.getElementById('editMoneda').value;
        const numero_habitacion = document.getElementById('editNumeroHabitacion').value.trim();
        const tipo_habitacion = document.getElementById('editTipoHabitacion').value.trim();
        const precio_por_noche = document.getElementById('editPrecioPorNoche').value.trim();
        const capacidad_personas = document.getElementById('editCapacidadPersonas').value;

        try {
            if (roomId) {
                // Actualizar habitación existente
                await axios.put(`${API_URL}/${roomId}`, {
                    id_hotel,
                    id_moneda,
                    numero_habitacion,
                    tipo_habitacion,
                    precio_por_noche,
                    capacidad_personas
                });

                // Después de actualizar, asegúrate de resetear el ID oculto
                document.getElementById('roomId').value = '';
            } else {
                // Crear una nueva habitación
                await axios.post(API_URL, {
                    id_hotel,
                    id_moneda,
                    numero_habitacion,
                    tipo_habitacion,
                    precio_por_noche,
                    capacidad_personas,
                    creado_por: 'PRUEBAS', // Usuario fijo para pruebas
                    accion: 'INSERT',
                });
            }

            // Resetear el formulario y cerrar el modal
            addRoomForm.reset();
            new bootstrap.Modal(document.getElementById('addRoomModal')).hide();

            // Recargar la lista de habitaciones
            loadRooms();
        } catch (err) {
            console.error('Error al guardar la habitación:', err.response ? err.response.data : err);
        }
    });
} else {
    console.error('No se encontró el formulario de agregar/editar habitación.');
}

// Editar habitación
const editRoom = (id_habitacion, id_hotel, id_moneda, numero_habitacion, tipo_habitacion, precio_por_noche, capacidad_personas) => {
    document.getElementById('roomId').value = id_habitacion; // Campo oculto para ID
    document.getElementById('editHotel').value = id_hotel; // Campo de hotel
    document.getElementById('editMoneda').value = id_moneda; // Campo de moneda
    document.getElementById('editNumeroHabitacion').value = numero_habitacion; // Campo de número de habitación
    document.getElementById('editTipoHabitacion').value = tipo_habitacion; // Campo de tipo de habitación
    document.getElementById('editPrecioPorNoche').value = precio_por_noche; // Campo de precio por noche
    document.getElementById('editCapacidadPersonas').value = capacidad_personas; // Campo de capacidad de personas

    // Mostrar el modal de edición
    new bootstrap.Modal(document.getElementById('addRoomModal')).show();
};

// Activar/Desactivar estado de la habitación
const toggleState = async (id_habitacion, currentState) => {
    const newState = currentState === 'Activo' ? 'Inactivo' : 'Activo';

    try {
        await axios.put(`${API_URL}/toggleState/${id_habitacion}`, { newState });
        loadRooms(); // Recargar la lista de habitaciones
    } catch (err) {
        console.error('Error al cambiar el estado de la habitación:', err.response ? err.response.data : err);
    }
};

// Inicializar carga de habitaciones
document.addEventListener('DOMContentLoaded', loadRooms);
