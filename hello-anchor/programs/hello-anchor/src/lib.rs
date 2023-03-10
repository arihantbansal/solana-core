use anchor_lang::prelude::*;

declare_id!("4Ru1doMwFsUKQad1qMhr3cSPXipRs1jxyfKgAX15qbzX");

#[program]
pub mod hello_anchor {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
