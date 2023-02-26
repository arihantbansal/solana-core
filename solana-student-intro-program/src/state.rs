use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    program_pack::{IsInitialized, Sealed},
    pubkey::Pubkey,
};

#[derive(BorshSerialize, BorshDeserialize)]
pub struct StudentInfo {
    pub discriminator: String,
    pub is_initialized: bool,
    pub name: String,
    pub msg: String,
}

#[derive(BorshSerialize, BorshDeserialize)]
pub struct StudentIntroReply {
    pub discriminator: String,
    pub is_initialized: bool,
    pub reply_message: String,
    pub reply: Pubkey,
    pub replier: Pubkey,
}

#[derive(BorshSerialize, BorshDeserialize)]
pub struct StudentReplyCounter {
    pub discriminator: String,
    pub is_initialized: bool,
    pub counter: u64,
}

impl IsInitialized for StudentInfo {
    fn is_initialized(&self) -> bool {
        self.is_initialized
    }
}

impl IsInitialized for StudentIntroReply {
    fn is_initialized(&self) -> bool {
        self.is_initialized
    }
}

impl IsInitialized for StudentReplyCounter {
    fn is_initialized(&self) -> bool {
        self.is_initialized
    }
}

impl StudentInfo {
    pub const DISCRIMINATOR: &'static str = "info";

    pub fn get_account_size(name: String, msg: String) -> usize {
        return (4 + StudentInfo::DISCRIMINATOR.len()) + 1 + (4 + name.len()) + (4 + msg.len());
    }
}

impl StudentIntroReply {
    pub const DISCRIMINATOR: &'static str = "reply";

    pub fn get_account_size(reply_message: String) -> usize {
        return (4 + StudentIntroReply::DISCRIMINATOR.len())
            + 1
            + (4 + reply_message.len())
            + 32
            + 32;
    }
}

impl StudentReplyCounter {
    pub const DISCRIMINATOR: &'static str = "counter";

    pub const SIZE: usize = (4 + StudentReplyCounter::DISCRIMINATOR.len()) + 1 + 8;
}

impl Sealed for StudentInfo {}
impl Sealed for StudentReplyCounter {}
