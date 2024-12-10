const API_URL = 'http://localhost:3000/moneda';

// Cargar monedas al iniciar
const loadCurrencies = async () => {
    const tableBody = document.getElementById('currencyTableBody');
    if (!tableBody) {
        console.error("No se encontró el cuerpo de la tabla de monedas.");
        return;
    }
    tableBody.innerHTML = '';

    try {
        const response = await axios.get(API_URL);
        if (Array.isArray(response.data)) {
            response.data.forEach(currency => {
                const [id_moneda, codigo_moneda, nombre_moneda, estado_nombre, creado_por, fecha_creacion, modificado_por, fecha_modificacion, accion] = currency;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${codigo_moneda}</td>
                    <td>${nombre_moneda}</td>
                    <td>${estado_nombre}</td>
                    <td>${creado_por}</td>
                    <td>${fecha_creacion}</td>
                    <td>${modificado_por}</td>
                    <td>${fecha_modificacion}</td>
                    <td>${accion}</td>
                    <td>
                        <button class="btn btn-success btn-sm" onclick="toggleState(${id_moneda}, '${estado_nombre}', '${nombre_moneda}')">
                            ${estado_nombre === 'Activo' ? 'Desactivar' : 'Activar'}
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="editCurrency(${id_moneda}, '${codigo_moneda}', '${nombre_moneda}')">Editar</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        }
    } catch (err) {
        console.error('Error al cargar las monedas:', err);
    }
};

// Manejar formulario de agregar/editar moneda
document.getElementById('addCurrencyForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const currencyId = document.getElementById('currencyId').value;
    const codigo_moneda = document.getElementById('editCodigo').value.trim();
    const nombre_moneda = document.getElementById('editNombre').value.trim();

    try {
        if (currencyId) {
            await axios.put(`${API_URL}/${currencyId}`, { codigo_moneda, nombre_moneda });
        } else {
            await axios.post(API_URL, { codigo_moneda, nombre_moneda, id_estado: 1 });
        }

        document.getElementById('addCurrencyForm').reset();
        new bootstrap.Modal(document.getElementById('addCurrencyModal')).hide();
        loadCurrencies();
    } catch (err) {
        console.error('Error al guardar la moneda:', err);
    }
});

// Editar moneda
const editCurrency = (id_moneda, codigo_moneda, nombre_moneda) => {
    document.getElementById('currencyId').value = id_moneda;
    document.getElementById('editCodigo').value = codigo_moneda;
    document.getElementById('editNombre').value = nombre_moneda;
    new bootstrap.Modal(document.getElementById('addCurrencyModal')).show();
};

// Cambiar estado
const toggleState = async (id_moneda, estado_actual, nombre_moneda) => {
    const nuevo_estado = estado_actual === 'Activo' ? 2 : 1;

    try {
        await axios.put(`${API_URL}/${id_moneda}`, { nuevo_estado });
        loadCurrencies();
    } catch (err) {
        console.error('Error al cambiar el estado:', err);
    }
};

// Inicializar carga de monedas
document.addEventListener('DOMContentLoaded', loadCurrencies);