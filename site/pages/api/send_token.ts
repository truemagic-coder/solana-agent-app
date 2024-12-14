/* eslint-disable max-len */
/* eslint-disable no-restricted-syntax */
import {
  Connection,
  Keypair,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, createTransferInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
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
    const mintAddress = req.body?.mint as string;
    const decimals = req.body?.decimals as number;
    const rawAmount = req.body?.amount as string;
    const amount = new BigNumber(rawAmount).multipliedBy(10 ** decimals).toNumber();

    const helius = new Helius(process.env.HELIUS_API_KEY as string);
    const connection = new Connection(process.env.HELIUS_RPC_URL as string);

    // Get the fee payer's private key from the environment variable
    const feePayerPrivateKeyString = process.env.PRIVATE_KEY as string;
    const feePayerPrivateKeyBytes = bs58.decode(feePayerPrivateKeyString);
    const feePayerKeypair = Keypair.fromSecretKey(feePayerPrivateKeyBytes);
    const feePayerPublicKey = feePayerKeypair.publicKey;

    const mint = new PublicKey(mintAddress);
    const recipient = new PublicKey(walletAddress);

    const senderATA = await getAssociatedTokenAddress(
      mint,
      feePayerPublicKey,
    );
    const recipientATA = await getAssociatedTokenAddress(
      mint,
      recipient,
    );

    const instructions: TransactionInstruction[] = [];

    // Check if recipient's ATA exists
    const recipientAccount = await connection.getAccountInfo(recipientATA);
    if (!recipientAccount) {
      // If ATA doesn't exist, add instruction to create it
      instructions.push(
        createAssociatedTokenAccountInstruction(
          feePayerPublicKey,
          recipientATA,
          recipient,
          mint,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID,
        ),
      );
    }

    // Add transfer instruction
    instructions.push(
      createTransferInstruction(
        senderATA,
        recipientATA,
        feePayerPublicKey,
        amount,
        [],
        TOKEN_PROGRAM_ID,
      ),
    );

    // create transaction
    await helius.rpc.sendSmartTransaction(instructions, [feePayerKeypair]);
    return res.status(200).send({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ success: false });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    return post(req, res);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
