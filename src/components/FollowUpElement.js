import React, {Component} from "react"
import StudyBrowserList from '../components/StudyBrowserList'
import ReactHtmlParser from 'react-html-parser'
import dicomParser from 'dicom-parser'
import reactDom, {render} from "react-dom"
import * as cornerstone from "cornerstone-core"
import * as cornerstoneMath from "cornerstone-math"
import * as cornerstoneTools from "cornerstone-tools"
import Hammer from "hammerjs"
import * as cornerstoneWadoImageLoader from "cornerstone-wado-image-loader"
import {withRouter} from 'react-router-dom'
import {  Grid, Table, Icon, Button, Accordion, Modal,Dropdown,Popup,Form,Tab, Container, Image, Menu, Label, Card, Header,Progress } from 'semantic-ui-react'
import '../css/FollowUpElement.css'
import qs from 'qs'
import axios from "axios"
import { Slider, Select, notification, Sapce, Space, Checkbox, Tabs, Row, Col } from "antd"
import src1 from '../images/scu-logo.jpg'

import echarts from 'echarts/lib/echarts';
import  'echarts/lib/chart/bar';
import 'echarts/lib/component/tooltip';
import 'echarts/lib/component/title';
import 'echarts/lib/component/toolbox'

const {Option} = Select

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
    left: "-95px", // 5px
    position: "absolute",
    color: "white"
}

let topRightStyle = {
    top: "5px",
    right: "-95px", //5px
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

class FollowUpElement extends Component {
    constructor(props){
        super(props)
        this.state={
            username: props.username,
            stack: props.stack,
            viewport: cornerstone.getDefaultViewport(null, undefined),
            curImageIds: props.stack.curImageIds === ''?[]:props.stack.curImageIds,
            curCaseId: props.stack.curCaseId,
            curBoxes: props.stack.curBoxes === ''?[]:props.stack.curBoxes,
            curDicomTag: props.stack.curDicomTag === ''?[]:props.stack.curDicomTag,
            currentIdx: 0,
            preImageIds: props.stack.preImageIds === ''?[]:props.stack.preImageIds,
            preCaseId: props.stack.preCaseId,
            preBoxes: props.stack.preBoxes === ''?[]:props.stack.preBoxes,
            preDicomTag: props.stack.preDicomTag === ''?[]:props.stack.preDicomTag,
            previewsIdx: 0,
            clicked: false,
            clickedArea: {},
            showNodules: true,
            showInfo: true,
            
            random: Math.random()
        }
        this.nextPath = this
            .nextPath
            .bind(this)
        this.refreshCurrentImage = this
            .refreshCurrentImage
            .bind(this)
        this.refreshPreviewsImage = this
            .refreshPreviewsImage
            .bind(this)
    }

    componentDidMount(){
        this.refreshCurrentImage(true, this.state.curImageIds[this.state.currentIdx], undefined)
        this.refreshPreviewsImage(true, this.state.preImageIds[this.state.previewsIdx], undefined)
    }

    nextPath(path) {
        this.props.history.push(path)
    }

    refreshCurrentImage(initial, imageId, newIdx){
        const element = document.querySelector('#current-origin-canvas');

        if (!initial) {
            this.setState({currentIdx: newIdx})
        }

        if (initial) {
            cornerstone.enable(element)
            console.log('enable',cornerstone.enable(element))
        } else {
            cornerstone.getEnabledElement(element)
            console.log(cornerstone.getEnabledElement(element))
        }
        cornerstone
            .loadAndCacheImage(imageId)
            .then(image => {
                if (initial) {
                    if (this.state.viewport.voi.windowWidth === undefined || this.state.viewport.voi.windowCenter === undefined) {
                        image.windowCenter = -600
                        image.windowWidth = 1600
                    } else {
                        image.windowCenter = this.state.viewport.voi.windowCenter
                        image.windowWidth = this.state.viewport.voi.windowWidth
                    }
                }
                if(element !== undefined){
                    cornerstone.displayImage(element, image)
                }
                
                this.setState({currentImage: image})
                if(initial){
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
                
                
            element.addEventListener("cornerstoneimagerendered", this.onImageRendered)
            element.addEventListener("cornerstonenewimage", this.onNewImage)
            element.addEventListener("contextmenu", this.onRightClick)
            element.addEventListener("mousedown", this.onMouseDown)
            element.addEventListener("mousemove", this.onMouseMove)
            element.addEventListener("mouseup", this.onMouseUp)
            element.addEventListener("mouseout", this.onMouseOut)
            element.addEventListener("mouseover",this.onMouseOver)
            document.addEventListener("keydown", this.onKeydown)
            }
        })
    }

    refreshPreviewsImage(initial, imageId, newIdx){
        const element = document.querySelector('#previews-origin-canvas');

        if (!initial) {
            this.setState({previewsIdx: newIdx})
        }

        if (initial) {
            cornerstone.enable(element)
            console.log('enable',cornerstone.enable(element))
        } else {
            cornerstone.getEnabledElement(element)
            console.log(cornerstone.getEnabledElement(element))
        }
        cornerstone
            .loadAndCacheImage(imageId)
            .then(image => {
                if (initial) {
                    if (this.state.viewport.voi.windowWidth === undefined || this.state.viewport.voi.windowCenter === undefined) {
                        image.windowCenter = -600
                        image.windowWidth = 1600
                    } else {
                        image.windowCenter = this.state.viewport.voi.windowCenter
                        image.windowWidth = this.state.viewport.voi.windowWidth
                    }
                }
                if(element !== undefined){
                    cornerstone.displayImage(element, image)
                }
                
                this.setState({currentImage: image})
                if(initial){
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
                
                
            element.addEventListener("cornerstoneimagerendered", this.onImageRendered)
            element.addEventListener("cornerstonenewimage", this.onNewImage)
            element.addEventListener("contextmenu", this.onRightClick)
            element.addEventListener("mousedown", this.onMouseDown)
            element.addEventListener("mousemove", this.onMouseMove)
            element.addEventListener("mouseup", this.onMouseUp)
            element.addEventListener("mouseout", this.onMouseOut)
            element.addEventListener("mouseover",this.onMouseOver)
            document.addEventListener("keydown", this.onKeydown)
            }
        })
    }

    render(){
        const welcome = '欢迎您，' + localStorage.realname;
        return(
            <div id='follow-up'>
                <Menu className='corner-header'>
                    <Menu.Item>
                        <Image src={src1} avatar size='mini'/>
                        <a id='sys-name' href='/searchCase'>DeepLN肺结节全周期<br/>管理数据平台</a>
                    </Menu.Item>
                    <Menu.Item className='hucolumn'>
                        <Button.Group>
                            <Button
                                onClick={this.toPulmonary}
                                content='肺窗'
                                className='hubtn'
                                />
                            <Button
                                onClick={this.toBoneWindow} //骨窗窗宽窗位函数
                                content='骨窗'
                                className='hubtn'
                                />
                            <Button
                                onClick={this.toVentralWindow} //腹窗窗宽窗位函数
                                content='腹窗'
                                className='hubtn'
                                />
                            <Button
                                onClick={this.toMedia}
                                content='纵隔窗'
                                className='hubtn'
                                />
                        </Button.Group>
                    </Menu.Item>
                    <span id='line-left'></span>
                    <Menu.Item className='funcolumn'>
                        <Button.Group>
                            <Button
                                icon
                                title='灰度反转'
                                onClick={this.imagesFilp}
                                className='funcbtn'
                                ><Icon name='adjust' size='large'></Icon></Button>
                            <Button
                                icon
                                title='放大'
                                onClick={this.ZoomIn}
                                className='funcbtn'
                                ><Icon name='search plus' size='large'></Icon></Button>
                            <Button
                                icon
                                title='缩小'
                                onClick={this.ZoomOut}
                                className='funcbtn'
                                ><Icon name='search minus' size='large'></Icon></Button>
                            <Button icon onClick={this.reset} className='funcbtn' title='刷新'><Icon name='repeat' size='large'></Icon></Button>
                            <Button icon onClick={this.toHidebox} className='funcbtn' id='showNodule' title='显示结节'><Icon id="cache-button" name='eye' size='large'></Icon></Button>
                            <Button icon onClick={this.toHidebox} className='funcbtn' id='hideNodule' title='隐藏结节'><Icon id="cache-button" name='eye slash' size='large'></Icon></Button>
                            <Button icon onClick={this.toHideInfo} className='funcbtn' id='showInfo' title='显示信息'><Icon id="cache-button" name='content' size='large'></Icon></Button>
                            <Button icon onClick={this.toHideInfo} className='funcbtn' id='hideInfo' title='隐藏信息'><Icon id="cache-button" name='delete calendar' size='large'></Icon></Button>
                        </Button.Group>
                    </Menu.Item>
                    <span id='line-right'></span>
                    
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
                <Row>
                    <Col span={12}> {/* current case */}
                        <div className='canvas-style' id='canvas-border'>
                            <div
                                    id="current-origin-canvas"
                                    ref={input => {
                                    this.element = input
                                }}>
                            <canvas className="cornerstone-canvas" id="current-canvas"/>
                                {/* {dicomTagPanel}  */}
                        </div>

                        </div>
                        <div className='antd-slider'>
                            <Slider 
                                vertical
                                reverse
                                tipFormatter={null}
                                // marks={sliderMarks} 
                                value={this.state.currentIdx+1} 
                                onChange={this.handleRangeChange}
                                // onAfterChange={this.handleRangeChange.bind(this)} 
                                min={1}
                                step={1}
                                max={this.state.curImageIds.length}
                            />
                        </div>
                    </Col>
                    <Col span={12}>{/* current case */}
                        <div className='canvas-style' id='canvas-border'>
                            <div
                                    id="previews-origin-canvas"
                                    ref={input => {
                                    this.element = input
                                }}>
                            <canvas className="cornerstone-canvas" id="previews-canvas"/>
                                {/* {dicomTagPanel}  */}
                        </div>

                        </div>
                        <div className='antd-slider'>
                            <Slider 
                                vertical
                                reverse
                                tipFormatter={null}
                                // marks={sliderMarks} 
                                value={this.state.previewsIdx+1} 
                                onChange={this.handleRangeChange}
                                // onAfterChange={this.handleRangeChange.bind(this)}
                                min={1}
                                step={1}
                                max={this.state.preImageIds.length}
                            />
                        </div>

                    </Col>
                </Row>
                <Row>
                    <Col span={12}>

                    </Col>
                    <Col span={12}>
                        
                    </Col>
                </Row>
                
            </div>
        )
    }
}

export default FollowUpElement