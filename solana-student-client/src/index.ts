import * as web3 from '@solana/web3.js'
import * as borsh from '@project-serum/borsh'
import * as fs from 'fs'
import dotenv from 'dotenv'
dotenv.config()

function initializeSignerKeypair(): web3.Keypair {
    if (!process.env.PRIVATE_KEY) {
        console.log('Creating .env file')
        const signer = web3.Keypair.generate()
        fs.writeFileSync('.env',`PRIVATE_KEY=[${signer.secretKey.toString()}]`)
        return signer
    }
    
    const secret = JSON.parse(process.env.PRIVATE_KEY ?? "") as number[]
    const secretKey = Uint8Array.from(secret)
    const keypairFromSecretKey = web3.Keypair.fromSecretKey(secretKey)
    return keypairFromSecretKey
}

async function airdropSolIfNeeded(signer: web3.Keypair, connection: web3.Connection) {
    const balance = await connection.getBalance(signer.publicKey)
    console.log('Current balance is', balance)
    if (balance < web3.LAMPORTS_PER_SOL) {
        console.log('Airdropping 1 SOL...')
        await connection.requestAirdrop(signer.publicKey, web3.LAMPORTS_PER_SOL)
    }
}

const studentInstructionLayout = borsh.struct([
    borsh.u8('variant'),
    borsh.str('name'),
    borsh.str('message')
])

async function sendTestStudentIntro(signer: web3.Keypair, programId: web3.PublicKey, connection: web3.Connection) {
    let buffer = Buffer.alloc(1000)
    const studentName = `Adam Smith ${Math.random() * 1000000}`
    studentInstructionLayout.encode(
        {
            variant: 0,
            name: studentName,
            message: 'YOLO!'
        },
        buffer
    )

    buffer = buffer.slice(0, studentInstructionLayout.getSpan(buffer))

    const [pda] = await web3.PublicKey.findProgramAddress(
        [signer.publicKey.toBuffer(), Buffer.from(studentName)],
        programId
    )

    console.log("PDA is:", pda.toBase58())

    const transaction = new web3.Transaction()
    
    const instruction = new web3.TransactionInstruction({
        programId: programId,
        data: buffer,
        keys: [
            {
                pubkey: signer.publicKey,
                isSigner: true,
                isWritable: false
            },
            {
                pubkey: pda,
                isSigner: false,
                isWritable: true
            },
            {
                pubkey: web3.SystemProgram.programId,
                isSigner: false,
                isWritable: false
            }
        ]
    })

    transaction.add(instruction)
    const tx = await web3.sendAndConfirmTransaction(connection, transaction, [signer])
    console.log(`https://explorer.solana.com/tx/${tx}?cluster=devnet`)
}

async function main() {
    const signer = initializeSignerKeypair()
    
    const connection = new web3.Connection(web3.clusterApiUrl('devnet'))
    await airdropSolIfNeeded(signer, connection)
    
    const studentProgramId = new web3.PublicKey('FnHUUiX2jLSaGdt6GpdawgoJYKnUxzbPG5VmRPEDr1NEekm')
    await sendTestStudentIntro(signer, studentProgramId, connection)
}

main().then(() => {
    console.log('Finished successfully')
    process.exit(0)
}).catch(error => {
    console.log(error)
    process.exit(1)
})
