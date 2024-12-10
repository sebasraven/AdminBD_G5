const API_URL = 'http://localhost:3000/detalle_facturas';

// Cargar detalles de facturas al iniciar
const loadInvoiceDetails = async () => {
    const tableBody = document.getElementById('invoiceDetailTableBody');
    if (!tableBody) {
        console.error("No se encontró el cuerpo de la tabla de detalles de facturas.");
        return;
    }
    tableBody.innerHTML = ''; // Limpiar la tabla antes de agregar nuevas filas

    try {
        const response = await axios.get(API_URL);
        console.log('Respuesta recibida:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(detail => {
                const [
                    id_detalle_factura,
                    id_factura,
                    id_reservacion,
                    id_promocion,
                    nombre_moneda,
                    nombre_estado,
                    cantidad,
                    total_linea,
                    creado_por,
                    fecha_creacion,
                    modificado_por,
                    fecha_modificacion,
                    accion
                ] = detail;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${id_factura}</td>
                    <td>${id_reservacion}</td>
                    <td>${id_promocion}</td>
                    <td>${nombre_moneda}</td>
                    <td>${nombre_estado}</td>
                    <td>${cantidad}</td>
                    <td>${total_linea}</td>
                    <td>${creado_por}</td>
                    <td>${fecha_creacion}</td>
                    <td>${modificado_por}</td>
                    <td>${fecha_modificacion}</td>
                    <td>${accion}</td>
                    <td>
                        <button class="btn btn-success btn-sm" onclick="toggleState(${id_detalle_factura}, '${nombre_estado}')">
                            ${nombre_estado === 'Activo' ? 'Desactivar' : 'Activar'}
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="editInvoiceDetail(${id_detalle_factura}, ${id_factura}, ${id_reservacion}, ${id_promocion}, '${nombre_moneda}', '${cantidad}', ${total_linea})">Editar</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar los detalles de facturas:', err);
    }
};

// Cargar facturas para el campo de selección
const loadInvoicesForSelect = async () => {
    const invoiceSelect = document.getElementById('editFactura');
    if (!invoiceSelect) {
        console.error("No se encontró el campo de selección de facturas.");
        return;
    }

    // Limpiar las opciones existentes
    invoiceSelect.innerHTML = '';

    try {
        const response = await axios.get('http://localhost:3000/facturas');
        console.log('Facturas recibidas:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(invoice => {
                const [id_factura] = invoice;
                const nombre_factura = `Factura ${id_factura}`; // Crear un nombre de factura para mostrar
                const option = document.createElement('option');
                option.value = id_factura;
                option.text = nombre_factura;
                invoiceSelect.appendChild(option);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar las facturas:', err);
    }

    // Verificar el contenido del campo después de cargar las opciones
    console.log('Contenido del campo de selección de facturas:', invoiceSelect.innerHTML);
};



// Cargar reservaciones para el campo de selección
const loadReservationsForSelect = async () => {
    const reservationSelect = document.getElementById('editReservacion');
    if (!reservationSelect) {
        console.error("No se encontró el campo de selección de reservaciones.");
        return;
    }

    // Limpiar las opciones existentes
    reservationSelect.innerHTML = '';

    try {
        const response = await axios.get('http://localhost:3000/reservas');
        console.log('Reservaciones recibidas:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(reservation => {
                const { id_reservacion, nombre } = reservation; // Usar propiedades del objeto de respuesta
                const option = document.createElement('option');
                option.value = id_reservacion;
                option.text = nombre;
                reservationSelect.appendChild(option);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar las reservaciones:', err);
    }

    // Verificar el contenido del campo después de cargar las opciones
    console.log('Contenido del campo de selección de reservaciones:', reservationSelect.innerHTML);
};



// Cargar promociones para el campo de selección
const loadPromotionsForSelect = async () => {
    const promotionSelect = document.getElementById('editPromocion');
    if (!promotionSelect) {
        console.error("No se encontró el campo de selección de promociones.");
        return;
    }

    // Limpiar las opciones existentes
    promotionSelect.innerHTML = '';

    try {
        const response = await axios.get('http://localhost:3000/promociones');
        console.log('Promociones recibidas:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(promotion => {
                const [id_promocion, nombre_promocion] = promotion;
                const option = document.createElement('option');
                option.value = id_promocion;
                option.text = nombre_promocion;
                promotionSelect.appendChild(option);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar las promociones:', err);
    }

    // Verificar el contenido del campo después de cargar las opciones
    console.log('Contenido del campo de selección de promociones:', promotionSelect.innerHTML);
};



// Cargar monedas para el campo de selección
const loadCurrenciesForSelect = async () => {
    const currencySelect = document.getElementById('editMoneda');
    if (!currencySelect) {
        console.error("No se encontró el campo de selección de monedas.");
        return;
    }

    // Limpiar las opciones existentes
    currencySelect.innerHTML = '';

    try {
        const response = await axios.get('http://localhost:3000/monedas');
        console.log('Monedas recibidas:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(currency => {
                const [id_moneda, nombre_moneda] = currency;
                const option = document.createElement('option');
                option.value = id_moneda;
                option.text = nombre_moneda;
                currencySelect.appendChild(option);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar las monedas:', err);
    }

    // Verificar el contenido del campo después de cargar las opciones
    console.log('Contenido del campo de selección de monedas:', currencySelect.innerHTML);
};



// Manejar formulario de agregar/editar detalle de factura
const addInvoiceDetailForm = document.getElementById('addInvoiceDetailForm');
if (addInvoiceDetailForm) {
    addInvoiceDetailForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const invoiceDetailId = document.getElementById('invoiceDetailId').value;
        const id_factura = document.getElementById('editFactura').value;
        const id_reservacion = document.getElementById('editReservacion').value;
        const id_promocion = document.getElementById('editPromocion').value || null;
        const id_moneda = document.getElementById('editMoneda').value;
        const cantidad = document.getElementById('editCantidad').value;
        const total_linea = document.getElementById('editTotalLinea').value;

        try {
            if (invoiceDetailId) {
                // Actualizar detalle de factura existente
                await axios.put(`${API_URL}/${invoiceDetailId}`, {
                    id_factura,
                    id_reservacion,
                    id_promocion,
                    id_moneda,
                    cantidad,
                    total_linea
                });

                // Después de actualizar, asegúrate de resetear el ID oculto
                document.getElementById('invoiceDetailId').value = '';
            } else {
                // Crear un nuevo detalle de factura
                await axios.post(API_URL, {
                    id_factura,
                    id_reservacion,
                    id_promocion,
                    id_moneda,
                    cantidad,
                    total_linea,
                    creado_por: 'PRUEBAS', // Usuario fijo para pruebas
                    accion: 'INSERT',
                });
            }

            // Resetear el formulario y cerrar el modal
            addInvoiceDetailForm.reset();
            new bootstrap.Modal(document.getElementById('addInvoiceDetailModal')).hide();

            // Recargar la lista de detalles de facturas
            loadInvoiceDetails();
        } catch (err) {
            console.error('Error al guardar el detalle de factura:', err.response ? err.response.data : err);
        }
    });
} else {
    console.error('No se encontró el formulario de agregar/editar detalle de factura.');
}

// Editar detalle de factura
const editInvoiceDetail = (id_detalle_factura, id_factura, id_reservacion, id_promocion, id_moneda, cantidad, total_linea) => {
    document.getElementById('invoiceDetailId').value = id_detalle_factura; // Campo oculto para ID
    document.getElementById('editFactura').value = id_factura; // Campo de factura
    document.getElementById('editReservacion').value = id_reservacion; // Campo de reservación
    document.getElementById('editPromocion').value = id_promocion; // Campo de promoción
    document.getElementById('editMoneda').value = id_moneda; // Campo de moneda
    document.getElementById('editCantidad').value = cantidad; // Campo de cantidad
    document.getElementById('editTotalLinea').value = total_linea; // Campo de total línea

    // Mostrar el modal de edición
    new bootstrap.Modal(document.getElementById('addInvoiceDetailModal')).show();
};

// Activar/Desactivar estado del detalle de factura
const toggleState = async (id_detalle_factura, currentState) => {
    const newState = currentState === 'Activo' ? 'Inactivo' : 'Activo';

    try {
        await axios.put(`${API_URL}/toggleState/${id_detalle_factura}`, { newState });
        loadInvoiceDetails(); // Recargar la lista de detalles de facturas
    } catch (err) {
        console.error('Error al cambiar el estado del detalle de factura:', err.response ? err.response.data : err);
    }
};

// Inicializar carga de detalles de facturas y los campos de selección relacionados
document.addEventListener('DOMContentLoaded', () => {
    loadInvoiceDetails();
    loadInvoicesForSelect();
    loadReservationsForSelect();
    loadPromotionsForSelect();
    loadCurrenciesForSelect();
});






