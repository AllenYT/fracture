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
    let currentCart = this.state.cart;
    currentCart.delete(del_id);
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
    const params = {
      cart: Array.from(this.state.cart).join(","),
    };
    axios
      .post(this.config.cart.saveCart, qs.stringify(params), { headers })
      .then((res) => {
        console.log(this.state.cart);
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
            let cart_lst = cartString.split(",");
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
        message: "提示",
        style: {
          backgroundColor: "rgba(255,232,230)",
        },
        description: "未勾选需要下载的病例",
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
      const content = Array.from(this.state.cart);

      if (this.state.loading) {
        return (
          <div style={style}>
            <Header as="h1" color="teal">
              下载中，请稍候
            </Header>
          </div>
        );
      } else {
        if (localStorage.getItem("token") == null) {
          return (
            <div style={style}>
              <Icon name="user secret" color="teal" size="huge"></Icon>
              <Header as="h1" color="teal">
                请先登录
              </Header>
            </div>
          );
        } else {
          return (
            <div id="download-container">
              <Header as="h2" color="grey" inverted>
                下载列表
              </Header>
              <Table inverted singleLine id="nodule-table" fixed>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>病人ID</Table.HeaderCell>
                    <Table.HeaderCell>序列号</Table.HeaderCell>
                    <Table.HeaderCell>就诊日期</Table.HeaderCell>
                    <Table.HeaderCell>操作</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {content.map((value, idx) => {
                    return (
                      <Table.Row key={idx}>
                        <Table.Cell>
                          {value.split("#")[0].split("_")[0]}
                        </Table.Cell>
                        <Table.Cell>{value.split("#")[1]}</Table.Cell>
                        <Table.Cell>
                          {value.split("#")[0].split("_")[1]}
                        </Table.Cell>
                        <Table.Cell>
                          <a onClick={this.delCase} data-id={value}>
                            删除
                          </a>
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}
                </Table.Body>
              </Table>
              <div id="download-btn">
                <Button color="blue" onClick={this.startDownload}>
                  下载
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
