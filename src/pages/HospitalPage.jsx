// src/pages/HospitalPage.jsx
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { loadKakaoSDK } from "../lib/kakaoLoader";

export default function HospitalPage() {
  const mapElRef = useRef(null);
  const mapObjRef = useRef(null);
  const [err, setErr] = useState(null);
  const [pos, setPos] = useState(null); // {lat, lng}

  // 1) SDK 로드 + 현재 위치 획득 (상태만 세팅)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const key = "cfd7264f6f0677bc208104d9cbc45701";
        if (!key) throw new Error("VITE_KAKAO_API_KEY missing");
        await loadKakaoSDK(key);
        if (cancelled) return;

        navigator.geolocation.getCurrentPosition(
          (p) => {
            if (cancelled) return;
            setPos({ lat: p.coords.latitude, lng: p.coords.longitude });
          },
          () => {
            if (cancelled) return;
            // 권한 거부/실패 시 서울 시청으로 fallback
            setPos({ lat: 37.5665, lng: 126.9780 });
          }
        );
      } catch (e) {
        if (!cancelled) setErr(e);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // 2) pos가 준비된 뒤, 다음 프레임에 맵 생성 (컨테이너가 렌더 완료된 시점 보장)
  useLayoutEffect(() => {
    if (!pos) return;

    let cancelled = false;
    const el = mapElRef.current;

    // 컨테이너가 눈에 보이고 크기가 있는지 확인
    const isReady = () =>
      el && el.offsetWidth > 0 && el.offsetHeight > 0 &&
      getComputedStyle(el).display !== "none" &&
      getComputedStyle(el).visibility !== "hidden";

    const createMap = () => {
      if (cancelled) return;
      const center = new window.kakao.maps.LatLng(pos.lat, pos.lng);
      const map = new window.kakao.maps.Map(el, { center, level: 4 });
      mapObjRef.current = map;
      new window.kakao.maps.Marker({ map, position: center });
      // 레이아웃 한 번 더 보정
      requestAnimationFrame(() => {
        map.relayout();
        map.setCenter(center);
      });
      // 리사이즈 대응
      const onResize = () => {
        map.relayout();
        map.setCenter(center);
      };
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    };

    // DOM/레이아웃이 완전히 잡힐 때까지 rAF로 기다렸다가 생성
    const waitThenCreate = () => {
      if (isReady()) {
        cleanup = createMap();
      } else {
        // 부모가 transition 중이거나 탭 전환 등으로 display:none이었다면
        rafId = requestAnimationFrame(waitThenCreate);
      }
    };

    let rafId = requestAnimationFrame(waitThenCreate);
    let cleanup;
    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      if (cleanup) cleanup();
    };
  }, [pos]);

  if (err) return <div style={{ padding: 12, color: "crimson" }}>{String(err)}</div>;
  if (!pos) return <div style={{ padding: 12 }}>내 위치를 불러오는 중…</div>;

  return (
    <div style={{ padding: 12 }}>
      <div
        ref={mapElRef}
        style={{
          width: "100%",
          height: "60vh",              // ← 고정 높이 필수
          border: "2px solid #0b5fff", // 컨테이너 보이는지 시각 확인용
          borderRadius: 12,
          background: "#f9fbff",
          position: "relative",
        }}
      />
    </div>
  );
}
