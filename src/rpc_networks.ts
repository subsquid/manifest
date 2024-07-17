/**
*
THIS FILE WAS AUTO-GENERATED. PLEASE DO NOT EDIT IT.
*
**/

export type NetworkName =
  | 'acala'
  | 'aleph-zero'
  | 'aleph-zero-testnet'
  | 'amplitude'
  | 'arbitrum-one'
  | 'arbitrum-goerli'
  | 'arbitrum-sepolia'
  | 'arbitrum-nova'
  | 'asset-hub-kusama'
  | 'asset-hub-polkadot'
  | 'asset-hub-rococo'
  | 'asset-hub-westend'
  | 'astar'
  | 'ava'
  | 'ava-testnet'
  | 'base'
  | 'base-goerli'
  | 'base-sepolia'
  | 'basilisk'
  | 'bittensor'
  | 'bittensor-testnet'
  | 'blast-l2'
  | 'bridge-hub-kusama'
  | 'bridge-hub-polkadot'
  | 'bridge-hub-rococo'
  | 'bridge-hub-westend'
  | 'bsc'
  | 'bsc-testnet'
  | 'centrifuge'
  | 'collectives-polkadot'
  | 'collectives-westend'
  | 'crust'
  | 'darwinia'
  | 'darwiniacrab'
  | 'eden'
  | 'eth'
  | 'eth-goerli'
  | 'eth-holesky'
  | 'eth-sepolia'
  | 'evmos'
  | 'fantom'
  | 'fantom-testnet'
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
  | 'mantle'
  | 'mantle-sepolia'
  | 'metis'
  | 'moonbase-alpha'
  | 'moonbase'
  | 'moonbeam'
  | 'moonriver'
  | 'oktc'
  | 'opbnb'
  | 'opbnb-testnet'
  | 'optimism'
  | 'optimism-goerli'
  | 'pendulum'
  | 'phala'
  | 'polkadex'
  | 'polkadot'
  | 'polygon'
  | 'polygon-amoy-testnet'
  | 'polygon-testnet'
  | 'polygon-zkevm'
  | 'polygon-zkevm-cardona-testnet'
  | 'polygon-zkevm-testnet'
  | 'rococo'
  | 'scroll'
  | 'scroll-sepolia'
  | 'shibuya'
  | 'shiden'
  | 'solana'
  | 'turing'
  | 'zeitgeist'
  | 'zksync'
  | 'zksync-sepolia';

export type RpcEndpointName =
  | 'acala.http'
  | 'aleph-zero.http'
  | 'aleph-zero-testnet.http'
  | 'amplitude.http'
  | 'arbitrum-one.http'
  | 'arbitrum-goerli.http'
  | 'arbitrum-sepolia.http'
  | 'arbitrum-nova.http'
  | 'asset-hub-kusama.http'
  | 'asset-hub-polkadot.http'
  | 'asset-hub-rococo.http'
  | 'asset-hub-westend.http'
  | 'astar.http'
  | 'astar-substrate.http'
  | 'ava.http'
  | 'ava-testnet.http'
  | 'base.http'
  | 'base-goerli.http'
  | 'base-sepolia.http'
  | 'basilisk.http'
  | 'bittensor.http'
  | 'bittensor-testnet.http'
  | 'blast-l2.http'
  | 'bridge-hub-kusama.http'
  | 'bridge-hub-polkadot.http'
  | 'bridge-hub-rococo.http'
  | 'bridge-hub-westend.http'
  | 'bsc.http'
  | 'bsc-testnet.http'
  | 'centrifuge.http'
  | 'collectives-polkadot.http'
  | 'collectives-westend.http'
  | 'crust.http'
  | 'darwinia.http'
  | 'darwiniacrab.http'
  | 'eden.http'
  | 'eth.http'
  | 'eth-goerli.http'
  | 'eth-holesky.http'
  | 'eth-sepolia.http'
  | 'evmos.http'
  | 'fantom.http'
  | 'fantom-testnet.http'
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
  | 'mantle.http'
  | 'mantle-sepolia.http'
  | 'metis.http'
  | 'moonbase-alpha.http'
  | 'moonbase.http'
  | 'moonbeam.http'
  | 'moonbeam-substrate.http'
  | 'moonriver.http'
  | 'moonriver-substrate.http'
  | 'oktc.http'
  | 'opbnb.http'
  | 'opbnb-testnet.http'
  | 'optimism.http'
  | 'optimism-goerli.http'
  | 'pendulum.http'
  | 'phala.http'
  | 'polkadex.http'
  | 'polkadot.http'
  | 'polygon.http'
  | 'polygon-amoy-testnet.http'
  | 'polygon-testnet.http'
  | 'polygon-zkevm.http'
  | 'polygon-zkevm-cardona-testnet.http'
  | 'polygon-zkevm-testnet.http'
  | 'rococo.http'
  | 'scroll.http'
  | 'scroll-sepolia.http'
  | 'shibuya.http'
  | 'shibuya-substrate.http'
  | 'shiden.http'
  | 'shiden-substrate.http'
  | 'solana.http'
  | 'turing.http'
  | 'zeitgeist.http'
  | 'zksync.http'
  | 'zksync-sepolia.http';

export type RpcEndpointType = 'evm' | 'solana' | 'substrate';

export const NETWORKS: {
  network: NetworkName;
  endpoints: { name: RpcEndpointName; type: RpcEndpointType }[];
}[] = [
  { network: 'acala', endpoints: [{ name: 'acala.http', type: 'substrate' }] },
  { network: 'aleph-zero', endpoints: [{ name: 'aleph-zero.http', type: 'substrate' }] },
  {
    network: 'aleph-zero-testnet',
    endpoints: [{ name: 'aleph-zero-testnet.http', type: 'substrate' }],
  },
  { network: 'amplitude', endpoints: [{ name: 'amplitude.http', type: 'substrate' }] },
  { network: 'arbitrum-one', endpoints: [{ name: 'arbitrum-one.http', type: 'evm' }] },
  { network: 'arbitrum-goerli', endpoints: [{ name: 'arbitrum-goerli.http', type: 'evm' }] },
  { network: 'arbitrum-sepolia', endpoints: [{ name: 'arbitrum-sepolia.http', type: 'evm' }] },
  { network: 'arbitrum-nova', endpoints: [{ name: 'arbitrum-nova.http', type: 'evm' }] },
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
  { network: 'ava', endpoints: [{ name: 'ava.http', type: 'evm' }] },
  { network: 'ava-testnet', endpoints: [{ name: 'ava-testnet.http', type: 'evm' }] },
  { network: 'base', endpoints: [{ name: 'base.http', type: 'evm' }] },
  { network: 'base-goerli', endpoints: [{ name: 'base-goerli.http', type: 'evm' }] },
  { network: 'base-sepolia', endpoints: [{ name: 'base-sepolia.http', type: 'evm' }] },
  { network: 'basilisk', endpoints: [{ name: 'basilisk.http', type: 'substrate' }] },
  { network: 'bittensor', endpoints: [{ name: 'bittensor.http', type: 'substrate' }] },
  {
    network: 'bittensor-testnet',
    endpoints: [{ name: 'bittensor-testnet.http', type: 'substrate' }],
  },
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
  { network: 'bsc', endpoints: [{ name: 'bsc.http', type: 'evm' }] },
  { network: 'bsc-testnet', endpoints: [{ name: 'bsc-testnet.http', type: 'evm' }] },
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
  { network: 'eth', endpoints: [{ name: 'eth.http', type: 'evm' }] },
  { network: 'eth-goerli', endpoints: [{ name: 'eth-goerli.http', type: 'evm' }] },
  { network: 'eth-holesky', endpoints: [{ name: 'eth-holesky.http', type: 'evm' }] },
  { network: 'eth-sepolia', endpoints: [{ name: 'eth-sepolia.http', type: 'evm' }] },
  { network: 'evmos', endpoints: [{ name: 'evmos.http', type: 'evm' }] },
  { network: 'fantom', endpoints: [{ name: 'fantom.http', type: 'evm' }] },
  { network: 'fantom-testnet', endpoints: [{ name: 'fantom-testnet.http', type: 'evm' }] },
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
  { network: 'mantle', endpoints: [{ name: 'mantle.http', type: 'evm' }] },
  { network: 'mantle-sepolia', endpoints: [{ name: 'mantle-sepolia.http', type: 'evm' }] },
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
  { network: 'oktc', endpoints: [{ name: 'oktc.http', type: 'evm' }] },
  { network: 'opbnb', endpoints: [{ name: 'opbnb.http', type: 'evm' }] },
  { network: 'opbnb-testnet', endpoints: [{ name: 'opbnb-testnet.http', type: 'evm' }] },
  { network: 'optimism', endpoints: [{ name: 'optimism.http', type: 'evm' }] },
  { network: 'optimism-goerli', endpoints: [{ name: 'optimism-goerli.http', type: 'evm' }] },
  { network: 'pendulum', endpoints: [{ name: 'pendulum.http', type: 'substrate' }] },
  { network: 'phala', endpoints: [{ name: 'phala.http', type: 'substrate' }] },
  { network: 'polkadex', endpoints: [{ name: 'polkadex.http', type: 'substrate' }] },
  { network: 'polkadot', endpoints: [{ name: 'polkadot.http', type: 'substrate' }] },
  { network: 'polygon', endpoints: [{ name: 'polygon.http', type: 'evm' }] },
  {
    network: 'polygon-amoy-testnet',
    endpoints: [{ name: 'polygon-amoy-testnet.http', type: 'evm' }],
  },
  { network: 'polygon-testnet', endpoints: [{ name: 'polygon-testnet.http', type: 'evm' }] },
  { network: 'polygon-zkevm', endpoints: [{ name: 'polygon-zkevm.http', type: 'evm' }] },
  {
    network: 'polygon-zkevm-cardona-testnet',
    endpoints: [{ name: 'polygon-zkevm-cardona-testnet.http', type: 'evm' }],
  },
  {
    network: 'polygon-zkevm-testnet',
    endpoints: [{ name: 'polygon-zkevm-testnet.http', type: 'evm' }],
  },
  { network: 'rococo', endpoints: [{ name: 'rococo.http', type: 'substrate' }] },
  { network: 'scroll', endpoints: [{ name: 'scroll.http', type: 'evm' }] },
  { network: 'scroll-sepolia', endpoints: [{ name: 'scroll-sepolia.http', type: 'evm' }] },
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
  { network: 'turing', endpoints: [{ name: 'turing.http', type: 'substrate' }] },
  { network: 'zeitgeist', endpoints: [{ name: 'zeitgeist.http', type: 'substrate' }] },
  { network: 'zksync', endpoints: [{ name: 'zksync.http', type: 'evm' }] },
  { network: 'zksync-sepolia', endpoints: [{ name: 'zksync-sepolia.http', type: 'evm' }] },
] as const;

export const RPC_ENDPOINT_NAMES: RpcEndpointName[] = [
  'acala.http',
  'aleph-zero.http',
  'aleph-zero-testnet.http',
  'amplitude.http',
  'arbitrum-one.http',
  'arbitrum-goerli.http',
  'arbitrum-sepolia.http',
  'arbitrum-nova.http',
  'asset-hub-kusama.http',
  'asset-hub-polkadot.http',
  'asset-hub-rococo.http',
  'asset-hub-westend.http',
  'astar.http',
  'astar-substrate.http',
  'ava.http',
  'ava-testnet.http',
  'base.http',
  'base-goerli.http',
  'base-sepolia.http',
  'basilisk.http',
  'bittensor.http',
  'bittensor-testnet.http',
  'blast-l2.http',
  'bridge-hub-kusama.http',
  'bridge-hub-polkadot.http',
  'bridge-hub-rococo.http',
  'bridge-hub-westend.http',
  'bsc.http',
  'bsc-testnet.http',
  'centrifuge.http',
  'collectives-polkadot.http',
  'collectives-westend.http',
  'crust.http',
  'darwinia.http',
  'darwiniacrab.http',
  'eden.http',
  'eth.http',
  'eth-goerli.http',
  'eth-holesky.http',
  'eth-sepolia.http',
  'evmos.http',
  'fantom.http',
  'fantom-testnet.http',
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
  'mantle.http',
  'mantle-sepolia.http',
  'metis.http',
  'moonbase-alpha.http',
  'moonbase.http',
  'moonbeam.http',
  'moonbeam-substrate.http',
  'moonriver.http',
  'moonriver-substrate.http',
  'oktc.http',
  'opbnb.http',
  'opbnb-testnet.http',
  'optimism.http',
  'optimism-goerli.http',
  'pendulum.http',
  'phala.http',
  'polkadex.http',
  'polkadot.http',
  'polygon.http',
  'polygon-amoy-testnet.http',
  'polygon-testnet.http',
  'polygon-zkevm.http',
  'polygon-zkevm-cardona-testnet.http',
  'polygon-zkevm-testnet.http',
  'rococo.http',
  'scroll.http',
  'scroll-sepolia.http',
  'shibuya.http',
  'shibuya-substrate.http',
  'shiden.http',
  'shiden-substrate.http',
  'solana.http',
  'turing.http',
  'zeitgeist.http',
  'zksync.http',
  'zksync-sepolia.http',
] as const;
