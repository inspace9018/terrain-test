// 시험 설정. 시작 전 고정하고 시험 중에는 바꾸지 않는다.
window.TERRAIN_TEST = {
  testId: 'terrain-price-2026-10',
  // 시험 시작·종료일은 대표 결정 전이라 비워 둔다. 값이 있으면 기간 밖 방문은 기록하지 않는다.
  startAt: '',   // 예: '2026-11-03T00:00:00+09:00'
  endAt: '',     // 예: '2026-11-17T00:00:00+09:00'
  variants: { A: 99000, B: 79000 },
  // 수집 서버 주소. 비워 두면 이 브라우저 localStorage에만 기록되고 운영자에게 전달되지 않는다.
  // 호스팅·수집 도구가 정해지면 대표 승인 후 채운다.
  endpoint: '',
  // 구글 폼 연결. action은 폼 미리보기 주소의 /viewform을 /formResponse로 바꾼 주소, entries는 항목별 entry.숫자.
  // 설정 방법은 구글폼_설정안.md. 비워 두면 전송하지 않는다.
  signupForm: { action: 'https://docs.google.com/forms/d/e/1FAIpQLSftgfIIDup8xOklkMh9-m3CK-kss6yadvqSRsYa3FsgJU7qIA/formResponse', entries: { email: 'entry.1904911905', name: 'entry.1810554774', mountain: 'entry.897202580', variant: 'entry.814175522', price: 'entry.2109856230', intent: 'entry.1771884264', channel: 'entry.906824033', vid: 'entry.675332606', marketing: 'entry.1392542546' } },
  eventForm:  { action: 'https://docs.google.com/forms/d/e/1FAIpQLSfpOccPaqu-W4EVX-L2HPhNCljDJv3i8mNhEon3fAiDSf5sZA/formResponse', entries: { event: 'entry.1552777282', variant: 'entry.261377218', price: 'entry.1068740664', channel: 'entry.1632524148', vid: 'entry.1929676720', flags: 'entry.818086726', t: 'entry.117099233' } }
};
