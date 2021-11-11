import React, { Component } from 'react'
import CornerstoneElement from '../components/CornerstoneElement'
import * as cornerstone from 'cornerstone-core'
import axios from 'axios'
import qs from 'qs'
import FollowUpElement from '../components/FollowUpElement'

class FollowUpDisplayPanel extends Component {
  constructor(props) {
    super(props)
    this.state = {
      curCaseId: window.location.pathname.split('/followup/')[1].split('/')[0].split('&')[0],
      preCaseId: window.location.pathname.split('/followup/')[1].split('/')[0].split('&')[1],
      username: window.location.pathname.split('/')[3],
      stack: {},
      show: false,
    }
    this.config = JSON.parse(localStorage.getItem('config'))
    this.nextPath = this.nextPath.bind(this)
  }

  nextPath(path) {
    this.props.history.push(path)
  }

  sliceIdxSort(prop) {
    return function (a, b) {
      var value1 = a[prop]
      var value2 = b[prop]
      return value1 - value2
    }
  }

  async componentWillMount() {
    const curDataParams = {
      caseId: this.state.curCaseId,
    }

    const preDataParams = {
      caseId: this.state.preCaseId,
    }

    const followRectsParams = {
      earlierCaseId: this.state.preCaseId,
      laterCaseId: this.state.curCaseId,
    }

    const token = localStorage.getItem('token')
    const headers = {
      Authorization: 'Bearer '.concat(token), //add the fun of check
    }

    if (this.state.username === 'origin') {
      //   axios.post(dataConfig.getDataListForCaseId, qs.stringify(dataParams)).then(dataResponse => {
      //     cornerstone
      //     .loadAndCacheImage(dataResponse.data[0])
      //     .then(image => {
      //       // const readonly = readonlyResponse.data.readonly === 'true'
      //       console.log('image info',image.data)
      //       // console.log('parse',dicomParser.parseDicom(image))
      //       const dicomtag = image.data
      //        const stack = {
      //       imageIds: dataResponse.data,
      //       caseId: this.state.caseId,
      //       boxes: [],
      //       readonly: true,
      //       draftStatus: -1,
      //       noduleNo: noduleNo,
      //       dicomTag:dicomtag
      //     }
      //     this.setState({stack: stack, show: true})
      //       })
      //   }).catch(error => {
      //     console.log(error)
      //   })
    } else {
      const getCurDataPromise = new Promise((resolve, reject) => {
        axios.post(this.config.data.getDataListForCaseId, qs.stringify(curDataParams)).then((res) => {
          const curDataRes = res.data
          resolve(curDataRes)
        }, reject)
      })
      const curData = await getCurDataPromise

      const getPreDataPromise = new Promise((resolve, reject) => {
        axios.post(this.config.data.getDataListForCaseId, qs.stringify(preDataParams)).then((res) => {
          const preDataRes = res.data
          resolve(preDataRes)
        }, reject)
      })
      const preData = await getPreDataPromise

      const getCurBoxPromise = new Promise((resolve) => {
        axios.post(this.config.draft.getRectsForCaseIdAndUsername, qs.stringify(curDataParams)).then((res) => {
          const curBox = res.data
          resolve(curBox)
        })
      })
      const curBox = await getCurBoxPromise

      const getPreBoxPromise = new Promise((resolve) => {
        axios.post(this.config.draft.getRectsForCaseIdAndUsername, qs.stringify(preDataParams)).then((res) => {
          const preBox = res.data
          resolve(preBox)
        })
      })

      const preBox = await getPreBoxPromise

      axios.post(this.config.draft.getRectsForFollowUp, qs.stringify(followRectsParams)).then((followRectsResponse) => {
        console.log('followRectsResponse', followRectsResponse)
        // const curBox = followRectsResponse.data["rects1"];
        // const preBox = followRectsResponse.data["rects2"];
        // console.log('curbox',curBox)
        if (curBox !== '') {
          curBox.sort(this.sliceIdxSort('slice_idx'))
          for (var i = 0; i < curBox.length; i++) {
            curBox[i].nodule_no = '' + i
            curBox[i].rect_no = 'a00' + i
          }
        }

        if (preBox !== '') {
          preBox.sort(this.sliceIdxSort('slice_idx'))
          for (var i = 0; i < preBox.length; i++) {
            preBox[i].nodule_no = '' + i
            preBox[i].rect_no = 'a00' + i
          }
        }

        let initialViewport = cornerstone.getDefaultViewport(null, undefined)
        if (initialViewport.voi.windowWidth === undefined || initialViewport.voi.windowCenter === undefined) {
          initialViewport.voi.windowCenter = -600
          initialViewport.voi.windowWidth = 1600
        } else {
          console.log('viewport', initialViewport.voi.windowCenter, initialViewport.voi.windowWidth)
        }

        const stack = {
          curImageIds: curData,
          curCaseId: this.state.curCaseId,
          curBoxes: curBox,
          preImageIds: preData,
          preCaseId: this.state.preCaseId,
          preBoxes: preBox,
          initialViewport: initialViewport,
        }

        console.log(stack)

        this.setState({ stack: stack, show: true })
      })
    }
  }

  render() {
    console.log('stack', this.state.stack)
    if (this.state.show) {
      return (
        <div>
          <FollowUpElement
            stack={{
              ...this.state.stack,
            }}
            username={this.state.username}
            onRef={(input) => {
              this.props.onRef(input)
            }}
          />
        </div>
      )
    } else {
      return <div>数据载入中...</div>
    }
  }
}

export default FollowUpDisplayPanel
