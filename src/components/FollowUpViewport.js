import React, { Component } from 'react'
import * as cornerstone from 'cornerstone-core'
import * as cornerstoneMath from 'cornerstone-math'
import * as cornerstoneTools from 'cornerstone-tools'
import Hammer from 'hammerjs'
import dicomParser from 'dicom-parser'

import * as cornerstoneWadoImageLoader from 'cornerstone-wado-image-loader'
import CornerstoneViewport from 'react-cornerstone-viewport'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { getImageIdsByCaseId, getNodulesByCaseId, dropCaseId, setFollowUpActiveTool } from '../actions'
import { DropTarget } from 'react-dnd'
import { helpers } from '../vtk/helpers/index.js'

cornerstoneTools.external.cornerstone = cornerstone
cornerstoneTools.external.cornerstoneMath = cornerstoneMath
// cornerstoneTools.external.Drawing = Drawing;
// cornerstoneWebImageLoader.external.cornerstone = cornerstone
cornerstoneWadoImageLoader.external.cornerstone = cornerstone
cornerstoneWadoImageLoader.external.dicomParser = dicomParser
cornerstoneTools.external.Hammer = Hammer
cornerstoneTools.init()
cornerstoneTools.toolColors.setActiveColor('rgb(0, 255, 0)')
cornerstoneTools.toolColors.setToolColor('rgb(255, 255, 0)')
const { formatPN, formatDA, formatNumberPrecision, formatTM, isValidNumber } = helpers

const Types = {
  PREVIEW: 'preview',
}
const previewTarget = {
  canDrop(props, monitor) {
    const item = monitor.getItem()
    return true
  },
  hover(props, monitor, component) {
    // This is fired very often and lets you perform side effects
    // in response to the hover. You can't handle enter and leave
    // here—if you need them, put monitor.isOver() into collect() so you
    // can use componentDidUpdate() to handle enter/leave.

    // You can access the coordinates if you need them
    const clientOffset = monitor.getClientOffset()
    // You can check whether we're over a nested drop target
    const isOnlyThisOne = monitor.isOver({ shallow: true })

    // You will receive hover() even for items for which canDrop() is false
    const canDrop = monitor.canDrop()
  },

  drop(props, monitor, component) {
    if (monitor.didDrop()) {
      // If you want, you can check whether some nested
      // target already handled drop
      return
    }
    // Obtain the dragged item
    const item = monitor.getItem()
    props.dispatch(dropCaseId(item.caseId, item.date, props.viewportIndex))
    // You can do something with it

    // You can also do nothing and return a drop result,
    // which will be available as monitor.getDropResult()
    // in the drag source's endDrag() method
    return {}
  },
}

function collect(connect, monitor) {
  return {
    // Call this function inside render()
    // to let React DnD handle the drag events:
    connectDropTarget: connect.dropTarget(),
    // You can ask the monitor about the current drag state:
    isOver: monitor.isOver(),
    isOverCurrent: monitor.isOver({ shallow: true }),
    canDrop: monitor.canDrop(),
    itemType: monitor.getItemType(),
  }
}

class CustomOverlay extends Component {
  constructor(props) {
    super(props)
    this.state = {
      imageData: null,
    }
  }
  static propTypes = {
    scale: PropTypes.number.isRequired,
    windowWidth: PropTypes.number.isRequired,
    windowCenter: PropTypes.number.isRequired,
    imageId: PropTypes.string.isRequired,
    imageIndex: PropTypes.number.isRequired,
    stackSize: PropTypes.number.isRequired,
    // state: PropTypes.object,
  }

  getCompression(imageId) {
    const generalImageModule = cornerstone.metaData.get('generalImageModule', imageId) || {}
    const { lossyImageCompression, lossyImageCompressionRatio, lossyImageCompressionMethod } = generalImageModule

    if (lossyImageCompression === '01' && lossyImageCompressionRatio !== '') {
      const compressionMethod = lossyImageCompressionMethod || 'Lossy: '
      const compressionRatio = formatNumberPrecision(lossyImageCompressionRatio, 2)
      return compressionMethod + compressionRatio + ' : 1'
    }

    return 'Lossless / Uncompressed'
  }

  async componentDidMount() {
    // console.log("this.props", this.props);
    const imagePromise = new Promise((resolve, reject) => {
      cornerstone.loadImage(this.props.imageId).then((image) => {
        resolve(image.data)
      }, reject)
    })

    const imageData = await imagePromise
    this.setState({ imageData, imageData })
  }

  render() {
    const { imageId, scale, windowWidth, windowCenter } = this.props
    const { imageData } = this.state

    if (!imageId) {
      return null
    }

    if (!imageData) {
      return null
    }

    const zoomPercentage = formatNumberPrecision(scale * 100, 0)
    const seriesMetadata = cornerstone.metaData.get('generalSeriesModule', imageId) || {}
    const imagePlaneModule = cornerstone.metaData.get('imagePlaneModule', imageId) || {}
    const { rows, columns, sliceThickness, sliceLocation } = imagePlaneModule
    const { seriesNumber, seriesDescription } = seriesMetadata

    // const generalStudyModule =
    //   cornerstone.metaData.get("generalStudyModule", imageId) || {};
    // const { studyDate, studyTime, studyDescription } = generalStudyModule;

    var studyDate = imageData.string('x00080020')
    const studyTime = imageData.string('x00080030')
    const studyDescription = imageData.string('x00081030')
    const institutionName = imageData.string('x00080080')
    const AccessionNumber = imageData.string('x00080050')
    const MachineName = imageData.string('x00090010')

    var imageState = ''

    if (!studyDate) {
      studyDate = imageId.split('/')[4].split('_')[1]
    }

    if (imageId.split('/')[4] === window.location.href.split('/')[4].split('&')[0]) {
      imageState = 'New'
    } else {
      imageState = 'Previews'
    }
    // const patientModule =
    //   cornerstone.metaData.get("patientModule", imageId) || {};
    // const { patientId, patientName } = patientModule;

    const patientId = imageData.string('x00100020')
    const patientName = imageData.string('x00100010')
    const patientAge = imageData.string('x00101010')
    const patientGender = imageData.string('x00100040')
    const patientPosition = imageData.string('x00185100')

    const generalImageModule = cornerstone.metaData.get('generalImageModule', imageId) || {}
    const { instanceNumber } = generalImageModule

    const cineModule = cornerstone.metaData.get('cineModule', imageId) || {}
    const { frameTime } = cineModule

    // const frameTime = imageData.float("x00181063");
    // console.log("frameTime", frameTime);

    const frameRate = formatNumberPrecision(1000 / frameTime, 1)
    const compression = this.getCompression(imageId)
    const wwwc = `W: ${windowWidth.toFixed ? windowWidth.toFixed(0) : windowWidth} L: ${windowWidth.toFixed ? windowCenter.toFixed(0) : windowCenter}`
    const imageDimensions = `${columns} x ${rows}`

    const { imageIndex, stackSize } = this.props

    const normal = (
      <React.Fragment>
        <div className="top-left overlay-element">
          <div className="follow-state">{imageState}</div>
          <div>{formatPN(patientName)}</div>
          <div>
            {patientAge} {patientGender}
          </div>
          <div>{patientPosition}</div>
          <div>{patientId}</div>
        </div>
        {/* <div className="top-center overlay-element">
            <div>{"后片"}</div>
          </div> */}
        <div className="top-right overlay-element">
          <div>{institutionName}</div>
          <div>{studyDescription}</div>
          <div>
            {formatDA(studyDate)} {formatTM(studyTime)}
          </div>
          <div>{'ACC No. ' + AccessionNumber}</div>
          <div>{MachineName}</div>
        </div>
        <div className="bottom-right overlay-element">
          <div>Zoom: {zoomPercentage}%</div>
          <div>{wwwc}</div>
          <div className="compressionIndicator">{compression}</div>
        </div>
        <div className="bottom-left overlay-element">
          <div>{seriesNumber >= 0 ? `Ser: ${seriesNumber}` : ''}</div>
          <div>{stackSize > 1 ? `Img: ${instanceNumber} ${imageIndex}/${stackSize}` : ''}</div>
          <div>
            {frameRate >= 0 ? `${formatNumberPrecision(frameRate, 2)} FPS` : ''}
            <div>{imageDimensions}</div>
            <div>
              {isValidNumber(sliceLocation) ? `Loc: ${formatNumberPrecision(sliceLocation, 2)} mm ` : ''}
              {sliceThickness ? `Thick: ${formatNumberPrecision(sliceThickness, 2)} mm` : ''}
            </div>
            <div>{seriesDescription}</div>
          </div>
        </div>
      </React.Fragment>
    )

    return <div className="ViewportOverlay">{normal}</div>
  }
}

class FollowUpViewport extends Component {
  constructor() {
    super()
    this.state = {}
  }
  componentDidMount() {}
  render() {
    const { connectDropTarget, viewportIndex, tools, imageIds, style, imageIdIndex, isPlaying, frameRate, activeTool, isOverlayVisible, className, setCornerstoneElement, setViewportIndex, voi } =
      this.props

    return connectDropTarget(
      <div className="follow-up-viewport-block">
        <CornerstoneViewport
          key={viewportIndex}
          tools={tools}
          imageIds={imageIds}
          style={style}
          imageIdIndex={imageIdIndex}
          isPlaying={isPlaying}
          frameRate={frameRate}
          activeTool={activeTool}
          viewportOverlayComponent={CustomOverlay}
          isOverlayVisible={isOverlayVisible}
          onElementEnabled={(elementEnabledEvt) => {
            const newCornerstoneElement = elementEnabledEvt.detail.element
            setCornerstoneElement(newCornerstoneElement)
            newCornerstoneElement.addEventListener('cornerstoneimagerendered', (imageRenderedEvent) => {
              const viewport = imageRenderedEvent.detail.viewport
              const newViewport = Object.assign({}, viewport, {
                voi: {
                  windowWidth: voi.windowWidth,
                  windowCenter: voi.windowCenter,
                },
                invert: voi.invert,
              })

              cornerstone.setViewport(newCornerstoneElement, newViewport)
            })
          }}
          className={className}
          setViewportActive={() => {
            setViewportIndex()
          }}
        />
      </div>
    )
  }
}
export default connect(
  (state) => {
    return {}
  },
  (dispatch) => {
    return {
      dispatch,
    }
  }
)(DropTarget(Types.PREVIEW, previewTarget, collect)(FollowUpViewport))
