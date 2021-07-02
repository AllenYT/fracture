import React, { Component } from 'react'
import { findDOMNode } from 'react-dom'

import axios from 'axios'
import { Slider } from 'antd'
import { List, Grid, Button, Icon, Menu, Image, Dropdown, Popup, Table, Tab, Label, Sidebar } from 'semantic-ui-react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import InputColor from 'react-input-color'

import '../css/cornerstone.css'
import '../css/segview.css'
import StudyBrowserList from '../components/StudyBrowserList'
import src1 from '../images/scu-logo.jpg'
import VTKViewer from '../components/VTKViewer'
import cornerstone from 'cornerstone-core'
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader'

cornerstoneWADOImageLoader.external.cornerstone = cornerstone

const config = JSON.parse(localStorage.getItem('config'))
const dataConfig = config.data
const draftConfig = config.draft
const userConfig = config.user
const places = {
  0: '选择位置',
  1: '右肺中叶',
  2: '右肺上叶',
  3: '右肺下叶',
  4: '左肺上叶',
  5: '左肺下叶',
}
const segments = {
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
class ViewerPanel extends Component {
  constructor(props) {
    super(props)
    this.state = {
      windowWidth: window.screen.width,
      windowHeight: window.screen.height,
      viewerWidth: 1200,
      viewerHeight: 800,
      caseId: window.location.pathname.split('/segView/')[1].split('/')[0],
      username: window.location.pathname.split('/')[3],
      urls: [],
      nodulesData: null,
      lobesData: null,
      nodulesController: null,
      lobesController: null,
      opTop: 46,
      opWidth: 314,
      opHeight: 42,
      MPR: false,
      CPR: false,
      segVisible: [],
      opacity: [],
      listsCropped: [true, true, true],
      listsActive: [],
      listsOpacityChangeable: [],
      optVisible: false,
      optSelected: [true, true, true],
      displayCrosshairs: false,
      labelThreshold: 300,
      paintRadius: 5,
      labelColor: [255, 0, 0],
      editing: false,
      painting: false,
      erasing: false,
      isCtrl: false,
    }
    this.nextPath = this.nextPath.bind(this)
    this.handleLogout = this.handleLogout.bind(this)
    this.toHomepage = this.toHomepage.bind(this)
  }
  async componentDidMount() {
    this.apis = []
    this.viewer.resize(this.state.viewerWidth, this.state.viewerHeight)
    //this.resize3DView()

    // const dom = ReactDOM.findDOMNode(this.gridRef);
    document.getElementById('header').style.display = 'none'

    window.addEventListener('resize', this.resize3DView.bind(this))
    window.addEventListener('contextmenu', this.contextmenu.bind(this))
    window.addEventListener('dblclick', this.dblclick.bind(this))
    window.addEventListener('click', this.click.bind(this))
    window.addEventListener('mousedown', this.mousedown.bind(this))
    window.addEventListener('mousewheel', this.mousewheel.bind(this), {
      passive: false,
    })
    window.addEventListener('keydown', this.keydown.bind(this))
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.resize3DView.bind(this))
    window.removeEventListener('contextmenu', this.contextmenu.bind(this))
    window.removeEventListener('dblclick', this.dblclick.bind(this))
    window.removeEventListener('click', this.click.bind(this))
    window.removeEventListener('mousedown', this.mousedown.bind(this))
    window.removeEventListener('mousewheel', this.mousewheel.bind(this))
    window.removeEventListener('keydown', this.keydown.bind(this))
  }

  componentDidUpdate(prevProps, prevState, snapshot) {}
  resize3DView(e) {
    // console.log('browser', e.target.innerWidth, e.target.innerHeight)
    if (document.getElementById('segment-container') !== null) {
      const componentRect = findDOMNode(document.getElementById('segment-container')).getBoundingClientRect()
      const clientWidth = document.getElementById('segment-container').clientWidth
      const clientHeight = document.getElementById('segment-container').clientHeight
      // console.log('resize3DView', clientWidth, clientHeight)
      this.viewer.resize(clientWidth, clientHeight)
    }

    if (document.getElementsByClassName('segment-list-block') !== null && document.getElementsByClassName('segment-list-block').length > 2) {
      const outElement = document.getElementsByClassName('segment-list-block')[0]
      if (outElement.getElementsByTagName('tr') !== null && outElement.getElementsByTagName('tr').length > 1) {
        const firstElement = outElement.getElementsByTagName('tr')[0]
        const secondElement = outElement.getElementsByTagName('tr')[2]

        this.setState({
          opTop: firstElement.clientHeight,
          opWidth: secondElement.clientWidth,
          opHeight: secondElement.clientHeight,
        })
      }
    }
  }
  contextmenu(e) {}
  keydown(e) {
    // e.which : +/187, -/189
    // if(e.ctrlKey){
    //   console.log("ctrl")
    //   this.setState({
    //     isCtrl: true
    //   })
    // }
    if (e.shiftKey) {
      console.log('ctrl')
      this.setState({
        isCtrl: true,
      })
    }
    const isCtrl = this.state.isCtrl
    if (e.which === 187 && isCtrl) {
    }
    const that = this
    window.addEventListener('keyup', keyup)
    function keyup(e) {
      that.setState({
        isCtrl: false,
      })
      window.removeEventListener('keyup', keyup)
    }
  }
  mousewheel(e) {}
  mousedown(e) {}
  click(e) {
    // console.log("click", e)
  }
  dblclick(e) {
    // console.log("dblclick", e)
  }
  rightClick(picked) {
    console.log('right click', picked)
    if (this.state.editing) {
      if (picked) {
        const { originXBorder, originYBorder, originZBorder } = this.state
        const origin = this.transform3DPickedToOrigin(picked)
        if (origin[0] >= 0 && origin[0] <= originXBorder && origin[1] >= 0 && origin[1] <= originYBorder && origin[2] >= 0 && origin[2] <= originZBorder) {
          this.setState({
            origin: origin,
          })
          this.updateAllByOrigin()
        }
      }
    }
  }

  nextPath(path) {
    this.props.history.push(path)
  }
  goBack() {
    window.history.back()
  }
  toHomepage() {
    window.location.href = '/homepage'
    // this.nextPath('/homepage/' + params.caseId + '/' + res.data)
  }
  handleLogout() {
    const token = localStorage.getItem('token')
    const headers = {
      Authorization: 'Bearer '.concat(token),
    }
    axios
      .get(userConfig.signoutUser, { headers })
      .then((response) => {
        if (response.data.status === 'okay') {
          this.setState({ isLoggedIn: false })
          localStorage.clear()
          sessionStorage.clear()
          window.location.href = '/'
        } else {
          alert('出现内部错误，请联系管理员！')
          window.location.href = '/'
        }
      })
      .catch((error) => {
        console.log('error')
      })
  }
  handleClickScreen(e, href) {
    console.log('card', href)
    // if (
    //   window.location.pathname.split("/segView/")[1].split("/")[0] !==
    //   href.split("/case/")[1].split("/")[0]
    // ) {
    //   this.setState({
    //     caseId: href.split("/case/")[1].split("/")[0],
    //     username: href.split("/")[3],
    //     show: false,
    //   });
    // window.location.href =
    //   "/segView/" + href.split("/case/")[1].split("/")[0];
    // }
    // window.location.href=href
  }
  function(key, callback, args) {
    let isC = false
    function keyDown(e) {
      if (e.ctrlKey) {
        isC = true
      }
      if (e.keyCode === key.charCodeAt(0) && isC) {
        callback.apply(this, args)
        return false
      }
    }
    function keyUp(e) {}
  }

  handleFuncButton(idx, e) {
    switch (idx) {
      case 'FRG':
        this.viewer.createChannelFragmentVolumes()
        break
      case 'LUNG':
        this.viewer.setWL(1)
        break
      case 'BONE':
        this.viewer.setWL(2)
        break
      case 'VENTRAL':
        this.viewer.setWL(3)
        break
      case 'MEDIA':
        this.viewer.setWL(4)
        break
      case 'MPR':
        this.setState({
          MPR: true,
        })
        this.viewer.changeMode(2)
        break
      case 'STMPR':
        this.setState({
          MPR: false,
        })
        this.viewer.changeMode(1)
        break
      case 'RC':
        this.viewer.resetAllView()
        break
      case 'HC':
        this.setState({
          displayCrosshairs: false,
        })
        this.viewer.toggleCrosshairs(false)
        break
      case 'SC':
        this.setState({
          displayCrosshairs: true,
        })
        this.viewer.toggleCrosshairs(true)
        break
      case 'BP':
        this.setState({
          painting: true,
        })
        this.viewer.beginPaint()
        break
      case 'DP':
        this.setState({
          erasing: false,
        })
        this.viewer.doPaint()
        break
      case 'DE':
        this.setState({
          erasing: true,
        })
        this.viewer.doErase()
        break
      case 'EP':
        this.setState({
          painting: false,
        })
        this.viewer.endPaint()
        break
      case 'CPR':
        this.setState({
          CPR: true,
        })
        this.viewer.changeMode(3)
        break
      case 'STCPR':
        this.setState({
          CPR: false,
        })
        this.viewer.changeMode(2)
        break
      case 'RA':
        this.viewer.pickAirway()
        // this.viewer.createAirwayVolumes();
        break
      case 'FS':
        this.viewer.finishPicking()
        break
      default:
        break
    }
  }
  addVolumeToRenderer() {
    const apis = this.apis
    apis.forEach((api, apiIndex) => {
      const renderer = api.genericRenderWindow.getRenderer()
      const volume = api.volumes[0]
      if (volume) {
        renderer.addVolume(volume)
      }
      this.timer = setTimeout(() => {
        api.resetCamera()
      }, 500)
    })
  }
  removeVolumeFromRenderer() {
    const apis = this.apis
    apis.forEach((api, apiIndex) => {
      const renderer = api.genericRenderWindow.getRenderer()
      const volume = api.volumes[0]
      if (volume) {
        renderer.removeVolume(volume)
      }
    })
  }
  clearVolumes() {
    this.setState({
      volumes: [],
    })
  }

  changeRadius(e) {
    const radius = e
    this.setState({
      paintRadius: radius,
    })
  }
  afterChangeRadius(e) {
    const radius = e
    this.viewer.changePaintRadius(radius)
  }
  changeThreshold(e) {
    const threshold = e
    this.setState({
      labelThreshold: threshold,
    })
  }
  afterChangeThreshold(e) {
    const threshold = e
    this.viewer.changeLableThreshold(threshold)
  }
  setPaintColor(e) {
    console.log(e)
    const color = [e.r, e.g, e.b]
    this.setState(
      {
        labelColor: color,
      },
      () => {
        this.viewer.changeLabelColor(color)
      }
    )
  }
  handleListClick(idx, e) {
    e.stopPropagation()
    if (e.target.nodeName !== 'INPUT') {
      const listsActive = this.state.listsActive
      listsActive[idx] = !listsActive[idx]
      // if (listsActive[idx]) {
      //   listsActive[idx] = false
      // } else {
      //   for (let cur_idx in listsActive) {
      //     if (listsActive[cur_idx]) {
      //       listsActive[cur_idx] = false
      //     }
      //   }
      //   listsActive[idx] = true
      // }

      this.setState({ listsActive })
    }
  }
  saveUrls(urls) {
    this.setState({
      urls,
    })
  }
  saveNodulesData(nodulesData) {
    console.log('nodulesData', nodulesData)
    const nodulesOpacities = new Array(nodulesData.length).fill(1.0)
    const nodulesActive = new Array(nodulesData.length).fill(false)
    const nodulesVisible = new Array(nodulesData.length).fill(true)
    const nodulesOpacityChangeable = new Array(nodulesData.length).fill(false)
    const nodulesController = {
      nodulesOpacities,
      nodulesActive,
      nodulesVisible,
      nodulesOpacityChangeable,
    }
    this.setState({
      nodulesData,
      nodulesController,
    })
  }
  saveLobesData(lobesData) {
    console.log('lobesData', lobesData)
    const lobesOpacities = new Array(lobesData.length).fill(1.0)
    const lobesActive = new Array(lobesData.length).fill(false)
    const lobesVisible = new Array(lobesData.length).fill(true)
    const lobesOpacityChangeable = new Array(lobesData.length).fill(false)
    const lobesController = {
      lobesOpacities,
      lobesActive,
      lobesVisible,
      lobesOpacityChangeable,
    }
    this.setState({
      lobesData,
      lobesController,
    })
  }
  setActive(classfication, index, urlIndex, e) {
    // if(e.target.nodeName !== 'INPUT')
    e.stopPropagation()
    if (classfication === 0) {
      const lobesController = this.state.lobesController
      lobesController.lobesActive[index] = !lobesController.lobesActive[index]
      this.setState({
        lobesController,
      })
    } else if (classfication === 2) {
      const nodulesController = this.state.nodulesController
      nodulesController.nodulesActive[index] = !nodulesController.nodulesActive[index]
      this.setState({
        nodulesController,
      })

      if (this.state.MPR && this.state.painting && nodulesController.nodulesActive[index]) {
        this.viewer.createNoduleMask(urlIndex)
      }
    }
  }
  setVisible(classfication, index, urlIndex, e) {
    e.stopPropagation()
    if (classfication === 0) {
      const lobesController = this.state.lobesController
      lobesController.lobesVisible[index] = !lobesController.lobesVisible[index]
      if (lobesController.lobesVisible[index]) {
        this.viewer.setSegmentOpacity(urlIndex, lobesController.lobesOpacities[index])
      } else {
        this.viewer.setSegmentOpacity(urlIndex, 0)
      }

      this.setState({
        lobesController,
      })
    } else if (classfication === 2) {
      const nodulesController = this.state.nodulesController
      nodulesController.nodulesVisible[index] = !nodulesController.nodulesVisible[index]
      if (nodulesController.nodulesVisible[index]) {
        this.viewer.setSegmentOpacity(urlIndex, nodulesController.nodulesOpacities[index])
      } else {
        this.viewer.setSegmentOpacity(urlIndex, 0)
      }

      this.setState({
        nodulesController,
      })
    }
  }
  setOpacityChangeable(classfication, index, e) {
    e.stopPropagation()
    if (classfication === 0) {
      const lobesController = this.state.lobesController
      lobesController.lobesOpacityChangeable[index] = !lobesController.lobesOpacityChangeable[index]
      this.setState({
        lobesController,
      })
    } else if (classfication === 2) {
      const nodulesController = this.state.nodulesController
      nodulesController.nodulesOpacityChangeable[index] = !nodulesController.nodulesOpacityChangeable[index]
      this.setState({
        nodulesController,
      })
    }
  }
  changeOpacity(classfication, index, urlIndex, e) {
    e.stopPropagation()
    if (classfication === 0) {
      const lobesController = this.state.lobesController
      lobesController.lobesOpacities[index] = e.target.value
      this.viewer.setSegmentOpacity(urlIndex, e.target.value)

      this.setState({
        lobesController,
      })
    } else if (classfication === 2) {
      const nodulesController = this.state.nodulesController
      nodulesController.nodulesOpacities[index] = e.target.value
      this.viewer.setSegmentOpacity(urlIndex, e.target.value)

      this.setState({
        nodulesController,
      })
    }
  }
  selectOpacity(e) {
    e.stopPropagation()
  }
  render() {
    const {
      lobesData,
      nodulesData,
      nodulesController,
      lobesController,
      opTop,
      opWidth,
      opHeight,
      MPR,
      CPR,
      opacity,
      viewerWidth,
      viewerHeight,
      displayCrosshairs,
      labelThreshold,
      paintRadius,
      painting,
      erasing,
    } = this.state
    const welcome = '欢迎您，' + localStorage.realname
    const nameList = ['肺叶', '支气管', '结节']

    let lobesInfo = <></>
    let lobesOp = <></>
    if (lobesData && lobesData.length > 0) {
      lobesInfo = lobesData.map((item, index) => {
        return (
          <Table.Row key={index}>
            <Table.Cell>{item.name}</Table.Cell>
            <Table.Cell>
              {item.volume}cm<sup>2</sup>
            </Table.Cell>
            <Table.Cell>{item.percent}%</Table.Cell>
          </Table.Row>
        )
      })
      lobesOp = lobesData.map((item, index) => {
        const inputRangeStyle = {
          backgroundSize: lobesController.lobesOpacities[index] * 100 + '%',
        }
        const segmentListSidebarContentStyle = {
          width: opWidth,
          height: opHeight,
        }
        return (
          <Sidebar.Pushable as={'div'} key={index} onClick={this.setActive.bind(this, 0, index, item.index)}>
            <div className="segment-list-sidebar-content" style={segmentListSidebarContentStyle}></div>
            <Sidebar animation="overlay" direction="right" visible={lobesController.lobesActive[index]}>
              <div className="segment-list-sidebar-visibility">
                <Button inverted color="blue" size="tiny" hidden={lobesController.lobesVisible[index]} onClick={this.setVisible.bind(this, 0, index, item.index)}>
                  显示
                </Button>
                <Button inverted color="blue" size="tiny" hidden={!lobesController.lobesVisible[index]} onClick={this.setVisible.bind(this, 0, index, item.index)}>
                  隐藏
                </Button>
              </div>
              <div className="segment-list-sidebar-opacity">
                <Button inverted color="blue" size="tiny" hidden={lobesController.lobesOpacityChangeable[index]} onClick={this.setOpacityChangeable.bind(this, 0, index)}>
                  透明度
                </Button>
                <Button inverted color="blue" size="tiny" hidden={!lobesController.lobesOpacityChangeable[index]} onClick={this.setOpacityChangeable.bind(this, 0, index)}>
                  关闭
                </Button>
                <div className="segment-list-content-tool-input" hidden={!lobesController.lobesActive[index] || !lobesController.lobesOpacityChangeable[index]} onClick={this.selectOpacity.bind(this)}>
                  {lobesController.lobesOpacities[index] * 100}%
                  <input style={inputRangeStyle} type="range" min={0} max={1} step={0.1} value={lobesController.lobesOpacities[index]} onChange={this.changeOpacity.bind(this, 0, index, item.index)} />
                </div>
              </div>
            </Sidebar>
          </Sidebar.Pushable>
        )
      })
    }

    let nodulesInfo = <></>
    let nodulesOp = <></>
    if (nodulesData && nodulesData.length > 0) {
      nodulesInfo = nodulesData.map((item, index) => {
        return (
          <Table.Row key={index}>
            <Table.Cell>{item.name}</Table.Cell>
            <Table.Cell>{item.position}</Table.Cell>
            <Table.Cell className={'segment-list-malignancy-' + item.malignancy}>{item.malignancyName}</Table.Cell>
          </Table.Row>
        )
      })
      nodulesOp = nodulesData.map((item, index) => {
        const inputRangeStyle = {
          backgroundSize: nodulesController.nodulesOpacities[index] * 100 + '%',
        }
        const segmentListSidebarContentStyle = {
          width: opWidth,
          height: opHeight,
        }
        return (
          <Sidebar.Pushable as={'div'} key={index} onClick={this.setActive.bind(this, 2, index, item.index)}>
            <div className="segment-list-sidebar-content" style={segmentListSidebarContentStyle}></div>
            <Sidebar animation="overlay" direction="right" visible={nodulesController.nodulesActive[index]}>
              <div className="segment-list-sidebar-visibility">
                <Button inverted color="blue" size="tiny" hidden={nodulesController.nodulesVisible[index]} onClick={this.setVisible.bind(this, 2, index, item.index)}>
                  显示
                </Button>
                <Button inverted color="blue" size="tiny" hidden={!nodulesController.nodulesVisible[index]} onClick={this.setVisible.bind(this, 2, index, item.index)}>
                  隐藏
                </Button>
              </div>
              <div className="segment-list-sidebar-opacity">
                <Button inverted color="blue" size="tiny" hidden={nodulesController.nodulesOpacityChangeable[index]} onClick={this.setOpacityChangeable.bind(this, 2, index)}>
                  透明度
                </Button>
                <Button inverted color="blue" size="tiny" hidden={!nodulesController.nodulesOpacityChangeable[index]} onClick={this.setOpacityChangeable.bind(this, 2, index)}>
                  关闭
                </Button>
                <div
                  className="segment-list-content-tool-input"
                  hidden={!nodulesController.nodulesActive[index] || !nodulesController.nodulesOpacityChangeable[index]}
                  onClick={this.selectOpacity.bind(this)}>
                  {nodulesController.nodulesOpacities[index] * 100}%
                  <input
                    style={inputRangeStyle}
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={nodulesController.nodulesOpacities[index]}
                    onChange={this.changeOpacity.bind(this, 2, index, item.index)}
                  />
                </div>
              </div>
            </Sidebar>
          </Sidebar.Pushable>
        )
      })
    }
    const segmentListOperationStyles = {
      top: opTop,
    }
    const panes = [
      {
        menuItem: '肺叶',
        render: () => {
          return (
            <div className="segment-list-block">
              <Table celled inverted>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>肺叶</Table.HeaderCell>
                    <Table.HeaderCell>体积</Table.HeaderCell>
                    <Table.HeaderCell>占比</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>{lobesInfo}</Table.Body>
              </Table>
              <div className="segment-list-operation" style={segmentListOperationStyles}>
                {lobesOp}
              </div>
            </div>
          )
        },
      },
      {
        menuItem: '肺结节',
        render: () => {
          return (
            <div className="segment-list-block">
              <Table celled selectable inverted>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>肺结节</Table.HeaderCell>
                    <Table.HeaderCell>位置</Table.HeaderCell>
                    <Table.HeaderCell>危险度</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>{nodulesInfo}</Table.Body>
              </Table>
              <div className="segment-list-operation" style={segmentListOperationStyles}>
                {nodulesOp}
              </div>
            </div>
          )
        },
      },
    ]

    // let segments_list = [];
    // for (let cur_idx in segments) {
    //   segments_list.push(segments[cur_idx]);
    // }
    // console.log('render segments:', segments)
    return (
      <DndProvider backend={HTML5Backend}>
        <div id="viewer">
          <Menu className="corner-header">
            <Menu.Item>
              <Image src={src1} avatar size="mini" />
              <a id="sys-name" href="/searchCase">
                DeepLN肺结节全周期
                <br />
                管理数据平台
              </a>
            </Menu.Item>
            <Menu.Item className="funcolumn">
              <Button.Group>
                {/* <Button icon className='funcBtn' onClick={this.handleFuncButton.bind(this, "TEST")} title="放大"><Icon name='search plus' size='large'/></Button> */}
                <Button icon className="funcBtn" hidden={MPR} onClick={this.handleFuncButton.bind(this, 'MPR')} title="MPR">
                  <Icon name="th large" size="large" />
                </Button>
                <Button icon className="funcBtn" hidden={!MPR} onClick={this.handleFuncButton.bind(this, 'STMPR')} title="取消MPR">
                  <Icon name="window close outline" size="large" />
                </Button>
                <Button icon className="funcBtn" onClick={this.handleFuncButton.bind(this, 'FRG')} title="分块" description="fragment" hidden={true}>
                  <Icon name="plus" size="large" />
                </Button>
              </Button.Group>
            </Menu.Item>
            <span id="line-left" hidden={!MPR}></span>
            <Menu.Item className="hucolumn" hidden={!MPR}>
              <Button.Group>
                <Button className="hubtn" onClick={this.handleFuncButton.bind(this, 'LUNG')} title="肺窗" content="肺窗"></Button>
                <Button className="hubtn" onClick={this.handleFuncButton.bind(this, 'BONE')} title="骨窗" content="骨窗"></Button>
                <Button className="hubtn" onClick={this.handleFuncButton.bind(this, 'VENTRAL')} title="腹窗" content="腹窗"></Button>
                <Button className="hubtn" onClick={this.handleFuncButton.bind(this, 'MEDIA')} title="纵隔窗" content="纵隔窗"></Button>
              </Button.Group>
            </Menu.Item>
            <span id="line-left" hidden={!MPR}></span>
            <Menu.Item className="funcolumn" hidden={!MPR}>
              <Button.Group>
                <Button icon className="funcBtn" onClick={this.handleFuncButton.bind(this, 'RC')} title="重置相机" description="reset camera">
                  <Icon name="redo" size="large" />
                </Button>
                {/* <Button icon className='funcBtn' active={crosshairsTool} onClick={this.handleFuncButton.bind(this, "TC")} title="十字线" description="toggle crosshairs"><Icon name='plus' size='large'/></Button> */}
                <Button icon className="funcBtn" hidden={!displayCrosshairs} onClick={this.handleFuncButton.bind(this, 'HC')} title="隐藏十字线" description="hidden crosshairs">
                  <Icon className="icon-custom-HC" size="large" />
                </Button>
                <Button icon className="funcBtn" hidden={displayCrosshairs} onClick={this.handleFuncButton.bind(this, 'SC')} title="显示十字线" description="show crosshairs">
                  <Icon className="icon-custom-SC" size="large" />
                </Button>
              </Button.Group>
            </Menu.Item>
            <span id="line-left" hidden={!MPR}></span>
            <Menu.Item className="funcolumn" hidden={!MPR}>
              <Button.Group>
                <Button icon className="funcBtn" hidden={painting} onClick={this.handleFuncButton.bind(this, 'BP')} title="开始勾画" description="begin painting">
                  <Icon name="paint brush" size="large" />
                </Button>
                <Button icon className="funcBtn" hidden={!painting} active={!erasing} onClick={this.handleFuncButton.bind(this, 'DP')} title="勾画" description="do painting">
                  <Icon name="paint brush" size="large" />
                </Button>
                <Button icon className="funcBtn" hidden={!painting} active={erasing} onClick={this.handleFuncButton.bind(this, 'DE')} title="擦除" description="do erasing">
                  <Icon name="eraser" size="large" />
                </Button>
                <Popup
                  on="click"
                  trigger={
                    <Button icon className="funcBtn" hidden={!painting}>
                      <Icon name="dot circle" size="large" />
                    </Button>
                  }
                  position="bottom center"
                  style={{
                    backgroundColor: '#021c38',
                    borderColor: '#021c38',
                    width: '200px',
                    padding: '2px 4px 2px 4px',
                  }}>
                  <div>
                    <div className="segment-widget-radius-container">
                      画笔半径:
                      <Slider
                        className="segment-widget-radius-slider"
                        value={paintRadius}
                        min={1}
                        step={1}
                        max={10}
                        tooltipVisible={false}
                        onChange={this.changeRadius.bind(this)}
                        onAfterChange={this.afterChangeRadius.bind(this)}
                      />
                    </div>
                    <div className="segment-label-threshold-container">
                      标记阈值:
                      <Slider
                        className="segment-label-threshold-slider"
                        value={labelThreshold}
                        min={100}
                        step={100}
                        max={1000}
                        tooltipVisible={false}
                        onChange={this.changeThreshold.bind(this)}
                        onAfterChange={this.afterChangeThreshold.bind(this)}
                      />
                    </div>
                  </div>
                </Popup>
                <Popup
                  on="click"
                  trigger={
                    <Button icon className="funcBtn" hidden={!painting}>
                      <Icon name="eye dropper" size="large" />
                    </Button>
                  }
                  position="bottom center"
                  style={{
                    backgroundColor: '#021c38',
                    borderColor: '#021c38',
                    width: '150px',
                    padding: '2px 4px 2px 4px',
                  }}>
                  <div className="segment-label-color-selector">
                    颜色选择器：
                    <InputColor initialValue="#FF0000" onChange={this.setPaintColor.bind(this)} placement="right" />
                  </div>
                </Popup>
                <Button icon className="funcBtn" hidden={!painting} onClick={this.handleFuncButton.bind(this, 'EP')} title="停止勾画" description="end painting">
                  <Icon name="window close outline" size="large" />
                </Button>
              </Button.Group>
            </Menu.Item>
            <span id="line-left" hidden={!MPR}></span>
            <Menu.Item className="funcolumn" hidden={!MPR}>
              <Button.Group>
                <Button icon className="funcBtn" onClick={this.handleFuncButton.bind(this, 'CPR')} title="CPR" hidden={CPR}>
                  <Icon className="icon-custom-CPR" size="large" />
                </Button>
                <Button icon className="funcBtn" onClick={this.handleFuncButton.bind(this, 'STCPR')} title="取消CPR" hidden={!CPR}>
                  <Icon name="window close outline" size="large" />
                </Button>
                <Button icon className="funcBtn" onClick={this.handleFuncButton.bind(this, 'RA')} title="重建气道" description="reconstruct airway">
                  <Icon className="icon-custom-RA" size="large" />
                </Button>
                {/* <Button icon className="funcBtn" onClick={this.handleFuncButton.bind(this, 'FS')} title="选择完成" description="finish selection">
                  <Icon className="icon-custom-FS" size="large" />
                </Button> */}
              </Button.Group>
            </Menu.Item>
            <span id="line-left"></span>
            <Menu.Item className="funcolumn">
              <Button.Group>
                <Button className="funcBtn" onClick={this.goBack.bind(this)}>
                  2D
                </Button>
              </Button.Group>
            </Menu.Item>
            <Menu.Item position="right">
              <Dropdown text={welcome}>
                <Dropdown.Menu id="logout-menu">
                  <Dropdown.Item icon="home" text="我的主页" onClick={this.toHomepage} />
                  <Dropdown.Item icon="write" text="留言" />
                  <Dropdown.Item icon="log out" text="注销" onClick={this.handleLogout} />
                </Dropdown.Menu>
              </Dropdown>
            </Menu.Item>
          </Menu>
          <Grid celled className="corner-contnt">
            <Grid.Row className="corner-row" columns={3}>
              <Grid.Column width={2}>
                <StudyBrowserList handleClickScreen={this.handleClickScreen.bind(this)} caseId={this.state.caseId} />
              </Grid.Column>
              {/* 中间部分 */}
              <Grid.Column width={11}>
                <VTKViewer
                  onRef={(ref) => {
                    this.viewer = ref
                  }}
                  saveUrls={this.saveUrls.bind(this)}
                  saveLobesData={this.saveLobesData.bind(this)}
                  saveNodulesData={this.saveNodulesData.bind(this)}
                />
              </Grid.Column>
              {/* 右边部分 */}
              <Grid.Column width={3}>
                <Tab panes={panes} />
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </div>
      </DndProvider>
    )
  }
}

export default ViewerPanel
