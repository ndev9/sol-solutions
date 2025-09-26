import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MyTokenProgram } from "../target/types/my_token_program";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Keypair, SystemProgram } from "@solana/web3.js";


describe("my-token-program", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);


  const program = anchor.workspace.MyTokenProgram as Program<MyTokenProgram>;


  it("Create token", async () => {
    const mint = Keypair.generate();


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
});
