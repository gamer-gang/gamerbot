import {
  ActionRowBuilder,
  APIButtonComponentWithCustomId,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  CommandInteraction,
  ComponentType,
  Message,
} from 'discord.js'
import he from 'he'
import _ from 'lodash'
import assert from 'node:assert'
import { TriviaManager } from '../../client/TriviaManager.js'
import { IS_DEVELOPMENT } from '../../env.js'
import type { TriviaQuestion } from '../../types/trivia.js'
import { escapeMarkdown } from '../../util.js'
import { Embed } from '../../util/embed.js'
import command, { CommandResult } from '../command.js'

const categories = await TriviaManager.getCategories()
const categoryIds = categories.map((category) => category.id)

const TIME_LIMIT = 15_000

const COMMAND_TRIVIA = command(ApplicationCommandType.ChatInput, {
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
      type: ApplicationCommandOptionType.Integer,
      required: false,
      choices: categories.map(({ id, name }) => ({
        name: `${id}: ${name}`,
        value: id,
      })),
    },
    {
      name: 'difficulty',
      description: 'Difficulty of the question.',
      type: ApplicationCommandOptionType.String,
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
      type: ApplicationCommandOptionType.String,
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

    const { embed, components, correctEncoded, correct } = parseQuestion(question)

    const reply = await interaction.editReply({ embeds: [embed], components })
    const questionMessage = interaction.channel.messages.resolve(reply.id)
    assert(questionMessage, 'Reply is missing')

    const response = await collectResponse(questionMessage, interaction)

    const componentsHighlighted = (components ?? []).slice(0, 1).map((row) => {
      const components = row.components.map((button) => {
        button.setDisabled(true)
        const buttonId = (button.toJSON() as APIButtonComponentWithCustomId).custom_id
        if (buttonId === `ans_${correctEncoded}`) {
          button.setStyle(ButtonStyle.Success)
        } else if (response?.customId === buttonId) {
          button.setStyle(ButtonStyle.Danger)
        }
        return button
      })

      return row.setComponents(components)
    })

    void interaction.editReply({
      embeds: [embed],
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
  embed: Embed
  components: ActionRowBuilder<ButtonBuilder>[]
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
  title = `**${title}**`

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
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      sanitized.map(
        (ans, i) =>
          new ButtonBuilder({
            customId: `ans_${encoded[i]}`,
            label: ans,
            style: ButtonStyle.Primary,
          })
      )
    ),
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder({
        customId: 'giveup',
        label: 'Give up',
        style: ButtonStyle.Danger,
      })
    ),
  ]

  return {
    embed,
    components,
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
    const collector = questionMessage.createMessageComponentCollector<ComponentType.Button>({
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
