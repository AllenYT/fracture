import React, { Component } from 'react'
import cornerstone from 'cornerstone-core'
import cornerstoneTools from 'cornerstone-tools'
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader'
import { vec3, vec4, mat4 } from 'gl-matrix'

import axios from 'axios'
import qs from 'qs'
import vtkGenericRenderWindow from 'vtk.js/Sources/Rendering/Misc/GenericRenderWindow'
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor'
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper'
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction'
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction'
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray'
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData'
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume'
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper'
import HttpDataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper'

import View2D from '../vtk/VTKViewport/View2D'
import getImageData from '../vtk/lib/getImageData'
import loadImageData from '../vtk/lib/loadImageData'

import '../initCornerstone.js'

cornerstoneWADOImageLoader.external.cornerstone = cornerstone
window.cornerstoneTools = cornerstoneTools

const ORIENTATION = {
  AXIAL: {
    slicePlaneNormal: [0, 0, 1],
    sliceViewUp: [0, -1, 0],
  },
  SAGITTAL: {
    slicePlaneNormal: [1, 0, 0],
    sliceViewUp: [0, 0, 1],
  },
  CORONAL: {
    slicePlaneNormal: [0, 1, 0],
    sliceViewUp: [0, 0, 1],
  },
}

export default class VTKNewViewer extends Component {
  constructor(props) {
    super(props)
    this.state = {
      vtkImageData: null,
      volumes: null,
      voi: { windowWidth: 1600, windowCenter: -600 },
    }
    this.config = JSON.parse(localStorage.getItem('config'))
    this.container = React.createRef()
    this.apis = []
  }
  async componentDidMount() {
    document.getElementById('footer').style = 'display: none'
    const imageIdsPromise = new Promise((resolve, reject) => {
      axios
        .post(
          this.config.data.getDataListForCaseId,
          qs.stringify({
            caseId: '1.2.392.200036.9116.2.5.1.48.1221397971.1451607250.824401',
          })
        )
        .then((response) => {
          console.log(response.data)
          resolve(response.data)
        }, reject)
    })
    const imageIds = await imageIdsPromise
    const firstImageId = imageIds[0]
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

      // mapper.setMaximumSamplesPerRay(2000);
      // mapper.setSampleDistance(2);
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

      this.setState(
        {
          vtkImageData: imageData,
          origin: [(segRange.xMax + segRange.xMin) / 2, (segRange.yMax + segRange.yMin) / 2, (segRange.zMax + segRange.zMin) / 2],
          dimensions: [xVoxels, yVoxels, zVoxels],
          spacing: [xSpacing, ySpacing, zSpacing],
          originXBorder,
          originYBorder,
          originZBorder,
          segRange,
        },
        () => {
          this.getMPRInfo(imageIds)
        }
      )
    })
    this.genericRenderWindow = vtkGenericRenderWindow.newInstance()
    this.genericRenderWindow.setContainer(this.container.current)
    this.glWindow = this.genericRenderWindow.getOpenGLRenderWindow()
    this.renderWindow = this.genericRenderWindow.getRenderWindow()
    this.renderer = this.genericRenderWindow.getRenderer()
    this.renderer.setBackground([0, 0, 0])
    this.camera = this.renderer.getActiveCamera()
    // camera's viewup =>
    // camera zoom =>
    // camera azimuth => clockwise direction
    // camera elevation => up direction
    this.camera.elevation(-180)
    this.camera.setViewUp(1, 0, 0)
    this.renderWindow.render()
  }
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
      this.imageDataObject = imageDataObject

      loadImageData(imageDataObject)

      const onPixelDataInsertedCallback = (numberProcessed) => {
        const percentComplete = Math.floor((numberProcessed * 100) / imageIds.length)

        console.log(`Processing: ${percentComplete}%`)
      }

      imageDataObject.onPixelDataInserted(onPixelDataInsertedCallback)

      const { actor } = this.createActorMapper(imageDataObject.vtkImageData)

      this.imageDataObject = imageDataObject

      this.setState({
        vtkImageData: imageDataObject.vtkImageData,
        volumes: [actor],
      })
    })
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
  storeApi = (viewportIndex, orientation) => {
    return (api) => {
      this.apis[viewportIndex] = api
      const renderWindow = api.genericRenderWindow.getRenderWindow()
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

      renderWindow.render()
    }
  }
  render() {
    const viewerStyle = {
      height: 800,
      width: 1200,
    }
    return (
      <div style={viewerStyle}>
        {this.state.volumes && (
          <View2D
            viewerStyle={viewerStyle}
            volumes={this.state.volumes}
            onCreated={this.storeApi(0, 'AXIAL')}
            onRef={(input) => {
              this.viewer = input
            }}
          />
        )}
      </div>
    )
  }
}
