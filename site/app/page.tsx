'use client';

import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { SessionProvider } from 'next-auth/react';
import Content from '../components/Content';
import '@solana/wallet-adapter-react-ui/styles.css';

function Page() {
  const network = process.env.NEXT_PUBLIC_RPC_URL as string;
  const endpoint = useMemo(() => network, [network]);

  const wallets = useMemo(
    () => [new PhantomWalletAdapter()],
    [],
  );

  return (
    <SessionProvider>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <Content />
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </SessionProvider>
  );
}

export default Page;
