import * as fs from 'node:fs';

import { groupBy, mapValues } from 'lodash';

export type Network = { name: string; type: 'evm' | 'substrate' };

function loadNetworksFile(): Network[] {
  return JSON.parse(fs.readFileSync('./networks.json').toString('utf-8'));
}

const networks = loadNetworksFile();
const TMP_NETWORKS = mapValues(groupBy(networks, 'name'), v => {
  return {
    types: v.map(v => v.type),
  };
});

const NETWORKS = Object.entries(TMP_NETWORKS).map(([network, { types }]) => {
  return {
    network,
    endpoints: types.map(type => {
      if (type === 'substrate' && types.includes('evm')) {
        return { name: `${network}-substrate.http`, type };
      }

      return { name: `${network}.http`, type };
    }),
  };
});

const RPC_ENDPOINTS = NETWORKS.flatMap(r => r.endpoints.map(r => r.name));

const content = `
/** 
*
THIS FILE WAS AUTO-GENERATED. PLEASE DO NOT EDIT IT.
*
**/  

export type NetworkName = "${Object.keys(TMP_NETWORKS).join('" | "')}";

export type RpcEndpointName = "${RPC_ENDPOINTS.join('" | "')}";

export type RpcEndpointType = 'evm' | 'substrate';

export const NETWORKS: { network: NetworkName, endpoints: { name: RpcEndpointName, type: RpcEndpointType  }[] }[] = ${JSON.stringify(NETWORKS)} as const;

export const RPC_ENDPOINT_NAMES: RpcEndpointName[] = ${JSON.stringify(RPC_ENDPOINTS)} as const;
`;

const OUT_PATH = './src/rpc_networks.ts';

fs.writeFileSync(OUT_PATH, content);

console.log(`Generated RPC endpoints in ${OUT_PATH}`);
