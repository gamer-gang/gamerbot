import { Message } from 'discord.js';
import { Command } from '..';
import { Context } from '../../types';
import { Embed, getDateFromSnowflake, getDateStringFromSnowflake } from '../../util';

export class CommandTimestamp implements Command {
  cmd = 'timestamp';
  docs = {
    usage: 'timestamp <snowflake>',
    description: 'extract timestamp from snowflake',
  };
  async execute(context: Context): Promise<void | Message> {
    const { msg, args } = context;

    const snowflake = args._[0];
    if (!/^\d{18}$/.test(snowflake)) return msg.channel.send(Embed.error('Invalid snowflake'));

    return msg.channel.send(
      Embed.info(
        'Timestamp of ' + snowflake,
        getDateStringFromSnowflake(snowflake).join('; ')
      ).setFooter(getDateFromSnowflake(snowflake))
    );
  }
}
