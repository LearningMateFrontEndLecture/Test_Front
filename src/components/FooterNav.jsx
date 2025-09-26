import { useNavigate, useLocation } from "react-router-dom";

export default function FooterNav() {
  const nav = useNavigate();
  const { pathname } = useLocation();

  const Item = ({ to, label }) => (
    <button
      onClick={() => nav(to)}
      className={`tab ${pathname === to ? "active" : ""}`}
      aria-current={pathname === to ? "page" : undefined}
    >
      {label}
    </button>
  );

  return (
    <footer className="footer">
      <Item to="/" label="메인" />
      <Item to="/hospitals" label="병원" />
      <Item to="/camera" label="카메라" />
    </footer>
  );
}
