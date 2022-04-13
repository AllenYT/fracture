import React, { Component } from 'react'
import cornerstone from 'cornerstone-core'
import cornerstoneTools from 'cornerstone-tools'
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader'
import { vec3, vec4, mat4 } from 'gl-matrix'

import qs from 'qs'
import axios from 'axios'
import CornerstoneViewport from 'react-cornerstone-viewport'

import { frenet } from '../lib/frenet'
import { loadAndCacheImagePlus } from '../lib/cornerstoneImageRequest'
import { executeTask } from '../lib/taskHelper'
import { createSub } from '../vtk/lib/createSub.js'

import View2D from '../vtk/VTKViewport/View2D'
import getImageData from '../vtk/lib/getImageData'
import loadImageData from '../vtk/lib/loadImageData'
import vtkSVGRotatableCrosshairsWidget from '../vtk/VTKViewport/vtkSVGRotatableCrosshairsWidget'
import vtkInteractorStyleRotatableMPRCrosshairs from '../vtk/VTKViewport/vtkInteractorStyleRotatableMPRCrosshairs'
import vtkInteractorStyleMPRWindowLevel from '../vtk/VTKViewport/vtkInteractorStyleMPRWindowLevel'
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

import '../initCornerstone.js'
import '../css/test.css'

cornerstoneWADOImageLoader.external.cornerstone = cornerstone
window.cornerstoneTools = cornerstoneTools
const { EVENTS } = cornerstoneTools
const segmentationModule = cornerstoneTools.getModule('segmentation')

class Test extends Component {
  constructor(props) {
    super(props)
    this.state = {
      voi: { windowWidth: 1600, windowCenter: -600 },
      imageIds: null,
      vtkImageData: null,
      bdImageData: null,
      labelMapInputData: null,
      volumes: null,
      bdVolumes: null,

      cornerstoneViewportData: null,
      painting: true,
      cornerViewport: {
        scale: 1,
        invert: false,
        pixelReplication: false,
        voi: {
          windowWidth: 1600,
          windowCenter: -600,
        },
        translation: {
          x: 0,
          y: 0,
        },
      },
    }
    this.config = JSON.parse(localStorage.getItem('config'))
    this.subs = {
      cornerImageRendered: createSub(),
      cornerMouseUp: createSub(),
      cornerMouseMove: createSub(),
      cornerMouseDrag: createSub(),
      cornerMeasureAdd: createSub(),
      cornerMeasureModify: createSub(),
      cornerMeasureComplete: createSub(),
      cornerMeasureRemove: createSub(),
      cornerstonetoolstouchdragend: createSub(),
    }
  }
  async componentDidMount() {
    if (document.getElementById('footer')) {
      document.getElementById('footer').style.display = 'none'
    }
    this.apis = []
    this.cornerstoneElements = {}
    const imageIdsPromise = new Promise((resolve, reject) => {
      axios
        .post(
          this.config.data.getDataListForCaseId,
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
    const imageIds = await imageIdsPromise

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
            imageIds: imageIds,
            origin: origin,
            dimensions: [xVoxels, yVoxels, zVoxels],
            spacing: [xSpacing, ySpacing, zSpacing],
            direction: direction,
          },
          () => {
            this.getMPRInfo(imageIds)
          }
        )
        resolve()
      })
    })
    await firstImageIdPromise
    // console.log(imageIds)
    // this.getMPRInfo(imageIds)
  }
  componentWillUnmount() {
    if (document.getElementById('footer')) {
      document.getElementById('footer').style.display = ''
    }
    Object.keys(this.subs).forEach((k) => {
      this.subs[k].unsubscribe()
    })
  }
  getMPRInfo(imageIds) {
    // Create buffer the size of the 3D volume
    const dimensions = this.state.dimensions
    const width = dimensions[0]
    const height = dimensions[1]
    const depth = dimensions[2]
    const numVolumePixels = width * height * depth

    // If you want to load a segmentation labelmap, you would want to load
    // it into this array at this point.
    const threeDimensionalPixelData = new Float32Array(numVolumePixels)

    const buffer = threeDimensionalPixelData.buffer
    const numberOfFrames = imageIds.length

    if (numberOfFrames !== depth) {
      throw new Error('Depth should match the number of imageIds')
    }

    // Use Float32Arrays in cornerstoneTools for interoperability.
    segmentationModule.configuration.arrayType = 1

    segmentationModule.setters.labelmap3DByFirstImageId(imageIds[0], buffer, 0, [], numberOfFrames, undefined, 0)

    const promises = imageIds.map((imageId) => {
      return cornerstone.loadAndCacheImage(imageId)
    })
    Promise.all(promises).then(() => {
      const displaySetInstanceUid = 'ct'
      const cornerstoneViewportData = {
        stack: {
          imageIds,
          currentImageIdIndex: 0,
        },
        displaySetInstanceUid,
      }

      const imageDataObject = getImageData(imageIds, displaySetInstanceUid)
      // const labelMapInputData = this.setupSyncedBrush(imageDataObject)
      this.onMeasurementsChanged = (event) => {
        if (event.type !== EVENTS.LABELMAP_MODIFIED) {
          return
        }

        // labelMapInputData.modified()

        this.rerenderAllVTKViewports()
      }
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
      this.setState(
        {
          vtkImageData: imageDataObject.vtkImageData,
          volumes: [actor],
          cornerstoneViewportData,
          // labelMapInputData,
          // colorLUT: segmentationModule.getters.colorLUT(0),
          // globalOpacity: segmentationModule.configuration.fillAlpha,
          // outlineThickness: segmentationModule.configuration.outlineThickness,
        },
        () => {
          axios.get('http://192.168.7.198:8885/data/lobeCoord' + `?caseId=1.2.840.113619.2.55.3.2831217177.679.1591325357.602`).then((res) => {
            const border = res.data
            const result = this.generateLobeBorder(border, threeDimensionalPixelData)
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
  generateLobeBorder(border, threeDimensionalPixelData) {
    const { vtkImageData: vtkOriImageData, dimensions, imageIds } = this.state
    const data = vtkOriImageData.getPointData().getScalars().getData()
    // const pixelArray = new Float32Array(dimensions[0] * dimensions[1] * dimensions[1]).fill(0)
    const pixelArray = threeDimensionalPixelData
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
    // const element = this.cornerstoneElements[0]
    // cornerstone.updateImage(element)

    return { actor, imageData }
  }
  rerenderAllVTKViewports = () => {
    // TODO: Find out why this is not quick to update either
    Object.keys(this.apis).forEach((viewportIndex) => {
      const renderWindow = this.apis[viewportIndex].genericRenderWindow.getRenderWindow()

      renderWindow.render()
    })
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
  saveApiReference = (api) => {
    this.apis = [api]
    const voi = this.state.voi
    const apis = this.apis
    api.updateVOI(voi.windowWidth, voi.windowCenter)

    const renderWindow = api.genericRenderWindow.getRenderWindow()
    const istyle = renderWindow.getInteractor().getInteractorStyle()

    // const istyle = vtkInteractorStyleMPRWindowLevel.newInstance()

    // add istyle
    api.setInteractorStyle({
      istyle,
      configuration: {
        apis: this.apis,
        apiIndex: 0,
      },
    })
    const paintFilter = api.filters[0]

    paintFilter.setRadius(10)
  }
  saveCornerstoneElements = (viewportIndex) => {
    return (event) => {
      this.cornerstoneElements[viewportIndex] = event.detail.element
      const cornerElement = event.detail.element
      this.subs.cornerImageRendered.sub(
        cornerElement.addEventListener('cornerstoneimagerendered', (imageRenderedEvent) => {
          const viewport = imageRenderedEvent.detail.viewport
          const newViewport = Object.assign({}, viewport, this.state.cornerViewport)
          cornerstone.setViewport(cornerElement, newViewport)

          const enabledElement = cornerstone.getEnabledElement(cornerElement)
          const { getters, setters } = cornerstoneTools.getModule('segmentation')
          const labelmap3D = getters.labelmap3D(cornerElement)
          const stackState = cornerstoneTools.getToolState(cornerElement, 'stack')
          const { rows, columns } = enabledElement.image
          if (!stackState || !labelmap3D) {
            return
          }
          const stackData = stackState.data[0]
          const currentImageIdIndex = stackData.currentImageIdIndex
          const segmentIndex = labelmap3D.activeSegmentIndex
          let labelmap2D = labelmap3D.labelmaps2D[currentImageIdIndex]
          if (labelmap2D && labelmap2D.segmentsOnLabelmap.includes(segmentIndex)) {
            return
          }
          if (labelmap2D) {
            labelmap2D.segmentsOnLabelmap.push(segmentIndex)
          } else {
            labelmap2D = getters.labelmap2DByImageIdIndex(labelmap3D, currentImageIdIndex, rows, columns)
          }
          // cornerstone.updateImage(cornerElement)
        })
      )
      this.subs.cornerMeasureAdd.sub(
        cornerElement.addEventListener('cornerstonetoolsmeasurementadded', (e) => {
          console.log('cornerstonetoolsmeasurementadded', e)
        })
      )
      this.subs.cornerMeasureModify.sub(
        cornerElement.addEventListener('cornersontetoolslabelmapmodified', (e) => {
          console.log('cornersontetoolslabelmapmodified', e)
          this.onMeasurementsChanged(e)
        })
      )
      this.subs.cornerMeasureComplete.sub(
        cornerElement.addEventListener('cornerstonetoolsmeasurementcompleted', (e) => {
          console.log('cornerstonetoolsmeasurementcompleted', e)
        })
      )
    }
  }
  onPaintEnd = (strokeBuffer) => {
    const element = this.cornerstoneElements[0]
    const enabledElement = cornerstone.getEnabledElement(element)
    const { getters, setters } = cornerstoneTools.getModule('segmentation')
    const labelmap3D = getters.labelmap3D(element)
    const stackState = cornerstoneTools.getToolState(element, 'stack')
    const { rows, columns } = enabledElement.image

    if (!stackState || !labelmap3D) {
      return
    }

    const stackData = stackState.data[0]
    const numberOfFrames = stackData.imageIds.length
    const segmentIndex = labelmap3D.activeSegmentIndex

    for (let i = 0; i < numberOfFrames; i++) {
      let labelmap2D = labelmap3D.labelmaps2D[i]

      if (labelmap2D && labelmap2D.segmentsOnLabelmap.includes(segmentIndex)) {
        continue
      }

      const frameLength = rows * columns
      const byteOffset = frameLength * i
      const strokeArray = new Uint8Array(strokeBuffer, byteOffset, frameLength)

      const strokeOnFrame = strokeArray.some((element) => element === 1)

      if (!strokeOnFrame) {
        continue
      }

      if (labelmap2D) {
        labelmap2D.segmentsOnLabelmap.push(segmentIndex)
      } else {
        labelmap2D = getters.labelmap2DByImageIdIndex(labelmap3D, i, rows, columns)
      }
    }

    cornerstone.updateImage(element)
  }
  clickButton() {
    this.setState({
      focusedWidgetId: 'PaintWidget',
    })
  }
  render() {
    const { volumes, bdVolumes, vtkImageData, labelMapInputData, painting, globalOpacity, colorLUT, outlineThickness, imageIds, focusedWidgetId } = this.state
    return (
      <div className="test-container">
        <div className="test-title">
          <button onClick={this.clickButton.bind(this)}> hello</button>
        </div>
        <div className="test-content">
          <div className="test-left-block">
            {volumes && (
              <View2D
                volumes={volumes}
                bdVolumes={bdVolumes}
                // paintFilterBackgroundImageData={vtkImageData}
                // paintFilterLabelMapImageData={labelMapInputData}
                // painting={focusedWidgetId === 'PaintWidget'}
                // onPaintEnd={this.onPaintEnd}
                orientation={{ sliceNormal: [0, 0, 1], viewUp: [0, -1, 0] }}
                onCreated={this.saveApiReference}
                // labelmapRenderingOptions={{
                //   colorLUT,
                //   globalOpacity,
                //   outlineThickness,
                //   segmentsDefaultProperties: [],
                //   visible: true,
                //   renderOutline: true,
                // }}
                onRef={(input) => {
                  // this.viewer = input
                }}
              />
            )}
          </div>
          <div className="test-right-block">
            {this.state.cornerstoneViewportData && (
              <CornerstoneViewport
                activeTool={'Brush'}
                imageIds={imageIds}
                imageIdIndex={0}
                tools={[
                  { name: 'Brush', mode: 'active', mouseButtonMask: 1 },
                  {
                    name: 'StackScroll',
                    mode: 'active',
                    mouseButtonMask: 1,
                  },
                  {
                    name: 'StackScrollMouseWheel',
                    mode: 'active',
                  },
                ]}
                // viewportData={this.state.cornerstoneViewportData}
                // onMeasurementsChanged={this.onMeasurementsChanged}
                onElementEnabled={this.saveCornerstoneElements(0)}
              />
            )}
          </div>
        </div>
      </div>
    )
  }
}

export default Test
