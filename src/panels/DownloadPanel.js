import React, { Component } from "react";
import { Header, Table, Button, Tab, Icon } from "semantic-ui-react";
import "../css/downloadPanel.css";
import axios from "axios";
import qs from "qs";
import LowerAuth from "../components/LowerAuth";
import { notification } from "antd";

const style = {
  textAlign: "center",
  marginTop: "300px",
};

class DownloadPanel extends Component {
  delCase = (event) => {
    const del_id = event.currentTarget.dataset.id;
    console.log("delCase", del_id);
    let currentCart = this.state.cart;
    let deleteItem = -1;
    currentCart.forEach((v) => {
      if (v.caseId === del_id) {
        deleteItem = v;
      }
    });
    console.log("delCase", deleteItem);

    if (deleteItem !== -1) {
      currentCart.delete(deleteItem);
    }
    this.setState({ cart: currentCart, random: Math.random() });
  };

  constructor(props) {
    super(props);
    this.state = {
      cart: new Set(),
      loading: false,
      random: Math.random(),
    };
    this.config = JSON.parse(localStorage.getItem("config"));
    this.delCase = this.delCase.bind(this);
    this.saveCart = this.saveCart.bind(this);
    this.startDownload = this.startDownload.bind(this);
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

  componentDidMount() {
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
    if (this.state.random !== prevState.random) {
      this.saveCart();
    }
  }

  startDownload() {
    if (this.state.cart.size === 0) {
      notification.open({
        className: "data-file-broken",
        message: "??????",
        style: {
          backgroundColor: "rgba(255,232,230)",
        },
        description: "??????????????????????????????",
      });
    } else {
      console.log("Start downloading");
      this.setState({ loading: true });
      const token = localStorage.getItem("token");
      const headers = {
        Authorization: "Bearer ".concat(token),
      };
      axios
        .get(this.config.cart.downloadCart, { headers })
        .then((res) => {
          const filename = res.data;
          console.log("Filename", filename);
          window.location.href = this.config.data.download + "/" + filename;
          this.setState({ loading: false, cart: new Set() });
          // window.location.reload()
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }

  render() {
    if (
      localStorage.getItem("auths") !== null &&
      JSON.parse(localStorage.getItem("auths")).indexOf("download") > -1
    ) {
      console.log("content", this.state.cart);
      const content = Array.from(this.state.cart);
      console.log("content", content);

      if (this.state.loading) {
        return (
          <div style={style}>
            <Header as="h1" color="teal">
              ?????????????????????
            </Header>
          </div>
        );
      } else {
        if (localStorage.getItem("token") == null) {
          return (
            <div style={style}>
              <Icon name="user secret" color="teal" size="huge"></Icon>
              <Header as="h1" color="teal">
                ????????????
              </Header>
            </div>
          );
        } else {
          return (
            <div id="download-container">
              <Header as="h2" color="grey" inverted>
                ????????????
              </Header>
              <Table inverted singleLine id="nodule-table" fixed>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>??????ID</Table.HeaderCell>
                    <Table.HeaderCell>?????????</Table.HeaderCell>
                    <Table.HeaderCell>????????????</Table.HeaderCell>
                    <Table.HeaderCell>??????</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {content.map((value, idx) => {
                    return (
                      <Table.Row key={idx}>
                        <Table.Cell>{value["patientId"]}</Table.Cell>
                        <Table.Cell>{value["description"]}</Table.Cell>
                        <Table.Cell>{value["date"]}</Table.Cell>
                        <Table.Cell>
                          <a onClick={this.delCase} data-id={value.caseId}>
                            ??????
                          </a>
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}
                </Table.Body>
              </Table>
              <div id="download-btn">
                <Button color="blue" onClick={this.startDownload}>
                  ??????
                </Button>
              </div>
            </div>
          );
        }
      }
    } else {
      return <LowerAuth></LowerAuth>;
    }
  }
}

export default DownloadPanel;
