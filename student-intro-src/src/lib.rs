use solana_program::{
    account_info::AccountInfo, entrypoint, entrypoint::ProgramResult, msg, pubkey::Pubkey,
};
pub mod instruction;
use instruction::StudentInstruction;

entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let instruction = StudentInstruction::unpack(instruction_data)?;

    match instruction {
        StudentInstruction::AddStudentIntro { name, message } => {
            add_student_intro(program_id, accounts, name, message)
        }
    }
}

pub fn add_student_intro(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    name: String,
    message: String,
) -> ProgramResult {
    msg!("Adding Student Intro...");
    msg!("Name: {}", name);
    msg!("Message: {}", message);

    Ok(())
}
