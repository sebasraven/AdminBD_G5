const API_URL = 'http://localhost:3000/estados';

// Cargar estados al cargar la página
const loadStates = async () => {
    const tableBody = document.getElementById('stateTableBody');
    tableBody.innerHTML = ''; // Limpiar la tabla antes de cargar los datos
    try {
        const response = await axios.get(API_URL); // Obtener datos de la API
        response.data.forEach(state => {
            const row = document.createElement('tr');
            row.setAttribute('data-id', state[0]); // ID oculto (posición 0)

            // Acceder a los elementos por índice
            const nombreEstado = state[1] || 'Sin nombre';
            const descripcion = state[2] || 'Sin descripción';
            const notas = state[3] || '';

            // Construcción de la fila
            row.innerHTML = `
                <td>${nombreEstado}</td>
                <td>${descripcion}</td>
                <td>${notas}</td>
                <td>
                    <button class="btn btn-warning btn-sm btn-edit">Editar</button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        // Agregar manejadores de eventos para botones
        document.querySelectorAll('.btn-edit').forEach(button => {
            button.addEventListener('click', handleEdit);
        });

        //document.querySelectorAll('.btn-inactivate').forEach(button => {
        // button.addEventListener('click', handleInactivate);
        //});

    } catch (error) {
        console.error('Error al cargar los estados:', error);
    }
};

// Función para manejar la edición de un estado
const handleEdit = async (event) => {
    const row = event.target.closest('tr');
    const stateId = row.getAttribute('data-id'); // Obtener el ID del estado

    try {
        // Obtener los datos del estado desde la API
        const response = await axios.get(`${API_URL}/${stateId}`);
        const state = response.data;

        // Rellenar los campos del modal con los datos del estado
        document.getElementById('stateId').value = state[0]; // ID del estado
        document.getElementById('addName').value = state[1]; // Nombre
        document.getElementById('addDescription').value = state[2]; // Descripción
        document.getElementById('addNotes').value = state[3] || ''; // Notas

        // Cambiar el título del modal a "Editar Estado"
        document.getElementById('addStateModalLabel').textContent = 'Editar Estado';

        // Mostrar el modal
        new bootstrap.Modal(document.getElementById('addStateModal')).show();

    } catch (error) {
        console.error('Error al cargar los datos del estado:', error);
    }
};

// Función para manejar la actualización del estado
const handleUpdate = async (event) => {
    event.preventDefault();

    const stateId = document.getElementById('stateId').value;
    const name = document.getElementById('addName').value;
    const description = document.getElementById('addDescription').value;
    const notes = document.getElementById('addNotes').value;

    try {
        await axios.put(`${API_URL}/${stateId}`, {
            descripcion: description,
            notas: notes
        });
        alert('Estado actualizado con éxito');
        loadStates();
        addStateForm.reset();

        // Cerrar el modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addStateModal'));
        modal.hide();
    } catch (error) {
        console.error('Error al actualizar el estado:', error);
        alert('Error al actualizar el estado');
    }
};

// Agregar un nuevo estado
/*
const addStateForm = document.getElementById('addStateForm');
addStateForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = document.getElementById('addName').value;
    const description = document.getElementById('addDescription').value;
    const notes = document.getElementById('addNotes').value;

    try {
        await axios.post(API_URL, {
            nombre_estado: name,
            descripcion: description,
            notas: notes
        });
        alert('Estado agregado con éxito');
        loadStates();
        addStateForm.reset();
        new bootstrap.Modal(document.getElementById('addStateModal')).hide();
    } catch (error) {
        console.error('Error al agregar el estado:', error);
        alert('Error al agregar el estado');
    }
});
*/

// Inicializar estados
document.addEventListener('DOMContentLoaded', loadStates);

// Asignar la función de actualización al formulario de edición
addStateForm.addEventListener('submit', handleUpdate);