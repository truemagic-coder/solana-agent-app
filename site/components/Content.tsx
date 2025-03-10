/* eslint-disable no-param-reassign */
/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react/no-unused-prop-types */
/* eslint-disable react/function-component-definition */
/* eslint-disable max-len */
/* eslint-disable no-nested-ternary */
/* eslint-disable no-restricted-syntax */
/* eslint-disable consistent-return */
/* eslint-disable no-await-in-loop */
/* eslint-disable react/no-array-index-key */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/extensions */

import React, {
  useState, useEffect, useRef,
} from 'react';
import { Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkStringify from 'remark-stringify';
import rehypeRaw from 'rehype-raw';
import { useSession } from 'next-auth/react';
import WalletMultiButtonDynamic from 'components/WalletAdapter';
import { v4 } from 'uuid';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import InfiniteScroll from 'react-infinite-scroller';
import { visit } from 'unist-util-visit';
import { useChatStore } from '../utils/chatStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Import JUP CSS
import '@jup-ag/terminal/css';

// Import KaTeX CSS
import 'katex/dist/katex.min.css';

interface ChatMessage {
  id: string;
  user_message: string;
  assistant_message: string;
  timestamp: number;
}

const processedText = (content: string | undefined) => {
  if (!content) return '';
  return content
    .replace(/\\\[/g, '$$$')
    .replace(/\\\]/g, '$$$')
    .replace(/\\\(/g, '$$$')
    .replace(/\\\)/g, '$$$');
};

const remarkMathOptions = {
  singleDollarTextMath: false,
};

function usePreventZoom() {
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL as string;
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || (BASE_URL || '').replace(/^http/, 'ws');

function External() {
  usePreventZoom();
  const [message, setMessage] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const { connected, publicKey } = useWallet();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const { data: session, status } = useSession();
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const {
    chatHistory,
    fetchLoading,
    fetchData,
    addMessage,
    updateLastMessage,
    allDataFetched,
    fetchError,
    initialFetchDone,
    currentPage,
  } = useChatStore();

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // Handle WebSocket connection
  useEffect(() => {
    // Only connect when we have both publicKey and session
    if (!publicKey || !session?.user?.name || status !== 'authenticated') return;

    const connectWebSocket = () => {
      setIsConnecting(true);
      setConnectionError(null);

      // Create WebSocket with authentication token in the URL
      const wsUrl = `${WS_URL}/ws/chat?token=${encodeURIComponent(session.user?.name as string)}`;
      const newSocket = new WebSocket(wsUrl);

      newSocket.onopen = () => {
        console.log('WebSocket connected');
        setSocket(newSocket);
        setIsConnecting(false);
      };

      newSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WS message received:', data); // Debug the incoming message

          if (data.type === 'chunk') {
            // For streaming responses
            updateLastMessage(data.content || '');
          } else if (data.type === 'end') {
            // End of streaming
            setIsStreaming(false);
          } else if (data.type === 'error') {
            console.error('WebSocket error:', data.message);
            setConnectionError(data.message);
            updateLastMessage(`Error: ${data.message}`);
            setIsStreaming(false);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      newSocket.onclose = (event) => {
        console.log(`WebSocket disconnected: ${event.code} - ${event.reason}`);
        setSocket(null);
        setIsStreaming(false);
        setIsConnecting(false);

        if (event.code === 1008) {
          setConnectionError(`Authentication error: ${event.reason}`);
        }
      };

      newSocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('Connection error');
        setIsStreaming(false);
        setIsConnecting(false);
      };
    };

    connectWebSocket();

    // Cleanup function
    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [publicKey, session, status]);

  const handleScroll = () => {
    const container = chatContainerRef.current;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 200;

      // If user scrolls up during streaming, mark it
      if (isStreaming && !isAtBottom) {
        setUserScrolledUp(true);
      }

      setShouldAutoScroll(isAtBottom);
    }
  };

  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [isStreaming]);

  useEffect(() => {
    // Only auto-scroll if shouldAutoScroll is true AND not during streaming with manual scroll up
    if (shouldAutoScroll && !(isStreaming && userScrolledUp) && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory.data, shouldAutoScroll, userScrolledUp, isStreaming]);

  // Reset userScrolledUp when streaming ends
  useEffect(() => {
    if (!isStreaming) {
      setUserScrolledUp(false);
    }
  }, [isStreaming]);

  useEffect(() => {
    if (publicKey && chatHistory.data.length === 0 && session && !fetchLoading && !initialFetchDone) {
      fetchData(publicKey.toBase58(), session.user?.name as string, 1);
    }
  }, [publicKey, session, chatHistory.data.length, fetchLoading, initialFetchDone]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  };

  const handleMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If currently streaming, cancel the stream
    if (isStreaming) {
      setIsStreaming(false);
      return;
    }

    if (!message.trim() || !connected || !socket || socket.readyState !== WebSocket.OPEN) {
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        setConnectionError('Not connected to server. Please try again.');
      }
      return;
    }

    // Reset scroll state when sending a new message
    setShouldAutoScroll(true);
    setUserScrolledUp(false);

    const currentMessage = message;
    setMessage('');
    setIsStreaming(true);
    setConnectionError(null);

    const messageId = v4().toString();
    addMessage({
      id: messageId,
      user_message: currentMessage,
      assistant_message: '',
      timestamp: Math.floor(Date.now() / 1000) + 1,
    });

    try {
      // Send the message through WebSocket
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      socket.send(JSON.stringify({
        message: currentMessage,
        timezone,
      }));
    } catch (err) {
      console.error('Error sending message:', err);
      setIsStreaming(false);
      updateLastMessage('Error sending message. Please try again.');
    }
  };

  const remarkAddSpaceAfterTable = () => (tree: any) => {
    visit(tree, 'table', (node, index, parent) => {
      if (parent && index != null) {
        const after = parent.children[index + 1];
        if (!after || after.type !== 'paragraph') {
          parent.children.splice(index + 1, 0, {
            type: 'paragraph',
            children: [{ type: 'text', value: '' }],
          });
        }
      }
    });
  };

  const remarkAddSpaceBetweenColumns = () => (tree: any) => {
    visit(tree, 'table', (node) => {
      node.children.forEach((row: any) => {
        if (row.children) {
          row.children.forEach((cell: any, index: number) => {
            if (cell.children && cell.children[0] && typeof cell.children[0].value === 'string') {
              // Add non-breaking spaces
              cell.children[0].value = `\u00A0\u00A0${cell.children[0].value.trim()}`;

              // Add extra space at the end of each cell except the last one
              if (index < row.children.length - 1) {
                cell.children[0].value += '\u00A0\u00A0\u00A0\u00A0';
              }
            }
          });
        }
      });
    });
  };

  const CustomMarkdown = ({ children }: { children: string }) => (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkAddSpaceAfterTable, remarkAddSpaceBetweenColumns, remarkBreaks, remarkStringify, [remarkMath, remarkMathOptions]]}
      rehypePlugins={[rehypeRaw, rehypeKatex]}
      components={{
        p: ({ children: child }) => <p style={{ whiteSpace: 'pre-wrap', marginBottom: '1em' }}>{child}</p>,
      }}
    >
      {children}
    </ReactMarkdown>
  );

  const ChatRow = React.memo(({ item, isLast }: { item: ChatMessage; isLast: boolean }) => (
    <div className="bg-gray-800 p-4 rounded-lg mb-4 max-w-full">
      <div className="p-3 rounded-lg mb-2 bg-blue-400 break-words">
        <p className="font-bold mb-1">You</p>
        <div className="text-white prose prose-invert max-w-none overflow-wrap-anywhere">
          <CustomMarkdown>{processedText(item.user_message)}</CustomMarkdown>
        </div>
      </div>
      <div className={`p-4 rounded-lg mt-2 bg-purple-800 break-words transition-all duration-200 ${
        isLast && isStreaming ? 'min-h-[120px]' : 'min-h-[60px]'
      }`}
      >
        <p className="font-bold mb-2">Agent</p>
        <div className="text-white prose prose-invert max-w-none overflow-wrap-anywhere">
          {item.assistant_message ? (
            <CustomMarkdown>{processedText(item.assistant_message)}</CustomMarkdown>
          ) : (
            <div className="flex items-center py-2">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span>Generating response...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  ));

  const loadMoreData = () => {
    if (allDataFetched || fetchLoading) return;

    // Get the next page to fetch
    const nextPage = currentPage + 1;
    fetchData(publicKey?.toBase58() || '', session?.user?.name || '', nextPage);
  };

  const hasMore = !allDataFetched;

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col relative">
      <nav className="bg-gray-900 p-4 w-full">
        <div className="flex items-center justify-between w-full">
          <div className="ml-4">
            <Link href="https://solana-agent.com">
              <Avatar>
                <AvatarImage src="/logo.png" />
                <AvatarFallback>SA</AvatarFallback>
              </Avatar>
            </Link>
          </div>
          <div className="mr-4">
            <WalletMultiButtonDynamic />
          </div>
        </div>
      </nav>

      {/* Connection status indicator */}
      {connectionError && (
        <div className="bg-red-800 text-white px-4 py-2 text-sm text-center">
          {connectionError}
        </div>
      )}

      {socket && (
        <div className="bg-green-800 text-white px-4 py-1 text-xs text-center">
          Connected
        </div>
      )}

      {(status === 'authenticated') && (!fetchLoading && !fetchError) ? (
        <div className="flex flex-col flex-grow px-4 pb-5" style={{ height: 'calc(100vh - 150px)' }}>
          <div
            ref={chatContainerRef}
            className="flex-grow w-full bg-gray-800 p-4 rounded-lg mb-4 overflow-y-auto"
          >
            <InfiniteScroll
              loadMore={loadMoreData}
              isReverse
              hasMore={hasMore && !fetchLoading}
              initialLoad={false}
              threshold={100}
            >
              {chatHistory.data.map((item, index) => (
                <ChatRow
                  key={`${item.id}+${index}`}
                  item={item}
                  isLast={index === chatHistory.data.length - 1}
                />
              ))}
            </InfiniteScroll>
          </div>
          <form onSubmit={handleMessageSubmit} className="flex w-full">
            <Input
              type="text"
              placeholder="Ask Copilot..."
              value={message}
              onChange={handleInputChange}
              className="flex-grow bg-gray-800 text-white pl-3 placeholder:pl-1 rounded-none rounded-l-md border-none focus:outline-none focus:ring-0 focus:border-gray-800 h-12 text-sm sm:text-base"
              style={{ fontSize: '16px' }}
              disabled={fetchLoading || !socket}
            />
            <Button
              type="submit"
              className="bg-blue-400 hover:bg-blue-500 rounded-none rounded-r-md h-12 sm:px-4 text-sm sm:text-base"
              onClick={handleMessageSubmit}
              disabled={fetchLoading || isConnecting || (!message.trim() && !isStreaming) || !socket}
            >
              {isStreaming ? 'Cancel' : isConnecting ? 'Connecting...' : fetchLoading ? 'Loading...' : 'Send'}
            </Button>
          </form>
        </div>
      ) : (
        <div className="w-full px-4 my-4">
          <div className="max-w mx-auto flex flex-col items-center">
            <p className="text-center font-bold mb-5">Please connect to chat with Copilot.</p>
            <img src="/copilot.png" alt="Copilot" className="w-80% my-4" />
          </div>
        </div>
      )}
    </div>
  );
}

export default External;
