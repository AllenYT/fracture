import React, {Component} from 'react'
import { Grid, Button, Checkbox, Message, Form } from 'semantic-ui-react'
import '../css/loginPanel.css'
import axios from 'axios'
import qs from 'qs'
const config = require('../config.json')
const userConfig = config.user



class LoginPanel extends Component {

    constructor(props) {
        super(props)
        this.state = {
            messageVisible: false,
            username: '',
            password: ''
        }
        this.handleDismiss = this.handleDismiss.bind(this)
        this.handleClick = this.handleClick.bind(this)
        this.handleUsernameChange = this.handleUsernameChange.bind(this)
        this.handlePasswordChange = this.handlePasswordChange.bind(this)
    }

    handleDismiss() {
        this.setState({
            messageVisible: false
        })
    }

    handleUsernameChange(e) {
        this.setState({username: e.target.value})
    }

    handlePasswordChange(e) {
        this.setState({password: e.target.value})
    }

    handleClick() {
        console.log('loggin')

        // const headers = {
        //     'Authorization': localStorage.getItem('token')
        // }
        const user = {
            username: this.state.username,
            password: this.state.password
        }

        axios.post(userConfig.validUser, qs.stringify(user))
        .then((response) => {
            console.log(response.data)
            if (response.data.status === 'failed') {
                this.setState({messageVisible: true})
            } else {
                localStorage.setItem('token', response.data.token)
                localStorage.setItem('realname', response.data.realname)
                localStorage.setItem('username',  response.data.username)
                localStorage.setItem('privilege', response.data.privilege)
                localStorage.setItem('allPatientsPages', response.data.allPatientsPages)
                localStorage.setItem('totalPatients', response.data.totalPatients)
                localStorage.setItem('totalRecords', response.data.totalRecords)
                localStorage.setItem('modelProgress', response.data.modelProgress)
                if(sessionStorage.getItem('location')!=undefined){
                    window.location.href=sessionStorage.getItem('location')+'deepln'
                }
                else{
                    window.location.href = '/dataCockpit'
                }
            }
        })
        .catch((error) => {
            console.log(error)
        })
    }

    render() {

        let errorMessage

        if (this.state.messageVisible) {
            errorMessage = (
            <Message
                color='red'
                onDismiss={this.handleDismiss}
                header='登录失败！'
                content='输入用户名或密码错误！'
            />
            )
        }

        return (
            <div id="login-container">
                <div id='total'>
                <Grid>
                <Grid.Row>
                    <Grid.Column width={4} className='left-bg'>
                        <div id='left-align1' >
                            欢迎来到
                        </div>
                        <div id='left-align2' >
                            DEEPLN
                        </div>
                        <div id='left-align1' >
                            DeepLN肺癌全周期智能管理影像数据平台
                        </div>
                    </Grid.Column>
                    <Grid.Column width={8}>
                    <h1 className="login-header">系统登录</h1>
                    <Form id="login-panel">
                    <Form.Field className="input-field">
                    {/* <Icon name='user' color='green'/> */}
                    {/* <label>用户名</label> */}
                    <Form.Input type='text' value={this.state.username} onChange={this.handleUsernameChange}  placeholder='用户名' id="input-textBox"
                    icon='user' iconPosition='left'>
                    </Form.Input>
                    </Form.Field>
                    <Form.Field className="input-field">
                    {/* <label>密码</label> */}
                    <Form.Input type='password' value={this.state.password} onChange={this.handlePasswordChange} icon='lock' iconPosition='left' placeholder='密码'
                    id="input-textBox"/>
                    </Form.Field>
                    {errorMessage}
                    <div >
                        <Grid divided='vertically'>
                            <Grid.Row columns={2} >
                                <Grid.Column textAlign='left'>
                                    <Checkbox label='记住账号信息' color='blue'/>
                                </Grid.Column>
                                <Grid.Column textAlign='right'>
                                    <a href='#'>忘记密码？</a>
                                </Grid.Column>
                            </Grid.Row>
                        </Grid>
                    </div>
                    <div id='login-btn' >
                        <Button onClick={this.handleClick} id="login-btn1">登录</Button>
                    </div>
                    </Form>
                    </Grid.Column>
                    <Grid.Column width={4}></Grid.Column>
                </Grid.Row>

            </Grid>
                </div>

            </div>
        )
    }
}

export default LoginPanel
