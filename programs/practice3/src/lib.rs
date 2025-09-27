use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("54snxCn8G2MTUpi9hPo7JAKgGvq1yCRccmQHVpH7xkZu");

#[program]
pub mod token_escrow {
    use super::*;

    pub fn create_escrow(ctx: Context<CreateEscrow>, amount: u64) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;

        escrow.sender = ctx.accounts.sender.key();
        escrow.receiver = ctx.accounts.receiver.key();
        escrow.mint = ctx.accounts.mint.key();
        escrow.amount = amount;
        escrow.is_completed = false;

        Ok(())
    }

    pub fn deposit_tokens(ctx: Context<DepositTokens>) -> Result<()> {
        let escrow = &ctx.accounts.escrow;

        require!(!escrow.is_completed, EscrowError::AlreadyCompleted);

        let cpi_accounts = Transfer {
            from: ctx.accounts.sender_token_account.to_account_info(),
            to: ctx.accounts.escrow_vault.to_account_info(),
            authority: ctx.accounts.sender.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
        token::transfer(cpi_ctx, escrow.amount)?;

        msg!("Deposited {} tokens to escrow", escrow.amount);
        Ok(())
    }
}

#[account]
pub struct EscrowAccount {
    pub sender: Pubkey,
    pub receiver: Pubkey,
    pub mint: Pubkey,
    pub amount: u64,
    pub is_completed: bool,
}

#[derive(Accounts)]
pub struct CreateEscrow<'info> {
    #[account(
        init,
        payer = sender,
        space = 8 + 32 + 32 + 32 + 8 + 1,
        seeds = [b"escrow", sender.key().as_ref(), receiver.key().as_ref(), mint.key().as_ref()],
        bump
    )]
    pub escrow: Account<'info, EscrowAccount>,
    #[account(
        init,
        payer = sender,
        token::mint = mint,
        token::authority = escrow,
        seeds = [b"vault", escrow.key().as_ref()],
        bump
    )]
    pub escrow_vault: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub sender: Signer<'info>,

    pub receiver: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct DepositTokens<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow.sender.as_ref(), escrow.receiver.as_ref(), escrow.mint.as_ref()],
        bump
    )]
    pub escrow: Account<'info, EscrowAccount>,
    #[account(
        mut,
        token::mint = escrow.mint,
        token::authority = escrow
    )]
    pub escrow_vault: Account<'info, TokenAccount>,
    #[account(
        mut,
        token::mint = escrow.mint,
        token::authority = sender
    )]
    pub sender_token_account: Account<'info, TokenAccount>,
    #[account(mut, constraint = sender.key() == escrow.sender)]
    pub sender: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[error_code]
pub enum EscrowError {
    #[msg("Escrow already completed")]
    AlreadyCompleted,
}
