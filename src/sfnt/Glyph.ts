import type { Sfnt } from './Sfnt'

export interface GlyphOptions {
  index?: number
  name?: string | null
  unicode?: number
  unicodes?: number[]
  advanceWidth?: number
  leftSideBearing?: number
}

export interface GlyphComponent {
  glyphIndex: number
  dx: number
  dy: number
  xScale?: number
  scale01?: number
  scale10?: number
  yScale?: number
  matchedPoints?: number[]
}

export type GlyphPathCommand =
  | { type: 'M', x: number, y: number }
  | { type: 'L', x: number, y: number }
  | { type: 'Q', x1: number, y1: number, x: number, y: number }
  | { type: 'C', x1: number, y1: number, x2: number, y2: number, x: number, y: number }
  | { type: 'Z' }

export class Glyph {
  index: number
  name: string | null
  unicode = 0
  unicodes: number[] = []
  advanceWidth = 0
  leftSideBearing = 0
  isComposite = false
  components: GlyphComponent[] = []
  pathCommands: GlyphPathCommand[] = []

  constructor(
    options: GlyphOptions,
  ) {
    const config: GlyphOptions = { ...options }

    this.index = config.index ?? 0

    if (config.name === '.notdef') {
      config.unicode = undefined
    }
    else if (config.name === '.null') {
      config.unicode = 0
    }

    if (config.unicode === 0 && config.name !== '.null') {
      throw new Error('The unicode value "0" is reserved for the glyph name ".null" and cannot be used by any other glyph.')
    }

    this.name = config.name ?? null
    this.unicode = config.unicode ?? 0
    this.unicodes = config.unicodes ?? (config.unicode !== undefined ? [config.unicode] : [])
  }

  getPathCommands(x = 0, y = 0, fontSize = 72, options: Record<string, any> = {}, sfnt?: Sfnt): GlyphPathCommand[] {
    const scale = 1 / (sfnt?.unitsPerEm ?? 1000) * fontSize
    const { xScale = scale, yScale = scale } = options
    const pathCommands = this.pathCommands
    const commands: GlyphPathCommand[] = []
    for (let i = 0, len = pathCommands.length; i < len; i += 1) {
      const cmd = pathCommands[i]
      if (cmd.type === 'M') {
        commands.push({ type: 'M', x: x + (cmd.x * xScale), y: y + (-cmd.y * yScale) })
      }
      else if (cmd.type === 'L') {
        commands.push({ type: 'L', x: x + (cmd.x * xScale), y: y + (-cmd.y * yScale) })
      }
      else if (cmd.type === 'Q') {
        commands.push({ type: 'Q', x1: x + (cmd.x1 * xScale), y1: y + (-cmd.y1 * yScale), x: x + (cmd.x * xScale), y: y + (-cmd.y * yScale) })
      }
      else if (cmd.type === 'C') {
        commands.push({ type: 'C', x1: x + (cmd.x1 * xScale), y1: y + (-cmd.y1 * yScale), x2: x + (cmd.x2 * xScale), y2: y + (-cmd.y2 * yScale), x: x + (cmd.x * xScale), y: y + (-cmd.y * yScale) })
      }
      else if (cmd.type === 'Z') {
        commands.push({ type: 'Z' })
      }
    }
    return commands
  }
}
