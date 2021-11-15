import React, { Component } from 'react'
import CornerstoneElement from '../components/CornerstoneElement'
import * as cornerstone from 'cornerstone-core'
import axios from 'axios'
import qs from 'qs'
import FollowUpElement from '../components/FollowUpElement'

class FollowUpDisplayElement extends Component {
  constructor(props) {
    super(props)
    this.state = {
      // curCaseId: props.curCaseId,
      // preCaseId: props.preCaseId,
      // username: props.username,
      curImageIds: [],
      curCaseId: '',
      curBoxes: [],
      preImageIds: [],
      preCaseId: '',
      preBoxes: [],
      curInfo: {},
      preInfo: {},
      registerBoxes: [],
      // initialViewport: {},
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

  async componentDidMount() {
    if (this.props.preCaseId && this.props.curCaseId) {
      this.loadDoubleInfo(this.props.curCaseId, this.props.preCaseId)
      // this.loadRegisterRects(this.props.curCaseId, this.props.preCaseId)
    }
  }
  loadSingleInfo(caseId) {
    Promise.all([
      axios.post(this.config.data.getDataListForCaseId, qs.stringify({ caseId })),
      axios.post(this.config.draft.getRectsForCaseIdAndUsername, qs.stringify({ caseId: caseId, username: 'deepln' })),
    ]).then(([imageIdsResponse, nodulesResponse]) => {
      console.log('imageIdsResponse', imageIdsResponse)
      console.log('nodulesResponse', nodulesResponse)
      const curData = imageIdsResponse.data
      const curBox = nodulesResponse.data
      if (curBox && curBox.length) {
        curBox.sort(this.sliceIdxSort('slice_idx'))
        curBox.forEach((item, index) => {
          item.visibleIdx = index
          item.visible = true
          item.checked = false
        })
      }
      const curInfo = {
        curImageIds: curData,
        curCaseId: caseId,
        curBoxes: curBox,
      }

      this.setState({
        curInfo,
        show: true,
      })
    })
  }
  loadDoubleInfo(curCaseId, preCaseId) {
    const curDataParams = {
      caseId: curCaseId,
    }

    const preDataParams = {
      caseId: preCaseId,
    }

    const followRectsParams = {
      earlierCaseId: preCaseId,
      earlierUsername: 'deepln',
      laterCaseId: curCaseId,
      laterUsername: 'deepln',
    }

    const token = localStorage.getItem('token')
    const headers = {
      Authorization: 'Bearer '.concat(token), //add the fun of check
    }
    const getCurDataPromise = axios.post(this.config.data.getDataListForCaseId, qs.stringify(curDataParams))

    const getPreDataPromise = axios.post(this.config.data.getDataListForCaseId, qs.stringify(preDataParams))

    Promise.all([getCurDataPromise, getPreDataPromise, axios.post(this.config.draft.getRectsForFollowUp, qs.stringify(followRectsParams))]).then(
      ([curDataResponse, preDataResponse, followRectsResponse]) => {
        console.log('followRectsResponse', followRectsResponse)
        console.log('curDataResponse', curDataResponse)
        console.log('preDataResponse', preDataResponse)
        const curData = curDataResponse.data
        const preData = preDataResponse.data
        const frData = followRectsResponse.data
        // const curBox = followRectsResponse.data["rects1"];
        // const preBox = followRectsResponse.data["rects2"];
        // console.log('curbox',curBox)
        const curBox = [].concat(frData.earlier)
        const preBox = [].concat(frData.later)
        if (curBox && curBox.length) {
          curBox.sort(this.sliceIdxSort('slice_idx'))
          curBox.forEach((item, index) => {
            item.visibleIdx = index
            item.visible = true
            item.checked = false
          })
        }

        if (preBox && preBox.length) {
          preBox.sort(this.sliceIdxSort('slice_idx'))
          preBox.forEach((item, index) => {
            item.visibleIdx = index
            item.visible = true
            item.checked = false
          })
        }

        const curInfo = {
          curImageIds: curData,
          curCaseId: curCaseId,
          curBoxes: curBox,
        }
        const preInfo = {
          preImageIds: preData,
          preCaseId: preCaseId,
          preBoxes: preBox,
        }
        this.setState({
          curInfo,
          preInfo,
          registerBoxes: frData,
          show: true,
        })
      }
    )
  }
  // loadRegisterRects(curCaseId, preCaseId) {
  //   const params = {
  //     earlierCaseId: preCaseId,
  //     laterCaseId: curCaseId,
  //   }
  //   axios.post(this.config.draft.getRectsForFollowUp, qs.stringify(params)).then((followupRectRes) => {
  //     console.log('followupRect', followupRectRes.data)
  //     const followupRect = followupRectRes.data
  //     if (followupRect && followupRect['match'].length) {
  //       followupRect['match'].forEach((item, index) => {
  //         item['earlier'].cancelOpen = false
  //         item['earlier'].checked = false
  //         item['later'].cancelOpen = false
  //         item['later'].checked = false
  //       })
  //       followupRect['new'].forEach((item, index) => {
  //         item.checked = false
  //         item.disabled = false
  //       })
  //       followupRect['vanish'].forEach((item, index) => {
  //         item.checked = false
  //         item.disabled = false
  //       })
  //     }
  //     this.setState({ registerBoxes: followupRect })
  //   })
  // }
  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.curCaseId !== this.props.curCaseId || prevProps.preCaseId !== this.props.preCaseId) {
      if (this.props.curCaseId && this.props.preCaseId) {
        this.loadDoubleInfo(this.props.curCaseId, this.props.preCaseId)
        // this.loadRegisterRects(this.props.curCaseId, this.props.preCaseId)
        console.log('loadRegisterRects', this.state.registerBoxes)
      } else if (this.props.curCaseId) {
        console.log('display componentDidUpdate')
        this.loadSingleInfo(this.props.curCaseId)
      }
    }
  }
  render() {
    const { curInfo, preInfo, registerBoxes, show } = this.state
    if (show) {
      return (
        <FollowUpElement
          curInfo={curInfo}
          preInfo={preInfo}
          registerBoxes={registerBoxes}
          username={this.props.username}
          onRef={(input) => {
            this.props.onRef(input)
          }}
        />
      )
    } else {
      return <div>数据载入中...</div>
    }
    // if (this.state.show) {

    // } else {
    //   return <div>数据载入中...</div>
    // }
  }
}

export default FollowUpDisplayElement
