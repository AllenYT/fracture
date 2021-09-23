import React, { Component } from 'react'
import { Menu, Dropdown, Button, Image } from 'semantic-ui-react'
import { notification } from 'antd'
import { BrowserRouter as Router, Route, Switch, Link } from 'react-router-dom'
import qs from 'qs'
import { connect } from 'react-redux'
import { getConfigJson } from '../actions'

import LoginPanel from '../panels/LoginPanel'
import DataCockpit from '../panels/DataCockpit'
// import DisplayPanel from "../panels/DisplayPanel";
import CornerstoneElement from '../components/CornerstoneElement'
import MyAnnosPanel from '../panels/MyAnnosPanel'
import DownloadPanel from '../panels/DownloadPanel'
import MyReviewsPanel from '../panels/MyReviewsPanel'
import PatientPanel from '../panels/PatientPanel'
import SearchCasePanel from '../panels/SearchCasePanel'
import SearchNodulePanel from '../panels/SearchNodulePanel'
// import FollowUpDisplayPanel from '../panels/FollowUpDisplayPanel'
import '../css/main.css'
import axios from 'axios'
import src1 from '../images/MILab.png'
import src2 from '../images/logo.jpg'
import src3 from '../images/scu-logo.png'

import HomepagePanel from '../panels/HomepagePanel'
import preprocess from '../panels/preprocess'
import AdminManagePanel from '../panels/AdminManagePanel'

import md5 from 'js-md5'
import { MenuList } from '@material-ui/core'

class Main extends Component {
  constructor(props) {
    super(props)
    this.state = {
      activeItem: 'home',
      name: localStorage.realname,
      username: localStorage.getItem('username'),
      // username: localStorage.getItem('username'),
      path: window.location.pathname,
      reRender: 0,
      isLoggedIn: false,
      expiration: false,
      diskInfo: '0%',
    }
    this.newConfig = this.props.newConfig

    this.handleItemClick = this.handleItemClick.bind(this)
    this.handleLogout = this.handleLogout.bind(this)
    this.handleLogin = this.handleLogin.bind(this)
  }

  handleItemClick = (e, { name }) => this.setState({ activeItem: name })

  toHomepage() {
    window.location.href = '/homepage'
    // this.nextPath('/homepage/' + params.caseId + '/' + res.data)
  }

  handleLogin() {
    this.setState({
      reRender: Math.random(),
    }) // force re-render the page
  }

  handleLogout() {
    const token = localStorage.getItem('token')
    const headers = {
      Authorization: 'Bearer '.concat(token),
    }
    Promise.all([axios.get(this.config.user.signoutUser, { headers }), axios.get(process.env.PUBLIC_URL + '/config.json')])
      .then(([signoutRes, configs]) => {
        if (signoutRes.data.status === 'okay') {
          this.setState({ isLoggedIn: false })
          localStorage.clear()
          sessionStorage.clear()
          const config = configs.data
          console.log('config', config)
          localStorage.setItem('config', JSON.stringify(config))
          window.location.href = '/'
        } else {
          alert('出现内部错误，请联系管理员！')
          window.location.href = '/'
        }
      })
      .catch((error) => {
        console.log('error')
      })
  }

  async componentDidMount() {
    // console.log('localstorage', !localStorage.getItem('config'))

    // const configPromise = new Promise((resolve, reject) => {
    //   axios.get(process.env.PUBLIC_URL + "/config.json").then((res) => {
    //     const config = res.data;
    //     console.log("config", config);
    //     localStorage.setItem("config", JSON.stringify(config));
    //     resolve(config);
    //   }, reject);
    // });
    // const config = await configPromise;
    // this.config = config;
    if (!localStorage.getItem('config')) {
      await this.props.getConfigJson(process.env.PUBLIC_URL + '/config.json')
      this.config = this.props.config
      console.log(this.props)
      localStorage.setItem('config', JSON.stringify(this.config))
    } else {
      this.config = JSON.parse(localStorage.getItem('config'))
    }
    console.log('main config', this.config)

    axios
      .post(this.config.data.getDiskInfo)
      .then((diskResponse) => {
        const diskInfo = diskResponse.data.usedPercents
        console.log('diskinfo', parseInt(diskInfo))
        this.setState({ diskInfo: diskInfo })
        if (parseInt(diskInfo) > 90) {
          notification.warning({
            top: 48,
            duration: 6,
            message: '提醒',
            description: '磁盘用量已超过90%',
          })
        }
      })
      .catch((error) => {
        console.log(error)
      })

    // if (localStorage.getItem('username') === null && window.location.pathname !== '/') {
    //   const ipPromise = new Promise((resolve, reject) => {
    //     axios.post(this.config.user.getRemoteAddr).then((addrResponse) => {
    //       resolve(addrResponse)
    //     }, reject)
    //   })
    //   const addr = await ipPromise
    //   let tempUid = ''
    //   console.log('addr', addr)
    //   if (addr.data.remoteAddr === 'unknown') {
    //     tempUid = this.config.loginId.uid
    //   } else {
    //     tempUid = 'user' + addr.data.remoteAddr.split('.')[3]
    //   }

    //   const usernameParams = {
    //     username: tempUid,
    //   }

    //   const insertInfoPromise = new Promise((resolve, reject) => {
    //     axios.post(this.config.user.insertUserInfo, qs.stringify(usernameParams)).then((insertResponse) => {
    //       resolve(insertResponse)
    //     }, reject)
    //   })

    //   const insertInfo = await insertInfoPromise
    //   if (insertInfo.data.status !== 'failed') {
    //     this.setState({ username: usernameParams.username })
    //   } else {
    //     this.setState({ username: this.config.loginId.uid })
    //   }

    //   const user = {
    //     username: this.state.username,
    //     password: md5(this.config.loginId.password),
    //   }
    //   const auth = {
    //     username: this.state.username,
    //   }
    //   Promise.all([axios.post(this.config.user.validUser, qs.stringify(user)), axios.post(this.config.user.getAuthsForUser, qs.stringify(auth))])

    //     .then(([loginResponse, authResponse]) => {
    //       console.log(authResponse.data)
    //       if (loginResponse.data.status !== 'failed') {
    //         localStorage.setItem('token', loginResponse.data.token)
    //         localStorage.setItem('realname', loginResponse.data.realname)
    //         localStorage.setItem('username', loginResponse.data.username)
    //         localStorage.setItem('privilege', loginResponse.data.privilege)
    //         localStorage.setItem('allPatientsPages', loginResponse.data.allPatientsPages)
    //         localStorage.setItem('totalPatients', loginResponse.data.totalPatients)
    //         localStorage.setItem('totalRecords', loginResponse.data.totalRecords)
    //         localStorage.setItem('modelProgress', loginResponse.data.modelProgress)
    //         localStorage.setItem('BCRecords', loginResponse.data.BCRecords)
    //         localStorage.setItem('HCRecords', loginResponse.data.HCRecords)
    //         localStorage.setItem('auths', JSON.stringify(authResponse.data))
    //         console.log('localtoken', localStorage.getItem('token'))
    //       } else {
    //         console.log('localtoken', localStorage.getItem('token'))
    //       }
    //     })
    //     .catch((error) => {
    //       console.log(error)
    //     })
    // }
    const token = localStorage.getItem('token')
    // console.log("localtoken", localStorage.getItem("token"));
    console.log('token', token)
    if (token !== null) {
      const headers = {
        Authorization: 'Bearer '.concat(token),
      }
      console.log('headers', headers)
      axios
        .get(this.config.user.get_session, { headers })
        .then((response) => {
          console.log(response.data.status)
          if (response.data.status === 'okay') {
            this.setState({ isLoggedIn: true })
            window.sessionStorage.setItem('userId', response.data.username)
          } else if (response.data.status === 'expires') {
            localStorage.clear()
            this.setState({ expiration: true })
          } else {
            localStorage.clear()
          }
        })
        .catch((error) => {
          console.log('ERRRRROR', error)
        })
    }
  }

  render() {
    const { activeItem } = this.state
    const welcome = '欢迎您，' + this.state.name

    let logButtonPlace = ''
    // console.log(window.location.pathname);

    const mainSearchNodule =
      localStorage.getItem('auths') !== null && JSON.parse(localStorage.getItem('auths')).indexOf('nodule_search') > -1 ? (
        <Menu.Item active={activeItem === 'searchNodule'} onClick={this.handleItemClick} as={Link} to="/searchNodule" name="searchNodule">
          结节检索
        </Menu.Item>
      ) : (
        <></>
      )

    const mainAdminManage =
      localStorage.getItem('auths') !== null && JSON.parse(localStorage.getItem('auths')).indexOf('nodule_search') > -1 ? (
        <Menu.Item active={activeItem === 'adminManage'} onClick={this.handleItemClick} as={Link} to="/adminManage" name="adminManage">
          用户管理
        </Menu.Item>
      ) : (
        <></>
      )
    const mainMenus = (
      <>
        <Menu.Item onClick={this.handleItemClick} as={Link} to="/dataCockpit" name="home">
          肺结节CT影像辅助检测软件
        </Menu.Item>

        <Menu.Item active={activeItem === 'searchCase'} onClick={this.handleItemClick} as={Link} to="/searchCase" name="searchCase">
          数据检索
        </Menu.Item>
        {mainSearchNodule}
        {mainAdminManage}
        <Menu.Item position="right">当前磁盘使用百分比:{this.state.diskInfo}</Menu.Item>

        {/* <Menu.Item
                    active={activeItem === 'myAnnos'}
                    onClick={this.handleItemClick}
                    as={Link}
                    to='/myAnnos'
                    name='myAnnos'>
                    我的标注
                </Menu.Item>

        
                <Menu.Item
                    active={activeItem === 'myReviews'}
                    onClick={this.handleItemClick}
                    as={Link}
                    to='/myReviews'
                    name='myReviews'
                    >
                    我的审核
                </Menu.Item>
                

                <Menu.Item
                    active={activeItem === 'download'}
                    onClick={this.handleItemClick}
                    as={Link}
                    to='/download'
                    name='download'>
                    数据列表
                </Menu.Item> */}
        {/* <Menu.Item
                    active={activeItem === 'patientInfo'}
                    onClick={this.handleItemClick}
                    as={Link}
                    to='/patientInfo'
                    name='patientInfo'>
                    病人详情
                </Menu.Item> */}
        {/* <Menu.Item
                    active={activeItem === 'cov19List'}
                    onClick={this.handleItemClick}
                    as={Link}
                    to='/cov19List'
                    name='cov19List'>
                    新冠肺炎
                </Menu.Item> */}
        {/* <Menu.Item
          active={activeItem === "preprocess"}
          onClick={this.handleItemClick}
          as={Link}
          to="/preprocess"
          name="preprocess"
        >
          预处理
        </Menu.Item> */}
      </>
    )

    if (this.state.isLoggedIn) {
      console.log('islogin')
      if (window.location.pathname.split('/')[1] != 'case') {
        logButtonPlace = (
          <Menu id="header" pointing secondary>
            {mainMenus}
            <Menu.Item position="right">
              <Dropdown text={welcome}>
                <Dropdown.Menu id="logout-menu">
                  <Dropdown.Item icon="home" text="我的主页" onClick={this.toHomepage} />
                  {/* <Dropdown.Item
                    icon="write"
                    text="留言"
                    onClick={this.handleWriting}
                  /> */}
                  <Dropdown.Item icon="log out" text="注销" onClick={this.handleLogout} />
                </Dropdown.Menu>
              </Dropdown>
            </Menu.Item>
          </Menu>
        )
      } else {
        console.log('标注界面')
        logButtonPlace = (
          <Menu id="header" pointing secondary>
            {/* {mainMenus} */}
            <Menu.Item position="right">
              <Dropdown text={welcome}>
                <Dropdown.Menu id="logout-menu">
                  <Dropdown.Item icon="home" text="我的主页" onClick={this.toHomepage} />
                  {/* <Dropdown.Item
                    icon="write"
                    text="留言"
                    onClick={this.handleWriting}
                  /> */}
                  <Dropdown.Item icon="log out" text="注销" onClick={this.handleLogout} />
                </Dropdown.Menu>
              </Dropdown>
            </Menu.Item>
          </Menu>
        )
      }
    } else {
      console.log(window.location.pathname)
      // if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
      if (window.location.pathname !== '/') {
        logButtonPlace = (
          <Menu id="header" pointing secondary>
            {mainMenus}

            <Menu.Item position="right">
              <Button inverted color="green" as={Link} to="/" onClick={this.handleLogin}>
                登录
              </Button>
            </Menu.Item>
          </Menu>
        )
        // window.location.href = '/'
      } else {
        logButtonPlace = (
          <>
            {/* <Menu id="header" pointing secondary>
              <Menu.Item onClick={this.handleItemClick} as={Link} to="/" name="home">
                肺结节CT影像辅助检测软件
              </Menu.Item>

              <Menu.Item position="right">
                <Button className="invisible-login-button" inverted color="green" as={Link} to="/" onClick={this.handleLogin}>
                  登录
                </Button>
              </Menu.Item>
            </Menu> */}
          </>
        )
      }
    }

    return (
      <Router>
        <div id="content">
          {logButtonPlace}
          {/* </Menu> */}
          <div id="main">
            {this.state.isLoggedIn ? (
              <>
                <Switch>
                  <Route exact path="/" component={DataCockpit} />
                  <Route exact path="/dataCockpit" component={DataCockpit} />
                  <Route path="/searchCase" component={SearchCasePanel} />
                  <Route path="/searchNodule" component={SearchNodulePanel} />
                  <Route path="/myAnnos/" component={MyAnnosPanel} /> {/* <Route path="/startAnnos" component={StartAnnosPanel} /> */}
                  {/* <Route exact path="/login" component={LoginPanel}/>  */}
                  <Route path="/myReviews/" component={MyReviewsPanel} />
                  <Route exact path="/download/" component={DownloadPanel} />
                  <Route path="/case/" component={CornerstoneElement} />
                  <Route path="/patientInfo/" component={PatientPanel} />
                  {/* <Route path="/cov19List/" component={Cov19ListPanel} />
                        <Route path='/cov19Case/' component={Cov19DisplayPanel}/> */}
                  <Route path="/homepage/" component={HomepagePanel} />
                  <Route path="/preprocess/" component={preprocess} />
                  <Route path="/adminManage" component={AdminManagePanel} />
                </Switch>
              </>
            ) : (
              <>
                <Switch>
                  <Route path="/searchCase" component={SearchCasePanel} />
                  <Route path="/case/" component={CornerstoneElement} />
                  <Route path="/" component={LoginPanel}></Route>
                </Switch>
              </>
            )}
          </div>
          <div id="footer">
            <div className="inline">© 2019 Sichuan University. All rights reserved</div>

            <div className="inline">
              <Image src={src3} id="img-size"></Image>
            </div>
          </div>
        </div>
      </Router>
    )
  }
}

export default connect(
  (state) => {
    return {
      config: state.config.config,
    }
  },
  (dispatch) => {
    return {
      getConfigJson: (url) => dispatch(getConfigJson(url)),
      dispatch,
    }
  }
)(Main)
