import { Controller, Logger, ValidationPipe } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { FETCH_NFT_DATA_TOPIC } from 'src/app.constants';
import { FetchNftService } from './fetch-nft.service';

@Controller()
export class FetchNftController {
  constructor(private readonly fetchNft: FetchNftService) {}

  @EventPattern(FETCH_NFT_DATA_TOPIC)
  handleFetchNftData(@Payload(new ValidationPipe()) data: any) {
    this.fetchNft.handleFetchNftData(data.value);
  }
}
