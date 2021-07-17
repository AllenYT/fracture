import React, { Component } from 'react'
import axios from 'axios'
import qs from 'qs'
import _ from 'lodash'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimesCircle, faChevronCircleUp, faChevronCircleDown, faUser, faLock } from '@fortawesome/free-solid-svg-icons'

import { Form, Input, Button as AntdButton, Select, Pagination } from 'antd'
import { Button, Table, Modal, Message } from 'semantic-ui-react'
// import { Slider, Select, Space, Checkbox, Tabs } from 'antd'
import '../css/adminManage.css'
import { alloc } from 'dicom-parser'
const { Option } = Select
class AdminManagePanel extends Component {
  constructor(props) {
    super(props)
    this.state = {
      usersList: [{ username: '1', createTime: '20', roles: ['s'] }],
      addUserModalOpen: false,
      addUserModalToggled: false,
      editUserModalOpens: [],
      editUserModalToggleds: [],
      deleteUserModalOpens: [],
      deleteUserModalToggleds: [],
      newPassword: '',
      newValPassword: '',
      newUsername: '',
      newRole: '',
      editPassword: '',
      editValPassword: '',
      editUsername: '',
      editRole: '',
      allRoles: [],
      currentPage: 1,
      totalPage: 10,
      message: {
        messageVisible: false,
        messageType: 'failed',
        messageHeader: '',
        messageContent: '',
      },
    }
    this.config = JSON.parse(localStorage.getItem('config'))
  }
  async componentDidMount() {
    const pagePromise = new Promise((resolve, reject) => {
      return axios.get(this.config.user.getTotalUserPages).then((res) => {
        console.log('getTotalUserPage request', res)
        const data = res.data
        if (data) {
          this.setState({
            totalPage: data,
          })
        }
        resolve(data)
      }, reject)
    })
    await pagePromise
    axios.get(this.config.role.getAllRole).then((res) => {
      console.log('getAllRole request', res)
      const data = res.data
      if (data) {
        let newRole = ''
        if (data.length >= 2) {
          newRole = data[1]
        } else {
          newRole = data[0]
        }
        this.setState({
          allRoles: data,
          newRole: newRole,
        })
      }
    })
    this.getUserInfoByPage(1)
  }
  getUserInfoByPage(page) {
    axios
      .post(
        this.config.user.getUserAtPage,
        qs.stringify({
          page: page,
        })
      )
      .then((res) => {
        console.log('getUserAtPage request', res)
        const usersList = []
        const data = res.data
        if (data) {
          data.forEach((item) => {
            const user = {
              username: item.username,
              createTime: item.createTime,
              roles: item.roles.content,
            }
            usersList.push(user)
          })
          this.setState({
            usersList,
          })
        }
      })
  }
  validateUserInfo(username, password, valPassword, role) {
    const message = this.state.message
    if (!username || username.length < 1) {
      console.log('username length error')
      message.messageVisible = true
      message.messageType = 'failed'
      message.messageHeader = '用户名长度不符'
      message.messageContent = '用户名长度不符'
      this.setState({
        message,
      })
      return false
    } else if (password !== valPassword) {
      console.log('two time password not match erro')
      message.messageVisible = true
      message.messageType = 'failed'
      message.messageHeader = '两次密码不匹配'
      message.messageContent = '两次密码不匹配'
      this.setState({
        message,
      })
      return false
    } else if (password.length > 16 && password.length < 6) {
      console.log('password length error')
      message.messageVisible = true
      message.messageType = 'failed'
      message.messageHeader = '密码长度不符'
      message.messageContent = '密码长度不符'
      this.setState({
        message,
      })
      return false
    } else if (!role) {
      console.log('not choose role error')
      message.messageVisible = true
      message.messageType = 'failed'
      message.messageHeader = '没有选择角色'
      message.messageContent = '没有选择角色'
      this.setState({
        message,
      })
      return false
    } else {
      return true
    }
  }
  addUser() {
    const { newUsername, newPassword, newValPassword, newRole } = this.state
    console.log(newUsername, newPassword, newValPassword, newRole)
    // if (!newUsername || newUsername.length < 1) {
    //   console.log('username length error')
    //   message.messageVisible = true
    //   message.messageType = 'failed'
    //   message.messageHeader = '用户名长度不符'
    //   message.messageContent = '用户名长度不符'
    //   this.setState({
    //     message,
    //   })
    // } else if (newPassword !== newValPassword) {
    //   console.log('two time password not match erro')
    //   message.messageVisible = true
    //   message.messageType = 'failed'
    //   message.messageHeader = '两次密码不匹配'
    //   message.messageContent = '两次密码不匹配'
    //   this.setState({
    //     message,
    //   })
    // } else if (newPassword.length > 16 && newPassword.length < 6) {
    //   console.log('password length error')
    //   message.messageVisible = true
    //   message.messageType = 'failed'
    //   message.messageHeader = '密码长度不符'
    //   message.messageContent = '密码长度不符'
    //   this.setState({
    //     message,
    //   })
    // } else if (!newRole) {
    //   console.log('not choose role error')
    //   message.messageVisible = true
    //   message.messageType = 'failed'
    //   message.messageHeader = '没有选择角色'
    //   message.messageContent = '没有选择角色'
    //   this.setState({
    //     message,
    //   })
    if (this.validateUserInfo(newUsername, newPassword, newValPassword, newRole)) {
      axios
        .post(
          this.config.user.insertUserInfoForAdmin,
          qs.stringify({
            createUsername: newUsername,
            createPassword: newPassword,
            roles: newRole,
          })
        )
        .then((res) => {
          console.log('insertUserInfoForAdmin request', res)
          if (res.status === 200 && res.data && res.data.status === 'ok') {
            this.setAddUserModalOpen(false)
            this.getUserInfoByPage(this.state.currentPage)
            alert('登录成功')
          } else {
            alert('登录失败')
          }
        })
    }
  }
  editUser(index) {
    const { editUsername, editPassword, editValPassword, editRole, message } = this.state
    axios
      .post(
        this.config.user.updateRolesForUser,
        qs.stringify({
          changeUsername: editUsername,
          roles: editRole,
        })
      )
      .then((res) => {
        console.log('updateRolesForUser request', res)
        if (res.status === 200 && res.data && res.data.status === 'ok') {
          this.getUserInfoByPage(this.state.currentPage)
          alert('修改成功')
        } else {
          alert('修改失败')
        }
      })
  }
  deleteUser(index) {
    const username = this.state.usersList[index].username
    axios
      .post(
        this.config.user.delUser,
        qs.stringify({
          username,
        })
      )
      .then((res) => {
        console.log('delUser request', res)
        if (res.status === 200 && res.data && res.data === 1) {
          this.getUserInfoByPage(this.state.currentPage)
          alert('删除成功')
        } else {
          alert('删除失败')
        }
      })
  }
  setAddUserModalOpen(addUserModalOpen) {
    this.setState({
      addUserModalOpen,
    })
  }
  setAddUserModalToggled() {
    const addUserModalToggled = this.state.addUserModalToggled
    this.setState({
      addUserModalToggled: !addUserModalToggled,
    })
  }
  setEditUserModalOpen(index, editUserModalOpen) {
    const editUserModalOpens = this.state.editUserModalOpens
    editUserModalOpens[index] = editUserModalOpen
    if (editUserModalOpen) {
      const user = this.state.usersList[index]
      this.setState({
        editUsername: user.username,
      })
    } else {
      this.setState({
        editUsername: '',
      })
    }
    this.setState({
      editUserModalOpens,
    })
  }
  setEditUserModalToggled(index) {
    const editUserModalToggleds = this.state.editUserModalToggleds
    editUserModalToggleds[index] = !editUserModalToggleds[index]
    this.setState({
      editUserModalToggleds,
    })
  }
  setDeleteUserModalOpen(index, deleteUserModalOpen) {
    const deleteUserModalOpens = this.state.deleteUserModalOpens
    deleteUserModalOpens[index] = deleteUserModalOpen
    this.setState({
      deleteUserModalOpens,
    })
  }
  setDeleteUserModalToggled(index) {
    const deleteUserModalToggleds = this.state.deleteUserModalToggleds
    deleteUserModalToggleds[index] = !deleteUserModalToggleds[index]
    this.setState({
      deleteUserModalToggleds,
    })
  }
  onUsernameInputChange(e) {
    this.setState({
      newUsername: e.target.value,
    })
  }
  onPasswordInputChange(e) {
    this.setState({
      newPassword: e.target.value,
    })
  }
  onValPasswordInputChange(e) {
    this.setState({
      newValPassword: e.target.value,
    })
  }
  onRoleSelectChange(value) {
    this.setState({
      newRole: value,
    })
  }
  onEditUsernameInputChange(e) {
    this.setState({
      editUsername: e.target.value,
    })
  }
  onEditPasswordInputChange(e) {
    this.setState({
      editPassword: e.target.value,
    })
  }
  onEditValPasswordInputChange(e) {
    this.setState({
      editValPassword: e.target.value,
    })
  }
  onEditRoleSelectChange(value) {
    this.setState({
      editRole: value,
    })
  }
  onPageChange(page) {
    this.setState(
      {
        currentPage: page,
      },
      () => {
        this.getUserInfoByPage(page)
      }
    )
  }
  handleDismiss() {
    const message = this.state.message
    message.messageVisible = false
    this.setState({
      message,
    })
  }
  render() {
    const {
      usersList,
      addUserModalOpen,
      addUserModalToggled,
      editUserModalOpens,
      editUserModalToggleds,
      deleteUserModalOpens,
      deleteUserModalToggleds,
      allRoles,
      newPassword,
      newValPassword,
      newUsername,
      newRole,
      editPassword,
      editValPassword,
      editUsername,
      editRole,
      currentPage,
      totalPage,
      message,
    } = this.state
    let visibleMessage = <></>
    if (message.messageVisible) {
      visibleMessage = <Message color="red" onDismiss={this.handleDismiss.bind(this)} header={message.messageHeader} content={message.messageContent} />
    }
    const copyRoles = [].concat(allRoles)
    const adminIndex = copyRoles.indexOf('admin')
    copyRoles.splice(adminIndex, 1)
    const rolesOp = copyRoles.map((item, index) => {
      return (
        <Option key={index} value={item}>
          {item}
        </Option>
      )
    })
    const usersInfo = usersList.map((item, index) => {
      let roleString = ''
      item.roles.forEach((role) => {
        roleString += role
      })
      return (
        <Table.Row key={index}>
          <Table.Cell>{index + 1}</Table.Cell>
          <Table.Cell>{item.username}</Table.Cell>
          <Table.Cell>{roleString}</Table.Cell>
          <Table.Cell>{item.createTime}</Table.Cell>
          <Table.Cell>
            <Modal
              className={'admin-manage-modal'}
              onClose={this.setEditUserModalOpen.bind(this, index, false)}
              onOpen={this.setEditUserModalOpen.bind(this, index, true)}
              open={editUserModalOpens[index]}
              trigger={
                <Button inverted color="blue" size="tiny">
                  编辑
                </Button>
              }>
              {/* <Modal.Header>Select a Photo</Modal.Header> */}
              <div className={'admin-manage-log-block ' + (addUserModalToggled ? 'admin-manage-log-block-toggled' : '')}>
                <div className={'admin-manage-log-heading'}>
                  添加用户
                  <FontAwesomeIcon className={'admin-manage-log-heading-icon'} icon={faTimesCircle} onClick={this.setEditUserModalOpen.bind(this, index, false)} />
                  <FontAwesomeIcon
                    className={'admin-manage-log-heading-icon'}
                    icon={editUserModalToggleds[index] ? faChevronCircleDown : faChevronCircleUp}
                    onClick={this.setEditUserModalToggled.bind(this, index)}
                  />
                </div>
                <Form className={'admin-manage-log-form'} labelCol={{ offset: 0, span: 0 }} wrapperCol={{ offset: 0, span: 24 }}>
                  <Form.Item>
                    <Input addonBefore={'用户名'} placeholder="输入用户名" value={editUsername} disabled onChange={this.onEditUsernameInputChange.bind(this)} />
                  </Form.Item>
                  {/* <Form.Item>
                    <Input addonBefore={'密 码'} type="password" placeholder="输入密码" value={editPassword} onChange={this.onEditPasswordInputChange.bind(this)} />
                  </Form.Item>
                  <Form.Item>
                    <Input addonBefore={'确认密码'} type="password" placeholder="确认密码" value={editValPassword} onChange={this.onEditValPasswordInputChange.bind(this)} />
                  </Form.Item> */}
                  <Form.Item>
                    <div style={{ display: 'flex', flexDirection: 'row' }}>
                      <span className="ant-input-group-addon">选择角色</span>
                      <Select defaultValue={editRole} onChange={this.onEditRoleSelectChange.bind(this)}>
                        {rolesOp}
                      </Select>
                    </div>
                  </Form.Item>
                  <Form.Item>
                    <AntdButton className={'admin-manage-log-form-button'} style={{ marginRight: '6%' }} onClick={this.setEditUserModalOpen.bind(this, false)}>
                      取消
                    </AntdButton>
                    <AntdButton className={'admin-manage-log-form-button'} onClick={this.editUser.bind(this, index, item.username)}>
                      修改
                    </AntdButton>
                  </Form.Item>
                </Form>
              </div>
            </Modal>

            <Modal
              className={'admin-manage-modal'}
              onClose={this.setDeleteUserModalOpen.bind(this, index, false)}
              onOpen={this.setDeleteUserModalOpen.bind(this, index, true)}
              open={deleteUserModalOpens[index]}
              trigger={
                <Button inverted color="blue" size="tiny" style={item.roles.includes('admin') ? { display: 'none' } : {}}>
                  删除用户
                </Button>
              }>
              {/* <Modal.Header>Select a Photo</Modal.Header> */}
              <div className={'admin-manage-log-block ' + (addUserModalToggled ? 'admin-manage-log-block-toggled' : '')}>
                <div className={'admin-manage-log-heading'}>
                  添加用户
                  <FontAwesomeIcon className={'admin-manage-log-heading-icon'} icon={faTimesCircle} onClick={this.setDeleteUserModalOpen.bind(this, index, false)} />
                  <FontAwesomeIcon
                    className={'admin-manage-log-heading-icon'}
                    icon={deleteUserModalToggleds[index] ? faChevronCircleDown : faChevronCircleUp}
                    onClick={this.setDeleteUserModalToggled.bind(this, index)}
                  />
                </div>
                <Form className={'admin-manage-log-form'} labelCol={{ offset: 0, span: 0 }} wrapperCol={{ offset: 0, span: 24 }}>
                  <Form.Item>
                    <AntdButton className={'admin-manage-log-form-button'} style={{ marginRight: '6%' }} onClick={this.setDeleteUserModalOpen.bind(this, false)}>
                      取消删除
                    </AntdButton>
                    <AntdButton className={'admin-manage-log-form-button'} onClick={this.deleteUser.bind(this, index)}>
                      确定删除
                    </AntdButton>
                  </Form.Item>
                </Form>
              </div>
            </Modal>
          </Table.Cell>
        </Table.Row>
      )
    })
    return (
      <div className="admin-manage-out-container">
        <div>
          <Modal
            className={'admin-manage-modal'}
            onClose={this.setAddUserModalOpen.bind(this, false)}
            onOpen={this.setAddUserModalOpen.bind(this, true)}
            open={addUserModalOpen}
            trigger={
              <Button inverted color="blue" size="tiny">
                新增用户
              </Button>
            }>
            {/* <Modal.Header>Select a Photo</Modal.Header> */}
            <div className={'admin-manage-log-block ' + (addUserModalToggled ? 'admin-manage-log-block-toggled' : '')}>
              <div className={'admin-manage-log-heading'}>
                添加用户
                <FontAwesomeIcon className={'admin-manage-log-heading-icon'} icon={faTimesCircle} onClick={this.setAddUserModalOpen.bind(this, false)} />
                <FontAwesomeIcon className={'admin-manage-log-heading-icon'} icon={addUserModalToggled ? faChevronCircleDown : faChevronCircleUp} onClick={this.setAddUserModalToggled.bind(this)} />
              </div>
              <Form className={'admin-manage-log-form'} labelCol={{ offset: 0, span: 0 }} wrapperCol={{ offset: 0, span: 24 }}>
                <Form.Item>
                  <Input addonBefore={'用户名'} placeholder="输入用户名" value={newUsername} onChange={this.onUsernameInputChange.bind(this)} />
                </Form.Item>
                <Form.Item>
                  <Input addonBefore={'密 码'} type="password" placeholder="输入密码" value={newPassword} onChange={this.onPasswordInputChange.bind(this)} />
                </Form.Item>
                <Form.Item>
                  <Input addonBefore={'确认密码'} type="password" placeholder="确认密码" value={newValPassword} onChange={this.onValPasswordInputChange.bind(this)} />
                </Form.Item>
                <Form.Item>
                  <div style={{ display: 'flex', flexDirection: 'row' }}>
                    <span className="ant-input-group-addon">选择角色</span>
                    <Select defaultValue={newRole} onChange={this.onRoleSelectChange.bind(this)}>
                      {rolesOp}
                    </Select>
                  </div>
                </Form.Item>
                <Form.Item>
                  <AntdButton className={'admin-manage-log-form-button'} style={{ marginRight: '6%' }} onClick={this.setAddUserModalOpen.bind(this, false)}>
                    取消
                  </AntdButton>
                  <AntdButton className={'admin-manage-log-form-button'} onClick={this.addUser.bind(this)}>
                    添加
                  </AntdButton>
                </Form.Item>
                {visibleMessage}
              </Form>
            </div>
          </Modal>
        </div>
        <Table celled inverted>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>ID</Table.HeaderCell>
              <Table.HeaderCell>用户名</Table.HeaderCell>
              <Table.HeaderCell>角色</Table.HeaderCell>
              <Table.HeaderCell>添加时期</Table.HeaderCell>
              <Table.HeaderCell>操作</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>{usersInfo}</Table.Body>
        </Table>
        <div className="admin-manage-container-bottom">
          <Pagination current={currentPage} defaultCurrent={currentPage} total={totalPage * 10} onChange={this.onPageChange.bind(this)} />
        </div>
      </div>
    )
  }
}

export default AdminManagePanel
