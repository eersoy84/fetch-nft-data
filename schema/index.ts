import { Spritesheet } from '@worldwidewebb/shared-messages/nfts';
import { Schema, model } from 'mongoose';

// "collection" is a reserved word in mongoose
export interface NftCollection {
  address: string;
  spritesheet: Spritesheet;
  enabled: boolean;
  collectionTypes: string[];
  cid: string;
  cidPath: string;
  apiPath: string;
  openseaSlug: string;
}

const FrameSchema = new Schema({
  frameType: { type: String, required: true },
  number: { type: Number, required: true },
  speed: { type: Number, required: true },
});

const SpritesheetSchema = new Schema({
  frameSize: { type: [Number], required: true },
  frameOrigin: { type: [Number], required: true },
  frames: { type: [FrameSchema], required: true },
  walkType: {
    type: String,
    enum: ['bounce', 'float', 'none'],
    required: true,
  },
  scale: { type: Number, required: true },
  url: { type: String, required: true },
});

const NftCollectionSchema = new Schema<NftCollection>({
  address: { type: String, required: true, unique: true },
  spritesheet: { type: SpritesheetSchema, required: true },
  enabled: { type: Boolean, required: true },
  collectionTypes: { type: [String], required: true },
  cid: String,
  cidPath: String,
  apiPath: String,
  openseaSlug: String,
});

export const NftCollectionModel = model<NftCollection>('NftCollection', NftCollectionSchema);
