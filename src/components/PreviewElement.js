import React, { Component } from 'react'
import { connect } from 'react-redux'
import { DragSource } from 'react-dnd'
import '../initCornerstone.js'
import cornerstone from 'cornerstone-core'
import cornerstoneTools from 'cornerstone-tools'
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader'
cornerstoneWADOImageLoader.external.cornerstone = cornerstone
window.cornerstoneTools = cornerstoneTools

const Types = {
  PREVIEW: 'preview',
}

const previewSource = {
  canDrag(props) {
    return props.isReady
  },

  isDragging(props, monitor) {
    // console.log("isDragging")
    return monitor.getItem().caseId === props.caseId
  },

  beginDrag(props, monitor, Component) {
    const item = { caseId: props.caseId, date: props.date }
    return item
  },

  endDrag(props, monitor, Component) {
    if (!monitor.didDrop()) {
      console.log('no Drop target')
      return
    }

    const item = monitor.getItem()
    console.log('Drag item', item)

    const dropResult = monitor.getDropResult()
    console.log('Drag result', dropResult)

    // flux actions
  },
}
function collect(connect, monitor) {
  return {
    connectDragSource: connect.dragSource(),
    connectDragPreview: connect.dragPreview(),
    isDragging: monitor.isDragging(),
  }
}
class PreviewElement extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }
  componentDidMount() {
    const { caseId, image } = this.props

    const element = document.getElementById('preview-' + caseId)
    // console.log('preview',element)
    cornerstone.enable(element)
    cornerstone.loadAndCacheImage(image).then((image) => {
      // console.log('cache')
      var viewport = cornerstone.getDefaultViewportForImage(element, image)
      viewport.voi.windowWidth = 1600
      viewport.voi.windowCenter = -600
      viewport.scale = 110 / 512
      cornerstone.setViewport(element, viewport)
      cornerstone.displayImage(element, image)
    })
  }
  onHandleClickPreview(href) {
    window.location.href = href
  }
  render() {
    const { connectDragSource, caseId, statusIcon, description, isSelected, href } = this.props
    return connectDragSource(
      <div className={'preview-item' + (isSelected ? ' preview-item-selected' : '')}>
        <div className="preview-item-canvas" id={'preview-' + caseId} onClick={this.onHandleClickPreview.bind(this, href)}></div>
        <div className="preview-item-info">
          <div className="preview-item-info-icon">{statusIcon}</div>
          <div className="preview-item-info-desc">{description}</div>
        </div>
      </div>
    )
  }
}

export default connect(
  (state) => ({}),
  (dispatch) => ({
    dispatch,
  })
)(DragSource(Types.PREVIEW, previewSource, collect)(PreviewElement))
