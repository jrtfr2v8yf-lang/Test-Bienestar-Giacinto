import { Storage } from './storage.js';
import { Canvas } from './canvas.js';

const TEXTOS = {
    'Masaje General (AMTA)': 'Declaro que entiendo que el masaje terapéutico es para fines de bienestar, relajación y alivio muscular. Reconozco que no reemplaza un examen ni diagnóstico médico. Acepto la política de cancelación de 24 horas. Entiendo que tengo derecho a detener la sesión en cualquier momento. Confirmo que se me han explicado los límites profesionales establecidos por la AMTA.',
    'Aromaterapia': 'Entiendo que se utilizarán aceites esenciales puros durante la sesión. Declaro no tener alergias cutáneas o respiratorias conocidas a los aceites esenciales. Entiendo que debo informar cualquier sensibilidad olfativa o reacción adversa durante la sesión.',
    'Terapia Craneosacral': 'Entiendo que la terapia craneosacral es una técnica de manipulación sutil del sistema cráneo-sacro que implica una presión muy ligera. Desmiento cualquier expectativa de presión fuerte o manipulación ósea agresiva. Declaro no tener presión intracraneal elevada, aneurismas ni condiciones que contraindiquen esta técnica.',
    'Masaje Tailandés': 'Entiendo que el masaje tailandés incluye estiramientos pasivos asistidos, presiones profundas, movilizaciones articulares y trabajo en el suelo con ropa cómoda. Me comprometo a comunicar mis límites de flexibilidad y cualquier molestia durante los estiramientos.',
    'Masaje Prenatal': 'Entiendo que hay zonas reflejas contraindicadas durante el embarazo. Libero al terapeuta de responsabilidad por reacciones adversas relacionadas con dichas zonas.'
};

const CONTRAINDICACIONES = [
    'Fiebre', 'Inflamación aguda', 'Enfermedades contagiosas', 'Fracturas recientes', 
    'Trombosis / Flebitis', 'Cáncer (en tratamiento activo)', 'Presión arterial no controlada',
    'Heridas abiertas o quemaduras', 'Varices severas'
];

export const Consentimientos = {
    container: null,

    render(container) {
        this.container = container;
        this.showSelection();
    },

    // ============================================================
    // MODO TERAPEUTA: genera el link y se lo envía al cliente
    // ============================================================

    showSelection() {
        this.container.innerHTML = `
            <h2>Nuevo Consentimiento</h2>

            <div class="card" style="border: 2px solid var(--primary-medium); background: var(--primary-very-light);">
                <h3>🔗 Generar Link para Cliente</h3>
                <p style="font-size: 0.9rem; margin-bottom: 1rem;">
                    Genera un enlace único y envíalo por WhatsApp a tu cliente.
                    El cliente abrirá el enlace, llenará sus datos, firmará 
                    y te devolverá el consentimiento firmado automáticamente.
                </p>
                <div class="form-group">
                    <label>Tipo de Consentimiento</label>
                    <select id="gen-consent-type">
                        ${Object.keys(TEXTOS).map(t => `<option value="${t}">${t}</option>`).join('')}
                    </select>
                </div>
                <button class="btn btn-whatsapp" id="btn-generate-link" style="margin-top: 0.5rem;">
                    🔗 Generar Link y Enviar por WhatsApp
                </button>
            </div>

            <div class="card">
                <h4 style="margin-bottom: 0.5rem;">📋 Historial de Consentimientos Enviados</h4>
                <div id="consent-history-list">
                    ${this.renderHistory()}
                </div>
            </div>
        `;

        document.getElementById('btn-generate-link').onclick = () => {
            const tipo = document.getElementById('gen-consent-type').value;
            const config = Storage.get('therapist_config');
            
            if (!config || !config.whatsapp) {
                return alert('Primero configure su número de WhatsApp en Ajustes ⚙️');
            }

            // Generar URL única con el tipo de consentimiento
            const baseUrl = window.location.href.split('?')[0].split('#')[0];
            const link = `${baseUrl}?tipo=${encodeURIComponent(tipo)}`;

            // Guardar en historial
            const historial = Storage.get('consent_links') || [];
            historial.push({
                id: Date.now().toString(),
                tipo,
                link,
                fecha: new Date().toISOString(),
                completado: false
            });
            Storage.save('consent_links', historial);

            // Mensaje para el cliente
            const message = `Hola 👋\n\n` +
                `Soy *Giacinto Schiavone — Master LMT*.\n\n` +
                `Te envío el enlace para tu *Consentimiento Informado* de *${tipo}*:\n\n` +
                `🔗 ${link}\n\n` +
                `📱 *Instrucciones:*\n` +
                `1. Abre el enlace ↑\n` +
                `2. Lee la declaración\n` +
                `3. Marca tus contraindicaciones (si aplica)\n` +
                `4. Firma con tu dedo en la pantalla\n` +
                `5. Presiona "📱 Enviar Firmado a mi Terapeuta"\n\n` +
                `Si son varios miembros de tu familia, reenvíales este mensaje\n` +
                `para que cada uno complete su propio consentimiento.\n\n` +
                `_Terapias Corporales Ayurveda & Yoga_\n` +
                `_Giacinto Schiavone — Master LMT_`;

            const encodedMsg = encodeURIComponent(message);
            const waUrl = `https://wa.me/${config.whatsapp.replace(/\D/g, '')}?text=${encodedMsg}`;
            window.open(waUrl, '_blank');

            // Actualizar historial
            const listEl = document.getElementById('consent-history-list');
            if (listEl) listEl.innerHTML = this.renderHistory();
            
            alert(`✅ Link generado. Se abrirá WhatsApp para que envíes el enlace a tu cliente.\n\nPuedes copiar el link manualmente:\n${link}`);
        };
    },

    renderHistory() {
        const historial = Storage.get('consent_links') || [];
        if (historial.length === 0) {
            return '<p style="opacity: 0.6; font-size: 0.9rem;">Aún no has enviado ningún consentimiento.</p>';
        }
        return historial.slice().reverse().map(h => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; border-bottom: 1px solid var(--bg-light); gap: 0.5rem; flex-wrap: wrap;">
                <div>
                    <strong>${h.tipo}</strong>
                    <small style="display: block; opacity: 0.6;">${new Date(h.fecha).toLocaleString()}</small>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <span style="font-size: 0.8rem; padding: 0.25rem 0.5rem; border-radius: 4px; background: ${h.completado ? 'var(--primary-very-light)' : '#fff3cd'};">
                        ${h.completado ? '✅ Completado' : '⏳ Pendiente'}
                    </span>
                </div>
            </div>
        `).join('');
    },

    // ============================================================
    // MODO CLIENTE: el cliente llena y firma desde su celular
    // ============================================================

    renderPublic(container, tipo) {
        this.container = container;
        const isPrenatal = tipo === 'Masaje Prenatal';

        container.innerHTML = `
            <div class="card" style="margin-top: 1rem;">
                <h2 style="margin-bottom: 0.5rem;">Consentimiento Informado</h2>
                <p style="font-size: 0.9rem; opacity: 0.8; margin-bottom: 1rem;">
                    Complete sus datos y firme digitalmente para autorizar la sesión.
                </p>
                <hr>
            </div>

            <div class="card">
                <h3>👤 Sus Datos</h3>
                <div class="form-group">
                    <label>Nombre Completo</label>
                    <input type="text" id="client-nombre" placeholder="Su nombre completo" required>
                </div>
                <div class="form-group">
                    <label>Teléfono de Contacto</label>
                    <input type="tel" id="client-telefono" placeholder="Su número de WhatsApp" required>
                </div>
            </div>

            <div class="card">
                <h3>🩺 Evaluación Previa (obligatorio)</h3>
                
                <div class="form-group">
                    <label>¿Está tomando algún medicamento? ¿Cuáles?</label>
                    <textarea id="eval-medicamentos" placeholder="Ej: Losartán 50mg, Metformina..." rows="2" required></textarea>
                </div>

                <div class="form-group">
                    <label>¿Ha tenido lesiones recientemente? ¿Cuáles?</label>
                    <textarea id="eval-lesiones" placeholder="Ej: Esguince de tobillo hace 2 semanas..." rows="2" required></textarea>
                </div>

                <div class="form-group">
                    <label>¿Tiene dolor específico? ¿Dónde?</label>
                    <textarea id="eval-dolor" placeholder="Ej: Dolor lumbar derecho, hombro izquierdo..." rows="2" required></textarea>
                </div>

                <div class="form-group">
                    <label>Tipo de presión que prefiere</label>
                    <select id="eval-presion" required>
                        <option value="">-- Seleccione --</option>
                        <option value="Ligera">🪶 Ligera (relajación suave)</option>
                        <option value="Media">✊ Media (terapéutica moderada)</option>
                        <option value="Fuerte">💪 Fuerte (descontracturante profunda)</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>¿Es alérgico a los aceites esenciales?</label>
                    <select id="eval-alergia" required>
                        <option value="">-- Seleccione --</option>
                        <option value="No">No</option>
                        <option value="Sí, a algunos">Sí, a algunos (especifique abajo)</option>
                        <option value="No estoy seguro">No estoy seguro</option>
                    </select>
                    <input type="text" id="eval-alergia-cual" placeholder="Si respondió sí, ¿a cuáles?" style="margin-top: 0.5rem;">
                </div>

                <div class="form-group">
                    <label>¿Está embarazada o sospecha estarlo?</label>
                    <select id="eval-embarazo" required>
                        <option value="">-- Seleccione --</option>
                        <option value="No">No</option>
                        <option value="Sí">Sí</option>
                        <option value="N/A">No aplica / Masculino</option>
                    </select>
                </div>

                <div id="eval-embarazo-detalles" style="display: none;">
                    <div class="form-group">
                        <label>Semanas de gestación:</label>
                        <input type="number" id="eval-embarazo-semanas" placeholder="Ej: 24" style="width: 120px;">
                    </div>
                    <div class="form-group">
                        <label style="font-weight: normal; font-size: 0.95rem; display: flex; align-items: flex-start; gap: 0.6rem; line-height: 1.4;">
                            <input type="checkbox" id="eval-embarazo-autorizacion" style="flex-shrink: 0; margin-top: 0.2rem; width: 1.1rem; height: 1.1rem; accent-color: #2d6a4f;">
                            <span style="flex: 1;">Adjunto autorización médica (requerida para embarazos de alto riesgo)</span>
                        </label>
                    </div>
                </div>

                <div class="form-group">
                    <label>¿Desde cuándo no recibe masaje profesional?</label>
                    <select id="eval-ultimo-masaje" required>
                        <option value="">-- Seleccione --</option>
                        <option value="Nunca ha recibido">Nunca ha recibido</option>
                        <option value="Menos de 1 mes">Menos de 1 mes</option>
                        <option value="Entre 1 y 3 meses">Entre 1 y 3 meses</option>
                        <option value="Entre 3 y 6 meses">Entre 3 y 6 meses</option>
                        <option value="Entre 6 meses y 1 año">Entre 6 meses y 1 año</option>
                        <option value="Más de 1 año">Más de 1 año</option>
                        <option value="No recuerda">No recuerda</option>
                    </select>
                </div>
            </div>

            <div class="card">
                <h3>📄 ${tipo}</h3>
                <div style="margin-bottom: 1rem; padding: 1rem; background: var(--primary-very-light); border-radius: 8px;">
                    <p style="white-space: pre-line; font-size: 0.9rem;">${TEXTOS[tipo]}</p>
                </div>

                <h4 style="margin: 1.5rem 0 0.5rem;">Contraindicaciones (marque si presenta alguna):</h4>
                <div id="contra-grid" style="display: flex; flex-direction: column; gap: 0.5rem;">
                    ${CONTRAINDICACIONES.map(c => `
                        <label style="font-weight: normal; font-size: 0.95rem; display: flex; align-items: flex-start; gap: 0.6rem; line-height: 1.4; padding: 0.25rem 0;">
                            <input type="checkbox" name="contra" value="${c}" style="flex-shrink: 0; margin-top: 0.2rem; width: 1.1rem; height: 1.1rem; accent-color: #2d6a4f;">
                            <span style="flex: 1; word-break: break-word;">${c}</span>
                        </label>
                    `).join('')}
                </div>
            </div>

            <div class="card">
                <h4 style="margin-bottom: 0.5rem;">✍️ Firma Digital</h4>
                <p style="font-size: 0.85rem; opacity: 0.7; margin-bottom: 1rem;">
                    Firme con su dedo en el recuadro de abajo
                </p>
                <div class="canvas-container">
                    <canvas id="signature-pad-client"></canvas>
                </div>
                <button class="btn btn-secondary btn-sm" id="btn-clear-sig-client">Limpiar Firma</button>
            </div>

            <div class="card" style="text-align: center;">
                <button class="btn btn-whatsapp" id="btn-send-to-therapist" style="font-size: 1.4rem; padding: 1.5rem;">
                    📱 Enviar Firmado a mi Terapeuta
                </button>
                <p style="font-size: 0.8rem; opacity: 0.6; margin-top: 0.75rem;">
                    Al presionar el botón, se abrirá WhatsApp con su consentimiento listo para enviar
                </p>
            </div>
        `;

        const sig = Canvas.init('signature-pad-client');

        // Manejo de la visibilidad de los detalles de embarazo
        const evalEmbarazoSelect = document.getElementById('eval-embarazo');
        const evalEmbarazoDetalles = document.getElementById('eval-embarazo-detalles');
        if (evalEmbarazoSelect && evalEmbarazoDetalles) {
            evalEmbarazoSelect.onchange = () => {
                if (evalEmbarazoSelect.value === 'Sí') {
                    evalEmbarazoDetalles.style.display = 'block';
                    document.getElementById('eval-embarazo-semanas').required = true;
                } else {
                    evalEmbarazoDetalles.style.display = 'none';
                    document.getElementById('eval-embarazo-semanas').required = false;
                    document.getElementById('eval-embarazo-semanas').value = '';
                    document.getElementById('eval-embarazo-autorizacion').checked = false;
                }
            };

            // Si es Masaje Prenatal, pre-seleccionar "Sí" y deshabilitar para obligarlo
            if (tipo === 'Masaje Prenatal') {
                evalEmbarazoSelect.value = 'Sí';
                evalEmbarazoSelect.disabled = true;
                evalEmbarazoDetalles.style.display = 'block';
                document.getElementById('eval-embarazo-semanas').required = true;
            }
        }

        document.getElementById('btn-clear-sig-client').onclick = () => sig.clear();

        document.getElementById('btn-send-to-therapist').onclick = () => {
            const nombre = document.getElementById('client-nombre').value.trim();
            const telefono = document.getElementById('client-telefono').value.trim();
            const checkboxes = this.container.querySelectorAll('input[name="contra"]:checked');
            const contraindicaciones = Array.from(checkboxes).map(cb => cb.value);

            if (!nombre) return alert('Por favor, ingrese su nombre completo.');
            if (!telefono) return alert('Por favor, ingrese su número de teléfono.');
            if (sig.isEmpty()) return alert('Por favor, firme en el recuadro antes de enviar.');

            // Obtener campos de Evaluación Previa
            const medicamentos = document.getElementById('eval-medicamentos').value.trim();
            const lesiones = document.getElementById('eval-lesiones').value.trim();
            const dolor = document.getElementById('eval-dolor').value.trim();
            const presion = document.getElementById('eval-presion').value;
            const alergia = document.getElementById('eval-alergia').value;
            const alergiaCual = document.getElementById('eval-alergia-cual').value.trim();
            const embarazo = document.getElementById('eval-embarazo').value;
            const embarazoSemanas = document.getElementById('eval-embarazo-semanas').value.trim();
            const embarazoAutorizacion = document.getElementById('eval-embarazo-autorizacion').checked;
            const ultimoMasaje = document.getElementById('eval-ultimo-masaje').value;

            if (!medicamentos) return alert('Por favor, responda si toma medicamentos.');
            if (!lesiones) return alert('Por favor, responda si ha tenido lesiones recientes.');
            if (!dolor) return alert('Por favor, responda si tiene algún dolor específico.');
            if (!presion) return alert('Por favor, seleccione el tipo de presión preferido.');
            if (!alergia) return alert('Por favor, responda si tiene alergia a aceites.');
            if (alergia === 'Sí, a algunos' && !alergiaCual) return alert('Por favor, especifique a qué aceites esenciales es alérgico.');
            if (!embarazo) return alert('Por favor, responda si está embarazada.');
            if (embarazo === 'Sí' && !embarazoSemanas) return alert('Por favor, indique las semanas de gestación.');
            if (!ultimoMasaje) return alert('Por favor, seleccione cuándo fue su último masaje.');

            const date = new Date().toLocaleDateString();
            const contraText = contraindicaciones.length > 0 
                ? `Contraindicaciones: ${contraindicaciones.join(', ')}.` 
                : 'Sin contraindicaciones.';

            const evalAlergiaText = alergia === 'Sí, a algunos' ? `Sí (a: ${alergiaCual})` : alergia;
            const evalEmbarazoText = embarazo === 'Sí' 
                ? `Sí (${embarazoSemanas} semanas)${embarazoAutorizacion ? ' [Con autorización médica]' : ' [Sin autorización médica]'}` 
                : embarazo;

            // La firma como texto base64
            const firmaData = sig.getDataURL();

            const message = `*CONSENTIMIENTO INFORMADO FIRMADO*\n\n` +
                `*Terapeuta:* Giacinto Schiavone — Master LMT\n` +
                `*Cliente:* ${nombre}\n` +
                `*Teléfono:* ${telefono}\n` +
                `*Tipo:* ${tipo}\n` +
                `*Fecha:* ${date}\n\n` +
                `*🩺 EVALUACIÓN PREVIA:*\n` +
                `• Alergias aceites: ${evalAlergiaText}\n` +
                `• Presión preferida: ${presion}\n` +
                `• Lesiones recientes: ${lesiones}\n` +
                `• ¿Está embarazada?: ${evalEmbarazoText}\n` +
                `• Último masaje: ${ultimoMasaje}\n` +
                `• Dolor específico: ${dolor}\n` +
                `• Medicamentos: ${medicamentos}\n\n` +
                `*Declaración:*\n${TEXTOS[tipo]}\n\n` +
                `*${contraText}*\n\n` +
                `*Firma Digital:*\nFirmado digitalmente por ${nombre} el ${date}.\n\n` +
                `_Documento generado desde el enlace de consentimiento._`;

            // Guardar el consentimiento en localStorage del cliente (para su referencia)
            try {
                const localConsents = JSON.parse(localStorage.getItem('mis_consentimientos') || '[]');
                localConsents.push({
                    nombre, telefono, tipo, fecha: date,
                    contraindicaciones, extraInfo: `Semanas: ${embarazoSemanas || 'N/A'}. Aut: ${embarazoAutorizacion ? 'Sí' : 'No'}`, firmaData,
                    evaluacion: {
                        medicamentos, lesiones, dolor, presion,
                        alergia: evalAlergiaText, embarazo: evalEmbarazoText, ultimoMasaje
                    }
                });
                localStorage.setItem('mis_consentimientos', JSON.stringify(localConsents));
            } catch(e) {}

            // Abrir WhatsApp para enviar AL TERAPEUTA
            const config = Storage.get('therapist_config');
            const telefonoTerapeuta = (config && config.whatsapp) ? config.whatsapp.replace(/\D/g, '') : '18326878443';
            const encodedMsg = encodeURIComponent(message);
            const waUrl = `https://wa.me/${telefonoTerapeuta}?text=${encodedMsg}`;
            window.open(waUrl, '_blank');

            alert(`✅ ¡Gracias ${nombre}! Su consentimiento ha sido preparado.\n\nSe abrirá WhatsApp para que lo envíe a su terapeuta. Solo presione "Enviar".`);
        };
    }
};