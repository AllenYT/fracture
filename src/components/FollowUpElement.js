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
import { Slider, Select, notification, Sapce, Space, Checkbox, Tabs, Radio, Row, Col, Typography, Dropdown as aDropdown, Menu as aMenu, Cascader, Button as AntdButton } from 'antd'
import src1 from '../images/scu-logo.jpg'

import * as echarts from 'echarts/lib/echarts'

const { Title, Text } = Typography
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
      registerBoxes: '',
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
        // Touch
        { name: 'PanMultiTouch', mode: 'active' },
        { name: 'ZoomTouchPinch', mode: 'active' },
        { name: 'StackScrollMultiTouch', mode: 'active' },
      ],

      random: Math.random(),
    }
    this.config = JSON.parse(localStorage.getItem('config'))
    this.nextPath = this.nextPath.bind(this)
    this.startRegistering = this.startRegistering.bind(this)
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
          console.log('change location', this.state.curBoxes)
        }
      }
    } else {
      let box = this.state.preBoxes
      console.log('location', val)
      for (let item in lungLoc) {
        if (lungLoc[item] === val[0] + '-' + val[1]) {
          box[idx].segment = item
          this.setState({ preBoxes: box })
          console.log('change location', this.state.preBoxes)
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
    var boxes = []
    if (status === 'current') {
      boxes = this.state.curBoxes
    } else {
      boxes = this.state.preBoxes
    }

    for (let count = 0; count < boxes.length; count++) {
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
    } else {
      this.setState({
        preBoxes: boxes,
      })
    }
  }

  render() {
    const welcome = '欢迎您，' + localStorage.realname
    const { curListsActiveIndex, preListsActiveIndex, registerBoxes } = this.state
    let curBoxesAccord = ''
    let preBoxesAccord = ''
    var calCount = 0
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
      if (inside.calcification === 2) {
        calCount += 1
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
              <Col span={1}>
                <Text>位置</Text>
              </Col>
              <Col span={5}>
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
      if (inside.calcification === 2) {
        calCount += 1
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
              <Col span={1}>
                <Text>位置</Text>
              </Col>
              <Col span={5}>
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
              <Button onClick={this.toPulmonary} content="肺窗" className="hubtn" />
              <Button
                onClick={this.toBoneWindow} //骨窗窗宽窗位函数
                content="骨窗"
                className="hubtn"
              />
              <Button
                onClick={this.toVentralWindow} //腹窗窗宽窗位函数
                content="腹窗"
                className="hubtn"
              />
              <Button onClick={this.toMedia} content="纵隔窗" className="hubtn" />
            </Button.Group>
          </Menu.Item>
          <span id="line-left"></span>
          <Menu.Item className="funcolumn">
            <Button.Group>
              <Button icon title="灰度反转" onClick={this.imagesFilp} className="funcbtn">
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
              <Button icon onClick={this.toHidebox} className="funcbtn" id="showNodule" title="显示结节">
                <Icon name="eye" size="large"></Icon>
              </Button>
              <Button icon onClick={this.toHidebox} className="funcbtn" id="hideNodule" title="隐藏结节">
                <Icon name="eye slash" size="large"></Icon>
              </Button>
              <Button icon onClick={this.toHideInfo} className="funcbtn" id="showInfo" title="显示信息">
                <Icon name="content" size="large"></Icon>
              </Button>
              <Button icon onClick={this.toHideInfo} className="funcbtn" id="hideInfo" title="隐藏信息">
                <Icon name="delete calendar" size="large"></Icon>
              </Button>
            </Button.Group>
            <Button.Group>
              <Button icon onClick={this.startRegistering} className="funcbtn" id="register" title="开始配准">
                <Icon name="window restore outline" size="large"></Icon>
              </Button>
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
            {/* <Row gutter={4}>
              <Col span={10}>
                <Title level={3} className="reportTitle">
                  结构化报告
                </Title>
              </Col>
              <Col span={4}>
                <Button onClick={this.startRegistering}>开始配准</Button>
              </Col>
            </Row> */}
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
                  <Col span={12}>
                    <Title level={3} className="reportTitle">
                      结构化报告
                    </Title>
                  </Col>
                  {/* <Col>
                    <AntdButton type="primary" shape="round" size="small">
                      保存
                    </AntdButton>
                  </Col> */}
                </Row>
                <Row>
                  <Col span={16}></Col>
                  <Col span={8}>
                    <Checkbox.Group style={{ width: '100%' }}>
                      <Checkbox value="match">{'匹配(' + matchNoduleLen + ')'}</Checkbox>
                      <Checkbox value="new">{'新增(' + newNoduleLen + ')'}</Checkbox>
                      <Checkbox value="vanish">{'消失(' + vanishNoduleLen + ')'}</Checkbox>
                    </Checkbox.Group>
                  </Col>
                </Row>
              </Col>
              <Col span={12}></Col>
            </Row>
          </div>
        )}
      </div>
    )
  }
}

export default FollowUpElement
