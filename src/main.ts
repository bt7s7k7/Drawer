import VueCompositionAPI from '@vue/composition-api'
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import 'bootstrap/dist/css/bootstrap.css'
import Vue from 'vue'
import { App } from './drawer-viewer/App'
import { router } from './drawer-viewer/routes'

Vue.use(BootstrapVue)
Vue.use(IconsPlugin)
Vue.use(VueCompositionAPI)

Vue.config.productionTip = false

new Vue({
    render: h => h(App),
    router
}).$mount('#app')