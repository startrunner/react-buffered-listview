import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
//import App from './App';
import reportWebVitals from './reportWebVitals';
import IDataStore from './IDataStore';
import DataView from './DataView';
import ExampleItem from './ExampleItem';
import ListDataStore from './ListDataStore';

const dataStore = new ListDataStore<ExampleItem>([
    { title: "Initial Item 1" },
    { title: "Initial Item 2" },
    { title: "Initial Item 3" },
]);

let _counter = 0;
function add(count: number) {
    for (let i = 0; i < count; i++) {
        const title = `Item ${++_counter}`;
        const theItem: ExampleItem = { title };
        dataStore.add(theItem);
    }
}

add(18);


ReactDOM.render(
    <React.StrictMode>

        <div className="dick-host">
            <div style={{ height: '80px' }}></div>
            {<DataView
                store={dataStore}
                itemHeight={24}
                itemRenderer={item => <span>{item.title}</span>}
            />}
        </div>

        <button onClick={() => add(1)} >Add 1</button>
        <button onClick={() => add(1000)} >Add 1K</button>
        <button onClick={() => add(10000)} >Add 10K</button>
    </React.StrictMode>,
    document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
