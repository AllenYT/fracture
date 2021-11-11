import React, { Component, PureComponent } from 'react'
import ReactHtmlParser from 'react-html-parser'
import dicomParser from 'dicom-parser'
import * as cornerstone from 'cornerstone-core'
import * as cornerstoneMath from 'cornerstone-math'
import * as cornerstoneTools from 'cornerstone-tools'
import Hammer from 'hammerjs'
import * as cornerstoneWadoImageLoader from 'cornerstone-wado-image-loader'
import '../css/FollowUpElement.css'
import qs from 'qs'
import axios from 'axios'
import PropTypes from 'prop-types'
import { helpers } from '../vtk/helpers/index.js'
import copy from 'copy-to-clipboard'
import { connect } from 'react-redux'
import { getImageIdsByCaseId, getNodulesByCaseId, dropCaseId, setFollowUpActiveTool } from '../actions'
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
} from '@fortawesome/free-solid-svg-icons'

import { Dropdown, Menu, Icon, Image, Button, Accordion, Popup, Form } from 'semantic-ui-react'
import { Checkbox, Row, Col, Typography, Cascader, Button as AntdButton, Divider, Tag, Tabs, Radio, Input, Select, message } from 'antd'
import src1 from '../images/scu-logo.jpg'
import FollowUpViewport from './FollowUpViewport'
import '../vtk/ViewportOverlay/ViewportOverlay.css'
import * as echarts from 'echarts/lib/echarts'

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
  0: '无法定位',
  1: '右肺中叶',
  2: '右肺上叶',
  3: '右肺下叶',
  4: '左肺上叶',
  5: '左肺下叶',
}
const lungLoc = {
  S1: '右肺上叶-尖段',
  S2: '右肺上叶-后段',
  S3: '右肺上叶-前段',
  S4: '右肺中叶-外侧段',
  S5: '右肺中叶-内侧段',
  S6: '右肺下叶-背段',
  S7: '右肺下叶-内基底段',
  S8: '右肺下叶-前基底段',
  S9: '右肺下叶-外基底段',
  S10: '右肺下叶-后基底段',
  S11: '左肺上叶-尖后段',
  S12: '左肺上叶-前段',
  S13: '左肺上叶-上舌段',
  S14: '左肺上叶-下舌段',
  S15: '左肺下叶-背段',
  S16: '左肺下叶-内前基底段',
  S17: '左肺下叶-外基底段',
  S18: '左肺下叶-后基底段',
}
const dangerLevel = {
  1: '低危',
  2: '中危',
  3: '高危',
}
const densityList = {
  1: '磨玻璃',
  2: '半实性',
  3: '实性',
}

const { Option } = Select

class FollowUpElement extends Component {
  constructor(props) {
    super(props)
    this.state = {
      username: props.username,
      curImageIds: props.curInfo.curImageIds,
      curCaseId: props.curInfo.curCaseId,
      curBoxes: props.curInfo.curBoxes,
      preImageIds: props.preInfo.preImageIds,
      preCaseId: props.preInfo.preCaseId,
      preBoxes: props.preInfo.preBoxes,
      currentIdx: 0,
      isOverlayVisible: true,
      isAnnoVisible: true,
      previewsIdx: 0,
      clicked: false,
      clickedArea: {},
      showNodules: true,
      showInfo: true,
      activeViewportIndex: 0,
      curViewportIndex: 0,
      preViewportIndex: 1,
      curImageIdIndex: 0,
      preImageIdIndex: 0,
      isPlaying: false,
      frameRate: 22,
      isRegistering: false,
      curListsActiveIndex: -1,
      preListsActiveIndex: -1,
      newCornerstoneElement: null,
      preCornerstoneElement: null,
      registerBoxes: '',
      templateText: '',
      vanishNodules: [],
      newNodules: [],
      matchNodules: [],
      noduleTblCheckedValue: ['vanish', 'new', 'match'],
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
      activeTool: 'Wwwc',
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
      reportGuideType: '中华共识',
      reportImageType: '结节类型',
      reportGuideText: '',
      reportImageText: '',
      reportImageTop: 0,
      reportImageHeight: 0,
      reportImageContentHeight: 0,
      curNodulesAllChecked: false,
      preNodulesAllChecked: false,
      sortChanged: false,
    }
    this.config = JSON.parse(localStorage.getItem('config'))
    this.nextPath = this.nextPath.bind(this)
    this.noduleTblCheckboxChange = this.noduleTblCheckboxChange.bind(this)
    this.drawCustomRectangleRoi = this.drawCustomRectangleRoi.bind(this)
    // this.onKeydown = this.onKeydown.bind(this);
  }

  componentDidMount() {
    this.props.onRef(this)
    console.log('followup props', this.props)
    const curInfo = this.props.curInfo
    if (curInfo.curImageIds && curInfo.curCaseId && curInfo.curBoxes) {
      const curImagePromise = curInfo.curImageIds.map((curImageId) => {
        return cornerstone.loadAndCacheImage(curImageId)
      })
      Promise.all(curImagePromise).then(() => {})
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
    const preInfo = this.props.preInfo
    if (preInfo.preImageIds && preInfo.preCaseId && preInfo.preBoxes) {
      const preImagePromise = preInfo.preImageIds.map((preImageId) => {
        return cornerstone.loadAndCacheImage(preImageId)
      })
      Promise.all(preImagePromise).then(() => {})
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
    window.addEventListener('resize', this.resizeScreen.bind(this))
    // var templateText = ''
    // for (let i = 0; i < curBoxes.length; i++) {
    //   let location = ''
    //   let diameter = ''
    //   let texture = ''
    //   let representArray = []
    //   let represent = ''
    //   let malignancy = ''

    //   location = lungLoc[curBoxes[i]['segment']]

    //   if (curBoxes[i]['diameter'] !== undefined) {
    //     diameter = curBoxes[i]['diameter'].toFixed(1) + 'mm'
    //   } else {
    //     diameter = '未知'
    //   }
    //   if (curBoxes[i]['texture'] === 2) {
    //     texture = '实性'
    //   } else if (curBoxes[i]['texture'] === 3) {
    //     texture = '半实性'
    //   } else {
    //     texture = '磨玻璃'
    //   }

    //   if (curBoxes[i]['lobulation'] === 2) {
    //     representArray.push('分叶')
    //   }
    //   if (curBoxes[i]['spiculation'] === 2) {
    //     representArray.push('毛刺')
    //   }
    //   if (curBoxes[i]['calcification'] === 2) {
    //     representArray.push('钙化')
    //   }
    //   if (curBoxes[i]['pin'] === 2) {
    //     representArray.push('胸膜凹陷')
    //   }
    //   if (curBoxes[i]['cav'] === 2) {
    //     representArray.push('空洞')
    //   }
    //   if (curBoxes[i]['vss'] === 2) {
    //     representArray.push('血管集束')
    //   }
    //   if (curBoxes[i]['bea'] === 2) {
    //     representArray.push('空泡')
    //   }
    //   if (curBoxes[i]['bro'] === 2) {
    //     representArray.push('支气管充气')
    //   }
    //   for (let index = 0; index < representArray.length; index++) {
    //     if (index === 0) {
    //       represent = representArray[index]
    //     } else {
    //       represent = represent + '、' + representArray[index]
    //     }
    //   }
    //   if (curBoxes[i]['malignancy'] === 3) {
    //     malignancy = '风险较高。'
    //   } else if (curBoxes[i]['malignancy'] === 2) {
    //     malignancy = '风险中等。'
    //   } else {
    //     malignancy = '风险较低。'
    //   }
    //   if (represent === '') {
    //     templateText = templateText + location + ' ( Im ' + curBoxes[i]['slice_idx'] + ') 见' + texture + '结节, 大小为' + diameter + ', ' + malignancy + '\n'
    //   } else {
    //     templateText = templateText + location + ' ( Im ' + curBoxes[i]['slice_idx'] + ') 见' + texture + '结节, 大小为' + diameter + ', 可见' + represent + ', ' + malignancy + '\n'
    //   }
    // }
    // this.setState({ templateText: templateText })
    // document.addEventListener("keydown", this.onKeydown);
  }

  componentWillMount() {
    document.getElementById('header').style.display = 'none'
  }
  componentWillUnmount() {}
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
  changeImageIndex(type) {
    if (type === 'cur') {
      const curBoxes = this.state.curBoxes
      let curImageIdIndex = this.state.curImageIdIndex
      let tmpIndex = this.state.curImageIdIndex

      if (curImageIdIndex === 0) {
        tmpIndex = 1
        console.log('显示第一张ct')
      } else if (curImageIdIndex === 1) {
        tmpIndex = 0
        console.log('显示第零张ct')
      } else if (curImageIdIndex > 1) {
        if (curBoxes && curBoxes.length) {
          tmpIndex = curBoxes[0].slice_idx - 1
        }
        console.log('显示当前结节')
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
        console.log('显示第一张ct')
      } else if (preImageIdIndex === 1) {
        tmpIndex = 0
        console.log('显示第零张ct')
      } else if (preImageIdIndex > 0) {
        if (preBoxes && preBoxes.length) {
          tmpIndex = preBoxes[0].slice_idx - 1
        }
        console.log('显示当前结节')
      }
      this.setState({
        preImageIdIndex: tmpIndex,
      })
    }
  }
  componentDidUpdate(prevProps, prevState) {
    if (prevState.activeViewportIndex !== this.state.activeViewportIndex) {
      console.log('activeidx', this.state.activeViewportIndex)
    }
    if (prevProps.curInfo !== this.props.curInfo) {
      const curInfo = this.props.curInfo
      if (curInfo.curImageIds && curInfo.curCaseId && curInfo.curBoxes) {
        const curImagePromise = curInfo.curImageIds.map((curImageId) => {
          return cornerstone.loadAndCacheImage(curImageId)
        })
        Promise.all(curImagePromise).then(() => {})
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
      if (preInfo.preImageIds && preInfo.preCaseId && preInfo.preBoxes) {
        const preImagePromise = preInfo.preImageIds.map((preImageId) => {
          return cornerstone.loadAndCacheImage(preImageId)
        })
        Promise.all(preImagePromise).then(() => {})
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
      const params = {
        earlierCaseId: this.state.preCaseId,
        laterCaseId: this.state.curCaseId,
      }
      axios.post(this.config.draft.getRectsForFollowUp, qs.stringify(params)).then((followupRectRes) => {
        console.log('followupRect', followupRectRes.data)
        const followupRect = followupRectRes.data
        this.setState({ registerBoxes: followupRect })
      })

      this.setState({ isRegistering: true }, () => {
        this.resizeScreen()
      })
    }
  }

  // onKeydown(event) {
  //   console.log(event.which);

  //   if (event.which == 38) {
  //     //切换结节list
  //     event.preventDefault();
  //     const curListsActiveIndex = this.state.curListsActiveIndex;
  //     // if (curListsActiveIndex > 0) this.keyDownListSwitch(curListsActiveIndex - 1);
  //   }

  //   if (event.which == 40) {
  //     //切换结节list
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
    } else if (status === 'previews') {
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

  onDangerLevelChange = (idx, status, val) => {
    if (status === 'current') {
      let box = this.state.curBoxes
      console.log('risk', val)
      box[idx].malignancy = val[0]
      this.setState({ curBoxes: box })
      console.log('change location', this.state.curBoxes)
    } else {
      let box = this.state.preBoxes
      console.log('risk', val)
      box[idx].malignancy = val[0]
      this.setState({ preBoxes: box })
      console.log('change location', this.state.preBoxes)
    }
  }

  measure(e) {
    console.log('measurements', e)
  }

  handleListClick = (currentIdx, index, status, event) => {
    //点击list-item
    if (status === 'current') {
      const { curListsActiveIndex } = this.state
      const newIndex = curListsActiveIndex === index ? -1 : index
      console.log('curidx', index, curListsActiveIndex)
      const targets = document.getElementsByClassName('viewport-element')
      this.setState(
        {
          curListsActiveIndex: newIndex,
          curImageIdIndex: currentIdx - 1,
          currentIdx: currentIdx,
        },
        () => {
          const { curBoxes, curImageIds } = this.state
          const currentTarget = targets[0]
          var toolData = cornerstoneTools.getToolState(currentTarget, 'RectangleRoi')
          console.log('toolData before', toolData)
          for (let i = 0; i < curBoxes.length; i++) {
            if (curBoxes[i].slice_idx === currentIdx) {
              if (curBoxes[i].uuid === undefined) {
                cornerstone.loadImage(curImageIds[curBoxes[i].slice_idx - 1]).then(function () {
                  // cornerstone.updateImage(currentTarget)
                  console.log('box', curBoxes[i], curBoxes[i].slice_idx, currentIdx)
                  const measurementData = {
                    visible: true,
                    active: true,
                    color: undefined,
                    invalidated: true,
                    handles: {
                      start: {
                        x: curBoxes[i].x1,
                        y: curBoxes[i].y1,
                        highlight: true,
                        active: false,
                      },
                      end: {
                        x: curBoxes[i].x2,
                        y: curBoxes[i].y2,
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
                  cornerstoneTools.addToolState(currentTarget, 'RectangleRoi', measurementData)
                  toolData = cornerstoneTools.getToolState(currentTarget, 'RectangleRoi')
                  console.log('toolData after', toolData)
                  curBoxes[i].uuid = toolData.data[0].uuid

                  cornerstoneTools.setToolEnabledForElement(currentTarget, 'RectangleRoi')
                })
                break
              }
            }
            // }
            this.setState({ curBoxes: curBoxes })
          }
        }
      )
    } else if (status === 'previews') {
      const { preListsActiveIndex } = this.state
      const newIndex = preListsActiveIndex === index ? -1 : index
      const targets = document.getElementsByClassName('viewport-element')
      console.log('curidx', index, preListsActiveIndex)
      this.setState(
        {
          preListsActiveIndex: newIndex,
          preImageIdIndex: currentIdx - 1,
          previewsIdx: currentIdx,
        },
        () => {
          const { preBoxes, preImageIds } = this.state
          const previewsTarget = targets[1]
          var toolData = cornerstoneTools.getToolState(previewsTarget, 'RectangleRoi')
          console.log('toolData before', toolData)
          for (let i = 0; i < preBoxes.length; i++) {
            if (preBoxes[i].slice_idx === currentIdx) {
              if (preBoxes[i].uuid === undefined) {
                cornerstone.loadImage(preImageIds[preBoxes[i].slice_idx - 1]).then(function () {
                  cornerstone.updateImage(previewsTarget)

                  const measurementData = {
                    visible: true,
                    active: true,
                    color: undefined,
                    invalidated: true,
                    handles: {
                      start: {
                        x: preBoxes[i].x1,
                        y: preBoxes[i].y1,
                        highlight: true,
                        active: false,
                      },
                      end: {
                        x: preBoxes[i].x2,
                        y: preBoxes[i].y2,
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
                  cornerstoneTools.addToolState(previewsTarget, 'RectangleRoi', measurementData)
                  toolData = cornerstoneTools.getToolState(previewsTarget, 'RectangleRoi')
                  console.log('toolData after', toolData)
                  preBoxes[i].uuid = toolData.data[0].uuid

                  cornerstoneTools.setToolEnabledForElement(previewsTarget, 'RectangleRoi')
                })
                break
              }
            }
            // }
            this.setState({ preBoxes: preBoxes })
          }
        }
      )
    }
  }

  onMatchNoduleChange(newNodule, previewsNodule) {
    console.log('onMatchNoduleChange', newNodule, previewsNodule)
    this.setState(
      {
        curImageIdIndex: newNodule.slice_idx - 1,
        preImageIdIndex: previewsNodule.slice_idx - 1,
      },
      () => {
        const targets = document.getElementsByClassName('viewport-element')
        const currentTarget = targets[0]
        const previewTarget = targets[1]
        if (newNodule.uuid === undefined) {
          const { curImageIds, curBoxes } = this.state
          const curNodule_uuid = this.drawCustomRectangleRoi(currentTarget, newNodule, curImageIds)
          const cur_nodule_idx = Number(newNodule.nodule_no)
          curBoxes[cur_nodule_idx - 1] = curNodule_uuid
          this.setState({ curBoxes: curBoxes })
        }
        if (previewsNodule.uuid === undefined) {
          const { preImageIds, preBoxes } = this.state
          const previewsNodule_uuid = this.drawCustomRectangleRoi(previewTarget, previewsNodule, preImageIds)
          const pre_nodule_idx = Number(previewsNodule.nodule_no)
          preBoxes[pre_nodule_idx - 1] = previewsNodule_uuid
          this.setState({ preBoxes: preBoxes })
        }
      }
    )
    this.setState({ activeTool: 'RectangleRoi' })
  }

  onNewNoduleChange(nodule) {
    this.setState(
      {
        curImageIdIndex: nodule.slice_idx - 1,
      },
      () => {
        const targets = document.getElementsByClassName('viewport-element')
        const currentTarget = targets[0]
        if (nodule.uuid === undefined) {
          const { curImageIds, curBoxes } = this.state
          const curNodule_uuid = this.drawCustomRectangleRoi(currentTarget, nodule, curImageIds)
          const cur_nodule_idx = Number(nodule.nodule_no)
          curBoxes[cur_nodule_idx - 1] = curNodule_uuid
          this.setState({ curBoxes: curBoxes })
        }
      }
    )
  }

  onPreNoduleChange(nodule) {
    this.setState(
      {
        preImageIdIndex: nodule.slice_idx - 1,
      },
      () => {
        const targets = document.getElementsByClassName('viewport-element')
        const previewsTarget = targets[1]
        if (nodule.uuid === undefined) {
          const { preImageIds, preBoxes } = this.state
          const preNodule_uuid = this.drawCustomRectangleRoi(previewsTarget, nodule, preImageIds)
          const pre_nodule_idx = Number(nodule.nodule_no)
          preBoxes[pre_nodule_idx - 1] = preNodule_uuid
          this.setState({ preBoxes: preBoxes })
        }
      }
    )
  }

  drawCustomRectangleRoi(target, nodule, imageIds) {
    cornerstone.loadImage(imageIds[nodule.slice_idx - 1]).then(function () {
      cornerstone.updateImage(target)
      const measurementData = {
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
      console.log('toolData after', toolData)
      nodule.uuid = toolData.data[0].uuid

      cornerstoneTools.setToolEnabledForElement(target, 'RectangleRoi')
    })
    return nodule
  }

  noduleTblCheckboxChange(checkedValues) {
    this.setState({ noduleTblCheckedValue: checkedValues })
    console.log('checkedValues', checkedValues)
  }

  onDensityChange(idx, status, val, e) {
    if (status === 'register-new') {
      let box = this.state.registerBoxes
      box['new'][idx].texture = val[0]
      this.setState({ registerBox: box })
    } else if (status === 'register-vanish') {
      let box = this.state.registerBoxes
      box['vanish'][idx].texture = val[0]
      this.setState({ registerBox: box })
    } else if (status === 'register-match-new') {
      let box = this.state.registerBoxes
      box['match'][idx]['later'].texture = val[0]
      this.setState({ registerBox: box })
    } else if (status === 'register-match-previews') {
      let box = this.state.registerBoxes
      box['match'][idx]['earlier'].texture = val[0]
      this.setState({ registerBox: box })
    }
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
    if (newViewport.scale <= 5) {
      newViewport.scale = 1 + newViewport.scale
    } else {
      newViewport.scale = 6
    }
    cornerstone.setViewport(newCornerstoneElement, newViewport)
    let preCornerstoneElement = this.state.preCornerstoneElement
    let preViewport = cornerstone.getViewport(preCornerstoneElement)
    if (preViewport.scale <= 5) {
      preViewport.scale = 1 + preViewport.scale
    } else {
      preViewport.scale = 6
    }
    cornerstone.setViewport(preCornerstoneElement, preViewport)
  }

  ZoomOut() {
    let newCornerstoneElement = this.state.newCornerstoneElement
    let newViewport = cornerstone.getViewport(newCornerstoneElement)
    if (newViewport.scale >= 2) {
      newViewport.scale = newViewport.scale - 1
    } else {
      newViewport.scale = 1
    }
    cornerstone.setViewport(newCornerstoneElement, newViewport)
    let preCornerstoneElement = this.state.preCornerstoneElement
    let preViewport = cornerstone.getViewport(preCornerstoneElement)
    if (preViewport.scale >= 2) {
      preViewport.scale = preViewport.scale - 1
    } else {
      preViewport.scale = 1
    }
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

  playAnimation() {
    this.setState(({ isPlaying }) => ({
      isPlaying: !isPlaying,
    }))
  }

  wwwcCustom() {
    this.props.setFollowUpActiveTool('Wwwc')
    this.setState({ activeTool: 'Wwwc' })
  }

  ScrollStack() {
    this.props.setFollowUpActiveTool('StackScroll')
    this.setState({ activeTool: 'StackScroll' })
  }

  startAnnos() {
    this.props.setFollowUpActiveTool('RectangleRoi')
    this.setState({ activeTool: 'RectangleRoi' })
  }

  bidirectionalMeasure() {
    this.props.setFollowUpActiveTool('Bidirectional')
    this.setState({ activeTool: 'Bidirectional' })
  }

  lengthMeasure() {
    this.props.setFollowUpActiveTool('Length')
    this.setState({ activeTool: 'Length' })
  }

  eraseAnno() {
    this.props.setFollowUpActiveTool('Eraser')
    this.setState({ activeTool: 'Eraser' })
  }
  onChangeViewportSort() {
    this.setState((prevState) => ({
      sortChanged: !prevState.sortChanged,
    }))
  }
  render() {
    const welcome = '欢迎您，' + localStorage.realname
    const {
      curListsActiveIndex,
      preListsActiveIndex,
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
    const repretationOptions = [
      { key: '分叶', text: '分叶', value: '分叶' },
      { key: '毛刺', text: '毛刺', value: '毛刺' },
      { key: '钙化', text: '钙化', value: '钙化' },
      { key: '胸膜凹陷', text: '胸膜凹陷', value: '胸膜凹陷' },
      { key: '血管集束', text: '血管集束', value: '血管集束' },
      { key: '空泡', text: '空泡', value: '空泡' },
      { key: '空洞', text: '空洞', value: '空洞' },
      { key: '支气管充气', text: '支气管充气', value: '支气管充气' },
    ]

    if (registerBoxes !== '') {
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
          representArray.push('分叶')
        }
        if (inside.spiculation === 2) {
          representArray.push('毛刺')
        }
        if (inside.calcification === 2) {
          representArray.push('钙化')
        }
        if (inside.pin === 2) {
          representArray.push('胸膜凹陷')
        }
        if (inside.cav === 2) {
          representArray.push('空洞')
        }
        if (inside.vss === 2) {
          representArray.push('血管集束')
        }
        if (inside.bea === 2) {
          representArray.push('空泡')
        }
        if (inside.bro === 2) {
          representArray.push('支气管充气')
        }
        if (inside.segment && inside.segment !== 'None') {
          locationValues = lungLoc[inside.segment].split('-')
        } else {
          if (inside.place) {
            locationValues = [nodulePlaces[inside.place]]
          } else {
            locationValues = ['无法定位']
          }
        }

        // if(this.state.readonly){
        if (inside.visible) {
          return (
            <div key={idx} className={'highlightTbl' + (curListsActiveIndex === idx ? ' highlightTbl-active' : '')}>
              <Accordion.Title onClick={this.handleListClick.bind(this, inside.slice_idx, idx, 'current')} active={curListsActiveIndex === idx} index={idx}>
                <div className="nodule-accordion-item-title">
                  <div className="nodule-accordion-item-title-start">
                    <div className="nodule-accordion-item-title-index">
                      <div style={inside.modified === undefined ? { fontSize: 'large', color: 'whitesmoke' } : { fontSize: 'large', color: '#dbce12' }}>{inside.visibleIdx + 1}</div>
                    </div>

                    <Checkbox
                      className="nodule-accordion-item-title-checkbox"
                      checked={inside.checked}
                      onChange={this.onHandleNoduleCheckChange.bind(this, idx, 'current')}
                      onClick={this.onHandleNoduleCheckClick.bind(this)}>
                      {parseInt(inside.slice_idx) + 1}
                    </Checkbox>
                    <div className="nodule-accordion-item-title-type">
                      <Select
                        className="nodule-accordion-item-title-select"
                        dropdownMatchSelectWidth={true}
                        defaultValue={inside.texture}
                        value={inside.texture}
                        bordered={false}
                        showArrow={false}
                        dropdownClassName={'corner-select-dropdown'}
                        onChange={this.onSelectTex.bind(this, idx, 'current')}
                        onClick={this.onSelectTexClick.bind(this)}>
                        <Option className="nodule-accordion-item-title-select-option" value={-1}>
                          未知
                        </Option>
                        <Option className="nodule-accordion-item-title-select-option" value={1}>
                          磨玻璃
                        </Option>
                        <Option className="nodule-accordion-item-title-select-option" value={2}>
                          实性
                        </Option>
                        <Option className="nodule-accordion-item-title-select-option" value={3}>
                          半实性
                        </Option>
                      </Select>
                    </div>
                  </div>

                  {ll === 0 && sl === 0 ? (
                    <div className="nodule-accordion-item-title-shape nodule-accordion-item-title-center">{(diameter / 10).toFixed(2) + 'cm'}</div>
                  ) : (
                    <div className="nodule-accordion-item-title-shape nodule-accordion-item-title-center">{(ll / 10).toFixed(2) + '×' + (sl / 10).toFixed(2) + 'cm'}</div>
                  )}

                  <div className="nodule-accordion-item-title-end">
                    <div className="nodule-accordion-item-title-location">
                      <Cascader
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
                      />
                    </div>

                    <div className="nodule-accordion-item-title-mal">
                      <Select
                        className={'nodule-accordion-item-title-select ' + ` nodule-accordion-item-title-select-${inside.malignancy}`}
                        defaultValue={inside.malignancy}
                        value={inside.malignancy}
                        bordered={false}
                        showArrow={false}
                        dropdownClassName={'corner-select-dropdown'}
                        onChange={this.onSelectMal.bind(this, idx, 'current')}
                        onClick={this.onSelectMalClick.bind(this)}>
                        <Option className={'nodule-accordion-item-title-select-option'} value={-1}>
                          未知
                        </Option>
                        <Option className={'nodule-accordion-item-title-select-option'} value={1}>
                          低危
                        </Option>
                        <Option className={'nodule-accordion-item-title-select-option'} value={2}>
                          中危
                        </Option>
                        <Option className={'nodule-accordion-item-title-select-option'} value={3}>
                          高危
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
              {'\xa0\xa0' + (ll / 10).toFixed(2) + '\xa0\xa0' + ' ×' + '\xa0\xa0' + (sl / 10).toFixed(2) + ' cm'}
            </Grid.Column> */}
                    <div className="nodule-accordion-item-content-info-diam">{inside.volume !== undefined ? (Math.floor(inside.volume * 100) / 100).toFixed(2) + '\xa0cm³' : null}</div>
                    <div className="nodule-accordion-item-content-info-hu">{inside.huMin !== undefined && inside.huMax !== undefined ? inside.huMin + '~' + inside.huMax + 'HU' : null}</div>
                  </div>
                  {/* <Grid.Column widescreen={3} computer={3} textAlign='center'>
                                        <select id={texId} style={selectStyle} defaultValue="" disabled>
                                        <option value="" disabled="disabled">选择亚型</option>
                                        </select>
                                    </Grid.Column> */}

                  <div className="nodule-accordion-item-content-char">
                    <div className="nodule-accordion-item-content-char-title">表征:</div>
                    <div className="nodule-accordion-item-content-char-content">
                      <Select
                        className={'nodule-accordion-item-content-select'}
                        mode="multiple"
                        dropdownMatchSelectWidth={false}
                        defaultValue={inside.malignancy}
                        value={representArray}
                        bordered={false}
                        showArrow={false}
                        dropdownClassName={'corner-select-dropdown'}
                        onChange={this.representChange.bind(this, idx, 'current')}>
                        <Option className={'nodule-accordion-item-content-select-option'} value={'分叶'}>
                          分叶
                        </Option>
                        <Option className={'nodule-accordion-item-content-select-option'} value={'毛刺'}>
                          毛刺
                        </Option>
                        <Option className={'nodule-accordion-item-content-select-option'} value={'钙化'}>
                          钙化
                        </Option>
                        <Option className={'nodule-accordion-item-content-select-option'} value={'胸膜凹陷'}>
                          胸膜凹陷
                        </Option>
                        <Option className={'nodule-accordion-item-content-select-option'} value={'血管集束'}>
                          血管集束
                        </Option>
                        <Option className={'nodule-accordion-item-content-select-option'} value={'空泡'}>
                          空泡
                        </Option>
                        <Option className={'nodule-accordion-item-content-select-option'} value={'空洞'}>
                          空洞
                        </Option>
                        <Option className={'nodule-accordion-item-content-select-option'} value={'支气管充气'}>
                          支气管充气
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
          representArray.push('分叶')
        }
        if (inside.spiculation === 2) {
          representArray.push('毛刺')
        }
        if (inside.calcification === 2) {
          representArray.push('钙化')
        }
        if (inside.pin === 2) {
          representArray.push('胸膜凹陷')
        }
        if (inside.cav === 2) {
          representArray.push('空洞')
        }
        if (inside.vss === 2) {
          representArray.push('血管集束')
        }
        if (inside.bea === 2) {
          representArray.push('空泡')
        }
        if (inside.bro === 2) {
          representArray.push('支气管充气')
        }
        if (inside.segment && inside.segment !== 'None') {
          locationValues = lungLoc[inside.segment].split('-')
        } else {
          if (inside.place) {
            locationValues = [nodulePlaces[inside.place]]
          } else {
            locationValues = ['无法定位']
          }
        }

        // if(this.state.readonly){
        if (inside.visible) {
          return (
            <div key={idx} className={'highlightTbl' + (preListsActiveIndex === idx ? ' highlightTbl-active' : '')}>
              <Accordion.Title onClick={this.handleListClick.bind(this, inside.slice_idx, idx, 'previews')} active={preListsActiveIndex === idx} index={idx}>
                <div className="nodule-accordion-item-title">
                  <div className="nodule-accordion-item-title-start">
                    <div className="nodule-accordion-item-title-index">
                      <div style={inside.modified === undefined ? { fontSize: 'large', color: 'whitesmoke' } : { fontSize: 'large', color: '#dbce12' }}>{inside.visibleIdx + 1}</div>
                    </div>

                    <Checkbox
                      className="nodule-accordion-item-title-checkbox"
                      checked={inside.checked}
                      onChange={this.onHandleNoduleCheckChange.bind(this, idx, 'previews')}
                      onClick={this.onHandleNoduleCheckClick.bind(this)}>
                      {parseInt(inside.slice_idx) + 1}
                    </Checkbox>
                    <div className="nodule-accordion-item-title-type">
                      <Select
                        className="nodule-accordion-item-title-select"
                        dropdownMatchSelectWidth={true}
                        defaultValue={inside.texture}
                        value={inside.texture}
                        bordered={false}
                        showArrow={false}
                        dropdownClassName={'corner-select-dropdown'}
                        onChange={this.onSelectTex.bind(this, idx, 'previews')}
                        onClick={this.onSelectTexClick.bind(this)}>
                        <Option className="nodule-accordion-item-title-select-option" value={-1}>
                          未知
                        </Option>
                        <Option className="nodule-accordion-item-title-select-option" value={1}>
                          磨玻璃
                        </Option>
                        <Option className="nodule-accordion-item-title-select-option" value={2}>
                          实性
                        </Option>
                        <Option className="nodule-accordion-item-title-select-option" value={3}>
                          半实性
                        </Option>
                      </Select>
                    </div>
                  </div>

                  {ll === 0 && sl === 0 ? (
                    <div className="nodule-accordion-item-title-shape nodule-accordion-item-title-center">{(diameter / 10).toFixed(2) + 'cm'}</div>
                  ) : (
                    <div className="nodule-accordion-item-title-shape nodule-accordion-item-title-center">{(ll / 10).toFixed(2) + '×' + (sl / 10).toFixed(2) + 'cm'}</div>
                  )}

                  <div className="nodule-accordion-item-title-end">
                    <div className="nodule-accordion-item-title-location">
                      <Cascader
                        className="nodule-accordion-item-title-cascader"
                        bordered={false}
                        suffixIcon={null}
                        allowClear={false}
                        value={locationValues}
                        options={this.config.segment}
                        dropdownRender={(menus) => {
                          return <div onClick={this.onSelectPlaceClick.bind(this)}>{menus}</div>
                        }}
                        onChange={this.onSelectPlace.bind(this, idx, 'previews')}
                        onClick={this.onSelectPlaceClick.bind(this)}
                      />
                    </div>

                    <div className="nodule-accordion-item-title-mal">
                      <Select
                        className={'nodule-accordion-item-title-select ' + ` nodule-accordion-item-title-select-${inside.malignancy}`}
                        defaultValue={inside.malignancy}
                        value={inside.malignancy}
                        bordered={false}
                        showArrow={false}
                        dropdownClassName={'corner-select-dropdown'}
                        onChange={this.onSelectMal.bind(this, idx, 'previews')}
                        onClick={this.onSelectMalClick.bind(this)}>
                        <Option className={'nodule-accordion-item-title-select-option'} value={-1}>
                          未知
                        </Option>
                        <Option className={'nodule-accordion-item-title-select-option'} value={1}>
                          低危
                        </Option>
                        <Option className={'nodule-accordion-item-title-select-option'} value={2}>
                          中危
                        </Option>
                        <Option className={'nodule-accordion-item-title-select-option'} value={3}>
                          高危
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
              {'\xa0\xa0' + (ll / 10).toFixed(2) + '\xa0\xa0' + ' ×' + '\xa0\xa0' + (sl / 10).toFixed(2) + ' cm'}
            </Grid.Column> */}
                    <div className="nodule-accordion-item-content-info-diam">{inside.volume !== undefined ? (Math.floor(inside.volume * 100) / 100).toFixed(2) + '\xa0cm³' : null}</div>
                    <div className="nodule-accordion-item-content-info-hu">{inside.huMin !== undefined && inside.huMax !== undefined ? inside.huMin + '~' + inside.huMax + 'HU' : null}</div>
                  </div>
                  {/* <Grid.Column widescreen={3} computer={3} textAlign='center'>
                                        <select id={texId} style={selectStyle} defaultValue="" disabled>
                                        <option value="" disabled="disabled">选择亚型</option>
                                        </select>
                                    </Grid.Column> */}

                  <div className="nodule-accordion-item-content-char">
                    <div className="nodule-accordion-item-content-char-title">表征:</div>
                    <div className="nodule-accordion-item-content-char-content">
                      <Select
                        className={'nodule-accordion-item-content-select'}
                        mode="multiple"
                        dropdownMatchSelectWidth={false}
                        defaultValue={inside.malignancy}
                        value={representArray}
                        bordered={false}
                        showArrow={false}
                        dropdownClassName={'corner-select-dropdown'}
                        onChange={this.representChange.bind(this, idx, 'previews')}>
                        <Option className={'nodule-accordion-item-content-select-option'} value={'分叶'}>
                          分叶
                        </Option>
                        <Option className={'nodule-accordion-item-content-select-option'} value={'毛刺'}>
                          毛刺
                        </Option>
                        <Option className={'nodule-accordion-item-content-select-option'} value={'钙化'}>
                          钙化
                        </Option>
                        <Option className={'nodule-accordion-item-content-select-option'} value={'胸膜凹陷'}>
                          胸膜凹陷
                        </Option>
                        <Option className={'nodule-accordion-item-content-select-option'} value={'血管集束'}>
                          血管集束
                        </Option>
                        <Option className={'nodule-accordion-item-content-select-option'} value={'空泡'}>
                          空泡
                        </Option>
                        <Option className={'nodule-accordion-item-content-select-option'} value={'空洞'}>
                          空洞
                        </Option>
                        <Option className={'nodule-accordion-item-content-select-option'} value={'支气管充气'}>
                          支气管充气
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
        const previewsNodule = value['earlier']
        const newNodule = value['later']
        var followupLoc = ''
        var newLoc = newNodule.segment
        var previewsLoc = previewsNodule.segment
        var newRepresentArray = []
        var preRepresentArray = []
        let newNoduleLength = 0
        let newNoduleWidth = 0
        let preNoduleLength = 0
        let preNoduleWidth = 0
        let newLocationValues
        let preLocationValues

        if (newNodule.segment && newNodule.segment !== 'None') {
          newLocationValues = lungLoc[newNodule.segment].split('-')
        } else {
          if (newNodule.place) {
            newLocationValues = [nodulePlaces[newNodule.place]]
          } else {
            newLocationValues = ['无法定位']
          }
        }
        if (previewsNodule.segment && previewsNodule.segment !== 'None') {
          preLocationValues = lungLoc[previewsNodule.segment].split('-')
        } else {
          if (previewsNodule.place) {
            preLocationValues = [nodulePlaces[previewsNodule.place]]
          } else {
            preLocationValues = ['无法定位']
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

        if (previewsNodule.measure !== undefined && previewsNodule.measure !== null) {
          preNoduleLength = Math.sqrt(Math.pow(previewsNodule.measure.x1 - previewsNodule.measure.x2, 2) + Math.pow(previewsNodule.measure.y1 - previewsNodule.measure.y2, 2))
          preNoduleWidth = Math.sqrt(Math.pow(previewsNodule.measure.x3 - previewsNodule.measure.x4, 2) + Math.pow(previewsNodule.measure.y3 - previewsNodule.measure.y4, 2))
          if (isNaN(preNoduleLength)) {
            preNoduleLength = 0
          }
          if (isNaN(preNoduleWidth)) {
            preNoduleWidth = 0
          }
        }

        if (newNodule['volume'] > previewsNodule['volume']) {
          doublingType = '增加'
        } else {
          doublingType = '减少'
        }

        if (newNodule['volume'] !== 0 && previewsNodule['volume'] !== 0) {
          const curDate = this.state.curCaseId.split('_')[1]
          const preDate = this.state.preCaseId.split('_')[1]
          var curTime = new Date()
          var preTime = new Date()
          curTime.setFullYear(curDate.substring(0, 4), curDate.substring(4, 6), curDate.substring(6, 8))
          preTime.setFullYear(preDate.substring(0, 4), preDate.substring(4, 6), preDate.substring(6, 8))

          var interval = Math.floor((curTime - preTime) / (24 * 3600 * 1000))
          var cur_nodule_volume = newNodule['volume']
          var pre_nodule_volume = previewsNodule['volume']
          VDT = (interval * (Math.LN2 / Math.log(cur_nodule_volume / pre_nodule_volume))).toFixed(0)

          MDT = ((interval * Math.LN2) / Math.log((cur_nodule_volume * (1000 + newNodule['huMean'])) / (pre_nodule_volume * (1000 + previewsNodule['huMean'])))).toFixed(0)
        }

        if (newLoc === previewsLoc) {
          followupLoc = newLoc
        } else {
          followupLoc = 'None'
        }

        if (newNodule.lobulation === 2) {
          newRepresentArray.push('分叶')
        }
        if (newNodule.spiculation === 2) {
          newRepresentArray.push('毛刺')
        }
        if (newNodule.calcification === 2) {
          newRepresentArray.push('钙化')
        }
        if (newNodule.pin === 2) {
          newRepresentArray.push('胸膜凹陷')
        }
        if (newNodule.cav === 2) {
          newRepresentArray.push('空洞')
        }
        if (newNodule.vss === 2) {
          newRepresentArray.push('血管集束')
        }
        if (newNodule.bea === 2) {
          newRepresentArray.push('空泡')
        }
        if (newNodule.bro === 2) {
          newRepresentArray.push('支气管充气')
        }

        if (previewsNodule.lobulation === 2) {
          preRepresentArray.push('分叶')
        }
        if (previewsNodule.spiculation === 2) {
          preRepresentArray.push('毛刺')
        }
        if (previewsNodule.calcification === 2) {
          preRepresentArray.push('钙化')
        }
        if (previewsNodule.pin === 2) {
          preRepresentArray.push('胸膜凹陷')
        }
        if (previewsNodule.cav === 2) {
          preRepresentArray.push('空洞')
        }
        if (previewsNodule.vss === 2) {
          preRepresentArray.push('血管集束')
        }
        if (previewsNodule.bea === 2) {
          preRepresentArray.push('空泡')
        }
        if (previewsNodule.bro === 2) {
          preRepresentArray.push('支气管充气')
        }

        return (
          <Row key={idx} justify="center" className="register-nodule-card" onClick={this.onMatchNoduleChange.bind(this, newNodule, previewsNodule)}>
            <Col span={2} className="register-nodule-card-note">
              <Row className="register-nodule-card-first">{'N' + newNodule.nodule_no}</Row>
              <Row className="register-nodule-card-second">{'P' + previewsNodule.nodule_no}</Row>
            </Col>

            <Col span={22} className="register-nodule-card-content">
              <Row className="register-nodule-card-first">
                <Col span={14} className="register-nodule-card-content-first">
                  定位：
                  <Cascader
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
                  />
                  {/* <Cascader options={this.config.segment} onChange={this.onLungLocationChange.bind(this, idx, 'register-match')}>
                    <a href="#">{lungLoc[followupLoc]}</a>
                  </Cascader> */}
                </Col>
                <Col span={4} className="register-nodule-card-content-first">
                  倍增时间: <p className="doublingTypeText">{doublingType}</p>
                </Col>
                <Col span={3} className="register-nodule-card-content-first">
                  <p className="VDTText">{'VDT : ' + VDT}</p>
                </Col>
                <Col span={3} className="register-nodule-card-content-first">
                  <p className="MDTText">{'MDT : ' + MDT}</p>
                </Col>
              </Row>
              <Row className="register-nodule-card-second">
                <Col span={2}>{'IM' + (newNodule.slice_idx + 1)}</Col>
                <Col span={8} className="register-nodule-card-second-center">
                  <div className="register-nodule-card-text register-nodule-card-text-length">{newNoduleLength.toFixed(1) + '*' + newNoduleWidth.toFixed(1) + 'mm'}</div>
                  <div className="register-nodule-card-text register-nodule-card-text-volume">{newNodule.volume !== undefined ? Math.floor(newNodule.volume * 1000).toFixed(1) + '\xa0mm³' : null}</div>
                  <div className="register-nodule-card-text register-nodule-card-text-hu">{newNodule.huMin + '~' + newNodule.huMax + 'HU'}</div>
                </Col>
                <Col span={4}>
                  密度：
                  <Select
                    className="nodule-accordion-item-title-select"
                    dropdownMatchSelectWidth={true}
                    defaultValue={newNodule.texture}
                    value={newNodule.texture}
                    bordered={false}
                    showArrow={false}
                    dropdownClassName={'corner-select-dropdown'}
                    onChange={this.onSelectTex.bind(this, idx, 'match-cur')}
                    onClick={this.onSelectTexClick.bind(this)}>
                    <Option className="nodule-accordion-item-title-select-option" value={-1}>
                      未知
                    </Option>
                    <Option className="nodule-accordion-item-title-select-option" value={1}>
                      磨玻璃
                    </Option>
                    <Option className="nodule-accordion-item-title-select-option" value={2}>
                      实性
                    </Option>
                    <Option className="nodule-accordion-item-title-select-option" value={3}>
                      半实性
                    </Option>
                  </Select>
                  {/* <Cascader options={this.config.densityConfig} onChange={this.onDensityChange.bind(this, idx, 'register-match-new')}>
                    <a href="#">{densityList[newNodule.texture]}</a>
                  </Cascader> */}
                </Col>
                <Col span={10}>
                  表征
                  <Select
                    className={'nodule-accordion-item-content-select'}
                    mode="multiple"
                    dropdownMatchSelectWidth={false}
                    defaultValue={newNodule.malignancy}
                    value={newRepresentArray}
                    bordered={false}
                    showArrow={false}
                    dropdownClassName={'corner-select-dropdown'}
                    onChange={this.representChange.bind(this, idx, 'match-cur')}>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'分叶'}>
                      分叶
                    </Option>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'毛刺'}>
                      毛刺
                    </Option>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'钙化'}>
                      钙化
                    </Option>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'胸膜凹陷'}>
                      胸膜凹陷
                    </Option>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'血管集束'}>
                      血管集束
                    </Option>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'空泡'}>
                      空泡
                    </Option>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'空洞'}>
                      空洞
                    </Option>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'支气管充气'}>
                      支气管充气
                    </Option>
                  </Select>
                </Col>
              </Row>
              <Row className="register-nodule-card-second">
                <Col span={2}>{'IM' + (previewsNodule.slice_idx + 1)}</Col>
                <Col span={8} className="register-nodule-card-second-center">
                  <div className="register-nodule-card-text register-nodule-card-text-length">{preNoduleLength.toFixed(1) + '*' + preNoduleWidth.toFixed(1) + 'mm'}</div>
                  <div className="register-nodule-card-text register-nodule-card-text-volume">
                    {previewsNodule.volume !== undefined ? Math.floor(previewsNodule.volume * 1000).toFixed(1) + '\xa0mm³' : null}
                  </div>
                  <div className="register-nodule-card-text register-nodule-card-text-hu">{previewsNodule.huMin + '~' + previewsNodule.huMax + 'HU'}</div>
                </Col>
                <Col span={4}>
                  密度：
                  <Select
                    className="nodule-accordion-item-title-select"
                    dropdownMatchSelectWidth={true}
                    defaultValue={previewsNodule.texture}
                    value={previewsNodule.texture}
                    bordered={false}
                    showArrow={false}
                    dropdownClassName={'corner-select-dropdown'}
                    onChange={this.onSelectTex.bind(this, idx, 'match-pre')}
                    onClick={this.onSelectTexClick.bind(this)}>
                    <Option className="nodule-accordion-item-title-select-option" value={-1}>
                      未知
                    </Option>
                    <Option className="nodule-accordion-item-title-select-option" value={1}>
                      磨玻璃
                    </Option>
                    <Option className="nodule-accordion-item-title-select-option" value={2}>
                      实性
                    </Option>
                    <Option className="nodule-accordion-item-title-select-option" value={3}>
                      半实性
                    </Option>
                  </Select>
                  {/* <Cascader options={this.config.densityConfig} onChange={this.onDensityChange.bind(this, idx, 'register-match-previews')}>
                    <a href="#">{densityList[previewsNodule.texture]}</a>
                  </Cascader> */}
                </Col>
                <Col span={10}>
                  表征
                  <Select
                    className={'nodule-accordion-item-content-select'}
                    mode="multiple"
                    dropdownMatchSelectWidth={false}
                    defaultValue={previewsNodule.malignancy}
                    value={preRepresentArray}
                    bordered={false}
                    showArrow={false}
                    dropdownClassName={'corner-select-dropdown'}
                    onChange={this.representChange.bind(this, idx, 'match-pre')}>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'分叶'}>
                      分叶
                    </Option>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'毛刺'}>
                      毛刺
                    </Option>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'钙化'}>
                      钙化
                    </Option>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'胸膜凹陷'}>
                      胸膜凹陷
                    </Option>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'血管集束'}>
                      血管集束
                    </Option>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'空泡'}>
                      空泡
                    </Option>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'空洞'}>
                      空洞
                    </Option>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'支气管充气'}>
                      支气管充气
                    </Option>
                  </Select>
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
          locationValues = lungLoc[value.segment].split('-')
        } else {
          if (value.place) {
            locationValues = [nodulePlaces[value.place]]
          } else {
            locationValues = ['无法定位']
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
          representArray.push('分叶')
        }
        if (value.spiculation === 2) {
          representArray.push('毛刺')
        }
        if (value.calcification === 2) {
          representArray.push('钙化')
        }
        if (value.pin === 2) {
          representArray.push('胸膜凹陷')
        }
        if (value.cav === 2) {
          representArray.push('空洞')
        }
        if (value.vss === 2) {
          representArray.push('血管集束')
        }
        if (value.bea === 2) {
          representArray.push('空泡')
        }
        if (value.bro === 2) {
          representArray.push('支气管充气')
        }
        return (
          <Row key={idx} justify="center" className="register-nodule-card" onClick={this.onNewNoduleChange.bind(this, value)}>
            <Col span={2} className="register-nodule-card-note">
              <Row className="register-nodule-card-first">{'N' + value.nodule_no}</Row>
            </Col>

            <Col span={22} className="register-nodule-card-content">
              <Row className="register-nodule-card-first">
                <Col span={24}>
                  定位：
                  <Cascader
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
                  />
                </Col>
              </Row>
              <Row className="register-nodule-card-second">
                <Col span={2}>{'IM ' + value['slice_idx']}</Col>
                <Col span={8} className="register-nodule-card-second-center">
                  <div className="register-nodule-card-text register-nodule-card-text-length">{ll.toFixed(1) + '*' + sl.toFixed(1) + 'mm'}</div>
                  <div className="register-nodule-card-text register-nodule-card-text-volume">{value.volume !== undefined ? Math.floor(value.volume * 1000).toFixed(1) + '\xa0mm³' : null}</div>
                  <div className="register-nodule-card-text register-nodule-card-text-hu">{value.huMin + '~' + value.huMax + 'HU'}</div>
                </Col>
                <Col span={4}>
                  密度：
                  <Select
                    className="nodule-accordion-item-title-select"
                    dropdownMatchSelectWidth={true}
                    defaultValue={value.texture}
                    value={value.texture}
                    bordered={false}
                    showArrow={false}
                    dropdownClassName={'corner-select-dropdown'}
                    onChange={this.onSelectTex.bind(this, idx, 'new')}
                    onClick={this.onSelectTexClick.bind(this)}>
                    <Option className="nodule-accordion-item-title-select-option" value={-1}>
                      未知
                    </Option>
                    <Option className="nodule-accordion-item-title-select-option" value={1}>
                      磨玻璃
                    </Option>
                    <Option className="nodule-accordion-item-title-select-option" value={2}>
                      实性
                    </Option>
                    <Option className="nodule-accordion-item-title-select-option" value={3}>
                      半实性
                    </Option>
                  </Select>
                </Col>
                <Col span={10}>
                  表征：
                  <Select
                    className={'nodule-accordion-item-content-select'}
                    mode="multiple"
                    dropdownMatchSelectWidth={false}
                    defaultValue={value.malignancy}
                    value={representArray}
                    bordered={false}
                    showArrow={false}
                    dropdownClassName={'corner-select-dropdown'}
                    onChange={this.representChange.bind(this, idx, 'new')}>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'分叶'}>
                      分叶
                    </Option>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'毛刺'}>
                      毛刺
                    </Option>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'钙化'}>
                      钙化
                    </Option>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'胸膜凹陷'}>
                      胸膜凹陷
                    </Option>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'血管集束'}>
                      血管集束
                    </Option>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'空泡'}>
                      空泡
                    </Option>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'空洞'}>
                      空洞
                    </Option>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'支气管充气'}>
                      支气管充气
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
          locationValues = lungLoc[value.segment].split('-')
        } else {
          if (value.place) {
            locationValues = [nodulePlaces[value.place]]
          } else {
            locationValues = ['无法定位']
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
          representArray.push('分叶')
        }
        if (value.spiculation === 2) {
          representArray.push('毛刺')
        }
        if (value.calcification === 2) {
          representArray.push('钙化')
        }
        if (value.pin === 2) {
          representArray.push('胸膜凹陷')
        }
        if (value.cav === 2) {
          representArray.push('空洞')
        }
        if (value.vss === 2) {
          representArray.push('血管集束')
        }
        if (value.bea === 2) {
          representArray.push('空泡')
        }
        if (value.bro === 2) {
          representArray.push('支气管充气')
        }
        return (
          <Row key={idx} onClick={this.onPreNoduleChange.bind(this, value)} justify="center" className="register-nodule-card">
            <Col span={2} className="register-nodule-card-note">
              {/* <Row></Row> */}
              <Row className="register-nodule-card-first">{'P' + value.nodule_no}</Row>
            </Col>

            <Col span={22} className="register-nodule-card-content">
              <Row className="register-nodule-card-first">
                <Col span={24}>
                  定位：
                  <Cascader
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
                  />
                </Col>
              </Row>

              <Row className="register-nodule-card-second">
                <Col span={2}>{'IM ' + value['slice_idx']}</Col>
                <Col span={8} className="register-nodule-card-second-center">
                  <div className="register-nodule-card-text register-nodule-card-text-length">{ll.toFixed(1) + '*' + sl.toFixed(1) + 'mm'}</div>
                  <div className="register-nodule-card-text register-nodule-card-text-volume">{value.volume !== undefined ? Math.floor(value.volume * 1000).toFixed(1) + '\xa0mm³' : null}</div>
                  <div className="register-nodule-card-text register-nodule-card-text-hu">{value.huMin + '~' + value.huMax + 'HU'}</div>
                </Col>
                <Col span={4}>
                  密度：
                  <Select
                    className="nodule-accordion-item-title-select"
                    dropdownMatchSelectWidth={true}
                    defaultValue={value.texture}
                    value={value.texture}
                    bordered={false}
                    showArrow={false}
                    dropdownClassName={'corner-select-dropdown'}
                    onChange={this.onSelectTex.bind(this, idx, 'vanish')}
                    onClick={this.onSelectTexClick.bind(this)}>
                    <Option className="nodule-accordion-item-title-select-option" value={-1}>
                      未知
                    </Option>
                    <Option className="nodule-accordion-item-title-select-option" value={1}>
                      磨玻璃
                    </Option>
                    <Option className="nodule-accordion-item-title-select-option" value={2}>
                      实性
                    </Option>
                    <Option className="nodule-accordion-item-title-select-option" value={3}>
                      半实性
                    </Option>
                  </Select>
                </Col>
                <Col span={10}>
                  表征：
                  <Select
                    className={'nodule-accordion-item-content-select'}
                    mode="multiple"
                    dropdownMatchSelectWidth={false}
                    defaultValue={value.malignancy}
                    value={representArray}
                    bordered={false}
                    showArrow={false}
                    dropdownClassName={'corner-select-dropdown'}
                    onChange={this.representChange.bind(this, idx, 'vanish')}>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'分叶'}>
                      分叶
                    </Option>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'毛刺'}>
                      毛刺
                    </Option>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'钙化'}>
                      钙化
                    </Option>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'胸膜凹陷'}>
                      胸膜凹陷
                    </Option>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'血管集束'}>
                      血管集束
                    </Option>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'空泡'}>
                      空泡
                    </Option>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'空洞'}>
                      空洞
                    </Option>
                    <Option className={'nodule-accordion-item-content-select-option'} value={'支气管充气'}>
                      支气管充气
                    </Option>
                  </Select>
                </Col>
              </Row>
            </Col>
          </Row>
        )
      })
    }

    return (
      <div id="follow-up">
        <Row id="follow-up-viewport">
          {/* current case */}
          <div className="follow-up-viewport-exchange" onClick={this.onChangeViewportSort.bind(this)}>
            <FontAwesomeIcon icon={faArrowsAltH} />
          </div>
          {sortChanged ? (
            <>
              <FollowUpViewport
                viewportIndex={this.state.preViewportIndex}
                tools={this.state.tools}
                imageIds={this.state.preImageIds}
                style={{ minWidth: '50%', flex: '1' }}
                imageIdIndex={this.state.preImageIdIndex}
                isPlaying={this.state.isPlaying}
                frameRate={this.state.frameRate}
                activeTool={this.state.activeTool}
                isOverlayVisible={this.state.isOverlayVisible}
                setCornerstoneElement={(input) => {
                  this.setState({
                    preCornerstoneElement: input,
                  })
                }}
                setViewportIndex={(input) => {
                  this.setState({
                    activeViewportIndex: this.state.preViewportIndex,
                  })
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
                isPlaying={this.state.isPlaying}
                frameRate={this.state.frameRate}
                activeTool={this.state.activeTool}
                isOverlayVisible={this.state.isOverlayVisible}
                setCornerstoneElement={(input) => {
                  this.setState({
                    newCornerstoneElement: input,
                  })
                }}
                setViewportIndex={(input) => {
                  this.setState({
                    activeViewportIndex: this.state.curViewportIndex,
                  })
                }}
                voi={curVoi}
                className={this.state.activeViewportIndex === this.state.curViewportIndex ? 'active' : ''}
              />
            </>
          ) : (
            <>
              <FollowUpViewport
                viewportIndex={this.state.curViewportIndex}
                tools={this.state.tools}
                imageIds={this.state.curImageIds}
                style={{ minWidth: '50%', flex: '1' }}
                imageIdIndex={this.state.curImageIdIndex}
                isPlaying={this.state.isPlaying}
                frameRate={this.state.frameRate}
                activeTool={this.state.activeTool}
                isOverlayVisible={this.state.isOverlayVisible}
                setCornerstoneElement={(input) => {
                  this.setState({
                    newCornerstoneElement: input,
                  })
                }}
                setViewportIndex={(input) => {
                  this.setState({
                    activeViewportIndex: this.state.curViewportIndex,
                  })
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
                isPlaying={this.state.isPlaying}
                frameRate={this.state.frameRate}
                activeTool={this.state.activeTool}
                isOverlayVisible={this.state.isOverlayVisible}
                setCornerstoneElement={(input) => {
                  this.setState({
                    preCornerstoneElement: input,
                  })
                }}
                setViewportIndex={(input) => {
                  this.setState({
                    activeViewportIndex: this.state.preViewportIndex,
                  })
                }}
                voi={preVoi}
                className={this.state.activeViewportIndex === this.state.preViewportIndex ? 'active' : ''}
              />
            </>
          )}
        </Row>
        {this.state.isRegistering === false ? (
          <Row justify="space-between" className="BoxesAccord-Row">
            <Col span={12} style={{ height: '100%' }} className="boxes-accord-col">
              <Accordion className="current-nodule-accordion">{sortChanged ? preBoxesAccord : curBoxesAccord}</Accordion>
            </Col>
            <Col span={12} style={{ height: '100%' }} className="boxes-accord-col">
              <Accordion className="current-nodule-accordion">{sortChanged ? curBoxesAccord : preBoxesAccord}</Accordion>
            </Col>
          </Row>
        ) : (
          <Row justify="space-between" className="BoxesAccord-Row">
            <Col span={12} id="structured-report" className="boxes-accord-col">
              <Row gutter={4} id="structured-report-title" align="middle">
                <Col span={22}>
                  <div className="reportTitle">结构化报告</div>
                </Col>
                <Col span={2}>
                  <AntdButton type="primary" shape="round" size="small">
                    保存
                  </AntdButton>
                </Col>
              </Row>
              <Row align="middle" justify="end" id="structured-report-operation">
                <Checkbox.Group
                  // style={{ width: "100%" }}
                  className="match-checkbox"
                  defaultValue={['match', 'new', 'vanish']}
                  onChange={this.noduleTblCheckboxChange}>
                  <Checkbox checked={noduleTblCheckedValue.includes('match') ? true : false} value="match">
                    {'匹配(' + matchNoduleLen + ')'}
                  </Checkbox>
                  <Checkbox checked={noduleTblCheckedValue.includes('new') ? true : false} value="new">
                    {'新增(' + newNoduleLen + ')'}
                  </Checkbox>
                  <Checkbox checked={noduleTblCheckedValue.includes('vanish') ? true : false} value="vanish">
                    {'消失(' + vanishNoduleLen + ')'}
                  </Checkbox>
                </Checkbox.Group>
              </Row>
              <Row className="all-nodule-table" style={{ height: `${tableHeight}px` }}>
                {noduleTblCheckedValue.includes('match') ? matchNodulesTbl : null}
                {noduleTblCheckedValue.includes('new') ? newNodulesTbl : null}
                {noduleTblCheckedValue.includes('vanish') ? vanishNodulesTbl : null}
              </Row>
            </Col>

            <Col span={12} className="boxes-accord-col" id="report">
              <Accordion id="report-accordion-guide">
                <Accordion.Title active={reportGuideActive} onClick={this.onSetReportGuideActive.bind(this)}>
                  <div className="report-title">
                    <div className="report-title-desc">
                      <Dropdown
                        options={[
                          {
                            key: '中华共识',
                            text: '中华共识',
                            value: '中华共识',
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
                            key: '亚洲共识',
                            text: '亚洲共识',
                            value: '亚洲共识',
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
                    placeholder="在此查看指南"
                    onChange={this.onHandleGuideTextareaChange.bind(this)}
                    value={reportGuideText}
                    maxLength={500}></Form.TextArea>
                </Accordion.Content>
              </Accordion>

              <Accordion id="report-accordion-image" style={{ top: `${reportImageTop}px`, height: `${reportImageHeight}px` }}>
                <Accordion.Title id="report-accordion-image-header" active={reportImageActive} onClick={this.onSetReportImageActive.bind(this)}>
                  <div className="report-title">
                    <div className="report-title-desc">
                      诊断报告
                      <Dropdown
                        className="report-title-desc-type"
                        options={[
                          {
                            key: '结节类型',
                            text: '结节类型',
                            value: '结节类型',
                          },
                          {
                            key: '单个结节',
                            text: '单个结节',
                            value: '单个结节',
                          },
                        ]}
                        defaultValue={reportImageType}
                        icon={<FontAwesomeIcon icon={faChevronDown} />}
                        onChange={this.onHandleReportImageTypeChange.bind(this)}
                      />
                    </div>
                    <div className="report-title-operation">
                      <Button title="复制" className="inverted blue button" icon="copy outline" onClick={this.handleCopyClick}></Button>
                    </div>
                  </div>
                </Accordion.Title>
                <Accordion.Content active={reportImageActive} style={{ height: `${reportImageContentHeight}px` }}>
                  <Form.TextArea
                    id="report-image-textarea"
                    className="report-textarea"
                    placeholder="在此填写诊断报告"
                    onChange={this.onHandleImageTextareaChange.bind(this)}
                    value={reportImageText}
                    maxLength={500}></Form.TextArea>
                </Accordion.Content>
              </Accordion>
            </Col>
          </Row>
        )}
      </div>
    )
  }
  setDelNodule(idx, open) {
    const boxes = this.state.boxes
    boxes[idx].delOpen = open
    this.setState({
      boxes,
    })
  }
  onConfirmDelNodule(idx) {
    // let selectBoxes = this.state.selectBoxes
    // let measureStateList = this.state.measureStateList
    // for (var i = 0; i < selectBoxes.length; i++) {
    //     if (selectBoxes[i].nodule_no === nodule_no) {
    //         // selectBoxes.splice(i, 1)
    //         selectBoxes[i]="delete"
    //     }
    // }
    const boxes = this.state.boxes
    const measureStateList = this.state.measureStateList
    // for (var i = 0; i < boxes.length; i++) {
    //     if (boxes[i].nodule_no === nodule_no) {
    //         boxes.splice(i, 1)
    //         boxes[i]="delete"
    //     }
    // }
    console.log('delNodule', measureStateList, boxes, idx)
    boxes.splice(idx, 1)
    measureStateList.splice(idx, 1)
    console.log('delNodule after', measureStateList, boxes)
    this.setState({
      boxes,
      measureStateList,
      // random: Math.random()
    })
    this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
    message.success('结节删除成功')
  }
  onSelectMal(index, type, value) {
    if (type === 'current') {
      const curBoxes = this.state.curBoxes
      curBoxes[index].malignancy = parseInt(value)
      this.setState({
        curBoxes: curBoxes,
      })
    } else if (type === 'previews') {
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
    } else if (type === 'previews') {
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
      if (value[0] === '无法定位') {
        curBoxes[index].place = 0
        curBoxes[index].segment = 'None'
      } else {
        for (let item in places) {
          if (places[item] === place) {
            curBoxes[index].place = item
          }
        }
        if (value[1] === '无法定位') {
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
    } else if (type === 'previews') {
      const preBoxes = this.state.preBoxes
      if (value[0] === '无法定位') {
        preBoxes[index].place = 0
        preBoxes[index].segment = 'None'
      } else {
        for (let item in places) {
          if (places[item] === place) {
            preBoxes[index].place = item
          }
        }
        if (value[1] === '无法定位') {
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
      if (value[0] === '无法定位') {
        box['match'][index]['later'].place = 0
        box['match'][index]['later'].segment = 'None'
      } else {
        for (let item in places) {
          if (places[item] === place) {
            box['match'][index]['later'].place = item
          }
        }
        if (value[1] === '无法定位') {
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
      if (value[0] === '无法定位') {
        box['match'][index]['earlier'].place = 0
        box['match'][index]['earlier'].segment = 'None'
      } else {
        for (let item in places) {
          if (places[item] === place) {
            box['match'][index]['earlier'].place = item
          }
        }
        if (value[1] === '无法定位') {
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
      if (value[0] === '无法定位') {
        box['new'][index].place = 0
        box['new'][index].segment = 'None'
      } else {
        for (let item in places) {
          if (places[item] === place) {
            box['new'][index].place = item
          }
        }
        if (value[1] === '无法定位') {
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
      if (value[0] === '无法定位') {
        box['vanish'][index].place = 0
        box['vanish'][index].segment = 'None'
      } else {
        for (let item in places) {
          if (places[item] === place) {
            box['vanish'][index].place = item
          }
        }
        if (value[1] === '无法定位') {
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
  representChange(idx, type, value) {
    // console.log("representChange", idx, value)
    let represents = {
      lobulation: '分叶',
      spiculation: '毛刺',
      calcification: '钙化',
      pin: '胸膜凹陷',
      cav: '空洞',
      vss: '血管集束',
      bea: '空泡',
      bro: '支气管充气',
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
    } else if (type === 'previews') {
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
    const reportImageText = this.state.reportImageText
    if (reportImageText && reportImageText.length > 0) {
      copy(this.state.reportImageText)
      message.success('复制成功')
    } else {
      message.warn('复制内容为空')
    }
  }
  template() {
    const boxes = this.state.boxes
    const reportImageType = this.state.reportImageType
    const reportGuideType = this.state.reportGuideType
    let reportImageText = ''
    boxes.forEach((item, index) => {
      if (item.checked) {
        reportImageText += this.templateReportImage(reportImageType, index) + '\n'
      }
    })
    this.setState({
      reportImageText,
    })
    this.templateReportGuide(reportGuideType)
  }
  templateReportImage(type, boxIndex) {
    const places = nodulePlaces
    const segments = lungLoc
    const boxes = this.state.registerBoxes['new']
    let texts = ''

    if (type === '结节类型') {
      let place = ''
      let diameter = ''
      let texture = ''
      let representArray = []
      let represent = ''
      let malignancy = ''
      if (boxes[boxIndex]['place'] === 0 || boxes[boxIndex]['place'] === undefined || boxes[boxIndex]['place'] === '') {
        if (boxes[boxIndex]['segment'] === undefined || boxes[boxIndex]['segment'] === '' || boxes[boxIndex]['segment'] === 'None') {
          place = '未知位置'
        } else {
          place = segments[boxes[boxIndex]['segment']]
        }
      } else {
        if (boxes[boxIndex]['segment'] === undefined || boxes[boxIndex]['segment'] === '' || boxes[boxIndex]['segment'] === 'None') {
          place = places[boxes[boxIndex]['place']]
        } else {
          place = segments[boxes[boxIndex]['segment']]
        }
      }
      let ll = 0
      let sl = 0
      if (boxes[boxIndex]['measure'] !== undefined) {
        ll = Math.sqrt(Math.pow(boxes[boxIndex].measure.x1 - boxes[boxIndex].measure.x2, 2) + Math.pow(boxes[boxIndex].measure.y1 - boxes[boxIndex].measure.y2, 2))
        sl = Math.sqrt(Math.pow(boxes[boxIndex].measure.x3 - boxes[boxIndex].measure.x4, 2) + Math.pow(boxes[boxIndex].measure.y3 - boxes[boxIndex].measure.y4, 2))
        if (isNaN(ll)) {
          ll = 0
        }
        if (isNaN(sl)) {
          sl = 0
        }
        if (ll === 0 && sl === 0) {
          if (boxes[boxIndex]['diameter'] !== undefined && boxes[boxIndex]['diameter'] !== 0) {
            diameter = '\xa0\xa0' + (boxes[boxIndex]['diameter'] / 10).toFixed(2) + ' 厘米'
          } else {
            diameter = '未知'
          }
        } else {
          diameter = '\xa0\xa0' + (ll / 10).toFixed(2) + '\xa0' + '×' + '\xa0' + (sl / 10).toFixed(2) + ' 厘米'
        }
      }

      if (boxes[boxIndex]['texture'] === 2) {
        texture = '实性'
      } else if (boxes[boxIndex]['texture'] === 3) {
        texture = '混合磨玻璃'
      } else {
        texture = '磨玻璃'
      }
      if (boxes[boxIndex]['lobulation'] === 2) {
        representArray.push('分叶')
      }
      if (boxes[boxIndex]['spiculation'] === 2) {
        representArray.push('毛刺')
      }
      if (boxes[boxIndex]['calcification'] === 2) {
        representArray.push('钙化')
      }
      if (boxes[boxIndex]['pin'] === 2) {
        representArray.push('胸膜凹陷')
      }
      if (boxes[boxIndex]['cav'] === 2) {
        representArray.push('空洞')
      }
      if (boxes[boxIndex]['vss'] === 2) {
        representArray.push('血管集束')
      }
      if (boxes[boxIndex]['bea'] === 2) {
        representArray.push('空泡')
      }
      if (boxes[boxIndex]['bro'] === 2) {
        representArray.push('支气管充气')
      }
      for (let index = 0; index < representArray.length; index++) {
        if (index === 0) {
          represent = representArray[index]
        } else {
          represent = represent + '、' + representArray[index]
        }
      }
      if (boxes[boxIndex]['malignancy'] === 3) {
        malignancy = '风险较高。'
      } else if (boxes[boxIndex]['malignancy'] === 2) {
        malignancy = '风险中等。'
      } else {
        malignancy = '风险较低。'
      }
      texts =
        texts +
        place +
        ' ( Im ' +
        (parseInt(boxes[boxIndex]['slice_idx']) + 1) +
        '/' +
        this.state.imageIds.length +
        ') 见' +
        texture +
        '结节, 大小为' +
        diameter +
        ', 可见' +
        represent +
        ', ' +
        malignancy
    }
    return texts
  }
  templateReportGuide(dealchoose) {
    const boxes = this.state.registerBoxes['new']
    if (dealchoose === '中华共识') {
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
            reportGuideText: '根据PET评估结节结果判断手术切除或非手术活检',
          })
          break
        case 15:
          this.setState({
            reportGuideText: '3~6、9~12及24个月，如稳定，年度随访',
          })
          break
        case 10:
          this.setState({
            reportGuideText: '6~12、18~24个月，如稳定，年度随访',
          })
          break
        case 5:
          this.setState({ reportGuideText: '12个月，如稳定，年度随访' })
          break
        case 0:
          this.setState({ reportGuideText: '选择性随访' })
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
          this.setState({ reportGuideText: '3个月考虑CT、PET/CT，或组织样本' })
          break
        case 20:
          this.setState({
            reportGuideText: '3-6月行CT确定稳定性。若未改变，并且实性成分<6mm，应每年行CT至5年',
          })
          break
        case 15:
          this.setState({
            reportGuideText: '6-12个月行CT，之后18-24个月考虑CT',
          })
          break
        case 10:
          this.setState({
            reportGuideText: '6-12月行CT确定稳定性，之后每2年行CT至5年',
          })
          break
        case 5:
          this.setState({ reportGuideText: '最好在12个月行CT' })
          break
        case 0:
          this.setState({ reportGuideText: '无常规随访' })
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
          this.setState({ reportGuideText: '胸部增强CT和/或PET/CT' })
          break
        case 10:
          this.setState({ reportGuideText: '3个月后复查LDCT或考虑PET/CT' })
          break
        case 5:
          this.setState({ reportGuideText: '6个月后复查LDCT' })
          break
        case 0:
          this.setState({
            reportGuideText: '每年复查LDCT，直至患者不再是肺癌潜在治疗对象',
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
            reportGuideText: '胸部CT增强或平扫；根据恶性的概率和并发症，选择性进行PET/CT和/或组织活检；存在≥8mm的实性成分时，需进行PET/CT检查',
          })
          break
        case 10:
          this.setState({
            reportGuideText: '3个月低剂量胸部CT筛查；存在≥8mm的实性成分时需PET/CT检查',
          })
          break
        case 5:
          this.setState({ reportGuideText: '6个月内低剂量胸部CT筛查' })
          break
        case 0:
          this.setState({ reportGuideText: '12个月内继续年度低剂量胸部CT筛查' })
          break
      }
    } else if (dealchoose === '亚洲共识') {
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
            reportGuideText: '应转介多学科团队到中心进行管理。该中心的诊断能力应包括CT/PET扫描、良性疾病检测和活检',
          })
          break
        case 20:
          this.setState({
            reportGuideText: '3个月后复查CT，如果检测时认为临床合适，考虑经验性抗菌治疗',
          })
          break
        case 10:
          this.setState({
            reportGuideText: '在大约6个月-12个月和18个月-24个月进行低剂量CT监测，并根据临床判断考虑每年进行低剂量CT监测',
          })
          break
        case 15:
          this.setState({
            reportGuideText: '在大约3个月、12个月和24个月进行低剂量CT监测，并根据临床判断考虑每年进行低剂量CT监测',
          })
          break
        case 5:
          this.setState({
            reportGuideText: '每年进行CT监测，持续3年;然后根据临床判断，考虑每年进行CT监测',
          })
          break
        case 0:
          this.setState({ reportGuideText: '根据临床判断，考虑每年进行CT监测' })
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
          // this.template()
        }
      )
    } else if (type === 'previews') {
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
    } else if (type === 'previews') {
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
}

export default connect(
  (state) => {
    return {
      isDragging: state.dataCenter.isDragging,
    }
  },
  (dispatch) => {
    return {
      setFollowUpActiveTool: (toolName) => dispatch(setFollowUpActiveTool(toolName)),
      dispatch,
    }
  }
)(FollowUpElement)
