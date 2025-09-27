import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TokenEscrow } from "../target/types/token_escrow";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { Keypair, SystemProgram, PublicKey } from "@solana/web3.js";

describe("escrow-tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.TokenEscrow as Program<TokenEscrow>;

  const MINT = new PublicKey("2wh3YWGrErx3Yhfaffq8NXGadYyVci3NJENdbYRP3Tuh");
  let receiver: Keypair;
  let amount: anchor.BN;
  let escrowPda: PublicKey;
  let vaultPda: PublicKey;
  let senderTokenAccount: PublicKey;

  beforeEach(async () => {
    receiver = Keypair.generate();
    amount = new anchor.BN(100);

    [escrowPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("escrow"),
        provider.wallet.publicKey.toBuffer(),
        receiver.publicKey.toBuffer(),
        MINT.toBuffer(),
      ],
      program.programId
    );

    [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), escrowPda.toBuffer()],
      program.programId
    );

    senderTokenAccount = getAssociatedTokenAddressSync(
      MINT,
      provider.wallet.publicKey
    );
  });

  it("Create escrow", async () => {
    const tx = await program.methods
      .createEscrow(amount)
      .accounts({
        escrow: escrowPda,
        escrowVault: vaultPda,
        mint: MINT,
        sender: provider.wallet.publicKey,
        receiver: receiver.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    console.log("Escrow created:", tx);

    const escrowAccount = await program.account.escrowAccount.fetch(escrowPda);
    console.log("Escrow amount:", escrowAccount.amount.toString());
    console.log("Is completed:", escrowAccount.isCompleted);
  });

  it("Deposit tokens", async () => {
    await program.methods
      .createEscrow(amount)
      .accounts({
        escrow: escrowPda,
        escrowVault: vaultPda,
        mint: MINT,
        sender: provider.wallet.publicKey,
        receiver: receiver.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    const tx = await program.methods
      .depositTokens()
      .accounts({
        escrow: escrowPda,
        escrowVault: vaultPda,
        senderTokenAccount: senderTokenAccount,
        sender: provider.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log("Tokens deposited:", tx);
  });
});
