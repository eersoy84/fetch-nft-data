import { Collection, Token } from "@worldwidewebb/shared-messages/nfts";

export interface CollectionTokens {
  collection: Collection;
  tokens: Token[];
}

export interface CollectionToken {
  collection: Collection;
  token: Token;
}
