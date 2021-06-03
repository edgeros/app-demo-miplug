import Vue from 'vue'
import App from './App.vue'
import router from './router'
import {edger} from '@edgeros/web-sdk';
import SocketIO from 'socket.io-client';
import VueSocketIOExt from 'vue-socket.io-extended';
import { setToken, setSrand, getHeaders } from './service/auth';
import { Cell, List, NavBar, Notify, CellGroup, Image, Icon, Row, Col} from 'vant';
import 'vant/lib/index.css';
Vue.config.productionTip = false

Vue.use(Cell);
Vue.use(List);
Vue.use(NavBar);
Vue.use(Notify);
Vue.use(CellGroup);
Vue.use(Image);
Vue.use(Icon);
Vue.use(Row);
Vue.use(Col);

edger.onAction('token', (result) => {
  const { token, srand } = result;
  setToken(token);
  setSrand(srand);
})

edger.token()
  .then((result) => {
    const { token, srand } = result;
    setToken(token);
    setSrand(srand);
    const socket = SocketIO({
      path: '/miplug',
      query: getHeaders(),
      transports: ['websocket']
    });
    Vue.use(VueSocketIOExt, socket);
  })
  .catch((error) => {
    console.error(error);
  })
  .finally(() => {
    new Vue({
      router,
      render: h => h(App)
    }).$mount('#app')
  });


