// 1. Conexión
const pb = new PocketBase('http://127.0.0.1:8090');
let ordenActualId = null;

// --- TEMA CLARO / OSCURO ---
const btnTema = document.getElementById('btn-tema');
function aplicarTema() {
    const tema = localStorage.getItem('tema') || 'light';
    if (tema === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        btnTema.textContent = 'Modo Claro';
    } else {
        document.documentElement.removeAttribute('data-theme');
        btnTema.textContent = 'Modo Oscuro';
    }
}
btnTema.addEventListener('click', () => {
    const esOscuro = document.documentElement.getAttribute('data-theme') === 'dark';
    localStorage.setItem('tema', esOscuro ? 'light' : 'dark');
    aplicarTema();
});
aplicarTema();

// --- NAVEGACIÓN ---
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.vista').forEach(v => v.classList.remove('activa'));
        e.target.classList.add('active');
        document.getElementById(`vista-${e.target.dataset.view}`).classList.add('activa');
        
        if(e.target.dataset.view === 'ordenes') cargarOrdenes();
        if(e.target.dataset.view === 'inventario') cargarInventario();
        if(e.target.dataset.view === 'reportes') cargarReportes();
    });
});

// --- VERIFICAR STOCK BAJO (MEJORA 2) ---
async function verificarStockBajo() {
    try {
        const repuestos = await pb.collection('repuestos').getFullList();
        const bajos = repuestos.filter(r => r.existencias <= 5);
        const btnInv = document.querySelector('[data-view="inventario"]');
        
        // Limpiar badge anterior
        const badgeAnterior = btnInv.querySelector('.badge-stock');
        if (badgeAnterior) badgeAnterior.remove();

        if (bajos.length > 0) {
            btnInv.insertAdjacentHTML('beforeend', `<span class="badge-stock" style="background:var(--danger);color:white;border-radius:50%;padding:2px 6px;font-size:0.7rem;margin-left:4px;">${bajos.length}</span>`);
        }
    } catch (e) { console.error(e); }
}

// --- CARGAR ÓRDENES ---
async function cargarOrdenes() {
    const contenedor = document.getElementById('lista-ordenes');
    const verTodas = document.getElementById('chk-ver-todas').checked;
    contenedor.innerHTML = '<p class="empty-msg">Cargando...</p>';
    try {
        let ordenes = await pb.collection('ordenes').getFullList();
        
        if (!verTodas) {
            ordenes = ordenes.filter(o => o.estado !== 'entregada' && o.estado !== 'cancelada');
        }

        contenedor.innerHTML = '';
        if(ordenes.length === 0) {
            contenedor.innerHTML = '<p class="empty-msg">No hay órdenes que mostrar.</p>';
            return;
        }

        for (const o of ordenes) {
            let nombreCliente = 'Desconocido';
            let datosVehiculo = 'Sin vehículo';

            if (o.vehiculo) {
                try {
                    const veh = await pb.collection('vehiculos').getOne(o.vehiculo);
                    datosVehiculo = `${veh.marca} ${veh.modelo} (${veh.matricula})`;
                    if (veh.cliente) {
                        try {
                            const cli = await pb.collection('clientes').getOne(veh.cliente);
                            nombreCliente = cli.nombre;
                        } catch(e){}
                    }
                } catch(e){}
            }

            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <h3>${o.problema}</h3>
                <p><strong>Cliente:</strong> ${nombreCliente}</p>
                <p><strong>Vehículo:</strong> ${datosVehiculo}</p>
                <p><strong>Mecánico:</strong> ${o.mecanico || 'Sin asignar'}</p>
                <p><strong>Estado:</strong> ${o.estado}</p>
                <button class="btn btn-ver-detalle" data-id="${o.id}">Ver Detalle</button>
            `;
            contenedor.appendChild(card);
        }

        document.querySelectorAll('.btn-ver-detalle').forEach(btn => {
            btn.addEventListener('click', () => abrirDetalle(btn.dataset.id));
        });
    } catch (error) {
        contenedor.innerHTML = '<p class="empty-msg">Error al cargar órdenes.</p>';
        console.error(error);
    }
}

document.getElementById('chk-ver-todas').addEventListener('change', cargarOrdenes);

// --- CARGAR INVENTARIO ---
async function cargarInventario() {
    const contenedor = document.getElementById('lista-repuestos');
    contenedor.innerHTML = '<p class="empty-msg">Cargando...</p>';
    try {
        const repuestos = await pb.collection('repuestos').getFullList();
        contenedor.innerHTML = '';
        repuestos.forEach(r => {
            const alerta = r.existencias <= 5 ? '<p class="alerta-stock">⚠️ ¡Bajo stock! Reordenar.</p>' : '';
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <h3>${r.nombre}</h3>
                <p><strong>Código:</strong> ${r.codigo}</p>
                <p><strong>Precio:</strong> $${r.precio_venta}</p>
                <p><strong>Existencias:</strong> ${r.existencias}</p>
                ${alerta}
            `;
            contenedor.appendChild(card);
        });
    } catch (error) {
        contenedor.innerHTML = '<p class="empty-msg">Error al cargar inventario.</p>';
        console.error(error);
    }
}

// --- FORMULARIO INGRESO ---
document.getElementById('form-ingreso').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.querySelector('#form-ingreso .btn');
    const msg = document.getElementById('mensaje-form');
    btn.disabled = true; btn.textContent = 'Guardando...';

    try {
        const cliente = await pb.collection('clientes').create({
            nombre: document.getElementById('cli-nombre').value,
            telefono: document.getElementById('cli-telefono').value,
            direccion: document.getElementById('cli-direccion').value,
        });

        const vehiculo = await pb.collection('vehiculos').create({
            matricula: document.getElementById('veh-matricula').value,
            marca: document.getElementById('veh-marca').value,
            modelo: document.getElementById('veh-modelo').value,
            anio: parseInt(document.getElementById('veh-anio').value) || 0,
            kilometraje: parseInt(document.getElementById('veh-km').value) || 0,
            cliente: cliente.id
        });

        await pb.collection('ordenes').create({
            problema: document.getElementById('ord-problema').value,
            estado: "recibida",
            fecha_entrada: new Date().toISOString(),
            mecanico: document.getElementById('ord-mecanico').value,
            vehiculo: vehiculo.id
        });

        msg.style.color = 'var(--success)';
        msg.textContent = '✅ ¡Ingreso registrado con éxito!';
        document.getElementById('form-ingreso').reset();
        cargarOrdenes();
        verificarStockBajo();

        // MEJORA 5: Desaparecer mensaje
        setTimeout(() => { msg.textContent = ''; }, 3000);
    } catch (error) {
        msg.style.color = 'var(--danger)';
        msg.textContent = 'Error al guardar. Revisa la consola.';
        console.error(error);
    } finally {
        btn.disabled = false; btn.textContent = 'Crear Orden';
    }
});

// --- REPORTES ---
async function cargarReportes() {
    const ordenes = await pb.collection('ordenes').getFullList();
    const abiertas = ordenes.filter(o => o.estado !== 'entregada' && o.estado !== 'cancelada');
    
    // Carga por mecánico
    const mecanicos = {};
    abiertas.forEach(o => {
        const m = o.mecanico || 'Sin asignar';
        mecanicos[m] = (mecanicos[m] || 0) + 1;
    });
    const divMec = document.getElementById('rep-mecanicos');
    divMec.innerHTML = '';
    if (Object.keys(mecanicos).length === 0) divMec.innerHTML = '<p class="empty-msg">No hay órdenes abiertas.</p>';
    else {
        for (const [mec, cant] of Object.entries(mecanicos)) {
            divMec.innerHTML += `<div class="reporte-item"><span>${mec}</span><span class="cantidad">${cant} órdenes</span></div>`;
        }
    }

    // Clientes con deuda
    const clientes = await pb.collection('clientes').getFullList();
    const trabajos = await pb.collection('trabajos').getFullList();
    const repuestosUsados = await pb.collection('repuestos_usados').getFullList();
    const pagos = await pb.collection('pagos').getFullList();
    const repuestos = await pb.collection('repuestos').getFullList();
    const vehiculos = await pb.collection('vehiculos').getFullList();

    const deudasPorCliente = {};
    clientes.forEach(c => deudasPorCliente[c.id] = { nombre: c.nombre, deuda: 0 });

    for (const o of ordenes) {
        let totalOrden = 0;
        trabajos.filter(t => t.orden === o.id).forEach(t => totalOrden += t.precio);
        repuestosUsados.filter(r => r.orden === o.id).forEach(ru => {
            const rep = repuestos.find(r => r.id === ru.repuesto);
            if (rep) totalOrden += rep.precio_venta * ru.cantidad;
        });
        const totalPagado = pagos.filter(p => p.orden === o.id).reduce((s, p) => s + p.monto, 0);
        const saldo = totalOrden - totalPagado;

        if (saldo > 0) {
            const veh = vehiculos.find(v => v.id === o.vehiculo);
            if (veh && deudasPorCliente[veh.cliente]) {
                deudasPorCliente[veh.cliente].deuda += saldo;
            }
        }
    }

    const divDeudas = document.getElementById('rep-deudas');
    divDeudas.innerHTML = '';
    const conDeuda = Object.values(deudasPorCliente).filter(c => c.deuda > 0);
    if (conDeuda.length === 0) divDeudas.innerHTML = '<p class="empty-msg">No hay deudas pendientes.</p>';
    else {
        conDeuda.forEach(c => {
            divDeudas.innerHTML += `<div class="reporte-item"><span>${c.nombre}</span><span class="monto">$${c.deuda.toFixed(2)}</span></div>`;
        });
    }

    // Repuestos por agotarse
    const divStock = document.getElementById('rep-stock');
    divStock.innerHTML = '';
    const bajos = repuestos.filter(r => r.existencias <= 5);
    if (bajos.length === 0) divStock.innerHTML = '<p class="empty-msg">Todo el inventario está en orden.</p>';
    else {
        bajos.forEach(r => {
            divStock.innerHTML += `<div class="reporte-item"><span>${r.nombre}</span><span class="cantidad">${r.existencias} und.</span></div>`;
        });
    }

    // Facturación total
    let facturacion = 0;
    trabajos.forEach(t => facturacion += t.precio);
    repuestosUsados.forEach(ru => {
        const rep = repuestos.find(r => r.id === ru.repuesto);
        if (rep) facturacion += rep.precio_venta * ru.cantidad;
    });
    document.getElementById('rep-facturacion').innerHTML = `
        <p style="font-size: 2rem; font-weight: bold; color: var(--primary);">$${facturacion.toFixed(2)}</p>
        <p style="color: var(--text-muted); font-size: 0.9rem;">Total facturado (histórico)</p>
    `;
}

// --- MODAL DETALLE ---
async function abrirDetalle(ordenId) {
    ordenActualId = ordenId;
    const modal = document.getElementById('modal-detalle');
    modal.classList.remove('oculto');

    const o = await pb.collection('ordenes').getOne(ordenId);
    let nombreCliente = 'Desconocido';
    let datosVehiculo = 'Sin vehículo';

    if (o.vehiculo) {
        try {
            const veh = await pb.collection('vehiculos').getOne(o.vehiculo);
            datosVehiculo = `${veh.marca} ${veh.modelo} (${veh.matricula})`;
            if (veh.cliente) {
                try {
                    const cli = await pb.collection('clientes').getOne(veh.cliente);
                    nombreCliente = cli.nombre;
                } catch(e){}
            }
        } catch(e){}
    }

    document.getElementById('detalle-titulo').textContent = `Orden: ${o.problema}`;
    document.getElementById('detalle-info').innerHTML = `
        <h3>${o.problema}</h3>
        <p><strong>Cliente:</strong> ${nombreCliente}</p>
        <p><strong>Vehículo:</strong> ${datosVehiculo}</p>
        <p><strong>Mecánico:</strong> ${o.mecanico || 'Sin asignar'}</p>
        <p><strong>Estado:</strong> ${o.estado}</p>
    `;

    // Selector de estado
    const estadoSelect = document.createElement('select');
    estadoSelect.innerHTML = `
        <option value="recibida">Recibida</option>
        <option value="en diagnóstico">En diagnóstico</option>
        <option value="en reparación">En reparación</option>
        <option value="lista para entregar">Lista para entregar</option>
        <option value="entregada">Entregada</option>
        <option value="cancelada">Cancelada</option>
    `;
    estadoSelect.value = o.estado;
    estadoSelect.id = 'select-estado';
    estadoSelect.style.marginTop = '0.5rem';
    estadoSelect.addEventListener('change', async () => {
        await pb.collection('ordenes').update(ordenId, { estado: estadoSelect.value });
        cargarOrdenes();
        // Refrescar modal si cambia a cerrada
        if (estadoSelect.value === 'entregada' || estadoSelect.value === 'cancelada') {
            abrirDetalle(ordenId);
        }
    });
    document.getElementById('detalle-info').appendChild(estadoSelect);

    // MEJORA 1: BOTÓN DE HISTORIAL
    const btnHistorial = document.createElement('button');
    btnHistorial.className = 'btn';
    btnHistorial.style.marginTop = '1rem';
    btnHistorial.style.background = 'var(--text-muted)';
    btnHistorial.textContent = 'Ver Historial de este Vehículo';
    btnHistorial.addEventListener('click', async () => {
        if (!o.vehiculo) return alert('Esta orden no tiene vehículo asignado.');
        
        const historial = await pb.collection('ordenes').getFullList({
            filter: `vehiculo="${o.vehiculo}"`
        });
        
        let html = '<div class="seccion-detalle" style="margin-top:1rem;"><h4>Historial del Vehículo</h4><ul>';
        historial.forEach(h => {
            html += `<li><span>${h.problema}</span><span>${h.estado}</span></li>`;
        });
        html += '</ul></div>';
        
        btnHistorial.insertAdjacentHTML('afterend', html);
        btnHistorial.disabled = true;
        btnHistorial.textContent = 'Historial Cargado';
    });
    document.getElementById('detalle-info').appendChild(btnHistorial);

    // MEJORA 3: MODO SOLO LECTURA
    const esCerrada = o.estado === 'entregada' || o.estado === 'cancelada';
    if (esCerrada) {
        setTimeout(() => {
            document.querySelectorAll('#modal-detalle input, #modal-detalle select, #modal-detalle button:not(#btn-cerrar-detalle):not(#select-estado)').forEach(el => {
                el.disabled = true;
                el.style.opacity = '0.5';
                el.style.cursor = 'not-allowed';
            });
            document.getElementById('detalle-titulo').innerHTML += ' <span style="font-size:0.8rem;color:var(--danger);">(CERRADA)</span>';
        }, 100);
    }

    // Llenar select repuestos
    const repuestos = await pb.collection('repuestos').getFullList();
    const select = document.getElementById('repuesto-select');
    select.innerHTML = '<option value="">Selecciona un repuesto...</option>';
    repuestos.forEach(r => {
        select.innerHTML += `<option value="${r.id}">${r.nombre} - $${r.precio_venta} (Stock: ${r.existencias})</option>`;
    });

    cargarListasDetalle();
}

async function cargarListasDetalle() {
    const oId = ordenActualId;
    const div = document.getElementById('detalle-listas');
    div.innerHTML = '<p class="empty-msg">Cargando...</p>';

    const trabajos = await pb.collection('trabajos').getFullList({ filter: `orden="${oId}"` });
    const usados = await pb.collection('repuestos_usados').getFullList({ filter: `orden="${oId}"` });
    const pagos = await pb.collection('pagos').getFullList({ filter: `orden="${oId}"` });
    const todosRepuestos = await pb.collection('repuestos').getFullList();

    let total = 0;
    let html = '';

    html += '<div class="seccion-detalle"><h4>🔧 Trabajos (Mano de obra)</h4>';
    if (trabajos.length === 0) html += '<p class="empty-msg">No hay trabajos registrados.</p>';
    else {
        html += '<ul>';
        trabajos.forEach(t => {
            html += `<li><span>${t.descripcion}</span><span>$${t.precio}</span></li>`;
            total += t.precio;
        });
        html += '</ul>';
    }
    html += '</div>';

    html += '<div class="seccion-detalle"><h4>📦 Repuestos Usados</h4>';
    if (usados.length === 0) html += '<p class="empty-msg">No hay repuestos registrados.</p>';
    else {
        html += '<ul>';
        usados.forEach(u => {
            const rep = todosRepuestos.find(r => r.id === u.repuesto);
            const precio = rep ? rep.precio_venta * u.cantidad : 0;
            html += `<li><span>${rep ? rep.nombre : 'Repuesto'} x${u.cantidad}</span><span>$${precio.toFixed(2)}</span></li>`;
            total += precio;
        });
        html += '</ul>';
    }
    html += '</div>';

    let totalPagado = 0;
    html += '<div class="seccion-detalle"><h4>💵 Pagos Registrados</h4>';
    if (pagos.length === 0) html += '<p class="empty-msg">No hay pagos registrados.</p>';
    else {
        html += '<ul>';
        pagos.forEach(p => {
            html += `<li><span>Pago</span><span>$${p.monto}</span></li>`;
            totalPagado += p.monto;
        });
        html += '</ul>';
    }
    html += '</div>';

    const saldo = total - totalPagado;
    html += `
        <div class="total-box"><span>Total Orden:</span><span>$${total.toFixed(2)}</span></div>
        <div class="total-box" style="background:var(--success);"><span>Pagado:</span><span>$${totalPagado.toFixed(2)}</span></div>
        <div class="total-box" style="background:${saldo > 0 ? 'var(--danger)' : 'var(--primary)'};"><span>Saldo Pendiente:</span><span>$${saldo.toFixed(2)}</span></div>
    `;

    div.innerHTML = html;
}

// --- EVENTOS MODAL ---
document.getElementById('btn-cerrar-detalle').addEventListener('click', () => {
    document.getElementById('modal-detalle').classList.add('oculto');
    ordenActualId = null;
});

document.getElementById('btn-agregar-trabajo').addEventListener('click', async () => {
    const desc = document.getElementById('trabajo-desc').value.trim();
    const precio = parseFloat(document.getElementById('trabajo-precio').value);
    if (!desc || isNaN(precio) || precio <= 0) { alert('Ingresa descripción y precio válido'); return; }
    try {
        await pb.collection('trabajos').create({ descripcion: desc, precio: precio, orden: ordenActualId });
        document.getElementById('trabajo-desc').value = '';
        document.getElementById('trabajo-precio').value = '';
        cargarListasDetalle();
    } catch (e) { console.error(e); alert('Error al guardar trabajo'); }
});

document.getElementById('btn-agregar-repuesto').addEventListener('click', async () => {
    const repId = document.getElementById('repuesto-select').value;
    const cant = parseInt(document.getElementById('repuesto-cantidad').value);
    if (!repId || isNaN(cant) || cant <= 0) { alert('Selecciona repuesto y cantidad válida'); return; }
    try {
        await pb.collection('repuestos_usados').create({ cantidad: cant, orden: ordenActualId, repuesto: repId });
        document.getElementById('repuesto-cantidad').value = 1;
        document.getElementById('repuesto-select').value = '';
        cargarListasDetalle();
        verificarStockBajo();
    } catch (e) { console.error(e); alert('Error al guardar repuesto. Revisa el stock.'); }
});

document.getElementById('btn-agregar-pago').addEventListener('click', async () => {
    const monto = parseFloat(document.getElementById('pago-monto').value);
    if (isNaN(monto) || monto <= 0) { alert('Ingresa un monto válido'); return; }
    try {
        await pb.collection('pagos').create({ monto: monto, fecha: new Date().toISOString(), orden: ordenActualId });
        document.getElementById('pago-monto').value = '';
        cargarListasDetalle();
    } catch (e) { console.error(e); alert('Error al guardar pago'); }
});

// MEJORA 4: ATAJOS DE TECLADO (Escape)
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.getElementById('modal-detalle').classList.add('oculto');
        ordenActualId = null;
    }
});

// --- INICIO ---
cargarOrdenes();
verificarStockBajo();