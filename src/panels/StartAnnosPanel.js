import React, { Component } from 'react'
import CornerstoneElement from '../components/CornerstoneElement'
import axios from 'axios'
import qs from 'qs'

class StartAnnosPanel extends Component {
    constructor(props) {
        super(props)
        this.state = {
            caseId: window.location.pathname.split('/startAnnos/')[1].split('/')[0],
            username: window.sessionStorage.getItem('userId'), //当前登录id
            basemodelname:window.sessionStorage.getItem('currentModelId'),
            stack: {},
            show: false
        }
        this.config = JSON.parse(localStorage.getItem('config'))
    }

    componentDidMount() {
        
        const basemodelname = this.state.basemodelname
        const dataParams = {caseId: this.state.caseId}
        // const draftParamsLogin = {caseId: this.state.caseId, username: this.state.username}
        const draftParamsLogin = {caseId: this.state.caseId, username: 'deepln'} //test
        const draftParamsBase = {caseId: this.state.caseId, username: this.state.basemodelname}
        const readonlyParams = {username: this.state.username}
        const token = localStorage.getItem('token')
        const headers = {
            'Authorization': 'Bearer '.concat(token)//add the fun of check
        }
        console.log('username',readonlyParams)
        let requestParams = []
        console.log('basemodelname',basemodelname)
        console.log('type',basemodelname==="none")
        if(basemodelname==="none"){
            //只请求当前登录user标记boxes
            console.log('newmodel')
            Promise.all([
                axios.post(this.config.data.getDataListForCaseId, qs.stringify(dataParams)),
                axios.post(this.config.draft.getRectsForCaseIdAndUsername, qs.stringify(draftParamsLogin))
            ]).then(([dataResponse, draftResponse])=> {
                const stack = {
                    imageIds: dataResponse.data,
                    caseId: this.state.caseId,
                    boxes: draftResponse.data,
                    readonly: false,
                    startAnnos:true //是否在标注中
                }
                this.setState({stack: stack, show: true})
            })
            .catch(error => {
                console.log(error)
            })
        }else{
            //请求当前user和basemodelname标记boxes.push
            console.log('Currentmodel')
            Promise.all([
                axios.post(this.config.data.getDataListForCaseId, qs.stringify(dataParams)),
                axios.post(this.config.draft.getRectsForCaseIdAndUsername, qs.stringify(draftParamsLogin)),
                axios.post(this.config.draft.getRectsForCaseIdAndUsername, qs.stringify(draftParamsBase))
            ]).then(([dataResponse, draftResponse, draftResponseBase]) => {
                // console.log(dataResponse.data)
                // console.log(draftResponse.data)
                // console.log(readonlyResponse.data)
                let boxes = draftResponse.data
                boxes.push(draftResponseBase.data)
                const stack = {
                    imageIds: dataResponse.data,
                    caseId: this.state.caseId,
                    boxes: boxes,
                    readonly: false,
                    startAnnos:true
                }
                this.setState({stack: stack, show: true})
            })
        }
    }

    render() {
        if (this.state.show) {
            return (
                // <div>
                
                // </div>
                <div>
                    {/* {this.state.caseId} */}
                    <CornerstoneElement stack={{...this.state.stack}} caseId={this.state.caseId}/>
                </div>
            )
        } else {
            return (
                <div>数据载入中...</div>
            )
        }
    }
}

export default StartAnnosPanel
