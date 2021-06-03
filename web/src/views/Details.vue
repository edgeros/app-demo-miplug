<template>
  <div class="about">
    <van-nav-bar title="设备详情" left-arrow @click-left="goBack()" />
    <h4 class="font">{{ miPlug.alias }}</h4>
    <span class="font">{{ miPlug.devid }}</span>
    <van-row class="row" justify="center" align="center" type="flex">
      <van-col>
        <van-image width="180" height="200" :src="miPlug.imgUrl" />
      </van-col>
    </van-row>
    <van-row class="row" justify="center" align="center" type="flex">
      <van-col>
        <van-icon
          @click="miPlugControl()"
          size="32"
          color="#1989fa"
          :name="require('../assets/svg/power.svg')"
        />
      </van-col>
    </van-row>

    <van-cell-group class="row">
      <van-cell title="用电量">
        <template #default>
          <span class="font-color">{{ miPlug.energyConsumed }}Wh</span>
        </template>
      </van-cell>
      <van-cell title="功率">
        <template #default>
          <span class="font-color">{{ miPlug.loadPower }}W</span>
        </template>
      </van-cell>
    </van-cell-group>
  </div>
</template>
<script>
export default {
  name: "Details",
  data() {
    return {
      miPlug: {
        devid: "",
        alias: "",
        channel0: false,
        energyConsumed: 0.0,
        loadPower: 0.0,
        imgOff: require("../assets/img/plug_off.png"),
        imgOn: require("../assets/img/plug_on.png"),
        imgUrl: require("../assets/img/plug_off.png"),
        color: "#000000",
      },
    };
  },
  methods: {
    goBack() {
      this.$router.go(-1);
    },
    initSocket() {
      this.$socket.$subscribe("miplug-message", (msg) => {
        if (typeof msg.channel0 !== "undefined") {
          this.miPlug.channel0 = msg.channel0;
          this.power();
        }
        if (typeof msg.energyConsumed !== "undefined") {
          this.miPlug.energyConsumed = msg.energyConsumed.toFixed(2);
        }
        if (typeof msg.loadPower !== "undefined") {
          this.miPlug.loadPower = msg.loadPower.toFixed(2);
        }
      });
      this.$socket.$subscribe("miplug-lost", (devid) => {
        if (devid === this.miPlug.devid) {
          this.goBack();
        }
      });
    },
    miPlugControl() {
      this.$socket.client.emit("miplug-control", {
        channel0: !this.miPlug.channel0,
      });
    },
    power() {
      this.miPlug.imgUrl = this.miPlug.channel0
        ? this.miPlug.imgOn
        : this.miPlug.imgOff;
      this.miPlug.color = this.miPlug.channel0 ? "#1989fa" : "#000000";
    },
  },
  created() {
    this.miPlug.devid = this.$route.params.devid;
    this.miPlug.alias = this.$route.params.alias;
    this.initSocket();
    this.power();
  },
};
</script>

<style scoped>
.font-color {
  color: #1989fa;
}
.font {
  text-align: center;
}
.row {
  margin-top: 20px;
}
.img {
  margin-left: 0px;
  float: left;
}
.van-cell__title {
  text-align: left;
}
</style>