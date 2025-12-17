import * as dotenv from 'dotenv';
dotenv.config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });

export const ENV_VAR = {
  VERSION: process.env.npm_package_version,
  PORT: process.env.PORT as string,
  DATABASE_URL: process.env.DATABASE_URL,
  HOSTAWAY_ACCOUNT_ID: process.env.HOSTAWAY_ACCOUNT_ID,
  HOSTAWAY_API_KEY: process.env.HOSTAWAY_API_KEY,
  HOSTAWAY_API_URL: process.env.HOSTAWAY_API_URL,
  HOSTAWAY_AUTH: process.env.HOSTAWAY_AUTH,
};
