import dotenv from 'dotenv/config';

// Example addresses for v2 on Arbitrum (adjust as needed):
const NETWORKS = {
  arbitrum: {
    rpc: process.env.RPC_URL_ARBITRUM,

    // Remove or comment out the old GMX v1 addresses if you no longer need them:
    // gmxVaultAddress: "0x489ee077994B6658eAfA855C308275EAd8097C4A",
    // gmxReaderAddress: "0x22199a49A999c351eF7927602CFB187ec3cae489",

    // Add the new v2 addresses:
    dataStoreAddress: "0xFD70de6b91282D8017aA4E741e9Ae325CAb992d8",
    depositVaultAddress: "0xF89e77e8Dc11691C9e8757e84aaFbCD8A67d7A55",
    withdrawalVaultAddress: "0x0628D46b5D145f183AdB6Ef1f2c97eD1C4701C55",
    eventEmitterAddress: "0xC8ee91A54287DB53897056e12D9819156D3822Fb",
    exchangeRouterAddress: "0x900173A66dbD345006C51fA35fA3aB760FcD843b",
    glvReaderAddress: "0x6a9505D0B44cFA863d9281EA5B0b34cB36243b45",
  },

  avalanche: {
    rpc: process.env.RPC_URL_AVALANCHE,
    // If you have GMX v2 addresses on Avalanche, list them here as well
    // e.g. dataStoreAddress, depositVaultAddress, etc.
  },
};

const getNetworkConfig = (network) => {
  console.log("Запрошена конфигурация для сети:", network);
  console.log("Доступные сети:", Object.keys(NETWORKS));

  const config = NETWORKS[network];
  if (!config) {
    throw new Error(`Сеть ${network} не поддерживается`);
  }

  console.log("Найдена конфигурация:", config);
  return config;
};

export { NETWORKS, getNetworkConfig };
