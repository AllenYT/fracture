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
                {
                    thumbnails: [
                    {
                        imageSrc:
                        'https://raw.githubusercontent.com/crowds-cure/cancer/master/public/screenshots/Anti-PD-1_Lung.jpg',
                        SeriesDescription: 'Anti-PD-1_Lung',
                        active: true,
                        SeriesNumber: '2',
                        numImageFrames: 512,
                        stackPercentComplete: 30,
                    },
                    {
                        imageSrc:
                        'https://raw.githubusercontent.com/crowds-cure/cancer/master/public/screenshots/Anti-PD-1_MELANOMA.jpg',
                        SeriesDescription: 'Anti-PD-1_MELANOMA',
                        SeriesNumber: '2',
                        InstanceNumber: '1',
                        numImageFrames: 256,
                        stackPercentComplete: 70,
                    },
                    {
                        altImageText: 'SR',
                        SeriesDescription: 'Imaging Measurement Report',
                        SeriesNumber: '3',
                        stackPercentComplete: 100,
                    },
                    ],
                }
            ]
        }
    }
    
    componentDidMount(){
        
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