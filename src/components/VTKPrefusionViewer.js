import React, { Component } from 'react'
import cornerstone from 'cornerstone-core'
import cornerstoneTools from 'cornerstone-tools'
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader'
import { vec3, vec4, mat4 } from 'gl-matrix'
import _ from 'lodash'

import { Icon, Button, Accordion, Modal, Dropdown, Menu, Label, Header, Popup, Table, Sidebar, Loader, Divider, Form, Card } from 'semantic-ui-react'
import { Slider, Select, Checkbox, Tabs, InputNumber, Popconfirm, message, Cascader, Radio, Row, Col, Form as AntdForm, Input, Tooltip } from 'antd'

import axios from 'axios'
import qs from 'qs'
import vtkITKImageReader from 'vtk.js'
import vtkGenericRenderWindow from 'vtk.js/Sources/Rendering/Misc/GenericRenderWindow'
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor'
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper'
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction'
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction'
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray'
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData'
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume'
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper'
import vtkXMLPolyDataReader from 'vtk.js/Sources/IO/XML/XMLPolyDataReader'
import HttpDataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper'

import vtkSVGRotatableCrosshairsWidget from '../vtk/VTKViewport/vtkSVGRotatableCrosshairsWidget'
import vtkInteractorStyleRotatableMPRCrosshairs from '../vtk/VTKViewport/vtkInteractorStyleRotatableMPRCrosshairs'
import vtkInteractorStyleMPRWindowLevel from '../vtk/VTKViewport/vtkInteractorStyleMPRWindowLevel'
import View2D from '../vtk/VTKViewport/View2D'
import getImageData from '../vtk/lib/getImageData'
import loadImageData from '../vtk/lib/loadImageData'

import LoadingComponent from './LoadingComponent'

import '../css/prefusion.css'

import '../initCornerstone.js'
import VTK3DViewer from './VTK3DViewer'

cornerstoneWADOImageLoader.external.cornerstone = cornerstone
window.cornerstoneTools = cornerstoneTools

const ORIENTATION = {
  AXIAL: {
    slicePlaneNormal: [0, 0, 1],
    sliceViewUp: [0, -1, 0],
  },
  SAGITTAL: {
    slicePlaneNormal: [-1, 0, 0],
    sliceViewUp: [0, 0, 1],
  },
  CORONAL: {
    slicePlaneNormal: [0, 1, 0],
    sliceViewUp: [0, 0, 1],
  },
}
const dictList = {
  lung: {
    class: 3,
    label: 'lung',
    name: '肺',
    color: { c1: 197, c2: 165, c3: 145 },
  },
  airway: {
    class: 1,
    label: 'airway',
    name: '支气管',
    color: { c1: 182, c2: 228, c3: 255 },
    // color: { c1: 178, c2: 212, c3: 242 },
  },
  1: {
    id: 1,
    class: 0,
    label: 'lobe_1',
    name: '右肺中叶',
    color: { c1: 128, c2: 174, c3: 128 },
    // color: { c1: 178, c2: 212, c3: 242 },
  },
  2: {
    id: 2,
    class: 0,
    label: 'lobe_2',
    name: '右肺上叶',
    color: { c1: 241, c2: 214, c3: 145 },
    // color: { c1: 178, c2: 212, c3: 242 },
  },
  3: {
    class: 0,
    label: 'lobe_3',
    name: '右肺下叶',
    color: { c1: 177, c2: 122, c3: 101 },
    // color: { c1: 178, c2: 212, c3: 242 },
  },
  4: {
    class: 0,
    label: 'lobe_4',
    name: '左肺上叶',
    color: { c1: 111, c2: 184, c3: 210 },
    // color: { c1: 178, c2: 212, c3: 242 },
  },
  5: {
    class: 0,
    label: 'lobe_5',
    name: '左肺下叶',
    // color: { c1: 216, c2: 101, c3: 79 },
    color: { c1: 178, c2: 212, c3: 242 },
  },
}
export default class VTKPrefusionViewer extends Component {
  constructor(props) {
    super(props)
    this.state = {
      realname: localStorage.realname ? localStorage.realname : '',
      username: localStorage.getItem('username'),
      caseId: '1.2.840.113619.2.55.3.2831217177.679.1591325357.602',

      windowWidth: document.body.clientWidth,
      windowHeight: document.body.clientHeight,

      viewerWidth: 0,
      viewerHeight: 0,
      bottomRowHeight: 0,
      segmentationWidth: 0,
      segmentationHeight: 0,

      imageIds: [],
      vtkOriImageData: null,
      volumes: null,
      dimensions: [512, 512, 321],
      preDimensions: [64, 64, 64],

      preImageIds: [],
      vtkPreImageData: null,
      preVolumes: null,

      vtkFusImageData: null,
      fusVolumes: null,
      voi: { windowWidth: 1600, windowCenter: -600 },

      bdImageData: null,
      bdVolumes: null,

      segments: null,
      volumesCreated: false,
      preVolumesCreated: false,

      displayCrosshairs: false,
      preDisplayCrosshairs: false,
      fusDisplayCrosshairs: false,
    }
    this.config = JSON.parse(localStorage.getItem('config'))
    this.container = React.createRef()
    this.apis = []
    this.preApis = []
    this.fusApis = []
  }
  async componentDidMount() {
    if (document.getElementById('header')) {
      document.getElementById('header').style.display = 'none'
    }
    if (document.getElementById('main')) {
      document.getElementById('main').setAttribute('style', 'height:100%;padding-bottom:0px')
    }
    if (document.getElementById('footer')) {
      document.getElementById('footer').style.display = 'none'
    }

    const imageIdsPromise = new Promise((resolve, reject) => {
      axios
        .post(
          this.config.prefusion.getDataListForCaseId,
          qs.stringify({
            caseId: '1.2.840.113619.2.55.3.2831217177.679.1591325357.602',
          })
        )
        .then((response) => {
          resolve(response.data)
        })
        .catch((e) => {
          console.log(e)
          reject(e)
        })
    })
    // const preImageIdsPromise = new Promise((resolve, reject) => {
    //   axios
    //     .post(
    //       this.config.data.getDataListForCaseId,
    //       qs.stringify({
    //         caseId: '1.2.840.113619.2.416.283537229357768509317679752367899441109',
    //       })
    //     )
    //     .then((response) => {
    //       resolve(response.data)
    //     }, reject)
    // })
    const { dcm: imageIds, vp_dcm: preImageIds } = await imageIdsPromise
    // const preImageIds = await preImageIdsPromise
    // console.log('before', imageIds)
    const firstImageIdPromise = new Promise((resolve, reject) => {
      cornerstone.loadAndCacheImage(imageIds[0]).then((img) => {
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

        // mapper.setMaximumSamplesPerRay(2000);
        // mapper.setSampleDistance(2);
        this.setState(
          {
            // imageIds: imageIds,
            origin: origin,
            dimensions: [xVoxels, yVoxels, zVoxels],
            spacing: [xSpacing, ySpacing, zSpacing],
            direction: direction,
          },
          () => {
            this.getMPRInfo(imageIds)
            this.getPreMPRInfo(preImageIds)
          }
        )
        resolve()
      })
    })
    await firstImageIdPromise

    // const lobeBorderPromise = new Promise((resolve, reject) => {}).then(() => {})

    // local test
    // const fileList = []
    // for (let i = 1; i <= 321; i++) {
    //   if (i < 10) {
    //     fileList.push('http://localhost:3000/dcms/ct/CTSeries1Perfusion_H_1001_CT00' + i + '.dcm')
    //   } else if (i < 100) {
    //     fileList.push('http://localhost:3000/dcms/ct/CTSeries1Perfusion_H_1001_CT0' + i + '.dcm')
    //   } else {
    //     fileList.push('http://localhost:3000/dcms/ct/CTSeries1Perfusion_H_1001_CT' + i + '.dcm')
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

    // const preFileList = []
    // for (let i = 0; i <= 320; i++) {
    //   if (i < 10) {
    //     preFileList.push('http://localhost:3000/dcms/ect/00000' + i + '.dcm')
    //   } else if (i < 100) {
    //     preFileList.push('http://localhost:3000/dcms/ect/0000' + i + '.dcm')
    //   } else {
    //     preFileList.push('http://localhost:3000/dcms/ect/000' + i + '.dcm')
    //   }
    // }

    // const preLocalImageIds = []
    // const preFilePromises = preFileList.map((file) => {
    //   return axios.get(file, { responseType: 'blob' }).then((res) => {
    //     const file = res.data
    //     const imageId = cornerstoneWADOImageLoader.wadouri.fileManager.add(file)
    //     preLocalImageIds.push(imageId)
    //   })
    // })

    // Promise.all(preFilePromises).then(() => {
    //   this.getPreMPRInfo(preLocalImageIds)
    // })
    axios
      .post(
        this.config.prefusion.getMhaListForCaseId,
        qs.stringify({
          caseId: '1.2.840.113619.2.55.3.2831217177.679.1591325357.602',
        })
      )
      .then((response) => {
        console.log('url', response)
        const urls = response.data
        if (urls && urls.length) {
          urls.forEach((url, urlIndex) => {
            this.downloadSegment(url, urlIndex)
          })
        }
      })
      .catch((e) => {
        console.log(e)
      })

    this.resizeScreen()
    window.addEventListener('resize', this.resizeScreen.bind(this))
  }
  componentWillUnmount() {
    if (document.getElementById('main')) {
      document.getElementById('main').setAttribute('style', '')
    }
    if (document.getElementById('footer')) {
      document.getElementById('footer').style.display = ''
    }
    window.removeEventListener('resize', this.resizeScreen.bind(this))
  }
  componentDidUpdate(prevProps, prevState) {
    if ((!prevState.preVolumesCreated && this.state.preVolumesCreated) || (!prevState.volumesCreated && this.state.volumesCreated)) {
      if (this.state.volumesCreated && this.state.preVolumesCreated) {
        setTimeout(() => {
          const fusVolumes = this.generateFusVolumes()
          console.log('fusVolumes created', fusVolumes)
          this.setState({
            fusVolumes: fusVolumes,
          })
        }, 500)
      }
    }
  }
  generateFusVolumes() {
    const { volumes, preVolumes, vtkOriImageData, vtkPreImageData, dimensions, preDimensions } = this.state
    const data = vtkOriImageData.getPointData().getScalars().getData()
    const prePointData = vtkPreImageData.getPointData().getScalars().getData()
    const pixelArray = new Float32Array(dimensions[0] * dimensions[1] * dimensions[1]).fill(0)
    // console.log('fus', data.length)
    // const oriRange = vtkOriImageData.getPointData().getScalars().getRange()
    // console.log('fus oriRange', oriRange)
    // const preRange = vtkPreImageData.getPointData().getScalars().getRange()
    // console.log('fus preRange', preRange)

    prePointData.forEach((value, index) => {
      pixelArray[index] = value
    })

    // prePointData.forEach((value, index) => {
    //   let temp = index
    //   const x = temp % preDimensions[0]
    //   temp = ~~(temp / preDimensions[0])
    //   const y = temp % preDimensions[1]
    //   temp = ~~(temp / preDimensions[1])
    //   const z = temp % preDimensions[2]
    //   const newX = ~~((x * dimensions[0]) / preDimensions[0])
    //   const newY = ~~((y * dimensions[1]) / preDimensions[1])
    //   const newZ = ~~((z * dimensions[2]) / preDimensions[2])
    //   // const newIndex = newX + newY * dimensions[0] + newZ * dimensions[0] * dimensions[1]
    //   // pixelArray[newIndex] = value

    //   // pixelArray[newIndex] = oriRange[1] + value

    //   for (let i = newZ - 4; i < newZ + 4; i++) {
    //     for (let j = newY - 4; j < newY + 4; j++) {
    //       for (let k = newX - 4; k < newX + 4; k++) {
    //         const nowIndex = k + j * dimensions[0] + i * dimensions[0] * dimensions[1]
    //         if (nowIndex >= 0 && nowIndex < data.length) {
    //           pixelArray[nowIndex] = value - 5 * (Math.abs(newX - k) + Math.abs(newY - j) + Math.abs(newZ - i))
    //         }
    //       }
    //     }
    //   }
    // })
    const imageData = vtkImageData.newInstance()
    const scalarArray = vtkDataArray.newInstance({
      name: 'fus',
      numberOfComponents: 1,
      values: pixelArray,
    })
    imageData.setDimensions(...dimensions)
    imageData.setSpacing(...vtkOriImageData.getSpacing())
    imageData.setOrigin(...vtkOriImageData.getOrigin())
    const direction = vtkOriImageData.getDirection()
    // direction[8] = -1
    imageData.setDirection(...direction)

    imageData.getPointData().setScalars(scalarArray)
    // const { actor, mapper } = this.createActorMapper(imageData)
    const mapper = vtkVolumeMapper.newInstance()
    mapper.setInputData(imageData)

    const actor = vtkVolume.newInstance()
    actor.setMapper(mapper)

    const range = imageData.getPointData().getScalars().getRange()
    // console.log('fus after', range)
    const rgbTransferFunction = actor.getProperty().getRGBTransferFunction(0)

    const voi = this.state.voi

    const low = voi.windowCenter - voi.windowWidth / 2
    const high = voi.windowCenter + voi.windowWidth / 2

    rgbTransferFunction.setMappingRange(low, high)

    const cfun = vtkColorTransferFunction.newInstance()
    cfun.addRGBPoint(0, 0.0, 0.0, 0.0)
    cfun.addRGBPoint(0 + 300, 0.0, 0.0, 0.0)
    cfun.addRGBPoint(0 + 301, 0.65, 0.13, 0.09)
    cfun.addRGBPoint(0 + 1500, 0.85, 0.33, 0.09)
    cfun.addRGBPoint(3000, 0.55, 0.33, 0.09)

    const ofun = vtkPiecewiseFunction.newInstance()
    ofun.addPoint(0.0, 0.0)
    ofun.addPoint(0 + 301, 0.95)
    ofun.addPoint(0 + 1500, 1.0)
    ofun.addPoint(3000, 0.95)

    actor.getProperty().setRGBTransferFunction(0, cfun)
    actor.getProperty().setScalarOpacity(0, ofun)

    const result = volumes.concat(actor)
    // console.log('fus', result)
    return result
  }
  generateLobeBorder(border) {
    const { volumes, vtkOriImageData, dimensions } = this.state
    const data = vtkOriImageData.getPointData().getScalars().getData()
    const pixelArray = new Float32Array(dimensions[0] * dimensions[1] * dimensions[1]).fill(0)
    // const oriRange = vtkOriImageData.getPointData().getScalars().getRange()
    // console.log('border oriRange', oriRange)

    for (let lobe in border) {
      if (border[lobe] && border[lobe].length) {
        border[lobe].forEach((point) => {
          let newZ = point[0]
          let newY = point[1]
          let newX = point[2]
          for (let i = newZ - 2; i < newZ + 2; i++) {
            for (let j = newY - 2; j < newY + 2; j++) {
              for (let k = newX - 2; k < newX + 2; k++) {
                const nowIndex = k + j * dimensions[0] + i * dimensions[0] * dimensions[1]
                if (nowIndex >= 0 && nowIndex < data.length) {
                  pixelArray[nowIndex] = Number(lobe[lobe.length - 1]) * 100
                }
              }
            }
          }
          // const nowIndex = newX + newY * dimensions[0] + newZ * dimensions[0] * dimensions[1]
          // pixelArray[nowIndex] = Number(lobe[lobe.length - 1]) * 100
        })
      }
    }

    const imageData = vtkImageData.newInstance()
    const scalarArray = vtkDataArray.newInstance({
      name: 'border',
      numberOfComponents: 1,
      values: pixelArray,
    })
    imageData.setDimensions(...dimensions)
    imageData.setSpacing(...vtkOriImageData.getSpacing())
    imageData.setOrigin(...vtkOriImageData.getOrigin())
    const direction = vtkOriImageData.getDirection()
    imageData.setDirection(...direction)
    // imageData.setSpacing(...spacing)
    // imageData.setOrigin(...origin)
    // imageData.setDirection(...direction)

    imageData.getPointData().setScalars(scalarArray)
    // const { actor, mapper } = this.createActorMapper(imageData)
    const mapper = vtkVolumeMapper.newInstance()
    mapper.setInputData(imageData)

    const actor = vtkVolume.newInstance()
    actor.setMapper(mapper)

    const range = imageData.getPointData().getScalars().getRange()
    const rgbTransferFunction = actor.getProperty().getRGBTransferFunction(0)

    const voi = this.state.voi

    const low = voi.windowCenter - voi.windowWidth / 2
    const high = voi.windowCenter + voi.windowWidth / 2

    rgbTransferFunction.setMappingRange(low, high)

    const cfun = vtkColorTransferFunction.newInstance()
    cfun.addRGBPoint(0, 0.0, 0.0, 0.0)
    cfun.addRGBPoint(100, 0.7, 0.6, 0.32)
    cfun.addRGBPoint(200, 0.26, 0.44, 0.26)
    cfun.addRGBPoint(300, 0.45, 0.24, 0.16)
    cfun.addRGBPoint(400, 0.19, 0.48, 0.58)
    cfun.addRGBPoint(500, 0.46, 0.59, 0.71)

    const ofun = vtkPiecewiseFunction.newInstance()
    ofun.addPoint(0, 0.0)
    ofun.addPoint(100, 1.0)
    ofun.addPoint(500, 1.0)

    actor.getProperty().setRGBTransferFunction(0, cfun)
    actor.getProperty().setScalarOpacity(0, ofun)

    // const result = volumes.concat(actor)
    return { actor, imageData }
  }
  getMPRInfo(imageIds) {
    // this.setState({
    //   imageIds: imageIds,
    // })
    console.log('before ct')
    const promises = imageIds.map((imageId) => {
      return cornerstone.loadAndCacheImage(imageId)
    })
    Promise.all(promises).then(() => {
      console.log('after')
      const displaySetInstanceUid = 'ct'

      const imageDataObject = getImageData(imageIds, displaySetInstanceUid)
      this.imageDataObject = imageDataObject

      loadImageData(imageDataObject)

      let actor
      ;({ actor } = this.createActorMapper(imageDataObject.vtkImageData))
      const onPixelDataInsertedCallback = (numberProcessed) => {
        // const percentComplete = Math.floor((numberProcessed * 100) / imageIds.length)
        // console.log(`Processing: ${percentComplete}%`)
        // this.state.bdImageData.modified()
      }
      const onAllPixelDataInsertedCallback = () => {
        this.setState({
          volumesCreated: true,
        })
      }
      imageDataObject.onPixelDataInserted(onPixelDataInsertedCallback)
      imageDataObject.onAllPixelDataInserted(onAllPixelDataInsertedCallback)
      // this.imageDataObject = imageDataObject
      this.setState(
        {
          vtkOriImageData: imageDataObject.vtkImageData,
          volumes: [actor],
        },
        () => {
          axios.get('http://192.168.7.198:8885/data/lobeCoord' + `?caseId=${this.state.caseId}`).then((res) => {
            const border = res.data
            const result = this.generateLobeBorder(border)
            // resolve(result)
            const { actor: bdVolumes, imageData: bdImageData } = result
            this.setState({
              bdVolumes: [bdVolumes],
              bdImageData,
            })
          })
        }
      )
    })
  }
  getPreMPRInfo(imageIds) {
    console.log('before ect')
    const promises = imageIds.map((imageId) => {
      return cornerstone.loadAndCacheImage(imageId)
    })
    Promise.all(promises).then(() => {
      console.log('after')
      const displaySetInstanceUid = 'ect'

      const imageDataObject = getImageData(imageIds, displaySetInstanceUid)
      this.preImageDataObject = imageDataObject

      loadImageData(imageDataObject)

      const onPixelDataInsertedCallback = (numberProcessed) => {
        // const percentComplete = Math.floor((numberProcessed * 100) / imageIds.length)
        // console.log(`Processing: ${percentComplete}%`)
        // this.state.bdImageData.modified()
      }
      const onAllPixelDataInsertedCallback = () => {
        // const range = imageDataObject.vtkImageData.getPointData().getScalars().getRange()
        // console.log('pre all inserted', range)
        this.setState({
          preVolumesCreated: true,
        })
      }
      imageDataObject.onPixelDataInserted(onPixelDataInsertedCallback)
      imageDataObject.onAllPixelDataInserted(onAllPixelDataInsertedCallback)

      let actor
      ;({ actor } = this.createPreActorMapper(imageDataObject.vtkImageData))

      // this.imageDataObject = imageDataObject
      this.setState({
        vtkPreImageData: imageDataObject.vtkImageData,
        preVolumes: [actor],
      })
    })
  }
  insertSlice(image, sliceIndex, type) {
    let imageData
    if (type === 'ct') {
      imageData = this.state.vtkImageData
    } else if (type === 'ect') {
      imageData = this.state.vtkPreImageData
    }
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
  createPreActorMapper(imageData) {
    const mapper = vtkVolumeMapper.newInstance()
    mapper.setInputData(imageData)

    const actor = vtkVolume.newInstance()
    actor.setMapper(mapper)

    const rgbTransferFunction = actor.getProperty().getRGBTransferFunction(0)

    const windowCenter = 254
    const windowWidth = 510

    const low = windowCenter - windowWidth / 2
    const high = windowCenter + windowWidth / 2

    rgbTransferFunction.setMappingRange(low, high)
    // console.log('ect', range)
    // const range = imageData.getPointData().getScalars().getRange()

    const cfun = vtkColorTransferFunction.newInstance()
    cfun.addRGBPoint(0, 0.0, 0.0, 0.0)
    cfun.addRGBPoint(0 + 300, 0.0, 0.0, 0.0)
    // cfun.addRGBPoint(0 + 301, 0.7, 0.4, 0.2)
    // cfun.addRGBPoint(0 + 301, 0.17, 0.25, 0.52)
    cfun.addRGBPoint(0 + 301, 0.65, 0.13, 0.09)
    cfun.addRGBPoint(0 + 1500, 0.85, 0.33, 0.09)
    cfun.addRGBPoint(3000, 0.55, 0.33, 0.09)

    const ofun = vtkPiecewiseFunction.newInstance()
    ofun.addPoint(0.0, 0.0)
    ofun.addPoint(0 + 301, 0.95)
    ofun.addPoint(0 + 1500, 1.0)
    ofun.addPoint(3000, 0.95)

    actor.getProperty().setRGBTransferFunction(0, cfun)
    actor.getProperty().setScalarOpacity(0, ofun)

    return {
      actor,
      mapper,
    }
  }
  createPipeline(binary, color, opacity) {
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
  downloadSegment(url, i) {
    const caseId = this.state.caseId
    HttpDataAccessHelper.fetchBinary(url + `?caseId=${caseId}`).then((binary) => {
      let opacity = 1.0
      let dictIndex = Number(url[url.length - 5])
      let actor
      actor = this.createPipeline(binary, dictList[dictIndex].color, opacity)
      const tmp_segments = [].concat(this.state.segments)
      tmp_segments[i] = actor
      this.setState(
        {
          segments: tmp_segments,
        },
        () => {
          if (this.viewer3D) {
            this.viewer3D.setNeedReset()
          }
        }
      )
    })
  }
  storeApi = (viewportIndex, orientation) => {
    return (api) => {
      this.apis[viewportIndex] = api
      const apis = this.apis

      const renderWindow = api.genericRenderWindow.getRenderWindow()

      api.addSVGWidget(vtkSVGRotatableCrosshairsWidget.newInstance(), 'rotatableCrosshairsWidget')

      const istyle = renderWindow.getInteractor().getInteractorStyle()

      const { slicePlaneNormal, sliceViewUp } = ORIENTATION[orientation]

      istyle.setSliceOrientation(slicePlaneNormal, sliceViewUp)
      const onPixelDataInsertedCallback = () => {
        renderWindow.render()
      }
      this.imageDataObject.onPixelDataInserted(onPixelDataInsertedCallback)
      api.setInteractorStyle({
        istyle,
        configuration: {
          apis: this.apis,
          apiIndex: viewportIndex,
        },
      })

      if (apis[0] && apis[1] && apis[2]) {
        apis.forEach((api, index) => {
          api.svgWidgets.rotatableCrosshairsWidget.setApiIndex(index)
          api.svgWidgets.rotatableCrosshairsWidget.setApis(apis)
        })

        const api = apis[0]

        api.svgWidgets.rotatableCrosshairsWidget.resetCrosshairs(apis, 0)

        this.toggleCrosshairs(false)
        this.toggleTool(false)
      }
      renderWindow.render()
    }
  }
  toggleCrosshairs(displayCrosshairs) {
    this.toggleTool(displayCrosshairs)
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
  storePreApi = (viewportIndex, orientation) => {
    return (api) => {
      this.preApis[viewportIndex] = api
      const apis = this.preApis

      const renderWindow = api.genericRenderWindow.getRenderWindow()

      api.addSVGWidget(vtkSVGRotatableCrosshairsWidget.newInstance(), 'rotatableCrosshairsWidget')

      const istyle = renderWindow.getInteractor().getInteractorStyle()

      const { slicePlaneNormal, sliceViewUp } = ORIENTATION[orientation]

      istyle.setSliceOrientation(slicePlaneNormal, sliceViewUp)
      api.setInteractorStyle({
        istyle,
        configuration: {
          apis: this.preApis,
          apiIndex: viewportIndex,
        },
      })

      if (apis[0] && apis[1] && apis[2]) {
        apis.forEach((api, index) => {
          api.svgWidgets.rotatableCrosshairsWidget.setApiIndex(index)
          api.svgWidgets.rotatableCrosshairsWidget.setApis(apis)
        })

        const api = apis[0]

        api.svgWidgets.rotatableCrosshairsWidget.resetCrosshairs(apis, 0)

        this.togglePreCrosshairs(false)
        this.togglePreTool(false)
      }
      renderWindow.render()
    }
  }
  togglePreCrosshairs(displayCrosshairs) {
    this.togglePreTool(displayCrosshairs)
    const apis = this.preApis

    apis.forEach((api) => {
      const { svgWidgetManager, svgWidgets } = api
      svgWidgets.rotatableCrosshairsWidget.setDisplay(displayCrosshairs)

      svgWidgetManager.render()
    })

    this.setState({ preDisplayCrosshairs: displayCrosshairs })
  }
  togglePreTool(crosshairsTool) {
    const apis = this.preApis

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

    this.setState({ preCrosshairsTool: crosshairsTool })
  }

  storeFusApi = (viewportIndex, orientation) => {
    return (api) => {
      this.fusApis[viewportIndex] = api
      const apis = this.fusApis

      const renderWindow = api.genericRenderWindow.getRenderWindow()

      api.addSVGWidget(vtkSVGRotatableCrosshairsWidget.newInstance(), 'rotatableCrosshairsWidget')

      const istyle = renderWindow.getInteractor().getInteractorStyle()

      const { slicePlaneNormal, sliceViewUp } = ORIENTATION[orientation]

      istyle.setSliceOrientation(slicePlaneNormal, sliceViewUp)
      api.setInteractorStyle({
        istyle,
        configuration: {
          apis: this.fusApis,
          apiIndex: viewportIndex,
        },
      })

      if (apis[0] && apis[1] && apis[2]) {
        apis.forEach((api, index) => {
          api.svgWidgets.rotatableCrosshairsWidget.setApiIndex(index)
          api.svgWidgets.rotatableCrosshairsWidget.setApis(apis)
        })

        const api = apis[0]

        api.svgWidgets.rotatableCrosshairsWidget.resetCrosshairs(apis, 0)

        this.toggleFusCrosshairs(false)
        this.toggleFusTool(false)
      }
      renderWindow.render()
    }
  }
  toggleFusCrosshairs(displayCrosshairs) {
    this.toggleFusTool(displayCrosshairs)
    const apis = this.fusApis

    apis.forEach((api) => {
      const { svgWidgetManager, svgWidgets } = api
      svgWidgets.rotatableCrosshairsWidget.setDisplay(displayCrosshairs)

      svgWidgetManager.render()
    })

    this.setState({ fusDisplayCrosshairs: displayCrosshairs })
  }
  toggleFusTool(crosshairsTool) {
    const apis = this.fusApis

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

    this.setState({ fusCrosshairsTool: crosshairsTool })
  }
  resizeScreen() {
    const verticalMode = document.body.clientWidth < document.body.clientHeight ? true : false
    this.setState({
      windowWidth: document.body.clientWidth,
      windowHeight: document.body.clientHeight,
      verticalMode,
    })
    if (document.getElementById('corner-top-row')) {
      const cornerTopRow = document.getElementById('corner-top-row')
      const cornerTopRowHeight = cornerTopRow.clientHeight
      const cornerBottomRowHeight = document.body.clientHeight - cornerTopRowHeight - 5
      this.setState(
        {
          bottomRowHeight: cornerBottomRowHeight,
        },
        () => {
          if (document.getElementById('corner-prefusion-container')) {
            const cornerPrefusionContainer = document.getElementById('corner-prefusion-container')
            const cornerPrefusionContainerWidth = cornerPrefusionContainer.clientWidth
            const cornerPrefusionContainerHeight = cornerPrefusionContainer.clientHeight
            // console.log('resize3DView', segmentContainerWidth, segmentContainerHeight)
            this.resizeViewer(cornerPrefusionContainerWidth - 4, cornerPrefusionContainerHeight - 4)
          }
          if (document.getElementById('corner-info-visualization')) {
            const cornerInfoVisualization = document.getElementById('corner-info-visualization')
            const cornerInfoVisualizationWidth = cornerInfoVisualization.clientWidth
            const cornerInfoVisualizationHeight = cornerInfoVisualization.clientHeight
            // console.log('resize3DView', segmentContainerWidth, segmentContainerHeight)
            this.setState(
              {
                segmentationWidth: cornerInfoVisualizationWidth,
                segmentationHeight: cornerInfoVisualizationHeight,
              },
              () => {
                if (this.viewer3D) {
                  this.viewer3D.setContainerSize(cornerInfoVisualizationWidth, cornerInfoVisualizationHeight)
                }
              }
            )
          }
        }
      )
    }
  }
  resizeViewer(viewerWidth, viewerHeight) {
    this.setState({
      viewerWidth,
      viewerHeight,
    })
  }
  toHomepage() {
    window.location.href = '/homepage'
    // this.nextPath('/homepage/' + params.caseId + '/' + res.data)
  }
  clearLocalStorage() {
    localStorage.clear()
    message.success('清空成功')
    setTimeout(() => {
      window.location.reload()
    }, 2000)
  }
  handleLogout() {
    const token = localStorage.getItem('token')
    const headers = {
      Authorization: 'Bearer '.concat(token),
    }
    Promise.all([axios.get(this.config.user.signoutUser, { headers }), axios.get(process.env.PUBLIC_URL + '/config.json')])
      .then(([signoutRes, configs]) => {
        if (signoutRes.data.status === 'okay') {
          this.setState({ isLoggedIn: false })
          localStorage.clear()
          sessionStorage.clear()
          const config = configs.data
          console.log('config', config)
          localStorage.setItem('config', JSON.stringify(config))
          window.location.href = '/'
        } else {
          message.error('出现内部错误，请联系管理员')
          window.location.href = '/'
        }
      })
      .catch((error) => {
        console.log('error')
      })
  }
  render() {
    const {
      segments,
      bdVolumes,
      volumes,
      preVolumes,
      fusVolumes,
      bottomRowHeight,
      realname,
      viewerWidth,
      viewerHeight,
      segmentationWidth,
      segmentationHeight,
      displayCrosshairs,
      preDisplayCrosshairs,
      fusDisplayCrosshairs,
    } = this.state
    const smallHeight = viewerHeight * 0.33
    const smallWidth = viewerWidth * 0.33
    const bigHeight = viewerHeight * 0.34
    const bigWidth = viewerWidth * 0.34
    const oneoneStyle = {
      width: smallWidth,
      height: smallHeight,
    }
    const onetwoStyle = {
      width: smallWidth,
      height: smallHeight,
    }
    const onethreeStyle = {
      width: bigWidth,
      height: smallHeight,
    }
    const twooneStyle = {
      width: smallWidth,
      height: smallHeight,
    }
    const twotwoStyle = {
      width: smallWidth,
      height: smallHeight,
    }
    const twothreeStyle = {
      width: bigWidth,
      height: smallHeight,
    }
    const threeoneStyle = {
      width: smallWidth,
      height: bigHeight,
    }
    const threetwoStyle = {
      width: smallWidth,
      height: bigHeight,
    }
    const threethreeStyle = {
      width: bigWidth,
      height: bigHeight,
    }

    const rulColor = {
      backgroundColor: 'rgb(181, 154, 82)',
    }
    const rmlColor = {
      backgroundColor: 'rgb(68, 114, 68)',
    }
    const rllColor = {
      backgroundColor: 'rgb(117, 62, 42)',
    }
    const lulColor = {
      backgroundColor: 'rgb(50, 124, 150)',
    }
    const lllColor = {
      backgroundColor: 'rgb(118, 152, 182)',
    }

    return (
      <div id="corner-container">
        <div id="corner-top-row">
          <div id="menu-item-logo">
            {/* <Image src={src1} avatar size="mini" /> */}
            <a id="sys-name" href="/searchCase">
              肺部CT影像辅助检测软件
            </a>
          </div>
          <div id="menu-item-buttons">
            <div className="func-btn" hidden={!displayCrosshairs} onClick={this.toggleCrosshairs.bind(this, false)} description="hidden crosshairs">
              <Icon className="func-btn-icon icon-custom icon-custom-HC" size="large" />
              <div className="func-btn-desc"> 隐藏CT十字线</div>
            </div>
            <div className="func-btn" hidden={displayCrosshairs} onClick={this.toggleCrosshairs.bind(this, true)} description="show crosshairs">
              <Icon className="func-btn-icon icon-custom icon-custom-SC" size="large" />
              <div className="func-btn-desc"> 显示CT十字线</div>
            </div>
            <div className="func-btn" hidden={!preDisplayCrosshairs} onClick={this.togglePreCrosshairs.bind(this, false)} description="hidden crosshairs">
              <Icon className="func-btn-icon icon-custom icon-custom-HC" size="large" />
              <div className="func-btn-desc"> 隐藏灌注十字线</div>
            </div>
            <div className="func-btn" hidden={preDisplayCrosshairs} onClick={this.togglePreCrosshairs.bind(this, true)} description="show crosshairs">
              <Icon className="func-btn-icon icon-custom icon-custom-SC" size="large" />
              <div className="func-btn-desc"> 显示灌注十字线</div>
            </div>
            <div className="func-btn" hidden={!fusDisplayCrosshairs} onClick={this.toggleFusCrosshairs.bind(this, false)} description="hidden crosshairs">
              <Icon className="func-btn-icon icon-custom icon-custom-HC" size="large" />
              <div className="func-btn-desc"> 隐藏融合十字线</div>
            </div>
            <div className="func-btn" hidden={fusDisplayCrosshairs} onClick={this.toggleFusCrosshairs.bind(this, true)} description="show crosshairs">
              <Icon className="func-btn-icon icon-custom icon-custom-SC" size="large" />
              <div className="func-btn-desc"> 显示融合十字线</div>
            </div>
            <span className="menu-line"></span>
          </div>
          <div id="menu-item-user">
            <Dropdown text={`欢迎您，${realname}`}>
              <Dropdown.Menu id="logout-menu">
                <Dropdown.Item icon="home" text="我的主页" onClick={this.toHomepage.bind(this)} />
                {/* <Dropdown.Item
                    icon="write"
                    text="留言"
                    onClick={this.handleWriting}
                  /> */}

                <Dropdown.Item icon="trash alternate" text="清空缓存" onClick={this.clearLocalStorage.bind(this)} />
                <Dropdown.Item icon="log out" text="注销" onClick={this.handleLogout.bind(this)} />
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>
        <div id="corner-bottom-row" style={{ height: bottomRowHeight }}>
          <div id="corner-prefusion-container">
            <div className="corner-prefusion-row">
              {volumes ? (
                <>
                  <View2D
                    viewerStyle={oneoneStyle}
                    parallelScale={512 / 2}
                    volumes={volumes}
                    bdVolumes={bdVolumes}
                    onCreated={this.storeApi(0, 'AXIAL')}
                    onRef={(input) => {
                      // this.viewer = input
                    }}
                  />
                  <View2D
                    viewerStyle={onetwoStyle}
                    parallelScale={512 / 2}
                    volumes={volumes}
                    bdVolumes={bdVolumes}
                    onCreated={this.storeApi(1, 'CORONAL')}
                    onRef={(input) => {
                      // this.viewer = input
                    }}
                  />
                  <View2D
                    viewerStyle={onethreeStyle}
                    parallelScale={512 / 2}
                    volumes={volumes}
                    bdVolumes={bdVolumes}
                    onCreated={this.storeApi(2, 'SAGITTAL')}
                    onRef={(input) => {
                      // this.viewer = input
                    }}
                  />
                </>
              ) : (
                <LoadingComponent />
              )}
            </div>
            <div className="corner-prefusion-row">
              {preVolumes && preVolumes.length ? (
                <>
                  <View2D
                    viewerStyle={twooneStyle}
                    // parallelScale={16}
                    parallelScale={(512 * 3) / 2 / 4}
                    volumes={preVolumes}
                    bdVolumes={bdVolumes}
                    // lobeActors={segments}
                    onCreated={this.storePreApi(0, 'AXIAL')}
                    onRef={(input) => {
                      // this.viewer = input
                    }}
                  />
                  <View2D
                    viewerStyle={twotwoStyle}
                    // parallelScale={16}
                    parallelScale={(512 * 3) / 2 / 4}
                    volumes={preVolumes}
                    bdVolumes={bdVolumes}
                    // lobeActors={segments}
                    onCreated={this.storePreApi(1, 'CORONAL')}
                    onRef={(input) => {
                      // this.viewer = input
                    }}
                  />
                  <View2D
                    viewerStyle={twothreeStyle}
                    // parallelScale={16}
                    parallelScale={(512 * 3) / 2 / 4}
                    volumes={preVolumes}
                    bdVolumes={bdVolumes}
                    // lobeActors={segments}
                    onCreated={this.storePreApi(2, 'SAGITTAL')}
                    onRef={(input) => {
                      // this.viewer = input
                    }}
                  />
                </>
              ) : (
                <LoadingComponent />
              )}
            </div>
            <div className="corner-prefusion-row">
              {fusVolumes && fusVolumes.length ? (
                <>
                  <View2D
                    viewerStyle={threeoneStyle}
                    parallelScale={512 / 2}
                    volumes={fusVolumes}
                    bdVolumes={bdVolumes}
                    onCreated={this.storeFusApi(0, 'AXIAL')}
                    onRef={(input) => {
                      // this.viewer = input
                    }}
                  />
                  <View2D
                    viewerStyle={threetwoStyle}
                    parallelScale={512 / 2}
                    volumes={fusVolumes}
                    bdVolumes={bdVolumes}
                    onCreated={this.storeFusApi(1, 'CORONAL')}
                    onRef={(input) => {
                      // this.viewer = input
                    }}
                  />
                  <View2D
                    viewerStyle={threethreeStyle}
                    parallelScale={512 / 2}
                    volumes={fusVolumes}
                    bdVolumes={bdVolumes}
                    onCreated={this.storeFusApi(2, 'SAGITTAL')}
                    onRef={(input) => {
                      // this.viewer = input
                    }}
                  />
                </>
              ) : (
                <LoadingComponent />
              )}
            </div>
          </div>
          <div id="corner-info-container">
            <div id="corner-info-visualization">
              <VTK3DViewer
                viewerStyle={{
                  width: segmentationWidth,
                  height: segmentationHeight,
                }}
                actors={[].concat(segments)}
                onRef={(input) => {
                  this.viewer3D = input
                }}></VTK3DViewer>
            </div>
            <div id="corner-info-table">
              <div className="corner-info-table-first-title">
                <div className="corner-info-table-first-hidden"></div>
                <div className="corner-info-table-first-right">右肺</div>
                <div className="corner-info-table-first-left">左肺</div>
              </div>
              <div className="corner-info-table-second-title">
                <div className="corner-info-table-second-hidden corner-info-table-second-hidden-second"></div>
                <div className="corner-info-table-second-text" style={rulColor}>
                  右肺上叶
                </div>
                <div className="corner-info-table-second-text" style={rmlColor}>
                  右肺中叶
                </div>
                <div className="corner-info-table-second-text" style={rllColor}>
                  右肺下叶
                </div>
                <div className="corner-info-table-second-total corner-info-table-second-total-first">右肺整体</div>

                <div className="corner-info-table-second-text" style={lulColor}>
                  左肺上叶
                </div>
                <div className="corner-info-table-second-text" style={lllColor}>
                  左肺下叶
                </div>
                <div className="corner-info-table-second-total">左肺整体</div>
              </div>
              <div className="corner-info-table-content">
                <div className="corner-info-table-content-title">数量</div>
                <div className="corner-info-table-content-text" style={rulColor}>
                  <div className="corner-info-table-content-text-top">30%</div>
                  <div className="corner-info-table-content-text-bot">293</div>
                </div>
                <div className="corner-info-table-content-text" style={rmlColor}>
                  <div className="corner-info-table-content-text-top">12%</div>
                  <div className="corner-info-table-content-text-bot">114</div>
                </div>
                <div className="corner-info-table-content-text" style={rllColor}>
                  <div className="corner-info-table-content-text-top">15%</div>
                  <div className="corner-info-table-content-text-bot">151</div>
                </div>
                <div className="corner-info-table-content-total">
                  <div className="corner-info-table-content-text-top">56%</div>
                  <div className="corner-info-table-content-text-bot">558</div>
                </div>
                <div className="corner-info-table-content-text" style={lulColor}>
                  <div className="corner-info-table-content-text-top">33%</div>
                  <div className="corner-info-table-content-text-bot">330</div>
                </div>
                <div className="corner-info-table-content-text" style={lllColor}>
                  <div className="corner-info-table-content-text-top">10%</div>
                  <div className="corner-info-table-content-text-bot">99</div>
                </div>
                <div className="corner-info-table-content-total corner-info-table-content-total-second">
                  <div className="corner-info-table-content-text-top">44%</div>
                  <div className="corner-info-table-content-text-bot">430</div>
                </div>
              </div>
              <div className="corner-info-table-content">
                <div className="corner-info-table-content-title">体积(ml)</div>
                <div className="corner-info-table-content-text" style={rulColor}>
                  <div className="corner-info-table-content-text-top">29%</div>
                  <div className="corner-info-table-content-text-bot">1318</div>
                </div>
                <div className="corner-info-table-content-text" style={rmlColor}>
                  <div className="corner-info-table-content-text-top">11%</div>
                  <div className="corner-info-table-content-text-bot">481</div>
                </div>
                <div className="corner-info-table-content-text" style={rllColor}>
                  <div className="corner-info-table-content-text-top">17%</div>
                  <div className="corner-info-table-content-text-bot">769</div>
                </div>
                <div className="corner-info-table-content-total">
                  <div className="corner-info-table-content-text-top">57%</div>
                  <div className="corner-info-table-content-text-bot">2568</div>
                </div>
                <div className="corner-info-table-content-text" style={lulColor}>
                  <div className="corner-info-table-content-text-top">31%</div>
                  <div className="corner-info-table-content-text-bot">1423</div>
                </div>
                <div className="corner-info-table-content-text" style={lllColor}>
                  <div className="corner-info-table-content-text-top">12%</div>
                  <div className="corner-info-table-content-text-bot">548</div>
                </div>
                <div className="corner-info-table-content-total corner-info-table-content-total-second">
                  <div className="corner-info-table-content-text-top">43%</div>
                  <div className="corner-info-table-content-text-bot">1970</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
