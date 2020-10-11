import React, {Component} from "react"
import {Card, Loader} from 'semantic-ui-react'
// import {StudyBrowser, Thumbnail} from 'react-viewerbase'
import qs from 'qs'
import axios from "axios"
import '../css/studyBrowser.css'

import * as cornerstone from "cornerstone-core"
import * as cornerstoneMath from "cornerstone-math"
import * as cornerstoneTools from "cornerstone-tools"
import * as cornerstoneWadoImageLoader from "cornerstone-wado-image-loader"

cornerstoneTools.external.cornerstone = cornerstone
cornerstoneTools.external.cornerstoneMath = cornerstoneMath
// cornerstoneWebImageLoader.external.cornerstone = cornerstone
cornerstoneWadoImageLoader.external.cornerstone = cornerstone

const config = require('../config.json')
const recordConfig = config.record
const draftConfig = config.draft
const dataConfig = config.data

class StudyBrowserList extends Component{
    constructor(props) {
        super(props);
        this.state = {
            caseId:props.caseId.split('_')[0],
            dateSeries:[],
            load:true
        }
        

        const params = {
            mainItem: this.state.caseId,
            type: 'pid',
            otherKeyword: ''
        }
        axios.post(recordConfig.getSubListForMainItem_front, qs.stringify(params)).then((response) => {
            const data = response.data
            if (data.status !== 'okay') {
                console.log("Not okay")
                // window.location.href = '/'
            } else {
                const subList = data.subList
                let theList = []
                // console.log('subList',data)
                // const params={caseId:this.state.caseId}
                Object.keys(subList).map((key,value)=>{
                    // console.log('leftkey',key)
                    const seriesLst = subList[key]
                    seriesLst.map((serie,index)=>{
                        Promise.all([
                            axios.post(draftConfig.getDataPath,qs.stringify({caseId:serie.split('#')[0]})),
                            axios.post(dataConfig.getDataListForCaseId,qs.stringify({caseId:serie.split('#')[0]})),
                        ])
                        .then(([annotype,dicom])=>{
                            // const previewId = 'preview-'+(index+1)*(value+1)
                            // console.log('preview',previewId)
                            // const element = document.getElementById(previewId)
                            // let imageId = dicom.data[dicom.data.length/2]
                            // cornerstone.enable(element)
                            // cornerstone.loadAndCacheImage(imageId).then(function(image) { 
                            //     // console.log('cache') 
                            //     var viewport = cornerstone.getDefaultViewportForImage(element, image)
                            //     viewport.voi.windowWidth = 1600
                            //     viewport.voi.windowCenter = -600
                            //     viewport.scale=1
                            //     cornerstone.setViewport(element, viewport)
                            //     cornerstone.displayImage(element, image)
                            // })
                            theList.push({
                                'date':key,
                                'caseId':serie.split('#')[0],
                                'Description':serie.split('#')[1],
                                'href':'/case/' + serie.split('#')[0] + '/'+annotype.data,
                                'image':dicom.data[parseInt(dicom.data.length/3)]
                                
                            })
                            this.setState({dateSeries: theList})
                        })
                    })
                })  
            }
        }).catch((error) => {
            console.log(error)
        })
    }
    

    componentDidUpdate(){
        const dateSeries = this.state.dateSeries
        dateSeries.map((serie,index)=>{
            const previewId = 'preview-'+index
            
            const element = document.getElementById(previewId)
            let imageId = serie.image
            // console.log('preview',serie.image)
            cornerstone.enable(element)
            cornerstone.loadAndCacheImage(imageId).then(function(image) { 
                // console.log('cache') 
                var viewport = cornerstone.getDefaultViewportForImage(element, image)
                viewport.voi.windowWidth = 1600
                viewport.voi.windowCenter = -600
                viewport.scale=0.3
                cornerstone.setViewport(element, viewport)
                cornerstone.displayImage(element, image)
            })
        })
    }

    render(){
        const dateSeries = this.state.dateSeries
        return(
            <div style={{height:'870px',overflow:'auto',width:'105%'}}>
                {
                    dateSeries.map((serie,index)=>{
                        let previewId='preview-'+index
                        // console.log('render',previewId)
                        return(
                            <Card onClick={(e)=>this.props.handleClickScreen(e,serie.href)}>
                                <div className='preview-canvas' id={previewId}>
                                </div>
                                <Card.Content>
                                    <Card.Description>
                                        {serie.date+'\n '+serie.Description}
                                    </Card.Description>
                                </Card.Content>
                            </Card>
                        )
                    })
                }
            </div>
        )
    }
}

export default StudyBrowserList