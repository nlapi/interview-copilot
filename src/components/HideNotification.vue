<template>
  <transition name="notification-fade">
    <div v-if="visible" class="notification-container" :class="notificationType">
      <div class="notification-icon">
        <i :class="iconClass"></i>
      </div>
      <div class="notification-content">
        <div class="notification-title">{{ title }}</div>
        <div class="notification-message">{{ message }}</div>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'HideNotification',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      default: 'info',
      validator: value => ['info', 'warning', 'success', 'error'].indexOf(value) !== -1
    },
    title: {
      type: String,
      default: 'Notification'
    },
    message: {
      type: String,
      default: ''
    },
    duration: {
      type: Number,
      default: 3000
    },
    autoClose: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    notificationType() {
      return `notification-${this.type}`;
    },
    iconClass() {
      const iconMap = {
        info: 'el-icon-information',
        warning: 'el-icon-warning',
        success: 'el-icon-success',
        error: 'el-icon-error'
      };
      return iconMap[this.type] || 'el-icon-information';
    }
  },
  watch: {
    visible(newVal) {
      if (newVal && this.autoClose) {
        this.startAutoCloseTimer();
      }
    }
  },
  methods: {
    startAutoCloseTimer() {
      setTimeout(() => {
        this.$emit('update:visible', false);
      }, this.duration);
    }
  },
  mounted() {
    if (this.visible && this.autoClose) {
      this.startAutoCloseTimer();
    }
  }
}
</script>

<style scoped>
.notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  padding: 16px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  background: white;
  min-width: 280px;
  max-width: 400px;
}

.notification-icon {
  margin-right: 16px;
  font-size: 24px;
  display: flex;
  align-items: center;
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-weight: bold;
  margin-bottom: 8px;
  font-size: 16px;
}

.notification-message {
  font-size: 14px;
  line-height: 1.5;
}

.notification-info {
  border-left: 4px solid #909399;
}

.notification-info .notification-icon {
  color: #909399;
}

.notification-warning {
  border-left: 4px solid #E6A23C;
}

.notification-warning .notification-icon {
  color: #E6A23C;
}

.notification-success {
  border-left: 4px solid #67C23A;
}

.notification-success .notification-icon {
  color: #67C23A;
}

.notification-error {
  border-left: 4px solid #F56C6C;
}

.notification-error .notification-icon {
  color: #F56C6C;
}

.notification-fade-enter-active, 
.notification-fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.notification-fade-enter, 
.notification-fade-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>