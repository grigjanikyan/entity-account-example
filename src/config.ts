import { EConfigS_E_C_R_E_T } from '@S_E_C_R_E_T/econfig';

export { EConfig } from '@S_E_C_R_E_T/econfig';

const defaultConfig = {
  subsystem: 'packages/entity-account',
  app: {
    url: 'http://localhost:8080',
  },
  accountAvatar: {
    bucket: 'dev-S_E_C_R_E_T-account-avatar',
    hosting: 'https://dev-S_E_C_R_E_T-account-avatar.s3.me-south-1.amazonaws.com',
  },
  landPhoto: {
    bucket: 'dev-S_E_C_R_E_T-land-photo',
    hosting: 'https://dev-S_E_C_R_E_T-land-photo.s3.me-south-1.amazonaws.com',
  },
};

export interface Config {
  subsystem: string;
  app: {
    url: string;
  };
  accountAvatar: {
    bucket: string;
    hosting: string;
  };
  landPhoto: {
    bucket: string;
    hosting: string;
  };
}

const cfg = new EConfigS_E_C_R_E_T<Config>(__dirname, defaultConfig);
export default cfg.config;
export const test = cfg.testEnv;
