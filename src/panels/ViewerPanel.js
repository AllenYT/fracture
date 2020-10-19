import React, {Component} from 'react'
import {useRef, createRef} from "react";
import CornerstoneElement from '../components/CornerstoneElement'
import * as cornerstone from "cornerstone-core"
import axios from 'axios'
import qs from 'qs'
import classnames from 'classnames'
import dicomParser from 'dicom-parser'
import SegView3D from '../components/SegView3D'
import vtkActor from "vtk.js/Sources/Rendering/Core/Actor"
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper'
import vtkColorMaps from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction'
import vtkXMLPolyDataReader from 'vtk.js/Sources/IO/XML/XMLPolyDataReader'
import HttpDataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper'

import { List, Grid, Accordion, Checkbox, Rating, Progress, Button, } from 'semantic-ui-react'
import PropTypes from 'prop-types'
import '../css/cornerstone.css'
import '../css/segview.css'
import vtkPiecewiseFunction from "vtk.js/Sources/Common/DataModel/PiecewiseFunction";
import StudyBrowserList from '../components/StudyBrowserList';
// import SegView3D from '../vtk-viewport/VTKViewport/View3D'
// import View3D from '../vtk-viewport/index'
// import createLabelPipeline from '../vtk-viewport/VTKViewport/createLabelPipeline'

const config = require('../config.json')
const dataConfig = config.data
const draftConfig = config.draft

const segmentNumDict = {
  "lung":0,
  "airway":1,
  "lobe":2,
  "nodule":3
}
const segmentNameDict = {
  "lung":"肺",
  "airway":"支气管",
  "lobe":"肺叶",
  "nodule":"结节"
}
const lobeDict = {
  "0" :"右肺上叶",
  "1":"右肺中叶",
  "2":"右肺下叶",
  "3":"左肺上叶",
  "4":"左肺下叶",
  // "nodule_1":""
}
const colorList=[
  {num:0,colorvalue1:197,colorvalue2:165,colorvalue3:145},
  {num:1,colorvalue1:182,colorvalue2:228,colorvalue3:255},
  {num:2,colorvalue1:128,colorvalue2:174,colorvalue3:128},
  {num:3,colorvalue1:178,colorvalue2:34,colorvalue3:34}
]
class ViewerPanel extends Component {
  constructor(props) {
    super(props)
    this.state = {
      caseId: window.location.pathname.split('/segView/')[1].split('/')[0],
      username: window.location.pathname.split('/')[3],
      urls: [],
      actors: [],
      segments: [],
      show: false,
      visibility:[],
      opacity:[],
      listsActiveIndex:[],
      listsChangeOpacity:[],
      percent:[],
    }
    this.nextPath = this.nextPath.bind(this)

  }

  createPipeline(binary,colorNum,opacity=0.5) {
    console.log("createPipeline")
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
    colorList.map((item) => {
      if(colorNum == item.num){
        actor.getProperty().setColor(item.colorvalue1/255,item.colorvalue2/255,item.colorvalue3/255)
      }}
    )
    mapper.setInputData(source);

    return actor;
  }




  componentDidMount(){
    console.log('call didMount', this.state.caseId)
    const token = localStorage.getItem('token')
    const headers = {
      'Authorization': 'Bearer '.concat(token) //add the fun of check
    }
    const dataParams = {
      caseId: this.state.caseId
    }

    axios.post(dataConfig.getMhaListForCaseId, qs.stringify(dataParams), { headers }).then(res => {
      // const urls = res.data
      // console.log(res.data)
      console.log('res_data', res.data)
      const urls = Object.keys(res.data).map(key => [key, res.data[key]])
      const tmp_urls = []
      urls.forEach(item => {
        let name = item[0]
        let num = segmentNumDict[name]
        let array = item[1]
        array.forEach((it, idx)=> {
          let segmentName;
          switch (num){
            case 0: segmentName = segmentNameDict[name] //肺
              break
            case 1: segmentName = segmentNameDict[name] //支气管
              break
            case 2: segmentName = lobeDict[idx] //肺叶
              break
            case 3: segmentName = segmentNameDict[name] + (idx+1) //结节
              break
            default: break
          }
          tmp_urls.push([segmentName, it, num])
        })
      })

      const tmp_segments = Object.keys(tmp_urls).map(key => null)
      const tmp_percent = Object.keys(tmp_urls).map(key => 0)
      const tmp_visibility = Object.keys(tmp_urls).map(key => 0)
      const tmp_opacity = Object.keys(tmp_urls).map(key => 0.5)
      const tmp_listsActiveIndex = Object.keys(tmp_urls).map(key => 0)
      const tmp_listsChangeOpacity = Object.keys(tmp_urls).map(key => 0)
      console.log('urls', urls)
      console.log('tmp_urls', tmp_urls)
      this.setState({
        urls: tmp_urls,
        segments: tmp_segments,
        percent: tmp_percent,
        visibility: tmp_visibility,
        opacity:tmp_opacity,
        listsActiveIndex:tmp_listsActiveIndex,
        listsChangeOpacity:tmp_listsChangeOpacity
      })

      tmp_urls.forEach((inside, idx) =>{
        this.DownloadSegment(idx, inside[2])
      })
      // this.DownloadSegment(6, tmp_urls[6][2])
    }).catch(error => {
      console.log(error)
    })


  }

  DownloadSegment(idx,colorNum){
    const progressCallback = (progressEvent) => {
      const percent = Math.floor((100 * progressEvent.loaded) / progressEvent.total)
      const tmp_percent = this.state.percent
      tmp_percent[idx] = percent
      this.setState({ percent: tmp_percent})
    }
    const cur_url = this.state.urls[idx][1] + '?caseId=' + this.state.caseId
    HttpDataAccessHelper.fetchBinary(cur_url, { progressCallback,} )
        .then((binary) => {
          const actor = this.createPipeline(binary,colorNum)
          let tmp_segments = this.state.segments
          tmp_segments[idx] = actor
          let tmp_visibility = this.state.visibility
          tmp_visibility[idx] = 1
          this.setState({
            segments: tmp_segments,
            visibility:tmp_visibility,
            // segments_list: this.state.segments_list.concat(actor),
          })
        })

  }
  nextPath(path) {
    this.props.history.push(path)
  } 
  handleClickScreen(e, href) {
    console.log('card', href)
    if (window.location.pathname.split('/segView/')[1].split('/')[0] !== href.split('/case/')[1].split('/')[0]) {
      this.setState({
        caseId: href.split('/case/')[1].split('/')[0],
        username: href.split('/')[3], show: false
      })
      window.location.href = '/segView/' + href.split('/case/')[1].split('/')[0]
    }
    // window.location.href=href
  }
  handleListClick(idx, e, data){
    console.log("handle click:",  data)
    let tmp_listsActiveIndex = this.state.listsActiveIndex
    for(let cur_idx in tmp_listsActiveIndex){
      if(tmp_listsActiveIndex[cur_idx] === 1){
        tmp_listsActiveIndex[cur_idx] = 0
      }
    }
    tmp_listsActiveIndex[idx] = 1
    this.setState({ listsActiveIndex: tmp_listsActiveIndex})

  }
  handleVisibleButton(idx, e){
    e.stopPropagation()
    let tmp_visibility = this.state.visibility
    tmp_visibility[idx] = tmp_visibility[idx] === 1?0:1
    this.setState({ visibility: tmp_visibility})
  }
  handleOpacityButton(idx, e){
    e.stopPropagation()
    let tmp_listsChangeOpacity = this.state.listsChangeOpacity
    tmp_listsChangeOpacity[idx] = tmp_listsChangeOpacity[idx] === 1?0:1
    this.setState({ listsChangeOpacity: tmp_listsChangeOpacity})

  }
  changeOpacity(idx,e){
    e.stopPropagation()
    let tmp_opacity = this.state.opacity
    tmp_opacity[idx] = e.target.value
    this.setState({
      opacity: tmp_opacity
    })
  }

  render() {
    let segmentList = "";
    let sgList = [];
    let loadingList = [];
    let showList = [];
    const {visibility, listsActiveIndex, listsChangeOpacity, percent, segments, opacity} = this.state
    // console.log(visibility,listsActiveIndex)
    let count = 0;
    if(this.state.urls){
      segmentList = this.state.urls.map((inside, idx) => {
        if(inside[1].length>0){
          // let checkBox = false
          let segmentName = inside[0]
          return (
              <Accordion key={idx}>
                <Accordion.Title>
                  <Grid>
                    <Grid.Row>
                      <Grid.Column width={2}>
                        <Checkbox defaultChecked={true} toggle />
                      </Grid.Column>
                      <Grid.Column width={3}>
                      {segmentName}
                    </Grid.Column>
                    </Grid.Row>
                  </Grid>
                </Accordion.Title>
              <Accordion.Content>
                  hello
                </Accordion.Content>
              </Accordion>
          )
        }
      })
      sgList = this.state.urls.map((inside, idx) => {
        if(inside[1].length > 0){
          let sgName = inside[0]
          let isActive = true
          let isChangeOpacity = true
          if(listsActiveIndex[idx] === 1){
            isActive = true
          }else{
            isActive = false
          }
          if(listsChangeOpacity[idx] === 1){
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
              <List.Item onClick={this.handleListClick.bind(this, idx)}>
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
                      {/*content={visibility[idx] === 1?'隐藏':'显示'}*/}
                      <Button inverted color='blue' className='segment-list-content-tool-block segment-list-content-tool-visible'
                              onClick={this.handleVisibleButton.bind(this, idx)} hidden={visibility[idx] === 0}>隐藏</Button>
                      <Button inverted color='blue' className='segment-list-content-tool-block segment-list-content-tool-visible'
                              onClick={this.handleVisibleButton.bind(this, idx)} hidden={visibility[idx] === 1}>显示</Button>
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
      })
      var loadingNum = 0;
      loadingList = this.state.urls.map((inside, idx) =>{
        if(loadingNum <= 4){
          if(inside[1].length > 0 && percent[idx] > 0 && percent[idx] < 100){
            loadingNum = loadingNum + 1
            let segmentName = inside[0]
            return (
                <div key = {idx} className='loading-list-progress-container'>
                  {segmentName}
                  <Progress className='loading-list-progress' percent={percent[idx]} progress='percent' color='green' active/>
                </div>
            )
          }
        }
      })

    }
    for(let cur_idx in segments){
      if(segments[cur_idx]){
        if(!visibility[cur_idx]){
          segments[cur_idx].getProperty().setOpacity(0)
        }else{
          segments[cur_idx].getProperty().setOpacity(opacity[cur_idx])
        }
      }

    }
    let segments_list = []
    for (let cur_idx in segments){
      segments_list.push(segments[cur_idx])
    }
    //console.log('render segments_list:', segments_list)
    return (
      <div id="viewer" >
        <Grid className='corner-header'>
          <Grid.Row>
            Function menu
          </Grid.Row>
        </Grid>
        <Grid celled className='corner-contnt'>
          <Grid.Row className='corner-row' columns={3}>
            <Grid.Column width={2}>
              <StudyBrowserList handleClickScreen={this.handleClickScreen.bind(this)} caseId={this.state.caseId}/>
            </Grid.Column>
            {/* 中间部分 */}
            <Grid.Column width={11}>
              {/* <div id="seg3d-canvas"
                ref={input => {
                  this.container.current = input
                }} style={style} /> */}
                <div className='segment-container' >
                  <div className='segment-canvas'>
                  <SegView3D id='3d-viewer' actors={segments_list}/>
                  </div>
                  <div className='loading-list' hidden={ loadingNum === 0}>
                  {loadingList}
                </div>
                </div>
            </Grid.Column >
            {/* 右边部分 */}
            <Grid.Column width={3}>

                <List className='segment-list' selection>
                  <List.Item><List.Content  className='segment-list-title'>组成列表</List.Content></List.Item>
                  {sgList}
                </List>
                  {/*<Accordion styled id="segment-accordion" fluid>*/}
                  {/*  {segmentList}*/}
                  {/*</Accordion>*/}
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </div>
    )
  }
}

export default ViewerPanel
