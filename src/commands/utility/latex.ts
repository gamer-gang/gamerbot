import { LiteDocument } from 'mathjax-full/js/adaptors/lite/Document.js'
import type { LiteNode } from 'mathjax-full/js/adaptors/lite/Element.js'
import type { LiteText } from 'mathjax-full/js/adaptors/lite/Text.js'
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js'
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js'
import { TeX } from 'mathjax-full/js/input/tex.js'
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages.js'
import { mathjax } from 'mathjax-full/js/mathjax.js'
import { SVG } from 'mathjax-full/js/output/svg.js'
import sharp from 'sharp'
import command, { CommandResult } from '../command.js'

// no-op template function, just return the original string
// this way we get nice syntax highlighting inside the template string
const styled = (strings: TemplateStringsArray, ...values: string[]): string => {
  return strings.reduce((acc, str, i) => acc + str + (i < values.length ? values[i] : ''), '')
}

const TEX_CSS = styled`
  svg g {
    fill: white; /*!COLOR!*/
  }

  [data-mml-node="merror"] > g {
    fill: crimson;
    stroke: crimson;
  }
  [data-mml-node="merror"] > rect[data-background] {
    fill: white;
    stroke: white
  }
  [data-frame], [data-line] {
    stroke-width: 70px;
    fill: none;
  }
  .mjx-dashed {
    stroke-dasharray: 140;
  }
  .mjx-dotted {
    stroke-linecap: round;
    stroke-dasharray: 0, 140;
  }
  use[data-c] {
    stroke-width: 3px;
  }
`

const adaptor = liteAdaptor()
RegisterHTMLHandler(adaptor)

const COMMAND_LATEX = command('CHAT_INPUT', {
  name: 'latex',
  description: 'Render a TeX expression.',
  examples: [
    {
      options: { latex: '`\\frac{1}{2}`' },
      description: 'Render the TeX expression that is the fraction 1/2.',
    },
    {
      options: { latex: '`E=mc^2`', height: 200 },
      description: 'Render the mass-energy equivalence formula E=mc^2, with a height of 200px.',
    },
    {
      options: {
        latex: '`\\frac{1}{2\\pi}\\int_{-\\infty}^{\\infty}e^{-\\frac{x^2}{2}}dx`',
        color: 'black',
        background: 'white',
      },
      description:
        'Render the integral of a Gaussian function, as black text on a white background.',
    },
  ],
  options: [
    {
      name: 'expression',
      description: 'The TeX expression to render.',
      type: 'STRING',
      required: true,
    },
    {
      name: 'width',
      description: 'Width of image in pixels; defaults to none (image width set by height).',
      type: 'INTEGER',
    },
    {
      name: 'height',
      description: 'Height of image in pixels; defaults to 100.',
      type: 'INTEGER',
    },
    {
      name: 'color',
      description: 'Color of text in the rendered image; defaults to #dcddde.',
      type: 'STRING',
    },
    {
      name: 'background',
      description: 'Color of the rendered image background; defaults to transparent.',
      type: 'STRING',
    },
  ],

  async run(context) {
    const { interaction, options } = context

    await interaction.deferReply()

    // mathjax converters
    const tex = new TeX<LiteNode, LiteText, LiteDocument>({ packages: AllPackages })
    const svg = new SVG<LiteNode, LiteText, LiteDocument>({ fontCache: 'none' })
    const html = mathjax.document(new LiteDocument(), { InputJax: tex, OutputJax: svg })

    try {
      // convert the TeX expression to an svg
      const node = html.convert(options.getString('expression', true), {
        display: options.getBoolean('inline') ?? true,
        em: options.getInteger('em-size') ?? 16,
        ex: options.getInteger('ex-size') ?? 8,
        containerWidth: 80 * 16,
      })

      const css = TEX_CSS.replace(
        /^(\s*)(fill|stroke):.+?\/\*!COLOR!\*\/$/gm,
        `$1$2: ${options.getString('color') ?? '#dcddde'}; /*!*/`
      )

      // get the svg as a string and add the css
      const text = adaptor
        .innerHTML(node)
        .replace(/<svg (.+?)>/g, `<svg $1><style>${css}</style>`)
        .replace(/>/g, '>\n') // add newlines for better readability
        .trim()

      // convert the svg to a png image
      let image = sharp(Buffer.from(text, 'utf8')).resize({
        width: options.getInteger('width') ?? undefined,
        height: options.getInteger('height') ?? 100,
      })

      const background = options.getString('background') ?? 'transparent'
      if (background !== 'transparent') {
        image = image.flatten({ background })
      }

      await interaction.editReply({
        files: [{ name: 'latex.png', attachment: await image.png().toBuffer() }],
      })
    } catch (err) {
      throw new Error(
        `Error rendering TeX: your expression is probably invalid.\n${err.message}`.trim(),
        { cause: err }
      )
    }

    return CommandResult.Success
  },
})

export default COMMAND_LATEX
