import {combineReducers} from 'redux'
import _ from 'lodash'

const configReducer = (state = {config:null}, action) => {
    switch(action.type){
        case 'REQUEST_CONFIG_JSON':
            return{
                ...state,
                fetchingConfigJson: true
            }
        case 'RECEIVE_CONFIG_JSON':
            return {
                ...state,
                fetchingConfigJson: false,
                config: action.config
            }
        default:
            return state
    }
}

const dataCenterReducer = (state = {caseData:[], imageIds:[]}, action) => {
    switch(action.type){
        case 'RECEIVE_IMAGE_IDS':
            const caseData = state.caseData
            // const caseId = action.caseId
            const caseId = action.caseId
            const imageIds = action.imageIds
            caseData.push({
                caseId,
                imageIds
            })
            // console.log('caseDataItem', caseDataItem)
            return{
                ...state,
                caseData,
                imageIds: imageIds
            }
        default:
            return state
    }
}

export default combineReducers({
    config: configReducer,
    dataCenter: dataCenterReducer
})