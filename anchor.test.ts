import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MyTokenProgram } from "../target/types/my_token_program";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { Keypair, SystemProgram } from "@solana/web3.js";


describe("my-token-program", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.MyTokenProgram as Program<MyTokenProgram>;
  let mint: Keypair;
  let userTokenAccount: anchor.web3.PublicKey;
  let user2: Keypair;
  let user2TokenAccount: anchor.web3.PublicKey;

  beforeEach(async () => {
    mint = Keypair.generate();
    user2 = Keypair.generate();
    
    userTokenAccount = getAssociatedTokenAddressSync(
      mint.publicKey,
      provider.wallet.publicKey
    );
    
    user2TokenAccount = getAssociatedTokenAddressSync(
      mint.publicKey,
      user2.publicKey
    );
  });

  it("Create token", async () => {
    const tx = await program.methods
    .createToken()
    .accounts({
      mint: mint.publicKey,
      authority: provider.wallet.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    })
    .signers([mint])
    .rpc();

    console.log("Tx signature:", tx);
  });

  it("Create token account", async () => {
    await program.methods
      .createToken()
      .accounts({
        mint: mint.publicKey,
        authority: provider.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([mint])
      .rpc();

    const tx = await program.methods
      .createTokenAccount()
      .accounts({
        tokenAccount: userTokenAccount,
        mint: mint.publicKey,
        owner: provider.wallet.publicKey,
        payer: provider.wallet.publicKey,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    console.log("Token account created tx:", tx);
  });

  it("Mint tokens", async () => {
    await program.methods
      .createToken()
      .accounts({
        mint: mint.publicKey,
        authority: provider.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([mint])
      .rpc();

    await program.methods
      .createTokenAccount()
      .accounts({
        tokenAccount: userTokenAccount,
        mint: mint.publicKey,
        owner: provider.wallet.publicKey,
        payer: provider.wallet.publicKey,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    const mintAmount = new anchor.BN(1000000);
    const tx = await program.methods
      .mintTokens(mintAmount)
      .accounts({
        mint: mint.publicKey,
        tokenAccount: userTokenAccount,
        authority: provider.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log("Mint tokens tx:", tx);
  });

  it("Transfer tokens", async () => {
    await program.methods
      .createToken()
      .accounts({
        mint: mint.publicKey,
        authority: provider.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([mint])
      .rpc();

    await program.methods
      .createTokenAccount()
      .accounts({
        tokenAccount: userTokenAccount,
        mint: mint.publicKey,
        owner: provider.wallet.publicKey,
        payer: provider.wallet.publicKey,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    const airdropTx = await provider.connection.requestAirdrop(
      user2.publicKey,
      anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropTx);

    await program.methods
      .createTokenAccount()
      .accounts({
        tokenAccount: user2TokenAccount,
        mint: mint.publicKey,
        owner: user2.publicKey,
        payer: user2.publicKey,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([user2])
      .rpc();

    const mintAmount = new anchor.BN(1000000);
    await program.methods
      .mintTokens(mintAmount)
      .accounts({
        mint: mint.publicKey,
        tokenAccount: userTokenAccount,
        authority: provider.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const transferAmount = new anchor.BN(500000);
    const tx = await program.methods
      .transferTokens(transferAmount)
      .accounts({
        from: userTokenAccount,
        to: user2TokenAccount,
        authority: provider.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log("Transfer tokens tx:", tx);
  });
});
