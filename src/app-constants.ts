import { CollectionTokens } from './models/collectionTokens';
import { NftCollection } from 'schema';
import { Collection, Token } from '@worldwidewebb/shared-messages/nfts';

export type FilteredCollections = {
  nftCollection: NftCollection;
  collection: Collection;
  token: Token;
};

export type FilteredCollectionsWithUserId = {
  userId: string;
  filteredCollection: FilteredCollections;
};

export const FETCH_NFT_DATA_SERVICE = 'FETCH_NFT_DATA_SERVICE';
export const OPENSEA_CONTRACT_ADDRESS = '0x495f947276749ce646f68ac8c248420045cb7b5e';
export const COLLECTION_API_URL = 'https://nfts.dev.webb.game';
export const INTERNAL_API_URL = 'https://nfts.dev.webb.game';
export const INTERNAL_API = 'INTERNAL_API';
