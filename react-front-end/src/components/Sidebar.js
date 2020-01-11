import React, {useState, useEffect} from 'react';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { makeStyles } from '@material-ui/core/styles';
import videosList from '../data/video_data.json';
import SearchBar from './SearchBar';
import axios from 'axios';

const useStyles = makeStyles(theme => ({
  root: {
    position: "absolute",
    backgroundColor: theme.palette.background.paper,
    width: "225 px",
  },
  tabs: {
    borderRight: `2px solid ${theme.palette.divider}`,
    height: 890
  },
  logo: {
    fontSize: 25,
  },
  tab: {
    fontSize: 18,
  }
}));

export default function VerticalTabs(props) {
  const classes = useStyles();
  const videos = videosList.videos;
  const [value, setValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  // const videosObjectLookup = {}

  // videos.map(video => {
  //   videosObjectLookup[video] = 0;
  // });

  // for (let i = 2; i < videos.length; i++) {

  // }
  axios.get("/videos/")
  .then(res => {
    videos = res;
  })
  const handleChange = (event, newValue) => {
    setValue(newValue);
    props.changeView(newValue);
  };

  // const checkVideoNames = (query) => {
    
  //   if (video.name === query){
  //     setValue()
  //   }
  // }
  // useEffect(() => {

  // }, [searchTerm])
  return (
    <div className={classes.root}>
     
        <Tabs
        orientation="vertical"
        variant="scrollable"
        value={value}
        onChange={handleChange}
        className={classes.tabs}
      >
        <Tab className ={classes.logo} label="Smart-Retailer"/>
        <Tab className = {classes.tab} label="Upload" />
        <SearchBar onSearch={setSearchTerm}/>
        {videos.map(video => (
        <Tab className = {classes.tab} 
        label={video.name}
        key={video.id} 
        />
        ))}

      </Tabs>
    </div>
  );
}