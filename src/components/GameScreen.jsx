import { useEffect, useState } from "react";
import { socket } from "../socket/socketClient";
import RadarCanvas from "./RadarCanvas";

function GameScreen({ role, roomCode, playerId }) {

  const [timeRemaining,setTimeRemaining] = useState(1200);
  const [radarPlayers,setRadarPlayers] = useState([]);
  const [selfLocation,setSelfLocation] = useState(null);
  const [allPlayers,setAllPlayers] = useState({});
  const [danger,setDanger] = useState(null);
  const [demogorgonRadar,setDemogorgonRadar] = useState(false);

  // New States
  const [phase, setPhase] = useState("running");
  const [aliveCyphers, setAliveCyphers] = useState(0);
  const [aliveDemogorgon, setAliveDemogorgon] = useState(0);
  
  const [immunityUntil, setImmunityUntil] = useState(null);
  
  const [voteCandidates, setVoteCandidates] = useState([]);
  const [voteDuration, setVoteDuration] = useState(0);
  const [voteResult, setVoteResult] = useState(null);
  
  const [eliminated, setEliminated] = useState(false);
  const [winner, setWinner] = useState(null);

  // ======================
  // GPS STREAMING
  // ======================

  useEffect(()=>{

    if(!navigator.geolocation){
      console.log("Geolocation not supported");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(

      (pos)=>{

        if (eliminated || phase !== "running") return; // Reduce sending if not running

        const { latitude,longitude,speed } = pos.coords;

        setSelfLocation({
          latitude,
          longitude
        });

        setAllPlayers(prev=>({
          ...prev,
          [playerId]:{
            latitude,
            longitude
          }
        }));

        socket.emit("location_update",{
          roomCode,
          playerId,
          latitude,
          longitude,
          speed: speed || 0,
          timestamp: Math.floor(Date.now()/1000)
        });

      },

      (err)=>{
        console.log("GPS error",err);
      },

      {
        enableHighAccuracy:true,
        maximumAge:1000
      }

    );

    return ()=>{
      navigator.geolocation.clearWatch(watchId);
    };

  },[roomCode,playerId, eliminated, phase]);


  // ======================
  // GAME STATE (Tick)
  // ======================

  useEffect(()=>{

    const handleGameState=(data)=>{
      if(data.timeRemainingSeconds !== undefined) setTimeRemaining(data.timeRemainingSeconds);
      if(data.aliveCyphers !== undefined) setAliveCyphers(data.aliveCyphers);
      if(data.aliveDemogorgon !== undefined) setAliveDemogorgon(data.aliveDemogorgon);
      if(data.phase !== undefined) setPhase(data.phase);
    };

    socket.on("game_state",handleGameState);

    return ()=>{
      socket.off("game_state",handleGameState);
    };

  },[]);


  // ======================
  // RADAR UPDATE FROM SERVER
  // ======================

  useEffect(()=>{
    const handleRadar=(data)=>{
      if(data.players && data.players.length > 0){
        setRadarPlayers(data.players);
      }
    };
    socket.on("radar_update",handleRadar);
    return ()=>{
      socket.off("radar_update",handleRadar);
    };
  },[]);


  // ======================
  // DEMOGORGON RADAR WINDOW
  // ======================

  useEffect(()=>{
    const radarOn=()=>setDemogorgonRadar(true);
    const radarOff=()=>setDemogorgonRadar(false);
    socket.on("demogorgon_radar_active",radarOn);
    socket.on("demogorgon_radar_off",radarOff);
    return ()=>{
      socket.off("demogorgon_radar_active",radarOn);
      socket.off("demogorgon_radar_off",radarOff);
    };
  },[]);


  // ======================
  // DANGER ALERT & IMMUNITY
  // ======================

  useEffect(()=>{
    const handleDanger=(data)=>{
      setDanger(data); // data has distance and countdownRemaining
    };
    const handleImmunity=(data)=>{
      setImmunityUntil(new Date(data.immunityUntil));
    };

    socket.on("danger_alert",handleDanger);
    socket.on("mothergate_completed",handleImmunity);

    return ()=>{
      socket.off("danger_alert",handleDanger);
      socket.off("mothergate_completed",handleImmunity);
    };
  },[]);


  // ======================
  // VOTING, ELIMINATION, END END
  // ======================

  useEffect(() => {
    const handleVoteStart = (data) => {
      setVoteCandidates(data.candidates);
      setVoteDuration(data.duration);
      setPhase("voting");
    };

    const handleVoteResult = (data) => {
      setVoteResult(data);
      setVoteCandidates([]);
    };

    const handleEliminated = () => {
      // Assuming data is like { event: player_eliminated, playerNumber: index }
      // The local player logic is a bit abstract since we use playerId on client, 
      // but if we receive this, we might be the one eliminated if checking matching numbers.
      // For now, if we get this and it implies us (if we knew our playerNumber).
      // Assuming backend targets the right socket or we check it.
      // Easiest is to set eliminated if we are told we are.
      // Actually spec says "Broadcasted when a Cypher is captured", maybe not just us.
      // So we just track it. We'll simply set an eliminated flag if we receive it for us.
      setEliminated(true); // Simplified for this client if they receive direct elimination broadcast meant for them.
    };

    const handleGameEnd = (data) => {
      setWinner(data.winner);
      setPhase("ended");
    };

    socket.on("vote_start", handleVoteStart);
    socket.on("vote_result", handleVoteResult);
    socket.on("player_eliminated", handleEliminated);
    socket.on("game_end", handleGameEnd);

    return () => {
      socket.off("vote_start", handleVoteStart);
      socket.off("vote_result", handleVoteResult);
      socket.off("player_eliminated", handleEliminated);
      socket.off("game_end", handleGameEnd);
    };
  }, []);

  // ======================
  // ACTIONS
  // ======================

  const startMothergate = () => {
    socket.emit("mothergate_start", { roomCode, playerId });
  };

  const submitVote = (targetPlayerId) => {
    socket.emit("vote_submit", { roomCode, voterId: playerId, targetPlayerId });
    setVoteCandidates([]); // Hide buttons after voting
  };


  // ======================
  // FRONTEND RADAR FALLBACK
  // ======================

  const simulatedRadarPlayers = Object.entries(allPlayers)
    .filter(([id])=>id !== playerId)
    .map(([,data],index)=>({
      playerNumber:index+1,
      latitude:data.latitude,
      longitude:data.longitude
    }));

  const radarData =
    radarPlayers.length > 0 ? radarPlayers : simulatedRadarPlayers;

  // ======================
  // TIMER DISPLAY
  // ======================

  const minutes = Math.floor(timeRemaining/60);
  const seconds = timeRemaining % 60;

  // Check immunity
  const isImmune = immunityUntil && new Date() < immunityUntil;

  return (

    <div className="room-container">

      <div className="room-box">

        <h2 className="room-title">
          SIGNAL 86
        </h2>

        {winner && (
          <div style={{ color: "gold", fontSize: "24px", marginBottom: "10px" }}>
            GAME ENDED. WINNER: {winner.toUpperCase()}
          </div>
        )}

        <div className="room-subtitle">
          {minutes}:{seconds.toString().padStart(2,"0")}
        </div>
        
        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>
          Phase: {phase.toUpperCase()} | Cyphers: {aliveCyphers} | Demogorgon: {aliveDemogorgon}
        </div>

        <div className="room-subtitle" style={{ marginTop: "10px" }}>
          Your Role
        </div>

        <div className="room-code">
          {role ? role.toUpperCase() : "LOADING"}
        </div>
        
        {eliminated && (
          <div style={{ color: "red", fontSize: "20px", marginTop: "10px" }}>
            YOU HAVE BEEN ELIMINATED
          </div>
        )}

        {/* Voting UI */}
        {phase === "voting" && voteCandidates.length > 0 && !eliminated && (
          <div style={{ margin: "20px 0", padding: "10px", border: "1px solid yellow" }}>
            <h3 style={{ color: "yellow" }}>VOTING PHASE</h3>
            <p>Vote for a suspected Demogorgon! Time: {voteDuration}s</p>
            {voteCandidates.map(c => (
               <button 
                key={c.playerNumber} 
                className="menu-button" 
                style={{ scale: 0.8, margin: "5px" }}
                onClick={() => submitVote(c.playerId || c.playerNumber.toString())}
              >
                 VOTE PLAYER {c.playerNumber}
               </button>
            ))}
          </div>
        )}

        {voteResult && (
          <div style={{ color: "yellow", marginTop: "10px" }}>
            VOTING RESULT: {voteResult.outcome.toUpperCase()}
            {voteResult.revealedRole && ` - Player was ${voteResult.revealedRole}`}
          </div>
        )}

        {/* Danger alert */}
        {danger && role === "cypher" && !eliminated && phase === "running" && (
          <div style={{
            marginTop:"20px",
            color:"red",
            fontWeight:"bold"
          }}>
            WARNING: DEMOGORGON ({danger.distance.toFixed(1)}m)
            <br />
            CAPTURE IN: {danger.countdownRemaining.toFixed(1)}s
          </div>
        )}
        
        {/* Immunity / Mothergate */}
        {role === "cypher" && !eliminated && phase === "running" && (
          <div style={{ marginTop: "20px" }}>
            {isImmune ? (
               <div style={{ color: "cyan" }}>IMMUNE UNTIL SPRINT ENDS</div>
            ) : (
               <button className="menu-button" style={{ scale: 0.8 }} onClick={startMothergate}>
                 OPEN MOTHERGATE SPRINT
               </button>
            )}
          </div>
        )}


        {/* Demogorgon radar window */}

        {role === "demogorgon" && demogorgonRadar && phase === "running" && (

          <div style={{
            marginTop:"20px",
            color:"#ff4444"
          }}>
            RADAR ACTIVE
          </div>

        )}

        {/* RADAR */}
        {(!eliminated && phase === "running") && (
          <RadarCanvas
            players={radarData}
            self={selfLocation}
          />
        )}

      </div>

    </div>

  );

}

export default GameScreen;