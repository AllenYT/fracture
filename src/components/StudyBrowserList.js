import React, { Component } from "react";
import { Card, Loader } from "semantic-ui-react";
// import {StudyBrowser, Thumbnail} from 'react-viewerbase'
import qs from "qs";
import axios from "axios";
import {
  CloseCircleOutlined,
  CheckCircleOutlined,
  ConsoleSqlOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import ReactHtmlParser from "react-html-parser";
import "../css/studyBrowser.css";

import * as cornerstone from "cornerstone-core";
import * as cornerstoneMath from "cornerstone-math";
import * as cornerstoneTools from "cornerstone-tools";
import * as cornerstoneWadoImageLoader from "cornerstone-wado-image-loader";
// import { htmlparser2 } from '_react-html-parser@2.0.2@react-html-parser'

cornerstoneTools.external.cornerstone = cornerstone;
cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
// cornerstoneWebImageLoader.external.cornerstone = cornerstone
cornerstoneWadoImageLoader.external.cornerstone = cornerstone;

class StudyBrowserList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      caseId: props.caseId.split("_")[0],
      dateSeries: [],
      dataValidContnt: [],
      load: true,
    };
    this.config = JSON.parse(localStorage.getItem("config"));
  }
  componentDidMount() {
    const token = localStorage.getItem("token");
    const params = {
      mainItem: this.state.caseId,
      type: "pid",
      otherKeyword: "",
    };
    const headers = {
      Authorization: "Bearer ".concat(token),
    };

    axios
      .post(
        this.config.record.getSubListForMainItem_front,
        qs.stringify(params)
      )
      .then((response) => {
        const data = response.data;
        console.log("getSubListForMainItem_front data", data);
        if (data.status !== "okay") {
          console.log("Not okay");
          // window.location.href = '/'
        } else {
          const subList = data.subList;
          let theList = [];
          // const params={caseId:this.state.caseId}
          Object.keys(subList).map((key, value) => {
            const seriesLst = subList[key];
            seriesLst.map((serie, index) => {
              Promise.all([
                axios.post(
                  this.config.draft.getDataPath,
                  qs.stringify({ caseId: serie["caseId"] }),
                  { headers }
                ),
                axios.post(
                  this.config.data.getDataListForCaseId,
                  qs.stringify({ caseId: serie["caseId"] })
                ),
              ]).then(([annotype, dicom]) => {
                theList.push({
                  date: serie["date"],
                  caseId: serie["caseId"],
                  Description: serie["description"],
                  href:
                    "/case/" +
                    serie["caseId"].replace("#", "%23") +
                    "/" +
                    annotype.data,
                  image: dicom.data[parseInt(dicom.data.length / 3)],
                });
                console.log("leftkey", theList);
                this.setState({ dateSeries: theList });
              });
            });
          });
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  componentDidUpdate(prevProps, prevState) {
    // if (prevState !== this.state) {
    //   let flag = 0;
    //   let dateSeries = this.state.dateSeries;
    //   for (let j = 0; j < dateSeries.length; j++) {
    //     for (let i = 0; i < dateSeries.length - j - 1; i++) {
    //       if (parseInt(dateSeries[i].date) < parseInt(dateSeries[i + 1].date)) {
    //         let temp = dateSeries[i];
    //         dateSeries[i] = dateSeries[i + 1];
    //         dateSeries[i + 1] = temp;
    //         flag = 1;
    //       }
    //     }
    //   }
    //   if (flag === 1) {
    //     this.setState({ dateSeries: dateSeries });
    //   } else {
    //     dateSeries.map((serie, index) => {
    //       const previewId = "preview-" + index;
    //       const element = document.getElementById(previewId);
    //       let imageId = serie.image;
    //       // console.log('preview',element)
    //       cornerstone.enable(element);
    //       cornerstone
    //         .loadAndCacheImage(imageId.replace("#", "%23"))
    //         .then(function (image) {
    //           // console.log('cache')
    //           var viewport = cornerstone.getDefaultViewportForImage(
    //             element,
    //             image
    //           );
    //           viewport.voi.windowWidth = 1600;
    //           viewport.voi.windowCenter = -600;
    //           viewport.scale = 0.3;
    //           cornerstone.setViewport(element, viewport);
    //           cornerstone.displayImage(element, image);
    //         });
    //     });
    //   }
    // }
  }

  render() {
    const { dataValidContnt, dateSeries } = this.state;
    return (
      <div className="preview">
        {/* {dateSeries.map((serie, index) => {
          var validStatus = serie.validInfo.status;
          var validInfo = serie.validInfo.message;
          var statusIcon = "";
          if (validStatus === "failed") {
            if (validInfo === "Files been manipulated") {
              statusIcon = (
                <div>
                  <CloseCircleOutlined style={{ color: "rgba(219, 40, 40)" }} />
                  &nbsp;
                  <p>影像发生篡改</p>
                </div>
              );
            } else if (validInfo === "Errors occur during preprocess") {
              statusIcon = (
                <div>
                  <CloseCircleOutlined style={{ color: "rgba(219, 40, 40)" }} />
                  &nbsp;
                  <p>软件预处理出错</p>
                </div>
              );
            } else if (validInfo === "caseId not found") {
              statusIcon = (
                <div>
                  <CloseCircleOutlined style={{ color: "rgba(219, 40, 40)" }} />
                  &nbsp;
                  <p>数据未入库</p>
                </div>
              );
            }
          } else if (validStatus === "ok") {
            statusIcon = <CheckCircleOutlined style={{ color: "#52c41a" }} />;
          } else {
            statusIcon = <SyncOutlined spin />;
          }
          let previewId = "preview-" + index;
          let keyId = "key-" + index;
          // console.log('render',previewId)
          return (
            <Card
              onClick={(e) =>
                this.props.handleClickScreen(e, serie.href, validStatus)
              }
              key={keyId}
            >
              <div className="preview-canvas" id={previewId}></div>
              <Card.Content>
                {statusIcon}
                <Card.Description>
                  {serie.date + "\n " + serie.Description}
                </Card.Description>
              </Card.Content>
            </Card>
          );
        })} */}
      </div>
    );
  }
}

export default StudyBrowserList;
