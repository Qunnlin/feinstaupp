import Vue from 'vue'
import App from './App.vue'
import * as VueGoogleMaps from "vue2-google-maps"

Vue.config.productionTip = false

Vue.use(VueGoogleMaps, {
  load: {
    key: "AIzaSyD4CCrsS2gILDTdDyiU8vjZikp1UCxpxTM",
    libraries: ["visualization"] // necessary for places input
  }
});

new Vue({
  render: h => h(App),
}).$mount('#app')
