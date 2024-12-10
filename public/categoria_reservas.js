const API_URL = 'http://localhost:3000/categoria_reservas';

// Cargar categorías al iniciar
const loadCategories = async () => {
    const tableBody = document.getElementById('categoryTableBody');
    if (!tableBody) {
        console.error("No se encontró el cuerpo de la tabla de categorías.");
        return;
    }
    tableBody.innerHTML = ''; // Limpiar la tabla antes de agregar nuevas filas

    try {
        const response = await axios.get(API_URL);
        console.log('Respuesta recibida:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(category => {
                const [
                    id_categoria, 
                    nombre_categoria, 
                    comentarios, 
                    nombre_estado, 
                    creado_por, 
                    fecha_creacion, 
                    modificado_por, 
                    fecha_modificacion, 
                    accion
                ] = category;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${nombre_categoria}</td>
                    <td>${comentarios}</td>
                    <td>${nombre_estado}</td>
                    <td>${creado_por}</td>
                    <td>${fecha_creacion}</td>
                    <td>${modificado_por}</td>
                    <td>${fecha_modificacion}</td>
                    <td>${accion}</td>
                    <td>
                        <button class="btn btn-success btn-sm" onclick="toggleState(${id_categoria}, '${nombre_estado}')">
                            ${nombre_estado === 'Activo' ? 'Desactivar' : 'Activar'}
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="editCategory(${id_categoria}, '${nombre_categoria}', '${comentarios}')">Editar</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar las categorías:', err);
    }
};

// Manejar formulario de agregar/editar categoría
const addCategoryForm = document.getElementById('addCategoryForm');
if (addCategoryForm) {
    addCategoryForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const categoryId = document.getElementById('categoryId').value;
        const nombre_categoria = document.getElementById('editNombreCategoria').value.trim();
        const comentarios = document.getElementById('editComentarios').value.trim();

        try {
            if (categoryId) {
                // Actualizar categoría existente
                await axios.put(`${API_URL}/${categoryId}`, {
                    nombre_categoria,
                    comentarios
                });

                // Después de actualizar, asegúrate de resetear el ID oculto
                document.getElementById('categoryId').value = '';
            } else {
                // Crear una nueva categoría
                await axios.post(API_URL, {
                    nombre_categoria,
                    comentarios,
                    creado_por: 'PRUEBAS', // Usuario fijo para pruebas
                    accion: 'INSERT',
                });
            }

            // Resetear el formulario y cerrar el modal
            addCategoryForm.reset();
            new bootstrap.Modal(document.getElementById('addCategoryModal')).hide();

            // Recargar la lista de categorías
            loadCategories();
        } catch (err) {
            console.error('Error al guardar la categoría:', err.response ? err.response.data : err);
        }
    });
} else {
    console.error('No se encontró el formulario de agregar/editar categoría.');
}

// Editar categoría
const editCategory = (id_categoria, nombre_categoria, comentarios) => {
    document.getElementById('categoryId').value = id_categoria; // Campo oculto para ID
    document.getElementById('editNombreCategoria').value = nombre_categoria; // Campo de nombre de categoría
    document.getElementById('editComentarios').value = comentarios; // Campo de comentarios

    // Mostrar el modal de edición
    new bootstrap.Modal(document.getElementById('addCategoryModal')).show();
};

// Activar/Desactivar estado de la categoría
const toggleState = async (id_categoria, currentState) => {
    const newState = currentState === 'Activo' ? 'Inactivo' : 'Activo';

    try {
        await axios.put(`${API_URL}/toggleState/${id_categoria}`, { newState });
        loadCategories(); // Recargar la lista de categorías
    } catch (err) {
        console.error('Error al cambiar el estado de la categoría:', err.response ? err.response.data : err);
    }
};

// Inicializar carga de categorías
document.addEventListener('DOMContentLoaded', loadCategories);


