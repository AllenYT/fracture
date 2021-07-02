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

class StudyBrowserList extends Component{
    constructor(props) {
        super(props);
        this.state = {
            caseId:props.caseId.split('_')[0],
            dateSeries:[],
            load:true
        }
        this.config = JSON.parse(localStorage.getItem('config'))
    }
    componentDidMount(){
        const token = localStorage.getItem('token')
        const params = {
            mainItem: this.state.caseId,
            type: 'pid',
            otherKeyword: ''
        }
        const headers = {
            'Authorization': 'Bearer '.concat(token)
        }
        
        axios.post(this.config.record.getSubListForMainItem_front, qs.stringify(params)).then((response) => {
            const data = response.data
            // console.log("data",data)
            if (data.status !== 'okay') {
                console.log("Not okay")
                // window.location.href = '/'
            } else {
                const subList = data.subList
                let theList = []
                // const params={caseId:this.state.caseId}
                Object.keys(subList).map((key,value)=>{
                    // console.log('leftkey',key)
                    const seriesLst = subList[key]
                    seriesLst.map((serie,index)=>{
                        Promise.all([
                            axios.post(this.config.draft.getDataPath,qs.stringify({caseId:serie.split('#')[0]}), {headers}),
                            axios.post(this.config.data.getDataListForCaseId,qs.stringify({caseId:serie.split('#')[0]})),
                        ])
                        .then(([annotype,dicom])=>{
                            
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

    componentDidUpdate(prevProps, prevState){
        if(prevState !== this.state){
            let flag=0
            let dateSeries = this.state.dateSeries
            for(let j=0;j<dateSeries.length;j++){
                for(let i=0;i<dateSeries.length-j-1;i++){
                    if(parseInt(dateSeries[i].date)<parseInt(dateSeries[i+1].date)){
                        let temp = dateSeries[i]
                        dateSeries[i] = dateSeries[i+1]
                        dateSeries[i+1] = temp
                        flag=1
                    }
                }
            }
            if(flag===1){
                this.setState({dateSeries:dateSeries})
            }
            else{
                dateSeries.map((serie,index)=>{
                    const previewId = 'preview-'+index
                    
                    const element = document.getElementById(previewId)
                    let imageId = serie.image
                    // console.log('preview',element)
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
        }
        
    }

    render(){
        const dateSeries = this.state.dateSeries
        return(
            <div className='preview'>
                {
                    dateSeries.map((serie,index)=>{
                        let previewId='preview-'+index
                        let keyId = 'key-' + index
                        // console.log('render',previewId)
                        return(
                            <Card onClick={(e)=>this.props.handleClickScreen(e,serie.href)} key={keyId}>
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