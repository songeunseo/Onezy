document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM이 로드되었습니다.');
  
  // 요소 참조 가져오기 - 안전하게 처리
  try {
    // 메인 화면 요소
    const mainScreen = document.getElementById('main-screen');
    const startReservationBtn = document.getElementById('startReservation');
    const cancelReservationBtn = document.getElementById('cancelReservation');
    const messageElement = document.getElementById('message');
    const currentCountElement = document.querySelector('.current-count');
    const totalCountElement = document.querySelector('.total-count');
    const attendanceMessageElement = document.querySelector('.attendance-message');
    const currentMonthElement = document.querySelector('.current-month');
    const loadingElement = document.querySelector('.loading');

    // 예약 화면 요소
    const reservationScreen = document.getElementById('reservation-screen');
    const executeReservationBtn = document.getElementById('execute-reservation');
    const backFromReservationBtn = document.getElementById('back-to-main-from-reservation');
    const reservationSpaceSelect = document.getElementById('reservation-space');
    const reservationSeatSelect = document.getElementById('reservation-seat');
    const reservationDaysInput = document.getElementById('reservation-days');
    
    // 공간별 좌석 옵션 정의
    const seatOptions = {
      kbio: {
        '공유오피스 1': Array.from({ length: 10 }, (_, i) => formatSeatNumber(i + 1)),
        '공유오피스 2': Array.from({ length: 6 }, (_, i) => formatSeatNumber(i + 11)),
        '공유오피스 3': Array.from({ length: 6 }, (_, i) => formatSeatNumber(i + 17))
      },
      kinno: {
        '좌석': Array.from({ length: 12 }, (_, i) => formatSeatNumber(i + 1))
      },
      starcity: {
        '좌석': Array.from({ length: 20 }, (_, i) => formatSeatNumber(i + 1))
      },
      kustartup: {
        '좌석': Array.from({ length: 11 }, (_, i) => formatSeatNumber(i + 1))
      }
    };
    
    // 좌석 번호 포맷팅 (01, 02, ... 형식으로)
    function formatSeatNumber(num) {
      return num < 10 ? `0${num}` : `${num}`;
    }
    
    // 좌석 옵션 업데이트 함수
    function updateSeatOptions() {
      const selectedSpace = reservationSpaceSelect.value;
      
      // 기존 좌석 옵션 모두 제거
      reservationSeatSelect.innerHTML = '';
      
      // 선택된 공간에 따라 좌석 옵션 추가
      if (selectedSpace === 'kbio') {
        // K-바이오 이노베이션 허브는 공유오피스별로 그룹화
        const groups = Object.keys(seatOptions.kbio);
        
        groups.forEach(group => {
          const optgroup = document.createElement('optgroup');
          optgroup.label = group;
          
          seatOptions.kbio[group].forEach(seatNum => {
            const option = document.createElement('option');
            option.value = seatNum;
            option.textContent = `${seatNum}번`;
            optgroup.appendChild(option);
          });
          
          reservationSeatSelect.appendChild(optgroup);
        });
      } else {
        // 나머지 공간은 단일 리스트로 표시
        const seats = seatOptions[selectedSpace]['좌석'];
        seats.forEach(seatNum => {
          const option = document.createElement('option');
          option.value = seatNum;
          option.textContent = `${seatNum}번`;
          reservationSeatSelect.appendChild(option);
        });
      }
    }
    
    // 공간 선택 변경 시 좌석 옵션 업데이트
    if (reservationSpaceSelect) {
      reservationSpaceSelect.addEventListener('change', updateSeatOptions);
      
      // 초기 좌석 옵션 설정
      updateSeatOptions();
    }
    
    // 예약 URL 상수
    const BOOKING_URL = 'https://space.theoneder.land/konkuk/booking';
    const MY_PAGE_URL = 'https://space.theoneder.land/konkuk/my_page';
    
    // 화면 전환 함수
    function showScreen(screenId) {
      // 모든 화면 숨기기
      document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
      });
      
      // 선택한 화면 표시
      document.getElementById(screenId).classList.add('active');
    }
    
    // 백그라운드에서 저장된 출석 정보 가져오기
    getAttendanceData();
    
    // 백그라운드에서 출석 데이터 가져오기
    function getAttendanceData() {
      chrome.runtime.sendMessage(
        { action: 'getAttendanceData' },
        function(response) {
          console.log('출석 정보 응답:', response);
          
          // 로딩 표시 제거
          if (loadingElement) {
            loadingElement.style.display = 'none';
          }
          
          if (response && response.success && response.data) {
            updateAttendanceUI(response.data);
          } else {
            // 유효한 데이터가 없는 경우 기본값 표시
            updateAttendanceUI({
              credit: 0,
              lastUpdated: null
            });
          }
        }
      );
    }
    
    // UI 업데이트 함수
    function updateAttendanceUI(data) {
      const currentCount = data.credit || 0;
      const targetCount = 12; // 목표 출석 횟수
      
      // UI 업데이트
      if (currentCountElement) currentCountElement.textContent = currentCount;
      if (totalCountElement) totalCountElement.textContent = targetCount;
      
      // 출석 메시지 업데이트
      if (attendanceMessageElement) {
        const remainingCount = Math.max(0, targetCount - currentCount);
        if (remainingCount > 0) {
          attendanceMessageElement.textContent = `${remainingCount}일 출석이 더 필요해요`;
          attendanceMessageElement.style.color = '#0364ff';
        } else {
          attendanceMessageElement.textContent = '목표 출석 달성 완료!';
          attendanceMessageElement.style.color = '#34A853';
        }
      }
      
      // 현재 월 표시
      if (currentMonthElement) {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        currentMonthElement.textContent = `${year}년 ${month}월`;
      }

      // 마지막 업데이트 시간 표시 (있는 경우)
      if (data.lastUpdated) {
        const lastUpdate = new Date(data.lastUpdated);
        const year = lastUpdate.getFullYear();
        const month = (lastUpdate.getMonth() + 1).toString().padStart(2, '0');
        const day = lastUpdate.getDate().toString().padStart(2, '0');
        const hours = lastUpdate.getHours().toString().padStart(2, '0');
        const minutes = lastUpdate.getMinutes().toString().padStart(2, '0');
        
        // 마지막 업데이트 시간 표시
        const updateInfo = document.querySelector('.update-info');
        if (updateInfo) {
          updateInfo.textContent = ` (마지막 업데이트: ${year}.${month}.${day} ${hours}:${minutes})`;
        }
      }
    }

    // 메인 화면 버튼 이벤트
    if (startReservationBtn) {
      startReservationBtn.addEventListener('click', function() {
        console.log('예약하기 버튼 클릭');
        showScreen('reservation-screen');
      });
    }

    if (cancelReservationBtn) {
      cancelReservationBtn.addEventListener('click', function() {
        console.log('취소하기 버튼 클릭');
        // 바로 취소 작업 실행
        executeCancellation();
      });
    }

    // 예약 화면 버튼 이벤트
    if (backFromReservationBtn) {
      backFromReservationBtn.addEventListener('click', function() {
        showScreen('main-screen');
      });
    }

    if (executeReservationBtn) {
      executeReservationBtn.addEventListener('click', function() {
        // 예약 설정 가져오기
        const space = reservationSpaceSelect.value;
        const seat = reservationSeatSelect.value;
        const days = parseInt(reservationDaysInput.value, 10);
        
        console.log('예약 실행:', {space, seat, days});
        
        // 즉시 예약 실행
        executeReservation(space, seat, days);
      });
    }
    
    // 예약 실행 함수
    function executeReservation(space, seat, days) {
      // 메시지 표시
      showMessage('예약을 시작합니다. 브라우저 탭이 열립니다.');
      
      // 확장 프로그램 정보를 저장
      chrome.storage.sync.set({
        reservationSettings: {
          space: space,
          seat: seat,
          days: days,
          lastUpdated: new Date().toISOString()
        }
      }, function() {
        console.log('예약 설정 저장 완료');
      });
      
      // 예약 페이지로 이동
      navigateToPage(BOOKING_URL, '예약하기', {
        space: space,
        seat: seat,
        days: days
      });
      
      // 메인 화면으로 돌아가기
      showScreen('main-screen');
    }
    
    // 취소 실행 함수
    function executeCancellation() {
      // 메시지 표시
      showMessage('예약 취소를 시작합니다. 브라우저 탭이 열립니다.');
      
      // 마이페이지로 이동
      navigateToPage(MY_PAGE_URL, '취소하기');
    }
    
    // 페이지 이동 함수
    function navigateToPage(url, action, options = {}) {
      // 현재 활성화된 탭에서 페이지 이동
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentTab = tabs[0];
        
        // 현재 탭이 이미 해당 페이지인지 확인
        if (currentTab.url.includes(url)) {
          // 이미 해당 페이지에 있으면 스크립트 실행
          if (url.includes('booking')) {
            chrome.tabs.sendMessage(currentTab.id, { 
              action: 'startReservation',
              options: options
            }, function(response) { 
              console.log('예약 시작 응답:', response); 
            });
          } else if (url.includes('my_page')) {
            chrome.tabs.sendMessage(currentTab.id, { 
              action: 'cancelReservation'
            }, function(response) { 
              console.log('취소 시작 응답:', response); 
            });
          }
        } else {
          // 다른 페이지에 있으면 해당 페이지로 이동
          chrome.tabs.update(currentTab.id, { url: url }, function() {
            // 페이지 로드 완료 후 스크립트 실행
            chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo, tab) {
              if (tabId === currentTab.id && changeInfo.status === 'complete' && tab.url.includes(url)) {
                // 리스너 제거
                chrome.tabs.onUpdated.removeListener(listener);
                
                // 페이지 로드 완료 후 스크립트 실행
                setTimeout(() => {
                  if (url.includes('booking')) {
                    chrome.tabs.sendMessage(tabId, { 
                      action: 'startReservation',
                      options: options 
                    }, function(response) { 
                      console.log('예약 응답:', response); 
                    });
                  } else if (url.includes('my_page')) {
                    chrome.tabs.sendMessage(tabId, { 
                      action: 'cancelReservation'
                    }, function(response) { 
                      console.log('취소 응답:', response); 
                    });
                  }
                }, 2000);
              }
            });
          });
        }
      });
    }

    // 메시지 표시 함수
    function showMessage(message) {
      if (!messageElement) return;
      
      messageElement.textContent = message;
      messageElement.style.display = 'block';
      
      // 메시지 10초 후 자동 숨김
      setTimeout(() => {
        messageElement.textContent = '';
        messageElement.style.display = 'none';
      }, 10000);
    }
  } catch (error) {
    console.error('팝업 초기화 중 오류 발생:', error);
  }
}); 