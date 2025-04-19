import { createApp } from 'vue'
import App from './App.vue'
import 'element-plus/dist/index.css'
import ElementPlus from 'element-plus'
import i18n from '../common/i18n.js'

createApp(App).use(ElementPlus).use(i18n).mount('#app')
