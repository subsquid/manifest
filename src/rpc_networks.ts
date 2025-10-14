/**
*
THIS FILE WAS AUTO-GENERATED. PLEASE DO NOT EDIT IT.
*
**/

export type NetworkName =
  | 'acala'
  | 'aleph-zero-testnet'
  | 'aleph-zero'
  | 'amplitude'
  | 'arbitrum-nova'
  | 'arbitrum-one'
  | 'arbitrum-sepolia'
  | 'asset-hub-kusama'
  | 'asset-hub-polkadot'
  | 'asset-hub-rococo'
  | 'asset-hub-westend'
  | 'astar'
  | 'ava-testnet'
  | 'ava'
  | 'base-sepolia'
  | 'base'
  | 'basilisk'
  | 'berachain'
  | 'bittensor-testnet'
  | 'bittensor'
  | 'blast-l2'
  | 'bridge-hub-kusama'
  | 'bridge-hub-polkadot'
  | 'bridge-hub-rococo'
  | 'bridge-hub-westend'
  | 'bsc-testnet'
  | 'bsc'
  | 'centrifuge'
  | 'collectives-polkadot'
  | 'collectives-westend'
  | 'crust'
  | 'darwinia'
  | 'darwiniacrab'
  | 'eden'
  | 'eth-holesky'
  | 'eth-sepolia'
  | 'eth'
  | 'frequency'
  | 'gnosis'
  | 'hydradx'
  | 'interlay'
  | 'karura'
  | 'khala'
  | 'kilt'
  | 'kintsugi'
  | 'kusama'
  | 'linea'
  | 'litentry'
  | 'mantle-sepolia'
  | 'mantle'
  | 'metis'
  | 'moonbase-alpha'
  | 'moonbase'
  | 'moonbeam'
  | 'moonriver'
  | 'opbnb-testnet'
  | 'opbnb'
  | 'optimism-sepolia'
  | 'optimism'
  | 'pendulum'
  | 'phala'
  | 'polkadex'
  | 'polkadot'
  | 'polygon-amoy-testnet'
  | 'polygon-zkevm-cardona-testnet'
  | 'polygon-zkevm'
  | 'polygon'
  | 'rococo'
  | 'scroll-sepolia'
  | 'scroll'
  | 'shibuya'
  | 'shiden'
  | 'solana'
  | 'sonic-mainnet'
  | 'turing'
  | 'unichain-sepolia'
  | 'unichain'
  | 'zeitgeist'
  | 'zksync-sepolia'
  | 'zksync';

export type RpcEndpointName =
  | 'acala.http'
  | 'aleph-zero-testnet.http'
  | 'aleph-zero.http'
  | 'amplitude.http'
  | 'arbitrum-nova.http'
  | 'arbitrum-one.http'
  | 'arbitrum-sepolia.http'
  | 'asset-hub-kusama.http'
  | 'asset-hub-polkadot.http'
  | 'asset-hub-rococo.http'
  | 'asset-hub-westend.http'
  | 'astar.http'
  | 'astar-substrate.http'
  | 'ava-testnet.http'
  | 'ava.http'
  | 'base-sepolia.http'
  | 'base.http'
  | 'basilisk.http'
  | 'berachain.http'
  | 'bittensor-testnet.http'
  | 'bittensor.http'
  | 'blast-l2.http'
  | 'bridge-hub-kusama.http'
  | 'bridge-hub-polkadot.http'
  | 'bridge-hub-rococo.http'
  | 'bridge-hub-westend.http'
  | 'bsc-testnet.http'
  | 'bsc.http'
  | 'centrifuge.http'
  | 'collectives-polkadot.http'
  | 'collectives-westend.http'
  | 'crust.http'
  | 'darwinia.http'
  | 'darwiniacrab.http'
  | 'eden.http'
  | 'eth-holesky.http'
  | 'eth-sepolia.http'
  | 'eth.http'
  | 'frequency.http'
  | 'gnosis.http'
  | 'hydradx.http'
  | 'interlay.http'
  | 'karura.http'
  | 'khala.http'
  | 'kilt.http'
  | 'kintsugi.http'
  | 'kusama.http'
  | 'linea.http'
  | 'litentry.http'
  | 'mantle-sepolia.http'
  | 'mantle.http'
  | 'metis.http'
  | 'moonbase-alpha.http'
  | 'moonbase.http'
  | 'moonbeam.http'
  | 'moonbeam-substrate.http'
  | 'moonriver.http'
  | 'moonriver-substrate.http'
  | 'opbnb-testnet.http'
  | 'opbnb.http'
  | 'optimism-sepolia.http'
  | 'optimism.http'
  | 'pendulum.http'
  | 'phala.http'
  | 'polkadex.http'
  | 'polkadot.http'
  | 'polygon-amoy-testnet.http'
  | 'polygon-zkevm-cardona-testnet.http'
  | 'polygon-zkevm.http'
  | 'polygon.http'
  | 'rococo.http'
  | 'scroll-sepolia.http'
  | 'scroll.http'
  | 'shibuya.http'
  | 'shibuya-substrate.http'
  | 'shiden.http'
  | 'shiden-substrate.http'
  | 'solana.http'
  | 'sonic-mainnet.http'
  | 'turing.http'
  | 'unichain-sepolia.http'
  | 'unichain.http'
  | 'zeitgeist.http'
  | 'zksync-sepolia.http'
  | 'zksync.http';

export type RpcEndpointType = 'evm' | 'solana' | 'substrate';

export const NETWORKS: {
  network: NetworkName;
  endpoints: { name: RpcEndpointName; type: RpcEndpointType }[];
}[] = [
  { network: 'acala', endpoints: [{ name: 'acala.http', type: 'substrate' }] },
  {
    network: 'aleph-zero-testnet',
    endpoints: [{ name: 'aleph-zero-testnet.http', type: 'substrate' }],
  },
  { network: 'aleph-zero', endpoints: [{ name: 'aleph-zero.http', type: 'substrate' }] },
  { network: 'amplitude', endpoints: [{ name: 'amplitude.http', type: 'substrate' }] },
  { network: 'arbitrum-nova', endpoints: [{ name: 'arbitrum-nova.http', type: 'evm' }] },
  { network: 'arbitrum-one', endpoints: [{ name: 'arbitrum-one.http', type: 'evm' }] },
  { network: 'arbitrum-sepolia', endpoints: [{ name: 'arbitrum-sepolia.http', type: 'evm' }] },
  {
    network: 'asset-hub-kusama',
    endpoints: [{ name: 'asset-hub-kusama.http', type: 'substrate' }],
  },
  {
    network: 'asset-hub-polkadot',
    endpoints: [{ name: 'asset-hub-polkadot.http', type: 'substrate' }],
  },
  {
    network: 'asset-hub-rococo',
    endpoints: [{ name: 'asset-hub-rococo.http', type: 'substrate' }],
  },
  {
    network: 'asset-hub-westend',
    endpoints: [{ name: 'asset-hub-westend.http', type: 'substrate' }],
  },
  {
    network: 'astar',
    endpoints: [
      { name: 'astar.http', type: 'evm' },
      { name: 'astar-substrate.http', type: 'substrate' },
    ],
  },
  { network: 'ava-testnet', endpoints: [{ name: 'ava-testnet.http', type: 'evm' }] },
  { network: 'ava', endpoints: [{ name: 'ava.http', type: 'evm' }] },
  { network: 'base-sepolia', endpoints: [{ name: 'base-sepolia.http', type: 'evm' }] },
  { network: 'base', endpoints: [{ name: 'base.http', type: 'evm' }] },
  { network: 'basilisk', endpoints: [{ name: 'basilisk.http', type: 'substrate' }] },
  { network: 'berachain', endpoints: [{ name: 'berachain.http', type: 'evm' }] },
  {
    network: 'bittensor-testnet',
    endpoints: [{ name: 'bittensor-testnet.http', type: 'substrate' }],
  },
  { network: 'bittensor', endpoints: [{ name: 'bittensor.http', type: 'substrate' }] },
  { network: 'blast-l2', endpoints: [{ name: 'blast-l2.http', type: 'evm' }] },
  {
    network: 'bridge-hub-kusama',
    endpoints: [{ name: 'bridge-hub-kusama.http', type: 'substrate' }],
  },
  {
    network: 'bridge-hub-polkadot',
    endpoints: [{ name: 'bridge-hub-polkadot.http', type: 'substrate' }],
  },
  {
    network: 'bridge-hub-rococo',
    endpoints: [{ name: 'bridge-hub-rococo.http', type: 'substrate' }],
  },
  {
    network: 'bridge-hub-westend',
    endpoints: [{ name: 'bridge-hub-westend.http', type: 'substrate' }],
  },
  { network: 'bsc-testnet', endpoints: [{ name: 'bsc-testnet.http', type: 'evm' }] },
  { network: 'bsc', endpoints: [{ name: 'bsc.http', type: 'evm' }] },
  { network: 'centrifuge', endpoints: [{ name: 'centrifuge.http', type: 'substrate' }] },
  {
    network: 'collectives-polkadot',
    endpoints: [{ name: 'collectives-polkadot.http', type: 'substrate' }],
  },
  {
    network: 'collectives-westend',
    endpoints: [{ name: 'collectives-westend.http', type: 'substrate' }],
  },
  { network: 'crust', endpoints: [{ name: 'crust.http', type: 'substrate' }] },
  { network: 'darwinia', endpoints: [{ name: 'darwinia.http', type: 'substrate' }] },
  { network: 'darwiniacrab', endpoints: [{ name: 'darwiniacrab.http', type: 'substrate' }] },
  { network: 'eden', endpoints: [{ name: 'eden.http', type: 'substrate' }] },
  { network: 'eth-holesky', endpoints: [{ name: 'eth-holesky.http', type: 'evm' }] },
  { network: 'eth-sepolia', endpoints: [{ name: 'eth-sepolia.http', type: 'evm' }] },
  { network: 'eth', endpoints: [{ name: 'eth.http', type: 'evm' }] },
  { network: 'frequency', endpoints: [{ name: 'frequency.http', type: 'substrate' }] },
  { network: 'gnosis', endpoints: [{ name: 'gnosis.http', type: 'evm' }] },
  { network: 'hydradx', endpoints: [{ name: 'hydradx.http', type: 'substrate' }] },
  { network: 'interlay', endpoints: [{ name: 'interlay.http', type: 'substrate' }] },
  { network: 'karura', endpoints: [{ name: 'karura.http', type: 'substrate' }] },
  { network: 'khala', endpoints: [{ name: 'khala.http', type: 'substrate' }] },
  { network: 'kilt', endpoints: [{ name: 'kilt.http', type: 'substrate' }] },
  { network: 'kintsugi', endpoints: [{ name: 'kintsugi.http', type: 'substrate' }] },
  { network: 'kusama', endpoints: [{ name: 'kusama.http', type: 'substrate' }] },
  { network: 'linea', endpoints: [{ name: 'linea.http', type: 'evm' }] },
  { network: 'litentry', endpoints: [{ name: 'litentry.http', type: 'substrate' }] },
  { network: 'mantle-sepolia', endpoints: [{ name: 'mantle-sepolia.http', type: 'evm' }] },
  { network: 'mantle', endpoints: [{ name: 'mantle.http', type: 'evm' }] },
  { network: 'metis', endpoints: [{ name: 'metis.http', type: 'evm' }] },
  { network: 'moonbase-alpha', endpoints: [{ name: 'moonbase-alpha.http', type: 'evm' }] },
  { network: 'moonbase', endpoints: [{ name: 'moonbase.http', type: 'substrate' }] },
  {
    network: 'moonbeam',
    endpoints: [
      { name: 'moonbeam.http', type: 'evm' },
      { name: 'moonbeam-substrate.http', type: 'substrate' },
    ],
  },
  {
    network: 'moonriver',
    endpoints: [
      { name: 'moonriver.http', type: 'evm' },
      { name: 'moonriver-substrate.http', type: 'substrate' },
    ],
  },
  { network: 'opbnb-testnet', endpoints: [{ name: 'opbnb-testnet.http', type: 'evm' }] },
  { network: 'opbnb', endpoints: [{ name: 'opbnb.http', type: 'evm' }] },
  { network: 'optimism-sepolia', endpoints: [{ name: 'optimism-sepolia.http', type: 'evm' }] },
  { network: 'optimism', endpoints: [{ name: 'optimism.http', type: 'evm' }] },
  { network: 'pendulum', endpoints: [{ name: 'pendulum.http', type: 'substrate' }] },
  { network: 'phala', endpoints: [{ name: 'phala.http', type: 'substrate' }] },
  { network: 'polkadex', endpoints: [{ name: 'polkadex.http', type: 'substrate' }] },
  { network: 'polkadot', endpoints: [{ name: 'polkadot.http', type: 'substrate' }] },
  {
    network: 'polygon-amoy-testnet',
    endpoints: [{ name: 'polygon-amoy-testnet.http', type: 'evm' }],
  },
  {
    network: 'polygon-zkevm-cardona-testnet',
    endpoints: [{ name: 'polygon-zkevm-cardona-testnet.http', type: 'evm' }],
  },
  { network: 'polygon-zkevm', endpoints: [{ name: 'polygon-zkevm.http', type: 'evm' }] },
  { network: 'polygon', endpoints: [{ name: 'polygon.http', type: 'evm' }] },
  { network: 'rococo', endpoints: [{ name: 'rococo.http', type: 'substrate' }] },
  { network: 'scroll-sepolia', endpoints: [{ name: 'scroll-sepolia.http', type: 'evm' }] },
  { network: 'scroll', endpoints: [{ name: 'scroll.http', type: 'evm' }] },
  {
    network: 'shibuya',
    endpoints: [
      { name: 'shibuya.http', type: 'evm' },
      { name: 'shibuya-substrate.http', type: 'substrate' },
    ],
  },
  {
    network: 'shiden',
    endpoints: [
      { name: 'shiden.http', type: 'evm' },
      { name: 'shiden-substrate.http', type: 'substrate' },
    ],
  },
  { network: 'solana', endpoints: [{ name: 'solana.http', type: 'solana' }] },
  { network: 'sonic-mainnet', endpoints: [{ name: 'sonic-mainnet.http', type: 'evm' }] },
  { network: 'turing', endpoints: [{ name: 'turing.http', type: 'substrate' }] },
  { network: 'unichain-sepolia', endpoints: [{ name: 'unichain-sepolia.http', type: 'evm' }] },
  { network: 'unichain', endpoints: [{ name: 'unichain.http', type: 'evm' }] },
  { network: 'zeitgeist', endpoints: [{ name: 'zeitgeist.http', type: 'substrate' }] },
  { network: 'zksync-sepolia', endpoints: [{ name: 'zksync-sepolia.http', type: 'evm' }] },
  { network: 'zksync', endpoints: [{ name: 'zksync.http', type: 'evm' }] },
] as const;

export const RPC_ENDPOINT_NAMES: RpcEndpointName[] = [
  'acala.http',
  'aleph-zero-testnet.http',
  'aleph-zero.http',
  'amplitude.http',
  'arbitrum-nova.http',
  'arbitrum-one.http',
  'arbitrum-sepolia.http',
  'asset-hub-kusama.http',
  'asset-hub-polkadot.http',
  'asset-hub-rococo.http',
  'asset-hub-westend.http',
  'astar.http',
  'astar-substrate.http',
  'ava-testnet.http',
  'ava.http',
  'base-sepolia.http',
  'base.http',
  'basilisk.http',
  'berachain.http',
  'bittensor-testnet.http',
  'bittensor.http',
  'blast-l2.http',
  'bridge-hub-kusama.http',
  'bridge-hub-polkadot.http',
  'bridge-hub-rococo.http',
  'bridge-hub-westend.http',
  'bsc-testnet.http',
  'bsc.http',
  'centrifuge.http',
  'collectives-polkadot.http',
  'collectives-westend.http',
  'crust.http',
  'darwinia.http',
  'darwiniacrab.http',
  'eden.http',
  'eth-holesky.http',
  'eth-sepolia.http',
  'eth.http',
  'frequency.http',
  'gnosis.http',
  'hydradx.http',
  'interlay.http',
  'karura.http',
  'khala.http',
  'kilt.http',
  'kintsugi.http',
  'kusama.http',
  'linea.http',
  'litentry.http',
  'mantle-sepolia.http',
  'mantle.http',
  'metis.http',
  'moonbase-alpha.http',
  'moonbase.http',
  'moonbeam.http',
  'moonbeam-substrate.http',
  'moonriver.http',
  'moonriver-substrate.http',
  'opbnb-testnet.http',
  'opbnb.http',
  'optimism-sepolia.http',
  'optimism.http',
  'pendulum.http',
  'phala.http',
  'polkadex.http',
  'polkadot.http',
  'polygon-amoy-testnet.http',
  'polygon-zkevm-cardona-testnet.http',
  'polygon-zkevm.http',
  'polygon.http',
  'rococo.http',
  'scroll-sepolia.http',
  'scroll.http',
  'shibuya.http',
  'shibuya-substrate.http',
  'shiden.http',
  'shiden-substrate.http',
  'solana.http',
  'sonic-mainnet.http',
  'turing.http',
  'unichain-sepolia.http',
  'unichain.http',
  'zeitgeist.http',
  'zksync-sepolia.http',
  'zksync.http',
] as const;
