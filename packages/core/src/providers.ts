import { EntityManager, MikroORM } from '@mikro-orm/core';
import { AsyncLocalStorage } from 'async_hooks';
import dotenv from 'dotenv';
import fse from 'fs-extra';
import log4js from 'log4js';
import { Gamerbot } from './gamerbot';
import mikroOrmConfig from './mikro-orm.config';
import { resolvePath } from './util';

dotenv.config({ path: resolvePath('.env') });

fse.mkdirp(resolvePath('logs'));

log4js.configure({
  appenders: {
    file: { type: 'file', filename: `logs/${new Date().toISOString()}.log` },
    console: { type: 'console', layout: { type: 'colored' } },
  },
  categories: {
    default: {
      appenders: process.env.NODE_ENV === 'production' ? ['file', 'console'] : ['console'],
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      enableCallStack: true,
    },
  },
});

export interface CachedInvite {
  guildId: string;
  code: string;
  creatorId?: string;
  creatorTag?: string;
  uses: number;
}

export interface CachedUsername {
  username: string;
  discriminator: string;
}

export const inviteCache = new Map<string, CachedInvite>();
export const usernameCache = new Map<string, CachedUsername>();

export const logger = log4js.getLogger('MAIN');
export const getLogger = (category: string): log4js.Logger => log4js.getLogger(category);
export const dbLogger = log4js.getLogger('DB');

// db
export const storage = new AsyncLocalStorage<EntityManager>();
export const orm = await MikroORM.init({ ...mikroOrmConfig, context: () => storage.getStore() });
await orm.getMigrator().up();

// client
export const client: Gamerbot = new Gamerbot();
