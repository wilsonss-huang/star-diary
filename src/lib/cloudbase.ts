import cloudbase from '@cloudbase/js-sdk';
import type { DiaryEntry, Emotion } from '../types';

const ENV = 'star-diary-d0gt774ca5a0cbd1d';

const app = cloudbase.init({
  env: ENV,
});
const auth = app.auth({ persistence: 'local' });
const db = app.database();
console.log('[CloudBase] 初始化成功, env:', ENV);

// ============================================================
// 手机验证码登录（首次自动注册，跨设备同步）
// ============================================================

/**
 * 第一步：发送验证码到手机
 * 返回 verifyOtp 函数供第二步调用
 */
export async function sendPhoneCode(phoneNumber: string): Promise<{
  verifyOtp: (code: string) => Promise<{ uid: string }>;
}> {
  console.log('[CloudBase] 发送验证码到:', phoneNumber);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (auth as any).signInWithOtp({ phone: phoneNumber });
  if (error) {
    throw new Error(error.message || '发送验证码失败，请稍后重试');
  }
  return {
    verifyOtp: async (code: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: loginData, error: loginError } = await (data as any).verifyOtp({ token: code });
      if (loginError) {
        throw new Error(loginError.message || '验证码错误');
      }
      // 优先用 loginData 里的 uid，其次用 auth.currentUser
      const uid = loginData?.user?.id || (auth as any).currentUser?.uid;
      console.log('[CloudBase] 登录成功, uid:', uid);
      if (!uid) throw new Error('登录失败：未能获取用户信息');
      return { uid };
    },
  };
}

// ---- 用户信息缓存（localStorage 兜底，防止 auth.currentUser 延迟） ----

const CACHED_USER_KEY = 'star-diary-user';

function getCachedUid(): string | null {
  try {
    const raw = localStorage.getItem(CACHED_USER_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw);
    return user?.uid || null;
  } catch {
    return null;
  }
}

export function getCurrentUser(): { uid: string; phone: string } | null {
  // 先尝试 CloudBase 持久化的登录态
  const user = auth.currentUser;
  if (user && user.uid) {
    return { uid: user.uid, phone: (user as any).phone || '' };
  }
  // 兜底：用 localStorage 缓存的 uid
  const cachedUid = getCachedUid();
  if (cachedUid) return { uid: cachedUid, phone: '' };
  return null;
}

export async function logout(): Promise<void> {
  await auth.signOut();
  try { localStorage.removeItem(CACHED_USER_KEY); } catch { /* ignore */ }
  console.log('[CloudBase] 已注销');
}

// ============================================================
// 日记 CRUD — userId = auth.currentUser.uid
// ============================================================

interface CloudDiary {
  _id: string;
  title: string;
  content: string;
  emotion: string;
  starPosition: [number, number, number];
  userId: string;
  createdAt: number;
}

function getUserId(): string {
  // 优先 CloudBase auth，其次 localStorage 兜底
  if (auth.currentUser?.uid) return auth.currentUser.uid;
  const cachedUid = getCachedUid();
  if (cachedUid) return cachedUid;
  throw new Error('未登录');
}

export async function fetchDiaries(): Promise<DiaryEntry[]> {
  const uid = getUserId();
  console.log('[CloudBase] fetchDiaries, uid:', uid);

  const res = await db
    .collection('diaries')
    .where({ userId: uid })
    .orderBy('createdAt', 'asc')
    .get();

  console.log('[CloudBase] fetchDiaries 返回:', res.data?.length, '条');

  const data = (res.data || []) as CloudDiary[];
  return data.map((d) => ({
    id: d._id,
    title: d.title,
    content: d.content,
    emotion: d.emotion as Emotion,
    createdAt: new Date(d.createdAt).toISOString(),
    starPosition: d.starPosition || [0, 0, 0],
  }));
}

export async function saveDiaryToCloud(
  data: Omit<DiaryEntry, 'id' | 'createdAt'>,
): Promise<string> {
  const uid = getUserId();
  console.log('[CloudBase] saveDiaryToCloud, uid:', uid, 'title:', data.title);
  const res = await db.collection('diaries').add({
    title: data.title,
    content: data.content,
    emotion: data.emotion,
    starPosition: data.starPosition,
    userId: uid,
    createdAt: Date.now(),
  });
  console.log('[CloudBase] saveDiaryToCloud 结果:', res);
  return (res as any).id as string;
}

export async function deleteDiaryFromCloud(diaryId: string): Promise<void> {
  await db.collection('diaries').doc(diaryId).remove();
}
