import React, {Component} from 'react'
import ReactHtmlParser from 'react-html-parser'
import {Popup, Button} from 'semantic-ui-react'

import qs from 'qs'
import axios from 'axios';

const config = JSON.parse(localStorage.getItem('config'))
const draftConfig = config.draft
const reviewConfig = config.review

class CurrentDraftsDisplay extends Component {

    constructor(props) {
        super(props);
        this.state = {
            caseId: this.props.caseId,
            modelResults: '暂无结果',
            annoResults: '暂无结果',
            reviewResults: '暂无结果'
        }
    }

    componentDidMount() {
        const token = localStorage.getItem('token')
        const headers = {
            'Authorization': 'Bearer '.concat(token)
        }
        const params = {
            caseId: this.state.caseId
        }
        //  console.log(token)
        Promise.all([
            axios.post(draftConfig.getModelResults, qs.stringify(params), {headers}),
            axios.post(draftConfig.getAnnoResults, qs.stringify(params), {headers}),
            axios.post(reviewConfig.getReviewResults, qs.stringify(params), {headers})
        ]).then(([res1, res2, res3]) => {
            const modelList = res1.data.dataList
            const annoList = res2.data.dataList
            const reviewList = res3.data.dataList

            let modelStr = ""
            let annoStr = ""
            let reviewStr = ""
            
            if (modelList.length > 0) {
                // console.log(modelList)
                for (var i = 0; i < modelList.length; i ++) {
                    modelStr += '<div class="ui blue label">'
                    modelStr += modelList[i]
                    modelStr += '</div>'
                }
                this.setState({modelResults: modelStr})
                // console.log('模型结果',modelStr)
            }

            if (annoList.length > 0) {
                for (var i = 0; i < annoList.length; i ++) {
                    annoStr += '<div class="ui label">'
                    annoStr += annoList[i]
                    annoStr += '</div>'
                }
                this.setState({annoResults: annoStr})
            }

            if (reviewList.length > 0) {
                for (var i = 0; i < reviewList.length; i ++) {
                    reviewStr += '<div class="ui teal label">'
                    reviewStr += reviewList[i]
                    reviewStr += '</div>'
                }
                this.setState({reviewResults: reviewStr})
            }


        }).catch((error) => {
            console.log(error)
        })
    }
    
    

    render() {

        const modelResults = this.state.modelResults
        const annoResults = this.state.annoResults
        const reviewResults = this.state.reviewResults

        return (

            <div>
                <h4>模型结果</h4>
                <div id="model-results">
                    {ReactHtmlParser(modelResults)}
                </div>
                <h4>标注结果</h4>
                <div id="anno-results">
                    {ReactHtmlParser(annoResults)}
                </div>
                <h4>审核结果</h4>
                <div id="review-results">
                    {ReactHtmlParser(reviewResults)}
                </div>

            </div>
            
        )
    }
}

export default CurrentDraftsDisplay
