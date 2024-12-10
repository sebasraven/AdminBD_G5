const API_URL = 'http://localhost:3000/impuestos';

// Cargar impuestos al iniciar
const loadTaxes = async () => {
    const tableBody = document.getElementById('taxTableBody');
    if (!tableBody) {
        console.error("No se encontró el cuerpo de la tabla de impuestos.");
        return;
    }
    tableBody.innerHTML = ''; // Limpiar la tabla antes de agregar nuevas filas

    try {
        const response = await axios.get(API_URL);
        console.log('Respuesta recibida:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(tax => {
                const [id_impuesto, nombre_impuesto, porcentaje, nombre_pais, nombre_estado, creado_por, fecha_creacion, modificado_por, fecha_modificacion, accion] = tax;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${nombre_impuesto}</td>
                    <td>${porcentaje}</td>
                    <td>${nombre_pais}</td>
                    <td>${nombre_estado}</td>
                    <td>${creado_por}</td>
                    <td>${fecha_creacion}</td>
                    <td>${modificado_por}</td>
                    <td>${fecha_modificacion}</td>
                    <td>${accion}</td>
                    <td>
                        <button class="btn btn-warning btn-sm" onclick="editTax(${id_impuesto}, '${nombre_impuesto}', ${porcentaje}, '${nombre_pais}', '${nombre_estado}')">Editar</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar los impuestos:', err);
    }
};

// Cargar países para el campo de selección
const loadPaisesForSelect = async () => {
    const paisSelect = document.getElementById('editPais');
    if (!paisSelect) {
        console.error("No se encontró el campo de selección de países.");
        return;
    }

    // Limpiar las opciones existentes
    paisSelect.innerHTML = '';

    try {
        const response = await axios.get('http://localhost:3000/pais');
        console.log('Países recibidos:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(pais => {
                const [id_pais, nombre_pais] = pais;
                const option = document.createElement('option');
                option.value = id_pais;
                option.text = nombre_pais;
                paisSelect.appendChild(option);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar los países:', err);
    }
};

// Cargar estados para el campo de selección
const loadEstadosForSelect = async () => {
    const estadoSelect = document.getElementById('editEstado');
    if (!estadoSelect) {
        console.error("No se encontró el campo de selección de estados.");
        return;
    }

    // Limpiar las opciones existentes
    estadoSelect.innerHTML = '';

    try {
        const response = await axios.get('http://localhost:3000/estados');
        console.log('Estados recibidos:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(estado => {
                const [id_estado, nombre_estado] = estado;
                const option = document.createElement('option');
                option.value = id_estado;
                option.text = nombre_estado;
                estadoSelect.appendChild(option);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar los estados:', err);
    }
};

// Agregar eventos para cargar los países y estados cuando se muestra el modal de agregar/editar impuestos
document.getElementById('addTaxModal').addEventListener('show.bs.modal', () => {
    loadPaisesForSelect();
    loadEstadosForSelect();
});

// Manejar formulario de agregar/editar impuesto
const addTaxForm = document.getElementById('addTaxForm');
if (addTaxForm) {
    addTaxForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const taxId = document.getElementById('taxId').value;
        const nombre_impuesto = document.getElementById('editNombreImpuesto').value.trim();
        const porcentaje = document.getElementById('editPorcentaje').value;
        const id_pais = document.getElementById('editPais').value;
        const id_estado = document.getElementById('editEstado').value;

        try {
            if (taxId) {
                // Actualizar impuesto existente
                await axios.put(`${API_URL}/${taxId}`, {
                    nombre_impuesto,
                    porcentaje,
                    id_pais,
                    id_estado
                });

                // Después de actualizar, asegúrate de resetear el ID oculto
                document.getElementById('taxId').value = '';
            } else {
                // Crear un nuevo impuesto
                await axios.post(API_URL, {
                    nombre_impuesto,
                    porcentaje,
                    id_pais,
                    id_estado,
                    creado_por: 'PRUEBAS', // Usuario fijo para pruebas
                    accion: 'INSERT',
                });
            }

            // Resetear el formulario y cerrar el modal
            addTaxForm.reset();
            new bootstrap.Modal(document.getElementById('addTaxModal')).hide();

            // Recargar la lista de impuestos
            loadTaxes();
        } catch (err) {
            console.error('Error al guardar el impuesto:', err.response ? err.response.data : err);
        }
    });
} else {
    console.error('No se encontró el formulario de agregar/editar impuesto.');
}

// Editar impuesto
const editTax = (id_impuesto, nombre_impuesto, porcentaje, id_pais, id_estado) => {
    document.getElementById('taxId').value = id_impuesto; // Campo oculto para ID
    document.getElementById('editNombreImpuesto').value = nombre_impuesto; // Campo de nombre de impuesto
    document.getElementById('editPorcentaje').value = porcentaje; // Campo de porcentaje
    document.getElementById('editPais').value = id_pais; // Campo de país
    document.getElementById('editEstado').value = id_estado; // Campo de estado

    // Mostrar el modal de edición
    new bootstrap.Modal(document.getElementById('addTaxModal')).show();
};

// Inicializar carga de impuestos
document.addEventListener('DOMContentLoaded', loadTaxes);


