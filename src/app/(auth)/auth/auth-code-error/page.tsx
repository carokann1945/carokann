export default function AuthCodeErrorPage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>로그인에 실패했습니다</h1>
      <p>다시 로그인해 주세요. (redirect URL/Google 설정을 확인하세요)</p>
      <a href="/login">재시도</a>
    </main>
  );
}
