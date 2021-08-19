import React, { Component } from "react";
import axios from "axios";
import qs from "qs";
import { notification } from "antd";
import {
  Button,
  Grid,
  Modal,
  Icon,
  Header,
  Table,
  Pagination,
  Input,
  Label,
  Dropdown,
  Segment,
} from "semantic-ui-react";
import "../css/MyQueuePanel.css";
import LowerAuth from "../components/LowerAuth";

let nums = {
  危险: null,
  毛刺征: null,
  分叶征: null,
  钙化: null,
  密度: null,
  胸膜凹陷征: null,
  空洞征: null,
  血管集束征: null,
  空泡征: null,
  支气管充气征: null,
  "<=0.3cm": null,
  "0.3cm-0.5cm": null,
  "0.5cm-1cm": null,
  "1cm-1.3cm": null,
  "1.3cm-3cm": null,
  ">=3cm": null,
}; //限制labels数量

class MyQueuePanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activePage: "1",
      totalPage: 1,
      leftpidList: [],
      rightpidList: [],
      pidKeyword: "",
      queueList: [],
      isQueue: true,
      malignancy: -1,
      calcification: -1,
      spiculation: -1,
      lobulation: -1,
      texture: -1,
      pin: -1,
      cav: -1,
      vss: -1,
      bea: -1,
      bro: -1,
      diameterContainer: "0_5",
      open: false,
      queueName: "",
      patientList: [],
    };
    this.config = JSON.parse(localStorage.getItem("config"));
    this.handlePaginationChange = this.handlePaginationChange.bind(this);
    this.moveRight = this.moveRight.bind(this);
    this.moveAllRight = this.moveAllRight.bind(this);
    this.removeRight = this.removeRight.bind(this);
    this.submitQueue = this.submitQueue.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.getPid = this.getPid.bind(this);
    this.toPatientList = this.toPatientList.bind(this);
    this.handleLabels = this.handleLabels.bind(this);
    this.handlePaginationChange = this.handlePaginationChange.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleDiaChange = this.handleDiaChange.bind(this);
    this.handleImageLabels = this.handleImageLabels.bind(this);
    this.getpidByFeature = this.getpidByFeature.bind(this);
    this.open = this.open.bind(this);
    this.close = this.close.bind(this);
    this.setQueueName = this.setQueueName.bind(this);
    this.hidder = this.hidder.bind(this);
    this.handleNameChange = this.handleNameChange.bind(this);
    this.loadQueueList = this.loadQueueList.bind(this);
    this.queueStateChange = this.queueStateChange.bind(this);
    this.delQueue = this.delQueue.bind(this);
  }

  componentDidMount() {
    if (
      localStorage.getItem("auths") !== null &&
      JSON.parse(localStorage.getItem("auths")).indexOf("my_subsets") > -1
    ) {
      //请求第一页队列
      this.loadQueueList();
      document.getElementById("queue-popup").style.display = "none";
    }
  }

  componentDidUpdate(prevProps, prevState) {
    // console.log('pidkeyword',this.state.pidKeyword.length)
    if (prevState.pidKeyword !== this.state.pidKeyword) {
      if (
        this.state.pidKeyword.length > 3 ||
        this.state.pidKeyword.length == 0
      ) {
        this.getPid();
      }
    }
    if (prevState.isQueue !== this.state.isQueue) {
    }
  }

  handlePaginationChange(e, { activePage }) {
    this.setState({ activePage });
  }

  loadQueueList() {
    const params = {
      username: localStorage.getItem("username"),
    };
    axios
      .post(this.config.subset.getQueue, qs.stringify(params))
      .then((res) => {
        console.log("queue", res);
        this.setState({ queueList: res.data });
      })
      .catch((err) => {
        console.log(err);
      });
  }

  getPid() {
    //mainlist,page=all
    document.getElementById("loading").style.display = "";
    let leftpidList = [];
    console.log("getPid");
    const token = localStorage.getItem("token");
    const headers = {
      Authorization: "Bearer ".concat(token),
    };

    const params = {
      page: "all",
      type: "pid",
      pidKeyword: this.state.pidKeyword,
      dateKeyword: "",
    };

    axios
      .post(this.config.record.getMainList, qs.stringify(params), { headers })
      .then((response) => {
        const data = response.data;
        if (data.status !== "okay") {
          // window.location.href = '/'
        }
        // console.log('data:',data)
        console.log("mainList", data.mainList[0]);
        const mainList = data.mainList;
        for (var i = 0; i < mainList.length; i++) {
          leftpidList.push(mainList[i].split("_")[0]);
        }
        document.getElementById("loading").style.display = "none";
        this.setState({ leftpidList: leftpidList });
      })
      .catch((error) => {
        console.log(error);
      });
    //axios
    // this.setState({leftpidList:leftpidList})
  }

  moveRight() {
    var leftselect = document.getElementById("left");
    var isExist = false;
    let leftpidList = this.state.leftpidList;
    let rightpidList = this.state.rightpidList;
    for (var i = 0; i < leftselect.length; i++) {
      if (leftselect.options[i].selected) {
        for (var k = 0; k < rightpidList.length; k++) {
          if (rightpidList[k] === leftselect[i].text) isExist = true;
        }
        if (!isExist) {
          rightpidList.push(leftselect[i].text);
        }
        for (var j = 0; j < leftpidList.length; j++) {
          if (leftpidList[j] === leftselect[i].text) {
            leftpidList.splice(j, 1);
          }
        }
      }
      isExist = false;
    }
    this.setState({ rightpidList: rightpidList, leftpidList: leftpidList });
  }

  hidder() {
    console.log("hider");
    document.getElementById("nameinput").value = "";
    this.setState({ leftpidList: [], rightpidList: [], queueName: "" });
    document.getElementById("queue-popup").style.display = "none";
  }

  moveAllRight() {
    const leftpidList = this.state.leftpidList;
    let rightpidList = this.state.rightpidList;
    let isExist = false;
    for (var i = 0; i < leftpidList.length; i++) {
      for (var j = 0; j < rightpidList.length; j++) {
        if (rightpidList[j] === leftpidList[i]) isExist = true;
      }
      if (!isExist) {
        rightpidList.push(leftpidList[i]);
      }
      isExist = false;
    }
    this.setState({ rightpidList: rightpidList, leftpidList: [] });
  }

  setQueueName() {
    document.getElementById("queue-popup").style.display = "";
    this.close();
  }

  submitQueue() {
    let regex = new RegExp(
      "^([\u4E00-\uFA29]|[\uE7C7-\uE7F3]|[a-zA-Z0-9_]){1,12}$"
    );
    if (this.state.queueName !== "" && regex.test(this.state.queueName)) {
      //axios.createnewqueue,queuename
      let patientIds = "";
      const rightpidList = this.state.rightpidList;
      console.log("right", rightpidList);
      let queueList = this.state.queueList;
      for (var i = 0; i < rightpidList.length; i++) {
        if (i === 0 && patientIds.indexOf(rightpidList[i]) === -1) {
          patientIds = "" + rightpidList[i];
        } else if (i > 0 && patientIds.indexOf(rightpidList[i]) === -1) {
          patientIds = patientIds + "_" + rightpidList[i];
        } else {
          continue;
        }
      }
      console.log("patrients", patientIds);
      const username = localStorage.getItem("username");
      const params = {
        username: username,
        patientIds: patientIds,
        subsetName: this.state.queueName,
      };
      axios
        .post(this.config.subset.createQueue, qs.stringify(params))
        .then((res) => {
          if (res.data.status === "ok") {
            document.getElementById("queue-popup").style.display = "none";
            console.log("submit");
            //调用queue query,update queue list
            queueList.push(this.state.queueName);

            alert("创建队列'" + this.state.queueName + "'成功!");
            // this.loadQueueList()
            document.getElementById("nameinput").value = "";
            nums = {
              危险: null,
              毛刺征: null,
              分叶征: null,
              钙化: null,
              密度: null,
              胸膜凹陷征: null,
              空洞征: null,
              血管集束征: null,
              空泡征: null,
              支气管充气征: null,
              "<=0.3cm": null,
              "0.3cm-0.5cm": null,
              "0.5cm-1cm": null,
              "1cm-1.3cm": null,
              "1.3cm-3cm": null,
              ">=3cm": null,
            };
            this.setState({
              leftpidList: [],
              rightpidList: [],
              queueName: "",
              queueList: queueList,
            });
            this.setState({
              malignancy: -1,
              calcification: -1,
              spiculation: -1,
              lobulation: -1,
              texture: -1,
              pin: -1,
              cav: -1,
              vss: -1,
              bea: -1,
              bro: -1,
              diameterContainer: "0_5",
            });
          }
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      notification.warning({
        top: 48,
        duration: 6,
        message: "提醒",
        description: "队列名称的长度不超过12个字符，且仅支持中文、字母、数字和下划线",
      });
    }
  }

  removeRight() {
    var rightselect = document.getElementById("right");
    var rightpidList = this.state.rightpidList;
    for (var i = 0; i < rightselect.length; i++) {
      if (rightselect.options[i].selected) {
        for (var j = 0; j < rightpidList.length; j++) {
          if (rightpidList[j] === rightselect[i].text) {
            rightpidList.splice(j, 1);
          }
        }
      }
    }
    this.setState({ rightpidList: rightpidList });
  }

  open = () => this.setState({ open: true });
  close = () => this.setState({ open: false });

  handleLabelsIcon(value, e) {
    switch (value) {
      case "低危":
        // console.log('value',value)
        nums["危险"] = null;
        this.setState({ malignancy: -1, activePage: "1" });
        break;
      case "高危":
        // console.log('value',value)
        nums["危险"] = null;
        this.setState({ malignancy: -1, activePage: "1" });
        break;
      case "毛刺":
        nums["毛刺征"] = null;
        this.setState({ spiculation: -1, activePage: "1" });
        break;
      case "非毛刺":
        nums["毛刺征"] = null;
        this.setState({ spiculation: -1, activePage: "1" });
        break;
      case "分叶":
        nums["分叶征"] = null;
        this.setState({ lobulation: -1, activePage: "1" });
        break;
      case "非分叶":
        nums["分叶征"] = null;
        this.setState({ lobulation: -1, activePage: "1" });
        break;
      case "钙化":
        nums["钙化"] = null;
        this.setState({ calcification: -1, activePage: "1" });
        break;
      case "非钙化":
        nums["钙化"] = null;
        this.setState({ calcification: -1, activePage: "1" });
        break;
      case "实性":
        nums["密度"] = null;
        this.setState({ texture: -1, activePage: "1" });
        break;
      case "半实性":
        nums["密度"] = null;
        this.setState({ texture: -1, activePage: "1" });
        break;
      case "磨玻璃":
        nums["密度"] = null;
        this.setState({ texture: -1, activePage: "1" });
        break;
      case "胸膜凹陷":
        nums["胸膜凹陷征"] = null;
        this.setState({ pin: -1, activePage: "1" });
        break;
      case "非胸膜凹陷":
        nums["胸膜凹陷征"] = null;
        this.setState({ pin: -1, activePage: "1" });
        break;
      case "空洞":
        nums["空洞征"] = null;
        this.setState({ cav: -1, activePage: "1" });
        break;
      case "非空洞":
        nums["空洞征"] = null;
        this.setState({ cav: -1, activePage: "1" });
        break;
      case "血管集束":
        nums["血管集束征"] = null;
        this.setState({ vss: -1, activePage: "1" });
        break;
      case "非血管集束":
        nums["血管集束征"] = null;
        this.setState({ vss: -1, activePage: "1" });
        break;
      case "空泡":
        nums["空泡征"] = null;
        this.setState({ bea: -1, activePage: "1" });
        break;
      case "非空泡":
        nums["空泡征"] = null;
        this.setState({ bea: -1, activePage: "1" });
        break;
      case "支气管充气":
        nums["支气管充气征"] = null;
        this.setState({ bro: -1, activePage: "1" });
        break;
      case "非支气管充气":
        nums["支气管充气征"] = null;
        this.setState({ bro: -1, activePage: "1" });
        break;
      case "<=0.3cm":
        nums["<=0.3cm"] = null;
        this.setState((state, props) => ({
          diameterContainer:
            state.diameterContainer.indexOf("@") === -1
              ? "0_5"
              : state.diameterContainer.indexOf("0_0.3") === 0
              ? state.diameterContainer.split("0_0.3@").join("")
              : state.diameterContainer.split("@0_0.3").join(""),
          activePage: "1",
        }));
        break;
      case ">=3cm":
        nums[">=3cm"] = null;
        this.setState((state, props) => ({
          diameterContainer:
            state.diameterContainer.indexOf("@") === -1
              ? "0_5"
              : state.diameterContainer.indexOf("3_5") === 0
              ? state.diameterContainer.split("3_5@").join("")
              : state.diameterContainer.split("@3_5").join(""),
          activePage: "1",
        }));
        break;
      default:
        nums[value] = null;
        let left = value.split("cm-")[0];
        let right = value.split("cm-")[1].split("cm")[0];
        // console.log('del',left,right)
        this.setState((state, props) => ({
          diameterContainer:
            state.diameterContainer.indexOf("@") === -1
              ? "0_5"
              : state.diameterContainer.indexOf(left + "_" + right) === 0
              ? state.diameterContainer.split(left + "_" + right + "@").join("")
              : state.diameterContainer
                  .split("@" + left + "_" + right)
                  .join(""),
          activePage: "1",
        }));
        break;
    }
  }

  handleLabels(e) {
    const value = e.target.text;
    // const hhh=e.target.innerHTML
    // console.log('value',value,hhh)
    // console.log('value',value,nums[value],typeof(value),value.length)
    if (value === "<=0.3cm") {
      nums["<=0.3cm"] = value;
      this.setState((state, props) => ({
        diameterContainer:
          state.diameterContainer === "0_5"
            ? "0_0.3"
            : state.diameterContainer + "@0_0.3",
        activePage: "1",
      }));
    } else if (value === "0.3cm-0.5cm") {
      nums["0.3cm-0.5cm"] = value;

      this.setState((state, props) => ({
        diameterContainer:
          state.diameterContainer === "0_5"
            ? "0.3_0.5"
            : state.diameterContainer + "@0.3_0.5",
        activePage: "1",
      }));
    } else if (value === "0.5cm-1cm") {
      nums["0.5cm-1cm"] = value;

      this.setState((state, props) => ({
        diameterContainer:
          state.diameterContainer === "0_5"
            ? "0.5_1"
            : state.diameterContainer + "@0.5_1",
        activePage: "1",
      }));
    } else if (value === "1cm-1.3cm") {
      nums["1cm-1.3cm"] = value;

      this.setState((state, props) => ({
        diameterContainer:
          state.diameterContainer === "0_5"
            ? "1_1.3"
            : state.diameterContainer + "@1_1.3",
        activePage: "1",
      }));
    } else if (value === "1.3cm-3cm") {
      nums["1.3cm-3cm"] = value;

      this.setState((state, props) => ({
        diameterContainer:
          state.diameterContainer === "0_5"
            ? "1.3_3"
            : state.diameterContainer + "@1.3_3",
        activePage: "1",
      }));
    } else if (value === ">=3cm") {
      nums[">=3cm"] = value;

      this.setState((state, props) => ({
        diameterContainer:
          state.diameterContainer === "0_5"
            ? "3_5"
            : state.diameterContainer + "@3_5",
        activePage: "1",
      }));
    } else {
      nums["危险"] = value;
      switch (value) {
        case "低危":
          this.setState({ malignancy: 1, activePage: "1" });
          break;
        case "高危":
          this.setState({ malignancy: 2, activePage: "1" });
          break;
      }
    }
  }

  handleImageLabels(e) {
    const text = e.target.innerHTML;
    if (text === "毛刺" || text === "非毛刺") {
      nums["毛刺征"] = text;
    } else if (text === "分叶" || text === "非分叶") {
      nums["分叶征"] = text;
    } else if (text === "钙化" || text === "非钙化") {
      nums["钙化"] = text;
    } else if (text === "实性" || text === "半实性" || text === "磨玻璃") {
      nums["密度"] = text;
    } else if (text === "胸膜凹陷" || text === "非胸膜凹陷") {
      nums["胸膜凹陷征"] = text;
    } else if (text === "空洞" || text === "非空洞") {
      nums["空洞征"] = text;
    } else if (text === "血管集束" || text === "非血管集束") {
      nums["血管集束征"] = text;
    } else if (text === "空泡" || text === "非空泡") {
      nums["空泡征"] = text;
    } else if (text === "支气管充气" || text === "非支气管充气") {
      nums["支气管充气征"] = text;
    }

    switch (text) {
      case "毛刺":
        this.setState({ spiculation: 2, activePage: "1" });
        break;
      case "非毛刺":
        this.setState({ spiculation: 1, activePage: "1" });
        break;
      case "分叶":
        this.setState({ lobulation: 2, activePage: "1" });
        break;
      case "非分叶":
        this.setState({ lobulation: 1, activePage: "1" });
        break;
      case "钙化":
        this.setState({ calcification: 2, activePage: "1" });
        break;
      case "非钙化":
        this.setState({ calcification: 1, activePage: "1" });
        break;
      case "实性":
        this.setState({ texture: 2, activePage: "1" });
        break;
      case "半实性":
        this.setState({ texture: 3, activePage: "1" });
        break;
      case "磨玻璃":
        this.setState({ texture: 1, activePage: "1" });
        break;
      case "胸膜凹陷":
        this.setState({ pin: 2, activePage: "1" });
        break;
      case "非胸膜凹陷":
        this.setState({ pin: 1, activePage: "1" });
        break;
      case "空洞":
        this.setState({ cav: 2, activePage: "1" });
        break;
      case "非空洞":
        this.setState({ cav: 1, activePage: "1" });
        break;
      case "血管集束":
        this.setState({ vss: 2, activePage: "1" });
        break;
      case "非血管集束":
        this.setState({ vss: 1, activePage: "1" });
        break;
      case "空泡":
        this.setState({ bea: 2, activePage: "1" });
        break;
      case "非空泡":
        this.setState({ bea: 1, activePage: "1" });
        break;
      case "支气管充气":
        this.setState({ bro: 2, activePage: "1" });
        break;
      case "非支气管充气":
        this.setState({ bro: 1, activePage: "1" });
        break;
    }
  }

  handleAddDiameters(e) {
    console.log("add", this.left);
    console.log("add", this.right);
    if (
      parseFloat(this.left) < parseFloat(this.right) &&
      parseFloat(this.left) > 0.0 &&
      parseFloat(this.right) > 0.0 &&
      parseFloat(this.right) < 50.0
    ) {
      nums[this.left + "cm-" + this.right + "cm"] =
        this.left + "cm-" + this.right + "cm";
      this.setState((state, props) => ({
        diameterContainer:
          state.diameterContainer === "0_5"
            ? this.left + "_" + this.right
            : state.diameterContainer + "@" + this.left + "_" + this.right,
        activePage: "1",
      }));
    } else {
      notification.warning({
        top: 48,
        duration: 6,
        message: "提醒",
        description: "直径输入范围为0-50cm且注意大小关系",
      });
    }
  }

  handleDiaChange(e) {
    const value = e.currentTarget.value;
    const name = e.currentTarget.name;
    if (name === "left") {
      this.left = value;
    } else if (name === "right") {
      this.right = value;
    }
  }

  toPatientList(e) {
    const queueName = e.currentTarget.dataset.id;
    console.log(queueName);
    const params = {
      username: localStorage.getItem("username"),
      subsetName: queueName,
    };
    axios
      .post(this.config.subset.getQueuePatientIds, qs.stringify(params))
      .then((res) => {
        // console.log("patients",res)

        this.setState({ patientList: res.data });
      })
      .catch((err) => {
        console.log(err);
      });
    //以队列名请求该队列的所有pid
    this.setState(({ isQueue }) => ({
      isQueue: !isQueue,
    }));

    console.log("func");
  }

  queueStateChange(e) {
    this.setState(({ isQueue }) => ({
      isQueue: !isQueue,
    }));
  }

  delQueue(e) {
    // const delId = e.target.id
    const delName = e.target.id;
    let queueList = this.state.queueList;
    const params = {
      username: localStorage.getItem("username"),
      subsetName: delName,
    };
    axios
      .post(this.config.subset.deleteQueue, qs.stringify(params))
      .then((res) => {
        if (res.data.status === "ok") {
          for (var i = 0; i < queueList.length; i++) {
            console.log(queueList[i]);
            if (queueList[i] === delName) {
              queueList.splice(i, 1);
            }
          }
          this.setState({ queueList: queueList });
        } else {
          alert("队列删除失败...");
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }

  handleNameChange(e) {
    const value = e.currentTarget.value;
    this.setState({ queueName: value });
  }

  handleInputChange(e) {
    const value = e.currentTarget.value;
    this.setState({ pidKeyword: value });
  }

  getpidByFeature() {
    document.getElementById("loading").style.display = "";
    const params = {
      malignancy: this.state.malignancy,
      calcification: this.state.calcification,
      spiculation: this.state.spiculation,
      lobulation: this.state.lobulation,
      texture: this.state.texture,
      page: "all",
      diameters: this.state.diameterContainer,
      pin: this.state.pin,
      cav: this.state.cav,
      vss: this.state.vss,
      bea: this.state.bea,
      bro: this.state.bro,
    };
    axios
      .post(this.config.record.getNodulesAtPageMulti, qs.stringify(params))
      .then((response) => {
        let lists = [];
        const data = response.data;
        console.log("total:", data);
        for (var i = 0; i < data.length; i++) {
          lists.push(data[i]["patienId"]);
        }
        document.getElementById("loading").style.display = "none";
        const listsRemove = this.RemoveDuplicate(lists);
        this.setState({ leftpidList: listsRemove });
      })
      .catch((error) => console.log(error));
  }

  RemoveDuplicate(list) {
    var obj = {}; //用于标记字bai符串
    var arr = []; //去掉重复后的数组
    for (var i = 0, len = list.length; i < len; i++) {
      var s = list[i];
      if (obj[s]) continue;
      //如果字du符串已经存在就跳过zhi
      else {
        obj[s] = s; //加入标记对象中
        arr.push(s); //结果放入新数组中
      }
    }
    return arr;
  }

  render() {
    if (
      localStorage.getItem("auths") !== null &&
      JSON.parse(localStorage.getItem("auths")).indexOf("my_subsets") > -1
    ) {
      const { leftpidList, rightpidList, queueList, open, patientList } =
        this.state;
      return (
        <div>
          <Grid>
            <Grid.Row>
              <Grid.Column width={3}></Grid.Column>
              <Grid.Column width={10}>
                <Modal
                  open={open}
                  trigger={
                    <Button inverted color="blue" title="创建队列" icon>
                      <Icon name="plus"></Icon>
                    </Button>
                  }
                  size="large"
                  closeIcon
                  onOpen={this.open}
                  onClose={this.close}
                >
                  {/* <Modal.Header>Select a Photo</Modal.Header> */}
                  {/* <div id='selectModal'> */}
                  <Modal.Content scrolling id="selectGrid">
                    <Grid>
                      <Grid.Row>
                        <Grid.Column width={2} style={{ display: "flex" }}>
                          <Header as="h3">筛选条件:</Header>{" "}
                        </Grid.Column>
                        {/* <Grid.Column width={7}><Icon name='search' onClick={this.getpidByFeature}></Icon></Grid.Column> */}
                        <Grid.Column width={13}>
                          {Object.entries(nums).map((key, value) => {
                            return key[1] !== null ? (
                              <Label as="a" key={value} className="labelTags">
                                {key[1]}
                                <Icon
                                  name="delete"
                                  onClick={this.handleLabelsIcon.bind(
                                    this,
                                    key[1]
                                  )}
                                  inverted
                                  color="green"
                                />
                              </Label>
                            ) : null;
                          })}
                        </Grid.Column>
                        <Grid.Column width={1}>
                          <Icon
                            name="search"
                            color="blue"
                            title="搜索"
                            onClick={this.getpidByFeature}
                            size="large"
                          ></Icon>
                        </Grid.Column>
                      </Grid.Row>
                      <Grid.Row>
                        {/* <Grid.Column width={1}></Grid.Column> */}
                        {/* <Grid.Column width={14}> */}
                        <Grid inverted divided>
                          <Grid.Row columns={3}>
                            <Grid.Column width={2} style={{ color: "#2af270" }}>
                              <strong>风险程度</strong>
                            </Grid.Column>
                            <Grid.Column width={2}>
                              <a
                                style={{ color: "#66cfec" }}
                                id="feaDropdown"
                                onClick={this.handleLabels}
                              >
                                低危
                              </a>
                            </Grid.Column>
                            <Grid.Column width={2}>
                              <a
                                style={{ color: "#66cfec" }}
                                id="feaDropdown"
                                onClick={this.handleLabels}
                              >
                                高危
                              </a>
                            </Grid.Column>
                          </Grid.Row>
                          <Grid.Row>
                            <Grid.Column width={2} style={{ color: "#2af270" }}>
                              <strong>直径</strong>
                            </Grid.Column>
                            <Grid.Column width={14}>
                              <Grid inverted divided>
                                <Grid.Row columns={6}>
                                  <Grid.Column width={2}>
                                    <a
                                      style={{ color: "#66cfec" }}
                                      id="feaDropdown"
                                      onClick={this.handleLabels}
                                    >
                                      &lt;=0.3cm
                                    </a>
                                  </Grid.Column>
                                  <Grid.Column width={2}>
                                    <a
                                      style={{ color: "#66cfec" }}
                                      id="feaDropdown"
                                      onClick={this.handleLabels}
                                    >
                                      0.3cm-0.5cm
                                    </a>
                                  </Grid.Column>
                                  <Grid.Column width={2}>
                                    <a
                                      style={{ color: "#66cfec" }}
                                      id="feaDropdown"
                                      onClick={this.handleLabels}
                                    >
                                      0.5cm-1cm
                                    </a>
                                  </Grid.Column>
                                  <Grid.Column width={2}>
                                    <a
                                      style={{ color: "#66cfec" }}
                                      id="feaDropdown"
                                      onClick={this.handleLabels}
                                    >
                                      1cm-1.3cm
                                    </a>
                                  </Grid.Column>
                                  <Grid.Column width={2}>
                                    <a
                                      style={{ color: "#66cfec" }}
                                      id="feaDropdown"
                                      onClick={this.handleLabels}
                                    >
                                      1.3cm-3cm
                                    </a>
                                  </Grid.Column>
                                  <Grid.Column width={2}>
                                    <a
                                      style={{ color: "#66cfec" }}
                                      id="feaDropdown"
                                      onClick={this.handleLabels}
                                    >
                                      &gt;=3cm
                                    </a>
                                  </Grid.Column>
                                </Grid.Row>
                                <Grid.Row>
                                  <Grid.Column
                                    width={16}
                                    style={{ display: "flex", flexDirection: 'row', alignItems: 'center'}}
                                  >
                                    <a
                                      style={{ color: "#66cfec" }}
                                      id="feaDropdown"
                                    >
                                      自定义：
                                    </a>
                                    <Input
                                      className="searchBox"
                                      placeholder="cm"
                                      onChange={this.handleDiaChange}
                                      name="left"
                                      maxLength={5}
                                    />
                                    <em>&nbsp;&nbsp;-&nbsp;&nbsp;</em>
                                    <Input
                                      className="searchBox"
                                      placeholder="cm"
                                      onChange={this.handleDiaChange}
                                      name="right"
                                      maxLength={5}
                                    />
                                    <a
                                      style={{
                                        marginLeft: 15,
                                        color: "#66cfec",
                                        // fontSize: 20,
                                      }}
                                    >
                                      cm
                                    </a>
                                    <em>&nbsp;&nbsp;&nbsp;&nbsp;</em>
                                    <Button
                                      icon="add"
                                      className="ui green inverted button"
                                      size="mini"
                                      onClick={this.handleAddDiameters.bind(
                                        this
                                      )}
                                    ></Button>
                                  </Grid.Column>
                                </Grid.Row>
                              </Grid>
                            </Grid.Column>
                          </Grid.Row>
                          <Grid.Row>
                            <Grid.Column width={2} style={{ color: "#2af270" }}>
                              <strong>影像学特征</strong>
                            </Grid.Column>
                            <Grid.Column width={13}>
                              <Grid inverted divided>
                                <Grid.Row>
                                  <Grid.Column style={{ width: "9%" }}>
                                    <Dropdown
                                      text="毛刺征"
                                      style={{ color: "#66cfec" }}
                                      id="feaDropdown"
                                    >
                                      <Dropdown.Menu
                                        style={{ background: "black" }}
                                      >
                                        <Dropdown.Item
                                          onClick={this.handleImageLabels}
                                        >
                                          毛刺
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                          onClick={this.handleImageLabels}
                                        >
                                          非毛刺
                                        </Dropdown.Item>
                                      </Dropdown.Menu>
                                    </Dropdown>
                                  </Grid.Column>
                                  <Grid.Column style={{ width: "9%" }}>
                                    {/* <a style={{color:'#66cfec'}} id='feaDropdown' onClick={this.handleLabels}>分叶</a> */}
                                    <Dropdown
                                      text="分叶征"
                                      style={{ color: "#66cfec" }}
                                      id="feaDropdown"
                                    >
                                      <Dropdown.Menu
                                        style={{ background: "black" }}
                                      >
                                        <Dropdown.Item
                                          onClick={this.handleImageLabels}
                                        >
                                          分叶
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                          onClick={this.handleImageLabels}
                                        >
                                          非分叶
                                        </Dropdown.Item>
                                      </Dropdown.Menu>
                                    </Dropdown>
                                  </Grid.Column>
                                  {/* <Grid.Column width={2}>
                                                                <a style={{color:'#66cfec'}} id='feaDropdown' onClick={this.handleLabels}>胸膜内陷</a>
                                                                    
                                                                </Grid.Column> */}
                                  <Grid.Column style={{ width: "8%" }}>
                                    {/* <a style={{color:'#66cfec'}} id='feaDropdown' onClick={this.handleLabels}>钙化</a> */}
                                    <Dropdown
                                      text="钙化"
                                      style={{ color: "#66cfec" }}
                                      id="feaDropdown"
                                    >
                                      <Dropdown.Menu
                                        style={{ background: "black" }}
                                      >
                                        <Dropdown.Item
                                          onClick={this.handleImageLabels}
                                        >
                                          钙化
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                          onClick={this.handleImageLabels}
                                        >
                                          非钙化
                                        </Dropdown.Item>
                                      </Dropdown.Menu>
                                    </Dropdown>
                                  </Grid.Column>
                                  {/* <Grid.Column width={2}>
                                                                <a style={{color:'#66cfec'}} id='feaDropdown' onClick={this.handleLabels}>半实性</a>
                                                                    
                                                                </Grid.Column> */}
                                  <Grid.Column style={{ width: "8%" }}>
                                    {/* <a style={{color:'#66cfec'}} id='feaDropdown' onClick={this.handleLabels}>实性</a> */}
                                    <Dropdown
                                      text="密度"
                                      style={{ color: "#66cfec" }}
                                      id="feaDropdown"
                                    >
                                      <Dropdown.Menu
                                        style={{ background: "black" }}
                                      >
                                        <Dropdown.Item
                                          onClick={this.handleImageLabels}
                                        >
                                          实性
                                        </Dropdown.Item>
                                        <Dropdown.Item>半实性</Dropdown.Item>
                                        <Dropdown.Item
                                          onClick={this.handleImageLabels}
                                        >
                                          磨玻璃
                                        </Dropdown.Item>
                                      </Dropdown.Menu>
                                    </Dropdown>
                                  </Grid.Column>
                                  <Grid.Column style={{ width: "12%" }}>
                                    {/* <a style={{color:'#66cfec'}} id='feaDropdown' onClick={this.handleLabels}>分叶</a> */}
                                    <Dropdown
                                      text="胸膜凹陷征"
                                      style={{ color: "#66cfec" }}
                                      id="feaDropdown"
                                    >
                                      <Dropdown.Menu
                                        style={{ background: "black" }}
                                      >
                                        <Dropdown.Item
                                          onClick={this.handleImageLabels}
                                        >
                                          胸膜凹陷
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                          onClick={this.handleImageLabels}
                                        >
                                          非胸膜凹陷
                                        </Dropdown.Item>
                                      </Dropdown.Menu>
                                    </Dropdown>
                                  </Grid.Column>
                                  <Grid.Column style={{ width: "9%" }}>
                                    {/* <a style={{color:'#66cfec'}} id='feaDropdown' onClick={this.handleLabels}>分叶</a> */}
                                    <Dropdown
                                      text="空洞征"
                                      style={{ color: "#66cfec" }}
                                      id="feaDropdown"
                                    >
                                      <Dropdown.Menu
                                        style={{ background: "black" }}
                                      >
                                        <Dropdown.Item
                                          onClick={this.handleImageLabels}
                                        >
                                          空洞
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                          onClick={this.handleImageLabels}
                                        >
                                          非空洞
                                        </Dropdown.Item>
                                      </Dropdown.Menu>
                                    </Dropdown>
                                  </Grid.Column>
                                  <Grid.Column style={{ width: "12%" }}>
                                    {/* <a style={{color:'#66cfec'}} id='feaDropdown' onClick={this.handleLabels}>分叶</a> */}
                                    <Dropdown
                                      text="血管集束征"
                                      style={{ color: "#66cfec" }}
                                      id="feaDropdown"
                                    >
                                      <Dropdown.Menu
                                        style={{ background: "black" }}
                                      >
                                        <Dropdown.Item
                                          onClick={this.handleImageLabels}
                                        >
                                          血管集束
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                          onClick={this.handleImageLabels}
                                        >
                                          非血管集束
                                        </Dropdown.Item>
                                      </Dropdown.Menu>
                                    </Dropdown>
                                  </Grid.Column>
                                  <Grid.Column style={{ width: "9%" }}>
                                    {/* <a style={{color:'#66cfec'}} id='feaDropdown' onClick={this.handleLabels}>分叶</a> */}
                                    <Dropdown
                                      text="空泡征"
                                      style={{ color: "#66cfec" }}
                                      id="feaDropdown"
                                    >
                                      <Dropdown.Menu
                                        style={{ background: "black" }}
                                      >
                                        <Dropdown.Item
                                          onClick={this.handleImageLabels}
                                        >
                                          空泡
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                          onClick={this.handleImageLabels}
                                        >
                                          非空泡
                                        </Dropdown.Item>
                                      </Dropdown.Menu>
                                    </Dropdown>
                                  </Grid.Column>
                                  <Grid.Column style={{ width: "13%" }}>
                                    {/* <a style={{color:'#66cfec'}} id='feaDropdown' onClick={this.handleLabels}>分叶</a> */}
                                    <Dropdown
                                      text="支气管充气征"
                                      style={{ color: "#66cfec" }}
                                      id="feaDropdown"
                                    >
                                      <Dropdown.Menu
                                        style={{ background: "black" }}
                                      >
                                        <Dropdown.Item
                                          onClick={this.handleImageLabels}
                                        >
                                          支气管充气
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                          onClick={this.handleImageLabels}
                                        >
                                          非支气管充气
                                        </Dropdown.Item>
                                      </Dropdown.Menu>
                                    </Dropdown>
                                  </Grid.Column>
                                </Grid.Row>
                              </Grid>
                            </Grid.Column>
                          </Grid.Row>
                        </Grid>
                        {/* </Grid.Column>
                                            <Grid.Column width={1}></Grid.Column> */}
                      </Grid.Row>
                      <Grid.Row
                        verticalAlign="middle"
                        textAlign="center"
                        centered
                      >
                        <Input
                          name="pid"
                          value={this.state.pidKeyword}
                          onChange={this.handleInputChange}
                          id="pid-search"
                          icon="search"
                          placeholder="病人ID"
                        />
                      </Grid.Row>
                      <Grid.Row centered>
                        <Grid.Column
                          width={7}
                          verticalAlign="middle"
                          textAlign="center"
                        >
                          <Grid.Row>
                            {/* loader */}
                            <div
                              class="ui active inverted dimmer"
                              style={{ display: "none" }}
                              id="loading"
                            >
                              <div class="ui text loader">查询中...</div>
                            </div>
                            <select
                              name="left"
                              id="left"
                              className="select-component"
                              multiple="multiple"
                              size="10"
                            >
                              {leftpidList.map((value, index) => {
                                return <option value={index}>{value}</option>;
                              })}
                            </select>
                          </Grid.Row>
                        </Grid.Column>
                        <Grid.Column
                          width={1}
                          verticalAlign="middle"
                          textAlign="center"
                        >
                          <Button icon onClick={this.moveRight}>
                            <Icon name="angle right"></Icon>
                          </Button>
                          <Button icon onClick={this.moveAllRight}>
                            <Icon name="angle double right"></Icon>
                          </Button>
                          <Button icon onClick={this.removeRight}>
                            <Icon name="trash"></Icon>
                          </Button>
                        </Grid.Column>
                        <Grid.Column
                          width={7}
                          verticalAlign="middle"
                          textAlign="center"
                        >
                          <select
                            name="right"
                            id="right"
                            className="select-component"
                            multiple="multiple"
                            size="10"
                          >
                            {rightpidList.map((value, index) => {
                              return <option value={index}>{value}</option>;
                            })}
                          </select>
                        </Grid.Column>
                      </Grid.Row>
                      <Grid.Row>
                        <Grid.Column width={13}></Grid.Column>
                        <Grid.Column width={3}>
                          <Button
                            onClick={this.setQueueName}
                            inverted
                            color="blue"
                          >
                            新建队列
                          </Button>
                        </Grid.Column>
                      </Grid.Row>
                    </Grid>
                  </Modal.Content>
                  {/* </div> */}
                </Modal>
              </Grid.Column>
              <Grid.Column width={3}></Grid.Column>
            </Grid.Row>
            {this.state.isQueue ? (
              <Grid.Row centered>
                {/* <div id='queueTable'> */}
                <Table inverted singleLine id="queueTable">
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell>队列名称</Table.HeaderCell>
                      {/* <Table.HeaderCell>所含患者数量</Table.HeaderCell> */}
                      <Table.HeaderCell>&nbsp;</Table.HeaderCell>
                      <Table.HeaderCell>&nbsp;</Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>

                  <Table.Body>
                    {queueList.map((value, index) => {
                      let delId = "del-" + index;
                      return (
                        <Table.Row>
                          <Table.Cell width={8}>
                            {/* <Header as='h4' image>
                                                        <Header.Content>
                                                        {value}
                                                        <Header.Subheader>{value}</Header.Subheader>
                                                        </Header.Content>
                                                    </Header> */}
                            {value}
                          </Table.Cell>
                          <Table.Cell width={4}>
                            <Icon
                              name="trash alternate"
                              onClick={this.delQueue}
                              id={value}
                              delName={value}
                            ></Icon>
                          </Table.Cell>
                          <Table.Cell width={4}>
                            <Icon
                              name="caret right"
                              data-id={value}
                              onClick={this.toPatientList}
                            ></Icon>
                          </Table.Cell>
                        </Table.Row>
                      );
                    })}
                  </Table.Body>
                </Table>
                {/* </div>  */}
              </Grid.Row>
            ) : (
              <Grid.Row centered>
                {/* <div> */}
                <Table inverted singleLine id="patientTable">
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell>
                        <Button
                          icon
                          onClick={this.queueStateChange}
                          color="blue"
                          inverted
                        >
                          <Icon name="angle left"></Icon>
                        </Button>
                      </Table.HeaderCell>
                      <Table.HeaderCell>病人ID</Table.HeaderCell>
                      {/* <Table.HeaderCell>性别</Table.HeaderCell>
                                            <Table.HeaderCell>年龄</Table.HeaderCell> */}
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {patientList.map((value, index) => {
                      return (
                        <Table.Row>
                          <Table.Cell width={2}>&nbsp;</Table.Cell>
                          <Table.Cell>
                            {/* <Header as='h4' image>
                                                            <Header.Content>
                                                            {value}
                                                            </Header.Content>
                                                        </Header> */}
                            {value}
                          </Table.Cell>
                          {/* <Table.Cell></Table.Cell> */}
                        </Table.Row>
                      );
                    })}
                  </Table.Body>
                </Table>
                {/* </div>  */}
              </Grid.Row>
            )}

            {/* <Grid.Row centered>
                        <div className="pagination-component">
                                <Pagination
                                    id="pagination"
                                    onPageChange={this.handlePaginationChange}
                                    activePage={this.state.activePage}
                                    totalPages={this.state.totalPage}/>
                            </div>
                       </Grid.Row> */}
          </Grid>

          <div className="queue-popup" id="queue-popup">
            <div class="queue-name">

                  <div className="queue-name-top-block">
                    <div className="queue-name-header">请输入队列名称</div>
                    <Button id="header-right" onClick={this.hidder} icon>
                      <Icon name="x"></Icon>
                    </Button>
                  </div>
                <br />
                <div className="queue-name-bottom-block">
                  <Input
                    placeholder="队列名"
                    id="nameinput"
                    onChange={this.handleNameChange}
                    maxLength={12}
                  ></Input>

                  <Button onClick={this.submitQueue}>提交</Button>
                </div>
              {/* <div id="header"> */}

              {/* </div> */}
            </div>
          </div>
        </div>
      );
    } else {
      return <LowerAuth></LowerAuth>;
    }
  }
}

export default MyQueuePanel;
