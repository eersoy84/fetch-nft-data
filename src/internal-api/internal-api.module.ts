import { Module } from '@nestjs/common';
import { InternalApi } from '@worldwidewebb/client-nfts';
import { INTERNAL_API } from 'src/app.constants';
import { InternalApiService } from './internal-api.service';

const internalApiFactory = {
  provide: INTERNAL_API,
  useFactory: () => {
    return new InternalApi(undefined, process.env.INTERNAL_API_URL);
  },
};
@Module({
  providers: [internalApiFactory, InternalApiService],
  exports: [InternalApiService],
})
export class InternalApiModule {}
