use crate::instruction::IntroInstruction;
use crate::state::{StudentInfo, StudentIntroReply};
use crate::{error::StudentIntroError, state::StudentReplyCounter};
use borsh::BorshSerialize;
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    borsh::try_from_slice_unchecked,
    entrypoint::ProgramResult,
    msg,
    native_token::LAMPORTS_PER_SOL,
    program::invoke_signed,
    program_error::ProgramError,
    program_pack::IsInitialized,
    pubkey::Pubkey,
    system_instruction,
    sysvar::{rent::Rent, Sysvar},
};
use spl_associated_token_account::get_associated_token_address;
use spl_token::{
    instruction::{initialize_mint, mint_to},
    ID as TOKEN_PROGRAM_ID,
};
use std::convert::TryInto;

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let instruction = IntroInstruction::unpack(instruction_data)?;
    match instruction {
        IntroInstruction::InitUserInput { name, message } => {
            add_student_intro(program_id, accounts, name, message)
        }
        IntroInstruction::UpdateStudentIntro { name, message } => {
            update_student_intro(program_id, accounts, name, message)
        }
        IntroInstruction::AddReply { reply } => add_reply(program_id, accounts, reply),
        IntroInstruction::InitializeMint => initialize_token_mint(program_id, accounts),
    }
}

pub fn add_student_intro(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    name: String,
    message: String,
) -> ProgramResult {
    msg!("Adding student intro...");
    msg!("Name: {}", name);
    msg!("Message: {}", message);

    let account_info_iter = &mut accounts.iter();

    let initializer = next_account_info(account_info_iter)?;
    let user_account = next_account_info(account_info_iter)?;
    let pda_counter = next_account_info(account_info_iter)?;
    let token_mint = next_account_info(account_info_iter)?;
    let mint_auth = next_account_info(account_info_iter)?;
    let user_ata = next_account_info(account_info_iter)?;
    let system_program = next_account_info(account_info_iter)?;
    let token_program = next_account_info(account_info_iter)?;

    let (pda, bump_seed) = Pubkey::find_program_address(&[initializer.key.as_ref()], program_id);
    if pda != *user_account.key {
        msg!("Invalid seeds for PDA");
        return Err(StudentIntroError::InvalidPDA.into());
    }

    let (counter_pda, _counter_bump_seed) =
        Pubkey::find_program_address(&[pda.as_ref(), "reply".as_ref()], program_id);

    if counter_pda != *pda_counter.key {
        msg!("Invalid seeds for counter PDA");
        return Err(StudentIntroError::InvalidPDA.into());
    }

    msg!("Deriving mint authority");
    let (mint_pda, _mint_bump) = Pubkey::find_program_address(&[b"token_mint"], program_id);
    let (mint_auth_pda, mint_auth_bump) =
        Pubkey::find_program_address(&[b"token_auth"], program_id);

    if *token_mint.key != mint_pda {
        msg!("Incorrect token mint");
        return Err(StudentIntroError::IncorrectAccountError.into());
    }

    if *mint_auth.key != mint_auth_pda {
        msg!("Mint passed in and mint derived do not match");
        return Err(StudentIntroError::InvalidPDA.into());
    }

    if *user_ata.key != get_associated_token_address(initializer.key, token_mint.key) {
        msg!("Incorrect token mint");
        return Err(StudentIntroError::IncorrectAccountError.into());
    }

    if *token_program.key != TOKEN_PROGRAM_ID {
        msg!("Incorrect token program");
        return Err(StudentIntroError::IncorrectAccountError.into());
    }

    let account_len: usize = 1000;

    if StudentInfo::get_account_size(name.clone(), message.clone()) > 1000 {
        msg!("Data length is larger than 1000 bytes");
        return Err(StudentIntroError::InvalidDataLength.into());
    }

    let rent = Rent::get()?;
    let rent_lamports = rent.minimum_balance(account_len);

    invoke_signed(
        &system_instruction::create_account(
            initializer.key,
            user_account.key,
            rent_lamports,
            account_len.try_into().unwrap(),
            program_id,
        ),
        &[
            initializer.clone(),
            user_account.clone(),
            system_program.clone(),
        ],
        &[&[initializer.key.as_ref(), &[bump_seed]]],
    )?;

    msg!("PDA created: {}", pda);

    msg!("Unpacking state account...");
    let mut account_data =
        try_from_slice_unchecked::<StudentInfo>(&user_account.data.borrow()).unwrap();
    msg!("Borrowed account data successfully.");

    msg!("Checking if account is already initialized...");
    if account_data.is_initialized() {
        msg!("Account already initialized");
        return Err(ProgramError::AccountAlreadyInitialized);
    }

    account_data.discriminator = StudentInfo::DISCRIMINATOR.to_string();
    account_data.name = name;
    account_data.msg = message;
    account_data.is_initialized = true;

    msg!("Serializing account...");
    account_data.serialize(&mut &mut user_account.data.borrow_mut()[..])?;
    msg!("State Account serialized.");

    msg!("Creating counter account...");
    let rent = Rent::get()?;
    let counter_rent_lamports = rent.minimum_balance(StudentReplyCounter::SIZE);

    let (counter, counter_bump) =
        Pubkey::find_program_address(&[pda.as_ref(), "reply".as_ref()], program_id);

    if counter != *pda_counter.key {
        msg!("Invalid seeds for counter PDA");
        return Err(StudentIntroError::InvalidPDA.into());
    }

    invoke_signed(
        &system_instruction::create_account(
            initializer.key,
            pda_counter.key,
            counter_rent_lamports,
            StudentReplyCounter::SIZE.try_into().unwrap(),
            program_id,
        ),
        &[
            initializer.clone(),
            pda_counter.clone(),
            system_program.clone(),
        ],
        &[&[pda.as_ref(), "reply".as_ref(), &[counter_bump]]],
    )?;
    msg!("Reply counter created.");

    let mut counter_data =
        try_from_slice_unchecked::<StudentReplyCounter>(&pda_counter.data.borrow()).unwrap();

    msg!("Checking is counter is already initialized");
    if counter_data.is_initialized() {
        msg!("Account already initialized");
        return Err(ProgramError::AccountAlreadyInitialized);
    }

    counter_data.discriminator = StudentReplyCounter::DISCRIMINATOR.to_string();
    counter_data.counter = 0;
    counter_data.is_initialized = true;

    msg!("Counter current count: {}", counter_data.counter);

    counter_data.serialize(&mut &mut pda_counter.data.borrow_mut()[..])?;

    msg!("Reply counter initialized.");

    msg!("Minting 10 tokens to user's ATA");

    invoke_signed(
        &spl_token::instruction::mint_to(
            token_program.key,
            token_mint.key,
            user_ata.key,
            mint_auth.key,
            &[],
            10 * LAMPORTS_PER_SOL,
        )?,
        &[token_mint.clone(), user_ata.clone(), mint_auth.clone()],
        &[&[b"token_auth", &[mint_auth_bump]]],
    )?;

    Ok(())
}

pub fn update_student_intro(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    name: String,
    message: String,
) -> ProgramResult {
    msg!("Updating student intro...");
    msg!("Name: {}", name);
    msg!("Message: {}", message);
    let account_info_iter = &mut accounts.iter();

    let initializer = next_account_info(account_info_iter)?;
    let user_account = next_account_info(account_info_iter)?;

    msg!("unpacking state account");
    let mut account_data =
        try_from_slice_unchecked::<StudentInfo>(&user_account.data.borrow()).unwrap();
    msg!("borrowed account data");

    msg!("checking if account is initialized");
    if !account_data.is_initialized() {
        msg!("Account is not initialized");
        return Err(StudentIntroError::UninitializedAccount.into());
    }

    if user_account.owner != program_id {
        return Err(ProgramError::IllegalOwner);
    }

    let (pda, _bump_seed) = Pubkey::find_program_address(&[initializer.key.as_ref()], program_id);
    if pda != *user_account.key {
        msg!("Invalid seeds for PDA");
        return Err(StudentIntroError::InvalidPDA.into());
    }
    let update_len: usize = 1 + (4 + account_data.name.len()) + (4 + message.len());
    if update_len > 1000 {
        msg!("Data length is larger than 1000 bytes");
        return Err(StudentIntroError::InvalidDataLength.into());
    }

    account_data.name = account_data.name;
    account_data.msg = message;
    msg!("serializing account");
    account_data.serialize(&mut &mut user_account.data.borrow_mut()[..])?;
    msg!("state account serialized");

    Ok(())
}

pub fn add_reply(program_id: &Pubkey, accounts: &[AccountInfo], reply: String) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();

    let replier = next_account_info(account_info_iter)?;
    let pda_intro = next_account_info(account_info_iter)?;
    let pda_counter = next_account_info(account_info_iter)?;
    let pda_reply = next_account_info(account_info_iter)?;
    let token_mint = next_account_info(account_info_iter)?;
    let mint_auth = next_account_info(account_info_iter)?;
    let user_ata = next_account_info(account_info_iter)?;
    let system_program = next_account_info(account_info_iter)?;
    let token_program = next_account_info(account_info_iter)?;

    let mut counter_data =
        try_from_slice_unchecked::<StudentReplyCounter>(&pda_counter.data.borrow()).unwrap();

    msg!("Deriving mint authority");
    let (mint_pda, _mint_bump) = Pubkey::find_program_address(&[b"token_mint"], program_id);
    let (mint_auth_pda, mint_auth_bump) =
        Pubkey::find_program_address(&[b"token_auth"], program_id);

    if *token_mint.key != mint_pda {
        msg!("Incorrect token mint");
        return Err(StudentIntroError::IncorrectAccountError.into());
    }

    if *mint_auth.key != mint_auth_pda {
        msg!("Mint passed in and mint derived do not match");
        return Err(StudentIntroError::InvalidPDA.into());
    }

    if *user_ata.key != get_associated_token_address(replier.key, token_mint.key) {
        msg!("Incorrect token mint");
        return Err(StudentIntroError::IncorrectAccountError.into());
    }

    if *token_program.key != TOKEN_PROGRAM_ID {
        msg!("Incorrect token program");
        return Err(StudentIntroError::IncorrectAccountError.into());
    }

    let account_len = StudentIntroReply::get_account_size(reply.clone());

    let rent = Rent::get()?;
    let rent_lamports = rent.minimum_balance(account_len);

    let (pda, bump_seed) = Pubkey::find_program_address(
        &[
            pda_intro.key.as_ref(),
            counter_data.counter.to_be_bytes().as_ref(),
        ],
        program_id,
    );

    if pda != *pda_counter.key {
        msg!("Invalid seeds for PDA");
        return Err(StudentIntroError::InvalidPDA.into());
    }

    invoke_signed(
        &system_instruction::create_account(
            replier.key,
            pda_reply.key,
            rent_lamports,
            account_len.try_into().unwrap(),
            program_id,
        ),
        &[replier.clone(), pda_reply.clone(), system_program.clone()],
        &[&[
            pda_intro.key.as_ref(),
            counter_data.counter.to_be_bytes().as_ref(),
            &[bump_seed],
        ]],
    )?;

    msg!("Created reply account.");

    let mut reply_data =
        try_from_slice_unchecked::<StudentIntroReply>(&pda_reply.data.borrow()).unwrap();

    msg!("Checking if reply account is alreadt initialized...");
    if reply_data.is_initialized() {
        msg!("Account already initialized");
        return Err(ProgramError::AccountAlreadyInitialized);
    }

    reply_data.discriminator = StudentIntroReply::DISCRIMINATOR.to_string();
    reply_data.reply = *pda_reply.key;
    reply_data.replier = *replier.key;
    reply_data.reply_message = reply;
    reply_data.is_initialized = true;

    reply_data.serialize(&mut &mut pda_reply.data.borrow_mut()[..])?;

    counter_data.counter += 1;
    msg!("Counter: {}", counter_data.counter);

    counter_data.serialize(&mut &mut pda_counter.data.borrow_mut()[..])?;

    msg!("Minting 5 tokens to user's ATA");

    invoke_signed(
        &spl_token::instruction::mint_to(
            token_program.key,
            token_mint.key,
            user_ata.key,
            mint_auth.key,
            &[],
            5 * LAMPORTS_PER_SOL,
        )?,
        &[token_mint.clone(), user_ata.clone(), mint_auth.clone()],
        &[&[b"token_auth", &[mint_auth_bump]]],
    )?;

    Ok(())
}

pub fn initialize_token_mint(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();

    let initializer = next_account_info(account_info_iter)?;
    let token_mint = next_account_info(account_info_iter)?;
    let mint_auth = next_account_info(account_info_iter)?;
    let system_program = next_account_info(account_info_iter)?;
    let token_program = next_account_info(account_info_iter)?;
    let sysvar_rent = next_account_info(account_info_iter)?;

    let (mint_pda, mint_bump_seed) = Pubkey::find_program_address(&[b"token_mint"], program_id);
    let (mint_auth_pda, mint_auth_bump_seed) =
        Pubkey::find_program_address(&[b"token_auth"], program_id);

    msg!("Token Mint: {:?}", mint_pda);
    msg!("Mint Authority: {:?}", mint_auth);

    if mint_pda != *token_mint.key {
        msg!("Incorrent token mint");
        return Err(StudentIntroError::IncorrectAccountError.into());
    }

    if *token_program.key != TOKEN_PROGRAM_ID {
        msg!("Incorrect token program");
        return Err(StudentIntroError::IncorrectAccountError.into());
    }

    if *mint_auth.key != mint_auth_pda {
        msg!("Incorrect mint auth account");
        return Err(StudentIntroError::IncorrectAccountError.into());
    }

    let rent = Rent::get()?;
    let rent_lamports = rent.minimum_balance(82);

    invoke_signed(
        &system_instruction::create_account(
            initializer.key,
            token_mint.key,
            rent_lamports,
            82,
            token_program.key,
        ),
        &[
            initializer.clone(),
            token_mint.clone(),
            system_program.clone(),
        ],
        &[&[b"token_mint", &[mint_bump_seed]]],
    )?;

    msg!("Token mint account created.");

    // invoke_signed(
    //     &initialize_mint(
    //         token_program.key,
    //         token_mint.key,
    //         mint_auth.key,
    //         Option::None,
    //         9,
    //     )?,
    //     &[token_mint.clone(), sysvar_rent.clone(), mint_auth.clone()],
    //     &[&[b"token_mint", &[mint_bump_seed]]],
    // )?;

    // msg!("Initialized token mint");

    Ok(())
}
