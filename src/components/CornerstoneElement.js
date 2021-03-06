import React, { Component, useState, useEffect, useRef } from 'react'
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
import { CloseCircleOutlined, CheckCircleOutlined, ConsoleSqlOutlined, SyncOutlined, ExclamationCircleOutlined, ExclamationCircleFilled } from '@ant-design/icons'
import qs from 'qs'
import axios from 'axios'
import { Slider, Select, Checkbox, Tabs, InputNumber, Popconfirm, message, Cascader, Radio, Row, Col, Form as AntdForm, Input, Tooltip, Switch } from 'antd'
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
import { getConfigJson, getImageIdsByCaseId, getNodulesByCaseId, dropCaseId, setFollowUpPlaying, setFollowUpActiveTool, updateLoadedImageNumber } from '../actions'
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
import '../css/ct.css'
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
const segmentationModule = cornerstoneTools.getModule('segmentation')
const { TabPane } = Tabs
let playTimer = undefined
let flipTimer = undefined
let leftSlideTimer = undefined
let closeFollowUpInterval = undefined
const loadedImageNumberMap = {}

const dictList = {
  lung: {
    class: 3,
    label: 'lung',
    name: '???',
    color: { c1: 197, c2: 165, c3: 145 },
  },
  airway: {
    class: 1,
    label: 'airway',
    name: '?????????',
    // color: { c1: 182, c2: 228, c3: 255 },
    color: { c1: 178, c2: 212, c3: 242 },
  },
  nodule: {
    class: 2,
    label: 'nodule',
    name: '??????',
    color: { c1: 178, c2: 34, c3: 34 },
  },
  lobe1: {
    class: 0,
    label: 'lobe_1',
    name: '????????????',
    // color: { c1: 128, c2: 174, c3: 128 },
    color: { c1: 178, c2: 212, c3: 242 },
  },
  lobe2: {
    class: 0,
    label: 'lobe_2',
    name: '????????????',
    // color: { c1: 241, c2: 214, c3: 145 },
    color: { c1: 178, c2: 212, c3: 242 },
  },
  lobe3: {
    class: 0,
    label: 'lobe_3',
    name: '????????????',
    // color: { c1: 177, c2: 122, c3: 101 },
    color: { c1: 178, c2: 212, c3: 242 },
  },
  lobe4: {
    class: 0,
    label: 'lobe_4',
    name: '????????????',
    // color: { c1: 111, c2: 184, c3: 210 },
    color: { c1: 178, c2: 212, c3: 242 },
  },
  lobe5: {
    class: 0,
    label: 'lobe_5',
    name: '????????????',
    // color: { c1: 216, c2: 101, c3: 79 },
    color: { c1: 178, c2: 212, c3: 242 },
  },
  vessel: {
    class: 4,
    label: 'vessel',
    name: '??????',
    // color: { c1: 200, c2: 100, c3: 50 },
    color: { c1: 178, c2: 212, c3: 242 },
  },
}
const lobeName = {
  1: '????????????',
  2: '????????????',
  3: '????????????',
  4: '????????????',
  5: '????????????',
}
const texName = {
  '-1': '??????',
  1: '?????????',
  2: '??????',
  3: '?????????',
  4: '??????',
}
const magName = {
  '-1': '??????',
  1: '??????',
  2: '??????',
  3: '??????',
}
const immersiveStyle = {
  width: '1280px',
  height: '1280px',
  position: 'relative',
  // display: "inline",
  color: 'white',
}
const nodulePlaces = {
  0: '????????????',
  1: '????????????',
  2: '????????????',
  3: '????????????',
  4: '????????????',
  5: '????????????',
}
const noduleSegments = {
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
  type: 'nodule',
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
  name: '?????????1',
  uuid: '44beb47c-b328-416d-920a-3953bf93840f',
}
const lymphDrawingColor = 'rgb(0, 255, 255)'

class CornerstoneElement extends Component {
  constructor(props) {
    super(props)
    this.state = {
      // displayPanel
      date: new Date(),
      caseId: window.location.pathname.split('/case/')[1].split('/')[0].replace('%23', '#'),
      username: localStorage.getItem('username'),
      modelName: window.location.pathname.split('/')[3],
      realname: localStorage.realname ? localStorage.realname : '',
      patientId: null,
      noduleSpacing: null,
      noduleCompressing: false,
      noduleCompressParentIndex: null,
      noduleCompressChildrenIndices: [],
      confirmCompressing: false,

      firstTabActiveIndex: 1,

      //cornerstoneElement
      imageIds: [],
      mousemovePos: {
        startX: 0,
        startY: 0,
        imageX: 0,
        imageY: 0,
      },
      cornerImageIdIndex: 0,
      cornerImage: null,
      cornerIsPlaying: false,
      cornerFrameRate: 30,
      cornerActiveTool: 'StackScroll',
      cornerIsOverlayVisible: true,
      cornerMouseCoordVisible: false,
      cornerMouseInside: true,
      cornerAnnoVisible: true,
      cornerBiVisible: false,
      cornerElement: null,
      cornerViewport: {
        scale: 1,
        invert: false,
        pixelReplication: false,
        voi: {
          windowWidth: 1800,
          windowCenter: -400,
        },
        translation: {
          x: 0,
          y: 0,
        },
      },
      cornerImageSize: {
        rows: 512,
        columns: 512,
      },
      cornerstoneZoomScaleConfig: {
        invert: false,
        preventZoomOutsideImage: false,
        minScale: 0.25,
        maxScale: 20.0,
      },
      loadedImagePercent: 0,
      studyListShowed: false,
      showFollowUp: false,
      show3DVisualization: false,
      showMPRDirectly: false,

      sliderMarks: {},
      boxes: [],
      drawingNodulesCompleted: false,

      needReloadBoxes: false,
      needRedrawBoxes: false,
      noduleMarks: {},
      listsActiveIndex: -1, //??????list??????item
      loadedImages: {},
      needUpdateLoadedImages: 0,

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

      settingOpen: false,
      pdfReading: false,
      pdfLoadingCompleted: false,

      toolState: '',
      windowWidth: document.body.clientWidth,
      windowHeight: document.body.clientHeight,
      histogramHeight: 0,
      verticalMode: document.body.clientWidth < document.body.clientHeight ? true : false,
      slideSpan: 0,
      imageCaching: false,

      threeDimensionalPixelData: null,
      threeDimensionalPixelDataZero: null,
      bdVolumes: null,
      bdImageData: null,
      displayBorder: false,

      //studybrowserList
      dateSeries: [],
      previewVisible: [],
      dataValidContnt: [],

      //MiniReport
      reportGuideActive: true,
      reportImageActive: true,
      reportGuideType: '????????????',
      reportImageType: '????????????',
      reportGuideText: '',
      reportImageText: '',
      reportImageTop: 0,
      reportImageHeight: 0,
      reportImageContentHeight: 0,
      patientName: '',
      patientBirth: '',
      patientSex: '',

      /*???????????? */
      nodules: [],
      noduleColorSetting: false,
      noduleColor: 'rgba(255,255,0,1)',
      nodulesAllChecked: false,
      smallNodulesChecked: true,
      noduleLimited: false,
      nodulesOrder: {
        slice_idx: 1,
        long_length: 0,
        texture: 0,
        malignancy: 0,
      },
      noduleOrderOption: [
        {
          desc: '?????????',
          key: 'slice_idx',
          sortable: true,
        },
        {
          desc: '????????????',
          key: 'long_length',
          sortable: true,
        },
        {
          desc: '????????????',
          key: 'texture',
          sortable: true,
        },
        {
          desc: '?????????',
          key: 'malignancy',
          sortable: true,
        },
      ],
      nodulesSelect: [
        {
          key: 0,
          options: ['??????', '?????????', '?????????', '?????????', '?????????', '?????????', '???????????????', '?????????', '???????????????', '?????????', '??????????????????', '??????'],
          checked: new Array(12).fill(true),
        },
        {
          key: 1,
          desc: '????????????',
          options: ['<=0.3cm', '0.3cm-0.5cm', '0.5cm-1cm', '1cm-1.3cm', '1.3cm-3cm', '>=3cm'],
          checked: new Array(6).fill(true),
        },
        {
          key: 2,
          desc: '?????????',
          options: ['??????', '??????', '??????', '??????'],
          checked: new Array(4).fill(true),
        },
      ],
      nodulesAllSelected: true,
      ctImagePadding: 0,
      menuNowPage: 1,
      menuButtonsWidth: 1540,
      menuScrollable: false,
      menuTransform: 0,
      renderLoading: false,
      registering: false,
      slabThickness: 1,

      /*????????????*/
      bottomRowHeight: 0,
      viewerWidth: 0,
      viewerHeight: 0,
      maskWidth: 0,
      maskHeight: 0,

      /*3d??????*/
      urls: [],
      nodulesData: null,
      lobesData: null,
      tubularData: null,
      segments: [],
      pointActors: [],

      /*????????????*/
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

      /*????????????*/
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

      /*????????????*/
      voi: { windowWidth: 1800, windowCenter: -400 },
      origin: [0, 0, 0],
      labelThreshold: 300,
      labelColor: [255, 0, 0],
      paintRadius: 5,

      /*????????????*/
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

      /*????????????*/
      volumesLoading: true,
      percent: [],
      noThreedData: false,
      listLoading: [],
      HUSliderRange: [-100, 100],
      chartType: 'line',
    }
    this.config = JSON.parse(localStorage.getItem('config'))
    this.threeDimensionalPixelDataZero = null
    this.threeDimensionalPixelData = null
    this.subs = {
      cornerImageRendered: createSub(),
      cornerMouseUp: createSub(),
      cornerMouseMove: createSub(),
      cornerMouseDrag: createSub(),
      cornerMeasureAdd: createSub(),
      cornerMeasureModify: createSub(),
      cornerMeasureComplete: createSub(),
      cornerMeasureRemove: createSub(),
      cornerstonetoolstouchdragend: createSub(),
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
    if (imageIds[0]) {
      await cornerstone.loadAndCacheImage(imageIds[0]).then((image) => {
        const imageData = image.data
        const noduleSpacing = String(imageData.string('x00280030')).split('\\')[0]
        this.setState({
          noduleSpacing,
        })
      })
    }

    let cornerImageIdIndex = 0
    let listsActiveIndex = -1
    let noduleMarks = {}
    let spacing = this.state.noduleSpacing
    let ll, sl, dia
    if (nodules && nodules.length) {
      //sort and save previous index
      nodules.forEach((item, index) => {
        item.prevIdx = parseInt(item.nodule_no)
        item.delOpen = false
        item.malOpen = false
        item.textOpen = false
        item.visible = true
        item.compressed = false
        // if (item.measure) {
        //   if (spacing) {
        //     ll = Math.sqrt(Math.pow(item.measure.x1 - item.measure.x2, 2) + Math.pow(item.measure.y1 - item.measure.y2, 2)) * spacing
        //     sl = Math.sqrt(Math.pow(item.measure.x3 - item.measure.x4, 2) + Math.pow(item.measure.y3 - item.measure.y4, 2)) * spacing
        //   } else {
        //     ll = Math.sqrt(Math.pow(item.measure.x1 - item.measure.x2, 2) + Math.pow(item.measure.y1 - item.measure.y2, 2))
        //     sl = Math.sqrt(Math.pow(item.measure.x3 - item.measure.x4, 2) + Math.pow(item.measure.y3 - item.measure.y4, 2))
        //   }
        // }
        // if (spacing) {
        //   dia = item.diameter * spacing
        // } else {
        //   dia = item.diameter
        // }
        // if (item.measure && (sl !== 0 || ll !== 0)) {
        //   if ((ll / 10).toFixed(2) < this.config.smallNodulesDiameter && (sl / 10).toFixed(2) < this.config.smallNodulesDiameter) {
        //     item.visible = false
        //   } else {
        //     item.visible = true
        //   }
        // } else {
        //   if ((dia / 10).toFixed(2) < this.config.smallNodulesDiameter) {
        //     item.visible = false
        //   } else {
        //     item.visible = true
        //   }
        // }

        item.recVisible = true
        item.biVisible = this.config.longShortDiamShow
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
      } else {
        try {
          nodules.forEach((item, index) => {
            if (item.visible) {
              cornerImageIdIndex = nodules[index].slice_idx
              listsActiveIndex = index
              throw Error()
            }
          })
        } catch (e) {}
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
        this.loadAllInfo()
      }
    )

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
  async loadAllInfo() {
    axios
      .post(
        this.config.user.getCustomConfig,
        qs.stringify({
          username: this.state.username,
        })
      )
      .then((res) => {
        if (res.status === 200) {
          console.log('getCustomConfig', res)
          const nodulesOrder = JSON.parse(res.data.filterAndSorter)
          this.setState({
            nodulesOrder,
          })
        }
      })
      .catch((e) => {
        console.log(e)
      })

    const token = localStorage.getItem('token')
    const headers = {
      Authorization: 'Bearer '.concat(token),
    }

    const { imageIds, cornerImageIdIndex, nodules } = this.state
    // console.log('imageIds', this.state.imageIds, this.state.imageIds[cornerImageIdIndex])
    cornerstone.loadAndCacheImage(imageIds[cornerImageIdIndex]).then((image) => {
      console.log('first imageId', image)
      const imageData = image.data
      const patientId = imageData.string('x00100020')
      const noduleSpacing = String(imageData.string('x00280030')).split('\\')[0]
      const cornerImageRows = image.rows
      const cornerImageColumns = image.columns
      const cornerImageSize = {
        rows: cornerImageRows,
        columns: cornerImageColumns,
      }

      this.setState({
        patientId,
        cornerImageSize,
        noduleSpacing,
      })
    })
    executeTask()
    this.loadDisplay()
    let allImageIds = []
    let annoImageIds = []
    let annoRoundImageIds = []
    imageIds.forEach((imageId, imageIndex) => {
      allImageIds.push({
        imageId: imageId,
        index: imageIndex,
      })
    })
    nodules.forEach((boxItem, boxIndex) => {
      let nowSliceIndex = boxItem.slice_idx
      const annoImageItem = {
        imageId: imageIds[nowSliceIndex],
        index: nowSliceIndex,
      }
      annoImageIds.push(annoImageItem)
      for (let j = nowSliceIndex - 5; j < nowSliceIndex + 5; j++) {
        if (_.inRange(j, 0, imageIds.length)) {
          const annoRoundImageItem = {
            imageId: imageIds[j],
            index: j,
          }
          annoRoundImageIds.push(annoRoundImageItem)
        }
      }
    })
    annoImageIds = _.uniqBy(annoImageIds, 'index')
    const annoPromises = annoImageIds.map((annoImageItem, annoImageIndex) => {
      return loadAndCacheImagePlus(annoImageItem.imageId, 2).then((image) => {
        this.props.updateLoadedImageNumber(annoImageItem.index, this.state.caseId)
        // this.updateLoadedImageNumber(annoImageItem.index, this.state.caseId)
      })
    })
    console.time('annoPromises')
    Promise.all(annoPromises).then(() => {
      console.timeEnd('annoPromises')
    })
    annoRoundImageIds = _.uniqBy(annoRoundImageIds, 'index')
    annoRoundImageIds = _.differenceBy(annoRoundImageIds, annoImageIds, 'index')
    const annoRoundPromises = annoRoundImageIds.map((annoRoundImageItem, annoRoundImageIndex) => {
      return loadAndCacheImagePlus(annoRoundImageItem.imageId, 3).then((image) => {
        this.props.updateLoadedImageNumber(annoRoundImageItem.index, this.state.caseId)
        // this.updateLoadedImageNumber(annoRoundImageItem.index, this.state.caseId)
      })
    })
    console.time('annoRoundPromises')
    Promise.all(annoRoundPromises).then(() => {
      console.timeEnd('annoRoundPromises')
    })
    // this.loadStudyBrowser()
    this.loadReport()
    // axios
    //   .post(
    //     this.config.draft.getLymphs,
    //     qs.stringify({
    //       caseId: this.state.caseId,
    //       username: 'deepln',
    //     })
    //   )
    //   .then((res) => {
    //     console.log('lymph request', res)
    //     const data = res.data

    //     if (data && data.length) {
    //       const lymphMarks = {}
    //       data.forEach((item, index) => {
    //         const itemLymph = item.lymph
    //         item.slice_idx = itemLymph.slice_idx
    //         item.volume = Math.abs(itemLymph.x1 - itemLymph.x2) * Math.abs(itemLymph.y1 - itemLymph.y2) * Math.pow(10, -4)
    //         lymphMarks[item.slice_idx] = ''
    //       })
    //       data.sort(this.arrayPropSort('slice_idx', 1))
    //       data.forEach((item, index) => {
    //         item.name = `?????????${index + 1}`
    //         item.visibleIdx = index
    //         item.recVisible = true
    //       })
    //       this.setState({
    //         lymphMarks,
    //       })
    //       this.saveLymphData(data)
    //     }
    //   })
    allImageIds = _.differenceBy(allImageIds, annoImageIds, 'index')
    allImageIds = _.differenceBy(allImageIds, annoRoundImageIds, 'index')
    const allPromises = allImageIds.map((allImageItem, imageIndex) => {
      // console.log(imageId)
      return loadAndCacheImagePlus(allImageItem.imageId, 4).then((image) => {
        this.props.updateLoadedImageNumber(allImageItem.index, this.state.caseId)
        // this.updateLoadedImageNumber(allImageItem.index, this.state.caseId)
      })
    })
    console.time('allPromises')
    await Promise.all(allPromises).then(() => {
      console.timeEnd('allPromises')
    })
    console.log('imageIds loading completed')

    await axios
      .post(
        this.config.data.getMhaListForCaseId,
        qs.stringify({
          caseId: this.state.caseId,
          modelName: this.state.readonly ? this.state.modelName : '',
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
              const tmpSplit = urlItem.split('_')
              order = Math.round(tmpSplit[tmpSplit.length - 1].split('.')[0])
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
            this.DownloadSegment(item.index, urls)
          })
        } else {
          this.setState({
            noThreedData: true,
          })
        }
      })
      .catch((error) => {
        console.log(error)
        this.setState({
          noThreedData: true,
        })
      })
    function sortByProp(prop) {
      return function (a, b) {
        var value1 = a[prop]
        var value2 = b[prop]
        return value1 - value2
      }
    }

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
        } else {
          const lobesData = []
          const data = [
            {
              name: 1,
            },
            {
              name: 2,
            },
            {
              name: 3,
            },
            {
              name: 4,
            },
            {
              name: 5,
            },
          ]
          data.forEach((item, index) => {
            const lobeIndex = _.findIndex(this.state.urls, {
              order: item.name,
            })
            if (lobeIndex !== -1) {
              item.index = this.state.urls[lobeIndex].index
              item.lobeName = lobeName[item.name]
              item.volume = 0
              item.percent = 0
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
        name: '??????',
        number: '??????',
        index: this.state.urls[airwayIndex].index,
      })
    }
    const vesselIndex = _.findIndex(this.state.urls, { class: 4 })
    if (vesselIndex !== -1) {
      tubularData.push({
        name: '??????',
        number: '??????',
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
  updateLoadedImageNumber(index, caseId) {
    const loadedImageIndex = index
    const loadedImages = this.state.loadedImages
    if (loadedImages[caseId] === undefined) {
      loadedImages[caseId] = {}
    }
    loadedImages[caseId][loadedImageIndex] = 1
    this.setState({
      loadedImages,
      needUpdateLoadedImages: _.random(0, 100),
    })
  }
  componentDidUpdate(prevProps, prevState) {
    if (prevProps.needUpdateLoadedImages !== this.props.needUpdateLoadedImages) {
      if (this.props.loadedImages) {
        const loadedCaseIds = Object.keys(this.props.loadedImages)
        loadedCaseIds.forEach((loadedCaseId) => {
          const nowValue = Object.keys(this.props.loadedImages[loadedCaseId]).length
          const dateSeries = this.state.dateSeries
          for (let i = 0; i < dateSeries.length; i++) {
            const dateSerie = dateSeries[i]
            const dateIndex = _.findIndex(dateSerie, { caseId: loadedCaseId })
            if (dateIndex !== -1) {
              if (nowValue % 20 === 0 || nowValue === dateSerie[dateIndex].imageLength) {
                dateSerie[dateIndex].loadedNumber = nowValue
                this.setState({
                  dateSeries,
                })
              }
            }
          }
        })
      }
    }
    // if (prevState.needUpdateLoadedImages !== this.state.needUpdateLoadedImages) {
    //   if (this.props.loadedImages) {
    //     const loadedCaseIds = Object.keys(this.state.loadedImages)
    //     loadedCaseIds.forEach((loadedCaseId) => {
    //       const nowValue = Object.keys(this.state.loadedImages[loadedCaseId]).length
    //       const dateSeries = this.state.dateSeries
    //       for (let i = 0; i < dateSeries.length; i++) {
    //         const dateSerie = dateSeries[i]
    //         const dateIndex = _.findIndex(dateSerie, { caseId: loadedCaseId })
    //         if (dateIndex !== -1) {
    //           if (nowValue % 20 === 0 || nowValue === dateSerie[dateIndex].imageLength) {
    //             dateSerie[dateIndex].loadedNumber = nowValue
    //             this.setState({
    //               dateSeries,
    //             })
    //           }
    //         }
    //       }
    //     })
    //   }
    // }
    if (prevState.immersive !== this.state.immersive) {
    }
    if (!prevState.patientId && this.state.patientId) {
      this.loadStudyBrowser()
    }
    if (prevState.cornerImageSize !== this.state.cornerImageSize) {
      console.log('first imageId need reset')
      this.onResetView()
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
    if (!_.isEqual(prevState.nodulesOrder, this.state.nodulesOrder)) {
      console.log('needSort', prevState.nodulesOrder, this.state.nodulesOrder)
      this.sortBoxes()
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
    // boxes modified need reload template
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

    if (prevState.noduleColor !== this.state.noduleColor) {
      this.setState({
        needRedrawBoxes: true,
      })
    }
    if (prevState.noduleColorSetting !== this.state.noduleColorSetting && this.state.noduleColorSetting) {
      this.setState({
        needRedrawBoxes: true,
      })
    }
  }
  redrawCorner() {
    // console.log('redrawCorner')
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
              savedDataItem.visible = boxes[boxIndex].recVisible && boxes[boxIndex].visible
              break
            case 'Bidirectional':
              savedDataItem.visible = boxes[boxIndex].biVisible
              break
            default:
              break
          }
          if (this.state.noduleColorSetting) {
            console.log('hello')
            const color = this.state.noduleColor
            savedDataItem.color = color
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
    axios.post(this.config.record.getSubListForMainItem, qs.stringify(params)).then((response) => {
      const data = response.data
      console.log('getSubListForMainItem response', response)
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
              console.log('getSubListForMainItem response', dicom)

              count += 1
              theList[idx].push({
                date: key,
                caseId: serie.caseId,
                Description: serie.description,
                href: '/case/' + serie.caseId.replace('#', '%23') + '/' + annotype.data,
                image: dicom.data[parseInt(dicom.data.length / 3)],
                imageLength: dicom.data.length,
                validInfo: dataValidRes.data,
                loadedNumber: 0,
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
    // Create buffer the size of the 3D volume
    const dimensions = this.state.dimensions
    const width = dimensions[0]
    const height = dimensions[1]
    const depth = dimensions[2]
    const numVolumePixels = width * height * depth

    // If you want to load a segmentation labelmap, you would want to load
    // it into this array at this point.
    const threeDimensionalPixelData = new Float32Array(numVolumePixels)
    const threeDimensionalPixelDataZero = new Float32Array(numVolumePixels).fill(0)

    this.threeDimensionalPixelData = threeDimensionalPixelData
    this.threeDimensionalPixelDataZero = threeDimensionalPixelDataZero
    // console.log('threeDimensionalPixelData', threeDimensionalPixelData)
    // console.log('threeDimensionalPixelDataZero', threeDimensionalPixelDataZero)
    // segmentationModule.configuration.arrayType = 1

    // Use Float32Arrays in cornerstoneTools for interoperability.

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
          // axios
          //   .get(this.config.prefusion.lobeCoord + `?caseId=${this.state.caseId}`)
          //   .then((res) => {
          //     const border = res.data
          //     const result = this.generateLobeBorder(border, threeDimensionalPixelData)
          //     // resolve(result)
          //     const { actor: bdVolumes, imageData: bdImageData } = result
          //     this.setState({
          //       bdVolumes: [bdVolumes],
          //       bdImageData,
          //     })
          //   })
          //   .catch((e) => {
          //     console.log(e)
          //   })
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
    //   interpolateScalarsBeforeMapping: false, //????????????
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
  DownloadSegment(idx, urls) {
    const progressCallback = (progressEvent) => {
      const percent = Math.floor((100 * progressEvent.loaded) / progressEvent.total)
      const tmp_percent = this.state.percent
      tmp_percent[idx] = percent
      this.setState({ percent: tmp_percent })
    }
    const color = urls[idx].color
    const cl = urls[idx].class
    const cur_url = urls[idx].url + '?caseId=' + this.state.caseId
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
  generateLobeBorder(border, threeDimensionalPixelData) {
    const { vtkImageData: vtkOriImageData, dimensions } = this.state
    const data = vtkOriImageData.getPointData().getScalars().getData()
    // const pixelArray = new Float32Array(dimensions[0] * dimensions[1] * dimensions[1]).fill(0)
    const pixelArray = threeDimensionalPixelData
    // const oriRange = vtkOriImageData.getPointData().getScalars().getRange()
    // console.log('border oriRange', oriRange)

    for (let lobe in border) {
      if (border[lobe] && border[lobe].length) {
        border[lobe].forEach((point) => {
          let newZ = point[0]
          let newY = point[1]
          let newX = point[2]
          for (let i = newZ - 2; i < newZ + 2; i++) {
            for (let j = newY - 2; j < newY + 2; j++) {
              for (let k = newX - 2; k < newX + 2; k++) {
                const nowIndex = k + j * dimensions[0] + i * dimensions[0] * dimensions[1]
                if (nowIndex >= 0 && nowIndex < data.length) {
                  pixelArray[nowIndex] = Number(lobe[lobe.length - 1]) * 100
                }
              }
            }
          }
          // const nowIndex = newX + newY * dimensions[0] + newZ * dimensions[0] * dimensions[1]
          // pixelArray[nowIndex] = Number(lobe[lobe.length - 1]) * 100
        })
      }
    }

    const imageData = vtkImageData.newInstance()
    const scalarArray = vtkDataArray.newInstance({
      name: 'border',
      numberOfComponents: 1,
      values: pixelArray,
    })
    imageData.setDimensions(...dimensions)
    imageData.setSpacing(...vtkOriImageData.getSpacing())
    imageData.setOrigin(...vtkOriImageData.getOrigin())
    const direction = vtkOriImageData.getDirection()
    imageData.setDirection(...direction)
    // imageData.setSpacing(...spacing)
    // imageData.setOrigin(...origin)
    // imageData.setDirection(...direction)

    imageData.getPointData().setScalars(scalarArray)
    // const { actor, mapper } = this.createActorMapper(imageData)
    const mapper = vtkVolumeMapper.newInstance()
    mapper.setInputData(imageData)

    const actor = vtkVolume.newInstance()
    actor.setMapper(mapper)

    const range = imageData.getPointData().getScalars().getRange()
    const rgbTransferFunction = actor.getProperty().getRGBTransferFunction(0)

    const voi = this.state.voi

    const low = voi.windowCenter - voi.windowWidth / 2
    const high = voi.windowCenter + voi.windowWidth / 2

    rgbTransferFunction.setMappingRange(low, high)

    const cfun = vtkColorTransferFunction.newInstance()
    cfun.addRGBPoint(0, 0.0, 0.0, 0.0)
    cfun.addRGBPoint(100, 0.7, 0.6, 0.32)
    cfun.addRGBPoint(200, 0.26, 0.44, 0.26)
    cfun.addRGBPoint(300, 0.45, 0.24, 0.16)
    cfun.addRGBPoint(400, 0.19, 0.48, 0.58)
    cfun.addRGBPoint(500, 0.46, 0.59, 0.71)

    const ofun = vtkPiecewiseFunction.newInstance()
    ofun.addPoint(0, 0.0)
    ofun.addPoint(100, 1.0)
    ofun.addPoint(500, 1.0)

    actor.getProperty().setRGBTransferFunction(0, cfun)
    actor.getProperty().setScalarOpacity(0, ofun)

    // const result = volumes.concat(actor)
    // const element = this.cornerstoneElements[0]
    // cornerstone.updateImage(element)

    return { actor, imageData }
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
    this.menuButtonsCalc()
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
              const cornerImageSize = this.state.cornerImageSize
              // console.log('resizeScreen', this.state.imageIds)
              // const firstImageId = this.state.imageIds[this.state.imageIds - 1]
              // cornerstone.loadImage(firstImageId).then((img) => {
              //   console.log('scale img', img)
              // })
              const cornerViewport = {
                ...this.state.cornerViewport,
                scale: ctImageBlockHeight / cornerImageSize.rows,
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
    if (!document.getElementById('menu-item-logo') || !document.getElementById('menu-item-user') || !document.getElementById('menu-item-buttons')) {
      return
    }
    const logoWidth = document.getElementById('menu-item-logo').clientWidth
    const userWidth = document.getElementById('menu-item-user').clientWidth
    const menuButtonsWidth = screenWidth - logoWidth - userWidth //????????????
    const menuItemButtons = document.getElementById('menu-item-buttons')
    console.log('buttons', screenWidth, logoWidth, userWidth, menuButtonsWidth)
    console.log('buttons', menuItemButtons.scrollWidth, menuItemButtons.clientWidth)
    const menuTotalPages = Math.ceil(menuItemButtons.scrollWidth / menuButtonsWidth)
    let menuNowPage = this.state.menuNowPage
    let menuTransform = this.state.menuTransform
    if (menuNowPage > menuTotalPages) {
      menuNowPage = menuTotalPages
      menuTransform = (menuNowPage - 1) * menuButtonsWidth
    }
    const menuScrollable = menuTotalPages > 1
    console.log('buttons', menuNowPage, menuTotalPages, menuScrollable)
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
              // this.resizeScreen()
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
      const cornerImageSize = this.state.cornerImageSize
      // const firstImageId = this.state.imageIds[0]
      // cornerstone.loadImage(firstImageId).then((img) => {
      //   const defView = cornerstone.getDefaultViewport(this.state.cornerElement, img)
      //   defView.scale = ctImageBlockHeight / 1024
      //   cornerstone.displayImage(this.state.cornerElement, img, defView)
      // })
      cornerViewport.translation.x = 0
      cornerViewport.translation.y = 0
      cornerViewport.scale = ctImageBlockHeight / cornerImageSize.columns
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
      windowWidth: 1800,
      windowCenter: -400,
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
      // if (!visible) {
      //   boxItem.biVisible = visible
      // }
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
  onSetMouseCoordVisible(visible) {
    this.setState({
      cornerMouseCoordVisible: visible,
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
          message.success('?????????????????????')
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
          message.success('????????????')
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
      delete backendNodules[currentIdx].textOpen
      delete backendNodules[currentIdx].malOpen
      delete backendNodules[currentIdx].compressed
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
          message.success('????????????')
          window.location.href = window.location.pathname.split('/')[0] + '/' + window.location.pathname.split('/')[1] + '/' + window.location.pathname.split('/')[2] + '/deepln'
        } else {
          message.error('????????????,??????????????????')
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
        message.error('??????3D??????')
      } else {
        message.warn('????????????3D??????????????????')
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
        showMPRDirectly: false,
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
  goMPRDirectly() {
    clearTimeout(flipTimer)
    if (!(this.state.urls && this.state.urls.length)) {
      if (this.state.noThreedData) {
        message.error('??????3D??????')
      } else {
        message.warn('????????????3D??????????????????')
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
          showMPRDirectly: true,
          MPR: true,
        },
        () => {
          this.resizeScreen()
          this.changeMode(4)
          // this.setMPR()
        }
      )
    }, 500)
  }
  showFollowUp() {
    this.onSetStudyList(true)
    this.onSetAnimationPlaying(false)
    const { cornerElement, boxes } = this.state
    cornerstoneTools.clearToolState(cornerElement, 'RectangleRoi')
    cornerstoneTools.clearToolState(cornerElement, 'Bidirectional')
    cornerstoneTools.clearToolState(cornerElement, 'Length')
    if (boxes && boxes.length) {
      boxes.forEach((boxItem, boxIndex) => {
        delete boxItem.uuid
        delete boxItem.biuuid
      })
    }
    this.setState({
      drawingNodulesCompleted: false,
      showFollowUp: true,
    })
  }
  hideFollowUp() {
    if (this.props.followUpLoadingCompleted) {
      this.hideFollowUpOp()
    } else {
      const hide = message.loading('???????????????????????????????????????', 0)
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
        this.changeImageIndex()
        this.resizeScreen()
      }
    )
  }
  changeImageIndex() {
    const { listsActiveIndex, boxes, cornerImageIdIndex } = this.state
    let tmpImageIdIndex = cornerImageIdIndex
    if (cornerImageIdIndex === 0) {
      tmpImageIdIndex = 1
      console.log('????????????ct')
    } else if (cornerImageIdIndex === 1) {
      tmpImageIdIndex = 0
      console.log('????????????ct')
    } else if (cornerImageIdIndex > 1) {
      if (boxes && boxes.length && listsActiveIndex !== -1) {
        tmpImageIdIndex = boxes[listsActiveIndex].slice_idx
        console.log('???????????????')
      } else {
        tmpImageIdIndex = 0
        console.log('????????????ct')
      }
    }
    this.setState(
      {
        cornerImageIdIndex: tmpImageIdIndex,
      },
      () => {
        this.redrawCorner()
      }
    )
  }
  enter3DSlicer() {
    axios.get(this.config.data.slicerJumpUrl + `?caseId=${this.state.caseId}`).then((res) => {
      // console.log("slicerJumpUrl response", res)
      if (res && res.data) {
        window.open(res.data)
      }
    })
  }
  toggleLobeBorder() {
    const { displayBorder, imageIds, bdImageData } = this.state
    if (!imageIds) {
      return
    }
    if (!bdImageData) {
      message.error('????????????????????????')
      return
    }
    if (displayBorder) {
      const buffer = this.threeDimensionalPixelDataZero.buffer
      const numberOfFrames = imageIds.length

      segmentationModule.setters.labelmap3DByFirstImageId(imageIds[0], buffer, 0, [], numberOfFrames, undefined, 0)
    } else {
      const buffer = this.threeDimensionalPixelData.buffer
      const numberOfFrames = imageIds.length

      segmentationModule.setters.labelmap3DByFirstImageId(imageIds[0], buffer, 0, [], numberOfFrames, undefined, 0)
    }
    this.setState({
      displayBorder: !displayBorder,
    })
  }

  toHomepage() {
    window.location.href = '/homepage'
    // this.nextPath('/homepage/' + params.caseId + '/' + res.data)
  }

  setSettingOpen(open) {
    this.setState({
      settingOpen: open,
    })
  }
  onChangeNoduleColorSetting(setting) {
    this.setState({
      noduleColorSetting: setting,
    })
    if (!setting) {
      this.setState({
        noduleColor: 'rgba(255,255,0,1)',
      })
    }
  }
  setNoduleColor(e) {
    // console.log('noduleColor', e)
    this.setState({
      noduleColor: e.rgba,
    })
  }
  clearLocalStorage() {
    localStorage.clear()
    message.success('????????????')
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
          message.error('???????????????????????????????????????')
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
  onHandleSmallNodulesCheckChange() {
    const boxes = this.state.boxes
    const selectedPro = []
    const selectedLong = []
    const selectedMal = []
    const nodulesSelect = this.state.nodulesSelect
    const smallNodulesChecked = !this.state.smallNodulesChecked
    const spacing = this.state.noduleSpacing
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
          if (spacing) {
            boxItemLL = Math.sqrt(Math.pow(boxItem.measure.x1 - boxItem.measure.x2, 2) + Math.pow(boxItem.measure.y1 - boxItem.measure.y2, 2)) * spacing
          } else {
            boxItemLL = Math.sqrt(Math.pow(boxItem.measure.x1 - boxItem.measure.x2, 2) + Math.pow(boxItem.measure.y1 - boxItem.measure.y2, 2))
          }
        } else {
          if (spacing) {
            boxItemLL = boxItem.diameter * spacing
          } else {
            boxItemLL = boxItem.diameter
          }
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
      let ll, sl, dia
      if (boxItem.measure) {
        if (spacing) {
          ll = Math.sqrt(Math.pow(boxItem.measure.x1 - boxItem.measure.x2, 2) + Math.pow(boxItem.measure.y1 - boxItem.measure.y2, 2)) * spacing
          sl = Math.sqrt(Math.pow(boxItem.measure.x3 - boxItem.measure.x4, 2) + Math.pow(boxItem.measure.y3 - boxItem.measure.y4, 2)) * spacing
        } else {
          ll = Math.sqrt(Math.pow(boxItem.measure.x1 - boxItem.measure.x2, 2) + Math.pow(boxItem.measure.y1 - boxItem.measure.y2, 2))
          sl = Math.sqrt(Math.pow(boxItem.measure.x3 - boxItem.measure.x4, 2) + Math.pow(boxItem.measure.y3 - boxItem.measure.y4, 2))
        }
      }
      if (spacing) {
        dia = boxItem.diameter * spacing
      } else {
        dia = boxItem.diameter
      }

      if (boxItem.measure && (sl !== 0 || ll !== 0)) {
        if ((ll / 10).toFixed(2) < this.config.smallNodulesDiameter && (sl / 10).toFixed(2) < this.config.smallNodulesDiameter) {
          if (boProSelected && boDiamSelected && boMalSelected && smallNodulesChecked) {
            boxes[boIndex].visible = true
          } else {
            boxes[boIndex].visible = false
          }
        } else {
          if (boProSelected && boDiamSelected && boMalSelected) {
            boxes[boIndex].visible = true
          } else {
            boxes[boIndex].visible = false
          }
        }
      } else {
        if ((dia / 10).toFixed(2) < this.config.smallNodulesDiameter) {
          if (boProSelected && boDiamSelected && boMalSelected && smallNodulesChecked) {
            boxes[boIndex].visible = true
          } else {
            boxes[boIndex].visible = false
          }
        } else {
          if (boProSelected && boDiamSelected && boMalSelected) {
            boxes[boIndex].visible = true
          } else {
            boxes[boIndex].visible = false
          }
        }
      }
    })
    if (this.state.show3DVisualization) {
      this.setState({
        boxes,
        smallNodulesChecked,
      })
    } else {
      this.setState({
        boxes,
        smallNodulesChecked,
        needReloadBoxes: true,
        needRedrawBoxes: true,
      })
    }
  }
  onHandleSmallNodulesCheckClick(e) {
    e.stopPropagation()
  }
  onHandleNoduleLimitChange() {
    const boxes = this.state.boxes
    const noduleLimited = !this.state.noduleLimited
    this.setState({
      noduleLimited,
      boxes,
    })
  }
  onHandleNoduleLimitClick(e) {
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
    axios
      .post(
        this.config.user.saveCustomConfig,
        qs.stringify({
          username: this.state.username,
          filterAndSorter: JSON.stringify(nodulesOrder),
        })
      )
      .then((res) => {
        console.log('saveCustomConfig', res)
      })
      .catch((e) => {
        console.log(e)
      })
    this.sortBoxes()
    // this.setState({
    //   nodulesOrder,
    // })
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
    this.sortBoxes()
    // this.setState({
    //   nodulesOrder,
    // })
  }
  sortBoxes() {
    const boxes = this.state.boxes
    const nodulesOrder = this.state.nodulesOrder
    const keys = Object.keys(nodulesOrder)
    const spacing = this.state.noduleSpacing
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
                if (o.measure) {
                  if (spacing) {
                    ll = Math.sqrt(Math.pow(o.measure.x1 - o.measure.x2, 2) + Math.pow(o.measure.y1 - o.measure.y2, 2)) * spacing
                  } else {
                    ll = Math.sqrt(Math.pow(o.measure.x1 - o.measure.x2, 2) + Math.pow(o.measure.y1 - o.measure.y2, 2))
                  }
                } else {
                  ll = o.diameter
                }
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
    const smallNodulesChecked = this.state.smallNodulesChecked
    const spacing = this.state.noduleSpacing
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
                // selectedPro.push({
                //   key: 'calcification',
                //   val: 2,
                // })
                selectedPro.push({
                  key: 'texture',
                  val: 4,
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
          if (spacing) {
            boxItemLL = Math.sqrt(Math.pow(boxItem.measure.x1 - boxItem.measure.x2, 2) + Math.pow(boxItem.measure.y1 - boxItem.measure.y2, 2)) * spacing
          } else {
            boxItemLL = Math.sqrt(Math.pow(boxItem.measure.x1 - boxItem.measure.x2, 2) + Math.pow(boxItem.measure.y1 - boxItem.measure.y2, 2))
          }
        } else {
          if (spacing) {
            boxItemLL = boxItem.diameter * spacing
          } else {
            boxItemLL = boxItem.diameter
          }
        }
        selectedLong.forEach((longItem, diaIndex) => {
          if (boxItemLL <= longItem.max && boxItemLL >= longItem.min) {
            boDiamSelected = true
          }
        })
        // let diameter
        // if (spacing) {
        //   diameter = boxItem.diameter * spacing
        // } else {
        //   diameter = boxItem.diameter
        // }
        // selectedLong.forEach((longItem, diaIndex) => {
        //   if (diameter <= longItem.max && diameter >= longItem.min) {
        //     boDiamSelected = true
        //   }
        // })
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
      let ll, sl, dia
      if (boxItem.measure) {
        if (spacing) {
          ll = Math.sqrt(Math.pow(boxItem.measure.x1 - boxItem.measure.x2, 2) + Math.pow(boxItem.measure.y1 - boxItem.measure.y2, 2)) * spacing
          sl = Math.sqrt(Math.pow(boxItem.measure.x3 - boxItem.measure.x4, 2) + Math.pow(boxItem.measure.y3 - boxItem.measure.y4, 2)) * spacing
        } else {
          ll = Math.sqrt(Math.pow(boxItem.measure.x1 - boxItem.measure.x2, 2) + Math.pow(boxItem.measure.y1 - boxItem.measure.y2, 2))
          sl = Math.sqrt(Math.pow(boxItem.measure.x3 - boxItem.measure.x4, 2) + Math.pow(boxItem.measure.y3 - boxItem.measure.y4, 2))
        }
      }
      if (spacing) {
        dia = boxItem.diameter * spacing
      } else {
        dia = boxItem.diameter
      }

      if (boxItem.measure && (sl !== 0 || ll !== 0)) {
        if ((ll / 10).toFixed(2) < this.config.smallNodulesDiameter && (sl / 10).toFixed(2) < this.config.smallNodulesDiameter) {
          if (boProSelected && boDiamSelected && boMalSelected && smallNodulesChecked) {
            boxes[boIndex].visible = true
          } else {
            boxes[boIndex].visible = false
          }
        } else {
          if (boProSelected && boDiamSelected && boMalSelected) {
            boxes[boIndex].visible = true
          } else {
            boxes[boIndex].visible = false
          }
        }
      } else {
        if ((dia / 10).toFixed(2) < this.config.smallNodulesDiameter) {
          if (boProSelected && boDiamSelected && boMalSelected && smallNodulesChecked) {
            boxes[boIndex].visible = true
          } else {
            boxes[boIndex].visible = false
          }
        } else {
          if (boProSelected && boDiamSelected && boMalSelected) {
            boxes[boIndex].visible = true
          } else {
            boxes[boIndex].visible = false
          }
        }
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
      if (this.state.MPR) {
        if (this.state.painting && newIndex !== -1) {
          this.createNoduleMask(index)
          this.setState({
            displayCrosshairs: true,
          })
          this.toggleCrosshairs(true)
        } else if (newIndex !== -1) {
          try {
            const noduleSpacing = this.state.noduleSpacing
            const boxItem = this.state.boxes[index]
            const halfX = ((boxItem.x1 + boxItem.x2) * noduleSpacing) / 2
            const halfY = ((boxItem.y1 + boxItem.y2) * noduleSpacing) / 2
            const z = boxItem.slice_idx
            const newOrigin = this.transformOriginTo3DPicked([halfX, halfY, z])
            const apis = this.apis
            apis[0].svgWidgets.rotatableCrosshairsWidget.moveCrosshairs(newOrigin, apis, 0)
            const renderWindow = apis[0].genericRenderWindow.getRenderWindow()
            const istyle = renderWindow.getInteractor().getInteractorStyle()
            istyle.modified()

            //   const segmentIndex = _.findIndex(this.state.urls, {
            //     class: 2,
            //     order: parseInt(this.state.boxes[index].nodule_no) + 1,
            //   })
            //   if (segmentIndex === -1) {
            //     message.error('??????????????????')
            //   } else {
            //     const segment = this.state.segments[segmentIndex]
            //     const bounds = segment.getBounds()
            //     const firstPicked = [bounds[0], bounds[2], bounds[4]]
            //     const lastPicked = [bounds[1], bounds[3], bounds[5]]
            //     const origin = [Math.round((firstPicked[0] + lastPicked[0]) / 2), Math.round((firstPicked[1] + lastPicked[1]) / 2), Math.round((firstPicked[2] + lastPicked[2]) / 2)]
            //     const apis = this.apis
            //     apis[0].svgWidgets.rotatableCrosshairsWidget.moveCrosshairs(origin, apis, 0)
            //     const renderWindow = apis[0].genericRenderWindow.getRenderWindow()
            //     const istyle = renderWindow.getInteractor().getInteractorStyle()
            //     istyle.modified()
            //   }
          } catch (e) {
            console.log(e)
          }
        }
      }
      // if (this.state.MPR && this.state.painting && newIndex !== -1) {
      //   this.createNoduleMask(index)
      //   this.setState({
      //     displayCrosshairs: true,
      //   })
      //   this.toggleCrosshairs(true)
      // }
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
    console.log('onSelectMal', value)
    const boxes = this.state.boxes
    boxes[index].malignancy = parseInt(value)
    this.setState({
      boxes: boxes,
      needReloadBoxes: true,
    })
  }
  onSelectMalIconClick(index, open, e) {
    e.stopPropagation()
    const boxes = this.state.boxes
    boxes[index].malOpen = open
    if (open) {
      boxes.forEach((boxItem, boxIndex) => {
        if (boxIndex !== index) {
          boxItem.malOpen = false
          boxItem.textOpen = false
        }
      })
    }
    this.setState({
      boxes: boxes,
    })
  }
  onSelectMalClick(index, e) {
    e.stopPropagation()
    this.handleListClick(index)
  }
  onSelectMalSelect(index) {
    const boxes = this.state.boxes
    boxes[index].malOpen = false
    this.setState(
      {
        boxes: boxes,
      },
      () => {
        this.handleListClick(index)
      }
    )
  }
  onSelectTexClick(index, e) {
    e.stopPropagation()
    this.handleListClick(index)
  }
  onSelectTexSelect(index, value) {
    const boxes = this.state.boxes
    boxes[index].textOpen = false
    this.setState(
      {
        boxes: boxes,
      },
      () => {
        this.handleListClick(index)
      }
    )
  }
  onSelectTexIconClick(index, open, e) {
    e.stopPropagation()
    const boxes = this.state.boxes
    boxes[index].textOpen = open
    if (open) {
      boxes.forEach((boxItem, boxIndex) => {
        if (boxIndex !== index) {
          boxItem.malOpen = false
          boxItem.textOpen = false
        }
      })
    }
    this.setState({
      boxes: boxes,
    })
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
    if (value[0] === '????????????') {
      boxes[index].segment = 'None'
    } else {
      if (value[1] === '????????????1') {
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
    // boxes[idx].recVisible = visible
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
    message.success('??????????????????')
  }
  featureAnalysis(idx, e) {
    console.log('????????????')
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
  startCompress(nodule_no) {
    this.setState({
      noduleCompressing: true,
      noduleCompressParentIndex: nodule_no,
    })
  }
  onChangeCompress(idx) {
    const { boxes } = this.state
    if (boxes && boxes.length) {
      boxes[idx].compressed = !boxes[idx].compressed
    }
    this.setState({
      boxes,
    })
  }
  finishCompress() {
    const { boxes, noduleCompressParentIndex } = this.state
    try {
      const parentIndex = _.findIndex(boxes, { nodule_no: noduleCompressParentIndex })
      if (parentIndex !== -1) {
        const parentNodule = boxes[parentIndex]
        const childrenIndices = parentNodule.children && parentNodule.children.length ? parentNodule.children : []
        boxes.forEach((boxItem, boxIndex) => {
          if (boxIndex !== parentIndex && boxItem.compressed) {
            childrenIndices.push(boxItem.slice_idx)
            boxItem.compressed = false
            boxItem.isChild = true
          }
        })
        parentNodule.children = childrenIndices
        console.log(parentNodule, parentNodule.children)
      }
      this.setState({
        boxes,
        confirmCompress: false,
        noduleCompressing: false,
        noduleCompressParentIndex: null,
      })
    } catch (e) {
      message.error('?????????????????????????????????')
      console.log(e)
      this.setState({
        confirmCompress: false,
        noduleCompressing: false,
        noduleCompressParentIndex: null,
      })
    }
  }
  setConfirmCompress(compressing) {
    this.setState({
      confirmCompressing: compressing,
    })
  }
  plotHistogram(idx) {
    var { boxes, chartType, HUSliderRange } = this.state
    if (!(boxes && boxes.length)) {
      return
    }
    if (!boxes[idx]) {
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
            // ??????????????????????????????????????????
            type: 'line', // ??????????????????????????????'line' | 'shadow'
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
    message.success('??????????????????')
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
    const spacing = this.state.noduleSpacing
    let texts = ''

    if (type === '????????????') {
      let place = ''
      let diameter = ''
      let texture = ''
      let representArray = []
      let represent = ''
      let malignancy = ''
      if (boxes[boxIndex]['place'] === 0 || boxes[boxIndex]['place'] === undefined || boxes[boxIndex]['place'] === '') {
        if (boxes[boxIndex]['segment'] === undefined || boxes[boxIndex]['segment'] === '' || boxes[boxIndex]['segment'] === 'None') {
          place = '????????????'
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
        if (spacing) {
          ll = Math.sqrt(Math.pow(boxes[boxIndex].measure.x1 - boxes[boxIndex].measure.x2, 2) + Math.pow(boxes[boxIndex].measure.y1 - boxes[boxIndex].measure.y2, 2)) * spacing
          sl = Math.sqrt(Math.pow(boxes[boxIndex].measure.x3 - boxes[boxIndex].measure.x4, 2) + Math.pow(boxes[boxIndex].measure.y3 - boxes[boxIndex].measure.y4, 2)) * spacing
        } else {
          ll = Math.sqrt(Math.pow(boxes[boxIndex].measure.x1 - boxes[boxIndex].measure.x2, 2) + Math.pow(boxes[boxIndex].measure.y1 - boxes[boxIndex].measure.y2, 2))
          sl = Math.sqrt(Math.pow(boxes[boxIndex].measure.x3 - boxes[boxIndex].measure.x4, 2) + Math.pow(boxes[boxIndex].measure.y3 - boxes[boxIndex].measure.y4, 2))
        }

        if (isNaN(ll)) {
          ll = 0
        }
        if (isNaN(sl)) {
          sl = 0
        }
        if (ll === 0 && sl === 0) {
          if (boxes[boxIndex]['diameter'] !== undefined && boxes[boxIndex]['diameter'] !== 0) {
            if (spacing) {
              diameter = '\xa0\xa0' + ((boxes[boxIndex]['diameter'] * spacing) / 10).toFixed(2) + ' ??????'
            } else {
              diameter = '\xa0\xa0' + (boxes[boxIndex]['diameter'] / 10).toFixed(2) + ' ??????'
            }
          } else {
            diameter = '??????'
          }
        } else if (ll === 0 && sl !== 0) {
          diameter = '\xa0\xa0' + (sl / 10).toFixed(2) + ' ??????'
        } else if (ll !== 0 && sl === 0) {
          diameter = '\xa0\xa0' + (ll / 10).toFixed(2) + ' ??????'
        } else {
          diameter = '\xa0\xa0' + (ll / 10).toFixed(2) + '\xa0' + '??' + '\xa0' + (sl / 10).toFixed(2) + ' ??????'
        }
      }

      if (boxes[boxIndex]['texture'] === 2) {
        texture = '??????'
      } else if (boxes[boxIndex]['texture'] === 3) {
        texture = '???????????????'
      } else if (boxes[boxIndex]['texture'] === 4) {
        texture = '??????'
      } else {
        texture = '?????????'
      }
      if (boxes[boxIndex]['lobulation'] === 2) {
        representArray.push('??????')
      }
      if (boxes[boxIndex]['spiculation'] === 2) {
        representArray.push('??????')
      }
      // if (boxes[boxIndex]['calcification'] === 2) {
      //   representArray.push('??????')
      // }
      if (boxes[boxIndex]['pin'] === 2) {
        representArray.push('????????????')
      }
      if (boxes[boxIndex]['cav'] === 2) {
        representArray.push('??????')
      }
      if (boxes[boxIndex]['vss'] === 2) {
        representArray.push('????????????')
      }
      if (boxes[boxIndex]['bea'] === 2) {
        representArray.push('??????')
      }
      if (boxes[boxIndex]['bro'] === 2) {
        representArray.push('???????????????')
      }
      for (let index = 0; index < representArray.length; index++) {
        if (index === 0) {
          represent = representArray[index]
        } else {
          represent = represent + '???' + representArray[index]
        }
      }
      if (boxes[boxIndex]['malignancy'] === 3) {
        malignancy = '???????????????'
      } else if (boxes[boxIndex]['malignancy'] === 2) {
        malignancy = '???????????????'
      } else {
        malignancy = '???????????????'
      }
      texts = texts + place + ' ( Im ' + (parseInt(boxes[boxIndex]['slice_idx']) + 1) + '/' + this.state.imageIds.length + ') ???' + texture + '??????, ?????????' + diameter
      if (represent) {
        texts += ', ??????' + represent
      }
      texts += ', ' + malignancy
    }
    return texts
  }
  templateReportGuide(dealchoose) {
    const boxes = this.state.boxes
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
          this.setState({
            reportGuideText: '12????????????????????????????????????CT??????',
          })
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
          this.setState({
            reportGuideText: '???????????????????????????????????????CT??????',
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
      image: { type: 'jpeg', quality: 1 }, // ??????????????????????????????
      html2canvas: {
        scale: 1,
        useCORS: true,
        width: 1100,
        height: eleHeight + 10,
      }, // useCORS?????????????????????????????????????????????
      jsPDF: {
        unit: 'mm',
        format: [1100, eleHeight + 10],
        orientation: 'portrait',
        precision: 25,
      },
      //
    }
    if (element) {
      html2pdf().set(opt).from(element).save() // ??????
    }
  }
  handleCopyClick(e) {
    e.stopPropagation()
    const reportImageText = this.state.reportImageText
    if (reportImageText && reportImageText.length > 0) {
      copy(this.state.reportImageText)
      message.success('????????????')
    } else {
      message.warn('??????????????????')
    }
  }
  onMenuPageUp() {
    const { menuButtonsWidth, menuNowPage, menuTransform } = this.state
    let borderWidth = 0
    if (document.getElementsByClassName('func-btn') && document.getElementsByClassName('func-btn').length > 0) {
      const funcBtns = document.getElementsByClassName('func-btn')
      let funcBtnIndex = 0
      while (borderWidth < menuButtonsWidth) {
        borderWidth += funcBtns[funcBtnIndex].clientWidth
        funcBtnIndex++
      }
      if (borderWidth > menuButtonsWidth && funcBtnIndex > 0) {
        borderWidth -= funcBtns[funcBtnIndex - 1].clientWidth
      }
    }
    this.setState({
      menuNowPage: menuNowPage - 1,
      menuTransform: menuTransform - borderWidth,
    })
  }
  onMenuPageDown() {
    const { menuButtonsWidth, menuNowPage, menuTransform } = this.state
    let borderWidth = 0
    if (document.getElementsByClassName('func-btn') && document.getElementsByClassName('func-btn').length > 0) {
      const funcBtns = document.getElementsByClassName('func-btn')
      let funcBtnIndex = 0
      while (borderWidth < menuButtonsWidth) {
        borderWidth += funcBtns[funcBtnIndex].clientWidth
        funcBtnIndex++
      }
      if (borderWidth > menuButtonsWidth && funcBtnIndex > 0) {
        borderWidth -= funcBtns[funcBtnIndex - 1].clientWidth
      }
    }
    this.setState({
      menuNowPage: menuNowPage + 1,
      menuTransform: menuTransform + borderWidth,
    })
  }
  setPdfReading(pdfReading) {
    this.setState({
      pdfReading,
    })
  }
  showImages(e) {
    e.stopPropagation()
    const noduleLimited = this.state.noduleLimited
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
              <AntdForm.Item name={`patientId`} label={<div className="pdf-form-label">?????????</div>} rules={[{}]}>
                <Input className="pdf-form-input" placeholder="??????????????????" />
              </AntdForm.Item>
              <AntdForm.Item name={`name`} label={<div className="pdf-form-label">??????</div>} rules={[{}]}>
                <Input className="pdf-form-input" placeholder="???????????????" />
              </AntdForm.Item>
              <AntdForm.Item name={`diagDoctor`} label={<div className="pdf-form-label">????????????</div>} rules={[{}]}>
                <Input className="pdf-form-input" placeholder="?????????????????????" />
              </AntdForm.Item>
            </Col>
            <Col span={8} className="pdf-form-col">
              <AntdForm.Item name={`instanceId`} label={<div className="pdf-form-label">?????????</div>} rules={[{}]}>
                <Input className="pdf-form-input" placeholder="??????????????????" />
              </AntdForm.Item>
              <AntdForm.Item name={`sex`} label={<div className="pdf-form-label">??????</div>} rules={[{}]}>
                <Input className="pdf-form-input" placeholder="???????????????" />
              </AntdForm.Item>
              <AntdForm.Item name={`auditDoctor`} label={<div className="pdf-form-label">????????????</div>} rules={[{}]}>
                <Input className="pdf-form-input" placeholder="?????????????????????" />
              </AntdForm.Item>
            </Col>
            <Col span={8} className="pdf-form-col">
              <AntdForm.Item name={`studyDate`} label={<div className="pdf-form-label">????????????</div>} rules={[{}]}>
                <Input className="pdf-form-input" placeholder="?????????????????????" />
              </AntdForm.Item>
              <AntdForm.Item name={`age`} label={<div className="pdf-form-label">??????</div>} rules={[{}]}>
                <Input className="pdf-form-input" placeholder="???????????????" />
              </AntdForm.Item>
              <AntdForm.Item name={`reportDate`} label={<div className="pdf-form-label">????????????</div>} rules={[{}]}>
                <Input className="pdf-form-input" placeholder="?????????????????????" />
              </AntdForm.Item>
            </Col>
          </Row>
        </AntdForm>
        <Divider />
        {boxes && boxes.length
          ? boxes.map((nodule, index) => {
              if (noduleLimited && index >= 20) {
                return null
              }
              if (nodule.isChild) {
                return null
              }
              let nodule_id = 'nodule-' + nodule.nodule_no + '-' + nodule.slice_idx
              let visualId = 'visual' + index
              // console.log('visualId',visualId)
              const pdfNodulePosition = nodule.place === 0 ? nodulePlaces[nodule.place] : noduleSegments[nodule.segment]
              const pdfNoduleRepresents = []
              if (nodule.lobulation === 2) {
                pdfNoduleRepresents.push('??????')
              }
              if (nodule.spiculation === 2) {
                pdfNoduleRepresents.push('??????')
              }
              // if (nodule.calcification === 2) {
              //   pdfNoduleRepresents.push('??????')
              // }
              if (nodule.pin === 2) {
                pdfNoduleRepresents.push('????????????')
              }
              if (nodule.cav === 2) {
                pdfNoduleRepresents.push('??????')
              }
              if (nodule.vss === 2) {
                pdfNoduleRepresents.push('????????????')
              }
              if (nodule.bea === 2) {
                pdfNoduleRepresents.push('??????')
              }
              if (nodule.bro === 2) {
                pdfNoduleRepresents.push('???????????????')
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
                pdfNoduleRepresentText = '???'
              }
              if (nodule.visible && nodule.checked) {
                return (
                  <div key={index}>
                    <div>&nbsp;</div>
                    <div className="corner-report-modal-title">?????? {index + 1}</div>
                    <Table celled textAlign="center">
                      <Table.Header>
                        <Table.Row>
                          <Table.HeaderCell width={7}>????????????</Table.HeaderCell>
                          {/* <Table.HeaderCell width={11}>{`${this.state.date.getFullYear()}???${this.state.date.getMonth()}???${this.state.date.getDay()}???`}</Table.HeaderCell> */}
                          <Table.HeaderCell width={11}>{''}</Table.HeaderCell>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        <Table.Row>
                          <Table.Cell>?????????</Table.Cell>
                          <Table.Cell>{nodule['slice_idx'] + 1}</Table.Cell>
                        </Table.Row>
                        <Table.Row>
                          <Table.Cell>????????????</Table.Cell>
                          <Table.Cell>{pdfNodulePosition}</Table.Cell>
                        </Table.Row>
                        <Table.Row>
                          <Table.Cell>????????????</Table.Cell>
                          <Table.Cell>{magName[nodule.malignancy]}</Table.Cell>
                        </Table.Row>
                        <Table.Row>
                          <Table.Cell>??????</Table.Cell>
                          <Table.Cell>{texName[nodule.texture]}</Table.Cell>
                        </Table.Row>
                        <Table.Row>
                          <Table.Cell>??????</Table.Cell>
                          <Table.Cell>{pdfNoduleRepresentText}</Table.Cell>
                        </Table.Row>
                        <Table.Row>
                          <Table.Cell>??????</Table.Cell>
                          <Table.Cell>{`${(nodule.diameter / 10).toFixed(2)}cm`}</Table.Cell>
                        </Table.Row>
                        <Table.Row>
                          <Table.Cell>??????</Table.Cell>
                          <Table.Cell>{nodule['volume'] === undefined ? null : `${(nodule.volume * 1e3).toFixed(2)}mm??`}</Table.Cell>
                        </Table.Row>
                        <Table.Row>
                          <Table.Cell>HU(??????/?????????/?????????)</Table.Cell>
                          <Table.Cell>{nodule['huMean'] === undefined ? null : Math.round(nodule['huMean']) + ' / ' + nodule['huMax'] + ' / ' + nodule['huMin']}</Table.Cell>
                        </Table.Row>
                        <Table.Row>
                          <Table.Cell>????????????</Table.Cell>
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
          if (noduleLimited && index >= 20) {
            return
          }
          if (nodule.isChild) {
            return
          }
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
            viewport.voi.windowWidth = 1800
            viewport.voi.windowCenter = -400
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
    const noduleLimited = this.state.noduleLimited
    const boxes = this.state.boxes
    const imageIds = this.state.imageIds
    const pdfFormValues = this.state.pdfFormValues
    const reportImageText = this.state.reportImageText
    const pdfReading = this.state.pdfReading
    const visibleNodules = boxes.map((item, index) => {
      if (noduleLimited && index >= 20) {
        return null
      }
      if (item.isChild) {
        return null
      }
      const pdfNodulePosition = item.place === 0 ? nodulePlaces[item.place] : noduleSegments[item.segment]
      const pdfNoduleRepresents = []
      if (item.lobulation === 2) {
        pdfNoduleRepresents.push('??????')
      }
      if (item.spiculation === 2) {
        pdfNoduleRepresents.push('??????')
      }
      // if (item.calcification === 2) {
      //   pdfNoduleRepresents.push('??????')
      // }
      if (item.pin === 2) {
        pdfNoduleRepresents.push('????????????')
      }
      if (item.cav === 2) {
        pdfNoduleRepresents.push('??????')
      }
      if (item.vss === 2) {
        pdfNoduleRepresents.push('????????????')
      }
      if (item.bea === 2) {
        pdfNoduleRepresents.push('??????')
      }
      if (item.bro === 2) {
        pdfNoduleRepresents.push('???????????????')
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
        pdfNoduleRepresentText = '???'
      }
      if (item.visible && item.checked) {
        return (
          <div className="invisiblePDF-nodule-corner-item" key={index}>
            <div id={`pdf-nodule-${index}`} className="invisiblePDF-nodule-corner"></div>
            <div className="invisiblePDF-nodule-info">
              <div>?????????:{item.slice_idx + 1}</div>
              <div>??????:{pdfNodulePosition}</div>
              <div>????????????:{magName[item.malignancy]}</div>
              <div>??????:{texName[item.texture]}</div>
              <div>??????:{pdfNoduleRepresentText}</div>
              <div>??????:{`${(item.diameter / 10).toFixed(2)}cm`}</div>
              <div>
                ??????:
                {item.volume === undefined ? null : `${(item.volume * 1e3).toFixed(2)}mm??`}
              </div>
              <div>
                HU(??????/?????????/?????????):
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
          <div className="invisiblePDF-header">????????????</div>
          <div className="invisiblePDF-content">
            <div className="invisiblePDF-content-top">
              <div className="invisiblePDF-content-title">??????CT???????????????</div>
              <div className="invisiblePDF-content-description">
                <div className="invisiblePDF-content-description-info">
                  <Row wrap={false}>
                    <Col span={6}>
                      <div>
                        <div>?????????{pdfFormValues.name}</div>
                        <div>????????????{pdfFormValues.patientId}</div>
                      </div>
                    </Col>
                    <Col span={6}>
                      <div>
                        <div>?????????{pdfFormValues.sex}</div>
                        <div>???????????????</div>
                      </div>
                    </Col>
                    <Col span={6}>
                      <div>
                        <div>?????????{pdfFormValues.age}</div>
                        <div>???????????????</div>
                      </div>
                    </Col>
                    <Col span={6}>
                      <div>
                        <div>????????????{pdfFormValues.instanceId}</div>
                        <div>???????????????{pdfFormValues.studyDate}</div>
                      </div>
                    </Col>
                  </Row>
                </div>
                <div className="invisiblePDF-content-description-nodules">
                  <div className="invisiblePDF-content-description-nodules-title">????????????</div>
                  <div className="invisiblePDF-content-description-nodules-list">{visibleNodules}</div>
                </div>
                <div className="invisiblePDF-content-description-text">{reportImageText}</div>
              </div>
            </div>
            <div className="invisiblePDF-content-bottom">
              <div className="invisiblePDF-content-report">
                <Row wrap={false}>
                  <Col span={8}>???????????????</Col>
                  <Col span={8}>???????????????</Col>
                  <Col span={8}>???????????????</Col>
                </Row>
              </div>
              <div className="invisiblePDF-content-note">????????????????????????????????????????????????????????????</div>
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
          message.warn('???????????????')
          this.setState({
            pdfLoadingCompleted: true,
          })
        } else {
          boxes.map((nodule, index) => {
            if (noduleLimited && index >= 20) {
              return
            }
            if (nodule.isChild) {
              return
            }
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
              viewport.voi.windowWidth = 1800 //1600,-600
              viewport.voi.windowCenter = -400
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
    // console.log('drawNodules')
    this.drawNodulesForRec()
    this.drawNodulesForBi()
  }
  drawNodulesForRec() {
    const { boxes, imageIds, cornerElement, cornerImage, cornerImageIdIndex, listsActiveIndex, noduleLimited } = this.state
    let color
    if (boxes && boxes.length) {
      boxes.forEach((boxItem, boxIndex) => {
        if (noduleLimited && boxIndex > 20) {
          return
        }
        if (imageIds[boxItem.slice_idx] === cornerImage.imageId && boxItem.recVisible && boxItem.uuid === undefined) {
          color = this.state.noduleColor

          const measurementData = {
            noduleIndex: boxItem.visibleIdx + 1,
            visible: boxItem.visible,
            active: boxIndex === listsActiveIndex,
            // color:color,
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
          if (this.state.noduleColorSetting) {
            measurementData.color = color
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
    const { boxes, imageIds, cornerElement, cornerImage, cornerImageIdIndex, listsActiveIndex, noduleLimited } = this.state
    if (boxes && boxes.length) {
      boxes.forEach((boxItem, boxIndex) => {
        if (noduleLimited && boxIndex > 20) {
          return
        }
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
  mouseMovePositionDisplay(evt) {
    const [startX, startY, imageX, imageY] = [evt.detail.startPoints.page.x, evt.detail.startPoints.page.y, evt.detail.startPoints.image.x, evt.detail.startPoints.image.y]
    let { mousemovePos } = this.state
    mousemovePos.startX = startX
    mousemovePos.startY = startY
    mousemovePos.imageX = imageX
    mousemovePos.imageY = imageY
    if (imageX < 0 || imageY < 0 || imageX > evt.detail.image.width - 20 || imageY > evt.detail.image.height - 20) {
      this.setState({ cornerMouseInside: false })
    } else {
      this.setState({ cornerMouseInside: true })
    }
    this.setState({ mousemovePos })
  }
  zoomToCenterStrategy(evt) {
    const { invert, maxScale, minScale } = this.state.cornerstoneZoomScaleConfig
    const deltaY = evt.detail.deltaPoints.page.y
    const ticks = invert ? -deltaY / 100 : deltaY / 100
    let EvtViewport = evt.detail.viewport
    let { cornerViewport } = this.state
    const { element } = evt.detail
    const [startX, startY, imageX, imageY] = [evt.detail.startPoints.page.x, evt.detail.startPoints.page.y, evt.detail.startPoints.image.x, evt.detail.startPoints.image.y]
    // let viewport = this.state.cornerViewport
    console.log('zoomToCenterStrategy', evt)
    // Calculate the new scale factor based on how far the mouse has changed
    EvtViewport = this.changeViewportScale(EvtViewport, ticks, {
      maxScale,
      minScale,
    })
    cornerViewport.scale = EvtViewport.scale
    cornerstone.setViewport(element, EvtViewport)
    const newCoords = cornerstone.pageToPixel(element, startX, startY)
    let shift = {
      x: imageX - newCoords.x,
      y: imageY - newCoords.y,
    }
    const cornerShift = this.cornerShift(shift, EvtViewport)
    console.log('zoomToCenterStrategy cornerShift', cornerShift)

    cornerViewport.translation.x -= cornerShift.x
    cornerViewport.translation.y -= cornerShift.y
    this.setState({ cornerViewport: cornerViewport })
  }
  changeViewportScale(viewport, ticks, scaleLimits) {
    const { maxScale, minScale } = scaleLimits
    const pow = 1.7
    const oldFactor = Math.log(viewport.scale) / Math.log(pow)
    const factor = oldFactor + ticks
    const scale = Math.pow(pow, factor)

    if (maxScale && scale > maxScale) {
      viewport.scale = maxScale
    } else if (minScale && scale < minScale) {
      viewport.scale = minScale
    } else {
      viewport.scale = scale
    }

    return viewport
  }
  cornerShift(shift, viewportOrientation) {
    const { hflip, vflip, rotation } = viewportOrientation
    console.log('cornerShift', viewportOrientation)
    // Apply Flips
    shift.x *= hflip ? -1 : 1
    shift.y *= vflip ? -1 : 1

    // Apply rotations
    if (rotation !== 0) {
      const angle = (rotation * Math.PI) / 180

      const cosA = Math.cos(angle)
      const sinA = Math.sin(angle)

      const newX = shift.x * cosA - shift.y * sinA
      const newY = shift.x * sinA + shift.y * cosA

      shift.x = newX
      shift.y = newY
    }

    return shift
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
    // this.setState({
    //   needRedrawBoxes: true,
    // })
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
      biVisible: false,
      checked: false,
      textOpen: false,
      malOpen: false,
      nodule_no: `new${_.random(200, 1000)}`,
      compressed: false,
      isChild: false,
      children: undefined,
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
      name: `?????????${visibleIdx + 1}`,
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
    boxes[boxIndex].biVisible = false
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
    // if (document.getElementById('slice-slider') !== null) document.getElementById('slice-slider').blur()
    if (event.which == 77) {
      // m, magnify to immersive mode
      // this.setState({ immersive: true })
    }

    if (event.which == 27) {
      // esc, back to normal
      // this.setState({ immersive: false })
    }
    if (event.which == 37) {
      // arrowLeft
      // console.log('active item',document.activeElement,document.getElementsByClassName("ant-slider-handle")[0])
      // if (document.getElementsByClassName('ant-slider-handle')[0] !== document.activeElement) {
      //   event.preventDefault()
      //   let newCurrentIdx = this.state.currentIdx - 1
      //   if (newCurrentIdx >= 0) {
      //   }
      // }
    }
    if (event.which == 38) {
      // arrowUp
      event.preventDefault()
      if (!this.state.show3DVisualization && !this.state.showFollowUp) {
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
    }
    if (event.which == 39) {
      // arrowRight
      // if (document.getElementsByClassName('ant-slider-handle')[0] !== document.activeElement) {
      //   event.preventDefault()
      //   let newCurrentIdx = this.state.currentIdx + 1
      //   if (newCurrentIdx < this.state.imageIds.length) {
      //     // console.log('info',cornerstone.imageCache.getCacheInfo())
      //   }
      // }
    }
    if (event.which == 40) {
      // arrowDown
      event.preventDefault()
      if (!this.state.show3DVisualization && !this.state.showFollowUp) {
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
    }
    if (event.which == 72) {
      // this.toHidebox()
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
    if (e.target) {
      if (
        e.target.tagName !== 'svg' &&
        e.target.tagName !== 'path' &&
        e.target.className !== 'ant-select-item-option-content' &&
        e.target.className !== 'ant-select-item ant-select-item-option nodule-accordion-item-title-select-option ant-select-item-option-active'
      ) {
        const boxes = this.state.boxes
        if (boxes && boxes.length) {
          boxes.forEach((boxItem) => {
            boxItem.malOpen = false
            boxItem.textOpen = false
          })
          this.setState({
            boxes,
          })
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
      settingOpen,
      mousemovePos,

      imageIds,
      cornerImageIdIndex,
      cornerImage,
      cornerIsPlaying,
      cornerFrameRate,
      cornerActiveTool,
      cornerIsOverlayVisible,
      cornerMouseCoordVisible,
      cornerMouseInside,
      cornerViewport,
      cornerAnnoVisible,
      cornerBiVisible,
      loadedImagePercent,
      drawingNodulesCompleted,
      drawingLymphsCompleted,
      displayBorder,
      noduleColorSetting,
      noduleColor,
      noduleCompressing,
      noduleCompressParentIndex,
      confirmCompressing,

      nodulesAllChecked,
      smallNodulesChecked,
      noduleLimited,
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
      slabThickness,

      readonly,
      registering,
      menuButtonsWidth,
      menuScrollable,
      menuTotalPages,
      menuNowPage,
      menuTransform,
      show3DVisualization,
      showMPRDirectly,
      crosshairsTool,
      studyListShowed,
      renderLoading,
      showFollowUp,
    } = this.state
    let tableContent
    let compressedNodules
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
      { key: '??????', text: '??????', value: '??????' },
      { key: '??????', text: '??????', value: '??????' },
      { key: '??????', text: '??????', value: '??????' },
      { key: '????????????', text: '????????????', value: '????????????' },
      { key: '????????????', text: '????????????', value: '????????????' },
      { key: '??????', text: '??????', value: '??????' },
      { key: '??????', text: '??????', value: '??????' },
      { key: '???????????????', text: '???????????????', value: '???????????????' },
    ]

    if (this.state.okayForReview) {
      StartReviewButton = (
        <Button
          style={{
            marginLeft: 15 + 'px',
          }}>
          ????????????
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
    if (mode === 4) {
      const directMPRStyles = this.getDirectMPRStyles()
      const directMPRPanel = (
        <>
          <View2D
            // axial
            viewerStyle={directMPRStyles.axial}
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
            viewerStyle={directMPRStyles.coronal}
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
            viewerStyle={directMPRStyles.sagittal}
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
      panel = directMPRPanel
    }
    if (!this.state.immersive) {
      if (boxes && boxes.length > 0) {
        const parentIndex = _.findIndex(boxes, { nodule_no: noduleCompressParentIndex })
        if (parentIndex !== -1) {
          compressedNodules = `${boxes[parentIndex].visibleIdx + 1}???`
        }
        tableContent = boxes // .selectBoxes
          .map((inside, idx) => {
            if (noduleLimited && idx >= 20) {
              return null
            }
            if (inside.isChild) {
              return null
            }
            if (inside.compressed) {
              compressedNodules = compressedNodules ? `${compressedNodules}???${inside.visibleIdx + 1}???` : `${inside.visibleIdx + 1}???`
            }
            if (inside.visible) {
              noduleNumber += 1
            }
            let representArray = []
            let locationValues = ''
            const visualId = 'visual-' + idx
            const spacing = this.state.noduleSpacing
            let ll = 0
            let sl = 0
            if (inside.measure) {
              if (spacing) {
                ll = Math.sqrt(Math.pow(inside.measure.x1 - inside.measure.x2, 2) + Math.pow(inside.measure.y1 - inside.measure.y2, 2)) * spacing
                sl = Math.sqrt(Math.pow(inside.measure.x3 - inside.measure.x4, 2) + Math.pow(inside.measure.y3 - inside.measure.y4, 2)) * spacing
              } else {
                ll = Math.sqrt(Math.pow(inside.measure.x1 - inside.measure.x2, 2) + Math.pow(inside.measure.y1 - inside.measure.y2, 2))
                sl = Math.sqrt(Math.pow(inside.measure.x3 - inside.measure.x4, 2) + Math.pow(inside.measure.y3 - inside.measure.y4, 2))
              }
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

            let diameter
            if (spacing) {
              diameter = inside.diameter * spacing
            } else {
              diameter = inside.diameter
            }

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
              locationValues = noduleSegments[inside.segment].split('-').join('/')
            } else {
              if (inside.place) {
                locationValues = [nodulePlaces[inside.place]]
              } else {
                locationValues = ['????????????']
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
                          open={inside.textOpen}
                          bordered={false}
                          showArrow={false}
                          dropdownClassName={'corner-select-dropdown'}
                          onChange={this.onSelectTex.bind(this, idx)}
                          onClick={this.onSelectTexClick.bind(this, idx)}
                          onSelect={this.onSelectTexSelect.bind(this, idx)}>
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
                        {inside.textOpen ? (
                          <FontAwesomeIcon className="cornerstone-dorpdown-icon" icon={faChevronDown} size="xs" onClick={this.onSelectTexIconClick.bind(this, idx, false)} />
                        ) : (
                          <FontAwesomeIcon className="cornerstone-dorpdown-icon" icon={faChevronDown} size="xs" onClick={this.onSelectTexIconClick.bind(this, idx, true)} />
                        )}
                      </div>
                      {ll !== 0 && sl !== 0 ? (
                        <div className="nodule-accordion-item-title-shape nodule-accordion-item-title-column">{`${(ll / 10).toFixed(2)}x${(sl / 10).toFixed(2)}cm`}</div>
                      ) : ll === 0 && sl !== 0 ? (
                        <div className="nodule-accordion-item-title-shape nodule-accordion-item-title-column">{`${(sl / 10).toFixed(2)}cm`}</div>
                      ) : ll !== 0 && sl === 0 ? (
                        <div className="nodule-accordion-item-title-shape nodule-accordion-item-title-column">{`${(ll / 10).toFixed(2)}cm`}</div>
                      ) : (
                        <div className="nodule-accordion-item-title-shape nodule-accordion-item-title-column">{`${(diameter / 10).toFixed(2)}cm`}</div>
                      )}
                      {/* {ll === 0 || sl === 0 ? (
                        <div className="nodule-accordion-item-title-shape nodule-accordion-item-title-column">{`${(diameter / 10).toFixed(2)}cm`}</div>
                      ) : (
                        <div className="nodule-accordion-item-title-shape nodule-accordion-item-title-column">{`${(ll / 10).toFixed(2)}x${(sl / 10).toFixed(2)}cm`}</div>
                      )} */}

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
                            onChange={this.onSelectPlace.bind(this, idx)}
                            onClick={this.onSelectPlaceClick.bind(this)}
                          /> */}
                          {locationValues && locationValues.length > 7 ? (
                            <Tooltip placement="bottom" title={locationValues}>
                              <div className="nodule-accordion-item-title-location-text">{locationValues}</div>
                            </Tooltip>
                          ) : (
                            <div className="nodule-accordion-item-title-location-text">{locationValues}</div>
                          )}
                        </div>

                        <div className="nodule-accordion-item-title-mal">
                          <Select
                            className={'nodule-accordion-item-title-select ' + ` nodule-accordion-item-title-select-${inside.malignancy}`}
                            defaultValue={inside.malignancy}
                            value={inside.malignancy}
                            open={inside.malOpen}
                            bordered={false}
                            showArrow={false}
                            dropdownClassName={'corner-select-dropdown'}
                            onChange={this.onSelectMal.bind(this, idx)}
                            onClick={this.onSelectMalClick.bind(this, idx)}
                            onSelect={this.onSelectMalSelect.bind(this, idx)}>
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
                        {inside.malOpen ? (
                          <FontAwesomeIcon className="cornerstone-dorpdown-icon" icon={faChevronDown} size="xs" onClick={this.onSelectMalIconClick.bind(this, idx, false)} />
                        ) : (
                          <FontAwesomeIcon className="cornerstone-dorpdown-icon" icon={faChevronDown} size="xs" onClick={this.onSelectMalIconClick.bind(this, idx, true)} />
                        )}
                      </div>
                    </div>
                  </Accordion.Title>
                  <Accordion.Content active={listsActiveIndex === idx}>
                    <div className="nodule-accordion-item-content">
                      <div className="nodule-accordion-item-content-info">
                        {/* <Grid.Column widescreen={6} computer={6}>
                {'\xa0\xa0' + (ll / 10).toFixed(2) + '\xa0\xa0' + ' ??' + '\xa0\xa0' + (sl / 10).toFixed(2) + ' cm'}
              </Grid.Column> */}
                        <div className="nodule-accordion-item-content-info-slice">{inside.children && inside.children.length ? `${_.min(inside.children)}-${_.max(inside.children)}` : null}</div>

                        <div className="nodule-accordion-item-content-info-diam">{inside.volume !== undefined && inside.volume !== 0 ? `${inside.volume.toFixed(3)}cm??` : null}</div>
                        <div className="nodule-accordion-item-content-info-hu">
                          {inside.huMin !== undefined && inside.huMax !== undefined && (inside.huMax !== 0 || inside.huMin !== 0) ? inside.huMin + '~' + inside.huMax + 'HU' : null}
                        </div>
                        <div className={'nodule-accordion-item-content-info-prob' + ` nodule-accordion-item-content-info-prob-${inside.malignancy}`}>
                          {inside.malProb !== undefined ? `${(inside.malProb * 100).toFixed(1)}%` : null}
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
                            defaultValue={inside.malignancy}
                            value={representArray}
                            placeholder="???????????????"
                            bordered={false}
                            showArrow={false}
                            dropdownClassName={'corner-select-dropdown'}
                            onChange={this.representChange.bind(this, idx)}>
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

                      <div className="nodule-accordion-item-content-button">
                        <div>
                          <Button size="mini" circular inverted icon="chart bar" title="????????????" value={idx} onClick={this.featureAnalysis.bind(this, idx)}></Button>
                          {noduleCompressing ? (
                            inside.nodule_no === noduleCompressParentIndex ? (
                              <Checkbox className="button-compress-check" checked disabled>
                                ??????
                              </Checkbox>
                            ) : (
                              <Checkbox className="button-compress-check" checked={inside.compressed} onChange={this.onChangeCompress.bind(this, idx)}>
                                ??????
                              </Checkbox>
                            )
                          ) : (
                            <Button className="button-custom-compress" size="mini" circular inverted icon title="????????????" value={idx} onClick={this.startCompress.bind(this, inside.nodule_no)}>
                              <Icon className="icon-custom-compress"></Icon>
                            </Button>
                          )}
                        </div>
                        <div>
                          <Button.Group size="mini" className="measureBtnGroup" style={show3DVisualization ? { display: 'none' } : {}}>
                            <Button basic icon title="????????????" active color="green" onClick={this.clearNoduleMeasure.bind(this, idx)}>
                              <Icon inverted color="green" name="eraser"></Icon>
                            </Button>
                            {/* {inside.recVisible && inside.biVisible ? (
                              <Button basic icon title="????????????" active color="blue" onClick={this.onSetNoduleMeasureVisible.bind(this, idx, false)}>
                                <Icon inverted color="blue" name="eye slash"></Icon>
                              </Button>
                            ) : (
                              <Button basic icon title="????????????" active color="blue" onClick={this.onSetNoduleMeasureVisible.bind(this, idx, true)}>
                                <Icon inverted color="blue" name="eye"></Icon>
                              </Button>
                            )} */}
                            {inside.recVisible ? (
                              inside.biVisible ? (
                                <Button basic icon title="????????????" active color="blue" onClick={this.onSetNoduleMeasureVisible.bind(this, idx, false)}>
                                  <Icon inverted color="blue" name="eye slash"></Icon>
                                </Button>
                              ) : (
                                <Button basic icon title="????????????" active color="blue" onClick={this.onSetNoduleMeasureVisible.bind(this, idx, true)}>
                                  <Icon inverted color="blue" name="eye"></Icon>
                                </Button>
                              )
                            ) : null}
                            <Popup
                              on="click"
                              trigger={
                                <Button basic icon title="????????????" active color="grey" style={show3DVisualization ? { display: 'none' } : {}}>
                                  <Icon inverted color="grey" name="trash alternate"></Icon>
                                </Button>
                              }
                              onOpen={this.setDelNodule.bind(this, idx, true)}
                              onClose={this.setDelNodule.bind(this, idx, false)}
                              open={inside.delOpen}>
                              <div className="general-confirm-block">
                                <div className="general-confirm-info">????????????????????????</div>
                                <div className="general-confirm-operation">
                                  <Button inverted size="mini" onClick={this.setDelNodule.bind(this, idx, false)}>
                                    ??????
                                  </Button>
                                  <Button inverted size="mini" onClick={this.onConfirmDelNodule.bind(this, idx)}>
                                    ??????
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
                    <div>{`${item.lobeName}/?????????${item.percent}%`}</div>
                  </div>

                  <div className="threed-accordion-item-content-opacity">
                    ?????????
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
                      <Button size="mini" circular inverted icon="chart bar" title="????????????" hidden={true}></Button>
                    </div>
                    <div>
                      {lobesController.lobesVisible[index] ? (
                        <Button size="mini" basic icon title="??????" active color="blue" onClick={this.setVisible.bind(this, 0, index, item.index)}>
                          <Icon inverted color="blue" name="eye slash"></Icon>
                        </Button>
                      ) : (
                        <Button size="mini" basic icon title="??????" active color="blue" onClick={this.setVisible.bind(this, 0, index, item.index)}>
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
                      {`?????????100cm`}
                      <sup>3</sup>
                    </div>
                  </div>

                  <div className="threed-accordion-item-content-opacity">
                    ?????????
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
                      <Button size="mini" circular inverted icon="chart bar" title="????????????" hidden={true}></Button>
                    </div>
                    <div>
                      {tubularController.tubularVisible[index] ? (
                        <Button size="mini" basic icon title="??????" active color="blue" onClick={this.setVisible.bind(this, 1, index, item.index)}>
                          <Icon inverted color="blue" name="eye slash"></Icon>
                        </Button>
                      ) : (
                        <Button size="mini" basic icon title="??????" active color="blue" onClick={this.setVisible.bind(this, 1, index, item.index)}>
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
                    <div className="lymph-accordion-item-title-volume">{item.volume !== undefined ? `${item.volume.toFixed(3)}cm??` : null}</div>
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
        // ??????
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
        /**???????????? */
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
          let ll,
            sl = 0
          const spacing = this.state.noduleSpacing
          if (measureCoord.measure) {
            if (spacing) {
              ll = Math.sqrt(Math.pow(measureCoord.x1 - measureCoord.x2, 2) + Math.pow(measureCoord.y1 - measureCoord.y2, 2)) * spacing
              sl = Math.sqrt(Math.pow(measureCoord.x3 - measureCoord.x4, 2) + Math.pow(measureCoord.y3 - measureCoord.y4, 2)) * spacing
            } else {
              ll = Math.sqrt(Math.pow(measureCoord.x1 - measureCoord.x2, 2) + Math.pow(measureCoord.y1 - measureCoord.y2, 2))
              sl = Math.sqrt(Math.pow(measureCoord.x3 - measureCoord.x4, 2) + Math.pow(measureCoord.y3 - measureCoord.y4, 2))
            }
          } else {
            ll = 0
            sl = 0
          }
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
              <p>??????????????????</p>
            </div>
            <div id="title-2">
              <p>??????{listsActiveIndex + 1}</p>
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
                ?????????
              </Button>
              <Button onClick={this.onChartTypeChange.bind(this, 'bar')} id="chart-bar-id">
                ?????????
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
                  <td className="title">?????????</td>
                  <td className="range1">{'<' + HUSliderRange[0] + 'HU'}</td>
                  <td className="range2">{HUSliderRange[0] + '~' + HUSliderRange[1] + 'HU'}</td>
                  <td className="range3">{'???' + HUSliderRange[1] + 'HU'}</td>
                  <td className="title">??????</td>
                </tr>
                <tr>
                  <td className="title">??????cm??(??????)</td>
                  <td className="range1">{(range1_volume / 1000).toFixed(3) + '(' + (range1 * 100).toFixed(2) + '%)'}</td>
                  <td className="range2">{(range2_volume / 1000).toFixed(3) + '(' + (range2 * 100).toFixed(2) + '%)'}</td>
                  <td className="range3">{(range3_volume / 1000).toFixed(3) + '(' + (range3 * 100).toFixed(2) + '%)'}</td>
                  <td className="title">{(overall_volume / 1000).toFixed(3)}</td>
                </tr>
                <tr>
                  <td className="title">??????mg(??????)</td>
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
                  <td>{'CT????????????' + CT_max.toFixed(1) + 'HU'}</td>
                  <td>{'??????????????????' + 'IM ' + slice_idx}</td>
                  <td>{`?????????${Kurtosis}`}</td>
                </tr>
                <tr>
                  <td>{'CT????????????' + CT_min.toFixed(1) + 'HU'}</td>
                  <td>{`??????????????????${Maximum}mm??`}</td>
                  <td>{`?????????${Skewness}`}</td>
                </tr>
                <tr>
                  <td>{'CT????????????' + CT_mean.toFixed(1) + 'HU'}</td>
                  <td>{`????????????${SurfaceArea}mm??`}</td>
                  <td>{`?????????${Energy}`}</td>
                </tr>
                <tr>
                  <td>{`CT????????????${CT_std}HU`}</td>
                  <td>{`3D?????????${Maximum3DDiameter}mm`}</td>
                  <td>{`????????????${Compactness2}`}</td>
                </tr>
                <tr>
                  <td>{`????????????${Sphericity}`}</td>
                  <td>{`?????????????????????${apsidal_mean}mm`}</td>
                  <td>{`??????${Entropy}`}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )

      if (dateSeries && dateSeries.length) {
        previewContent = dateSeries.map((item, index) => {
          const vSeries = item.map((serie, serieIndex) => {
            let validStatus = serie.validInfo.status
            let validInfo = serie.validInfo.message
            let statusIcon
            if (validStatus === 'failed') {
              if (validInfo === 'Files been manipulated') {
                statusIcon = (
                  <CloseCircleOutlined style={{ color: 'rgba(219, 40, 40)' }} />
                  // <p>??????????????????</p>
                )
              } else if (validInfo === 'Errors occur during preprocess') {
                statusIcon = (
                  <CloseCircleOutlined style={{ color: 'rgba(219, 40, 40)' }} />
                  // <p>?????????????????????</p>
                )
              } else if (validInfo === 'caseId not found') {
                statusIcon = (
                  <CloseCircleOutlined style={{ color: 'rgba(219, 40, 40)' }} />
                  // <p>???????????????</p>
                )
              }
            } else if (validStatus === 'ok') {
              statusIcon = <CheckCircleOutlined style={{ color: '#52c41a' }} />
            } else {
              statusIcon = <SyncOutlined spin />
            }
            let previewId = 'preview-' + serie.caseId
            let keyId = 'key-' + index + '-' + serieIndex
            let loadedImagePercent = serie.loadedNumber && serie.imageLength ? (serie.loadedNumber / serie.imageLength).toFixed(2) * 100 : 0
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
                loadedImagePercent={loadedImagePercent}
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
            title="????????????"
            className="funcbtn"
          >
            <Icon name="expand arrows alternate" size="large"></Icon>
          </Button> */}
          {readonly ? (
            <div title="??????" onClick={this.submit.bind(this)} className="func-btn">
              <Icon className="func-btn-icon" name="upload" size="large"></Icon>
              <div className="func-btn-desc">??????</div>
            </div>
          ) : (
            // <Button icon title='??????' onClick={this.temporaryStorage} className='funcbtn'><Icon name='inbox' size='large'></Icon></Button>
            <div title="??????" onClick={this.saveToDB.bind(this)} className="func-btn">
              <Icon className="func-btn-icon" name="upload" size="large"></Icon>
              <div className="func-btn-desc">??????</div>
            </div>
          )}
          {readonly ? null : (
            <Popup
              on="click"
              trigger={
                <div title="????????????" onClick={this.setClearUserNodule.bind(this, true)} className="func-btn">
                  <Icon className="func-btn-icon" name="user delete" size="large"></Icon>
                  <div className="func-btn-desc">????????????</div>
                </div>
              }
              onOpen={this.setClearUserNodule.bind(this, true)}
              onClose={this.setClearUserNodule.bind(this, false)}
              open={clearUserOpen}>
              <div className="general-confirm-block">
                <div className="general-confirm-info">???????????????????????????</div>
                <div className="general-confirm-operation">
                  <Button inverted size="mini" onClick={this.setClearUserNodule.bind(this, false)}>
                    ??????
                  </Button>
                  <Button inverted size="mini" onClick={this.onConfirmClearUserNodule.bind(this)}>
                    ??????
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
                <div className="func-btn-desc"> ??????MPR</div>
              </div>
              <div className="func-btn">
                <Icon className="func-btn-icon" name="dot circle" size="large" onClick={this.setMIP.bind(this)} />
                <Popup
                  on="click"
                  trigger={
                    <div className="func-btn-desc">
                      MIP
                      <FontAwesomeIcon icon={faCaretDown} />
                    </div>
                  }
                  position="bottom center"
                  style={{
                    backgroundColor: 'rgb(39, 46, 72)',
                    width: '230px',
                    color: 'whitesmoke',
                  }}>
                  <div>
                    <div className="slab-thick-container">
                      ????????????:
                      <Slider
                        className="slab-thick-slider"
                        value={slabThickness}
                        min={1}
                        step={10}
                        max={5001}
                        tooltipVisible={false}
                        onChange={this.handleSlabThicknessChange.bind(this)}
                        onAfterChange={this.afterHandleSlabThicknessChange.bind(this)}
                      />
                    </div>
                  </div>
                </Popup>
              </div>
              <div className="func-btn" hidden={!displayCrosshairs} onClick={this.toggleCrosshairs.bind(this, false)} description="hidden crosshairs">
                <Icon className="func-btn-icon icon-custom icon-custom-HC" size="large" />
                <div className="func-btn-desc"> ???????????????</div>
              </div>
              <div className="func-btn" hidden={displayCrosshairs} onClick={this.toggleCrosshairs.bind(this, true)} description="show crosshairs">
                <Icon className="func-btn-icon icon-custom icon-custom-SC" size="large" />
                <div className="func-btn-desc"> ???????????????</div>
              </div>
              <div className="func-btn" hidden={!painting} onClick={this.endPaint.bind(this)} description="end painting">
                <Icon className="func-btn-icon" name="window close outline" size="large" />
                <div className="func-btn-desc"> ????????????</div>
              </div>
              <div className="func-btn" hidden={painting} onClick={this.beginPaint.bind(this)} description="begin painting">
                <Icon className="func-btn-icon" name="paint brush" size="large" />
                <div className="func-btn-desc"> ????????????</div>
              </div>
              <div className={'func-btn' + (!erasing ? ' func-btn-active' : '')} hidden={!painting} onClick={this.doPaint.bind(this)} description="do painting">
                <Icon className="func-btn-icon" name="paint brush" size="large" />
                <div className="func-btn-desc"> ??????</div>
              </div>
              <div className={'func-btn' + (erasing ? ' func-btn-active' : '')} hidden={!painting} onClick={this.doErase.bind(this)} description="do erasing">
                <Icon className="func-btn-icon" name="eraser" size="large" />
                <div className="func-btn-desc"> ??????</div>
              </div>
              <Popup
                on="click"
                trigger={
                  <div className="func-btn" hidden={!painting}>
                    <Icon className="func-btn-icon" name="dot circle" size="large" />
                    <div className="func-btn-desc"> mask??????</div>
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
                    ????????????:
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
                    ????????????:
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
                    <div className="func-btn-desc"> mask??????</div>
                  </div>
                }
                position="bottom center"
                style={{
                  backgroundColor: 'rgb(39, 46, 72)',
                  width: '180px',
                  color: 'whitesmoke',
                }}>
                <div className="segment-label-color-selector">
                  ??????????????????
                  <InputColor initialValue="#FF0000" onChange={this.setPaintColor.bind(this)} placement="right" />
                </div>
              </Popup>
              {CPR ? (
                <>
                  <div className="func-btn" onClick={this.setCPR.bind(this)}>
                    <Icon className="func-btn-icon" name="window close outline" size="large" />
                    <div className="func-btn-desc"> ??????CPR</div>
                  </div>
                  <div className="func-btn" onClick={this.pickAirway.bind(this)} description="reconstuct airway">
                    <Icon className="func-btn-icon icon-custom icon-custom-RA" size="large" />
                    <div className="func-btn-desc"> ????????????</div>
                  </div>
                </>
              ) : (
                <div className="func-btn" onClick={this.setCPR.bind(this)} hidden={showMPRDirectly}>
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
            <div title="??????" className={'func-btn'} onClick={this.setRegistering.bind(this)}>
              <Icon className="func-btn-icon" name="window restore outline" size="large"></Icon>
              <div className="func-btn-desc">????????????</div>
            </div>
          ) : (
            <div title="??????" className={'func-btn'} onClick={this.setRegistering.bind(this)}>
              <Icon className="func-btn-icon" name="window restore outline" size="large"></Icon>
              <div className="func-btn-desc">????????????</div>
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
                    ??????
                    <FontAwesomeIcon icon={faCaretDown} />
                  </div>
                </>
              }>
              <Dropdown.Menu>
                <Dropdown.Item text="??????" icon="search plus" onClick={this.onZoomIn.bind(this)} />
                <Dropdown.Item text="??????" icon="search minus" onClick={this.onZoomOut.bind(this)} />
              </Dropdown.Menu>
            </Dropdown>
          </div>
          <div onClick={this.onResetView.bind(this)} className="func-btn" title="??????">
            <Icon className="func-btn-icon" name="repeat" size="large"></Icon>
            <div className="func-btn-desc">??????</div>
          </div>
          <div
            title="????????????"
            onClick={this.onSetCornerActiveTool.bind(this, 'Wwwc')}
            className={'func-btn' + (!showFollowUp ? (cornerActiveTool === 'Wwwc' ? ' func-btn-active' : '') : followUpActiveTool === 'Wwwc' ? ' func-btn-active' : '')}
            hidden={show3DVisualization}>
            <Icon className="func-btn-icon icon-custom icon-custom-wwwc" size="large"></Icon>
            <div className="func-btn-desc">
              <Dropdown
                icon={null}
                trigger={
                  <>
                    ????????????
                    <FontAwesomeIcon icon={faCaretDown} />
                  </>
                }>
                <Dropdown.Menu>
                  <Dropdown.Item text="??????" onClick={this.onSetWwwcFlip.bind(this)} />
                  <Dropdown.Item text="??????" onClick={this.onSetWwwcToPulmonary.bind(this)} />
                  <Dropdown.Item text="??????" onClick={this.onSetWwwcToBone.bind(this)} />
                  <Dropdown.Item text="??????" onClick={this.onSetWwwcToVentral.bind(this)} />
                  <Dropdown.Item text="?????????" onClick={this.onSetWwwcToMedia.bind(this)} />
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </div>
          {show3DVisualization ? threedMenus : null}
          {showFollowUp ? followUpMenus : null}

          {cornerIsPlaying || followUpIsPlaying ? (
            <div onClick={this.onSetAnimationPlaying.bind(this, false)} className="func-btn" title="????????????" hidden={show3DVisualization}>
              <Icon className="func-btn-icon" name="pause" size="large"></Icon>
              <div className="func-btn-desc">??????</div>
            </div>
          ) : (
            <div onClick={this.onSetAnimationPlaying.bind(this, true)} className="func-btn" title="????????????" hidden={show3DVisualization}>
              <Icon className="func-btn-icon" name="play" size="large"></Icon>
              <div className="func-btn-desc">??????</div>
            </div>
          )}

          {cornerAnnoVisible ? (
            <div onClick={this.onSetAnnoVisible.bind(this, false)} className="func-btn" title="????????????" hidden={show3DVisualization || showFollowUp}>
              <Icon className="func-btn-icon" id="cache-button" name="eye slash" size="large"></Icon>
              <div className="func-btn-desc">????????????</div>
            </div>
          ) : (
            <div onClick={this.onSetAnnoVisible.bind(this, true)} className="func-btn" title="????????????" hidden={show3DVisualization || showFollowUp}>
              <Icon className="func-btn-icon" id="cache-button" name="eye" size="large"></Icon>
              <div className="func-btn-desc">????????????</div>
            </div>
          )}
          {cornerIsOverlayVisible ? (
            <div onClick={this.onSetOverlayVisible.bind(this, false)} className="func-btn" title="????????????" hidden={show3DVisualization || showFollowUp}>
              <Icon className="func-btn-icon" id="cache-button" name="delete calendar" size="large"></Icon>
              <div className="func-btn-desc">????????????</div>
            </div>
          ) : (
            <div onClick={this.onSetOverlayVisible.bind(this, true)} className="func-btn" title="????????????" hidden={show3DVisualization || showFollowUp}>
              <Icon className="func-btn-icon" id="cache-button" name="content" size="large"></Icon>
              <div className="func-btn-desc">????????????</div>
            </div>
          )}
          {cornerMouseCoordVisible ? (
            <div onClick={this.onSetMouseCoordVisible.bind(this, false)} className={'func-btn'} title="????????????" hidden={show3DVisualization || showFollowUp}>
              <Icon className="func-btn-icon" id="cache-button" name="location arrow slash" size="large"></Icon>
              <div className="func-btn-desc">????????????</div>
            </div>
          ) : (
            <div onClick={this.onSetMouseCoordVisible.bind(this, true)} className="func-btn" title="????????????" hidden={show3DVisualization || showFollowUp}>
              <Icon className="func-btn-icon" id="cache-button" name="location arrow" size="large"></Icon>
              <div className="func-btn-desc">????????????</div>
            </div>
          )}
          <div
            title="????????????"
            onClick={this.onSetCornerActiveTool.bind(this, 'StackScroll')}
            hidden={show3DVisualization}
            className={'func-btn' + (!showFollowUp ? (cornerActiveTool === 'StackScroll' ? ' func-btn-active' : '') : followUpActiveTool === 'StackScroll' ? ' func-btn-active' : '')}>
            <Icon className="func-btn-icon" name="sort" size="large"></Icon>
            <div className="func-btn-desc">??????</div>
          </div>
          <div
            onClick={this.onSetCornerActiveTool.bind(this, 'RectangleRoi')}
            title="??????"
            hidden={show3DVisualization || showFollowUp}
            className={'func-btn' + (!showFollowUp ? (cornerActiveTool === 'RectangleRoi' ? ' func-btn-active' : '') : followUpActiveTool === 'RectangleRoi' ? ' func-btn-active' : '')}>
            <Icon className="func-btn-icon" name="edit" size="large"></Icon>
            <div className="func-btn-desc">??????</div>
          </div>
          <div
            onClick={this.onSetCornerActiveTool.bind(this, 'Bidirectional')}
            title="??????"
            hidden={show3DVisualization}
            className={'func-btn' + (!showFollowUp ? (cornerActiveTool === 'Bidirectional' ? ' func-btn-active' : '') : followUpActiveTool === 'Bidirectional' ? ' func-btn-active' : '')}>
            <Icon className="func-btn-icon" name="crosshairs" size="large"></Icon>
            <div className="func-btn-desc">??????</div>
          </div>
          <div
            onClick={this.onSetCornerActiveTool.bind(this, 'Length')}
            title="??????"
            hidden={show3DVisualization}
            className={'func-btn' + (!showFollowUp ? (cornerActiveTool === 'Length' ? ' func-btn-active' : '') : followUpActiveTool === 'Length' ? ' func-btn-active' : '')}>
            <Icon className="func-btn-icon" name="arrows alternate vertical" size="large"></Icon>
            <div className="func-btn-desc">??????</div>
          </div>
          <div
            onClick={this.onSetCornerActiveTool.bind(this, 'Eraser')}
            title="??????"
            hidden={show3DVisualization}
            className={'func-btn' + (!showFollowUp ? (cornerActiveTool === 'Eraser' ? ' func-btn-active' : '') : followUpActiveTool === 'Eraser' ? ' func-btn-active' : '')}>
            <Icon className="func-btn-icon" name="eraser" size="large"></Icon>
            <div className="func-btn-desc">??????</div>
          </div>
          {/* <div onClick={this.toggleLobeBorder.bind(this)} title="????????????" className={'func-btn' + (displayBorder ? ' func-btn-active' : '')}>
            <Icon className="func-btn-icon icon-custom icon-custom-LB" size="large" />
            <div className="func-btn-desc"> ????????????</div>
          </div> */}
          {!show3DVisualization && !showFollowUp ? twodMenus : null}
          {show3DVisualization ? (
            <div className="func-btn" onClick={this.hide3D.bind(this)} hidden={showFollowUp}>
              <Icon className="func-btn-icon icon-custom icon-custom-hide-3d" size="large"></Icon>
              <div className="func-btn-desc"> ??????3D</div>
            </div>
          ) : (
            <div title="??????3D" className="func-btn" onClick={this.show3D.bind(this)} hidden={showFollowUp}>
              <Icon className="func-btn-icon icon-custom icon-custom-show-3d" size="large"></Icon>
              <div className="func-btn-desc">??????3D</div>
            </div>
          )}
          {!show3DVisualization && !showFollowUp && !MPR ? (
            <div className="func-btn" hidden={MPR} onClick={this.goMPRDirectly.bind(this)}>
              <Icon className="func-btn-icon icon-custom icon-custom-mpr-show" size="large" />
              <div className="func-btn-desc"> MPR</div>
            </div>
          ) : null}
          {showFollowUp ? (
            <div title="??????" className={'func-btn'} onClick={this.hideFollowUp.bind(this)} hidden={show3DVisualization || renderLoading}>
              <Icon className="func-btn-icon" name="history" size="large"></Icon>
              <div className="func-btn-desc">????????????</div>
            </div>
          ) : (
            <div title="??????" className={'func-btn'} onClick={this.showFollowUp.bind(this)} hidden={show3DVisualization || renderLoading}>
              <Icon className="func-btn-icon" name="history" size="large"></Icon>
              <div className="func-btn-desc">????????????</div>
            </div>
          )}

          <div title="Slicer" className={'func-btn'} onClick={this.enter3DSlicer.bind(this)} hidden={true}>
            <Icon className="func-btn-icon icon-custom icon-custom-slicer" size="large" />
            <div className="func-btn-desc">Slicer</div>
          </div>
        </>
      )
      let initialNoduleColor = 'FFFF00'
      try {
        const splitedNoduleColor = noduleColor.substring(5, noduleColor.length - 1).split(',')
        splitedNoduleColor.pop()
        initialNoduleColor = splitedNoduleColor
          .map((item) => {
            let hex = Number(item).toString(16)
            if (hex.length === 1) {
              hex = `0${hex}`
            }
            return hex
          })
          .join('')
      } catch (e) {
        console.log(e)
      }
      return (
        <div id="corner-container">
          <div id="corner-top-row">
            <div className="corner-header">
              <div id="menu-item-logo">
                {/* <Image src={src1} avatar size="mini" /> */}
                <a id="sys-name" href="/searchCase">
                  ?????????CT????????????????????????
                </a>
                {menuScrollable && menuNowPage > 1 ? <FontAwesomeIcon icon={faChevronLeft} onClick={this.onMenuPageUp.bind(this)} className="menu-item-buttons-direction direction-page-up" /> : <></>}
              </div>
              <div id="menu-item-buttons" style={{ transform: `translateX(${-menuTransform}px)` }}>
                <div onClick={this.onSetStudyList.bind(this, !studyListShowed)} className={'func-btn' + (studyListShowed ? ' func-btn-active' : '')}>
                  <Icon className="func-btn-icon" name="list" size="large"></Icon>
                  <div className="func-btn-desc"> ??????</div>
                </div>
                <span className="menu-line"></span>
                {originMenus}
              </div>

              <div id="menu-item-user">
                <Dropdown text={`????????????${realname}`}>
                  <Dropdown.Menu id="logout-menu">
                    <Dropdown.Item icon="home" text="????????????" onClick={this.toHomepage.bind(this)} />
                    {/* <Dropdown.Item
                    icon="write"
                    text="??????"
                    onClick={this.handleWriting}
                  /> */}
                    <Modal
                      className="corner-setting-modal"
                      open={settingOpen}
                      onOpen={this.setSettingOpen.bind(this, true)}
                      onClose={this.setSettingOpen.bind(this, false)}
                      trigger={<Dropdown.Item icon="settings" text="??????" />}>
                      <Modal.Header className="corner-setting-modal-header">????????????</Modal.Header>
                      <Modal.Content className="corner-setting-modal-content">
                        <Modal.Description>
                          <div className="corner-setting-modal-content-container">
                            <div className="corner-setting-modal-content-container-block">
                              <div className="corner-setting-modal-content-container-name">
                                ???????????????????????????
                                <div className="corner-setting-modal-content-container-tip">
                                  <Tooltip placement="top" title={'???????????????????????????????????????????????????????????????active????????????'}>
                                    <ExclamationCircleOutlined />
                                    {/* <ExclamationCircleFilled /> */}
                                  </Tooltip>
                                </div>
                              </div>
                              <div className="corner-setting-modal-content-container-opt">
                                <Switch defaultChecked={noduleColorSetting} onChange={this.onChangeNoduleColorSetting.bind(this)} />
                              </div>
                            </div>
                            {noduleColorSetting ? (
                              <div className="corner-setting-modal-content-container-block">
                                <div className="corner-setting-modal-content-container-name">?????????????????????</div>
                                <div className="corner-setting-modal-content-container-opt">
                                  <InputColor initialValue={initialNoduleColor} onChange={this.setNoduleColor.bind(this)} placement="right" />
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </Modal.Description>
                      </Modal.Content>
                    </Modal>

                    <Dropdown.Item icon="trash alternate" text="????????????" onClick={this.clearLocalStorage.bind(this)} />
                    <Dropdown.Item icon="log out" text="??????" onClick={this.handleLogout.bind(this)} />
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
                                this.subs.cornerMouseMove.sub(
                                  cornerElement.addEventListener('cornerstonetoolsmousemove', (e) => {
                                    this.mouseMovePositionDisplay(e)
                                  })
                                )
                                this.subs.cornerMouseDrag.sub(
                                  cornerElement.addEventListener('cornerstonetoolsmousedrag', (e) => {
                                    if (e.detail.buttons === 2) {
                                      this.zoomToCenterStrategy(e)
                                    }
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
                          <TabPane tab={'?????????'} key="1">
                            <Tabs type="card" defaultActiveKey="1" size="small">
                              <TabPane tab={`????????? ${boxes.length}???`} key="1">
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
                                        <Header.Content>????????????????????????</Header.Content>
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
                                            ??????
                                          </Checkbox>
                                          <Checkbox
                                            className="nodule-filter-desc-checkbox"
                                            checked={smallNodulesChecked}
                                            onChange={this.onHandleSmallNodulesCheckChange.bind(this)}
                                            onClick={this.onHandleSmallNodulesCheckClick.bind(this)}>
                                            ????????????
                                          </Checkbox>
                                          <div className="nodule-filter-desc-text">?????????{noduleNumber}?????????</div>
                                          {noduleCompressing ? (
                                            <Popup
                                              on="click"
                                              trigger={
                                                <div className="nodule-filter-desc-compress">
                                                  <Button className="nodule-filter-desc-compress-header" size="mini" inverted onClick={this.setConfirmCompress.bind(this, true)}>
                                                    ??????
                                                  </Button>
                                                </div>
                                              }
                                              onOpen={this.setConfirmCompress.bind(this, true)}
                                              onClose={this.setConfirmCompress.bind(this, false)}
                                              open={confirmCompressing}>
                                              <div className="general-confirm-block">
                                                <div className="general-confirm-info">{`????????????${compressedNodules ? compressedNodules : ''}?????????`}</div>
                                                <div className="general-confirm-operation">
                                                  <Button inverted size="mini" onClick={this.setConfirmCompress.bind(this, false)}>
                                                    ??????
                                                  </Button>
                                                  <Button inverted size="mini" onClick={this.finishCompress.bind(this)}>
                                                    ??????
                                                  </Button>
                                                </div>
                                              </div>
                                            </Popup>
                                          ) : null}
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
                                                ?????????
                                                <span>{noduleNumber}</span>
                                                ?????????
                                              </div>
                                              <div className="nodule-filter-operation-select-content">
                                                <div className="nodule-filter-operation-select-content-block">
                                                  <div className="nodule-filter-operation-select-content-header">????????????</div>
                                                  {noduleSelectContent[0]}
                                                </div>
                                                <div className="nodule-filter-operation-select-content-block">
                                                  <div className="nodule-filter-operation-select-content-header">????????????</div>
                                                  {noduleSelectContent[1]}
                                                </div>
                                                <div className="nodule-filter-operation-select-content-block">
                                                  <div className="nodule-filter-operation-select-content-header">?????????</div>
                                                  {noduleSelectContent[2]}
                                                </div>
                                                <div className="nodule-filter-operation-select-content-bottom">
                                                  <div className="nodule-filter-operation-select-content-bottom-left">
                                                    <Checkbox
                                                      className="nodule-filter-operation-select-content-bottom-check"
                                                      checked={nodulesAllSelected}
                                                      onChange={this.onHandleSelectAllNodules.bind(this)}></Checkbox>
                                                    ??????
                                                    {boxes.length > 20 ? (
                                                      <Checkbox
                                                        className="nodule-filter-desc-checkbox"
                                                        checked={noduleLimited}
                                                        onChange={this.onHandleNoduleLimitChange.bind(this)}
                                                        onClick={this.onHandleNoduleLimitClick.bind(this)}>
                                                        ??????20???
                                                      </Checkbox>
                                                    ) : null}
                                                  </div>

                                                  <div className="nodule-filter-operation-select-content-bottom-right">
                                                    <Button className="nodule-filter-operation-select-content-bottom-button" onClick={this.onHandleSelectNoduleComplete.bind(this)}>
                                                      ??????
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
                                              <div className="nodule-filter-operation-sort-header">??????</div>
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
                                  <TabPane tab={'??????'} key="3">
                                    <div id="elec-table">
                                      <div className="threed-filter">
                                        <div className="threed-filter-desc-index">1</div>
                                        <div className="threed-filter-desc">
                                          <Checkbox
                                            className="threed-filter-desc-checkbox"
                                            checked={lobesAllChecked}
                                            onChange={this.onHandleThreedAllCheckChange.bind(this, 0)}
                                            onClick={this.onHandleThreedAllCheckClick.bind(this)}>
                                            ??????
                                          </Checkbox>
                                          <div className="threed-filter-desc-text">?????????{lobeCheckNumber}?????????</div>
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
                                  <TabPane tab={'???????????????'} key="4">
                                    <div id="elec-table">
                                      <div className="threed-filter">
                                        <div className="threed-filter-desc-index">1</div>

                                        <div className="threed-filter-desc">
                                          <Checkbox
                                            className="threed-filter-desc-checkbox"
                                            checked={tubularAllChecked}
                                            onChange={this.onHandleThreedAllCheckChange.bind(this, 1)}
                                            onClick={this.onHandleThreedAllCheckClick.bind(this)}>
                                            ??????
                                          </Checkbox>
                                          <div className="threed-filter-desc-text">?????????{tubularCheckNumber}???????????????</div>
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
                                <>{/* <TabPane tab={'??????'} key="2"></TabPane> */}</>
                              )}
                            </Tabs>
                          </TabPane>
                          {/* <TabPane tab={'????????????'} key="2">
                            <Tabs type="card" defaultActiveKey="1" size="small">
                              <TabPane tab={`????????? ${lymphs.length}???`} key="1">
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
                                        <Header.Content>???????????????????????????</Header.Content>
                                      </Header>
                                    </div>
                                  )}
                                </div>
                              </TabPane>
                            </Tabs>
                          </TabPane> */}
                          {/* <TabPane tab={'??????'} key="3"></TabPane> */}
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
                            //   <div className="lobe-func-header">?????????</div>
                            //   <div className="lobe-func-content">
                            //     <div className="lobe-func-item">???1?????????????????????(fev1)???2.24</div>
                            //     <div className="lobe-func-item">???1????????????????????????????????????????????????(fev1%pred)???95%</div>
                            //     <div className="lobe-func-item">???????????????(fvc)???3.38</div>
                            //     <div className="lobe-func-item">??????????????????????????????????????????fvc%pred)???115%</div>
                            //     <div className="lobe-func-item">???????????????????????????????????????????????????(fev1/fvc%)???66.7%</div>
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
                                  <Modal
                                    className="corner-report-modal"
                                    open={pdfReading}
                                    onOpen={this.setPdfReading.bind(this, true)}
                                    onClose={this.setPdfReading.bind(this, false)}
                                    trigger={<Icon name="expand arrows alternate" title="??????" className="inverted blue button" onClick={this.showImages.bind(this)}></Icon>}>
                                    <Modal.Header className="corner-report-modal-header">
                                      <Row>
                                        <Col span={12} className="corner-report-modal-header-info">
                                          ??????????????????
                                        </Col>
                                        <Col span={12} className="corner-report-modal-header-button">
                                          {pdfLoadingCompleted ? (
                                            <Button color="blue" onClick={this.exportPDF.bind(this)}>
                                              ??????pdf
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

                                  <Icon title="??????" className="inverted blue button" name="copy outline" onClick={this.handleCopyClick.bind(this)}></Icon>
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
                                placeholder="????????????????????????"
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
          {cornerMouseCoordVisible && cornerMouseInside ? (
            <div
              className="imagePos"
              style={{ position: 'absolute', color: '#54c8ff', top: `${mousemovePos.startY + 30}px`, left: `${mousemovePos.startX - 50}px`, zIndex: 1, fontWeight: 'bold', fontSize: '16px' }}>
              ({mousemovePos.imageX.toFixed(0)},{mousemovePos.imageY.toFixed(0)})
            </div>
          ) : null}
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
  getDirectMPRStyles(viewerWidth, viewerHeight) {
    if (typeof viewerWidth == 'undefined') {
      viewerWidth = this.state.viewerWidth
    }
    if (typeof viewerHeight == 'undefined') {
      viewerHeight = this.state.viewerHeight
    }
    const directMPRStyles = {
      top: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: viewerWidth,
        height: viewerHeight / 2,
        borderRight: '2px solid #d1d1d1e0',
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
    return {
      axial: directMPRStyles.top,
      coronal: directMPRStyles.bottomLeft,
      sagittal: directMPRStyles.bottomRight,
    }
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
    if (this.state.showMPRDirectly) {
      this.hide3D()
      this.setState({
        showMPRDirectly: false,
      })
      return
    }
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
  setMIP() {
    if (this.state.MIP) {
      this.setState({
        MIP: false,
      })
    } else {
      this.setState({
        MIP: true,
      })
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
      voi.windowWidth = 1800
      voi.windowCenter = -400
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
      if (this.viewer3D) {
        this.viewer3D.setContainerSize(viewerWidth, viewerHeight)
      }
    } else if (mode === 2) {
      const MPRStyles = this.getMPRStyles()
      if (this.viewer3D) {
        this.viewer3D.setContainerSize(MPRStyles.threeD.width, MPRStyles.threeD.height)
      }
    } else if (mode === 3) {
      const CPRStyles = this.getCPRStyles()
      if (this.viewer3D) {
        this.viewer3D.setContainerSize(CPRStyles.threeD.width, CPRStyles.threeD.height)
      }
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
          if (this.viewerAxial) {
            this.viewerAxial.setContainerSize(MPRStyles.axial.width, MPRStyles.axial.height)
          }
          if (this.viewerCoronal) {
            this.viewerCoronal.setContainerSize(MPRStyles.coronal.width, MPRStyles.coronal.height)
          }
          if (this.viewerSagittal) {
            this.viewerSagittal.setContainerSize(MPRStyles.sagittal.width, MPRStyles.sagittal.height)
          }
        }
        if (mode === 3) {
          const CPRStyles = this.getCPRStyles()
          // this.viewerAxial.setContainerSize(CPRStyles.axial.width, CPRStyles.axial.height)
          // this.viewerCoronal.setContainerSize(CPRStyles.coronal.width, CPRStyles.coronal.height)
          // this.viewerSagittal.setContainerSize(CPRStyles.sagittal.width, CPRStyles.sagittal.height)
          // this.viewerAirway.setContainerSize(CPRStyles.airway.width, CPRStyles.airway.height)
        }
        if (mode === 4) {
          const directMPRStyles = this.getDirectMPRStyles()
          if (this.viewerAxial) {
            this.viewerAxial.setContainerSize(directMPRStyles.axial.width, directMPRStyles.axial.height)
          }
          if (this.viewerCoronal) {
            this.viewerCoronal.setContainerSize(directMPRStyles.coronal.width, directMPRStyles.coronal.height)
          }
          if (this.viewerSagittal) {
            this.viewerSagittal.setContainerSize(directMPRStyles.sagittal.width, directMPRStyles.sagittal.height)
          }
        }
      }
    )
  }
  changeSelectedNum(selectedNum) {
    this.setState({
      selectedNum: selectedNum,
    })
  }
  handleSlabThicknessChange(value) {
    this.setState({
      slabThickness: value,
    })
    const valueInMM = value / 10
    const apis = this.apis
    apis.forEach((api) => {
      const renderWindow = api.genericRenderWindow.getRenderWindow()

      api.setSlabThickness(valueInMM)
      renderWindow.render()
    })
  }
  afterHandleSlabThicknessChange(value) {}
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

      const mapper = api.volumes[0].getMapper()
      if (mapper.setBlendModeToMaximumIntensity) {
        mapper.setBlendModeToMaximumIntensity()
      }
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
        message.error('??????????????????')
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
        message.error('????????????')
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
      message.error('?????????????????????')
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
    const outputExtent = [512, 512] //*
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
    const p2 = [180, 512, 0] //*
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
  saveTime(period) {
    //if (this.state.unsaved)
    const timestamp = new Date()
    const params = {
      username: this.state.username,
      studyId: '',
      caseId: this.state.caseId,
      duration: period,
    }
    axios.post(this.config.user.userUsageDuration, qs.stringify(params)).then((res) => {
      console.log('userUsageDuration', res)
    })
  }
}

// export default withRouter(CornerstoneElement);
export default connect(
  (state) => {
    return {
      caseData: state.dataCenter.caseData,
      loadedImages: state.dataCenter.loadedImages,
      needUpdateLoadedImages: state.dataCenter.needUpdateLoadedImages,
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
      updateLoadedImageNumber: (loadedImageIndex, caseId) => dispatch(updateLoadedImageNumber(loadedImageIndex, caseId)),
      dispatch,
    }
  }
)(CornerstoneElement)
