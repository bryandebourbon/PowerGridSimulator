import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
// import {Testboard} from './Leaderboard';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render( <div>
    <App />
    {/* <Testboard /> */}
    </div> , document.getElementById('root'));
registerServiceWorker();