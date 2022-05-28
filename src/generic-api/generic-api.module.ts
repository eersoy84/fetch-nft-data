import { Module } from '@nestjs/common';
import { GenericApiService } from './generic-api.service';

@Module({
  providers: [GenericApiService],
  exports: [GenericApiService],
})
export class GenericApiModule {}
