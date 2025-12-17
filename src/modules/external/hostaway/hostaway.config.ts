import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

export interface IHostawayConfigApiData {
  url: string;
  path: string;
  baseUrl: string;
}

@Injectable()
export class HostawayConfig {
  BASE_URL: string = process.env.HOSTAWAY_API_URL as string;

  ACCOUNT_ID = process.env.HOSTAWAY_ACCOUNT_ID;
  API_KEY = process.env.HOSTAWAY_API_KEY;
  AUTH = process.env.HOSTAWAY_AUTH;

  constructor(public httpService: HttpService) {
    if (this.API_KEY) {
      this.httpService.axiosRef.defaults.headers.common['Authorization'] =
        `${this.AUTH}`;
      this.httpService.axiosRef.defaults.headers.common['X-Account-Id'] =
        this.ACCOUNT_ID;
    }
  }

  getReviewsConfig(): IHostawayConfigApiData {
    const path = `/reviews`;
    const url = `${this.BASE_URL}${path}`;

    return {
      url,
      path,
      baseUrl: this.BASE_URL,
    };
  }
}
