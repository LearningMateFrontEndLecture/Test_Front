import { useEffect, useRef, useState } from "react";
import styled from "styled-components";

export default function MainPage() {
  const [hearing, setHearing] = useState(false);
  const [lastText, setLastText] = useState("");

  // SpeechRecognition 참조
  const recRef = useRef(null);

  // Mic level용 참조들
  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);

  const [level, setLevel] = useState(0); // 0~1

  // ====== STT 시작/중지 ======
  const startSTT = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return alert("이 브라우저는 음성 인식을 지원하지 않아요.");

    const rec = new SR();
    rec.lang = "ko-KR";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setLastText(text);
      console.log("인식된 음성:", text);
    };

    rec.onend = () => setHearing(false);
    rec.onerror = () => setHearing(false);

    recRef.current = rec;
    setHearing(true);
    rec.start();
  };

  const stopSTT = () => {
    recRef.current?.stop();
  };

  // ====== Mic Level: hearing 토글 시 WebAudio 시작/정리 ======
  useEffect(() => {
    if (!hearing) {
      cleanupMic();
      setLevel(0);
      return;
    }
    startMicLevel();
    return cleanupMic;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hearing]);

  async function startMicLevel() {
    try {
      // 마이크 스트림 요청
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyserRef.current = analyser;

      source.connect(analyser);

      const data = new Uint8Array(analyser.fftSize);

      const tick = () => {
        analyser.getByteTimeDomainData(data);

        // RMS 계산
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128; // -1~1
          sum += v * v;
        }
        const rmsRaw = Math.sqrt(sum / data.length);

        // 노이즈 컷 + 정규화
        let lv = Math.max(0, (rmsRaw - 0.04) / 0.6); // 작은 소리 억제
        lv = Math.max(0, Math.min(1, lv));

        // 약간의 스무딩
        setLevel((prev) => prev + (lv - prev) * 0.35);

        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);

      // iOS 자동 resume
      if (ctx.state === "suspended") {
        const resumeOnce = () => {
          ctx.resume();
          window.removeEventListener("touchend", resumeOnce);
          window.removeEventListener("click", resumeOnce);
        };
        window.addEventListener("touchend", resumeOnce);
        window.addEventListener("click", resumeOnce);
      }
    } catch (e) {
      console.error("Mic level start error:", e);
    }
  }

  function cleanupMic() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;

    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    analyserRef.current = null;
  }

  return (
    <Page>
      <Center>
        <MicButton
          $hearing={hearing}
          onClick={hearing ? stopSTT : startSTT}
          aria-pressed={hearing}
          aria-label={hearing ? "듣기 중지" : "듣기 시작"}
        >
          {hearing ? "듣는 중..." : "증상을 말씀해주세요"}
        </MicButton>

        {lastText && (
          <Card>
            <Label>마지막 인식: </Label>
            <Bold>{lastText}</Bold>
          </Card>
        )}
      </Center>

      {/* 오른쪽 초록 볼륨 바 */}
      <MeterWrap aria-hidden={!hearing}>
        <MeterTrack>
          <MeterFill style={{ height: `${Math.round(level * 100)}%` }} />
        </MeterTrack>
        <Dots>
          <Dot $on={level > 0.2} />
          <Dot $on={level > 0.35} />
          <Dot $on={level > 0.5} />
        </Dots>
      </MeterWrap>
    </Page>
  );
}

/* ================= styled ================= */
const Page = styled.div`
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: 24px;
  position: relative;
`;

const Center = styled.div`
  width: 100%;
  max-width: 520px;
  text-align: center;
`;

const MicButton = styled.button`
  width: 300px;
  height: 300px;
  border-radius: 50%;
  border: none;
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  transition: transform 0.15s ease, background 0.2s ease;
  background: ${({ $hearing }) => ($hearing ? "#ff4d4f" : "#0b5fff")};
  margin-bottom:250px;

  &:active {
    transform: scale(0.98);
  }
`;

const Card = styled.div`
  margin-top: 16px;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 12px;
  background: #fff;
  text-align: left;
`;

const Label = styled.span`
  opacity: 0.85;
`;

const Bold = styled.b`
  word-break: break-all;
`;

/* ---- 오른쪽 볼륨 미터 ---- */
const MeterWrap = styled.div`
  position: fixed;
  right: 12px;
  bottom: 84px; /* Footer 위로 살짝 */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  z-index: 30;
  pointer-events: none;
`;

const MeterTrack = styled.div`
  width: 12px;
  height: 150px;
  border-radius: 999px;
  background: #e8f5e9; /* 연초록 */
  overflow: hidden;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.06);
`;

const MeterFill = styled.div`
  width: 100%;
  height: 0%;
  background: #21c35e; /* 초록 */
  transition: height 60ms linear;
`;

const Dots = styled.div`
  display: flex;
  gap: 6px;
  margin-top: 4px;
`;

const Dot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $on }) => ($on ? "#21c35e" : "#a5d6a7")};
  transition: background 120ms ease;
`;
