import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TokenEscrow } from "../target/types/token_escrow";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Keypair, SystemProgram, PublicKey } from "@solana/web3.js";

describe("escrow-tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.TokenEscrow as Program<TokenEscrow>;
  
  it("Create escrow", async () => {
    const MINT = new PublicKey("2wh3YWGrErx3Yhfaffq8NXGadYyVci3NJENdbYRP3Tuh");
    const receiver = Keypair.generate();
    const amount = new anchor.BN(100);
    
    const [escrowPda] = PublicKey.findProgramAddressSync([
      Buffer.from("escrow"),
      provider.wallet.publicKey.toBuffer(),
      receiver.publicKey.toBuffer(),
      MINT.toBuffer(),
    ], program.programId);

    const [vaultPda] = PublicKey.findProgramAddressSync([
      Buffer.from("vault"),
      escrowPda.toBuffer(),
    ], program.programId);

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
  });
});
