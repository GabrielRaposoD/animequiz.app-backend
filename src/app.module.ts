import { AnimesModule } from './animes/animes.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';

@Module({
  imports: [UsersModule, AuthModule, AnimesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
