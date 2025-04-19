import { createApp } from 'vue'
import App from './App.vue'
import 'element-plus/dist/index.css'
import ElementPlus from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import i18n from '../common/i18n.js'

const app = createApp(App)
app.use(ElementPlus).use(i18n)
app.component('DeleteIcon', Delete)
app.mount('#app')
