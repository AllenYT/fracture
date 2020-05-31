import React, {Component,createRef} from 'react'
import {Button, Grid, Modal,Header, Divider, Table,Dropdown, Image} from 'semantic-ui-react'
import axios from 'axios'
import qs from 'qs'

const config = require('../config.json')
const draftConfig=config.draft

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
            nodules:[]
        }
    }

    componentDidMount(){
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

    render(){
        console.log('type',this.props.type)
        console.log('image',this.props.images[0])
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
                    <Modal trigger={<Button icon='expand arrows alternate' content='放大' className='inverted blue button'></Button>}>
                        <Modal.Header>影像诊断报告</Modal.Header>
                        <Modal.Content image scrolling>
                            <Modal.Description>
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
                            
                                <Divider/>
                                <tr>
                                    <td><Header>Weight:</Header></td>
                                </tr>
                                <tr>
                                    <td><Header>Height:</Header></td>
                                    <td align='right'><Header>Body Mass Index:</Header></td>
                                </tr>
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
                                                            <Table.Cell>{nodule['slice_idx']}</Table.Cell>
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
                                                            <Table.Cell><Image src={this.props.images[0]}></Image></Table.Cell>
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
                    <Dropdown text='hhhhh'>
                                            <Dropdown.Menu>
                                                <Dropdown.Header>肺叶</Dropdown.Header>
                                                <Dropdown.Item>
                                                <Dropdown text='右肺中叶'>
                                                    <Dropdown.Menu>
                                                        <Dropdown.Header>肺段</Dropdown.Header>
                                                        <Dropdown.Item  >外侧段</Dropdown.Item>
                                                        <Dropdown.Item  >内侧段</Dropdown.Item>
                                                        <Dropdown.Item >无法定位</Dropdown.Item>
                                                    </Dropdown.Menu>
                                                    </Dropdown>
                                                </Dropdown.Item>
                                                <Dropdown.Item>
                                                <Dropdown text='右肺中叶'>
                                                    <Dropdown.Menu>
                                                        <Dropdown.Header>肺段</Dropdown.Header>
                                                        <Dropdown.Item  >外侧段</Dropdown.Item>
                                                        <Dropdown.Item  >内侧段</Dropdown.Item>
                                                        <Dropdown.Item >无法定位</Dropdown.Item>
                                                    </Dropdown.Menu>
                                                    </Dropdown>
                                                </Dropdown.Item>
                                                <Dropdown.Item>
                                                <Dropdown text='右肺中叶'>
                                                    <Dropdown.Menu>
                                                        <Dropdown.Header>肺段</Dropdown.Header>
                                                        <Dropdown.Item  >外侧段</Dropdown.Item>
                                                        <Dropdown.Item  >内侧段</Dropdown.Item>
                                                        <Dropdown.Item >无法定位</Dropdown.Item>
                                                    </Dropdown.Menu>
                                                    </Dropdown>
                                                </Dropdown.Item>
                                                <Dropdown.Item>
                                                <Dropdown text='右肺中叶'>
                                                    <Dropdown.Menu>
                                                        <Dropdown.Header>肺段</Dropdown.Header>
                                                        <Dropdown.Item  >外侧段</Dropdown.Item>
                                                        <Dropdown.Item  >内侧段</Dropdown.Item>
                                                        <Dropdown.Item >无法定位</Dropdown.Item>
                                                    </Dropdown.Menu>
                                                    </Dropdown>
                                                </Dropdown.Item>
                                                <Dropdown.Item>
                                                <Dropdown text='右肺中叶'>
                                                    <Dropdown.Menu>
                                                        <Dropdown.Header>肺段</Dropdown.Header>
                                                        <Dropdown.Item  >外侧段</Dropdown.Item>
                                                        <Dropdown.Item  >内侧段</Dropdown.Item>
                                                        <Dropdown.Item >无法定位</Dropdown.Item>
                                                    </Dropdown.Menu>
                                                    </Dropdown>
                                                </Dropdown.Item>
                                               
                                            </Dropdown.Menu>
                                        </Dropdown>
                                        
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        )
    }
}
export default MiniReport