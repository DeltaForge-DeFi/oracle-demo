import { ethers } from 'ethers';
import { NETWORKS } from '../config/index.js';

export default (network) => {
  const networkConfig = NETWORKS[network];
  if (!networkConfig) {
    throw new Error(`Неподдерживаемая сеть: ${network}`);
  }
  
  if (!networkConfig.rpc) {
    throw new Error(`RPC URL не настроен для сети ${network}`);
  }

  return new ethers.JsonRpcProvider(networkConfig.rpc);
};
