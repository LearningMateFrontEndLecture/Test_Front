import styled from "styled-components";

function GearIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor"
        d="M19.14,12.94a7.43,7.43,0,0,0,.05-.94,7.43,7.43,0,0,0-.05-.94l2-1.57a.5.5,0,0,0,.12-.64l-1.9-3.29a.5.5,0,0,0-.6-.22l-2.35,1a7.28,7.28,0,0,0-1.63-.94l-.35-2.5A.5.5,0,0,0,14,2H10a.5.5,0,0,0-.5.43L9.14,4.93a7.28,7.28,0,0,0-1.63.94l-2.35-1a.5.5,0,0,0-.6.22L2.66,8.38a.5.5,0,0,0,.12.64l2,1.57a7.43,7.43,0,0,0,0,1.88l-2,1.57a.5.5,0,0,0-.12.64l1.9,3.29a.5.5,0,0,0,.6.22l2.35-1a7.28,7.28,0,0,0,1.63.94l.35,2.5A.5.5,0,0,0,10,22h4a.5.5,0,0,0,.5-.43l.35-2.5a7.28,7.28,0,0,0,1.63-.94l2.35,1a.5.5,0,0,0,.6-.22l1.9-3.29a.5.5,0,0,0-.12-.64ZM12,15.5A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z"/>
    </svg>
  );
}

function Header() {
  return (
    <HeaderWrap>
      <Logo>
        <LogoIcon src="../../public/assets/Logo2.png" />
      </Logo>
      <IconButton aria-label="설정">
        <GearIcon />
      </IconButton>
    </HeaderWrap>
  );
}

export default Header;


const HeaderWrap = styled.header`
  width: 100%;
  height: 64px;
  background: #2879BD;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
`;

const LogoIcon = styled.img`
  width: 60px;
  height: 60px;
  margin-top:6px;
`;

const Logo = styled.div`

`
const IconButton = styled.button`
  background: none;
  border: none;
  padding: 6px;
  border-radius: 8px;
  cursor: pointer;
  color: white;

  &:hover { background: #f5f7ff; }
`;

