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
import { Grid, Icon, Button, Accordion, Modal, Dropdown, Menu, Label, Header, Popup, Table, Sidebar, Loader, Divider, Form, Card } from 'semantic-ui-react'
import { CloseCircleOutlined, CheckCircleOutlined, ConsoleSqlOutlined, SyncOutlined } from '@ant-design/icons'
import qs from 'qs'
import axios from 'axios'
import { Slider, Select, Checkbox, Tabs, InputNumber, Popconfirm, message, Cascader, Radio, Row, Col } from 'antd'
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
import { faChevronLeft, faChevronRight, faChevronDown, faChevronUp, faCaretDown, faFilter, faSortAmountDownAlt, faSortUp, faSortDown, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons'
import { connect } from 'react-redux'
import { getConfigJson, getImageIdsByCaseId, getNodulesByCaseId, dropCaseId, setFollowUpPlaying } from '../actions'
import { DropTarget } from 'react-dnd'

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
import VTK2DViewer from './VTK2DViewer'
import VTK3DViewer from './VTK3DViewer'
import VTKMaskViewer from './VTKMaskViewer'
import PreviewElement from './PreviewElement'
import FollowUpDisplayElement from './FollowUpDisplayElement'

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
let closeFollowUpInterval = undefined

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
    // color: { c1: 182, c2: 228, c3: 255 },
    color: { c1: 178, c2: 212, c3: 242 },
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
    // color: { c1: 128, c2: 174, c3: 128 },
    color: { c1: 178, c2: 212, c3: 242 },
  },
  lobe2: {
    class: 0,
    label: 'lobe_2',
    name: '右肺上叶',
    // color: { c1: 241, c2: 214, c3: 145 },
    color: { c1: 178, c2: 212, c3: 242 },
  },
  lobe3: {
    class: 0,
    label: 'lobe_3',
    name: '右肺下叶',
    // color: { c1: 177, c2: 122, c3: 101 },
    color: { c1: 178, c2: 212, c3: 242 },
  },
  lobe4: {
    class: 0,
    label: 'lobe_4',
    name: '左肺上叶',
    // color: { c1: 111, c2: 184, c3: 210 },
    color: { c1: 178, c2: 212, c3: 242 },
  },
  lobe5: {
    class: 0,
    label: 'lobe_5',
    name: '左肺下叶',
    // color: { c1: 216, c2: 101, c3: 79 },
    color: { c1: 178, c2: 212, c3: 242 },
  },
  vessel: {
    class: 4,
    label: 'vessel',
    name: '血管',
    // color: { c1: 200, c2: 100, c3: 50 },
    color: { c1: 178, c2: 212, c3: 242 },
  },
}
const lobeName = {
  1: '右肺中叶',
  2: '右肺上叶',
  3: '右肺下叶',
  4: '左肺上叶',
  5: '左肺下叶',
}
const immersiveStyle = {
  width: '1280px',
  height: '1280px',
  position: 'relative',
  // display: "inline",
  color: 'white',
}
const nodulePlaces = {
  0: '无法定位',
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

let modalBtnStyle = {
  width: '200px',
  display: 'block',
  // marginTop:'10px',
  marginBottom: '20px',
  marginLeft: 'auto',
  marginRight: 'auto',
}

const { Option } = Select
const boxProtoType = {
  rect_no: '',
  patho: '',
  place: 0,
  segment: 'None',
  slice_idx: 0,
  nodule_no: '',
  x1: 0,
  x2: 0,
  y1: 0,
  y2: 0,
  mask_array: [[], [], []],
  measure: {
    x1: 0,
    x2: 0,
    x3: 0,
    x4: 0,
    y1: 0,
    y2: 0,
    y3: 0,
    y4: 0,
    intersec_x: 0,
    intersec_y: 0,
  },
  diameter: 0,
  volume: 0,
  huMax: 0,
  huMean: 0,
  huMin: 0,
  nodule_hist: {
    n: [],
    bins: [],
    mean: 0,
    var: 0,
  },
  '10Percentile': 0,
  '90Percentile': 0,
  Energy: 0,
  Entropy: 0,
  InterquartileRange: 0,
  Kurtosis: 0,
  Maximum: 0,
  MeanAbsoluteDeviation: 0,
  Mean: 0,
  Median: 0,
  Minimum: 0,
  Range: 0,
  RobustMeanAbsoluteDeviation: 0,
  RootMeanSquared: 0,
  Skewness: 0,
  TotalEnergy: 0,
  Uniformity: 0,
  Variance: 0,
  Elongation: 0,
  Flatness: 0,
  LeastAxisLength: 0,
  MajorAxisLength: 0,
  Maximum2DDiameterColumn: 0,
  Maximum2DDiameterRow: 0,
  Maximum2DDiameterSlice: 0,
  Maximum3DDiameter: 0,
  MeshVolume: 0,
  MinorAxisLength: 0,
  Sphericity: 0,
  SurfaceArea: 0,
  SurfaceVolumeRatio: 0,
  VoxelVolume: 0,
  Compactness2: 0,
  density: 0,
  'IM Number': 0,
  probability: 0,
  malignancy: -1,
  calcification: 1,
  spiculation: 1,
  texture: -1,
  lobulation: 1,
  pin: 1,
  cav: 1,
  vss: 1,
  bea: 1,
  bro: 1,
  malProb: 0,
  calProb: 0,
  spiProb: 0,
  texProb: 0,
  lobProb: 0,
  pinProb: 0,
  cavProb: 0,
  vssProb: 0,
  beaProb: 0,
  broProb: 0,
  status: 1,
}
let buttonflag = 0

class CornerstoneElement extends Component {
  constructor(props) {
    super(props)
    this.state = {
      // displayPanel
      caseId: window.location.pathname.split('/case/')[1].split('/')[0].replace('%23', '#'),
      username: localStorage.getItem('username'),
      modelName: window.location.pathname.split('/')[3],
      realname: localStorage.realname ? localStorage.realname : '',

      //cornerstoneElement
      initialized: false,
      viewport: cornerstone.getDefaultViewport(null, undefined),
      // imageIds: props.stack.imageIds === "" ? [] : props.stack.imageIds,
      imageIds: [],
      sliderMarks: {},
      boxes: [],
      noduleMarks: {},
      listsActiveIndex: -1, //右方list活动item
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
      clearUserOpen: false,
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
      menuTools: 'slide',
      isPlaying: false,
      windowWidth: document.body.clientWidth,
      windowHeight: document.body.clientHeight,
      histogramHeight: 0,
      verticalMode: document.body.clientWidth < document.body.clientHeight ? true : false,
      slideSpan: 0,
      currentImage: null,
      lengthBox: [],
      imageCaching: false,
      canvasWidth: 0,
      canvasHeight: 0,
      //studybrowserList
      dateSeries: [],
      previewVisible: [],
      dataValidContnt: [],
      lymphs: [],
      lymphMarks: {},
      lymphsActiveIndex: -1,

      //MiniReport
      reportGuideActive: true,
      reportImageActive: true,
      reportGuideType: '中华共识',
      reportImageType: '结节类型',
      reportGuideText: '',
      reportImageText: '',
      reportImageTop: 0,
      reportImageHeight: 0,
      reportImageContentHeight: 0,
      patientName: '',
      patientBirth: '',
      patientSex: '',
      patientId: '',
      date: '',
      age: 0,
      temp: 0,

      /*新加变量 */
      nodules: [],
      nodulesAllChecked: false,
      nodulesOrder: {
        slice_idx: 1,
        diameter: 0,
        texture: 0,
        malignancy: 0,
      },
      nodulesSelect: [
        {
          key: 0,
          options: ['实性', '半实性', '磨玻璃', '毛刺征', '分叶征', '钙化征', '胸膜凹陷征', '空洞征', '血管集束征', '空泡征', '支气管充气征', '未知'],
          checked: new Array(12).fill(true),
        },
        { key: 1, desc: '直径大小', options: ['<=0.3cm', '0.3cm-0.5cm', '0.5cm-1cm', '1cm-1.3cm', '1.3cm-3cm', '>=3cm'], checked: new Array(6).fill(true) },
        { key: 2, desc: '良恶性', options: ['高危', '中危', '低危', '未知'], checked: new Array(4).fill(true) },
      ],
      nodulesAllSelected: true,
      ctInfoPadding: 0,
      menuButtonsWidth: 1540,
      menuScrollable: false,
      menuTransform: 0,
      show3DVisualization: false,
      studyListShowed: false,
      renderLoading: false,
      showFollowUp: false,
      registering: false,

      /*显示变量*/
      windowWidth: window.screen.width,
      windowHeight: window.screen.height,
      bottomRowHeight: 0,
      viewerWidth: 0,
      viewerHeight: 0,
      maskWidth: 0,
      maskHeight: 0,

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
      maskVolumes: [],

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
      maskYLength: 0,
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
      lobesAllChecked: false,
      lobesAllVisible: true,
      tubularController: null,
      tubularAllChecked: false,
      tubularAllVisible: true,
      airwayPicking: false,
      displayCrosshairs: false,
      editing: false,
      painting: false,
      erasing: false,
      show: false,

      /*加载变量*/
      volumesLoading: true,
      percent: [],
      noThreedData: false,
      listLoading: [],
      HUSliderRange: [-100, 100],
      chartType: 'line',
    }
    this.config = JSON.parse(localStorage.getItem('config'))
    this.nextPath = this.nextPath.bind(this)
    this.onImageRendered = this.onImageRendered.bind(this)
    this.onNewImage = this.onNewImage.bind(this)
    this.plotHistogram = this.plotHistogram.bind(this)

    this.onRightClick = this.onRightClick.bind(this)

    this.onMouseDown = this.onMouseDown.bind(this)
    this.onMouseMove = this.onMouseMove.bind(this)
    this.onMouseUp = this.onMouseUp.bind(this)
    this.onMouseOut = this.onMouseOut.bind(this)

    this.refreshImage = this.refreshImage.bind(this)

    this.findCurrentArea = this.findCurrentArea.bind(this)
    this.findMeasureArea = this.findMeasureArea.bind(this)

    this.onKeydown = this.onKeydown.bind(this)

    // this.toPage = this
    //     .toPage
    //     .bind(this)
    this.toCurrentModel = this.toCurrentModel.bind(this)
    this.toNewModel = this.toNewModel.bind(this)
    // this.handleClick = this
    //     .handleClick
    //     .bind(this)
    this.deSubmit = this.deSubmit.bind(this)
    this.clearthenNew = this.clearthenNew.bind(this)
    this.clearthenFork = this.clearthenFork.bind(this)
    this.Animation = this.Animation.bind(this)
    this.closeModalNew = this.closeModalNew.bind(this)
    this.closeModalCur = this.closeModalCur.bind(this)
    this.toMyAnno = this.toMyAnno.bind(this)
    this.disableAllTools = this.disableAllTools.bind(this)
    this.featureAnalysis = this.featureAnalysis.bind(this)
    this.eraseLabel = this.eraseLabel.bind(this)
    this.saveTest = this.saveTest.bind(this)
    this.onWheel = this.onWheel.bind(this)
    this.wheelHandle = this.wheelHandle.bind(this)
    this.onMouseOver = this.onMouseOver.bind(this)
    this.cacheImage = this.cacheImage.bind(this)
    this.cache = this.cache.bind(this)
    this.drawBidirection = this.drawBidirection.bind(this)
    this.segmentsIntr = this.segmentsIntr.bind(this)
    this.invertHandles = this.invertHandles.bind(this)
    this.pixeldataSort = this.pixeldataSort.bind(this)
    // this.drawTmpBox = this.drawTmpBox.bind(this)
    this.toHideMeasures = this.toHideMeasures.bind(this)
    this.toHideMask = this.toHideMask.bind(this)
    this.eraseMeasures = this.eraseMeasures.bind(this)
    // this.drawTmpBox = this.drawTmpBox.bind(this)
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
    this.updateDisplay = this.updateDisplay.bind(this)
    //StudyBrowser
    //MiniReport
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

  wcSlider = (e, { name, value }) => {
    //窗位
    this.setState({ [name]: value })
    let viewport = cornerstone.getViewport(this.element)
    viewport.voi.windowCenter = value
    cornerstone.setViewport(this.element, viewport)
    this.setState({ viewport })
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
    console.log('dropdown', this.state.listsActiveIndex, index, currentIdx)
    const { listsActiveIndex } = this.state
    const newIndex = listsActiveIndex === index ? -1 : index
    if (this.state.show3DVisualization) {
      if (this.state.MPR && this.state.painting && newIndex !== -1) {
        this.createNoduleMask(index)
        this.setState({
          displayCrosshairs: true,
        })
        this.toggleCrosshairs(true)
      }
    }
    this.setState({
      listsActiveIndex: newIndex,
      currentIdx: currentIdx,
      autoRefresh: true,
      doubleClick: false,
    })
  }
  handleLymphClick(currentIdx, index) {
    const { lymphsActiveIndex } = this.state

    const newIndex = lymphsActiveIndex === index ? -1 : index
    this.setState({
      lymphsActiveIndex: newIndex,
      currentIdx: currentIdx,
      autoRefresh: true,
    })
  }
  keyDownListSwitch(activeIdx) {
    // const boxes = this.state.selectBoxes
    const boxes = this.state.boxes
    let sliceIdx = boxes[activeIdx].slice_idx
    // console.log('cur', sliceIdx)
    this.setState({
      listsActiveIndex: activeIdx,
      currentIdx: sliceIdx,
      autoRefresh: true,
      doubleClick: false,
    })
  }

  playAnimation() {
    //coffee button
    if (this.state.showFollowUp) {
      if (this.followUpComponent) {
        // this.followUpComponent.playAnimation()
        this.props.setFollowUpPlaying(true)
      }
    } else {
      this.setState({
        isPlaying: true,
      })
      playTimer = setInterval(() => this.Animation(), 1)
    }
  }

  pauseAnimation() {
    if (this.state.showFollowUp) {
      if (this.followUpComponent) {
        // this.followUpComponent.playAnimation()
        this.props.setFollowUpPlaying(false)
      }
    } else {
      this.setState({
        isPlaying: false,
      })
      clearInterval(playTimer)
    }
  }

  Animation() {
    const imageIdsLength = this.state.imageIds.length
    const curIdx = this.state.currentIdx
    if (curIdx < imageIdsLength - 1) {
      this.refreshImage(false, this.state.imageIds[curIdx + 1], curIdx + 1)
    } else {
      this.refreshImage(false, this.state.imageIds[0], 0)
    }
  }

  toHidebox() {
    if (this.state.showFollowUp) {
      if (this.followUpComponent) {
        this.followUpComponent.toHidebox()
      }
    } else {
      this.setState(({ showNodules }) => ({
        showNodules: !showNodules,
      }))
      this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
    }
  }

  toHideInfo() {
    if (this.state.showFollowUp) {
      if (this.followUpComponent) {
        this.followUpComponent.toHideInfo()
      }
    } else {
      this.setState(({ showInfo }) => {
        return {
          showInfo: !showInfo,
        }
      })
    }
  }
  onSetStudyList(studyListShowed) {
    this.setState(
      {
        studyListShowed,
      },
      () => {
        clearTimeout(leftSlideTimer)
        leftSlideTimer = setTimeout(() => {
          this.setState(
            {
              ctInfoPadding: studyListShowed ? 150 : 0,
            },
            () => {
              this.resizeScreen()
            }
          )
        }, 500)
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
  setDelNodule(idx, open) {
    const boxes = this.state.boxes
    boxes[idx].delOpen = open
    this.setState({
      boxes,
    })
  }
  onConfirmDelNodule(idx) {
    const boxes = this.state.boxes
    boxes.forEach((boxItem) => {
      boxItem.delOpen = false
    })
    const measureStateList = this.state.measureStateList
    const listsActiveIndex = this.state.listsActiveIndex

    boxes.splice(idx, 1)
    measureStateList.splice(idx, 1)
    let currentActiveIdx

    if (listsActiveIndex === boxes.length) {
      currentActiveIdx = boxes.length - 1
    } else {
      currentActiveIdx = listsActiveIndex
    }

    this.setState({
      boxes,
      measureStateList,
      listsActiveIndex: currentActiveIdx,
    })
    this.refreshImage(false, this.state.imageIds[boxes[currentActiveIdx].slice_idx], boxes[currentActiveIdx].slice_idx)
    message.success('结节删除成功')
  }

  closeModalNew() {
    this.setState({ modalOpenNew: false })
  }

  arrayPropSort(prop, factor) {
    return function (a, b) {
      let value1 = a[prop]
      let value2 = b[prop]
      let result = value1 - value2
      if (result === 0) {
        return factor
      } else {
        return result * factor
      }
    }
  }

  closeModalCur() {
    this.setState({ modalOpenCur: false })
  }

  onSelectMal(index, value) {
    const boxes = this.state.boxes
    boxes[index].malignancy = parseInt(value)
    this.setState({
      // selectBoxes: boxes,
      boxes: boxes,
      // random: Math.random()
    })
  }
  onSelectMalClick(e) {
    e.stopPropagation()
  }
  onSelectTexClick(e) {
    e.stopPropagation()
  }
  onSelectTex(index, value) {
    const boxes = this.state.boxes
    boxes[index].texture = parseInt(value)
    this.setState({
      selectBoxes: boxes,
      boxes: boxes,
      // random: Math.random()
    })
  }
  onSelectPlaceClick(e) {
    e.stopPropagation()
  }
  onSelectPlace(index, value) {
    // console.log('onSelectPlace', index, value)
    const places = nodulePlaces
    const segments = noduleSegments
    const boxes = this.state.boxes
    const place = value[0]
    const segment = value[0] + '-' + value[1]
    for (let item in places) {
      if (places[item] === place) {
        boxes[index].place = item
      }
    }
    if (value[0] === '无法定位') {
      boxes[index].segment = 'None'
    } else {
      if (value[1] === '无法定位1') {
        boxes[index].segment = 'None'
      } else {
        for (let item in segments) {
          if (segments[item] === segment) {
            boxes[index].segment = item
          }
        }
      }
    }
    this.setState({
      boxes: boxes,
      // random: Math.random()
    })
  }

  representChange(idx, value) {
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
    const boxes = this.state.boxes
    boxes[idx].lobulation = 1
    boxes[idx].spiculation = 1
    boxes[idx].calcification = 1
    boxes[idx].pin = 1
    boxes[idx].cav = 1
    boxes[idx].vss = 1
    boxes[idx].bea = 1
    boxes[idx].bro = 1
    for (let itemValue in value) {
      for (let keyRepresents in represents) {
        if (value[itemValue] === represents[keyRepresents]) {
          if (keyRepresents === 'lobulation') {
            boxes[idx].lobulation = 2
          } else if (keyRepresents === 'spiculation') {
            boxes[idx].spiculation = 2
          } else if (keyRepresents === 'calcification') {
            boxes[idx].calcification = 2
          } else if (keyRepresents === 'pin') {
            boxes[idx].pin = 2
          } else if (keyRepresents === 'cav') {
            boxes[idx].cav = 2
          } else if (keyRepresents === 'vss') {
            boxes[idx].vss = 2
          } else if (keyRepresents === 'bea') {
            boxes[idx].bea = 2
          } else if (keyRepresents === 'bro') {
            boxes[idx].bro = 2
          }
        }
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

  startAnnos() {
    // this.setState({isbidirectionnal:true,toolState:'EllipticalRoi'})
    // const element = document.querySelector('#origin-canvas')
    // this.disableAllTools(element)
    // cornerstoneTools.addToolForElement(element,ellipticalRoi)
    // cornerstoneTools.setToolActiveForElement(element, 'EllipticalRoi',{mouseButtonMask:1},['Mouse'])
    if (this.state.showFollowUp) {
      if (this.followUpComponent) {
        this.followUpComponent.startAnnos()
      }
    } else {
      const element = document.querySelector('#origin-canvas')
      this.disableAllTools(element)
      this.setState({ leftButtonTools: 0, menuTools: 'anno' })
    }
  }
  eraseAnno() {
    if (this.followUpComponent) {
      this.followUpComponent.eraseAnno()
    }
  }
  slide() {
    //切换切片
    if (this.state.showFollowUp) {
      if (this.followUpComponent) {
        this.followUpComponent.ScrollStack()
      }
    } else {
      const element = document.querySelector('#origin-canvas')
      this.disableAllTools(element)
      this.setState({ leftButtonTools: 1, menuTools: 'slide' })
    }
  }

  wwwcCustom() {
    if (this.state.showFollowUp) {
      if (this.followUpComponent) {
        this.followUpComponent.wwwcCustom()
      }
    }
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
    if (this.state.showFollowUp) {
      if (this.followUpComponent) {
        this.followUpComponent.bidirectionalMeasure()
      }
    } else {
      const element = document.querySelector('#origin-canvas')
      this.setState({ leftButtonTools: 3, menuTools: 'bidirect' })
      this.disableAllTools(element)
    }
    // console.log('测量')
    // const element = document.querySelector('#origin-canvas')
    // this.disableAllTools(element)
    // cornerstoneTools.addToolForElement(element, bidirectional)
    // cornerstoneTools.setToolActiveForElement(element, 'Bidirectional',{mouseButtonMask:1},['Mouse'])
    // cornerstoneTools.length.activate(element,4);
  }

  lengthMeasure() {
    if (this.state.showFollowUp) {
      if (this.followUpComponent) {
        this.followUpComponent.lengthMeasure()
      }
    } else {
      this.setState({ leftButtonTools: 4, menuTools: 'length' })
      const element = document.querySelector('#origin-canvas')
      this.disableAllTools(element)
    }
  }
  mousedownFunc = (e) => {
    let path = e.path
    if (path && path.length > 2) {
      if (document.getElementById('histogram-header') && document.getElementsByClassName('histogram-float-active') && document.getElementsByClassName('histogram-float-active').length) {
        if (path[1] === document.getElementById('histogram-header')) {
          let initX,
            initY,
            element_float = document.getElementsByClassName('histogram-float-active')[0],
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
    console.log('特征分析')
    // const boxes = this.state.selectBoxes
    const boxes = this.state.boxes
    let HUSliderRange = [boxes[idx].nodule_hist.bins[0], boxes[idx].nodule_hist.bins[boxes[idx].nodule_hist.bins.length - 1]]
    // console.log('HUSliderRange', HUSliderRange)
    var histogram_float = document.getElementsByClassName('histogram-float')
    if (histogram_float[0] !== undefined) {
      histogram_float[0].className = 'histogram-float-active'

      this.setState({ HUSliderRange: HUSliderRange }, () => {
        this.plotHistogram(idx)
      })
    }

    // console.log('histogram_float', histogram_float)
    // console.log('boxes', boxes, e.target.value)
    // if (boxes[idx] !== undefined) {
    //   console.log('boxes', boxes[idx])
    //   var hist = boxes[idx].nodule_hist
    //   if (hist !== undefined) {
    //     this.visualize(hist, idx)
    //   }
    // }
  }

  plotHistogram(idx) {
    var { boxes, chartType, HUSliderRange } = this.state
    if (!(boxes && boxes.length)) {
      return
    }
    var bins = boxes[idx].nodule_hist.bins
    var ns = boxes[idx].nodule_hist.n
    var maxHU = bins[bins.length - 1]
    var minHU = bins[0]
    var absHU = Math.ceil((maxHU - minHU) / 150) * 150
    // console.log('plotHistogram', idx, boxes[idx], HUSliderRange)
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
    maxHU = Math.ceil(maxHU / 50) * 50
    minHU = maxHU - absHU
    let axis_data = []
    let series_data = []
    let range_min = 0,
      range_max = 0
    for (let i = 0; i <= absHU / 150; i++) {
      // console.log('HUSliderRange', HUSliderRange[0], HUSliderRange[1], min + 150 * i, min + 150 * (i + 1))
      if (HUSliderRange[1] - HUSliderRange[0] <= 150) {
        if (HUSliderRange[0] >= minHU + 150 * i && HUSliderRange[0] < minHU + 150 * (i + 1)) {
          range_min = i
          range_max = i + 1
        }
      } else {
        if (HUSliderRange[0] >= minHU + 150 * i && HUSliderRange[0] < minHU + 150 * (i + 1)) {
          range_min = i
        }
        if (HUSliderRange[1] >= minHU + 150 * i && HUSliderRange[1] < minHU + 150 * (i + 1)) {
          range_max = i
        }
      }
      let series = searchBetween(bins, ns, minHU + 150 * i, minHU + 150 * (i + 1))
      series_data.push(series)
      axis_data.push(minHU + 150 * i)
    }
    if (range_min === 0 && range_max === 0) {
      range_max = 1
    }
    let pieces = [
      {
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
        color: '#46E6FE',
      },
    ]
    if (chartType === 'line') {
      var chartDom = document.getElementById('chart-line-active')
      if (echarts.getInstanceByDom(chartDom)) {
        // console.log('dispose')
        echarts.dispose(chartDom)
      }
      var myChart = echarts.init(chartDom)
      var option
      // let a = 100 / (bins[bins.length - 1] - bins[0])
      // let b = 100 - a * bins[bins.length - 1]
      // let range_min = HUSliderRange[0] * a + b
      // let range_max = HUSliderRange[1] * a + b

      option = {
        visualMap: {
          show: false,
          dimension: 0,
          pieces,
          outOfRange: {
            color: '#59A2E6',
          },
        },
        xAxis: {
          type: 'category',
          data: axis_data,
          axisTick: {
            alignWithLabel: true,
          },
        },
        yAxis: {
          type: 'value',
        },
        series: [
          {
            data: series_data,
            type: 'line',
            smooth: true,
          },
        ],
        // tooltip: {
        //   trigger: 'axis',
        //   axisPointer: {
        //     type: 'cross',
        //   },
        // },
      }

      myChart.setOption(option)
    } else {
      var barDom = document.getElementById('chart-bar-active')

      if (echarts.getInstanceByDom(barDom)) {
        echarts.dispose(barDom)
      }
      var barChart = echarts.init(barDom)
      series_data = []
      axis_data = []
      for (let i = 0; i <= absHU / 10; i++) {
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

      // let a = 100 / (maxHU - minHU)
      // let b = 100 - a * maxHU
      // range_min = HUSliderRange[0] * a + b
      // range_max = HUSliderRange[1] * a + b
      barChart.setOption({
        visualMap: {
          show: false,
          dimension: 0,
          pieces: [
            {
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
              color: '#46E6FE',
            },
          ],
          outOfRange: {
            color: '#59A2E6',
          },
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            // 坐标轴指示器，坐标轴触发有效
            type: 'line', // 默认为直线，可选为：'line' | 'shadow'
          },
        },
        toolbox: {
          feature: {
            saveAsImage: {},
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
            data: axis_data,
            axisTick: {
              alignWithLabel: true,
            },
            // axisLabel: {
            //   color: 'rgb(191,192,195)',
            // },
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
      })
    }
  }

  onChartTypeChange(type) {
    this.setState({ chartType: type })
  }

  onHUValueChange(value) {
    this.setState({ HUSliderRange: value })
    console.log('onHUValueChange', value)
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

  clearLocalStorage() {
    localStorage.clear()
    message.success('清空成功')
    setTimeout(() => {
      window.location.reload()
    }, 2000)
  }
  show3D() {
    clearTimeout(flipTimer)
    // cornerstone.disable(this.element)
    if (!(this.state.urls && this.state.urls.length)) {
      if (this.state.noThreedData) {
        message.error('没有3D数据')
      } else {
        message.warn('正在请求3D数据，请稍等')
      }
      return
    }
    this.setState({
      renderLoading: true,
    })
    flipTimer = setTimeout(() => {
      this.setState(
        {
          renderLoading: false,
          show3DVisualization: true,
        },
        () => {
          if (this.viewer3D) {
            this.viewer3D.setNeedReset()
          }
          this.resizeScreen()
        }
      )
    }, 500)
  }
  hide3D() {
    clearTimeout(flipTimer)
    this.setState({
      renderLoading: true,
    })
    flipTimer = setTimeout(() => {
      this.setState({
        MPR: false,
      })
      this.changeMode(1)
      this.setState(
        {
          renderLoading: false,
          show3DVisualization: false,
        },
        () => {
          this.resizeScreen()
        }
      )
    }, 500)
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
          message.error('出现内部错误，请联系管理员')
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

  render() {
    const {
      realname,
      username,
      showNodules,
      showInfo,
      activeIndex,
      modalOpenNew,
      modalOpenCur,
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
      previewVisible,
      clearUserOpen,

      nodulesAllChecked,
      nodulesOrder,
      nodulesSelect,
      nodulesAllSelected,
      reportImageActive,
      reportGuideActive,
      reportImageText,
      reportGuideText,
      reportGuideType,
      reportImageType,
      reportImageTop,
      reportImageHeight,
      reportImageContentHeight,
      ctInfoPadding,
      HUSliderRange,
      chartType,
      boxes,
      sliderMarks,
      listsActiveIndex,
      lymphs,
      lymphsActiveIndex,

      lobesData,
      tubularData,
      lobesController,
      lobesAllChecked,
      lobesAllVisible,
      tubularController,
      tubularAllChecked,
      tubularAllVisible,
      MPR,
      CPR,
      viewerWidth,
      viewerHeight,
      bottomRowHeight,
      maskWidth,
      maskHeight,
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
      maskVolumes,
      maskYLength,
      maskImageData,
      maskLabelMap,
      lineActors,

      registering,
      menuButtonsWidth,
      menuScrollable,
      menuTotalPages,
      menuNowPage,
      menuTransform,
      show3DVisualization,
      studyListShowed,
      renderLoading,
      showFollowUp,
    } = this.state
    const { curCaseId, preCaseId, followUpActiveTool } = this.props
    let tableContent
    let lymphContent
    let noduleNumber = 0
    let lobeContent
    let lobeCheckNumber = 0
    let tubularContent
    let tubularCheckNumber = 0
    let histogramFloatWindow
    let previewContent
    let submitButton
    let StartReviewButton
    let canvas
    let slideLabel
    let dicomTagPanel
    const places = nodulePlaces
    // const noduleSegments = noduleSegments 引用了全局变量

    // let noduleNumTab = '结节(' + this.state.selectBoxes.length + ')'
    // let inflammationTab = '炎症(有)'
    // let lymphnodeTab = '淋巴结(0)'
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
    const welcome = '欢迎您，' + realname

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
        <div>
          <Label as="a">
            <Icon name="caret down" />
            {Math.abs(slideSpan)}
          </Label>
        </div>
      )
    } else if (slideSpan < 0) {
      slideLabel = (
        <div>
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
        <div id="dicomTag">
          <div className="top-left overlay-element">
            <div>{dicomTag.string('x00100010')}</div>
            <div>
              {dicomTag.string('x00101010')} {dicomTag.string('x00100040')}
            </div>
            <div>{dicomTag.string('x00100020')}</div>
            <div>{dicomTag.string('x00185100')}</div>
            <div>
              IM: {this.state.currentIdx + 1} / {this.state.imageIds.length}
            </div>
          </div>

          <div className="top-right overlay-element">
            <div>{dicomTag.string('x00080080')}</div>
            <div>ACC No: {dicomTag.string('x00080050')}</div>
            <div>{dicomTag.string('x00090010')}</div>
            <div>{dicomTag.string('x0008103e')}</div>
            <div>{dicomTag.string('x00080020')}</div>
            <div>T: {dicomTag.string('x00180050')}</div>
            {slideLabel}
          </div>

          <div className="bottom-left overlay-element">
            <div>
              Offset: {this.state.viewport.translation['x'].toFixed(1)}, {this.state.viewport.translation['y'].toFixed(1)}
            </div>
            <div>Zoom: {Math.round(this.state.viewport.scale * 100)}%</div>
          </div>

          <div className="bottom-right overlay-element">
            <div>
              WW/WC: {Math.round(this.state.viewport.voi.windowWidth)}/ {Math.round(this.state.viewport.voi.windowCenter)}
            </div>
          </div>
        </div>
      )
    // }

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
      <div id="loading-panel">
        <div className="sk-chase">
          <div className="sk-chase-dot"></div>
          <div className="sk-chase-dot"></div>
          <div className="sk-chase-dot"></div>
          <div className="sk-chase-dot"></div>
          <div className="sk-chase-dot"></div>
          <div className="sk-chase-dot"></div>
        </div>
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
          onSelectAirwayRange={this.selectAirwayRange.bind(this)}
          onRef={(ref) => {
            this.viewer3D = ref
          }}
        />
        <div className="loading-list" style={loadingStyle}>
          {loadingList}
        </div>
      </>
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
            onSelectAirwayRange={this.selectAirwayRange.bind(this)}
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
            // painting={painting}
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
            onSelectAirwayRange={this.selectAirwayRange.bind(this)}
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
      if (boxes && boxes.length > 0) {
        tableContent = boxes // .selectBoxes
          .map((inside, idx) => {
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
              locationValues = noduleSegments[inside.segment].split('-')
            } else {
              if (inside.place) {
                locationValues = [places[inside.place]]
              } else {
                locationValues = ['无法定位']
              }
            }

            // if(this.state.readonly){
            if (inside.visible) {
              return (
                <div key={idx} className={'highlightTbl' + (listsActiveIndex === idx ? ' highlightTbl-active' : '')}>
                  <Accordion.Title onClick={this.handleListClick.bind(this, inside.slice_idx, idx)} active={listsActiveIndex === idx}>
                    <div className="nodule-accordion-item-title">
                      <div className="nodule-accordion-item-title-index nodule-accordion-item-title-column">
                        <div style={inside.modified === undefined ? { fontSize: 'large', color: 'whitesmoke' } : { fontSize: 'large', color: '#dbce12' }}>{inside.visibleIdx + 1}</div>
                      </div>
                      <div className="nodule-accordion-item-title-column">
                        <Checkbox
                          className="nodule-accordion-item-title-checkbox"
                          checked={inside.checked}
                          onChange={this.onHandleNoduleCheckChange.bind(this, idx)}
                          onClick={this.onHandleNoduleCheckClick.bind(this)}>
                          {parseInt(inside.slice_idx) + 1}
                        </Checkbox>
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
                          onChange={this.onSelectTex.bind(this, idx)}
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

                      {ll === 0 && sl === 0 ? (
                        <div className="nodule-accordion-item-title-shape nodule-accordion-item-title-column">{(diameter / 10).toFixed(2) + '\xa0cm'}</div>
                      ) : (
                        <div className="nodule-accordion-item-title-shape nodule-accordion-item-title-column">{(ll / 10).toFixed(2) + '×' + (sl / 10).toFixed(2) + '\xa0cm'}</div>
                      )}

                      <div className="nodule-accordion-item-title-column">
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
                            onChange={this.onSelectPlace.bind(this, idx)}
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
                            onChange={this.onSelectMal.bind(this, idx)}
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
                  <Accordion.Content active={listsActiveIndex === idx}>
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
                        <div className="nodule-accordion-item-content-char-title">表征：</div>
                        <div className="nodule-accordion-item-content-char-content">
                          <Select
                            className={'nodule-accordion-item-content-select'}
                            mode="multiple"
                            dropdownMatchSelectWidth={false}
                            defaultValue={inside.malignancy}
                            dropdownMatchSelectWidth={false}
                            value={representArray}
                            placeholder="请选择表征"
                            bordered={false}
                            showArrow={false}
                            dropdownClassName={'corner-select-dropdown'}
                            onChange={this.representChange.bind(this, idx)}>
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

                      <div className="nodule-accordion-item-content-button">
                        <div>
                          <Button size="mini" circular inverted icon="chart bar" title="特征分析" value={idx} onClick={this.featureAnalysis.bind(this, idx)}></Button>
                        </div>
                        <div>
                          <Button.Group size="mini" className="measureBtnGroup" style={show3DVisualization ? { display: 'none' } : {}}>
                            <Button basic icon title="擦除测量" active color="green" onClick={this.eraseMeasures.bind(this, idx)}>
                              <Icon inverted color="green" name="eraser"></Icon>
                            </Button>
                            {showMeasure ? (
                              <Button basic icon title="隐藏测量" active color="blue" onClick={this.toHideMeasures.bind(this, idx)}>
                                <Icon inverted color="blue" name="eye slash"></Icon>
                              </Button>
                            ) : (
                              <Button basic icon title="显示测量" active color="blue" onClick={this.toHideMeasures.bind(this, idx)}>
                                <Icon inverted color="blue" name="eye"></Icon>
                              </Button>
                            )}
                            <Popup
                              on="click"
                              trigger={
                                <Button basic icon title="删除结节" active color="grey" style={show3DVisualization ? { display: 'none' } : {}}>
                                  <Icon inverted color="grey" name="trash alternate"></Icon>
                                </Button>
                              }
                              onOpen={this.setDelNodule.bind(this, idx, true)}
                              onClose={this.setDelNodule.bind(this, idx, false)}
                              open={inside.delOpen}>
                              <div className="general-confirm-block">
                                <div className="general-confirm-info">是否删除该结节？</div>
                                <div className="general-confirm-operation">
                                  <Button inverted size="mini" onClick={this.setDelNodule.bind(this, idx, false)}>
                                    取消
                                  </Button>
                                  <Button inverted size="mini" onClick={this.onConfirmDelNodule.bind(this, idx)}>
                                    确认
                                  </Button>
                                </div>
                              </div>
                            </Popup>
                          </Button.Group>
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

      const noduleOrderOption = [
        {
          desc: '层面数',
          key: 'slice_idx',
          sortable: true,
        },
        {
          desc: '半径大小',
          key: 'diameter',
          sortable: true,
        },
        {
          desc: '结节类型',
          key: 'texture',
          sortable: false,
        },
        {
          desc: '良恶性',
          key: 'malignancy',
          sortable: false,
        },
      ]
      const noduleOrderContent = noduleOrderOption.map((item, idx) => {
        return (
          <div
            key={idx}
            className={'nodule-filter-operation-sort-type' + (nodulesOrder[item.key] !== 0 ? ' nodule-filter-operation-sort-type-active' : '')}
            onClick={this.onHandleOrderNodule.bind(this, item.key)}>
            <span>{item.desc}</span>

            {item.sortable ? (
              <span className={'nodule-filter-operation-sort-type-order'} onClick={this.onHandleOrderDirectionNodule.bind(this, item.key)}>
                <FontAwesomeIcon
                  className={(nodulesOrder[item.key] === -1 ? 'nodule-filter-operation-sort-type-order-icon-hide' : '') + ' nodule-filter-operation-sort-type-order-icon-up'}
                  icon={faSortUp}
                />
                <FontAwesomeIcon
                  className={(nodulesOrder[item.key] === 1 ? 'nodule-filter-operation-sort-type-order-icon-hide' : '') + ' nodule-filter-operation-sort-type-order-icon-down'}
                  icon={faSortDown}
                />
              </span>
            ) : null}
          </div>
        )
      })
      const noduleSelectContent = nodulesSelect.map((item, idx) => {
        const checked = item.checked
        const visibleOptions = item.options.map((opItem, opIdx) => {
          return (
            <div key={opIdx} className="nodule-filter-option-select-content-item">
              <Checkbox className="nodule-filter-option-select-content-item-check" checked={checked[opIdx]} onChange={this.onHandleSelectNoduleCheck.bind(this, idx, opIdx)}></Checkbox>
              {opItem}
            </div>
          )
        })
        return (
          <div key={idx} className="nodule-filter-option-select-content-list">
            {visibleOptions}
          </div>
        )
      })
      if (lobesData && lobesData.length > 0) {
        lobeContent = lobesData.map((item, index) => {
          if (lobesController.lobesChecked[index]) {
            lobeCheckNumber += 1
          }
          return (
            <div key={index} className={'highlightTbl' + (lobesController.lobesActive[index] ? ' highlightTbl-active' : '')}>
              <Accordion.Title onClick={this.setActive.bind(this, 0, index, item.index)} active={lobesController.lobesActive[index]}>
                <div className="threed-accordion-item-title">
                  <div className="threed-accordion-item-title-index">{index + 1}</div>
                  <div className="threed-accordion-item-title-start">
                    <Checkbox
                      className="threed-accordion-item-title-checkbox"
                      checked={lobesController.lobesChecked[index]}
                      onChange={this.onHandleThreedCheckChange.bind(this, 0, index)}
                      onClick={this.onHandleThreedCheckClick.bind(this)}></Checkbox>
                    <div className="threed-accordion-item-title-name">{item.lobeName}</div>
                  </div>
                  <div className="threed-accordion-item-title-center">
                    <div className="threed-accordion-item-title-volume">
                      {`${item.volume} cm`}
                      <sup>3</sup>
                    </div>
                  </div>
                </div>
              </Accordion.Title>
              <Accordion.Content active={lobesController.lobesActive[index]}>
                <div className="threed-accordion-item-content">
                  <div className="threed-accordion-item-content-info">
                    <div>{`${item.lobeName}/全肺：${item.percent}%`}</div>
                  </div>

                  <div className="threed-accordion-item-content-opacity">
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
                  </div>

                  <div className="threed-accordion-item-content-operation">
                    <div className="threed-accordion-item-content-operation-hist">
                      <Button size="mini" circular inverted icon="chart bar" title="特征分析" hidden={true}></Button>
                    </div>
                    <div>
                      {lobesController.lobesVisible[index] ? (
                        <Button size="mini" basic icon title="隐藏" active color="blue" onClick={this.setVisible.bind(this, 0, index, item.index)}>
                          <Icon inverted color="blue" name="eye slash"></Icon>
                        </Button>
                      ) : (
                        <Button size="mini" basic icon title="显示" active color="blue" onClick={this.setVisible.bind(this, 0, index, item.index)}>
                          <Icon inverted color="blue" name="eye"></Icon>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Accordion.Content>
            </div>
          )
        })
      }
      if (tubularData && tubularData.length > 0) {
        tubularContent = tubularData.map((item, index) => {
          if (tubularController.tubularChecked[index]) {
            tubularCheckNumber += 1
          }
          return (
            <div key={index} className={'highlightTbl' + (tubularController.tubularActive[index] ? ' highlightTbl-active' : '')}>
              <Accordion.Title onClick={this.setActive.bind(this, 1, index, item.index)} active={tubularController.tubularActive[index]}>
                <div className="threed-accordion-item-title">
                  <div className="threed-accordion-item-title-index">{index + 1}</div>
                  <div className="threed-accordion-item-title-start">
                    <Checkbox
                      className="threed-accordion-item-title-checkbox"
                      checked={tubularController.tubularChecked[index]}
                      onChange={this.onHandleThreedCheckChange.bind(this, 1, index)}
                      onClick={this.onHandleThreedCheckClick.bind(this)}></Checkbox>
                    <div className="threed-accordion-item-title-name">{item.name}</div>
                  </div>
                  <div className="threed-accordion-item-title-center">
                    <div className="threed-accordion-item-title-volume">
                      {`100cm`}
                      <sup>3</sup>
                    </div>
                  </div>
                </div>
              </Accordion.Title>
              <Accordion.Content active={tubularController.tubularActive[index]}>
                <div className="threed-accordion-item-content">
                  <div className="threed-accordion-item-content-info">
                    <div>
                      {`体积：100cm`}
                      <sup>3</sup>
                    </div>
                  </div>

                  <div className="threed-accordion-item-content-opacity">
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
                  </div>
                  <div className="threed-accordion-item-content-operation">
                    <div className="threed-accordion-item-content-operation-hist">
                      <Button size="mini" circular inverted icon="chart bar" title="特征分析" hidden={true}></Button>
                    </div>
                    <div>
                      {tubularController.tubularVisible[index] ? (
                        <Button size="mini" basic icon title="隐藏" active color="blue" onClick={this.setVisible.bind(this, 1, index, item.index)}>
                          <Icon inverted color="blue" name="eye slash"></Icon>
                        </Button>
                      ) : (
                        <Button size="mini" basic icon title="显示" active color="blue" onClick={this.setVisible.bind(this, 1, index, item.index)}>
                          <Icon inverted color="blue" name="eye"></Icon>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Accordion.Content>
            </div>
          )
        })
      }
      if (lymphs && lymphs.length > 0) {
        lymphContent = lymphs.map((item, index) => {
          return (
            <div key={index} className={'highlightTbl' + (lymphsActiveIndex === index ? ' highlightTbl-active' : '')}>
              <Accordion.Title onClick={this.handleLymphClick.bind(this, item.slice_idx, index)} active={lymphsActiveIndex === index}>
                <div className="lymph-accordion-item-title">
                  <div className="lymph-accordion-item-title-start">
                    <div className="lymph-accordion-item-title-index">{item.visibleIdx + 1}</div>
                    <div className="lymph-accordion-item-title-slice">{item.slice_idx + 1}</div>
                    <div className="lymph-accordion-item-title-name">{item.name}</div>
                  </div>
                  <div className="lymph-accordion-item-title-center">
                    <div className="lymph-accordion-item-title-volume">{`${(Math.floor(item.volume * 100) / 100).toFixed(2)} cm³`}</div>
                  </div>
                </div>
              </Accordion.Title>
              <Accordion.Content active={lymphsActiveIndex === index}></Accordion.Content>
            </div>
          )
        })
      }
      let range1 = 0,
        range1_volume = 0,
        range2 = 0,
        range2_volume = 0,
        range3 = 0,
        range3_volume = 0,
        overall_volume = 0,
        quality1 = 0,
        quality1_percent = 0,
        quality2 = 0,
        quality2_percent = 0,
        quality3 = 0,
        quality3_percent = 0,
        overall_quality = 0

      let CT_max = 0,
        CT_min = 0,
        CT_mean = 0,
        CT_std = 0,
        Sphericity = 0
      let slice_idx = 0,
        Maximum = 0,
        SurfaceArea = 0,
        Maximum3DDiameter = 0,
        apsidal_mean = 0
      let Kurtosis = 0,
        Skewness = 0,
        Energy = 0,
        Compactness2 = 0,
        Entropy = 0
      let marks
      let searchLE = function (arr, x) {
        var flag = 0
        for (let i = 0; i < arr.length; i++) {
          if (arr[i] < x) {
            flag = flag + 1
          } else {
            break
          }
        }
        return flag
      }
      let calculateAvgCT = function (arr, min, max) {
        var flag = 0
        var overall_CT = 0
        for (let i = 0; i < arr.length; i++) {
          if (arr[i] >= min && arr[i] < max) {
            flag = flag + 1
            overall_CT = overall_CT + arr[i]
          } else if (arr[i] >= max) {
            break
          }
        }
        if (flag !== 0) {
          return Number(overall_CT / flag)
        } else {
          return Number(-1000)
        }
      }
      let overall_CT = (arr) => {
        let CT = 0
        for (let i = 0; i < arr.length; i++) {
          CT = CT + arr[i]
        }
        return Number((CT / arr.length).toFixed(0))
      }
      if (listsActiveIndex === -1) {
        var minHU = 0
        var maxHU = 100
      } else if (boxes && boxes.length) {
        // console.log('.bins', boxes[listsActiveIndex].nodule_hist.bins[0])
        var nodule_hist = boxes[listsActiveIndex].nodule_hist.bins
        // if (nodule_hist[nodule_hist.length - 1] > 0) {
        var maxHU = Math.ceil(nodule_hist[nodule_hist.length - 1] / 50) * 50
        // } else {
        //   var maxHU = Math.ceil(nodule_hist[nodule_hist.length - 1] / 50) * 50
        // }
        // if (nodule_hist[0] > 0) {
        var minHU = Math.floor(nodule_hist[0] / 50) * 50
        // } else {
        //   var minHU = Math.floor(nodule_hist[0] / 50) * 50
        // }
        overall_volume = (boxes[listsActiveIndex].volume * Math.pow(10, 3)).toFixed(2)
        range1 = (searchLE(nodule_hist, HUSliderRange[0]) / nodule_hist.length).toFixed(3)
        range1_volume = (range1 * overall_volume).toFixed(2)
        range2 = ((searchLE(nodule_hist, HUSliderRange[1]) - searchLE(nodule_hist, HUSliderRange[0])) / nodule_hist.length).toFixed(3)
        range2_volume = (range2 * overall_volume).toFixed(2)
        range3 = (1 - searchLE(nodule_hist, HUSliderRange[1]) / nodule_hist.length).toFixed(3)
        range3_volume = (range3 * overall_volume).toFixed(2)
        // 质量
        overall_quality = (((overall_CT(nodule_hist) + 1000) * overall_volume) / 103).toFixed(1)
        quality1 = (((calculateAvgCT(nodule_hist, nodule_hist[0], HUSliderRange[0]) + 1000) * range1_volume) / 103).toFixed(1)
        quality1_percent = ((((calculateAvgCT(nodule_hist, nodule_hist[0], HUSliderRange[0]) + 1000) * range1) / (overall_CT(nodule_hist) + 1000)) * 100).toFixed(1)
        if (quality1_percent < 0) {
          quality1_percent = 0
        }
        if (quality1 < 0) {
          quality1 = 0
        }
        quality2 = (((calculateAvgCT(nodule_hist, HUSliderRange[0], HUSliderRange[1]) + 1000) * range2_volume) / 103).toFixed(1)
        quality2_percent = ((((calculateAvgCT(nodule_hist, HUSliderRange[0], HUSliderRange[1]) + 1000) * range2) / (overall_CT(nodule_hist) + 1000)) * 100).toFixed(1)
        quality3 = (((calculateAvgCT(nodule_hist, HUSliderRange[1], nodule_hist[nodule_hist.length - 1]) + 1000) * range3_volume) / 103).toFixed(1)
        quality3_percent = ((((calculateAvgCT(nodule_hist, HUSliderRange[1], nodule_hist[nodule_hist.length - 1]) + 1000) * range3) / (overall_CT(nodule_hist) + 1000)) * 100).toFixed(1)
        /* marks */
        let slider_range1 = HUSliderRange[0]
        let slider_range2 = HUSliderRange[1]
        marks = {}
        /**结节特征 */
        CT_max = boxes[listsActiveIndex].huMax ? boxes[listsActiveIndex].huMax : 0
        CT_min = boxes[listsActiveIndex].huMin ? boxes[listsActiveIndex].huMin : 0
        CT_mean = boxes[listsActiveIndex].huMean ? boxes[listsActiveIndex].huMean : 0
        CT_std = boxes[listsActiveIndex].Variance.toFixed(1)
        Sphericity = boxes[listsActiveIndex].Sphericity.toFixed(1)

        slice_idx = boxes[listsActiveIndex].slice_idx + 1
        Maximum = boxes[listsActiveIndex].Maximum.toFixed(2)
        SurfaceArea = boxes[listsActiveIndex].SurfaceArea.toFixed(2)
        Maximum3DDiameter = boxes[listsActiveIndex].Maximum3DDiameter.toFixed(2)
        if (boxes[listsActiveIndex].measure !== null && boxes[listsActiveIndex].measure !== undefined) {
          let measureCoord = boxes[listsActiveIndex].measure
          let ll = Math.sqrt(Math.pow(measureCoord.x1 - measureCoord.x2, 2) + Math.pow(measureCoord.y1 - measureCoord.y2, 2))
          let sl = Math.sqrt(Math.pow(measureCoord.x3 - measureCoord.x4, 2) + Math.pow(measureCoord.y3 - measureCoord.y4, 2))
          apsidal_mean = ((ll + sl) / 2).toFixed(2)
        }

        Kurtosis = boxes[listsActiveIndex].Kurtosis.toFixed(2)
        Skewness = boxes[listsActiveIndex].Skewness.toFixed(2)
        if (boxes[listsActiveIndex].Energy) {
          let EnergyValue = boxes[listsActiveIndex].Energy
          let EnergyP = Math.floor(Math.log(EnergyValue) / Math.LN10)
          let EnergyN = (EnergyValue * Math.pow(10, -EnergyP)).toFixed(0)
          Energy = EnergyN + 'E' + EnergyP
        }
        Compactness2 = boxes[listsActiveIndex].Compactness2.toFixed(2)
        Entropy = boxes[listsActiveIndex].Entropy.toFixed(2)
      }

      histogramFloatWindow = (
        <div className="histogram-float">
          <div id="histogram-header">
            <div id="title-1">
              <p>病灶特征分析</p>
            </div>
            <div id="title-2">
              <p>结节{listsActiveIndex + 1}</p>
            </div>
            <div id="icon">
              <Icon
                size="large"
                name="close"
                onClick={() => {
                  var histogram_float_active_header = document.getElementById('histogram-header')
                  if (histogram_float_active_header !== undefined) {
                    histogram_float_active_header.removeEventListener('mousedown', () => {})
                    histogram_float_active_header.removeEventListener('mousemove', () => {})
                    histogram_float_active_header.removeEventListener('mouseup', () => {})
                    document.getElementsByClassName('histogram-float-active')[0].className = 'histogram-float'
                  }
                }}></Icon>
            </div>
          </div>
          <div className="content">
            <Button.Group id="chart-type">
              <Button onClick={this.onChartTypeChange.bind(this, 'line')} id="chart-line-id">
                折线图
              </Button>
              <Button onClick={this.onChartTypeChange.bind(this, 'bar')} id="chart-bar-id">
                柱状图
              </Button>
            </Button.Group>
            {chartType === 'line' ? <div id="chart-line-active"></div> : <div id="chart-line"></div>}
            {chartType === 'bar' ? <div id="chart-bar-active"></div> : <div id="chart-bar"></div>}
            <div id="range-slider">
              <Slider range marks={marks} onChange={this.onHUValueChange.bind(this)} value={HUSliderRange} step={50} max={maxHU} min={minHU} />
            </div>

            <table id="analysis-table">
              <tbody>
                <tr>
                  <td className="title">分析项</td>
                  <td className="range1">{'<' + HUSliderRange[0] + 'HU'}</td>
                  <td className="range2">{HUSliderRange[0] + '~' + HUSliderRange[1] + 'HU'}</td>
                  <td className="range3">{'≥' + HUSliderRange[1] + 'HU'}</td>
                  <td className="title">总体</td>
                </tr>
                <tr>
                  <td className="title">体积mm³(占比)</td>
                  <td className="range1">{range1_volume + '(' + (range1 * 100).toFixed(2) + '%)'}</td>
                  <td className="range2">{range2_volume + '(' + (range2 * 100).toFixed(2) + '%)'}</td>
                  <td className="range3">{range3_volume + '(' + (range3 * 100).toFixed(2) + '%)'}</td>
                  <td className="title">{overall_volume}</td>
                </tr>
                <tr>
                  <td className="title">质量mg(占比)</td>
                  <td className="range1">{quality1 + '(' + quality1_percent + '%)'}</td>
                  <td className="range2">{quality2 + '(' + quality2_percent + '%)'}</td>
                  <td className="range3">{quality3 + '(' + quality3_percent + '%)'}</td>
                  <td className="title">{overall_quality}</td>
                </tr>
              </tbody>
            </table>
            <table id="feature-table">
              <tbody>
                <tr>
                  <td>{'CT最大值：' + CT_max.toFixed(1) + 'HU'}</td>
                  <td>{'最大层位置：' + 'IM ' + slice_idx}</td>
                  <td>{`峰度：${Kurtosis}`}</td>
                </tr>
                <tr>
                  <td>{'CT最小值：' + CT_min.toFixed(1) + 'HU'}</td>
                  <td>{`最大面面积：${Maximum}mm²`}</td>
                  <td>{`偏度：${Skewness}`}</td>
                </tr>
                <tr>
                  <td>{'CT平均值：' + CT_mean.toFixed(1) + 'HU'}</td>
                  <td>{`表面积：${SurfaceArea}mm²`}</td>
                  <td>{`能量：${Energy}`}</td>
                </tr>
                <tr>
                  <td>{`CT值方差：${CT_std}HU`}</td>
                  <td>{`3D长径：${Maximum3DDiameter}mm`}</td>
                  <td>{`紧凑度：${Compactness2}`}</td>
                </tr>
                <tr>
                  <td>{`球型度：${Sphericity}`}</td>
                  <td>{`长短径平均值：${apsidal_mean}mm`}</td>
                  <td>{`熵：${Entropy}`}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )

      if (dateSeries && dateSeries.length) {
        previewContent = dateSeries.map((item, index) => {
          const vSeries = item.map((serie, serieIndex) => {
            var validStatus = serie.validInfo.status
            var validInfo = serie.validInfo.message
            var statusIcon
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
            let previewId = 'preview-' + serie.caseId
            let keyId = 'key-' + index + '-' + serieIndex
            return (
              <PreviewElement
                key={keyId}
                caseId={serie.caseId}
                date={serie.date}
                image={serie.image}
                statusIcon={statusIcon}
                description={serie.Description}
                isReady={true}
                isSelected={this.state.caseId === serie.caseId}
                href={serie.href}
              />
              // <div className={'preview-item' + (this.state.caseId === serie.caseId ? ' preview-item-selected' : '')} onClick={(e) => this.handleClickScreen(e, serie.href, validStatus)} key={keyId}>
              //   <div className="preview-item-canvas" id={previewId}></div>
              //   <div className="preview-item-info">
              //     <div className="preview-item-info-icon">{statusIcon}</div>
              //     <div className="preview-item-info-desc">{serie.Description}</div>
              //   </div>
              // </div>
            )
          })
          return (
            <Accordion key={index}>
              <Accordion.Title active={previewVisible[index]} onClick={this.onSetPreviewActive.bind(this, index)}>
                <div className="preview-title">
                  <div className="preview-title-date">{item[0].date}</div>
                  <div className="preview-title-number">{item.length}&nbsp;Series</div>
                </div>
              </Accordion.Title>
              <Accordion.Content active={previewVisible[index]}>{vSeries}</Accordion.Content>
            </Accordion>
          )
        })
      }
      const twodMenus = (
        <>
          {showNodules ? (
            <div onClick={this.toHidebox.bind(this)} className="func-btn" id="hideNodule" title="隐藏结节">
              <Icon className="func-btn-icon" id="cache-button" name="eye slash" size="large"></Icon>
              <div className="func-btn-desc">隐藏结节</div>
            </div>
          ) : (
            <div onClick={this.toHidebox.bind(this)} className="func-btn" id="showNodule" title="显示结节">
              <Icon className="func-btn-icon" id="cache-button" name="eye" size="large"></Icon>
              <div className="func-btn-desc">显示结节</div>
            </div>
          )}
          {showInfo ? (
            <div onClick={this.toHideInfo.bind(this)} className="func-btn" id="hideInfo" title="隐藏信息">
              <Icon className="func-btn-icon" id="cache-button" name="delete calendar" size="large"></Icon>
              <div className="func-btn-desc">隐藏信息</div>
            </div>
          ) : (
            <div onClick={this.toHideInfo.bind(this)} className="func-btn" id="showInfo" title="显示信息">
              <Icon className="func-btn-icon" id="cache-button" name="content" size="large"></Icon>
              <div className="func-btn-desc">显示信息</div>
            </div>
          )}
          <div title="切换切片" onClick={this.slide.bind(this)} className={'func-btn' + (menuTools === 'slide' ? ' func-btn-active' : '')}>
            <Icon className="func-btn-icon" name="sort" size="large"></Icon>
            <div className="func-btn-desc">滚动</div>
          </div>
          <div onClick={this.startAnnos.bind(this)} title="标注" className={'func-btn' + (menuTools === 'anno' ? ' func-btn-active' : '')}>
            <Icon className="func-btn-icon" name="edit" size="large"></Icon>
            <div className="func-btn-desc">标注</div>
          </div>

          <div onClick={this.bidirectionalMeasure.bind(this)} title="测量" className={'func-btn' + (menuTools === 'bidirect' ? ' func-btn-active' : '')}>
            <Icon className="func-btn-icon" name="crosshairs" size="large"></Icon>
            <div className="func-btn-desc">测量</div>
          </div>
          <div onClick={this.lengthMeasure.bind(this)} title="长度" className={'func-btn' + (menuTools === 'length' ? ' func-btn-active' : '')}>
            <Icon className="func-btn-icon" name="arrows alternate vertical" size="large"></Icon>
            <div className="func-btn-desc">长度</div>
          </div>

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
          {this.state.readonly ? (
            <div title="提交" onClick={this.submit.bind(this)} className="func-btn">
              <Icon className="func-btn-icon" name="upload" size="large"></Icon>
              <div className="func-btn-desc">提交</div>
            </div>
          ) : (
            // <Button icon title='暂存' onClick={this.temporaryStorage} className='funcbtn'><Icon name='inbox' size='large'></Icon></Button>
            <div title="暂存" onClick={this.temporaryStorage.bind(this)} className="func-btn">
              <Icon className="func-btn-icon" name="upload" size="large"></Icon>
              <div className="func-btn-desc">暂存</div>
            </div>
          )}
          {this.state.readonly ? null : (
            <Popup
              on="click"
              trigger={
                <div title="清空标注" onClick={this.setClearUserNodule.bind(this, true)} className="func-btn">
                  <Icon className="func-btn-icon" name="user delete" size="large"></Icon>
                  <div className="func-btn-desc">清空标注</div>
                </div>
              }
              onOpen={this.setClearUserNodule.bind(this, true)}
              onClose={this.setClearUserNodule.bind(this, false)}
              open={clearUserOpen}>
              <div className="general-confirm-block">
                <div className="general-confirm-info">是否清空用户标注？</div>
                <div className="general-confirm-operation">
                  <Button inverted size="mini" onClick={this.setClearUserNodule.bind(this, false)}>
                    取消
                  </Button>
                  <Button inverted size="mini" onClick={this.onConfirmClearUserNodule.bind(this)}>
                    确认
                  </Button>
                </div>
              </div>
            </Popup>
          )}
        </>
      )
      const threedMenus = (
        <>
          {MPR ? (
            <>
              <div className="func-btn" onClick={this.setMPR.bind(this)}>
                <Icon className="func-btn-icon icon-custom icon-custom-mpr-hide" size="large" />
                <div className="func-btn-desc"> 取消MPR</div>
              </div>
              <div className="func-btn" hidden={!displayCrosshairs} onClick={this.toggleCrosshairs.bind(this, false)} description="hidden crosshairs">
                <Icon className="func-btn-icon icon-custom icon-custom-HC" size="large" />
                <div className="func-btn-desc"> 隐藏十字线</div>
              </div>
              <div className="func-btn" hidden={displayCrosshairs} onClick={this.toggleCrosshairs.bind(this, true)} description="show crosshairs">
                <Icon className="func-btn-icon icon-custom icon-custom-SC" size="large" />
                <div className="func-btn-desc"> 显示十字线</div>
              </div>
              <div className="func-btn" hidden={!painting} onClick={this.endPaint.bind(this)} description="end painting">
                <Icon className="func-btn-icon" name="window close outline" size="large" />
                <div className="func-btn-desc"> 停止勾画</div>
              </div>
              <div className="func-btn" hidden={painting} onClick={this.beginPaint.bind(this)} description="begin painting">
                <Icon className="func-btn-icon" name="paint brush" size="large" />
                <div className="func-btn-desc"> 开始勾画</div>
              </div>
              <div className={'func-btn' + (!erasing ? ' func-btn-active' : '')} hidden={!painting} onClick={this.doPaint.bind(this)} description="do painting">
                <Icon className="func-btn-icon" name="paint brush" size="large" />
                <div className="func-btn-desc"> 勾画</div>
              </div>
              <div className={'func-btn' + (erasing ? ' func-btn-active' : '')} hidden={!painting} onClick={this.doErase.bind(this)} description="do erasing">
                <Icon className="func-btn-icon" name="eraser" size="large" />
                <div className="func-btn-desc"> 擦除</div>
              </div>
              <Popup
                on="click"
                trigger={
                  <div className="func-btn" hidden={!painting}>
                    <Icon className="func-btn-icon" name="dot circle" size="large" />
                    <div className="func-btn-desc"> mask大小</div>
                  </div>
                }
                position="bottom center"
                style={{
                  backgroundColor: 'rgb(39, 46, 72)',
                  width: '230px',
                  color: 'whitesmoke',
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
                  <div className="func-btn" hidden={!painting}>
                    <Icon className="func-btn-icon" name="eye dropper" size="large" />
                    <div className="func-btn-desc"> mask颜色</div>
                  </div>
                }
                position="bottom center"
                style={{
                  backgroundColor: 'rgb(39, 46, 72)',
                  width: '180px',
                  color: 'whitesmoke',
                }}>
                <div className="segment-label-color-selector">
                  颜色选择器：
                  <InputColor initialValue="#FF0000" onChange={this.setPaintColor.bind(this)} placement="right" />
                </div>
              </Popup>
              {CPR ? (
                <>
                  <div className="func-btn" onClick={this.setCPR.bind(this)}>
                    <Icon className="func-btn-icon" name="window close outline" size="large" />
                    <div className="func-btn-desc"> 取消CPR</div>
                  </div>
                  <div className="func-btn" onClick={this.pickAirway.bind(this)} description="reconstuct airway">
                    <Icon className="func-btn-icon icon-custom icon-custom-RA" size="large" />
                    <div className="func-btn-desc"> 重建气道</div>
                  </div>
                </>
              ) : (
                <div className="func-btn" onClick={this.setCPR.bind(this)}>
                  <Icon className="func-btn-icon icon-custom icon-custom-CPR" size="large" />
                  <div className="func-btn-desc"> CPR</div>
                </div>
              )}
            </>
          ) : (
            <div className="func-btn" hidden={MPR} onClick={this.setMPR.bind(this)}>
              <Icon className="func-btn-icon icon-custom icon-custom-mpr-show" size="large" />
              <div className="func-btn-desc"> MPR</div>
            </div>
          )}
          <span className="menu-line"></span>
        </>
      )
      const followUpMenus = (
        <>
          {registering ? (
            <div title="配准" className={'func-btn'} onClick={this.setRegistering.bind(this)}>
              <Icon className="func-btn-icon" name="window restore outline" size="large"></Icon>
              <div className="func-btn-desc">结束配准</div>
            </div>
          ) : (
            <div title="配准" className={'func-btn'} onClick={this.setRegistering.bind(this)}>
              <Icon className="func-btn-icon" name="window restore outline" size="large"></Icon>
              <div className="func-btn-desc">开始配准</div>
            </div>
          )}
          {/* {showNodules ? (
            <div onClick={this.toHidebox.bind(this)} className="func-btn" id="hideNodule" title="隐藏结节">
              <Icon className="func-btn-icon" id="cache-button" name="eye slash" size="large"></Icon>
              <div className="func-btn-desc">隐藏结节</div>
            </div>
          ) : (
            <div onClick={this.toHidebox.bind(this)} className="func-btn" id="showNodule" title="显示结节">
              <Icon className="func-btn-icon" id="cache-button" name="eye" size="large"></Icon>
              <div className="func-btn-desc">显示结节</div>
            </div>
          )} */}
          {showInfo ? (
            <div onClick={this.toHideInfo.bind(this)} className="func-btn" id="hideInfo" title="隐藏信息">
              <Icon className="func-btn-icon" id="cache-button" name="delete calendar" size="large"></Icon>
              <div className="func-btn-desc">隐藏信息</div>
            </div>
          ) : (
            <div onClick={this.toHideInfo.bind(this)} className="func-btn" id="showInfo" title="显示信息">
              <Icon className="func-btn-icon" id="cache-button" name="content" size="large"></Icon>
              <div className="func-btn-desc">显示信息</div>
            </div>
          )}
          <div title="切换切片" onClick={this.slide.bind(this)} className={'func-btn' + (followUpActiveTool === 'StackScroll' ? ' func-btn-active' : '')}>
            <Icon className="func-btn-icon" name="sort" size="large"></Icon>
            <div className="func-btn-desc">滚动</div>
          </div>
          <div onClick={this.startAnnos.bind(this)} title="标注" className={'func-btn' + (followUpActiveTool === 'RectangleRoi' ? ' func-btn-active' : '')}>
            <Icon className="func-btn-icon" name="edit" size="large"></Icon>
            <div className="func-btn-desc">标注</div>
          </div>

          <div onClick={this.bidirectionalMeasure.bind(this)} title="测量" className={'func-btn' + (followUpActiveTool === 'Bidirectional' ? ' func-btn-active' : '')}>
            <Icon className="func-btn-icon" name="crosshairs" size="large"></Icon>
            <div className="func-btn-desc">测量</div>
          </div>
          <div onClick={this.lengthMeasure.bind(this)} title="长度" className={'func-btn' + (followUpActiveTool === 'Length' ? ' func-btn-active' : '')}>
            <Icon className="func-btn-icon" name="arrows alternate vertical" size="large"></Icon>
            <div className="func-btn-desc">长度</div>
          </div>
          {/* <div onClick={this.eraseAnno.bind(this)} title="擦除" className={'func-btn' + (followUpActiveTool === 'Eraser' ? ' func-btn-active' : '')}>
            <Icon className="func-btn-icon" name="eraser" size="large"></Icon>
            <div className="func-btn-desc">擦除</div>
          </div> */}
        </>
      )
      const originMenus = (
        <>
          <div className="func-btn">
            <Dropdown
              icon={null}
              trigger={
                <>
                  <Icon className="func-btn-icon" name="search" size="large"></Icon>
                  <div className="func-btn-desc">
                    缩放
                    <FontAwesomeIcon icon={faCaretDown} />
                  </div>
                </>
              }>
              <Dropdown.Menu>
                <Dropdown.Item text="放大" icon="search plus" onClick={this.ZoomIn.bind(this)} />
                <Dropdown.Item text="缩小" icon="search minus" onClick={this.ZoomOut.bind(this)} />
              </Dropdown.Menu>
            </Dropdown>
          </div>
          <div onClick={this.reset.bind(this)} className="func-btn" title="刷新">
            <Icon className="func-btn-icon" name="repeat" size="large"></Icon>
            <div className="func-btn-desc">刷新</div>
          </div>
          <div
            title="窗宽窗位"
            onClick={this.wwwcCustom.bind(this)}
            className={'func-btn' + (!showFollowUp && menuTools === 'wwwc' ? ' func-btn-active' : '') + (showFollowUp && followUpActiveTool === 'Wwwc' ? ' func-btn-active' : '')}
            hidden={show3DVisualization && !MPR}>
            <Icon className="func-btn-icon icon-custom icon-custom-wwwc" size="large"></Icon>
            <div className="func-btn-desc">
              <Dropdown
                icon={null}
                trigger={
                  <>
                    窗宽窗位
                    <FontAwesomeIcon icon={faCaretDown} />
                  </>
                }>
                <Dropdown.Menu>
                  <Dropdown.Item text="反色" onClick={this.imagesFlip.bind(this)} />
                  <Dropdown.Item text="肺窗" onClick={this.toPulmonary.bind(this)} />
                  <Dropdown.Item text="骨窗" onClick={this.toBoneWindow.bind(this)} />
                  <Dropdown.Item text="腹窗" onClick={this.toVentralWindow.bind(this)} />
                  <Dropdown.Item text="纵隔窗" onClick={this.toMedia.bind(this)} />
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </div>
          {this.state.isPlaying ? (
            <div onClick={this.pauseAnimation.bind(this)} className="func-btn" title="暂停动画" hidden={show3DVisualization}>
              <Icon className="func-btn-icon" name="pause" size="large"></Icon>
              <div className="func-btn-desc">暂停</div>
            </div>
          ) : this.props.followUpIsPlaying ? (
            <div onClick={this.pauseAnimation.bind(this)} className="func-btn" title="暂停动画" hidden={show3DVisualization}>
              <Icon className="func-btn-icon" name="pause" size="large"></Icon>
              <div className="func-btn-desc">暂停</div>
            </div>
          ) : (
            <div onClick={this.playAnimation.bind(this)} className="func-btn" title="播放动画" hidden={show3DVisualization}>
              <Icon className="func-btn-icon" name="play" size="large"></Icon>
              <div className="func-btn-desc">播放</div>
            </div>
          )}

          {!(show3DVisualization || showFollowUp) ? twodMenus : null}
          {show3DVisualization ? threedMenus : null}
          {showFollowUp ? followUpMenus : null}

          {show3DVisualization ? (
            <div className="func-btn" onClick={this.hide3D.bind(this)} hidden={showFollowUp}>
              <Icon className="func-btn-icon icon-custom icon-custom-hide-3d" size="large"></Icon>
              <div className="func-btn-desc"> 隐藏3D</div>
            </div>
          ) : (
            <div title="显示3D" className="func-btn" onClick={this.show3D.bind(this)} hidden={showFollowUp}>
              <Icon className="func-btn-icon icon-custom icon-custom-show-3d" size="large"></Icon>
              <div className="func-btn-desc">显示3D</div>
            </div>
          )}

          {showFollowUp ? (
            <div title="随访" className={'func-btn'} onClick={this.hideFollowUp.bind(this)} hidden={show3DVisualization || renderLoading}>
              <Icon className="func-btn-icon" name="history" size="large"></Icon>
              <div className="func-btn-desc">关闭随访</div>
            </div>
          ) : (
            <div title="随访" className={'func-btn'} onClick={this.showFollowUp.bind(this)} hidden={show3DVisualization || renderLoading}>
              <Icon className="func-btn-icon" name="history" size="large"></Icon>
              <div className="func-btn-desc">进入随访</div>
            </div>
          )}
        </>
      )

      return (
        <div id="corner-container">
          <div className="corner-top-row">
            <div className="corner-header">
              <div id="menu-item-logo">
                {/* <Image src={src1} avatar size="mini" /> */}
                <a id="sys-name" href="/searchCase">
                  肺结节CT影像辅助检测软件
                </a>
                {menuScrollable && menuNowPage > 1 ? <FontAwesomeIcon icon={faChevronLeft} onClick={this.onMenuPageUp.bind(this)} className="menu-item-buttons-direction direction-page-up" /> : <></>}
              </div>
              <div id="menu-item-buttons" style={{ transform: `translateX(${-menuTransform}px)` }}>
                <div onClick={this.onSetStudyList.bind(this, !studyListShowed)} className={'func-btn' + (studyListShowed ? ' func-btn-active' : '')}>
                  <Icon className="func-btn-icon" name="list" size="large"></Icon>
                  <div className="func-btn-desc"> 序列</div>
                </div>
                <span className="menu-line"></span>
                {originMenus}
              </div>

              <div id="menu-item-user">
                <Dropdown text={welcome}>
                  <Dropdown.Menu id="logout-menu">
                    <Dropdown.Item icon="home" text="我的主页" onClick={this.toHomepage.bind(this)} />
                    {/* <Dropdown.Item
                    icon="write"
                    text="留言"
                    onClick={this.handleWriting}
                  /> */}
                    <Dropdown.Item icon="trash alternate" text="清空缓存" onClick={this.clearLocalStorage.bind(this)} />
                    <Dropdown.Item icon="log out" text="注销" onClick={this.handleLogout.bind(this)} />
                  </Dropdown.Menu>
                </Dropdown>
                {menuScrollable && menuNowPage < menuTotalPages ? (
                  <FontAwesomeIcon icon={faChevronRight} onClick={this.onMenuPageDown.bind(this)} className="menu-item-buttons-direction direction-page-down" />
                ) : (
                  <></>
                )}
              </div>
            </div>
          </div>
          <div className="corner-bottom-row" style={{ height: bottomRowHeight }}>
            <Sidebar.Pushable style={{ overflow: 'hidden', width: '100%' }}>
              <Sidebar visible={studyListShowed} animation={'overlay'} width="thin">
                <div className="preview">{previewContent}</div>
              </Sidebar>
              <Sidebar.Pusher style={{ height: '100%' }}>
                {showFollowUp ? (
                  <div
                    className={'ct-follow-up' + (studyListShowed ? ' ct-follow-up-contract' : '') + (verticalMode ? ' ct-follow-up-vertical' : ' ct-follow-up-horizontal')}
                    style={studyListShowed ? { paddingLeft: `${ctInfoPadding}px` } : {}}>
                    <FollowUpDisplayElement
                      curCaseId={curCaseId}
                      preCaseId={preCaseId}
                      username={username}
                      onRef={(input) => {
                        this.followUpComponent = input
                      }}
                    />
                  </div>
                ) : (
                  <div className={'ct-info' + (studyListShowed ? ' ct-info-contract' : '') + (verticalMode ? ' ct-info-vertical' : ' ct-info-horizontal')}>
                    <div
                      className={
                        'corner-center-block' + (studyListShowed ? ' corner-center-contract-block' : '') + (verticalMode ? ' corner-center-vertical-block' : ' corner-center-horizontal-block')
                      }
                      style={{ paddingLeft: `${ctInfoPadding}px` }}>
                      {show3DVisualization ? (
                        <div className="center-viewport-panel" id="segment-container">
                          {renderLoading ? loadingPanel : <div style={{ width: viewerWidth, height: viewerHeight }}>{panel}</div>}
                        </div>
                      ) : (
                        <div id="cor-container">
                          {/* <Grid.Row columns={2} id='canvas-column' style={{height:this.state.windowHeight*37/40}}> */}
                          {/* <div className='canvas-style' id='canvas-border'> */}
                          {renderLoading ? (
                            loadingPanel
                          ) : (
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
                                {dicomTagPanel}
                              </div>
                              {/* </div> */}
                              <div id="cor-slice-slider" style={{ height: `${canvasHeight * 0.7}px`, top: `${canvasHeight * 0.15}px` }}>
                                <Slider
                                  vertical
                                  reverse
                                  marks={sliderMarks}
                                  // defaultValue={0}
                                  value={this.state.currentIdx}
                                  onChange={this.handleRangeChange.bind(this)}
                                  onAfterChange={this.handleRangeAfterChange.bind(this)}
                                  tipFormatter={(value) => `${value + 1}`}
                                  min={0}
                                  step={1}
                                  max={this.state.imageIds.length - 1}></Slider>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* <div className='antd-slider'> */}

                      {/* </div> */}
                    </div>
                    <div
                      className={'corner-list-block' + (studyListShowed ? ' corner-list-contract-block' : '') + (verticalMode ? ' corner-list-vertical-block' : ' corner-list-horizontal-block')}
                      style={verticalMode ? { paddingLeft: `${ctInfoPadding}px` } : {}}>
                      <div className={'ct-list-container'}>
                        <div id="nodule-card-container" className={verticalMode ? 'nodule-card-container-vertical' : 'nodule-card-container-horizontal'}>
                          <Tabs type="card" defaultActiveKey="1" size="small" onChange={this.onHandleFirstTabChange.bind(this)}>
                            <TabPane tab={'肺病灶'} key="1">
                              <Tabs type="card" defaultActiveKey="1" size="small">
                                <TabPane tab={`肺结节 ${boxes.length}个`} key="1">
                                  <div id="elec-table">
                                    {boxes.length === 0 ? (
                                      <div
                                        style={{
                                          height: '100%',
                                          background: 'rgb(23, 28, 47)',
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
                                      <>
                                        <div className="nodule-filter">
                                          <div className="nodule-filter-desc-index">1</div>
                                          <div className="nodule-filter-desc">
                                            <Checkbox
                                              className="nodule-filter-desc-checkbox"
                                              checked={nodulesAllChecked}
                                              onChange={this.onHandleNoduleAllCheckChange.bind(this)}
                                              onClick={this.onHandleNoduleAllCheckClick.bind(this)}>
                                              全选
                                            </Checkbox>
                                            <div className="nodule-filter-desc-text">已筛选{noduleNumber}个病灶</div>
                                          </div>
                                          <div className="nodule-filter-operation">
                                            <Popup on="click" style={{ backgroundColor: 'rgb(39, 46, 72)' }} trigger={<FontAwesomeIcon className="nodule-filter-operation-icon" icon={faFilter} />}>
                                              <div className="nodule-filter-operation-select">
                                                <div className="nodule-filter-operation-select-header">
                                                  已筛选<span>{noduleNumber}</span>个病灶
                                                </div>
                                                <div className="nodule-filter-operation-select-content">
                                                  <div className="nodule-filter-operation-select-content-block">
                                                    <div className="nodule-filter-operation-select-content-header">结节类型</div>
                                                    {noduleSelectContent[0]}
                                                  </div>
                                                  <div className="nodule-filter-operation-select-content-block">
                                                    <div className="nodule-filter-operation-select-content-header">直径大小</div>
                                                    {noduleSelectContent[1]}
                                                  </div>
                                                  <div className="nodule-filter-operation-select-content-block">
                                                    <div className="nodule-filter-operation-select-content-header">良恶性</div>
                                                    {noduleSelectContent[2]}
                                                  </div>
                                                  <div className="nodule-filter-operation-select-content-bottom">
                                                    <div className="nodule-filter-operation-select-content-bottom-left">
                                                      <Checkbox
                                                        className="nodule-filter-operation-select-content-bottom-check"
                                                        checked={nodulesAllSelected}
                                                        onChange={this.onHandleSelectAllNodules.bind(this)}></Checkbox>
                                                      全选
                                                    </div>
                                                    <div className="nodule-filter-operation-select-content-bottom-right">
                                                      <Button className="nodule-filter-operation-select-content-bottom-button" onClick={this.onHandleSelectNoduleComplete.bind(this)}>
                                                        确定
                                                      </Button>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            </Popup>

                                            <Popup
                                              on="click"
                                              style={{ backgroundColor: 'rgb(39, 46, 72)' }}
                                              trigger={<FontAwesomeIcon className="nodule-filter-operation-icon" icon={faSortAmountDownAlt} />}>
                                              <div className="nodule-filter-operation-sort">
                                                <div className="nodule-filter-operation-sort-header">排序</div>
                                                <div className="nodule-filter-operation-sort-content">{noduleOrderContent}</div>
                                              </div>
                                            </Popup>
                                          </div>
                                        </div>
                                        <Accordion styled id="nodule-accordion" fluid onDoubleClick={this.doubleClickListItems.bind(this)}>
                                          {tableContent}
                                        </Accordion>
                                      </>
                                    )}
                                  </div>
                                </TabPane>

                                {show3DVisualization ? (
                                  <>
                                    <TabPane tab={'肺叶'} key="3">
                                      <div id="elec-table">
                                        <div className="threed-filter">
                                          <div className="threed-filter-desc-index">1</div>
                                          <div className="threed-filter-desc">
                                            <Checkbox
                                              className="threed-filter-desc-checkbox"
                                              checked={lobesAllChecked}
                                              onChange={this.onHandleThreedAllCheckChange.bind(this, 0)}
                                              onClick={this.onHandleThreedAllCheckClick.bind(this)}>
                                              全选
                                            </Checkbox>
                                            <div className="threed-filter-desc-text">已选择{lobeCheckNumber}个肺叶</div>
                                          </div>
                                          <div className="threed-filter-operation">
                                            {lobesAllVisible ? (
                                              <FontAwesomeIcon className="threed-filter-operation-icon" icon={faEyeSlash} onClick={this.onSetThreedAllVisible.bind(this, 0, false)} />
                                            ) : (
                                              <FontAwesomeIcon className="threed-filter-operation-icon" icon={faEye} onClick={this.onSetThreedAllVisible.bind(this, 0, true)} />
                                            )}
                                          </div>
                                        </div>
                                        <Accordion styled id="lobe-accordion" fluid>
                                          {lobeContent}
                                        </Accordion>
                                      </div>
                                    </TabPane>
                                    <TabPane tab={'气管和血管'} key="4">
                                      <div id="elec-table">
                                        <div className="threed-filter">
                                          <div className="threed-filter-desc-index">1</div>

                                          <div className="threed-filter-desc">
                                            <Checkbox
                                              className="threed-filter-desc-checkbox"
                                              checked={tubularAllChecked}
                                              onChange={this.onHandleThreedAllCheckChange.bind(this, 1)}
                                              onClick={this.onHandleThreedAllCheckClick.bind(this)}>
                                              全选
                                            </Checkbox>
                                            <div className="threed-filter-desc-text">已选择{tubularCheckNumber}个管状结构</div>
                                          </div>
                                          <div className="threed-filter-operation">
                                            {tubularAllVisible ? (
                                              <FontAwesomeIcon className="threed-filter-operation-icon" icon={faEyeSlash} onClick={this.onSetThreedAllVisible.bind(this, 1, false)} />
                                            ) : (
                                              <FontAwesomeIcon className="threed-filter-operation-icon" icon={faEye} onClick={this.onSetThreedAllVisible.bind(this, 1, true)} />
                                            )}
                                          </div>
                                        </div>

                                        <Accordion styled id="tubular-accordion" fluid>
                                          {tubularContent}
                                        </Accordion>
                                      </div>
                                    </TabPane>
                                  </>
                                ) : (
                                  <>{/* <TabPane tab={'肺炎'} key="2"></TabPane> */}</>
                                )}
                              </Tabs>
                            </TabPane>
                            <TabPane tab={'纵隔病灶'} key="2">
                              <Tabs type="card" defaultActiveKey="1" size="small">
                                <TabPane tab={`淋巴结 ${lymphs.length}个`} key="1">
                                  <div id="elec-table">
                                    {lymphs && lymphs.length ? (
                                      <>
                                        <Accordion styled id="lymph-accordion" fluid>
                                          {lymphContent}
                                        </Accordion>
                                      </>
                                    ) : (
                                      <div
                                        style={{
                                          height: '100%',
                                          background: 'rgb(23, 28, 47)',
                                          display: 'flex',
                                          justifyContent: 'center',
                                          alignItems: 'center',
                                        }}>
                                        <Header as="h2" inverted>
                                          <Icon name="low vision" />
                                          <Header.Content>未检测出任何淋巴结</Header.Content>
                                        </Header>
                                      </div>
                                    )}
                                  </div>
                                </TabPane>
                              </Tabs>
                            </TabPane>
                            {/* <TabPane tab={'其他'} key="3"></TabPane> */}
                          </Tabs>
                        </div>

                        {show3DVisualization ? (
                          <div id="threed-mask-container" className={verticalMode ? ' threed-mask-container-vertical' : ' threed-mask-container-horizontal'}>
                            {
                              MPR && painting && maskVolumes && maskVolumes.length ? (
                                <VTKMaskViewer
                                  viewerStyle={{
                                    width: `${maskWidth}px`,
                                    height: `${maskHeight}px`,
                                    border: '1px solid rgb(103, 118, 173)',
                                  }}
                                  volumes={maskVolumes}
                                  maskWidth={maskWidth}
                                  maskHeight={maskHeight}
                                  paintFilterBackgroundImageData={maskImageData}
                                  paintFilterLabelMapImageData={maskLabelMap}
                                  painting={painting}
                                  parallelScale={maskYLength / 2}
                                  onRef={(ref) => {
                                    this.viewerMask = ref
                                  }}
                                />
                              ) : null
                              // <div id="lobe-func-container">
                              //   <div className="lobe-func-header">肺功能</div>
                              //   <div className="lobe-func-content">
                              //     <div className="lobe-func-item">第1秒用力呼气容积(fev1)：2.24</div>
                              //     <div className="lobe-func-item">第1秒用力呼气的容积占预计值的百分比(fev1%pred)：95%</div>
                              //     <div className="lobe-func-item">用力肺活量(fvc)：3.38</div>
                              //     <div className="lobe-func-item">用力肺活量占预测值的百分比（fvc%pred)：115%</div>
                              //     <div className="lobe-func-item">第一秒用力呼气量占所有呼气量的比例(fev1/fvc%)：66.7%</div>
                              //   </div>
                              // </div>
                            }
                          </div>
                        ) : (
                          <div id="report" className={'report-tab-container' + (verticalMode ? ' report-tab-container-vertical' : ' report-tab-container-horizontal')}>
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
                                        // {
                                        //   key: '单个结节',
                                        //   text: '单个结节',
                                        //   value: '单个结节',
                                        // },
                                      ]}
                                      defaultValue={reportImageType}
                                      icon={<FontAwesomeIcon icon={faChevronDown} />}
                                      onChange={this.onHandleReportImageTypeChange.bind(this)}
                                    />
                                  </div>
                                  <div className="report-title-operation">
                                    <Modal
                                      className="corner-report-modal"
                                      trigger={<Icon name="expand arrows alternate" title="放大" className="inverted blue button" onClick={this.showImages.bind(this)}></Icon>}>
                                      <Modal.Header className="corner-report-modal-header">
                                        <Row>
                                          <Col span={12} className="corner-report-modal-header-info">
                                            影像诊断报告
                                          </Col>
                                          <Col span={12} className="corner-report-modal-header-button">
                                            {this.state.temp === 1 ? (
                                              <Button color="blue" onClick={this.exportPDF.bind(this)}>
                                                导出pdf
                                              </Button>
                                            ) : (
                                              <Button color="blue" loading>
                                                Loading
                                              </Button>
                                            )}
                                          </Col>
                                        </Row>
                                      </Modal.Header>
                                      <Modal.Content image scrolling id="pdf">
                                        <Modal.Description>
                                          <Row>
                                            <Col span={12}>
                                              <Row>
                                                <Col span={8}>
                                                  <span>病人编号:</span>
                                                </Col>
                                                <Col span={16}> {this.state.patientId}</Col>
                                              </Row>
                                              <Row>
                                                <Col span={8}>
                                                  <span>出生日期:</span>
                                                </Col>
                                                <Col span={16}> {this.state.patientBirth}</Col>
                                              </Row>
                                              <Row>
                                                <Col span={8}>
                                                  <span>检查编号:</span>
                                                </Col>
                                                <Col span={16}> 12580359</Col>
                                              </Row>
                                              <Row>
                                                <Col span={8}>
                                                  <span>入库编号:</span>
                                                </Col>
                                                <Col span={16}></Col>
                                              </Row>
                                              <Row>
                                                <Col span={8}>
                                                  <span>检查日期:</span>
                                                </Col>
                                                <Col span={16}></Col>
                                              </Row>
                                              <Row>
                                                <Col span={8}>
                                                  <span>报告撰写日期:</span>
                                                </Col>
                                                <Col span={16}></Col>
                                              </Row>
                                              <Row>
                                                <Col span={8}>
                                                  <span>请求过程描述:</span>
                                                </Col>
                                                <Col span={16}></Col>
                                              </Row>
                                            </Col>
                                            <Col span={12}>
                                              <Row>
                                                <Col span={6}>
                                                  <span>姓名:</span>
                                                </Col>
                                                <Col span={18}></Col>
                                              </Row>
                                              <Row>
                                                <Col span={6}>
                                                  <span>年龄:</span>
                                                </Col>
                                                <Col span={18}></Col>
                                              </Row>
                                              <Row>
                                                <Col span={6}>
                                                  <span>性别:</span>
                                                </Col>
                                                <Col span={18}>{this.state.patientSex}</Col>
                                              </Row>
                                              <Row>
                                                <Col span={6}>
                                                  <span>身高:</span>
                                                </Col>
                                                <Col span={18}></Col>
                                              </Row>
                                              <Row>
                                                <Col span={6}>
                                                  <span>体重:</span>
                                                </Col>
                                                <Col span={18}></Col>
                                              </Row>
                                              <Row>
                                                <Col span={6}>
                                                  <span>体重系数:</span>
                                                </Col>
                                                <Col span={18}></Col>
                                              </Row>
                                            </Col>
                                          </Row>
                                          <Divider />

                                          <div className="corner-report-modal-title">扫描参数</div>
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
                                          <div className="corner-report-modal-title">肺部详情</div>
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
                                          {boxes && boxes.length
                                            ? boxes.map((nodule, index) => {
                                                let nodule_id = 'nodule-' + nodule.nodule_no + '-' + nodule.slice_idx
                                                let visualId = 'visual' + index
                                                // console.log('visualId',visualId)
                                                return (
                                                  <div key={index}>
                                                    <div>&nbsp;</div>
                                                    <div className="corner-report-modal-title" id="noduleDivide">
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
                                              })
                                            : null}
                                        </Modal.Description>
                                      </Modal.Content>
                                    </Modal>

                                    <Icon title="复制" className="inverted blue button" name="copy outline" onClick={this.handleCopyClick.bind(this)}></Icon>
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
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </Sidebar.Pusher>
            </Sidebar.Pushable>
          </div>
          {histogramFloatWindow}
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
              <div
                style={{
                  top: '5px',
                  // left: "-95px", // 5px
                  position: 'absolute',
                  color: 'white',
                }}>
                {dicomTag.string('x00100010')}
              </div>
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
              <div
                style={{
                  top: '5px',
                  right: '5px', //5px
                  position: 'absolute',
                  color: 'white',
                }}>
                {dicomTag.string('x00080080')}
              </div>
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
              <div
                style={{
                  bottom: '5px',
                  left: '-95px',
                  position: 'absolute',
                  color: 'white',
                }}>
                Zoom: {Math.round(this.state.viewport.scale * 100)} %
              </div>
              <div
                style={{
                  bottom: '5px',
                  right: '-95px',
                  position: 'absolute',
                  color: 'white',
                }}>
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

  drawBox(box) {
    const canvas = document.getElementById('canvas')
    const context = canvas.getContext('2d')
    // ROIcontext.globalCompositeOperation = "copy"

    const xCenter = box.x1 + (box.x2 - box.x1) / 2
    const yCenter = box.y1 + (box.y2 - box.y1) / 2
    const width = box.x2 - box.x1
    const height = box.y2 - box.y1
    context.setLineDash([])
    context.strokeStyle = 'rgb(255, 255, 0)'
    context.fillStyle = 'rgb(255, 255, 0)'
    context.beginPath()
    const new_y1 = yCenter - height / 2
    context.rect(box.x1, box.y1, width, height)
    context.lineWidth = 1
    context.stroke()

    if (box.visibleIdx || box.visibleIdx === 0) {
      context.fillText(box.visibleIdx + 1, xCenter - 3, new_y1 - 10)
    }
    context.closePath()
  }
  drawLymph({ lymph, visibleIdx }) {
    const canvas = document.getElementById('canvas')
    const context = canvas.getContext('2d')
    // ROIcontext.globalCompositeOperation = "copy"

    const xCenter = lymph.x1 + (lymph.x2 - lymph.x1) / 2
    const yCenter = lymph.y1 + (lymph.y2 - lymph.y1) / 2
    const width = lymph.x2 - lymph.x1
    const height = lymph.y2 - lymph.y1
    context.setLineDash([])
    context.strokeStyle = 'blue'
    context.fillStyle = 'blue'
    context.beginPath()
    const new_y1 = yCenter - height / 2
    context.rect(lymph.x1, lymph.y1, width, height)
    context.lineWidth = 1
    context.stroke()

    if (visibleIdx || visibleIdx === 0) {
      context.fillText(visibleIdx + 1, xCenter - 3, new_y1 - 10)
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
    const boxes = this.state.boxes
    for (let i = 0; i < boxes.length; i++) {
      let box = this.state.boxes[i]
      if (box.slice_idx === this.state.currentIdx) {
        const box = boxes[i]
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
        } else {
          console.log('?')
        }
      }
    }
    // const i = _.findIndex(boxes, { slice_idx: this.state.currentIdx, visibleIdx: this.state.listsActiveIndex })
    // if (i !== -1) {
    // }
    return { box: -1, pos: 'o' }
  }

  findMeasureArea(x, y) {
    const lineOffset = 2
    const boxes = this.state.boxes
    for (let i = 0; i < boxes.length; i++) {
      let box = this.state.boxes[i]
      if (box.slice_idx === this.state.currentIdx) {
        const box = boxes[i]
        const xCenter = box.x1 + (box.x2 - box.x1) / 2
        const yCenter = box.y1 + (box.y2 - box.y1) / 2
        const width = box.x2 - box.x1
        const height = box.y2 - box.y1
        const y1 = box.y1
        const x1 = box.x1
        const y2 = box.y2
        const x2 = box.x2
        if (x1 - lineOffset < x && x < x2 + lineOffset && y1 - lineOffset < y && y < y2 + lineOffset) {
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
            } else {
              console.log('?')
            }
          } else {
            console.log('om')
            return { box: i, pos: 'ib', m_pos: 'om' }
          }
        }
      }
    }
    // const i = _.findIndex(boxes, { slice_idx: this.state.currentIdx, visibleIdx: this.state.listsActiveIndex })
    // if (i !== -1) {

    // }
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
    // this.setState({currentIdx: event.target.value - 1, imageId:
    // this.state.imageIds[event.target.value - 1]})
    // let style = $("<style>", {type:"text/css"}).appendTo("head");

    // style.text('#slice-slider::-webkit-slider-runnable-track{background:linear-gradient(90deg,#0033FF 0%,#000033 '+ (event.target.value -1)*100/this.state.imageIds.length+'%)}');
    this.refreshImage(false, this.state.imageIds[e], e)
  }
  handleRangeAfterChange(e) {}
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

    for (var i = ~~x1; i <= x2; i++) {
      for (var j = ~~y1; j <= y2; j++) {
        pixelArray.push(parseInt(slope) * parseInt(pixeldata[512 * j + i]) + parseInt(intercept))
      }
    }
    pixelArray.sort(this.pixeldataSort)
    const data = pixelArray
    const huMax = _.max(data)
    const huMean = _.mean(data)
    const huMin = _.min(data)
    let huStdSum = 0
    var map = {}
    for (var i = 0; i < data.length; i++) {
      huStdSum += Math.pow(data[i] - huMean, 2)
      var key = data[i]
      if (map[key]) {
        map[key] += 1
      } else {
        map[key] = 1
      }
    }
    const huStd = huStdSum / data.length
    Object.keys(map).sort(function (a, b) {
      return map[b] - map[a]
    })
    // console.log('map', map)

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
    var obj = {}
    obj.bins = bins
    obj.n = ns
    return [obj, huMax, huMean, huMin, huStd]
  }

  createBox(x1, x2, y1, y2, slice_idx) {
    const imageId = this.state.imageIds[slice_idx]
    // console.log('image', imageId)
    const [nodule_hist, huMax, huMean, huMin, huStd] = this.noduleHist(x1, y1, x2, y2)
    console.log('coor', x1, x2, y1, y2)
    const volume = Math.abs(x1 - x2) * Math.abs(y1 - y2) * Math.pow(10, -4)
    let boxes = this.state.boxes
    let visibleIdx
    if (this.state.boxes && this.state.boxes.length) {
      boxes = this.state.boxes
      visibleIdx = _.maxBy(boxes, 'visibleIdx').visibleIdx + 1
    } else {
      boxes = []
      visibleIdx = 0
    }
    const newBox = {
      ...boxProtoType,
      probability: 1,
      slice_idx: slice_idx,
      nodule_hist,
      huMax,
      huMean,
      huMin,
      Variance: huStd,
      volume,
      x1: x1,
      x2: x2,
      y1: y1,
      y2: y2,
      measure: undefined,
      modified: 1,
      prevIdx: '',
      visibleIdx,
      visible: true,
      checked: false,
    }
    // let boxes = this.state.selectBoxes
    boxes.push(newBox)
    const measureStateList = this.state.measureStateList
    measureStateList.push(false)
    this.setState({
      boxes,
      measureStateList,
    })
    console.log('Boxes', boxes, measureStateList)

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
      const boxes = this.state.boxes
      const listsActiveIndex = this.state.listsActiveIndex
      if (listsActiveIndex === -1) {
        this.keyDownListSwitch(0)
      } else {
        if (listsActiveIndex === 0) {
          this.keyDownListSwitch(boxes.length - 1)
        } else {
          this.keyDownListSwitch(listsActiveIndex - 1)
        }
      }
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
      const boxes = this.state.boxes
      const listsActiveIndex = this.state.listsActiveIndex
      // const boxes = this.state.selectBoxes
      if (listsActiveIndex === -1) {
        this.keyDownListSwitch(0)
      } else {
        if (listsActiveIndex === boxes.length - 1) {
          this.keyDownListSwitch(0)
        } else {
          this.keyDownListSwitch(listsActiveIndex + 1)
        }
      }
    }
    if (event.which == 72) {
      this.toHidebox()
    }
  }

  onMouseDown(event) {
    console.log('corner onMouseDown', event)
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
        console.log('cotnt', content)

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
      // const boxes = this.state.selectBoxes
      this.createBox(x1, x2, y1, y2, this.state.currentIdx)
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

  showFollowUp() {
    this.onSetStudyList(true)
    this.pauseAnimation()
    this.setState({
      showFollowUp: true,
    })

    // const dataListParams = {
    //   type: 'pid',
    //   mainItem: this.state.caseId.split('_')[0],
    //   otherKeyword: '',
    // }
    // const allListPromise = new Promise((resolve, reject) => {
    //   axios.post(this.config.record.getSubListForMainItem_front, qs.stringify(dataListParams)).then((sublistResponse) => {
    //     const sublistData = sublistResponse.data.subList
    //     resolve(sublistData)
    //   }, reject)
    // })

    // const sublistData = await allListPromise
    // console.log('subl', sublistData)
    // const currentDate = this.state.caseId.split('_')[1]
    // var i = 0
    // for (var key in sublistData) {
    //   i += 1
    //   if (key === currentDate) break
    // }
    // var preCaseId = ''
    // for (var key in sublistData) {
    //   i -= 1
    //   if (i === 1) {
    //     preCaseId = sublistData[key][0].caseId
    //     break
    //   }
    // }
    // if (preCaseId === '') {
    //   preCaseId = this.state.caseId
    // }

    // console.log('preCaseId', preCaseId)
    // window.location.href = '/followup/' + this.state.caseId + '&' + preCaseId + '/' + this.state.username
  }
  hideFollowUp() {
    if (this.props.followUpLoadingCompleted) {
      this.hideFollowUpOp()
    } else {
      const hide = message.loading('正在加载图像，稍后关闭随访', 0)
      closeFollowUpInterval = setInterval(() => {
        if (this.props.followUpLoadingCompleted) {
          hide()
          this.hideFollowUpOp()
          clearInterval(closeFollowUpInterval)
        }
      }, 500)
    }
  }
  hideFollowUpOp() {
    this.props.setFollowUpPlaying(false)
    this.setState((prevState) => ({
      registering: false,
    }))
    this.setState(
      {
        showFollowUp: false,
      },
      () => {
        this.resizeScreen()
      }
    )
  }
  reset() {
    //重置
    if (this.state.showFollowUp) {
      if (this.followUpComponent) {
        this.followUpComponent.reset()
      }
    } else if (this.state.show3DVisualization) {
      if (this.viewer3D) {
        this.viewer3D.resetView()
      }
      if (this.state.MPR) {
        this.resetAllView()
      }
    } else {
      let viewport = cornerstone.getViewport(this.element)
      viewport.translation = {
        x: 0,
        y: 0,
      }
      viewport.scale = this.state.canvasHeight / 512
      // viewport.scale = document.getElementById("canvas").width / 512;
      cornerstone.setViewport(this.element, viewport)
      this.setState({ viewport })
      console.log('to pulmonary', viewport)
    }
  }

  imagesFlip() {
    if (this.state.showFollowUp) {
      if (this.followUpComponent) {
        this.followUpComponent.imagesFlip()
      }
    } else if (this.state.show3DVisualization) {
    } else {
      let viewport = cornerstone.getViewport(this.element)
      if (viewport.invert === true) {
        viewport.invert = false
      } else {
        viewport.invert = true
      }
      cornerstone.setViewport(this.element, viewport)
      this.setState({ viewport })
    }
  }

  ZoomIn() {
    //放大
    if (this.state.showFollowUp) {
      if (this.followUpComponent) {
        this.followUpComponent.ZoomIn()
      }
    } else if (this.state.show3DVisualization) {
      if (this.viewer3D) {
        this.viewer3D.zoomIn()
      }
    } else {
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
    }
  }

  ZoomOut() {
    //缩小
    if (this.state.showFollowUp) {
      if (this.followUpComponent) {
        this.followUpComponent.ZoomOut()
      }
    } else if (this.state.show3DVisualization) {
      if (this.viewer3D) {
        this.viewer3D.zoomOut()
      }
    } else {
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
    }
  }

  toPulmonary() {
    //肺窗
    if (this.state.showFollowUp) {
      if (this.followUpComponent) {
        this.followUpComponent.toPulmonary()
      }
    } else if (this.state.show3DVisualization) {
      if (this.state.MPR) {
        this.setWL(1)
      }
    } else {
      let viewport = cornerstone.getViewport(this.element)
      viewport.voi.windowWidth = 1600
      viewport.voi.windowCenter = -600
      cornerstone.setViewport(this.element, viewport)
      this.setState({ viewport })
      console.log('to pulmonary', viewport)
    }
  }

  toMedia() {
    //纵隔窗
    if (this.state.showFollowUp) {
      if (this.followUpComponent) {
        this.followUpComponent.toMedia()
      }
    } else if (this.state.show3DVisualization) {
      if (this.state.MPR) {
        this.setWL(4)
      }
    } else {
      let viewport = cornerstone.getViewport(this.element)
      viewport.voi.windowWidth = 500
      viewport.voi.windowCenter = 50
      cornerstone.setViewport(this.element, viewport)
      this.setState({ viewport })
      console.log('to media', viewport)
    }
  }

  toBoneWindow() {
    //骨窗
    if (this.state.showFollowUp) {
      if (this.followUpComponent) {
        this.followUpComponent.toBoneWindow()
      }
    } else if (this.state.show3DVisualization) {
      if (this.state.MPR) {
        this.setWL(2)
      }
    } else {
      let viewport = cornerstone.getViewport(this.element)
      viewport.voi.windowWidth = 1000
      viewport.voi.windowCenter = 300
      cornerstone.setViewport(this.element, viewport)
      this.setState({ viewport })
      console.log('to media', viewport)
    }
  }

  toVentralWindow() {
    //腹窗
    if (this.state.showFollowUp) {
      if (this.followUpComponent) {
        this.followUpComponent.toVentralWindow()
      }
    } else if (this.state.show3DVisualization) {
      if (this.state.MPR) {
        this.setWL(3)
      }
    } else {
      let viewport = cornerstone.getViewport(this.element)
      viewport.voi.windowWidth = 400
      viewport.voi.windowCenter = 40
      cornerstone.setViewport(this.element, viewport)
      this.setState({ viewport })
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
          message.warn('请先登录')
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
          message.warn('请先登录')
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
    message.success('已保存当前结果')
    this.setState({
      random: Math.random(),
      menuTools: '',
    })
  }
  nextPath(path) {
    this.props.history.push(path)
  }
  saveToDB() {
    console.log('savetodb')
    const backendNodules = this.getBackendNodules()

    const token = localStorage.getItem('token')
    const headers = {
      Authorization: 'Bearer '.concat(token),
    }
    const params = {
      caseId: this.state.caseId,
      username: this.state.username,
      newRectStr: JSON.stringify(backendNodules),
    }
    axios
      .post(this.config.draft.updateRects, qs.stringify(params), { headers })
      .then((res) => {
        if (res.data.status === 'okay') {
          const content = res.data.allDrafts
          // this.setState({ content: content })
        }
      })
      .catch((err) => {
        console.log('err: ' + err)
      })
  }
  submit() {
    console.log('createuser')
    const backendNodules = this.getBackendNodules()

    const token = localStorage.getItem('token')
    const headers = {
      Authorization: 'Bearer '.concat(token),
    }
    const params = {
      caseId: this.state.caseId,
      // username:this.state.username,
      newRectStr: JSON.stringify(backendNodules),
    }
    axios
      .post(this.config.draft.createUser, qs.stringify(params), { headers })
      .then((res) => {
        console.log(res)
        if (res.data.status === 'okay') {
          message.success('提交成功')
          console.log('createUser')
          // this.nextPath(res.data.nextPath)
          window.location.href = res.data.nextPath.replace('#', '%23')
        } else if (res.data.status === 'alreadyExisted') {
          console.log('alreadyExistedUser')
          // this.nextPath(res.data.nextPath)
          window.location.href = res.data.nextPath.replace('#', '%23')
        }
      })
      .catch((err) => {
        console.log('err: ' + err)
      })
  }
  getBackendNodules() {
    const boxes = this.state.boxes
    let backendNodules = []
    for (let i = 0; i < boxes.length; i++) {
      // const currentIdx = boxes[i].prevIdx
      const currentIdx = i
      backendNodules[currentIdx] = _.assign({}, boxes[i])
      delete backendNodules[currentIdx].prevIdx
      delete backendNodules[currentIdx].delOpen
      delete backendNodules[currentIdx].visible
      delete backendNodules[currentIdx].checked
      delete backendNodules[currentIdx].visibleIdx
    }
    backendNodules = _.compact(backendNodules)
    return backendNodules
  }
  setClearUserNodule(clearUserOpen) {
    this.setState({
      clearUserOpen,
    })
  }
  onConfirmClearUserNodule() {
    this.setState({
      clearUserOpen: false,
    })
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
          message.success('清空成功')
          window.location.href = window.location.pathname.split('/')[0] + '/' + window.location.pathname.split('/')[1] + '/' + window.location.pathname.split('/')[2] + '/deepln'
        } else {
          message.error('出现错误,请联系管理员')
        }
      })
      .catch((err) => {
        console.log(err)
      })
  }
  clearUserNodule() {}

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
        else message.error('出现错误，请联系管理员')
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
          message.error('出现错误,请联系管理员')
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
          message.error('出现错误,请联系管理员')
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
    if (!element) {
      return
    }
    const viewport = cornerstone.getViewport(element)
    if (this.state.showNodules === true && this.state.caseId.replace('#', '%23') === window.location.pathname.split('/')[2]) {
      for (let i = 0; i < this.state.boxes.length; i++) {
        // if (this.state.boxes[i].slice_idx == this.state.currentIdx && this.state.immersive == false)
        if (this.state.boxes[i].slice_idx == this.state.currentIdx) {
          this.drawBox(this.state.boxes[i])
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
    if (this.state.lymphs && this.state.lymphs.length) {
      this.state.lymphs.forEach((item, index) => {
        if (item.slice_idx === this.state.currentIdx) {
          this.drawLymph(item)
        }
      })
    }
    // console.log('bool',this.state.clicked && this.state.clickedArea.box !== -1 && this.state.leftButtonTools === 3,this.state.clicked,this.state.clickedArea.box,this.state.leftButtonTools)
    if (this.state.clicked && this.state.clickedArea.box == -1 && this.state.leftButtonTools == 0) {
      this.drawBox(this.state.tmpBox)
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
    console.log('resizeScreen', cornerstone.getEnabledElements())
    const verticalMode = document.body.clientWidth < document.body.clientHeight ? true : false
    this.setState({
      windowWidth: document.body.clientWidth,
      windowHeight: document.body.clientHeight,
      verticalMode,
    })
    // this.menuButtonsCalc()
    if (document.getElementsByClassName('corner-top-row') && document.getElementsByClassName('corner-top-row').length > 0) {
      const cornerTopRow = document.getElementsByClassName('corner-top-row')[0]

      const cornerTopRowHeight = cornerTopRow.clientHeight
      const cornerBottomRowHeight = document.body.clientHeight - cornerTopRowHeight - 5
      this.setState(
        {
          bottomRowHeight: cornerBottomRowHeight,
        },
        () => {
          this.reportImageTopCalc()
          if (this.state.show3DVisualization) {
            if (document.getElementById('segment-container') !== null) {
              const segmentContainer = document.getElementById('segment-container')
              const segmentContainerWidth = segmentContainer.clientWidth
              const segmentContainerHeight = segmentContainer.clientHeight
              console.log('resize3DView', segmentContainerWidth, segmentContainerHeight)
              this.resizeViewer(segmentContainerWidth - 4, segmentContainerHeight - 4)
            }
            if (document.getElementById('threed-mask-container')) {
              const threedMaskContainer = document.getElementById('threed-mask-container')
              this.setState({
                maskWidth: threedMaskContainer.clientWidth - 2,
                maskHeight: threedMaskContainer.clientHeight - 5,
              })
            }
          } else {
            if (document.getElementById('cor-container') != null) {
              const corContainer = document.getElementById('cor-container')
              const corContainerWidth = corContainer.clientWidth
              const corContainerHeight = corContainer.clientHeight

              const canvasWidth = corContainerWidth
              const canvasHeight = corContainerHeight

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
                    console.log('initialized')
                    this.refreshImage(true, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
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
      console.log('3Ding')
      return
    }
    // let style = $("<style>", {type:"text/css"}).appendTo("head");
    // style.text('#slice-slider::-webkit-slider-runnable-track{background:linear-gradient(90deg,#0033FF 0%,#000033 '+ (newIdx -1)*100/this.state.imageIds.length+'%)}');
    this.setState({ autoRefresh: false })

    if (!initial) {
      this.setState({ currentIdx: newIdx })
    }

    // const element = document.getElementById("origin-canvas");
    // const element = document.querySelector('#origin-canvas')
    const element = this.element
    const windowWidth = this.state.windowWidth
    const windowHeight = this.state.windowHeight
    if (initial) {
      cornerstone.enable(element)
      if (this.state.imageIds.length !== 0) {
        const leftBtnSpeed = Math.floor(document.getElementById('canvas').offsetWidth / this.state.imageIds.length)
        this.setState({ leftBtnSpeed: leftBtnSpeed })
      }
      this.setState({
        initialized: true,
      })
    } else {
      // cornerstone.getEnabledElement(element)
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
        // console.log('loadAndCacheImage', imageId)
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
        let viewport = {
          invert: false,
          pixelReplication: false,
          voi: {
            windowWidth: 1600,
            windowCenter: -600,
          },
          scale: this.state.canvasHeight / 512,
          translation: {
            x: 0,
            y: 0,
          },
        }
        cornerstone.setViewport(element, viewport)
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
    })
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
    e.stopPropagation()
    const reportImageText = this.state.reportImageText
    if (reportImageText && reportImageText.length > 0) {
      copy(this.state.reportImageText)
      message.success('复制成功')
    } else {
      message.warn('复制内容为空')
    }
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
  showImages(e) {
    e.stopPropagation()
    const boxes = this.state.boxes
    const imageIds = this.state.imageIds
    if (boxes.length === 0) {
      return
    }
    // console.log('imagesid',imageIds)
    let nodule_id = 'nodule-' + boxes[0].nodule_no + '-' + boxes[0].slice_idx
    let that = this
    var timer = setInterval(function () {
      if (document.getElementById(nodule_id) != null) {
        boxes.map((nodule, index) => {
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
            if (buttonflag === boxes.length) {
              that.setState({ temp: 1 })
            }
          })
        })
        clearInterval(timer)
      }
    }, 100)
  }
  onHandleNoduleAllCheckChange() {
    const boxes = this.state.boxes
    const nodulesAllChecked = !this.state.nodulesAllChecked
    boxes.forEach((item, index) => {
      item.checked = nodulesAllChecked
    })
    this.setState(
      {
        boxes,
        nodulesAllChecked,
      },
      () => {
        this.template()
      }
    )
  }
  onHandleNoduleAllCheckClick(e) {
    e.stopPropagation()
  }
  onHandleNoduleCheckChange(idx) {
    const boxes = this.state.boxes
    boxes[idx].checked = !boxes[idx].checked
    this.setState(
      {
        boxes,
      },
      () => {
        this.isAllCheck(2)
        this.template()
      }
    )
  }
  onHandleNoduleCheckClick(e) {
    e.stopPropagation()
  }
  onHandleThreedAllCheckChange(classification) {
    if (classification === 0 && this.state.lobesController && this.state.lobesController.lobesChecked) {
      const lobesController = this.state.lobesController
      const lobesAllChecked = !this.state.lobesAllChecked
      lobesController.lobesChecked.forEach((item, index) => {
        lobesController.lobesChecked[index] = lobesAllChecked
      })
      this.setState(
        {
          lobesController,
          lobesAllChecked,
        },
        () => {
          this.checkVisible(classification)
        }
      )
    } else if (classification === 1 && this.state.tubularController && this.state.tubularController.tubularChecked) {
      const tubularController = this.state.tubularController
      const tubularAllChecked = !this.state.tubularAllChecked
      tubularController.tubularChecked.forEach((item, index) => {
        tubularController.tubularChecked[index] = tubularAllChecked
      })
      this.setState(
        {
          tubularController,
          tubularAllChecked,
        },
        () => {
          this.checkVisible(classification)
        }
      )
    }
  }
  onHandleThreedAllCheckClick(e) {
    e.stopPropagation()
  }
  onHandleThreedCheckChange(classification, idx) {
    if (classification === 0 && this.state.lobesController && this.state.lobesController.lobesChecked) {
      const lobesController = this.state.lobesController
      lobesController.lobesChecked[idx] = !lobesController.lobesChecked[idx]
      this.checkVisible(classification)
      this.setState(
        {
          lobesController,
        },
        () => {
          this.isAllCheck(classification)
          this.checkVisible(classification)
        }
      )
    } else if (classification === 1 && this.state.tubularController && this.state.tubularController.tubularChecked) {
      const tubularController = this.state.tubularController
      tubularController.tubularChecked[idx] = !tubularController.tubularChecked[idx]
      this.setState(
        {
          tubularController,
        },
        () => {
          this.isAllCheck(classification)
          this.checkVisible(classification)
        }
      )
    }
  }
  onHandleThreedCheckClick(e) {
    e.stopPropagation()
  }
  isAllCheck(classification) {
    if (classification === 0) {
      let allChecked = true
      const lobesController = this.state.lobesController
      lobesController.lobesChecked.forEach((item, index) => {
        if (!item) {
          allChecked = false
        }
      })
      this.setState({
        lobesAllChecked: allChecked,
      })
    } else if (classification === 1) {
      let allChecked = true
      const tubularController = this.state.tubularController
      tubularController.tubularChecked.forEach((item, index) => {
        if (!item) {
          allChecked = false
        }
      })
      this.setState({
        tubularAllChecked: allChecked,
      })
    } else if (classification === 2) {
      let allChecked = true
      const boxes = this.state.boxes
      boxes.forEach((item, index) => {
        if (!item.checked) {
          allChecked = false
        }
      })
      this.setState({
        nodulesAllChecked: allChecked,
      })
    }
  }
  checkVisible(classification) {
    if (classification === 0) {
      let notAllVisible = true
      let notAllVisibleCount = 0
      let allVisible = true
      let allVisibleCount = 0

      const lobesController = this.state.lobesController
      lobesController.lobesVisible.forEach((item, index) => {
        if (lobesController.lobesChecked[index]) {
          if (item) {
            notAllVisible = false
            allVisibleCount += 1
          } else {
            allVisible = false
            notAllVisibleCount += 1
          }
        }
      })
      if (notAllVisible && notAllVisibleCount > 0) {
        this.setState({
          lobesAllVisible: false,
        })
      }
      if (allVisible && allVisibleCount > 0) {
        this.setState({
          lobesAllVisible: true,
        })
      }
    } else if (classification === 1) {
      let notAllVisible = true
      let notAllVisibleCount = 0
      let allVisible = true
      let allVisibleCount = 0
      const tubularController = this.state.tubularController
      tubularController.tubularVisible.forEach((item, index) => {
        if (tubularController.tubularChecked[index]) {
          if (item) {
            notAllVisible = false
            allVisibleCount += 1
          } else {
            allVisible = false
            notAllVisibleCount += 1
          }
        }
      })
      if (notAllVisible && notAllVisibleCount > 0) {
        this.setState({
          tubularAllVisible: false,
        })
      }
      if (allVisible && allVisibleCount > 0) {
        this.setState({
          tubularAllVisible: true,
        })
      }
    } else if (classification === 2) {
    }
  }
  onSetThreedAllVisible(classification, visibile) {
    if (classification === 0) {
      const lobesAllVisible = visibile
      const lobesData = this.state.lobesData
      const lobesController = this.state.lobesController
      lobesController.lobesVisible.forEach((item, index) => {
        if (lobesController.lobesChecked[index]) {
          lobesController.lobesVisible[index] = lobesAllVisible
          if (lobesController.lobesVisible[index]) {
            this.setSegmentOpacity(lobesData[index].index, lobesController.lobesOpacities[index] / 100)
          } else {
            this.setSegmentOpacity(lobesData[index].index, 0)
          }
        }
      })
      this.setState({
        lobesAllVisible,
        lobesController,
      })
    } else if (classification === 1) {
      const tubularAllVisible = visibile
      const tubularData = this.state.tubularData
      const tubularController = this.state.tubularController
      tubularController.tubularVisible.forEach((item, index) => {
        if (tubularController.tubularChecked[index]) {
          tubularController.tubularVisible[index] = tubularAllVisible
          if (tubularController.tubularVisible[index]) {
            this.setSegmentOpacity(tubularData[index].index, tubularController.tubularOpacities[index] / 100)
          } else {
            this.setSegmentOpacity(tubularData[index].index, 0)
          }
        }
      })
      this.setState({
        tubularAllVisible,
        tubularController,
      })
    }
  }
  onHandleOrderNodule(type) {
    const nodulesOrder = this.state.nodulesOrder
    const keys = Object.keys(nodulesOrder)
    if (nodulesOrder[type] === 0) {
      keys.forEach((item) => {
        nodulesOrder[item] = 0
      })
      nodulesOrder[type] = 1
    } else {
      if (type === 'slice_idx' || type === 'diameter') {
        nodulesOrder[type] = -nodulesOrder[type]
      } else {
        nodulesOrder[type] = 1
      }
    }
    this.setState(
      {
        nodulesOrder,
      },
      () => {
        this.sortBoxes()
      }
    )
  }
  onHandleOrderDirectionNodule(type, e) {
    e.stopPropagation()
    const nodulesOrder = this.state.nodulesOrder
    const keys = Object.keys(nodulesOrder)
    if (nodulesOrder[type] === 0) {
      keys.forEach((item) => {
        nodulesOrder[item] = 0
      })
      nodulesOrder[type] = 1
    } else {
      if (type === 'slice_idx' || type === 'diameter') {
        nodulesOrder[type] = -nodulesOrder[type]
      }
    }
    this.setState(
      {
        nodulesOrder,
      },
      () => {
        this.sortBoxes()
      }
    )
  }
  sortBoxes() {
    const boxes = this.state.boxes
    const nodulesOrder = this.state.nodulesOrder
    const keys = Object.keys(nodulesOrder)
    keys.forEach((item) => {
      if (nodulesOrder[item] !== 0) {
        const newBoxes = _.sortBy(
          boxes,
          function (o) {
            return nodulesOrder[item] * o[item]
          },
          function (o) {
            return nodulesOrder[item] * o.visibleIdx
          }
        )
        // boxes.sort(this.arrayPropSort(item, nodulesOrder[item]))
        this.setState({
          boxes: newBoxes,
        })
      }
    })
  }
  onHandleSelectNoduleCheck(key, opIdx) {
    const nodulesSelect = this.state.nodulesSelect
    const nodulesSelectIndex = _.findIndex(nodulesSelect, { key: key })
    if (nodulesSelect !== -1) {
      nodulesSelect[nodulesSelectIndex].checked[opIdx] = !nodulesSelect[nodulesSelectIndex].checked[opIdx]
    }
    this.setState(
      {
        nodulesSelect,
      },
      () => {
        this.isSelectAllCheck()
      }
    )
  }
  onHandleSelectAllNodules() {
    const nodulesAllSelected = !this.state.nodulesAllSelected
    const nodulesSelect = this.state.nodulesSelect
    nodulesSelect.forEach((item, index) => {
      item.checked.forEach((chItem, chIndex) => {
        item.checked[chIndex] = nodulesAllSelected
      })
    })
    this.setState({
      nodulesAllSelected,
      nodulesSelect,
    })
  }
  onHandleSelectNoduleComplete() {
    const boxes = this.state.boxes
    console.log('onHandleSelectNoduleComplete', boxes)
    const selectedPro = []
    const selectedDiam = []
    const selectedMal = []
    const nodulesSelect = this.state.nodulesSelect
    nodulesSelect.forEach((item, index) => {
      const nodulesSelectChecked = item.checked
      if (item.key === 0) {
        nodulesSelectChecked.forEach((chItem, chIndex) => {
          if (chItem) {
            switch (chIndex) {
              case 0:
                selectedPro.push({
                  key: 'texture',
                  val: 2,
                })
                break
              case 1:
                selectedPro.push({
                  key: 'texture',
                  val: 3,
                })
                break
              case 2:
                selectedPro.push({
                  key: 'texture',
                  val: 1,
                })
                break
              case 3:
                selectedPro.push({
                  key: 'spiculation',
                  val: 2,
                })
                break
              case 4:
                selectedPro.push({
                  key: 'lobulation',
                  val: 2,
                })
                break
              case 5:
                selectedPro.push({
                  key: 'calcification',
                  val: 2,
                })
                break
              case 6:
                selectedPro.push({
                  key: 'pin',
                  val: 2,
                })
                break
              case 7:
                selectedPro.push({
                  key: 'cav',
                  val: 2,
                })

                break
              case 8:
                selectedPro.push({
                  key: 'vss',
                  val: 2,
                })

                break
              case 9:
                selectedPro.push({
                  key: 'bea',
                  val: 2,
                })

                break
              case 10:
                selectedPro.push({
                  key: 'bro',
                  val: 2,
                })
                break
              case 11:
                selectedPro.push({
                  key: 'texture',
                  val: -1,
                })
              default:
                break
            }
          }
        })
      } else if (item.key === 1) {
        nodulesSelectChecked.forEach((chItem, chIndex) => {
          if (chItem) {
            switch (chIndex) {
              case 0:
                selectedDiam.push({
                  min: 0,
                  max: 0.3,
                })
                break
              case 1:
                selectedDiam.push({
                  min: 0.3,
                  max: 0.5,
                })
                break
              case 2:
                selectedDiam.push({
                  min: 0.5,
                  max: 1,
                })
                break
              case 3:
                selectedDiam.push({
                  min: 1,
                  max: 1.3,
                })
                break
              case 4:
                selectedDiam.push({
                  min: 1.3,
                  max: 3,
                })
                break
              case 5:
                selectedDiam.push({
                  min: 3,
                  max: Infinity,
                })
                break
              default:
                break
            }
          }
        })
      } else if (item.key === 2) {
        nodulesSelectChecked.forEach((chItem, chIndex) => {
          if (chItem) {
            switch (chIndex) {
              case 0:
                selectedMal.push({
                  key: 'malignancy',
                  val: 3,
                })
                break
              case 1:
                selectedMal.push({
                  key: 'malignancy',
                  val: 2,
                })
                break
              case 2:
                selectedMal.push({
                  key: 'malignancy',
                  val: 1,
                })
                break
              case 3:
                selectedMal.push({
                  key: 'malignancy',
                  val: -1,
                })
                break
              default:
                break
            }
          }
        })
      }
    })
    boxes.forEach((boItem, boIndex) => {
      let boProSelected = false
      let boDiamSelected = false
      let boMalSelected = false

      if (selectedPro.length) {
        selectedPro.forEach((proItem, proIndex) => {
          if (boItem[proItem.key] === proItem.val) {
            boProSelected = true
          }
        })
      } else {
        boProSelected = true
      }

      if (selectedDiam.length) {
        selectedDiam.forEach((diaItem, diaIndex) => {
          if (boItem.diameter / 10 <= diaItem.max && boItem.diameter / 10 >= diaItem.min) {
            boDiamSelected = true
          }
        })
      } else {
        boDiamSelected = true
      }

      if (selectedMal.length) {
        selectedMal.forEach((proItem, proIndex) => {
          if (boItem[proItem.key] === proItem.val) {
            boMalSelected = true
          }
        })
      } else {
        boMalSelected = true
      }

      if (boProSelected && boDiamSelected && boMalSelected) {
        boxes[boIndex].visible = true
      } else {
        boxes[boIndex].visible = false
      }
    })
    this.setState({
      boxes,
    })
  }
  isSelectAllCheck() {
    let allChecked = true
    const nodulesSelect = this.state.nodulesSelect
    nodulesSelect.forEach((item, index) => {
      const checked = item.checked
      checked.forEach((chItem, chIndex) => {
        if (!chItem) {
          allChecked = false
        }
      })
    })
    this.setState({
      nodulesAllSelected: allChecked,
    })
  }
  onSetPreviewActive(idx) {
    const previewVisible = this.state.previewVisible
    previewVisible[idx] = !previewVisible[idx]
    this.setState({
      previewVisible,
    })
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

  template() {
    const boxes = this.state.boxes
    if (!(boxes && boxes.length)) {
      return
    }

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
    const segments = noduleSegments
    const boxes = this.state.boxes
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
    const boxes = this.state.boxes
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
        const theList = []
        const previewVisible = []
        let count = 0
        let total = 0
        let nowDate
        let nowCaseId = this.state.caseId

        const dates = Object.keys(subList)
        dates.sort((a, b) => a - b)
        dates.forEach((key, idx) => {
          total += subList[key].length
          theList[idx] = []
          previewVisible[idx] = true
        })
        // const params={caseId:this.state.caseId}
        dates.forEach((key, idx) => {
          const seriesLst = subList[key]
          seriesLst.forEach((serie) => {
            if (serie.caseId === nowCaseId) {
              nowDate = key
            }
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
              count += 1
              theList[idx].push({
                date: key,
                caseId: serie.caseId,
                Description: serie.description,
                href: '/case/' + serie.caseId.replace('#', '%23') + '/' + annotype.data,
                image: dicom.data[parseInt(dicom.data.length / 3)],
                validInfo: dataValidRes.data,
              })
              if (count === total) {
                console.log('theList', theList)
                let preCaseId = theList[0][0].caseId
                let preDate = theList[0][0].date
                this.props.dispatch(dropCaseId(nowCaseId, nowDate, 0))
                this.props.dispatch(dropCaseId(preCaseId, preDate, 1))
                this.setState({
                  dateSeries: theList,
                  previewVisible,
                })
              }

              // resolve(theList)
            })
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

  loadDisplay(currentIdx) {
    // first let's check the status to display the proper contents.
    // const pathname = window.location.pathname
    // send our token to the server, combined with the current pathname
    // let noduleNo = -1
    // if (this.props.location.hash !== '') noduleNo = parseInt(this.props.location.hash.split('#').slice(-1)[0])

    const token = localStorage.getItem('token')
    const headers = {
      Authorization: 'Bearer '.concat(token), //add the fun of check
    }
    const imageIds = this.state.imageIds
    if (this.state.modelName === 'origin') {
      loadAndCacheImagePlus(imageIds[currentIdx], 1).then((image) => {
        // const readonly = readonlyResponse.data.readonly === 'true'
        // console.log('parse',dicomParser.parseDicom(image))
        const dicomTag = image.data
        const boxes = []
        const draftStatus = -1
        this.refreshImage(true, imageIds[currentIdx], undefined)
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
          loadAndCacheImagePlus(imageIds[currentIdx], 1).then((image) => {
            // console.log('image info', image.data)
            const dicomTag = image.data

            let draftStatus = -1
            draftStatus = readonlyResponse.data.status
            let boxes = this.state.nodules
            // for (var i = 0; i < boxes.length; i++) {
            //   boxes[i].nodule_no = '' + i
            //   boxes[i].rect_no = 'a00' + i
            // }
            // console.log('boxes after', boxes)
            this.refreshImage(true, imageIds[currentIdx], undefined)

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

            var stateListLength = boxes.length
            var measureArr = new Array(stateListLength).fill(false)

            var maskArr = new Array(stateListLength).fill(true)
            this.setState(
              {
                dicomTag,
                boxes,
                draftStatus,
                readonly,
                measureStateList: measureArr,
                maskStateList: maskArr,
                imageCaching: true,
              },
              () => {
                this.reportImageTopCalc()
                this.template()
              }
            )
          })
        })
    }
  }

  updateReport(prevProps, prevState) {
    // if (
    //   prevState.doubleClick !== this.state.doubleClick ||
    //   prevState.listsActiveIndex !== this.state.listsActiveIndex ||
    //   prevState.reportImageType !== this.state.reportImageType ||
    //   prevState.reportGuideType !== this.state.reportGuideType
    // ) {
    //   const activeItem = this.state.doubleClick === true ? 'all' : this.state.listsActiveIndex
    //   this.template(this.state.reportImageType, activeItem, this.state.reportGuideType)
    // }
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
        this.setState(
          {
            age: data.age,
            date: data.date,
            // nodules: data.nodules === undefined ? [] : data.nodules,
            patientBirth: data.patientBirth,
            patientId: data.patientID,
            patientSex: data.patientSex === 'M' ? '男' : '女',
          },
          () => {}
        )
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
  onHandleFirstTabChange(activeKey) {
    if (activeKey === '1') {
      const sliderMarks = this.state.noduleMarks
      this.setState({
        sliderMarks,
      })
      this.toPulmonary()
    } else if (activeKey === '2') {
      const sliderMarks = this.state.lymphMarks
      this.setState({
        sliderMarks,
      })
      this.toMedia()
    }
  }
  async componentDidMount() {
    if (document.getElementById('footer')) {
      document.getElementById('footer').style.display = 'none'
    }
    if (document.getElementById('header')) {
      document.getElementById('header').style.display = 'none'
    }
    if (document.getElementById('main')) {
      document.getElementById('main').setAttribute('style', 'height:100%;padding-bottom:0px')
    }
    console.log('componentDidMount', this.state.caseId)
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
            this.setState({
              realname: loginResponse.data.realname,
            })
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
    window.addEventListener('mousedown', this.mousedownFunc.bind(this))
    // this.getNoduleIfos()

    if (localStorage.getItem('token') == null) {
      sessionStorage.setItem(
        'location',
        window.location.pathname.split('/')[0] + '/' + window.location.pathname.split('/')[1] + '/' + window.location.pathname.split('/')[2] + '/' + window.location.pathname.split('/')[3]
      )
      // window.location.href = '/'
    }

    const token = localStorage.getItem('token')
    const headers = {
      Authorization: 'Bearer '.concat(token),
    }

    let noduleNo = -1
    if (this.props.location.hash !== '') {
      noduleNo = parseInt(this.props.location.hash.split('#').slice(-1)[0])
    }

    const caseDataIndex = _.findIndex(this.props.caseData, {
      caseId: this.state.caseId,
    })
    let imageIds
    let nodules
    if (caseDataIndex === -1) {
      imageIds = await this.props.getImageIdsByCaseId(this.config.data.getDataListForCaseId, this.state.caseId)
      nodules = await this.props.getNodulesByCaseId(this.config.draft.getRectsForCaseIdAndUsername, this.state.caseId, this.state.modelName)
    } else {
      imageIds = this.props.caseData[caseDataIndex].imageIds
      nodules = this.props.caseData[caseDataIndex].nodules
    }
    let currentIdx = 0
    let listsActiveIndex = -1
    let noduleMarks = {}
    if (nodules && nodules.length) {
      //sort and save previous index
      nodules.forEach((item, index) => {
        item.prevIdx = parseInt(item.nodule_no)
        item.delOpen = false
        item.visible = true
        item.checked = false
        noduleMarks[item.slice_idx] = ''
      })

      nodules.sort(this.arrayPropSort('slice_idx', 1))
      nodules.forEach((item, index) => {
        item.visibleIdx = index
      })
      console.log('createNoduleMask', nodules)
      console.log('slider', noduleMarks)
      //if this page is directed by nodule searching
      if (noduleNo !== -1) {
        nodules.forEach((item, index) => {
          if (item.prevIdx === noduleNo) {
            currentIdx = item.slice_idx
            listsActiveIndex = index
          }
        })
      }
    }
    this.setState({
      imageIds,
      nodules,
      noduleMarks,
      sliderMarks: noduleMarks,
      currentIdx,
      listsActiveIndex,
    })
    loadAndCacheImagePlus(imageIds[currentIdx], 1)
    executeTask()
    this.loadDisplay(currentIdx)
    const boxes = nodules
    console.log('boxes', boxes)
    const annoImageIds = []

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
      return loadAndCacheImagePlus(annoImageId, 2)
    })
    Promise.all(annoPromises).then((value) => {
      console.log('promise', value)
    })

    this.loadStudyBrowser()
    this.loadReport()
    this.resizeScreen()

    axios
      .post(
        this.config.draft.getLymphs,
        qs.stringify({
          caseId: this.state.caseId,
          username: 'deepln',
        })
      )
      .then((res) => {
        console.log('lymph request', res)
        const data = res.data

        if (data && data.length) {
          const lymphMarks = {}
          data.forEach((item, index) => {
            const itemLymph = item.lymph
            item.slice_idx = itemLymph.slice_idx
            item.volume = Math.abs(itemLymph.x1 - itemLymph.x2) * Math.abs(itemLymph.y1 - itemLymph.y2) * Math.pow(10, -4)
            lymphMarks[item.slice_idx] = ''
          })
          data.sort(this.arrayPropSort('slice_idx', 1))
          data.forEach((item, index) => {
            item.name = `淋巴结${index + 1}`
            item.visibleIdx = index
          })
          this.setState({
            lymphMarks,
          })
          this.saveLymphData(data)
        }
      })

    const promises = imageIds.map((imageId) => {
      // console.log(imageId)
      return loadAndCacheImagePlus(imageId, 3)
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
        console.log('getMhaListForCaseId reponse', res)
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

        if (urlData && urlData.length) {
          let count = 0
          urlData.sort((a, b) => a - b)
          urlData.forEach((urlItem, urlIndex) => {
            const originType = urlItem.split('/')[4]
            let type
            let order = 0
            if (originType === 'lobe') {
              order = Math.round(urlItem.split('_')[2].split('.')[0])
              type = originType + order
            } else if (originType === 'nodule') {
              order = Math.round(urlItem.split('_')[3].split('.')[0])
              type = originType
            } else {
              type = originType
            }
            if (originType !== 'lung') {
              urls.push({
                url: urlItem,
                order,
                index: count,
                class: dictList[type].class,
                name: dictList[type].name,
                color: dictList[type].color,
              })
              count += 1
            }
          })
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
        } else {
          this.setState({
            noThreedData: true,
          })
        }
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
            const lobeIndex = _.findIndex(this.state.urls, {
              order: item.name,
            })
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

    // const element = this.element
    // element.removeEventListener('cornerstoneimagerendered', this.onImageRendered)
    // element.removeEventListener('cornerstonenewimage', this.onNewImage)

    // window.removeEventListener("resize", this.onWindowResize)
    document.removeEventListener('keydown', this.onKeydown)
    window.removeEventListener('resize', this.resizeScreen.bind(this))
    window.removeEventListener('mousedown', this.mousedownFunc.bind(this))
    // cornerstone.disable(element)
    if (document.getElementById('main')) {
      document.getElementById('main').setAttribute('style', '')
    }
    if (document.getElementById('footer')) {
      document.getElementById('footer').style.display = ''
    }
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
    if (this.state.listsActiveIndex !== -1 && prevState.listsActiveIndex !== this.state.listsActiveIndex) {
      if (this.state.boxes && this.state.boxes.length) {
        const bins = this.state.boxes[this.state.listsActiveIndex].nodule_hist.bins

        this.setState({ HUSliderRange: [bins[0], bins[bins.length - 1]] }, () => {
          this.plotHistogram(this.state.listsActiveIndex)
        })
        console.log('didUpdateHUSliderRange', this.state.HUSliderRange)
      }
    }
    if (prevState.chartType !== this.state.chartType || prevState.HUSliderRange !== this.state.HUSliderRange) {
      if (this.state.listsActiveIndex !== -1) {
        this.plotHistogram(this.state.listsActiveIndex)
      }
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
          reRenderTarget += reRenderFraction
          this.state.vtkImageData.modified()
        }
        if (numberProcessed === imageIds.length) {
          this.state.vtkImageData.modified()
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
    HttpDataAccessHelper.fetchBinary(cur_url.replace('#', '%23'), {
      progressCallback,
    }).then((binary) => {
      let opacity = 1.0
      let actor
      if (cl === 0) {
        opacity = 0.1
      } else if (cl === 1) {
        opacity = 0.2
      } else if (cl === 4) {
        opacity = 0.2
      } else {
        opacity = 1.0
      }
      actor = this.createPipeline(binary, color, opacity, cl)
      const tmp_segments = [].concat(this.state.segments)
      tmp_segments[idx] = actor
      const listLoading = this.state.listLoading
      this.downloadSegmentTimer = setTimeout(() => {
        listLoading[idx] = false
      }, 2500)
      this.setState(
        {
          segments: tmp_segments,
        },
        () => {
          if (this.viewer3D) {
            this.viewer3D.setNeedReset()
          }
        }
      )
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
  saveLymphData(lymphData) {
    console.log('lymphData', lymphData)
    this.setState({
      lymphs: lymphData,
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
    const lobesOpacities = new Array(lobesData.length).fill(10)
    const lobesActive = new Array(lobesData.length).fill(false)
    const lobesVisible = new Array(lobesData.length).fill(true)
    const lobesOpacityChangeable = new Array(lobesData.length).fill(false)
    const lobesChecked = new Array(lobesData.length).fill(false)
    const lobesController = {
      lobesOpacities,
      lobesActive,
      lobesVisible,
      lobesOpacityChangeable,
      lobesChecked,
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
    const tubularOpacities = new Array(tubularData.length).fill(20)
    const tubularActive = new Array(tubularData.length).fill(false)
    const tubularVisible = new Array(tubularData.length).fill(true)
    const tubularOpacityChangeable = new Array(tubularData.length).fill(false)
    const tubularChecked = new Array(tubularData.length).fill(false)

    const tubularController = {
      tubularOpacities,
      tubularActive,
      tubularVisible,
      tubularOpacityChangeable,
      tubularChecked,
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
        borderRight: '2px solid #d1d1d1e0',
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
        borderRight: '2px solid #d1d1d1e0',
        borderTop: '2px solid #d1d1d1e0',
      },
      bottomRight: {
        position: 'absolute',
        top: viewerHeight / 2,
        left: viewerWidth / 2,
        width: viewerWidth / 2,
        height: viewerHeight / 2,
        borderTop: '2px solid #d1d1d1e0',
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
        borderRight: '2px solid #d1d1d1e0',
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
        borderRight: '2px solid #d1d1d1e0',
        borderTop: '2px solid #d1d1d1e0',
      },
      bottomRight: {
        position: 'absolute',
        top: viewerHeight * 0.4,
        left: viewerWidth * 0.5,
        width: viewerWidth * 0.5,
        height: viewerHeight * 0.4,
        borderTop: '2px solid #d1d1d1e0',
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
        borderTop: '2px solid #d1d1d1e0',
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

  updateLabelDataByThreshold() {
    const threshold = this.state.labelThreshold
    const dimensions = this.state.dimensions
    const labelData = this.state.labelData
    const range = labelData.range
    const minX = range.minX - 15
    const maxX = range.maxX + 15
    const minY = range.minY - 15
    const maxY = range.maxY + 15

    const z = labelData.z
    const xLength = labelData.xLength
    const scalarsDataOfImageData = this.state.vtkImageData.getPointData().getScalars().getData()
    const indices = []
    // for (let y = minY; y < maxY; y++) {
    //   for (let x = minX; x < maxX; x++) {
    //     const index = x + y * dimensions[0] + (z - 1) * dimensions[0] * dimensions[1]
    //     if (scalarsDataOfImageData[index] > threshold - 1024) {
    //       indices.push(index)
    //     }
    //   }
    // }
    for (let y = minY; y < maxY; y++) {
      for (let x = minX; x < maxX; x++) {
        const index = x + y * dimensions[0] + (z - 1) * dimensions[0] * dimensions[1]
        if (scalarsDataOfImageData[index] > threshold - 1024) {
          if (x >= range.minX && x < range.maxX && y >= range.minY && y < range.maxY) {
            indices.push(x - minX + (y - minY) * xLength)
          }
        }
      }
    }
    const labelMapInputData = labelData.labelMap
    const scalarsData = labelMapInputData.getPointData().getScalars().getData()
    scalarsData.forEach((item, index) => {
      scalarsData[index] = 0
    })
    indices.forEach((item) => {
      scalarsData[item] = 1
    })

    labelMapInputData.modified()
    labelData.labelMap = labelMapInputData
    console.log('update label', labelData.indices.length, indices.length)
    labelData.indices = indices
    this.setState({
      labelData,
      maskLabelMap: labelMapInputData,
    })
  }
  updateLabelDataByColor() {
    const labelColor = this.state.labelColor
    if (this.viewerMask) {
      this.viewerMask.setSegmentRGB(1, labelColor)
    }
  }
  changeRadius(e) {
    const radius = e
    this.setState({
      paintRadius: radius,
    })
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
  changePaintRadius(radius) {
    if (this.viewerMask) {
      this.viewerMask.setPaintFilterRadius(radius)
    }
  }
  changeThreshold(e) {
    const threshold = e
    this.setState({
      labelThreshold: threshold,
    })
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
  setActive(classification, index, urlIndex, e) {
    // if(e.target.nodeName !== 'INPUT')
    e.stopPropagation()
    if (classification === 0) {
      const lobesController = this.state.lobesController
      lobesController.lobesActive[index] = !lobesController.lobesActive[index]
      this.setState({
        lobesController,
      })
    } else if (classification === 1) {
      const tubularController = this.state.tubularController
      tubularController.tubularActive[index] = !tubularController.tubularActive[index]
      this.setState({
        tubularController,
      })
    } else if (classification === 2) {
      const nodulesController = this.state.nodulesController
      nodulesController.nodulesActive[index] = !nodulesController.nodulesActive[index]
      this.setState({
        nodulesController,
      })
    }
  }
  setVisible(classification, index, urlIndex, e) {
    e.stopPropagation()
    if (classification === 0) {
      const lobesController = this.state.lobesController
      lobesController.lobesVisible[index] = !lobesController.lobesVisible[index]
      if (lobesController.lobesVisible[index]) {
        this.setSegmentOpacity(urlIndex, lobesController.lobesOpacities[index] / 100)
      } else {
        this.setSegmentOpacity(urlIndex, 0)
      }
      this.setState(
        {
          lobesController,
        },
        () => {
          this.checkVisible(classification)
        }
      )
    } else if (classification === 1) {
      const tubularController = this.state.tubularController
      tubularController.tubularVisible[index] = !tubularController.tubularVisible[index]
      if (tubularController.tubularVisible[index]) {
        this.setSegmentOpacity(urlIndex, tubularController.tubularOpacities[index] / 100)
      } else {
        this.setSegmentOpacity(urlIndex, 0)
      }

      this.setState(
        {
          tubularController,
        },
        () => {
          this.checkVisible(classification)
        }
      )
    } else if (classification === 2) {
      const nodulesController = this.state.nodulesController
      nodulesController.nodulesVisible[index] = !nodulesController.nodulesVisible[index]
      if (nodulesController.nodulesVisible[index]) {
        this.setSegmentOpacity(urlIndex, nodulesController.nodulesOpacities[index] / 100)
      } else {
        this.setSegmentOpacity(urlIndex, 0)
      }

      this.setState(
        {
          nodulesController,
        },
        () => {
          this.checkVisible(classification)
        }
      )
    }
  }
  setOpacityChangeable(classification, index, e) {
    e.stopPropagation()
    if (classification === 0) {
      const lobesController = this.state.lobesController
      lobesController.lobesOpacityChangeable[index] = !lobesController.lobesOpacityChangeable[index]
      this.setState({
        lobesController,
      })
    } else if (classification === 1) {
      const tubularController = this.state.tubularController
      tubularController.tubularOpacityChangeable[index] = !tubularController.tubularOpacityChangeable[index]
      this.setState({
        tubularController,
      })
    } else if (classification === 2) {
      const nodulesController = this.state.nodulesController
      nodulesController.nodulesOpacityChangeable[index] = !nodulesController.nodulesOpacityChangeable[index]
      this.setState({
        nodulesController,
      })
    }
  }
  changeOpacity(classification, index, urlIndex, value) {
    const opacity = value
    if (classification === 0) {
      const lobesController = this.state.lobesController
      lobesController.lobesOpacities[index] = opacity
      this.setSegmentOpacity(urlIndex, opacity / 100)

      this.setState({
        lobesController,
      })
    } else if (classification === 1) {
      const tubularController = this.state.tubularController
      tubularController.tubularOpacities[index] = opacity
      this.setSegmentOpacity(urlIndex, opacity / 100)

      this.setState({
        tubularController,
      })
    } else if (classification === 2) {
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
  setRegistering() {
    this.setState((prevState) => ({
      registering: !prevState.registering,
    }))
    if (this.followUpComponent) {
      this.followUpComponent.setRegistering()
    }
  }
  setMPR() {
    if (this.state.MPR) {
      this.setState({
        MPR: false,
      })
      this.changeMode(1)
    } else {
      this.setState({
        MPR: true,
      })
      this.changeMode(2)
    }
  }
  setCPR() {
    if (this.state.CPR) {
      this.setState({
        CPR: false,
      })
      this.changeMode(2)
    } else {
      this.setState({
        CPR: true,
      })
      this.changeMode(3)
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
    this.toggleTool(displayCrosshairs)
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
    if (this.viewerMask) {
      this.viewerMask.setPaintFilterLabel(1)
    }
  }
  doErase() {
    this.setState({
      erasing: true,
    })
    if (this.viewerMask) {
      this.viewerMask.setPaintFilterLabel(0)
    }
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
        this.toggleTool(false)
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
    console.log('createNoduleMask')
    const labelDataArray = this.state.labelDataArray
    let labelData = labelDataArray[idx]
    let worldPos

    if (!labelData) {
      const segmentIndex = _.findIndex(this.state.urls, {
        class: 2,
        order: parseInt(this.state.nodules[idx].nodule_no) + 1,
      })
      if (segmentIndex === -1) {
        message.error('没有分割结果')
        return
      }
      const segment = this.state.segments[segmentIndex]
      const bounds = segment.getBounds()
      const firstPicked = [bounds[0], bounds[2], bounds[4]]
      const lastPicked = [bounds[1], bounds[3], bounds[5]]
      const origin = [Math.round((firstPicked[0] + lastPicked[0]) / 2), Math.round((firstPicked[1] + lastPicked[1]) / 2), Math.round((firstPicked[2] + lastPicked[2]) / 2)]
      worldPos = origin

      const xLength = Math.round(Math.abs(bounds[1] - bounds[0])) + 40
      const yLength = Math.round(Math.abs(bounds[3] - bounds[2])) + 40
      const newImageData = vtkImageData.newInstance()

      const firstOriginIndex = this.transform3DPickedToOriginIndex(firstPicked)
      const lastOriginIndex = this.transform3DPickedToOriginIndex(lastPicked)
      let minX = Math.round(Math.min(firstOriginIndex[0], lastOriginIndex[0])) - 20
      let maxX = Math.round(Math.max(firstOriginIndex[0], lastOriginIndex[0])) + 20
      let minY = Math.round(Math.min(firstOriginIndex[1], lastOriginIndex[1])) - 20
      let maxY = Math.round(Math.max(firstOriginIndex[1], lastOriginIndex[1])) + 20

      const range = {
        minX: minX + 15,
        maxX: maxX - 15,
        minY: minY + 15,
        maxY: maxY - 15,
      }

      const z = Math.round((firstOriginIndex[2] + lastOriginIndex[2]) / 2)

      const newPixelArray = new Float32Array(xLength * yLength * 5).fill(-1024)
      const dimensions = this.state.dimensions
      const scalarsData = this.state.vtkImageData.getPointData().getScalars().getData()
      const indices = []

      for (let y = minY; y < maxY; y++) {
        for (let x = minX; x < maxX; x++) {
          newPixelArray[x - minX + (y - minY) * xLength] = scalarsData[x + y * dimensions[0] + (z - 1) * dimensions[0] * dimensions[1]]
          if (newPixelArray[x - minX + (y - minY) * xLength] > this.state.labelThreshold - 1024) {
            if (x >= range.minX && x < range.maxX && y >= range.minY && y < range.maxY) {
              indices.push(x - minX + (y - minY) * xLength)
            }
          }
        }
      }
      const newScalarArray = vtkDataArray.newInstance({
        name: 'Pixels',
        values: newPixelArray,
      })
      newImageData.setDimensions(xLength, yLength, 5)
      // newImageData.setSpacing(spacing)
      // newImageData.setOrigin(origin)
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

      const labelMapPixelArray = new Float32Array(xLength * yLength * 5).fill(-1024)
      indices.forEach((item) => {
        labelMapPixelArray[item] = 1
      })
      // Create VTK Image Data with buffer as input
      const labelMap = vtkImageData.newInstance()

      labelMap.getPointData().setScalars(
        vtkDataArray.newInstance({
          numberOfComponents: 1, // labelmap with single component
          values: labelMapPixelArray,
        })
      )
      labelMap.setDimensions(xLength, yLength, 5)
      labelMap.setSpacing(...newImageData.getSpacing())
      labelMap.setOrigin(...newImageData.getOrigin())
      labelMap.setDirection(...newImageData.getDirection())
      labelData = {
        idx,
        indices,
        origin,
        range,
        z,
        imageData: newImageData,
        labelMap,
        volumes: actor,
        xLength: xLength,
        yLength: yLength,
      }

      labelDataArray[idx] = labelData
      this.setState({
        maskImageData: newImageData,
        maskLabelMap: labelMap,
        maskVolumes: [actor],
        maskYLength: yLength,
        labelDataArray,
        labelData,
      })
    } else {
      worldPos = labelData.origin
      this.setState({
        maskImageData: labelData.imageData,
        maskLabelMap: labelData.labelMap,
        maskVolumes: [labelData.volumes],
        maskYLength: labelData.yLength,
        labelData,
      })
    }

    // if (!labelData) {
    //   const segment = this.state.segments[idx]
    //   const bounds = segment.getBounds()
    //   console.log('nowtime bounds', bounds)
    //   const firstPicked = [bounds[0], bounds[2], bounds[4]]
    //   const lastPicked = [bounds[1], bounds[3], bounds[5]]

    //   const firstOriginIndex = this.transform3DPickedToOriginIndex(firstPicked)
    //   const lastOriginIndex = this.transform3DPickedToOriginIndex(lastPicked)
    //   labelData = this.createLabelData(firstOriginIndex, lastOriginIndex)

    //   // const firstOrigin = this.transform3DPickedToOrigin(firstPicked);
    //   // const lastOrigin = this.transform3DPickedToOrigin(lastPicked);
    //   const origin = [Math.round((firstPicked[0] + lastPicked[0]) / 2), Math.round((firstPicked[1] + lastPicked[1]) / 2), Math.round((firstPicked[2] + lastPicked[2]) / 2)]
    //   console.log('nowtime origin', origin)
    //   labelData.origin = origin
    //   labelDataArray[idx] = labelData
    // }

    // const indices = labelData.indices
    // const labelMapInputData = this.state.labelMapInputData
    // const scalarsData = labelMapInputData.getPointData().getScalars().getData()

    // indices.forEach((item) => {
    //   scalarsData[item] = 1
    // })

    // labelMapInputData.modified()

    const apis = this.apis
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
    if (apis && apis[0].svgWidgets && apis[0].svgWidgets.rotatableCrosshairsWidget) {
      apis[0].svgWidgets.rotatableCrosshairsWidget.moveCrosshairs(origin, apis, 0)
      const renderWindow = apis[0].genericRenderWindow.getRenderWindow()
      const istyle = renderWindow.getInteractor().getInteractorStyle()
      istyle.modified()
    }
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
      if (!points.length) {
        message.error('没有选中')
      }
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
      message.error('没有中心线坐标')
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
      curCaseId: state.dataCenter.curCaseId,
      preCaseId: state.dataCenter.preCaseId,
      followUpActiveTool: state.dataCenter.followUpActiveTool,
      followUpLoadingCompleted: state.dataCenter.followUpLoadingCompleted,
      followUpIsPlaying: state.dataCenter.isPlaying,
    }
  },
  (dispatch) => {
    return {
      getImageIdsByCaseId: (url, caseId) => dispatch(getImageIdsByCaseId(url, caseId)),
      getNodulesByCaseId: (url, caseId, username) => dispatch(getNodulesByCaseId(url, caseId, username)),
      setFollowUpPlaying: (isPlaying) => dispatch(setFollowUpPlaying(isPlaying)),
      dispatch,
    }
  }
)(CornerstoneElement)
