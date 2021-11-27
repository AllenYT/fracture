import React, { Component } from 'react'
import axios from 'axios'
import qs from 'qs'
import _ from 'lodash'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimesCircle, faChevronCircleUp, faChevronCircleDown, faUser, faLock, faSortUp, faSortDown } from '@fortawesome/free-solid-svg-icons'

import { Form, Input, Button as AntdButton, Select, notification } from 'antd'
import { Button, Table, Modal, Message, Pagination } from 'semantic-ui-react'
import md5 from 'js-md5'
import LowerAuth from '../components/LowerAuth'

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
      orderBy: 'createTime desc,username desc',
      addMessage: {
        messageVisible: false,
        messageType: 'failed',
        messageHeader: '',
        messageContent: '',
      },
      editMessage: [{}],
    }
    this.config = JSON.parse(localStorage.getItem('config'))
  }
  async componentDidMount() {
    const mainElement = document.getElementById('main')
    mainElement.setAttribute('style', 'height:100%')
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
    this.updateUserInfoByPage(1)
  }
  componentWillUnmount() {
    const mainElement = document.getElementById('main')
    mainElement.setAttribute('style', '')
  }
  updateUserInfoByPage(page) {
    axios
      .post(
        this.config.user.getUserAtPage,
        qs.stringify({
          page: page,
          orderBy: this.state.orderBy,
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
  updateUserInfoByTotalPage(totalPage) {
    console.log(totalPage)
  }
  validateUserInfo(username, password, valPassword, role) {
    const message = {}
    let userRegex = new RegExp('^[a-zA-Z]{1}[a-zA-Z0-9]*$')
    let paswdRegex = new RegExp('^[a-zA-Z0-9]+$')
    if (!username || username.length > 12 || username.length < 4 || !userRegex.test(username)) {
      console.log('username length error')
      message.messageVisible = true
      message.messageType = 'failed'
      message.messageHeader = '用户名格式不符'
      message.messageContent = '用户名为长度不少于4、不超过12位的字符，并仅支持字母、数字，且需以字母开头'
      return message
    } else if (password !== valPassword) {
      console.log('two time password not match erro')
      message.messageVisible = true
      message.messageType = 'failed'
      message.messageHeader = '两次密码不匹配'
      message.messageContent = '两次密码不匹配'
      return message
    } else if (!password || password.length > 16 || password.length < 6 || !paswdRegex.test(password)) {
      console.log('password length error')
      message.messageVisible = true
      message.messageType = 'failed'
      message.messageHeader = '密码格式不符'
      message.messageContent = '密码为长度不少于6、不超过16位的字符，并仅支持字母、数字'
      return message
    } else if (!role) {
      console.log('not choose role error')
      message.messageVisible = true
      message.messageType = 'failed'
      message.messageHeader = '没有选择角色'
      message.messageContent = '没有选择角色'
      return message
    } else {
      message.messageVisible = false
      return message
    }
  }
  addUser() {
    const { newUsername, newPassword, newValPassword, newRole } = this.state
    console.log(newUsername, newPassword, newValPassword, newRole)

    const message = this.validateUserInfo(newUsername, newPassword, newValPassword, newRole)

    if (!message.messageVisible) {
      axios
        .post(
          this.config.user.insertUserInfoForAdmin,
          qs.stringify({
            createUsername: newUsername,
            createPassword: md5(newPassword),
            roles: newRole,
          })
        )
        .then((res) => {
          console.log('insertUserInfoForAdmin request', res)
          if (res.status === 200 && res.data && res.data.status === 'ok') {
            const totalPage = res.data.newTotalPage
            this.setState(
              {
                totalPage,
                currentPage: 1,
                orderBy: 'createTime desc,username desc',
              },
              () => {
                this.updateUserInfoByPage(1)
              }
            )
            alert('添加成功')
            this.setAddUserModalOpen(false)
          } else if (res.data.status === 'existed') {
            alert('已存在的用户，添加失败')
          } else {
            alert('添加失败')
          }
        })
    } else {
      if (this.timer != null) {
        clearTimeout(this.timer)
      }
      this.setState(
        {
          addMessage: message,
        },
        () => {
          this.timer = setTimeout(() => {
            const addMessage = this.state.addMessage
            addMessage.messageVisible = false
            this.setState({
              addMessage,
            })
          }, 5000)
        }
      )
    }
  }
  editUser(index) {
    const { editUsername, editPassword, editValPassword, editRole } = this.state
    const message = this.validateUserInfo(editUsername, editPassword, editValPassword, editRole)

    if (!message.messageVisible) {
      axios
        .post(
          this.config.user.updateUserInfoForAdmin,
          qs.stringify({
            username: editUsername,
            newPassword: md5(editPassword),
            newRoles: editRole,
          })
        )
        .then((res) => {
          console.log('updateRolesForUser request', res)
          if (res.status === 200 && res.data && res.data.status === 'ok') {
            this.updateUserInfoByPage(this.state.currentPage)
            alert('修改成功')
            this.setEditUserModalOpen(index, false)
          } else {
            alert('修改失败')
          }
        })
    } else {
      const editMessage = this.state.editMessage
      editMessage[index] = message
      if (this.timer != null) {
        clearTimeout(this.timer)
      }
      this.setState(
        {
          editMessage,
        },
        () => {
          this.timer = setTimeout(() => {
            const editMessage = this.state.editMessage
            editMessage[index].messageVisible = false
            this.setState({
              editMessage,
            })
          }, 5000)
        }
      )
    }
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
        if (res.status === 200 && res.data && res.data.status === 'ok') {
          const totalPage = res.data.newTotalPage
          const currentPage = this.state.currentPage
          if (currentPage > totalPage) {
            this.setState(
              {
                totalPage,
                currentPage: totalPage,
                orderBy: 'createTime desc,username desc',
              },
              () => {
                this.updateUserInfoByPage(totalPage)
              }
            )
          } else {
            this.setState(
              {
                totalPage,
                currentPage: currentPage,
                orderBy: 'createTime desc,username desc',
              },
              () => {
                this.updateUserInfoByPage(currentPage)
              }
            )
          }
          alert('删除成功')
          this.setDeleteUserModalOpen(index, false)
        } else {
          alert('删除失败')
        }
      })
  }
  setAddUserModalOpen(addUserModalOpen) {
    if (!addUserModalOpen) {
      this.setState({
        newUsername: '',
        newPassword: '',
        newValPassword: '',
        newRole: '',
      })
    }
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
    if (!editUserModalOpen) {
      this.setState({
        editUsername: '',
        editPassword: '',
        editValPassword: '',
        editRole: '',
      })
    }
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
  onPageChange(e, { activePage }) {
    this.setState(
      {
        currentPage: activePage,
      },
      () => {
        this.updateUserInfoByPage(activePage)
      }
    )
  }
  handleDismissAddMessage() {
    const addMessage = this.state.addMessage
    addMessage.messageVisible = false
    this.setState({
      addMessage,
    })
  }
  handleDismissEditMessage(index) {
    const editMessage = this.state.editMessage
    editMessage[index].messageVisible = false
    this.setState({
      editMessage,
    })
  }
  orderUsersList(sortColumn) {
    let resultOrderBy = ''
    const orderBy = this.state.orderBy
    const orderByList = orderBy.split(',')
    let firstOrderBy = ''
    let remainOrderByList = []
    for (let i = 0; i < orderByList.length; i++) {
      const orderByItem = orderByList[i]
      const orderByItemList = orderByItem.split(' ')
      if (orderByItemList.length === 2 && orderByItemList[0] === sortColumn) {
        if (orderByItemList[1] === 'asc') {
          orderByItemList[1] = 'desc'
        } else {
          orderByItemList[1] = 'asc'
        }
        firstOrderBy = orderByItemList.join(' ')
      } else {
        remainOrderByList.push(orderByItem)
      }
    }
    if (remainOrderByList.length > 0) {
      resultOrderBy = firstOrderBy + ',' + remainOrderByList.join(',')
    } else {
      resultOrderBy = firstOrderBy
    }
    this.setState({
      orderBy: resultOrderBy,
    })
    axios
      .post(
        this.config.user.getUserAtPage,
        qs.stringify({
          page: this.state.currentPage,
          orderBy: resultOrderBy,
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
      addMessage,
      editMessage,
      orderBy,
    } = this.state
    let visibleAddMessage = <></>
    if (addMessage.messageVisible) {
      visibleAddMessage = <Message color="red" onDismiss={this.handleDismissAddMessage.bind(this)} header={addMessage.messageHeader} content={addMessage.messageContent} />
    }
    let visibleEditMessage = editMessage.map((item, index) => {
      if (item.messageVisible) {
        return <Message color="red" onDismiss={this.handleDismissEditMessage.bind(this, index)} header={item.messageHeader} content={item.messageContent} />
      } else {
        return <></>
      }
    })

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
              <div className={'admin-manage-log-block ' + (editUserModalToggleds[index] ? 'admin-manage-log-block-toggled' : '')}>
                <div className={'admin-manage-log-heading'}>
                  编辑用户信息
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
                  <Form.Item>
                    <Input addonBefore={'密 码'} type="password" placeholder="输入密码" value={editPassword} onChange={this.onEditPasswordInputChange.bind(this)} />
                  </Form.Item>
                  <Form.Item>
                    <Input addonBefore={'确认密码'} type="password" placeholder="确认密码" value={editValPassword} onChange={this.onEditValPasswordInputChange.bind(this)} />
                  </Form.Item>
                  <Form.Item>
                    <div style={{ display: 'flex', flexDirection: 'row' }}>
                      <span className="ant-input-group-addon">选择角色</span>
                      <Select defaultValue={editRole} onChange={this.onEditRoleSelectChange.bind(this)}>
                        {rolesOp}
                      </Select>
                    </div>
                  </Form.Item>
                  <Form.Item>
                    <AntdButton className={'admin-manage-log-form-button'} style={{ marginRight: '6%' }} onClick={this.setEditUserModalOpen.bind(this, index, false)}>
                      取消
                    </AntdButton>
                    <AntdButton className={'admin-manage-log-form-button'} onClick={this.editUser.bind(this, index, item.username)}>
                      修改
                    </AntdButton>
                  </Form.Item>
                  {visibleEditMessage[index]}
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
              <div className={'admin-manage-log-block ' + (deleteUserModalToggleds[index] ? 'admin-manage-log-block-toggled' : '')}>
                <div className={'admin-manage-log-heading'}>
                  删除用户
                  <FontAwesomeIcon className={'admin-manage-log-heading-icon'} icon={faTimesCircle} onClick={this.setDeleteUserModalOpen.bind(this, index, false)} />
                  <FontAwesomeIcon
                    className={'admin-manage-log-heading-icon'}
                    icon={deleteUserModalToggleds[index] ? faChevronCircleDown : faChevronCircleUp}
                    onClick={this.setDeleteUserModalToggled.bind(this, index)}
                  />
                </div>
                <Form className={'admin-manage-log-form'} labelCol={{ offset: 0, span: 0 }} wrapperCol={{ offset: 0, span: 24 }}>
                  <Form.Item>
                    <AntdButton className={'admin-manage-log-form-button'} style={{ marginRight: '6%' }} onClick={this.setDeleteUserModalOpen.bind(this, index, false)}>
                      取消
                    </AntdButton>
                    <AntdButton className={'admin-manage-log-form-button'} onClick={this.deleteUser.bind(this, index)}>
                      删除
                    </AntdButton>
                  </Form.Item>
                </Form>
              </div>
            </Modal>
          </Table.Cell>
        </Table.Row>
      )
    })
    let usernameDirection = ''
    let createTimeDirection = ''
    const orderByList = orderBy.split(',')
    for (let i = 0; i < orderByList.length; i++) {
      const orderByItem = orderByList[i]
      const orderByItemList = orderByItem.split(' ')
      if (orderByItemList.length === 2 && orderByItemList[0] === 'username') {
        usernameDirection = orderByItemList[1]
      }
      if (orderByItemList.length === 2 && orderByItemList[0] === 'createTime') {
        createTimeDirection = orderByItemList[1]
      }
    }
    return localStorage.getItem('auths') !== null && JSON.parse(localStorage.getItem('auths')).indexOf('nodule_search') > -1 ? (
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
                新增用户
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
                {visibleAddMessage}
              </Form>
            </div>
          </Modal>
        </div>
        <Table celled inverted>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>ID</Table.HeaderCell>
              <Table.HeaderCell>
                <div className={'admin-manage-table-header-cell-order'}>
                  <span>用户名</span>
                  <span className={'admin-manage-table-header-cell-order-right'} onClick={this.orderUsersList.bind(this, 'username')}>
                    <FontAwesomeIcon className={(usernameDirection === 'desc' ? 'admin-manage-table-header-icon-hide' : '') + ' admin-manage-table-header-icon-up'} icon={faSortUp} />
                    <FontAwesomeIcon className={(usernameDirection === 'asc' ? 'admin-manage-table-header-icon-hide' : '') + ' admin-manage-table-header-icon-down'} icon={faSortDown} />
                  </span>
                </div>
              </Table.HeaderCell>
              <Table.HeaderCell>角色</Table.HeaderCell>
              <Table.HeaderCell>
                <div className={'admin-manage-table-header-cell-order'}>
                  <span>添加日期</span>
                  <span className={'admin-manage-table-header-cell-order-right'} onClick={this.orderUsersList.bind(this, 'createTime')}>
                    <FontAwesomeIcon className={(createTimeDirection === 'desc' ? 'admin-manage-table-header-icon-hide' : '') + ' admin-manage-table-header-icon-up'} icon={faSortUp} />
                    <FontAwesomeIcon className={(createTimeDirection === 'asc' ? 'admin-manage-table-header-icon-hide' : '') + ' admin-manage-table-header-icon-down'} icon={faSortDown} />
                  </span>
                </div>
              </Table.HeaderCell>
              <Table.HeaderCell>操作</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>{usersInfo}</Table.Body>
        </Table>
        <div className="admin-manage-container-bottom">
          <Pagination onPageChange={this.onPageChange.bind(this)} activePage={currentPage} totalPages={totalPage} />
        </div>
      </div>
    ) : (
      <LowerAuth></LowerAuth>
    )
  }
}

export default AdminManagePanel
