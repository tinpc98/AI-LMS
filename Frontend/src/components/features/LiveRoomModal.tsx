import React from "react";
import { JitsiMeeting } from "@jitsi/react-sdk";
import type { JaasConferenceData } from "../../hooks/useJaasConference";

interface LiveRoomModalProps {
  isOpen?: boolean;
  open?: boolean;
  onClose: () => void;
  conference?: JaasConferenceData | null;
  meetingRoomId?: string;
  jwtToken?: string;
  appId?: string;
}

const LiveRoomModal: React.FC<LiveRoomModalProps> = ({
  isOpen,
  open,
  onClose,
  conference,
  meetingRoomId,
  jwtToken,
  appId,
}) => {
  const isVisible = isOpen ?? open ?? false;
  const token = conference?.token || jwtToken || "";
  const jaasAppId = conference?.appId || appId || "vpaas-magic-cookie-fbd136285b3941a2a16d9e56702c3bd2";
  const domain = conference?.domain || import.meta.env.VITE_JAAS_DOMAIN || "8x8.vc";
  const roomName = conference?.roomName || meetingRoomId || "";

  if (!isVisible || !token || !roomName || !jaasAppId) return null;

  const rawRoomName = roomName.trim();
  const fullRoomName = rawRoomName.startsWith(jaasAppId) ? rawRoomName : `${jaasAppId}/${rawRoomName}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-6xl flex justify-between items-center mb-3 text-white">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          Lớp Học Trực Tuyến Bảo Mật 8x8 JaaS
        </h3>
        <button
          onClick={onClose}
          className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-all cursor-pointer"
        >
          Rời phòng
        </button>
      </div>

      <div className="w-full max-w-6xl h-[80vh] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
        <JitsiMeeting
          domain={domain}
          roomName={fullRoomName}
          jwt={token}
          configOverwrite={{
            disableThirdPartyRequests: true,
            prejoinPageEnabled: false,
          }}
          getIFrameRef={(iframeRef) => {
            if (iframeRef) {
              iframeRef.style.height = "100%";
              iframeRef.style.width = "100%";
            }
          }}
          onReadyToClose={onClose}
        />
      </div>
    </div>
  );
};

export default LiveRoomModal;