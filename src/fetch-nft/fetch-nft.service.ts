import { Injectable, Logger } from '@nestjs/common';
import { AvatarMetadata } from '@worldwidewebb/client-nfts';
import { NftCollection } from 'schema';
import { OpenseaService } from 'src/opensea/opensea.service';
import { GenericApiService } from 'src/generic-api/generic-api.service';
import { IpfsService } from 'src/ipfs/ipfs.service';
import { PinataService } from 'src/pinata/pinata.service';
import { Collection, OpenseaListing, Token, Spritesheet } from '@worldwidewebb/shared-messages/nfts';
import { FilteredCollectionsWithUserId } from 'src/app-constants';
import { InternalApiService } from 'src/internal-api/internal-api.service';

@Injectable()
export class FetchNftService {
  private logger = new Logger(FetchNftService.name);
  constructor(
    private openSea: OpenseaService,
    private genericApi: GenericApiService,
    private ipfs: IpfsService,
    private pinata: PinataService,
    private internalApi: InternalApiService,
  ) {
    this.logger.verbose('Initializing 3rd party Apis...');
  }

  async handleFetchNftData(filteredCollectionsWithUserId: FilteredCollectionsWithUserId) {
    const { userId, filteredCollection } = filteredCollectionsWithUserId;
    const { nftCollection, collection, token } = filteredCollection;
    const avatarMetadata: AvatarMetadata = await this.createAvatarMetadata(nftCollection, collection, token);
    await this.internalApi.setUserOwnedAvatar(userId, avatarMetadata);
  }

  private async createAvatarMetadata(
    nftCollection: NftCollection,
    collection: Collection,
    token: Token,
  ): Promise<AvatarMetadata> {
    let spritesheetImageUri = '';
    if (nftCollection.cid) {
      // fetch token image
      const path = `${nftCollection.cid}/${this.parseUrlTemplate(nftCollection.cidPath, collection, token)}`;
      spritesheetImageUri = (await this.ipfs.ipfsGetBase64(path)) || (await this.pinata.pinataGetBase64(path));
    } else if (nftCollection.apiPath) {
      const path = this.parseUrlTemplate(nftCollection.apiPath, collection, token);
      spritesheetImageUri = await this.genericApi.genericApiGetBase64(path);
    } else {
      let w = nftCollection.spritesheet.frameSize[0];
      let h = nftCollection.spritesheet.frameSize[1];
      spritesheetImageUri = await this.openSea.fetchOpenSeaImageUrlProcessed(collection.address.value, token.id, w, h);
    }

    // process metadata
    let description = '';
    const tokenName = `${collection.collectionName} #${token.id}`;
    let spritesheetMetadata = nftCollection.spritesheet;
    let _token = (await this.openSea.fetchNftOpensea(collection.address.chain, collection.address.value, token.id))
      ?.token;
    if (_token && _token.metadata) {
      const metadata = JSON.parse(_token.metadata);
      //tokenName = metadata.name || ""; // FIXME: Moralis API returns the wrong token metadata. so let's not use it
      description = metadata.description || '';
      spritesheetMetadata = this.updateSpritesheetMetadata(nftCollection.openseaSlug, metadata, spritesheetMetadata);
    }
    // fetch thumbnail
    const { imageUri, thumbnailUri } = await this.openSea.fetchOpenSeaImageUrlAndThumbnailBase64(
      collection.address.value,
      token.id,
    );

    if (!_token) {
      _token = token;
    }
    return {
      token: _token,
      collection: {
        ...collection,
        collectionName: nftCollection.openseaSlug, // overwrite collection name with database value
        openseaSlug: nftCollection.openseaSlug,
      },
      spritesheet: {
        idleType: 'none',
        ...spritesheetMetadata,
        imageUri: spritesheetImageUri,
        url: this.parseUrlTemplate(nftCollection.spritesheet.url, collection, token),
      },
      tokenName,
      description,
      thumbnailUri,
      imageUri,
    };
  }

  public async getOpenseaListing(chain: string, address: string, tokenId: string): Promise<OpenseaListing> {
    const listing = await this.openSea.fetchOpenseaListing(address, tokenId);
    console.log(`Got listing price ${listing} for opensea ${address} ${tokenId}`);
    return listing;
  }
  private parseUrlTemplate(string: string, collection: Collection, token: Token): string {
    return string.replace('{{tokenId}}', token.id).replace('{{address}}', collection.address.value);
  }

  private updateSpritesheetMetadata(collection: string, metadata: any, spritesheetMetadata: Spritesheet): Spritesheet {
    let newData = spritesheetMetadata;
    let traits: any = {};
    if (!metadata.traits) {
      return newData;
    }

    metadata.traits.forEach((t: any) => (traits[t.trait_type] = t.value));

    switch (collection) {
      case 'spritely-genesis':
        newData.walkType = traits.Wings || traits.Spaceship ? 'float' : 'bounce';
        break;

      case 'thelittlesnft':
        newData.walkType = traits.Character == 'Spooks' || traits.Character == 'Floaties' ? 'float' : 'bounce';
        break;

      case 'cryptopunks':
        if (traits.type == 'Female') {
          newData.frameOrigin[0] += 2;
        }
        break;
    }

    return newData;
  }
}
