// periodically request leaderboard data from the database
import React, { Component } from 'react';
import "./Leaderboard.css"
import { Medalsvg } from "./medal"

export class Leaderboard extends Component {

    componentWillMount() {
        this.state = { mounted: window.location.href.includes('leaderboard') }
        window.addEventListener('hashchange', () => {
            this.setState({ mounted: window.location.href.includes('leaderboard') })
            // and update leaderboard immediately
        })
    }

    render() {
        const { mounted } = this.state
        const { title, icon, children } = this.props
        return <div className={"leaderboard" + (mounted ? "" : " hidden")}>
            <h2>
                {title}
            </h2>
            {/* <img src={icon} alt={title.toLowerCase()} /> */}
            <ul className="mdc-list mdc-list--avatar-list">
                {children}
            </ul>
        </div>
    }
}

function Ateam(props) {
    const { name, score, rank } = props
    return <li className="mdc-list-item">
        <Medal rank={rank} />
        <p>{name}</p>
        <p className="mdc-list-item__end-detail">{score}</p>
    </li>
}

function Medal({ rank }) {
    switch (rank) {
        case 0:
            return <Medalsvg className="mdc-list-item__start-detail gold" />
        case 1:
            return <Medalsvg className="mdc-list-item__start-detail silver" />
        case 2:
            return <Medalsvg className="mdc-list-item__start-detail bronze" />
        default:
            return <span className="mdc-list-item__start-detail nomedal">{rank + 1}</span>
    }
}

function scoresToBoard(scores, title) {
    // input [{teamname,score}]
    scores.sort((a, b) => b.score - a.score)
    return <Leaderboard title={title} icon="#">
        {scores.map(({ teamname, score }, i) => <Ateam name={teamname} score={score} rank={i} key={teamname} />)}
    </Leaderboard>
}

export const Testboard = () => <div>
    {scoresToBoard([
        { teamname: localStorage.getItem('teamname') || "remi1", score: 12 },
        { teamname: "remi2", score: 22 },
        { teamname: "remi3", score: 92 },
        { teamname: "remi4", score: 122 },
    ], "Overall")}
    {scoresToBoard([
        { teamname: localStorage.getItem('teamname') || "remi1", score: 12 },
        { teamname: "remi2", score: 2 },
        { teamname: "remi3", score: 92 },
        { teamname: "remi4", score: 122 },
    ], "Cost")}
</div>