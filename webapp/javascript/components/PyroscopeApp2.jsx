import React from 'react';
import { connect } from "react-redux";
import "react-dom";

import Modal from "react-modal";
import {withShortcut} from "react-keybind";

// import FlameGraphRenderer from "./FlameGraphRenderer";
import FlameGraphRenderer2 from "./FlameGraphRenderer2";
// import TimelineChart from "./TimelineChart";
import TimelineChart2 from "./TimelineChart2";
import ShortcutsModal from "./ShortcutsModal";
import Header from "./Header";
import Footer from "./Footer";

import { receiveJSON, fetchNames } from "../redux/actions";
import {bindActionCreators} from "redux";

const modalStyle = {
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  content: {
    background: '#222',
    border: '1px solid #111',
  },
};



let currentJSONController = null;

class PyroscopeApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      shortcutsModalOpen: false
    };
  }

  componentDidMount = () => {
    let renderURL = this.buildRenderURL();
    this.fetchJSON(renderURL + '&format=json');
    // this.props.fetchNames();
    // this.props.shortcut.registerShortcut(this.showShortcutsModal, ['shift+?'], 'Shortcuts', 'Show Keyboard Shortcuts Modal');
  }

  showShortcutsModal = () => {
    this.setState({shortcutsModalOpen: true})
  }

  closeShortcutsModal = () => {
    this.setState({shortcutsModalOpen: false});
  }

  fetchJSON(url) {
    console.log('fetching json', url);
    if (currentJSONController) {
      currentJSONController.abort();
    }
    currentJSONController = new AbortController();
    fetch(url, {signal: currentJSONController.signal})
      .then((response) => {
        return response.json()
      })
      .then((data) => {
        console.log('data:', data);
        console.log('this: ', this);
        console.dir(this);
        this.props.actions.receiveJSON(data)
      })
      .finally();
  }

  buildRenderURL() {
    let width = document.body.clientWidth - 30;
    let url = `/render?from=${encodeURIComponent(this.props.from)}&until=${encodeURIComponent(this.props.until)}&width=${width}`;
    let nameLabel = this.props.labels.find(x => x.name == "__name__");
    if (nameLabel) {
      url += "&name="+nameLabel.value+"{";
    } else {
      url += "&name=unknown{";
    }

    url += this.props.labels.filter(x => x.name != "__name__").map(x => `${x.name}=${x.value}`).join(",");
    url += "}";
    if(this.props.refreshToken){
      url += `&refreshToken=${this.props.refreshToken}`
    }
    url += `&max-nodes=${this.props.maxNodes}`
    return url;
  }

  render() {
    let renderURL = this.buildRenderURL();
    // See docs here: https://github.com/flot/flot/blob/master/API.md
    let flotOptions = {
      margin: {
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
      },
      selection: {
				mode: "x"
			},
      grid: {
        borderWidth: 1,
        margin:{
          left: 16,
          right: 16,
        }
      },
      yaxis: {
        show: false,
        min: 0,
      },
      points: {
        show: false,
        radius: 0.1
      },
      lines: {
        show: false,
        steps: true,
        lineWidth: 1.0,
      },
      bars: {
        show: true,
        fill: true
      },
      xaxis: {
        mode: "time",
        timezone: "browser",
        reserveSpace: false
      },
    };
    let timeline = this.props.timeline || [];
    timeline = timeline.map((x) => [x[0], x[1] === 0 ? null : x[1] - 1]);
    let flotData = [timeline];
    return (
      <div>
        <Header renderURL={renderURL}/>
        <TimelineChart2 id="timeline-chart" options={flotOptions} data={flotData} width="100%" height="100px"/>
        <FlameGraphRenderer2 />
        <Modal
          isOpen={this.state.shortcutsModalOpen}
          style={modalStyle}
          appElement={document.getElementById('root')}
        >
          <div className="modal-close-btn" onClick={this.closeShortcutsModal}></div>
          <ShortcutsModal closeModal={this.closeShortcutsModal}/>
        </Modal>
        <Footer/>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  ...state,
});

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators(
      {
        fetchNames,
        receiveJSON,
      },
      dispatch,
  ),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(PyroscopeApp);