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
    this.state = {
      caseId: window.location.pathname.split("/case/")[1].split("/")[0],
      username: localStorage.getItem("username"),
      modelName: window.location.pathname.split("/")[3],
      studyList: [],
      stack: {},
      show: false,
    };

    this.nextPath = this.nextPath.bind(this);
  }
  nextPath(path) {
    this.props.history.push(path);
  }
  handleClickScreen(e, href) {
    console.log("card", href);
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
        noduleNo = parseInt(this.props.location.hash.split("#")[1]);

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
      noduleNo = parseInt(this.props.location.hash.split("#")[1]);

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
        // const readonly = false
        cornerstone.loadAndCacheImage(dataResponse.data[0]).then((image) => {
          console.log("image info", image.data);
          const dicomtag = image.data;
          let draftStatus = -1;
          draftStatus = readonlyResponse.data.status;
          let boxes = draftResponse.data;
          console.log("boxes", boxes);
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
            readonly: false,
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

    // let imageIds = []

    // function pad(num, size) {
    //     var s = num + "";
    //     while (s.length < size)
    //         s = "0" + s;
    //     return s;
    // }

    // for (var i = 0; i <= 313; i++) {
    //     const filename = "dicomweb://localhost:8080/data/0000282967_20180625_BC/" + pad(i, 3) + ".dcm"

    //     imageIds.push(filename)
    // }

    //   const params = {
    //     mainItem: window.location.pathname.split('/case/')[1].split('_')[0],
    //     type: 'pid', //'pid'
    //     otherKeyword: ''
    // }
    // console.log("param",params)
    // axios.post(recordConfig.getSubListForMainItem_front, qs.stringify(params), {headers}).then((response) => {
    //     const data = response.data
    //     if (data.status !== 'okay') {
    //         console.log("Not okay")
    //         // window.location.href = '/'
    //     } else {
    //         console.log('sublist',data.subList)
    //         const subList = data.subList
    //         let totalDates = 0
    //         let totalStudies = 0
    //         for (const subKey in subList) {
    //             totalDates++
    //             totalStudies += subList[subKey].length
    //         }
    //         // console.log('MAINITEM', this.props.mainItem)
    //         subList = Object.keys(subList)
    //         console.log("study",subList)
    //         this.setState({studyList: subList})
    //     }
    // }).catch((error) => {
    //     console.log(error)
    // })
  }

  render() {
    console.log("stack", this.state.stack);
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
