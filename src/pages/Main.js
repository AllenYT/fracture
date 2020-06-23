import React, {Component} from 'react'
import {Menu, Dropdown, Button, Image} from 'semantic-ui-react'
import {withRouter, BrowserRouter as Router, Route, Link} from "react-router-dom";
import LoginPanel from '../panels/LoginPanel'
import DataPanel from '../panels/DataPanel'
import DisplayPanel from '../panels/DisplayPanel'
import MyAnnosPanel from '../panels/MyAnnosPanel'
import DownloadPanel from '../panels/DownloadPanel'
import MyReviewsPanel from '../panels/MyReviewsPanel'
import PatientPanel from '../panels/PatientPanel'
import SearchCasePanel from '../panels/SearchCasePanel'
import SearchNodulePanel from '../panels/SearchNodulePanel'
import '../css/main.css'
import axios from 'axios'
import src1 from '../images/MILab.png'
import src2 from '../images/logo.jpg'
import src3 from '../images/scu-logo.png'
import Cov19ListPanel from '../panels/Cov19ListPanel';
import Cov19DisplayPanel from '../panels/Cov19DisplayPanel';
import HomepagePanel from '../panels/HomepagePanel'
import preprocess from '../panels/preprocess'

const config = require('../config.json')
const userConfig = config.user

class Main extends Component {
    constructor(props) {
        super(props);
        this.state = {
            activeItem: 'home',
            name: localStorage.realname,
            path: window.location.pathname,
            reRender: 0,
            isLoggedIn: false,
            expiration: false
        }
        this.handleItemClick = this
            .handleItemClick
            .bind(this);
        this.handleLogout = this
            .handleLogout
            .bind(this);
        this.handleLogin = this
            .handleLogin
            .bind(this)

    }

    handleItemClick = (e, {name}) => this.setState({activeItem: name});

    toHomepage(){
        window.location.href = '/homepage'
        // this.nextPath('/homepage/' + params.caseId + '/' + res.data)
    }

    handleLogin() {
        this.setState({
            reRender: Math.random()
        }) // force re-render the page
    }

    handleLogout() {
        const token = localStorage.getItem('token')
        const headers = {
            'Authorization': 'Bearer '.concat(token)
        }
        axios
            .get(userConfig.signoutUser, {headers})
            .then((response) => {
                if (response.data.status === 'okay') {
                    this.setState({isLoggedIn: false})
                    localStorage.clear()
                    sessionStorage.clear()
                    window.location.href = '/'
                } else {
                    alert("出现内部错误，请联系管理员！")
                    window.location.href = '/'
                }
            })
            .catch((error) => {
                console.log("error")
            })
    }

    componentWillMount() {
        const token = localStorage.getItem('token');
        if (token !== null) {
            console.log('token:', token);
            const headers = {
                'Authorization': 'Bearer '.concat(token)
            };

            axios
                .get(userConfig.get_session, {headers})
                .then((response) => {
                    console.log(response.data.status);
                    if (response.data.status === 'okay') {
                        this.setState({isLoggedIn: true});
                        window
                            .sessionStorage
                            .setItem('userId', response.data.username)
                    } else if (response.data.status === 'expires') {
                        localStorage.clear();
                        this.setState({expiration: true});
                    } else {
                        localStorage.clear();
                    }
                })
                .catch((error) => {
                    console.log("ERRRRROR", error);
                })
        }
    }

    render() {
        const {activeItem} = this.state;
        const welcome = '欢迎您，' + this.state.name;

        let logButtonPlace = ""
        console.log(window.location.pathname)

        const mainMenus = (
            <>
                <Menu.Item onClick={this.handleItemClick} as={Link} to='/dataCockpit' name='home'>
                    DeepLN肺癌全周期智能管理影像数据平台
                </Menu.Item>

                <Menu.Item
                    active={activeItem === 'searchCase'}
                    onClick={this.handleItemClick}
                    as={Link}
                    to='/searchCase'
                    name='searchCase'
                    >
                    数据检索
                </Menu.Item>

                <Menu.Item
                    active={activeItem === 'searchNodule'}
                    onClick={this.handleItemClick}
                    as={Link}
                    to='/searchNodule'
                    name='searchNodule'
                    >
                    结节检索
                </Menu.Item>

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
                <Menu.Item
                    active={activeItem === 'cov19List'}
                    onClick={this.handleItemClick}
                    as={Link}
                    to='/cov19List'
                    name='cov19List'>
                    新冠肺炎专题
                </Menu.Item>
                <Menu.Item
                    active={activeItem === 'preprocess'}
                    onClick={this.handleItemClick}
                    as={Link}
                    to='/preprocess'
                    name='preprocess'>
                    预处理
                </Menu.Item>
            </>
        )

        if (this.state.isLoggedIn) {
            console.log('islogin')
            if(window.location.pathname.split('/')[1] != 'case'){
                logButtonPlace = (
                    <Menu id="header" pointing secondary>
                        {mainMenus}
                        <Menu.Item position='right'>
                            <Dropdown text={welcome}>
                                <Dropdown.Menu id="logout-menu">
                                    <Dropdown.Item icon="home" text='我的主页' onClick={this.toHomepage}/>
                                    <Dropdown.Item icon="write" text='留言' onClick={this.handleWriting}/>
                                    <Dropdown.Item icon="log out" text='注销' onClick={this.handleLogout}/>
                                </Dropdown.Menu>
                            </Dropdown>
                        </Menu.Item>
                    </Menu>
                )
            }else{
                console.log('标注界面')
                logButtonPlace =(
                    <Menu id="header" pointing secondary>
                        {mainMenus}
                        <Menu.Item position='right'>
                            <Dropdown text={welcome}>
                                <Dropdown.Menu id="logout-menu">
                                    <Dropdown.Item icon="home" text='我的主页' onClick={this.toHomepage}/>
                                    <Dropdown.Item icon="write" text='留言' onClick={this.handleWriting}/>
                                    <Dropdown.Item icon="log out" text='注销' onClick={this.handleLogout}/>
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

                        <Menu.Item position='right'>
                            <Button inverted color='green' as={Link} to='/' onClick={this.handleLogin}>登录</Button>
                        </Menu.Item>
                    </Menu>

                )
                // window.location.href = '/'

            } else {
                logButtonPlace = (
                    <Menu id="header" pointing secondary>
                        <Menu.Item onClick={this.handleItemClick} as={Link} to='/' name='home'>
                            DeepLN肺癌全周期智能管理影像数据平台
                        </Menu.Item>
                      
                        <Menu.Item position='right'>
                            <Button
                                className="invisible-login-button"
                                inverted
                                color='green'
                                as={Link}
                                to='/'
                                onClick={this.handleLogin}>登录</Button>
                        </Menu.Item>
                    </Menu>

                )
            }

        }

        return (
            <Router>
                <div id="content">
                    {logButtonPlace}
                    {/* </Menu> */}
                    <div id="main">
                        {
                            this.state.isLoggedIn?<Route exact path="/" component={DataPanel}/>
                            :<Route exact path="/" component={LoginPanel}/>

                        }
                        <Route exact path="/dataCockpit" component={DataPanel}/>
                        <Route path="/searchCase" component={SearchCasePanel} />
                        <Route path="/searchNodule" component={SearchNodulePanel} />
                        <Route path="/myAnnos/" component={MyAnnosPanel}/> {/* <Route path="/startAnnos" component={StartAnnosPanel} /> */}
                        {/* <Route exact path="/login" component={LoginPanel}/>  */}
                        <Route path="/myReviews/" component={MyReviewsPanel} />
                        <Route exact path="/download/" component={DownloadPanel}/>
                        <Route path="/case/" component={DisplayPanel}/>
                        <Route path="/patientInfo/" component={PatientPanel}/>
                        <Route path="/cov19List/" component={Cov19ListPanel} />
                        <Route path='/cov19Case/' component={Cov19DisplayPanel}/>
                        <Route path='/homepage/' component={HomepagePanel}/>
                        <Route path='/preprocess/' component={preprocess}/>
                    </div>
                </div>

                <div className="ui inverted vertical footer segment">
                    <div className="inline" style={{verticalAlign:'middle'}}>
                        {/* © 2019 MILab. All rights reserved */}
                        © 2019 Sichuan University. All rights reserved
                    </div>
                    {/* <div className="inline">
                        <Image src={src2} id='img-size'></Image>
                    </div>
                    <div className="inline">
                        <Image src={src1} id='img-size'></Image>
                    </div> */}
                    <div className="inline">
                        <Image src={src3} id='img-size'></Image>
                    </div>
                </div>

            </Router>
        )
    }
}

export default Main;
