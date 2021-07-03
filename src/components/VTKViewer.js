import React, { Component } from 'react'
import { vec3, vec4, mat4 } from 'gl-matrix'
import { DropTarget } from 'react-dnd'
import { Loader } from 'semantic-ui-react'
import cornerstone from 'cornerstone-core'
import axios from 'axios'
import qs from 'qs'

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor'
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper'
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction'
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction'
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray'
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData'
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource'
import vtkImageReslice from 'vtk.js/Sources/Imaging/Core/ImageReslice'
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume'
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper'
import vtkLineSource from 'vtk.js/Sources/Filters/Sources/LineSource'
import vtkXMLPolyDataReader from 'vtk.js/Sources/IO/XML/XMLPolyDataReader'
import HttpDataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper'

import View2D from '../vtk/VTKViewport/View2D'
import getImageData from '../vtk/lib/getImageData'
import loadImageData from '../vtk/lib/loadImageData'
import vtkSVGRotatableCrosshairsWidget from '../vtk/VTKViewport/vtkSVGRotatableCrosshairsWidget'
import vtkInteractorStyleRotatableMPRCrosshairs from '../vtk/VTKViewport/vtkInteractorStyleRotatableMPRCrosshairs'
import vtkInteractorStyleMPRWindowLevel from '../vtk/VTKViewport/vtkInteractorStyleMPRWindowLevel'

import VTK2DViewer from './VTK2DViewer'
import VTK3DViewer from './VTK3DViewer'

import { frenet } from '../lib/frenet'
import { handleConfig } from '../lib/handleConfig'
import { loadAndCacheImagePlus } from '../lib/cornerstoneImageRequest'
import { executeTask } from '../lib/taskHelper'
import lobes from '../lobes.json'
import centerLine from '../center_line.json'
import oneAirway from '../one_airway.json'

import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader'
import { max } from 'vtk.js/Sources/Common/Core/Math'
cornerstoneWADOImageLoader.external.cornerstone = cornerstone

const Types = {
  DATESERIE: 'dateSerie',
}

const viewerTarget = {
  canDrop(props, monitor) {
    // console.log("canDrop");

    const item = monitor.getItem()

    return true
  },

  hover(props, monitor, component) {
    // console.log("hover");

    // mouse's client offset
    const clientOffset = monitor.getClientOffset()

    // const componentRect = findDOMNode(component).getBoundingClientRect()

    // You can check whether we're over a nested drop target
    const isOnlyThisOne = monitor.isOver({ shallow: true })

    // You will receive hover() even for items for which canDrop() is false
    const canDrop = monitor.canDrop()
  },

  drop(props, monitor, component) {
    // console.log("drop");

    if (monitor.didDrop()) {
      // console.log("have dropped");
      return
    }

    const item = monitor.getItem()

    //do something with it
    const newCaseId = item.caseId
    const oldCaseId = window.location.pathname.split('/segView/')[1].split('/')[0]
    if (newCaseId !== oldCaseId) {
      window.location.href = '/segView/' + newCaseId
    }

    return undefined
  },
}

function collect(connect, monitor) {
  return {
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
    isOverCurrent: monitor.isOver({ shallow: true }),
    canDrop: monitor.canDrop(),
    itemType: monitor.getItemType(),
    item: monitor.getItem(),
  }
}

const dictList = {
  0: {
    class: 3,
    label: 'lung',
    name: '肺',
    color: { c1: 197, c2: 165, c3: 145 },
  },
  1: {
    class: 1,
    label: 'airway',
    name: '支气管',
    color: { c1: 182, c2: 228, c3: 255 },
  },
  2: {
    class: 2,
    label: 'nodule',
    name: '结节',
    color: { c1: 178, c2: 34, c3: 34 },
  },
  3: {
    class: 0,
    label: 'lobe_1',
    name: '右肺中叶',
    color: { c1: 128, c2: 174, c3: 128 },
  },
  4: {
    class: 0,
    label: 'lobe_2',
    name: '右肺上叶',
    color: { c1: 241, c2: 214, c3: 145 },
  },
  5: {
    class: 0,
    label: 'lobe_3',
    name: '右肺下叶',
    color: { c1: 177, c2: 122, c3: 101 },
  },
  6: {
    class: 0,
    label: 'lobe_4',
    name: '左肺上叶',
    color: { c1: 111, c2: 184, c3: 210 },
  },
  7: {
    class: 0,
    label: 'lobe_5',
    name: '左肺下叶',
    color: { c1: 216, c2: 101, c3: 79 },
  },
}
const nodulePosition = {
  0: '选择位置',
  1: '右肺中叶',
  2: '右肺上叶',
  3: '右肺下叶',
  4: '左肺上叶',
  5: '左肺下叶',
}
const noduleMalignancyName = {
  S1: '右肺上叶-尖段',
  S2: '右肺上叶-后段',
  S3: '右肺上叶-前段',
  S4: '右肺中叶-外侧段',
  S5: '右肺中叶-内侧段',
  S6: '右肺下叶-背段',
  S7: '右肺下叶-内基底段',
  S8: '右肺下叶-前基底段',
  S9: '右肺下叶-外基底段',
  S10: '右肺下叶-后基底段',
  S11: '左肺上叶-尖后段',
  S12: '左肺上叶-前段',
  S13: '左肺上叶-上舌段',
  S14: '左肺上叶-下舌段',
  S15: '左肺下叶-背段',
  S16: '左肺下叶-内前基底段',
  S17: '左肺下叶-外基底段',
  S18: '左肺下叶-后基底段',
}
// initial
// const styleOfSelectionOne = {
//     show: {
//         position: "absolute",
//         top: "0",
//         left: "0",
//         width: `${viewerWidth}px`,
//         height: `${viewerHeight}px`,
//     },
//     hidden: {
//         position: "absolute",
//         top: "0",
//         left: "0",
//         width: "0",
//         height: "0",
//     },
// };

class VTKViewer extends Component {
  constructor(props) {
    super(props)
    this.state = {
      viewerWidth: props.viewerWidth,
      viewerHeight: props.viewerWidth,
      caseId: window.location.pathname.split('/segView/')[1].split('/')[0],
      username: window.location.pathname.split('/segView/')[1].split('/')[1],
      imageIds: [],
      urls: [],
      nodulesData: [],
      show: false,
      segments: [],
      lobesLength: 0,
      airwayLength: 0,
      nodulesLength: 0,
      voi: { windowWidth: 1600, windowCenter: -600 },
      segRange: {
        xMax: -Infinity,
        yMax: -Infinity,
        zMax: -Infinity,
        xMin: Infinity,
        yMin: Infinity,
        zMin: Infinity,
      },
      percent: [],
      listLoading: [],
      vtkImageData: null,
      volumes: [],
      volumesLoading: true,
      labelDataArray: [],
      labelData: {},
      labelMapInputData: null,
      labelThreshold: 300,
      labelColor: [255, 0, 0],
      paintRadius: 5,
      origin: [0, 0, 0],
      spacing: [],
      dimensions: [],
      originXBorder: 1,
      originYBorder: 1,
      originZBorder: 1,
      pointActors: [],
      editing: false,
      painting: false,
      erasing: false,
      mode: 1,
      selectedNum: 0,
      fragmentVolumes: [],
      airwayPicking: false,
      airwayVolumes: [],
      airwayCenterVolumes: [],
      points: [],
    }
    this.config = JSON.parse(localStorage.getItem('config'))
  }

  processCenterLine() {
    const segRange = this.state.segRange
    const spacing = this.state.spacing
    const xOffset = segRange.xMin
    const yOffset = segRange.yMin
    const zOffset = segRange.zMin
    const coos = centerLine.coos
    const points = []
    coos.forEach((item, index) => {
      const z = item[0]
      const y = item[1]
      const x = item[2]
      points.push(vec3.fromValues(Math.floor(x * spacing[0] + xOffset), Math.floor(y * spacing[1] + yOffset), Math.floor(z + zOffset)))
    })
    centerLine.points = points
    console.log(centerLine)
  }
  processRefinedCenterLine() {
    const xOffset = -182
    const yOffset = -330
    const zOffset = -540
    const coos = centerLine.coos
    const points = []
    coos.forEach((item, index) => {
      const z = item[0]
      const y = item[1]
      const x = item[2]
      points.push(vec3.fromValues(Math.floor(x * 0.7 + xOffset), Math.floor(y * 0.7 + yOffset), z + zOffset))
    })
    centerLine.points = points

    const regions = centerLine.regions
    for (let i = 0; i < regions.length; i++) {
      const region = regions[i]
      let zMax, zMin, yMax, yMin, xMax, xMin
      if (region[0][0] < region[1][0]) {
        zMin = region[0][0]
        zMax = region[1][0]
      } else {
        zMin = region[1][0]
        zMax = region[0][0]
      }
      if (region[0][1] < region[1][1]) {
        yMin = region[0][1]
        yMax = region[1][1]
      } else {
        yMin = region[1][1]
        yMax = region[0][1]
      }
      if (region[0][2] < region[1][2]) {
        xMin = region[0][2]
        xMax = region[1][2]
      } else {
        xMin = region[1][2]
        xMax = region[0][2]
      }
      // console.log("airway range", zMax, zMin, yMax, yMin, xMax, xMin)
      const regionPoints = []
      coos.forEach((item, index) => {
        const z = item[0]
        const y = item[1]
        const x = item[2]
        if (z <= zMax && z >= zMin && y <= yMax && y >= yMin && x <= xMax && x >= xMin) {
          regionPoints.push(vec3.fromValues(Math.floor(x * 0.7 + xOffset), Math.floor(y * 0.7 + yOffset), z + zOffset))
        }
      })
      centerLine.regions[i].points = regionPoints
    }
  }
  processOneAirway() {
    const coos = oneAirway.coos
    const points = []
    coos.forEach((item, index) => {
      if (true) {
        const z = item[0]
        const y = item[1]
        const x = item[2]
        points.push(vec3.fromValues(Math.floor(x * 0.7 - 182), Math.floor(y * 0.7 - 330), z - 540))
      }
    })
    oneAirway.points = points
    this.setState({
      points,
    })
  }
  async componentDidMount() {
    this.props.onRef(this)
    this.apis = []
    console.log('call didMount', this.state.caseId)
    const token = localStorage.getItem('token')
    const headers = {
      Authorization: 'Bearer '.concat(token), //add the fun of check
    }
    const dataParams = {
      caseId: this.state.caseId,
    }
    const draftParams = {
      caseId: this.state.caseId,
      username: this.state.username,
    }
    console.log('draftParams', draftParams)
    const urlsPromise = new Promise((resolve, reject) => {
      axios
        .post(this.config.data.getMhaListForCaseId, qs.stringify(dataParams), {
          headers,
        })
        .then((res) => {
          console.log(res)
          // const urls = res.data
          function sortUrl(x, y) {
            // small to big
            if (x[x.length - 5] < y[y.length - 5]) {
              return -1
            } else if (x[x.length - 5] > y[y.length - 5]) {
              return 1
            } else {
              return 0
            }
          }
          // console.log('url request data', res.data)
          const urlData = res.data
          const urls = []
          let count = 0
          let lobesLength = 0
          let airwayLength = 0
          let nodulesLength = 0
          if (urlData) {
            if (urlData.lung && urlData.lung.length > 0) {
            }
            if (urlData.lobe && urlData.lobe.length > 0) {
              const prevCount = count
              urlData.lobe.sort(sortUrl)
              urlData.lobe.forEach((item, index) => {
                const order = Math.round(item[item.length - 5])
                const type = 2 + order
                urls.push({
                  url: item,
                  order,
                  index: index + prevCount,
                  class: dictList[type].class,
                  name: dictList[type].name,
                  color: dictList[type].color,
                })
                count += 1
                lobesLength += 1
              })
            }
            if (urlData.airway && urlData.airway.length > 0) {
              const prevCount = count
              urlData.airway.forEach((item, index) => {
                const order = 0
                const type = 1
                urls.push({
                  url: item,
                  order,
                  index: index + prevCount,
                  class: dictList[type].class,
                  name: dictList[type].name,
                  color: dictList[type].color,
                })
                count += 1
                airwayLength += 1
              })
            }
            if (urlData.nodule && urlData.nodule.length > 0) {
              const prevCount = count
              urlData.nodule.sort(sortUrl)
              urlData.nodule.forEach((item, index) => {
                const order = Math.round(item[item.length - 5])
                const type = 2
                urls.push({
                  url: item,
                  order,
                  index: index + prevCount,
                  class: dictList[type].class,
                  name: dictList[type].name + order,
                  color: dictList[type].color,
                })
                count += 1
                nodulesLength += 1
              })
            }
          }
          const segments = Object.keys(urls).map((key) => null)
          const percent = Object.keys(urls).map((key) => 0)
          const listLoading = Object.keys(urls).map((key) => true)
          this.setState({
            urls: urls,
            lobesLength,
            airwayLength,
            nodulesLength,
            segments: segments,
            percent: percent,
            listLoading: listLoading,
          })
          urls.forEach((item, index) => {
            this.DownloadSegment(item.index)
          })
          resolve(urls)
        }, reject)
        .catch((error) => {
          console.log(error)
        })
    })
    const urls = await urlsPromise
    console.log('urls', urls)
    // function sortByProp(prop) {
    //   return function (a, b) {
    //     var value1 = a[prop]
    //     var value2 = b[prop]
    //     return value1 - value2
    //   }
    // }
    const lobesData = lobes.lobes
    lobesData.forEach((item, index) => {
      item.index = index
      item.order = urls[index].order
    })
    this.props.saveLobesData(lobesData)
    axios.post(this.config.draft.getRectsForCaseIdAndUsername, qs.stringify(draftParams)).then((res) => {
      const data = res.data
      // console.log('nodule request data', res)
      const nodulesData = []
      if (data && data.length !== 0) {
        data.forEach((item, index) => {
          let position = nodulePosition[item.place]
          let malignancyName = noduleMalignancyName[item.malignancy]
          if (!position) {
            position = '待定'
          }
          if (!malignancyName) {
            malignancyName = '待定'
          }
          const { lobesLength, airwayLength } = this.state
          const urlIndex = index + lobesLength + airwayLength
          if (urlIndex <= urls.length - 1) {
            nodulesData.push({
              index: urlIndex,
              order: urls[urlIndex].order,
              name: urls[urlIndex].name,
              position,
              malignancy: item.malignancy,
              malignancyName,
            })
          }
        })
      }

      this.props.saveNodulesData(nodulesData)
    })
    //local test
    // const fileList = []
    // for (let i = 0; i < 282; i++) {
    //   if (i < 10) {
    //     fileList.push('http://localhost:3000/dcms/00' + i + '.dcm')
    //   } else if (i < 100) {
    //     fileList.push('http://localhost:3000/dcms/0' + i + '.dcm')
    //   } else {
    //     fileList.push('http://localhost:3000/dcms/' + i + '.dcm')
    //   }
    // }
    // const localImageIds = []
    // const filePromises = fileList.map((file) => {
    //   return axios.get(file, { responseType: 'blob' }).then((res) => {
    //     const file = res.data
    //     const imageId = cornerstoneWADOImageLoader.wadouri.fileManager.add(file)
    //     localImageIds.push(imageId)
    //   })
    // })
    // Promise.all(filePromises).then(() => {
    //   this.getMPRInfo(localImageIds)
    // })

    const imageIdsPromise = new Promise((resolve, reject) => {
      axios
        .post(this.config.data.getDataListForCaseId, qs.stringify(dataParams), {
          headers,
        })
        .then((res) => {
          const imageIds = res.data
          resolve(imageIds)
        }, reject)
    })

    const imageIds = await imageIdsPromise
    // imageIds.splice(30, imageIds.length - 30);
    imageIds.forEach((item, idx) => {
      item.replace('data.deepln.deepx.machineilab.org', '192.168.7.198:8095')
    })
    // this.getMPRInfo(imageIds)

    const firstImageId = imageIds[imageIds.length - 1]
    const firstImageIdPromise = new Promise((resolve, reject) => {
      cornerstone.loadAndCacheImage(firstImageId).then((img) => {
        console.log('first img', img)
        let dataSet = img.data
        let imagePositionPatientString = dataSet.string('x00200032')
        let imagePositionPatient = imagePositionPatientString.split('\\')
        let imageOrientationPatientString = dataSet.string('x00200037')
        let imageOrientationPatient = imageOrientationPatientString.split('\\')
        let rowCosines = [imageOrientationPatient[0], imageOrientationPatient[1], imageOrientationPatient[2]]
        let columnCosines = [imageOrientationPatient[3], imageOrientationPatient[4], imageOrientationPatient[5]]

        const xVoxels = img.columns
        const yVoxels = img.rows
        const zVoxels = imageIds.length
        const xSpacing = img.columnPixelSpacing
        const ySpacing = img.rowPixelSpacing
        const zSpacing = 1.0
        const rowCosineVec = vec3.fromValues(...rowCosines)
        const colCosineVec = vec3.fromValues(...columnCosines)
        const scanAxisNormal = vec3.cross([], rowCosineVec, colCosineVec)
        const direction = [...rowCosineVec, ...colCosineVec, ...scanAxisNormal]
        const origin = imagePositionPatient

        const { slope, intercept } = img
        const pixelArray = new Float32Array(xVoxels * yVoxels * zVoxels).fill(intercept)
        const scalarArray = vtkDataArray.newInstance({
          name: 'Pixels',
          numberOfComponents: 1,
          values: pixelArray,
        })

        const imageData = vtkImageData.newInstance()

        imageData.setDimensions(xVoxels, yVoxels, zVoxels)
        imageData.setSpacing(xSpacing, ySpacing, zSpacing)
        imageData.setDirection(direction)
        imageData.setOrigin(...origin)
        imageData.getPointData().setScalars(scalarArray)

        const { actor } = this.createActorMapper(imageData)
        const volumesRange = imageData.getBounds()
        const segRange = {
          xMin: volumesRange[0],
          xMax: volumesRange[1],
          yMin: volumesRange[2],
          yMax: volumesRange[3],
          zMin: volumesRange[4],
          zMax: volumesRange[5],
        }
        const originXBorder = Math.round(xVoxels * xSpacing)
        const originYBorder = Math.round(yVoxels * ySpacing)
        const originZBorder = Math.round(zVoxels * zSpacing)
        console.log('segRange', segRange)
        const numVolumePixels = xVoxels * yVoxels * zVoxels

        // If you want to load a segmentation labelmap, you would want to load
        // it into this array at this point.
        const threeDimensionalPixelData = new Float32Array(numVolumePixels)
        // Create VTK Image Data with buffer as input
        const labelMap = vtkImageData.newInstance()

        // right now only support 256 labels
        const dataArray = vtkDataArray.newInstance({
          numberOfComponents: 1, // labelmap with single component
          values: threeDimensionalPixelData,
        })

        labelMap.getPointData().setScalars(dataArray)
        labelMap.setDimensions(xVoxels, yVoxels, zVoxels)
        labelMap.setSpacing(...imageData.getSpacing())
        labelMap.setOrigin(...imageData.getOrigin())
        labelMap.setDirection(...imageData.getDirection())

        this.setState({
          vtkImageData: imageData,
          volumes: [actor],
          labelMapInputData: labelMap,
          origin: [(segRange.xMax + segRange.xMin) / 2, (segRange.yMax + segRange.yMin) / 2, (segRange.zMax + segRange.zMin) / 2],
          dimensions: [xVoxels, yVoxels, zVoxels],
          spacing: [xSpacing, ySpacing, zSpacing],
          originXBorder,
          originYBorder,
          originZBorder,
          segRange,
        })
        resolve(true)
      }, reject)
    })
    await firstImageIdPromise
    this.processCenterLine()
    this.processOneAirway()
    this.getMPRInfoWithPriority(imageIds)
  }
  componentDidUpdate(prevProps, prevState, snapshot) {}
  getMPRInfo(imageIds) {
    this.setState({
      imageIds: imageIds,
    })
    console.log('before')
    const promises = imageIds.map((imageId) => {
      return cornerstone.loadAndCacheImage(imageId)
    })
    Promise.all(promises).then(() => {
      console.log('after')
      const displaySetInstanceUid = '12345'

      const imageDataObject = getImageData(imageIds, displaySetInstanceUid)
      console.log('imageDataObject', imageDataObject)

      const labelMapInputData = this.setupSyncedBrush(imageDataObject)

      const { actor } = this.createActorMapper(imageDataObject.vtkImageData)

      this.setState({
        vtkImageData: imageDataObject.vtkImageData,
        volumes: [actor],
        labelMapInputData,
      })

      const dimensions = imageDataObject.dimensions
      const spacing = imageDataObject.spacing
      const imagePositionPatient = imageDataObject.metaData0.imagePositionPatient

      const volumesRange = imageDataObject.vtkImageData.getBounds()
      const segRange = {
        xMin: volumesRange[0],
        xMax: volumesRange[1],
        yMin: volumesRange[2],
        yMax: volumesRange[3],
        zMin: volumesRange[4],
        zMax: volumesRange[5],
      }
      console.log('segRange', segRange)
      const origin = [(segRange.xMax + segRange.xMin) / 2, (segRange.yMax + segRange.yMin) / 2, (segRange.zMax + segRange.zMin) / 2]
      console.log('origin', origin)
      const originXBorder = Math.round(512 * spacing[0])
      const originYBorder = Math.round(512 * spacing[1])
      const originZBorder = imageIds.length
      console.log('originXBorder', originXBorder, 'originYBorder', originYBorder, 'originZBorder', originZBorder)

      this.setState({
        origin,
        dimensions,
        spacing,
        originXBorder,
        originYBorder,
        originZBorder,
        segRange,
      })

      loadImageData(imageDataObject)

      const onAllPixelDataInsertedCallback = () => {
        const { actor } = this.createActorMapper(imageDataObject.vtkImageData)

        const scalarsData = imageDataObject.vtkImageData.getPointData().getScalars().getData()
        // const scalarsData = imageDataObject.vtkImageData.getPointData().getScalars().getData()

        // for (let i = 0; i < scalarsData.length; i++) {
        //     if (i < 262144 * 10) {
        //         // console.log("scalars", scalarsData[i])
        //         if (i / 512 < 50 || i % 512 < 50) {
        //             scalarsData[i] = -1024;
        //         }
        //     }
        // }
        // imageDataObject.vtkImageData.modified();
        const rgbTransferFunction = actor.getProperty().getRGBTransferFunction(0)

        const voi = this.state.voi

        const low = voi.windowCenter - voi.windowWidth / 2
        const high = voi.windowCenter + voi.windowWidth / 2

        rgbTransferFunction.setMappingRange(low, high)

        this.setState({
          vtkImageData: imageDataObject.vtkImageData,
          volumes: [actor],
          volumesLoading: false,
          labelMapInputData,
        })
      }

      imageDataObject.onAllPixelDataInserted(onAllPixelDataInsertedCallback)
    })
  }
  getMPRInfoWithPriority(imageIds) {
    const oneInterval = 10
    const twoInterval = 3
    const range = {
      max: Number.NEGATIVE_INFINITY,
      min: Number.POSITIVE_INFINITY,
    }
    let numberProcessed = 0
    const reRenderFraction = imageIds.length / 10
    let reRenderTarget = reRenderFraction
    imageIds.forEach((item, idx) => {
      let priority = 1
      if (idx === imageIds.length / 2) {
        priority = 4
      }
      if (idx % oneInterval === 0) {
        priority = 3
      }
      if (idx % oneInterval !== 0 && (idx % oneInterval) % twoInterval === 0) {
        priority = 2
      }
      loadAndCacheImagePlus(item, priority).then((res) => {
        const { max, min } = this.insertSlice(res, imageIds.length - 1 - idx)
        if (max > range.max) {
          range.max = max
        }

        if (min < range.min) {
          range.min = min
        }

        const dataArray = this.state.vtkImageData.getPointData().getScalars()
        dataArray.setRange(range, 1)
        numberProcessed++

        if (numberProcessed > reRenderTarget) {
          reRenderTarget += reRenderFraction
          this.state.vtkImageData.modified()
        }
        if (numberProcessed === imageIds.length) {
          // Done loading, publish complete and remove all subscriptions.
          this.state.vtkImageData.modified()
        }
      })
    })
    executeTask()
  }
  insertSlice(image, sliceIndex) {
    const imageData = this.state.vtkImageData
    // const imageId = image.imageId
    // const sliceIndex = Math.round(imageId.slice(imageId.length - 7, imageId.length - 4))
    const { slope, intercept } = image
    const scalars = imageData.getPointData().getScalars()
    const scalarData = scalars.getData()

    const pixels = image.getPixelData()
    const sliceLength = pixels.length

    let pixelIndex = 0
    let max = pixels[pixelIndex] * slope + intercept
    let min = max

    for (let pixelIndex = 0; pixelIndex < pixels.length; pixelIndex++) {
      const destIdx = pixelIndex + sliceIndex * sliceLength
      const pixel = pixels[pixelIndex]
      const pixelValue = pixel * slope + intercept

      if (pixelValue > max) {
        max = pixelValue
      } else if (pixelValue < min) {
        min = pixelValue
      }

      scalarData[destIdx] = pixelValue
    }
    return { max, min }
  }
  createPipeline(binary, color, opacity, cl) {
    // console.log("createPipeline")

    const vtpReader = vtkXMLPolyDataReader.newInstance()
    vtpReader.parseAsArrayBuffer(binary)
    const source = vtpReader.getOutputData()

    // const lookupTable = vtkColorTransferFunction.newInstance()
    // const scalars = source.getPointData().getScalars();
    // const dataRange = [].concat(scalars ? scalars.getRange() : [0, 1]);
    // lookupTable.addRGBPoint(200.0,1.0,1.0,1.0)
    // lookupTable.applyColorMap(vtkColorMaps.getPresetByName('erdc_rainbow_bright'))
    // lookupTable.setMappingRange(dataRange[0], dataRange[1]);
    // lookupTable.updateRange();
    // const mapper = vtkMapper.newInstance({
    //   interpolateScalarsBeforeMapping: false, //颜色插值
    //   useLookupTableScalarRange: true,
    //   lookupTable,
    //   scalarVisibility: false,
    // })

    const mapper = vtkMapper.newInstance({
      scalarVisibility: false,
    })

    const actor = vtkActor.newInstance()
    actor.getProperty().setOpacity(opacity)
    actor.setMapper(mapper)

    actor.getProperty().setColor(color.c1 / 255, color.c2 / 255, color.c3 / 255)

    // let color="";
    // function Viewcolor(item){
    //      if(colorName==item.name){
    //       actor.getProperty().setColor(item.colorvalue)
    //      }
    // }

    actor.getProperty().setDiffuse(0.75)
    actor.getProperty().setAmbient(0.2)
    actor.getProperty().setSpecular(0)
    actor.getProperty().setSpecularPower(1)
    mapper.setInputData(source)
    // console.log("actor:", actor)
    return actor
  }
  setWL(model) {
    // for model paramaters: 1 represents LUNG, 2 represents BONE, 3 represents VENTRAL, 4 represents MEDIA
    const voi = this.state.voi
    if (model === 1) {
      voi.windowWidth = 1600
      voi.windowCenter = -600
    } else if (model === 2) {
      voi.windowWidth = 1000
      voi.windowCenter = 300
    } else if (model === 3) {
      voi.windowWidth = 400
      voi.windowCenter = 40
    } else if (model === 4) {
      voi.windowWidth = 500
      voi.windowCenter = 50
    }

    const volume = this.state.volumes[0]
    const rgbTransferFunction = volume.getProperty().getRGBTransferFunction(0)

    const low = voi.windowCenter - voi.windowWidth / 2
    const high = voi.windowCenter + voi.windowWidth / 2

    rgbTransferFunction.setMappingRange(low, high)

    const apis = this.apis
    apis.forEach((api) => {
      const renderWindow = api.genericRenderWindow.getRenderWindow()

      const { windowWidth, windowCenter } = voi
      api.updateVOI(windowWidth, windowCenter)

      renderWindow.render()
    })

    this.setState({ voi: voi })
  }

  resetAllView() {
    const apis = this.apis

    apis.forEach((api) => {
      api.resetAllView()
    })
  }

  setupSyncedBrush(imageDataObject) {
    // Create buffer the size of the 3D volume
    const dimensions = imageDataObject.dimensions
    const width = dimensions[0]
    const height = dimensions[1]
    const depth = dimensions[2]
    const numVolumePixels = width * height * depth

    // If you want to load a segmentation labelmap, you would want to load
    // it into this array at this point.
    const threeDimensionalPixelData = new Float32Array(numVolumePixels)

    const buffer = threeDimensionalPixelData.buffer
    const imageIds = imageDataObject.imageIds
    const numberOfFrames = imageIds.length

    if (numberOfFrames !== depth) {
      throw new Error('Depth should match the number of imageIds')
    }

    // Create VTK Image Data with buffer as input
    const labelMap = vtkImageData.newInstance()

    // right now only support 256 labels
    const dataArray = vtkDataArray.newInstance({
      numberOfComponents: 1, // labelmap with single component
      values: threeDimensionalPixelData,
    })

    labelMap.getPointData().setScalars(dataArray)
    labelMap.setDimensions(...dimensions)
    labelMap.setSpacing(...imageDataObject.vtkImageData.getSpacing())
    labelMap.setOrigin(...imageDataObject.vtkImageData.getOrigin())
    labelMap.setDirection(...imageDataObject.vtkImageData.getDirection())

    return labelMap
  }

  createActorMapper(imageData) {
    const mapper = vtkVolumeMapper.newInstance()
    mapper.setInputData(imageData)

    const actor = vtkVolume.newInstance()
    actor.setMapper(mapper)

    const rgbTransferFunction = actor.getProperty().getRGBTransferFunction(0)

    const voi = this.state.voi

    const low = voi.windowCenter - voi.windowWidth / 2
    const high = voi.windowCenter + voi.windowWidth / 2

    rgbTransferFunction.setMappingRange(low, high)

    return {
      actor,
      mapper,
    }
  }

  updatePointActor(origin) {
    if (typeof origin === 'undefined') {
      origin = this.state.origin
    }

    const picked = this.transformOriginTo3DPicked(origin)
    // const picked = []
    // const {originXBorder, originYBorder, originZBorder} = this.state
    // const {xMax, yMax, zMax, xMin, yMin, zMin} = this.state.segRange
    // picked[0] = xMax - (origin[0] * (xMax - xMin ) / originXBorder)
    // picked[1] = yMin + (origin[1] * (yMax - yMin) / originYBorder)
    // picked[2] = zMax - (origin[2] * (zMax - zMin) / originZBorder)

    const sphereSource = vtkSphereSource.newInstance()
    sphereSource.setRadius(5)
    sphereSource.setCenter(picked)
    const mapper = vtkMapper.newInstance({
      scalarVisibility: false,
    })
    mapper.setInputData(sphereSource.getOutputData())
    const actor = vtkActor.newInstance()
    actor.setMapper(mapper)
    actor.getProperty().setColor(1, 0, 0)
    actor.getProperty().setDiffuse(0.75)
    actor.getProperty().setAmbient(0.2)
    actor.getProperty().setSpecular(0)
    actor.getProperty().setSpecularPower(1)

    this.setState({
      pointActors: [actor],
    })
  }
  clearPointActor() {
    this.setState({
      pointActors: [],
    })
  }
  DownloadSegment(idx) {
    const progressCallback = (progressEvent) => {
      const percent = Math.floor((100 * progressEvent.loaded) / progressEvent.total)
      const tmp_percent = this.state.percent
      tmp_percent[idx] = percent
      this.setState({ percent: tmp_percent })
    }
    const opacity = 1.0
    const color = this.state.urls[idx].color
    const cl = this.state.urls[idx].class
    const cur_url = this.state.urls[idx].url + '?caseId=' + this.state.caseId
    HttpDataAccessHelper.fetchBinary(cur_url, { progressCallback }).then((binary) => {
      const actor = this.createPipeline(binary, color, opacity, cl)
      const tmp_segments = [].concat(this.state.segments)
      tmp_segments[idx] = actor
      const listLoading = this.state.listLoading
      this.timer = setTimeout(() => {
        listLoading[idx] = false
      }, 2500)
      this.setState({
        segments: tmp_segments,
      })
    })
  }
  changeMode(mode) {
    if (mode === 2 && this.state.mode === 3) {
    }
    if (mode === 3 && this.state.mode === 2) {
    }
    this.setState(
      {
        mode: mode,
      },
      () => {
        this.resize()
      }
    )
  }
  changeSelectedNum(selectedNum) {
    this.setState({
      selectedNum: selectedNum,
    })
  }
  resize(viewerWidth, viewerHeight) {
    if (typeof viewerWidth == 'undefined') {
      viewerWidth = this.state.viewerWidth
    }
    if (typeof viewerHeight == 'undefined') {
      viewerHeight = this.state.viewerHeight
    }
    const mode = this.state.mode
    this.setState({
      viewerWidth,
      viewerHeight,
    })
    if (mode === 1) {
      this.viewer3D.setContainerSize(viewerWidth, viewerHeight)
    } else if (mode === 2) {
      const MPRStyles = this.getMPRStyles()
      if (MPRStyles.threeD) {
        this.viewer3D.setContainerSize(MPRStyles.threeD.width, MPRStyles.threeD.height)
      }
    } else if (mode === 3) {
      const CPRStyles = this.getCPRStyles()
      if (CPRStyles.threeD) {
        this.viewer3D.setContainerSize(CPRStyles.threeD.width, CPRStyles.threeD.height)
      }
      // if (channelStyles.fragment) {
      //     this.viewerFragment.setContainerSize(
      //         channelStyles.fragment.width,
      //         channelStyles.fragment.height
      //     );
      // }
      if (CPRStyles.airway) {
        this.viewerAirway.setContainerSize(CPRStyles.airway.width, CPRStyles.airway.height)
      }
    }
  }
  getMPRStyles(selectedNum, viewerWidth, viewerHeight) {
    if (typeof selectedNum == 'undefined') {
      selectedNum = this.state.selectedNum
    }
    if (typeof viewerWidth == 'undefined') {
      viewerWidth = this.state.viewerWidth
    }
    if (typeof viewerHeight == 'undefined') {
      viewerHeight = this.state.viewerHeight
    }
    //console.log("getSelection", selectedNum, viewerWidth, viewerHeight)
    // MPR
    const styleOfSelectionTwo = {
      topLeft: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: viewerWidth / 2,
        height: viewerHeight / 2,
      },
      topRight: {
        position: 'absolute',
        top: 0,
        left: viewerWidth / 2,
        width: viewerWidth / 2,
        height: viewerHeight / 2,
      },
      bottomLeft: {
        position: 'absolute',
        top: viewerHeight / 2,
        left: 0,
        width: viewerWidth / 2,
        height: viewerHeight / 2,
      },
      bottomRight: {
        position: 'absolute',
        top: viewerHeight / 2,
        left: viewerWidth / 2,
        width: viewerWidth / 2,
        height: viewerHeight / 2,
      },
    }
    // MPR selected
    const styleOfSelectionThree = {
      left: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 0.67 * viewerWidth,
        height: viewerHeight,
      },
      topRight: {
        position: 'absolute',
        top: 0,
        left: 0.67 * viewerWidth,
        width: 0.33 * viewerWidth,
        height: 0.33 * viewerHeight,
      },
      middleRight: {
        position: 'absolute',
        top: 0.33 * viewerHeight,
        left: 0.67 * viewerWidth,
        width: 0.33 * viewerWidth,
        height: 0.33 * viewerHeight,
      },
      bottomRight: {
        position: 'absolute',
        top: 0.66 * viewerHeight,
        left: 0.67 * viewerWidth,
        width: 0.33 * viewerWidth,
        height: 0.34 * viewerHeight,
      },
    }
    const MPRStyles = {
      threeD: {},
      axial: {},
      coronal: {},
      sagittal: {},
    }
    if (selectedNum === 0) {
      MPRStyles.threeD = styleOfSelectionTwo.topRight
      MPRStyles.axial = styleOfSelectionTwo.topLeft
      MPRStyles.coronal = styleOfSelectionTwo.bottomLeft
      MPRStyles.sagittal = styleOfSelectionTwo.bottomRight
    } else if (selectedNum === 1) {
      MPRStyles.threeD = styleOfSelectionThree.left
      MPRStyles.axial = styleOfSelectionThree.topRight
      MPRStyles.coronal = styleOfSelectionThree.middleRight
      MPRStyles.sagittal = styleOfSelectionThree.bottomRight
    } else if (selectedNum === 2) {
      MPRStyles.threeD = styleOfSelectionThree.topRight
      MPRStyles.axial = styleOfSelectionThree.left
      MPRStyles.coronal = styleOfSelectionThree.middleRight
      MPRStyles.sagittal = styleOfSelectionThree.bottomRight
    } else if (selectedNum === 3) {
      MPRStyles.threeD = styleOfSelectionThree.topRight
      MPRStyles.axial = styleOfSelectionThree.middleRight
      MPRStyles.coronal = styleOfSelectionThree.left
      MPRStyles.sagittal = styleOfSelectionThree.bottomRight
    } else if (selectedNum === 4) {
      MPRStyles.threeD = styleOfSelectionThree.topRight
      MPRStyles.axial = styleOfSelectionThree.middleRight
      MPRStyles.coronal = styleOfSelectionThree.bottomRight
      MPRStyles.sagittal = styleOfSelectionThree.left
    }
    return MPRStyles
  }
  getCPRStyles(viewerWidth, viewerHeight) {
    if (typeof viewerWidth == 'undefined') {
      viewerWidth = this.state.viewerWidth
    }
    if (typeof viewerHeight == 'undefined') {
      viewerHeight = this.state.viewerHeight
    }

    // airway
    const styleOfSelectionFour = {
      topLeft: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: viewerWidth * 0.5,
        height: viewerHeight * 0.4,
      },
      topRight: {
        position: 'absolute',
        top: 0,
        left: viewerWidth * 0.5,
        width: viewerWidth * 0.5,
        height: viewerHeight * 0.4,
      },
      bottomLeft: {
        position: 'absolute',
        top: viewerHeight * 0.4,
        left: 0,
        width: viewerWidth * 0.5,
        height: viewerHeight * 0.4,
      },
      bottomRight: {
        position: 'absolute',
        top: viewerHeight * 0.4,
        left: viewerWidth * 0.5,
        width: viewerWidth * 0.5,
        height: viewerHeight * 0.4,
      },
      middle: {
        position: 'absolute',
        top: viewerHeight * 0.8,
        left: 0,
        width: viewerWidth,
        height: viewerHeight * 0.1,
      },
      bottom: {
        position: 'absolute',
        top: viewerHeight * 0.8,
        left: 0,
        width: viewerWidth,
        height: viewerHeight * 0.2,
      },
    }

    const channelStyles = {
      threeD: styleOfSelectionFour.topRight,
      axial: styleOfSelectionFour.topLeft,
      coronal: styleOfSelectionFour.bottomLeft,
      sagittal: styleOfSelectionFour.bottomRight,
      // fragment: styleOfSelectionFour.middle,
      airway: styleOfSelectionFour.bottom,
    }

    return channelStyles
  }
  setSegmentOpacity(idx, opacity) {
    let tmp_segments = [].concat(this.state.segments)
    if (tmp_segments[idx]) {
      tmp_segments[idx].getProperty().setOpacity(opacity)
    }
    this.setState({ segments: tmp_segments })
  }
  getLoadingStyle() {
    const mode = this.state.mode
    const loadingStyle = { position: 'absolute', top: 0, left: 0 }
    if (mode === 2) {
      const MPRStyles = this.getMPRStyles()
      if (MPRStyles.threeD) {
        loadingStyle.top = MPRStyles.threeD.top
        loadingStyle.left = MPRStyles.threeD.left
      }
    } else if (mode === 3) {
      const CPRStyles = this.getCPRStyles()
      if (CPRStyles.threeD) {
        loadingStyle.top = CPRStyles.threeD.top
        loadingStyle.left = CPRStyles.threeD.left
      }
    }
    return loadingStyle
  }
  toggleCrosshairs(displayCrosshairs) {
    const apis = this.apis

    apis.forEach((api) => {
      const { svgWidgetManager, svgWidgets } = api
      svgWidgets.rotatableCrosshairsWidget.setDisplay(displayCrosshairs)

      svgWidgetManager.render()
    })

    this.setState({ displayCrosshairs })
  }
  toggleTool(crosshairsTool) {
    const apis = this.apis

    apis.forEach((api, apiIndex) => {
      let istyle

      if (crosshairsTool) {
        istyle = vtkInteractorStyleRotatableMPRCrosshairs.newInstance()
      } else {
        istyle = vtkInteractorStyleMPRWindowLevel.newInstance()
      }
      // // add istyle
      api.setInteractorStyle({
        istyle,
        configuration: { apis, apiIndex },
      })
    })
    // if(crosshairsTool){
    //   apis[0].svgWidgets.rotatableCrosshairsWidget.resetCrosshairs(apis, 0);
    // }

    this.setState({ crosshairsTool })
  }
  beginPaint() {
    this.setState({
      painting: true,
    })
  }
  doPaint() {
    this.setState({
      erasing: false,
    })
    const apis = this.apis

    apis.forEach((api, index) => {
      const paintFilter = api.filters[0]
      paintFilter.setLabel(1)
    })
  }
  doErase() {
    this.setState({
      erasing: true,
    })
    const apis = this.apis

    apis.forEach((api, index) => {
      const paintFilter = api.filters[0]
      paintFilter.setLabel(0)
    })
  }
  endPaint() {
    this.setState({
      painting: false,
    })
  }
  changePaintRadius(radius) {
    const apis = this.apis

    apis.forEach((api, index) => {
      const paintWidget = api.widgets[0]
      const paintFilter = api.filters[0]
      paintWidget.setRadius(radius)
      paintFilter.setRadius(radius)
    })
  }
  changeLableThreshold(threshold) {
    this.setState(
      {
        labelThreshold: threshold,
      },
      () => {
        this.updateLabelDataByThreshold()
      }
    )
  }
  updateLabelDataByThreshold() {
    const dimensions = this.state.dimensions
    const threshold = this.state.labelThreshold
    const labelData = this.state.labelData

    const { minX, maxX, minY, maxY, minZ, maxZ } = labelData.range

    const indices = labelData.range
    indices.splice(0, indices.length)
    const scalarsDataOfImageData = this.state.vtkImageData.getPointData().getScalars().getData()

    for (let z = minZ; z < maxZ; z++) {
      for (let y = minY; y < maxY; y++) {
        for (let x = minX; x < maxX; x++) {
          const index = x + y * dimensions[0] + (z - 1) * dimensions[0] * dimensions[1]
          if (scalarsDataOfImageData[index] > threshold - 1024) {
            indices.push(index)
          }
        }
      }
    }

    const labelMapInputData = this.state.labelMapInputData
    const scalarsData = labelMapInputData.getPointData().getScalars().getData()

    indices.forEach((item) => {
      scalarsData[item] = 1
    })

    labelMapInputData.modified()
  }
  changeLabelColor(color) {
    this.setState(
      {
        labelColor: color,
      },
      () => {
        this.updateLabelDataByColor()
      }
    )
  }
  updateLabelDataByColor() {
    const labelColor = this.state.labelColor
    const apis = this.apis

    apis.forEach((api, apiIndex) => {
      api.setSegmentRGB(1, labelColor)
    })
  }
  storeApi = (viewportIndex) => {
    return (api) => {
      this.apis[viewportIndex] = api

      const apis = this.apis

      const renderWindow = api.genericRenderWindow.getRenderWindow()

      // Add rotatable svg widget
      api.addSVGWidget(vtkSVGRotatableCrosshairsWidget.newInstance(), 'rotatableCrosshairsWidget')

      const istyle = vtkInteractorStyleRotatableMPRCrosshairs.newInstance()
      // const istyle = vtkInteractorStyleMPRWindowLevel.newInstance()

      // add istyle
      api.setInteractorStyle({
        istyle,
        configuration: {
          apis,
          apiIndex: viewportIndex,
        },
      })

      api.setSlabThickness(0.1)

      renderWindow.render()

      // Its up to the layout manager of an app to know how many viewports are being created.
      if (apis[0] && apis[1] && apis[2]) {
        apis.forEach((api, index) => {
          api.svgWidgets.rotatableCrosshairsWidget.setApiIndex(index)
          api.svgWidgets.rotatableCrosshairsWidget.setApis(apis)
        })

        const api = apis[0]

        api.svgWidgets.rotatableCrosshairsWidget.resetCrosshairs(apis, 0)

        this.toggleCrosshairs(false)
      }

      const paintWidget = api.widgets[0]
      const paintFilter = api.filters[0]

      paintWidget.setRadius(this.state.paintRadius)
      paintFilter.setRadius(this.state.paintRadius)
    }
  }
  deleteApi = (viewportIndex) => {
    return () => {
      this.apis[viewportIndex] = null
    }
  }
  createNoduleMask(idx) {
    const labelDataArray = this.state.labelDataArray
    let labelData = labelDataArray[idx]

    if (!labelData) {
      const segment = this.state.segments[idx]
      const bounds = segment.getBounds()
      console.log('nowtime bounds', bounds)
      const firstPicked = [bounds[0], bounds[2], bounds[4]]
      const lastPicked = [bounds[1], bounds[3], bounds[5]]

      const firstOriginIndex = this.transform3DPickedToOriginIndex(firstPicked)
      const lastOriginIndex = this.transform3DPickedToOriginIndex(lastPicked)
      labelData = this.createLabelData(firstOriginIndex, lastOriginIndex)

      // const firstOrigin = this.transform3DPickedToOrigin(firstPicked);
      // const lastOrigin = this.transform3DPickedToOrigin(lastPicked);
      const origin = [Math.round((firstPicked[0] + lastPicked[0]) / 2), Math.round((firstPicked[1] + lastPicked[1]) / 2), Math.round((firstPicked[2] + lastPicked[2]) / 2)]
      console.log('nowtime origin', origin)
      labelData.origin = origin
      labelDataArray[idx] = labelData
    }

    const indices = labelData.indices
    const labelMapInputData = this.state.labelMapInputData
    const scalarsData = labelMapInputData.getPointData().getScalars().getData()

    indices.forEach((item) => {
      scalarsData[item] = 1
    })

    labelMapInputData.modified()

    const apis = this.apis
    const worldPos = labelData.origin
    apis[0].svgWidgets.rotatableCrosshairsWidget.moveCrosshairs(worldPos, apis, 0)
    const renderWindow = apis[0].genericRenderWindow.getRenderWindow()
    const istyle = renderWindow.getInteractor().getInteractorStyle()
    istyle.modified()
  }
  createLabelData(firstOriginIndex, lastOriginIndex) {
    const dimensions = this.state.dimensions
    const scalars = this.state.vtkImageData.getPointData().getScalars()
    const scalarsData = scalars.getData()

    const threshold = this.state.labelThreshold

    const minX = Math.round(Math.min(firstOriginIndex[0], lastOriginIndex[0])) - 5
    const maxX = Math.round(Math.max(firstOriginIndex[0], lastOriginIndex[0])) + 5
    const minY = Math.round(Math.min(firstOriginIndex[1], lastOriginIndex[1])) - 5
    const maxY = Math.round(Math.max(firstOriginIndex[1], lastOriginIndex[1])) + 5
    const minZ = Math.round(Math.min(firstOriginIndex[2], lastOriginIndex[2])) - 5
    const maxZ = Math.round(Math.max(firstOriginIndex[2], lastOriginIndex[2])) + 5

    const range = { minX, maxX, minY, maxY, minZ, maxZ }
    // console.log("label range", range)
    const indices = []

    for (let z = minZ; z < maxZ; z++) {
      for (let y = minY; y < maxY; y++) {
        for (let x = minX; x < maxX; x++) {
          const index = x + y * dimensions[0] + (z - 1) * dimensions[0] * dimensions[1]
          if (scalarsData[index] > threshold - 1024) {
            indices.push(index)
          }
        }
      }
    }

    const labelData = {
      indices,
      range,
    }
    return labelData
  }
  onPaintEnd(strokeBuffer, viewerType) {
    const dimensions = this.state.dimensions
    const rows = dimensions[0]
    const columns = dimensions[1]
    const numberOfFrames = dimensions[2]

    for (let i = 0; i < numberOfFrames; i++) {
      const frameLength = rows * columns
      const byteOffset = frameLength * i
      const strokeArray = new Uint8Array(strokeBuffer, byteOffset, frameLength)

      const strokeOnFrame = strokeArray.some((element) => element === 1)
      if (!strokeOnFrame) {
        continue
      }
      // console.log("strokeOnFrame", " i", i);
    }
  }
  onChangeSlice(slice, viewerType) {
    const origin = this.state.origin
    const segRange = this.state.segRange
    switch (viewerType) {
      case 0:
        origin[2] = slice + segRange.zMin
        break
      case 1:
        origin[1] = slice + segRange.yMin
        break
      case 2:
        origin[0] = slice + segRange.xMin
        break
      default:
        break
    }
    const apis = this.apis
    apis[0].svgWidgets.rotatableCrosshairsWidget.moveCrosshairs(origin, apis, 0)
    const renderWindow = apis[0].genericRenderWindow.getRenderWindow()
    const istyle = renderWindow.getInteractor().getInteractorStyle()
    istyle.modified()
  }
  createChannelFragmentVolumes() {
    const fragmentVolumes = []
    const zs = [-284, -280, -278, -274, -270, -266]
    zs.forEach((item, idx) => {
      const imageReslice = vtkImageReslice.newInstance()
      // console.log(imageReslice);
      imageReslice.setInputData(this.state.vtkImageData)
      imageReslice.setOutputDimensionality(2)
      const axialAxes = mat4.create()
      axialAxes[14] = item
      imageReslice.setResliceAxes(axialAxes)
      imageReslice.setOutputScalarType('Float32Array')
      const obliqueSlice = imageReslice.getOutputData()

      const dimensions = obliqueSlice.getDimensions()
      const spacing = obliqueSlice.getSpacing()
      const origin = obliqueSlice.getOrigin()
      if (idx < 3) {
        spacing[0] = spacing[0] * 1.3
        spacing[1] = spacing[1] * 1.3
        // origin[0] = origin[0] + 361 * idx
        origin[0] = origin[0] - 361 * 1.3 * idx
      } else {
        origin[0] = origin[0] - 361 * 1.3 * 2 - 361 * (idx - 2)
      }
      // origin[0] = origin[0] - 361 * idx
      const scalarsData = obliqueSlice.getPointData().getScalars().getData()
      const newImageData = vtkImageData.newInstance(obliqueSlice.get('direction'))
      // console.log("image data info", this.state.vtkImageData.get("spacing", "origin", "direction"))
      // console.log("slice data info", obliqueSlice.get("spacing", "origin", "direction"))
      const newPixelArray = new Float32Array(dimensions[0] * dimensions[1] * 5).fill(-1024)
      for (let i = 0; i < scalarsData.length; i++) {
        newPixelArray[i] = scalarsData[i]
      }
      const newScalarArray = vtkDataArray.newInstance({
        name: 'Pixels',
        values: newPixelArray,
      })
      newImageData.setDimensions(dimensions[0], dimensions[1], 5)
      newImageData.setSpacing(spacing)
      newImageData.setOrigin(origin)
      // newImageData.computeTransforms();
      newImageData.getPointData().setScalars(newScalarArray)

      const actor = vtkVolume.newInstance()
      const mapper = vtkVolumeMapper.newInstance()
      mapper.setInputData(newImageData)
      actor.setMapper(mapper)

      const rgbTransferFunction = actor.getProperty().getRGBTransferFunction(0)

      const voi = this.state.voi

      const low = voi.windowCenter - voi.windowWidth / 2
      const high = voi.windowCenter + voi.windowWidth / 2

      rgbTransferFunction.setMappingRange(low, high)

      fragmentVolumes.push(actor)
    })
    this.setState({
      fragmentVolumes,
    })
  }
  pickAirway() {
    this.setState(
      {
        airwayPicking: true,
      },
      () => {
        this.viewer3D.startPicking()
      }
    )
  }
  finishPicking() {
    this.setState(
      {
        airwayPicking: false,
      },
      () => {
        this.viewer3D.endPicking()
      }
    )
  }
  selectAirwayRange(range) {
    console.log('airway range', range)
    const points = []
    centerLine.points.forEach((item, index) => {
      const x = item[0]
      const y = item[1]
      const z = item[2]
      if (x <= range.xMax && x >= range.xMin && y <= range.yMax && y >= range.yMin && z <= range.zMax && z >= range.zMin) {
        points.push(item)
      }
    })
    console.log('points', points)
    this.setState(
      {
        points,
      },
      () => {
        this.viewer3D.endPicking()
        this.createAirwayVolumes()
      }
    )
  }
  selectAirwayRangeByWidget(pickedPoints) {
    console.log('airway picked points', pickedPoints)
    const points = []
    for (let i = 0; i < pickedPoints.length; i++) {
      if (i === 0) {
        continue
      }
      const lastPickedPoint = pickedPoints[i - 1]
      const pickedPoint = pickedPoints[i]
      centerLine.points.forEach((item) => {
        const x = item[0]
        const y = item[1]
        const z = item[2]
        if (this.isBetween(x, lastPickedPoint[0], pickedPoint[0]) && this.isBetween(y, lastPickedPoint[1], pickedPoint[1]) && this.isBetween(z, lastPickedPoint[2], pickedPoint[2])) {
          points.push(item)
        }
      })
    }
    console.log('points', points)
    this.setState(
      {
        points,
      },
      () => {
        // this.viewer3D.endPicking()
        this.createAirwayVolumes()
      }
    )
  }
  isBetween(v, r1, r2) {
    if (r1 > r2) {
      if (v >= r2 && v <= r1) {
        return true
      }
    } else {
      if (v <= r2 && v >= r1) {
        return true
      }
    }
    return false
  }

  createAirwayVolumes() {
    const points = this.state.points
    const outputExtent = [512, 512]
    const outputSpacing = [0.7, 0.7]
    const number = points.length
    const { tangents, normals } = frenet(points)

    const fullAirwayImageData = vtkImageData.newInstance()
    const fullAirwayPixelArray = new Float32Array(outputExtent[0] * outputExtent[1] * number).fill(-1024)
    const imageReslice = vtkImageReslice.newInstance()
    // console.log(imageReslice);
    imageReslice.setInputData(this.state.vtkImageData)
    imageReslice.setOutputScalarType('Float32Array')
    // imageReslice.setOutputDimensionality(3);
    imageReslice.setOutputDimensionality(2)
    for (let i = 0; i < number; i++) {
      const center = points[i]
      const tangent = tangents[i]
      const normal = normals[i]
      const cross = vec3.create()
      vec3.cross(cross, tangent, normal)
      //console.log("frenet: ", center, tangent, normal, cross)
      const origin = vec4.create()
      const axes = mat4.create()
      for (let j = 0; j < 3; j++) {
        axes[j] = cross[j]
        axes[4 + j] = normal[j]
        axes[8 + j] = tangent[j]
        origin[j] = center[j] - (normal[j] * outputExtent[1] * outputSpacing[1]) / 2.0 - (cross[j] * outputExtent[0] * outputSpacing[0]) / 2.0
      }
      origin[3] = 1.0
      // console.log("origin", origin)
      axes[12] = origin[0]
      axes[13] = origin[1]
      axes[14] = origin[2]
      // console.log("axes", axes)
      imageReslice.setResliceAxes(axes)
      imageReslice.setOutputOrigin([0, 0, 0])
      imageReslice.setOutputExtent([0, outputExtent[0] - 1, 0, outputExtent[1] - 1, 0, 1])
      imageReslice.setOutputSpacing([outputSpacing[0], outputSpacing[1], 1])
      const obliqueSlice = imageReslice.getOutputData()
      // const dimensions = obliqueSlice.getDimensions();
      // console.log("dimensions", dimensions);
      const scalarData = obliqueSlice.getPointData().getScalars().getData()
      for (let j = 0; j < scalarData.length; j++) {
        fullAirwayPixelArray[j + i * scalarData.length] = scalarData[j]
      }
      // const newImageData = vtkImageData.newInstance();
      // const newPixelArray = new Float32Array(outputExtent[0] * outputExtent[1] * 5).fill(-1024);
      // const newScalarArray = vtkDataArray.newInstance({
      //     name: 'Pixels',
      //     values: newPixelArray
      // });
      // const scalarData = obliqueSlice.getPointData().getScalars().getData()
      // for (let j = 0; j < scalarData.length; j++) {
      //     newPixelArray[j] = scalarData[j]
      // }
      // newImageData.setDimensions(outputExtent[0], outputExtent[1], 5)
      // newImageData.setSpacing([outputSpacing[0], outputSpacing[1], 1])
      // const obliqueSliceOrigin = obliqueSlice.getOrigin();
      // newImageData.setOrigin([obliqueSliceOrigin[0] + 512 * i, obliqueSliceOrigin[1], obliqueSliceOrigin[2]])
      // newImageData.getPointData().setScalars(newScalarArray)
      // const actor = vtkVolume.newInstance();
      // const mapper = vtkVolumeMapper.newInstance();
      // mapper.setInputData(newImageData);
      // actor.setMapper(mapper);

      // const rgbTransferFunction = actor
      //     .getProperty()
      //     .getRGBTransferFunction(0);

      // const voi = this.state.voi;

      // const low = voi.windowCenter - voi.windowWidth / 2;
      // const high = voi.windowCenter + voi.windowWidth / 2;

      // rgbTransferFunction.setMappingRange(low, high);
      // unityVolumes.push(actor)
    }
    const fullAirwayScalarArray = vtkDataArray.newInstance({
      name: 'Pixels',
      values: fullAirwayPixelArray,
    })
    fullAirwayImageData.setDimensions(outputExtent[0], outputExtent[1], number)
    fullAirwayImageData.setSpacing([outputSpacing[0], outputSpacing[1], 5])
    fullAirwayImageData.getPointData().setScalars(fullAirwayScalarArray)

    const fullAirwayActor = vtkVolume.newInstance()
    const fullAirwayMapper = vtkVolumeMapper.newInstance()
    fullAirwayMapper.setInputData(fullAirwayImageData)
    fullAirwayActor.setMapper(fullAirwayMapper)

    const voi = this.state.voi

    const low = voi.windowCenter - voi.windowWidth / 2
    const high = voi.windowCenter + voi.windowWidth / 2

    const fullAirwayRgbTransferFunction = fullAirwayActor.getProperty().getRGBTransferFunction(0)

    fullAirwayRgbTransferFunction.setMappingRange(low, high)

    const centerAirwayImageReslice = vtkImageReslice.newInstance()
    centerAirwayImageReslice.setInputData(fullAirwayImageData)
    const fullAirwayDimensions = fullAirwayImageData.getDimensions()
    centerAirwayImageReslice.setOutputScalarType('Float32Array')
    centerAirwayImageReslice.setOutputDimensionality(2)
    const centerAirwayAxes = mat4.create()
    mat4.rotateX(centerAirwayAxes, centerAirwayAxes, Math.PI / 2)
    // centerAirwayAxes[12] = fullAirwayDimensions[0] * outputSpacing[0] / 2
    centerAirwayAxes[13] = (fullAirwayDimensions[1] * outputSpacing[1]) / 2
    // centerAirwayAxes[14] = fullAirwayDimensions[2] / 2
    centerAirwayImageReslice.setResliceAxes(centerAirwayAxes)
    centerAirwayImageReslice.setOutputOrigin([0, 0, 0])
    centerAirwayImageReslice.setOutputExtent([0, fullAirwayDimensions[0], 0, fullAirwayDimensions[2], 0, 1])
    const centerAirwayObliqueSlice = centerAirwayImageReslice.getOutputData()
    const centerAirwaySpacing = centerAirwayObliqueSlice.getSpacing()
    // console.log("newSpacing", newSpacing)
    centerAirwaySpacing[1] *= 4
    centerAirwayObliqueSlice.setSpacing(centerAirwaySpacing)
    const centerAirwayActor = this.obliqueSlice2Actor(centerAirwayObliqueSlice)
    // const originXYZW = this.multiplyPoint(axes, origin)
    // mat4.transpose(axes, axes)
    // const newOriginXYZW = this.multiplyPoint(axes, origin)
    // console.log("newOriginXYZW", newOriginXYZW)

    // axes[12] = newOriginXYZW[0]
    // axes[13] = newOriginXYZW[1]
    // axes[14] = newOriginXYZW[2]

    // imageReslice.setOutputOrigin([-182, -330, -280]); //with spacing
    // imageReslice.setOutputExtent([-182, 329, -330, 181, -280, -279]); //without spacing

    // imageReslice.setOutputOrigin([-178, -30, -280]);
    // imageReslice.setOutputExtent([-329, 182, -181, 330, -280, -270]);

    // this.generateLines()

    this.setState(
      {
        airwayVolumes: [],
      },
      () => {
        this.setState({
          airwayVolumes: [fullAirwayActor],
          airwayCenterVolumes: [centerAirwayActor],
        })
      }
    )
  }
  generateLines() {
    const p1 = [180, 0, 0]
    const p2 = [180, 512, 0]

    const lineSource = vtkLineSource.newInstance({ resolution: 10 })
    lineSource.setPoint1(p1)
    lineSource.setPoint2(p2)

    const mapper = vtkMapper.newInstance({
      scalarVisibility: false,
    })
    const actor = vtkActor.newInstance()
    console.log('lineSource', lineSource)
    mapper.setInputData(lineSource.getOutputData())
    actor.setMapper(mapper)
    actor.getProperty().setColor(1, 0, 0)
    this.setState({
      lineActors: [actor],
    })
  }
  obliqueSlice2Actor(obliqueSlice) {
    const dimensions = obliqueSlice.getDimensions()
    const spacing = obliqueSlice.getSpacing()
    console.log('oblique spacing', spacing)
    const imageData = vtkImageData.newInstance()
    const pixelArray = new Float32Array(dimensions[0] * dimensions[1] * 5).fill(-1024)
    const scalarData = obliqueSlice.getPointData().getScalars().getData()
    for (let i = 0; i < scalarData.length; i++) {
      pixelArray[i] = scalarData[i]
    }
    const scalarArray = vtkDataArray.newInstance({
      name: 'Pixels',
      values: pixelArray,
    })
    imageData.setDimensions(dimensions[0], dimensions[1], 5)
    imageData.setSpacing(spacing)
    imageData.getPointData().setScalars(scalarArray)
    const actor = vtkVolume.newInstance()
    const mapper = vtkVolumeMapper.newInstance()
    mapper.setInputData(imageData)
    actor.setMapper(mapper)

    const voi = this.state.voi

    const low = voi.windowCenter - voi.windowWidth / 2
    const high = voi.windowCenter + voi.windowWidth / 2

    const fullAirwayRgbTransferFunction = actor.getProperty().getRGBTransferFunction(0)

    fullAirwayRgbTransferFunction.setMappingRange(low, high)
    return actor
  }
  multiplyPoint(matrix, vector) {
    const result = vec4.create()
    result[0] = matrix[0] * vector[0] + matrix[4] * vector[1] + matrix[8] * vector[2] + matrix[12]
    result[1] = matrix[1] * vector[0] + matrix[5] * vector[1] + matrix[9] * vector[2] + matrix[13]
    result[2] = matrix[2] * vector[0] + matrix[6] * vector[1] + matrix[10] * vector[2] + matrix[14]
    const num = 1 / (matrix[3] * vector[0] + matrix[7] * vector[1] + matrix[11] * vector[2] + matrix[15]) // this is 1/1=1 when m30, m31, m32 = 0 and m33 = 1
    result[0] *= num // so then multiplying by 1 is pointless..
    result[1] *= num
    result[2] *= num
    result[3] = 1.0
    return result
  }
  render() {
    const {
      urls,
      pointActors,
      percent,
      listLoading,
      segments,
      viewerWidth,
      viewerHeight,
      vtkImageData,
      volumes,
      volumesLoading,
      originXBorder,
      originYBorder,
      originZBorder,
      labelMapInputData,
      painting,
      mode,
      segRange,
      fragmentVolumes,
      airwayPicking,
      airwayVolumes,
      airwayCenterVolumes,
      lineActors,
    } = this.state
    const { isOver, canDrop, connectDropTarget } = this.props
    const style = { width: viewerWidth, height: viewerHeight }
    let loadingList = []
    const loadingStyle = this.getLoadingStyle()
    if (urls && urls.length) {
      let loadingNum = 0
      loadingList = urls.map((inside, idx) => {
        let loading
        if (loadingNum > 5) {
          return null
        }
        if (inside.url.length <= 0) {
          return null
        }
        if (percent[idx] === 100) {
          loading = false
        } else {
          loading = true
        }
        loadingNum = loadingNum + 1
        let segmentName = inside.name
        return (
          <div key={idx} className="loading-list-item" hidden={!listLoading[idx]}>
            <div className="loading-container">
              <Loader active inline className="loading-loader" size="medium" style={loading ? { visibility: 'visible' } : { visibility: 'hidden' }} />
              <div className="loading-ticker" hidden={loading} />
              <div className="loading-ticker-hidden" hidden={loading} />
              {/*<div className="loading-circle" hidden={loading}/>*/}
              {/*<div className="loading-circle-hidden" hidden={loading}/>*/}
            </div>
            <div className="loading-list-item-info">{segmentName}</div>
          </div>
        )
      })
    }
    let segments_list = []

    for (let i = 0; i < segments.length; i++) {
      if (!airwayPicking) {
        segments_list.push(segments[i])
      } else {
        if (i === 5) {
          segments_list.push(segments[i])
        } else {
          segments_list.push(null)
        }
      }
    }
    const loadingPanel = (
      <div className="sk-chase">
        <div className="sk-chase-dot"></div>
        <div className="sk-chase-dot"></div>
        <div className="sk-chase-dot"></div>
        <div className="sk-chase-dot"></div>
        <div className="sk-chase-dot"></div>
        <div className="sk-chase-dot"></div>
      </div>
    )
    const threeDPanel = (
      <>
        <VTK3DViewer
          viewerStyle={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: viewerWidth,
            height: viewerHeight,
          }}
          actors={segments}
          onRef={(ref) => {
            this.viewer3D = ref
          }}
        />
        <div className="loading-list" style={loadingStyle}>
          {loadingList}
        </div>
      </>
    )
    let MPRAxialPanel
    let MPRCoronalPanel
    let MPRSagittalPanel
    if (!volumes || !volumes.length) {
      MPRAxialPanel = loadingPanel
      MPRCoronalPanel = loadingPanel
      MPRSagittalPanel = loadingPanel
    } else {
      MPRAxialPanel = (
        <View2D
          viewerType={0}
          parallelScale={originYBorder / 2}
          volumes={volumes}
          onCreated={this.storeApi(0)}
          onDestroyed={this.deleteApi(0)}
          orientation={{
            sliceNormal: [0, 0, 1],
            viewUp: [0, -1, 0],
          }}
          showRotation={true}
          paintFilterBackgroundImageData={vtkImageData}
          paintFilterLabelMapImageData={labelMapInputData}
          painting={painting}
          onPaintEnd={this.onPaintEnd.bind(this)}
          onChangeSlice={this.onChangeSlice.bind(this)}
          sliderMax={Math.round(segRange.zMax)}
          sliderMin={Math.round(segRange.zMin)}
        />
      )
      MPRCoronalPanel = (
        <View2D
          viewerType={1}
          parallelScale={originZBorder / 2}
          volumes={volumes}
          onCreated={this.storeApi(1)}
          onDestroyed={this.deleteApi(1)}
          orientation={{
            sliceNormal: [0, 1, 0],
            viewUp: [0, 0, 1],
          }}
          showRotation={true}
          paintFilterBackgroundImageData={vtkImageData}
          paintFilterLabelMapImageData={labelMapInputData}
          painting={painting}
          onChangeSlice={this.onChangeSlice.bind(this)}
          sliderMax={Math.round(segRange.yMax)}
          sliderMin={Math.round(segRange.yMin)}
        />
      )
      MPRSagittalPanel = (
        <View2D
          viewerType={2}
          parallelScale={originZBorder / 2}
          volumes={volumes}
          onCreated={this.storeApi(2)}
          onDestroyed={this.deleteApi(2)}
          orientation={{
            sliceNormal: [-1, 0, 0],
            viewUp: [0, 0, 1],
          }}
          showRotation={true}
          paintFilterBackgroundImageData={vtkImageData}
          paintFilterLabelMapImageData={labelMapInputData}
          painting={painting}
          onChangeSlice={this.onChangeSlice.bind(this)}
          sliderMax={Math.round(segRange.xMax)}
          sliderMin={Math.round(segRange.xMin)}
        />
      )
    }
    let panel
    if (mode === 1) {
      panel = threeDPanel
    }
    if (mode === 2) {
      const MPRStyles = this.getMPRStyles()
      const MPRPanel = (
        <>
          <VTK3DViewer
            viewerStyle={MPRStyles.threeD}
            actors={segments}
            onRef={(ref) => {
              this.viewer3D = ref
            }}
          />
          <div className="loading-list" style={loadingStyle}>
            {loadingList}
          </div>
          <div style={MPRStyles.axial} className="mpr-viewer-container">
            {MPRAxialPanel}
          </div>
          <div style={MPRStyles.coronal} className="mpr-viewer-container">
            {MPRCoronalPanel}
          </div>
          <div style={MPRStyles.sagittal} className="mpr-viewer-container">
            {MPRSagittalPanel}
          </div>
        </>
      )
      panel = MPRPanel
    }
    if (mode === 3) {
      const CPRStyles = this.getCPRStyles()
      const CPRPanel = (
        <>
          <VTK3DViewer
            viewerStyle={CPRStyles.threeD}
            actors={segments}
            onSelectAirwayRange={this.selectAirwayRange.bind(this)}
            onSelectAirwayRangeByWidget={this.selectAirwayRangeByWidget.bind(this)}
            onRef={(ref) => {
              this.viewer3D = ref
            }}
          />
          <div className="loading-list" style={loadingStyle}>
            {loadingList}
          </div>
          <div style={CPRStyles.axial} className="cpr-viewer-container">
            {MPRAxialPanel}
          </div>
          <div style={CPRStyles.coronal} className="cpr-viewer-container">
            {MPRCoronalPanel}
          </div>
          <div style={CPRStyles.sagittal} className="cpr-viewer-container">
            {MPRSagittalPanel}
          </div>
          {/* <VTK2DViewer
                        viewerStyle={channelStyles.fragment}
                        volumes={fragmentVolumes}
                        onRef={(ref) => {
                            this.viewerFragment = ref;
                        }}
                    /> */}
          <VTK2DViewer
            viewerStyle={CPRStyles.airway}
            volumes={airwayCenterVolumes}
            lineActors={lineActors}
            onRef={(ref) => {
              this.viewerAirway = ref
            }}
          />
        </>
      )
      panel = CPRPanel
    }

    // console.log('render segments:', segments)
    return connectDropTarget(
      <div className="segment-container" id="segment-container">
        <div style={style}>{panel}</div>
      </div>
    )
  }

  getRatio(model, cor) {
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
  getTopLeftOffset(model) {
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
  transformOriginToPixel(origin) {
    // origin to pixel
    const pixel = []
    const axialPixel = []
    // const ratioX = this.getRatio(0, 0)
    // const ratioY = this.getRatio(0, 1)
    // const {x, y} = this.getTopLeftOffset(0)
    // const nowX = origin[0] / ratioX + x
    // const nowY = origin[1] / ratioY + y
    // const a = this.getTopLeftOffset(0)
    axialPixel[0] = origin[0] / this.getRatio(0, 0) + this.getTopLeftOffset(0).x
    axialPixel[1] = origin[1] / this.getRatio(0, 1) + this.getTopLeftOffset(0).y

    const coronalPixel = []
    // const ratioX = this.getRatio(1, 0)
    // const ratioZ = this.getRatio(1, 2)
    // const {x, y} = this.getTopLeftOffset(1)
    // const nowX = origin[0] / ratioX + x
    // const nowY = origin[2] / ratioZ + y
    coronalPixel[0] = origin[0] / this.getRatio(1, 0) + this.getTopLeftOffset(1).x
    coronalPixel[1] = origin[2] / this.getRatio(1, 1) + this.getTopLeftOffset(1).y

    const sagittalPixel = []
    // const ratioY = this.getRatio(2, 1)
    // const ratioZ = this.getRatio(2, 2)
    // const {x, y} = this.getTopLeftOffset(2)
    // const nowX = origin[1] / ratioY + x
    // const nowY = origin[2] / ratioZ + y
    sagittalPixel[0] = origin[1] / this.getRatio(2, 0) + this.getTopLeftOffset(2).x
    sagittalPixel[1] = origin[2] / this.getRatio(2, 1) + this.getTopLeftOffset(2).y
    pixel[0] = axialPixel
    pixel[1] = coronalPixel
    pixel[2] = sagittalPixel
    return pixel
  }
  transformPixelToOrigin(pixel, model) {
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
  transform3DPickedToOrigin(picked) {
    // 3D picked to origin
    const origin = []
    const { originXBorder, originYBorder, originZBorder } = this.state
    const { xMax, yMax, zMax, xMin, yMin, zMin } = this.state.segRange

    const x = picked[0]
    const y = picked[1]
    const z = picked[2]
    origin[0] = (originXBorder * (x - xMin)) / (xMax - xMin)
    origin[1] = (originYBorder * (y - yMin)) / (yMax - yMin)
    origin[2] = (originZBorder * (zMax - z)) / (zMax - zMin)
    return origin
  }
  transform3DPickedToOriginIndex(picked) {
    // 3D picked to origin index (no spacing)
    const origin = []
    const dimensions = this.state.dimensions
    const originIndexXLength = dimensions[0]
    const originIndexYLength = dimensions[1]
    const originIndexZLength = dimensions[2]
    const { xMax, yMax, zMax, xMin, yMin, zMin } = this.state.segRange

    const x = picked[0]
    const y = picked[1]
    const z = picked[2]
    origin[0] = (originIndexXLength * (x - xMin)) / (xMax - xMin)
    origin[1] = (originIndexYLength * (y - yMin)) / (yMax - yMin)
    origin[2] = (originIndexZLength * (z - zMin)) / (zMax - zMin)
    return origin
  }
  transformOriginTo3DPicked(origin) {
    // origin to 3D picked
    const picked = []
    const { originXBorder, originYBorder, originZBorder } = this.state
    const { xMax, yMax, zMax, xMin, yMin, zMin } = this.state.segRange

    picked[0] = xMin + (origin[0] * (xMax - xMin)) / originXBorder
    picked[1] = yMin + (origin[1] * (yMax - yMin)) / originYBorder
    picked[2] = zMax - (origin[2] * (zMax - zMin)) / originZBorder
    return picked
  }
}

export default DropTarget(Types.DATESERIE, viewerTarget, collect)(VTKViewer)
