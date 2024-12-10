const API_URL = 'http://localhost:3000/tipo_cambio';

// Cargar tipo de cambio al iniciar
const loadExchangeRates = async () => {
    const tableBody = document.getElementById('exchangeRateTableBody');
    if (!tableBody) {
        console.error("No se encontró el cuerpo de la tabla de tipo de cambio.");
        return;
    }
    tableBody.innerHTML = ''; // Limpiar la tabla antes de agregar nuevas filas

    try {
        const response = await axios.get(API_URL);
        console.log('Respuesta recibida:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(exchangeRate => {
                const [id_tipo_cambio, nombre_moneda, fecha, tasa_cambio, creado_por, fecha_creacion, modificado_por, fecha_modificacion, accion] = exchangeRate;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${nombre_moneda}</td>
                    <td>${fecha.split('T')[0]}</td>
                    <td>${tasa_cambio}</td>
                    <td>${creado_por}</td>
                    <td>${fecha_creacion}</td>
                    <td>${modificado_por}</td>
                    <td>${fecha_modificacion}</td>
                    <td>${accion}</td>
                    <td>
                        <button class="btn btn-warning btn-sm" onclick="editExchangeRate(${id_tipo_cambio}, '${nombre_moneda}', '${fecha}', ${tasa_cambio})"> Editar </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar los tipos de cambio:', err);
    }
};

// Cargar monedas para el campo de selección
const loadMonedasForSelect = async () => {
    const monedaSelect = document.getElementById('editMoneda');
    if (!monedaSelect) {
        console.error("No se encontró el campo de selección de monedas.");
        return;
    }

    // Limpiar las opciones existentes
    monedaSelect.innerHTML = '';

    try {
        const response = await axios.get('http://localhost:3000/monedas');
        console.log('Monedas recibidas:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(moneda => {
                const [id_moneda, codigo_moneda, nombre_moneda] = moneda;
                const option = document.createElement('option');
                option.value = id_moneda;
                option.text = nombre_moneda;
                monedaSelect.appendChild(option);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar las monedas:', err);
    }
};

// Agregar evento para cargar las monedas cuando se muestra el modal de agregar/editar tipo de cambio
document.getElementById('addExchangeRateModal').addEventListener('show.bs.modal', (event) => {
    if (!event.relatedTarget) { // Solo cargar las monedas si el modal no se ha cargado antes en la misma sesión
        loadMonedasForSelect();
    }
});

// Manejar formulario de agregar/editar tipo de cambio
const addExchangeRateForm = document.getElementById('addExchangeRateForm');
if (addExchangeRateForm) {
    addExchangeRateForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const exchangeRateId = document.getElementById('exchangeRateId').value;
        const id_moneda = document.getElementById('editMoneda').value;
        const fecha = document.getElementById('editFecha').value;
        const tasa_cambio = document.getElementById('editTasaCambio').value;

        try {
            if (exchangeRateId) {
                // Actualizar tipo de cambio existente
                await axios.put(`${API_URL}/${exchangeRateId}`, {
                    id_moneda,
                    fecha,
                    tasa_cambio
                });

                // Después de actualizar, asegúrate de resetear el ID oculto
                document.getElementById('exchangeRateId').value = '';
            } else {
                // Crear un nuevo tipo de cambio
                await axios.post(API_URL, {
                    id_moneda,
                    fecha,
                    tasa_cambio,
                    creado_por: 'PRUEBAS', // Usuario fijo para pruebas
                    accion: 'INSERT',
                });
            }

            // Resetear el formulario y cerrar el modal
            addExchangeRateForm.reset();
            new bootstrap.Modal(document.getElementById('addExchangeRateModal')).hide();

            // Recargar la lista de tipos de cambio
            loadExchangeRates();
        } catch (err) {
            console.error('Error al guardar el tipo de cambio:', err.response ? err.response.data : err);
        }
    });
} else {
    console.error('No se encontró el formulario de agregar/editar tipo de cambio.');
}

// Editar tipo de cambio
const editExchangeRate = (id_tipo_cambio, nombre_moneda, fecha, tasa_cambio) => {
    document.getElementById('exchangeRateId').value = id_tipo_cambio; // Campo oculto para ID
    document.getElementById('editMoneda').value = nombre_moneda; // Campo de moneda
    document.getElementById('editFecha').value = fecha.split('T')[0]; // Campo de fecha
    document.getElementById('editTasaCambio').value = tasa_cambio; // Campo de tasa de cambio

    // Mostrar el modal de edición
    new bootstrap.Modal(document.getElementById('addExchangeRateModal')).show();
};

// Inicializar carga de tipos de cambio
document.addEventListener('DOMContentLoaded', loadExchangeRates);
