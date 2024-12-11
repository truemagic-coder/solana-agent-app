import { Header, Payload, SIWS } from '@web3auth/sign-in-with-solana';

type CreateSolanaMessage = {
  address: string;
  statement: string;
};

export type SolanaMessage = {
  message: SIWS;
  preparedMessage: string;
};

export default function createSolanaMessage({
  address,
  statement,
}: CreateSolanaMessage) : SolanaMessage {
  const header = new Header();
  header.t = 'sip99';
  const payload = new Payload();
  payload.domain = process.env.NEXT_PUBLIC_DOMAIN_URL as string;
  payload.address = address;
  payload.uri = process.env.NEXT_PUBLIC_DOMAIN_URL as string;
  payload.statement = statement;
  payload.version = '1';
  payload.chainId = 1;
  const message = new SIWS({
    header,
    payload,
  });
  // Returning the prepared message
  return {
    message,
    preparedMessage: message.prepareMessage(),
  };
}
