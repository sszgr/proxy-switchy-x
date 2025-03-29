import { createApp } from 'vue'
import App from './App.vue'
import 'element-plus/dist/index.css'
import ElementPlus from 'element-plus'
import { Delete } from '@element-plus/icons-vue'

const app = createApp(App)
app.use(ElementPlus)
app.component('DeleteIcon', Delete)
app.mount('#app')
