import React, {Component} from 'react'
import {Pagination, Input, Grid, Checkbox, Button} from 'semantic-ui-react'
import MainList from '../components/MainList'
import Statistics from '../components/Statistics'
import DataCockpit from '../panels/DataCockpit'
import '../css/dataPanel.css'
import axios from 'axios';
import qs from 'qs'
import {withRouter} from 'react-router-dom'
import LowerAuth from '../components/LowerAuth'

const config = require('../config.json')
const recordConfig = config.record

class DataPanel extends Component {

    constructor(props) {
        super(props)
        this.state = {
        }
    }


    render() {
        const {activePage} = this.state
        const isChecked = this.state.checked
        let type = "pid"

        if (isChecked) {
            type = "date"
        }

        return (
            localStorage.getItem('auths')!==null && JSON.parse(localStorage.getItem('auths')).indexOf("stat")>-1?
            <div className='banner'>
                <Grid>
                    <Grid.Row >
                        <Grid.Column width={2}></Grid.Column>
                        <Grid.Column width={12}>
                            <Statistics/>
                        </Grid.Column>
                        <Grid.Column width={2}></Grid.Column>
                    </Grid.Row>
                    <Grid.Row >
                        <Grid.Column width={16}>
                            <DataCockpit/>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>

            </div>
            :
            <LowerAuth></LowerAuth>
        )
    }
}

export default withRouter(DataPanel)