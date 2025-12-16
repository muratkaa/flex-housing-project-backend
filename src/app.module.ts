import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ReviewsModule } from './reviews/reviews.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [ReviewsModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
