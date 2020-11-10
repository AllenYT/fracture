import React, { Component, useCallback } from "react";
import { vec3 , mat4} from 'gl-matrix';
import { useRef, createRef } from "react";
import CornerstoneElement from "../components/CornerstoneElement";
import * as cornerstone from "cornerstone-core";
import axios from "axios";
import qs from "qs";
import classnames from "classnames";
import dicomParser from "dicom-parser";
import SegView3D from "../components/SegView3D";
import vtkActor from "vtk.js/Sources/Rendering/Core/Actor";
import vtkMapper from "vtk.js/Sources/Rendering/Core/Mapper";
import vtkColorMaps from "vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps";
import vtkColorTransferFunction from "vtk.js/Sources/Rendering/Core/ColorTransferFunction";
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkImageReslice from 'vtk.js/Sources/Imaging/Core/ImageReslice';
import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';
import vtkXMLPolyDataReader from "vtk.js/Sources/IO/XML/XMLPolyDataReader";
import HttpDataAccessHelper from "vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper";

import {
  List,
  Grid,
  Accordion,
  Checkbox,
  Rating,
  Progress,
  Button,
  Icon,
  Menu,
  Radio, Image, Dropdown
} from "semantic-ui-react";
import PropTypes from "prop-types";
import "../css/cornerstone.css";
import "../css/segview.css";
import vtkPiecewiseFunction from "vtk.js/Sources/Common/DataModel/PiecewiseFunction";
import StudyBrowserList from "../components/StudyBrowserList";
import src1 from "../images/scu-logo.jpg";
// import SegView3D from '../vtk-viewport/VTKViewport/View3D'
// import View3D from '../vtk-viewport/index'
// import createLabelPipeline from '../vtk-viewport/VTKViewport/createLabelPipeline'

const config = require("../config.json");
const dataConfig = config.data;
const draftConfig = config.draft;
const userConfig = config.user
const imageData = vtkImageData.newInstance();
const volumeActor = vtkVolume.newInstance();
const volumeMapper = vtkVolumeMapper.newInstance();
const cImageReslice = vtkImageReslice.newInstance();
const aImageReslice = vtkImageReslice.newInstance();
const sImageReslice = vtkImageReslice.newInstance();

const dictList = {
  0:{class:0, label:"lung",  name:"肺",color:{c1:197, c2:165, c3:145}},
  1:{class:2, label:"airway",name:"支气管",color:{c1:182, c2:228, c3:255}},
  2:{class:3, label:"nodule",name:"结节", color:{c1:178, c2:34, c3:34}},
  3:{class:1, label:"lobe_1",name:"左肺下叶",color:{c1:128, c2:174, c3:128}},
  4:{class:1, label:"lobe_2",name:"右肺中叶",color:{c1:241, c2:214, c3:145}},
  5:{class:1, label:"lobe_3",name:"右肺下叶",color:{c1:177, c2:122, c3:101}},
  6:{class:1, label:"lobe_4",name:"左肺上叶",color:{c1:111, c2:184, c3:210}},
  7:{class:1, label:"lobe_5",name:"右肺上叶",color:{c1:216, c2:101, c3:79}}
}

class ViewerPanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      windowWidth: window.screen.width,
      windowHeight: window.screen.height,
      caseId: window.location.pathname.split("/segView/")[1].split("/")[0],
      username: window.location.pathname.split("/")[3],
      imageIds: [],
      urls: [],
      actors: [],
      segments: [],
      show: false,
      segVisible: [],
      opacity: [],
      listsActive: [],
      listsOpacityChangeable: [],
      optVisible:false,
      optSelected:[1,1,1,1],
      loading: false,
      listLoading:[],
      percent: [],
      viewerWidth: 0,
      viewerHeight: 0,
      volumes: [],
      coronalVolumes: [],
      sagittalActorVolumes: [],
      axialActorVolumes: []
    };
    this.nextPath = this.nextPath.bind(this);
    this.handleLogout = this
        .handleLogout
        .bind(this);
    this.toHomepage = this.toHomepage.bind(this);
  }

  createPipeline(binary, type, opacity = 0.5) {
    // console.log("createPipeline")
    const vtpReader = vtkXMLPolyDataReader.newInstance()
    vtpReader.parseAsArrayBuffer(binary)
    const source = vtpReader.getOutputData()
    const lookupTable = vtkColorTransferFunction.newInstance()
    const lookback=vtkPiecewiseFunction.newInstance()

    // const scalars = source.getPointData().getScalars();
    // const dataRange = [].concat(scalars ? scalars.getRange() : [0, 1]);

    // lookupTable.addRGBPoint(200.0,1.0,1.0,1.0)
    lookupTable.applyColorMap(vtkColorMaps.getPresetByName('erdc_rainbow_bright'))

    // lookupTable.setMappingRange(dataRange[0], dataRange[1]);
    // lookupTable.updateRange();

    const mapper = vtkMapper.newInstance({
      interpolateScalarsBeforeMapping: false,
      useLookupTableScalarRange: true,
      lookupTable,
      scalarVisibility: false,
    })
    const actor = vtkActor.newInstance();
    actor.rotateX(-90);
    actor.getProperty().setOpacity(opacity);
    actor.setMapper(mapper);
    // let color="";
    // function Viewcolor(item){
    //      if(colorName==item.name){
    //       actor.getProperty().setColor(item.colorvalue)
    //      }
    // }
    const info = dictList[type]
    actor.getProperty().setColor(info.color.c1/255,info.color.c2/255,info.color.c3/255)
    mapper.setInputData(source);

    return actor;
  }

  createSlicePipeline(imageReslice, cols, rows) {
    // imageReslice.setScalarScale(65535 / 255);
    console.log("axes", imageReslice.getResliceAxes())
    const obliqueSlice = imageReslice.getOutputData();
    console.log("obliqueSlice", imageReslice.getOutputData().getPointData().getScalars().getData())
    obliqueSlice.setDimensions(cols,rows,10)

    const mapper = vtkVolumeMapper.newInstance();
    mapper.setInputData(obliqueSlice)
    const actor = vtkVolume.newInstance();
    actor.setMapper(mapper);

    const range = imageData
        .getPointData()
        .getScalars()
        .getRange();
    console.log("range:",range)
    actor
        .getProperty()
        .getRGBTransferFunction(0)
        .setRange(range[0], range[1]);

    return actor
    // const sampleDistance =
    //     1.2 *
    //     Math.sqrt(
    //         imageData
    //             .getSpacing()
    //             .map(v => v * v)
    //             .reduce((a, b) => a + b, 0)
    //     );
    // mapper.setSampleDistance(sampleDistance);

    // const ctfun = vtkColorTransferFunction.newInstance();
    // ctfun.addRGBPoint(200, 1, 1, 1);
    // ctfun.addRGBPoint(2000.0, 0, 0, 0);
    // ctfun.addRGBPoint(-1000, 0.3, 0.3, 1);
    // ctfun.addRGBPoint(-600, 0, 0, 1);
    // ctfun.addRGBPoint(-530, 0.134704, 0.781726, 0.0724558);
    // ctfun.addRGBPoint(-460, 0.929244, 1, 0.109473);
    // ctfun.addRGBPoint(-400, 0.888889, 0.254949, 0.0240258);
    // ctfun.addRGBPoint(2952, 1, 0.3, 0.3);

    // actor.getProperty().setRGBTransferFunction(0, ctfun);
  }

  createMPRImageReslice(){
    //sagittal 矢状面 coronal 冠状面 axial 轴状面
    const axialAxes = mat4.create()
    // axialAxes[14] = 90
    const coronalAxes = mat4.fromValues(
        1, 0, 0, 0,
        0, 0, 1, 0,
        0, -1, 0, 0,
        0, 0, 0, 1
    )
    coronalAxes[13] = 240
    const sagittalAxes = mat4.fromValues(
        0, 0, -1, 0,
        0, 1, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 1)
    sagittalAxes[12] = 130 
    // const sagittalAxes = mat4.create()
    // mat4.rotateZ(sagittalAxes, sagittalAxes, -90 * Math.PI / 180)
    // const translate = mat4.create()
    // translate[14] = -130
    // mat4.multiply(sagittalAxes, sagittalAxes, translate)
    aImageReslice.setInputData(imageData)
    aImageReslice.setOutputDimensionality(2);
    aImageReslice.setOutputScalarType('Uint16Array');
    aImageReslice.setResliceAxes(axialAxes)

    cImageReslice.setInputData(imageData)
    cImageReslice.setOutputDimensionality(2);
    cImageReslice.setOutputScalarType('Uint16Array');
    cImageReslice.setResliceAxes(coronalAxes)

    sImageReslice.setInputData(imageData)
    sImageReslice.setOutputDimensionality(2);
    sImageReslice.setOutputScalarType('Uint16Array');
    sImageReslice.setResliceAxes(sagittalAxes)
  }

  updateVolumeActor(){
    const axialActor = this.createSlicePipeline(aImageReslice, 512, 512 )
    const coronalActor = this.createSlicePipeline(cImageReslice, 512, 512 )
    const sagittalActor = this.createSlicePipeline(sImageReslice, 512, 512)
    this.setState({
      axialActorVolumes: [axialActor],
      coronalVolumes: [coronalActor],
      sagittalActorVolumes: [sagittalActor]
    })
  }

  async componentDidMount() {
    console.log("call didMount", this.state.caseId);
    const token = localStorage.getItem("token");
    const headers = {
      Authorization: "Bearer ".concat(token), //add the fun of check
    };
    const dataParams = {
      caseId: this.state.caseId,
    };
    axios
      .post(dataConfig.getMhaListForCaseId, qs.stringify(dataParams), {
        headers,
      })
      .then((res) => {
        // const urls = res.data
        // console.log(res.data)
        console.log("res_data", res.data);
        const urls = Object.keys(res.data).map((key) => [key, res.data[key]]);
        const tmp_urls = [];
        urls.forEach(item => {
          const label = item[0]
          const array = item[1]
          array.forEach((it, idx)=> {
            let type = 0;
            if(label === "lung"){
              type = 0
            }else if(label === "airway"){
              type = 1
            }else if(label === "nodule"){
              type = 2
            }else if(label === "lobe"){
              type = 3 + idx
            }
            tmp_urls.push([type, it]) //urls[0] is type, urls[1] is url
          })
        })

        const tmp_segments = Object.keys(tmp_urls).map((key) => null);
        const tmp_percent = Object.keys(tmp_urls).map((key) => 0);
        const tmp_segVisible = Object.keys(tmp_urls).map((key) => 0);
        const tmp_opacity = Object.keys(tmp_urls).map((key) => 0.5);
        const tmp_listsActive = Object.keys(tmp_urls).map((key) => 0);
        const tmp_listsOpacityChangeable = Object.keys(tmp_urls).map((key) => 0);
        const tmp_listLoading = Object.keys(tmp_urls).map((key) => false);
        console.log("urls", urls);
        console.log("tmp_urls", tmp_urls);
        this.setState({
          urls: tmp_urls,
          segments: tmp_segments,
          percent: tmp_percent,
          segVisible: tmp_segVisible,
          opacity: tmp_opacity,
          listsActive: tmp_listsActive,
          listsOpacityChangeable: tmp_listsOpacityChangeable,
          listLoading: tmp_listLoading
        });

        // tmp_urls.forEach((inside, idx) =>{
        //   this.DownloadSegment(idx)
        // })
      })
      .catch((error) => {
        console.log(error);
      });

    // const dom = ReactDOM.findDOMNode(this.gridRef);
    document.getElementById('header').style.display = 'none'

    this.resize3DView()
    window.addEventListener('resize', this.resize3DView.bind(this))

    window.addEventListener('dblclick' , this.dblclick.bind(this))
    // window.addEventListener('mousedown', this.mouseDown.bind(this))
    // window.addEventListener('mouseup', this.mouseUp.bind(this))
    // window.addEventListener('mousemove', this.mouseMove.bind(this))
    // window.addEventListener('mousewheel', this.mouseWheel.bind(this))
    const imageIdPromise = new Promise((resolve, reject) => {
      axios.post(dataConfig.getDataListForCaseId, qs.stringify(dataParams), {headers})
          .then((res) => {
            const imageIds = res.data
            resolve(imageIds)
          },reject)

    })
    const imageIds = await imageIdPromise
    this.setState({
      imageIds: imageIds
    })
    const metaDataPromise = new Promise((resolve, reject) => {
      cornerstone.loadAndCacheImage(imageIds[0]).then(img => {
        let dataSet = img.data
        let bitsAllocated = dataSet.int16('x00280100')
        let bitsStored = dataSet.int16('x00280101')
        let samplesPerPixel = dataSet.int16('x00280002')
        let highBit = dataSet.int16('x00280102')
        let photometricInterpretation = dataSet.string('x00280004')
        let pixelRepresentation = dataSet.int16('x00280103')
        let windowWidth = dataSet.string('x00281051')
        let windowCenter = dataSet.string('x00281050')
        let modality = dataSet.string('x00080060')
        const imageMetaData = {
          bitsAllocated: bitsAllocated,
          bitsStored: bitsStored,
          samplesPerPixel: samplesPerPixel,
          highBit: highBit,
          photometricInterpretation: photometricInterpretation,
          pixelRepresentation: pixelRepresentation,
          windowWidth: windowWidth,
          windowCenter: windowCenter,
        }
        let studyInstanceUid = dataSet.string('x0020000d');
        let rows = dataSet.int16('x00280010');
        let columns = dataSet.int16('x00280011');
        let imagePositionPatientString = dataSet.string('x00200032')
        let imagePositionPatient = imagePositionPatientString.split('\\')
        let imageOrientationPatientString = dataSet.string('x00200037')
        let imageOrientationPatient = imageOrientationPatientString.split('\\')
        let rowCosines = [imageOrientationPatient[0], imageOrientationPatient[1], imageOrientationPatient[2]]
        let columnCosines = [imageOrientationPatient[3], imageOrientationPatient[4], imageOrientationPatient[5]]
        let pixelSpacingString = dataSet.string('x00280030')
        let pixelSpacing = pixelSpacingString.split('\\')
        let rowPixelSpacing = pixelSpacing[0]
        let columnPixelSpacing = pixelSpacing[1]
        const metaData0 = {
          frameOfReferenceUID: studyInstanceUid,
          rows: rows,
          columns: columns,
          rowCosines: rowCosines,
          columnCosines: columnCosines,
          imagePositionPatient: imagePositionPatient,
          imageOrientationPatient: imageOrientationPatient,
          pixelSpacing: pixelSpacing,
          rowPixelSpacing: rowPixelSpacing,
          columnPixelSpacing: columnPixelSpacing
        };

        const pixeldata = img.getPixelData()
        const {intercept, slope} = img
        console.log("img",img)
        const pixelArray = new Uint16Array(512 * 512 * 512);
        const scalarArray = vtkDataArray.newInstance({
          name: 'Pixels',
          values: pixelArray
        });
        const rowCosineVec = vec3.fromValues(...rowCosines);
        const colCosineVec = vec3.fromValues(...columnCosines);
        const scanAxisNormal = vec3.cross([], rowCosineVec, colCosineVec);
        const direction = [...rowCosineVec, ...colCosineVec, ...scanAxisNormal];
        // const { spacing, origin, sortedDatasets } = sortDatasetsByImagePosition(
        //     scanAxisNormal,
        //     metaDataMap
        // );
        //
        const xSpacing = img.columnPixelSpacing;
        const ySpacing = img.rowPixelSpacing;
        const zSpacing = 0;
        imageData.setDirection(direction);
        imageData.setDimensions(512, 512, 512);
        // imageData.setSpacing(xSpacing, ySpacing, zSpacing);
        // imageData.setOrigin(...origin);
        imageData.getPointData().setScalars(scalarArray);

        const scalars = imageData.getPointData().getScalars();
        const scalarData = scalars.getData();
        const sliceLength = pixeldata.length
        const totalLength = scalarData.length
        console.log("length",{sliceLength, totalLength})
        for (let pixelIndex = 0; pixelIndex < pixeldata.length; pixelIndex++) {
          // const destIdx = totalLength - 1 - pixelIndex;
          const destIdx = pixelIndex;
          const pixel = pixeldata[pixelIndex];
          // const pixelValue = pixel * slope + intercept
          const pixelValue = pixel
          scalarData[destIdx] = pixelValue;
        }

        this.createMPRImageReslice()

        this.updateVolumeActor()
        resolve({metaData0, imageMetaData})
      },reject)
    })
    const {metaData0, imageMetaData} = await metaDataPromise
    console.log("this is ", metaData0)
    console.log("this is ", imageMetaData)
    // imageIds.splice(5)
    imageIds.splice(0,1)
    imageIds.forEach((item, idx)=>{
      cornerstone.loadAndCacheImage(item).then(img=>{
        const pixeldata = img.getPixelData()
        const {intercept, slope} = img
        const scalars = imageData.getPointData().getScalars();
        const scalarData = scalars.getData();
        const sliceLength = pixeldata.length
        const totalLength = scalarData.length
        for (let pixelIndex = 0; pixelIndex < pixeldata.length; pixelIndex++) {
          // const destIdx = totalLength - 1 - (pixelIndex + idx * sliceLength);
          const destIdx = (pixelIndex + idx * sliceLength);
          const pixel = pixeldata[pixelIndex];
          const pixelValue = pixel

          scalarData[destIdx] = pixelValue;
        }
        if(idx === imageIds.length - 1){
          imageData.modified()
          this.updateVolumeActor()
        }else{
          if(idx % 20 === 0){
            console.log("modified")
            imageData.modified()
            this.updateVolumeActor()
          }
        }
      })
    })

    // cornerstone
    //     .loadAndCacheImage(imageIds[0])
    //     .then(img => {
    //
    //       // const ctfun = vtkColorTransferFunction.newInstance();
    //       // ctfun.addRGBPoint(200, 1, 1, 1);
    //       // ctfun.addRGBPoint(2000.0, 0, 0, 0);
    //       // ctfun.addRGBPoint(-1000, 0.3, 0.3, 1);
    //       // ctfun.addRGBPoint(-600, 0, 0, 1);
    //       // ctfun.addRGBPoint(-530, 0.134704, 0.781726, 0.0724558);
    //       // ctfun.addRGBPoint(-460, 0.929244, 1, 0.109473);
    //       // ctfun.addRGBPoint(-400, 0.888889, 0.254949, 0.0240258);
    //       // ctfun.addRGBPoint(2952, 1, 0.3, 0.3);
    //       //
    //       // volumeActor.getProperty().setRGBTransferFunction(0, ctfun);
    //
    //       // const nowPixelArray = new Uint16Array(512 * 512 * 10);
    //       // const nowScalarArray = vtkDataArray.newInstance({
    //       //   name: 'Pixels',
    //       //   values: nowPixelArray
    //       // });
    //       // const nowImageData = vtkImageData.newInstance();
    //       // nowImageData.setDimensions(512, 512, 10);
    //       // nowImageData.setDirection(direction)
    //       // nowImageData.getPointData().setScalars(nowScalarArray);
    //       // const nowScalars = nowImageData.getPointData().getScalars();
    //       // const nowScalarData = nowScalars.getData();
    //       // for (let pixelIndex = 0; pixelIndex < pixeldata.length; pixelIndex++) {
    //       //   const pixelValue1 = scalarData[pixelIndex]
    //       //   nowScalarData[pixelIndex] = pixelValue1;
    //       // }
    //       // for (let pixelIndex = 0; pixelIndex < pixeldata.length; pixelIndex++) {
    //       //   const destIdx = pixelIndex + 9 * pixeldata.length;
    //       //   const pixelValue2 = scalarData[pixelIndex]
    //       //   nowScalarData[destIdx] = pixelValue2;
    //       // }
    //       // const actor = this.createCT3dPipeline(nowImageData)
    //
    //       // imageIds.splice(4)
    //     //   imageIds.splice(0,1)
    //     //   imageIds.map((item, idx)=>{
    // })
  }
  componentWillMount() {
    window.removeEventListener('resize', this.resize3DView.bind(this))
  }
  componentDidUpdate(prevProps, prevState, snapshot) {
    const listLoading = this.state.listLoading
    if(this.state.loading){
      let tmp_loading = false;
      listLoading.forEach(item => {
        if(item){
          tmp_loading = true
        }
      })
      if(!tmp_loading){
        this.setState({
            loading: tmp_loading
          }
        )
      }
    }else{
      let tmp_loading = false;
      listLoading.forEach(item => {
        if(item){
          tmp_loading = true
        }
      })
      if(tmp_loading){
        this.setState({
              loading: tmp_loading
            }
        )
      }
    }

  }

  dblclick(e){
    if(e.path[0].nodeName === 'CANVAS'){
      this.segView3D.dblclick(e.offsetX, e.offsetY)
    }
  }

  resize3DView(){
    if(document.getElementById('segment-container') !== null) {
      const clientWidth = document.getElementById('segment-container').clientWidth
      const clientHeight = document.getElementById('segment-container').clientHeight
      this.setState({
        viewerWidth : clientWidth,
        viewerHeight: clientHeight
      })
      this.segView3D.setContainerSize(clientWidth, clientHeight)
    }
  }
  DownloadSegment(idx){
    const progressCallback = (progressEvent) => {
      const percent = Math.floor((100 * progressEvent.loaded) / progressEvent.total)
      const tmp_percent = this.state.percent
      tmp_percent[idx] = percent
      this.setState({ percent: tmp_percent})
    }
    const type = this.state.urls[idx][0]
    const cur_url = this.state.urls[idx][1] + '?caseId=' + this.state.caseId
    HttpDataAccessHelper.fetchBinary(cur_url, { progressCallback,} )
        .then((binary) => {
          const actor = this.createPipeline(binary,type)
          let tmp_segments = this.state.segments
          tmp_segments[idx] = actor
          let tmp_segVisible = this.state.segVisible
          tmp_segVisible[idx] = 1
          let tmp_listLoading = this.state.listLoading
          tmp_listLoading[idx] = false
          this.setState({
            segments: tmp_segments,
            segVisible:tmp_segVisible,
            listLoading: tmp_listLoading
            // segments_list: this.state.segments_list.concat(actor),
          })
        })
    let tmp_listLoading = this.state.listLoading
    tmp_listLoading[idx] = true
    this.setState({
        listLoading: tmp_listLoading
      }
    )
  }
  nextPath(path) {
    this.props.history.push(path);
  }
  goBack(){
    window.history.back();
  }
  toHomepage(){
    window.location.href = '/homepage'
    // this.nextPath('/homepage/' + params.caseId + '/' + res.data)
  }
  handleLogout() {
    const token = localStorage.getItem('token')
    const headers = {
      'Authorization': 'Bearer '.concat(token)
    }
    axios
        .get(userConfig.signoutUser, {headers})
        .then((response) => {
          if (response.data.status === 'okay') {
            this.setState({isLoggedIn: false})
            localStorage.clear()
            sessionStorage.clear()
            window.location.href = '/'
          } else {
            alert("出现内部错误，请联系管理员！")
            window.location.href = '/'
          }
        })
        .catch((error) => {
          console.log("error")
        })
  }
  handleClickScreen(e, href) {
    console.log("card", href);
    if (
      window.location.pathname.split("/segView/")[1].split("/")[0] !==
      href.split("/case/")[1].split("/")[0]
    ) {
      this.setState({
        caseId: href.split("/case/")[1].split("/")[0],
        username: href.split("/")[3],
        show: false,
      });
      window.location.href =
        "/segView/" + href.split("/case/")[1].split("/")[0];
    }
    // window.location.href=href
  }
  rotateX(){

  }
  rotateY(){

  }
  rotateZ(){

  }
  translateX(){

  }
  translateY(){

  }
  translateZ(){

  }
  handleFuncButton(idx, e){
    switch (idx){
      case 0:this.segView3D.magnifyView()
        break
      case 1:this.segView3D.reductView()
        break
      case 2:this.segView3D.turnLeft()
        break
      case 3:this.segView3D.turnRight()
        break
      case 4:this.segView3D.selectOne()
            break
      case 5:this.segView3D.selectTwo()
        break
      case 6:this.segView3D.selectThree()
        break
      case 7:this.segView3D.selectFour()
        break
      case 8:this.segView3D.cancelSelection()
        break
      case 9:this.rotateX()
            break
      case 10:this.rotateY()
            break
      case 11:this.rotateZ()
            break
      case 12:this.translateX()
            break
      case 13:this.translateY()
            break
      case 14:this.translateZ()
            break
    }
  }
  handleListClick(idx, e, data) {
    console.log("handle click:", data);
    let tmp_listsActive = this.state.listsActive;
    for (let cur_idx in tmp_listsActive) {
      if (tmp_listsActive[cur_idx] === 1) {
        tmp_listsActive[cur_idx] = 0;
      }
    }
    tmp_listsActive[idx] = 1;
    this.setState({ listsActive: tmp_listsActive });
  }
  handleVisibleButton(idx, e) {
    e.stopPropagation();
    let tmp_segVisible = this.state.segVisible;
    tmp_segVisible[idx] = tmp_segVisible[idx] === 1 ? 0 : 1;
    this.setState({ segVisible: tmp_segVisible });
  }
  handleOpacityButton(idx, e) {
    e.stopPropagation();
    let tmp_listsOpacityChangeable = this.state.listsOpacityChangeable;
    tmp_listsOpacityChangeable[idx] = tmp_listsOpacityChangeable[idx] === 1 ? 0 : 1;
    this.setState({ listsOpacityChangeable: tmp_listsOpacityChangeable });
  }
  changeOpacity(idx, e) {
    e.stopPropagation();
    let tmp_opacity = this.state.opacity;
    tmp_opacity[idx] = e.target.value;
    this.setState({
      opacity: tmp_opacity,
    });
  }
  handleOptButton(e){
    e.stopPropagation();
    let tmp_optVisible = this.state.optVisible;
    tmp_optVisible = !tmp_optVisible;
    this.setState({
      optVisible: tmp_optVisible
    })
  }
  changeOptSelection(idx){
    let tmp_optSelected = this.state.optSelected;
    tmp_optSelected[idx] = tmp_optSelected[idx] === 1 ? 0 : 1;
    this.setState({
      optSelected: tmp_optSelected
    })
  }

  render() {
    const nameList = ['肺','肺叶','支气管','结节']
    const welcome = '欢迎您，' + localStorage.realname;
    let sgList = [];
    let loadingList = [];
    let optList = [];
    const {
        segVisible,
        listsActive,
        listsOpacityChangeable,
        optVisible,
        optSelected,
        loading,
        percent,
        segments,
        opacity,
        viewerWidth,
        viewerHeight,
      coronalVolumes,
      sagittalActorVolumes,
      axialActorVolumes,
      volumes,
    } = this.state;

    let canvasStyle ={width:`${viewerWidth}px`, height:`${viewerHeight}px`}
    let count = 0;
    let noduleNum = 0;
    if (this.state.urls) {
      sgList = this.state.urls.map((inside, idx) => {
        if(inside[1].length > 0){
          let info = dictList[inside[0]]
          let sgClass = info.class
          if(optSelected[sgClass] === 1){
            let sgName = info.name
            if(inside[0] === 2){
              noduleNum = noduleNum + 1
              sgName = sgName + noduleNum
            }
            let isActive = true
            let isChangeOpacity = true
            if(listsActive[idx] === 1){
              isActive = true
            }else{
              isActive = false
            }
            if(listsOpacityChangeable[idx] === 1){
              isChangeOpacity = true
            }else{
              isChangeOpacity = false
            }
            let itemClass = classnames({
              'segment-list-item': true,
              'segment-list-item-active': isActive
            })
            const inputRangeStyle={
              backgroundSize:opacity[idx] * 100 + '%'
            }
            return (
                <List.Item onClick={this.handleListClick.bind(this, idx)} key={idx}>
                  <List.Content className={itemClass}>
                    <div className='segment-list-index'>{idx}</div>
                    <div className='segment-list-content'>
                      <div className='segment-list-content-block segment-list-content-name'>
                        {sgName}
                      </div>
                      <div className='segment-list-content-block segment-list-content-info'>
                        info
                      </div>
                      <div className='segment-list-content-block segment-list-content-tool' hidden={!isActive}>
                        {/*content={segVisible[idx] === 1?'隐藏':'显示'}*/}
                        <Button inverted color='blue' className='segment-list-content-tool-block segment-list-content-tool-visible'
                                onClick={this.handleVisibleButton.bind(this, idx)} hidden={segVisible[idx] === 0}>隐藏</Button>
                        <Button inverted color='blue' className='segment-list-content-tool-block segment-list-content-tool-visible'
                                onClick={this.handleVisibleButton.bind(this, idx)} hidden={segVisible[idx] === 1}>显示</Button>
                        <Button inverted color='blue' className='segment-list-content-tool-block segment-list-content-tool-opacity'
                                onClick={this.handleOpacityButton.bind(this, idx)} hidden={isChangeOpacity}>调整透明度</Button>
                        <Button inverted color='blue' className='segment-list-content-tool-block segment-list-content-tool-opacity'
                                onClick={this.handleOpacityButton.bind(this, idx)} hidden={!isChangeOpacity}>调整完毕</Button>
                      </div>
                      <div className='segment-list-content-block' className='segment-list-content-input' hidden={!(isActive && isChangeOpacity)}>
                        {opacity[idx] * 100}%
                        <input
                            style={inputRangeStyle}
                            type='range'
                            min={0}
                            max={1}
                            step={0.1}
                            value={opacity[idx]}
                            onChange={this.changeOpacity.bind(this, idx)}
                        />
                      </div>
                    </div>
                  </List.Content>
                </List.Item>
            )
          }
        }
      });
      var loadingNum = 0;
      loadingList = this.state.urls.map((inside, idx) => {
        if(loadingNum <= 4){
          if(inside[1].length > 0 && percent[idx] > 0 && percent[idx] < 100){
            loadingNum = loadingNum + 1
            let info = dictList[inside[0]]
            let segmentName = info.name
            if(inside[0] === 2){
              segmentName = segmentName + (idx + 1)
            }
            return (
                <div key = {idx} className='loading-list-progress-container'>
                  {segmentName}
                  <Progress className='loading-list-progress' percent={percent[idx]} progress='percent' color='green' active/>
                </div>
            )
          }
        }
      });
    }
    optList = nameList.map((inside, idx) =>{
      return (
          <List.Item key = {idx}><Checkbox label={inside} checked={optSelected[idx] === 1} onChange={this.changeOptSelection.bind(this, idx)}/></List.Item>
      )
    })
    for (let cur_idx in segments) {
      if (segments[cur_idx]) {
        if (!segVisible[cur_idx]) {
          segments[cur_idx].getProperty().setOpacity(0);
        } else {
          segments[cur_idx].getProperty().setOpacity(opacity[cur_idx]);
        }
      }
    }

    // let segments_list = [];
    // for (let cur_idx in segments) {
    //   segments_list.push(segments[cur_idx]);
    // }
    // console.log('render segments:', segments)
    return (
      <div id="viewer">
        <Menu className="corner-header">
          <Menu.Item>
            <Image src={src1} avatar size='mini'/>
            <a id='sys-name' href='/searchCase'>DeepLN肺结节全周期<br/>管理数据平台</a>
          </Menu.Item>
          <Menu.Item className='funcList'>
            <Button.Group>
              <Button icon className='funcBtn' onClick={this.handleFuncButton.bind(this, 0)}><Icon name='search plus' size='large'/></Button>
              <Button icon className='funcBtn' onClick={this.handleFuncButton.bind(this, 1)}><Icon name='search minus' size='large'/></Button>
              <Button icon className='funcBtn' onClick={this.handleFuncButton.bind(this, 2)}><Icon name='reply' size='large'/></Button>
              <Button icon className='funcBtn' onClick={this.handleFuncButton.bind(this, 3)}><Icon name='share' size='large'/></Button>

              <Button className='funcBtn' onClick={this.goBack.bind(this)}>2D</Button>
              <Button className='funcBtn' onClick={this.handleFuncButton.bind(this, 4)}>1</Button>
              <Button className='funcBtn' onClick={this.handleFuncButton.bind(this, 5)}>2</Button>
              <Button className='funcBtn' onClick={this.handleFuncButton.bind(this, 6)}>3</Button>
              <Button className='funcBtn' onClick={this.handleFuncButton.bind(this, 7)}>4</Button>
              <Button icon className='funcBtn' onClick={this.handleFuncButton.bind(this, 8)}><Icon name='th large' size='large'/></Button>
              <Button className='funcBtn' onClick={this.handleFuncButton.bind(this, 9)}>rx</Button>
              <Button className='funcBtn' onClick={this.handleFuncButton.bind(this, 10)}>ry</Button>
              <Button className='funcBtn' onClick={this.handleFuncButton.bind(this, 11)}>rz</Button>
              <Button className='funcBtn' onClick={this.handleFuncButton.bind(this, 12)}>tx</Button>
              <Button className='funcBtn' onClick={this.handleFuncButton.bind(this, 13)}>ty</Button>
              <Button className='funcBtn' onClick={this.handleFuncButton.bind(this, 14)}>tz</Button>

            </Button.Group>
          </Menu.Item>
          <Menu.Item position='right'>
            <Dropdown text={welcome}>
              <Dropdown.Menu id="logout-menu">
                <Dropdown.Item icon="home" text='我的主页' onClick={this.toHomepage}/>
                <Dropdown.Item icon="write" text='留言' onClick={this.handleWriting}/>
                <Dropdown.Item icon="log out" text='注销' onClick={this.handleLogout}/>
              </Dropdown.Menu>
            </Dropdown>
          </Menu.Item>
        </Menu>
        <Grid celled className="corner-contnt">
          <Grid.Row className="corner-row" columns={3}>
            <Grid.Column width={2}>
              <StudyBrowserList
                handleClickScreen={this.handleClickScreen.bind(this)}
                caseId={this.state.caseId}
              />
            </Grid.Column>
            {/* 中间部分 */}
            <Grid.Column width={11}>
              {/* <div id="seg3d-canvas"
                ref={input => {
                  this.container.current = input
                }} style={style} /> */}
              <div className="segment-container" id="segment-container">
                <div className="segment-canvas"  style={canvasStyle}>
                  <SegView3D id="3d-viewer"
                             loading={loading}
                             actors={segments} volumes={volumes}
                             axialActorVolumes={axialActorVolumes}
                             coronalVolumes={coronalVolumes}
                             sagittalActorVolumes={sagittalActorVolumes}
                             onRef={(ref) => {this.segView3D = ref}}/>
                </div>
                <div className="loading-list" hidden={loadingNum === 0} style={canvasStyle}>
                  {loadingList}
                </div>
              </div>
            </Grid.Column>
            {/* 右边部分 */}
            <Grid.Column width={3}>
              <div className="segment-list-title-opts" hidden={!optVisible}>
                <List className="segment-list-title-opts-list">
                  {optList}
                </List>
              </div>
              <List.Item>
                <List.Content className="segment-list-title">
                  组成列表
                  <Button basic inverted className='segment-list-title-button' onClick={this.handleOptButton.bind(this)}>
                    <Icon name='content'/>筛选
                  </Button>
                </List.Content>
              </List.Item>
              <List className="segment-list" selection>
                {sgList}
              </List>
              {/*<Accordion styled id="segment-accordion" fluid>*/}
              {/*  {segmentList}*/}
              {/*</Accordion>*/}
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </div>
    );
  }
}

export default ViewerPanel;
