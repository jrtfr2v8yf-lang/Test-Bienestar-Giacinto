import { Storage } from './modules/storage.js';
import { Clientes } from './modules/clientes.js';
import { Consentimientos } from './modules/consentimientos.js';
import { Soap } from './modules/soap.js';
import { Ajustes } from './modules/ajustes.js';

const App = {
    currentView: 'clientes',
    
    init() {
        Storage.initDefaults();
        
        // Detectar si es modo cliente (viene desde un link de WhatsApp)
        const urlParams = new URLSearchParams(window.location.search);
        const tipoDesdeUrl = urlParams.get('tipo');
        
        if (tipoDesdeUrl) {
            this.initClientMode(tipoDesdeUrl);
            return;
        }
        
        // Modo normal (terapeuta)
        this.cacheDOM();
        this.bindEvents();
        this.loadView(this.currentView);
        this.initTheme();
    },

    initClientMode(tipo) {
        // Modo cliente: oculta nav y muestra solo el consentimiento
        document.querySelector('nav').style.display = 'none';
        document.querySelector('header').innerHTML = `
            <div class="branding">
                <h1>Giacinto Schiavone — Master LMT</h1>
                <p class="subtitle">Terapias Corporales Ayurveda & Yoga</p>
            </div>
        `;
        document.getElementById('fab-whatsapp').style.display = 'none';
        
        const app = document.getElementById('app');
        app.innerHTML = '';
        Consentimientos.renderPublic(app, tipo);
    },

    cacheDOM() {
        this.appContainer = document.getElementById('app');
        this.navItems = document.querySelectorAll('.nav-item');
        this.themeToggle = document.getElementById('theme-toggle');
        this.fabWhatsapp = document.getElementById('fab-whatsapp');
    },

    bindEvents() {
        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.loadView(view);
            });
        });

        this.themeToggle.addEventListener('click', () => {
            this.toggleTheme();
        });

        // Botón flotante WhatsApp → va directo a Consentimientos
        if (this.fabWhatsapp) {
            this.fabWhatsapp.addEventListener('click', () => {
                this.loadView('consentimientos');
            });
        }
    },

    loadView(view) {
        this.currentView = view;
        
        // Update Nav UI
        this.navItems.forEach(item => {
            if (item.dataset.view === view) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Render View
        this.appContainer.innerHTML = '';
        switch(view) {
            case 'clientes':
                Clientes.render(this.appContainer);
                break;
            case 'consentimientos':
                Consentimientos.render(this.appContainer);
                break;
            case 'soap':
                Soap.render(this.appContainer);
                break;
            case 'ajustes':
                Ajustes.render(this.appContainer);
                break;
        }
        
        window.scrollTo(0, 0);
    },

    initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    },

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());