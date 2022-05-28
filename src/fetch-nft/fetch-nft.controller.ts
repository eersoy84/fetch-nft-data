import { Controller, Logger, ValidationPipe } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { FetchNftService } from './fetch-nft.service';

@Controller()
export class FetchNftController {
  constructor(private readonly fetchNft: FetchNftService) {}

  @EventPattern('fetch.nft.data')
  handleFetchNftData(@Payload(new ValidationPipe()) data: any) {
    this.fetchNft.handleFetchNftData(data.value);
  }
}
