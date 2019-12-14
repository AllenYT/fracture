import React, {Component} from "react"
import ReactHtmlParser from 'react-html-parser'
import dicomParser from 'dicom-parser'
import {render} from "react-dom"
import * as cornerstone from "cornerstone-core"
import * as cornerstoneMath from "cornerstone-math"
import * as cornerstoneTools from "cornerstone-tools"
import Hammer from "hammerjs"
import * as cornerstoneWadoImageLoader from "cornerstone-wado-image-loader"
import {withRouter} from 'react-router-dom'
import {  Grid, Table, Icon, Button, Accordion, Checkbox, Modal,Dropdown,Header } from 'semantic-ui-react'
import '../css/cornerstone.css'
import qs from 'qs'
// import { config } from "rxjs"
import axios from "axios"
// import { Dropdown } from "antd"


cornerstoneTools.external.cornerstone = cornerstone
cornerstoneTools.external.cornerstoneMath = cornerstoneMath
// cornerstoneWebImageLoader.external.cornerstone = cornerstone
cornerstoneWadoImageLoader.external.cornerstone = cornerstone
cornerstoneWadoImageLoader.external.dicomParser = dicomParser
cornerstoneTools.external.Hammer = Hammer
const {Column, HeaderCell, Cell, Pagination} = Table;

const divStyle = {
    width: "768px",//768px
    height: "768px",
    position: "relative",
    margin:"auto",
    // display: "inline",
    color: "white"
}

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

const gridStyle = {
    width:"15%",
    display:"inline-block",
    marginRight:"10px",
    marginLeft: "10px"
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
    '-webkit-appearance':'none',
    'font-size':'medium',
    '-moz-appearance':'none',
    'apperance': 'none',
    'margin-left':'15px'
}

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
            boxes: props.stack.boxes,
            clicked: false,
            clickedArea: {},
            tmpBox: {},
            showNodules: true,
            immersive: false,
            readonly: props.stack.readonly,
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
        // this.drawTmpBox = this.drawTmpBox.bind(this)
    }

    // getNoduleIfos(){
    //     const params = {
    //         malignancy: this.state.malignancy,
    //         calcification: this.state.calcification,
    //         spiculation: this.state.spiculation,
    //         lobulation:this.state.lobulation,
    //         texture:this.state.texture,
    //         // volumeStart:this.state.volumeStart,
    //         // volumeEnd:this.state.volumeEnd,
    //         diameterStart:this.state.diameterStart,
    //         diameterEnd:this.state.diameterEnd
    //     }
    //     axios.post(recordConfig.filterNodules, qs.stringify(params)).then((response) => {
    //         const data = response.data
    //         console.log('total:',data)

    //         this.getAtPageIfo(data.pages)
    //         // this.setState({totalPage:data.pages})
    //     }).catch((error) => console.log(error))
    // }

    // getAtPageIfo(totalPages){
    //     let lists=[]
    //     for(let activePage=1;activePage<=totalPages;activePage++){
    //         let params = {
    //             malignancy: this.state.malignancy,
    //             calcification: this.state.calcification,
    //             spiculation: this.state.spiculation,
    //             lobulation:this.state.lobulation,
    //             texture:this.state.texture,
    //             page:activePage+'',
    //             // volumeStart:this.state.volumeStart,
    //             // volumeEnd:this.state.volumeEnd,
    //             diameterStart:this.state.diameterStart,
    //             diameterEnd:this.state.diameterEnd
    //         }
    
    //         axios.post(recordConfig.getNodulesAtPage, qs.stringify(params)).then((response) => {
    //             const data = response.data
    //             for(const idx in data){
    //                 if(data[idx]['caseId']===this.state.caseId){
    //                     console.log('caseId:',this.state.caseId)
    //                     let sequence={'location':'左肺上叶(假数据)','diameter':'0','lobulation':'','spiculation':'','texture':'','calcification':'','malignancy':''}
    //                     // sequence['volume']=data[idx]['volume']===undefined? ' ':Math.floor(data[idx]['volume'] * 100) / 100
    //                     sequence['diameter']=Math.floor(data[idx]['diameter'] * 100) / 100+'cm'
    //                     sequence['malignancy']=data[idx]['malignancy']==2?'高危 ':'低危'
    //                     sequence['lobulation']=data[idx]['lobulation']==2?'分叶':'否'
    //                     sequence['spiculation']=data[idx]['spiculation']==2?'毛刺':'否'
    //                     sequence['texture']=data[idx]['texture']==2?'磨玻璃':'实性'
    //                     sequence['calcification']=data[idx]['calcification']==2?'钙化 ':'否'
    //                     // sequence['caseId']=data[idx]['caseId']
    //                     // sequence['noduleNo']=data[idx]['noduleNo']
    //                     // sequence['status']=data[idx]['status']
    //                     lists.push(sequence)
    //                 }
    //             }
                
                
    //         }).catch((error) => console.log(error))
    //     }
    //     this.setState({list:lists})
    // }//////////////////////////////////////////////////////////////

    handleClick = (e, titleProps) => {
        const {index} = titleProps
        const {activeIndex} = this.state
        const newIndex = activeIndex === index
            ? -1
            : index

        this.setState({activeIndex: newIndex})
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
    handleListClick = (currentIdx,index,e) => {
        // console.log('title',titleProps)
        // const {index} = titleProps
        console.log('index',index)
        const {listsActiveIndex} = this.state
        const newIndex = listsActiveIndex === index
            ? -1
            : index

        this.setState({
            listsActiveIndex: newIndex,
            currentIdx: currentIdx-1,
            autoRefresh: true})
    }

    cache() {
        for (var i = this.state.imageIds.length - 1; i >= 0; i--) {
            this.refreshImage(false, this.state.imageIds[i], i)
        }
    }

    nextPath(path) {
        this
            .props
            .history
            .push(path, {activeItem: 'case'})
    }

    toPage(text,e) {
        // let doms = document.getElementsByClassName('table-row') for (let i = 0; i <
        // doms.length; i ++) {     doms[i].style.backgroundColor = "white" }
        // const currentIdx = event.target.text
        const currentIdx=text
        // const idd = event.currentTarget.dataset.id console.log(idd)
        // document.getElementById(idd).style.backgroundColor = "yellow"
        this.setState({
            currentIdx: currentIdx - 1,
            autoRefresh: true
        })
    }

    toHidebox() {
        this.setState(({showNodules}) => ({
            showNodules: !showNodules
        }))
        this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
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

        this.setState({
            boxes: boxes,
            random: Math.random()
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
        const {showNodules, activeIndex, modalOpenNew, modalOpenCur,listsActiveIndex} = this.state
        let tableContent = ""
        let createDraftModal;
        let submitButton;
        let StartReviewButton;
        let calCount=0
        const options = [
            { key: '分叶', text: '分叶', value: '分叶' },
            { key: '毛刺', text: '毛刺', value: '毛刺' },
            { key: '钙化', text: '钙化', value: '钙化' },
            { key: '磨玻璃', text: '磨玻璃', value: '磨玻璃' },
            { key: '实性', text: '实性', value: '实性' },
        ]

        const locationOptions=[
            { key: '分叶', text: '分叶', value: '分叶' },
            { key: '分叶', text: '分叶', value: '分叶' },
            { key: '分叶', text: '分叶', value: '分叶' },
            { key: '分叶', text: '分叶', value: '分叶' },
        ]

        if (this.state.okayForReview) {
            StartReviewButton = (
                <Button style={{
                    marginLeft: 15 + 'px'
                }}>审核此例</Button>
            )
        }

        if (this.state.draftStatus === '0') 
            submitButton = (
                <Button
                    inverted
                    color='blue'
                    onClick={this.submit}
                    style={{
                    marginTop: 60 + 'px'
                }}>提交</Button>
            )
        else 
            submitButton = (
                <Button
                    inverted
                    color='blue'
                    onClick={this.deSubmit}
                    style={{
                    marginTop: 60 + 'px'
                }}>撤销</Button>
            )
        if (window.location.pathname.split('/')[3] === 'origin') 
            createDraftModal = (
                <div>
                    <Modal
                        trigger={<Button inverted style={{height:60,fontSize:14,width:70}} color = 'blue' onClick = {
                        this.toNewModel
                    }
                    > 从新标注 </Button>}
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
                <div>
                        <Modal
                            trigger={<Button inverted style={{height:60,fontSize:14,width:70}} color = 'blue' onClick = {
                            this.toNewModel 
                        }
                        > 从新标注 </Button>}
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
                            trigger={<Button inverted style={{height:60,fontSize:14,width:70}} color = 'blue' onClick = {
                            this.toCurrentModel
                        } > 拷贝标注 </Button>}
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
            if (this.state.readonly) {
                tableContent = this
                    .state
                    .boxes
                    .map((inside, idx) => {
                        // console.log(this.state.currentIdx, inside.slice_idx - 1)
                        let classNamee = ""
                        if (this.state.currentIdx === inside.slice_idx) {
                            classNamee = "table-row highlighted"
                        } else {
                            classNamee = "table-row"
                        }
                        if(inside.calcification===2){
                            calCount+=1
                        }
                        return (
                            <Table.Row key={idx} className={classNamee}>
                                <Table.Cell>
                                    <div onMouseOver={this.highlightNodule} onMouseOut={this.dehighlightNodule}>{inside.nodule_no}</div>
                                </Table.Cell>
                                <Table.Cell width={4}>
                                    <a onClick={this.toPage.bind(this,inside.slice_idx + 1)}>{inside.slice_idx + 1}号切片</a>
                                </Table.Cell>  
                                <Table.Cell>{inside.place}</Table.Cell>
                                <Table.Cell>{Math.floor(inside.diameter * 10) / 100+'cm'}</Table.Cell>
                                <Table.Cell>{inside.texture===2?"磨玻璃":"实性"}</Table.Cell>
                                <Table.Cell>{inside.malignancy===2?"高危":"低危"}</Table.Cell>
                                {/* <Table.Cell>&#92;</Table.Cell> */}
                            </Table.Row>
                        )
                    })

            } else {
                tableContent = this
                    .state
                    .boxes
                    .map((inside, idx) => {
                        console.log('inside',inside)
                        let classNamee = ""
                        // if (this.state.currentIdx === inside.slice_idx) {
                        //     classNamee = "table-row highlighted"
                        // } else {
                        //     classNamee = "table-row"
                        // }
                        let representArray=[]
                        const delId = 'del-' + inside.nodule_no
                        const malId = 'malSel-' + inside.nodule_no
                        const placeId = 'place-' + inside.nodule_no
                        if(inside.lobulation===2){
                            representArray.push('分叶')
                        }
                        if(inside.spiculation===2){
                            representArray.push('毛刺')
                        }
                        if(inside.texture===2){
                            representArray.push('磨玻璃')
                        }
                        if(inside.texture===1){
                            representArray.push('实性')
                        }
                        if(inside.calcification===2){
                            representArray.push('钙化')
                        }
                        return (
                            // <Table.Row key={idx} className={classNamee}>
                            //     <Table.Cell width={1}>
                            //         <div onMouseOver={this.highlightNodule} onMouseOut={this.dehighlightNodule}>{inside.nodule_no}</div>
                            //     </Table.Cell>
                            //     <Table.Cell>
                            //         <a onClick={this.toPage.bind(this,inside.slice_idx + 1)}>{inside.slice_idx + 1}号切片</a>
                            //     </Table.Cell>
                                
                                
                            //     <Table.Cell>
                            //         <select id={placeId} style={selectStyle} onChange={this.onSelectPlace}>
                            //             <option value="" disabled="disabled" selected={inside.place === ''}>选择位置</option>
                            //             <option value="1" selected={inside.place === '1'}>左肺上叶</option>
                            //             <option value="2" selected={inside.place === '2'}>左肺下叶</option>
                            //             <option value="3" selected={inside.place === '3'}>右肺上叶</option>
                            //             <option value="4" selected={inside.place === '4'}>右肺中叶</option>
                            //             <option value="5" selected={inside.place === '5'}>右肺下叶</option>
                            //         </select>
                            //     </Table.Cell>
                            //     <Table.Cell>
                            //         <Dropdown multiple selection options={options} />
                            //     </Table.Cell>
                            //     <Table.Cell>
                            //         <select id={malId} style={selectStyle} onChange={this.onSelectMal}>
                            //             <option value="" disabled="disabled" selected={inside.malignancy === -1}>选择性质</option>
                            //             <option value="1" selected={inside.malignancy === 1}>低危</option>
                            //             <option value="2" selected={inside.malignancy === 2}>高危</option>
                            //         </select>
                            //     </Table.Cell>
                            //     <Table.Cell>
                            //         <Icon name='trash alternate' onClick={this.delNodule} id={delId}></Icon>
                            //     </Table.Cell>
                            // // </Table.Row>
                            <div key={idx}>
                                <Accordion.Title  className={classNamee} onClick={this.handleListClick.bind(this,inside.slice_idx + 1,idx)}
                                active={listsActiveIndex===idx} index={idx}>
                                    <Table.Cell width={1}>
                                    <div onMouseOver={this.highlightNodule} onMouseOut={this.dehighlightNodule} style={{fontSize:'large'}}>{inside.nodule_no}</div>
                                    {/* <div style={{fontSize:'large'}}>{inside.nodule_no}</div> */}
                                </Table.Cell>
                                <Table.Cell width={1}>
                                    {/* <a onClick={this.toPage.bind(this,inside.slice_idx + 1)}>{inside.slice_idx + 1}号切片</a> */}
                                    <a >{inside.slice_idx + 1}号切片</a>
                                </Table.Cell>
                                
                                
                                <Table.Cell >
                                    <select id={placeId} style={selectStyle} onChange={this.onSelectPlace}>
                                        <option value="" disabled="disabled" selected={inside.place === ''}>选择位置</option>
                                        <option value="1" selected={inside.place === '1'}>左肺上叶</option>
                                        <option value="2" selected={inside.place === '2'}>左肺下叶</option>
                                        <option value="3" selected={inside.place === '3'}>右肺上叶</option>
                                        <option value="4" selected={inside.place === '4'}>右肺中叶</option>
                                        <option value="5" selected={inside.place === '5'}>右肺下叶</option>
                                    </select>
                                </Table.Cell>
                                <Table.Cell>{Math.floor(inside.diameter * 10) / 100+'cm'}</Table.Cell>
                                <Table.Cell>
                                    <Dropdown multiple selection options={options} id='dropdown' defaultValue={representArray}/>
                                </Table.Cell>
                                <Table.Cell>
                                    <select id={malId} style={selectStyle} onChange={this.onSelectMal}>
                                        <option value="" disabled="disabled" selected={inside.malignancy === -1}>选择性质</option>
                                        <option value="1" selected={inside.malignancy === 1}>低危</option>
                                        <option value="2" selected={inside.malignancy === 2}>高危</option>
                                    </select>
                                </Table.Cell>
                                <Table.Cell>
                                    <Icon name='trash alternate' onClick={this.delNodule} id={delId}></Icon>
                                </Table.Cell>
                                </Accordion.Title>
                                <Accordion.Content active={listsActiveIndex===idx}>
                                    <div style={{width:'100%'}}>
                                        <Table.Cell style={{fontSize:'medium'}}>IM:59.61</Table.Cell>
                                        <Table.Cell style={{textAlign:'right',fontSize:'medium'}}>-566HU</Table.Cell>
                                    </div>
                                    <div style={{width:'100%',marginTop:'5px'}}>
                                        <Table.Cell style={{fontSize:'medium',width:'400px'}}>表征</Table.Cell>
                                        <Table.Cell style={{textAlign:'right',fontSize:'medium'}}>0.37cm³</Table.Cell>
                                    </div>
                                    <div style={{width:'100%',marginTop:'20px'}}>
                                        <Table.Cell style={{width:'320px'}}>
                                            <Button style={{background:'transparent',color:'white',fontSize:'medium',border:'1px solid white',width:'100%'}}>
                                                <div>测量</div>
                                            </Button>
                                            </Table.Cell>
                                        <Table.Cell style={{width:'320px'}}>
                                            <Button style={{background:'transparent',color:'white',fontSize:'medium',border:'1px solid white',width:'100%'}}>
                                                <div>特征分析</div>
                                            </Button>
                                        </Table.Cell>
                                    </div>
                                </Accordion.Content>
                            </div>
                        )
                    })
            }

            if (this.state.readonly) {
                return (
                    <div id="cornerstone">

                        <div class='corner-header'>
                        <Grid>
                                <Grid.Row>
                                    <Grid.Column width={3}>
                                        <Grid.Column style={gridStyle}>
                                            <Button
                                                inverted
                                                icon
                                                color='blue'
                                                onClick={this.toPulmonary}
                                                style={{width:55,height:60,fontSize:14}}
                                            >
                                                <Icon name='book'></Icon>
                                                <br/>肺窗
                                            {/* <div>肺窗</div> */}
                                            </Button>
                                        </Grid.Column>
                                        <Grid.Column style={gridStyle}>
                                            <Button
                                                inverted
                                                color='blue'
                                                icon
                                                onClick={this.toBoneWindow} //骨窗窗宽窗位函数
                                                style={{width:55,height:60,fontSize:14}}
                                                ><Icon name='book'></Icon><br/>骨窗</Button>
                                        </Grid.Column>
                                        <Grid.Column style={gridStyle}>
                                            <Button
                                                inverted
                                                color='blue'
                                                icon
                                                onClick={this.toVentralWindow} //腹窗窗宽窗位函数
                                                style={{width:55,height:60,fontSize:14}}
                                                ><Icon name='book'></Icon><br/>腹窗</Button>
                                        </Grid.Column>
                                        <Grid.Column style={gridStyle}>
                                            <Button
                                                inverted
                                                color='blue'
                                                icon
                                                onClick={this.toMedia}
                                                style={{width:65,height:60,fontSize:14}}
                                                ><Icon name='book'></Icon><br/>纵隔窗</Button>
                                        </Grid.Column>
                                    </Grid.Column>
                                    <span id='line-left'></span>
                                    <Grid.Column width={3}>
                                        <Grid.Column style={gridStyle}>
                                            <Button
                                                inverted
                                                color='blue'
                                                icon
                                                style={{width:55,height:60,fontSize:14}}
                                                onClick={this.ZoomIn}
                                                ><Icon name='search plus'></Icon><br/>放大</Button>
                                        </Grid.Column>
                                        <Grid.Column style={gridStyle}>
                                            <Button
                                                inverted
                                                color='blue'
                                                icon
                                                style={{width:55,height:60,fontSize:14}}
                                                onClick={this.ZoomOut}
                                                ><Icon name='search minus'></Icon><br/>缩小</Button>
                                        </Grid.Column>
                                        <Grid.Column style={gridStyle}>
                                            <Button inverted color='blue' icon onClick={this.reset} style={{width:55,height:60,fontSize:14}}><Icon name='repeat'></Icon><br/>重置</Button>
                                        </Grid.Column>
                                        <Grid.Column style={gridStyle}>
                                            <Button icon inverted color='blue' onClick={this.cache} style={{width:55,height:60,fontSize:14}}><Icon id="cache-button" name='coffee'></Icon><br/>缓存</Button>
                                        </Grid.Column>
                                    </Grid.Column>
                                    <span id='line-right'></span>
                                    <Grid.Column width={4}>
                                        {createDraftModal} 
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
                        </div>
                        <div className='corner-contnt'>
                            <Grid celled>
                                <Grid.Column width={2}>

                                </Grid.Column>
                                <Grid.Column width={8} textAlign='center'>
                                <div className='canvas-style'>
                                    <div
                                        id="origin-canvas"
                                        style={divStyle}
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
                                        <div id='showNodules'><Checkbox label='显示结节' checked={showNodules} onChange={this.toHidebox}/></div>
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
                                <Grid.Column width={6} stretched> 
                                    {/* <h3 id="annotator-header">标注人：{window
                                                .location
                                                .pathname
                                                .split('/')[3]}{StartReviewButton}</h3> */}
                                    <div id='listTitle'>
                                            <div style={{display:'inline-block',marginLeft:'10px',marginTop:'15px'}}>可疑结节：{this.state.boxes.length}个</div>
                                            <div style={{display:'inline-block',marginLeft:'80px',marginTop:'15px'}}>骨质病变：{calCount}处</div>
                                    </div>
                                    <div id='elec-table'>
                                        {/* <div className='table-head'>
                                            <Table inverted singleLine id="nodule-table" fixed celled > 
                                                <Table.Header>
                                                    <Table.Row>
                                                        <Table.HeaderCell>切片号</Table.HeaderCell>
                                                        <Table.HeaderCell>结节编号</Table.HeaderCell>
                                                        <Table.HeaderCell>定位</Table.HeaderCell>
                                                        <Table.HeaderCell>直径</Table.HeaderCell>
                                                        <Table.HeaderCell>性质</Table.HeaderCell>
                                                        <Table.HeaderCell>危险程度</Table.HeaderCell>
                                                        <Table.HeaderCell>操作</Table.HeaderCell>
                                                    </Table.Row>
                                                </Table.Header>
                                            </Table>
                                        </div> */}
                                        <div className='table-body'>
                                            <Table id='table-color' fixed >
                                                <Table.Body id='body-color'> 
                                                    {tableContent}
                                                </Table.Body>
                                            </Table>
                                        </div>
                                    </div>
                                </Grid.Column>
                            </Grid>
                        </div>
                    </div>
                )
            } else {
                return (
                    <div id="cornerstone">
                        <div class='corner-header'>
                            <Grid>
                                <Grid.Row>
                                    <Grid.Column width={3}>
                                        <Grid.Column style={gridStyle}>
                                            <Button
                                                inverted
                                                icon
                                                color='blue'
                                                onClick={this.toPulmonary}
                                                style={{width:55,height:60,fontSize:14}}
                                            ><Icon name='book'></Icon><br/>肺窗</Button>
                                        </Grid.Column>
                                        <Grid.Column style={gridStyle}>
                                            <Button
                                                inverted
                                                color='blue'
                                                icon
                                                onClick={this.toBoneWindow} //骨窗窗宽窗位函数
                                                style={{width:55,height:60,fontSize:14}}
                                                ><Icon name='book'></Icon><br/>骨窗</Button>
                                        </Grid.Column>
                                        <Grid.Column style={gridStyle}>
                                            <Button
                                                inverted
                                                color='blue'
                                                icon
                                                onClick={this.toVentralWindow} //腹窗窗宽窗位函数
                                                style={{width:55,height:60,fontSize:14}}
                                                ><Icon name='book'></Icon><br/>腹窗</Button>
                                        </Grid.Column>
                                        <Grid.Column style={gridStyle}>
                                            <Button
                                                inverted
                                                color='blue'
                                                icon
                                                onClick={this.toMedia}
                                                style={{width:65,height:60,fontSize:14}}
                                                ><Icon name='book'></Icon><br/>纵隔窗</Button>
                                        </Grid.Column>
                                    </Grid.Column>
                                    <span id='line-left'></span>
                                    <Grid.Column width={3}>
                                        <Grid.Column style={gridStyle}>
                                            <Button
                                                inverted
                                                color='blue'
                                                icon
                                                style={{width:55,height:60,fontSize:14,fontSize:14}}
                                                onClick={this.ZoomIn}
                                                ><Icon name='search plus'></Icon><br/>放大</Button>
                                        </Grid.Column>
                                        <Grid.Column style={gridStyle}>
                                            <Button
                                                inverted
                                                color='blue'
                                                icon
                                                style={{width:55,height:60,fontSize:14}}
                                                onClick={this.ZoomOut}
                                                ><Icon name='search minus'></Icon><br/>缩小</Button>
                                        </Grid.Column>
                                        <Grid.Column style={gridStyle}>
                                            <Button inverted color='blue' icon onClick={this.reset} style={{width:55,height:60,fontSize:14}}><Icon name='repeat'></Icon><br/>重置</Button>
                                        </Grid.Column>
                                        <Grid.Column style={gridStyle}>
                                            <Button icon inverted color='blue' onClick={this.cache} style={{width:55,height:60,fontSize:14}}><Icon id="cache-button" name='coffee'></Icon><br/>缓存</Button>
                                        </Grid.Column>
                                    </Grid.Column>
                                    <span id='line-right'></span>
                                    <Grid.Column width={4}>
                                        {createDraftModal} 
                                    </Grid.Column>
                                    {/* <Grid.Column width={1}>
                                        <Button
                                            inverted
                                            icon
                                            color='blue'
                                            onClick={this.toPulmonary}
                                            style={{width:55,height:60,fontSize:14}}
                                        ><Icon name='book'></Icon>肺窗</Button>
                                    </Grid.Column>
                                    <Grid.Column width={1}>
                                        <Button
                                            inverted
                                            color='blue'
                                            icon
                                            onClick={this.toBoneWindow} //骨窗窗宽窗位函数
                                            style={{width:55,height:60,fontSize:14}}
                                            ><Icon name='book'></Icon><br/>骨窗</Button>
                                    </Grid.Column>
                                    <Grid.Column width={1}>
                                        <Button
                                            inverted
                                            color='blue'
                                            icon
                                            onClick={this.toVentralWindow} //腹窗窗宽窗位函数
                                            style={{width:55,height:60,fontSize:14}}
                                            ><Icon name='book'></Icon><br/>腹窗</Button>
                                    </Grid.Column>
                                    <Grid.Column width={1}>
                                        <Button
                                            inverted
                                            color='blue'
                                            icon
                                            onClick={this.toMedia}
                                            style={{width:65,height:60,fontSize:14}}
                                            ><Icon name='book'></Icon><br/>纵隔窗</Button>
                                    </Grid.Column>
                                    <Grid.Column width={1}>
                                        <Button
                                            inverted
                                            color='blue'
                                            icon
                                            style={{width:55,height:60,fontSize:14}}
                                            onClick={this.ZoomIn}
                                            ><Icon name='search plus'></Icon>放大</Button>
                                    </Grid.Column>
                                    <Grid.Column width={1}>
                                        <Button
                                            inverted
                                            color='blue'
                                            icon
                                            style={{width:55,height:60,fontSize:14}}
                                            onClick={this.ZoomOut}
                                            ><Icon name='search minus'></Icon>缩小</Button>
                                    </Grid.Column>
                                    <Grid.Column width={1}>
                                        <Button inverted color='blue' icon onClick={this.reset} style={{width:55,height:60,fontSize:14}}><Icon name='repeat'></Icon>重置</Button>
                                    </Grid.Column>
                                    <Grid.Column width={1}>
                                        <Button icon inverted color='blue' onClick={this.cache} style={{width:55,height:60,fontSize:14}}><Icon id="cache-button" name='coffee'></Icon>缓存</Button>
                                    </Grid.Column>
                                     {createDraftModal}  */}
                               
                                    {/* <Grid.Column> */}
                                    <Accordion styled className='accordation' id='accord-left'>
                                        <Accordion.Title
                                            active={activeIndex === 0}
                                            index={0}
                                            onClick={this.handleClick}>
                                            <Icon name='dropdown'/>
                                            模型结果
                                        </Accordion.Title>
                                        <Accordion.Content active={activeIndex === 0}>
                                            <p>
                                                {ReactHtmlParser(this.state.modelResults)}
                                            </p>
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
                                            <p>
                                                {ReactHtmlParser(this.state.annoResults)}
                                            </p>
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
                                        <p>
                                            {ReactHtmlParser(this.state.reviewResults)}
                                        </p>
                                    </Accordion.Content>
                                </Accordion>
                                </Grid.Row>   
                            </Grid>
                        </div>
                        <div class='corner-contnt'>
                            <Grid celled>
                                <Grid.Column width={2}>

                                </Grid.Column>
                                <Grid.Column width={8} textAlign='center'>
                                <div className='canvas-style'>

                                        <div
                                            id="origin-canvas"
                                            style={divStyle}
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
                                        <div id='showNodules'><Checkbox label='显示结节' checked={showNodules} onChange={this.toHidebox}/></div>
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
                                    <div id='listTitle'>
                                        <div style={{display:'inline-block',marginLeft:'10px',marginTop:'15px'}}>可疑结节：{this.state.boxes.length}个</div>
                                        <div style={{display:'inline-block',marginLeft:'80px',marginTop:'15px'}}>骨质病变：{calCount}处</div>
                                    </div>
                                
                                    {/* <h3 id="annotator-header">标注人：{window
                                        .location
                                        .pathname
                                        .split('/')[3]}</h3> */}
                                   <div id='elec-table'>
                                        {/* <div className='table-head'>
                                            <Table
                                                inverted
                                                singleLine
                                                id="nodule-table"
                                                fixed>
                                                <Table.Header>
                                                    <Table.Row>
                                                        <Table.HeaderCell>切片号</Table.HeaderCell>
                                                        <Table.HeaderCell>结节编号</Table.HeaderCell>
                                                        <Table.HeaderCell>操作</Table.HeaderCell>
                                                        <Table.HeaderCell>定位</Table.HeaderCell>
                                                        <Table.HeaderCell>定性</Table.HeaderCell>
                                                    </Table.Row>
                                                </Table.Header>
                                            </Table>
                                        </div>
                                        <div className='table-body'>
                                            <Table id='table-color' fixed>
                                               
                                                <Table.Body id='body-color'>
                                                    {tableContent}
                                                </Table.Body>
                                             
                                            </Table>
                                        </div> */}
                                        
                                        <Accordion styled id="cornerstone-accordion" fluid>
                                            {tableContent}
                                        </Accordion>
                                
                                    </div>
                                    <Button
                                        inverted
                                        color='blue'
                                        onClick={this.temporaryStorage}
                                        style={{
                                        marginRight: 15 + 'px',
                                        marginLeft: 350 + 'px',
                                        marginTop: 60 + 'px'
                                    }}>暂存</Button>
                                    {submitButton}
                                </Grid.Column>
                            </Grid>
                        </div>
                        {/* <Grid>
                            <Grid.Row>
                                <Grid.Column width={8}>

                                    <div className='canvas-style'>

                                        <div
                                            id="origin-canvas"
                                            style={divStyle}
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
                                            <p id="page-indicator">{this.state.currentIdx + 1}
                                                / {this.state.imageIds.length}</p>
                                            <div id='showNodules'><Checkbox label='显示结节' checked={showNodules} onChange={this.toHidebox}/></div>

                                            <Button
                                                inverted
                                                color='blue'
                                                onClick={this.toPulmonary}
                                                style={{
                                                marginRight: 15 + 'px',
                                                marginLeft: 127 + 'px'
                                            }}>肺窗</Button>

                                            <Button
                                                inverted
                                                color='blue'
                                                onClick={this.toMedia}
                                                style={{
                                                marginRight: 15 + 'px'
                                            }}>纵隔窗</Button>
                                            <Button inverted color='blue' onClick={this.reset}>重置</Button>
                                            <a
                                                id="immersive-hover"
                                                onClick={() => {
                                                this.setState({immersive: true})
                                            }}>沉浸模式</a>
                                        </div>

                                    </div>
                                </Grid.Column>

                                <Grid.Column width={8}>
                                    <h3 id="caseId-header">{this.state.caseId}
                                        <Icon id="cache-button" name='coffee' onClick={this.cache}></Icon>
                                    </h3>
                                    <h3 id="annotator-header">标注人：{window
                                            .location
                                            .pathname
                                            .split('/')[3]}</h3>
                                    <Accordion styled id='accordation'>
                                        <Accordion.Title
                                            active={activeIndex === 0}
                                            index={0}
                                            onClick={this.handleClick}>
                                            <Icon name='dropdown'/>
                                            模型结果
                                        </Accordion.Title>
                                        <Accordion.Content active={activeIndex === 0}>
                                            <p>
                                                {ReactHtmlParser(this.state.modelResults)}
                                            </p>
                                        </Accordion.Content>
                                        <Accordion.Title
                                            active={activeIndex === 1}
                                            index={1}
                                            onClick={this.handleClick}>
                                            <Icon name='dropdown'/>
                                            标注结果
                                        </Accordion.Title>
                                        <Accordion.Content active={activeIndex === 1}>
                                            <p>
                                                {ReactHtmlParser(this.state.annoResults)}
                                            </p>
                                        </Accordion.Content>
                                        <Accordion.Title
                                            active={activeIndex === 2}
                                            index={2}
                                            onClick={this.handleClick}>
                                            <Icon name='dropdown'/>
                                            审核结果
                                        </Accordion.Title>
                                        <Accordion.Content active={activeIndex === 2}>
                                            <p>
                                                {ReactHtmlParser(this.state.reviewResults)}
                                            </p>
                                        </Accordion.Content>
                                    </Accordion>
                                    <div id='elec-table'>
                                        <div className='table-head'>
                                            <Table
                                                inverted
                                                singleLine
                                                id="nodule-table"
                                                fixed>
                                                <Table.Header>
                                                    <Table.Row>
                                                        <Table.HeaderCell>切片号</Table.HeaderCell>
                                                        <Table.HeaderCell>结节编号</Table.HeaderCell>
                                                        <Table.HeaderCell>操作</Table.HeaderCell>
                                                        <Table.HeaderCell>定位</Table.HeaderCell>
                                                        <Table.HeaderCell>定性</Table.HeaderCell>
                                                    </Table.Row>
                                                </Table.Header>
                                            </Table>
                                        </div>
                                        <div className='table-body'>
                                            <Table id='table-color' fixed>
                                                <Table.Body id='body-color'>
                                                    {tableContent}
                                                </Table.Body>
                                            </Table>
                                        </div>
                                    </div>
                                    <Button
                                        inverted
                                        color='blue'
                                        onClick={this.temporaryStorage}
                                        style={{
                                        marginRight: 15 + 'px',
                                        marginLeft: 350 + 'px',
                                        marginTop: 60 + 'px'
                                    }}>暂存</Button>
                                    {submitButton}
                                </Grid.Column>

                            </Grid.Row>
                        </Grid> */}

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

        const canvas = document.getElementById("canvas")
        const context = canvas.getContext('2d')
        // console.log("Drawing box", context.canvas)
        const xCenter = (box.x1 + (box.x2 - box.x1) / 2)
        const yCenter = (box.y1 + (box.y2 - box.y1) / 2)
        const width = box.x2 - box.x1
        const height = box.y2 - box.y1
        if (box.highlight === false || box.highlight === undefined) {
            context.setLineDash([])
            context.strokeStyle = 'red'
            context.fillStyle = 'red'
        } else {
            context.strokeStyle = 'blue'
            context.fillStyle = 'blue'
        }
        context.beginPath()
        const new_y1 = yCenter - height / 2
        context.rect(box.x1-1, box.y1-1, width+2, height+2)
        context.lineWidth = 1
        context.stroke()
        if (box.nodule_no != undefined) {
            context.fillText(box.nodule_no, xCenter - 3, new_y1 - 10)
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

    handleRangeChange(event) {
        // this.setState({currentIdx: event.target.value - 1, imageId:
        // this.state.imageIds[event.target.value - 1]})
        this.refreshImage(false, this.state.imageIds[event.target.value - 1], event.target.value - 1)
    }

    createBox(x1, x2, y1, y2, slice_idx, nodule_idx) {
        const newBox = {
            // "calcification": [], "lobulation": [],
            "malignancy": -1,
            "nodule_no": nodule_idx,
            "patho": "",
            "place": "",
            "probability": 1,
            "slice_idx": slice_idx,
            // "spiculation": [], "texture": [],
            "x1": x1,
            "x2": x2,
            "y1": y1,
            "y2": y2,
            "highlight": false
        }
        let boxes = this.state.boxes
        console.log("newBox", newBox)
        boxes.push(newBox)
        this.setState({boxes: boxes})
        this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
    }

    onMouseMove(event) {
        const clickX = event.offsetX
        const clickY = event.offsetY
        let x = 0
        let y = 0
        if (!this.state.immersive) {
            const transX = this.state.viewport.translation.x
            const transY = this.state.viewport.translation.y
            const scale = this.state.viewport.scale
            const halfValue = 256
            x = (clickX - scale * transX - 384) / scale + halfValue
            y = (clickY - scale * transY - 384) / scale + halfValue

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
            tmpBox.x2 = x
            tmpBox.y2 = y
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

        }
        if (event.which == 39 || event.which == 40) {
            event.preventDefault()
            let newCurrentIdx = this.state.currentIdx + 1
            if (newCurrentIdx < this.state.imageIds.length) {
                this.refreshImage(false, this.state.imageIds[newCurrentIdx], newCurrentIdx)
            }

        }
        if (event.which == 72) {
            this.toHidebox() 
        }
    }

    onMouseDown(event) {
        if (event.button == 0) {
            const clickX = event.offsetX
            const clickY = event.offsetY
            let x = 0
            let y = 0

            if (!this.state.immersive) {
                const transX = this.state.viewport.translation.x
                const transY = this.state.viewport.translation.y
                const scale = this.state.viewport.scale

                const halfValue = 256 //256

                x = (clickX - scale * transX - 384) / scale + halfValue
                y = (clickY - scale * transY - 384) / scale + halfValue

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
            let content = this.findCurrentArea(x, y)
            if (content.pos == 'o') {
                document
                    .getElementById("canvas")
                    .style
                    .cursor = "crosshair"
            }
            this.setState({clicked: true, clickedArea: content, tmpBox: coords})
        }
    }

    onMouseOut(event) {
        if (this.state.clicked) {
            this.setState({clicked: false, tmpBox: {}, clickedArea: {}})
        }

    }

    onMouseUp(event) {
        console.log('up', this.state.clickedArea)
        if (this.state.clickedArea.box === -1) {
            const x1 = this.state.tmpBox.x1
            const y1 = this.state.tmpBox.y1
            const x2 = this.state.tmpBox.x2
            const y2 = this.state.tmpBox.y2
            let newNodule_no = 0
            const boxes = this.state.boxes
            for (var i = 0; i < boxes.length; i++) {
                const current_nodule_no = parseInt(boxes[i].nodule_no)
                if (current_nodule_no > newNodule_no) {
                    newNodule_no = current_nodule_no
                }
            }
            this.createBox(x1, x2, y1, y2, this.state.currentIdx, (1 + newNodule_no).toString())
        }
        this.setState({
            clicked: false,
            clickedArea: {},
            tmpBox: {},
            random: Math.random()
        })
        document
            .getElementById("canvas")
            .style
            .cursor = "auto"
    }

    onRightClick(event) {
        event.preventDefault()
    }

    reset() {
        let viewport = cornerstone.getViewport(this.element)
        viewport.translation = {
            x: 0,
            y: 0
        }
        viewport.scale = 1.5
        cornerstone.setViewport(this.element, viewport)
        this.setState({viewport})
        console.log("to pulmonary", viewport)
    }

    ZoomIn(){
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

    ZoomOut(){
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

    toPulmonary() {
        let viewport = cornerstone.getViewport(this.element)
        viewport.voi.windowWidth = 1600
        viewport.voi.windowCenter = -600
        cornerstone.setViewport(this.element, viewport)
        this.setState({viewport})
        console.log("to pulmonary", viewport)
    }

    toMedia() {
        let viewport = cornerstone.getViewport(this.element)
        viewport.voi.windowWidth = 500
        viewport.voi.windowCenter = 50
        cornerstone.setViewport(this.element, viewport)
        this.setState({viewport})
        console.log("to media", viewport)
    }

    toBoneWindow() {
        let viewport = cornerstone.getViewport(this.element)
        viewport.voi.windowWidth = 1000
        viewport.voi.windowCenter = 300
        cornerstone.setViewport(this.element, viewport)
        this.setState({viewport})
        console.log("to media", viewport)
    }

    toVentralWindow() {
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
        console.log('token', token)
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
        console.log('userId', window.sessionStorage.getItem('userId'))
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
        console.log(caseId)
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
        const element = document.getElementById("origin-canvas")
        const viewport = cornerstone.getViewport(element)
        if (this.state.showNodules === true && this.state.caseId === window.location.pathname.split('/')[2]) {
            for (let i = 0; i < this.state.boxes.length; i++) {
                if (this.state.boxes[i].slice_idx == this.state.currentIdx) 
                    this.drawBoxes(this.state.boxes[i])
            }

        }

        if (this.state.clicked && this.state.clickedArea.box == -1) {
            this.drawBoxes(this.state.tmpBox)
        }

        this.setState({viewport})
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

        // const element = this.element

        const element = document.getElementById('origin-canvas')

        if (initial) {
            cornerstone.enable(element)
        } else {
            cornerstone.getEnabledElement(element)
        }

        cornerstone
            .loadAndCacheImage(imageId)
            .then(image => {

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
                element.addEventListener("cornerstonenewimage", this.onNewImage)
                element.addEventListener("contextmenu", this.onRightClick)

                if (!this.state.readonly) {
                    element.addEventListener("mousedown", this.onMouseDown)
                    element.addEventListener("mousemove", this.onMouseMove)
                    element.addEventListener("mouseup", this.onMouseUp)
                    element.addEventListener("mouseout", this.onMouseOut)
                }

                document.addEventListener("keydown", this.onKeydown)

                // window.addEventListener("resize", this.onWindowResize) if (!initial) {
                // this.setState({currentIdx: newIdx}) }
            })
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
        this.checkHash()
    }

    componentDidMount() {
        // this.getNoduleIfos()

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
        
        Promise.all([
            axios.post(draftConfig.getModelResults, qs.stringify(params), {headers}),
            axios.post(draftConfig.getAnnoResults, qs.stringify(params), {headers}),
            axios.post(reviewConfig.getReviewResults, qs.stringify(params), {headers})
        ]).then(([res1, res2, res3]) => {
            const modelList = res1.data.dataList
            const annoList = res2.data.dataList
            const reviewList = res3.data.dataList

            let modelStr = ''
            let annoStr = ''
            let reviewStr = ''

            if (modelList.length > 0) {
                // console.log(modelList)
                for (var i = 0; i < modelList.length; i++) {
                    modelStr += '<a href="/case/' + this.state.caseId + '/' + modelList[i] + '"><div class="ui blue label">'
                    modelStr += modelList[i]
                    modelStr += '</div></a>'
                }
                this.setState({modelResults: modelStr})
                // console.log('模型结果',modelStr)
            }

            if (annoList.length > 0) {
                for (var i = 0; i < annoList.length; i++) {
                    annoStr += '<a href="/case/' + this.state.caseId + '/' + annoList[i] + '"><div class="ui label">'
                    annoStr += annoList[i]
                    annoStr += '</div></a>'
                }
                this.setState({annoResults: annoStr})
            }

            if (reviewList.length > 0) {
                for (var i = 0; i < reviewList.length; i++) {
                    reviewStr += '<a href="/review/' + this.state.caseId + '/' + reviewList[i] + '"><div class="ui teal label">'
                    reviewStr += reviewList[i]
                    reviewStr += '</div></a>'
                }
                this.setState({reviewResults: reviewStr})
            }
        }).catch((error) => {
            console.log(error)
        })

    }

    componentWillUnmount() {
        const element = this.element
        element.removeEventListener("cornerstoneimagerendered", this.onImageRendered)

        element.removeEventListener("cornerstonenewimage", this.onNewImage)

        // window.removeEventListener("resize", this.onWindowResize)

        cornerstone.disable(element)
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.currentIdx !== this.state.currentIdx && this.state.autoRefresh === true) {
            this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
        }

        if (prevState.immersive !== this.state.immersive) {
            this.refreshImage(true, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
        }

        if (prevState.random !== this.state.random) {
            console.log(this.state.boxes)
            // this.saveToDB()
        }
    }
}

export default withRouter(CornerstoneElement)
