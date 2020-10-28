import React, {Component,createRef} from 'react'
import {Button, Grid, Modal,Header, Divider, Table, Dropdown, Form} from 'semantic-ui-react'
import axios from 'axios'
import qs from 'qs'
import html2pdf from 'html2pdf.js'
import copy from  'copy-to-clipboard'
import * as cornerstone from "cornerstone-core"
import * as cornerstoneMath from "cornerstone-math"
import * as cornerstoneTools from "cornerstone-tools"
import * as cornerstoneWadoImageLoader from "cornerstone-wado-image-loader"
import { Chart } from '@antv/g2'
import DataSet from '@antv/data-set'
import '../css/cornerstone.css'

const config = require('../config.json')
const draftConfig=config.draft
let buttonflag=0
cornerstoneTools.external.cornerstone = cornerstone
cornerstoneTools.external.cornerstoneMath = cornerstoneMath
// cornerstoneWebImageLoader.external.cornerstone = cornerstone
cornerstoneWadoImageLoader.external.cornerstone = cornerstone




class MiniReport extends Component{
    constructor(props){
        super(props)
        this.state={
            caseId:props.caseId,
            username:props.username,
            patientName:'',
            patientBirth:'',
            patientSex:'',
            patientId:'',
            date:'',
            age:0,
            spacing:'',
            nodules:[],
            imageIds:props.imageIds,
            viewport: cornerstone.getDefaultViewport(null, undefined),
            temp:0,
            templateText:'',
            boxes:props.boxes,
            dealchoose:'中华共识',
            windowWidth:1920,
        }
        this.showImages = this.showImages.bind(this)
        this.exportPDF = this.exportPDF.bind(this)
        this.template = this.template.bind(this)
        this.dealChoose = this.dealChoose.bind(this)
        this.handleTextareaChange = this.handleTextareaChange.bind(this)
        this.handleCopyClick = this.handleCopyClick.bind(this)
    }

    componentDidMount(){
        console.log('mount')
        const width = document.body.clientWidth
        this.setState({windowWidth : width})
        const params = {
            caseId: this.state.caseId,
            username: this.state.username
        }
        axios.post(draftConfig.structedReport, qs.stringify(params)).then((response) => {
            const data = response.data
            console.log('report:',data,params)
            this.setState({age:data.age,date:data.date,nodules:data.nodules===undefined?[]:data.nodules,patientBirth:data.patientBirth,
                patientId:data.patientID,patientSex:data.patientSex==='M'?'男':'女'})
           
        }).catch((error) => console.log(error))
        
    }

    componentDidUpdate(prevProps){
        if(prevProps.activeItem != this.props.activeItem){
            this.template()
        }
    }

    dealChoose(e){
        console.log('list',e.currentTarget.innerHTML)
        this.setState({dealchoose:e.currentTarget.innerHTML})
    }

    exportPDF(){
        const element=document.getElementById('pdf')
        const opt = {
            margin: [1,1,1,1],
            filename: 'minireport.pdf',
            pagebreak:{ before:'#noduleDivide',avoid:'canvas'},
            image: { type: 'jpeg', quality: 0.98 }, // 导出的图片质量和格式
            html2canvas: { scale: 2, useCORS: true }, // useCORS很重要，解决文档中图片跨域问题
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
          }
          if (element) {
            html2pdf().set(opt).from(element).save() // 导出
          }
    }

    handleCopyClick(e){
        copy(this.state.templateText)
    }
    
    showImages(){
        const nodules = this.state.nodules
        const imageIds = this.state.imageIds
        if(nodules.length===0){
            return
        }
        // console.log('imagesid',imageIds)
        let nodule_id = 'nodule-' + nodules[0].nodule_no + '-' + nodules[0].slice_idx
        let that=this
        var timer = setInterval(function () {
            if(document.getElementById(nodule_id) != null){
                nodules.map((nodule,index)=>{
                    // console.log('nodules1',nodule)
                    const visId = 'visual' + index
                // console.log(visId)
            document.getElementById(visId).innerHTML=''
            const hist_data=nodule.nodule_hist
            if(hist_data!==undefined){
                let bins=hist_data.bins
                let ns=hist_data.n
                // console.log('bins',bins)
                // console.log('ns',ns)
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
                // console.log('histogram',histogram)
                // console.log('line',line)
                const ds = new DataSet();
                const dv = ds.createView().source(histogram)
                
                const chart = new Chart({
                    container: visId,
                    // forceFit: true,
                    forceFit:true,
                    height: 300,
                    width:250
                    // padding: [30,30,'auto',30]
                });
                
                let view1=chart.view()
                // view1.axis(false)
                view1.source(dv, {
                    value: {
                    //   nice: true,
                        minLimit: bins[0]-50,
                        maxLimit:bins[bins.length-1]+50,
                    //   tickCount:10
                    },
                    count: {
                    //   max: 350000,
                      tickInterval:1
                        // tickCount:10
                    }
                    })
                // view1.source(dv)
                view1.interval().position('value*count')
    
                // var view2 = chart.view()
                // view2.axis(false)
                // // view2.source(line)
                // view2.source(line,{
                //     value: {
                //         // nice: true,
                //         minLimit: bins[0]-50,
                //         maxLimit:bins[bins.length-1]+50,
                //         // tickCount:10
                //         },
                //         count: {
                //         // max: 350000,
                //         tickCount:10
                //         }
                // })
                // view2.line().position('value*count').style({
                //     stroke: 'grey',
                    
                //     }).shape('smooth')
                chart.render()
            }
                    nodule_id = 'nodule-' + nodule.nodule_no + '-' + nodule.slice_idx
                    const element = document.getElementById(nodule_id)
                    let imageId = imageIds[nodule.slice_idx]
                    cornerstone.enable(element)
                    cornerstone.loadAndCacheImage(imageId).then(function(image) { 
                        // console.log('cache') 
                        var viewport = cornerstone.getDefaultViewportForImage(element, image);
                        viewport.voi.windowWidth = 1600
                        viewport.voi.windowCenter = -600
                        viewport.scale=2
                        // console.log('nodules2',nodule)
                        const xCenter = nodule.x1 + (nodule.x2 - nodule.x1) / 2
                        const yCenter = nodule.y1 + (nodule.y2 - nodule.y1) / 2
                        viewport.translation.x=250-xCenter
                        viewport.translation.y=250-yCenter
                        // console.log('viewport',viewport)
                        cornerstone.setViewport(element, viewport)
                        cornerstone.displayImage(element, image)
                        buttonflag+=1
                        console.log('buttonflag',buttonflag)
                        if(buttonflag===nodules.length){
                            that.setState({temp:1})
                        }
                    })
                })
            //     for(var i = 0;i<nodules.length;i++){
            //     nodule_id = 'nodule-' + nodules[i].nodule_no + '-' + nodules[i].slice_idx
            //     // console.log('id',nodule_id)
            //     const element = document.getElementById(nodule_id);
            //     // console.log('element',element)
            //     let imageId = imageIds[nodules[i].slice_idx]
            //     cornerstone.enable(element);
            //     // let viewport =this.state.viewport
            //     // console.log('viewport',viewport)
            //     // viewport.voi.windowWidth = 1600
            //     // viewport.voi.windowCenter = -600
            //     // cornerstone.setViewport(element, viewport)
            //     cornerstone.loadAndCacheImage(imageId).then(function(image) { 
            //         console.log('cache') 
            //         var viewport = cornerstone.getDefaultViewportForImage(element, image);
            //         viewport.voi.windowWidth = 1600
            //         viewport.voi.windowCenter = -600
            //         viewport.scale=2
            //         console.log('nodules',i)
            //         // const xCenter = nodules[0].x1 + (nodules[0].x2 - nodules[0].x1) / 2
            //         // const yCenter = nodules[0].y1 + (nodules[0].y2 - nodules[0].y1) / 2
            //         viewport.translation.x=100
            //         viewport.translation.y=0
            //         console.log('viewport',viewport)
            //         cornerstone.setViewport(element, viewport)
            //         cornerstone.displayImage(element, image);
            //     });
            // }
                clearInterval(timer);
            }

        },500);
        
    }

    template(){
        let places={0:'选择位置',1:'右肺中叶',2:'右肺上叶',3:'右肺下叶',4:'左肺上叶',5:'左肺下叶'}
        let segments={
        'S1':'右肺上叶-尖段','S2':'右肺上叶-后段','S3':'右肺上叶-前段','S4':'右肺中叶-外侧段','S5':'右肺中叶-内侧段',
        'S6':'右肺下叶-上段','S7':'右肺下叶-内底段','S8':'右肺下叶-前底段','S9':'右肺下叶-外侧底段','S10':'右肺下叶-后底段',
        'S11':'左肺上叶-尖后段','S12':'左肺上叶-前段','S13':'左肺上叶-上舌段','S14':'左肺上叶-下舌段','S15':'左肺下叶-上段',
        'S16':'左肺下叶-前底段','S17':'左肺下叶-外侧底段','S18':'左肺下叶-后底段'}
        if(this.props.type==='影像所见'){
            let texts=''
            if (this.props.activeItem===-1){
                this.setState({templateText:''})
            }
            else if(this.props.activeItem==='all'){
                for(let i=0;i<this.state.boxes.length;i++){
                    let place=''
                    let diameter=''
                    let texture=''
                    let calcification=''
                    let malignancy=''
                    if(this.state.boxes[i]['place']===0 || this.state.boxes[i]['place']===undefined || 
                    this.state.boxes[i]['place']===""){
                        place='未知位置'
                    }
                    else{
                        if(this.state.boxes[i]['segment']===undefined || this.state.boxes[i]['segment']===""|| 
                        this.state.boxes[i]['segment']==='None'){
                            place=places[this.state.boxes[i]['place']]
                        }
                        else{
                            place=segments[this.state.boxes[i]['segment']]
                        }
                    }
                    if(this.state.boxes[i]['diameter']!==undefined){
                        diameter='有一'+Math.floor(this.state.boxes[i]['diameter']*10)/100+'cm' 
                    }
                    else{
                        diameter='有一未知大小'
                    }
                    if(this.state.boxes[i]['texture']===2){
                        texture='的实性结节，'
                    }
                    else{
                        texture='的磨玻璃结节，'
                    }
                    if(this.state.boxes[i]['calcification']===2){
                        calcification='有钙化成分，'
                    }
                    else{
                        calcification='无钙化成分，'
                    }
                    if(this.state.boxes[i]['malignancy']===2){
                        malignancy='风险较高。'
                    }
                    else{
                        malignancy='风险较低。'
                    }
                    texts=texts+place+diameter+texture+calcification+malignancy+'\n\n'
                }
                this.setState({templateText:texts})
            }   
            else{
                
                let place=''
                let diameter=''
                let texture=''
                let calcification=''
                let malignancy=''
                console.log('minireport-boxes',this.state.boxes[this.props.activeItem],this.props.activeItem)
                if(this.state.boxes[this.props.activeItem]['place']===0 || this.state.boxes[this.props.activeItem]['place']===undefined || 
                this.state.boxes[this.props.activeItem]['place']===""){
                    place='未知位置'
                }
                else{
                    if(this.state.boxes[this.props.activeItem]['segment']===undefined || this.state.boxes[this.props.activeItem]['segment']===""|| 
                    this.state.boxes[this.props.activeItem]['segment']==='None'){
                        place=places[this.state.boxes[this.props.activeItem]['place']]
                    }
                    else{
                        place=segments[this.state.boxes[this.props.activeItem]['segment']]
                    }
                }
                if(this.state.boxes[this.props.activeItem]['diameter']!==undefined){
                    diameter='有一'+Math.floor(this.state.boxes[this.props.activeItem]['diameter']*10)/100+'cm' 
                }
                else{
                    diameter='有一未知大小'
                }
                if(this.state.boxes[this.props.activeItem]['texture']===2){
                    texture='的实性结节，'
                }
                else{
                    texture='的磨玻璃结节，'
                }
                if(this.state.boxes[this.props.activeItem]['calcification']===2){
                    calcification='有钙化成分，'
                }
                else{
                    calcification='无钙化成分，'
                }
                if(this.state.boxes[this.props.activeItem]['malignancy']===2){
                    malignancy='风险较高。'
                }
                else{
                    malignancy='风险较低。'
                }
                texts=texts+place+diameter+texture+calcification+malignancy
                this.setState({templateText:texts})
            }
        }
        else{
            let malignancy=[]
            for(let i=0;i<this.state.boxes.length;i++){
                if(this.state.boxes[i]['malignancy']==2){
                    malignancy.push(this.state.boxes[i]['diameter'])
                }
            }
            if(malignancy.length==0){//良性概率高
                let maxDiameter=this.state.boxes[0]['diameter']
                for(let i=0;i<this.state.boxes.length;i++){
                    if(this.state.boxes[i]['diameter']>maxDiameter){
                        maxDiameter=this.state.boxes[i]['diameter']
                    }
                }
                if(maxDiameter>=8){
                    // return '根据PET评估结节结果判断手术切除或非手术活检'
                    this.setState({templateText:'根据PET评估结节结果判断手术切除或非手术活检'})
                }
                if(maxDiameter>=6 &&maxDiameter<8){
                    this.setState({templateText:'6~12、18~24个月，如稳定，年度随访'})
                    // return '6~12、18~24个月，如稳定，年度随访'
                }
                else if(maxDiameter>=4 &&maxDiameter<6){
                    this.setState({templateText:'12个月，如稳定，年度随访'})
                    // return '12个月，如稳定，年度随访'
                }
                else if(maxDiameter<4){
                    this.setState({templateText:'选择性随访'})
                    // return '选择性随访'
                }
            }
            else{//恶性概率高
                let maxDiameter=Math.max(...malignancy)
                if(maxDiameter>=8){
                    this.setState({templateText:'根据标准分析评估结果判断放化疗或手术切除'})
                    // return '根据标准分析评估结果判断放化疗或手术切除'
                }
                if(maxDiameter>=6 &&maxDiameter<8){
                    this.setState({templateText:'3~6、9~12及24个月，如稳定，年度随访'})
                    // return '3~6、9~12及24个月，如稳定，年度随访'
                }
                else if(maxDiameter>=4 &&maxDiameter<6){
                    this.setState({templateText:'6~12、18~24个月，如稳定，年度随访'})
                    // return '6~12、18~24个月，如稳定，年度随访'
                }
                else if(maxDiameter<4){
                    this.setState({templateText:'12个月，如稳定，年度随访'})
                    // return '12个月，如稳定，年度随访'
                }
            }
        }
    }
    handleTextareaChange(e){
        this.setState({templateText:e.target.value})
    }
    render(){
        let places={0:'选择位置',1:'右肺中叶',2:'右肺上叶',3:'右肺下叶',4:'左肺上叶',5:'左肺下叶'}
        let segments={
        'S1':'右肺上叶-尖段','S2':'右肺上叶-后段','S3':'右肺上叶-前段','S4':'右肺中叶-外侧段','S5':'右肺中叶-内侧段',
        'S6':'右肺下叶-上段','S7':'右肺下叶-内底段','S8':'右肺下叶-前底段','S9':'右肺下叶-外侧底段','S10':'右肺下叶-后底段',
        'S11':'左肺上叶-尖后段','S12':'左肺上叶-前段','S13':'左肺上叶-上舌段','S14':'左肺上叶-下舌段','S15':'左肺下叶-上段',
        'S16':'左肺下叶-前底段','S17':'左肺下叶-外侧底段','S18':'左肺下叶-后底段'}
        const {windowWidth} = this.state
        
        // console.log('type',this.props.type)
        // console.log('time',buttonflag,this.state.nodules.length)
        return(
            <Grid divided='vertically'>
                {
                    this.props.type==='影像所见'?
                <Grid.Row verticalAlign='middle' columns={4} style={{height:40}}>
                    {
                        windowWidth < 1600?
                        <Grid.Column textAlign='left' width={5}>
                            <div style={{fontSize:18}}></div>
                        </Grid.Column>:
                        <Grid.Column textAlign='left' width={6}>
                            <div style={{fontSize:18}}></div>
                        </Grid.Column>
                    }
                    
                    <Grid.Column width={4} textAlign='right'>
                        {/* <Dropdown style={{background:'none',fontSize:18}} text='结节排序'></Dropdown> */}
                    </Grid.Column>
                    <Grid.Column textAlign='center' width={2}>
                    <Modal trigger={<Button icon='expand arrows alternate' title='放大' className='inverted blue button'  onClick={this.showImages}></Button>}>
                        
                        <Modal.Header>
                            <Grid>
                                <Grid.Row>
                                    <Grid.Column width={3} textAlign='left'>
                                        影像诊断报告
                                    </Grid.Column>
                                    <Grid.Column width={6}>
                                        
                                    </Grid.Column>
                                    <Grid.Column width={3} textAlign='right'>
                                        {this.state.temp===1?
                                            <Button color='blue' onClick={this.exportPDF}>导出pdf</Button>
                                            :
                                            <Button color='blue' loading>Loading</Button>
                                        }
                                    </Grid.Column>
                                </Grid.Row>
                            </Grid>
                        </Modal.Header>
                        <Modal.Content image scrolling id='pdf'>
                            <Modal.Description>
                                <table>
                                    <tbody>
                                         <tr>
                                    <td><Header>病人编号:</Header></td>
                                    <td>{this.state.patientId}</td>
                                    
                                    <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                    
                                    </td>
                                    <td align='right'><Header>姓名:</Header></td>
                                    <td>&nbsp;</td>
                                </tr>
                                <tr>
                                    <td><Header>出生日期:</Header></td>
                                    <td>{this.state.patientBirth}</td>
                                    <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>
                                    
                                    <td align='right'><Header>年龄:</Header></td>
                                    <td>{this.state.age}</td>
                                </tr>
                                <tr>
                                    <td><Header>性别:</Header></td>
                                    <td>{this.state.patientSex}</td>
                                    <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>
                                    <td align='right'><Header>检查日期:</Header></td>
                                    <td>{this.state.date}</td>
                                </tr>
                                <tr>
                                    <td><Header>检查编号:</Header></td>
                                    <td>12580359</td>
                                    <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>
                                    <td align='right'><Header>入库编号:</Header></td>
                                    <td>&nbsp;</td>
                                </tr>
                                <tr>
                                    <td><Header>报告撰写日期:</Header></td>
                                    <td>&nbsp;</td>
                                    <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>
                                    <td align='right'><Header>请求过程描述:</Header></td>
                                    <td>&nbsp;</td>
                                </tr>
                                    </tbody>
                               
                                </table>
                                <Divider/>
                                <table>
                                    <tbody>
                                      <tr>
                                        <td width='50%'><Header>体重:</Header></td>
                                        <td></td>
                                    </tr>
                                    <tr>
                                        <td><Header>身高:</Header></td>
                                        <td align='right'><Header>体重系数:</Header></td>
                                    </tr>  
                                    </tbody>
                                    
                                </table>
                                
                                
                                <Divider/>
                                
                                
                                <div style={{fontSize:20,color:'#6495ED'}}>扫描参数</div>
                                <Table celled>
                                    <Table.Header>
                                        <Table.Row>
                                            <Table.HeaderCell>检查日期</Table.HeaderCell>
                                            <Table.HeaderCell>像素大小(毫米)</Table.HeaderCell>
                                            <Table.HeaderCell>厚度 / 间距(毫米)</Table.HeaderCell>
                                            <Table.HeaderCell>kV</Table.HeaderCell>
                                            <Table.HeaderCell>mA</Table.HeaderCell>
                                            <Table.HeaderCell>mAs</Table.HeaderCell>
                                            {/* <Table.HeaderCell>Recon Name</Table.HeaderCell> */}
                                            <Table.HeaderCell>厂商</Table.HeaderCell>
                                        </Table.Row>
                                    </Table.Header>
                                    <Table.Body>

                                    </Table.Body>
                                </Table>
                                <div style={{fontSize:20,color:'#6495ED'}}>肺部详情</div>
                                <Table celled>
                                    <Table.Header>
                                        <Table.Row>
                                            <Table.HeaderCell>检查日期</Table.HeaderCell>
                                            <Table.HeaderCell>体积</Table.HeaderCell>
                                            <Table.HeaderCell>结节总体积</Table.HeaderCell>
                                        </Table.Row>
                                    </Table.Header>
                                    <Table.Body>

                                    </Table.Body>
                                </Table>
                                <div style={{}}></div>
                                {
                                    this.state.nodules.map((nodule,index)=>{
                                        let nodule_id = 'nodule-' + nodule.nodule_no + '-' + nodule.slice_idx
                                        let visualId='visual'+index
                                        // console.log('visualId',visualId)
                                        return(
                                            <div key={index}>
                                                <Divider/>
                                                <div>&nbsp;</div>
                                                <div style={{fontSize:20,color:'#6495ED'}} id='noduleDivide'>结节 {index+1}</div>
                                                <Table celled>
                                                    <Table.Header>
                                                        <Table.Row>
                                                            <Table.HeaderCell width={7}>检查日期</Table.HeaderCell>
                                                            <Table.HeaderCell width={11}>{this.state.date}</Table.HeaderCell>
                                                        </Table.Row>
                                                    </Table.Header>
                                                    <Table.Body>
                                                        <Table.Row>
                                                            <Table.Cell>切片号</Table.Cell>
                                                            <Table.Cell>{nodule['slice_idx']+1}</Table.Cell>
                                                        </Table.Row>
                                                        <Table.Row>
                                                            <Table.Cell>肺叶位置</Table.Cell>
                                                            <Table.Cell>{nodule['place']===undefined || nodule['place']===0?'':places[nodule['place']]}</Table.Cell>
                                                        </Table.Row>
                                                        <Table.Row>
                                                            <Table.Cell>肺段位置</Table.Cell>
                                                            <Table.Cell>{nodule['segment']===undefined?'':segments[nodule['segment']]}</Table.Cell>
                                                        </Table.Row>
                                                        <Table.Row>
                                                            <Table.Cell>危险程度</Table.Cell>
                                                            <Table.Cell>{nodule['malignancy']===2?'高危':'低危'}</Table.Cell>
                                                        </Table.Row>
                                                        <Table.Row>
                                                            <Table.Cell>毛刺</Table.Cell>
                                                            <Table.Cell>{nodule['spiculation']===2?'毛刺':'非毛刺'}</Table.Cell>
                                                        </Table.Row>
                                                        <Table.Row>
                                                            <Table.Cell>分叶</Table.Cell>
                                                            <Table.Cell>{nodule['lobulation']===2?'分叶':'非分叶'}</Table.Cell>
                                                        </Table.Row>
                                                        <Table.Row>
                                                            <Table.Cell>钙化</Table.Cell>
                                                            <Table.Cell>{nodule['calcification']===2?'钙化':'非钙化'}</Table.Cell>
                                                        </Table.Row>
                                                        <Table.Row>
                                                            <Table.Cell>密度</Table.Cell>
                                                            <Table.Cell>{nodule['texture']===2?'实性':'磨玻璃'}</Table.Cell>
                                                        </Table.Row>
                                                        <Table.Row>
                                                            <Table.Cell>直径</Table.Cell>
                                                            <Table.Cell>{Math.floor(nodule['diameter']*10)/100}cm</Table.Cell>
                                                        </Table.Row>
                                                        
                                                        <Table.Row>
                                                            <Table.Cell>体积</Table.Cell>
                                                            <Table.Cell>{nodule['volume']===undefined?null:Math.floor(nodule['volume']*100)/100+'cm³'}</Table.Cell>
                                                        </Table.Row>
                                                        <Table.Row>
                                                            <Table.Cell>
                                                                HU(最小值/均值/最大值)
                                                                </Table.Cell>
                                                            <Table.Cell>{nodule['huMin']===undefined?null:nodule['huMin']+' / '+nodule['huMean']+' / '+nodule['huMax']}</Table.Cell>
                                                        </Table.Row>
                                                        <Table.Row>
                                                            <Table.Cell>结节部分</Table.Cell>
                                                            <Table.Cell><div id={nodule_id} style={{width:'300px',height:'250px'}}></div></Table.Cell>
                                                            {/* <Table.Cell><Image id={nodule_id}></Image></Table.Cell> */}
                                                        </Table.Row>
                                                        <Table.Row>
                                                            <Table.Cell>直方图</Table.Cell>
                                                            <Table.Cell><div id={visualId} ></div></Table.Cell>
                                                        </Table.Row>
                                                    </Table.Body>
                                                </Table>
                                            </div>
                                        )
                                    })
                                }
                                <Divider/>
                            </Modal.Description>
                        </Modal.Content>
                        
                    </Modal>
                    </Grid.Column>
                    <Grid.Column textAlign='left' width={2}>
                        <Button title='复制' className='inverted blue button' icon='copy outline' onClick={this.handleCopyClick}></Button>
                    </Grid.Column>
                </Grid.Row>
                :
                // 处理建议
                <Grid.Row verticalAlign='middle' columns={3} style={{height:40}}> 
                    <Grid.Column width={7}>

                    </Grid.Column>
                    <Grid.Column widescreen={4} computer={5} textAlign='right'>
                        {windowWidth < 1600 ?
                        <Dropdown style={{background:'none',fontSize:14}} text={this.state.dealchoose} id='dealchoose'>
                            <Dropdown.Menu>
                                <Dropdown.Item onClick={this.dealChoose}>中华共识</Dropdown.Item>
                                <Dropdown.Item onClick={this.dealChoose}>Fleischner</Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>:
                        <Dropdown style={{background:'none',fontSize:16}} text={this.state.dealchoose} id='dealchoose'>
                            <Dropdown.Menu>
                                <Dropdown.Item onClick={this.dealChoose}>中华共识</Dropdown.Item>
                                <Dropdown.Item onClick={this.dealChoose}>Fleischner</Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                        }
                        
                    </Grid.Column>
                    <Grid.Column textAlign='center' width={2}>
                        <Button title='复制' className='inverted blue button' icon='copy outline' onClick={this.handleCopyClick}></Button>
                    </Grid.Column>
                </Grid.Row>
                }
                <Divider></Divider>
                {
                    this.props.type==='影像所见'?
                    <Grid.Row >
                        <Grid.Column textAlign='center'>
                        <textarea style={{fontSize:'medium',overflowY:'auto',height:'150px',width:'100%',
                        background:'transparent',border:'0rem',marginLeft:'0px'}} id='textarea' 
                        placeholder='在此填写诊断报告' onChange={this.handleTextareaChange} value={this.state.templateText}>
                            
                            {/* {this.template().split('*').map((content,index)=>{
                                return(
                                    <p key={index}>
                                        {content}
                                    </p>
                                )
                                
                            })} */}
                        </textarea>
                                            
                        </Grid.Column>
                    </Grid.Row>
                    :
                    <Grid.Row >
                        <Grid.Column textAlign='center'>
                        <Form.TextArea style={{fontSize:'medium',overflowY:'auto',height:'150px',width:'100%',
                        background:'transparent',border:'0rem',marginLeft:'0px'}} id='textarea' placeholder='在此填写处理建议'
                        value={this.state.templateText} onChange={this.handleTextareaChange}>
                        </Form.TextArea>
                                            
                        </Grid.Column>
                    </Grid.Row>
                }
                
            </Grid>
        )
    }
}
export default MiniReport