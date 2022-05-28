import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { bufferToBase64Uri } from 'src/utils';
import { create } from 'ipfs-http-client';

@Injectable()
export class IpfsService implements OnModuleInit {
  private readonly logger = new Logger(IpfsService.name);
  private ipfsClient: any;

  onModuleInit() {
    this.logger.verbose('Creating Ipfs Client');
    this.ipfsClient = create({ url: process.env.IPFS_SERVER_URL || 'http://127.0.0.1:5001' });
  }

  async ipfsGetBase64(path: string, timeout = 500): Promise<string> {
    console.log(`Fetching ${path} from IPFS`);
    try {
      const data = this.ipfsClient.cat(path, { timeout });

      // fetch array of uint8arrays
      const arrays = [];
      let totalLength = 0;
      for await (const array of data) {
        arrays.push(array);
        totalLength += array.length;
      }

      // concatenate arrays
      const result = new Uint8Array(totalLength);
      let length = 0;
      for (const array of arrays) {
        result.set(array, length);
        length += array.length;
      }

      return bufferToBase64Uri(Buffer.from(result));
    } catch (err) {
      console.warn(err);
    }
    return '';
  }

  async ipfsCheckPinned(cidToCheck: string): Promise<boolean> {
    try {
      for await (const { cid, type } of this.ipfsClient.pin.ls({ paths: [cidToCheck], timeout: 100 })) {
        if (['recursive', 'direct', 'indirect'].includes(type)) {
          return true;
        }
        console.warn(`Unrecognized pin type ${type} on CID ${cid}`);
        return false;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err.message && err.message.includes('is not pinned')) {
        return false;
      }
      if (err.name && err.name == 'TimeoutError') {
        console.warn(`Timed out checking for pin on CId ${cidToCheck}`);
        return false;
      }
      throw err;
    }

    return false;
  }
}
