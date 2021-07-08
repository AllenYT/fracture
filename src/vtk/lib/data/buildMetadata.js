/*
 * @Author: your name
 * @Date: 2021-05-13 11:52:21
 * @LastEditTime: 2021-06-10 17:52:39
 * @LastEditors: your name
 * @Description: In User Settings Edit
 * @FilePath: \deepln-dazhou-new\src\vtk\lib\data\buildMetadata.js
 */
import cornerstone from 'cornerstone-core'

export default function buildMetadata(imageIds) {
  // Retrieve the Cornerstone imageIds from the display set
  // TODO: In future, we want to get the metadata independently from Cornerstone
  const imageId0 = imageIds[0]

  const { pixelRepresentation, bitsAllocated, bitsStored, highBit, photometricInterpretation, samplesPerPixel } = cornerstone.metaData.get('imagePixelModule', imageId0)

  let { windowWidth, windowCenter } = cornerstone.metaData.get('voiLutModule', imageId0)

  // TODO maybe expose voi lut lists?
  if (Array.isArray(windowWidth)) {
    windowWidth = windowWidth[0]
  }

  if (Array.isArray(windowCenter)) {
    windowCenter = windowCenter[0]
  }

  const { modality } = cornerstone.metaData.get('generalSeriesModule', imageId0)

  // Compute the image size and spacing given the meta data we already have available.
  const metaDataMap = new Map()
  imageIds.forEach((imageId) => {
    // TODO: Retrieve this from somewhere other than Cornerstone
    const metaData = cornerstone.metaData.get('imagePlaneModule', imageId)
    metaData.imageId = imageId
    metaDataMap.set(imageId, metaData)
  })

  return {
    metaData0: metaDataMap.values().next().value,
    metaDataMap,
    imageIds,
    imageMetaData0: {
      bitsAllocated,
      bitsStored,
      samplesPerPixel,
      highBit,
      photometricInterpretation,
      pixelRepresentation,
      windowWidth,
      windowCenter,
      modality,
    },
  }
}
