// Test import
try {
  const TilopayAPI = require('../lib/services/tilopay-api');
  console.log('Import successful!');
  console.log('Available functions:', Object.keys(TilopayAPI));
} catch (error) {
  console.error('Import failed:', error);
} 