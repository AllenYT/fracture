import React, {Component} from 'react'
import '../css/PatientPanel.css'
import qs from 'qs'
import axios from 'axios';
import {Menu, Icon, Grid, Table, Pagination, Checkbox, Tab} from 'semantic-ui-react'
import G2 from '@antv/g2'
import { DatePicker, Button } from 'antd'
import 'antd/dist/antd.css'
import moment from 'moment'
import { runInThisContext } from 'vm';


const storecid = []
const _G = G2,
    Shape = _G.Shape;

const headerStyle = {
    'fontSize': '14px',
    'fontWeight': 'bold'
}

const noPatientSelectHintStyle = {
    'fontSize': '36px',
    'color': '#66cfec',
    'textAlign': 'center',
    'marginTop': '150px',
}

// const PatientInfo={"pid": "0013395276", "name":"LiuGe F",'sex':'男','age':40,'birth':'1979/2/16','times':5,'diameter':10};
// const data=[
//     {date:'2018/2/10',diameter:9.5,volume:283},
//     {date:'2018/5/10',diameter:9.8,volume:300},
//     {date:'2018/9/25',diameter:9.7,volume:295},
//     {date:'2019/1/5',diameter:9.4,volume:274},
//     {date:'2019/5/6',diameter:8.9,volume:249},
//     {date:'2019/10/4',diameter:9.0,volume:256}
// ];
// const record = [{"caseId": "0013395276_20180615_HC", "patientId": "0013395276", "date": "20180615", "seriesId": "1.3.12.2.1107.5.1.4.66043.30000018061423325676300046378", "random": 0.8015941973101485, "patientName": "wenwuping", "origin": "/data/20190706/0013395276*1.3.12.2.1107.5.1.4.66043.30000018061423325676300046378", "type": "record"},
//                 {"caseId": "0000128813_20160526_BC", "patientId": "0000128813", "date": "20160526", "seriesId": "1.3.12.2.1107.5.1.4.73473.30000016052520271363300009130", "random": 0.2657737977077691, "patientName": "chen ming kuan", "origin": "/data/20190706/0000128813*1.3.12.2.1107.5.1.4.73473.30000016052520271363300009130", "type": "record"},
//                 {"caseId": "0000945284_20161208_BC", "patientId": "0000945284", "date": "20161208", "seriesId": "1.3.12.2.1107.5.1.4.50269.30000016120523385709300040527", "random": 0.6244951225558395, "patientName": "luo xiu mei", "origin": "/data/20190706/0000945284*1.3.12.2.1107.5.1.4.50269.30000016120523385709300040527", "type": "record"},
//                 {"caseId": "0018717208_20180508_BC", "patientId": "0018717208", "date": "20180508", "seriesId": "1.3.12.2.1107.5.1.4.66043.30000018050723294944600047394", "random": 0.5012830550085936, "patientName": "chen bin", "origin": "/data/20190706/0018717208*1.3.12.2.1107.5.1.4.66043.30000018050723294944600047394", "type": "record"},
//                 {"caseId": "0018717208_20180508_BC", "patientId": "0018717208", "date": "20180508", "seriesId": "1.3.12.2.1107.5.1.4.66043.30000018050723294944600047394", "random": 0.5012830550085936, "patientName": "chen bin", "origin": "/data/20190706/0018717208*1.3.12.2.1107.5.1.4.66043.30000018050723294944600047394", "type": "record"}
//             ];

const disabledDate = (current) => {
        return current > moment().endOf('day');
      }

class PatientPanel extends Component {
    constructor(props){
        super(props)
        this.state={
            activePage: 1,
            totalPage: 1,
            pidKeyword: '',
            activeItem:'病人详情',
            patientName: '',
            patientSex: '',
            patientBirth: '',
            maxDiameter: 0,
            analyzeList: [],
            stats: {},
            activeIndex: 0,
            params:[],
            width:600,
            height:240
        }
        this.config = JSON.parse(localStorage.getItem('config'))
        this.handlePaginationChange = this
            .handlePaginationChange
            .bind(this)
        this.toCase = this
            .toCase
            .bind(this)
        this.storeCaseId = this
            .storeCaseId
            .bind(this)
        this.drawGraphics = this.drawGraphics.bind(this)
        this.compare = this.compare.bind(this)
        this.getPatientList = this.getPatientList.bind(this)
    }


    handleItemClick = (e, { name }) => this.setState({ activeItem: name })

    handleClick = (e, titleProps) => {
        const { index } = titleProps
        const { activeIndex } = this.state
        const newIndex = activeIndex === index ? -1 : index

        this.setState({ activeIndex: newIndex })
      }

      compare(a, b) {
        // Use toUpperCase() to ignore character casing
        const dateA = a.date;
        const dateB = b.date;

        let comparison = 0;
        if (dateA > dateB) {
          comparison = 1;
        } else if (dateA < dateB) {
          comparison = -1;
        }
        return comparison;
      }

    drawGraphics() {
        var chart = new G2.Chart({
            container: 'graph',
            forceFit: false,
            height: this.state.height,
            width:this.state.width,
            padding:'auto'
          });
          let stats = this.state.stats

          const input = stats.sort(this.compare)

          chart.source(this.state.stats, {
            diameter: {
                alias: '结节直径(mm)'
            },
            volume:{
                alias:'结节体积(mm²)',
                // range:[0,1]
            }
          });
          chart.tooltip({
            crosshairs: {
              type: 'line'
            }
          });

        chart.axis('date',{
            position:'bottom',
            line:{
                stroke:'#404040'
            },
            label:{
                textStyle:{
                    fill:'#000',
                    // fontWeight:'bold'
                }
            },
            title:{
                text:'日期',
                textStyle:{
                    fontSize:12,
                    fill: '#404040'
                }
            }
        });
        chart.axis('diameter',{
            position:'left',
            line:{
                // stroke:'#404040'
            },
            label:{
                textStyle:{
                    fill:'#000',
                    // fontWeight:'bold'
                },
            },
            title:{
                text:'结节直径(mm)',
                textStyle:{
                    fontSize:12,
                    fill: '#404040'
                }
            }
        });

        chart.axis('volume',{
            position:'right',
            line:{
                // stroke:'#404040'
            },
            label:{
                textStyle:{
                    fill:'#000',
                    // fontWeight:'bold'
                },
            },
            title:{
                text:'结节体积(mm²)',
                textStyle:{
                    fontSize:12,
                    fill: '#404040'
                }
            }
        });
        chart.legend({
            useHtml: false,
            position: 'bottom',
            reactive: true,
            textStyle:{
                fill:'#000'
            },
            onHover:ev=>{
                ev.textStyle.fill='#555'
        }
          });
        // var view1 = chart.view();
        chart.line().position('date*diameter').color('#3CB371');
        // chart.point().position('date*value').size(4).shape('circle').style({
        // stroke: '#fff',
        // lineWidth: 1
        // });
        // var view2 = chart.view();
        chart.line().position('date*volume').size(2).style({
            lineDash: [4, 4]
          }).active(true);
        chart.render();
    }

    getPatientList() {
        const params = {
            mainItem: window.location.pathname.split('/')[2],
            type: 'pid',
            otherKeyword: ''
        }

        axios.post(this.config.record.getSubList, qs.stringify(params)).then((response) => {
            const data = response.data
            if (data.status !== 'okay') {
                console.log("Not okay")
                // window.location.href = '/'
            } else {
                const subList = data.subList
                let theList = []
                for (let key in subList) {
                    const seriesLst = subList[key]
                    console.log(key)
                    for (let j = 0; j < seriesLst.length; j ++) {
                        theList.push({
                            'date': key,
                            'caseId': seriesLst[j].split('#')[0],
                            'href': '/case/' + seriesLst[j].split('#')[0] + '/origin'
                        })
                    }
                }
                this.setState({analyzeList: theList})
            }
        }).catch((error) => {
            console.log(error)
        })
    }

    componentDidMount(){//初始化
        const params = {
            patientId: window.location.pathname.split("/")[2]
        }
        axios.post(this.config.record.getPatientInfo, qs.stringify(params))
        .then(res => {
            const data = res.data
            this.setState({
                patientName: data.patientName,
                patientBirth: data.patientBirth,
                patientSex: data.patientSex,
                stats: data.stats,
                maxDiameter: data.maxDiameter
            })
            this.drawGraphics()
            this.getPatientList()
        })
        .catch(err => {
            console.log(err)
        })
        // this.getTotalPages()

    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.pidKeyword !== this.state.pidKeyword || prevState.dateKeyword !== this.state.dateKeyword || prevState.checked !== this.state.checked) {
            this.getTotalPages()
        }
    }
//
    getTotalPages() {
        const token = localStorage.getItem('token')
        const headers = {
            'Authorization': 'Bearer '.concat(token)
        }
        let type = 'pid'
        const params = {
            type: type,
            pidKeyword: this.state.pidKeyword,
        }

        axios.post(this.config.record.getTotalPages, qs.stringify(params), {headers}).then((response) => {
            const data = response.data
            if (data.status !== 'okay') {
                alert("错误，请联系管理员")
                window.location.href = '/'
            } else {
                const totalPage = data.count
                console.log(totalPage)
                this.setState({totalPage: totalPage})
            }
        }).catch((error) => console.log(error))

    }

    handlePaginationChange(e, {activePage}) {
        this.setState({activePage})
    }


    onChange(date, dateString) {
        console.log(date, dateString);
    }

    toCase(e){
        const nextPath = e.currentTarget.dataset.id
        window.location.href = nextPath
    }

    storeCaseId(e,{checked,index}){
        // let value = content[index].split('#')[1]
        console.log(index)
        console.log('ischeck',checked)
        if(checked){
            storecid.push(index)
        }
        else{
            storecid.pop(index)
        }
        console.log('store',storecid)
    }

    render() {
        const { activeItem } = this.state
        console.log(this.state.stats)
        let diagnoisisTable=[]
        const record = this.state.analyzeList
        for(var i=0;i<record.length;i++){
            diagnoisisTable.push(
                <Table.Row key={i}>
                <Table.Cell>
                    {record[i].caseId}
                </Table.Cell>
                <Table.Cell>{record[i].date}</Table.Cell>
                <Table.Cell><Icon size='large' name='search' data-id={record[i].href} onClick={this.toCase}></Icon></Table.Cell>
                {/* <Table.Cell><Checkbox onClick={this.storeCaseId} index={record[i].caseId}></Checkbox></Table.Cell> */}
                <Table.Cell></Table.Cell>
            </Table.Row>

            )
        }
        // console.log(diagnoisisTable)
        if(window.location.pathname.split('/')[2] !== undefined){
            return (
                <div id='patientpanel'>
                    <Grid divided='vertically'>
                        <Grid.Row stretched>
                            <Grid.Column width='3'>
                                <Menu pointing secondary vertical>
                            <div id='menu-header'>
                                <Menu.Item header><p style={{color:'white',fontSize:22+'px'}}>病人详情</p></Menu.Item>
                            </div>
                                {/* <Menu.Item
                                name='病人详情'
                                active={activeItem === '病人详情'}
                                onClick={this.handleItemClick}
                                />
                                <Menu.Item
                                name='诊断结果'
                                active={activeItem === '诊断结果'}
                                onClick={this.handleItemClick}
                                /> */}
                            </Menu>
                            </Grid.Column>
                            <Grid.Column width='12'>
                                <div id='informationPanel'>
                                    <div className='information-header'>
                                        <Grid.Row stretched>
                                            基本信息&nbsp;<p style={{fontSize:12+'px',textAlign:'end'}}>/Personal Information</p>
                                        </Grid.Row>
                                    </div>
                                    <div id='information-body'>
                                        <Grid.Row>
                                            <Grid verticalAlign='middle'>
                                                <Grid.Row columns={4} style={{height:25,marginTop:15}}>
                                                    <Grid.Column width='4'>
                                                    <p style={headerStyle}>病例号:&nbsp;</p>{window.location.pathname.split('/')[2]}
                                                    </Grid.Column>
                                                    <Grid.Column  width='5'>
                                                    <p style={headerStyle}>姓&nbsp;&nbsp;名:&nbsp;</p>{this.state.patientName}
                                                    </Grid.Column>
                                                    <Grid.Column  width='2'>
                                                    <p style={headerStyle}>性&nbsp;&nbsp;别:&nbsp;</p>{this.state.patientSex}
                                                    </Grid.Column>
                                                    <Grid.Column  width='5'>
                                                    <p style={headerStyle}>出生年月:&nbsp;</p>{this.state.patientBirth}
                                                    </Grid.Column>
                                                </Grid.Row>

                                                <Grid.Row columns={2} textAlign='left'>
                                                    <Grid.Column  width='4'>
                                                    <p style={headerStyle}>就诊次数:&nbsp;</p>{this.state.stats.length}
                                                    </Grid.Column>
                                                    <Grid.Column  width='4'>
                                                    <p style={headerStyle}>记录结节最大直径:&nbsp;</p>{Math.round(this.state.maxDiameter)}
                                                    </Grid.Column>
                                                </Grid.Row>
                                            </Grid>
                                        </Grid.Row>
                                    </div>
                                    <hr width='90%' color='#03031b' size='4'/>
                                </div>
                                <div id='nodule-situation'>
                                    <div className='information-header'>
                                        <Grid.Row stretched>
                                            结节情况&nbsp;<p style={{fontSize:12+'px',textAlign:'end'}}>/Nodules Situation</p>
                                        </Grid.Row>
                                    </div>
                                    <Grid.Row verticalAlign='middle' textAlign='center' centered>
                                    <div id='graph'></div>
                                    </Grid.Row>
                                </div>
                                <div id='diagnoisis'>
                                    <Grid.Row>
                                        <div className='information-header'>
                                            <Grid.Row stretched>
                                                历史诊断&nbsp;<p style={{fontSize:12+'px',textAlign:'end'}}>/Previous Diagnosis</p>
                                            </Grid.Row>
                                        </div>
                                    </Grid.Row>
                                    <Grid.Row>
                                    <div id='datePanel'>
                                        {/* <DatePicker onChange={PatientPanel.onChange} disabledDate={disabledDate} placeholder='请选择就诊日期...' style={{marginBottom:10}}/> */}
                                    </div>
                                    {/* <div id='dianogsis-table'> */}
                                        <Table inverted singleLine id='dianogsis-table'>
                                            <Table.Header>
                                                <Table.Row>
                                                    <Table.HeaderCell singleLine>检查编号</Table.HeaderCell>
                                                    <Table.HeaderCell>就诊日期</Table.HeaderCell>
                                                    <Table.HeaderCell>查看报告</Table.HeaderCell>
                                                    <Table.HeaderCell></Table.HeaderCell>
                                                </Table.Row>
                                            </Table.Header>
                                            <Table.Body>
                                                {diagnoisisTable}
                                            </Table.Body>
                                        </Table>
                                    {/* </div> */}

                                    {/* <div className="info-pagination">
                                        <Pagination
                                            id="pagination-info"
                                            onPageChange={this.handlePaginationChange}
                                            activePage={this.state.activePage}
                                            totalPages={this.state.totalPage}/>
                                    </div> */}
                                    {/* <div className='ts-btn'>
                                        <Button>导出</Button>
                                    </div> */}
                                    </Grid.Row>
                                </div>

                            </Grid.Column>
                        </Grid.Row>
                    </Grid>
                </div>
            )
        }
        else{
            return(
                <div>
                    <h2 style={noPatientSelectHintStyle}>当前并未选中任何病人，请前往主页面选择一位病人以查看信息</h2>
                </div>
            )
        }

    }
}

export default PatientPanel
