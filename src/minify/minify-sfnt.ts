import { Cmap, Glyf, Hmtx, Loca, Post, Vmtx } from '../sfnt'
import { minifyGlyphs } from './minify-glyphs'
import type { Sfnt } from '../sfnt'

export function minifySfnt(sfnt: Sfnt, subset: string): Sfnt {
  const glyphs = minifyGlyphs(sfnt, subset)
  const numGlyphs = glyphs.length

  const { head, maxp, hhea, vhea } = sfnt

  head.checkSumAdjustment = 0
  head.magickNumber = 0x5F0F3CF5
  head.indexToLocFormat = 1

  maxp.numGlyphs = numGlyphs

  let offset = 0
  sfnt.loca = Loca.from(
    [
      ...glyphs.map(glyph => {
        const result = offset
        offset += glyph.view.byteLength
        return result
      }),
      offset,
    ],
    head.indexToLocFormat,
  )

  sfnt.cmap = Cmap.from(glyphs.reduce((map, glyph, glyphIndex) => {
    map[glyph.unicode!] = glyphIndex
    return map
  }, {} as Record<number, number>))

  sfnt.glyf = Glyf.from(glyphs.map(glyph => glyph.view))

  hhea.numOfLongHorMetrics = numGlyphs

  sfnt.hmtx = Hmtx.from(glyphs.map(glyph => ({
    advanceWidth: glyph.advanceWidth,
    leftSideBearing: glyph.leftSideBearing,
  })))

  if (vhea) vhea.numOfLongVerMetrics = numGlyphs

  const vmtx = sfnt.vmtx
  if (vmtx) {
    sfnt.vmtx = Vmtx.from(glyphs.map(glyph => ({
      advanceHeight: glyph.advanceHeight,
      topSideBearing: glyph.topSideBearing,
    })))
  }

  const post = new Post()
  post.format = 3
  post.italicAngle = 0
  post.underlinePosition = 0
  post.underlineThickness = 0
  post.isFixedPitch = 0
  post.minMemType42 = 0
  post.minMemType42 = 0
  post.minMemType1 = 0
  post.maxMemType1 = numGlyphs
  sfnt.post = post

  return sfnt
}
