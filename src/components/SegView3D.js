import React,{Component} from "react"
import vtkActor from "vtk.js/Sources/Rendering/Core/Actor"
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper'
import vtkColorMaps from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkPicker from 'vtk.js/Sources/Rendering/Core/Picker'
import vtkCamera from 'vtk.js/Sources/Rendering/Core/Camera'
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer'
import vtkGenericRenderWindow from 'vtk.js/Sources/Rendering/Misc/GenericRenderWindow'
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction'
import vtkXMLPolyDataReader from 'vtk.js/Sources/IO/XML/XMLPolyDataReader'

import PropTypes from 'prop-types'
import { Grid } from 'semantic-ui-react'
import '../css/cornerstone.css'
import axios from 'axios'
import qs from 'qs'
import vtkInteractorStyleTrackballCamera from "vtk.js/Sources/Interaction/Style/InteractorStyleTrackballCamera";

const normalVpList = [[0.0, 0.0, 0.5, 0.5], [0.0, 0.5, 0.5, 1.0], [0.5, 0.0, 1.0, 0.5], [0.5, 0.5, 1.0, 1.0]] //左下，左上，右下，右上
const selectedVpList = [[0.0, 0.0, 0.67, 1.0], [0.67, 0.0, 1.0, 0.34], [0.67, 0.34, 1.0, 0.67], [0.67, 0.67, 1.0, 1.0]]

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
            viewerWidth:0,
            viewerHeight:0,
            selected:false,
            selectedNum:0
        }
        this.genericRenderWindow = null
        this.container = React.createRef()
    }

    componentDidMount(){
        this.props.onRef(this)

        // this.fullscreenRenderWindow = vtkFullScreenRenderWindow.newInstance({
        //     background: [0.329412, 0.34902, 0.427451],
        //     container: this.container.current,
        // })
        this.genericRenderWindow = vtkGenericRenderWindow.newInstance({
            background: [0, 0, 0]
        })
        this.genericRenderWindow.setContainer(this.container.current)
        this.glWindow = this.genericRenderWindow.getOpenGLRenderWindow()
        this.renderWindow = this.genericRenderWindow.getRenderWindow()

        this.renderer = this.genericRenderWindow.getRenderer()
        this.renderer.setViewport(normalVpList[3][0], normalVpList[3][1], normalVpList[3][2], normalVpList[3][3])
        this.renderer.setBackground([0,0,0])

        this.renderer1 = vtkRenderer.newInstance()
        this.renderer1.setViewport(normalVpList[1][0], normalVpList[1][1], normalVpList[1][2], normalVpList[1][3])
        this.renderer1.setBackground([0,0,0])

        this.renderer2 = vtkRenderer.newInstance()
        this.renderer2.setViewport(normalVpList[0][0], normalVpList[0][1], normalVpList[0][2], normalVpList[0][3])
        this.renderer2.setBackground([0,0,0])

        this.renderer3 = vtkRenderer.newInstance()
        this.renderer3.setViewport(normalVpList[2][0], normalVpList[2][1], normalVpList[2][2], normalVpList[2][3])
        this.renderer3.setBackground([0,0,0])

        this.renderWindow.addRenderer(this.renderer1)
        this.renderWindow.addRenderer(this.renderer2)
        this.renderWindow.addRenderer(this.renderer3)



        this.interactor = this.renderWindow.getInteractor()
        this.camera = this.renderer.getActiveCamera()

        this.camera.elevation(-90)
        this.camera1 = this.renderer1.getActiveCamera()
        this.camera1.azimuth(180)
        this.camera2 = this.renderer2.getActiveCamera()
        this.camera2.azimuth(180)
        this.camera3 = this.renderer3.getActiveCamera()
        this.camera3.azimuth(180)
        this.camera3.setViewUp(1,0,0)
        // this.interactor.setInteractorStyle(null)
        this.picker = vtkPicker.newInstance()
        this.interactor.onLeftButtonPress((callback) => {
            console.log("inter:", callback.position)
            if(this.picker){
                this.picker.pick([callback.position.x, callback.position.y, callback.position.z], callback.pokedRenderer)
                let picked = this.picker.getPickedPositions()
                console.log("picked " + this.picker.getPickedPositions()[0])
            }
        })

        this.renderWindow.render()
        // this.setState({
        //     funcOperator:this.props.funcOperator
        // })
    }
    componentWillUpdate(nextProps, nextState, nextContext) {

    }

    componentDidUpdate(prevProps) {
        // if (prevProps.volumes !== this.props.volumes) {
        //     console.log("this.props",this.props.volumes)
        //     if (this.props.volumes.length) {
        //         this.props.volumes.forEach(this.renderer1.addVolume);
        //     } else {
        //         // TODO: Remove all volumes
        //     }
        //     this.renderer1.resetCamera()
        //     this.renderWindow.render();
        // }
        if (prevProps.axialActorVolumes !== this.props.axialActorVolumes) {
            // console.log("this.axialActorVolumes",this.props.axialActorVolumes)
            if (this.props.axialActorVolumes.length) {
                this.props.axialActorVolumes.forEach(this.renderer1.addVolume);
            } else {
                // TODO: Remove all volumes
            }
            this.renderer1.resetCamera()
            this.renderWindow.render();
        }
        if (prevProps.coronalActorVolumes !== this.props.coronalActorVolumes) {
            // console.log("this.coronalVolumes",this.props.coronalActorVolumes)
            if (this.props.coronalActorVolumes.length) {
                this.props.coronalActorVolumes.forEach(this.renderer2.addVolume);
            } else {
                // TODO: Remove all volumes
            }
            this.renderer2.resetCamera()
            this.renderWindow.render();
        }
        if (prevProps.sagittalActorVolumes !== this.props.sagittalActorVolumes) {
            // console.log("this.sagittalActorVolumes",this.props.sagittalActorVolumes)
            if (this.props.sagittalActorVolumes.length) {
                this.props.sagittalActorVolumes.forEach(this.renderer3.addVolume);
            } else {
                // TODO: Remove all volumes
            }
            this.renderer3.resetCamera()
            this.renderWindow.render();
        }
        if (prevProps.pointActors !== this.props.pointActors){
            // console.log("this.pointActors",this.props.pointActors)
            if (this.props.pointActors.length){
                prevProps.pointActors.forEach(this.renderer.removeActor);
                this.props.pointActors.forEach(this.renderer.addActor);
                console.log("this.actors",this.renderer.getActors())
            }else{

            }
            this.renderWindow.render();
        }
        if (prevProps.actors !== this.props.actors){
            if (this.props.actors.length) {
                this.props.actors.forEach(this.renderer.addActor);
            } else {
                // TODO: Remove all volumes
            }
            this.renderer.resetCamera()
            this.renderWindow.render()
        }
        if (this.props.loading) {
            //console.log("call Update actos change", this.props.actors)
            // this.renderer.removeAllActors()
            this.renderer.resetCamera()
        }else{
            console.log("loading complete")
        }
    }
    reRenderAll(){
        this.renderer.resetCamera()
        this.renderWindow.render()
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
    turnUp(){
        console.log("focal", this.camera.getFocalPoint())
        console.log("position", this.camera.getPosition())
        this.renderWindow.render()
    }
    turnDown(){
        this.renderWindow.render()
    }
    turnLeft(){
        this.camera.azimuth(90)
        this.renderWindow.render()
    }
    turnRight(){
        this.camera.azimuth(-90)
        this.renderWindow.render()
    }

    setContainerSize(width, height){
        if(this.glWindow){
            this.setState({
                viewerWidth: width,
                viewerHeight: height
            })

            this.glWindow.setSize(width, height)
            this.renderWindow.render()
        }
    }


    selectByNum(selectedNum){
        if(selectedNum === 0){
            this.cancelSelection()
        }else if(selectedNum === 1){
            this.selectOne()
        }else if(selectedNum === 2){
            this.selectTwo()
        }else if(selectedNum === 3){
            this.selectThree()
        }else if(selectedNum === 4){
            this.selectFour()
        }
        this.setState({
            selectedNum: selectedNum
        })
    }
    selectOne(){
        this.renderer.setViewport(selectedVpList[0][0], selectedVpList[0][1], selectedVpList[0][2], selectedVpList[0][3])
        this.renderer1.setViewport(selectedVpList[3][0], selectedVpList[3][1], selectedVpList[3][2], selectedVpList[3][3])
        this.renderer2.setViewport(selectedVpList[2][0], selectedVpList[2][1], selectedVpList[2][2], selectedVpList[2][3])
        this.renderer3.setViewport(selectedVpList[1][0], selectedVpList[1][1], selectedVpList[1][2], selectedVpList[1][3])

        this.renderWindow.render()
    }
    selectTwo(){
        this.renderer.setViewport(selectedVpList[3][0], selectedVpList[3][1], selectedVpList[3][2], selectedVpList[3][3])
        this.renderer1.setViewport(selectedVpList[0][0], selectedVpList[0][1], selectedVpList[0][2], selectedVpList[0][3])
        this.renderer2.setViewport(selectedVpList[2][0], selectedVpList[2][1], selectedVpList[2][2], selectedVpList[2][3])
        this.renderer3.setViewport(selectedVpList[1][0], selectedVpList[1][1], selectedVpList[1][2], selectedVpList[1][3])

        this.renderWindow.render()
    }
    selectThree(){
        this.renderer.setViewport(selectedVpList[3][0], selectedVpList[3][1], selectedVpList[3][2], selectedVpList[3][3])
        this.renderer1.setViewport(selectedVpList[2][0], selectedVpList[2][1], selectedVpList[2][2], selectedVpList[2][3])
        this.renderer2.setViewport(selectedVpList[0][0], selectedVpList[0][1], selectedVpList[0][2], selectedVpList[0][3])
        this.renderer3.setViewport(selectedVpList[1][0], selectedVpList[1][1], selectedVpList[1][2], selectedVpList[1][3])

        this.renderWindow.render()
    }
    selectFour(){
        this.renderer.setViewport(selectedVpList[3][0], selectedVpList[3][1], selectedVpList[3][2], selectedVpList[3][3])
        this.renderer1.setViewport(selectedVpList[2][0], selectedVpList[2][1], selectedVpList[2][2], selectedVpList[2][3])
        this.renderer2.setViewport(selectedVpList[1][0], selectedVpList[1][1], selectedVpList[1][2], selectedVpList[1][3])
        this.renderer3.setViewport(selectedVpList[0][0], selectedVpList[0][1], selectedVpList[0][2], selectedVpList[0][3])

        this.renderWindow.render()
    }
    cancelSelection(){
        this.renderer.setViewport(normalVpList[3][0], normalVpList[3][1], normalVpList[3][2], normalVpList[3][3])
        this.renderer1.setViewport(normalVpList[1][0], normalVpList[1][1], normalVpList[1][2], normalVpList[1][3])
        this.renderer2.setViewport(normalVpList[0][0], normalVpList[0][1], normalVpList[0][2], normalVpList[0][3])
        this.renderer3.setViewport(normalVpList[2][0], normalVpList[2][1], normalVpList[2][2], normalVpList[2][3])

        this.renderWindow.render()
    }

    click(offsetX, offsetY){
        const x = offsetX
        const y = this.state.viewerHeight - offsetY
        const movePicker = vtkPicker.newInstance()
        movePicker.pick([x, y, 0], this.renderer)
        const picked = movePicker.getPickedPositions()[0]
        return picked
    }
    dblclick(offsetX, offsetY){
        //offset is based on top left
        const {viewerWidth, viewerHeight, selectedNum} = this.state
        if(selectedNum !== 0){
            const oneThirdWidth = viewerWidth/3
            const oneThirdHeight = viewerHeight/3
            if(offsetX > 2*oneThirdWidth){
                //不操作'
                if(selectedNum === 1){
                    console.log("selected:", selectedNum)
                    if(offsetY < oneThirdHeight){
                        this.selectTwo()
                        return 2;
                    }else if(offsetY > oneThirdHeight && offsetY < 2*oneThirdHeight){
                        this.selectThree()
                        return 3;
                    }else if(offsetY > 2*oneThirdHeight){
                        this.selectFour()
                        return 4;
                    }

                }else if(selectedNum === 2){
                    console.log("selected:", selectedNum)
                    if(offsetY < oneThirdHeight){
                        this.selectOne()
                        return 1;
                    }else if(offsetY > oneThirdHeight && offsetY < 2*oneThirdHeight){
                        this.selectThree()
                        return 3;
                    }else if(offsetY > 2*oneThirdHeight){
                        this.selectFour()
                        return 4;
                    }
                }else if(selectedNum === 3){
                    console.log("selected:", selectedNum)
                    if(offsetY < oneThirdHeight){
                        this.selectOne()
                        return 1;
                    }else if(offsetY > oneThirdHeight && offsetY < 2*oneThirdHeight){
                        this.selectTwo()
                        return 3;
                    }else if(offsetY > 2*oneThirdHeight){
                        this.selectFour()
                        return 4;
                    }
                }else if(selectedNum === 4){
                    console.log("selected:", selectedNum)
                    if(offsetY < oneThirdHeight){
                        this.selectOne()
                        return 1;
                    }else if(offsetY > oneThirdHeight && offsetY < 2*oneThirdHeight){
                        this.selectTwo()
                        return 2;
                    }else if(offsetY > 2*oneThirdHeight){
                        this.selectThree()
                        return 4;
                    }
                }
            }
        }else{
            const halfWidth = viewerWidth/2
            const halfHeight = viewerHeight/2
            if(offsetX < halfWidth && offsetY < halfHeight){
                this.selectTwo()
                return 2;
            }else if(offsetX > halfWidth && offsetY < halfHeight){
                this.selectOne()
                return 1;
            }else if(offsetX < halfWidth && offsetY > halfHeight){
                this.selectThree()
                return 3;
            }else if(offsetX > halfWidth && offsetY > halfHeight){
                this.selectFour()
                return 4;
            }
        }
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
