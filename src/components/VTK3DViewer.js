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
        this.renderer.setBackground([0,0,0])

        this.interactor = this.renderWindow.getInteractor()
        this.camera = this.renderer.getActiveCamera()
        this.camera.elevation(-90)
        //this.camera.elevation(-90)

        // this.light = vtkLight.newInstance();
        // this.light.setColor(1.0,0.0,0.0);//设置环境光为红色
        // this.renderer.addLight(this.light);//将灯光加入渲染器
        // this.light.setFocalPoint(this.camera.getFocalPoint())
        // this.light.setPosition(this.camera.getPosition())

        this.renderWindow.render()
    }
    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.actors !== this.props.actors){
            if (this.props.actors.length) {
                this.props.actors.forEach(this.renderer.addActor);
            } else {
                // TODO: Remove all volumes
            }
            this.renderer.resetCamera()
            this.renderWindow.render()
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

    getPicked(offsetX, offsetY){
        const x = offsetX
        const y = offsetY
        const movePicker = vtkPicker.newInstance()
        movePicker.pick([x, y, 0], this.renderer)
        const picked = movePicker.getPickedPositions()[0]
        return picked
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