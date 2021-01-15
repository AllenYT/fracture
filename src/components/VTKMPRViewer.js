import React,{Component} from "react"
import PropTypes from "prop-types";
import vtkGenericRenderWindow from "vtk.js/Sources/Rendering/Misc/GenericRenderWindow";
import vtkPicker from "vtk.js/Sources/Rendering/Core/Picker";

class VTKMPRViewer extends Component{
    static propTypes = {
        volumes: PropTypes.array,
        actors: PropTypes.array,
    }

    constructor(props) {
        super(props);
        this.state = {
            viewerWidth:0,
            viewerHeight:0,
            scale:0
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
        this.camera.azimuth(180)
        if(this.props.type === 1){
            //axial
            this.camera.setViewUp(0, -1, 0)
        }
        if(this.props.type === 3){
            //sagittal
            this.camera.setViewUp(1, 0, 0)
        }
        //this.camera.azimuth(180)
        this.renderer.resetCamera()
        this.renderWindow.render()
    }
    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.volumes !== this.props.volumes){
            if (this.props.volumes.length) {
                prevProps.volumes.forEach(this.renderer.removeVolume)
                this.props.volumes.forEach(this.renderer.addVolume)
                // console.log("update volumes", this.renderer.getVolumes())
            } else {
                // TODO: Remove all volumes
            }
            if(prevProps.volumes.length === 0){
                this.renderer.resetCamera()
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
    getPicked(x, y){
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

export default VTKMPRViewer