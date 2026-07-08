export type Emotion = 'happy' | 'sad' | 'excited' | 'calm' | 'love' | 'thoughtful';

export interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  emotion: Emotion;
  createdAt: string;
  starPosition: [number, number, number];
  photoFileIds: string[];
  photoUrls: string[];
  isBookmarked: boolean;
  date: string; // YYYY-MM-DD for date-based search
}

export interface EmotionConfig {
  label: string;
  color: string;
  emoji: string;
  glowColor: string;
}

export const EMOTION_MAP: Record<Emotion, EmotionConfig> = {
  happy:      { label: '开心', color: '#FFD700', emoji: '😊', glowColor: '#FFE55C' },
  sad:        { label: '难过', color: '#6495ED', emoji: '😢', glowColor: '#87CEFA' },
  excited:    { label: '兴奋', color: '#FF6B35', emoji: '🤩', glowColor: '#FF8C5A' },
  calm:       { label: '平静', color: '#7EC8A8', emoji: '😌', glowColor: '#A8E6CF' },
  love:       { label: '心动', color: '#FF69B4', emoji: '💕', glowColor: '#FF8EC8' },
  thoughtful: { label: '沉思', color: '#B19CD9', emoji: '🤔', glowColor: '#C9B8E8' },
};
