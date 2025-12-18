import { useState, useRef, useEffect } from "react";
import { Room } from "./Room";

const Landing = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<MediaStreamTrack | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<MediaStreamTrack | null>(null);
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);

  const getCam = async (): Promise<void> => {
    const stream = await navigator.mediaDevices.getUserMedia({
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
      <div className="w-screen h-screen bg-white flex flex-col text-sm text-gray-800">
        {/* Top */}
        <div className="border-b border-gray-300 px-4 py-2 font-semibold">
          omegle
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="flex gap-8">
            {/* BIGGER Webcam */}
            <div className="w-150 h-105 border border-gray-300 bg-black">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-3">
              <div>
                <div className="mb-1 text-gray-600">Enter your name (optional)</div>
                <input
                  type="text"
                  className="border border-gray-300 px-2 py-1 w-64 outline-none"
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <button
                className="border border-gray-400 bg-gray-100 px-4 py-1 hover:bg-gray-200"
                onClick={() => setJoined(true)}
              >
                Start Chat
              </button>

              <div className="text-xs text-gray-500">
                By clicking “Start Chat”, you agree to Omegle’s terms.
              </div>
            </div>
          </div>
        </div>
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
