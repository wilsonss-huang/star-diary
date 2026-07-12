import cloudbase from '@cloudbase/js-sdk';
import type { DiaryEntry, Emotion, DiaryLocation } from '../types';

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

export async function updateDiaryInCloud(
  diaryId: string,
  data: Pick<DiaryEntry, 'title' | 'content' | 'emotion'>,
): Promise<void> {
  await db.collection('diaries').doc(diaryId).update({
    title: data.title,
    content: data.content,
    emotion: data.emotion,
  });
  console.log('[CloudBase] updateDiary:', diaryId);
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

/** 检查 CloudBase 是否有有效的登录会话（token 未过期） */
export function hasValidSession(): boolean {
  return !!(auth.currentUser && auth.currentUser.uid);
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
  photoFileIds?: string[];
  isBookmarked?: boolean;
  date?: string;
  location?: DiaryLocation;
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
    photoFileIds: d.photoFileIds || [],
    photoUrls: [],
    isBookmarked: d.isBookmarked || false,
    date: d.date || new Date(d.createdAt).toISOString().slice(0, 10),
    location: d.location,
  }));
}

export async function saveDiaryToCloud(
  data: Omit<DiaryEntry, 'id' | 'createdAt' | 'photoUrls'>,
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
    photoFileIds: data.photoFileIds || [],
    isBookmarked: data.isBookmarked || false,
    date: data.date || new Date().toISOString().slice(0, 10),
    location: data.location,
  });
  console.log('[CloudBase] saveDiaryToCloud 结果:', res);
  return (res as any).id as string;
}

export async function deleteDiaryFromCloud(diaryId: string, photoFileIds?: string[]): Promise<void> {
  if (photoFileIds && photoFileIds.length > 0) {
    try { await deletePhotos(photoFileIds); } catch (e) { console.error('删除照片失败:', e); }
  }
  await db.collection('diaries').doc(diaryId).remove();
}

// ============================================================
// 照片存储 API（使用新 storage.from() API）
// ============================================================

export async function uploadPhoto(file: File): Promise<string> {
  const uid = getUserId();
  const cloudPath = `photos/${uid}/${Date.now()}_${file.name}`;
  console.log('[CloudBase] 上传照片:', cloudPath);
  const { error } = await app.storage.from().upload(cloudPath, file);
  if (error) {
    console.error('[CloudBase] 上传照片失败:', error);
    throw new Error(error.message || '上传失败');
  }
  // 拼接完整 CloudBase fileID: cloud://env.bucket/path
  // getTempFileURL / deleteFile 需要 cloud:// 格式的 ID
  const fileId = `cloud://${ENV}.${ENV}/${cloudPath}`;
  console.log('[CloudBase] 上传成功, fileID:', fileId);
  return fileId;
}

interface CloudUserProfile {
  _id: string;
  userId: string;
  avatarFileId?: string;
}

/** Returns the current user's avatar file ID, if a profile has been created. */
export async function getAvatarFileId(): Promise<string | null> {
  try {
    const userId = getUserId();
    const result = await db.collection('profiles').where({ userId }).limit(1).get();
    const profile = (result.data?.[0] || null) as CloudUserProfile | null;
    return profile?.avatarFileId || null;
  } catch (error) {
    console.warn('[CloudBase] 获取头像资料失败:', error);
    return null;
  }
}

/** Uploads an avatar and records it against the signed-in user profile. */
export async function saveAvatar(file: File): Promise<string> {
  const userId = getUserId();
  const extension = file.name.split('.').pop()?.replace(/[^a-z0-9]/gi, '') || 'jpg';
  const cloudPath = `avatars/${userId}/${Date.now()}.${extension}`;
  const { error } = await app.storage.from().upload(cloudPath, file);
  if (error) throw new Error(error.message || '头像上传失败');

  const avatarFileId = `cloud://${ENV}.${ENV}/${cloudPath}`;
  const existing = await db.collection('profiles').where({ userId }).limit(1).get();
  const profile = (existing.data?.[0] || null) as CloudUserProfile | null;
  if (profile?._id) {
    await db.collection('profiles').doc(profile._id).update({ avatarFileId, updatedAt: Date.now() });
  } else {
    await db.collection('profiles').add({ userId, avatarFileId, updatedAt: Date.now() });
  }
  return avatarFileId;
}

export async function getPhotoUrls(fileIds: string[]): Promise<string[]> {
  if (fileIds.length === 0) return [];
  // 确保都是完整的 cloud:// 格式 ID
  const ids = fileIds.map(id => id.startsWith('cloud://') ? id : `cloud://${ENV}.${ENV}/${id}`);
  console.log('[CloudBase] 获取照片链接, IDs:', ids);
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { fileList } = await (app as any).getTempFileURL({ fileList: ids });
    console.log('[CloudBase] 获取链接结果:', fileList?.length, '条');
    return (fileList || []).map((f: any) => f.tempFileURL).filter(Boolean);
  } catch (e) {
    console.error('获取照片链接失败:', e);
    return [];
  }
}

export async function deletePhotos(fileIds: string[]): Promise<void> {
  if (fileIds.length === 0) return;
  const ids = fileIds.map(id => id.startsWith('cloud://') ? id : `cloud://${ENV}.${ENV}/${id}`);
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (app as any).deleteFile({ fileList: ids });
    console.log('[CloudBase] 删除照片:', ids.length, '张');
  } catch (e) {
    console.error('删除照片失败:', e);
  }
}

// ============================================================
// 收藏 API
// ============================================================

export async function updateDiaryBookmark(diaryId: string, isBookmarked: boolean): Promise<void> {
  await db.collection('diaries').doc(diaryId).update({ isBookmarked });
  console.log('[CloudBase] 更新收藏:', diaryId, isBookmarked);
}
