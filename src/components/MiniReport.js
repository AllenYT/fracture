import React, {Component,createRef} from 'react'
import {Button, Grid, Modal,Header, Divider, Table, Dropdown, Image} from 'semantic-ui-react'
import axios from 'axios'
import qs from 'qs'
import * as cornerstone from "cornerstone-core"
import * as cornerstoneMath from "cornerstone-math"
import * as cornerstoneTools from "cornerstone-tools"
import * as cornerstoneWadoImageLoader from "cornerstone-wado-image-loader"
import { Chart } from '@antv/g2'
import DataSet from '@antv/data-set'

const config = require('../config.json')
const draftConfig=config.draft
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
        }
        this.showImages = this.showImages.bind(this)
        this.visualize = this.visualize.bind(this)
    }

    componentDidMount(){
        console.log('mount')
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

    
    visualize(hist_data,idx){
        const visId = 'visual-' + idx
        document.getElementById(visId).innerHTML=''
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
            width:400,
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
    

    
    showImages(){
        const nodules = this.state.nodules
        const imageIds = this.state.imageIds
        if(nodules.length===0){
            return
        }
        // console.log('imagesid',imageIds)
        let nodule_id = 'nodule-' + nodules[0].nodule_no + '-' + nodules[0].slice_idx
        let num = 0
        var timer = setInterval(function () {
            console.log('timer',num)
            num++
            nodules.map((nodule,index)=>{
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
                    
                    var obj2={}
                    obj2.value=bins[i]
                    obj2.count=ns[i]
                    line.push(obj2)
                }
                console.log('histogram',histogram)
                console.log('line',line)
                const ds = new DataSet();
                const dv = ds.createView().source(histogram)
                
                const chart = new Chart({
                    container: visId,
                    // forceFit: true,
                    forceFit:true,
                    height: 300,
                    width:400
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
                    stroke: 'grey',
                    
                    }).shape('smooth')
                // console.log('chart',dv)
                chart.render()
            }
            
            })
            if(document.getElementById(nodule_id) != null){
                nodules.map((nodule,index)=>{
                    // console.log('nodules1',nodule)
                    nodule_id = 'nodule-' + nodule.nodule_no + '-' + nodule.slice_idx
                    const element = document.getElementById(nodule_id);
                    let imageId = imageIds[nodule.slice_idx]
                    cornerstone.enable(element);
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
                        cornerstone.displayImage(element, image);
                    });
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

    render(){
        let places={0:'选择位置',1:'右肺中叶',2:'右肺上叶',3:'右肺下叶',4:'左肺上叶',5:'左肺下叶'}
        let segments={
        'S1':'右肺上叶-尖段','S2':'右肺上叶-后段','S3':'右肺上叶-前段','S4':'右肺中叶-外侧段','S5':'右肺中叶-内侧段',
        'S6':'右肺下叶-上段','S7':'右肺下叶-内底段','S8':'右肺下叶-前底段','S9':'右肺下叶-外侧底段','S10':'右肺下叶-后底段',
        'S11':'左肺上叶-尖后段','S12':'左肺上叶-前段','S13':'左肺上叶-上舌段','S14':'左肺上叶-下舌段','S15':'左肺下叶-上段',
        'S16':'左肺下叶-前底段','S17':'左肺下叶-外侧底段','S18':'左肺下叶-后底段'}
        console.log('type',this.props.type)
        // console.log('image',this.props.images[0])
        return(
            <Grid divided='vertically'>
                {
                    this.props.type==='影像所见'?
                <Grid.Row verticalAlign='middle' columns={4} style={{height:40}}>
                    <Grid.Column textAlign='left' width={5}>
                        <div style={{fontSize:18}}>IM:  1mm</div>
                    </Grid.Column>
                    <Grid.Column width={4} textAlign='right'>
                        <Dropdown style={{background:'none',fontSize:18}} text='结节排序'></Dropdown>
                    </Grid.Column>
                    <Grid.Column textAlign='center' width={4}>
                    <Modal trigger={<Button icon='expand arrows alternate' content='放大' className='inverted blue button'  onClick={this.showImages}></Button>}>
                        <Modal.Header>影像诊断报告</Modal.Header>
                        <Modal.Content image scrolling>
                            <Modal.Description>
                                <table>
                                    <tbody>
                                         <tr>
                                    <td><Header>Patient ID:</Header></td>
                                    <td>{this.state.patientId}</td>
                                    <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>
                                    <td align='right'><Header>Name:</Header></td>
                                    <td>&nbsp;</td>
                                </tr>
                                <tr>
                                    <td><Header>Birth date:</Header></td>
                                    <td>{this.state.patientBirth}</td>
                                    <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>
                                    <td align='right'><Header>Age:</Header></td>
                                    <td>{this.state.age}</td>
                                </tr>
                                <tr>
                                    <td><Header>Sex:</Header></td>
                                    <td>{this.state.patientSex}</td>
                                    <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>
                                    <td align='right'><Header>Exam Date:</Header></td>
                                    <td>{this.state.date}</td>
                                </tr>
                                <tr>
                                    <td><Header>Exam No.:</Header></td>
                                    <td>12580359</td>
                                    <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>
                                    <td align='right'><Header>Accession Number:</Header></td>
                                    <td>&nbsp;</td>
                                </tr>
                                <tr>
                                    <td><Header>Content Date:</Header></td>
                                    <td>&nbsp;</td>
                                    <td>&nbsp;&nbsp;&nbsp;&nbsp;</td>
                                    <td align='right'><Header>Requested Procedure Description:</Header></td>
                                    <td>&nbsp;</td>
                                </tr>
                                    </tbody>
                               
                                </table>
                                <Divider/>
                                <table>
                                    <tbody>
                                      <tr>
                                        <td width='50%'><Header>Weight:</Header></td>
                                        <td></td>
                                    </tr>
                                    <tr>
                                        <td><Header>Height:</Header></td>
                                        <td align='right'><Header>Body Mass Index:</Header></td>
                                    </tr>  
                                    </tbody>
                                    
                                </table>
                                
                                
                                <Divider/>
                                
                                
                                <div style={{fontSize:20,color:'#6495ED'}}>Scan Parameters</div>
                                <Table celled>
                                    <Table.Header>
                                        <Table.Row>
                                            <Table.HeaderCell>Exam Date</Table.HeaderCell>
                                            <Table.HeaderCell>Pixel Size(mm)</Table.HeaderCell>
                                            <Table.HeaderCell>Thickness / Spacing(mm)</Table.HeaderCell>
                                            <Table.HeaderCell>kV</Table.HeaderCell>
                                            <Table.HeaderCell>mA</Table.HeaderCell>
                                            <Table.HeaderCell>mAs</Table.HeaderCell>
                                            <Table.HeaderCell>Recon Name</Table.HeaderCell>
                                            <Table.HeaderCell>Manufacturer</Table.HeaderCell>
                                        </Table.Row>
                                    </Table.Header>
                                    <Table.Body>

                                    </Table.Body>
                                </Table>
                                <div style={{fontSize:20,color:'#6495ED'}}>Lung</div>
                                <Table celled>
                                    <Table.Header>
                                        <Table.Row>
                                            <Table.HeaderCell>Exam Date</Table.HeaderCell>
                                            <Table.HeaderCell>Volume</Table.HeaderCell>
                                            <Table.HeaderCell>Total Nodule Volume</Table.HeaderCell>
                                        </Table.Row>
                                    </Table.Header>
                                    <Table.Body>

                                    </Table.Body>
                                </Table>
                                {
                                    this.state.nodules.map((nodule,index)=>{
                                        let nodule_id = 'nodule-' + nodule.nodule_no + '-' + nodule.slice_idx
                                        let visualId='visual'+index
                                        console.log('visualId',visualId)
                                        return(
                                            <div key={index}>
                                                <Divider/>
                                                <div>&nbsp;</div>
                                                <div style={{fontSize:20,color:'#6495ED'}}>Nodule {index+1}</div>
                                                <Table celled>
                                                    <Table.Header>
                                                        <Table.Row>
                                                            <Table.HeaderCell width={7}>Exam Date</Table.HeaderCell>
                                                            <Table.HeaderCell width={10}>{this.state.date}</Table.HeaderCell>
                                                        </Table.Row>
                                                    </Table.Header>
                                                    <Table.Body>
                                                        <Table.Row>
                                                            <Table.Cell>Slice Index</Table.Cell>
                                                            <Table.Cell>{nodule['slice_idx']+1}</Table.Cell>
                                                        </Table.Row>
                                                        <Table.Row>
                                                            <Table.Cell>Lung Place</Table.Cell>
                                                            <Table.Cell>{nodule['place']===undefined || nodule['place']===0?'':places[nodule['place']]}</Table.Cell>
                                                        </Table.Row>
                                                        <Table.Row>
                                                            <Table.Cell>Lung Segment</Table.Cell>
                                                            <Table.Cell>{nodule['segment']===undefined?'':segments[nodule['segment']]}</Table.Cell>
                                                        </Table.Row>
                                                        <Table.Row>
                                                            <Table.Cell>Malignancy</Table.Cell>
                                                            <Table.Cell>{nodule['malignancy']===2?'高危':'低危'}</Table.Cell>
                                                        </Table.Row>
                                                        <Table.Row>
                                                            <Table.Cell>Spiculation</Table.Cell>
                                                            <Table.Cell>{nodule['spiculation']===2?'毛刺':'非毛刺'}</Table.Cell>
                                                        </Table.Row>
                                                        <Table.Row>
                                                            <Table.Cell>Lobulation</Table.Cell>
                                                            <Table.Cell>{nodule['lobulation']===2?'分叶':'非分叶'}</Table.Cell>
                                                        </Table.Row>
                                                        <Table.Row>
                                                            <Table.Cell>Calcification</Table.Cell>
                                                            <Table.Cell>{nodule['calcification']===2?'钙化':'非钙化'}</Table.Cell>
                                                        </Table.Row>
                                                        <Table.Row>
                                                            <Table.Cell>Density</Table.Cell>
                                                            <Table.Cell>{nodule['texture']===2?'实性':'磨玻璃'}</Table.Cell>
                                                        </Table.Row>
                                                        <Table.Row>
                                                            <Table.Cell>diameter</Table.Cell>
                                                            <Table.Cell>{Math.floor(nodule['diameter']*10)/100}cm</Table.Cell>
                                                        </Table.Row>
                                                        
                                                        <Table.Row>
                                                            <Table.Cell>volume</Table.Cell>
                                                            <Table.Cell>{nodule['volume']===undefined?null:Math.floor(nodule['volume']*100)/100+'cm³'}</Table.Cell>
                                                        </Table.Row>
                                                        <Table.Row>
                                                            <Table.Cell>HU (Min / Avg /Max)</Table.Cell>
                                                            <Table.Cell>{nodule['huMin']===undefined?null:nodule['huMin']+' / '+nodule['huMean']+' / '+nodule['huMax']}</Table.Cell>
                                                        </Table.Row>
                                                        <Table.Row>
                                                            <Table.Cell>Image Capture</Table.Cell>
                                                            <Table.Cell><div id={nodule_id} style={{width:'400px',height:'300px'}}></div></Table.Cell>
                                                            {/* <Table.Cell><Image id={nodule_id}></Image></Table.Cell> */}
                                                        </Table.Row>
                                                        <Table.Row>
                                                            <Table.Cell>Histogram</Table.Cell>
                                                            <Table.Cell><div id={visualId}></div></Table.Cell>
                                                        </Table.Row>
                                                    </Table.Body>
                                                </Table>
                                            </div>
                                        )
                                    })
                                }
                                {/* <Divider/>

                                <div>&nbsp;</div>
                                <div style={{fontSize:20,color:'blue'}}>Nodule 1</div> */}
                            </Modal.Description>
                        </Modal.Content>
                    </Modal>
                    </Grid.Column>
                    <Grid.Column textAlign='left' width={3}>
                        <Button content='复制' className='inverted blue button'></Button>
                    </Grid.Column>
                </Grid.Row>
                :
                <Grid.Row verticalAlign='middle' columns={3} style={{height:40}}>
                    <Grid.Column width={9}>

                    </Grid.Column>
                    <Grid.Column width={4} textAlign='right'>
                        <Dropdown style={{background:'none',fontSize:18}} text='Fleischner'></Dropdown>
                    </Grid.Column>
                    <Grid.Column textAlign='center' width={3}>
                        <Button content='复制' className='inverted blue button'></Button>
                    </Grid.Column>
                </Grid.Row>
                }
                <Divider></Divider>
                <Grid.Row >
                    
                    <Grid.Column>
                    <div style={{fontSize:'large'}}>
                        <p>
                        右肺下叶有一0.39cm的实性结节，有钙化成分，风险较低
                        </p>
                        <p>
                        左肺上叶上舌段有一0.38cm的实性结节，有钙化成分
                        </p>
                    </div>
                                        
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        )
    }
}
export default MiniReport