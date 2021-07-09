import React, {Component} from 'react'
import {Button, Icon, Card, Grid, Image,Progress, Segment,Header} from 'semantic-ui-react'
import '../css/statistics.css'
import axios from 'axios';
import 'antd/dist/antd.css';
import G2 from '@antv/g2'
import {DataSet} from '@antv/data-set'
import { loadOptions } from '@babel/core';


const _DataSet = DataSet,
    DataView = _DataSet.DataView;
const _G = G2,
    Shape = _G.Shape;

const sexData={"female":6,"male":1}

const classData = [{
    //良恶性数据
    value: 251,
    type: '良性',
    name: '炎性假瘤'
  }, {
    value: 148,
    type: '良性',
    name: '错构瘤'
  }, {
    value: 110,
    type: '良性',
    name: '腺瘤'
  }, {
    value: 134,
    type: '良性',
    name: '结核球'
  }, {
    value: 634,
    type: '恶性',
    name: '鳞癌'
  }, {
    value: 135,
    type: '恶性',
    name: '小细胞癌'
  }, {
    value: 1250,
    type: '恶性',
    name: '腺癌'
  }];

// const classData = [
//     {
//         value: 56,
//         type: '良性'
//     },
//     {
//         value: 23,
//         type: '恶性'
//     }
// ]

class Statistics extends Component {
    constructor(props) {
        super(props)
        this.state = {
            totalPatients: localStorage.getItem('totalPatients')===null?0:localStorage.getItem('totalPatients'),
            totalRecords: localStorage.getItem('totalRecords')===null?0:localStorage.getItem('totalRecords'),
            modelProgress: localStorage.getItem('modelProgress')===null?0:localStorage.getItem('modelProgress'),
            sexlist:localStorage.getItem('sexData')===null?JSON.stringify(sexData):localStorage.getItem('sexData'),
            // femaleNum:localStorage.getItem('femaleNum')===null?0:localStorage.getItem('femaleNum'),
            // maleNum:localStorage.getItem('maleNum')===null?0:localStorage.getItem('maleNum'),
            params:[],
            width:650,
            forceFit:true,
            height:250,
            scale:{
                dataKey: 'percent',
                min: 0,
                formatter: '.0%',
            },
            plotCfg:{
                // margin:[30,40,90,80],
                background:{
                    stroke:'#ccc',
                    lineWidth:1
                }
            }
        }
        this.config = JSON.parse(localStorage.getItem('config'))
        this.visualize = this.visualize.bind(this)
    }


    componentWillMount() {
        Promise.all([
            axios.get(this.config.user.get_statistics),
            axios.get(this.config.user.get_sexData)
        ])
        .then(([response,res]) => {
          console.log(response.data)
          const tp = response.data.totalPatients
          const tr = response.data.totalRecords
          const mp = response.data.modelProgress
          localStorage.setItem('totalPatients', tp)
          localStorage.setItem('totalRecords', tr)
          localStorage.setItem('modelProgress', mp)
          const sd = res.data
          const sdj = JSON.stringify(sd) //JSON格式
          localStorage.setItem('sexData',sdj)
        //   localStorage.setItem('femaleNum', fn)
        //   localStorage.setItem('maleNum', mn)
          this.setState({totalPatients: tp, totalRecords: tr, modelProgress: mp, sexlist:sdj})
        })
        .catch((error) => {
          console.log("ERRRRROR", error);
        })
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.sexlist !== this.state.sexlist) {
            this.visualize()
        }
    }

    visualize() {
        document.getElementById('line').innerHTML = ''
        document.getElementById('mountNode').innerHTML = ''
        const list = this.state.sexlist
        const listj = JSON.parse(list)
        const sexData=[{
            //患者性别数据
            item: '男性',
            count: listj.male,
        }, {
            item: '女性',
            count: listj.female,
        }];
        console.log('sexData',sexData)
        // 性别可视化
        const dv3 = new DataView();
        dv3.source(sexData).transform({
            type: 'percent',
            // fields: [ 'female', 'male' ], // 展开字段集
            // key: 'item',                   // key字段
            // value: 'count',        //
            field: 'count',
            dimension: 'item',
            as: 'percent'
        });
        const sexChart = new G2.Chart({ //性别可视化
            container: 'line',
            forceFit: true,
            height: 250,
            padding: 0,
            animate:true
        });
        sexChart.coord('theta', {
            radius: 0.75,
            innerRadius: 0.5
          });
        sexChart.source(dv3,{
            percent: {
            formatter: function formatter(val) {
                val = (val * 100).toFixed(1) + '%';
                return val;
            }
        }
      });
        sexChart.legend(false);
        sexChart.tooltip({
            showTitle: false,
            itemTpl: '<li><span style="background-color:{color};" class="g2-tooltip-marker"></span>{name}: {value}</li>'
        });
        sexChart.intervalStack().position('percent').color('item',['#0a9afe','#f0657d']).label('percent', {
            offset: -25,
            autoRotate: false,
            textStyle: {
            textAlign: 'center',
            shadowBlur: 2,
            shadowColor: 'rgba(0, 0, 0, .45)',
            fill:'#fff'
            },
            formatter: function formatter(val, item) {
                return item.point.item +':\n' + val;
            }
        }).tooltip('item*percent', function(item, percent) {
            percent = (percent * 100).toFixed(1)+ '%';
            return {
            name: item,
            value: percent
            };
        }).style({
            lineWidth: 0,
            stroke: '#fff'
        });
        sexChart.render();

        //良恶性可视化
        const dv = new DataView();
        dv.source(classData).transform({
            type: 'percent',
            field: 'value',
            dimension: 'type',
            as: 'percent'
        });
        const chart = new G2.Chart({
            container: 'mountNode',
            forceFit: true,
            height: 250,
            padding: 0
        });
        chart.source(dv, {
            percent: {
            formatter: function formatter(val) {
                val = (val * 100).toFixed(2) + '%';
                return val;
            }
            }
        });
        chart.coord('theta', {
            radius: 0.5
        });
        chart.tooltip({
            showTitle: false
        });
        chart.legend(false);
        chart.intervalStack().position('percent').color('type').label('type', {
            offset: -20
        }).tooltip('type*percent', function(item, percent) {
            percent = (percent * 100).toFixed(2) + '%';
            return {
            name: item,
            value: percent
            };
        }).select(false).style({
            lineWidth: 0,
            stroke: '#fff'
        });

        const outterView = chart.view();
        const dv1 = new DataView();
        dv1.source(classData).transform({
            type: 'percent',
            field: 'value',
            dimension: 'name',
            as: 'percent'
        });
        outterView.source(dv1, {
            percent: {
            formatter: function formatter(val) {
                val = (val * 100).toFixed(2) + '%';
                return val;
            }
            }
        });
        outterView.coord('theta', {
            innerRadius: 0.5 / 0.75,
            radius: 0.75
        });
        outterView.intervalStack().position('percent').color('name', ['#BAE7FF', '#7FC9FE', '#71E3E3', '#ABF5F5', '#8EE0A1', '#BAF5C4']).label('name', {
            textStyle: {
                shadowBlur: 2,
                shadowColor: 'rgba(0, 0, 0, .45)',
                fill:'#fff'
                // fill:'black'
                },
        }).tooltip('name*percent', function(item, percent) {
            percent = (percent * 100).toFixed(2) + '%';
            return {
            name: item,
            value: percent
            };
        }).select(false).style({
            lineWidth: 0,
            stroke: '#fff'
        });

        chart.render();
    }

    componentDidMount() {
        this.visualize()
    }

    componentDidCatch(){//初始化

    }

    render() {
        const totalPatients = this.state.totalPatients
        const totalRecords = this.state.totalRecords
        const progress = this.state.modelProgress
        console.log("progress",progress)
        const progressValue= (progress||"").split('%')[0]
        const list = this.state.sexlist
        console.log('lists',list)
        return (

                <div className="card-list">

                    <h2 className="sta-header">当前数据</h2>
                    <Button inverted color='green' icon>
                        <Icon name='sync' />
                    </Button>

                    <Grid>
                        <Grid.Row columns={3}>
                        <Grid.Column width={5}>
                            <Card style={{width:500}}>
                                <Card.Content header='病人数'/>
                                <Card.Content description={totalPatients}/>
                                <div id='line'></div>
                            </Card>
                        </Grid.Column>
                        <Grid.Column width={6}>
                            <Card style={{width:600}}>
                            <Card.Content header='检查数'/>
                            <Card.Content description={totalRecords}/>
                            <div id='mountNode'></div>
                            </Card>
                        </Grid.Column>
                        <Grid.Column width={5}>
                            <Card style={{width:500}}>
                                <Card.Content header='模型进度'/>
                                {/* <Card.Content id="percentage" description={progress}/> */}
                                <Progress id='percentage' percent={progressValue} indicating progress='percent' size='large'/>
                            </Card>
                        </Grid.Column>
                        </Grid.Row>
                    </Grid>

                </div>

        )
    }
}

export default Statistics
