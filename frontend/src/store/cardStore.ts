import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CardConfig, CardOrientation, AspectRatio, User, HistoryItem } from '../types';
import { CARD_CONFIG } from '../config';

interface CardStore {
  // 配置状态
  config: CardConfig;
  setOrientation: (orientation: CardOrientation) => void;
  setAspectRatio: (ratio: AspectRatio) => void;
  setShowBorder: (show: boolean) => void;
  setShowLogo: (show: boolean) => void;
  setShowQrCode: (show: boolean) => void;
  
  // 内容状态
  blessingText: string;
  setBlessingText: (text: string) => void;
  imageUrl: string | null;
  setImageUrl: (url: string | null) => void;
  organizationName: string;
  setOrganizationName: (name: string) => void;
  
  // 用户状态
  user: User | null;
  setUser: (user: User | null) => void;
  token: string | null;
  setToken: (token: string | null) => void;
  
  // 历史记录
  history: HistoryItem[];
  setHistory: (items: HistoryItem[]) => void;
  addHistoryItem: (item: HistoryItem) => void;
  removeHistoryItem: (id: number) => void;
  
  // 加载状态
  isGeneratingText: boolean;
  setIsGeneratingText: (loading: boolean) => void;
  isGeneratingImage: boolean;
  setIsGeneratingImage: (loading: boolean) => void;
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;
}

export const useCardStore = create<CardStore>()(
  persist(
    (set) => ({
      // 默认配置（从 config.ts 读取）
      config: {
        orientation: CARD_CONFIG.defaultOrientation,
        aspectRatio: CARD_CONFIG.defaultAspectRatio,
        showBorder: CARD_CONFIG.defaultShowBorder,
        showLogo: CARD_CONFIG.defaultShowLogo,
        showQrCode: CARD_CONFIG.defaultShowQrCode,
      },
      setOrientation: (orientation) =>
        set((state) => ({ config: { ...state.config, orientation } })),
      setAspectRatio: (aspectRatio) =>
        set((state) => ({ config: { ...state.config, aspectRatio } })),
      setShowBorder: (showBorder) =>
        set((state) => ({ config: { ...state.config, showBorder } })),
      setShowLogo: (showLogo) =>
        set((state) => ({ config: { ...state.config, showLogo } })),
      setShowQrCode: (showQrCode) =>
        set((state) => ({ config: { ...state.config, showQrCode } })),
      
      // 内容（从 config.ts 读取默认值）
      blessingText: CARD_CONFIG.defaultBlessingText,
      setBlessingText: (blessingText) => set({ blessingText }),
      imageUrl: null,
      setImageUrl: (imageUrl) => set({ imageUrl }),
      organizationName: CARD_CONFIG.defaultOrganizationName,
      setOrganizationName: (organizationName) => set({ organizationName }),
      
      // 用户
      user: null,
      setUser: (user) => set({ user }),
      token: null,
      setToken: (token) => set({ token }),
      
      // 历史记录
      history: [],
      setHistory: (history) => set({ history }),
      addHistoryItem: (item) =>
        set((state) => ({ history: [item, ...state.history] })),
      removeHistoryItem: (id) =>
        set((state) => ({ history: state.history.filter((h) => h.id !== id) })),
      
      // 加载状态
      isGeneratingText: false,
      setIsGeneratingText: (isGeneratingText) => set({ isGeneratingText }),
      isGeneratingImage: false,
      setIsGeneratingImage: (isGeneratingImage) => set({ isGeneratingImage }),
      isSaving: false,
      setIsSaving: (isSaving) => set({ isSaving }),
    }),
    {
      name: 'card-store',
      // 只持久化这些字段
      partialize: (state) => ({
        config: state.config,
        blessingText: state.blessingText,
        imageUrl: state.imageUrl,
        token: state.token,
      }),
    }
  )
);
