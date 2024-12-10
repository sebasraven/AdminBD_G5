const API_URL = 'http://localhost:3000/modelos';

// Cargar modelos al iniciar
const loadModels = async () => {
    const tableBody = document.getElementById('modelTableBody');
    if (!tableBody) {
        console.error("No se encontró el cuerpo de la tabla de modelos.");
        return;
    }
    tableBody.innerHTML = ''; // Limpiar la tabla antes de agregar nuevas filas

    try {
        const response = await axios.get(API_URL);
        console.log('Respuesta recibida:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(model => {
                const [
                    id_modelo,
                    nombre_modelo,
                    nombre_marca,
                    nombre_estado,
                    creado_por,
                    fecha_creacion,
                    modificado_por,
                    fecha_modificacion,
                    accion
                ] = model;

                const row = document.createElement('tr');
                row.innerHTML = `
                    
                    <td>${nombre_modelo}</td>
                    <td>${nombre_marca}</td>
                    <td>${nombre_estado}</td>
                    <td>${creado_por}</td>
                    <td>${fecha_creacion}</td>
                    <td>${modificado_por}</td>
                    <td>${fecha_modificacion}</td>
                    <td>${accion}</td>
                    <td>
                        <button class="btn btn-success btn-sm" onclick="toggleState(${id_modelo}, '${nombre_estado}')">
                            ${nombre_estado === 'Activo' ? 'Desactivar' : 'Activar'}
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="editModel(${id_modelo}, '${nombre_modelo}', '${nombre_marca}')">Editar</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar los modelos:', err);
    }
};

// Cargar marcas para el campo de selección
const loadBrandsForSelect = async () => {
    const brandSelect = document.getElementById('editMarca');
    if (!brandSelect) {
        console.error("No se encontró el campo de selección de marcas.");
        return;
    }

    // Limpiar las opciones existentes
    brandSelect.innerHTML = '';

    try {
        const response = await axios.get('http://localhost:3000/marcas');
        console.log('Marcas recibidas:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(brand => {
                const id_marca = brand[0]; // Asegúrate de usar el índice correcto si los datos vienen en forma de array
                const nombre_marca = brand[1]; // Asegúrate de usar el índice correcto para el nombre de la marca
                const option = document.createElement('option');
                option.value = id_marca;
                option.text = nombre_marca; // Mostrar el nombre de la marca
                brandSelect.appendChild(option);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar las marcas:', err);
    }

    // Verificar el contenido del campo después de cargar las opciones
    console.log('Contenido del campo de selección de marcas:', brandSelect.innerHTML);
};

// Manejar formulario de agregar/editar modelo
const addModelForm = document.getElementById('addModelForm');
if (addModelForm) {
    addModelForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const modelId = document.getElementById('modelId').value;
        const nombre_modelo = document.getElementById('editNombreModelo').value;
        const id_marca = document.getElementById('editMarca').value;

        try {
            if (modelId) {
                // Actualizar modelo existente
                await axios.put(`${API_URL}/${modelId}`, {
                    nombre_modelo,
                    id_marca
                });

                // Después de actualizar, asegúrate de resetear el ID oculto
                document.getElementById('modelId').value = '';
            } else {
                // Crear un nuevo modelo
                await axios.post(API_URL, {
                    nombre_modelo,
                    id_marca,
                    creado_por: 'PRUEBAS', // Usuario fijo para pruebas
                    accion: 'INSERT',
                });
            }

            // Resetear el formulario y cerrar el modal
            addModelForm.reset();
            new bootstrap.Modal(document.getElementById('addModelModal')).hide();

            // Recargar la lista de modelos
            loadModels();
        } catch (err) {
            console.error('Error al guardar el modelo:', err.response ? err.response.data : err);
        }
    });
} else {
    console.error('No se encontró el formulario de agregar/editar modelo.');
}

// Editar modelo
const editModel = (id_modelo, nombre_modelo, id_marca) => {
    document.getElementById('modelId').value = id_modelo; // Campo oculto para ID
    document.getElementById('editNombreModelo').value = nombre_modelo; // Campo de nombre de modelo
    document.getElementById('editMarca').value = id_marca; // Campo de marca

    // Mostrar el modal de edición
    new bootstrap.Modal(document.getElementById('addModelModal')).show();
};

// Activar/Desactivar estado del modelo
const toggleState = async (id_modelo, currentState) => {
    const newState = currentState === 'Activo' ? 'Inactivo' : 'Activo';

    try {
        await axios.put(`${API_URL}/toggleState/${id_modelo}`, { newState });
        loadModels(); // Recargar la lista de modelos
    } catch (err) {
        console.error('Error al cambiar el estado del modelo:', err.response ? err.response.data : err);
    }
};

// Inicializar carga de modelos y marcas relacionadas
document.addEventListener('DOMContentLoaded', () => {
    loadModels();
    loadBrandsForSelect();
});
