import Vue from 'vue'
import VueClipboard from 'vue-clipboard2'
import App from './App.vue'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import './assets/styles.css'


Vue.config.productionTip = false

Vue.use(ElementUI)
Vue.use(VueClipboard)

new Vue({
  render: h => h(App),
}).$mount('#app')
