const API_URL = 'http://localhost:3000/marcas';

// Cargar marcas al iniciar
const loadBrands = async () => {
    const tableBody = document.getElementById('brandTableBody');
    if (!tableBody) {
        console.error("No se encontró el cuerpo de la tabla de marcas.");
        return;
    }
    tableBody.innerHTML = ''; // Limpiar la tabla antes de agregar nuevas filas

    try {
        const response = await axios.get(API_URL);
        console.log('Respuesta recibida:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(brand => {
                const [
                    id_marca,
                    nombre_marca,
                    nombre_estado,
                    creado_por,
                    fecha_creacion,
                    modificado_por,
                    fecha_modificacion,
                    accion
                ] = brand;

                const row = document.createElement('tr');
                row.innerHTML = `
                    
                    <td>${nombre_marca}</td>
                    <td>${nombre_estado}</td>
                    <td>${creado_por}</td>
                    <td>${fecha_creacion}</td>
                    <td>${modificado_por}</td>
                    <td>${fecha_modificacion}</td>
                    <td>${accion}</td>
                    <td>
                        <button class="btn btn-success btn-sm" onclick="toggleState(${id_marca}, '${nombre_estado}')">
                            ${nombre_estado === 'Activo' ? 'Desactivar' : 'Activar'}
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="editBrand(${id_marca}, '${nombre_marca}')">Editar</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar las marcas:', err);
    }
};

// Manejar formulario de agregar/editar marca
const addBrandForm = document.getElementById('addBrandForm');
if (addBrandForm) {
    addBrandForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const brandId = document.getElementById('brandId').value;
        const nombre_marca = document.getElementById('editNombreMarca').value;

        try {
            if (brandId) {
                // Actualizar marca existente
                await axios.put(`${API_URL}/${brandId}`, {
                    nombre_marca
                });

                // Después de actualizar, asegúrate de resetear el ID oculto
                document.getElementById('brandId').value = '';
            } else {
                // Crear una nueva marca
                await axios.post(API_URL, {
                    nombre_marca,
                    creado_por: 'PRUEBAS', // Usuario fijo para pruebas
                    accion: 'INSERT',
                });
            }

            // Resetear el formulario y cerrar el modal
            addBrandForm.reset();
            new bootstrap.Modal(document.getElementById('addBrandModal')).hide();

            // Recargar la lista de marcas
            loadBrands();
        } catch (err) {
            console.error('Error al guardar la marca:', err.response ? err.response.data : err);
        }
    });
} else {
    console.error('No se encontró el formulario de agregar/editar marca.');
}

// Editar marca
const editBrand = (id_marca, nombre_marca) => {
    document.getElementById('brandId').value = id_marca; // Campo oculto para ID
    document.getElementById('editNombreMarca').value = nombre_marca; // Campo de nombre de marca

    // Mostrar el modal de edición
    new bootstrap.Modal(document.getElementById('addBrandModal')).show();
};

// Activar/Desactivar estado de la marca
const toggleState = async (id_marca, currentState) => {
    const newState = currentState === 'Activo' ? 'Inactivo' : 'Activo';

    try {
        await axios.put(`${API_URL}/toggleState/${id_marca}`, { newState });
        loadBrands(); // Recargar la lista de marcas
    } catch (err) {
        console.error('Error al cambiar el estado de la marca:', err.response ? err.response.data : err);
    }
};

// Inicializar carga de marcas
document.addEventListener('DOMContentLoaded', () => {
    loadBrands();
});
