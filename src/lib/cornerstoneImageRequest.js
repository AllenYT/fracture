import { addTaskIntoPool } from './taskHelper'
import cornerstone from 'cornerstone-core'

// function addTaskPool(series) {
//   lodash.forEach(series, (item) => {
//     if (item && item.imageIds) {
//       lodash.forEach(item.imageIds, (imageId) => {
//         const imageTask = buildImageRequestTask(imageId, {
//           extra: { series: item.seriesInstanceUID },
//         })
//         addTaskIntoPool(imageTask)
//       })
//     }
//   })
// }

export function loadAndCacheImagePlus(imageId, priority = 999) {
  return new Promise((resolve, reject) => {
    const imageLoadObject = cornerstone.imageCache.getImageLoadObject(imageId)
    if (imageLoadObject) {
      imageLoadObject.promise.then(
        (image) => {
          resolve(image)
        },
        (err) => {
          reject(err)
        }
      )
    } else {
      const imageTask = buildImageRequestTask(imageId, { priority })
      addTaskIntoPool(imageTask)
        .then((res) => {
          resolve(res)
        })
        .catch((e) => {
          reject(e)
        })
    }
  })
}

function buildImageRequestTask(imageId, config = {}) {
  return {
    key: imageId,
    ...config,
    execute: () => {
      return cornerstone.loadAndCacheImage(imageId)
    },
  }
}
