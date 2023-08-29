import { RepliableInteraction, Snowflake, userMention } from 'discord.js'
import { prisma } from '../../prisma.js'
import { Embed } from '../../util/embed.js'

export async function canAfford(
  interaction: RepliableInteraction,
  userId: Snowflake,
  opponentId: Snowflake,
  wager: number
): Promise<boolean> {
  const user = await prisma.eggLeaderboard.findUnique({
    where: { userId },
    select: { balance: true },
  })
  if ((user?.balance ?? 0) < wager) {
    interaction.reply({
      embeds: [Embed.error(`You are too broke to bet ${wager} egg${wager === 1 ? '' : 's'}.`)],
    })
    return false
  }

  const opponent = await prisma.eggLeaderboard.findUnique({
    where: { userId: opponentId },
    select: { balance: true },
  })

  if ((opponent?.balance ?? 0) < wager) {
    interaction.reply({
      embeds: [
        Embed.error(
          `Your opponent, ${userMention(opponentId)}, is too broke to bet ${wager} egg${
            wager === 1 ? '' : 's'
          }.`
        ),
      ],
    })
    return false
  }

  return true
}

export async function transferEggs(source: Snowflake, destination: Snowflake, wager: number) {
  await prisma.$transaction([
    prisma.eggLeaderboard.update({
      where: { userId: source },
      data: {
        balance: { decrement: wager },
      },
    }),
    prisma.eggLeaderboard.update({
      where: { userId: destination },
      data: {
        balance: { increment: wager },
      },
    }),
  ])
}
