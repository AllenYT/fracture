import React, {Component} from 'react'
import CornerstoneElement from '../components/CornerstoneElement'
import * as cornerstone from "cornerstone-core"
import axios from 'axios'
import qs from 'qs'
import dicomParser from 'dicom-parser'
const config = require('../config.json')
const dataConfig = config.data
const draftConfig = config.draft
const recordConfig = config.record

class DisplayPanel extends Component {

  constructor(props) {
    super(props)
    this.state = {
      caseId: window.location.pathname.split('/case/')[1].split('/')[0],
      username: window.location.pathname.split('/')[3],
      studyList:[],
      stack: {},
      show: false
    }
  }

  componentWillMount() {

    // first let's check the status to display the proper contents.
    // const pathname = window.location.pathname
    // send our token to the server, combined with the current pathname
    let noduleNo = -1
    if (this.props.location.hash !== '')
      noduleNo = parseInt(this.props.location.hash.split('#')[1])

    const dataParams = {
      caseId: this.state.caseId
    }
    const draftParams = {
      caseId: this.state.caseId,
      username: this.state.username
      // username:'deepln'
    }
    const readonlyParams = {
      caseId: this.state.caseId,
      username: this.state.username
    }

    const token = localStorage.getItem('token')
    const headers = {
      'Authorization': 'Bearer '.concat(token) //add the fun of check
    }
    let requestParams = []

    if (this.state.username === 'origin') {

      axios.post(dataConfig.getDataListForCaseId, qs.stringify(dataParams)).then(dataResponse => {
        cornerstone
        .loadAndCacheImage(dataResponse.data[0])
        .then(image => {
          // const readonly = readonlyResponse.data.readonly === 'true'
          console.log('image info',image.data)
          // console.log('parse',dicomParser.parseDicom(image))
          const dicomtag = image.data
           const stack = {
          imageIds: dataResponse.data,
          caseId: this.state.caseId,
          boxes: [],
          readonly: true,
          draftStatus: -1,
          noduleNo: noduleNo,
          dicomTag:dicomtag
        }
        this.setState({stack: stack, show: true})
          })
       
      }).catch(error => {
        console.log(error)
      })

    } else {

      // const token = localStorage.getItem('token')
      // const headers = {
      //     'Authorization': 'Bearer '.concat(token)//add the fun of check
      // }
      Promise.all([
        axios.post(dataConfig.getDataListForCaseId, qs.stringify(dataParams)),
        axios.post(draftConfig.getRectsForCaseIdAndUsername, qs.stringify(draftParams)),
        axios.post(draftConfig.readonly, qs.stringify(readonlyParams), {headers})
      ]).then(([dataResponse, draftResponse, readonlyResponse]) => {
        // console.log(dataResponse.data)
        // console.log(draftResponse.data)
        // console.log(readonlyResponse.data)
        const readonly = readonlyResponse.data.readonly === 'true'
        // const readonly = false
        cornerstone
        .loadAndCacheImage(dataResponse.data[0])
        .then(image => {
          // const readonly = readonlyResponse.data.readonly === 'true'
          console.log('image info',image.data)
          // console.log('parse',dicomParser.parseDicom(image))
          const dicomtag = image.data
          let draftStatus = -1
          if (!readonly)
            draftStatus = readonlyResponse.data.status
          const stack = {
            imageIds: dataResponse.data,
            caseId: this.state.caseId,
            boxes: draftResponse.data,
            readonly: readonly,
            draftStatus: draftStatus,
            noduleNo: noduleNo,
            dicomTag:dicomtag
          }
          console.log('test',dicomtag)
          console.log('draftdata',draftResponse,draftParams)
          console.log('dataResponse',dataResponse)
          this.setState({stack: stack, show: true})
          })
       
      })
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
    console.log('stack',this.state.stack)
    if (this.state.show) {
      return (
        <div>
        {/* {this.state.caseId} */}
        <CornerstoneElement stack={{
            ...this.state.stack
          }} caseId={this.state.caseId} username={this.state.username} studyList={this.state.studyList} />
        </div>
      )
    } else {
      return (<div>数据载入中...</div>)
    }

  }
}

export default DisplayPanel
