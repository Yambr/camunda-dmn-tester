import Vue from "vue"
import App from "./App.vue"
import router from "./router"
import store from "./store"
import {BootstrapVue, IconsPlugin, BadgePlugin} from 'bootstrap-vue'
import {install, configure} from 'browserfs'
import * as moment from 'moment';
import './main.sass'

//moment.locale('ru')

install(window)
configure({
    options: undefined,
    fs: "LocalStorage"
}, (e) => {
    if (e)
        console.error(e)
})

// Make BootstrapVue available throughout your project
Vue.use(BootstrapVue)
// Optionally install the BootstrapVue icon components plugin
Vue.use(IconsPlugin)
Vue.use(BadgePlugin)

Vue.config.productionTip = false

new Vue({
    router,
    store,
    render: h => h(App)
}).$mount("#app")
