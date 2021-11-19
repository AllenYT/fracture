import React, { Component } from 'react'
import { connect } from 'react-redux'
import cornerstone from 'cornerstone-core'
import cornerstoneTools from 'cornerstone-tools'
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader'
import { Icon, Button, Accordion, Modal, Dropdown, Menu, Label, Header, Popup, Table, Sidebar, Loader, Divider, Form, Card } from 'semantic-ui-react'
import { Slider, Select, Checkbox, Tabs, InputNumber, Popconfirm, message, Cascader, Radio, Row, Col } from 'antd'
import { CloseCircleOutlined, CheckCircleOutlined, ConsoleSqlOutlined, SyncOutlined } from '@ant-design/icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronLeft, faChevronRight, faChevronDown, faChevronUp, faCaretDown, faFilter, faSortAmountDownAlt, faSortUp, faSortDown, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons'
import qs from 'qs'
import axios from 'axios'
import md5 from 'js-md5'
import _ from 'lodash'
import { vec3, vec4, mat4 } from 'gl-matrix'
import html2pdf from 'html2pdf.js'
import copy from 'copy-to-clipboard'
import * as echarts from 'echarts'

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

import { getConfigJson, getImageIdsByCaseId, getNodulesByCaseId, dropCaseId, setFollowUpPlaying } from '../actions'
import { loadAndCacheImagePlus } from '../lib/cornerstoneImageRequest'
import { executeTask } from '../lib/taskHelper'

import CornerElement from '../components/CornerElement'
import SegmentElement from '../components/SegmentElement'

import PreviewElement from '../components/PreviewElement'
import '../css/ct.css'
import '../initCornerstone.js'

cornerstoneWADOImageLoader.external.cornerstone = cornerstone
window.cornerstoneTools = cornerstoneTools
const { TabPane } = Tabs

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

let leftSlideTimer = undefined

class CTpanel extends Component {
  constructor(props) {
    super(props)
    this.state = {
      caseId: window.location.pathname.split('/ct/')[1].split('/')[0].replace('%23', '#'),
      modelName: window.location.pathname.split('/')[3],
      username: localStorage.getItem('username'),
      realname: localStorage.getItem('realname'),

      windowWidth: 0,
      windowHeight: 0,
      verticalMode: false,
      bottomRowHeight: 0,
      ctInfoPadding: 0,

      studyListShowed: false,
      showFollowUp: false,
      show3DVisualization: false,
      showMPR: false,
      showCPR: false,

      dateSeries: [],
      previewVisible: [],

      imageIds: [],
      nodules: [],
      noduleMarks: {},
      sliderMarks: {},
      boxes: [],
      currentIdx: 0,
      listsActiveIndex: -1,

      lymphs: [],
      lymphMarks: {},
      lymphsActiveIndex: -1,

      urls: [],
      nodulesData: null,
      lobesData: null,
      tubularData: null,
      segments: [],

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
      origin: [0, 0, 0],
      voi: { windowWidth: 1600, windowCenter: -600 },

      lobesController: null,
      lobesAllChecked: false,
      lobesAllVisible: true,
      tubularController: null,
      tubularAllChecked: false,
      tubularAllVisible: true,

      dicomTag: {},

      mode: 0,
    }
    this.config = JSON.parse(localStorage.getItem('config'))
  }
  async componentDidMount() {
    if (document.getElementById('main')) {
      document.getElementById('main').setAttribute('style', 'height:100%;padding-bottom:0px')
    }
    if (document.getElementById('header')) {
      document.getElementById('header').style.display = 'none'
    }
    if (document.getElementById('footer')) {
      document.getElementById('footer').style.display = 'none'
    }

    this.resizeScreen()
    window.addEventListener('resize', this.resizeScreen.bind(this))
    // this.login()

    this.apis = []

    if (localStorage.getItem('token') == null) {
      const sessionString =
        window.location.pathname.split('/')[0] + '/' + window.location.pathname.split('/')[1] + '/' + window.location.pathname.split('/')[2] + '/' + window.location.pathname.split('/')[3]
      sessionStorage.setItem('location', sessionString)
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
      console.log('nodules', nodules)
      console.log('noduleMarks', noduleMarks)
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
    this.loadStudyBrowser()

    const boxes = nodules
    const annoImageIds = []
    for (let i = 0; i < boxes.length; i++) {
      let slice_idx = boxes[i].slice_idx
      for (let j = slice_idx - 5; j < slice_idx + 5; j++) {
        if (j >= 0 && j < imageIds.length) {
          annoImageIds.push(imageIds[j])
        }
      }
    }
    const annoPromises = annoImageIds.map((annoImageId) => {
      return loadAndCacheImagePlus(annoImageId, 2)
    })
    Promise.all(annoPromises).then((res) => console.log('anno images', res))

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
      return loadAndCacheImagePlus(imageId, 3)
    })
    await Promise.all(promises).then((res) => console.log('all images', res))

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
              order = Math.round(urlItem[urlItem.length - 5])
              type = originType + order
            } else if (originType === 'nodule') {
              order = Math.round(urlItem[urlItem.length - 5])
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
    if (document.getElementById('main')) {
      document.getElementById('main').setAttribute('style', '')
    }
    if (document.getElementById('header')) {
      document.getElementById('header').style.display = ''
    }
    if (document.getElementById('footer')) {
      document.getElementById('footer').style.display = ''
    }

    window.removeEventListener('resize', this.resizeScreen.bind(this))
  }
  componentDidUpdate(prevState, prevProps) {}

  async login() {
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
  loadDisplay(currentIdx) {
    // first let's check the status to display the proper contents.
    // send our token to the server, combined with the current pathname
    const token = localStorage.getItem('token')
    const headers = {
      Authorization: 'Bearer '.concat(token), //add the fun of check
    }
    const imageIds = this.state.imageIds
    if (this.state.modelName === 'origin') {
      loadAndCacheImagePlus(imageIds[currentIdx], 1).then((image) => {
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
          loadAndCacheImagePlus(imageIds[currentIdx], 1).then((image) => {
            // console.log('image info', image.data)
            const dicomTag = image.data

            let draftStatus = -1
            draftStatus = readonlyResponse.data.status
            const boxes = this.state.nodules
            // this.refreshImage(true, imageIds[currentIdx], undefined)

            const okParams = {
              caseId: this.state.caseId,
              username: window.location.pathname.split('/')[3],
            }
            console.log('okParams', okParams)

            const stateListLength = boxes.length
            const measureArr = new Array(stateListLength).fill(false)

            const maskArr = new Array(stateListLength).fill(true)
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
              () => {}
            )
          })
        })
    }
  }
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
    axios
      .post(this.config.record.getSubListForMainItem_front, qs.stringify(params))
      .then((response) => {
        const data = response.data
        console.log('getSubListForMainItem_front response', response)
        if (data.status !== 'okay') {
          throw new Error('getSubListForMainItem_front failed')
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
      .catch((e) => console.log('error', e))

    // const getStudyListPromise = new Promise((resolve, reject) => {

    // });
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
  toHomepage() {
    window.location.href = '/homepage'
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
  resizeScreen() {
    const verticalMode = document.body.clientWidth < document.body.clientHeight ? true : false
    this.setState({
      windowWidth: document.body.clientWidth,
      windowHeight: document.body.clientHeight,
      verticalMode,
    })
    if (document.getElementById('corner-top-row')) {
      const cornerTopRow = document.getElementById('corner-top-row')
      const cornerTopRowHeight = cornerTopRow.clientHeight
      const cornerBottomRowHeight = document.body.clientHeight - cornerTopRowHeight - 5
      this.setState(
        {
          bottomRowHeight: cornerBottomRowHeight,
        },
        () => {}
      )
    }
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

  onSetPreviewActive(idx) {
    const previewVisible = this.state.previewVisible
    previewVisible[idx] = !previewVisible[idx]
    this.setState({
      previewVisible,
    })
  }
  setMode() {
    const { show3DVisualization, showFollowUp, showMPR, showCPR } = this.state
  }
  getAllStyles() {
    /* 
    for mode parameter:
    0:normal-h (2D, 3D)
    1:normal-v (2D, 3D)
    2:fu (follow up)
    3.mpr
    4.cpr
    */
    const { mode } = this.state
    let containerCN
    let childrenCNs = []
    switch (mode) {
      case 0:
        containerCN = 'ct-n-h'
        childrenCNs.push('ct-n-h-l')
        childrenCNs.push('ct-n-h-r')
        break
      case 1:
        containerCN = 'ct-n-v'
        childrenCNs.push('ct-n-v-l')
        childrenCNs.push('ct-n-v-r')
        break
      default:
        break
    }
  }
  render() {
    const {
      caseId,
      modelName,
      username,
      realname,

      windowWidth,
      windowHeight,
      verticalMode,
      bottomRowHeight,
      ctInfoPadding,

      studyListShowed,
      showFollowUp,
      show3DVisualization,

      dateSeries,
      previewVisible,

      imageIds,
      sliderMarks,
      boxes,
      currentIdx,
      listsActiveIndex,
      mode,
    } = this.state
    let previewContent

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

    return (
      <div id="corner-container">
        <div className="corner-top-row" id="corner-top-row">
          <div id="menu-item-logo">
            {/* <Image src={src1} avatar size="mini" /> */}
            <a id="sys-name" href="/searchCase">
              肺结节CT影像辅助检测软件
            </a>
          </div>
          <div id="menu-item-buttons">
            <div onClick={this.onSetStudyList.bind(this, !studyListShowed)} className={'func-btn' + (studyListShowed ? ' func-btn-active' : '')}>
              <Icon className="func-btn-icon" name="list" size="large"></Icon>
              <div className="func-btn-desc"> 序列</div>
            </div>
            <span className="menu-line"></span>
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
          </div>
        </div>
        <div className="corner-bottom-row" id="corner-bottom-row" style={{ height: bottomRowHeight }}>
          <Sidebar.Pushable style={{ overflow: 'hidden', width: '100%' }}>
            <Sidebar visible={studyListShowed} animation={'overlay'} width="thin">
              <div className="preview">{previewContent}</div>
            </Sidebar>
            <Sidebar.Pusher style={{ height: '100%' }}></Sidebar.Pusher>
          </Sidebar.Pushable>
        </div>
      </div>
    )
  }
}

export default connect(
  (state) => ({}),
  (dispatch) => ({
    getImageIdsByCaseId: (url, caseId) => dispatch(getImageIdsByCaseId(url, caseId)),
    getNodulesByCaseId: (url, caseId, username) => dispatch(getNodulesByCaseId(url, caseId, username)),
    dispatch,
  })
)(CTpanel)
