const API_URL = 'http://localhost:3000/monedas';

// Cargar monedas al iniciar
const loadCurrencies = async () => {
    const tableBody = document.getElementById('currencyTableBody');
    if (!tableBody) {
        console.error("No se encontró el cuerpo de la tabla de monedas.");
        return;
    }
    tableBody.innerHTML = ''; // Limpiar la tabla antes de agregar nuevas filas

    try {
        const response = await axios.get(API_URL);
        console.log('Respuesta recibida:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(currency => {
                const [id_moneda, codigo_moneda, nombre_moneda, nombre_estado, creado_por, fecha_creacion, modificado_por, fecha_modificacion, accion] = currency;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${codigo_moneda}</td>
                    <td>${nombre_moneda}</td>
                    <td>${nombre_estado}</td>
                    <td>${creado_por}</td>
                    <td>${fecha_creacion}</td>
                    <td>${modificado_por}</td>
                    <td>${fecha_modificacion}</td>
                    <td>${accion}</td>
                    <td>
                        <button class="btn btn-success btn-sm" onclick="toggleState(${id_moneda}, '${nombre_estado}', '${codigo_moneda}', '${nombre_moneda}')">
                            ${nombre_estado === 'Activo' ? 'Desactivar' : 'Activar'}
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="editCurrency(${id_moneda}, '${codigo_moneda}', '${nombre_moneda}')"> Editar </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar las monedas:', err);
    }
};

// Manejar formulario de agregar/editar moneda
const addCurrencyForm = document.getElementById('addCurrencyForm');
if (addCurrencyForm) {
    addCurrencyForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const currencyId = document.getElementById('currencyId').value;
        const codigo_moneda = document.getElementById('editCodigoMoneda').value.trim();
        const nombre_moneda = document.getElementById('editNombreMoneda').value.trim();

        try {
            if (currencyId) {
                // Actualizar moneda existente
                const nuevo_estado = 1; // Valor predeterminado para mantener el estado actual
                await axios.put(`${API_URL}/${currencyId}`, { 
                    codigo_moneda, 
                    nombre_moneda,
                    nuevo_estado 
                });

                // Después de actualizar, asegúrate de resetear el ID oculto
                document.getElementById('currencyId').value = '';
            } else {
                // Crear una nueva moneda
                await axios.post(API_URL, {
                    codigo_moneda,
                    nombre_moneda,
                    id_estado: 1, // Por defecto, nueva moneda está en estado "Activo"
                    creado_por: 'PRUEBAS', // Usuario fijo para pruebas
                    accion: 'INSERT',
                });
            }

            // Resetear el formulario y cerrar el modal
            addCurrencyForm.reset();
            new bootstrap.Modal(document.getElementById('addCurrencyModal')).hide();

            // Recargar la lista de monedas
            loadCurrencies();
        } catch (err) {
            console.error('Error al guardar la moneda:', err.response ? err.response.data : err);
        }
    });
} else {
    console.error('No se encontró el formulario de agregar/editar moneda.');
}

// Editar moneda
const editCurrency = (id_moneda, codigo_moneda, nombre_moneda) => {
    document.getElementById('currencyId').value = id_moneda; // Campo oculto para ID
    document.getElementById('editCodigoMoneda').value = codigo_moneda; // Campo de código de moneda
    document.getElementById('editNombreMoneda').value = nombre_moneda; // Campo de nombre de moneda

    // Mostrar el modal de edición
    new bootstrap.Modal(document.getElementById('addCurrencyModal')).show();
};

// Cambiar el estado
const toggleState = async (id_moneda, estado_actual, codigo_moneda, nombre_moneda) => {
    try {
        // Determinar el nuevo estado (1 = Activo, 2 = Inactivo)
        const nuevo_estado = estado_actual === 'Activo' ? 2 : 1;

        console.log(`Cambiando estado de moneda ${id_moneda} a ${nuevo_estado}`);

        // Realizar la solicitud PUT al servidor con la URL correcta
        const response = await axios.put(`${API_URL}/${id_moneda}`, {
            codigo_moneda,
            nombre_moneda,
            nuevo_estado,
        });

        console.log(`Estado actualizado correctamente: ${response.data}`);

        // Recargar la lista de monedas
        loadCurrencies();
    } catch (err) {
        console.error('Error al cambiar el estado de la moneda:', err.response ? err.response.data : err);
    }
};

// Inicializar carga de monedas
document.addEventListener('DOMContentLoaded', loadCurrencies);
