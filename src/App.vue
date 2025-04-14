<template>
  <div id="app" :class="{ 'stealth-mode': isStealthMode }">
    <div class="stealth-indicator" v-if="isScreenShared">
      Screen is being shared! Stealth mode activated.
    </div>
    <el-menu :default-active="$router.currentRoute.path" mode="horizontal" :router="true">
      <el-menu-item index="/">Interview Copilot</el-menu-item>
      <el-menu-item index="/setting">Setting</el-menu-item>
    </el-menu>
    <router-view class="router_view"/>
  </div>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  transition: opacity 0.3s ease, background-color 0.3s ease;
}

/* Stealth mode styles */
#app.stealth-mode {
  opacity: 0.6;
  background-color: rgba(255, 255, 255, 0.9);
}

.stealth-indicator {
  position: fixed;
  top: 10px;
  right: 10px;
  background-color: rgba(255, 0, 0, 0.7);
  color: white;
  padding: 5px 10px;
  border-radius: 5px;
  font-size: 12px;
  z-index: 9999;
}

.router_view {
  margin-top: 10px;
}
</style>
<script>
import {mapGetters} from 'vuex';

export default {
  name: 'App',
  props: {},
  computed: {},
  beforeMount() {
  },
  mounted() {

  },
  data() {
    return {
      activeIndex: "/",
      isScreenShared: false,
      isStealthMode: false
    }
  },
  methods: {},
  mounted() {
    // Check if we're in Electron environment
    if (window.electronAPI) {
      // Listen for screen sharing status changes
      window.electronAPI.onScreenSharingStatusChange((isSharing) => {
        console.log('Screen sharing detected:', isSharing);
        this.isScreenShared = isSharing;
        this.isStealthMode = isSharing;
      });
    }

    // Also add keyboard shortcut for toggling stealth mode manually (Ctrl+Alt+S)
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.altKey && e.key === 's') {
        this.isStealthMode = !this.isStealthMode;
        console.log('Stealth mode toggled:', this.isStealthMode);
      }
    });
  }


}

</script>