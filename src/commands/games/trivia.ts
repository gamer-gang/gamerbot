import {
  ButtonInteraction,
  CommandInteraction,
  Formatters,
  Message,
  MessageActionRow,
  MessageButton,
  MessageOptions,
} from 'discord.js'
import he from 'he'
import _ from 'lodash'
import assert from 'node:assert'
import { IS_DEVELOPMENT } from '../../constants.js'
import { TriviaManager } from '../../TriviaManager.js'
import { TriviaQuestion } from '../../types/trivia.js'
import { escapeMarkdown } from '../../util.js'
import { Embed } from '../../util/embed.js'
import command, { CommandResult } from '../command.js'

const categories = await TriviaManager.getCategories()
const categoryIds = categories.map((category) => category.id)

const TIME_LIMIT = 15_000

const COMMAND_TRIVIA = command('CHAT_INPUT', {
  name: 'trivia',
  description: 'Answer a trivia question.',
  longDescription:
    'Answer a trivia question. A category, difficulty, and type (true/false or multiple choice) can be specified.',
  examples: [
    {
      options: { category: '18: Science: Computers', difficulty: 'Hard' },
      description: 'Get a hard question about computers.',
    },
    {
      options: { difficulty: 'Easy', type: 'True/False' },
      description: 'Get an easy true/false question.',
    },
  ],
  options: [
    {
      name: 'category',
      description: 'Category of the question.',
      type: 'INTEGER',
      required: false,
      choices: categories.map(({ id, name }) => ({
        name: `${id}: ${name}`,
        value: id,
      })),
    },
    {
      name: 'difficulty',
      description: 'Difficulty of the question.',
      type: 'STRING',
      required: false,
      choices: [
        { name: 'Easy', value: 'easy' },
        { name: 'Medium', value: 'medium' },
        { name: 'Hard', value: 'hard' },
      ],
    },
    {
      name: 'type',
      description: 'Type of question',
      type: 'STRING',
      required: false,
      choices: [
        {
          name: 'True/False',
          value: 'boolean',
        },
        {
          name: 'Multiple choice',
          value: 'multiple',
        },
      ],
    },
  ],

  async run(context) {
    const { interaction, options, client } = context

    assert(interaction.channel, 'Interaction has no channel')

    const category = options.getInteger('category') ?? undefined
    if (category != null && !categoryIds.includes(category)) {
      await interaction.reply({
        embeds: [Embed.error('Invalid category ID.')],
        ephemeral: true,
      })
      return CommandResult.Success
    }

    const difficulty = options.getString('difficulty') ?? undefined
    if (
      difficulty != null &&
      difficulty !== 'easy' &&
      difficulty !== 'medium' &&
      difficulty !== 'hard'
    ) {
      await interaction.reply({
        embeds: [Embed.error('Invalid difficulty.')],
        ephemeral: true,
      })
      return CommandResult.Success
    }

    const type = options.getString('type') ?? 'multiple'
    if (type !== 'boolean' && type !== 'multiple') {
      await interaction.reply({
        embeds: [Embed.error('Invalid question type.')],
        ephemeral: true,
      })
      return CommandResult.Success
    }

    await interaction.deferReply()

    const question = await client.triviaManager
      .fetchQuestion({
        category,
        difficulty,
        type,
      })
      .then((res) => res.results[0])

    const { message, correctEncoded, correct } = parseQuestion(question)

    const reply = await interaction.editReply(message)
    const questionMessage = interaction.channel.messages.resolve(reply.id)
    assert(questionMessage, 'Reply is missing')

    const response = await collectResponse(questionMessage, interaction)

    const componentsHighlighted = (message.components ?? []).slice(0, 1).map((row) => {
      assert(row.type === 'ACTION_ROW')

      const components = row.components.map((button) => {
        assert(button instanceof MessageButton)
        button.setDisabled(true)
        if (button.customId === `ans_${correctEncoded}`) {
          button.setStyle('SUCCESS')
        } else if (response?.customId === button.customId) {
          button.setStyle('DANGER')
        }
        return button
      })

      return { ...row, components }
    })

    void interaction.editReply({
      ...message,
      components: componentsHighlighted,
    })

    let correctMessage = `The correct answer was **${escapeMarkdown(correct)}**.`

    if (!response) {
      await interaction.followUp({
        embeds: [Embed.error(`You ran out of time! ${correctMessage}`)],
      })

      return CommandResult.Success
    }

    const userAnswer = response.customId.replace(/^ans_/, '')
    if (userAnswer === correctEncoded) {
      await response.reply({
        embeds: [Embed.success('Correct!')],
      })
      return CommandResult.Success
    }

    if (response.customId !== 'giveup') {
      correctMessage = `Incorrect! ${correctMessage}`
    }

    await response.reply({
      embeds: [Embed.error(correctMessage)],
    })

    return CommandResult.Success
  },
})

export default COMMAND_TRIVIA

const parseQuestion = (
  question: TriviaQuestion
): {
  message: MessageOptions
  encoded: string[]
  answers: string[]
  correct: string
  correctEncoded: string
} => {
  let answers: string[]
  if (question.type === 'boolean') {
    answers = ['True', 'False']
  } else {
    const list = [question.correct_answer, ...question.incorrect_answers]
    answers = _.shuffle(list).map((v) => he.decode(v))
  }

  const encoded = answers.map((ans) => Buffer.from(ans).toString('base64'))
  const correct = he.decode(question.correct_answer)
  const correctEncoded = Buffer.from(correct).toString('base64')

  const sanitized = answers.map((ans) => escapeMarkdown(ans))

  let title = escapeMarkdown(he.decode(question.question))
  if (question.type === 'boolean' && !title.includes('?')) {
    title = `True or false: ${title}`
  }
  title = Formatters.bold(title)

  const embed = new Embed({
    author: {
      name: `${question.category} - ${_.capitalize(
        question.difficulty
      )}   ·   Time limit: ${Math.floor(TIME_LIMIT / 1000)} seconds`,
    },
    title,
  })

  if (IS_DEVELOPMENT) {
    embed.setFooter({
      text: `Correct answer: ${he.decode(question.correct_answer)} (ans_${correctEncoded})`,
    })
  }

  const components = [
    new MessageActionRow({
      components: sanitized.map(
        (ans, i) =>
          new MessageButton({
            customId: `ans_${encoded[i]}`,
            label: ans,
            style: 'PRIMARY',
          })
      ),
    }),
    new MessageActionRow({
      components: [
        new MessageButton({
          customId: 'giveup',
          label: 'Give up',
          style: 'DANGER',
        }),
      ],
    }),
  ]

  return {
    message: { embeds: [embed], components },
    encoded,
    answers,
    correct,
    correctEncoded,
  }
}

const collectResponse = (
  questionMessage: Message,
  interaction: CommandInteraction
): Promise<ButtonInteraction | undefined> => {
  return new Promise((resolve) => {
    let resolved = false
    const collector = questionMessage.createMessageComponentCollector({
      time: TIME_LIMIT,
      dispose: true,
    })

    collector.on('collect', async (reply) => {
      if (reply.user.id !== interaction.user.id) {
        await reply.reply({
          embeds: [Embed.error("This isn't your question! Ask your own with /trivia.")],
          ephemeral: true,
        })
      }

      assert(reply.isButton(), 'Reply is not a button interaction')
      resolved = true
      resolve(reply)
      collector.stop()
    })

    collector.on('end', () => {
      if (!resolved) resolve(undefined)
    })
  })
}
