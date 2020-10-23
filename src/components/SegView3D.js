import React,{Component} from "react"
import vtkActor from "vtk.js/Sources/Rendering/Core/Actor"
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper'
import vtkColorMaps from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkGenericRenderWindow from 'vtk.js/Sources/Rendering/Misc/GenericRenderWindow'
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction'
import vtkXMLPolyDataReader from 'vtk.js/Sources/IO/XML/XMLPolyDataReader'

import PropTypes from 'prop-types'
import { Grid } from 'semantic-ui-react'
import '../css/cornerstone.css'
import axios from 'axios'
import qs from 'qs'

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
        this.genericRenderWindow = null
        this.container = React.createRef()
    }



    componentDidMount(){
        let volumes = []
        let actors = []
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

        this.componentDidUpdate({})

        if(this.props.volumes){
            volumes = volumes.concat(this.props.volumes)
        }
        if(this.props.actors){
            actors = actors.concat(this.props.actors)
        }
        this.renderer.resetCamera()
        this.renderWindow.render()
    }

    componentDidUpdate(prevProps) {
        if (prevProps.volumes !== this.props.volumes){
            if(this.props.volumes.length){
                this.props.volumes.forEach(this.renderer.addVolume);
            }else{
                //  Remove all volumes
            }
            this.renderWindow.render()

        }

        if (prevProps.actors !== this.props.actors){
            //console.log("call Update actos change", this.props.actors)
            // console.log("getActor before", this.renderer.getActors())
            this.renderer.removeAllActors()
            // console.log("getActor after", this.renderer.getActors())

            if(this.props.actors.length){
                this.props.actors.forEach(this.renderer.addActor)
            }else{
                // Remove all actors
            }
            this.renderer.resetCamera()
            this.renderWindow.render()
        }
    }


    render() {
        if (!this.props.volumes && !this.props.actors) {
            return null;
        }

        let voi = {
            windowCenter: 0,
            windowWidth: 0,
        };

        return (
            <div id="seg3d-canvas"
                ref={input => {
                    this.container.current = input
                }}/>
        )
    }

}

export default SegView3D
