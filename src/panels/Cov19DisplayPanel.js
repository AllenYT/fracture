import React, {Component} from 'react'
import axios from 'axios'
import qs from 'qs'
import Cov19Cornerstone from '../components/Cov19Cornerstone'

const config = require('../config.json')
const dataConfig=config.data

class Cov19DisplayPanel extends Component{
    constructor(props) {
        super(props)
        this.state = {
          caseId: window.location.pathname.split('/cov19Case/')[1],
        //   username: window.location.pathname.split('/')[3],
          stack: {},
          show: false
        }
      }
    
      componentWillMount() {
    
        // first let's check the status to display the proper contents.
        // const pathname = window.location.pathname
        // send our token to the server, combined with the current pathname
        let noduleNo = -1
        if (this.props.location.hash !== '')
          noduleNo = parseInt(this.props.location.hash.split('#')[1])
    
        const dataParams = {
          caseId: this.state.caseId
        }
    
        axios.post(dataConfig.getDataListForCov19CaseId, qs.stringify(dataParams)).then(dataResponse => {
            // Promise.all(dataResponse.data.map(doc => {
            //   return axios.get(doc)
            // }  
            // )).then(jpgResponses=>{
            //   console.log('jpgResponses',jpgResponses)
            //   let list=[]
            //   for(let i in jpgResponses){
            //     list.push(jpgResponses[i].data)
            //   }
            //   // console.log('list',list)
            //   const stack = {
            //     imageIds: dataResponse.data,
            //     caseId: this.state.caseId
            //   }
            //   this.setState({stack: stack, show: true})
            // }
            // )
            const stack = {
              imageIds: dataResponse.data,
              caseId: this.state.caseId
            }
            this.setState({stack: stack, show: true})
          }).catch(error => {
            console.log(error)
          })
    
      }
    
      render() {
        if (this.state.show) {
          
          return (
            <div>
            <Cov19Cornerstone stack={{
                ...this.state.stack
              }} caseId={this.state.caseId}/>
            </div>
          )
        } else {
          return (<div>数据载入中...</div>)
        }
    
      }
}
export default Cov19DisplayPanel