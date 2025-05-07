// 출석 정보 저장을 위한 기본값
let attendanceData = {
  credit: 0,
  lastUpdated: null,
  rawData: null
};

// 확장 프로그램이 설치될 때 초기화 작업
chrome.runtime.onInstalled.addListener(function() {
  console.log('사무실 자동 예약 확장 프로그램이 설치되었습니다.');
  
  // 기본 설정 초기화
  chrome.storage.sync.set({
    reservationUrl: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    attendanceData: attendanceData
  }, function() {
    console.log('기본 설정이 초기화되었습니다.');
  });
});

// content 스크립트에서 메시지 수신
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('백그라운드 스크립트에서 메시지 수신:', request.action);
  
  if (request.action === 'reservationComplete') {
    // 알림 대신 콘솔에 메시지 출력
    console.log(request.success ? '예약 완료: ' : '예약 오류: ', request.message);
    sendResponse({success: true});
  }
  else if (request.action === 'updateAttendance') {
    console.log('출석 데이터 업데이트:', request.data);
    attendanceData = request.data;
    // storage에도 저장
    chrome.storage.sync.set({ attendanceData: attendanceData }, function() {
      console.log('출석 데이터가 저장되었습니다:', attendanceData);
    });
    sendResponse({ success: true });
  }
  else if (request.action === 'getAttendanceData') {
    console.log('출석 데이터 요청 처리 시작');
    console.log('현재 저장된 출석 데이터:', attendanceData);
    
    // storage에서 최신 데이터 확인
    chrome.storage.sync.get('attendanceData', function(data) {
      console.log('storage에서 가져온 데이터:', data);
      
      // storage에 데이터가 있으면 그것을 사용
      if (data && data.attendanceData) {
        console.log('storage 데이터로 업데이트:', data.attendanceData);
        attendanceData = data.attendanceData;
      }
      
      console.log('최종 전송할 데이터:', attendanceData);
      // storage에서 가져온 데이터를 직접 전송
      sendResponse({
        success: true,
        data: data.attendanceData || attendanceData
      });
    });
    
    return true; // 비동기 응답을 위해 true 반환
  }
  else {
    // 처리되지 않은 메시지 타입에 대해서만 기본 응답
    sendResponse({success: false, error: '처리되지 않은 메시지 타입'});
  }
}); 