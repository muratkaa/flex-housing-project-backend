import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { HostawayService } from './hostaway.service';
import { HostawayConfig } from './hostaway.config';

@Module({
  imports: [HttpModule],
  providers: [HostawayConfig, HostawayService],
  exports: [HostawayService],
})
export class HostawayModule {}
