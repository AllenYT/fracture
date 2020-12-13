import React,{Component} from "react"
import PropTypes from "prop-types";

import VTKMPRViewer from "./VTKMPRViewer";
import VTK3DViewer from "./VTK3DViewer";
import vtkGenericRenderWindow from "vtk.js/Sources/Rendering/Misc/GenericRenderWindow";
import vtkPicker from "vtk.js/Sources/Rendering/Core/Picker";

class VTKViewer extends Component{
    static propTypes = {
        volumes: PropTypes.array,
        actors: PropTypes.array,
    }

    constructor(props) {
        super(props);
        this.state = {
            viewerWidth:0,
            viewerHeight:0,
            selectedNum:0,
            selectionStyles:[],
        }
        this.container = React.createRef()
    }

    componentDidMount() {
        this.props.onRef(this)
    }
    componentDidUpdate(prevProps, prevState, snapshot) {

    }

    setContainerSize(selectedNum, width, height){
        const selectionStyles = this.getSelectionStyles(selectedNum, width ,height)
        this.setState({
            viewerWidth: width,
            viewerHeight: height,
            selectedNum: selectedNum,
            selectionStyles: selectionStyles
        })
        this.viewer3D.setContainerSize(selectionStyles[0].width.replace("px",""), selectionStyles[0].height.replace("px",""))
        this.viewerAxial.setContainerSize(selectionStyles[1].width.replace("px",""), selectionStyles[1].height.replace("px",""))
        this.viewerCoronal.setContainerSize(selectionStyles[2].width.replace("px",""), selectionStyles[2].height.replace("px",""))
        this.viewerSagittal.setContainerSize(selectionStyles[3].width.replace("px",""), selectionStyles[3].height.replace("px",""))
    }
    selectByNum(selectedNum){
        this.setState({
            selectedNum: selectedNum
        })
        this.updateSelectionStyles(selectedNum)
    }
    updateSelectionStyles(selectedNum){
        const selectionStyles = this.getSelectionStyles(selectedNum)
        this.setState({
            selectionStyles: selectionStyles
        })
        this.viewer3D.setContainerSize(selectionStyles[0].width.replace("px",""), selectionStyles[0].height.replace("px",""))
        this.viewerAxial.setContainerSize(selectionStyles[1].width.replace("px",""), selectionStyles[1].height.replace("px",""))
        this.viewerCoronal.setContainerSize(selectionStyles[2].width.replace("px",""), selectionStyles[2].height.replace("px",""))
        this.viewerSagittal.setContainerSize(selectionStyles[3].width.replace("px",""), selectionStyles[3].height.replace("px",""))
    }
    getSelectionStyles(selectedNum, viewerWidth, viewerHeight){
        //num 0 represents no selection, num 1 represents selection of 3d, num 2 represents selection of axial,
        //num 3 represents selection of coronal, num 4 represents selection of sagittal

        //[0] represents style of 3d, [1] represents style of axial,
        //[2] represents style of coronal, [3] represents style of sagittal
        if(typeof(selectedNum) == "undefined"){
            selectedNum = this.state.selectedNum
        }
        if(typeof(viewerWidth) == "undefined"){
            viewerWidth = this.state.viewerWidth
        }
        if(typeof(viewerHeight) == "undefined"){
            viewerHeight = this.state.viewerHeight
        }
        const selectionStyles = []
        if(selectedNum === 0){
            selectionStyles.push({position:"absolute", top:"0", left:`${viewerWidth/2}px`, width:`${viewerWidth/2}px`, height:`${viewerHeight/2}px`})
            selectionStyles.push({position:"absolute", top:"0", left:"0", width:`${viewerWidth/2}px`, height:`${viewerHeight/2}px`})
            selectionStyles.push({position:"absolute", top:`${viewerHeight/2}px`, left:"0", width:`${viewerWidth/2}px`, height:`${viewerHeight/2}px`})
            selectionStyles.push({position:"absolute", top:`${viewerHeight/2}px`, left:`${viewerWidth/2}px`, width:`${viewerWidth/2}px`, height:`${viewerHeight/2}px`})
        }else if(selectedNum === 1){
            selectionStyles.push({position:"absolute", top:"0", left:"0", width:`${0.67 * viewerWidth}px`, height:`${viewerHeight}px`})
            selectionStyles.push({position:"absolute", top:"0", left:`${0.67 * viewerWidth}px`, width:`${0.33 * viewerWidth}px`, height:`${0.33 * viewerHeight}px`})
            selectionStyles.push({position:"absolute", top:`${0.33 * viewerHeight}px`, left:`${0.67 * viewerWidth}px`, width:`${0.33 * viewerWidth}px`, height:`${0.33 * viewerHeight}px`})
            selectionStyles.push({position:"absolute", top:`${0.66 * viewerHeight}px`, left:`${0.67 * viewerWidth}px`, width:`${0.33 * viewerWidth}px`, height:`${0.34 * viewerHeight}px`})
        }else if(selectedNum === 2){
            selectionStyles.push({position:"absolute", top:"0", left:`${0.67 * viewerWidth}px`, width:`${0.33 * viewerWidth}px`, height:`${0.33 * viewerHeight}px`})
            selectionStyles.push({position:"absolute", top:"0", left:"0", width:`${0.67 * viewerWidth}px`, height:`${viewerHeight}px`})
            selectionStyles.push({position:"absolute", top:`${0.33 * viewerHeight}px`, left:`${0.67 * viewerWidth}px`, width:`${0.33 * viewerWidth}px`, height:`${0.33 * viewerHeight}px`})
            selectionStyles.push({position:"absolute", top:`${0.66 * viewerHeight}px`, left:`${0.67 * viewerWidth}px`, width:`${0.33 * viewerWidth}px`, height:`${0.34 * viewerHeight}px`})
        }else if(selectedNum === 3){
            selectionStyles.push({position:"absolute", top:"0", left:`${0.67 * viewerWidth}px`, width:`${0.33 * viewerWidth}px`, height:`${0.33 * viewerHeight}px`})
            selectionStyles.push({position:"absolute", top:`${0.33 * viewerHeight}px`, left:`${0.67 * viewerWidth}px`, width:`${0.33 * viewerWidth}px`, height:`${0.33 * viewerHeight}px`})
            selectionStyles.push({position:"absolute", top:"0", left:"0", width:`${0.67 * viewerWidth}px`, height:`${viewerHeight}px`})
            selectionStyles.push({position:"absolute", top:`${0.66 * viewerHeight}px`, left:`${0.67 * viewerWidth}px`, width:`${0.33 * viewerWidth}px`, height:`${0.34 * viewerHeight}px`})
        }else if(selectedNum === 4){
            selectionStyles.push({position:"absolute", top:"0", left:`${0.67 * viewerWidth}px`, width:`${0.33 * viewerWidth}px`, height:`${0.33 * viewerHeight}px`})
            selectionStyles.push({position:"absolute", top:`${0.33 * viewerHeight}px`, left:`${0.67 * viewerWidth}px`, width:`${0.33 * viewerWidth}px`, height:`${0.33 * viewerHeight}px`})
            selectionStyles.push({position:"absolute", top:`${0.66 * viewerHeight}px`, left:`${0.67 * viewerWidth}px`, width:`${0.33 * viewerWidth}px`, height:`${0.34 * viewerHeight}px`})
            selectionStyles.push({position:"absolute", top:"0", left:"0", width:`${0.67 * viewerWidth}px`, height:`${viewerHeight}px`})
        }
        return selectionStyles
    }

    resetView(type){
        if(type === 0){
            this.viewer3D.resetView()
        }else if(type === 1){
            this.viewerAxial.resetView()
        }else if(type === 2){
            this.viewerCoronal.resetView()
        }else if(type === 3){
            this.viewerSagittal.resetView()
        }
    }
    magnifyView(type, num){
        if(!num){
            num = 0
        }
        // for type parameter, 0 represents 3d, 1 represents axial, 2 represents coronal, 3 represents sagittal
        if(type === 0){
            this.viewer3D.magnifyView()
        }else if(type === 1){
            for(let i = 0; i < num; i++){
                this.viewerAxial.magnifyView()
            }
        }else if(type === 2){
            for(let i = 0; i < num; i++){
                this.viewerCoronal.magnifyView()
            }
        }else if(type === 3){
            for(let i = 0; i < num; i++){
                this.viewerSagittal.magnifyView()
            }
        }
        // this.camera.setParallelScale(this.camera.getParallelScale() / 0.9)
        // this.renderer.updateLightsGeometryToFollowCamera();
    }
    reductView(type, num){
        if(type === 0){
            this.viewer3D.reductView()
        }else if(type === 1){
            for(let i = 0; i < num; i++){
                this.viewerAxial.reductView()
            }
        }else if(type === 2){
            for(let i = 0; i < num; i++){
                this.viewerCoronal.reductView()
            }
        }else if(type === 3){
            for(let i = 0; i < num; i++){
                this.viewerSagittal.reductView()
            }
        }
    }
    turnLeft(){
        this.viewer3D.turnLeft()
    }
    turnRight(){
        this.viewer3D.turnRight()
    }
    click3DViewer(x, y){
        const picked = this.viewer3D.getPicked(x, y)
        return picked
    }
    clearPointActor(){
        this.viewer3D.clearPointActor()
    }
    changeMode(model){
        this.viewer3D.changeMode(model)
    }

    render() {
        const {
            viewerWidth,
            viewerHeight,
            selectionStyles
        } = this.state

        const {
            actors,
            pointActors,
            axialVolumes,
            coronalVolumes,
            sagittalVolumes,
        } = this.props

        const style = {position:"absolute", top:"0", width:viewerWidth, height:viewerHeight, zIndex:"0"}
        return (
            <div style={style}>
                <VTK3DViewer id="viewer-3D"
                             viewerStyle={selectionStyles[0]}
                             actors={actors}
                             pointActors={pointActors}
                             type={0}
                             onRef={(ref) => {this.viewer3D = ref}}
                />
                <VTKMPRViewer id="viewer-axial"
                              viewerStyle={selectionStyles[1]}
                              volumes={axialVolumes}
                              type={1}
                              onRef={(ref) => {this.viewerAxial = ref}}
                />
                <VTKMPRViewer id="viewer-coronal"
                              viewerStyle={selectionStyles[2]}
                              volumes={coronalVolumes}
                              type={2}
                              onRef={(ref) => {this.viewerCoronal = ref}}
                />
                <VTKMPRViewer id="viewer-sagittal"
                              viewerStyle={selectionStyles[3]}
                              volumes={sagittalVolumes}
                              type={3}
                              onRef={(ref) => {this.viewerSagittal = ref}}
                />
            </div>
        )
    }

}
export default VTKViewer