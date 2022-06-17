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
export const INTERNAL_API = 'INTERNAL_API';
export const FETCH_NFT_DATA_TOPIC = process.env.FETCH_NFT_DATA_TOPIC || 'fetch.nft.data';
