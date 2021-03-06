import { Message, PermissionString } from 'discord.js';
import { Command, CommandDocs } from '..';
import { Context } from '../../types';
import { codeBlock, Embed, sanitize } from '../../util';

export class CommandKick implements Command {
  cmd = 'kick';
  docs: CommandDocs = {
    usage: 'kick <user> <...reason>',
    description: 'bans',
  };
  userPermissions: PermissionString[] = ['KICK_MEMBERS'];
  botPermissions: PermissionString[] = ['KICK_MEMBERS'];
  async execute(context: Context): Promise<void | Message> {
    const { msg, args } = context;
    if (args._.length === 0)
      return msg.channel.send(Embed.error('Expected a user (and optionally reason)'));

    try {
      const member = msg.guild.members.resolve(args._[0].replace(/[<@!>]/g, ''));

      if (!member)
        return msg.channel.send(Embed.error(`Could not resolve member \`${args._[0]}\``));

      const kicker = msg.guild.members.resolve(msg.author.id)!;

      if (kicker.roles.highest.comparePositionTo(member.roles.highest) <= 0)
        return msg.channel.send(Embed.error('You cannot kick that member'));

      if (msg.guild.me!.roles.highest.comparePositionTo(member.roles.highest) <= 0)
        return msg.channel.send(Embed.error('gamerbot cannot kick that member'));

      if (!member.kick) return msg.channel.send(Embed.error('User cannot be kicked'));

      const reason = args._.slice(1).join(' ') || undefined;

      await member?.kick(reason);
      msg.channel.send(
        Embed.success(
          member.user.tag + ' was kicked',
          reason ? `Reason: ${sanitize(reason)}` : undefined
        )
      );
    } catch (err) {
      msg.channel.send(Embed.error(codeBlock(err)));
    }
  }
}
