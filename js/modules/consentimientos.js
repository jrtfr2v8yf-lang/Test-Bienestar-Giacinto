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
                <h3>📄 ${tipo}</h3>
                <div style="margin-bottom: 1rem; padding: 1rem; background: var(--primary-very-light); border-radius: 8px;">
                    <p style="white-space: pre-line; font-size: 0.9rem;">${TEXTOS[tipo]}</p>
                </div>

                ${isPrenatal ? `
                    <div class="form-group">
                        <label>Semanas de gestación:</label>
                        <input type="number" id="prenatal-weeks" placeholder="Ej: 24" style="width: 100px;">
                    </div>
                    <div class="form-group">
                        <label style="font-weight: normal; font-size: 0.9rem; display: flex; align-items: center; gap: 0.5rem;">
                            <input type="checkbox" id="prenatal-auth"> Adjunto autorización médica (si embarazo de alto riesgo)
                        </label>
                    </div>
                ` : ''}

                <h4 style="margin: 1.5rem 0 0.5rem;">Contraindicaciones (marque si presenta alguna):</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                    ${CONTRAINDICACIONES.map(c => `
                        <label style="font-weight: normal; font-size: 0.9rem; display: flex; align-items: center; gap: 0.5rem;">
                            <input type="checkbox" name="contra" value="${c}"> ${c}
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

        document.getElementById('btn-clear-sig-client').onclick = () => sig.clear();

        document.getElementById('btn-send-to-therapist').onclick = () => {
            const nombre = document.getElementById('client-nombre').value.trim();
            const telefono = document.getElementById('client-telefono').value.trim();
            const checkboxes = this.container.querySelectorAll('input[name="contra"]:checked');
            const contraindicaciones = Array.from(checkboxes).map(cb => cb.value);

            if (!nombre) return alert('Por favor, ingrese su nombre completo.');
            if (!telefono) return alert('Por favor, ingrese su número de teléfono.');
            if (sig.isEmpty()) return alert('Por favor, firme en el recuadro antes de enviar.');

            const date = new Date().toLocaleDateString();
            const contraText = contraindicaciones.length > 0 
                ? `Contraindicaciones: ${contraindicaciones.join(', ')}.` 
                : 'Sin contraindicaciones.';

            let extraInfo = '';
            if (tipo === 'Masaje Prenatal') {
                const weeks = document.getElementById('prenatal-weeks')?.value || '';
                const auth = document.getElementById('prenatal-auth')?.checked || false;
                extraInfo = `Semanas: ${weeks || 'N/A'}. Autorización médica: ${auth ? 'Sí' : 'No'}.`;
            }

            // La firma como texto base64 (se incluye en el mensaje)
            const firmaData = sig.getDataURL();

            const message = `*CONSENTIMIENTO INFORMADO FIRMADO*\n\n` +
                `*Terapeuta:* Giacinto Schiavone — Master LMT\n` +
                `*Cliente:* ${nombre}\n` +
                `*Teléfono:* ${telefono}\n` +
                `*Tipo:* ${tipo}\n` +
                `*Fecha:* ${date}\n\n` +
                `*Declaración:*\n${TEXTOS[tipo]}\n\n` +
                `*${contraText}*\n` +
                `${extraInfo ? `*${extraInfo}*\n` : ''}\n\n` +
                `*Firma Digital:*\nFirmado digitalmente por ${nombre} el ${date}.\n\n` +
                `_Documento generado desde el enlace de consentimiento._`;

            // Guardar el consentimiento en localStorage del cliente (para su referencia)
            try {
                const localConsents = JSON.parse(localStorage.getItem('mis_consentimientos') || '[]');
                localConsents.push({
                    nombre, telefono, tipo, fecha: date,
                    contraindicaciones, extraInfo, firmaData
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