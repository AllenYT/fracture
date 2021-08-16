import React, { Component } from "react";
import { Popup, Button, Checkbox } from "semantic-ui-react";
import ReactHtmlParser from "react-html-parser";
import { Tooltip } from "antd";
import { RightOutlined } from "@ant-design/icons";
import { withRouter } from "react-router-dom";
import axios from "axios";
import qs from "qs";
import CurrentDraftsDisplay from "./CurrentDraftsDisplay";

import "../css/seriesIdList.css";
import { Link } from "react-router-dom/cjs/react-router-dom.min";
import { param } from "jquery";

// const storecid = []
class SeriesIdList extends Component {
  constructor(props) {
    super(props);
    this.displayStudy = this.displayStudy.bind(this);
    this.state = {
      contextRef: props.contextRef,
      popupHovers: [],
      dataValidContnt: [],
      allResults: [],
      // cart: new Set()
    };
    this.config = JSON.parse(localStorage.getItem("config"));
    this.storeCaseId = this.storeCaseId.bind(this);
    this.validValue = this.validValue.bind(this);
    // this.saveCart = this.saveCart.bind(this)
  }

  nextPath(path) {
    this.props.history.push(path);
  }

  displayStudy(idName, e) {
    if (idName === this.state.onPopupIndex) {
      console.log("displayStudy", e.currentTarget.dataset.id);
      // request, api, modifier
      const token = localStorage.getItem("token");
      const headers = {
        Authorization: "Bearer ".concat(token),
      };
      const params = {
        caseId: e.currentTarget.dataset.id,
      };
      axios
        .post(this.config.draft.getDataPath, qs.stringify(params), { headers })
        .then((res) => {
          console.log("result from server", res.data);
          console.log("params", params);
          // window.open('/case/' + params.caseId + '/' + res.data,'target','')
          // this.props.history.push('/case/' + params.caseId + '/' + res.data)
          const oa = document.createElement("a");
          let newCaseId = params.caseId.replace("#", "%23");
          oa.href = "/case/" + newCaseId + "/" + res.data;
          oa.setAttribute("target", "_blank");
          oa.setAttribute("rel", "nofollow noreferrer");
          document.body.appendChild(oa);
          console.log("oa", oa);
          oa.click();

          // console.log('data',res.data)
          // this.nextPath('/case/' + params.caseId + '/' + res.data)
          // window.open('/case/' + params.caseId + '/' + res.data, '_blank')
          // const w=window.open('about:blank');
          // w.location.href = '/case/' + params.caseId + '/' + res.data
          // this.nextPath('/case/' + params.caseId + '/deepln')
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }

  storeCaseId(e, { checked, value, id }) {
    console.log("checked", checked);
    console.log(value);
    let params = {};
    if (checked) params = { status: "add", value: value };
    else {
      params = { status: "del", value: value };
    }
    this.props.parent.getCheckedSeries(this, params);
  }

  ischeck() {
    return true;
  }

  validValue(value) {
    if (this.props.cart.has(value)) return true;
    else return false;
  }
  popupEnter(index) {
    console.log("popupEnter", index);
    const popupHovers = this.state.popupHovers;
    popupHovers[index] = true;
    this.setState({
      popupHovers,
    });
  }
  popupLeave(index) {
    const popupHovers = this.state.popupHovers;
    popupHovers[index] = false;
    this.setState({
      popupHovers,
    });
  }
  onPopupHide(index) {
    console.log("onPopupHide", index);
    this.setState({
      onPopupIndex: index,
    });
  }

  componentDidMount() {
    const content = this.props.content;
    const token = localStorage.getItem("token");
    const headers = {
      Authorization: "Bearer ".concat(token),
    };
    var dataValidContnt = this.state.dataValidContnt;
    var allResults = this.state.allResults;
    for (var i = 0; i < content.length; i++) {
      console.log("content", content[i]);
      const params = {
        caseId: content[i].split("#")[0],
      };
      axios
        .post(this.config.draft.dataValid, qs.stringify(params))
        .then((validResponse) => {
          const validInfo = validResponse.data;
          let validContent = {
            caseId: params.caseId,
            validInfo: validInfo,
          };
          dataValidContnt.push(validContent);
          this.setState({ dataValidContnt: dataValidContnt });
          if (validInfo.status === "ok") {
            Promise.all([
              axios.post(
                this.config.draft.getModelResults,
                qs.stringify(params),
                {
                  headers,
                }
              ),
              axios.post(
                this.config.draft.getAnnoResults,
                qs.stringify(params),
                {
                  headers,
                }
              ),
              axios.post(
                this.config.review.getReviewResults,
                qs.stringify(params),
                {
                  headers,
                }
              ),
            ])
              .then(([res1, res2, res3]) => {
                const modelList = res1.data.dataList;
                const annoList = res2.data.dataList;
                const reviewList = res3.data.dataList;

                let resultsList = {
                  caseId: params.caseId,
                  modelList: modelList,
                  annoList: annoList,
                  reviewList: reviewList,
                };
                allResults.push(resultsList);
                this.setState({ allResults: allResults });
                //   if (modelList.length > 0) {
                //     // console.log(modelList)
                //     for (var i = 0; i < modelList.length; i++) {
                //       modelStr += '<div class="ui blue label">';
                //       modelStr += modelList[i];
                //       modelStr += "</div>";
                //     }
                //     this.setState({ modelResults: modelStr });
                //     // console.log('模型结果',modelStr)
                //   }
              })
              .catch((error) => {
                console.log(error);
              });
          }
        });
    }
  }

  render() {
    const onPopupIndex = this.state.onPopupIndex;
    const content = this.props.content;
    const pid = this.props.pid;
    const { dataValidContnt, allResults } = this.state;
    var resultsPopup = "";
    let CheckboxDis = {
      display: "none",
    };
    if (localStorage.getItem("token") != null) {
      CheckboxDis = {
        display: "block",
      };
    }
    return (
      <div>
        {content.map((value, index) => {
          const idName = value + index;
          // console.log('idname',idName)
          return (
            <div key={index}>
              <div className="export">
                <Checkbox
                  id={idName}
                  onChange={this.storeCaseId}
                  value={value}
                  checked={this.validValue(value)}
                  style={CheckboxDis}
                ></Checkbox>
              </div>
              <p className="sid">{value["description"]}</p>
              <Popup
                className={onPopupIndex === idName ? "" : "seriesId-popup"}
                trigger={
                  <Button
                    size="mini"
                    inverted
                    color="green"
                    data-id={value["caseId"]}
                    icon="chevron right"
                    onClick={this.displayStudy.bind(this, idName)}
                    floated="right"
                  />
                }
                context={this.state.contextRef}
              >
                <Popup.Content>
                  <CurrentDraftsDisplay
                    caseId={value["caseId"]}
                    onPopupHide={this.onPopupHide.bind(this)}
                    onPopupIndex={idName}
                  />
                </Popup.Content>
              </Popup>
            </div>
          );
        })}
      </div>
    );
  }
}

export default withRouter(SeriesIdList);
