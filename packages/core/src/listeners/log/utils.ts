import { Guild, GuildAuditLogsEntry } from 'discord.js';
import { inspect } from 'util';
import { logColors, LogEventName, logEvents } from '.';
import { Config } from '../../entities/Config';
import { client, getLogger, orm } from '../../providers';
import { findGuild, GuildHandle } from '../../util';

export const getConfig = async (source: GuildHandle): Promise<Config> => {
  const guild = findGuild(source);

  if (!guild) throw new Error('Could not find a config for resource ' + source?.toString());

  const config = await orm.em.findOne(Config, {
    guildId: guild.id,
  });
  if (!config) throw new Error('Could not get config for ' + guild.name);
  return config;
};

export const getLatestAuditEvent = async (guild: Guild): Promise<GuildAuditLogsEntry> => {
  const auditLogs = await guild.fetchAuditLogs();
  const event = auditLogs.entries.array()[0];

  if (client.devMode) {
    const logger = getLogger('     ');

    const json = inspect(event.toJSON(), false, null, true);
    const split = json.split('\n');

    getLogger('AUDIT').debug(`audit event ${event.id} in guild ${guild.name}`);

    split.forEach(msg => logger.debug(msg));
  }

  return event;
};

export const logColorFor = (event: LogEventName): number =>
  logColors[Math.round((logEvents.indexOf(event) / logEvents.length) * logColors.length)];

export const formatValue = (content: unknown): string =>
  content == null
    ? 'null'
    : typeof content === 'boolean' ||
      typeof content === 'number' ||
      (typeof content === 'string' && /^\d+$/.test(content))
    ? content.toString()
    : `'${content}'`;
