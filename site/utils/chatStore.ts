/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable import/prefer-default-export */
import { create } from 'zustand';
import axios from 'axios';

interface ChatMessage {
  id: string;
  message: string;
  response: string;
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
  currentPage: number;
  fetchData: (userId: string, jwt: string, pageNumber: number) => Promise<void>;
  addMessage: (message: ChatMessage) => void;
  updateLastMessage: (response: string) => void;
  setFetchLoading: (loading: boolean) => void;
  setFetchError: (error: boolean) => void;
  setCurrentPage: (page: number) => void;
  initialFetchDone: boolean;
  setInitialFetchDone: (done: boolean) => void;
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
    currentPage: 1,
    fetchData: async (userId: string, jwt: string, pageNumber: number) => {
      set({ fetchLoading: true, fetchError: false });
      try {
        const response = await axios.get<ChatHistory>(`${BASE_URL}/history/${userId}?page_num=${pageNumber}&page_size=10`, {
          headers: {
            Authorization: `Bearer ${jwt}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        });
        if (response.data.data.length === 0) {
          set({ allDataFetched: true });
          set({ initialFetchDone: true });
          set({ fetchLoading: false });
          return;
        }
        set((state) => {
          const newData = response.data.data;
          const combinedData = [...newData, ...state.chatHistory.data];
          const sortedData = combinedData.sort((a, b) => b.timestamp - a.timestamp);
          return {
            chatHistory: {
              ...response.data,
              data: sortedData,
            },
            currentPage: pageNumber,
            allDataFetched: newData.length === 0 || pageNumber >= response.data.total_pages,
          };
        });
      } catch (err) {
        set({ fetchError: true });
        console.error(err);
      } finally {
        set({ fetchLoading: false });
      }
    },
    addMessage: (message: ChatMessage) => set((state) => {
      const updatedData = [message, ...state.chatHistory.data];
      const sortedData = updatedData.sort((a, b) => b.timestamp - a.timestamp);
      return {
        chatHistory: {
          ...state.chatHistory,
          data: sortedData,
        },
      };
    }),
    updateLastMessage: (response: string) => set((state) => {
      const updatedData = [...state.chatHistory.data];
      const lastMessage = updatedData[0];
      if (lastMessage) {
        lastMessage.response = response;
      }
      return { chatHistory: { ...state.chatHistory, data: updatedData } };
    }),
    setFetchLoading: (loading: boolean) => set({ fetchLoading: loading }),
    setFetchError: (error: boolean) => set({ fetchError: error }),
    setCurrentPage: (page: number) => set({ currentPage: page }),
    setInitialFetchDone: (done: boolean) => set({ initialFetchDone: done }),
  }),
);
