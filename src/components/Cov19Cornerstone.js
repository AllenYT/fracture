import React, {Component} from "react"
import ReactHtmlParser from 'react-html-parser'
import dicomParser from 'dicom-parser'
import {render} from "react-dom"
import * as cornerstone from "cornerstone-core"
import * as cornerstoneMath from "cornerstone-math"
import * as cornerstoneTools from "cornerstone-tools"
import Hammer from "hammerjs"
import * as cornerstoneWadoImageLoader from "cornerstone-wado-image-loader"
import * as cornerstoneWebImageLoader from "cornerstone-web-image-loader"
import {withRouter} from 'react-router-dom'
import {  Grid, Table, Icon, Button, Accordion, Checkbox,Popup,Form, Header } from 'semantic-ui-react'
import '../css/cornerstone.css'
import qs from 'qs'
import axios from "axios"
import { Chart } from '@antv/g2'
// import { Chart } from '@antv/g2/lib/index-all'
import DataSet from '@antv/data-set'


cornerstoneTools.external.cornerstone = cornerstone
cornerstoneTools.external.cornerstoneMath = cornerstoneMath
// cornerstoneWebImageLoader.external.cornerstone = cornerstone
cornerstoneWadoImageLoader.external.cornerstone = cornerstone
cornerstoneWadoImageLoader.external.dicomParser = dicomParser
cornerstoneWebImageLoader.external.cornerstone = cornerstone
cornerstoneTools.external.Hammer = Hammer
const {Column, HeaderCell, Cell, Pagination} = Table;

// const divStyle = {
//     width: "512px",//768px
//     height: "512px",
//     position: "relative",
//     margin:"auto",
//     // display: "inline",
//     color: "white"
// }

// const divStyle1 = {
//     width: "768px",//768px
//     height: "768px",
//     position: "relative",
//     margin:"auto",
//     // display: "inline",
//     color: "white"
// }

const immersiveStyle = {
    width: "1280px",
    height: "1280px",
    position: "relative",
    // display: "inline",
    color: "white"
}

const bottomLeftStyle = {
    bottom: "5px",
    left: "5px",
    position: "absolute",
    color: "white"
}

const bottomRightStyle = {
    bottom: "5px",
    right: "5px",
    position: "absolute",
    color: "white"
}

const topLeftStyle = {
    top: "5px",
    left: "5px",
    position: "absolute",
    color: "white"
}

const modalBtnStyle = {
    width: "200px",
    display: "block",
    // marginTop:'10px',
    marginBottom: '20px',
    marginLeft: "auto",
    marginRight: "auto"
}

let users = []

const config = require('../config.json')
const draftConfig = config.draft
const recordConfig = config.record
const userConfig = config.user
const reviewConfig = config.review
const dataConfig=config.data

const selectStyle = {
    'background': 'none',
    'border': 'none',
    // 'fontFamily': 'SimHei',
    '-webkit-appearance':'none',
    'font-size':'medium',
    '-moz-appearance':'none',
    'apperance': 'none',
    'margin-left':'15px'
}

const histData= [
    { type: '良性', value: 40},
    { type: '恶性', value: 21},
  ];

class CornerstoneElement extends Component {
    constructor(props) {
        super(props)
        this.state = {
            caseId: props.caseId,
            stack: props.stack,
            viewport: cornerstone.getDefaultViewport(null, undefined),
            imageIds: props.stack.imageIds,
            currentIdx: 0,
            autoRefresh: false,
            boxes: [],
            jpgIds:props.stack.jpgIds,
            clicked: false,
            clickedArea: {},
            tmpBox: {},
            showNodules: true,
            immersive: false,
            // readonly: props.stack.readonly,
            activeIndex: -1,
            listsActiveIndex:-1,
            modelResults: '<p style="color:white;">暂无结果</p>',
            annoResults: '<p style="color:white;">暂无结果</p>',
            reviewResults: '<p style="color:white;">暂无结果</p>',
            modalOpenNew: false,
            modalOpenCur: false,
            draftStatus: props.stack.draftStatus,
            okayForReview: false,
            random: Math.random(),
            wwDefine: 500,
            wcDefine:500,
            // covidHist:props.stack.covidHist,
            // lungHist:props.stack.lungHist,
            histogram:props.stack.histogram,
            focus:true,
            meanValue:0,
            variance:0//控制病灶或肺窗显示

            // list:[],
            // malignancy: -1,
            // calcification: -1,
            // spiculation: -1,
            // lobulation:-1,
            // texture:-1,
            // totalPage: 1,//全部页面
            // activePage:'1',
            // // volumeStart:-1,
            // // volumeEnd:-1,
            // diameterStart:0,
            // diameterEnd:5
        }

        this.onImageRendered = this
            .onImageRendered
            .bind(this)
        this.onNewImage = this
            .onNewImage
            .bind(this)

        this.onRightClick = this
            .onRightClick
            .bind(this)

        this.onMouseDown = this
            .onMouseDown
            .bind(this)
        this.onMouseMove = this
            .onMouseMove
            .bind(this)
        this.onMouseUp = this
            .onMouseUp
            .bind(this)
        this.onMouseOut = this
            .onMouseOut
            .bind(this)

        this.drawBoxes = this
            .drawBoxes
            .bind(this)
        this.handleRangeChange = this
            .handleRangeChange
            .bind(this)
        this.refreshImage = this
            .refreshImage
            .bind(this)

        this.toPulmonary = this
            .toPulmonary
            .bind(this)
        this.toMedia = this
            .toMedia
            .bind(this)
        this.toBoneWindow = this
            .toBoneWindow
            .bind(this)
        this.toVentralWindow = this
            .toVentralWindow
            .bind(this)
        this.reset = this
            .reset
            .bind(this)

        this.findCurrentArea = this
            .findCurrentArea
            .bind(this)

        this.onKeydown = this
            .onKeydown
            .bind(this)

        // this.toPage = this
        //     .toPage
        //     .bind(this)
        this.highlightNodule = this
            .highlightNodule
            .bind(this)
        this.dehighlightNodule = this
            .dehighlightNodule
            .bind(this)
        this.toCurrentModel = this
            .toCurrentModel
            .bind(this)
        this.toNewModel = this
            .toNewModel
            .bind(this)
        this.toHidebox = this
            .toHidebox
            .bind(this)
        this.handleClick = this
            .handleClick
            .bind(this)
        this.temporaryStorage = this
            .temporaryStorage
            .bind(this)
        this.submit = this
            .submit
            .bind(this)
        this.deSubmit = this
            .deSubmit
            .bind(this)
        this.clearthenNew = this
            .clearthenNew
            .bind(this)
        this.clearthenFork = this
            .clearthenFork
            .bind(this)
        this.createBox = this
            .createBox
            .bind(this)
        this.delNodule = this
            .delNodule
            .bind(this)
        this.cache = this
            .cache
            .bind(this)
        this.closeModalNew = this
            .closeModalNew
            .bind(this)
        this.closeModalCur = this
            .closeModalCur
            .bind(this)
        this.toMyAnno = this
            .toMyAnno
            .bind(this)
        this.onSelectMal = this
            .onSelectMal
            .bind(this)
        this.onSelectPlace = this
            .onSelectPlace
            .bind(this)
        this.saveToDB = this
            .saveToDB
            .bind(this)
        this.checkHash = this
            .checkHash
            .bind(this)
        this.ZoomIn = this
            .ZoomIn
            .bind(this)
        this.ZoomOut = this
            .ZoomOut
            .bind(this)
        this.visualize = this
            .visualize
            .bind(this)
        this.focus=this
            .focus
            .bind(this)
    }

    focus(e){
        console.log(e.currentTarget.innerHTML)
        if(e.currentTarget.innerHTML==='病灶'){
            this.setState({focus:true})
        }
        else{
            this.setState({focus:false})
        }
    }
    visualize(){
        document.getElementById('diaGlitch').innerHTML=''
        let bins=[]
        let ns=[]
        if(this.state.covidHist===''){
            
        }
        else{
            if(this.state.focus){
                bins = this.state.histogram.covid_hist.content.bins.content
                ns=this.state.histogram.covid_hist.content.n.content
            }
            else {
                bins=this.state.histogram.lung_hist.content.bins.content
                ns=this.state.histogram.lung_hist.content.n.content
            }
        }
        console.log('bins',bins)
        console.log('ns',ns)
        var histogram = []
        var line=[]
        for (var i = 0; i < bins.length-1; i++) {
            var obj = {}
            obj.value = [bins[i],bins[i+1]]
            obj.count=ns[i]
            histogram.push(obj)
            
            var obj2={}
            obj2.value=bins[i]
            obj2.count=ns[i]
            line.push(obj2)
        }
        console.log('histogram',histogram)
        console.log('line',line)
        const ds = new DataSet();
        const dv = ds.createView().source(histogram)
        // const dv2=ds.createView().source(line)
        console.log('dv',dv)
        // dv.transform({
        //     type: 'bin.histogram',
        //     field: 'value',
        //     binWidth: 5000,
        //     as: ['value', 'count'],
        // })
        const chart = new Chart({
            container: 'diaGlitch',
            // forceFit: true,
            forceFit:true,
            height: 500,
            // width:100,
            // padding: [30,30,'auto',30]
        });
        // chart.tooltip({
        //     crosshairs: false,
        //     inPlot: false,
        //     position: 'top'
        //   })
        let view1=chart.view()
        // view1.axis(false)
        view1.source(dv, {
            value: {
            //   nice: true,
              minLimit: bins[0]-50,
              maxLimit:bins[bins.length-1]+50,
            //   tickCount:20
            },
            count: {
            //   max: 350000,
            //   tickInterval:50000
              tickCount:10
            }
          })
        // view1.source(dv)
        view1.interval().position('value*count')

        var view2 = chart.view()
        view2.axis(false)
        // view2.source(line)
        view2.source(line,{
            value: {
                // nice: true,
                minLimit: bins[0]-50,
              maxLimit:bins[bins.length-1]+50,
                // tickCount:10
              },
              count: {
                // max: 350000,
                tickCount:10
              }
        })
        view2.line().position('value*count').style({
            stroke: 'white',
            
            }).shape('smooth')
        
        chart.render()
    }

    handleClick = (e, titleProps) => {
        const {index} = titleProps
        const {activeIndex} = this.state
        const newIndex = activeIndex === index
            ? -1
            : index

        this.setState({activeIndex: newIndex})
    }

    handleSliderChange = (e, { name, value }) => {//窗宽
        this.setState({ [name]: value })
        let viewport = cornerstone.getViewport(this.element)
        viewport.voi.windowWidth = value
        cornerstone.setViewport(this.element, viewport)
        this.setState({viewport})
        // console.log("to media", viewport)
    }
    wcSlider =  (e, { name, value }) => {//窗位
        this.setState({ [name]: value })
        let viewport = cornerstone.getViewport(this.element)
        viewport.voi.windowCenter = value
        cornerstone.setViewport(this.element, viewport)
        this.setState({viewport})
    }
    // handleListClick = (e, titleProps) => {
    //     console.log('title',titleProps)
    //     const {index} = titleProps
    //     console.log('index',index)
    //     const {listsActiveIndex} = this.state
    //     const newIndex = listsActiveIndex === index
    //         ? -1
    //         : index

    //     this.setState({listsActiveIndex: newIndex})
    // }
    handleListClick = (currentIdx,index,e) => {//点击list-item
        console.log('id',e.target.id)
        // const {index} = titleProps
        // console.log('index',index)
        const id=e.target.id
        if(id!=='place-'+index && id!=='texSel-'+index && id!=='malSel-'+index && id!=='del-'+id.split("-")[1]){
            const {listsActiveIndex} = this.state
            const newIndex = listsActiveIndex === index
                ? -1
                : index
    
            this.setState({
                listsActiveIndex: newIndex,
                currentIdx: currentIdx-1,
                autoRefresh: true})
        }
        
    }

    cache() {//coffee button
        const dataParams = {
            caseId: this.state.caseId
        }
        Promise.all([
            axios.post(dataConfig.getDataListForCaseId, qs.stringify(dataParams)),
            axios.post(dataConfig.getDataListForCov19CaseId, qs.stringify(dataParams))
            
          ]).then(([dcmResponse, jpgResponse]) => {
            console.log('dcmResponse',dcmResponse.data)
            console.log('jpgResponse',jpgResponse.data)
            
            this.setState({imageIds: dcmResponse.data, jpgIds: jpgResponse.data})
          })
    }

    nextPath(path) {
        this
            .props
            .history
            .push(path, {activeItem: 'case'})
    }

    // toPage(text,e) {
    //     // let doms = document.getElementsByClassName('table-row') for (let i = 0; i <
    //     // doms.length; i ++) {     doms[i].style.backgroundColor = "white" }
    //     // const currentIdx = event.target.text
    //     const currentIdx=text
    //     // const idd = event.currentTarget.dataset.id console.log(idd)
    //     // document.getElementById(idd).style.backgroundColor = "yellow"
    //     this.setState({
    //         currentIdx: currentIdx - 1,
    //         autoRefresh: true
    //     })
    // }

    toHidebox(e) {
        // console.log('e',e.target.id)
        this.setState(({showNodules}) => ({
            showNodules: !showNodules,
        }))
        if(e===undefined){
            if(this.state.showNodules){
                this.refreshImage(false, this.state.jpgIds[this.state.currentIdx], this.state.currentIdx)
            }
            else{
                this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
            }
        }
        else{
            if(this.state.showNodules){
                this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
            }
            else{
                this.refreshImage(false, this.state.jpgIds[this.state.currentIdx], this.state.currentIdx)
            }
        }
        // this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
    }

    delNodule(event) {

    }

    highlightNodule(event) {
        
    }

    dehighlightNodule(event) {
        
    }

    closeModalNew() {
        this.setState({modalOpenNew: false})
    }

    closeModalCur() {
        this.setState({modalOpenCur: false})
    }

    onSelectMal = (event) => {
        const value = event.currentTarget.value
        const noduleId = event
            .currentTarget
            .id
            .split('-')[1]
        let boxes = this.state.boxes
        for (let i = 0; i < boxes.length; i++) {
            if (boxes[i].nodule_no === noduleId) {
                boxes[i].malignancy = parseInt(value)
            }
        }
        this.setState({
            boxes: boxes,
            random: Math.random()
        })
    }
    onSelectTex = (event) => {
        const value = event.currentTarget.value
        const noduleId = event
            .currentTarget
            .id
            .split('-')[1]
        let boxes = this.state.boxes
        for (let i = 0; i < boxes.length; i++) {
            if (boxes[i].nodule_no === noduleId) {
                boxes[i].texture = parseInt(value)
            }
        }
        this.setState({
            boxes: boxes,
            random: Math.random()
        })
    }

    onSelectPlace = (event) => {
        const value = event.currentTarget.value
        const noduleId = event
            .currentTarget
            .id
            .split('-')[1]
        let boxes = this.state.boxes
        for (let i = 0; i < boxes.length; i++) {
            if (boxes[i].nodule_no === noduleId) {
                boxes[i].place = value
            }
        }
        this.setState({
            boxes: boxes,
            random: Math.random()
        })
    }

    // getMal(val) {
    //     if (val === 1) {
    //         return "良性"
    //     } else if (val === 2) {
    //         return "恶性"
    //     } else 
    //         return "不存在的性质"
    // }

    toMyAnno() {
        window.location.href = '/case/' + this.state.caseId + '/' + localStorage.getItem('username')
    }

    saveToDB() {
        const token = localStorage.getItem('token')
        const headers = {
            'Authorization': 'Bearer '.concat(token)
        }
        const params = {
            caseId: this.state.caseId,
            newRectStr: JSON.stringify(this.state.boxes)
        }
        axios.post(draftConfig.updateRects, qs.stringify(params), {headers}).then(res => {
            if (res.data.status === 'okay') {
                const content = res.data.allDrafts
                this.setState({content: content})
            }
        }).catch(err => {
            console.log('err: ' + err)
        })
    }

    render() {
        // sessionStorage.clear()
        // console.log('boxes', this.state.boxes)
        const {showNodules, activeIndex, modalOpenNew, modalOpenCur,listsActiveIndex,wwDefine, wcDefine} = this.state
        let tableContent = ""
        let createDraftModal;
        let submitButton;
        let StartReviewButton;
        let calCount=0
       

        if (!this.state.immersive) { 
            return (
                <div id="cornerstone">
                    {/* <div class='corner-header'> */}
                        <Grid className='corner-header'>
                            <Grid.Row>
                                <Grid.Column  className='hucolumn' width={5}>
                                    <Grid>
                                        <Grid.Row columns='equal' >
                                            <Grid.Column>
                                                <Button
                                                    inverted
                                                    color='blue'
                                                    onClick={this.toPulmonary}
                                                    content='肺窗'
                                                    className='hubtn'
                                                    />
                                            </Grid.Column>
                                            <Grid.Column>
                                                <Button
                                                    inverted
                                                    color='blue'
                                                    onClick={this.toBoneWindow} //骨窗窗宽窗位函数
                                                    content='骨窗'
                                                    className='hubtn'
                                                    />
                                            </Grid.Column>
                                            <Grid.Column>
                                                <Button
                                                    inverted
                                                    color='blue'
                                                    onClick={this.toVentralWindow} //腹窗窗宽窗位函数
                                                    content='腹窗'
                                                    className='hubtn'
                                                    />
                                            </Grid.Column>
                                            <Grid.Column>
                                                <Button
                                                    inverted
                                                    color='blue'
                                                    onClick={this.toMedia}
                                                    content='纵隔窗'
                                                    className='hubtn'
                                                    />
                                            </Grid.Column>
                                            <Grid.Column>
                                                {/* <Button
                                                    inverted
                                                    color='blue'
                                                    onClick={this.toMedia}
                                                    className='hubtn'
                                                    >自定义</Button> */}
                                                    <Popup
                                                trigger={
                                                    <Button
                                                    inverted
                                                    color='blue'
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
                                                position='bottem center'
                                                id='defWindow'
                                            />
                                            </Grid.Column>
                                        </Grid.Row>
                                    </Grid>  
                                </Grid.Column>
                                <span id='line-left'></span>
                                <Grid.Column className='funcolumn' width={4}>
                                    <Grid>
                                        <Grid.Row columns='equal'>
                                            <Grid.Column> 
                                                <Button
                                                    inverted
                                                    color='blue'
                                                    icon
                                                    // style={{width:55,height:60,fontSize:14,fontSize:14}}
                                                    onClick={this.ZoomIn}
                                                    className='funcbtn'
                                                    ><Icon name='search plus'></Icon></Button>
                                            </Grid.Column>
                                            <Grid.Column> 
                                                <Button
                                                    inverted
                                                    color='blue'
                                                    icon
                                                    // style={{width:55,height:60,fontSize:14}}
                                                    onClick={this.ZoomOut}
                                                    className='funcbtn'
                                                    ><Icon name='search minus'></Icon></Button>
                                            </Grid.Column>
                                            <Grid.Column>
                                                <Button inverted color='blue' icon onClick={this.reset} className='funcbtn'><Icon name='repeat'></Icon></Button>
                                            </Grid.Column>
                                            <Grid.Column>
                                                <Button icon inverted color='blue' onClick={this.cache} className='funcbtn'><Icon id="cache-button" name='coffee'></Icon></Button>
                                            </Grid.Column>
                                        </Grid.Row>
                                    </Grid>    
                                </Grid.Column>
                                <span id='line-right'></span>
                                <Grid.Column className='draftColumn' width={4}>
                                    {/* {createDraftModal}  */}
                                    {/* <Button inverted color = 'blue' className='hubtn' onClick={this.toMyAnno}>我的标注</Button> */}
                                </Grid.Column>
                                <Accordion styled className='accordation' id='accord-left'>
                                    <Accordion.Title
                                        active={activeIndex === 0}
                                        index={0}
                                        onClick={this.handleClick}>
                                        <Icon name='dropdown'/>
                                        模型结果
                                    </Accordion.Title>
                                    <Accordion.Content active={activeIndex === 0}>
                                        
                                            {ReactHtmlParser(this.state.modelResults)}
                                        
                                    </Accordion.Content>
                                </Accordion>
                                
                                {/* </Grid.Column>
                                <Grid.Column> */}
                                <Accordion styled className='accordation' id='accord-mid'>
                                    <Accordion.Title
                                        active={activeIndex === 1}
                                        index={1}
                                        onClick={this.handleClick}>
                                        <Icon name='dropdown'/>
                                        标注结果
                                    </Accordion.Title>
                                    <Accordion.Content active={activeIndex === 1}>
                                        
                                            {ReactHtmlParser(this.state.annoResults)}
                                        
                                    </Accordion.Content>
                                </Accordion>
                                    
                                {/* </Grid.Column> */}
                                <Accordion styled className='accordation' id='accord-right'>
                                <Accordion.Title
                                    active={activeIndex === 2}
                                    index={2}
                                    onClick={this.handleClick}>
                                    <Icon name='dropdown'/>
                                    审核结果
                                </Accordion.Title>
                                <Accordion.Content active={activeIndex === 2}>
                                    
                                        {ReactHtmlParser(this.state.reviewResults)}
                                    
                                </Accordion.Content>
                            </Accordion>
                            </Grid.Row>   
                        </Grid>
                    {/* </div> */}
                    {/* <div class='corner-contnt'> */}
                        <Grid celled className='corner-contnt'>
                            <Grid.Row>
                                <Grid.Column width={2}>

                                </Grid.Column>
                                <Grid.Column width={8} textAlign='center'>
                                <div className='canvas-style'>

                                        <div
                                            id="origin-canvas"
                                            // style={divStyle}
                                            ref={input => {
                                            this.element = input
                                        }}>
                                            <canvas className="cornerstone-canvas" id="canvas"/>
                                            <div style={topLeftStyle}>Offset: {this.state.viewport.translation['x']}, {this.state.viewport.translation['y']}
                                            </div>
                                            <div style={bottomLeftStyle}>Zoom: {Math.round(this.state.viewport.scale * 100) / 100}</div>
                                            <div style={bottomRightStyle}>
                                                WW/WC: {Math.round(this.state.viewport.voi.windowWidth)}
                                                /{" "} {Math.round(this.state.viewport.voi.windowCenter)}
                                            </div>

                                        </div>
                                        {/* {canvas} */}

                                    </div>
                                <div className='canvas-style'>
                                    <input
                                        id="slice-slider"
                                        onChange={this.handleRangeChange}
                                        type="range"
                                        value={this.state.currentIdx + 1}
                                        name="volume"
                                        step="1"
                                        min="1"
                                        max={this.state.stack.imageIds.length}></input>
                                    <div id="button-container">
                                        <div id='showNodules'><Checkbox label='显示结节' checked={showNodules} onChange={this.toHidebox} id='checkbox'/></div>
                                        <p id="page-indicator">{this.state.currentIdx + 1}
                                            / {this.state.imageIds.length}</p>
                                        <a
                                            id="immersive-hover"
                                            onClick={() => {
                                            this.setState({immersive: true})
                                        }}>沉浸模式</a>
                                    </div>

                                </div>
                                </Grid.Column>
                                <Grid.Column width={6}> 
                                    <Grid>
                                        <Grid.Row>
                                            <Grid.Column>
                                                <Header inverted size='large'>影像学指标</Header>
                                            </Grid.Column>
                                        </Grid.Row>
                                        <Grid.Row>
                                            <Grid.Column width={4}>
                                                <Header inverted size='medium'>像素分布直方图</Header>
                                            </Grid.Column>
                                            <Grid.Column width={3}>
                                                <Button color='blue' inverted onClick={this.focus}>病灶</Button>
                                            </Grid.Column>
                                            <Grid.Column width={3}>
                                                <Button color='blue' inverted onClick={this.focus}>肺部</Button>
                                            </Grid.Column>
                                        </Grid.Row>
                                        <Grid.Row>
                                            <Grid.Column>
                                                <div id='diaGlitch'></div>
                                            </Grid.Column>
                                        </Grid.Row>
                                        <Grid.Row>
                                            <Grid.Column width={2}>
                                            </Grid.Column>
                                            <Grid.Column width={2}>
                                                <Header inverted size='medium'>均值</Header>
                                            </Grid.Column>
                                            <Grid.Column width={3}>
                                                <Header inverted size='medium'>
                                                    {this.state.focus===true?Math.floor(this.state.histogram.covid_hist.content.mean*100)/100
                                                    :Math.floor(this.state.histogram.lung_hist.content.mean)*100/100 }
                                                </Header>
                                            </Grid.Column>
                                            <Grid.Column width={2}>
                                            </Grid.Column>
                                            <Grid.Column width={2}>
                                                <Header inverted size='medium'>方差</Header>
                                            </Grid.Column>
                                            <Grid.Column width={3}>
                                                <Header inverted size='medium'>
                                                    {this.state.focus===true?Math.floor(this.state.histogram.covid_hist.content.var*100)/100
                                                    :Math.floor(this.state.histogram.lung_hist.content.var*100)/100}
                                                </Header>
                                            </Grid.Column>
                                        </Grid.Row>
                                        <Grid.Row>
                                            <Grid.Column width={2}>
                                            </Grid.Column>
                                            <Grid.Column width={2}>
                                                <Header inverted size='medium'>全肺</Header>
                                            </Grid.Column>
                                            <Grid.Column width={3}>
                                                <Header inverted size='medium'>病灶总占比</Header>
                                            </Grid.Column>
                                            <Grid.Column width={2}>
                                            </Grid.Column>
                                            
                                            <Grid.Column width={3}>
                                                <Header inverted size='medium'>
                                                    {Math.floor(this.state.histogram.covid_hist.content.proportion*10000)/100+'%'}
                                                </Header>
                                            </Grid.Column>
                                        </Grid.Row>
                                    </Grid>
                                </Grid.Column>
                            </Grid.Row>
                            
                        </Grid>
                    {/* </div> */}

                </div>
            )
        

        } else {
            return (
                <div
                    style={{
                    height: 1415 + 'px',
                    backgroundColor: '#03031b'
                }}>

                    <div id="immersive-panel">

                        <div className="immersive-header">
                            <a
                                onClick={() => {
                                this.setState({immersive: false})
                            }}
                                id='immersive-return'>返回普通视图</a>
                        </div>

                        <div
                            id="origin-canvas"
                            style={immersiveStyle}
                            ref={input => {
                            this.element = input
                        }}>
                            <canvas className="cornerstone-canvas" id="canvas"/>
                            <div style={topLeftStyle}>Offset: {this.state.viewport.translation['x']}, {this.state.viewport.translation['y']}
                            </div>
                            <div style={bottomLeftStyle}>Zoom: {Math.round(this.state.viewport.scale * 100) / 100}</div>
                            <div style={bottomRightStyle}>
                                WW/WC: {Math.round(this.state.viewport.voi.windowWidth)}
                                /{" "} {Math.round(this.state.viewport.voi.windowCenter)}
                            </div>

                        </div>

                    </div>

                    <div>
                        <input
                            className="invisible"
                            id="slice-slider"
                            onChange={this.handleRangeChange}
                            type="range"
                            value={this.state.currentIdx + 1}
                            name="volume"
                            step="1"
                            min="1"
                            max={this.state.stack.imageIds.length}></input>
                        <div id="immersive-button-container">
                            <p>{this.state.currentIdx + 1}
                                / {this.state.imageIds.length}</p>

                            <Button
                                color="blue"
                                onClick={this.toPulmonary}
                                style={{
                                marginRight: 30 + 'px'
                            }}>肺窗</Button>
                            <Button
                                color="blue"
                                onClick={this.toMedia}
                                style={{
                                marginRight: 30 + 'px'
                            }}>纵隔窗</Button>
                            <Button color="blue" onClick={this.reset}>重置</Button>

                        </div>

                    </div>

                </div>
            )
        }

    }

    drawBoxes(box) {
    }

    findCurrentArea(x, y) {
        
    }

    handleRangeChange(event) {
        // this.setState({currentIdx: event.target.value - 1, imageId:
        // this.state.imageIds[event.target.value - 1]})
        if(this.state.showNodules){
            this.refreshImage(false, this.state.jpgIds[event.target.value - 1], event.target.value - 1)
            // this.refreshImage(false, this.state.jpgIds[event.target.value - 1], event.target.value - 1)
        }
        else{
            this.refreshImage(false, this.state.imageIds[event.target.value - 1], event.target.value - 1)
        }
        
    }

    createBox(x1, x2, y1, y2, slice_idx, nodule_idx) {
        
    }

    onMouseMove(event) {
        
    }

    onKeydown(event) {
        console.log(event.which)
        if (document.getElementById("slice-slider") !== null) 
            document.getElementById("slice-slider").blur()
        if (event.which == 77) {
            // m, magnify to immersive mode
            this.setState({immersive: true})
        }

        if (event.which == 27) {
            // esc, back to normal
            this.setState({immersive: false})
        }
        if (event.which == 37 || event.which == 38) {
            event.preventDefault()
            let newCurrentIdx = this.state.currentIdx - 1
            if (newCurrentIdx >= 0) {
                // this.refreshImage(false, this.state.imageIds[newCurrentIdx], newCurrentIdx)
                if(this.state.showNodules){
                    this.refreshImage(false, this.state.jpgIds[newCurrentIdx], newCurrentIdx)
                }
                else{
                    this.refreshImage(false, this.state.imageIds[newCurrentIdx], newCurrentIdx)
                }
            }

        }
        if (event.which == 39 || event.which == 40) {
            event.preventDefault()
            let newCurrentIdx = this.state.currentIdx + 1
            if (newCurrentIdx < this.state.imageIds.length) {
                if(this.state.showNodules){
                    this.refreshImage(false, this.state.jpgIds[newCurrentIdx], newCurrentIdx)
                }
                else{
                    this.refreshImage(false, this.state.imageIds[newCurrentIdx], newCurrentIdx)
                }
                // this.refreshImage(false, this.state.imageIds[newCurrentIdx], newCurrentIdx)
            }

        }
        if (event.which == 72) {
            this.toHidebox() 
        }
    }

    onMouseDown(event) {
        
    }

    onMouseOut(event) {
        
    }

    onMouseUp(event) {
        
    }

    onRightClick(event) {
        event.preventDefault()
    }

    reset() {//重置
        let viewport = cornerstone.getViewport(this.element)
        viewport.translation = {
            x: 0,
            y: 0
        }
        viewport.scale = document.getElementById('canvas').width/512
        cornerstone.setViewport(this.element, viewport)
        this.setState({viewport})
        console.log("to pulmonary", viewport)
    }

    ZoomIn(){//放大
        let viewport = cornerstone.getViewport(this.element)
        viewport.translation = {
            x: 0,
            y: 0
        }
        if(viewport.scale <= 5){
            viewport.scale = 1 + viewport.scale
        }
        else{
            viewport.scale = 6
        }
        cornerstone.setViewport(this.element, viewport)
        this.setState({viewport})
        console.log("to ZoomIn", viewport)
    }

    ZoomOut(){//缩小
        let viewport = cornerstone.getViewport(this.element)
        viewport.translation = {
            x: 0,
            y: 0
        }
        if(viewport.scale >= 2){
            viewport.scale = viewport.scale - 1
        }
        else{
            viewport.scale = 1
        }
        cornerstone.setViewport(this.element, viewport)
        this.setState({viewport})
        console.log("to ZoomOut", viewport)
    }

    toPulmonary() {//肺窗
        let viewport = cornerstone.getViewport(this.element)
        viewport.voi.windowWidth = 1600
        viewport.voi.windowCenter = -600
        cornerstone.setViewport(this.element, viewport)
        this.setState({viewport})
        console.log("to pulmonary", viewport)
    }

    toMedia() {//纵隔窗
        let viewport = cornerstone.getViewport(this.element)
        viewport.voi.windowWidth = 500
        viewport.voi.windowCenter = 50
        cornerstone.setViewport(this.element, viewport)
        this.setState({viewport})
        console.log("to media", viewport)
    }

    toBoneWindow() {//骨窗
        let viewport = cornerstone.getViewport(this.element)
        viewport.voi.windowWidth = 1000
        viewport.voi.windowCenter = 300
        cornerstone.setViewport(this.element, viewport)
        this.setState({viewport})
        console.log("to media", viewport)
    }

    toVentralWindow() {//腹窗
        let viewport = cornerstone.getViewport(this.element)
        viewport.voi.windowWidth = 400
        viewport.voi.windowCenter = 40
        cornerstone.setViewport(this.element, viewport)
        this.setState({viewport})
        console.log("to media", viewport)
    }

    //标注新模型
    toNewModel() {
        let caseId = window
            .location
            .pathname
            .split('/case/')[1]
            .split('/')[0]
        // let currentModel = window.location.pathname.split('/')[3]
        let currentModel = "origin"
        // request, api, modifier
        const token = localStorage.getItem('token')
        const headers = {
            'Authorization': 'Bearer '.concat(token)
        }
        const params = {
            caseId: caseId,
            username: currentModel
        }
        console.log('params', qs.stringify(params))
        window
            .sessionStorage
            .setItem('currentModelId', "none")
        const userId = sessionStorage.getItem('userId')
        Promise.all([
            axios.get(userConfig.get_session, {headers}),
            axios.post(draftConfig.createNewDraft, qs.stringify(params), {headers})
        ]).then(([response, NewDraftRes]) => {
            console.log(response.data.status);
            console.log(NewDraftRes.data);
            if (response.data.status === 'okay') {
                console.log('re', response.data)
                console.log('NewDraftRes', NewDraftRes.data.status)
                if (NewDraftRes.data.status === 'okay') {
                    window.location.href = NewDraftRes.data.nextPath
                } else if (NewDraftRes.data.status === 'alreadyExisted') {
                    this.setState({modalOpenNew: true})
                }
            } else {
                alert("请先登录!")
                sessionStorage.setItem('location',window.location.pathname.split('/')[0]+
                '/'+window.location.pathname.split('/')[1]+'/'+window.location.pathname.split('/')[2]+'/')
                window.location.href = '/login'
            }
        }).catch((error) => {
            console.log("ERRRRROR", error);
        })
    }

    //标注此模型
    toCurrentModel() {
        let currentBox = this.state.boxes
        console.log(currentBox)
        let caseId = window
            .location
            .pathname
            .split('/case/')[1]
            .split('/')[0]
        let currentModel = window
            .location
            .pathname
            .split('/')[3]
        // request, api, modifier
        const token = localStorage.getItem('token')
        const headers = {
            'Authorization': 'Bearer '.concat(token)
        }
        const params = {
            caseId: caseId,
            username: currentModel
        }
        window
            .sessionStorage
            .setItem('currentModelId', currentModel)
        console.log('params', params)
        Promise.all([
            axios.get(userConfig.get_session, {headers}),
            axios.post(draftConfig.createNewDraft, qs.stringify(params), {headers})
        ]).then(([response, NewDraftRes]) => {
            console.log(response.data.status);
            console.log(NewDraftRes.data);
            if (response.data.status === 'okay') {
                console.log('re', response.data)
                console.log('NewDraftRes', NewDraftRes.data.status)
                if (NewDraftRes.data.status === 'okay') {
                    // this.nextPath(NewDraftRes.data.nextPath)
                    window.location.href = NewDraftRes.data.nextPath
                } else if (NewDraftRes.data.status === 'alreadyExisted') {
                    this.setState({modalOpenCur: true})
                }
            } else {
                alert("请先登录!")
                sessionStorage.setItem('location',window.location.pathname.split('/')[0]+
                '/'+window.location.pathname.split('/')[1]+'/'+window.location.pathname.split('/')[2]+'/')
                // sessionStorage.setItem('location',NewDraftRes.data.nextPath)
                window.location.href = '/login'
            }
        }).catch((error) => {
            console.log("ERRRRROR", error);
        })
    }

    //暂存结节
    temporaryStorage() {
        this.setState({
            random: Math.random()
        })
    }

    //提交结节
    submit() {
        const token = localStorage.getItem('token')
        console.log('token', token)
        const headers = {
            'Authorization': 'Bearer '.concat(token)
        }
        const params = {
            caseId: this.state.caseId
        }
        axios.post(draftConfig.submitDraft, qs.stringify(params), {headers}).then(res => {
            if (res.data === true) 
                this.setState({'draftStatus': '1'})
            else 
                alert("出现错误，请联系管理员！")
        }).catch(err => {
            console.log(err)
        })

    }

    deSubmit() {
        const token = localStorage.getItem('token')
        console.log('token', token)
        const headers = {
            'Authorization': 'Bearer '.concat(token)
        }
        const params = {
            caseId: this.state.caseId
        }
        axios.post(draftConfig.deSubmitDraft, qs.stringify(params), {headers}).then(res => {
            if (res.data === true) 
                this.setState({'draftStatus': '0'})
            else 
                alert("出现错误，请联系管理员！")
        }).catch(err => {
            console.log(err)
        })
    }

    //清空模型并新建
    clearthenNew() {
        const token = localStorage.getItem('token')
        console.log('token', token)
        const headers = {
            'Authorization': 'Bearer '.concat(token)
        }
        const params = {
            caseId: this.state.caseId
        }
        axios.post(draftConfig.removeDraft, qs.stringify(params), {headers}).then(res => {
            console.log(res.data)
            if (res.data === true) {
                this.toNewModel()
            } else {
                alert("出现错误,请联系管理员！")
            }
        }).catch(err => {
            console.log(err)
        })
    }

    async clearthenFork() {
        const token = localStorage.getItem('token')
        console.log('token', token)
        const headers = {
            'Authorization': 'Bearer '.concat(token)
        }
        const params = {
            caseId: this.state.caseId
        }
        axios.post(draftConfig.removeDraft, qs.stringify(params), {headers}).then(res => {
            console.log(res.data)
            if (res.data === true) {
                this.toCurrentModel()
            } else {
                alert("出现错误,请联系管理员！")
            }
        }).catch(err => {
            console.log(err)
        })
    }

    // onWindowResize() {     console.log("onWindowResize")
    // cornerstone.resize(this.element) }

    onImageRendered() {
        
    }

    onNewImage() {
        // console.log("onNewImage") const enabledElement =
        // cornerstone.getEnabledElement(this.element) this.setState({imageId:
        // enabledElement.image.imageId})
    }

    refreshImage(initial, imageId, newIdx) {
        

        this.setState({autoRefresh: false})

        if (!initial) {
            this.setState({currentIdx: newIdx})
        }
        // this.setState({currentIdx: newIdx})

        // const element = this.element

        const element = document.getElementById('origin-canvas')

        if (initial) {
            cornerstone.enable(element)
        } else {
            cornerstone.getEnabledElement(element)
        }
        console.log(imageId)
        cornerstone
            .loadAndCacheImage(imageId)
            .then(image => {

                if (initial) {
                    image.windowCenter = 100
                    image.windowWidth = 200
                    cornerstone.displayImage(element, image)
                }
                else{
                    if(this.state.showNodules){
                        cornerstone.displayImage(element, image)
                        let viewport = cornerstone.getViewport(this.element)
                        viewport.voi.windowWidth = 200
                        viewport.voi.windowCenter = 100
                        cornerstone.setViewport(this.element, viewport)
                        this.setState({viewport})
                    }
                    else{
                        cornerstone.displayImage(element, image)
                        let viewport = cornerstone.getViewport(this.element)
                        viewport.voi.windowWidth = 1600
                        viewport.voi.windowCenter = -600
                        cornerstone.setViewport(this.element, viewport)
                        this.setState({viewport})
                    }
                }
                
                // if(this.state.showNodules){
                //     const canvas=document.getElementById("canvas")
                //     let ctx = canvas.getContext("2d")
                //     let img=new Image()
                //     img.src=this.state.jpgIds[this.state.currentIdx]
                //     // img.crossOrigin='anonymous'
                //     img.onload=function(){
                //         ctx.drawImage(img,0,0)
                //     }
                // }
                
                cornerstoneTools
                    .mouseInput
                    .enable(element)
                cornerstoneTools
                    .mouseWheelInput
                    .enable(element)
                cornerstoneTools
                    .wwwc
                    .activate(element, 2) // ww/wc is the default tool for middle mouse button

                if (!this.state.immersive) {

                    cornerstoneTools
                        .pan
                        .activate(element, 4) // pan is the default tool for right mouse button
                    cornerstoneTools
                        .zoomWheel
                        .activate(element) // zoom is the default tool for middle mouse wheel

                    cornerstoneTools
                        .touchInput
                        .enable(element)
                    cornerstoneTools
                        .panTouchDrag
                        .activate(element)
                    cornerstoneTools
                        .zoomTouchPinch
                        .activate(element)
                }

                element.addEventListener("cornerstoneimagerendered", this.onImageRendered)
                // element.addEventListener("cornerstonenewimage", this.onNewImage)
                element.addEventListener("contextmenu", this.onRightClick)

                // if (!this.state.readonly) {
                //     element.addEventListener("mousedown", this.onMouseDown)
                //     element.addEventListener("mousemove", this.onMouseMove)
                //     element.addEventListener("mouseup", this.onMouseUp)
                //     element.addEventListener("mouseout", this.onMouseOut)
                // }

                document.addEventListener("keydown", this.onKeydown)

                // window.addEventListener("resize", this.onWindowResize) if (!initial) {
                // this.setState({currentIdx: newIdx}) }
            })
    }

    checkHash() {
        
    }

    componentWillMount() {
        this.checkHash()
    }

    componentDidMount() {
        this.visualize()
        if(this.state.showNodules){
            this.refreshImage(true, this.state.jpgIds[this.state.currentIdx], 0)
        }
        else{
            this.refreshImage(true, this.state.imageIds[this.state.currentIdx], 0)
        }
    }

    componentWillUnmount() {
        console.log('remove')
        const element = this.element
        element.removeEventListener("cornerstoneimagerendered", this.onImageRendered)

        // element.removeEventListener("cornerstonenewimage", this.onNewImage)

        // window.removeEventListener("resize", this.onWindowResize)
        document.removeEventListener("keydown", this.onKeydown)
        cornerstone.disable(element)
    }

    componentDidUpdate(prevProps, prevState) {
        // this.visualize()
        if (prevState.currentIdx !== this.state.currentIdx && this.state.autoRefresh === true) {
            if(this.state.showNodules){
                this.refreshImage(false, this.state.jpgIds[this.state.currentIdx], this.state.currentIdx)
            }
            else{
                this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
            }
        }
        if (prevState.showNodules !== this.state.showNodules && this.state.autoRefresh === true) {
            if(this.state.showNodules){
                this.refreshImage(false, this.state.jpgIds[this.state.currentIdx], this.state.currentIdx)
            }
            else{
                this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
            }
        }

        if (prevState.immersive !== this.state.immersive) {
            if(this.state.showNodules){
                this.refreshImage(true, this.state.jpgIds[this.state.currentIdx], this.state.currentIdx)
            }
            else{
                this.refreshImage(true, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
            }
        }

        if (prevState.random !== this.state.random) {
            console.log(this.state.boxes)
            // this.saveToDB()
        }
        if(prevState.focus!== this.state.focus){
            this.visualize()
        }
    }
}

export default withRouter(CornerstoneElement)
