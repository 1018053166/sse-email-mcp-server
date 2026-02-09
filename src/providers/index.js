const fs = require('fs-extra');
const path = require('path');

let providers = null;

function loadProviders() {
  if (providers) {
    return providers;
  }

  const providersPath = path.join(__dirname, 'providers.json');
  try {
    providers = fs.readJsonSync(providersPath);
    return providers;
  } catch (error) {
    console.error('Failed to load providers:', error);
    return {};
  }
}

function getProviderConfig(providerName, protocol = 'smtp') {
  const providers = loadProviders();
  const provider = providers[providerName];
  
  if (!provider) {
    return null;
  }

  return provider[protocol] || null;
}

function listProviders() {
  const providers = loadProviders();
  return Object.keys(providers);
}

module.exports = {
  loadProviders,
  getProviderConfig,
  listProviders
};
