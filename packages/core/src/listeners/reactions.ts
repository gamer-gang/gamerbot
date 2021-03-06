import { Message, MessageReaction, PartialMessage, PartialUser, User } from 'discord.js';
import { ReactionRole, RoleEmoji } from '../entities/ReactionRole';
import { client, getLogger, orm } from '../providers';
import { Embed } from '../util';

const verifyReaction = async (
  reaction: MessageReaction,
  user: User | PartialUser
): Promise<boolean> => {
  if (!reaction.partial) return true;

  try {
    await reaction.fetch();
    return true;
  } catch (err) {
    getLogger(`REACTION ON ${reaction.message.id}`).error('fetch error message: ', err);

    const dm = await user.createDM();
    dm.send(
      Embed.error(
        'error modifying roles in ' + reaction.message.guild?.name,
        `\`\`\`\n${err}\n\`\`\`\n` +
          'please contact wiisportsresorts#9388 or a server admin for help.'
      )
    );

    return false;
  }
};

const roleError = async ({
  reaction,
  user,
  collector,
}: {
  reaction: MessageReaction;
  user: User | PartialUser;
  collector: RoleEmoji;
}) => {
  const dm = await user.createDM();
  dm.send(
    Embed.error(
      'error modifying roles in ' + reaction.message.guild?.name,
      `\`\`\`\nrole id of ${collector.roleId} could not be resolved\n\`\`\`\n` +
        'please contact wiisportsresorts#9388 or a server admin for help.'
    )
  );
};

const getCollector = async ({
  msg,
  reaction,
}: {
  msg: Message | PartialMessage;
  reaction: MessageReaction;
}) => {
  const collectorMessage = await orm.em.findOne(ReactionRole, { messageId: msg.id });
  if (!collectorMessage) return;

  const items = await collectorMessage.roles.loadItems();
  return items.find(e => e.emoji === reaction.emoji.toString() || e.emoji === reaction.emoji.id);
};

const missingPermissions = ({
  msg,
  user,
}: {
  msg: Message | PartialMessage;
  user: User | PartialUser;
}) => {
  if (msg.guild?.me?.hasPermission('MANAGE_ROLES')) return true;

  msg.channel.send(
    Embed.error(
      user +
        ": i can't modify your roles because the bot is missing the `MANAGE_ROLES` " +
        'permission. please contact a server admin for help.'
    )
  );
  return false;
};

export const onMessageReactionAdd = async (
  reaction: MessageReaction,
  user: User | PartialUser
): Promise<unknown> => {
  const { message: msg } = reaction;
  if (user.id === client.user?.id) return;
  if (!(await verifyReaction(reaction, user))) return;

  const collector = await getCollector({ msg, reaction });
  if (!collector) return;

  if (!missingPermissions({ msg, user })) return;

  const role = msg.guild?.roles.resolve(collector.roleId);
  if (!role) return roleError({ reaction, user, collector });

  await msg.guild?.members.resolve(user.id)?.roles.add(role);

  const dm = await user.createDM();
  dm.send(
    Embed.success(
      `received role \`${role.name}\` in ${msg.guild?.name}!`,
      'remove the reaction from the message to remove this role.'
    )
  );
};

export const onMessageReactionRemove = async (
  reaction: MessageReaction,
  user: User | PartialUser
): Promise<unknown> => {
  const { message: msg } = reaction;
  if (user.id === client.user?.id) return;
  if (!(await verifyReaction(reaction, user))) return;

  const collector = await getCollector({ msg, reaction });
  if (!collector) return;

  if (!missingPermissions({ msg, user })) return;

  const role = msg.guild?.roles.resolve(collector.roleId);
  if (!role) return roleError({ reaction, user, collector });

  await msg.guild?.members.resolve(user.id)?.roles.remove(role);

  const dm = await user.createDM();
  dm.send(
    Embed.success(
      `removed role \`${role.name}\` in ${msg.guild?.name}!`,
      'react to the message again to get the role back.'
    )
  );
};
