import React, { Component } from 'react'
import { Pagination, Input, Grid, Checkbox, Button, Icon, Header, Dropdown } from 'semantic-ui-react'
import { notification, Select } from 'antd'
import MainList from '../components/MainList'
import '../css/searchCasePanel.css'
import axios from 'axios'
import Statistics from '../components/Statistics'
import qs from 'qs'
// import Info from '../components/Info'
import LowerAuth from '../components/LowerAuth'

const { Option } = Select
const style = {
  textAlign: 'center',
  marginTop: '300px',
}
let queueSearchErrorTimer = null

export class SearchPanel extends Component {
  constructor(props) {
    super(props)
    this.state = {
      checked: false,
      activePage: 1,
      totalPage: 1,
      pidKeyword: '',
      dateKeyword: '',
      // searchResults: true,
      queue: [],
      chooseQueue: '不限队列',
      activeQueue: [],
      activePageQueue: 1,
      totalPageQueue: 1,
      searchQueue: [],
      search: false,
      queueSearchHasError: false,
      downloading: false,
    }
    this.config = JSON.parse(localStorage.getItem('config'))
    this.handlePaginationChange = this.handlePaginationChange.bind(this)
    this.handleInputChange = this.handleInputChange.bind(this)

    this.handleCheckbox = this.handleCheckbox.bind(this)
    this.startDownload = this.startDownload.bind(this)
    this.getQueue = this.getQueue.bind(this)
    this.onKeyDown = this.onKeyDown.bind(this)
    this.left = this.left.bind(this)
    this.right = this.right.bind(this)
    this.onKeyDown = this.onKeyDown.bind(this)
  }

  async componentDidMount() {
    this.getTotalPages()
    this.getQueue()
    document.addEventListener('keydown', this.onKeyDown)
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.onKeyDown)
  }

  componentDidUpdate(prevProps, prevState) {
    // console.log('pidkeyword',this.state.pidKeyword.length)
    // if (prevState.pidKeyword !== this.state.pidKeyword){
    //     if(this.state.pidKeyword.length >= 3 || this.state.pidKeyword.length == 0){
    //         // console.log("call get total pages")
    //         this.setState({searchResults: true})
    //         this.getTotalPages()

    //     } else {
    //         this.setState({searchResults: false})
    //     }
    // }

    // if(prevState.dateKeyword !== this.state.dateKeyword){
    //     if(this.state.dateKeyword.length >= 4 || this.state.dateKeyword.length == 0){
    //         this.setState({searchResults: true})
    //         this.getTotalPages()
    //     } else {
    //         this.setState({searchResults: false})
    //     }
    // }

    if (prevState.chooseQueue !== this.state.chooseQueue) {
      this.getTotalPages()
    }

    if (prevState.checked !== this.state.checked) {
      // console.log('true')
      // this.setState({searchResults: true})
      this.getTotalPages()
    }
    if (prevState.activePageQueue != this.state.activePageQueue) {
      let activeQueue = []
      let i = 0
      for (; i < 5 && i + (this.state.activePageQueue - 1) * 5 < this.state.queue.length; i++) {
        activeQueue.push(this.state.queue[i + (this.state.activePageQueue - 1) * 5])
      }
      for (; i < 5; i++) {
        activeQueue.push('')
      }
      this.setState({ activeQueue: activeQueue })
    }
  }

  onKeyDown(event) {
    // console.log('enter', event)
    if (event.which === 13) {
      if (event.path.length > 1 && event.path[0].id === 'queueDropdown') {
        return
      }
      // console.log("checked", this.state.checked)
      if (this.state.checked) {
        // search by date
        if (!document.getElementById('date-search')) {
          return
        }
        const dateValue = document.getElementById('date-search').value
        let dateRegex = new RegExp('^([0-9]){0,8}$')
        if (dateRegex.test(dateValue)) {
          this.setState({
            activePage: 1,
            dateKeyword: dateValue,
            search: true,
          })
          this.getTotalPages()
          this.setState({ search: false })
        } else {
          notification.warning({
            top: 48,
            duration: 6,
            message: '提醒',
            description: '输入日期应不超过8个字符，且仅支持数字',
          })
        }
      } else {
        // search by patient
        if (!document.getElementById('patient-search')) {
          return
        }
        const patientValue = document.getElementById('patient-search').value
        let patientRegex = new RegExp('^([a-zA-Z0-9_#]){0,32}$')
        if (patientRegex.test(patientValue)) {
          this.setState({
            activePage: 1,
            pidKeyword: patientValue,
            search: true,
          })
          this.getTotalPages()
          this.setState({ search: false })
        } else {
          notification.warning({
            top: 48,
            duration: 6,
            message: '提醒',
            description: '病人ID不超过32个字符，且仅支持字母、数字、"#"和"_"',
          })
        }
      }
    }
  }

  getQueue() {
    const params = {
      username: localStorage.getItem('username'),
    }
    axios
      .post(this.config.subset.getQueue, qs.stringify(params))
      .then((res) => {
        let queue = ['不限队列']
        let searchQueue = [{ key: '不限队列', value: '不限队列', text: '不限队列' }]
        let activeQueue = ['不限队列']
        let totalPageQueue = 1
        let i = 0
        for (; i < res.data.length; i++) {
          queue.push(res.data[i])
          searchQueue.push({
            key: res.data[i],
            value: res.data[i],
            text: res.data[i],
          })
          if (i < 4) {
            activeQueue.push(res.data[i])
          }
        }
        for (; i < 4; i++) {
          activeQueue.push('')
        }
        totalPageQueue = parseInt(res.data.length / 5) + 1
        this.setState({
          queue: queue,
          searchQueue: searchQueue,
          activeQueue: activeQueue,
          totalPageQueue: totalPageQueue,
        })
      })
      .catch((err) => {
        console.log(err)
      })
  }

  getTotalPages() {
    if (this.state.chooseQueue === '不限队列') {
      const token = localStorage.getItem('token')
      const headers = {
        Authorization: 'Bearer '.concat(token),
      }
      let type = 'pid'
      if (this.state.checked) {
        type = 'date'
      }
      const params = {
        type: type,
        pidKeyword: this.state.pidKeyword,
        dateKeyword: this.state.dateKeyword,
      }

      axios
        .post(this.config.record.getTotalPages, qs.stringify(params), {
          headers,
        })
        .then((response) => {
          // console.log("getTotalPages buxian response", response)
          const data = response.data
          if (data.status !== 'okay') {
            alert('错误，请联系管理员')
            window.location.href = '/'
          } else {
            const totalPage = data.count
            console.log('totalPage', totalPage)
            this.setState({ totalPage: totalPage })
          }
        })
        .catch((error) => console.log(error))
    } else {
      let type = 'pid'
      if (this.state.checked) {
        type = 'date'
      }
      const params = {
        type: type,
        pidKeyword: this.state.pidKeyword,
        dateKeyword: this.state.dateKeyword,
        username: localStorage.getItem('username'),
        subsetName: this.state.chooseQueue,
      }
      axios
        .post(this.config.record.getTotalPagesForSubset, qs.stringify(params))
        .then((response) => {
          // console.log("getTotalPages qita response", response)
          const data = response.data
          const totalPage = data.count
          console.log('totalPage', totalPage)
          this.setState({ totalPage: totalPage })
        })
        .catch((error) => console.log(error))
    }
  }

  handleCheckbox(e) {
    // console.log("handle check box", this.state)
    this.setState({
      checked: !this.state.checked,
      pidKeyword: '',
      dateKeyword: '',
    })
    this.setState({ activePage: 1 })
  }

  handleInputChange(e) {
    const value = e.currentTarget.value
    const name = e.currentTarget.name
    this.setState({ activePage: 1 })
    // var reg = new RegExp("^[A-Za-z0-9]+$");
    // if (name === "pid" && !isNaN(value)) {
    if (name === 'pid') {
      this.setState({ pidKeyword: value })
    } else if (name === 'date') {
      this.setState({ dateKeyword: value })
    }
  }

  handlePaginationChange(e, { activePage }) {
    this.setState({ activePage })
  }

  startDownload() {
    let cart
    if (this.mainList && this.mainList.subList) {
      cart = this.mainList.subList.state.cart
    }
    console.log('Start downloading', cart)

    if (cart.size === 0) {
      if (document.getElementsByClassName('cart-empty').length === 0) {
        notification.open({
          className: 'cart-empty',
          message: '提示',
          style: {
            backgroundColor: 'rgba(255,232,230)',
          },
          description: '未勾选需要下载的病例',
        })
      }
      return
    }
    this.setState({ loading: true, downloading: true })
    const token = localStorage.getItem('token')
    const headers = {
      Authorization: 'Bearer '.concat(token),
    }
    axios
      .get(this.config.cart.downloadCart, { headers })
      .then((res) => {
        const filename = res.data
        console.log('Filename', filename)
        window.location.href = this.config.data.download + '/' + filename
        this.setState({ loading: false, downloading: false })
        if (this.mainList && this.mainList.subList) {
          this.mainList.subList.setState({
            cart: new Set(),
          })
        }
        // window.location.reload()
      })
      .catch((err) => {
        console.log(err)
      })
  }
  onChangeQueue(value) {
    console.log('queue', value)
    if (value === '不限队列' || value === '') {
      this.setState({ chooseQueue: '不限队列' })
    } else {
      this.setState({ chooseQueue: value })
    }
  }
  onSearchQueue(val) {
    console.log('onSearchQueue', val)
    let textReg = new RegExp("^([\u4E00-\uFA29]|[\uE7C7-\uE7F3]|[a-zA-Z0-9_']){1,12}$")
    // console.log("getQueueSearchChange", text, textReg.test(text))
    if (val.length > 0 && !textReg.test(val) && !this.state.queueSearchHasError) {
      this.setState({
        queueSearchHasError: true,
      })
      if (queueSearchErrorTimer) {
        clearTimeout(queueSearchErrorTimer)
      }
      queueSearchErrorTimer = setTimeout(() => {
        this.setState({ queueSearchHasError: false })
      }, 4000)
      notification.warning({
        top: 48,
        duration: 4,
        message: '提醒',
        description: '队列名称的长度不超过12个字符，且仅支持中文、字母、数字和下划线',
      })
    }
    if (textReg.test(val) || val.length === 0) {
      this.setState({
        queueSearchHasError: false,
      })
    }
  }
  // getQueueIds(e) {
  //   let text = e.currentTarget.innerHTML.split(">")[1].split("<")[0];
  //   console.log("text", text);
  //   if (text === "不限队列" || text === "") {
  //     this.setState({ chooseQueue: "不限队列" });
  //   } else {
  //     this.setState({ chooseQueue: text });
  //   }
  // }
  left(e) {
    if (this.state.activePageQueue > 1) {
      this.setState((state, props) => ({
        activePageQueue: state.activePageQueue - 1,
      }))
    }
  }
  right(e) {
    if (this.state.activePageQueue < this.state.totalPageQueue) {
      this.setState((state, props) => ({
        activePageQueue: state.activePageQueue + 1,
      }))
    }
  }
  buttonQueue(e) {
    let text = e.currentTarget.innerHTML
    // console.log('button',e.currentTarget.innerHTML)
    if (text === '不限队列' || text === '') {
      this.setState({ chooseQueue: '不限队列' })
    } else {
      this.setState({ chooseQueue: text })
    }
  }

  render() {
    const { activePage } = this.state
    const isChecked = this.state.checked
    let type = 'pid'

    if (isChecked) {
      type = 'date'
    }
    // let searchResults
    // if (this.state.searchResults) {
    //     searchResults = (
    //         <div>
    //             <div className="patientList" style={{minHeight:500}}>
    //                 <MainList
    //                     type={type}
    //                     currentPage={this.state.activePage}//MainList.js 40,css in MainList.js 108
    //                     pidKeyword={this.state.pidKeyword}
    //                     dateKeyword={this.state.dateKeyword}
    //                     subsetName={this.state.chooseQueue}/>
    //                     <div className='exportButton'>
    //                         <Button inverted color='blue' onClick={this.startDownload}>导出</Button>
    //                     </div>
    //             </div>

    //             <div className="pagination-component">
    //                 <Pagination
    //                     id="pagination"
    //                     onPageChange={this.handlePaginationChange}
    //                     activePage={this.state.activePage}
    //                     totalPages={this.state.totalPage}/>
    //             </div>
    //         </div>
    //     )
    // } else {
    //     searchResults = (
    //         <Info type='1' />
    //     )
    // }
    const options = this.state.searchQueue.map((item, index) => {
      return (
        <Option key={index} value={item.value}>
          {item.text}
        </Option>
      )
    })

    return (
      <Grid className="banner">
        <Grid.Row>
          <Grid.Column width={2}></Grid.Column>
          <Grid.Column width={12} id="queuestyle">
            <Grid>
              <Grid.Row></Grid.Row>
              <Grid.Row>
                <Select
                  id="queueDropdown"
                  dropdownClassName="queue-option-item"
                  showSearch
                  style={{ width: 200 }}
                  placeholder="搜索队列"
                  // optionFilterProp="children"
                  value={this.state.chooseQueue}
                  onChange={this.onChangeQueue.bind(this)}
                  onSearch={this.onSearchQueue.bind(this)}
                  notFoundContent={<div>无队列</div>}>
                  {options}
                </Select>
              </Grid.Row>
              <Grid.Row columns={7}>
                <Grid.Column floated="left">
                  <Button inverted color="green" size="small" icon="caret left" floated="left" onClick={this.left}></Button>
                </Grid.Column>
                {this.state.activeQueue.map((content, index) => {
                  return (
                    <Grid.Column key={index}>
                      {content === '' ? (
                        <Button fluid inverted color="green" size="large" onClick={this.buttonQueue.bind(this)} style={{ visibility: 'hidden' }}>
                          {content}
                        </Button>
                      ) : (
                        <Button fluid inverted color="green" size="large" onClick={this.buttonQueue.bind(this)}>
                          {content}
                        </Button>
                      )}
                    </Grid.Column>
                  )
                })}
                <Grid.Column floated="right">
                  <Button inverted color="green" size="small" icon="caret right" floated="right" onClick={this.right}></Button>
                </Grid.Column>
              </Grid.Row>
              <Grid.Row></Grid.Row>
            </Grid>
          </Grid.Column>
          <Grid.Column width={2}></Grid.Column>
        </Grid.Row>
        {/* <Grid.Row className="data-content"> */}
        <Grid.Row>
          <Grid.Column width={2}></Grid.Column>

          <Grid.Column width={12}>
            <div id="container">
              <div className="searchBar">
                <Input
                  name="pid"
                  // value={this.state.pidKeyword}
                  // onChange={this.handleInputChange}
                  id="patient-search"
                  icon="user"
                  iconPosition="left"
                  placeholder="病人ID"
                  // maxLength={16}
                  disabled={this.state.checked}
                />

                <span id="type-slider">
                  <Checkbox slider onChange={this.handleCheckbox} defaultChecked={this.state.checked} />
                </span>

                <Input
                  name="date"
                  // value={this.state.dateKeyword}
                  // onChange={this.handleInputChange}
                  id="date-search"
                  icon="calendar"
                  iconPosition="left"
                  placeholder="检查时间"
                  // maxLength={8}
                  disabled={!this.state.checked}
                />
              </div>
              <div id="show-search-content">
                {/* {searchResults} */}
                <div>
                  <div className="patientList" style={{ minHeight: 500 }}>
                    <MainList
                      type={type}
                      currentPage={this.state.activePage} //MainList.js 40,css in MainList.js 108
                      pidKeyword={this.state.pidKeyword}
                      dateKeyword={this.state.dateKeyword}
                      subsetName={this.state.chooseQueue}
                      search={this.state.search}
                      onRef={(input) => {
                        this.mainList = input
                      }}
                    />
                    {localStorage.getItem('auths') !== null && JSON.parse(localStorage.getItem('auths')).indexOf('data_search') > -1 ? (
                      <div className="exportButton">
                        {this.state.loading ? (
                          <Button inverted color="blue" loading>
                            导出
                          </Button>
                        ) : (
                          <Button inverted color="blue" onClick={this.startDownload}>
                            导出
                          </Button>
                        )}
                      </div>
                    ) : null}

                    <div className="pagination-component">
                      <Pagination id="pagination" onPageChange={this.handlePaginationChange} activePage={this.state.activePage} totalPages={this.state.totalPage} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Grid.Column>

          <Grid.Column width={2}></Grid.Column>
        </Grid.Row>
      </Grid>
    )
  }
}

export default SearchPanel
