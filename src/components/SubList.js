import React, { Component } from "react";
import { Accordion, Icon, Button } from "semantic-ui-react";

import axios from "axios";
import qs from "qs";
import SeriesIdList from "./SeriesIdList";
import "../css/subList.css";

const patientInfoButtonStyle = {
  marginLeft: "20px",
};

class SubList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hint: "",
      subList: [],
      activeIndex: -1,
      cart: new Set(),
      show: false,
      contextRef: props.contextRef,
      random: Math.random(),
    };
    this.handleClick = this.handleClick.bind(this);

    this.handlePidClick = this.handlePidClick.bind(this);
    this.saveCart = this.saveCart.bind(this);
    this.config = JSON.parse(localStorage.getItem("config"));
  }

  saveCart() {
    // console.log('41', this.state.cart)
    const token = localStorage.getItem("token");
    const headers = {
      Authorization: "Bearer ".concat(token),
    };
    let stringArray = "";
    for (let item of this.state.cart) {
      stringArray = stringArray + item["caseId"] + ",";
      // console.log("items", item);
    }
    if (stringArray !== "") {
      stringArray = stringArray.substring(0, stringArray.length - 1);
    }
    const params = {
      // cart: Array.from(this.state.cart).join(","),
      cart: stringArray,
    };
    console.log("caseIdArray", stringArray);
    axios
      .post(this.config.cart.saveCart, qs.stringify(params), { headers })
      .then((res) => {
        // console.log("caseIdArray", caseIdArray);
        console.log(res.data.status);
      })
      .catch((err) => {
        console.log("err", err);
      });
  }

  getCheckedSeries = (result, params) => {
    let currentCart = this.state.cart;
    if (params.status === "add") currentCart.add(params.value);
    else currentCart.delete(params.value);
    // currentCart.add(Math.random())
    this.setState({
      cart: currentCart,
      random: Math.random(),
    });
  };

  handleClick = (e, titleProps) => {
    const { index } = titleProps;
    const { activeIndex } = this.state;
    const newIndex = activeIndex === index ? -1 : index;
    this.setState({ activeIndex: newIndex });
  };

  handlePidClick() {
    window.location.href = "/patientInfo/" + this.props.mainItem;

    // window.location.href='/infoCenter'
  }

  componentDidMount() {
    // get current cart
    if (localStorage.getItem("token") != null) {
      const token = localStorage.getItem("token");
      const headers = {
        Authorization: "Bearer ".concat(token),
      };
      axios
        .get(this.config.cart.getCart, { headers })
        .then((res) => {
          if (res.data.status === "okay") {
            const cartString = res.data.cart;
            let cart_lst = cartString;
            let cart_set = new Set(cart_lst);
            this.setState({ cart: cart_set });
          }
        })
        .catch((err) => {
          console.log("err", err);
        });
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      prevProps.mainItem !== this.props.mainItem ||
      prevProps.otherKeyword !== this.props.otherKeyword
    ) {
      this.setState({ activeIndex: -1 });
      this.loadDetailedData();
    }
    if (prevState.random !== this.state.random) {
      this.saveCart();
    }
  }

  loadDetailedData() {
    const token = localStorage.getItem("token");
    const headers = {
      Authorization: "Bearer ".concat(token),
    };

    const params = {
      mainItem: this.props.mainItem,
      type: this.props.type,
      otherKeyword: this.props.otherKeyword,
    };

    axios
      .post(
        this.config.record.getSubListForMainItem_front,
        qs.stringify(params),
        { headers }
      )
      .then((response) => {
        const data = response.data;
        if (data.status !== "okay") {
          console.log("Not okay");
        } else {
          console.log("sublist", data.subList);
          const subList = data.subList;
          let totalDates = 0;
          let totalStudies = 0;
          for (const subKey in subList) {
            totalDates++;
            totalStudies += subList[subKey].length;
          }
          if (totalDates > 0 && totalStudies > 0) {
            if (this.props.type === "date") {
              this.setState({
                hint: "当前日期包含共" + totalStudies + "次检查",
              });
            } else {
              this.setState({
                hint: "当前病人包含共" + totalDates + "次检查",
              });
            }
          } else {
            this.setState({ hint: "" });
          }

          this.setState({ subList: subList, show: true });
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  render() {
    const subList = this.state.subList;

    const hint = this.state.hint;
    const mainItem = this.props.mainItem;
    const cart = this.state.cart;
    // console.log("cart", this.state.cart);

    let panels = [];
    let idx = 0;

    let icon = "calendar";

    if (this.props.type === "date") {
      icon = "user";
    }
    // console.log("subList", subList);
    for (const subKey in subList) {
      const studyAry = subList[subKey];
      console.log("studyAry", studyAry);
      const len = studyAry.length;
      //  console.log('subkey',subKey)
      // console.log('study',studyAry)
      for (let studyitem in studyAry) {
        let study = studyAry[studyitem];
        let patientId = study["date"];
        let patientName = "";
        let patientSex =
          study["gender"] === "" ? "" : study["gender"] === "M" ? "男" : "女";
        let newValue = [];
        if (this.props.type === "date") {
          patientId = study["patientId"];

          // newValue = [patientId, patientName, patientSex];
        }
        // } else {
        //   // newValue = [patientId];
        // }
        panels.push(
          <div key={idx}>
            <Accordion.Title
              className="space"
              active={this.state.activeIndex === idx}
              index={idx}
              onClick={this.handleClick}
            >
              <div style={{ display: "inline-block", width: "10%" }}>
                <Icon name={icon} />
              </div>
              <div
                style={{
                  display: "inline-block",
                  width: "40%",
                  textAlign: "center",
                }}
              >
                {patientId}
              </div>
              <div
                style={{
                  display: "inline-block",
                  width: "50%",
                  textAlign: "right",
                }}
              >
                <span className="display-right">共{len}次检查</span>
              </div>
              {/* <tr style={{ width: "100%" }}>
                <td>
                  <Icon name={icon} />
                </td>
                <td>{newValue[0]}</td>
                <td>{patientId}</td>
                <td></td>
                <td>{newValue[1]}</td>
                <td>{newValue[2]}</td>
                <td style={{ textAlign: "right" }}>
                  <span className="display-right">共{len}次检查</span>
                </td>
              </tr> */}
            </Accordion.Title>
            <Accordion.Content active={this.state.activeIndex === idx}>
              <SeriesIdList
                cart={cart}
                parent={this}
                content={studyAry}
                contextRef={this.state.contextRef}
                pid={mainItem}
              />
            </Accordion.Content>
          </div>
        );
        idx += 1;
      }
    }
    // console.log('show',this.state.show)
    // console.log('panel',panels)
    return (
      <div>
        <div>
          <div className="hint">
            {hint}
            {panels.length !== 0 && icon === "calendar" ? (
              <Button
                style={patientInfoButtonStyle}
                content="病人详情"
                icon="right arrow"
                labelPosition="right"
                className="ui green inverted button"
                onClick={this.handlePidClick}
              />
            ) : null}
          </div>
          <Accordion styled id="subList-accordion">
            {panels}
          </Accordion>
        </div>
      </div>
    );
  }
}

export default SubList;
