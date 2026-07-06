const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // API REST
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8080',
      changeOrigin: true,
    })
  );
  
  // WebSocket SockJS
  app.use('/ws-chat', createProxyMiddleware({
  target: 'http://localhost:8080',
  changeOrigin: true,
  ws: true,
}));
};