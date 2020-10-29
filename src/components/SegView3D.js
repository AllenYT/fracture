import React,{Component} from "react"
import vtkActor from "vtk.js/Sources/Rendering/Core/Actor"
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper'
import vtkColorMaps from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkCamera from 'vtk.js/Sources/Rendering/Core/Camera'
import vtkGenericRenderWindow from 'vtk.js/Sources/Rendering/Misc/GenericRenderWindow'
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction'
import vtkXMLPolyDataReader from 'vtk.js/Sources/IO/XML/XMLPolyDataReader'

import PropTypes from 'prop-types'
import { Grid } from 'semantic-ui-react'
import '../css/cornerstone.css'
import axios from 'axios'
import qs from 'qs'
import vtkInteractorStyleTrackballCamera from "vtk.js/Sources/Interaction/Style/InteractorStyleTrackballCamera";

class SegView3D extends Component{
    static propTypes = {
        volumes: PropTypes.array,
        actors: PropTypes.array,
    }
    constructor(props) {
        super(props)
    //     this.state = {
    //         // segments_urls : props.segments_urls,
    //         // caseId: '0000004250_20161223_BCB31f',
    //         // segments_volumes : [],
    //         show: false,
    //         // segments: props.segments
    //     }
        this.state = {

        }
        this.genericRenderWindow = null
        this.container = React.createRef()
    }

    componentDidMount(){
        let volumes = []
        let actors = []
        this.camera = vtkCamera.newInstance()
        this.genericRenderWindow = vtkFullScreenRenderWindow.newInstance({
            // background: [0.329412, 0.34902, 0.427451],
            background: [0, 0, 0],
            container: this.container.current,
        })
        // this.genericRenderWindow = vtkGenericRenderWindow.newInstance({
        //     background: [0, 0, 0]
        // })
        // this.genericRenderWindow.setContainer(this.container.current)
        this.renderer = this.genericRenderWindow.getRenderer()
        this.renderWindow = this.genericRenderWindow.getRenderWindow()
        this.interactor = this.renderWindow.getInteractor()
        this.renderer.setActiveCamera(this.camera)
        this.interactor.setInteractorStyle(null)
        // this.interactor.onMouseWheel((callback) => {
        //     console.log("inter:", callback)
        // })


        //this.componentDidUpdate({})

        if(this.props.volumes){
            volumes = volumes.concat(this.props.volumes)
        }
        if(this.props.actors){
            actors = actors.concat(this.props.actors)
        }
        this.renderer.resetCamera()
        this.renderWindow.render()

        // this.setState({
        //     funcOperator:this.props.funcOperator
        // })
        console.log("componentDidMount")
    }
    componentWillUpdate(nextProps, nextState, nextContext) {

    }

    componentDidUpdate(prevProps) {


        // if (prevProps.volumes !== this.props.volumes){
        //     if(this.props.volumes.length){
        //         this.props.volumes.forEach(this.renderer.addVolume);
        //     }else{
        //         //  Remove all volumes
        //     }
        //     this.renderWindow.render()
        // }
        if (this.props.loading) {
            //console.log("call Update actos change", this.props.actors)
            // console.log("getActor before", this.renderer.getActors())
            // this.renderer.removeAllActors()
            // console.log("getActor after", this.renderer.getActors())
            let actorsList = []
            this.props.actors.forEach(item => {
                if(item){
                    actorsList.push(item)
                }
            })
            if (actorsList) {
                actorsList.forEach(this.renderer.addActor)
            } else {
                // Remove all actors
            }
            this.renderer.resetCamera()
            this.renderWindow.render()
        }else{
            console.log("loading complete")
            this.renderWindow.render()
        }
        if (this.props.funcOperating){
            const funcOperator = prevProps.funcOperator
            if(funcOperator){
                funcOperator.forEach((item, idx) => {
                    if(item && item === 1){
                        this.handleOperation(idx)
                    }
                    this.props.callback(idx)
                })
            }
        }
        
    }

    handleOperation(idx){
        // Azimuth(150)表示 camera 的视点位置沿顺时针旋转 150 度角
        // Elevation(60)表示 camera 的视点位置沿向上的方面旋转 60 度角
        switch (idx){
            case 0:this.magnifyView()
                break
            case 1:this.reductView()
                break
            case 2:this.turnLeft()
                break
            case 3:this.turnRight()
                break
        }
    }
    magnifyView(){
        this.camera.dolly(1.1)
        this.renderer.resetCameraClippingRange()
        this.renderWindow.render()
        // this.camera.setParallelScale(this.camera.getParallelScale() / 0.9)
        // this.renderer.updateLightsGeometryToFollowCamera();
    }
    reductView(){
        this.camera.dolly(0.9)
        this.renderer.resetCameraClippingRange()
        this.renderWindow.render()
    }
    turnRight(){
        this.camera.azimuth(90)
        this.renderWindow.render()
    }
    turnLeft(){
        this.camera.azimuth(-90)
        this.renderWindow.render()
    }

    render() {
        if (!this.props.volumes && !this.props.actors) {
            return null;
        }

        return (
            <div id="seg3d-canvas"
                ref={input => {
                    this.container.current = input
                }}/>
        )
    }

}

export default SegView3D
