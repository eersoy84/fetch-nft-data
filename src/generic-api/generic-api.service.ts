import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import { bufferToBase64Uri } from 'src/utils';

@Injectable()
export class GenericApiService implements OnModuleInit {
  private axiosClient: any;
  private readonly logger = new Logger(GenericApiService.name);

  async onModuleInit() {
    this.axiosClient = axios.create({
      baseURL: process.env.OPENSEA_API_URL,
      timeout: 5000,
    });
    this.logger.log('axios retry...');
    axiosRetry(this.axiosClient, { retries: 3, retryDelay: () => 1000 });
  }

  async genericApiGetBase64(path: string, maxFilesize = 1_048_576): Promise<string> {
    try {
      let buff = await this.genericApiGetImage(path);
      if (buff) {
        return bufferToBase64Uri(buff);
      }
    } catch (err) {
      console.warn(`Error while fetching ${path}`, err);
    }
    return '';
  }

  async genericApiGetImage(path: string, maxFilesize = 1_048_576): Promise<Buffer | null> {
    console.log(`Fetching from generic API ${path}`);

    const parsedUrl = new URL(path);
    const url = parsedUrl.origin + parsedUrl.pathname;
    const params = parsedUrl.searchParams;

    // attempt to check filesize
    try {
      const head = await this.axiosClient.head(url, { params });
      const filesize = parseInt(head.headers['content-length'] || '-1');

      if (filesize > maxFilesize) {
        console.warn(`Skipping fetching ${path}, size was too large: ${filesize}`);
        return null;
      }
      if (filesize <= 0) {
        console.warn(`No filesize given for ${path}, we're not going to risk downloading it`);
        return null;
      }

      const response = await this.axiosClient.get(url, {
        params,
        responseType: 'arraybuffer',
      });
      return Buffer.from(response.data, 'binary');
    } catch (err) {
      Logger.error(`Error while fetching ${path}`, err);
    }
    return null;
  }
}
