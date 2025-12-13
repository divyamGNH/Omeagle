import { useState, useRef, useEffect } from "react";
import Room from "./Room";

const Landing = () => {

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<MediaStreamTrack | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<MediaStreamTrack | null>(null);
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);

  const getCam = async (): Promise<void> => {
    const stream: MediaStream =
      await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

    const audioTrack = stream.getAudioTracks()[0];
    const videoTrack = stream.getVideoTracks()[0];

    setLocalAudioTrack(audioTrack);
    setLocalVideoTrack(videoTrack);

    if (!videoRef.current) return;

    videoRef.current.srcObject = new MediaStream([videoTrack]);
    await videoRef.current.play();
  };

  useEffect(() => {
    getCam();
  }, []);

  if (!joined) {
    return (
      <div>
        <video autoPlay ref={videoRef}></video>

        <input
          type="text"
          onChange={(e) => {
            setName(e.target.value);
          }}
        />

        <button
          onClick={() => {
            setJoined(true);
          }}
        >
          Join
        </button>
      </div>
    );
  }

  return (
    <Room
      name={name}
      localAudioTrack={localAudioTrack}
      localVideoTrack={localVideoTrack}
    />
  );

};

export default Landing;
