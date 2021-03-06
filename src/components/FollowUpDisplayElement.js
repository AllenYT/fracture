import React, { Component } from 'react'
import CornerstoneElement from '../components/CornerstoneElement'
import * as cornerstone from 'cornerstone-core'
import axios from 'axios'
import qs from 'qs'
import _ from 'lodash'
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
  componentWillUnmount() {}
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
        // if (curData && curData.length) {
        //   const curImagePromise = curData.map((curImageId) => cornerstone.loadAndCacheImage(curImageId))
        //   Promise.all(curImagePromise).then(() => console.log('curData loading completed'))
        // }
        // if (preData && preData.length) {
        //   const preImagePromise = preData.map((preImageId) => cornerstone.loadAndCacheImage(preImageId))
        //   Promise.all(preImagePromise).then(() => console.log('preData loading completed'))
        // }
        const frData = followRectsResponse.data
        // const curBox = followRectsResponse.data["rects1"];
        // const preBox = followRectsResponse.data["rects2"];
        // console.log('curbox',curBox)
        const curBox = [].concat(frData.later)
        const preBox = [].concat(frData.earlier)
        const matchPairs = frData.matchPairs

        if (curBox && curBox.length) {
          curBox.sort(this.sliceIdxSort('slice_idx'))
          curBox.forEach((item, index) => {
            item.visibleIdx = index
            item.visible = true
            item.checked = false
            item.matched = false
          })
        }

        if (preBox && preBox.length) {
          preBox.sort(this.sliceIdxSort('slice_idx'))
          preBox.forEach((item, index) => {
            item.visibleIdx = index
            item.visible = true
            item.checked = false
            item.matched = false
          })
        }
        const matchBox = []
        const newBox = []
        const vanishBox = []

        matchPairs.forEach((pairItem, pairIndex) => {
          let curIndex = _.findIndex(curBox, { documentId: pairItem[1] })
          let preIndex = _.findIndex(preBox, { documentId: pairItem[0] })
          if (curIndex !== -1 && preIndex !== -1) {
            curBox[curIndex].matched = true
            preBox[preIndex].matched = true
            matchBox.push({
              earlier: preBox[preIndex],
              later: curBox[curIndex],
            })
          }
        })
        curBox.forEach((item) => {
          if (!item.matched) {
            delete item.matched
            newBox.push(item)
          } else {
            delete item.matched
          }
        })
        preBox.forEach((item) => {
          if (!item.matched) {
            delete item.matched
            vanishBox.push(item)
          } else {
            delete item.matched
          }
        })
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
          registerBoxes: {
            match: matchBox,
            new: newBox,
            vanish: vanishBox,
            patientId: frData.patientId,
          },
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
      return (
        <div id="loading-panel">
          <div className="sk-chase">
            <div className="sk-chase-dot"></div>
            <div className="sk-chase-dot"></div>
            <div className="sk-chase-dot"></div>
            <div className="sk-chase-dot"></div>
            <div className="sk-chase-dot"></div>
            <div className="sk-chase-dot"></div>
          </div>
        </div>
      )
    }
    // if (this.state.show) {

    // } else {
    //   return <div>???????????????...</div>
    // }
  }
}

export default FollowUpDisplayElement
