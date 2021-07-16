import React, { Component } from "react";
import axios from "axios";
import { Slider, Select, Space, Checkbox, Tabs } from "antd";

class AdminManagePanel extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.config = JSON.parse(localStorage.getItem("config"));
  }

  //   render() {
  //     //   return(
  //     //   )
  //   }
}

export default AdminManagePanel;
