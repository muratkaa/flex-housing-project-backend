import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ReviewsModule } from './modules/incoming/reviews/reviews.module';

@Module({
  imports: [ReviewsModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
