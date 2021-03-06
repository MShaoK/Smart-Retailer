import React, { useState, useEffect } from 'react';
import axios from 'axios';
// import Loading from '../Loading';

import { msTohhmmss } from '../../helpers/helpers'


export default function SingleDataPoint(props){
  // const [loading, setLoading] = useState(true);
  console.log(props.appState, " app state in single");
  let load;

  // function loadingTimeout() {
  //   load = setTimeout(() => {
  //     setLoading(false);
  //   }, 750);
  // }
  // useEffect(() => {
    // setLoading(true);
    // loadingTimeout();
  // },[props.appState]);

  // if (loading === true) {
  //   return (
  //     <Loading/>
  //   )
  // } 
  if (props.recur) {
    clearTimeout(load);

    let numOfRecur = 0;
    let totalNum = 0;
    props.recur.forEach(person => {
      if (person.is_recuring === true){
        numOfRecur++;
      }
      totalNum++;
    })
    return(
      <>
        <div>
            <div className="upperText">
              <p>
                Recurring customers vs Total Customers
              </p>
            </div>
          <div className="dataDisplay">
            <p>
              {numOfRecur} / {totalNum}
            </p>
          </div>
        </div>
      </>
    );
  }
  if (props.stayTime) {
    clearTimeout(load);
    console.log(props.stayTime, " staytime");
    let totalTime = 0;
    let averageTime = 0;

    props.stayTime.persons.forEach(person => {
      totalTime += person.stay_duration;
    });

    console.log(`totaltime`, totalTime);
    if(props.stayTime.persons) {
      averageTime = msTohhmmss(totalTime * 1000 / props.stayTime.persons.length); 
    }
    
    return(
      <>
        <div>
            <div className="upperText">
              <p>
                Average Time in Store
              </p>
            </div>
          <div className="dataDisplay">
            <p>
              {averageTime}
            </p>
          </div>
        </div>
      </>
    );
  }

    console.log(props.returnTime, "This is returning time");
  if (props.returnTime) {
    // clearTimeout(load);
    let totalReturnTime = 0;
    let count = 0;
    let averageReturnTime = 0;
    props.returnTime.forEach(person => {
      totalReturnTime += person.visit_date;
      if (person.is_recuring) {
        count++;
      }
    });

    if(count > 0)
      averageReturnTime = totalReturnTime / count;

    return(
      <>
        <div>
            <div className="upperText">
              <p>
                Average Days Recurring Customers take to return.
              </p>
            </div>
          <div className="dataDisplay">
            <p>
              {parseInt(averageReturnTime) + " days"}
            </p>
          </div>
        </div>
      </>
    );
  }

}