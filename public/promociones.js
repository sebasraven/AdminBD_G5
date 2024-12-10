const API_URL = 'http://localhost:3000/promociones';

// Cargar promociones al iniciar
const loadPromotions = async () => {
    const tableBody = document.getElementById('promotionTableBody');
    if (!tableBody) {
        console.error("No se encontró el cuerpo de la tabla de promociones.");
        return;
    }
    tableBody.innerHTML = ''; // Limpiar la tabla antes de agregar nuevas filas

    try {
        const response = await axios.get(API_URL);
        console.log('Respuesta recibida:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(promotion => {
                const [
                    id_promocion,
                    tipo_promocion,
                    nombre_reservacion,
                    nombre_moneda,
                    descripcion,
                    nombre_promocion,
                    fecha_inicio,
                    fecha_fin,
                    porcentaje_promocion,
                    descuento,
                    nombre_estado,
                    creado_por,
                    fecha_creacion,
                    modificado_por,
                    fecha_modificacion,
                    accion
                ] = promotion;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${tipo_promocion}</td>
                    <td>${nombre_reservacion}</td>
                    <td>${nombre_moneda}</td>
                    <td>${descripcion}</td>
                    <td>${nombre_promocion}</td>
                    <td>${fecha_inicio}</td>
                    <td>${fecha_fin}</td>
                    <td>${porcentaje_promocion}</td>
                    <td>${descuento}</td>
                    <td>${nombre_estado}</td>
                    <td>${creado_por}</td>
                    <td>${fecha_creacion}</td>
                    <td>${modificado_por}</td>
                    <td>${fecha_modificacion}</td>
                    <td>${accion}</td>
                    <td>
                        <button class="btn btn-success btn-sm" onclick="toggleState(${id_promocion}, '${nombre_estado}')">
                            ${nombre_estado === 'Activo' ? 'Desactivar' : 'Activar'}
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="editPromotion(${id_promocion}, '${tipo_promocion}', '${nombre_reservacion}', '${nombre_moneda}', '${descripcion}', '${nombre_promocion}', '${fecha_inicio}', '${fecha_fin}', ${porcentaje_promocion}, ${descuento})">Editar</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar las promociones:', err);
    }
};



// Cargar tipos de promoción para el campo de selección
const loadPromoTypesForSelect = async () => {
    const promoTypeSelect = document.getElementById('editTipoPromocion');
    if (!promoTypeSelect) {
        console.error("No se encontró el campo de selección de tipos de promoción.");
        return;
    }

    // Limpiar las opciones existentes
    promoTypeSelect.innerHTML = '';

    try {
        const response = await axios.get('http://localhost:3000/tipo_promocion');
        console.log('Tipos de promoción recibidos:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(promoType => {
                const [id_tipo_promocion, nombre] = promoType;
                const option = document.createElement('option');
                option.value = id_tipo_promocion;
                option.text = nombre;
                promoTypeSelect.appendChild(option);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar los tipos de promoción:', err);
    }
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
                const { id_reservacion, nombre } = reservation;
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
};

// Manejar formulario de agregar/editar promoción
const addPromotionForm = document.getElementById('addPromotionForm');
if (addPromotionForm) {
    addPromotionForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const promotionId = document.getElementById('promotionId').value;
        const id_tipo_promocion = document.getElementById('editTipoPromocion').value;
        const id_reservacion = document.getElementById('editReservacion').value;
        const id_moneda = document.getElementById('editMoneda').value;
        const descripcion = document.getElementById('editDescripcion').value.trim();
        const nombre_promocion = document.getElementById('editNombrePromocion').value.trim();
        const fecha_inicio = document.getElementById('editFechaInicio').value;
        const fecha_fin = document.getElementById('editFechaFin').value;
        const porcentaje_promocion = document.getElementById('editPorcentajePromocion').value;
        const descuento = document.getElementById('editDescuento').value;

        try {
            if (promotionId) {
                // Actualizar promoción existente
                await axios.put(`${API_URL}/${promotionId}`, {
                    id_tipo_promocion,
                    id_reservacion,
                    id_moneda,
                    descripcion,
                    nombre_promocion,
                    fecha_inicio,
                    fecha_fin,
                    porcentaje_promocion,
                    descuento
                });

                // Después de actualizar, asegúrate de resetear el ID oculto
                document.getElementById('promotionId').value = '';
            } else {
                // Crear una nueva promoción
                await axios.post(API_URL, {
                    id_tipo_promocion,
                    id_reservacion,
                    id_moneda,
                    descripcion,
                    nombre_promocion,
                    fecha_inicio,
                    fecha_fin,
                    porcentaje_promocion,
                    descuento,
                    creado_por: 'PRUEBAS', // Usuario fijo para pruebas
                    accion: 'INSERT',
                });
            }

            // Resetear el formulario y cerrar el modal
            addPromotionForm.reset();
            new bootstrap.Modal(document.getElementById('addPromotionModal')).hide();

            // Recargar la lista de promociones
            loadPromotions();
        } catch (err) {
            console.error('Error al guardar la promoción:', err.response ? err.response.data : err);
        }
    });
} else {
    console.error('No se encontró el formulario de agregar/editar promoción.');
}

const editPromotion = (id_promocion, tipo_promocion, nombre_reservacion, nombre_moneda, descripcion, nombre_promocion, fecha_inicio, fecha_fin, porcentaje_promocion, descuento) => {
    document.getElementById('promotionId').value = id_promocion; // Campo oculto para ID
    document.getElementById('editTipoPromocion').value = tipo_promocion; // Campo de tipo de promoción
    document.getElementById('editReservacion').value = nombre_reservacion; // Campo de reservación
    document.getElementById('editMoneda').value = nombre_moneda; // Campo de moneda
    document.getElementById('editDescripcion').value = descripcion; // Campo de descripción
    document.getElementById('editNombrePromocion').value = nombre_promocion; // Campo de nombre de promoción
    document.getElementById('editFechaInicio').value = fecha_inicio; // Campo de fecha de inicio
    document.getElementById('editFechaFin').value = fecha_fin; // Campo de fecha de fin
    document.getElementById('editPorcentajePromocion').value = porcentaje_promocion; // Campo de porcentaje de promoción
    document.getElementById('editDescuento').value = descuento; // Campo de descuento

    // Mostrar el modal de edición
    new bootstrap.Modal(document.getElementById('addPromotionModal')).show();
};



// Activar/Desactivar estado de la promoción
const toggleState = async (id_promocion, currentState) => {
    const newState = currentState === 'Activo' ? 'Inactivo' : 'Activo';

    try {
        await axios.put(`${API_URL}/toggleState/${id_promocion}`, { newState });
        loadPromotions(); // Recargar la lista de promociones
    } catch (err) {
        console.error('Error al cambiar el estado de la promoción:', err.response ? err.response.data : err);
    }
};

// Inicializar carga de promociones y los campos de selección relacionados
document.addEventListener('DOMContentLoaded', () => {
    loadPromotions();
    loadPromoTypesForSelect();
    loadReservationsForSelect();
    loadCurrenciesForSelect();
});
