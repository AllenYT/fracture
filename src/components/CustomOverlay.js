import React, { PureComponent, Component } from 'react'

import { helpers } from '../vtk/helpers/index.js'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { getImageIdsByCaseId, getNodulesByCaseId, dropCaseId, setFollowUpActiveTool } from '../actions'
import * as cornerstone from 'cornerstone-core'
import * as cornerstoneMath from 'cornerstone-math'
import * as cornerstoneTools from 'cornerstone-tools'

const { formatPN, formatDA, formatNumberPrecision, formatTM, isValidNumber } = helpers

class CustomOverlay extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      imageData: null,
      caseId: null,
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
    // console.log('componentDidMount', this.props)
    const { imageId } = this.props
    if (imageId) {
      // console.log('componentDidMount', imageId.split('/')[4])
      this.setState({
        caseId: imageId.split('/')[4],
      })
    }
    const imagePromise = new Promise((resolve, reject) => {
      cornerstone.loadImage(imageId).then((image) => {
        resolve(image.data)
      }, reject)
    })

    const imageData = await imagePromise
    this.setState({ imageData, imageData })
  }

  render() {
    const { imageId, scale, windowWidth, windowCenter, curDate, preDate, curCaseId, preCaseId } = this.props
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
    // if (!studyDate) {
    //   studyDate = imageId.split('/')[4].split('_')[1]
    // }

    // console.log('studyDate', studyTime, studyDate, this.props.curDate, this.props.preDate)
    let caseId
    if (imageId) {
      caseId = imageId.split('/')[4]
    }

    if (curCaseId === preCaseId) {
      imageState = '相同'
    } else if (curCaseId === caseId) {
      imageState = '后片'
    } else if (caseId === preCaseId) {
      imageState = '前片'
    } else {
      imageState = 'Unknown'
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

export default connect(
  (state) => {
    return {
      curDate: state.dataCenter.curDate,
      curCaseId: state.dataCenter.curCaseId,
      preDate: state.dataCenter.preDate,
      preCaseId: state.dataCenter.preCaseId,
    }
  },
  (dispatch) => {
    return {
      dispatch,
    }
  }
)(CustomOverlay)
