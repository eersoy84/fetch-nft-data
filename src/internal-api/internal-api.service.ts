import { Inject, Injectable, Logger } from '@nestjs/common';
import { AvatarMetadata, InternalApi } from '@worldwidewebb/client-nfts';
import { INTERNAL_API } from 'src/app.constants';

@Injectable()
export class InternalApiService {
  private readonly logger = new Logger(InternalApiService.name);

  constructor(@Inject(INTERNAL_API) private readonly internalApi: InternalApi) {
    this.logger.verbose('internal api initializing...');
  }
  async setUserOwnedAvatar(userId: string, avatarMetadata: AvatarMetadata) {
    try {
      console.log(avatarMetadata);
      this.logger.verbose('Saving avatar metadata to database');
      await this.internalApi.setUserOwnedAvatar(userId, avatarMetadata);
    } catch (err) {
      this.logger.error(`While saving  Avatar MetaData ${avatarMetadata} with ${userId} to Database`, err);
    }
  }
}
