import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './styles/base.css';
import './styles/gallery-product-grid.css';
import './styles/home-page-layout.css';
import './styles/hero-display.css';
import './styles/admin-data-table.css';
import './styles/mobile.css';

createApp(App).use(router).mount('#app');
