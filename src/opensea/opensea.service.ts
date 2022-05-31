import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import axios from 'axios';
import axiosRetry from 'axios-retry';

import { OpenseaArtNft, OpenseaArtNftPage, OpenseaListing } from '@worldwidewebb/shared-messages/nfts';
import { models } from '@worldwidewebb/tsoa-shared';
import { bufferToBase64Uri } from '../utils';

import sharp from 'sharp';
import { GenericApiService } from 'src/generic-api/generic-api.service';
import { CollectionToken } from 'src/models/collectionTokens';
import { OpenseaImageAndThumbnailUri } from 'src/models/opensea';

@Injectable()
export class OpenseaService {
  public openseaClient: any;
  private readonly logger = new Logger(OpenseaService.name);

  constructor(private genericApi: GenericApiService) {
    try {
      this.openseaClient = axios.create({
        baseURL: process.env.OPENSEA_API_URL,
        timeout: 5000,
      });
      axiosRetry(this.openseaClient, { retries: 3, retryDelay: () => 500 });
    } catch (err) {
      this.logger.error('axios create error');
    }
  }

  async fetchOpenSeaThumbnailBase64(address: string, tokenId: string): Promise<string> {
    const { thumbnailUri } = await this.fetchOpenSeaImageUrlAndThumbnailBase64(address, tokenId);
    return thumbnailUri;
  }

  async fetchOpenSeaImageUrlAndThumbnailBase64(address: string, tokenId: string): Promise<OpenseaImageAndThumbnailUri> {
    let imageUri = '';
    let thumbnailUri = '';

    this.logger.log(`Fetching image ${address} #${tokenId} from OpenSea`);
    try {
      const { data } = await this.openseaClient.get(
        `/api/v1/assets?asset_contract_address=${address}&token_ids=${tokenId}`,
        {
          headers: {
            'X-API-KEY': process.env.OPENSEA_API_KEY || '',
          },
        },
      );
      if (data) {
        let asset = data.assets[0];
        imageUri = asset.image_url || '';
        if (asset.image_preview_url) {
          thumbnailUri = await this.genericApi.genericApiGetBase64(asset.image_preview_url);
        }
      }
    } catch (err) {
      this.logger.warn(`Error while fetching image for asset ${address} #${tokenId} from OpenSea`, err);
    }

    return { imageUri, thumbnailUri };
  }

  samplePixel(buff: Buffer, x: number, y: number, width: number): Array<number> {
    let ind = (width * y + x) * 4;
    let arr = [...buff.slice(ind, ind + 4)];
    return arr;
  }

  replacePixel(buff: Buffer, x: number, y: number, width: number, values: Array<number>) {
    let ind = (width * y + x) * 4;
    for (let i = 0; i < 4; i++) {
      buff[ind + i] = values[i];
    }
  }

  rgb2hsv(col: Array<number>): Array<number> {
    let r = col[0],
      g = col[1],
      b = col[2];
    let v = Math.max(r, g, b),
      c = v - Math.min(r, g, b);
    let h = c && (v == r ? (g - b) / c : v == g ? 2 + (b - r) / c : 4 + (r - g) / c);
    return [60 * (h < 0 ? h + 6 : h), v && c / v, v];
  }

  async fetchOpenSeaImageUrlProcessed(
    address: string,
    tokenId: string,
    width: number,
    height: number,
  ): Promise<string> {
    let imageBase64 = '';

    this.logger.log(`Fetching image ${address} #${tokenId} from OpenSea to process`);
    try {
      const { data } = await this.openseaClient.get(
        `/api/v1/assets?asset_contract_address=${address}&token_ids=${tokenId}`,
        {
          headers: {
            'X-API-KEY': process.env.OPENSEA_API_KEY || '',
          },
        },
      );

      let asset = data.assets[0];
      let imageUri = asset.image_url || '';
      if (imageUri) {
        let image = await this.genericApi.genericApiGetImage(imageUri);
        if (image) {
          let sharpImage = sharp(image).resize(width, height, { kernel: sharp.kernel.nearest }).ensureAlpha();
          let metadata = await sharpImage.metadata();
          let rawImage = await sharpImage.raw().toBuffer();

          let w = width ?? metadata.width ?? 0;
          let h = height ?? metadata.height ?? 0;

          let bgCol = this.samplePixel(rawImage, 2, 2, w);
          for (let i = 0; i < w; i++) {
            for (let j = 0; j < h; j++) {
              let pixel = this.samplePixel(rawImage, i, j, w);
              let a = this.rgb2hsv(pixel.slice(0, 3));
              let b = this.rgb2hsv(bgCol.slice(0, 3));

              if (Math.abs(a[0] - b[0]) < 5 && Math.abs(a[1] - b[1]) < 10 && Math.abs(a[0] - b[0]) < 20) {
                this.replacePixel(rawImage, i, j, w, [0, 0, 0, 0]);
              }
            }
          }
          imageBase64 = bufferToBase64Uri(
            await sharp(rawImage, { raw: { width: w, height: h, channels: 4 } })
              .png()
              .toBuffer(),
          );
        }
      }
    } catch (err) {
      console.warn(`Error while fetching image for asset ${address} #${tokenId} from OpenSea to process`, err);
    }

    return imageBase64;
  }

  async fetchOpenseaArtNftPage(address: string, limit: number, cursor?: string): Promise<OpenseaArtNftPage> {
    /* eslint-disable @typescript-eslint/no-explicit-any */

    this.logger.log(`Fetching Art NFTs for ${address} from OpenSea`);
    let nextCursor = '';
    let previousCursor = '';
    let art: OpenseaArtNft[] = [];

    try {
      const { data } = await this.openseaClient.get('/api/v1/assets', {
        params: {
          owner: address,
          cursor,
          limit,
        },
        headers: {
          'X-API-KEY': process.env.OPENSEA_API_KEY || '',
        },
      });
      if (data) {
        if (data.next) {
          nextCursor = data.next || '';
        }
        if (data.previous) {
          previousCursor = data.next || '';
        }
        if (data.assets) {
          this.logger.log(`Got ${data.assets.length} assets`);
          art = await Promise.all(data.assets.map(async (asset: any) => this.fetchOpenseaArtNftFromAsset(asset)));
        }
      }
    } catch (err) {
      console.warn(`Error while fetching art NFTs for ${address} from OpenSea`, err);
    }

    return { art, nextCursor, previousCursor };
  }

  async fetchOpenseaListing(address: string, tokenId: string): Promise<OpenseaListing> {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    console.log(`Fetching listings for ${address} ${tokenId} from OpenSea`);

    let listings: any;
    try {
      const { data } = await this.openseaClient.get(`/api/v1/asset/${address}/${tokenId}/listings`, {
        headers: {
          'X-API-KEY': process.env.OPENSEA_API_KEY || '',
        },
      });

      if (data && data.listings) {
        listings = data.listings.filter((listing: any) => listing.payment_token_contract.symbol == 'ETH'); // just in case we see any non-eth listings
      }
    } catch (err) {
      console.warn(`Error while fetching art NFTs for ${address} from OpenSea`, err);
    }

    if (!listings.length) {
      ``;
      throw new models.NotFoundError('No listings found');
    }

    listings.sort((a: any, b: any) => a.current_price - b.current_price);

    // calculate price properly
    const price = parseFloat(listings[0].current_price) * 10 ** -listings[0].payment_token_contract.decimals;

    return {
      price,
      priceUnit: listings[0].payment_token_contract.symbol,
      priceUsd: price * parseFloat(listings[0].payment_token_contract.usd_price),
    };
  }

  private async fetchOpenseaArtNftFromAsset(asset: any): Promise<OpenseaArtNft> {
    return {
      collection: {
        address: {
          value: asset.asset_contract.address,
          chain: 'eth',
        },
        collectionName: asset.collection.name,
        openseaSlug: asset.collection.slug,
        symbol: asset.asset_contract.symbol,
      },
      token: {
        id: asset.token_id,
        url: asset.permalink,
        amount: 0, // is this ever used? what's the correct key
        metadata: '',
      },
      tokenName: asset.name || `${asset.collection.name} #${asset.token_id}`,
      imageUri: asset.image_url,
      thumbnailUri: await this.genericApi.genericApiGetBase64(asset.image_preview_url),
      thumbnailFrames: 1,
      description: asset.description,
    };
  }

  async fetchNftOpensea(chain: string, address: string, token_id: string): Promise<CollectionToken | null> {
    if (chain != 'eth') throw new models.NotFoundError();

    let nftData: any = {};
    this.logger.log(`Fetching metadata ${address} #${token_id} from OpenSea`);

    try {
      const { data } = await this.openseaClient.get(
        `/api/v1/assets?asset_contract_address=${address}&token_ids=${token_id}`,
        {
          headers: {
            'X-API-KEY': process.env.OPENSEA_API_KEY || '',
          },
        },
      );

      let asset = data.assets[0];

      nftData = {
        collection: {
          address: {
            value: address,
            chain,
          },
          collectionName: asset.asset_contract.name,
          symbol: asset.asset_contract.symbol,
          openseaSlug: asset.collection.slug,
        },
        token: {
          id: asset.token_id,
          url: asset.permalink,
          amount: 0,
          metadata: JSON.stringify({
            traits: asset.traits,
            description: asset.collection.description,
          }),
        },
      };
    } catch (err) {
      console.warn(`Error while fetching metadata for asset ${address} #${token_id} from OpenSea`, err);
      return null;
    }

    return nftData;
  }
}
