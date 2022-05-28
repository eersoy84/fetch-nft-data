import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { FetchNftModule } from './fetch-nft/fetch-nft.module';

@Module({
  imports: [ConfigModule.forRoot(), FetchNftModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
