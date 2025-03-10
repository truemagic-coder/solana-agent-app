/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable import/prefer-default-export */
import { create } from 'zustand';
import axios from 'axios';

interface AgentVerified {
  success: boolean;
}

interface ChatMessage {
  id: string;
  user_message: string;
  assistant_message: string;
  timestamp: number;
}

type PaginationInfo = {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

type ChatHistory = {
  data: ChatMessage[];
} & PaginationInfo;

interface ChatStore {
  chatHistory: ChatHistory;
  allDataFetched: boolean;
  fetchLoading: boolean;
  fetchError: boolean;
  agentVerified: boolean;
  agentVerifiedLoading: boolean;
  agentVerifiedError: boolean;
  currentPage: number;
  fetchData: (userId: string, jwt: string, pageNumber: number) => Promise<void>;
  agentCheck: (userId: string, jwt: string) => Promise<void>;
  addMessage: (message: ChatMessage) => void;
  updateLastMessage: (response: string) => void;
  setFetchLoading: (loading: boolean) => void;
  setFetchError: (error: boolean) => void;
  setCurrentPage: (page: number) => void;
  initialFetchDone: boolean;
  setInitialFetchDone: (done: boolean) => void;
  loadingPages: Record<number, boolean>;
  updateMessage: (id: string, updatedMessage: Partial<ChatMessage>) => void;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL as string;

export const useChatStore = create<ChatStore>()(
  (set, get) => ({
    chatHistory: {
      data: [], total: 0, page: 1, page_size: 0, total_pages: 0,
    },
    allDataFetched: false,
    fetchLoading: false,
    fetchError: false,
    initialFetchDone: false,
    agentVerified: false,
    agentVerifiedLoading: false,
    agentVerifiedError: false,
    currentPage: 1,
    loadingPages: {},
    updateMessage: (id, updatedMessage) => set((state) => ({
      chatHistory: {
        ...state.chatHistory,
        data: state.chatHistory.data.map((msg) => (msg.id === id ? { ...msg, ...updatedMessage } : msg)),
      },
    })),
    fetchData: async (userId: string, jwt: string, pageNumber: number) => {
      // Check if this page is already being loaded
      if (get().loadingPages[pageNumber]) {
        return;
      }

      // Mark this page as loading
      set((state) => ({
        loadingPages: { ...state.loadingPages, [pageNumber]: true },
        fetchLoading: true,
        fetchError: false,
      }));

      try {
        const response = await axios.get<ChatHistory>(`${BASE_URL}/history/${userId}?page_num=${pageNumber}&page_size=10`, {
          headers: {
            Authorization: `Bearer ${jwt}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        });

        // Handle empty response
        if (response.data.data.length === 0) {
          set({
            allDataFetched: true,
            initialFetchDone: true,
            fetchLoading: false,
            loadingPages: { ...get().loadingPages, [pageNumber]: false },
          });
          return;
        }

        set((state) => {
          const newData = response.data.data;
          const existingIds = new Set(state.chatHistory.data.map((msg) => msg.id));

          // Filter out duplicates to avoid re-adding existing messages
          const uniqueNewData = newData.filter((msg) => !existingIds.has(msg.id));

          const combinedData = [...uniqueNewData, ...state.chatHistory.data];
          const sortedData = combinedData.sort((a, b) => a.timestamp - b.timestamp);

          return {
            chatHistory: {
              ...response.data,
              data: sortedData,
            },
            currentPage: pageNumber,
            allDataFetched: newData.length === 0 || pageNumber >= response.data.total_pages,
            initialFetchDone: true,
            loadingPages: { ...state.loadingPages, [pageNumber]: false },
          };
        });
      } catch (err) {
        set((state) => ({
          fetchError: true,
          loadingPages: { ...state.loadingPages, [pageNumber]: false },
        }));
        console.error(err);
      } finally {
        set((state) => ({
          fetchLoading: false,
          loadingPages: { ...state.loadingPages, [pageNumber]: false },
        }));
      }
    },
    agentCheck: async (userId: string, jwt: string) => {
      try {
        set({ agentVerifiedLoading: true, agentVerifiedError: false });
        const response = await axios.get<AgentVerified>(`${BASE_URL}/agent_check/${userId}`, {
          headers: {
            Authorization: `Bearer ${jwt}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        });
        // if not 200, throw error
        if (response.status !== 200) {
          set({ agentVerified: false, agentVerifiedLoading: false, agentVerifiedError: true });
        } else {
          set({ agentVerified: true, agentVerifiedLoading: false, agentVerifiedError: false });
        }
      } catch (err) {
        set({ agentVerified: false, agentVerifiedLoading: false, agentVerifiedError: true });
        console.error(err);
      }
    },
    // Update the addMessage function with deduplication support
    addMessage: (message: ChatMessage) => set((state) => ({
      chatHistory: {
        ...state.chatHistory,
        data: [...state.chatHistory.data, message],
      },
    })),
    updateLastMessage: (response: string) => set((state) => {
      const updatedData = [...state.chatHistory.data];
      updatedData[updatedData.length - 1].assistant_message += response;

      return {
        chatHistory: {
          ...state.chatHistory,
          data: updatedData,
        },
      };
    }),
    setFetchLoading: (loading: boolean) => set({ fetchLoading: loading }),
    setFetchError: (error: boolean) => set({ fetchError: error }),
    setCurrentPage: (page: number) => set({ currentPage: page }),
    setInitialFetchDone: (done: boolean) => set({ initialFetchDone: done }),
  }),
);
