import { Snowflake } from 'discord.js'
import { prisma } from '../../prisma.js'

export async function isTooBroke(interaction: { reply: (arg0: string) => void }, instigatorId: Snowflake, opponentId: Snowflake, wager: number): Promise<boolean> {
  if (
    ((
      await prisma.eggLeaderboard.findFirst({
        where: {
          userId: instigatorId,
        },
      })
    )?.balance ?? 0) < wager
  ) {
    interaction.reply(`You are too broke to bet ${wager} eggs.`)
    return true
  }

  if (
    ((
      await prisma.eggLeaderboard.findFirst({
        where: {
          userId: opponentId,
        },
      })
    )?.balance ?? 0) < wager
  ) {
    interaction.reply(`Your opponent is too broke to bet ${wager} eggs.`)
    return true
  }

  return false
}

export async function updateBalances(winnerId: Snowflake, loserId: Snowflake, wager: number) {
  await prisma.eggLeaderboard.update({
    where: {
      userId: winnerId,
    },
    data: {
      balance: {
        increment: wager
      }
    }
  })

  await prisma.eggLeaderboard.update({
    where: {
      userId: loserId,
    },
    data: {
      balance: {
        decrement: wager
      }
    }
  })
}
