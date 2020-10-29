import React, { Component, useCallback } from "react";
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

const dictList = {
  0:{class:0, label:"lung",  name:"肺",color:{c1:197, c2:165, c3:145}},
  1:{class:2, label:"airway",name:"支气管",color:{c1:182, c2:228, c3:255}},
  2:{class:3, label:"nodule",name:"结节", color:{c1:178, c2:34, c3:34}},
  3:{class:1, label:"lobe_1",name:"右肺中叶",color:{c1:128, c2:174, c3:128}},
  4:{class:1, label:"lobe_2",name:"右肺上叶",color:{c1:241, c2:214, c3:145}},
  5:{class:1, label:"lobe_3",name:"右肺下叶",color:{c1:177, c2:122, c3:101}},
  6:{class:1, label:"lobe_4",name:"左肺上叶",color:{c1:111, c2:184, c3:210}},
  7:{class:1, label:"lobe_5",name:"左肺下叶",color:{c1:216, c2:101, c3:79}}
}

class ViewerPanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      windowWidth: window.screen.width,
      windowHeight: window.screen.height,
      caseId: window.location.pathname.split("/segView/")[1].split("/")[0],
      username: window.location.pathname.split("/")[3],
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
      funcOperating:false,
      funcOperator:[],
      loading: false,
      listLoading:[],
      percent: [],
      canvasLen: 850,
      canvasDis: 50
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

  componentDidMount() {
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

    this.fix3DViewWidth('segment-container')
    window.addEventListener('resize', this.fix3DViewWidth.bind(this,'segment-container'))
    // window.addEventListener('mousedown', this.mouseDown.bind(this))
    // window.addEventListener('mouseup', this.mouseUp.bind(this))
    // window.addEventListener('mousemove', this.mouseMove.bind(this))
    // window.addEventListener('mousewheel', this.mouseWheel.bind(this))
  }
  componentWillMount() {
    window.removeEventListener('resize', this.fix3DViewWidth.bind(this,'segment-container'))
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

  mouseDown(e){
    console.log("mouseDown:",e)
  }
  mouseUp(e){
    console.log("mouseUp:",e)
  }
  mouseMove(e){
    //console.log("mouseMove:",e)
  }

  mouseWheel(e){
    console.log("mouseWheel:",e)
  }

  mouseOut(e){
    console.log("mouseOut:",e) // div1 移出 div2
  }
  mouseLeave(e){
    console.log("mouseLeave:",e)
  }
  mouseEnter(e){
    console.log("mouseEnter:",e)
  }

  fix3DViewWidth(id){
    if(document.getElementById(id) !== null){
      const viewerWidth = document.getElementById(id).clientWidth
      const viewerHeight = document.getElementById(id).clientHeight
      if(viewerHeight > viewerWidth){
        this.setState({
          canvasLen:viewerWidth - 100,
          canvasDis:50
        })
      }else{
        let canvasDis = 50
        if(viewerWidth - viewerHeight > 100){
          canvasDis = (viewerWidth - viewerHeight)/2
        }
        this.setState({
          canvasLen:viewerHeight,
          canvasDis:canvasDis
        })
      }
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
  handleFuncButton(idx, e){
    let tmp_funcOperator = this.state.funcOperator
    tmp_funcOperator[idx] = 1;
    console.log('funcButton:', tmp_funcOperator)
    this.setState({
      funcOperating: true,
      funcOperator: tmp_funcOperator
    })

  }
  Seg3DCallBack = (msg) => {
    let tmp_funcOperator = this.state.funcOperator
    tmp_funcOperator[msg] = 0;
    this.setState({
      funcOperator: tmp_funcOperator
    })
    let count = 0;
    tmp_funcOperator.forEach(item => {
      count = count + item
    })
    if(count === 0){
      this.setState({
        funcOperating: false
      })
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
        funcOperating,
        funcOperator,
        canvasLen,
        canvasDis
    } = this.state;

    let canvasStyle ={width:`${canvasLen}px`, left:`${canvasDis}px`}
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
              <Button title='3D' className='funcBtn' onClick={this.goBack.bind(this)}>2D</Button>
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
                  <SegView3D id="3d-viewer" loading={loading} actors={segments} funcOperator={funcOperator} funcOperating={funcOperating} callback={this.Seg3DCallBack}/>
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
