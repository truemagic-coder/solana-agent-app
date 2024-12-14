/* eslint-disable max-len */
/* eslint-disable no-restricted-syntax */
import {
  Keypair,
  PublicKey,
  SystemProgram,
} from '@solana/web3.js';
import { NextApiRequest, NextApiResponse } from 'next/types';
import bs58 from 'bs58';
import { Helius } from 'helius-sdk';
import BigNumber from 'bignumber.js';

async function post(req: NextApiRequest, res: NextApiResponse) {
  try {
    // check header Authorization for secret key
    const secretKey = req.headers.authorization;
    if (secretKey !== process.env.NEXTAUTH_SECRET as string) {
      return res.status(401).send({ success: false });
    }
    const walletAddress = req.body?.address as string;
    const rawAmount = req.body?.amount as string;
    const amount = new BigNumber(rawAmount);

    const helius = new Helius(process.env.HELIUS_API_KEY as string);

    // Get the fee payer's private key from the environment variable
    const feePayerPrivateKeyString = process.env.PRIVATE_KEY as string;
    const feePayerPrivateKeyBytes = bs58.decode(feePayerPrivateKeyString);
    const feePayerKeypair = Keypair.fromSecretKey(feePayerPrivateKeyBytes);
    const feePayerPublicKey = feePayerKeypair.publicKey;

    // create transaction instruction
    const ix = SystemProgram.transfer({
      fromPubkey: feePayerPublicKey,
      toPubkey: new PublicKey(walletAddress),
      lamports: amount.multipliedBy(10 ** 9).toNumber(),
    });

    // create transaction
    await helius.rpc.sendSmartTransaction([ix], [feePayerKeypair]);
    return res.status(200).send({ success: true });
  } catch (error) {
    return res.status(500).send({ success: false });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    return post(req, res);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
