const API_URL = 'http://localhost:3000/items';

// Cargar ítems al iniciar
const loadItems = async () => {
    const tableBody = document.getElementById('itemTableBody');
    if (!tableBody) {
        console.error("No se encontró el cuerpo de la tabla de ítems.");
        return;
    }
    tableBody.innerHTML = ''; // Limpiar la tabla antes de agregar nuevas filas

    try {
        const response = await axios.get(API_URL);
        console.log('Respuesta recibida:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(item => {
                const [
                    id_item,
                    marca,
                    modelo,
                    fecha_compra,
                    descripcion,
                    nombre_estado,
                    creado_por,
                    fecha_creacion,
                    modificado_por,
                    fecha_modificacion,
                    accion
                ] = item;

                const row = document.createElement('tr');
                row.innerHTML = `
                    
                    <td>${marca}</td>
                    <td>${modelo}</td>
                    <td>${fecha_compra}</td>
                    <td>${descripcion}</td>
                    <td>${nombre_estado}</td>
                    <td>${creado_por}</td>
                    <td>${fecha_creacion}</td>
                    <td>${modificado_por}</td>
                    <td>${fecha_modificacion}</td>
                    <td>${accion}</td>
                    <td>
                        <button class="btn btn-success btn-sm" onclick="toggleState(${id_item}, '${nombre_estado}')">
                            ${nombre_estado === 'Activo' ? 'Desactivar' : 'Activar'}
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="editItem(${id_item}, '${marca}', '${modelo}', '${fecha_compra}', '${descripcion}')">Editar</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar los ítems:', err);
    }
};

// Manejar formulario de agregar/editar ítem
const addItemForm = document.getElementById('addItemForm');
if (addItemForm) {
    addItemForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const itemId = document.getElementById('itemId').value;
        const marca = document.getElementById('editMarca').value;
        const modelo = document.getElementById('editModelo').value;
        const fecha_compra = document.getElementById('editFechaCompra').value;
        const descripcion = document.getElementById('editDescripcion').value;

        try {
            if (itemId) {
                // Actualizar ítem existente
                await axios.put(`${API_URL}/${itemId}`, {
                    marca,
                    modelo,
                    fecha_compra,
                    descripcion
                });

                // Después de actualizar, asegúrate de resetear el ID oculto
                document.getElementById('itemId').value = '';
            } else {
                // Crear un nuevo ítem
                await axios.post(API_URL, {
                    marca,
                    modelo,
                    fecha_compra,
                    descripcion,
                    creado_por: 'PRUEBAS', // Usuario fijo para pruebas
                    accion: 'INSERT',
                });
            }

            // Resetear el formulario y cerrar el modal
            addItemForm.reset();
            new bootstrap.Modal(document.getElementById('addItemModal')).hide();

            // Recargar la lista de ítems
            loadItems();
        } catch (err) {
            console.error('Error al guardar el ítem:', err.response ? err.response.data : err);
        }
    });
} else {
    console.error('No se encontró el formulario de agregar/editar ítem.');
}

// Editar ítem
const editItem = (id_item, marca, modelo, fecha_compra, descripcion) => {
    document.getElementById('itemId').value = id_item; // Campo oculto para ID
    document.getElementById('editMarca').value = marca; // Campo de marca
    document.getElementById('editModelo').value = modelo; // Campo de modelo
    document.getElementById('editFechaCompra').value = fecha_compra; // Campo de fecha de compra
    document.getElementById('editDescripcion').value = descripcion; // Campo de descripción

    // Mostrar el modal de edición
    new bootstrap.Modal(document.getElementById('addItemModal')).show();
};

// Activar/Desactivar estado del ítem
const toggleState = async (id_item, currentState) => {
    const newState = currentState === 'Activo' ? 'Inactivo' : 'Activo';

    try {
        await axios.put(`${API_URL}/toggleState/${id_item}`, { newState });
        loadItems(); // Recargar la lista de ítems
    } catch (err) {
        console.error('Error al cambiar el estado del ítem:', err.response ? err.response.data : err);
    }
};

// Inicializar carga de ítems
document.addEventListener('DOMContentLoaded', () => {
    loadItems();
});
