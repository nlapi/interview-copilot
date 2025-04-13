const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: '', // 设置publicPath为空字符串
  devServer: {
    allowedHosts: 'all',
    host: '0.0.0.0',
    port: 5000 // Use port 5000 as it's accessible in Replit
  }
})
