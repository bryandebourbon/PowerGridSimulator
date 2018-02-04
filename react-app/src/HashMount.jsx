import React, { Component } from 'react';

export default class HashMount extends Component {
    // if hash matches, will display, otherwise not display
    componentWillMount() {
        window.addEventListener('hashchange', () => this.setState({ mounted: window.location.hash==this.props.hash }))
    }
    render() {
        const { mounted } = this.state || { mounted: window.location.hash==this.props.hash }
        return <div style={mounted ? {} : { display: "none" }} {...this.props}>
            {this.props.children}
        </div>
    }
}