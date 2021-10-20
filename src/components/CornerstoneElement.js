import React, { Component } from 'react'
// import {CineDialog} from 'react-viewerbase'
// import { WrappedStudyBrowser } from '../components/wrappedStudyBrowser'
import ReactHtmlParser from 'react-html-parser'
import dicomParser from 'dicom-parser'
// import DndProcider from 'react-dnd'
// import {HTML5Backend} from 'react-dnd-html5-backend'
// import { DragDropContextProvider } from 'react-dnd'
// import { HTML5Backend } from 'react-dnd-html5-backend'
import * as cornerstone from 'cornerstone-core'
import * as cornerstoneMath from 'cornerstone-math'
import * as cornerstoneTools from 'cornerstone-tools'
import Hammer from 'hammerjs'
import * as cornerstoneWadoImageLoader from 'cornerstone-wado-image-loader'
import { withRouter } from 'react-router-dom'
import { Grid, Icon, Button, Accordion, Modal, Dropdown, Tab, Image, Menu, Label, Header, List, Popup, Table, Sidebar, Loader, Divider, Form, Card, Segment } from 'semantic-ui-react'
import { CloseCircleOutlined, CheckCircleOutlined, ConsoleSqlOutlined, SyncOutlined } from '@ant-design/icons'
import qs from 'qs'
import axios from 'axios'
import { Slider, Select, Space, Checkbox, Tabs, InputNumber } from 'antd'
import * as echarts from 'echarts'
import html2pdf from 'html2pdf.js'
import copy from 'copy-to-clipboard'
// import { Slider, RangeSlider } from 'rsuite'
import MessagePanel from '../panels/MessagePanel'
import src1 from '../images/scu-logo.jpg'
import _ from 'lodash'
import md5 from 'js-md5'
import InputColor from 'react-input-color'
import { vec3, vec4, mat4 } from 'gl-matrix'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'
import { connect } from 'react-redux'
import { getConfigJson, getImageIdsByCaseId, getNodulesByCaseId } from '../actions'

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor'
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper'
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction'
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction'
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray'
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData'
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource'
import vtkImageReslice from 'vtk.js/Sources/Imaging/Core/ImageReslice'
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume'
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper'
import vtkLineSource from 'vtk.js/Sources/Filters/Sources/LineSource'
import vtkXMLPolyDataReader from 'vtk.js/Sources/IO/XML/XMLPolyDataReader'
import HttpDataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper'

import View2D from '../vtk/VTKViewport/View2D'
import getImageData from '../vtk/lib/getImageData'
import loadImageData from '../vtk/lib/loadImageData'
import vtkSVGRotatableCrosshairsWidget from '../vtk/VTKViewport/vtkSVGRotatableCrosshairsWidget'
import vtkInteractorStyleRotatableMPRCrosshairs from '../vtk/VTKViewport/vtkInteractorStyleRotatableMPRCrosshairs'
import vtkInteractorStyleMPRWindowLevel from '../vtk/VTKViewport/vtkInteractorStyleMPRWindowLevel'
import VTK2DViewer from '../components/VTK2DViewer'
import VTK3DViewer from '../components/VTK3DViewer'
import { frenet } from '../lib/frenet'
import { loadAndCacheImagePlus } from '../lib/cornerstoneImageRequest'
import { executeTask } from '../lib/taskHelper'
// import centerLine from '../center_line.json'
// import oneAirway from '../one_airway.json'

import '../css/cornerstone.css'
import '../css/segview.css'
import '../css/studyBrowser.css'
//import  'echarts/lib/chart/bar';
//import 'echarts/lib/component/tooltip';
//import 'echarts/lib/component/title';
//import 'echarts/lib/component/toolbox'
//import { Content } from "antd/lib/layout/layout"
// import { WrappedStudyBrowser } from "./wrappedStudyBrowser"

cornerstoneTools.external.cornerstone = cornerstone
cornerstoneTools.external.cornerstoneMath = cornerstoneMath
// cornerstoneWebImageLoader.external.cornerstone = cornerstone
cornerstoneWadoImageLoader.external.cornerstone = cornerstone
cornerstoneWadoImageLoader.external.dicomParser = dicomParser
cornerstoneTools.external.Hammer = Hammer
cornerstoneTools.init()
cornerstoneTools.toolColors.setActiveColor('rgb(0, 255, 0)')
cornerstoneTools.toolColors.setToolColor('rgb(255, 255, 0)')

const globalImageIdSpecificToolStateManager = cornerstoneTools.newImageIdSpecificToolStateManager()
const wwwc = cornerstoneTools.WwwcTool
const pan = cornerstoneTools.PanTool
const zoomMouseWheel = cornerstoneTools.ZoomMouseWheelTool
const zoomWheel = cornerstoneTools.ZoomTool
const bidirectional = cornerstoneTools.BidirectionalTool
const ellipticalRoi = cornerstoneTools.EllipticalRoiTool
const LengthTool = cornerstoneTools.LengthTool
const ZoomTouchPinchTool = cornerstoneTools.ZoomTouchPinchTool
const eraser = cornerstoneTools.EraserTool
const { TabPane } = Tabs
let allROIToolData = {}
let toolROITypes = ['EllipticalRoi', 'Bidirectional']
const cacheSize = 5
let playTimer = undefined
let flipTimer = undefined
let leftSlideTimer = undefined
let imageLoadTimer = undefined

const dictList = {
  lung: {
    class: 3,
    label: 'lung',
    name: '肺',
    color: { c1: 197, c2: 165, c3: 145 },
  },
  airway: {
    class: 1,
    label: 'airway',
    name: '支气管',
    color: { c1: 182, c2: 228, c3: 255 },
  },
  nodule: {
    class: 2,
    label: 'nodule',
    name: '结节',
    color: { c1: 178, c2: 34, c3: 34 },
  },
  lobe1: {
    class: 0,
    label: 'lobe_1',
    name: '右肺中叶',
    color: { c1: 128, c2: 174, c3: 128 },
  },
  lobe2: {
    class: 0,
    label: 'lobe_2',
    name: '右肺上叶',
    color: { c1: 241, c2: 214, c3: 145 },
  },
  lobe3: {
    class: 0,
    label: 'lobe_3',
    name: '右肺下叶',
    color: { c1: 177, c2: 122, c3: 101 },
  },
  lobe4: {
    class: 0,
    label: 'lobe_4',
    name: '左肺上叶',
    color: { c1: 111, c2: 184, c3: 210 },
  },
  lobe5: {
    class: 0,
    label: 'lobe_5',
    name: '左肺下叶',
    color: { c1: 216, c2: 101, c3: 79 },
  },
  vessel: {
    class: 4,
    label: 'vessel',
    name: '血管',
    color: { c1: 200, c2: 100, c3: 50 },
  },
}
const lobeName = {
  1: '右肺中叶',
  2: '右肺上叶',
  3: '右肺下叶',
  4: '左肺上叶',
  5: '左肺下叶',
}
const noduleMalignancyName = {
  0: '待定',
  1: '低危',
  2: '中危',
  3: '高危',
}
const immersiveStyle = {
  width: '1280px',
  height: '1280px',
  position: 'relative',
  // display: "inline",
  color: 'white',
}
const nodulePlaces = {
  0: '选择位置',
  1: '右肺中叶',
  2: '右肺上叶',
  3: '右肺下叶',
  4: '左肺上叶',
  5: '左肺下叶',
}
const noduleSegments = {
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
let bottomLeftStyle = {
  bottom: '5px',
  left: '-95px',
  position: 'absolute',
  color: 'white',
}

let bottomRightStyle = {
  bottom: '5px',
  right: '-95px',
  position: 'absolute',
  color: 'white',
}

let topLeftStyle = {
  top: '5px',
  // left: "-95px", // 5px
  position: 'absolute',
  color: 'white',
}

let topRightStyle = {
  top: '5px',
  right: '5px', //5px
  position: 'absolute',
  color: 'white',
}

let modalBtnStyle = {
  width: '200px',
  display: 'block',
  // marginTop:'10px',
  marginBottom: '20px',
  marginLeft: 'auto',
  marginRight: 'auto',
}

let users = []

const selectStyle = {
  background: 'none',
  border: 'none',
  // 'fontFamily': 'SimHei',
  WebkitAppearance: 'none',
  // 'fontSize':'medium',
  MozAppearance: 'none',
  apperance: 'none',
}

const lowRiskStyle = {
  background: 'none',
  border: 'none',
  // 'fontFamily': 'SimHei',
  WebkitAppearance: 'none',
  fontSize: 'small',
  MozAppearance: 'none',
  apperance: 'none',
  color: 'green',
}

const highRiskStyle = {
  background: 'none',
  border: 'none',
  // 'fontFamily': 'SimHei',
  WebkitAppearance: 'none',
  fontSize: 'small',
  MozAppearance: 'none',
  apperance: 'none',
  color: '#CC3300',
}
const middleRiskStyle = {
  background: 'none',
  border: 'none',
  // 'fontFamily': 'SimHei',
  WebkitAppearance: 'none',
  fontSize: 'small',
  MozAppearance: 'none',
  apperance: 'none',
  color: '#fcaf17',
}

const toolstrigger = (
  <span>
    <Icon name="user" />
  </span>
)

const { Option } = Select

let buttonflag = 0

class CornerstoneElement extends Component {
  constructor(props) {
    super(props)
    this.state = {
      // displayPanel
      caseId: window.location.pathname.split('/case/')[1].split('/')[0],
      username: localStorage.getItem('username'),
      modelName: window.location.pathname.split('/')[3],

      //cornerstoneElement
      initialized: false,
      viewport: cornerstone.getDefaultViewport(null, undefined),
      // imageIds: props.stack.imageIds === "" ? [] : props.stack.imageIds,
      imageIds: [],
      boxes: [],
      currentIdx: 0, //当前所在切片号
      autoRefresh: false,
      // boxes: props.stack.boxes === "" ? [] : props.stack.boxes,
      clicked: false,
      clickedArea: {},
      tmpCoord: {},
      tmpBox: {},
      showNodules: true,
      immersive: false,
      readonly: true,
      listsActiveIndex: -1, //右方list活动item
      dropDownOpen: -1,

      modelResults: '<p style="color:white;">暂无结果</p>',
      annoResults: '<p style="color:white;">暂无结果</p>',
      reviewResults: '<p style="color:white;">暂无结果</p>',
      modalOpenNew: false,
      modalOpenCur: false,
      draftStatus: {},
      okayForReview: false,
      random: Math.random(),
      wwDefine: 500,
      wcDefine: 500,
      dicomTag: null,
      showInfo: true,
      newAnno: true,
      isbidirectionnal: false,
      measureStateList: [],
      maskStateList: [],
      toolState: '',
      leftButtonTools: 1, //0-标注，1-切片切换，2-wwwc,3-bidirection,4-length
      mouseCurPos: {},
      mouseClickPos: {},
      mousePrePos: {},
      leftBtnSpeed: 0,
      prePosition: 0,
      curPosition: 0,
      doubleClick: false,
      menuTools: '',
      isPlaying: false,
      windowWidth: document.body.clientWidth,
      windowHeight: document.body.clientHeight,
      verticalMode: false,
      slideSpan: 0,
      preListActiveIdx: -1,
      currentImage: null,
      lengthBox: [],
      imageCaching: false,
      canvasWidth: 0,
      canvasHeight: 0,
      //studybrowserList
      dateSeries: [],
      dataValidContnt: [],

      //MiniReport
      patientName: '',
      patientBirth: '',
      patientSex: '',
      patientId: '',
      date: '',
      age: 0,
      temp: 0,
      templateText: '',
      dealchoose: '中华共识',
      reportType: '影像所见',
      nodules: [],

      menuButtonsWidth: 1540,
      menuScrollable: false,
      menuTotalPages: 1,
      menuNowPage: 1,
      menuTransform: 0,
      show3DVisualization: false,
      studyListShowed: false,
      /*显示变量*/
      windowWidth: window.screen.width,
      windowHeight: window.screen.height,
      bottomRowHeight: 0,
      viewerWidth: 1200,
      viewerHeight: 800,

      /*3d数据*/
      urls: [],
      nodulesData: null,
      lobesData: null,
      tubularData: null,
      segments: [],
      pointActors: [],

      /*重建数据*/
      // imageIds: [],
      vtkImageData: null,
      volumes: [],
      labelDataArray: [],
      labelData: {},
      labelMapInputData: null,
      airwayVolumes: [],
      points: [],
      centerLinePoints: [],
      airwayCenterVolumes: [],
      fragmentVolumes: [],

      /*辅助数据*/
      lobesLength: 0,
      airwayLength: 0,
      nodulesLength: 0,
      vesselLength: 0,
      spacing: [],
      dimensions: [],
      originXBorder: 1,
      originYBorder: 1,
      originZBorder: 1,
      segRange: {
        xMax: -Infinity,
        yMax: -Infinity,
        zMax: -Infinity,
        xMin: Infinity,
        yMin: Infinity,
        zMin: Infinity,
      },

      /*参数变量*/
      voi: { windowWidth: 1600, windowCenter: -600 },
      origin: [0, 0, 0],
      labelThreshold: 300,
      labelColor: [255, 0, 0],
      paintRadius: 5,

      /*控制变量*/
      mode: 1,
      selectedNum: 0,
      isCtrl: false,
      MPR: false,
      CPR: false,
      nodulesController: null,
      lobesController: null,
      tubularController: null,
      airwayPicking: false,
      displayCrosshairs: false,
      editing: false,
      painting: false,
      erasing: false,
      show: false,

      /*列表控制变量*/
      segVisible: [],
      listsActive: [],
      listsOpacityChangeable: [],

      /*加载变量*/
      volumesLoading: true,
      percent: [],
      listLoading: [],
    }
    this.config = JSON.parse(localStorage.getItem('config'))
    this.nextPath = this.nextPath.bind(this)
    this.onImageRendered = this.onImageRendered.bind(this)
    this.onNewImage = this.onNewImage.bind(this)

    this.onRightClick = this.onRightClick.bind(this)

    this.onMouseDown = this.onMouseDown.bind(this)
    this.onMouseMove = this.onMouseMove.bind(this)
    this.onMouseUp = this.onMouseUp.bind(this)
    this.onMouseOut = this.onMouseOut.bind(this)

    this.drawBoxes = this.drawBoxes.bind(this)
    this.handleRangeChange = this.handleRangeChange.bind(this)
    this.refreshImage = this.refreshImage.bind(this)

    this.toPulmonary = this.toPulmonary.bind(this)
    this.toMedia = this.toMedia.bind(this)
    this.toBoneWindow = this.toBoneWindow.bind(this)
    this.toVentralWindow = this.toVentralWindow.bind(this)
    this.reset = this.reset.bind(this)

    this.findCurrentArea = this.findCurrentArea.bind(this)
    this.findMeasureArea = this.findMeasureArea.bind(this)

    this.onKeydown = this.onKeydown.bind(this)

    // this.toPage = this
    //     .toPage
    //     .bind(this)
    this.highlightNodule = this.highlightNodule.bind(this)
    this.dehighlightNodule = this.dehighlightNodule.bind(this)
    this.toCurrentModel = this.toCurrentModel.bind(this)
    this.toNewModel = this.toNewModel.bind(this)
    this.toHidebox = this.toHidebox.bind(this)
    // this.handleClick = this
    //     .handleClick
    //     .bind(this)
    this.temporaryStorage = this.temporaryStorage.bind(this)
    this.submit = this.submit.bind(this)
    this.deSubmit = this.deSubmit.bind(this)
    this.clearthenNew = this.clearthenNew.bind(this)
    this.clearthenFork = this.clearthenFork.bind(this)
    this.createBox = this.createBox.bind(this)
    this.delNodule = this.delNodule.bind(this)
    this.playAnimation = this.playAnimation.bind(this)
    this.pauseAnimation = this.pauseAnimation.bind(this)
    this.Animation = this.Animation.bind(this)
    this.closeModalNew = this.closeModalNew.bind(this)
    this.closeModalCur = this.closeModalCur.bind(this)
    this.toMyAnno = this.toMyAnno.bind(this)
    this.onSelectMal = this.onSelectMal.bind(this)
    this.onSelectPlace = this.onSelectPlace.bind(this)
    this.saveToDB = this.saveToDB.bind(this)
    this.checkHash = this.checkHash.bind(this)
    this.ZoomIn = this.ZoomIn.bind(this)
    this.ZoomOut = this.ZoomOut.bind(this)
    this.imagesFilp = this.imagesFilp.bind(this)
    this.visualize = this.visualize.bind(this)
    this.handleLogout = this.handleLogout.bind(this)
    this.handleLogin = this.handleLogin.bind(this)
    this.toHideInfo = this.toHideInfo.bind(this)
    this.disableAllTools = this.disableAllTools.bind(this)
    this.bidirectionalMeasure = this.bidirectionalMeasure.bind(this)
    this.lengthMeasure = this.lengthMeasure.bind(this)
    this.featureAnalysis = this.featureAnalysis.bind(this)
    this.eraseLabel = this.eraseLabel.bind(this)
    this.startAnnos = this.startAnnos.bind(this)
    this.saveTest = this.saveTest.bind(this)
    this.slide = this.slide.bind(this)
    this.wwwcCustom = this.wwwcCustom.bind(this)
    this.onWheel = this.onWheel.bind(this)
    this.wheelHandle = this.wheelHandle.bind(this)
    this.onMouseOver = this.onMouseOver.bind(this)
    this.cacheImage = this.cacheImage.bind(this)
    this.cache = this.cache.bind(this)
    this.keyDownListSwitch = this.keyDownListSwitch.bind(this)
    this.drawBidirection = this.drawBidirection.bind(this)
    this.segmentsIntr = this.segmentsIntr.bind(this)
    this.invertHandles = this.invertHandles.bind(this)
    this.pixeldataSort = this.pixeldataSort.bind(this)
    this.closeVisualContent = this.closeVisualContent.bind(this)
    // this.drawTmpBox = this.drawTmpBox.bind(this)
    this.toHideMeasures = this.toHideMeasures.bind(this)
    this.toHideMask = this.toHideMask.bind(this)
    this.eraseMeasures = this.eraseMeasures.bind(this)
    // this.drawTmpBox = this.drawTmpBox.bind(this)
    this.noduleHist = this.noduleHist.bind(this)
    this.drawLength = this.drawLength.bind(this)
    this.createLength = this.createLength.bind(this)
    // this.showMask = this
    //     .showMask
    //     .bind(this)

    // handleClick = (e, titleProps) => {
    //     const {index} = titleProps
    //     const {activeIndex} = this.state
    //     const newIndex = activeIndex === index
    //         ? -1
    //         : index

    //DisplayPanel
    this.loadDisplay = this.loadDisplay.bind(this)
    this.updateDisplay = this.updateDisplay.bind(this)
    //StudyBrowser
    this.loadStudyBrowser = this.loadStudyBrowser.bind(this)
    this.updateStudyBrowser = this.updateStudyBrowser.bind(this)
    //MiniReport
    this.loadReport = this.loadReport.bind(this)
    this.updateReport = this.updateReport.bind(this)

    this.showImages = this.showImages.bind(this)
    this.exportPDF = this.exportPDF.bind(this)
    this.dealChoose = this.dealChoose.bind(this)
    this.handleTextareaChange = this.handleTextareaChange.bind(this)
    this.handleCopyClick = this.handleCopyClick.bind(this)
  }

  handleSliderChange = (e, { name, value }) => {
    //窗宽
    this.setState({ [name]: value })
    let viewport = cornerstone.getViewport(this.element)
    viewport.voi.windowWidth = value
    cornerstone.setViewport(this.element, viewport)
    this.setState({ viewport })
    console.log('to media', viewport)
  }

  //antv
  // visualize(hist_data,idx){
  //     const visId = 'visual-' + idx
  //     document.getElementById(visId).innerHTML=''
  //     let bins=hist_data.bins
  //     let ns=hist_data.n
  //     console.log('bins',bins)
  //     console.log('ns',ns)
  //     var histogram = []
  //     var line=[]
  //     for (var i = 0; i < bins.length-1; i++) {
  //         var obj = {}

  //         obj.value = [bins[i],bins[i+1]]
  //         obj.count=ns[i]
  //         histogram.push(obj)
  //     }
  //     console.log('histogram',histogram)
  //     const ds = new DataSet()
  //     const dv = ds.createView().source(histogram)
  //     let chart = new Chart({
  //         container: visId,
  //         forceFit:true,
  //         height: 300,
  //         width:500,
  //     });
  //     let view1=chart.view()
  //     view1.source(dv, {
  //         value: {
  //         minLimit: bins[0]-50,
  //         maxLimit:bins[bins.length-1]+50,
  //         },
  //     })
  //     view1.interval().position('value*count').color('#00FFFF')
  //     chart.render()
  // }

  //echarts
  visualize(hist_data, idx) {
    const visId = 'visual-' + idx
    const btnId = 'closeButton-' + idx
    // document.getElementById(visId).innerHTML=''
    console.log('visualize', idx)
    var dom = document.getElementById(visId)
    document.getElementById('closeVisualContent').style.display = ''
    dom.style.display = ''
    dom.style.height = (200 * this.state.windowHeight) / 1000 + 'px'
    if (this.state.windowWidth > this.state.windowHeight) {
      dom.style.width = (870 * this.state.windowWidth) / 1800 + 'px'
    } else {
      dom.style.width = (1380 * this.state.windowWidth) / 1800 + 'px'
    }
    let bins = hist_data.bins
    let ns = hist_data.n
    if (echarts.getInstanceByDom(dom)) {
      echarts.dispose(dom)
    }
    var myChart = echarts.init(dom)
    var minValue = bins[0] - 50
    var maxValue = bins[bins.length - 1] + 50
    console.log(bins, bins[0] - 50, bins[bins.length - 1] + 50)
    var histogram = []
    var line = []
    for (var i = 0; i < bins.length - 1; i++) {
      var obj = {}

      obj.value = [bins[i], bins[i + 1]]
      obj.count = ns[i]
      histogram.push(obj)
    }
    myChart.setOption({
      color: ['#00FFFF'],
      lazyUpdate: false,
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          // 坐标轴指示器，坐标轴触发有效
          type: 'shadow', // 默认为直线，可选为：'line' | 'shadow'
        },
      },
      toolbox: {
        feature: {
          saveAsImage: {},
        },
      },
      grid: {
        // left: '15%',
        // right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true,
      },
      xAxis: [
        {
          type: 'category',
          scale: 'true',
          data: bins,
          // min: minValue,
          // max: maxValue,
          axisTick: {
            alignWithLabel: true,
          },
          axisLabel: {
            color: 'rgb(191,192,195)',
          },
        },
      ],
      yAxis: [
        {
          type: 'value',

          axisLabel: {
            color: 'rgb(191,192,195)',
          },
          minInterval: 1,
        },
      ],
      series: [
        {
          name: 'count',
          type: 'bar',
          barWidth: '60%',
          data: ns,
        },
      ],
    })
  }

  wcSlider = (e, { name, value }) => {
    //窗位
    this.setState({ [name]: value })
    let viewport = cornerstone.getViewport(this.element)
    viewport.voi.windowCenter = value
    cornerstone.setViewport(this.element, viewport)
    this.setState({ viewport })
  }
  handleDropdownClick = (currentIdx, index, e) => {
    console.log('dropdown', e.target, currentIdx, index)
    if (index === this.state.listsActiveIndex) {
      this.setState({
        autoRefresh: true,
        doubleClick: false,
        dropDownOpen: index,
      })
    } else {
      const { listsActiveIndex } = this.state
      const newIndex = listsActiveIndex === index ? -1 : index

      this.setState({
        listsActiveIndex: newIndex,
        currentIdx: currentIdx - 1,
        autoRefresh: true,
        doubleClick: false,
        dropDownOpen: -1,
      })
    }
  }

  // handleListClick = (currentIdx, index, e) => {
  //   //点击list-item
  //   const id = e.target.id;
  //   if (id !== "del-" + id.split("-")[1]) {
  //     const { listsActiveIndex } = this.state;
  //     const newIndex = listsActiveIndex === index ? -1 : index;

  //     this.setState({
  //       listsActiveIndex: newIndex,
  //       currentIdx: currentIdx - 1,
  //       autoRefresh: true,
  //       doubleClick: false,
  //       dropDownOpen: -1,
  //     });
  //   }
  // };

  handleListClick = (currentIdx, index, e) => {
    const id = e.target.id
    console.log('dropdown', this.state.listsActiveIndex, index, currentIdx)
    if (index === this.state.listsActiveIndex) {
      this.setState({
        currentIdx: currentIdx - 1,
        autoRefresh: true,
        doubleClick: false,
        dropDownOpen: index,
      })
    } else {
      if (this.state.show3DVisualization) {
        if (this.state.MPR && this.state.painting) {
          // this.createNoduleMask(index)
        }
      }
      if (id !== 'del-' + id.split('-')[1]) {
        const { listsActiveIndex } = this.state
        const newIndex = listsActiveIndex === index ? -1 : index

        this.setState({
          listsActiveIndex: newIndex,
          currentIdx: currentIdx - 1,
          autoRefresh: true,
          doubleClick: false,
          dropDownOpen: -1,
        })
      }
    }
  }

  keyDownListSwitch(ActiveIdx) {
    // const boxes = this.state.selectBoxes
    const boxes = this.state.boxes
    let currentIdx = parseInt(boxes[ActiveIdx].nodule_no)
    let sliceIdx = boxes[ActiveIdx].slice_idx
    if (this.state.preListActiveIdx !== -1) {
      currentIdx = parseInt(boxes[this.state.preListActiveIdx].nodule_no)
      sliceIdx = boxes[this.state.preListActiveIdx].slice_idx
    }
    console.log('cur', currentIdx, sliceIdx)
    this.setState({
      listsActiveIndex: currentIdx,
      currentIdx: sliceIdx,
      autoRefresh: true,
      doubleClick: false,
      preListActiveIdx: -1,
    })
  }

  playAnimation() {
    //coffee button
    this.setState(({ isPlaying }) => ({
      isPlaying: !isPlaying,
    }))
    playTimer = setInterval(() => this.Animation(), 1)
  }

  pauseAnimation() {
    this.setState(({ isPlaying }) => ({
      isPlaying: !isPlaying,
    }))
    clearInterval(playTimer)
  }

  Animation() {
    const imageIdsLength = this.state.imageIds.length
    var curIdx = this.state.currentIdx
    if (curIdx < imageIdsLength - 1) {
      this.refreshImage(false, this.state.imageIds[curIdx + 1], curIdx + 1)
    } else {
      this.refreshImage(false, this.state.imageIds[0], 0)
    }
  }

  toHidebox() {
    this.setState(({ showNodules }) => ({
      showNodules: !showNodules,
    }))
    this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
  }

  toHideInfo() {
    this.setState(({ showInfo }) => {
      return {
        showInfo: !showInfo,
      }
    })
  }
  onShowStudyList() {
    // const apiTool = cornerstoneTools[`RectangleRoiTool`]
    // cornerstoneTools.addTool(apiTool)
    // cornerstoneTools.setToolActive('RectangleRoi', {
    //   mouseButtonMask: 1,
    //   isTouchActive: true,
    // })
    // cornerstoneTools.addToolState(this.element, 'RectangleRoi', {
    //   visible: true,
    //   active: true,
    //   color: undefined,
    //   invalidated: true,
    //   handles: {
    //     start: {
    //       x: 50,
    //       y: 50,
    //       highlight: true,
    //       active: false,
    //     },
    //     end: {
    //       x: 300,
    //       y: 300,
    //       highlight: true,
    //       active: true,
    //     },
    //     textBox: {
    //       active: false,
    //       hasMoved: false,
    //       movesIndependently: false,
    //       drawnIndependently: true,
    //       allowedOutsideImage: true,
    //       hasBoundingBox: true,
    //     },
    //   },
    // })
    // console.log('tool data', cornerstoneTools.getToolState(this.element, 'RectangleRoi'))
    // cornerstoneTools.setToolEnabled('RectangleRoi')
    const studyListShowed = !this.state.studyListShowed
    this.setState(
      {
        studyListShowed,
      },
      () => {
        this.resizeScreen()
      }
    )
  }
  toHideMeasures(idx, e) {
    const measureStateList = this.state.measureStateList
    const measureStat = measureStateList[idx]
    measureStateList[idx] = !measureStat
    // measureStateList[idx]
    this.setState({ measureStateList: measureStateList })
    console.log('measureStateList', this.state.measureStateList)
    this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
  }

  toHideMask(idx, e) {
    const maskStateList = this.state.maskStateList
    const maskStat = maskStateList[idx]
    maskStateList[idx] = !maskStat
    this.setState({ maskStateList: maskStateList })
    console.log('maskStateList', this.state.maskStateList)
    this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
  }

  delNodule(event) {
    const delNoduleId = event.target.id
    const nodule_no = delNoduleId.split('-')[1]
    // let selectBoxes = this.state.selectBoxes
    // let measureStateList = this.state.measureStateList
    // for (var i = 0; i < selectBoxes.length; i++) {
    //     if (selectBoxes[i].nodule_no === nodule_no) {
    //         // selectBoxes.splice(i, 1)
    //         selectBoxes[i]="delete"
    //     }
    // }
    let boxes = this.state.boxes
    let measureStateList = this.state.measureStateList
    // for (var i = 0; i < boxes.length; i++) {
    //     if (boxes[i].nodule_no === nodule_no) {
    //         boxes.splice(i, 1)
    //         boxes[i]="delete"
    //     }
    // }
    boxes.splice(nodule_no, 1)
    measureStateList.splice(nodule_no, 1)
    for (var i = nodule_no; i < boxes.length; i++) {
      boxes[i].nodule_no = (parseInt(boxes[i].nodule_no) - 1).toString()
    }
    this.setState({
      boxes: boxes,
      measureStateList: measureStateList,
      // random: Math.random()
    })
    this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
  }

  highlightNodule(event) {
    // console.log('in', event.target.textContent)
    // let boxes = this.state.selectBoxes
    let boxes = this.state.boxes
    for (var i = 0; i < boxes.length; i++) {
      if (parseInt(boxes[i].nodule_no) === event.target.textContent - 1) {
        boxes[i].highlight = true
      }
    }
    // this.setState({selectBoxes: boxes})
    this.setState({ boxes: boxes })
    if (!this.state.show3DVisualization) {
      this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
    }
  }

  dehighlightNodule(event) {
    // console.log('out', event.target.textContent)
    // let boxes = this.state.selectBoxes
    let boxes = this.state.boxes
    for (var i = 0; i < boxes.length; i++) {
      if (parseInt(boxes[i].nodule_no) === event.target.textContent - 1) {
        boxes[i].highlight = false
      }
    }
    // console.log(this.state.boxes, boxes)
    // this.setState({selectBoxes: boxes})
    this.setState({ boxes: boxes })
    if (!this.state.show3DVisualization) {
      this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
    }
  }

  closeModalNew() {
    this.setState({ modalOpenNew: false })
  }

  sliceIdxSort(prop) {
    return function (a, b) {
      var value1 = a[prop]
      var value2 = b[prop]
      return value1 - value2
    }
  }

  closeModalCur() {
    this.setState({ modalOpenCur: false })
  }

  onSelectMal = (event) => {
    const value = event.currentTarget.value
    const noduleId = event.currentTarget.id.split('-')[1]
    let boxes = this.state.boxes
    for (let i = 0; i < boxes.length; i++) {
      if (boxes[i].nodule_no === noduleId) {
        boxes[i].malignancy = parseInt(value)
      }
    }
    console.log('boxes', boxes, noduleId)
    this.setState({
      // selectBoxes: boxes,
      boxes: boxes,
      // random: Math.random()
    })
  }
  onSelectTex = (event) => {
    const value = event.currentTarget.value
    const noduleId = event.currentTarget.id.split('-')[1]
    // let boxes = this.state.selectBoxes
    let boxes = this.state.boxes
    for (let i = 0; i < boxes.length; i++) {
      if (boxes[i].nodule_no === noduleId) {
        boxes[i].texture = parseInt(value)
      }
    }
    this.setState({
      selectBoxes: boxes,
      boxes: boxes,
      // random: Math.random()
    })
  }

  onSelectPlace = (event) => {
    const places = nodulePlaces
    const segments = noduleSegments
    const segment = event.currentTarget.innerHTML
    const place = event.currentTarget.id.split('-')[2]
    const noduleId = event.currentTarget.id.split('-')[1]
    console.log('id', segment, place, noduleId)
    // let boxes = this.state.selectBoxes
    let boxes = this.state.boxes
    // console.log('onselectplace',boxes)
    for (let i = 0; i < boxes.length; i++) {
      // console.log('onselectplace',boxes[i].nodule_no,boxes[i],noduleId,boxes[i].nodule_no===noduleId)
      if (boxes[i].nodule_no === noduleId) {
        for (let item in places) {
          if (places[item] === place) {
            boxes[i].place = item
            console.log('place', place)
          }
        }
        if (segment === '无法定位') {
          boxes[i].segment = ''
          console.log('segment', '')
        } else {
          for (let item in segments) {
            if (segments[item] === place + '-' + segment) {
              boxes[i].segment = item
              console.log('segment', segment)
            }
          }
        }
      }
    }
    this.setState({
      // selectBoxes: boxes,
      boxes: boxes,
      // random: Math.random()
    })
  }

  representChange = (e, { value, name }) => {
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
    console.log('测量', value, name.split('dropdown')[1])
    // let boxes = this.state.selectBoxes
    let boxes = this.state.boxes
    for (let count = 0; count < boxes.length; count++) {
      if (boxes[count].nodule_no === name.split('dropdown')[1]) {
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
    this.setState({
      // selectBoxes: boxes
      boxes: boxes,
      // random: Math.random()
    })
  }

  toMyAnno() {
    window.location.href = '/case/' + this.state.caseId.replace('#', '%23') + '/' + localStorage.getItem('username')
  }

  saveToDB() {
    console.log('savetodb')
    let boxes = this.state.boxes
    // const selectBoxes = this.state.selectBoxes
    // const selectBoxesMapIndex = this.state.selectBoxesMapIndex
    // let deleteBoxes=[]

    // for(let i=0;i<selectBoxesMapIndex.length;i++){//仅修改
    //     if(selectBoxes[i]!=="delete"){
    //         boxes[selectBoxes[i]]=selectBoxes[i]
    //     }
    //     else{
    //         deleteBoxes.push(selectBoxesMapIndex[i])//存在删除情况
    //     }
    // }

    // for(let i=0;i<deleteBoxes.length;i++){//存在删除情况
    //     boxes.splice(deleteBoxes[i], 1)
    //     for (let i = deleteBoxes[i]; i < boxes.length; i++) {
    //         boxes[i].nodule_no=(parseInt(boxes[i].nodule_no)-1).toString()
    //     }
    // }
    const token = localStorage.getItem('token')
    const headers = {
      Authorization: 'Bearer '.concat(token),
    }
    const params = {
      caseId: this.state.caseId,
      username: this.state.username,
      newRectStr: JSON.stringify(boxes),
    }
    axios
      .post(this.config.draft.updateRects, qs.stringify(params), { headers })
      .then((res) => {
        if (res.data.status === 'okay') {
          const content = res.data.allDrafts
          this.setState({ content: content })
        }
      })
      .catch((err) => {
        console.log('err: ' + err)
      })
  }

  disableAllTools(element) {
    // cornerstoneTools.setToolDisabledForElement(element, 'Pan',
    // {
    //     mouseButtonMask: 4, //middle mouse button
    // },
    // ['Mouse'])
    cornerstoneTools.setToolDisabledForElement(
      element,
      'Wwwc',
      {
        mouseButtonMask: 1, //middle mouse button
      },
      ['Mouse']
    )
  }

  handleClickScreen(e, href) {
    console.log('card', href)
    if (window.location.pathname.split('/case/')[1].split('/')[0] !== href.split('/case/')[1].split('/')[0]) {
      this.setState({
        caseId: href.split('/case/')[1].split('/')[0],
        username: href.split('/')[3],
      })
      // this.nextPath(href)
      window.location.href = href
    }
  }

  startAnnos() {
    // this.setState({isbidirectionnal:true,toolState:'EllipticalRoi'})
    // const element = document.querySelector('#origin-canvas')
    // this.disableAllTools(element)
    // cornerstoneTools.addToolForElement(element,ellipticalRoi)
    // cornerstoneTools.setToolActiveForElement(element, 'EllipticalRoi',{mouseButtonMask:1},['Mouse'])
    const element = document.querySelector('#origin-canvas')
    this.disableAllTools(element)
    this.setState({ leftButtonTools: 0, menuTools: 'anno' })
  }

  slide() {
    const element = document.querySelector('#origin-canvas')
    this.disableAllTools(element)
    this.setState({ leftButtonTools: 1, menuTools: 'slide' })
    const newCurrentIdx = this.state.currentIdx
    //切换切片
  }

  wwwcCustom() {
    this.setState({ leftButtonTools: 2, menuTools: 'wwwc' })
    const element = document.querySelector('#origin-canvas')
    this.disableAllTools(element)
    cornerstoneTools.addToolForElement(element, wwwc)
    cornerstoneTools.setToolActiveForElement(
      element,
      'Wwwc',
      {
        mouseButtonMask: 1, //middle mouse button
      },
      ['Mouse']
    )
  }

  saveTest() {
    let myJSONStingData = localStorage.getItem('ROI')
    let allROIToolData = JSON.parse(myJSONStingData)
    console.log('恢复数据')
    const element = document.querySelector('#origin-canvas')
    for (let toolROIType in allROIToolData) {
      if (allROIToolData.hasOwnProperty(toolROIType)) {
        for (let i = 0; i < allROIToolData[toolROIType].data.length; i++) {
          let toolROIData = allROIToolData[toolROIType].data[i]
          console.log('tool', toolROIType, toolROIData)
          // cornerstoneTools.addImageIdToolState(this.state.imageIds[5], toolROIType, toolROIData);//save在同一个imageId
          cornerstoneTools.addToolState(element, toolROIType, toolROIData)
        }
      }
    }
    cornerstone.updateImage(element)
  }

  bidirectionalMeasure() {
    this.setState({ leftButtonTools: 3, menuTools: 'bidirect' })
    const element = document.querySelector('#origin-canvas')
    this.disableAllTools(element)
    // console.log('测量')
    // const element = document.querySelector('#origin-canvas')
    // this.disableAllTools(element)
    // cornerstoneTools.addToolForElement(element, bidirectional)
    // cornerstoneTools.setToolActiveForElement(element, 'Bidirectional',{mouseButtonMask:1},['Mouse'])
    // cornerstoneTools.length.activate(element,4);
  }

  lengthMeasure() {
    this.setState({ leftButtonTools: 4, menuTools: 'length' })
    const element = document.querySelector('#origin-canvas')
    this.disableAllTools(element)
  }

  featureAnalysis(idx, e) {
    console.log('特征分析')
    // const boxes = this.state.selectBoxes
    const boxes = this.state.boxes
    console.log('boxes', boxes, e.target.value)
    if (boxes[idx] !== undefined) {
      console.log('boxes', boxes[idx])
      var hist = boxes[idx].nodule_hist
      if (hist !== undefined) {
        this.visualize(hist, idx)
      }
    }
  }

  async toFollowUp() {
    console.log('followup')
    const dataListParams = {
      type: 'pid',
      mainItem: this.state.caseId.split('_')[0],
      otherKeyword: '',
    }
    const allListPromise = new Promise((resolve, reject) => {
      axios.post(this.config.record.getSubListForMainItem_front, qs.stringify(dataListParams)).then((sublistResponse) => {
        const sublistData = sublistResponse.data.subList
        resolve(sublistData)
      }, reject)
    })

    const sublistData = await allListPromise
    console.log('subl', sublistData)
    const currentDate = this.state.caseId.split('_')[1]
    var i = 0
    for (var key in sublistData) {
      i += 1
      if (key === currentDate) break
    }
    var preCaseId = ''
    for (var key in sublistData) {
      i -= 1
      if (i === 1) {
        preCaseId = sublistData[key][0].split('#')[0]
        break
      }
    }
    if (preCaseId === '') {
      preCaseId = this.state.caseId
    }

    console.log('preCaseId', preCaseId)
    window.location.href = '/followup/' + this.state.caseId + '&' + preCaseId + '/' + this.state.username
  }

  closeVisualContent() {
    console.log('close')
    const visId = 'visual-' + this.state.listsActiveIndex
    if (document.getElementById(visId) !== undefined && document.getElementById(visId) !== null) {
      document.getElementById(visId).style.display = 'none'
      document.getElementById('closeVisualContent').style.display = 'none'
    }
  }

  // downloadBar(idx,e){
  //     const visId = 'visual_' + idx
  //     console.log(visId)
  //     const dataURI = document.getElementById(visId)
  //     // var chart = Chart.init(document.getElementById('main'))
  //     console.log('dataURI',dataURI)
  //     var a = document.createElement("a")
  //     // const uri = dataURI.toDataURL()
  //     a.download = 'chart.jpg'
  //     a.click()
  //     // download(uri,'chart.jpg',"image/jpg")
  // }

  eraseLabel() {
    const element = document.querySelector('#origin-canvas')
    this.disableAllTools(element)
    cornerstoneTools.addToolForElement(element, eraser)
    cornerstoneTools.setToolActiveForElement(element, 'Eraser', { mouseButtonMask: 1 }, ['Mouse'])
  }

  eraseMeasures(idx, e) {
    const boxes = this.state.boxes
    // const boxes = this.state.selectBoxes
    boxes[idx].measure = []
    this.setState({ boxes: boxes })
    this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
  }

  toHomepage() {
    window.location.href = '/homepage'
    // this.nextPath('/homepage/' + params.caseId + '/' + res.data)
  }
  show3D() {
    clearTimeout(flipTimer)
    // const element = document.querySelector('#origin-canvas')
    const centerPanel = document.getElementById('cor-container')
    if (centerPanel) {
      centerPanel.style.transform = 'rotateY(180deg)'
    }
    const rightTopPanel = document.getElementsByClassName('nodule-card-container')[0]
    if (rightTopPanel) {
      rightTopPanel.style.transform = 'translateY(-200px)'
      rightTopPanel.style.opacity = 0
    }
    const rightDownPanel = document.getElementById('report')
    if (rightDownPanel) {
      rightDownPanel.style.transform = 'translateY(200px)'
      rightDownPanel.style.opacity = 0
    }
    // const canvasColumn = document.getElementById("canvas-column");
    // const cWidth = canvasColumn.clientWidth;
    // const cHeight = canvasColumn.clientHeight;
    flipTimer = setTimeout(() => {
      cornerstone.disable(this.element)
      this.setState(
        {
          show3DVisualization: true,
        },
        () => {
          this.resizeScreen()
        }
      )
      // clearInterval(flipTimer)
    }, 1000)
  }
  hide3D() {
    clearTimeout(flipTimer)
    const centerPanel = document.getElementById('segment-container')
    if (centerPanel) {
      centerPanel.style.transform = 'rotateY(180deg)'
    }
    const threeDList = document.getElementsByClassName('list-tab')[0]
    if (threeDList) {
      threeDList.style.transform = 'translateX(200px)'
      threeDList.style.opacity = 0
    }
    flipTimer = setTimeout(() => {
      this.setState({
        MPR: false,
      })
      this.changeMode(1)
      this.setState(
        {
          show3DVisualization: false,
        },
        () => {
          this.resizeScreen()
        }
      )
      // clearInterval(flipTimer)
    }, 1000)
  }
  handleLogin() {
    this.setState({
      reRender: Math.random(),
    }) // force re-render the page
  }

  handleLogout() {
    const token = localStorage.getItem('token')
    const headers = {
      Authorization: 'Bearer '.concat(token),
    }
    Promise.all([axios.get(this.config.user.signoutUser, { headers }), axios.get(process.env.PUBLIC_URL + '/config.json')])
      .then(([signoutRes, configs]) => {
        if (signoutRes.data.status === 'okay') {
          this.setState({ isLoggedIn: false })
          localStorage.clear()
          sessionStorage.clear()
          const config = configs.data
          console.log('config', config)
          localStorage.setItem('config', JSON.stringify(config))
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

  tinyNodules(e) {
    if (e.target.checked) {
      this.setState({ selectTiny: 1, listsActiveIndex: -1 })
    } else {
      this.setState({ selectTiny: 0, listsActiveIndex: -1 })
    }
  }

  chooseDensity(value) {
    if (value === '实性') {
      this.setState({ selectTexture: 2 })
    } else if (value === '半实性') {
      this.setState({ selectTexture: 3 })
    } else if (value === '磨玻璃') {
      this.setState({ selectTexture: 1 })
    } else {
      this.setState({ selectTexture: -1 })
    }
  }

  render() {
    const {
      showNodules,
      showInfo,
      activeIndex,
      modalOpenNew,
      modalOpenCur,
      listsActiveIndex,
      wwDefine,
      wcDefine,
      dicomTag,
      menuTools,
      cacheModal,
      windowWidth,
      windowHeight,
      verticalMode,
      canvasWidth,
      canvasHeight,
      slideSpan,
      measureStateList,
      maskStateList,
      dateSeries,

      lobesData,
      tubularData,
      lobesController,
      tubularController,
      MPR,
      CPR,
      viewerWidth,
      viewerHeight,
      bottomRowHeight,
      displayCrosshairs,
      labelThreshold,
      paintRadius,
      painting,
      erasing,
      urls,
      percent,
      listLoading,
      segments,
      vtkImageData,
      volumes,
      volumesLoading,
      originXBorder,
      originYBorder,
      originZBorder,
      labelMapInputData,
      mode,
      segRange,
      airwayPicking,
      airwayCenterVolumes,
      lineActors,

      menuButtonsWidth,
      menuScrollable,
      menuTotalPages,
      menuNowPage,
      menuTransform,
      show3DVisualization,
      studyListShowed,
    } = this.state
    let tableContent = ''
    let lobeContent = ''
    let tubularContent = ''
    let visualContent = ''
    let createDraftModal
    let submitButton
    let StartReviewButton
    let calCount = 0
    let canvas
    let slideLabel
    let dicomTagPanel
    const places = nodulePlaces
    // const noduleSegments = noduleSegments 引用了全局变量

    // let noduleNumTab = '结节(' + this.state.selectBoxes.length + ')'
    let noduleNumTab = '结节(' + this.state.boxes.length + ')'
    // let inflammationTab = '炎症(有)'
    // let lymphnodeTab = '淋巴结(0)'
    const options = [
      { key: '分叶', text: '分叶', value: '分叶' },
      { key: '毛刺', text: '毛刺', value: '毛刺' },
      { key: '钙化', text: '钙化', value: '钙化' },
      { key: '胸膜凹陷', text: '胸膜凹陷', value: '胸膜凹陷' },
      { key: '血管集束', text: '血管集束', value: '血管集束' },
      { key: '空泡', text: '空泡', value: '空泡' },
      { key: '空洞', text: '空洞', value: '空洞' },
      { key: '支气管充气', text: '支气管充气', value: '支气管充气' },
    ]

    const locationOptions = [
      { key: '分叶', text: '分叶', value: '分叶' },
      { key: '分叶', text: '分叶', value: '分叶' },
      { key: '分叶', text: '分叶', value: '分叶' },
      { key: '分叶', text: '分叶', value: '分叶' },
    ]
    const welcome = '欢迎您，' + localStorage.realname

    let sliderMarks = {}
    if (this.state.imageIds.length <= 100) {
      for (let i = 0; i < this.state.boxes.length; i++) {
        sliderMarks[this.state.boxes[i].slice_idx + 1] = ''
      }
    } else {
      for (let i = 0; i < this.state.boxes.length; i++) {
        sliderMarks[this.state.boxes[i].slice_idx] = ''
      }
    }

    let panes = [
      {
        menuItem: '影像所见',
        render: () => (
          <Tab.Pane>
            {/* <MiniReport
              type="影像所见"
              caseId={this.state.caseId}
              username={this.state.modelName}
              imageIds={this.state.imageIds}
              boxes={this.state.boxes}
              activeItem={
                this.state.doubleClick === true
                  ? "all"
                  : this.state.listsActiveIndex
              }
            /> */}
            <Grid divided="vertically">
              <Grid.Row verticalAlign="middle" columns={4} style={{ height: 40 }}>
                <Grid.Column textAlign="left" width={6}>
                  <div style={{ fontSize: 18 }}></div>
                </Grid.Column>

                <Grid.Column width={4} textAlign="right"></Grid.Column>
                <Grid.Column textAlign="center" width={2}>
                  <Modal trigger={<Button icon="expand arrows alternate" title="放大" className="inverted blue button" onClick={this.showImages}></Button>}>
                    <Modal.Header>
                      <Grid>
                        <Grid.Row>
                          <Grid.Column width={3} textAlign="left">
                            影像诊断报告
                          </Grid.Column>
                          <Grid.Column width={6}></Grid.Column>
                          <Grid.Column width={3} textAlign="right">
                            {this.state.temp === 1 ? (
                              <Button color="blue" onClick={this.exportPDF}>
                                导出pdf
                              </Button>
                            ) : (
                              <Button color="blue" loading>
                                Loading
                              </Button>
                            )}
                          </Grid.Column>
                        </Grid.Row>
                      </Grid>
                    </Modal.Header>
                    <Modal.Content image scrolling id="pdf">
                      <Modal.Description>
                        <table>
                          <tbody>
                            <tr>
                              <td>
                                <Header>病人编号:</Header>
                              </td>
                              <td>{this.state.patientId}</td>

                              <td>
                                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                              </td>
                              <td align="right">
                                <Header>姓名:</Header>
                              </td>
                              <td>&nbsp;</td>
                            </tr>
                            <tr>
                              <td>
                                <Header>出生日期:</Header>
                              </td>
                              <td>{this.state.patientBirth}</td>
                              <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>

                              <td align="right">
                                <Header>年龄:</Header>
                              </td>
                              <td>{this.state.age}</td>
                            </tr>
                            <tr>
                              <td>
                                <Header>性别:</Header>
                              </td>
                              <td>{this.state.patientSex}</td>
                              <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>
                              <td align="right">
                                <Header>检查日期:</Header>
                              </td>
                              <td>{this.state.date}</td>
                            </tr>
                            <tr>
                              <td>
                                <Header>检查编号:</Header>
                              </td>
                              <td>12580359</td>
                              <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>
                              <td align="right">
                                <Header>入库编号:</Header>
                              </td>
                              <td>&nbsp;</td>
                            </tr>
                            <tr>
                              <td>
                                <Header>报告撰写日期:</Header>
                              </td>
                              <td>&nbsp;</td>
                              <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>
                              <td align="right">
                                <Header>请求过程描述:</Header>
                              </td>
                              <td>&nbsp;</td>
                            </tr>
                          </tbody>
                        </table>
                        <Divider />
                        <table>
                          <tbody>
                            <tr>
                              <td width="50%">
                                <Header>体重:</Header>
                              </td>
                              <td></td>
                            </tr>
                            <tr>
                              <td>
                                <Header>身高:</Header>
                              </td>
                              <td align="right">
                                <Header>体重系数:</Header>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        <Divider />

                        <div style={{ fontSize: 20, color: '#6495ED' }}>扫描参数</div>
                        <Table celled>
                          <Table.Header>
                            <Table.Row>
                              <Table.HeaderCell>检查日期</Table.HeaderCell>
                              <Table.HeaderCell>像素大小(毫米)</Table.HeaderCell>
                              <Table.HeaderCell>厚度 / 间距(毫米)</Table.HeaderCell>
                              <Table.HeaderCell>kV</Table.HeaderCell>
                              <Table.HeaderCell>mA</Table.HeaderCell>
                              <Table.HeaderCell>mAs</Table.HeaderCell>
                              {/* <Table.HeaderCell>Recon Name</Table.HeaderCell> */}
                              <Table.HeaderCell>厂商</Table.HeaderCell>
                            </Table.Row>
                          </Table.Header>
                          <Table.Body></Table.Body>
                        </Table>
                        <div style={{ fontSize: 20, color: '#6495ED' }}>肺部详情</div>
                        <Table celled>
                          <Table.Header>
                            <Table.Row>
                              <Table.HeaderCell>检查日期</Table.HeaderCell>
                              <Table.HeaderCell>体积</Table.HeaderCell>
                              <Table.HeaderCell>结节总体积</Table.HeaderCell>
                            </Table.Row>
                          </Table.Header>
                          <Table.Body></Table.Body>
                        </Table>
                        <div style={{}}></div>
                        {this.state.nodules.map((nodule, index) => {
                          let nodule_id = 'nodule-' + nodule.nodule_no + '-' + nodule.slice_idx
                          let visualId = 'visual' + index
                          // console.log('visualId',visualId)
                          return (
                            <div key={index}>
                              <Divider />
                              <div>&nbsp;</div>
                              <div style={{ fontSize: 20, color: '#6495ED' }} id="noduleDivide">
                                结节 {index + 1}
                              </div>
                              <Table celled textAlign="center">
                                <Table.Header>
                                  <Table.Row>
                                    <Table.HeaderCell width={7}>检查日期</Table.HeaderCell>
                                    <Table.HeaderCell width={11}>{this.state.date}</Table.HeaderCell>
                                  </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                  <Table.Row>
                                    <Table.Cell>切片号</Table.Cell>
                                    <Table.Cell>{nodule['slice_idx'] + 1}</Table.Cell>
                                  </Table.Row>
                                  <Table.Row>
                                    <Table.Cell>肺叶位置</Table.Cell>
                                    <Table.Cell>{nodule['place'] === undefined || nodule['place'] === 0 ? '' : places[nodule['place']]}</Table.Cell>
                                  </Table.Row>
                                  <Table.Row>
                                    <Table.Cell>肺段位置</Table.Cell>
                                    <Table.Cell>{nodule['segment'] === undefined ? '' : noduleSegments[nodule['segment']]}</Table.Cell>
                                  </Table.Row>
                                  <Table.Row>
                                    <Table.Cell>危险程度</Table.Cell>
                                    <Table.Cell>{nodule['malignancy'] === 2 ? '高危' : '低危'}</Table.Cell>
                                  </Table.Row>
                                  <Table.Row>
                                    <Table.Cell>毛刺</Table.Cell>
                                    <Table.Cell>{nodule['spiculation'] === 2 ? '毛刺' : '非毛刺'}</Table.Cell>
                                  </Table.Row>
                                  <Table.Row>
                                    <Table.Cell>分叶</Table.Cell>
                                    <Table.Cell>{nodule['lobulation'] === 2 ? '分叶' : '非分叶'}</Table.Cell>
                                  </Table.Row>
                                  <Table.Row>
                                    <Table.Cell>钙化</Table.Cell>
                                    <Table.Cell>{nodule['calcification'] === 2 ? '钙化' : '非钙化'}</Table.Cell>
                                  </Table.Row>
                                  <Table.Row>
                                    <Table.Cell>密度</Table.Cell>
                                    <Table.Cell>{nodule['texture'] === 2 ? '实性' : '磨玻璃'}</Table.Cell>
                                  </Table.Row>
                                  <Table.Row>
                                    <Table.Cell>直径</Table.Cell>
                                    <Table.Cell>
                                      {Math.floor(nodule['diameter'] * 10) / 100}
                                      厘米
                                    </Table.Cell>
                                  </Table.Row>

                                  <Table.Row>
                                    <Table.Cell>体积</Table.Cell>
                                    <Table.Cell>{nodule['volume'] === undefined ? null : Math.floor(nodule['volume'] * 100) / 100 + 'cm³'}</Table.Cell>
                                  </Table.Row>
                                  <Table.Row>
                                    <Table.Cell>HU(最小值/均值/最大值)</Table.Cell>
                                    <Table.Cell>{nodule['huMin'] === undefined ? null : nodule['huMin'] + ' / ' + nodule['huMean'] + ' / ' + nodule['huMax']}</Table.Cell>
                                  </Table.Row>
                                  <Table.Row>
                                    <Table.Cell>结节部分</Table.Cell>
                                    <Table.Cell>
                                      <div
                                        id={nodule_id}
                                        style={{
                                          width: '300px',
                                          height: '250px',
                                          margin: '0 auto',
                                        }}></div>
                                    </Table.Cell>
                                    {/* <Table.Cell><Image id={nodule_id}></Image></Table.Cell> */}
                                  </Table.Row>
                                  <Table.Row>
                                    <Table.Cell>直方图</Table.Cell>
                                    <Table.Cell>
                                      <div id={visualId} style={{ margin: '0 auto' }}></div>
                                    </Table.Cell>
                                  </Table.Row>
                                </Table.Body>
                              </Table>
                            </div>
                          )
                        })}
                        <Divider />
                      </Modal.Description>
                    </Modal.Content>
                  </Modal>
                </Grid.Column>
                <Grid.Column textAlign="left" width={2}>
                  <Button title="复制" className="inverted blue button" icon="copy outline" onClick={this.handleCopyClick}></Button>
                </Grid.Column>
              </Grid.Row>
              <Divider></Divider>
              <Grid.Row>
                <Grid.Column textAlign="center">
                  <Form.TextArea
                    style={{
                      fontSize: 'medium',
                      overflowY: 'auto',
                      width: '100%',
                      background: 'transparent',
                      border: '0rem',
                      marginLeft: '0px',
                    }}
                    id="textarea"
                    placeholder="在此填写诊断报告"
                    onChange={this.handleTextareaChange}
                    value={this.state.templateText}
                    maxLength={500}>
                    {/* {this.template().split('*').map((content,index)=>{
                                return(
                                    <p key={index}>
                                        {content}
                                    </p>
                                )
                                
                            })} */}
                  </Form.TextArea>
                </Grid.Column>
              </Grid.Row>
            </Grid>
          </Tab.Pane>
        ),
      },
      {
        menuItem: '处理建议',
        render: () => (
          <Tab.Pane>
            {/* <MiniReport
              type="处理建议"
              imageIds={this.state.imageIds}
              boxes={this.state.boxes}
            /> */}
            <Grid divided="vertically">
              <Grid.Row verticalAlign="middle" columns={3} style={{ height: 40 }}>
                <Grid.Column width={6}></Grid.Column>
                <Grid.Column widescreen={5} computer={6} textAlign="right">
                  <Dropdown style={{ background: 'none', fontSize: 16 }} text={this.state.dealchoose} id="dealchoose">
                    <Dropdown.Menu>
                      <Dropdown.Item onClick={this.dealChoose}>中华共识</Dropdown.Item>
                      <Dropdown.Item onClick={this.dealChoose}>Fleischner</Dropdown.Item>
                      <Dropdown.Item onClick={this.dealChoose}>NCCN</Dropdown.Item>
                      <Dropdown.Item onClick={this.dealChoose}>Lung-RADS</Dropdown.Item>
                      <Dropdown.Item onClick={this.dealChoose}>亚洲共识</Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </Grid.Column>
                <Grid.Column textAlign="center" width={2}>
                  <Button title="复制" className="inverted blue button" icon="copy outline" onClick={this.handleCopyClick}></Button>
                </Grid.Column>
              </Grid.Row>
              <Divider></Divider>
              <Grid.Row>
                <Grid.Column textAlign="center">
                  <Form.TextArea
                    style={{
                      fontSize: 'medium',
                      overflowY: 'auto',
                      width: '100%',
                      height: document.body.clientHeight / 7,
                      background: 'transparent',
                      border: '0rem',
                      marginLeft: '0px',
                    }}
                    id="textarea"
                    placeholder="在此填写处理建议"
                    value={this.state.templateText}
                    onChange={this.handleTextareaChange}
                    maxLength={500}></Form.TextArea>
                </Grid.Column>
              </Grid.Row>
            </Grid>
          </Tab.Pane>
        ),
      },
      // {
      //   menuItem: "留言",
      //   render: () => (
      //     <Tab.Pane>
      //       <MessagePanel caseId={this.state.caseId} boxes={this.state.boxes} />
      //     </Tab.Pane>
      //   ),
      // },
    ]

    const dicomslice = this.state.imageIds[0]
    // console.log('dicomslice',dicomslice)
    if (this.state.okayForReview) {
      StartReviewButton = (
        <Button
          style={{
            marginLeft: 15 + 'px',
          }}>
          审核此例
        </Button>
      )
    }

    if (slideSpan > 0) {
      slideLabel = (
        <div style={{ position: 'absolute', top: '90px', left: '-95px' }}>
          <Label as="a">
            <Icon name="caret down" />
            {Math.abs(slideSpan)}
          </Label>
        </div>
      )
    } else if (slideSpan < 0) {
      slideLabel = (
        <div style={{ position: 'absolute', top: '90px', left: '-95px' }}>
          <Label as="a">
            <Icon name="caret up" />
            {Math.abs(slideSpan)}
          </Label>
        </div>
      )
    } else {
      slideLabel = null
    }

    dicomTagPanel =
      !showInfo || dicomTag === null ? null : (
        <div>
          <div id="dicomTag">
            <div style={topLeftStyle}>{dicomTag.string('x00100010')}</div>
            <div style={{ position: 'absolute', color: 'white', top: '20px' }}>
              {dicomTag.string('x00101010')} {dicomTag.string('x00100040')}
            </div>
            <div style={{ position: 'absolute', color: 'white', top: '35px' }}>{dicomTag.string('x00100020')}</div>
            <div style={{ position: 'absolute', color: 'white', top: '50px' }}>{dicomTag.string('x00185100')}</div>
            <div style={{ position: 'absolute', color: 'white', top: '65px' }}>
              IM: {this.state.currentIdx + 1} / {this.state.imageIds.length}
            </div>
            {slideLabel}
            <div style={topRightStyle}>{dicomTag.string('x00080080')}</div>
            <div
              style={{
                position: 'absolute',
                color: 'white',
                top: '20px',
                right: '5px',
              }}>
              ACC No: {dicomTag.string('x00080050')}
            </div>
            <div
              style={{
                position: 'absolute',
                color: 'white',
                top: '35px',
                right: '5px',
              }}>
              {dicomTag.string('x00090010')}
            </div>
            <div
              style={{
                position: 'absolute',
                color: 'white',
                top: '50px',
                right: '5px',
              }}>
              {dicomTag.string('x0008103e')}
            </div>
            <div
              style={{
                position: 'absolute',
                color: 'white',
                top: '65px',
                right: '5px',
              }}>
              {dicomTag.string('x00080020')}
            </div>
            <div
              style={{
                position: 'absolute',
                color: 'white',
                top: '80px',
                right: '5px',
              }}>
              T: {dicomTag.string('x00180050')}
            </div>
          </div>
          <div style={{ position: 'absolute', color: 'white', bottom: '30px' }}>
            Offset: {this.state.viewport.translation['x'].toFixed(1)}, {this.state.viewport.translation['y'].toFixed(1)}
          </div>
          <div style={{ position: 'absolute', color: 'white', bottom: '10px' }}>Zoom: {Math.round(this.state.viewport.scale * 100)}%</div>
          <div
            style={{
              position: 'absolute',
              color: 'white',
              bottom: '20px',
              right: '5px',
            }}>
            WW/WC: {Math.round(this.state.viewport.voi.windowWidth)}/ {Math.round(this.state.viewport.voi.windowCenter)}
          </div>
        </div>
      )
    // }
    if (window.location.pathname.split('/')[3] === 'origin')
      createDraftModal = (
        <div style={{ width: '100%', height: '100%' }}>
          <Modal
            trigger={
              <Button inverted style={{ height: 60, fontSize: 14, width: 75 }} color="blue" onClick={this.toNewModel}>
                {' '}
                从新
                <br />
                标注{' '}
              </Button>
            }
            size="tiny"
            open={modalOpenNew}>
            <Modal.Header>当前用户存在当前检查的标注，请选择以下操作：</Modal.Header>
            <Modal.Content>
              <Button color="blue" style={modalBtnStyle} onClick={this.toMyAnno}>
                跳转至已有标注
              </Button>
              <Button color="blue" style={modalBtnStyle} onClick={this.clearthenNew}>
                清空现有标注并从头开始标注
              </Button>
            </Modal.Content>
            <Modal.Actions>
              <Button onClick={this.closeModalNew}>返回</Button>
            </Modal.Actions>
          </Modal>
        </div>
      )
    else
      createDraftModal = (
        <div style={{ width: '100%', height: '100%' }}>
          <Modal
            trigger={
              <Button inverted color="blue" onClick={this.toNewModel}>
                {' '}
                从新
                <br />
                标注{' '}
              </Button>
            }
            size="tiny"
            open={modalOpenNew}>
            <Modal.Header>当前用户存在当前检查的标注，请选择以下操作：</Modal.Header>
            <Modal.Content>
              <Button color="blue" style={modalBtnStyle} onClick={this.toMyAnno}>
                跳转至已有标注
              </Button>
              <Button color="blue" style={modalBtnStyle} onClick={this.clearthenNew}>
                清空现有标注并从头开始标注
              </Button>
            </Modal.Content>
            <Modal.Actions>
              <Button onClick={this.closeModalNew}>返回</Button>
            </Modal.Actions>
          </Modal>
          <Modal
            trigger={
              <Button inverted color="blue" onClick={this.toCurrentModel}>
                {' '}
                拷贝
                <br />
                标注{' '}
              </Button>
            }
            size="tiny"
            open={modalOpenCur}>
            <Modal.Header>当前用户存在当前检查的标注，请选择以下操作：</Modal.Header>
            <Modal.Content>
              <Button color="blue" style={modalBtnStyle} onClick={this.toMyAnno}>
                跳转至已有标注
              </Button>
              <Button color="blue" style={modalBtnStyle} onClick={this.clearthenFork}>
                清空现有标注并拷贝开始标注
              </Button>
            </Modal.Content>
            <Modal.Actions>
              <Button onClick={this.closeModalCur}>返回</Button>
            </Modal.Actions>
          </Modal>
        </div>
      )

    let loadingList = []
    const loadingStyle = this.getLoadingStyle()
    if (urls && urls.length) {
      let loadingNum = 0
      loadingList = urls.map((inside, idx) => {
        let loading
        if (loadingNum > 5) {
          return null
        }
        if (inside.url.length <= 0) {
          return null
        }
        if (percent[idx] === 100) {
          loading = false
        } else {
          loading = true
        }
        loadingNum = loadingNum + 1
        let segmentName = inside.name
        return (
          <div key={idx} className="loading-list-item" hidden={!listLoading[idx]}>
            <div className="loading-container">
              <Loader active inline className="loading-loader" size="medium" style={loading ? { visibility: 'visible' } : { visibility: 'hidden' }} />
              <div className="loading-ticker" hidden={loading} />
              <div className="loading-ticker-hidden" hidden={loading} />
              {/*<div className="loading-circle" hidden={loading}/>*/}
              {/*<div className="loading-circle-hidden" hidden={loading}/>*/}
            </div>
            <div className="loading-list-item-info">{segmentName}</div>
          </div>
        )
      })
    }
    const loadingPanel = (
      <div className="sk-chase">
        <div className="sk-chase-dot"></div>
        <div className="sk-chase-dot"></div>
        <div className="sk-chase-dot"></div>
        <div className="sk-chase-dot"></div>
        <div className="sk-chase-dot"></div>
        <div className="sk-chase-dot"></div>
      </div>
    )
    const threeDPanel = (
      <>
        <VTK3DViewer
          viewerStyle={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: viewerWidth,
            height: viewerHeight,
          }}
          actors={[].concat(segments)}
          onRef={(ref) => {
            this.viewer3D = ref
          }}
        />
        <div className="loading-list" style={loadingStyle}>
          {loadingList}
        </div>
      </>
    )
    let MPRAxialPanel
    let MPRCoronalPanel
    let MPRSagittalPanel
    MPRAxialPanel = (
      <View2D
        viewerType={0}
        parallelScale={originYBorder / 2}
        volumes={volumes}
        onCreated={this.storeApi(0)}
        onDestroyed={this.deleteApi(0)}
        orientation={{
          sliceNormal: [0, 0, 1],
          viewUp: [0, -1, 0],
        }}
        showRotation={true}
        paintFilterBackgroundImageData={vtkImageData}
        // paintFilterLabelMapImageData={labelMapInputData}
        painting={painting}
        // onPaintEnd={this.onPaintEnd.bind(this)}
        onChangeSlice={this.onChangeSlice.bind(this)}
        sliderMax={Math.round(segRange.zMax)}
        sliderMin={Math.round(segRange.zMin)}
      />
    )
    MPRCoronalPanel = (
      <View2D
        viewerType={1}
        parallelScale={originZBorder / 2}
        volumes={volumes}
        onCreated={this.storeApi(1)}
        onDestroyed={this.deleteApi(1)}
        orientation={{
          sliceNormal: [0, 1, 0],
          viewUp: [0, 0, 1],
        }}
        showRotation={true}
        paintFilterBackgroundImageData={vtkImageData}
        // paintFilterLabelMapImageData={labelMapInputData}
        painting={painting}
        onChangeSlice={this.onChangeSlice.bind(this)}
        sliderMax={Math.round(segRange.yMax)}
        sliderMin={Math.round(segRange.yMin)}
      />
    )
    MPRSagittalPanel = (
      <View2D
        viewerType={2}
        parallelScale={originZBorder / 2}
        volumes={volumes}
        onCreated={this.storeApi(2)}
        onDestroyed={this.deleteApi(2)}
        orientation={{
          sliceNormal: [-1, 0, 0],
          viewUp: [0, 0, 1],
        }}
        showRotation={true}
        paintFilterBackgroundImageData={vtkImageData}
        // paintFilterLabelMapImageData={labelMapInputData}
        painting={painting}
        onChangeSlice={this.onChangeSlice.bind(this)}
        sliderMax={Math.round(segRange.xMax)}
        sliderMin={Math.round(segRange.xMin)}
      />
    )

    let panel
    if (mode === 1) {
      panel = threeDPanel
    }
    if (mode === 2) {
      const MPRStyles = this.getMPRStyles()
      const MPRPanel = (
        <>
          <VTK3DViewer
            viewerStyle={MPRStyles.threeD}
            actors={segments}
            onRef={(ref) => {
              this.viewer3D = ref
            }}
          />
          <div className="loading-list" style={loadingStyle}>
            {loadingList}
          </div>
          <View2D
            // axial
            viewerStyle={MPRStyles.axial}
            viewerType={0}
            parallelScale={originYBorder / 2}
            volumes={volumes}
            onCreated={this.storeApi(0)}
            onDestroyed={this.deleteApi(0)}
            orientation={{
              sliceNormal: [0, 0, 1],
              viewUp: [0, -1, 0],
            }}
            showRotation={true}
            paintFilterBackgroundImageData={vtkImageData}
            // paintFilterLabelMapImageData={labelMapInputData}
            painting={painting}
            // onPaintEnd={this.onPaintEnd.bind(this)}
            onChangeSlice={this.onChangeSlice.bind(this)}
            sliderMax={Math.round(segRange.zMax)}
            sliderMin={Math.round(segRange.zMin)}
            onRef={(ref) => {
              this.viewerAxial = ref
            }}
          />
          <View2D
            //coronal
            viewerStyle={MPRStyles.coronal}
            viewerType={1}
            parallelScale={originZBorder / 2}
            volumes={volumes}
            onCreated={this.storeApi(1)}
            onDestroyed={this.deleteApi(1)}
            orientation={{
              sliceNormal: [0, 1, 0],
              viewUp: [0, 0, 1],
            }}
            showRotation={true}
            paintFilterBackgroundImageData={vtkImageData}
            // paintFilterLabelMapImageData={labelMapInputData}
            painting={painting}
            onChangeSlice={this.onChangeSlice.bind(this)}
            sliderMax={Math.round(segRange.yMax)}
            sliderMin={Math.round(segRange.yMin)}
            onRef={(ref) => {
              this.viewerCoronal = ref
            }}
          />
          <View2D
            //sagittal
            viewerStyle={MPRStyles.sagittal}
            viewerType={2}
            parallelScale={originZBorder / 2}
            volumes={volumes}
            onCreated={this.storeApi(2)}
            onDestroyed={this.deleteApi(2)}
            orientation={{
              sliceNormal: [-1, 0, 0],
              viewUp: [0, 0, 1],
            }}
            showRotation={true}
            paintFilterBackgroundImageData={vtkImageData}
            // paintFilterLabelMapImageData={labelMapInputData}
            painting={painting}
            onChangeSlice={this.onChangeSlice.bind(this)}
            sliderMax={Math.round(segRange.xMax)}
            sliderMin={Math.round(segRange.xMin)}
            onRef={(ref) => {
              this.viewerSagittal = ref
            }}
          />
        </>
      )
      panel = MPRPanel
    }
    if (mode === 3) {
      const CPRStyles = this.getCPRStyles()
      const CPRPanel = (
        <>
          <VTK3DViewer
            viewerStyle={CPRStyles.threeD}
            actors={segments}
            onRef={(ref) => {
              this.viewer3D = ref
            }}
          />
          <div className="loading-list" style={loadingStyle}>
            {loadingList}
          </div>
          <View2D
            // axial
            viewerStyle={CPRStyles.axial}
            viewerType={0}
            parallelScale={originYBorder / 2}
            volumes={volumes}
            onCreated={this.storeApi(0)}
            onDestroyed={this.deleteApi(0)}
            orientation={{
              sliceNormal: [0, 0, 1],
              viewUp: [0, -1, 0],
            }}
            showRotation={true}
            paintFilterBackgroundImageData={vtkImageData}
            // paintFilterLabelMapImageData={labelMapInputData}
            painting={painting}
            // onPaintEnd={this.onPaintEnd.bind(this)}
            onChangeSlice={this.onChangeSlice.bind(this)}
            sliderMax={Math.round(segRange.zMax)}
            sliderMin={Math.round(segRange.zMin)}
            onRef={(ref) => {
              this.viewerAxial = ref
            }}
          />
          <View2D
            //coronal
            viewerStyle={CPRStyles.coronal}
            viewerType={1}
            parallelScale={originZBorder / 2}
            volumes={volumes}
            onCreated={this.storeApi(1)}
            onDestroyed={this.deleteApi(1)}
            orientation={{
              sliceNormal: [0, 1, 0],
              viewUp: [0, 0, 1],
            }}
            showRotation={true}
            paintFilterBackgroundImageData={vtkImageData}
            // paintFilterLabelMapImageData={labelMapInputData}
            painting={painting}
            onChangeSlice={this.onChangeSlice.bind(this)}
            sliderMax={Math.round(segRange.yMax)}
            sliderMin={Math.round(segRange.yMin)}
            onRef={(ref) => {
              this.viewerCoronal = ref
            }}
          />
          <View2D
            //sagittal
            viewerStyle={CPRStyles.sagittal}
            viewerType={2}
            parallelScale={originZBorder / 2}
            volumes={volumes}
            onCreated={this.storeApi(2)}
            onDestroyed={this.deleteApi(2)}
            orientation={{
              sliceNormal: [-1, 0, 0],
              viewUp: [0, 0, 1],
            }}
            showRotation={true}
            paintFilterBackgroundImageData={vtkImageData}
            // paintFilterLabelMapImageData={labelMapInputData}
            painting={painting}
            onChangeSlice={this.onChangeSlice.bind(this)}
            sliderMax={Math.round(segRange.xMax)}
            sliderMin={Math.round(segRange.xMin)}
            onRef={(ref) => {
              this.viewerSagittal = ref
            }}
          />
          <VTK2DViewer
            viewerStyle={CPRStyles.airway}
            volumes={airwayCenterVolumes}
            lineActors={lineActors}
            onRef={(ref) => {
              this.viewerAirway = ref
            }}
          />
        </>
      )
      panel = CPRPanel
    }

    if (!this.state.immersive) {
      tableContent = this.state.boxes // .selectBoxes
        .map((inside, idx) => {
          let representArray = []
          let dropdownText = ''
          let malignancyContnt = ''
          let probContnt = ''
          let locationDropdown = ''
          const delId = 'del-' + inside.nodule_no
          const malId = 'malSel-' + inside.nodule_no
          const texId = 'texSel-' + inside.nodule_no
          const placeId = 'place-' + inside.nodule_no
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
          }

          let showMeasure = measureStateList[idx]
          let showMask = maskStateList[idx]
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
          if (inside.segment !== undefined && inside.segment !== null && inside.segment !== 'None' && inside.segment !== '') {
            dropdownText = noduleSegments[inside.segment]
          } else {
            if (inside.place !== undefined && inside.place !== null && inside.place !== 'None' && inside.place !== '') {
              dropdownText = places[inside.place]
            } else {
              dropdownText = '选择位置'
            }
          }

          locationDropdown = (
            <Dropdown
              id={placeId}
              style={selectStyle}
              text={dropdownText}
              icon={null}
              disabled={this.state.listsActiveIndex !== idx}
              //onClick={this.handleDropdownClick.bind(this, inside.slice_idx + 1, idx)}
              //open={this.state.dropDownOpen === idx}
            >
              <Dropdown.Menu>
                <Dropdown.Header>肺叶</Dropdown.Header>
                <Dropdown.Item>
                  <Dropdown text="右肺中叶">
                    <Dropdown.Menu>
                      <Dropdown.Header>肺段</Dropdown.Header>
                      <Dropdown.Item onClick={this.onSelectPlace} id={placeId + '-右肺中叶'}>
                        外侧段
                      </Dropdown.Item>
                      <Dropdown.Item onClick={this.onSelectPlace} id={placeId + '-右肺中叶'}>
                        内侧段
                      </Dropdown.Item>
                      <Dropdown.Item onClick={this.onSelectPlace} id={placeId + '-右肺中叶'}>
                        无法定位
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </Dropdown.Item>
                <Dropdown.Item>
                  <Dropdown text="右肺上叶">
                    <Dropdown.Menu>
                      <Dropdown.Header>肺段</Dropdown.Header>
                      <Dropdown.Item onClick={this.onSelectPlace} id={placeId + '-右肺上叶'}>
                        尖段
                      </Dropdown.Item>
                      <Dropdown.Item onClick={this.onSelectPlace} id={placeId + '-右肺上叶'}>
                        后段
                      </Dropdown.Item>
                      <Dropdown.Item onClick={this.onSelectPlace} id={placeId + '-右肺上叶'}>
                        前段
                      </Dropdown.Item>
                      <Dropdown.Item onClick={this.onSelectPlace} id={placeId + '-右肺中叶'}>
                        无法定位
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </Dropdown.Item>
                <Dropdown.Item>
                  <Dropdown text="右肺下叶">
                    <Dropdown.Menu>
                      <Dropdown.Header>肺段</Dropdown.Header>
                      <Dropdown.Item onClick={this.onSelectPlace} id={placeId + '-右肺下叶'}>
                        背段
                      </Dropdown.Item>
                      <Dropdown.Item onClick={this.onSelectPlace} id={placeId + '-右肺下叶'}>
                        内基底段
                      </Dropdown.Item>
                      <Dropdown.Item onClick={this.onSelectPlace} id={placeId + '-右肺下叶'}>
                        前基底段
                      </Dropdown.Item>
                      <Dropdown.Item onClick={this.onSelectPlace} id={placeId + '-右肺下叶'}>
                        外基底段
                      </Dropdown.Item>
                      <Dropdown.Item onClick={this.onSelectPlace} id={placeId + '-右肺下叶'}>
                        后基底段
                      </Dropdown.Item>
                      <Dropdown.Item onClick={this.onSelectPlace} id={placeId + '-右肺中叶'}>
                        无法定位
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </Dropdown.Item>
                <Dropdown.Item>
                  <Dropdown text="左肺上叶">
                    <Dropdown.Menu>
                      <Dropdown.Header>肺段</Dropdown.Header>
                      <Dropdown.Item onClick={this.onSelectPlace} id={placeId + '-左肺上叶'}>
                        尖后段
                      </Dropdown.Item>
                      <Dropdown.Item onClick={this.onSelectPlace} id={placeId + '-左肺上叶'}>
                        前段
                      </Dropdown.Item>
                      <Dropdown.Item onClick={this.onSelectPlace} id={placeId + '-左肺上叶'}>
                        上舌段
                      </Dropdown.Item>
                      <Dropdown.Item onClick={this.onSelectPlace} id={placeId + '-左肺上叶'}>
                        下舌段
                      </Dropdown.Item>
                      <Dropdown.Item onClick={this.onSelectPlace} id={placeId + '-右肺中叶'}>
                        无法定位
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </Dropdown.Item>
                <Dropdown.Item>
                  <Dropdown text="左肺下叶">
                    <Dropdown.Menu>
                      <Dropdown.Header>肺段</Dropdown.Header>
                      <Dropdown.Item onClick={this.onSelectPlace} id={placeId + '-左肺下叶'}>
                        背段
                      </Dropdown.Item>
                      <Dropdown.Item onClick={this.onSelectPlace} id={placeId + '-左肺下叶'}>
                        内前基底段
                      </Dropdown.Item>
                      <Dropdown.Item onClick={this.onSelectPlace} id={placeId + '-左肺下叶'}>
                        外基底段
                      </Dropdown.Item>
                      <Dropdown.Item onClick={this.onSelectPlace} id={placeId + '-左肺下叶'}>
                        后基底段
                      </Dropdown.Item>
                      <Dropdown.Item onClick={this.onSelectPlace} id={placeId + '-右肺中叶'}>
                        无法定位
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          )

          let probContntStyle = {}
          let malignancyContntStyle = {}
          if (inside.malignancy === -1) {
            malignancyContntStyle = selectStyle
          } else if (inside.malignancy === 1) {
            malignancyContntStyle = lowRiskStyle
            probContntStyle.color = 'green'
          } else if (inside.malignancy === 2) {
            malignancyContntStyle = middleRiskStyle
            probContntStyle.color = '#fcaf17'
          } else if (inside.malignancy === 3) {
            malignancyContntStyle = highRiskStyle
            probContntStyle.color = '#CC3300'
          }
          malignancyContnt = (
            <Grid.Column width={2} textAlign="center">
              <select id={malId} style={malignancyContntStyle} value={inside.malignancy} onChange={this.onSelectMal} disabled={this.state.listsActiveIndex !== idx ? 'disabled' : ''}>
                <option value="-1" disabled="disabled">
                  选择性质
                </option>
                <option value="1">低危</option>
                <option value="2">中危</option>
                <option value="3">高危</option>
              </select>
            </Grid.Column>
          )
          probContnt = (
            <Grid.Column width={4} textAlign="center">
              <div style={probContntStyle}>{Math.floor(inside.malProb * 1000) / 10}%</div>
            </Grid.Column>
          )
          // if(this.state.readonly){
          return (
            <div key={idx} className="highlightTbl">
              <Accordion.Title onClick={this.handleListClick.bind(this, inside.slice_idx + 1, idx)} active={listsActiveIndex === idx} index={idx}>
                <Grid>
                  <Grid.Row>
                    <Grid.Column width={1}>
                      {inside.modified === undefined ? (
                        <div onMouseEnter={this.highlightNodule} onMouseLeave={this.dehighlightNodule} style={{ fontSize: 'large' }}>
                          {idx + 1}
                        </div>
                      ) : (
                        <div onMouseEnter={this.highlightNodule} onMouseLeave={this.dehighlightNodule} style={{ fontSize: 'large', color: '#dbce12' }}>
                          {idx + 1}
                        </div>
                      )}
                    </Grid.Column>

                    <Grid.Column widescreen={6} computer={7} textAlign="center">
                      {locationDropdown}
                    </Grid.Column>

                    {malignancyContnt}
                    {probContnt}

                    <Grid.Column width={1} textAlign="center">
                      <Icon name="trash alternate" onClick={this.delNodule} id={delId} style={show3DVisualization ? { display: 'none' } : {}}></Icon>
                    </Grid.Column>
                  </Grid.Row>
                </Grid>
              </Accordion.Title>
              <Accordion.Content active={listsActiveIndex === idx} id="highlightAccordion">
                <Grid>
                  <Grid.Row>
                    <Grid.Column width={1}>
                      <div style={{ fontSize: '1rem', color: '#2ECC71' }}>{parseInt(inside.slice_idx) + 1}</div>
                    </Grid.Column>

                    <Grid.Column widescreen={6} computer={6}>
                      {'\xa0\xa0' + (ll / 10).toFixed(2) + '\xa0\xa0' + ' ×' + '\xa0\xa0' + (sl / 10).toFixed(2) + ' cm'}
                    </Grid.Column>
                    <Grid.Column widescreen={3} computer={3} textAlign="center">
                      {inside.volume !== undefined ? (Math.floor(inside.volume * 100) / 100).toFixed(2) + '\xa0cm³' : null}
                    </Grid.Column>
                    <Grid.Column widescreen={4} computer={5} textAlign="center">
                      {inside.huMin !== undefined && inside.huMax !== undefined ? inside.huMin + '~' + inside.huMax + 'HU' : null}
                    </Grid.Column>
                  </Grid.Row>
                  {/* <Grid.Column widescreen={3} computer={3} textAlign='center'>
                                                <select id={texId} style={selectStyle} defaultValue="" disabled>
                                                <option value="" disabled="disabled">选择亚型</option>
                                                </select>
                                            </Grid.Column> */}

                  <Grid.Row textAlign="center" verticalAlign="middle" centered>
                    <Grid.Column width={3}>
                      <select id={texId} style={selectStyle} value={inside.texture} onChange={this.onSelectTex}>
                        <option value="-1" disabled="disabled">
                          选择性质
                        </option>
                        <option value="1">磨玻璃</option>
                        <option value="2">实性</option>
                        <option value="3">半实性</option>
                      </select>
                    </Grid.Column>
                    <Grid.Column width={2} style={{ paddingLeft: '0px', paddingRight: '0px' }}>
                      表征:
                    </Grid.Column>
                    <Grid.Column width={11} style={{ paddingLeft: '0px', paddingRight: '0px' }}>
                      <Dropdown multiple selection options={options} id="dropdown" icon="add circle" name={'dropdown' + idx} value={representArray} onChange={this.representChange.bind(this)} />
                    </Grid.Column>
                  </Grid.Row>
                  <Grid.Row>
                    <Grid.Column width={12} style={{ textAlign: 'left' }}>
                      <Button size="mini" circular inverted icon="chart bar" title="特征分析" value={idx} onClick={this.featureAnalysis.bind(this, idx)}></Button>
                    </Grid.Column>
                    <Grid.Column width={4}>
                      <Button.Group size="mini" className="measureBtnGroup" style={show3DVisualization ? { display: 'none' } : {}}>
                        <Button basic icon title="擦除测量" active color="green" onClick={this.eraseMeasures.bind(this, idx)}>
                          <Icon inverted color="green" name="eraser"></Icon>
                        </Button>
                        {showMeasure ? (
                          <Button basic icon title="隐藏测量" active color="blue" onClick={this.toHideMeasures.bind(this, idx)}>
                            <Icon inverted color="blue" name="eye"></Icon>
                          </Button>
                        ) : (
                          <Button basic icon title="显示测量" active color="blue" onClick={this.toHideMeasures.bind(this, idx)}>
                            <Icon inverted color="blue" name="eye slash"></Icon>
                          </Button>
                        )}
                      </Button.Group>
                    </Grid.Column>
                  </Grid.Row>
                </Grid>

                {/* <div id={visualId} className='histogram'></div> */}
              </Accordion.Content>
            </div>
          )
          // }
        })
      if (lobesData && lobesData.length > 0) {
        lobeContent = lobesData.map((item, index) => {
          const inputRangeStyle = {
            backgroundSize: lobesController.lobesOpacities[index] * 100 + '%',
          }
          return (
            <div key={index} className="highlightTbl">
              <Accordion.Title onClick={this.setActive.bind(this, 0, index, item.index)} active={lobesController.lobesActive[index]}>
                <div className="accordion-title-index">{index + 1}</div>
                <div className="accordion-title-name">{item.lobeName}</div>
                <div className="accordion-title-volume">
                  {item.volume}cm<sup>3</sup>
                </div>
              </Accordion.Title>
              <Accordion.Content active={lobesController.lobesActive[index]}>
                <Grid>
                  <Grid.Row>
                    <Grid.Column width={6} textAlign="left">
                      体积:&nbsp;{item.volume}cm<sup>3</sup>
                    </Grid.Column>
                    <Grid.Column width={6} textAlign="left">
                      {`${item.lobeName}/全肺`}:&nbsp;{item.percent}%
                    </Grid.Column>
                  </Grid.Row>
                  <Grid.Row>
                    <Grid.Column width={16} className="accordion-content-opacity">
                      透明度
                      <Slider
                        style={{ width: '30%', marginLeft: '10px' }}
                        min={0}
                        max={100}
                        step={1}
                        value={lobesController.lobesOpacities[index]}
                        onChange={this.changeOpacity.bind(this, 0, index, item.index)}
                      />
                      <InputNumber
                        min={0}
                        max={100}
                        value={lobesController.lobesOpacities[index]}
                        onChange={this.changeOpacity.bind(this, 0, index, item.index)}
                        formatter={(value) => `${value}%`}
                        style={{ marginLeft: '10px' }}
                      />
                    </Grid.Column>
                  </Grid.Row>
                  <Grid.Row>
                    <Grid.Column width={12} style={{ textAlign: 'left' }}>
                      <Button size="mini" circular inverted icon="chart bar" title="特征分析"></Button>
                    </Grid.Column>
                    <Grid.Column width={4}>
                      {lobesController.lobesVisible[index] ? (
                        <Button size="mini" basic icon title="隐藏测量" active color="blue" onClick={this.setVisible.bind(this, 0, index, item.index)}>
                          <Icon inverted color="blue" name="eye"></Icon>
                        </Button>
                      ) : (
                        <Button size="mini" basic icon title="显示测量" active color="blue" onClick={this.setVisible.bind(this, 0, index, item.index)}>
                          <Icon inverted color="blue" name="eye slash"></Icon>
                        </Button>
                      )}
                    </Grid.Column>
                  </Grid.Row>
                </Grid>
              </Accordion.Content>
            </div>
          )
        })
      }
      if (tubularData && tubularData.length > 0) {
        tubularContent = tubularData.map((item, index) => {
          return (
            <div key={index} className="highlightTbl">
              <Accordion.Title onClick={this.setActive.bind(this, 1, index, item.index)} active={tubularController.tubularActive[index]}>
                <div className="accordion-title-index">{index + 1}</div>
                <div className="accordion-title-name">{item.name}</div>
                <div className="accordion-title-volume">
                  100cm<sup>3</sup>
                </div>
              </Accordion.Title>
              <Accordion.Content active={tubularController.tubularActive[index]}>
                <Grid>
                  <Grid.Row>
                    <Grid.Column width={6} textAlign="left">
                      体积:&nbsp;100cm<sup>3</sup>
                    </Grid.Column>
                    <Grid.Column width={3} textAlign="left"></Grid.Column>
                  </Grid.Row>
                  <Grid.Row>
                    <Grid.Column width={16} className="accordion-content-opacity">
                      透明度
                      <Slider
                        style={{ width: '30%', marginLeft: '10px' }}
                        min={0}
                        max={100}
                        step={1}
                        value={tubularController.tubularOpacities[index]}
                        onChange={this.changeOpacity.bind(this, 1, index, item.index)}
                      />
                      <InputNumber
                        min={0}
                        max={100}
                        value={tubularController.tubularOpacities[index]}
                        onChange={this.changeOpacity.bind(this, 1, index, item.index)}
                        formatter={(value) => `${value}%`}
                        style={{ marginLeft: '10px' }}
                      />
                    </Grid.Column>
                  </Grid.Row>
                  <Grid.Row>
                    <Grid.Column width={12} style={{ textAlign: 'left' }}>
                      <Button size="mini" circular inverted icon="chart bar" title="特征分析"></Button>
                    </Grid.Column>
                    <Grid.Column width={4}>
                      {tubularController.tubularVisible[index] ? (
                        <Button size="mini" basic icon title="隐藏测量" active color="blue" onClick={this.setVisible.bind(this, 1, index, item.index)}>
                          <Icon inverted color="blue" name="eye"></Icon>
                        </Button>
                      ) : (
                        <Button size="mini" basic icon title="显示测量" active color="blue" onClick={this.setVisible.bind(this, 1, index, item.index)}>
                          <Icon inverted color="blue" name="eye slash"></Icon>
                        </Button>
                      )}
                    </Grid.Column>
                  </Grid.Row>
                </Grid>
              </Accordion.Content>
            </div>
          )
        })
      }
      visualContent = this.state.boxes.map((inside, idx) => {
        const visualId = 'visual-' + inside.nodule_no
        const btnId = 'closeButton-' + inside.nodule_no
        return (
          <div id={visualId} className="histogram" key={idx}>
            {/* <button id={btnId} className='closeVisualContent' onClick={this.closeVisualContent}>×</button> */}
          </div>
        )
      })

      return (
        <div id="cornerstone">
          <Grid className="corner-container">
            <Grid.Row className="corner-top-row">
              <Menu className="corner-header">
                <Menu.Item id="menu-item-logo">
                  {/* <Image src={src1} avatar size="mini" /> */}
                  <a id="sys-name" href="/searchCase">
                    肺结节CT影像辅助检测软件
                  </a>
                  {menuScrollable && menuNowPage > 1 ? (
                    <FontAwesomeIcon icon={faChevronLeft} onClick={this.onMenuPageUp.bind(this)} className="menu-item-buttons-direction direction-page-up" />
                  ) : (
                    <></>
                  )}
                </Menu.Item>
                <Menu.Item
                  id="menu-item-buttons"
                  style={{
                    transform: `translateX(${-menuTransform}px)`,
                  }}>
                  <Button.Group>
                    <Button
                      // inverted
                      // color='black'
                      onClick={this.toPulmonary}
                      content="肺窗"
                      className="hubtn"
                    />
                    <Button
                      // inverted
                      // color='blue'
                      onClick={this.toBoneWindow} //骨窗窗宽窗位函数
                      content="骨窗"
                      className="hubtn"
                    />
                    <Button
                      // inverted
                      // color='blue'
                      onClick={this.toVentralWindow} //腹窗窗宽窗位函数
                      content="腹窗"
                      className="hubtn"
                    />
                    <Button
                      // inverted
                      // color='blue'
                      onClick={this.toMedia}
                      content="纵隔窗"
                      className="hubtn"
                    />
                    {/* <Button
                                        inverted
                                        color='blue'
                                        onClick={this.toMedia}
                                        className='hubtn'
                                        >自定义</Button> */}
                    {/* <Popup
                                    trigger={
                                        <Button
                                        // inverted
                                        // color='blue'
                                        // onClick={this.toMedia}
                                        className='hubtn'
                                        >自定义</Button>
                                    }
                                    content={
                                        <Form>
                                            <Form.Input
                                            label={`窗宽WW: ${wwDefine}`}
                                            min={100}
                                            max={2000}
                                            name='wwDefine'
                                            onChange={this.handleSliderChange}
                                            step={100}
                                            type='range'
                                            value={wwDefine}
                                            className='wwinput'
                                            />
                                            <Form.Input
                                            label={`窗位WC: ${wcDefine}`}
                                            min={-1000}
                                            max={2000}
                                            name='wcDefine'
                                            onChange={this.wcSlider}
                                            step={100}
                                            type='range'
                                            value={wcDefine}
                                            />
                                        </Form>
                                    }
                                    on='click'
                                    position='bottom center'
                                    id='defWindow'
                                    />                                                */}
                  </Button.Group>
                  <span className="menu-line"></span>
                  {show3DVisualization ? (
                    <>
                      <Button.Group hidden={!show3DVisualization}>
                        {MPR ? (
                          <>
                            <Button icon className="funcbtn" hidden={!MPR} onClick={this.handleFuncButton.bind(this, 'STMPR')} title="取消MPR">
                              <Icon className="icon-custom icon-custom-mpr-hide" size="large" />
                            </Button>
                            <Button icon className="funcbtn" onClick={this.handleFuncButton.bind(this, 'RC')} title="重置相机" description="reset camera">
                              <Icon name="redo" size="large" />
                            </Button>
                            {/* <Button icon className='funcbtn' active={crosshairsTool} onClick={this.handleFuncButton.bind(this, "TC")} title="十字线" description="toggle crosshairs"><Icon name='plus' size='large'/></Button> */}
                            <Button icon className="funcbtn" hidden={!displayCrosshairs} onClick={this.handleFuncButton.bind(this, 'HC')} title="隐藏十字线" description="hidden crosshairs">
                              <Icon className="icon-custom icon-custom-HC" size="large" />
                            </Button>
                            <Button icon className="funcbtn" hidden={displayCrosshairs} onClick={this.handleFuncButton.bind(this, 'SC')} title="显示十字线" description="show crosshairs">
                              <Icon className="icon-custom icon-custom-SC" size="large" />
                            </Button>

                            {/* <Button icon className="funcbtn" hidden={!painting} onClick={this.handleFuncButton.bind(this, 'EP')} title="停止勾画" description="end painting">
                              <Icon name="window close outline" size="large" />
                            </Button>
                            <Button icon className="funcbtn" hidden={painting} onClick={this.handleFuncButton.bind(this, 'BP')} title="开始勾画" description="begin painting">
                              <Icon name="paint brush" size="large" />
                            </Button>
                            <Button icon className="funcbtn" hidden={!painting} active={!erasing} onClick={this.handleFuncButton.bind(this, 'DP')} title="勾画" description="do painting">
                              <Icon name="paint brush" size="large" />
                            </Button>
                            <Button icon className="funcbtn" hidden={!painting} active={erasing} onClick={this.handleFuncButton.bind(this, 'DE')} title="擦除" description="do erasing">
                              <Icon name="eraser" size="large" />
                            </Button>
                            <Popup
                              on="click"
                              trigger={
                                <Button icon className="funcbtn" hidden={!painting}>
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
                                <Button icon className="funcbtn" hidden={!painting}>
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
                            </Popup> */}
                            <span className="menu-line"></span>
                            {CPR ? (
                              <>
                                <Button icon className="funcbtn" onClick={this.handleFuncButton.bind(this, 'STCPR')} title="取消CPR" hidden={!CPR}>
                                  <Icon name="window close outline" size="large" />
                                </Button>
                                <Button icon className="funcbtn" onClick={this.handleFuncButton.bind(this, 'RA')} title="重建气道" description="reconstruct airway">
                                  <Icon className="icon-custom icon-custom-RA" size="large" />
                                </Button>
                              </>
                            ) : (
                              <Button icon className="funcbtn" onClick={this.handleFuncButton.bind(this, 'CPR')} title="CPR" hidden={CPR}>
                                <Icon className="icon-custom icon-custom-CPR" size="large" />
                              </Button>
                            )}
                          </>
                        ) : (
                          <>
                            <Button icon className="funcbtn" hidden={MPR} onClick={this.handleFuncButton.bind(this, 'MPR')} title="MPR">
                              <Icon className="icon-custom icon-custom-mpr-show" size="large" />
                            </Button>
                          </>
                        )}
                        <Button icon onClick={this.onShowStudyList.bind(this)} className="funcbtn" title="历史检查">
                          <Icon name="history" size="large"></Icon>
                        </Button>
                        <Button icon title="隐藏3D" className="funcbtn" onClick={this.hide3D.bind(this)}>
                          <Icon className="icon-custom icon-custom-hide-3d" size="large"></Icon>
                        </Button>
                      </Button.Group>
                    </>
                  ) : (
                    <>
                      <Button.Group>
                        <Button
                          // inverted
                          // color='blue'
                          icon
                          title="灰度反转"
                          // style={{width:55,height:60,fontSize:14,fontSize:14}}
                          onClick={this.imagesFilp}
                          className="funcbtn">
                          <Icon name="adjust" size="large"></Icon>
                        </Button>
                        <Button
                          // inverted
                          // color='blue'
                          icon
                          title="放大"
                          // style={{width:55,height:60,fontSize:14,fontSize:14}}
                          onClick={this.ZoomIn}
                          className="funcbtn">
                          <Icon name="search plus" size="large"></Icon>
                        </Button>
                        <Button
                          // inverted
                          // color='blue'
                          icon
                          title="缩小"
                          // style={{width:55,height:60,fontSize:14}}
                          onClick={this.ZoomOut}
                          className="funcbtn">
                          <Icon name="search minus" size="large"></Icon>
                        </Button>
                        <Button icon onClick={this.reset} className="funcbtn" title="刷新">
                          <Icon name="repeat" size="large"></Icon>
                        </Button>
                        {!this.state.isPlaying ? (
                          <Button icon onClick={this.playAnimation} className="funcbtn" title="播放动画">
                            <Icon name="play" size="large"></Icon>
                          </Button>
                        ) : (
                          <Button icon onClick={this.pauseAnimation} className="funcbtn" title="暂停动画">
                            <Icon name="pause" size="large"></Icon>
                          </Button>
                        )}
                        {/* <Button icon onClick={this.cache} className='funcbtn' title='缓存'><Icon id="cache-button" name='coffee' size='large'></Icon></Button> */}
                        {/* <Modal
                                        basic
                                        open={cacheModal}
                                        size='small'
                                        trigger={<Button icon onClick={this.cache} className='funcbtn' title='缓存'><Icon id="cache-button" name='coffee' size='large'></Icon></Button>}
                                        >
                                        <Header icon>
                                            <Icon name='archive' />
                                            影像缓存中...
                                        </Header>
                                        <Modal.Content>
                                            <Progress value={this.state.currentIdx+1} total={this.state.imageIds.length} progress='ratio'/>
                                        </Modal.Content>
                                        </Modal> */}
                        {/* {({ state, setState }) => (
                                        <Grid>
                                        <div>
                                            <pre>{JSON.stringify(state, null, 2)}</pre>
                                        </div>
                                        <div style={{ maxWidth: '300px', margin: '0 auto' }}>
                                            <CineDialog
                                            {...state}
                                            onClickSkipToStart={() =>
                                                setState({ lastChange: 'Clicked SkipToStart' })
                                            }
                                            onClickSkipToEnd={() =>
                                                setState({ lastChange: 'Clicked SkipToEnd' })
                                            }
                                            onClickNextButton={() => setState({ lastChange: 'Clicked Next' })}
                                            onClickBackButton={() => setState({ lastChange: 'Clicked Back' })}
                                            onLoopChanged={value => setState({ isLoopEnabled: value })}
                                            onFrameRateChanged={value => setState({ cineFrameRate: value })}
                                            onPlayPauseChanged={() => setState({ isPlaying: !state.isPlaying })}
                                            />
                                        </div>
                                        </Grid>
                                    )} */}
                        {showNodules ? (
                          <Button icon onClick={this.toHidebox} className="funcbtn" id="hideNodule" title="隐藏结节">
                            <Icon id="cache-button" name="eye slash" size="large"></Icon>
                          </Button>
                        ) : (
                          <Button icon onClick={this.toHidebox} className="funcbtn" id="showNodule" title="显示结节">
                            <Icon id="cache-button" name="eye" size="large"></Icon>
                          </Button>
                        )}
                        {/* <Button icon onClick={this.toHidebox} className="funcbtn" id="showNodule" title="显示结节">
                          <Icon id="cache-button" name="eye" size="large"></Icon>
                        </Button>
                        <Button icon onClick={this.toHidebox} className="funcbtn" id="hideNodule" title="隐藏结节">
                          <Icon id="cache-button" name="eye slash" size="large"></Icon>
                        </Button> */}
                        {showInfo ? (
                          <Button icon onClick={this.toHideInfo} className="funcbtn" id="hideInfo" title="隐藏信息">
                            <Icon id="cache-button" name="delete calendar" size="large"></Icon>
                          </Button>
                        ) : (
                          <Button icon onClick={this.toHideInfo} className="funcbtn" id="showInfo" title="显示信息">
                            <Icon id="cache-button" name="content" size="large"></Icon>
                          </Button>
                        )}
                        {/* <Button icon onClick={this.toHideInfo} className="funcbtn" id="showInfo" title="显示信息">
                          <Icon id="cache-button" name="content" size="large"></Icon>
                        </Button>
                        <Button icon onClick={this.toHideInfo} className="funcbtn" id="hideInfo" title="隐藏信息">
                          <Icon id="cache-button" name="delete calendar" size="large"></Icon>
                        </Button> */}

                        {/* <Button
                  onClick={() => {
                    this.setState({ immersive: true });
                  }}
                  icon
                  title="沉浸模式"
                  className="funcbtn"
                >
                  <Icon name="expand arrows alternate" size="large"></Icon>
                </Button> */}
                      </Button.Group>
                      <span className="menu-line"></span>
                      <Button.Group>
                        {menuTools === 'anno' ? (
                          <Button icon onClick={this.startAnnos} title="标注" className="funcbtn" active>
                            <Icon name="edit" size="large"></Icon>
                          </Button>
                        ) : (
                          <Button icon onClick={this.startAnnos} title="标注" className="funcbtn">
                            <Icon name="edit" size="large"></Icon>
                          </Button>
                        )}
                        {menuTools === 'bidirect' ? (
                          <Button icon onClick={this.bidirectionalMeasure} title="测量" className="funcbtn" active>
                            <Icon name="crosshairs" size="large"></Icon>
                          </Button>
                        ) : (
                          <Button icon onClick={this.bidirectionalMeasure} title="测量" className="funcbtn">
                            <Icon name="crosshairs" size="large"></Icon>
                          </Button>
                        )}
                        {menuTools === 'length' ? (
                          <Button icon onClick={this.lengthMeasure} title="长度" className="funcbtn" active>
                            <Icon name="arrows alternate vertical" size="large"></Icon>
                          </Button>
                        ) : (
                          <Button icon onClick={this.lengthMeasure} title="长度" className="funcbtn">
                            <Icon name="arrows alternate vertical" size="large"></Icon>
                          </Button>
                        )}
                        {menuTools === 'slide' ? (
                          <Button icon title="切换切片" onClick={this.slide} className="funcbtn" active>
                            <Icon name="sort" size="large"></Icon>
                          </Button>
                        ) : (
                          <Button icon title="切换切片" onClick={this.slide} className="funcbtn">
                            <Icon name="sort" size="large"></Icon>
                          </Button>
                        )}

                        {menuTools === 'wwwc' ? (
                          <Button icon title="窗宽窗位" onClick={this.wwwcCustom} className="funcbtn" active>
                            <Icon name="sliders" size="large"></Icon>
                          </Button>
                        ) : (
                          <Button icon title="窗宽窗位" onClick={this.wwwcCustom} className="funcbtn">
                            <Icon name="sliders" size="large"></Icon>
                          </Button>
                        )}
                        {this.state.readonly ? (
                          <Button icon title="提交" onClick={this.submit} className="funcbtn">
                            <Icon name="upload" size="large"></Icon>
                          </Button>
                        ) : (
                          // <Button icon title='暂存' onClick={this.temporaryStorage} className='funcbtn'><Icon name='inbox' size='large'></Icon></Button>
                          <Button icon title="暂存" onClick={this.temporaryStorage} className="funcbtn">
                            <Icon name="upload" size="large"></Icon>
                          </Button>
                        )}
                        {this.state.readonly ? null : (
                          <Button icon title="清空标注" onClick={this.clearUserNodule.bind(this)} className="funcbtn">
                            <Icon name="user delete" size="large"></Icon>
                          </Button>
                        )}
                        <Button icon onClick={this.onShowStudyList.bind(this)} className="funcbtn" title="历史检查">
                          <Icon name="history" size="large"></Icon>
                        </Button>
                        <Button icon title="显示3D" className="funcbtn" onClick={this.show3D.bind(this)}>
                          <Icon className="icon-custom icon-custom-show-3d" size="large"></Icon>
                        </Button>
                      </Button.Group>
                    </>
                  )}
                </Menu.Item>

                <Menu.Item id="menu-item-user">
                  <Dropdown text={welcome}>
                    <Dropdown.Menu id="logout-menu">
                      <Dropdown.Item icon="home" text="我的主页" onClick={this.toHomepage} />
                      {/* <Dropdown.Item
                    icon="write"
                    text="留言"
                    onClick={this.handleWriting}
                  /> */}
                      <Dropdown.Item icon="log out" text="注销" onClick={this.handleLogout} />
                    </Dropdown.Menu>
                  </Dropdown>
                  {menuScrollable && menuNowPage < menuTotalPages ? (
                    <FontAwesomeIcon icon={faChevronRight} onClick={this.onMenuPageDown.bind(this)} className="menu-item-buttons-direction direction-page-down" />
                  ) : (
                    <></>
                  )}
                </Menu.Item>
              </Menu>
            </Grid.Row>
            <Grid.Row className="corner-bottom-row" columns={3} style={{ height: bottomRowHeight }}>
              <Sidebar.Pushable style={{ overflow: 'hidden', width: '100%' }}>
                <Sidebar visible={studyListShowed} animation={'uncover'}>
                  <div className="preview">
                    {dateSeries.map((serie, index) => {
                      var validStatus = serie.validInfo.status
                      var validInfo = serie.validInfo.message
                      var statusIcon = ''
                      if (validStatus === 'failed') {
                        if (validInfo === 'Files been manipulated') {
                          statusIcon = (
                            <div>
                              <CloseCircleOutlined style={{ color: 'rgba(219, 40, 40)' }} />
                              &nbsp;
                              <p>影像发生篡改</p>
                            </div>
                          )
                        } else if (validInfo === 'Errors occur during preprocess') {
                          statusIcon = (
                            <div>
                              <CloseCircleOutlined style={{ color: 'rgba(219, 40, 40)' }} />
                              &nbsp;
                              <p>软件预处理出错</p>
                            </div>
                          )
                        } else if (validInfo === 'caseId not found') {
                          statusIcon = (
                            <div>
                              <CloseCircleOutlined style={{ color: 'rgba(219, 40, 40)' }} />
                              &nbsp;
                              <p>数据未入库</p>
                            </div>
                          )
                        }
                      } else if (validStatus === 'ok') {
                        statusIcon = <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      } else {
                        statusIcon = <SyncOutlined spin />
                      }
                      let previewId = 'preview-' + index
                      let keyId = 'key-' + index
                      // console.log('render',previewId)
                      return (
                        <Card onClick={(e) => this.handleClickScreen(e, serie.href, validStatus)} key={keyId}>
                          <div className="preview-canvas" id={previewId}></div>
                          <Card.Content>
                            {statusIcon}
                            <Card.Description>{serie.date + '\n ' + serie.Description}</Card.Description>
                          </Card.Content>
                        </Card>
                      )
                    })}
                  </div>
                </Sidebar>
                <Sidebar.Pusher style={{ height: '100%' }}>
                  <div className={'ct-info' + (studyListShowed ? ' ct-info-contract' : '') + (verticalMode ? ' ct-info-vertical' : ' ct-info-horizontal')}>
                    <div
                      className={
                        'corner-center-block' + (studyListShowed ? ' corner-center-contract-block' : '') + (verticalMode ? ' corner-center-vertical-block' : ' corner-center-horizontal-block')
                      }>
                      {show3DVisualization ? (
                        <div className="segment-container center-viewport-panel" id="segment-container" data-aos="flip-left" data-aos-duration="1500">
                          <div style={{ width: viewerWidth, height: viewerHeight }}>{panel}</div>
                        </div>
                      ) : (
                        <Grid celled style={{ margin: 0 }} className="center-viewport-panel" id="cor-container" data-aos="flip-left" data-aos-duration="1500">
                          {/* <Grid.Row columns={2} id='canvas-column' style={{height:this.state.windowHeight*37/40}}> */}
                          <Grid.Row columns={2} id="canvas-column">
                            <Grid.Column width={15} className="canvas-style" id="canvas-border">
                              {/* <div className='canvas-style' id='canvas-border'> */}
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
                                {dicomTagPanel}
                              </div>

                              {/* </div> */}
                            </Grid.Column>
                            <Grid.Column width={1}>
                              <Slider
                                id="antd-slide"
                                vertical
                                reverse
                                tipFormatter={null}
                                marks={sliderMarks}
                                value={this.state.currentIdx + 1}
                                onChange={this.handleRangeChange}
                                // onAfterChange={this.handleRangeChange.bind(this)}
                                min={1}
                                step={1}
                                max={this.state.imageIds.length}></Slider>
                            </Grid.Column>
                          </Grid.Row>
                        </Grid>
                      )}

                      {/* <div className='antd-slider'> */}

                      {/* </div> */}
                      {visualContent}
                      <button id="closeVisualContent" className="closeVisualContent-cross" onClick={this.closeVisualContent}>
                        ×
                      </button>
                    </div>
                    <div className={'corner-list-block' + (studyListShowed ? ' corner-list-contract-block' : '') + (verticalMode ? ' corner-list-vertical-block' : ' corner-list-horizontal-block')}>
                      {show3DVisualization ? (
                        // <Tab className="list-tab" panes={panes3D} data-aos="fade-left" data-aos-duration="1500" />
                        <div className={'threed-card-container'} data-aos="fade-left" data-aos-duration="1500">
                          <Tabs type="card" defaultActiveKey={1} size="small">
                            <TabPane tab={noduleNumTab} key="1">
                              <div id="elec-table">
                                {this.state.boxes.length === 0 ? (
                                  <div
                                    style={{
                                      height: '100%',
                                      background: '#021c38',
                                      display: 'flex',
                                      justifyContent: 'center',
                                      alignItems: 'center',
                                    }}>
                                    <Header as="h2" inverted>
                                      <Icon name="low vision" />
                                      <Header.Content>未检测出任何结节</Header.Content>
                                    </Header>
                                  </div>
                                ) : (
                                  <Accordion styled id="cornerstone-accordion" fluid onDoubleClick={this.doubleClickListItems.bind(this)}>
                                    {tableContent}
                                  </Accordion>
                                )}
                              </div>
                            </TabPane>
                            <TabPane tab={'肺叶'} key="2">
                              <div id="elec-table">
                                <Accordion styled id="lobe-accordion" fluid>
                                  {lobeContent}
                                </Accordion>
                              </div>
                              {/* <div className="segment-list-block">
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
                      </div> */}
                            </TabPane>
                            <TabPane tab={'气管和血管'} key="3">
                              <div id="elec-table">
                                <Accordion styled id="tubular-accordion" fluid>
                                  {tubularContent}
                                </Accordion>
                              </div>
                              {/* <div className="segment-list-block">
                        <Table celled selectable inverted>
                          <Table.Header>
                            <Table.Row>
                              <Table.HeaderCell>名称</Table.HeaderCell>
                              <Table.HeaderCell>长度</Table.HeaderCell>
                            </Table.Row>
                          </Table.Header>
                          <Table.Body>{tubularInfo}</Table.Body>
                        </Table>
                        <div className="segment-list-operation" style={segmentListOperationStyles}>
                          {tubularOp}
                        </div>
                      </div> */}
                            </TabPane>
                          </Tabs>
                        </div>
                      ) : (
                        <div className={'ct-list-container'}>
                          <div
                            className={'nodule-card-container' + (verticalMode ? ' nodule-card-container-vertical' : ' nodule-card-container-horizontal')}
                            data-aos="fade-down"
                            data-aos-duration="1500">
                            <Tabs type="card" animated defaultActiveKey={1} size="small">
                              <TabPane tab={noduleNumTab} key="1">
                                <div
                                  id="elec-table"
                                  style={{
                                    height: (this.state.windowHeight * 1) / 2,
                                  }}>
                                  {this.state.boxes.length === 0 ? (
                                    <div
                                      style={{
                                        height: '100%',
                                        background: '#021c38',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                      }}>
                                      <Header as="h2" inverted>
                                        <Icon name="low vision" />
                                        <Header.Content>未检测出任何结节</Header.Content>
                                      </Header>
                                    </div>
                                  ) : (
                                    <Accordion styled id="cornerstone-accordion" fluid onDoubleClick={this.doubleClickListItems.bind(this)}>
                                      {tableContent}
                                    </Accordion>
                                  )}
                                </div>
                              </TabPane>
                              {/* <TabPane tab={inflammationTab} key="2">
                                                        Content of Tab Pane 2
                                                        </TabPane>
                                                        <TabPane tab={lymphnodeTab} key="3">
                                                        Content of Tab Pane 3
                                                        </TabPane> */}
                            </Tabs>
                          </div>

                          <div
                            id="report"
                            className={'report-tab-container' + (verticalMode ? ' report-tab-container-vertical' : ' report-tab-container-horizontal')}
                            data-aos="fade-up"
                            data-aos-duration="1500">
                            <Tab
                              menu={{
                                borderless: false,
                                inverted: false,
                                attached: true,
                                tabular: true,
                                size: 'huge',
                              }}
                              panes={panes}
                              onTabChange={this.onReportTabChange.bind(this)}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Sidebar.Pusher>
              </Sidebar.Pushable>
              {/* <div className="corner-preview-block">
                <div
                    className={'study-browser-option-block' + (enterStudyListOption ? ' study-browser-option-hover' : '')}
                    onMouseEnter={this.enterStudyListOption.bind(this)}
                    onMouseLeave={this.leaveStudyListOption.bind(this)}>
                    {showStudyList ? (
                      <FontAwesomeIcon className={'study-browser-option-icon'} icon={faChevronLeft} onClick={this.hideStudyList.bind(this)} />
                    ) : (
                      <FontAwesomeIcon className={'study-browser-option-icon'} icon={faChevronRight} onClick={this.showStudyList.bind(this)} />
                    )}
                  </div>
                </div> */}
              {/* <Grid.Column width={2}>
                
              </Grid.Column> */}
            </Grid.Row>
          </Grid>
          {/* </div> */}
        </div>
      )
      // }
    } else {
      return (
        <div
          style={{
            height: 1415 + 'px',
            backgroundColor: '#03031b',
          }}>
          <div id="immersive-panel">
            <div className="immersive-header">
              <a
                onClick={() => {
                  this.setState({ immersive: false })
                }}
                id="immersive-return">
                返回普通视图
              </a>
            </div>

            <div
              id="origin-canvas"
              style={immersiveStyle}
              ref={(input) => {
                this.element = input
              }}>
              <canvas className="cornerstone-canvas" id="canvas" />
              {/* <canvas className="cornerstone-canvas" id="length-canvas"/> */}
              <div style={topLeftStyle}>{dicomTag.string('x00100010')}</div>
              <div
                style={{
                  position: 'absolute',
                  color: 'white',
                  top: '20px',
                  left: '-95px',
                }}>
                {dicomTag.string('x00101010')} {dicomTag.string('x00100040')}
              </div>
              <div
                style={{
                  position: 'absolute',
                  color: 'white',
                  top: '35px',
                  left: '-95px',
                }}>
                {dicomTag.string('x00100020')}
              </div>
              <div
                style={{
                  position: 'absolute',
                  color: 'white',
                  top: '50px',
                  left: '-95px',
                }}>
                {dicomTag.string('x00185100')}
              </div>
              <div
                style={{
                  position: 'absolute',
                  color: 'white',
                  top: '65px',
                  left: '-95px',
                }}>
                IM: {this.state.currentIdx + 1} / {this.state.imageIds.length}
              </div>
              <div style={topRightStyle}>{dicomTag.string('x00080080')}</div>
              <div
                style={{
                  position: 'absolute',
                  color: 'white',
                  top: '20px',
                  right: '-95px',
                }}>
                ACC No: {dicomTag.string('x00080050')}
              </div>
              <div
                style={{
                  position: 'absolute',
                  color: 'white',
                  top: '35px',
                  right: '-95px',
                }}>
                {dicomTag.string('x00090010')}
              </div>
              <div
                style={{
                  position: 'absolute',
                  color: 'white',
                  top: '50px',
                  right: '-95px',
                }}>
                {dicomTag.string('x0008103e')}
              </div>
              <div
                style={{
                  position: 'absolute',
                  color: 'white',
                  top: '65px',
                  right: '-95px',
                }}>
                {dicomTag.string('x00080020')}
              </div>
              <div
                style={{
                  position: 'absolute',
                  color: 'white',
                  top: '80px',
                  right: '-95px',
                }}>
                T: {dicomTag.string('x00180050')}
              </div>
              <div
                style={{
                  position: 'absolute',
                  color: 'white',
                  bottom: '20px',
                  left: '-95px',
                }}>
                Offset: {this.state.viewport.translation['x'].toFixed(3)}, {this.state.viewport.translation['y'].toFixed(3)}
              </div>
              <div style={bottomLeftStyle}>Zoom: {Math.round(this.state.viewport.scale * 100)} %</div>
              <div style={bottomRightStyle}>
                WW/WC: {Math.round(this.state.viewport.voi.windowWidth)}/ {Math.round(this.state.viewport.voi.windowCenter)}
              </div>
            </div>
          </div>

          <div>
            <div id="immersive-button-container">
              <Button
                color="blue"
                onClick={this.toPulmonary}
                style={{
                  marginRight: 30 + 'px',
                }}>
                肺窗
              </Button>
              <Button
                color="blue"
                onClick={this.toMedia}
                style={{
                  marginRight: 30 + 'px',
                }}>
                纵隔窗
              </Button>
              <Button color="blue" onClick={this.reset}>
                重置
              </Button>
            </div>
          </div>
        </div>
      )
    }
  }

  drawBoxes(box) {
    const canvas = document.getElementById('canvas')
    const context = canvas.getContext('2d')
    // ROIcontext.globalCompositeOperation = "copy"

    const xCenter = box.x1 + (box.x2 - box.x1) / 2
    const yCenter = box.y1 + (box.y2 - box.y1) / 2
    const width = box.x2 - box.x1
    const height = box.y2 - box.y1
    if (box.highlight === false || box.highlight === undefined) {
      context.setLineDash([])
      context.strokeStyle = 'yellow'
      context.fillStyle = 'yellow'
    } else {
      context.strokeStyle = 'blue'
      context.fillStyle = 'blue'
    }
    context.beginPath()
    const new_y1 = yCenter - height / 2
    context.rect(box.x1, box.y1, width, height)
    context.lineWidth = 1
    context.stroke()
    if (box.nodule_no != undefined) {
      context.fillText(parseInt(box.nodule_no) + 1, xCenter - 3, new_y1 - 15)
    }
    context.closePath()
  }

  // drawMask(box){
  //     // const canvas_ROI = document.getElementById('canvasROI')
  //     const ROIbox = box.mask_array
  //     // var ROIcontext = canvas_ROI.getContext("2d")
  //     const canvas = document.getElementById("canvas")
  //     const context = canvas.getContext('2d')
  //     context.mozImageSmoothingEnabled = false;
  //     context.webkitImageSmoothingEnabled = false;
  //     context.msImageSmoothingEnabled = false;
  //     context.imageSmoothingEnabled = false;
  //     context.oImageSmoothingEnabled = false;
  //     const width = canvas.width
  //     const height = canvas.height
  //     console.log('Imagedata',width,height)

  //     // var ROIData = context.createImageData(512,512)
  //     var ROIData = context.getImageData(0,0,width,height);
  //     // context.scale(0.625,0.625)
  //     console.log('Imagedata',ROIData)
  //     context.globalCompositeOperation = 'source-over'
  //     for(var i=0; i<ROIbox[0].length;i++){
  //         ROIData.data[(ROIbox[0][i]*512+ROIbox[1][i])*4 + 0] = 100
  //         ROIData.data[(ROIbox[0][i]*512+ROIbox[1][i])*4 + 1] = 255
  //         ROIData.data[(ROIbox[0][i]*512+ROIbox[1][i])*4 + 2] = 255
  //         ROIData.data[(ROIbox[0][i]*512+ROIbox[1][i])*4 + 3] = 100
  //     }
  //     console.log('ROIdata', ROIData)

  //     context.putImageData(ROIData,0,0)
  //     context.scale(1.6,1.6)
  //     // ROIcontext.beginPath()
  //     // ROIcontext.strokeStyle = 'yellow'
  //     // ROIcontext.moveTo(10,110)
  //     // ROIcontext.lineTo(100,30)
  //     // ROIcontext.closePath()
  // }

  // drawMask(box){
  //     if(box.mask_array !== null && box.mask_array !== undefined){
  //         const maskCoord = box.mask_array
  //         const canvas = document.getElementById("canvas")
  //         const context = canvas.getContext('2d')
  //         context.lineWidth = 1
  //         context.strokeStyle = 'red'
  //         context.fillStyle = 'red'
  //         context.beginPath()
  //         context.moveTo(288,217)
  //         context.lineTo(288,218)
  //         context.stroke()
  //         context.closePath()
  //     }
  // }

  drawBidirection(box) {
    if (box.measure !== null && box.measure !== undefined) {
      const measureCoord = box.measure
      const ll = Math.sqrt(Math.pow(measureCoord.x1 - measureCoord.x2, 2) + Math.pow(measureCoord.y1 - measureCoord.y2, 2))
      const sl = Math.sqrt(Math.pow(measureCoord.x3 - measureCoord.x4, 2) + Math.pow(measureCoord.y3 - measureCoord.y4, 2))
      const radius = (box.x2 - box.x1) / 2
      const canvas = document.getElementById('canvas')
      const context = canvas.getContext('2d')
      context.lineWidth = 1
      context.strokeStyle = 'white'
      context.fillStyle = 'white'
      const x1 = measureCoord.x1
      const y1 = measureCoord.y1
      const x2 = measureCoord.x2
      const y2 = measureCoord.y2
      const x3 = measureCoord.x3
      const y3 = measureCoord.y3
      const x4 = measureCoord.x4
      const y4 = measureCoord.y4

      let anno_x = x1
      let anno_y = y1
      const dis = (x1 - box.x1) * (x1 - box.x1) + (y1 - box.y1) * (y1 - box.y1)
      for (var i = 2; i < 5; i++) {
        var x = 'x' + i
        var y = 'y' + i
        var t_dis = (measureCoord[x] - box.x1) * (measureCoord[x] - box.x1) + (measureCoord[y] - box.y1) * (measureCoord[y] - box.y1)
        if (t_dis < dis) {
          anno_x = measureCoord[x]
          anno_y = measureCoord[y]
        }
      }

      context.beginPath()
      context.moveTo(x1, y1)
      context.lineTo(x2, y2)
      // context.stroke()
      // context.beginPath()

      context.moveTo(x3, y3)
      context.lineTo(x4, y4)
      context.stroke()

      context.font = '10px Georgia'
      context.fillStyle = 'yellow'
      context.fillText('L:' + ll.toFixed(1) + 'mm', box.x1 + radius + 10, y1 - radius - 10)
      context.fillText('S:' + sl.toFixed(1) + 'mm', box.x1 + radius + 10, y1 - radius - 20)

      context.beginPath()
      context.setLineDash([3, 3])
      context.moveTo(anno_x - 2, anno_y - 2)
      context.lineTo(box.x1 + radius + 10, y1 - radius - 10)
      context.stroke()

      context.closePath()
    }
  }

  findCurrentArea(x, y) {
    // console.log('x, y', x, y)
    const lineOffset = 2
    // for (var i = 0; i < this.state.selectBoxes.length; i++) {
    //     const box = this.state.selectBoxes[i]
    for (var i = 0; i < this.state.boxes.length; i++) {
      const box = this.state.boxes[i]
      if (box.slice_idx == this.state.currentIdx) {
        const xCenter = box.x1 + (box.x2 - box.x1) / 2
        const yCenter = box.y1 + (box.y2 - box.y1) / 2
        const width = box.x2 - box.x1
        const height = box.y2 - box.y1
        const y1 = box.y1
        const x1 = box.x1
        const y2 = box.y2
        const x2 = box.x2
        if (x1 - lineOffset < x && x < x1 + lineOffset) {
          if (y1 - lineOffset < y && y < y1 + lineOffset) {
            return { box: i, pos: 'tl' }
          } else if (y2 - lineOffset < y && y < y2 + lineOffset) {
            return { box: i, pos: 'bl' }
            // } else if (yCenter - lineOffset < y && y < yCenter + lineOffset) {
          } else if (yCenter - height / 2 + lineOffset < y && y < yCenter + height / 2 - lineOffset) {
            return { box: i, pos: 'l' }
          }
        } else if (x2 - lineOffset < x && x < x2 + lineOffset) {
          if (y1 - lineOffset < y && y < y1 + lineOffset) {
            return { box: i, pos: 'tr' }
          } else if (y2 - lineOffset < y && y < y2 + lineOffset) {
            return { box: i, pos: 'br' }
            // } else if (yCenter - lineOffset < y && y < yCenter + lineOffset) {
          } else if (yCenter - height / 2 + lineOffset < y && y < yCenter + height / 2 - lineOffset) {
            return { box: i, pos: 'r' }
          }
          // } else if (xCenter - lineOffset < x && x < xCenter + lineOffset) {
        } else if (xCenter - width / 2 + lineOffset < x && x < xCenter + width / 2 - lineOffset) {
          if (y1 - lineOffset < y && y < y1 + lineOffset) {
            return { box: i, pos: 't' }
          } else if (y2 - lineOffset < y && y < y2 + lineOffset) {
            return { box: i, pos: 'b' }
          } else if (y1 - lineOffset < y && y < y2 + lineOffset) {
            return { box: i, pos: 'i' }
          }
        } else if (x1 - lineOffset < x && x < x2 + lineOffset) {
          if (y1 - lineOffset < y && y < y2 + lineOffset) {
            return { box: i, pos: 'i' }
          }
        }
      }
    }
    return { box: -1, pos: 'o' }
  }

  findMeasureArea(x, y) {
    const lineOffset = 2
    for (var i = 0; i < this.state.boxes.length; i++) {
      const box = this.state.boxes[i]
      // for (var i = 0; i < this.state.selectBoxes.length; i++) {
      //     const box = this.state.selectBoxes[i]
      if (box.slice_idx == this.state.currentIdx) {
        const xCenter = box.x1 + (box.x2 - box.x1) / 2
        const yCenter = box.y1 + (box.y2 - box.y1) / 2
        const width = box.x2 - box.x1
        const height = box.y2 - box.y1
        const y1 = box.y1
        const x1 = box.x1
        const y2 = box.y2
        const x2 = box.x2
        if (x1 - lineOffset < x && x < x2 + lineOffset && y1 - lineOffset < y && y < y2 + lineOffset) {
          // console.log('measure',box.measure.x == undefined)
          if (box.measure && box.measure.x1 != undefined) {
            if (box.measure.x1 - lineOffset < x && x < box.measure.x1 + lineOffset && box.measure.y1 - lineOffset < y && y < box.measure.y1 + lineOffset) {
              return { box: i, pos: 'ib', m_pos: 'sl' }
            } else if (box.measure.x2 - lineOffset < x && x < box.measure.x2 + lineOffset && box.measure.y2 - lineOffset < y && y < box.measure.y2 + lineOffset) {
              return { box: i, pos: 'ib', m_pos: 'el' }
            } else if (box.measure.x3 - lineOffset < x && x < box.measure.x3 + lineOffset && box.measure.y3 - lineOffset < y && y < box.measure.y3 + lineOffset) {
              return { box: i, pos: 'ib', m_pos: 'ss' }
            } else if (box.measure.x4 - lineOffset < x && x < box.measure.x4 + lineOffset && box.measure.y4 - lineOffset < y && y < box.measure.y4 + lineOffset) {
              return { box: i, pos: 'ib', m_pos: 'es' }
            } else if (box.measure.intersec_x - lineOffset < x && x < box.measure.intersec_x + lineOffset && box.measure.intersec_y - lineOffset < y && y < box.measure.intersec_y + lineOffset) {
              return { box: i, pos: 'ib', m_pos: 'cm' }
            }
          } else {
            console.log('om')
            return { box: i, pos: 'ib', m_pos: 'om' }
          }
        }
      }
    }
    return { box: -1, pos: 'ob', m_pos: 'om' }
  }

  drawLength(box) {
    const x1 = box.x1
    const y1 = box.y1
    const x2 = box.x2
    const y2 = box.y2
    const dis = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2)) / 10
    console.log('dis', dis)
    const canvas = document.getElementById('canvas')
    const context = canvas.getContext('2d')
    context.lineWidth = 1.5
    context.strokeStyle = 'yellow'
    context.fillStyle = 'yellow'
    context.beginPath()
    context.setLineDash([])
    context.moveTo(x1, y1)
    context.lineTo(x2, y2)
    context.stroke()

    context.beginPath()
    context.setLineDash([])
    context.arc(x1, y1, 1, 0, 2 * Math.PI)
    context.stroke()

    context.beginPath()
    context.setLineDash([])
    context.arc(x2, y2, 1, 0, 2 * Math.PI)
    context.stroke()

    context.font = '10px Georgia'
    context.fillStyle = 'yellow'
    if (x1 < x2) {
      context.fillText(dis.toFixed(2) + 'cm', x2 + 10, y2 - 10)
    } else {
      context.fillText(dis.toFixed(2) + 'cm', x1 + 10, y1 - 10)
    }

    context.closePath()
  }

  findLengthArea(x, y) {
    const lineOffset = 3
    for (var i = 0; i < this.state.lengthBox.length; i++) {
      const box = this.state.lengthBox[i]
      if (box.slice_idx === this.state.currentIdx) {
        if (box.x1 - lineOffset < x && box.x1 + lineOffset > x && box.y1 - lineOffset < y && box.y1 + lineOffset > y) {
          return { box: i, pos: 'ib', m_pos: 'ul' }
        } else if (box.x2 - lineOffset < x && box.x2 + lineOffset > x && box.y2 - lineOffset < y && box.y2 + lineOffset > y) {
          return { box: i, pos: 'ib', m_pos: 'dl' }
        }
      }
    }
    return { box: -1, pos: 'ob', m_pos: 'ol' }
  }

  handleRangeChange(e) {
    //console.log('slider',e)
    // this.setState({currentIdx: event.target.value - 1, imageId:
    // this.state.imageIds[event.target.value - 1]})
    // let style = $("<style>", {type:"text/css"}).appendTo("head");

    // style.text('#slice-slider::-webkit-slider-runnable-track{background:linear-gradient(90deg,#0033FF 0%,#000033 '+ (event.target.value -1)*100/this.state.imageIds.length+'%)}');
    this.refreshImage(false, this.state.imageIds[e - 1], e - 1)
  }
  handleRangeChangeAfter(e) {
    //console.log("slider after", e)
  }
  pixeldataSort(x, y) {
    if (x < y) {
      return -1
    } else if (x > y) {
      return 1
    } else {
      return 0
    }
  }

  noduleHist(x1, y1, x2, y2) {
    const currentImage = this.state.currentImage
    console.log('currentImage', currentImage)
    let pixelArray = []
    const imageTag = currentImage.data
    const pixeldata = currentImage.getPixelData()
    const intercept = imageTag.string('x00281052')
    const slope = imageTag.string('x00281053')
    console.log('createBoxHist', intercept, slope)

    for (var i = ~~x1; i <= x2; i++) {
      for (var j = ~~y1; j <= y2; j++) {
        pixelArray.push(parseInt(slope) * parseInt(pixeldata[512 * j + i]) + parseInt(intercept))
      }
    }
    console.log('pixelArray', pixelArray)
    pixelArray.sort(this.pixeldataSort)
    console.log('pixelArraySorted', pixelArray)
    // console.log('array',pixelArray)
    const data = pixelArray
    console.log('data', data)
    var map = {}
    for (var i = 0; i < data.length; i++) {
      var key = data[i]
      if (map[key]) {
        map[key] += 1
      } else {
        map[key] = 1
      }
    }
    Object.keys(map).sort(function (a, b) {
      return map[b] - map[a]
    })
    console.log('map', map)

    var ns = []
    var bins = []
    for (var key in map) {
      bins.push(parseInt(key))
      // ns.push(map[key])
    }
    bins.sort(this.pixeldataSort)

    for (var i = 0; i < bins.length; i++) {
      ns.push(map[bins[i]])
    }

    // for(var key in map){
    //     bins.push(parseInt(key))
    //     ns.push(map[key])
    // }
    console.log('bins', bins, ns)
    var obj = {}
    obj.bins = bins
    obj.n = ns
    return obj
  }

  createBox(x1, x2, y1, y2, slice_idx, nodule_idx) {
    console.log('coor', x1, x2, y1, y2)
    const imageId = this.state.imageIds[slice_idx]
    console.log('image', imageId)
    const nodule_hist = this.noduleHist(x1, y1, x2, y2)
    const newBox = {
      // "calcification": [], "lobulation": [],
      malignancy: -1,
      nodule_no: nodule_idx,
      patho: '',
      place: '',
      probability: 1,
      slice_idx: slice_idx,
      nodule_hist: nodule_hist,
      // "spiculation": [], "texture": [],
      x1: x1,
      x2: x2,
      y1: y1,
      y2: y2,
      highlight: false,
      diameter: 0.0,
      place: 0,
      modified: 1,
    }
    // let boxes = this.state.selectBoxes
    let boxes = this.state.boxes
    console.log('newBox', newBox)
    boxes.push(newBox)
    let measureStateList = this.state.measureStateList
    measureStateList.push(false)
    this.setState({ boxes: boxes, measureStateList: measureStateList })
    console.log('Boxes', this.state.boxes, this.state.measureStateList)

    // })
    this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
  }

  createLength(x1, x2, y1, y2, slice_idx) {
    const imageId = this.state.imageIds[slice_idx]
    const newLength = {
      slice_idx: slice_idx,
      x1: x1,
      x2: x2,
      y1: y1,
      y2: y2,
    }
    let lengthList = this.state.lengthBox
    lengthList.push(newLength)
    this.setState({ lengthBox: lengthList })
    this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
  }

  invertHandles(curBox) {
    var x1 = curBox.measure.x1
    var y1 = curBox.measure.y1
    var x2 = curBox.measure.x2
    var y2 = curBox.measure.y2
    var x3 = curBox.measure.x3
    var y3 = curBox.measure.y3
    var x4 = curBox.measure.x4
    var y4 = curBox.measure.y4
    var length = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2))
    var width = Math.sqrt((x3 - x4) * (x3 - x4) + (y3 - y4) * (y3 - y4))
    if (width > length) {
      curBox.measure.x1 = x3
      curBox.measure.y1 = y3
      curBox.measure.x2 = x4
      curBox.measure.y2 = y4
      curBox.measure.x3 = x2
      curBox.measure.y3 = y2
      curBox.measure.x4 = x1
      curBox.measure.y4 = y1
    }
    return curBox
  }

  //    createBidirectBox(x1, x2, y1, y2, slice_idx, nodule_idx){
  //     const newBox = {
  //         // "calcification": [], "lobulation": [],
  //         "malignancy": -1,
  //         "nodule_no": nodule_idx,
  //         "patho": "",
  //         "place": "",
  //         "probability": 1,
  //         "slice_idx": slice_idx,
  //         "nodule_hist":obj,
  //         // "spiculation": [], "texture": [],
  //         "x1": x1,
  //         "x2": x2,
  //         "y1": y1,
  //         "y2": y2,
  //         "highlight": false,
  //         "diameter":0.00,
  //         "place":0,
  //     }
  //    }

  onWheel(event) {
    console.log('onWheel')
    // this.preventMouseWheel(event)
    var delta = 0
    if (!event) {
      event = window.event
    }
    if (event.wheelDelta) {
      delta = event.wheelDelta / 120
      if (window.opera) {
        delta = -delta
      }
    } else if (event.detail) {
      delta = -event.detail / 3
    }
    // console.log('delta',delta)
    if (delta) {
      this.wheelHandle(delta)
    }
  }

  onMouseOver(event) {
    try {
      window.addEventListener('mousewheel', this.onWheel) || window.addEventListener('DOMMouseScroll', this.onWheel)
    } catch (e) {
      window.attachEvent('mousewheel', this.onWheel)
    }
  }

  wheelHandle(delta) {
    if (delta < 0) {
      //向下滚动
      let newCurrentIdx = this.state.currentIdx + 1
      if (newCurrentIdx < this.state.imageIds.length) {
        // this.setLoadTimer(newCurrentIdx)
        this.refreshImage(false, this.state.imageIds[newCurrentIdx], newCurrentIdx)
      }
    } else {
      //向上滚动
      let newCurrentIdx = this.state.currentIdx - 1
      if (newCurrentIdx >= 0) {
        this.refreshImage(false, this.state.imageIds[newCurrentIdx], newCurrentIdx)
      }
      // if(newCurrentIdx - cacheSize < 0){
      //     for(var i = 0;i < newCurrentIdx + cacheSize ;i++){
      //         if(i === newCurrentIdx) continue
      //         this.cacheImage(this.state.imageIds[i])
      //     }
      // }
      // else if(newCurrentIdx + cacheSize > this.state.imageIds.length){
      //     for(var i = this.state.imageIds.length - 1;i > newCurrentIdx - cacheSize ;i--){
      //         if(i === newCurrentIdx) continue
      //         this.cacheImage(this.state.imageIds[i])
      //     }
      // }
      // else{
      //     for(var i = newCurrentIdx - cacheSize;i < newCurrentIdx + cacheSize ;i++){
      //         if(i === newCurrentIdx) continue
      //         this.cacheImage(this.state.imageIds[i])
      //     }
      // }
    }
  }

  segmentsIntr(a, b, c, d) {
    // 三角形abc 面积的2倍
    var area_abc = (a.x - c.x) * (b.y - c.y) - (a.y - c.y) * (b.x - c.x)

    // 三角形abd 面积的2倍
    var area_abd = (a.x - d.x) * (b.y - d.y) - (a.y - d.y) * (b.x - d.x)

    // 面积符号相同则两点在线段同侧,不相交 (对点在线段上的情况,本例当作不相交处理);
    if (area_abc * area_abd >= 0) {
      return false
    }

    // 三角形cda 面积的2倍
    var area_cda = (c.x - a.x) * (d.y - a.y) - (c.y - a.y) * (d.x - a.x)
    // 三角形cdb 面积的2倍
    // 注意: 这里有一个小优化.不需要再用公式计算面积,而是通过已知的三个面积加减得出.
    var area_cdb = area_cda + area_abc - area_abd
    if (area_cda * area_cdb >= 0) {
      return false
    }

    //计算交点坐标
    var t = area_cda / (area_abd - area_abc)
    var dx = t * (b.x - a.x),
      dy = t * (b.y - a.y)
    return { x: a.x + dx, y: a.y + dy }
  }

  onMouseMove(event) {
    // console.log('onmouse Move')
    // if (this.state.show3DVisualization) {
    //   return
    // }
    const clickX = event.offsetX
    const clickY = event.offsetY
    let x = 0
    let y = 0
    if (this.state.leftButtonTools === 1) {
      if (JSON.stringify(this.state.mouseClickPos) !== '{}') {
        if (JSON.stringify(this.state.mousePrePos) === '{}') {
          this.setState({ mousePrePos: this.state.mouseClickPos })
        }
        this.setState({
          mouseCurPos: {
            x: clickX,
            y: clickY,
          },
        })
        const mouseCurPos = this.state.mouseCurPos
        const mousePrePos = this.state.mousePrePos
        const mouseClickPos = this.state.mouseClickPos
        const prePosition = mousePrePos.y - mouseClickPos.y
        const curPosition = mouseCurPos.y - mouseClickPos.y
        if (mouseCurPos.y !== mousePrePos.y) {
          let y_dia = mouseCurPos.y - mousePrePos.y
          if (this.state.leftBtnSpeed !== 0) {
            var slice_len = Math.round(y_dia / this.state.leftBtnSpeed)
            this.setState({
              slideSpan: Math.round(curPosition / this.state.leftBtnSpeed),
            })
            if (y_dia > 0) {
              let newCurrentIdx = this.state.currentIdx + slice_len
              if (newCurrentIdx < this.state.imageIds.length) {
                this.refreshImage(false, this.state.imageIds[newCurrentIdx], newCurrentIdx)
              } else {
                this.refreshImage(false, this.state.imageIds[this.state.imageIds.length - 1], this.state.imageIds.length - 1)
              }
            } else {
              let newCurrentIdx = this.state.currentIdx + slice_len
              if (newCurrentIdx >= 0) {
                this.refreshImage(false, this.state.imageIds[newCurrentIdx], newCurrentIdx)
              } else {
                this.refreshImage(false, this.state.imageIds[0], 0)
              }
            }
          }
        }
        this.setState({ mousePrePos: mouseCurPos })
      }
    } else if (this.state.leftButtonTools === 0) {
      //Annos
      if (!this.state.immersive) {
        const transX = this.state.viewport.translation.x
        const transY = this.state.viewport.translation.y
        const scale = this.state.viewport.scale
        const halfValue = 256
        let canvasHeight = document.getElementById('canvas').height / 2
        let canvaseWidth = document.getElementById('canvas').width / 2
        x = (clickX - scale * transX - canvaseWidth) / scale + halfValue
        y = (clickY - scale * transY - canvasHeight) / scale + halfValue
      } else {
        x = clickX / 2.5
        y = clickY / 2.5
      }

      let content = this.findCurrentArea(x, y)
      if (!this.state.clicked) {
        if (content.pos === 't' || content.pos === 'b') document.getElementById('canvas').style.cursor = 's-resize'
        else if (content.pos === 'l' || content.pos === 'r') document.getElementById('canvas').style.cursor = 'e-resize'
        else if (content.pos === 'tr' || content.pos === 'bl') document.getElementById('canvas').style.cursor = 'ne-resize'
        else if (content.pos === 'tl' || content.pos === 'br') document.getElementById('canvas').style.cursor = 'nw-resize'
        else if (content.pos === 'i') document.getElementById('canvas').style.cursor = 'grab'
        // document.getElementById("canvas").style.cursor = "auto"
        else if (!this.state.clicked) document.getElementById('canvas').style.cursor = 'auto'
      }

      if (this.state.clicked && this.state.clickedArea.box === -1) {
        //mousedown && mouse is outside the annos
        let tmpBox = this.state.tmpBox
        console.log('tmpbox', tmpBox)
        let tmpCoord = this.state.tmpCoord
        console.log('xy', x, y)
        tmpBox.x1 = tmpCoord.x1
        tmpBox.y1 = tmpCoord.y1
        tmpBox.x2 = x
        tmpBox.y2 = y
        this.setState({ tmpBox: tmpBox })
        this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
      } else if (this.state.clicked && this.state.clickedArea.box !== -1) {
        //mousedown && mouse is inside the annos
        // let boxes = this.state.selectBoxes
        let boxes = this.state.boxes
        let currentBox = boxes[this.state.clickedArea.box]

        if (this.state.clickedArea.pos === 'i') {
          const oldCenterX = (currentBox.x1 + currentBox.x2) / 2
          const oldCenterY = (currentBox.y1 + currentBox.y2) / 2
          const xOffset = x - oldCenterX
          const yOffset = y - oldCenterY
          currentBox.x1 += xOffset
          currentBox.x2 += xOffset
          currentBox.y1 += yOffset
          currentBox.y2 += yOffset
        }

        if (this.state.clickedArea.pos === 'tl' || this.state.clickedArea.pos === 'l' || this.state.clickedArea.pos === 'bl') {
          currentBox.x1 = x
        }
        if (this.state.clickedArea.pos === 'tl' || this.state.clickedArea.pos === 't' || this.state.clickedArea.pos === 'tr') {
          currentBox.y1 = y
        }
        if (this.state.clickedArea.pos === 'tr' || this.state.clickedArea.pos === 'r' || this.state.clickedArea.pos === 'br') {
          currentBox.x2 = x
        }
        if (this.state.clickedArea.pos === 'bl' || this.state.clickedArea.pos === 'b' || this.state.clickedArea.pos === 'br') {
          currentBox.y2 = y
        }

        currentBox.modified = 1
        boxes[this.state.clickedArea.box] = currentBox
        console.log('Current Box', currentBox)
        this.setState({ boxes: boxes })
        this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
      }
    } else if (this.state.leftButtonTools === 3) {
      if (!this.state.immersive) {
        const transX = this.state.viewport.translation.x
        const transY = this.state.viewport.translation.y
        const scale = this.state.viewport.scale
        const halfValue = 256
        let canvasHeight = document.getElementById('canvas').height / 2
        let canvaseWidth = document.getElementById('canvas').width / 2
        x = (clickX - scale * transX - canvaseWidth) / scale + halfValue
        y = (clickY - scale * transY - canvasHeight) / scale + halfValue
      } else {
        x = clickX / 2.5
        y = clickY / 2.5
      }

      let content = this.findMeasureArea(x, y)
      // console.log('pos',content)
      if (!this.state.clicked) {
        if (content.m_pos === 'sl' || content.m_pos === 'el') {
          document.getElementById('canvas').style.cursor = 'se-resize'
        } else if (content.m_pos === 'ss' || content.m_pos === 'es') {
          document.getElementById('canvas').style.cursor = 'ne-resize'
        } else if (content.m_pos === 'cm') document.getElementById('canvas').style.cursor = 'grab'
        else if (!this.state.clicked) document.getElementById('canvas').style.cursor = 'auto'
      }
      // console.log('onmousemove',this.state.clicked && this.state.clickedArea.box !== -1 && this.state.clickedArea.m_pos === 'om',this.state.tmpCoord)
      if (this.state.clicked && this.state.clickedArea.box !== -1 && this.state.clickedArea.m_pos === 'om') {
        //mousedown && mouse is inside the annos && ouside of measure
        let tmpBox = this.state.tmpBox //={}
        console.log('tmpBox', tmpBox)
        tmpBox.measure = {}
        let tmpCoord = this.state.tmpCoord
        var longLength = Math.sqrt((tmpCoord.x1 - x) * (tmpCoord.x1 - x) + (tmpCoord.y1 - y) * (tmpCoord.y1 - y))
        var shortLength = longLength / 2
        var newIntersect_x = (x + tmpCoord.x1) / 2
        var newIntersect_y = (y + tmpCoord.y1) / 2
        var vector_length = Math.sqrt((newIntersect_x - tmpCoord.x1) * (newIntersect_x - tmpCoord.x1) + (newIntersect_y - tmpCoord.y1) * (newIntersect_y - tmpCoord.y1))
        var vector_x = (tmpCoord.x1 - newIntersect_x) / vector_length
        var vector_y = (tmpCoord.y1 - newIntersect_y) / vector_length

        tmpBox.measure.x1 = tmpCoord.x1
        tmpBox.measure.y1 = tmpCoord.y1
        tmpBox.measure.x2 = x
        tmpBox.measure.y2 = y
        tmpBox.measure.intersec_x = newIntersect_x
        tmpBox.measure.intersec_y = newIntersect_y
        tmpBox.measure.x3 = newIntersect_x + (vector_y * shortLength) / 2
        tmpBox.measure.y3 = newIntersect_y - (vector_x * shortLength) / 2
        tmpBox.measure.x4 = newIntersect_x - (vector_y * shortLength) / 2
        tmpBox.measure.y4 = newIntersect_y + (vector_x * shortLength) / 2
        // tmpBox.measure.x3 = (tmpBox.measure.intersec_x + tmpCoord.x1) / 2
        // tmpBox.measure.y3 = (y + tmpBox.measure.intersec_y) / 2
        // tmpBox.measure.x4 = (x + tmpBox.measure.intersec_x) / 2
        // tmpBox.measure.y4 = (tmpBox.measure.intersec_y + tmpBox.measure.y1) / 2
        this.setState({ tmpBox: tmpBox })
        console.log('tmpBox', tmpBox)
        this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
      } else if (this.state.clicked && this.state.clickedArea.box !== -1 && this.state.clickedArea.m_pos !== 'om') {
        //mousedown && mouse is inside the annos && inside the measure
        // let boxes = this.state.selectBoxes
        let boxes = this.state.boxes
        let currentBox = boxes[this.state.clickedArea.box]
        if (this.state.clickedArea.m_pos === 'sl') {
          var fixedPoint_x = currentBox.measure.x2
          var fixedPoint_y = currentBox.measure.y2
          var perpendicularStart_x = currentBox.measure.x3
          var perpendicularStart_y = currentBox.measure.y3
          var perpendicularEnd_x = currentBox.measure.x4
          var perpendicularEnd_y = currentBox.measure.y4
          var oldIntersect_x = currentBox.measure.intersec_x
          var oldIntersect_y = currentBox.measure.intersec_y

          // update intersection point
          var distanceToFixed = Math.sqrt((oldIntersect_x - fixedPoint_x) * (oldIntersect_x - fixedPoint_x) + (oldIntersect_y - fixedPoint_y) * (oldIntersect_y - fixedPoint_y))
          var newLineLength = Math.sqrt((x - fixedPoint_x) * (x - fixedPoint_x) + (y - fixedPoint_y) * (y - fixedPoint_y))
          if (newLineLength > distanceToFixed) {
            var distanceRatio = distanceToFixed / newLineLength
            // console.log("distanceRatio",distanceRatio)
            var newIntersect_x = fixedPoint_x + (x - fixedPoint_x) * distanceRatio
            var newIntersect_y = fixedPoint_y + (y - fixedPoint_y) * distanceRatio
            currentBox.measure.intersec_x = newIntersect_x
            currentBox.measure.intersec_y = newIntersect_y

            //update perpendicular point
            var distancePS = Math.sqrt(
              (perpendicularStart_x - oldIntersect_x) * (perpendicularStart_x - oldIntersect_x) + (perpendicularStart_y - oldIntersect_y) * (perpendicularStart_y - oldIntersect_y)
            )
            var distancePE = Math.sqrt((perpendicularEnd_x - oldIntersect_x) * (perpendicularEnd_x - oldIntersect_x) + (perpendicularEnd_y - oldIntersect_y) * (perpendicularEnd_y - oldIntersect_y))
            var vector_length = Math.sqrt((newIntersect_x - fixedPoint_x) * (newIntersect_x - fixedPoint_x) + (newIntersect_y - fixedPoint_y) * (newIntersect_y - fixedPoint_y))
            var vector_x = (fixedPoint_x - newIntersect_x) / vector_length
            var vector_y = (fixedPoint_y - newIntersect_y) / vector_length
            currentBox.measure.x3 = newIntersect_x - vector_y * distancePS
            currentBox.measure.y3 = newIntersect_y + vector_x * distancePS
            currentBox.measure.x4 = newIntersect_x + vector_y * distancePE
            currentBox.measure.y4 = newIntersect_y - vector_x * distancePE
            currentBox.measure.x1 = x
            currentBox.measure.y1 = y
          }
        } else if (this.state.clickedArea.m_pos === 'el') {
          var fixedPoint_x = currentBox.measure.x1
          var fixedPoint_y = currentBox.measure.y1
          var perpendicularStart_x = currentBox.measure.x3
          var perpendicularStart_y = currentBox.measure.y3
          var perpendicularEnd_x = currentBox.measure.x4
          var perpendicularEnd_y = currentBox.measure.y4
          var oldIntersect_x = currentBox.measure.intersec_x
          var oldIntersect_y = currentBox.measure.intersec_y

          // update intersection point
          var distanceToFixed = Math.sqrt((oldIntersect_x - fixedPoint_x) * (oldIntersect_x - fixedPoint_x) + (oldIntersect_y - fixedPoint_y) * (oldIntersect_y - fixedPoint_y))
          var newLineLength = Math.sqrt((x - fixedPoint_x) * (x - fixedPoint_x) + (y - fixedPoint_y) * (y - fixedPoint_y))
          if (newLineLength > distanceToFixed) {
            var distanceRatio = distanceToFixed / newLineLength
            // console.log("distanceRatio",distanceRatio)
            var newIntersect_x = fixedPoint_x + (x - fixedPoint_x) * distanceRatio
            var newIntersect_y = fixedPoint_y + (y - fixedPoint_y) * distanceRatio
            currentBox.measure.intersec_x = newIntersect_x
            currentBox.measure.intersec_y = newIntersect_y

            //update perpendicular point
            var distancePS = Math.sqrt(
              (perpendicularStart_x - oldIntersect_x) * (perpendicularStart_x - oldIntersect_x) + (perpendicularStart_y - oldIntersect_y) * (perpendicularStart_y - oldIntersect_y)
            )
            var distancePE = Math.sqrt((perpendicularEnd_x - oldIntersect_x) * (perpendicularEnd_x - oldIntersect_x) + (perpendicularEnd_y - oldIntersect_y) * (perpendicularEnd_y - oldIntersect_y))
            var vector_length = Math.sqrt((newIntersect_x - fixedPoint_x) * (newIntersect_x - fixedPoint_x) + (newIntersect_y - fixedPoint_y) * (newIntersect_y - fixedPoint_y))
            var vector_x = (fixedPoint_x - newIntersect_x) / vector_length
            var vector_y = (fixedPoint_y - newIntersect_y) / vector_length
            currentBox.measure.x3 = newIntersect_x + vector_y * distancePS
            currentBox.measure.y3 = newIntersect_y - vector_x * distancePS
            currentBox.measure.x4 = newIntersect_x - vector_y * distancePE
            currentBox.measure.y4 = newIntersect_y + vector_x * distancePE
            currentBox.measure.x2 = x
            currentBox.measure.y2 = y
          }
        } else if (this.state.clickedArea.m_pos === 'ss') {
          var fixedPoint_x = currentBox.measure.x4
          var fixedPoint_y = currentBox.measure.y4
          var start_x = currentBox.measure.x1
          var start_y = currentBox.measure.y1
          var oldIntersect_x = currentBox.measure.intersec_x
          var oldIntersect_y = currentBox.measure.intersec_y
          var vector_length = Math.sqrt((start_x - oldIntersect_x) * (start_x - oldIntersect_x) + (start_y - oldIntersect_y) * (start_y - oldIntersect_y))
          var vector_x = (start_x - oldIntersect_x) / vector_length
          var vector_y = (start_y - oldIntersect_y) / vector_length

          //getHelperLine
          var highNumber = Number.MAX_SAFE_INTEGER
          var helperLine = {
            start: { x: x, y: y },
            end: {
              x: x - vector_y * highNumber,
              y: y + vector_x * highNumber,
            },
          }
          var longLine = {
            start: { x: start_x, y: start_y },
            end: { x: currentBox.measure.x2, y: currentBox.measure.y2 },
          }
          var newIntersection = this.segmentsIntr(helperLine.start, helperLine.end, longLine.start, longLine.end)
          console.log('newIntersection', newIntersection)
          var distanceToFixed = Math.sqrt((oldIntersect_x - fixedPoint_x) * (oldIntersect_x - fixedPoint_x) + (oldIntersect_y - fixedPoint_y) * (oldIntersect_y - fixedPoint_y))
          if (newIntersection) {
            currentBox.measure.x3 = x
            currentBox.measure.y3 = y
            currentBox.measure.x4 = newIntersection.x - vector_y * distanceToFixed
            currentBox.measure.y4 = newIntersection.y + vector_x * distanceToFixed
            currentBox.measure.intersec_x = newIntersection.x
            currentBox.measure.intersec_y = newIntersection.y
          }
        } else if (this.state.clickedArea.m_pos === 'es') {
          var fixedPoint_x = currentBox.measure.x3
          var fixedPoint_y = currentBox.measure.y3
          var start_x = currentBox.measure.x1
          var start_y = currentBox.measure.y1
          var oldIntersect_x = currentBox.measure.intersec_x
          var oldIntersect_y = currentBox.measure.intersec_y
          var vector_length = Math.sqrt((start_x - oldIntersect_x) * (start_x - oldIntersect_x) + (start_y - oldIntersect_y) * (start_y - oldIntersect_y))
          var vector_x = (start_x - oldIntersect_x) / vector_length
          var vector_y = (start_y - oldIntersect_y) / vector_length

          //getHelperLine
          var highNumber = Number.MAX_SAFE_INTEGER
          var helperLine = {
            start: { x: x, y: y },
            end: {
              x: x + vector_y * highNumber,
              y: y - vector_x * highNumber,
            },
          }
          var longLine = {
            start: { x: start_x, y: start_y },
            end: { x: currentBox.measure.x2, y: currentBox.measure.y2 },
          }
          var newIntersection = this.segmentsIntr(helperLine.start, helperLine.end, longLine.start, longLine.end)
          console.log('newIntersection', newIntersection)
          var distanceToFixed = Math.sqrt((oldIntersect_x - fixedPoint_x) * (oldIntersect_x - fixedPoint_x) + (oldIntersect_y - fixedPoint_y) * (oldIntersect_y - fixedPoint_y))
          if (newIntersection) {
            currentBox.measure.x3 = newIntersection.x + vector_y * distanceToFixed
            currentBox.measure.y3 = newIntersection.y - vector_x * distanceToFixed
            currentBox.measure.x4 = x
            currentBox.measure.y4 = y
            currentBox.measure.intersec_x = newIntersection.x
            currentBox.measure.intersec_y = newIntersection.y
          }
        } else if (this.state.clickedArea.m_pos === 'cm') {
          var oldCenterX = (currentBox.measure.x1 + currentBox.measure.x2) / 2
          var oldCenterY = (currentBox.measure.y1 + currentBox.measure.y2) / 2
          var xOffset = x - oldCenterX
          var yOffset = y - oldCenterY
          currentBox.measure.x1 += xOffset
          currentBox.measure.x2 += xOffset
          currentBox.measure.x3 += xOffset
          currentBox.measure.x4 += xOffset
          currentBox.measure.y1 += yOffset
          currentBox.measure.y2 += yOffset
          currentBox.measure.y3 += yOffset
          currentBox.measure.y4 += yOffset
          currentBox.measure.intersec_x = x
          currentBox.measure.intersec_y = y
        }

        boxes[this.state.clickedArea.box] = currentBox
        console.log('Current Box', currentBox)
        this.setState({ boxes: boxes })
        this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
      }
    } else if (this.state.leftButtonTools === 4) {
      if (!this.state.immersive) {
        const transX = this.state.viewport.translation.x
        const transY = this.state.viewport.translation.y
        const scale = this.state.viewport.scale
        const halfValue = 256
        let canvasHeight = document.getElementById('canvas').height / 2
        let canvaseWidth = document.getElementById('canvas').width / 2
        x = (clickX - scale * transX - canvaseWidth) / scale + halfValue
        y = (clickY - scale * transY - canvasHeight) / scale + halfValue
      } else {
        x = clickX / 2.5
        y = clickY / 2.5
      }
      let content = this.findLengthArea(x, y)
      if (!this.state.clicked) {
        if (content.m_pos === 'ul') {
          //
        }
      }
      if (this.state.clicked && this.state.clickedArea.box === -1) {
        //mousedown && mouse is outside the annos
        let tmpBox = this.state.tmpBox
        console.log('tmpbox', tmpBox)
        let tmpCoord = this.state.tmpCoord
        console.log('xy', x, y)
        tmpBox.x1 = tmpCoord.x1
        tmpBox.y1 = tmpCoord.y1
        tmpBox.x2 = x
        tmpBox.y2 = y
        this.setState({ tmpBox: tmpBox })
        this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
      } else if (this.state.clicked && this.state.clickedArea.box !== -1) {
        let lengthBox = this.state.lengthBox
        let currentLength = lengthBox[this.state.clickedArea.box]
        if (this.state.clickedArea.m_pos === 'ul') {
          currentLength.x1 = x
          currentLength.y1 = y
        } else if (this.state.clickedArea.m_pos === 'dl') {
          currentLength.x2 = x
          currentLength.y2 = y
        }
        lengthBox[this.state.clickedArea.box] = currentLength
        this.setState({ lengthBox: lengthBox })
        this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
      }
    }
  }

  onKeydown(event) {
    // if (this.state.show3DVisualization) {
    //   return
    // }
    console.log(event.which)
    if (document.getElementById('slice-slider') !== null) document.getElementById('slice-slider').blur()
    if (event.which == 77) {
      // m, magnify to immersive mode
      this.setState({ immersive: true })
    }

    if (event.which == 27) {
      // esc, back to normal
      this.setState({ immersive: false })
    }
    if (event.which == 37) {
      // console.log('active item',document.activeElement,document.getElementsByClassName("ant-slider-handle")[0])
      if (document.getElementsByClassName('ant-slider-handle')[0] !== document.activeElement) {
        event.preventDefault()
        let newCurrentIdx = this.state.currentIdx - 1
        if (newCurrentIdx >= 0) {
          this.refreshImage(false, this.state.imageIds[newCurrentIdx], newCurrentIdx)
        }
      }
    }
    if (event.which == 38) {
      //切换结节list
      event.preventDefault()
      const listsActiveIndex = this.state.listsActiveIndex
      if (listsActiveIndex > 0) this.keyDownListSwitch(listsActiveIndex - 1)
    }
    if (event.which == 39) {
      if (document.getElementsByClassName('ant-slider-handle')[0] !== document.activeElement) {
        event.preventDefault()
        let newCurrentIdx = this.state.currentIdx + 1
        if (newCurrentIdx < this.state.imageIds.length) {
          this.refreshImage(false, this.state.imageIds[newCurrentIdx], newCurrentIdx)
          // console.log('info',cornerstone.imageCache.getCacheInfo())
        }
      }
    }
    if (event.which == 40) {
      //切换结节list
      event.preventDefault()
      const listsActiveIndex = this.state.listsActiveIndex
      // const boxes = this.state.selectBoxes
      let boxes = this.state.boxes
      if (listsActiveIndex < boxes.length - 1) {
        console.log('listsActiveIndex', listsActiveIndex)
        this.keyDownListSwitch(listsActiveIndex + 1)
      } else if (listsActiveIndex === boxes.length - 1) {
        console.log('listsActiveIndex', listsActiveIndex)
        this.keyDownListSwitch(0)
      }
    }
    if (event.which == 72) {
      this.toHidebox()
    }
  }

  onMouseDown(event) {
    // console.log('onmouse Down')
    if (event.button == 0) {
      const clickX = event.offsetX
      const clickY = event.offsetY
      this.setState({
        mouseClickPos: {
          x: clickX,
          y: clickY,
        },
      })
      console.log(this.state.mouseClickPos)
      let x = 0
      let y = 0

      if (!this.state.immersive) {
        const transX = this.state.viewport.translation.x
        const transY = this.state.viewport.translation.y
        const scale = this.state.viewport.scale

        const halfValue = 256 //256
        let canvasHeight = document.getElementById('canvas').height / 2
        let canvaseWidth = document.getElementById('canvas').width / 2
        x = (clickX - scale * transX - canvaseWidth) / scale + halfValue
        y = (clickY - scale * transY - canvasHeight) / scale + halfValue
      } else {
        x = clickX / 2.5
        y = clickY / 2.5
      }

      if (this.state.leftButtonTools === 0) {
        const coords = {
          x1: x,
          x2: x,
          y1: y,
          y2: y,
        }
        let content = this.findCurrentArea(x, y)
        if (content.pos === 'o') {
          document.getElementById('canvas').style.cursor = 'crosshair'
        } else {
          document.getElementById('canvas').style.cursor = 'auto'
        }
        this.setState({
          clicked: true,
          clickedArea: content,
          tmpCoord: coords,
        })
      } else if (this.state.leftButtonTools === 3) {
        //bidirection
        const coords = {
          x1: x, //start
          y1: y,
          x2: x, //end
          y2: y,
          x3: x,
          y3: y,
          x4: x,
          y4: y,
          intersec_x: x,
          intersec_y: y,
        }
        let content = this.findMeasureArea(x, y)
        console.log('cotnt', content)
        this.setState({
          clicked: true,
          clickedArea: content,
          tmpCoord: coords,
        })
      } else if (this.state.leftButtonTools === 4) {
        //length
        const coords = {
          x1: x,
          x2: x,
          y1: y,
          y2: y,
        }
        let content = this.findLengthArea(x, y)
        console.log('contnt', content)
        this.setState({
          clicked: true,
          clickedArea: content,
          tmpCoord: coords,
        })
      }
      // this.setState({clicked: true, clickedArea: content, tmpBox: coords})
    } else if (event.button == 1) {
      event.preventDefault()
    }
  }

  onMouseOut(event) {
    // console.log('onmouse Out')
    try {
      window.removeEventListener('mousewheel', this.onWheel) || window.removeEventListener('DOMMouseScroll', this.onWheel)
    } catch (e) {
      window.detachEvent('mousewheel', this.onWheel)
    }
    if (this.state.clicked) {
      this.setState({
        clicked: false,
        tmpBox: {},
        tmpCoord: {},
        clickedArea: {},
      })
    }
  }

  onMouseUp(event) {
    if (this.state.clickedArea.box === -1 && this.state.leftButtonTools === 0) {
      const x1 = this.state.tmpBox.x1
      const y1 = this.state.tmpBox.y1
      const x2 = this.state.tmpBox.x2
      const y2 = this.state.tmpBox.y2
      let newNodule_no = -1
      // const boxes = this.state.selectBoxes
      let boxes = this.state.boxes
      for (var i = 0; i < boxes.length; i++) {
        const current_nodule_no = parseInt(boxes[i].nodule_no)
        if (current_nodule_no > newNodule_no) {
          newNodule_no = current_nodule_no
        }
      }
      this.createBox(x1, x2, y1, y2, this.state.currentIdx, (1 + newNodule_no).toString())
      // this.createBox(this.state.tmpBox, this.state.currentIdx, (1+newNodule_no).toString())
    }
    if (this.state.clickedArea.box !== -1 && this.state.leftButtonTools === 3 && event.button === 0 && this.state.clickedArea.m_pos === 'om') {
      console.log('tmpBox', this.state.tmpBox)
      // const boxes = this.state.selectBoxes
      let boxes = this.state.boxes
      let currentBox = boxes[this.state.clickedArea.box]
      currentBox.measure = {}
      console.log('currentBox', currentBox)
      currentBox.measure.x1 = this.state.tmpBox.measure.x1
      currentBox.measure.y1 = this.state.tmpBox.measure.y1
      currentBox.measure.x2 = this.state.tmpBox.measure.x2
      currentBox.measure.y2 = this.state.tmpBox.measure.y2
      currentBox.measure.x3 = this.state.tmpBox.measure.x3
      currentBox.measure.y3 = this.state.tmpBox.measure.y3
      currentBox.measure.x4 = this.state.tmpBox.measure.x4
      currentBox.measure.y4 = this.state.tmpBox.measure.y4
      currentBox.measure.intersec_x = this.state.tmpBox.measure.intersec_x
      currentBox.measure.intersec_y = this.state.tmpBox.measure.intersec_y
      boxes[this.state.clickedArea.box] = currentBox
      const measureStateList = this.state.measureStateList
      measureStateList[this.state.clickedArea.box] = true
      console.log('measure', measureStateList)
      this.setState({ boxes: boxes, measureStateList: measureStateList })
      this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
      console.log('box', this.state.boxes)
    }

    if (this.state.clickedArea.box !== -1 && this.state.leftButtonTools === 3 && event.button === 0 && this.state.clickedArea.m_pos !== 'om') {
      // const boxes = this.state.selectBoxes
      let boxes = this.state.boxes
      let currentBox = boxes[this.state.clickedArea.box]
      var invertBox = this.invertHandles(currentBox)
      boxes[this.state.clickedArea.box] = invertBox
      this.setState({ boxes: boxes })
      this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
    }

    if (this.state.clickedArea.box === -1 && this.state.leftButtonTools === 4) {
      const x1 = this.state.tmpBox.x1
      const y1 = this.state.tmpBox.y1
      const x2 = this.state.tmpBox.x2
      const y2 = this.state.tmpBox.y2
      this.createLength(x1, x2, y1, y2, this.state.currentIdx)
    }

    this.setState({
      clicked: false,
      clickedArea: {},
      tmpBox: {},
      tmpCoord: {},
      mouseClickPos: {},
      mousePrePos: {},
      mouseCurPos: {},
      slideSpan: 0,
      // measureStateList:measureStateList
      // random: Math.random()
    })
    document.getElementById('canvas').style.cursor = 'auto'
  }

  onRightClick(event) {
    event.preventDefault()
  }

  doubleClickListItems(e) {
    console.log('doubleclick')
    this.setState({ doubleClick: true })
  }

  reset() {
    //重置
    let viewport = cornerstone.getViewport(this.element)
    viewport.translation = {
      x: 0,
      y: 0,
    }
    if (document.getElementById('canvas').width > document.getElementById('canvas').height) {
      viewport.scale = document.getElementById('canvas').width / 512
    } else {
      viewport.scale = document.getElementById('canvas').height / 512
    }
    // viewport.scale = document.getElementById("canvas").width / 512;
    cornerstone.setViewport(this.element, viewport)
    this.setState({ viewport })
    console.log('to pulmonary', viewport)
  }

  imagesFilp() {
    let viewport = cornerstone.getViewport(this.element)
    if (viewport.invert === true) {
      viewport.invert = false
    } else {
      viewport.invert = true
    }
    cornerstone.setViewport(this.element, viewport)
    this.setState({ viewport, menuTools: '' })
  }

  ZoomIn() {
    //放大
    let viewport = cornerstone.getViewport(this.element)
    // viewport.translation = {
    //     x: 0,
    //     y: 0
    // }
    if (viewport.scale <= 5) {
      viewport.scale = 1 + viewport.scale
    } else {
      viewport.scale = 6
    }
    cornerstone.setViewport(this.element, viewport)
    this.setState({ viewport })
    console.log('to ZoomIn', viewport)
  }

  ZoomOut() {
    //缩小
    let viewport = cornerstone.getViewport(this.element)
    // viewport.translation = {
    //     x: 0,
    //     y: 0
    // }
    if (viewport.scale >= 2) {
      viewport.scale = viewport.scale - 1
    } else {
      viewport.scale = 1
    }
    cornerstone.setViewport(this.element, viewport)
    this.setState({ viewport })
    console.log('to ZoomOut', viewport)
  }

  toPulmonary() {
    //肺窗
    if (this.state.show3DVisualization) {
      if (this.state.MPR) {
        this.setWL(1)
      }
    } else {
      let viewport = cornerstone.getViewport(this.element)
      viewport.voi.windowWidth = 1600
      viewport.voi.windowCenter = -600
      cornerstone.setViewport(this.element, viewport)
      this.setState({ viewport, menuTools: '' })
      console.log('to pulmonary', viewport)
    }
  }

  toMedia() {
    //纵隔窗
    if (this.state.show3DVisualization) {
      if (this.state.MPR) {
        this.setWL(4)
      }
    } else {
      let viewport = cornerstone.getViewport(this.element)
      viewport.voi.windowWidth = 500
      viewport.voi.windowCenter = 50
      cornerstone.setViewport(this.element, viewport)
      this.setState({ viewport, menuTools: '' })
      console.log('to media', viewport)
    }
  }

  toBoneWindow() {
    //骨窗
    if (this.state.show3DVisualization) {
      if (this.state.MPR) {
        this.setWL(2)
      }
    } else {
      let viewport = cornerstone.getViewport(this.element)
      viewport.voi.windowWidth = 1000
      viewport.voi.windowCenter = 300
      cornerstone.setViewport(this.element, viewport)
      this.setState({ viewport, menuTools: '' })
      console.log('to media', viewport)
    }
  }

  toVentralWindow() {
    //腹窗
    if (this.state.show3DVisualization) {
      if (this.state.MPR) {
        this.setWL(3)
      }
    } else {
      let viewport = cornerstone.getViewport(this.element)
      viewport.voi.windowWidth = 400
      viewport.voi.windowCenter = 40
      cornerstone.setViewport(this.element, viewport)
      this.setState({ viewport, menuTools: '' })
      console.log('to media', viewport)
    }
  }

  //标注新模型
  toNewModel() {
    let caseId = this.state.caseId
    // let currentModel = window.location.pathname.split('/')[3]
    let currentModel = 'origin'
    // request, api, modifier
    const token = localStorage.getItem('token')
    const headers = {
      Authorization: 'Bearer '.concat(token),
    }
    const params = {
      caseId: caseId,
      username: currentModel,
    }
    console.log('params', qs.stringify(params))
    window.sessionStorage.setItem('currentModelId', 'none')
    const userId = sessionStorage.getItem('userId')
    Promise.all([
      axios.get(this.config.user.get_session, { headers }),
      axios.post(this.config.draft.createNewDraft, qs.stringify(params), {
        headers,
      }),
    ])
      .then(([response, NewDraftRes]) => {
        console.log(response.data.status)
        console.log(NewDraftRes.data)
        if (response.data.status === 'okay') {
          console.log('re', response.data)
          console.log('NewDraftRes', NewDraftRes.data.status)
          if (NewDraftRes.data.status === 'okay') {
            window.location.href = NewDraftRes.data.nextPath
          } else if (NewDraftRes.data.status === 'alreadyExisted') {
            this.setState({ modalOpenNew: true })
          }
        } else {
          alert('请先登录!')
          sessionStorage.setItem('location', window.location.pathname.split('/')[0] + '/' + window.location.pathname.split('/')[1] + '/' + window.location.pathname.split('/')[2] + '/')
          window.location.href = '/login'
        }
      })
      .catch((error) => {
        console.log('ERRRRROR', error)
      })
  }

  //标注此模型
  toCurrentModel() {
    // let currentBox = this.state.selectBoxes
    let currentBox = this.state.boxes
    console.log(currentBox)
    let caseId = this.state.caseId
    let currentModel = window.location.pathname.split('/')[3]
    // request, api, modifier
    const token = localStorage.getItem('token')
    const headers = {
      Authorization: 'Bearer '.concat(token),
    }
    const params = {
      caseId: caseId,
      username: currentModel,
    }
    window.sessionStorage.setItem('currentModelId', currentModel)
    console.log('params', params)
    Promise.all([
      axios.get(this.config.user.get_session, { headers }),
      axios.post(this.config.draft.createNewDraft, qs.stringify(params), {
        headers,
      }),
    ])
      .then(([response, NewDraftRes]) => {
        console.log(response.data.status)
        console.log(NewDraftRes.data)
        if (response.data.status === 'okay') {
          console.log('re', response.data)
          console.log('NewDraftRes', NewDraftRes.data.status)
          if (NewDraftRes.data.status === 'okay') {
            // this.nextPath(NewDraftRes.data.nextPath)
            window.location.href = NewDraftRes.data.nextPath
          } else if (NewDraftRes.data.status === 'alreadyExisted') {
            this.setState({ modalOpenCur: true })
          }
        } else {
          alert('请先登录!')
          sessionStorage.setItem('location', window.location.pathname.split('/')[0] + '/' + window.location.pathname.split('/')[1] + '/' + window.location.pathname.split('/')[2] + '/')
          // sessionStorage.setItem('location',NewDraftRes.data.nextPath)
          window.location.href = '/'
        }
      })
      .catch((error) => {
        console.log('ERRRRROR', error)
      })
  }

  //暂存结节
  temporaryStorage() {
    alert('已保存当前结果!')
    this.setState({
      random: Math.random(),
      menuTools: '',
    })
  }
  nextPath(path) {
    this.props.history.push(path)
  }
  submit() {
    console.log('createuser')
    const token = localStorage.getItem('token')
    let boxes = this.state.boxes
    // const selectBoxes = this.state.selectBoxes
    // const selectBoxesMapIndex = this.state.selectBoxesMapIndex
    // let deleteBoxes=[]

    // for(let i=0;i<selectBoxesMapIndex.length;i++){//仅修改
    //     if(selectBoxes[i]!=="delete"){
    //         boxes[selectBoxes[i]]=selectBoxes[i]
    //     }
    //     else{
    //         deleteBoxes.push(selectBoxesMapIndex[i])//存在删除情况
    //     }
    // }

    // for(let i=0;i<deleteBoxes.length;i++){//存在删除情况
    //     boxes.splice(deleteBoxes[i], 1)
    //     for (let i = deleteBoxes[i]; i < boxes.length; i++) {
    //         boxes[i].nodule_no=(parseInt(boxes[i].nodule_no)-1).toString()
    //     }
    // }

    const headers = {
      Authorization: 'Bearer '.concat(token),
    }
    const params = {
      caseId: this.state.caseId,
      // username:this.state.username,
      newRectStr: JSON.stringify(boxes),
    }
    axios
      .post(this.config.draft.createUser, qs.stringify(params), { headers })
      .then((res) => {
        console.log(res)
        if (res.data.status === 'okay') {
          console.log('createUser')
          // this.nextPath(res.data.nextPath)
          window.location.href = res.data.nextPath.replace('#', '%23')
        } else if (res.data.status === 'alreadyExisted') {
          console.log('alreadyExistedUser')
          // this.nextPath(res.data.nextPath)
          window.location.href = res.data.nextPath
        }
      })
      .catch((err) => {
        console.log('err: ' + err)
      })
  }

  clearUserNodule() {
    if (window.confirm('是否删除当前用户标注？') == true) {
      const token = localStorage.getItem('token')
      console.log('token', token)
      const headers = {
        Authorization: 'Bearer '.concat(token),
      }
      const params = {
        caseId: this.state.caseId,
      }
      axios
        .post(this.config.draft.removeDraft, qs.stringify(params), { headers })
        .then((res) => {
          console.log(res.data)
          if (res.data === true) {
            window.location.href = window.location.pathname.split('/')[0] + '/' + window.location.pathname.split('/')[1] + '/' + window.location.pathname.split('/')[2] + '/deepln'
          } else {
            alert('出现错误,请联系管理员！')
          }
        })
        .catch((err) => {
          console.log(err)
        })
    }
  }

  //提交结节
  // submit() {
  //     this.setState({menuTools:''})
  //     const token = localStorage.getItem('token')
  //     console.log('token', token)
  //     const headers = {
  //         'Authorization': 'Bearer '.concat(token)
  //     }
  //     const params = {
  //         caseId: this.state.caseId,
  //         username:this.state.username
  //     }
  //     axios.post(draftConfig.submitDraft, qs.stringify(params), {headers}).then(res => {
  //         if (res.data === true)
  //             this.setState({'draftStatus': '1'})
  //         else
  //             alert("出现错误，请联系管理员！")
  //     }).catch(err => {
  //         console.log(err)
  //     })

  // }

  deSubmit() {
    const token = localStorage.getItem('token')
    this.setState({ menuTools: '' })
    console.log('token', token)
    const headers = {
      Authorization: 'Bearer '.concat(token),
    }
    const params = {
      caseId: this.state.caseId,
      username: this.state.username,
    }
    axios
      .post(this.config.draft.deSubmitDraft, qs.stringify(params), { headers })
      .then((res) => {
        if (res.data === true) this.setState({ draftStatus: '0' })
        else alert('出现错误，请联系管理员！')
      })
      .catch((err) => {
        console.log(err)
      })
  }

  //清空模型并新建
  clearthenNew() {
    const token = localStorage.getItem('token')
    console.log('token', token)
    const headers = {
      Authorization: 'Bearer '.concat(token),
    }
    const params = {
      caseId: this.state.caseId,
    }
    axios
      .post(this.config.draft.removeDraft, qs.stringify(params), { headers })
      .then((res) => {
        console.log(res.data)
        if (res.data === true) {
          this.toNewModel()
        } else {
          alert('出现错误,请联系管理员！')
        }
      })
      .catch((err) => {
        console.log(err)
      })
  }

  async clearthenFork() {
    const token = localStorage.getItem('token')
    console.log('token', token)
    const headers = {
      Authorization: 'Bearer '.concat(token),
    }
    const params = {
      caseId: this.state.caseId,
    }
    axios
      .post(this.config.draft.removeDraft, qs.stringify(params), { headers })
      .then((res) => {
        console.log(res.data)
        if (res.data === true) {
          this.toCurrentModel()
        } else {
          alert('出现错误,请联系管理员！')
        }
      })
      .catch((err) => {
        console.log(err)
      })
  }

  // onWindowResize() {     console.log("onWindowResize")
  // cornerstone.resize(this.element) }

  onImageRendered() {
    const element = document.getElementById('origin-canvas')
    const viewport = cornerstone.getViewport(element)
    if (this.state.showNodules === true && this.state.caseId.replace('#', '%23') === window.location.pathname.split('/')[2]) {
      for (let i = 0; i < this.state.boxes.length; i++) {
        // if (this.state.boxes[i].slice_idx == this.state.currentIdx && this.state.immersive == false)
        if (this.state.boxes[i].slice_idx == this.state.currentIdx) {
          this.drawBoxes(this.state.boxes[i])
          //  this.drawMask(this.state.boxes[i])
          if (this.state.measureStateList[i]) {
            this.drawBidirection(this.state.boxes[i])
          }
          // if(this.state.maskStateList[i]){
          //     this.drawMask(this.state.boxes[i])
          // }
        }
      }
      for (let i = 0; i < this.state.lengthBox.length; i++) {
        if (this.state.lengthBox[i].slice_idx === this.state.currentIdx) {
          this.drawLength(this.state.lengthBox[i])
        }
      }
    }

    // console.log('bool',this.state.clicked && this.state.clickedArea.box !== -1 && this.state.leftButtonTools === 3,this.state.clicked,this.state.clickedArea.box,this.state.leftButtonTools)
    if (this.state.clicked && this.state.clickedArea.box == -1 && this.state.leftButtonTools == 0) {
      this.drawBoxes(this.state.tmpBox)
    } else if (this.state.clicked && this.state.clickedArea.box !== -1 && this.state.leftButtonTools === 3) {
      this.drawBidirection(this.state.tmpBox)
    } else if (this.state.clicked && this.state.leftButtonTools === 4) {
      this.drawLength(this.state.tmpBox)
    }

    this.setState({ viewport })
  }

  onNewImage() {
    // console.log("onNewImage") const enabledElement =
    // cornerstone.getEnabledElement(this.element) this.setState({imageId:
    // enabledElement.image.imageId})
  }

  resizeScreen(e) {
    // console.log("resizeScreen enter", document.body.clientWidth, document.body.clientHeight)
    const verticalMode = document.body.clientWidth < document.body.clientHeight ? true : false
    this.setState({
      windowWidth: document.body.clientWidth,
      windowHeight: document.body.clientHeight,
      verticalMode,
    })
    this.menuButtonsCalc()
    if (document.getElementsByClassName('corner-top-row') !== null && document.getElementsByClassName('corner-top-row').length > 0) {
      const cornerTopRow = document.getElementsByClassName('corner-top-row')[0]

      const cornerTopRowHeight = cornerTopRow.clientHeight
      const cornerBottomRowHeight = document.body.clientHeight - cornerTopRowHeight
      this.setState(
        {
          bottomRowHeight: cornerBottomRowHeight,
        },
        () => {
          if (this.state.show3DVisualization) {
            if (document.getElementById('segment-container') !== null) {
              const segmentContainer = document.getElementById('segment-container')
              const segmentContainerWidth = segmentContainer.clientWidth
              const segmentContainerHeight = segmentContainer.clientHeight
              console.log('resize3DView', segmentContainerWidth, segmentContainerHeight)
              this.resizeViewer(segmentContainerWidth - 4, segmentContainerHeight - 4)
            }
          } else {
            if (document.getElementById('canvas-border') !== null && document.getElementById('cor-container') != null) {
              const corContainer = document.getElementById('cor-container')
              const corContainerHeight = corContainer.clientHeight
              const canvasBorder = document.getElementById('canvas-border')
              const canvasBorderWidth = canvasBorder.clientWidth
              const canvasBorderHeight = canvasBorder.clientHeight
              const canvasWidth = canvasBorderWidth - 20
              const canvasHeight = canvasBorderHeight - 20
              console.log('resizeScreen', canvasBorderWidth, canvasBorderHeight, corContainerHeight)

              // let report = document.getElementById('report')
              // let list = document.getElementsByClassName('nodule-card-container')[0]
              // report.style.height = canvasColumn.clientHeight / 3 + 'px'
              // list.style.height = (canvasColumn.clientHeight * 2) / 3 + 'px'
              this.setState(
                {
                  canvasWidth,
                  canvasHeight,
                },
                () => {
                  if (!this.state.initialized && this.state.imageCaching) {
                    console.log('not init')
                    this.refreshImage(true, this.state.imageIds[this.state.currentIdx], undefined)
                  }
                  if (this.state.initialized) {
                    this.refreshImage(true, this.state.imageIds[this.state.currentIdx], undefined)
                  }
                }
              )
            }
          }
        }
      )
    }
  }

  refreshImage(initial, imageId, newIdx) {
    if (this.state.show3DVisualization) {
      console.log('error')
      return
    }
    // let style = $("<style>", {type:"text/css"}).appendTo("head");
    // style.text('#slice-slider::-webkit-slider-runnable-track{background:linear-gradient(90deg,#0033FF 0%,#000033 '+ (newIdx -1)*100/this.state.imageIds.length+'%)}');
    this.setState({ autoRefresh: false })

    if (!initial) {
      this.setState({ currentIdx: newIdx })
    }

    // const element = this.element;

    // const element = document.getElementById("origin-canvas");
    const element = document.querySelector('#origin-canvas')
    const windowWidth = this.state.windowWidth
    const windowHeight = this.state.windowHeight
    // console.log('element',element)
    // console.log('element',element)
    if (initial) {
      cornerstone.enable(element)
      console.log('enable', cornerstone.getEnabledElements())
      if (this.state.imageIds.length !== 0) {
        const leftBtnSpeed = Math.floor(document.getElementById('canvas').offsetWidth / this.state.imageIds.length)
        this.setState({ leftBtnSpeed: leftBtnSpeed })
      }
      this.setState({
        initialized: true,
      })
    } else {
      cornerstone.getEnabledElement(element)
      // console.log(cornerstone.getEnabledElement(element))
    }
    // console.log('imageLoader',cornerstone.loadImage(imageId))
    cornerstone.loadAndCacheImage(imageId).then((image) => {
      // if(this.state.TagFlag === false){
      //     console.log('image info',image.data)
      //     this.setState({dicomTag:image.data,TagFlag:true})
      // }
      // console.log('image',image.getImage())
      // if (initial) {
      //     // console.log(this.state.viewport.voi)
      //     if (this.state.viewport.voi.windowWidth === undefined || this.state.viewport.voi.windowCenter === undefined) {
      //         image.windowCenter = -600
      //         image.windowWidth = 1600
      //     } else {
      //         image.windowCenter = this.state.viewport.voi.windowCenter
      //         image.windowWidth = this.state.viewport.voi.windowWidth
      //     }

      // }
      if (element !== undefined) {
        cornerstone.displayImage(element, image)
      }

      this.setState({ currentImage: image })
      // var manager = globalImageIdSpecificToolStateManager.getImageIdToolState(image,'Bidirectional')
      // console.log('manager',manager)

      // cornerstoneTools
      //     .mouseInput
      //     .enable(element)
      // cornerstoneTools.addToolForElement(element, mouseInput);

      // cornerstoneTools
      //     .mouseWheelInput
      //     .enable(element)

      // cornerstoneTools
      //     .wwwc
      //     .activate(element, 2) // ww/wc is the default tool for middle mouse button

      if (initial) {
        let scale = 0
        if (document.getElementById('canvas')) {
          if (document.getElementById('canvas').width > document.getElementById('canvas').height) {
            scale = document.getElementById('canvas').width / 512
          } else {
            scale = document.getElementById('canvas').height / 512
          }
        }
        let viewport = {
          invert: false,
          pixelReplication: false,
          voi: {
            windowWidth: 1600,
            windowCenter: -600,
          },
          scale: scale,
          translation: {
            x: 0,
            y: 0,
          },
        }
        cornerstone.setViewport(this.element, viewport)
        this.setState({ viewport })
        if (!this.state.immersive) {
          cornerstoneTools.addToolForElement(element, pan)
          cornerstoneTools.setToolActiveForElement(
            element,
            'Pan',
            {
              mouseButtonMask: 4, //middle mouse button
            },
            ['Mouse']
          )
          cornerstoneTools.addToolForElement(element, zoomWheel)
          cornerstoneTools.setToolActiveForElement(element, 'Zoom', {
            mouseButtonMask: 2,
          })
        }

        element.addEventListener('cornerstoneimagerendered', this.onImageRendered)
        element.addEventListener('cornerstonenewimage', this.onNewImage)
        element.addEventListener('contextmenu', this.onRightClick)
        // if (!this.state.readonly) {
        element.addEventListener('mousedown', this.onMouseDown)
        element.addEventListener('mousemove', this.onMouseMove)
        element.addEventListener('mouseup', this.onMouseUp)
        element.addEventListener('mouseout', this.onMouseOut)
        element.addEventListener('mouseover', this.onMouseOver)
        // }

        document.addEventListener('keydown', this.onKeydown)
      }
      // window.addEventListener("resize", this.onWindowResize) if (!initial) {
      // this.setState({currentIdx: newIdx}) }
    })
    // console.log('imageobject',imageobject)
  }

  cacheImage(imageId) {
    cornerstone.loadAndCacheImage(imageId)
    // cornerstone.ImageCache(imageId)
    // console.log('info',cornerstone.imageCache.getCacheInfo(),imageId)
  }

  cache() {
    //coffee button
    for (var i = this.state.imageIds.length - 1; i >= 0; i--) {
      this.refreshImage(false, this.state.imageIds[i], i)
      // console.log('info',cornerstone.imageCache.getCacheInfo())
    }
  }

  checkHash() {
    const noduleNo = this.state.noduleNo
    if (this.state.boxes[noduleNo] !== undefined) {
      const boxes = this.state.boxes
      const toIdx = this.state.boxes[noduleNo].slice_idx
      boxes[noduleNo].highlight = true
      // console.log("1464:", boxes)

      this.setState({
        boxes: boxes,
        currentIdx: toIdx,
        // autoRefresh: true
      })
    }
    // if (this.state.boxes[noduleNo] !== undefined) {
    //   const boxes = this.state.boxes;

    // }
  }

  dealChoose(e) {
    // console.log('list',e)
    this.setState({ dealchoose: e.currentTarget.innerHTML })
  }

  exportPDF() {
    const element = document.getElementById('pdf')
    const opt = {
      margin: [1, 1, 1, 1],
      filename: 'minireport.pdf',
      pagebreak: { before: '#noduleDivide', avoid: 'canvas' },
      image: { type: 'jpeg', quality: 0.98 }, // 导出的图片质量和格式
      html2canvas: { scale: 2, useCORS: true }, // useCORS很重要，解决文档中图片跨域问题
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
    }
    if (element) {
      html2pdf().set(opt).from(element).save() // 导出
    }
  }

  handleCopyClick(e) {
    copy(this.state.templateText)
  }
  onMenuPageUp() {
    const { menuButtonsWidth, menuNowPage, menuTransform } = this.state
    this.setState({
      menuNowPage: menuNowPage - 1,
      menuTransform: menuTransform - menuButtonsWidth,
    })
  }
  onMenuPageDown() {
    const { menuButtonsWidth, menuNowPage, menuTransform } = this.state

    this.setState({
      menuNowPage: menuNowPage + 1,
      menuTransform: menuTransform + menuButtonsWidth,
    })
  }
  showImages() {
    const nodules = this.state.nodules
    const imageIds = this.state.imageIds
    if (nodules.length === 0) {
      return
    }
    // console.log('imagesid',imageIds)
    let nodule_id = 'nodule-' + nodules[0].nodule_no + '-' + nodules[0].slice_idx
    let that = this
    var timer = setInterval(function () {
      if (document.getElementById(nodule_id) != null) {
        nodules.map((nodule, index) => {
          // console.log('nodules1',nodule)
          const visId = 'visual' + index
          var dom = document.getElementById(visId)
          dom.style.display = ''
          dom.style.height = '300px'
          dom.style.width = '450px'
          let myChart = echarts.init(dom)
          // console.log(visId)
          // document.getElementById(visId).innerHTML=''
          const hist_data = nodule.nodule_hist
          if (hist_data !== undefined) {
            let bins = hist_data.bins
            let ns = hist_data.n

            myChart.setOption({
              color: ['#00FFFF'],
              tooltip: {
                trigger: 'axis',
                axisPointer: {
                  // 坐标轴指示器，坐标轴触发有效
                  type: 'shadow', // 默认为直线，可选为：'line' | 'shadow'
                },
              },
              toolbox: {
                feature: {
                  saveAsImage: {},
                },
              },
              grid: {
                left: '15%',
                right: '4%',
                bottom: '3%',
                top: '10%',
                containLabel: true,
              },
              xAxis: [
                {
                  type: 'category',
                  scale: 'true',
                  data: bins,
                  // min: minValue,
                  // max: maxValue,
                  axisTick: {
                    alignWithLabel: true,
                  },
                  axisLabel: {
                    color: 'rgb(191,192,195)',
                  },
                },
              ],
              yAxis: [
                {
                  type: 'value',

                  axisLabel: {
                    color: 'rgb(191,192,195)',
                  },
                  minInterval: 1,
                },
              ],
              series: [
                {
                  name: 'count',
                  type: 'bar',
                  barWidth: '60%',
                  data: ns,
                },
              ],
            })
          }
          nodule_id = 'nodule-' + nodule.nodule_no + '-' + nodule.slice_idx
          const element = document.getElementById(nodule_id)
          let imageId = imageIds[nodule.slice_idx]
          cornerstone.enable(element)
          cornerstone.loadAndCacheImage(imageId).then(function (image) {
            // console.log('cache')
            var viewport = cornerstone.getDefaultViewportForImage(element, image)
            viewport.voi.windowWidth = 1600
            viewport.voi.windowCenter = -600
            viewport.scale = 2
            // console.log('nodules2',nodule)
            const xCenter = nodule.x1 + (nodule.x2 - nodule.x1) / 2
            const yCenter = nodule.y1 + (nodule.y2 - nodule.y1) / 2
            viewport.translation.x = 250 - xCenter
            viewport.translation.y = 250 - yCenter
            // console.log('viewport',viewport)
            cornerstone.setViewport(element, viewport)
            cornerstone.displayImage(element, image)
            buttonflag += 1
            // console.log('buttonflag',buttonflag)
            if (buttonflag === nodules.length) {
              that.setState({ temp: 1 })
            }
          })
        })
        clearInterval(timer)
      }
    }, 100)
  }
  onReportTabChange(e, data) {
    let type
    if (data.activeIndex === 0) {
      type = '影像所见'
    } else if (data.activeIndex === 1) {
      type = '处理建议'
    }
    this.setState({
      reportType: type,
    })
  }
  template(type, activeItem, dealchoose) {
    let places = {
      0: '选择位置',
      1: '右肺中叶',
      2: '右肺上叶',
      3: '右肺下叶',
      4: '左肺上叶',
      5: '左肺下叶',
    }
    let segments = {
      S1: '右肺上叶尖段',
      S2: '右肺上叶后段',
      S3: '右肺上叶前段',
      S4: '右肺中叶外侧段',
      S5: '右肺中叶内侧段',
      S6: '右肺下叶背段',
      S7: '右肺下叶内基底段',
      S8: '右肺下叶前基底段',
      S9: '右肺下叶外基底段',
      S10: '右肺下叶后基底段',
      S11: '左肺上叶尖后段',
      S12: '左肺上叶前段',
      S13: '左肺上叶上舌段',
      S14: '左肺上叶下舌段',
      S15: '左肺下叶背段',
      S16: '左肺下叶内前基底段',
      S17: '左肺下叶外基底段',
      S18: '左肺下叶后基底段',
    }
    const { boxes } = this.state
    console.log('template', boxes)
    if (type === '影像所见') {
      let texts = ''
      if (activeItem === -1) {
        this.setState({ templateText: '' })
      } else if (activeItem === 'all') {
        // console.log('length',boxes.length)
        for (let i = 0; i < boxes.length; i++) {
          let place = ''
          let diameter = ''
          let texture = ''
          let representArray = []
          let represent = ''
          let malignancy = ''
          if (boxes[i]['place'] === 0 || boxes[i]['place'] === undefined || boxes[i]['place'] === '') {
            if (boxes[i]['segment'] === undefined || boxes[i]['segment'] === '' || boxes[i]['segment'] === 'None') {
              place = '未知位置'
            } else {
              place = segments[boxes[i]['segment']]
            }
          } else {
            if (boxes[i]['segment'] === undefined || boxes[i]['segment'] === '' || boxes[i]['segment'] === 'None') {
              place = places[boxes[i]['place']]
            } else {
              place = segments[boxes[i]['segment']]
            }
          }
          // if (boxes[i]["diameter"] !== undefined) {
          //   diameter =
          //     Math.floor(boxes[i]["diameter"] * 10) / 100 + "cm";
          let ll = 0
          let sl = 0
          if (boxes[i]['measure'] !== undefined) {
            ll = Math.sqrt(Math.pow(boxes[i].measure.x1 - boxes[i].measure.x2, 2) + Math.pow(boxes[i].measure.y1 - boxes[i].measure.y2, 2))
            sl = Math.sqrt(Math.pow(boxes[i].measure.x3 - boxes[i].measure.x4, 2) + Math.pow(boxes[i].measure.y3 - boxes[i].measure.y4, 2))
            if (isNaN(ll)) {
              ll = 0
            }
            if (isNaN(sl)) {
              sl = 0
            }
            diameter = '\xa0\xa0' + (ll / 10).toFixed(2) + '\xa0' + '×' + '\xa0' + (sl / 10).toFixed(2) + ' 厘米'
          } else {
            diameter = '未知'
          }
          if (boxes[i]['texture'] === 2) {
            texture = '实性'
          } else if (boxes[i]['texture'] === 3) {
            texture = '混合磨玻璃'
          } else {
            texture = '磨玻璃'
          }

          if (boxes[i]['lobulation'] === 2) {
            representArray.push('分叶')
          }
          if (boxes[i]['spiculation'] === 2) {
            representArray.push('毛刺')
          }
          if (boxes[i]['calcification'] === 2) {
            representArray.push('钙化')
          }
          if (boxes[i]['pin'] === 2) {
            representArray.push('胸膜凹陷')
          }
          if (boxes[i]['cav'] === 2) {
            representArray.push('空洞')
          }
          if (boxes[i]['vss'] === 2) {
            representArray.push('血管集束')
          }
          if (boxes[i]['bea'] === 2) {
            representArray.push('空泡')
          }
          if (boxes[i]['bro'] === 2) {
            representArray.push('支气管充气')
          }
          for (let index = 0; index < representArray.length; index++) {
            if (index === 0) {
              represent = representArray[index]
            } else {
              represent = represent + '、' + representArray[index]
            }
          }
          if (boxes[i]['malignancy'] === 3) {
            malignancy = '风险较高。'
          } else if (boxes[i]['malignancy'] === 2) {
            malignancy = '风险中等。'
          } else {
            malignancy = '风险较低。'
          }
          texts =
            texts +
            place +
            ' ( Im ' +
            (parseInt(boxes[i]['slice_idx']) + 1) +
            '/' +
            this.state.imageIds.length +
            ') 见' +
            texture +
            '结节, 大小为' +
            diameter +
            ', 可见' +
            represent +
            ', ' +
            malignancy +
            '\n\n'
        }
        this.setState({ templateText: texts })
      } else {
        let place = ''
        let diameter = ''
        let texture = ''
        let representArray = []
        let represent = ''
        let malignancy = ''
        if (boxes[activeItem]['place'] === 0 || boxes[activeItem]['place'] === undefined || boxes[activeItem]['place'] === '') {
          if (boxes[activeItem]['segment'] === undefined || boxes[activeItem]['segment'] === '' || boxes[activeItem]['segment'] === 'None') {
            place = '未知位置'
          } else {
            place = segments[boxes[activeItem]['segment']]
          }
        } else {
          if (boxes[activeItem]['segment'] === undefined || boxes[activeItem]['segment'] === '' || boxes[activeItem]['segment'] === 'None') {
            place = places[boxes[activeItem]['place']]
          } else {
            place = segments[boxes[activeItem]['segment']]
          }
        }
        let ll = 0
        let sl = 0
        if (boxes[activeItem]['measure'] !== undefined) {
          ll = Math.sqrt(Math.pow(boxes[activeItem].measure.x1 - boxes[activeItem].measure.x2, 2) + Math.pow(boxes[activeItem].measure.y1 - boxes[activeItem].measure.y2, 2))
          sl = Math.sqrt(Math.pow(boxes[activeItem].measure.x3 - boxes[activeItem].measure.x4, 2) + Math.pow(boxes[activeItem].measure.y3 - boxes[activeItem].measure.y4, 2))
          if (isNaN(ll)) {
            ll = 0
          }
          if (isNaN(sl)) {
            sl = 0
          }
          diameter = '\xa0\xa0' + (ll / 10).toFixed(2) + '\xa0' + '×' + '\xa0' + (sl / 10).toFixed(2) + ' 厘米'
        } else {
          diameter = '未知'
        }
        if (boxes[activeItem]['texture'] === 2) {
          texture = '实性'
        } else if (boxes[activeItem]['texture'] === 3) {
          texture = '混合磨玻璃'
        } else {
          texture = '磨玻璃'
        }
        if (boxes[activeItem]['lobulation'] === 2) {
          representArray.push('分叶')
        }
        if (boxes[activeItem]['spiculation'] === 2) {
          representArray.push('毛刺')
        }
        if (boxes[activeItem]['calcification'] === 2) {
          representArray.push('钙化')
        }
        if (boxes[activeItem]['pin'] === 2) {
          representArray.push('胸膜凹陷')
        }
        if (boxes[activeItem]['cav'] === 2) {
          representArray.push('空洞')
        }
        if (boxes[activeItem]['vss'] === 2) {
          representArray.push('血管集束')
        }
        if (boxes[activeItem]['bea'] === 2) {
          representArray.push('空泡')
        }
        if (boxes[activeItem]['bro'] === 2) {
          representArray.push('支气管充气')
        }
        for (let index = 0; index < representArray.length; index++) {
          if (index === 0) {
            represent = representArray[index]
          } else {
            represent = represent + '、' + representArray[index]
          }
        }
        if (boxes[activeItem]['malignancy'] === 3) {
          malignancy = '风险较高。'
        } else if (boxes[activeItem]['malignancy'] === 2) {
          malignancy = '风险中等。'
        } else {
          malignancy = '风险较低。'
        }
        texts =
          texts +
          place +
          ' ( Im ' +
          (parseInt(boxes[activeItem]['slice_idx']) + 1) +
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

        this.setState({ templateText: texts })
      }
    } else {
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
              templateText: '根据PET评估结节结果判断手术切除或非手术活检',
            })
            break
          case 15:
            this.setState({
              templateText: '3~6、9~12及24个月，如稳定，年度随访',
            })
            break
          case 10:
            this.setState({
              templateText: '6~12、18~24个月，如稳定，年度随访',
            })
            break
          case 5:
            this.setState({ templateText: '12个月，如稳定，年度随访' })
            break
          case 0:
            this.setState({ templateText: '选择性随访' })
            break
        }
      } else if (dealchoose === 'Fleischner') {
        let weight = 0

        for (let i = 0; i < this.state.boxes.length; i++) {
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
            this.setState({ templateText: '3个月考虑CT、PET/CT，或组织样本' })
            break
          case 20:
            this.setState({
              templateText: '3-6月行CT确定稳定性。若未改变，并且实性成分<6mm，应每年行CT至5年',
            })
            break
          case 15:
            this.setState({
              templateText: '6-12个月行CT，之后18-24个月考虑CT',
            })
            break
          case 10:
            this.setState({
              templateText: '6-12月行CT确定稳定性，之后每2年行CT至5年',
            })
            break
          case 5:
            this.setState({ templateText: '最好在12个月行CT' })
            break
          case 0:
            this.setState({ templateText: '无常规随访' })
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
            this.setState({ templateText: '胸部增强CT和/或PET/CT' })
            break
          case 10:
            this.setState({ templateText: '3个月后复查LDCT或考虑PET/CT' })
            break
          case 5:
            this.setState({ templateText: '6个月后复查LDCT' })
            break
          case 0:
            this.setState({
              templateText: '每年复查LDCT，直至患者不再是肺癌潜在治疗对象',
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
              templateText: '胸部CT增强或平扫；根据恶性的概率和并发症，选择性进行PET/CT和/或组织活检；存在≥8mm的实性成分时，需进行PET/CT检查',
            })
            break
          case 10:
            this.setState({
              templateText: '3个月低剂量胸部CT筛查；存在≥8mm的实性成分时需PET/CT检查',
            })
            break
          case 5:
            this.setState({ templateText: '6个月内低剂量胸部CT筛查' })
            break
          case 0:
            this.setState({ templateText: '12个月内继续年度低剂量胸部CT筛查' })
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
              templateText: '应转介多学科团队到中心进行管理。该中心的诊断能力应包括CT/PET扫描、良性疾病检测和活检',
            })
            break
          case 20:
            this.setState({
              templateText: '3个月后复查CT，如果检测时认为临床合适，考虑经验性抗菌治疗',
            })
            break
          case 10:
            this.setState({
              templateText: '在大约6个月-12个月和18个月-24个月进行低剂量CT监测，并根据临床判断考虑每年进行低剂量CT监测',
            })
            break
          case 15:
            this.setState({
              templateText: '在大约3个月、12个月和24个月进行低剂量CT监测，并根据临床判断考虑每年进行低剂量CT监测',
            })
            break
          case 5:
            this.setState({
              templateText: '每年进行CT监测，持续3年;然后根据临床判断，考虑每年进行CT监测',
            })
            break
          case 0:
            this.setState({ templateText: '根据临床判断，考虑每年进行CT监测' })
            break
        }
      }
    }
  }
  handleTextareaChange(e) {
    this.setState({ templateText: e.target.value })
  }

  updateStudyBrowser(prevProps, prevState) {}

  loadStudyBrowser() {
    const token = localStorage.getItem('token')
    const params = {
      mainItem: this.state.caseId.split('_')[0],
      type: 'pid',
      otherKeyword: '',
    }
    const headers = {
      Authorization: 'Bearer '.concat(token),
    }
    axios.post(this.config.record.getSubListForMainItem_front, qs.stringify(params)).then((response) => {
      const data = response.data
      console.log('getSubListForMainItem_front request', response)
      if (data.status !== 'okay') {
        console.log('Not okay')
        // window.location.href = '/'
      } else {
        const subList = data.subList
        let theList = []
        // const params={caseId:this.state.caseId}
        Object.keys(subList).map((key, value) => {
          // console.log('leftkey',key)
          const seriesLst = subList[key]
          seriesLst.map((serie, index) => {
            Promise.all([
              axios.post(this.config.draft.getDataPath, qs.stringify({ caseId: serie.caseId }), { headers }),
              axios.post(this.config.data.getDataListForCaseId, qs.stringify({ caseId: serie.caseId })),
              axios.post(
                this.config.draft.dataValid,
                qs.stringify({
                  caseId: serie.caseId,
                })
              ),
            ]).then(([annotype, dicom, dataValidRes]) => {
              theList.push({
                date: key,
                caseId: serie.caseId,
                Description: serie.description,
                href: '/case/' + serie.caseId + '/' + annotype.data,
                image: dicom.data[parseInt(dicom.data.length / 3)],
                validInfo: dataValidRes.data,
              })
              for (let j = 0; j < theList.length; j++) {
                for (let i = 0; i < theList.length - j - 1; i++) {
                  if (parseInt(theList[i].date) < parseInt(theList[i + 1].date)) {
                    let temp = theList[i]
                    theList[i] = theList[i + 1]
                    theList[i + 1] = temp
                  }
                }
              }

              this.setState({ dateSeries: theList }, () => {
                this.state.dateSeries.map((serie, index) => {
                  const previewId = 'preview-' + index

                  const element = document.getElementById(previewId)
                  let imageId = serie.image
                  // console.log('preview',element)
                  cornerstone.enable(element)
                  cornerstone.loadAndCacheImage(imageId).then(function (image) {
                    // console.log('cache')
                    var viewport = cornerstone.getDefaultViewportForImage(element, image)
                    viewport.voi.windowWidth = 1600
                    viewport.voi.windowCenter = -600
                    viewport.scale = 0.3
                    cornerstone.setViewport(element, viewport)
                    cornerstone.displayImage(element, image)
                  })
                })
              })
              // resolve(theList)
            })
          })
        })
      }
    })

    // const getStudyListPromise = new Promise((resolve, reject) => {

    // });
  }

  updateDisplay(prevProps, prevState) {
    if (prevState.canvasWidth !== this.state.canvasWidth || prevState.canvasHeight !== this.state.canvasHeight) {
    }
  }

  loadDisplay() {
    // first let's check the status to display the proper contents.
    // const pathname = window.location.pathname
    // send our token to the server, combined with the current pathname
    let noduleNo = -1
    if (this.props.location.hash !== '') noduleNo = parseInt(this.props.location.hash.split('#').slice(-1)[0])

    const token = localStorage.getItem('token')
    const headers = {
      Authorization: 'Bearer '.concat(token), //add the fun of check
    }
    const imageIds = this.state.imageIds
    if (this.state.modelName === 'origin') {
      cornerstone.loadAndCacheImage(imageIds[0]).then((image) => {
        // const readonly = readonlyResponse.data.readonly === 'true'
        // console.log('parse',dicomParser.parseDicom(image))
        const dicomTag = image.data
        const boxes = []
        const draftStatus = -1
        this.setState({
          dicomTag,
          boxes,
          draftStatus,
        })
      })
    } else {
      // const token = localStorage.getItem('token')
      // const headers = {
      //     'Authorization': 'Bearer '.concat(token)//add the fun of check
      // }
      axios
        .post(
          this.config.draft.readonly,
          qs.stringify({
            caseId: this.state.caseId,
            username: this.state.username,
          }),
          {
            headers,
          }
        )
        .then((readonlyResponse) => {
          const readonly = readonlyResponse.data.readonly === 'true'
          console.log('readonly', readonly)
          console.log('load display request', readonlyResponse)
          // const readonly = false
          cornerstone.loadAndCacheImage(imageIds[0]).then((image) => {
            // console.log('image info', image.data)
            const dicomTag = image.data

            let draftStatus = -1
            draftStatus = readonlyResponse.data.status
            let boxes = this.state.nodules
            console.log('boxes', boxes)
            if (boxes !== '') boxes.sort(this.sliceIdxSort('slice_idx'))
            for (var i = 0; i < boxes.length; i++) {
              boxes[i].nodule_no = '' + i
              boxes[i].rect_no = 'a00' + i
            }

            this.refreshImage(true, imageIds[this.state.currentIdx], undefined)

            const params = {
              caseId: this.state.caseId,
            }
            const okParams = {
              caseId: this.state.caseId,
              username: window.location.pathname.split('/')[3],
            }
            console.log('token', token)
            console.log('okParams', okParams)

            axios
              .post(this.config.review.isOkayForReview, qs.stringify(okParams), {
                headers,
              })
              .then((res) => {
                // console.log('1484', res)
              })
              .catch((err) => {
                console.log(err)
              })

            document.getElementById('closeVisualContent').style.display = 'none'

            var stateListLength = this.state.boxes.length
            var measureArr = new Array(stateListLength).fill(false)

            var maskArr = new Array(stateListLength).fill(true)
            this.setState({
              dicomTag,
              boxes,
              draftStatus,
              readonly,
              measureStateList: measureArr,
              maskStateList: maskArr,
              imageCaching: true,
            })
          })
        })
    }
  }

  updateReport(prevProps, prevState) {
    if (
      prevState.doubleClick !== this.state.doubleClick ||
      prevState.listsActiveIndex !== this.state.listsActiveIndex ||
      prevState.reportType !== this.state.reportType ||
      prevState.dealchoose !== this.state.dealchoose
    ) {
      const activeItem = this.state.doubleClick === true ? 'all' : this.state.listsActiveIndex
      console.log('enter update report', this.state.reportType, activeItem)
      this.template(this.state.reportType, activeItem, this.state.dealchoose)
    }
    if (prevState.boxes !== this.state.boxes) {
      const params = {
        caseId: this.state.caseId,
        username: this.state.modelName,
      }
      axios
        .post(this.config.draft.structedReport, qs.stringify(params))
        .then((response) => {
          const data = response.data
          // console.log('report:',data,params)
          this.setState({
            age: data.age,
            date: data.date,
            // nodules: data.nodules === undefined ? [] : data.nodules,
            patientBirth: data.patientBirth,
            patientId: data.patientID,
            patientSex: data.patientSex === 'M' ? '男' : '女',
          })
        })
        .catch((error) => console.log(error))
    }
  }

  loadReport() {
    axios
      .post(
        this.config.draft.structedReport,
        qs.stringify({
          caseId: this.state.caseId,
          username: this.state.modelName,
        })
      )
      .then((response) => {
        console.log('report_nodule request', response)
        const data = response.data
        this.setState({
          age: data.age,
          date: data.date,
          // nodules: data.nodules === undefined ? [] : data.nodules,
          patientBirth: data.patientBirth,
          patientId: data.patientID,
          patientSex: data.patientSex === 'M' ? '男' : '女',
        })
      })
      .catch((error) => console.log(error))
  }

  menuButtonsCalc() {
    const screenWidth = document.body.clientWidth
    const logoWidth = document.getElementById('menu-item-logo').clientWidth
    const userWidth = document.getElementById('menu-item-user').clientWidth
    const menuButtonsWidth = screenWidth - logoWidth - userWidth //可视宽度
    const menuItemButtons = document.getElementById('menu-item-buttons')
    // console.log('buttons', screenWidth, logoWidth, userWidth, menuButtonsWidth)
    // console.log('buttons', menuItemButtons.scrollWidth, menuItemButtons.clientWidth)
    const menuTotalPages = Math.ceil(menuItemButtons.scrollWidth / menuButtonsWidth)
    let menuNowPage = this.state.menuNowPage
    let menuTransform = this.state.menuTransform
    if (menuNowPage > menuTotalPages) {
      menuNowPage = menuTotalPages
      menuTransform = (menuNowPage - 1) * menuButtonsWidth
    }
    const menuScrollable = menuTotalPages > 1
    // console.log('buttons', menuTotalPages, menuScrollable)
    this.setState({
      menuButtonsWidth,
      menuScrollable,
      menuTotalPages,
      menuNowPage,
      menuTransform,
    })
  }
  async componentDidMount() {
    console.log('componentDidMount')
    if (localStorage.getItem('username') === null && window.location.pathname !== '/') {
      const ipPromise = new Promise((resolve, reject) => {
        axios.post(this.config.user.getRemoteAddr).then((addrResponse) => {
          resolve(addrResponse)
        }, reject)
      })
      const addr = await ipPromise
      let tempUid = ''
      console.log('addr', addr)
      if (addr.data.remoteAddr === 'unknown') {
        tempUid = this.config.loginId.uid
      } else {
        tempUid = 'user' + addr.data.remoteAddr.split('.')[3]
      }

      const usernameParams = {
        username: tempUid,
      }

      const insertInfoPromise = new Promise((resolve, reject) => {
        axios.post(this.config.user.insertUserInfo, qs.stringify(usernameParams)).then((insertResponse) => {
          resolve(insertResponse)
        }, reject)
      })

      const insertInfo = await insertInfoPromise
      if (insertInfo.data.status !== 'failed') {
        this.setState({ username: usernameParams.username })
      } else {
        this.setState({ username: this.config.loginId.uid })
      }

      const user = {
        username: this.state.username,
        password: md5(this.config.loginId.password),
      }
      const auth = {
        username: this.state.username,
      }
      Promise.all([axios.post(this.config.user.validUser, qs.stringify(user)), axios.post(this.config.user.getAuthsForUser, qs.stringify(auth))])

        .then(([loginResponse, authResponse]) => {
          console.log(authResponse.data)
          if (loginResponse.data.status !== 'failed') {
            localStorage.setItem('token', loginResponse.data.token)
            localStorage.setItem('realname', loginResponse.data.realname)
            localStorage.setItem('username', loginResponse.data.username)
            localStorage.setItem('privilege', loginResponse.data.privilege)
            localStorage.setItem('allPatientsPages', loginResponse.data.allPatientsPages)
            localStorage.setItem('totalPatients', loginResponse.data.totalPatients)
            localStorage.setItem('totalRecords', loginResponse.data.totalRecords)
            localStorage.setItem('modelProgress', loginResponse.data.modelProgress)
            localStorage.setItem('BCRecords', loginResponse.data.BCRecords)
            localStorage.setItem('HCRecords', loginResponse.data.HCRecords)
            localStorage.setItem('auths', JSON.stringify(authResponse.data))
            console.log('localtoken', localStorage.getItem('token'))
          } else {
            console.log('localtoken', localStorage.getItem('token'))
          }
        })
        .catch((error) => {
          console.log(error)
        })
    }
    this.apis = []
    window.addEventListener('resize', this.resizeScreen.bind(this))
    // this.getNoduleIfos()
    // this.visualize()
    if (localStorage.getItem('token') == null) {
      sessionStorage.setItem(
        'location',
        window.location.pathname.split('/')[0] + '/' + window.location.pathname.split('/')[1] + '/' + window.location.pathname.split('/')[2] + '/' + window.location.pathname.split('/')[3]
      )
      // window.location.href = '/'
    }
    document.getElementById('header').style.display = 'none'

    const token = localStorage.getItem('token')
    const headers = {
      Authorization: 'Bearer '.concat(token),
    }

    const caseDataIndex = _.findIndex(this.props.caseData, { caseId: this.state.caseId })
    let imageIds
    let nodules
    if (caseDataIndex === -1) {
      imageIds = await this.props.getImageIdsByCaseId(this.config.data.getDataListForCaseId, this.state.caseId)
      nodules = await this.props.getNodulesByCaseId(this.config.draft.getRectsForCaseIdAndUsername, this.state.caseId, this.state.modelName)
    } else {
      imageIds = this.props.caseData[caseDataIndex].imageIds
      nodules = this.props.caseData[caseDataIndex].nodules
    }
    this.setState({
      imageIds,
      nodules,
    })
    const boxes = nodules
    const annoImageIds = []

    await cornerstone.loadAndCacheImage(imageIds[0])

    for (let i = 0; i < boxes.length; i++) {
      let slice_idx = boxes[i].slice_idx
      // console.log('cornerstone', slice_idx, imageIds[slice_idx])
      for (let j = slice_idx - 5; j < slice_idx + 5; j++) {
        // cornerstone.loadAndCacheImage(imageIds[j])
        // if(!annoHash[this[i]]){
        //     annoHash[this[i]] = true
        if (j >= 0 && j < imageIds.length) {
          annoImageIds.push(imageIds[j])
        }
        // }
      }
    }
    const annoPromises = annoImageIds.map((annoImageId) => {
      return cornerstone.loadAndCacheImage(annoImageId)
    })
    Promise.all(annoPromises).then((value) => {
      console.log('promise', value)
    })

    this.loadDisplay()
    this.loadStudyBrowser()
    this.loadReport()
    this.resizeScreen()

    const promises = imageIds.map((imageId) => {
      // console.log(imageId)
      return cornerstone.loadAndCacheImage(imageId)
    })
    await Promise.all(promises).then((value) => {
      console.log('promise', value)
      // console.log("111",promise)
    })
    console.log('imageIds loading completed')

    await axios
      .post(
        this.config.data.getMhaListForCaseId,
        qs.stringify({
          caseId: this.state.caseId,
        }),
        {
          headers,
        }
      )
      .then((res) => {
        console.log(res)
        // const urls = res.data
        function sortUrl(x, y) {
          // small to big
          if (x[x.length - 5] < y[y.length - 5]) {
            return -1
          } else if (x[x.length - 5] > y[y.length - 5]) {
            return 1
          } else {
            return 0
          }
        }
        // console.log('url request data', res.data)
        const urlData = res.data
        const urls = []
        let count = 0
        let lobesLength = 0
        let airwayLength = 0
        let nodulesLength = 0
        let vesselLength = 0
        if (urlData) {
          if (urlData.lung && urlData.lung.length > 0) {
          }
          if (urlData.lobe && urlData.lobe.length > 0) {
            const prevCount = count
            urlData.lobe.sort(sortUrl)
            urlData.lobe.forEach((item, index) => {
              const order = Math.round(item[item.length - 5])
              const type = 'lobe' + order
              urls.push({
                url: item,
                order,
                index: index + prevCount,
                class: dictList[type].class,
                name: dictList[type].name,
                color: dictList[type].color,
              })
              count += 1
              lobesLength += 1
            })
          }
          if (urlData.airway && urlData.airway.length > 0) {
            const prevCount = count
            urlData.airway.forEach((item, index) => {
              const order = 0
              const type = 'airway'
              urls.push({
                url: item,
                order,
                index: index + prevCount,
                class: dictList[type].class,
                name: dictList[type].name,
                color: dictList[type].color,
              })
              count += 1
              airwayLength += 1
            })
          }
          if (urlData.nodule && urlData.nodule.length > 0) {
            const prevCount = count
            urlData.nodule.sort(sortUrl)
            urlData.nodule.forEach((item, index) => {
              const order = Math.round(item[item.length - 5])
              const type = 'nodule'
              urls.push({
                url: item,
                order,
                index: index + prevCount,
                class: dictList[type].class,
                name: dictList[type].name + order,
                color: dictList[type].color,
              })
              count += 1
              nodulesLength += 1
            })
          }
          if (urlData.vessel && urlData.vessel.length > 0) {
            const prevCount = count
            urlData.vessel.forEach((item, index) => {
              const order = 0
              const type = 'vessel'
              urls.push({
                url: item,
                order,
                index: index + prevCount,
                class: dictList[type].class,
                name: dictList[type].name,
                color: dictList[type].color,
              })
              count += 1
              vesselLength += 1
            })
          }
        }
        const segments = Object.keys(urls).map((key) => null)
        const percent = Object.keys(urls).map((key) => 0)
        const listLoading = Object.keys(urls).map((key) => true)
        console.log('urls', urls)
        this.setState({
          urls: urls,
          lobesLength,
          airwayLength,
          nodulesLength,
          vesselLength,
          segments: segments,
          percent: percent,
          listLoading: listLoading,
        })
        urls.forEach((item, index) => {
          this.DownloadSegment(item.index)
        })
      })
      .catch((error) => {
        console.log(error)
      })
    // function sortByProp(prop) {
    //   return function (a, b) {
    //     var value1 = a[prop]
    //     var value2 = b[prop]
    //     return value1 - value2
    //   }
    // }
    axios
      .post(
        this.config.draft.getLobeInfo,
        qs.stringify({
          caseId: this.state.caseId,
        })
      )
      .then((res) => {
        console.log('lobe info request', res)
        const data = res.data
        if (data.lobes) {
          const lobesData = []
          data.lobes.forEach((item, index) => {
            const lobeIndex = _.findIndex(this.state.urls, { order: item.name })
            if (lobeIndex !== -1) {
              item.index = this.state.urls[lobeIndex].index
              item.lobeName = lobeName[item.name]
              lobesData.push(item)
            }
          })
          lobesData.sort((a, b) => a.index - b.index)
          this.saveLobesData(lobesData)
        }
      })
    const tubularData = []
    const airwayIndex = _.findIndex(this.state.urls, { class: 1 })
    if (airwayIndex !== -1) {
      tubularData.push({
        name: '气管',
        number: '未知',
        index: this.state.urls[airwayIndex].index,
      })
    }
    const vesselIndex = _.findIndex(this.state.urls, { class: 4 })
    if (vesselIndex !== -1) {
      tubularData.push({
        name: '血管',
        number: '未知',
        index: this.state.urls[vesselIndex].index,
      })
    }
    this.saveTubularData(tubularData)
    // const lobesData = lobes.lobes
    // console.log(lobesData)
    // lobesData.forEach((item, index) => {
    //   item.index = index
    //   item.order = urls[index].order
    // })
    // this.saveLobesData(lobesData)

    const nodulesData = []
    if (this.state.nodules && this.state.nodules.length !== 0) {
      this.state.nodules.forEach((item, index) => {
        let position = nodulePlaces[item.place]
        let malignancyName = noduleMalignancyName[item.malignancy]
        if (!position) {
          position = '待定'
        }
        if (!malignancyName) {
          malignancyName = '待定'
        }
        const { lobesLength, airwayLength } = this.state
        const urlIndex = index + lobesLength + airwayLength
        if (urlIndex <= this.state.urls.length - 1) {
          nodulesData.push({
            index: urlIndex,
            order: this.state.urls[urlIndex].order,
            name: this.state.urls[urlIndex].name,
            position,
            malignancy: item.malignancy,
            malignancyName,
          })
        }
      })
    }

    this.saveNodulesData(nodulesData)
    //local test
    // const fileList = []
    // for (let i = 0; i < 282; i++) {
    //   if (i < 10) {
    //     fileList.push('http://localhost:3000/dcms/00' + i + '.dcm')
    //   } else if (i < 100) {
    //     fileList.push('http://localhost:3000/dcms/0' + i + '.dcm')
    //   } else {
    //     fileList.push('http://localhost:3000/dcms/' + i + '.dcm')
    //   }
    // }
    // const localImageIds = []
    // const filePromises = fileList.map((file) => {
    //   return axios.get(file, { responseType: 'blob' }).then((res) => {
    //     const file = res.data
    //     const imageId = cornerstoneWADOImageLoader.wadouri.fileManager.add(file)
    //     localImageIds.push(imageId)
    //   })
    // })
    // Promise.all(filePromises).then(() => {
    //   this.getMPRInfo(localImageIds)
    // })
    const firstImageId = imageIds[imageIds.length - 1]

    cornerstone.loadAndCacheImage(firstImageId).then((img) => {
      console.log('first img', img)
      let dataSet = img.data
      let imagePositionPatientString = dataSet.string('x00200032')
      let imagePositionPatient = imagePositionPatientString.split('\\')
      let imageOrientationPatientString = dataSet.string('x00200037')
      let imageOrientationPatient = imageOrientationPatientString.split('\\')
      let rowCosines = [imageOrientationPatient[0], imageOrientationPatient[1], imageOrientationPatient[2]]
      let columnCosines = [imageOrientationPatient[3], imageOrientationPatient[4], imageOrientationPatient[5]]

      const xVoxels = img.columns
      const yVoxels = img.rows
      const zVoxels = imageIds.length
      const xSpacing = img.columnPixelSpacing
      const ySpacing = img.rowPixelSpacing
      const zSpacing = 1.0
      const rowCosineVec = vec3.fromValues(...rowCosines)
      const colCosineVec = vec3.fromValues(...columnCosines)
      const scanAxisNormal = vec3.cross([], rowCosineVec, colCosineVec)
      const direction = [...rowCosineVec, ...colCosineVec, ...scanAxisNormal]
      const origin = imagePositionPatient

      const { slope, intercept } = img
      const pixelArray = new Float32Array(xVoxels * yVoxels * zVoxels).fill(intercept)
      const scalarArray = vtkDataArray.newInstance({
        name: 'Pixels',
        numberOfComponents: 1,
        values: pixelArray,
      })

      const imageData = vtkImageData.newInstance()

      imageData.setDimensions(xVoxels, yVoxels, zVoxels)
      imageData.setSpacing(xSpacing, ySpacing, zSpacing)
      imageData.setDirection(direction)
      imageData.setOrigin(...origin)
      imageData.getPointData().setScalars(scalarArray)

      const { actor, mapper } = this.createActorMapper(imageData)

      // mapper.setMaximumSamplesPerRay(2000);
      // mapper.setSampleDistance(2);
      const volumesRange = imageData.getBounds()
      const segRange = {
        xMin: volumesRange[0],
        xMax: volumesRange[1],
        yMin: volumesRange[2],
        yMax: volumesRange[3],
        zMin: volumesRange[4],
        zMax: volumesRange[5],
      }
      const originXBorder = Math.round(xVoxels * xSpacing)
      const originYBorder = Math.round(yVoxels * ySpacing)
      const originZBorder = Math.round(zVoxels * zSpacing)
      console.log('segRange', segRange)
      const numVolumePixels = xVoxels * yVoxels * zVoxels

      // If you want to load a segmentation labelmap, you would want to load
      // it into this array at this point.
      // const threeDimensionalPixelData = new Float32Array(numVolumePixels)
      // // Create VTK Image Data with buffer as input
      // const labelMap = vtkImageData.newInstance()

      // // right now only support 256 labels
      // const dataArray = vtkDataArray.newInstance({
      //   numberOfComponents: 1, // labelmap with single component
      //   values: threeDimensionalPixelData,
      // })

      // labelMap.getPointData().setScalars(dataArray)
      // labelMap.setDimensions(xVoxels, yVoxels, zVoxels)
      // labelMap.setSpacing(...imageData.getSpacing())
      // labelMap.setOrigin(...imageData.getOrigin())
      // labelMap.setDirection(...imageData.getDirection())

      this.setState(
        {
          vtkImageData: imageData,
          volumes: [actor],
          // labelMapInputData: labelMap,
          origin: [(segRange.xMax + segRange.xMin) / 2, (segRange.yMax + segRange.yMin) / 2, (segRange.zMax + segRange.zMin) / 2],
          dimensions: [xVoxels, yVoxels, zVoxels],
          spacing: [xSpacing, ySpacing, zSpacing],
          originXBorder,
          originYBorder,
          originZBorder,
          segRange,
        },
        () => {
          this.getMPRInfoWithPriority(imageIds)
          // this.getMPRInfo(imageIds)
        }
      )
    })
    axios
      .post(
        this.config.draft.getCenterLine,
        qs.stringify({
          caseId: this.state.caseId,
        })
      )
      .then((res) => {
        console.log('centerLine request', res)
        const data = res.data
        if (data.centerline) {
          const coos = data.centerline
          this.processCenterLine(coos)
        }
      })
    // this.processCenterLine()
    // this.processOneAirway()
    // const origin = document.getElementById('origin-canvas')
    // const canvas = document.getElementById('canvas')
    // console.log('origin-canvas',canvas)
    // const canvas_ROI = document.createElement('canvas')
    // canvas_ROI.id = 'canvasROI'
    // canvas_ROI.height = 500
    // canvas_ROI.width = 500
    // origin.appendChild(canvas_ROI)
    // canvas_ROI.style.position = 'absolute'
  }

  componentWillUnmount() {
    console.log('remove')

    const element = this.element
    element.removeEventListener('cornerstoneimagerendered', this.onImageRendered)

    element.removeEventListener('cornerstonenewimage', this.onNewImage)

    // window.removeEventListener("resize", this.onWindowResize)
    document.removeEventListener('keydown', this.onKeydown)
    window.removeEventListener('resize', this.resizeScreen.bind(this))
    // cornerstone.disable(element)
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.currentIdx !== this.state.currentIdx && this.state.autoRefresh === true) {
      this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
    }

    if (prevState.immersive !== this.state.immersive) {
      this.refreshImage(true, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
    }

    if (prevState.random !== this.state.random) {
      console.log('random change', this.state.boxes)
      this.saveToDB()
    }

    if (prevState.listsActiveIndex !== -1 && prevState.listsActiveIndex !== this.state.listsActiveIndex) {
      const visId = 'visual-' + prevState.listsActiveIndex
      if (document.getElementById(visId) !== undefined && document.getElementById(visId) !== null) {
        // document.getElementById(visId).innerHTML=''
        document.getElementById(visId).style.display = 'none'
        document.getElementById('closeVisualContent').style.display = 'none'
      } else {
        console.log('visId is not exist!')
      }
      console.log('listsActiveIndex', prevState.listsActiveIndex, this.state.listsActiveIndex)
      // document.
    }
    if (prevState.listsActiveIndex !== -1 && this.state.listsActiveIndex === -1) {
      this.setState({ preListActiveIdx: prevState.listsActiveIndex })
    }
    this.updateDisplay(prevProps, prevState)
    this.updateStudyBrowser(prevProps, prevState)
    this.updateReport(prevProps, prevState)
  }

  getMPRInfo(imageIds) {
    this.setState({
      imageIds: imageIds,
    })
    console.log('before')
    const promises = imageIds.map((imageId) => {
      return cornerstone.loadAndCacheImage(imageId)
    })
    Promise.all(promises).then(() => {
      console.log('after')
      const displaySetInstanceUid = '12345'

      const imageDataObject = getImageData(imageIds, displaySetInstanceUid)
      console.log('imageDataObject', imageDataObject)

      const labelMapInputData = this.setupSyncedBrush(imageDataObject)

      // const { actor, mapper } = this.createActorMapper(imageDataObject.vtkImageData)

      // this.setState({
      //   vtkImageData: imageDataObject.vtkImageData,
      //   volumes: [actor],
      //   labelMapInputData,
      // })

      // const dimensions = imageDataObject.dimensions
      // const spacing = imageDataObject.spacing
      // const imagePositionPatient = imageDataObject.metaData0.imagePositionPatient

      // const volumesRange = imageDataObject.vtkImageData.getBounds()
      // const segRange = {
      //   xMin: volumesRange[0],
      //   xMax: volumesRange[1],
      //   yMin: volumesRange[2],
      //   yMax: volumesRange[3],
      //   zMin: volumesRange[4],
      //   zMax: volumesRange[5],
      // }
      // console.log('segRange', segRange)
      // const origin = [(segRange.xMax + segRange.xMin) / 2, (segRange.yMax + segRange.yMin) / 2, (segRange.zMax + segRange.zMin) / 2]
      // console.log('origin', origin)
      // const originXBorder = Math.round(512 * spacing[0])
      // const originYBorder = Math.round(512 * spacing[1])
      // const originZBorder = imageIds.length
      // console.log('originXBorder', originXBorder, 'originYBorder', originYBorder, 'originZBorder', originZBorder)

      // this.setState({
      //   origin,
      //   dimensions,
      //   spacing,
      //   originXBorder,
      //   originYBorder,
      //   originZBorder,
      //   segRange,
      // })

      loadImageData(imageDataObject)

      const onAllPixelDataInsertedCallback = () => {
        const { actor, mapper } = this.createActorMapper(imageDataObject.vtkImageData)

        const scalarsData = imageDataObject.vtkImageData.getPointData().getScalars().getData()
        // const scalarsData = imageDataObject.vtkImageData.getPointData().getScalars().getData()

        // for (let i = 0; i < scalarsData.length; i++) {
        //     if (i < 262144 * 10) {
        //         // console.log("scalars", scalarsData[i])
        //         if (i / 512 < 50 || i % 512 < 50) {
        //             scalarsData[i] = -1024;
        //         }
        //     }
        // }
        // imageDataObject.vtkImageData.modified();
        const rgbTransferFunction = actor.getProperty().getRGBTransferFunction(0)

        const voi = this.state.voi

        const low = voi.windowCenter - voi.windowWidth / 2
        const high = voi.windowCenter + voi.windowWidth / 2

        rgbTransferFunction.setMappingRange(low, high)

        this.setState({
          vtkImageData: imageDataObject.vtkImageData,
          volumes: [actor],
          volumesLoading: false,
          labelMapInputData,
        })
      }

      imageDataObject.onAllPixelDataInserted(onAllPixelDataInsertedCallback)
    })
  }
  getMPRInfoWithPriority(imageIds) {
    const oneInterval = 10
    const twoInterval = 3
    const range = {
      max: Number.NEGATIVE_INFINITY,
      min: Number.POSITIVE_INFINITY,
    }
    let numberProcessed = 0
    const reRenderFraction = imageIds.length / 10
    let reRenderTarget = reRenderFraction
    imageIds.forEach((item, idx) => {
      let priority = 1
      if (idx === imageIds.length / 2) {
        priority = 4
      }
      if (idx % oneInterval === 0) {
        priority = 3
      }
      if (idx % oneInterval !== 0 && (idx % oneInterval) % twoInterval === 0) {
        priority = 2
      }
      loadAndCacheImagePlus(item, priority).then((res) => {
        const { max, min } = this.insertSlice(res, imageIds.length - 1 - idx)
        if (max > range.max) {
          range.max = max
        }

        if (min < range.min) {
          range.min = min
        }

        const dataArray = this.state.vtkImageData.getPointData().getScalars()
        dataArray.setRange(range, 1)
        numberProcessed++

        if (numberProcessed > reRenderTarget) {
          console.time('volumes modified')
          reRenderTarget += reRenderFraction
          this.state.vtkImageData.modified()
          console.timeEnd('volumes modified')
        }
        if (numberProcessed === imageIds.length) {
          console.time('volumes modified')
          this.state.vtkImageData.modified()
          console.timeEnd('volumes modified')
        }
      })
    })
    executeTask()
  }
  insertSlice(image, sliceIndex) {
    const imageData = this.state.vtkImageData
    // const imageId = image.imageId
    // const sliceIndex = Math.round(imageId.slice(imageId.length - 7, imageId.length - 4))
    const { slope, intercept } = image

    const scalars = imageData.getPointData().getScalars()
    const scalarData = scalars.getData()

    const pixels = image.getPixelData()
    const sliceLength = pixels.length

    let pixelIndex = 0
    let max = pixels[pixelIndex] * slope + intercept
    let min = max

    for (let pixelIndex = 0; pixelIndex < pixels.length; pixelIndex++) {
      const destIdx = pixelIndex + sliceIndex * sliceLength
      const pixel = pixels[pixelIndex]
      const pixelValue = pixel * slope + intercept

      if (pixelValue > max) {
        max = pixelValue
      } else if (pixelValue < min) {
        min = pixelValue
      }

      scalarData[destIdx] = pixelValue
    }
    return { max, min }
  }

  setupSyncedBrush(imageDataObject) {
    // Create buffer the size of the 3D volume
    const dimensions = imageDataObject.dimensions
    const width = dimensions[0]
    const height = dimensions[1]
    const depth = dimensions[2]
    const numVolumePixels = width * height * depth

    // If you want to load a segmentation labelmap, you would want to load
    // it into this array at this point.
    const threeDimensionalPixelData = new Float32Array(numVolumePixels)

    const buffer = threeDimensionalPixelData.buffer
    const imageIds = imageDataObject.imageIds
    const numberOfFrames = imageIds.length

    if (numberOfFrames !== depth) {
      throw new Error('Depth should match the number of imageIds')
    }

    // Create VTK Image Data with buffer as input
    const labelMap = vtkImageData.newInstance()

    // right now only support 256 labels
    const dataArray = vtkDataArray.newInstance({
      numberOfComponents: 1, // labelmap with single component
      values: threeDimensionalPixelData,
    })

    labelMap.getPointData().setScalars(dataArray)
    labelMap.setDimensions(...dimensions)
    labelMap.setSpacing(...imageDataObject.vtkImageData.getSpacing())
    labelMap.setOrigin(...imageDataObject.vtkImageData.getOrigin())
    labelMap.setDirection(...imageDataObject.vtkImageData.getDirection())

    return labelMap
  }
  createActorMapper(imageData) {
    const mapper = vtkVolumeMapper.newInstance()
    mapper.setInputData(imageData)

    const actor = vtkVolume.newInstance()
    actor.setMapper(mapper)

    const rgbTransferFunction = actor.getProperty().getRGBTransferFunction(0)

    const voi = this.state.voi

    const low = voi.windowCenter - voi.windowWidth / 2
    const high = voi.windowCenter + voi.windowWidth / 2

    rgbTransferFunction.setMappingRange(low, high)

    return {
      actor,
      mapper,
    }
  }

  createPipeline(binary, color, opacity, cl) {
    // console.log("createPipeline")
    const vtpReader = vtkXMLPolyDataReader.newInstance()
    vtpReader.parseAsArrayBuffer(binary)
    const source = vtpReader.getOutputData()

    // const lookupTable = vtkColorTransferFunction.newInstance()
    // const scalars = source.getPointData().getScalars();
    // const dataRange = [].concat(scalars ? scalars.getRange() : [0, 1]);
    // lookupTable.addRGBPoint(200.0,1.0,1.0,1.0)
    // lookupTable.applyColorMap(vtkColorMaps.getPresetByName('erdc_rainbow_bright'))
    // lookupTable.setMappingRange(dataRange[0], dataRange[1]);
    // lookupTable.updateRange();
    // const mapper = vtkMapper.newInstance({
    //   interpolateScalarsBeforeMapping: false, //颜色插值
    //   useLookupTableScalarRange: true,
    //   lookupTable,
    //   scalarVisibility: false,
    // })

    const mapper = vtkMapper.newInstance({
      scalarVisibility: false,
    })

    const actor = vtkActor.newInstance()
    actor.getProperty().setOpacity(opacity)
    actor.setMapper(mapper)

    actor.getProperty().setColor(color.c1 / 255, color.c2 / 255, color.c3 / 255)

    // let color="";
    // function Viewcolor(item){
    //      if(colorName==item.name){
    //       actor.getProperty().setColor(item.colorvalue)
    //      }
    // }

    actor.getProperty().setDiffuse(0.75)
    actor.getProperty().setAmbient(0.2)
    actor.getProperty().setSpecular(0)
    actor.getProperty().setSpecularPower(1)
    mapper.setInputData(source)
    // console.log("actor:", actor)
    return actor
  }
  DownloadSegment(idx) {
    const progressCallback = (progressEvent) => {
      const percent = Math.floor((100 * progressEvent.loaded) / progressEvent.total)
      const tmp_percent = this.state.percent
      tmp_percent[idx] = percent
      this.setState({ percent: tmp_percent })
    }
    const color = this.state.urls[idx].color
    const cl = this.state.urls[idx].class
    const cur_url = this.state.urls[idx].url + '?caseId=' + this.state.caseId
    HttpDataAccessHelper.fetchBinary(cur_url, { progressCallback }).then((binary) => {
      // let opacity = 1.0
      let actor
      if (cl === 0) {
        actor = this.createPipeline(binary, color, 0.6, cl)
      } else {
        actor = this.createPipeline(binary, color, 1.0, cl)
      }
      const tmp_segments = [].concat(this.state.segments)
      tmp_segments[idx] = actor
      const listLoading = this.state.listLoading
      this.timer = setTimeout(() => {
        listLoading[idx] = false
      }, 2500)
      this.setState({
        segments: tmp_segments,
      })
    })
  }
  updatePointActor(origin) {
    if (typeof origin === 'undefined') {
      origin = this.state.origin
    }

    const picked = this.transformOriginTo3DPicked(origin)
    // const picked = []
    // const {originXBorder, originYBorder, originZBorder} = this.state
    // const {xMax, yMax, zMax, xMin, yMin, zMin} = this.state.segRange
    // picked[0] = xMax - (origin[0] * (xMax - xMin ) / originXBorder)
    // picked[1] = yMin + (origin[1] * (yMax - yMin) / originYBorder)
    // picked[2] = zMax - (origin[2] * (zMax - zMin) / originZBorder)

    const sphereSource = vtkSphereSource.newInstance()
    sphereSource.setRadius(5)
    sphereSource.setCenter(picked)
    const mapper = vtkMapper.newInstance({
      scalarVisibility: false,
    })
    mapper.setInputData(sphereSource.getOutputData())
    const actor = vtkActor.newInstance()
    actor.setMapper(mapper)
    actor.getProperty().setColor(1, 0, 0)
    actor.getProperty().setDiffuse(0.75)
    actor.getProperty().setAmbient(0.2)
    actor.getProperty().setSpecular(0)
    actor.getProperty().setSpecularPower(1)

    this.setState({
      pointActors: [actor],
    })
  }
  clearPointActor() {
    this.setState({
      pointActors: [],
    })
  }

  saveNodulesData(nodulesData) {
    console.log('nodulesData', nodulesData)
    const nodulesOpacities = new Array(nodulesData.length).fill(100)
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
    const lobesOpacities = new Array(lobesData.length).fill(60)
    const lobesActive = new Array(lobesData.length).fill(false)
    const lobesVisible = new Array(lobesData.length).fill(true)
    const lobesOpacityChangeable = new Array(lobesData.length).fill(false)
    const lobesController = {
      lobesOpacities,
      lobesActive,
      lobesVisible,
      lobesOpacityChangeable,
    }
    // lobesData.forEach((item, index) => {
    //   lobesData[index].volume = item.volumn;
    //   lobesData[index].percent = item.precent;
    //   delete lobesData[index].volumn;
    //   delete lobesData[index].precent;
    // });
    this.setState({
      lobesData,
      lobesController,
    })
  }
  saveTubularData(tubularData) {
    console.log('tubularData', tubularData)
    const tubularOpacities = new Array(tubularData.length).fill(100)
    const tubularActive = new Array(tubularData.length).fill(false)
    const tubularVisible = new Array(tubularData.length).fill(true)
    const tubularOpacityChangeable = new Array(tubularData.length).fill(false)
    const tubularController = {
      tubularOpacities,
      tubularActive,
      tubularVisible,
      tubularOpacityChangeable,
    }
    this.setState({
      tubularData,
      tubularController,
    })
  }
  processCenterLine(coos) {
    const segRange = this.state.segRange
    const spacing = this.state.spacing
    const xOffset = segRange.xMin
    const yOffset = segRange.yMin
    const zOffset = segRange.zMin
    const centerLinePoints = []
    coos.forEach((item, index) => {
      const z = item[0]
      const y = item[1]
      const x = item[2]
      centerLinePoints.push(vec3.fromValues(Math.floor(x * spacing[0] + xOffset), Math.floor(y * spacing[1] + yOffset), Math.floor(z + zOffset)))
    })
    this.setState({
      centerLinePoints,
    })
    //local test
    // const coos = centerLine.coos
    // const regions = centerLine.regions
    // for (let i = 0; i < regions.length; i++) {
    //   const region = regions[i]
    //   let zMax, zMin, yMax, yMin, xMax, xMin
    //   if (region[0][0] < region[1][0]) {
    //     zMin = region[0][0]
    //     zMax = region[1][0]
    //   } else {
    //     zMin = region[1][0]
    //     zMax = region[0][0]
    //   }
    //   if (region[0][1] < region[1][1]) {
    //     yMin = region[0][1]
    //     yMax = region[1][1]
    //   } else {
    //     yMin = region[1][1]
    //     yMax = region[0][1]
    //   }
    //   if (region[0][2] < region[1][2]) {
    //     xMin = region[0][2]
    //     xMax = region[1][2]
    //   } else {
    //     xMin = region[1][2]
    //     xMax = region[0][2]
    //   }
    //   const regionPoints = []
    //   coos.forEach((item, index) => {
    //     const z = item[0]
    //     const y = item[1]
    //     const x = item[2]
    //     if (z <= zMax && z >= zMin && y <= yMax && y >= yMin && x <= xMax && x >= xMin) {
    //       regionPoints.push(vec3.fromValues(Math.floor(x * 0.7 + xOffset), Math.floor(y * 0.7 + yOffset), z + zOffset))
    //     }
    //   })
    //   centerLine.regions[i].points = regionPoints
  }
  getMPRStyles(selectedNum, viewerWidth, viewerHeight) {
    if (typeof selectedNum == 'undefined') {
      selectedNum = this.state.selectedNum
    }
    if (typeof viewerWidth == 'undefined') {
      viewerWidth = this.state.viewerWidth
    }
    if (typeof viewerHeight == 'undefined') {
      viewerHeight = this.state.viewerHeight
    }
    //console.log("getSelection", selectedNum, viewerWidth, viewerHeight)
    // MPR
    const styleOfSelectionTwo = {
      topLeft: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: viewerWidth / 2,
        height: viewerHeight / 2,
      },
      topRight: {
        position: 'absolute',
        top: 0,
        left: viewerWidth / 2,
        width: viewerWidth / 2,
        height: viewerHeight / 2,
      },
      bottomLeft: {
        position: 'absolute',
        top: viewerHeight / 2,
        left: 0,
        width: viewerWidth / 2,
        height: viewerHeight / 2,
      },
      bottomRight: {
        position: 'absolute',
        top: viewerHeight / 2,
        left: viewerWidth / 2,
        width: viewerWidth / 2,
        height: viewerHeight / 2,
      },
    }
    // MPR selected
    const styleOfSelectionThree = {
      left: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 0.67 * viewerWidth,
        height: viewerHeight,
      },
      topRight: {
        position: 'absolute',
        top: 0,
        left: 0.67 * viewerWidth,
        width: 0.33 * viewerWidth,
        height: 0.33 * viewerHeight,
      },
      middleRight: {
        position: 'absolute',
        top: 0.33 * viewerHeight,
        left: 0.67 * viewerWidth,
        width: 0.33 * viewerWidth,
        height: 0.33 * viewerHeight,
      },
      bottomRight: {
        position: 'absolute',
        top: 0.66 * viewerHeight,
        left: 0.67 * viewerWidth,
        width: 0.33 * viewerWidth,
        height: 0.34 * viewerHeight,
      },
    }
    const MPRStyles = {
      threeD: {},
      axial: {},
      coronal: {},
      sagittal: {},
    }
    if (selectedNum === 0) {
      MPRStyles.threeD = styleOfSelectionTwo.topRight
      MPRStyles.axial = styleOfSelectionTwo.topLeft
      MPRStyles.coronal = styleOfSelectionTwo.bottomLeft
      MPRStyles.sagittal = styleOfSelectionTwo.bottomRight
    } else if (selectedNum === 1) {
      MPRStyles.threeD = styleOfSelectionThree.left
      MPRStyles.axial = styleOfSelectionThree.topRight
      MPRStyles.coronal = styleOfSelectionThree.middleRight
      MPRStyles.sagittal = styleOfSelectionThree.bottomRight
    } else if (selectedNum === 2) {
      MPRStyles.threeD = styleOfSelectionThree.topRight
      MPRStyles.axial = styleOfSelectionThree.left
      MPRStyles.coronal = styleOfSelectionThree.middleRight
      MPRStyles.sagittal = styleOfSelectionThree.bottomRight
    } else if (selectedNum === 3) {
      MPRStyles.threeD = styleOfSelectionThree.topRight
      MPRStyles.axial = styleOfSelectionThree.middleRight
      MPRStyles.coronal = styleOfSelectionThree.left
      MPRStyles.sagittal = styleOfSelectionThree.bottomRight
    } else if (selectedNum === 4) {
      MPRStyles.threeD = styleOfSelectionThree.topRight
      MPRStyles.axial = styleOfSelectionThree.middleRight
      MPRStyles.coronal = styleOfSelectionThree.bottomRight
      MPRStyles.sagittal = styleOfSelectionThree.left
    }
    return MPRStyles
  }
  getCPRStyles(viewerWidth, viewerHeight) {
    if (typeof viewerWidth == 'undefined') {
      viewerWidth = this.state.viewerWidth
    }
    if (typeof viewerHeight == 'undefined') {
      viewerHeight = this.state.viewerHeight
    }

    // airway
    const styleOfSelectionFour = {
      topLeft: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: viewerWidth * 0.5,
        height: viewerHeight * 0.4,
      },
      topRight: {
        position: 'absolute',
        top: 0,
        left: viewerWidth * 0.5,
        width: viewerWidth * 0.5,
        height: viewerHeight * 0.4,
      },
      bottomLeft: {
        position: 'absolute',
        top: viewerHeight * 0.4,
        left: 0,
        width: viewerWidth * 0.5,
        height: viewerHeight * 0.4,
      },
      bottomRight: {
        position: 'absolute',
        top: viewerHeight * 0.4,
        left: viewerWidth * 0.5,
        width: viewerWidth * 0.5,
        height: viewerHeight * 0.4,
      },
      middle: {
        position: 'absolute',
        top: viewerHeight * 0.8,
        left: 0,
        width: viewerWidth,
        height: viewerHeight * 0.1,
      },
      bottom: {
        position: 'absolute',
        top: viewerHeight * 0.8,
        left: 0,
        width: viewerWidth,
        height: viewerHeight * 0.2,
      },
    }

    const CPRStyles = {
      threeD: styleOfSelectionFour.topRight,
      axial: styleOfSelectionFour.topLeft,
      coronal: styleOfSelectionFour.bottomLeft,
      sagittal: styleOfSelectionFour.bottomRight,
      // fragment: styleOfSelectionFour.middle,
      airway: styleOfSelectionFour.bottom,
    }

    return CPRStyles
  }
  getLoadingStyle() {
    const mode = this.state.mode
    const loadingStyle = { position: 'absolute', top: 0, left: 0 }
    if (mode === 2) {
      const MPRStyles = this.getMPRStyles()
      if (MPRStyles.threeD) {
        loadingStyle.top = MPRStyles.threeD.top
        loadingStyle.left = MPRStyles.threeD.left
      }
    } else if (mode === 3) {
      const CPRStyles = this.getCPRStyles()
      if (CPRStyles.threeD) {
        loadingStyle.top = CPRStyles.threeD.top
        loadingStyle.left = CPRStyles.threeD.left
      }
    }
    return loadingStyle
  }
  resizeViewer(viewerWidth, viewerHeight) {
    if (typeof viewerWidth == 'undefined') {
      viewerWidth = this.state.viewerWidth
    }
    if (typeof viewerHeight == 'undefined') {
      viewerHeight = this.state.viewerHeight
    }
    console.log('resizeViewer', viewerWidth, viewerHeight)
    this.setState(
      {
        viewerWidth,
        viewerHeight,
      },
      () => {
        this.changeMode(this.state.mode)
      }
    )
  }
  // keydown(e) {
  //   // e.which : +/187, -/189
  //   // if(e.ctrlKey){
  //   //   console.log("ctrl")
  //   //   this.setState({
  //   //     isCtrl: true
  //   //   })
  //   // }
  //   if (e.shiftKey) {
  //     console.log('ctrl')
  //     this.setState({
  //       isCtrl: true,
  //     })
  //   }
  //   const isCtrl = this.state.isCtrl
  //   if (e.which === 187 && isCtrl) {
  //   }
  //   const that = this
  //   window.addEventListener('keyup', keyup)
  //   function keyup(e) {
  //     that.setState({
  //       isCtrl: false,
  //     })
  //     window.removeEventListener('keyup', keyup)
  //   }
  // }
  // rightClick(picked) {
  //   console.log('right click', picked)
  //   if (this.state.editing) {
  //     if (picked) {
  //       const { originXBorder, originYBorder, originZBorder } = this.state
  //       const origin = this.transform3DPickedToOrigin(picked)
  //       if (origin[0] >= 0 && origin[0] <= originXBorder && origin[1] >= 0 && origin[1] <= originYBorder && origin[2] >= 0 && origin[2] <= originZBorder) {
  //         this.setState({
  //           origin: origin,
  //         })
  //         this.updateAllByOrigin()
  //       }
  //     }
  //   }
  // }
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

  changePaintRadius(radius) {
    const apis = this.apis

    apis.forEach((api, index) => {
      const paintWidget = api.widgets[0]
      const paintFilter = api.filters[0]
      paintWidget.setRadius(radius)
      paintFilter.setRadius(radius)
    })
  }
  updateLabelDataByThreshold() {
    const threshold = this.state.labelThreshold
    const dimensions = this.state.dimensions
    const labelData = this.state.labelData

    const { minX, maxX, minY, maxY, minZ, maxZ } = labelData.range

    const indices = labelData.range
    indices.splice(0, indices.length)
    const scalarsDataOfImageData = this.state.vtkImageData.getPointData().getScalars().getData()

    for (let z = minZ; z < maxZ; z++) {
      for (let y = minY; y < maxY; y++) {
        for (let x = minX; x < maxX; x++) {
          const index = x + y * dimensions[0] + (z - 1) * dimensions[0] * dimensions[1]
          if (scalarsDataOfImageData[index] > threshold - 1024) {
            indices.push(index)
          }
        }
      }
    }

    const labelMapInputData = this.state.labelMapInputData
    const scalarsData = labelMapInputData.getPointData().getScalars().getData()

    indices.forEach((item) => {
      scalarsData[item] = 1
    })

    labelMapInputData.modified()
  }
  updateLabelDataByColor() {
    const labelColor = this.state.labelColor
    const apis = this.apis

    apis.forEach((api, apiIndex) => {
      api.setSegmentRGB(1, labelColor)
    })
  }
  changeRadius(e) {
    const radius = e
  }
  afterChangeRadius(e) {
    const radius = e
    this.setState(
      {
        paintRadius: radius,
      },
      () => {
        this.changePaintRadius(radius)
      }
    )
  }
  changeThreshold(e) {
    const threshold = e
  }
  afterChangeThreshold(e) {
    const threshold = e
    this.setState(
      {
        labelThreshold: threshold,
      },
      () => {
        this.updateLabelDataByThreshold()
      }
    )
  }
  setPaintColor(e) {
    const color = [e.r, e.g, e.b]
    this.setState(
      {
        labelColor: color,
      },
      () => {
        this.updateLabelDataByColor()
      }
    )
  }

  setSegmentOpacity(idx, opacity) {
    let tmp_segments = [].concat(this.state.segments)
    if (tmp_segments[idx]) {
      tmp_segments[idx].getProperty().setOpacity(opacity)
    }
    this.setState({ segments: tmp_segments })
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
    } else if (classfication === 1) {
      const tubularController = this.state.tubularController
      tubularController.tubularActive[index] = !tubularController.tubularActive[index]
      this.setState({
        tubularController,
      })
    } else if (classfication === 2) {
      const nodulesController = this.state.nodulesController
      nodulesController.nodulesActive[index] = !nodulesController.nodulesActive[index]
      this.setState({
        nodulesController,
      })

      // if (this.state.MPR && this.state.painting && nodulesController.nodulesActive[index]) {
      //   this.createNoduleMask(urlIndex)
      // }
    }
  }
  setVisible(classfication, index, urlIndex, e) {
    e.stopPropagation()
    if (classfication === 0) {
      const lobesController = this.state.lobesController
      lobesController.lobesVisible[index] = !lobesController.lobesVisible[index]
      if (lobesController.lobesVisible[index]) {
        this.setSegmentOpacity(urlIndex, lobesController.lobesOpacities[index])
      } else {
        this.setSegmentOpacity(urlIndex, 0)
      }

      this.setState({
        lobesController,
      })
    } else if (classfication === 1) {
      const tubularController = this.state.tubularController
      tubularController.tubularVisible[index] = !tubularController.tubularVisible[index]
      if (tubularController.tubularVisible[index]) {
        this.setSegmentOpacity(urlIndex, tubularController.tubularOpacities[index])
      } else {
        this.setSegmentOpacity(urlIndex, 0)
      }

      this.setState({
        tubularController,
      })
    } else if (classfication === 2) {
      const nodulesController = this.state.nodulesController
      nodulesController.nodulesVisible[index] = !nodulesController.nodulesVisible[index]
      if (nodulesController.nodulesVisible[index]) {
        this.setSegmentOpacity(urlIndex, nodulesController.nodulesOpacities[index])
      } else {
        this.setSegmentOpacity(urlIndex, 0)
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
    } else if (classfication === 1) {
      const tubularController = this.state.tubularController
      tubularController.tubularOpacityChangeable[index] = !tubularController.tubularOpacityChangeable[index]
      this.setState({
        tubularController,
      })
    } else if (classfication === 2) {
      const nodulesController = this.state.nodulesController
      nodulesController.nodulesOpacityChangeable[index] = !nodulesController.nodulesOpacityChangeable[index]
      this.setState({
        nodulesController,
      })
    }
  }
  changeOpacity(classfication, index, urlIndex, value) {
    const opacity = value
    if (classfication === 0) {
      const lobesController = this.state.lobesController
      lobesController.lobesOpacities[index] = opacity
      this.setSegmentOpacity(urlIndex, opacity / 100)

      this.setState({
        lobesController,
      })
    } else if (classfication === 1) {
      const tubularController = this.state.tubularController
      tubularController.tubularOpacities[index] = opacity
      this.setSegmentOpacity(urlIndex, opacity / 100)

      this.setState({
        tubularController,
      })
    } else if (classfication === 2) {
      const nodulesController = this.state.nodulesController
      nodulesController.nodulesOpacities[index] = opacity
      this.setSegmentOpacity(urlIndex, opacity / 100)

      this.setState({
        nodulesController,
      })
    }
  }
  selectOpacity(e) {
    e.stopPropagation()
  }

  handleFuncButton(idx, e) {
    switch (idx) {
      case 'FRG':
        break
      case 'MPR':
        this.setState({
          MPR: true,
        })
        this.changeMode(2)
        break
      case 'STMPR':
        this.setState({
          MPR: false,
        })
        this.changeMode(1)
        break
      case 'RC':
        this.resetAllView()
        break
      case 'HC':
        this.setState({
          displayCrosshairs: false,
        })
        this.toggleCrosshairs(false)
        break
      case 'SC':
        this.setState({
          displayCrosshairs: true,
        })
        this.toggleCrosshairs(true)
        break
      case 'BP':
        this.beginPaint()
        break
      case 'DP':
        this.doPaint()
        break
      case 'DE':
        this.doErase()
        break
      case 'EP':
        this.endPaint()
        break
      case 'CPR':
        this.setState({
          CPR: true,
        })
        this.changeMode(3)
        break
      case 'STCPR':
        this.setState({
          CPR: false,
        })
        this.changeMode(2)
        break
      case 'RA':
        this.pickAirway()
        // this.createAirwayVolumes();
        break
      case 'FS':
        this.finishPicking()
        break
      default:
        break
    }
  }
  setWL(model) {
    // for model paramaters: 1 represents LUNG, 2 represents BONE, 3 represents VENTRAL, 4 represents MEDIA
    const voi = this.state.voi
    if (model === 1) {
      voi.windowWidth = 1600
      voi.windowCenter = -600
    } else if (model === 2) {
      voi.windowWidth = 1000
      voi.windowCenter = 300
    } else if (model === 3) {
      voi.windowWidth = 400
      voi.windowCenter = 40
    } else if (model === 4) {
      voi.windowWidth = 500
      voi.windowCenter = 50
    }

    const volume = this.state.volumes[0]
    const rgbTransferFunction = volume.getProperty().getRGBTransferFunction(0)

    const low = voi.windowCenter - voi.windowWidth / 2
    const high = voi.windowCenter + voi.windowWidth / 2

    rgbTransferFunction.setMappingRange(low, high)

    const apis = this.apis
    apis.forEach((api) => {
      const renderWindow = api.genericRenderWindow.getRenderWindow()

      const { windowWidth, windowCenter } = voi
      api.updateVOI(windowWidth, windowCenter)

      renderWindow.render()
    })

    this.setState({ voi: voi })
  }
  resetAllView() {
    const apis = this.apis

    apis.forEach((api) => {
      api.resetAllView()
    })
  }
  changeMode(mode) {
    const { viewerWidth, viewerHeight } = this.state
    if (mode === 1) {
      this.viewer3D.setContainerSize(viewerWidth, viewerHeight)
    } else if (mode === 2) {
      const MPRStyles = this.getMPRStyles()
      this.viewer3D.setContainerSize(MPRStyles.threeD.width, MPRStyles.threeD.height)
    } else if (mode === 3) {
      const CPRStyles = this.getCPRStyles()
      this.viewer3D.setContainerSize(CPRStyles.threeD.width, CPRStyles.threeD.height)
      // if (channelStyles.fragment) {
      //     this.viewerFragment.setContainerSize(
      //         channelStyles.fragment.width,
      //         channelStyles.fragment.height
      //     );
      // }
    }
    this.setState(
      {
        mode: mode,
      },
      () => {
        // after rendering
        if (mode === 2) {
          const MPRStyles = this.getMPRStyles()
          this.viewerAxial.setContainerSize(MPRStyles.axial.width, MPRStyles.axial.height)
          this.viewerCoronal.setContainerSize(MPRStyles.coronal.width, MPRStyles.coronal.height)
          this.viewerSagittal.setContainerSize(MPRStyles.sagittal.width, MPRStyles.sagittal.height)
        }
        if (mode === 3) {
          const CPRStyles = this.getCPRStyles()
          this.viewerAxial.setContainerSize(CPRStyles.axial.width, CPRStyles.axial.height)
          this.viewerCoronal.setContainerSize(CPRStyles.coronal.width, CPRStyles.coronal.height)
          this.viewerSagittal.setContainerSize(CPRStyles.sagittal.width, CPRStyles.sagittal.height)
          this.viewerAirway.setContainerSize(CPRStyles.airway.width, CPRStyles.airway.height)
        }
      }
    )
  }
  changeSelectedNum(selectedNum) {
    this.setState({
      selectedNum: selectedNum,
    })
  }
  toggleCrosshairs(displayCrosshairs) {
    const apis = this.apis

    apis.forEach((api) => {
      const { svgWidgetManager, svgWidgets } = api
      svgWidgets.rotatableCrosshairsWidget.setDisplay(displayCrosshairs)

      svgWidgetManager.render()
    })

    this.setState({ displayCrosshairs })
  }
  toggleTool(crosshairsTool) {
    const apis = this.apis

    apis.forEach((api, apiIndex) => {
      let istyle

      if (crosshairsTool) {
        istyle = vtkInteractorStyleRotatableMPRCrosshairs.newInstance()
      } else {
        istyle = vtkInteractorStyleMPRWindowLevel.newInstance()
      }
      // // add istyle
      api.setInteractorStyle({
        istyle,
        configuration: { apis, apiIndex },
      })
    })
    // if(crosshairsTool){
    //   apis[0].svgWidgets.rotatableCrosshairsWidget.resetCrosshairs(apis, 0);
    // }

    this.setState({ crosshairsTool })
  }
  beginPaint() {
    this.setState({
      painting: true,
    })
  }
  doPaint() {
    this.setState({
      erasing: false,
    })
    const apis = this.apis

    apis.forEach((api, index) => {
      const paintFilter = api.filters[0]
      paintFilter.setLabel(1)
    })
  }
  doErase() {
    this.setState({
      erasing: true,
    })
    const apis = this.apis

    apis.forEach((api, index) => {
      const paintFilter = api.filters[0]
      paintFilter.setLabel(0)
    })
  }
  endPaint() {
    this.setState({
      painting: false,
    })
  }

  storeApi = (viewportIndex) => {
    return (api) => {
      this.apis[viewportIndex] = api

      const apis = this.apis

      const renderWindow = api.genericRenderWindow.getRenderWindow()

      // Add rotatable svg widget
      api.addSVGWidget(vtkSVGRotatableCrosshairsWidget.newInstance(), 'rotatableCrosshairsWidget')

      const istyle = vtkInteractorStyleRotatableMPRCrosshairs.newInstance()
      // const istyle = vtkInteractorStyleMPRWindowLevel.newInstance()

      // add istyle
      api.setInteractorStyle({
        istyle,
        configuration: {
          apis,
          apiIndex: viewportIndex,
        },
      })

      api.setSlabThickness(0.1)

      renderWindow.render()

      // Its up to the layout manager of an app to know how many viewports are being created.
      if (apis[0] && apis[1] && apis[2]) {
        apis.forEach((api, index) => {
          api.svgWidgets.rotatableCrosshairsWidget.setApiIndex(index)
          api.svgWidgets.rotatableCrosshairsWidget.setApis(apis)
        })

        const api = apis[0]

        api.svgWidgets.rotatableCrosshairsWidget.resetCrosshairs(apis, 0)

        this.toggleCrosshairs(false)
      }

      const paintWidget = api.widgets[0]
      const paintFilter = api.filters[0]

      paintWidget.setRadius(this.state.paintRadius)
      paintFilter.setRadius(this.state.paintRadius)
    }
  }
  deleteApi = (viewportIndex) => {
    return () => {
      this.apis[viewportIndex] = null
    }
  }

  createNoduleMask(idx) {
    const labelDataArray = this.state.labelDataArray
    let labelData = labelDataArray[idx]

    if (!labelData) {
      const segment = this.state.segments[idx]
      const bounds = segment.getBounds()
      console.log('nowtime bounds', bounds)
      const firstPicked = [bounds[0], bounds[2], bounds[4]]
      const lastPicked = [bounds[1], bounds[3], bounds[5]]

      const firstOriginIndex = this.transform3DPickedToOriginIndex(firstPicked)
      const lastOriginIndex = this.transform3DPickedToOriginIndex(lastPicked)
      labelData = this.createLabelData(firstOriginIndex, lastOriginIndex)

      // const firstOrigin = this.transform3DPickedToOrigin(firstPicked);
      // const lastOrigin = this.transform3DPickedToOrigin(lastPicked);
      const origin = [Math.round((firstPicked[0] + lastPicked[0]) / 2), Math.round((firstPicked[1] + lastPicked[1]) / 2), Math.round((firstPicked[2] + lastPicked[2]) / 2)]
      console.log('nowtime origin', origin)
      labelData.origin = origin
      labelDataArray[idx] = labelData
    }

    const indices = labelData.indices
    const labelMapInputData = this.state.labelMapInputData
    const scalarsData = labelMapInputData.getPointData().getScalars().getData()

    indices.forEach((item) => {
      scalarsData[item] = 1
    })

    labelMapInputData.modified()

    const apis = this.apis
    const worldPos = labelData.origin
    apis[0].svgWidgets.rotatableCrosshairsWidget.moveCrosshairs(worldPos, apis, 0)
    const renderWindow = apis[0].genericRenderWindow.getRenderWindow()
    const istyle = renderWindow.getInteractor().getInteractorStyle()
    istyle.modified()
  }
  createLabelData(firstOriginIndex, lastOriginIndex) {
    const dimensions = this.state.dimensions
    const scalars = this.state.vtkImageData.getPointData().getScalars()
    const scalarsData = scalars.getData()

    const threshold = this.state.labelThreshold

    const minX = Math.round(Math.min(firstOriginIndex[0], lastOriginIndex[0])) - 5
    const maxX = Math.round(Math.max(firstOriginIndex[0], lastOriginIndex[0])) + 5
    const minY = Math.round(Math.min(firstOriginIndex[1], lastOriginIndex[1])) - 5
    const maxY = Math.round(Math.max(firstOriginIndex[1], lastOriginIndex[1])) + 5
    const minZ = Math.round(Math.min(firstOriginIndex[2], lastOriginIndex[2])) - 5
    const maxZ = Math.round(Math.max(firstOriginIndex[2], lastOriginIndex[2])) + 5

    const range = { minX, maxX, minY, maxY, minZ, maxZ }
    // console.log("label range", range)
    const indices = []

    for (let z = minZ; z < maxZ; z++) {
      for (let y = minY; y < maxY; y++) {
        for (let x = minX; x < maxX; x++) {
          const index = x + y * dimensions[0] + (z - 1) * dimensions[0] * dimensions[1]
          if (scalarsData[index] > threshold - 1024) {
            indices.push(index)
          }
        }
      }
    }

    const labelData = {
      indices,
      range,
    }
    return labelData
  }
  onPaintEnd(strokeBuffer, viewerType) {
    const dimensions = this.state.dimensions
    const rows = dimensions[0]
    const columns = dimensions[1]
    const numberOfFrames = dimensions[2]

    for (let i = 0; i < numberOfFrames; i++) {
      const frameLength = rows * columns
      const byteOffset = frameLength * i
      const strokeArray = new Uint8Array(strokeBuffer, byteOffset, frameLength)

      const strokeOnFrame = strokeArray.some((element) => element === 1)
      if (!strokeOnFrame) {
        continue
      }
      console.log('strokeOnFrame', ' i', i)
    }
  }

  onChangeSlice(slice, viewerType) {
    const origin = this.state.origin
    const segRange = this.state.segRange
    switch (viewerType) {
      case 0:
        origin[2] = slice + segRange.zMin
        break
      case 1:
        origin[1] = slice + segRange.yMin
        break
      case 2:
        origin[0] = slice + segRange.xMin
        break
      default:
        break
    }
    const apis = this.apis
    apis[0].svgWidgets.rotatableCrosshairsWidget.moveCrosshairs(origin, apis, 0)
    const renderWindow = apis[0].genericRenderWindow.getRenderWindow()
    const istyle = renderWindow.getInteractor().getInteractorStyle()
    istyle.modified()
  }

  createChannelFragmentVolumes() {
    const fragmentVolumes = []
    const zs = [-284, -280, -278, -274, -270, -266]
    zs.forEach((item, idx) => {
      const imageReslice = vtkImageReslice.newInstance()
      // console.log(imageReslice);
      imageReslice.setInputData(this.state.vtkImageData)
      imageReslice.setOutputDimensionality(2)
      const axialAxes = mat4.create()
      axialAxes[14] = item
      imageReslice.setResliceAxes(axialAxes)
      imageReslice.setOutputScalarType('Float32Array')
      const obliqueSlice = imageReslice.getOutputData()

      const dimensions = obliqueSlice.getDimensions()
      const spacing = obliqueSlice.getSpacing()
      const origin = obliqueSlice.getOrigin()
      if (idx < 3) {
        spacing[0] = spacing[0] * 1.3
        spacing[1] = spacing[1] * 1.3
        // origin[0] = origin[0] + 361 * idx
        origin[0] = origin[0] - 361 * 1.3 * idx
      } else {
        origin[0] = origin[0] - 361 * 1.3 * 2 - 361 * (idx - 2)
      }
      // origin[0] = origin[0] - 361 * idx
      const scalarsData = obliqueSlice.getPointData().getScalars().getData()
      const newImageData = vtkImageData.newInstance(obliqueSlice.get('direction'))
      // console.log("image data info", this.state.vtkImageData.get("spacing", "origin", "direction"))
      // console.log("slice data info", obliqueSlice.get("spacing", "origin", "direction"))
      const newPixelArray = new Float32Array(dimensions[0] * dimensions[1] * 5).fill(-1024)
      for (let i = 0; i < scalarsData.length; i++) {
        newPixelArray[i] = scalarsData[i]
      }
      const newScalarArray = vtkDataArray.newInstance({
        name: 'Pixels',
        values: newPixelArray,
      })
      newImageData.setDimensions(dimensions[0], dimensions[1], 5)
      newImageData.setSpacing(spacing)
      newImageData.setOrigin(origin)
      // newImageData.computeTransforms();
      newImageData.getPointData().setScalars(newScalarArray)

      const actor = vtkVolume.newInstance()
      const mapper = vtkVolumeMapper.newInstance()
      mapper.setInputData(newImageData)
      actor.setMapper(mapper)

      const rgbTransferFunction = actor.getProperty().getRGBTransferFunction(0)

      const voi = this.state.voi

      const low = voi.windowCenter - voi.windowWidth / 2
      const high = voi.windowCenter + voi.windowWidth / 2

      rgbTransferFunction.setMappingRange(low, high)

      fragmentVolumes.push(actor)
    })
    this.setState({
      fragmentVolumes,
    })
  }
  pickAirway() {
    this.setState(
      {
        airwayPicking: true,
      },
      () => {
        this.viewer3D.startPicking()
      }
    )
  }
  finishPicking() {
    this.setState(
      {
        airwayPicking: false,
      },
      () => {
        this.viewer3D.endPicking()
      }
    )
  }
  selectAirwayRange(range) {
    console.log('airway range', range)
    const centerLinePoints = this.state.centerLinePoints
    if (centerLinePoints && centerLinePoints.length) {
      const points = []
      centerLinePoints.forEach((item, index) => {
        const x = item[0]
        const y = item[1]
        const z = item[2]
        if (x <= range.xMax && x >= range.xMin && y <= range.yMax && y >= range.yMin && z <= range.zMax && z >= range.zMin) {
          points.push(item)
        }
      })
      console.log('seleted points', points)
      this.setState(
        {
          points,
        },
        () => {
          this.viewer3D.endPicking()
          this.createAirwayVolumes()
        }
      )
    } else {
      alert('没有中心线坐标')
    }
  }
  selectAirwayRangeByWidget(pickedPoints) {
    // not used
    console.log('airway picked points', pickedPoints)
    const centerLinePoints = this.state.centerLinePoints
    if (centerLinePoints && centerLinePoints.length) {
      const points = []
      for (let i = 0; i < pickedPoints.length; i++) {
        if (i === 0) {
          continue
        }
        const lastPickedPoint = pickedPoints[i - 1]
        const pickedPoint = pickedPoints[i]
        centerLinePoints.forEach((item) => {
          const x = item[0]
          const y = item[1]
          const z = item[2]
          if (this.isBetween(x, lastPickedPoint[0], pickedPoint[0]) && this.isBetween(y, lastPickedPoint[1], pickedPoint[1]) && this.isBetween(z, lastPickedPoint[2], pickedPoint[2])) {
            points.push(item)
          }
        })
      }
      console.log('points', points)
      this.setState(
        {
          points,
        },
        () => {
          // this.viewer3D.endPicking()
          this.createAirwayVolumes()
        }
      )
    }
  }
  isBetween(v, r1, r2) {
    if (r1 > r2) {
      if (v >= r2 && v <= r1) {
        return true
      }
    } else {
      if (v <= r2 && v >= r1) {
        return true
      }
    }
    return false
  }
  createAirwayVolumes() {
    const points = this.state.points
    const outputExtent = [512, 512]
    const outputSpacing = [0.7, 0.7]
    const number = points.length
    const { tangents, normals } = frenet(points)

    const fullAirwayImageData = vtkImageData.newInstance()
    const fullAirwayPixelArray = new Float32Array(outputExtent[0] * outputExtent[1] * number).fill(-1024)
    const imageReslice = vtkImageReslice.newInstance()
    // console.log(imageReslice);
    imageReslice.setInputData(this.state.vtkImageData)
    imageReslice.setOutputScalarType('Float32Array')
    // imageReslice.setOutputDimensionality(3);
    imageReslice.setOutputDimensionality(2)
    for (let i = 0; i < number; i++) {
      const center = points[i]
      const tangent = tangents[i]
      const normal = normals[i]
      const cross = vec3.create()
      vec3.cross(cross, tangent, normal)
      //console.log("frenet: ", center, tangent, normal, cross)
      const origin = vec4.create()
      const axes = mat4.create()
      for (let j = 0; j < 3; j++) {
        axes[j] = cross[j]
        axes[4 + j] = normal[j]
        axes[8 + j] = tangent[j]
        origin[j] = center[j] - (normal[j] * outputExtent[1] * outputSpacing[1]) / 2.0 - (cross[j] * outputExtent[0] * outputSpacing[0]) / 2.0
      }
      origin[3] = 1.0
      // console.log("origin", origin)
      axes[12] = origin[0]
      axes[13] = origin[1]
      axes[14] = origin[2]
      // console.log("axes", axes)
      imageReslice.setResliceAxes(axes)
      imageReslice.setOutputOrigin([0, 0, 0])
      imageReslice.setOutputExtent([0, outputExtent[0] - 1, 0, outputExtent[1] - 1, 0, 1])
      imageReslice.setOutputSpacing([outputSpacing[0], outputSpacing[1], 1])
      const obliqueSlice = imageReslice.getOutputData()
      // const dimensions = obliqueSlice.getDimensions();
      // console.log("dimensions", dimensions);
      const scalarData = obliqueSlice.getPointData().getScalars().getData()
      for (let j = 0; j < scalarData.length; j++) {
        fullAirwayPixelArray[j + i * scalarData.length] = scalarData[j]
      }
      // const newImageData = vtkImageData.newInstance();
      // const newPixelArray = new Float32Array(outputExtent[0] * outputExtent[1] * 5).fill(-1024);
      // const newScalarArray = vtkDataArray.newInstance({
      //     name: 'Pixels',
      //     values: newPixelArray
      // });
      // const scalarData = obliqueSlice.getPointData().getScalars().getData()
      // for (let j = 0; j < scalarData.length; j++) {
      //     newPixelArray[j] = scalarData[j]
      // }
      // newImageData.setDimensions(outputExtent[0], outputExtent[1], 5)
      // newImageData.setSpacing([outputSpacing[0], outputSpacing[1], 1])
      // const obliqueSliceOrigin = obliqueSlice.getOrigin();
      // newImageData.setOrigin([obliqueSliceOrigin[0] + 512 * i, obliqueSliceOrigin[1], obliqueSliceOrigin[2]])
      // newImageData.getPointData().setScalars(newScalarArray)
      // const actor = vtkVolume.newInstance();
      // const mapper = vtkVolumeMapper.newInstance();
      // mapper.setInputData(newImageData);
      // actor.setMapper(mapper);

      // const rgbTransferFunction = actor
      //     .getProperty()
      //     .getRGBTransferFunction(0);

      // const voi = this.state.voi;

      // const low = voi.windowCenter - voi.windowWidth / 2;
      // const high = voi.windowCenter + voi.windowWidth / 2;

      // rgbTransferFunction.setMappingRange(low, high);
      // unityVolumes.push(actor)
    }
    const fullAirwayScalarArray = vtkDataArray.newInstance({
      name: 'Pixels',
      values: fullAirwayPixelArray,
    })
    fullAirwayImageData.setDimensions(outputExtent[0], outputExtent[1], number)
    fullAirwayImageData.setSpacing([outputSpacing[0], outputSpacing[1], 5])
    fullAirwayImageData.getPointData().setScalars(fullAirwayScalarArray)

    const fullAirwayActor = vtkVolume.newInstance()
    const fullAirwayMapper = vtkVolumeMapper.newInstance()
    fullAirwayMapper.setInputData(fullAirwayImageData)
    fullAirwayActor.setMapper(fullAirwayMapper)

    const voi = this.state.voi

    const low = voi.windowCenter - voi.windowWidth / 2
    const high = voi.windowCenter + voi.windowWidth / 2

    const fullAirwayRgbTransferFunction = fullAirwayActor.getProperty().getRGBTransferFunction(0)

    fullAirwayRgbTransferFunction.setMappingRange(low, high)

    const centerAirwayImageReslice = vtkImageReslice.newInstance()
    centerAirwayImageReslice.setInputData(fullAirwayImageData)
    const fullAirwayDimensions = fullAirwayImageData.getDimensions()
    centerAirwayImageReslice.setOutputScalarType('Float32Array')
    centerAirwayImageReslice.setOutputDimensionality(2)
    const centerAirwayAxes = mat4.create()
    mat4.rotateX(centerAirwayAxes, centerAirwayAxes, Math.PI / 2)
    // centerAirwayAxes[12] = fullAirwayDimensions[0] * outputSpacing[0] / 2
    centerAirwayAxes[13] = (fullAirwayDimensions[1] * outputSpacing[1]) / 2
    // centerAirwayAxes[14] = fullAirwayDimensions[2] / 2
    centerAirwayImageReslice.setResliceAxes(centerAirwayAxes)
    centerAirwayImageReslice.setOutputOrigin([0, 0, 0])
    centerAirwayImageReslice.setOutputExtent([0, fullAirwayDimensions[0], 0, fullAirwayDimensions[2], 0, 1])
    const centerAirwayObliqueSlice = centerAirwayImageReslice.getOutputData()
    const centerAirwaySpacing = centerAirwayObliqueSlice.getSpacing()
    // console.log("newSpacing", newSpacing)
    centerAirwaySpacing[1] *= 4
    centerAirwayObliqueSlice.setSpacing(centerAirwaySpacing)
    const centerAirwayActor = this.obliqueSlice2Actor(centerAirwayObliqueSlice)
    // const originXYZW = this.multiplyPoint(axes, origin)
    // mat4.transpose(axes, axes)
    // const newOriginXYZW = this.multiplyPoint(axes, origin)
    // console.log("newOriginXYZW", newOriginXYZW)

    // axes[12] = newOriginXYZW[0]
    // axes[13] = newOriginXYZW[1]
    // axes[14] = newOriginXYZW[2]

    // imageReslice.setOutputOrigin([-182, -330, -280]); //with spacing
    // imageReslice.setOutputExtent([-182, 329, -330, 181, -280, -279]); //without spacing

    // imageReslice.setOutputOrigin([-178, -30, -280]);
    // imageReslice.setOutputExtent([-329, 182, -181, 330, -280, -270]);

    // this.generateLines()

    this.setState(
      {
        airwayVolumes: [],
      },
      () => {
        this.setState({
          airwayVolumes: [fullAirwayActor],
          airwayCenterVolumes: [centerAirwayActor],
        })
      }
    )
  }
  generateLines() {
    const p1 = [180, 0, 0]
    const p2 = [180, 512, 0]

    const lineSource = vtkLineSource.newInstance({ resolution: 10 })
    lineSource.setPoint1(p1)
    lineSource.setPoint2(p2)

    const mapper = vtkMapper.newInstance({
      scalarVisibility: false,
    })
    const actor = vtkActor.newInstance()
    console.log('lineSource', lineSource)
    mapper.setInputData(lineSource.getOutputData())
    actor.setMapper(mapper)
    actor.getProperty().setColor(1, 0, 0)
    this.setState({
      lineActors: [actor],
    })
  }
  obliqueSlice2Actor(obliqueSlice) {
    const dimensions = obliqueSlice.getDimensions()
    const spacing = obliqueSlice.getSpacing()
    // console.log('oblique spacing', spacing)
    const imageData = vtkImageData.newInstance()
    const pixelArray = new Float32Array(dimensions[0] * dimensions[1] * 5).fill(-1024)
    const scalarData = obliqueSlice.getPointData().getScalars().getData()
    for (let i = 0; i < scalarData.length; i++) {
      pixelArray[i] = scalarData[i]
    }
    const scalarArray = vtkDataArray.newInstance({
      name: 'Pixels',
      values: pixelArray,
    })
    imageData.setDimensions(dimensions[0], dimensions[1], 5)
    imageData.setSpacing(spacing)
    imageData.getPointData().setScalars(scalarArray)
    const actor = vtkVolume.newInstance()
    const mapper = vtkVolumeMapper.newInstance()
    mapper.setInputData(imageData)
    actor.setMapper(mapper)

    const voi = this.state.voi

    const low = voi.windowCenter - voi.windowWidth / 2
    const high = voi.windowCenter + voi.windowWidth / 2

    const fullAirwayRgbTransferFunction = actor.getProperty().getRGBTransferFunction(0)

    fullAirwayRgbTransferFunction.setMappingRange(low, high)
    return actor
  }
  multiplyPoint(matrix, vector) {
    const result = vec4.create()
    result[0] = matrix[0] * vector[0] + matrix[4] * vector[1] + matrix[8] * vector[2] + matrix[12]
    result[1] = matrix[1] * vector[0] + matrix[5] * vector[1] + matrix[9] * vector[2] + matrix[13]
    result[2] = matrix[2] * vector[0] + matrix[6] * vector[1] + matrix[10] * vector[2] + matrix[14]
    const num = 1 / (matrix[3] * vector[0] + matrix[7] * vector[1] + matrix[11] * vector[2] + matrix[15]) // this is 1/1=1 when m30, m31, m32 = 0 and m33 = 1
    result[0] *= num // so then multiplying by 1 is pointless..
    result[1] *= num
    result[2] *= num
    result[3] = 1.0
    return result
  }
  getRatio(model, cor) {
    //ratio for pixel to origin
    //for model parameter, 0 represents axial, 1 represents coronal, 2 represents sagittal
    //for cor parameter, 0 represents x, 1 represents y
    const { originXBorder, originYBorder, originZBorder } = this.state
    let ratio
    switch (model) {
      case 0:
        ratio = cor === 0 ? originXBorder / 272 : originYBorder / -272 // x's length:(442 - 170) y's length:(84 - 356)
        break
      case 1:
        ratio = cor === 0 ? originXBorder / 272 : originZBorder / -212 // x's length:(442 - 170) y's length:(114 - 326)
        break
      case 2:
        ratio = cor === 0 ? originYBorder / 272 : originZBorder / -212 // x's length:(442 - 170) y's length:(114 - 326)
        break
      default:
        break
    }
    return ratio
  }
  getTopLeftOffset(model) {
    //volume's top left, not viewer's top left
    //for model parameter, 0 represents axial, 1 represents coronal, 2 represents sagittal
    let x, y
    switch (model) {
      case 0:
        x = 170
        y = 356
        break
      case 1:
        x = 170
        y = 326
        break
      case 2:
        x = 170
        y = 326
        break
      default:
        break
    }
    return { x, y }
  }
  transformOriginToPixel(origin) {
    // origin to pixel
    const pixel = []
    const axialPixel = []
    axialPixel[0] = origin[0] / this.getRatio(0, 0) + this.getTopLeftOffset(0).x
    axialPixel[1] = origin[1] / this.getRatio(0, 1) + this.getTopLeftOffset(0).y

    const coronalPixel = []
    coronalPixel[0] = origin[0] / this.getRatio(1, 0) + this.getTopLeftOffset(1).x
    coronalPixel[1] = origin[2] / this.getRatio(1, 1) + this.getTopLeftOffset(1).y

    const sagittalPixel = []
    sagittalPixel[0] = origin[1] / this.getRatio(2, 0) + this.getTopLeftOffset(2).x
    sagittalPixel[1] = origin[2] / this.getRatio(2, 1) + this.getTopLeftOffset(2).y
    pixel[0] = axialPixel
    pixel[1] = coronalPixel
    pixel[2] = sagittalPixel
    return pixel
  }
  transformPixelToOrigin(pixel, model) {
    // pixel to origin
    // for model parameter, 0 represents axial, 1 represents coronal, 2 represents sagittal
    const origin = []
    if (model === 0) {
      origin[0] = (pixel[0] - this.getTopLeftOffset(0).x) * this.getRatio(0, 0)
      origin[1] = (pixel[1] - this.getTopLeftOffset(0).y) * this.getRatio(0, 1)
      origin[2] = this.state.origin[2]
    } else if (model === 1) {
      origin[0] = (pixel[0] - this.getTopLeftOffset(1).x) * this.getRatio(1, 0)
      origin[1] = this.state.origin[1]
      origin[2] = (pixel[1] - this.getTopLeftOffset(1).y) * this.getRatio(1, 1)
    } else if (model === 2) {
      origin[0] = this.state.origin[0]
      origin[1] = (pixel[0] - this.getTopLeftOffset(2).x) * this.getRatio(2, 0)
      origin[2] = (pixel[1] - this.getTopLeftOffset(2).y) * this.getRatio(2, 1)
    }
    return origin
  }
  transform3DPickedToOrigin(picked) {
    // 3D picked to origin
    const origin = []
    const { originXBorder, originYBorder, originZBorder } = this.state
    const { xMax, yMax, zMax, xMin, yMin, zMin } = this.state.segRange

    const x = picked[0]
    const y = picked[1]
    const z = picked[2]
    origin[0] = (originXBorder * (x - xMin)) / (xMax - xMin)
    origin[1] = (originYBorder * (y - yMin)) / (yMax - yMin)
    origin[2] = (originZBorder * (zMax - z)) / (zMax - zMin)
    return origin
  }
  transform3DPickedToOriginIndex(picked) {
    // 3D picked to origin index (no spacing)
    const origin = []
    const dimensions = this.state.dimensions
    const originIndexXLength = dimensions[0]
    const originIndexYLength = dimensions[1]
    const originIndexZLength = dimensions[2]
    const { xMax, yMax, zMax, xMin, yMin, zMin } = this.state.segRange

    const x = picked[0]
    const y = picked[1]
    const z = picked[2]
    origin[0] = (originIndexXLength * (x - xMin)) / (xMax - xMin)
    origin[1] = (originIndexYLength * (y - yMin)) / (yMax - yMin)
    origin[2] = (originIndexZLength * (z - zMin)) / (zMax - zMin)
    return origin
  }
  transformOriginTo3DPicked(origin) {
    // origin to 3D picked
    const picked = []
    const { originXBorder, originYBorder, originZBorder } = this.state
    const { xMax, yMax, zMax, xMin, yMin, zMin } = this.state.segRange

    picked[0] = xMin + (origin[0] * (xMax - xMin)) / originXBorder
    picked[1] = yMin + (origin[1] * (yMax - yMin)) / originYBorder
    picked[2] = zMax - (origin[2] * (zMax - zMin)) / originZBorder
    return picked
  }
}

// export default withRouter(CornerstoneElement);
export default connect(
  (state) => {
    return {
      caseData: state.dataCenter.caseData,
      caseId: state.dataCenter.caseId,
    }
  },
  (dispatch) => {
    return {
      getImageIdsByCaseId: (url, caseId) => dispatch(getImageIdsByCaseId(url, caseId)),
      getNodulesByCaseId: (url, caseId, username) => dispatch(getNodulesByCaseId(url, caseId, username)),
      dispatch,
    }
  }
)(CornerstoneElement)
