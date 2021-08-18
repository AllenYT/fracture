import React, { Component } from "react";
import ReactHtmlParser from "react-html-parser";
import { Popup, Button } from "semantic-ui-react";

import qs from "qs";
import axios from "axios";
import { notification } from "antd";

class CurrentDraftsDisplay extends Component {
  constructor(props) {
    super(props);
    this.state = {
      caseId: this.props.caseId,
      modelResults: "暂无结果",
      annoResults: "暂无结果",
      reviewResults: "暂无结果",
      dataValidStatus: "",
    };
    this.config = JSON.parse(localStorage.getItem("config"));
  }

  async componentDidMount() {
    const token = localStorage.getItem("token");
    const headers = {
      Authorization: "Bearer ".concat(token),
    };
    const params = {
      caseId: this.state.caseId,
    };
    //  console.log(token)
    const dataValidPromise = new Promise((resolve, reject) => {
      axios
        .post(this.config.draft.dataValid, qs.stringify(params))
        .then((res) => {
          const validInfo = res.data;
          if (validInfo.status === "failed") {
            console.log("current componentdidmount");
          }else{
            this.props.onPopupHide(this.props.onPopupIndex);
          }
          this.setState({ dataValidStatus: validInfo });
          resolve(validInfo);
        }, reject);
    });
    await dataValidPromise;
    // console.log("await");
    Promise.all([
      axios.post(this.config.draft.getModelResults, qs.stringify(params), {
        headers,
      }),
      axios.post(this.config.draft.getAnnoResults, qs.stringify(params), {
        headers,
      }),
      axios.post(this.config.review.getReviewResults, qs.stringify(params), {
        headers,
      }),
    ])
      .then(([res1, res2, res3]) => {
        const modelList = res1.data.dataList;
        const annoList = res2.data.dataList;
        const reviewList = res3.data.dataList;

        let modelStr = "";
        let annoStr = "";
        let reviewStr = "";

        if (modelList.length > 0) {
          // console.log(modelList)
          for (var i = 0; i < modelList.length; i++) {
            modelStr += '<div class="ui blue label">';
            modelStr += modelList[i];
            modelStr += "</div>";
          }
          this.setState({ modelResults: modelStr });
          // console.log('模型结果',modelStr)
        }

        if (annoList.length > 0) {
          for (var i = 0; i < annoList.length; i++) {
            annoStr += '<div class="ui label">';
            annoStr += annoList[i];
            annoStr += "</div>";
          }
          this.setState({ annoResults: annoStr });
        }

        if (reviewList.length > 0) {
          for (var i = 0; i < reviewList.length; i++) {
            reviewStr += '<div class="ui teal label">';
            reviewStr += reviewList[i];
            reviewStr += "</div>";
          }
          this.setState({ reviewResults: reviewStr });
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  render() {
    const { dataValidStatus } = this.state;
    if (dataValidStatus["status"] === "failed") {
      if (dataValidStatus["message"] === "Files been manipulated") {
        if (
          document.getElementsByClassName("data-file-broken").length ===
          0
        ) {
          notification.open({
              className: 'data-file-broken',
            message: "提示",
            style: {
              backgroundColor: "rgba(255,232,230)",
            },
            description: "数据文件被篡改，请联系厂家技术支持工程师",
          });
        }

        return (
          <div style={{ display: "none" }}>
            {/* <h4>模型结果</h4> */}
            <div id="model-results">{ReactHtmlParser("error")}</div>
          </div>
        );
      } else if (
        dataValidStatus["message"] === "Errors occur during preprocess"
      ) {
        if (
          document.getElementsByClassName("process-error").length ===
          0
        ) {
          notification.open({
            className: 'process-error',

            message: "提示",
            style: {
              backgroundColor: "rgba(255,232,230)",
            },
            description: "处理过程出错，请联系厂家技术支持工程师",
          });
        }
        return (
          <div style={{ display: "none" }}>
            <div id="model-results">{ReactHtmlParser("error")}</div>
          </div>
        );
      } else if (dataValidStatus["message"] === "caseId not found") {
        if (
          document.getElementsByClassName("out-of-database").length ===
          0
        ) {
          notification.open({
            className: 'out-of-database',

            message: "提示",
            style: {
              backgroundColor: "rgba(255,232,230)",
            },
            description: "该数据未入库，请联系厂家技术支持工程师",
          });
        }

        return (
          <div style={{ display: "none" }}>
            <div id="model-results">{ReactHtmlParser("error")}</div>
          </div>
        );
      }
    } else if (dataValidStatus["status"] === "ok") {
      const { modelResults, annoResults, reviewResults } = this.state;
      return (
        <div>
          <h4>模型结果</h4>
          <div id="model-results">{ReactHtmlParser(modelResults)}</div>
          <h4>标注结果</h4>
          <div id="anno-results">{ReactHtmlParser(annoResults)}</div>
          <h4>审核结果</h4>
          <div id="review-results">{ReactHtmlParser(reviewResults)}</div>
        </div>
      );
    } else {
      return <div display="none"></div>;
    }
  }
}

export default CurrentDraftsDisplay;
