import { Module } from '@nestjs/common';
import { GenericApiModule } from 'src/generic-api/generic-api.module';
import { GenericApiService } from 'src/generic-api/generic-api.service';
import { OpenseaService } from './opensea.service';

@Module({
  // imports: [GenericApiModule],
  providers: [OpenseaService, GenericApiService],
  exports: [OpenseaService],
})
export class OpenseaModule {}
