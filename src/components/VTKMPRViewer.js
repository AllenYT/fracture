import React,{Component} from "react"
import SegView3D from "./SegView3D";
import PropTypes from "prop-types";
import vtkGenericRenderWindow from "vtk.js/Sources/Rendering/Misc/GenericRenderWindow";

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
        //this.camera.azimuth(180)
        this.renderWindow.render()
    }
    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.volumes !== this.props.volumes){
            if (this.props.volumes.length) {
                console.log("update volumes")
                this.props.volumes.forEach(this.renderer.addVolume);
            } else {
                // TODO: Remove all volumes
            }
            this.renderer.resetCamera()
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