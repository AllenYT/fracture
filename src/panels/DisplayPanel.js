import React, { Component } from "react";
import CornerstoneElement from "../components/CornerstoneElement";
import * as cornerstone from "cornerstone-core";
import axios from "axios";
import qs from "qs";
import dicomParser from "dicom-parser";
class DisplayPanel extends Component {
  constructor(props) {
    super(props);
    this.config = JSON.parse(localStorage.getItem("config"));
    const temp = window.location.pathname.split("/case/")[1].split("/")[0];
    this.state = {
      caseId: temp.replace("%23", "#"),
      username: localStorage.getItem("username"),
      modelName: window.location.pathname.split("/")[3],
      stack: {},
      show: false,
    };
  }
  handleClickScreen(e, href, status) {
    console.log("card", href);
    if (status === "ok") {
      if (
        window.location.pathname.split("/case/")[1].split("/")[0] !==
        href.split("/case/")[1].split("/")[0]
      ) {
        this.setState({
          caseId: href.split("/case/")[1].split("/")[0],
          username: href.split("/")[3],
          show: false,
        });
        // this.nextPath(href)
        window.location.href = href;
      }
    }
  }

  sliceIdxSort(prop) {
    return function (a, b) {
      var value1 = a[prop];
      var value2 = b[prop];
      return value1 - value2;
    };
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.caseId !== this.state.caseId) {
      console.log(prevState.caseId, this.state.caseId);
      let noduleNo = -1;
      if (this.props.location.hash !== "")
        noduleNo = parseInt(this.props.location.hash.split("#").slice(-1)[0]);

      const dataParams = {
        caseId: this.state.caseId,
      };
      const draftParams = {
        caseId: this.state.caseId,
        username: this.state.modelName,
        // username:'deepln'
      };
      const readonlyParams = {
        caseId: this.state.caseId,
        username: this.state.username,
        // username: this.state.modelName,
      };

      const token = localStorage.getItem("token");
      const headers = {
        Authorization: "Bearer ".concat(token), //add the fun of check
      };

      if (this.state.modelName === "origin") {
        axios
          .post(this.config.data.getDataListForCaseId, qs.stringify(dataParams))
          .then((dataResponse) => {
            cornerstone
              .loadAndCacheImage(dataResponse.data[0])
              .then((image) => {
                // const readonly = readonlyResponse.data.readonly === 'true'
                console.log("image info", image.data);
                // console.log('parse',dicomParser.parseDicom(image))
                const dicomtag = image.data;
                const stack = {
                  imageIds: dataResponse.data,
                  caseId: this.state.caseId,
                  boxes: [],
                  readonly: true,
                  draftStatus: -1,
                  noduleNo: noduleNo,
                  dicomTag: dicomtag,
                };

                this.setState({ stack: stack, show: true });
              });
          })
          .catch((error) => {
            console.log(error);
          });
      } else {
        // const token = localStorage.getItem('token')
        // const headers = {
        //     'Authorization': 'Bearer '.concat(token)//add the fun of check
        // }
        Promise.all([
          axios.post(
            this.config.data.getDataListForCaseId,
            qs.stringify(dataParams)
          ),
          axios.post(
            this.config.draft.getRectsForCaseIdAndUsername,
            qs.stringify(draftParams)
          ),
          axios.post(this.config.draft.readonly, qs.stringify(readonlyParams), {
            headers,
          }),
        ]).then(([dataResponse, draftResponse, readonlyResponse]) => {
          const readonly = readonlyResponse.data.readonly === "true";
          console.log("readonly", readonly);
          // const readonly = false
          cornerstone.loadAndCacheImage(dataResponse.data[0]).then((image) => {
            // const readonly = readonlyResponse.data.readonly === 'true'
            console.log("image info", image.data);
            // console.log('parse',dicomParser.parseDicom(image))
            const dicomtag = image.data;
            let draftStatus = -1;
            // if (!readonly)
            draftStatus = readonlyResponse.data.status;
            let boxes = draftResponse.data;
            // dataResponse.data.forEach((item, index) => {
            //   dataResponse.data[index] = item.replace("#", "%23");
            // });
            boxes.sort(this.sliceIdxSort("slice_idx"));
            for (var i = 0; i < boxes.length; i++) {
              boxes[i].nodule_no = "" + i;
              boxes[i].rect_no = "a00" + i;
            }
            console.log("boxidx", boxes);
            const stack = {
              imageIds: dataResponse.data,
              caseId: this.state.caseId,
              boxes: boxes,
              readonly: readonly,
              draftStatus: draftStatus,
              noduleNo: noduleNo,
              dicomTag: dicomtag,
            };
            console.log("test", dicomtag);
            console.log("draftdata", draftResponse, draftParams);
            console.log("dataResponse", dataResponse);
            this.setState({ stack: stack, show: true });
          });
        });
      }
    }
  }

  async componentWillMount() {
    const promise = new Promise((resolve, reject) => {
      axios.get(process.env.PUBLIC_URL + "/config.json").then((res) => {
        const config = res.data;
        console.log("config", config);
        localStorage.setItem("config", JSON.stringify(config));
        resolve(config);
      }, reject);
    });
    const config = await promise;
    this.config = config;
    // first let's check the status to display the proper contents.
    // const pathname = window.location.pathname
    // send our token to the server, combined with the current pathname
    let noduleNo = -1;
    if (this.props.location.hash !== "")
      noduleNo = parseInt(this.props.location.hash.split("#").slice(-1)[0]);

    const dataParams = {
      caseId: this.state.caseId,
    };
    const draftParams = {
      caseId: this.state.caseId,
      username: this.state.modelName,
      // username:'deepln'
    };
    const readonlyParams = {
      caseId: this.state.caseId,
      username: this.state.username,
      // username: this.state.modelName,
    };

    const token = localStorage.getItem("token");
    const headers = {
      Authorization: "Bearer ".concat(token), //add the fun of check
    };

    if (this.state.modelName === "origin") {
      axios
        .post(this.config.data.getDataListForCaseId, qs.stringify(dataParams))
        .then((dataResponse) => {
          cornerstone.loadAndCacheImage(dataResponse.data[0]).then((image) => {
            // const readonly = readonlyResponse.data.readonly === 'true'
            console.log("image info", image.data);
            // console.log('parse',dicomParser.parseDicom(image))
            const dicomtag = image.data;
            const stack = {
              imageIds: dataResponse.data,
              caseId: this.state.caseId,
              boxes: [],
              readonly: true,
              draftStatus: -1,
              noduleNo: noduleNo,
              dicomTag: dicomtag,
            };
            this.setState({ stack: stack, show: true });
          });
        })
        .catch((error) => {
          console.log(error);
        });
    } else {
      // const token = localStorage.getItem('token')
      // const headers = {
      //     'Authorization': 'Bearer '.concat(token)//add the fun of check
      // }
      Promise.all([
        axios.post(
          this.config.data.getDataListForCaseId,
          qs.stringify({ caseId: this.state.caseId })
        ),
        axios.post(
          this.config.draft.getRectsForCaseIdAndUsername,
          qs.stringify(draftParams)
        ),
        axios.post(this.config.draft.readonly, qs.stringify(readonlyParams), {
          headers,
        }),
      ]).then(([dataResponse, draftResponse, readonlyResponse]) => {
        const readonly = readonlyResponse.data.readonly === "true";
        console.log("readonly", readonly);
        // const readonly = false
        cornerstone.loadAndCacheImage(dataResponse.data[0]).then((image) => {
          console.log("image info", image.data);
          const dicomtag = image.data;
          let draftStatus = -1;
          draftStatus = readonlyResponse.data.status;
          let boxes = draftResponse.data;
          console.log("boxes", boxes);
          for (var i = 0; i < boxes.length; i++) {
            boxes[i].backend_no = i;
          }
          if (boxes !== "") boxes.sort(this.sliceIdxSort("slice_idx"));
          for (var i = 0; i < boxes.length; i++) {
            boxes[i].nodule_no = "" + i;
            boxes[i].rect_no = "a00" + i;
          }
          console.log("boxidx", boxes);
          const stack = {
            imageIds: dataResponse.data,
            caseId: this.state.caseId,
            boxes: boxes,
            // readonly: false,
            readonly: readonly,
            draftStatus: draftStatus,
            noduleNo: noduleNo,
            dicomTag: dicomtag,
          };

          // console.log('readonly',readonlyResponse)
          // console.log('draftdata',draftResponse,draftParams)
          // console.log('dataResponse',dataResponse)
          this.setState({ stack: stack, show: true });
        });
      });
    }
  }

  render() {
    console.log(
      "stack",
      this.state.stack,
      this.state.caseId,
      this.props.location.hash
    );
    if (this.state.show) {
      return (
        <div>
          {/* {this.state.caseId} */}
          <CornerstoneElement
            stack={{
              ...this.state.stack,
            }}
            caseId={this.state.caseId}
            username={this.state.username}
            modelName={this.state.modelName}
            handleClickScreen={this.handleClickScreen.bind(this)}
          />
        </div>
      );
    } else {
      return <div>数据载入中...</div>;
    }
  }
}

export default DisplayPanel;
