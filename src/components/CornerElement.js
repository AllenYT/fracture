import React, { Component } from 'react'
import { connect } from 'react-redux'
import cornerstone from 'cornerstone-core'
import cornerstoneTools from 'cornerstone-tools'
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader'
import { Icon, Button, Accordion, Modal, Dropdown, Menu, Label, Header, Popup, Table, Sidebar, Loader, Divider, Form, Card } from 'semantic-ui-react'
import { Slider, Select, Checkbox, Tabs, InputNumber, Popconfirm, message, Cascader, Radio, Row, Col } from 'antd'

import qs from 'qs'
import axios from 'axios'
import md5 from 'js-md5'
import _ from 'lodash'

import '../initCornerstone.js'

class CornerElement extends Component {
  constructor(props) {
    super(props)
    this.state = {
      canvasWidth: 0,
      canvasHeight: 0,

      boxes: this.props.boxes,
      currentIdx: 0,
      sliderMarks: {},
      noduleMarks: {},
      lymphMarks: {},
    }
  }
  componentDidMount() {
    window.addEventListener('resize', this.resizeScreen.bind(this))
  }
  componentWillUnmount() {
    window.removeEventListener('resize', this.resizeScreen.bind(this))
  }
  componentDidUpdate(prevState, prevProps) {}

  resizeScreen() {}
  render() {
    const { imageIds } = this.props
    const { canvasWidth, canvasHeight, currentIdx, sliderMarks, boxes } = this.state
    return (
      <div style={{ height: '100%' }}>
        <div
          id="origin-canvas"
          style={{
            width: canvasWidth,
            height: canvasHeight,
          }}
          ref={(input) => {
            this.element = input
          }}>
          <canvas
            className="cornerstone-canvas"
            id="canvas"
            style={{
              width: canvasWidth,
              height: canvasHeight,
            }}
          />
          {/* <canvas className="cornerstone-canvas" id="length-canvas"/> */}
          {/* {canvas} */}
          {/* {dicomTagPanel} */}
        </div>
        {/* </div> */}
        <div id="cor-slice-slider" style={{ height: `${canvasHeight * 0.7}px`, top: `${canvasHeight * 0.15}px` }}>
          <Slider
            vertical
            reverse
            marks={sliderMarks}
            // defaultValue={0}
            value={currentIdx}
            // onChange={this.handleRangeChange.bind(this)}
            // onAfterChange={this.handleRangeAfterChange.bind(this)}
            tipFormatter={(value) => `${value + 1}`}
            min={0}
            step={1}
            max={imageIds.length - 1}></Slider>
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
)(CornerElement)
