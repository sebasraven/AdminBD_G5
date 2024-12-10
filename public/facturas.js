const API_URL = 'http://localhost:3000/facturas';

// Cargar facturas al iniciar
const loadInvoices = async () => {
    const tableBody = document.getElementById('invoiceTableBody');
    if (!tableBody) {
        console.error("No se encontró el cuerpo de la tabla de facturas.");
        return;
    }
    tableBody.innerHTML = ''; // Limpiar la tabla antes de agregar nuevas filas

    try {
        const response = await axios.get(API_URL);
        console.log('Respuesta recibida:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(invoice => {
                const [
                    id_factura,
                    nombre_moneda,
                    nombre_usuario,
                    nombre_impuesto,
                    nombre_promocion,
                    nombre_estado,
                    nombre_pais,
                    nombre_provincia,
                    nombre_canton,
                    nombre_distrito,
                    subtotal,
                    total,
                    creado_por,
                    fecha_creacion,
                    modificado_por,
                    fecha_modificacion,
                    accion
                ] = invoice;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${nombre_moneda}</td>
                    <td>${nombre_usuario}</td>
                    <td>${nombre_impuesto}</td>
                    <td>${nombre_promocion}</td>
                    <td>${nombre_estado}</td>
                    <td>${nombre_pais}</td>
                    <td>${nombre_provincia}</td>
                    <td>${nombre_canton}</td>
                    <td>${nombre_distrito}</td>
                    <td>${subtotal}</td>
                    <td>${total}</td>
                    <td>${creado_por}</td>
                    <td>${fecha_creacion}</td>
                    <td>${modificado_por}</td>
                    <td>${fecha_modificacion}</td>
                    <td>${accion}</td>
                    <td>
                        <button class="btn btn-success btn-sm" onclick="toggleState(${id_factura}, '${nombre_estado}')">
                            ${nombre_estado === 'Activo' ? 'Desactivar' : 'Activar'}
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="editInvoice(${id_factura}, '${nombre_moneda}', '${nombre_usuario}', '${nombre_impuesto}', '${nombre_promocion}', '${nombre_estado}', '${nombre_pais}', '${nombre_provincia}', '${nombre_canton}', '${nombre_distrito}', ${subtotal}, ${total})">Editar</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar las facturas:', err);
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

    // Verificar el contenido del campo después de cargar las opciones
    console.log('Contenido del campo de selección de monedas:', currencySelect.innerHTML);
};



// Cargar usuarios para el campo de selección
const loadUsersForSelect = async () => {
    const userSelect = document.getElementById('editUsuario');
    if (!userSelect) {
        console.error("No se encontró el campo de selección de usuarios.");
        return;
    }

    // Limpiar las opciones existentes
    userSelect.innerHTML = '';

    try {
        const response = await axios.get('http://localhost:3000/usuarios');
        console.log('Usuarios recibidos:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(user => {
                const [id_usuario, nombre_usuario] = user;
                const option = document.createElement('option');
                option.value = id_usuario;
                option.text = nombre_usuario;
                userSelect.appendChild(option);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar los usuarios:', err);
    }

    // Verificar el contenido del campo después de cargar las opciones
    console.log('Contenido del campo de selección de usuarios:', userSelect.innerHTML);
};


// Cargar impuestos para el campo de selección
const loadTaxesForSelect = async () => {
    const taxSelect = document.getElementById('editImpuesto');
    if (!taxSelect) {
        console.error("No se encontró el campo de selección de impuestos.");
        return;
    }

    // Limpiar las opciones existentes
    taxSelect.innerHTML = '';

    try {
        const response = await axios.get('http://localhost:3000/impuestos');
        console.log('Impuestos recibidos:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(tax => {
                const [id_impuesto, nombre_impuesto] = tax;
                const option = document.createElement('option');
                option.value = id_impuesto;
                option.text = nombre_impuesto;
                taxSelect.appendChild(option);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar los impuestos:', err);
    }

    // Verificar el contenido del campo después de cargar las opciones
    console.log('Contenido del campo de selección de impuestos:', taxSelect.innerHTML);
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


// Cargar estados para el campo de selección
const loadStatesForSelect = async () => {
    const stateSelect = document.getElementById('editEstado');
    if (!stateSelect) {
        console.error("No se encontró el campo de selección de estados.");
        return;
    }

    // Limpiar las opciones existentes
    stateSelect.innerHTML = '';

    try {
        const response = await axios.get('http://localhost:3000/estados');
        console.log('Estados recibidos:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(state => {
                const [id_estado, nombre_estado] = state;
                const option = document.createElement('option');
                option.value = id_estado;
                option.text = nombre_estado;
                stateSelect.appendChild(option);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar los estados:', err);
    }

    // Verificar el contenido del campo después de cargar las opciones
    console.log('Contenido del campo de selección de estados:', stateSelect.innerHTML);
};


// Cargar países para el campo de selección
const loadCountriesForSelect = async () => {
    const countrySelect = document.getElementById('editPais');
    if (!countrySelect) {
        console.error("No se encontró el campo de selección de países.");
        return;
    }

    // Limpiar las opciones existentes
    countrySelect.innerHTML = '';

    try {
        const response = await axios.get('http://localhost:3000/pais');
        console.log('Países recibidos:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(country => {
                const [id_pais, nombre_pais] = country;
                const option = document.createElement('option');
                option.value = id_pais;
                option.text = nombre_pais;
                countrySelect.appendChild(option);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar los países:', err);
    }

    // Verificar el contenido del campo después de cargar las opciones
    console.log('Contenido del campo de selección de países:', countrySelect.innerHTML);
};


// Cargar provincias para el campo de selección
const loadProvincesForSelect = async () => {
    const provinceSelect = document.getElementById('editProvincia');
    if (!provinceSelect) {
        console.error("No se encontró el campo de selección de provincias.");
        return;
    }

    // Limpiar las opciones existentes
    provinceSelect.innerHTML = '';

    try {
        const response = await axios.get('http://localhost:3000/provincia');
        console.log('Provincias recibidas:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(province => {
                const [id_provincia, nombre_provincia] = province;
                const option = document.createElement('option');
                option.value = id_provincia;
                option.text = nombre_provincia;
                provinceSelect.appendChild(option);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar las provincias:', err);
    }

    // Verificar el contenido del campo después de cargar las opciones
    console.log('Contenido del campo de selección de provincias:', provinceSelect.innerHTML);
};


// Cargar cantones para el campo de selección
const loadCantonsForSelect = async () => {
    const cantonSelect = document.getElementById('editCanton');
    if (!cantonSelect) {
        console.error("No se encontró el campo de selección de cantones.");
        return;
    }

    // Limpiar las opciones existentes
    cantonSelect.innerHTML = '';

    try {
        const response = await axios.get('http://localhost:3000/canton');
        console.log('Cantones recibidos:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(canton => {
                const [id_canton, nombre_canton] = canton;
                const option = document.createElement('option');
                option.value = id_canton;
                option.text = nombre_canton;
                cantonSelect.appendChild(option);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar los cantones:', err);
    }

    // Verificar el contenido del campo después de cargar las opciones
    console.log('Contenido del campo de selección de cantones:', cantonSelect.innerHTML);
};


// Cargar distritos para el campo de selección
const loadDistrictsForSelect = async () => {
    const districtSelect = document.getElementById('editDistrito');
    if (!districtSelect) {
        console.error("No se encontró el campo de selección de distritos.");
        return;
    }

    // Limpiar las opciones existentes
    districtSelect.innerHTML = '';

    try {
        const response = await axios.get('http://localhost:3000/distrito');
        console.log('Distritos recibidos:', response.data);

        if (Array.isArray(response.data)) {
            response.data.forEach(district => {
                const [id_distrito, nombre_distrito] = district;
                const option = document.createElement('option');
                option.value = id_distrito;
                option.text = nombre_distrito;
                districtSelect.appendChild(option);
            });
        } else {
            console.error('Los datos recibidos no son un array:', response.data);
        }
    } catch (err) {
        console.error('Error al cargar los distritos:', err);
    }

    // Verificar el contenido del campo después de cargar las opciones
    console.log('Contenido del campo de selección de distritos:', districtSelect.innerHTML);
};

// Manejar formulario de agregar/editar factura
const addInvoiceForm = document.getElementById('addInvoiceForm');
if (addInvoiceForm) {
    addInvoiceForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const invoiceId = document.getElementById('invoiceId').value;
        const id_moneda = document.getElementById('editMoneda').value;
        const id_usuario = document.getElementById('editUsuario').value;
        const id_impuesto = document.getElementById('editImpuesto').value;
        const id_promocion = document.getElementById('editPromocion').value || null;
        const id_estado = document.getElementById('editEstado').value;
        const id_pais = document.getElementById('editPais').value || null;
        const id_provincia = document.getElementById('editProvincia').value || null;
        const id_canton = document.getElementById('editCanton').value || null;
        const id_distrito = document.getElementById('editDistrito').value || null;
        const subtotal = document.getElementById('editSubtotal').value;
        const total = document.getElementById('editTotal').value;

        console.log(`id_promocion: ${id_promocion}, id_pais: ${id_pais}, id_provincia: ${id_provincia}, id_canton: ${id_canton}, id_distrito: ${id_distrito}`);

        try {
            if (invoiceId) {
                // Actualizar factura existente
                await axios.put(`${API_URL}/${invoiceId}`, {
                    id_moneda,
                    id_usuario,
                    id_impuesto,
                    id_promocion,
                    id_estado,
                    id_pais,
                    id_provincia,
                    id_canton,
                    id_distrito,
                    subtotal,
                    total
                });

                // Después de actualizar, asegúrate de resetear el ID oculto
                document.getElementById('invoiceId').value = '';
            } else {
                // Crear una nueva factura
                await axios.post(API_URL, {
                    id_moneda,
                    id_usuario,
                    id_impuesto,
                    id_promocion,
                    id_estado,
                    id_pais,
                    id_provincia,
                    id_canton,
                    id_distrito,
                    subtotal,
                    total,
                    creado_por: 'PRUEBAS', // Usuario fijo para pruebas
                    accion: 'INSERT',
                });
            }

            // Resetear el formulario y cerrar el modal
            addInvoiceForm.reset();
            new bootstrap.Modal(document.getElementById('addInvoiceModal')).hide();

            // Recargar la lista de facturas
            loadInvoices();
        } catch (err) {
            console.error('Error al guardar la factura:', err.response ? err.response.data : err);
        }
    });
} else {
    console.error('No se encontró el formulario de agregar/editar factura.');
}




// Editar factura
const editInvoice = (id_factura, id_moneda, id_usuario, id_impuesto, id_promocion, id_estado, id_pais, id_provincia, id_canton, id_distrito, subtotal, total) => {
    document.getElementById('invoiceId').value = id_factura; // Campo oculto para ID
    document.getElementById('editMoneda').value = id_moneda; // Campo de moneda
    document.getElementById('editUsuario').value = id_usuario; // Campo de usuario
    document.getElementById('editImpuesto').value = id_impuesto; // Campo de impuesto
    document.getElementById('editPromocion').value = id_promocion; // Campo de promoción
    document.getElementById('editEstado').value = id_estado; // Campo de estado
    document.getElementById('editPais').value = id_pais; // Campo de país
    document.getElementById('editProvincia').value = id_provincia; // Campo de provincia
    document.getElementById('editCanton').value = id_canton; // Campo de cantón
    document.getElementById('editDistrito').value = id_distrito; // Campo de distrito
    document.getElementById('editSubtotal').value = subtotal; // Campo de subtotal
    document.getElementById('editTotal').value = total; // Campo de total

    // Mostrar el modal de edición
    new bootstrap.Modal(document.getElementById('addInvoiceModal')).show();
};

// Activar/Desactivar estado de la factura
const toggleState = async (id_factura, currentState) => {
    const newState = currentState === 'Activo' ? 'Inactivo' : 'Activo';

    try {
        await axios.put(`${API_URL}/toggleState/${id_factura}`, { newState });
        loadInvoices(); // Recargar la lista de facturas
    } catch (err) {
        console.error('Error al cambiar el estado de la factura:', err.response ? err.response.data : err);
    }
};

// Inicializar carga de facturas y los campos de selección relacionados
document.addEventListener('DOMContentLoaded', () => {
    loadInvoices();
    loadCurrenciesForSelect();
    loadUsersForSelect();
    loadTaxesForSelect();
    loadPromotionsForSelect();
    loadStatesForSelect();
    loadCountriesForSelect();
    loadProvincesForSelect();
    loadCantonsForSelect();
    loadDistrictsForSelect();
});

