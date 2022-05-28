import { Module } from '@nestjs/common';
import { GenericApiModule } from 'src/generic-api/generic-api.module';
import { InternalApiModule } from 'src/internal-api/internal-api.module';
import { IpfsModule } from 'src/ipfs/ipfs.module';
import { OpenseaModule } from 'src/opensea/opensea.module';
import { PinataModule } from 'src/pinata/pinata.module';
import { FetchNftController } from './fetch-nft.controller';
import { FetchNftService } from './fetch-nft.service';

@Module({
  imports: [OpenseaModule, IpfsModule, GenericApiModule, PinataModule, InternalApiModule],
  controllers: [FetchNftController],
  providers: [FetchNftService],
})
export class FetchNftModule {}
