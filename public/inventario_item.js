const API_URL = 'http://localhost:3000/inventario_item';

// Cargar inventario-ítems al iniciar
const loadInventoryItems = async () => {
    const tableBody = document.getElementById('inventoryItemTableBody');
    if (!tableBody) {
        console.error("No se encontró el cuerpo de la tabla de inventario-ítems.");
        return;
    }
    tableBody.innerHTML = ''; // Limpiar la tabla antes de agregar nuevas filas

    try {
        const response = await axios.get(API_URL);
        console.log('Respuesta recibida:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(inventoryItem => {
                const [
                    id_inventario_item,
                    nombre_inventario,
                    nombre_item,
                    cantidad,
                    nombre_estado,
                    creado_por,
                    fecha_creacion,
                    modificado_por,
                    fecha_modificacion,
                    accion
                ] = inventoryItem;

                const row = document.createElement('tr');
                row.innerHTML = `
                    
                    <td>${nombre_inventario}</td>
                    <td>${nombre_item}</td>
                    <td>${cantidad}</td>
                    <td>${nombre_estado}</td>
                    <td>${creado_por}</td>
                    <td>${fecha_creacion}</td>
                    <td>${modificado_por}</td>
                    <td>${fecha_modificacion}</td>
                    <td>${accion}</td>
                    <td>
                        <button class="btn btn-success btn-sm" onclick="toggleState(${id_inventario_item}, '${nombre_estado}')">
                            ${nombre_estado === 'Activo' ? 'Desactivar' : 'Activar'}
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="editInventoryItem(${id_inventario_item}, '${nombre_inventario}', '${nombre_item}', ${cantidad})">Editar</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar los inventario-ítems:', err);
    }
};

// Cargar inventarios para el campo de selección
const loadInventoriesForSelect = async () => {
    const inventorySelect = document.getElementById('editInventario');
    if (!inventorySelect) {
        console.error("No se encontró el campo de selección de inventarios.");
        return;
    }

    // Limpiar las opciones existentes
    inventorySelect.innerHTML = '';

    try {
        const response = await axios.get('http://localhost:3000/inventario');
        console.log('Inventarios recibidos:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(inventory => {
                const id_inventario = inventory[0]; // Asegúrate de usar el índice correcto si los datos vienen en forma de array
                const nombre_inventario = inventory[1]; // Asegúrate de usar el índice correcto para el nombre del inventario
                const option = document.createElement('option');
                option.value = id_inventario;
                option.text = nombre_inventario; // Mostrar el nombre del inventario formateado
                inventorySelect.appendChild(option);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar los inventarios:', err);
    }

    // Verificar el contenido del campo después de cargar las opciones
    console.log('Contenido del campo de selección de inventarios:', inventorySelect.innerHTML);
};


// Cargar ítems para el campo de selección
const loadItemsForSelect = async () => {
    const itemSelect = document.getElementById('editItem');
    if (!itemSelect) {
        console.error("No se encontró el campo de selección de ítems.");
        return;
    }

    // Limpiar las opciones existentes
    itemSelect.innerHTML = '';

    try {
        const response = await axios.get('http://localhost:3000/items');
        console.log('Ítems recibidos:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(item => {
                const id_item = item[0]; // Asegúrate de usar el índice correcto si los datos vienen en forma de array
                const marca = item[1]; // Asegúrate de usar el índice correcto para la marca
                const modelo = item[2]; // Asegúrate de usar el índice correcto para el modelo
                const option = document.createElement('option');
                option.value = id_item;
                option.text = `${marca} ${modelo}`; // Mostrar la marca y el modelo
                itemSelect.appendChild(option);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar los ítems:', err);
    }

    // Verificar el contenido del campo después de cargar las opciones
    console.log('Contenido del campo de selección de ítems:', itemSelect.innerHTML);
};


// Manejar formulario de agregar/editar inventario-ítem
const addInventoryItemForm = document.getElementById('addInventoryItemForm');
if (addInventoryItemForm) {
    addInventoryItemForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const inventoryItemId = document.getElementById('inventoryItemId').value;
        const id_inventario = document.getElementById('editInventario').value;
        const id_item = document.getElementById('editItem').value;
        const cantidad = document.getElementById('editCantidad').value;

        try {
            if (inventoryItemId) {
                // Actualizar inventario-ítem existente
                await axios.put(`${API_URL}/${inventoryItemId}`, {
                    id_inventario,
                    id_item,
                    cantidad
                });

                // Después de actualizar, asegúrate de resetear el ID oculto
                document.getElementById('inventoryItemId').value = '';
            } else {
                // Crear un nuevo inventario-ítem
                await axios.post(API_URL, {
                    id_inventario,
                    id_item,
                    cantidad,
                    creado_por: 'PRUEBAS', // Usuario fijo para pruebas
                    accion: 'INSERT',
                });
            }

            // Resetear el formulario y cerrar el modal
            addInventoryItemForm.reset();
            new bootstrap.Modal(document.getElementById('addInventoryItemModal')).hide();

            // Recargar la lista de inventario-ítems
            loadInventoryItems();
        } catch (err) {
            console.error('Error al guardar el inventario-ítem:', err.response ? err.response.data : err);
        }
    });
} else {
    console.error('No se encontró el formulario de agregar/editar inventario-ítem.');
}

// Editar inventario-ítem
const editInventoryItem = (id_inventario_item, id_inventario, id_item, cantidad) => {
    document.getElementById('inventoryItemId').value = id_inventario_item; // Campo oculto para ID
    document.getElementById('editInventario').value = id_inventario; // Campo de inventario
    document.getElementById('editItem').value = id_item; // Campo de ítem
    document.getElementById('editCantidad').value = cantidad; // Campo de cantidad

    // Mostrar el modal de edición
    new bootstrap.Modal(document.getElementById('addInventoryItemModal')).show();
};

// Activar/Desactivar estado del inventario-ítem
const toggleState = async (id_inventario_item, currentState) => {
    const newState = currentState === 'Activo' ? 'Inactivo' : 'Activo';

    try {
        await axios.put(`${API_URL}/toggleState/${id_inventario_item}`, { newState });
        loadInventoryItems(); // Recargar la lista de inventario-ítems
    } catch (err) {
        console.error('Error al cambiar el estado del inventario-ítem:', err.response ? err.response.data : err);
    }
};

// Inicializar carga de inventario-ítems y los campos de selección relacionados
document.addEventListener('DOMContentLoaded', () => {
    loadInventoryItems();
    loadInventoriesForSelect();
    loadItemsForSelect();
});
