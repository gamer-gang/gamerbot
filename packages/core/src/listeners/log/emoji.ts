import { Guild, GuildEmoji, TextChannel } from 'discord.js';
import { LogHandlers } from '.';
import { Embed } from '../../util';
import { formatValue, getLatestAuditEvent, logColorFor } from './utils';

const auditChangeTable: Record<string, string> = {
  name: 'Name',
};

export const emojiHandlers: LogHandlers = {
  onEmojiCreate: (guild: Guild, logChannel: TextChannel) => async (emoji: GuildEmoji) => {
    const auditEvent = await getLatestAuditEvent(guild);

    const embed = new Embed({
      author: {
        iconURL: guild.iconURL({ format: 'png' }) ?? undefined,
        name: guild.name,
      },
      color: logColorFor('emojiCreate'),
      title: 'Emoji added',
    })
      .addField('Name', emoji.name)
      .addField('Animated', emoji.animated)
      .setThumbnail(emoji.url)
      .setTimestamp();

    embed.addField('Added by', auditEvent.executor);

    logChannel.send(embed);
  },
  onEmojiDelete: (guild: Guild, logChannel: TextChannel) => async (emoji: GuildEmoji) => {
    const auditEvent = await getLatestAuditEvent(guild);

    const embed = new Embed({
      author: {
        iconURL: guild.iconURL({ format: 'png' }) ?? undefined,
        name: guild.name,
      },
      color: logColorFor('emojiDelete'),
      title: 'Emoji removed',
    })
      .addField('Name', emoji.name)
      .addField('ID', emoji.id)
      .addField('Animated', emoji.animated)
      .setThumbnail(emoji.url)
      .setTimestamp();

    embed.addField('Removed by', auditEvent.executor);

    logChannel.send(embed);
  },
  onEmojiUpdate: (guild: Guild, logChannel: TextChannel) => async (
    prev: GuildEmoji,
    next: GuildEmoji
  ) => {
    const auditEvent = await getLatestAuditEvent(guild);

    const embed = new Embed({
      author: {
        iconURL: guild.iconURL({ format: 'png' }) ?? undefined,
        name: guild.name,
      },
      color: logColorFor('emojiUpdate'),
      title: 'Emoji updated',
      description: `Updated emoji: ${next}`,
    })
      .setThumbnail(next.url)
      .setTimestamp();

    auditEvent.changes?.forEach(change => {
      embed.addField(
        auditChangeTable[change.key] ?? change.key,
        `\`${formatValue(change.old)} => ${formatValue(change.new)}\``
      );
    });

    embed.addField('Updated by', auditEvent.executor);

    logChannel.send(embed);
  },
};
