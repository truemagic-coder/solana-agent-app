/* eslint-disable max-len */
/* eslint-disable no-restricted-syntax */
import {
  ComputeBudgetProgram,
  Connection,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import { NextApiRequest, NextApiResponse } from 'next/types';
import bs58 from 'bs58';
import { createJupiterApiClient } from '@jup-ag/api';
import BigNumber from 'bignumber.js';
import axios from 'axios';

async function getPriorityFeeEstimate(connection: Connection, priorityLevel: string, transaction: Transaction) {
  try {
    // Serialize the transaction to wire format
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });

    const uInt8Array = new Uint8Array(serializedTransaction);

    // Encode the serialized transaction to base58
    const base58EncodedTransaction = bs58.encode(uInt8Array);

    const response = await axios.post(
      process.env.HELIUS_RPC_URL as string,
      {
        jsonrpc: '2.0',
        id: '1',
        method: 'getPriorityFeeEstimate',
        params: [
          {
            transaction: base58EncodedTransaction,
            options: { priorityLevel },
          },
        ],
      },
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    const value = new BigNumber(response.data.result.priorityFeeEstimate).toNumber();

    return value;
  } catch (error) {
    console.error('Error in getPriorityFeeEstimate:', error);
    throw error;
  }
}

async function post(req: NextApiRequest, res: NextApiResponse) {
  try {
    // check header Authorization for secret key
    const secretKey = req.headers.authorization;
    if (secretKey !== process.env.NEXTAUTH_SECRET as string) {
      return res.status(401).send({ success: false });
    }
    // Get the fee payer's private key from the environment variable
    const feePayerPrivateKeyString = process.env.PRIVATE_KEY as string;
    const feePayerPrivateKeyBytes = bs58.decode(feePayerPrivateKeyString);
    const feePayerKeypair = Keypair.fromSecretKey(feePayerPrivateKeyBytes);

    const inputMint = req.body?.input_mint as string;
    const outputMint = req.body?.output_mint as string;
    const decimals = req.body?.input_decimals as number;
    const rawAmount = req.body?.amount as number;
    const amount = new BigNumber(rawAmount).multipliedBy(10 ** decimals).toNumber();

    const jupiterQuoteApi = createJupiterApiClient();
    const quote = await jupiterQuoteApi.quoteGet({
      inputMint,
      outputMint,
      amount,
      dynamicSlippage: true,
      asLegacyTransaction: true,
    });
    const swap = await jupiterQuoteApi.swapPost({
      swapRequest: {
        userPublicKey: feePayerKeypair.publicKey.toBase58(),
        quoteResponse: quote,
        asLegacyTransaction: true,
      },
    });

    const connection = new Connection(process.env.HELIUS_RPC_URL as string);

    const buffer = Buffer.from(swap.swapTransaction, 'base64');

    const transaction = Transaction.from(buffer);
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    transaction.sign(feePayerKeypair);

    const priorityFee = await getPriorityFeeEstimate(connection, 'VeryHigh', transaction);

    const setComputeUnitPriceIx = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: priorityFee,
    });

    transaction.add(setComputeUnitPriceIx);

    await sendAndConfirmTransaction(connection, transaction, [feePayerKeypair]);

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
