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

import CustomOverlay from './CustomOverlay'

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
    return {
      curDate: state.dataCenter.curDate,
      preDate: state.dataCenter.preDate,
    }
  },
  (dispatch) => {
    return {
      dispatch,
    }
  }
)(DropTarget(Types.PREVIEW, previewTarget, collect)(FollowUpViewport))
