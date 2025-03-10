/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { useEffect } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';

const WalletMultiButtonDynamic = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false },
);

import { useWallet } from '@solana/wallet-adapter-react';
import base58 from 'bs58';
import SignInMessage from '../utils/signInMessage';

// Default styles that can be overridden by your app
require('@solana/wallet-adapter-react-ui/styles.css');

export default function Header() {
  const wallet = useWallet();
  const { status } = useSession();

  const handleSignIn = async () => {
    if (!wallet.publicKey || !wallet.signMessage) return;

    const statement = 'Sign this message to sign-in to ArchPaid.';

    const rawMessage = SignInMessage({
      address: wallet.publicKey?.toBase58(),
      statement,
    });

    const encodedMessage = new TextEncoder().encode(rawMessage.preparedMessage);

    // have user sign message or disconnect if they decline
    try {
      const signature = await wallet.signMessage(encodedMessage);

      signIn('credentials', {
        message: JSON.stringify(rawMessage.message),
        signature: base58.encode(signature),
        redirect: false,
      });
    } catch (_) {
      wallet.disconnect();
    }
  };

  useEffect(() => {
    (async () => {
      if (wallet.connected && !wallet.connecting && status === 'unauthenticated') {
        await handleSignIn();
      } else if (!wallet.connected && !wallet.connecting && status === 'authenticated') {
        await signOut({ redirect: false });
      }
    })();
  }, [wallet, status]);

  return (
    <div>
      <WalletMultiButtonDynamic style={{ backgroundColor: '#60a5fa' }} />
    </div>
  );
}
