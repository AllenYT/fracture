import React, {Component} from 'react'
import {  Grid, Image } from 'semantic-ui-react'
import axios from 'axios'
import qs from 'qs'
import { withRouter } from 'react-router-dom'

const immersiveStyle = {
    width: "1280px",
    height: "1280px",
    position: "relative",
    // display: "inline",
    color: "white"
}

const bottomLeftStyle = {
    bottom: "5px",
    left: "5px",
    position: "absolute",
    color: "white"
}

const bottomRightStyle = {
    bottom: "5px",
    right: "5px",
    position: "absolute",
    color: "white"
}

const topLeftStyle = {
    top: "5px",
    left: "5px",
    position: "absolute",
    color: "white"
}

const modalBtnStyle = {
    width: "200px",
    display: "block",
    // marginTop:'10px',
    marginBottom: '20px',
    marginLeft: "auto",
    marginRight: "auto"
}

const config = require('../config.json')

class Cov19Cornerstone extends Component{
    constructor(props) {
        super(props)
        this.state = {
            caseId: props.caseId,
            stack: props.stack,
            imageIds: props.stack.imageIds,
            currentIdx: 0,
        }
    
    this.handleRangeChange = this
        .handleRangeChange
        .bind(this)
    }

    render(){
        console.log('image2',this.state.imageIds[this.state.currentIdx])
        return(
            <div>
                <Grid celled className='corner-contnt'>
                    <Grid.Column width={2}></Grid.Column>
                    <Grid.Column width={8} textAlign='center'>
                    <div className='canvas-style'>
                        {/* <div
                            id="origin-canvas"
                            // style={divStyle}
                            ref={input => {
                            this.element = input
                        }}> */}
                            {/* <canvas className="cornerstone-canvas" id="canvas"/> */}
                            <img src={this.state.imageIds[this.state.currentIdx]} className="cornerstone-canvas" id="origin-canvas"/>
                        {/* </div> */}
                    </div>
                    <div className='canvas-style'>
                        <input
                            id="slice-slider"
                            onChange={this.handleRangeChange}
                            type="range"
                            value={this.state.currentIdx + 1}
                            name="volume"
                            step="1"
                            min="1"
                            max={this.state.imageIds.length}></input>
                        <div id="button-container">             
                            <p id="page-indicator">{this.state.currentIdx + 1}
                                / {this.state.imageIds.length}</p>
                        </div>
                    </div>
                    </Grid.Column>
                    <Grid.Column width={6} > 
                    </Grid.Column>
                </Grid>
            </div>
        )
    }
    handleRangeChange(e) {
        // this.setState({currentIdx: event.target.value - 1, imageId:
        // this.state.imageIds[event.target.value - 1]})
        // this.refreshImage(false, this.state.imageIds[event.target.value - 1], event.target.value - 1)
        this.setState({currentIdx:e.target.value-1})
    }

    componentDidMount() {
        
    }
    componentWillUnmount() {
    }

    componentDidUpdate(prevProps, prevState) {
        // if (prevState.currentIdx !== this.state.currentIdx && this.state.autoRefresh === true) {
        //     this.refreshImage(false, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
        // }

        // if (prevState.immersive !== this.state.immersive) {
        //     this.refreshImage(true, this.state.imageIds[this.state.currentIdx], this.state.currentIdx)
        // }

        // if (prevState.random !== this.state.random) {
        //     console.log(this.state.boxes)
        //     // this.saveToDB()
        // }
    }
}
export default withRouter(Cov19Cornerstone) 