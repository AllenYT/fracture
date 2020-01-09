import React, { Component } from 'react'
import { Form, Radio ,Grid, Image, Button, Icon} from 'semantic-ui-react'
import G2 from '@antv/g2'
import {DataSet} from '@antv/data-set'
import '../css/DataCockpit.css'
import axios from 'axios'
import { loadOptions } from '@babel/core'

const config = require('../config.json')
const noduleConfig = config.nodule
const _DataSet = DataSet,
    DataView = _DataSet.DataView;
const _G = G2,
    Shape = _G.Shape;

const btstyle='float:right;'

var ageTotalData = [{
  //总体年龄分布
    type: '未知',
    value: 10,
  }, {
    type: '35 岁以下',
    value: 5,
  }, {
    type: '36-45 岁',
    value: 20,
  }, {
    type: '46-55 岁',
    value: 45,
  }, {
    type: '56-60 岁',
    value: 55,
  }, {
    type: '61-65 岁',
    value: 214,
  }, {
    type: '65 岁以上',
    value: 185,
  }];

var diaTotalData = [{
  //总体结节直径分布
    type: '0-3 mm',
    value: 10,
  }, {
    type: '3-5 mm',
    value: 5,
  }, {
    type: '5-8 mm',
    value: 20,
  }, {
    type: '8-30 mm',
    value: 45,
  }, {
    type: '>30 mm',
    value: 55,
  }];

var benmaliData = [{
  //良恶性分布
  type: '良性',
  value: 10,
}, {
  type: '恶性',
  value: 50,
}];

// var maliGenderData = [{
//   //恶性性别占比
//   gender: 'female',
//   type: '小细胞癌',
//   value: 30
// }, {
//   gender: 'male',
//   type: '小细胞癌',
//   value: 35
// }, {
//   gender: 'total',
//   type: '小细胞癌',
//   value: 65
// }, {
//   gender: 'female',
//   type: '鳞癌',
//   value: 40
// }, {
//   gender: 'male',
//   type: '鳞癌',
//   value: 65
// }, {
//   gender: 'total',
//   type: '鳞癌',
//   value: 105
// }, {
//   gender: 'female',
//   type: '腺癌',
//   value: 23
// }, {
//   gender: 'male',
//   type: '腺癌',
//   value: 18
// }, {
//   gender: 'total',
//   type: '腺癌',
//   value: 41
// }];


//形态学直径分布
var diaDistributionData = [{
  type: '毛刺',
  diameter: '0-3mm',
  value: 30
}, {
  type: '分叶',
  diameter: '0-3mm',
  value: 35
}, {
  type: '钙化',
  diameter: '0-3mm',
  value: 28
}, {
  type: '磨玻璃',
  diameter: '0-3mm',
  value: 21
}, {
  type: '毛刺',
  diameter: '3-5mm',
  value: 40
}, {
  type: '分叶',
  diameter: '3-5mm',
  value: 65
}, {
  type: '钙化',
  diameter: '3-5mm',
  value: 47
}, {
  type: '磨玻璃',
  diameter: '3-5mm',
  value: 66
}, {
  type: '毛刺',
  diameter: '5-8mm',
  value: 23
}, {
  type: '分叶',
  diameter: '5-8mm',
  value: 18
}, {
  type: '钙化',
  diameter: '5-8mm',
  value: 20
}, {
  type: '磨玻璃',
  diameter: '5-8mm',
  value: 10
}, {
  type: '毛刺',
  diameter: '8-30mm',
  value: 35
}, {
  type: '分叶',
  diameter: '8-30mm',
  value: 30
}, {
  type: '钙化',
  diameter: '8-30mm',
  value: 25
}, {
  type: '磨玻璃',
  diameter: '8-30mm',
  value: 21
},{
  type: '毛刺',
  diameter: '>=30mm',
  value: 35
}, {
  type: '分叶',
  diameter: '>=30mm',
  value: 30
}, {
  type: '钙化',
  diameter: '>=30mm',
  value: 25
}, {
  type: '磨玻璃',
  diameter: '>=30mm',
  value: 2
}]

var diaNonGlitchData = [{
  //非毛刺直径分布
    type: '0-3 mm',
    value: 10,
  }, {
    type: '3-5 mm',
    value: 5,
  }, {
    type: '5-8 mm',
    value: 20,
  }, {
    type: '8-30 mm',
    value: 45,
  }, {
    type: '>30 mm',
    value: 55,
  }];

var diaNonSublobeData = [{
  //非分叶直径分布
    type: '0-3 mm',
    value: 10,
  }, {
    type: '3-5 mm',
    value: 5,
  }, {
    type: '5-8 mm',
    value: 20,
  }, {
    type: '8-30 mm',
    value: 45,
  }, {
    type: '>30 mm',
    value: 55,
  }];


var diaNonCalcifyData = [{
  //非钙化直径分布
    type: '0-3 mm',
    value: 10,
  }, {
    type: '3-5 mm',
    value: 5,
  }, {
    type: '5-8 mm',
    value: 20,
  }, {
    type: '8-30 mm',
    value: 45,
  }, {
    type: '>30 mm',
    value: 55,
  }];

var diaNonGGOData = [{
  //实性直径分布
    type: '0-3 mm',
    value: 10,
  }, {
    type: '3-5 mm',
    value: 5,
  }, {
    type: '5-8 mm',
    value: 20,
  }, {
    type: '8-30 mm',
    value: 45,
  }, {
    type: '>30 mm',
    value: 55,
  }];

//毛刺良恶性分布
const maliGlitchData = [
  { type: '良性', value: 40},
  { type: '恶性', value: 21},
];

//分叶良恶性分布
const maliSublobeData = [
  { type: '良性', value: 40},
  { type: '恶性', value: 21},
];

//钙化良恶性分布
const maliCalcifyData = [
  { type: '良性', value: 40},
  { type: '恶性', value: 21},
];

//GGO良恶性分布
const maliGGOData = [
  { type: '良性', value: 40},
  { type: '恶性', value: 21},
];


class DataCockpit extends Component {
    constructor(props) {
        super(props)
        this.state = {
          totalMalDist:localStorage.getItem('totalMalDist')===null?JSON.stringify(benmaliData):localStorage.getItem('totalMalDist'),
          totalDiameterDist:localStorage.getItem('totalDiameterDist')===null?JSON.stringify(diaTotalData):localStorage.getItem('totalDiameterDist'),
          characterDiameterDist:localStorage.getItem('characterDiameterDist')===null?JSON.stringify(diaDistributionData):localStorage.getItem('characterDiameterDist'),
          nonSpiculationDiameterDist:localStorage.getItem('nonSpiculationDiameterDist')===null?JSON.stringify(diaNonGlitchData):localStorage.getItem('nonSpiculationDiameterDist'),
          nonCalcificationDiameterDist:localStorage.getItem('nonCalcificationDiameterDist')===null?JSON.stringify(diaNonCalcifyData):localStorage.getItem('nonCalcificationDiameterDist'),
          totalAgeDist:localStorage.getItem('totalAgeDist')===null?JSON.stringify(ageTotalData):localStorage.getItem('totalAgeDist'),
          nonLobulationDiameterDist:localStorage.getItem('nonLobulationDiameterDist')===null?JSON.stringify(diaNonSublobeData):localStorage.getItem('nonLobulationDiameterDist'),
          nonTextureDiameterDist:localStorage.getItem('nonTextureDiameterDist')===null?JSON.stringify(diaNonGGOData):localStorage.getItem('nonTextureDiameterDist'),
          spiculationMalDist:localStorage.getItem('spiculationMalDist')===null?JSON.stringify(maliGlitchData):localStorage.getItem('spiculationMalDist'),
          calcificationMalDist:localStorage.getItem('calcificationMalDist')===null?JSON.stringify(maliCalcifyData):localStorage.getItem('calcificationMalDist'),
          lobulationMalDist:localStorage.getItem('lobulationMalDist')===null?JSON.stringify(maliSublobeData):localStorage.getItem('lobulationMalDist'),
          textureMalDist:localStorage.getItem('textureMalDist')===null?JSON.stringify(maliGGOData):localStorage.getItem('textureMalDist')
        }
        this.visualize = this.visualize.bind(this)
        this.typeChange = this.typeChange.bind(this)
    }

    componentWillMount() {
      Promise.all([
          axios.get(noduleConfig.totalMalDist),
          axios.get(noduleConfig.totalDiameterDist),
          axios.get(noduleConfig.characterDiameterDist),
          axios.get(noduleConfig.nonSpiculationDiameterDist),
          axios.get(noduleConfig.nonCalcificationDiameterDist),
          axios.get(noduleConfig.totalAgeDist),
          axios.get(noduleConfig.nonLobulationDiameterDist),
          axios.get(noduleConfig.nonTextureDiameterDist),
          axios.get(noduleConfig.spiculationMalDist),
          axios.get(noduleConfig.calcificationMalDist),
          axios.get(noduleConfig.lobulationMalDist),
          axios.get(noduleConfig.textureMalDist)
      ])
      .then(([restm,restd,rescd,resns,resnc,resta,resld,resntd,ressm,reslm,resttm]) => {
        const total_mal = JSON.stringify(restm.data['data'])
        const total_dia = JSON.stringify(restd.data['data'])
        const total_character = JSON.stringify(rescd.data['data'])
        const nonSpiDia = JSON.stringify(resns.data['data'])
        const nonCalDia = JSON.stringify(resnc.data['data'])
        const total_age = JSON.stringify(resta.data['data'])
        const nonLubDia = JSON.stringify(resld.data['data'])
        const nonGGODia = JSON.stringify(resntd.data['data'])
        const spiMali = JSON.stringify(ressm.data['data'])
        const calMali = JSON.stringify(ressm.data['data'])
        const lubeMali = JSON.stringify(reslm.data['data'])
        const textMal = JSON.stringify(resttm.data['data'])
        localStorage.setItem('totalMalDist',total_mal)
        localStorage.setItem('totalDiameterDist',total_dia)
        localStorage.setItem('characterDiameterDist',total_character)
        localStorage.setItem('nonSpiculationDiameterDist',nonSpiDia)
        localStorage.setItem('nonCalcificationDiameterDist',nonCalDia)
        localStorage.setItem('totalAgeDist',total_age)
        localStorage.setItem('nonLobulationDiameterDist',nonLubDia)
        localStorage.setItem('nonTextureDiameterDist',nonGGODia)
        localStorage.setItem('spiculationMalDist',spiMali)
        localStorage.setItem('calcificationMalDist',calMali)
        localStorage.setItem('lobulationMalDist',lubeMali)
        localStorage.setItem('textureMalDist',textMal)
        this.setState({totalMalDist:total_mal,totalDiameterDist:total_dia,characterDiameterDist:total_character,
          nonSpiculationDiameterDist:nonSpiDia,nonCalcificationDiameterDist:nonCalDia,totalAgeDist:total_age,nonLobulationDiameterDist:nonLubDia,
          nonTextureDiameterDist:nonGGODia,spiculationMalDist:spiMali,calcificationMalDist:calMali,lobulationMalDist:lubeMali,textureMalDist:textMal})
      })
      .catch((error) => {
        console.log("ERRRRROR", error);
      })
  }

    visualize() {
        //总体年龄分布可视化
        document.getElementById('ageTotal').innerHTML=''
        const ageD = this.state.totalAgeDist
        const ageTotalData1 = JSON.parse(ageD)
        const ageTotalchart = new G2.Chart({
            container: 'ageTotal',
            forceFit: false,
            height: 240,
            width:400,
            // width:100,
            padding: [30,'auto','auto','auto']
          });
          ageTotalchart.source(ageTotalData1);
          ageTotalchart.scale('value', {
            alias: '人数'
          });
          ageTotalchart.axis('type', {
            label: {
              textStyle: {
                fill: '#aaaaaa'
              }
            },
            tickLine: {
              alignWithLabel: false,
              length: 0
            }
          });
          ageTotalchart.tooltip({
            share: true
          });
          ageTotalchart.interval().position('type*value').opacity(1).label('value',{
            textStyle:{
              fontSize:14,
              fill:'#aaa'
            }
          }).color(['#00B4D8']).size(30);
          ageTotalchart.render();

        //总体年龄占比饼图
        document.getElementById('ageTotal2').innerHTML=''
        const dv2 = new DataView();
        dv2.source(ageTotalData1).transform({
            type: 'percent',
            field: 'value',
            dimension: 'type',
            as: 'percent'
        });
        var diaTotal2chart = new G2.Chart({
          container: 'ageTotal2',
          forceFit: false,
          height: 220,
          width:520,
          padding: [35,20,35,20],
          animate:true
        });
        diaTotal2chart.source(dv2, {
          percent: {
            formatter: function formatter(val) {
              val = (val * 100).toFixed(1) + '%';
              return val;
            }
          }
        });
        diaTotal2chart.coord('theta');
        diaTotal2chart.tooltip({
          showTitle: false,
          itemTpl: '<li><span style="background-color:{color};" class="g2-tooltip-marker"></span>{name}: {value}人</li>'
        });
        // ['#188B8E','#002687', '#BB7329','#3C1E74', '#061846']
        // diaTotal2chart.legend(false)
        diaTotal2chart.intervalStack().position('value').color('type', ['#ffffcc','#a1dab4','#41b6c4','#2c7fb8','#4a488e']).opacity(1).label('value', function(val) {
          return {
            formatter: (text, item) => {
              const point = item.point; // 每个弧度对应的点
              let percent = point['percent'];
              percent = (percent * 100).toFixed(2) + '%';
              const showTitle = point.value == 0 ?  null:point.type+'：'+percent 
              return showTitle
            },
            textStyle: {
              fill: '#fff'
            }
          };
        }).tooltip('type*value', function(item, value) {
          // percent = (percent * 100).toFixed(1) + '%';
          return {
            name: item,
            value: value
          };
        });
        diaTotal2chart.render();

        //总体结节直径分布
        document.getElementById('diaTotal').innerHTML=''
        const DiaD = this.state.totalDiameterDist
        const diaTotalData1 = JSON.parse(DiaD)
        const diaTotalchart = new G2.Chart({
          container: 'diaTotal',
          forceFit: false,
          height: 240,
          width:400,
          // width:100,
          padding: [30,'auto','auto','auto']
        });
        diaTotalchart.source(diaTotalData1);
        diaTotalchart.scale('value', {
          alias: '结节数'
        });
        diaTotalchart.axis('type', {
          label: {
            textStyle: {
              fill: '#aaaaaa'
            }
          },
          tickLine: {
            alignWithLabel: false,
            length: 0
          }
        });
        diaTotalchart.tooltip({
          share: true
        });
        diaTotalchart.interval().position('type*value').opacity(1).label('value',{
          textStyle:{
            fontSize:14,
            fill:'#aaa'
          }
        }).color(['#00B4D8']).size(30);
        diaTotalchart.render();

        //总体结节直径分布饼图
        document.getElementById('diaTotal2').innerHTML=''
        const dv6 = new DataView();
        dv6.source(diaTotalData1).transform({
            type: 'percent',
            field: 'value',
            dimension: 'type',
            as: 'percent'
        });
        var diaTotal2chart = new G2.Chart({
          container: 'diaTotal2',
          forceFit: false,
          height: 220,
          width:520,
          padding: [35,20,35,20],
          animate:true
        });
        diaTotal2chart.source(dv6, {
          percent: {
            formatter: function formatter(val) {
              val = (val * 100).toFixed(1) + '%';
              return val;
            }
          }
        });
        diaTotal2chart.coord('theta');
        diaTotal2chart.tooltip({
          showTitle: false
        });
        // diaTotal2chart.legend(false)
        diaTotal2chart.intervalStack().position('value').color('type', ['#ffffcc','#a1dab4','#41b6c4','#2c7fb8','#4a488e']).opacity(1).label('value', function(val) {
          return {
            formatter: (text, item) => {
              const point = item.point; // 每个弧度对应的点
              let percent = point['percent'];
              percent = (percent * 100).toFixed(2) + '%';
              return point.type+':'+percent;
            },
            textStyle: {
              fill: '#fff'
            }
          };
        });
        diaTotal2chart.render();

        //良恶性分布情况
        document.getElementById('benmali').innerHTML=''
        const benmaliD = this.state.totalMalDist
        const benmaliData1 = JSON.parse(benmaliD)
        const dv4 = new DataView();
        dv4.source(benmaliData1).transform({
            type: 'percent',
            field: 'value',
            dimension: 'type',
            as: 'percent'
        });
        var benmaliChart = new G2.Chart({
          container: 'benmali',
          forceFit: true,
            height: 240,
            padding: [0, 50, 20, 50],
            animate:true
        });
        benmaliChart.source(dv4,{
          percent: {
            formatter: function formatter(val) {
              val = (val * 100).toFixed(1) + '%';
              return val;
          }
      }
    });
        benmaliChart.coord('theta', {
          radius: 0.75
        });
        benmaliChart.tooltip({
          showTitle: false,
          itemTpl: '<dl><dt type="none">结节数:</dt><dt type="none"><span style="background-color:{color};" class="g2-tooltip-marker"></span>{name}: {value}</dt></dl>'
        });
        benmaliChart.intervalStack().position('percent').color('type',['#a1dab4','#2c7fb8']).label('percent', {
          offset: -40,
          autoRotate: false,
          textStyle: {
            textAlign: 'center',
            shadowBlur: 2,
            shadowColor: 'rgba(0, 0, 0, .45)',
            fill:'#fff'
          },
          formatter: function formatter(val, item) {
            return item.point.type +':\n' + val;
        }
        }).tooltip('type*value', function(item, value) {
          // percent = (percent * 100).toFixed(1) + '%';
          return {
            name: item,
            value: value
          };
        });
        benmaliChart.render();

    //形态学分叶直径分布
    document.getElementById('diaSublobe').innerHTML=''
    const characterD = this.state.characterDiameterDist
    const diaDistributionData1 = JSON.parse(characterD)
    const diaSublobechart = new G2.Chart({
      container: 'diaSublobe',
      forceFit: true,
      height: 250,
      // width:100,
      padding:[30,30,'auto',30]
    });
    const dv8 = new DataView();
    dv8.source(diaDistributionData1).transform({
        type: 'filter',
        callback(row) { // 判断某一行是否保留，默认返回true
          return row.type == '分叶';
        }
    });
    diaSublobechart.source(dv8);
    diaSublobechart.scale('value', {
      alias: '结节数'
    });
    diaSublobechart.axis('diameter', {
      label: {
        textStyle: {
          fill: '#aaaaaa'
        }
      },
      tickLine: {
        alignWithLabel: false,
        length: 0
      }
    });
    diaSublobechart.tooltip({
      share: true
    });
    //#3CB371
    diaSublobechart.interval().position('diameter*value').opacity(1).label('value',{
      textStyle:{
        fontSize:14,
        fill:'#aaa'
      }
    }).color(['#00B4D8']).size(30);
    diaSublobechart.render();

    //形态学分叶直径分布饼图
    document.getElementById('diaSublobePie').innerHTML=''
    const dv12 = new DataView();
    dv12.source(dv8).transform({
      type: 'percent',
      field: 'value',
      dimension: 'diameter',
      as: 'percent'
  });
    const diaSublobePie = new G2.Chart({
      container: 'diaSublobePie',
      forceFit: false,
      height: 250,
      width:400,
      padding:[45,30,45,30],
      animate: false
    });
    diaSublobePie.source(dv12, {
      percent: {
        formatter: val => {
          val = (val * 100).toFixed(2) + '%';
          return val;
        }
      }
    });
    diaSublobePie.coord('theta', {
      radius:1,
      innerRadius: 0.7
    });
    diaSublobePie.tooltip({
      showTitle: false,
      itemTpl: '<dl><dt type="none">结节数:</dt><dt type="none"><span style="background-color:{color};" class="g2-tooltip-marker"></span>{name}: {value}</dt></dl>'
    });
    diaSublobePie.intervalStack()
      .position('value')
      .color('diameter',['#ffffcc','#a1dab4','#41b6c4','#2c7fb8','#4a488e'])
      .label('percent', {
        formatter: (val, item) => {
          const showTitle = item.point.value == 0 ?  null:item.point.diameter + ': ' + val 
          return showTitle
        },
        textStyle: {
          fill: '#fff'
        }
      })
      .tooltip('diameter*value', (item, value) => {
        return {
          name: item,
          value: value
        };
      });
    diaSublobePie.render();
    

    //形态学毛刺直径分布
    document.getElementById('diaGlitch').innerHTML=''
    const diaGlitchchart = new G2.Chart({
      container: 'diaGlitch',
      forceFit: true,
      height: 250,
      // width:100,
      padding: [30,30,'auto',30]
    });
    const dv9 = new DataView();
    dv9.source(diaDistributionData1).transform({
        type: 'filter',
        callback(row) { // 判断某一行是否保留，默认返回true
          return row.type == '毛刺';
        }
    });
    diaGlitchchart.source(dv9);
    diaGlitchchart.scale('value', {
      alias: '结节数'
    });
    diaGlitchchart.axis('diameter', {
      label: {
        textStyle: {
          fill: '#aaaaaa'
        }
      },
      tickLine: {
        alignWithLabel: false,
        length: 0
      }
    });
    diaGlitchchart.tooltip({
      share: true
    });
    diaGlitchchart.interval().position('diameter*value').opacity(1).label('value',{
      textStyle:{
        fontSize:14,
        fill:'#aaa'
      }
    }).color(['#00B4D8']).size(30);
    diaGlitchchart.render();

   //形态学毛刺直径分布饼图
   document.getElementById('diaGlitchPie').innerHTML=''
   const dv14 = new DataView();
   dv14.source(dv9).transform({
      type: 'percent',
      field: 'value',
      dimension: 'diameter',
      as: 'percent'
  });
    const diaGlitchPie = new G2.Chart({
      container: 'diaGlitchPie',
      forceFit: false,
      height: 250,
      width:400,
      padding:[45,30,45,30],
      animate: false
    });
    diaGlitchPie.source(dv14, {
      percent: {
        formatter: val => {
          val = (val * 100).toFixed(2) + '%';
          return val;
        }
      }
    });
    diaGlitchPie.coord('theta', {
      radius:1,
      innerRadius: 0.7
    });
    diaGlitchPie.tooltip({
      showTitle: false,
      itemTpl: '<dl><dt type="none">结节数:</dt><dt type="none"><span style="background-color:{color};" class="g2-tooltip-marker"></span>{name}: {value}</dt></dl>'
    });
    //['#188B8E','#002687', '#E08031','#3C1E74', '#061846']
    diaGlitchPie.intervalStack()
      .position('value')
      .color('diameter',['#ffffcc','#a1dab4','#41b6c4','#2c7fb8','#4a488e'])
      .label('percent', {
        formatter: (val, item) => {
          const showTitle = item.point.value == 0 ?  null:item.point.diameter + ': ' + val 
          return showTitle
        },
        textStyle: {
          fill: '#fff'
        }
      })
      .tooltip('diameter*value', (item, value) => {
        return {
          name: item,
          value: value
        };
      });
    diaGlitchPie.render();

    //形态学钙化直径分布
    document.getElementById('diaCalcify').innerHTML=''
    const diaCalcifychart = new G2.Chart({
      container: 'diaCalcify',
      forceFit: true,
      height: 250,
      // width:100,
      padding: [30,30,'auto',30]
    });
    const dv10 = new DataView();
    dv10.source(diaDistributionData1).transform({
        type: 'filter',
        callback(row) { // 判断某一行是否保留，默认返回true
          return row.type == '钙化';
        }
    });
    diaCalcifychart.source(dv10);
    diaCalcifychart.scale('value', {
      alias: '结节数'
    });
    diaCalcifychart.axis('diameter', {
      label: {
        textStyle: {
          fill: '#aaaaaa'
        }
      },
      tickLine: {
        alignWithLabel: false,
        length: 0
      }
    });
    diaCalcifychart.tooltip({
      share: true
    });
    diaCalcifychart.interval().position('diameter*value').opacity(1).label('value',{
      textStyle:{
        fontSize:14,
        fill:'#aaa'
      }
    }).color(['#00B4D8']).size(30);
    diaCalcifychart.render();

    //形态学钙化直径分布饼图
    document.getElementById('diaCalcifyPie').innerHTML=''
    const dv13 = new DataView();
    dv13.source(dv10).transform({
      type: 'percent',
      field: 'value',
      dimension: 'diameter',
      as: 'percent'
  });
    const diaCalcifyPie = new G2.Chart({
      container: 'diaCalcifyPie',
      forceFit: false,
      height: 250,
      width:400,
      padding:[45,30,45,30],
      animate: false
    });
    diaCalcifyPie.source(dv13, {
      percent: {
        formatter: val => {
          val = (val * 100).toFixed(2) + '%';
          return val;
        }
      }
    });
    diaCalcifyPie.coord('theta', {
      radius:1,
      innerRadius: 0.7
    });
    diaCalcifyPie.tooltip({
      showTitle: false,
      itemTpl: '<dl><dt type="none">结节数:</dt><dt type="none"><span style="background-color:{color};" class="g2-tooltip-marker"></span>{name}: {value}</dt></dl>'
    });
    diaCalcifyPie.intervalStack()
      .position('value')
      .color('diameter',['#ffffcc','#a1dab4','#41b6c4','#2c7fb8','#4a488e'])
      .label('percent', {
        formatter: (val, item) => {
          const showTitle = item.point.value == 0 ?  null:item.point.diameter + ': ' + val 
          return showTitle
        },
        textStyle: {
          fill: '#fff'
        }
      })
      .tooltip('diameter*value', (item, value) => {
        return {
          name: item,
          value: value
        };
      });
    diaCalcifyPie.render();

    //形态学GGO直径分布
    document.getElementById('diaGGO').innerHTML=''
    const diaGGOchart = new G2.Chart({
      container: 'diaGGO',
      forceFit: true,
      height: 250,
      // width:100,
      padding: [30,30,'auto',30]
    });
    const dv11 = new DataView();
    dv11.source(diaDistributionData1).transform({
        type: 'filter',
        callback(row) { // 判断某一行是否保留，默认返回true
          return row.type == '磨玻璃';
        }
    });
    diaGGOchart.source(dv11);
    diaGGOchart.scale('value', {
      alias: '结节数'
    });
    diaGGOchart.axis('diameter', {
      label: {
        textStyle: {
          fill: '#aaaaaa'
        }
      },
      tickLine: {
        alignWithLabel: false,
        length: 0
      }
    });
    diaGGOchart.tooltip({
      share: true
    });
    diaGGOchart.interval().position('diameter*value').opacity(1).label('value',{
      textStyle:{
        fontSize:14,
        fill:'#aaa'
      }
    }).color(['#00B4D8']).size(30);
    diaGGOchart.render();

//形态学GGO直径分布饼图
document.getElementById('diaGGOPie').innerHTML=''
const dv15 = new DataView();
dv15.source(dv11).transform({
    type: 'percent',
    field: 'value',
    dimension: 'diameter',
    as: 'percent'
  });
  const diaGGOPie = new G2.Chart({
    container: 'diaGGOPie',
    forceFit: false,
    height: 250,
    width:400,
    padding:[45,30,45,30],
    animate: false
  });
  diaGGOPie.source(dv15, {
    percent: {
      formatter: val => {
        val = (val * 100).toFixed(2) + '%';
        return val;
      }
    }
  });
  diaGGOPie.coord('theta', {
    radius:1,
    innerRadius: 0.7
  });
  diaGGOPie.tooltip({
    showTitle: false,
    itemTpl: '<dl><dt type="none">结节数:</dt><dt type="none"><span style="background-color:{color};" class="g2-tooltip-marker"></span>{name}: {value}</dt></dl>'
  });
  diaGGOPie.intervalStack()
    .position('value')
    .color('diameter',['#ffffcc','#a1dab4','#41b6c4','#2c7fb8','#4a488e'])
    .label('percent', {
      formatter: (val, item) => {
        const showTitle = item.point.value == 0 ?  null:item.point.diameter + ': ' + val 
        return showTitle
      },
      textStyle: {
        fill: '#fff'
      }
    })
    .tooltip('diameter*percent', (item, percent) => {
      percent = (percent * 100).toFixed(2) + '%';
      return {
        name: item,
        value: percent
      };
    });
  diaGGOPie.render();

    //形态学非分叶直径分布
    document.getElementById('diaNonSublobe').innerHTML=''
    const nonLubD = this.state.nonLobulationDiameterDist
    const diaNonSublobeData1 = JSON.parse(nonLubD)
    const diaNonSublobechart = new G2.Chart({
      container: 'diaNonSublobe',
      forceFit: true,
      height: 250,
      // width:100,
      padding: [30,30,'auto',30]
    });
    diaNonSublobechart.source(diaNonSublobeData1);
    diaNonSublobechart.scale('value', {
      alias: '结节数'
    });
    diaNonSublobechart.axis('type', {
      label: {
        textStyle: {
          fill: '#aaaaaa'
        }
      },
      tickLine: {
        alignWithLabel: false,
        length: 0
      }
    });
    diaNonSublobechart.tooltip({
      share: true
    });
    diaNonSublobechart.interval().position('type*value').opacity(1).label('value',{
      textStyle:{
        fontSize:14,
        fill:'#aaa'
      }
    }).color(['#00B4D8']).size(30);
    diaNonSublobechart.render();

//形态学非分叶直径分布饼图
document.getElementById('diaNonSublobePie').innerHTML=''
const dv19 = new DataView();
  dv19.source(diaNonSublobeData1).transform({
      type: 'percent',
      field: 'value',
      dimension: 'type',
      as: 'percent'
    });
    const diaNonSublobePie = new G2.Chart({
      container: 'diaNonSublobePie',
      forceFit: false,
      height: 250,
      width: 400,
      padding:[45,30,45,30],
      animate: false
    });
    diaNonSublobePie.source(dv19, {
      percent: {
        formatter: val => {
          val = (val * 100).toFixed(2) + '%';
          return val;
        }
      }
    });
    diaNonSublobePie.coord('theta', {
      radius:1,
      innerRadius: 0.7
    });
    diaNonSublobePie.tooltip({
      showTitle: false,
      itemTpl: '<dl><dt type="none">结节数:</dt><dt type="none"><span style="background-color:{color};" class="g2-tooltip-marker"></span>{name}: {value}</dt></dl>'
    });
    diaNonSublobePie.intervalStack()
      .position('value')
      .color('type',['#ffffcc','#a1dab4','#41b6c4','#2c7fb8','#4a488e'])
      .label('percent', {
        formatter: (val, item) => {
          const showTitle = item.point.value == 0 ?   null:item.point.type + ': ' + val 
          return showTitle
        },
        textStyle: {
          fill: '#fff'
        }
      })
      .tooltip('type*value', (item, value) => {
        return {
          name: item,
          value: value
        };
      });
    diaNonSublobePie.render();

  //形态学非毛刺直径分布
  document.getElementById('diaNonGlitch').innerHTML=''
  const nonSpiD = this.state.nonSpiculationDiameterDist
  const diaNonGlitchData1 = JSON.parse(nonSpiD)
  const diaNonGlitchchart = new G2.Chart({
    container: 'diaNonGlitch',
    forceFit: true,
    height: 250,
    // width:100,
    padding: [30,30,'auto',30]
  });
  diaNonGlitchchart.source(diaNonGlitchData1);
  diaNonGlitchchart.scale('value', {
    alias: '结节数'
  });
  diaNonGlitchchart.axis('type', {
    label: {
      textStyle: {
        fill: '#aaaaaa'
      }
    },
    tickLine: {
      alignWithLabel: false,
      length: 0
    }
  });
  diaNonGlitchchart.tooltip({
    share: true
  });
  diaNonGlitchchart.interval().position('type*value').opacity(1).label('value',{
    textStyle:{
      fontSize:14,
      fill:'#aaa'
    }
  }).color(['#00B4D8']).size(30);
  diaNonGlitchchart.render();

//形态学非毛刺直径分布饼图
document.getElementById('diaNonGlitchPie').innerHTML=''
const dv18 = new DataView();
  dv18.source(diaNonGlitchData1).transform({
      type: 'percent',
      field: 'value',
      dimension: 'type',
      as: 'percent'
    });
    const diaNonGlitchPie = new G2.Chart({
      container: 'diaNonGlitchPie',
      forceFit: false,
      height: 250,
      width:400,
      padding:[45,30,45,30],
      animate: false
    });
    diaNonGlitchPie.source(dv18, {
      percent: {
        formatter: val => {
          val = (val * 100).toFixed(2) + '%';
          return val;
        }
      }
    });
    diaNonGlitchPie.coord('theta', {
      radius:1,
      innerRadius: 0.7
    });
    diaNonGlitchPie.tooltip({
      showTitle: false,
      itemTpl: '<dl><dt type="none">结节数:</dt><dt type="none"><span style="background-color:{color};" class="g2-tooltip-marker"></span>{name}: {value}</dt></dl>'
    });
    diaNonGlitchPie.intervalStack()
      .position('value')
      .color('type',['#ffffcc','#a1dab4','#41b6c4','#2c7fb8','#4a488e'])
      .label('percent',{
          formatter: (val, item) => {
            const showTitle = item.point.value == 0 ?  null:item.point.type + ': ' + val 
            return showTitle
        },
        textStyle: {
          fill: '#fff'
        }
        
      })
      .tooltip('type*value', (item, value) => {
        return {
          name: item,
          value: value
        };
      });
    diaNonGlitchPie.render();

  //形态学非钙化直径分布
  document.getElementById('diaNonCalcify').innerHTML=''
  const nonCalD = this.state.nonCalcificationDiameterDist
  const diaNonCalcifyData1 = JSON.parse(nonCalD)
  const diaNonCalcifychart = new G2.Chart({
    container: 'diaNonCalcify',
    forceFit: true,
    height: 250,
    // width:100,
    padding: [30,30,'auto',30]
  });
  diaNonCalcifychart.source(diaNonCalcifyData1);
  diaNonCalcifychart.scale('value', {
    alias: '结节数'
  });
  diaNonCalcifychart.axis('type', {
    label: {
      textStyle: {
        fill: '#aaaaaa'
      }
    },
    tickLine: {
      alignWithLabel: false,
      length: 0
    }
  });
  diaNonCalcifychart.tooltip({
    share: true
  });
  diaNonCalcifychart.interval().position('type*value').opacity(1).label('value',{
    textStyle:{
      fontSize:14,
      fill:'#aaa'
    }
  }).color(['#00B4D8']).size(30);
  diaNonCalcifychart.render();

//形态学非钙化直径分布饼图
document.getElementById('diaNonCalcifyPie').innerHTML=''
const dv17 = new DataView();
  dv17.source(diaNonCalcifyData1).transform({
      type: 'percent',
      field: 'value',
      dimension: 'type',
      as: 'percent'
    });
    const diaNonCalcifyPie = new G2.Chart({
      container: 'diaNonCalcifyPie',
      forceFit: false,
      height: 250,
      width:400,
      padding:[45,30,45,30],
      animate: false
    });
    diaNonCalcifyPie.source(dv17, {
      percent: {
        formatter: val => {
          val = (val * 100).toFixed(2) + '%';
          return val;
        }
      }
    });
    diaNonCalcifyPie.coord('theta', {
      radius:1,
      innerRadius: 0.7
    });
    diaNonCalcifyPie.tooltip({
      showTitle: false,
      itemTpl: '<dl><dt type="none">结节数:</dt><dt type="none"><span style="background-color:{color};" class="g2-tooltip-marker"></span>{name}: {value}</dt></dl>'
    });
    diaNonCalcifyPie.intervalStack()
      .position('value')
      .color('type',['#ffffcc','#a1dab4','#41b6c4','#2c7fb8','#4a488e'])
      .label('percent', {
        formatter: (val, item) => {
          return item.point.type + ': ' + val;
        },
        textStyle: {
          fill: '#fff'
        }
      })
      .tooltip('type*value', (item, value) => {
        return {
          name: item,
          value: value
        };
      });
    diaNonCalcifyPie.render();


  //形态学实性直径分布
  document.getElementById('diaNonGGO').innerHTML=''
  const nonGGOD = this.state.nonTextureDiameterDist
  const diaNonGGOData1 = JSON.parse(nonGGOD)
  const diaNonGGOchart = new G2.Chart({
    container: 'diaNonGGO',
    forceFit: true,
    height: 250,
    // width:100,
    padding: [30,30,'auto',30]
  });
  diaNonGGOchart.source(diaNonGGOData1);
  diaNonGGOchart.scale('value', {
    range:[0,1],
    alias: '结节数'
  });
  diaNonGGOchart.axis('type', {
    label: {
      textStyle: {
        fill: '#aaaaaa'
      }
    },
    tickLine: {
      alignWithLabel: false,
      length: 0
    }
  });
  diaNonGGOchart.tooltip({
    share: true
  });
  diaNonGGOchart.interval().position('type*value').opacity(1).label('value',{
    textStyle:{
      fontSize:14,
      fill:'#aaa'
    }
  }).color(['#00B4D8']).size(30);
  diaNonGGOchart.render();

//形态学实性直径分布饼图
document.getElementById('diaNonGGOPie').innerHTML=''
const dv16 = new DataView();
  dv16.source(diaNonGGOData1).transform({
      type: 'percent',
      field: 'value',
      dimension: 'type',
      as: 'percent'
    });
    const diaNonGGOPie = new G2.Chart({
      container: 'diaNonGGOPie',
      forceFit: false,
      height: 250,
      width:400,
      padding:[45,30,45,30],
      animate: false
    });
    diaNonGGOPie.source(dv16, {
      percent: {
        formatter: val => {
          val = (val * 100).toFixed(2) + '%';
          return val;
        }
      }
    });
    diaNonGGOPie.coord('theta', {
      radius:1,
      innerRadius: 0.7
    });
    diaNonGGOPie.tooltip({
      showTitle: false,
      itemTpl: '<dl><dt type="none">结节数:</dt><dt type="none"><span style="background-color:{color};" class="g2-tooltip-marker"></span>{name}: {value}</dt></dl>'
    });
    diaNonGGOPie.intervalStack()
      .position('value')
      .color('type',['#ffffcc','#a1dab4','#41b6c4','#2c7fb8','#4a488e'])
      .label('percent', {
        formatter: (val, item) => {
            const showTitle = item.point.value == 0 ?  null:item.point.type + ': ' + val 
            return showTitle
        },
        textStyle: {
          fill: '#fff'
        }
      })
      .tooltip('type*value', (item, value) => {
        return {
          name: item,
          value: value
        };
      });
    diaNonGGOPie.render();

  //毛刺良恶性分布
  document.getElementById('maliGlitch').innerHTML=''
  const spiMaliD = this.state.spiculationMalDist
  const maliGlitchData1 = JSON.parse(spiMaliD)
  const dv1 = new DataView();
  dv1.source(maliGlitchData1).transform({
      type: 'percent',
      field: 'value',
      dimension: 'type',
      as: 'percent'
  });
  const maliGlitchChart = new G2.Chart({
      container: 'maliGlitch',
      forceFit: true,
      height: 200,
      padding: 0,
      animate:true
  });
  maliGlitchChart.coord('theta', {
      radius: 0.75,
      innerRadius: 0.5
    });
  maliGlitchChart.source(dv1,{
      percent: {
      formatter: function formatter(val) {
          val = (val * 100).toFixed(1) + '%';
          return val;
      }
  }
  });
  maliGlitchChart.legend(false);
  maliGlitchChart.tooltip({
      showTitle: false,
      itemTpl: '<dl><dt type="none">结节数:</dt><dt type="none"><span style="background-color:{color};" class="g2-tooltip-marker"></span>{name}: {value}</dt></dl>'
  });
  maliGlitchChart.intervalStack().position('percent').color('type',['#a1dab4','#2c7fb8']).label('percent', {
      offset: -20,
      autoRotate: false,
      textStyle: {
      textAlign: 'center',
      shadowBlur: 2,
      shadowColor: 'rgba(0, 0, 0, .45)',
      fill:'#fff'
      },
      formatter: function formatter(val, item) {
          return item.point.type +':\n' + val;
      }
  }).tooltip('type*value', function(item, value) {
      return {
      name: item,
      value: value
      };
  });
  maliGlitchChart.render();


  //分叶良恶性分布
  document.getElementById('maliSublobe').innerHTML=''
  const lobeMaliD = this.state.lobulationMalDist
  const maliSublobeData1 = JSON.parse(lobeMaliD)
  const dv7 = new DataView();
  dv7.source(maliSublobeData1).transform({
      type: 'percent',
      field: 'value',
      dimension: 'type',
      as: 'percent'
  });
  const maliSublobeChart = new G2.Chart({ //性别可视化
      container: 'maliSublobe',
      forceFit: true,
      height: 200,
      padding: 0,
      animate:true
  });
  maliSublobeChart.coord('theta', {
      radius: 0.75,
      innerRadius: 0.5
    });
  maliSublobeChart.source(dv7,{
      percent: {
      formatter: function formatter(val) {
          val = (val * 100).toFixed(1) + '%';
          return val;
      }
  }
  });
  maliSublobeChart.legend(false);
  maliSublobeChart.tooltip({
      showTitle: false,
      itemTpl: '<dl><dt type="none">结节数:</dt><dt type="none"><span style="background-color:{color};" class="g2-tooltip-marker"></span>{name}: {value}</dt></dl>'
  });
  maliSublobeChart.intervalStack().position('percent').color('type',['#a1dab4','#2c7fb8']).label('percent', {
      offset: -20,
      autoRotate: false,
      textStyle: {
      textAlign: 'center',
      shadowBlur: 2,
      shadowColor: 'rgba(0, 0, 0, .45)',
      fill:'#fff'
      },
      formatter: function formatter(val, item) {
          return item.point.type +':\n' + val;
      }
  }).tooltip('type*value', function(item, value) {
      // percent = (percent * 100).toFixed(1)+ '%';
      return {
      name: item,
      value: value
      };
  });
  maliSublobeChart.render();

  //钙化良恶性分布
  document.getElementById('maliCalcify').innerHTML=''
  const maliCalD = this.state.calcificationMalDist
  const maliCalcifyData1 = JSON.parse(maliCalD)
  const dv3 = new DataView();
  dv3.source(maliCalcifyData1).transform({
      type: 'percent',
      field: 'value',
      dimension: 'type',
      as: 'percent'
  });
  const maliCalcifyChart = new G2.Chart({ //性别可视化
      container: 'maliCalcify',
      forceFit: true,
      height: 200,
      padding: 0,
      animate:true
  });
  maliCalcifyChart.coord('theta', {
      radius: 0.75,
      innerRadius: 0.5
    });
  maliCalcifyChart.source(dv3,{
      percent: {
      formatter: function formatter(val) {
          val = (val * 100).toFixed(1) + '%';
          return val;
      }
  }
  });
  maliCalcifyChart.legend(false);
  maliCalcifyChart.tooltip({
      showTitle: false,
      itemTpl: '<dl><dt type="none">结节数:</dt><dt type="none"><span style="background-color:{color};" class="g2-tooltip-marker"></span>{name}: {value}</dt></dl>'
  });
  //['#4682B4','#20B2AA']
  maliCalcifyChart.intervalStack().position('percent').color('type',['#a1dab4','#2c7fb8']).label('percent', {
      offset: -20,
      autoRotate: false,
      textStyle: {
      textAlign: 'center',
      shadowBlur: 2,
      shadowColor: 'rgba(0, 0, 0, .45)',
      fill:'#fff'
      },
      formatter: function formatter(val, item) {
          return item.point.type +':\n' + val;
      }
  }).tooltip('type*value', function(item, value) {
      // percent = (percent * 100).toFixed(1)+ '%';
      return {
      name: item,
      value: value
      };
  });
  maliCalcifyChart.render();

  //GGO良恶性分布
  document.getElementById('maliGGO').innerHTML=''
  const textMaliD = this.state.textureMalDist
  const maliGGOData1 = JSON.parse(textMaliD)
  const dv5 = new DataView();
  dv5.source(maliGGOData1).transform({
      type: 'percent',
      field: 'value',
      dimension: 'type',
      as: 'percent'
  });
  const maliGGOChart = new G2.Chart({ 
      container: 'maliGGO',
      forceFit: true,
      height: 200,
      padding: 0,
      animate:true
  });
  maliGGOChart.coord('theta', {
      radius: 0.75,
      innerRadius: 0.5
    });
  maliGGOChart.source(dv5,{
      percent: {
      formatter: function formatter(val) {
          val = (val * 100).toFixed(1) + '%';
          return val;
      }
  }
  });
  maliGGOChart.legend(false);
  maliGGOChart.tooltip({
      showTitle: false,
      itemTpl: '<dl><dt type="none">结节数:</dt><dt type="none"><span style="background-color:{color};" class="g2-tooltip-marker"></span>{name}: {value}</dt></dl>'
  });
  maliGGOChart.intervalStack().position('percent').color('type',['#a1dab4','#2c7fb8']).label('percent', {
      offset: -20,
      autoRotate: false,
      textStyle: {
      textAlign: 'center',
      shadowBlur: 2,
      shadowColor: 'rgba(0, 0, 0, .45)',
      fill:'#fff'
      },
      formatter: function formatter(val, item) {
          return item.point.type +':\n' + val;
      }
  }).tooltip('type*value', function(item, value) {
      // percent = (percent * 100).toFixed(1)+ '%';
      return {
      name: item,
      value: value
      };
  });
  maliGGOChart.render();
    }
    
    componentDidUpdate(prevProps, prevState) {
      if (prevState.totalMalDist !== this.state.totalMalDist) {
          this.visualize()
          document.getElementById('ageTotal').style.display='none'
          document.getElementById('diaTotal').style.display='none'
          document.getElementById('diabt1').style.display='none'
          document.getElementById('agebt1').style.display='none'
          document.getElementById('glitchbt2').style.display='none'
          document.getElementById('diaGlitchPie').style.display='none'
          document.getElementById('diaSublobePie').style.display='none'
          document.getElementById('sublobebt2').style.display='none'
          document.getElementById('diaCalcifyPie').style.display='none'
          document.getElementById('calcifybt2').style.display='none'
          document.getElementById('diaGGOPie').style.display='none'
          document.getElementById('ggobt2').style.display='none'
          document.getElementById('diaNonGlitchPie').style.display='none'
          document.getElementById('nonglitchbt2').style.display='none'
          document.getElementById('diaNonSublobePie').style.display='none'
          document.getElementById('nonsublobebt2').style.display='none'
          document.getElementById('diaNonCalcifyPie').style.display='none'
          document.getElementById('noncalcifybt2').style.display='none'
          document.getElementById('diaNonGGOPie').style.display='none'
          document.getElementById('nonggobt2').style.display='none'
      }
  }
    componentDidMount() {
        this.visualize()
        document.getElementById('ageTotal').style.display='none'
        document.getElementById('diaTotal').style.display='none'
        document.getElementById('diabt1').style.display='none'
        document.getElementById('agebt1').style.display='none'
        document.getElementById('glitchbt2').style.display='none'
        document.getElementById('diaGlitchPie').style.display='none'
        document.getElementById('diaSublobePie').style.display='none'
        document.getElementById('sublobebt2').style.display='none'
        document.getElementById('diaCalcifyPie').style.display='none'
        document.getElementById('calcifybt2').style.display='none'
        document.getElementById('diaGGOPie').style.display='none'
        document.getElementById('ggobt2').style.display='none'
        document.getElementById('diaNonGlitchPie').style.display='none'
        document.getElementById('nonglitchbt2').style.display='none'
        document.getElementById('diaNonSublobePie').style.display='none'
        document.getElementById('nonsublobebt2').style.display='none'
        document.getElementById('diaNonCalcifyPie').style.display='none'
        document.getElementById('noncalcifybt2').style.display='none'
        document.getElementById('diaNonGGOPie').style.display='none'
        document.getElementById('nonggobt2').style.display='none'  
    }
    
    render() {
        return (
            <div class='VisualCanvas'>
                <div class='total'>
                  <div class='totalcontnt'>
                    <Grid centered>
                      <Grid.Row>
                        <Grid.Column width={4} className='totalbg'>
                          <div class='tit'>
                            <h2 class='tit2'>良恶性分布</h2>
                          </div>
                          <div id='benmali'></div>
                        </Grid.Column>
                        <Grid.Column width={5} className='totalbg'>
                          <div class='tit'>
                            <h2 class='tit2'>总体结节直径分布</h2>
                            <div class='tit1' id='diabt1'><Button icon onClick={this.typeChange} value='diabar' circular basic color='blue' size='tiny'><Icon name='chart pie'></Icon></Button></div>
                            <div class='tit1' id='diabt2'><Button icon onClick={this.typeChange} value='diapie' circular basic color='blue' size='tiny'><Icon name='chart bar outline'></Icon></Button></div>
                          </div>
                          <div id='diaTotal'></div>
                          <div id='diaTotal2'></div>
                        </Grid.Column>
                        <Grid.Column width={5} className='totalbg'>
                          <div class='tit'>
                            <h2 class='tit2'>总体年龄占比</h2>
                            <div class='tit1' id='agebt1'><Button icon onClick={this.typeChange} value='agebar' circular basic color='blue' size='tiny'><Icon name='chart pie'></Icon></Button></div>
                            <div class='tit1' id='agebt2'><Button icon onClick={this.typeChange} value='agepie' circular basic color='blue' size='tiny'><Icon name='chart bar outline'></Icon></Button></div>
                          </div>
                          <div id='ageTotal'></div>
                          <div id='ageTotal2'></div>
                        </Grid.Column>
                      </Grid.Row>
                    </Grid>
                  </div>
                </div>

                <div class='iconography'>
                  <div class='iconContnt'>
                    <Grid centered>
                      <Grid.Row>
                        <Grid.Column width={4}>
                          <div class='tit'>
                            <h2 class='tit2'>毛刺直径分布</h2>  
                            <div class='tit3' id='glitchbt1'><Button icon onClick={this.typeChange} value='glitchbar' circular basic color='blue' size='tiny'><Icon name='chart pie'></Icon></Button></div>
                            <div class='tit3' id='glitchbt2'><Button icon onClick={this.typeChange} value='glitchpie' circular basic color='blue' size='tiny'><Icon name='chart bar outline'></Icon></Button></div>
                          </div>
                          <div id='diaGlitch'></div>
                          <div id='diaGlitchPie'></div>
                        </Grid.Column>
                        <Grid.Column width={4}>
                          <div class='tit'>
                            <h2 class='tit2'>分叶直径分布</h2>
                            <div class='tit3' id='sublobebt1'><Button icon onClick={this.typeChange} value='sublobebar' circular basic color='blue' size='tiny'><Icon name='chart pie'></Icon></Button></div>
                            <div class='tit3' id='sublobebt2'><Button icon onClick={this.typeChange} value='sublobepie' circular basic color='blue' size='tiny'><Icon name='chart bar outline'></Icon></Button></div>
                          </div>
                          <div id='diaSublobe'></div>
                          <div id='diaSublobePie'></div>
                        </Grid.Column>
                        <Grid.Column width={4}>
                          <div class='tit'>
                            <h2 class='tit2'>钙化直径分布</h2>
                            <div class='tit3' id='calcifybt1'><Button icon onClick={this.typeChange} value='calcifybar' circular basic color='blue' size='tiny'><Icon name='chart pie'></Icon></Button></div>
                            <div class='tit3' id='calcifybt2'><Button icon onClick={this.typeChange} value='calcifypie' circular basic color='blue' size='tiny'><Icon name='chart bar outline'></Icon></Button></div>
                          </div>
                          <div id='diaCalcify'></div>
                          <div id='diaCalcifyPie'></div>
                        </Grid.Column>
                        <Grid.Column width={4}>
                          <div class='tit'>
                            <h2 class='tit2'>磨玻璃直径分布</h2>
                            <div class='tit3' id='ggobt1'><Button icon onClick={this.typeChange} value='ggobar' circular basic color='blue' size='tiny'><Icon name='chart pie'></Icon></Button></div>
                            <div class='tit3' id='ggobt2'><Button icon onClick={this.typeChange} value='ggopie' circular basic color='blue' size='tiny'><Icon name='chart bar outline'></Icon></Button></div>
                          </div>
                          <div id='diaGGO'></div>
                          <div id='diaGGOPie'></div>
                        </Grid.Column>
                      </Grid.Row>
                      <Grid.Row>
                        <Grid.Column width={4}>
                          <div class='tit'>
                            <h2 class='tit2'>非毛刺直径分布</h2>  
                            <div class='tit3' id='nonglitchbt1'><Button icon onClick={this.typeChange} value='nonglitchbar' circular basic color='blue' size='tiny'><Icon name='chart pie'></Icon></Button></div>
                            <div class='tit3' id='nonglitchbt2'><Button icon onClick={this.typeChange} value='nonglitchpie' circular basic color='blue' size='tiny'><Icon name='chart bar outline'></Icon></Button></div>
                          </div>
                            <div id='diaNonGlitch'></div>
                            <div id='diaNonGlitchPie'></div>
                          </Grid.Column>
                          <Grid.Column width={4}>
                            <div class='tit'>
                              <h2 class='tit2'>非分叶直径分布</h2>
                              <div class='tit3' id='nonsublobebt1'><Button icon onClick={this.typeChange} value='nonsublobebar' circular basic color='blue' size='tiny'><Icon name='chart pie'></Icon></Button></div>
                              <div class='tit3' id='nonsublobebt2'><Button icon onClick={this.typeChange} value='nonsublobepie' circular basic color='blue' size='tiny'><Icon name='chart bar outline'></Icon></Button></div>
                            </div>
                            <div id='diaNonSublobe'></div>
                            <div id='diaNonSublobePie'></div>
                          </Grid.Column>
                          <Grid.Column width={4}>
                            <div class='tit'>
                              <h2 class='tit2'>非钙化直径分布</h2>
                              <div class='tit3' id='noncalcifybt1'><Button icon onClick={this.typeChange} value='noncalcifybar' circular basic color='blue' size='tiny'><Icon name='chart pie'></Icon></Button></div>
                              <div class='tit3' id='noncalcifybt2'><Button icon onClick={this.typeChange} value='noncalcifypie' circular basic color='blue' size='tiny'><Icon name='chart bar outline'></Icon></Button></div>
                            </div>
                            <div id='diaNonCalcify'></div>
                            <div id='diaNonCalcifyPie'></div>
                          </Grid.Column>
                          <Grid.Column width={4}>
                            <div class='tit'>
                              <h2 class='tit2'>实性直径分布</h2>
                              <div class='tit3' id='nonggobt1'><Button icon onClick={this.typeChange} value='nonggobar' circular basic color='blue' size='tiny'><Icon name='chart pie'></Icon></Button></div>
                              <div class='tit3' id='nonggobt2'><Button icon onClick={this.typeChange} value='nonggopie' circular basic color='blue' size='tiny'><Icon name='chart bar outline'></Icon></Button></div>
                            </div>
                            <div id='diaNonGGO'></div>
                            <div id='diaNonGGOPie'></div>
                          </Grid.Column>
                      </Grid.Row>
                      <Grid.Row>
                        <Grid.Column width={4}>
                          <h2 class='tit2'>毛刺良恶性分布</h2>
                          <div id='maliGlitch'></div>
                        </Grid.Column>
                        <Grid.Column width={4}>
                          <h2 class='tit2'>分叶良恶性分布</h2>
                          <div id='maliSublobe'></div>
                        </Grid.Column>
                        <Grid.Column width={4}>
                          <h2 class='tit2'>钙化良恶性分布</h2>
                          <div id='maliCalcify'></div>
                        </Grid.Column>
                        <Grid.Column width={4}>
                          <h2 class='tit2'>磨玻璃良恶性分布</h2>
                          <div id='maliGGO'></div>
                        </Grid.Column>
                      </Grid.Row>
                    </Grid>
                  </div>
                </div>

            </div>
        )
    }
    typeChange(e,{value}){
      this.setState({ value:value })
      if(value=='diabar'){
        document.getElementById('diaTotal').style.display='none'
        document.getElementById('diaTotal2').style.display='block'
        document.getElementById('diabt1').style.display='none'
        document.getElementById('diabt2').style={btstyle}
      }
      else if(value=='diapie'){
        document.getElementById('diaTotal').style.display='block'
        document.getElementById('diaTotal2').style.display='none'
        document.getElementById('diabt1').style={btstyle}
        document.getElementById('diabt2').style.display='none'
      }
      else if(value=='agebar'){
        document.getElementById('ageTotal').style.display='none'
        document.getElementById('ageTotal2').style.display='block'
        document.getElementById('agebt1').style.display='none'
        document.getElementById('agebt2').style={btstyle}
      }
      else if(value=='agepie'){
        document.getElementById('ageTotal').style.display='block'
        document.getElementById('ageTotal2').style.display='none'
        document.getElementById('agebt1').style={btstyle}
        document.getElementById('agebt2').style.display='none'
      }
      else if(value=='glitchbar'){
        document.getElementById('diaGlitch').style.display='none'
        document.getElementById('diaGlitchPie').style.display='block'
        document.getElementById('glitchbt1').style.display='none'
        document.getElementById('glitchbt2').style={btstyle}
      }
      else if(value=='glitchpie'){
        document.getElementById('diaGlitch').style.display='block'
        document.getElementById('diaGlitchPie').style.display='none'
        document.getElementById('glitchbt1').style={btstyle}
        document.getElementById('glitchbt2').style.display='none'
      }
      else if(value=='sublobebar'){
        document.getElementById('diaSublobe').style.display='none'
        document.getElementById('diaSublobePie').style.display='block'
        document.getElementById('sublobebt1').style.display='none'
        document.getElementById('sublobebt2').style={btstyle}
      }
      else if(value=='sublobepie'){
        document.getElementById('diaSublobe').style.display='block'
        document.getElementById('diaSublobePie').style.display='none'
        document.getElementById('sublobebt1').style={btstyle}
        document.getElementById('sublobebt2').style.display='none'
      }
      else if(value=='calcifybar'){
        document.getElementById('diaCalcify').style.display='none'
        document.getElementById('diaCalcifyPie').style.display='block'
        document.getElementById('calcifybt1').style.display='none'
        document.getElementById('calcifybt2').style={btstyle}
      }
      else if(value=='calcifypie'){
        document.getElementById('diaCalcify').style.display='block'
        document.getElementById('diaCalcifyPie').style.display='none'
        document.getElementById('calcifybt1').style={btstyle}
        document.getElementById('calcifybt2').style.display='none'
      }
      else if(value=='ggobar'){
        document.getElementById('diaGGO').style.display='none'
        document.getElementById('diaGGOPie').style.display='block'
        document.getElementById('ggobt1').style.display='none'
        document.getElementById('ggobt2').style={btstyle}
      }
      else if(value=='ggopie'){
        document.getElementById('diaGGO').style.display='block'
        document.getElementById('diaGGOPie').style.display='none'
        document.getElementById('ggobt1').style={btstyle}
        document.getElementById('ggobt2').style.display='none'
      }
      //非
      else if(value=='nonglitchbar'){
        document.getElementById('diaNonGlitch').style.display='none'
        document.getElementById('diaNonGlitchPie').style.display='block'
        document.getElementById('nonglitchbt1').style.display='none'
        document.getElementById('nonglitchbt2').style={btstyle}
      }
      else if(value=='nonglitchpie'){
        document.getElementById('diaNonGlitch').style.display='block'
        document.getElementById('diaNonGlitchPie').style.display='none'
        document.getElementById('nonglitchbt1').style={btstyle}
        document.getElementById('nonglitchbt2').style.display='none'
      }
      else if(value=='nonsublobebar'){
        document.getElementById('diaNonSublobe').style.display='none'
        document.getElementById('diaNonSublobePie').style.display='block'
        document.getElementById('nonsublobebt1').style.display='none'
        document.getElementById('nonsublobebt2').style={btstyle}
      }
      else if(value=='nonsublobepie'){
        document.getElementById('diaNonSublobe').style.display='block'
        document.getElementById('diaNonSublobePie').style.display='none'
        document.getElementById('nonsublobebt1').style={btstyle}
        document.getElementById('nonsublobebt2').style.display='none'
      }
      else if(value=='noncalcifybar'){
        document.getElementById('diaNonCalcify').style.display='none'
        document.getElementById('diaNonCalcifyPie').style.display='block'
        document.getElementById('noncalcifybt1').style.display='none'
        document.getElementById('noncalcifybt2').style={btstyle}
      }
      else if(value=='noncalcifypie'){
        document.getElementById('diaNonCalcify').style.display='block'
        document.getElementById('diaNonCalcifyPie').style.display='none'
        document.getElementById('noncalcifybt1').style={btstyle}
        document.getElementById('noncalcifybt2').style.display='none'
      }
      else if(value=='nonggobar'){
        document.getElementById('diaNonGGO').style.display='none'
        document.getElementById('diaNonGGOPie').style.display='block'
        document.getElementById('nonggobt1').style.display='none'
        document.getElementById('nonggobt2').style={btstyle}
      }
      else if(value=='nonggopie'){
        document.getElementById('diaNonGGO').style.display='block'
        document.getElementById('diaNonGGOPie').style.display='none'
        document.getElementById('nonggobt1').style={btstyle}
        document.getElementById('nonggobt2').style.display='none'
      }
  }
}

export default DataCockpit
