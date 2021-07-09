import React, {Component} from 'react'
import {Popup, Button, Checkbox} from 'semantic-ui-react'
import {withRouter} from 'react-router-dom'
import axios from 'axios'
import qs from 'qs'
import CurrentDraftsDisplay from './CurrentDraftsDisplay'

import '../css/seriesIdList.css'
import { Link } from 'react-router-dom/cjs/react-router-dom.min'

// const storecid = []
class SeriesIdList extends Component {

    constructor(props) {
        super(props);
        this.displayStudy = this.displayStudy.bind(this)
        this.state={
            contextRef:props.contextRef,
            // cart: new Set()
        }
        this.config = JSON.parse(localStorage.getItem('config'))
        this.storeCaseId = this
            .storeCaseId
            .bind(this)
        this.validValue = this.validValue.bind(this)
        // this.saveCart = this.saveCart.bind(this)
    }


    nextPath(path) {
        // console.log('cas',storecid)
        this.props.history.push(path)
        // this.props.history.push(path, {storeCaseId: storecid})
    }

    displayStudy(e) {
        console.log(e.currentTarget.dataset.id)
        // request, api, modifier
        const token = localStorage.getItem('token')
        const headers = {
            'Authorization': 'Bearer '.concat(token)
        }
        const params = {
            caseId: e.currentTarget.dataset.id
        }
        axios.post(this.config.draft.getDataPath, qs.stringify(params), {headers})
        .then(res => {
            console.log('result from server', res.data)
            console.log('params',params)
            // window.open('/case/' + params.caseId + '/' + res.data,'target','')
            // this.props.history.push('/case/' + params.caseId + '/' + res.data)
            const oa = document.createElement('a');
            oa.href = '/case/' + params.caseId + '/' + res.data;
            oa.setAttribute('target', '_blank');
            oa.setAttribute('rel',"nofollow noreferrer")
            document.body.appendChild(oa);
            oa.click();
            
            // console.log('data',res.data)
            // this.nextPath('/case/' + params.caseId + '/' + res.data)
            // window.open('/case/' + params.caseId + '/' + res.data, '_blank')
            // const w=window.open('about:blank');
            // w.location.href = '/case/' + params.caseId + '/' + res.data
            // this.nextPath('/case/' + params.caseId + '/deepln')
        })
        .catch(err => {
            console.log(err)
        })
        // this.nextPath('/case/' + e.currentTarget.dataset.id + '/deepln')
        //this.nextPath('/case/' + e.currentTarget.dataset.id + '/origin')
    }

    componentDidMount() {
        // 取一个购物车内容
    }

    // saveCart() {
    //     const token = localStorage.getItem('token')
    //     const headers = {
    //         'Authorization': 'Bearer '.concat(token)
    //     }
    //     const params = {
    //         cart: Array.from(this.state.cart).join(',')
    //     }
    //     axios.post(cartConfig.saveCart, qs.stringify(params), {headers})
    //     .then(res => {
    //         console.log(this.state.cart)
    //         console.log(res.data.status)
    //     })
    //     .catch(err => {
    //         console.log("err", err)
    //     })
    // }




    storeCaseId(e,{checked,value,id}){
        console.log('checked', checked)
        console.log(value)
        let params = {}
        if (checked)
            params = {'status': 'add', 'value': value}
        else {
            params = {'status': 'del', 'value': value}
        }
        // console.log(currentCart)
        // // this.saveCart()
        // this.setState({cart: currentCart})
        this.props.parent.getCheckedSeries(this, params)
        

        // Array.prototype.indexOf = function(val) { 
        //     for (var i = 0; i < this.length; i++) {
        //         if (this[i] == val) return i;
        //     }
        //     return -1;
        //     };
        // Array.prototype.remove = function(val) { 
        //     var index = this.indexOf(val);
        //         if (index > -1) {
        //         this.splice(index, 1);
        //     }
        //     };
        // if(checked){
        //     storecid.push(value)
        // }
        // else{

        //     storecid.remove(value)
        // }
        // console.log('store',storecid)
    }

    ischeck(){
        return true
    }

    validValue(value) {
        if (this.props.cart.has(value))
            return true;
        else
            return false
    }

    render() {
        const content = this.props.content
        const pid = this.props.pid
        let CheckboxDis = {
            display: 'none'
        }
        if (localStorage.getItem('token') != null) {
            CheckboxDis = {
                display: 'block'
            }
        }
        return (
            <div>
                {content.map((value, index) => {
                    const idName = value+index
                    // console.log('idname',idName)
                    return (
                        <div key={index}>
                            <div className='export'>
                                <Checkbox id={idName} onChange={this.storeCaseId} value={value} checked={this.validValue(value)} style={CheckboxDis}></Checkbox>
                            </div>
                            <p className='sid'>{value.split('#')[1]}</p>
                            <Popup trigger={<Button size='mini' inverted color='green' data-id={value.split('#')[0]} icon='chevron right' onClick={this.displayStudy} 
                            floated='right'/>}
                            context={this.state.contextRef}>
                                <Popup.Content>
                                    <CurrentDraftsDisplay caseId={value.split('#')[0]} />
                                </Popup.Content>
                            </Popup>    
                        </div>
                    )

                })}
            </div>
        )
    }
}

export default withRouter(SeriesIdList)
