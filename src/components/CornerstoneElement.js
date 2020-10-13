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
import {  Grid, Table, Icon, Button, Accordion, Checkbox, Modal,Dropdown,Popup,Form,Tab, Container, Image, Menu,Label, Card, Header,Progress } from 'semantic-ui-react'
import '../css/cornerstone.css'
import qs from 'qs'
// import { config } from "rxjs"
import axios from "axios"
import { Slider } from "antd"
// import { Slider, RangeSlider } from 'rsuite'
import MiniReport from './MiniReport'
// import { Dropdown } from "antd"
import { Chart } from '@antv/g2'
import DataSet from '@antv/data-set'
import src1 from '../images/scu-logo.jpg'
import $ from  'jquery'
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
// const csTools = cornerstoneTools.init();
// const mouseInput = cornerstoneTools.mouseInput;
// const mouseWheelInput  =cornerstoneTools.mouseWheelInput
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
const {Column, HeaderCell, Cell, Pagination} = Table
let allROIToolData = {}
let toolROITypes = ['EllipticalRoi','Bidirectional']
let playTimer = undefined
// , 'RectangleRoi', 'ArrowAnnotate', 'Length', 'CobbAngle', 'Angle', 'FreehandRoi', 'Calibration'
// const divStyle = {
//     width: "512px",//768px
//     height: "512px",
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
    left: "-95px",
    position: "absolute",
    color: "white"
}

const bottomRightStyle = {
    bottom: "5px",
    right: "-95px",
    position: "absolute",
    color: "white"
}

const topLeftStyle = {
    top: "5px",
    left: "-95px", // 5px
    position: "absolute",
    color: "white"
}

const topRightStyle = {
    top: "5px",
    right: "-95px", //5px
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
    

class CornerstoneElement extends Component {
    constructor(props) {
        super(props)
        this.state = {
            caseId: props.caseId,
            username:props.username,
            stack: props.stack,
            viewport: cornerstone.getDefaultViewport(null, undefined),
            imageIds: props.stack.imageIds===""?[]:props.stack.imageIds,
            currentIdx: 0,
            autoRefresh: false,
            boxes: props.stack.boxes===""?[]:props.stack.boxes,
            clicked: false,
            clickedArea: {},
            tmpCoord:{},
            tmpBox: {},
            showNodules: true,
            immersive: false,
            readonly: props.stack.readonly,
            activeIndex: -1,//右上方results活动item
            listsActiveIndex:-1,//右方list活动item
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
            measureList:[],
            toolState:'',
            leftButtonTools:1, //0-标注，1-切片切换，2-wwwc
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
            // cineFrameRate: 24,
            // isLoopEnabled: true,
            // lastChange: '',
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
        // this.cacheImage = this
        //     .cacheImage
        //     .bind(this)
        // this.drawTmpBox = this.drawTmpBox.bind(this)
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

    visualize(hist_data,idx){
        const visId = 'visual-' + idx
        document.getElementById(visId).innerHTML=''
        // if(!isNewBox){
            let bins=hist_data.bins
            let ns=hist_data.n
            console.log('bins',bins)
            console.log('ns',ns)
            var histogram = []
            var line=[]
            for (var i = 0; i < bins.length-1; i++) {
                var obj = {}
                
                obj.value = [bins[i],bins[i+1]]
                obj.count=ns[i]
                histogram.push(obj)
                
                
                // var obj2={}
                // obj2.value=bins[i]
                // obj2.count=ns[i]
                // line.push(obj2)
            }
            console.log('histogram',histogram)
            // console.log('line',line)
            const ds = new DataSet()
            const dv = ds.createView().source(histogram)
            // const dv2=ds.createView().source(line)

            // dv.transform({
            //     type: 'bin.histogram',
            //     field: 'value',
            //     binWidth: 5000,
            //     as: ['value', 'count'],
            // })
            const chart = new Chart({
                container: visId,
                // forceFit: true,
                forceFit:true,
                height: 300,
                width:500,
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
            view1.interval().position('value*count').color('#00FFFF')

            // var view2 = chart.view()
            // view2.axis(false)
            // // view2.source(line)
            // view2.source(line,{
            //     value: {
            //         // nice: true,
            //         minLimit: bins[0]-50,
            //     maxLimit:bins[bins.length-1]+50,
            //         // tickCount:10
            //     },
            //     count: {
            //         // max: 350000,
            //         tickCount:10
            //     }
            // })
            // view2.line().position('value*count').style({
            //     stroke: 'white',
                
            //     }).shape('smooth')
            chart.render() 
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
        // let style = $("<style>", {type:"text/css"}).appendTo("head");
        // style.text('#slice-slider::-webkit-slider-runnable-track{background:linear-gradient(90deg,#0033FF 0%,#000033 '+ 
        // (currentIdx -1)*100/this.state.imageIds.length+'%)}');
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
                autoRefresh: true,
                doubleClick:false
            })
        }
        
    }

    playAnimation() {//coffee button
        // this.setState({cacheModal:true})
        // for (var i = this.state.imageIds.length - 1; i >= 0; i--) {
        //     this.refreshImage(false, this.state.imageIds[i], i)
        // }

        // for (var i = 0; i < this.state.imageIds.length; i++) {
        //     this.refreshImage(false, this.state.imageIds[i], i)
        // }
        this.setState(({isPlaying}) => ({
            isPlaying: !isPlaying
        }))
        playTimer = setInterval(() => this.Animation(), 1000)
        // if(this.state.isPlaying){ //true
        //     var playTimer = setTimeout(function(){
        //         //your codes

        //         var curIdx = this.state.currentIdx
        //         if(curIdx < imageIdsLength - 1){
        //             this.refreshImage(false, this.state.imageIds[curIdx+1], curIdx+1)
        //         }
        //         else{
        //             this.refreshImage(false, this.state.imageIds[0], 0)
        //         }         
        //     },1000);
        // }
        // else{
        //     clearInterval(playTimer)
        // }
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

    delNodule(event) {
        const delNoduleId = event.target.id
        const nodule_no = delNoduleId.split("-")[1]
        let boxes = this.state.boxes
        for (var i = 0; i < boxes.length; i++) {
            if (boxes[i].nodule_no === nodule_no) {
                boxes.splice(i, 1)
            }
        }
        for (var i = nodule_no; i < boxes.length; i++) {
            boxes[i].nodule_no=(parseInt(boxes[i].nodule_no)-1).toString()
            
        }
        this.setState({
            boxes: boxes,
            // random: Math.random()
        })
        this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)

    }

    highlightNodule(event) {
        console.log('in', event.target.textContent)
        let boxes = this.state.boxes
        for (var i = 0; i < boxes.length; i++) {
            if (boxes[i].nodule_no === event.target.textContent) {
                boxes[i].highlight = true
            }
        }
        // console.log(this.state.boxes, boxes)
        this.setState({boxes: boxes})
        this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
    }

    dehighlightNodule(event) {
        console.log('out', event.target.textContent)
        let boxes = this.state.boxes
        for (var i = 0; i < boxes.length; i++) {
            if (boxes[i].nodule_no === event.target.textContent) {
                boxes[i].highlight = false
            }
        }
        // console.log(this.state.boxes, boxes)
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
        let boxes = this.state.boxes
        for (let i = 0; i < boxes.length; i++) {
            if (boxes[i].nodule_no === noduleId) {
                boxes[i].malignancy = parseInt(value)
            }
        }
        console.log('boxes',boxes,noduleId)
        this.setState({
            boxes: boxes,
            // random: Math.random()
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
            // random: Math.random()
        })
    }

    // onSelectPlace = (event) => {
    //     // const segment = event.currentTarget.innerHTML
    //     // const place=event.currentTarget.parentNode.innerHTML
    //     // console.log('segment',segment,place)
    //     const value = event.currentTarget.value
    //     const noduleId = event
    //         .currentTarget
    //         .id
    //         .split('-')[1]
    //     let boxes = this.state.boxes
    //     for (let i = 0; i < boxes.length; i++) {
    //         if (boxes[i].nodule_no === noduleId) {
    //             boxes[i].place = value
    //         }
    //     }
    //     this.setState({
    //         boxes: boxes,
    //         random: Math.random()
    //     })
    // }
    onSelectPlace = (event) => {
        let places={0:'选择位置',1:'右肺中叶',2:'右肺上叶',3:'右肺下叶',4:'左肺上叶',5:'左肺下叶'}
        let segments={
            'S1':'右肺上叶-尖段','S2':'右肺上叶-后段','S3':'右肺上叶-前段','S4':'右肺中叶-外侧段','S5':'右肺中叶-内侧段',
            'S6':'右肺下叶-上段','S7':'右肺下叶-内底段','S8':'右肺下叶-前底段','S9':'右肺下叶-外侧底段','S10':'右肺下叶-后底段',
            'S11':'左肺上叶-尖后段','S12':'左肺上叶-前段','S13':'左肺上叶-上舌段','S14':'左肺上叶-下舌段','S15':'左肺下叶-上段',
            'S16':'左肺下叶-前底段','S17':'左肺下叶-外侧底段','S18':'左肺下叶-后底段'}
        const segment = event.currentTarget.innerHTML
        const place = event.currentTarget.id.split('-')[2]
        const noduleId = event.currentTarget.id.split('-')[1]
        console.log('id',segment,place,noduleId)
        let boxes = this.state.boxes
        for (let i = 0; i < boxes.length; i++) {
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
            boxes: boxes,
            // random: Math.random()
        })
    }

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

    disableAllTools(element){
        cornerstoneTools.setToolDisabledForElement(element, 'Pan',
        {
            mouseButtonMask: 4, //middle mouse button
        },
        ['Mouse'])
        cornerstoneTools.setToolDisabledForElement(
            element,
            'Wwwc',
            {
                mouseButtonMask: 1, //middle mouse button
            },
            ['Mouse']
        )
        // cornerstoneTools.setToolDisabledForElement(element, 'Bidirectional')
    }

    startAnnos(){
        // this.setState({isbidirectionnal:true,toolState:'EllipticalRoi'})
        const element = document.querySelector('#origin-canvas')
        this.disableAllTools(element)
        // cornerstoneTools.addToolForElement(element,ellipticalRoi)
        // cornerstoneTools.setToolActiveForElement(element, 'EllipticalRoi',{mouseButtonMask:1},['Mouse'])
        this.setState({leftButtonTools:0,menuTools:'anno'})
    }

    slide(){
        const element = document.querySelector('#origin-canvas')
        this.disableAllTools(element)
        this.setState({leftButtonTools:1,menuTools:'slide'})
        //切换切片
    }

    wwwcCustom(){
        this.setState({leftButtonTools:2,menuTools:'wwwc'})
        const element = document.querySelector('#origin-canvas')
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

    lengthMeasure(box){
        this.setState({isbidirectionnal:true,toolState:'Bidirectional'})
        // console.log('测量')
        // const element = document.querySelector('#origin-canvas')
        // this.disableAllTools(element)
        // cornerstoneTools.addToolForElement(element, bidirectional)
        // cornerstoneTools.setToolActiveForElement(element, 'Bidirectional',{mouseButtonMask:1},['Mouse'])
        // cornerstoneTools.length.activate(element,4);

    }

    featureAnalysis(e){
        const idx = e.target.value
        console.log("特征分析")
        const boxes = this.state.boxes
        // if(boxes[idx].nodule_hist !== undefined){
        //     var hist_data = boxes[idx].nodule_hist
        //     console.log('hist_data',hist_data)
        //     this.visualize(hist_data,idx,false)
        // }

        // if(boxes[idx].new_nodule_hist !== undefined){
        //     var new_nodule_hist = boxes[idx].new_nodule_hist
        //     console.log('hist_data',new_nodule_hist)
        //     this.visualize(new_nodule_hist,idx, true)
        // }
        
        
        // if(hist_data!==undefined){
            
        // }
        
        // var data = e.target.value
        // data = JSON.stringify(data)
        // data = JSON.parse(data)
        if (boxes[idx]!==undefined){
            var hist = boxes[idx].nodule_hist
            this.visualize(hist,idx)
        }
    }

    eraseLabel(){
        const element = document.querySelector('#origin-canvas')
        this.disableAllTools(element)
        cornerstoneTools.addToolForElement(element,eraser)
        cornerstoneTools.setToolActiveForElement(element, 'Eraser',{mouseButtonMask:1},['Mouse'])
        
       
    }

    toHomepage(){
        window.location.href = '/homepage'
        // this.nextPath('/homepage/' + params.caseId + '/' + res.data)
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

    addSign(slice_idx,e){
        // document.getElementById('slice-slider').value=slice_idx
        // $('#slice-slider::-webkit-slider-runnable-track').css('background','linear-gradient(90deg,#0033FF 0%,#000033 '+ slice_idx*100/this.state.imageIds.length+'%)')
        // $('input[type=range]').css('background','linear-gradient(90deg,#0033FF 0%,#000033 '+ slice_idx*100/this.state.imageIds.length+'%)')
        // document.querySelector('input[type=range]').style.background='linear-gradient(90deg,#0033FF 0%,#000033 '+ slice_idx*100/this.state.imageIds.length+'%)'
        // $('head').append("<style>.input[type='range']::-webkit-slider-runnable-track{ background:linear-gradient(90deg,#0033FF 0%,#000033 "+ slice_idx*100/this.state.imageIds.length+"%)"+ "}</style>");
        // $('#slice-slider').append("<style>.input[type='range']::-webkit-slider-runnable-track{ background:red}</style>");
        // let style = $("<style>", {type:"text/css"}).appendTo("head");
        // style.text('#slice-slider::-webkit-slider-runnable-track{background:linear-gradient(90deg,#0033FF 0%,#000033 '+ (slice_idx+1)*100/this.state.imageIds.length+'%)}');
        this.refreshImage(false, this.state.imageIds[slice_idx - 1], slice_idx - 1)
    }

    render() {
        let sliderMarks={}
        for(let i=0;i<this.state.boxes.length;i++){
            sliderMarks[this.state.boxes[i].slice_idx]=''
        }
        
        
        const panes = [
            { menuItem: '影像所见', render: () => 
                <Tab.Pane><MiniReport type='影像所见' caseId={this.state.caseId} username={this.state.username} 
                imageIds={this.state.imageIds} boxes={this.state.boxes} activeItem={this.state.doubleClick===true?'all':this.state.listsActiveIndex}/></Tab.Pane> },
            { menuItem: '处理建议', render: () => <Tab.Pane><MiniReport type='处理建议' imageIds={this.state.imageIds} boxes={this.state.boxes}/></Tab.Pane> },
          ]
        // sessionStorage.clear()
        // console.log('boxes', this.state.boxes)
        // console.log('boxes', this.state.username)
        const {showNodules, activeIndex, modalOpenNew, modalOpenCur,listsActiveIndex,wwDefine, wcDefine, dicomTag, studyList, menuTools, cacheModal} = this.state
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
        let createDraftModal;
        let submitButton;
        let StartReviewButton;
        let calCount=0
        let canvas;
        let places={0:'选择位置',1:'右肺中叶',2:'右肺上叶',3:'右肺下叶',4:'左肺上叶',5:'左肺下叶'}
        let segments={
        'S1':'右肺上叶-尖段','S2':'右肺上叶-后段','S3':'右肺上叶-前段','S4':'右肺中叶-外侧段','S5':'右肺中叶-内侧段',
        'S6':'右肺下叶-上段','S7':'右肺下叶-内底段','S8':'右肺下叶-前底段','S9':'右肺下叶-外侧底段','S10':'右肺下叶-后底段',
        'S11':'左肺上叶-尖后段','S12':'左肺上叶-前段','S13':'左肺上叶-上舌段','S14':'左肺上叶-下舌段','S15':'左肺下叶-上段',
        'S16':'左肺下叶-前底段','S17':'左肺下叶-外侧底段','S18':'左肺下叶-后底段'}
        
        const options = [
            { key: '分叶', text: '分叶', value: '分叶' },
            { key: '毛刺', text: '毛刺', value: '毛刺' },
            { key: '钙化', text: '钙化', value: '钙化' },
            { key: '胸膜凹陷', text: '胸膜凹陷', value: '胸膜凹陷' },
            { key: '血管集束', text: '血管集束', value: '血管集束' },
            { key: '空泡', text: '空泡', value: '空泡' },
            { key: '支气管充气', text: '支气管充气', value: '支气管充气' },
        ]

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
        // if(window.screen.width <=1280){
        //     canvas=(
        //         <div
        //             id="origin-canvas"
        //             style={divStyle}
        //             ref={input => {
        //             this.element = input
        //         }}>
        //             <canvas className="cornerstone-canvas" id="canvas"/>
        //             <div style={topLeftStyle}>Offset: {this.state.viewport.translation['x']}, {this.state.viewport.translation['y']}
        //             </div>
        //             <div style={bottomLeftStyle}>Zoom: {Math.round(this.state.viewport.scale * 100) / 100}</div>
        //             <div style={bottomRightStyle}>
        //                 WW/WC: {Math.round(this.state.viewport.voi.windowWidth)}
        //                 /{" "} {Math.round(this.state.viewport.voi.windowCenter)}
        //             </div>
        //         </div>
        //     )
        // }
        // else{
        //     canvas=(
        //         <div
        //             id="origin-canvas"
        //             style={divStyle1}
        //             ref={input => {
        //             this.element = input
        //         }}>
        //             <canvas className="cornerstone-canvas" id="canvas"/>
        //             <div style={topLeftStyle}>Offset: {this.state.viewport.translation['x']}, {this.state.viewport.translation['y']}
        //             </div>
        //             <div style={bottomLeftStyle}>Zoom: {Math.round(this.state.viewport.scale * 100) / 100}</div>
        //             <div style={bottomRightStyle}>
        //                 WW/WC: {Math.round(this.state.viewport.voi.windowWidth)}
        //                 /{" "} {Math.round(this.state.viewport.voi.windowCenter)}
        //             </div>
        //         </div>
        //     )
        // }

        

        if (this.state.draftStatus === '0') 
            submitButton = (
                <Button icon title='提交' onClick={this.submit} className='funcbtn'><Icon name='upload' size='large'></Icon></Button>
            )
        else 
            submitButton = (
                <Button icon title='撤销' onClick={this.deSubmit} className='funcbtn'><Icon name='reply' size='large'></Icon></Button>
            )
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
           
            // if (this.state.readonly) {
            //     // console.log(this.state.boxes)
                
            //     tableContent = this
            //         .state
            //         .boxes
            //         .map((inside, idx) => {
            //             // console.log(this.state.currentIdx, inside.slice_idx - 1)
            //             console.log('inside', inside)
            //             let classNamee = ""
            //             if (this.state.currentIdx === inside.slice_idx) {
            //                 classNamee = "table-row highlighted"
            //             } else {
            //                 classNamee = "table-row"
            //             }
            //             if(inside.calcification===2){
            //                 calCount+=1
            //             }
            //             return (
            //                 <Table.Row key={idx} className={classNamee} onClick={this.toPage.bind(this,inside.slice_idx + 1)}>
            //                     <Table.Cell width={2}>
            //                         <div onMouseOver={this.highlightNodule} onMouseOut={this.dehighlightNodule} style={{fontSize:'large'}}>{inside.nodule_no}</div>
            //                     </Table.Cell>
            //                     <Table.Cell width={3} >{Math.floor(inside.diameter * 10) / 100+'cm'}</Table.Cell>
            //                     <Table.Cell width={3}>{inside.texture===2?"实性":"磨玻璃"}</Table.Cell>
            //                     <Table.Cell width={3}>{inside.malignancy===2?"高危":"低危"}</Table.Cell>
            //                 </Table.Row>
            //             )
            //         })
            // } 
            // else {
                
                tableContent = this
                    .state
                    .boxes
                    .map((inside, idx) => {
                        // console.log('inside',inside)
                        let representArray=[]
                        let dropdownText=''
                        let malignancyContnt = ''
                        let probContnt = ''
                        const delId = 'del-' + inside.nodule_no
                        const malId = 'malSel-' + inside.nodule_no
                        const texId = 'texSel-' + inside.nodule_no
                        const placeId = 'place-' + inside.nodule_no
                        const visualId = 'visual-' + inside.nodule_no
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
                        if(1){
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
                        }
                        if(inside.malignancy === -1){
                            if(this.state.readonly){
                                malignancyContnt = (
                                    <Grid.Column width={3} textAlign='center'>
                                        <select id={malId} style={selectStyle} value={inside.malignancy} onChange={this.onSelectMal} disabled>
                                            <option value="-1" disabled="disabled">选择性质</option>
                                            <option value="1">低危</option>
                                            <option value="2">中危</option>
                                            <option value="3">高危</option>
                                        </select>
                                    </Grid.Column>
                                )
                                probContnt=(
                                    <Grid.Column width={3} textAlign='center'>
                                        <div>(概率:{Math.floor(inside.malProb*10000)/100}%)</div>
                                    </Grid.Column>
                                )
                            }
                            else{
                                malignancyContnt = (
                                    <Grid.Column width={3} textAlign='center'>
                                        <select id={malId} style={selectStyle} value={inside.malignancy} onChange={this.onSelectMal}>
                                            <option value="-1" disabled="disabled">选择性质</option>
                                            <option value="1">低危</option>
                                            <option value="2">中危</option>
                                            <option value="3">高危</option>
                                        </select>
                                    </Grid.Column>
                                )
                            }
                        }
                        else if(inside.malignancy===1){
                            if(this.state.readonly){
                                malignancyContnt = (
                                    <Grid.Column width={3} textAlign='center'>
                                        <select id={malId} style={lowRiskStyle} value={"1"} onChange={this.onSelectMal} disabled>
                                            <option value="-1" disabled="disabled">选择性质</option>
                                            <option value="1">低危</option>
                                            <option value="2">中危</option>
                                            <option value="3">高危</option>
                                        </select>
                                    </Grid.Column>
                                )
                                probContnt=(
                                    <Grid.Column width={3} textAlign='center'>
                                        <div style={{color:'green'}}>(概率:{Math.floor(inside.malProb*10000)/100}%)</div>
                                    </Grid.Column>
                                )
                            }
                            else{
                                malignancyContnt = (
                                    <Grid.Column width={3} textAlign='center'>
                                        <select id={malId} style={lowRiskStyle} value={inside.malignancy} onChange={this.onSelectMal}>
                                            <option value="-1" disabled="disabled">选择性质</option>
                                            <option value="1">低危</option>
                                            <option value="2">中危</option>
                                            <option value="3">高危</option>
                                        </select>
                                    </Grid.Column>
                                )
                            }
                        }
                        else if(inside.malignancy===2){
                            if(this.state.readonly){
                                malignancyContnt = (
                                    <Grid.Column width={3} textAlign='left'>
                                        <select id={malId} style={middleRiskStyle} value={"2"} onChange={this.onSelectMal} disabled>
                                            <option value="-1" disabled="disabled">选择性质</option>
                                            <option value="1">低危</option>
                                            <option value="2">中危</option>
                                            <option value="3">高危</option>
                                        </select>
                                    </Grid.Column>
                                )
                                probContnt=(
                                    <Grid.Column width={3} textAlign='center'>
                                        <div style={{color:'#CC3300'}}>(概率:{Math.floor(inside.malProb*10000)/100}%)</div>
                                    </Grid.Column>
                                )
                            }
                            else{
                                malignancyContnt = (
                                    <Grid.Column width={3} textAlign='left'>
                                        <select id={malId} style={middleRiskStyle} value={inside.malignancy} onChange={this.onSelectMal}>
                                            <option value="-1" disabled="disabled">选择性质</option>
                                            <option value="1">低危</option>
                                            <option value="2">中危</option>
                                            <option value="3">高危</option>
                                        </select>
                                    </Grid.Column>
                                )
                            }
                        }
                        else if(inside.malignancy===3){
                            if(this.state.readonly){
                                malignancyContnt = (
                                    <Grid.Column width={3} textAlign='left'>
                                        <select id={malId} style={highRiskStyle} value={"3"} onChange={this.onSelectMal} disabled>
                                            <option value="-1" disabled="disabled">选择性质</option>
                                            <option value="1">低危</option>
                                            <option value="2">中危</option>
                                            <option value="3">高危</option>
                                        </select>
                                    </Grid.Column>
                                )
                                probContnt=(
                                    <Grid.Column width={3} textAlign='center'>
                                        <div style={{color:'#fcaf17'}}>(概率:{Math.floor(inside.malProb*10000)/100}%)</div>
                                    </Grid.Column>
                                )
                            }
                            else{
                                malignancyContnt = (
                                    <Grid.Column width={3} textAlign='left'>
                                        <select id={malId} style={highRiskStyle} value={inside.malignancy} onChange={this.onSelectMal}>
                                            <option value="-1" disabled="disabled">选择性质</option>
                                            <option value="1">低危</option>
                                            <option value="2">中危</option>
                                            <option value="3">高危</option>
                                        </select>
                                    </Grid.Column>
                                )
                            }
                        }
                        return (
                            <div key={idx} className='highlightTbl'>
                                
                                <Accordion.Title onClick={this.handleListClick.bind(this,inside.slice_idx + 1,idx)}
                                active={listsActiveIndex===idx} index={idx} >
                                    {/* <div style={{minWidth:600}}> */}
                                    <Grid>
                                        <Grid.Row>
                                            <Grid.Column width={1}>
                                                <div onMouseOver={this.highlightNodule} onMouseOut={this.dehighlightNodule} style={{fontSize:'large'}}>{parseInt(inside.nodule_no)+1}</div>
                                            </Grid.Column>
                                            <Grid.Column width={7} textAlign='center'>
                                            {
                                        this.state.readonly?<Dropdown  style={selectStyle} text={dropdownText} disabled/>:
                                        idx<8?
                                        <Dropdown style={selectStyle} text={dropdownText}>
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
                                                        <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-右肺下叶'}>上段</Dropdown.Item>
                                                        <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-右肺下叶'}>内底段</Dropdown.Item>
                                                        <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-右肺下叶'}>前底段</Dropdown.Item>
                                                        <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-右肺下叶'}>外侧底段</Dropdown.Item>
                                                        <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-右肺下叶'}>后底段</Dropdown.Item>
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
                                                        <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-左肺下叶'}>上段</Dropdown.Item>
                                                        <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-左肺下叶'}>前底段</Dropdown.Item>
                                                        <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-左肺下叶'}>外侧底段</Dropdown.Item>
                                                        <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-左肺下叶'}>后底段</Dropdown.Item>
                                                        <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-右肺中叶'}>无法定位</Dropdown.Item>
                                                    </Dropdown.Menu>
                                                    </Dropdown>
                                                </Dropdown.Item>
                                            </Dropdown.Menu>
                                        </Dropdown>
                                        :
                                        <Dropdown  style={selectStyle} text={dropdownText} upward>
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
                                                        <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-右肺下叶'}>上段</Dropdown.Item>
                                                        <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-右肺下叶'}>内底段</Dropdown.Item>
                                                        <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-右肺下叶'}>前底段</Dropdown.Item>
                                                        <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-右肺下叶'}>外侧底段</Dropdown.Item>
                                                        <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-右肺下叶'}>后底段</Dropdown.Item>
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
                                                        <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-左肺下叶'}>上段</Dropdown.Item>
                                                        <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-左肺下叶'}>前底段</Dropdown.Item>
                                                        <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-左肺下叶'}>外侧底段</Dropdown.Item>
                                                        <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-左肺下叶'}>后底段</Dropdown.Item>
                                                        <Dropdown.Item onClick={this.onSelectPlace} id={placeId+'-右肺中叶'}>无法定位</Dropdown.Item>
                                                    </Dropdown.Menu>
                                                    </Dropdown>
                                                </Dropdown.Item>
                                            </Dropdown.Menu>
                                        </Dropdown>
                                            }
                                            </Grid.Column>
                                    
                                    {/* {this.state.readonly?
                                     <select id={placeId} style={selectStyle} onChange={this.onSelectPlace} disabled> 
                                        <option value="0" selected={inside.place === 0}>肺叶位置</option>
                                        <option value="1" selected={inside.place === 1}>右肺中叶</option>
                                        <option value="2" selected={inside.place === 2}>右肺上叶</option>
                                        <option value="3" selected={inside.place === 3}>右肺下叶</option>
                                        <option value="4" selected={inside.place === 4}>左肺上叶</option>
                                        <option value="5" selected={inside.place === 5}>左肺下叶</option>
                                    </select>
                                    :
                                    <select id={placeId} style={selectStyle} onChange={this.onSelectPlace} >
                                        <option value="0" selected={inside.place === 0} disabled>肺叶位置</option>
                                        <option value="1" selected={inside.place === 1}>右肺中叶</option>
                                        <option value="2" selected={inside.place === 2}>右肺上叶</option>
                                        <option value="3" selected={inside.place === 3}>右肺下叶</option>
                                        <option value="4" selected={inside.place === 4}>左肺上叶</option>
                                        <option value="5" selected={inside.place === 5}>左肺下叶</option>
                                    </select>
                                    } */}
                                    
                                {/* </div> */}
                                {/* <div style={{display:'inline-block',marginLeft:10}}>
                                    {this.state.readonly?
                                     <select id={placeId} style={selectStyle} onChange={this.onSelectPlace} disabled> 
                                        <option value="0" selected={inside.segment === undefined||inside.segment === ""}>肺段位置</option>
                                        <option value="1" selected={inside.segment === "S1"}>尖段</option>
                                        <option value="2" selected={inside.segment === "S2"}>后段</option>
                                        <option value="3" selected={inside.segment === "S3"}>前段</option>
                                        <option value="4" selected={inside.segment === "S4"}>外段</option>
                                        <option value="5" selected={inside.segment === "S5"}>内段</option>
                                        <option value="5" selected={inside.segment === "S6"}>上段</option>
                                        <option value="5" selected={inside.segment === "S7"}>內基底段</option>
                                        <option value="5" selected={inside.segment === "S8"}>前基底段</option>
                                        <option value="5" selected={inside.segment === "S9"}>外基底段</option>
                                        <option value="5" selected={inside.segment === "S10"}>后基底段</option>
                                        <option value="5" selected={inside.segment === "S11"}>尖后段</option>
                                        <option value="5" selected={inside.segment === "S12"}>前段</option>
                                        <option value="5" selected={inside.segment === "S13"}>上舌段</option>
                                        <option value="5" selected={inside.segment === "S14"}>下舌段</option>
                                        <option value="5" selected={inside.segment === "S15"}>上段</option>
                                        <option value="5" selected={inside.segment === "S16"}>前基底段</option>
                                        <option value="5" selected={inside.segment === "S17"}>外基底段</option>
                                        <option value="5" selected={inside.segment === "S18"}>后基底段</option>
                                    </select>
                                    :
                                    <select id={placeId} style={selectStyle} onChange={this.onSelectPlace} >
                                        <option value="0" selected={inside.segment === undefined||inside.segment === ""} disabled>肺段位置</option>
                                        <option value="1" selected={inside.segment === "S1"}>尖段</option>
                                        <option value="2" selected={inside.segment === "S2"}>后段</option>
                                        <option value="3" selected={inside.segment === "S3"}>前段</option>
                                        <option value="4" selected={inside.segment === "S4"}>外段</option>
                                        <option value="5" selected={inside.segment === "S5"}>内段</option>
                                        <option value="5" selected={inside.segment === "S6"}>上段</option>
                                        <option value="5" selected={inside.segment === "S7"}>內基底段</option>
                                        <option value="5" selected={inside.segment === "S8"}>前基底段</option>
                                        <option value="5" selected={inside.segment === "S9"}>外基底段</option>
                                        <option value="5" selected={inside.segment === "S10"}>后基底段</option>
                                        <option value="5" selected={inside.segment === "S11"}>尖后段</option>
                                        <option value="5" selected={inside.segment === "S12"}>前段</option>
                                        <option value="5" selected={inside.segment === "S13"}>上舌段</option>
                                        <option value="5" selected={inside.segment === "S14"}>下舌段</option>
                                        <option value="5" selected={inside.segment === "S15"}>上段</option>
                                        <option value="5" selected={inside.segment === "S16"}>前基底段</option>
                                        <option value="5" selected={inside.segment === "S17"}>外基底段</option>
                                        <option value="5" selected={inside.segment === "S18"}>后基底段</option>
                                    </select>
                                    }
                                    
                                </div> */}
                                
                                {/* <Grid.Column width={2} textAlign='center'>
                                    {this.state.readonly?
                                    <select id={malId} style={selectStyle} onChange={this.onSelectMal} disabled>
                                        <option value="" disabled="disabled" selected={inside.malignancy === -1}>选择性质</option>
                                        <option value="1" selected={inside.malignancy === 1}>低危</option>
                                        <option value="2" selected={inside.malignancy === 2}>高危</option>
                                    </select>
                                    :
                                    <select id={malId} style={selectStyle} onChange={this.onSelectMal}>
                                        <option value="" disabled="disabled" selected={inside.malignancy === -1}>选择性质</option>
                                        <option value="1" selected={inside.malignancy === 1}>低危</option>
                                        <option value="2" selected={inside.malignancy === 2}>高危</option>
                                    </select>
                                    }
                                </Grid.Column> */}
                                {malignancyContnt}
                                {/* <div style={{display:'inline-block',marginLeft:5}}>
                                    {this.state.readonly?
                                    <select id={malId} style={selectStyle} onChange={this.onSelectMal} disabled>
                                        <option value="" disabled="disabled" selected={inside.malignancy === -1}>选择性质</option>
                                        <option value="1" selected={inside.malignancy === 1}>低危</option>
                                        <option value="2" selected={inside.malignancy === 2}>高危</option>
                                    </select>
                                    :
                                    <select id={malId} style={selectStyle} onChange={this.onSelectMal}>
                                        <option value="" disabled="disabled" selected={inside.malignancy === -1}>选择性质</option>
                                        <option value="1" selected={inside.malignancy === 1}>低危</option>
                                        <option value="2" selected={inside.malignancy === 2}>高危</option>
                                    </select>
                                    }
                                    
                                </div> */}
                                {/* {
                                    // this.state.readonly?
                                    // <Grid.Column width={3} textAlign='center'>
                                    //     <div>{"("+"概率:"+Math.floor(inside.malProb*10000)/100+'%'+")"}</div>
                                    // </Grid.Column>
                                    // :null
                                    
                                } */}
                                {probContnt}
                                {/* <div style={{display:'inline-block',marginLeft:5}}>
                                    {this.state.readonly?"("+"概率:"+Math.floor(inside.malProb*10000)/100+'%'+")":null}
                                </div> */}
                                {
                                    this.state.readonly?
                                    <Grid.Column width={3} textAlign='center'>
                                        <select id={texId} style={selectStyle} defaultValue="" disabled>
                                        <option value="" disabled="disabled">亚型未选</option>
                                        </select>
                                    </Grid.Column>
                                    :
                                    <Grid.Column width={3} textAlign='center'>
                                        <select id={texId} style={selectStyle} defaultValue="" disabled>
                                        <option value="" disabled="disabled">选择亚型</option>
                                        </select>
                                    </Grid.Column>
                                }
                                
                                {/* <div style={{display:'inline-block',marginLeft:5}}>
                                    {this.state.readonly?
                                    <select id={texId} style={selectStyle} disabled>
                                        <option value="" disabled="disabled" selected>亚型未选</option>
                    
                                    </select>
                                    :
                                    <select id={texId} style={selectStyle}>
                                        <option value="" disabled="disabled" selected>选择亚型</option>
                                        
                                    </select>
                                    } 
                                </div> */}
                                {
                                    this.state.readonly?null:
                                    <Grid.Column width={1} textAlign='center'>
                                        <Icon name='trash alternate' onClick={this.delNodule} id={delId}></Icon>
                                    </Grid.Column>
                                    // <div style={{display:'inline-block',marginLeft:50}}>
                                        
                                    // </div>
                                }
                                    {/* </div> */}
                                    </Grid.Row>
                                    </Grid>
                                </Accordion.Title>
                                <Accordion.Content active={listsActiveIndex===idx} id='highlightAccordion'>
                                    <Grid>
                                        <Grid.Row>
                                            <Grid.Column width={3}>
                                                IM:{inside.slice_idx + 1}
                                            </Grid.Column>
                                            <Grid.Column width={4}>
                                                <Icon name='crosshairs' size='mini'></Icon>
                                                {'\xa0\xa0'+(Math.floor(inside.diameter * 10) / 100).toFixed(2)+'\xa0cm'}
                                            </Grid.Column>
                                            <Grid.Column width={3}>
                                                {
                                                inside.volume!==undefined?
                                                (Math.floor(inside.volume * 100) / 100).toFixed(2)+'\xa0cm³'
                                                :
                                                null
                                            }
                                            </Grid.Column>
                                            <Grid.Column width={4}>
                                                    {inside.huMin!==undefined?
                                                inside.huMin +'~' + inside.huMax + 'HU'
                                                :
                                                null
                                                }
                                            </Grid.Column>
                                            <Grid.Column width={2}>
                                                {
                                                    // <div style={{display:'inline-block',width:'50%'}}>
                                                        <Button size='mini' circular inverted
                                                        icon='chart bar' title='特征分析' value={idx} onClick={this.featureAnalysis.bind(this)}>
                                                        </Button>
                                                    // </div>
                                                
                                                }
                                            </Grid.Column>
                                        </Grid.Row>
                                        <Grid.Row textAlign='center' verticalAlign='middle' centered>
                                            <Grid.Column width={3}>
                                                {this.state.readonly?
                                                <select id={texId} style={selectStyle} value={inside.texture} onChange={this.onSelectTex} disabled>
                                                    <option value="-1" disabled="disabled">选择性质</option>
                                                    <option value="1">磨玻璃</option>
                                                    <option value="2">实性</option>
                                                    <option value="3">半实性</option>
                                                </select>
                                                :
                                                <select id={texId} style={selectStyle} value={inside.texture} onChange={this.onSelectTex}>
                                                    <option value="-1" disabled="disabled">选择性质</option>
                                                    <option value="1">磨玻璃</option>
                                                    <option value="2">实性</option>
                                                    <option value="3">半实性</option>
                                                </select>
                                            }
                                            </Grid.Column>
                                            <Grid.Column width={2} style={{paddingLeft:'0px',paddingRight:'0px'}}>表征:</Grid.Column>
                                            <Grid.Column width={11} style={{paddingLeft:'0px',paddingRight:'0px'}}>
                                                {this.state.readonly?
                                                    <Dropdown multiple selection options={options} id='dropdown' icon='null' pointing='left' disabled
                                                    defaultValue={representArray} />:
                                                    <Dropdown multiple selection options={options} id='dropdown' icon='add circle' 
                                                    defaultValue={representArray} />}
                                            </Grid.Column>
                                        </Grid.Row>
                                    </Grid>
                                    {/* <div style={{width:'100%'}}>
                                        <div style={{fontSize:'medium',display:'inline-block',marginLeft:20}}>IM:{inside.slice_idx + 1}</div>
                                        <div style={{fontSize:'medium',display:'inline-block',marginLeft:40}}>
                                            {'Dia.:\xa0\xa0'+(Math.floor(inside.diameter * 10) / 100).toFixed(2)+'\xa0\xa0cm'}</div>
                                        {
                                            inside.volume!==undefined?
                                            <div style={{fontSize:'medium',display:'inline-block',marginLeft:20}}>
                                            {'Volume:\xa0\xa0'+(Math.floor(inside.volume * 100) / 100).toFixed(2)+'\xa0\xa0cm³'}</div>
                                            :
                                            null
                                        }
                                        {inside.huMin!==undefined?
                                        <div style={{fontSize:'medium',display:'inline-block',marginLeft:40}}>{inside.huMin}~{inside.huMax}HU</div>
                                        :
                                        null
                                        }
                                        {
                                         <div style={{display:'inline-block',width:'50%'}}>
                                            <Button
                                            icon='chart bar' title='特征分析' value={idx} onClick={this.featureAnalysis}>
                                            </Button>
                                        </div>
                                        }
                                    </div>
                                    <div style={{width:'100%',marginTop:'2%',borderBottom:'1px solid white'}}>
                                        {this.state.readonly?
                                            <select id={texId} style={selectStyle} value={inside.texture} onChange={this.onSelectTex} disabled>
                                                <option value="-1" disabled="disabled">选择性质</option>
                                                <option value="1">磨玻璃</option>
                                                <option value="2">实性</option>
                                                <option value="3">半实性</option>
                                            </select>
                                            :
                                            <select id={texId} style={selectStyle} value={inside.texture} onChange={this.onSelectTex}>
                                                <option value="-1" disabled="disabled">选择性质</option>
                                                <option value="1">磨玻璃</option>
                                                <option value="2">实性</option>
                                                <option value="3">半实性</option>
                                            </select>
                                        }
                                        <div style={{fontSize:'medium',display:'inline-block',textAlign:'right',marginLeft:'15px'}}>表征</div>
                                        
                                        
                                        {this.state.readonly?
                                        <Dropdown multiple selection options={options} id='dropdown' icon='null' pointing='left' disabled
                                        defaultValue={representArray} style={{display:'inline-block',height:'15%',marginLeft:'10px'}}/>:
                                        <Dropdown multiple selection options={options} id='dropdown' icon='add circle' 
                                        defaultValue={representArray} style={{display:'inline-block',height:'15%',marginLeft:'10px'}}/>}
                                        
                                    </div> */}
                                    {/* {
                                        // this.state.readonly?
                                        // <div style={{width:'100%',marginTop:'2%'}}>
                                         <div style={{display:'inline-block',width:'50%'}}>
                                            <Button style={{background:'transparent',color:'white',fontSize:'medium',border:'1px solid white',width:'100%'}}
                                            icon='chart bar' content='特征分析' value={idx} onClick={this.featureAnalysis}>
                                            </Button>
                                        </div>
                                        // :null
                                        // <div style={{display:'inline-block',width:'50%'}}>
                                        //     <Button style={{background:'transparent',color:'white',fontSize:'medium',border:'1px solid white',width:'100%'}}
                                        //     content='测量' icon='edit' id="immersive-hover" onClick={this.lengthMeasure}>
                                        //     </Button>
                                        // </div>
                                       
                                        // </div>
                                       
                                    } */}

                                     {/* <Container className='histogram'> */}
                                        <div id={visualId} className='histogram'></div>
                                    {/* </Container> */}
                                </Accordion.Content>
                            </div>
                        )
                    })
            // }

            if (this.state.readonly) {
                return (
                    <div>
                        {/* <div class='corner-header'> */}
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
                                        <Popup
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
                                />                                               
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
                                    {/* <Modal
                                        basic
                                        open={cacheModal}
                                        size='small'
                                        trigger={<Button icon onClick={this.cache} className='funcbtn' title='缓存'><Icon id="cache-button" name='coffee' size='large'></Icon></Button>}
                                        >
                                        <Header icon>
                                            <Icon name='archive' />
                                            Archive Old Messages
                                        </Header>
                                        <Modal.Content>
                                            <p>
                                            Your inbox is getting full, would you like us to enable automatic
                                            archiving of old messages?
                                            </p>
                                        </Modal.Content>
                                        <Modal.Actions>
                                            <Button basic color='red'>
                                            <Icon name='remove' /> No
                                            </Button>
                                            <Button color='green'>
                                            <Icon name='checkmark' /> Yes
                                            </Button>
                                        </Modal.Actions>
                                        </Modal> */}
                                    <Button icon onClick={this.toHidebox} className='funcbtn' id='showNodule' title='显示结节'><Icon name='eye' size='large'></Icon></Button>
                                    <Button icon onClick={this.toHidebox} className='funcbtn' id='hideNodule' title='隐藏结节'><Icon name='eye slash' size='large'></Icon></Button>
                                    <Button icon onClick={this.toHideInfo} className='funcbtn' id='showInfo' title='显示信息'><Icon name='content' size='large'></Icon></Button>
                                    <Button icon onClick={this.toHideInfo} className='funcbtn' id='hideInfo' title='隐藏信息'><Icon name='delete calendar' size='large'></Icon></Button>
                                    <Button className='funcbtn'
                                    onClick={() => {
                                        this.setState({immersive: true})
                                    }}
                                    icon title='沉浸模式' className='funcbtn'><Icon name='expand arrows alternate' size='large'></Icon></Button>
                                {
                                    this.state.newAnno?
                                        <Button icon onClick={this.clearthenFork} className='funcbtn' id='showNodule' title='新建标注'><Icon name='plus' size='large'></Icon></Button>
                                    :
                                    null
                                }
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
                            <Grid celled className='corner-contnt'>
                                <Grid.Row className='corner-row' columns={3}>
                                    <Grid.Column width={2}>
                                        <StudyBrowserList caseId={this.state.caseId} handleClickScreen={this.props.handleClickScreen}/>
                                    </Grid.Column>

                                    <Grid.Column width={10} textAlign='center' id='canvas-column'>
                                    

                                    
                                    <div className='canvas-style'>
                                        <div
                                            id="origin-canvas"
                                            // style={divStyle}
                                            ref={input => {
                                            this.element = input
                                        }}>
                                            
                                            <canvas className="cornerstone-canvas" id="canvas"/>
                                            {/* <canvas className="cornerstone-canvas" id="length-canvas"/> */}
                                            <div id='dicomTag'>
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
                                            </div>
                                            <div style={{position:'absolute',color:'white',bottom:'20px',left:'-95px'}}>Offset: {this.state.viewport.translation['x'].toFixed(1)}, {this.state.viewport.translation['y'].toFixed(1)}
                                            </div>
                                            <div style={bottomLeftStyle}>Zoom: {Math.round(this.state.viewport.scale * 100)}%</div>
                                            <div style={bottomRightStyle}>
                                                WW/WC: {Math.round(this.state.viewport.voi.windowWidth)}
                                                /{" "} {Math.round(this.state.viewport.voi.windowCenter)}
                                            </div>
                                        </div>
                                        {/* {canvas} */}
                                    </div>
                                    <div className='canvas-style'>
                                        {/* <Slider marks={} defaultValue={this.state.currentIdx + 1} onChange={this.handleRangeChange}></Slider> */}
                                        <input
                                            id="slice-slider"
                                            onChange={this.handleRangeChange}
                                            type="range"
                                            value={this.state.currentIdx}
                                            name="volume"
                                            step="1"
                                            min="1"
                                            max={this.state.stack.imageIds.length}></input>
                                            {/* {
                                            this.state.boxes.map((content,index)=>{
                                                let tempId ='sign'+index
                                                return(
                                                <Label circular id={tempId} className='sign' style={{position:'absolute',minWidth:'0.2em',
                                                minHeight:'0.2em',backgroundColor:'white'}} onClick={this.addSign.bind(this,content.slice_idx+1)}></Label>
                                                )
                                            })
                                        } */}
                                        {/* <div id="button-container">
                                            <div id='showNodules'><Checkbox label='显示结节' checked={showNodules} onChange={this.toHidebox}/></div>
                                            <p id="page-indicator">{this.state.currentIdx + 1}
                                                / {this.state.imageIds.length}</p>
                                            <a
                                                id="immersive-hover"
                                                onClick={() => {
                                                this.setState({immersive: true})
                                            }}>沉浸模式</a>
                                        </div> */}

                                    </div>
                                    </Grid.Column>
                                    
                                    <Grid.Column width={4}> 
                                        {/* <h3 id="annotator-header">标注人：{window
                                                    .location
                                                    .pathname
                                                    .split('/')[3]}{StartReviewButton}</h3> */}
                                        <div id='listTitle'>
                                                <div style={{display:'inline-block',marginLeft:'10px',marginTop:'15px'}}>可疑结节：{this.state.boxes.length}个</div>
                                                
                                        </div>
                                        <div id='elec-table'>
                                            <Accordion styled id="cornerstone-accordion" fluid>
                                                {tableContent}
                                            </Accordion>
                                        </div>
                                        <div id='report'>
                                            <Tab menu={{ borderless: false, inverted: false, attached: true, tabular: true,size:'huge' }} 
                                                panes={panes} />
                                        </div>
                                    </Grid.Column>
                                </Grid.Row>
                                
                            </Grid>
                        {/* </div> */}
                    </div>
                )
            } else {
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
                                        <Popup
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
                                    />                                               
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
                                        {menuTools === 'slide'?
                                            <Button icon title='切换切片' onClick={this.slide} className='funcbtn' active><Icon name='sort' size='large'></Icon></Button>:
                                            <Button icon title='切换切片' onClick={this.slide} className='funcbtn'><Icon name='sort' size='large'></Icon></Button>
                                        }
                                        
                                        {menuTools === 'wwwc'?
                                            <Button icon title='窗宽窗位' onClick={this.wwwcCustom} className='funcbtn' active><Icon name='sliders' size='large'></Icon></Button>:
                                            <Button icon title='窗宽窗位' onClick={this.wwwcCustom} className='funcbtn'><Icon name='sliders' size='large'></Icon></Button>
                                        }
                                        <Button icon title='暂存' onClick={this.temporaryStorage} className='funcbtn'><Icon name='inbox' size='large'></Icon></Button>
                                        {submitButton}
                                        <Button title='3D' className='funcbtn'>3D</Button>
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
                            <Grid celled className='corner-contnt' >
                                <Grid.Row className='corner-row' columns={3}>
                                    <Grid.Column width={2}>
                                        <StudyBrowserList caseId={this.state.caseId} handleClickScreen={this.props.handleClickScreen}/>
                                    </Grid.Column>
                                    <Grid.Column width={10} textAlign='center' id='canvas-column'>
                                    <div className='canvas-style' id='canvas-border'>
                                    <div
                                            id="origin-canvas"
                                            // style={divStyle}
                                            ref={input => {
                                            this.element = input
                                        }}>
                                            <canvas className="cornerstone-canvas" id="canvas"/>
                                            {/* <canvas className="cornerstone-canvas" id="length-canvas"/> */}
                                            <div id='dicomTag'>
                                                <div style={topLeftStyle}>{dicomTag.string('x00100010')}</div>
                                                <div style={{position:'absolute',color:'white',top:'20px',left:'-95px'}}>{dicomTag.string('x00101010')} {dicomTag.string('x00100040')}</div>
                                                <div style={{position:'absolute',color:'white',top:'35px',left:'-95px'}}>{dicomTag.string('x00100020')}</div>
                                                <div style={{position:'absolute',color:'white',top:'50px',left:'-95px'}}>{dicomTag.string('x00185100')}</div>
                                                <div style={{position:'absolute',color:'white',top:'65px',left:'-95px'}}>IM: {parseInt(this.state.currentIdx) + 1} / {this.state.imageIds.length}</div>
                                                <div style={topRightStyle}>{dicomTag.string('x00080080')}</div>
                                                <div style={{position:'absolute',color:'white',top:'20px',right:'-95px'}}>ACC No: {dicomTag.string('x00080050')}</div>
                                                <div style={{position:'absolute',color:'white',top:'35px',right:'-95px'}}>{dicomTag.string('x00090010')}</div>
                                                <div style={{position:'absolute',color:'white',top:'50px',right:'-95px'}}>{dicomTag.string('x0008103e')}</div>
                                                <div style={{position:'absolute',color:'white',top:'65px',right:'-95px'}}>{dicomTag.string('x00080020')}</div>
                                                <div style={{position:'absolute',color:'white',top:'80px',right:'-95px'}}>T: {dicomTag.string('x00180050')}</div>
                                            </div>
                                            <div className='dicomTag' style={{position:'absolute',color:'white',bottom:'20px',left:'-95px'}}>Offset: {this.state.viewport.translation['x'].toFixed(1)}, {this.state.viewport.translation['y'].toFixed(1)}
                                            </div>
                                            <div style={bottomLeftStyle}>Zoom: {Math.round(this.state.viewport.scale * 100)} %</div>
                                            <div style={bottomRightStyle}>
                                                WW/WC: {Math.round(this.state.viewport.voi.windowWidth)}
                                                /{" "} {Math.round(this.state.viewport.voi.windowCenter)}
                                            </div>
                                        </div>

                                    </div>
                                    <div className='antd-slider'>
                                        <Slider 
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
                                    </div>
                                    </Grid.Column>
                                    <Grid.Column width={4}> 
                                        <div id='listTitle'>
                                            <div style={{display:'inline-block',marginLeft:'10px',marginTop:'15px'}}>可疑结节：{this.state.boxes.length}个</div>
                                        </div>
                                    
                                        {/* <h3 id="annotator-header">标注人：{window
                                            .location
                                            .pathname
                                            .split('/')[3]}</h3> */}
                                        <div id='elec-table'>
                                            <Accordion styled id="cornerstone-accordion" fluid>
                                                {tableContent}
                                            </Accordion>
                                    
                                        </div>
                                        <div id='report'>
                                            <Tab menu={{ borderless: false, inverted: false, attached: true, tabular: true,size:'huge' }} 
                                            panes={panes} />
                                        </div>
                                    </Grid.Column>
                                </Grid.Row>
                                
                            </Grid>
                        {/* </div> */}

                    </div>
                )
            }

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
        // console.log("Drawing box", context.canvas)
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
        // context.rect(box.x1-1, box.y1-1, width+2, height+2)
        if(width > height){
            context.arc(xCenter, yCenter, width/2+3, 0*Math.PI,2*Math.PI)
        }else{
            context.arc(xCenter, yCenter, height/2+3, 0*Math.PI,2*Math.PI)
        }
        
        context.lineWidth = 1
        context.stroke()
        if (box.nodule_no != undefined) {
            context.fillText(parseInt(box.nodule_no)+1, xCenter - 3, new_y1 - 10)
        }

    }

    findCurrentArea(x, y) {
        // console.log('x, y', x, y)
        const lineOffset = 2;
        for (var i = 0; i < this.state.boxes.length; i++) {
            const box = this.state.boxes[i]
            if (box.slice_idx == this.state.currentIdx) {
                const xCenter = box.x1 + (box.x2 - box.x1) / 2;
                const yCenter = box.y1 + (box.y2 - box.y1) / 2;
                if (box.x1 - lineOffset < x && x < box.x1 + lineOffset) {
                    if (box.y1 - lineOffset < y && y < box.y1 + lineOffset) {
                        return {box: i, pos: 'tl'};
                    } else if (box.y2 - lineOffset < y && y < box.y2 + lineOffset) {
                        return {box: i, pos: 'bl'};
                    } else if (yCenter - lineOffset < y && y < yCenter + lineOffset) {
                        return {box: i, pos: 'l'};
                    }
                } else if (box.x2 - lineOffset < x && x < box.x2 + lineOffset) {
                    if (box.y1 - lineOffset < y && y < box.y1 + lineOffset) {
                        return {box: i, pos: 'tr'};
                    } else if (box.y2 - lineOffset < y && y < box.y2 + lineOffset) {
                        return {box: i, pos: 'br'};
                    } else if (yCenter - lineOffset < y && y < yCenter + lineOffset) {
                        return {box: i, pos: 'r'};
                    }
                } else if (xCenter - lineOffset < x && x < xCenter + lineOffset) {
                    if (box.y1 - lineOffset < y && y < box.y1 + lineOffset) {
                        return {box: i, pos: 't'};
                    } else if (box.y2 - lineOffset < y && y < box.y2 + lineOffset) {
                        return {box: i, pos: 'b'};
                    } else if (box.y1 - lineOffset < y && y < box.y2 + lineOffset) {
                        return {box: i, pos: 'i'};
                    }
                } else if (box.x1 - lineOffset < x && x < box.x2 + lineOffset) {
                    if (box.y1 - lineOffset < y && y < box.y2 + lineOffset) {
                        return {box: i, pos: 'i'};
                    }
                }
            }
        }
        return {box: -1, pos: 'o'};
    }

    handleRangeChange(e) {
        console.log('slider',e)
        // this.setState({currentIdx: event.target.value - 1, imageId:
        // this.state.imageIds[event.target.value - 1]})
        // let style = $("<style>", {type:"text/css"}).appendTo("head");
        // style.text('#slice-slider::-webkit-slider-runnable-track{background:linear-gradient(90deg,#0033FF 0%,#000033 '+ (event.target.value -1)*100/this.state.imageIds.length+'%)}');
        this.refreshImage(false, this.state.imageIds[e-1], e-1)
    }

    createBox(x1, x2, y1, y2, slice_idx, nodule_idx) {
        let pixelArray = []
        const imageId = this.state.imageIds[slice_idx]
        console.log('image',imageId)
        cornerstone
        .loadAndCacheImage(imageId)
        .then(image => {
            const pixeldata = image.getPixelData()
            console.log('pixeldata',pixeldata)
            for(var i=~~x1;i<=x2;i++){
                for(var j=~~y1;j<=y2;j++){
                    pixelArray.push(pixeldata[512*j+i] - 1024)
                }
            }
            var asc = function(a,b){return a-b}
            console.log('array',pixelArray)
            const data = pixelArray
            data.sort(asc)
            console.log('data',data)
            var dis = (data[data.length-1] - data[0]) / 30
            var bins = new Array(31).fill(0)
            var ns = new Array(30).fill(0)
            bins[0] = data[0]
            for(var i=1;i<31;i++){
                if(i === 30){
                    bins[30] = data[data.length-1]
                }
                else{
                    bins[i] = bins[i-1] + dis
                }
                for(var j=0;j<data.length;j++){
                    if(data[j]>=bins[i-1] && data[j] <=bins[i]){
                        ns[i-1]+=1
                    }
                }
            }
            console.log('bins',bins,ns)
            var obj = {}
            obj.bins = bins
            obj.n = ns
            var nodule_hist = []
            nodule_hist.push(obj)
            const newBox = {
                // "calcification": [], "lobulation": [],
                "malignancy": -1,
                "nodule_no": nodule_idx,
                "patho": "",
                "place": "",
                "probability": 1,
                "slice_idx": slice_idx,
                "nodule_hist":obj,
                // "spiculation": [], "texture": [],
                "x1": x1,
                "x2": x2,
                "y1": y1,
                "y2": y2,
                "highlight": false,
                "diameter":0.00
            }
            let boxes = this.state.boxes
            console.log("newBox", newBox)
            boxes.push(newBox)
            this.setState({boxes: boxes})
            console.log("Boxes", this.state.boxes)
            this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)    
        })
    }

    // preventMouseWheel(event){
    //     const e = event || window.event
    //     if(e.stopPropagation) e.stopPropagation()
    //     else e.cancelBubble = true
    //     if(e.preventDefault) e.preventDefault()
    //     else e.returnValue = false
    // }

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
        console.log("mouseover")
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
            this.refreshImage(false, this.state.imageIds[newCurrentIdx], newCurrentIdx)
        }
        }else{//向上滚动
            let newCurrentIdx = this.state.currentIdx - 1
            if (newCurrentIdx >= 0) {
                this.refreshImage(false, this.state.imageIds[newCurrentIdx], newCurrentIdx)
            }
        }
    }

    onMouseMove(event) {
        console.log('onmouse Move')
        const clickX = event.offsetX
        const clickY = event.offsetY
        let x = 0
        let y = 0
        if(this.state.leftButtonTools === 1){
            if(JSON.stringify(this.state.mouseClickPos) !== '{}'){
            // console.log('clicked')
                if(JSON.stringify(this.state.mousePrePos) === '{}'){
                    this.setState({mousePrePos:this.state.mouseClickPos})
                }
                this.setState({mouseCurPos:{
                    'x':clickX,
                    'y':clickY
                }})
                // console.log('pos',this.state.mousePrePos)
                const mouseCurPos = this.state.mouseCurPos
                const mousePrePos = this.state.mousePrePos
                const mouseClickPos = this.state.mouseClickPos
                const prePosition = mousePrePos.y - mouseClickPos.y
                const curPosition = mouseCurPos.y - mouseClickPos.y
                if(mouseCurPos.y !== mousePrePos.y){
                    let y_dia = mouseCurPos.y - mousePrePos.y
                    
                    if(this.state.leftBtnSpeed !== 0){
                        var slice_len = Math.round(y_dia/this.state.leftBtnSpeed)
                        // console.log('divation',this.state.mouseCurPos,this.state.mousePrePos,this.state.mouseClickPos,y_dia,this.state.leftBtnSpeed,slice_len)
                        // for(var i = 0;i < Math.abs(slice_len); i++){
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
                        // }
                    }
                    
                }
                this.setState({mousePrePos:mouseCurPos})
            }
        }
        
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
            else if (!this.state.clicked) 
                document.getElementById("canvas").style.cursor = "auto"
        }

        if (this.state.clicked && this.state.clickedArea.box === -1) {
            let tmpBox = this.state.tmpBox
            let tmpCoord = this.state.tmpCoord
            let r = ((tmpCoord.x1 - x)**2+(tmpCoord.y1 - y)**2)**0.5
            tmpBox.x1 = tmpCoord.x1 - r
            tmpBox.y1 = tmpCoord.y1 - r
            tmpBox.x2 = tmpCoord.x1 + r
            tmpBox.y2 = tmpCoord.y1 + r
            // tmpBox.x2 = x
            // tmpBox.y2 = y
            this.setState({tmpBox})
            this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
            // this.drawTmpBox()
        } else if (this.state.clicked && this.state.clickedArea.box !== -1) {
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

            console.log("Current Box", currentBox)

            boxes[this.state.clickedArea.box] = currentBox
            this.setState({boxes: boxes})
            this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
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
        if (event.which == 37 || event.which == 38) {
            event.preventDefault()
            let newCurrentIdx = this.state.currentIdx - 1
            if (newCurrentIdx >= 0) {
                this.refreshImage(false, this.state.imageIds[newCurrentIdx], newCurrentIdx)
            }
            // if(newCurrentIdx - 5 < 0){
            //     for(var i = 0;i <= newCurrentIdx + 5 ;i++){
            //         if(i === newCurrentIdx) continue
            //         this.cacheImage(this.state.imageIds[i])
            //     }
            // }
            // else if(newCurrentIdx + 5 > this.state.imageIds.length){
            //     for(var i = this.state.imageIds.length - 1;i >= newCurrentIdx - 5 ;i--){
            //         if(i === newCurrentIdx) continue
            //         this.cacheImage(this.state.imageIds[i])
            //     }
            // }
            // else{
            //     for(var i = newCurrentIdx - 5;i <= newCurrentIdx + 5 ;i){
            //         if(i === newCurrentIdx) continue
            //         this.cacheImage(this.state.imageIds[i])
            //     }
            // }
        }
        if (event.which == 39 || event.which == 40) {
            event.preventDefault()
            let newCurrentIdx = this.state.currentIdx + 1
            if (newCurrentIdx < this.state.imageIds.length) {
                this.refreshImage(false, this.state.imageIds[newCurrentIdx], newCurrentIdx)
            }
            // if(newCurrentIdx - 5 < 0){
            //     for(var i = 0;i <= newCurrentIdx + 5 ;i++){
            //         if(i === newCurrentIdx) continue
            //         this.refreshImage(false, this.state.imageIds[i], newCurrentIdx)
            //     }
            // }
            // else if(newCurrentIdx + 5 > this.state.imageIds.length){
            //     for(var i = this.state.imageIds.length - 1;i >= newCurrentIdx - 5 ;i--){
            //         if(i === newCurrentIdx) continue
            //         this.refreshImage(false, this.state.imageIds[i], newCurrentIdx)
            //     }
            // }
            // else{
            //     for(var i = newCurrentIdx - 5;i <= newCurrentIdx + 5 ;i){
            //         if(i === newCurrentIdx) continue
            //         this.refreshImage(false, this.state.imageIds[i], newCurrentIdx)
            //     }
            // }

        }
        if (event.which == 72) {
            this.toHidebox() 
        }
    }

    onMouseDown(event) {
        console.log('onmouse Down')
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

            const coords = {
                x1: x,
                x2: x,
                y1: y,
                y2: y
            }

            // const coords = {
            //     x:x,
            //     y:y
            // }
            let content = this.findCurrentArea(x, y)
            if (content.pos == 'o' && this.state.leftButtonTools === 0) {
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
            // this.setState({clicked: true, clickedArea: content, tmpBox: coords})
            this.setState({clicked: true, clickedArea: content, tmpCoord: coords})
        }
        else if(event.button == 1){
            event.preventDefault()
        }
    }

    onMouseOut(event) {
        console.log('onmouse Out')
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
        console.log('up', this.state.clickedArea)
        const element = document.querySelector('#origin-canvas')
        const currentToolType = this.state.toolState
        let measureList = this.state.measureList
        this.setState({mouseClickPos:{},mousePrePos:{},mouseCurPos:{}})
        if (this.state.clickedArea.box === -1 && this.state.leftButtonTools === 0) {
            const x1 = this.state.tmpBox.x1
            const y1 = this.state.tmpBox.y1
            const x2 = this.state.tmpBox.x2
            const y2 = this.state.tmpBox.y2
            let newNodule_no = -1
            const boxes = this.state.boxes
            for (var i = 0; i < boxes.length; i++) {
                const current_nodule_no = parseInt(boxes[i].nodule_no)
                if (current_nodule_no > newNodule_no) {
                    newNodule_no = current_nodule_no
                }
            }
            this.createBox(x1, x2, y1, y2, this.state.currentIdx, (1+newNodule_no).toString())
        }
        
        // if(this.state.toolState !== ''){
            
        //     console.log('origin',measureList,measureList.length === 0)
        //     if(measureList.length === 0 ){
        //         measureList['EllipticalRoi'] = []
        //         measureList['Bidirectional'] = []
        //         // 'EllipticalRoi','Bidirectional'
        //     }
        //     console.log('measure',measureList,measureList.length === 0)
        //     for (let i = 0; i < toolROITypes.length; i++) {
        //         let toolROIType = toolROITypes[i];
        //         // let toolROIData = globalImageIdSpecificToolStateManager.getImageIdToolState(this.state.imageIds[this.state.currentIdx], toolROIType);
        //         // console.log('tool',toolROIData)++
        //         let toolROIData = cornerstoneTools.getToolState(element,toolROIType)
        //         // console.log('toolROIData',toolROIData)
        //         // if(toolROIType === currentToolType){
        //         //     toolROIData.data[toolROIData.data.length-1]['imageId'] = this.state.currentIdx
        //         // }
        //         if (toolROIData !== undefined) {
        //             allROIToolData[toolROITypes[i]] = toolROIData;
        //         }
        //     }
        //     console.log('toolROIData',allROIToolData)
        //     let toolROIData = cornerstoneTools.getToolState(element,currentToolType)
        //     toolROIData.data[toolROIData.data.length-1]['imageId'] = this.state.currentIdx
        //     console.log(toolROIData)
        //     const index = measureList[currentToolType].length
        //     console.log('index',index)
        //     measureList[currentToolType].push(toolROIData.data[toolROIData.data.length-1])
        //     // let toolROIDataString = JSON.stringify(allROIToolData);
        //     // console.log('ROIData',allROIToolData)
        //     // localStorage.setItem('ROI',toolROIDataString)
        //     // this.setState({measureList:measureList})
        //     console.log('list',this.state.measureList)
        // }
        this.setState({
            clicked: false,
            clickedArea: {},
            tmpBox: {},
            tmpCoord:{},
            // measureList:measureList
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
        this.setState({
            random: Math.random(),
            menuTools:''
        })
    }

    //提交结节
    submit() {
        this.setState({menuTools:''})
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
        this.setState({menuTools:''})
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
        const element = document.getElementById("origin-canvas")
        const viewport = cornerstone.getViewport(element)
        if (this.state.showNodules === true && this.state.caseId === window.location.pathname.split('/')[2]) {
            for (let i = 0; i < this.state.boxes.length; i++) {
                // if (this.state.boxes[i].slice_idx == this.state.currentIdx && this.state.immersive == false) 
                if (this.state.boxes[i].slice_idx == this.state.currentIdx) 
                    this.drawBoxes(this.state.boxes[i])
            }

        }

        // if (this.state.clicked && this.state.clickedArea.box == -1 && this.state.immersive == false) {
        // if (this.state.clicked && this.state.clickedArea.box == -1 && this.state.isbidirectionnal === false) {
        if (this.state.clicked && this.state.clickedArea.box == -1 && this.state.leftButtonTools == 0) { 
            this.drawBoxes(this.state.tmpBox)
        }
        else if(this.state.clicked && this.state.clickedArea.box == -1 && this.state.isbidirectionnal === true){
            this.lengthMeasure(this.state.tmpBox)
        }

        this.setState({viewport})
    }

    onNewImage() {
        // console.log("onNewImage") const enabledElement =
        // cornerstone.getEnabledElement(this.element) this.setState({imageId:
        // enabledElement.image.imageId})
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
        if (initial) {
            cornerstone.enable(element)
        } else {
            cornerstone.getEnabledElement(element)
        }
        // console.log(imageId)
        cornerstone
            .loadAndCacheImage(imageId)
            .then(image => {
                // if(this.state.TagFlag === false){
                //     console.log('image info',image.data)
                //     this.setState({dicomTag:image.data,TagFlag:true})
                // }
                if (initial) {
                    console.log(this.state.viewport.voi)
                    if (this.state.viewport.voi.windowWidth === undefined || this.state.viewport.voi.windowCenter === undefined) {
                        image.windowCenter = -600
                        image.windowWidth = 1600
                    } else {
                        image.windowCenter = this.state.viewport.voi.windowCenter
                        image.windowWidth = this.state.viewport.voi.windowWidth
                    }

                }
                cornerstone.displayImage(element, image)
                
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
                    //mousebuttonmask:4-middle,2-right,1-left
                    // cornerstoneTools.addToolForElement(element, wwwc)
                    // cornerstoneTools.setToolActiveForElement(
                    //     element,
                    //     'Wwwc',
                    //     {
                    //         mouseButtonMask: 2, //middle mouse button
                    //     },
                    //     ['Mouse']
                    // )

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
                        // cornerstoneTools.addToolForElement(element, zoomMouseWheel)
                        // cornerstoneTools.setToolActiveForElement(
                        //     element,
                        //     'ZoomMouseWheel',
                        //     { 
                        //         mouseButtonMask: 2,
                        //     }
                        // )
                        cornerstoneTools.addToolForElement(element, zoomWheel)
                        cornerstoneTools.setToolActiveForElement(
                            element,
                            'Zoom',
                            { 
                                mouseButtonMask: 2,
                            }
                        )

                        // cornerstoneTools
                        //     .pan
                        //     .activate(element, 4) // pan is the default tool for right mouse button
                        // cornerstoneTools
                        //     .zoomWheel
                        //     .activate(element) // zoom is the default tool for middle mouse wheel

                        // cornerstoneTools
                        //     .touchInput
                        //     .enable(element)
                        // cornerstoneTools
                        //     .panTouchDrag
                        //     .activate(element)
                        // cornerstoneTools
                        //     .zoomTouchPinch
                        //     .activate(element)
                }
                // else{
                //     // console.log(image.getPixelData())
                //     cornerstoneTools.addToolForElement(element, bidirectional)
                //     cornerstoneTools.setToolActiveForElement(
                //         element,
                //         'Bidirectional',
                //         {
                //             mouseButtonMask:1,
                //         },
                //         ['Mouse']
                //     )
                // }
                
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
            }
                // window.addEventListener("resize", this.onWindowResize) if (!initial) {
                // this.setState({currentIdx: newIdx}) }
            })
    }

    // cacheImage(imageId){
    //     cornerstone.loadAndCacheImage(imageId)
    // }

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
        this.checkHash()
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
        this.refreshImage(true, this.state.imageIds[this.state.currentIdx], undefined)
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
            console.log('1484', res)
        }).catch(err => {
            console.log(err)
        })
        
        // Promise.all([
        //     axios.post(draftConfig.getModelResults, qs.stringify(params), {headers}),
        //     axios.post(draftConfig.getAnnoResults, qs.stringify(params), {headers}),
        //     axios.post(reviewConfig.getReviewResults, qs.stringify(params), {headers})
        // ]).then(([res1, res2, res3]) => {
        //     const modelList = res1.data.dataList
        //     const annoList = res2.data.dataList
        //     const reviewList = res3.data.dataList

        //     let modelStr = ''
        //     let annoStr = ''
        //     let reviewStr = ''

        //     if (modelList.length > 0) {
        //         // console.log(modelList)
        //         for (var i = 0; i < modelList.length; i++) {
        //             modelStr += '<a href="/case/' + this.state.caseId + '/' + modelList[i] + '"><div class="ui blue label">'
        //             modelStr += modelList[i]
        //             modelStr += '</div></a>'
        //             modelStr += '</br></br>'
        //         }
        //         this.setState({modelResults: modelStr})
        //         // console.log('模型结果',modelStr)
        //     }

        //     if (annoList.length > 0) {
        //         for (var i = 0; i < annoList.length; i++) {
        //             annoStr += '<a href="/case/' + this.state.caseId + '/' + annoList[i] + '"><div class="ui label">'
        //             annoStr += annoList[i]
        //             annoStr += '</div></a>'
        //             annoStr += '</br></br>'
        //         }
        //         this.setState({annoResults: annoStr,newAnno:false})
        //     }

        //     if (reviewList.length > 0) {
        //         for (var i = 0; i < reviewList.length; i++) {
        //             reviewStr += '<a href="/review/' + this.state.caseId + '/' + reviewList[i] + '"><div class="ui teal label">'
        //             reviewStr += reviewList[i]
        //             reviewStr += '</div></a>'
        //             reviewStr += '</br></br>'
        //         }
        //         this.setState({reviewResults: reviewStr})
        //     }
        // }).catch((error) => {
        //     console.log(error)
        // })
        if(document.getElementById('hideNodule') != null){
            document.getElementById('hideNodule').style.display='none'
        }
        if(document.getElementById('hideInfo') != null){
            document.getElementById('hideInfo').style.display='none'
        }
        // let style = $("<style>", {type:"text/css"}).appendTo("head");
        // style.text('#slice-slider::-webkit-slider-runnable-track{background:linear-gradient(90deg,#0033FF 0%,#000033 '+ (document.getElementById('slice-slider').value)*100/this.state.imageIds.length+'%)}');
        // for(let i=0;i<this.state.boxes.length;i++){
        //     let point=document.getElementById('sign'+i)
        //     // let leftMargin=parseFloat($('#slice-slider').width())/2+parseFloat($('input[type=range]').css('left').split('px')[0])+'px'
        //     let leftMargin=100+'px'
        //     console.log('leftmargin',parseFloat($('#slice-slider').width())/2,parseFloat($('input[type=range]').css('left')))
        //     point.style.top=(15-this.state.imageIds.length/20)+(this.state.imageIds.length-this.state.boxes[i].slice_idx)*0.07+(this.state.boxes[i].slice_idx)*document.getElementById("canvas").style.width.split('px')[0]/this.state.imageIds.length+'px'
        //     point.style.left=leftMargin
            
        //     // console.log('slice',parseFloat($('#slice-slider') )
        // }
        if(this.state.imageIds.length !==0){
            const leftBtnSpeed = Math.floor(document.getElementById('canvas').offsetWidth / this.state.imageIds.length)
            this.setState({leftBtnSpeed:leftBtnSpeed})
        }
        


        let listitems=document.getElementById('cornerstone-accordion')
        listitems.addEventListener('dblclick',this.doubleClickListItems.bind(this))
    }

    componentWillUnmount() {
        console.log('remove')
        const element = this.element
        element.removeEventListener("cornerstoneimagerendered", this.onImageRendered)

        element.removeEventListener("cornerstonenewimage", this.onNewImage)

        // window.removeEventListener("resize", this.onWindowResize)
        document.removeEventListener("keydown", this.onKeydown)
        cornerstone.disable(element)
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
            console.log(this.state.boxes)
            this.saveToDB()
        }
        if(prevState.listsActiveIndex!==-1 && prevState.listsActiveIndex !== this.state.listsActiveIndex){
            const visId = 'visual-' + prevState.listsActiveIndex
            if(document.getElementById(visId) !== undefined){
                document.getElementById(visId).innerHTML=''
            }
            else{
                console.log('visId is not exist!')
            }
            console.log('listsActiveIndex',prevState.listsActiveIndex,this.state.listsActiveIndex)
            // document.
        }
    }
}

export default CornerstoneElement
