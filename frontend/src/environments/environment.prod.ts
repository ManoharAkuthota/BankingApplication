export const environment = {
  production: true,
  apiUrl: (window as any).__env?.apiUrl || 'https://apex-trust-backend.onrender.com/api'
};
