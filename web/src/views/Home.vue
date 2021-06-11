<template>
  <div class="home">
    <van-nav-bar title="设备列表" fixed="true" safe-area-inset-top />
    <van-pull-refresh style="min-height: 100vh; margin-top: 46px"  v-model="isLoading" @refresh="onRefresh">
      <van-list style="min-height: 100vh">
      <van-cell
        v-for="(miPlug, index) of miPlugs"
        :title="miPlug.alias"
        :label="miPlug.devid"
        :key="index"
        is-link="true"
        center="true"
        @click="getMIPlugDetail(miPlug)"
      >
        <template #icon>
          <van-image
            width="50"
            height="50"
            :src="require('../assets/img/plug_material.png')"
          />
        </template>
      </van-cell>
    </van-list>
    </van-pull-refresh>
  </div>
</template>
<script>
import axios from "axios";
import { getHeaders } from "../service/auth";
import { edger } from "@edgeros/web-sdk";

export default {
  name: "Home",
  data() {
    return {
      miPlugs: [],
      isLoading: false
    };
  },
  sockets: {
    connect() {
      this.getMIPlugList();
      console.log("socket connected");
    },
    connectError() {
      console.log("socket connect error");
    },
    connectTimeout() {
      console.log("socket connect timeout");
    },
    error() {
      console.log("error");
    },
    disconnect() {
      console.log("socket disconnect");
    },
  },
  methods: {
    onRefresh() {
      setTimeout(() => {
        this.isLoading = false;
        this.getMIPlugList();
      }, 1000);
    },
    initSocket() {
      this.$socket.$subscribe("miplug-lost", (devid) => {
        edger.notify.info(`${devid} 设备已下线`);
        this.miPlugs = this.miPlugs.filter((miPlug) => {
          miPlug.devid !== devid;
        });
      });
      this.$socket.$subscribe("miplug-join", (miPlug) => {
        edger.notify.info(`新上线了 ${miPlug.alias} 设备`);
        this.miPlugs.push(miPlug);
      });
      this.$socket.$subscribe("miplug-error", (error) => {
        if (error.code === 50002) {
          edger.notify.error(`无效设备！`);
        } else {
          edger.notify.error(error.message);
        }
      });
    },
    getMIPlugList() {
      this.$socket.client.emit("miplug-list", (data) => {
        console.log(data);
        this.miPlugs = data;
        if (this.miPlugs.length === 0) {
          edger.notify.error(`未发现设备！`);
        }
      });
    },
    getMIPlugDetail(miPlug) {
      console.log(miPlug);
      axios
        .post(`/api/select/${miPlug.devid}`, {}, { headers: getHeaders() })
        .then((res) => {
          if (res.data.result) {
            this.$router.push({ name: "Details", params: miPlug });
          } else {
            if (res.data.code === 50004) {
              edger.notify.error(`您没有此设备权限！`);
            } else {
              edger.notify.error(`未知错误！`);
            }
          }
        })
        .catch((error) => {
          console.error(error);
        });
    },
  },
  created() {
    this.initSocket();
    this.getMIPlugList();
  },
};
</script>
<style scoped>
.img {
  margin-left: 0px;
  float: left;
}
</style>