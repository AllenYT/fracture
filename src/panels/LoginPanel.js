import React, { Component } from 'react'
import { Grid, Button, Checkbox, Message, Form } from 'semantic-ui-react'
import { message } from 'antd'
import '../css/loginPanel.css'
import axios from 'axios'
import qs from 'qs'
// import { withRouter } from "react-router-dom";
import md5 from 'js-md5'
import { connect } from 'react-redux'
import { getConfigJson } from '../actions'

class LoginPanel extends Component {
  constructor(props) {
    super(props)
    this.state = {
      username: '',
      password: '',
    }
    this.handleClick = this.handleClick.bind(this)
    this.handleUsernameChange = this.handleUsernameChange.bind(this)
    this.handlePasswordChange = this.handlePasswordChange.bind(this)
    this.config = JSON.parse(localStorage.getItem("config"))
  }

  async componentDidMount() {
    if(document.getElementById('header')){
      document.getElementById('header').style.display = 'none'
    }
    const mainElement = document.getElementById('main')
    mainElement.setAttribute('style', 'height:100%;padding-bottom:0px')
  }
  componentWillUnmount() {
    if(document.getElementById('header')){
      document.getElementById('header').style.display = ''
    }
    const mainElement = document.getElementById('main')
    mainElement.setAttribute('style', '')
  }
  handleUsernameChange(e) {
    this.setState({ username: e.target.value })
  }

  handlePasswordChange(e) {
    this.setState({ password: e.target.value })
  }

  handleClick() {
    console.log('loggin')

    // const headers = {
    //     'Authorization': localStorage.getItem('token')
    // }
    const user = {
      username: this.state.username,
      password: md5(this.state.password),
    }
    const auth = {
      username: this.state.username,
    }
    Promise.all([axios.post(this.config.user.validUser, qs.stringify(user)), axios.post(this.config.user.getAuthsForUser, qs.stringify(auth))])

      .then(([loginResponse, authResponse]) => {
        console.log(authResponse.data)
        if (loginResponse.data.status === 'failed') {
          message.error('?????????????????????????????????????????????????????????')
        } else {
          console.log('loginResponse', loginResponse)
          localStorage.setItem('token', loginResponse.data.token)
          localStorage.setItem('realname', loginResponse.data.realname)
          localStorage.setItem('username', loginResponse.data.username)
          localStorage.setItem('privilege', loginResponse.data.privilege)
          localStorage.setItem('allPatientsPages', loginResponse.data.allPatientsPages)
          localStorage.setItem('totalPatients', loginResponse.data.totalPatients)
          localStorage.setItem('totalRecords', loginResponse.data.totalRecords)
          localStorage.setItem('modelProgress', loginResponse.data.modelProgress)
          localStorage.setItem('BCRecords', loginResponse.data.BCRecords)
          localStorage.setItem('HCRecords', loginResponse.data.HCRecords)
          localStorage.setItem('auths', JSON.stringify(authResponse.data))
          if (sessionStorage.getItem('location') != undefined) {
            window.location.href = sessionStorage.getItem('location')
            // this.props.history.push(sessionStorage.getItem('location')+'deepln')
          } else {
            if (authResponse.data.indexOf('auth_manage') > -1) {
              window.location.href = '/dataCockpit'
            } else {
              window.location.href = '/searchCase'
            }
            // this.props.history.push('/dataCockpit')
          }
        }
      })
      .catch((error) => {
        message.warning('???????????????')
        console.log(error)
      })
  }

  render() {
    return (
      <div id="login-container">
        <div id="total" style={{paddingBottom:'10px'}}>
          <Grid>
            <Grid.Row>
              <Grid.Column width={4} className="left-bg">
                <div id="left-align1">????????????</div>
                <div id="left-align2">DEEPLN</div>
                <div id="left-align1">?????????CT????????????????????????</div>
              </Grid.Column>
              <Grid.Column width={8}>
                <h1 className="login-header">????????????</h1>
                <Form id="login-panel">
                  <Form.Field className="input-field">
                    {/* <Icon name='user' color='green'/> */}
                    {/* <label>?????????</label> */}
                    <Form.Input
                      type="text"
                      value={this.state.username}
                      onChange={this.handleUsernameChange}
                      placeholder="?????????"
                      id="input-textBox"
                      icon="user"
                      iconPosition="left"
                      maxLength={16}></Form.Input>
                  </Form.Field>
                  <Form.Field className="input-field">
                    {/* <label>??????</label> */}
                    <Form.Input type="password" value={this.state.password} onChange={this.handlePasswordChange} icon="lock" iconPosition="left" placeholder="??????" id="input-textBox" maxLength={32} />
                  </Form.Field>
                  <div>
                    <Grid divided="vertically">
                      <Grid.Row columns={2}>
                        <Grid.Column textAlign="left">{/* <Checkbox label='??????????????????' color='blue'/> */}</Grid.Column>
                        <Grid.Column textAlign="right">{/* <a href='#'>???????????????</a> */}</Grid.Column>
                      </Grid.Row>
                    </Grid>
                  </div>
                  <div id="login-btn">
                    <Button onClick={this.handleClick} id="login-btn1">
                      ??????
                    </Button>
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
