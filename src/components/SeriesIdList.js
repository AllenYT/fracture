import React, { Component } from 'react'
import { Popup, Button, Checkbox } from 'semantic-ui-react'
import ReactHtmlParser from 'react-html-parser'
import { Tooltip, notification } from 'antd'
import { RightOutlined, CheckCircleOutlined, CloseCircleOutlined, SyncOutlined } from '@ant-design/icons'
import { withRouter } from 'react-router-dom'
import axios from 'axios'
import qs from 'qs'
import CurrentDraftsDisplay from './CurrentDraftsDisplay'

import '../css/seriesIdList.css'
import { Link } from 'react-router-dom/cjs/react-router-dom.min'
// import { connect } from '_echarts@5.1.2@echarts'

// const storecid = []
class SeriesIdList extends Component {
  constructor(props) {
    super(props)
    this.displayStudy = this.displayStudy.bind(this)
    this.state = {
      contextRef: props.contextRef,
      popupHovers: [],
      dataValidContnt: [],
      allResults: [],
      // cart: new Set()
    }
    this.config = JSON.parse(localStorage.getItem('config'))
    this.storeCaseId = this.storeCaseId.bind(this)
    this.validValue = this.validValue.bind(this)
    this.resultsUpdate = this.resultsUpdate.bind(this)
    // this.saveCart = this.saveCart.bind(this)
  }

  nextPath(path) {
    this.props.history.push(path)
  }

  displayStudy(item, status, e) {
    if (status === 'ok') {
      const token = localStorage.getItem('token')
      const headers = {
        Authorization: 'Bearer '.concat(token),
      }
      const params = {
        caseId: item['caseId'],
      }
      axios
        .post(this.config.draft.getDataPath, qs.stringify(params), { headers })
        .then((res) => {
          console.log('result from server', res.data)
          console.log('params', params)
          const oa = document.createElement('a')
          oa.href = '/case/' + params.caseId + '/' + res.data
          oa.setAttribute('target', '_blank')
          oa.setAttribute('rel', 'nofollow noreferrer')
          document.body.appendChild(oa)
          oa.click()
        })
        .catch((err) => {
          console.log(err)
        })
    }
  }

  storeCaseId(e, { checked, value, id }) {
    console.log('checked', checked)
    console.log(value)
    let params = {}
    if (checked) params = { status: 'add', value: value }
    else {
      params = { status: 'del', value: value }
    }
    this.props.parent.getCheckedSeries(this, params)
  }

  ischeck() {
    return true
  }

  validValue(value) {
    if (this.props.cart.has(value)) return true
    else return false
  }
  popupEnter(index) {
    console.log('popupEnter', index)
    const popupHovers = this.state.popupHovers
    popupHovers[index] = true
    this.setState({
      popupHovers,
    })
  }
  popupLeave(index) {
    const popupHovers = this.state.popupHovers
    popupHovers[index] = false
    this.setState({
      popupHovers,
    })
  }
  onPopupHide(index) {
    console.log('onPopupHide', index)
    this.setState({
      onPopupIndex: index,
    })
  }

  resultsUpdate() {
    const content = this.props.content
    const token = localStorage.getItem('token')
    const headers = {
      Authorization: 'Bearer '.concat(token),
    }
    var dataValidContnt = []
    var allResults = []
    for (var i = 0; i < content.length; i++) {
      console.log('content', content[i]['caseId'])
      const params = {
        caseId: content[i]['caseId'],
      }
      axios
        .post(this.config.draft.dataValid, qs.stringify(params))
        .then((validResponse) => {
          const validInfo = validResponse.data
          let validContent = {
            caseId: params.caseId,
            validInfo: validInfo,
          }
          dataValidContnt.push(validContent)
          this.setState({ dataValidContnt: dataValidContnt })
          if (validInfo.status === 'ok') {
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
                const modelList = res1.data.dataList
                const annoList = res2.data.dataList
                const reviewList = res3.data.dataList

                let resultsList = {
                  caseId: params.caseId,
                  modelList: modelList,
                  annoList: annoList,
                  reviewList: reviewList,
                }
                allResults.push(resultsList)
                this.setState({ allResults: allResults })
              })
              .catch((error) => {
                console.log(error)
              })
          }
        })
        .catch((error) => {
          console.log(error)
        })
    }
  }

  componentDidMount() {
    this.resultsUpdate()
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.content !== this.props.content) {
      const content = nextProps.content
      const token = localStorage.getItem('token')
      const headers = {
        Authorization: 'Bearer '.concat(token),
      }
      var dataValidContnt = []
      var allResults = []
      for (var i = 0; i < content.length; i++) {
        console.log('content', content[i])
        const params = {
          caseId: content[i]['caseId'],
        }
        axios.post(this.config.draft.dataValid, qs.stringify(params)).then((validResponse) => {
          const validInfo = validResponse.data
          let validContent = {
            caseId: params.caseId,
            validInfo: validInfo,
          }
          dataValidContnt.push(validContent)
          this.setState({ dataValidContnt: dataValidContnt })
          if (validInfo.status === 'ok') {
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
                const modelList = res1.data.dataList
                const annoList = res2.data.dataList
                const reviewList = res3.data.dataList

                let resultsList = {
                  caseId: params.caseId,
                  modelList: modelList,
                  annoList: annoList,
                  reviewList: reviewList,
                }
                allResults.push(resultsList)
                this.setState({ allResults: allResults })
              })
              .catch((error) => {
                console.log(error)
              })
          }
        })
      }
    }
  }

  notice(valid, e) {
    if (valid.status === 'failed') {
      if (valid['message'] === 'Files been manipulated') {
        if (document.getElementsByClassName('data-file-broken').length === 0) {
          notification.warning({
            className: 'data-file-broken',
            message: '提醒',
            style: {
              backgroundColor: 'rgba(255,232,230)',
            },
            description: '影像发生篡改，无法启动算法，请联系厂家技术支持工程师',
          })
        }
      } else if (valid['message'] === 'Errors occur during preprocess') {
        if (document.getElementsByClassName('process-error').length === 0) {
          notification.warning({
            className: 'process-error',

            message: '提醒',
            style: {
              backgroundColor: 'rgba(255,232,230)',
            },
            description: '软件预处理出错，请联系厂家技术支持工程师',
          })
        }
      } else if (valid['message'] === 'caseId not found') {
        if (document.getElementsByClassName('out-of-database').length === 0) {
          notification.warning({
            className: 'out-of-database',

            message: '提醒',
            style: {
              backgroundColor: 'rgba(255,232,230)',
            },
            description: '数据未入库，请联系厂家技术支持工程师',
          })
        }
      }
    }
  }

  render() {
    const onPopupIndex = this.state.onPopupIndex
    const content = this.props.content
    const pid = this.props.pid
    const { dataValidContnt, allResults } = this.state
    var resultsPopup = ''
    let CheckboxDis = {
      display: 'none',
    }
    if (localStorage.getItem('token') != null) {
      CheckboxDis = {
        display: 'block',
      }
    }

    // if (dataValidContnt.length !== 0) {
    resultsPopup = content.map((item, index) => {
      const idName = item.caseId + '_' + index
      var popupContent = ''
      var dataValidbyCaseId = ''
      var modelStr = ''
      var annoStr = ''
      var reviewStr = ''
      var statusIcon = ''
      // var
      console.log('datavalid', dataValidContnt, dataValidContnt.length)
      for (let i = 0; i < dataValidContnt.length; i++) {
        if (dataValidContnt[i].caseId === item['caseId']) {
          console.log('i', i, dataValidContnt[i].caseId, item['caseId'])
          dataValidbyCaseId = dataValidContnt[i].validInfo
          break
        }
      }
      // console.log('valid', dataValidbyCaseId)
      if (dataValidbyCaseId.status === 'failed') {
        statusIcon = <CloseCircleOutlined style={{ color: 'rgba(219, 40, 40)' }} />
        // if (dataValidbyCaseId.message === "Files been manipulated") {
        //   notification.warning("Files been manipulated");
        // } else if (
        //   dataValidbyCaseId.message === "Errors occur during preprocess"
        // ) {
        //   notification.warning("Errors occur during preprocess");
        // } else if (dataValidbyCaseId.message === "caseId not found") {
        //   notification.warning("caseId not found");
        // }
      } else if (dataValidbyCaseId.status === 'ok') {
        statusIcon = <CheckCircleOutlined style={{ color: '#52c41a' }} />
        for (let i = 0; i < allResults.length; i++) {
          console.log('allresults', allResults[i], item['caseId'])
          if (allResults[i].caseId === item['caseId']) {
            console.log('allresults', allResults[i])
            if (allResults[i].modelList.length > 0) {
              for (let j = 0; j < allResults[i].modelList.length; j++) {
                modelStr += '<div class="ui blue label">'
                modelStr += allResults[i].modelList[j]
                modelStr += '</div>'
              }
            } else {
              modelStr += '<div class="ui blue label">'
              modelStr += '暂无结果'
              modelStr += '</div>'
            }

            if (allResults[i].annoList.length > 0) {
              for (let j = 0; j < allResults[i].annoList.length; j++) {
                annoStr += '<div class="ui blue label">'
                annoStr += allResults[i].annoList[j]
                annoStr += '</div>'
              }
            } else {
              annoStr += '<div class="ui blue label">'
              annoStr += '暂无结果'
              annoStr += '</div>'
            }

            if (allResults[i].reviewList.length > 0) {
              for (let j = 0; j < allResults[i].reviewList.length; j++) {
                reviewStr += '<div class="ui blue label">'
                reviewStr += allResults[i].reviewList[j]
                reviewStr += '</div>'
              }
            } else {
              reviewStr += '<div class="ui blue label">'
              reviewStr += '暂无结果'
              reviewStr += '</div>'
            }
            popupContent = (
              <div>
                <h4>模型结果</h4>
                <div id="model-results">{ReactHtmlParser(modelStr)}</div>
                <h4>标注结果</h4>
                <div id="anno-results">{ReactHtmlParser(annoStr)}</div>
                {/* <h4>审核结果</h4>
                <div id="review-results">{ReactHtmlParser(reviewStr)}</div> */}
              </div>
            )
            break
          }
        }
      } else {
        statusIcon = <SyncOutlined spin />
      }

      return (
        <div key={index} className={'seriesidlist-popup-item'}>
          <div className={'seriesidlist-popup-item-left'}>
            <div className="export">
              <Checkbox
                // id={idName}
                onChange={this.storeCaseId}
                item={item}
                checked={this.validValue(item)}
                style={CheckboxDis}></Checkbox>
            </div>
            <div className="sid">{item['description']}</div>
            {statusIcon}
          </div>
          <div className={'seriesidlist-popup-item-right'}>
            <Tooltip title={popupContent} placement="rightBottom" color={'white'} onMouseEnter={this.notice.bind(this, dataValidbyCaseId)}>
              <Button
                onClick={this.displayStudy.bind(this, item, dataValidbyCaseId.status)}
                shape="circle"
                icon={<RightOutlined style={{ color: '#52c41a' }} />}
                style={{ background: 'transparent', float: 'right' }}></Button>
            </Tooltip>
          </div>
        </div>
      )
    })
    // }

    return <div>{resultsPopup}</div>
  }
}

export default withRouter(SeriesIdList)
