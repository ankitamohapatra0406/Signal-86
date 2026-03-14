import { motion as Motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Howl } from "howler";
import introSound from "../assets/sounds/hawkins.mp3";

function HawkinsIntro() {

  const [shrink,setShrink] = useState(false);
  const [glitch,setGlitch] = useState(true);


  useEffect(()=>{

  const sound = new Howl({
    src:[introSound],
    volume:0.8
  });

  sound.play();

  /* stop glitch after 1 second */

  setTimeout(()=>{
    setGlitch(false);
  },1000);

  /* shrink after 6 seconds */

  const timer = setTimeout(()=>{
    setShrink(true);
  },3000);

  return ()=>clearTimeout(timer);

},[]);

  return (

  <div className="hawkins-container">

    {/* red cinematic light */}

    <Motion.div
      className="hawkins-light"
      initial={{ opacity:0 }}
      animate={{ opacity:1 }}
      transition={{ duration:2 }}
    />

    <Motion.h1
  className={`hawkins-text ${glitch ? "glitch" : ""}`}
  initial={{ opacity:0, y:40 }}
  animate={
    shrink
      ? { y:-220, opacity:0.9 }
      : { y:0, opacity:1 }
  }
  transition={{
    duration:2,
    ease:"easeOut"
  }}
>

  <span className="hawkins-sweep">
    WELCOME TO HAWKINS
  </span>

</Motion.h1>

  </div>

);
}

export default HawkinsIntro;