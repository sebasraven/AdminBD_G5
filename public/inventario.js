const API_URL = 'http://localhost:3000/inventario';

// Cargar inventarios al iniciar
const loadInventories = async () => {
    const tableBody = document.getElementById('inventoryTableBody');
    if (!tableBody) {
        console.error("No se encontró el cuerpo de la tabla de inventario.");
        return;
    }
    tableBody.innerHTML = ''; // Limpiar la tabla antes de agregar nuevas filas

    try {
        const response = await axios.get(API_URL);
        console.log('Respuesta recibida:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(inventory => {
                const [
                    id_inventario,
                    nombre_habitacion,
                    nombre_hotel,
                    nombre_estado,
                    creado_por,
                    fecha_creacion,
                    modificado_por,
                    fecha_modificacion,
                    accion
                ] = inventory;

                const row = document.createElement('tr');
                row.innerHTML = `
                    
                    <td>${nombre_habitacion}</td>
                    <td>${nombre_hotel}</td>
                    <td>${nombre_estado}</td>
                    <td>${creado_por}</td>
                    <td>${fecha_creacion}</td>
                    <td>${modificado_por}</td>
                    <td>${fecha_modificacion}</td>
                    <td>${accion}</td>
                    <td>
                        <button class="btn btn-success btn-sm" onclick="toggleState(${id_inventario}, '${nombre_estado}')">
                            ${nombre_estado === 'Activo' ? 'Desactivar' : 'Activar'}
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="editInventory(${id_inventario}, '${nombre_habitacion}', '${nombre_hotel}')">Editar</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar el inventario:', err);
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
                const id_habitacion = room[0]; // Asegúrate de usar el índice correcto si los datos vienen en forma de array
                const nombre_habitacion = room[3]; // Asegúrate de usar el índice correcto para el nombre de la habitación
                const option = document.createElement('option');
                option.value = id_habitacion;
                option.text = nombre_habitacion;
                roomSelect.appendChild(option);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar las habitaciones:', err);
    }

    // Verificar el contenido del campo después de cargar las opciones
    console.log('Contenido del campo de selección de habitaciones:', roomSelect.innerHTML);
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
                const id_hotel = hotel[0]; // Asegúrate de usar el índice correcto si los datos vienen en forma de array
                const nombre_hotel = hotel[1]; // Asegúrate de usar el índice correcto para el nombre del hotel
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

    // Verificar el contenido del campo después de cargar las opciones
    console.log('Contenido del campo de selección de hoteles:', hotelSelect.innerHTML);
};

// Manejar formulario de agregar/editar inventario
const addInventoryForm = document.getElementById('addInventoryForm');
if (addInventoryForm) {
    addInventoryForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const inventoryId = document.getElementById('inventoryId').value;
        const id_habitacion = document.getElementById('editHabitacion').value;
        const id_hotel = document.getElementById('editHotel').value;

        try {
            if (inventoryId) {
                // Actualizar inventario existente
                await axios.put(`${API_URL}/${inventoryId}`, {
                    id_habitacion,
                    id_hotel
                });

                // Después de actualizar, asegúrate de resetear el ID oculto
                document.getElementById('inventoryId').value = '';
            } else {
                // Crear un nuevo inventario
                await axios.post(API_URL, {
                    id_habitacion,
                    id_hotel,
                    creado_por: 'PRUEBAS', // Usuario fijo para pruebas
                    accion: 'INSERT',
                });
            }

            // Resetear el formulario y cerrar el modal
            addInventoryForm.reset();
            new bootstrap.Modal(document.getElementById('addInventoryModal')).hide();

            // Recargar la lista de inventario
            loadInventories();
        } catch (err) {
            console.error('Error al guardar el inventario:', err.response ? err.response.data : err);
        }
    });
} else {
    console.error('No se encontró el formulario de agregar/editar inventario.');
}

// Editar inventario
const editInventory = (id_inventario, nombre_habitacion, nombre_hotel) => {
    document.getElementById('inventoryId').value = id_inventario; // Campo oculto para ID
    document.getElementById('editHabitacion').value = nombre_habitacion; // Campo de habitación
    document.getElementById('editHotel').value = nombre_hotel; // Campo de hotel

    // Mostrar el modal de edición
    new bootstrap.Modal(document.getElementById('addInventoryModal')).show();
};

// Activar/Desactivar estado del inventario
const toggleState = async (id_inventario, currentState) => {
    const newState = currentState === 'Activo' ? 'Inactivo' : 'Activo';

    try {
        await axios.put(`${API_URL}/toggleState/${id_inventario}`, { newState });
        loadInventories(); // Recargar la lista de inventarios
    } catch (err) {
        console.error('Error al cambiar el estado del inventario:', err.response ? err.response.data : err);
    }
};

// Inicializar carga de inventarios y los campos de selección relacionados
document.addEventListener('DOMContentLoaded', () => {
    loadInventories();
    loadRoomsForSelect();
    loadHotelsForSelect();
});
