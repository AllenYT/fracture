import React, {Component} from 'react'
import {Accordion, Icon,Button} from 'semantic-ui-react'

import axios from 'axios'
import qs from 'qs'
import SeriesIdList from './SeriesIdList'
import '../css/subList.css'

const config = require('../config.json')
const recordConfig = config.record
const cartConfig = config.cart

const patientInfoButtonStyle = {
    'marginLeft': '20px'
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
            contextRef:props.contextRef,
            random: Math.random()
        }
        this.handleClick = this
            .handleClick
            .bind(this)

        this.handlePidClick = this
            .handlePidClick
            .bind(this)
        this.exportCaseId = this
            .exportCaseId
            .bind(this)
        this.saveCart = this.saveCart.bind(this)

    }

    saveCart() {
        // console.log('41', this.state.cart)
        const token = localStorage.getItem('token')
        const headers = {
            'Authorization': 'Bearer '.concat(token)
        }
        const params = {
            cart: Array.from(this.state.cart).join(',')
        }
        axios.post(cartConfig.saveCart, qs.stringify(params), {headers})
        .then(res => {
            console.log(this.state.cart)
            console.log(res.data.status)
        })
        .catch(err => {
            console.log("err", err)
        })
    }

    getCheckedSeries = (result, params) => {
        let currentCart = this.state.cart
        if (params.status === 'add')
            currentCart.add(params.value)
        else
            currentCart.delete(params.value)
        // currentCart.add(Math.random())
        this.setState({
            cart: currentCart,
            random: Math.random()
        })
    }

    handleClick = (e, titleProps) => {
        const {index} = titleProps
        const {activeIndex} = this.state
        const newIndex = activeIndex === index
            ? -1
            : index
        this.setState({activeIndex: newIndex})
    }

    handlePidClick(){
        window.location.href = '/patientInfo/' + this.props.mainItem
        // window.location.href='/infoCenter'
    }

    componentDidMount() {
        // get current cart
        if (localStorage.getItem('token') != null) {
            const token = localStorage.getItem('token')
            const headers = {
                'Authorization': 'Bearer '.concat(token)
            }
            axios.get(cartConfig.getCart, {headers})
            .then(res => {
                if (res.data.status === 'okay') {
                    const cartString = res.data.cart
                    let cart_lst = cartString.split(",")
                    let cart_set = new Set(cart_lst)
                    this.setState({cart: cart_set})
                }
            })
            .catch(err => {
                console.log('err', err)
            })
        }
    }


    componentDidUpdate(prevProps, prevState) {
        if (prevProps.mainItem !== this.props.mainItem || prevProps.otherKeyword !== this.props.otherKeyword) {
            this.setState({activeIndex: -1})
            this.loadDetailedData()
        }
        if (prevState.random !== this.state.random) {
            this.saveCart()
        }
    }

    //导出caseid传入下载界面
    exportCaseId(){
        console.log('cid',this.props.storecid)
        this.nextPath('/download')
    }

    loadDetailedData() {
        const token = localStorage.getItem('token')
        const headers = {
            'Authorization': 'Bearer '.concat(token)
        }

        const params = {
            mainItem: this.props.mainItem,
            type: this.props.type,
            otherKeyword: this.props.otherKeyword
        }

        axios.post(recordConfig.getSubList, qs.stringify(params), {headers}).then((response) => {
            const data = response.data
            if (data.status !== 'okay') {
                console.log("Not okay")
                // window.location.href = '/'
            } else {
                console.log('sublist',data.subList)
                const subList = data.subList
                let totalDates = 0
                let totalStudies = 0
                for (const subKey in subList) {
                    totalDates++ 
                    totalStudies += subList[subKey].length
                }
                // console.log('MAINITEM', this.props.mainItem)
                if (totalDates > 0 && totalStudies > 0) {
                    this.setState({
                        hint: '当前病人包含共' + totalDates + '个日期的' + totalStudies + '次检查'
                    })
                } else {
                    this.setState({hint: ''})
                }

                this.setState({subList: subList, show: true})
            }
        }).catch((error) => {
            console.log(error)
        })
    }

    render() {

        const subList = this.state.subList
        
        const hint = this.state.hint
        const mainItem = this.props.mainItem
        const cart = this.state.cart

        let panels = []
        let idx = 0

        let icon = 'calendar'

        if (this.props.type === 'date') {
            icon = 'user'
        }

        for (const subKey in subList) {
            const studyAry = subList[subKey]
            const len = studyAry.length
            //  console.log('subkey',subKey)
            // console.log('study',studyAry)

            const subKeyL=subKey.split('_')
            const patientId=subKeyL[0]
            let patientName=subKeyL[1]
            const patientSex=subKeyL[2]=='M' ? "男" : "女"
            let newValue=[]
            if(this.props.type==='date'){
                if(patientName===undefined){
                    patientName='hhhhhh'
                }
                newValue=[patientId,patientName,patientSex]
            }
            else{
                newValue=[patientId]
            }
            panels.push(
                <div key={idx}>
                    <Accordion.Title className="space"
                        active={this.state.activeIndex === idx}
                        index={idx}
                        onClick={this.handleClick}
                        // content={
                        // <tr>
                        //     <td>
                        //         <Icon name={icon}/>
                        //     </td>
                        //             <td>
                        //                 {newValue[0]}
                        //             </td>
                        //             <td>
                        //                 {newValue[1]}
                        //             </td>
                        //             <td>
                        //                 {newValue[2]}
                        //             </td>
                        //             <td style={{textAlign:'right'}}>
                        //                 <span className="display-right">共{len}次检查</span>
                        //             </td>
                        //         </tr>}
                    >
                        <tr>
                            <td>
                                <Icon name={icon}/>
                            </td>
                                    <td>
                                        {newValue[0]}
                                    </td>
                                    <td>
                                        {newValue[1]}
                                    </td>
                                    <td>
                                        {newValue[2]}
                                    </td>
                                    <td style={{textAlign:'right'}}>
                                        <span className="display-right">共{len}次检查</span>
                                    </td>
                                </tr>
                                {/* } */}
                        {/* <Icon name={icon}/>  */}
                        
                        {/* <span className="display-right">共{len}次检查</span> */}
                    </Accordion.Title>
                    <Accordion.Content active={this.state.activeIndex === idx}>
                        <SeriesIdList cart={cart} parent={this} content={studyAry} contextRef={this.state.contextRef} pid={mainItem} />
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
                        {panels.length!==0 && icon==='calendar' ?
                            <Button style={patientInfoButtonStyle} content='病人详情' icon='right arrow' labelPosition='right' className='ui green inverted button' onClick={this.handlePidClick}/> : null
                        }
                    </div>
                    <Accordion styled id="subList-accordion">
                        {panels}
                    </Accordion>
                </div>

            {/* {panels.length!==0 && icon==='calendar'?
                <Button  inverted color='blue' onClick={this.exportCaseId} id='output'>导出</Button>
                :null
            } */}
                
            

            </div>

        )
    }
}

export default SubList
