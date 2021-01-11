import React, { Component, useCallback } from "react";
import { vec3 , mat4} from 'gl-matrix';
import { useRef, createRef } from "react";
import * as cornerstone from "cornerstone-core";
import axios from "axios";
import qs from "qs";
import classnames from "classnames";
import vtkActor from "vtk.js/Sources/Rendering/Core/Actor";
import vtkActor2D from "vtk.js/Sources/Rendering/Core/Actor2D";
import vtkMapper from "vtk.js/Sources/Rendering/Core/Mapper";
import vtkColorMaps from "vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps";
import vtkColorTransferFunction from "vtk.js/Sources/Rendering/Core/ColorTransferFunction";
import vtkPiecewiseFunction from "vtk.js/Sources/Common/DataModel/PiecewiseFunction";
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
import vtkSphereMapper from 'vtk.js/Sources/Rendering/Core/SphereMapper';
import vtkImageReslice from 'vtk.js/Sources/Imaging/Core/ImageReslice';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';
import vtkXMLPolyDataReader from "vtk.js/Sources/IO/XML/XMLPolyDataReader";
import HttpDataAccessHelper from "vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper";
import { Slider } from "antd"
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
const cImageReslice = vtkImageReslice.newInstance();
const aImageReslice = vtkImageReslice.newInstance();
const sImageReslice = vtkImageReslice.newInstance();

const dictList = {
  0:{class:3, label:"lung",  name:"肺",color:{c1:197, c2:165, c3:145}},
  1:{class:1, label:"airway",name:"支气管",color:{c1:182, c2:228, c3:255}},
  2:{class:2, label:"nodule",name:"结节", color:{c1:178, c2:34, c3:34}},
  3:{class:0, label:"lobe_1",name:"右肺中叶",color:{c1:128, c2:174, c3:128}},
  4:{class:0, label:"lobe_2",name:"右肺上叶",color:{c1:241, c2:214, c3:145}},
  5:{class:0, label:"lobe_3",name:"右肺下叶",color:{c1:177, c2:122, c3:101}},
  6:{class:0, label:"lobe_4",name:"左肺上叶",color:{c1:111, c2:184, c3:210}},
  7:{class:0, label:"lobe_5",name:"左肺下叶",color:{c1:216, c2:101, c3:79}}
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
      voi:{windowWidth: 1600, windowCenter: -600},
      metaData0: {},
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
      optSelected:[true,true,true],
      percent: [],
      listLoading: [],
      volumes: [],
      volLength: 600,
      volXLength: 680,
      volYLength: 520,
      origin: [120,120,0],
      originXBorder: 1,
      originYBorder: 1,
      originZBorder: 1,
      position:[[[]]],
      paintImageData:[],
      axialActorVolumes: [],
      coronalActorVolumes: [],
      sagittalActorVolumes: [],
      pointActors: [],
      editing: false,
      painting: false,
      isEraser: false,
      selected: false,
      selectedNum: -1,
      selectionStyles:[],
      axialRowStyle: {},
      axialColumnStyle: {},
      coronalRowStyle: {},
      coronalColumnStyle: {},
      sagittalRowStyle: {},
      sagittalColumnStyle: {},
      isCtrl: false,
      texting: false,
    };
    this.nextPath = this.nextPath.bind(this);
    this.handleLogout = this
        .handleLogout
        .bind(this);
    this.toHomepage = this.toHomepage.bind(this);
  }

  createPipeline(binary, color, opacity) {
    // console.log("createPipeline")

    const vtpReader = vtkXMLPolyDataReader.newInstance()
    vtpReader.parseAsArrayBuffer(binary)
    const source = vtpReader.getOutputData()

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
    actor.getProperty().setColor(color.c1/255,color.c2/255,color.c3/255)
    mapper.setInputData(source);

    return actor;
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
    // rotateX PI/2
    // const coronalAxes = mat4.fromValues(
    //     1, 0, 0, 0,
    //     0, 0, -1, 0,
    //     0, 1, 0, 0,
    //     0, 0, 0, 1
    // )
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
    aImageReslice.setOutputScalarType('Uint16Array')
    aImageReslice.setResliceAxes(axialAxes)

    cImageReslice.setInputData(imageData)
    cImageReslice.setOutputDimensionality(2);
    cImageReslice.setOutputScalarType('Uint16Array')
    cImageReslice.setResliceAxes(coronalAxes)

    sImageReslice.setInputData(imageData)
    sImageReslice.setOutputDimensionality(2);
    sImageReslice.setOutputScalarType('Uint16Array')
    sImageReslice.setResliceAxes(sagittalAxes)
  }

  updateVolumeActor(origin, idx){
    if(typeof(origin) === "undefined"){
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

    if(typeof(idx) !== "undefined"){
      const paintImageData = this.state.paintImageData
      const newImageData = paintImageData[idx]
      const aNewImageReslice = vtkImageReslice.newInstance()
      const cNewImageReslice = vtkImageReslice.newInstance()
      const sNewImageReslice = vtkImageReslice.newInstance()

      aNewImageReslice.setInputData(newImageData)
      aNewImageReslice.setOutputDimensionality(2);
      aNewImageReslice.setOutputScalarType('Uint16Array')
      aNewImageReslice.setResliceAxes(axialAxes)

      cNewImageReslice.setInputData(newImageData)
      cNewImageReslice.setOutputDimensionality(2);
      cNewImageReslice.setOutputScalarType('Uint16Array')
      cNewImageReslice.setResliceAxes(coronalAxes)

      sNewImageReslice.setInputData(newImageData)
      sNewImageReslice.setOutputDimensionality(2);
      sNewImageReslice.setOutputScalarType('Uint16Array')
      sNewImageReslice.setResliceAxes(sagittalAxes)

      const axialActor = this.createSlicePipeline(aImageReslice, aNewImageReslice)
      const coronalActor = this.createSlicePipeline(cImageReslice, cNewImageReslice)
      coronalActor.rotateZ(-180)
      const sagittalActor = this.createSlicePipeline(sImageReslice, sNewImageReslice)

      this.setState({
        axialActorVolumes: [axialActor],
        coronalActorVolumes: [coronalActor],
        sagittalActorVolumes: [sagittalActor]
      })
    }else{
      const axialActor = this.createSlicePipeline(aImageReslice)
      const coronalActor = this.createSlicePipeline(cImageReslice)
      coronalActor.rotateZ(-180)
      const sagittalActor = this.createSlicePipeline(sImageReslice)

      this.setState({
        axialActorVolumes: [axialActor],
        coronalActorVolumes: [coronalActor],
        sagittalActorVolumes: [sagittalActor]
      })
    }
  }

  createSlicePipeline(imageReslice, colorReslice) {
    // imageReslice.setScalarScale(65535 / 255);
    console.log("axes", imageReslice.getResliceAxes())
    const obliqueSlice = imageReslice.getOutputData()

    const actor2D = vtkActor2D.newInstance()

    const dimensions = obliqueSlice.getDimensions()
    const spacing = obliqueSlice.getSpacing()

    const scalars = obliqueSlice.getPointData().getScalars()
    const scalarData = scalars.getData()

    const newImageData = vtkImageData.newInstance();
    const newPixelArray = new Uint16Array(dimensions[0] * dimensions[1] * 20)

    if(typeof(colorReslice) !== "undefined"){
      const colorScalarData = colorReslice.getOutputData().getPointData().getScalars().getData()
      for (let i = 0; i < scalarData.length; i++) {
        const pixel = scalarData[i]
        // const pixelValue = pixel * slope + intercept
        const pixelValue = pixel
        if(colorScalarData[i] === 1){
          newPixelArray[i] = pixelValue + 2500
        }else{
          newPixelArray[i] = pixelValue
        }
      }
    }else{
      for (let i = 0; i < scalarData.length; i++) {
        const pixel = scalarData[i]
        // const pixelValue = pixel * slope + intercept
        const pixelValue = pixel
          if(i > 85536 && i < 166608){
            newPixelArray[i] = pixelValue
          }else{
            newPixelArray[i] = pixelValue
          }
      }
    }
    // for (let i = 0; i < scalarData.length; i++) {
    //   const pixel = scalarData[i]
    //   // const pixelValue = pixel * slope + intercept
    //   const pixelValue = pixel
    //   if(i > 85536 && i < 166608){
    //     newPixelArray[i + scalarData.length] = 0
    //   }else{
    //     newPixelArray[i + scalarData.length] = pixelValue + 1
    //   }
    // }
    const newScalarArray = vtkDataArray.newInstance({
      name: 'Pixels',
      values: newPixelArray
    });
    newImageData.setSpacing(spacing)
    newImageData.setDimensions(dimensions[0], dimensions[1], 20)
    newImageData.getPointData().setScalars(newScalarArray)

    //obliqueSlice.setDimensions(cols,rows,20)

    const mapper = vtkVolumeMapper.newInstance()
    mapper.setInputData(newImageData)
    const actor = vtkVolume.newInstance()
    actor.setMapper(mapper)

    const dataRange = imageData
        .getPointData()
        .getScalars()
        .getRange()
    const sliceRange = scalars.getRange()
    console.log("dataRange", dataRange)
    console.log("sliceRange", sliceRange)

    const voi = this.state.voi
    const range0 = voi.windowCenter - voi.windowWidth / 2
    const range1 = voi.windowCenter + voi.windowWidth / 2

    const rgbTransferFunction = actor.getProperty().getRGBTransferFunction(0);
    rgbTransferFunction.setMappingRange(range0, range1)

    const ofun = vtkPiecewiseFunction.newInstance()
    // ofun.addSegment(0, 0, 1, 0)
    // ofun.addSegment(1, 1, sliceRange[1], 1)
    // ofun.addSegment(2500, 0, 2501, 0)
    // ofun.addSegment(2501, 1, sliceRange[1] + 2500, 1)
    ofun.addPoint(0.0, 0.0)
    ofun.addPoint(1000.0, 0.3)
    ofun.addPoint(6000.0, 0.9)
    actor.getProperty().setScalarOpacity(0, ofun)

    // actor.getProperty().setScalarOpacityUnitDistance(0, 4.5)
    // actor.getProperty().setInterpolationTypeToLinear()
    // actor.getProperty().setUseGradientOpacity(0, true)
    // actor.getProperty().setGradientOpacityMinimumValue(0, 15)
    // actor.getProperty().setGradientOpacityMinimumOpacity(0, 0.0)
    // actor.getProperty().setGradientOpacityMaximumValue(0, 100)
    // actor.getProperty().setGradientOpacityMaximumOpacity(0, 1.0)
    // actor.getProperty().setAmbient(0.7)
    // actor.getProperty().setDiffuse(0.7)
    // actor.getProperty().setSpecular(0.3)
    // actor.getProperty().setSpecularPower(8.0)

    const cfun = vtkColorTransferFunction.newInstance()
    // cfun.addRGBPoint(0, 0, 0, 0)
    // cfun.addRGBPoint(sliceRange[1], 1, 1, 1)
    // cfun.addRGBPoint(sliceRange[1] + 1, 0, 0, 0)
    // cfun.addRGBPoint(2500, 0, 0, 0)
    // cfun.addRGBPoint(sliceRange[1]+ 2500, 0.7, 0.7, 1)
    // cfun.addRGBPoint(sliceRange[1]+ 2501, 0, 0, 0)
    cfun.addRGBPoint(range0, 0.4, 0.2, 0.0)
    cfun.addRGBPoint(range1, 1.0, 1.0, 1.0)
    actor.getProperty().setRGBTransferFunction(0, cfun)

    return actor
  }

  async componentDidMount() {
    this.resize3DView()

    console.log("call didMount", this.state.caseId)
    const token = localStorage.getItem("token")
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
        const urls = Object.keys(res.data).map((key) => [key, res.data[key]])
        const tmp_urls = []

        urls.forEach(item => {
          const label = item[0]
          const array = item[1]
          array.forEach((it, idx)=> {
            let type = 0
            let cl = 0
            let name = ''
            let color = {}
            if(label === "lung"){
              type = 0
              cl = dictList[type].class
              name = dictList[type].name
              color = dictList[type].color
            }else if(label === "airway"){
              type = 1
              cl = dictList[type].class
              name = dictList[type].name
              color = dictList[type].color
            }else if(label === "nodule"){
              type = 2
              cl = dictList[type].class
              name = dictList[type].name + Math.round(it[it.length - 5])
              color = dictList[type].color
            }else if(label === "lobe"){
              type = 2 + Math.round(it[it.length - 5])
              cl = dictList[type].class
              name = dictList[type].name
              color = dictList[type].color
            }
            if(type !== 0){
              tmp_urls.push({
                url: it,
                class: cl,
                name: name,
                color: color
              })
            }
          })
        })

        const tmp_segments = Object.keys(tmp_urls).map((key) => null)
        const tmp_percent = Object.keys(tmp_urls).map((key) => 0)
        const tmp_opacity = Object.keys(tmp_urls).map((key) => 0.5)
        const tmp_listsActive = Object.keys(tmp_urls).map((key) => false)
        const tmp_segVisible = Object.keys(tmp_urls).map((key) => true)
        const tmp_listsOpacityChangeable = Object.keys(tmp_urls).map((key) => false)
        const tmp_listLoading = Object.keys(tmp_urls).map((key) => true)

        console.log("tmp_urls", tmp_urls)
        this.setState({
          urls: tmp_urls,
          segments: tmp_segments,
          percent: tmp_percent,
          segVisible: tmp_segVisible,
          opacity: tmp_opacity,
          listsActive: tmp_listsActive,
          listsOpacityChangeable: tmp_listsOpacityChangeable,
          listLoading: tmp_listLoading,
        });

        tmp_urls.forEach((inside, idx) =>{
          this.DownloadSegment(idx)
        })

      })
      .catch((error) => {
        console.log(error);
      });

    // const dom = ReactDOM.findDOMNode(this.gridRef);
    document.getElementById('header').style.display = 'none'

    window.addEventListener('resize', this.resize3DView.bind(this))
    window.addEventListener('dblclick' , this.dblclick.bind(this))
    window.addEventListener('click', this.click.bind(this))
    window.addEventListener('mousedown', this.mousedown.bind(this))
    window.addEventListener('mousewheel', this.mousewheel.bind(this), {passive: false})
    window.addEventListener('keydown', this.keydown.bind(this))

    const imageIdPromise = new Promise((resolve, reject) => {
      axios.post(dataConfig.getDataListForCaseId, qs.stringify(dataParams), {headers})
          .then((res) => {
            const imageIds = res.data
            resolve(imageIds)
          },reject)
    })
    const imageIds = await imageIdPromise
    console.log("imageIds", imageIds.length)
    this.setState({
      imageIds: imageIds,
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
        const pixelArray = new Uint16Array(512 * 512 * imageIds.length);
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
        console.log("xSpacing", img.columnPixelSpacing)
        console.log("ySpacing", img.rowPixelSpacing)
        const segRange = this.state.segRange
        segRange.xMin = parseFloat(imagePositionPatient[0])
        segRange.xMax = parseFloat(imagePositionPatient[0]) + 512 * parseFloat(img.columnPixelSpacing)
        segRange.yMin = parseFloat(imagePositionPatient[1])
        segRange.yMax = parseFloat(imagePositionPatient[1]) + 512 * parseFloat(img.rowPixelSpacing)
        segRange.zMax = parseFloat(imagePositionPatient[2])
        segRange.zMin = parseFloat(imagePositionPatient[2]) - imageIds.length
        const originXBorder = Math.round(512 * img.columnPixelSpacing)
        const originYBorder = Math.round(512 * img.rowPixelSpacing)
        const originZBorder = imageIds.length
        this.setState({
          originXBorder: originXBorder,
          originYBorder: originYBorder,
          originZBorder: originZBorder,
          segRange: segRange
        })
        const position = []
        for(let i = 0; i<originZBorder; i++){
          position[i] = []
          for(let j = 0; j<originYBorder; j++){
            position[i][j] = []
            for(let k = 0; k<originXBorder; k++){
              position[i][j][k] = 0
            }
          }
        }
        this.setState({
          position: position
        })

        const xSpacing = img.columnPixelSpacing;
        const ySpacing = img.rowPixelSpacing;
        const zSpacing = 1.0;
        imageData.setDirection(direction);
        imageData.setDimensions(512, 512, imageIds.length);
        imageData.setSpacing(xSpacing, ySpacing, zSpacing);
        // imageData.setOrigin(...origin);
        imageData.getPointData().setScalars(scalarArray);

        // const scalars = imageData.getPointData().getScalars();
        // const scalarData = scalars.getData();
        // const sliceLength = pixeldata.length
        // const totalLength = scalarData.length
        // console.log("length",{sliceLength, totalLength})
        // for (let pixelIndex = 0; pixelIndex < pixeldata.length; pixelIndex++) {
        //   // const destIdx = totalLength - 1 - pixelIndex;
        //   const destIdx = pixelIndex;
        //   const pixel = pixeldata[pixelIndex];
        //   // const pixelValue = pixel * slope + intercept
        //   const pixelValue = pixel
        //   scalarData[destIdx] = pixelValue;
        // }
        this.createMPRImageReslice()
        resolve({metaData0, imageMetaData})
      },reject)
    })
    const {metaData0, imageMetaData} = await metaDataPromise
    console.log("this is ", metaData0)
    console.log("this is ", imageMetaData)
    this.setState({
      metaData0: metaData0
    })
    //imageIds.splice(1,imageIds.length - 1)
    imageIds.forEach((item, idx)=>{
      cornerstone.loadAndCacheImage(item).then(img => {
        const pixeldata = img.getPixelData()
        const {intercept, slope} = img
        const scalars = imageData.getPointData().getScalars()
        const scalarData = scalars.getData()
        const sliceLength = pixeldata.length
        const totalLength = scalarData.length
        for (let pixelIndex = 0; pixelIndex < pixeldata.length; pixelIndex++) {
          // const destIdx = totalLength - 1 - (pixelIndex + idx * sliceLength);
          const destIdx = (pixelIndex + idx * sliceLength)
          const pixel = pixeldata[pixelIndex]
          const pixelValue = pixel

          scalarData[destIdx] = pixelValue
        }
        if(this.state.selectedNum !== -1){
          if (idx === imageIds.length - 1) {
            imageData.modified()
            this.updateVolumeActor()
          } else {
            if (idx % 20 === 0) {
              console.log("modified")
              imageData.modified()
              this.updateVolumeActor()
            }
          }
        }
      })
    })

  }

  componentWillMount() {
    window.removeEventListener('resize', this.resize3DView.bind(this))
    window.removeEventListener('dblclick', this.dblclick.bind(this))
    window.removeEventListener('click', this.click.bind(this))
    window.removeEventListener('mousedown', this.mousedown.bind(this))
    window.removeEventListener('mousewheel', this.mousewheel.bind(this))
    window.removeEventListener('keydown', this.keydown.bind(this))
  }

  componentDidUpdate(prevProps, prevState, snapshot) {

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
      this.viewer.setContainerSize(selectedNum, clientWidth, clientHeight)
    }
  }
  keydown(e){
    // e.which : +/187, -/189
    if(e.ctrlKey){
      console.log("ctrl")
      this.setState({
        isCtrl: true
      })
    }
    const isCtrl = this.state.isCtrl
    if(e.which === 187 && isCtrl){
    }
    if(e.which === 187 && isCtrl){
    }
    const that = this
    window.addEventListener('keyup', keyup)
    function keyup(e){
      that.setState({
        isCtrl: false
      })
      window.removeEventListener('keyup', keyup)
    }
  }
  mousewheel(e){
    //- represents magnify, + represents reduct
    const wheelValue = e.wheelDelta / 120
    const {origin, originXBorder, originYBorder, originZBorder} = this.state
    const isCtrl = this.state.isCtrl
    console.log("isCtrl", isCtrl)
    if(isCtrl){
      if(e.path[1].className === "segment-content-block segment-content-axial" && e.path[0].id === "canvas-axial"){
        let volLength = this.state.volLength
        if(wheelValue > 0){
          this.viewer.magnifyView(1, wheelValue)
          for(let i = 0; i < wheelValue; i++){
            volLength = volLength * 1.1
          }
        }else if(wheelValue < 0){
          this.viewer.reductView(1, -wheelValue)
          for(let i = 0; i < -wheelValue; i++){
            volLength = volLength * 0.9
          }
        }
        this.setState({
          volLength: volLength,
        })
      }
      if(e.path[1].className === "segment-content-block segment-content-coronal" && e.path[0].id === "canvas-coronal"){
        let volXLength = this.state.volXLength
        let volYLength = this.state.volYLength
        if(wheelValue > 0){
          this.viewer.magnifyView(2, wheelValue)
          for(let i = 0; i < wheelValue; i++){
            volXLength = volXLength * 1.1
            volYLength = volYLength * 1.1
          }
        }else if(wheelValue < 0){
          this.viewer.reductView(2, -wheelValue)
          for(let i = 0; i < -wheelValue; i++){
            volXLength = volXLength * 0.9
            volYLength = volYLength * 0.9
          }
        }
        this.setState({
          volXLength: volXLength,
          volYLength: volYLength
        })
      }
      if(e.path[1].className === "segment-content-block segment-content-sagittal" && e.path[0].id === "canvas-sagittal"){
        let volXLength = this.state.volXLength
        let volYLength = this.state.volYLength
        if(wheelValue > 0){
          this.viewer.magnifyView(3, wheelValue)
          for(let i = 0; i < wheelValue; i++){
            volXLength = volXLength * 1.1
            volYLength = volYLength * 1.1
          }
        }else if(wheelValue < 0){
          this.viewer.reductView(3, -wheelValue)
          for(let i = 0; i < -wheelValue; i++){
            volXLength = volXLength * 0.9
            volYLength = volYLength * 0.9
          }
        }
        this.setState({
          volXLength: volXLength,
          volYLength: volYLength
        })
      }
    }else{
      if(e.path[1].className === "segment-content-block segment-content-axial" && e.path[0].id === "canvas-axial"){
        origin[2] = origin[2] + wheelValue * 5
        if(origin[2] < 0){
          origin[2] = 0
        }
        if(origin[2] > originZBorder){
          origin[2] = originZBorder
        }
        imageData.modified()
        this.updateVolumeActor()
        if(this.state.editing){
          this.updateRowAndColumnStyle()
          this.updatePointActor()
        }
        if(this.state.painting){
          this.updateCanvas()
        }
        e.preventDefault()
      }
      if(e.path[1].className === "segment-content-block segment-content-coronal" && e.path[0].id === "canvas-coronal"){
        origin[1] = origin[1] + wheelValue * 5
        if(origin[1] < 0){
          origin[1] = 0
        }
        if(origin[1] > originYBorder){
          origin[1] = originYBorder
        }
        imageData.modified()
        this.updateVolumeActor()
        if(this.state.editing){
          this.updateRowAndColumnStyle()
          this.updatePointActor()
        }
        if(this.state.painting){
          this.updateCanvas()
        }
        e.preventDefault()
      }
      if(e.path[1].className === "segment-content-block segment-content-sagittal" && e.path[0].id === "canvas-sagittal"){
        origin[0] = origin[0] + wheelValue * 5
        if(origin[0] < 0){
          origin[0] = 0
        }
        if(origin[0] > originXBorder){
          origin[0] = originXBorder
        }
        imageData.modified()
        this.updateVolumeActor()
        if(this.state.editing){
          this.updateRowAndColumnStyle()
          this.updatePointActor()
        }
        if(this.state.painting){
          this.updateCanvas()
        }
        e.preventDefault()
      }
    }
  }
  mousedown(e){
    if(e.path[0].className === "segment-content-row segment-content-row-axial"){
      console.log("mouse down", e)
      const y = e.clientY
      const origin = this.state.origin
      const nowOrigin = []
      origin.forEach((item, idx) => {
        nowOrigin[idx] = item
      })
      const selectedNum = this.state.selectedNum
      const ratio = this.getRatio(0, 1)
      const that = this
      window.addEventListener("mousemove", moving)
      function moving(e){
        //console.log("mouse move1", origin)
        const yNow = e.clientY
        nowOrigin[1] = origin[1] + (yNow - y) * ratio
        //console.log("mouse move2", nowOrigin)
        that.updateRowAndColumnStyle(selectedNum, nowOrigin)
      }
      window.addEventListener("mouseup", up)
      function up(e){
        that.setState({
          origin: nowOrigin
        })
        that.updateAllByOrigin()
        window.removeEventListener("mousemove", moving)
        window.removeEventListener("mouseup", up)
      }
    }
    if(e.path[0].className === "segment-content-column segment-content-column-axial"){
      const x = e.clientX
      const origin = this.state.origin
      const nowOrigin = []
      origin.forEach((item, idx) => {
        nowOrigin[idx] = item
      })
      const selectedNum = this.state.selectedNum
      const ratio = this.getRatio(0, 0)
      const that = this
      window.addEventListener("mousemove", moving)
      function moving(e){
        const xNow = e.clientX
        nowOrigin[0] = origin[0] + (xNow - x) * ratio
        that.updateRowAndColumnStyle(selectedNum, nowOrigin)
      }
      window.addEventListener("mouseup", up)
      function up(e){
        that.setState({
          origin: nowOrigin
        })
        that.updateAllByOrigin()
        window.removeEventListener("mousemove", moving)
        window.removeEventListener("mouseup", up)
      }
    }
    if(e.path[0].className === "segment-content-row segment-content-row-coronal"){
      console.log("mouse down", e)
      const y = e.clientY
      const origin = this.state.origin
      const nowOrigin = []
      origin.forEach((item, idx) => {
        nowOrigin[idx] = item
      })
      const selectedNum = this.state.selectedNum
      const ratio = this.getRatio(1, 2)
      const that = this
      window.addEventListener("mousemove", moving)
      function moving(e){
        const yNow = e.clientY
        nowOrigin[2] = origin[2] + (yNow - y) * ratio
        that.updateRowAndColumnStyle(selectedNum, nowOrigin)
      }
      window.addEventListener("mouseup", up)
      function up(e){
        that.setState({
          origin: nowOrigin
        })
        that.updateAllByOrigin()
        window.removeEventListener("mousemove", moving)
        window.removeEventListener("mouseup", up)
      }
    }
    if(e.path[0].className === "segment-content-column segment-content-column-coronal"){
      const x = e.clientX
      const origin = this.state.origin
      const nowOrigin = []
      origin.forEach((item, idx) => {
        nowOrigin[idx] = item
      })
      const selectedNum = this.state.selectedNum
      const ratio = this.getRatio(1, 0)
      const that = this
      window.addEventListener("mousemove", moving)
      function moving(e){
        const xNow = e.clientX
        nowOrigin[0] = origin[0] + (xNow - x) * ratio
        that.updateRowAndColumnStyle(selectedNum, nowOrigin)
      }
      window.addEventListener("mouseup", up)
      function up(e){
        that.setState({
          origin: nowOrigin
        })
        that.updateAllByOrigin()
        window.removeEventListener("mousemove", moving)
        window.removeEventListener("mouseup", up)
      }
    }
    if(e.path[0].className === "segment-content-row segment-content-row-sagittal"){
      console.log("mouse down", e)
      const y = e.clientY
      const origin = this.state.origin
      const nowOrigin = []
      origin.forEach((item, idx) => {
        nowOrigin[idx] = item
      })
      const selectedNum = this.state.selectedNum
      const ratio = this.getRatio(2, 2)
      const that = this
      window.addEventListener("mousemove", moving)
      function moving(e){
        const yNow = e.clientY
        nowOrigin[2] = origin[2] + (yNow - y) * ratio
        that.updateRowAndColumnStyle(selectedNum, nowOrigin)
      }
      window.addEventListener("mouseup", up)
      function up(e){
        that.setState({
          origin: nowOrigin
        })
        that.updateAllByOrigin()
        window.removeEventListener("mousemove", moving)
        window.removeEventListener("mouseup", up)
      }
    }
    if(e.path[0].className === "segment-content-column segment-content-column-sagittal"){
      const x = e.clientX
      const origin = this.state.origin
      const nowOrigin = []
      origin.forEach((item, idx) => {
        nowOrigin[idx] = item
      })
      const selectedNum = this.state.selectedNum
      const ratio = this.getRatio(2, 1)
      const that = this
      window.addEventListener("mousemove", moving)
      function moving(e){
        const xNow = e.clientX
        nowOrigin[1] = origin[1] + (xNow - x) * ratio
        that.updateRowAndColumnStyle(selectedNum, nowOrigin)
      }
      window.addEventListener("mouseup", up)
      function up(e){
        that.setState({
          origin: nowOrigin
        })
        that.updateAllByOrigin()
        window.removeEventListener("mousemove", moving)
        window.removeEventListener("mouseup", up)
      }
    }
  }
  click(e){
    console.log("click", e)
    if(this.state.editing){
      if(e.path[3]){
        if(e.path[3].className === "segment-container"){
          const selectionStyles = this.state.selectionStyles
          const height = selectionStyles[0].height.replace("px", "")
          console.log("e.offsetX", e.offsetX)
          console.log("e.offsetY", e.offsetY)
          const picked = this.viewer.click3DViewer(e.offsetX, height - e.offsetY)
          console.log("picked ", picked)
          if(picked){
            const sphereSource = vtkSphereSource.newInstance();
            sphereSource.setRadius(5)
            sphereSource.setCenter(picked)
            const mapper = vtkMapper.newInstance({
              scalarVisibility: false
            })
            mapper.setInputData(sphereSource.getOutputData());
            const actor = vtkActor.newInstance();
            actor.setMapper(mapper);

            const {origin, originXBorder, originYBorder, originZBorder} = this.state
            const {xMax, yMax, zMax, xMin, yMin, zMin} = this.state.segRange
            console.log("segRange", this.state.segRange)
            const x = picked[0]
            const y = picked[1]
            const z = picked[2]
            origin[0] = originXBorder * (xMax - x) / (xMax - xMin)
            origin[1] = originYBorder * (y - yMin) / (yMax - yMin)
            origin[2] = originZBorder * (zMax - z) / (zMax - zMin)
            this.updateAllByOrigin()
            this.setState({
              pointActors: [actor]
            })
          }
        }
      }
      if(e.path[1].className === "segment-content-block segment-content-axial" && e.path[0].id === "canvas-axial"){
        const selectionStyles = this.state.selectionStyles
        const height = selectionStyles[1].height.replace("px", "")
        const {origin, originXBorder, originYBorder, originZBorder} = this.state
        const ratioX = this.getRatio(0, 0)
        const ratioY = this.getRatio(0, 1)
        const {x, y} = this.getTopLeftOffset(0)
        const xNow = e.offsetX
        const yNow = e.offsetY
        // const picked = this.viewer.clickMPR(e.offsetX, height - e.offsetY)
        // console.log("new", picked)
        const o1 = (yNow - y) * ratioY
        const o0 = (xNow - x) * ratioX
        if(o1 >= 0 && o1 <= originYBorder && o0 >= 0 && o0 <= originXBorder){
          origin[1] = (yNow - y) * ratioY
          origin[0] = (xNow - x) * ratioX
          this.updateAllByOrigin()
        }
      }
      if(e.path[1].className === "segment-content-block segment-content-coronal" && e.path[0].id === "canvas-coronal"){
        const {origin, originXBorder, originYBorder, originZBorder} = this.state
        const ratioX = this.getRatio(1, 0)
        const ratioZ = this.getRatio(1, 2)
        const {x, y} = this.getTopLeftOffset(1)
        const xNow = e.offsetX
        const yNow = e.offsetY
        const o2 = (yNow - y) * ratioZ
        const o0 = (xNow - x) * ratioX
        if(o2 >= 0 && o2 <= originZBorder && o0 >= 0 && o0 <= originXBorder){
          origin[2] = (yNow - y) * ratioZ
          origin[0] = (xNow - x) * ratioX
          this.updateAllByOrigin()
        }
      }
      if(e.path[1].className === "segment-content-block segment-content-sagittal" && e.path[0].id === "canvas-sagittal"){
        const {origin, originXBorder, originYBorder, originZBorder} = this.state
        const ratioY = this.getRatio(2, 1)
        const ratioZ = this.getRatio(2, 2)
        const {x, y} = this.getTopLeftOffset(2)
        const xNow = e.offsetX
        const yNow = e.offsetY
        const o2 = (yNow - y) * ratioZ
        const o1 = (xNow - x) * ratioY
        if(o2 >= 0 && o2 <= originZBorder && o1 >= 0 && o1 <= originYBorder){
          origin[2] = (yNow - y) * ratioZ
          origin[1] = (xNow - x) * ratioY
          this.updateAllByOrigin()
        }
      }
    }
    if(this.state.painting){
      const isEraser = this.state.isEraser
      if(e.path[1].className === "segment-content-block segment-content-axial" && e.path[0].id === "canvas-axial"){
        const origin = this.state.origin
        const ratioX = this.getRatio(0, 0)
        const ratioY = this.getRatio(0, 1)
        const {x, y} = this.getTopLeftOffset(0)
        const xNow = e.offsetX
        const yNow = e.offsetY
        const pNow = []
        pNow[2] = Math.round(origin[2])
        pNow[1] = Math.round((yNow - y) * ratioY)
        pNow[0] = Math.round((xNow - x) * ratioX)
        console.log("origin", pNow[0], pNow[1], pNow[2])
        if(isEraser){
          this.erase(pNow[0], pNow[1], pNow[2], 0, 20)
        }else{
          this.pickup(pNow[0], pNow[1], pNow[2], 0, 0)
        }
        this.updateCanvas()
      }
      if(e.path[1].className === "segment-content-block segment-content-coronal" && e.path[0].id === "canvas-coronal"){
        const origin = this.state.origin
        const ratioX = this.getRatio(1, 0)
        const ratioZ = this.getRatio(1, 2)
        const {x, y} = this.getTopLeftOffset(1)
        const xNow = e.offsetX
        const yNow = e.offsetY
        const pNow = []
        pNow[2] = Math.round((yNow - y) * ratioZ)
        pNow[1] = Math.round(origin[1])
        pNow[0] = Math.round((xNow - x) * ratioX)
        if(isEraser){
          this.erase(pNow[0], pNow[1], pNow[2], 1, 20)
        }else {
          this.pickup(pNow[0], pNow[1], pNow[2], 1, 0)
        }
        this.updateCanvas()
      }
      if(e.path[1].className === "segment-content-block segment-content-sagittal" && e.path[0].id === "canvas-sagittal"){
        const origin = this.state.origin
        const ratioY = this.getRatio(2, 1)
        const ratioZ = this.getRatio(2, 2)
        const {x, y} = this.getTopLeftOffset(2)
        const xNow = e.offsetX
        const yNow = e.offsetY
        const pNow = []
        pNow[2] = Math.round((yNow - y) * ratioZ)
        pNow[1] = Math.round((xNow - x) * ratioY)
        pNow[0] = Math.round(origin[0])
        if(isEraser){
          this.erase(pNow[0], pNow[1], pNow[2], 2, 20)
        }else {
          this.pickup(pNow[0], pNow[1], pNow[2], 2, 0)
        }
        this.updateCanvas()
      }
    }
    // if(this.state.texting){
    //   if(e.path[1].className === "segment-content-block segment-content-axial" && e.path[0].id === "canvas-axial"){
    //     const origin = this.state.origin
    //     const ratioX = this.getRatio(0, 0)
    //     const ratioY = this.getRatio(0, 1)
    //     const {x, y} = this.getTopLeftOffset(0)
    //     const xNow = e.offsetX
    //     const yNow = e.offsetY
    //     const pNow = []
    //     pNow[2] = Math.round(origin[2])
    //     pNow[1] = Math.round((yNow - y) * ratioY)
    //     pNow[0] = Math.round((xNow - x) * ratioX)
    //     console.log("origin", pNow[0], pNow[1], pNow[2])
    //     this.pickup2(pNow[0], pNow[1], pNow[2], 0, 20)
    //   }
    //   if(e.path[1].className === "segment-content-block segment-content-coronal" && e.path[0].id === "canvas-coronal"){
    //     const origin = this.state.origin
    //     const ratioX = this.getRatio(1, 0)
    //     const ratioZ = this.getRatio(1, 2)
    //     const {x, y} = this.getTopLeftOffset(1)
    //     const xNow = e.offsetX
    //     const yNow = e.offsetY
    //     const pNow = []
    //     pNow[2] = Math.round((yNow - y) * ratioZ)
    //     pNow[1] = Math.round(origin[1])
    //     pNow[0] = Math.round((xNow - x) * ratioX)
    //     this.pickup2(pNow[0], pNow[1], pNow[2], 1, 20)
    //   }
    //   if(e.path[1].className === "segment-content-block segment-content-sagittal" && e.path[0].id === "canvas-sagittal"){
    //     const origin = this.state.origin
    //     const ratioY = this.getRatio(2, 1)
    //     const ratioZ = this.getRatio(2, 2)
    //     const {x, y} = this.getTopLeftOffset(2)
    //     const xNow = e.offsetX
    //     const yNow = e.offsetY
    //     const pNow = []
    //     pNow[2] = Math.round((yNow - y) * ratioZ)
    //     pNow[1] = Math.round((xNow - x) * ratioY)
    //     pNow[0] = Math.round(origin[0])
    //     this.pickup2(pNow[0], pNow[1], pNow[2], 2, 20)
    //   }
    // }
  }
  dblclick(e){
    console.log("dblclick", e)
    const paths = e.path
    if (paths[3]){
      if(paths[3].className === "segment-container"){
        this.selectByNum(1)
      }
    }
    if (paths[1]) {
      //for selectedNum: 1 represents 3d; 2 represents axial; 3 represents coronal; 4 represents sagittal
      if (paths[1].className === "segment-content-block segment-content-axial") {
        this.selectByNum(2)
      } else if (paths[1].className === "segment-content-block segment-content-coronal") {
        this.selectByNum(3)
      } else if (paths[1].className === "segment-content-block segment-content-sagittal") {
        this.selectByNum(4)
      } else if (paths[1].className === "segment-content-block segment-content-3d") {

      }
    }
  }

  updateAllByOrigin(){
    this.updateRowAndColumnStyle()
    this.updatePointActor()
    imageData.modified()
    this.updateVolumeActor()
  }

  pickup(x, y, z, model, radius){
    //model 0 represents axial, model 1 represents coronal, model 2 represents sagittal
    const {originXBorder, originYBorder, originZBorder} = this.state
    const position = this.state.position
    if(model === 0){
      if(x >= 0 && x < originXBorder && y >= 0 && y < originYBorder && z >= 0 && z < originZBorder){
        position[z][y][x] = 1
      }
      // for(let i = 0; i < radius; i++){
      //   for(let j = 0; j < radius; j++){
      //     const xNow = Math.round(x - radius/2 + j)
      //     const yNow = Math.round(y - radius/2 + i)
      //     if(xNow >= 0 && xNow < originXBorder && yNow >= 0 && yNow < originYBorder){
      //       position[z][yNow][xNow] = 1
      //     }
      //   }
      // }
    }else if(model === 1){
      if(x >= 0 && x < originXBorder && y >= 0 && y < originYBorder && z >= 0 && z < originZBorder){
        position[z][y][x] = 1
      }
      // for(let i = 0; i < radius; i++){
      //   for(let j = 0; j < radius; j++){
      //     const xNow = Math.round(x - radius/2 + j)
      //     const zNow = Math.round(z - radius/2 + i)
      //     if(xNow >= 0 && xNow < originXBorder && zNow >= 0 && zNow < originZBorder){
      //       position[zNow][y][xNow] = 1
      //     }
      //   }
      // }
    }else if(model === 2){
      if(x >= 0 && x < originXBorder && y >= 0 && y < originYBorder && z >= 0 && z < originZBorder){
        position[z][y][x] = 1
      }
      // for(let i = 0; i < radius; i++){
      //   for(let j = 0; j < radius; j++){
      //     const yNow = Math.round(y - radius/2 + j)
      //     const zNow = Math.round(z - radius/2 + i)
      //     if(yNow >= 0 && yNow < originYBorder && zNow >= 0 && zNow < originZBorder){
      //       position[zNow][yNow][x] = 1
      //     }
      //   }
      // }
    }
  }
  pickup2(x, y, z, model, radius){
    //model 0 represents axial, model 1 represents coronal, model 2 represents sagittal
    const {originXBorder, originYBorder, originZBorder, metaData0} = this.state
    const rowPixelSpacing = metaData0.rowPixelSpacing
    const columnPixelSpacing = metaData0.columnPixelSpacing
    const paintImageData = this.state.paintImageData
    const newImageData = paintImageData[0]
    console.log("this scalarData", newImageData.getDimensions())
    const scalarData = newImageData.getPointData().getScalars().getData()
    if(model === 0){
      for(let i = 0; i < radius; i++){
        for(let j = 0; j < radius; j++){
          const xNow = Math.round(x - radius/2 + j)
          const yNow = Math.round(y - radius/2 + i)
          if(xNow >= 0 && xNow < originXBorder && yNow >= 0 && yNow < originYBorder){
            const index = Math.round(xNow / columnPixelSpacing) + Math.round(yNow / rowPixelSpacing) * 512 + z * 512 * 512
            console.log("index", index)
            scalarData[index] = 1
          }
        }
      }
      newImageData.modified()
      paintImageData[0] = newImageData
      this.setState({
        paintImageData:paintImageData
      })
      this.updateVolumeActor(this.state.origin, 0)
    }else if(model === 1){
      for(let i = 0; i < radius; i++){
        for(let j = 0; j < radius; j++){
          const xNow = Math.round(x - radius/2 + j)
          const zNow = Math.round(z - radius/2 + i)
          if(xNow >= 0 && xNow < originXBorder && zNow >= 0 && zNow < originZBorder){
            const index = Math.round(xNow / columnPixelSpacing) + Math.round(y / rowPixelSpacing) * 512 + zNow * 512 * 512
            scalarData[index] = 1
          }
        }
      }
    }else if(model === 2){
      for(let i = 0; i < radius; i++){
        for(let j = 0; j < radius; j++){
          const yNow = Math.round(y - radius/2 + j)
          const zNow = Math.round(z - radius/2 + i)
          if(yNow >= 0 && yNow < originYBorder && zNow >= 0 && zNow < originZBorder){
            const index = Math.round(x / columnPixelSpacing) + Math.round(yNow / rowPixelSpacing) * 512 + zNow * 512 * 512
            scalarData[index] = 1
          }
        }
      }
    }
  }
  erase(x, y, z, model, radius){
    //model 0 represents axial, model 1 represents coronal, model 2 represents sagittal
    const {originXBorder, originYBorder, originZBorder} = this.state
    const position = this.state.position
    if(model === 0){
      for(let i = 0; i < radius; i++){
        for(let j = 0; j < radius; j++){
          const xNow = Math.round(x - radius/2 + j)
          const yNow = Math.round(y - radius/2 + i)
          if(xNow >= 0 && xNow < originXBorder && yNow >= 0 && yNow < originYBorder && z >= 0 && z < originZBorder){
            position[z][yNow][xNow] = 0
          }
        }
      }
    }else if(model === 1){
      for(let i = 0; i < radius; i++){
        for(let j = 0; j < radius; j++){
          const xNow = Math.round(x - radius/2 + j)
          const zNow = Math.round(z - radius/2 + i)
          if(xNow >= 0 && xNow < originXBorder && y >= 0 && y < originYBorder && zNow >= 0 && zNow < originZBorder){
            position[zNow][y][xNow] = 0
          }
        }
      }
    }else if(model === 2){
      for(let i = 0; i < radius; i++){
        for(let j = 0; j < radius; j++){
          const yNow = Math.round(y - radius/2 + j)
          const zNow = Math.round(z - radius/2 + i)
          if(x >= 0 && x < originXBorder && yNow >= 0 && yNow < originYBorder && zNow >= 0 && zNow < originZBorder){
            position[zNow][yNow][x] = 0
          }
        }
      }
    }
  }
  updateCanvas(position){
    if(typeof(position) === "undefined"){
      position = this.state.position
    }
    this.clearCanvas()
    const ctxAxial=document.getElementById('canvas-axial').getContext('2d')
    // const imageDataAxial = ctxAxial.getImageData(0,0,widthAxial,heightAxial)
    const ctxCoronal=document.getElementById('canvas-coronal').getContext('2d')
    const ctxSagittal=document.getElementById('canvas-sagittal').getContext('2d')

    const {origin, originXBorder, originYBorder, originZBorder} = this.state
    const oS = Math.round(origin[0])
    const oC = Math.round(origin[1])
    const oA = Math.round(origin[2])
    const x0 = this.getTopLeftOffset(0)
    const x1 = this.getTopLeftOffset(1)
    const x2 = this.getTopLeftOffset(2)
    const xA = x0.x
    const yA = x0.y
    const xC = x1.x
    const yC = x1.y
    const xS = x2.x
    const yS = x2.y
    const rxA = this.getRatio(0, 0)
    const ryA = this.getRatio(0, 1)
    const rxC = this.getRatio(1, 0)
    const rzC = this.getRatio(1, 2)
    const ryS = this.getRatio(2, 1)
    const rzS = this.getRatio(2, 2)

    const arrayAxial = []
    const arrayCoronal = []
    const arraySagittal = []
    for(let i = 0; i < originZBorder; i++){
      for(let j = 0; j < originYBorder; j++){
        const pNow = position[i][j][oS]
        if(pNow === 1){
          const xOffset = Math.round(j/ryS + xS)
          const yOffset = Math.round(i/rzS + yS)
          arraySagittal.push({x:xOffset, y:yOffset})
        }
      }
    }
    for(let i = 0; i < originZBorder; i++){
      for(let j = 0; j < originXBorder; j++){
        const pNow = position[i][oC][j]
        if(pNow === 1){
          const xOffset =  Math.round(j/rxC + xC)
          const yOffset =  Math.round(i/rzC + yC)
          arrayCoronal.push({x:xOffset, y:yOffset})
        }
      }
    }
    for(let i = 0; i < originYBorder; i++){
      for(let j = 0; j < originXBorder; j++){
        const pNow = position[oA][i][j]
        if(pNow === 1){
          const xOffset = Math.round(j/rxA + xA)
          const yOffset = Math.round(i/ryA + yA)
          arrayAxial.push({x:xOffset, y:yOffset})
          // imageDataAxial[xOffset * 4 + yOffset * widthAxial * 4] = 120
          // imageDataAxial[xOffset * 4 + yOffset * widthAxial * 4 + 1] = 120
          // imageDataAxial[xOffset * 4 + yOffset * widthAxial * 4 + 2] = 120
          // imageDataAxial[xOffset * 4 + yOffset * widthAxial * 4 + 3] = 255
        }
      }
    }
    this.paintRect(ctxAxial, arrayAxial, 0)
    this.paintRect(ctxCoronal, arrayCoronal, 1)
    this.paintRect(ctxSagittal, arraySagittal, 2)
    // ctxAxial.putImageData(imageDataAxial, 0, 0)
    // console.log("imageData", imageDataAxial)
  }
  paintRect(ctx, array, model){
    //for model parameter, 0 represents axial, 1 represents coronal, 2 represents sagittal
    if(array.length > 0){
      ctx.beginPath()
      if(model === 0){
        ctx.strokeStyle = 'rgba(255,0,0,0.5)'
        ctx.fillStyle = 'rgba(255,0,0,0.3)'
      }else if(model === 1){
        ctx.strokeStyle = 'rgba(0,255,0,0.5)'
        ctx.fillStyle = 'rgba(0,255,0,0.3)'
      }else if(model === 2){
        ctx.strokeStyle = 'rgba(255,255,0,0.5)'
        ctx.fillStyle = 'rgba(255,255,0,0.3)'
      }
      ctx.lineWidth = 1
      // ctx.lineCap='square'           //端点
      // ctx.lineJoin='round'          //拐点
      function c1(x, y){
        // small to big
        if (x.x < y.x) {
          return -1;
        } else if (x.x > y.x) {
          return 1;
        } else {
          return 0;
        }
      }
      function c2(x, y){
        // big to small
        if (x.x < y.x) {
          return 1;
        } else if (x.x > y.x) {
          return -1;
        } else {
          return 0;
        }
      }
      const arrayBig = []
      const arraySmall = []
      array.sort(c1)
      const first = array[0]
      array.forEach((item, idx) => {
        if(idx !== 0){
          if(item.y >= first.y){
            arrayBig.push(item)
          }else{
            arraySmall.push(item)
          }
        }
      })
      arraySmall.sort(c2)
      ctx.moveTo(first.x, first.y)
      arrayBig.forEach((item) => {
        ctx.lineTo(item.x, item.y)
      })
      arraySmall.forEach((item) => {
        ctx.lineTo(item.x, item.y)
      })
      ctx.lineTo(first.x, first.y)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    }
  }
  clearCanvas(){
    const ctxAxial=document.getElementById('canvas-axial').getContext('2d')
    const widthAxial = document.getElementById('canvas-axial').width
    const heightAxial = document.getElementById('canvas-axial').height
    // const imageDataAxial = ctxAxial.getImageData(0,0,widthAxial,heightAxial)
    const ctxCoronal=document.getElementById('canvas-coronal').getContext('2d')
    const widthCoronal = document.getElementById('canvas-coronal').width
    const heightCoronal = document.getElementById('canvas-coronal').height
    const ctxSagittal=document.getElementById('canvas-sagittal').getContext('2d')
    const widthSagittal = document.getElementById('canvas-sagittal').width
    const heightSagittal = document.getElementById('canvas-sagittal').height
    ctxAxial.clearRect(0,0,widthAxial,heightAxial)
    ctxCoronal.clearRect(0,0,widthCoronal,heightCoronal)
    ctxSagittal.clearRect(0,0,widthSagittal,heightSagittal)
  }
  getRatio(model, cor){
    //switch pixel to origin
    //for model parameter, 0 represents axial, 1 represents coronal, 2 represents sagittal
    //for cor parameter, 0 represents x, 1 represents y, 2 represents z
    const {selectedNum, originXBorder, originYBorder, originZBorder, volLength, volXLength, volYLength} = this.state
    // const volLength = 600
    // const volXLength = 680
    // const volYLength = 520
    let ratio
    if(selectedNum === 0){
      if(model === 0){
        if(cor === 0){
          ratio = originXBorder / (volLength / 2)
        }else if(cor === 1){
          ratio = originYBorder / (volLength / 2)
        }
      }else if(model === 1){
        if(cor === 0){
          ratio = originXBorder / (volXLength / 2)
        }else if(cor === 2){
          ratio = originZBorder / (volYLength / 2)
        }
      }else if(model === 2){
        if(cor === 1){
          ratio = originXBorder / (volXLength / 2)
        }else if(cor === 2){
          ratio = originYBorder / (volYLength / 2)
        }
      }
    }else if(selectedNum === 1){
      if(model === 0){
        if(cor === 0){
          ratio = originXBorder / (volLength / 3)
        }else if(cor === 1){
          ratio = originYBorder / (volLength / 3)
        }
      }else if(model === 1){
        if(cor === 0){
          ratio = originXBorder / (volXLength / 3)
        }else if(cor === 2){
          ratio = originZBorder / (volYLength / 3)
        }
      }else if(model === 2){
        if(cor === 1){
          ratio = originYBorder / (volXLength / 3)
        }else if(cor === 2){
          ratio = originZBorder / (volYLength / 3)
        }
      }
    }else if(selectedNum === 2){
      if(model === 0){
        if(cor === 0){
          ratio = originXBorder / volLength
        }else if(cor === 1){
          ratio = originYBorder / volLength
        }
      }else if(model === 1){
        if(cor === 0){
          ratio = originXBorder / (volXLength / 3)
        }else if(cor === 2){
          ratio = originZBorder / (volYLength / 3)
        }
      }else if(model === 2){
        if(cor === 1){
          ratio = originYBorder / (volXLength / 3)
        }else if(cor === 2){
          ratio = originZBorder / (volYLength / 3)
        }
      }
    }else if(selectedNum === 3){
      if(model === 0){
        if(cor === 0){
          ratio = originXBorder / (volLength / 3)
        }else if(cor === 1){
          ratio = originYBorder / (volLength / 3)
        }
      }else if(model === 1){
        if(cor === 0){
          ratio = originXBorder / volXLength
        }else if(cor === 2){
          ratio = originZBorder / volYLength
        }
      }else if(model === 2){
        if(cor === 1){
          ratio = originYBorder / (volXLength / 3)
        }else if(cor === 2){
          ratio = originZBorder / (volYLength / 3)
        }
      }
    }else if(selectedNum === 4){
      if(model === 0){
        if(cor === 0){
          ratio = originXBorder / (volLength / 3)
        }else if(cor === 1){
          ratio = originYBorder / (volLength / 3)
        }
      }else if(model === 1){
        if(cor === 0){
          ratio = originXBorder / (volXLength / 3)
        }else if(cor === 2){
          ratio = originZBorder / (volYLength / 3)
        }
      }else if(model === 2){
        if(cor === 1){
          ratio = originYBorder / volXLength
        }else if(cor === 2){
          ratio = originZBorder / volYLength
        }
      }
    }
    return ratio
  }
  getTopLeftOffset(model){
    //volume's top left, not viewer's top left
    //for model parameter, 0 represents axial, 1 represents coronal, 2 represents sagittal
    //for cor parameter, 0 represents x, 1 represents y, 2 represents z
    const {selectedNum, viewerWidth, viewerHeight, volLength, volXLength, volYLength} = this.state
    // const volLength = 600
    // const volXLength = 680
    // const volYLength = 520

    let x
    let y
    if(selectedNum === 0){
      if(model === 0){
        x = (viewerWidth/2  - volLength/2)/2
        y = (viewerHeight/2 - volLength/2)/2
      }else if(model === 1){
        x = (viewerWidth/2  - volXLength/2)/2
        y = (viewerHeight/2 - volYLength/2)/2
      }else if(model === 2){
        x = (viewerWidth/2  - volXLength/2)/2
        y = (viewerHeight/2 - volYLength/2)/2
      }
    }else if(selectedNum === 1){
      if(model === 0){
        x = (0.33 * viewerWidth - volLength/3)/2
        y = (0.33 * viewerHeight - volLength/3)/2
      }else if(model === 1){
        x = (0.33 * viewerWidth - volXLength/3)/2
        y = (0.33 * viewerHeight - volYLength/3)/2
      }else if(model === 2){
        x = (0.33 * viewerWidth - volXLength/3)/2
        y = (0.34 * viewerHeight - volYLength/3)/2
      }
    }else if(selectedNum === 2){
      if(model === 0){
        x = (0.67 * viewerWidth - volLength)/2
        y = (viewerHeight - volLength)/2
      }else if(model === 1){
        x = (0.33 * viewerWidth - volXLength/3)/2
        y = (0.33 * viewerHeight - volYLength/3)/2
      }else if(model === 2){
        x = (0.33 * viewerWidth - volXLength/3)/2
        y = (0.34 * viewerHeight - volYLength/3)/2
      }
    }else if(selectedNum === 3){
      if(model === 1){
        x = (0.67 * viewerWidth - volXLength)/2
        y = (viewerHeight - volYLength)/2
      }else if(model === 0){
        x = (0.33 * viewerWidth - volLength/3)/2
        y = (0.33 * viewerHeight - volLength/3)/2
      }else if(model === 2){
        x = (0.33 * viewerWidth - volXLength/3)/2
        y = (0.34 * viewerHeight - volYLength/3)/2
      }
    }else if(selectedNum === 4){
      if(model === 2){
        x = (0.67 * viewerWidth - volXLength)/2
        y = (viewerHeight - volYLength)/2
      }else if(model === 0){
        x = (0.33 * viewerWidth - volLength/3)/2
        y = (0.33 * viewerHeight - volLength/3)/2
      }else if(model === 1){
        x = (0.33 * viewerWidth - volXLength/3)/2
        y = (0.34 * viewerHeight - volYLength/3)/2
      }
    }
    return {x, y}
  }
  updatePointActor(origin){
    if(typeof(origin) === "undefined"){
      origin = this.state.origin
    }
    const picked = []
    const {originXBorder, originYBorder, originZBorder} = this.state
    const {xMax, yMax, zMax, xMin, yMin, zMin} = this.state.segRange
    picked[0] = xMax - (origin[0] * (xMax - xMin ) / originXBorder)
    picked[1] = yMin + (origin[1] * (yMax - yMin) / originYBorder)
    picked[2] = zMax - (origin[2] * (zMax - zMin) / originZBorder)

    const sphereSource = vtkSphereSource.newInstance()
    sphereSource.setRadius(5)
    sphereSource.setCenter(picked)
    const mapper = vtkMapper.newInstance({
      scalarVisibility: false
    })
    mapper.setInputData(sphereSource.getOutputData())
    const actor = vtkActor.newInstance()
    actor.setMapper(mapper)

    this.setState({
      pointActors: [actor]
    })
  }
  clearPointActor(){
    this.viewer.clearPointActor()
    this.setState({
      pointActors: []
    })
  }
  updateRowAndColumnStyle(selectedNum, origin){
    //num 0 represents no selection, num 1 represents selection of 3d, num 2 represents selection of axial,
    //num 3 represents selection of coronal, num 4 represents selection of sagittal
    if(typeof(selectedNum) === "undefined"){
      selectedNum = this.state.selectedNum
    }
    if(typeof(origin) === "undefined"){
      origin = this.state.origin
    }
    // console.log("origin",origin)
    const {viewerWidth, viewerHeight, originXBorder, originYBorder, originZBorder, volLength, volXLength, volYLength} = this.state
    // const volLength = 600
    // const volXLength = 680
    // const volYLength = 520

    //10
    const v1 = this.calTypeB(viewerHeight/2, volLength/2, origin[1], originYBorder) //1
    const v2 = this.calTypeB(viewerWidth/2, volLength/2, origin[0], originXBorder) //1
    const v3 = this.calTypeB(0.33 * viewerHeight, volLength/3, origin[1], originYBorder) //3
    const v4 = this.calTypeB(0.33 * viewerWidth, volLength/3, origin[0], originXBorder) //3
    const v5 = this.calTypeB(0.67 * viewerWidth, volLength, origin[0], originXBorder) //1
    const v6 = this.calTypeB(viewerHeight, volLength, origin[1], originYBorder) //1
    
    //10
    const v7 = this.calTypeB(viewerWidth/2, volXLength/2, origin[0], originXBorder) //1
    const v8 = this.calTypeB(viewerWidth/2, volXLength/2, origin[1], originYBorder) //1
    const v9 = this.calTypeB(0.33 * viewerWidth, volXLength/3, origin[0], originXBorder) //2
    const v10 = this.calTypeB(0.33 * viewerWidth, volXLength/3, origin[1], originYBorder) //3
    const v11 = this.calTypeB(0.67 * viewerWidth, volXLength, origin[0], originXBorder) //1
    const v12 = this.calTypeB(0.33 * viewerWidth, volXLength/3, origin[0], originXBorder) //1
    const v13 = this.calTypeB(0.67 * viewerWidth, volXLength, origin[1], originYBorder) //1
    
    // 10
    const v14 = this.calTypeB(viewerHeight/2, volYLength/2, origin[2], originZBorder) //2
    const v15 = this.calTypeB(0.33 * viewerHeight, volYLength/3, origin[2], originZBorder) //2
    const v16 = this.calTypeB(0.34 * viewerHeight, volYLength/3, origin[2], originZBorder) //4
    const v17 = this.calTypeB(viewerHeight, volYLength, origin[2], originZBorder) //2


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
      axialRowStyle = {top:`${v1}px`, left:`${viewerWidth * 0.1/2}px`, width:`${viewerWidth * 0.8/2}px`, background:colorC}
      axialColumnStyle = {top:`${viewerHeight * 0.1/2}px`, left:`${v2}px`, height:`${viewerHeight * 0.8/2}px`, background:colorS}
      coronalRowStyle = {top:`${v14}px`, left:`${viewerWidth * 0.1/2}px`, width:`${viewerWidth * 0.8/2}px`, background:colorA}
      coronalColumnStyle = {top:`${viewerHeight * 0.1/2}px`, left:`${v7}px`, height:`${viewerHeight * 0.8/2}px`, background:colorS}
      sagittalRowStyle = {top:`${v14}px`, left:`${viewerWidth * 0.1/2}px`, width:`${viewerWidth * 0.8/2}px`, background:colorA}
      sagittalColumnStyle = {top:`${viewerHeight * 0.1/2}px`, left:`${v8}px`, height:`${viewerHeight * 0.8/2}px`, background:colorC}
    }else if(selectedNum === 1){
      axialRowStyle = {top:`${v3}px`, left:`${0.33 * viewerWidth * 0.1}px`, width:`${0.33 * viewerWidth * 0.8}px`, background:colorC}
      axialColumnStyle = {top:`${0.33 * viewerHeight * 0.1}px`, left:`${v4}px`, height:`${0.33 * viewerHeight * 0.8}px`, background:colorS}
      coronalRowStyle = {top:`${v15}px`, left:`${0.33 * viewerWidth * 0.1}px`, width:`${0.33 * viewerWidth * 0.8}px`, background:colorA}
      coronalColumnStyle = {top:`${0.33 * viewerHeight * 0.1}px`, left:`${v9}px`, height:`${0.33 * viewerHeight * 0.8}px`, background:colorS}
      sagittalRowStyle = {top:`${v16}px`, left:`${0.33 * viewerWidth * 0.1}px`, width:`${0.33 * viewerWidth * 0.8}px`, background:colorA}
      sagittalColumnStyle = {top:`${0.34 * viewerHeight * 0.1}px`, left:`${v10}px`, height:`${0.34 * viewerHeight * 0.8}px`, background:colorC}
    }else if(selectedNum === 2){
      axialRowStyle = {top:`${v6}px`, left:`${0.67 * viewerWidth * 0.1}px`, width:`${0.67 * viewerWidth * 0.8}px`, background:colorC}
      axialColumnStyle = {top:`${viewerHeight * 0.1}px`, left:`${v5}px`, height:`${viewerHeight * 0.8}px`, background:colorS}
      coronalRowStyle = {top:`${v15}px`, left:`${0.33 * viewerWidth * 0.1}px`, width:`${0.33 * viewerWidth * 0.8}px`, background:colorA}
      coronalColumnStyle = {top:`${0.33 * viewerHeight * 0.1}px`, left:`${v9}px`, height:`${0.33 * viewerHeight * 0.8}px`, background:colorS}
      sagittalRowStyle = {top:`${v16}px`, left:`${0.33 * viewerWidth * 0.1}px`, width:`${0.33 * viewerWidth * 0.8}px`, background:colorA}
      sagittalColumnStyle = {top:`${0.34 * viewerHeight * 0.1}px`, left:`${v10}px`, height:`${0.34 * viewerHeight * 0.8}px`, background:colorC}
    }else if(selectedNum === 3){
      axialRowStyle = {top:`${v3}px`, left:`${0.33 * viewerWidth * 0.1}px`, width:`${0.33 * viewerWidth * 0.8}px`, background:colorC}
      axialColumnStyle = {top:`${0.33 * viewerHeight * 0.1}px`, left:`${v4}px`, height:`${0.33 * viewerHeight * 0.8}px`, background:colorS}
      coronalRowStyle = {top:`${v17}px`, left:`${0.67 * viewerWidth * 0.1}px`, width:`${0.67 * viewerWidth * 0.8}px`, background:colorA}
      coronalColumnStyle = {top:`${viewerHeight * 0.1}px`, left:`${v11}px`, height:`${viewerHeight * 0.8}px`, background:colorS}
      sagittalRowStyle = {top:`${v16}px`, left:`${0.33 * viewerWidth * 0.1}px`, width:`${0.33 * viewerWidth * 0.8}px`, background:colorA}
      sagittalColumnStyle = {top:`${0.34 * viewerHeight * 0.1}px`, left:`${v10}px`, height:`${0.34 * viewerHeight * 0.8}px`, background:colorC}
    }else if(selectedNum === 4){
      axialRowStyle = {top:`${v3}px`, left:`${0.33 * viewerWidth * 0.1}px`, width:`${0.33 * viewerWidth * 0.8}px`, background:colorC}
      axialColumnStyle = {top:`${0.33 * viewerHeight * 0.1}px`, left:`${v4}px`, height:`${0.33 * viewerHeight * 0.8}px`, background:colorS}
      coronalRowStyle = {top:`${v16}px`, left:`${0.33 * viewerWidth * 0.1}px`, width:`${0.33 * viewerWidth * 0.8}px`, background:colorA}
      coronalColumnStyle = {top:`${0.34 * viewerHeight * 0.1}px`, left:`${v12}px`, height:`${0.34 * viewerHeight * 0.8}px`, background:colorS}
      sagittalRowStyle = {top:`${v17}px`, left:`${0.67 * viewerWidth * 0.1}px`, width:`${0.67 * viewerWidth * 0.8}px`, background:colorA}
      sagittalColumnStyle = {top:`${viewerHeight * 0.1}px`, left:`${v13}px`, height:`${viewerHeight * 0.8}px`, background:colorC}
    }
    this.setState({
      axialRowStyle: axialRowStyle,
      axialColumnStyle: axialColumnStyle,
      coronalRowStyle: coronalRowStyle,
      coronalColumnStyle: coronalColumnStyle,
      sagittalRowStyle: sagittalRowStyle,
      sagittalColumnStyle: sagittalColumnStyle
    })
  }
  calTypeA(w, x, y, z){
    return w - (w - x)/2 - x * y / z
  }
  calTypeB(w, x, y, z){
    return (w - x)/2 + x * y / z
  }
  selectByNum(selectedNum){
    this.viewer.selectByNum(selectedNum)
    const selectionStyles = this.getSelectionStyles(selectedNum)
    this.setState({
      selectedNum: selectedNum,
      selectionStyles: selectionStyles,
    })
    if(this.state.editing){
      this.updateRowAndColumnStyle()
      this.updatePointActor()
    }
    if(this.state.painting){
      this.updateCanvas()
    }
  }
  getSelectionStyles(selectedNum, viewerWidth, viewerHeight){
    //num 0 represents no selection, num 1 represents selection of 3d, num 2 represents selection of axial,
    //num 3 represents selection of coronal, num 4 represents selection of sagittal

    //[0] represents style of 3d, [1] represents style of axial,
    //[2] represents style of coronal, [3] represents style of sagittal
    if(typeof(selectedNum) == "undefined"){
      selectedNum = this.state.selectedNum
    }
    if(typeof(viewerWidth) == "undefined"){
      viewerWidth = this.state.viewerWidth
    }
    if(typeof(viewerHeight) == "undefined"){
      viewerHeight = this.state.viewerHeight
    }
    const selectionStyles = []
    if(selectedNum === -1){
      selectionStyles.push({position:"absolute", top:"0", left:"0", width:`${viewerWidth}px`, height:`${viewerHeight}px`})
      selectionStyles.push({position:"absolute", top:"0", left:"0", width:"0", height:"0"})
      selectionStyles.push({position:"absolute", top:"0", left:"0", width:"0", height:"0"})
      selectionStyles.push({position:"absolute", top:"0", left:"0", width:"0", height:"0"})
    }else if(selectedNum === 0){
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

  DownloadSegment(idx){
    const progressCallback = (progressEvent) => {
      const percent = Math.floor((100 * progressEvent.loaded) / progressEvent.total)
      const tmp_percent = this.state.percent
      tmp_percent[idx] = percent
      this.setState({ percent: tmp_percent})
    }
    const opacity = this.state.opacity[idx]
    const color = this.state.urls[idx].color
    const cur_url = this.state.urls[idx].url + '?caseId=' + this.state.caseId
    HttpDataAccessHelper.fetchBinary(cur_url, { progressCallback,} )
        .then((binary) => {
          const actor = this.createPipeline(binary,color,opacity)
          const tmp_segments = []
          this.state.segments.forEach((item, idx) =>{
            tmp_segments[idx] = item
          })
          tmp_segments[idx] = actor
          const listLoading = this.state.listLoading
          this.timer = setTimeout(() => {
            listLoading[idx] = false
          },2500)
          this.setState({
            segments: tmp_segments,
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

  function(key,callback,args){
    let isC = false
    function keyDown(e){
      if(e.ctrlKey){
        isC = true
      }
      if(e.keyCode === key.charCodeAt(0) && isC){
        callback.apply(this, args)
        return false
      }
    }
    function keyUp(e){

    }
  }

  handleFuncButton(idx, e){
    switch (idx){
      case 0:this.viewer.magnifyView(0)
        break
      case 1:this.viewer.reductView(0)
        break
      case 2:this.viewer.turnLeft()
        break
      case 3:this.viewer.turnRight()
        break
      case 4:this.selectByNum(0)
        break
      case 5:this.startEdit()
        break
      case 6:this.startPaint()
        break
      case 7:this.useEraser()
        break
      case 8:this.endEdit()
        break
      case 9:this.endPaint()
        break
      case 17:this.startPaint2()
        break
    }
  }
  startEdit(){
    this.endPaint()
    this.setState({
      editing: true,
    })
    this.updateRowAndColumnStyle()
    this.updatePointActor()
  }
  endEdit(){
    this.setState({
      editing: false
    })
    this.clearPointActor()
  }
  startPaint(){
    if(this.state.painting){
      this.setState({
        isEraser: false
      })
    }else{
      this.endEdit()
      this.setState({
        painting: true,
        isEraser: false
      })
      this.updateCanvas()
    }
  }
  useEraser(){
    this.setState({
      isEraser: true
    })
  }
  endPaint(){
    this.setState({
      painting: false
    })
    this.clearCanvas()
  }
  startPaint2(){
    const paintImageData = this.state.paintImageData
    const newImageData = this.createImageData()
    paintImageData.push(newImageData)
    this.setState({
      texting: true,
      paintImageData: paintImageData
    })
    // this.updateVolumeActor(0)
  }
  createImageData(){
    const newImageData = vtkImageData.newInstance()
    const pixelArray = new Uint16Array(512 * 512 * this.state.imageIds.length)
    const scalarArray = vtkDataArray.newInstance({
      name: 'Pixels',
      values: pixelArray
    })
    const metaData0 = this.state.metaData0
    const rowCosineVec = vec3.fromValues(...metaData0.rowCosines)
    const colCosineVec = vec3.fromValues(...metaData0.columnCosines)
    const scanAxisNormal = vec3.cross([], rowCosineVec, colCosineVec)
    const direction = [...rowCosineVec, ...colCosineVec, ...scanAxisNormal]
    // const {originXBorder, originYBorder, originZBorder} = this.state
    const xSpacing = metaData0.columnPixelSpacing
    const ySpacing = metaData0.rowPixelSpacing
    const zSpacing = 1.0
    newImageData.setDirection(direction)
    newImageData.setDimensions(512, 512, this.state.imageIds.length)
    newImageData.setSpacing(xSpacing, ySpacing, zSpacing)
    newImageData.getPointData().setScalars(scalarArray)

    return newImageData
  }
  resetOrigin(model){
    //for model parameter, 0 represents axial, 1 represents coronal, 2 represents sagittal
    if(model === 0){
      this.viewer.resetView(1)
    }else if(model === 1){
      this.viewer.resetView(2)
    }else if(model === 2){
      this.viewer.resetView(3)
    }
  }
  changeOrigin(model, e){
    //for model parameter, 0 represents axial, 1 represents coronal, 2 represents sagittal
    const origin = this.state.origin
    if(model === 0){
      origin[2] = e
    }else if(model === 1){
      origin[1] = e
    }else if(model === 2){
      origin[0] = e
    }
    this.setState({
      origin: origin
    })
  }
  afterChangeOrigin(e){
    imageData.modified()
    this.updateVolumeActor()
    if(this.state.editing){
      this.updateRowAndColumnStyle()
      this.updatePointActor()
    }
    if(this.state.painting){
      this.updateCanvas()
    }
  }
  handleListClick(idx) {
    let tmp_listsActive = this.state.listsActive
    if(tmp_listsActive[idx]){
      tmp_listsActive[idx] = false
    }else{
      for (let cur_idx in tmp_listsActive) {
        if (tmp_listsActive[cur_idx]) {
          tmp_listsActive[cur_idx] = false
        }
      }
      tmp_listsActive[idx] = true
    }

    this.setState({ listsActive: tmp_listsActive })
  }
  handleVisibleButton(idx, e) {
    e.stopPropagation()
    let tmp_segVisible = this.state.segVisible
    tmp_segVisible[idx] = !tmp_segVisible[idx]

    let tmp_segments = []
    this.state.segments.forEach((item, i) =>{
      tmp_segments[i] = item
    })
    if(!tmp_segVisible[idx]){
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
    e.stopPropagation()
    let tmp_listsOpacityChangeable = this.state.listsOpacityChangeable
    tmp_listsOpacityChangeable[idx] = !tmp_listsOpacityChangeable[idx]
    this.setState({ listsOpacityChangeable: tmp_listsOpacityChangeable })
  }
  changeOpacity(idx, e) {
    e.stopPropagation()
    let tmp_opacity = this.state.opacity
    tmp_opacity[idx] = e.target.value

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
    })
  }
  handleOptButton(e){
    e.stopPropagation()
    let tmp_optVisible = this.state.optVisible
    tmp_optVisible = !tmp_optVisible
    this.setState({
      optVisible: tmp_optVisible
    })
  }
  changeOptSelection(idx, e){
    e.stopPropagation()
    let tmp_optSelected = this.state.optSelected;
    tmp_optSelected[idx] = !tmp_optSelected[idx]
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
  getLoadingStyle(){
    const selectionStyles = this.state.selectionStyles
    const loadingStyle = {position:"absolute", top:0, left:0}
    if(selectionStyles[0]){
      loadingStyle.top = selectionStyles[0].top
      loadingStyle.left = selectionStyles[0].left
    }
    return loadingStyle
  }
  render() {
    const nameList = ['肺叶','支气管','结节']
    const welcome = '欢迎您，' + localStorage.realname
    let sgList = []
    let loadingList = []
    let newLoadingList = []
    let optList = []
    const {
      origin,
      originXBorder,
      originYBorder,
      originZBorder,
      segVisible,
      listsActive,
      listsOpacityChangeable,
      optVisible,
      optSelected,
      pointActors,
      percent,
      listLoading,
      segments,
      opacity,
      viewerWidth,
      viewerHeight,
      coronalActorVolumes,
      sagittalActorVolumes,
      axialActorVolumes,
      volumes,
      editing,
      painting,
      isEraser,
      selectedNum,
      selectionStyles,
      axialRowStyle,
      axialColumnStyle,
      coronalRowStyle,
      coronalColumnStyle,
      sagittalRowStyle,
      sagittalColumnStyle
    } = this.state;
    const canvasStyle = {width:`${viewerWidth}px`, height:`${viewerHeight}px`}
    const {canvasAStyle, canvasCStyle, canvasSStyle} = this.getCanvasStyle()
    const loadingStyle = this.getLoadingStyle()
    let noduleNum = 0;
    if (this.state.urls) {
      sgList = this.state.urls.map((inside, idx) => {
        if(inside.url.length > 0){
          if(optSelected[inside.class]){
            let sgName = inside.name
            let itemClass = classnames({
              'segment-list-item': true,
              'segment-list-item-active': listsActive[idx]
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
                      <div className='segment-list-content-block segment-list-content-tool' hidden={!listsActive[idx]}>
                        {/*content={segVisible[idx] === 1?'隐藏':'显示'}*/}
                        <Button inverted color='blue' className='segment-list-content-tool-block segment-list-content-tool-visible'
                                onClick={this.handleVisibleButton.bind(this, idx)} hidden={!segVisible[idx]}>隐藏</Button>
                        <Button inverted color='blue' className='segment-list-content-tool-block segment-list-content-tool-visible'
                                onClick={this.handleVisibleButton.bind(this, idx)} hidden={segVisible[idx]}>显示</Button>
                        <Button inverted color='blue' className='segment-list-content-tool-block segment-list-content-tool-opacity'
                                onClick={this.handleOpacityButton.bind(this, idx)} hidden={listsOpacityChangeable[idx]}>调整透明度</Button>
                        <Button inverted color='blue' className='segment-list-content-tool-block segment-list-content-tool-opacity'
                                onClick={this.handleOpacityButton.bind(this, idx)} hidden={!listsOpacityChangeable[idx]}>调整完毕</Button>
                      </div>
                      <div className='segment-list-content-block' className='segment-list-content-input' hidden={!(listsActive[idx] && listsOpacityChangeable[idx])}>
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
        if(loadingNum <= 5){
          if(inside.url.length > 0){
            if(percent[idx] === 100){
              loading = false
            }else{
              loading = true
            }
            loadingNum = loadingNum + 1
            let segmentName = inside.name
            return (
                <div key={idx} className="loading-list-item" hidden={!listLoading[idx]}>
                  <div  className="loading-container">
                    <Loader active inline className="loading-loader" size="medium" style={loading?{visibility: "visible"}:{visibility: "hidden"}}/>
                    <div className="loading-ticker" hidden={loading}/>
                    <div className="loading-ticker-hidden" hidden={loading}/>
                    {/*<div className="loading-circle" hidden={loading}/>*/}
                    {/*<div className="loading-circle-hidden" hidden={loading}/>*/}
                  </div>
                  <div className="loading-list-item-info">
                    {segmentName}
                  </div>
                </div>
            )
          }
        }
      })
    }
    optList = nameList.map((inside, idx) =>{
      return (
          <List.Item key = {idx}><Checkbox label={inside} checked={optSelected[idx]} onChange={this.changeOptSelection.bind(this, idx)}/></List.Item>
      )
    })

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
              <Button icon className='funcBtn' onClick={this.handleFuncButton.bind(this, 0)} title="放大"><Icon name='search plus' size='large'/></Button>
              <Button icon className='funcBtn' onClick={this.handleFuncButton.bind(this, 1)} title="缩小"><Icon name='search minus' size='large'/></Button>
              {/*"reply" "share" "arrow alternate circle up outline" "arrow alternate circle down outline"*/}
              {/*<Button icon className='funcBtn' onClick={this.handleFuncButton.bind(this, 2)}><Icon name='reply' size='large'/></Button>*/}
              {/*<Button icon className='funcBtn' onClick={this.handleFuncButton.bind(this, 3)}><Icon name='share' size='large'/></Button>*/}
              <Button icon className='funcBtn' onClick={this.handleFuncButton.bind(this, 2)} title="左旋"><Icon name='arrow alternate circle left outline' size='large'/></Button>
              <Button icon className='funcBtn' onClick={this.handleFuncButton.bind(this, 3)} title="右旋"><Icon name='arrow alternate circle right outline' size='large'/></Button>
              <Button icon className='funcBtn' onClick={this.handleFuncButton.bind(this, 4)} title="MPR"><Icon name='th large' size='large'/></Button>
            </Button.Group>
            <Button.Group style={{marginLeft:"10px"}} hidden={selectedNum === -1}>
              <Button icon className='funcBtn' hidden={editing} onClick={this.handleFuncButton.bind(this, 5)} title="选中"><Icon name='hand point down outline' size='large'/></Button>
              {/*<Button icon className='funcBtn' hidden={editing} onClick={this.handleFuncButton.bind(this, 17)} title="涂画"><Icon name='paint brush' size='large'/></Button>*/}
              <Button icon className='funcBtn' active={painting && !isEraser} onClick={this.handleFuncButton.bind(this, 6)} title="标记"><Icon name='pencil alternate' size='large'/></Button>
              <Button icon className='funcBtn' hidden={!painting} active={isEraser} onClick={this.handleFuncButton.bind(this, 7)} title="擦除"><Icon name='eraser' size='large'/></Button>
              <Button icon className='funcBtn' hidden={!editing} onClick={this.handleFuncButton.bind(this, 8)} title="停止选中"><Icon name='window close outline' size='large'/></Button>
              <Button icon className='funcBtn' hidden={!painting} onClick={this.handleFuncButton.bind(this, 9)} title="停止标记"><Icon name='window close outline' size='large'/></Button>
            </Button.Group>
            <Button.Group style={{marginLeft:"10px"}}>
              <Button className='funcBtn' onClick={this.goBack.bind(this)}>2D</Button>
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
              <StudyBrowserList handleClickScreen={this.handleClickScreen.bind(this)} caseId={this.state.caseId}/>
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
                  <div className="loading-list" style={loadingStyle}>
                    {newLoadingList}
                  </div>
                  <div className="segment-content-block segment-content-3d" style={selectionStyles[0]}/>
                  <div className="segment-content-block segment-content-axial" style={selectionStyles[1]} hidden={selectedNum === -1}>
                    <canvas id="canvas-axial" style={canvasAStyle} width={canvasAStyle.w} height={canvasAStyle.h}/>
                    <Icon className="segment-content-reset" name='repeat' size='large' onClick={this.resetOrigin.bind(this, 0)}/>
                    <Slider className="segment-content-origin" vertical reverse defaultValue={0} value={origin[2]} min={1} step={1} max={originZBorder}
                            onChange={this.changeOrigin.bind(this, 0)}
                            onAfterChange={this.afterChangeOrigin.bind(this)}/>
                    <div className="segment-content-row segment-content-row-axial" hidden={!editing} style={axialRowStyle}/>
                    <div className="segment-content-column segment-content-column-axial" hidden={!editing} style={axialColumnStyle}/>
                  </div>
                  <div className="segment-content-block segment-content-coronal" style={selectionStyles[2]} hidden={selectedNum === -1}>
                    <canvas id="canvas-coronal" style={canvasCStyle} width={canvasCStyle.w} height={canvasCStyle.h}/>
                    <Icon className="segment-content-reset" name='repeat' size='large' onClick={this.resetOrigin.bind(this, 0)}/>
                    <Slider className="segment-content-origin" vertical reverse defaultValue={0} value={origin[1]} min={1} step={1} max={originYBorder}
                            onChange={this.changeOrigin.bind(this, 1)}
                            onAfterChange={this.afterChangeOrigin.bind(this)}/>
                    <div className="segment-content-row segment-content-row-coronal" hidden={!editing} style={coronalRowStyle}/>
                    <div className="segment-content-column segment-content-column-coronal" hidden={!editing} style={coronalColumnStyle}/>
                  </div>
                  <div className="segment-content-block segment-content-sagittal" style={selectionStyles[3]} hidden={selectedNum === -1}>
                    <canvas id="canvas-sagittal" style={canvasSStyle} width={canvasSStyle.w} height={canvasSStyle.h}/>
                    <Icon className="segment-content-reset" name='repeat' size='large' onClick={this.resetOrigin.bind(this, 0)}/>
                    <Slider className="segment-content-origin" vertical reverse defaultValue={0} value={origin[0]} min={1} step={1} max={originXBorder}
                            onChange={this.changeOrigin.bind(this, 2)}
                            onAfterChange={this.afterChangeOrigin.bind(this)}/>
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
