import { useEffect, useState } from "react";
import { socket } from "../socket/socketClient";

function CreateRoom({
  isHost,
  roomCode,
  setRoomCode,
  playerId,
  setPlayerId,
  setScreen,
  setRole
}){
  const [players, setPlayers] = useState([]);

  useEffect(() => {

    const handleRoomCreated = (data) => {

      console.log("room_created:", data);

      setRoomCode(data.roomCode);
      setPlayerId(data.playerId);

    };

    const handleRoomPlayers = (data) => {

      if (Array.isArray(data.players)) {
        setPlayers(data.players);
      }

    };

    socket.on("room_created", handleRoomCreated);
    socket.on("room_players", handleRoomPlayers);

    const handleRoleAssignment = (data) => {

      console.log("role_assignment:", data);

      setRole(data.role);

      setScreen("game");

    };

socket.on("role_assignment", handleRoleAssignment);
    if (isHost && !roomCode) {

      socket.emit("create_room", {
        playerName: "Host"
      });

    }

    return () => {
      socket.off("role_assignment", handleRoleAssignment);

      socket.off("room_created", handleRoomCreated);
      socket.off("room_players", handleRoomPlayers);

    };

  }, [isHost, roomCode, setRoomCode, setPlayerId, setRole, setScreen]);

  useEffect(() => {

      const handleRole = (data) => {

        console.log("ROLE:", data);

        setRole(data.role);
        setScreen("game");

      };

      socket.on("role_assignment", handleRole);

      return () => {
        socket.off("role_assignment", handleRole);
      };

}, [setRole, setScreen]);
  const startGame = () => {

    socket.emit("start_game", {
      roomCode,
      playerId
    });

  };

  return (

    <div className="room-container">

      <div className="room-box">

        <h2 className="room-title">
          ROOM LOBBY
        </h2>

        <div className="room-code">
          {roomCode || "...."}
        </div>

        <div className="room-subtitle">
          Share this code with your team
        </div>

        <div className="players-list">

          {players.length === 0 && (
            <div className="player-item">
              Waiting for players...
            </div>
          )}

          {players.map((player) => (
            <div
              key={player.playerId}
              className={`player-item ${player.ready ? "ready" : ""}`}
              style={{ display: "flex", justifyContent: "space-between" }}
            >
              <span>
                PLAYER {player.playerNumber}
                {player.isHost ? " (HOST)" : ""}
              </span>
              <span>
                {player.ready ? "READY" : "WAITING"}
              </span>
            </div>
          ))}

        </div>

        <div className="room-status">
          {players.length} player{players.length !== 1 && "s"} in lobby
        </div>

        {!isHost && (
          <button
            className="menu-button"
            onClick={() => {
              socket.emit("player_ready", { roomCode, playerId });
            }}
            style={{ marginTop: "20px" }}
          >
            MARK READY
          </button>
        )}

        {isHost && (

          <>
            <div style={{marginTop:"20px",marginBottom:"10px"}}>
              TAKE POSITIONS
            </div>

            <button
              className="menu-button"
              onClick={startGame}
            >
              START GAME
            </button>
          </>

        )}

      </div>

    </div>

  );

}

export default CreateRoom;