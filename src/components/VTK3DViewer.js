import React,{Component} from "react"
import VTKMPRViewer from "./VTKMPRViewer";
import PropTypes from "prop-types";
import vtkGenericRenderWindow from "vtk.js/Sources/Rendering/Misc/GenericRenderWindow";
import vtkPicker from "vtk.js/Sources/Rendering/Core/Picker";
import vtkLight from "vtk.js/Sources/Rendering/Core/Light";

class VTK3DViewer extends Component{
    static propTypes = {
        volumes: PropTypes.array,
        actors: PropTypes.array,
    }

    constructor(props) {
        super(props);
        this.state = {
            viewerWidth:0,
            viewerHeight:0,
            model: -1
        }
        this.container = React.createRef()
    }

    componentDidMount() {
        this.props.onRef(this)

        this.genericRenderWindow = vtkGenericRenderWindow.newInstance()
        this.genericRenderWindow.setContainer(this.container.current)
        this.glWindow = this.genericRenderWindow.getOpenGLRenderWindow()
        this.renderWindow = this.genericRenderWindow.getRenderWindow()
        this.renderer = this.genericRenderWindow.getRenderer()
        this.renderer.setViewport(0,0,1,1)
        // this.renderer.setBackground([0,0,0])
        this.renderer.setBackground([0.59,0.60,0.81])
        this.interactor = this.renderWindow.getInteractor()
        this.camera = this.renderer.getActiveCamera()
        this.camera.elevation(-90)

        // this.light = vtkLight.newInstance();
        // this.light.setColor(1.0,0.0,0.0);//设置环境光为红色
        // this.renderer.addLight(this.light);//将灯光加入渲染器
        // this.light.setFocalPoint(this.camera.getFocalPoint())
        // this.light.setPosition(this.camera.getPosition())
//         this.light = vtkLight.newInstance();
// //         this.light.setColor(0.5,0.5,1.0);//设置环境光为红色
//         this.light.setColor(1,1,1.0);
//         this.renderer.addLight(this.light);//将灯光加入渲染器
//         this.light.setFocalPoint(this.camera.getFocalPoint())
//         this.light.setPosition(this.camera.getPosition())
//         this.light.setShadowAttenuation(1)
//         this.light.setIntensity(0.3)

        this.picker = vtkPicker.newInstance()
        this.interactor.onLeftButtonPress((callback) => {
            console.log("inter:", callback)
            if(this.picker){
                this.picker.pick([callback.position.x, callback.position.y, callback.position.z], callback.pokedRenderer)
                let picked = this.picker.getPickedPositions()
                console.log("picked " + this.picker.getPickedPositions()[0])
            }
        })

//         this.interactor.onLeftButtonRelease((callback) => {
//             console.log("Release inter:", callback)
//             // if(this.picker){
//             //     this.picker.pick([callback.position.x, callback.position.y, callback.position.z], callback.pokedRenderer)
//             //     let picked = this.picker.getPickedPositions()
//             //     console.log("picked " + this.picker.getPickedPositions()[0])
//             // }
//             this.light.setFocalPoint(this.camera.getFocalPoint())
//             this.light.setPosition(this.camera.getPosition())
//             this.renderWindow.render()
//         })
        this.renderWindow.render()
    }
    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.actors !== this.props.actors){
            if (this.props.actors.length) {
                this.props.actors.forEach(this.renderer.addActor)
            } else {
                // TODO: Remove all volumes
            }
            this.renderer.resetCamera()
            this.renderWindow.render()
        }

        if (prevProps.pointActors !== this.props.pointActors){
            // console.log("this.pointActors",this.props.pointActors)
            if (this.props.pointActors.length){
                prevProps.pointActors.forEach(this.renderer.removeActor)
                this.props.pointActors.forEach(this.renderer.addActor)
                console.log("this.actors",this.renderer.getActors())
            }else{

            }
            this.renderWindow.render()
        }
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

    resetView(){
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
    turnLeft(){
        this.camera.azimuth(90)
        this.renderWindow.render()
    }
    turnRight(){
        this.camera.azimuth(-90)
        this.renderWindow.render()
    }
    getPicked(x, y){
        const movePicker = vtkPicker.newInstance()
        movePicker.pick([x, y, 0], this.renderer)
        const picked = movePicker.getPickedPositions()[0]
        return picked
    }
    clearPointActor(){
        this.props.pointActors.forEach(this.renderer.removeActor)
    }
    changeMode(model){
        // for model parameter, 0 represents axial, 1 represents coronal, 2 represents sagittal
        if(model === 0){
            this.camera.setViewUp(0, -1, 0)
        }else if(model === 1){
            this.camera.setViewUp(0, 0, 1)
        }else if(model === 2){
            this.camera.setViewUp(1, 0, 0)
        }
        this.renderer.resetCamera()
        this.renderWindow.render()
        this.setState({
            model: model
        })
    }

    render() {
        const {
            viewerWidth,
            viewerHeight,
        } = this.state
        const {
            viewerStyle
        } = this.props

        return (
            <div style={viewerStyle}
                ref={input => {
                    this.container.current = input
                }}/>
        )
    }
}

export default VTK3DViewer