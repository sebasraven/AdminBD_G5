const API_URL = 'http://localhost:3000/estados';

// Cargar estados al iniciar
const loadStates = async () => {
    const tableBody = document.getElementById('stateTableBody');
    if (!tableBody) {
        console.error("No se encontró el cuerpo de la tabla.");
        return;
    }
    tableBody.innerHTML = '';  // Limpiar la tabla antes de agregar nuevas filas

    try {
        const response = await axios.get(API_URL);
        console.log('Respuesta recibida:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(state => {
                console.log(state);
                const [id_estado, nombre_estado, descripcion, notas, creado_por, fecha_creacion, modificado_por, fecha_modificacion, accion] = state;

                const row = document.createElement('tr');
                row.innerHTML = `
                        <td>${nombre_estado}</td>
                        <td>${descripcion}</td>
                        <td>${notas}</td>
                        <td>${creado_por}</td>
                        <td>${fecha_creacion}</td>
                        <td>${modificado_por}</td>
                        <td>${fecha_modificacion}</td>
                        <td>${accion}</td>
                        <td>
                            <button class="btn btn-warning btn-sm" onclick="editState(${id_estado}, '${nombre_estado}', '${descripcion}', '${notas}')">Editar</button>
                            <button class="btn btn-danger btn-sm" onclick="deleteState(${id_estado})">Eliminar</button>
                        </td>
                    `;
                tableBody.appendChild(row);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar los estados:', err);
    }
};

// Manejar formulario de agregar/editar estado
const addStateForm = document.getElementById('addStateForm');
if (addStateForm) {
    addStateForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const stateId = document.getElementById('stateId').value;
        const nombre_estado = document.getElementById('addName').value;
        const descripcion = document.getElementById('addDescription').value;
        const notas = document.getElementById('addNotes').value;

        try {
            if (stateId) {
                // Actualizar estado existente
                await axios.put(`${API_URL}/${stateId}`, { nombre_estado, descripcion, notas });
            } else {
                // Crear un nuevo estado
                await axios.post(API_URL, {
                    nombre_estado,
                    descripcion,
                    notas,
                    creado_por: 'PRUEBAS', // Usuario fijo
                    accion: 'INSERT',
                });
            }

            // Resetear el formulario y cerrar el modal
            addStateForm.reset();
            new bootstrap.Modal(document.getElementById('addStateModal')).hide();

            // Recargar la lista de estados
            loadStates();
        } catch (err) {
            console.error('Error al guardar el estado:', err.response ? err.response.data : err);
        }
    });
} else {
    console.error('No se encontró el formulario de agregar estado.');
}

// Editar estado
const editState = (id_estado, nombre, descripcion, notas) => {
    document.getElementById('stateId').value = id_estado;
    document.getElementById('addName').value = nombre;
    document.getElementById('addDescription').value = descripcion;
    document.getElementById('addNotes').value = notas;

    new bootstrap.Modal(document.getElementById('addStateModal')).show();
};

// Eliminar estado
const deleteState = async (id_estado) => {
    try {
        const response = await axios.delete(`${API_URL}/${id_estado}`);
        console.log('Estado eliminado:', response.data);  // Verifica la respuesta
        loadStates();
    } catch (err) {
        console.error('Error al eliminar el estado:', err.response ? err.response.data : err);
    }
};

// Inicializar carga de estados
document.addEventListener('DOMContentLoaded', loadStates);


