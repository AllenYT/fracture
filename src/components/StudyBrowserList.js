import React, {Component} from "react"
import {StudyBrowser, Thumbnail} from 'react-viewerbase'
import qs from 'qs'
import axios from "axios"


const config = require('../config.json')
const recordConfig = config.record

class StudyBrowserList extends Component{
    constructor(props) {
        super(props);
        this.state = {
            studies:[
                
            ]
        }
    }
    
    componentDidMount(){
        const params = {
            mainItem: window.location.pathname.split('/')[2],
            type: 'pid',
            otherKeyword: ''
        }

        axios.post(recordConfig.getSubList, qs.stringify(params)).then((response) => {
            const data = response.data
            if (data.status !== 'okay') {
                console.log("Not okay")
                // window.location.href = '/'
            } else {
                const subList = data.subList
                let theList = []
                for (let key in subList) {
                    const seriesLst = subList[key]
                    console.log(key)
                    for (let j = 0; j < seriesLst.length; j ++) {
                        theList.push({
                            'date': key,
                            'caseId': seriesLst[j].split('#')[0],
                            'href': '/case/' + seriesLst[j].split('#')[0] + '/origin'
                        })
                    }
                }
                this.setState({analyzeList: theList})
            }
        }).catch((error) => {
            console.log(error)
        })
    }


    render(){
        const {studies} = this.state
        return(
             <div>
                 <StudyBrowser studies={studies} />
            </div>
        )
       
    }
}

export default StudyBrowserList