import React, { Component, Fragment } from 'react';
import HashMount from "./HashMount"
import { City } from './Map'
import './App.css';

function App() {
  const map = {}
  return <HashMount hash="" className="submission">
    <Problem />
    <PowerCity map={map} />
    <LoginSubmit map={map} />
  </HashMount>
}

function Problem() {
  return <Fragment>
    <h2>Problem Statement</h2>
    <p>Q: more than one generator at a location?</p>
  </Fragment>
}

class LoginSubmit extends Component {
  // props:{map{data}}
  // state:{submitting}
  // data: {username, password}
  componentWillMount() {
    this.setState({ submitting: false })
    this.data = {}
  }
  async submit() {
    this.setState({ submitting: true })
    const loggedin = await this.login()
    if (loggedin) {
      const data = JSON.stringify(this.props.map.data)
      console.log(data)
      if (!data) throw new Error('No input')

      // fetch('http://localhost:5000/submit/', { method: "POST", body: data }) // Use fetch API to send a HTTP request to  localhost:5000 which is where Flask runs
      //   .then(response => {
      //     this.setState({ submitting: false })
      //     return response.json()
      //   })
      //   .then(response => {
      //     console.log(response);
      //     window.history.pushState({}, "", "#leaderboard")
      //     window.dispatchEvent(new HashChangeEvent("hashchange"))
      //   })
      //   .catch((error) => {
      //     alert("Server Busy, Please Try Again Later")
      //     console.error(error);
      //   })
    }
    this.setState({ submitting: false })
  }
  async login() {
    const { username, password } = this.data
    if (username && password)
      return fetch('http://localhost:5000/login/', { headers: new Headers({ username, key: password }) })
        .then(res => res.text()).then(txt => {
          console.log(txt)
          if (txt.startsWith("1")) {
            this.setState({ loggedin: true })
            localStorage.setItem('teamname', username)
            return true
          } else {
            alert(txt.slice(1))
            return false
          }
        }).catch(err => console.error(err))
    else
      return false
  }
  render() {
    const { loggedin, submitting } = this.state
    const username = this.data.username || localStorage.getItem('teamname')
    return <Fragment>
      <h2>Team Info</h2>
      <div className="mdc-text-field login">
        <input type="text" name="teamname" id="teamname" placeholder="Team name" defaultValue={username}
          className="mdc-text-field__input" onInput={ev => this.data.username = ev.target.value}
          ref={ref=>{if(ref)this.data.username = ref.value}} />
        <input type="password" name="key" id="key" placeholder="Password"
          className="mdc-text-field__input" onInput={ev => this.data.password = ev.target.value} 
          ref={ref=>{if(ref)this.data.password = ref.value}}/>
      </div>
      <button id="submit" className="mdc-button mdc-button--raised" onClick={() => this.submit()}
        disabled={submitting}>{submitting ? "Wait" : "Submit"}</button>
    </Fragment>
  }
}

function PowerCity({ map }) {
  const stations = [[1, 1], [1, 3], [2, 2], [3, 1], [3, 3]]
  const generators = ["Nuclear", "Wind", "Fire", "Solar", "Solar2", "solar3", "solar4"]
  return <City dim={[3, 3]} map={map} stations={stations} generators={generators} />
}

export default App;