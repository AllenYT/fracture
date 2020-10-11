import React, { Component } from 'react';
import { DragDropContext } from 'react-dnd';
import { TouchBackend } from 'react-dnd-touch-backend';

//
// import {
//   studies,
//   onThumbnailClick,
//   onThumbnailDoubleClick,
// } from './exampleStudies.js';
// import ExampleDropTarget from './ExampleDropTarget.js';
import { StudyBrowser } from 'react-viewerbase';

class StudyBrowserContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            studies:[
                {
                    thumbnails: [
                    {
                        imageSrc:
                        'https://raw.githubusercontent.com/crowds-cure/cancer/master/public/screenshots/Anti-PD-1_Lung.jpg',
                        SeriesDescription: 'Anti-PD-1_Lung',
                        active: true,
                        SeriesNumber: '2',
                        numImageFrames: 512,
                        stackPercentComplete: 30,
                    },
                    {
                        imageSrc:
                        'https://raw.githubusercontent.com/crowds-cure/cancer/master/public/screenshots/Anti-PD-1_MELANOMA.jpg',
                        SeriesDescription: 'Anti-PD-1_MELANOMA',
                        SeriesNumber: '2',
                        InstanceNumber: '1',
                        numImageFrames: 256,
                        stackPercentComplete: 70,
                    },
                    {
                        altImageText: 'SR',
                        SeriesDescription: 'Imaging Measurement Report',
                        SeriesNumber: '3',
                        stackPercentComplete: 100,
                    },
                    ],
                }
            ]
        }
    }
  render() {
    //const viewportData = [null, null, null, null];
    const {studies} = this.state 
    return (
      <React.Fragment>
        {/* <ExampleDropTarget /> */}
        <StudyBrowser
          studies={studies}
        //   onThumbnailClick={onThumbnailClick}
        //   onThumbnailDoubleClick={onThumbnailDoubleClick}
        />
      </React.Fragment>
    );
  }
}

// Note:
// Normally, the top level APP component is wrapped with the DragDropContext
// We wrap this component to create a simple/local example.
const WrappedStudyBrowser = DragDropContext(
  TouchBackend({ enableMouseEvents: true }),
  null,
  true
)(StudyBrowserContainer);

// http://react-dnd.github.io/react-dnd/docs/api/drag-drop-context
export { WrappedStudyBrowser };