import React, { Component } from 'react'
import StudyBrowserList from '../components/StudyBrowserList'
import ReactHtmlParser from 'react-html-parser'
import dicomParser from 'dicom-parser'
import reactDom, { render } from 'react-dom'
import * as cornerstone from 'cornerstone-core'
import * as cornerstoneMath from 'cornerstone-math'
import * as cornerstoneTools from 'cornerstone-tools'
import Hammer from 'hammerjs'
import * as cornerstoneWadoImageLoader from 'cornerstone-wado-image-loader'
import CornerstoneViewport from 'react-cornerstone-viewport'
import { withRouter } from 'react-router-dom'
import '../css/FollowUpElement.css'
import qs from 'qs'
import axios from 'axios'
import { Dropdown, Menu, Icon, Image, Button, Accordion } from 'semantic-ui-react'
import { Checkbox, Row, Col, Typography, Cascader, Button as AntdButton, Divider, Tag, Tabs, Radio, Input } from 'antd'
import src1 from '../images/scu-logo.jpg'

import * as echarts from 'echarts/lib/echarts'

const { Title, Text } = Typography
const { TextArea } = Input
const { TabPane } = Tabs
cornerstoneTools.external.cornerstone = cornerstone
cornerstoneTools.external.cornerstoneMath = cornerstoneMath
// cornerstoneWebImageLoader.external.cornerstone = cornerstone
cornerstoneWadoImageLoader.external.cornerstone = cornerstone
cornerstoneWadoImageLoader.external.dicomParser = dicomParser
cornerstoneTools.external.Hammer = Hammer
cornerstoneTools.init()
cornerstoneTools.toolColors.setActiveColor('rgb(0, 255, 0)')
cornerstoneTools.toolColors.setToolColor('rgb(255, 255, 0)')

const config = require('../config.json')
const segmentConfig = config.segment
const dangerLevelConfig = config.dangerLevel
const densityConfig = config.density
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
  None: '未定位',
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

class FollowUpElement extends Component {
  constructor(props) {
    super(props)
    this.state = {
      username: props.username,
      stack: props.stack,
      viewport: props.stack.viewport === '' ? cornerstone.getDefaultViewport(null, undefined) : props.stack.viewport,
      curImageIds: props.stack.curImageIds === '' ? [] : props.stack.curImageIds,
      curCaseId: props.stack.curCaseId,
      curBoxes: props.stack.curBoxes === '' ? [] : props.stack.curBoxes,
      curDicomTag: props.stack.curDicomTag === '' ? [] : props.stack.curDicomTag,
      currentIdx: 0,
      preImageIds: props.stack.preImageIds === '' ? [] : props.stack.preImageIds,
      preCaseId: props.stack.preCaseId,
      preBoxes: props.stack.preBoxes === '' ? [] : props.stack.preBoxes,
      preDicomTag: props.stack.preDicomTag === '' ? [] : props.stack.preDicomTag,
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
        { name: 'RectangleRoi', mode: 'active', mouseButtonMask: 1 },
        { name: 'Bidirectional', mode: 'active', mouseButtonMask: 1 },
        { name: 'Length', mode: 'active', mouseButtonMask: 1 },
        //erase
        { name: 'Eraser', mode: 'active', mouseButtonMask: 1 },
      ],
      activeTool: 'Wwwc',

      random: Math.random(),
    }
    this.config = JSON.parse(localStorage.getItem('config'))
    this.nextPath = this.nextPath.bind(this)
    this.startRegistering = this.startRegistering.bind(this)
    this.noduleTblCheckboxChange = this.noduleTblCheckboxChange.bind(this)
  }

  componentDidMount() {
    const curImageIds = this.state.curImageIds
    const preImageIds = this.state.preImageIds

    const curImagePromise = curImageIds.map((curImageId) => {
      return cornerstone.loadAndCacheImage(curImageId)
    })
    const preImagePromise = preImageIds.map((preImageId) => {
      return cornerstone.loadAndCacheImage(preImageId)
    })

    Promise.all([curImagePromise, preImagePromise]).then(() => {})

    const { curBoxes } = this.state
    var templateText = ''
    console.log('curBox', curBoxes)
    for (let i = 0; i < curBoxes.length; i++) {
      let location = ''
      let diameter = ''
      let texture = ''
      let representArray = []
      let represent = ''
      let malignancy = ''

      location = lungLoc[curBoxes[i]['segment']]

      if (curBoxes[i]['diameter'] !== undefined) {
        diameter = curBoxes[i]['diameter'].toFixed(1) + 'mm'
      } else {
        diameter = '未知'
      }
      if (curBoxes[i]['texture'] === 2) {
        texture = '实性'
      } else if (curBoxes[i]['texture'] === 3) {
        texture = '半实性'
      } else {
        texture = '磨玻璃'
      }

      if (curBoxes[i]['lobulation'] === 2) {
        representArray.push('分叶')
      }
      if (curBoxes[i]['spiculation'] === 2) {
        representArray.push('毛刺')
      }
      if (curBoxes[i]['calcification'] === 2) {
        representArray.push('钙化')
      }
      if (curBoxes[i]['pin'] === 2) {
        representArray.push('胸膜凹陷')
      }
      if (curBoxes[i]['cav'] === 2) {
        representArray.push('空洞')
      }
      if (curBoxes[i]['vss'] === 2) {
        representArray.push('血管集束')
      }
      if (curBoxes[i]['bea'] === 2) {
        representArray.push('空泡')
      }
      if (curBoxes[i]['bro'] === 2) {
        representArray.push('支气管充气')
      }
      for (let index = 0; index < representArray.length; index++) {
        if (index === 0) {
          represent = representArray[index]
        } else {
          represent = represent + '、' + representArray[index]
        }
      }
      if (curBoxes[i]['malignancy'] === 3) {
        malignancy = '风险较高。'
      } else if (curBoxes[i]['malignancy'] === 2) {
        malignancy = '风险中等。'
      } else {
        malignancy = '风险较低。'
      }
      if (represent === '') {
        templateText = templateText + location + ' ( Im ' + curBoxes[i]['slice_idx'] + ') 见' + texture + '结节, 大小为' + diameter + ', ' + malignancy + '\n'
      } else {
        templateText = templateText + location + ' ( Im ' + curBoxes[i]['slice_idx'] + ') 见' + texture + '结节, 大小为' + diameter + ', 可见' + represent + ', ' + malignancy + '\n'
      }
    }
    this.setState({ templateText: templateText })
  }

  componentWillMount() {
    document.getElementById('header').style.display = 'none'
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.activeViewportIndex !== this.state.activeViewportIndex) {
      console.log('activeidx', this.state.activeViewportIndex)
    }
  }

  nextPath(path) {
    this.props.history.push(path)
  }

  startRegistering() {
    const params = {
      earlierCaseId: this.state.preCaseId,
      laterCaseId: this.state.curCaseId,
    }
    axios.post(this.config.draft.getRectsForFollowUp, qs.stringify(params)).then((followupRectRes) => {
      console.log('followupRect', followupRectRes.data)
      const followupRect = followupRectRes.data
      this.setState({ registerBoxes: followupRect })
    })

    this.setState({ isRegistering: true })
  }

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

  handleListClick = (currentIdx, index, status) => {
    //点击list-item
    if (status === 'current') {
      const { curListsActiveIndex } = this.state
      const newIndex = curListsActiveIndex === index ? -1 : index
      console.log('curidx', index, curListsActiveIndex)
      this.setState({
        curListsActiveIndex: newIndex,
        curImageIdIndex: currentIdx - 1,
        currentIdx: currentIdx,
      })
    } else if (status === 'previews') {
      const { preListsActiveIndex } = this.state
      const newIndex = preListsActiveIndex === index ? -1 : index
      console.log('curidx', index, preListsActiveIndex)
      this.setState({
        preListsActiveIndex: newIndex,
        preImageIdIndex: currentIdx - 1,
        previewsIdx: currentIdx,
      })
    }
  }

  representChange = (status, e, { value, name }) => {
    console.log('status', status)
    let represents = { lobulation: '分叶', spiculation: '毛刺', calcification: '钙化', pin: '胸膜凹陷', cav: '空洞', vss: '血管集束', bea: '空泡', bro: '支气管充气' }
    var idx = name.split('-')[1]
    var boxes = []
    if (!status.includes('register')) {
      if (status === 'current') {
        boxes = this.state.curBoxes
      } else if (status === 'previews') {
        boxes = this.state.preBoxes
      }
      for (let count = 0; count < boxes.length; count++) {
        console.log('equal', boxes[count].nodule_no, idx)
        if (boxes[count].nodule_no === name.split('-')[1]) {
          boxes[count].lobulation = 1
          boxes[count].spiculation = 1
          boxes[count].calcification = 1
          boxes[count].pin = 1
          boxes[count].cav = 1
          boxes[count].vss = 1
          boxes[count].bea = 1
          boxes[count].bro = 1
          for (let itemValue in value) {
            for (let keyRepresents in represents) {
              if (value[itemValue] === represents[keyRepresents]) {
                if (keyRepresents === 'lobulation') {
                  boxes[count].lobulation = 2
                } else if (keyRepresents === 'spiculation') {
                  boxes[count].spiculation = 2
                } else if (keyRepresents === 'calcification') {
                  boxes[count].calcification = 2
                } else if (keyRepresents === 'pin') {
                  boxes[count].pin = 2
                } else if (keyRepresents === 'cav') {
                  boxes[count].cav = 2
                } else if (keyRepresents === 'vss') {
                  boxes[count].vss = 2
                } else if (keyRepresents === 'bea') {
                  boxes[count].bea = 2
                } else if (keyRepresents === 'bro') {
                  boxes[count].bro = 2
                }
                break
              }
            }
          }
          break
        }
      }
      if (status === 'current') {
        this.setState({
          curBoxes: boxes,
        })
      } else if (status === 'previews') {
        this.setState({
          preBoxes: boxes,
        })
      }
    } else {
      if (status === 'register-new') {
        boxes = this.state.registerBoxes['new'][idx]
      } else if (status === 'register-vanish') {
        boxes = this.state.registerBoxes['vanish'][idx]
      } else if (status === 'register-match-new') {
        boxes = this.state.registerBoxes['match'][idx]['later']
      } else if (status === 'register-match-previews') {
        boxes = this.state.registerBoxes['match'][idx]['earlier']
      }
      boxes.lobulation = 1
      boxes.spiculation = 1
      boxes.calcification = 1
      boxes.pin = 1
      boxes.cav = 1
      boxes.vss = 1
      boxes.bea = 1
      boxes.bro = 1
      for (let itemValue in value) {
        for (let keyRepresents in represents) {
          if (value[itemValue] === represents[keyRepresents]) {
            if (keyRepresents === 'lobulation') {
              boxes.lobulation = 2
            } else if (keyRepresents === 'spiculation') {
              boxes.spiculation = 2
            } else if (keyRepresents === 'calcification') {
              boxes.calcification = 2
            } else if (keyRepresents === 'pin') {
              boxes.pin = 2
            } else if (keyRepresents === 'cav') {
              boxes.cav = 2
            } else if (keyRepresents === 'vss') {
              boxes.vss = 2
            } else if (keyRepresents === 'bea') {
              boxes.bea = 2
            } else if (keyRepresents === 'bro') {
              boxes.bro = 2
            }
            break
          }
        }
      }
      if (status === 'register-new') {
        let registerBox = this.state.registerBoxes
        registerBox['new'][idx] = boxes
        this.setState({ registerBox: registerBox })
      } else if (status === 'register-vanish') {
        let registerBox = this.state.registerBoxes
        registerBox['vanish'][idx] = boxes
        this.setState({ registerBox: registerBox })
      } else if (status === 'register-match-new') {
        let registerBox = this.state.registerBoxes
        registerBox['match'][idx]['later'] = boxes
        this.setState({ registerBox: registerBox })
      } else if (status === 'register-match-previews') {
        let registerBox = this.state.registerBoxes
        console.log('registerbox', registerBox['match'][idx]['earlier'])
        registerBox['match'][idx]['earlier'] = boxes
        this.setState({ registerBox: registerBox })
      }
    }
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

  toPulmonary() {
    let newCornerstoneElement = this.state.newCornerstoneElement
    let newViewport = cornerstone.getViewport(newCornerstoneElement)
    newViewport.voi.windowWidth = 1600
    newViewport.voi.windowCenter = -600
    cornerstone.setViewport(newCornerstoneElement, newViewport)
    let preCornerstoneElement = this.state.preCornerstoneElement
    let preViewport = cornerstone.getViewport(preCornerstoneElement)
    preViewport.voi.windowWidth = 1600
    preViewport.voi.windowCenter = -600
    cornerstone.setViewport(preCornerstoneElement, preViewport)
  }

  toVentralWindow() {
    let newCornerstoneElement = this.state.newCornerstoneElement
    let newViewport = cornerstone.getViewport(newCornerstoneElement)
    newViewport.voi.windowWidth = 400
    newViewport.voi.windowCenter = 40
    cornerstone.setViewport(newCornerstoneElement, newViewport)
    let preCornerstoneElement = this.state.preCornerstoneElement
    let preViewport = cornerstone.getViewport(preCornerstoneElement)
    preViewport.voi.windowWidth = 400
    preViewport.voi.windowCenter = 40
    cornerstone.setViewport(preCornerstoneElement, preViewport)
  }

  toMedia() {
    let newCornerstoneElement = this.state.newCornerstoneElement
    let newViewport = cornerstone.getViewport(newCornerstoneElement)
    newViewport.voi.windowWidth = 500
    newViewport.voi.windowCenter = 50
    cornerstone.setViewport(newCornerstoneElement, newViewport)
    let preCornerstoneElement = this.state.preCornerstoneElement
    let preViewport = cornerstone.getViewport(preCornerstoneElement)
    preViewport.voi.windowWidth = 500
    preViewport.voi.windowCenter = 50
    cornerstone.setViewport(preCornerstoneElement, preViewport)
  }

  toBoneWindow() {
    let newCornerstoneElement = this.state.newCornerstoneElement
    let newViewport = cornerstone.getViewport(newCornerstoneElement)
    newViewport.voi.windowWidth = 1000
    newViewport.voi.windowCenter = 300
    cornerstone.setViewport(newCornerstoneElement, newViewport)
    let preCornerstoneElement = this.state.preCornerstoneElement
    let preViewport = cornerstone.getViewport(preCornerstoneElement)
    preViewport.voi.windowWidth = 1000
    preViewport.voi.windowCenter = 300
    cornerstone.setViewport(preCornerstoneElement, preViewport)
  }

  imagesFlip() {
    let newCornerstoneElement = this.state.newCornerstoneElement
    let newViewport = cornerstone.getViewport(newCornerstoneElement)
    newViewport.invert = !newViewport.invert
    cornerstone.setViewport(newCornerstoneElement, newViewport)
    let preCornerstoneElement = this.state.preCornerstoneElement
    let preViewport = cornerstone.getViewport(preCornerstoneElement)
    preViewport.invert = !preViewport.invert
    cornerstone.setViewport(preCornerstoneElement, preViewport)
  }

  playAnimation() {
    this.setState(({ isPlaying }) => ({
      isPlaying: !isPlaying,
    }))
  }

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

  render() {
    const welcome = '欢迎您，' + localStorage.realname
    const { curListsActiveIndex, preListsActiveIndex, registerBoxes, templateText, noduleTblCheckedValue, activeTool } = this.state
    let curBoxesAccord = ''
    let preBoxesAccord = ''
    var newNodulesTbl = ''
    var vanishNodulesTbl = ''
    var matchNodulesTbl = ''
    var matchNoduleLen = 0
    var newNoduleLen = 0
    var vanishNoduleLen = 0
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

    curBoxesAccord = this.state.curBoxes.map((inside, idx) => {
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
      }
      let representArray = []
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
      return (
        <div key={idx}>
          <Accordion.Title index={idx} onClick={this.handleListClick.bind(this, inside.slice_idx, idx, 'current')} active={curListsActiveIndex === idx} className="current-nodule-accordion-title">
            <Row gutter={1} justify="space-around">
              <Col span={1}>
                <Text level={4}>{idx + 1}</Text>
              </Col>
              <Col span={5}>
                位置：
                <Cascader options={segmentConfig} onChange={this.onLungLocationChange.bind(this, idx, 'current')}>
                  <a href="#">{lungLoc[inside.segment]}</a>
                </Cascader>
              </Col>
              <Col span={3}>
                <Cascader options={dangerLevelConfig} onChange={this.onDangerLevelChange.bind(this, idx, 'current')}>
                  <a href="#">{dangerLevel[inside.malignancy]}</a>
                </Cascader>
              </Col>
              <Col span={3}>
                <Text>{Math.floor(inside.malProb * 1000) / 10 + '%'}</Text>
              </Col>
            </Row>
          </Accordion.Title>
          <Accordion.Content active={curListsActiveIndex === idx} className="current-nodule-accordion-content">
            <Row gutter={4} justify="space-around">
              <Col span={1}>
                <Text type="success">{inside.slice_idx}</Text>
              </Col>
              <Col span={4}>
                <Text>{'\xa0\xa0' + (ll / 10).toFixed(2) + '\xa0\xa0' + ' ×' + '\xa0\xa0' + (sl / 10).toFixed(2) + ' cm'}</Text>
              </Col>
              <Col span={3}>
                <Text>{inside.volume !== undefined ? (Math.floor(inside.volume * 100) / 100).toFixed(2) + '\xa0cm³' : null}</Text>
              </Col>
              <Col span={4}>{inside.huMin !== undefined && inside.huMax !== undefined ? inside.huMin + '~' + inside.huMax + 'HU' : null}</Col>
              <Col span={1}>
                <Text>表征:</Text>
              </Col>
              <Col span={8}>
                <Dropdown
                  multiple
                  selection
                  options={repretationOptions}
                  className="representDropdown"
                  icon="add circle"
                  name={'dropdown-' + idx}
                  value={representArray}
                  onChange={this.representChange.bind(this, 'current')}
                />
              </Col>
            </Row>
          </Accordion.Content>
        </div>
      )
    })

    preBoxesAccord = this.state.preBoxes.map((inside, idx) => {
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
      }
      let representArray = []
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
      return (
        <div key={idx}>
          <Accordion.Title index={idx} onClick={this.handleListClick.bind(this, inside.slice_idx, idx, 'previews')} active={preListsActiveIndex === idx} className="current-nodule-accordion-title">
            <Row gutter={1} justify="space-around">
              <Col span={1}>
                <Text level={4}>{idx + 1}</Text>
              </Col>
              <Col span={5}>
                位置：
                <Cascader options={segmentConfig} onChange={this.onLungLocationChange.bind(this, idx, 'previews')}>
                  <a href="#">{lungLoc[inside.segment]}</a>
                </Cascader>
              </Col>
              <Col span={3}>
                <Cascader options={dangerLevelConfig} onChange={this.onDangerLevelChange.bind(this, idx, 'previews')}>
                  <a href="#">{dangerLevel[inside.malignancy]}</a>
                </Cascader>
              </Col>
              <Col span={3}>
                <Text>{Math.floor(inside.malProb * 1000) / 10 + '%'}</Text>
              </Col>
            </Row>
          </Accordion.Title>
          <Accordion.Content active={preListsActiveIndex === idx} className="current-nodule-accordion-content">
            <Row gutter={4} justify="space-around">
              <Col span={1}>
                <Text type="success">{inside.slice_idx}</Text>
              </Col>
              <Col span={4}>
                <Text>{'\xa0\xa0' + (ll / 10).toFixed(2) + '\xa0\xa0' + ' ×' + '\xa0\xa0' + (sl / 10).toFixed(2) + ' cm'}</Text>
              </Col>
              <Col span={3}>
                <Text>{inside.volume !== undefined ? (Math.floor(inside.volume * 100) / 100).toFixed(2) + '\xa0cm³' : null}</Text>
              </Col>
              <Col span={4}>{inside.huMin !== undefined && inside.huMax !== undefined ? inside.huMin + '~' + inside.huMax + 'HU' : null}</Col>
              <Col>
                <Text>表征:</Text>
              </Col>
              <Col>
                <Dropdown
                  multiple
                  selection
                  options={repretationOptions}
                  className="representDropdown"
                  icon="add circle"
                  name={'dropdown-' + idx}
                  value={representArray}
                  onChange={this.representChange.bind(this, 'previews')}
                />
              </Col>
            </Row>
          </Accordion.Content>
        </div>
      )
    })

    if (matchNoduleLen !== 0) {
      matchNodulesTbl = registerBoxes['match'].map((value, idx) => {
        var doublingTime = ''
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
          doublingTime = '增加'
        } else {
          doublingTime = '减少'
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
          <Row key={idx} justify="center" className="register-nodule-match-card">
            <Col span={1}>
              <Row>{'N' + newNodule.nodule_no}</Row>
              <Row>
                <Divider type="vertical" />
              </Row>
              <Row>{'P' + previewsNodule.nodule_no}</Row>
            </Col>
            <Col span={1}>
              <Divider type="vertical" className="vertical-divider-nodule" />
            </Col>

            <Col span={22}>
              <Row>
                <Col span={20}>
                  位置：
                  <Cascader options={segmentConfig} onChange={this.onLungLocationChange.bind(this, idx, 'register-match')}>
                    <a href="#">{lungLoc[followupLoc]}</a>
                  </Cascader>
                </Col>
                <Col span={2}>倍增时间</Col>
                <Col span={2}>
                  <p className="doublingTimeText">{doublingTime}</p>
                </Col>
              </Row>
              <Divider className="horizontal-divider-nodule" />
              <Row>
                <Col span={2}>
                  <Tag color="blue">{'IM' + (newNodule.slice_idx + 1)}</Tag>
                </Col>
                <Col span={3}>{newNoduleLength.toFixed(1) + '*' + newNoduleWidth.toFixed(1) + 'mm'}</Col>
                <Col span={2}>{newNodule.volume !== undefined ? Math.floor(newNodule.volume * 1000).toFixed(1) + '\xa0mm³' : null}</Col>
                <Col span={4}>{newNodule.huMin + '~' + newNodule.huMax + 'HU'}</Col>
                <Col span={5}>
                  密度：
                  <Cascader options={densityConfig} onChange={this.onDensityChange.bind(this, idx, 'register-match-new')}>
                    <a href="#">{densityList[newNodule.texture]}</a>
                  </Cascader>
                </Col>
                <Col span={8}>
                  表征
                  <Dropdown
                    multiple
                    selection
                    options={repretationOptions}
                    className="representDropdown"
                    icon="add circle"
                    name={'dropdown-' + idx}
                    value={newRepresentArray}
                    onChange={this.representChange.bind(this, 'register-match-new')}
                  />
                </Col>
              </Row>
              <Row>
                <Col span={2}>
                  <Tag color="blue">{'IM' + (previewsNodule.slice_idx + 1)}</Tag>
                </Col>
                <Col span={3}>{preNoduleLength.toFixed(1) + '*' + preNoduleWidth.toFixed(1) + 'mm'}</Col>
                <Col span={2}>{previewsNodule.volume !== undefined ? Math.floor(previewsNodule.volume * 1000).toFixed(1) + '\xa0mm³' : null}</Col>
                <Col span={4}>{previewsNodule.huMin + '~' + previewsNodule.huMax + 'HU'}</Col>
                <Col span={5}>
                  密度：
                  <Cascader options={densityConfig} onChange={this.onDensityChange.bind(this, idx, 'register-match-previews')}>
                    <a href="#">{densityList[previewsNodule.texture]}</a>
                  </Cascader>
                </Col>
                <Col span={8}>
                  表征
                  <Dropdown
                    multiple
                    selection
                    options={repretationOptions}
                    className="representDropdown"
                    icon="add circle"
                    name={'dropdown-' + idx}
                    value={preRepresentArray}
                    onChange={this.representChange.bind(this, 'register-match-previews')}
                  />
                </Col>
              </Row>
            </Col>
          </Row>
        )
      })
    }

    if (newNoduleLen !== 0) {
      newNodulesTbl = registerBoxes['new'].map((value, idx) => {
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
          <Row key={idx} justify="center" className="register-nodule-new-card">
            <Col span={1}>
              <Row>{'N' + value.nodule_no}</Row>
            </Col>
            <Col span={1}>
              <Divider type="vertical" className="vertical-divider-nodule" />
            </Col>

            <Col span={22}>
              <Row>
                <Col span={24}>
                  位置：
                  <Cascader options={segmentConfig} onChange={this.onLungLocationChange.bind(this, idx, 'register-new')}>
                    <a href="#">{lungLoc[value.segment]}</a>
                  </Cascader>
                </Col>
              </Row>
              <Divider className="horizontal-divider-nodule" />
              <Row>
                <Col span={2}>
                  <Tag color="blue">{'IM ' + value['slice_idx']}</Tag>
                </Col>
                <Col span={3}>{ll.toFixed(1) + '*' + sl.toFixed(1) + 'mm'}</Col>
                <Col span={2}>{value.volume !== undefined ? Math.floor(value.volume * 1000).toFixed(1) + '\xa0mm³' : null}</Col>
                <Col span={4}>{value.huMin + '~' + value.huMax + 'HU'}</Col>
                <Col span={5}>
                  密度：
                  <Cascader options={densityConfig} onChange={this.onDensityChange.bind(this, idx, 'register-new')}>
                    <a href="#">{densityList[value.texture]}</a>
                  </Cascader>
                </Col>
                <Col span={8}>
                  表征：
                  <Dropdown
                    multiple
                    selection
                    options={repretationOptions}
                    className="representDropdown"
                    icon="add circle"
                    name={'dropdown-' + idx}
                    value={representArray}
                    onChange={this.representChange.bind(this, 'register-new')}
                  />
                </Col>
              </Row>
            </Col>
          </Row>
        )
      })
    }

    if (vanishNoduleLen !== 0) {
      vanishNodulesTbl = registerBoxes['vanish'].map((value, idx) => {
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
          <Row key={idx} justify="center" className="register-nodule-new-card">
            <Col span={1}>
              <Row></Row>
              <Row>{'P' + value.nodule_no}</Row>
            </Col>
            <Col span={1}>
              <Divider type="vertical" className="vertical-divider-nodule" />
            </Col>

            <Col span={22}>
              <Row>
                <Col span={24}>
                  位置：
                  <Cascader options={segmentConfig} onChange={this.onLungLocationChange.bind(this, idx, 'register-vanish')}>
                    <a href="#">{lungLoc[value.segment]}</a>
                  </Cascader>
                </Col>
              </Row>
              <Divider className="horizontal-divider-nodule" />
              <Row>
                <Col span={2}>
                  <Tag color="blue">{'IM ' + value['slice_idx']}</Tag>
                </Col>
                <Col span={3}>{ll.toFixed(1) + ' * ' + sl.toFixed(1) + 'mm'}</Col>
                <Col span={2}>{value.volume !== undefined ? Math.floor(value.volume * 1000).toFixed(1) + '\xa0mm³' : null}</Col>
                <Col span={4}>{value.huMin + '~' + value.huMax + 'HU'}</Col>
                <Col span={5}>
                  密度：
                  <Cascader options={densityConfig} onChange={this.onDensityChange.bind(this, idx, 'register-vanish')}>
                    <a href="#">{densityList[value.texture]}</a>
                  </Cascader>
                </Col>
                <Col span={8}>
                  表征：
                  <Dropdown
                    multiple
                    selection
                    options={repretationOptions}
                    className="representDropdown"
                    icon="add circle"
                    name={'dropdown-' + idx}
                    value={representArray}
                    onChange={this.representChange.bind(this, 'register-vanish')}
                  />
                </Col>
              </Row>
            </Col>
          </Row>
        )
      })
    }

    return (
      <div id="follow-up">
        <Menu className="corner-header">
          <Menu.Item>
            <Image src={src1} avatar size="mini" />
            <a id="sys-name" href="/searchCase">
              DeepLN肺结节全周期
              <br />
              管理数据平台
            </a>
          </Menu.Item>
          <Menu.Item className="hucolumn">
            <Button.Group>
              <Button onClick={this.toPulmonary.bind(this)} content="肺窗" className="hubtn" />
              <Button
                onClick={this.toBoneWindow.bind(this)} //骨窗窗宽窗位函数
                content="骨窗"
                className="hubtn"
              />
              <Button
                onClick={this.toVentralWindow.bind(this)} //腹窗窗宽窗位函数
                content="腹窗"
                className="hubtn"
              />
              <Button onClick={this.toMedia.bind(this)} content="纵隔窗" className="hubtn" />
            </Button.Group>
          </Menu.Item>
          <span id="line-left"></span>
          <Menu.Item className="funcolumn">
            <Button.Group>
              <Button icon title="灰度反转" onClick={this.imagesFlip.bind(this)} className="funcbtn">
                <Icon name="adjust" size="large"></Icon>
              </Button>
              <Button icon title="放大" onClick={this.ZoomIn} className="funcbtn">
                <Icon name="search plus" size="large"></Icon>
              </Button>
              <Button icon title="缩小" onClick={this.ZoomOut} className="funcbtn">
                <Icon name="search minus" size="large"></Icon>
              </Button>
              <Button icon onClick={this.reset} className="funcbtn" title="刷新">
                <Icon name="repeat" size="large"></Icon>
              </Button>
              {!this.state.isPlaying ? (
                <Button icon onClick={this.playAnimation.bind(this)} className="funcbtn" title="播放动画">
                  <Icon name="play" size="large"></Icon>
                </Button>
              ) : (
                <Button icon onClick={this.playAnimation.bind(this)} className="funcbtn" title="暂停动画">
                  <Icon name="pause" size="large"></Icon>
                </Button>
              )}
              {this.state.isAnnoVisible ? (
                <Button icon onClick={this.toHidebox} className="funcbtn" id="showNodule" title="显示结节">
                  <Icon name="eye" size="large"></Icon>
                </Button>
              ) : (
                <Button icon onClick={this.toHidebox} className="funcbtn" id="hideNodule" title="隐藏结节">
                  <Icon name="eye slash" size="large"></Icon>
                </Button>
              )}

              {this.state.isOverlayVisible ? (
                <Button icon onClick={this.toHideInfo.bind(this)} className="funcbtn" id="showInfo" title="显示信息">
                  <Icon name="content" size="large"></Icon>
                </Button>
              ) : (
                <Button icon onClick={this.toHideInfo.bind(this)} className="funcbtn" id="hideInfo" title="隐藏信息">
                  <Icon name="delete calendar" size="large"></Icon>
                </Button>
              )}
            </Button.Group>
            <span id="line-left"></span>
            <Button.Group>
              <Button icon onClick={this.startRegistering} className="funcbtn" id="register" title="开始配准">
                <Icon name="window restore outline" size="large"></Icon>
              </Button>
              {activeTool === 'RectangleRoi' ? (
                <Button icon onClick={this.startAnnos.bind(this)} title="标注" className="funcbtn" active>
                  <Icon name="edit" size="large"></Icon>
                </Button>
              ) : (
                <Button icon onClick={this.startAnnos.bind(this)} title="标注" className="funcbtn">
                  <Icon name="edit" size="large"></Icon>
                </Button>
              )}
              {activeTool === 'Bidirectional' ? (
                <Button icon onClick={this.bidirectionalMeasure.bind(this)} title="测量" className="funcbtn" active>
                  <Icon name="crosshairs" size="large"></Icon>
                </Button>
              ) : (
                <Button icon onClick={this.bidirectionalMeasure.bind(this)} title="测量" className="funcbtn">
                  <Icon name="crosshairs" size="large"></Icon>
                </Button>
              )}
              {activeTool === 'Length' ? (
                <Button icon onClick={this.lengthMeasure.bind(this)} title="长度" className="funcbtn" active>
                  <Icon name="arrows alternate vertical" size="large"></Icon>
                </Button>
              ) : (
                <Button icon onClick={this.lengthMeasure.bind(this)} title="长度" className="funcbtn">
                  <Icon name="arrows alternate vertical" size="large"></Icon>
                </Button>
              )}
              {activeTool === 'Scroll' ? (
                <Button icon title="切换切片" onClick={this.ScrollStack.bind(this)} className="funcbtn" active>
                  <Icon name="sort" size="large"></Icon>
                </Button>
              ) : (
                <Button icon title="切换切片" onClick={this.ScrollStack.bind(this)} className="funcbtn">
                  <Icon name="sort" size="large"></Icon>
                </Button>
              )}
              {activeTool === 'Wwwc' ? (
                <Button icon title="窗宽窗位" onClick={this.wwwcCustom.bind(this)} className="funcbtn" active>
                  <Icon name="sliders" size="large"></Icon>
                </Button>
              ) : (
                <Button icon title="窗宽窗位" onClick={this.wwwcCustom.bind(this)} className="funcbtn">
                  <Icon name="sliders" size="large"></Icon>
                </Button>
              )}
              {activeTool === 'Eraser' ? (
                <Button icon title="擦除" onClick={this.eraseAnno.bind(this)} className="funcbtn" active>
                  <Icon name="eraser" size="large"></Icon>
                </Button>
              ) : (
                <Button icon title="擦除" onClick={this.eraseAnno.bind(this)} className="funcbtn">
                  <Icon name="eraser" size="large"></Icon>
                </Button>
              )}
            </Button.Group>
          </Menu.Item>
          <span id="line-right"></span>

          <Menu.Item position="right">
            <Dropdown text={welcome}>
              <Dropdown.Menu id="logout-menu">
                <Dropdown.Item icon="home" text="我的主页" onClick={this.toHomepage} />
                <Dropdown.Item icon="write" text="留言" onClick={this.handleWriting} />
                <Dropdown.Item icon="log out" text="注销" onClick={this.handleLogout} />
              </Dropdown.Menu>
            </Dropdown>
          </Menu.Item>
        </Menu>
        <Row>
          <Col span={12}>
            {/* current case */}
            <CornerstoneViewport
              key={this.state.curViewportIndex}
              tools={this.state.tools}
              imageIds={this.state.curImageIds}
              style={{ minWidth: '90%', height: '614px', flex: '1' }}
              imageIdIndex={this.state.curImageIdIndex}
              isPlaying={this.state.isPlaying}
              frameRate={this.state.frameRate}
              activeTool={this.state.activeTool}
              isOverlayVisible={this.state.isOverlayVisible}
              onElementEnabled={(elementEnabledEvt) => {
                const newCornerstoneElement = elementEnabledEvt.detail.element
                this.setState({
                  newCornerstoneElement,
                })
              }}
              // initialViewport={this.state.viewport}
              className={this.state.activeViewportIndex === this.state.curViewportIndex ? 'active' : ''}
              setViewportActive={() => {
                this.setState({
                  activeViewportIndex: this.state.curViewportIndex,
                })
              }}
            />
          </Col>
          <Col span={12}>
            <CornerstoneViewport
              key={this.state.preViewportIndex}
              tools={this.state.tools}
              imageIds={this.state.preImageIds}
              style={{ minWidth: '90%', height: '614px', flex: '1' }}
              imageIdIndex={this.state.preImageIdIndex}
              isPlaying={this.state.isPlaying}
              frameRate={this.state.frameRate}
              activeTool={this.state.activeTool}
              isOverlayVisible={this.state.isOverlayVisible}
              onElementEnabled={(elementEnabledEvt) => {
                const preCornerstoneElement = elementEnabledEvt.detail.element
                this.setState({
                  preCornerstoneElement,
                })
              }}
              // initialViewport={this.state.viewport}
              className={this.state.activeViewportIndex === this.state.preViewportIndex ? 'active' : ''}
              setViewportActive={() => {
                this.setState({
                  activeViewportIndex: this.state.preViewportIndex,
                })
              }}
            />
          </Col>
        </Row>
        {this.state.isRegistering === false ? (
          <div>
            <Row justify="space-around">
              <Col span={11}>
                <Accordion>{curBoxesAccord}</Accordion>
              </Col>
              <Col span={11}>
                <Accordion>{preBoxesAccord}</Accordion>
              </Col>
            </Row>
          </div>
        ) : (
          <div className="nodule-report">
            <Row>
              <Col span={12} className="structured-report">
                <Row gutter={4}>
                  <Col span={22}>
                    <Title level={3} className="reportTitle">
                      结构化报告
                    </Title>
                  </Col>
                  <Col span={2}>
                    <AntdButton type="primary" shape="round" size="small">
                      保存
                    </AntdButton>
                  </Col>
                </Row>
                <Row>
                  <Col span={16}></Col>
                  <Col span={8}>
                    <Checkbox.Group style={{ width: '100%' }} onChange={this.noduleTblCheckboxChange}>
                      <Checkbox value="match">{'匹配(' + matchNoduleLen + ')'}</Checkbox>
                      <Checkbox value="new">{'新增(' + newNoduleLen + ')'}</Checkbox>
                      <Checkbox value="vanish">{'消失(' + vanishNoduleLen + ')'}</Checkbox>
                    </Checkbox.Group>
                  </Col>
                </Row>
                <div className="all-nodule-table">
                  {noduleTblCheckedValue.includes('match') ? matchNodulesTbl : null}
                  {noduleTblCheckedValue.includes('new') ? newNodulesTbl : null}
                  {noduleTblCheckedValue.includes('vanish') ? vanishNodulesTbl : null}
                </div>
              </Col>
              <Col span={11}>
                <Tabs defaultActiveKey="1" type="card" size="small">
                  <TabPane className="tabs-diagnose" tab="影像所见" key="1">
                    <Row>
                      <Col span={20}></Col>
                      <Col span={2}>
                        <AntdButton type="primary" shape="round" size="small">
                          放大
                        </AntdButton>
                      </Col>
                      <Col span={2}>
                        <AntdButton type="primary" shape="round" size="small">
                          复制
                        </AntdButton>
                      </Col>
                    </Row>
                    <Row>
                      <TextArea value={templateText} autoSize={{ minRows: 3, maxRows: 5 }} />
                    </Row>
                  </TabPane>
                  <TabPane className="tabs-diagnose" tab="处理建议" key="2">
                    Content of card tab 2
                  </TabPane>
                </Tabs>
              </Col>
            </Row>
          </div>
        )}
      </div>
    )
  }
}

export default FollowUpElement
