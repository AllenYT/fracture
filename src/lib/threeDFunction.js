export const transformOriginToPixel = (origin) => {
  // origin to pixel
  const pixel = []
  const axialPixel = []
  axialPixel[0] = origin[0] / this.getRatio(0, 0) + this.getTopLeftOffset(0).x
  axialPixel[1] = origin[1] / this.getRatio(0, 1) + this.getTopLeftOffset(0).y

  const coronalPixel = []
  coronalPixel[0] = origin[0] / this.getRatio(1, 0) + this.getTopLeftOffset(1).x
  coronalPixel[1] = origin[2] / this.getRatio(1, 1) + this.getTopLeftOffset(1).y

  const sagittalPixel = []
  sagittalPixel[0] = origin[1] / this.getRatio(2, 0) + this.getTopLeftOffset(2).x
  sagittalPixel[1] = origin[2] / this.getRatio(2, 1) + this.getTopLeftOffset(2).y
  pixel[0] = axialPixel
  pixel[1] = coronalPixel
  pixel[2] = sagittalPixel
  return pixel
}
export const transformPixelToOrigin = (pixel, model) => {
  // pixel to origin
  // for model parameter, 0 represents axial, 1 represents coronal, 2 represents sagittal
  const origin = []
  if (model === 0) {
    origin[0] = (pixel[0] - this.getTopLeftOffset(0).x) * this.getRatio(0, 0)
    origin[1] = (pixel[1] - this.getTopLeftOffset(0).y) * this.getRatio(0, 1)
    origin[2] = this.state.origin[2]
  } else if (model === 1) {
    origin[0] = (pixel[0] - this.getTopLeftOffset(1).x) * this.getRatio(1, 0)
    origin[1] = this.state.origin[1]
    origin[2] = (pixel[1] - this.getTopLeftOffset(1).y) * this.getRatio(1, 1)
  } else if (model === 2) {
    origin[0] = this.state.origin[0]
    origin[1] = (pixel[0] - this.getTopLeftOffset(2).x) * this.getRatio(2, 0)
    origin[2] = (pixel[1] - this.getTopLeftOffset(2).y) * this.getRatio(2, 1)
  }
  return origin
}

export const getRatio = (model, cor) => {
  //ratio for pixel to origin
  //for model parameter, 0 represents axial, 1 represents coronal, 2 represents sagittal
  //for cor parameter, 0 represents x, 1 represents y
  const { originXBorder, originYBorder, originZBorder } = this.state
  let ratio
  switch (model) {
    case 0:
      ratio = cor === 0 ? originXBorder / 272 : originYBorder / -272 // x's length:(442 - 170) y's length:(84 - 356)
      break
    case 1:
      ratio = cor === 0 ? originXBorder / 272 : originZBorder / -212 // x's length:(442 - 170) y's length:(114 - 326)
      break
    case 2:
      ratio = cor === 0 ? originYBorder / 272 : originZBorder / -212 // x's length:(442 - 170) y's length:(114 - 326)
      break
    default:
      break
  }
  return ratio
}
export const getTopLeftOffset = (model) => {
  //volume's top left, not viewer's top left
  //for model parameter, 0 represents axial, 1 represents coronal, 2 represents sagittal
  let x, y
  switch (model) {
    case 0:
      x = 170
      y = 356
      break
    case 1:
      x = 170
      y = 326
      break
    case 2:
      x = 170
      y = 326
      break
    default:
      break
  }
  return { x, y }
}
