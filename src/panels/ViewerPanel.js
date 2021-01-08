import React, { Component, useCallback } from "react";
import { vec3 , mat4} from 'gl-matrix';
import { useRef, createRef } from "react";
import * as cornerstone from "cornerstone-core";
import axios from "axios";
import qs from "qs";
import classnames from "classnames";
import SegView3D from "../components/SegView3D";
import vtkActor from "vtk.js/Sources/Rendering/Core/Actor";
import vtkMapper from "vtk.js/Sources/Rendering/Core/Mapper";
import vtkColorMaps from "vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps";
import vtkColorTransferFunction from "vtk.js/Sources/Rendering/Core/ColorTransferFunction";
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
import vtkSphereMapper from 'vtk.js/Sources/Rendering/Core/SphereMapper';
import vtkImageReslice from 'vtk.js/Sources/Imaging/Core/ImageReslice';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';
import vtkXMLPolyDataReader from "vtk.js/Sources/IO/XML/XMLPolyDataReader";
import HttpDataAccessHelper from "vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper";

import {
  List, Grid, Checkbox, Progress, Button, Icon, Menu, Image, Dropdown, Loader
} from "semantic-ui-react";


import PropTypes from "prop-types";
import "../css/cornerstone.css";
import "../css/segview.css";
import StudyBrowserList from "../components/StudyBrowserList";
import src1 from "../images/scu-logo.jpg";
import VTKViewer from "../components/VTKViewer";
// import SegView3D from '../vtk-viewport/VTKViewport/View3D'
// import View3D from '../vtk-viewport/index'
// import createLabelPipeline from '../vtk-viewport/VTKViewport/createLabelPipeline'

const config = require("../config.json");
const dataConfig = config.data;
const draftConfig = config.draft;
const userConfig = config.user

const imageData = vtkImageData.newInstance();
const sphereSource = vtkSphereSource.newInstance();
const cImageReslice = vtkImageReslice.newInstance();
const aImageReslice = vtkImageReslice.newInstance();
const sImageReslice = vtkImageReslice.newInstance();

const dictList = {
  0:{class:0, label:"lung",  name:"肺",color:{c1:197, c2:165, c3:145}},
  1:{class:2, label:"airway",name:"支气管",color:{c1:182, c2:228, c3:255}},
  // 1: { class: 2, label: "airway", name: "支气管", color: { c1: 0, c2: 0, c3: 255 } },
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
      viewerWidth: 0,
      viewerHeight: 0,
      caseId: window.location.pathname.split("/segView/")[1].split("/")[0],
      username: window.location.pathname.split("/")[3],
      imageIds: [],
      urls: [],
      show: false,
      segments: [],
      segRange: {
        xMax:-Infinity,
        yMax:-Infinity,
        zMax:-Infinity,
        xMin:Infinity,
        yMin:Infinity,
        zMin:Infinity
      },
      segVisible: [],
      opacity: [],
      listsActive: [],
      listsOpacityChangeable: [],
      optVisible:false,
      optSelected:[1,1,1,1],
      percent: [],
      volumes: [],
      origin: [140,240,0],
      position:[],
      axialActorVolumes: [],
      coronalActorVolumes: [],
      sagittalActorVolumes: [],
      pointActors: [],
      editing: false,
      painting: false,
      selected: false,
      selectedNum: 0,
      selectionStyles:[],
      axialRowStyle: {},
      axialColumnStyle: {},
      coronalRowStyle: {},
      coronalColumnStyle: {},
      sagittalRowStyle: {},
      sagittalColumnStyle: {},
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

    let xMax = -Infinity
    let yMax = -Infinity
    let zMax = -Infinity
    let xMin = Infinity
    let yMin = Infinity
    let zMin = Infinity
    const points = source.getPoints()
    for(let i = 0; i < points.getNumberOfPoints(); i++){
      let point = points.getPoint(i)
      let x = point[0]
      let y = point[1]
      let z = point[2]
      xMin = Math.min(x, xMin)
      yMin = Math.min(y, yMin)
      zMin = Math.min(z, zMin)
      xMax = Math.max(x, xMax)
      yMax = Math.max(y, yMax)
      zMax = Math.max(z, zMax)
    }
    let range = {
      xMax:xMax,
      yMax:yMax,
      zMax:zMax,
      xMin:xMin,
      yMin:yMin,
      zMin:zMin
    }
    console.log("segRange:", range)
    this.setState({
      segRange: range
    })
    // const lookupTable = vtkColorTransferFunction.newInstance()
    // const lookback=vtkPiecewiseFunction.newInstance()
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
      scalarVisibility: false
    })

    const actor = vtkActor.newInstance();
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
    actor.getProperty().setDiffuse(0.25)
    actor.getProperty().setAmbient(0.5)
    actor.getProperty().setSpecular(0.125)
  
    mapper.setInputData(source);

    // const rgbTransferFunction = actor.getProperty().getRGBTransferFunction(0);
    // const range = rgbTransferFunction.getMappingRange();
    //  const light2 = gc.registerResource(vtkLight.newInstance());
    //  light2.setColor(1, 1, 0);
    //  light2.setPosition(0, 1, 0);
    //  renderer.addLight(light2);
    // console.log('light is done!')
    // const windowWidth = range[0] + range[1];
    // const windowCenter = range[0] + windowWidth / 2;

    return actor;
  }

  createSlicePipeline(imageReslice, cols, rows) {
    // imageReslice.setScalarScale(65535 / 255);
    console.log("axes", imageReslice.getResliceAxes())
    const obliqueSlice = imageReslice.getOutputData();
    obliqueSlice.setDimensions(cols,rows,20)

    const mapper = vtkVolumeMapper.newInstance();
    mapper.setInputData(obliqueSlice)
    const actor = vtkVolume.newInstance();
    actor.setMapper(mapper);

    const range = imageData
        .getPointData()
        .getScalars()
        .getRange();
    actor
        .getProperty()
        .getRGBTransferFunction(0)
        .setRange(range[0], range[1]);
    actor.getProperty().setDiffuse(0.5)
    actor.getProperty().setSpecular(0.5)
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
    const origin = this.state.origin
    const axialAxes = mat4.create()
    axialAxes[14] = origin[2]
    // rotateX -PI/2
    const coronalAxes = mat4.fromValues(
        1, 0, 0, 0,
        0, 0, 1, 0,
        0, -1, 0, 0,
        0, 0, 0, 1
    )
    coronalAxes[13] = origin[1]
    // rotateY -PI/2
    const sagittalAxes = mat4.fromValues(
        0, 0, -1, 0,
        0, 1, 0, 0,
        1, 0, 0, 0,
        0, 0, 0, 1)
    sagittalAxes[12] = origin[0]

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

  updateVolumeActor(origin){
    if(!origin){
      origin = this.state.origin
    }
    const axialAxes = aImageReslice.getResliceAxes()
    axialAxes[14] = origin[2]
    const coronalAxes = cImageReslice.getResliceAxes()
    coronalAxes[13] = origin[1]
    const sagittalAxes = sImageReslice.getResliceAxes()
    sagittalAxes[12] = origin[0]

    aImageReslice.setResliceAxes(axialAxes)
    cImageReslice.setResliceAxes(coronalAxes)
    sImageReslice.setResliceAxes(sagittalAxes)

    const axialActor = this.createSlicePipeline(aImageReslice, 512, 512 )
    const coronalActor = this.createSlicePipeline(cImageReslice, 512, 512 )
    coronalActor.rotateZ(-180)
    const sagittalActor = this.createSlicePipeline(sImageReslice, 512, 512)

    this.setState({
      axialActorVolumes: [axialActor],
      coronalActorVolumes: [coronalActor],
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
        });

        tmp_urls.forEach((inside, idx) =>{
          // if(inside[0] == 1){
            this.DownloadSegment(idx)
          // }
        })

      })
      .catch((error) => {
        console.log(error);
      });

    // const dom = ReactDOM.findDOMNode(this.gridRef);
    document.getElementById('header').style.display = 'none'

    this.resize3DView()

    window.addEventListener('resize', this.resize3DView.bind(this))
    window.addEventListener('dblclick' , this.dblclick.bind(this))
    window.addEventListener('click', this.click.bind(this))
    window.addEventListener('mousedown', this.mousedown.bind(this))
    window.addEventListener('mousewheel', this.mousewheel.bind(this))

    // window.addEventListener('mouseup', this.mouseUp.bind(this))
    // window.addEventListener('mousemove', this.mouseMove.bind(this))
    // window.addEventListener('mousewheel', this.mouseWheel.bind(this))

    const position = []
    for(let i = 0;i<512;i++){
      position[i] = []
      for(let j = 0;j<512;j++){
        position[i][j] = []
        for(let k = 0;k<512;k++){
          position[i][j][k] = 0
        }
      }
    }
    this.setState({
      position: position
    })

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
        // const xSpacing = img.columnPixelSpacing;
        // const ySpacing = img.rowPixelSpacing;
        // const zSpacing = 0;
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
    imageIds.splice(50,imageIds.length - 1)
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

  }
  componentWillMount() {
    window.removeEventListener('resize', this.resize3DView.bind(this))
    window.removeEventListener('dblclick', this.dblclick.bind(this))
    window.removeEventListener('click', this.click.bind(this))
    window.removeEventListener('mousewheel', this.mousewheel.bind(this))
  }
  componentDidUpdate(prevProps, prevState, snapshot) {

  }
  mousewheel(e){
    //- represents magnify, + represents reduct
    const wheelValue = (e.wheelDelta / 120 ) * 5
    const origin = this.state.origin
    if(e.path[0].className === "segment-content-block segment-content-axial"){
      origin[2] = origin[2] + wheelValue
      imageData.modified()
      this.updateVolumeActor(origin)
    }
    if(e.path[0].className === "segment-content-block segment-content-coronal"){
      origin[1] = origin[1] + wheelValue
      imageData.modified()
      this.updateVolumeActor(origin)
    }
    if(e.path[0].className === "segment-content-block segment-content-sagittal"){
      origin[0] = origin[0] + wheelValue
      imageData.modified()
      this.updateVolumeActor(origin)
    }
  }
  mousedown(e){
    if(e.path[0].className === "segment-content-row segment-content-row-axial"){
      console.log("mouse down", e)
      const y = e.clientY
      const origin = this.state.origin
      const finalOrigin = []
      origin.forEach((item, idx) => {
        finalOrigin[idx] = item
      })
      const selectedNum = this.state.selectedNum
      const ratio = this.getRatio(0)
      const that = this
      window.addEventListener("mousemove", moving)
      function moving(e){
        console.log("mouse move1", origin)
        const yNow = e.clientY
        finalOrigin[1] = origin[1] + (y - yNow) * ratio
        console.log("mouse move2", finalOrigin)
        const {axialRowStyle, axialColumnStyle, coronalRowStyle, coronalColumnStyle, sagittalRowStyle, sagittalColumnStyle} = that.getRowAndColumnStyle(selectedNum, finalOrigin)
        that.setState({
          axialRowStyle: axialRowStyle,
          axialColumnStyle: axialColumnStyle,
          coronalRowStyle: coronalRowStyle,
          coronalColumnStyle: coronalColumnStyle,
          sagittalRowStyle: sagittalRowStyle,
          sagittalColumnStyle: sagittalColumnStyle
        })
      }
      window.addEventListener("mouseup", up)
      function up(e){
        imageData.modified()
        that.updateVolumeActor(finalOrigin)
        //that.updatePointActorByOrigin(finalOrigin)
        that.setState({
          origin: finalOrigin
        })
        window.removeEventListener("mousemove", moving)
        window.removeEventListener("mouseup", up)
      }
    }
    if(e.path[0].className === "segment-content-column segment-content-column-axial"){
      const x = e.clientX
      const origin = this.state.origin
      const finalOrigin = []
      origin.forEach((item, idx) => {
        finalOrigin[idx] = item
      })
      const selectedNum = this.state.selectedNum
      const ratio = this.getRatio(0)
      const that = this
      window.addEventListener("mousemove", moving)
      function moving(e){
        const xNow = e.clientX
        finalOrigin[0] = origin[0] + (x - xNow) * ratio
        const {axialRowStyle, axialColumnStyle, coronalRowStyle, coronalColumnStyle, sagittalRowStyle, sagittalColumnStyle} = that.getRowAndColumnStyle(selectedNum, finalOrigin)
        that.setState({
          axialRowStyle: axialRowStyle,
          axialColumnStyle: axialColumnStyle,
          coronalRowStyle: coronalRowStyle,
          coronalColumnStyle: coronalColumnStyle,
          sagittalRowStyle: sagittalRowStyle,
          sagittalColumnStyle: sagittalColumnStyle
        })
      }
      window.addEventListener("mouseup", up)
      function up(e){
        imageData.modified()
        that.updateVolumeActor(finalOrigin)
        //that.updatePointActorByOrigin(finalOrigin)
        that.setState({
          origin: finalOrigin
        })
        window.removeEventListener("mousemove", moving)
        window.removeEventListener("mouseup", up)
      }
    }
    if(e.path[0].className === "segment-content-row segment-content-row-coronal"){
      console.log("mouse down", e)
      const y = e.clientY
      const origin = this.state.origin
      const finalOrigin = []
      origin.forEach((item, idx) => {
        finalOrigin[idx] = item
      })
      const selectedNum = this.state.selectedNum
      const ratio = this.getRatio(1)
      const that = this
      window.addEventListener("mousemove", moving)
      function moving(e){
        const yNow = e.clientY
        finalOrigin[2] = origin[2] + (yNow - y) * ratio
        const {axialRowStyle, axialColumnStyle, coronalRowStyle, coronalColumnStyle, sagittalRowStyle, sagittalColumnStyle} = that.getRowAndColumnStyle(selectedNum, finalOrigin)
        that.setState({
          axialRowStyle: axialRowStyle,
          axialColumnStyle: axialColumnStyle,
          coronalRowStyle: coronalRowStyle,
          coronalColumnStyle: coronalColumnStyle,
          sagittalRowStyle: sagittalRowStyle,
          sagittalColumnStyle: sagittalColumnStyle
        })
      }
      window.addEventListener("mouseup", up)
      function up(e){
        imageData.modified()
        that.updateVolumeActor(finalOrigin)
        //that.updatePointActorByOrigin(finalOrigin)
        that.setState({
          origin: finalOrigin
        })
        window.removeEventListener("mousemove", moving)
        window.removeEventListener("mouseup", up)
      }
    }
    if(e.path[0].className === "segment-content-column segment-content-column-coronal"){
      const x = e.clientX
      const origin = this.state.origin
      const finalOrigin = []
      origin.forEach((item, idx) => {
        finalOrigin[idx] = item
      })
      const selectedNum = this.state.selectedNum
      const ratio = this.getRatio(1)
      const that = this
      window.addEventListener("mousemove", moving)
      function moving(e){
        const xNow = e.clientX
        finalOrigin[0] = origin[0] + (x - xNow) * ratio
        const {axialRowStyle, axialColumnStyle, coronalRowStyle, coronalColumnStyle, sagittalRowStyle, sagittalColumnStyle} = that.getRowAndColumnStyle(selectedNum, finalOrigin)
        that.setState({
          axialRowStyle: axialRowStyle,
          axialColumnStyle: axialColumnStyle,
          coronalRowStyle: coronalRowStyle,
          coronalColumnStyle: coronalColumnStyle,
          sagittalRowStyle: sagittalRowStyle,
          sagittalColumnStyle: sagittalColumnStyle
        })
      }
      window.addEventListener("mouseup", up)
      function up(e){
        imageData.modified()
        that.updateVolumeActor(finalOrigin)
        //that.updatePointActorByOrigin(finalOrigin)
        that.setState({
          origin: finalOrigin
        })
        window.removeEventListener("mousemove", moving)
        window.removeEventListener("mouseup", up)
      }
    }
    if(e.path[0].className === "segment-content-row segment-content-row-sagittal"){
      console.log("mouse down", e)
      const y = e.clientY
      const origin = this.state.origin
      const finalOrigin = []
      origin.forEach((item, idx) => {
        finalOrigin[idx] = item
      })
      const selectedNum = this.state.selectedNum
      const ratio = this.getRatio(2)
      const that = this
      window.addEventListener("mousemove", moving)
      function moving(e){
        const yNow = e.clientY
        finalOrigin[2] = origin[2] + (yNow - y) * ratio
        const {axialRowStyle, axialColumnStyle, coronalRowStyle, coronalColumnStyle, sagittalRowStyle, sagittalColumnStyle} = that.getRowAndColumnStyle(selectedNum, finalOrigin)
        that.setState({
          axialRowStyle: axialRowStyle,
          axialColumnStyle: axialColumnStyle,
          coronalRowStyle: coronalRowStyle,
          coronalColumnStyle: coronalColumnStyle,
          sagittalRowStyle: sagittalRowStyle,
          sagittalColumnStyle: sagittalColumnStyle
        })

      }
      window.addEventListener("mouseup", up)
      function up(e){
        imageData.modified()
        that.updateVolumeActor(finalOrigin)
        //that.updatePointActorByOrigin(finalOrigin)
        that.setState({
          origin: finalOrigin
        })
        window.removeEventListener("mousemove", moving)
        window.removeEventListener("mouseup", up)
      }
    }
    if(e.path[0].className === "segment-content-column segment-content-column-sagittal"){
      const x = e.clientX
      const origin = this.state.origin
      const finalOrigin = []
      origin.forEach((item, idx) => {
        finalOrigin[idx] = item
      })
      const selectedNum = this.state.selectedNum
      const ratio = this.getRatio(2)
      const that = this
      window.addEventListener("mousemove", moving)
      function moving(e){
        const xNow = e.clientX
        finalOrigin[1] = origin[1] + (xNow - x) * ratio
        const {axialRowStyle, axialColumnStyle, coronalRowStyle, coronalColumnStyle, sagittalRowStyle, sagittalColumnStyle} = that.getRowAndColumnStyle(selectedNum, finalOrigin)
        that.setState({
          axialRowStyle: axialRowStyle,
          axialColumnStyle: axialColumnStyle,
          coronalRowStyle: coronalRowStyle,
          coronalColumnStyle: coronalColumnStyle,
          sagittalRowStyle: sagittalRowStyle,
          sagittalColumnStyle: sagittalColumnStyle
        })
      }
      window.addEventListener("mouseup", up)
      function up(e){
        imageData.modified()
        that.updateVolumeActor(finalOrigin)
        //that.updatePointActorByOrigin(finalOrigin)
        that.setState({
          origin: finalOrigin
        })
        window.removeEventListener("mousemove", moving)
        window.removeEventListener("mouseup", up)
      }
    }
  }
  click(e){
    console.log("click", e)
    if(this.state.editing){
      if(e.path[0].className === "segment-content-block segment-content-3d"){
        //not used
        console.log("e.offsetX", e.offsetX)
        console.log("e.offsetY", e.offsetY)
        const picked = this.viewer.click3DViewer(e.offsetX, e.offsetY)
        console.log("picked ", picked)
        if(picked){
          sphereSource.setRadius(5)
          sphereSource.setCenter(picked)
          const mapper = vtkMapper.newInstance({
            scalarVisibility: false
          })
          mapper.setInputData(sphereSource.getOutputData());
          const actor = vtkActor.newInstance();
          actor.setMapper(mapper);

          const selectedNum = this.state.selectedNum
          const origin = this.state.origin
          const {xMax, yMax, zMax, xMin, yMin, zMin} = this.state.segRange
          const x = picked[0]
          const y = picked[1]
          const z = picked[2]
          origin[0] = 512 * (xMax - x) / (xMax - xMin)
          origin[1] = 512 * (y - yMin) / (yMax - yMin)
          origin[2] = this.state.imageIds.length * (zMax - z) / (zMax - zMin)
          this.selectByNum(selectedNum)
          imageData.modified()
          this.updateVolumeActor()

          this.setState({
            pointActors: [actor]
          })
        }
      }
      if(e.path[1].className === "segment-content-block segment-content-axial" && e.path[0].id === "canvas-axial"){
        const origin = this.state.origin
        const ratio = this.getRatio(0)
        const {x, y} = this.getTopLeftOffset(0)
        const xNow = e.offsetX
        const yNow = e.offsetY
        origin[1] = 512 - (yNow - y) * ratio
        origin[0] = 512 - (xNow - x) * ratio
        const {axialRowStyle, axialColumnStyle, coronalRowStyle, coronalColumnStyle, sagittalRowStyle, sagittalColumnStyle} = this.getRowAndColumnStyle()
        this.setState({
          axialRowStyle: axialRowStyle,
          axialColumnStyle: axialColumnStyle,
          coronalRowStyle: coronalRowStyle,
          coronalColumnStyle: coronalColumnStyle,
          sagittalRowStyle: sagittalRowStyle,
          sagittalColumnStyle: sagittalColumnStyle
        })
        imageData.modified()
        this.updateVolumeActor()
      }
      if(e.path[1].className === "segment-content-block segment-content-coronal" && e.path[0].id === "canvas-coronal"){
        const origin = this.state.origin
        const ratio = this.getRatio(1)
        const {x, y} = this.getTopLeftOffset(1)
        const xNow = e.offsetX
        const yNow = e.offsetY
        origin[2] = (yNow - y) * ratio
        origin[0] = 512 - (xNow - x) * ratio
        const {axialRowStyle, axialColumnStyle, coronalRowStyle, coronalColumnStyle, sagittalRowStyle, sagittalColumnStyle} = this.getRowAndColumnStyle()
        this.setState({
          axialRowStyle: axialRowStyle,
          axialColumnStyle: axialColumnStyle,
          coronalRowStyle: coronalRowStyle,
          coronalColumnStyle: coronalColumnStyle,
          sagittalRowStyle: sagittalRowStyle,
          sagittalColumnStyle: sagittalColumnStyle
        })
        imageData.modified()
        this.updateVolumeActor()
      }
      if(e.path[1].className === "segment-content-block segment-content-sagittal" && e.path[0].id === "canvas-sagittal"){
        const origin = this.state.origin
        const ratio = this.getRatio(2)
        const {x, y} = this.getTopLeftOffset(2)
        const xNow = e.offsetX
        const yNow = e.offsetY
        origin[2] = (yNow - y) * ratio
        origin[1] = (xNow - x) * ratio
        const {axialRowStyle, axialColumnStyle, coronalRowStyle, coronalColumnStyle, sagittalRowStyle, sagittalColumnStyle} = this.getRowAndColumnStyle()
        this.setState({
          axialRowStyle: axialRowStyle,
          axialColumnStyle: axialColumnStyle,
          coronalRowStyle: coronalRowStyle,
          coronalColumnStyle: coronalColumnStyle,
          sagittalRowStyle: sagittalRowStyle,
          sagittalColumnStyle: sagittalColumnStyle
        })
        imageData.modified()
        this.updateVolumeActor()
      }
    }
    if(this.state.painting){
      if(e.path[1].className === "segment-content-block segment-content-axial" && e.path[0].id === "canvas-axial"){
        const origin = this.state.origin
        const ratio = this.getRatio(0)
        const {x, y} = this.getTopLeftOffset(0)
        const xNow = e.offsetX
        const yNow = e.offsetY
        const pNow = []
        pNow[2] = origin[2]
        pNow[1] = 512 - (yNow - y) * ratio
        pNow[0] = 512 - (xNow - x) * ratio
        this.pickUp(pNow[0], pNow[1], pNow[2], 0, 20)
        this.updateCanvas()
      }
      if(e.path[1].className === "segment-content-block segment-content-coronal" && e.path[0].id === "canvas-coronal"){
        const origin = this.state.origin
        const ratio = this.getRatio(1)
        const {x, y} = this.getTopLeftOffset(1)
        const xNow = e.offsetX
        const yNow = e.offsetY
        const pNow = []
        pNow[2] = (yNow - y) * ratio
        pNow[1] = origin[1]
        pNow[0] = 512 - (xNow - x) * ratio
        this.pickUp(pNow[0], pNow[1], pNow[2], 1, 20)
        this.updateCanvas()
      }
      if(e.path[1].className === "segment-content-block segment-content-sagittal" && e.path[0].id === "canvas-sagittal"){
        const origin = this.state.origin
        const ratio = this.getRatio(2)
        const {x, y} = this.getTopLeftOffset(2)
        const xNow = e.offsetX
        const yNow = e.offsetY
        const pNow = []
        pNow[2] = (yNow - y) * ratio
        pNow[1] = (xNow - x) * ratio
        pNow[0] = origin[0]
        this.pickUp(pNow[0], pNow[1], pNow[2], 2, 20)
        this.updateCanvas()
      }
    }
  }
  pickUp(x, y, z, model, radius){
    //model 0 represents axial, model 1 represents coronal, model 2 represents sagittal
    const position = this.state.position
    if(model === 0){
      for(let i = 0; i < radius; i++){
        for(let j = 0; j < radius; j++){
          const xNow = Math.round(x - radius/2 + j)
          const yNow = Math.round(y - radius/2 + i)
          if(xNow >= 0 && xNow < 512 && yNow >= 0 && xNow < 512){
            position[z][yNow][xNow] = 1
          }
        }
      }
    }else if(model === 1){
      for(let i = 0; i < radius; i++){
        for(let j = 0; j < radius; j++){
          const xNow = Math.round(x - radius/2 + j)
          const zNow = Math.round(z - radius/2 + i)
          if(xNow >= 0 && xNow < 512 && zNow >= 0 && zNow < 512){
            position[zNow][y][xNow] = 1
          }
        }
      }
    }else if(model === 2){
      for(let i = 0; i < radius; i++){
        for(let j = 0; j < radius; j++){
          const yNow = Math.round(y - radius/2 + j)
          const zNow = Math.round(z - radius/2 + i)
          if(yNow >= 0 && yNow < 512 && zNow >= 0 && zNow < 512){
            position[zNow][yNow][x] = 1
          }
        }
      }
    }
  }
  erase(x, y, z, model, radius){

  }
  updateCanvas(position){
    if(!position){
      position = this.state.position
    }
    const ctxAxial=document.getElementById('canvas-axial').getContext('2d')
    // const widthAxial = document.getElementById('canvas-axial').width
    // const heightAxial = document.getElementById('canvas-axial').height
    // const imageDataAxial = ctxAxial.getImageData(0,0,widthAxial,heightAxial)
    const ctxCoronal=document.getElementById('canvas-coronal').getContext('2d')
    const ctxSagittal=document.getElementById('canvas-sagittal').getContext('2d')

    const origin = this.state.origin
    const oS = origin[0]
    const oC = origin[1]
    const oA = origin[2]
    const x0 = this.getTopLeftOffset(0)
    const x1 = this.getTopLeftOffset(1)
    const x2 = this.getTopLeftOffset(2)
    const xA = x0.x
    const yA = x0.y
    const xC = x1.x
    const yC = x1.y
    const xS = x2.x
    const yS = x2.y
    const rA = this.getRatio(0)
    const rC = this.getRatio(1)
    const rS = this.getRatio(2)

    ctxSagittal.beginPath();
    ctxSagittal.strokeStyle='yellow';        //颜色
    ctxSagittal.lineWidth=5;               //线宽
    ctxSagittal.lineCap='square';           //端点
    ctxSagittal.lineJoin='round';
    let firstSagittal = true
    for(let i = 0; i < 512; i++){
      for(let j = 0; j < 512; j++){
        const pNow = position[i][j][oS]
        if(pNow === 1){
          const xOffset = Math.round(j/rS + xS)
          const yOffset = Math.round(i/rS + yS)
          if(firstSagittal){
            firstSagittal = false
            ctxSagittal.moveTo(xOffset,yOffset)
          }else{
            ctxSagittal.lineTo(xOffset,yOffset)
          }
        }
      }
    }
    ctxSagittal.closePath();
    ctxSagittal.stroke();

    ctxCoronal.beginPath();
    ctxCoronal.strokeStyle='green';        //颜色
    ctxCoronal.lineWidth=5;               //线宽
    ctxCoronal.lineCap='square';           //端点
    ctxCoronal.lineJoin='round';
    let firstCoronal = true
    for(let i = 0; i < 512; i++){
      for(let j = 0; j < 512; j++){
        const pNow = position[i][oC][j]
        if(pNow === 1){
          const xOffset =  Math.round((512-j)/rC + xC)
          const yOffset =  Math.round(i/rC + yC)
          if(firstCoronal){
            firstCoronal = false
            ctxCoronal.moveTo(xOffset,yOffset)
          }else{
            ctxCoronal.lineTo(xOffset,yOffset)
          }
        }
      }
    }
    ctxCoronal.closePath();
    ctxCoronal.stroke();

    ctxAxial.beginPath();
    ctxAxial.strokeStyle='red';        //颜色
    ctxAxial.lineWidth=5;               //线宽
    ctxAxial.lineCap='square';           //端点
    ctxAxial.lineJoin='round';           //拐点
    let firstAxial = true
    for(let i = 0; i < 512; i++){
      for(let j = 0; j < 512; j++){
        const pNow = position[oA][i][j]
        if(pNow === 1){
          const xOffset = Math.round((512-j)/rA + xA)
          const yOffset = Math.round((512-i)/rA + yA)
          if(firstAxial){
            firstAxial = false
            ctxAxial.moveTo(xOffset,yOffset)
          }else{
            ctxAxial.lineTo(xOffset,yOffset)
          }
          // imageDataAxial[xOffset * 4 + yOffset * widthAxial * 4] = 120
          // imageDataAxial[xOffset * 4 + yOffset * widthAxial * 4 + 1] = 120
          // imageDataAxial[xOffset * 4 + yOffset * widthAxial * 4 + 2] = 120
          // imageDataAxial[xOffset * 4 + yOffset * widthAxial * 4 + 3] = 255
        }
      }
    }
    ctxAxial.closePath();
    ctxAxial.stroke();

    // ctxAxial.putImageData(imageDataAxial, 0, 0)
    // console.log("imageData", imageDataAxial)
  }
  getRatio(model){
    //switch pixel to origin
    //for model parameter, 0 represents axial, 1 represents coronal, 2 represents sagittal
    const selectedNum = this.state.selectedNum
    const volLength = 600
    const length = 512
    let ratio
    if(selectedNum === 0){
      ratio = length / (volLength / 2)
    }else if(selectedNum === 1){
      ratio = length / (volLength / 3)
    }else if(selectedNum === 2){
      if(model === 0){
        ratio = length / volLength
      }else{
        ratio = length / (volLength / 3)
      }
    }else if(selectedNum === 3){
      if(model === 1){
        ratio = length / volLength
      }else{
        ratio = length / (volLength / 3)
      }
    }else if(selectedNum === 4){
      if(model === 2){
        ratio = length / volLength
      }else{
        ratio = length / (volLength / 3)
      }
    }
    return ratio
  }
  getTopLeftOffset(model){
    //volume's top left, not viewer's top left
    //for model parameter, 0 represents axial, 1 represents coronal, 2 represents sagittal
    const {selectedNum, viewerWidth, viewerHeight} = this.state
    const volLength = 600
    const length = 512
    let x
    let y
    if(selectedNum === 0){
      x = (viewerWidth/2  - volLength/2)/2
      y = (viewerHeight/2 - volLength/2)/2
    }else if(selectedNum === 1){
      if(model === 2){
        x = (0.33 * viewerWidth - volLength/3)/2
        y = (0.34 * viewerHeight - volLength/3)/2
      }else{
        x = (0.33 * viewerWidth - volLength/3)/2
        y = (0.33 * viewerHeight - volLength/3)/2
      }
    }else if(selectedNum === 2){
      if(model === 0){
        x = (0.67 * viewerWidth - volLength)/2
        y = (viewerHeight - volLength)/2
      }else if(model === 1){
        x = (0.33 * viewerWidth - volLength/3)/2
        y = (0.33 * viewerHeight - volLength/3)/2
      }else if(model === 2){
        x = (0.33 * viewerWidth - volLength/3)/2
        y = (0.34 * viewerHeight - volLength/3)/2
      }
    }else if(selectedNum === 3){
      if(model === 1){
        x = (0.67 * viewerWidth - volLength)/2
        y = (viewerHeight - volLength)/2
      }else if(model === 0){
        x = (0.33 * viewerWidth - volLength/3)/2
        y = (0.33 * viewerHeight - volLength/3)/2
      }else if(model === 2){
        x = (0.33 * viewerWidth - volLength/3)/2
        y = (0.34 * viewerHeight - volLength/3)/2
      }
    }else if(selectedNum === 4){
      if(model === 2){
        x = (0.67 * viewerWidth - volLength)/2
        y = (viewerHeight - volLength)/2
      }else if(model === 0){
        x = (0.33 * viewerWidth - volLength/3)/2
        y = (0.33 * viewerHeight - volLength/3)/2
      }else if(model === 1){
        x = (0.33 * viewerWidth - volLength/3)/2
        y = (0.34 * viewerHeight - volLength/3)/2
      }
    }
    return {x, y}
  }
  updatePointActorByOrigin(origin){
    if(!origin){
      origin = this.state.origin
    }
    const picked = []
    const {xMax, yMax, zMax, xMin, yMin, zMin} = this.state.segRange
    picked[0] = xMax - (origin[0] * (xMax - xMin ) / 512)
    picked[1] = yMin + (origin[1] * (yMax - yMin) / 512)
    picked[2] = zMax - (origin[2] * (zMax - zMin) / this.state.imageIds.length)
    sphereSource.setRadius(5)
    sphereSource.setCenter(picked)
    const mapper = vtkMapper.newInstance({
      scalarVisibility: false
    })
    mapper.setInputData(sphereSource.getOutputData());
    const actor = vtkActor.newInstance();
    actor.setMapper(mapper);

    this.setState({
      pointActors: [actor]
    })

    // (xMax - x) = origin[0] * (xMax - xMin ) / 512
    // (y - yMin) = origin[1] * (yMax - yMin) / 512
    // (zMax - z) = origin[2] * (zMax - zMin) / this.state.imageIds.length
  }
  dblclick(e){
    const paths = e.path
    if (paths[1].className === "segment-content") {
      //for selectedNum: 1 represents 3d; 2 represents axial; 3 represents coronal; 4 represents sagittal
      if (paths[0].className === "segment-content-block segment-content-axial") {
        this.selectByNum(2)
      } else if (paths[0].className === "segment-content-block segment-content-coronal") {
        this.selectByNum(3)
      } else if (paths[0].className === "segment-content-block segment-content-sagittal") {
        this.selectByNum(4)
      } else if (paths[0].className === "segment-content-block segment-content-3d") {
        this.selectByNum(1)
      }
    }
  }
  selectByNum(selectedNum){
    this.viewer.selectByNum(selectedNum)
    const selectionStyles = this.getSelectionStyles(selectedNum)
    const {axialRowStyle, axialColumnStyle, coronalRowStyle, coronalColumnStyle, sagittalRowStyle, sagittalColumnStyle} = this.getRowAndColumnStyle(selectedNum)
    this.setState({
      selectedNum: selectedNum,
      selectionStyles: selectionStyles,
      axialRowStyle: axialRowStyle,
      axialColumnStyle: axialColumnStyle,
      coronalRowStyle: coronalRowStyle,
      coronalColumnStyle: coronalColumnStyle,
      sagittalRowStyle: sagittalRowStyle,
      sagittalColumnStyle: sagittalColumnStyle
    })
  }
  getRowAndColumnStyle(selectedNum, origin){
    //num 0 represents no selection, num 1 represents selection of 3d, num 2 represents selection of axial,
    //num 3 represents selection of coronal, num 4 represents selection of sagittal
    if(!origin){
      origin = this.state.origin
    }
    if(!selectedNum){
      selectedNum = this.state.selectedNum
    }
    const {viewerWidth, viewerHeight, imageIds} = this.state
    const length = imageIds.length
    const volLength = 600
    const valueA1 = this.calTypeA(viewerHeight/2, volLength/2, origin[1], 512)
    const valueA2 = this.calTypeA(viewerHeight, volLength, origin[1], 512)
    const valueA3 = this.calTypeA(0.33 * viewerHeight, volLength/3, origin[1], 512)
    
    const valueA4 = this.calTypeA(viewerWidth/2, volLength/2, origin[0], 512)
    const valueA5 = this.calTypeA(0.67 * viewerWidth, volLength, origin[0], 512)
    const valueA6 = this.calTypeA(0.33 * viewerWidth, volLength/3, origin[0], 512)
    const valueA7 = this.calTypeA(0.33 * viewerWidth, volLength/3, origin[0], 512)
    
    const valueB1 = this.calTypeB(viewerHeight/2, volLength/2, origin[2], 512)
    const valueB2 = this.calTypeB(viewerHeight, volLength, origin[2], 512)
    const valueB3 = this.calTypeB(0.34 * viewerHeight, volLength/3, origin[2], 512)
    const valueB4 = this.calTypeB(0.33 * viewerHeight, volLength/3, origin[2], 512)
    
    const valueB5 = this.calTypeB(viewerWidth/2, volLength/2, origin[1], 512)
    const valueB6 = this.calTypeB(0.33 * viewerWidth, volLength/3, origin[1], 512)
    const valueB7 = this.calTypeB(0.67 * viewerWidth, volLength, origin[1], 512)

    const colorA = "red"
    const colorC = "green"
    const colorS = "yellow"

    let axialRowStyle = {}
    let axialColumnStyle = {}
    let coronalRowStyle = {}
    let coronalColumnStyle = {}
    let sagittalRowStyle = {}
    let sagittalColumnStyle = {}
    console.log("selectedNum:", selectedNum)
    if(selectedNum === 0){
      axialRowStyle = {top:`${valueA1}px`, left:"0", width:`${viewerWidth/2}px`, background:colorC}
      axialColumnStyle = {top:"0", left:`${valueA4}px`, height:`${viewerHeight/2}px`, background:colorS}
      coronalRowStyle = {top:`${valueB1}px`, left:"0", width:`${viewerWidth/2}px`, background:colorA}
      coronalColumnStyle = {top:"0", left:`${valueA4}px`, height:`${viewerHeight/2}px`, background:colorS}
      sagittalRowStyle = {top:`${valueB1}px`, left:"0", width:`${viewerWidth/2}px`, background:colorA}
      sagittalColumnStyle = {top:"0", left:`${valueB5}px`, height:`${viewerHeight/2}px`, background:colorC}
    }else if(selectedNum === 1){
      axialRowStyle = {top:`${valueA3}px`, left:"0", width:`${0.33 * viewerWidth}px`, background:colorC}
      axialColumnStyle = {top:"0", left:`${valueA6}px`, height:`${0.33 * viewerHeight}px`, background:colorS}
      coronalRowStyle = {top:`${valueB4}px`, left:"0", width:`${0.33 * viewerWidth}px`, background:colorA}
      coronalColumnStyle = {top:"0", left:`${valueA6}px`, height:`${0.33 * viewerHeight}px`, background:colorS}
      sagittalRowStyle = {top:`${valueB3}px`, left:"0", width:`${0.33 * viewerWidth}px`, background:colorA}
      sagittalColumnStyle = {top:"0", left:`${valueB6}px`, height:`${0.34 * viewerHeight}px`, background:colorC}
    }else if(selectedNum === 2){
      axialRowStyle = {top:`${valueA2}px`, left:"0", width:`${0.67 * viewerWidth}px`, background:colorC}
      axialColumnStyle = {top:"0", left:`${valueA5}px`, height:`${viewerHeight}px`, background:colorS}
      coronalRowStyle = {top:`${valueB4}px`, left:"0", width:`${0.33 * viewerWidth}px`, background:colorA}
      coronalColumnStyle = {top:"0", left:`${valueA6}px`, height:`${0.33 * viewerHeight}px`, background:colorS}
      sagittalRowStyle = {top:`${valueB3}px`, left:"0", width:`${0.33 * viewerWidth}px`, background:colorA}
      sagittalColumnStyle = {top:"0", left:`${valueB6}px`, height:`${0.34 * viewerHeight}px`, background:colorC}
    }else if(selectedNum === 3){
      axialRowStyle = {top:`${valueA3}px`, left:"0", width:`${0.33 * viewerWidth}px`, background:colorC}
      axialColumnStyle = {top:"0", left:`${valueA6}px`, height:`${0.33 * viewerHeight}px`, background:colorS}
      coronalRowStyle = {top:`${valueB2}px`, left:"0", width:`${0.67 * viewerWidth}px`, background:colorA}
      coronalColumnStyle = {top:"0", left:`${valueA5}px`, height:`${viewerHeight}px`, background:colorS}
      sagittalRowStyle = {top:`${valueB3}px`, left:"0", width:`${0.33 * viewerWidth}px`, background:colorA}
      sagittalColumnStyle = {top:"0", left:`${valueB6}px`, height:`${0.34 * viewerHeight}px`, background:colorC}
    }else if(selectedNum === 4){
      axialRowStyle = {top:`${valueA3}px`, left:"0", width:`${0.33 * viewerWidth}px`, background:colorC}
      axialColumnStyle = {top:"0", left:`${valueA6}px`, height:`${0.33 * viewerHeight}px`, background:colorS}
      coronalRowStyle = {top:`${valueB3}px`, left:"0", width:`${0.33 * viewerWidth}px`, background:colorA}
      coronalColumnStyle = {top:"0", left:`${valueA7}px`, height:`${0.34 * viewerHeight}px`, background:colorS}
      sagittalRowStyle = {top:`${valueB2}px`, left:"0", width:`${0.67 * viewerWidth}px`, background:colorA}
      sagittalColumnStyle = {top:"0", left:`${valueB7}px`, height:`${viewerHeight}px`, background:colorC}
    }
    return {axialRowStyle, axialColumnStyle, coronalRowStyle, coronalColumnStyle, sagittalRowStyle, sagittalColumnStyle}
  }
  calTypeA(w, x, y, z){
    return w - (w - x)/2 - x * y / z
  }
  calTypeB(w, x, y, z){
    return (w - x)/2 + x * y / z
  }
  getSelectionStyles(selectedNum, viewerWidth, viewerHeight){
    //num 0 represents no selection, num 1 represents selection of 3d, num 2 represents selection of axial,
    //num 3 represents selection of coronal, num 4 represents selection of sagittal

    //[0] represents style of 3d, [1] represents style of axial,
    //[2] represents style of coronal, [3] represents style of sagittal
    if(!viewerWidth){
      viewerWidth = this.state.viewerWidth
    }
    if(!viewerHeight){
      viewerHeight = this.state.viewerHeight
    }
    const selectionStyles = []
    if(selectedNum === 0){
      selectionStyles.push({position:"absolute", top:"0", left:`${viewerWidth/2}px`, width:`${viewerWidth/2}px`, height:`${viewerHeight/2}px`})
      selectionStyles.push({position:"absolute", top:"0", left:"0", width:`${viewerWidth/2}px`, height:`${viewerHeight/2}px`})
      selectionStyles.push({position:"absolute", top:`${viewerHeight/2}px`, left:"0", width:`${viewerWidth/2}px`, height:`${viewerHeight/2}px`})
      selectionStyles.push({position:"absolute", top:`${viewerHeight/2}px`, left:`${viewerWidth/2}px`, width:`${viewerWidth/2}px`, height:`${viewerHeight/2}px`})
    }else if(selectedNum === 1){
      selectionStyles.push({position:"absolute", top:"0", left:"0", width:`${0.67 * viewerWidth}px`, height:`${viewerHeight}px`})
      selectionStyles.push({position:"absolute", top:"0", left:`${0.67 * viewerWidth}px`, width:`${0.33 * viewerWidth}px`, height:`${0.33 * viewerHeight}px`})
      selectionStyles.push({position:"absolute", top:`${0.33 * viewerHeight}px`, left:`${0.67 * viewerWidth}px`, width:`${0.33 * viewerWidth}px`, height:`${0.33 * viewerHeight}px`})
      selectionStyles.push({position:"absolute", top:`${0.66 * viewerHeight}px`, left:`${0.67 * viewerWidth}px`, width:`${0.33 * viewerWidth}px`, height:`${0.34 * viewerHeight}px`})
    }else if(selectedNum === 2){
      selectionStyles.push({position:"absolute", top:"0", left:`${0.67 * viewerWidth}px`, width:`${0.33 * viewerWidth}px`, height:`${0.33 * viewerHeight}px`})
      selectionStyles.push({position:"absolute", top:"0", left:"0", width:`${0.67 * viewerWidth}px`, height:`${viewerHeight}px`})
      selectionStyles.push({position:"absolute", top:`${0.33 * viewerHeight}px`, left:`${0.67 * viewerWidth}px`, width:`${0.33 * viewerWidth}px`, height:`${0.33 * viewerHeight}px`})
      selectionStyles.push({position:"absolute", top:`${0.66 * viewerHeight}px`, left:`${0.67 * viewerWidth}px`, width:`${0.33 * viewerWidth}px`, height:`${0.34 * viewerHeight}px`})
    }else if(selectedNum === 3){
      selectionStyles.push({position:"absolute", top:"0", left:`${0.67 * viewerWidth}px`, width:`${0.33 * viewerWidth}px`, height:`${0.33 * viewerHeight}px`})
      selectionStyles.push({position:"absolute", top:`${0.33 * viewerHeight}px`, left:`${0.67 * viewerWidth}px`, width:`${0.33 * viewerWidth}px`, height:`${0.33 * viewerHeight}px`})
      selectionStyles.push({position:"absolute", top:"0", left:"0", width:`${0.67 * viewerWidth}px`, height:`${viewerHeight}px`})
      selectionStyles.push({position:"absolute", top:`${0.66 * viewerHeight}px`, left:`${0.67 * viewerWidth}px`, width:`${0.33 * viewerWidth}px`, height:`${0.34 * viewerHeight}px`})
    }else if(selectedNum === 4){
      selectionStyles.push({position:"absolute", top:"0", left:`${0.67 * viewerWidth}px`, width:`${0.33 * viewerWidth}px`, height:`${0.33 * viewerHeight}px`})
      selectionStyles.push({position:"absolute", top:`${0.33 * viewerHeight}px`, left:`${0.67 * viewerWidth}px`, width:`${0.33 * viewerWidth}px`, height:`${0.33 * viewerHeight}px`})
      selectionStyles.push({position:"absolute", top:`${0.66 * viewerHeight}px`, left:`${0.67 * viewerWidth}px`, width:`${0.33 * viewerWidth}px`, height:`${0.34 * viewerHeight}px`})
      selectionStyles.push({position:"absolute", top:"0", left:"0", width:`${0.67 * viewerWidth}px`, height:`${viewerHeight}px`})
    }
    return selectionStyles
  }
  resize3DView(){
    if(document.getElementById('segment-container') !== null) {
      const clientWidth = document.getElementById('segment-container').clientWidth
      const clientHeight = document.getElementById('segment-container').clientHeight
      const selectedNum = this.state.selectedNum
      const selectionStyles = this.getSelectionStyles(selectedNum, clientWidth, clientHeight)
      this.setState({
        viewerWidth: clientWidth,
        viewerHeight: clientHeight,
        selectionStyles: selectionStyles
      })
      // this.segView3D.setContainerSize(clientWidth, clientHeight)
      this.viewer.setContainerSize(clientWidth, clientHeight)
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
          let tmp_segments = []
          this.state.segments.forEach((item, idx) =>{
            tmp_segments[idx] = item
          })
          tmp_segments[idx] = actor
          let tmp_segVisible = this.state.segVisible
          tmp_segVisible[idx] = 1
          this.setState({
            segments: tmp_segments,
            segVisible:tmp_segVisible,
            // segments_list: this.state.segments_list.concat(actor),
          })
        })
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

  handleFuncButton(idx, e){
    switch (idx){
      case 0:this.viewer.magnifyView()
        break
      case 1:this.viewer.reductView()
        break
      case 2:this.viewer.turnUp()
        break
      case 3:this.viewer.turnDown()
        break
      case 4:this.viewer.turnLeft()
        break
      case 5:this.viewer.turnRight()
        break
      case 6:this.selectByNum(1)
            break
      case 7:this.selectByNum(2)
        break
      case 8:this.selectByNum(3)
        break
      case 9:this.selectByNum(4)
        break
      case 10:this.selectByNum(0)
        break
      case 11:this.startEdit()
            break
      case 12:this.endEdit()
            break
      case 13:this.startPaint()
            break
    }
  }
  startEdit(){
    const selectedNum = this.state.selectedNum
    this.selectByNum(selectedNum)
    this.setState({
      editing: true,
      painting: false,
    })
  }
  endEdit(){
    this.setState({
      editing: false
    })
  }
  startPaint(){
    this.setState({
      painting: true,
      editing: false
    })
  }
  rotateZ(){
    const center = sphereSource.getCenter()
    console.log("center:", center)
    center[1] = center[1] + 20
    sphereSource.setCenter(center)
    console.log("center:", sphereSource.getCenter())
    const mapper = vtkMapper.newInstance({
      scalarVisibility: false
    })
    mapper.setInputData(sphereSource.getOutputData());
    const actor = vtkActor.newInstance();
    actor.setMapper(mapper);
    this.setState({
      editing: true,
      pointActors: [actor]
    })
  }
  translateX(){
    const center = sphereSource.getCenter()
    console.log("center:", center)
    center[2] = center[2] + 20
    sphereSource.setCenter(center)
    console.log("center:", sphereSource.getCenter())
    const mapper = vtkMapper.newInstance({
      scalarVisibility: false
    })
    mapper.setInputData(sphereSource.getOutputData());
    const actor = vtkActor.newInstance();
    actor.setMapper(mapper);
    this.setState({
      editing: true,
      pointActors: [actor]
    })
  }
  translateY(){

  }
  translateZ(){
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

    let tmp_segments = []
    this.state.segments.forEach((item, i) =>{
      tmp_segments[i] = item
    })
    if(tmp_segVisible[idx] === 0){
      tmp_segments[idx].getProperty().setOpacity(0)
    }else{
      tmp_segments[idx].getProperty().setOpacity(this.state.opacity[idx])
    }

    this.setState({
      segVisible: tmp_segVisible,
      segments: tmp_segments
    });
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

    let tmp_segments = []
    this.state.segments.forEach((item, i) =>{
      tmp_segments[i] = item
    })
    if(this.state.segVisible[idx] === 1){
      tmp_segments[idx].getProperty().setOpacity(e.target.value)
    }

    this.setState({
      opacity: tmp_opacity,
      segments: tmp_segments
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
  getCanvasStyle(){
    const selectionStyles = this.state.selectionStyles
    const canvasAStyle = {width:0, height:0, w:0, h:0}
    const canvasCStyle = {width:0, height:0, w:0, h:0}
    const canvasSStyle = {width:0, height:0, w:0, h:0}
    if(selectionStyles[1]){
      canvasAStyle.width = selectionStyles[1].width
      canvasAStyle.height = selectionStyles[1].height
      canvasAStyle.w = selectionStyles[1].width.replace("px","")
      canvasAStyle.h = selectionStyles[1].height.replace("px","")
    }
    if(selectionStyles[2]){
      canvasCStyle.width = selectionStyles[2].width
      canvasCStyle.height = selectionStyles[2].height
      canvasCStyle.w = selectionStyles[2].width.replace("px","")
      canvasCStyle.h = selectionStyles[2].height.replace("px","")
    }
    if(selectionStyles[3]){
      canvasSStyle.width = selectionStyles[3].width
      canvasSStyle.height = selectionStyles[3].height
      canvasSStyle.w = selectionStyles[3].width.replace("px","")
      canvasSStyle.h = selectionStyles[3].height.replace("px","")
    }
    return {canvasAStyle, canvasCStyle, canvasSStyle}
  }
  render() {
    const nameList = ['肺','肺叶','支气管','结节']
    const welcome = '欢迎您，' + localStorage.realname;
    let sgList = [];
    let loadingList = [];
    let newLoadingList = [];
    let optList = [];
    const {
        segVisible,
        listsActive,
        listsOpacityChangeable,
        optVisible,
        optSelected,
        pointActors,
        percent,
        segments,
        opacity,
        viewerWidth,
        viewerHeight,
        coronalActorVolumes,
        sagittalActorVolumes,
        axialActorVolumes,
        volumes,
        editing,
        selectionStyles,
      axialRowStyle,
      axialColumnStyle,
      coronalRowStyle,
      coronalColumnStyle,
      sagittalRowStyle,
      sagittalColumnStyle
    } = this.state;
    const canvasStyle ={width:`${viewerWidth}px`, height:`${viewerHeight}px`}
    const {canvasAStyle, canvasCStyle, canvasSStyle} = this.getCanvasStyle()

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
      let loadingNum = 0;
      // loadingList = this.state.urls.map((inside, idx) => {
      //   if(loadingNum <= 4){
      //     if(inside[1].length > 0 && percent[idx] > 0 && percent[idx] < 100){
      //       loadingNum = loadingNum + 1
      //       let info = dictList[inside[0]]
      //       let segmentName = info.name
      //       return (
      //           <div key = {idx} className='loading-list-progress-container'>
      //             {segmentName}
      //             <Progress className='loading-list-progress' percent={percent[idx]} progress='percent' color='green' active/>
      //           </div>
      //       )
      //     }
      //   }
      // });
      newLoadingList = this.state.urls.map((inside, idx) => {
        let loading
        if(loadingNum <= 4){
          if(inside[1].length > 0){
            if(percent[idx] > 0 && percent[idx] < 100){
              loading = true
            }else{
              loading = false
            }
            loadingNum = loadingNum + 1
            let info = dictList[inside[0]]
            let segmentName = info.name
            return (
                <div className="loading-container">
                  <Loader active inline className="loading-loader" size="medium" style={loading?{visibility: "visible"}:{visibility: "hidden"}}/>
                  <div className="loading-ticker" hidden={loading}/>
                  <div className="loading-ticker-hidden" hidden={loading}/>
                  <div className="loading-circle" hidden={loading}/>
                  <div className="loading-circle-hidden" hidden={loading}/>
                </div>
            )
          }
        }
      })
    }
    optList = nameList.map((inside, idx) =>{
      return (
          <List.Item key = {idx}><Checkbox label={inside} checked={optSelected[idx] === 1} onChange={this.changeOptSelection.bind(this, idx)}/></List.Item>
      )
    })

    let segments_list = [];
    for (let cur_idx in segments) {
      segments_list.push(segments[cur_idx]);
    }
    console.log('render segments:', segments)
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
              {/*<Button icon className='funcBtn' onClick={this.handleFuncButton.bind(this, 2)}><Icon name='reply' size='large'/></Button>*/}
              {/*<Button icon className='funcBtn' onClick={this.handleFuncButton.bind(this, 3)}><Icon name='share' size='large'/></Button>*/}

              {/*<Button icon className='funcBtn' onClick={this.handleFuncButton.bind(this, 2)}><Icon name='arrow alternate circle up outline' size='large'/></Button>*/}
              {/*<Button icon className='funcBtn' onClick={this.handleFuncButton.bind(this, 3)}><Icon name='arrow alternate circle down outline' size='large'/></Button>*/}
              <Button icon className='funcBtn' onClick={this.handleFuncButton.bind(this, 4)}><Icon name='arrow alternate circle left outline' size='large'/></Button>
              <Button icon className='funcBtn' onClick={this.handleFuncButton.bind(this, 5)}><Icon name='arrow alternate circle right outline' size='large'/></Button>

              <Button className='funcBtn' onClick={this.handleFuncButton.bind(this, 6)}>1</Button>
              <Button className='funcBtn' onClick={this.handleFuncButton.bind(this, 7)}>2</Button>
              <Button className='funcBtn' onClick={this.handleFuncButton.bind(this, 8)}>3</Button>
              <Button className='funcBtn' onClick={this.handleFuncButton.bind(this, 9)}>4</Button>
              <Button icon className='funcBtn' onClick={this.handleFuncButton.bind(this, 10)}><Icon name='th large' size='large'/></Button>
              <Button icon className='funcBtn' hidden={editing} onClick={this.handleFuncButton.bind(this, 11)}><Icon name='hand point down outline' size='large'/></Button>
              <Button icon className='funcBtn' hidden={!editing} onClick={this.handleFuncButton.bind(this, 12)}><Icon name='window close outline' size='large'/></Button>
              <Button icon className='funcBtn' onClick={this.handleFuncButton.bind(this, 13)}><Icon name='paint brush' size='large'/></Button>

              <Button className='funcBtn' onClick={this.goBack.bind(this)}>2D</Button>

            </Button.Group>
          </Menu.Item>
          <Menu.Item position='right'>
            <div className="loading-list">

            </div>
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
              <div className="segment-container" id="segment-container">
                <VTKViewer
                    id="vtk-viewer"
                    actors={segments}
                    pointActors={pointActors}
                    axialVolumes={axialActorVolumes}
                    coronalVolumes={coronalActorVolumes}
                    sagittalVolumes={sagittalActorVolumes}
                    onRef={(ref) => {this.viewer = ref}}
                />

                {/*</div>*/}
                  <div className="segment-content-block segment-content-3d" style={selectionStyles[0]}/>
                  <div className="segment-content-block segment-content-axial" style={selectionStyles[1]}>
                    <canvas id="canvas-axial" style={canvasAStyle} width={canvasAStyle.w} height={canvasAStyle.h}/>
                    <div className="segment-content-row segment-content-row-axial" hidden={!editing} style={axialRowStyle}/>
                    <div className="segment-content-column segment-content-column-axial" hidden={!editing} style={axialColumnStyle}/>
                  </div>
                  <div className="segment-content-block segment-content-coronal" style={selectionStyles[2]}>
                    <canvas id="canvas-coronal" style={canvasCStyle} width={canvasCStyle.w} height={canvasCStyle.h}/>
                    <div className="segment-content-row segment-content-row-coronal" hidden={!editing} style={coronalRowStyle}/>
                    <div className="segment-content-column segment-content-column-coronal" hidden={!editing} style={coronalColumnStyle}/>
                  </div>
                  <div className="segment-content-block segment-content-sagittal" style={selectionStyles[3]}>
                    <canvas id="canvas-sagittal" style={canvasSStyle} width={canvasSStyle.w} height={canvasSStyle.h}/>
                    <div className="segment-content-row segment-content-row-sagittal" hidden={!editing} style={sagittalRowStyle}/>
                    <div className="segment-content-column segment-content-column-sagittal" hidden={!editing} style={sagittalColumnStyle}/>
                  </div>
                {/*<div className="segment-content" hidden={!editing} style={canvasStyle}>*/}
                {/*</div>*/}

                {/*<div className="loading-list" hidden={true} style={canvasStyle}>*/}
                {/*  {loadingList}*/}
                {/*</div>*/}
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
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </div>
    );
  }
}

export default ViewerPanel;
