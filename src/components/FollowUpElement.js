import React, { Component, PureComponent } from 'react'
import ReactHtmlParser from 'react-html-parser'
import dicomParser from 'dicom-parser'
import * as cornerstone from 'cornerstone-core'
import * as cornerstoneMath from 'cornerstone-math'
import * as cornerstoneTools from 'cornerstone-tools'
import Hammer from 'hammerjs'
import * as cornerstoneWadoImageLoader from 'cornerstone-wado-image-loader'
import '../css/FollowUpElement.css'
import _ from 'lodash'
import qs from 'qs'
import axios from 'axios'
import PropTypes from 'prop-types'
import { helpers } from '../vtk/helpers/index.js'
import copy from 'copy-to-clipboard'
import { connect } from 'react-redux'
import { getImageIdsByCaseId, getNodulesByCaseId, dropCaseId, setFollowUpActiveTool, setFollowUpLoadingCompleted, updateLoadedImageNumber } from '../actions'
import { DropTarget } from 'react-dnd'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChevronLeft,
  faChevronRight,
  faChevronDown,
  faChevronUp,
  faCaretDown,
  faFilter,
  faSortAmountDownAlt,
  faSortUp,
  faSortDown,
  faEye,
  faEyeSlash,
  faExchangeAlt,
  faArrowsAltH,
  faLink,
} from '@fortawesome/free-solid-svg-icons'

import { Dropdown, Menu, Icon, Image, Button, Accordion, Popup, Form } from 'semantic-ui-react'
import { Checkbox, Row, Col, Typography, Cascader, Button as AntdButton, Divider, Tag, Tabs, Radio, Input, Select, message, Slider } from 'antd'
import src1 from '../images/scu-logo.jpg'
import FollowUpViewport from './FollowUpViewport'
import '../vtk/ViewportOverlay/ViewportOverlay.css'
import * as echarts from 'echarts/lib/echarts'

import { loadAndCacheImagePlus } from '../lib/cornerstoneImageRequest'
import { executeTask } from '../lib/taskHelper'

const { Title, Text } = Typography
const { TextArea } = Input
const { TabPane } = Tabs
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

// const config = require('../config.json')
// const segment = config.segment
// const dangerLevel = config.dangerLevel
// const densityConfig = config.density

const nodulePlaces = {
  0: '????????????',
  1: '????????????',
  2: '????????????',
  3: '????????????',
  4: '????????????',
  5: '????????????',
}
const lungLoc = {
  S1: '????????????-??????',
  S2: '????????????-??????',
  S3: '????????????-??????',
  S4: '????????????-?????????',
  S5: '????????????-?????????',
  S6: '????????????-??????',
  S7: '????????????-????????????',
  S8: '????????????-????????????',
  S9: '????????????-????????????',
  S10: '????????????-????????????',
  S11: '????????????-?????????',
  S12: '????????????-??????',
  S13: '????????????-?????????',
  S14: '????????????-?????????',
  S15: '????????????-??????',
  S16: '????????????-???????????????',
  S17: '????????????-????????????',
  S18: '????????????-????????????',
}
const dangerLevel = {
  1: '??????',
  2: '??????',
  3: '??????',
}
const densityList = {
  1: '?????????',
  2: '?????????',
  3: '??????',
}

const { Option } = Select

class FollowUpElement extends Component {
  constructor(props) {
    super(props)
    console.log('props', this.props)
    this.state = {
      username: props.username,
      curImageIds: props.curInfo.curImageIds,
      curCaseId: props.curInfo.curCaseId,
      curBoxes: props.curInfo.curBoxes,
      preImageIds: props.preInfo.preImageIds,
      preCaseId: props.preInfo.preCaseId,
      preBoxes: props.preInfo.preBoxes,
      isOverlayVisible: true,
      isAnnoVisible: true,
      clicked: false,
      clickedArea: {},
      curImageIdsLoadingCompleted: false,
      preImageIdsLoadingCompleted: false,
      showNodules: true,
      showInfo: true,
      activeViewportIndex: 0,
      curViewportIndex: 0,
      preViewportIndex: 1,
      curImage: null,
      preImage: null,
      curImageIdIndex: 0,
      preImageIdIndex: 0,
      // followUpIsPlaying: false,
      frameRate: 22,
      isRegistering: false,
      curListsActiveIndex: -1,
      preListsActiveIndex: -1,
      matchListsActiveIndex: -1,
      newListsActiveIndex: -1,
      vanishListsActiveIndex: -1,
      newCornerstoneElement: null,
      preCornerstoneElement: null,
      registerBoxes: props.registerBoxes,
      templateText: '',
      vanishNodules: [],
      newNodules: [],
      matchNodules: [],
      noduleTblCheckedValue: ['vanish', 'new', 'match'],
      matchNodulesAllChecked: false,
      activeMatchNewNoduleNo: -1,
      activeMatchPreNoduleNo: -1,
      tools: [
        // Mouse
        {
          name: 'Wwwc',
          mode: 'active',
          modeOptions: { mouseButtonMask: 1 },
        },
        {
          name: 'Zoom',
          mode: 'active',
          modeOptions: { mouseButtonMask: 2 },
        },
        {
          name: 'Pan',
          mode: 'active',
          modeOptions: { mouseButtonMask: 4 },
        },
        // Scroll
        { name: 'StackScrollMouseWheel', mode: 'active' },
        { name: 'StackScroll', mode: 'active', mouseButtonMask: 1 },
        // Touch
        { name: 'PanMultiTouch', mode: 'active' },
        { name: 'ZoomTouchPinch', mode: 'active' },
        { name: 'StackScrollMultiTouch', mode: 'active' },
        // Draw
        {
          name: 'RectangleRoi',
          mode: 'active',
          mouseButtonMask: 1,
          props: { mouseMoveCallback: this.mouseMoveCallback.bind(this) },
        },
        { name: 'Bidirectional', mode: 'active', mouseButtonMask: 1 },
        { name: 'Length', mode: 'active', mouseButtonMask: 1 },
        //erase
        { name: 'Eraser', mode: 'active', mouseButtonMask: 1 },
        // {
        //   name: "ScaleOverlay",
        //   mode: "enabled",
        //   mouseButtonMask: 1,
        //   // toolColors: "white",
        // },
      ],
      activeTool: 'StackScroll',
      curVoi: {
        windowCenter: -600,
        windowWidth: 1600,
        invert: false,
      },
      preVoi: {
        windowCenter: -600,
        windowWidth: 1600,
        invert: false,
      },
      random: Math.random(),
      tableHeight: 0,
      reportGuideActive: true,
      reportImageActive: true,
      reportGuideType: '????????????',
      reportImageType: '????????????',
      reportGuideText: '',
      reportImageText: '',
      reportImageTop: 0,
      reportImageHeight: 0,
      reportImageContentHeight: 0,
      curNodulesAllChecked: false,
      preNodulesAllChecked: false,
      sortChanged: false,
      HUSliderRange: [-100, 100],
    }
    this.config = JSON.parse(localStorage.getItem('config'))
    this.nextPath = this.nextPath.bind(this)
    this.noduleTblCheckboxChange = this.noduleTblCheckboxChange.bind(this)
    this.drawCustomRectangleRoi = this.drawCustomRectangleRoi.bind(this)
    // this.onKeydown = this.onKeydown.bind(this);
  }
  fetchSignal(promise) {
    if (this.signal.aborted) {
      return Promise.reject()
    }
    return promise
      .then((res) => {
        if (this.signal.aborted) {
          throw new Error('unmount')
        }
        return res
      })
      .catch((e) => {
        console.log('fetchSignal', e)
      })
  }
  componentDidMount() {
    this.props.onRef(this)
    console.log('followup props', this.props)
    this.props.setFollowUpActiveTool('StackScroll')
    this.props.setFollowUpLoadingCompleted(false)
    const curInfo = this.props.curInfo
    if (curInfo.curImageIds && curInfo.curCaseId && curInfo.curBoxes) {
      const curImagePromise = curInfo.curImageIds.map((curImageId, curImageIndex) => loadAndCacheImagePlus(curImageId, 5))
      Promise.all(curImagePromise).then(() => {
        console.log('followup curImages loading completed')
      })
      this.setState(
        {
          curImageIds: curInfo.curImageIds,
          curCaseId: curInfo.curCaseId,
          curBoxes: curInfo.curBoxes,
        },
        () => {
          this.setState({ curImageIdsLoadingCompleted: true })
          this.changeImageIndex('cur')
        }
      )
    }
    // this.setState({ curImageIdsLoadingCompleted: true })
    // this.changeImageIndex('cur')

    const preInfo = this.props.preInfo
    const loadedImages = this.props.loadedImages
    if (preInfo.preImageIds && preInfo.preCaseId && preInfo.preBoxes) {
      if (_.has(loadedImages, preInfo.preCaseId)) {
        this.setState({ preImageIdsLoadingCompleted: true })
        console.log('followup preImages have loaded')
      } else {
        const preImagePromise = preInfo.preImageIds.map((preImageId, preImageIndex) =>
          loadAndCacheImagePlus(preImageId, 5).then((image) => {
            this.props.updateLoadedImageNumber(preImageIndex, preInfo.preCaseId)
          })
        )
        Promise.all(preImagePromise).then(() => {
          this.setState({ preImageIdsLoadingCompleted: true })
          console.log('followup preImages loading completed')
        })
      }

      this.setState(
        {
          preImageIds: preInfo.preImageIds,
          preCaseId: preInfo.preCaseId,
          preBoxes: preInfo.preBoxes,
        },
        () => {
          this.changeImageIndex('pre')
        }
      )
    }

    this.resizeScreen()
    this.template()

    window.addEventListener('resize', this.resizeScreen.bind(this))
    window.addEventListener('mousedown', this.mousedownFunc.bind(this))
  }

  componentWillMount() {
    // document.getElementById('header').style.display = 'none'
  }
  componentWillUnmount() {
    const { newCornerstoneElement, preCornerstoneElement, curBoxes, preBoxes } = this.state
    cornerstoneTools.clearToolState(newCornerstoneElement, 'RectangleRoi')
    cornerstoneTools.clearToolState(preCornerstoneElement, 'RectangleRoi')
    cornerstoneTools.clearToolState(newCornerstoneElement, 'Bidirectional')
    cornerstoneTools.clearToolState(preCornerstoneElement, 'Bidirectional')
    cornerstoneTools.clearToolState(newCornerstoneElement, 'Length')
    cornerstoneTools.clearToolState(preCornerstoneElement, 'Length')
    if (curBoxes && curBoxes.length) {
      curBoxes.forEach((boxItem, boxIndex) => {
        delete boxItem.uuid
        delete boxItem.biuuid
      })
    }
    if (preBoxes && preBoxes.length) {
      preBoxes.forEach((boxItem, boxIndex) => {
        delete boxItem.uuid
        delete boxItem.biuuid
      })
    }

    window.removeEventListener('resize', this.resizeScreen.bind(this))
    window.removeEventListener('mousedown', this.mousedownFunc.bind(this))
    //??????????????????
    this.setState = (state, callback) => {
      return
    }
  }
  resizeScreen() {
    if (document.getElementById('structured-report') && document.getElementById('structured-report-title') && document.getElementById('structured-report-operation')) {
      const stReport = document.getElementById('structured-report')
      const stReportTitle = document.getElementById('structured-report-title')
      const stReportOperation = document.getElementById('structured-report-operation')
      this.setState({
        tableHeight: stReport.clientHeight - stReportTitle.clientHeight - stReportOperation.clientHeight,
      })
    }
    this.reportImageTopCalc()
  }
  mouseUp(target, viewportIndex) {
    const stackData = cornerstoneTools.getToolState(target, 'stack')
    const toolData = cornerstoneTools.getToolState(target, 'RectangleRoi')
    if (toolData && toolData.data && toolData.data.length) {
      const data = toolData.data
      let boxes
      let currentIdx
      if (stackData && stackData.data && stackData.data.length) {
        currentIdx = stackData.data[0].currentImageIdIndex
      }
      if (viewportIndex === 0) {
        boxes = this.state.curBoxes
      } else if (viewportIndex === 1) {
        boxes = this.state.preBoxes
      }
      data.forEach((item, index) => {
        const uuid = item.uuid

        const boxIndex = _.findIndex(boxes, { uuid })
        if (boxIndex === -1) {
          const newIdx = boxes.length
          boxes.push({
            malignancy: -1,
            texture: -1,
            patho: '',
            probability: 1,
            uuid,
            slice_idx: currentIdx + 1,
            // nodule_hist,
            huMax: item.cachedStats.max,
            huMean: item.cachedStats.mean,
            huMin: item.cachedStats.min,
            volume: item.cachedStats.area * Math.pow(10, -4),
            x1: item.handles.start.x,
            x2: item.handles.end.x,
            y1: item.handles.start.y,
            y2: item.handles.end.y,
            highlight: false,
            diameter: 0.0,
            place: 0,
            segment: 'None',
            modified: 1,
            nodule_no: newIdx,
            prevIdx: newIdx,
            visibleIdx: newIdx,
            visible: true,
            checked: false,
          })
        } else {
          const boxItem = boxes[boxIndex]
          boxItem.x1 = item.handles.start.x
          boxItem.x2 = item.handles.end.x
          boxItem.y1 = item.handles.start.y
          boxItem.y2 = item.handles.end.y
        }
      })
      if (viewportIndex === 0) {
        this.setState({
          curBoxes: boxes,
        })
      } else if (viewportIndex === 1) {
        this.setState({
          preBoxes: boxes,
        })
      }
    } else {
      return
    }
  }
  changeImageIndex(type) {
    if (type === 'cur') {
      const curBoxes = this.state.curBoxes
      let curImageIdIndex = this.state.curImageIdIndex
      let tmpIndex = this.state.curImageIdIndex
      if (curImageIdIndex === 0) {
        tmpIndex = 1
        console.log('???????????????ct')
      } else if (curImageIdIndex === 1) {
        tmpIndex = 0
        console.log('???????????????ct')
      } else if (curImageIdIndex > 1) {
        if (curBoxes && curBoxes.length) {
          tmpIndex = curBoxes[0].slice_idx
        }
        console.log('??????????????????')
      }
      this.setState({
        curImageIdIndex: tmpIndex,
      })
    } else if (type === 'pre') {
      const preBoxes = this.state.preBoxes
      let preImageIdIndex = this.state.preImageIdIndex
      let tmpIndex = this.state.preImageIdIndex
      if (preImageIdIndex === 0) {
        tmpIndex = 1
        console.log('???????????????ct')
      } else if (preImageIdIndex === 1) {
        tmpIndex = 0
        console.log('???????????????ct')
      } else if (preImageIdIndex > 0) {
        if (preBoxes && preBoxes.length) {
          tmpIndex = preBoxes[0].slice_idx
        }
        console.log('??????????????????')
      }
      this.setState({
        preImageIdIndex: tmpIndex,
      })
    }
  }
  componentDidUpdate(prevProps, prevState) {
    if (this.state.matchListsActiveIndex !== -1 && prevState.matchListsActiveIndex !== this.state.matchListsActiveIndex) {
    }
    if (this.state.newListsActiveIndex !== -1 && prevState.newListsActiveIndex !== this.state.newListsActiveIndex) {
      if (this.state.registerBoxes && this.state.registerBoxes.new && this.state.registerBoxes.new.length) {
        const { registerBoxes, newListsActiveIndex } = this.state
        if (registerBoxes['new'][newListsActiveIndex]) {
          this.setState(
            {
              curImageIdIndex: registerBoxes['new'][newListsActiveIndex].slice_idx,
            },
            () => {
              cornerstone.loadAndCacheImage(this.state.curImageIds[registerBoxes['new'][newListsActiveIndex].slice_idx]).then((image) => {
                this.setCustomRetangleActive('cur', registerBoxes['new'][newListsActiveIndex].nodule_no)
              })
            }
          )
        }
      }
    }
    if (this.state.vanishListsActiveIndex !== -1 && prevState.vanishListsActiveIndex !== this.state.vanishListsActiveIndex) {
      if (this.state.registerBoxes && this.state.registerBoxes.vanish && this.state.registerBoxes.vanish.length) {
        const { registerBoxes, vanishListsActiveIndex } = this.state
        if (registerBoxes['vanish'][vanishListsActiveIndex]) {
          this.setState(
            {
              preImageIdIndex: registerBoxes['vanish'][vanishListsActiveIndex].slice_idx,
            },
            () => {
              cornerstone.loadAndCacheImage(this.state.preImageIds[registerBoxes['vanish'][vanishListsActiveIndex].slice_idx]).then((image) => {
                this.setCustomRetangleActive('pre', registerBoxes['vanish'][vanishListsActiveIndex].nodule_no)
              })
            }
          )
        }
      }
    }
    if (prevState.activeViewportIndex !== this.state.activeViewportIndex) {
      console.log('activeidx', this.state.activeViewportIndex)
    }
    if (prevProps.curInfo !== this.props.curInfo) {
      const curInfo = this.props.curInfo
      const loadedImages = this.props.loadedImages
      if (curInfo.curImageIds && curInfo.curCaseId && curInfo.curBoxes) {
        this.props.setFollowUpLoadingCompleted(false)
        this.setState({
          curImageIdsLoadingCompleted: false,
        })
        const targets = document.getElementsByClassName('viewport-element')
        cornerstoneTools.clearToolState(targets[0], 'RectangleRoi')
        cornerstoneTools.clearToolState(targets[1], 'RectangleRoi')
        if (_.has(loadedImages, curInfo.curCaseId)) {
          this.setState({ curImageIdsLoadingCompleted: true })
          console.log('followup curImages have loaded')
        } else {
          const curImagePromise = curInfo.curImageIds.map((curImageId, curImageIndex) =>
            loadAndCacheImagePlus(curImageId, 6).then((image) => {
              this.props.updateLoadedImageNumber(curImageIndex, curInfo.curCaseId)
            })
          )
          Promise.all(curImagePromise).then(() => {
            this.setState({ curImageIdsLoadingCompleted: true })
            console.log('followup curImages loading completed')
          })
        }

        this.setState(
          {
            curImageIds: curInfo.curImageIds,
            curCaseId: curInfo.curCaseId,
            curBoxes: curInfo.curBoxes,
          },
          () => {
            this.changeImageIndex('cur')
          }
        )
      }
    }
    if (prevProps.preInfo !== this.props.preInfo) {
      const preInfo = this.props.preInfo
      const loadedImages = this.props.loadedImages
      if (preInfo.preImageIds && preInfo.preCaseId && preInfo.preBoxes) {
        this.props.setFollowUpLoadingCompleted(false)
        this.setState({
          preImageIdsLoadingCompleted: false,
        })
        const targets = document.getElementsByClassName('viewport-element')
        cornerstoneTools.clearToolState(targets[0], 'RectangleRoi')
        cornerstoneTools.clearToolState(targets[1], 'RectangleRoi')
        if (_.has(loadedImages, preInfo.preCaseId)) {
          this.setState({ preImageIdsLoadingCompleted: true })
          console.log('followup preImages have loaded')
        } else {
          const preImagePromise = preInfo.preImageIds.map((preImageId, preImageIndex) =>
            loadAndCacheImagePlus(preImageId, 6).then((image) => {
              this.props.updateLoadedImageNumber(preImageIndex, preInfo.preCaseId)
            })
          )
          Promise.all(preImagePromise).then(() => {
            this.setState({ preImageIdsLoadingCompleted: true })
            console.log('followup preImages loading completed')
          })
        }

        this.setState(
          {
            preImageIds: preInfo.preImageIds,
            preCaseId: preInfo.preCaseId,
            preBoxes: preInfo.preBoxes,
          },
          () => {
            this.changeImageIndex('pre')
          }
        )
      }
    }
    if (prevProps.registerBoxes !== this.props.registerBoxes) {
      const preCaseId = this.props.preInfo.preCaseId
      const curCaseId = this.props.curInfo.curCaseId
      if (preCaseId && curCaseId) {
        this.setState({
          registerBoxes: this.props.registerBoxes,
        })
        // const followRectsParams = {
        //   earlierCaseId: preCaseId,
        //   laterCaseId: curCaseId,
        // }
        // const getRectsForFollowUpPromise = axios.post(this.config.draft.getRectsForFollowUp, qs.stringify(followRectsParams))
        // Promise.all(getRectsForFollowUpPromise).then((FollowRectsRes) => {

        // })
      }
    }
    if (prevState.curImageIdsLoadingCompleted !== this.state.curImageIdsLoadingCompleted || prevState.preImageIdsLoadingCompleted !== this.state.preImageIdsLoadingCompleted) {
      if (this.state.curImageIdsLoadingCompleted && this.state.preImageIdsLoadingCompleted) {
        this.props.setFollowUpLoadingCompleted(true)
      }
    }
    if (prevState.HUSliderRange !== this.state.HUSliderRange) {
      const { activeMatchNewNoduleNo, activeMatchPreNoduleNo, curBoxes, preBoxes } = this.state
      if (activeMatchNewNoduleNo !== -1 && activeMatchPreNoduleNo !== -1) {
        let curIndex = _.findIndex(curBoxes, { nodule_no: activeMatchNewNoduleNo })
        let activeMatchNewBox = curBoxes[curIndex]
        let preIndex = _.findIndex(preBoxes, { nodule_no: activeMatchPreNoduleNo })
        let activeMatchPreBox = preBoxes[preIndex]
        let minHU = Math.min(activeMatchNewBox.huMin, activeMatchPreBox.huMin)
        let maxHU = Math.max(activeMatchNewBox.huMax, activeMatchPreBox.huMax)
        this.plotHistogram(activeMatchNewBox, 'chart-current', maxHU, minHU)
        this.plotHistogram(activeMatchPreBox, 'chart-previous', maxHU, minHU)
      }
    }

    if (prevProps.followUpActiveTool !== this.props.followUpActiveTool) {
      this.setState({
        activeTool: this.props.followUpActiveTool,
      })
    }
    if (prevProps.followUpIsPlaying !== this.props.followUpIsPlaying) {
    }
  }

  nextPath(path) {
    this.props.history.push(path)
  }
  mouseMoveCallback(e) {
    console.log('activeMouseUpCallback', e)
  }

  setRegistering() {
    if (this.state.isRegistering) {
      this.setState(
        {
          isRegistering: false,
        },
        () => {
          this.resizeScreen()
        }
      )
    } else {
      this.setState({ isRegistering: true }, () => {
        this.resizeScreen()
      })
    }
  }

  // onKeydown(event) {
  //   console.log(event.which);

  //   if (event.which == 38) {
  //     //????????????list
  //     event.preventDefault();
  //     const curListsActiveIndex = this.state.curListsActiveIndex;
  //     // if (curListsActiveIndex > 0) this.keyDownListSwitch(curListsActiveIndex - 1);
  //   }

  //   if (event.which == 40) {
  //     //????????????list
  //     event.preventDefault();
  //     // const listsActiveIndex = this.state.listsActiveIndex;
  //     // // const boxes = this.state.selectBoxes
  //     // let boxes = this.state.boxes;
  //     // if (listsActiveIndex < boxes.length - 1) {
  //     //   console.log("listsActiveIndex", listsActiveIndex);
  //     //   this.keyDownListSwitch(listsActiveIndex + 1);
  //     // } else if (listsActiveIndex === boxes.length - 1) {
  //     //   console.log("listsActiveIndex", listsActiveIndex);
  //     //   this.keyDownListSwitch(0);
  //     // }
  //   }
  // }

  onLungLocationChange = (idx, status, val) => {
    if (status === 'current') {
      let box = this.state.curBoxes
      console.log('location', val)
      for (let item in lungLoc) {
        if (lungLoc[item] === val[0] + '-' + val[1]) {
          box[idx].segment = item
          this.setState({ curBoxes: box })
        }
      }
    } else if (status === 'previous') {
      let box = this.state.preBoxes
      console.log('location', val)
      for (let item in lungLoc) {
        if (lungLoc[item] === val[0] + '-' + val[1]) {
          box[idx].segment = item
          this.setState({ preBoxes: box })
        }
      }
    } else if (status === 'register-new') {
      let box = this.state.registerBoxes
      for (let item in lungLoc) {
        if (lungLoc[item] === val[0] + '-' + val[1]) {
          box['new'][idx].segment = item
          this.setState({ registerBoxes: box })
        }
      }
    } else if (status === 'register-vanish') {
      let box = this.state.registerBoxes
      for (let item in lungLoc) {
        if (lungLoc[item] === val[0] + '-' + val[1]) {
          box['vanish'][idx].segment = item
          this.setState({ registerBoxes: box })
        }
      }
    } else if (status === 'register-match') {
      let box = this.state.registerBoxes
      for (let item in lungLoc) {
        if (lungLoc[item] === val[0] + '-' + val[1]) {
          box['match'][idx]['later'].segment = item
          box['match'][idx]['earlier'].segment = item
          this.setState({ registerBoxes: box })
        }
      }
    }
  }

  measure(e) {
    console.log('measurements', e)
  }

  handleListClick = (currentIdx, index, status, event) => {
    //??????list-item
    if (status === 'current') {
      const { curListsActiveIndex } = this.state
      const newIndex = curListsActiveIndex === index ? -1 : index
      // console.log('curidx', index, curListsActiveIndex)
      this.setState(
        {
          curListsActiveIndex: newIndex,
          curImageIdIndex: currentIdx,
        },
        () => {
          const { curBoxes, curImageIds, newCornerstoneElement } = this.state
          loadAndCacheImagePlus(curImageIds[currentIdx], 1).then(() => {
            const currentTarget = newCornerstoneElement
            for (let i = 0; i < curBoxes.length; i++) {
              if (curBoxes[i].slice_idx === currentIdx) {
                if (curBoxes[i].uuid === undefined) {
                  console.log('cur addToolState init', i)
                  // cornerstone.updateImage(currentTarget)
                  const measurementData = {
                    noduleIndex: curBoxes[i].visibleIdx + 1,
                    visible: true,
                    active: i === newIndex,
                    color: undefined,
                    invalidated: true,
                    handles: {
                      start: {
                        x: curBoxes[i].x1,
                        y: curBoxes[i].y1,
                        highlight: false,
                        active: false,
                      },
                      end: {
                        x: curBoxes[i].x2,
                        y: curBoxes[i].y2,
                        highlight: false,
                        active: false,
                      },
                      textBox: {
                        active: false,
                        hasMoved: false,
                        movesIndependently: false,
                        drawnIndependently: true,
                        allowedOutsideImage: true,
                        hasBoundingBox: true,
                      },
                    },
                  }
                  cornerstoneTools.addToolState(currentTarget, 'RectangleRoi', measurementData)
                  let toolData = cornerstoneTools.getToolState(currentTarget, 'RectangleRoi')
                  const toolDataIndex = _.findIndex(toolData.data, function (o) {
                    let isEqual = false
                    const oHandles = o.handles
                    if (oHandles) {
                      if (oHandles.start.x === curBoxes[i].x1 && oHandles.start.y === curBoxes[i].y1 && oHandles.end.x === curBoxes[i].x2 && oHandles.end.y === curBoxes[i].y2) {
                        isEqual = true
                      }
                    }
                    return isEqual
                  })
                  if (toolDataIndex !== -1) {
                    curBoxes[i].uuid = toolData.data[toolDataIndex].uuid
                  }
                  // cornerstoneTools.setToolEnabledForElement(currentTarget, 'RectangleRoi')
                } else {
                  if (i === newIndex) {
                    console.log('cur addToolState inited', curBoxes[i].uuid, currentIdx, this.state.curImageIdIndex)
                    let toolData = cornerstoneTools.getToolState(currentTarget, 'RectangleRoi')
                    if (toolData && toolData.data && toolData.data.length) {
                      const toolDataIndex = _.findIndex(toolData.data, { uuid: curBoxes[i].uuid })
                      const savedData = [].concat(toolData.data)
                      cornerstoneTools.clearToolState(currentTarget, 'RectangleRoi')
                      savedData.forEach((savedDataItem, savedDataItemIndex) => {
                        if (_.findIndex(curBoxes, { uuid: savedDataItem.uuid }) !== -1) {
                          savedDataItem.active = toolDataIndex === savedDataItemIndex
                          cornerstoneTools.addToolState(currentTarget, 'RectangleRoi', savedDataItem)
                        }
                      })
                    }
                  }
                }
              }
              // }
              this.setState({ curBoxes: curBoxes })
            }
          })
        }
      )
    } else if (status === 'previous') {
      const { preListsActiveIndex } = this.state
      const newIndex = preListsActiveIndex === index ? -1 : index
      this.setState(
        {
          preListsActiveIndex: newIndex,
          preImageIdIndex: currentIdx,
        },
        () => {
          const { preBoxes, preImageIds } = this.state
          loadAndCacheImagePlus(preImageIds[currentIdx], 1).then(() => {
            const previousTarget = this.state.preCornerstoneElement
            for (let i = 0; i < preBoxes.length; i++) {
              if (preBoxes[i].slice_idx === currentIdx) {
                if (preBoxes[i].uuid === undefined) {
                  console.log('pre addToolState init', i)
                  // cornerstone.updateImage(previousTarget)
                  const measurementData = {
                    noduleIndex: preBoxes[i].visibleIdx + 1,
                    visible: true,
                    active: i === newIndex,
                    color: undefined,
                    invalidated: true,
                    handles: {
                      start: {
                        x: preBoxes[i].x1,
                        y: preBoxes[i].y1,
                        highlight: false,
                        active: false,
                      },
                      end: {
                        x: preBoxes[i].x2,
                        y: preBoxes[i].y2,
                        highlight: false,
                        active: false,
                      },
                      textBox: {
                        active: false,
                        hasMoved: false,
                        movesIndependently: false,
                        drawnIndependently: true,
                        allowedOutsideImage: true,
                        hasBoundingBox: true,
                      },
                    },
                  }
                  cornerstoneTools.addToolState(previousTarget, 'RectangleRoi', measurementData)
                  let toolData = cornerstoneTools.getToolState(previousTarget, 'RectangleRoi')
                  const toolDataIndex = _.findIndex(toolData.data, function (o) {
                    let isEqual = false
                    const oHandles = o.handles
                    if (oHandles) {
                      if (oHandles.start.x === preBoxes[i].x1 && oHandles.start.y === preBoxes[i].y1 && oHandles.end.x === preBoxes[i].x2 && oHandles.end.y === preBoxes[i].y2) {
                        isEqual = true
                      }
                    }
                    return isEqual
                  })
                  if (toolDataIndex !== -1) {
                    preBoxes[i].uuid = toolData.data[toolDataIndex].uuid
                  }
                  // cornerstoneTools.setToolEnabledForElement(previousTarget, 'RectangleRoi')
                } else {
                  if (i === newIndex) {
                    console.log('pre addToolState init', preBoxes[i].uuid, currentIdx, this.state.preImageIdIndex)
                    let toolData = cornerstoneTools.getToolState(previousTarget, 'RectangleRoi')
                    if (toolData && toolData.data && toolData.data.length) {
                      const toolDataIndex = _.findIndex(toolData.data, { uuid: preBoxes[i].uuid })
                      const savedData = [].concat(toolData.data)
                      cornerstoneTools.clearToolState(previousTarget, 'RectangleRoi')
                      savedData.forEach((savedDataItem, savedDataItemIndex) => {
                        if (_.findIndex(preBoxes, { uuid: savedDataItem.uuid }) !== -1) {
                          savedDataItem.active = toolDataIndex === savedDataItemIndex
                          cornerstoneTools.addToolState(previousTarget, 'RectangleRoi', savedDataItem)
                        }
                      })
                    }
                  }
                }
              }
              // }
              this.setState({ preBoxes: preBoxes })
            }
          })
        }
      )
    }
  }

  onMatchNoduleChange(newNoduleNo, previousNoduleNo, idx) {
    if (typeof idx !== undefined || idx !== null) {
      const matchListsActiveIndex = this.state.matchListsActiveIndex
      this.setState({
        matchListsActiveIndex: matchListsActiveIndex === idx ? -1 : idx,
      })
    }
    console.log('onMatchNoduleChange', newNoduleNo, previousNoduleNo)
    const { curBoxes, curImageIds, preBoxes, preImageIds } = this.state
    if (curBoxes && curBoxes.length) {
      let curIndex = _.findIndex(curBoxes, { nodule_no: newNoduleNo })
      if (curIndex !== -1) {
        this.setState(
          {
            curImageIdIndex: curBoxes[curIndex].slice_idx,
          },
          () => {
            if (curBoxes[curIndex].uuid) {
              this.setCustomRetangleActive('cur', newNoduleNo)
            } else {
              const currentTarget = this.state.newCornerstoneElement
              const curNodule_uuid = this.drawCustomRectangleRoi(currentTarget, curBoxes[curIndex], curImageIds)
              curBoxes[curIndex] = curNodule_uuid
              this.setState({
                curBoxes,
              })
            }
          }
        )
      }
    }
    if (preBoxes && preBoxes.length) {
      let preIndex = _.findIndex(preBoxes, { nodule_no: previousNoduleNo })
      if (preIndex !== -1) {
        this.setState(
          {
            preImageIdIndex: preBoxes[preIndex].slice_idx,
          },
          () => {
            if (preBoxes[preIndex].uuid) {
              this.setCustomRetangleActive('pre', previousNoduleNo)
            } else {
              const currentTarget = this.state.preCornerstoneElement
              const preNodule_uuid = this.drawCustomRectangleRoi(currentTarget, preBoxes[preIndex], preImageIds)
              preBoxes[preIndex] = preNodule_uuid
              this.setState({
                preBoxes,
              })
            }
          }
        )
      }
    }
    // this.onNewNoduleChange(newNoduleNo)
    // this.onPreNoduleChange(previousNoduleNo)
    this.setState({ activeTool: 'RectangleRoi', activeMatchNewNoduleNo: newNoduleNo, activeMatchPreNoduleNo: previousNoduleNo })
  }

  onNewNoduleChange(noduleNo, idx) {
    if (typeof idx !== undefined || idx !== null) {
      const newListsActiveIndex = this.state.newListsActiveIndex
      console.log('onPreNoduleChange', newListsActiveIndex, idx, newListsActiveIndex === idx ? -1 : idx)
      this.setState({
        newListsActiveIndex: newListsActiveIndex === idx ? -1 : idx,
      })
    }
    const curBoxes = this.state.curBoxes
    let curIndex = _.findIndex(curBoxes, { nodule_no: noduleNo })
    if (curIndex !== -1 && !curBoxes[curIndex].uuid) {
      this.setState(
        {
          curImageIdIndex: curBoxes[curIndex].slice_idx,
        },
        () => {
          const currentTarget = this.state.newCornerstoneElement
          const curImageIds = this.state.curImageIds
          const curNodule_uuid = this.drawCustomRectangleRoi(currentTarget, curBoxes[curIndex], curImageIds)
          curBoxes[curIndex] = curNodule_uuid
          this.setState(
            {
              curBoxes,
            },
            () => {
              this.setCustomRetangleActive('cur', noduleNo)
            }
          )
        }
      )
    }
  }

  onPreNoduleChange(noduleNo, idx) {
    if (typeof idx !== undefined || idx !== null) {
      const vanishListsActiveIndex = this.state.vanishListsActiveIndex
      console.log('onPreNoduleChange', vanishListsActiveIndex, idx, vanishListsActiveIndex === idx ? -1 : idx)
      this.setState({
        vanishListsActiveIndex: vanishListsActiveIndex === idx ? -1 : idx,
      })
    }
    const preBoxes = this.state.preBoxes
    let preIndex = _.findIndex(preBoxes, { nodule_no: noduleNo })
    if (preIndex !== -1 && !preBoxes[preIndex].uuid) {
      this.setState(
        {
          preImageIdIndex: preBoxes[preIndex].slice_idx,
        },
        () => {
          const currentTarget = this.state.preCornerstoneElement
          const preImageIds = this.state.preImageIds
          const preNodule_uuid = this.drawCustomRectangleRoi(currentTarget, preBoxes[preIndex], preImageIds)
          preBoxes[preIndex] = preNodule_uuid
          this.setState(
            {
              preBoxes,
            },
            () => {
              this.setCustomRetangleActive('pre', noduleNo)
            }
          )
        }
      )
    }
  }

  drawCustomRectangleRoi(target, nodule, imageIds) {
    loadAndCacheImagePlus(imageIds[nodule.slice_idx - 1], 1).then(() => {
      const measurementData = {
        noduleIndex: nodule.visibleIdx + 1,
        visible: true,
        active: true,
        color: undefined,
        invalidated: true,
        handles: {
          start: {
            x: nodule.x1,
            y: nodule.y1,
            highlight: true,
            active: false,
          },
          end: {
            x: nodule.x2,
            y: nodule.y2,
            highlight: true,
            active: false,
          },
          textBox: {
            active: false,
            hasMoved: false,
            movesIndependently: false,
            drawnIndependently: true,
            allowedOutsideImage: true,
            hasBoundingBox: true,
          },
        },
      }
      cornerstoneTools.addToolState(target, 'RectangleRoi', measurementData)
      const toolData = cornerstoneTools.getToolState(target, 'RectangleRoi')
      const toolDataIndex = _.findIndex(toolData.data, function (o) {
        let isEqual = false
        const oHandles = o.handles
        if (oHandles) {
          if (oHandles.start.x === nodule.x1 && oHandles.start.y === nodule.y1 && oHandles.end.x === nodule.x2 && oHandles.end.y === nodule.y2) {
            isEqual = true
          }
        }
        return isEqual
      })
      if (toolDataIndex !== -1) {
        nodule.uuid = toolData.data[toolDataIndex].uuid
      }
      // cornerstoneTools.setToolEnabledForElement(target, 'RectangleRoi')
    })
    return nodule
  }
  // setCustomRetangleActive(type) {
  //   if (type === 'cur') {
  //     const { registerBoxes, newListsActiveIndex, curBoxes, newCornerstoneElement } = this.state
  //     let toolData = cornerstoneTools.getToolState(newCornerstoneElement, 'RectangleRoi')
  //     if (toolData && toolData.data && toolData.data.length) {
  //       let toolDataIndex = -1
  //       if (newListsActiveIndex !== -1) {
  //         let curIndex = -1
  //         if (registerBoxes && registerBoxes.new && registerBoxes.new.length) {
  //           curIndex = _.findIndex(curBoxes, { nodule_no: registerBoxes['new'][newListsActiveIndex].nodule_no })
  //         }
  //         if (curIndex !== -1) {
  //           toolDataIndex = _.findIndex(toolData.data, {
  //             uuid: curBoxes[curIndex].uuid,
  //           })
  //         }
  //       }
  //       const savedData = [].concat(toolData.data)
  //       cornerstoneTools.clearToolState(newCornerstoneElement, 'RectangleRoi')
  //       savedData.forEach((savedDataItem, savedDataItemIndex) => {
  //         if (_.findIndex(curBoxes, { uuid: savedDataItem.uuid }) !== -1) {
  //           savedDataItem.active = toolDataIndex === savedDataItemIndex
  //           cornerstoneTools.addToolState(newCornerstoneElement, 'RectangleRoi', savedDataItem)
  //         }
  //       })
  //     }
  //   } else if (type === 'pre') {
  //     const { registerBoxes, vanishListsActiveIndex, preBoxes, preCornerstoneElement } = this.state
  //     let toolData = cornerstoneTools.getToolState(preCornerstoneElement, 'RectangleRoi')
  //     if (toolData && toolData.data && toolData.data.length) {
  //       let toolDataIndex = -1
  //       if (vanishListsActiveIndex !== -1) {
  //         let preIndex = -1
  //         if (registerBoxes && registerBoxes.vanish && registerBoxes.vanish.length) {
  //           preIndex = _.findIndex(preBoxes, { nodule_no: registerBoxes['vanish'][vanishListsActiveIndex].nodule_no })
  //         }
  //         if (preIndex !== -1) {
  //           toolDataIndex = _.findIndex(toolData.data, {
  //             uuid: preBoxes[preIndex].uuid,
  //           })
  //         }
  //       }
  //       const savedData = [].concat(toolData.data)
  //       cornerstoneTools.clearToolState(preCornerstoneElement, 'RectangleRoi')
  //       savedData.forEach((savedDataItem, savedDataItemIndex) => {
  //         if (_.findIndex(preBoxes, { uuid: savedDataItem.uuid }) !== -1) {
  //           savedDataItem.active = toolDataIndex === savedDataItemIndex
  //           cornerstoneTools.addToolState(preCornerstoneElement, 'RectangleRoi', savedDataItem)
  //         }
  //       })
  //     }
  //   }
  // }
  setCustomRetangleActive(type, noduleNo) {
    if (type === 'cur') {
      const { newCornerstoneElement, curImageIds, curBoxes } = this.state
      let curIndex = _.findIndex(curBoxes, { nodule_no: noduleNo })
      if (curIndex !== -1) {
        const nodule = curBoxes[curIndex]
        loadAndCacheImagePlus(curImageIds[nodule.slice_idx], 1).then(() => {
          let toolData = cornerstoneTools.getToolState(newCornerstoneElement, 'RectangleRoi')
          if (toolData && toolData.data && toolData.data.length) {
            const toolDataIndex = _.findIndex(toolData.data, { uuid: nodule.uuid })
            const savedData = [].concat(toolData.data)
            cornerstoneTools.clearToolState(newCornerstoneElement, 'RectangleRoi')
            savedData.forEach((savedDataItem, savedDataItemIndex) => {
              if (_.findIndex(curBoxes, { uuid: savedDataItem.uuid }) !== -1) {
                savedDataItem.active = toolDataIndex === savedDataItemIndex
                cornerstoneTools.addToolState(newCornerstoneElement, 'RectangleRoi', savedDataItem)
              }
            })
          }
        })
      }
    } else if (type === 'pre') {
      const { preCornerstoneElement, preImageIds, preBoxes } = this.state
      let preIndex = _.findIndex(preBoxes, { nodule_no: noduleNo })
      if (preIndex !== -1) {
        const nodule = preBoxes[preIndex]
        loadAndCacheImagePlus(preImageIds[nodule.slice_idx], 1).then(() => {
          let toolData = cornerstoneTools.getToolState(preCornerstoneElement, 'RectangleRoi')
          if (toolData && toolData.data && toolData.data.length) {
            const toolDataIndex = _.findIndex(toolData.data, { uuid: nodule.uuid })
            const savedData = [].concat(toolData.data)
            cornerstoneTools.clearToolState(preCornerstoneElement, 'RectangleRoi')
            savedData.forEach((savedDataItem, savedDataItemIndex) => {
              if (_.findIndex(preBoxes, { uuid: savedDataItem.uuid }) !== -1) {
                savedDataItem.active = toolDataIndex === savedDataItemIndex
                cornerstoneTools.addToolState(preCornerstoneElement, 'RectangleRoi', savedDataItem)
              }
            })
          }
        })
      }
    }
  }
  // setCustomRetangleActive(target, nodule, imageIds, boxes) {
  //   cornerstone.loadImage(imageIds[nodule.slice_idx - 1]).then(() => {
  //     let toolData = cornerstoneTools.getToolState(target, 'RectangleRoi')
  //     if (toolData && toolData.data && toolData.data.length) {
  //       const toolDataIndex = _.findIndex(toolData.data, { uuid: nodule.uuid })
  //       const savedData = [].concat(toolData.data)
  //       cornerstoneTools.clearToolState(target, 'RectangleRoi')
  //       savedData.forEach((savedDataItem, savedDataItemIndex) => {
  //         if (_.findIndex(boxes, { uuid: savedDataItem.uuid }) !== -1) {
  //           savedDataItem.active = toolDataIndex === savedDataItemIndex
  //           cornerstoneTools.addToolState(target, 'RectangleRoi', savedDataItem)
  //         }
  //       })
  //     }
  //   })
  // }
  noduleTblCheckboxChange(checkedValues) {
    this.setState({ noduleTblCheckedValue: checkedValues })
    console.log('checkedValues', checkedValues)
  }

  toHideInfo() {
    this.setState(({ isOverlayVisible }) => ({
      isOverlayVisible: !isOverlayVisible,
    }))
  }

  toHidebox() {
    //   this.setState(({showNodules}) => ({showNodules:!showNodules}),()=>{
    //     if(showNodules){
    //       const newBoxes = this.state.newBoxes
    //       for(var i=0;i<curBoxes.length;i++){
    //       }
    //     }else{
    //     }
    //   })
  }

  toPulmonary() {
    const curVoi = this.state.curVoi
    const preVoi = this.state.preVoi
    curVoi.windowWidth = 1600
    curVoi.windowCenter = -600
    preVoi.windowWidth = 1600
    preVoi.windowCenter = -600
    this.setState({
      curVoi,
      preVoi,
    })
    // let newCornerstoneElement = this.state.newCornerstoneElement
    // let newViewport = cornerstone.getViewport(newCornerstoneElement)
    // newViewport.voi.windowWidth = 1600
    // newViewport.voi.windowCenter = -600
    // cornerstone.setViewport(newCornerstoneElement, newViewport)
    // let preCornerstoneElement = this.state.preCornerstoneElement
    // let preViewport = cornerstone.getViewport(preCornerstoneElement)
    // preViewport.voi.windowWidth = 1600
    // preViewport.voi.windowCenter = -600
    // cornerstone.setViewport(preCornerstoneElement, preViewport)
  }

  toVentralWindow() {
    const curVoi = this.state.curVoi
    const preVoi = this.state.preVoi
    curVoi.windowWidth = 400
    curVoi.windowCenter = 40
    preVoi.windowWidth = 400
    preVoi.windowCenter = 40
    this.setState({
      curVoi,
      preVoi,
    })
    // let newCornerstoneElement = this.state.newCornerstoneElement
    // let newViewport = cornerstone.getViewport(newCornerstoneElement)
    // newViewport.voi.windowWidth = 400
    // newViewport.voi.windowCenter = 40
    // cornerstone.setViewport(newCornerstoneElement, newViewport)
    // let preCornerstoneElement = this.state.preCornerstoneElement
    // let preViewport = cornerstone.getViewport(preCornerstoneElement)
    // preViewport.voi.windowWidth = 400
    // preViewport.voi.windowCenter = 40
    // cornerstone.setViewport(preCornerstoneElement, preViewport)
  }

  toMedia() {
    const curVoi = this.state.curVoi
    const preVoi = this.state.preVoi
    curVoi.windowWidth = 500
    curVoi.windowCenter = 50
    preVoi.windowWidth = 500
    preVoi.windowCenter = 50
    this.setState({
      curVoi,
      preVoi,
    })
    // let newCornerstoneElement = this.state.newCornerstoneElement
    // let newViewport = cornerstone.getViewport(newCornerstoneElement)
    // newViewport.voi.windowWidth = 500
    // newViewport.voi.windowCenter = 50
    // cornerstone.setViewport(newCornerstoneElement, newViewport)
    // let preCornerstoneElement = this.state.preCornerstoneElement
    // let preViewport = cornerstone.getViewport(preCornerstoneElement)
    // preViewport.voi.windowWidth = 500
    // preViewport.voi.windowCenter = 50
    // cornerstone.setViewport(preCornerstoneElement, preViewport)
  }

  toBoneWindow() {
    const curVoi = this.state.curVoi
    const preVoi = this.state.preVoi
    curVoi.windowWidth = 1000
    curVoi.windowCenter = 300
    preVoi.windowWidth = 1000
    preVoi.windowCenter = 300
    this.setState({
      curVoi,
      preVoi,
    })
    // let newCornerstoneElement = this.state.newCornerstoneElement
    // let newViewport = cornerstone.getViewport(newCornerstoneElement)
    // newViewport.voi.windowWidth = 1000
    // newViewport.voi.windowCenter = 300
    // cornerstone.setViewport(newCornerstoneElement, newViewport)
    // let preCornerstoneElement = this.state.preCornerstoneElement
    // let preViewport = cornerstone.getViewport(preCornerstoneElement)
    // preViewport.voi.windowWidth = 1000
    // preViewport.voi.windowCenter = 300
    // cornerstone.setViewport(preCornerstoneElement, preViewport)
  }

  ZoomIn() {
    let newCornerstoneElement = this.state.newCornerstoneElement
    let newViewport = cornerstone.getViewport(newCornerstoneElement)
    newViewport.scale *= 1.1
    cornerstone.setViewport(newCornerstoneElement, newViewport)
    let preCornerstoneElement = this.state.preCornerstoneElement
    let preViewport = cornerstone.getViewport(preCornerstoneElement)
    preViewport.scale *= 1.1
    cornerstone.setViewport(preCornerstoneElement, preViewport)
  }

  ZoomOut() {
    let newCornerstoneElement = this.state.newCornerstoneElement
    let newViewport = cornerstone.getViewport(newCornerstoneElement)
    newViewport.scale *= 0.9
    cornerstone.setViewport(newCornerstoneElement, newViewport)
    let preCornerstoneElement = this.state.preCornerstoneElement
    let preViewport = cornerstone.getViewport(preCornerstoneElement)
    preViewport.scale *= 0.9
    cornerstone.setViewport(preCornerstoneElement, preViewport)
  }

  imagesFlip() {
    const curVoi = this.state.curVoi
    const preVoi = this.state.preVoi
    curVoi.invert = !curVoi.invert
    preVoi.invert = !preVoi.invert
    this.setState({
      curVoi,
      preVoi,
    })
    // let newCornerstoneElement = this.state.newCornerstoneElement
    // let newViewport = cornerstone.getViewport(newCornerstoneElement)
    // newViewport.invert = !newViewport.invert
    // cornerstone.setViewport(newCornerstoneElement, newViewport)
    // let preCornerstoneElement = this.state.preCornerstoneElement
    // let preViewport = cornerstone.getViewport(preCornerstoneElement)
    // preViewport.invert = !preViewport.invert
    // cornerstone.setViewport(preCornerstoneElement, preViewport)
  }

  reset() {
    let newCornerstoneElement = this.state.newCornerstoneElement
    let newViewport = cornerstone.getViewport(newCornerstoneElement)
    newViewport.translation = {
      x: 0,
      y: 0,
    }
    newViewport.scale = 1.2

    cornerstone.setViewport(newCornerstoneElement, newViewport)
    let preCornerstoneElement = this.state.preCornerstoneElement
    let preViewport = cornerstone.getViewport(preCornerstoneElement)
    preViewport.translation = {
      x: 0,
      y: 0,
    }
    preViewport.scale = 1.2

    cornerstone.setViewport(preCornerstoneElement, preViewport)
  }

  // playAnimation() {
  //   this.setState(({ isPlaying }) => ({
  //     isPlaying: !isPlaying,
  //   }))

  // }

  wwwcCustom() {
    this.setState({ activeTool: 'Wwwc' })
  }

  ScrollStack() {
    this.setState({ activeTool: 'StackScroll' })
  }

  startAnnos() {
    this.setState({ activeTool: 'RectangleRoi' })
  }

  bidirectionalMeasure() {
    this.setState({ activeTool: 'Bidirectional' })
  }

  lengthMeasure() {
    this.setState({ activeTool: 'Length' })
  }

  eraseAnno() {
    this.setState({ activeTool: 'Eraser' })
  }
  onChangeViewportSort() {
    this.setState((prevState) => ({
      sortChanged: !prevState.sortChanged,
    }))
    this.changeImageIndex('cur')
    this.changeImageIndex('pre')
  }
  render() {
    const welcome = '????????????' + localStorage.realname
    const {
      curListsActiveIndex,
      preListsActiveIndex,
      matchListsActiveIndex,
      newListsActiveIndex,
      vanishListsActiveIndex,
      registerBoxes,
      templateText,
      noduleTblCheckedValue,
      activeTool,
      curBoxes,
      preBoxes,
      curVoi,
      preVoi,
      sortChanged,

      tableHeight,
      reportGuideActive,
      reportImageActive,
      reportGuideType,
      reportImageType,
      reportGuideText,
      reportImageText,
      reportImageTop,
      reportImageHeight,
      reportImageContentHeight,
      matchNodulesAllChecked,

      activeMatchNewNoduleNo,
      activeMatchPreNoduleNo,
      HUSliderRange,
    } = this.state
    let curBoxesAccord = ''
    let preBoxesAccord = ''
    var newNodulesTbl = ''
    var vanishNodulesTbl = ''
    var matchNodulesTbl = ''
    var matchNoduleLen = 0
    var newNoduleLen = 0
    var vanishNoduleLen = 0
    let noduleNumber = 0
    let featureModal
    const repretationOptions = [
      { key: '??????', text: '??????', value: '??????' },
      { key: '??????', text: '??????', value: '??????' },
      { key: '??????', text: '??????', value: '??????' },
      { key: '????????????', text: '????????????', value: '????????????' },
      { key: '????????????', text: '????????????', value: '????????????' },
      { key: '??????', text: '??????', value: '??????' },
      { key: '??????', text: '??????', value: '??????' },
      { key: '???????????????', text: '???????????????', value: '???????????????' },
    ]

    if (registerBoxes && registerBoxes.match && registerBoxes.new && registerBoxes.vanish) {
      matchNoduleLen = registerBoxes['match'].length
      newNoduleLen = registerBoxes['new'].length
      vanishNoduleLen = registerBoxes['vanish'].length
    }
    if (curBoxes && curBoxes.length) {
      curBoxesAccord = curBoxes.map((inside, idx) => {
        if (inside.visible) {
          noduleNumber += 1
        }
        let representArray = []
        let locationValues = ''
        let matchInfo = ''
        const visualId = 'visual-' + idx
        let ll = 0
        let sl = 0
        if (inside.measure !== undefined && inside.measure !== null) {
          ll = Math.sqrt(Math.pow(inside.measure.x1 - inside.measure.x2, 2) + Math.pow(inside.measure.y1 - inside.measure.y2, 2))
          sl = Math.sqrt(Math.pow(inside.measure.x3 - inside.measure.x4, 2) + Math.pow(inside.measure.y3 - inside.measure.y4, 2))
          if (isNaN(ll)) {
            ll = 0
          }
          if (isNaN(sl)) {
            sl = 0
          }
          if (
            inside.measure.x1 === 0 &&
            inside.measure.y1 === 0 &&
            inside.measure.x2 === 0 &&
            inside.measure.y2 === 0 &&
            inside.measure.x3 === 0 &&
            inside.measure.y3 === 0 &&
            inside.measure.x4 === 0 &&
            inside.measure.y4 === 0
          ) {
            ll = 0
            sl = 0
          }
        }
        let diameter = inside.diameter

        // let showMeasure = measureStateList[idx]
        // let showMask = maskStateList[idx]
        if (inside.lobulation === 2) {
          representArray.push('??????')
        }
        if (inside.spiculation === 2) {
          representArray.push('??????')
        }
        // if (inside.calcification === 2) {
        //   representArray.push('??????')
        // }
        if (inside.pin === 2) {
          representArray.push('????????????')
        }
        if (inside.cav === 2) {
          representArray.push('??????')
        }
        if (inside.vss === 2) {
          representArray.push('????????????')
        }
        if (inside.bea === 2) {
          representArray.push('??????')
        }
        if (inside.bro === 2) {
          representArray.push('???????????????')
        }
        if (inside.segment && inside.segment !== 'None') {
          locationValues = lungLoc[inside.segment].split('-').join('/')
        } else {
          if (inside.place) {
            locationValues = [nodulePlaces[inside.place]]
          } else {
            locationValues = ['????????????']
          }
        }
        var matchFlag = false
        if (registerBoxes.match && registerBoxes.match.length) {
          for (let i = 0; i < registerBoxes.match.length; i++) {
            if (registerBoxes.match[i].later.nodule_no === inside.nodule_no) {
              const previousIdx = _.findIndex(preBoxes, { nodule_no: registerBoxes.match[i].earlier.nodule_no })
              matchInfo = <Tag className="antd-tag-custom-color">{`P${previousIdx + 1}??????`}</Tag>
              matchFlag = true
              break
            }
          }
        }
        if (!matchFlag) {
          matchInfo = <Tag className="antd-tag-custom-color">?????????</Tag>
        }
        // if(this.state.readonly){
        if (inside.visible) {
          return (
            <div key={idx} className={'highlightTbl' + (curListsActiveIndex === idx ? ' highlightTbl-active' : '')}>
              <Accordion.Title onClick={this.handleListClick.bind(this, inside.slice_idx, idx, 'current')} active={curListsActiveIndex === idx} index={idx}>
                <div className="nodule-accordion-item-title">
                  <div className="nodule-accordion-item-title-index nodule-accordion-item-title-column">
                    <div style={inside.modified === undefined ? { fontSize: 'large', color: 'whitesmoke' } : { fontSize: 'large', color: '#dbce12' }}>{inside.visibleIdx + 1}</div>
                  </div>
                  <div className="nodule-accordion-item-title-column">
                    {/* <Checkbox
                      className="nodule-accordion-item-title-checkbox"
                      checked={inside.checked}
                      onChange={this.onHandleNoduleCheckChange.bind(this, idx, 'current')}
                      onClick={this.onHandleNoduleCheckClick.bind(this)}> */}
                    <div className="nodule-accordion-item-title-slice-idx">{parseInt(inside.slice_idx) + 1}</div>
                    {/* </Checkbox> */}
                  </div>
                  <div className="nodule-accordion-item-title-type nodule-accordion-item-title-column">
                    <Select
                      className="nodule-accordion-item-title-select"
                      dropdownMatchSelectWidth={false}
                      defaultValue={inside.texture}
                      value={inside.texture}
                      bordered={false}
                      showArrow={false}
                      dropdownClassName={'corner-select-dropdown'}
                      onChange={this.onSelectTex.bind(this, idx, 'current')}
                      onClick={this.onSelectTexClick.bind(this)}>
                      <Option className="nodule-accordion-item-title-select-option" value={-1}>
                        ??????
                      </Option>
                      <Option className="nodule-accordion-item-title-select-option" value={1}>
                        ?????????
                      </Option>
                      <Option className="nodule-accordion-item-title-select-option" value={2}>
                        ??????
                      </Option>
                      <Option className="nodule-accordion-item-title-select-option" value={3}>
                        ?????????
                      </Option>
                      <Option className="nodule-accordion-item-title-select-option" value={4}>
                        ??????
                      </Option>
                    </Select>
                  </div>

                  {ll === 0 && sl === 0 ? (
                    <div className="nodule-accordion-item-title-shape nodule-accordion-item-title-column">{(diameter / 10).toFixed(2) + '\xa0cm'}</div>
                  ) : (
                    <div className="nodule-accordion-item-title-shape nodule-accordion-item-title-column">{(ll / 10).toFixed(2) + '??' + (sl / 10).toFixed(2) + '\xa0cm'}</div>
                  )}

                  <div className="nodule-accordion-item-title-column">
                    <div className="nodule-accordion-item-title-location">
                      {/* <Cascader
                        className="nodule-accordion-item-title-cascader"
                        bordered={false}
                        suffixIcon={null}
                        allowClear={false}
                        value={locationValues}
                        options={this.config.segment}
                        dropdownRender={(menus) => {
                          return <div onClick={this.onSelectPlaceClick.bind(this)}>{menus}</div>
                        }}
                        onChange={this.onSelectPlace.bind(this, idx, 'current')}
                        onClick={this.onSelectPlaceClick.bind(this)}
                      /> */}
                      {locationValues}
                    </div>

                    <div className="nodule-accordion-item-title-mal">
                      <Select
                        className={'nodule-accordion-item-title-select ' + ` nodule-accordion-item-title-select-${inside.malignancy}`}
                        defaultValue={inside.malignancy}
                        dropdownMatchSelectWidth={false}
                        value={inside.malignancy}
                        bordered={false}
                        showArrow={false}
                        dropdownClassName={'corner-select-dropdown'}
                        onChange={this.onSelectMal.bind(this, idx, 'current')}
                        onClick={this.onSelectMalClick.bind(this)}>
                        <Option className={'nodule-accordion-item-title-select-option'} value={-1}>
                          ??????
                        </Option>
                        <Option className={'nodule-accordion-item-title-select-option'} value={1}>
                          ??????
                        </Option>
                        <Option className={'nodule-accordion-item-title-select-option'} value={2}>
                          ??????
                        </Option>
                        <Option className={'nodule-accordion-item-title-select-option'} value={3}>
                          ??????
                        </Option>
                      </Select>
                    </div>
                  </div>
                </div>
              </Accordion.Title>
              <Accordion.Content active={curListsActiveIndex === idx}>
                <div className="nodule-accordion-item-content">
                  <div className="nodule-accordion-item-content-info">
                    {/* <Grid.Column widescreen={6} computer={6}>
              {'\xa0\xa0' + (ll / 10).toFixed(2) + '\xa0\xa0' + ' ??' + '\xa0\xa0' + (sl / 10).toFixed(2) + ' cm'}
            </Grid.Column> */}
                    <div className="nodule-accordion-item-content-info-diam">{inside.volume !== undefined ? (Math.floor(inside.volume * 100) / 100).toFixed(2) + '\xa0cm??' : null}</div>
                    <div className="nodule-accordion-item-content-info-hu">
                      <div className="nodule-accordion-item-content-info-hublock">{inside.huMin !== undefined && inside.huMax !== undefined ? inside.huMin + '~' + inside.huMax + 'HU' : null}</div>
                      <div className="nodule-accordion-item-content-info-mblock">
                        <div className="nodule-accordion-item-content-info-match">{matchInfo}</div>
                        {matchFlag ? (
                          <div className="nodule-accordion-item-content-info-match-delete">
                            <Icon inverted color="grey" name="trash alternate" onClick={this.onConfirmDelNodule.bind(this, idx, 'current')}></Icon>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  {/* <Grid.Column widescreen={3} computer={3} textAlign='center'>
                                        <select id={texId} style={selectStyle} defaultValue="" disabled>
                                        <option value="" disabled="disabled">????????????</option>
                                        </select>
                                    </Grid.Column> */}

                  <div className="nodule-accordion-item-content-char">
                    <div className="nodule-accordion-item-content-char-title">?????????</div>
                    <div className="nodule-accordion-item-content-char-content">
                      <Select
                        className={'nodule-accordion-item-content-select'}
                        mode="multiple"
                        dropdownMatchSelectWidth={false}
                        placeholder="???????????????"
                        defaultValue={inside.malignancy}
                        value={representArray}
                        bordered={false}
                        showArrow={false}
                        dropdownClassName={'corner-select-dropdown'}
                        onChange={this.representChange.bind(this, idx, 'current')}
                        onClick={this.representClick.bind(this)}>
                        <Option className={'nodule-accordion-item-content-select-option'} value={'??????'}>
                          ??????
                        </Option>
                        <Option className={'nodule-accordion-item-content-select-option'} value={'??????'}>
                          ??????
                        </Option>
                        {/* <Option className={'nodule-accordion-item-content-select-option'} value={'??????'}>
                          ??????
                        </Option> */}
                        <Option className={'nodule-accordion-item-content-select-option'} value={'????????????'}>
                          ????????????
                        </Option>
                        <Option className={'nodule-accordion-item-content-select-option'} value={'????????????'}>
                          ????????????
                        </Option>
                        <Option className={'nodule-accordion-item-content-select-option'} value={'??????'}>
                          ??????
                        </Option>
                        <Option className={'nodule-accordion-item-content-select-option'} value={'??????'}>
                          ??????
                        </Option>
                        <Option className={'nodule-accordion-item-content-select-option'} value={'???????????????'}>
                          ???????????????
                        </Option>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* <div id={visualId} className='histogram'></div> */}
              </Accordion.Content>
            </div>
          )
        } else {
          return null
        }
        // }
      })
    }

    if (preBoxes && preBoxes.length) {
      preBoxesAccord = preBoxes.map((inside, idx) => {
        if (inside.visible) {
          noduleNumber += 1
        }
        let representArray = []
        let locationValues = ''
        let matchInfo = ''
        const visualId = 'visual-' + idx
        let ll = 0
        let sl = 0
        if (inside.measure !== undefined && inside.measure !== null) {
          ll = Math.sqrt(Math.pow(inside.measure.x1 - inside.measure.x2, 2) + Math.pow(inside.measure.y1 - inside.measure.y2, 2))
          sl = Math.sqrt(Math.pow(inside.measure.x3 - inside.measure.x4, 2) + Math.pow(inside.measure.y3 - inside.measure.y4, 2))
          if (isNaN(ll)) {
            ll = 0
          }
          if (isNaN(sl)) {
            sl = 0
          }
          if (
            inside.measure.x1 === 0 &&
            inside.measure.y1 === 0 &&
            inside.measure.x2 === 0 &&
            inside.measure.y2 === 0 &&
            inside.measure.x3 === 0 &&
            inside.measure.y3 === 0 &&
            inside.measure.x4 === 0 &&
            inside.measure.y4 === 0
          ) {
            ll = 0
            sl = 0
          }
        }
        let diameter = inside.diameter

        // let showMeasure = measureStateList[idx]
        // let showMask = maskStateList[idx]
        if (inside.lobulation === 2) {
          representArray.push('??????')
        }
        if (inside.spiculation === 2) {
          representArray.push('??????')
        }
        // if (inside.calcification === 2) {
        //   representArray.push('??????')
        // }
        if (inside.pin === 2) {
          representArray.push('????????????')
        }
        if (inside.cav === 2) {
          representArray.push('??????')
        }
        if (inside.vss === 2) {
          representArray.push('????????????')
        }
        if (inside.bea === 2) {
          representArray.push('??????')
        }
        if (inside.bro === 2) {
          representArray.push('???????????????')
        }
        if (inside.segment && inside.segment !== 'None') {
          locationValues = lungLoc[inside.segment].split('-').join('/')
        } else {
          if (inside.place) {
            locationValues = [nodulePlaces[inside.place]]
          } else {
            locationValues = ['????????????']
          }
        }
        var matchFlag = false
        if (registerBoxes.match && registerBoxes.match.length) {
          for (let i = 0; i < registerBoxes.match.length; i++) {
            if (registerBoxes.match[i].earlier.nodule_no === inside.nodule_no) {
              const currentIdx = _.findIndex(curBoxes, { nodule_no: registerBoxes.match[i].later.nodule_no })
              matchInfo = <Tag className="antd-tag-custom-color">{`N${currentIdx + 1}??????`}</Tag>
              matchFlag = true
              break
            }
          }
        }
        if (!matchFlag) {
          matchInfo = <Tag className="antd-tag-custom-color">?????????</Tag>
        }

        // if(this.state.readonly){
        if (inside.visible) {
          return (
            <div key={idx} className={'highlightTbl' + (preListsActiveIndex === idx ? ' highlightTbl-active' : '')}>
              <Accordion.Title onClick={this.handleListClick.bind(this, inside.slice_idx, idx, 'previous')} active={preListsActiveIndex === idx} index={idx}>
                <div className="nodule-accordion-item-title">
                  <div className="nodule-accordion-item-title-index nodule-accordion-item-title-column">
                    <div style={inside.modified === undefined ? { fontSize: 'large', color: 'whitesmoke' } : { fontSize: 'large', color: '#dbce12' }}>{inside.visibleIdx + 1}</div>
                  </div>
                  <div className="nodule-accordion-item-title-column">
                    {/* <Checkbox
                      className="nodule-accordion-item-title-checkbox"
                      checked={inside.checked}
                      onChange={this.onHandleNoduleCheckChange.bind(this, idx, 'previous')}
                      onClick={this.onHandleNoduleCheckClick.bind(this)}> */}
                    <div className="nodule-accordion-item-title-slice-idx">{parseInt(inside.slice_idx) + 1}</div>
                    {/* </Checkbox> */}
                  </div>
                  <div className="nodule-accordion-item-title-type nodule-accordion-item-title-column">
                    <Select
                      className="nodule-accordion-item-title-select"
                      dropdownMatchSelectWidth={false}
                      defaultValue={inside.texture}
                      value={inside.texture}
                      bordered={false}
                      showArrow={false}
                      dropdownClassName={'corner-select-dropdown'}
                      onChange={this.onSelectTex.bind(this, idx, 'previous')}
                      onClick={this.onSelectTexClick.bind(this)}>
                      <Option className="nodule-accordion-item-title-select-option" value={-1}>
                        ??????
                      </Option>
                      <Option className="nodule-accordion-item-title-select-option" value={1}>
                        ?????????
                      </Option>
                      <Option className="nodule-accordion-item-title-select-option" value={2}>
                        ??????
                      </Option>
                      <Option className="nodule-accordion-item-title-select-option" value={3}>
                        ?????????
                      </Option>
                      <Option className="nodule-accordion-item-title-select-option" value={4}>
                        ??????
                      </Option>
                    </Select>
                  </div>
                  {ll === 0 && sl === 0 ? (
                    <div className="nodule-accordion-item-title-shape nodule-accordion-item-title-column">{(diameter / 10).toFixed(2) + '\xa0cm'}</div>
                  ) : (
                    <div className="nodule-accordion-item-title-shape nodule-accordion-item-title-column">{(ll / 10).toFixed(2) + '??' + (sl / 10).toFixed(2) + '\xa0cm'}</div>
                  )}

                  <div className="nodule-accordion-item-title-column">
                    <div className="nodule-accordion-item-title-location">
                      {/* <Cascader
                        className="nodule-accordion-item-title-cascader"
                        bordered={false}
                        suffixIcon={null}
                        allowClear={false}
                        value={locationValues}
                        options={this.config.segment}
                        dropdownRender={(menus) => {
                          return <div onClick={this.onSelectPlaceClick.bind(this)}>{menus}</div>
                        }}
                        onChange={this.onSelectPlace.bind(this, idx, 'previous')}
                        onClick={this.onSelectPlaceClick.bind(this)}
                      /> */}
                      {locationValues}
                    </div>

                    <div className="nodule-accordion-item-title-mal">
                      <Select
                        className={'nodule-accordion-item-title-select ' + ` nodule-accordion-item-title-select-${inside.malignancy}`}
                        defaultValue={inside.malignancy}
                        dropdownMatchSelectWidth={false}
                        value={inside.malignancy}
                        bordered={false}
                        showArrow={false}
                        dropdownClassName={'corner-select-dropdown'}
                        onChange={this.onSelectMal.bind(this, idx, 'previous')}
                        onClick={this.onSelectMalClick.bind(this)}>
                        <Option className={'nodule-accordion-item-title-select-option'} value={-1}>
                          ??????
                        </Option>
                        <Option className={'nodule-accordion-item-title-select-option'} value={1}>
                          ??????
                        </Option>
                        <Option className={'nodule-accordion-item-title-select-option'} value={2}>
                          ??????
                        </Option>
                        <Option className={'nodule-accordion-item-title-select-option'} value={3}>
                          ??????
                        </Option>
                      </Select>
                    </div>
                  </div>
                </div>
              </Accordion.Title>
              <Accordion.Content active={preListsActiveIndex === idx}>
                <div className="nodule-accordion-item-content">
                  <div className="nodule-accordion-item-content-info">
                    {/* <Grid.Column widescreen={6} computer={6}>
              {'\xa0\xa0' + (ll / 10).toFixed(2) + '\xa0\xa0' + ' ??' + '\xa0\xa0' + (sl / 10).toFixed(2) + ' cm'}
            </Grid.Column> */}
                    <div className="nodule-accordion-item-content-info-diam">{inside.volume !== undefined ? (Math.floor(inside.volume * 100) / 100).toFixed(2) + '\xa0cm??' : null}</div>
                    <div className="nodule-accordion-item-content-info-hu">
                      <div className="nodule-accordion-item-content-info-hublock">{inside.huMin !== undefined && inside.huMax !== undefined ? inside.huMin + '~' + inside.huMax + 'HU' : null}</div>
                      <div className="nodule-accordion-item-content-info-mblock">
                        <div className="nodule-accordion-item-content-info-match">{matchInfo}</div>
                        {matchFlag ? (
                          <div className="nodule-accordion-item-content-info-match-delete">
                            <Icon inverted color="grey" name="trash alternate" onClick={this.onConfirmDelNodule.bind(this, idx, 'previous')}></Icon>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  {/* <Grid.Column widescreen={3} computer={3} textAlign='center'>
                                        <select id={texId} style={selectStyle} defaultValue="" disabled>
                                        <option value="" disabled="disabled">????????????</option>
                                        </select>
                                    </Grid.Column> */}

                  <div className="nodule-accordion-item-content-char">
                    <div className="nodule-accordion-item-content-char-title">?????????</div>
                    <div className="nodule-accordion-item-content-char-content">
                      <Select
                        className={'nodule-accordion-item-content-select'}
                        mode="multiple"
                        dropdownMatchSelectWidth={false}
                        placeholder="???????????????"
                        defaultValue={inside.malignancy}
                        value={representArray}
                        bordered={false}
                        showArrow={false}
                        dropdownClassName={'corner-select-dropdown'}
                        onChange={this.representChange.bind(this, idx, 'previous')}
                        onClick={this.representClick.bind(this)}>
                        <Option className={'nodule-accordion-item-content-select-option'} value={'??????'}>
                          ??????
                        </Option>
                        <Option className={'nodule-accordion-item-content-select-option'} value={'??????'}>
                          ??????
                        </Option>
                        {/* <Option className={'nodule-accordion-item-content-select-option'} value={'??????'}>
                          ??????
                        </Option> */}
                        <Option className={'nodule-accordion-item-content-select-option'} value={'????????????'}>
                          ????????????
                        </Option>
                        <Option className={'nodule-accordion-item-content-select-option'} value={'????????????'}>
                          ????????????
                        </Option>
                        <Option className={'nodule-accordion-item-content-select-option'} value={'??????'}>
                          ??????
                        </Option>
                        <Option className={'nodule-accordion-item-content-select-option'} value={'??????'}>
                          ??????
                        </Option>
                        <Option className={'nodule-accordion-item-content-select-option'} value={'???????????????'}>
                          ???????????????
                        </Option>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* <div id={visualId} className='histogram'></div> */}
              </Accordion.Content>
            </div>
          )
        } else {
          return null
        }
        // }
      })
    }

    if (matchNoduleLen !== 0) {
      matchNodulesTbl = registerBoxes['match'].map((value, idx) => {
        var VDT = 0
        var MDT = 0
        var doublingType = ''
        const previousNodule = value['earlier']
        const newNodule = value['later']
        var followupLoc = ''
        var newLoc = newNodule.segment
        var previousLoc = previousNodule.segment
        var newRepresentArray = []
        var preRepresentArray = []
        let newNoduleLength = 0
        let newNoduleWidth = 0
        let preNoduleLength = 0
        let preNoduleWidth = 0
        let newLocationValues
        let preLocationValues

        if (newNodule.segment && newNodule.segment !== 'None') {
          newLocationValues = lungLoc[newNodule.segment].split('-').join('/')
        } else {
          if (newNodule.place) {
            newLocationValues = [nodulePlaces[newNodule.place]]
          } else {
            newLocationValues = ['????????????']
          }
        }
        if (previousNodule.segment && previousNodule.segment !== 'None') {
          preLocationValues = lungLoc[previousNodule.segment].split('-').join('/')
        } else {
          if (previousNodule.place) {
            preLocationValues = [nodulePlaces[previousNodule.place]]
          } else {
            preLocationValues = ['????????????']
          }
        }
        if (newNodule.measure !== undefined && newNodule.measure !== null) {
          newNoduleLength = Math.sqrt(Math.pow(newNodule.measure.x1 - newNodule.measure.x2, 2) + Math.pow(newNodule.measure.y1 - newNodule.measure.y2, 2))
          newNoduleWidth = Math.sqrt(Math.pow(newNodule.measure.x3 - newNodule.measure.x4, 2) + Math.pow(newNodule.measure.y3 - newNodule.measure.y4, 2))
          if (isNaN(newNoduleLength)) {
            newNoduleLength = 0
          }
          if (isNaN(newNoduleWidth)) {
            newNoduleWidth = 0
          }
        }

        if (previousNodule.measure !== undefined && previousNodule.measure !== null) {
          preNoduleLength = Math.sqrt(Math.pow(previousNodule.measure.x1 - previousNodule.measure.x2, 2) + Math.pow(previousNodule.measure.y1 - previousNodule.measure.y2, 2))
          preNoduleWidth = Math.sqrt(Math.pow(previousNodule.measure.x3 - previousNodule.measure.x4, 2) + Math.pow(previousNodule.measure.y3 - previousNodule.measure.y4, 2))
          if (isNaN(preNoduleLength)) {
            preNoduleLength = 0
          }
          if (isNaN(preNoduleWidth)) {
            preNoduleWidth = 0
          }
        }

        if (newNodule['volume'] > previousNodule['volume']) {
          doublingType = '??????'
        } else if (newNodule['volume'] < previousNodule['volume']) {
          doublingType = '??????'
        } else {
          doublingType = '??????'
        }

        if (newNodule['volume'] !== 0 && previousNodule['volume'] !== 0) {
          const curDate = this.props.curDate
          const preDate = this.props.preDate
          var curTime = new Date()
          var preTime = new Date()
          curTime.setFullYear(curDate.substring(0, 4), curDate.substring(4, 6), curDate.substring(6, 8))
          preTime.setFullYear(preDate.substring(0, 4), preDate.substring(4, 6), preDate.substring(6, 8))

          var interval = Math.floor((curTime - preTime) / (24 * 3600 * 1000))
          var cur_nodule_volume = newNodule['volume']
          var pre_nodule_volume = previousNodule['volume']
          if (cur_nodule_volume / pre_nodule_volume !== 1) {
            VDT = (interval * (Math.LN2 / Math.log(cur_nodule_volume / pre_nodule_volume))).toFixed(0)
            MDT = ((interval * Math.LN2) / Math.log((cur_nodule_volume * (1000 + newNodule['huMean'])) / (pre_nodule_volume * (1000 + previousNodule['huMean'])))).toFixed(0)
          }
        }

        if (newLoc === previousLoc) {
          followupLoc = newLoc
        } else {
          followupLoc = 'None'
        }

        if (newNodule.lobulation === 2) {
          newRepresentArray.push('??????')
        }
        if (newNodule.spiculation === 2) {
          newRepresentArray.push('??????')
        }
        // if (newNodule.calcification === 2) {
        //   newRepresentArray.push('??????')
        // }
        if (newNodule.pin === 2) {
          newRepresentArray.push('????????????')
        }
        if (newNodule.cav === 2) {
          newRepresentArray.push('??????')
        }
        if (newNodule.vss === 2) {
          newRepresentArray.push('????????????')
        }
        if (newNodule.bea === 2) {
          newRepresentArray.push('??????')
        }
        if (newNodule.bro === 2) {
          newRepresentArray.push('???????????????')
        }

        if (previousNodule.lobulation === 2) {
          preRepresentArray.push('??????')
        }
        if (previousNodule.spiculation === 2) {
          preRepresentArray.push('??????')
        }
        // if (previousNodule.calcification === 2) {
        //   preRepresentArray.push('??????')
        // }
        if (previousNodule.pin === 2) {
          preRepresentArray.push('????????????')
        }
        if (previousNodule.cav === 2) {
          preRepresentArray.push('??????')
        }
        if (previousNodule.vss === 2) {
          preRepresentArray.push('????????????')
        }
        if (previousNodule.bea === 2) {
          preRepresentArray.push('??????')
        }
        if (previousNodule.bro === 2) {
          preRepresentArray.push('???????????????')
        }
        return (
          <Row
            key={idx}
            justify="center"
            className={'register-nodule-card' + (matchListsActiveIndex === idx ? ' register-nodule-card-active' : '')}
            onClick={this.onMatchNoduleChange.bind(this, newNodule.nodule_no, previousNodule.nodule_no, idx)}>
            <Col span={2} className="register-nodule-card-note">
              <Row className="register-nodule-card-first">
                <Checkbox
                  className="nodule-accordion-item-title-checkbox"
                  checked={newNodule.checked && previousNodule.checked}
                  onChange={this.onHandleMatchNoduleCheckChange.bind(this, idx)}
                  onClick={this.onHandleMatchNoduleCheckClick.bind(this)}></Checkbox>
              </Row>
              {/* checkbox */}
              <Row className="register-nodule-card-second">{'N' + (newNodule.visibleIdx + 1)}</Row>
              <Row className="register-nodule-card-second">{'P' + (previousNodule.visibleIdx + 1)}</Row>
            </Col>

            <Col span={22} className="register-nodule-card-content">
              <Row className="register-nodule-card-first">
                <Col span={12} className="register-nodule-card-content-first">
                  ?????????
                  {/* <Cascader
                    className="nodule-accordion-item-title-cascader"
                    bordered={false}
                    suffixIcon={null}
                    allowClear={false}
                    value={newLocationValues}
                    options={this.config.segment}
                    dropdownRender={(menus) => {
                      return <div onClick={this.onSelectPlaceClick.bind(this)}>{menus}</div>
                    }}
                    onChange={this.onSelectPlace.bind(this, idx, 'match-cur')}
                    onClick={this.onSelectPlaceClick.bind(this)}
                  /> */}
                  {newLocationValues}
                  {/* <Cascader options={this.config.segment} onChange={this.onLungLocationChange.bind(this, idx, 'register-match')}>
                    <a href="#">{lungLoc[followupLoc]}</a>
                  </Cascader> */}
                </Col>
                <Col span={4} className="register-nodule-card-content-first">
                  ????????????: <p className="doublingTypeText">{doublingType}</p>
                </Col>
                <Col span={3} className="register-nodule-card-content-first">
                  <p className="VDTText">
                    {'VDT : '}
                    <span className={VDT > 0 && VDT < 400 ? 'VDTText-highlight' : ''}>{VDT}</span>
                  </p>
                </Col>
                <Col span={3} className="register-nodule-card-content-first">
                  <p className="MDTText">{'MDT : ' + MDT}</p>
                </Col>
                <Col span={2}>
                  <Button size="mini" circular inverted icon="chart bar" title="????????????" value={idx} onClick={this.featureAnalysis.bind(this, idx)}></Button>
                </Col>
              </Row>
              <Row className="register-nodule-card-second" align="middle" wrap={false}>
                <Col span={2}>{`IM ${newNodule.slice_idx + 1}`}</Col>
                <Col span={8} className="register-nodule-card-second-center">
                  <div className="register-nodule-card-text register-nodule-card-text-length">{newNoduleLength.toFixed(1) + '*' + newNoduleWidth.toFixed(1) + 'mm'}</div>
                  <div className="register-nodule-card-text register-nodule-card-text-volume">{newNodule.volume !== undefined ? Math.floor(newNodule.volume * 1000).toFixed(1) + 'mm??' : null}</div>
                  <div className="register-nodule-card-text register-nodule-card-text-hu">{newNodule.huMin + '~' + newNodule.huMax + 'HU'}</div>
                </Col>
                <Col span={4} className="register-nodule-card-select-center">
                  ?????????
                  <Select
                    className="nodule-accordion-item-title-select"
                    dropdownMatchSelectWidth={false}
                    defaultValue={newNodule.texture}
                    value={newNodule.texture}
                    bordered={false}
                    showArrow={false}
                    dropdownClassName={'corner-select-dropdown'}
                    onChange={this.onSelectTex.bind(this, idx, 'match-cur')}
                    onClick={this.onSelectTexClick.bind(this)}>
                    <Option className="nodule-accordion-item-title-select-option" value={-1}>
                      ??????
                    </Option>
                    <Option className="nodule-accordion-item-title-select-option" value={1}>
                      ?????????
                    </Option>
                    <Option className="nodule-accordion-item-title-select-option" value={2}>
                      ??????
                    </Option>
                    <Option className="nodule-accordion-item-title-select-option" value={3}>
                      ?????????
                    </Option>
                    <Option className="nodule-accordion-item-title-select-option" value={4}>
                      ??????
                    </Option>
                  </Select>
                </Col>
                <Col span={8} className="register-nodule-card-select-center">
                  ?????????
                  <Select
                    className={'nodule-accordion-item-content-select'}
                    mode="multiple"
                    maxTagCount={3}
                    dropdownMatchSelectWidth={false}
                    placeholder="???????????????"
                    defaultValue={newNodule.malignancy}
                    value={newRepresentArray}
                    bordered={false}
                    showArrow={false}
                    dropdownClassName={'corner-select-dropdown'}
                    onChange={this.representChange.bind(this, idx, 'match-cur')}
                    onClick={this.representClick.bind(this)}>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'??????'}>
                      ??????
                    </Option>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'??????'}>
                      ??????
                    </Option>
                    {/* <Option className={'nodule-accordion-item-content-select-option'} value={'??????'}>
                      ??????
                    </Option> */}
                    <Option className={'nodule-accordion-item-content-select-option'} value={'????????????'}>
                      ????????????
                    </Option>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'????????????'}>
                      ????????????
                    </Option>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'??????'}>
                      ??????
                    </Option>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'??????'}>
                      ??????
                    </Option>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'???????????????'}>
                      ???????????????
                    </Option>
                  </Select>
                </Col>
                <Col span={2}>
                  <Popup
                    on="click"
                    trigger={<Icon inverted color="grey" name="trash alternate"></Icon>}
                    onOpen={this.setDelNodule.bind(this, idx, 'later', true)}
                    onClose={this.setDelNodule.bind(this, idx, 'later', false)}
                    open={newNodule.cancelOpen}>
                    <div className="general-confirm-block">
                      <div className="general-confirm-info">??????????????????????????????</div>
                      <div className="general-confirm-operation">
                        <Button inverted size="mini" onClick={this.setDelNodule.bind(this, idx, 'later', false)}>
                          ??????
                        </Button>
                        <Button inverted size="mini" onClick={this.onConfirmDelNodule.bind(this, idx, 'later')}>
                          ??????
                        </Button>
                      </div>
                    </div>
                  </Popup>
                </Col>
              </Row>
              <Row className="register-nodule-card-second" align="middle" justify="center" wrap={false}>
                <Col span={2}>{`IM ${previousNodule.slice_idx + 1}`}</Col>
                <Col span={8} className="register-nodule-card-second-center">
                  <div className="register-nodule-card-text register-nodule-card-text-length">{preNoduleLength.toFixed(1) + '*' + preNoduleWidth.toFixed(1) + 'mm'}</div>
                  <div className="register-nodule-card-text register-nodule-card-text-volume">
                    {previousNodule.volume !== undefined ? Math.floor(previousNodule.volume * 1000).toFixed(1) + 'mm??' : null}
                  </div>
                  <div className="register-nodule-card-text register-nodule-card-text-hu">{previousNodule.huMin + '~' + previousNodule.huMax + 'HU'}</div>
                </Col>
                <Col span={4} className="register-nodule-card-select-center">
                  ?????????
                  <Select
                    className="nodule-accordion-item-title-select"
                    dropdownMatchSelectWidth={false}
                    defaultValue={previousNodule.texture}
                    value={previousNodule.texture}
                    bordered={false}
                    showArrow={false}
                    dropdownClassName={'corner-select-dropdown'}
                    onChange={this.onSelectTex.bind(this, idx, 'match-pre')}
                    onClick={this.onSelectTexClick.bind(this)}>
                    <Option className="nodule-accordion-item-title-select-option" value={-1}>
                      ??????
                    </Option>
                    <Option className="nodule-accordion-item-title-select-option" value={1}>
                      ?????????
                    </Option>
                    <Option className="nodule-accordion-item-title-select-option" value={2}>
                      ??????
                    </Option>
                    <Option className="nodule-accordion-item-title-select-option" value={3}>
                      ?????????
                    </Option>
                    <Option className="nodule-accordion-item-title-select-option" value={4}>
                      ??????
                    </Option>
                  </Select>
                </Col>
                <Col span={8} className="register-nodule-card-select-center">
                  ?????????
                  <Select
                    className={'nodule-accordion-item-content-select'}
                    mode="multiple"
                    maxTagCount={3}
                    dropdownMatchSelectWidth={false}
                    placeholder="???????????????"
                    defaultValue={previousNodule.malignancy}
                    value={preRepresentArray}
                    bordered={false}
                    showArrow={false}
                    dropdownClassName={'corner-select-dropdown'}
                    onChange={this.representChange.bind(this, idx, 'match-pre')}
                    onClick={this.representClick.bind(this)}>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'??????'}>
                      ??????
                    </Option>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'??????'}>
                      ??????
                    </Option>
                    {/* <Option className={'nodule-accordion-item-content-select-option'} value={'??????'}>
                      ??????
                    </Option> */}
                    <Option className={'nodule-accordion-item-content-select-option'} value={'????????????'}>
                      ????????????
                    </Option>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'????????????'}>
                      ????????????
                    </Option>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'??????'}>
                      ??????
                    </Option>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'??????'}>
                      ??????
                    </Option>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'???????????????'}>
                      ???????????????
                    </Option>
                  </Select>
                </Col>
                <Col span={2}>
                  <Popup
                    on="click"
                    trigger={<Icon inverted color="grey" name="trash alternate"></Icon>}
                    onOpen={this.setDelNodule.bind(this, idx, 'earlier', true)}
                    onClose={this.setDelNodule.bind(this, idx, 'earlier', false)}
                    open={previousNodule.cancelOpen}>
                    <div className="general-confirm-block">
                      <div className="general-confirm-info">??????????????????????????????</div>
                      <div className="general-confirm-operation">
                        <Button inverted size="mini" onClick={this.setDelNodule.bind(this, idx, 'earlier', false)}>
                          ??????
                        </Button>
                        <Button inverted size="mini" onClick={this.onConfirmDelNodule.bind(this, idx, 'earlier')}>
                          ??????
                        </Button>
                      </div>
                    </div>
                  </Popup>
                </Col>
              </Row>
            </Col>
          </Row>
        )
      })
    }

    if (newNoduleLen !== 0) {
      newNodulesTbl = registerBoxes['new'].map((value, idx) => {
        let locationValues
        if (value.segment && value.segment !== 'None') {
          locationValues = lungLoc[value.segment].split('-').join('/')
        } else {
          if (value.place) {
            locationValues = [nodulePlaces[value.place]]
          } else {
            locationValues = ['????????????']
          }
        }
        let representArray = []
        let ll = 0
        let sl = 0
        if (value.measure !== undefined && value.measure !== null) {
          ll = Math.sqrt(Math.pow(value.measure.x1 - value.measure.x2, 2) + Math.pow(value.measure.y1 - value.measure.y2, 2))
          sl = Math.sqrt(Math.pow(value.measure.x3 - value.measure.x4, 2) + Math.pow(value.measure.y3 - value.measure.y4, 2))
          if (isNaN(ll)) {
            ll = 0
          }
          if (isNaN(sl)) {
            sl = 0
          }
        }
        if (value.lobulation === 2) {
          representArray.push('??????')
        }
        if (value.spiculation === 2) {
          representArray.push('??????')
        }
        if (value.calcification === 2) {
          representArray.push('??????')
        }
        if (value.pin === 2) {
          representArray.push('????????????')
        }
        if (value.cav === 2) {
          representArray.push('??????')
        }
        if (value.vss === 2) {
          representArray.push('????????????')
        }
        if (value.bea === 2) {
          representArray.push('??????')
        }
        if (value.bro === 2) {
          representArray.push('???????????????')
        }
        return (
          <Row
            key={idx}
            justify="center"
            className={'register-nodule-card' + (newListsActiveIndex === idx ? ' register-nodule-card-active' : '')}
            onClick={this.onNewNoduleChange.bind(this, value.nodule_no, idx)}>
            <Col span={2} className="register-nodule-card-note">
              <Row className="register-nodule-card-first">
                <Checkbox
                  className="nodule-accordion-item-title-checkbox"
                  checked={value.checked}
                  disabled={value.disabled}
                  onChange={this.onHandleNewNoduleCheckChange.bind(this, idx)}
                  onClick={this.onHandleNewNoduleCheckClick.bind(this)}>
                  {/* {parseInt(inside.slice_idx) + 1} */}
                </Checkbox>
              </Row>
              <Row className="register-nodule-card-second">{'N' + (value.visibleIdx + 1)}</Row>
            </Col>

            <Col span={22} className="register-nodule-card-content">
              <Row className="register-nodule-card-first">
                <Col span={24}>
                  ?????????
                  {/* <Cascader
                    className="nodule-accordion-item-title-cascader"
                    bordered={false}
                    suffixIcon={null}
                    allowClear={false}
                    value={locationValues}
                    options={this.config.segment}
                    dropdownRender={(menus) => {
                      return <div onClick={this.onSelectPlaceClick.bind(this)}>{menus}</div>
                    }}
                    onChange={this.onSelectPlace.bind(this, idx, 'new')}
                    onClick={this.onSelectPlaceClick.bind(this)}
                  /> */}
                  {locationValues}
                </Col>
              </Row>
              <Row className="register-nodule-card-second" align="middle" wrap={false}>
                <Col span={2}>{`IM ${value['slice_idx'] + 1}`}</Col>
                <Col span={8} className="register-nodule-card-second-center">
                  <div className="register-nodule-card-text register-nodule-card-text-length">{ll.toFixed(1) + '*' + sl.toFixed(1) + 'mm'}</div>
                  <div className="register-nodule-card-text register-nodule-card-text-volume">{value.volume !== undefined ? Math.floor(value.volume * 1000).toFixed(1) + 'mm??' : null}</div>
                  <div className="register-nodule-card-text register-nodule-card-text-hu">{value.huMin + '~' + value.huMax + 'HU'}</div>
                </Col>
                <Col span={4} className="register-nodule-card-select-center">
                  ?????????
                  <Select
                    className="nodule-accordion-item-title-select"
                    dropdownMatchSelectWidth={false}
                    defaultValue={value.texture}
                    value={value.texture}
                    bordered={false}
                    showArrow={false}
                    dropdownClassName={'corner-select-dropdown'}
                    onChange={this.onSelectTex.bind(this, idx, 'new')}
                    onClick={this.onSelectTexClick.bind(this)}>
                    <Option className="nodule-accordion-item-title-select-option" value={-1}>
                      ??????
                    </Option>
                    <Option className="nodule-accordion-item-title-select-option" value={1}>
                      ?????????
                    </Option>
                    <Option className="nodule-accordion-item-title-select-option" value={2}>
                      ??????
                    </Option>
                    <Option className="nodule-accordion-item-title-select-option" value={3}>
                      ?????????
                    </Option>
                    <Option className="nodule-accordion-item-title-select-option" value={4}>
                      ??????
                    </Option>
                  </Select>
                </Col>
                <Col span={10} className="register-nodule-card-select-center">
                  ?????????
                  <Select
                    className={'nodule-accordion-item-content-select'}
                    mode="multiple"
                    maxTagCount={3}
                    dropdownMatchSelectWidth={false}
                    placeholder="???????????????"
                    defaultValue={value.malignancy}
                    value={representArray}
                    bordered={false}
                    showArrow={false}
                    dropdownClassName={'corner-select-dropdown'}
                    onChange={this.representChange.bind(this, idx, 'new')}
                    onClick={this.representClick.bind(this)}>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'??????'}>
                      ??????
                    </Option>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'??????'}>
                      ??????
                    </Option>
                    {/* <Option className={'nodule-accordion-item-content-select-option'} value={'??????'}>
                      ??????
                    </Option> */}
                    <Option className={'nodule-accordion-item-content-select-option'} value={'????????????'}>
                      ????????????
                    </Option>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'????????????'}>
                      ????????????
                    </Option>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'??????'}>
                      ??????
                    </Option>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'??????'}>
                      ??????
                    </Option>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'???????????????'}>
                      ???????????????
                    </Option>
                  </Select>
                </Col>
              </Row>
            </Col>
          </Row>
        )
      })
    }

    if (vanishNoduleLen !== 0) {
      vanishNodulesTbl = registerBoxes['vanish'].map((value, idx) => {
        let locationValues
        if (value.segment && value.segment !== 'None') {
          locationValues = lungLoc[value.segment].split('-').join('/')
        } else {
          if (value.place) {
            locationValues = [nodulePlaces[value.place]]
          } else {
            locationValues = ['????????????']
          }
        }
        var representArray = []
        let ll = 0
        let sl = 0
        if (value.measure !== undefined && value.measure !== null) {
          ll = Math.sqrt(Math.pow(value.measure.x1 - value.measure.x2, 2) + Math.pow(value.measure.y1 - value.measure.y2, 2))
          sl = Math.sqrt(Math.pow(value.measure.x3 - value.measure.x4, 2) + Math.pow(value.measure.y3 - value.measure.y4, 2))
          if (isNaN(ll)) {
            ll = 0
          }
          if (isNaN(sl)) {
            sl = 0
          }
        }
        if (value.lobulation === 2) {
          representArray.push('??????')
        }
        if (value.spiculation === 2) {
          representArray.push('??????')
        }
        if (value.calcification === 2) {
          representArray.push('??????')
        }
        if (value.pin === 2) {
          representArray.push('????????????')
        }
        if (value.cav === 2) {
          representArray.push('??????')
        }
        if (value.vss === 2) {
          representArray.push('????????????')
        }
        if (value.bea === 2) {
          representArray.push('??????')
        }
        if (value.bro === 2) {
          representArray.push('???????????????')
        }
        return (
          <Row
            key={idx}
            justify="center"
            className={'register-nodule-card' + (vanishListsActiveIndex === idx ? ' register-nodule-card-active' : '')}
            onClick={this.onPreNoduleChange.bind(this, value.nodule_no, idx)}>
            <Col span={2} className="register-nodule-card-note">
              <Row className="register-nodule-card-first">
                <Checkbox
                  className="nodule-accordion-item-title-checkbox"
                  checked={value.checked}
                  disabled={value.disabled}
                  onChange={this.onHandleVanishNoduleCheckChange.bind(this, idx)}
                  onClick={this.onHandleVanishNoduleCheckClick.bind(this)}>
                  {/* {parseInt(inside.slice_idx) + 1} */}
                </Checkbox>
              </Row>
              <Row className="register-nodule-card-second">{'P' + (value.visibleIdx + 1)}</Row>
            </Col>

            <Col span={22} className="register-nodule-card-content">
              <Row className="register-nodule-card-first">
                <Col span={24}>
                  ?????????
                  {/* <Cascader
                    className="nodule-accordion-item-title-cascader"
                    bordered={false}
                    suffixIcon={null}
                    allowClear={false}
                    value={locationValues}
                    options={this.config.segment}
                    dropdownRender={(menus) => {
                      return <div onClick={this.onSelectPlaceClick.bind(this)}>{menus}</div>
                    }}
                    onChange={this.onSelectPlace.bind(this, idx, 'vanish')}
                    onClick={this.onSelectPlaceClick.bind(this)}
                  /> */}
                  {locationValues}
                </Col>
              </Row>

              <Row className="register-nodule-card-second" align="middle" wrap={false}>
                <Col span={2}>{`IM ${value['slice_idx'] + 1}`}</Col>
                <Col span={8} className="register-nodule-card-second-center">
                  <div className="register-nodule-card-text register-nodule-card-text-length">{ll.toFixed(1) + '*' + sl.toFixed(1) + 'mm'}</div>
                  <div className="register-nodule-card-text register-nodule-card-text-volume">{value.volume !== undefined ? Math.floor(value.volume * 1000).toFixed(1) + 'mm??' : null}</div>
                  <div className="register-nodule-card-text register-nodule-card-text-hu">{value.huMin + '~' + value.huMax + 'HU'}</div>
                </Col>
                <Col span={4} className="register-nodule-card-select-center">
                  ?????????
                  <Select
                    className="nodule-accordion-item-title-select"
                    dropdownMatchSelectWidth={false}
                    defaultValue={value.texture}
                    value={value.texture}
                    bordered={false}
                    showArrow={false}
                    dropdownClassName={'corner-select-dropdown'}
                    onChange={this.onSelectTex.bind(this, idx, 'vanish')}
                    onClick={this.onSelectTexClick.bind(this)}>
                    <Option className="nodule-accordion-item-title-select-option" value={-1}>
                      ??????
                    </Option>
                    <Option className="nodule-accordion-item-title-select-option" value={1}>
                      ?????????
                    </Option>
                    <Option className="nodule-accordion-item-title-select-option" value={2}>
                      ??????
                    </Option>
                    <Option className="nodule-accordion-item-title-select-option" value={3}>
                      ?????????
                    </Option>
                    <Option className="nodule-accordion-item-title-select-option" value={4}>
                      ??????
                    </Option>
                  </Select>
                </Col>
                <Col span={10} className="register-nodule-card-select-center">
                  ?????????
                  <Select
                    className={'nodule-accordion-item-content-select'}
                    mode="multiple"
                    maxTagCount={3}
                    dropdownMatchSelectWidth={false}
                    placeholder="???????????????"
                    defaultValue={value.malignancy}
                    value={representArray}
                    bordered={false}
                    showArrow={false}
                    dropdownClassName={'corner-select-dropdown'}
                    onChange={this.representChange.bind(this, idx, 'vanish')}
                    onClick={this.representClick.bind(this)}>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'??????'}>
                      ??????
                    </Option>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'??????'}>
                      ??????
                    </Option>
                    {/* <Option className={'nodule-accordion-item-content-select-option'} value={'??????'}>
                      ??????
                    </Option> */}
                    <Option className={'nodule-accordion-item-content-select-option'} value={'????????????'}>
                      ????????????
                    </Option>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'????????????'}>
                      ????????????
                    </Option>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'??????'}>
                      ??????
                    </Option>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'??????'}>
                      ??????
                    </Option>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'???????????????'}>
                      ???????????????
                    </Option>
                  </Select>
                </Col>
              </Row>
            </Col>
          </Row>
        )
      })
    }

    let maxHU = 0,
      minHU = 0,
      activeMatchNewNo = 0,
      activeMatchPreNo = 0,
      curMaxCT = 0,
      preMaxCT = 0,
      curMeanCT = 0,
      preMeanCT = 0,
      curMinCT = 0,
      preMinCT = 0,
      new_apsidal_mean = 0,
      pre_apsidal_mean = 0,
      newArea = 0,
      preArea = 0,
      noduleMatchStatus = false

    if (activeMatchNewNoduleNo !== -1 && activeMatchPreNoduleNo !== -1) {
      let curIndex = _.findIndex(curBoxes, { nodule_no: activeMatchNewNoduleNo })
      let activeMatchNewBox = curBoxes[curIndex]
      let preIndex = _.findIndex(preBoxes, { nodule_no: activeMatchPreNoduleNo })
      let activeMatchPreBox = preBoxes[preIndex]
      activeMatchNewNo = activeMatchNewBox.nodule_no
      activeMatchPreNo = activeMatchPreBox.nodule_no
      curMaxCT = activeMatchNewBox.huMax
      preMaxCT = activeMatchPreBox.huMax
      curMeanCT = activeMatchNewBox.huMean
      preMeanCT = activeMatchPreBox.huMean
      curMinCT = activeMatchNewBox.huMin
      preMinCT = activeMatchPreBox.huMin
      maxHU = Math.max(curMaxCT, preMaxCT)
      minHU = Math.min(curMinCT, preMinCT)
      var absHU = Math.ceil((maxHU - minHU) / 150) * 150
      maxHU = Math.ceil(maxHU / 50) * 50
      minHU = maxHU - absHU

      if (activeMatchNewBox.measure !== null && activeMatchNewBox.measure !== undefined) {
        let newMeasureCoord = activeMatchNewBox.measure
        let new_ll = Math.sqrt(Math.pow(newMeasureCoord.x1 - newMeasureCoord.x2, 2) + Math.pow(newMeasureCoord.y1 - newMeasureCoord.y2, 2))
        let new_sl = Math.sqrt(Math.pow(newMeasureCoord.x3 - newMeasureCoord.x4, 2) + Math.pow(newMeasureCoord.y3 - newMeasureCoord.y4, 2))
        new_apsidal_mean = ((new_ll + new_sl) / 2).toFixed(2)
      }
      if (activeMatchPreBox.measure !== null && activeMatchPreBox.measure !== undefined) {
        let preMeasureCoord = activeMatchPreBox.measure
        let pre_ll = Math.sqrt(Math.pow(preMeasureCoord.x1 - preMeasureCoord.x2, 2) + Math.pow(preMeasureCoord.y1 - preMeasureCoord.y2, 2))
        let pre_sl = Math.sqrt(Math.pow(preMeasureCoord.x3 - preMeasureCoord.x4, 2) + Math.pow(preMeasureCoord.y3 - preMeasureCoord.y4, 2))
        pre_apsidal_mean = ((pre_ll + pre_sl) / 2).toFixed(2)
      }
      if (registerBoxes.match && registerBoxes.match.length) {
        registerBoxes.match.map((value, index) => {
          if (value.later.nodule_no === activeMatchNewNo && value.earlier.nodule_no === activeMatchPreNo) {
            noduleMatchStatus = true
          }
        })
      }
    }

    // if (activeMatchNewNoduleNo !== -1 && activeMatchPreNoduleNo !== -1) {

    featureModal = (
      <div className="followup-histogram-float" id="followup-histogram-float">
        <div id="followup-histogram-header">
          <div id="followup-title-1">
            <p>????????????????????????</p>
          </div>
          <div id="followup-title-2">
            <p>{`??????N${activeMatchNewNo}?????? & ??????P${activeMatchPreNo}?????????`}</p>
          </div>
          <div id="followup-icon">
            <Icon
              size="large"
              name="close"
              onClick={() => {
                var histogram_float_active_header = document.getElementById('followup-histogram-header')
                if (histogram_float_active_header !== undefined) {
                  histogram_float_active_header.removeEventListener('mousedown', () => {})
                  histogram_float_active_header.removeEventListener('mousemove', () => {})
                  histogram_float_active_header.removeEventListener('mouseup', () => {})
                  document.getElementsByClassName('followup-histogram-float-active')[0].className = 'followup-histogram-float'
                }
              }}></Icon>
          </div>
        </div>
        <div className="content">
          <Row justify="center" align="middle">
            <Col className="histogram-title" span={1}>
              ??????
            </Col>
            <Col span={23}>
              <div id="chart-current"></div>
            </Col>
          </Row>
          <Row justify="center" align="middle">
            <Col className="histogram-title" span={1}>
              ??????
            </Col>
            <Col span={23}>
              <div id="chart-previous"></div>
            </Col>
          </Row>
          <Row justify="center">
            <Col span={1}></Col>
            <Col span={22}>
              <Slider range onChange={this.onHUValueChange.bind(this)} value={HUSliderRange} step={50} max={maxHU} min={minHU} />
            </Col>
            <Col span={1}></Col>
          </Row>

          <table id="analysis-table">
            <tbody>
              <tr>
                <td></td>
                <td>??????</td>
                <td>??????</td>
              </tr>
              <tr>
                <td>?????????(HU)</td>
                <td>{curMaxCT}</td>
                <td>{preMaxCT}</td>
              </tr>
              <tr>
                <td>?????????(HU)</td>
                <td>{curMinCT}</td>
                <td>{preMinCT}</td>
              </tr>
              <tr>
                <td>?????????(HU)</td>
                <td>{curMeanCT}</td>
                <td>{preMeanCT}</td>
              </tr>
              <tr>
                <td>??????????????????(mm)</td>
                <td>{new_apsidal_mean}</td>
                <td>{pre_apsidal_mean}</td>
              </tr>
              {/* <tr>
                <td>???????????????(mm??)</td>
                <td></td>
                <td></td>
              </tr> */}
            </tbody>
          </table>
        </div>
      </div>
    )
    // }

    return (
      <div id="follow-up">
        <Row id="follow-up-viewport">
          {/* current case */}
          <div className="follow-up-viewport-exchange" onClick={this.onChangeViewportSort.bind(this)}>
            <FontAwesomeIcon icon={faExchangeAlt} />
          </div>
          {sortChanged ? (
            <>
              <FollowUpViewport
                viewportIndex={this.state.curViewportIndex}
                tools={this.state.tools}
                imageIds={this.state.curImageIds}
                style={{ minWidth: '50%', flex: '1' }}
                imageIdIndex={this.state.curImageIdIndex}
                isPlaying={this.props.followUpIsPlaying}
                frameRate={this.state.frameRate}
                activeTool={this.state.activeTool}
                isOverlayVisible={this.state.isOverlayVisible}
                setCornerstoneElement={(input) => {
                  this.setState({
                    newCornerstoneElement: input,
                  })
                }}
                setCornerstoneImage={(input) => {
                  if (this.state.curImage !== input) {
                    this.setState({
                      curImage: input,
                      curImageIdIndex: _.indexOf(this.state.curImageIds, input.imageId),
                    })
                  }
                }}
                setViewportIndex={(input) => {
                  this.setState({
                    activeViewportIndex: this.state.curViewportIndex,
                  })
                }}
                onMouseUp={(target, viewportIndex) => {
                  this.mouseUp(target, viewportIndex)
                }}
                voi={curVoi}
                className={this.state.activeViewportIndex === this.state.curViewportIndex ? 'active' : ''}
              />
              <FollowUpViewport
                viewportIndex={this.state.preViewportIndex}
                tools={this.state.tools}
                imageIds={this.state.preImageIds}
                style={{ minWidth: '50%', flex: '1' }}
                imageIdIndex={this.state.preImageIdIndex}
                isPlaying={this.props.followUpIsPlaying}
                frameRate={this.state.frameRate}
                activeTool={this.state.activeTool}
                isOverlayVisible={this.state.isOverlayVisible}
                setCornerstoneElement={(input) => {
                  this.setState({
                    preCornerstoneElement: input,
                  })
                }}
                setCornerstoneImage={(input) => {
                  if (this.state.preImage !== input) {
                    this.setState({
                      preImage: input,
                      preImageIdIndex: _.indexOf(this.state.preImageIds, input.imageId),
                    })
                  }
                }}
                setViewportIndex={(input) => {
                  this.setState({
                    activeViewportIndex: this.state.preViewportIndex,
                  })
                }}
                onMouseUp={(target, viewportIndex) => {
                  this.mouseUp(target, viewportIndex)
                }}
                voi={preVoi}
                className={this.state.activeViewportIndex === this.state.preViewportIndex ? 'active' : ''}
              />
            </>
          ) : (
            <>
              <FollowUpViewport
                viewportIndex={this.state.preViewportIndex}
                tools={this.state.tools}
                imageIds={this.state.preImageIds}
                style={{ minWidth: '50%', flex: '1' }}
                imageIdIndex={this.state.preImageIdIndex}
                isPlaying={this.props.followUpIsPlaying}
                frameRate={this.state.frameRate}
                activeTool={this.state.activeTool}
                isOverlayVisible={this.state.isOverlayVisible}
                setCornerstoneElement={(input) => {
                  this.setState({
                    preCornerstoneElement: input,
                  })
                }}
                setCornerstoneImage={(input) => {
                  if (this.state.preImage !== input) {
                    this.setState({
                      preImage: input,
                      preImageIdIndex: _.indexOf(this.state.preImageIds, input.imageId),
                    })
                  }
                }}
                setViewportIndex={(input) => {
                  this.setState({
                    activeViewportIndex: this.state.preViewportIndex,
                  })
                }}
                onMouseUp={(target, viewportIndex) => {
                  this.mouseUp(target, viewportIndex)
                }}
                voi={preVoi}
                className={this.state.activeViewportIndex === this.state.preViewportIndex ? 'active' : ''}
              />
              <FollowUpViewport
                viewportIndex={this.state.curViewportIndex}
                tools={this.state.tools}
                imageIds={this.state.curImageIds}
                style={{ minWidth: '50%', flex: '1' }}
                imageIdIndex={this.state.curImageIdIndex}
                isPlaying={this.props.followUpIsPlaying}
                frameRate={this.state.frameRate}
                activeTool={this.state.activeTool}
                isOverlayVisible={this.state.isOverlayVisible}
                setCornerstoneElement={(input) => {
                  this.setState({
                    newCornerstoneElement: input,
                  })
                }}
                setCornerstoneImage={(input) => {
                  if (this.state.curImage !== input) {
                    this.setState({
                      curImage: input,
                      curImageIdIndex: _.indexOf(this.state.curImageIds, input.imageId),
                    })
                  }
                }}
                setViewportIndex={(input) => {
                  this.setState({
                    activeViewportIndex: this.state.curViewportIndex,
                  })
                }}
                onMouseUp={(target, viewportIndex) => {
                  this.mouseUp(target, viewportIndex)
                }}
                voi={curVoi}
                className={this.state.activeViewportIndex === this.state.curViewportIndex ? 'active' : ''}
              />
            </>
          )}
        </Row>
        {this.state.isRegistering === false ? (
          <Row justify="space-between" className="BoxesAccord-Row">
            <div span={12} style={{ height: '100%' }} className="boxes-accord-col">
              <Accordion className="current-nodule-accordion">{sortChanged ? curBoxesAccord : preBoxesAccord}</Accordion>
            </div>
            <div className="follow-up-viewport-match" onClick={this.onNoduleMatch.bind(this)}>
              <FontAwesomeIcon icon={faLink} />
            </div>
            <div span={12} style={{ height: '100%' }} className="boxes-accord-col">
              <Accordion className="current-nodule-accordion">{sortChanged ? preBoxesAccord : curBoxesAccord}</Accordion>
            </div>
          </Row>
        ) : (
          <Row justify="space-between" className="BoxesAccord-Row">
            <div span={12} id="structured-report" className="boxes-accord-col">
              <Row id="structured-report-title" align="middle">
                <Col span={22}>
                  <div className="reportTitle">???????????????</div>
                </Col>
                <Col span={2}>
                  <AntdButton type="primary" shape="round" size="small" onClick={this.onRegisterClick.bind(this)}>
                    ??????
                  </AntdButton>
                </Col>
                {/* <Col span={2}>
                  <AntdButton type="primary" shape="round" size="small">
                    ??????
                  </AntdButton>
                </Col> */}
              </Row>
              <Row align="middle" justify="start" id="structured-report-operation">
                <Col span={8} style={{ textAlign: 'start' }}>
                  {noduleTblCheckedValue.includes('match') && !noduleTblCheckedValue.includes('new') && !noduleTblCheckedValue.includes('vanish') ? (
                    <Checkbox
                      className="nodule-filter-desc-checkbox"
                      checked={matchNodulesAllChecked}
                      onChange={this.onHandleMatchNoduleAllCheckChange.bind(this)}
                      onClick={this.onHandleMatchNoduleAllCheckClick.bind(this)}>
                      {'??????(' + matchNoduleLen + ')'}
                    </Checkbox>
                  ) : null}
                </Col>
                <Col span={16} style={{ textAlign: 'end' }}>
                  <Checkbox.Group
                    // style={{ width: "100%" }}
                    className="match-checkbox"
                    defaultValue={noduleTblCheckedValue}
                    onChange={this.noduleTblCheckboxChange}>
                    <Checkbox checked={noduleTblCheckedValue.includes('match') ? true : false} value="match">
                      {'??????(' + matchNoduleLen + ')'}
                    </Checkbox>
                    <Checkbox checked={noduleTblCheckedValue.includes('new') ? true : false} value="new">
                      {'??????(' + newNoduleLen + ')'}
                    </Checkbox>
                    <Checkbox checked={noduleTblCheckedValue.includes('vanish') ? true : false} value="vanish">
                      {'??????(' + vanishNoduleLen + ')'}
                    </Checkbox>
                  </Checkbox.Group>
                </Col>
              </Row>
              <Row className="all-nodule-table" style={{ height: `${tableHeight}px` }}>
                {noduleTblCheckedValue.includes('match') ? matchNodulesTbl : null}
                {noduleTblCheckedValue.includes('new') ? newNodulesTbl : null}
                {noduleTblCheckedValue.includes('vanish') ? vanishNodulesTbl : null}
              </Row>
            </div>

            <div span={12} className="boxes-accord-col" id="report">
              <Accordion id="report-accordion-guide">
                <Accordion.Title active={reportGuideActive} onClick={this.onSetReportGuideActive.bind(this)}>
                  <div className="report-title">
                    <div className="report-title-desc">
                      <Dropdown
                        options={[
                          {
                            key: '????????????',
                            text: '????????????',
                            value: '????????????',
                          },
                          {
                            key: 'Fleischner',
                            text: 'Fleischner',
                            value: 'Fleischner',
                          },
                          {
                            key: 'NCCN',
                            text: 'NCCN',
                            value: 'NCCN',
                          },
                          {
                            key: 'Lung-RADS',
                            text: 'Lung-RADS',
                            value: 'Lung-RADS',
                          },
                          {
                            key: '????????????',
                            text: '????????????',
                            value: '????????????',
                          },
                        ]}
                        defaultValue={reportGuideType}
                        icon={<FontAwesomeIcon icon={faChevronDown} />}
                        onChange={this.onHandleReportGuideTypeChange.bind(this)}
                      />
                    </div>
                  </div>
                </Accordion.Title>
                <Accordion.Content active={reportGuideActive}>
                  <Form.TextArea
                    id="report-guide-textarea"
                    className="report-textarea"
                    placeholder="??????????????????"
                    onChange={this.onHandleGuideTextareaChange.bind(this)}
                    value={reportGuideText}
                    maxLength={500}></Form.TextArea>
                </Accordion.Content>
              </Accordion>

              <Accordion id="report-accordion-image" style={{ top: `${reportImageTop}px`, height: `${reportImageHeight}px` }}>
                <Accordion.Title id="report-accordion-image-header" active={reportImageActive} onClick={this.onSetReportImageActive.bind(this)}>
                  <div className="report-title">
                    <div className="report-title-desc">
                      ????????????
                      <Dropdown
                        className="report-title-desc-type"
                        options={[
                          {
                            key: '????????????',
                            text: '????????????',
                            value: '????????????',
                          },
                          // {
                          //   key: '????????????',
                          //   text: '????????????',
                          //   value: '????????????',
                          // },
                        ]}
                        defaultValue={reportImageType}
                        icon={<FontAwesomeIcon icon={faChevronDown} />}
                        onChange={this.onHandleReportImageTypeChange.bind(this)}
                      />
                    </div>
                    <div className="report-title-operation">
                      <Icon title="??????" className="inverted blue button" name="copy outline" onClick={this.handleCopyClick.bind(this)}></Icon>
                    </div>
                  </div>
                </Accordion.Title>
                <Accordion.Content active={reportImageActive} style={{ height: `${reportImageContentHeight}px` }}>
                  {/* <Form.TextArea
                    id="report-image-textarea"
                    className="report-textarea"
                    placeholder="????????????????????????"
                    onChange={this.onHandleImageTextareaChange.bind(this)}
                    value={reportImageText}
                    maxLength={500}></Form.TextArea> */}
                  <div id="report-image-textarea" className="report-textarea">
                    {reportImageText}
                  </div>
                </Accordion.Content>
              </Accordion>
              {featureModal}
            </div>
          </Row>
        )}
      </div>
    )
  }
  setDelNodule(idx, status, open, e) {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation()
    }
    const registerBoxes = this.state.registerBoxes
    registerBoxes['match'][idx][status].cancelOpen = open
    this.setState({
      registerBoxes,
    })
  }
  onConfirmDelNodule(idx, status) {
    const { curBoxes, preBoxes, registerBoxes } = this.state
    var selectedBox, unselectedBox
    if (status === 'current') {
      let matchIdx = -1
      selectedBox = curBoxes[idx]
      if (registerBoxes.match && registerBoxes.match.length) {
        registerBoxes.match.map((value, index) => {
          if (value.later.nodule_no === selectedBox.nodule_no) {
            unselectedBox = value.earlier
            matchIdx = index
          }
        })
      }
      const previousIdx = _.findIndex(preBoxes, { nodule_no: unselectedBox.nodule_no })
      const deleteMatchParams = {
        patientId: registerBoxes.patientId,
        noduleDocumentId: selectedBox.documentId,
      }
      axios.post(this.config.nodule.deleteNoduleMatch, qs.stringify(deleteMatchParams)).then((deleteRes) => {
        if (deleteRes.data.status === 'okay') {
          if (matchIdx !== -1) {
            selectedBox.checked = false
            unselectedBox.checked = false
            selectedBox.disabled = false
            unselectedBox.disabled = false
            selectedBox.cancelOpen = false
            registerBoxes['match'].splice(matchIdx, 1)
            registerBoxes['vanish'].push(unselectedBox)
            registerBoxes['new'].push(selectedBox)
            this.setState({
              registerBoxes,
              matchListsActiveIndex: -1,
            })
            message.success(`P${previousIdx}???N${idx}???????????????????????????`)
          } else {
            message.warning('????????????????????????????????????????????????')
          }
        } else {
          message.warning('??????????????????????????????????????????')
        }
      })
    } else if (status === 'previous') {
      let matchIdx = -1
      selectedBox = preBoxes[idx]
      if (registerBoxes.match && registerBoxes.match.length) {
        registerBoxes.match.map((value, index) => {
          if (value.earlier.nodule_no === selectedBox.nodule_no) {
            unselectedBox = value.later
            matchIdx = index
          }
        })
      }
      const currentIdx = _.findIndex(curBoxes, { nodule_no: unselectedBox.nodule_no })
      const deleteMatchParams = {
        patientId: registerBoxes.patientId,
        noduleDocumentId: selectedBox.documentId,
      }
      axios.post(this.config.nodule.deleteNoduleMatch, qs.stringify(deleteMatchParams)).then((deleteRes) => {
        if (deleteRes.data.status === 'okay') {
          if (matchIdx !== -1) {
            selectedBox.checked = false
            unselectedBox.checked = false
            selectedBox.disabled = false
            unselectedBox.disabled = false
            selectedBox.cancelOpen = false
            registerBoxes['match'].splice(matchIdx, 1)
            registerBoxes['vanish'].push(selectedBox)
            registerBoxes['new'].push(unselectedBox)
            this.setState({
              registerBoxes,
              matchListsActiveIndex: -1,
            })
            message.success(`P${idx}???N${currentIdx}???????????????????????????`)
          } else {
            message.warning('????????????????????????????????????????????????')
          }
        } else {
          message.warning('??????????????????????????????????????????')
        }
      })
    } else {
      this.setDelNodule(idx, status, false)
      //cancel register api???caseId, idx
      if (status === 'later') {
        selectedBox = registerBoxes['match'][idx]['later']
        unselectedBox = registerBoxes['match'][idx]['earlier']
      } else {
        selectedBox = registerBoxes['match'][idx]['earlier']
        unselectedBox = registerBoxes['match'][idx]['later']
      }

      const deleteMatchParams = {
        patientId: registerBoxes.patientId,
        noduleDocumentId: registerBoxes['match'][idx][status].documentId,
      }
      axios.post(this.config.nodule.deleteNoduleMatch, qs.stringify(deleteMatchParams)).then((deleteRes) => {
        if (deleteRes.data.status === 'okay') {
          selectedBox.checked = false
          unselectedBox.checked = false
          selectedBox.disabled = false
          unselectedBox.disabled = false
          selectedBox.cancelOpen = false
          registerBoxes['match'].splice(idx, 1)
          registerBoxes['vanish'].push(unselectedBox)
          registerBoxes['new'].push(selectedBox)
          this.setState({
            registerBoxes,
            matchListsActiveIndex: -1,
          })
          message.success('P' + unselectedBox.nodule_no + '???N' + selectedBox.nodule_no + '???????????????????????????')
        } else {
          message.success('??????????????????????????????????????????')
        }
      })
    }
  }
  onNoduleMatch() {
    const { curBoxes, preBoxes, curListsActiveIndex, preListsActiveIndex, registerBoxes } = this.state
    let curMatchBox = curBoxes[curListsActiveIndex]
    let preMatchBox = preBoxes[preListsActiveIndex]
    console.log('MatchBox', curMatchBox, preMatchBox)
    if (!preMatchBox && !curMatchBox) {
      message.error('???????????????')
      return
    } else if (!preMatchBox) {
      message.error('????????????????????????')
      return
    } else if (!curMatchBox) {
      message.error('????????????????????????')
      return
    }
    const matchParams = {
      patientId: registerBoxes.patientId,
      firstDocumentId: curMatchBox.documentId,
      secondDocumentId: preMatchBox.documentId,
    }
    if (this.state.curCaseId === this.state.preCaseId) {
      message.error('??????CT?????????????????????')
    } else {
      axios.post(this.config.nodule.noduleMatch, qs.stringify(matchParams)).then((matchRes) => {
        let status = matchRes.data.status
        let earlierBox, laterBox
        if (status === 'okay') {
          for (let i = 0; i < registerBoxes['new'].length; i++) {
            if (curMatchBox.nodule_no === registerBoxes['new'][i].nodule_no) {
              laterBox = registerBoxes['new'][i]
              registerBoxes['new'].splice(i, 1)
              break
            }
          }
          for (let i = 0; i < registerBoxes['vanish'].length; i++) {
            if (preMatchBox.nodule_no === registerBoxes['vanish'][i].nodule_no) {
              earlierBox = registerBoxes['vanish'][i]
              registerBoxes['vanish'].splice(i, 1)
              break
            }
          }
          console.log('earlierBox', earlierBox, laterBox)
          // registerBoxes['new'].splice(selectedNewIdx, 1)
          // registerBoxes['vanish'].splice(selectedVanishIdx, 1)
          // selectedVanishBox[0].checked = false
          // selectedNewBox[0].checked = false
          let matchBox = {
            earlier: earlierBox,
            later: laterBox,
          }
          console.log('matchbox', matchBox)
          // matchBox.earlier = selectedVanishBox
          // matchBox['later'] = selectedNewBox
          registerBoxes['match'].push(matchBox)
          // registerBoxes['new'].forEach((item) => {
          //   item.disabled = false
          // })
          // registerBoxes['vanish'].forEach((item) => {
          //   item.disabled = false
          // })
          // console.log('onRegisterClick', registerBoxes)
          this.setState({ registerBoxes })
          message.success('??????????????????')
        } else if (status === 'failed') {
          if (matchRes.data.errorCode === 'Match-0001' || matchRes.data.errorCode === 'Match-0002') {
            message.error('?????????????????????????????????')
          } else if (matchRes.data.errorCode === 'Match-0003') {
            message.error('???????????????????????????')
          }
        }
      })
    }
  }
  onHandleMatchNoduleAllCheckChange() {
    const registerBoxes = this.state.registerBoxes
    const matchNodulesAllChecked = !this.state.matchNodulesAllChecked
    registerBoxes['match'].forEach((item, index) => {
      item['earlier'].checked = matchNodulesAllChecked
      item['later'].checked = matchNodulesAllChecked
    })

    this.setState({ matchNodulesAllChecked, registerBoxes }, () => {
      console.log('onHandleMatchNoduleAllCheckChange', this.state.registerBoxes)
    })
  }
  onHandleMatchNoduleAllCheckClick(e) {
    e.stopPropagation()
  }
  onSelectMal(index, type, value) {
    if (type === 'current') {
      const curBoxes = this.state.curBoxes
      curBoxes[index].malignancy = parseInt(value)
      this.setState({
        curBoxes: curBoxes,
      })
    } else if (type === 'previous') {
      const preBoxes = this.state.preBoxes
      preBoxes[index].malignancy = parseInt(value)
      this.setState({
        preBoxes: preBoxes,
      })
    }
  }
  onSelectMalClick(e) {
    e.stopPropagation()
  }
  onSelectTexClick(e) {
    e.stopPropagation()
  }
  onSelectTex(index, type, value) {
    if (type === 'current') {
      const curBoxes = this.state.curBoxes
      curBoxes[index].texture = parseInt(value)
      this.setState({
        curBoxes: curBoxes,
      })
    } else if (type === 'previous') {
      const preBoxes = this.state.preBoxes
      preBoxes[index].texture = parseInt(value)
      this.setState({
        preBoxes: preBoxes,
      })
    } else if (type === 'match-cur') {
      const box = this.state.registerBoxes
      box['match'][index]['later'].texture = parseInt(value)
      this.setState({
        registerBoxes: box,
      })
    } else if (type === 'match-pre') {
      const box = this.state.registerBoxes
      box['match'][index]['earlier'].texture = parseInt(value)
      this.setState({
        registerBoxes: box,
      })
    } else if (type === 'new') {
      const box = this.state.registerBoxes
      box['new'][index].texture = parseInt(value)
      this.setState({
        registerBoxes: box,
      })
    } else if (type === 'vanish') {
      const box = this.state.registerBoxes
      box['vanish'][index].texture = parseInt(value)
      this.setState({
        registerBoxes: box,
      })
    }
  }
  onSelectPlaceClick(e) {
    e.stopPropagation()
  }
  onSelectPlace(index, type, value) {
    // console.log('onSelectPlace', index, value)
    const places = nodulePlaces
    const segments = lungLoc
    const place = value[0]
    const segment = value[0] + '-' + value[1]
    if (type === 'current') {
      const curBoxes = this.state.curBoxes
      if (value[0] === '????????????') {
        curBoxes[index].place = 0
        curBoxes[index].segment = 'None'
      } else {
        for (let item in places) {
          if (places[item] === place) {
            curBoxes[index].place = item
          }
        }
        if (value[1] === '????????????1') {
          curBoxes[index].segment = 'None'
        } else {
          for (let item in segments) {
            if (segments[item] === segment) {
              curBoxes[index].segment = item
            }
          }
        }
      }
      this.setState({
        curBoxes: curBoxes,
      })
    } else if (type === 'previous') {
      const preBoxes = this.state.preBoxes
      if (value[0] === '????????????') {
        preBoxes[index].place = 0
        preBoxes[index].segment = 'None'
      } else {
        for (let item in places) {
          if (places[item] === place) {
            preBoxes[index].place = item
          }
        }
        if (value[1] === '????????????1') {
          preBoxes[index].segment = 'None'
        } else {
          for (let item in segments) {
            if (segments[item] === segment) {
              preBoxes[index].segment = item
            }
          }
        }
      }
      this.setState({
        preBoxes: preBoxes,
      })
    } else if (type === 'match-cur') {
      const box = this.state.registerBoxes
      if (value[0] === '????????????') {
        box['match'][index]['later'].place = 0
        box['match'][index]['later'].segment = 'None'
      } else {
        for (let item in places) {
          if (places[item] === place) {
            box['match'][index]['later'].place = item
          }
        }
        if (value[1] === '????????????1') {
          box['match'][index]['later'].segment = 'None'
        } else {
          for (let item in segments) {
            if (segments[item] === segment) {
              box['match'][index]['later'].segment = item
            }
          }
        }
      }
      this.setState({
        registerBoxes: box,
      })
    } else if (type === 'match-pre') {
      const box = this.state.registerBoxes
      if (value[0] === '????????????') {
        box['match'][index]['earlier'].place = 0
        box['match'][index]['earlier'].segment = 'None'
      } else {
        for (let item in places) {
          if (places[item] === place) {
            box['match'][index]['earlier'].place = item
          }
        }
        if (value[1] === '????????????1') {
          box['match'][index]['earlier'].segment = 'None'
        } else {
          for (let item in segments) {
            if (segments[item] === segment) {
              box['match'][index]['earlier'].segment = item
            }
          }
        }
      }
      this.setState({
        registerBoxes: box,
      })
    } else if (type === 'new') {
      const box = this.state.registerBoxes
      if (value[0] === '????????????') {
        box['new'][index].place = 0
        box['new'][index].segment = 'None'
      } else {
        for (let item in places) {
          if (places[item] === place) {
            box['new'][index].place = item
          }
        }
        if (value[1] === '????????????1') {
          box['new'][index].segment = 'None'
        } else {
          for (let item in segments) {
            if (segments[item] === segment) {
              box['new'][index].segment = item
            }
          }
        }
      }

      this.setState({
        registerBoxes: box,
      })
    } else if (type === 'vanish') {
      const box = this.state.registerBoxes
      if (value[0] === '????????????') {
        box['vanish'][index].place = 0
        box['vanish'][index].segment = 'None'
      } else {
        for (let item in places) {
          if (places[item] === place) {
            box['vanish'][index].place = item
          }
        }
        if (value[1] === '????????????1') {
          box['vanish'][index].segment = 'None'
        } else {
          for (let item in segments) {
            if (segments[item] === segment) {
              box['vanish'][index].segment = item
            }
          }
        }
      }

      this.setState({
        registerBoxes: box,
      })
    }
  }
  representClick(e) {
    e.stopPropagation()
  }
  representChange(idx, type, value) {
    // console.log("representChange", idx, value)
    let represents = {
      lobulation: '??????',
      spiculation: '??????',
      calcification: '??????',
      pin: '????????????',
      cav: '??????',
      vss: '????????????',
      bea: '??????',
      bro: '???????????????',
    }
    // let boxes = this.state.selectBoxes

    if (type === 'current') {
      const curBoxes = this.state.curBoxes
      curBoxes[idx].lobulation = 1
      curBoxes[idx].spiculation = 1
      curBoxes[idx].calcification = 1
      curBoxes[idx].pin = 1
      curBoxes[idx].cav = 1
      curBoxes[idx].vss = 1
      curBoxes[idx].bea = 1
      curBoxes[idx].bro = 1
      for (let itemValue in value) {
        for (let keyRepresents in represents) {
          if (value[itemValue] === represents[keyRepresents]) {
            if (keyRepresents === 'lobulation') {
              curBoxes[idx].lobulation = 2
            } else if (keyRepresents === 'spiculation') {
              curBoxes[idx].spiculation = 2
            } else if (keyRepresents === 'calcification') {
              curBoxes[idx].calcification = 2
            } else if (keyRepresents === 'pin') {
              curBoxes[idx].pin = 2
            } else if (keyRepresents === 'cav') {
              curBoxes[idx].cav = 2
            } else if (keyRepresents === 'vss') {
              curBoxes[idx].vss = 2
            } else if (keyRepresents === 'bea') {
              curBoxes[idx].bea = 2
            } else if (keyRepresents === 'bro') {
              curBoxes[idx].bro = 2
            }
          }
        }
      }
      this.setState({
        // selectBoxes: boxes
        curBoxes: curBoxes,
        // random: Math.random()
      })
    } else if (type === 'previous') {
      const preBoxes = this.state.preBoxes
      preBoxes[idx].lobulation = 1
      preBoxes[idx].spiculation = 1
      preBoxes[idx].calcification = 1
      preBoxes[idx].pin = 1
      preBoxes[idx].cav = 1
      preBoxes[idx].vss = 1
      preBoxes[idx].bea = 1
      preBoxes[idx].bro = 1
      for (let itemValue in value) {
        for (let keyRepresents in represents) {
          if (value[itemValue] === represents[keyRepresents]) {
            if (keyRepresents === 'lobulation') {
              preBoxes[idx].lobulation = 2
            } else if (keyRepresents === 'spiculation') {
              preBoxes[idx].spiculation = 2
            } else if (keyRepresents === 'calcification') {
              preBoxes[idx].calcification = 2
            } else if (keyRepresents === 'pin') {
              preBoxes[idx].pin = 2
            } else if (keyRepresents === 'cav') {
              preBoxes[idx].cav = 2
            } else if (keyRepresents === 'vss') {
              preBoxes[idx].vss = 2
            } else if (keyRepresents === 'bea') {
              preBoxes[idx].bea = 2
            } else if (keyRepresents === 'bro') {
              preBoxes[idx].bro = 2
            }
          }
        }
      }

      this.setState({
        // selectBoxes: boxes
        preBoxes: preBoxes,
        // random: Math.random()
      })
    } else if (type === 'match-cur') {
      const box = this.state.registerBoxes
      box['match'][idx]['later'].lobulation = 1
      box['match'][idx]['later'].spiculation = 1
      box['match'][idx]['later'].calcification = 1
      box['match'][idx]['later'].pin = 1
      box['match'][idx]['later'].cav = 1
      box['match'][idx]['later'].vss = 1
      box['match'][idx]['later'].bea = 1
      box['match'][idx]['later'].bro = 1
      for (let itemValue in value) {
        for (let keyRepresents in represents) {
          if (value[itemValue] === represents[keyRepresents]) {
            if (keyRepresents === 'lobulation') {
              box['match'][idx]['later'].lobulation = 2
            } else if (keyRepresents === 'spiculation') {
              box['match'][idx]['later'].spiculation = 2
            } else if (keyRepresents === 'calcification') {
              box['match'][idx]['later'].calcification = 2
            } else if (keyRepresents === 'pin') {
              box['match'][idx]['later'].pin = 2
            } else if (keyRepresents === 'cav') {
              box['match'][idx]['later'].cav = 2
            } else if (keyRepresents === 'vss') {
              box['match'][idx]['later'].vss = 2
            } else if (keyRepresents === 'bea') {
              box['match'][idx]['later'].bea = 2
            } else if (keyRepresents === 'bro') {
              box['match'][idx]['later'].bro = 2
            }
          }
        }
      }
      this.setState({
        // selectBoxes: boxes
        registerBoxes: box,
        // random: Math.random()
      })
    } else if (type === 'match-pre') {
      const box = this.state.registerBoxes
      box['match'][idx]['earlier'].lobulation = 1
      box['match'][idx]['earlier'].spiculation = 1
      box['match'][idx]['earlier'].calcification = 1
      box['match'][idx]['earlier'].pin = 1
      box['match'][idx]['earlier'].cav = 1
      box['match'][idx]['earlier'].vss = 1
      box['match'][idx]['earlier'].bea = 1
      box['match'][idx]['earlier'].bro = 1
      for (let itemValue in value) {
        for (let keyRepresents in represents) {
          if (value[itemValue] === represents[keyRepresents]) {
            if (keyRepresents === 'lobulation') {
              box['match'][idx]['earlier'].lobulation = 2
            } else if (keyRepresents === 'spiculation') {
              box['match'][idx]['earlier'].spiculation = 2
            } else if (keyRepresents === 'calcification') {
              box['match'][idx]['earlier'].calcification = 2
            } else if (keyRepresents === 'pin') {
              box['match'][idx]['earlier'].pin = 2
            } else if (keyRepresents === 'cav') {
              box['match'][idx]['earlier'].cav = 2
            } else if (keyRepresents === 'vss') {
              box['match'][idx]['earlier'].vss = 2
            } else if (keyRepresents === 'bea') {
              box['match'][idx]['earlier'].bea = 2
            } else if (keyRepresents === 'bro') {
              box['match'][idx]['earlier'].bro = 2
            }
          }
        }
      }
      this.setState({
        // selectBoxes: boxes
        registerBoxes: box,
        // random: Math.random()
      })
    } else if (type === 'new') {
      const box = this.state.registerBoxes
      box['new'][idx].lobulation = 1
      box['new'][idx].spiculation = 1
      box['new'][idx].calcification = 1
      box['new'][idx].pin = 1
      box['new'][idx].cav = 1
      box['new'][idx].vss = 1
      box['new'][idx].bea = 1
      box['new'][idx].bro = 1
      for (let itemValue in value) {
        for (let keyRepresents in represents) {
          if (value[itemValue] === represents[keyRepresents]) {
            if (keyRepresents === 'lobulation') {
              box['new'][idx].lobulation = 2
            } else if (keyRepresents === 'spiculation') {
              box['new'][idx].spiculation = 2
            } else if (keyRepresents === 'calcification') {
              box['new'][idx].calcification = 2
            } else if (keyRepresents === 'pin') {
              box['new'][idx].pin = 2
            } else if (keyRepresents === 'cav') {
              box['new'][idx].cav = 2
            } else if (keyRepresents === 'vss') {
              box['new'][idx].vss = 2
            } else if (keyRepresents === 'bea') {
              box['new'][idx].bea = 2
            } else if (keyRepresents === 'bro') {
              box['new'][idx].bro = 2
            }
          }
        }
      }
      this.setState({
        // selectBoxes: boxes
        registerBoxes: box,
        // random: Math.random()
      })
    } else if (type === 'vanish') {
      const box = this.state.registerBoxes
      box['vanish'][idx].lobulation = 1
      box['vanish'][idx].spiculation = 1
      box['vanish'][idx].calcification = 1
      box['vanish'][idx].pin = 1
      box['vanish'][idx].cav = 1
      box['vanish'][idx].vss = 1
      box['vanish'][idx].bea = 1
      box['vanish'][idx].bro = 1
      for (let itemValue in value) {
        for (let keyRepresents in represents) {
          if (value[itemValue] === represents[keyRepresents]) {
            if (keyRepresents === 'lobulation') {
              box['vanish'][idx].lobulation = 2
            } else if (keyRepresents === 'spiculation') {
              box['vanish'][idx].spiculation = 2
            } else if (keyRepresents === 'calcification') {
              box['vanish'][idx].calcification = 2
            } else if (keyRepresents === 'pin') {
              box['vanish'][idx].pin = 2
            } else if (keyRepresents === 'cav') {
              box['vanish'][idx].cav = 2
            } else if (keyRepresents === 'vss') {
              box['vanish'][idx].vss = 2
            } else if (keyRepresents === 'bea') {
              box['vanish'][idx].bea = 2
            } else if (keyRepresents === 'bro') {
              box['vanish'][idx].bro = 2
            }
          }
        }
      }
      this.setState({
        // selectBoxes: boxes
        registerBoxes: box,
        // random: Math.random()
      })
    }
  }
  onSetReportImageActive() {
    this.setState((prevState) => ({
      reportImageActive: !prevState.reportImageActive,
    }))
  }
  onSetReportGuideActive() {
    this.setState(
      (prevState) => ({
        reportGuideActive: !prevState.reportGuideActive,
      }),
      () => {
        this.reportImageTopCalc()
      }
    )
  }
  onHandleReportGuideTypeChange(e, { name, value }) {
    this.templateReportGuide(value)
    this.setState({
      reportGuideType: value,
    })
  }
  onHandleReportImageTypeChange(e, { name, value }) {
    this.setState({
      reportImageType: value,
    })
  }
  reportImageTopCalc() {
    if (document.getElementById('report') && document.getElementById('report-accordion-guide') && document.getElementById('report-accordion-image-header')) {
      const report = document.getElementById('report')
      const reportHeight = report.clientHeight
      const reportGuide = document.getElementById('report-accordion-guide')
      const reportGuideHeight = reportGuide.clientHeight
      const reportImageHeader = document.getElementById('report-accordion-image-header')
      const reportImageHeaderHeight = reportImageHeader.clientHeight
      console.log('reportImageTopCalc', reportHeight, reportGuideHeight, reportHeight - reportGuideHeight, reportHeight - reportGuideHeight - reportImageHeaderHeight)

      this.setState({
        reportImageTop: reportGuideHeight,
        reportImageHeight: reportHeight - reportGuideHeight - 3,
        reportImageContentHeight: reportHeight - reportGuideHeight - 3 - reportImageHeaderHeight,
      })
    }
  }
  handleCopyClick(e) {
    e.stopPropagation()
    console.log('reportImageText', this.state.reportImageText)
    const reportImageText = this.state.reportImageText

    if (reportImageText && reportImageText.length > 0) {
      copy(this.state.reportImageText)
      message.success('????????????')
    } else {
      message.warn('??????????????????')
    }
  }
  template() {
    const registerBoxes = this.state.registerBoxes
    const { curBoxes, preBoxes } = this.state
    const reportImageType = this.state.reportImageType
    const reportGuideType = this.state.reportGuideType
    let reportImageText = []
    // registerBoxes['match'].forEach((item, index) => {
    //   if (item['later'].checked) {
    reportImageText = this.templateReportImage(reportImageType)
    // console.log('nodule_no', item['later'].nodule_no)
    // this.templateReportImage(reportImageType, item['later'].nodule_no)
    //   }
    // })
    this.setState({
      reportImageText,
    })
    // console.log('reportImageText', reportImageType, reportImageText)
    this.templateReportGuide(reportGuideType)
  }
  templateReportImage(type) {
    const places = nodulePlaces
    const segments = lungLoc
    const boxes = this.state.curBoxes
    if (!(boxes && boxes.length)) {
      return
    }
    let reportImageText = []
    boxes.forEach((item, index) => {
      let texts = ''
      // console.log('textsType', type)
      if (type === '????????????') {
        let place = ''
        let diameter = ''
        let texture = ''
        let representArray = []
        let represent = ''
        let malignancy = ''
        if (item['place'] === 0 || item['place'] === undefined || item['place'] === '') {
          if (item['segment'] === undefined || item['segment'] === '' || item['segment'] === 'None') {
            place = '????????????'
          } else {
            place = segments[item['segment']]
          }
        } else {
          if (item['segment'] === undefined || item['segment'] === '' || item['segment'] === 'None') {
            place = places[item['place']]
          } else {
            place = segments[item['segment']]
          }
        }
        let ll = 0
        let sl = 0
        if (item['measure'] !== undefined) {
          ll = Math.sqrt(Math.pow(item.measure.x1 - item.measure.x2, 2) + Math.pow(item.measure.y1 - item.measure.y2, 2))
          sl = Math.sqrt(Math.pow(item.measure.x3 - item.measure.x4, 2) + Math.pow(item.measure.y3 - item.measure.y4, 2))
          if (isNaN(ll)) {
            ll = 0
          }
          if (isNaN(sl)) {
            sl = 0
          }
          if (ll === 0 && sl === 0) {
            if (item['diameter'] !== undefined && item['diameter'] !== 0) {
              diameter = '\xa0\xa0' + (item['diameter'] / 10).toFixed(2) + ' ??????'
            } else {
              diameter = '??????'
            }
          } else {
            diameter = '\xa0\xa0' + (ll / 10).toFixed(2) + '\xa0' + '??' + '\xa0' + (sl / 10).toFixed(2) + ' ??????'
          }
        }

        if (item['texture'] === 2) {
          texture = '??????'
        } else if (item['texture'] === 3) {
          texture = '???????????????'
        } else if (item['texture'] === 4) {
          texture = '??????'
        } else {
          texture = '?????????'
        }
        if (item['lobulation'] === 2) {
          representArray.push('??????')
        }
        if (item['spiculation'] === 2) {
          representArray.push('??????')
        }
        // if (item['calcification'] === 2) {
        //   representArray.push('??????')
        // }
        if (item['pin'] === 2) {
          representArray.push('????????????')
        }
        if (item['cav'] === 2) {
          representArray.push('??????')
        }
        if (item['vss'] === 2) {
          representArray.push('????????????')
        }
        if (item['bea'] === 2) {
          representArray.push('??????')
        }
        if (item['bro'] === 2) {
          representArray.push('???????????????')
        }
        for (let index = 0; index < representArray.length; index++) {
          if (index === 0) {
            represent = representArray[index]
          } else {
            represent = represent + '???' + representArray[index]
          }
        }
        if (item['malignancy'] === 3) {
          malignancy = '???????????????'
        } else if (item['malignancy'] === 2) {
          malignancy = '???????????????'
        } else {
          malignancy = '???????????????'
        }
        texts =
          texts + place + ' ( Im ' + (parseInt(item['slice_idx']) + 1) + '/' + this.state.curImageIds.length + ') ???' + texture + '??????, ?????????' + diameter + ', ??????' + represent + ', ' + malignancy
      }
      // console.log('nodule_no', item.nodule_no, texts)
      if (!item.checked) {
        reportImageText.push(<div key={index}>{texts}</div>)
      } else {
        reportImageText.push(
          <div key={index} className="report-textarea-highlight">
            {texts}
          </div>
        )
      }
    })
    return reportImageText
  }
  templateReportGuide(dealchoose) {
    const boxes = this.state.curBoxes
    if (!(boxes && boxes.length)) {
      return
    }
    if (dealchoose === '????????????') {
      let weight = 0

      for (let i = 0; i < boxes.length; i++) {
        if (boxes[i]['malignancy'] === 3) {
          if (boxes[i]['diameter'] > 8) {
            weight = 20
            break
          } else if (boxes[i]['diameter'] > 6 && boxes[i]['diameter'] <= 8) {
            weight = weight >= 15 ? weight : 15
          } else if (boxes[i]['diameter'] >= 4 && boxes[i]['diameter'] <= 6) {
            weight = weight >= 10 ? weight : 10
          } else {
            weight = weight >= 5 ? weight : 5
          }
        } else {
          if (boxes[i]['diameter'] > 8) {
            weight = 20
            break
          } else if (boxes[i]['diameter'] > 6 && boxes[i]['diameter'] <= 8) {
            weight = weight >= 10 ? weight : 10
          } else if (boxes[i]['diameter'] >= 4 && boxes[i]['diameter'] <= 6) {
            weight = weight >= 5 ? weight : 5
          }
          // else{
          //     weight=weight>=5?weight:5
          // }
        }
      }
      switch (weight) {
        case 20:
          this.setState({
            reportGuideText: '??????PET??????????????????????????????????????????????????????',
          })
          break
        case 15:
          this.setState({
            reportGuideText: '3~6???9~12???24?????????????????????????????????',
          })
          break
        case 10:
          this.setState({
            reportGuideText: '6~12???18~24?????????????????????????????????',
          })
          break
        case 5:
          this.setState({ reportGuideText: '12?????????????????????????????????' })
          break
        case 0:
          this.setState({ reportGuideText: '???????????????' })
          break
      }
    } else if (dealchoose === 'Fleischner') {
      let weight = 0

      for (let i = 0; i < boxes.length; i++) {
        if (boxes[i]['texture'] === 2) {
          if (boxes[i]['diameter'] > 8) {
            weight = 25
            break
          } else if (boxes[i]['diameter'] >= 6 && boxes[i]['diameter'] <= 8) {
            weight = weight >= 15 ? weight : 15
          } else {
            if (boxes[i]['malignancy'] === 3) {
              weight = weight >= 5 ? weight : 5
            }
            // else{
            //     weight=weight>=0?weight:0
            // }
          }
        } else if (boxes[i]['texture'] === 3) {
          if (boxes[i]['diameter'] >= 6) {
            weight = weight >= 20 ? weight : 20
          }
          // else{
          //     weight=weight>=0?weight:0
          // }
        } else {
          if (boxes[i]['diameter'] >= 6) {
            weight = weight >= 10 ? weight : 10
          }
          // else{
          //     weight=0
          // }
        }
      }
      switch (weight) {
        case 25:
          this.setState({ reportGuideText: '3????????????CT???PET/CT??????????????????' })
          break
        case 20:
          this.setState({
            reportGuideText: '3-6??????CT???????????????????????????????????????????????????<6mm???????????????CT???5???',
          })
          break
        case 15:
          this.setState({
            reportGuideText: '6-12?????????CT?????????18-24????????????CT',
          })
          break
        case 10:
          this.setState({
            reportGuideText: '6-12??????CT???????????????????????????2??????CT???5???',
          })
          break
        case 5:
          this.setState({ reportGuideText: '?????????12?????????CT' })
          break
        case 0:
          this.setState({ reportGuideText: '???????????????' })
          break
      }
    } else if (dealchoose === 'NCCN') {
      let weight = 0

      for (let i = 0; i < boxes.length; i++) {
        if (boxes[i]['texture'] === 2) {
          if (boxes[i]['diameter'] >= 15) {
            weight = 15
            break
          } else if (boxes[i]['diameter'] >= 7 && boxes[i]['diameter'] < 15) {
            weight = weight >= 10 ? weight : 10
          } else if (boxes[i]['diameter'] >= 6 && boxes[i]['diameter'] < 7) {
            weight = weight >= 5 ? weight : 5
          }
          // else{
          //     weight=0
          // }
        } else if (boxes[i]['texture'] === 3) {
          if (boxes[i]['diameter'] >= 8) {
            weight = 15
            break
          } else if (boxes[i]['diameter'] >= 7 && boxes[i]['diameter'] < 8) {
            weight = weight >= 10 ? weight : 10
          } else if (boxes[i]['diameter'] >= 6 && boxes[i]['diameter'] < 7) {
            weight = weight >= 5 ? weight : 5
          }
          // else{
          //     weight=0
          // }
        } else {
          if (boxes[i]['diameter'] >= 20) {
            weight = weight >= 5 ? weight : 5
          }
          // else{
          //     weight=0
          // }
        }
      }
      switch (weight) {
        case 15:
          this.setState({ reportGuideText: '????????????CT???/???PET/CT' })
          break
        case 10:
          this.setState({ reportGuideText: '3???????????????LDCT?????????PET/CT' })
          break
        case 5:
          this.setState({ reportGuideText: '6???????????????LDCT' })
          break
        case 0:
          this.setState({
            reportGuideText: '????????????LDCT????????????????????????????????????????????????',
          })
          break
      }
    } else if (dealchoose === 'Lung-RADS') {
      let weight = 0

      for (let i = 0; i < boxes.length; i++) {
        if (boxes[i]['malignancy'] === 1 || boxes[i]['malignancy'] === 2) {
          if (boxes[i]['texture'] === 2) {
            if (boxes[i]['diameter'] < 6) {
              weight = weight >= 0 ? weight : 0
            } else {
              weight = weight >= 5 ? weight : 5
            }
          } else if (boxes[i]['texture'] === 3) {
            if (boxes[i]['diameter'] < 6) {
              weight = weight >= 0 ? weight : 0
            } else {
              weight = weight >= 5 ? weight : 5
            }
          } else {
            if (boxes[i]['diameter'] < 20) {
              weight = weight >= 0 ? weight : 0
            } else {
              weight = weight >= 5 ? weight : 5
            }
          }
        } else {
          if (boxes[i]['texture'] === 2) {
            if (boxes[i]['diameter'] >= 8 && boxes[i]['diameter'] < 15) {
              weight = weight >= 10 ? weight : 10
            } else {
              weight = 15
              break
            }
          } else if (boxes[i]['texture'] === 3) {
            if (boxes[i]['diameter'] >= 6 && boxes[i]['diameter'] < 8) {
              weight = weight >= 10 ? weight : 10
            } else {
              weight = 15
              break
            }
          } else {
            weight = weight >= 5 ? weight : 5
          }
        }
      }
      switch (weight) {
        case 15:
          this.setState({
            reportGuideText: '??????CT?????????????????????????????????????????????????????????????????????PET/CT???/???????????????????????????8mm??????????????????????????????PET/CT??????',
          })
          break
        case 10:
          this.setState({
            reportGuideText: '3?????????????????????CT??????????????????8mm?????????????????????PET/CT??????',
          })
          break
        case 5:
          this.setState({ reportGuideText: '6????????????????????????CT??????' })
          break
        case 0:
          this.setState({ reportGuideText: '12????????????????????????????????????CT??????' })
          break
      }
    } else if (dealchoose === '????????????') {
      let weight = 0

      for (let i = 0; i < boxes.length; i++) {
        if (boxes[i]['texture'] === 2) {
          if (boxes[i]['diameter'] > 8) {
            weight = 25
            break
          } else if (boxes[i]['diameter'] >= 6 && boxes[i]['diameter'] <= 8) {
            weight = weight >= 15 ? weight : 15
          }
          // else if(this.state.boxes[i]['diameter']>=4 && this.state.boxes[i]['diameter']<6){
          //     weight=weight>=15?weight:15
          // }
          // else{
          //     if(this.state.boxes[i]['malignancy']===3){
          //         weight=weight>=5?weight:5
          //     }
          //     // else{
          //     //     weight=weight>=0?weight:0
          //     // }
          // }
        } else if (boxes[i]['texture'] === 1) {
          if (boxes[i]['diameter'] > 5) {
            weight = weight >= 5 ? weight : 5
          }
          // else{
          //     weight=weight>=0?weight:0
          // }
        } else {
          if (boxes[i]['diameter'] <= 8) {
            weight = weight >= 10 ? weight : 10
          } else {
            weight = weight >= 15 ? weight : 15
          }
        }
      }
      switch (weight) {
        case 25:
          this.setState({
            reportGuideText: '?????????????????????????????????????????????????????????????????????????????????CT/PET????????????????????????????????????',
          })
          break
        case 20:
          this.setState({
            reportGuideText: '3???????????????CT??????????????????????????????????????????????????????????????????',
          })
          break
        case 10:
          this.setState({
            reportGuideText: '?????????6??????-12?????????18??????-24?????????????????????CT?????????????????????????????????????????????????????????CT??????',
          })
          break
        case 15:
          this.setState({
            reportGuideText: '?????????3?????????12?????????24?????????????????????CT?????????????????????????????????????????????????????????CT??????',
          })
          break
        case 5:
          this.setState({
            reportGuideText: '????????????CT???????????????3???;?????????????????????????????????????????????CT??????',
          })
          break
        case 0:
          this.setState({ reportGuideText: '???????????????????????????????????????CT??????' })
          break
      }
    }
  }
  onHandleImageTextareaChange(e) {
    this.setState({
      reportImageText: e.target.value,
    })
  }
  onHandleGuideTextareaChange(e) {
    this.setState({
      reportGuideText: e.target.value,
    })
  }
  onHandleNoduleAllCheckChange(type) {
    if (type === 'current') {
      const curBoxes = this.state.curBoxes
      const curNodulesAllChecked = !this.state.curNodulesAllChecked
      curBoxes.forEach((item, index) => {
        item.checked = curNodulesAllChecked
      })
      this.setState(
        {
          curBoxes,
          curNodulesAllChecked,
        },
        () => {
          this.isAllCheck()
          // this.template()
        }
      )
    } else if (type === 'previous') {
      const preBoxes = this.state.preBoxes
      const preNodulesAllChecked = !this.state.preNodulesAllChecked
      preBoxes.forEach((item, index) => {
        item.checked = preNodulesAllChecked
      })
      this.setState(
        {
          preBoxes,
          preNodulesAllChecked,
        },
        () => {
          // this.template()
        }
      )
    }
  }
  onHandleNoduleAllCheckClick(e) {
    e.stopPropagation()
  }
  onHandleNoduleCheckChange(idx, type) {
    if (type === 'current') {
      const curBoxes = this.state.curBoxes
      curBoxes[idx].checked = !curBoxes[idx].checked
      this.setState(
        {
          curBoxes,
        },
        () => {
          // this.isAllCheck(2)
          // this.template()
        }
      )
    } else if (type === 'previous') {
      const preBoxes = this.state.preBoxes
      preBoxes[idx].checked = !preBoxes[idx].checked
      this.setState(
        {
          preBoxes,
        },
        () => {
          // this.isAllCheck(2)
          // this.template()
        }
      )
    }
  }
  onHandleNoduleCheckClick(e) {
    e.stopPropagation()
  }
  onHandleMatchNoduleCheckChange(idx) {
    const registerBoxes = this.state.registerBoxes
    registerBoxes['match'][idx]['earlier'].checked = !registerBoxes['match'][idx]['earlier'].checked
    registerBoxes['match'][idx]['later'].checked = !registerBoxes['match'][idx]['later'].checked
    this.setState(
      {
        registerBoxes,
      },
      () => {
        this.isAllCheck()
        this.template()
      }
    )
  }
  onHandleMatchNoduleCheckClick(e) {
    e.stopPropagation()
  }
  onHandleNewNoduleCheckChange(idx) {
    const registerBoxes = this.state.registerBoxes
    registerBoxes['new'][idx].checked = !registerBoxes['new'][idx].checked
    if (registerBoxes['new'][idx].checked) {
      registerBoxes['new'].forEach((item, index) => {
        if (index !== idx) {
          item.disabled = true
        }
      })
    } else {
      registerBoxes['new'].forEach((item, index) => {
        item.disabled = false
      })
    }
    this.setState({ registerBoxes })
  }
  onHandleNewNoduleCheckClick(e) {
    e.stopPropagation()
  }
  onHandleVanishNoduleCheckChange(idx) {
    const registerBoxes = this.state.registerBoxes
    registerBoxes['vanish'][idx].checked = !registerBoxes['vanish'][idx].checked
    if (registerBoxes['vanish'][idx].checked) {
      registerBoxes['vanish'].forEach((item, index) => {
        if (index !== idx) {
          item.disabled = true
        }
      })
    } else {
      registerBoxes['vanish'].forEach((item, index) => {
        item.disabled = false
      })
    }
    this.setState({ registerBoxes })
  }
  onHandleVanishNoduleCheckClick(e) {
    e.stopPropagation()
  }
  isAllCheck() {
    let allChecked = true
    // let notAllChecked = true
    const registerBoxes = this.state.registerBoxes
    registerBoxes['match'].forEach((item, index) => {
      if (!item['earlier'].checked || !item['later'].checked) {
        allChecked = false
      }
    })
    this.setState({
      matchNodulesAllChecked: allChecked,
    })
  }
  onRegisterClick() {
    const { registerBoxes } = this.state
    const newBoxes = registerBoxes['new']
    const vanishBoxes = registerBoxes['vanish']
    let selectedNewBox = [],
      selectedVanishBox = [],
      selectedNewIdx = -1,
      selectedVanishIdx = -1
    newBoxes.forEach((item, index) => {
      if (item.checked) {
        selectedNewBox.push(item)
        selectedNewIdx = index
      }
    })
    vanishBoxes.forEach((item, index) => {
      if (item.checked) {
        selectedVanishBox.push(item)
        selectedVanishIdx = index
      }
    })
    if (this.state.curCaseId === this.state.preCaseId) {
      message.error('??????CT?????????????????????')
    } else if (selectedNewBox.length === 0 || selectedVanishBox.length === 0) {
      message.warning('??????????????????????????????')
    } else if (selectedNewBox.length === 1 && selectedVanishBox.length === 1) {
      //api,caseId-nodule_no*2
      if (selectedNewIdx !== -1 && selectedVanishIdx !== -1) {
        const matchParams = {
          patientId: registerBoxes.patientId,
          firstDocumentId: selectedNewBox[0].documentId,
          secondDocumentId: selectedVanishBox[0].documentId,
        }
        axios.post(this.config.nodule.noduleMatch, qs.stringify(matchParams)).then((matchRes) => {
          let status = matchRes.data.status
          if (status === 'okay') {
            registerBoxes['new'].splice(selectedNewIdx, 1)
            registerBoxes['vanish'].splice(selectedVanishIdx, 1)
            selectedVanishBox[0].checked = false
            selectedNewBox[0].checked = false
            let matchBox = {
              earlier: selectedVanishBox[0],
              later: selectedNewBox[0],
            }
            // matchBox.earlier = selectedVanishBox
            // matchBox['later'] = selectedNewBox
            registerBoxes['match'].push(matchBox)
            registerBoxes['new'].forEach((item) => {
              item.disabled = false
            })
            registerBoxes['vanish'].forEach((item) => {
              item.disabled = false
            })
            console.log('onRegisterClick', registerBoxes)
            this.setState({ registerBoxes })
          } else if (status === 'failed') {
            if (matchRes.data.errorCode === 'Match-0001' || matchRes.data.errorCode === 'Match-0002') {
              message.error('?????????????????????????????????')
            } else if (matchRes.data.errorCode === 'Match-0003') {
              message.error('???????????????')
            }
          }
        })
      }
    }
  }
  mousedownFunc = (e) => {
    let path = e.path
    if (path && path.length > 2) {
      if (
        document.getElementById('followup-histogram-header') &&
        document.getElementsByClassName('followup-histogram-float-active') &&
        document.getElementsByClassName('followup-histogram-float-active').length
      ) {
        if (path[1] === document.getElementById('followup-histogram-header')) {
          let initX,
            initY,
            element_float = document.getElementsByClassName('followup-histogram-float-active')[0],
            wrapLeft = parseInt(window.getComputedStyle(element_float)['left']),
            wrapRight = parseInt(window.getComputedStyle(element_float)['top'])
          const mousemoveFunc = (mousemoveEvent) => {
            var nowX = mousemoveEvent.clientX,
              nowY = mousemoveEvent.clientY,
              disX = nowX - initX,
              disY = nowY - initY
            element_float.style.left = wrapLeft + disX + 'px'
            element_float.style.top = wrapRight + disY + 'px'
          }
          const mouseupFunc = (mouseupEvent) => {
            wrapLeft = parseInt(window.getComputedStyle(element_float)['left'])
            wrapRight = parseInt(window.getComputedStyle(element_float)['top'])
            window.removeEventListener('mousemove', mousemoveFunc)
            window.removeEventListener('mouseup', mouseupFunc)
          }
          initX = e.clientX
          initY = e.clientY
          window.addEventListener('mousemove', mousemoveFunc, false)
          window.addEventListener('mouseup', mouseupFunc, false)
        }
      }
    }
  }
  featureAnalysis(idx, e) {
    const activeMatchNewNoduleNo = this.state.registerBoxes.match[idx].later.nodule_no
    const activeMatchPreNoduleNo = this.state.registerBoxes.match[idx].earlier.nodule_no
    console.log('activeMatchNewNoduleNo', activeMatchNewNoduleNo, activeMatchPreNoduleNo)
    if (activeMatchNewNoduleNo !== -1 && activeMatchPreNoduleNo !== -1) {
      this.setState({ activeMatchNewNoduleNo, activeMatchPreNoduleNo, activeMatchPreNoduleNo: activeMatchPreNoduleNo })
      const { curBoxes, preBoxes } = this.state
      let curIndex = _.findIndex(curBoxes, { nodule_no: activeMatchNewNoduleNo })
      let activeMatchNewBox = curBoxes[curIndex]
      let preIndex = _.findIndex(preBoxes, { nodule_no: activeMatchPreNoduleNo })
      let activeMatchPreBox = preBoxes[preIndex]
      let maxHU = Math.max(activeMatchNewBox.huMax, activeMatchPreBox.huMax)
      let minHU = Math.min(activeMatchNewBox.huMin, activeMatchPreBox.huMin)
      console.log('featureAna', activeMatchNewBox, activeMatchPreBox, maxHU, minHU)
      var histogram_float = document.getElementsByClassName('followup-histogram-float')
      if (histogram_float[0] !== undefined) {
        histogram_float[0].className = 'followup-histogram-float-active'
      }
      var absHU = Math.ceil((maxHU - minHU) / 150) * 150
      let range_maxHU = Math.ceil(maxHU / 50) * 50
      let range_minHU = range_maxHU - absHU
      this.setState({ HUSliderRange: [range_minHU, range_maxHU] })
      this.plotHistogram(activeMatchNewBox, 'chart-current', maxHU, minHU)
      this.plotHistogram(activeMatchPreBox, 'chart-previous', maxHU, minHU)
    }
  }
  plotHistogram(box, dom, maxHU, minHU) {
    let a = 100 / (maxHU - minHU)
    let b = 100 - a * maxHU
    let abs = maxHU - minHU
    let min = 0
    let max = 100
    let searchBetween = function (arr, arr_n, min, max) {
      var flag = 0
      for (let i = 0; i < arr.length; i++) {
        if (arr[i] < max && arr[i] >= min) {
          if (i === arr.length - 1) {
            flag = flag + 0
          } else {
            flag = flag + arr_n[i]
          }
        } else if (arr[i] >= max) {
          return flag
        }
      }
      return flag
    }
    var bins = box.nodule_hist.bins
    var ns = box.nodule_hist.n
    const { HUSliderRange } = this.state
    let range_min = HUSliderRange[0] * a + b
    let range_max = HUSliderRange[1] * a + b
    var chartDom = document.getElementById(dom)
    console.log('chartdom', chartDom, dom)
    let series_data = []
    let axis_data = []
    for (let i = 0; i <= abs / 10; i++) {
      let series = searchBetween(bins, ns, minHU + 10 * i, minHU + 10 * (i + 1))
      if (series !== 0) {
        series_data.push(series)
        axis_data.push(minHU + 10 * i)
      }
    }
    if (axis_data && axis_data.length) {
      range_min = 0
      range_max = axis_data.length
      for (let i = 0; i < axis_data.length - 1; i++) {
        if (HUSliderRange[1] - HUSliderRange[0] <= 10) {
          if (HUSliderRange[0] >= axis_data[i] && HUSliderRange[0] < axis_data[i + 1]) {
            range_min = i
            range_max = i + 1
          }
        } else {
          if (HUSliderRange[0] === axis_data[axis_data.length - 1]) {
            range_min = axis_data.length
          } else if (HUSliderRange[0] >= axis_data[i] && HUSliderRange[0] < axis_data[i + 1]) {
            range_min = i
          }
          if (HUSliderRange[1] === axis_data[axis_data.length - 1]) {
            range_max = axis_data.length
          } else if (HUSliderRange[1] >= axis_data[i] && HUSliderRange[1] < axis_data[i + 1]) {
            range_max = i
          }
        }
      }
    }
    if (echarts.getInstanceByDom(chartDom)) {
      console.log('dispose')
      echarts.dispose(chartDom)
    }
    var myChart = echarts.init(chartDom)
    myChart.setOption({
      // color: ['#00FFFF'],
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          // ??????????????????????????????????????????
          type: 'line', // ??????????????????????????????'line' | 'shadow'
        },
      },
      grid: {
        bottom: '3%',
        top: '10%',
        containLabel: true,
      },
      xAxis: [
        {
          type: 'category',
          scale: 'true',
          // min: min,
          // max: max,
          data: axis_data,
          axisTick: {
            alignWithLabel: true,
          },
        },
      ],
      yAxis: [
        {
          type: 'value',
          minInterval: 1,
        },
      ],
      series: [
        {
          name: 'count',
          type: 'bar',
          data: series_data,
        },
      ],
      visualMap: {
        show: false,
        type: 'piecewise',
        dimension: 0,
        pieces: [
          {
            // gt: min,
            lte: range_min,
            color: '#447DF1',
          },
          {
            gt: range_min,
            lte: range_max,
            color: '#59A2E6',
          },
          {
            gt: range_max,
            // lte: max,
            color: '#46E6FE',
          },
        ],
        outOfRange: {
          color: '#59A2E6',
        },
      },
    })
  }
  onHUValueChange(value) {
    this.setState({ HUSliderRange: value })
    console.log('onHUValueChange', value)
  }
}

export default connect(
  (state) => {
    return {
      loadedImages: state.dataCenter.loadedImages,
      curDate: state.dataCenter.curDate,
      preDate: state.dataCenter.preDate,
      isDragging: state.dataCenter.isDragging,
      followUpIsPlaying: state.dataCenter.followUpisPlaying,
      followUpActiveTool: state.dataCenter.followUpActiveTool,
    }
  },
  (dispatch) => {
    return {
      setFollowUpActiveTool: (toolName) => dispatch(setFollowUpActiveTool(toolName)),
      setFollowUpLoadingCompleted: (loadingCompleted) => dispatch(setFollowUpLoadingCompleted(loadingCompleted)),
      updateLoadedImageNumber: (loadedImageIndex, caseId) => dispatch(updateLoadedImageNumber(loadedImageIndex, caseId)),
      dispatch,
    }
  }
)(FollowUpElement)
