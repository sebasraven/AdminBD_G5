const API_URL = 'http://localhost:3000/reservas';

// Cargar reservas al iniciar
const loadReservations = async () => {
    const tableBody = document.getElementById('reservationTableBody');
    if (!tableBody) {
        console.error("No se encontró el cuerpo de la tabla de reservas.");
        return;
    }
    tableBody.innerHTML = ''; // Limpiar la tabla antes de agregar nuevas filas

    try {
        const response = await axios.get(API_URL);
        console.log('Respuesta recibida:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(reservation => {
                const {
                    id_reservacion,
                    nombre_usuario,
                    nombre_hotel,
                    nombre_categoria,
                    numero_habitacion,
                    valoracion,
                    nombre_moneda,
                    nombre_estado,
                    fecha_inicio,
                    fecha_cierre,
                    hora,
                    precio_unitario,
                    nombre,
                    descripcion,
                    creado_por,
                    fecha_creacion,
                    modificado_por,
                    fecha_modificacion,
                    accion
                } = reservation;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${nombre_usuario}</td>
                    <td>${nombre_hotel}</td>
                    <td>${nombre_categoria}</td>
                    <td>${numero_habitacion}</td>
                    <td>${valoracion}</td>
                    <td>${nombre_moneda}</td>
                    <td>${nombre_estado}</td>
                    <td>${fecha_inicio}</td>
                    <td>${fecha_cierre}</td>
                    <td>${hora}</td>
                    <td>${precio_unitario}</td>
                    <td>${nombre}</td>
                    <td>${descripcion}</td>
                    <td>${creado_por}</td>
                    <td>${fecha_creacion}</td>
                    <td>${modificado_por}</td>
                    <td>${fecha_modificacion}</td>
                    <td>${accion}</td>
                    <td>
                        <button class="btn btn-success btn-sm" onclick="toggleState(${id_reservacion}, '${nombre_estado}')">
                            ${nombre_estado === 'Activo' ? 'Desactivar' : 'Activar'}
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="editReservation(${id_reservacion}, '${nombre_usuario}', '${nombre_hotel}', '${nombre_categoria}', '${numero_habitacion}', '${valoracion}', '${nombre_moneda}', '${fecha_inicio}', '${fecha_cierre}', '${hora}', '${precio_unitario}', '${nombre}', '${descripcion}')">Editar</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar las reservas:', err);
    }
};

// Cargar usuarios para el campo de selección
const loadUsersForSelect = async () => {
    const userSelect = document.getElementById('editUsuario');
    if (!userSelect) {
        console.error("No se encontró el campo de selección de usuarios.");
        return;
    }

    // Limpiar las opciones existentes
    userSelect.innerHTML = '';

    try {
        const response = await axios.get('http://localhost:3000/usuarios');
        console.log('Usuarios recibidos:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(user => {
                const [id_usuario, nombre_usuario] = user;
                const option = document.createElement('option');
                option.value = id_usuario;
                option.text = nombre_usuario;
                userSelect.appendChild(option);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar los usuarios:', err);
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

// Cargar categorías para el campo de selección
const loadCategoriesForSelect = async () => {
    const categorySelect = document.getElementById('editCategoria');
    if (!categorySelect) {
        console.error("No se encontró el campo de selección de categorías.");
        return;
    }

    // Limpiar las opciones existentes
    categorySelect.innerHTML = '';

    try {
        const response = await axios.get('http://localhost:3000/categoria_reservas');
        console.log('Categorías recibidas:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(category => {
                const [id_categoria, nombre_categoria] = category;
                const option = document.createElement('option');
                option.value = id_categoria;
                option.text = nombre_categoria;
                categorySelect.appendChild(option);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar las categorías:', err);
    }
};

// Cargar habitaciones para el campo de selección
const loadRoomsForSelect = async () => {
    const roomSelect = document.getElementById('editHabitacion');
    if (!roomSelect) {
        console.error("No se encontró el campo de selección de habitaciones.");
        return;
    }

    // Limpiar las opciones existentes
    roomSelect.innerHTML = '';

    try {
        const response = await axios.get('http://localhost:3000/habitaciones');
        console.log('Habitaciones recibidas:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(room => {
                // Asegúrate de que el orden de los elementos en la consulta coincida con el orden esperado aquí
                const [id_habitacion, nombre_hotel, nombre_moneda, numero_habitacion] = room;
                const option = document.createElement('option');
                option.value = id_habitacion;
                option.text = `Habitación ${numero_habitacion} (${nombre_hotel})`;
                roomSelect.appendChild(option);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar las habitaciones:', err);
    }
};



// Cargar valoraciones para el campo de selección
const loadRatingsForSelect = async () => {
    const ratingSelect = document.getElementById('editValoracion');
    if (!ratingSelect) {
        console.error("No se encontró el campo de selección de valoraciones.");
        return;
    }

    // Limpiar las opciones existentes
    ratingSelect.innerHTML = '';

    try {
        const response = await axios.get('http://localhost:3000/valoraciones');
        console.log('Valoraciones recibidas:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(rating => {
                const { id_valoracion, comentario } = rating;
                const option = document.createElement('option');
                option.value = id_valoracion;
                option.text = comentario;
                ratingSelect.appendChild(option);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar las valoraciones:', err);
    }
};


// Cargar monedas para el campo de selección
const loadCurrenciesForSelect = async () => {
    const currencySelect = document.getElementById('editMoneda');
    if (!currencySelect) {
        console.error("No se encontró el campo de selección de monedas.");
        return;
    }

    // Limpiar las opciones existentes
    currencySelect.innerHTML = '';

    try {
        const response = await axios.get('http://localhost:3000/monedas');
        console.log('Monedas recibidas:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(currency => {
                const [id_moneda, nombre_moneda] = currency;
                const option = document.createElement('option');
                option.value = id_moneda;
                option.text = nombre_moneda;
                currencySelect.appendChild(option);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar las monedas:', err);
    }
};

// Manejar formulario de agregar/editar reserva
const addReservationForm = document.getElementById('addReservationForm');
if (addReservationForm) {
    addReservationForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const reservationId = document.getElementById('reservationId').value;
        const id_usuario = document.getElementById('editUsuario').value;
        const id_hotel = document.getElementById('editHotel').value;
        const id_categoria = document.getElementById('editCategoria').value;
        const id_habitacion = document.getElementById('editHabitacion').value;
        const id_valoracion = document.getElementById('editValoracion').value;
        const id_moneda = document.getElementById('editMoneda').value;
        const fecha_inicio = document.getElementById('editFechaInicio').value;
        const fecha_cierre = document.getElementById('editFechaCierre').value;
        const hora = document.getElementById('editHora').value;
        const precio_unitario = document.getElementById('editPrecioUnitario').value;
        const nombre = document.getElementById('editNombre').value.trim();
        const descripcion = document.getElementById('editDescripcion').value.trim();

        try {
            if (reservationId) {
                // Actualizar reserva existente
                await axios.put(`${API_URL}/${reservationId}`, {
                    id_usuario,
                    id_hotel,
                    id_categoria,
                    id_habitacion,
                    id_valoracion,
                    id_moneda,
                    fecha_inicio,
                    fecha_cierre,
                    hora,
                    precio_unitario,
                    nombre,
                    descripcion
                });

                // Después de actualizar, asegúrate de resetear el ID oculto
                document.getElementById('reservationId').value = '';
            } else {
                // Crear una nueva reserva
                await axios.post(API_URL, {
                    id_usuario,
                    id_hotel,
                    id_categoria,
                    id_habitacion,
                    id_valoracion,
                    id_moneda,
                    fecha_inicio,
                    fecha_cierre,
                    hora,
                    precio_unitario,
                    nombre,
                    descripcion,
                    creado_por: 'PRUEBAS', // Usuario fijo para pruebas
                    accion: 'INSERT',
                });
            }

            // Resetear el formulario y cerrar el modal
            addReservationForm.reset();
            new bootstrap.Modal(document.getElementById('addReservationModal')).hide();

            // Recargar la lista de reservas
            loadReservations();
        } catch (err) {
            console.error('Error al guardar la reserva:', err.response ? err.response.data : err);
        }
    });
} else {
    console.error('No se encontró el formulario de agregar/editar reserva.');
}

// Editar reserva
const editReservation = (id_reservacion, id_usuario, id_hotel, id_categoria, id_habitacion, id_valoracion, id_moneda, fecha_inicio, fecha_cierre, hora, precio_unitario, nombre, descripcion) => {
    document.getElementById('reservationId').value = id_reservacion; // Campo oculto para ID
    document.getElementById('editUsuario').value = id_usuario; // Campo de usuario
    document.getElementById('editHotel').value = id_hotel; // Campo de hotel
    document.getElementById('editCategoria').value = id_categoria; // Campo de categoría
    document.getElementById('editHabitacion').value = id_habitacion; // Campo de habitación
    document.getElementById('editValoracion').value = id_valoracion; // Campo de valoración
    document.getElementById('editMoneda').value = id_moneda; // Campo de moneda
    document.getElementById('editFechaInicio').value = fecha_inicio; // Campo de fecha de inicio
    document.getElementById('editFechaCierre').value = fecha_cierre; // Campo de fecha de cierre
    document.getElementById('editHora').value = hora; // Campo de hora
    document.getElementById('editPrecioUnitario').value = precio_unitario; // Campo de precio unitario
    document.getElementById('editNombre').value = nombre; // Campo de nombre
    document.getElementById('editDescripcion').value = descripcion; // Campo de descripción

    // Mostrar el modal de edición
    new bootstrap.Modal(document.getElementById('addReservationModal')).show();
};

// Activar/Desactivar estado de la reserva
const toggleState = async (id_reservacion, currentState) => {
    const newState = currentState === 'Activo' ? 'Inactivo' : 'Activo';

    try {
        await axios.put(`${API_URL}/toggleState/${id_reservacion}`, { newState });
        loadReservations(); // Recargar la lista de reservas
    } catch (err) {
        console.error('Error al cambiar el estado de la reserva:', err.response ? err.response.data : err);
    }
};

// Inicializar carga de reservas
document.addEventListener('DOMContentLoaded', () => {
    loadReservations();
    loadUsersForSelect();
    loadHotelsForSelect();
    loadCategoriesForSelect();
    loadRoomsForSelect();
    loadRatingsForSelect();
    loadCurrenciesForSelect();
});
