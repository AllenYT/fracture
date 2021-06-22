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
import CornerstoneViewport from 'react-cornerstone-viewport'
import {withRouter} from 'react-router-dom'
import '../css/FollowUpElement.css'
import qs from 'qs'
import axios from "axios"
import { Dropdown, Menu, Icon, Image, Button, Accordion} from 'semantic-ui-react'
import { Slider, Select, notification, Sapce, Space, Checkbox, Tabs, Row, Col, Typography, Dropdown as aDropdown, Menu as aMenu, Cascader} from "antd"
import src1 from '../images/scu-logo.jpg'

import echarts from 'echarts/lib/echarts';
import 'echarts/lib/chart/bar';
import 'echarts/lib/component/tooltip';
import 'echarts/lib/component/title';
import 'echarts/lib/component/toolbox'



const {Option} = Select
const {Title, Text} = Typography
const {subMenu} = aMenu
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


const config = require('../config.json')
const draftConfig = config.draft
const recordConfig = config.record
const userConfig = config.user
const reviewConfig = config.review
const segmentCofig = config.segment


class FollowUpElement extends Component {
    constructor(props){
        super(props)
        this.state={
            username: props.username,
            stack: props.stack,
            viewport: props.stack.viewport === ''?cornerstone.getDefaultViewport(null, undefined):props.stack.viewport,
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
            activeViewportIndex: 0,
            curViewportIndex: 0,
            preViewportIndex: 1,
            curImageIdIndex: 0,
            preImageIdIndex: 0,
            isPlaying: false,
            frameRate: 22,
            isRegistering: false,
            curListsActiveIndex: 0,
            tools: [
                // Mouse
                {
                  name: 'Wwwc',
                  mode: 'active',
                  modeOptions: { mouseButtonMask: 1 },
                },
                {
                  name: 'Zoom',
                  mode: 'active',
                  modeOptions: { mouseButtonMask: 2 },
                },
                {
                  name: 'Pan',
                  mode: 'active',
                  modeOptions: { mouseButtonMask: 4 },
                },
                // Scroll
                { name: 'StackScrollMouseWheel', mode: 'active' },
                // Touch
                { name: 'PanMultiTouch', mode: 'active' },
                { name: 'ZoomTouchPinch', mode: 'active' },
                { name: 'StackScrollMultiTouch', mode: 'active' },
              ],
            
            random: Math.random()
        }
        this.nextPath = this
            .nextPath
            .bind(this)
        this.startRegistering = this
            .startRegistering
            .bind(this)
        this.onLungLocationChange = this
            .onLungLocationChange
            .bind(this)
    }

    componentDidMount(){
        const curImageIds = this.state.curImageIds
        const preImageIds = this.state.preImageIds
        
        const curImagePromise = curImageIds.map((curImageId) => {
            return cornerstone.loadAndCacheImage(curImageId)
        })
        const preImagePromise = preImageIds.map((preImageId) => {
            return cornerstone.loadAndCacheImage(preImageId)
        })

        Promise.all([curImagePromise,preImagePromise]).then(( ) => {})
        
    }

    componentDidUpdate(prevProps, prevState){
        if(prevState.activeViewportIndex !== this.state.activeViewportIndex){
            console.log("activeidx", this.state.activeViewportIndex)
        }
    }

    nextPath(path) {
        this.props.history.push(path)
    }

    startRegistering(){
        this.setState({isRegistering: true})
        console.log("register")
    }

    onLungLocationChange(val){
        console.log("location",val)
    }


    render(){
        const welcome = '欢迎您，' + localStorage.realname;
        const {curListsActiveIndex} = this.state
        let curBoxesAccord = ""
        curBoxesAccord = this.state.curBoxes.map((inside,idx) => {
            return( 
            <div key={idx}>
                <Accordion.Title index={idx} active={curListsActiveIndex === idx}>
                <Row gutter={1}>
                    <Col span={2}>
                        <Text>位置</Text>
                    </Col>
                    <Col span={3}>
                        <Cascader options={segmentCofig} onChange={this.onLungLocationChange} placeholder="请选择肺段..." bordered="false" />
                    </Col>
                    <Col span={3}>
                    
                    </Col>
                    <Col span={3}>
                        
                    </Col>
                    <Col span={3}>
                    
                    </Col>
                    <Col span={3}>
                        
                    </Col>
                    <Col span={3}>
                    
                    </Col>
                </Row>
            </Accordion.Title>
            <Accordion.Content>

            </Accordion.Content>
            </div>
               
            )
            
        })
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
                    <Col span={12}> 
                    {/* current case */}
                        <CornerstoneViewport
                            key={this.state.curViewportIndex}
                            tools={this.state.tools}
                            imageIds={this.state.curImageIds}
                            style={{minWidth: '90%', height:'512px', flex: '1'}}
                            imageIdIndex={this.state.curImageIdIndex}
                            isPlaying={this.state.isPlaying}
                            frameRate={this.state.frameRate}
                            initialViewport={this.state.viewport}
                            className={this.state.activeViewportIndex === this.state.curViewportIndex ? 'active' : ''}
                            setViewportActive={() => {
                                this.setState({
                                    activeViewportIndex: this.state.curViewportIndex
                                })
                            }}
                        />
                    </Col>
                    <Col span={12}>   
                        <CornerstoneViewport
                            key={this.state.preViewportIndex}
                            tools={this.state.tools}
                            imageIds={this.state.preImageIds}
                            style={{minWidth: '90%', height:'512px', flex: '1'}}
                            imageIdIndex={this.state.preImageIdIndex}
                            isPlaying={this.state.isPlaying}
                            frameRate={this.state.frameRate}
                            initialViewport={this.state.viewport}
                            className={this.state.activeViewportIndex === this.state.preViewportIndex ? 'active' : ''}
                            setViewportActive={() => {
                                this.setState({
                                    activeViewportIndex: this.state.preViewportIndex
                                })
                            }}
                        />
                    </Col>
                </Row>
                {this.state.isRegistering === false ? 
                <div>
                    <Row gutter={4}>
                        <Col span={10}>
                            <Title level={3} className="reportTitle">结构化报告</Title>
                        </Col>
                        <Col span={4}>
                            <Button onClick={this.startRegistering}>开始配准</Button>
                        </Col>
                    </Row>
                    <Row>
                        <Col span={12}>
                            {curBoxesAccord}
                        </Col>
                        <Col span={12}>
                            
                        </Col>
                    </Row>
                </div>
                :
                <div>
                    <Row gutter={4}>
                        <Col span={10}>
                            <Title level={3} className="reportTitle">结构化报告</Title>
                        </Col>
                    </Row>
                    <Row>
                        <Col span={12}>
                            
                        </Col>
                        <Col span={12}>
                            
                        </Col>
                    </Row>
                </div>
                    
            }
                
                
            </div>
        )
    }
}

export default FollowUpElement