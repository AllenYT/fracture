import React, { Component } from 'react'
import { findDOMNode } from 'react-dom'

import axios from 'axios'
import qs from 'qs'
import { Slider } from 'antd'
import { List, Grid, Button, Icon, Menu, Image, Dropdown, Popup, Table, Tab, Label, Sidebar, Loader } from 'semantic-ui-react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import InputColor from 'react-input-color'
import { vec3, vec4, mat4 } from 'gl-matrix'

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
import StudyBrowserList from '../components/StudyBrowserList'
import VTK2DViewer from '../components/VTK2DViewer'
import VTK3DViewer from '../components/VTK3DViewer'
import { frenet } from '../lib/frenet'
import { handleConfig } from '../lib/handleConfig'
import { loadAndCacheImagePlus } from '../lib/cornerstoneImageRequest'
import { executeTask } from '../lib/taskHelper'
// import centerLine from '../center_line.json'
// import oneAirway from '../one_airway.json'

import '../css/cornerstone.css'
import '../css/segview.css'
import src1 from '../images/scu-logo.jpg'
// import VTKViewer from '../components/VTKViewer'
import cornerstone from 'cornerstone-core'
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader'

cornerstoneWADOImageLoader.external.cornerstone = cornerstone
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
const lobeName = {
  1: '右肺中叶',
  2: '右肺上叶',
  3: '右肺下叶',
  4: '左肺上叶',
  5: '左肺下叶',
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
  0: '待定',
  1: '低危',
  2: '中危',
  3: '高危',
}

class ViewerPanel extends Component {
  constructor(props) {
    super(props)
    this.state = {
      caseId: window.location.pathname.split('/segView/')[1].split('/')[0],
      username: window.location.pathname.split('/segView/')[1].split('/')[1],

      /*显示变量*/
      windowWidth: window.screen.width,
      windowHeight: window.screen.height,
      viewerWidth: 1200,
      viewerHeight: 800,
      opTop: 46,
      opWidth: 314,
      opHeight: 42,

      /*3d数据*/
      urls: [],
      nodulesData: null,
      lobesData: null,
      segments: [],
      pointActors: [],

      /*重建数据*/
      imageIds: [],
      vtkImageData: null,
      volumes: [],
      labelDataArray: [],
      labelData: {},
      labelMapInputData: null,
      airwayVolumes: [],
      points: [],
      centerLinePoints: [],
      airwayCenterVolumes: [],
      fragmentVolumes: [],

      /*辅助数据*/
      lobesLength: 0,
      airwayLength: 0,
      nodulesLength: 0,
      spacing: [],
      dimensions: [],
      originXBorder: 1,
      originYBorder: 1,
      originZBorder: 1,
      segRange: {
        xMax: -Infinity,
        yMax: -Infinity,
        zMax: -Infinity,
        xMin: Infinity,
        yMin: Infinity,
        zMin: Infinity,
      },

      /*参数变量*/
      voi: { windowWidth: 1600, windowCenter: -600 },
      origin: [0, 0, 0],
      labelThreshold: 300,
      labelColor: [255, 0, 0],
      paintRadius: 5,

      /*控制变量*/
      mode: 1,
      selectedNum: 0,
      isCtrl: false,
      MPR: false,
      CPR: false,
      nodulesController: null,
      lobesController: null,
      airwayPicking: false,
      displayCrosshairs: false,
      editing: false,
      painting: false,
      erasing: false,
      show: false,

      /*列表控制变量*/
      segVisible: [],
      listsActive: [],
      listsOpacityChangeable: [],

      /*加载变量*/
      volumesLoading: true,
      percent: [],
      listLoading: [],
    }
    this.config = JSON.parse(localStorage.getItem('config'))
    this.nextPath = this.nextPath.bind(this)
    this.handleLogout = this.handleLogout.bind(this)
    this.toHomepage = this.toHomepage.bind(this)
  }
  async componentDidMount() {
    document.getElementById('header').style.display = 'none'
    this.apis = []
    this.resizeViewer(this.state.viewerWidth, this.state.viewerHeight)
    const token = localStorage.getItem('token')
    const headers = {
      Authorization: 'Bearer '.concat(token), //add the fun of check
    }
    const urlsPromise = new Promise((resolve, reject) => {
      axios
        .post(
          this.config.data.getMhaListForCaseId,
          qs.stringify({
            caseId: this.state.caseId,
          }),
          {
            headers,
          }
        )
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
    axios
      .post(
        this.config.draft.getLobeInfo,
        qs.stringify({
          caseId: this.state.caseId,
        })
      )
      .then((res) => {
        console.log('lobe info request', res)
        const data = res.data
        if (data.lobes) {
          const lobesData = data.lobes
          lobesData.forEach((item, index) => {
            item.index = index
            item.order = urls[index].order
            item.lobeName = lobeName[item.name]
          })
          this.saveLobesData(lobesData)
        }
      })
    // const lobesData = lobes.lobes
    // console.log(lobesData)
    // lobesData.forEach((item, index) => {
    //   item.index = index
    //   item.order = urls[index].order
    // })
    // this.saveLobesData(lobesData)
    axios
      .post(
        this.config.draft.getRectsForCaseIdAndUsername,
        qs.stringify({
          caseId: this.state.caseId,
          username: this.state.username,
        })
      )
      .then((res) => {
        console.log('nodule request', res)
        const data = res.data
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

        this.saveNodulesData(nodulesData)
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
        .post(
          this.config.data.getDataListForCaseId,
          qs.stringify({
            caseId: this.state.caseId,
          }),
          {
            headers,
          }
        )
        .then((res) => {
          console.log('imageids request', res)
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
    axios
      .post(
        this.config.draft.getCenterLine,
        qs.stringify({
          caseId: this.state.caseId,
        })
      )
      .then((res) => {
        console.log('centerLine request', res)
        const data = res.data
        if (data.centerline) {
          const coos = data.centerline
          this.processCenterLine(coos)
        }
      })
    // this.processCenterLine()
    // this.processOneAirway()
    this.getMPRInfoWithPriority(imageIds)

    // const dom = ReactDOM.findDOMNode(this.gridRef);

    window.addEventListener('resize', this.resize.bind(this))
    window.addEventListener('contextmenu', this.contextmenu.bind(this))
    window.addEventListener('dblclick', this.dblclick.bind(this))
    window.addEventListener('click', this.click.bind(this))
    window.addEventListener('mousedown', this.mousedown.bind(this))
    window.addEventListener('mousewheel', this.mousewheel.bind(this), {
      passive: false,
    })
    window.addEventListener('keydown', this.keydown.bind(this))
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.resize.bind(this))
    window.removeEventListener('contextmenu', this.contextmenu.bind(this))
    window.removeEventListener('dblclick', this.dblclick.bind(this))
    window.removeEventListener('click', this.click.bind(this))
    window.removeEventListener('mousedown', this.mousedown.bind(this))
    window.removeEventListener('mousewheel', this.mousewheel.bind(this))
    window.removeEventListener('keydown', this.keydown.bind(this))
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

  saveNodulesData(nodulesData) {
    console.log('nodulesData', nodulesData)
    const nodulesOpacities = new Array(nodulesData.length).fill(1.0)
    const nodulesActive = new Array(nodulesData.length).fill(false)
    const nodulesVisible = new Array(nodulesData.length).fill(true)
    const nodulesOpacityChangeable = new Array(nodulesData.length).fill(false)
    const nodulesController = {
      nodulesOpacities,
      nodulesActive,
      nodulesVisible,
      nodulesOpacityChangeable,
    }
    this.setState({
      nodulesData,
      nodulesController,
    })
  }
  saveLobesData(lobesData) {
    console.log('lobesData', lobesData)
    const lobesOpacities = new Array(lobesData.length).fill(1.0)
    const lobesActive = new Array(lobesData.length).fill(false)
    const lobesVisible = new Array(lobesData.length).fill(true)
    const lobesOpacityChangeable = new Array(lobesData.length).fill(false)
    const lobesController = {
      lobesOpacities,
      lobesActive,
      lobesVisible,
      lobesOpacityChangeable,
    }
    this.setState({
      lobesData,
      lobesController,
    })
  }
  processCenterLine(coos) {
    const segRange = this.state.segRange
    const spacing = this.state.spacing
    const xOffset = segRange.xMin
    const yOffset = segRange.yMin
    const zOffset = segRange.zMin
    const centerLinePoints = []
    coos.forEach((item, index) => {
      const z = item[0]
      const y = item[1]
      const x = item[2]
      centerLinePoints.push(vec3.fromValues(Math.floor(x * spacing[0] + xOffset), Math.floor(y * spacing[1] + yOffset), Math.floor(z + zOffset)))
    })
    this.setState({
      centerLinePoints,
    })
    //local test
    // const coos = centerLine.coos
    // const regions = centerLine.regions
    // for (let i = 0; i < regions.length; i++) {
    //   const region = regions[i]
    //   let zMax, zMin, yMax, yMin, xMax, xMin
    //   if (region[0][0] < region[1][0]) {
    //     zMin = region[0][0]
    //     zMax = region[1][0]
    //   } else {
    //     zMin = region[1][0]
    //     zMax = region[0][0]
    //   }
    //   if (region[0][1] < region[1][1]) {
    //     yMin = region[0][1]
    //     yMax = region[1][1]
    //   } else {
    //     yMin = region[1][1]
    //     yMax = region[0][1]
    //   }
    //   if (region[0][2] < region[1][2]) {
    //     xMin = region[0][2]
    //     xMax = region[1][2]
    //   } else {
    //     xMin = region[1][2]
    //     xMax = region[0][2]
    //   }
    //   const regionPoints = []
    //   coos.forEach((item, index) => {
    //     const z = item[0]
    //     const y = item[1]
    //     const x = item[2]
    //     if (z <= zMax && z >= zMin && y <= yMax && y >= yMin && x <= xMax && x >= xMin) {
    //       regionPoints.push(vec3.fromValues(Math.floor(x * 0.7 + xOffset), Math.floor(y * 0.7 + yOffset), z + zOffset))
    //     }
    //   })
    //   centerLine.regions[i].points = regionPoints
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
  resizeViewer(viewerWidth, viewerHeight) {
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
  resize(e) {
    // console.log('browser', e.target.innerWidth, e.target.innerHeight)
    if (document.getElementById('segment-container') !== null) {
      const componentRect = findDOMNode(document.getElementById('segment-container')).getBoundingClientRect()
      const clientWidth = document.getElementById('segment-container').clientWidth
      const clientHeight = document.getElementById('segment-container').clientHeight
      // console.log('resize3DView', clientWidth, clientHeight)
      this.resizeViewer(clientWidth, clientHeight)
    }

    if (document.getElementsByClassName('segment-list-block') !== null && document.getElementsByClassName('segment-list-block').length > 2) {
      const outElement = document.getElementsByClassName('segment-list-block')[0]
      if (outElement.getElementsByTagName('tr') !== null && outElement.getElementsByTagName('tr').length > 1) {
        const firstElement = outElement.getElementsByTagName('tr')[0]
        const secondElement = outElement.getElementsByTagName('tr')[2]

        this.setState({
          opTop: firstElement.clientHeight,
          opWidth: secondElement.clientWidth,
          opHeight: secondElement.clientHeight,
        })
      }
    }
  }
  contextmenu(e) {}
  keydown(e) {
    // e.which : +/187, -/189
    // if(e.ctrlKey){
    //   console.log("ctrl")
    //   this.setState({
    //     isCtrl: true
    //   })
    // }
    if (e.shiftKey) {
      console.log('ctrl')
      this.setState({
        isCtrl: true,
      })
    }
    const isCtrl = this.state.isCtrl
    if (e.which === 187 && isCtrl) {
    }
    const that = this
    window.addEventListener('keyup', keyup)
    function keyup(e) {
      that.setState({
        isCtrl: false,
      })
      window.removeEventListener('keyup', keyup)
    }
  }
  mousewheel(e) {}
  mousedown(e) {}
  click(e) {
    // console.log("click", e)
  }
  dblclick(e) {
    // console.log("dblclick", e)
  }
  rightClick(picked) {
    console.log('right click', picked)
    if (this.state.editing) {
      if (picked) {
        const { originXBorder, originYBorder, originZBorder } = this.state
        const origin = this.transform3DPickedToOrigin(picked)
        if (origin[0] >= 0 && origin[0] <= originXBorder && origin[1] >= 0 && origin[1] <= originYBorder && origin[2] >= 0 && origin[2] <= originZBorder) {
          this.setState({
            origin: origin,
          })
          this.updateAllByOrigin()
        }
      }
    }
  }
  nextPath(path) {
    this.props.history.push(path)
  }
  goBack() {
    window.history.back()
  }
  toHomepage() {
    window.location.href = '/homepage'
    // this.nextPath('/homepage/' + params.caseId + '/' + res.data)
  }
  handleLogout() {
    const token = localStorage.getItem('token')
    const headers = {
      Authorization: 'Bearer '.concat(token),
    }
    axios
      .get(this.config.user.signoutUser, { headers })
      .then((response) => {
        if (response.data.status === 'okay') {
          this.setState({ isLoggedIn: false })
          localStorage.clear()
          sessionStorage.clear()
          window.location.href = '/'
        } else {
          alert('出现内部错误，请联系管理员！')
          window.location.href = '/'
        }
      })
      .catch((error) => {
        console.log('error')
      })
  }
  handleClickScreen(e, href) {
    console.log('card', href)
    // if (
    //   window.location.pathname.split("/segView/")[1].split("/")[0] !==
    //   href.split("/case/")[1].split("/")[0]
    // ) {
    //   this.setState({
    //     caseId: href.split("/case/")[1].split("/")[0],
    //     username: href.split("/")[3],
    //     show: false,
    //   });
    // window.location.href =
    //   "/segView/" + href.split("/case/")[1].split("/")[0];
    // }
    // window.location.href=href
  }
  function(key, callback, args) {
    let isC = false
    function keyDown(e) {
      if (e.ctrlKey) {
        isC = true
      }
      if (e.keyCode === key.charCodeAt(0) && isC) {
        callback.apply(this, args)
        return false
      }
    }
    function keyUp(e) {}
  }

  addVolumeToRenderer() {
    const apis = this.apis
    apis.forEach((api, apiIndex) => {
      const renderer = api.genericRenderWindow.getRenderer()
      const volume = api.volumes[0]
      if (volume) {
        renderer.addVolume(volume)
      }
      this.timer = setTimeout(() => {
        api.resetCamera()
      }, 500)
    })
  }
  removeVolumeFromRenderer() {
    const apis = this.apis
    apis.forEach((api, apiIndex) => {
      const renderer = api.genericRenderWindow.getRenderer()
      const volume = api.volumes[0]
      if (volume) {
        renderer.removeVolume(volume)
      }
    })
  }
  clearVolumes() {
    this.setState({
      volumes: [],
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
  updateLabelDataByThreshold() {
    const threshold = this.state.labelThreshold
    const dimensions = this.state.dimensions
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
  updateLabelDataByColor() {
    const labelColor = this.state.labelColor
    const apis = this.apis

    apis.forEach((api, apiIndex) => {
      api.setSegmentRGB(1, labelColor)
    })
  }
  changeRadius(e) {
    const radius = e
  }
  afterChangeRadius(e) {
    const radius = e
    this.setState(
      {
        paintRadius: radius,
      },
      () => {
        this.changePaintRadius(radius)
      }
    )
  }
  changeThreshold(e) {
    const threshold = e
  }
  afterChangeThreshold(e) {
    const threshold = e
    this.setState(
      {
        labelThreshold: threshold,
      },
      () => {
        this.updateLabelDataByThreshold()
      }
    )
  }
  setPaintColor(e) {
    const color = [e.r, e.g, e.b]
    this.setState(
      {
        labelColor: color,
      },
      () => {
        this.updateLabelDataByColor()
      }
    )
  }

  setSegmentOpacity(idx, opacity) {
    let tmp_segments = [].concat(this.state.segments)
    if (tmp_segments[idx]) {
      tmp_segments[idx].getProperty().setOpacity(opacity)
    }
    this.setState({ segments: tmp_segments })
  }
  setActive(classfication, index, urlIndex, e) {
    // if(e.target.nodeName !== 'INPUT')
    e.stopPropagation()
    if (classfication === 0) {
      const lobesController = this.state.lobesController
      lobesController.lobesActive[index] = !lobesController.lobesActive[index]
      this.setState({
        lobesController,
      })
    } else if (classfication === 2) {
      const nodulesController = this.state.nodulesController
      nodulesController.nodulesActive[index] = !nodulesController.nodulesActive[index]
      this.setState({
        nodulesController,
      })

      if (this.state.MPR && this.state.painting && nodulesController.nodulesActive[index]) {
        this.createNoduleMask(urlIndex)
      }
    }
  }
  setVisible(classfication, index, urlIndex, e) {
    e.stopPropagation()
    if (classfication === 0) {
      const lobesController = this.state.lobesController
      lobesController.lobesVisible[index] = !lobesController.lobesVisible[index]
      if (lobesController.lobesVisible[index]) {
        this.setSegmentOpacity(urlIndex, lobesController.lobesOpacities[index])
      } else {
        this.setSegmentOpacity(urlIndex, 0)
      }

      this.setState({
        lobesController,
      })
    } else if (classfication === 2) {
      const nodulesController = this.state.nodulesController
      nodulesController.nodulesVisible[index] = !nodulesController.nodulesVisible[index]
      if (nodulesController.nodulesVisible[index]) {
        this.setSegmentOpacity(urlIndex, nodulesController.nodulesOpacities[index])
      } else {
        this.setSegmentOpacity(urlIndex, 0)
      }

      this.setState({
        nodulesController,
      })
    }
  }
  setOpacityChangeable(classfication, index, e) {
    e.stopPropagation()
    if (classfication === 0) {
      const lobesController = this.state.lobesController
      lobesController.lobesOpacityChangeable[index] = !lobesController.lobesOpacityChangeable[index]
      this.setState({
        lobesController,
      })
    } else if (classfication === 2) {
      const nodulesController = this.state.nodulesController
      nodulesController.nodulesOpacityChangeable[index] = !nodulesController.nodulesOpacityChangeable[index]
      this.setState({
        nodulesController,
      })
    }
  }
  changeOpacity(classfication, index, urlIndex, e) {
    e.stopPropagation()
    if (classfication === 0) {
      const lobesController = this.state.lobesController
      lobesController.lobesOpacities[index] = e.target.value
      this.setSegmentOpacity(urlIndex, e.target.value)

      this.setState({
        lobesController,
      })
    } else if (classfication === 2) {
      const nodulesController = this.state.nodulesController
      nodulesController.nodulesOpacities[index] = e.target.value
      this.setSegmentOpacity(urlIndex, e.target.value)

      this.setState({
        nodulesController,
      })
    }
  }
  selectOpacity(e) {
    e.stopPropagation()
  }

  handleFuncButton(idx, e) {
    switch (idx) {
      case 'FRG':
        break
      case 'LUNG':
        this.setWL(1)
        break
      case 'BONE':
        this.setWL(2)
        break
      case 'VENTRAL':
        this.setWL(3)
        break
      case 'MEDIA':
        this.setWL(4)
        break
      case 'MPR':
        this.setState({
          MPR: true,
        })
        this.changeMode(2)
        break
      case 'STMPR':
        this.setState({
          MPR: false,
        })
        this.changeMode(1)
        break
      case 'RC':
        this.resetAllView()
        break
      case 'HC':
        this.setState({
          displayCrosshairs: false,
        })
        this.toggleCrosshairs(false)
        break
      case 'SC':
        this.setState({
          displayCrosshairs: true,
        })
        this.toggleCrosshairs(true)
        break
      case 'BP':
        this.beginPaint()
        break
      case 'DP':
        this.doPaint()
        break
      case 'DE':
        this.doErase()
        break
      case 'EP':
        this.endPaint()
        break
      case 'CPR':
        this.setState({
          CPR: true,
        })
        this.changeMode(3)
        break
      case 'STCPR':
        this.setState({
          CPR: false,
        })
        this.changeMode(2)
        break
      case 'RA':
        this.pickAirway()
        // this.createAirwayVolumes();
        break
      case 'FS':
        this.finishPicking()
        break
      default:
        break
    }
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
        this.resizeViewer()
      }
    )
  }
  changeSelectedNum(selectedNum) {
    this.setState({
      selectedNum: selectedNum,
    })
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
    const centerLinePoints = this.state.centerLinePoints
    if (centerLinePoints && centerLinePoints.length) {
      const points = []
      centerLinePoints.forEach((item, index) => {
        const x = item[0]
        const y = item[1]
        const z = item[2]
        if (x <= range.xMax && x >= range.xMin && y <= range.yMax && y >= range.yMin && z <= range.zMax && z >= range.zMin) {
          points.push(item)
        }
      })
      console.log('seleted points', points)
      this.setState(
        {
          points,
        },
        () => {
          this.viewer3D.endPicking()
          this.createAirwayVolumes()
        }
      )
    } else {
      alert('没有中心线坐标')
    }
  }
  selectAirwayRangeByWidget(pickedPoints) {
    // not used
    console.log('airway picked points', pickedPoints)
    const centerLinePoints = this.state.centerLinePoints
    if (centerLinePoints && centerLinePoints.length) {
      const points = []
      for (let i = 0; i < pickedPoints.length; i++) {
        if (i === 0) {
          continue
        }
        const lastPickedPoint = pickedPoints[i - 1]
        const pickedPoint = pickedPoints[i]
        centerLinePoints.forEach((item) => {
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
      lobesData,
      nodulesData,
      nodulesController,
      lobesController,
      opTop,
      opWidth,
      opHeight,
      MPR,
      CPR,
      viewerWidth,
      viewerHeight,
      displayCrosshairs,
      labelThreshold,
      paintRadius,
      painting,
      erasing,
      urls,
      percent,
      listLoading,
      segments,
      vtkImageData,
      volumes,
      volumesLoading,
      originXBorder,
      originYBorder,
      originZBorder,
      labelMapInputData,
      mode,
      segRange,
      airwayPicking,
      airwayCenterVolumes,
      lineActors,
    } = this.state
    const welcome = '欢迎您，' + localStorage.realname
    const nameList = ['肺叶', '支气管', '结节']

    let lobesInfo = <></>
    let lobesOp = <></>
    if (lobesData && lobesData.length > 0) {
      lobesInfo = lobesData.map((item, index) => {
        return (
          <Table.Row key={index}>
            <Table.Cell>{item.lobeName}</Table.Cell>
            <Table.Cell>
              {item.volume}cm<sup>2</sup>
            </Table.Cell>
            <Table.Cell>{item.percent}%</Table.Cell>
          </Table.Row>
        )
      })
      lobesOp = lobesData.map((item, index) => {
        const inputRangeStyle = {
          backgroundSize: lobesController.lobesOpacities[index] * 100 + '%',
        }
        const segmentListSidebarContentStyle = {
          width: opWidth,
          height: opHeight,
        }
        return (
          <Sidebar.Pushable as={'div'} key={index} onClick={this.setActive.bind(this, 0, index, item.index)}>
            <div className="segment-list-sidebar-content" style={segmentListSidebarContentStyle}></div>
            <Sidebar animation="overlay" direction="right" visible={lobesController.lobesActive[index]}>
              <div className="segment-list-sidebar-visibility">
                <Button inverted color="blue" size="tiny" hidden={lobesController.lobesVisible[index]} onClick={this.setVisible.bind(this, 0, index, item.index)}>
                  显示
                </Button>
                <Button inverted color="blue" size="tiny" hidden={!lobesController.lobesVisible[index]} onClick={this.setVisible.bind(this, 0, index, item.index)}>
                  隐藏
                </Button>
              </div>
              <div className="segment-list-sidebar-opacity">
                <Button inverted color="blue" size="tiny" hidden={lobesController.lobesOpacityChangeable[index]} onClick={this.setOpacityChangeable.bind(this, 0, index)}>
                  透明度
                </Button>
                <Button inverted color="blue" size="tiny" hidden={!lobesController.lobesOpacityChangeable[index]} onClick={this.setOpacityChangeable.bind(this, 0, index)}>
                  关闭
                </Button>
                <div className="segment-list-content-tool-input" hidden={!lobesController.lobesActive[index] || !lobesController.lobesOpacityChangeable[index]} onClick={this.selectOpacity.bind(this)}>
                  {lobesController.lobesOpacities[index] * 100}%
                  <input style={inputRangeStyle} type="range" min={0} max={1} step={0.1} value={lobesController.lobesOpacities[index]} onChange={this.changeOpacity.bind(this, 0, index, item.index)} />
                </div>
              </div>
            </Sidebar>
          </Sidebar.Pushable>
        )
      })
    }

    let nodulesInfo = <></>
    let nodulesOp = <></>
    if (nodulesData && nodulesData.length > 0) {
      nodulesInfo = nodulesData.map((item, index) => {
        return (
          <Table.Row key={index}>
            <Table.Cell>{item.name}</Table.Cell>
            <Table.Cell>{item.position}</Table.Cell>
            <Table.Cell className={'segment-list-malignancy-' + item.malignancy}>{item.malignancyName}</Table.Cell>
          </Table.Row>
        )
      })
      nodulesOp = nodulesData.map((item, index) => {
        const inputRangeStyle = {
          backgroundSize: nodulesController.nodulesOpacities[index] * 100 + '%',
        }
        const segmentListSidebarContentStyle = {
          width: opWidth,
          height: opHeight,
        }
        return (
          <Sidebar.Pushable as={'div'} key={index} onClick={this.setActive.bind(this, 2, index, item.index)}>
            <div className="segment-list-sidebar-content" style={segmentListSidebarContentStyle}></div>
            <Sidebar animation="overlay" direction="right" visible={nodulesController.nodulesActive[index]}>
              <div className="segment-list-sidebar-visibility">
                <Button inverted color="blue" size="tiny" hidden={nodulesController.nodulesVisible[index]} onClick={this.setVisible.bind(this, 2, index, item.index)}>
                  显示
                </Button>
                <Button inverted color="blue" size="tiny" hidden={!nodulesController.nodulesVisible[index]} onClick={this.setVisible.bind(this, 2, index, item.index)}>
                  隐藏
                </Button>
              </div>
              <div className="segment-list-sidebar-opacity">
                <Button inverted color="blue" size="tiny" hidden={nodulesController.nodulesOpacityChangeable[index]} onClick={this.setOpacityChangeable.bind(this, 2, index)}>
                  透明度
                </Button>
                <Button inverted color="blue" size="tiny" hidden={!nodulesController.nodulesOpacityChangeable[index]} onClick={this.setOpacityChangeable.bind(this, 2, index)}>
                  关闭
                </Button>
                <div
                  className="segment-list-content-tool-input"
                  hidden={!nodulesController.nodulesActive[index] || !nodulesController.nodulesOpacityChangeable[index]}
                  onClick={this.selectOpacity.bind(this)}>
                  {nodulesController.nodulesOpacities[index] * 100}%
                  <input
                    style={inputRangeStyle}
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={nodulesController.nodulesOpacities[index]}
                    onChange={this.changeOpacity.bind(this, 2, index, item.index)}
                  />
                </div>
              </div>
            </Sidebar>
          </Sidebar.Pushable>
        )
      })
    }
    const segmentListOperationStyles = {
      top: opTop,
    }
    const panes3D = [
      {
        menuItem: '肺叶',
        render: () => {
          return (
            <div className="segment-list-block">
              <Table celled inverted>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>肺叶</Table.HeaderCell>
                    <Table.HeaderCell>体积</Table.HeaderCell>
                    <Table.HeaderCell>占比</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>{lobesInfo}</Table.Body>
              </Table>
              <div className="segment-list-operation" style={segmentListOperationStyles}>
                {lobesOp}
              </div>
            </div>
          )
        },
      },
      {
        menuItem: '肺结节',
        render: () => {
          return (
            <div className="segment-list-block">
              <Table celled selectable inverted>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>肺结节</Table.HeaderCell>
                    <Table.HeaderCell>位置</Table.HeaderCell>
                    <Table.HeaderCell>危险度</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>{nodulesInfo}</Table.Body>
              </Table>
              <div className="segment-list-operation" style={segmentListOperationStyles}>
                {nodulesOp}
              </div>
            </div>
          )
        },
      },
    ]

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
    // let segments_list = [];
    // for (let cur_idx in segments) {
    //   segments_list.push(segments[cur_idx]);
    // }
    // console.log('render segments:', segments)
    return (
      <DndProvider backend={HTML5Backend}>
        <div id="viewer">
          <Menu className="corner-header">
            <Menu.Item>
              <Image src={src1} avatar size="mini" />
              <a id="sys-name" href="/searchCase">
                肺结节CT影像辅助检测软件
              </a>
            </Menu.Item>
            <Menu.Item className="funcolumn">
              <Button.Group>
                {/* <Button icon className='funcBtn' onClick={this.handleFuncButton.bind(this, "TEST")} title="放大"><Icon name='search plus' size='large'/></Button> */}
                <Button icon className="funcBtn" hidden={MPR} onClick={this.handleFuncButton.bind(this, 'MPR')} title="MPR">
                  <Icon name="th large" size="large" />
                </Button>
                <Button icon className="funcBtn" hidden={!MPR} onClick={this.handleFuncButton.bind(this, 'STMPR')} title="取消MPR">
                  <Icon name="window close outline" size="large" />
                </Button>
                <Button icon className="funcBtn" onClick={this.handleFuncButton.bind(this, 'FRG')} title="分块" description="fragment" hidden={true}>
                  <Icon name="plus" size="large" />
                </Button>
              </Button.Group>
            </Menu.Item>
            <span id="line-left" hidden={!MPR}></span>
            <Menu.Item className="hucolumn" hidden={!MPR}>
              <Button.Group>
                <Button className="hubtn" onClick={this.handleFuncButton.bind(this, 'LUNG')} title="肺窗" content="肺窗"></Button>
                <Button className="hubtn" onClick={this.handleFuncButton.bind(this, 'BONE')} title="骨窗" content="骨窗"></Button>
                <Button className="hubtn" onClick={this.handleFuncButton.bind(this, 'VENTRAL')} title="腹窗" content="腹窗"></Button>
                <Button className="hubtn" onClick={this.handleFuncButton.bind(this, 'MEDIA')} title="纵隔窗" content="纵隔窗"></Button>
              </Button.Group>
            </Menu.Item>
            <span id="line-left" hidden={!MPR}></span>
            <Menu.Item className="funcolumn" hidden={!MPR}>
              <Button.Group>
                <Button icon className="funcBtn" onClick={this.handleFuncButton.bind(this, 'RC')} title="重置相机" description="reset camera">
                  <Icon name="redo" size="large" />
                </Button>
                {/* <Button icon className='funcBtn' active={crosshairsTool} onClick={this.handleFuncButton.bind(this, "TC")} title="十字线" description="toggle crosshairs"><Icon name='plus' size='large'/></Button> */}
                <Button icon className="funcBtn" hidden={!displayCrosshairs} onClick={this.handleFuncButton.bind(this, 'HC')} title="隐藏十字线" description="hidden crosshairs">
                  <Icon className="icon-custom-HC" size="large" />
                </Button>
                <Button icon className="funcBtn" hidden={displayCrosshairs} onClick={this.handleFuncButton.bind(this, 'SC')} title="显示十字线" description="show crosshairs">
                  <Icon className="icon-custom-SC" size="large" />
                </Button>
              </Button.Group>
            </Menu.Item>
            <span id="line-left" hidden={!MPR}></span>
            <Menu.Item className="funcolumn" hidden={!MPR}>
              <Button.Group>
                <Button icon className="funcBtn" hidden={painting} onClick={this.handleFuncButton.bind(this, 'BP')} title="开始勾画" description="begin painting">
                  <Icon name="paint brush" size="large" />
                </Button>
                <Button icon className="funcBtn" hidden={!painting} active={!erasing} onClick={this.handleFuncButton.bind(this, 'DP')} title="勾画" description="do painting">
                  <Icon name="paint brush" size="large" />
                </Button>
                <Button icon className="funcBtn" hidden={!painting} active={erasing} onClick={this.handleFuncButton.bind(this, 'DE')} title="擦除" description="do erasing">
                  <Icon name="eraser" size="large" />
                </Button>
                <Popup
                  on="click"
                  trigger={
                    <Button icon className="funcBtn" hidden={!painting}>
                      <Icon name="dot circle" size="large" />
                    </Button>
                  }
                  position="bottom center"
                  style={{
                    backgroundColor: '#021c38',
                    borderColor: '#021c38',
                    width: '200px',
                    padding: '2px 4px 2px 4px',
                  }}>
                  <div>
                    <div className="segment-widget-radius-container">
                      画笔半径:
                      <Slider
                        className="segment-widget-radius-slider"
                        value={paintRadius}
                        min={1}
                        step={1}
                        max={10}
                        tooltipVisible={false}
                        onChange={this.changeRadius.bind(this)}
                        onAfterChange={this.afterChangeRadius.bind(this)}
                      />
                    </div>
                    <div className="segment-label-threshold-container">
                      标记阈值:
                      <Slider
                        className="segment-label-threshold-slider"
                        value={labelThreshold}
                        min={100}
                        step={100}
                        max={1000}
                        tooltipVisible={false}
                        onChange={this.changeThreshold.bind(this)}
                        onAfterChange={this.afterChangeThreshold.bind(this)}
                      />
                    </div>
                  </div>
                </Popup>
                <Popup
                  on="click"
                  trigger={
                    <Button icon className="funcBtn" hidden={!painting}>
                      <Icon name="eye dropper" size="large" />
                    </Button>
                  }
                  position="bottom center"
                  style={{
                    backgroundColor: '#021c38',
                    borderColor: '#021c38',
                    width: '150px',
                    padding: '2px 4px 2px 4px',
                  }}>
                  <div className="segment-label-color-selector">
                    颜色选择器：
                    <InputColor initialValue="#FF0000" onChange={this.setPaintColor.bind(this)} placement="right" />
                  </div>
                </Popup>
                <Button icon className="funcBtn" hidden={!painting} onClick={this.handleFuncButton.bind(this, 'EP')} title="停止勾画" description="end painting">
                  <Icon name="window close outline" size="large" />
                </Button>
              </Button.Group>
            </Menu.Item>
            <span id="line-left" hidden={!MPR}></span>
            <Menu.Item className="funcolumn" hidden={!MPR}>
              <Button.Group>
                <Button icon className="funcBtn" onClick={this.handleFuncButton.bind(this, 'CPR')} title="CPR" hidden={CPR}>
                  <Icon className="icon-custom-CPR" size="large" />
                </Button>
                <Button icon className="funcBtn" onClick={this.handleFuncButton.bind(this, 'STCPR')} title="取消CPR" hidden={!CPR}>
                  <Icon name="window close outline" size="large" />
                </Button>
                <Button icon className="funcBtn" onClick={this.handleFuncButton.bind(this, 'RA')} title="重建气道" description="reconstruct airway">
                  <Icon className="icon-custom-RA" size="large" />
                </Button>
                {/* <Button icon className="funcBtn" onClick={this.handleFuncButton.bind(this, 'FS')} title="选择完成" description="finish selection">
                  <Icon className="icon-custom-FS" size="large" />
                </Button> */}
              </Button.Group>
            </Menu.Item>
            <span id="line-left"></span>
            <Menu.Item className="funcolumn">
              <Button.Group>
                <Button className="funcBtn" onClick={this.goBack.bind(this)}>
                  2D
                </Button>
              </Button.Group>
            </Menu.Item>
            <Menu.Item position="right">
              <Dropdown text={welcome}>
                <Dropdown.Menu id="logout-menu">
                  <Dropdown.Item icon="home" text="我的主页" onClick={this.toHomepage} />
                  <Dropdown.Item icon="write" text="留言" />
                  <Dropdown.Item icon="log out" text="注销" onClick={this.handleLogout} />
                </Dropdown.Menu>
              </Dropdown>
            </Menu.Item>
          </Menu>
          <Grid celled className="corner-contnt">
            <Grid.Row className="corner-row" columns={3}>
              <Grid.Column width={2}>
                <StudyBrowserList handleClickScreen={this.handleClickScreen.bind(this)} caseId={this.state.caseId} />
              </Grid.Column>
              {/* 中间部分 */}
              <Grid.Column width={11}>
                {/* <VTKViewer
                  onRef={(ref) => {
                    this.viewer = ref
                  }}
                  saveUrls={this.saveUrls.bind(this)}
                  saveLobesData={this.saveLobesData.bind(this)}
                  saveNodulesData={this.saveNodulesData.bind(this)}
                /> */}
                <div className="segment-container" id="segment-container">
                  <div style={{ width: viewerWidth, height: viewerHeight }}>{panel}</div>
                </div>
              </Grid.Column>
              {/* 右边部分 */}
              <Grid.Column width={3}>
                <Tab className="list-tab" panes={panes3D} />
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </div>
      </DndProvider>
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

export default ViewerPanel
