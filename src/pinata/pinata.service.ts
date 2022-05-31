import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import { bufferToBase64Uri } from '../utils';

@Injectable()
export class PinataService {
  protected readonly logger = new Logger(PinataService.name);
  private pinataClient: any;

  constructor() {
    this.logger.verbose('Initializing Pinata...');
    try {
      this.pinataClient = axios.create({
        baseURL: 'https://gateway.pinata.cloud/ipfs/',
        timeout: 5000,
      });
    } catch (err) {
      console.log('pinata axios error');
    }
    axiosRetry(this.pinataClient, {
      retries: 3,
      retryDelay: (retryCount) => {
        console.log(`PinataClient retry attempt: ${retryCount}`);
        return retryCount * 2000;
      },
    });
  }

  async pinataGetBase64(path: string): Promise<string> {
    console.log(`Fetching ${path} from Pinata`);
    try {
      const response = await this.pinataClient.get(path, {
        responseType: 'arraybuffer',
      });
      return bufferToBase64Uri(Buffer.from(response.data, 'binary'));
    } catch (err) {
      console.warn(`Error while fetching ${path}`, err);
    }
    return '';
  }
}
