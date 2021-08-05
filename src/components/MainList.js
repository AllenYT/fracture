import React, { Component, createRef } from 'react'
import { Menu, Grid } from 'semantic-ui-react'
import { notification } from 'antd'
import axios from 'axios'
import qs from 'qs'
import '../css/spinner.css'
import SubList from './SubList'
import { string } from 'postcss-selector-parser'
import ReactHtmlParser from 'react-html-parser'

class MainList extends Component {
  contextRef = createRef()
  constructor(props) {
    super(props)
    this.state = {
      lastPage: null,
      mainList: [],
      selectMainItem: '',
      show: false,
      // selectPid: ''
    }
    this.config = JSON.parse(localStorage.getItem('config'))
    this.handlePatientIdClick = this.handlePatientIdClick.bind(this)
  }

  handlePatientIdClick(e, { name }) {
    this.setState({ selectMainItem: e.currentTarget.dataset.id })
  }

  componentDidMount() {
    this.loadMainList()
  }

  loadMainList() {
    if (this.props.subsetName === '不限队列') {
      const token = localStorage.getItem('token')
      const headers = {
        Authorization: 'Bearer '.concat(token),
      }

      const params = {
        page: this.props.currentPage,
        type: this.props.type,
        pidKeyword: this.props.pidKeyword.toUpperCase(),
        dateKeyword: this.props.dateKeyword.toUpperCase(),
      }

      axios
        .post(this.config.record.getMainList, qs.stringify(params), { headers })
        .then((response) => {
          const data = response.data
          if (data.status === 'okay') {
            const mainList = data.mainList
            if (mainList.length === 0) {
              notification.warning({
                top: 48,
                duration: 6,
                message: '提醒',
                description: '查询数据未入库，请联系厂家技术支持工程师',
              })
            }
            this.setState({ mainList: mainList, show: true })
          }
        })
        .catch((error) => {
          console.log(error)
        })
    } else {
      const params = {
        page: this.props.currentPage,
        type: this.props.type,
        pidKeyword: this.props.pidKeyword.toUpperCase(),
        dateKeyword: this.props.dateKeyword.toUpperCase(),
        username: localStorage.getItem('username'),
        subsetName: this.props.subsetName,
      }
      axios
        .post(this.config.record.getMainListForSubset, qs.stringify(params))
        .then((response) => {
          const data = response.data
          if (data.status === 'okay') {
            const mainList = data.mainList
            if (mainList.length === 0) {
              notification.warning({
                top: 48,
                duration: 6,
                message: '提醒',
                description: '查询数据未入库，请联系厂家技术支持工程师',
              })
            }
            this.setState({ mainList: mainList, show: true })
          }
        })
        .catch((error) => {
          console.log(error)
        })
    }
  }

  static getDerivedStateFromProps(props, state) {
    if (props.currentPage !== state.lastPage) {
      return { lastPage: props.currentPage }
    }

    return null
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.currentPage !== this.props.currentPage) {
      this.setState({ selectMainItem: '', show: false })
      this.loadMainList()
    } else if (prevProps.search !== this.props.search && this.props.search === true) {
      this.setState({ selectMainItem: '', show: false })
      this.loadMainList()
    } else if (prevProps.type !== this.props.type) {
      this.setState({ selectMainItem: '', show: false })
      this.loadMainList()
    } else if (prevProps.subsetName !== this.props.subsetName) {
      this.setState({ selectMainItem: '', show: false })
      this.loadMainList()
    }
  }

  render(props) {
    const elements = this.state.mainList
    // console.log(elements, this.props.type)
    const selectMainItem = this.state.selectMainItem
    // let otherKeyword

    let icon = 'user'
    let otherKeyword = this.props.dateKeyword

    if (this.props.type === 'date') {
      icon = 'calendar'
      otherKeyword = this.props.pidKeyword
    }

    // console.log('props.type', this.props.type)
    if (this.state.show)
      return (
        <div>
          <Grid>
            <Grid.Row>
              <Grid.Column width={5}>
                <Menu pointing secondary vertical id="mainList">
                  {elements.map((value, index) => {
                    let valueL = value.split('_')
                    let patientId = valueL[0]
                    // let patientName = valueL[1]
                    let patientName = ''
                    let patientSex = valueL[2] == 'M' ? '男' : '女'
                    // const newValue = patientId + ' ' + patientName + ' ' + patientSex
                    let newValue = []
                    if (this.props.type === 'pid') {
                      newValue = [patientId, patientName, patientSex]
                    } else {
                      newValue = [patientId]

                      // patientSex=' '
                    }
                    return (
                      <Menu.Item
                        icon={icon}
                        key={index}
                        active={this.state.selectMainItem == patientId}
                        onClick={this.handlePatientIdClick}
                        data-id={patientId}
                        // name={newValue}
                        content={
                          <tr>
                            <td>{newValue[0]}</td>
                            <td>{newValue[1]}</td>
                            <td>{newValue[2]}</td>
                          </tr>
                        }></Menu.Item>
                    )
                  })}
                </Menu>
              </Grid.Column>

              <Grid.Column width={11}>
                <tr>
                  <td>
                    <SubList mainItem={selectMainItem} type={this.props.type} otherKeyword={otherKeyword} contextRef={this.contextRef} />
                  </td>
                  <td>
                    <label ref={this.contextRef} style={{ visibility: 'hidden' }}>
                      hidden ref
                    </label>
                  </td>
                </tr>
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </div>
      )
    else
      return (
        <Grid centered>
          <div style={{ paddingTop: '60px' }}>
            <div class="sk-chase">
              <div class="sk-chase-dot"></div>
              <div class="sk-chase-dot"></div>
              <div class="sk-chase-dot"></div>
              <div class="sk-chase-dot"></div>
              <div class="sk-chase-dot"></div>
              <div class="sk-chase-dot"></div>
            </div>
          </div>
        </Grid>
      )
  }
}

export default MainList
