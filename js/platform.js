// ════════════════════════════════════════════════════════════
//  PLATFORM BRIDGE — AdMob / RevenueCat / Firebase
//  Capacitor 환경(앱)이면 네이티브 SDK 호출, 웹이면 fallback
// ════════════════════════════════════════════════════════════
'use strict';

// ── 환경 감지 ──
const IS_CAPACITOR = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
const PLATFORM = IS_CAPACITOR ? window.Capacitor.getPlatform() : 'web';

// ──────────────────────────────────────────────────────────
//  AdMob — 리워드 광고
// ──────────────────────────────────────────────────────────
//  TODO 출시 전: AdMob 콘솔에서 발급받은 실제 광고 단위 ID로 교체
//  https://apps.admob.com/  →  앱 생성 → 광고 단위 추가 (보상형)
// ──────────────────────────────────────────────────────────
const AD_UNIT_IDS = {
  android: {
    buff:  'ca-app-pub-3120008175393164/7042160882',
    gem:   'ca-app-pub-3120008175393164/1352822727',
    money: 'ca-app-pub-3120008175393164/2857476081',
  },
  ios: {
    buff:  'ca-app-pub-3940256099942544/1712485313',
    gem:   'ca-app-pub-3940256099942544/1712485313',
    money: 'ca-app-pub-3940256099942544/1712485313',
  },
};

let admobReady = false;

async function initAdMob(){
  if (!IS_CAPACITOR) return;
  try {
    const { AdMob } = window.Capacitor.Plugins;
    if (!AdMob){ console.warn('[AdMob] plugin not found'); return; }
    await AdMob.initialize({
      testingDevices: [],
      initializeForTesting: false,
    });
    admobReady = true;
    console.log('[AdMob] initialized');
  } catch(e){
    console.error('[AdMob] init failed:', e);
  }
}

// 리워드 광고 표시 — 보상 수령 성공 시 true 반환
async function showRewardedAd(rewardId){
  if (!IS_CAPACITOR || !admobReady){
    // 웹 환경: 기존 5초 fake 광고 (개발/테스트용)
    return await fakeWebAd();
  }
  try {
    const { AdMob } = window.Capacitor.Plugins;
    const adId = AD_UNIT_IDS[PLATFORM]?.[rewardId] || AD_UNIT_IDS.android[rewardId];
    await AdMob.prepareRewardVideoAd({ adId, isTesting: false });
    const result = await AdMob.showRewardVideoAd();
    return !!result;
  } catch(e){
    console.error('[AdMob] showRewardedAd failed:', e);
    if (typeof notice === 'function') notice('광고를 불러올 수 없습니다');
    return false;
  }
}

// 웹용 가짜 광고 — 5초 카운트다운 후 보상
function fakeWebAd(){
  return new Promise(resolve=>{
    const claim = document.getElementById('ad-claim');
    const cnt   = document.getElementById('ad-count');
    const stxt  = document.getElementById('ad-stxt');
    claim.disabled = true;
    stxt.textContent = '광고 시청 중...';
    cnt.style.display = '';
    let n = 5; cnt.textContent = n+'초';
    const t = setInterval(()=>{
      n--;
      if (n>0){ cnt.textContent = n+'초'; return; }
      clearInterval(t);
      cnt.style.display = 'none';
      stxt.textContent = '시청 완료! 보상을 받으세요';
      claim.disabled = false;
      // 보상 수령 버튼이 눌릴 때까지 대기 — game.js의 claimAdReward 가 처리
      resolve(true);
    }, 1000);
  });
}

// ──────────────────────────────────────────────────────────
//  RevenueCat — 인앱 결제 (IAP)
// ──────────────────────────────────────────────────────────
//  TODO 출시 전: RevenueCat 콘솔에서 발급받은 API 키와 상품 ID 등록
//  https://app.revenuecat.com/  →  프로젝트 → API Keys
// ──────────────────────────────────────────────────────────
const REVENUECAT_API_KEY = {
  android: 'goog_XXXXXXXXXXXXXXXXXXXXXXXXX',   // TODO: 실제 키
  ios:     'appl_XXXXXXXXXXXXXXXXXXXXXXXXX',   // TODO: 실제 키
};

// 상품 ID — RevenueCat 콘솔 + 스토어(Play Console / App Store Connect) 양쪽 등록 필요
const IAP_PRODUCTS = {
  auto_restock: 'autostock_permanent',   // Non-Consumable, 일회성 영구
};

let iapReady = false;

async function initIAP(){
  if (!IS_CAPACITOR) return;
  try {
    const { Purchases } = window.Capacitor.Plugins;
    if (!Purchases){ console.warn('[IAP] RevenueCat plugin not found'); return; }
    const apiKey = REVENUECAT_API_KEY[PLATFORM];
    await Purchases.configure({ apiKey });
    iapReady = true;
    console.log('[IAP] RevenueCat initialized');
  } catch(e){
    console.error('[IAP] init failed:', e);
  }
}

// 결제 실행 — 성공 시 true, 사용자 취소/실패는 false
async function purchaseProduct(upgradeId){
  const productId = IAP_PRODUCTS[upgradeId];
  if (!productId){
    console.error('[IAP] unknown upgradeId:', upgradeId);
    return false;
  }

  if (!IS_CAPACITOR){
    // 웹 환경: 테스트 활성화 폴백 (개발 편의)
    const ok = confirm('[웹 테스트 모드]\n실제 결제 없이 활성화하시겠습니까?\n(앱 빌드 시 실제 결제로 동작합니다)');
    return ok;
  }

  if (!iapReady){
    if (typeof notice === 'function') notice('결제 시스템 준비 중...');
    return false;
  }

  try {
    const { Purchases } = window.Capacitor.Plugins;
    const offerings = await Purchases.getOfferings();
    const allPackages = offerings.current?.availablePackages || [];
    const pkg = allPackages.find(p => p.product?.identifier === productId);
    if (!pkg){
      if (typeof notice === 'function') notice('상품을 불러올 수 없습니다');
      return false;
    }
    const result = await Purchases.purchasePackage({ aPackage: pkg });
    // entitlements 확인
    const ent = result?.customerInfo?.entitlements?.active || {};
    return Object.keys(ent).length > 0 || !!result?.transaction;
  } catch(e){
    if (e?.userCancelled || e?.code === 'PURCHASE_CANCELLED') {
      if (typeof notice === 'function') notice('결제를 취소했습니다');
    } else {
      console.error('[IAP] purchase failed:', e);
      if (typeof notice === 'function') notice('결제 오류: ' + (e?.message || '알 수 없는 오류'));
    }
    return false;
  }
}

// 복원 — 기기 변경/재설치 후 기존 구매 내역 복구
async function restorePurchases(){
  if (!IS_CAPACITOR || !iapReady) return null;
  try {
    const { Purchases } = window.Capacitor.Plugins;
    const info = await Purchases.restorePurchases();
    return info?.customerInfo?.entitlements?.active || {};
  } catch(e){
    console.error('[IAP] restore failed:', e);
    return null;
  }
}

// ──────────────────────────────────────────────────────────
//  Firebase — 클라우드 세이브 (Firestore)
// ──────────────────────────────────────────────────────────
//  TODO 출시 전: Firebase 콘솔에서 프로젝트 생성 후 config 교체
//  https://console.firebase.google.com/  →  프로젝트 추가 → 웹 앱
// ──────────────────────────────────────────────────────────
const FIREBASE_CONFIG = {
  apiKey: 'AIzaSy_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  authDomain: 'monstercardshop.firebaseapp.com',
  projectId: 'monstercardshop',
  storageBucket: 'monstercardshop.appspot.com',
  messagingSenderId: 'XXXXXXXXXXXX',
  appId: '1:XXXXXXXXXXXX:web:XXXXXXXXXXXXXXXXXXXXXX',
};

let fbApp = null, fbDB = null, fbAuth = null, fbUser = null;
let fbReady = false;
let lastCloudSync = 0;

async function initFirebase(){
  // Firebase 사용하려면 RELEASE_CHECKLIST.md 참조해서 config 등록 후
  // 이 함수의 가드를 풀어주세요. 현재는 placeholder 라서 비활성.
  if (FIREBASE_CONFIG.apiKey.indexOf('XXXX') >= 0){
    console.log('[Firebase] config not set, cloud save disabled');
    return;
  }
  try {
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
    const { getFirestore, doc, setDoc, getDoc } =
      await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    const { getAuth, signInAnonymously, onAuthStateChanged } =
      await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');

    fbApp  = initializeApp(FIREBASE_CONFIG);
    fbDB   = getFirestore(fbApp);
    fbAuth = getAuth(fbApp);

    window._fbHelpers = { doc, setDoc, getDoc };

    onAuthStateChanged(fbAuth, user=>{
      fbUser = user;
      fbReady = !!user;
      if (user){
        console.log('[Firebase] signed in:', user.uid);
        // 첫 로그인 시 클라우드에서 세이브 복원 시도
        cloudLoad();
      }
    });
    await signInAnonymously(fbAuth);
  } catch(e){
    console.error('[Firebase] init failed:', e);
  }
}

// 클라우드에 저장 — game.js의 saveGame()에서 호출
async function cloudSave(saveDataJson){
  if (!fbReady || !fbUser || !fbDB) return;
  // 너무 잦은 쓰기 방지 — 최소 10초 간격
  const now = Date.now();
  if (now - lastCloudSync < 10000) return;
  lastCloudSync = now;
  try {
    const { doc, setDoc } = window._fbHelpers;
    await setDoc(doc(fbDB, 'saves', fbUser.uid), {
      data: saveDataJson,
      updatedAt: now,
    });
  } catch(e){
    console.error('[Firebase] cloudSave failed:', e);
  }
}

// 클라우드에서 로드 — 로컬보다 클라우드가 더 최신이면 사용
async function cloudLoad(){
  if (!fbReady || !fbUser || !fbDB) return;
  try {
    const { doc, getDoc } = window._fbHelpers;
    const snap = await getDoc(doc(fbDB, 'saves', fbUser.uid));
    if (!snap.exists()) return;
    const remote = snap.data();
    const localRaw = localStorage.getItem('monsterCardShop_v1');
    const local = localRaw ? JSON.parse(localRaw) : null;
    const localTime  = local?.savedAt || 0;
    const remoteTime = remote?.updatedAt || 0;
    if (remoteTime > localTime + 60000){   // 클라우드가 1분 이상 최신이면
      if (confirm('☁ 클라우드에 더 최신 세이브가 있어요. 불러올까요?')){
        localStorage.setItem('monsterCardShop_v1', remote.data);
        location.reload();
      }
    }
  } catch(e){
    console.error('[Firebase] cloudLoad failed:', e);
  }
}

// ──────────────────────────────────────────────────────────
//  공개 API — game.js 에서 사용
// ──────────────────────────────────────────────────────────
window.Platform = {
  IS_CAPACITOR,
  PLATFORM,
  initAdMob,
  showRewardedAd,
  initIAP,
  purchaseProduct,
  restorePurchases,
  initFirebase,
  cloudSave,
  cloudLoad,
};

// ──────────────────────────────────────────────────────────
//  자동 초기화 — DOMContentLoaded 시 한번에 부팅
// ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async ()=>{
  if (IS_CAPACITOR){
    try {
      const { SplashScreen, StatusBar } = window.Capacitor.Plugins;
      if (StatusBar) await StatusBar.setBackgroundColor({ color: '#17101f' });
      // 게임 로드 완료 후 스플래시 hide
      setTimeout(()=>{ if (SplashScreen) SplashScreen.hide(); }, 1500);
    } catch(e){}
  }
  initAdMob();
  initIAP();
  initFirebase();
});
