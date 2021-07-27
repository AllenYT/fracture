import React, { Component, useState } from "react";
import {
  Form,
  Radio,
  Grid,
  Image,
  Button,
  Icon,
  Header,
  Card,
  Progress,
} from "semantic-ui-react";
// import { Progress } from 'antd'
import G2 from "@antv/g2";
import { DataSet } from "@antv/data-set";
import "../css/DataCockpit.css";
import axios from "axios";
import { withRouter } from "react-router-dom";
import LowerAuth from "../components/LowerAuth";
import { loadOptions } from "@babel/core";

const _DataSet = DataSet,
  DataView = _DataSet.DataView;
const _G = G2,
  Shape = _G.Shape;

const btstyle = "float:right;";

const style = {
  textAlign: "center",
  marginTop: "300px",
};

var ageTotalData = [
  {
    //总体年龄分布
    type: "未知",
    value: 10,
  },
  {
    type: "35 岁以下",
    value: 5,
  },
  {
    type: "36-45 岁",
    value: 20,
  },
  {
    type: "46-55 岁",
    value: 45,
  },
  {
    type: "56-60 岁",
    value: 55,
  },
  {
    type: "61-65 岁",
    value: 214,
  },
  {
    type: "65 岁以上",
    value: 185,
  },
];

var diaTotalData = [
  {
    //总体结节直径分布
    type: "0-3 mm",
    value: 10,
  },
  {
    type: "3-5 mm",
    value: 5,
  },
  {
    type: "5-8 mm",
    value: 20,
  },
  {
    type: "8-30 mm",
    value: 45,
  },
  {
    type: ">30 mm",
    value: 55,
  },
];

var benmaliData = [
  {
    //良恶性分布
    type: "良性",
    value: 10,
  },
  {
    type: "恶性",
    value: 50,
  },
];

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
var diaDistributionData = [
  {
    type: "毛刺",
    diameter: "0-3mm",
    value: 30,
  },
  {
    type: "分叶",
    diameter: "0-3mm",
    value: 35,
  },
  {
    type: "钙化",
    diameter: "0-3mm",
    value: 28,
  },
  {
    type: "磨玻璃",
    diameter: "0-3mm",
    value: 21,
  },
  {
    type: "毛刺",
    diameter: "3-5mm",
    value: 40,
  },
  {
    type: "分叶",
    diameter: "3-5mm",
    value: 65,
  },
  {
    type: "钙化",
    diameter: "3-5mm",
    value: 47,
  },
  {
    type: "磨玻璃",
    diameter: "3-5mm",
    value: 66,
  },
  {
    type: "毛刺",
    diameter: "5-8mm",
    value: 23,
  },
  {
    type: "分叶",
    diameter: "5-8mm",
    value: 18,
  },
  {
    type: "钙化",
    diameter: "5-8mm",
    value: 20,
  },
  {
    type: "磨玻璃",
    diameter: "5-8mm",
    value: 10,
  },
  {
    type: "毛刺",
    diameter: "8-30mm",
    value: 35,
  },
  {
    type: "分叶",
    diameter: "8-30mm",
    value: 30,
  },
  {
    type: "钙化",
    diameter: "8-30mm",
    value: 25,
  },
  {
    type: "磨玻璃",
    diameter: "8-30mm",
    value: 21,
  },
  {
    type: "毛刺",
    diameter: ">=30mm",
    value: 35,
  },
  {
    type: "分叶",
    diameter: ">=30mm",
    value: 30,
  },
  {
    type: "钙化",
    diameter: ">=30mm",
    value: 25,
  },
  {
    type: "磨玻璃",
    diameter: ">=30mm",
    value: 2,
  },
];

var diaNonGlitchData = [
  {
    //非毛刺直径分布
    type: "0-3 mm",
    value: 10,
  },
  {
    type: "3-5 mm",
    value: 5,
  },
  {
    type: "5-8 mm",
    value: 20,
  },
  {
    type: "8-30 mm",
    value: 45,
  },
  {
    type: ">30 mm",
    value: 55,
  },
];

var diaNonSublobeData = [
  {
    //非分叶直径分布
    type: "0-3 mm",
    value: 10,
  },
  {
    type: "3-5 mm",
    value: 5,
  },
  {
    type: "5-8 mm",
    value: 20,
  },
  {
    type: "8-30 mm",
    value: 45,
  },
  {
    type: ">30 mm",
    value: 55,
  },
];

var diaNonCalcifyData = [
  {
    //非钙化直径分布
    type: "0-3 mm",
    value: 10,
  },
  {
    type: "3-5 mm",
    value: 5,
  },
  {
    type: "5-8 mm",
    value: 20,
  },
  {
    type: "8-30 mm",
    value: 45,
  },
  {
    type: ">30 mm",
    value: 55,
  },
];

var diaNonGGOData = [
  {
    //实性直径分布
    type: "0-3 mm",
    value: 10,
  },
  {
    type: "3-5 mm",
    value: 5,
  },
  {
    type: "5-8 mm",
    value: 20,
  },
  {
    type: "8-30 mm",
    value: 45,
  },
  {
    type: ">30 mm",
    value: 55,
  },
];

//毛刺良恶性分布
const maliGlitchData = [
  { type: "良性", value: 40 },
  { type: "恶性", value: 21 },
];

//分叶良恶性分布
const maliSublobeData = [
  { type: "良性", value: 40 },
  { type: "恶性", value: 21 },
];

//钙化良恶性分布
const maliCalcifyData = [
  { type: "良性", value: 40 },
  { type: "恶性", value: 21 },
];

//GGO良恶性分布
const maliGGOData = [
  { type: "良性", value: 40 },
  { type: "恶性", value: 21 },
];
//胸膜凹陷征 pleural indenlation sign
const pleuralData = [
  { type: "胸膜凹陷", value: 10 },
  { type: "非胸膜凹陷", value: 5 },
];

//空洞征
const cavity = [
  { type: "空洞", value: 10 },
  { type: "非空洞", value: 15 },
];

//血管集束 Vessel convergence sign
const vcs = [
  { type: "血管集束", value: 10 },
  { type: "非血管集束", value: 15 },
];

//空泡
const vacuole = [
  { type: "空泡", value: 10 },
  { type: "非空泡", value: 15 },
];

const sexData = { female: 6, male: 1 };

class DataCockpit extends Component {
  constructor(props) {
    super(props);
    this.state = {
      totalPatients:
        localStorage.getItem("totalPatients") === null
          ? 0
          : localStorage.getItem("totalPatients"),
      totalRecords:
        localStorage.getItem("totalRecords") === null
          ? 0
          : localStorage.getItem("totalRecords"),
      modelProgress:
        localStorage.getItem("modelProgress") === null
          ? 0
          : localStorage.getItem("modelProgress"),
      sexlist:
        localStorage.getItem("sexData") === null
          ? JSON.stringify(sexData)
          : localStorage.getItem("sexData"),
      BCRecords:
        localStorage.getItem("BCRecords") === null
          ? 0
          : localStorage.getItem("BCRecords"),
      HCRecords:
        localStorage.getItem("HCRecords") === null
          ? 0
          : localStorage.getItem("HCRecords"),
      totalMalDist:
        localStorage.getItem("totalMalDist") === null
          ? JSON.stringify(benmaliData)
          : localStorage.getItem("totalMalDist"),
      totalDiameterDist:
        localStorage.getItem("totalDiameterDist") === null
          ? JSON.stringify(diaTotalData)
          : localStorage.getItem("totalDiameterDist"),
      characterDiameterDist:
        localStorage.getItem("characterDiameterDist") === null
          ? JSON.stringify(diaDistributionData)
          : localStorage.getItem("characterDiameterDist"),
      nonSpiculationDiameterDist:
        localStorage.getItem("nonSpiculationDiameterDist") === null
          ? JSON.stringify(diaNonGlitchData)
          : localStorage.getItem("nonSpiculationDiameterDist"),
      nonCalcificationDiameterDist:
        localStorage.getItem("nonCalcificationDiameterDist") === null
          ? JSON.stringify(diaNonCalcifyData)
          : localStorage.getItem("nonCalcificationDiameterDist"),
      totalAgeDist:
        localStorage.getItem("totalAgeDist") === null
          ? JSON.stringify(ageTotalData)
          : localStorage.getItem("totalAgeDist"),
      nonLobulationDiameterDist:
        localStorage.getItem("nonLobulationDiameterDist") === null
          ? JSON.stringify(diaNonSublobeData)
          : localStorage.getItem("nonLobulationDiameterDist"),
      nonTextureDiameterDist:
        localStorage.getItem("nonTextureDiameterDist") === null
          ? JSON.stringify(diaNonGGOData)
          : localStorage.getItem("nonTextureDiameterDist"),
      spiculationMalDist:
        localStorage.getItem("spiculationMalDist") === null
          ? JSON.stringify(maliGlitchData)
          : localStorage.getItem("spiculationMalDist"),
      calcificationMalDist:
        localStorage.getItem("calcificationMalDist") === null
          ? JSON.stringify(maliCalcifyData)
          : localStorage.getItem("calcificationMalDist"),
      lobulationMalDist:
        localStorage.getItem("lobulationMalDist") === null
          ? JSON.stringify(maliSublobeData)
          : localStorage.getItem("lobulationMalDist"),
      textureMalDist:
        localStorage.getItem("textureMalDist") === null
          ? JSON.stringify(maliGGOData)
          : localStorage.getItem("textureMalDist"),
      pleuralDist:
        localStorage.getItem("pleuralDist") === null
          ? JSON.stringify(pleuralData)
          : localStorage.getItem("pleuralDist"),
      cavityDist:
        localStorage.getItem("cavityDist") === null
          ? JSON.stringify(cavity)
          : localStorage.getItem("cavityDist"),
      vcsDist:
        localStorage.getItem("vcsDist") === null
          ? JSON.stringify(vcs)
          : localStorage.getItem("vcsDist"),
      vacuoleDist:
        localStorage.getItem("vacuoleDist") === null
          ? JSON.stringify(vacuole)
          : localStorage.getItem("vacuoleDist"),
    };
    this.visualize = this.visualize.bind(this);
    this.typeChange = this.typeChange.bind(this);
    // this.config = JSON.parse(localStorage.getItem('config'))
  }
  async componentWillMount() {
    const configPromise = new Promise((resolve, reject) => {
      axios.get(process.env.PUBLIC_URL + "/config.json").then((res) => {
        const config = res.data;
        console.log("config", config);
        localStorage.setItem("config", JSON.stringify(config));
        resolve(config);
      }, reject);
    });
    const config = await configPromise;
    this.config = config;

    Promise.all([
      axios.get(this.config.user.get_statistics),
      axios.get(this.config.user.get_sexData),
      axios.get(this.config.nodule.totalMalDist),
      axios.get(this.config.nodule.totalDiameterDist),
      axios.get(this.config.nodule.characterDiameterDist),
      axios.get(this.config.nodule.nonSpiculationDiameterDist),
      axios.get(this.config.nodule.nonCalcificationDiameterDist),
      axios.get(this.config.nodule.totalAgeDist),
      axios.get(this.config.nodule.nonLobulationDiameterDist),
      axios.get(this.config.nodule.nonTextureDiameterDist),
      axios.get(this.config.nodule.spiculationMalDist),
      axios.get(this.config.nodule.calcificationMalDist),
      axios.get(this.config.nodule.lobulationMalDist),
      axios.get(this.config.nodule.textureMalDist),
      axios.get(this.config.nodule.pinMalDist),
      axios.get(this.config.nodule.cavMalDist),
      axios.get(this.config.nodule.vssMalDist),
      axios.get(this.config.nodule.beaMalDist),
      axios.get(this.config.nodule.broMalDist),
    ])
      .then(
        ([
          ressta,
          ressex,
          restm,
          restd,
          rescd,
          resns,
          resnc,
          resta,
          resld,
          resntd,
          ressm,
          rescm,
          reslm,
          resttm,
          respin,
          rescav,
          resvss,
          resbea,
          resbro,
        ]) => {
          const tp = ressta.data.totalPatients;
          const tr = ressta.data.totalRecords;
          const mp = ressta.data.modelProgress;
          const sd = ressex.data;
          const sdj = JSON.stringify(sd); //JSON格式

          const total_mal = JSON.stringify(restm.data["data"]);
          const total_dia = JSON.stringify(restd.data["data"]);
          const total_character = JSON.stringify(rescd.data["data"]);
          const total_age = JSON.stringify(resta.data["data"]);

          const nonSpiDia = JSON.stringify(resns.data["data"]);
          const nonCalDia = JSON.stringify(resnc.data["data"]);
          const nonLubDia = JSON.stringify(resld.data["data"]);
          const nonGGODia = JSON.stringify(resntd.data["data"]);

          const spiMali = JSON.stringify(ressm.data["data"]);
          const calMali = JSON.stringify(rescm.data["data"]);
          const lubeMali = JSON.stringify(reslm.data["data"]);
          const textMal = JSON.stringify(resttm.data["data"]);

          const pinMal = JSON.stringify(respin.data["data"]);
          const cavMal = JSON.stringify(rescav.data["data"]);
          const vssMal = JSON.stringify(resvss.data["data"]);
          const beaMal = JSON.stringify(resbea.data["data"]);
          const broMal = JSON.stringify(resbro.data["data"]);
          console.log("total_character", total_character);

          localStorage.setItem("totalPatients", tp);
          localStorage.setItem("totalRecords", tr);
          localStorage.setItem("modelProgress", mp);
          localStorage.setItem("sexData", sdj);

          localStorage.setItem("totalMalDist", total_mal);
          localStorage.setItem("totalDiameterDist", total_dia);
          localStorage.setItem("characterDiameterDist", total_character);
          localStorage.setItem("totalAgeDist", total_age);

          localStorage.setItem("nonSpiculationDiameterDist", nonSpiDia);
          localStorage.setItem("nonCalcificationDiameterDist", nonCalDia);
          localStorage.setItem("nonLobulationDiameterDist", nonLubDia);
          localStorage.setItem("nonTextureDiameterDist", nonGGODia);

          localStorage.setItem("spiculationMalDist", spiMali);
          localStorage.setItem("calcificationMalDist", calMali);
          localStorage.setItem("lobulationMalDist", lubeMali);
          localStorage.setItem("textureMalDist", textMal);

          localStorage.setItem("pleuralDist", pinMal);
          localStorage.setItem("cavityDist", cavMal);
          localStorage.setItem("vcsDist", vssMal);
          localStorage.setItem("vacuoleDist", beaMal);
          this.setState({
            totalPatients: tp,
            totalRecords: tr,
            modelProgress: mp,
            sexlist: sdj,
            totalMalDist: total_mal,
            totalDiameterDist: total_dia,
            characterDiameterDist: total_character,
            nonSpiculationDiameterDist: nonSpiDia,
            nonCalcificationDiameterDist: nonCalDia,
            totalAgeDist: total_age,
            nonLobulationDiameterDist: nonLubDia,
            nonTextureDiameterDist: nonGGODia,
            spiculationMalDist: spiMali,
            calcificationMalDist: calMali,
            lobulationMalDist: lubeMali,
            textureMalDist: textMal,
            pleuralDist: pinMal,
            cavityDist: cavMal,
            vcsDist: vssMal,
            vacuoleDist: beaMal,
          });
        }
      )
      .catch((error) => {
        console.log("ERRRRROR", error);
      });
  }

  isEmpty(v) {
    switch (typeof v) {
      case "undefined":
        return true;
      case "string":
        if (v.replace(/(^[ \t\n\r]*)|([ \t\n\r]*$)/g, "").length == 0)
          return true;
        break;
      case "boolean":
        if (!v) return true;
        break;
      case "number":
        if (0 === v || isNaN(v)) return true;
        break;
      case "object":
        if (null === v || v.length === 0) return true;
        for (var i in v) {
          return false;
        }
        return true;
    }
    return false;
  }

  visualize() {
    //总体年龄分布可视化
    document.getElementById("ageTotal").innerHTML = "";
    const ageD = this.state.totalAgeDist;
    console.log("ageD", this.isEmpty(ageD));
    // if(ageD !== undefined && ageD !== null){
    if (!this.isEmpty(ageD)) {
      // console.log("ageD",ageD && ageD.length !== 0)
      // // if(ageD !== undefined && ageD !== null){
      // if(ageD && ageD.length !== 0){
      const ageTotalData1 = JSON.parse(ageD);
      const ageTotalchart = new G2.Chart({
        container: "ageTotal",
        forceFit: true,
        height: 280,
        // width:400,
        padding: [30, "auto", "auto", "auto"],
      });
      ageTotalchart.source(ageTotalData1);
      ageTotalchart.scale("value", {
        alias: "人数",
      });
      ageTotalchart.axis("type", {
        label: {
          textStyle: {
            fill: "#aaaaaa",
          },
        },
        tickLine: {
          alignWithLabel: false,
          length: 0,
        },
      });
      ageTotalchart.tooltip({
        share: true,
      });
      ageTotalchart
        .interval()
        .position("type*value")
        .opacity(1)
        .label("value", {
          textStyle: {
            fontSize: 14,
            fill: "#aaa",
          },
        })
        .color(["#00B4D8"])
        .size(30);
      ageTotalchart.render();

      //总体年龄占比饼图
      document.getElementById("ageTotal2").innerHTML = "";
      const dv2 = new DataView();
      dv2.source(ageTotalData1).transform({
        type: "percent",
        field: "value",
        dimension: "type",
        as: "percent",
      });
      var diaTotal2chart = new G2.Chart({
        container: "ageTotal2",
        forceFit: true,
        height: 280,
        // autoFit: true,
        // height: 250,
        // height: 270,
        // width: 320,
        padding: "auto",
        animate: true,
      });
      diaTotal2chart.source(dv2, {
        percent: {
          formatter: function formatter(val) {
            val = (val * 100).toFixed(1) + "%";
            return val;
          },
        },
      });
      diaTotal2chart.coord("theta", {
        radius: 0.75,
        innerRadius: 0.6,
      });
      // diaTotal2chart.coord('theta');
      diaTotal2chart.tooltip({
        showTitle: false,
        itemTpl:
          '<li><span style="background-color:{color};" class="g2-tooltip-marker"></span>{name}: {value}人</li>',
      });
      // ['#188B8E','#002687', '#BB7329','#3C1E74', '#061846']/['#FD9F21','#00E2F7','#50b0ec','#8b8ae4','#9d5ee3']
      // diaTotal2chart.legend(false)
      diaTotal2chart
        .intervalStack()
        .position("value")
        .color("type", ["#00E2F7", "#50b0ec", "#8b8ae4", "#9d5ee3", "#FD9F21"])
        .opacity(1)
        .label("value", function (val) {
          return {
            formatter: (text, item) => {
              const point = item.point; // 每个弧度对应的点
              let percent = point["percent"];
              percent = (percent * 100).toFixed(2) + "%";
              const showTitle =
                point.value == 0 ? null : point.type + " : " + percent;
              return showTitle;
            },
            textStyle: {
              fill: "#fff",
            },
          };
        })
        .tooltip("type*value", function (item, value) {
          // percent = (percent * 100).toFixed(1) + '%';
          return {
            name: item,
            value: value,
          };
        });
      diaTotal2chart.render();
    }

    //总体结节直径分布
    document.getElementById("diaTotal").innerHTML = "";
    const DiaD = this.state.totalDiameterDist;
    // if(DiaD !== undefined){
    if (!this.isEmpty(DiaD)) {
      // if(DiaD && DiaD.length !== 0){
      const diaTotalData1 = JSON.parse(DiaD);
      const diaTotalchart = new G2.Chart({
        container: "diaTotal",
        forceFit: true,
        height: 280,
        // width:400,
        padding: [30, "auto", "auto", "auto"],
      });
      diaTotalchart.source(diaTotalData1);
      diaTotalchart.scale("value", {
        alias: "结节数",
      });
      diaTotalchart.axis("type", {
        label: {
          textStyle: {
            fill: "#aaaaaa",
          },
        },
        tickLine: {
          alignWithLabel: false,
          length: 0,
        },
      });
      diaTotalchart.tooltip({
        share: true,
      });
      diaTotalchart
        .interval()
        .position("type*value")
        .opacity(1)
        .label("value", {
          textStyle: {
            fontSize: 14,
            fill: "#aaa",
          },
        })
        .color(["#00B4D8"])
        .size(30);
      diaTotalchart.render();

      //总体结节直径分布饼图
      document.getElementById("diaTotal2").innerHTML = "";
      const dv6 = new DataView();
      dv6.source(diaTotalData1).transform({
        type: "percent",
        field: "value",
        dimension: "type",
        as: "percent",
      });
      var diaTotal2chart = new G2.Chart({
        container: "diaTotal2",
        forceFit: true,
        height: 280,
        // width:400,
        padding: "auto",
        animate: true,
      });
      diaTotal2chart.source(dv6, {
        percent: {
          formatter: function formatter(val) {
            val = (val * 100).toFixed(1) + "%";
            return val;
          },
        },
      });
      diaTotal2chart.coord("theta", {
        radius: 0.75,
        innerRadius: 0.6,
      });
      diaTotal2chart.tooltip({
        showTitle: false,
      });
      // diaTotal2chart.legend(false) ['#ff9a25','#29e7f9','#25bbf9','#637bfc','#b029ff']
      diaTotal2chart
        .intervalStack()
        .position("value")
        .color("type", ["#FD9F21", "#00E2F7", "#50b0ec", "#8b8ae4", "#9d5ee3"])
        .opacity(1)
        .label("value", function (val) {
          return {
            formatter: (text, item) => {
              const point = item.point; // 每个弧度对应的点
              let percent = point["percent"];
              percent = (percent * 100).toFixed(2) + "%";
              return point.type + " : " + percent;
            },
            textStyle: {
              fill: "#fff",
            },
          };
        });
      diaTotal2chart.render();
    }

    //模型进度
    document.getElementById("modelProgress").innerHTML = "";
    const pregressValue =
      parseInt(this.state.modelProgress) > 100
        ? 100
        : parseInt(this.state.modelProgress);
    const pregressData = [
      {
        item: "模型进度",
        value: pregressValue,
      },
    ];
    const ProgressChart = new G2.Chart({
      container: "modelProgress",
      forceFit: true,
      height: 260,
      padding: [0, 45, 20, 45],
    });
    ProgressChart.source(pregressData, {
      value: {
        min: 0,
        max: 100,
      },
    });
    ProgressChart.legend(false);
    ProgressChart.axis(false);
    ProgressChart.interval()
      .position("item*value")
      .color("item", "#50b0ec")
      .shape("liquid-fill-gauge")
      .style({
        lineWidth: 10,
        opacity: 0.5,
      });

    pregressData.forEach((row) => {
      ProgressChart.guide().text({
        top: true,
        position: {
          item: row.item,
          value: 50,
        },
        content: `${row.value}%`,
        style: {
          fill: "#fff",
          opacity: 0.75,
          fontSize: 30,
          textAlign: "center",
        },
      });
    });
    ProgressChart.render();

    //薄厚层分布情况
    document.getElementById("thicknessDist").innerHTML = "";
    const thicknessDist = [
      { type: "BC", value: parseInt(this.state.BCRecords) },
      { type: "HC", value: parseInt(this.state.HCRecords) },
    ];
    console.log("thick", thicknessDist);
    if (!this.isEmpty(thicknessDist)) {
      const thickDV = new DataView();
      thickDV.source(thicknessDist).transform({
        type: "percent",
        field: "value",
        dimension: "type",
        as: "percent",
      });
      var thicknessChart = new G2.Chart({
        container: "thicknessDist",
        forceFit: true,
        height: 260,
        // padding: [0, 50, 20, 50],
        padding: [20, 50, 20, 50],
        animate: true,
      });
      thicknessChart.source(thickDV, {
        percent: {
          formatter: function formatter(val) {
            val = (val * 100).toFixed(1) + "%";
            return val;
          },
        },
      });

      thicknessChart.coord("theta", {
        radius: 0.75,
        innerRadius: 0.6,
      });

      thicknessChart.tooltip({
        showTitle: false,
        itemTpl:
          '<dl><dt type="none">结节数:</dt><dt type="none"><span style="background-color:{color};" class="g2-tooltip-marker"></span>{name}: {value}</dt></dl>',
      });
      thicknessChart
        .intervalStack()
        .position("percent")
        .color("type", [
          "l(100) 0:#8bc6ec 1:#9599E2",
          "l(100) 0:#80D0C7 1:#0093E9",
          "l(100) 0:#FFD26F 1:#F79059",
        ])
        .label("percent", {
          offset: 40,
          autoRotate: false,
          textStyle: {
            textAlign: "center",
            shadowBlur: 2,
            shadowColor: "rgba(0, 0, 0, .45)",
            fill: "#fff",
          },
          formatter: function formatter(val, item) {
            return item.point.type + " : " + val;
          },
        })
        .tooltip("type*value", function (item, value) {
          // percent = (percent * 100).toFixed(1) + '%';
          return {
            name: item,
            value: value,
          };
        });
      thicknessChart.render();
    }
    //危险程度分布情况
    document.getElementById("benmali").innerHTML = "";
    const benmaliD = this.state.totalMalDist;
    // if(benmaliD !==undefined){
    console.log("benmaliD", benmaliD);
    if (!this.isEmpty(benmaliD)) {
      // if(benmaliD && benmaliD.length !== 0){
      const benmaliData1 = JSON.parse(benmaliD);
      const dv4 = new DataView();
      dv4.source(benmaliData1).transform({
        type: "percent",
        field: "value",
        dimension: "type",
        as: "percent",
      });
      var benmaliChart = new G2.Chart({
        container: "benmali",
        forceFit: true,
        height: 260,
        padding: [0, 50, 20, 50],
        animate: true,
      });
      benmaliChart.source(dv4, {
        percent: {
          formatter: function formatter(val) {
            val = (val * 100).toFixed(1) + "%";
            return val;
          },
        },
      });
      benmaliChart.coord("theta", {
        radius: 0.75,
        innerRadius: 0.6,
      });
      benmaliChart.tooltip({
        showTitle: false,
        itemTpl:
          '<dl><dt type="none">结节数:</dt><dt type="none"><span style="background-color:{color};" class="g2-tooltip-marker"></span>{name}: {value}</dt></dl>',
      });
      // {"colors10":["#FF6B3B","#626681","#FFC100","#9FB40F","#76523B","#DAD5B5","#0E8E89","#E19348","#F383A2","#247FEA"],"colors20":["#FF6B3B","#626681","#FFC100","#9FB40F","#76523B","#DAD5B5","#0E8E89","#E19348","#F383A2","#247FEA","#2BCB95","#B1ABF4","#1D42C2","#1D9ED1","#D64BC0","#255634","#8C8C47","#8CDAE5","#8E283B","#791DC9"]}
      benmaliChart
        .intervalStack()
        .position("percent")
        .color("type", [
          "l(100) 0:#8bc6ec 1:#9599E2",
          "l(100) 0:#80D0C7 1:#0093E9",
          "l(100) 0:#FF6B3B 1:#FFC100",
        ])
        .label("percent", {
          offset: 40,
          autoRotate: false,
          textStyle: {
            textAlign: "center",
            shadowBlur: 2,
            shadowColor: "rgba(0, 0, 0, .45)",
            fill: "#fff",
          },
          formatter: function formatter(val, item) {
            return item.point.type + " : " + val;
          },
        })
        .tooltip("type*value", function (item, value) {
          // percent = (percent * 100).toFixed(1) + '%';
          return {
            name: item,
            value: value,
          };
        });
      benmaliChart.render();
    }

    //性别分布情况
    document.getElementById("sexDist").innerHTML = "";
    const sexlist = this.state.sexlist;
    const listj = JSON.parse(sexlist);
    const sexData = [
      {
        //患者性别数据
        item: "男性",
        count: listj.male,
      },
      {
        item: "女性",
        count: listj.female,
      },
    ];
    if (!this.isEmpty(sexData)) {
      const sexDV = new DataView();
      sexDV.source(sexData).transform({
        type: "percent",
        field: "count",
        dimension: "item",
        as: "percent",
      });
      var sexChart = new G2.Chart({
        container: "sexDist",
        forceFit: true,
        height: 260,
        padding: [0, 50, 20, 50],
        animate: true,
      });
      sexChart.source(sexDV, {
        percent: {
          formatter: function formatter(val) {
            val = (val * 100).toFixed(1) + "%";
            return val;
          },
        },
      });

      sexChart.coord("theta", {
        radius: 0.75,
        innerRadius: 0.6,
      });

      sexChart.legend(false);
      sexChart.tooltip({
        showTitle: false,
        itemTpl:
          '<li><span style="background-color:{color};" class="g2-tooltip-marker"></span>{name}: {value}</li>',
      });
      sexChart
        .intervalStack()
        .position("percent")
        .color("item", [
          "l(100) 0:#8bc6ec 1:#9599E2",
          "l(100) 0:#80D0C7 1:#0093E9",
        ])
        .label("percent", {
          offset: 25,
          autoRotate: true,
          textStyle: {
            // textAlign: 'center',
            shadowBlur: 2,
            shadowColor: "rgba(0, 0, 0, .45)",
            fill: "#fff",
          },
          formatter: function formatter(val, item) {
            return item.point.item + " : " + val;
          },
        })
        .tooltip("item*percent", function (item, percent) {
          percent = (percent * 100).toFixed(1) + "%";
          return {
            name: item,
            value: percent,
          };
        })
        .style({
          lineWidth: 0,
          stroke: "#fff",
        });
      sexChart.render();
    }

    //形态学分叶直径分布
    document.getElementById("diaSublobe").innerHTML = "";
    const characterD = this.state.characterDiameterDist;
    // if(characterD !== undefined){
    if (!this.isEmpty(characterD)) {
      // if(characterD && characterD.length !== 0){
      const diaDistributionData1 = JSON.parse(characterD);
      const diaSublobechart = new G2.Chart({
        container: "diaSublobe",
        forceFit: true,
        height: 250,
        // width:100,
        padding: [30, 30, "auto", 30],
      });
      const dv8 = new DataView();
      dv8.source(diaDistributionData1).transform({
        type: "filter",
        callback(row) {
          // 判断某一行是否保留，默认返回true
          return row.type == "分叶";
        },
      });
      diaSublobechart.source(dv8);
      diaSublobechart.scale("value", {
        alias: "结节数",
      });
      diaSublobechart.axis("diameter", {
        label: {
          textStyle: {
            fill: "#aaaaaa",
          },
        },
        tickLine: {
          alignWithLabel: false,
          length: 0,
        },
      });
      diaSublobechart.tooltip({
        share: true,
      });
      //#3CB371
      diaSublobechart
        .interval()
        .position("diameter*value")
        .opacity(1)
        .label("value", {
          textStyle: {
            fontSize: 14,
            fill: "#aaa",
          },
        })
        .color(["#00B4D8"])
        .size(30);
      diaSublobechart.render();

      //形态学分叶直径分布饼图
      document.getElementById("diaSublobePie").innerHTML = "";
      const dv12 = new DataView();
      dv12.source(dv8).transform({
        type: "percent",
        field: "value",
        dimension: "diameter",
        as: "percent",
      });
      const diaSublobePie = new G2.Chart({
        container: "diaSublobePie",
        forceFit: false,
        height: 250,
        width: 400,
        padding: [45, 30, 45, 30],
        animate: false,
      });
      diaSublobePie.source(dv12, {
        percent: {
          formatter: (val) => {
            val = (val * 100).toFixed(2) + "%";
            return val;
          },
        },
      });
      diaSublobePie.coord("theta", {
        radius: 1,
        innerRadius: 0.7,
      });
      diaSublobePie.tooltip({
        showTitle: false,
        itemTpl:
          '<dl><dt type="none">结节数:</dt><dt type="none"><span style="background-color:{color};" class="g2-tooltip-marker"></span>{name}: {value}</dt></dl>',
      });
      diaSublobePie
        .intervalStack()
        .position("value")
        .color("diameter", [
          "#FD9F21",
          "#00E2F7",
          "#50b0ec",
          "#8b8ae4",
          "#9d5ee3",
        ])
        .label("percent", {
          formatter: (val, item) => {
            const showTitle =
              item.point.value == 0 ? null : item.point.diameter + ": " + val;
            return showTitle;
          },
          textStyle: {
            fill: "#fff",
          },
        })
        .tooltip("diameter*value", (item, value) => {
          return {
            name: item,
            value: value,
          };
        });
      diaSublobePie.render();
      //形态学毛刺直径分布
      document.getElementById("diaGlitch").innerHTML = "";
      const diaGlitchchart = new G2.Chart({
        container: "diaGlitch",
        forceFit: true,
        height: 250,
        // width:100,
        padding: [30, 30, "auto", 30],
      });
      const dv9 = new DataView();
      dv9.source(diaDistributionData1).transform({
        type: "filter",
        callback(row) {
          // 判断某一行是否保留，默认返回true
          return row.type == "毛刺";
        },
      });
      diaGlitchchart.source(dv9);
      diaGlitchchart.scale("value", {
        alias: "结节数",
      });
      diaGlitchchart.axis("diameter", {
        label: {
          textStyle: {
            fill: "#aaaaaa",
          },
        },
        tickLine: {
          alignWithLabel: false,
          length: 0,
        },
      });
      diaGlitchchart.tooltip({
        share: true,
      });
      diaGlitchchart
        .interval()
        .position("diameter*value")
        .opacity(1)
        .label("value", {
          textStyle: {
            fontSize: 14,
            fill: "#aaa",
          },
        })
        .color(["#00B4D8"])
        .size(30);
      diaGlitchchart.render();

      //形态学毛刺直径分布饼图
      document.getElementById("diaGlitchPie").innerHTML = "";
      const dv14 = new DataView();
      dv14.source(dv9).transform({
        type: "percent",
        field: "value",
        dimension: "diameter",
        as: "percent",
      });
      const diaGlitchPie = new G2.Chart({
        container: "diaGlitchPie",
        forceFit: false,
        height: 250,
        width: 400,
        padding: [45, 30, 45, 30],
        animate: false,
      });
      diaGlitchPie.source(dv14, {
        percent: {
          formatter: (val) => {
            val = (val * 100).toFixed(2) + "%";
            return val;
          },
        },
      });
      diaGlitchPie.coord("theta", {
        radius: 1,
        innerRadius: 0.7,
      });
      diaGlitchPie.tooltip({
        showTitle: false,
        itemTpl:
          '<dl><dt type="none">结节数:</dt><dt type="none"><span style="background-color:{color};" class="g2-tooltip-marker"></span>{name}: {value}</dt></dl>',
      });
      //['#188B8E','#002687', '#E08031','#3C1E74', '#061846']
      diaGlitchPie
        .intervalStack()
        .position("value")
        .color("diameter", [
          "#FD9F21",
          "#00E2F7",
          "#50b0ec",
          "#8b8ae4",
          "#9d5ee3",
        ])
        .label("percent", {
          formatter: (val, item) => {
            const showTitle =
              item.point.value == 0 ? null : item.point.diameter + ": " + val;
            return showTitle;
          },
          textStyle: {
            fill: "#fff",
          },
        })
        .tooltip("diameter*value", (item, value) => {
          return {
            name: item,
            value: value,
          };
        });
      diaGlitchPie.render();

      //形态学钙化直径分布
      document.getElementById("diaCalcify").innerHTML = "";
      const diaCalcifychart = new G2.Chart({
        container: "diaCalcify",
        forceFit: true,
        height: 250,
        // width:100,
        padding: [30, 30, "auto", 30],
      });
      const dv10 = new DataView();
      dv10.source(diaDistributionData1).transform({
        type: "filter",
        callback(row) {
          // 判断某一行是否保留，默认返回true
          return row.type == "钙化";
        },
      });
      diaCalcifychart.source(dv10);
      diaCalcifychart.scale("value", {
        alias: "结节数",
      });
      diaCalcifychart.axis("diameter", {
        label: {
          textStyle: {
            fill: "#aaaaaa",
          },
        },
        tickLine: {
          alignWithLabel: false,
          length: 0,
        },
      });
      diaCalcifychart.tooltip({
        share: true,
      });
      diaCalcifychart
        .interval()
        .position("diameter*value")
        .opacity(1)
        .label("value", {
          textStyle: {
            fontSize: 14,
            fill: "#aaa",
          },
        })
        .color(["#00B4D8"])
        .size(30);
      diaCalcifychart.render();

      //形态学钙化直径分布饼图
      document.getElementById("diaCalcifyPie").innerHTML = "";
      const dv13 = new DataView();
      dv13.source(dv10).transform({
        type: "percent",
        field: "value",
        dimension: "diameter",
        as: "percent",
      });
      const diaCalcifyPie = new G2.Chart({
        container: "diaCalcifyPie",
        forceFit: false,
        height: 250,
        width: 400,
        padding: [45, 30, 45, 30],
        animate: false,
      });
      diaCalcifyPie.source(dv13, {
        percent: {
          formatter: (val) => {
            val = (val * 100).toFixed(2) + "%";
            return val;
          },
        },
      });
      diaCalcifyPie.coord("theta", {
        radius: 1,
        innerRadius: 0.7,
      });
      diaCalcifyPie.tooltip({
        showTitle: false,
        itemTpl:
          '<dl><dt type="none">结节数:</dt><dt type="none"><span style="background-color:{color};" class="g2-tooltip-marker"></span>{name}: {value}</dt></dl>',
      });
      diaCalcifyPie
        .intervalStack()
        .position("value")
        .color("diameter", [
          "#FD9F21",
          "#00E2F7",
          "#50b0ec",
          "#8b8ae4",
          "#9d5ee3",
        ])
        .label("percent", {
          formatter: (val, item) => {
            const showTitle =
              item.point.value == 0 ? null : item.point.diameter + ": " + val;
            return showTitle;
          },
          textStyle: {
            fill: "#fff",
          },
        })
        .tooltip("diameter*value", (item, value) => {
          return {
            name: item,
            value: value,
          };
        });
      diaCalcifyPie.render();

      //形态学GGO直径分布
      document.getElementById("diaGGO").innerHTML = "";
      const diaGGOchart = new G2.Chart({
        container: "diaGGO",
        forceFit: true,
        height: 250,
        // width:100,
        padding: [30, 30, "auto", 30],
      });
      const dv11 = new DataView();
      dv11.source(diaDistributionData1).transform({
        type: "filter",
        callback(row) {
          // 判断某一行是否保留，默认返回true
          return row.type == "磨玻璃";
        },
      });
      diaGGOchart.source(dv11);
      diaGGOchart.scale("value", {
        alias: "结节数",
      });
      diaGGOchart.axis("diameter", {
        label: {
          textStyle: {
            fill: "#aaaaaa",
          },
        },
        tickLine: {
          alignWithLabel: false,
          length: 0,
        },
      });
      diaGGOchart.tooltip({
        share: true,
      });
      diaGGOchart
        .interval()
        .position("diameter*value")
        .opacity(1)
        .label("value", {
          textStyle: {
            fontSize: 14,
            fill: "#aaa",
          },
        })
        .color(["#00B4D8"])
        .size(30);
      diaGGOchart.render();

      //形态学GGO直径分布饼图
      document.getElementById("diaGGOPie").innerHTML = "";
      const dv15 = new DataView();
      dv15.source(dv11).transform({
        type: "percent",
        field: "value",
        dimension: "diameter",
        as: "percent",
      });
      const diaGGOPie = new G2.Chart({
        container: "diaGGOPie",
        forceFit: false,
        height: 250,
        width: 400,
        padding: [45, 30, 45, 30],
        animate: false,
      });
      diaGGOPie.source(dv15, {
        percent: {
          formatter: (val) => {
            val = (val * 100).toFixed(2) + "%";
            return val;
          },
        },
      });
      diaGGOPie.coord("theta", {
        radius: 1,
        innerRadius: 0.7,
      });
      diaGGOPie.tooltip({
        showTitle: false,
        itemTpl:
          '<dl><dt type="none">结节数:</dt><dt type="none"><span style="background-color:{color};" class="g2-tooltip-marker"></span>{name}: {value}</dt></dl>',
      });
      diaGGOPie
        .intervalStack()
        .position("value")
        .color("diameter", [
          "#FD9F21",
          "#00E2F7",
          "#50b0ec",
          "#8b8ae4",
          "#9d5ee3",
        ])
        .label("percent", {
          formatter: (val, item) => {
            const showTitle =
              item.point.value == 0 ? null : item.point.diameter + ": " + val;
            return showTitle;
          },
          textStyle: {
            fill: "#fff",
          },
        })
        .tooltip("diameter*percent", (item, percent) => {
          percent = (percent * 100).toFixed(2) + "%";
          return {
            name: item,
            value: percent,
          };
        });
      diaGGOPie.render();

      //形态学混合GGO直径分布
      document.getElementById("diaMixGGO").innerHTML = "";
      const mixGGOchart = new G2.Chart({
        container: "diaMixGGO",
        forceFit: true,
        height: 250,
        // width:100,
        padding: [30, 30, "auto", 30],
      });
      const mixggodv1 = new DataView();
      mixggodv1.source(diaDistributionData1).transform({
        type: "filter",
        callback(row) {
          // 判断某一行是否保留，默认返回true
          return row.type == "半实性";
        },
      });
      mixGGOchart.source(mixggodv1);
      mixGGOchart.scale("value", {
        alias: "结节数",
      });
      mixGGOchart.axis("diameter", {
        label: {
          textStyle: {
            fill: "#aaaaaa",
          },
        },
        tickLine: {
          alignWithLabel: false,
          length: 0,
        },
      });
      mixGGOchart.tooltip({
        share: true,
      });
      mixGGOchart
        .interval()
        .position("diameter*value")
        .opacity(1)
        .label("value", {
          textStyle: {
            fontSize: 14,
            fill: "#aaa",
          },
        })
        .color(["#00B4D8"])
        .size(30);
      mixGGOchart.render();

      //形态学混合GGO直径分布饼图
      document.getElementById("diaMixGGOPie").innerHTML = "";
      const mixggodv2 = new DataView();
      mixggodv2.source(mixggodv1).transform({
        type: "percent",
        field: "value",
        dimension: "diameter",
        as: "percent",
      });
      const mixGGOPie = new G2.Chart({
        container: "diaMixGGOPie",
        forceFit: false,
        height: 250,
        width: 400,
        padding: [45, 30, 45, 30],
        animate: false,
      });
      mixGGOPie.source(mixggodv2, {
        percent: {
          formatter: (val) => {
            val = (val * 100).toFixed(2) + "%";
            return val;
          },
        },
      });
      mixGGOPie.coord("theta", {
        radius: 1,
        innerRadius: 0.7,
      });
      mixGGOPie.tooltip({
        showTitle: false,
        itemTpl:
          '<dl><dt type="none">结节数:</dt><dt type="none"><span style="background-color:{color};" class="g2-tooltip-marker"></span>{name}: {value}</dt></dl>',
      });
      mixGGOPie
        .intervalStack()
        .position("value")
        .color("diameter", [
          "#FD9F21",
          "#00E2F7",
          "#50b0ec",
          "#8b8ae4",
          "#9d5ee3",
        ])
        .label("percent", {
          formatter: (val, item) => {
            const showTitle =
              item.point.value == 0 ? null : item.point.diameter + ": " + val;
            return showTitle;
          },
          textStyle: {
            fill: "#fff",
          },
        })
        .tooltip("diameter*percent", (item, percent) => {
          percent = (percent * 100).toFixed(2) + "%";
          return {
            name: item,
            value: percent,
          };
        });
      mixGGOPie.render();
    }

    //形态学实性直径分布
    document.getElementById("diaNonGGO").innerHTML = "";
    const nonGGOD = this.state.nonTextureDiameterDist;
    // if(nonGGOD !== undefined){
    if (!this.isEmpty(nonGGOD)) {
      // if(nonGGOD && nonGGOD.length !== 0){
      const diaNonGGOData1 = JSON.parse(nonGGOD);
      const diaNonGGOchart = new G2.Chart({
        container: "diaNonGGO",
        forceFit: true,
        height: 250,
        // width:100,
        padding: [30, 30, "auto", 30],
      });
      diaNonGGOchart.source(diaNonGGOData1);
      diaNonGGOchart.scale("value", {
        range: [0, 1],
        alias: "结节数",
      });
      diaNonGGOchart.axis("type", {
        label: {
          textStyle: {
            fill: "#aaaaaa",
          },
        },
        tickLine: {
          alignWithLabel: false,
          length: 0,
        },
      });
      diaNonGGOchart.tooltip({
        share: true,
      });
      diaNonGGOchart
        .interval()
        .position("type*value")
        .opacity(1)
        .label("value", {
          textStyle: {
            fontSize: 14,
            fill: "#aaa",
          },
        })
        .color(["#00B4D8"])
        .size(30);
      diaNonGGOchart.render();

      //形态学实性直径分布饼图
      document.getElementById("diaNonGGOPie").innerHTML = "";
      const dv16 = new DataView();
      dv16.source(diaNonGGOData1).transform({
        type: "percent",
        field: "value",
        dimension: "type",
        as: "percent",
      });
      const diaNonGGOPie = new G2.Chart({
        container: "diaNonGGOPie",
        forceFit: false,
        height: 250,
        width: 400,
        padding: [45, 30, 45, 30],
        animate: false,
      });
      diaNonGGOPie.source(dv16, {
        percent: {
          formatter: (val) => {
            val = (val * 100).toFixed(2) + "%";
            return val;
          },
        },
      });
      diaNonGGOPie.coord("theta", {
        radius: 1,
        innerRadius: 0.7,
      });
      diaNonGGOPie.tooltip({
        showTitle: false,
        itemTpl:
          '<dl><dt type="none">结节数:</dt><dt type="none"><span style="background-color:{color};" class="g2-tooltip-marker"></span>{name}: {value}</dt></dl>',
      });
      diaNonGGOPie
        .intervalStack()
        .position("value")
        .color("type", ["#FD9F21", "#00E2F7", "#50b0ec", "#8b8ae4", "#9d5ee3"])
        .label("percent", {
          formatter: (val, item) => {
            const showTitle =
              item.point.value == 0 ? null : item.point.type + ": " + val;
            return showTitle;
          },
          textStyle: {
            fill: "#fff",
          },
        })
        .tooltip("type*value", (item, value) => {
          return {
            name: item,
            value: value,
          };
        });
      diaNonGGOPie.render();
    }

    //毛刺良恶性分布
    document.getElementById("maliGlitch").innerHTML = "";
    const spiMaliD = this.state.spiculationMalDist;
    // if(spiMaliD !== undefined){
    if (!this.isEmpty(spiMaliD)) {
      // if(spiMaliD && spiMaliD.length !== 0){
      const maliGlitchData1 = JSON.parse(spiMaliD);
      const dv1 = new DataView();
      dv1.source(maliGlitchData1).transform({
        type: "percent",
        field: "value",
        dimension: "type",
        as: "percent",
      });
      const maliGlitchChart = new G2.Chart({
        container: "maliGlitch",
        forceFit: true,
        height: 200,
        padding: "auto",
        animate: true,
      });
      maliGlitchChart.coord("theta", {
        radius: 0.75,
        innerRadius: 0.5,
      });
      maliGlitchChart.source(dv1, {
        percent: {
          formatter: function formatter(val) {
            val = (val * 100).toFixed(1) + "%";
            return val;
          },
        },
      });
      maliGlitchChart.legend(false);
      maliGlitchChart.tooltip({
        showTitle: false,
        itemTpl:
          '<dl><dt type="none">结节数:</dt><dt type="none"><span style="background-color:{color};" class="g2-tooltip-marker"></span>{name}: {value}</dt></dl>',
      });
      maliGlitchChart
        .intervalStack()
        .position("percent")
        .color("type", [
          "l(100) 0:#8bc6ec 1:#9599E2",
          "l(100) 0:#80D0C7 1:#0093E9",
          "l(100) 0:#FFD26F 1:#F79059",
        ])
        .label("percent", {
          offset: -20,
          autoRotate: false,
          textStyle: {
            textAlign: "center",
            shadowBlur: 2,
            shadowColor: "rgba(0, 0, 0, .45)",
            fill: "#fff",
          },
          formatter: function formatter(val, item) {
            return item.point.type + ":\n" + val;
          },
        })
        .tooltip("type*value", function (item, value) {
          return {
            name: item,
            value: value,
          };
        });
      maliGlitchChart.render();
    }

    //分叶良恶性分布
    document.getElementById("maliSublobe").innerHTML = "";
    const lobeMaliD = this.state.lobulationMalDist;
    // if(lobeMaliD !== undefined)
    if (!this.isEmpty(lobeMaliD)) {
      // if(lobeMaliD && lobeMaliD.length !== 0){
      const maliSublobeData1 = JSON.parse(lobeMaliD);
      const dv7 = new DataView();
      dv7.source(maliSublobeData1).transform({
        type: "percent",
        field: "value",
        dimension: "type",
        as: "percent",
      });
      const maliSublobeChart = new G2.Chart({
        container: "maliSublobe",
        forceFit: true,
        height: 200,
        padding: 0,
        animate: true,
      });
      maliSublobeChart.coord("theta", {
        radius: 0.75,
        innerRadius: 0.5,
      });
      maliSublobeChart.source(dv7, {
        percent: {
          formatter: function formatter(val) {
            val = (val * 100).toFixed(1) + "%";
            return val;
          },
        },
      });
      maliSublobeChart.legend(false);
      maliSublobeChart.tooltip({
        showTitle: false,
        itemTpl:
          '<dl><dt type="none">结节数:</dt><dt type="none"><span style="background-color:{color};" class="g2-tooltip-marker"></span>{name}: {value}</dt></dl>',
      });
      maliSublobeChart
        .intervalStack()
        .position("percent")
        .color("type", [
          "l(100) 0:#8bc6ec 1:#9599E2",
          "l(100) 0:#80D0C7 1:#0093E9",
          "l(100) 0:#FFD26F 1:#F79059",
        ])
        .label("percent", {
          offset: -20,
          autoRotate: false,
          textStyle: {
            textAlign: "center",
            shadowBlur: 2,
            shadowColor: "rgba(0, 0, 0, .45)",
            fill: "#fff",
          },
          formatter: function formatter(val, item) {
            return item.point.type + ":\n" + val;
          },
        })
        .tooltip("type*value", function (item, value) {
          // percent = (percent * 100).toFixed(1)+ '%';
          return {
            name: item,
            value: value,
          };
        });
      maliSublobeChart.render();
    }

    //钙化良恶性分布
    document.getElementById("maliCalcify").innerHTML = "";
    const maliCalD = this.state.calcificationMalDist;
    // if(maliCalD !== undefined){
    if (!this.isEmpty(maliCalD)) {
      // if(maliCalD && maliCalD.length !== 0){
      const maliCalcifyData1 = JSON.parse(maliCalD);
      const dv3 = new DataView();
      dv3.source(maliCalcifyData1).transform({
        type: "percent",
        field: "value",
        dimension: "type",
        as: "percent",
      });
      const maliCalcifyChart = new G2.Chart({
        container: "maliCalcify",
        forceFit: true,
        height: 200,
        padding: 0,
        animate: true,
      });
      maliCalcifyChart.coord("theta", {
        radius: 0.75,
        innerRadius: 0.5,
      });
      maliCalcifyChart.source(dv3, {
        percent: {
          formatter: function formatter(val) {
            val = (val * 100).toFixed(1) + "%";
            return val;
          },
        },
      });
      maliCalcifyChart.legend(false);
      maliCalcifyChart.tooltip({
        showTitle: false,
        itemTpl:
          '<dl><dt type="none">结节数:</dt><dt type="none"><span style="background-color:{color};" class="g2-tooltip-marker"></span>{name}: {value}</dt></dl>',
      });
      //['#4682B4','#20B2AA']
      maliCalcifyChart
        .intervalStack()
        .position("percent")
        .color("type", [
          "l(100) 0:#8bc6ec 1:#9599E2",
          "l(100) 0:#80D0C7 1:#0093E9",
          "l(100) 0:#FFD26F 1:#F79059",
        ])
        .label("percent", {
          offset: -20,
          autoRotate: false,
          textStyle: {
            textAlign: "center",
            shadowBlur: 2,
            shadowColor: "rgba(0, 0, 0, .45)",
            fill: "#fff",
          },
          formatter: function formatter(val, item) {
            return item.point.type + ":\n" + val;
          },
        })
        .tooltip("type*value", function (item, value) {
          // percent = (percent * 100).toFixed(1)+ '%';
          return {
            name: item,
            value: value,
          };
        });
      maliCalcifyChart.render();
    }

    //GGO良恶性分布
    document.getElementById("maliGGO").innerHTML = "";
    const textMaliD = this.state.textureMalDist;
    // if(textMaliD !== undefined){
    if (!this.isEmpty(textMaliD)) {
      // if(textMaliD && textMaliD.length !== 0){
      const maliGGOData1 = JSON.parse(textMaliD);
      const dv5 = new DataView();
      dv5.source(maliGGOData1).transform({
        type: "percent",
        field: "value",
        dimension: "type",
        as: "percent",
      });
      const maliGGOChart = new G2.Chart({
        container: "maliGGO",
        forceFit: true,
        height: 200,
        padding: 0,
        animate: true,
      });
      maliGGOChart.coord("theta", {
        radius: 0.75,
        innerRadius: 0.5,
      });
      maliGGOChart.source(dv5, {
        percent: {
          formatter: function formatter(val) {
            val = (val * 100).toFixed(1) + "%";
            return val;
          },
        },
      });
      maliGGOChart.legend(false);
      maliGGOChart.tooltip({
        showTitle: false,
        itemTpl:
          '<dl><dt type="none">结节数:</dt><dt type="none"><span style="background-color:{color};" class="g2-tooltip-marker"></span>{name}: {value}</dt></dl>',
      });
      maliGGOChart
        .intervalStack()
        .position("percent")
        .color("type", [
          "l(100) 0:#8bc6ec 1:#9599E2",
          "l(100) 0:#80D0C7 1:#0093E9",
          "l(100) 0:#FFD26F 1:#F79059",
        ])
        .label("percent", {
          offset: -20,
          autoRotate: false,
          textStyle: {
            textAlign: "center",
            shadowBlur: 2,
            shadowColor: "rgba(0, 0, 0, .45)",
            fill: "#fff",
          },
          formatter: function formatter(val, item) {
            return item.point.type + ":\n" + val;
          },
        })
        .tooltip("type*value", function (item, value) {
          // percent = (percent * 100).toFixed(1)+ '%';
          return {
            name: item,
            value: value,
          };
        });
      maliGGOChart.render();
    }

    //胸膜凹陷良恶性分布
    document.getElementById("pleural").innerHTML = "";
    const pinMalD = this.state.pleuralDist;
    // if(pinMalD !== undefined){
    if (!this.isEmpty(pinMalD)) {
      // if(pinMalD && pinMalD.length !== 0){
      const pinMalData = JSON.parse(pinMalD);
      const dvPinMal = new DataView();
      dvPinMal.source(pinMalData).transform({
        type: "percent",
        field: "value",
        dimension: "type",
        as: "percent",
      });
      const pinMalChart = new G2.Chart({
        container: "pleural",
        forceFit: true,
        height: 200,
        padding: 0,
        animate: true,
      });
      pinMalChart.coord("theta", {
        radius: 0.75,
        innerRadius: 0.5,
      });
      pinMalChart.source(dvPinMal, {
        percent: {
          formatter: function formatter(val) {
            val = (val * 100).toFixed(1) + "%";
            return val;
          },
        },
      });
      pinMalChart.legend(false);
      pinMalChart.tooltip({
        showTitle: false,
        itemTpl:
          '<dl><dt type="none">结节数:</dt><dt type="none"><span style="background-color:{color};" class="g2-tooltip-marker"></span>{name}: {value}</dt></dl>',
      });
      pinMalChart
        .intervalStack()
        .position("percent")
        .color("type", [
          "l(100) 0:#8bc6ec 1:#9599E2",
          "l(100) 0:#80D0C7 1:#0093E9",
          "l(100) 0:#FFD26F 1:#F79059",
        ])
        .label("percent", {
          offset: -20,
          autoRotate: false,
          textStyle: {
            textAlign: "center",
            shadowBlur: 2,
            shadowColor: "rgba(0, 0, 0, .45)",
            fill: "#fff",
          },
          formatter: function formatter(val, item) {
            return item.point.type + ":\n" + val;
          },
        })
        .tooltip("type*value", function (item, value) {
          // percent = (percent * 100).toFixed(1)+ '%';
          return {
            name: item,
            value: value,
          };
        });
      pinMalChart.render();
    }

    //空洞正良恶性分布
    document.getElementById("cavity").innerHTML = "";
    const cavMalD = this.state.cavityDist;
    // if(cavMalD !== undefined){
    if (!this.isEmpty(cavMalD)) {
      // if(cavMalD && cavMalD.length !== 0){
      const cavMalData = JSON.parse(cavMalD);
      const dvCavMal = new DataView();
      dvCavMal.source(cavMalData).transform({
        type: "percent",
        field: "value",
        dimension: "type",
        as: "percent",
      });
      const cavMalChart = new G2.Chart({
        container: "cavity",
        forceFit: true,
        height: 200,
        padding: 0,
        animate: true,
      });
      cavMalChart.coord("theta", {
        radius: 0.75,
        innerRadius: 0.5,
      });
      cavMalChart.source(dvCavMal, {
        percent: {
          formatter: function formatter(val) {
            val = (val * 100).toFixed(1) + "%";
            return val;
          },
        },
      });
      cavMalChart.legend(false);
      cavMalChart.tooltip({
        showTitle: false,
        itemTpl:
          '<dl><dt type="none">结节数:</dt><dt type="none"><span style="background-color:{color};" class="g2-tooltip-marker"></span>{name}: {value}</dt></dl>',
      });
      cavMalChart
        .intervalStack()
        .position("percent")
        .color("type", [
          "l(100) 0:#8bc6ec 1:#9599E2",
          "l(100) 0:#80D0C7 1:#0093E9",
          "l(100) 0:#FFD26F 1:#F79059",
        ])
        .label("percent", {
          offset: -20,
          autoRotate: false,
          textStyle: {
            textAlign: "center",
            shadowBlur: 2,
            shadowColor: "rgba(0, 0, 0, .45)",
            fill: "#fff",
          },
          formatter: function formatter(val, item) {
            return item.point.type + ":\n" + val;
          },
        })
        .tooltip("type*value", function (item, value) {
          // percent = (percent * 100).toFixed(1)+ '%';
          return {
            name: item,
            value: value,
          };
        });
      cavMalChart.render();
    }

    //血管集束征良恶性分布
    document.getElementById("vcs").innerHTML = "";
    const vssMalD = this.state.vcsDist;
    // if(vssMalD !== undefined){
    if (!this.isEmpty(vssMalD)) {
      // if(vssMalD && vssMalD.length !== 0){
      const vssMalData = JSON.parse(vssMalD);
      const dvVssMal = new DataView();
      dvVssMal.source(vssMalData).transform({
        type: "percent",
        field: "value",
        dimension: "type",
        as: "percent",
      });
      const vssMalChart = new G2.Chart({
        container: "vcs",
        forceFit: true,
        height: 200,
        padding: 0,
        animate: true,
      });
      vssMalChart.coord("theta", {
        radius: 0.75,
        innerRadius: 0.5,
      });
      vssMalChart.source(dvVssMal, {
        percent: {
          formatter: function formatter(val) {
            val = (val * 100).toFixed(1) + "%";
            return val;
          },
        },
      });
      vssMalChart.legend(false);
      vssMalChart.tooltip({
        showTitle: false,
        itemTpl:
          '<dl><dt type="none">结节数:</dt><dt type="none"><span style="background-color:{color};" class="g2-tooltip-marker"></span>{name}: {value}</dt></dl>',
      });
      vssMalChart
        .intervalStack()
        .position("percent")
        .color("type", [
          "l(100) 0:#8bc6ec 1:#9599E2",
          "l(100) 0:#80D0C7 1:#0093E9",
          "l(100) 0:#FFD26F 1:#F79059",
        ])
        .label("percent", {
          offset: -20,
          autoRotate: false,
          textStyle: {
            textAlign: "center",
            shadowBlur: 2,
            shadowColor: "rgba(0, 0, 0, .45)",
            fill: "#fff",
          },
          formatter: function formatter(val, item) {
            return item.point.type + ":\n" + val;
          },
        })
        .tooltip("type*value", function (item, value) {
          // percent = (percent * 100).toFixed(1)+ '%';
          return {
            name: item,
            value: value,
          };
        });
      vssMalChart.render();
    }
    //空泡征良恶性分布 vacuole
    document.getElementById("vacuole").innerHTML = "";
    const beaMalD = this.state.vacuoleDist;
    // if(beaMalD !== undefined){
    if (!this.isEmpty(beaMalD)) {
      const beaMalData = JSON.parse(beaMalD);
      const dvBeaMal = new DataView();
      dvBeaMal.source(beaMalData).transform({
        type: "percent",
        field: "value",
        dimension: "type",
        as: "percent",
      });
      const beaMalChart = new G2.Chart({
        container: "vacuole",
        forceFit: true,
        height: 200,
        padding: 0,
        animate: true,
      });
      beaMalChart.coord("theta", {
        radius: 0.75,
        innerRadius: 0.5,
      });
      beaMalChart.source(dvBeaMal, {
        percent: {
          formatter: function formatter(val) {
            val = (val * 100).toFixed(1) + "%";
            return val;
          },
        },
      });
      beaMalChart.legend(false);
      beaMalChart.tooltip({
        showTitle: false,
        itemTpl:
          '<dl><dt type="none">结节数:</dt><dt type="none"><span style="background-color:{color};" class="g2-tooltip-marker"></span>{name}: {value}</dt></dl>',
      });
      beaMalChart
        .intervalStack()
        .position("percent")
        .color("type", [
          "l(100) 0:#8bc6ec 1:#9599E2",
          "l(100) 0:#80D0C7 1:#0093E9",
          "l(100) 0:#FFD26F 1:#F79059",
        ])
        .label("percent", {
          offset: -20,
          autoRotate: false,
          textStyle: {
            textAlign: "center",
            shadowBlur: 2,
            shadowColor: "rgba(0, 0, 0, .45)",
            fill: "#fff",
          },
          formatter: function formatter(val, item) {
            return item.point.type + ":\n" + val;
          },
        })
        .tooltip("type*value", function (item, value) {
          // percent = (percent * 100).toFixed(1)+ '%';
          return {
            name: item,
            value: value,
          };
        });
      beaMalChart.render();
    }
  }

  componentDidUpdate(prevProps, prevState) {
    // if (prevState.totalMalDist !== this.state.totalMalDist) {
    if (
      prevState.totalMalDist !== this.state.totalMalDist &&
      localStorage.getItem("auths") !== null &&
      JSON.parse(localStorage.getItem("auths")).indexOf("stat") > -1
    ) {
      this.visualize();
      document.getElementById("ageTotal").style.display = "none";
      document.getElementById("diaTotal").style.display = "none";
      document.getElementById("diabt1").style.display = "none";
      document.getElementById("agebt1").style.display = "none";
      document.getElementById("glitchbt2").style.display = "none";
      document.getElementById("diaGlitchPie").style.display = "none";
      document.getElementById("diaSublobePie").style.display = "none";
      document.getElementById("sublobebt2").style.display = "none";
      document.getElementById("diaCalcifyPie").style.display = "none";
      document.getElementById("calcifybt2").style.display = "none";
      document.getElementById("diaGGOPie").style.display = "none";
      document.getElementById("ggobt2").style.display = "none";
      document.getElementById("diaNonGGOPie").style.display = "none";
      document.getElementById("diaMixGGOPie").style.display = "none";
      document.getElementById("nonggobt2").style.display = "none";
      document.getElementById("mixggobt2").style.display = "none";
    }
  }
  componentDidMount() {
    // if (localStorage.getItem('token') != null) {
    if (
      localStorage.getItem("token") != null &&
      localStorage.getItem("auths") !== null &&
      JSON.parse(localStorage.getItem("auths")).indexOf("stat") > -1
    ) {
      this.visualize();

      document.getElementById("ageTotal").style.display = "none";
      document.getElementById("diaTotal").style.display = "none";
      document.getElementById("diabt1").style.display = "none";
      document.getElementById("agebt1").style.display = "none";
      document.getElementById("glitchbt2").style.display = "none";
      document.getElementById("diaGlitchPie").style.display = "none";
      document.getElementById("diaSublobePie").style.display = "none";
      document.getElementById("sublobebt2").style.display = "none";
      document.getElementById("diaCalcifyPie").style.display = "none";
      document.getElementById("calcifybt2").style.display = "none";
      document.getElementById("diaGGOPie").style.display = "none";
      document.getElementById("ggobt2").style.display = "none";
      document.getElementById("diaNonGGOPie").style.display = "none";
      document.getElementById("diaMixGGOPie").style.display = "none";
      document.getElementById("nonggobt2").style.display = "none";
      document.getElementById("mixggobt2").style.display = "none";
    }
  }

  render() {
    if (localStorage.getItem("token") == null) {
      return (
        // <div style={style}>
        //     <Icon name='user secret' color='teal' size='huge'></Icon>
        //     <Header as='h1' color='teal'>请先登录</Header>
        // </div>
        (window.location.href = "/")
      );
    } else {
      return localStorage.getItem("auths") !== null &&
        JSON.parse(localStorage.getItem("auths")).indexOf("stat") > -1 ? (
        <div class="VisualCanvas">
          <div class="total">
            <div class="totalcontnt">
              <h2 className="sta-header">当前数据</h2>
              <Button inverted color="green" icon>
                <Icon name="sync" />
              </Button>
              <Grid centered>
                <Grid.Row columns={4}>
                  <Grid.Column width={3}>
                    <Grid centered>
                      <Grid.Row>
                        <Card raised>
                          <Card.Header>患者总人数</Card.Header>
                          <Card.Content
                            description={this.state.totalPatients}
                          ></Card.Content>
                        </Card>
                      </Grid.Row>
                      <Grid.Row>
                        <Card raised>
                          <Card.Header>检查总数</Card.Header>
                          <Card.Content
                            description={this.state.totalRecords}
                          ></Card.Content>
                        </Card>
                      </Grid.Row>
                      <Grid.Row></Grid.Row>
                    </Grid>
                  </Grid.Column>
                  <Grid.Column width={4}>
                    <div class="tit">
                      <h2 class="tit2">模型进度</h2>
                    </div>
                    <div id="modelProgress"></div>
                  </Grid.Column>
                  <Grid.Column width={4}>
                    {/* 薄厚层 */}
                    <div class="tit">
                      <h2 class="tit2">薄厚层分布</h2>
                    </div>
                    <div id="thicknessDist"></div>
                  </Grid.Column>
                  <Grid.Column width={4}>
                    <div class="tit">
                      <h2 class="tit2">结节危险程度</h2>
                    </div>
                    <div id="benmali"></div>
                  </Grid.Column>
                </Grid.Row>
                <Grid.Row columns={4}>
                  <Grid.Column width={3}></Grid.Column>
                  <Grid.Column width={4}>
                    <div class="tit">
                      <h2 class="tit2">性别分布</h2>
                    </div>
                    <div id="sexDist"></div>
                  </Grid.Column>
                  <Grid.Column width={4}>
                    <div class="tit">
                      <h2 class="tit2">总体年龄占比</h2>
                      <div class="tit1" id="agebt1">
                        <Button
                          icon
                          onClick={this.typeChange}
                          value="agebar"
                          circular
                          basic
                          color="blue"
                          size="tiny"
                        >
                          <Icon name="chart pie"></Icon>
                        </Button>
                      </div>
                      <div class="tit1" id="agebt2">
                        <Button
                          icon
                          onClick={this.typeChange}
                          value="agepie"
                          circular
                          basic
                          color="blue"
                          size="tiny"
                        >
                          <Icon name="chart bar outline"></Icon>
                        </Button>
                      </div>
                    </div>
                    <div id="ageTotal"></div>
                    <div id="ageTotal2"></div>
                  </Grid.Column>
                  <Grid.Column width={4}>
                    <div class="tit">
                      <h2 class="tit2">总体结节直径分布</h2>
                      <div class="tit1" id="diabt1">
                        <Button
                          icon
                          onClick={this.typeChange}
                          value="diabar"
                          circular
                          basic
                          color="blue"
                          size="tiny"
                        >
                          <Icon name="chart pie"></Icon>
                        </Button>
                      </div>
                      <div class="tit1" id="diabt2">
                        <Button
                          icon
                          onClick={this.typeChange}
                          value="diapie"
                          circular
                          basic
                          color="blue"
                          size="tiny"
                        >
                          <Icon name="chart bar outline"></Icon>
                        </Button>
                      </div>
                    </div>
                    <div id="diaTotal"></div>
                    <div id="diaTotal2"></div>
                  </Grid.Column>
                </Grid.Row>
              </Grid>
            </div>
          </div>

          <div class="iconography">
            <div class="iconContnt">
              <h2 className="sta-header">结节直径分布统计</h2>
              <Grid centered divided>
                <Grid.Row columns={4}>
                  <Grid.Column width={3}></Grid.Column>
                  <Grid.Column width={4}>
                    <div class="tit">
                      <h2 class="tit2">磨玻璃直径分布</h2>
                      <div class="tit3" id="ggobt1">
                        <Button
                          icon
                          onClick={this.typeChange}
                          value="ggobar"
                          circular
                          basic
                          color="blue"
                          size="tiny"
                        >
                          <Icon name="chart pie"></Icon>
                        </Button>
                      </div>
                      <div class="tit3" id="ggobt2">
                        <Button
                          icon
                          onClick={this.typeChange}
                          value="ggopie"
                          circular
                          basic
                          color="blue"
                          size="tiny"
                        >
                          <Icon name="chart bar outline"></Icon>
                        </Button>
                      </div>
                    </div>
                    <div id="diaGGO"></div>
                    <div id="diaGGOPie"></div>
                  </Grid.Column>
                  <Grid.Column width={4}>
                    <div class="tit">
                      <h2 class="tit2">实性直径分布</h2>
                      <div class="tit3" id="nonggobt1">
                        <Button
                          icon
                          onClick={this.typeChange}
                          value="nonggobar"
                          circular
                          basic
                          color="blue"
                          size="tiny"
                        >
                          <Icon name="chart pie"></Icon>
                        </Button>
                      </div>
                      <div class="tit3" id="nonggobt2">
                        <Button
                          icon
                          onClick={this.typeChange}
                          value="nonggopie"
                          circular
                          basic
                          color="blue"
                          size="tiny"
                        >
                          <Icon name="chart bar outline"></Icon>
                        </Button>
                      </div>
                    </div>
                    <div id="diaNonGGO"></div>
                    <div id="diaNonGGOPie"></div>
                  </Grid.Column>
                  <Grid.Column width={4}>
                    <div class="tit">
                      <h2 class="tit2">半实性(混合磨玻璃)直径分布</h2>
                      <div class="tit3" id="mixggobt1">
                        <Button
                          icon
                          onClick={this.typeChange}
                          value="mixggobar"
                          circular
                          basic
                          color="blue"
                          size="tiny"
                        >
                          <Icon name="chart pie"></Icon>
                        </Button>
                      </div>
                      <div class="tit3" id="mixggobt2">
                        <Button
                          icon
                          onClick={this.typeChange}
                          value="mixggopie"
                          circular
                          basic
                          color="blue"
                          size="tiny"
                        >
                          <Icon name="chart bar outline"></Icon>
                        </Button>
                      </div>
                    </div>
                    <div id="diaMixGGO"></div>
                    <div id="diaMixGGOPie"></div>
                  </Grid.Column>
                </Grid.Row>
                <Grid.Row columns={4}>
                  <Grid.Column width={3}></Grid.Column>
                  <Grid.Column width={4}>
                    <div class="tit">
                      <h2 class="tit2">钙化征直径分布</h2>
                      <div class="tit3" id="calcifybt1">
                        <Button
                          icon
                          onClick={this.typeChange}
                          value="calcifybar"
                          circular
                          basic
                          color="blue"
                          size="tiny"
                        >
                          <Icon name="chart pie"></Icon>
                        </Button>
                      </div>
                      <div class="tit3" id="calcifybt2">
                        <Button
                          icon
                          onClick={this.typeChange}
                          value="calcifypie"
                          circular
                          basic
                          color="blue"
                          size="tiny"
                        >
                          <Icon name="chart bar outline"></Icon>
                        </Button>
                      </div>
                    </div>
                    <div id="diaCalcify"></div>
                    <div id="diaCalcifyPie"></div>
                  </Grid.Column>
                  <Grid.Column width={4}>
                    <div class="tit">
                      <h2 class="tit2">毛刺征直径分布</h2>
                      <div class="tit3" id="glitchbt1">
                        <Button
                          icon
                          onClick={this.typeChange}
                          value="glitchbar"
                          circular
                          basic
                          color="blue"
                          size="tiny"
                        >
                          <Icon name="chart pie"></Icon>
                        </Button>
                      </div>
                      <div class="tit3" id="glitchbt2">
                        <Button
                          icon
                          onClick={this.typeChange}
                          value="glitchpie"
                          circular
                          basic
                          color="blue"
                          size="tiny"
                        >
                          <Icon name="chart bar outline"></Icon>
                        </Button>
                      </div>
                    </div>
                    <div id="diaGlitch"></div>
                    <div id="diaGlitchPie"></div>
                  </Grid.Column>
                  <Grid.Column width={4}>
                    <div class="tit">
                      <h2 class="tit2">分叶征直径分布</h2>
                      <div class="tit3" id="sublobebt1">
                        <Button
                          icon
                          onClick={this.typeChange}
                          value="sublobebar"
                          circular
                          basic
                          color="blue"
                          size="tiny"
                        >
                          <Icon name="chart pie"></Icon>
                        </Button>
                      </div>
                      <div class="tit3" id="sublobebt2">
                        <Button
                          icon
                          onClick={this.typeChange}
                          value="sublobepie"
                          circular
                          basic
                          color="blue"
                          size="tiny"
                        >
                          <Icon name="chart bar outline"></Icon>
                        </Button>
                      </div>
                    </div>
                    <div id="diaSublobe"></div>
                    <div id="diaSublobePie"></div>
                  </Grid.Column>
                </Grid.Row>
              </Grid>
            </div>
          </div>

          <div class="iconography">
            <div class="iconContnt">
              <h2 className="sta-header">特征危险程度统计</h2>
              <Grid centered divided>
                <Grid.Row>
                  <Grid.Column width={3}></Grid.Column>
                  <Grid.Column width={3}>
                    <h2 class="tit2">毛刺征危险程度</h2>
                    <div id="maliGlitch"></div>
                  </Grid.Column>
                  <Grid.Column width={3}>
                    <h2 class="tit2">分叶征危险程度</h2>
                    <div id="maliSublobe"></div>
                  </Grid.Column>
                  <Grid.Column width={3}>
                    <h2 class="tit2">钙化征危险程度</h2>
                    <div id="maliCalcify"></div>
                  </Grid.Column>
                  <Grid.Column width={3}>
                    <h2 class="tit2">磨玻璃征危险程度</h2>
                    <div id="maliGGO"></div>
                  </Grid.Column>
                </Grid.Row>
                <Grid.Row>
                  <Grid.Column width={3}></Grid.Column>
                  <Grid.Column width={3}>
                    <h2 class="tit2">胸膜凹陷征危险程度</h2>
                    <div id="pleural"></div>
                  </Grid.Column>
                  <Grid.Column width={3}>
                    <h2 class="tit2">空洞征危险程度</h2>
                    <div id="cavity"></div>
                  </Grid.Column>
                  <Grid.Column width={3}>
                    <h2 class="tit2">血管集束征危险程度</h2>
                    <div id="vcs"></div>
                  </Grid.Column>
                  <Grid.Column width={3}>
                    <h2 class="tit2">空泡征危险程度</h2>
                    <div id="vacuole"></div>
                  </Grid.Column>
                </Grid.Row>
              </Grid>
            </div>
          </div>
        </div>
      ) : (
        <LowerAuth></LowerAuth>
      );
    }
  }

  typeChange(e, { value }) {
    this.setState({ value: value });
    if (value == "diabar") {
      document.getElementById("diaTotal").style.display = "none";
      document.getElementById("diaTotal2").style.display = "block";
      document.getElementById("diabt1").style.display = "none";
      document.getElementById("diabt2").style = { btstyle };
    } else if (value == "diapie") {
      document.getElementById("diaTotal").style.display = "block";
      document.getElementById("diaTotal2").style.display = "none";
      document.getElementById("diabt1").style = { btstyle };
      document.getElementById("diabt2").style.display = "none";
    } else if (value == "agebar") {
      document.getElementById("ageTotal").style.display = "none";
      document.getElementById("ageTotal2").style.display = "block";
      document.getElementById("agebt1").style.display = "none";
      document.getElementById("agebt2").style = { btstyle };
    } else if (value == "agepie") {
      document.getElementById("ageTotal").style.display = "block";
      document.getElementById("ageTotal2").style.display = "none";
      document.getElementById("agebt1").style = { btstyle };
      document.getElementById("agebt2").style.display = "none";
    } else if (value == "glitchbar") {
      document.getElementById("diaGlitch").style.display = "none";
      document.getElementById("diaGlitchPie").style.display = "block";
      document.getElementById("glitchbt1").style.display = "none";
      document.getElementById("glitchbt2").style = { btstyle };
    } else if (value == "glitchpie") {
      document.getElementById("diaGlitch").style.display = "block";
      document.getElementById("diaGlitchPie").style.display = "none";
      document.getElementById("glitchbt1").style = { btstyle };
      document.getElementById("glitchbt2").style.display = "none";
    } else if (value == "sublobebar") {
      document.getElementById("diaSublobe").style.display = "none";
      document.getElementById("diaSublobePie").style.display = "block";
      document.getElementById("sublobebt1").style.display = "none";
      document.getElementById("sublobebt2").style = { btstyle };
    } else if (value == "sublobepie") {
      document.getElementById("diaSublobe").style.display = "block";
      document.getElementById("diaSublobePie").style.display = "none";
      document.getElementById("sublobebt1").style = { btstyle };
      document.getElementById("sublobebt2").style.display = "none";
    } else if (value == "calcifybar") {
      document.getElementById("diaCalcify").style.display = "none";
      document.getElementById("diaCalcifyPie").style.display = "block";
      document.getElementById("calcifybt1").style.display = "none";
      document.getElementById("calcifybt2").style = { btstyle };
    } else if (value == "calcifypie") {
      document.getElementById("diaCalcify").style.display = "block";
      document.getElementById("diaCalcifyPie").style.display = "none";
      document.getElementById("calcifybt1").style = { btstyle };
      document.getElementById("calcifybt2").style.display = "none";
    } else if (value == "ggobar") {
      document.getElementById("diaGGO").style.display = "none";
      document.getElementById("diaGGOPie").style.display = "block";
      document.getElementById("ggobt1").style.display = "none";
      document.getElementById("ggobt2").style = { btstyle };
    } else if (value == "ggopie") {
      document.getElementById("diaGGO").style.display = "block";
      document.getElementById("diaGGOPie").style.display = "none";
      document.getElementById("ggobt1").style = { btstyle };
      document.getElementById("ggobt2").style.display = "none";
    } else if (value == "nonggobar") {
      document.getElementById("diaNonGGO").style.display = "none";
      document.getElementById("diaNonGGOPie").style.display = "block";
      document.getElementById("nonggobt1").style.display = "none";
      document.getElementById("nonggobt2").style = { btstyle };
    } else if (value == "nonggopie") {
      document.getElementById("diaNonGGO").style.display = "block";
      document.getElementById("diaNonGGOPie").style.display = "none";
      document.getElementById("nonggobt1").style = { btstyle };
      document.getElementById("nonggobt2").style.display = "none";
    } else if (value == "mixggobar") {
      document.getElementById("diaMixGGO").style.display = "none";
      document.getElementById("diaMixGGOPie").style.display = "block";
      document.getElementById("mixggobt1").style.display = "none";
      document.getElementById("mixggobt2").style = { btstyle };
    } else if (value == "mixggopie") {
      document.getElementById("diaMixGGO").style.display = "block";
      document.getElementById("diaMixGGOPie").style.display = "none";
      document.getElementById("mixggobt1").style = { btstyle };
      document.getElementById("mixggobt2").style.display = "none";
    }
  }
}

export default withRouter(DataCockpit);
