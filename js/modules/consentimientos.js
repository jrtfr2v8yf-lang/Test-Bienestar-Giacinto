import { Storage } from './storage.js';
import { Canvas } from './canvas.js';

export const Consentimientos = {
    textos: {
        'Masaje General (AMTA)': 'Declaro que entiendo que el masaje terapéutico es para fines de bienestar, relajación y alivio muscular. Reconozco que no reemplaza un examen ni diagnóstico médico. Acepto la política de cancelación de 24 horas. Entiendo que tengo derecho a detener la sesión en cualquier momento. Confirmo que se me han explicado los límites profesionales establecidos por la AMTA.',
        'Aromaterapia': 'Entiendo que se utilizarán aceites esenciales puros durante la sesión. Declaro no tener alergias cutáneas o respiratorias conocidas a los aceites esenciales. Entiendo que debo informar cualquier sensibilidad olfativa o reacción adversa durante la sesión.',
        'Terapia Craneosacral': 'Entiendo que la terapia craneosacral es una técnica de manipulación sutil del sistema cráneo-sacro que implica una presión muy ligera. Desmiento cualquier expectativa de presión fuerte o manipulación ósea agresiva. Declaro no tener presión intracraneal elevada, aneurismas ni condiciones que contraindiquen esta técnica.',
        'Masaje Tailandés': 'Entiendo que el masaje tailandés incluye estiramientos pasivos asistidos, presiones profundas, movilizaciones articulares y trabajo en el suelo con ropa cómoda. Me comprometo a comunicar mis límites de flexibilidad y cualquier molestia durante los estiramientos.',
        'Masaje Prenatal': 'Entiendo que hay zonas reflejas contraindicadas durante el embarazo. Libero al terapeuta de responsabilidad por reacciones adversas relacionadas con dichas zonas.'
    },

    contraindicaciones: [
        'Fiebre', 'Inflamación aguda', 'Enfermedades contagiosas', 'Fracturas recientes', 
        'Trombosis / Flebitis', 'Cáncer (en tratamiento activo)', 'Presión arterial no controlada',
        'Heridas abiertas o quemaduras', 'Varices severas'
    ],

    render(container) {
        this.container = container;
        this.showSelection();
    },

    // Obtener o crear cliente: si ya existe por teléfono, lo reuse;
    // si es nuevo, lo registra automáticamente.
    getOrCreateClient(nombre, telefono) {
        const clients = Storage.getClients();
        const existente = clients.find(c => 
            c.telefono && telefono && c.telefono.replace(/\D/g, '') === telefono.replace(/\D/g, '')
        );
        if (existente) return existente;

        // Crear cliente nuevo automáticamente
        const nuevo = Storage.addClient({
            nombre: nombre.trim(),
            telefono: telefono.trim(),
            email: '',
            fechaNacimiento: '',
            contactoEmergencia: ''
        });
        return nuevo;
    },

    showSelection() {
        const clients = Storage.getClients();
        this.container.innerHTML = `
            <h2>Nuevo Consentimiento</h2>
            
            <div class="card" style="border: 2px solid var(--primary-medium);">
                <h3 style="margin-bottom: 1rem;">👤 Datos del Cliente</h3>
                <div class="form-group">
                    <label>Nombre del Cliente</label>
                    <input type="text" id="consent-nombre" placeholder="Nombre completo" required>
                </div>
                <div class="form-group">
                    <label>Teléfono (para enviar el consentimiento)</label>
                    <input type="tel" id="consent-telefono" placeholder="Ej: 5551234567" required>
                    <small>Si el cliente ya existe, se usará su registro actual.</small>
                </div>
                <hr style="margin: 1rem 0;">
                <p style="font-size: 0.85rem; opacity: 0.7;">O selecciona un cliente existente:</p>
                <div class="form-group">
                    <select id="consent-client-existing">
                        <option value="">-- Cliente existente (opcional) --</option>
                        ${clients.map(c => `<option value="${c.id}">${c.nombre} — ${c.telefono}</option>`).join('')}
                    </select>
                </div>
            </div>

            <div class="card">
                <div class="form-group">
                    <label>Tipo de Consentimiento</label>
                    <select id="consent-type">
                        ${Object.keys(this.textos).map(tipo => `<option value="${tipo}">${tipo}</option>`).join('')}
                    </select>
                </div>
                <button class="btn btn-whatsapp" id="btn-next-consent" style="margin-top: 0.5rem;">
                    📝 Continuar al Formulario
                </button>
            </div>
        `;

        // Si selecciona un cliente existente, auto-completar nombre y teléfono
        document.getElementById('consent-client-existing').onchange = (e) => {
            const id = e.target.value;
            if (id) {
                const c = clients.find(cl => cl.id === id);
                if (c) {
                    document.getElementById('consent-nombre').value = c.nombre;
                    document.getElementById('consent-telefono').value = c.telefono;
                }
            }
        };

        document.getElementById('btn-next-consent').onclick = () => {
            const nombre = document.getElementById('consent-nombre').value.trim();
            const telefono = document.getElementById('consent-telefono').value.trim();
            const type = document.getElementById('consent-type').value;

            if (!nombre) return alert('Por favor, ingrese el nombre del cliente.');
            if (!telefono) return alert('Por favor, ingrese el teléfono del cliente para enviarle el consentimiento.');

            const client = this.getOrCreateClient(nombre, telefono);
            this.showForm(client.id, type);
        };
    },

    showForm(clientId, type) {
        const client = Storage.getClients().find(c => c.id === clientId);
        const isPrenatal = type === 'Masaje Prenatal';

        this.container.innerHTML = `
            <div class="header-actions">
                <h2>Consentimiento: ${type}</h2>
                <button class="btn btn-secondary" id="btn-back-selection">Volver</button>
            </div>
            <div class="card">
                <p><strong>Cliente:</strong> ${client.nombre}</p>
                <p><strong>Teléfono:</strong> ${client.telefono}</p>
                <p><strong>Fecha:</strong> ${new Date().toLocaleDateString()}</p>
                <hr style="margin: 1rem 0;">
                
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

                <div style="background: var(--primary-very-light); padding: 1rem; border-radius: 8px; margin: 1rem 0;">
                    <p style="white-space: pre-line; font-size: 0.9rem;">${this.textos[type]}</p>
                </div>
                
                <h4 style="margin: 1.5rem 0 0.5rem;">Contraindicaciones (marcar si presenta):</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                    ${this.contraindicaciones.map(c => `
                        <label style="font-weight: normal; font-size: 0.9rem; display: flex; align-items: center; gap: 0.5rem;">
                            <input type="checkbox" name="contra" value="${c}"> ${c}
                        </label>
                    `).join('')}
                </div>

                <h4 style="margin: 1.5rem 0 0.5rem;">Firma del Cliente:</h4>
                <div class="canvas-container">
                    <canvas id="signature-pad"></canvas>
                </div>
                <button class="btn btn-secondary btn-sm" id="btn-clear-sig">Limpiar Firma</button>

                <div style="margin-top: 2rem;">
                    <button class="btn btn-primary" id="btn-save-consent" style="width: 100%;">💾 Guardar Consentimiento</button>
                    <button class="btn btn-whatsapp" id="btn-whatsapp-consent">📱 Enviar Consentimiento por WhatsApp</button>
                </div>
            </div>
        `;

        const sig = Canvas.init('signature-pad');
        
        document.getElementById('btn-clear-sig').onclick = () => sig.clear();
        document.getElementById('btn-back-selection').onclick = () => this.render(this.container);

        document.getElementById('btn-save-consent').onclick = () => {
            if (sig.isEmpty()) return alert('La firma es obligatoria');
            this.processConsent(clientId, type, sig, false);
        };

        document.getElementById('btn-whatsapp-consent').onclick = () => {
            if (sig.isEmpty()) return alert('La firma es obligatoria');
            this.processConsent(clientId, type, sig, true);
        };
    },

    processConsent(clientId, type, sig, sendWhatsApp) {
        const config = Storage.get('therapist_config');
        if (sendWhatsApp && (!config || !config.whatsapp)) {
            return alert('Por favor, configure su número de WhatsApp en la sección de Ajustes primero.');
        }

        const client = Storage.getClients().find(c => c.id === clientId);
        const checkboxes = this.container.querySelectorAll('input[name="contra"]:checked');
        const contraindicaciones = Array.from(checkboxes).map(cb => cb.value);
        const signatureImg = sig.getDataURL();
        const date = new Date().toLocaleDateString();

        let extraInfo = '';
        if (type === 'Masaje Prenatal') {
            const weeks = document.getElementById('prenatal-weeks').value;
            const auth = document.getElementById('prenatal-auth').checked;
            extraInfo = `Semanas de gestación: ${weeks || 'N/A'}. Autorización médica: ${auth ? 'Sí' : 'No'}.`;
        }

        const consentData = {
            clientId,
            tipo: type,
            contraindicaciones,
            extraInfo,
            signatureImg,
            textLegal: this.textos[type]
        };

        Storage.addConsent(consentData);

        if (sendWhatsApp) {
            const contraText = contraindicaciones.length > 0 
                ? `Contraindicaciones marcadas: ${contraindicaciones.join(', ')}.` 
                : 'Sin contraindicaciones marcadas.';
            
            const message = `*Giacinto Schiavone — Master LMT*\n` +
                `*Consentimiento Informado*\n\n` +
                `*Cliente:* ${client.nombre}\n` +
                `*Teléfono:* ${client.telefono}\n` +
                `*Tipo:* ${type}\n` +
                `*Fecha:* ${date}\n` +
                `${extraInfo ? `*Info:* ${extraInfo}\n` : ''}\n` +
                `*Declaración:* ${this.textos[type]}\n\n` +
                `*${contraText}*\n\n` +
                `Firmado digitalmente por ${client.nombre} el ${date}.\n\n` +
                `_Terapias Corporales Ayurveda & Yoga_\n` +
                `Contacto: ${config.email || '—'}`;

            const encodedMsg = encodeURIComponent(message);
            const waUrl = `https://wa.me/${config.whatsapp.replace(/\D/g, '')}?text=${encodedMsg}`;
            window.open(waUrl, '_blank');
        }

        const msg = sendWhatsApp 
            ? '✅ Consentimiento guardado y enviado por WhatsApp. El cliente ha sido registrado en el directorio.'
            : '✅ Consentimiento guardado exitosamente.';
        alert(msg);
        this.render(this.container);
    }
};