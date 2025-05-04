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
    // 예약 완료 알림 표시
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'images/Onezy.png',
      title: request.success ? '예약 완료' : '예약 오류',
      message: request.message
    }, function() {
      console.log('알림 표시 완료');
      sendResponse({success: true});
    });
    
    return true; // 비동기 응답을 위해 true 반환
  }
  else if (request.action === 'updateAttendance') {
    // 출석 정보 업데이트
    console.log('출석 정보 업데이트:', request.data);
    
    if (request.data && typeof request.data.credit !== 'undefined') {
      // 데이터 업데이트
      attendanceData = {
        credit: request.data.credit,
        lastUpdated: new Date().toISOString(),
        rawData: request.data.companyInfo || null
      };
      
      // storage에 저장
      chrome.storage.sync.set({ attendanceData: attendanceData }, function() {
        console.log('출석 정보가 저장되었습니다:', attendanceData);
      });
      
      sendResponse({success: true});
    } else {
      sendResponse({success: false, error: '유효하지 않은 출석 데이터'});
    }
    
    return true;
  }
  else if (request.action === 'getAttendanceData') {
    // 출석 정보 요청 처리
    console.log('출석 정보 요청 처리');
    
    // 저장된 데이터 가져오기
    chrome.storage.sync.get('attendanceData', function(data) {
      if (data && data.attendanceData) {
        sendResponse({
          success: true, 
          data: data.attendanceData
        });
      } else {
        sendResponse({
          success: false, 
          data: attendanceData,
          error: '저장된 출석 정보가 없습니다'
        });
      }
    });
    
    return true;
  }
  
  // 다른 메시지 타입은 여기서 처리
  
  // 기본적으로 응답 전송
  sendResponse({success: false, error: '처리되지 않은 메시지 타입'});
  return true;
}); 