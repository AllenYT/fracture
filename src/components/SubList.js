import React, { Component } from 'react'
import { Accordion, Icon, Button } from 'semantic-ui-react'

import axios from 'axios'
import qs from 'qs'
import SeriesIdList from './SeriesIdList'
import '../css/subList.css'

const patientInfoButtonStyle = {
  marginLeft: '20px',
}

class SubList extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hint: '',
      subList: [],
      activeIndex: -1,
      cart: new Set(),
      show: false,
      dataValidContnt: [],
      contextRef: props.contextRef,
      random: Math.random(),
    }
    this.handleClick = this.handleClick.bind(this)

    this.handlePidClick = this.handlePidClick.bind(this)
    this.saveCart = this.saveCart.bind(this)
    this.config = JSON.parse(localStorage.getItem('config'))
  }

  saveCart() {
    // console.log('41', this.state.cart)
    const token = localStorage.getItem('token')
    const headers = {
      Authorization: 'Bearer '.concat(token),
    }
    let stringArray = ''
    for (let item of this.state.cart) {
      stringArray = stringArray + item['caseId'] + ','
      // console.log("items", item);
    }
    if (stringArray !== '') {
      stringArray = stringArray.substring(0, stringArray.length - 1)
    }
    const params = {
      // cart: Array.from(this.state.cart).join(","),
      cart: stringArray,
    }
    console.log('caseIdArray', stringArray)
    axios
      .post(this.config.cart.saveCart, qs.stringify(params), { headers })
      .then((res) => {
        // console.log("caseIdArray", caseIdArray);
        console.log(res.data.status)
      })
      .catch((err) => {
        console.log('err', err)
      })
  }

  getCheckedSeries = (result, params) => {
    let currentCart = this.state.cart
    console.log('getCheckedSeries before', currentCart)
    if (params.status === 'add') {
      currentCart.add(params.value)
    } else {
      let deleteItem = -1
      currentCart.forEach((v) => {
        if (v.caseId === params.value.caseId) {
          deleteItem = v
        }
      })
      if (deleteItem !== -1) {
        currentCart.delete(deleteItem)
      }
    }
    console.log('getCheckedSeries after', currentCart)
    // currentCart.add(Math.random())
    this.setState({
      cart: currentCart,
      random: Math.random(),
    })
  }

  async handleClick(e, titleProps) {
    // console.log('click e', e)
    const { index, studyAry, active } = titleProps

    const { activeIndex, subList } = this.state
    const newIndex = activeIndex === index ? -1 : index
    this.setState({ activeIndex: newIndex })
    //dataValid
    if (!active) {
      console.log(index, 'subList', this.state.subList, this.state.subList.length)
      const content = studyAry
      const token = localStorage.getItem('token')
      const headers = {
        Authorization: 'Bearer '.concat(token),
      }
      var dataValidContnt = []
      for (var i = 0; i < content.length; i++) {
        console.log('content', content[i]['caseId'])
        const params = {
          caseId: content[i]['caseId'],
        }
        const validInfo = new Promise((resolve, reject) => {
          axios.post(this.config.draft.dataValid, qs.stringify(params)).then((validResponse) => {
            const validInfo = validResponse.data
            let validContent = {
              caseId: params.caseId,
              validInfo: validInfo,
            }
            resolve(validContent)
          }, reject)
        })
        dataValidContnt[i] = await validInfo
        this.setState({ dataValidContnt: dataValidContnt })
      }

      console.log('sublist dataValidContnt', dataValidContnt)
    }

    // this.setState({ dataValidContnt: dataValidContnt })
  }

  handlePidClick() {
    window.location.href = '/patientInfo/' + this.props.mainItem

    // window.location.href='/infoCenter'
  }

  componentDidMount() {
    this.props.onRef(this)
    // get current cart
    if (localStorage.getItem('token') != null) {
      const token = localStorage.getItem('token')
      const headers = {
        Authorization: 'Bearer '.concat(token),
      }
      axios
        .get(this.config.cart.getCart, { headers })
        .then((res) => {
          if (res.data.status === 'okay') {
            const cartString = res.data.cart
            console.log('getCart', cartString)
            let cart_lst = cartString
            let cart_set = new Set(cart_lst)
            this.setState({ cart: cart_set })
          }
        })
        .catch((err) => {
          console.log('err', err)
        })
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.mainItem !== this.props.mainItem || prevProps.otherKeyword !== this.props.otherKeyword) {
      this.setState({ activeIndex: -1 })
      this.loadDetailedData()
    }
    if (prevState.random !== this.state.random) {
      this.saveCart()
    }
  }

  loadDetailedData() {
    const token = localStorage.getItem('token')
    const headers = {
      Authorization: 'Bearer '.concat(token),
    }

    const params = {
      mainItem: this.props.mainItem,
      type: this.props.type,
      otherKeyword: this.props.otherKeyword,
    }

    axios
      .post(this.config.record.getSubListForMainItem, qs.stringify(params), { headers })
      .then((response) => {
        const data = response.data
        if (data.status !== 'okay') {
          console.log('Not okay')
        } else {
          console.log('sublist', data.subList)
          const subList = data.subList
          let totalDates = 0
          let totalStudies = 0
          for (const subKey in subList) {
            totalDates++
            totalStudies += subList[subKey].length
          }
          if (totalDates > 0 && totalStudies > 0) {
            if (this.props.type === 'date') {
              this.setState({
                hint: '?????????????????????' + totalStudies + '?????????',
              })
            } else {
              this.setState({
                hint: '?????????????????????' + totalDates + '?????????',
              })
            }
          } else {
            this.setState({ hint: '' })
          }

          this.setState({ subList: subList, show: true })
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }

  render() {
    const { subList, hint, mainItem, cart, dataValidContnt } = this.state
    // console.log('render dataValidContnt', this.state.dataValidContnt)

    let panels = []
    let idx = 0

    let icon = 'calendar'

    if (this.props.type === 'date') {
      icon = 'user'
    }
    // console.log("subList", subList);
    for (const subKey in subList) {
      const studyAry = subList[subKey]
      // console.log('studyAry', studyAry)
      const len = studyAry.length
      panels.push(
        <div key={idx}>
          <Accordion.Title className="space" active={this.state.activeIndex === idx} index={idx} studyAry={studyAry} onClick={this.handleClick}>
            <div style={{ display: 'inline-block', width: '10%' }}>
              <Icon name={icon} />
            </div>
            <div
              style={{
                display: 'inline-block',
                width: '40%',
                textAlign: 'center',
              }}>
              {subKey}
            </div>
            <div
              style={{
                display: 'inline-block',
                width: '50%',
                textAlign: 'right',
              }}>
              <span className="display-right">???{len}?????????</span>
            </div>
          </Accordion.Title>
          <Accordion.Content active={this.state.activeIndex === idx}>
            {dataValidContnt && dataValidContnt.length ? (
              <SeriesIdList cart={cart} parent={this} content={studyAry} contextRef={this.state.contextRef} pid={mainItem} dataValidContnt={dataValidContnt} />
            ) : null}
          </Accordion.Content>
        </div>
      )
      idx += 1
    }

    // console.log('show',this.state.show)
    // console.log('panel',panels)
    return (
      <div>
        <div>
          <div className="hint">
            {hint}
            {panels.length !== 0 && icon === 'calendar' ? (
              <Button style={patientInfoButtonStyle} content="????????????" icon="right arrow" labelPosition="right" className="ui green inverted button" onClick={this.handlePidClick} />
            ) : null}
          </div>
          <Accordion styled id="subList-accordion">
            {panels}
          </Accordion>
        </div>
      </div>
    )
  }
}

export default SubList
