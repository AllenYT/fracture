import React, { Component } from 'react'
// import {CineDialog} from 'react-viewerbase'
// import { WrappedStudyBrowser } from '../components/wrappedStudyBrowser'
import ReactHtmlParser from 'react-html-parser'
import dicomParser from 'dicom-parser'
// import DndProcider from 'react-dnd'
// import {HTML5Backend} from 'react-dnd-html5-backend'
// import { DragDropContextProvider } from 'react-dnd'
// import { HTML5Backend } from 'react-dnd-html5-backend'
import cornerstone from 'cornerstone-core'
import cornerstoneTools from 'cornerstone-tools'
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader'
import { withRouter } from 'react-router-dom'
import { Icon, Button, Accordion, Modal, Dropdown, Menu, Label, Header, Popup, Table, Sidebar, Loader, Divider, Form, Card } from 'semantic-ui-react'
import { CloseCircleOutlined, CheckCircleOutlined, ConsoleSqlOutlined, SyncOutlined } from '@ant-design/icons'
import qs from 'qs'
import axios from 'axios'
import { Slider, Select, Checkbox, Tabs, InputNumber, Popconfirm, message, Cascader, Radio, Row, Col, Form as AntdForm, Input } from 'antd'
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
import CornerstoneViewport from 'react-cornerstone-viewport'

import { faChevronLeft, faChevronRight, faChevronDown, faChevronUp, faCaretDown, faFilter, faSortAmountDownAlt, faSortUp, faSortDown, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons'
import { connect } from 'react-redux'
import { getConfigJson, getImageIdsByCaseId, getNodulesByCaseId, dropCaseId, setFollowUpPlaying, setFollowUpActiveTool } from '../actions'
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
import LoadingComponent from './LoadingComponent'

import { frenet } from '../lib/frenet'
import { loadAndCacheImagePlus } from '../lib/cornerstoneImageRequest'
import { executeTask } from '../lib/taskHelper'
import { createSub } from '../vtk/lib/createSub.js'

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

import '../initCornerstone.js'

cornerstoneWADOImageLoader.external.cornerstone = cornerstone
window.cornerstoneTools = cornerstoneTools

const { TabPane } = Tabs
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
const texName = {
  '-1': '未知',
  1: '磨玻璃',
  2: '实性',
  3: '半实性',
}
const magName = {
  '-1': '未知',
  1: '低危',
  2: '中危',
  3: '中危',
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
const boxDrawingColor = 'rgb(0,0,0)'
const lymphProtoType = {
  lymph: {
    nodule_no: '',
    rect_no: '',
    slice_idx: 0,
    probability: 0,
    y1: 0,
    x1: 0,
    y2: 0,
    x2: 0,
  },
  documentId: 'deepln#1.3.12.2.1107.5.1.4.73473.30000017100600124127900084258#0@lymph',
  type: 'lymph',
  status: 1,
  slice_idx: 0,
  volume: 0,
  name: '淋巴结1',
  uuid: '44beb47c-b328-416d-920a-3953bf93840f',
}
const lymphDrawingColor = 'rgb(0, 255, 255)'

class CornerstoneElement extends Component {
  constructor(props) {
    super(props)
    this.state = {
      // displayPanel
      caseId: window.location.pathname.split('/case/')[1].split('/')[0].replace('%23', '#'),
      username: localStorage.getItem('username'),
      modelName: window.location.pathname.split('/')[3],
      realname: localStorage.realname ? localStorage.realname : '',
      patientId: null,

      firstTabActiveIndex: 1,

      //cornerstoneElement
      imageIds: [],
      cornerImageIdIndex: 0,
      cornerImage: null,
      cornerIsPlaying: false,
      cornerFrameRate: 30,
      cornerActiveTool: 'StackScroll',
      cornerIsOverlayVisible: true,
      cornerAnnoVisible: true,
      cornerElement: null,
      cornerViewport: {
        scale: 2,
        invert: false,
        pixelReplication: false,
        voi: {
          windowWidth: 1600,
          windowCenter: -600,
        },
        translation: {
          x: 0,
          y: 0,
        },
      },
      studyListShowed: false,
      showFollowUp: false,
      show3DVisualization: false,
      showMPR: false,
      showCPR: false,

      sliderMarks: {},
      boxes: [],
      drawingNodulesCompleted: false,

      needReloadBoxes: false,
      needRedrawBoxes: false,
      noduleMarks: {},
      listsActiveIndex: -1, //右方list活动item

      lymphs: [],
      drawingLymphsCompleted: false,
      lymphMarks: {},
      lymphsActiveIndex: -1,

      immersive: false,
      readonly: true,
      clearUserOpen: false,
      draftStatus: {},
      okayForReview: false,
      pdfContent: null,
      pdfFormValues: {},
      invisiblePdfContent: null,

      pdfReading: false,
      pdfLoadingCompleted: false,

      toolState: '',
      windowWidth: document.body.clientWidth,
      windowHeight: document.body.clientHeight,
      histogramHeight: 0,
      verticalMode: document.body.clientWidth < document.body.clientHeight ? true : false,
      slideSpan: 0,
      imageCaching: false,

      //studybrowserList
      dateSeries: [],
      previewVisible: [],
      dataValidContnt: [],

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

      /*新加变量 */
      nodules: [],
      nodulesAllChecked: false,
      nodulesOrder: {
        slice_idx: 1,
        long_length: 0,
        texture: 0,
        malignancy: 0,
      },
      noduleOrderOption: [
        {
          desc: '层面数',
          key: 'slice_idx',
          sortable: true,
        },
        {
          desc: '长径大小',
          key: 'long_length',
          sortable: true,
        },
        {
          desc: '结节类型',
          key: 'texture',
          sortable: true,
        },
        {
          desc: '良恶性',
          key: 'malignancy',
          sortable: true,
        },
      ],
      nodulesSelect: [
        {
          key: 0,
          options: ['实性', '半实性', '磨玻璃', '毛刺征', '分叶征', '钙化征', '胸膜凹陷征', '空洞征', '血管集束征', '空泡征', '支气管充气征', '未知'],
          checked: new Array(12).fill(true),
        },
        {
          key: 1,
          desc: '长径大小',
          options: ['<=0.3cm', '0.3cm-0.5cm', '0.5cm-1cm', '1cm-1.3cm', '1.3cm-3cm', '>=3cm'],
          checked: new Array(6).fill(true),
        },
        {
          key: 2,
          desc: '良恶性',
          options: ['高危', '中危', '低危', '未知'],
          checked: new Array(4).fill(true),
        },
      ],
      nodulesAllSelected: true,
      ctImagePadding: 0,
      menuButtonsWidth: 1540,
      menuScrollable: false,
      menuTransform: 0,
      renderLoading: false,
      registering: false,

      /*显示变量*/
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
      crosshairsTool: false,
      editing: false,
      painting: false,
      erasing: false,

      /*加载变量*/
      volumesLoading: true,
      percent: [],
      noThreedData: false,
      listLoading: [],
      HUSliderRange: [-100, 100],
      chartType: 'line',
    }
    this.config = JSON.parse(localStorage.getItem('config'))
    this.subs = {
      cornerImageRendered: createSub(),
      cornerMouseUp: createSub(),
      cornerMeasureAdd: createSub(),
      cornerMeasureModify: createSub(),
      cornerMeasureComplete: createSub(),
      cornerMeasureRemove: createSub(),
    }
    this.nextPath = this.nextPath.bind(this)
    this.plotHistogram = this.plotHistogram.bind(this)

    this.onKeydown = this.onKeydown.bind(this)
    this.featureAnalysis = this.featureAnalysis.bind(this)
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
    this.resizeScreen()
    window.addEventListener('resize', this.resizeScreen.bind(this))
    window.addEventListener('mousedown', this.mousedownFunc.bind(this))
    window.addEventListener('keydown', this.onKeydown.bind(this))
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
    if (window.location.hash !== '') {
      noduleNo = parseInt(window.location.hash.split('#').slice(-1)[0])
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

    let cornerImageIdIndex = 0
    let listsActiveIndex = -1
    let noduleMarks = {}
    if (nodules && nodules.length) {
      //sort and save previous index
      nodules.forEach((item, index) => {
        item.prevIdx = parseInt(item.nodule_no)
        item.delOpen = false
        item.visible = true
        item.recVisible = true
        item.biVisible = true
        item.checked = false
        noduleMarks[item.slice_idx] = ''
      })

      nodules.sort(this.arrayPropSort('slice_idx', 1))
      nodules.forEach((item, index) => {
        item.visibleIdx = index
      })
      console.log('nodules', nodules)
      console.log('noduleMarks', noduleMarks)
      //if this page is directed by nodule searching
      if (noduleNo !== -1) {
        nodules.forEach((item, index) => {
          if (item.prevIdx === noduleNo) {
            cornerImageIdIndex = item.slice_idx
            listsActiveIndex = index
          }
        })
      }
    }
    this.setState(
      {
        imageIds,
        nodules,
        boxes: nodules,
        noduleMarks,
        sliderMarks: noduleMarks,
        cornerImageIdIndex,
        listsActiveIndex,
      },
      () => {
        this.template()
      }
    )
    loadAndCacheImagePlus(imageIds[cornerImageIdIndex], 1).then((image) => {
      const imageData = image.data
      const patientId = imageData.string('x00100020')
      this.setState({
        patientId,
      })
    })
    executeTask()
    this.loadDisplay()
    let annoImageIds = []
    let annoRoundImageIds = []
    nodules.forEach((boxItem, boxIndex) => {
      let nowSliceIndex = boxItem.slice_idx
      annoImageIds.push(imageIds[nowSliceIndex])
      for (let j = nowSliceIndex - 5; j < nowSliceIndex + 5; j++) {
        if (_.inRange(j, 0, imageIds.length)) {
          annoRoundImageIds.push(imageIds[j])
        }
      }
    })
    annoImageIds = _.uniq(annoImageIds)
    const annoPromises = annoImageIds.map((annoImageId) => {
      return loadAndCacheImagePlus(annoImageId, 2)
    })
    Promise.all(annoPromises).then((value) => {
      console.log('annoPromises', value.length)
    })
    annoRoundImageIds = _.uniq(annoRoundImageIds)
    const annoRoundPromises = annoRoundImageIds.map((annoRoundImageId) => {
      return loadAndCacheImagePlus(annoRoundImageId, 3)
    })
    Promise.all(annoRoundPromises).then((value) => {
      console.log('annoRoundPromises', value.length)
    })

    // this.loadStudyBrowser()
    this.loadReport()

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
            item.recVisible = true
          })
          this.setState({
            lymphMarks,
          })
          this.saveLymphData(data)
        }
      })

    const allPromises = imageIds.map((imageId) => {
      // console.log(imageId)
      return loadAndCacheImagePlus(imageId, 3)
    })
    await Promise.all(allPromises).then((value) => {
      console.log('allPromises', value.length)
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

    // window.removeEventListener("resize", this.onWindowResize)

    // cornerstone.disable(element)
    if (document.getElementById('main')) {
      document.getElementById('main').setAttribute('style', '')
    }
    if (document.getElementById('footer')) {
      document.getElementById('footer').style.display = ''
    }

    Object.keys(this.subs).forEach((k) => {
      this.subs[k].unsubscribe()
    })

    document.removeEventListener('keydown', this.onKeydown.bind(this))
    window.removeEventListener('resize', this.resizeScreen.bind(this))
    window.removeEventListener('mousedown', this.mousedownFunc.bind(this))
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.immersive !== this.state.immersive) {
    }
    if (!prevState.patientId && this.state.patientId) {
      this.loadStudyBrowser()
    }
    // if (!prevState.cornerViewport !== this.state.cornerViewport) {
    //   const { cornerElement, cornerViewport } = this.state
    //   if (cornerElement && !this.state.show3DVisualization && !this.state.showFollowUp) {
    //     const viewport = cornerstone.getViewport(cornerElement)
    //     const newViewport = Object.assign({}, viewport, cornerViewport)

    //     cornerstone.setViewport(cornerElement, newViewport)
    //   }
    // }

    // nodules active index modified
    if (this.state.listsActiveIndex !== -1 && prevState.listsActiveIndex !== this.state.listsActiveIndex) {
      if (!this.state.show3DVisualization && this.state.boxes && this.state.boxes.length) {
        const { boxes, listsActiveIndex } = this.state
        this.setState(
          {
            cornerImageIdIndex: boxes[listsActiveIndex].slice_idx,
          },
          () => {
            cornerstone.loadAndCacheImage(this.state.imageIds[boxes[listsActiveIndex].slice_idx]).then((image) => {
              this.redrawCorner()
            })
          }
        )

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
    if (prevState.pdfFormValues !== this.state.pdfFormValues) {
      if (this.state.boxes && this.state.boxes.length) {
        this.updateForm()
      }
    }

    // lymphs active index modified
    if (this.state.lymphsActiveIndex !== -1 && prevState.lymphsActiveIndex !== this.state.lymphsActiveIndex) {
      if (!this.state.show3DVisualization && this.state.lymphs && this.state.lymphs.length) {
        const { lymphs, lymphsActiveIndex } = this.state
        this.setState(
          {
            cornerImageIdIndex: lymphs[lymphsActiveIndex].slice_idx,
          },
          () => {
            cornerstone.loadAndCacheImage(this.state.imageIds[lymphs[lymphsActiveIndex].slice_idx]).then((image) => {
              this.redrawCorner()
            })
          }
        )
      }
    }
    // boxes modified
    if (!prevState.needReloadBoxes && this.state.needReloadBoxes) {
      if (this.state.boxes && this.state.boxes.length) {
        this.template()
        this.setState({
          needReloadBoxes: false,
        })
      }
    }
    if (!prevState.needRedrawBoxes && this.state.needRedrawBoxes) {
      if (this.state.boxes && this.state.boxes.length) {
        this.redrawCorner()
        this.setState({
          needRedrawBoxes: false,
        })
      }
    }
  }
  redrawCorner() {
    console.log('redrawCorner')
    this.redrawForToolName('RectangleRoi')
    this.redrawForToolName('Bidirectional')
  }
  redrawForToolName(toolName) {
    const { boxes, listsActiveIndex, lymphs, lymphsActiveIndex, cornerElement } = this.state
    let toolData = cornerstoneTools.getToolState(cornerElement, toolName)
    if (toolData && toolData.data && toolData.data.length) {
      let toolDataIndex = -1
      if (listsActiveIndex !== -1) {
        toolDataIndex = _.findIndex(toolData.data, {
          uuid: boxes[listsActiveIndex].uuid,
        })
      }
      const savedData = [].concat(toolData.data)
      cornerstoneTools.clearToolState(cornerElement, toolName)
      savedData.forEach((savedDataItem, savedDataItemIndex) => {
        let boxIndex = -1
        let lymphIndex = -1
        switch (toolName) {
          case 'RectangleRoi':
            boxIndex = _.findIndex(boxes, { uuid: savedDataItem.uuid })
            lymphIndex = _.findIndex(lymphs, { uuid: savedDataItem.uuid })
            break
          case 'Bidirectional':
            boxIndex = _.findIndex(boxes, { biuuid: savedDataItem.uuid })
            break
          default:
            break
        }
        if (boxIndex !== -1) {
          switch (toolName) {
            case 'RectangleRoi':
              savedDataItem.visible = boxes[boxIndex].recVisible
              break
            case 'Bidirectional':
              savedDataItem.visible = boxes[boxIndex].biVisible
              break
            default:
              break
          }
          savedDataItem.active = toolDataIndex === savedDataItemIndex
          cornerstoneTools.addToolState(cornerElement, toolName, savedDataItem)
        }
        if (lymphIndex !== -1) {
          switch (toolName) {
            case 'RectangleRoi':
              savedDataItem.visible = lymphs[lymphIndex].recVisible
              break
            case 'Bidirectional':
              break
            default:
              break
          }
          savedDataItem.color = lymphDrawingColor
          savedDataItem.active = toolDataIndex === savedDataItemIndex
          cornerstoneTools.addToolState(cornerElement, toolName, savedDataItem)
        }
      })
    }
  }
  loadDisplay() {
    // first let's check the status to display the proper contents.
    // send our token to the server, combined with the current pathname
    const token = localStorage.getItem('token')
    const headers = {
      Authorization: 'Bearer '.concat(token), //add the fun of check
    }
    if (this.state.modelName === 'origin') {
      const draftStatus = -1
      this.setState({
        draftStatus,
      })
    } else {
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
          console.log('load display response', readonlyResponse)
          // const readonly = false
          let draftStatus = -1
          draftStatus = readonlyResponse.data.status
          this.setState(
            {
              draftStatus,
              readonly,
              imageCaching: true,
            },
            () => {}
          )
        })
    }
  }
  loadStudyBrowser() {
    const token = localStorage.getItem('token')
    const params = {
      mainItem: this.state.patientId,
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
            // nodules: data.nodules === undefined ? [] : data.nodules,
          },
          () => {}
        )
      })
      .catch((error) => console.log(error))
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
  }

  //resize
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
    if (document.getElementById('corner-top-row')) {
      const cornerTopRow = document.getElementById('corner-top-row')
      const cornerTopRowHeight = cornerTopRow.clientHeight
      const cornerBottomRowHeight = document.body.clientHeight - cornerTopRowHeight - 5
      this.setState(
        {
          bottomRowHeight: cornerBottomRowHeight,
        },
        () => {
          this.reportImageTopCalc()
          if (this.state.show3DVisualization) {
            if (document.getElementById('segment-container')) {
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
            if (document.getElementById('ct-image-block')) {
              const ctImageBlock = document.getElementById('ct-image-block')
              const ctImageBlockHeight = ctImageBlock.clientHeight
              const cornerViewport = {
                ...this.state.cornerViewport,
                scale: ctImageBlockHeight / 512,
              }
              this.setState({
                cornerViewport,
              })
            }
          }
        }
      )
    }
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

  //menu
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
              ctImagePadding: studyListShowed ? 150 : 0,
            },
            () => {
              this.resizeScreen()
            }
          )
        }, 500)
      }
    )
  }

  onZoomIn() {
    const { showFollowUp, cornerViewport } = this.state
    if (showFollowUp && this.followUpComponent) {
      this.followUpComponent.ZoomIn()
      return
    }
    cornerViewport.scale *= 1.1
    this.setState({
      cornerViewport,
    })
  }
  onZoomOut() {
    const { showFollowUp, cornerViewport } = this.state
    if (showFollowUp && this.followUpComponent) {
      this.followUpComponent.ZoomOut()
      return
    }
    cornerViewport.scale *= 0.9
    this.setState({
      cornerViewport,
    })
  }
  onResetView() {
    const { showFollowUp, cornerViewport } = this.state
    if (showFollowUp && this.followUpComponent) {
      this.followUpComponent.reset()
      return
    }
    if (document.getElementById('ct-image-block')) {
      const ctImageBlock = document.getElementById('ct-image-block')
      const ctImageBlockHeight = ctImageBlock.clientHeight
      console.log('onResetView', ctImageBlockHeight, ctImageBlockHeight / 512)
      cornerViewport.scale = ctImageBlockHeight / 512
      this.setState({
        cornerViewport,
      })
    }
  }

  onSetWwwcFlip() {
    const { showFollowUp, cornerViewport } = this.state
    if (showFollowUp && this.followUpComponent) {
      this.followUpComponent.imagesFlip()
      return
    }
    cornerViewport.invert = !cornerViewport.invert
    this.setState({
      cornerViewport,
    })
  }
  onSetWwwcToPulmonary() {
    const { showFollowUp, cornerViewport } = this.state
    if (showFollowUp && this.followUpComponent) {
      this.followUpComponent.toPulmonary()
      return
    }
    const voi = {
      windowWidth: 1600,
      windowCenter: -600,
    }
    cornerViewport.voi = voi
    this.setState({
      cornerViewport,
    })
  }
  onSetWwwcToBone() {
    const { showFollowUp, cornerViewport } = this.state
    if (showFollowUp && this.followUpComponent) {
      this.followUpComponent.toBoneWindow()
      return
    }
    const voi = {
      windowWidth: 1000,
      windowCenter: 300,
    }
    cornerViewport.voi = voi
    this.setState({
      cornerViewport,
    })
  }
  onSetWwwcToVentral() {
    const { showFollowUp, cornerViewport } = this.state
    if (showFollowUp && this.followUpComponent) {
      this.followUpComponent.toVentralWindow()
      return
    }
    const voi = {
      windowWidth: 400,
      windowCenter: 40,
    }
    cornerViewport.voi = voi
    this.setState({
      cornerViewport,
    })
  }
  onSetWwwcToMedia() {
    const { showFollowUp, cornerViewport } = this.state
    if (showFollowUp && this.followUpComponent) {
      this.followUpComponent.toMedia()
      return
    }
    const voi = {
      windowWidth: 500,
      windowCenter: 50,
    }
    cornerViewport.voi = voi
    this.setState({
      cornerViewport,
    })
  }
  onSetAnimationPlaying(playing) {
    const { showFollowUp } = this.state
    if (showFollowUp) {
      this.props.setFollowUpPlaying(playing)
      return
    }
    this.setState({
      cornerIsPlaying: playing,
    })
  }
  onSetAnnoVisible(visible) {
    const { boxes } = this.state
    boxes.forEach((boxItem, boxIndex) => {
      boxItem.recVisible = visible
      boxItem.biVisible = visible
    })
    this.setState({
      boxes,
      needRedrawBoxes: true,
      cornerAnnoVisible: visible,
    })
  }
  onSetOverlayVisible(visible) {
    this.setState({
      cornerIsOverlayVisible: visible,
    })
  }
  onSetCornerActiveTool(tool) {
    const { showFollowUp } = this.state
    if (showFollowUp) {
      this.props.setFollowUpActiveTool(tool)
      return
    }
    this.setState({
      cornerActiveTool: tool,
    })
  }
  onSetToolForWwwc() {
    this.setState({
      cornerActiveTool: 'Wwwc',
    })
  }
  onSetToolForStackScroll() {
    this.setState({
      cornerActiveTool: 'StackScroll',
    })
  }
  onSetToolForRectangleRoi() {
    this.setState({
      cornerActiveTool: 'RectangleRoi',
    })
  }
  onSetToolForBidirectional() {
    this.setState({
      cornerActiveTool: 'Bidirectional',
    })
  }
  onSetToolForLength() {
    this.setState({
      cornerActiveTool: 'Length',
    })
  }
  onSetToolForEraser() {
    this.setState({
      cornerActiveTool: 'Eraser',
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
        console.log('updateRects response', res)
        if (res.data.status === 'ok') {
          message.success('已保存当前结果')
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
      delete backendNodules[currentIdx].uuid
      delete backendNodules[currentIdx].biuuid
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

  showFollowUp() {
    this.onSetStudyList(true)
    this.onSetAnimationPlaying(false)
    this.setState({
      showFollowUp: true,
    })
  }
  hideFollowUp() {
    if (this.props.followUpLoadingCompleted) {
      this.hideFollowUpOp()
    } else {
      const hide = message.loading('正在加载图像，稍后关闭随访', 0)
      const newCloseFollowUpInterval = setInterval(() => {
        if (this.props.followUpLoadingCompleted) {
          hide()
          this.hideFollowUpOp()
          clearInterval(newCloseFollowUpInterval)
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

  /* info */

  // infoOptions
  onHandleNoduleAllCheckChange() {
    const boxes = this.state.boxes
    const nodulesAllChecked = !this.state.nodulesAllChecked
    boxes.forEach((item, index) => {
      item.checked = nodulesAllChecked
    })
    this.setState({
      boxes,
      nodulesAllChecked,
      needReloadBoxes: true,
    })
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
        needReloadBoxes: true,
      },
      () => {
        this.isAllCheck(2)
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
      if (type === 'slice_idx' || type === 'long_length' || type === 'texture' || type === 'malignancy') {
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
      if (type === 'slice_idx' || type === 'long_length' || type === 'texture' || type === 'malignancy') {
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
            if (item === 'malignancy') {
              return nodulesOrder[item] * -o[item]
            } else if (item === 'long_length') {
              let ll = 0
              if (o.measure) {
                ll = Math.sqrt(Math.pow(o.measure.x1 - o.measure.x2, 2) + Math.pow(o.measure.y1 - o.measure.y2, 2))
              }
              return nodulesOrder[item] * ll
            } else {
              return nodulesOrder[item] * o[item]
            }
          },
          function (o) {
            return nodulesOrder[item] * o.visibleIdx
          }
        )
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
    const selectedPro = []
    const selectedLong = []
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
                selectedLong.push({
                  min: 0,
                  max: 3,
                })
                break
              case 1:
                selectedLong.push({
                  min: 3,
                  max: 5,
                })
                break
              case 2:
                selectedLong.push({
                  min: 5,
                  max: 10,
                })
                break
              case 3:
                selectedLong.push({
                  min: 10,
                  max: 13,
                })
                break
              case 4:
                selectedLong.push({
                  min: 13,
                  max: 30,
                })
                break
              case 5:
                selectedLong.push({
                  min: 30,
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
    boxes.forEach((boxItem, boIndex) => {
      let boProSelected = false
      let boDiamSelected = false
      let boMalSelected = false

      if (selectedPro.length) {
        selectedPro.forEach((proItem, proIndex) => {
          if (boxItem[proItem.key] === proItem.val) {
            boProSelected = true
          }
        })
      } else {
        boProSelected = true
      }

      if (selectedLong.length) {
        let boxItemLL = 0
        if (boxItem.measure) {
          boxItemLL = Math.sqrt(Math.pow(boxItem.measure.x1 - boxItem.measure.x2, 2) + Math.pow(boxItem.measure.y1 - boxItem.measure.y2, 2))
        }
        selectedLong.forEach((longItem, diaIndex) => {
          if (boxItemLL <= longItem.max && boxItemLL >= longItem.min) {
            boDiamSelected = true
          }
        })
      } else {
        boDiamSelected = true
      }

      if (selectedMal.length) {
        selectedMal.forEach((proItem, proIndex) => {
          if (boxItem[proItem.key] === proItem.val) {
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
      needReloadBoxes: true,
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

  // infoContents
  handleListClick(index) {
    console.log('dropdown', this.state.listsActiveIndex, index)
    const { boxes, listsActiveIndex } = this.state
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
    if (boxes && boxes.length) {
      this.setState({
        listsActiveIndex: newIndex,
      })
    } else {
      this.setState({
        listsActiveIndex: -1,
      })
    }
  }
  onSelectMal(index, value) {
    const boxes = this.state.boxes
    boxes[index].malignancy = parseInt(value)
    this.setState({
      boxes: boxes,
      needReloadBoxes: true,
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
      boxes: boxes,
      needReloadBoxes: true,
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
      needReloadBoxes: true,
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
    })
  }

  onSetNoduleMeasureVisible(idx, visible) {
    const { boxes } = this.state
    boxes[idx].biVisible = visible
    boxes[idx].recVisible = visible
    if (visible) {
      this.setState(
        {
          boxes,
          needRedrawBoxes: true,
        },
        () => {
          this.drawNodules()
          this.drawLymphs()
        }
      )
    } else {
      this.setState({
        boxes,
        needRedrawBoxes: true,
      })
    }
  }
  clearNoduleMeasure(idx) {
    const { boxes } = this.state
    boxes[idx].measure = {}
    delete boxes[idx].biuuid
    this.setState({
      boxes,
      needRedrawBoxes: true,
    })
    message.success('成功擦除测量')
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

  setDelNodule(idx, open) {
    const boxes = this.state.boxes
    boxes[idx].delOpen = open
    this.setState({
      boxes,
    })
  }
  onConfirmDelNodule(idx) {
    const { boxes, listsActiveIndex, cornerElement } = this.state
    boxes.forEach((boxItem) => {
      boxItem.delOpen = false
    })

    boxes.splice(idx, 1)
    let currentActiveIdx

    if (listsActiveIndex === boxes.length) {
      currentActiveIdx = boxes.length - 1
    } else {
      currentActiveIdx = listsActiveIndex
    }

    this.setState({
      boxes,
      needReloadBoxes: true,
      needRedrawBoxes: true,
      listsActiveIndex: currentActiveIdx,
    })
    if (currentActiveIdx !== -1) {
      //still nodule
      this.setState({
        cornerImageIdIndex: boxes[currentActiveIdx].slice_idx,
      })
    } else {
      //no nodule
      cornerstoneTools.clearToolState(cornerElement, 'RectangleRoi')
    }
    message.success('结节删除成功')
  }

  handleLymphClick(index) {
    const { lymphs, lymphsActiveIndex } = this.state

    const newIndex = lymphsActiveIndex === index ? -1 : index
    if (lymphs && lymphs.length) {
      this.setState({
        lymphsActiveIndex: newIndex,
        // cornerImageIdIndex: currentIdx,
      })
    } else {
      this.setState({
        lymphsActiveIndex: -1,
      })
    }
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

  handleRangeChange(e) {
    // this.setState({currentIdx: event.target.value - 1, imageId:
    // this.state.imageIds[event.target.value - 1]})
    // let style = $("<style>", {type:"text/css"}).appendTo("head");
    // style.text('#slice-slider::-webkit-slider-runnable-track{background:linear-gradient(90deg,#0033FF 0%,#000033 '+ (event.target.value -1)*100/this.state.imageIds.length+'%)}');
  }
  handleRangeAfterChange(e) {}

  // template

  template() {
    const boxes = this.state.boxes
    if (!(boxes && boxes.length)) {
      return
    }

    const reportImageType = this.state.reportImageType
    const reportGuideType = this.state.reportGuideType
    let reportImageText = ''
    boxes.forEach((item, index) => {
      if (item.checked && item.visible) {
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
          this.setState({
            reportGuideText: '12个月内继续年度低剂量胸部CT筛查',
          })
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
          this.setState({
            reportGuideText: '根据临床判断，考虑每年进行CT监测',
          })
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

  exportPDF() {
    const element = document.getElementById('invisiblePDF')
    const eleHeight = element.clientHeight
    const opt = {
      // margin: [1, 1, 1, 1],
      filename: 'minireport.pdf',
      // pagebreak: { after: ['.invisiblePDF-nodule-corner-item'] },
      image: { type: 'jpeg', quality: 1 }, // 导出的图片质量和格式
      html2canvas: {
        scale: 1,
        useCORS: true,
        width: 1100,
        height: eleHeight + 10,
      }, // useCORS很重要，解决文档中图片跨域问题
      jsPDF: {
        unit: 'mm',
        format: [1100, eleHeight + 10],
        orientation: 'portrait',
        precision: 25,
      },
      //
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
  setPdfReading(pdfReading) {
    this.setState({
      pdfReading,
    })
  }
  showImages(e) {
    e.stopPropagation()
    const boxes = this.state.boxes
    const imageIds = this.state.imageIds
    const pdfFormValues = _.assign(
      {
        patientId: '',
        name: '',
        diagDoctor: '',
        instanceId: '',
        sex: '',
        auditDoctor: '',
        studyDate: '',
        age: '',
        reportDate: '',
      },
      this.state.pdfFormValues
    )
    const pdfContent = (
      <>
        <AntdForm labelAlign="right" className="pdf-form" initialValues={pdfFormValues} onValuesChange={this.onPdfFormValuesChange.bind(this)}>
          <Row>
            <Col span={8} className="pdf-form-col">
              <AntdForm.Item name={`patientId`} label={<div className="pdf-form-label">病例号</div>} rules={[{}]}>
                <Input className="pdf-form-input" placeholder="请输入病例号" />
              </AntdForm.Item>
              <AntdForm.Item name={`name`} label={<div className="pdf-form-label">姓名</div>} rules={[{}]}>
                <Input className="pdf-form-input" placeholder="请输入姓名" />
              </AntdForm.Item>
              <AntdForm.Item name={`diagDoctor`} label={<div className="pdf-form-label">诊断医师</div>} rules={[{}]}>
                <Input className="pdf-form-input" placeholder="请输入诊断医师" />
              </AntdForm.Item>
            </Col>
            <Col span={8} className="pdf-form-col">
              <AntdForm.Item name={`instanceId`} label={<div className="pdf-form-label">检查号</div>} rules={[{}]}>
                <Input className="pdf-form-input" placeholder="请输入检查号" />
              </AntdForm.Item>
              <AntdForm.Item name={`sex`} label={<div className="pdf-form-label">性别</div>} rules={[{}]}>
                <Input className="pdf-form-input" placeholder="请输入性别" />
              </AntdForm.Item>
              <AntdForm.Item name={`auditDoctor`} label={<div className="pdf-form-label">审核医师</div>} rules={[{}]}>
                <Input className="pdf-form-input" placeholder="请输入审核医师" />
              </AntdForm.Item>
            </Col>
            <Col span={8} className="pdf-form-col">
              <AntdForm.Item name={`studyDate`} label={<div className="pdf-form-label">检查日期</div>} rules={[{}]}>
                <Input className="pdf-form-input" placeholder="请输入检查日期" />
              </AntdForm.Item>
              <AntdForm.Item name={`age`} label={<div className="pdf-form-label">年龄</div>} rules={[{}]}>
                <Input className="pdf-form-input" placeholder="请输入年龄" />
              </AntdForm.Item>
              <AntdForm.Item name={`reportDate`} label={<div className="pdf-form-label">报告日期</div>} rules={[{}]}>
                <Input className="pdf-form-input" placeholder="请输入报告日期" />
              </AntdForm.Item>
            </Col>
          </Row>
        </AntdForm>
        <Divider />
        {/* <div className="corner-report-modal-title">扫描参数</div>
        <Table celled>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>检查日期</Table.HeaderCell>
              <Table.HeaderCell>像素大小(毫米)</Table.HeaderCell>
              <Table.HeaderCell>厚度 / 间距(毫米)</Table.HeaderCell>
              <Table.HeaderCell>kV</Table.HeaderCell>
              <Table.HeaderCell>mA</Table.HeaderCell>
              <Table.HeaderCell>mAs</Table.HeaderCell>
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
        </Table> */}
        {boxes && boxes.length
          ? boxes.map((nodule, index) => {
              let nodule_id = 'nodule-' + nodule.nodule_no + '-' + nodule.slice_idx
              let visualId = 'visual' + index
              // console.log('visualId',visualId)
              const pdfNodulePosition = nodule.place === 0 ? nodulePlaces[nodule.place] : noduleSegments[nodule.segment]
              const pdfNoduleRepresents = []
              if (nodule.lobulation === 2) {
                pdfNoduleRepresents.push('分叶')
              }
              if (nodule.spiculation === 2) {
                pdfNoduleRepresents.push('毛刺')
              }
              if (nodule.calcification === 2) {
                pdfNoduleRepresents.push('钙化')
              }
              if (nodule.pin === 2) {
                pdfNoduleRepresents.push('胸膜凹陷')
              }
              if (nodule.cav === 2) {
                pdfNoduleRepresents.push('空洞')
              }
              if (nodule.vss === 2) {
                pdfNoduleRepresents.push('血管集束')
              }
              if (nodule.bea === 2) {
                pdfNoduleRepresents.push('空泡')
              }
              if (nodule.bro === 2) {
                pdfNoduleRepresents.push('支气管充气')
              }
              let pdfNoduleRepresentText = ''
              pdfNoduleRepresents.forEach((representItem, representIndex) => {
                if (representIndex !== 0) {
                  pdfNoduleRepresentText += '/' + representItem
                } else {
                  pdfNoduleRepresentText += representItem
                }
              })
              if (!pdfNoduleRepresentText) {
                pdfNoduleRepresentText = '无'
              }
              if (nodule.visible && nodule.checked) {
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
                          <Table.Cell>结节位置</Table.Cell>
                          <Table.Cell>{pdfNodulePosition}</Table.Cell>
                        </Table.Row>
                        <Table.Row>
                          <Table.Cell>危险程度</Table.Cell>
                          <Table.Cell>{magName[nodule.malignancy]}</Table.Cell>
                        </Table.Row>
                        <Table.Row>
                          <Table.Cell>性质</Table.Cell>
                          <Table.Cell>{texName[nodule.texture]}</Table.Cell>
                        </Table.Row>
                        <Table.Row>
                          <Table.Cell>表征</Table.Cell>
                          <Table.Cell>{pdfNoduleRepresentText}</Table.Cell>
                        </Table.Row>
                        <Table.Row>
                          <Table.Cell>直径</Table.Cell>
                          <Table.Cell>{`${(nodule.diameter / 10).toFixed(2)}cm`}</Table.Cell>
                        </Table.Row>
                        <Table.Row>
                          <Table.Cell>体积</Table.Cell>
                          <Table.Cell>{nodule['volume'] === undefined ? null : `${(nodule.volume * 1e3).toFixed(2)}mm³`}</Table.Cell>
                        </Table.Row>
                        <Table.Row>
                          <Table.Cell>HU(均值/最大值/最小值)</Table.Cell>
                          <Table.Cell>{nodule['huMean'] === undefined ? null : Math.round(nodule['huMean']) + ' / ' + nodule['huMax'] + ' / ' + nodule['huMin']}</Table.Cell>
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
                      </Table.Body>
                    </Table>
                  </div>
                )
              } else {
                return null
              }
            })
          : null}
      </>
    )

    this.setState(
      {
        pdfContent,
        pdfFormValues,
      },
      () => {
        boxes.map((nodule, index) => {
          // console.log('nodules1',nodule)
          if (!nodule.visible || !nodule.checked) {
            return
          }
          const nodule_id1 = 'nodule-' + nodule.nodule_no + '-' + nodule.slice_idx
          const element1 = document.getElementById(nodule_id1)
          let imageId = imageIds[nodule.slice_idx]
          cornerstone.enable(element1)
          cornerstone.loadAndCacheImage(imageId).then((image) => {
            // console.log('cache')
            var viewport = cornerstone.getDefaultViewportForImage(element1, image)
            viewport.voi.windowWidth = 1600
            viewport.voi.windowCenter = -600
            viewport.scale = 2
            // console.log('nodules2',nodule)
            const xCenter = nodule.x1 + (nodule.x2 - nodule.x1) / 2
            const yCenter = nodule.y1 + (nodule.y2 - nodule.y1) / 2
            viewport.translation.x = 250 - xCenter
            viewport.translation.y = 250 - yCenter
            // console.log('viewport',viewport)
            cornerstone.setViewport(element1, viewport)
            cornerstone.displayImage(element1, image)
          })
        })
      }
    )
  }
  updateForm() {
    const boxes = this.state.boxes
    const imageIds = this.state.imageIds
    const pdfFormValues = this.state.pdfFormValues
    const reportImageText = this.state.reportImageText
    const pdfReading = this.state.pdfReading
    const visibleNodules = boxes.map((item, index) => {
      const pdfNodulePosition = item.place === 0 ? nodulePlaces[item.place] : noduleSegments[item.segment]
      const pdfNoduleRepresents = []
      if (item.lobulation === 2) {
        pdfNoduleRepresents.push('分叶')
      }
      if (item.spiculation === 2) {
        pdfNoduleRepresents.push('毛刺')
      }
      if (item.calcification === 2) {
        pdfNoduleRepresents.push('钙化')
      }
      if (item.pin === 2) {
        pdfNoduleRepresents.push('胸膜凹陷')
      }
      if (item.cav === 2) {
        pdfNoduleRepresents.push('空洞')
      }
      if (item.vss === 2) {
        pdfNoduleRepresents.push('血管集束')
      }
      if (item.bea === 2) {
        pdfNoduleRepresents.push('空泡')
      }
      if (item.bro === 2) {
        pdfNoduleRepresents.push('支气管充气')
      }
      let pdfNoduleRepresentText = ''
      pdfNoduleRepresents.forEach((representItem, representIndex) => {
        if (representIndex !== 0) {
          pdfNoduleRepresentText += '/' + representItem
        } else {
          pdfNoduleRepresentText += representItem
        }
      })
      if (!pdfNoduleRepresentText) {
        pdfNoduleRepresentText = '无'
      }
      if (item.visible && item.checked) {
        return (
          <div className="invisiblePDF-nodule-corner-item" key={index}>
            <div id={`pdf-nodule-${index}`} className="invisiblePDF-nodule-corner"></div>
            <div className="invisiblePDF-nodule-info">
              <div>切片号:{item.slice_idx + 1}</div>
              <div>位置:{pdfNodulePosition}</div>
              <div>危险程度:{magName[item.malignancy]}</div>
              <div>性质:{texName[item.texture]}</div>
              <div>表征:{pdfNoduleRepresentText}</div>
              <div>直径:{`${(item.diameter / 10).toFixed(2)}cm`}</div>
              <div>
                体积:
                {item.volume === undefined ? null : `${(item.volume * 1e3).toFixed(2)}mm³`}
              </div>
              <div>
                HU(均值/最大值/最小值):
                {item.huMean === undefined ? null : Math.round(item.huMean) + ' / ' + item.huMax + ' / ' + item.huMin}
              </div>
            </div>
          </div>
        )
      } else {
        return null
      }
    })
    const invisiblePdfContent = (
      <div id="invisiblePDF">
        <div id="invisiblePDF-container">
          <div className="invisiblePDF-header">图文报告</div>
          <div className="invisiblePDF-content">
            <div className="invisiblePDF-content-top">
              <div className="invisiblePDF-content-title">胸部CT检查报告单</div>
              <div className="invisiblePDF-content-description">
                <div className="invisiblePDF-content-description-info">
                  <Row wrap={false}>
                    <Col span={6}>
                      <div>
                        <div>姓名：{pdfFormValues.name}</div>
                        <div>影像号：{pdfFormValues.patientId}</div>
                      </div>
                    </Col>
                    <Col span={6}>
                      <div>
                        <div>性别：{pdfFormValues.sex}</div>
                        <div>送检科室：</div>
                      </div>
                    </Col>
                    <Col span={6}>
                      <div>
                        <div>年龄：{pdfFormValues.age}</div>
                        <div>送检医生：</div>
                      </div>
                    </Col>
                    <Col span={6}>
                      <div>
                        <div>检查号：{pdfFormValues.instanceId}</div>
                        <div>检查日期：{pdfFormValues.studyDate}</div>
                      </div>
                    </Col>
                  </Row>
                </div>
                <div className="invisiblePDF-content-description-nodules">
                  <div className="invisiblePDF-content-description-nodules-title">影像所见</div>
                  <div className="invisiblePDF-content-description-nodules-list">{visibleNodules}</div>
                </div>
                <div className="invisiblePDF-content-description-text">{reportImageText}</div>
              </div>
            </div>
            <div className="invisiblePDF-content-bottom">
              <div className="invisiblePDF-content-report">
                <Row wrap={false}>
                  <Col span={8}>报告日期：</Col>
                  <Col span={8}>报告医师：</Col>
                  <Col span={8}>审核医师：</Col>
                </Row>
              </div>
              <div className="invisiblePDF-content-note">注：本筛查报告仅供参考，详情请咨询医师。</div>
            </div>
          </div>
        </div>
      </div>
    )
    this.setState(
      {
        invisiblePdfContent,
        pdfLoadingCompleted: false,
      },
      () => {
        let boxesLoadCount = 0
        let allCount = 0
        boxes.forEach((nodule, index) => {
          if (nodule.visible && nodule.checked) {
            allCount += 1
          }
        })
        if (allCount === 0) {
          message.warn('未选中结节')
          this.setState({
            pdfLoadingCompleted: true,
          })
        } else {
          boxes.map((nodule, index) => {
            if (!nodule.visible || !nodule.checked) {
              return
            }
            // console.log('nodules1',nodule)
            const nodule_id2 = `pdf-nodule-${index}`
            const element2 = document.getElementById(nodule_id2)
            let imageId = imageIds[nodule.slice_idx]
            cornerstone.enable(element2)
            cornerstone.loadAndCacheImage(imageId).then((image) => {
              // console.log('cache')
              var viewport = cornerstone.getDefaultViewportForImage(element2, image)
              viewport.voi.windowWidth = 1600
              viewport.voi.windowCenter = -600
              viewport.scale = 2
              // console.log('nodules2',nodule)
              const xCenter = nodule.x1 + (nodule.x2 - nodule.x1) / 2
              const yCenter = nodule.y1 + (nodule.y2 - nodule.y1) / 2
              viewport.translation.x = 250 - xCenter
              viewport.translation.y = 250 - yCenter
              // console.log('viewport',viewport)
              cornerstone.setViewport(element2, viewport)
              cornerstone.displayImage(element2, image)

              boxesLoadCount += 1
              if (boxesLoadCount === allCount) {
                this.setState({
                  pdfLoadingCompleted: true,
                })
              }
            })
          })
        }
      }
    )
  }
  onPdfFormValuesChange(changedValues, allValues) {
    this.setState({
      pdfFormValues: allValues,
    })
  }

  onSetPreviewActive(idx) {
    const previewVisible = this.state.previewVisible
    previewVisible[idx] = !previewVisible[idx]
    this.setState({
      previewVisible,
    })
  }

  onHandleFirstTabChange(activeKey) {
    if (activeKey === '1') {
      const sliderMarks = this.state.noduleMarks
      this.setState({
        sliderMarks,
        firstTabActiveIndex: 1,
      })
      this.handleLymphClick(-1)
      this.handleListClick(0)
      this.onSetWwwcToPulmonary()
    } else if (activeKey === '2') {
      const sliderMarks = this.state.lymphMarks
      this.setState({
        sliderMarks,
        firstTabActiveIndex: 2,
      })
      this.handleListClick(-1)
      this.handleLymphClick(0)
      this.onSetWwwcToMedia()
    }
  }

  //callback

  // cornerstone callback
  drawNodules() {
    console.log('drawNodules')
    this.drawNodulesForRec()
    this.drawNodulesForBi()
  }
  drawNodulesForRec() {
    const { boxes, imageIds, cornerElement, cornerImage, cornerImageIdIndex, listsActiveIndex } = this.state
    if (boxes && boxes.length) {
      boxes.forEach((boxItem, boxIndex) => {
        if (imageIds[boxItem.slice_idx] === cornerImage.imageId && boxItem.recVisible && boxItem.uuid === undefined) {
          const measurementData = {
            visible: true,
            active: boxIndex === listsActiveIndex,
            // color: 'rgb(171, 245, 220)',
            color: undefined,
            invalidated: true,
            handles: {
              start: {
                x: boxItem.x1,
                y: boxItem.y1,
                highlight: false,
                active: false,
              },
              end: {
                x: boxItem.x2,
                y: boxItem.y2,
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
          cornerstoneTools.addToolState(cornerElement, 'RectangleRoi', measurementData)
          const toolData = cornerstoneTools.getToolState(cornerElement, 'RectangleRoi')

          const toolDataIndex = _.findIndex(toolData.data, function (o) {
            let isEqual = false
            const oHandles = o.handles
            if (oHandles) {
              if (oHandles.start.x === boxItem.x1 && oHandles.start.y === boxItem.y1 && oHandles.end.x === boxItem.x2 && oHandles.end.y === boxItem.y2) {
                isEqual = true
              }
            }
            return isEqual
          })
          if (toolDataIndex !== -1) {
            boxItem.uuid = toolData.data[toolDataIndex].uuid
            this.setState(
              {
                boxes,
              },
              () => {
                this.checkNodulesDrawingCompleted()
              }
            )
          }
        }
      })
    }
  }
  drawNodulesForBi() {
    const { boxes, imageIds, cornerElement, cornerImage, cornerImageIdIndex, listsActiveIndex } = this.state
    if (boxes && boxes.length) {
      boxes.forEach((boxItem, boxIndex) => {
        if (imageIds[boxItem.slice_idx] === cornerImage.imageId && boxItem.biVisible && boxItem.biuuid === undefined && boxItem.measure) {
          const measure = boxItem.measure
          if (
            _.has(measure, 'x1') &&
            _.has(measure, 'y1') &&
            _.has(measure, 'x2') &&
            _.has(measure, 'y2') &&
            _.has(measure, 'x3') &&
            _.has(measure, 'y3') &&
            _.has(measure, 'x4') &&
            _.has(measure, 'y4')
          ) {
            const getHandle = (x, y, index, extraAttributes = {}) =>
              Object.assign(
                {
                  x,
                  y,
                  index,
                  drawnIndependently: false,
                  allowedOutsideImage: false,
                  highlight: false,
                  active: false,
                },
                extraAttributes
              )
            const measurementData = {
              toolName: 'Bidirectional',
              toolType: 'Bidirectional', // Deprecation notice: toolType will be replaced by toolName
              isCreating: true,
              visible: true,
              // active: boxIndex === listsActiveIndex,
              active: false,
              invalidated: true,
              handles: {
                start: getHandle(measure.x1, measure.y1, 0),
                end: getHandle(measure.x2, measure.y2, 1),
                perpendicularStart: getHandle(measure.x3, measure.y3, 2),
                perpendicularEnd: getHandle(measure.x4, measure.y4, 3),
                textBox: getHandle(measure.x1, measure.y1 - 30, null, {
                  highlight: false,
                  hasMoved: true,
                  active: false,
                  movesIndependently: false,
                  drawnIndependently: true,
                  allowedOutsideImage: true,
                  hasBoundingBox: true,
                }),
              },
              longestDiameter: Math.sqrt(Math.pow(measure.x1 - measure.x2, 2) + Math.pow(measure.y1 - measure.y2, 2)),
              shortestDiameter: Math.sqrt(Math.pow(measure.x3 - measure.x4, 2) + Math.pow(measure.y3 - measure.y4, 2)),
            }

            cornerstoneTools.addToolState(cornerElement, 'Bidirectional', measurementData)
            const toolData = cornerstoneTools.getToolState(cornerElement, 'Bidirectional')
            // console.log('Bidirectional', toolData)
            const toolDataIndex = _.findIndex(toolData.data, function (o) {
              let isEqual = false
              const oHandles = o.handles
              if (oHandles) {
                if (
                  oHandles.start.x === boxItem.measure.x1 &&
                  oHandles.start.y === boxItem.measure.y1 &&
                  oHandles.end.x === boxItem.measure.x2 &&
                  oHandles.end.y === boxItem.measure.y2 &&
                  oHandles.perpendicularStart.x === boxItem.measure.x3 &&
                  oHandles.perpendicularStart.y === boxItem.measure.y3 &&
                  oHandles.perpendicularEnd.x === boxItem.measure.x4 &&
                  oHandles.perpendicularEnd.y === boxItem.measure.y4
                ) {
                  isEqual = true
                }
              }
              return isEqual
            })
            if (toolDataIndex !== -1) {
              boxItem.biuuid = toolData.data[toolDataIndex].uuid
              this.setState(
                {
                  boxes,
                },
                () => {
                  this.checkNodulesDrawingCompleted()
                }
              )
            }
          }
        }
      })
    }
  }
  drawLymphs() {
    const { lymphs, imageIds, cornerElement, cornerImage, lymphsActiveIndex } = this.state
    if (lymphs && lymphs.length) {
      lymphs.forEach((lymphItem, lymphIndex) => {
        if (imageIds[lymphItem.slice_idx] === cornerImage.imageId && lymphItem.recVisible && lymphItem.uuid === undefined) {
          const measurementData = {
            visible: true,
            active: false,
            // active: lymphIndex === lymphsActiveIndex,
            color: lymphDrawingColor,
            // color: undefined,
            invalidated: true,
            handles: {
              start: {
                x: lymphItem.lymph.x1,
                y: lymphItem.lymph.y1,
                highlight: false,
                active: false,
              },
              end: {
                x: lymphItem.lymph.x2,
                y: lymphItem.lymph.y2,
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
          cornerstoneTools.addToolState(cornerElement, 'RectangleRoi', measurementData)
          const toolData = cornerstoneTools.getToolState(cornerElement, 'RectangleRoi')

          const toolDataIndex = _.findIndex(toolData.data, function (o) {
            let isEqual = false
            const oHandles = o.handles
            if (oHandles) {
              if (oHandles.start.x === lymphItem.lymph.x1 && oHandles.start.y === lymphItem.lymph.y1 && oHandles.end.x === lymphItem.lymph.x2 && oHandles.end.y === lymphItem.lymph.y2) {
                isEqual = true
              }
            }
            return isEqual
          })
          if (toolDataIndex !== -1) {
            lymphItem.uuid = toolData.data[toolDataIndex].uuid
            this.setState(
              {
                lymphs,
              },
              () => {
                this.checkLymphsDrawingCompleted()
              }
            )
          }
        }
      })
    }
  }
  checkNodulesDrawingCompleted() {
    const { boxes } = this.state
    let count = 0
    let biCount = 0
    boxes.forEach((boxItem, boxIndex) => {
      if (boxItem.uuid) {
        count += 1
      }
      if (boxItem.biuuid) {
        biCount += 1
      }
    })
    this.setState({
      drawingNodulesCompleted: count === boxes.length && biCount === boxes.length,
    })
  }
  checkLymphsDrawingCompleted() {
    const { lymphs } = this.state
    let count = 0
    lymphs.forEach((lymphItem, lymphIndex) => {
      if (lymphItem.uuid) {
        count += 1
      }
    })
    this.setState({
      drawingLymphsCompleted: count === lymphs.length,
    })
  }
  cornerToolMouseUpCallback(e) {
    console.log('cornerToolMouseUpCallback', e)
  }
  cornerToolMeasurementAdd(e) {
    // console.log("cornerToolMeasurementAdd", e.detail)
  }
  cornerToolMeasurementModify(e) {
    const { boxes, lymphs, cornerActiveTool, cornerElement } = this.state
    const measureData = e.detail.measurementData
    let boxIndex
    let lymphIndex
    // console.log('cornerToolMeasurementModify', e.detail)
    switch (e.detail.toolName) {
      case 'RectangleRoi':
        boxIndex = _.findIndex(boxes, { uuid: measureData.uuid })
        if (boxIndex !== -1) {
          this.modifyExistingBox(boxIndex, measureData)
        }
        lymphIndex = _.findIndex(lymphs, { uuid: measureData.uuid })
        if (lymphIndex !== -1) {
          this.modifyExistingLymph(lymphIndex, measureData)
        }
        break
      case 'Bidirectional':
        boxIndex = _.findIndex(boxes, { biuuid: measureData.uuid })
        if (boxIndex !== -1) {
          this.modifyExistingBi(boxIndex, measureData)
        }
        break
      case 'Length':
        break
      case 'Eraser':
        break
      default:
        break
    }
  }
  cornerToolMeasurementComplete(e) {
    const { firstTabActiveIndex, boxes, listsActiveIndex, lymphs, lymphsActiveIndex, cornerActiveTool, cornerElement } = this.state
    const measureData = e.detail.measurementData
    let boxIndex
    let lymphIndex
    console.log('cornerToolMeasurementComplete', e.detail)
    switch (e.detail.toolName) {
      case 'RectangleRoi':
        let stackData = cornerstoneTools.getToolState(cornerElement, 'stack')
        if (firstTabActiveIndex === 1) {
          boxIndex = _.findIndex(boxes, { uuid: measureData.uuid })
          if (boxIndex !== -1) {
            this.modifyExistingBox(boxIndex, measureData)
          } else {
            this.createNewBox(stackData.data[0].currentImageIdIndex, measureData)
          }
        } else if (firstTabActiveIndex === 2) {
          lymphIndex = _.findIndex(lymphs, { uuid: measureData.uuid })
          if (lymphIndex !== -1) {
            this.modifyExistingLymph(lymphIndex, measureData)
          } else {
            this.createNewLymph(stackData.data[0].currentImageIdIndex, measureData)
          }
        }

        break
      case 'Bidirectional':
        if (firstTabActiveIndex === 1) {
          boxIndex = _.findIndex(boxes, { biuuid: measureData.uuid })
          if (boxIndex !== -1) {
            this.modifyExistingBi(boxIndex, measureData)
          } else {
            if (listsActiveIndex !== -1) {
              this.createNewBi(listsActiveIndex, measureData)
            }
          }
        } else if (firstTabActiveIndex === 2) {
        }

        break
      case 'Length':
        break
      case 'Eraser':
        break
      default:
        break
    }
  }
  createNewBox(imageIndex, data) {
    let boxes = this.state.boxes
    let visibleIdx
    if (boxes && boxes.length) {
      visibleIdx = _.maxBy(boxes, 'visibleIdx').visibleIdx + 1
    } else {
      boxes = []
      visibleIdx = 0
    }
    const newBoxItem = {
      ...boxProtoType,
      probability: 1,
      slice_idx: imageIndex,
      nodule_hist: this.noduleHist(data.handles.start.x, data.handles.start.y, data.handles.end.x, data.handles.end.y),
      huMax: data.cachedStats.max,
      huMean: data.cachedStats.mean,
      huMin: data.cachedStats.min,
      Variance: data.cachedStats.variance,
      volume: data.cachedStats.area * 1e-3,
      x1: data.handles.start.x,
      x2: data.handles.end.x,
      y1: data.handles.start.y,
      y2: data.handles.end.y,
      measure: undefined,
      modified: 1,
      uuid: data.uuid,
      prevIdx: '',
      visibleIdx,
      visible: true,
      recVisible: true,
      biVisible: true,
      checked: false,
    }
    boxes.push(newBoxItem)
    this.setState({
      boxes,
      needRedrawBoxes: true,
    })
  }
  noduleHist(x1, y1, x2, y2) {
    const { cornerImage } = this.state
    let pixelArray = []
    const pixeldata = cornerImage.getPixelData()
    const intercept = cornerImage.intercept
    const slope = cornerImage.slope

    for (var i = ~~x1; i <= x2; i++) {
      for (var j = ~~y1; j <= y2; j++) {
        pixelArray.push(parseInt(slope) * parseInt(pixeldata[512 * j + i]) + parseInt(intercept))
      }
    }
    pixelArray.sort(this.pixeldataSort)
    const data = pixelArray
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
    return obj
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
  createNewLymph(imageIndex, data) {
    let lymphs = this.state.lymphs
    let visibleIdx
    if (lymphs && lymphs.length) {
      visibleIdx = _.maxBy(lymphs, 'visibleIdx').visibleIdx + 1
    } else {
      lymphs = []
      visibleIdx = 0
    }
    const newLymphItem = {
      ...lymphProtoType,
      name: `淋巴结${visibleIdx + 1}`,
      slice_idx: imageIndex,
      // nodule_hist: this.noduleHist(data.handles.start.x, data.handles.start.y, data.handles.end.x, data.handles.end.y),
      // huMax: data.cachedStats.max,
      // huMean: data.cachedStats.mean,
      // huMin: data.cachedStats.min,
      // Variance: data.cachedStats.variance,
      volume: data.cachedStats.area * 1e-3,
      lymph: {
        slice_idx: imageIndex,
        x1: data.handles.start.x,
        x2: data.handles.end.x,
        y1: data.handles.start.y,
        y2: data.handles.end.y,
        probability: 1,
      },
      modified: 1,
      uuid: data.uuid,
      visibleIdx,
      recVisible: true,
    }
    lymphs.push(newLymphItem)
    this.setState({
      lymphs,
      needRedrawBoxes: true,
    })
  }
  modifyExistingBox(boxIndex, data) {
    const { boxes } = this.state
    boxes[boxIndex] = {
      ...boxes[boxIndex],
      huMax: data.cachedStats.max,
      huMean: data.cachedStats.mean,
      huMin: data.cachedStats.min,
      Variance: data.cachedStats.variance,
      volume: data.cachedStats.area * 1e-4,
      x1: data.handles.start.x,
      x2: data.handles.end.x,
      y1: data.handles.start.y,
      y2: data.handles.end.y,
    }
    this.setState({
      boxes,
      // needRedrawBoxes: true,
    })
  }
  modifyExistingLymph(lymphIndex, data) {
    const { lymphs } = this.state
    lymphs[lymphIndex] = {
      ...lymphs[lymphIndex],
      // huMax: data.cachedStats.max,
      // huMean: data.cachedStats.mean,
      // huMin: data.cachedStats.min,
      // Variance: data.cachedStats.variance,
      lymph: {
        ...lymphs[lymphIndex].lymph,
        x1: data.handles.start.x,
        x2: data.handles.end.x,
        y1: data.handles.start.y,
        y2: data.handles.end.y,
      },
      volume: data.cachedStats.area * 1e-3,
    }
    this.setState({
      lymphs,
      // needRedrawBoxes: true,
    })
  }
  createNewBi(boxIndex, data) {
    const { boxes } = this.state
    const handles = data.handles
    boxes[boxIndex].measure = {
      x1: handles.start.x,
      x2: handles.end.x,
      y1: handles.start.y,
      y2: handles.end.y,
      x3: handles.perpendicularStart.x,
      x4: handles.perpendicularEnd.x,
      y3: handles.perpendicularStart.y,
      y4: handles.perpendicularEnd.y,
    }
    boxes[boxIndex].biVisible = true
    boxes[boxIndex].biuuid = data.uuid
    this.setState({
      boxes,
      needRedrawBoxes: true,
    })
  }
  modifyExistingBi(boxIndex, data) {
    const { boxes } = this.state
    const handles = data.handles
    boxes[boxIndex].measure = {
      x1: handles.start.x,
      x2: handles.end.x,
      y1: handles.start.y,
      y2: handles.end.y,
      x3: handles.perpendicularStart.x,
      x4: handles.perpendicularEnd.x,
      y3: handles.perpendicularStart.y,
      y4: handles.perpendicularEnd.y,
    }
    this.setState({
      boxes,
      // needRedrawBoxes: true,
      needReloadBoxes: true,
    })
  }
  cornerToolMeasurementRemove(e) {
    console.log('cornerToolMeasurementRemove', e)
    const { boxes, lymphs, cornerActiveTool, cornerElement } = this.state
    const measurement = e.detail.measurementData
    let boxIndex
    let lymphIndex
    switch (e.detail.toolName) {
      case 'RectangleRoi':
        boxIndex = _.findIndex(boxes, { uuid: measurement.uuid })
        if (boxIndex !== -1) {
          this.removeExistingBox(boxIndex)
        }
        lymphIndex = _.findIndex(lymphs, { uuid: measurement.uuid })
        if (lymphIndex !== -1) {
          this.removeExistingLymph(lymphIndex)
        }
        break
      case 'Bidirectional':
        boxIndex = _.findIndex(boxes, { biuuid: measurement.uuid })
        if (boxIndex !== -1) {
          this.removeExistingBi(boxIndex)
        }
        break
      case 'Length':
        break
      case 'Eraser':
        break
      default:
        break
    }
  }
  removeExistingBox(boxIndex) {
    const { boxes } = this.state
    boxes[boxIndex].recVisible = false
    delete boxes[boxIndex].uuid
    this.setState({
      boxes,
      needRedrawBoxes: true,
      // drawingNodulesCompleted: false,
    })
  }
  removeExistingLymph(lymphIndex) {
    const { lymphs } = this.state
    lymphs[lymphIndex].recVisible = false
    delete lymphs[lymphIndex].uuid
    this.setState({
      lymphs,
      needRedrawBoxes: true,
      // drawingLymphsCompleted: false,
    })
  }
  removeExistingBi(boxIndex) {
    const { boxes } = this.state
    boxes[boxIndex].biVisible = false
    delete boxes[boxIndex].biuuid
    this.setState({
      boxes,
      needRedrawBoxes: true,
      // drawingNodulesCompleted: false,
    })
  }
  rectangleRoiMouseMoveCallback(e) {
    console.log('rectangleRoiMouseMoveCallback', e)
  }
  eraserMouseUpCallback(e) {
    console.log('eraserMouseUpCallback', e)
  }

  // window callback
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
      // arrowLeft
      // console.log('active item',document.activeElement,document.getElementsByClassName("ant-slider-handle")[0])
      if (document.getElementsByClassName('ant-slider-handle')[0] !== document.activeElement) {
        event.preventDefault()
        let newCurrentIdx = this.state.currentIdx - 1
        if (newCurrentIdx >= 0) {
        }
      }
    }
    if (event.which == 38) {
      // arrowUp
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
      // arrowRight
      if (document.getElementsByClassName('ant-slider-handle')[0] !== document.activeElement) {
        event.preventDefault()
        let newCurrentIdx = this.state.currentIdx + 1
        if (newCurrentIdx < this.state.imageIds.length) {
          // console.log('info',cornerstone.imageCache.getCacheInfo())
        }
      }
    }
    if (event.which == 40) {
      // arrowDown
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
  keyDownListSwitch(activeIdx) {
    // const boxes = this.state.selectBoxes
    const boxes = this.state.boxes
    let sliceIdx = boxes[activeIdx].slice_idx
    // console.log('cur', sliceIdx)
    this.setState({
      listsActiveIndex: activeIdx,
      cornerImageIdIndex: sliceIdx,
    })
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

  render() {
    const { curCaseId, preCaseId, followUpActiveTool, followUpIsPlaying } = this.props
    const {
      realname,
      username,
      pdfContent,
      invisiblePdfContent,
      pdfReading,
      pdfLoadingCompleted,
      windowWidth,
      windowHeight,
      verticalMode,
      slideSpan,
      dateSeries,
      previewVisible,
      clearUserOpen,

      imageIds,
      cornerImageIdIndex,
      cornerImage,
      cornerIsPlaying,
      cornerFrameRate,
      cornerActiveTool,
      cornerIsOverlayVisible,
      cornerViewport,
      cornerAnnoVisible,
      drawingNodulesCompleted,
      drawingLymphsCompleted,

      nodulesAllChecked,
      nodulesOrder,
      noduleOrderOption,
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
      ctImagePadding,
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
      airwayVolumes,
      airwayCenterVolumes,
      maskVolumes,
      maskYLength,
      maskImageData,
      maskLabelMap,
      lineActors,

      readonly,
      registering,
      menuButtonsWidth,
      menuScrollable,
      menuTotalPages,
      menuNowPage,
      menuTransform,
      show3DVisualization,
      crosshairsTool,
      studyListShowed,
      renderLoading,
      showFollowUp,
    } = this.state
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
          {/* {airwayVolumes.length > 0 ? (
            <>
              <View2D
                viewerStyle={CPRStyles.axial}
                viewerType={0}
                volumes={airwayVolumes}
                onCreated={this.storeApi(0)}
                onDestroyed={this.deleteApi(0)}
                orientation={{
                  sliceNormal: [0, 0, 1],
                  viewUp: [0, -1, 0],
                }}
                showRotation={true}
                sliderMax={0}
                sliderMin={0}
                onRef={(ref) => {
                  this.viewerAxial = ref
                }}
              />
              <View2D
                //coronal
                viewerStyle={CPRStyles.coronal}
                viewerType={1}
                volumes={airwayVolumes}
                onCreated={this.storeApi(1)}
                onDestroyed={this.deleteApi(1)}
                orientation={{
                  sliceNormal: [0, 1, 0],
                  viewUp: [0, 0, 1],
                }}
                showRotation={true}
                sliderMax={0}
                sliderMin={0}
                onRef={(ref) => {
                  this.viewerCoronal = ref
                }}
              />
              <View2D
                //sagittal
                viewerStyle={CPRStyles.sagittal}
                volumes={airwayVolumes}
                onCreated={this.storeApi(2)}
                onDestroyed={this.deleteApi(2)}
                orientation={{
                  sliceNormal: [-1, 0, 0],
                  viewUp: [0, 0, 1],
                }}
                showRotation={true}
                sliderMax={0}
                sliderMin={0}
                onRef={(ref) => {
                  this.viewerSagittal = ref
                }}
              />
            </>
          ) : null} */}

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
                locationValues = [nodulePlaces[inside.place]]
              } else {
                locationValues = ['无法定位']
              }
            }

            // if(this.state.readonly){
            if (inside.visible) {
              return (
                <div key={idx} className={'highlightTbl' + (listsActiveIndex === idx ? ' highlightTbl-active' : '')}>
                  <Accordion.Title onClick={this.handleListClick.bind(this, idx)} active={listsActiveIndex === idx}>
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
                        <div className="nodule-accordion-item-title-shape nodule-accordion-item-title-column">{`${(diameter / 10).toFixed(1)}cm`}</div>
                      ) : (
                        <div className="nodule-accordion-item-title-shape nodule-accordion-item-title-column">{`${(ll / 10).toFixed(1)}x${(sl / 10).toFixed(1)}cm`}</div>
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
                        <div className="nodule-accordion-item-content-info-diam">{inside.volume !== undefined ? `${(inside.volume * 1e3).toFixed(2)}mm³` : null}</div>
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
                            <Button basic icon title="擦除测量" active color="green" onClick={this.clearNoduleMeasure.bind(this, idx)}>
                              <Icon inverted color="green" name="eraser"></Icon>
                            </Button>
                            {inside.recVisible || inside.biVisible ? (
                              <Button basic icon title="隐藏测量" active color="blue" onClick={this.onSetNoduleMeasureVisible.bind(this, idx, false)}>
                                <Icon inverted color="blue" name="eye slash"></Icon>
                              </Button>
                            ) : (
                              <Button basic icon title="显示测量" active color="blue" onClick={this.onSetNoduleMeasureVisible.bind(this, idx, true)}>
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
              <Accordion.Title onClick={this.handleLymphClick.bind(this, index)} active={lymphsActiveIndex === index}>
                <div className="lymph-accordion-item-title">
                  <div className="lymph-accordion-item-title-start">
                    <div className="lymph-accordion-item-title-index">{item.visibleIdx + 1}</div>
                    <div className="lymph-accordion-item-title-slice">{item.slice_idx + 1}</div>
                    <div className="lymph-accordion-item-title-name">{item.name}</div>
                  </div>
                  <div className="lymph-accordion-item-title-center">
                    <div className="lymph-accordion-item-title-volume">{item.volume !== undefined ? `${(item.volume * 1e3).toFixed(2)}mm³` : null}</div>
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
        CT_std = boxes[listsActiveIndex].Variance ? boxes[listsActiveIndex].Variance.toFixed(1) : 0
        Sphericity = boxes[listsActiveIndex].Sphericity ? boxes[listsActiveIndex].Sphericity.toFixed(1) : 0

        slice_idx = boxes[listsActiveIndex].slice_idx + 1
        Maximum = boxes[listsActiveIndex].Maximum ? boxes[listsActiveIndex].Maximum.toFixed(2) : 0
        SurfaceArea = boxes[listsActiveIndex].SurfaceArea ? boxes[listsActiveIndex].SurfaceArea.toFixed(2) : 0
        Maximum3DDiameter = boxes[listsActiveIndex].Maximum3DDiameter ? boxes[listsActiveIndex].Maximum3DDiameter.toFixed(2) : 0
        if (boxes[listsActiveIndex].measure !== null && boxes[listsActiveIndex].measure !== undefined) {
          let measureCoord = boxes[listsActiveIndex].measure
          let ll = Math.sqrt(Math.pow(measureCoord.x1 - measureCoord.x2, 2) + Math.pow(measureCoord.y1 - measureCoord.y2, 2))
          let sl = Math.sqrt(Math.pow(measureCoord.x3 - measureCoord.x4, 2) + Math.pow(measureCoord.y3 - measureCoord.y4, 2))
          apsidal_mean = ((ll + sl) / 2).toFixed(2)
        }

        Kurtosis = boxes[listsActiveIndex].Kurtosis ? boxes[listsActiveIndex].Kurtosis.toFixed(2) : 0
        Skewness = boxes[listsActiveIndex].Skewness ? boxes[listsActiveIndex].Skewness.toFixed(2) : 0
        if (boxes[listsActiveIndex].Energy) {
          let EnergyValue = boxes[listsActiveIndex].Energy
          let EnergyP = Math.floor(Math.log(EnergyValue) / Math.LN10)
          let EnergyN = (EnergyValue * Math.pow(10, -EnergyP)).toFixed(0)
          Energy = EnergyN + 'E' + EnergyP
        }
        Compactness2 = boxes[listsActiveIndex].Compactness2 ? boxes[listsActiveIndex].Compactness2.toFixed(2) : 0
        Entropy = boxes[listsActiveIndex].Entropy ? boxes[listsActiveIndex].Entropy.toFixed(2) : 0
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
          {readonly ? (
            <div title="提交" onClick={this.submit.bind(this)} className="func-btn">
              <Icon className="func-btn-icon" name="upload" size="large"></Icon>
              <div className="func-btn-desc">提交</div>
            </div>
          ) : (
            // <Button icon title='暂存' onClick={this.temporaryStorage} className='funcbtn'><Icon name='inbox' size='large'></Icon></Button>
            <div title="暂存" onClick={this.saveToDB.bind(this)} className="func-btn">
              <Icon className="func-btn-icon" name="upload" size="large"></Icon>
              <div className="func-btn-desc">暂存</div>
            </div>
          )}
          {readonly ? null : (
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
                <Dropdown.Item text="放大" icon="search plus" onClick={this.onZoomIn.bind(this)} />
                <Dropdown.Item text="缩小" icon="search minus" onClick={this.onZoomOut.bind(this)} />
              </Dropdown.Menu>
            </Dropdown>
          </div>
          <div onClick={this.onResetView.bind(this)} className="func-btn" title="刷新">
            <Icon className="func-btn-icon" name="repeat" size="large"></Icon>
            <div className="func-btn-desc">刷新</div>
          </div>
          <div
            title="窗宽窗位"
            onClick={this.onSetCornerActiveTool.bind(this, 'Wwwc')}
            className={'func-btn' + (!showFollowUp ? (cornerActiveTool === 'Wwwc' ? ' func-btn-active' : '') : followUpActiveTool === 'Wwwc' ? ' func-btn-active' : '')}
            hidden={show3DVisualization}>
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
                  <Dropdown.Item text="反色" onClick={this.onSetWwwcFlip.bind(this)} />
                  <Dropdown.Item text="肺窗" onClick={this.onSetWwwcToPulmonary.bind(this)} />
                  <Dropdown.Item text="骨窗" onClick={this.onSetWwwcToBone.bind(this)} />
                  <Dropdown.Item text="腹窗" onClick={this.onSetWwwcToVentral.bind(this)} />
                  <Dropdown.Item text="纵隔窗" onClick={this.onSetWwwcToMedia.bind(this)} />
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </div>
          {show3DVisualization ? threedMenus : null}
          {showFollowUp ? followUpMenus : null}

          {cornerIsPlaying || followUpIsPlaying ? (
            <div onClick={this.onSetAnimationPlaying.bind(this, false)} className="func-btn" title="暂停动画" hidden={show3DVisualization}>
              <Icon className="func-btn-icon" name="pause" size="large"></Icon>
              <div className="func-btn-desc">暂停</div>
            </div>
          ) : (
            <div onClick={this.onSetAnimationPlaying.bind(this, true)} className="func-btn" title="播放动画" hidden={show3DVisualization}>
              <Icon className="func-btn-icon" name="play" size="large"></Icon>
              <div className="func-btn-desc">播放</div>
            </div>
          )}

          {cornerAnnoVisible ? (
            <div onClick={this.onSetAnnoVisible.bind(this, false)} className="func-btn" title="隐藏结节" hidden={show3DVisualization || showFollowUp}>
              <Icon className="func-btn-icon" id="cache-button" name="eye slash" size="large"></Icon>
              <div className="func-btn-desc">隐藏结节</div>
            </div>
          ) : (
            <div onClick={this.onSetAnnoVisible.bind(this, true)} className="func-btn" title="显示结节" hidden={show3DVisualization || showFollowUp}>
              <Icon className="func-btn-icon" id="cache-button" name="eye" size="large"></Icon>
              <div className="func-btn-desc">显示结节</div>
            </div>
          )}
          {cornerIsOverlayVisible ? (
            <div onClick={this.onSetOverlayVisible.bind(this, false)} className="func-btn" title="隐藏信息" hidden={show3DVisualization || showFollowUp}>
              <Icon className="func-btn-icon" id="cache-button" name="delete calendar" size="large"></Icon>
              <div className="func-btn-desc">隐藏信息</div>
            </div>
          ) : (
            <div onClick={this.onSetOverlayVisible.bind(this, true)} className="func-btn" title="显示信息" hidden={show3DVisualization || showFollowUp}>
              <Icon className="func-btn-icon" id="cache-button" name="content" size="large"></Icon>
              <div className="func-btn-desc">显示信息</div>
            </div>
          )}
          <div
            title="切换切片"
            onClick={this.onSetCornerActiveTool.bind(this, 'StackScroll')}
            hidden={show3DVisualization}
            className={'func-btn' + (!showFollowUp ? (cornerActiveTool === 'StackScroll' ? ' func-btn-active' : '') : followUpActiveTool === 'StackScroll' ? ' func-btn-active' : '')}>
            <Icon className="func-btn-icon" name="sort" size="large"></Icon>
            <div className="func-btn-desc">滚动</div>
          </div>
          <div
            onClick={this.onSetCornerActiveTool.bind(this, 'RectangleRoi')}
            title="标注"
            hidden={show3DVisualization}
            className={'func-btn' + (!showFollowUp ? (cornerActiveTool === 'RectangleRoi' ? ' func-btn-active' : '') : followUpActiveTool === 'RectangleRoi' ? ' func-btn-active' : '')}>
            <Icon className="func-btn-icon" name="edit" size="large"></Icon>
            <div className="func-btn-desc">标注</div>
          </div>
          <div
            onClick={this.onSetCornerActiveTool.bind(this, 'Bidirectional')}
            title="测量"
            hidden={show3DVisualization}
            className={'func-btn' + (!showFollowUp ? (cornerActiveTool === 'Bidirectional' ? ' func-btn-active' : '') : followUpActiveTool === 'Bidirectional' ? ' func-btn-active' : '')}>
            <Icon className="func-btn-icon" name="crosshairs" size="large"></Icon>
            <div className="func-btn-desc">测量</div>
          </div>
          <div
            onClick={this.onSetCornerActiveTool.bind(this, 'Length')}
            title="长度"
            hidden={show3DVisualization}
            className={'func-btn' + (!showFollowUp ? (cornerActiveTool === 'Length' ? ' func-btn-active' : '') : followUpActiveTool === 'Length' ? ' func-btn-active' : '')}>
            <Icon className="func-btn-icon" name="arrows alternate vertical" size="large"></Icon>
            <div className="func-btn-desc">长度</div>
          </div>
          <div
            onClick={this.onSetCornerActiveTool.bind(this, 'Eraser')}
            title="擦除"
            hidden={show3DVisualization}
            className={'func-btn' + (!showFollowUp ? (cornerActiveTool === 'Eraser' ? ' func-btn-active' : '') : followUpActiveTool === 'Eraser' ? ' func-btn-active' : '')}>
            <Icon className="func-btn-icon" name="eraser" size="large"></Icon>
            <div className="func-btn-desc">擦除</div>
          </div>

          {!show3DVisualization && !showFollowUp ? twodMenus : null}
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
          <div id="corner-top-row">
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
                <Dropdown text={`欢迎您，${realname}`}>
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
          <div id="corner-bottom-row" style={{ height: bottomRowHeight }}>
            <Sidebar.Pushable style={{ overflow: 'hidden', width: '100%' }}>
              <Sidebar visible={studyListShowed} animation={'overlay'} width="thin">
                <div className="preview">{previewContent}</div>
              </Sidebar>
              <Sidebar.Pusher style={{ height: '100%' }}>
                {showFollowUp ? (
                  <div
                    className={'ct-follow-up' + (studyListShowed ? ' ct-follow-up-contract' : '') + (verticalMode ? ' ct-follow-up-vertical' : ' ct-follow-up-horizontal')}
                    style={studyListShowed ? { paddingLeft: `${ctImagePadding}px` } : {}}>
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
                  <div id="ct-container" className={verticalMode ? 'ct-container-vertical' : 'ct-container-horizontal'}>
                    <div id="ct-image-block" className={verticalMode ? 'ct-image-block-vertical' : 'ct-image-block-horizontal'} style={studyListShowed ? { paddingLeft: `${ctImagePadding}px` } : {}}>
                      {show3DVisualization ? (
                        <div className="center-viewport-panel" id="segment-container">
                          {renderLoading ? (
                            loadingPanel
                          ) : (
                            <div
                              style={{
                                width: viewerWidth,
                                height: viewerHeight,
                              }}>
                              {panel}
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          {imageIds && imageIds.length ? (
                            <CornerstoneViewport
                              tools={[
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
                                {
                                  name: 'StackScrollMouseWheel',
                                  mode: 'active',
                                },
                                {
                                  name: 'StackScroll',
                                  mode: 'active',
                                  mouseButtonMask: 1,
                                },
                                // Touch
                                { name: 'PanMultiTouch', mode: 'active' },
                                { name: 'ZoomTouchPinch', mode: 'active' },
                                {
                                  name: 'StackScrollMultiTouch',
                                  mode: 'active',
                                },
                                // Draw
                                {
                                  name: 'RectangleRoi',
                                  mode: 'active',
                                  mouseButtonMask: 10,
                                  props: {
                                    mouseMoveCallback: this.rectangleRoiMouseMoveCallback.bind(this),
                                  },
                                },
                                {
                                  name: 'Bidirectional',
                                  mode: 'active',
                                  mouseButtonMask: 11,
                                },
                                {
                                  name: 'Length',
                                  mode: 'active',
                                  mouseButtonMask: 12,
                                },
                                //erase
                                {
                                  name: 'Eraser',
                                  mode: 'active',
                                  mouseButtonMask: 13,
                                  props: {
                                    mouseUpCallback: this.eraserMouseUpCallback.bind(this),
                                  },
                                },
                              ]}
                              imageIds={imageIds}
                              imageIdIndex={cornerImageIdIndex}
                              isPlaying={cornerIsPlaying}
                              frameRate={cornerFrameRate}
                              activeTool={cornerActiveTool}
                              isOverlayVisible={cornerIsOverlayVisible}
                              onElementEnabled={(elementEnabledEvt) => {
                                const cornerElement = elementEnabledEvt.detail.element
                                this.setState({
                                  cornerElement,
                                })

                                this.subs.cornerImageRendered.sub(
                                  cornerElement.addEventListener('cornerstoneimagerendered', (imageRenderedEvent) => {
                                    if (this.state.cornerImage !== imageRenderedEvent.detail.image) {
                                      this.setState(
                                        {
                                          cornerImage: imageRenderedEvent.detail.image,
                                          cornerImageIdIndex: _.indexOf(this.state.imageIds, imageRenderedEvent.detail.image.imageId),
                                        },
                                        () => {
                                          if (!this.state.drawingNodulesCompleted) {
                                            this.drawNodules()
                                          }
                                          if (!this.state.drawingLymphsCompleted) {
                                            this.drawLymphs()
                                          }
                                        }
                                      )
                                    }

                                    const viewport = imageRenderedEvent.detail.viewport
                                    const newViewport = Object.assign({}, viewport, this.state.cornerViewport)
                                    cornerstone.setViewport(cornerElement, newViewport)
                                  })
                                )
                                this.subs.cornerMouseUp.sub(
                                  cornerElement.addEventListener('cornerstonetoolsmouseup', (e) => {
                                    // this.cornerToolMouseUpCallback(e)
                                  })
                                )
                                this.subs.cornerMeasureAdd.sub(
                                  cornerElement.addEventListener('cornerstonetoolsmeasurementadded', (e) => {
                                    // console.log("cornerstonetoolsmeasurementadded", e)
                                    this.cornerToolMeasurementAdd(e)
                                  })
                                )
                                this.subs.cornerMeasureModify.sub(
                                  cornerElement.addEventListener('cornerstonetoolsmeasurementmodified', (e) => {
                                    this.cornerToolMeasurementModify(e)
                                  })
                                )
                                this.subs.cornerMeasureComplete.sub(
                                  cornerElement.addEventListener('cornerstonetoolsmeasurementcompleted', (e) => {
                                    this.cornerToolMeasurementComplete(e)
                                  })
                                )
                                this.subs.cornerMeasureRemove.sub(
                                  cornerElement.addEventListener('cornerstonetoolsmeasurementremoved', (e) => {
                                    this.cornerToolMeasurementRemove(e)
                                  })
                                )
                              }}
                            />
                          ) : (
                            <LoadingComponent />
                          )}
                          {/* <div id="cor-slice-slider" style={{ height: `${canvasHeight * 0.7}px`, top: `${canvasHeight * 0.15}px` }}>
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
                              </div> */}
                        </>
                      )}

                      {/* <div className='antd-slider'> */}

                      {/* </div> */}
                    </div>
                    <div id="ct-info-block" className={verticalMode ? 'ct-info-block-vertical' : 'ct-info-block-horizontal'} style={verticalMode ? { paddingLeft: `${ctImagePadding}px` } : {}}>
                      <div
                        id="nodule-card-container"
                        className={
                          (verticalMode ? 'nodule-card-container-vertical' : 'nodule-card-container-horizontal') + (show3DVisualization && !painting ? ' nodule-card-container-not-lung' : '')
                        }>
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
                                          <Popup
                                            on="click"
                                            style={{
                                              backgroundColor: 'rgb(39, 46, 72)',
                                            }}
                                            trigger={<FontAwesomeIcon className="nodule-filter-operation-icon" icon={faFilter} />}>
                                            <div className="nodule-filter-operation-select">
                                              <div className="nodule-filter-operation-select-header">
                                                已筛选
                                                <span>{noduleNumber}</span>
                                                个病灶
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
                                            style={{
                                              backgroundColor: 'rgb(39, 46, 72)',
                                            }}
                                            trigger={<FontAwesomeIcon className="nodule-filter-operation-icon" icon={faSortAmountDownAlt} />}>
                                            <div className="nodule-filter-operation-sort">
                                              <div className="nodule-filter-operation-sort-header">排序</div>
                                              <div className="nodule-filter-operation-sort-content">{noduleOrderContent}</div>
                                            </div>
                                          </Popup>
                                        </div>
                                      </div>
                                      <Accordion styled id="nodule-accordion" fluid>
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
                        <div
                          id="threed-mask-container"
                          className={
                            (verticalMode ? ' threed-mask-container-vertical' : ' threed-mask-container-horizontal') + (show3DVisualization && !painting ? ' threed-mask-container-not-lung' : '')
                          }>
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

                          <Accordion
                            id="report-accordion-image"
                            style={{
                              top: `${reportImageTop}px`,
                              height: `${reportImageHeight}px`,
                            }}>
                            <Accordion.Title
                              id="report-accordion-image-header"
                              active={reportImageActive}
                              // onClick={this.onSetReportImageActive.bind(this)}
                            >
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
                                    open={pdfReading}
                                    onOpen={this.setPdfReading.bind(this, true)}
                                    onClose={this.setPdfReading.bind(this, false)}
                                    trigger={<Icon name="expand arrows alternate" title="放大" className="inverted blue button" onClick={this.showImages.bind(this)}></Icon>}>
                                    <Modal.Header className="corner-report-modal-header">
                                      <Row>
                                        <Col span={12} className="corner-report-modal-header-info">
                                          影像诊断报告
                                        </Col>
                                        <Col span={12} className="corner-report-modal-header-button">
                                          {pdfLoadingCompleted ? (
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
                                      <Modal.Description>{pdfContent}</Modal.Description>
                                    </Modal.Content>
                                  </Modal>

                                  <Icon title="复制" className="inverted blue button" name="copy outline" onClick={this.handleCopyClick.bind(this)}></Icon>
                                </div>
                              </div>
                            </Accordion.Title>
                            <Accordion.Content
                              active={reportImageActive}
                              style={{
                                height: `${reportImageContentHeight}px`,
                              }}>
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
                )}
              </Sidebar.Pusher>
            </Sidebar.Pushable>
          </div>
          {histogramFloatWindow}
          {pdfReading ? invisiblePdfContent : null}
        </div>
      )
      // }
    }
  }

  // 3d
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
    if (!labelData || !labelData.range) {
      return
    }
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
          // this.viewerAxial.setContainerSize(CPRStyles.axial.width, CPRStyles.axial.height)
          // this.viewerCoronal.setContainerSize(CPRStyles.coronal.width, CPRStyles.coronal.height)
          // this.viewerSagittal.setContainerSize(CPRStyles.sagittal.width, CPRStyles.sagittal.height)
          // this.viewerAirway.setContainerSize(CPRStyles.airway.width, CPRStyles.airway.height)
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
    const number = points.length > 30 ? 30 : points.length
    const { tangents, normals } = frenet(points)
    console.log('seleted points', number)
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
    // mat4.rotateX(centerAirwayAxes, centerAirwayAxes, Math.PI)
    // mat4.rotateY(centerAirwayAxes, centerAirwayAxes, Math.PI)
    // mat4.rotateZ(centerAirwayAxes, centerAirwayAxes, Math.PI / 2)
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

    this.setState({
      airwayVolumes: [fullAirwayActor],
      airwayCenterVolumes: [centerAirwayActor],
    })
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
      followUpIsPlaying: state.dataCenter.followUpisPlaying,
    }
  },
  (dispatch) => {
    return {
      getImageIdsByCaseId: (url, caseId) => dispatch(getImageIdsByCaseId(url, caseId)),
      getNodulesByCaseId: (url, caseId, username) => dispatch(getNodulesByCaseId(url, caseId, username)),
      setFollowUpPlaying: (isPlaying) => dispatch(setFollowUpPlaying(isPlaying)),
      setFollowUpActiveTool: (toolName) => dispatch(setFollowUpActiveTool(toolName)),
      dispatch,
    }
  }
)(CornerstoneElement)
