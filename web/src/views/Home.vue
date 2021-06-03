<template>
  <div class="home">
    <van-nav-bar title="设备列表" />
    <van-list>
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
  </div>
</template>
<script>
import axios from "axios";
import { getHeaders } from "../service/auth";

export default {
  name: "Home",
  data() {
    return {
      miPlugs: [],
      connectError: 0,
      connectTimeout: 0,
      error: 0,
    };
  },
  sockets: {
    connect() {
      this.getMIPlugList();
      console.log("socket connected");
    },
    connectError() {
      this.connectError++;
      if (this.connectError <= 3) {
        this.$notify({ type: "danger", message: "连接错误！" });
      }
      console.log("socket connect error");
    },
    connectTimeout() {
      this.connectTimeout++;
      if (this.connectTimeout <= 3) {
        this.$notify({ type: "danger", message: "连接超时！" });
      }
      console.log("socket connect timeout");
    },
    error() {
      this.error++;
      if (error <= 3) {
        this.$notify({ type: "danger", message: "发生错误！" });
      }
      console.log("error");
    },
    disconnect() {
      console.log("socket disconnect");
    },
  },
  methods: {
    initSocket() {
      this.$socket.$subscribe("miplug-lost", (devid) => {
        this.$notify({
          type: "primary",
          message: `${devid} 设备已下线`,
        });
        this.miPlugs = this.miPlugs.filter((miPlug) => {
          miPlug.devid !== devid;
        });
      });
      this.$socket.$subscribe("miplug-join", (miPlug) => {
        this.$notify({
          type: "primary",
          message: `新上线了 ${miPlug.alias} 设备`,
        });
        this.miPlugs.push(miPlug);
      });
      this.$socket.$subscribe("miplug-error", (error) => {
        this.$notify({ type: "danger", message: error.error });
      });
    },
    getMIPlugList() {
      this.$socket.client.emit("miplug-list", (data) => {
        this.miPlugs = data;
        console.log(this.miPlugs);
      });
    },
    getMIPlugDetail(miPlug) {
      console.log(miPlug);
      axios
        .post(`/api/select/${miPlug.devid}`, {}, { headers: getHeaders() })
        .then(() => {
          this.$router.push({ name: "Details", params: miPlug });
        })
        .catch((error) => {
          if (error.status === 400) {
            this.$notify({ type: "danger", message: "参数错误！" });
          } else if (error.status === 503) {
            this.$notify({ type: "danger", message: error.error });
            console.log(error.error);
          } else if (error.status === 403) {
            this.$notify({ type: "danger", message: "无访问权限！" });
          } else {
            this.$notify({ type: "danger", message: "未知错误！" });
          }
        });
    },
  },
  created() {
    this.initSocket();
  },
};
</script>
<style scoped>
.img {
  margin-left: 0px;
  float: left;
}
</style>