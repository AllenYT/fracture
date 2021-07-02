import React, {Component} from "react"
import StudyBrowserList from '../components/StudyBrowserList'
// import {CineDialog} from 'react-viewerbase'
// import { WrappedStudyBrowser } from '../components/wrappedStudyBrowser'
import ReactHtmlParser from 'react-html-parser'
import dicomParser from 'dicom-parser'
import reactDom, {render} from "react-dom"
// import DndProcider from 'react-dnd'
// import {HTML5Backend} from 'react-dnd-html5-backend'
// import { DragDropContextProvider } from 'react-dnd'
// import { HTML5Backend } from 'react-dnd-html5-backend'
import * as cornerstone from "cornerstone-core"
import * as cornerstoneMath from "cornerstone-math"
import * as cornerstoneTools from "cornerstone-tools"
import Hammer from "hammerjs"
import * as cornerstoneWadoImageLoader from "cornerstone-wado-image-loader"
import {withRouter} from 'react-router-dom'
import {Grid, Icon, Button, Accordion, Modal, Dropdown, Tab, Image, Menu, Label} from 'semantic-ui-react'
import '../css/cornerstone.css'
import qs from 'qs'
import axios from "axios"
import { Slider, Select, Space, Checkbox, Tabs} from "antd"
// import { Slider, RangeSlider } from 'rsuite'
import MiniReport from './MiniReport'
import MessagePanel from '../panels/MessagePanel'
import src1 from '../images/scu-logo.jpg'
import $ from 'jquery'


import echarts from 'echarts/lib/echarts';
import  'echarts/lib/chart/bar';
import 'echarts/lib/component/tooltip';
import 'echarts/lib/component/title';
import 'echarts/lib/component/toolbox'
import { Content } from "antd/lib/layout/layout"
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

const globalImageIdSpecificToolStateManager = cornerstoneTools.newImageIdSpecificToolStateManager();
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
let toolROITypes = ['EllipticalRoi','Bidirectional']
const cacheSize = 5
let playTimer = undefined
let imageLoadTimer = undefined

const immersiveStyle = {
    width: "1280px",
    height: "1280px",
    position: "relative",
    // display: "inline",
    color: "white"
}

let bottomLeftStyle = {
    bottom: "5px",
    left: "-95px",
    position: "absolute",
    color: "white"
}

let bottomRightStyle = {
    bottom: "5px",
    right: "-95px",
    position: "absolute",
    color: "white"
}

let topLeftStyle = {
    top: "5px",
    // left: "-95px", // 5px
    position: "absolute",
    color: "white"
}

let topRightStyle = {
    top: "5px",
    right: "5px", //5px
    position: "absolute",
    color: "white"
}

let modalBtnStyle = {
    width: "200px",
    display: "block",
    // marginTop:'10px',
    marginBottom: '20px',
    marginLeft: "auto",
    marginRight: "auto"
}



let users = []

const config = JSON.parse(localStorage.getItem('config'))
const draftConfig = config.draft
const recordConfig = config.record
const userConfig = config.user
const reviewConfig = config.review

const selectStyle = {
    'background': 'none',
    'border': 'none',
    // 'fontFamily': 'SimHei',
    'WebkitAppearance':'none',
    // 'fontSize':'medium',
    'MozAppearance':'none',
    'apperance': 'none',
}

const lowRiskStyle = {
    'background': 'none',
    'border': 'none',
    // 'fontFamily': 'SimHei',
    'WebkitAppearance':'none',
    'fontSize':'small',
    'MozAppearance':'none',
    'apperance': 'none',
    'color':'green'
}

const highRiskStyle = {
    'background': 'none',
    'border': 'none',
    // 'fontFamily': 'SimHei',
    'WebkitAppearance':'none',
    'fontSize':'small',
    'MozAppearance':'none',
    'apperance': 'none',
    'color':'#CC3300'
}
const middleRiskStyle = {
    'background': 'none',
    'border': 'none',
    // 'fontFamily': 'SimHei',
    'WebkitAppearance':'none',
    'fontSize':'small',
    'MozAppearance':'none',
    'apperance': 'none',
    'color':'#fcaf17'
}

const toolstrigger = (
    <span>
        <Icon name='user' />
    </span>
)

const {Option} = Select
    

class CornerstoneElement extends Component {
    constructor(props) {
        super(props)
        this.state = {
            caseId: props.caseId,
            username:props.username,
            stack: props.stack,
            viewport: cornerstone.getDefaultViewport(null, undefined),
            imageIds: props.stack.imageIds===""?[]:props.stack.imageIds,
            currentIdx: 0,//当前所在切片号
            autoRefresh: false,
            boxes: props.stack.boxes===""?[]:props.stack.boxes,
            clicked: false,
            clickedArea: {},
            tmpCoord:{},
            tmpBox: {},
            showNodules: true,
            immersive: false,
            readonly: props.stack.readonly,
            // activeIndex: -1,//右上方results活动item
            listsActiveIndex:-1,//右方list活动item
            dropDownOpen:-1,
            
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
            dicomTag:props.stack.dicomTag,
            showInfo:true,
            newAnno:true,
            isbidirectionnal:false,
            measureStateList:[],
            maskStateList:[],
            toolState:'',
            leftButtonTools:1, //0-标注，1-切片切换，2-wwwc,3-bidirection,4-length
            mouseCurPos:{},
            mouseClickPos:{},
            mousePrePos:{},
            leftBtnSpeed:0,
            prePosition:0,
            curPosition:0,
            doubleClick:false,
            studyList:props.studyList,
            menuTools:'',
            isPlaying: false,
            windowWidth:document.body.clientWidth,
            windowHeight:document.body.clientHeight,
            slideSpan:0,
            preListActiveIdx:-1,
            currentImage: null,
            // selectTiny:0,
            // selectTexture:-1,
            // selectBoxesMapIndex:[],
            // selectBoxes:props.stack.boxes===""?[]:props.stack.boxes,
            lengthBox:[],
            firstlayout:0
        }
        this.nextPath = this
            .nextPath
            .bind(this)
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
        this.findMeasureArea = this
            .findMeasureArea
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
        // this.handleClick = this
        //     .handleClick
        //     .bind(this)
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
        this.playAnimation = this
            .playAnimation
            .bind(this)
        this.pauseAnimation = this
            .pauseAnimation
            .bind(this)
        this.Animation = this
            .Animation
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
        this.imagesFilp = this
            .imagesFilp
            .bind(this)
        this.visualize = this
            .visualize
            .bind(this)
        this.handleLogout = this
            .handleLogout
            .bind(this);
        this.handleLogin = this
            .handleLogin
            .bind(this)
        this.toHideInfo = this
            .toHideInfo
            .bind(this)
        this.disableAllTools = this
            .disableAllTools
            .bind(this)
        this.bidirectionalMeasure = this
            .bidirectionalMeasure
            .bind(this)
        this.lengthMeasure = this
            .lengthMeasure
            .bind(this)
        this.featureAnalysis = this
            .featureAnalysis
            .bind(this)
        this.eraseLabel = this
            .eraseLabel
            .bind(this)
        this.startAnnos = this
            .startAnnos
            .bind(this)
        this.saveTest = this
            .saveTest
            .bind(this)
        this.slide = this
            .slide
            .bind(this)
        this.wwwcCustom = this
            .wwwcCustom
            .bind(this)
        this.onWheel = this
            .onWheel
            .bind(this)
        this.wheelHandle = this
            .wheelHandle
            .bind(this)
        this.onMouseOver = this
            .onMouseOver
            .bind(this)
        this.cacheImage = this
            .cacheImage
            .bind(this)
        this.cache = this
            .cache
            .bind(this)
        this.keyDownListSwitch = this
            .keyDownListSwitch
            .bind(this)
        this.drawBidirection = this
            .drawBidirection
            .bind(this)
        this.segmentsIntr = this
            .segmentsIntr
            .bind(this)
        this.invertHandles = this
            .invertHandles
            .bind(this)
        this.pixeldataSort = this
            .pixeldataSort
            .bind(this)
        this.closeVisualContent = this
            .closeVisualContent
            .bind(this)
        // this.drawTmpBox = this.drawTmpBox.bind(this)
        this.toHideMeasures = this
            .toHideMeasures
            .bind(this)
        this.toHideMask = this
            .toHideMask
            .bind(this)
        this.eraseMeasures = this
            .eraseMeasures
            .bind(this)
        // this.drawTmpBox = this.drawTmpBox.bind(this)
        this.toSegView = this
            .toSegView
            .bind(this)
        this.noduleHist = this
            .noduleHist
            .bind(this)
        this.drawLength = this
            .drawLength
            .bind(this)
        this.createLength = this
            .createLength
            .bind(this)
        this.firstLayout = this
            .firstLayout
            .bind(this)
        // this.showMask = this
        //     .showMask
        //     .bind(this)
    }

    // handleClick = (e, titleProps) => {
    //     const {index} = titleProps
    //     const {activeIndex} = this.state
    //     const newIndex = activeIndex === index
    //         ? -1
    //         : index

    //     this.setState({activeIndex: newIndex})
    // }

    handleSliderChange = (e, { name, value }) => {//窗宽
        this.setState({ [name]: value })
        let viewport = cornerstone.getViewport(this.element)
        viewport.voi.windowWidth = value
        cornerstone.setViewport(this.element, viewport)
        this.setState({viewport})
        console.log("to media", viewport)
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

    //echarts
    visualize(hist_data,idx){
        const visId = 'visual-' + idx
        const btnId = 'closeButton-' + idx
        // document.getElementById(visId).innerHTML=''
        console.log('visualize',idx)
        var dom = document.getElementById(visId);
        document.getElementById('closeVisualContent').style.display =''
        dom.style.display = ''
        dom.style.height = 200 * this.state.windowHeight / 1000 +'px'
        if (this.state.windowWidth > this.state.windowHeight){
            dom.style.width = 870 * this.state.windowWidth / 1800 +'px'
        }
        else{
            dom.style.width = 1380 * this.state.windowWidth / 1800 +'px'
        }
        let bins = hist_data.bins
        let ns = hist_data.n
        if(echarts.getInstanceByDom(dom)){
            echarts.dispose(dom)
        }
        var myChart = echarts.init(dom)
        var minValue = bins[0] - 50
        var maxValue = bins[bins.length - 1] + 50
        console.log(bins,bins[0] - 50,bins[bins.length - 1] + 50)
        var histogram = []
        var line=[]
        for (var i = 0; i < bins.length-1; i++) {
            var obj = {}
            
            obj.value = [bins[i],bins[i+1]]
            obj.count=ns[i]
            histogram.push(obj)
        }
        myChart.setOption({
        color: ['#00FFFF'],
        lazyUpdate: false,
        tooltip: {
            trigger: 'axis',
            axisPointer: {            // 坐标轴指示器，坐标轴触发有效
                type: 'shadow'        // 默认为直线，可选为：'line' | 'shadow' 
            },
        },
        toolbox: {
            feature: {
                saveAsImage: {}
            }
        },
        grid: {
            // left: '15%',
            // right: '4%',
            bottom: '3%',
            top: '10%',
            containLabel: true
        },
        xAxis: [
            {
                type: 'category',
                scale:'true',
                data: bins,
                // min: minValue,
                // max: maxValue,
                axisTick: {
                    alignWithLabel: true
                },
                axisLabel: {
                    color: "rgb(191,192,195)"
                },
            }
        ],
        yAxis: [
            {
                type: 'value',
                
                axisLabel: {
                    color: "rgb(191,192,195)"
                },
                minInterval: 1
            }
        ],
        series: [
            {
                name: 'count',
                type: 'bar',
                barWidth: '60%',
                data: ns,
            }
        ]
});
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
    handleDropdownClick= (currentIdx,index,e) => {
        console.log('dropdown',e.target,currentIdx,index)
        if(index===this.state.listsActiveIndex){
            this.setState({
                autoRefresh: true,
                doubleClick:false,
                dropDownOpen:index
            })
        }
        else{
            const {listsActiveIndex} = this.state
            const newIndex = listsActiveIndex === index
                ? -1
                : index
            
            this.setState({
                listsActiveIndex: newIndex,
                currentIdx: currentIdx-1,
                autoRefresh: true,
                doubleClick:false,
                dropDownOpen:-1
            })   
        }
    }

    handleListClick = (currentIdx,index,e) => {//点击list-item
        console.log('id',e.target.id)
        // let style = $("<style>", {type:"text/css"}).appendTo("head");
        // style.text('#slice-slider::-webkit-slider-runnable-track{background:linear-gradient(90deg,#0033FF 0%,#000033 '+ 
        // (currentIdx -1)*100/this.state.imageIds.length+'%)}');
        // const {index} = titleProps
        // console.log('index',index)
        const id=e.target.id
        // if(id!=='place-'+index && id!=='texSel-'+index && id!=='malSel-'+index && id!=='del-'+id.split("-")[1]){
        if(id!=='del-'+id.split("-")[1]){
            const {listsActiveIndex} = this.state
            const newIndex = listsActiveIndex === index
                ? -1
                : index
            
            this.setState({
                listsActiveIndex: newIndex,
                currentIdx: currentIdx-1,
                autoRefresh: true,
                doubleClick:false,
                dropDownOpen:-1
            })
            
        }
    }

    keyDownListSwitch(ActiveIdx){
        // const boxes = this.state.selectBoxes
        const boxes = this.state.boxes
        let currentIdx = parseInt(boxes[ActiveIdx].nodule_no)
        let sliceIdx = boxes[ActiveIdx].slice_idx
        if(this.state.preListActiveIdx !== -1){
            currentIdx = parseInt(boxes[this.state.preListActiveIdx].nodule_no)
            sliceIdx  = boxes[this.state.preListActiveIdx].slice_idx
        }
        console.log('cur',currentIdx,sliceIdx)
        this.setState({
            listsActiveIndex: currentIdx,
            currentIdx: sliceIdx,
            autoRefresh: true,
            doubleClick:false,
            preListActiveIdx:-1,
        })
    }

    playAnimation() {//coffee button
        this.setState(({isPlaying}) => ({
            isPlaying: !isPlaying
        }))
        playTimer = setInterval(() => this.Animation(), 1000)
    }

    pauseAnimation(){
        this.setState(({isPlaying}) => ({
            isPlaying: !isPlaying
        }))
        clearInterval(playTimer)
    }

    Animation(){
        const imageIdsLength  = this.state.imageIds.length
        var curIdx = this.state.currentIdx
        if(curIdx < imageIdsLength - 1){
            this.refreshImage(false, this.state.imageIds[curIdx+1], curIdx+1)
        }
        else{
            this.refreshImage(false, this.state.imageIds[0], 0)
        }  
    }



    // nextPath(path) {
    //     this
    //         .props
    //         .history
    //         .push(path, {activeItem: 'case'})
    // }

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

    toHidebox() {
        this.setState(({showNodules}) => ({
            showNodules: !showNodules
        }))
        if(this.state.showNodules){
            document.getElementById('showNodule').style.display='none'
            document.getElementById('hideNodule').style.display=''
        }
        else{
            document.getElementById('showNodule').style.display=''
            document.getElementById('hideNodule').style.display='none'
        }
        this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
    }

    toHideInfo(){
        this.setState(({showInfo}) => ({
            showInfo: !showInfo
        }))
        if(this.state.showInfo){
            document.getElementById('showInfo').style.display='none'
            document.getElementById('hideInfo').style.display=''
            document.getElementById('dicomTag').style.display='none'
        }
        else{
            document.getElementById('showInfo').style.display=''
            document.getElementById('hideInfo').style.display='none'
            document.getElementById('dicomTag').style.display=''
        }
    }

    toHideMeasures(idx,e){
        const measureStateList = this.state.measureStateList
        const measureStat = measureStateList[idx]
        measureStateList[idx] = !measureStat
        // measureStateList[idx]
        this.setState({measureStateList: measureStateList})
        console.log('measureStateList',this.state.measureStateList)
        this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
    }

    toHideMask(idx,e){
        const maskStateList = this.state.maskStateList
        const maskStat = maskStateList[idx]
        maskStateList[idx] = !maskStat
        this.setState({maskStateList: maskStateList})
        console.log('maskStateList',this.state.maskStateList)
        this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
    }

    delNodule(event) {
        const delNoduleId = event.target.id
        const nodule_no = delNoduleId.split("-")[1]
        // let selectBoxes = this.state.selectBoxes
        // let measureStateList = this.state.measureStateList
        // for (var i = 0; i < selectBoxes.length; i++) {
        //     if (selectBoxes[i].nodule_no === nodule_no) {
        //         // selectBoxes.splice(i, 1)
        //         selectBoxes[i]="delete"
        //     }
        // }
        let boxes = this.state.boxes
        let measureStateList = this.state.measureStateList
        // for (var i = 0; i < boxes.length; i++) {
        //     if (boxes[i].nodule_no === nodule_no) {
        //         boxes.splice(i, 1)
        //         boxes[i]="delete"
        //     }
        // }
        boxes.splice(nodule_no, 1)
        measureStateList.splice(nodule_no,1)
        for (var i = nodule_no; i < boxes.length; i++) {
            boxes[i].nodule_no=(parseInt(boxes[i].nodule_no)-1).toString()
            
        }
        this.setState({
            boxes: boxes,
            measureStateList: measureStateList
            // random: Math.random()
        })
        this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)

    }

    highlightNodule(event) {
        console.log('in', event.target.textContent)
        // let boxes = this.state.selectBoxes
        let boxes = this.state.boxes
        for (var i = 0; i < boxes.length; i++) {
            if (parseInt(boxes[i].nodule_no) === (event.target.textContent - 1)) {
                boxes[i].highlight = true
            }
        }
        // this.setState({selectBoxes: boxes})
        this.setState({boxes: boxes})
        this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
    }

    dehighlightNodule(event) {
        console.log('out', event.target.textContent)
        // let boxes = this.state.selectBoxes
        let boxes = this.state.boxes
        for (var i = 0; i < boxes.length; i++) {
            if (parseInt(boxes[i].nodule_no) === (event.target.textContent - 1)) {
                boxes[i].highlight = false
            }
        }
        // console.log(this.state.boxes, boxes)
        // this.setState({selectBoxes: boxes})
        this.setState({boxes: boxes})
        this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
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
        let boxes = this.state.selectBoxes
        for (let i = 0; i < boxes.length; i++) {
            if (boxes[i].nodule_no === noduleId) {
                boxes[i].malignancy = parseInt(value)
            }
        }
        console.log('boxes',boxes,noduleId)
        this.setState({
            // selectBoxes: boxes,
            boxes:boxes
            // random: Math.random()
        })
    }
    onSelectTex = (event) => {
        const value = event.currentTarget.value
        const noduleId = event
            .currentTarget
            .id
            .split('-')[1]
        // let boxes = this.state.selectBoxes
        let boxes = this.state.boxes
        for (let i = 0; i < boxes.length; i++) {
            if (boxes[i].nodule_no === noduleId) {
                boxes[i].texture = parseInt(value)
            }
        }
        this.setState({
            selectBoxes: boxes,
            boxes: boxes,
            // random: Math.random()
        })
    }

    onSelectPlace = (event) => {
        let places={0:'选择位置',1:'右肺中叶',2:'右肺上叶',3:'右肺下叶',4:'左肺上叶',5:'左肺下叶'}
        let segments={
            'S1':'右肺上叶-尖段','S2':'右肺上叶-后段','S3':'右肺上叶-前段','S4':'右肺中叶-外侧段','S5':'右肺中叶-内侧段',
            'S6':'右肺下叶-背段','S7':'右肺下叶-内基底段','S8':'右肺下叶-前基底段','S9':'右肺下叶-外基底段','S10':'右肺下叶-后基底段',
            'S11':'左肺上叶-尖后段','S12':'左肺上叶-前段','S13':'左肺上叶-上舌段','S14':'左肺上叶-下舌段','S15':'左肺下叶-背段',
            'S16':'左肺下叶-内前基底段','S17':'左肺下叶-外基底段','S18':'左肺下叶-后基底段'}
        const segment = event.currentTarget.innerHTML
        const place = event.currentTarget.id.split('-')[2]
        const noduleId = event.currentTarget.id.split('-')[1]
        console.log('id',segment,place,noduleId)
        // let boxes = this.state.selectBoxes
        let boxes = this.state.boxes
        // console.log('onselectplace',boxes)
        for (let i = 0; i < boxes.length; i++) {
            // console.log('onselectplace',boxes[i].nodule_no,boxes[i],noduleId,boxes[i].nodule_no===noduleId)
            if (boxes[i].nodule_no === noduleId) {
                for(let item in places){
                    if(places[item]===place){
                        boxes[i].place = item
                        console.log('place',place)
                    }
                }
                if(segment==='无法定位'){
                    boxes[i].segment=''
                    console.log('segment','')
                }
                else{
                    for(let item in segments){
                        if(segments[item]===place+'-'+segment){
                            boxes[i].segment=item
                            console.log('segment',segment)
                        }
                    }
                }
            }
        }
        this.setState({
            // selectBoxes: boxes,
            boxes: boxes,
            // random: Math.random()
        })
    }

    representChange = (e,{value,name}) =>{
        let represents={'lobulation':'分叶','spiculation':'毛刺','calcification':'钙化','pin':'胸膜凹陷',
                    'cav':'空洞','vss':'血管集束','bea':'空泡','bro':'支气管充气'}
        console.log('测量',value,name.split('dropdown')[1])
        // let boxes = this.state.selectBoxes
        let boxes = this.state.boxes
        for(let count = 0;count<boxes.length;count++){
            if (boxes[count].nodule_no === name.split('dropdown')[1]) {
                boxes[count].lobulation=1
                boxes[count].spiculation=1
                boxes[count].calcification=1
                boxes[count].pin=1
                boxes[count].cav=1
                boxes[count].vss=1
                boxes[count].bea=1
                boxes[count].bro=1
                for(let itemValue in value){
                    for(let keyRepresents in represents){
                        if(value[itemValue] === represents[keyRepresents]){
                            if(keyRepresents === 'lobulation'){
                                boxes[count].lobulation=2
                            }
                            else if(keyRepresents === 'spiculation'){
                                boxes[count].spiculation=2
                            }
                            else if(keyRepresents === 'calcification'){
                                boxes[count].calcification=2
                            }
                            else if(keyRepresents === 'pin'){
                                boxes[count].pin=2
                            }
                            else if(keyRepresents === 'cav'){
                                boxes[count].cav=2
                            }
                            else if(keyRepresents === 'vss'){
                                boxes[count].vss=2
                            }
                            else if(keyRepresents === 'bea'){
                                boxes[count].bea=2
                            }
                            else if(keyRepresents === 'bro'){
                                boxes[count].bro=2
                            }
                            break
                        }
                    }
                }
                break
            }
        }
        this.setState({
            // selectBoxes: boxes
            boxes: boxes
            // random: Math.random()
        })
    }

    toMyAnno() {
        window.location.href = '/case/' + this.state.caseId + '/' + localStorage.getItem('username')
    }

    saveToDB() {
        console.log('savetodb')
        let boxes = this.state.boxes
        // const selectBoxes = this.state.selectBoxes
        // const selectBoxesMapIndex = this.state.selectBoxesMapIndex
        // let deleteBoxes=[]

        // for(let i=0;i<selectBoxesMapIndex.length;i++){//仅修改
        //     if(selectBoxes[i]!=="delete"){
        //         boxes[selectBoxes[i]]=selectBoxes[i]
        //     }
        //     else{
        //         deleteBoxes.push(selectBoxesMapIndex[i])//存在删除情况
        //     }
        // }

        // for(let i=0;i<deleteBoxes.length;i++){//存在删除情况
        //     boxes.splice(deleteBoxes[i], 1)
        //     for (let i = deleteBoxes[i]; i < boxes.length; i++) {
        //         boxes[i].nodule_no=(parseInt(boxes[i].nodule_no)-1).toString()
        //     }       
        // }
        const token = localStorage.getItem('token')
        const headers = {
            'Authorization': 'Bearer '.concat(token)
        }
        const params = {
            caseId: this.state.caseId,
            username:this.state.username,
            newRectStr: JSON.stringify(boxes)
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

    disableAllTools(element){
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

    startAnnos(){
        // this.setState({isbidirectionnal:true,toolState:'EllipticalRoi'})
        // const element = document.querySelector('#origin-canvas')
        // this.disableAllTools(element)
        // cornerstoneTools.addToolForElement(element,ellipticalRoi)
        // cornerstoneTools.setToolActiveForElement(element, 'EllipticalRoi',{mouseButtonMask:1},['Mouse'])
        this.setState({leftButtonTools:0,menuTools:'anno'})
    }

    slide(){
        const element = document.querySelector('#origin-canvas')
        this.disableAllTools(element)
        this.setState({leftButtonTools:1,menuTools:'slide'})
        const newCurrentIdx = this.state.currentIdx
        //切换切片
    }

    wwwcCustom(){
        this.setState({leftButtonTools:2,menuTools:'wwwc'})
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

    saveTest(){
        let myJSONStingData = localStorage.getItem('ROI')
        let allROIToolData = JSON.parse(myJSONStingData);
        console.log('恢复数据')
         const element = document.querySelector('#origin-canvas')
         for (let toolROIType in allROIToolData) {
            if (allROIToolData.hasOwnProperty(toolROIType)) {
                for (let i = 0; i < allROIToolData[toolROIType].data.length; i++) {
                    let toolROIData = allROIToolData[toolROIType].data[i];
                    console.log('tool',toolROIType,toolROIData)
                    // cornerstoneTools.addImageIdToolState(this.state.imageIds[5], toolROIType, toolROIData);//save在同一个imageId
                    cornerstoneTools.addToolState(element,toolROIType, toolROIData)
                }
            }
        }
        cornerstone.updateImage(element);
    }

    bidirectionalMeasure(){
        this.setState({leftButtonTools:3,menuTools:'bidirect'})
        // console.log('测量')
        // const element = document.querySelector('#origin-canvas')
        // this.disableAllTools(element)
        // cornerstoneTools.addToolForElement(element, bidirectional)
        // cornerstoneTools.setToolActiveForElement(element, 'Bidirectional',{mouseButtonMask:1},['Mouse'])
        // cornerstoneTools.length.activate(element,4);

    }

    lengthMeasure(){
        this.setState({leftButtonTools:4,menuTools:'length'})
    }

    featureAnalysis(idx,e){
        console.log("特征分析")
        // const boxes = this.state.selectBoxes
        const boxes = this.state.boxes
        console.log('boxes',boxes, e.target.value)
        if (boxes[idx] !== undefined){
            console.log('boxes',boxes[idx])
            var hist = boxes[idx].nodule_hist
            if(hist!==undefined){
                this.visualize(hist,idx)
            }
        }
    }

    closeVisualContent(){
        console.log('close')
        const visId = 'visual-' + this.state.listsActiveIndex
        if(document.getElementById(visId) !== undefined && document.getElementById(visId) !== null){
            document.getElementById(visId).style.display = 'none'
            document.getElementById('closeVisualContent').style.display = 'none'
        }
        
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

    eraseLabel(){
        const element = document.querySelector('#origin-canvas')
        this.disableAllTools(element)
        cornerstoneTools.addToolForElement(element,eraser)
        cornerstoneTools.setToolActiveForElement(element, 'Eraser',{mouseButtonMask:1},['Mouse'])
        
       
    }

    eraseMeasures(idx,e){
        const boxes = this.state.boxes
        // const boxes = this.state.selectBoxes
        boxes[idx].measure = []
        this.setState({boxes: boxes})
        this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
    }

    toHomepage(){
        window.location.href = '/homepage'
        // this.nextPath('/homepage/' + params.caseId + '/' + res.data)
    }

    toSegView(){
        window.location.href = '/segView/'+ this.state.caseId
    }

    handleLogin() {
        this.setState({
            reRender: Math.random()
        }) // force re-render the page
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

    tinyNodules(e){
        if(e.target.checked){
            this.setState({selectTiny:1,listsActiveIndex:-1})
        }
        else{
            this.setState({selectTiny:0,listsActiveIndex:-1})
        }
    }

    chooseDensity(value){
        if(value==="实性"){
            this.setState({selectTexture:2})
        }
        else if(value==="半实性"){
            this.setState({selectTexture:3})
        }
        else if(value==="磨玻璃"){
            this.setState({selectTexture:1})
        }
        else{
            this.setState({selectTexture:-1})
        }
    }


    render() {
        let sliderMarks={}

        // if(this.state.imageIds.length<=100){
        //     for(let i=0;i<this.state.selectBoxes.length;i++){
        //         sliderMarks[this.state.selectBoxes[i].slice_idx+1]=''
        //     }
        // }
        // else{
        //     for(let i=0;i<this.state.selectBoxes.length;i++){
        //         sliderMarks[this.state.selectBoxes[i].slice_idx]=''
        //     }
        // }
        if(this.state.imageIds.length<=100){
            for(let i=0;i<this.state.boxes.length;i++){
                sliderMarks[this.state.boxes[i].slice_idx+1]=''
            }
        }
        else{
            for(let i=0;i<this.state.boxes.length;i++){
                sliderMarks[this.state.boxes[i].slice_idx]=''
            }
        }
        
        
        

        let panes = [
            { menuItem: '影像所见', render: () => 
                <Tab.Pane><MiniReport type='影像所见' caseId={this.state.caseId} username={this.state.username} 
                imageIds={this.state.imageIds} boxes={this.state.boxes} activeItem={this.state.doubleClick===true?'all':this.state.listsActiveIndex}/></Tab.Pane> },
            { menuItem: '处理建议', render: () => <Tab.Pane><MiniReport type='处理建议' imageIds={this.state.imageIds} boxes={this.state.boxes}/></Tab.Pane> },
            { menuItem: '留言', render: () => <Tab.Pane><MessagePanel caseId={this.state.caseId} boxes={this.state.boxes} /></Tab.Pane> }
          ]
        const {showNodules, activeIndex, modalOpenNew, modalOpenCur,listsActiveIndex,wwDefine, 
            wcDefine, dicomTag, studyList, menuTools, cacheModal, windowWidth, windowHeight, slideSpan, measureStateList, maskStateList} = this.state
        // if(windowWidth <= 1600 && windowWidth > 1440){
        //     bottomLeftStyle = {
        //         bottom: "5px",
        //         left: "-50px",
        //         position: "absolute",
        //         color: "white"
        //     }
            
        //     bottomRightStyle = {
        //         bottom: "5px",
        //         right: "-10px",
        //         position: "absolute",
        //         color: "white"
        //     }
            
        //     topLeftStyle = {
        //         top: "5px",
        //         left: "-50px", // 5px
        //         position: "absolute",
        //         color: "white"
        //     }
            
        //     topRightStyle = {
        //         top: "5px",
        //         right: "-10px", //5px
        //         position: "absolute",
        //         color: "white"
        //     }
        // }
        // else if(windowWidth <= 1440){
        //     bottomLeftStyle = {
        //         bottom: "5px",
        //         left: "-40px",
        //         position: "absolute",
        //         color: "white"
        //     }
            
        //     bottomRightStyle = {
        //         bottom: "5px",
        //         right: "-30px",
        //         position: "absolute",
        //         color: "white"
        //     }
            
        //     topLeftStyle = {
        //         top: "5px",
        //         left: "-40px", // 5px
        //         position: "absolute",
        //         color: "white"
        //     }
            
        //     topRightStyle = {
        //         top: "5px",
        //         right: "-30px", //5px
        //         position: "absolute",
        //         color: "white"
        //     }
        // }
        // console.log('dicomTag',dicomTag.elements)
        // var keys = [];
        // for(var propertyName in dicomTag.elements) {
        //     keys.push(propertyName);
        // }
        // keys.sort();
        // console.log('keys',keys)
        // var propertyName = keys[0];
        // var element = dicomTag.elements[propertyName];
        // console.log('element',element)
        let tableContent = ""
        let visualContent = ""
        let createDraftModal;
        let submitButton;
        let StartReviewButton;
        let calCount=0
        let canvas
        let slideLabel
        let dicomTagPanel
        let places={0:'选择位置',1:'右肺中叶',2:'右肺上叶',3:'右肺下叶',4:'左肺上叶',5:'左肺下叶'}
        // let noduleNumTab = '结节(' + this.state.selectBoxes.length + ')'
        let noduleNumTab = '结节(' + this.state.boxes.length + ')'
        // let inflammationTab = '炎症(有)'
        // let lymphnodeTab = '淋巴结(0)'
        let segments={
        'S1':'右肺上叶-尖段','S2':'右肺上叶-后段','S3':'右肺上叶-前段','S4':'右肺中叶-外侧段','S5':'右肺中叶-内侧段',
        'S6':'右肺下叶-背段','S7':'右肺下叶-内基底段','S8':'右肺下叶-前基底段','S9':'右肺下叶-外基底段','S10':'右肺下叶-后基底段',
        'S11':'左肺上叶-尖后段','S12':'左肺上叶-前段','S13':'左肺上叶-上舌段','S14':'左肺上叶-下舌段','S15':'左肺下叶-背段',
        'S16':'左肺下叶-内前基底段','S17':'左肺下叶-外基底段','S18':'左肺下叶-后基底段'}
        
        const options = [
            { key: '分叶', text: '分叶', value: '分叶' },
            { key: '毛刺', text: '毛刺', value: '毛刺' },
            { key: '钙化', text: '钙化', value: '钙化' },
            { key: '胸膜凹陷', text: '胸膜凹陷', value: '胸膜凹陷' },
            { key: '血管集束', text: '血管集束', value: '血管集束' },
            { key: '空泡', text: '空泡', value: '空泡' },
            { key: '空洞', text: '空洞', value: '空洞' },
            { key: '支气管充气', text: '支气管充气', value: '支气管充气' },
        ]
        // let options = ['分叶','毛刺','钙化','胸膜凹陷','血管集束','空泡','空洞','支气管充气']
        // let children=[]
        // for(let i=0;i<options.length;i++){
        //     children.push(<Option key={i}>{options[i]}</Option>)
        // }

        const locationOptions=[
            { key: '分叶', text: '分叶', value: '分叶' },
            { key: '分叶', text: '分叶', value: '分叶' },
            { key: '分叶', text: '分叶', value: '分叶' },
            { key: '分叶', text: '分叶', value: '分叶' },
        ]
        const welcome = '欢迎您，' + localStorage.realname;
        const dicomslice = this.state.imageIds[0]
        // console.log('dicomslice',dicomslice)
        if (this.state.okayForReview) {
            StartReviewButton = (
                <Button style={{
                    marginLeft: 15 + 'px'
                }}>审核此例</Button>
            )
        }
        
        if(slideSpan > 0){
            slideLabel=(
                <div style={{position:'absolute',top:'90px',left:'-95px'}}><Label as='a'><Icon name='caret down' />{Math.abs(slideSpan)}</Label></div>
            )
        }
        else if(slideSpan < 0){
            slideLabel = (
                <div style={{position:'absolute',top:'90px',left:'-95px'}}><Label as='a'><Icon name='caret up' />{Math.abs(slideSpan)}</Label></div>
            )
        }
        else{
            slideLabel = (null)
        }

        // if(windowWidth <=1600 && windowWidth > 1440){
        //     dicomTagPanel = (
        //         <div>                          
        //         <div id='dicomTag'>               
        //             <div style={topLeftStyle}>{dicomTag.string('x00100010')}</div>
        //             <div style={{position:'absolute',color:'white',top:'20px',left:'-50px'}}>{dicomTag.string('x00101010')} {dicomTag.string('x00100040')}</div>
        //             <div style={{position:'absolute',color:'white',top:'35px',left:'-50px'}}>{dicomTag.string('x00100020')}</div>
        //             <div style={{position:'absolute',color:'white',top:'50px',left:'-50px'}}>{dicomTag.string('x00185100')}</div>
        //             <div style={{position:'absolute',color:'white',top:'65px',left:'-50px'}}>IM: {this.state.currentIdx + 1} / {this.state.imageIds.length}</div>
                    
        //             <div style={topRightStyle}>{dicomTag.string('x00080080')}</div>
        //             <div style={{position:'absolute',color:'white',top:'20px',right:'-10px'}}>ACC No: {dicomTag.string('x00080050')}</div>
        //             <div style={{position:'absolute',color:'white',top:'35px',right:'-10px'}}>{dicomTag.string('x00090010')}</div>
        //             <div style={{position:'absolute',color:'white',top:'50px',right:'-10px'}}>{dicomTag.string('x0008103e')}</div>
        //             <div style={{position:'absolute',color:'white',top:'65px',right:'-10px'}}>{dicomTag.string('x00080020')}</div>
        //             <div style={{position:'absolute',color:'white',top:'80px',right:'-10px'}}>T: {dicomTag.string('x00180050')}</div>
        //         </div>
        //         <div style={{position:'absolute',color:'white',bottom:'20px',left:'-50px'}}>Offset: {this.state.viewport.translation['x'].toFixed(1)}, {this.state.viewport.translation['y'].toFixed(1)}
        //         </div>
        //         <div style={bottomLeftStyle}>Zoom: {Math.round(this.state.viewport.scale * 100)}%</div>
        //         <div style={bottomRightStyle}>
        //             WW/WC: {Math.round(this.state.viewport.voi.windowWidth)}
        //             /{" "} {Math.round(this.state.viewport.voi.windowCenter)}
        //         </div>
        //     </div>
        //     )
            
        // }
        // else if(windowWidth <= 1440){
        //     dicomTagPanel= (
        //         <div>                          
        //             <div id='dicomTag'>               
        //                 <div style={topLeftStyle}>{dicomTag.string('x00100010')}</div>
        //                 <div style={{position:'absolute',color:'white',top:'20px',left:'-40px'}}>{dicomTag.string('x00101010')} {dicomTag.string('x00100040')}</div>
        //                 <div style={{position:'absolute',color:'white',top:'35px',left:'-40px'}}>{dicomTag.string('x00100020')}</div>
        //                 <div style={{position:'absolute',color:'white',top:'50px',left:'-40px'}}>{dicomTag.string('x00185100')}</div>
        //                 <div style={{position:'absolute',color:'white',top:'65px',left:'-40px'}}>IM: {this.state.currentIdx + 1} / {this.state.imageIds.length}</div>
                        
        //                 <div style={topRightStyle}>{dicomTag.string('x00080080')}</div>
        //                 <div style={{position:'absolute',color:'white',top:'20px',right:'-30px'}}>ACC No: {dicomTag.string('x00080050')}</div>
        //                 <div style={{position:'absolute',color:'white',top:'35px',right:'-30px'}}>{dicomTag.string('x00090010')}</div>
        //                 <div style={{position:'absolute',color:'white',top:'50px',right:'-30px'}}>{dicomTag.string('x0008103e')}</div>
        //                 <div style={{position:'absolute',color:'white',top:'65px',right:'-30px'}}>{dicomTag.string('x00080020')}</div>
        //                 <div style={{position:'absolute',color:'white',top:'80px',right:'-30px'}}>T: {dicomTag.string('x00180050')}</div>
        //             </div>
        //             <div style={{position:'absolute',color:'white',bottom:'20px',left:'-40px'}}>Offset: {this.state.viewport.translation['x'].toFixed(1)}, {this.state.viewport.translation['y'].toFixed(1)}
        //             </div>
        //             <div style={bottomLeftStyle}>Zoom: {Math.round(this.state.viewport.scale * 100)}%</div>
        //             <div style={bottomRightStyle}>
        //                 WW/WC: {Math.round(this.state.viewport.voi.windowWidth)}
        //                 /{" "} {Math.round(this.state.viewport.voi.windowCenter)}
        //             </div>
        //         </div>
        //     )  
        // }
        // else{
        dicomTagPanel=(
            <div>
                <div id='dicomTag'>               
                    <div style={topLeftStyle}>{dicomTag.string('x00100010')}</div>
                    <div style={{position:'absolute',color:'white',top:'20px'}}>{dicomTag.string('x00101010')} {dicomTag.string('x00100040')}</div>
                    <div style={{position:'absolute',color:'white',top:'35px'}}>{dicomTag.string('x00100020')}</div>
                    <div style={{position:'absolute',color:'white',top:'50px'}}>{dicomTag.string('x00185100')}</div>
                    <div style={{position:'absolute',color:'white',top:'65px'}}>IM: {this.state.currentIdx + 1} / {this.state.imageIds.length}</div>
                    {slideLabel}                                                  
                    <div style={topRightStyle}>{dicomTag.string('x00080080')}</div>
                    <div style={{position:'absolute',color:'white',top:'20px',right:'5px'}}>ACC No: {dicomTag.string('x00080050')}</div>
                    <div style={{position:'absolute',color:'white',top:'35px',right:'5px'}}>{dicomTag.string('x00090010')}</div>
                    <div style={{position:'absolute',color:'white',top:'50px',right:'5px'}}>{dicomTag.string('x0008103e')}</div>
                    <div style={{position:'absolute',color:'white',top:'65px',right:'5px'}}>{dicomTag.string('x00080020')}</div>
                    <div style={{position:'absolute',color:'white',top:'80px',right:'5px'}}>T: {dicomTag.string('x00180050')}</div>
                </div>
                <div style={{position:'absolute',color:'white',bottom:'30px'}}>Offset: {this.state.viewport.translation['x'].toFixed(1)}, {this.state.viewport.translation['y'].toFixed(1)}
                </div>
                <div style={{position:'absolute',color:'white',bottom:'10px'}}>Zoom: {Math.round(this.state.viewport.scale * 100)}%</div>
                <div style={{position:'absolute',color:'white',bottom:'20px',right:'5px'}}>
                    WW/WC: {Math.round(this.state.viewport.voi.windowWidth)}
                    /{" "} {Math.round(this.state.viewport.voi.windowCenter)}
                </div>
            </div>
        )
        // }
        if (window.location.pathname.split('/')[3] === 'origin') 
            createDraftModal = (
                <div style={{width:'100%',height:'100%'}}>
                    <Modal
                        trigger={<Button inverted style={{height:60,fontSize:14,width:75}} color = 'blue' onClick = {
                        this.toNewModel
                    }
                    > 从新<br/>标注 </Button>}
                        size='tiny'
                        open={modalOpenNew}>
                        <Modal.Header>当前用户存在当前检查的标注，请选择以下操作：</Modal.Header>
                        <Modal.Content>
                            <Button color='blue' style={modalBtnStyle} onClick={this.toMyAnno}>跳转至已有标注</Button>
                            <Button color='blue' style={modalBtnStyle} onClick={this.clearthenNew}>清空现有标注并从头开始标注</Button>
                        </Modal.Content>
                        <Modal.Actions>
                            <Button onClick={this.closeModalNew}>返回</Button>
                        </Modal.Actions>
                    </Modal>
                </div>
            )
        else 
            createDraftModal = (
                <div style={{width:'100%',height:'100%'}}>
                        <Modal
                            trigger={<Button inverted color = 'blue' onClick = {
                            this.toNewModel 
                        }
                        > 从新<br/>标注 </Button>}
                            size='tiny'
                            open={modalOpenNew}>
                            <Modal.Header>当前用户存在当前检查的标注，请选择以下操作：</Modal.Header>
                            <Modal.Content>
                                <Button color='blue' style={modalBtnStyle} onClick={this.toMyAnno}>跳转至已有标注</Button>
                                <Button color='blue' style={modalBtnStyle} onClick={this.clearthenNew}>清空现有标注并从头开始标注</Button>
                            </Modal.Content>
                            <Modal.Actions>
                                <Button onClick={this.closeModalNew}>返回</Button>
                            </Modal.Actions>
                        </Modal>
                        <Modal
                            trigger={<Button inverted color = 'blue' onClick = {
                            this.toCurrentModel
                        } > 拷贝<br/>标注 </Button>}
                            size='tiny'
                            open={modalOpenCur}>
                            <Modal.Header>当前用户存在当前检查的标注，请选择以下操作：</Modal.Header>
                            <Modal.Content>
                                <Button color='blue' style={modalBtnStyle} onClick={this.toMyAnno}>跳转至已有标注</Button>
                                <Button color='blue' style={modalBtnStyle} onClick={this.clearthenFork}>清空现有标注并拷贝开始标注</Button>
                            </Modal.Content>
                            <Modal.Actions>
                                <Button onClick={this.closeModalCur}>返回</Button>
                            </Modal.Actions>
                        </Modal>
                    
                </div>
            )

        if (!this.state.immersive) {
                tableContent = this
                    .state
                    // .selectBoxes
                    .boxes
                    .map((inside, idx) => {
                        let representArray=[]
                        let dropdownText=''
                        let malignancyContnt = ''
                        let probContnt = ''
                        const delId = 'del-' + inside.nodule_no
                        const malId = 'malSel-' + inside.nodule_no
                        const texId = 'texSel-' + inside.nodule_no
                        const placeId = 'place-' + inside.nodule_no
                        const visualId = 'visual-' + idx
                        let ll = 0
                        let sl = 0
                        if(inside.measure !== undefined && inside.measure !== null){
                            ll = Math.sqrt(Math.pow((inside.measure.x1 - inside.measure.x2),2) + Math.pow((inside.measure.y1 - inside.measure.y2),2))
                            sl = Math.sqrt(Math.pow((inside.measure.x3 - inside.measure.x4),2) + Math.pow((inside.measure.y3 - inside.measure.y4),2))
                            if(isNaN(ll)){
                                ll=0
                            }
                            if(isNaN(sl)){
                                sl=0
                            }
                        }
                        
                        let showMeasure = measureStateList[idx]
                        let showMask = maskStateList[idx]
                        if(inside.lobulation===2){
                            representArray.push('分叶')
                        }
                        if(inside.spiculation===2){
                            representArray.push('毛刺')
                        }
                        if(inside.calcification===2){
                            representArray.push('钙化')
                        }
                        if(inside.calcification===2){
                            calCount+=1
                        }
                        if(inside.pin===2){
                            representArray.push('胸膜凹陷')
                        }
                        if(inside.cav===2){
                            representArray.push('空洞')
                        }
                        if(inside.vss===2){
                            representArray.push('血管集束')
                        }
                        if(inside.bea===2){
                            representArray.push('空泡')
                        }
                        if(inside.bro===2){
                            representArray.push('支气管充气')
                        }
                        if(inside.segment!==undefined
                        && inside.segment!==null && inside.segment!=="None" && inside.segment!==""){
                            dropdownText=segments[inside.segment]
                        }
                        else{
                            if(inside.place!==undefined
                                && inside.place!==null && inside.place!=="None" && inside.place!==""){
                                dropdownText=places[inside.place]
                            }
                            else{
                                dropdownText='选择位置'
                            }
                        }
                        
                        if(inside.malignancy === -1){
                            // if(this.state.readonly){
                                malignancyContnt = (
                                    <Grid.Column width={2} textAlign='center'>
                                        <select id={malId} style={selectStyle} value={inside.malignancy} onChange={this.onSelectMal}>
                                            <option value="-1" disabled="disabled">选择性质</option>
                                            <option value="1">低危</option>
                                            <option value="2">中危</option>
                                            <option value="3">高危</option>
                                        </select>
                                    </Grid.Column>
                                )
                                probContnt=(
                                    <Grid.Column width={4} textAlign='center'>
                                        <div>{Math.floor(inside.malProb*1000)/10}%</div>
                                    </Grid.Column>
                                )
                            // }
                            // else{
                            //     malignancyContnt = (
                            //         <Grid.Column width={2} textAlign='center'>
                            //             <select id={malId} style={selectStyle} value={inside.malignancy} onChange={this.onSelectMal}>
                            //                 <option value="-1" disabled="disabled">选择性质</option>
                            //                 <option value="1">低危</option>
                            //                 <option value="2">中危</option>
                            //                 <option value="3">高危</option>
                            //             </select>
                            //         </Grid.Column>
                            //     )
                            // }
                        }
                        else if(inside.malignancy===1){
                            // if(this.state.readonly){
                                malignancyContnt = (
                                    <Grid.Column width={2} textAlign='center'>
                                        <select id={malId} style={lowRiskStyle} value={"1"} onChange={this.onSelectMal}>
                                            <option value="-1" disabled="disabled">选择性质</option>
                                            <option value="1">低危</option>
                                            <option value="2">中危</option>
                                            <option value="3">高危</option>
                                        </select>
                                    </Grid.Column>
                                )
                                probContnt=(
                                    <Grid.Column width={4} textAlign='center'>
                                        <div style={{color:'green'}}>{Math.floor(inside.malProb*1000)/10}%</div>
                                    </Grid.Column>
                                )
                            // }
                            // else{
                            //     malignancyContnt = (
                            //         <Grid.Column width={2} textAlign='center'>
                            //             <select id={malId} style={lowRiskStyle} value={inside.malignancy} onChange={this.onSelectMal}>
                            //                 <option value="-1" disabled="disabled">选择性质</option>
                            //                 <option value="1">低危</option>
                            //                 <option value="2">中危</option>
                            //                 <option value="3">高危</option>
                            //             </select>
                            //         </Grid.Column>
                            //     )
                            // }
                        }
                        else if(inside.malignancy===2){
                            // if(this.state.readonly){
                                malignancyContnt = (
                                    <Grid.Column width={2} textAlign='left'>
                                        <select id={malId} style={middleRiskStyle} value={"2"} onChange={this.onSelectMal}>
                                            <option value="-1" disabled="disabled">选择性质</option>
                                            <option value="1">低危</option>
                                            <option value="2">中危</option>
                                            <option value="3">高危</option>
                                        </select>
                                    </Grid.Column>
                                )
                                probContnt=(
                                    <Grid.Column width={4} textAlign='center'>
                                        <div style={{color:'#fcaf17'}}>{Math.floor(inside.malProb*1000)/10}%</div>
                                    </Grid.Column>
                                )
                            // }
                            // else{
                            //     malignancyContnt = (
                            //         <Grid.Column width={2} textAlign='left'>
                            //             <select id={malId} style={middleRiskStyle} value={inside.malignancy} onChange={this.onSelectMal}>
                            //                 <option value="-1" disabled="disabled">选择性质</option>
                            //                 <option value="1">低危</option>
                            //                 <option value="2">中危</option>
                            //                 <option value="3">高危</option>
                            //             </select>
                            //         </Grid.Column>
                            //     )
                            // }
                        }
                        else if(inside.malignancy===3){
                            // if(this.state.readonly){
                                malignancyContnt = (
                                    <Grid.Column width={2} textAlign='left'>
                                        <select id={malId} style={highRiskStyle} value={"3"} onChange={this.onSelectMal}>
                                            <option value="-1" disabled="disabled">选择性质</option>
                                            <option value="1">低危</option>
                                            <option value="2">中危</option>
                                            <option value="3">高危</option>
                                        </select>
                                    </Grid.Column>
                                )
                                probContnt=(
                                    <Grid.Column width={4} textAlign='center'>
                                        <div style={{color:'#CC3300'}}>{Math.floor(inside.malProb*1000)/10}%</div>
                                    </Grid.Column>
                                )
                            // }
                            // else{
                            //     malignancyContnt = (
                            //         <Grid.Column width={2} textAlign='left'>
                            //             <select id={malId} style={highRiskStyle} value={inside.malignancy} onChange={this.onSelectMal}>
                            //                 <option value="-1" disabled="disabled">选择性质</option>
                            //                 <option value="1">低危</option>
                            //                 <option value="2">中危</option>
                            //                 <option value="3">高危</option>
                            //             </select>
                            //         </Grid.Column>
                            //     )
                            // }
                        }
                        // if(this.state.readonly){
                        return (
                            <div key={idx} className='highlightTbl'>
                                <Accordion.Title onClick={this.handleListClick.bind(this,inside.slice_idx + 1,idx)}
                                active={listsActiveIndex===idx} index={idx} >
                                    <Grid>
                                        <Grid.Row>
                                            <Grid.Column width={1}>
                                                {
                                                    inside.modified===undefined?
                                                    <div onMouseOver={this.highlightNodule} onMouseOut={this.dehighlightNodule} style={{fontSize:'large'}}>{idx+1}</div>
                                                    :
                                                    <div onMouseOver={this.highlightNodule} onMouseOut={this.dehighlightNodule} style={{fontSize:'large',color:'#dbce12'}}>{idx+1}</div>
                                                }
                                                
                                            </Grid.Column>
                                            
                                            <Grid.Column widescreen={6} computer={7} textAlign='center'>
                                            {
                                                idx<6?
                                                <Dropdown id={placeId} style={selectStyle} text={dropdownText} icon={null} onClick={this.handleDropdownClick.bind(this,inside.slice_idx + 1,idx)} open={this.state.dropDownOpen===idx}>
                                                    <Dropdown.Menu>
                                                        <Dropdown.Header>肺叶</Dropdown.Header>
                                                        <Dropdown.Item>
                                                        <Dropdown text='右肺中叶'>
                                                            <Dropdown.Menu>
                                                                <Dropdown.Header>肺段</Dropdown.Header>
                                                                <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-右肺中叶'}>外侧段</Dropdown.Item>
                                                                <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-右肺中叶'}>内侧段</Dropdown.Item>
                                                                <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-右肺中叶'}>无法定位</Dropdown.Item>
                                                            </Dropdown.Menu>
                                                            </Dropdown>
                                                        </Dropdown.Item>
                                                        <Dropdown.Item>
                                                        <Dropdown text='右肺上叶'>
                                                            <Dropdown.Menu>
                                                            <Dropdown.Header>肺段</Dropdown.Header>
                                                                <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-右肺上叶'}>尖段</Dropdown.Item>
                                                                <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-右肺上叶'}>后段</Dropdown.Item>
                                                                <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-右肺上叶'}>前段</Dropdown.Item>
                                                                <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-右肺中叶'}>无法定位</Dropdown.Item>
                                                            </Dropdown.Menu>
                                                            </Dropdown>
                                                        </Dropdown.Item>
                                                        <Dropdown.Item>
                                                        <Dropdown text='右肺下叶'>
                                                            <Dropdown.Menu>
                                                            <Dropdown.Header>肺段</Dropdown.Header>
                                                                <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-右肺下叶'}>背段</Dropdown.Item>
                                                                <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-右肺下叶'}>内基底段</Dropdown.Item>
                                                                <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-右肺下叶'}>前基底段</Dropdown.Item>
                                                                <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-右肺下叶'}>外基底段</Dropdown.Item>
                                                                <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-右肺下叶'}>后基底段</Dropdown.Item>
                                                                <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-右肺中叶'}>无法定位</Dropdown.Item>
                                                            </Dropdown.Menu>
                                                            </Dropdown>
                                                        </Dropdown.Item>
                                                        <Dropdown.Item>
                                                        <Dropdown text='左肺上叶'>
                                                            <Dropdown.Menu>
                                                            <Dropdown.Header>肺段</Dropdown.Header>
                                                                <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-左肺上叶'}>尖后段</Dropdown.Item>
                                                                <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-左肺上叶'}>前段</Dropdown.Item>
                                                                <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-左肺上叶'}>上舌段</Dropdown.Item>
                                                                <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-左肺上叶'}>下舌段</Dropdown.Item>
                                                                <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-右肺中叶'}>无法定位</Dropdown.Item>
                                                            </Dropdown.Menu>
                                                        </Dropdown>
                                                        </Dropdown.Item>
                                                        <Dropdown.Item>
                                                        <Dropdown text='左肺下叶'>
                                                            <Dropdown.Menu>
                                                            <Dropdown.Header>肺段</Dropdown.Header>
                                                                <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-左肺下叶'}>背段</Dropdown.Item>
                                                                <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-左肺下叶'}>内前基底段</Dropdown.Item>
                                                                <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-左肺下叶'}>外基底段</Dropdown.Item>
                                                                <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-左肺下叶'}>后基底段</Dropdown.Item>
                                                                <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-右肺中叶'}>无法定位</Dropdown.Item>
                                                            </Dropdown.Menu>
                                                            </Dropdown>
                                                        </Dropdown.Item>
                                                    </Dropdown.Menu>
                                                </Dropdown>
                                                :
                                                <Dropdown id={placeId} style={selectStyle} text={dropdownText} upward icon={null} onClick={this.handleDropdownClick.bind(this,inside.slice_idx + 1,idx)} open={this.state.dropDownOpen===idx}>
                                                    <Dropdown.Menu>
                                                        <Dropdown.Header>肺叶</Dropdown.Header>
                                                        <Dropdown.Item>
                                                        <Dropdown text='右肺中叶'>
                                                            <Dropdown.Menu>
                                                                <Dropdown.Header>肺段</Dropdown.Header>
                                                                <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-右肺中叶'}>外侧段</Dropdown.Item>
                                                                <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-右肺中叶'}>内侧段</Dropdown.Item>
                                                                <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-右肺中叶'}>无法定位</Dropdown.Item>
                                                            </Dropdown.Menu>
                                                            </Dropdown>
                                                        </Dropdown.Item>
                                                        <Dropdown.Item>
                                                        <Dropdown text='右肺上叶'>
                                                            <Dropdown.Menu>
                                                            <Dropdown.Header>肺段</Dropdown.Header>
                                                                <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-右肺上叶'}>尖段</Dropdown.Item>
                                                                <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-右肺上叶'}>后段</Dropdown.Item>
                                                                <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-右肺上叶'}>前段</Dropdown.Item>
                                                                <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-右肺中叶'}>无法定位</Dropdown.Item>
                                                            </Dropdown.Menu>
                                                            </Dropdown>
                                                        </Dropdown.Item>
                                                        <Dropdown.Item>
                                                        <Dropdown text='右肺下叶'>
                                                            <Dropdown.Menu>
                                                            <Dropdown.Header>肺段</Dropdown.Header>
                                                                <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-右肺下叶'}>背段</Dropdown.Item>
                                                                <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-右肺下叶'}>内基底段</Dropdown.Item>
                                                                <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-右肺下叶'}>前基底段</Dropdown.Item>
                                                                <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-右肺下叶'}>外基底段</Dropdown.Item>
                                                                <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-右肺下叶'}>后基底段</Dropdown.Item>
                                                                <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-右肺中叶'}>无法定位</Dropdown.Item>
                                                            </Dropdown.Menu>
                                                            </Dropdown>
                                                        </Dropdown.Item>
                                                        <Dropdown.Item>
                                                        <Dropdown text='左肺上叶'>
                                                            <Dropdown.Menu>
                                                            <Dropdown.Header>肺段</Dropdown.Header>
                                                                <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-左肺上叶'}>尖后段</Dropdown.Item>
                                                                <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-左肺上叶'}>前段</Dropdown.Item>
                                                                <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-左肺上叶'}>上舌段</Dropdown.Item>
                                                                <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-左肺上叶'}>下舌段</Dropdown.Item>
                                                                <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-右肺中叶'}>无法定位</Dropdown.Item>
                                                            </Dropdown.Menu>
                                                        </Dropdown>
                                                        </Dropdown.Item>
                                                        <Dropdown.Item>
                                                        <Dropdown text='左肺下叶'>
                                                            <Dropdown.Menu>
                                                            <Dropdown.Header>肺段</Dropdown.Header>
                                                                <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-左肺下叶'}>背段</Dropdown.Item>
                                                                <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-左肺下叶'}>内前基底段</Dropdown.Item>
                                                                <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-左肺下叶'}>外基底段</Dropdown.Item>
                                                                <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-左肺下叶'}>后基底段</Dropdown.Item>
                                                                <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-右肺中叶'}>无法定位</Dropdown.Item>
                                                            </Dropdown.Menu>
                                                            </Dropdown>
                                                        </Dropdown.Item>
                                                    </Dropdown.Menu>
                                                </Dropdown>
                                            }
                                            </Grid.Column>
                                        {malignancyContnt}
                                        {probContnt}
                                        
                                        <Grid.Column width={1} textAlign='center'>
                                            <Icon name='trash alternate' onClick={this.delNodule} id={delId}></Icon>
                                        </Grid.Column>
                                    </Grid.Row>
                                </Grid>
                                </Accordion.Title>
                                <Accordion.Content active={listsActiveIndex===idx} id='highlightAccordion'>
                                    <Grid>
                                        <Grid.Row>
                                            <Grid.Column width={1}>
                                            <div style={{fontSize:'1rem',color:'#2ECC71'}}>{parseInt(inside.slice_idx)+1}</div>
                                            </Grid.Column>
                                            
                                            <Grid.Column widescreen={6} computer={6}>
                                                {'\xa0\xa0'+(ll/10).toFixed(2) + '\xa0\xa0'+ ' ×' +'\xa0\xa0' + (sl/10).toFixed(2) + ' cm'}
                                                
                                            </Grid.Column>
                                            <Grid.Column widescreen={3} computer={3} textAlign='center'>
                                                {
                                                inside.volume!==undefined?
                                                (Math.floor(inside.volume * 100) / 100).toFixed(2)+'\xa0cm³'
                                                :
                                                null
                                            }
                                            </Grid.Column>
                                            <Grid.Column widescreen={4} computer={5} textAlign='center'>
                                                    {inside.huMin!==undefined && inside.huMax!==undefined?
                                                inside.huMin +'~' + inside.huMax + 'HU'
                                                :
                                                null
                                                }
                                            </Grid.Column>
                                    
                                            
                                        </Grid.Row>
                                        {/* <Grid.Column widescreen={3} computer={3} textAlign='center'>
                                                <select id={texId} style={selectStyle} defaultValue="" disabled>
                                                <option value="" disabled="disabled">选择亚型</option>
                                                </select>
                                            </Grid.Column> */}
                                    
                                        <Grid.Row textAlign='center' verticalAlign='middle' centered>
                                            <Grid.Column width={3}>
                                                <select id={texId} style={selectStyle} value={inside.texture} onChange={this.onSelectTex}>
                                                    <option value="-1" disabled="disabled">选择性质</option>
                                                    <option value="1">磨玻璃</option>
                                                    <option value="2">实性</option>
                                                    <option value="3">半实性</option>
                                                </select>
                                            </Grid.Column>
                                            <Grid.Column width={2} style={{paddingLeft:'0px',paddingRight:'0px'}}>表征:</Grid.Column>
                                            <Grid.Column width={11} style={{paddingLeft:'0px',paddingRight:'0px'}}>
                            
                                                <Dropdown multiple selection options={options} id='dropdown' icon='add circle' name={'dropdown'+idx}
                                                value={representArray} onChange={this.representChange.bind(this)} />
                                            </Grid.Column>
                                        </Grid.Row>
                                        <Grid.Row>
                                            <Grid.Column width={12}>
                                                <Button size='mini' circular inverted
                                                icon='chart bar' title='特征分析' value={idx} onClick={this.featureAnalysis.bind(this,idx)}>
                                                </Button>
                                            </Grid.Column>
                                            <Grid.Column width={4}>
                                                <Button.Group size='mini' className='measureBtnGroup'>
                                                <Button basic icon title='擦除测量' active color='green' onClick={this.eraseMeasures.bind(this,idx)}><Icon inverted color='green' name='eraser'></Icon></Button>
                                                    {
                                                        showMeasure?
                                                        <Button basic icon title='隐藏测量' active color='blue' onClick={this.toHideMeasures.bind(this,idx)}><Icon inverted color='blue' name='eye'></Icon></Button>:
                                                        <Button basic icon title='显示测量' active color='blue' onClick={this.toHideMeasures.bind(this,idx)}><Icon inverted color='blue' name='eye slash'></Icon></Button>
                                                    }
                                                    
                                                </Button.Group>
                                            </Grid.Column>
                                        </Grid.Row>
                                        
                                    </Grid>
                                    
                                    {/* <div id={visualId} className='histogram'></div> */}
                                </Accordion.Content>
                            </div>
                        )
                        // }
                    })

                    visualContent =  this
                    .state
                    .boxes
                    .map((inside, idx) => {
                        const visualId = 'visual-' + inside.nodule_no
                        const btnId = 'closeButton-' + inside.nodule_no
                        return(
                           <div id={visualId} className='histogram'>
                               {/* <button id={btnId} className='closeVisualContent' onClick={this.closeVisualContent}>×</button> */}
                           </div> 
                        )
                    })  
          
                return (
                    <div id="cornerstone">
                        <Menu className='corner-header'>
                            <Menu.Item>
                                <Image src={src1} avatar size='mini'/>
                                <a id='sys-name' href='/searchCase'>DeepLN肺结节全周期<br/>管理数据平台</a>
                            </Menu.Item>
                            <Menu.Item className='hucolumn'>
                                <Button.Group>
                                    <Button
                                        // inverted
                                        // color='black'
                                        onClick={this.toPulmonary}
                                        content='肺窗'
                                        className='hubtn'
                                        />
                                    <Button
                                        // inverted
                                        // color='blue'
                                        onClick={this.toBoneWindow} //骨窗窗宽窗位函数
                                        content='骨窗'
                                        className='hubtn'
                                        />
                                    <Button
                                        // inverted
                                        // color='blue'
                                        onClick={this.toVentralWindow} //腹窗窗宽窗位函数
                                        content='腹窗'
                                        className='hubtn'
                                        />
                                    <Button
                                        // inverted
                                        // color='blue'
                                        onClick={this.toMedia}
                                        content='纵隔窗'
                                        className='hubtn'
                                        />
                                    {/* <Button
                                        inverted
                                        color='blue'
                                        onClick={this.toMedia}
                                        className='hubtn'
                                        >自定义</Button> */}
                                        {/* <Popup
                                    trigger={
                                        <Button
                                        // inverted
                                        // color='blue'
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
                                    position='bottom center'
                                    id='defWindow'
                                    />                                                */}
                                </Button.Group>
                            </Menu.Item>
                            <span id='line-left'></span>
                            <Menu.Item className='funcolumn'>
                            <Button.Group>
                                    <Button
                                        // inverted
                                        // color='blue'
                                        icon
                                        title='灰度反转'
                                        // style={{width:55,height:60,fontSize:14,fontSize:14}}
                                        onClick={this.imagesFilp}
                                        className='funcbtn'
                                        ><Icon name='adjust' size='large'></Icon></Button>
                                    <Button
                                        // inverted
                                        // color='blue'
                                        icon
                                        title='放大'
                                        // style={{width:55,height:60,fontSize:14,fontSize:14}}
                                        onClick={this.ZoomIn}
                                        className='funcbtn'
                                        ><Icon name='search plus' size='large'></Icon></Button>
                                    <Button
                                        // inverted
                                        // color='blue'
                                        icon
                                        title='缩小'
                                        // style={{width:55,height:60,fontSize:14}}
                                        onClick={this.ZoomOut}
                                        className='funcbtn'
                                        ><Icon name='search minus' size='large'></Icon></Button>
                                    <Button icon onClick={this.reset} className='funcbtn' title='刷新'><Icon name='repeat' size='large'></Icon></Button>
                                    {!this.state.isPlaying?
                                        <Button icon onClick={this.playAnimation} className='funcbtn' title='播放动画'><Icon name='play' size='large'></Icon></Button>:
                                        <Button icon onClick={this.pauseAnimation} className='funcbtn' title='暂停动画'><Icon name='pause' size='large'></Icon></Button>
                                    }
                                    {/* <Button icon onClick={this.cache} className='funcbtn' title='缓存'><Icon id="cache-button" name='coffee' size='large'></Icon></Button> */}
                                    {/* <Modal
                                        basic
                                        open={cacheModal}
                                        size='small'
                                        trigger={<Button icon onClick={this.cache} className='funcbtn' title='缓存'><Icon id="cache-button" name='coffee' size='large'></Icon></Button>}
                                        >
                                        <Header icon>
                                            <Icon name='archive' />
                                            影像缓存中...
                                        </Header>
                                        <Modal.Content>
                                            <Progress value={this.state.currentIdx+1} total={this.state.imageIds.length} progress='ratio'/>
                                        </Modal.Content>
                                        </Modal> */}
                                    {/* {({ state, setState }) => (
                                        <Grid>
                                        <div>
                                            <pre>{JSON.stringify(state, null, 2)}</pre>
                                        </div>
                                        <div style={{ maxWidth: '300px', margin: '0 auto' }}>
                                            <CineDialog
                                            {...state}
                                            onClickSkipToStart={() =>
                                                setState({ lastChange: 'Clicked SkipToStart' })
                                            }
                                            onClickSkipToEnd={() =>
                                                setState({ lastChange: 'Clicked SkipToEnd' })
                                            }
                                            onClickNextButton={() => setState({ lastChange: 'Clicked Next' })}
                                            onClickBackButton={() => setState({ lastChange: 'Clicked Back' })}
                                            onLoopChanged={value => setState({ isLoopEnabled: value })}
                                            onFrameRateChanged={value => setState({ cineFrameRate: value })}
                                            onPlayPauseChanged={() => setState({ isPlaying: !state.isPlaying })}
                                            />
                                        </div>
                                        </Grid>
                                    )} */}
                                    <Button icon onClick={this.toHidebox} className='funcbtn' id='showNodule' title='显示结节'><Icon id="cache-button" name='eye' size='large'></Icon></Button>
                                    <Button icon onClick={this.toHidebox} className='funcbtn' id='hideNodule' title='隐藏结节'><Icon id="cache-button" name='eye slash' size='large'></Icon></Button>
                                    <Button icon onClick={this.toHideInfo} className='funcbtn' id='showInfo' title='显示信息'><Icon id="cache-button" name='content' size='large'></Icon></Button>
                                    <Button icon onClick={this.toHideInfo} className='funcbtn' id='hideInfo' title='隐藏信息'><Icon id="cache-button" name='delete calendar' size='large'></Icon></Button>
                                    <Button
                                    onClick={() => {
                                        this.setState({immersive: true})
                                    }}
                                    icon title='沉浸模式' className='funcbtn'><Icon name='expand arrows alternate' size='large'></Icon></Button>
                            </Button.Group>
                                </Menu.Item>
                                <span id='line-right'></span>
                                <Menu.Item className='funcolumn'>
                                    <Button.Group>
                                        {menuTools === 'anno'?
                                            <Button icon onClick={this.startAnnos} title='标注' className='funcbtn' active><Icon name='edit' size='large'></Icon></Button>:
                                            <Button icon onClick={this.startAnnos} title='标注' className='funcbtn'><Icon name='edit' size='large'></Icon></Button>
                                        }
                                        {menuTools === 'bidirect'?
                                            <Button icon onClick={this.bidirectionalMeasure} title='测量' className='funcbtn' active><Icon name='crosshairs' size='large'></Icon></Button>:
                                            <Button icon onClick={this.bidirectionalMeasure} title='测量' className='funcbtn'><Icon name='crosshairs' size='large'></Icon></Button>
                                        }
                                        {menuTools === 'length'?
                                            <Button icon onClick={this.lengthMeasure} title='长度' className='funcbtn' active><Icon name='arrows alternate vertical' size='large'></Icon></Button>:
                                            <Button icon onClick={this.lengthMeasure} title='长度' className='funcbtn'><Icon name='arrows alternate vertical' size='large'></Icon></Button>
                                        }
                                        {menuTools === 'slide'?
                                            <Button icon title='切换切片' onClick={this.slide} className='funcbtn' active><Icon name='sort' size='large'></Icon></Button>:
                                            <Button icon title='切换切片' onClick={this.slide} className='funcbtn'><Icon name='sort' size='large'></Icon></Button>
                                        }
                                        
                                        {menuTools === 'wwwc'?
                                            <Button icon title='窗宽窗位' onClick={this.wwwcCustom} className='funcbtn' active><Icon name='sliders' size='large'></Icon></Button>:
                                            <Button icon title='窗宽窗位' onClick={this.wwwcCustom} className='funcbtn'><Icon name='sliders' size='large'></Icon></Button>
                                        }
                                        {
                                            this.state.readonly?
                                            <Button icon title='提交' onClick={this.submit} className='funcbtn'><Icon name='upload' size='large'></Icon></Button>
                                            :
                                            // <Button icon title='暂存' onClick={this.temporaryStorage} className='funcbtn'><Icon name='inbox' size='large'></Icon></Button>
                                            <Button icon title='暂存' onClick={this.temporaryStorage} className='funcbtn'><Icon name='upload' size='large'></Icon></Button>
                                        }
                                        {
                                            this.state.readonly?
                                            null
                                            :
                                            <Button icon title='清空标注' onClick={this.clearUserNodule.bind(this)} className='funcbtn'><Icon name='user delete' size='large'></Icon></Button>
                                        }
                                        <Button title='3D' className='funcbtn' onClick={this.toSegView}>3D</Button>
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
                            {
                                windowHeight < windowWidth ? 
                                <Grid celled className='corner-contnt' >
                                    <Grid.Row className='corner-row' columns={3}>
                                        <Grid.Column width={2}>
                                            <StudyBrowserList caseId={this.state.caseId} handleClickScreen={this.props.handleClickScreen}/>
                                        </Grid.Column>
                                        <Grid.Column width={10} textAlign='center' style={{position:'relative'}}>
                                            <Grid celled style={{margin:0}}>
                                                {/* <Grid.Row columns={2} id='canvas-column' style={{height:this.state.windowHeight*37/40}}> */}
                                                <Grid.Row columns={2} id='canvas-column'>
                                                    <Grid.Column width={15} className='canvas-style' id='canvas-border'>
                                                    
                                                        {/* <div className='canvas-style' id='canvas-border'> */}
                                                            <div
                                                                    id="origin-canvas"
                                                                    style={{weight:this.state.windowHeight * 960/1080, height: this.state.windowHeight * 960/1080}}
                                                                    ref={input => {
                                                                    this.element = input
                                                                }}>
                                                                    <canvas className="cornerstone-canvas" id="canvas"/>
                                                                    {/* <canvas className="cornerstone-canvas" id="length-canvas"/> */}
                                                                    {/* {canvas} */}
                                                                    {dicomTagPanel} 
                                                            </div>

                                                        {/* </div> */}
                                                    </Grid.Column>
                                                    <Grid.Column width={1}>
                                                    <Slider
                                                        id='antd-slide' 
                                                        vertical
                                                        reverse
                                                        tipFormatter={null}
                                                        marks={sliderMarks} 
                                                        value={this.state.currentIdx+1} 
                                                        onChange={this.handleRangeChange}
                                                        // onAfterChange={this.handleRangeChange.bind(this)} 
                                                        min={1}
                                                        step={1}
                                                        max={this.state.stack.imageIds.length}
                                                        ></Slider>
                                                    </Grid.Column>
                                                </Grid.Row>
                                            </Grid>
                                        
                                        {/* <div className='antd-slider'> */}
                                            

                                        {/* </div> */}
                                        {visualContent}
                                        <button id='closeVisualContent' onClick={this.closeVisualContent}>×</button>
                                        </Grid.Column>
                                        <Grid.Column widescreen={4} computer={4}> 
                                            <Grid.Row>
                                                <div className="nodule-card-container">
                                                    <Tabs type="card" animated defaultActiveKey={1} size='small'>
                                                        <TabPane tab={noduleNumTab} key="1" >
                                                            
                                                            <div id='elec-table' style={{height:this.state.windowHeight*1/2}}>
                                                                <Accordion styled id="cornerstone-accordion" fluid onDoubleClick={this.doubleClickListItems.bind(this)}>
                                                                    {tableContent}
                                                                </Accordion>
                                                            </div>   
                                                        </TabPane>
                                                        {/* <TabPane tab={inflammationTab} key="2">
                                                        Content of Tab Pane 2
                                                        </TabPane>
                                                        <TabPane tab={lymphnodeTab} key="3">
                                                        Content of Tab Pane 3
                                                        </TabPane> */}
                                                    </Tabs>
                                                </div>
                                            </Grid.Row>
                                            <Grid.Row >
                                                <div id='report' style={{height:this.state.windowHeight/3}}>
                                                    <Tab menu={{ borderless: false, inverted: false, attached: true, tabular: true,size:'huge' }} 
                                                    panes={panes} />
                                                </div>
                                            </Grid.Row>
                                            
                                            
                                        </Grid.Column>
                                    </Grid.Row>
                                
                                </Grid>
                                :
                                <Grid celled className='corner-contnt' >
                                    <Grid.Row className='corner-row' columns={2}>
                                        <Grid.Column width={1}>
                                            <StudyBrowserList caseId={this.state.caseId} handleClickScreen={this.props.handleClickScreen}/>
                                        </Grid.Column>
                                        <Grid.Column width={15} textAlign='center' style={{position:'relative'}}>
                                        <Grid celled style={{margin:0}}>
                                                {/* <Grid.Row columns={2} id='canvas-column' style={{height:this.state.windowHeight*37/40}}> */}
                                                <Grid.Row columns={2} id='canvas-column'>
                                                    <Grid.Column width={15} className='canvas-style' id='canvas-border'>
                                                    
                                                        {/* <div className='canvas-style' id='canvas-border'> */}
                                                            <div
                                                                    id="origin-canvas"
                                                                    style={{weight:this.state.windowHeight * 960/1080, height: this.state.windowHeight * 960/1080}}
                                                                    ref={input => {
                                                                    this.element = input
                                                                }}>
                                                                    <canvas className="cornerstone-canvas" id="canvas"/>
                                                                    {/* <canvas className="cornerstone-canvas" id="length-canvas"/> */}
                                                                    {/* {canvas} */}
                                                                    {dicomTagPanel} 
                                                            </div>

                                                        {/* </div> */}
                                                    </Grid.Column>
                                                    <Grid.Column width={1}>
                                                    <Slider
                                                        id='antd-slide' 
                                                        vertical
                                                        reverse
                                                        tipFormatter={null}
                                                        marks={sliderMarks} 
                                                        value={this.state.currentIdx+1} 
                                                        onChange={this.handleRangeChange}
                                                        // onAfterChange={this.handleRangeChange.bind(this)} 
                                                        min={1}
                                                        step={1}
                                                        max={this.state.stack.imageIds.length}
                                                        ></Slider>
                                                    </Grid.Column>
                                                </Grid.Row>
                                            </Grid>
                                        
                                        {/* <div className='antd-slider'> */}
                                            

                                        {/* </div> */}
                                        {visualContent}
                                        <button id='closeVisualContent' onClick={this.closeVisualContent}>×</button>
                                            
                                        </Grid.Column>
                                    </Grid.Row>
                                    <Grid.Row className='corner-row' columns={2}>
                                        <Grid.Column width={10}>
                                                <div className="nodule-card-container">
                                                    <Tabs type="card" animated defaultActiveKey={1} size='small'>
                                                        <TabPane tab={noduleNumTab} key="1" >
                                                            
                                                            <div id='elec-table' style={{height:this.state.windowHeight*1/2}}>
                                                                <Accordion styled id="cornerstone-accordion" fluid onDoubleClick={this.doubleClickListItems.bind(this)}>
                                                                    {tableContent}
                                                                </Accordion>
                                                            </div>   
                                                        </TabPane>
                                                        {/* <TabPane tab={inflammationTab} key="2">
                                                        Content of Tab Pane 2
                                                        </TabPane>
                                                        <TabPane tab={lymphnodeTab} key="3">
                                                        Content of Tab Pane 3
                                                        </TabPane> */}
                                                    </Tabs>
                                                </div>
                                        </Grid.Column>
                                        <Grid.Column width={6}>
                                                <div id='report' style={{height:this.state.windowHeight/3}}>
                                                    <Tab menu={{ borderless: false, inverted: false, attached: true, tabular: true,size:'huge' }} 
                                                    panes={panes} />
                                                </div>
                                        </Grid.Column>
                                    </Grid.Row>
                                </Grid>

                            }
                        {/* </div> */}

                    </div>
                )
            // }

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
                            {/* <canvas className="cornerstone-canvas" id="length-canvas"/> */}
                            <div style={topLeftStyle}>{dicomTag.string('x00100010')}</div>
                            <div style={{position:'absolute',color:'white',top:'20px',left:'-95px'}}>{dicomTag.string('x00101010')} {dicomTag.string('x00100040')}</div>
                            <div style={{position:'absolute',color:'white',top:'35px',left:'-95px'}}>{dicomTag.string('x00100020')}</div>
                            <div style={{position:'absolute',color:'white',top:'50px',left:'-95px'}}>{dicomTag.string('x00185100')}</div>
                            <div style={{position:'absolute',color:'white',top:'65px',left:'-95px'}}>IM: {this.state.currentIdx + 1} / {this.state.imageIds.length}</div>
                            <div style={topRightStyle}>{dicomTag.string('x00080080')}</div>
                            <div style={{position:'absolute',color:'white',top:'20px',right:'-95px'}}>ACC No: {dicomTag.string('x00080050')}</div>
                            <div style={{position:'absolute',color:'white',top:'35px',right:'-95px'}}>{dicomTag.string('x00090010')}</div>
                            <div style={{position:'absolute',color:'white',top:'50px',right:'-95px'}}>{dicomTag.string('x0008103e')}</div>
                            <div style={{position:'absolute',color:'white',top:'65px',right:'-95px'}}>{dicomTag.string('x00080020')}</div>
                            <div style={{position:'absolute',color:'white',top:'80px',right:'-95px'}}>T: {dicomTag.string('x00180050')}</div>
                            <div style={{position:'absolute',color:'white',bottom:'20px',left:'-95px'}}>Offset: {this.state.viewport.translation['x'].toFixed(3)}, {this.state.viewport.translation['y'].toFixed(3)}
                            </div>
                            <div style={bottomLeftStyle}>Zoom: {Math.round(this.state.viewport.scale * 100)} %</div>
                            <div style={bottomRightStyle}>
                                WW/WC: {Math.round(this.state.viewport.voi.windowWidth)}
                                /{" "} {Math.round(this.state.viewport.voi.windowCenter)}
                            </div>

                        </div>

                    </div>

                    <div>
                        {/* <input
                            className="invisible"
                            id="slice-slider"
                            onChange={this.handleRangeChange}
                            type="range"
                            value={this.state.currentIdx + 1}
                            name="volume"
                            step="1"
                            min="1"
                            max={this.state.stack.imageIds.length}></input> */}
                        <div id="immersive-button-container">
                            {/* <p>{this.state.currentIdx + 1}
                                / {this.state.imageIds.length}</p> */}

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

        const canvas = document.getElementById("canvas")
        const context = canvas.getContext('2d')
        // ROIcontext.globalCompositeOperation = "copy"
        
        const xCenter = (box.x1 + (box.x2 - box.x1) / 2)
        const yCenter = (box.y1 + (box.y2 - box.y1) / 2)
        const width = box.x2 - box.x1
        const height = box.y2 - box.y1
        if (box.highlight === false || box.highlight === undefined) {
            context.setLineDash([])
            context.strokeStyle = 'yellow'
            context.fillStyle = 'yellow'
        } else {
            context.strokeStyle = 'blue'
            context.fillStyle = 'blue'
        }
        context.beginPath()
        const new_y1 = yCenter - height / 2
        context.rect(box.x1,box.y1,width,height)
        context.lineWidth = 1
        context.stroke()
        if (box.nodule_no != undefined) {
            context.fillText(parseInt(box.nodule_no)+1, xCenter - 3, new_y1 - 15)
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

    drawBidirection(box){
        if(box.measure !== null && box.measure !== undefined){
            const measureCoord = box.measure
            const ll = Math.sqrt(Math.pow((measureCoord.x1 - measureCoord.x2),2) + Math.pow((measureCoord.y1 - measureCoord.y2),2))
            const sl = Math.sqrt(Math.pow((measureCoord.x3 - measureCoord.x4),2) + Math.pow((measureCoord.y3 - measureCoord.y4),2))
            const radius = (box.x2 - box.x1)/2
            const canvas = document.getElementById("canvas")
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
            const dis = (x1-box.x1)*(x1-box.x1) + (y1-box.y1)*(y1-box.y1)
            for(var i=2; i<5; i++){
                var x = "x" + i
                var y = "y" + i
                var t_dis = (measureCoord[x]-box.x1)*(measureCoord[x]-box.x1) + (measureCoord[y]-box.y1)*(measureCoord[y]-box.y1)
                if(t_dis < dis){
                    anno_x = measureCoord[x]
                    anno_y = measureCoord[y]
                }
            }

            context.beginPath()
            context.moveTo(x1,y1)
            context.lineTo(x2,y2)
            // context.stroke()
            // context.beginPath()
            
            context.moveTo(x3,y3)
            context.lineTo(x4,y4)
            context.stroke()

            context.font = "10px Georgia"
            context.fillStyle = "yellow"
            context.fillText('L:'+ll.toFixed(1)+'mm',box.x1+radius+10, y1-radius-10)
            context.fillText('S:'+sl.toFixed(1)+'mm',box.x1+radius+10, y1-radius-20)
            
            context.beginPath();
            context.setLineDash([3, 3]);
            context.moveTo(anno_x-2,anno_y-2);
            context.lineTo(box.x1+radius+10, y1-radius-10);
            context.stroke();
            
            context.closePath()
        }
    }

    findCurrentArea(x, y) {
        // console.log('x, y', x, y)
        const lineOffset = 2;
        // for (var i = 0; i < this.state.selectBoxes.length; i++) {
        //     const box = this.state.selectBoxes[i]
        for (var i = 0; i < this.state.boxes.length; i++) {
            const box = this.state.boxes[i]
            if (box.slice_idx == this.state.currentIdx) {
                const xCenter = box.x1 + (box.x2 - box.x1) / 2;
                const yCenter = box.y1 + (box.y2 - box.y1) / 2;
                const width  = box.x2 - box.x1
                const height = box.y2 - box.y1
                const y1 = box.y1
                const x1 = box.x1
                const y2 = box.y2
                const x2 = box.x2
                if (x1 - lineOffset < x && x < x1 + lineOffset) {
                    if (y1 - lineOffset < y && y < y1 + lineOffset) {
                        return {box: i, pos: 'tl'};
                    } else if (y2 - lineOffset < y && y < y2 + lineOffset) {
                        return {box: i, pos: 'bl'};
                    // } else if (yCenter - lineOffset < y && y < yCenter + lineOffset) {
                    } else if (yCenter - height/2 + lineOffset < y && y < yCenter + height/2 - lineOffset) {
                        return {box: i, pos: 'l'};
                    }
                } else if (x2 - lineOffset < x && x < x2 + lineOffset) {
                    if (y1 - lineOffset < y && y < y1 + lineOffset) {
                        return {box: i, pos: 'tr'};
                    } else if (y2 - lineOffset < y && y < y2 + lineOffset) {
                        return {box: i, pos: 'br'};
                    // } else if (yCenter - lineOffset < y && y < yCenter + lineOffset) {
                    } else if (yCenter - height/2 + lineOffset < y && y < yCenter + height/2 - lineOffset) {
                        return {box: i, pos: 'r'};
                    }
                // } else if (xCenter - lineOffset < x && x < xCenter + lineOffset) {
                } else if (xCenter - width/2 + lineOffset < x && x < xCenter + width/2 - lineOffset) {
                    if (y1 - lineOffset < y && y < y1 + lineOffset) {
                        return {box: i, pos: 't'};
                    } else if (y2 - lineOffset < y && y < y2 + lineOffset) {
                        return {box: i, pos: 'b'};
                    } else if (y1 - lineOffset < y && y < y2 + lineOffset) {
                        return {box: i, pos: 'i'};
                    }
                } else if (x1 - lineOffset < x && x < x2 + lineOffset) {
                    if (y1 - lineOffset < y && y < y2 + lineOffset) {
                        return {box: i, pos: 'i'};
                    }
                }
            }
        }
        return {box: -1, pos: 'o'};
    }

    findMeasureArea(x,y){
        const lineOffset = 2;
        for (var i = 0; i < this.state.boxes.length; i++) {
            const box = this.state.boxes[i]
        // for (var i = 0; i < this.state.selectBoxes.length; i++) {
        //     const box = this.state.selectBoxes[i]
            if (box.slice_idx == this.state.currentIdx) {
                const xCenter = box.x1 + (box.x2 - box.x1) / 2;
                const yCenter = box.y1 + (box.y2 - box.y1) / 2;
                const width  = box.x2 - box.x1
                const height = box.y2 - box.y1
                const y1 = box.y1
                const x1 = box.x1
                const y2 = box.y2
                const x2 = box.x2
                if(x1 - lineOffset < x && x < x2 + lineOffset && y1 - lineOffset < y && y < y2 + lineOffset){
                    // console.log('measure',box.measure.x == undefined)
                    if(box.measure && box.measure.x1 != undefined){
                        if(box.measure.x1 - lineOffset < x && x < box.measure.x1 + lineOffset && box.measure.y1 - lineOffset < y && y < box.measure.y1 + lineOffset){
                            return {box: i, pos:'ib', m_pos:'sl'}
                        }
                        else if(box.measure.x2 - lineOffset < x && x < box.measure.x2 + lineOffset && box.measure.y2 - lineOffset < y && y < box.measure.y2 + lineOffset){
                            return {box: i, pos:'ib', m_pos:'el'}
                        }
                        else if(box.measure.x3 - lineOffset < x && x < box.measure.x3 + lineOffset && box.measure.y3 - lineOffset < y && y < box.measure.y3 + lineOffset){
                            return {box: i, pos:'ib', m_pos:'ss'}
                        }
                        else if(box.measure.x4 - lineOffset < x && x < box.measure.x4 + lineOffset && box.measure.y4 - lineOffset < y && y < box.measure.y4 + lineOffset){
                            return {box: i, pos:'ib', m_pos:'es'}
                        }
                        else if(box.measure.intersec_x - lineOffset < x && x < box.measure.intersec_x + lineOffset && box.measure.intersec_y - lineOffset < y && y < box.measure.intersec_y + lineOffset){
                            return {box: i, pos:'ib', m_pos:'cm'}
                        }
                    }
                    else{
                        console.log('om')
                        return {box: i, pos:'ib', m_pos:'om'}
                    }
                }
            }
        }
        return {box: -1, pos:'ob', m_pos:'om'}

    }

    drawLength(box){
        const x1 = box.x1
        const y1 = box.y1
        const x2 = box.x2
        const y2 = box.y2 
        const dis = Math.sqrt(Math.pow((x1-x2),2)+Math.pow((y1-y2),2)) / 10
        console.log("dis",dis)
        const canvas = document.getElementById("canvas")
        const context = canvas.getContext('2d')
        context.lineWidth = 1.5
        context.strokeStyle = 'yellow'
        context.fillStyle = 'yellow'
        context.beginPath()
        context.moveTo(x1,y1)
        context.lineTo(x2,y2)
        context.stroke()

        context.beginPath()
        context.arc(x1, y1, 3,0, 2*Math.PI)
        context.stroke()

        context.beginPath()
        context.arc(x2, y2, 3,0, 2*Math.PI)
        context.stroke()

        context.font = "10px Georgia"
        context.fillStyle = "yellow"
        if(x1 < x2){
            context.fillText(dis.toFixed(2)+'cm',x2+10, y2-10)
        }
        else{
            context.fillText(dis.toFixed(2)+'cm',x1+10, y1-10)
        }
        
        context.closePath()
    }

    findLengthArea(x,y){
        const lineOffset = 3
        for (var i = 0; i < this.state.lengthBox.length; i++) {
            const box = this.state.lengthBox[i]
            if(box.slice_idx === this.state.currentIdx){
                if(box.x1-lineOffset < x && box.x1+lineOffset > x && box.y1-lineOffset < y && box.y1+lineOffset > y){
                    return {box: i, pos: 'ib', m_pos: 'ul'}
                }
                else if(box.x2-lineOffset < x && box.x2+lineOffset > x && box.y2-lineOffset < y && box.y2+lineOffset > y){
                    return {box: i,pos: 'ib', m_pos: 'dl'}
                }
            }
        }
        return {box: -1, pos:'ob', m_pos: 'ol'}
    }

    handleRangeChange(e) {
        console.log('slider',e)
        // this.setState({currentIdx: event.target.value - 1, imageId:
        // this.state.imageIds[event.target.value - 1]})
        // let style = $("<style>", {type:"text/css"}).appendTo("head");

        // style.text('#slice-slider::-webkit-slider-runnable-track{background:linear-gradient(90deg,#0033FF 0%,#000033 '+ (event.target.value -1)*100/this.state.imageIds.length+'%)}');
        this.refreshImage(false, this.state.imageIds[e-1], e-1)
    }

    pixeldataSort(x, y){
        if (x < y) {
            return -1;
        } else if (x > y) {
            return 1;
        } else {
            return 0;
        }
    }

    noduleHist(x1, y1, x2, y2){
        const currentImage = this.state.currentImage
        console.log('currentImage',currentImage)
        let pixelArray = []
        const imageTag = currentImage.data
        const pixeldata = currentImage.getPixelData()
        const intercept = imageTag.string('x00281052')
        const slope = imageTag.string('x00281053')
        console.log('createBoxHist',intercept,slope)

        for(var i=~~x1;i<=x2;i++){
            for(var j=~~y1;j<=y2;j++){
                pixelArray.push(parseInt(slope) * parseInt(pixeldata[512*j+i]) + parseInt(intercept))
            }
        }
        console.log('pixelArray',pixelArray)
        pixelArray.sort(this.pixeldataSort)
        console.log('pixelArraySorted',pixelArray)
        // console.log('array',pixelArray)
        const data = pixelArray
        console.log('data',data)
        var map = {}
        for (var i = 0; i < data.length; i++) {
            var key = data[i]
            if (map[key]) {
                map[key] += 1
            } else {
                map[key] = 1
            }
        }
        Object.keys(map).sort(function(a,b){return map[b]-map[a]})
        console.log('map',map)
        
        var ns = []
        var bins = []
        for(var key in map){
            bins.push(parseInt(key))
            // ns.push(map[key])
        }
        bins.sort(this.pixeldataSort)

        for(var i=0;i<bins.length;i++){
            ns.push(map[bins[i]])
        }

        // for(var key in map){
        //     bins.push(parseInt(key))
        //     ns.push(map[key])
        // }
        console.log('bins',bins,ns)
        var obj = {}
        obj.bins = bins
        obj.n = ns
        return obj
    }


    createBox(x1, x2, y1, y2, slice_idx, nodule_idx) {
        console.log('coor',x1, x2, y1, y2)
        const imageId = this.state.imageIds[slice_idx]
        console.log('image',imageId)
        const nodule_hist = this.noduleHist(x1, y1, x2, y2)
        const newBox = {
            // "calcification": [], "lobulation": [],
            "malignancy": -1,
            "nodule_no": nodule_idx,
            "patho": "",
            "place": "",
            "probability": 1,
            "slice_idx": slice_idx,
            "nodule_hist":nodule_hist,
            // "spiculation": [], "texture": [],
            "x1": x1,
            "x2": x2,
            "y1": y1,
            "y2": y2,
            "highlight": false,
            "diameter":0.00,
            "place":0,
            "modified":1,
        }
        // let boxes = this.state.selectBoxes
        let boxes = this.state.boxes
        console.log("newBox", newBox)
        boxes.push(newBox)
        let measureStateList = this.state.measureStateList
        measureStateList.push(false)
        this.setState({boxes: boxes, measureStateList: measureStateList})
        console.log("Boxes", this.state.boxes, this.state.measureStateList)
            
        // })
        this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)    
    }

    createLength(x1, x2, y1, y2, slice_idx){
        const imageId = this.state.imageIds[slice_idx]
        const newLength = {
            "slice_idx": slice_idx,
            "x1": x1,
            "x2": x2,
            "y1": y1,
            "y2": y2,
        }
        let lengthList = this.state.lengthBox
        lengthList.push(newLength)
        this.setState({lengthBox: lengthList})
        this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)    
    }

    invertHandles(curBox){
        var x1 = curBox.measure.x1
        var y1 = curBox.measure.y1
        var x2 = curBox.measure.x2
        var y2 = curBox.measure.y2
        var x3 = curBox.measure.x3
        var y3 = curBox.measure.y3
        var x4 = curBox.measure.x4
        var y4 = curBox.measure.y4
        var length = Math.sqrt((x1 - x2)*(x1 - x2) + (y1 - y2)*(y1 - y2))
        var width = Math.sqrt((x3 - x4)*(x3 - x4) + (y3 - y4)*(y3 - y4))
        if(width > length){
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
//         "highlight": false,
//         "diameter":0.00,
//         "place":0,
//     }
//    }

    onWheel(event){
        // this.preventMouseWheel(event)
        var delta = 0;
        if(!event){
            event = window.event;
        }
        if(event.wheelDelta){
            delta = event.wheelDelta/120; 
            if(window.opera){
                delta = -delta;
            }
        }
        else if(event.detail){
            delta = -event.detail/3;
        }
        // console.log('delta',delta)
        if(delta){
            this.wheelHandle(delta)
        }   
    }

    onMouseOver(event){
        // console.log("mouseover")
        try{
            window.addEventListener("mousewheel",this.onWheel)||window.addEventListener("DOMMouseScroll",this.onWheel);
        }catch(e){
            window.attachEvent("mousewheel",this.onWheel);
        }
    }

    wheelHandle(delta){
        if (delta <0){//向下滚动
        let newCurrentIdx = this.state.currentIdx + 1
        if (newCurrentIdx < this.state.imageIds.length) {
            // this.setLoadTimer(newCurrentIdx)
            this.refreshImage(false, this.state.imageIds[newCurrentIdx], newCurrentIdx)

        }
        }
        else{//向上滚动
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

    segmentsIntr(a, b, c, d){  
  
        // 三角形abc 面积的2倍  
        var area_abc = (a.x - c.x) * (b.y - c.y) - (a.y - c.y) * (b.x - c.x);  
      
        // 三角形abd 面积的2倍  
        var area_abd = (a.x - d.x) * (b.y - d.y) - (a.y - d.y) * (b.x - d.x);   
      
        // 面积符号相同则两点在线段同侧,不相交 (对点在线段上的情况,本例当作不相交处理);  
        if ( area_abc*area_abd>=0 ) {  
            return false;  
        }  
      
        // 三角形cda 面积的2倍  
        var area_cda = (c.x - a.x) * (d.y - a.y) - (c.y - a.y) * (d.x - a.x);  
        // 三角形cdb 面积的2倍  
        // 注意: 这里有一个小优化.不需要再用公式计算面积,而是通过已知的三个面积加减得出.  
        var area_cdb = area_cda + area_abc - area_abd ;  
        if (  area_cda * area_cdb >= 0 ) {  
            return false;  
        }  
      
        //计算交点坐标  
        var t = area_cda / ( area_abd- area_abc );  
        var dx= t*(b.x - a.x),  
            dy= t*(b.y - a.y);  
        return { x: a.x + dx , y: a.y + dy };  
    }  

    onMouseMove(event) {
        // console.log('onmouse Move')
        const clickX = event.offsetX
        const clickY = event.offsetY
        let x = 0
        let y = 0
        if(this.state.leftButtonTools === 1){ 
            if(JSON.stringify(this.state.mouseClickPos) !== '{}'){
                if(JSON.stringify(this.state.mousePrePos) === '{}'){
                    this.setState({mousePrePos:this.state.mouseClickPos})
                }
                this.setState({mouseCurPos:{
                    'x':clickX,
                    'y':clickY
                }})
                const mouseCurPos = this.state.mouseCurPos
                const mousePrePos = this.state.mousePrePos
                const mouseClickPos = this.state.mouseClickPos
                const prePosition = mousePrePos.y - mouseClickPos.y
                const curPosition = mouseCurPos.y - mouseClickPos.y
                if(mouseCurPos.y !== mousePrePos.y){
                    let y_dia = mouseCurPos.y - mousePrePos.y
                    if(this.state.leftBtnSpeed !== 0){
                        var slice_len = Math.round(y_dia/this.state.leftBtnSpeed)
                        this.setState({slideSpan : Math.round(curPosition/this.state.leftBtnSpeed)})
                    if(y_dia > 0){
                        let newCurrentIdx = this.state.currentIdx + slice_len
                        if (newCurrentIdx < this.state.imageIds.length) {
                            this.refreshImage(false, this.state.imageIds[newCurrentIdx], newCurrentIdx)
                        }
                        else{
                            this.refreshImage(false, this.state.imageIds[this.state.imageIds.length-1], this.state.imageIds.length-1)
                        }
                    }
                    else{
                        let newCurrentIdx = this.state.currentIdx + slice_len
                        if (newCurrentIdx >= 0) {
                            this.refreshImage(false, this.state.imageIds[newCurrentIdx], newCurrentIdx)
                        }
                        else{
                            this.refreshImage(false, this.state.imageIds[0], 0)
                        }
                    }
                }
                    
            }
            this.setState({mousePrePos:mouseCurPos})
        }
    }
        else if(this.state.leftButtonTools === 0){ //Annos
            if (!this.state.immersive) {
                const transX = this.state.viewport.translation.x
                const transY = this.state.viewport.translation.y
                const scale = this.state.viewport.scale
                const halfValue = 256
                let offsetminus = document.getElementById('canvas').width/2
                x = (clickX - scale * transX - offsetminus) / scale + halfValue
                y = (clickY - scale * transY - offsetminus) / scale + halfValue
    
            } else {
                x = clickX / 2.5
                y = clickY / 2.5
            }
    
    
            let content = this.findCurrentArea(x, y)
            if (!this.state.clicked) {
                if (content.pos === 't' || content.pos === 'b') 
                    document.getElementById("canvas").style.cursor = "s-resize"
                else if (content.pos === 'l' || content.pos === 'r') 
                    document.getElementById("canvas").style.cursor = "e-resize"
                else if (content.pos === 'tr' || content.pos === 'bl') 
                    document.getElementById("canvas").style.cursor = "ne-resize"
                else if (content.pos === 'tl' || content.pos === 'br') 
                    document.getElementById("canvas").style.cursor = "nw-resize"
                else if (content.pos === 'i') 
                    document.getElementById("canvas").style.cursor = "grab"
                    // document.getElementById("canvas").style.cursor = "auto"
                else if (!this.state.clicked) 
                    document.getElementById("canvas").style.cursor = "auto"
            }
    
            if (this.state.clicked && this.state.clickedArea.box === -1) {  //mousedown && mouse is outside the annos
                let tmpBox = this.state.tmpBox 
                console.log('tmpbox',tmpBox)
                let tmpCoord = this.state.tmpCoord
                console.log('xy',x,y)
                tmpBox.x1 = tmpCoord.x1
                tmpBox.y1 = tmpCoord.y1
                tmpBox.x2 = x
                tmpBox.y2 = y
                this.setState({tmpBox: tmpBox})
                this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
            } else if (this.state.clicked && this.state.clickedArea.box !== -1) { //mousedown && mouse is inside the annos
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
                console.log("Current Box", currentBox)
                this.setState({boxes: boxes})
                this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
            }
        }
        else if(this.state.leftButtonTools === 3){
            if (!this.state.immersive) {
                const transX = this.state.viewport.translation.x
                const transY = this.state.viewport.translation.y
                const scale = this.state.viewport.scale
                const halfValue = 256
                let offsetminus = document.getElementById('canvas').width/2
                x = (clickX - scale * transX - offsetminus) / scale + halfValue
                y = (clickY - scale * transY - offsetminus) / scale + halfValue

            } else {
                x = clickX / 2.5
                y = clickY / 2.5
            }


            let content = this.findMeasureArea(x, y)
            // console.log('pos',content)
            if (!this.state.clicked) {
                if(content.m_pos === 'sl' || content.m_pos === 'el'){
                    document.getElementById("canvas").style.cursor = "se-resize"
                }
                else if(content.m_pos === 'ss' || content.m_pos === 'es'){
                    document.getElementById("canvas").style.cursor = "ne-resize"
                }
                else if (content.m_pos === 'cm') 
                    document.getElementById("canvas").style.cursor = "grab"
                else if (!this.state.clicked) 
                    document.getElementById("canvas").style.cursor = "auto"
            }
            // console.log('onmousemove',this.state.clicked && this.state.clickedArea.box !== -1 && this.state.clickedArea.m_pos === 'om',this.state.tmpCoord)
            if (this.state.clicked && this.state.clickedArea.box !== -1 && this.state.clickedArea.m_pos === 'om') {  //mousedown && mouse is inside the annos && ouside of measure
                let tmpBox = this.state.tmpBox //={}
                console.log('tmpBox',tmpBox)
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
                tmpBox.measure.x3 = newIntersect_x + vector_y * shortLength / 2
                tmpBox.measure.y3 = newIntersect_y - vector_x * shortLength / 2
                tmpBox.measure.x4 = newIntersect_x - vector_y * shortLength / 2
                tmpBox.measure.y4 = newIntersect_y + vector_x * shortLength / 2
                // tmpBox.measure.x3 = (tmpBox.measure.intersec_x + tmpCoord.x1) / 2
                // tmpBox.measure.y3 = (y + tmpBox.measure.intersec_y) / 2
                // tmpBox.measure.x4 = (x + tmpBox.measure.intersec_x) / 2
                // tmpBox.measure.y4 = (tmpBox.measure.intersec_y + tmpBox.measure.y1) / 2
                this.setState({tmpBox:tmpBox})
                console.log('tmpBox',tmpBox)
                this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
            } 
            else if (this.state.clicked && this.state.clickedArea.box !== -1 && this.state.clickedArea.m_pos !== 'om') { //mousedown && mouse is inside the annos && inside the measure
                // let boxes = this.state.selectBoxes
                let boxes = this.state.boxes
                let currentBox = boxes[this.state.clickedArea.box]
                if(this.state.clickedArea.m_pos === 'sl'){
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
                        var distancePS = Math.sqrt((perpendicularStart_x - oldIntersect_x) * (perpendicularStart_x - oldIntersect_x) + (perpendicularStart_y - oldIntersect_y) * (perpendicularStart_y - oldIntersect_y))
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
                    
                }
                else if(this.state.clickedArea.m_pos === 'el'){
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
                        var distancePS = Math.sqrt((perpendicularStart_x - oldIntersect_x) * (perpendicularStart_x - oldIntersect_x) + (perpendicularStart_y - oldIntersect_y) * (perpendicularStart_y - oldIntersect_y))
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
                   
                }
                else if(this.state.clickedArea.m_pos === 'ss'){
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
                    var highNumber = Number.MAX_SAFE_INTEGER; 
                    var helperLine = {
                        start: {x: x,y: y},
                        end: {
                          x: x - vector_y * highNumber,
                          y: y + vector_x * highNumber
                        }
                      }
                    var longLine = {
                        start: {x: start_x,y: start_y},
                        end: {x:currentBox.measure.x2, y: currentBox.measure.y2}
                    }
                    var newIntersection = this.segmentsIntr(helperLine.start,helperLine.end,longLine.start,longLine.end)
                    console.log('newIntersection',newIntersection)
                    var distanceToFixed = Math.sqrt((oldIntersect_x - fixedPoint_x) * (oldIntersect_x - fixedPoint_x) + (oldIntersect_y - fixedPoint_y) * (oldIntersect_y - fixedPoint_y))
                    if (newIntersection) {
                        currentBox.measure.x3 = x
                        currentBox.measure.y3 = y
                        currentBox.measure.x4 = newIntersection.x - vector_y * distanceToFixed
                        currentBox.measure.y4 = newIntersection.y + vector_x * distanceToFixed
                        currentBox.measure.intersec_x = newIntersection.x
                        currentBox.measure.intersec_y = newIntersection.y
                    }
                }
                else if(this.state.clickedArea.m_pos === 'es'){
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
                    var highNumber = Number.MAX_SAFE_INTEGER; 
                    var helperLine = {
                        start: {x: x,y: y},
                        end: {
                          x: x + vector_y * highNumber,
                          y: y - vector_x * highNumber
                        }
                      }
                    var longLine = {
                        start: {x: start_x,y: start_y},
                        end: {x:currentBox.measure.x2, y: currentBox.measure.y2}
                    }
                    var newIntersection = this.segmentsIntr(helperLine.start,helperLine.end,longLine.start,longLine.end)
                    console.log('newIntersection',newIntersection)
                    var distanceToFixed = Math.sqrt((oldIntersect_x - fixedPoint_x) * (oldIntersect_x - fixedPoint_x) + (oldIntersect_y - fixedPoint_y) * (oldIntersect_y - fixedPoint_y))
                    if (newIntersection) {
                        currentBox.measure.x3 = newIntersection.x + vector_y * distanceToFixed
                        currentBox.measure.y3 = newIntersection.y - vector_x * distanceToFixed
                        currentBox.measure.x4 = x
                        currentBox.measure.y4 = y
                        currentBox.measure.intersec_x = newIntersection.x
                        currentBox.measure.intersec_y = newIntersection.y
                    }
                }
                else if(this.state.clickedArea.m_pos === 'cm'){
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
                console.log("Current Box", currentBox)
                this.setState({boxes: boxes})
                this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
            }
        }
        else if(this.state.leftButtonTools === 4){
            if (!this.state.immersive) {
                const transX = this.state.viewport.translation.x
                const transY = this.state.viewport.translation.y
                const scale = this.state.viewport.scale
                const halfValue = 256
                let offsetminus = document.getElementById('canvas').width/2
                x = (clickX - scale * transX - offsetminus) / scale + halfValue
                y = (clickY - scale * transY - offsetminus) / scale + halfValue

            } else {
                x = clickX / 2.5
                y = clickY / 2.5
            }
            let content = this.findLengthArea(x,y)
            if(!this.state.clicked){
                if(content.m_pos === 'ul'){
                    //
                }
            }
            if (this.state.clicked && this.state.clickedArea.box === -1) {  //mousedown && mouse is outside the annos
                let tmpBox = this.state.tmpBox 
                console.log('tmpbox',tmpBox)
                let tmpCoord = this.state.tmpCoord
                console.log('xy',x,y)
                tmpBox.x1 = tmpCoord.x1
                tmpBox.y1 = tmpCoord.y1
                tmpBox.x2 = x
                tmpBox.y2 = y
                this.setState({tmpBox: tmpBox})
                this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
            } else if (this.state.clicked && this.state.clickedArea.box !== -1) {
                let lengthBox = this.state.lengthBox
                let currentLength = lengthBox[this.state.clickedArea.box]
                if(this.state.clickedArea.m_pos === 'ul'){
                    currentLength.x1 = x
                    currentLength.y1 = y
                }
                else if(this.state.clickedArea.m_pos === "dl"){
                    currentLength.x2 = x
                    currentLength.y2 = y
                }
                lengthBox[this.state.clickedArea.box] = currentLength
                this.setState({lengthBox: lengthBox})
                this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
            }
        }
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
        if (event.which == 37 ) {
            // console.log('active item',document.activeElement,document.getElementsByClassName("ant-slider-handle")[0])
            if(document.getElementsByClassName("ant-slider-handle")[0]!==document.activeElement){
                event.preventDefault()
                let newCurrentIdx = this.state.currentIdx - 1
                if (newCurrentIdx >= 0) {
                    this.refreshImage(false, this.state.imageIds[newCurrentIdx], newCurrentIdx)
                }
            }
            
        }
        if(event.which == 38){
            //切换结节list
            event.preventDefault()
            const listsActiveIndex = this.state.listsActiveIndex
            if(listsActiveIndex > 0)
                this.keyDownListSwitch(listsActiveIndex-1)
        }
        if (event.which == 39) {
            if(document.getElementsByClassName("ant-slider-handle")[0]!==document.activeElement){
                event.preventDefault()
                let newCurrentIdx = this.state.currentIdx + 1
                if (newCurrentIdx < this.state.imageIds.length) {
                    this.refreshImage(false, this.state.imageIds[newCurrentIdx], newCurrentIdx)
                    // console.log('info',cornerstone.imageCache.getCacheInfo())
                }
            }
            
        }
        if(event.which == 40){
            //切换结节list
            event.preventDefault()
            const listsActiveIndex = this.state.listsActiveIndex
            // const boxes = this.state.selectBoxes
            let boxes = this.state.boxes
            if(listsActiveIndex < boxes.length-1){
                console.log("listsActiveIndex",listsActiveIndex)
                this.keyDownListSwitch(listsActiveIndex+1)
            }
            else if(listsActiveIndex === boxes.length - 1){
                console.log("listsActiveIndex",listsActiveIndex)
                this.keyDownListSwitch(0)
            }
                
        }
        if (event.which == 72) {
            this.toHidebox() 
        }
    }

    onMouseDown(event) {
        // console.log('onmouse Down')
        if (event.button == 0) {
            const clickX = event.offsetX
            const clickY = event.offsetY
            this.setState({mouseClickPos:{
                'x':clickX,
                'y':clickY
            }})
            console.log(this.state.mouseClickPos)
            let x = 0
            let y = 0

            if (!this.state.immersive) {
                const transX = this.state.viewport.translation.x
                const transY = this.state.viewport.translation.y
                const scale = this.state.viewport.scale

                const halfValue = 256 //256
                let offsetminus = document.getElementById('canvas').width/2
                // console.log('off',offsetminus)
                x = (clickX - scale * transX - offsetminus) / scale + halfValue
                y = (clickY - scale * transY - offsetminus) / scale + halfValue

            } else {
                x = clickX / 2.5
                y = clickY / 2.5
            }

            if(this.state.leftButtonTools === 0){
                const coords = {
                    x1: x,
                    x2: x,
                    y1: y,
                    y2: y
                }
                let content = this.findCurrentArea(x, y)
                if (content.pos === 'o') {
                    document
                        .getElementById("canvas")
                        .style
                        .cursor = "crosshair"
                }
                else{
                    document
                        .getElementById("canvas")
                        .style
                        .cursor = "auto"
                }
                this.setState({clicked: true, clickedArea: content, tmpCoord: coords})
            }
            else if(this.state.leftButtonTools === 3){ //bidirection
                const coords = {
                    x1: x, //start
                    y1: y,
                    x2: x, //end
                    y2: y,
                    x3 :x,
                    y3 :y,
                    x4: x,
                    y4: y,
                    intersec_x: x,
                    intersec_y: y,
                }
                let content = this.findMeasureArea(x,y)
                console.log('cotnt',content)
                this.setState({clicked: true, clickedArea: content, tmpCoord: coords})
            }
            else if(this.state.leftButtonTools === 4){ //length
                const coords = {
                    x1: x,
                    x2: x,
                    y1: y,
                    y2: y
                }
                let content = this.findLengthArea(x,y)
                console.log("contnt", content)
                this.setState({clicked: true, clickedArea: content, tmpCoord: coords})
            }
            // this.setState({clicked: true, clickedArea: content, tmpBox: coords})
            
        }
        else if(event.button == 1){
            event.preventDefault()
        }
    }

    onMouseOut(event) {
        // console.log('onmouse Out')
        try{
            window.removeEventListener("mousewheel",this.onWheel)||window.removeEventListener("DOMMouseScroll",this.onWheel);
        }catch(e){
            window.detachEvent("mousewheel",this.onWheel);
        }
        if (this.state.clicked) {
            this.setState({clicked: false, tmpBox: {}, tmpCoord:{}, clickedArea: {}})
        }

    }

    onMouseUp(event) {
        if (this.state.clickedArea.box === -1 && this.state.leftButtonTools === 0) {
            const x1 = this.state.tmpBox.x1
            const y1 = this.state.tmpBox.y1
            const x2 = this.state.tmpBox.x2
            const y2 = this.state.tmpBox.y2
            let newNodule_no = -1
            // const boxes = this.state.selectBoxes
            let boxes = this.state.boxes
            for (var i = 0; i < boxes.length; i++) {
                const current_nodule_no = parseInt(boxes[i].nodule_no)
                if (current_nodule_no > newNodule_no) {
                    newNodule_no = current_nodule_no
                }
            }
            this.createBox(x1, x2, y1, y2, this.state.currentIdx, (1+newNodule_no).toString())
            // this.createBox(this.state.tmpBox, this.state.currentIdx, (1+newNodule_no).toString())
        }
        if(this.state.clickedArea.box !== -1 && this.state.leftButtonTools === 3 && event.button === 0 && this.state.clickedArea.m_pos === 'om'){
            console.log('tmpBox',this.state.tmpBox)
            // const boxes = this.state.selectBoxes
            let boxes = this.state.boxes
            let currentBox = boxes[this.state.clickedArea.box]
            currentBox.measure = {}
            console.log('currentBox',currentBox)
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
            this.setState({boxes:boxes, measureStateList: measureStateList})
            this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
            console.log('box',this.state.boxes)
        }

        if(this.state.clickedArea.box !== -1 && this.state.leftButtonTools === 3 && event.button === 0 && this.state.clickedArea.m_pos !== 'om'){
            // const boxes = this.state.selectBoxes
            let boxes = this.state.boxes
            let currentBox = boxes[this.state.clickedArea.box]
            var invertBox = this.invertHandles(currentBox)
            boxes[this.state.clickedArea.box] = invertBox
            this.setState({boxes:boxes})
            this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
        }

        if(this.state.clickedArea.box === -1 && this.state.leftButtonTools === 4 ){
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
            tmpCoord:{},
            mouseClickPos:{},
            mousePrePos:{},
            mouseCurPos:{},
            slideSpan:0
            // measureStateList:measureStateList
            // random: Math.random()
        })
        document
            .getElementById("canvas")
            .style
            .cursor = "auto"
        
    }

    onRightClick(event) {
        event.preventDefault()
    }

    doubleClickListItems(e){
        console.log('doubleclick')
        this.setState({doubleClick:true})
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

    imagesFilp(){
        let viewport = cornerstone.getViewport(this.element)
        if(viewport.invert === true){
            viewport.invert = false;
        } else {
            viewport.invert = true;
        }
        cornerstone.setViewport(this.element, viewport)
        this.setState({viewport, menuTools:''})
    }

    ZoomIn(){//放大
        let viewport = cornerstone.getViewport(this.element)
        // viewport.translation = {
        //     x: 0,
        //     y: 0
        // }
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
        // viewport.translation = {
        //     x: 0,
        //     y: 0
        // }
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
        this.setState({viewport,menuTools:''})
        console.log("to pulmonary", viewport)
    }

    toMedia() {//纵隔窗
        let viewport = cornerstone.getViewport(this.element)
        viewport.voi.windowWidth = 500
        viewport.voi.windowCenter = 50
        cornerstone.setViewport(this.element, viewport)
        this.setState({viewport,menuTools:''})
        console.log("to media", viewport)
    }

    toBoneWindow() {//骨窗
        let viewport = cornerstone.getViewport(this.element)
        viewport.voi.windowWidth = 1000
        viewport.voi.windowCenter = 300
        cornerstone.setViewport(this.element, viewport)
        this.setState({viewport,menuTools:''})
        console.log("to media", viewport)
    }

    toVentralWindow() {//腹窗
        let viewport = cornerstone.getViewport(this.element)
        viewport.voi.windowWidth = 400
        viewport.voi.windowCenter = 40
        cornerstone.setViewport(this.element, viewport)
        this.setState({viewport,menuTools:''})
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
        // let currentBox = this.state.selectBoxes
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
                window.location.href = '/'
            }
        }).catch((error) => {
            console.log("ERRRRROR", error);
        })
    }

    //暂存结节
    temporaryStorage() {
        alert("已保存当前结果!")
        this.setState({
            random: Math.random(),
            menuTools:''
        })
    }
    nextPath(path) {
        this.props.history.push(path)
    } 
    submit(){
        console.log('createuser')
        const token = localStorage.getItem('token')
        let boxes = this.state.boxes
        // const selectBoxes = this.state.selectBoxes
        // const selectBoxesMapIndex = this.state.selectBoxesMapIndex
        // let deleteBoxes=[]

        // for(let i=0;i<selectBoxesMapIndex.length;i++){//仅修改
        //     if(selectBoxes[i]!=="delete"){
        //         boxes[selectBoxes[i]]=selectBoxes[i]
        //     }
        //     else{
        //         deleteBoxes.push(selectBoxesMapIndex[i])//存在删除情况
        //     }
        // }

        // for(let i=0;i<deleteBoxes.length;i++){//存在删除情况
        //     boxes.splice(deleteBoxes[i], 1)
        //     for (let i = deleteBoxes[i]; i < boxes.length; i++) {
        //         boxes[i].nodule_no=(parseInt(boxes[i].nodule_no)-1).toString()
        //     }       
        // }
        

        const headers = {
            'Authorization': 'Bearer '.concat(token)
        }
        const params = {
            caseId: this.state.caseId,
            // username:this.state.username,
            newRectStr: JSON.stringify(boxes)
        }
        axios.post(draftConfig.createUser, qs.stringify(params), {headers}).then(res => {
            console.log(res)
            if (res.data.status === 'okay') {
                console.log('createUser')
                // this.nextPath(res.data.nextPath)
                window.location.href=res.data.nextPath
            }
            else if(res.data.status === 'alreadyExisted'){
                console.log('alreadyExistedUser')
                // this.nextPath(res.data.nextPath)
                window.location.href=res.data.nextPath
            }
        }).catch(err => {
            console.log('err: ' + err)
        })
    }

    clearUserNodule(){
        if(window.confirm("是否删除当前用户标注？") == true){
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
                    window.location.href =window.location.pathname.split('/')[0]+
                    '/'+window.location.pathname.split('/')[1]+'/'+window.location.pathname.split('/')[2]+'/deepln'
                } else {
                    alert("出现错误,请联系管理员！")
                }
            }).catch(err => {
                console.log(err)
            })
        }
        
    }

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
        this.setState({menuTools:''})
        console.log('token', token)
        const headers = {
            'Authorization': 'Bearer '.concat(token)
        }
        const params = {
            caseId: this.state.caseId,
            username:this.state.username
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
        const element = document.getElementById("origin-canvas")
        const viewport = cornerstone.getViewport(element)
        if (this.state.showNodules === true && this.state.caseId === window.location.pathname.split('/')[2]) {
            for (let i = 0; i < this.state.boxes.length; i++) {
                // if (this.state.boxes[i].slice_idx == this.state.currentIdx && this.state.immersive == false) 
                if (this.state.boxes[i].slice_idx == this.state.currentIdx){
                     this.drawBoxes(this.state.boxes[i])
                    //  this.drawMask(this.state.boxes[i])
                     if(this.state.measureStateList[i]){
                        this.drawBidirection(this.state.boxes[i])
                    }
                    // if(this.state.maskStateList[i]){
                    //     this.drawMask(this.state.boxes[i])
                    // }
                }    
            }
            for(let i=0; i<this.state.lengthBox.length; i++){
                if(this.state.lengthBox[i].slice_idx === this.state.currentIdx){
                    this.drawLength(this.state.lengthBox[i])
                }
            }
        }


        // console.log('bool',this.state.clicked && this.state.clickedArea.box !== -1 && this.state.leftButtonTools === 3,this.state.clicked,this.state.clickedArea.box,this.state.leftButtonTools)
        if (this.state.clicked && this.state.clickedArea.box == -1 && this.state.leftButtonTools == 0) { 
            this.drawBoxes(this.state.tmpBox)
        }
        else if(this.state.clicked && this.state.clickedArea.box !== -1 && this.state.leftButtonTools === 3){
            this.drawBidirection(this.state.tmpBox)
        }
        else if(this.state.clicked && this.state.leftButtonTools === 4){
            this.drawLength(this.state.tmpBox)
        }

        this.setState({viewport})
    }

    onNewImage() {
        // console.log("onNewImage") const enabledElement =
        // cornerstone.getEnabledElement(this.element) this.setState({imageId:
        // enabledElement.image.imageId})
    }

    resizeScreen(e){
        // let canva = document.getElementById('origin-canvas')
        // // canva.style.width = e.target.innerWidth * 400/1920
        // canva.style.width = document.body.clientWidth * 860/1920
        // canva.style.height = canva.style.width

        let canvasColumn = document.getElementById('canvas-column')
        let report = document.getElementById('report')
        let list = document.getElementsByClassName('nodule-card-container')[0]
        report.style.height = canvasColumn.clientHeight/3+'px'
        list.style.height = canvasColumn.clientHeight*2/3+'px'
        console.log('resizeBrowser',report.clientHeight,list.clientHeight,canvasColumn.clientHeight)
        // this.setState({windowWidth:document.body.clientWidth, windowHeight:document.body.clientHeight})
        this.setState({windowWidth:e.target.innerWidth, windowHeight:e.target.innerHeight})
        
    }

    firstLayout(){
        let canvasColumn = document.getElementById('canvas-column')
        let report = document.getElementById('report')
        let list = document.getElementsByClassName('nodule-card-container')[0]
        report.style.height = canvasColumn.clientHeight/3+'px'
        list.style.height = canvasColumn.clientHeight*2/3+'px'
        // let closeHistogram = document.getElementById('closeVisualContent')
        // let histogram = document.getElementsByClassName('histogram')[0]
        

        this.setState({firstlayout:1})
    }

    refreshImage(initial, imageId, newIdx) {
        // let style = $("<style>", {type:"text/css"}).appendTo("head");
        // style.text('#slice-slider::-webkit-slider-runnable-track{background:linear-gradient(90deg,#0033FF 0%,#000033 '+ (newIdx -1)*100/this.state.imageIds.length+'%)}');
        this.setState({autoRefresh: false})

        if (!initial) {
            this.setState({currentIdx: newIdx})
        }

        // const element = this.element

        // const element = document.getElementById('origin-canvas')
        const element = document.querySelector('#origin-canvas');
        // console.log('element',element)
        // console.log('element',element)
        if (initial) {
            cornerstone.enable(element)
            console.log('enable',cornerstone.enable(element))
            
        } else {
            cornerstone.getEnabledElement(element)
            // console.log(cornerstone.getEnabledElement(element))
        }
        // console.log('imageLoader',cornerstone.loadImage(imageId))
        cornerstone
            .loadImage(imageId)
            .then(image => {
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
                if(element !== undefined){
                    cornerstone.displayImage(element, image)
                    
                }
                
                this.setState({currentImage: image})
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
                if(initial){
                    let viewport = {
                        invert: false,
                        pixelReplication: false,
                        voi: {
                        windowWidth: 1600,
                        windowCenter: -600
                        },
                        scale : document.getElementById('canvas').width/512,
                        translation: {
                          x: 0,
                          y: 0
                        },
                    }
                    cornerstone.setViewport(this.element, viewport)
                    this.setState({viewport})
                    if (!this.state.immersive) {
                        cornerstoneTools.addToolForElement(element, pan)
                        cornerstoneTools.setToolActiveForElement(
                            element,
                            'Pan',
                            {
                                mouseButtonMask:4, //middle mouse button
                            },
                            ['Mouse']

                        )
                        cornerstoneTools.addToolForElement(element, zoomWheel)
                        cornerstoneTools.setToolActiveForElement(
                            element,
                            'Zoom',
                            { 
                                mouseButtonMask: 2,
                            }
                        )
                }
                
            element.addEventListener("cornerstoneimagerendered", this.onImageRendered)
            element.addEventListener("cornerstonenewimage", this.onNewImage)
            element.addEventListener("contextmenu", this.onRightClick)
            // if (!this.state.readonly) {
            element.addEventListener("mousedown", this.onMouseDown)
            element.addEventListener("mousemove", this.onMouseMove)
            element.addEventListener("mouseup", this.onMouseUp)
            element.addEventListener("mouseout", this.onMouseOut)
            element.addEventListener("mouseover",this.onMouseOver)
            // }

            document.addEventListener("keydown", this.onKeydown)
            window.addEventListener('resize', this.resizeScreen.bind(this))
            }
                // window.addEventListener("resize", this.onWindowResize) if (!initial) {
                // this.setState({currentIdx: newIdx}) }
            })
            // console.log('imageobject',imageobject)
    }

    cacheImage(imageId){

        cornerstone.loadAndCacheImage(imageId)
        // cornerstone.ImageCache(imageId)
        // console.log('info',cornerstone.imageCache.getCacheInfo(),imageId)
    }

    cache() {//coffee button
        for (var i = this.state.imageIds.length - 1; i >= 0; i--) {
            this.refreshImage(false, this.state.imageIds[i], i)
            // console.log('info',cornerstone.imageCache.getCacheInfo())
        }
    }

    checkHash() {
        const noduleNo = this.props.stack.noduleNo
        if (this.state.boxes[noduleNo] !== undefined) {
            const boxes = this.state.boxes
            const toIdx = this.state.boxes[noduleNo].slice_idx
            boxes[noduleNo].highlight = true
            // console.log("1464:", boxes)

            this.setState({
                boxes: boxes, currentIdx: toIdx,
                // autoRefresh: true
            })
        }
    }

    componentWillMount() {
        // this.checkHash()
    }

    componentDidMount() {
        // this.getNoduleIfos()
        // this.visualize()
        if (localStorage.getItem('token')==null) {
            sessionStorage.setItem('location',window.location.pathname.split('/')[0]+
                '/'+window.location.pathname.split('/')[1]+'/'+window.location.pathname.split('/')[2]+'/'+
                window.location.pathname.split('/')[3])
                window.location.href = '/'
        }
        document.getElementById('header').style.display = 'none'
        // const width = document.body.clientWidth
        // const height = document.body.clientHeight
        // // const width = window.outerHeight
        // this.setState({windowWidth : width, windowHeight: height})
        
        const imageIds = this.state.imageIds
        // for(let i=0;i<this.state.boxes.length;i++){
        //     let slice_idx = this.state.boxes[i].slice_idx
        //     console.log("cornerstone",slice_idx,imageIds[slice_idx])
        //     for(let j=slice_idx-5;j<slice_idx+5;j++){
        //         cornerstone.loadAndCacheImage(imageIds[j])
        //     }
        // }
        
        const promises = imageIds.map(imageId=> {
            // console.log(imageId)
            return cornerstone.loadAndCacheImage(imageId)
        })
        Promise.all(promises).then(()=> {
        // console.log("111",promise)
    })
        this.refreshImage(true, this.state.imageIds[this.state.currentIdx], undefined)
        
        this.firstLayout()
        const token = localStorage.getItem('token')
        const headers = {
            'Authorization': 'Bearer '.concat(token)
        }
        const params = {
            caseId: this.state.caseId
        }
        const okParams = {
            caseId: this.state.caseId,
            username: window
                .location
                .pathname
                .split('/')[3]
        }
        console.log('token', token)
        console.log('okParams', okParams)

        axios.post(reviewConfig.isOkayForReview, qs.stringify(okParams), {headers}).then(res => {
            // console.log('1484', res)
        }).catch(err => {
            console.log(err)
        })
        
        if(document.getElementById('hideNodule') != null){
            document.getElementById('hideNodule').style.display='none'
        }
        if(document.getElementById('hideInfo') != null){
            document.getElementById('hideInfo').style.display='none'
        }
     
        document.getElementById('closeVisualContent').style.display = 'none'

        if(this.state.imageIds.length !==0){
            const leftBtnSpeed = Math.floor(document.getElementById('canvas').offsetWidth / this.state.imageIds.length)
            this.setState({leftBtnSpeed:leftBtnSpeed})
        }

        // var stateListLength = this.state.selectBoxes.length
        var stateListLength = this.state.boxes.length
        var measureArr = new Array(stateListLength).fill(true)
        // console.log('measureArr',measureArr)
        this.setState({measureStateList:measureArr})

        
        var maskArr = new Array(stateListLength).fill(true)
        this.setState({maskStateList:maskArr})
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
        const element = this.element
        element.removeEventListener("cornerstoneimagerendered", this.onImageRendered)

        element.removeEventListener("cornerstonenewimage", this.onNewImage)

        // window.removeEventListener("resize", this.onWindowResize)
        document.removeEventListener("keydown", this.onKeydown)
        window.removeEventListener('resize', this.resizeScreen.bind(this))
        // cornerstone.disable(element)
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.currentIdx !== this.state.currentIdx && this.state.autoRefresh === true) {
            this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
        }

        if (prevState.immersive !== this.state.immersive) {
            this.refreshImage(true, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
            if(document.getElementById('hideNodule') != null){
                document.getElementById('hideNodule').style.display='none'
            }
            if(document.getElementById('hideInfo') != null){
                document.getElementById('hideInfo').style.display='none'
            }
        }
        

        if (prevState.random !== this.state.random) {
            console.log('random change',this.state.boxes)
            this.saveToDB()
        }


        if(prevState.listsActiveIndex!==-1 && prevState.listsActiveIndex !== this.state.listsActiveIndex){
            const visId = 'visual-' + prevState.listsActiveIndex
            if(document.getElementById(visId) !== undefined && document.getElementById(visId) !== null){
                // document.getElementById(visId).innerHTML=''
                document.getElementById(visId).style.display='none'
                document.getElementById('closeVisualContent').style.display = 'none'
            }
            else{
                console.log('visId is not exist!')
            }
            console.log('listsActiveIndex',prevState.listsActiveIndex,this.state.listsActiveIndex)
            // document.
        }
        if(prevState.listsActiveIndex !== -1 && this.state.listsActiveIndex === -1){
            this.setState({preListActiveIdx : prevState.listsActiveIndex})
        }
    }
}

export default withRouter(CornerstoneElement)
