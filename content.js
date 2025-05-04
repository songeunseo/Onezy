// 페이지 로드 시 확인
console.log('Onezy 확장 프로그램 로드됨');
console.log('페이지 정보: ' + document.title + ' (' + location.href + ')');

// 로그인 상태에서 출석 정보 가져오기
fetchAttendanceData();

// 페이지 로드 시 자동 감지 및 실행
if (window.location.href.includes('theoneder.land/konkuk/booking')) {
  console.log('예약 페이지 감지됨, 3초 후 자동 실행...');
  setTimeout(() => {
    executeReservationCode();
  }, 3000);
} else if (window.location.href.includes('theoneder.land/konkuk/my_page')) {
  console.log('마이 페이지 감지됨, 3초 후 자동 실행...');
  setTimeout(() => {
    executeCancelationCode();
  }, 3000);
}

// API에서 출석 데이터 가져오는 함수
function fetchAttendanceData() {
  fetch('https://space-back-customer.theoneder.land/customer/api/konkuk/companies/144', {
    method: 'GET',
    credentials: 'include' // 중요! - 쿠키 포함
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`API 오류: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('출석 데이터 가져오기 성공:', data);
    
    // 데이터가 있고 credit 필드가 있으면 백그라운드로 전송
    if (data && typeof data.credit !== 'undefined') {
      chrome.runtime.sendMessage({
        action: 'updateAttendance',
        data: {
          credit: data.credit,
          companyInfo: data
        }
      });
    }
  })
  .catch(error => {
    console.error('출석 데이터 가져오기 실패:', error);
  });
}

// 확장 프로그램에서 메시지 수신
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('메시지 수신:', request.action, '현재 URL:', window.location.href);
  
  if (request.action === 'startReservation') {
    // 예약 페이지 확인
    if (window.location.href.includes('theoneder.land/konkuk/booking')) {
      console.log('예약 페이지 확인 성공');
      // 옵션이 있는 경우 전달
      executeReservationCode(request.options);
      sendResponse({success: true});
    } else {
      console.error('예약 페이지가 아닙니다.');
      sendResponse({success: false, error: '예약 페이지가 아닙니다'});
    }
    return true;
  }
  else if (request.action === 'cancelReservation') {
    // 마이페이지 확인
    if (window.location.href.includes('theoneder.land/konkuk/my_page')) {
      console.log('마이페이지 확인 성공');
      executeCancelationCode();
      sendResponse({success: true});
    } else {
      console.error('마이페이지가 아닙니다.');
      sendResponse({success: false, error: '마이페이지가 아닙니다'});
    }
    return true;
  }
});

/**
 * 예약 코드를 직접 실행하는 함수
 * @param {Object} options 선택적 예약 옵션 (space, seat, days)
 */
function executeReservationCode(options = {}) {
  console.log('예약 자동화 실행 시작', options);
  
  // 기본 옵션 설정
  const space = options.space || 'kbio';
  const seat = options.seat || '01';
  const maxDays = options.days || 30;
  
  console.log(`예약 설정: ${space} 공간, ${seat}번 좌석, ${maxDays}일 예약`);
  
  (async function() {
    try {
      // 먼저 오픈데스크 선택
      console.log('오픈데스크 선택 중...');
      const categoryButtons = [...document.querySelectorAll('.css-drwmck')];
      const openDeskButton = categoryButtons.find(el => el.innerText.includes('오픈데스크'));
      
      if (!openDeskButton) {
        console.error('오픈데스크 버튼을 찾을 수 없습니다. 사용 가능한 카테고리:', 
          categoryButtons.map(el => el.innerText).join(', '));
        throw new Error('오픈데스크 버튼을 찾을 수 없습니다');
      }
      
      openDeskButton.click();
      await new Promise(r => setTimeout(r, 1500));
      
      // 그 다음 공간 유형 선택 (추가 선택 UI가 나타나면)
      let targetSpace;
      switch(space) {
        case 'kbio':
          targetSpace = '바이오'; // K-바이오 이노베이션 허브
          break;
        case 'kinno':
          targetSpace = '이노베이션'; // K-이노베이션 스테이션 센터
          break;
        case 'starcity':
          targetSpace = '스타시티'; // 스타시티
          break;
        case 'kustartup':
          targetSpace = '스타트업'; // KU 스타트업존
          break;
        default:
          targetSpace = null; // 추가 선택 없이 기본 오픈데스크 사용
      }
      
      // 공간 유형 선택이 필요한 경우
      if (targetSpace) {
        console.log(`세부 공간 선택: ${targetSpace}`);
        // 이제 UI에 따라 올바른 선택자 찾기
        // 여기서는 세부 공간 선택 버튼이 다른 클래스를 가질 수 있으므로 다양한 선택자 시도
        
        // css-iep0ng 클래스를 가진 모든 요소를 찾음
        const spaceElements = [...document.querySelectorAll('.css-iep0ng')];
        console.log('찾은 세부 공간 요소 수:', spaceElements.length);
        
        // 텍스트가 타겟 공간을 포함하는 요소 찾기
        const spaceElement = spaceElements.find(el => el.innerText && el.innerText.includes(targetSpace));
        
        if (spaceElement) {
          console.log(`${targetSpace} 공간 요소 찾음:`, spaceElement.innerText);
          spaceElement.click();
          await new Promise(r => setTimeout(r, 1000));
        } else {
          console.warn(`${targetSpace} 세부 공간 요소를 찾지 못했습니다. 기본 공간으로 진행합니다.`);
          console.log('사용 가능한 공간들:', spaceElements.map(el => el.innerText).join(', '));
        }
      }

      let totalReserved = 0;
      let hasNextWeek = true;

      const clickFirstReserveButton = () => {
        const btn = [...document.querySelectorAll('.css-1qgpbqj')].find(el => el.innerText.includes('예약하기') && el.hasAttribute('style'));
        if (btn) btn.click();
      };

      const clickModalReserveButton = () => {
        const btn = [...document.querySelectorAll('.css-1qgpbqj')].find(el => el.innerText.includes('예약하기') && !el.hasAttribute('style'));
        if (btn) btn.click();
      };

      while (totalReserved < maxDays && hasNextWeek) {
        const dateList = document.querySelectorAll('.css-1xxat2s');
        const dateCount = dateList.length;

        for (let i = 0; i < dateCount && totalReserved < maxDays; i++) {
          dateList[i].click();
          await new Promise(r => setTimeout(r, 500));

          // 선택된 좌석번호 찾기
          const seatElements = [...document.querySelectorAll('.css-iep0ng')];
          console.log('찾은 좌석 요소 수:', seatElements.length);
          
          const seatElement = seatElements.find(el => el.innerText.includes(seat));
          if (seatElement) {
            console.log(`좌석 ${seat} 선택`);
            seatElement.click();
            await new Promise(r => setTimeout(r, 500));

            const timeList = document.querySelectorAll('.css-zxgq7j');

            if (timeList.length > 23) {
              timeList[0].click();
              await new Promise(r => setTimeout(r, 300));
              timeList[23].click();
              await new Promise(r => setTimeout(r, 300));

              clickFirstReserveButton();
              await new Promise(r => setTimeout(r, 1000));

              clickModalReserveButton();
              await new Promise(r => setTimeout(r, 1500));

              totalReserved++;
              console.log(`✅ ${dateList[i].innerText} 예약 완료 (${totalReserved}일차)`);
            } else {
              console.warn(`⚠️ 시간 슬롯 부족 (일차 ${totalReserved + 1})`);
            }
          } else {
            console.warn(`좌석 ${seat}번을 찾을 수 없습니다`);
            console.log('사용 가능한 좌석:', seatElements.map(el => el.innerText).join(', '));
          }
        }

        const nextWeekBtn = [...document.querySelectorAll('.css-q6omqm')]
          .reverse()
          .find(el => el.getAttribute('cursor') === 'pointer');
        if (nextWeekBtn) {
          nextWeekBtn.click();
          await new Promise(r => setTimeout(r, 1000));
        } else {
          console.warn('다음 주 버튼 못 찾음 → 종료');
          hasNextWeek = false;
        }
      }

      console.log('🎉 예약 작업 종료! 총 예약 수: ' + totalReserved);
      
      // 성공 메시지 전송
      chrome.runtime.sendMessage({
        action: 'reservationComplete',
        success: true,
        message: `총 ${totalReserved}일 예약 완료!`
      });
    } catch (error) {
      console.error('예약 과정에서 오류 발생:', error);
      
      // 오류 메시지 전송
      chrome.runtime.sendMessage({
        action: 'reservationComplete',
        success: false,
        message: `오류 발생: ${error.message}`
      });
    }
  })();
}

/**
 * 취소 코드를 직접 실행하는 함수
 */
function executeCancelationCode() {
  console.log('취소 자동화 실행 시작');
  
  (async function() {
    try {
      document.querySelector('.css-1wz9uh1')?.click();
      await new Promise(r => setTimeout(r, 1000));
    
      let cancelCount = 0;
      let cancelBtn;
      
      console.log('취소 버튼 찾는 중...');
      while ((cancelBtn = document.querySelector('.css-nduxxm'))) {
        console.log('취소 버튼 클릭');
        cancelBtn.click();
        await new Promise(r => setTimeout(r, 500));
    
        console.log('확인 버튼 찾는 중...');
        const confirmBtn = document.querySelector('.css-17ygmk0');
        if (confirmBtn) {
          console.log('확인 버튼 클릭');
          confirmBtn.click();
          await new Promise(r => setTimeout(r, 500));
        }
    
        console.log('최종 확인 버튼 찾는 중...');
        const finalBtn = document.querySelector('.css-rrf86r');
        if (finalBtn) {
          console.log('최종 확인 버튼 클릭');
          finalBtn.click();
          await new Promise(r => setTimeout(r, 500));
        }
    
        cancelCount++;
        console.log('✅ 취소 하나 완료 (' + cancelCount + '개)');
        await new Promise(r => setTimeout(r, 1000));
      }
    
      console.log('🎉 전체 예약 취소 완료! 총 ' + cancelCount + '개 취소됨');
      
      // 성공 메시지 전송
      chrome.runtime.sendMessage({
        action: 'reservationComplete',
        success: true,
        message: `총 ${cancelCount}개 예약 취소 완료!`
      });
    } catch (error) {
      console.error('취소 과정에서 오류 발생:', error);
      
      // 오류 메시지 전송
      chrome.runtime.sendMessage({
        action: 'reservationComplete',
        success: false,
        message: `오류 발생: ${error.message}`
      });
    }
  })();
}
